import type { Puzzle, PuzzleProgress } from "./types";

export const newPuzzle = (): PuzzleProgress => ({
  image: 0,
  hint: false,
  letter: false,
  revealed: false,
  resolved: false,
  earned: 0,
  draft: "",
});

export function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[\u05be\u2010-\u2015-]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim()
    .replace(/^the\s+/, "")
    .replace(/\s+/g, " ");
}
/** Spoken Storybook labels mean the same answer as tapping that picture. */
export function spokenPictureAnswer(value: string, puzzle: Puzzle) {
  const normalized = normalize(value);
  if (!normalized) return value;
  const index = puzzle.choiceLabelsKids.findIndex(
    (label) => normalize(label) === normalized,
  );
  return index >= 0 ? (puzzle.choicesKids[index] ?? value) : value;
}
export function distance(a: string, b: string) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < b.length; j++)
      next[j + 1] = Math.min(
        next[j]! + 1,
        row[j + 1]! + 1,
        row[j]! + (a[i] === b[j] ? 0 : 1),
      );
    row = next;
  }
  return row[b.length]!;
}
export function matches(guess: string, p: Puzzle) {
  const value = normalize(guess);
  if (p.partialAnswers?.some(a => normalize(a) === value)) return false;
  if (!value) return false;
  const accepted = [p.answer, ...p.aliases].map(normalize);
  if (accepted.includes(value)) return true;
  // Hebrew event names can differ by one meaningful letter (לידת / חידת).
  // Explicit aliases cover Hebrew variants; fuzzy edits could solve a different story.
  if (/[\u0590-\u05ff]/.test(value)) return false;
  return accepted.some(answer => distance(value, answer) <= 2);
}
