// The gallery's furnishings, built in code: picture rail with hanging wires, skirting and cornice, the skylight,
// a spot fixture over each painting, velvet benches and potted plants along the walls, the velvet rope in front of
// the final, the entrance's frieze and the end wall. Repeated pieces are instanced: few draw calls on a phone.
import { stopLayout, corridorEnds } from "./rail.js";
import { wallTextCanvas } from "./textures.js";

const RAIL_Y = 3.55; // the picture rail (cimaise) the paintings hang from
const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";

function canvas(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  return c;
}

/** One leaf (monstera-ish), transparent around it. */
const leafCanvas = () =>
  canvas(128, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "#2f6b3c");
    grad.addColorStop(0.5, "#4f9a57");
    grad.addColorStop(1, "#2f6b3c");
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(w / 2, h);
    g.bezierCurveTo(-w * 0.15, h * 0.6, w * 0.1, h * 0.08, w / 2, 0);
    g.bezierCurveTo(w * 0.9, h * 0.08, w * 1.15, h * 0.6, w / 2, h);
    g.fill();
    g.strokeStyle = "rgba(220, 240, 200, 0.55)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(w / 2, h);
    g.lineTo(w / 2, h * 0.06);
    g.stroke();
  });

/** Skylight panes: white glass in a fine grid. */
const paneCanvas = () =>
  canvas(64, 128, (g, w, h) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#dcd6cc";
    g.fillRect(0, 0, w, 3);
    g.fillRect(0, 0, 3, h);
    g.fillRect(w - 3, 0, 3, h);
  });

export function addDecor(THREE, scene, { count, room, finalIndex, title, subtitle, end, endNote }) {
  const { zStart, zEnd } = corridorEnds(count, room);
  const length = zStart - zEnd;
  const zMid = (zStart + zEnd) / 2;
  const owned = [];
  const added = [];
  const own = (x) => (owned.push(x), x);
  const add = (o) => (scene.add(o), added.push(o), o);
  const texture = (c, srgb = true) => {
    const t = own(new THREE.CanvasTexture(c));
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  /** One InstancedMesh for every copy of a piece: [x, y, z, rotY, scale] each. */
  const instanced = (geometry, material, places) => {
    const mesh = new THREE.InstancedMesh(geometry, material, places.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    places.forEach(([x, y, z, rotY = 0, sx = 1, sy = sx, sz = sx, rotX = 0, rotZ = 0], i) => {
      q.setFromEuler(e.set(rotX, rotY, rotZ, "YXZ"));
      mesh.setMatrixAt(i, m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz)));
    });
    mesh.instanceMatrix.needsUpdate = true;
    return add(mesh);
  };

  const white = own(new THREE.MeshStandardMaterial({ color: 0xf4f0e9, roughness: 0.7 }));
  const stone = own(new THREE.MeshStandardMaterial({ color: 0xe2dbd0, roughness: 0.8 }));
  const brass = own(new THREE.MeshStandardMaterial({ color: 0xc9a15b, roughness: 0.3, metalness: 0.6, emissive: 0x2a1d08 }));
  const velvet = own(new THREE.MeshStandardMaterial({ color: 0x7a1733, roughness: 0.92 }));
  const darkVelvet = own(new THREE.MeshStandardMaterial({ color: 0x4a0e1f, roughness: 0.8 }));
  const wood = own(new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.6 }));
  const graphite = own(new THREE.MeshStandardMaterial({ color: 0x3a3634, roughness: 0.5, metalness: 0.3 }));
  const ceramic = own(new THREE.MeshStandardMaterial({ color: 0xefe7da, roughness: 0.45 }));

  // ── Mouldings: picture rail, skirting, cornice (one long box per wall) ──
  for (const side of [-1, 1]) {
    const x = (side * room.width) / 2;
    for (const [h, d, y, mat] of [
      [0.05, 0.035, RAIL_Y, white],
      [0.16, 0.03, 0.08, stone],
      [0.2, 0.12, room.height - 0.1, white],
    ]) {
      const piece = add(new THREE.Mesh(own(new THREE.BoxGeometry(d * 2, h, length)), mat));
      piece.position.set(x, y, zMid);
    }
  }
  const back = add(new THREE.Mesh(own(new THREE.BoxGeometry(room.width, 0.16, 0.06)), stone));
  back.position.set(0, 0.08, zEnd);

  // ── The skylight: three strips of glass panes, glowing ──
  const panes = texture(paneCanvas());
  panes.wrapS = panes.wrapT = THREE.RepeatWrapping;
  panes.repeat.set(1, length / 1.4);
  const glass = own(new THREE.MeshBasicMaterial({ map: panes }));
  for (const x of [-2.4, 0, 2.4]) {
    const strip = add(new THREE.Mesh(own(new THREE.PlaneGeometry(1, length)), glass));
    strip.rotation.x = Math.PI / 2;
    strip.position.set(x, room.height - 0.004, zMid);
  }

  const stops = stopLayout(count, room);
  // ── Over each painting: its spot fixture on the ceiling, its two hanging wires from the rail ──
  const frameTop = room.paintingY + room.frameH / 2;
  instanced(
    own(new THREE.CylinderGeometry(0.06, 0.08, 0.26, 12)),
    graphite,
    stops.map((s) => [s.wallX - s.side * 1.7, room.height - 0.2, s.z, 0, 1, 1, 1, 0, s.side * -0.7]),
  );
  instanced(
    own(new THREE.BoxGeometry(0.04, 0.12, 0.04)),
    graphite,
    stops.map((s) => [s.wallX - s.side * 1.7, room.height - 0.06, s.z]),
  );
  const wire = RAIL_Y - frameTop;
  instanced(
    own(new THREE.CylinderGeometry(0.004, 0.004, wire, 4)),
    graphite,
    stops.flatMap((s) => [-0.6, 0.6].map((dz) => [s.wallX - s.side * 0.03, frameTop + wire / 2, s.z + dz])),
  );

  // ── Along the walls, facing each painting from the other side: a bench or a plant, in turn ──
  const spots = stops.map((s) => ({ x: -s.side * (room.width / 2 - 0.55), z: s.z, side: -s.side }));
  const benches = spots.filter((_, i) => i % 2 === 0);
  const plants = spots.filter((_, i) => i % 2 === 1);
  // benches: a quilted bordeaux seat on four wooden legs, parallel to the wall
  instanced(own(new THREE.BoxGeometry(0.5, 0.14, 1.7)), velvet, benches.map((b) => [b.x, 0.45, b.z]));
  instanced(
    own(new THREE.SphereGeometry(0.022, 6, 4)),
    darkVelvet,
    benches.flatMap((b) => [-0.55, 0, 0.55].flatMap((dz) => [-0.11, 0.11].map((dx) => [b.x + dx, 0.522, b.z + dz]))),
  );
  instanced(
    own(new THREE.BoxGeometry(0.06, 0.38, 0.06)),
    wood,
    benches.flatMap((b) => [-0.75, 0.75].flatMap((dz) => [-0.19, 0.19].map((dx) => [b.x + dx, 0.19, b.z + dz]))),
  );
  // plants: a cream ceramic pot, dark soil, leaves on crossed planes around a stem
  instanced(own(new THREE.CylinderGeometry(0.27, 0.2, 0.55, 20)), ceramic, plants.map((p) => [p.x, 0.275, p.z]));
  instanced(own(new THREE.CylinderGeometry(0.25, 0.25, 0.02, 16)), own(new THREE.MeshStandardMaterial({ color: 0x3b2a1e, roughness: 1 })), plants.map((p) => [p.x, 0.53, p.z]));
  const leafMaterial = own(new THREE.MeshStandardMaterial({ map: texture(leafCanvas()), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 }));
  const leafGeometry = own(new THREE.PlaneGeometry(0.34, 0.68));
  leafGeometry.translate(0, 0.34, 0); // the leaf grows from its stem
  const leaves = [];
  plants.forEach((p, k) => {
    for (let n = 0; n < 11; n++) {
      const turn = n * 2.4 + k; // golden-ish spiral, a different one per plant
      const tilt = 0.35 + (n % 4) * 0.18;
      leaves.push([p.x + Math.cos(turn) * 0.05, 0.6 + (n % 5) * 0.16, p.z + Math.sin(turn) * 0.05, turn, 0.8 + (n % 3) * 0.18, undefined, undefined, 0, tilt]);
    }
  });
  instanced(leafGeometry, leafMaterial, leaves);

  // ── The final: a velvet rope on two brass posts, low enough to leave its cartel readable ──
  if (finalIndex >= 0) {
    const s = stops[finalIndex];
    const x = s.wallX - s.side * 1.6;
    const posts = [-0.6, 0.6].map((dz) => s.z + dz);
    instanced(own(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 10)), brass, posts.map((z) => [x, 0.375, z]));
    instanced(own(new THREE.CylinderGeometry(0.14, 0.16, 0.04, 20)), brass, posts.map((z) => [x, 0.02, z]));
    instanced(own(new THREE.SphereGeometry(0.045, 12, 8)), brass, posts.map((z) => [x, 0.77, z]));
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, 0.72, posts[0]), new THREE.Vector3(x, 0.42, s.z), new THREE.Vector3(x, 0.72, posts[1]));
    add(new THREE.Mesh(own(new THREE.TubeGeometry(curve, 24, 0.022, 8)), velvet));
  }

  // ── The entrance's frieze, the end wall ──
  const wallText = (lines, w, h) =>
    add(new THREE.Mesh(own(new THREE.PlaneGeometry(w, h)), own(new THREE.MeshBasicMaterial({ map: texture(wallTextCanvas(lines)), transparent: true, depthWrite: false }))));
  const lintel = add(new THREE.Mesh(own(new THREE.BoxGeometry(room.width, 0.7, 0.4)), white));
  lintel.position.set(0, room.height - 0.35, -3);
  const frieze = wallText(
    [
      { text: title, font: `italic 500 150px ${SERIF}`, color: "#2b1a1e" },
      { text: subtitle, font: `400 58px ${SANS}`, color: "#6b5a5e" },
    ],
    3.4,
    1.7,
  );
  frieze.position.set(0, room.height - 0.38, -2.79);
  frieze.scale.setScalar(0.38);
  const ending = wallText(
    [
      { text: end, font: `italic 500 200px ${SERIF}`, color: "#2b1a1e" },
      { text: endNote, font: `400 70px ${SANS}`, color: "#6b5a5e" },
    ],
    4,
    2,
  );
  ending.position.set(0, 2.3, zEnd + 0.02);

  return {
    dispose() {
      added.forEach((o) => scene.remove(o));
      owned.forEach((o) => o.dispose());
    },
  };
}
