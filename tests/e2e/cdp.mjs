// A tiny Chrome DevTools Protocol client for the end-to-end checks: headless Chrome, Node's own WebSocket, no
// dependency. Chrome is looked for at its usual places, or in the CHROME variable.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROMES = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** A headless Chrome page: { goto, reload, eval, waitFor, tap, swipe, resize, beforeLoad, screenshot, errors, close }. */
export async function launch({ width = 393, height = 852, mobile = true } = {}) {
  const chrome = CHROMES.find((p) => p && existsSync(p));
  if (!chrome) throw new Error("Chrome introuvable : indiquer son chemin dans la variable CHROME");
  const profile = mkdtempSync(join(tmpdir(), "cycy-e2e-"));
  const proc = spawn(chrome, [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--use-angle=swiftshader", // WebGL without a GPU, for the 3D gallery
    "--enable-unsafe-swiftshader",
    "--autoplay-policy=no-user-gesture-required",
    "about:blank",
  ]);
  const wsUrl = await new Promise((resolve, reject) => {
    let out = "";
    const timer = setTimeout(() => reject(new Error("Chrome ne répond pas")), 20000);
    proc.stderr.on("data", (chunk) => {
      out += chunk;
      const m = out.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1]);
      }
    });
    proc.on("exit", (code) => reject(new Error(`Chrome s'est arrêté (code ${code})`)));
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error("connexion à Chrome impossible"));
  });
  let lastId = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method) listeners.forEach((fn) => fn(msg));
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++lastId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });

  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const cmd = (method, params) => send(method, params, sessionId);
  const on = (method, fn) => {
    const listener = (msg) => msg.sessionId === sessionId && msg.method === method && fn(msg.params);
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const once = (method) =>
    new Promise((resolve) => {
      const off = on(method, (params) => {
        off();
        resolve(params);
      });
    });

  const errors = [];
  on("Runtime.exceptionThrown", (p) => errors.push(p.exceptionDetails.exception?.description || p.exceptionDetails.text));
  on("Runtime.consoleAPICalled", (p) => p.type === "error" && errors.push(p.args.map((a) => a.value ?? a.description).join(" ")));
  on("Log.entryAdded", (p) => p.entry.level === "error" && errors.push(`${p.entry.text} ${p.entry.url || ""}`.trim()));
  await cmd("Page.enable");
  await cmd("Runtime.enable");
  await cmd("Log.enable");

  const resize = (w, h) => cmd("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: mobile ? 3 : 1, mobile });
  await resize(width, height);
  if (mobile) await cmd("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });

  const page = {
    errors,
    resize,
    async eval(expression) {
      const r = await cmd("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    /** Loads url and waits for it. A url that only changes the # of the current page is opened from a blank page,
     *  as in a new tab. */
    async goto(url) {
      let loaded = once("Page.loadEventFired");
      const r = await cmd("Page.navigate", { url });
      if (!r.loaderId) {
        await page.goto("about:blank");
        loaded = once("Page.loadEventFired");
        await cmd("Page.navigate", { url });
      }
      await loaded;
    },
    async reload() {
      const loaded = once("Page.loadEventFired");
      await cmd("Page.reload");
      await loaded;
    },
    /** Waits until the expression is truthy. */
    async waitFor(expression, timeout = 5000) {
      const end = Date.now() + timeout;
      for (;;) {
        if (await page.eval(`Boolean(${expression})`).catch(() => false)) return;
        if (Date.now() > end) throw new Error(`toujours faux après ${timeout} ms : ${expression}`);
        await sleep(50);
      }
    },
    async center(selector) {
      const c = await page.eval(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      })()`);
      if (!c) throw new Error(`introuvable : ${selector}`);
      return c;
    },
    /** A tap (a touch on a phone, a click on a PC) in the middle of the element. */
    async tap(selector) {
      const { x, y } = await page.center(selector);
      if (mobile) {
        await cmd("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
        await cmd("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      } else {
        for (const type of ["mousePressed", "mouseReleased"]) await cmd("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
      }
    },
    /** A finger sliding dx px sideways on the element (negative: towards the left, to see what is on the right). */
    async swipe(selector, dx) {
      const { x, y } = await page.center(selector);
      await cmd("Input.synthesizeScrollGesture", { x, y, xDistance: dx, yDistance: 0, gestureSourceType: mobile ? "touch" : "mouse", speed: 900 });
    },
    beforeLoad: (source) => cmd("Page.addScriptToEvaluateOnNewDocument", { source }),
    async screenshot(file) {
      const { data } = await cmd("Page.captureScreenshot", { format: "png" });
      writeFileSync(file, Buffer.from(data, "base64"));
    },
    async close() {
      ws.close();
      proc.kill();
      await sleep(300);
      try {
        rmSync(profile, { recursive: true, force: true });
      } catch {
        /* Chrome may still hold a file for a moment: the temp folder is cleaned up later by the system */
      }
    },
  };
  return page;
}
