// End-to-end checks of the outings' own intros (js/aventures/intros/), in headless Chrome, on two phones (the first one
// also turned sideways) and two PCs: the Premier bivouac's closing poster, its framing, its scenario file missing,
// ?demo&t=. Needs the site running (`node tests/e2e/serve.mjs`, port 5173), then `node tests/e2e/intros.mjs`
// (ONLY=1920: a single screen). Stops at the first failure (exit code 1). A check also fails if the page logged an error.
import { launch } from "./cdp.mjs";
import { check as checker } from "./check.mjs";

const BASE = process.env.BASE || "http://localhost:5173/";
const VIEWPORTS = [
  { name: "iPhone 393 × 852 (puis tourné en 852 × 393)", width: 393, height: 852, mobile: true, turned: true },
  { name: "petit iPhone 375 × 667", width: 375, height: 667, mobile: true },
  { name: "PC 1440 × 900", width: 1440, height: 900, mobile: false, wide: true },
  { name: "PC 1920 × 1080", width: 1920, height: 1080, mobile: false, wide: true },
];
const TITLE = "LACS D'AYOUS";
const LINE = "Premier bivouac · 17–18 mai 2025";
const PROVISIONAL = 4500; // ms, the provisional intro
const BIVOUAC = `${BASE}?demo#/aventures/bivouac-1`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const length = `Number(document.querySelector(".screen-intro")?.dataset.length)`; // ms, as the intro says
const atPassport = `location.hash === "#/aventures" && document.querySelector(".screen-passport")`;
// the poster in place: its line and every letter of its title fully shown
const built = `(() => {
  const parts = [...document.querySelectorAll(".af-title .af-letter, .af-line")];
  return parts.length > 1 && parts.every((el) => getComputedStyle(el).opacity === "1");
})()`;
// the boxes (px) of the poster's frame, title and line, and of each letter, with the screen's size
const posterBoxes = `(() => {
  const box = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
  return {
    screen: { width: innerWidth, height: innerHeight },
    title: document.querySelector(".af-title")?.textContent,
    line: document.querySelector(".af-line")?.textContent,
    boxes: [".af-frame", ".af-title", ".af-line", ".af-title .af-letter"].flatMap((s) => [...document.querySelectorAll(s)].map((el) => ({ what: s, ...box(el) }))),
  };
})()`;

/** Every box entirely inside the screen (half a px of rounding allowed). */
function inside({ screen, boxes }, where) {
  const out = boxes.filter((b) => b.left < -0.5 || b.top < -0.5 || b.right > screen.width + 0.5 || b.bottom > screen.height + 0.5);
  if (!boxes.length) throw new Error(`${where} : pas de cadre ni de lettrage`);
  if (out.length) throw new Error(`${where} : hors de l'écran ${JSON.stringify(out.slice(0, 3).map((b) => ({ ...b, left: Math.round(b.left), top: Math.round(b.top), right: Math.round(b.right), bottom: Math.round(b.bottom) })))}`);
}

async function suite(page, vp) {
  const check = checker(page);

  /** The bivouac's intro played through: its poster says the lieu, then the stamp's name and dates, all of it on
   *  screen; then the passport. */
  async function poster(where) {
    await page.goto(BIVOUAC);
    await page.waitFor(`document.querySelector(".screen-intro .st-stage") && ${length} > 0`, 6000);
    const ms = await page.eval(length);
    await page.waitFor(built, ms + 4000);
    const seen = await page.eval(posterBoxes);
    if (seen.title !== TITLE) throw new Error(`${where} : titre « ${seen.title} »`);
    if (seen.line !== LINE) throw new Error(`${where} : ligne « ${seen.line} »`);
    inside(seen, where);
    await page.waitFor(atPassport, 5000);
  }

  await check(`?demo#/aventures/bivouac-1 : la vue du lac, puis l'affiche dit exactement « ${TITLE} » et « ${LINE} », son cadre et son lettrage entièrement dans l'écran ; puis le passeport`, async () => {
    await poster(`${vp.width} × ${vp.height}`);
  });

  if (vp.turned)
    await check("852 × 393 (le téléphone tourné) : la scène cadrée sur la bande d'action, puis l'affiche entière dans la hauteur, son lettrage dans l'écran ; puis le passeport", async () => {
      await page.resize(852, 393);
      try {
        await page.goto(`${BASE}?demo&t=0.5#/aventures/bivouac-1`);
        await page.waitFor(`innerWidth === 852 && document.querySelector(".st-world")`, 6000);
        await sleep(300);
        // the band y 250 to 730 fills the height: the world's 760 units are 760 × 393 / 480 px high, its top above the screen
        const world = await page.eval(`(() => { const r = document.querySelector(".st-world").getBoundingClientRect(); return { top: r.top, height: r.height }; })()`);
        if (Math.abs(world.height - (760 * 393) / 480) > 1 || Math.abs(world.top + (250 * 393) / 480) > 1) throw new Error(`cadrage ${JSON.stringify(world)}`);
        await poster("852 × 393");
      } finally {
        await page.resize(vp.width, vp.height);
      }
    });

  if (vp.wide)
    await check(`${vp.width} × ${vp.height} (point 3) : à trois instants de l'intro (?t=), chaque couche couvre toute la largeur de l'écran`, async () => {
      for (const t of [0.5, 2.2, 4.4]) {
        await page.goto(`${BASE}?demo&t=${t}#/aventures/bivouac-1`);
        await page.waitFor(`document.querySelectorAll(".st-layer").length > 0 && ${length} > 0`, 6000);
        await sleep(400);
        const seen = await page.eval(`(() => [...document.querySelectorAll(".st-layer")].map((el) => {
          const r = el.getBoundingClientRect();
          return { name: el.dataset.layer, left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        }))()`);
        const bare = seen.filter((l) => l.left > 0 || l.right < vp.width);
        if (bare.length) throw new Error(`à ${t} s : bord vide ${JSON.stringify(bare.map((l) => ({ ...l, left: Math.round(l.left), right: Math.round(l.right) })))}`);
        const sky = seen.find((l) => l.name === "ciel");
        if (!sky || sky.top > 0.5 || sky.bottom < vp.height - 0.5) throw new Error(`à ${t} s : le ciel ne couvre pas la hauteur ${JSON.stringify(sky)}`);
      }
    });

  // Chrome logs nothing for a file the bench blocks (a real 404 logs the network's failure): at most that one error
  await check("point 4 : le fichier du scénario bloqué (intros/bivouac-1.js), l'intro provisoire joue (4500 ms) ; aucune autre erreur que celle du fichier bloqué", async () => {
    const before = page.errors.length;
    await page.block(["*/intros/bivouac-1.js"]);
    try {
      await page.goto(BIVOUAC);
      await page.waitFor(`${length} > 0`, 6000);
      const now = await page.eval(`({ length: ${length}, stage: Boolean(document.querySelector(".st-stage")), sign: Boolean(document.querySelector(".in-sign")),
        asked: performance.getEntriesByType("resource").some((e) => e.name.endsWith("/intros/bivouac-1.js")) })`);
      if (!now.asked) throw new Error("le fichier du scénario n'a pas été demandé");
      if (now.length !== PROVISIONAL || now.stage || !now.sign) throw new Error(`pas l'intro provisoire : ${JSON.stringify(now)}`);
      await sleep(1500);
    } finally {
      await page.block([]);
    }
    const errors = page.errors.slice(before);
    if (errors.length > 1 || errors.some((e) => !e.includes("intros/bivouac-1.js"))) throw new Error(`erreurs : ${JSON.stringify(errors)}`);
  }, { allowErrors: true });

  await check("?demo&t=99 (après la fin de l'intro) : retour au passeport, sans rester figé sur la dernière image", async () => {
    await page.goto(`${BASE}?demo&t=99#/aventures/bivouac-1`);
    await page.waitFor(atPassport, 5000);
  });

  await check("?t=99 sans ?demo : ignoré, l'intro part du début (première fois : toujours là 1,5 s plus tard, son affiche pas encore là)", async () => {
    await page.goto(`${BASE}?t=99#/aventures/bivouac-1`);
    await page.waitFor(`document.querySelector(".screen-intro .st-stage") && ${length} > 0`, 6000);
    await sleep(1500);
    const now = await page.eval(`({ hash: location.hash, intro: Boolean(document.querySelector(".screen-intro")), poster: ${built} })`);
    if (now.hash !== "#/aventures/bivouac-1" || !now.intro || now.poster) throw new Error(`?t=99 suivi hors démo : ${JSON.stringify(now)}`);
    // leave it unfinished, nothing saved: the next checks start from a fresh profile
    await page.goto("about:blank");
    await page.goto(`${BASE}?demo#/aventures`);
    await page.eval(`localStorage.clear()`);
  });
}

for (const vp of VIEWPORTS.filter((v) => !process.env.ONLY || v.name.includes(process.env.ONLY))) {
  console.log(`— ${vp.name}`);
  const page = await launch(vp);
  await suite(page, vp);
  await page.close();
}
console.log("Tout est bon.");
