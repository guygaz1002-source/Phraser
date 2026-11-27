// Sound and haptics for the iOS and Android builds. The theme and effects are the files
// that `npm run sound` renders from src/soundScore.ts, the same score the web build
// synthesises live in sound.ts. Everything here is optional: if a player cannot be
// created or anything throws, the game carries on in silence.
import { useSyncExternalStore } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import gains from "../assets/sound/gains.json";
import { HAPTICS_ENABLED, MASTER_VOLUME, MUSIC_IN_GAME, MUSIC_VOLUME, SFX_VOLUME, SOUND_ENABLED, type SoundEffect } from "./soundScore";
export { HAPTICS_ENABLED, SOUND_ENABLED, type SoundEffect } from "./soundScore";

/** Phone speakers are quieter than a laptop's; lift the whole mix. Lower it if the theme is too present. */
const NATIVE_GAIN = 2.4;
const MUTE_KEY = "bible-journey:sound-muted:v1";
const files: Record<SoundEffect | "theme", number> = {
  theme: require("../assets/sound/theme.wav"),
  tap: require("../assets/sound/tap.wav"),
  correct: require("../assets/sound/correct.wav"),
  wrong: require("../assets/sound/wrong.wav"),
  coin: require("../assets/sound/coin.wav"),
  treasure: require("../assets/sound/treasure.wav"),
  levelUp: require("../assets/sound/levelUp.wav"),
  gameOver: require("../assets/sound/gameOver.wav"),
  fanfare: require("../assets/sound/fanfare.wav"),
};

export const soundAvailable = SOUND_ENABLED;

let broken = false, muted = false, inGame = false, wanted = false, foreground = AppState.currentState !== "background";
let theme: AudioPlayer | null = null;
const effects = new Map<SoundEffect, AudioPlayer>();
const listeners = new Set<() => void>();

function safely(run: () => void) {
  if (!soundAvailable || broken) return;
  try { run(); } catch { broken = true; }
}

/** Undo the normalisation of the rendered file, then apply the levels of the web mix. */
function level(name: SoundEffect | "theme", bus: number) {
  const rendered = (gains as Record<string, number>)[name] ?? 1;
  return Math.max(0, Math.min(1, NATIVE_GAIN * MASTER_VOLUME * bus / rendered));
}
const musicLevel = () => level("theme", MUSIC_VOLUME * (inGame ? MUSIC_IN_GAME : 1));

function build() {
  if (theme) return;
  // A game should stay silent when the ring switch is off, and never stop the player's own music.
  void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers", shouldPlayInBackground: false }).catch(() => {});
  theme = createAudioPlayer(files.theme);
  theme.loop = true;
  theme.volume = musicLevel();
  for (const name of Object.keys(files) as (SoundEffect | "theme")[]) {
    if (name === "theme") continue;
    const player = createAudioPlayer(files[name]);
    player.volume = level(name, SFX_VOLUME);
    effects.set(name, player);
  }
}

function syncMusic() {
  safely(() => {
    if (!theme) return;
    if (wanted && !muted && foreground) theme.play(); else theme.pause();
  });
}

/** Start the theme. On a phone no tap is needed first; the name matches the web engine. */
export function unlockSound() {
  safely(() => { build(); wanted = true; });
  syncMusic();
}

export function setSoundScene(scene: "menu" | "game") {
  inGame = scene === "game";
  safely(() => { if (theme) theme.volume = musicLevel(); });
}

let lastEffectAt = 0;
export function playSound(name: SoundEffect) {
  safely(() => {
    const player = effects.get(name);
    if (!player || muted || !foreground) return;
    const now = Date.now();
    if (name === "tap") { if (now - lastEffectAt < 150) return; } else lastEffectAt = now;
    void player.seekTo(0).catch(() => {});
    player.play();
  });
}

export type HapticCue = "tap" | "correct" | "wrong" | "levelUp";
export function haptic(cue: HapticCue) {
  if (!HAPTICS_ENABLED) return;
  try {
    const run = cue === "correct" ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : cue === "wrong" ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      : cue === "levelUp" ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      : Haptics.selectionAsync();
    void run.catch(() => {});
  } catch { /* no haptic engine */ }
}
/** Kept for callers written against the web engine. */
export function vibrate(pattern: number | number[]) { haptic(Array.isArray(pattern) ? "wrong" : "tap"); }

export function isSoundMuted() { return muted; }
export function setSoundMuted(next: boolean) {
  if (muted === next) return;
  muted = next;
  void AsyncStorage.setItem(MUTE_KEY, next ? "1" : "0").catch(() => {});
  syncMusic();
  listeners.forEach(notify => notify());
}

function subscribe(notify: () => void) { listeners.add(notify); return () => { listeners.delete(notify); }; }
export function useSoundMuted() {
  const value = useSyncExternalStore(subscribe, isSoundMuted, isSoundMuted);
  return [value, () => { setSoundMuted(!isSoundMuted()); }] as const;
}

if (soundAvailable) {
  // Read the saved choice before the first note, then begin with the title screen.
  void AsyncStorage.getItem(MUTE_KEY).then(saved => { muted = saved === "1"; listeners.forEach(notify => notify()); })
    .catch(() => {}).finally(unlockSound);
  AppState.addEventListener("change", state => { foreground = state === "active"; syncMusic(); });
}
