// A small static server for the end-to-end checks: `npm run dev` (serve) gives up with EMFILE under the hundreds of
// file loads of a full run. Serves the repository as it is, "/" → index.html. Run: node tests/e2e/serve.mjs
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = normalize(fileURLToPath(new URL("../../", import.meta.url)));
const PORT = Number(process.env.PORT) || 5173;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".ttf": "font/ttf",
  ".mp4": "video/mp4",
};

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = normalize(join(ROOT, path.endsWith("/") ? `${path}index.html` : path));
  if (file !== ROOT && !file.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" }).end(body);
  } catch {
    res.writeHead(404).end("introuvable");
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}/`));
