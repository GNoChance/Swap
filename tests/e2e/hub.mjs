// End-to-end checks of the portal, in headless Chrome. Needs the site running: `npm run dev` (port 5173), then
// `node tests/e2e/hub.mjs`. Stops at the first failure (exit code 1). A check also fails if the page logged an error.
import { launch } from "./cdp.mjs";

const BASE = process.env.BASE || "http://localhost:5173/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const page = await launch({ width: 393, height: 852, mobile: true });

async function check(name, fn) {
  const before = page.errors.length;
  try {
    await fn();
    if (page.errors.length > before) throw new Error(`erreur dans la page : ${page.errors.slice(before).join(" | ")}`);
    console.log(`✔ ${name}`);
  } catch (error) {
    console.log(`✘ ${name} : ${error.message}`);
    await page.close();
    process.exit(1);
  }
}

const screens = () => page.eval(`document.querySelectorAll("#app > .screen").length`);
const hubShown = `document.querySelector(".screen-hub") && document.querySelectorAll("#app > .screen").length === 1`;
const galleryShown = `document.querySelector(".screen-g3d, .screen-museum")`;
/** Marks the page, so a check can tell it reloaded (the mark is gone). */
const mark = () => page.eval(`window.__mark = 1`);

// ── The hub and the worlds ──────────────────────────────────

await check("/ affiche le hub, avec ses trois mondes", async () => {
  await page.goto(BASE);
  await page.waitFor(hubShown);
  if ((await page.eval(`document.querySelectorAll(".screen-hub [data-world]").length`)) !== 3) throw new Error("pas trois mondes");
});

await check("toucher le Swap ouvre l'accueil du swap (#/swap), avec le bouton ⌂", async () => {
  await sleep(600);
  await page.tap(`[data-world="swap"]`);
  await page.waitFor(`location.hash === "#/swap" && document.querySelector(".screen-home")`);
  await page.waitFor(`!document.querySelector(".home-button").hidden`);
});

await check("⌂ recharge la page sur le hub", async () => {
  await mark();
  await page.tap(".home-button");
  await page.waitFor(`!window.__mark && location.hash === "#/" && ${hubShown}`, 8000);
});

await check("toucher la Galerie l'ouvre ; le retour du navigateur ramène au hub", async () => {
  await sleep(600);
  await page.tap(`[data-world="ubb"]`);
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
  await page.waitFor(hubShown);
});

await check("une adresse inconnue mène au hub", async () => {
  await page.goto(`${BASE}#/nimporte`);
  await page.waitFor(hubShown);
});

await check("double toucher sur une carte : on entre une seule fois", async () => {
  await page.goto(BASE);
  await page.waitFor(hubShown);
  await sleep(600);
  const length = await page.eval(`history.length`);
  await page.tap(`[data-world="aventures"]`);
  await sleep(50);
  await page.tap(`[data-world="aventures"]`).catch(() => {}); // the card may already be gone
  await sleep(2000);
  if ((await screens()) !== 1 || !(await page.eval(`Boolean(document.querySelector(".screen-aventures"))`))) throw new Error("pas un seul écran d'aventures");
  if ((await page.eval(`history.length`)) !== length + 1) throw new Error("plus d'une entrée d'historique");
});

await check("retour du navigateur pendant la transition : un seul écran, celui de l'adresse", async () => {
  await page.eval(`history.back()`);
  await page.waitFor(hubShown);
  await sleep(600);
  await page.tap(`[data-world="aventures"]`);
  await sleep(100);
  await page.eval(`history.back()`);
  await sleep(2000);
  if ((await screens()) !== 1) throw new Error(`${await screens()} écrans`);
  const ok = await page.eval(`["", "#/"].includes(location.hash) ? Boolean(document.querySelector(".screen-hub")) : Boolean(document.querySelector(".screen-aventures"))`);
  if (!ok) throw new Error(`l'écran ne correspond pas à ${await page.eval("location.hash")}`);
});

await check("cinq allers-retours hub ↔ galerie, sans erreur, sans canvas oublié", async () => {
  await page.goto(BASE);
  await page.waitFor(hubShown);
  for (let i = 0; i < 5; i++) {
    await sleep(600);
    await page.tap(`[data-world="ubb"]`);
    await page.waitFor(galleryShown, 8000);
    await sleep(1500);
    await page.eval(`history.back()`);
    await page.waitFor(hubShown, 8000);
  }
  // .fx-canvas is the site's effects layer (crisps, confetti), there from the start
  if ((await page.eval(`document.querySelectorAll("canvas:not(.fx-canvas)").length`)) !== 0) throw new Error("un canvas de la galerie est resté");
});

// ── The swap, unchanged inside ──────────────────────────────

await check("?demo#/swap : Redécouvrir le swap → Revoir mon parcours ouvre l'intro", async () => {
  await page.goto(`${BASE}?demo#/swap`);
  await page.waitFor(`document.querySelector(".home-actions .btn-primary")`);
  await sleep(900); // the home page's entrance animation
  await page.tap(".home-actions .btn-primary");
  await page.waitFor(`!document.querySelector(".home-choices").hidden`);
  await page.tap(".home-choice");
  await page.waitFor(`document.querySelector(".screen-welcome")`);
});

await page.close();
console.log("Tout est bon.");
