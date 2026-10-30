// Cuts die-cut sticker boards into one WebP per sticker (spec § 7), into assets/aventures/. The pixels go through
// headless Chrome (the e2e client, no dependency): it decodes the PNG, crops, scales to 300 px and encodes the WebP.
// Run: node tools/decoupe/decoupe.mjs <boards folder of an outing | board.png> [--scene]
//   a folder: its standard boards (« <Who> de face.png », « <Who> de dos.png »), 12 poses each;
//   a file in planches/voyages/vehicules/: a vehicle, 12 views;
//   --scene: a scene board, any number of stickers, numbered scene-<board>-01.webp… in reading order.
// A board that does not give the expected stickers is reported and writes nothing; the others go on, and the exit
// code is 1. A contact sheet of each board lands in tools/decoupe/apercu/ (not in git).
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "../../tests/e2e/cdp.mjs";
import { cutStickers, padBox } from "./islands.mjs";
import { VEHICLES, boardOf, fileNames, outingOf, slug } from "./names.mjs";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const ASSETS = here("../../assets/aventures/");
const SHEETS = here("./apercu/");
const WIDTH = 300; // px, a cut sticker
const MARGIN = 6; // px kept around a sticker: its white outline must stay whole
// The loose bits of an emote are small (down to about 1000 px on a 1448 × 1086 board) and the specks of a board are a
// few pixels: islands under this share of the board are dropped.
const SPECK = 0.0003;
const WHITE = 225; // a pixel with red, green and blue all above this is part of a white outline
const WEBP_KB = [10, 60]; // a sticker's expected weight

// Runs in the page: keeps the board on a canvas, hands back its alpha and which pixels are white (an outline), crops
// stickers (keeping only the pixels of a mask).
const PAGE = `(() => {
  const WHITE = ${WHITE};
  const toBase64 = (bytes) =>
    new Promise((done) => {
      const reader = new FileReader();
      reader.onload = () => done(reader.result.split(",")[1]);
      reader.readAsDataURL(new Blob([bytes]));
    });
  window.cut = {
    board: null,
    async load(url) {
      const img = new Image();
      img.src = url;
      await img.decode();
      const { naturalWidth: width, naturalHeight: height } = img;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, width, height).data;
      const alpha = new Uint8Array(width * height);
      const white = new Uint8Array(width * height);
      for (let i = 0; i < alpha.length; i++) {
        alpha[i] = pixels[i * 4 + 3];
        white[i] = pixels[i * 4] >= WHITE && pixels[i * 4 + 1] >= WHITE && pixels[i * 4 + 2] >= WHITE ? 1 : 0;
      }
      cut.board = canvas;
      return { width, height, alpha: await toBase64(alpha), white: await toBase64(white) };
    },
    crop(box, width, mask) {
      const source = document.createElement("canvas");
      source.width = box.w;
      source.height = box.h;
      const sctx = source.getContext("2d", { willReadFrequently: true });
      sctx.drawImage(cut.board, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      const pixels = sctx.getImageData(0, 0, box.w, box.h);
      const keep = atob(mask);
      for (let i = 0; i < keep.length; i++) if (!keep.charCodeAt(i)) pixels.data.fill(0, i * 4, i * 4 + 4);
      sctx.putImageData(pixels, 0, 0);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = Math.round((box.h * width) / box.w);
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/webp", 0.82);
    },
  };
})()`;

/** What to cut in a board file: where it is read from, how many stickers, and the names (under assets/aventures/). */
function jobOf(file, scene) {
  const folder = basename(dirname(file));
  const name = basename(file, ".png");
  const outing = outingOf(folder);
  if (scene) {
    const names = (count) => Array.from({ length: count }, (_, i) => `${outing}/scene-${slug(name)}-${String(i + 1).padStart(2, "0")}.webp`);
    return { file, expected: null, names, sheet: `${outing}-scene-${slug(name)}` };
  }
  if (folder === "vehicules") {
    if (!VEHICLES[name]) throw new Error(`véhicule inconnu : « ${name} » (voir VEHICLES dans names.mjs)`);
    return { file, expected: 12, names: () => fileNames({ vehicle: VEHICLES[name] }), sheet: `vehicules-${VEHICLES[name]}` };
  }
  const board = boardOf(basename(file));
  if (!board) throw new Error(`planche non standard : « ${basename(file)} » (« <Qui> de face.png » ou « <Qui> de dos.png »), voir --scene`);
  return { file, expected: 12, names: () => fileNames({ outing, ...board }), sheet: `${outing}-${board.who}-${board.side}` };
}

/** Cuts one board: the WebP files [{ name, bytes }], not written yet. Throws when the board does not give what it should. */
async function cutBoard(page, job) {
  const url = `data:image/png;base64,${readFileSync(job.file).toString("base64")}`;
  const { width, height, alpha, white } = await page.eval(`cut.load(${JSON.stringify(url)})`);
  const { boxes, owner } = cutStickers(Buffer.from(alpha, "base64"), width, height, {
    speck: SPECK,
    expected: job.expected,
    white: Buffer.from(white, "base64"),
  });
  const names = job.names(boxes.length);
  const files = [];
  for (const [i, box] of boxes.entries()) {
    const rect = padBox(box, MARGIN, width, height);
    const mask = new Uint8Array(rect.w * rect.h); // 1 where the pixel is this sticker's own
    for (let y = 0; y < rect.h; y++) for (let x = 0; x < rect.w; x++) mask[y * rect.w + x] = owner[(rect.y + y) * width + rect.x + x] === i + 1 ? 1 : 0;
    const webp = await page.eval(`cut.crop(${JSON.stringify(rect)}, ${WIDTH}, "${Buffer.from(mask).toString("base64")}")`);
    files.push({ name: names[i], bytes: Buffer.from(webp.split(",")[1], "base64") });
  }
  return files;
}

const kb = (bytes) => Math.round(bytes.length / 1024);

/** The contact sheet: each sticker on a coloured ground (the white outline shows), with its name and weight. */
function sheetHtml(title, files) {
  const figures = files
    .map(({ name, bytes }, i) => {
      const odd = kb(bytes) < WEBP_KB[0] || kb(bytes) > WEBP_KB[1];
      return `<figure><img src="../../../assets/aventures/${name}" alt=""><figcaption>${String(i + 1).padStart(2, "0")} · ${name}<br><b${odd ? ' class="odd"' : ""}>${kb(bytes)} Ko</b></figcaption></figure>`;
    })
    .join("\n");
  return `<!doctype html>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { margin: 16px; background: #5b6b7c; color: #fff; font: 14px system-ui, sans-serif; }
  main { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  figure { margin: 0; text-align: center; }
  img { width: 100%; max-height: 300px; object-fit: contain; }
  figcaption { margin-top: 4px; }
  .odd { color: #ffd166; }
</style>
<h1>${title} · ${files.length} stickers</h1>
<main>
${figures}
</main>
`;
}

function boardFiles(target, scene) {
  if (!existsSync(target)) throw new Error(`introuvable : ${target}`);
  if (statSync(target).isFile()) return [resolve(target)];
  if (scene) throw new Error("--scene prend une planche (un fichier), pas un dossier");
  const found = readdirSync(target).filter((f) => boardOf(f)).sort();
  if (!found.length) throw new Error(`aucune planche standard dans ${target}`);
  return found.map((f) => resolve(target, f));
}

async function main() {
  const args = process.argv.slice(2);
  const scene = args.includes("--scene");
  const target = args.find((a) => !a.startsWith("--"));
  if (!target) throw new Error("usage : node tools/decoupe/decoupe.mjs <dossier de planches | planche.png> [--scene]");
  const jobs = boardFiles(target, scene).map((file) => jobOf(file, scene));
  const page = await launch({ width: 1200, height: 900, mobile: false });
  try {
    await page.eval(PAGE);
    for (const job of jobs) {
      const label = basename(job.file);
      try {
        const files = await cutBoard(page, job);
        for (const { name, bytes } of files) {
          mkdirSync(dirname(`${ASSETS}${name}`), { recursive: true });
          writeFileSync(`${ASSETS}${name}`, bytes);
        }
        mkdirSync(SHEETS, { recursive: true });
        writeFileSync(`${SHEETS}${job.sheet}.html`, sheetHtml(label, files));
        console.log(`${label} : ${files.length} stickers, planche de contrôle tools/decoupe/apercu/${job.sheet}.html`);
        for (const { name, bytes } of files) console.log(`  ${name}  ${kb(bytes)} Ko`);
      } catch (error) {
        console.error(`${label} : ${error.message}`);
        process.exitCode = 1;
      }
    }
  } finally {
    await page.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
