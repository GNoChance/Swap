// The UBB surprise, at the end of her first debrief: a fake iPhone notification drops in, the screen flashes red,
// Mini Cycy shows up in the UBB jersey… then Nini and Dédé burst in, match tickets in hand, and the tickets fill
// the screen. It plays over the debrief's ending; a tap cuts a pause short or writes the current line at once.
import { content } from "./content.js";
import { seeUbb } from "./logic.js";
import { sfx, unlockAudio, stopMusic } from "./audio.js";
import { confetti } from "./effects.js";
import { createAvatar, preloadFaces } from "./avatar.js";
import { createBubble } from "./scenes.js";
import { loadDebrief, saveDebrief } from "./state.js";
import { h, shake, flash } from "./dom.js";

const gsap = window.gsap;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const COLORS = ["#7a1733", "#1d2448", "#f3e9dc", "#c9a15b"]; // confetti: bordeaux, navy, cream, gold
const HAND = 0.18; // the ticket in their sticker's hands, against its close-up size

/** A match ticket, drawn at its close-up size. */
function ticket(t) {
  return h(
    "div",
    { class: "ubb-ticket" },
    h(
      "div",
      { class: "ubb-ticket-paper" },
      h(
        "div",
        { class: "ubb-ticket-main" },
        h("p", { class: "ubb-ticket-kicker" }, t.kicker),
        h("p", { class: "ubb-ticket-teams" }, h("span", {}, t.home), h("em", {}, "VS"), h("span", {}, t.away)),
        h("p", { class: "ubb-ticket-meta" }, t.meta),
      ),
      h("div", { class: "ubb-ticket-stub", "aria-hidden": "true" }, "🏉"),
    ),
  );
}

/** Plays over the current screen. onDone: once she taps « Retour ». preview (?ubb): nothing is saved. */
export function playUbb({ preview = false, onDone } = {}) {
  const u = content.debrief.ubb;
  const f = u.faces;
  preloadFaces(Object.values(f));
  stopMusic(0.6);

  const notif = h(
    "div",
    { class: "ubb-notif", role: "alert" },
    h("span", { class: "ubb-notif-icon", "aria-hidden": "true" }, u.notif.icon),
    h(
      "div",
      { class: "ubb-notif-body" },
      h("p", { class: "ubb-notif-head" }, h("strong", {}, u.notif.title), h("span", {}, u.notif.time)),
      h("p", { class: "ubb-notif-text" }, u.notif.text),
    ),
  );
  const alarm = h("div", { class: "ubb-alarm", "aria-hidden": "true" });
  const alarmText = h("p", { class: "ubb-alarm-text" }, u.alarm);

  // Nini, Mini Cycy, Dédé: Nini and Dédé come in tickets in hand (their stickers hold them)
  const small = Math.round(Math.min(114, (innerWidth - 28) * 0.31));
  const cycy = createAvatar({ face: f.cycy, size: Math.round(small * 1.06) });
  const nini = createAvatar({ face: f.nini, size: small });
  const dede = createAvatar({ face: f.dede, size: small });
  const tickets = [ticket(u.ticket), ticket(u.ticket)];
  const niniSlot = h("div", { class: "ubb-actor", hidden: true }, nini.el);
  const cycySlot = h("div", { class: "ubb-actor" }, cycy.el);
  const dedeSlot = h("div", { class: "ubb-actor", hidden: true }, dede.el);
  const cast = h("div", { class: "ubb-cast" }, niniSlot, cycySlot, dedeSlot);

  const bubble = createBubble();
  const speaker = h("p", { class: "secret-name" });
  const say = h("div", { class: "secret-say ubb-say" }, speaker, bubble.el);
  const stage = h("div", { class: "ubb-stage" }, h("div", { class: "intro-bubble-slot debrief-bubble" }, say), cast);
  const scene = h("div", { class: "ubb-scene" }, stage);

  const layer = h("div", { class: "ubb-tickets" });
  const closing = h(
    "div",
    { class: "ubb-closing" },
    h("p", { class: "ubb-end" }, u.end),
    h("button", { class: "btn btn-secondary", type: "button", onclick: back }, u.back),
  );
  const el = h("div", { class: "ubb", onclick: onTap }, scene, alarm, alarmText, notif, layer, closing);
  let release = null;

  /** A pause that a tap cuts short. */
  function wait(ms) {
    return new Promise((resolve) => {
      const timer = setTimeout(done, ms);
      function done() {
        clearTimeout(timer);
        release = null;
        resolve();
      }
      release = done;
    });
  }

  function onTap() {
    if (bubble.skipTyping()) return;
    release?.();
  }

  function line(who, text, side = "") {
    speaker.textContent = u.names[who];
    say.dataset.who = who;
    say.dataset.side = side;
    return bubble.say(text);
  }

  function quiet() {
    bubble.hide();
    setTimeout(() => (speaker.textContent = ""), 200); // with the bubble, not before it
  }

  /** Their tickets come out of their hands to the middle of the screen, big. */
  function closeUp() {
    const fit = Math.min(1, (innerWidth - 56) / 300);
    const spots = [
      { x: -12, y: -34, r: -7 },
      { x: 12, y: 38, r: 5 },
    ];
    [niniSlot, dedeSlot].forEach((slot, k) => {
      const t = tickets[k];
      const r = slot.getBoundingClientRect();
      layer.append(t);
      gsap.set(t, { xPercent: -50, yPercent: -50, x: r.left + r.width / 2, y: r.top + r.height * 0.78, scale: HAND, autoAlpha: 0 });
      gsap.to(t, { autoAlpha: 1, duration: 0.2, delay: k * 0.12 });
      gsap.to(t, {
        x: innerWidth / 2 + spots[k].x * fit,
        y: innerHeight * 0.4 + spots[k].y * fit,
        scale: fit,
        rotation: spots[k].r,
        duration: 0.9,
        delay: k * 0.12,
        ease: "power3.inOut",
      });
    });
    gsap.to(cast, { autoAlpha: 0.2, duration: 0.6 });
  }

  function back(e) {
    e.stopPropagation();
    sfx("tap");
    gsap.to(el, {
      autoAlpha: 0,
      duration: 0.45,
      onComplete() {
        el.remove();
        document.body.classList.remove("is-ubb");
        onDone?.();
      },
    });
  }

  async function run() {
    document.body.append(el);
    document.body.classList.add("is-ubb"); // the sound button would sit on the notification
    gsap.set([scene, alarm, alarmText, closing, cycySlot], { autoAlpha: 0 });
    gsap.set(notif, { yPercent: -170 });
    await sleep(250);

    // 1. The notification drops in
    gsap.to(notif, { yPercent: 0, duration: 0.6, ease: "back.out(1.5)" });
    sfx("notify");
    await wait(2800);

    // 2. The alarm
    gsap.to(notif, { yPercent: -170, duration: 0.35, ease: "power2.in" });
    sfx("siren");
    gsap.fromTo(alarm, { autoAlpha: 0.4 }, { autoAlpha: 0.92, duration: 0.16, repeat: 13, yoyo: true, ease: "power1.inOut" });
    gsap
      .timeline()
      .fromTo(alarmText, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "back.out(3)" })
      .to(alarmText, { scale: 1.12, duration: 0.16, repeat: 11, yoyo: true, ease: "sine.inOut" });
    const shaking = setInterval(() => shake(alarmText, 12), 520);
    await sleep(2400);
    clearInterval(shaking);

    // 3. The UBB stripes, and Mini Cycy in the jersey
    gsap.to([alarm, alarmText], { autoAlpha: 0, duration: 0.3 });
    gsap.to(scene, { autoAlpha: 1, duration: 0.4 });
    await sleep(350);
    gsap.fromTo(cycySlot, { autoAlpha: 0, y: 180 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "back.out(1.6)" });
    sfx("whoosh");
    await sleep(650);
    sfx("reveal");
    cycy.jump(24);
    await wait(900);
    cycy.set(f.cycyTalk);
    await line("cycy", u.cycyText);
    await wait(1500 + u.cycyText.length * 30);

    // 4. The twist: suddenly, very surprised
    quiet();
    await sleep(600);
    cycy.set(f.cycyTwist);
    cycy.jump(16);
    sfx("alert");
    shake(cycySlot, 8);
    await sleep(1300);

    // 5. Nini and Dédé burst in, tickets in hand; Mini Cycy slides over to the middle
    const before = cycySlot.getBoundingClientRect().left;
    niniSlot.hidden = dedeSlot.hidden = false;
    const after = cycySlot.getBoundingClientRect().left;
    gsap.from(cycySlot, { x: before - after, duration: 0.5, ease: "power2.out" });
    gsap.fromTo(niniSlot, { x: -innerWidth / 2 - 140 }, { x: 0, duration: 0.55, ease: "back.out(1.3)" });
    gsap.fromTo(dedeSlot, { x: innerWidth / 2 + 140 }, { x: 0, duration: 0.55, ease: "back.out(1.3)" });
    sfx("whoosh");
    await sleep(450);
    flash();
    shake(scene, 18);
    sfx("unlock");
    await wait(1700);

    // 6. Dédé shouts, everyone cheers, tickets up in the air
    dede.set(f.dedeShout);
    nini.set(f.niniCheer);
    cycy.set(f.cycyCheer);
    [nini, cycy, dede].forEach((a, k) => setTimeout(() => a.jump(22), k * 90));
    sfx("horn");
    sfx("crowd");
    shake(stage, 12);
    say.classList.add("is-shout");
    await line("dede", u.dedeText, "right");
    shake(bubble.el, 8);
    await wait(2400);

    // 7. Close-up on the tickets
    quiet();
    closeUp();
    if (!preview) saveDebrief(seeUbb(loadDebrief()));
    sfx("final");
    confetti(COLORS);
    setTimeout(() => confetti(COLORS), 1400);
    gsap.fromTo(closing, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, delay: 1.1, ease: "power2.out" });
  }

  run();
}

/** ?ubb: the surprise on its own, after a tap (sound needs one when the page has just loaded). Nothing is saved. */
export function ubbPreviewScreen() {
  const u = content.debrief.ubb;
  const button = h(
    "button",
    {
      class: "btn btn-primary",
      type: "button",
      onclick() {
        unlockAudio();
        sfx("tap");
        button.disabled = true;
        playUbb({ preview: true, onDone: () => (button.disabled = false) });
      },
    },
    u.preview,
  );
  const el = h("section", { class: "screen screen-debrief screen-ubb-preview" }, h("h1", { class: "debrief-end-title" }, "Surprise UBB"), button);
  return { el };
}
