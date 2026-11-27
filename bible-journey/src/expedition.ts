import { tiers } from "../theme/tiers";
import { classifyGuess, newPuzzle } from "./puzzleAnswer";
import { drawExpeditionDeck, questionBank, validateDeck, randomSequence, MAP_COUNT, LANDMARK_COUNT, LANDMARKS_PER_MAP, QUESTIONS_PER_LANDMARK } from "./expeditionDeck";
import { curriculumTreasure, surpriseQuestion } from "./expeditionBonus";
import type { Character, Expedition, ExpeditionItem, Game, Journey, KeyedExpeditionAction, Profile, Stop, TierId } from "./types";

export { MAP_COUNT, LANDMARKS_PER_MAP, QUESTIONS_PER_LANDMARK };
export const BONUS_TIME_MS = 45_000;
const TOTAL = LANDMARK_COUNT;
const STARTING_LIVES = 3;
export const REVIVE_COST = 12;
export const ELIMINATE_COST = 3;
export const STREAK_BONUS_EVERY = 5;

/** Three stars for a clean landmark, two after one or two misses, one otherwise. */
export function landmarkStars(misses = 0): 1 | 2 | 3 {
  return misses === 0 ? 3 : misses <= 2 ? 2 : 1;
}

export function expeditionStars(state: Expedition) {
  let earned = 0, landmarks = 0;
  state.paid.forEach((count, index) => {
    if (count !== QUESTIONS_PER_LANDMARK) return;
    landmarks++;
    earned += landmarkStars(state.misses?.[index]);
  });
  return { earned, possible: landmarks * 3, landmarks };
}

function fresh(state: Expedition): Expedition {
  const { tries, removed, ...rest } = state;
  return rest;
}
// Use the character's first and last landscapes and distinct locations in between.
const landscapes = [0, 1, 2, 4, 5, 7, 8] as const;

export function activeProfile(game: Game, tier = game.tier ?? "c"): Profile {
  return game.playMode === "duo" ? game.duoProfiles![tier] : game.profiles[tier];
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

// Keep any already visited, credited or purchased puzzle in its original landmark. Only
// unplayed landmarks participate in the new draw, so loading a save never changes an answer.
function pinnedLandmarks(journey: Journey, route: Stop[], visitedThrough = -1) {
  const pinned = new Set<number>();
  for (let i=0; i<TOTAL; i++) {
    const stop = route[i];
    if (i <= visitedThrough || (journey.expedition?.paid[i] ?? 0) > 0 ||
        (stop && (journey.awards[stop.id] !== undefined || journey.puzzles[stop.id+"/"+stop.puzzles[0]!.id])))
      pinned.add(i);
  }
  return pinned;
}

function visitedThrough(state: Expedition) {
  const untouched = state.phase === "travel" && !state.paid[state.landmark] &&
    !state.progress.image && !state.progress.hint && !state.progress.letter && !state.progress.draft;
  return state.landmark - (untouched ? 1 : 0);
}

export function adoptQuestionDeck(state: Expedition, journey: Journey, catalog: Character[], tier: TierId) {
  const ageScoped = Boolean(state.deck) && state.curriculumTier === tier;
  if (ageScoped && state.questionEdition === 1) return state;
  const bank = questionBank(catalog, tier);
  const pinned = pinnedLandmarks(journey, bank.legacyStops, visitedThrough(state));
  const deck = drawExpeditionDeck(bank, state.seed, pinned, state.deck ?? bank.legacy);
  const inTreasure = state.phase === "bonus" || state.phase === "discovery";
  return {...state, curriculumTier:tier, questionEdition:1 as const, deck,
    ...(state.phase === "question" ? {previousQuestionAt:state.landmark * QUESTIONS_PER_LANDMARK + state.step} : {}),
    ...(inTreasure && !ageScoped ? {legacyBonusAt:state.landmark} : {}),
    ...(state.phase === "bonus" && ageScoped ? {previousBonusAt:state.landmark} : {})};
}

export function initialExpedition(seed: number, journey: Journey, catalog: Character[], tier: TierId): Expedition {
  const bank = questionBank(catalog, tier), route = bank.legacyStops;
  const deck = drawExpeditionDeck(bank, seed, pinnedLandmarks(journey, route));
  const paid = Array.from({length: TOTAL}, (_, index) => legacyCredit(journey, route[index], Math.floor(index / 3)));
  const landmark = paid.findIndex(count => count < QUESTIONS_PER_LANDMARK);
  return {
    seed: seed >>> 0, curriculumTier:tier, questionEdition:1, deck, landmark, step: paid[landmark]!, phase: "travel", revision: 0,
    lives: STARTING_LIVES, turn: 0, scores: [0, 0], inventory: { lamp: 0, seal: 0 },
    paid, encounters: {}, progress: migratedProgress(journey, bank.byId.get(deck[landmark*QUESTIONS_PER_LANDMARK]!)!.stop), deadline: null, remainingMs: null,
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
  const bank = questionBank(catalog, state.deck ? tier : undefined);
  const deck = state.deck ?? bank.legacy;
  const mapIndex = Math.floor(state.landmark / LANDMARKS_PER_MAP);
  const mapStop = character.stops[landscapes[mapIndex]!]!;
  const position = state.landmark * QUESTIONS_PER_LANDMARK + state.step;
  const previousQuestion = state.phase === "question" && state.previousQuestionAt === position;
  const wordingBank = previousQuestion ? questionBank(catalog,tier,true) : bank;
  const card = wordingBank.byId.get(deck[position]!)!;
  const stop = card.stop, question = card.question?.(tier);
  const language = /[א-ת]/.test(character.name) ? "he" : "en";
  const showingTreasure = state.phase === "discovery" || state.phase === "bonus";
  const slot = showingTreasure ? encounterSlot(state.seed, state.landmark, journey, bank.legacyStops) : undefined;
  const oldTreasure = !state.deck || !state.curriculumTier || state.legacyBonusAt === state.landmark;
  const treasure = slot === undefined ? undefined : oldTreasure
    ? {stop:mapStop, question:surpriseQuestion(mapStop, tier, slot, language)}
    : curriculumTreasure(character, mapIndex, mapStop, tier, slot, language, state.previousBonusAt === state.landmark);
  const bonus = treasure?.question;
  const key = [game.playMode ?? "solo", tier, character.id, state.seed, state.landmark, state.step, state.phase, state.revision].join("/");
  const completed = new Map<string,Stop>();
  state.paid.forEach((count,index) => {
    if (count !== QUESTIONS_PER_LANDMARK) return;
    for (let step=0; step<count; step++) {
      const solved = bank.byId.get(deck[index*QUESTIONS_PER_LANDMARK+step]!)!.stop;
      completed.set(solved.id,solved);
    }
  });
  return {
    cardId: card.id, artStep: card.artStep, previousQuestion,
    state, character, journey, stop, puzzle: stop.puzzles[0]!, progress: state.progress, mapStop,
    previousStop: state.landmark > 0 ? bank.byId.get(deck[state.landmark*QUESTIONS_PER_LANDMARK-1]!)!.stop : undefined,
    map: mapIndex + 1, landmark: state.landmark % LANDMARKS_PER_MAP + 1, step: state.step,
    question, bonus, bonusStop: treasure?.stop, bonusItem: bonus?.item as ExpeditionItem | undefined,
    completedStops:[...completed.values()], key,
  };
}

function advance(state: Expedition, journey: Journey, catalog: Character[]): Expedition {
  let index = state.landmark + 1;
  while (index < TOTAL && state.paid[index] === QUESTIONS_PER_LANDMARK) index++;
  state = fresh(state);
  if (index >= TOTAL) return { ...state, phase: "finished", deadline: null, remainingMs: null };
  const bank = questionBank(catalog, state.curriculumTier);
  const opening = bank.byId.get((state.deck ?? bank.legacy)[index*QUESTIONS_PER_LANDMARK]!)!;
  return { ...state, phase: "travel", landmark: index, step: state.paid[index]!,
    progress: migratedProgress(journey, opening.stop), deadline: null, remainingMs: null };
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
    delete next.previousBonusAt;
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
      if (state.phase !== "question" || state.step !== 0 || question !== undefined) return;
      if (typeof action.value !== "string") return;
      next.progress = { ...state.progress, draft: action.value.slice(0,160) };
      next.revision = state.revision;
      break;
    case "expedition-buy": {
      if (state.phase !== "question" || state.step !== 0 || question !== undefined) return;
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
        const result = classifyGuess(action.value, puzzle);
        if (result === "near") return;
        correct = result === "correct";
      }
      if (!correct) {
        next.lives--;
        next.misses = Array.from({length: TOTAL}, (_, i) => (state.misses?.[i] ?? 0) + (i === state.landmark ? 1 : 0));
        next.streak = 0;
        next.tries = (state.tries ?? 0) + 1;
        // Strike out the option that was tried, whether a quiz choice or an illustrated event choice.
        const tried = question ? action.choice! : puzzle.choicesKids.indexOf(action.value!.trim());
        if (tried >= 0 && !state.removed?.includes(tried)) next.removed = [...(state.removed ?? []), tried];
        passTurn(false);
        if (!next.lives) next.phase = "game-over";
        break;
      }
      delete next.previousQuestionAt;
      const paid = state.paid[state.landmark]!;
      const newlyEarned = paid <= state.step;
      passTurn(newlyEarned);
      if (newlyEarned) {
        const curriculumOpener = state.step === 0 && view.cardId.startsWith("age/");
        tokens += !question || curriculumOpener ? 5 - state.progress.image : 1;
        next.paid = [...state.paid]; next.paid[state.landmark] = state.step + 1;
        // Only a first-try answer extends the run; every fifth in a row pays one more token.
        if (!state.tries) {
          next.streak = (state.streak ?? 0) + 1;
          next.bestStreak = Math.max(state.bestStreak ?? 0, next.streak);
          if (next.streak % STREAK_BONUS_EVERY === 0) tokens++;
        }
      }
      next = fresh(next);
      if (state.step < QUESTIONS_PER_LANDMARK - 1) next.step++;
      else if (encounterSlot(state.seed, state.landmark, journey, questionBank(catalog).legacyStops) !== undefined && !state.encounters[state.landmark]) next.phase = "discovery";
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
    case "expedition-eliminate": {
      // Pay to strike out one wrong option, while at least two choices would remain.
      if (state.phase !== "question" || !question || !validChoice(action.choice, question.options.length)) return;
      const removed = state.removed ?? [];
      if (action.choice === question.answer || removed.includes(action.choice) ||
          question.options.length - removed.length < 3 || tokens < ELIMINATE_COST) return;
      tokens -= ELIMINATE_COST;
      next.removed = [...removed, action.choice];
      break;
    }
    case "expedition-revive":
      // Spend tokens to carry on from the same question with one heart.
      if (state.phase !== "game-over" || tokens < REVIVE_COST) return;
      tokens -= REVIVE_COST;
      next.lives = 1; next.phase = "question";
      break;
    case "expedition-retry":
      if (state.phase !== "game-over") return;
      delete next.previousQuestionAt;
      next = fresh(next);
      next.lives = STARTING_LIVES; next.phase = "travel"; next.step = 0;
      next.progress = { ...state.progress, draft: "", resolved: false, revealed: false, earned: 0 };
      break;
  }
  return { state: next, tokens };
}

function validChoice(value: unknown, length: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value < length;
}

export function validateExpedition(state: Expedition, journey: Journey, character: Character, catalog: Character[], tier: TierId) {
  if (state?.curriculumTier !== undefined && state.curriculumTier !== tier) throw Error("Incorrect curriculum tier");
  const bank = questionBank(catalog, state?.curriculumTier), route = bank.legacyStops;
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
  if (state.misses !== undefined && (!Array.isArray(state.misses) || state.misses.length !== TOTAL || state.misses.some(n => !integer(n))))
    throw Error("Invalid landmark misses");
  if ((state.streak !== undefined && !integer(state.streak)) || (state.bestStreak !== undefined && !integer(state.bestStreak)) ||
      (state.streak ?? 0) > (state.bestStreak ?? state.streak ?? 0) || (state.tries !== undefined && !integer(state.tries)))
    throw Error("Invalid answer streak");
  if (state.removed !== undefined && (!Array.isArray(state.removed) || state.removed.length > 8 ||
      new Set(state.removed).size !== state.removed.length || state.removed.some(n => !integer(n,0,9))))
    throw Error("Invalid removed options");
  const p = state.progress;
  if (!p || !integer(p.image,0,3) || typeof p.draft !== "string" ||
    [p.hint,p.letter,p.revealed,p.resolved].some(flag => typeof flag !== "boolean") || !integer(p.earned,0,5))
    throw Error("Invalid expedition clue");
  if (state.questionEdition !== undefined && state.questionEdition !== 1) throw Error("Unknown wording edition");
  if (state.previousQuestionAt !== undefined && !integer(state.previousQuestionAt,0,TOTAL * QUESTIONS_PER_LANDMARK - 1)) throw Error("Invalid saved question wording");
  if (state.previousBonusAt !== undefined && !integer(state.previousBonusAt,0,state.landmark)) throw Error("Invalid saved bonus wording");
  if (state.legacyBonusAt !== undefined && !integer(state.legacyBonusAt,0,state.landmark))
    throw Error("Invalid saved treasure");
  if (state.deck !== undefined) validateDeck(state.deck, bank, pinnedLandmarks(journey, route, visitedThrough(state)));
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
