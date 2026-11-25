import { catalogFor } from "./catalogs";
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

export type GuessResult = "correct" | "near" | "wrong";

function topicKey(value: string) {
  // The two common spellings of Noah should give the same hint even in a story title.
  return normalize(value).replace(/(^| )נוח(?= |$)/g, "$1נח");
}

function storyTopic(value: string) {
  return value
    .replace(/^(?:(?:זה|זהו) )?(?:ה?סיפור|סיפורו) (?:של |על )?/u, "")
    .replace(/^(?:(?:this is|it is|its) (?:the )?)?story (?:of |about )?/, "")
    .replace(/ story$/, "");
}

let namedEvents: Set<string> | undefined;
function isNamedEvent(value: string) {
  // Some authored partials also name a different playable event:
  // "the Exodus" is its own answer, even though it contextualizes the Red Sea.
  if (!namedEvents) {
    namedEvents = new Set<string>();
    for (const hero of catalogFor("he")) {
      for (const stop of hero.stops) {
        for (const puzzle of stop.puzzles) {
          for (const name of [puzzle.answer, ...puzzle.aliases]) namedEvents.add(topicKey(name));
        }
      }
    }
  }
  return namedEvents.has(value);
}

/** Assess free responses without broadening the existing set of winning answers. */
export function classifyGuess(guess: string, puzzle: Puzzle): GuessResult {
  if (matches(guess, puzzle)) return "correct";
  const value = topicKey(guess.replace(/['’]s(?=\s+story\b)/gi, ""));
  if (!value) return "wrong";

  const topic = topicKey(storyTopic(value));
  const answers = [puzzle.answer, ...puzzle.aliases].map(topicKey);
  if (topic !== value && answers.includes(topic)) return "near";
  if (isNamedEvent(topic)) return "wrong";
  const partials = (puzzle.partialAnswers ?? []).map(topicKey);
  const identifiesClue = (phrase: string) => {
    const key = topicKey(phrase);
    return partials.includes(key) || (key.startsWith("ה") && partials.includes(key.slice(1)));
  };
  if (identifiesClue(topic)) return "near";
  // "Noah and the ark" identifies two clues but still leaves out the pictured action.
  const pair = topic.split(/ and | ו(?=[א-ת])/u);
  if (pair.length === 2 && pair.every(identifiesClue)) return "near";

  // Older or newly authored mysteries may name the companion only in the full answer.
  if (topic !== value && (["he", "en"] as const).some(language =>
    catalogFor(language).some(hero => topicKey(hero.name) === topic)
  )) {
    const names = [puzzle.answer, ...puzzle.aliases];
    if (names.some(name => topicKey(name.replace(/['’]s\b/gi, "")).split(" ").includes(topic))) return "near";
  }

  // When the only difference is one Hebrew vowel letter, invite a second look.
  // Other one-letter changes can change the meaning of the event (לידת / חידת).
  if (value.length >= 6 && /[א-ת]/.test(value)) {
    const consonants = value.replace(/[וי]/g, "");
    if (answers.some(answer => answer.replace(/[וי]/g, "") === consonants && distance(value, answer) === 1)) return "near";
  }
  return "wrong";
}
