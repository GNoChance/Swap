// The gallery's room: plaster walls, a waxed herringbone floor that mirrors the room, the ceiling, and the paintings
// (relief frame, canvas, cartel, the spot's pool of light on the wall). Lighting: a soft sky, daylight from the
// skylight, and one real spot that follows the painting she's looking at; the other pools of light are painted.
import { stopLayout, corridorEnds } from "./rail.js";
import { freeTexture } from "./textures.js";

export function buildRoom(THREE, { count, room, canvases, works, Reflector, anisotropy = 1, mirrorSize }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3efe8);
  scene.fog = new THREE.Fog(0xf3efe8, 14, 46); // the far end of the corridor fades into the light
  const owned = []; // textures and materials to free on dispose (geometries are found by traversal)

  const texture = (canvas, { repeat, srgb = true } = {}) => {
    const t = new THREE.CanvasTexture(canvas);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = anisotropy;
    if (repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(...repeat);
    }
    owned.push(t);
    return t;
  };
  const material = (m) => (owned.push(m), m);

  const { zStart, zEnd } = corridorEnds(count, room);
  const length = zStart - zEnd;
  const zMid = (zStart + zEnd) / 2;

  // ── Walls, ceiling, end wall ──
  const plaster = (w, h) => material(new THREE.MeshStandardMaterial({ map: texture(canvases.plaster, { repeat: [w / 3, h / 3] }), roughness: 0.95 }));
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(length, room.height), plaster(length, room.height));
    wall.position.set((side * room.width) / 2, room.height / 2, zMid);
    wall.rotation.y = (-side * Math.PI) / 2;
    scene.add(wall);
  }
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(room.width, length), material(new THREE.MeshStandardMaterial({ color: 0xfbfaf7, roughness: 1 })));
  ceiling.position.set(0, room.height, zMid);
  ceiling.rotation.x = Math.PI / 2;
  scene.add(ceiling);
  const endWall = new THREE.Mesh(new THREE.PlaneGeometry(room.width, room.height), plaster(room.width, room.height));
  endWall.position.set(0, room.height / 2, zEnd);
  scene.add(endWall);

  // ── Floor: a mirror under a slightly see-through parquet, so the room and the visitors reflect in the wax ──
  const mirror = new Reflector(new THREE.PlaneGeometry(room.width, length), {
    clipBias: 0.003,
    textureWidth: mirrorSize.w,
    textureHeight: mirrorSize.h,
    color: 0x8a8580,
    multisample: 0,
  });
  mirror.rotation.x = -Math.PI / 2;
  mirror.position.set(0, 0, zMid);
  scene.add(mirror);
  const floor = new THREE.PlaneGeometry(room.width, length);
  const pos = floor.attributes.position;
  const uv = floor.attributes.uv;
  const TILE = 3.2; // metres per texture tile
  for (let i = 0; i < pos.count; i++) {
    const [x, y] = [pos.getX(i), pos.getY(i)];
    uv.setXY(i, (x - y) / (Math.SQRT2 * TILE), (x + y) / (Math.SQRT2 * TILE));
  }
  const parquet = new THREE.Mesh(
    floor,
    material(
      new THREE.MeshStandardMaterial({
        map: texture(canvases.parquet, { repeat: [1, 1] }),
        transparent: true,
        opacity: 0.84,
        roughness: 0.55,
      }),
    ),
  );
  parquet.rotation.x = -Math.PI / 2;
  parquet.position.set(0, 0.002, zMid);
  scene.add(parquet);

  // ── Lights ──
  scene.add(new THREE.HemisphereLight(0xffffff, 0xf3e9dc, 2.6));
  const daylight = new THREE.DirectionalLight(0xfff8ee, 1.0);
  daylight.position.set(0.6, 1, 0.3);
  scene.add(daylight);
  const spot = new THREE.SpotLight(0xffe9c8, 7, 9, 0.45, 0.7, 1.6);
  scene.add(spot, spot.target);

  // ── The paintings ──
  const canvasW = room.frameW - 0.14;
  const canvasH = (canvasW * 3) / 4;
  const bar = 0.07;
  const halo = texture(canvases.halo);
  const haloMaterial = material(new THREE.MeshBasicMaterial({ map: halo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.38 }));
  const black = material(new THREE.MeshStandardMaterial({ color: 0x1f1a17, roughness: 0.45 }));
  const gold = material(new THREE.MeshStandardMaterial({ color: 0xc9a15b, roughness: 0.32, metalness: 0.45, emissive: 0x3a2a10 }));
  const backing = material(new THREE.MeshStandardMaterial({ color: 0x2b2420, roughness: 0.8 }));
  const card = material(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }));

  const frames = [];
  const faces = []; // each painting's canvas, to put a photo on it later
  const cartels = [];
  const groups = [];
  stopLayout(count, room).forEach((s, i) => {
    const work = works[i];
    const group = new THREE.Group();
    group.position.set(s.wallX - s.side * 0.01, 0, s.z);
    group.rotation.y = (-s.side * Math.PI) / 2; // facing the corridor

    const frame = new THREE.Group();
    frame.position.y = room.paintingY;
    const back = new THREE.Mesh(new THREE.BoxGeometry(room.frameW, canvasH + bar * 2, 0.03), backing);
    back.position.z = 0.015;
    // the canvas and its cartel keep their own colours whatever the light: never washed out, always readable
    const face = new THREE.Mesh(new THREE.PlaneGeometry(canvasW, canvasH), material(new THREE.MeshBasicMaterial({ map: texture(work.painting) })));
    face.position.z = 0.032;
    frame.add(back, face);
    faces.push(face);
    const wood = work.final ? gold : black;
    for (const [w, h, x, y] of [
      [room.frameW, bar, 0, (canvasH + bar) / 2],
      [room.frameW, bar, 0, -(canvasH + bar) / 2],
      [bar, canvasH, -(canvasW + bar) / 2, 0],
      [bar, canvasH, (canvasW + bar) / 2, 0],
    ]) {
      const piece = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), wood);
      piece.position.set(x, y, 0.04);
      frame.add(piece);
    }

    const cartelH = (room.cartelW * work.cartel.height) / work.cartel.width;
    const cartel = new THREE.Mesh(new THREE.PlaneGeometry(room.cartelW, cartelH), material(new THREE.MeshBasicMaterial({ map: texture(work.cartel) })));
    cartel.position.set(0, room.cartelY, 0.012);
    const cartelBack = new THREE.Mesh(new THREE.BoxGeometry(room.cartelW + 0.02, cartelH + 0.02, 0.01), card);
    cartelBack.position.set(0, room.cartelY, 0.005);

    const pool = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.4), haloMaterial);
    pool.position.set(0, room.paintingY + 0.25, 0.004);

    group.add(pool, frame, cartelBack, cartel);
    scene.add(group);
    frames.push(frame);
    cartels.push(cartel);
    groups.push({ group, side: s.side });
  });

  /** The real spot, from the ceiling, onto painting i, or dimmed to nothing (-1). It never leaves the scene: a light
   *  appearing would recompile every shader, a hitch on the phone. */
  const SPOT = spot.intensity;
  function aimSpot(i) {
    spot.intensity = i >= 0 ? SPOT : 0;
    if (i < 0) return;
    const { group, side } = groups[i];
    spot.position.set(group.position.x - side * 1.7, room.height - 0.25, group.position.z);
    spot.target.position.set(group.position.x, room.paintingY - 0.2, group.position.z);
    spot.target.updateMatrixWorld();
  }
  aimSpot(-1);

  function dispose() {
    scene.traverse((o) => o.geometry?.dispose());
    mirror.dispose();
    owned.forEach((o) => (o.isTexture ? freeTexture(o) : o.dispose()));
  }

  /** Painting i gets a new canvas (its match's photo came, changed or went); the old one is freed. */
  function setPainting(i, canvas) {
    const m = faces[i].material;
    const old = m.map;
    m.map = texture(canvas);
    m.needsUpdate = true;
    owned.splice(owned.indexOf(old), 1);
    freeTexture(old);
  }

  return { scene, frames, cartels, aimSpot, setPainting, dispose };
}
