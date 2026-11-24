import { tiers } from "../theme/tiers";
import { matches, newPuzzle } from "./puzzleAnswer";
import { routePictureQuestion } from "./expeditionConnections";
import { surpriseQuestion } from "./expeditionBonus";
import { finaleCard, finaleSceneIds } from "./expeditionFinale";
import type { Character, Expedition, ExpeditionItem, Game, Journey, KeyedExpeditionAction, Profile, Stop, TierId } from "./types";

export const MAP_COUNT = 7;
export const LANDMARKS_PER_MAP = 4;
export const QUESTIONS_PER_LANDMARK = 5;
export const BONUS_TIME_MS = 45_000;
const TOTAL = MAP_COUNT * LANDMARKS_PER_MAP;
const STARTING_LIVES = 3;
// Use the character's first and last landscapes and distinct locations in between.
const landscapes = [0, 1, 2, 4, 5, 7, 8] as const;

export function activeProfile(game: Game, tier = game.tier ?? "c"): Profile {
  return game.playMode === "duo" ? game.duoProfiles![tier] : game.profiles[tier];
}

/** Round-robin by educational chapter rank, independent of the chosen companion. */
function bibleRoute(catalog: Character[]): Stop[] {
  const heroes = ["noah", "moses", "samson"].map(id => catalog.find(hero => hero.id === id));
  if (heroes.some(hero => hero?.stops.length !== 9)) throw Error("Missing Bible expedition content");
  return Array.from({length: 27}, (_, i) => heroes[i % 3]!.stops[Math.floor(i / 3)]!);
}

function randomSequence(seed: number) {
  let value = seed | 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) | 0;
    return (value >>> 0) / 4294967296;
  };
}

/** The first one or two shuffled locations hide different treasures. Derive them from the saved seed. */
function encounterSlot(seed: number, landmark: number, journey: Journey, route: Stop[]): 0 | 1 | undefined {
  const map = Math.floor(landmark / LANDMARKS_PER_MAP);
  const next = randomSequence(seed ^ Math.imul(map + 1, 0x9e3779b9));
  const positions = [0,1,2,3];
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [positions[i], positions[j]] = [positions[j]!, positions[i]!];
  }
  const count = 1 + Math.floor(next() * 2);
  const first = Math.floor(next() * 2) as 0 | 1;
  // Migrated stories may already be mastered. A surprise belongs on a landmark the player actually visits.
  const available = positions.filter(position => {
    const index = map * LANDMARKS_PER_MAP + position;
    return legacyCredit(journey, route[index], Math.floor(index / 3)) < QUESTIONS_PER_LANDMARK;
  });
  const position = landmark % LANDMARKS_PER_MAP;
  if (position === available[0]) return first;
  if (count === 2 && position === available[1]) return first === 1 ? 0 : 1;
  return undefined;
}

function migratedProgress(journey: Journey, stop: Stop | undefined) {
  if (!stop) return newPuzzle();
  const puzzleId = stop.puzzles[0]!.id;
  return { ...(journey.puzzles[stop.id + "/" + puzzleId] ?? newPuzzle()), revealed: false };
}

function legacyCredit(journey: Journey, stop: Stop | undefined, oldOrdinal: number) {
  if (!stop || journey.awards[stop.id] === undefined) return 0;
  const record = journey.visualAnswers?.[stop.id];
  if (record === "legacy-complete" || oldOrdinal < journey.stop || journey.phase === "finished") return QUESTIONS_PER_LANDMARK;
  return Math.min(QUESTIONS_PER_LANDMARK, 1 + (record?.length ?? 0));
}

export function initialExpedition(seed: number, journey: Journey, catalog: Character[]): Expedition {
  const route = bibleRoute(catalog);
  const paid = Array.from({length: TOTAL}, (_, index) => legacyCredit(journey, route[index], Math.floor(index / 3)));
  const landmark = paid.findIndex(count => count < QUESTIONS_PER_LANDMARK);
  return {
    seed: seed >>> 0, landmark, step: paid[landmark]!, phase: "travel", revision: 0,
    lives: STARTING_LIVES, turn: 0, scores: [0, 0], inventory: { lamp: 0, seal: 0 },
    paid, encounters: {}, progress: migratedProgress(journey, route[landmark]), deadline: null, remainingMs: null,
  };
}

export function expeditionView(game: Game, catalog: Character[]) {
  const tier = game.tier;
  if (!tier) return undefined;
  const profile = activeProfile(game, tier);
  const character = catalog.find(c => c.id === profile.active);
  const journey = character && profile.journeys[character.id];
  const state = journey?.expedition;
  if (!state || !character) return undefined;
  const route = bibleRoute(catalog);
  const mapIndex = Math.floor(state.landmark / LANDMARKS_PER_MAP);
  const mapStop = character.stops[landscapes[mapIndex]!]!;
  const finale = state.landmark === TOTAL - 1;
  const stop = finale ? route.find(s => s.id === finaleSceneIds[state.step])! : route[state.landmark]!;
  const language = /[א-ת]/.test(character.name) ? "he" : "en";
  const question = finale ? finaleCard(tier, state.step, language) : routePictureQuestion(stop, tier, state.step, language);
  const showingTreasure = state.phase === "discovery" || state.phase === "bonus";
  const slot = showingTreasure ? encounterSlot(state.seed, state.landmark, journey, route) : undefined;
  const bonus = slot === undefined ? undefined : surpriseQuestion(mapStop, tier, slot, language);
  const key = [game.playMode ?? "solo", tier, character.id, state.seed, state.landmark, state.step, state.phase, state.revision].join("/");
  return {
    state, character, journey, stop, puzzle: stop.puzzles[0]!, progress: state.progress, mapStop,
    previousStop: state.landmark > 0 ? route[state.landmark - 1] : undefined,
    map: mapIndex + 1, landmark: state.landmark % LANDMARKS_PER_MAP + 1, step: state.step,
    question, bonus, bonusStop: bonus ? mapStop : undefined, bonusItem: bonus?.item as ExpeditionItem | undefined,
    completedStops: route.filter((_,index) => state.paid[index] === QUESTIONS_PER_LANDMARK), key, finale,
  };
}

function advance(state: Expedition, journey: Journey, catalog: Character[]): Expedition {
  let index = state.landmark + 1;
  while (index < TOTAL && state.paid[index] === QUESTIONS_PER_LANDMARK) index++;
  if (index >= TOTAL) return { ...state, phase: "finished", deadline: null, remainingMs: null };
  return { ...state, phase: "travel", landmark: index, step: state.paid[index]!,
    progress: migratedProgress(journey, bibleRoute(catalog)[index]), deadline: null, remainingMs: null };
}

function clock(now: number) {
  return Number.isSafeInteger(now) && now >= 0 && now <= Number.MAX_SAFE_INTEGER - BONUS_TIME_MS;
}

export function reduceExpedition(game: Game, catalog: Character[], action: KeyedExpeditionAction) {
  const view = expeditionView(game, catalog);
  if (!view || action.key !== view.key) return;
  const { state, journey, question, puzzle, bonus } = view;
  const profile = activeProfile(game);
  let tokens = profile.tokens;
  let next: Expedition = { ...state, revision: state.revision + 1 };
  const passTurn = (scored: boolean) => {
    if (scored) {
      next.scores = [...next.scores];
      next.scores[next.turn]++;
    }
    if (game.playMode === "duo") next.turn = next.turn === 0 ? 1 : 0;
  };
  const completeBonus = (result: "correct" | "wrong" | "expired") => {
    next.encounters = { ...state.encounters, [state.landmark]: result };
    // Expedition treasures are new companion trials, distinct from the old chapter quiz with the same item art.
    // The saved encounter at this landmark, not an old quiz ID, owns its single payout.
    passTurn(result === "correct");
    if (result === "correct") {
      if (view.bonusItem === "jar") tokens++;
      if (view.bonusItem === "staff") next.lives++;
      if (view.bonusItem === "lamp" || view.bonusItem === "seal")
        next.inventory = { ...next.inventory, [view.bonusItem]: next.inventory[view.bonusItem] + 1 };
    }
    next = advance(next, journey, catalog);
  };

  switch (action.type) {
    case "expedition-arrive":
      if (!clock(action.now)) return;
      if (state.phase === "travel") next.phase = "question";
      else if (state.phase === "discovery" && bonus) {
        next.phase = "bonus"; next.deadline = action.now + BONUS_TIME_MS; next.remainingMs = null;
      } else return;
      break;
    case "expedition-draft":
      if (state.phase !== "question" || state.step !== 0 || view.finale) return;
      if (typeof action.value !== "string") return;
      next.progress = { ...state.progress, draft: action.value.slice(0,160) };
      next.revision = state.revision;
      break;
    case "expedition-buy": {
      if (state.phase !== "question" || state.step !== 0 || view.finale) return;
      const clue = action.clue;
      if (clue !== "image" && clue !== "hint" && clue !== "letter") return;
      if (clue === "image" ? state.progress.image >= 3 : state.progress[clue]) return;
      const item = clue === "hint" ? "lamp" : clue === "letter" ? "seal" : undefined;
      if (item && state.inventory[item] > 0) {
        next.inventory = { ...state.inventory, [item]: state.inventory[item] - 1 };
      } else {
        const price = clue === "image" ? 1 : clue === "hint" ? 2 : tiers[game.tier!].clues.find(c => c.key === clue)?.cost;
        if (price === undefined || tokens < price) return;
        tokens -= price;
      }
      next.progress = { ...state.progress, [clue]: clue === "image" ? state.progress.image + 1 : true };
      break;
    }
    case "expedition-answer": {
      if (!clock(action.now)) return;
      if (state.phase === "bonus") {
        if (!bonus || state.deadline === null || state.encounters[state.landmark] !== undefined) return;
        if (action.now >= state.deadline) completeBonus("expired");
        else {
          if (!validChoice(action.choice, bonus.options.length)) return;
          completeBonus(action.choice === bonus.answer ? "correct" : "wrong");
        }
        break;
      }
      if (state.phase !== "question") return;
      let correct: boolean;
      if (question) {
        if (!validChoice(action.choice, question.options.length)) return;
        correct = action.choice === question.answer;
      } else {
        if (typeof action.value !== "string" || !action.value.trim()) return;
        correct = matches(action.value, puzzle);
      }
      if (!correct) {
        next.lives--;
        passTurn(false);
        if (!next.lives) next.phase = "game-over";
        break;
      }
      const paid = state.paid[state.landmark]!;
      const newlyEarned = paid <= state.step;
      passTurn(newlyEarned);
      if (newlyEarned) {
        tokens += state.step === 0 && !view.finale ? 5 - state.progress.image : 1;
        next.paid = [...state.paid]; next.paid[state.landmark] = state.step + 1;
      }
      if (state.step < QUESTIONS_PER_LANDMARK - 1) next.step++;
      else if (encounterSlot(state.seed, state.landmark, journey, bibleRoute(catalog)) !== undefined && !state.encounters[state.landmark]) next.phase = "discovery";
      else next = advance(next, journey, catalog);
      break;
    }
    case "expedition-expire":
      if (state.phase !== "bonus" || state.deadline === null || !clock(action.now) || action.now < state.deadline) return;
      completeBonus("expired"); break;
    case "expedition-pause":
      if (state.phase !== "bonus" || state.deadline === null || !clock(action.now)) return;
      if (action.now >= state.deadline) completeBonus("expired");
      else { next.remainingMs = Math.min(BONUS_TIME_MS, state.deadline - action.now); next.deadline = null; }
      break;
    case "expedition-resume":
      if (state.phase !== "bonus" || state.remainingMs === null || !clock(action.now)) return;
      next.deadline = action.now + state.remainingMs; next.remainingMs = null;
      break;
    case "expedition-retry":
      if (state.phase !== "game-over") return;
      next.lives = STARTING_LIVES; next.phase = "travel"; next.step = 0;
      next.progress = { ...state.progress, draft: "", resolved: false, revealed: false, earned: 0 };
      break;
  }
  return { state: next, tokens };
}

function validChoice(value: unknown, length: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value < length;
}

export function validateExpedition(state: Expedition, journey: Journey, character: Character, catalog: Character[]) {
  const route = bibleRoute(catalog);
  const integer = (n: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    typeof n === "number" && Number.isSafeInteger(n) && n >= min && n <= max;
  if (!state || !character.stops[0]?.visualQuestions || !integer(state.seed,0,0xffffffff) ||
    !integer(state.landmark,0,TOTAL-1) || !integer(state.step,0,QUESTIONS_PER_LANDMARK-1) || !integer(state.revision) ||
    !["travel","question","discovery","bonus","game-over","finished"].includes(state.phase) ||
    !integer(state.lives,0,STARTING_LIVES+TOTAL) || (state.phase === "game-over") !== (state.lives === 0) ||
    !integer(state.turn,0,1) || !Array.isArray(state.scores) || state.scores.length !== 2 || state.scores.some(s => !integer(s)) ||
    !state.inventory || !integer(state.inventory.lamp,0,TOTAL) || !integer(state.inventory.seal,0,TOTAL) ||
    !Array.isArray(state.paid) || state.paid.length !== TOTAL || state.paid.some(n => !integer(n,0,5)) ||
    !state.encounters || typeof state.encounters !== "object" || Array.isArray(state.encounters)) throw Error("Invalid expedition");
  const p = state.progress;
  if (!p || !integer(p.image,0,3) || typeof p.draft !== "string" ||
    [p.hint,p.letter,p.revealed,p.resolved].some(flag => typeof flag !== "boolean") || !integer(p.earned,0,5))
    throw Error("Invalid expedition clue");
  for (const [key,outcome] of Object.entries(state.encounters)) {
    const i = Number(key);
    if (!integer(i,0,TOTAL-1) || String(i) !== key || encounterSlot(state.seed,i,journey,route) === undefined ||
      state.paid[i] !== 5 || !["correct","wrong","expired"].includes(outcome)) throw Error("Invalid treasure result");
  }
  if (state.paid.slice(0,state.landmark).some(n => n !== 5) || state.step > state.paid[state.landmark]!)
    throw Error("Invalid landmark progress");
  if (state.phase === "finished" && (state.landmark !== TOTAL-1 || state.paid.some(n => n !== 5))) throw Error("Incomplete route");
  if (state.phase === "bonus" || state.phase === "discovery") {
    if (state.step !== 4 || state.paid[state.landmark] !== 5 || state.encounters[state.landmark] ||
        encounterSlot(state.seed,state.landmark,journey,route) === undefined) throw Error("Invalid treasure encounter");
  }
  if (state.phase === "bonus") {
    if (state.deadline === null ? !integer(state.remainingMs,1,BONUS_TIME_MS)
      : !integer(state.deadline) || state.remainingMs !== null) throw Error("Invalid treasure clock");
  } else if (state.deadline !== null || state.remainingMs !== null) throw Error("Unexpected treasure clock");
}
