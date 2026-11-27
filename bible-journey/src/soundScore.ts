// The score and levels of the game's sound, shared by the web synthesiser (sound.ts),
// the native player (sound.native.ts) and the renderer that writes the native audio
// files (scripts/render-sound.ts). After changing the music or an effect, run
// `npm run sound` so the iOS and Android files match.

// ───────────────────────── Tweak here ─────────────────────────
/** Master switch. `false` removes all sound, the mute button and the tap-to-start prompt. */
export const SOUND_ENABLED = true;
/** Short vibration on answers (Android browsers only; iOS ignores it). */
export const HAPTICS_ENABLED = true;

export const MASTER_VOLUME = 0.5; // everything, 0–1
export const MUSIC_VOLUME = 0.16; // the theme, relative to master
export const SFX_VOLUME = 0.3; // effects, relative to master
export const MUSIC_IN_GAME = 0.4; // theme level while a riddle is on screen (0 = menus only)
export const TEMPO_BPM = 112; // 12 bars of 4/4 → about 26 seconds per loop at 112

// The theme: D Hijaz (Phrygian dominant) — D Eb F# G A Bb C.
// One string per bar, eight eighth-notes per bar. "D5:2" lasts two eighths, "-" is a rest.
export const MELODY = [
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
export const BASS = [
  "D3 D3", "G3 G3", "D3 D3", "Eb3 D3",
  "D3 D3", "G3 G3", "D3 D3", "Eb3 D3",
  "D3 D3", "D3 D3", "G3 G3", "D3 D3",
];
// Hand-drum pattern per bar: D = low "dum", T = high "tek", - = rest.
export const DRUMS = "D T - T D - T -";
export const DRUMS_LIFT = "D T - T D - T T"; // used for the last four bars

export type Wave = "square" | "triangle";
export type Note = [name: string, start: number, length: number]; // seconds
export const SFX: Record<string, { wave: Wave; level: number; notes: Note[] }> = {
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

const semitones: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function frequency(name: string) {
  const match = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!match) return 0;
  const midi = 12 * (Number(match[3]) + 1) + semitones[match[1]!]! + (match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}

