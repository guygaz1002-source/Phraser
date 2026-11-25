import manuscript from "../content/encounter-questions.json";
import earlyReaderTreasures from "../content/early-reader-treasures.json";
import { ageCurricula } from "./ageCurriculum";
import { earlySamsonTreasure, earlyTreasureWording, primaryTreasureIntroduction } from "./curriculumTreasures";
import { bonusesFor, questionsFor } from "./round";
import type { Language } from "./locale";
import type { BonusQuestion, Character, Question, Stop, TierId } from "./types";

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

/** Choose the subject from this age's approved episodes. The reward follows the map. */
export function curriculumTreasure(hero: Character, map: number, mapStop: Stop, tier: TierId, slot: 0|1, language: Language) {
  const allowed = ageCurricula[tier].bonusSources[hero.id]!;
  const early = tier === "a" && hero.id === "samson" ? earlySamsonTreasure(map,slot,language) : undefined;
  const episodes = hero.stops.filter(stop => allowed.includes(stop.id));
  const stop = early ? episodes.find(s => s.id === early.stopId) : episodes[Math.round(map * (episodes.length - 1) / 6)];
  if (!stop) throw Error("Missing approved bonus for " + hero.id + "/" + tier);
  const base = surpriseQuestion(stop,tier,slot,language);
  const wording = early?.question ?? (tier === "a" ? earlyTreasureWording(stop.id,slot,language) : undefined) ?? base;
  const intro = tier === "b" && map < 4 ? primaryTreasureIntroduction(stop.id, language) : undefined;
  const question = {
    ...base, ...wording, prompt:intro ? intro + " " + wording.prompt : wording.prompt,
    item:bonusesFor(mapStop,tier)[slot]!.item,
    id:hero.id + "/" + tier + "/treasure/" + map + "/" + slot,
  };
  return {stop, question};
}
