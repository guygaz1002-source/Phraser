// Renders the theme and the sound effects of src/soundScore.ts to WAV files for the
// native builds, which have no Web Audio synthesiser. The web build keeps synthesising
// live in src/sound.ts; this script mirrors that signal chain offline.
// Usage: npm run sound
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { BASS, DRUMS, DRUMS_LIFT, MELODY, SFX, TEMPO_BPM, frequency, type Wave } from "../src/soundScore";

const RATE = 44100, STEPS_PER_BAR = 8, HEADROOM = 0.89;
const out = path.resolve(__dirname, "../assets/sound");

class Track {
  readonly samples: Float32Array;
  constructor(seconds: number) { this.samples = new Float32Array(Math.ceil(seconds * RATE)); }
  add(index: number, value: number) { if (index >= 0 && index < this.samples.length) this.samples[index] = this.samples[index]! + value; }
}

// The oscillator envelope of tone() in sound.ts: quick attack, a step down to 70%, a linear release.
function envelope(t: number, seconds: number, level: number) {
  const hold = Math.max(0.012, seconds * 0.6);
  if (t < 0 || t >= seconds) return 0;
  if (t < 0.006) return level * t / 0.006;
  if (t < hold) return level;
  return level * 0.7 * (1 - (t - hold) / (seconds - hold));
}

// Band-limited square (PolyBLEP), so high notes stay clean like the browser's oscillator.
function square(phase: number, step: number) {
  const blep = (p: number) => p < step ? (p / step) * 2 - (p / step) ** 2 - 1
    : p > 1 - step ? ((p - 1) / step) ** 2 + ((p - 1) / step) * 2 + 1 : 0;
  return (phase < 0.5 ? 1 : -1) + blep(phase) - blep((phase + 0.5) % 1);
}
const triangle = (phase: number) => 4 * Math.abs(phase - 0.5) - 1;

function tone(tracks: Track[], wave: Wave, hz: number, at: number, seconds: number, level: number) {
  if (!hz) return;
  const first = Math.round(at * RATE), count = Math.ceil(seconds * RATE), step = hz / RATE;
  for (let i = 0; i < count; i++) {
    const phase = (i * step + (wave === "triangle" ? 0.25 : 0)) % 1;
    const value = (wave === "square" ? square(phase, step) : -triangle(phase)) * envelope(i / RATE, seconds, level);
    for (const track of tracks) track.add(first + i, value);
  }
}

function drum(track: Track, kind: string, at: number) {
  const first = Math.round(at * RATE);
  if (kind === "D") {
    let phase = 0;
    for (let i = 0; i < 0.18 * RATE; i++) {
      const t = i / RATE;
      const hz = t < 0.11 ? 210 * (95 / 210) ** (t / 0.11) : 95;
      phase = (phase + hz / RATE) % 1;
      const gain = t < 0.16 ? 0.9 * (0.001 / 0.9) ** (t / 0.16) : 0;
      track.add(first + i, -triangle((phase + 0.25) % 1) * gain);
    }
  } else if (kind === "T") {
    // White noise through a one-pole high-pass near 4.5 kHz.
    let seed = 0x2545f491 ^ first, low = 0;
    const alpha = Math.exp(-2 * Math.PI * 4500 / RATE);
    for (let i = 0; i < 0.06 * RATE; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      const white = (seed >>> 0) / 2147483648 - 1;
      low = low * alpha + white * (1 - alpha);
      const t = i / RATE, gain = t < 0.05 ? 0.28 * (0.001 / 0.28) ** (t / 0.05) : 0;
      track.add(first + i, (white - low) * gain);
    }
  }
}

function lowpass(samples: Float32Array, hz: number) {
  // Second-order Butterworth low-pass, like the BiquadFilter that softens the theme.
  const w = 2 * Math.PI * hz / RATE, cos = Math.cos(w), alpha = Math.sin(w) / (2 * Math.SQRT1_2);
  const b0 = (1 - cos) / 2 / (1 + alpha), b1 = (1 - cos) / (1 + alpha), b2 = b0;
  const a1 = -2 * cos / (1 + alpha), a2 = (1 - alpha) / (1 + alpha);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i]!, y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y; samples[i] = y;
  }
}

function renderTheme() {
  const eighth = 60 / TEMPO_BPM / 2, steps = MELODY.length * STEPS_PER_BAR, loop = steps * eighth;
  // Two passes: the second one already carries the echo tail of the first, so it loops without a seam.
  const dry = new Track(loop * 2), send = new Track(loop * 2);
  const lead = new Map<number, { hz: number; steps: number }>();
  MELODY.forEach((bar, index) => {
    let step = index * STEPS_PER_BAR;
    for (const token of bar.split(/\s+/).filter(Boolean)) {
      const [name = "-", length] = token.split(":");
      const count = Number(length) || 1;
      if (name !== "-") lead.set(step, { hz: frequency(name), steps: count });
      step += count;
    }
  });
  for (let pass = 0; pass < 2; pass++) for (let index = 0; index < steps; index++) {
    const at = pass * loop + index * eighth, bar = Math.floor(index / STEPS_PER_BAR), beat = index % STEPS_PER_BAR;
    const note = lead.get(index);
    if (note) tone([dry, send], "square", note.hz, at, note.steps * eighth * 0.92, 0.42);
    const [first = "D3", second = first] = (BASS[bar] ?? "D3 D3").split(" ");
    if (beat === 0) tone([dry], "triangle", frequency(first), at, eighth * 2.6, 0.75);
    else if (beat === 3) tone([dry], "triangle", frequency(first), at, eighth * 0.9, 0.6);
    else if (beat === 4) tone([dry], "triangle", frequency(second), at, eighth * 1.8, 0.75);
    else if (beat === 6) tone([dry], "triangle", frequency(second) * 1.5, at, eighth * 1.6, 0.55);
    drum(dry, (bar >= MELODY.length - 4 ? DRUMS_LIFT : DRUMS).split(" ")[beat] ?? "-", at);
  }
  // Dotted-eighth echo on the melody: feedback 0.26, wet 0.2.
  const delay = Math.round((60 / TEMPO_BPM) * 0.75 * RATE), echo = new Float32Array(send.samples.length);
  for (let i = delay; i < echo.length; i++) echo[i] = send.samples[i - delay]! + 0.26 * echo[i - delay]!;
  const mix = new Float32Array(dry.samples.length);
  for (let i = 0; i < mix.length; i++) mix[i] = dry.samples[i]! + 0.2 * echo[i]!;
  lowpass(mix, 3200);
  const length = Math.round(loop * RATE);
  return mix.slice(length, length * 2);
}

function renderEffect(name: string) {
  const effect = SFX[name]!;
  const seconds = Math.max(...effect.notes.map(([, start, length]) => start + length)) + 0.04;
  const track = new Track(seconds);
  for (const [note, start, length] of effect.notes) tone([track], effect.wave, frequency(note), 0.01 + start, length, effect.level);
  return track.samples;
}

/** Scale to a shared headroom and report the gain, so the native player can restore the web mix. */
function normalise(samples: Float32Array) {
  let peak = 0;
  for (const value of samples) peak = Math.max(peak, Math.abs(value));
  const gain = peak ? HEADROOM / peak : 1;
  for (let i = 0; i < samples.length; i++) samples[i] = samples[i]! * gain;
  return gain;
}

function wav(samples: Float32Array) {
  const data = Buffer.alloc(44 + samples.length * 2);
  data.write("RIFF", 0); data.writeUInt32LE(36 + samples.length * 2, 4); data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(RATE, 24); data.writeUInt32LE(RATE * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write("data", 36); data.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i]!)) * 32767), 44 + i * 2);
  return data;
}

mkdirSync(out, { recursive: true });
const gains: Record<string, number> = {};
const theme = renderTheme();
gains.theme = normalise(theme);
writeFileSync(path.join(out, "theme.wav"), wav(theme));
for (const name of Object.keys(SFX)) {
  const samples = renderEffect(name);
  gains[name] = normalise(samples);
  writeFileSync(path.join(out, name + ".wav"), wav(samples));
}
const rounded = Object.fromEntries(Object.entries(gains).map(([name, gain]) => [name, Math.round(gain * 1000) / 1000]));
writeFileSync(path.join(out, "gains.json"), JSON.stringify(rounded, null, 2) + "\n");
console.log("Wrote", Object.keys(gains).length, "sound files to", out, rounded);
