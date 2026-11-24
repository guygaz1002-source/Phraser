import { newGame, restore } from "./game";
import type { Character, Game } from "./types";
export const STORAGE_KEY = "bible-journey:tiers:v4";
export const THREE_GROUP_STORAGE_KEY = "bible-journey:tiers:v3";
export const LEGACY_STORAGE_KEY = "bible-journey:tiers:v2";
export const RECOVERY_BACKUP_PREFIX = `${STORAGE_KEY}:recovery:`;
export interface StoragePort {
  setItem(key: string, value: string): Promise<unknown>;
}
export interface ReadableStoragePort extends StoragePort {
  getItem(key: string): Promise<string | null>;
}
export type CorruptSave = { key: string; raw: string };
export type LoadResult =
  | { kind: "ready"; game: Game }
  | { kind: "read" }
  | { kind: "corrupt"; save: CorruptSave };

async function firstSave(storage: ReadableStoragePort) {
  for (const key of [STORAGE_KEY, THREE_GROUP_STORAGE_KEY, LEGACY_STORAGE_KEY]) {
    const raw = await storage.getItem(key);
    if (raw !== null) return { key, raw };
  }
  return null;
}

export async function loadSavedGame(storage: ReadableStoragePort, catalog: Character[]): Promise<LoadResult> {
  let save;
  try {
    save = await firstSave(storage);
  } catch {
    return { kind: "read" };
  }
  if (!save) return { kind: "ready", game: newGame() };
  const { key, raw } = save;
  try {
    // An empty value is damaged stored content, not an absent save.
    if (raw === "") throw Error("Empty save");
    return { kind: "ready", game: restore(raw, catalog) };
  } catch {
    return { kind: "corrupt", save: { key, raw } };
  }
}

// Called only after the player explicitly confirms starting over. Keep the exact
// original value in a separate, verified backup before replacing the active save.
export async function recoverSavedGame(storage: ReadableStoragePort, corrupt: CorruptSave): Promise<Game> {
  const unchanged = async () => {
    const latest = await firstSave(storage);
    if (latest?.key !== corrupt.key || latest.raw !== corrupt.raw)
      throw Error("The saved game changed. Load it again before recovery.");
  };
  await unchanged();
  const base = `${RECOVERY_BACKUP_PREFIX}${Date.now()}`;
  let backupKey = base, suffix = 0;
  while (await storage.getItem(backupKey) !== null) backupKey = `${base}:${++suffix}`;
  await storage.setItem(backupKey, corrupt.raw);
  if (await storage.getItem(backupKey) !== corrupt.raw) throw Error("The recovery backup could not be verified.");
  await unchanged();
  const game = newGame();
  await storage.setItem(STORAGE_KEY, JSON.stringify(game));
  return game;
}

// Serialize writes so rapid typing, purchases, and navigation cannot save an older balance last.
export function createSaveQueue(storage: StoragePort) {
  let tail = Promise.resolve();
  return (game: Game) => {
    const snapshot = JSON.stringify(game);
    const next = tail
      .catch(() => undefined)
      .then(() => storage.setItem(STORAGE_KEY, snapshot))
      .then(() => undefined);
    tail = next;
    return next;
  };
}
