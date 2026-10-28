// A fake souvenirs backend, for the tests and demos (?souvenirs=fake): the code is « test-code », the data lives in
// localStorage (files as data URLs, so small ones only) and every page of the site sees changes live through a
// BroadcastChannel. Each device (&device=x) has its own session, like two phones. For the tests:
// window.__souvenirsFake.failNext() makes the next upload fail, .expire() ends this device's session.
import { checkFile, checkNote, countByMatch, sortItems, storagePaths } from "./logic.js";
import { shrinkPhoto, videoThumb } from "./media.js";

const KEY = "swap-cyrielle:souvenirs-fake";
const CODE = "test-code";
const CHANNEL = "souvenirs-fake";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const load = () => JSON.parse(localStorage.getItem(KEY) || '{"rows":[],"files":{}}');
const save = (db) => localStorage.setItem(KEY, JSON.stringify(db));
const dataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export function createFakeStore({ deviceId }) {
  const sessionKey = `${KEY}-session:${deviceId}`;
  const sender = new BroadcastChannel(CHANNEL);
  let failNext = false;
  window.__souvenirsFake = {
    failNext: () => (failNext = true),
    expire: () => localStorage.removeItem(sessionKey),
  };

  const unlocked = () => localStorage.getItem(sessionKey) === "1";
  const withUrls = (row, files) => ({ ...row, url: row.path ? files[row.path] : null, thumbUrl: row.thumb ? files[row.thumb] : null });
  const guard = () => {
    if (!unlocked()) throw new Error("locked");
  };

  async function insert(row, files) {
    const db = load();
    Object.assign(db.files, files);
    db.rows.push(row);
    save(db);
    const item = withUrls(row, db.files);
    sender.postMessage({ type: "insert", item });
    return item;
  }

  return {
    deviceId,
    async isUnlocked() {
      return unlocked();
    },
    async unlock(code) {
      await sleep(150);
      if (code !== CODE) throw new Error("bad-code");
      localStorage.setItem(sessionKey, "1");
    },
    async list(matchDate) {
      guard();
      const db = load();
      return sortItems(db.rows.filter((r) => r.match_date === matchDate)).map((r) => withUrls(r, db.files));
    },
    async counts() {
      guard();
      return countByMatch(load().rows);
    },
    async addMedia(matchDate, file, { author, onProgress = () => {} }) {
      guard();
      const check = checkFile(file);
      if (check.error) throw new Error(check.error);
      const id = crypto.randomUUID();
      const { path, thumb } = storagePaths(matchDate, id, check.kind, file.type);
      const media = check.kind === "photo" ? await shrinkPhoto(file) : { ...(await videoThumb(file)), full: file };
      // the « upload »: four steps; a failure leaves nothing behind (no row, no file)
      for (const p of [0.25, 0.5, 0.75]) {
        await sleep(60);
        if (failNext) {
          failNext = false;
          throw new Error("network");
        }
        onProgress(p);
      }
      const files = { [path]: await dataUrl(media.full) };
      if (media.thumb) files[thumb] = await dataUrl(media.thumb);
      onProgress(1);
      const row = { id, match_date: matchDate, kind: check.kind, path, thumb: media.thumb ? thumb : null, text: null, author, device: deviceId, width: media.width, height: media.height, created_at: new Date().toISOString() };
      return insert(row, files);
    },
    async addNote(matchDate, text, { author }) {
      guard();
      const check = checkNote(text);
      if (check.error) throw new Error(check.error);
      await sleep(80);
      const row = { id: crypto.randomUUID(), match_date: matchDate, kind: "note", path: null, thumb: null, text: check.text, author, device: deviceId, width: null, height: null, created_at: new Date().toISOString() };
      return insert(row, {});
    },
    async remove(item) {
      guard();
      const db = load();
      db.rows = db.rows.filter((r) => r.id !== item.id);
      for (const p of [item.path, item.thumb]) if (p) delete db.files[p];
      save(db);
      sender.postMessage({ type: "delete", id: item.id, match_date: item.match_date });
    },
    subscribe(matchDate, onChange) {
      const receiver = new BroadcastChannel(CHANNEL); // a second channel object: it also hears this page's own posts
      receiver.onmessage = ({ data }) => {
        if ((data.item?.match_date ?? data.match_date) === matchDate) onChange(data.type === "insert" ? { type: "insert", item: data.item } : { type: "delete", id: data.id });
      };
      return () => receiver.close();
    },
  };
}
