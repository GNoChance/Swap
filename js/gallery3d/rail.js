// The 3D gallery's camera rail: pure maths, no Three.js, so it runs (and is tested) under Node.
// Units are metres. The corridor runs down -z from the entrance; scroll position c is a float in stops:
// 0 = the entrance, 1..count = the paintings, count + 1 = the end. Walking, the camera follows Mini Cycy and Kevin
// down the middle of the corridor; at a painting's stop it turns to face that wall and backs off far enough for
// the painting and its cartel to fit the screen, the two of them standing in between.

/** Starting values, tuned on screenshots: the room, the hanging heights, where the visitors stand. */
export const ROOM = {
  width: 8,
  height: 4.4,
  spacing: 6, // between two paintings, along the corridor
  eyeY: 1.55,
  frameW: 1.9,
  frameH: 1.45,
  paintingY: 2.05, // centre of the frame
  cartelY: 0.8, // centre of the cartel
  cartelW: 1.66,
  cartelH: 0.83, // a 1024 × 512 canvas
  visitorsGap: 2.2, // camera → visitors
  visitorH: 1.15,
};

const WALK_PITCH = -0.12; // looking slightly down: the visitors' feet stay on screen

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

/** Each painting: its index, its z, its wall (-1 left, 1 right) and that wall's x. */
export function stopLayout(count, room = ROOM) {
  return Array.from({ length: count }, (_, index) => {
    const side = index % 2 ? 1 : -1;
    return { index, z: -(index + 1) * room.spacing, side, wallX: (side * room.width) / 2 };
  });
}

/** The corridor runs from a little behind the entrance to the end wall, a few metres past the last stop. */
export function corridorEnds(count, room = ROOM) {
  return { zStart: room.spacing, zEnd: -(count + 1) * room.spacing - 4 };
}

const halfTans = (aspect, vfovDeg) => {
  const tv = Math.tan((vfovDeg * Math.PI) / 360);
  return { tv, th: tv * aspect };
};

/** Camera → wall distance at a stop: the painting within 86 % of the width, painting + cartel within 62 % of the height,
 *  and far enough for the frame's top to stay on screen although the camera looks slightly down, with 10 % of the
 *  screen to spare above it (the « ← Accueil » and sound buttons). */
export function framingDistance(aspect, vfovDeg, room = ROOM) {
  const { tv, th } = halfTans(aspect, vfovDeg);
  const block = room.paintingY + room.frameH / 2 - (room.cartelY - room.cartelH / 2);
  const above = room.paintingY + room.frameH / 2 - room.eyeY;
  const top = above / (Math.tan((vfovDeg * Math.PI) / 360 + WALK_PITCH) - 0.1 * 2 * tv);
  const d = Math.max(room.frameW / (2 * th * 0.86), block / (2 * tv * 0.62), top);
  return Math.max(2.5, Math.min(room.width - 0.6, d));
}

/** « En savoir plus »: close enough for the painting to fill 95 % of the screen. */
export function zoomDistance(aspect, vfovDeg, room = ROOM) {
  const { tv, th } = halfTans(aspect, vfovDeg);
  return Math.max(room.frameW / (2 * th * 0.95), room.frameH / (2 * tv * 0.95));
}

/**
 * Where the camera and the visitors are at scroll position c. yaw: the camera looks along (-sin yaw, 0, -cos yaw).
 * focus: 1 facing a painting, 0 walking. zoom: 0..1, « En savoir plus ».
 */
export function railPose(c, count, aspect, vfovDeg, zoom = 0, room = ROOM) {
  const stop = Math.round(c);
  const walk = {
    cam: { x: 0, y: room.eyeY, z: -c * room.spacing + room.visitorsGap, yaw: 0, pitch: WALK_PITCH },
    visitors: { x: 0, z: -c * room.spacing, yaw: 0 },
  };
  if (stop < 1 || stop > count) return { ...walk, focus: 0, stop };

  const focus = smooth(clamp01(1 - Math.abs(c - stop) / 0.5));
  const s = stopLayout(count, room)[stop - 1];
  const d = lerp(framingDistance(aspect, vfovDeg, room), zoomDistance(aspect, vfovDeg, room), zoom);
  const yaw = (-s.side * Math.PI) / 2;
  const face = {
    // zoomed in, the camera rises to the painting's centre
    cam: { x: s.wallX - s.side * d, y: lerp(room.eyeY, room.paintingY, zoom), z: s.z, yaw, pitch: lerp(WALK_PITCH, 0, zoom) },
    visitors: { x: s.wallX - s.side * (d - room.visitorsGap), z: s.z, yaw },
  };
  const mix = (a, b) => Object.fromEntries(Object.keys(a).map((key) => [key, lerp(a[key], b[key], focus)]));
  return { cam: mix(walk.cam, face.cam), visitors: mix(walk.visitors, face.visitors), focus, stop };
}

/** One step of a slightly underdamped spring (semi-implicit Euler, dt clamped so a slow frame can't blow it up). */
export function springStep({ x, v }, target, dt, { stiffness = 90, damping = 0.85 } = {}) {
  const h = Math.min(dt, 1 / 30);
  const a = stiffness * (target - x) - 2 * damping * Math.sqrt(stiffness) * v;
  const nv = v + a * h;
  return { x: x + nv * h, v: nv };
}
