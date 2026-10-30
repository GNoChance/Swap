// The Premier bivouac's intro (spec § 5), version 0: the view of the Ayous lake and the Ossau (moment 3, without its
// actors yet), the camera drifting slowly over its paper layers, then the closing poster « LACS D'AYOUS ».
import { createStage } from "../scene/stage.js";
import { grain, paperLayer } from "../scene/decor.js";
import * as props from "../scene/props.js";
import { affiche } from "../scene/recipes.js";

const gsap = window.gsap;
const LAKE = 2.5; // s on the lake before the poster
const IN = 0.6; // s: the screen faded in (main.js), the camera may move

// the lake's layers, back to front: [name, depth (its share of the camera's moves), its markup in a skin]
const LAKE_LAYERS = [
  ["ciel", 0.04, (skin) => props.sky(skin) + props.sun(skin) + props.clouds(skin)],
  ["pic", 0.15, (skin) => props.ridge(skin) + props.ossau(skin)],
  ["sapins", 0.26, (skin) => props.shores(skin)],
  ["refuge", 0.26, (skin) => props.refuge(336, 354, skin)],
  ["lac", 0.3, (skin) => props.lake(skin)],
  ["prairie", 0.55, (skin) => props.meadow(skin) + props.stream(skin)],
  ["neves", 0.55, (skin) => props.neves(skin)],
  ["tente", 0.7, (skin) => props.tent(skin)],
  ["devant", 1, (skin) => props.foreground(skin)],
];

/** mount(host, { aventure }): the lake on its stage in `host`, and its paused timeline (intros/index.js). */
export function mount(host, { aventure }) {
  const stage = createStage(host);
  const layers = LAKE_LAYERS.map(([name, depth, draw]) => paperLayer({ stage, name, depth, paper: draw("paper"), poster: draw("poster") }));
  const texture = grain(stage);
  document.fonts?.load('600 26px "Cormorant Garamond"').catch(() => {}); // the lettering's font, on its way early

  const timeline = gsap.timeline({ paused: true });
  timeline.to(texture, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, IN); // the grain and the camera, once the screen is in
  stage.pan(timeline, IN, { x: 10, zoom: 1.035, duration: LAKE - IN, ease: "sine.inOut" }); // a slow drift: the paper's depth
  affiche(timeline, LAKE, { stage, layers, aventure });

  return {
    timeline,
    ready: Promise.resolve(),
    dispose() {
      timeline.kill();
      stage.dispose();
    },
  };
}
