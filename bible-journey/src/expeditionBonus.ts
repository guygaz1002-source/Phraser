import manuscript from "../content/encounter-questions.json";
import earlyReaderTreasures from "../content/early-reader-treasures.json";
import { bonusesFor, questionsFor } from "./round";
import type { Language } from "./locale";
import type { BonusQuestion, Question, Stop, TierId } from "./types";

const opening: Record<Language, Record<string, Record<TierId, Question[]>>> = manuscript;
const earlyReader: Record<Language, Record<string, Question[]>> = earlyReaderTreasures;

/** Treasure trials belong to the selected companion, independently of the landmark mystery. */
export function surpriseQuestion(stop: Stop, tier: TierId, index: 0|1, language: Language): BonusQuestion {
  const treasure = bonusesFor(stop, tier)[index]!;
  const companionQuestions = opening[language][stop.id]?.[tier]
    ?? (tier === "a" ? earlyReader[language][stop.id] : undefined)
    ?? questionsFor(stop, tier);
  return { ...treasure, ...(companionQuestions[index] ?? treasure) };
}
