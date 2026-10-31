// The intros' stage (spec § 6): 390 × 760 units, scaled to the screen's height and centred; on a phone held sideways
// (under 560 px high), framed on the action band (y 250 to 730). Its layers are wide sheets that the camera only moves
// (transform), each by its depth: the parallax. Reads `window` only inside its functions: fit() runs under Node.
import { sfx } from "../../audio.js";

export const W = 390;
export const H = 760;
export const SAFE = { x0: 25, x1: 365 }; // what matters (people, vehicle, lettering) stays between these x
export const ENTER = 0.6; // s the screen takes to fade in (main.js, show()): the camera and the grain wait for it
const CENTRE = { x: W / 2, y: H / 2 }; // where a layer zooms by itself (css/intros.css: its middle)
const TALL = 560; // px: from this height up, the whole stage in the height
const BAND = { y0: 250, y1: 730 }; // the action band, for a short screen

/** autoAlpha 0 as inline styles: hidden until its moment, without GSAP reading the page's styles. */
export const HIDDEN = { opacity: "0", visibility: "hidden" };

/** The stage's x in `layer` (units): a layer wider than the stage starts left of it, by its inline width. */
export const layerX = (layer, x) => x + (parseFloat(layer.style.width) - W) / 2;

/** The stage on a width × height screen (px): its scale, and where its top left corner goes. */
export function fit(width, height) {
  if (height >= TALL) {
    const scale = height / H;
    return { scale, x: (width - W * scale) / 2, y: 0 };
  }
  const scale = height / (BAND.y1 - BAND.y0);
  return { scale, x: (width - W * scale) / 2, y: -BAND.y0 * scale };
}

/** The whole stage in the height, whatever the screen (the poster's framing). */
function fitWhole(width, height) {
  const scale = height / H;
  return { scale, x: (width - W * scale) / 2, y: 0 };
}

const div = (cls) => Object.assign(document.createElement("div"), { className: cls });

/** createStage(host): the stage in `host`, refitted on every resize. Stage = { el, layer, pan, frame, sound, dispose }. */
export function createStage(host) {
  const gsap = window.gsap;
  const el = div("st-stage");
  const world = div("st-world"); // the 390 × 760 units, placed by fit()
  el.append(world);
  el.setAttribute("aria-hidden", "true");
  host.append(el);
  const layers = []; // { el, depth }
  const voices = new Set(); // the sounds played by sound(), to stop with the stage

  // the framing goes in CSS variables: the world's transform mixes the action framing and the whole one by --st-whole
  // (the camera's frame(), a GSAP tween), so a resize never touches what GSAP animates
  function place() {
    const width = el.clientWidth || innerWidth;
    const height = el.clientHeight || innerHeight;
    const set = (prefix, { scale, x, y }) => {
      el.style.setProperty(`--st-${prefix}s`, String(scale));
      el.style.setProperty(`--st-${prefix}x`, String(x));
      el.style.setProperty(`--st-${prefix}y`, String(y));
    };
    set("a", fit(width, height));
    set("w", fitWhole(width, height));
  }
  el.style.setProperty("--st-whole", "0");
  place();
  addEventListener("resize", place);

  return {
    el,
    /** A sheet `width` units wide, centred on the stage (x from −(width − 390)/2), in front of the ones before it. */
    layer(name, { depth = 1, width = 1600 } = {}) {
      const layer = div(`st-layer st-layer--${name}`);
      layer.dataset.layer = name;
      layer.style.left = `${-(width - W) / 2}px`;
      layer.style.width = `${width}px`;
      world.append(layer);
      layers.push({ el: layer, depth });
      return layer;
    },
    /** The camera at `at` s: each layer moves by −x × depth (and −y), and zooms by zoom^depth around `focus` (a point
     *  of the stage that stays still, its centre by default: walking towards it); only the layers in `only` (their
     *  elements) if given, a scene of its own. From then on each layer is drawn apart; until then the decor is a single
     *  layer, cheap while its screen fades in (ENTER): a first move after that keeps it so. */
    pan(tl, at, { x = 0, y = 0, zoom = 1, focus = CENTRE, duration = 1, ease = "sine.inOut", only } = {}) {
      const moved = only ? layers.filter((layer) => only.includes(layer.el)) : layers;
      tl.set(
        moved.map((layer) => layer.el),
        { willChange: "transform" },
        at,
      );
      for (const layer of moved) {
        const scale = zoom ** layer.depth;
        const still = (k) => (1 - scale) * (focus[k] - CENTRE[k]); // a layer zooms around its centre: the focus stays put
        tl.to(layer.el, { x: -x * layer.depth + still("x"), y: -y * layer.depth + still("y"), scale, duration, ease }, at);
      }
    },
    /** The camera's frame at `at` s: whole (the whole stage in the height, as the poster needs on a phone held
     *  sideways), or back to the action band, or that share of the way between them (a number, 0 to 1). Nothing changes
     *  where both are the same (portrait, PC). */
    frame(tl, at, { whole = true, duration = 0.6, ease = "power2.inOut" } = {}) {
      tl.to(el, { "--st-whole": typeof whole === "number" ? whole : whole ? 1 : 0, duration, ease }, at);
    },
    /** The sound `name` at `at` s (sfx()); a long one (the engine, the crickets) stops with the stage. */
    sound(tl, at, name) {
      tl.call(() => voices.add(sfx(name)), null, at);
    },
    dispose() {
      removeEventListener("resize", place);
      gsap.killTweensOf([el, ...layers.map((layer) => layer.el)]);
      for (const voice of voices) voice.stop();
      voices.clear();
      el.remove();
    },
  };
}
