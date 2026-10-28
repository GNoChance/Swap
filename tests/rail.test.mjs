// The 3D gallery's camera rail and spring: pure maths, no Three.js.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ROOM, stopLayout, framingDistance, zoomDistance, railPose, springStep } from "../js/gallery3d/rail.js";

test("rail: paintings alternate left and right, one spacing apart", () => {
  const stops = stopLayout(14);
  assert.equal(stops.length, 14);
  assert.deepEqual(stops.slice(0, 3).map((s) => s.side), [-1, 1, -1]);
  assert.equal(stops[1].z - stops[0].z, -ROOM.spacing);
  assert.equal(stops[0].wallX, -ROOM.width / 2);
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
