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

await check("/ affiche l'accueil du swap", async () => {
  await page.goto(BASE);
  await page.waitFor(`document.querySelector(".screen-home")`);
});

await check("?musee&css affiche la galerie CSS", async () => {
  await page.goto(`${BASE}?musee&css`);
  await page.waitFor(`document.querySelector(".screen-museum")`);
});

await check("?demo : Redécouvrir le swap → Revoir mon parcours ouvre l'intro", async () => {
  await page.goto(`${BASE}?demo`);
  await page.waitFor(`document.querySelector(".home-actions .btn-primary")`);
  await sleep(900); // the home page's entrance animation
  await page.tap(".home-actions .btn-primary");
  await page.waitFor(`!document.querySelector(".home-choices").hidden`);
  await page.tap(".home-choice");
  await page.waitFor(`document.querySelector(".screen-welcome")`);
});

await page.close();
console.log("Tout est bon.");
