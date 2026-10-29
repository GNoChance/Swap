// End-to-end checks of the passport (#/aventures), in headless Chrome, on two phones and a PC. Needs the site running
// (`node tests/e2e/serve.mjs`, port 5173), then `node tests/e2e/aventures.mjs` (ONLY=PC: a single screen; SHOTS=<folder>
// keeps a screenshot of page 0 and of a page of stamps per screen).
// Stops at the first failure (exit code 1). A check also fails if the page logged an error.
import { join } from "node:path";
import { launch } from "./cdp.mjs";
import { check as checker } from "./check.mjs";
import { AVENTURES } from "../../js/aventures/data.js";

const BASE = process.env.BASE || "http://localhost:5173/";
const SHOTS = process.env.SHOTS;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VIEWPORTS = [
  { name: "iPhone 393 × 852", width: 393, height: 852, mobile: true },
  { name: "petit iPhone 375 × 667", width: 375, height: 667, mobile: true },
  { name: "PC 1440 × 900", width: 1440, height: 900, mobile: false },
];
const KEY = "swap-cyrielle:aventures";
const ids = AVENTURES.map((a) => a.id);

const book = `document.querySelector(".pp-book")`;
const opened = `${book}?.dataset.open === "true"`;
const onPage = (n) => `${book}?.dataset.page === "${n}"`;

async function suite(page, vp) {
  const check = checker(page);
  const shown = () => page.eval(`Number(${book}.dataset.page)`);
  const saved = () => page.eval(`JSON.parse(localStorage.getItem("${KEY}"))`);
  /** A tap or a swipe that must not move the book (a bound). */
  async function stays(n, gesture) {
    await gesture();
    await sleep(900);
    if ((await shown()) !== n) throw new Error(`page ${await shown()} au lieu de ${n}`);
  }
  const shot = async (name) => SHOTS && page.screenshot(join(SHOTS, `${name}-${vp.width}x${vp.height}.png`));

  await check("?demo#/aventures : le passeport arrive et s'ouvre en moins de 4 s, avec ses 15 tampons chargés", async () => {
    await page.goto(`${BASE}?demo#/aventures`);
    await page.waitFor(`document.querySelector(".screen-aventures.screen-passport") && document.querySelector(".world-back")`, 4000);
    await page.waitFor(opened, 4000);
    const count = await page.eval(`document.querySelectorAll(".pp-stamp").length`);
    if (count !== 15) throw new Error(`${count} tampons`);
    await page.waitFor(`[...document.querySelectorAll(".pp-stamp")].every((img) => img.complete && img.naturalWidth > 0)`, 5000);
    await page.waitFor(onPage(0), 2000);
    await sleep(600);
    await shot("identity");
  });

  await check("‹ › et le glisser tournent les pages une à une", async () => {
    await page.tap(".pp-next");
    await page.waitFor(onPage(1), 2000);
    await page.swipe(".pp-book", -150); // the finger to the left: the next page
    await page.waitFor(onPage(2), 2000);
    await page.swipe(".pp-book", 150); // to the right: back
    await page.waitFor(onPage(1), 2000);
    await sleep(400);
    await shot("stamps");
  });

  await check("les bornes : rien avant la page 0, rien après la page 9", async () => {
    await page.tap(".pp-prev");
    await page.waitFor(onPage(0), 2000);
    await stays(0, () => page.tap(".pp-prev"));
    await stays(0, () => page.swipe(".pp-book", 150));
    for (let n = 1; n <= 9; n++) {
      await page.tap(".pp-next");
      await page.waitFor(onPage(n), 2000);
    }
    await stays(9, () => page.tap(".pp-next"));
    await stays(9, () => page.swipe(".pp-book", -150));
  });

  await check("le passeport tient dans l'écran, sans défilement", async () => {
    const fit = await page.eval(`(() => {
      const book = document.querySelector(".pp-book").getBoundingClientRect();
      const next = document.querySelector(".pp-next").getBoundingClientRect();
      const doc = document.documentElement;
      return { book: book.bottom, next: next.bottom, h: innerHeight, scroll: doc.scrollHeight > innerHeight || doc.scrollWidth > innerWidth };
    })()`);
    if (fit.book > fit.h) throw new Error(`bas du livre à ${fit.book} px, écran de ${fit.h} px`);
    if (fit.next > fit.h) throw new Error(`bas des boutons à ${fit.next} px, écran de ${fit.h} px`);
    if (fit.scroll) throw new Error("la page défile");
  });

  await check("profil neuf : Premier bivouac à vivre, le canoë verrouillé sans son nom ; ouvert et retenu sur sa page", async () => {
    await page.goto(`${BASE}?reset#/aventures`);
    await page.waitFor(`document.querySelector('.pp-slot[data-id="bivouac-1"]')`, 4000);
    if (!(await page.eval(`Boolean(document.querySelector('.pp-slot[data-id="bivouac-1"][data-status="open"]'))`))) throw new Error("bivouac-1 n'est pas à vivre");
    if (!(await page.eval(`Boolean(document.querySelector('.pp-slot[data-id="canoe"][data-status="locked"]'))`))) throw new Error("canoe n'est pas verrouillé");
    const names = await page.eval(`document.querySelectorAll('.pp-slot[data-status="locked"] .pp-slot-name').length`);
    if (names !== 0) throw new Error(`${names} noms dans des emplacements verrouillés`);
    await page.waitFor(`${opened} && ${onPage(1)}`, 6000);
    await page.waitFor(`JSON.parse(localStorage.getItem("${KEY}"))?.page === 1`, 2000);
  });

  await check("une page enregistrée trop loin (42) s'ouvre sur la dernière", async () => {
    const all = JSON.stringify({ stamped: ids, pending: [], welcomed: true, known: ids, page: 42 });
    await page.eval(`localStorage.setItem("${KEY}", ${JSON.stringify(all)})`);
    await page.reload();
    await page.waitFor(`${opened} && ${onPage(9)}`, 20000); // the arrival, then 9 leaves of 0.45 s
    if ((await saved()).page !== 9) throw new Error(`page enregistrée : ${(await saved()).page}`);
  });
}

for (const vp of VIEWPORTS.filter((v) => !process.env.ONLY || v.name.includes(process.env.ONLY))) {
  console.log(`— ${vp.name}`);
  const page = await launch(vp);
  await suite(page, vp);
  await page.close();
}
console.log("Tout est bon.");
