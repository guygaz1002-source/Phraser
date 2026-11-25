// Retro sound for the web build, synthesised with the Web Audio API. No audio files.
// Everything here is optional: if the browser has no AudioContext, or anything throws,
// every function quietly does nothing and the game carries on in silence.
import { useSyncExternalStore } from "react";

// ───────────────────────── Tweak here ─────────────────────────
/** Master switch. `false` removes all sound, the mute button and the tap-to-start prompt. */
export const SOUND_ENABLED = true;
/** Short vibration on answers (Android browsers only; iOS ignores it). */
export const HAPTICS_ENABLED = true;

const MASTER_VOLUME = 0.5; // everything, 0–1
const MUSIC_VOLUME = 0.16; // the theme, relative to master
const SFX_VOLUME = 0.3; // effects, relative to master
const MUSIC_IN_GAME = 0.4; // theme level while a riddle is on screen (0 = menus only)
const TEMPO_BPM = 112; // 12 bars of 4/4 → about 26 seconds per loop at 112

// The theme: D Hijaz (Phrygian dominant) — D Eb F# G A Bb C.
// One string per bar, eight eighth-notes per bar. "D5:2" lasts two eighths, "-" is a rest.
const MELODY = [
  "D5:2 Eb5 D5 C5 Bb4 A4:2",
  "Bb4 A4 G4 F#4 G4:2 A4:2",
  "F#4 G4 A4 Bb4 A4:2 G4 F#4",
  "Eb4 F#4 Eb4 D4 D4:3 -",
  "D5:2 Eb5 D5 C5 Bb4 A4:2",
  "Bb4 C5 D5 Eb5 D5:2 C5 Bb4",
  "A4 Bb4 A4 G4 F#4:2 Eb4 F#4",
  "G4 F#4 Eb4 F#4 D4:3 -",
  "A4 A4 Bb4 C5 D5:2 D5 Eb5",
  "F#5:2 Eb5 D5 Eb5 D5 C5 Bb4",
  "A4 Bb4 C5 Bb4 A4 G4 F#4 G4",
  "A4:2 F#4 Eb4 D4:2 A4 C5",
];
// Bass root for the first and second half of each bar (triangle wave).
const BASS = [
  "D3 D3", "G3 G3", "D3 D3", "Eb3 D3",
  "D3 D3", "G3 G3", "D3 D3", "Eb3 D3",
  "D3 D3", "D3 D3", "G3 G3", "D3 D3",
];
// Hand-drum pattern per bar: D = low "dum", T = high "tek", - = rest.
const DRUMS = "D T - T D - T -";
const DRUMS_LIFT = "D T - T D - T T"; // used for the last four bars

type Wave = "square" | "triangle";
type Note = [name: string, start: number, length: number]; // seconds
const SFX: Record<string, { wave: Wave; level: number; notes: Note[] }> = {
  tap: { wave: "square", level: 0.35, notes: [["A5", 0, 0.035]] },
  correct: { wave: "square", level: 0.8, notes: [["D5", 0, 0.07], ["F#5", 0.07, 0.07], ["A5", 0.14, 0.07], ["D6", 0.21, 0.2]] },
  wrong: { wave: "square", level: 0.7, notes: [["A3", 0, 0.1], ["Eb3", 0.11, 0.22]] },
  coin: { wave: "square", level: 0.55, notes: [["A5", 0, 0.05], ["D6", 0.05, 0.18]] },
  treasure: { wave: "triangle", level: 1, notes: [["A5", 0, 0.05], ["D6", 0.05, 0.05], ["F#6", 0.1, 0.05], ["A6", 0.15, 0.22]] },
  levelUp: { wave: "square", level: 0.8, notes: [["D5", 0, 0.09], ["D5", 0.11, 0.09], ["F#5", 0.22, 0.09], ["A5", 0.33, 0.09], ["D6", 0.44, 0.34], ["A5", 0.44, 0.34]] },
  gameOver: { wave: "square", level: 0.7, notes: [["A4", 0, 0.13], ["G4", 0.14, 0.13], ["F#4", 0.28, 0.13], ["Eb4", 0.42, 0.13], ["D4", 0.56, 0.42]] },
  fanfare: { wave: "square", level: 0.8, notes: [["D5", 0, 0.1], ["F#5", 0.12, 0.1], ["A5", 0.24, 0.1], ["D6", 0.36, 0.2], ["C6", 0.6, 0.1], ["D6", 0.72, 0.5], ["A5", 0.72, 0.5], ["F#5", 0.72, 0.5]] },
};
export type SoundEffect = "tap" | "correct" | "wrong" | "coin" | "treasure" | "levelUp" | "gameOver" | "fanfare";
// ──────────────────────────────────────────────────────────────

const MUTE_KEY = "bible-journey:sound-muted:v1";
const STEPS_PER_BAR = 8;
const LOOKAHEAD = 0.25; // seconds of music scheduled ahead of the clock
const semitones: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function frequency(name: string) {
  const match = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!match) return 0;
  const midi = 12 * (Number(match[3]) + 1) + semitones[match[1]!]! + (match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}

// Lay the melody out on the eighth-note grid once.
const lead = new Map<number, { hz: number; steps: number }>();
MELODY.forEach((bar, index) => {
  let step = index * STEPS_PER_BAR;
  for (const token of bar.split(/\s+/).filter(Boolean)) {
    const [name = "-", length] = token.split(":");
    const steps = Number(length) || 1;
    if (name !== "-") lead.set(step, { hz: frequency(name), steps });
    step += steps;
  }
});
const TOTAL_STEPS = MELODY.length * STEPS_PER_BAR;

const AudioContextClass: typeof AudioContext | undefined = typeof globalThis === "undefined" ? undefined
  : (globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
    ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
const hasPage = typeof document !== "undefined";
/** True when this platform can make sound at all (web with Web Audio). */
export const soundAvailable = SOUND_ENABLED && hasPage && !!AudioContextClass;

let context: AudioContext | null = null;
let master: GainNode | null = null, musicBus: GainNode | null = null, sfxBus: GainNode | null = null, echo: DelayNode | null = null;
let noise: AudioBuffer | null = null;
let broken = false, muted = false, inGame = false, wanted = false;
let timer: ReturnType<typeof setInterval> | undefined, step = 0, nextStepAt = 0, lastEffectAt = -1;
const listeners = new Set<() => void>();

try { muted = hasPage && globalThis.localStorage?.getItem(MUTE_KEY) === "1"; } catch { /* private mode: keep the default */ }

function safely(run: () => void) {
  if (!soundAvailable || broken) return;
  try { run(); } catch { broken = true; stopMusic(); }
}

function build() {
  if (context || !AudioContextClass) return;
  context = new AudioContextClass();
  const limiter = context.createDynamicsCompressor();
  limiter.connect(context.destination);
  master = context.createGain();
  master.gain.value = muted ? 0 : MASTER_VOLUME;
  master.connect(limiter);
  const soften = context.createBiquadFilter();
  soften.type = "lowpass"; soften.frequency.value = 3200;
  soften.connect(master);
  musicBus = context.createGain();
  musicBus.gain.value = 0;
  musicBus.connect(soften);
  sfxBus = context.createGain();
  sfxBus.gain.value = SFX_VOLUME;
  sfxBus.connect(master);
  // A quiet dotted-eighth echo on the melody.
  echo = context.createDelay(1);
  echo.delayTime.value = (60 / TEMPO_BPM) * 0.75;
  const feedback = context.createGain(), wet = context.createGain();
  feedback.gain.value = 0.26; wet.gain.value = 0.2;
  echo.connect(feedback); feedback.connect(echo); echo.connect(wet); wet.connect(musicBus);
  noise = context.createBuffer(1, context.sampleRate / 2, context.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
}

function tone(to: AudioNode, wave: Wave, hz: number, at: number, seconds: number, level: number, also?: AudioNode | null) {
  if (!context || !hz) return;
  const oscillator = context.createOscillator(), gain = context.createGain();
  oscillator.type = wave; oscillator.frequency.value = hz;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(level, at + 0.006);
  gain.gain.setValueAtTime(level * 0.7, at + Math.max(0.012, seconds * 0.6));
  gain.gain.linearRampToValueAtTime(0, at + seconds);
  oscillator.connect(gain); gain.connect(to); if (also) gain.connect(also);
  oscillator.start(at); oscillator.stop(at + seconds + 0.02);
}

function drum(kind: string, at: number) {
  if (!context || !musicBus) return;
  if (kind === "D") {
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(210, at);
    oscillator.frequency.exponentialRampToValueAtTime(95, at + 0.11);
    gain.gain.setValueAtTime(0.9, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.16);
    oscillator.connect(gain); gain.connect(musicBus);
    oscillator.start(at); oscillator.stop(at + 0.18);
  } else if (kind === "T" && noise) {
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    source.buffer = noise;
    filter.type = "highpass"; filter.frequency.value = 4500;
    gain.gain.setValueAtTime(0.28, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
    source.connect(filter); filter.connect(gain); gain.connect(musicBus);
    source.start(at); source.stop(at + 0.06);
  }
}

function scheduleStep(index: number, at: number) {
  if (!musicBus) return;
  const eighth = 60 / TEMPO_BPM / 2, bar = Math.floor(index / STEPS_PER_BAR), beat = index % STEPS_PER_BAR;
  const note = lead.get(index);
  if (note) tone(musicBus, "square", note.hz, at, note.steps * eighth * 0.92, 0.42, echo);
  const [first = "D3", second = first] = (BASS[bar] ?? "D3 D3").split(" ");
  if (beat === 0) tone(musicBus, "triangle", frequency(first), at, eighth * 2.6, 0.75);
  else if (beat === 3) tone(musicBus, "triangle", frequency(first), at, eighth * 0.9, 0.6);
  else if (beat === 4) tone(musicBus, "triangle", frequency(second), at, eighth * 1.8, 0.75);
  else if (beat === 6) tone(musicBus, "triangle", frequency(second) * 1.5, at, eighth * 1.6, 0.55);
  drum((bar >= MELODY.length - 4 ? DRUMS_LIFT : DRUMS).split(" ")[beat] ?? "-", at);
}

function musicLevel() { return MUSIC_VOLUME * (inGame ? MUSIC_IN_GAME : 1); }

function startMusic() {
  safely(() => {
    if (timer !== undefined || muted || !context || !musicBus) return;
    const now = context.currentTime, eighth = 60 / TEMPO_BPM / 2;
    step = 0; nextStepAt = now + 0.08;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setValueAtTime(0, now);
    musicBus.gain.linearRampToValueAtTime(musicLevel(), now + 0.5);
    const pump = () => safely(() => {
      if (!context) return;
      while (nextStepAt < context.currentTime + LOOKAHEAD) {
        scheduleStep(step, nextStepAt);
        step = (step + 1) % TOTAL_STEPS;
        nextStepAt += eighth;
      }
    });
    pump();
    timer = setInterval(pump, 50);
  });
}

function stopMusic() {
  if (timer !== undefined) clearInterval(timer);
  timer = undefined;
  try {
    if (context && musicBus) musicBus.gain.setTargetAtTime(0, context.currentTime, 0.05);
  } catch { /* nothing to fade */ }
}

/** Call from a tap or key press. Browsers only allow audio to start inside a user gesture. */
export function unlockSound() {
  safely(() => {
    build();
    wanted = true;
    if (!context) return;
    if (context.state !== "running" && !document.hidden) void context.resume().catch(() => {});
    if (!muted) startMusic();
  });
}

/** Lower the theme while a riddle is on screen, and bring it back on the menus. */
export function setSoundScene(scene: "menu" | "game") {
  inGame = scene === "game";
  safely(() => {
    if (context && musicBus && timer !== undefined) musicBus.gain.setTargetAtTime(musicLevel(), context.currentTime, 0.25);
  });
}

export function playSound(name: SoundEffect) {
  safely(() => {
    const effect = SFX[name];
    if (!effect || !context || !sfxBus || muted || document.hidden) return;
    const now = context.currentTime;
    // A press that is answered by its own sound does not also click.
    if (name === "tap") { if (now - lastEffectAt < 0.15) return; } else lastEffectAt = now;
    for (const [note, start, length] of effect.notes) tone(sfxBus, effect.wave, frequency(note), now + 0.01 + start, length, effect.level);
  });
}

export function vibrate(pattern: number | number[]) {
  if (!HAPTICS_ENABLED) return;
  try { (globalThis.navigator as Navigator | undefined)?.vibrate?.(pattern); } catch { /* unsupported */ }
}

export function isSoundMuted() { return muted; }
export function setSoundMuted(next: boolean) {
  if (muted === next) return;
  muted = next;
  try { globalThis.localStorage?.setItem(MUTE_KEY, next ? "1" : "0"); } catch { /* not saved; still applies to this visit */ }
  safely(() => {
    if (context && master) master.gain.setTargetAtTime(next ? 0 : MASTER_VOLUME, context.currentTime, 0.03);
    if (next) stopMusic(); else if (wanted) startMusic();
  });
  listeners.forEach(notify => notify());
}

function subscribe(notify: () => void) { listeners.add(notify); return () => { listeners.delete(notify); }; }
/** `[muted, toggle]` for the speaker button. */
export function useSoundMuted() {
  const value = useSyncExternalStore(subscribe, isSoundMuted, isSoundMuted);
  return [value, () => { unlockSound(); setSoundMuted(!isSoundMuted()); }] as const;
}

if (soundAvailable) {
  try {
    // The first tap anywhere unlocks audio; later taps revive it after a phone call or a tab switch.
    for (const type of ["pointerup", "touchend", "keydown"]) document.addEventListener(type, unlockSound, { capture: true, passive: true });
    // Capture phase: react-native-web stops click propagation on its buttons.
    document.addEventListener("click", event => {
      unlockSound();
      const target = event.target instanceof Element ? event.target.closest('[role="button"],[role="radio"],button,a[href]') : null;
      // Wait for the press handler, so an answer's own sound replaces the click.
      if (target && target.getAttribute("aria-disabled") !== "true") setTimeout(() => playSound("tap"), 0);
    }, { capture: true });
    document.addEventListener("visibilitychange", () => safely(() => {
      if (!context) return;
      if (document.hidden) void context.suspend().catch(() => {});
      else if (wanted) void context.resume().catch(() => {});
    }));
  } catch { broken = true; }
}
