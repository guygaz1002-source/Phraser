// Demo helper for the web build: opening the game at /?reset=1 clears saved progress
// so every presentation starts from a clean slate. Language and sound choices are kept.
import { LEGACY_STORAGE_KEY, STORAGE_KEY, THREE_GROUP_STORAGE_KEY } from "./storage";

try {
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("reset") === "1")
    for (const key of [STORAGE_KEY, THREE_GROUP_STORAGE_KEY, LEGACY_STORAGE_KEY]) window.localStorage.removeItem(key);
} catch { /* storage unavailable: nothing to clear */ }
