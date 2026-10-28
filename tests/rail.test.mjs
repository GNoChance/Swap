// The 3D gallery's camera rail and spring: pure maths, no Three.js.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ROOM, stopLayout, corridorEnds, framingDistance, zoomDistance, railPose, springStep } from "../js/gallery3d/rail.js";

test("rail: paintings alternate left and right, one spacing apart", () => {
  const stops = stopLayout(14);
  assert.equal(stops.length, 14);
  assert.deepEqual(stops.slice(0, 3).map((s) => s.side), [-1, 1, -1]);
  assert.equal(stops[1].z - stops[0].z, -ROOM.spacing);
  assert.equal(stops[0].wallX, -ROOM.width / 2);
});

test("rail: the corridor starts behind the entrance and ends past the last stop", () => {
  const { zStart, zEnd } = corridorEnds(14);
  assert.ok(zStart > railPose(0, 14, 0.46, 55).cam.z);
  assert.ok(zEnd < railPose(15, 14, 0.46, 55).visitors.z - 3);
});

test("rail: framing fits phones held upright and stays inside the room", () => {
  for (const aspect of [393 / 852, 375 / 667, 1440 / 900]) {
    const d = framingDistance(aspect, 55);
    assert.ok(d >= 2.5 && d <= ROOM.width - 0.6, `${aspect}: ${d}`);
    assert.ok(zoomDistance(aspect, 55) < d);
  }
  assert.ok(framingDistance(393 / 852, 55) > framingDistance(1440 / 900, 55));
});

test("rail: at a stop the whole frame is on screen, clear of the top buttons, phone upright or sideways", () => {
  for (const aspect of [393 / 852, 375 / 667, 852 / 393, 1440 / 900]) {
    const d = framingDistance(aspect, 55);
    const top = ROOM.eyeY + d * Math.tan((55 * Math.PI) / 360 + railPose(1, 14, aspect, 55).cam.pitch);
    const visible = 2 * d * Math.tan((55 * Math.PI) / 360);
    // 10 % of the screen above the frame: the « ← Accueil » and sound buttons sit there
    assert.ok(top + 1e-9 >= ROOM.paintingY + ROOM.frameH / 2 + 0.1 * visible, `${aspect}: top of the screen at ${top.toFixed(2)} m`);
  }
});

test("rail: at a stop Mini Cycy and Kevin stand under the cartel, feet on screen", () => {
  const half = Math.tan((55 * Math.PI) / 360);
  // a point's height on screen (0 top, 1 bottom), the camera looking `pitch` below the horizon
  const screenY = (y, dist, pitch) => 0.5 + (0.5 * Math.tan(Math.atan((ROOM.eyeY - y) / dist) + pitch)) / half;
  for (const aspect of [393 / 852, 375 / 667]) {
    const { cam } = railPose(1, 14, aspect, 55);
    const wall = framingDistance(aspect, 55);
    const cartelBottom = screenY(ROOM.cartelY - ROOM.cartelH / 2, wall, cam.pitch);
    const head = screenY(ROOM.visitorH, ROOM.visitorsGap, cam.pitch);
    const feet = screenY(0, ROOM.visitorsGap, cam.pitch);
    assert.ok(head > cartelBottom + 0.02, `${aspect}: head at ${head.toFixed(2)}, cartel down to ${cartelBottom.toFixed(2)}`);
    assert.ok(feet < 0.98, `${aspect}: feet at ${feet.toFixed(2)}`);
    assert.ok(feet - head > 0.2, `${aspect}: ${((feet - head) * 100).toFixed(0)} % of the screen tall`); // still big
  }
});

test("rail: zoomed in, the painting fills the width above the souvenirs panel", () => {
  const half = Math.tan((55 * Math.PI) / 360);
  for (const aspect of [393 / 852, 375 / 667]) {
    const { cam } = railPose(1, 14, aspect, 55, 1);
    const d = Math.abs(cam.x - stopLayout(14)[0].wallX);
    assert.equal(cam.pitch, 0);
    const y = (h) => 0.5 - (0.5 * (h - cam.y)) / (d * half); // 0 top, 1 bottom
    const top = y(ROOM.paintingY + ROOM.frameH / 2);
    const bottom = y(ROOM.paintingY - ROOM.frameH / 2);
    assert.ok(top > 0.06 && bottom < 0.45, `${aspect}: frame from ${top.toFixed(2)} to ${bottom.toFixed(2)}`);
    assert.ok(ROOM.frameW / (2 * d * half * aspect) > 0.85, `${aspect}: frame width`);
  }
});

test("rail: walking looks down the corridor, a stop faces its painting", () => {
  const walk = railPose(1.5, 14, 0.46, 55);
  assert.equal(walk.focus, 0);
  assert.ok(Math.abs(walk.cam.yaw) < 1e-9 && Math.abs(walk.cam.x) < 1e-9);
  const left = railPose(1, 14, 0.46, 55); // painting 0, left wall
  assert.equal(left.focus, 1);
  assert.equal(left.stop, 1);
  assert.ok(Math.abs(left.cam.yaw - Math.PI / 2) < 1e-9);
  assert.ok(Math.abs(left.cam.z - stopLayout(14)[0].z) < 1e-9);
  assert.ok(left.visitors.x < left.cam.x && left.visitors.x > -ROOM.width / 2); // between the camera and the wall
  assert.ok(Math.abs(railPose(2, 14, 0.46, 55).cam.yaw + Math.PI / 2) < 1e-9);
  assert.ok(railPose(1, 14, 0.46, 55, 1).cam.x < left.cam.x); // zoomed in: closer to the left wall
  assert.equal(railPose(0, 14, 0.46, 55).focus, 0); // entrance
  assert.equal(railPose(15, 14, 0.46, 55).focus, 0); // the end
});

test("rail: the spring settles on its target, overshooting by 5 % at most", () => {
  let s = { x: 0, v: 0 };
  let max = 0;
  for (let t = 0; t < 2.5; t += 1 / 60) {
    s = springStep(s, 3, 1 / 60);
    max = Math.max(max, s.x);
  }
  assert.ok(Math.abs(s.x - 3) < 0.01);
  assert.ok(max < 3 * 1.05);
  assert.deepEqual(springStep({ x: 1, v: 0 }, 1, 0.5), { x: 1, v: 0 }); // at rest it stays put, dt clamped
});
