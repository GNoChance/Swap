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

/** A headless Chrome page: { goto, reload, eval, waitFor, tap, tapAt, doubleTap, swipe, mouse, resize, lock, hide, beforeLoad, screenshot, errors, close }. */
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

  let held = false; // the mouse's left button
  let holding = null; // hold()'s listener

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
    /** The middle of the element's visible part (a card half off the screen is touched where it shows). */
    async center(selector) {
      const c = await page.eval(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const [left, right] = [Math.max(r.left, 0), Math.min(r.right, innerWidth)];
        const [top, bottom] = [Math.max(r.top, 0), Math.min(r.bottom, innerHeight)];
        if (right <= left || bottom <= top) return "hors-écran";
        return { x: (left + right) / 2, y: (top + bottom) / 2 };
      })()`);
      if (!c) throw new Error(`introuvable : ${selector}`);
      if (c === "hors-écran") throw new Error(`hors de l'écran : ${selector}`);
      return c;
    },
    /** A tap (a touch on a phone, a click on a PC) in the middle of the element. */
    async tap(selector) {
      const { x, y } = await page.center(selector);
      await page.tapAt(x, y);
    },
    /** A tap at x, y (CSS px from the top left of the screen). */
    async tapAt(x, y) {
      if (mobile) {
        await cmd("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
        await cmd("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      } else {
        for (const type of ["mousePressed", "mouseReleased"]) await cmd("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
      }
    },
    /** Two taps at x, y, every event sent at once, none waiting for the page to handle the one before: the second
     *  comes before anything the first one started has finished (a quick double tap, or two taps on a busy page). */
    async doubleTap(x, y) {
      const touch = (type) => ["Input.dispatchTouchEvent", { type, touchPoints: type === "touchStart" ? [{ x, y }] : [] }];
      const click = (type, clickCount) => ["Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount }];
      const events = mobile ? [1, 2].flatMap(() => [touch("touchStart"), touch("touchEnd")]) : [1, 2].flatMap((n) => [click("mousePressed", n), click("mouseReleased", n)]);
      await Promise.all(events.map(([method, params]) => cmd(method, params)));
    },
    /** A finger sliding dx px sideways on the element (negative: towards the left, to see what is on the right); on a
     *  PC, a horizontal wheel turn of the same amount. */
    async swipe(selector, dx) {
      const { x, y } = await page.center(selector);
      if (!mobile) return cmd("Input.dispatchMouseEvent", { type: "mouseWheel", x, y, deltaX: -dx, deltaY: 0 });
      const steps = 12;
      await cmd("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (let i = 1; i <= steps; i++) {
        await cmd("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + (dx * i) / steps, y }] });
        await sleep(16);
      }
      await cmd("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    },
    /** The mouse (a PC): "down" (left button), "move" or "up" at x, y; a move with the button up is a hover. */
    async mouse(action, x, y) {
      if (action !== "move") held = action === "down";
      const type = { down: "mousePressed", move: "mouseMoved", up: "mouseReleased" }[action];
      const button = action === "move" && !held ? "none" : "left";
      await cmd("Input.dispatchMouseEvent", { type, x, y, button, buttons: held ? 1 : 0, clickCount: action === "move" ? 0 : 1 });
    },
    /** The phone locked for `ms`, then unlocked: the page hidden and frozen (no timer, no frame), then running again,
     *  its overdue timers at once. Chrome leaves it hidden once active: focus emulation (left on) shows it again. */
    async lock(ms) {
      await cmd("Emulation.setFocusEmulationEnabled", { enabled: false }); // left on by a lock before: it would keep the page shown
      await cmd("Page.setWebLifecycleState", { state: "frozen" });
      await sleep(ms);
      await cmd("Page.setWebLifecycleState", { state: "active" });
      await cmd("Emulation.setFocusEmulationEnabled", { enabled: true });
    },
    /** Another app in front for `ms`: the page hidden but running (its timers and loads, no frame), then shown again. */
    async hide(ms) {
      await cmd("Emulation.setFocusEmulationEnabled", { enabled: false });
      await cmd("Page.setWebLifecycleState", { state: "frozen" });
      await cmd("Page.setWebLifecycleState", { state: "active" }); // left hidden
      await sleep(ms);
      await cmd("Emulation.setFocusEmulationEnabled", { enabled: true });
    },
    beforeLoad: (source) => cmd("Page.addScriptToEvaluateOnNewDocument", { source }),
    /** Makes requests to matching urls fail ("*aventures/screen.js*"), as on a flaky connection; [] lifts it. */
    async block(patterns) {
      await cmd("Network.enable");
      await cmd("Network.setBlockedURLs", { urls: patterns });
    },
    /** Holds the requests to matching urls ("*aventures/*.webp") `ms` before letting them through, the cache off,
     *  as on a slow connection; [] lifts it. */
    async hold(patterns, ms = 0) {
      holding?.();
      holding = null;
      await cmd("Network.enable");
      await cmd("Network.setCacheDisabled", { cacheDisabled: patterns.length > 0 });
      if (!patterns.length) return cmd("Fetch.disable");
      holding = on("Fetch.requestPaused", ({ requestId }) => setTimeout(() => cmd("Fetch.continueRequest", { requestId }).catch(() => {}), ms));
      await cmd("Fetch.enable", { patterns: patterns.map((urlPattern) => ({ urlPattern })) });
    },
    /** A PNG of the page, or of `clip` ({ x, y, width, height }); `transparent` keeps the page's empty areas see-through. */
    async screenshot(file, { clip, transparent = false } = {}) {
      if (transparent) await cmd("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
      const { data } = await cmd("Page.captureScreenshot", { format: "png", ...(clip && { clip: { ...clip, scale: 1 } }) });
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
