// Shared souvenirs: the pure rules (files, notes, names, sizes, paths, order, counts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { content } from "../js/content.js";
import * as S from "../js/souvenirs/logic.js";

test("souvenirs: photos and videos up to 50 MB, nothing else", () => {
  assert.deepEqual(S.checkFile({ type: "video/quicktime", size: 52428800 }), { kind: "video" });
  assert.deepEqual(S.checkFile({ type: "video/mp4", size: 52428801 }), { error: "too-big" });
  assert.deepEqual(S.checkFile({ type: "image/heic", size: 4e6 }), { kind: "photo" });
  assert.deepEqual(S.checkFile({ type: "image/jpeg", size: 60e6 }), { kind: "photo" }); // shrunk before sending
  assert.deepEqual(S.checkFile({ type: "application/pdf", size: 1000 }), { error: "not-media" });
  assert.deepEqual(S.checkFile({ type: "video/webm", size: 1000 }), { error: "not-media" });
  assert.deepEqual(S.checkFile({ type: "", size: 1000 }), { error: "not-media" });
});

test("souvenirs: a note is 1 to 500 characters, emojis count for one, HTML stays text", () => {
  assert.deepEqual(S.checkNote("   "), { error: "empty" });
  assert.deepEqual(S.checkNote("  Dédé a hurlé  "), { text: "Dédé a hurlé" });
  assert.deepEqual(S.checkNote("😀".repeat(500)), { text: "😀".repeat(500) });
  assert.deepEqual(S.checkNote("😀".repeat(501)), { error: "too-long" });
  assert.deepEqual(S.checkNote("<img src=x onerror=alert(1)>"), { text: "<img src=x onerror=alert(1)>" });
  assert.equal(S.noteLength("a😀b"), 3);
});

test("souvenirs: a first name, 1 to 40 characters", () => {
  assert.deepEqual(S.checkName("  Cyrielle "), { name: "Cyrielle" });
  assert.deepEqual(S.checkName(""), { error: "empty" });
  assert.deepEqual(S.checkName("x".repeat(41)), { error: "too-long" });
});

test("souvenirs: shrinking never enlarges, keeps the shape", () => {
  assert.deepEqual(S.fitWithin(8064, 6048, 2048), { w: 2048, h: 1536 });
  assert.deepEqual(S.fitWithin(3024, 4032, 512), { w: 384, h: 512 });
  assert.deepEqual(S.fitWithin(400, 300, 2048), { w: 400, h: 300 });
});

test("souvenirs: where the files go", () => {
  assert.deepEqual(S.storagePaths("2026-03-22", "ab", "photo", "image/jpeg"), { path: "2026-03-22/ab-full.jpg", thumb: "2026-03-22/ab-thumb.jpg" });
  assert.deepEqual(S.storagePaths("2026-03-22", "ab", "video", "video/quicktime"), { path: "2026-03-22/ab.mov", thumb: "2026-03-22/ab-thumb.jpg" });
  assert.deepEqual(S.storagePaths("2026-03-22", "ab", "video", "video/mp4"), { path: "2026-03-22/ab.mp4", thumb: "2026-03-22/ab-thumb.jpg" });
  assert.deepEqual(S.storagePaths("2026-03-22", "ab", "note"), { path: null, thumb: null });
});

test("souvenirs: in the order they were added, mine from this phone, counted per match", () => {
  const items = [
    { id: "b", created_at: "2026-10-28T10:00:00Z", kind: "photo", match_date: "2026-03-22", device: "A" },
    { id: "a", created_at: "2026-10-28T10:00:00Z", kind: "note", match_date: "2026-03-22", device: "B" },
    { id: "c", created_at: "2026-10-28T09:00:00Z", kind: "video", match_date: "2025-04-06", device: "A" },
  ];
  assert.deepEqual(S.sortItems(items).map((i) => i.id), ["c", "a", "b"]);
  assert.equal(S.isMine(items[0], "A"), true);
  assert.equal(S.isMine(items[1], "A"), false);
  assert.equal(S.isMine(items[0], ""), false);
  assert.deepEqual(S.countByMatch(items), { "2026-03-22": 1, "2025-04-06": 1 }); // notes don't count
});

test("souvenirs: no photos or story left in content.js, the panel's texts are there", () => {
  for (const m of content.museum.matches) assert.ok(!("photos" in m) && !("story" in m), m.date);
  const ui = content.museum.souvenirsUi;
  for (const key of ["locked", "enter", "code", "unlock", "badCode", "add", "media", "note", "publish", "name", "next", "network", "failed", "tooBig", "notMedia", "confirm", "remove", "cancel"])
    assert.ok(ui[key], key);
  assert.equal(content.museum.moreCount, "En savoir plus · {n}");
});

test("souvenirs: which backend — the fake one on ?souvenirs=fake, Supabase once configured, none before", async () => {
  const { pickBackend } = await import("../js/souvenirs/store.js");
  const empty = { url: "", anonKey: "" };
  const set = { url: "https://x.supabase.co", anonKey: "ey…" };
  assert.equal(pickBackend({ search: "?musee&souvenirs=fake&device=b", config: empty }), "fake");
  assert.equal(pickBackend({ search: "?souvenirs=fake", config: set }), "fake");
  assert.equal(pickBackend({ search: "?musee", config: set }), "supabase");
  assert.equal(pickBackend({ search: "?musee", config: empty }), null);
  assert.equal(pickBackend({ search: "", config: { url: "https://x.supabase.co", anonKey: "" } }), null);
});

test("supabase/setup.sql: private table and bucket, only the shared account, live updates", async () => {
  const { readFileSync } = await import("node:fs");
  const sql = readFileSync(new URL("../supabase/setup.sql", import.meta.url), "utf8").toLowerCase();
  assert.match(sql, /create table if not exists public\.souvenirs/);
  assert.match(sql, /kind in \('photo', 'video', 'note'\)/);
  assert.match(sql, /char_length\(text\) between 1 and 500/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /'souvenirs', 'souvenirs', false, 52428800/); // the bucket: private, 50 MB a file
  for (const action of ["select", "insert", "delete"]) {
    assert.match(sql, new RegExp(`on public\.souvenirs for ${action} to authenticated`), `table ${action}`);
    assert.match(sql, new RegExp(`on storage\.objects for ${action} to authenticated`), `storage ${action}`);
  }
  assert.doesNotMatch(sql, /to anon\b/);
  assert.match(sql, /revoke all on public\.souvenirs from anon/);
  assert.match(sql, /alter publication supabase_realtime add table public\.souvenirs/);
});

test("souvenirs: the config ships empty, no code written anywhere in the site's code", async () => {
  const { readFileSync, readdirSync } = await import("node:fs");
  const { config } = await import("../js/souvenirs-config.js");
  assert.equal(config.url, "");
  assert.equal(config.anonKey, "");
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === "vendor" ? [] : walk(`${dir}/${e.name}`)) : [`${dir}/${e.name}`]));
  const root = new URL("../js", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
  // a code written down: password: "…" / password = "…" (a password field, type: "password", is fine)
  for (const file of walk(root)) assert.doesNotMatch(readFileSync(file, "utf8"), /password["']?s*[:=]s*["'`]w/i, file);
});
