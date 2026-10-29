// End-to-end checks of the portal, in headless Chrome, on two phones and a PC. Needs the site running:
// `npm run dev` (port 5173), then `node tests/e2e/hub.mjs` (SHOTS=<folder> keeps a screenshot of the hub per screen).
// Stops at the first failure (exit code 1). A check also fails if the page logged an error.
import { tmpdir } from "node:os";
import { join } from "node:path";
import { launch } from "./cdp.mjs";

const BASE = process.env.BASE || "http://localhost:5173/";
const SHOTS = process.env.SHOTS || tmpdir();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VIEWPORTS = [
  { name: "iPhone 393 × 852", width: 393, height: 852, mobile: true },
  { name: "petit iPhone 375 × 667", width: 375, height: 667, mobile: true },
  { name: "PC 1440 × 900", width: 1440, height: 900, mobile: false },
];

const hubShown = `document.querySelector(".screen-hub") && document.querySelectorAll("#app > .screen").length === 1`;
const galleryShown = `document.querySelector(".screen-g3d, .screen-museum")`;
const centred = (world) => `document.querySelector(".screen-hub")?.dataset.current === "${world}"`;
const atHub = `["", "#/"].includes(location.hash)`;

async function suite(page, vp) {
  async function check(name, fn) {
    const before = page.errors.length;
    try {
      await fn();
      if (page.errors.length > before) throw new Error(`erreur dans la page : ${page.errors.slice(before).join(" | ")}`);
      console.log(`  ✔ ${name}`);
    } catch (error) {
      console.log(`  ✘ ${name} : ${error.message}`);
      await page.close();
      process.exit(1);
    }
  }
  const screens = () => page.eval(`document.querySelectorAll("#app > .screen").length`);
  const current = () => page.eval(`document.querySelector(".screen-hub")?.dataset.current`);
  /** Marks the page, so a check can tell it reloaded (the mark is gone). */
  const mark = () => page.eval(`window.__mark = 1`);
  /** Brings a world's card to the middle (a touch on a side card), without entering. */
  async function centre(world) {
    await page.waitFor(`${hubShown} && !document.querySelector(".plate")`, 4000); // a touch during a transition is ignored
    await sleep(900); // the hub's entrance (0.8 s)
    if ((await current()) === world) return;
    await page.tap(`.hub-dot:nth-child(${["swap", "ubb", "aventures"].indexOf(world) + 1})`); // a card two notches away is off the screen
    await page.waitFor(centred(world));
    await sleep(600); // the smooth scroll settles
  }
  /** Enters a world from the hub: centre its card, then touch it. */
  async function enter(world) {
    await centre(world);
    await page.tap(`[data-world="${world}"]`);
  }

  // ── The hub and the worlds ────────────────────────────────

  await check("/ affiche le hub, avec ses trois mondes", async () => {
    await page.goto(BASE);
    await page.waitFor(hubShown);
    if ((await page.eval(`document.querySelectorAll(".screen-hub [data-world]").length`)) !== 3) throw new Error("pas trois mondes");
  });

  await check("toucher le Swap ouvre l'accueil du swap (#/swap), avec le bouton ⌂", async () => {
    await enter("swap");
    await page.waitFor(`location.hash === "#/swap" && document.querySelector(".screen-home")`, 4000);
    await page.waitFor(`!document.querySelector(".home-button").hidden && !document.querySelector(".plate")`, 3000);
  });

  await check("⌂ recharge la page sur le hub", async () => {
    await mark();
    await page.tap(".home-button");
    await page.waitFor(`!window.__mark && location.hash === "#/" && ${hubShown}`, 8000);
  });

  await check("toucher la Galerie l'ouvre ; le retour du navigateur ramène au hub", async () => {
    await enter("ubb");
    await page.waitFor(`location.hash === "#/ubb" && ${galleryShown}`, 8000);
    await page.eval(`history.back()`);
    await page.waitFor(hubShown, 8000);
  });

  await check("lien direct #/ubb, puis son bouton retour : le hub, sans quitter le site", async () => {
    await page.goto(`${BASE}#/ubb`);
    await page.waitFor(galleryShown, 8000);
    const length = await page.eval(`history.length`);
    await page.tap(".mu-back");
    await page.waitFor(`location.hash === "#/" && ${hubShown}`, 8000);
    if ((await page.eval(`history.length`)) !== length) throw new Error("l'historique a changé");
  });

  await check("?musee devient #/ubb ; ?musee&css garde ?css et la galerie CSS", async () => {
    await page.goto(`${BASE}?musee`);
    await page.waitFor(`location.search === "" && location.hash === "#/ubb"`);
    await page.goto(`${BASE}?musee&css`);
    await page.waitFor(`location.search === "?css" && location.hash === "#/ubb" && document.querySelector(".screen-museum")`, 8000);
  });

  await check("#/aventures/roadtrip ouvre la coquille des aventures ; son retour mène au hub", async () => {
    await page.goto(`${BASE}#/aventures/roadtrip`);
    await page.waitFor(`document.querySelector(".screen-aventures")`);
    await page.tap(".world-back");
    await page.waitFor(hubShown, 4000);
  });

  await check("une adresse inconnue mène au hub", async () => {
    await page.goto(`${BASE}#/nimporte`);
    await page.waitFor(hubShown);
  });

  await check("double toucher sur une carte : on entre une seule fois", async () => {
    await page.goto(BASE);
    await centre("aventures");
    const length = await page.eval(`history.length`);
    await page.tap(`[data-world="aventures"]`);
    await sleep(50);
    await page.tap(`[data-world="aventures"]`).catch(() => {}); // the card may already be covered
    await sleep(2000);
    if ((await screens()) !== 1 || !(await page.eval(`Boolean(document.querySelector(".screen-aventures"))`))) throw new Error("pas un seul écran d'aventures");
    if ((await page.eval(`history.length`)) !== length + 1) throw new Error("plus d'une entrée d'historique");
  });

  await check("retour du navigateur pendant la transition : un seul écran, celui de l'adresse, pas de plaque", async () => {
    await page.eval(`history.back()`);
    await centre("aventures");
    await page.tap(`[data-world="aventures"]`);
    await sleep(100);
    await page.eval(`history.back()`);
    await sleep(2000);
    if ((await screens()) !== 1) throw new Error(`${await screens()} écrans`);
    const ok = await page.eval(`${atHub} ? Boolean(document.querySelector(".screen-hub")) : Boolean(document.querySelector(".screen-aventures"))`);
    if (!ok) throw new Error(`l'écran ne correspond pas à « ${await page.eval("location.hash")} »`);
    await page.waitFor(`!document.querySelector(".plate")`, 3000);
  });

  await check("cinq allers-retours hub ↔ galerie, sans erreur, sans canvas oublié", async () => {
    await page.goto(BASE);
    for (let i = 0; i < 5; i++) {
      await enter("ubb");
      await page.waitFor(galleryShown, 8000);
      await sleep(1500);
      await page.eval(`history.back()`);
      await page.waitFor(`${hubShown} && !document.querySelector(".plate")`, 8000);
    }
    // .fx-canvas is the site's effects layer (crisps, confetti), there from the start
    if ((await page.eval(`document.querySelectorAll("canvas:not(.fx-canvas)").length`)) !== 0) throw new Error("un canvas de la galerie est resté");
  });

  // ── The carousel and the plates ───────────────────────────

  await check("glisser fait passer du Swap à la Galerie ; la carte est retenue au rechargement", async () => {
    await page.goto(BASE);
    await page.eval(`localStorage.setItem("swap-cyrielle:hub", "swap")`);
    await page.reload();
    await page.waitFor(`${hubShown} && ${centred("swap")}`);
    await sleep(600);
    await page.swipe(".hub-track", -260);
    await page.waitFor(centred("ubb"), 4000);
    await sleep(600);
    await page.reload();
    await page.waitFor(`${hubShown} && ${centred("ubb")}`);
  });

  await check("toucher une carte voisine la centre sans entrer", async () => {
    await sleep(600);
    await page.tap(`[data-world="aventures"]`);
    await page.waitFor(centred("aventures"));
    await sleep(800);
    if (!(await page.eval(atHub))) throw new Error("on est entré");
  });

  await check("toucher la carte du centre : la plaque grandit, puis le monde", async () => {
    await page.tap(`[data-world="aventures"]`);
    await page.waitFor(`document.querySelector(".plate")`, 1000);
    await page.waitFor(`!document.querySelector(".plate") && document.querySelector(".screen-aventures")`, 3000);
  });

  await check("retour : le hub, sur la carte du monde quitté, plaque repliée", async () => {
    await page.eval(`history.back()`);
    await page.waitFor(`${hubShown} && ${centred("aventures")}`, 3000);
    await page.waitFor(`!document.querySelector(".plate")`, 3000);
  });

  await check("⌂ depuis le swap : après rechargement, la plaque se replie dans la carte du Swap", async () => {
    await enter("swap");
    await page.waitFor(`document.querySelector(".screen-home") && !document.querySelector(".plate")`, 4000);
    await mark();
    await page.tap(".home-button");
    await page.waitFor(`!window.__mark && document.querySelector(".plate")`, 8000);
    await page.waitFor(`!document.querySelector(".plate") && ${centred("swap")}`, 3000);
  });

  await check("tourner l'écran garde la carte du centre", async () => {
    const before = await current();
    await page.resize(vp.height, vp.width);
    await sleep(700);
    await page.resize(vp.width, vp.height);
    await sleep(700);
    if ((await current()) !== before) throw new Error(`${before} → ${await current()}`);
  });

  await page.screenshot(join(SHOTS, `hub-${vp.width}x${vp.height}.png`));

  await check("stockage bloqué (navigation privée) : le hub marche quand même", async () => {
    await page.beforeLoad(`Object.defineProperty(window, "localStorage", { get() { throw new Error("bloqué"); } })`);
    await page.goto(`${BASE}?prive`);
    await page.waitFor(hubShown);
    await enter("aventures");
    await page.waitFor(`document.querySelector(".screen-aventures") && !document.querySelector(".plate")`, 4000);
    await page.eval(`history.back()`);
    await page.waitFor(`${hubShown} && !document.querySelector(".plate")`, 4000);
  });

  // ── The swap, unchanged inside ────────────────────────────

  await check("?demo#/swap : Redécouvrir le swap → Revoir mon parcours ouvre l'intro", async () => {
    await page.goto(`${BASE}?demo#/swap`);
    await page.waitFor(`document.querySelector(".home-actions .btn-primary")`);
    await sleep(900); // the home page's entrance animation
    await page.tap(".home-actions .btn-primary");
    await page.waitFor(`!document.querySelector(".home-choices").hidden`);
    await page.tap(".home-choice");
    await page.waitFor(`document.querySelector(".screen-welcome")`);
  });
}

for (const vp of VIEWPORTS.filter((v) => !process.env.ONLY || v.name.includes(process.env.ONLY))) {
  console.log(`— ${vp.name}`);
  const page = await launch(vp);
  await suite(page, vp);
  await page.close();
}
console.log("Tout est bon.");
