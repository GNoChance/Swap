// The real souvenirs backend: Supabase (supabase/setup.sql). The library (js/vendor/supabase.js) loads only when a
// souvenirs panel first needs it. One shared account opens everything: its e-mail is in the config, the code
// typed on the site is its password. Files go up by XHR (the library has no upload progress); a souvenir's row is
// inserted only once its files are up, so nobody ever sees half of one.
import { checkFile, checkNote, countByMatch, sortItems, storagePaths } from "./logic.js";
import { shrinkPhoto, videoThumb } from "./media.js";

const BUCKET = "souvenirs";
const TABLE = "souvenirs";
const SIGNED = 3600; // seconds a file link stays valid

let library = null;
function loadLibrary() {
  library ??= new Promise((resolve, reject) => {
    if (window.supabase) return resolve(window.supabase);
    const script = document.createElement("script");
    script.src = "js/vendor/supabase.js";
    script.onload = () => resolve(window.supabase);
    script.onerror = () => ((library = null), reject(new Error("network")));
    document.head.append(script);
  });
  return library;
}

/** The library's errors, as the panel knows them. 42501: the shared account has no rights on the table. */
function failure(error) {
  if (!error) return new Error("network");
  if (error.code === "42501") {
    console.warn("Souvenirs : Supabase refuse l'accès (42501). Relancer supabase/setup.sql dans le SQL Editor du projet.");
    return new Error("config");
  }
  const status = Number(error.status ?? error.statusCode);
  if (status === 401 || status === 403 || /jwt|not authorized|row-level security/i.test(error.message || "")) return new Error("locked");
  return new Error("network");
}

/** Sends one file with its progress; resolves when stored. */
function upload({ url, anonKey, token, path, blob, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${url}/storage/v1/object/${BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("Content-Type", blob.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(xhr.status === 401 || xhr.status === 403 ? "locked" : "network")));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(blob);
  });
}

export function createSupabaseStore(config, deviceId) {
  // the client, created on first need; a library that failed to load (no network) is tried again next time
  let ready = null;
  const getClient = () =>
    (ready ??= loadLibrary()
      .then((lib) => lib.createClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "swap-cyrielle:souvenirs-auth" } }))
      .catch((error) => {
        ready = null;
        throw error;
      }));

  async function session() {
    const client = await getClient();
    const { data } = await client.auth.getSession();
    if (!data.session) throw new Error("locked");
    return { client, token: data.session.access_token };
  }

  /** Rows → items with their signed file links (one call for all of them). */
  async function withUrls(client, rows) {
    const paths = rows.flatMap((r) => [r.path, r.thumb]).filter(Boolean);
    const links = {};
    if (paths.length) {
      const { data, error } = await client.storage.from(BUCKET).createSignedUrls(paths, SIGNED);
      if (error) throw failure(error);
      for (const s of data) if (s.signedUrl) links[s.path] = s.signedUrl;
    }
    return rows.map((r) => ({ ...r, url: links[r.path] || null, thumbUrl: links[r.thumb] || null }));
  }

  /** Links can't be had right now (network): the souvenir shows without them rather than not at all. */
  async function withUrlsOrNot(client, rows) {
    try {
      return await withUrls(client, rows);
    } catch {
      return rows.map((r) => ({ ...r, url: null, thumbUrl: null }));
    }
  }

  async function insert(client, row) {
    const { data, error } = await client.from(TABLE).insert(row).select().single();
    if (error) throw failure(error);
    return (await withUrlsOrNot(client, [data]))[0];
  }

  /** Was the row written although its answer got lost (a flaky network)? */
  async function exists(client, id) {
    try {
      const { data } = await client.from(TABLE).select("id").eq("id", id);
      return Boolean(data?.length);
    } catch {
      return false;
    }
  }

  return {
    deviceId,
    async isUnlocked() {
      try {
        await session();
        return true;
      } catch {
        return false;
      }
    },
    async unlock(code) {
      let client;
      try {
        client = await getClient();
      } catch {
        throw new Error("network");
      }
      const { error } = await client.auth.signInWithPassword({ email: config.email, password: code });
      if (!error) return;
      throw new Error(error.status === 400 || /invalid/i.test(error.message) ? "bad-code" : "network");
    },
    async list(matchDate) {
      const { client } = await session();
      const { data, error } = await client.from(TABLE).select("*").eq("match_date", matchDate);
      if (error) throw failure(error);
      return withUrls(client, sortItems(data));
    },
    async counts() {
      const { client } = await session();
      const { data, error } = await client.from(TABLE).select("match_date, kind").neq("kind", "note");
      if (error) throw failure(error);
      return countByMatch(data);
    },
    async addMedia(matchDate, file, { author, onProgress = () => {} }) {
      const check = checkFile(file);
      if (check.error) throw new Error(check.error);
      const { client, token } = await session();
      const id = crypto.randomUUID();
      const paths = storagePaths(matchDate, id, check.kind, file.type);
      const media = check.kind === "photo" ? await shrinkPhoto(file) : { ...(await videoThumb(file)), full: file };
      const parts = [{ path: paths.path, blob: media.full }];
      if (media.thumb) parts.push({ path: paths.thumb, blob: media.thumb });
      const total = parts.reduce((sum, p) => sum + p.blob.size, 0);
      let done = 0;
      const sent = [];
      const takeBack = async (error) => {
        // nothing half-made: files already up are taken back (orphan files are invisible, a broken souvenir is not)
        if (sent.length) await client.storage.from(BUCKET).remove(sent).catch(() => {});
        return ["locked", "config"].includes(error.message) ? error : new Error("network");
      };
      try {
        for (const part of parts) {
          await upload({ url: config.url, anonKey: config.anonKey, token, ...part, onProgress: (f) => onProgress(Math.min(0.99, (done + f * part.blob.size) / total)) });
          sent.push(part.path);
          done += part.blob.size;
        }
      } catch (error) {
        throw await takeBack(error);
      }
      const row = { id, match_date: matchDate, kind: check.kind, path: paths.path, thumb: media.thumb ? paths.thumb : null, text: null, author, device: deviceId, width: media.width || null, height: media.height || null };
      const { data, error } = await client.from(TABLE).insert(row).select().single();
      // once the row is in, nothing is taken back: if its answer got lost, look before undoing
      if (error && !(failure(error).message === "network" && (await exists(client, id)))) throw await takeBack(failure(error));
      onProgress(1);
      return (await withUrlsOrNot(client, [data || { ...row, created_at: new Date().toISOString() }]))[0];
    },
    async addNote(matchDate, text, { author }) {
      const check = checkNote(text);
      if (check.error) throw new Error(check.error);
      const { client } = await session();
      return insert(client, { match_date: matchDate, kind: "note", text: check.text, author, device: deviceId });
    },
    async remove(item) {
      const { client } = await session();
      const files = [item.path, item.thumb].filter(Boolean);
      if (files.length) {
        const { error } = await client.storage.from(BUCKET).remove(files);
        if (error) throw failure(error);
      }
      const { error } = await client.from(TABLE).delete().eq("id", item.id);
      if (error) throw failure(error);
    },
    subscribe(matchDate, onChange) {
      let channel = null;
      let closed = false;
      getClient().then(async (client) => {
        if (closed) return;
        channel = client
          .channel(`souvenirs-${matchDate}-${crypto.randomUUID()}`)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: TABLE, filter: `match_date=eq.${matchDate}` }, async ({ new: row }) => {
            const [item] = await withUrlsOrNot(client, [row]);
            onChange({ type: "insert", item });
          })
          // deletions can't be filtered by match: the panel ignores ids it doesn't show
          .on("postgres_changes", { event: "DELETE", schema: "public", table: TABLE }, ({ old }) => onChange({ type: "delete", id: old.id }))
          .subscribe();
      });
      return () => {
        closed = true;
        if (channel) getClient().then((client) => client.removeChannel(channel));
      };
    },
  };
}
