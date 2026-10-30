// The cutting tool's pure parts: finding the stickers on a board (islands of opaque pixels) and naming them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cutStickers, findStickers, padBox } from "../tools/decoupe/islands.mjs";
import { boardOf, outingOf, fileNames } from "../tools/decoupe/names.mjs";

const W = 400;
const H = 330;

/** A blank board mask (0 = transparent, 255 = opaque) with a filled rectangle helper. */
function board(width = W, height = H) {
  const alpha = new Uint8Array(width * height);
  const rect = (x, y, w, h) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) alpha[j * width + i] = 255;
  };
  return { alpha, rect, width, height };
}

/** 12 stickers of 40 × 40 in 4 columns × 3 rows, each nudged up or down by 6 px (so a plain sort by y would mix a row). */
function grid() {
  const b = board();
  const cells = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const x = 30 + col * 90;
      const y = 30 + row * 90 + ((row + col) % 2 ? 6 : -6);
      b.rect(x, y, 40, 40);
      cells.push({ x, y, w: 40, h: 40 });
    }
  }
  return { ...b, cells };
}

const centre = (box) => [box.x + box.w / 2, box.y + box.h / 2];

test("decoupe: 12 islands in a 4×3 grid come back in reading order", () => {
  const { alpha, width, height, cells } = grid();
  const boxes = findStickers(alpha, width, height, {});
  assert.equal(boxes.length, 12);
  boxes.forEach((box, i) => assert.deepEqual(centre(box), centre(cells[i]), `sticker ${i}`)); // row by row, left to right
});

test("decoupe: stickers whose outlines touch are told apart", () => {
  // Like the real boards: 40 × 40 of art in a 4 px white outline, and the rows' outlines overlapping by 2 px.
  const width = 360;
  const height = 170;
  const { alpha, rect } = board(width, height);
  const white = new Uint8Array(width * height);
  const cells = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const [x, y] = [20 + col * 90, 10 + row * 46];
      rect(x, y, 48, 48);
      cells.push({ x, y });
    }
  }
  const mark = (x, y, w, h, value) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) white[j * width + i] = value;
  };
  cells.forEach(({ x, y }) => mark(x, y, 48, 48, 1));
  cells.forEach(({ x, y }) => mark(x + 4, y + 4, 40, 40, 0)); // the art
  const { boxes, owner } = cutStickers(alpha, width, height, { white });
  assert.equal(boxes.length, 12);
  boxes.forEach((box, i) => {
    const { x, y } = cells[i];
    assert.ok(Math.abs(box.x - x) <= 1 && Math.abs(box.w - 48) <= 1, `sticker ${i} across: ${JSON.stringify(box)}`);
    assert.ok(Math.abs(box.y + box.h / 2 - (y + 24)) <= 2 && box.h >= 44 && box.h <= 48, `sticker ${i} down: ${JSON.stringify(box)}`);
    assert.equal(owner[(y + 24) * width + x + 24], i + 1); // the middle of its art is its own
    assert.equal(owner[(y + 8) * width + x + 8], i + 1);
    assert.equal(owner[(y + 40) * width + x + 40], i + 1);
  });
});

test("decoupe: specks are dropped", () => {
  const { alpha, width, height, rect } = grid();
  for (let i = 0; i < 20; i++) rect(5 + (i % 10) * 38, 300 + (i % 2) * 14, 2, 2); // 2 × 2 specks at the bottom
  assert.equal(findStickers(alpha, width, height, {}).length, 12);
});

test("decoupe: a detached « ? » joins its sticker", () => {
  const { alpha, width, height, rect, cells } = grid();
  const cell = cells[5];
  rect(cell.x + 17, cell.y - 5 - 8, 6, 8); // 5 px above the sticker
  // The board is tiny next to a real one, so the speck floor is lowered to keep a 6 × 8 mark.
  const boxes = findStickers(alpha, width, height, { speck: 0.0003 });
  assert.equal(boxes.length, 12);
  assert.deepEqual(boxes[5], { x: cell.x, y: cell.y - 13, w: 40, h: 53 });
  assert.deepEqual(boxes[4], cells[4]); // the neighbours are untouched
});

test("decoupe: a standard board with 11 stickers stops", () => {
  const { alpha, width, height, rect } = board();
  for (let i = 0; i < 11; i++) rect(30 + (i % 4) * 90, 30 + Math.floor(i / 4) * 90, 40, 40);
  assert.throws(() => findStickers(alpha, width, height, {}), /11 stickers trouvés, 12 attendus/);
});

test("decoupe: a scene board counts freely", () => {
  const { alpha, width, height, rect } = board();
  for (let i = 0; i < 7; i++) rect(20 + (i % 4) * 90, 30 + Math.floor(i / 4) * 120, 40, 40);
  assert.equal(findStickers(alpha, width, height, { expected: null }).length, 7);
});

test("decoupe: padBox widens a box and stays on the board", () => {
  assert.deepEqual(padBox({ x: 50, y: 60, w: 40, h: 30 }, 6, 400, 330), { x: 44, y: 54, w: 52, h: 42 });
  assert.deepEqual(padBox({ x: 2, y: 3, w: 40, h: 30 }, 6, 400, 330), { x: 0, y: 0, w: 48, h: 39 });
  assert.deepEqual(padBox({ x: 360, y: 310, w: 40, h: 20 }, 6, 400, 330), { x: 354, y: 304, w: 46, h: 26 });
});

test("decoupe: names", () => {
  assert.deepEqual(boardOf("Kevin de dos.png"), { who: "kevin", side: "dos" });
  assert.deepEqual(boardOf("Cycy de face.png"), { who: "cycy", side: "face" });
  assert.deepEqual(boardOf("Dédé de face.png"), { who: "dede", side: "face" });
  assert.deepEqual(boardOf("Kevin Resto de face.png"), { who: "kevin-resto", side: "face" });
  assert.equal(boardOf("Nini de face (variante).png"), null);
  assert.equal(boardOf("Seat Ibiza.png"), null);
  assert.equal(boardOf("Cycy de face.jpg"), null);
  assert.equal(outingOf("hockey"), "boxers");
  assert.equal(outingOf("airbnb-1"), "airbnb");
  assert.equal(outingOf("paris"), "paris-1");
  assert.equal(outingOf("bivouac-1"), "bivouac-1");
  const poses = fileNames({ outing: "bivouac-1", who: "cycy", side: "face" });
  assert.equal(poses.length, 12);
  assert.equal(poses[0], "bivouac-1/cycy-face-joie.webp");
  assert.equal(poses[11], "bivouac-1/cycy-face-saut.webp");
  const views = fileNames({ vehicle: "seat" });
  assert.equal(views.length, 12);
  assert.equal(views[0], "vehicules/seat-trois-quarts.webp");
  assert.equal(views[9], "vehicules/seat-roule.webp");
});
