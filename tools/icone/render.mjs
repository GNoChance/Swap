// Renders tools/icone/icone.html into every icon size of assets/logo/, with headless Chrome (the end-to-end tests'
// small client). Run: node tools/icone/render.mjs
import { fileURLToPath, pathToFileURL } from "node:url";
import { launch } from "../../tests/e2e/cdp.mjs";

const page = fileURLToPath(new URL("./icone.html", import.meta.url));
const out = (name) => fileURLToPath(new URL(`../../assets/logo/${name}`, import.meta.url));
const ICONS = [
  ["apple-touch-icon.png", 180, "full"], // the iPhone's home screen: a full tile (iOS rounds it itself)
  ["icon-192.png", 192, "full"],
  ["icon-512.png", 512, "full"],
  ["favicon-32.png", 32, "round"],
  ["favicon-64.png", 64, "round"],
];

for (const [name, size, tile] of ICONS) {
  const tab = await launch({ width: Math.max(size, 64), height: Math.max(size, 64), mobile: false });
  await tab.goto(`${pathToFileURL(page)}?size=${size}&tile=${tile}`);
  await tab.waitFor(`[...document.images].every((img) => img.complete && img.naturalWidth > 0)`);
  await tab.screenshot(out(name), { clip: { x: 0, y: 0, width: size, height: size }, transparent: true });
  await tab.close();
  console.log(`${name} (${size} px)`);
}
