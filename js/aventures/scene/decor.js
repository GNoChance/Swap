// The paper-cut decor (spec § 2): sheets of franc colour, each piece with a soft shadow under it and a light edge on
// its top, drawn once in its layer and then only moved; each layer's poster version (flat colours, no shadow, no
// grain), the same shapes in another palette, waits hidden for posterize(). The grain lies over the whole stage. No
// live SVG filter: a shadow is its piece's silhouette again, lower and fainter. Reads `window` only in its functions.

/** The poster's palette (option C of the style sketch). */
export const AFFICHE = { navy: "#22344f", teal: "#2f7f86", orange: "#e9844a", sun: "#f6c453", cream: "#f4e4c1", green: "#3f6b4a", grass: "#7fa05a" };

const NS = "http://www.w3.org/2000/svg";
const SHADE = "#3b2a18";
const LIGHT = "#fff7e6";
// the shadow a piece casts (the sketch's dy 3, blur 2.4, brown at 0.38): its silhouette twice, lower and fainter
const DROPS = [
  [1.6, 0.2],
  [3.8, 0.14],
];

/** The light edge along path data `d` (already inside its piece, or moved in by `dy`). */
const rim = (d, dy = 0) => `<path d="${d}"${dy ? ` transform="translate(0 ${dy})"` : ""} fill="none" stroke="${LIGHT}" stroke-opacity=".72" stroke-width="1.3" stroke-linejoin="round"/>`;

/** A paper piece lying on what is under it: its shadow, the piece (`markup`), then its light top edge (`edge`, path
 *  data inside it). silhouette: its outline as path data, or with `stroke`, a line that wide. lift: the shadow's
 *  depth (a thin sliver of snow sits lower than a cloud). */
export function cutPiece({ silhouette, markup, edge = "", stroke = 0, lift = 1 }) {
  const drop = ([dy, alpha]) =>
    stroke
      ? `<path d="${silhouette}" transform="translate(0 ${dy * lift})" fill="none" stroke="${SHADE}" stroke-opacity="${alpha}" stroke-width="${stroke}" stroke-linecap="round"/>`
      : `<path d="${silhouette}" transform="translate(0 ${dy * lift})" fill="${SHADE}" fill-opacity="${alpha}"/>`;
  return `${DROPS.map(drop).join("")}${markup}${edge ? rim(edge) : ""}`;
}

/** A sheet down to the bottom of the stage (its shadow falls under itself): the faint shade it casts over its top
 *  edge (`edge`, path data of that line), the sheet (`markup`), its light edge just inside. */
export function cutSheet({ edge, markup }) {
  return `<path d="${edge}" fill="none" stroke="${SHADE}" stroke-opacity=".08" stroke-width="5"/><path d="${edge}" fill="none" stroke="${SHADE}" stroke-opacity=".1" stroke-width="2"/>${markup}${rim(edge, 0.65)}`;
}

/** An <svg> over a whole layer, in stage units (x from −(width − 390)/2). */
function sheet(cls, width, markup) {
  const el = document.createElementNS(NS, "svg");
  el.setAttribute("class", cls);
  el.setAttribute("viewBox", `${-(width - 390) / 2} 0 ${width} 760`);
  el.setAttribute("preserveAspectRatio", "none");
  el.innerHTML = markup;
  return el;
}

/** paperLayer({ stage, name, depth, width, paper, poster }): a layer of the stage holding its paper version (`paper`,
 *  SVG markup in stage units, its pieces cut with cutPiece() and cutSheet(): their shadows and light edges) and its
 *  poster version (`poster`, hidden). */
export function paperLayer({ stage, name, depth = 1, width = 1600, paper, poster }) {
  const el = stage.layer(name, { depth, width });
  const flat = sheet("st-paper", width, paper);
  const print = sheet("st-poster", width, poster);
  Object.assign(print.style, { opacity: "0", visibility: "hidden" }); // as autoAlpha 0, without reading the page's styles
  el.append(flat, print);
  return { el, paper: flat, poster: print };
}

/** The paper's grain over the whole stage, its tile repeated, still while the layers move. Hidden: a scenario brings it
 *  in once its screen is in (a layer over the whole screen is costly while the screen fades in). */
export function grain(stage) {
  const el = Object.assign(document.createElement("div"), { className: "st-grain" });
  Object.assign(el.style, { opacity: "0", visibility: "hidden" }); // autoAlpha 0
  stage.el.append(el);
  return el;
}

/** posterize(tl, at, layers): from `at` s, each layer (back to front, `stagger` s apart) fades into its poster version,
 *  and the grain fades away. → when the last one is done (s). */
export function posterize(tl, at, layers, { stagger = 0.12 } = {}) {
  const fade = 0.4;
  layers.forEach((layer, k) => {
    const when = at + k * stagger;
    tl.to(layer.poster, { autoAlpha: 1, duration: fade, ease: "power1.inOut" }, when).set(layer.paper, { autoAlpha: 0 }, when + fade);
  });
  const grained = layers[0]?.el.closest(".st-stage")?.querySelector(".st-grain");
  if (grained) tl.to(grained, { autoAlpha: 0, duration: 0.6, ease: "power1.out" }, at);
  return at + Math.max(0, layers.length - 1) * stagger + fade;
}
