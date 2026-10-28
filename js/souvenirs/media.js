// Photos and videos, prepared on the phone before sending: a photo is shrunk to a 3072 px JPEG (sharp when zoomed
// in) and a 768 px thumbnail; a video keeps its file and gets a 768 px thumbnail from its first half second.
import { fitWithin } from "./logic.js";

export const FULL = 3072;
export const THUMB = 768;
const QUALITY = 0.82;
const SMALL_FILE = 3e6; // below this a photo is decoded at full size; above, already shrunk while decoding

function jpeg(source, w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.imageSmoothingQuality = "high";
  g.drawImage(source, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    c.toBlob((blob) => {
      c.width = c.height = 0; // iOS Safari caps a page's canvas memory
      blob ? resolve(blob) : reject(new Error("encode"));
    }, "image/jpeg", QUALITY),
  );
}

/** A big photo (48 Mpx on an iPhone) is never decoded at full size: Safari would run out of memory. */
async function decode(file) {
  const from = { imageOrientation: "from-image", resizeQuality: "high" };
  if (file.size < SMALL_FILE) return createImageBitmap(file, from);
  let bmp = await createImageBitmap(file, { ...from, resizeWidth: FULL });
  if (bmp.height > bmp.width) {
    // portrait: the height is the long side
    bmp.close();
    bmp = await createImageBitmap(file, { ...from, resizeHeight: FULL });
  }
  return bmp;
}

/** { full, thumb, width, height }: JPEG blobs, the full one at most 3072 px on its long side. */
export async function shrinkPhoto(file) {
  const bmp = await decode(file);
  try {
    const full = fitWithin(bmp.width, bmp.height, FULL);
    const thumb = fitWithin(bmp.width, bmp.height, THUMB);
    return { full: await jpeg(bmp, full.w, full.h), thumb: await jpeg(bmp, thumb.w, thumb.h), width: full.w, height: full.h };
  } finally {
    bmp.close();
  }
}

const once = (el, event, ms) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    el.addEventListener(event, () => (clearTimeout(timer), resolve()), { once: true });
    el.addEventListener("error", () => (clearTimeout(timer), reject(new Error("video"))), { once: true });
  });

/** { thumb (JPEG blob, or null if the phone can't decode it here), width, height, duration } */
export async function videoThumb(file) {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  const url = URL.createObjectURL(file);
  video.src = url;
  try {
    await once(video, "loadeddata", 6000);
    const { videoWidth: w, videoHeight: h } = video;
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    // a frame from the first half second (the very first one is often black)
    video.currentTime = Math.min(0.5, duration / 2 || 0.1);
    await once(video, "seeked", 4000).catch(() => {});
    const size = fitWithin(w, h, THUMB);
    return { thumb: w ? await jpeg(video, size.w, size.h) : null, width: w, height: h, duration };
  } catch {
    return { thumb: null, width: 0, height: 0, duration: 0 };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
