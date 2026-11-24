import type { BonusQuestion, Question, Journey, Stop, TierId } from "./types";

const noBonuses: BonusQuestion[] = [];
const noQuestions: Question[] = [];

export function questionsFor(stop: Stop | undefined, tier: TierId) {
  return stop?.questions?.[tier] ?? noQuestions;
}

export function bonusesFor(stop: Stop | undefined, tier: TierId) {
  return stop?.bonusByTier?.[tier] ?? stop?.bonus ?? noBonuses;
}

export function visualQuestionsFor(stop: Stop | undefined, tier: TierId) {
  return stop?.visualQuestions?.[tier] ?? noQuestions;
}

type ImageSet = "kids" | "teen" | "classic";

export function alternateImageSet(set: ImageSet): ImageSet {
  return set === "teen" ? "classic" : "teen";
}

/** Keep all five main illustrations distinct, even if extra clues are bought on the first. */
export function roundArtwork(set: ImageSet, step: number, clue: number) {
  if (step === 0 && clue > 0) {
    // Each paid clue reveals the next scene. Its last frame uses the remaining art set.
    const lastClueSet = set === "kids" ? "classic" : "kids";
    return { set: clue === 3 ? lastClueSet : alternateImageSet(set), index: clue };
  }
  if (step >= 4) return { set: alternateImageSet(set), index: 3 };
  return { set, index: step };
}

export function roundLength(stop: Stop, tier: TierId) {
  return 1 + (stop.visualQuestions ? visualQuestionsFor(stop, tier) : questionsFor(stop, tier)).length + bonusesFor(stop, tier).length;
}

export function roundStep(stop: Stop, journey: Journey, tier: TierId) {
  if (journey.awards[stop.id] === undefined) return 0;
  const bonuses = bonusesFor(stop, tier);
  if (stop.visualQuestions) {
    const answered = journey.visualAnswers?.[stop.id] ?? [];
    if (answered === "legacy-complete") return roundLength(stop, tier);
    const count = visualQuestionsFor(stop, tier).length;
    if (answered.length < count) return 1 + answered.length;
    const bonus = bonuses.findIndex(q => journey.bonus[q.id]?.status !== "correct");
    return bonus < 0 ? roundLength(stop, tier) : 1 + count + bonus;
  }
  const pendingBonus = bonuses.findIndex(q => journey.bonus[q.id]?.status !== "correct");
  if (pendingBonus >= 0) return 1 + pendingBonus;

  const lessons = questionsFor(stop, tier);
  const answeredLessons = journey.learning[stop.id]?.length ?? 0;
  if (answeredLessons < lessons.length) return 1 + bonuses.length + answeredLessons;
  return roundLength(stop, tier);
}

export function roundReady(stop: Stop, journey: Journey, tier: TierId) {
  return roundStep(stop, journey, tier) === roundLength(stop, tier);
}

/** Older journeys allowed continuing after the two reading questions. */
export function canLeaveChapter(stop: Stop, journey: Journey, tier: TierId) {
  return stop.visualQuestions ? roundReady(stop, journey, tier)
    : journey.awards[stop.id] !== undefined && (journey.learning[stop.id]?.length ?? 0) >= questionsFor(stop, tier).length;
}
