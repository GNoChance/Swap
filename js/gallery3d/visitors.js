// Mini Cycy and Kevin in the 3D gallery: their back-view stickers as two flat cut-outs standing on the parquet,
// always turned to the camera, a soft round shadow under each, mirrored in the waxed floor. Walking they bob along
// out of step; in front of a painting their sticker changes with the match (content.museum.faces).
import { ROOM } from "./rail.js";
import { shadowCanvas, freeTexture } from "./textures.js";

/** One step of swapping places (0 → 1 or back) in `duration` seconds, whatever the frame rate. */
export function swapStep(x, target, dt, duration = 0.35) {
  const step = dt / duration;
  return target > x ? Math.min(target, x + step) : Math.max(target, x - step);
}

const SPREAD = 0.27; // each side of the pose's centre: shoulder to shoulder, slightly overlapping

function loadTexture(THREE, src) {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(
      src,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        resolve(t);
      },
      undefined,
      () => resolve(null), // a missing sticker: that pose keeps the previous one
    );
  });
}

export async function createVisitors(THREE, { faces, room = ROOM }) {
  const keys = Object.keys(faces.cycy);
  const textures = {};
  await Promise.all(
    ["cycy", "kevin"].flatMap((who) =>
      keys.map(async (key) => {
        textures[`${who}:${key}`] = await loadTexture(THREE, `assets/cyrielle/${faces[who][key]}.webp`);
      }),
    ),
  );

  const group = new THREE.Group();
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas());
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
  const shadowGeometry = new THREE.PlaneGeometry(0.75, 0.32);
  const people = ["cycy", "kevin"].map((who, k) => {
    const material = new THREE.MeshBasicMaterial({ alphaTest: 0.5, side: THREE.DoubleSide });
    const geometry = new THREE.PlaneGeometry(1, 1);
    geometry.translate(0, 0.5, 0); // standing on their feet
    const body = new THREE.Mesh(geometry, material);
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.006;
    const holder = new THREE.Group(); // turned to the camera; the body bobs inside it
    holder.add(body);
    group.add(holder, shadow);
    return { who, body, holder, shadow, material, slot: k ? 1 : -1, face: null };
  });

  let current = "look";
  let walk = false;
  let swapped = 0; // 0 → 1: they swap places
  let swapTarget = 0;
  let jumpAt = -10;
  let lastTime = null;

  function set(key) {
    current = key;
    for (const p of people) {
      const t = textures[`${p.who}:${key}`];
      if (!t) continue;
      p.material.map = t;
      p.material.needsUpdate = true;
      p.face = faces[p.who][key];
      // the stickers keep their proportions, all the same height
      const h = room.visitorH;
      p.body.scale.set((h * t.image.width) / t.image.height, h, 1);
    }
  }
  set(current);

  const v = new THREE.Vector3();

  /** Place them for this frame. Returns true while something still moves (bobbing, a jump, swapping places). */
  function update(time, pose, camera) {
    const dt = lastTime === null ? 0 : Math.min(0.1, Math.max(0, time - lastTime));
    lastTime = time;
    swapped = swapStep(swapped, swapTarget, dt);
    // across the camera's view: perpendicular to where it looks
    const across = { x: Math.cos(pose.yaw), z: -Math.sin(pose.yaw) };
    let moving = walk || swapped !== swapTarget;
    for (const p of people) {
      const slot = p.slot * (1 - 2 * swapped);
      const x = pose.x + across.x * slot * SPREAD;
      const z = pose.z + across.z * slot * SPREAD;
      p.holder.position.set(x, 0, z);
      p.shadow.position.set(x, 0.006, z);
      // turned to the camera around the vertical axis
      v.set(camera.position.x - x, 0, camera.position.z - z);
      p.holder.rotation.y = Math.atan2(v.x, v.z);
      let lift = 0;
      let tilt = 0;
      if (walk) {
        const phase = time * 7.5 + (p.slot > 0 ? Math.PI / 2 : 0);
        lift = Math.abs(Math.sin(phase)) * 0.08;
        tilt = Math.sin(phase) * 0.06;
      }
      const sinceJump = time - jumpAt - (p.slot > 0 ? 0.11 : 0);
      if (sinceJump >= 0 && sinceJump < 0.5) {
        lift += Math.sin((sinceJump / 0.5) * Math.PI) * 0.28;
        moving = true;
      }
      p.body.position.y = lift;
      p.body.rotation.z = tilt;
      p.shadow.scale.setScalar(1 - lift * 1.2);
    }
    return moving;
  }

  return {
    group,
    /** A key of content.museum.faces. */
    set,
    walking(on) {
      walk = on;
      if (on) set("walk");
    },
    /** At the end: they swap places, their kisses fly towards each other. */
    swap(on) {
      swapTarget = on ? 1 : 0;
    },
    /** Both jump, Kevin a beat after her; time: the same clock as update(). */
    jump(time) {
      jumpAt = time;
    },
    faces: () => people.map((p) => p.face).join(" "),
    isSwapped: () => swapTarget === 1,
    current: () => current,
    update,
    dispose() {
      Object.values(textures).forEach((t) => t?.dispose());
      freeTexture(shadowTexture);
      shadowMaterial.dispose();
      shadowGeometry.dispose();
      people.forEach((p) => (p.material.dispose(), p.body.geometry.dispose()));
    },
  };
}
