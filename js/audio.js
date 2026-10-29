// Every sound is synthesised with Web Audio: no files to load.
// Haptics: navigator.vibrate on Android; iOS Safari has none, so the visuals carry the feedback.

let ctx = null;
let master = null;
let muted = false;

export function setMuted(value) {
  muted = value;
  if (master) master.gain.value = muted ? 0 : 0.9;
}

/** Must run inside a user gesture (first tap). */
export function unlockAudio() {
  try {
    // iOS: play even when the ring/silent switch is on.
    if (navigator.audioSession) navigator.audioSession.type = "playback";
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
  } catch {
    ctx = null;
  }
}

// A context that is still resuming queues the sound instead of dropping it.
function ready() {
  return ctx && !muted && ctx.state !== "closed";
}

function tone({ freq, type = "sine", at = 0, dur = 0.4, gain = 0.2, attack = 0.005, glideTo, out = master }) {
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** Bell: fundamental + soft inharmonic partials. */
function bell(freq, at = 0, gain = 0.12, dur = 1.4, out = master) {
  tone({ freq, at, dur, gain, out });
  tone({ freq: freq * 2.01, at, dur: dur * 0.6, gain: gain * 0.35, out });
  tone({ freq: freq * 3.02, at, dur: dur * 0.35, gain: gain * 0.15, out });
}

function noise({ at = 0, dur = 0.12, gain = 0.25, filter = 1800, q = 0.8 }) {
  const t = ctx.currentTime + at;
  const length = Math.ceil(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = filter;
  bp.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(bp).connect(g).connect(master);
  src.start(t);
}

const sounds = {
  tap() {
    tone({ freq: 1400, dur: 0.06, gain: 0.05 });
  },
  letter() {
    tone({ freq: 880 + Math.random() * 220, type: "triangle", dur: 0.12, gain: 0.07 });
  },
  wrong() {
    tone({ freq: 330, type: "triangle", dur: 0.18, gain: 0.12 });
    tone({ freq: 247, type: "triangle", at: 0.12, dur: 0.28, gain: 0.12 });
  },
  good() {
    tone({ freq: 784, type: "triangle", dur: 0.16, gain: 0.08 });
    tone({ freq: 1175, type: "triangle", at: 0.08, dur: 0.22, gain: 0.08 });
  },
  /** Wax-seal crack + low thump: a step unlocks. */
  unlock() {
    noise({ dur: 0.09, gain: 0.35, filter: 2400 });
    noise({ at: 0.05, dur: 0.07, gain: 0.25, filter: 1200 });
    tone({ freq: 160, glideTo: 70, dur: 0.25, gain: 0.25 });
    bell(1046.5, 0.18, 0.06, 0.9);
  },
  open() {
    tone({ freq: 200, glideTo: 600, dur: 0.35, gain: 0.08 });
    noise({ dur: 0.3, gain: 0.08, filter: 900, q: 0.5 });
  },
  /** Ascending chime: the answer is revealed. */
  reveal() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => bell(f, i * 0.09, 0.09));
  },
  final() {
    [392, 523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => bell(f, i * 0.12, 0.08, 1.8));
    [0.9, 1.25, 1.6].forEach((at) => noise({ at, dur: 0.35, gain: 0.12, filter: 600, q: 0.4 }));
  },
  /** Speech bubble appears. */
  pop() {
    tone({ freq: 520, glideTo: 980, dur: 0.12, gain: 0.07 });
  },
  /** Something falls from the top of the screen. */
  whoosh() {
    const t = ctx.currentTime;
    const length = Math.ceil(ctx.sampleRate * 0.5);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + 0.45);
    const g = ctx.createGain();
    g.gain.value = 0.22;
    src.connect(bp).connect(g).connect(master);
    src.start(t);
  },
  /** A crisp packet tears open. */
  rip() {
    for (let i = 0; i < 7; i++) noise({ at: i * 0.028, dur: 0.05, gain: 0.22 - i * 0.015, filter: 2600 + i * 250, q: 1.1 });
    noise({ at: 0.2, dur: 0.25, gain: 0.12, filter: 900, q: 0.5 });
  },
  /** One crisp bouncing on the floor. */
  crunch() {
    noise({ dur: 0.045, gain: 0.08 + Math.random() * 0.08, filter: 1500 + Math.random() * 1500, q: 1.3 });
  },
  /** TV static between channels. */
  static() {
    noise({ dur: 0.5, gain: 0.22, filter: 3200, q: 0.25 });
    noise({ at: 0.12, dur: 0.3, gain: 0.12, filter: 1200, q: 0.3 });
  },
  /** Bright TV jingle. */
  jingle() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ freq: f, type: "square", at: i * 0.09, dur: 0.16, gain: 0.05 }));
    [523.25, 659.25, 783.99, 1046.5].forEach((f) => tone({ freq: f, type: "triangle", at: 0.38, dur: 0.7, gain: 0.07 }));
  },
  /** Sad trombone: wah wah wah waaah. */
  sadTrombone() {
    [[392, 0], [370, 0.32], [349.2, 0.64]].forEach(([f, at]) => tone({ freq: f, type: "sawtooth", at, dur: 0.3, gain: 0.05, attack: 0.04 }));
    tone({ freq: 330, glideTo: 290, type: "sawtooth", at: 0.96, dur: 1, gain: 0.05, attack: 0.04 });
  },
  ding() {
    bell(1568, 0, 0.1, 0.7);
  },
  dingHigh() {
    bell(2093, 0, 0.08, 0.5);
  },
  /** Snare roll for the price countdown (~2.9 s, louder and louder). */
  drumroll() {
    for (let i = 0; i < 64; i++) noise({ at: i * 0.045, dur: 0.05, gain: 0.04 + (i / 64) * 0.14, filter: 1900, q: 0.7 });
  },
  /** Cash register. */
  kaching() {
    noise({ dur: 0.08, gain: 0.25, filter: 3000, q: 0.8 });
    bell(2093, 0.06, 0.12, 1);
    bell(2637, 0.13, 0.1, 1.2);
  },
  /** Old phone ringing. */
  ring() {
    for (let i = 0; i < 16; i++) tone({ freq: i % 2 ? 1300 : 1600, type: "square", at: i * 0.05, dur: 0.05, gain: 0.035 });
  },
  /** Candies rattling in a box. */
  rattle() {
    for (let i = 0; i < 9; i++) noise({ at: Math.random() * 0.28, dur: 0.025, gain: 0.12, filter: 3800 + Math.random() * 1500, q: 2 });
  },
  /** iPhone-like notification: three quick chimes. */
  notify() {
    [1174.7, 1568, 2093].forEach((f, i) => bell(f, i * 0.11, 0.09, 0.6));
  },
  /** Alarm siren (~2.6 s): a wail up and down. */
  siren() {
    const t = ctx.currentTime;
    const dur = 2.6;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.06);
    g.gain.setValueAtTime(0.08, t + dur - 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.connect(g).connect(master);
    for (const [type, mult] of [["sawtooth", 1], ["square", 1.005]]) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(620 * mult, t);
      for (let k = 1; k * 0.65 <= dur; k++) osc.frequency.linearRampToValueAtTime((k % 2 ? 980 : 620) * mult, t + k * 0.65);
      osc.connect(lp);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }
  },
  /** « !! »: two sharp beeps, someone is very surprised. */
  alert() {
    tone({ freq: 988, type: "square", dur: 0.08, gain: 0.06 });
    tone({ freq: 1480, type: "square", at: 0.09, dur: 0.14, gain: 0.06 });
  },
  /** A soft footstep on the museum's parquet. */
  step() {
    noise({ dur: 0.07, gain: 0.07, filter: 420 + Math.random() * 120, q: 0.9 });
    tone({ freq: 95, glideTo: 70, dur: 0.08, gain: 0.05 });
  },
  /** Polite museum applause (~1.6 s). */
  applause() {
    for (let i = 0; i < 34; i++) noise({ at: Math.random() * 1.5, dur: 0.03, gain: 0.05 + Math.random() * 0.04, filter: 1400 + Math.random() * 1800, q: 1.4 });
  },
  /** « TCHAC »: a rubber stamp hits the passport (a short filtered crack, then a low thump falling away). */
  stamp() {
    noise({ dur: 0.05, gain: 0.42, filter: 3200, q: 0.9 });
    noise({ at: 0.012, dur: 0.11, gain: 0.3, filter: 1100, q: 0.6 });
    tone({ freq: 180, glideTo: 48, dur: 0.24, gain: 0.34 });
  },
  /** Cartoon boing: someone gets sent flying. */
  boing() {
    tone({ freq: 180, glideTo: 720, type: "triangle", dur: 0.4, gain: 0.14 });
    tone({ freq: 360, glideTo: 1440, at: 0.02, dur: 0.3, gain: 0.05 });
  },
  /** Stadium air horn. */
  horn() {
    [349.2, 352, 440].forEach((freq) => tone({ freq, type: "sawtooth", dur: 0.95, gain: 0.045, attack: 0.03 }));
  },
  /** A crowd roaring in the stands. */
  crowd() {
    for (let i = 0; i < 8; i++) noise({ at: i * 0.16, dur: 0.9, gain: 0.07, filter: 600 + Math.random() * 900, q: 0.35 });
  },
};

const haptics = { tap: 8, letter: 6, wrong: [30, 40, 30], good: 15, unlock: [12, 30, 20], reveal: [20, 40, 60], final: [30, 50, 30, 50, 80], rip: [20, 20, 40], stamp: [25], rattle: [10, 20, 10], notify: [30, 60, 30], siren: [200, 100, 200, 100, 200] };

// ── Music box (debrief ambiance): C · G · Am · F, arpeggiated, scheduled a little ahead ──

let music = null;

export function startMusic() {
  if (!ctx || music) return;
  const bus = ctx.createGain();
  bus.gain.setValueAtTime(0.0001, ctx.currentTime);
  bus.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.5);
  bus.connect(master);
  const chords = [
    [261.63, 329.63, 392.0],
    [196.0, 246.94, 293.66],
    [220.0, 261.63, 329.63],
    [174.61, 220.0, 261.63],
  ];
  const pattern = [0, 1, 2, 1, 0, 2, 1, 2];
  const beat = 0.42;
  let step = 0;
  let next = ctx.currentTime + 0.15;
  const timer = setInterval(() => {
    while (next < ctx.currentTime + 0.6) {
      const chord = chords[Math.floor(step / pattern.length) % chords.length];
      const at = next - ctx.currentTime;
      bell(chord[pattern[step % pattern.length]] * 2, at, 0.06, 1.6, bus);
      if (step % pattern.length === 0) tone({ freq: chord[0] / 2, at, dur: 3, gain: 0.05, attack: 0.08, out: bus });
      next += beat;
      step++;
    }
  }, 100);
  music = { bus, timer };
}

export function stopMusic(fade = 2) {
  if (!music) return;
  const { bus, timer } = music;
  music = null;
  clearInterval(timer);
  const t = ctx.currentTime;
  bus.gain.cancelScheduledValues(t);
  bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), t);
  bus.gain.exponentialRampToValueAtTime(0.0001, t + fade);
  setTimeout(() => bus.disconnect(), fade * 1000 + 200);
}

export function sfx(name) {
  if (!muted && haptics[name] && navigator.vibrate) {
    try {
      navigator.vibrate(haptics[name]);
    } catch {
      /* ignore */
    }
  }
  if (!ready()) return;
  try {
    sounds[name]?.();
  } catch {
    /* never let audio break the game */
  }
}
