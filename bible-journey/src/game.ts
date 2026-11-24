import { canExplore, explorePosition, worlds } from "./exploration";
import { activeProfile, initialExpedition, reduceExpedition, validateExpedition } from "./expedition";
export { activeProfile } from "./expedition";
import { matches, newPuzzle } from "./puzzleAnswer";
export { distance, matches, newPuzzle, normalize, spokenPictureAnswer } from "./puzzleAnswer";
import { tiers } from "../theme/tiers";
import { questionsFor, bonusesFor, roundReady, roundStep, visualQuestionsFor, canLeaveChapter } from "./round";
import { tierIds } from "./types";
import type {
  Action,
  Category,
  Character,
  Clue,
  Game,
  Journey,
  Profile,
  Puzzle,
  PuzzleProgress,
  TierId,
} from "./types";
export const categories: Category[] = ["stories", "figures", "proverbs"];
export const rules = {
  startingTokens: 3,
  stopFloor: 3,
  stepMs: 180,
  idleMs: 600,
  teachingMinMs: 4000,
  teachingMaxMs: 10000,
};
const profile = (): Profile => ({ tokens: rules.startingTokens, active: null, journeys: {} });
export const newGame = (): Game => ({
  version: 4,
  tier: null,
  profiles: { a: profile(), b: profile(), teen: profile(), c: profile() },
});
export const newJourney = (selected: Category[]): Journey => ({
  phase: "map",
  stop: 0,
  puzzle: 0,
  categories: selected,
  walkingFrom: null,
  puzzles: {},
  awards: {},
  visualAnswers: {},
  learning: {},
  bonus: {},
});
export const puzzleKey = (s: string, p: string) => `${s}/${p}`;
export function current(game: Game, catalog: Character[]) {
  const tier = game.tier ?? "c",
    profile = activeProfile(game, tier);
  const character = catalog.find((c) => c.id === profile.active);
  const journey = profile.active ? profile.journeys[profile.active] : undefined;
  const stop = character && journey ? character.stops[journey.stop] : undefined;
  const puzzles =
    stop && journey
      ? stop.puzzles.filter((p) => journey.categories.includes(p.category))
      : [];
  const puzzle = journey ? puzzles[journey.puzzle] : undefined;
  const key = stop && puzzle ? puzzleKey(stop.id, puzzle.id) : "";
  return {
    tier,
    profile,
    character,
    journey,
    stop,
    puzzles,
    puzzle,
    key,
    progress: journey?.puzzles[key] ?? newPuzzle(),
  };
}
export function canBuy(clue: Clue, p: PuzzleProgress) {
  return (
    !p.resolved &&
    !p.revealed &&
    (clue === "image" ? p.image < 3 : clue === "answer" ? true : !p[clue])
  );
}
export function transition(
  game: Game,
  action: Action,
  catalog: Character[],
): Game {
  if (action.type === "play-mode") {
    if (game.playMode === action.mode) return game;
    return action.mode === "duo"
      ? { ...game, playMode: action.mode, duoProfiles: game.duoProfiles ?? newGame().profiles }
      : { ...game, playMode: action.mode };
  }
  if (action.type === "tier") return { ...game, tier: action.tier };
  if (action.type === "assign-school-profile") {
    if (!game.pendingSchoolSplit) return game;
    const { pendingSchoolSplit, ...assigned } = game;
    const profiles = action.tier === "b" ? game.profiles
      : { ...game.profiles, b: profile(), teen: game.profiles.b };
    return { ...assigned, tier: action.tier, profiles };
  }
  if (game.pendingSchoolSplit && (game.tier === "b" || game.tier === "teen")) return game;
  if (!game.tier) return game;
  const {
    tier,
    profile: old,
    character,
    journey: oldJ,
    stop,
    puzzles,
    puzzle,
    key,
    progress: oldP,
  } = current(game, catalog);
  const commit = (p: Profile) => ({
    ...game,
    ...(game.playMode === "duo"
      ? { duoProfiles: { ...game.duoProfiles!, [tier]: p } }
      : { profiles: { ...game.profiles, [tier]: p } }),
  });
  if (action.type === "select")
    return catalog.some((c) => c.id === action.id && c.stops.length)
      ? commit({ ...old, active: action.id })
      : game;
  if (action.type === "restart-journey") {
    const previous = old.journeys[action.id];
    if (!previous || !catalog.some(hero => hero.id === action.id && hero.stops.length)) return game;
    return commit({ ...old, active: action.id, journeys: { ...old.journeys, [action.id]: newJourney(previous.categories) } });
  }
  if (action.type === "start") {
    if (!character) return game;
    const selected = character.stops[0]?.questions ? ["stories" as Category] : categories.filter((c) => action.categories.includes(c));
    if (!selected.length) return game;
    // An unfinished journey retains the chosen categories and rewards on resume.
    if (oldJ) return game;
    return commit({
      ...old,
      journeys: { ...old.journeys, [character.id]: newJourney(selected) },
    });
  }
  if (!character || !oldJ || !stop) return game;
  if (action.type === "expedition-start") {
    if (oldJ.expedition || !Number.isSafeInteger(action.seed) || !character.stops[0]?.visualQuestions) return game;
    const expedition = initialExpedition(action.seed, oldJ, catalog);
    return commit({ ...old, journeys: { ...old.journeys, [character.id]: { ...oldJ, expedition } } });
  }
  if ("key" in action) {
    const update = reduceExpedition(game, catalog, action);
    if (!update) return game;
    return commit({ ...old, tokens: update.tokens, journeys: { ...old.journeys, [character.id]: { ...oldJ, expedition: update.state } } });
  }
  // Existing route aliases and stale handlers cannot award old chapter rewards in an expedition.
  if (oldJ.expedition) return game;
  const j: Journey = {
    ...oldJ,
    puzzles: { ...oldJ.puzzles },
    awards: { ...oldJ.awards },
    learning: { ...oldJ.learning },
    bonus: { ...oldJ.bonus },
  };
  const p = { ...oldP };
  let tokens = old.tokens;
  const complete = () => {
    if (j.awards[stop.id] !== undefined) { j.phase = "complete"; return; }
    const earned = puzzles.reduce(
      (sum, x) => sum + (j.puzzles[puzzleKey(stop.id, x.id)]?.earned ?? 0),
      0,
    );
    const topUp = Math.max(0, rules.stopFloor - earned);
    tokens += topUp;
    j.awards[stop.id] = earned + topUp;
    j.phase = "complete";
  };
  const resolve = (earned: number) => {
    p.resolved = true;
    p.earned = earned;
    p.draft = "";
    tokens += earned;
    j.puzzles[key] = p;
    if (j.puzzle + 1 < puzzles.length) j.puzzle++;
    else complete();
  };
  const bonusUnlocked = (target: typeof stop, bonusId: string) => {
    if (!target.visualQuestions || j.visualAnswers?.[target.id] === "legacy-complete") return true;
    const index = bonusesFor(target, tier).findIndex(q => q.id === bonusId);
    return index >= 0 && roundStep(target, j, tier) === 1 + visualQuestionsFor(target, tier).length + index;
  };
  switch (action.type) {
    case "round-open":
      if (action.stopId !== stop.id || !stop.questions || !["map", "intro"].includes(j.phase)) return game;
      delete j.exploring;
      j.walkingFrom = null;
      if (puzzles.length && !p.resolved) j.phase = "puzzle";
      else complete();
      break;
    case "explore": {
      const target = character.stops.find(s => s.id === action.stopId);
      if (!target || !worlds[target.id] || (target.id !== stop.id && j.awards[target.id] === undefined)) return game;
      if (j.phase !== "finished") j.phase = "map";
      j.walkingFrom = null;
      j.exploring = target.id;
      break;
    }
    case "move": {
      if ((j.phase !== "map" && j.phase !== "finished") || action.stopId !== (j.exploring ?? stop.id)) return game;
      const world = worlds[action.stopId];
      if (!world || !canExplore(world, action.position)) return game;
      const from = explorePosition(j, action.stopId);
      if (Math.abs(from.x - action.position.x) + Math.abs(from.y - action.position.y) !== 1) return game;
      j.positions = { ...j.positions, [action.stopId]: { ...action.position } };
      break;
    }
    case "enter":
      if (j.exploring && j.exploring !== stop.id) return game;
      if (j.phase !== "map" || j.walkingFrom !== null) return game;
      j.phase = "intro";
      break;
    case "begin":
      if (j.phase !== "intro") return game;
      if (puzzles.length && !p.resolved) j.phase = "puzzle";
      else complete();
      break;
    case "draft":
      if (j.phase !== "puzzle" || p.revealed || p.resolved) return game;
      p.draft = action.value.slice(0, 160);
      j.puzzles[key] = p;
      break;
    case "guess":
      if (
        j.phase !== "puzzle" ||
        !puzzle ||
        p.revealed ||
        p.resolved ||
        !matches(action.value, puzzle)
      )
        return game;
      resolve(5 - p.image);
      break;
    case "buy": {
      const rung = tiers[tier].clues.find((r) => r.key === action.clue);
      if (
        j.phase !== "puzzle" ||
        !puzzle ||
        !rung ||
        !canBuy(action.clue, p) ||
        tokens < rung.cost
      )
        return game;
      tokens -= rung.cost;
      if (action.clue === "image") p.image++;
      else if (action.clue === "answer") p.revealed = true;
      else p[action.clue] = true;
      j.puzzles[key] = p;
      break;
    }
    case "accept-reveal":
      if (stop.questions || j.phase !== "puzzle" || !puzzle || !p.revealed || p.resolved)
        return game;
      resolve(0);
      break;
    case "picture-answer": {
      if (j.phase !== "complete" || action.stopId !== stop.id || j.awards[stop.id] === undefined) return game;
      const answers = j.visualAnswers?.[stop.id] ?? [];
      const question = visualQuestionsFor(stop, tier)[action.questionIndex];
      if (!question || answers === "legacy-complete" || answers.length !== action.questionIndex || action.choice !== question.answer) return game;
      j.visualAnswers = { ...j.visualAnswers, [stop.id]: [...answers, action.choice] };
      tokens += 1;
      break;
    }
    case "learn": {
      if (j.phase !== "complete" || stop.visualQuestions) return game;
      const answers = j.learning[stop.id] ?? [];
      if ((action.stopId !== undefined && action.stopId !== stop.id) ||
          (action.questionIndex !== undefined && action.questionIndex !== answers.length)) return game;
      const question = questionsFor(stop, tier)[answers.length];
      if (!question || !Number.isInteger(action.choice) || action.choice < 0 || action.choice >= question.options.length) return game;
      j.learning[stop.id] = [...answers, action.choice];
      if (action.choice === question.answer) tokens += 1;
      break;
    }
    case "bonus-start": {
      const bonusStop = action.stopId ? character.stops.find(s => s.id === action.stopId) : stop;
      if (!bonusStop || !bonusUnlocked(bonusStop, action.id) || !["complete", "map", "finished"].includes(j.phase) || j.awards[bonusStop.id] === undefined || !bonusesFor(bonusStop, tier).some(q => q.id === action.id) || !Number.isFinite(action.now)) return game;
      const attempt = j.bonus[action.id];
      if (attempt?.status === "correct" || (attempt?.status === "playing" && attempt.deadline > action.now)) return game;
      j.bonus[action.id] = { deadline: action.now + 45000, status: "playing", selected: null };
      break;
    }
    case "bonus-resume": {
      const attempt = j.bonus[action.id];
      const extension = action.now - action.pausedAt;
      // A pause belongs to one active attempt, never another chapter or a retry.
      if (action.stopId !== stop.id || j.phase !== "complete" || j.awards[stop.id] === undefined ||
        !bonusUnlocked(stop, action.id) || !bonusesFor(stop, tier).some(q => q.id === action.id) || attempt?.status !== "playing" ||
        attempt.deadline !== action.expectedDeadline || !Number.isFinite(action.expectedDeadline) ||
        !Number.isFinite(action.pausedAt) || action.pausedAt < 0 || action.pausedAt >= attempt.deadline ||
        !Number.isFinite(extension) || extension <= 0 || !Number.isFinite(attempt.deadline + extension)) return game;
      j.bonus[action.id] = { ...attempt, deadline: attempt.deadline + extension };
      break;
    }
    case "bonus-expire":
    case "bonus-answer": {
      const bonusStop = action.stopId ? character.stops.find(s => s.id === action.stopId) : stop;
      const question = bonusesFor(bonusStop, tier).find(q => q.id === action.id);
      const attempt = j.bonus[action.id];
      if (!bonusStop || !bonusUnlocked(bonusStop, action.id) || !["complete", "map", "finished"].includes(j.phase) || j.awards[bonusStop.id] === undefined || !question || !attempt || attempt.status !== "playing" || !Number.isFinite(action.now)) return game;
      if (action.now >= attempt.deadline) j.bonus[action.id] = { ...attempt, status: "expired", selected: null };
      else if (action.type === "bonus-answer") {
        if (!Number.isInteger(action.choice) || action.choice < 0 || action.choice >= question.options.length) return game;
        const correct = action.choice === question.answer;
        j.bonus[action.id] = { ...attempt, status: correct ? "correct" : "wrong", selected: action.choice };
        if (correct) tokens += 1;
      } else return game;
      break;
    }
    case "round-next":
    case "continue":
      if (action.type === "round-next" && (action.stopId !== stop.id || !roundReady(stop, j, tier))) return game;
      if (!["complete", "map"].includes(j.phase) || j.awards[stop.id] === undefined || (j.exploring && j.exploring !== stop.id) || !canLeaveChapter(stop, j, tier)) return game;
      delete j.exploring;
      if (j.stop + 1 === character.stops.length) j.phase = "finished";
      else {
        j.walkingFrom = j.stop;
        j.stop++;
        j.puzzle = 0;
        j.phase = "map";
      }
      break;
    case "walked":
      if (j.phase !== "map" || j.walkingFrom === null) return game;
      j.walkingFrom = null;
      break;
  }
  return commit({
    ...old,
    tokens,
    journeys: { ...old.journeys, [character.id]: j },
  });
}
export function routeFor(game: Game, catalog: Character[]) {
  if (!game.tier) return "/" as const;
  const { journey, stop } = current(game, catalog);
  if (!journey) return "/home" as const;
  // Chapters share one persistent stage; phase changes never navigate away.
  if (stop?.questions) return "/journey" as const;
  return journey.phase === "map" || journey.phase === "finished"
    ? ("/journey" as const)
    : (`/${journey.phase}` as "/intro" | "/puzzle" | "/complete");
}
export function restore(raw: string | null, catalog: Character[]): Game {
  if (!raw) return newGame();
  const parsed = JSON.parse(raw);
  const oldSchoolGroups = parsed.version === 2 || parsed.version === 3;
  if (parsed.version === 3 && (parsed.tier === "teen" || !parsed.profiles || "teen" in parsed.profiles))
    throw Error("Invalid three-group save");
  const g: Game = parsed.version === 2 ? migrateLegacy(parsed, catalog)
    : parsed.version === 3 ? { version: 4, tier: parsed.tier, profiles: { ...parsed.profiles, teen: profile() } }
    : parsed;
  const int = (v: unknown) => Number.isSafeInteger(v) && (v as number) >= 0;
  if (
    g.version !== 4 ||
    !(g.tier === null || tierIds.includes(g.tier)) ||
    !g.profiles
  )
    throw Error("Invalid save");
  if (g.playMode !== undefined && g.playMode !== "solo" && g.playMode !== "duo") throw Error("Invalid play mode");
  if (g.playMode === "duo" && !g.duoProfiles) throw Error("Missing two-player saves");
  if (g.duoProfiles !== undefined && (!g.duoProfiles || typeof g.duoProfiles !== "object" || Array.isArray(g.duoProfiles))) throw Error("Invalid two-player saves");
  for (const profiles of g.duoProfiles ? [g.profiles, g.duoProfiles] : [g.profiles]) for (const id of tierIds) {
    const profile = profiles[id];
    if (
      !profile ||
      !int(profile.tokens) ||
      !profile.journeys ||
      (profile.active !== null && typeof profile.active !== "string")
    )
      throw Error("Invalid profile");
    for (const [characterId, j] of Object.entries(profile.journeys)) {
      const c = catalog.find((c) => c.id === characterId);
      if (!c) continue;
      if (
        !j ||
        !int(j.stop) ||
        !c.stops[j.stop] ||
        !int(j.puzzle) ||
        !["map", "intro", "puzzle", "complete", "finished"].includes(j.phase) ||
        !j.puzzles ||
        !j.awards ||
        !j.learning ||
        !j.bonus ||
        !Array.isArray(j.categories) ||
        !j.categories.length ||
        j.categories.some((v) => !categories.includes(v)) ||
        (j.walkingFrom !== null && j.walkingFrom !== j.stop - 1)
      )
        throw Error("Invalid journey");
      if (j.expedition !== undefined) validateExpedition(j.expedition, j, c, catalog);
      if (j.exploring !== undefined && (!c.stops.some(s => s.id === j.exploring) || (j.exploring !== c.stops[j.stop]!.id && j.awards[j.exploring] === undefined))) throw Error("Invalid explored chapter");
      if (j.positions !== undefined) {
        if (!j.positions || typeof j.positions !== "object" || Array.isArray(j.positions)) throw Error("Invalid map positions");
        for (const [stopId, position] of Object.entries(j.positions)) {
          const world = worlds[stopId];
          if (!c.stops.some(s => s.id === stopId) || !world || !position || !canExplore(world, position)) throw Error("Invalid map position");
        }
      }
      const ps = c.stops[j.stop]!.puzzles.filter((p) =>
        j.categories.includes(p.category),
      );
      if (
        j.puzzle >= Math.max(1, ps.length) ||
        (j.phase === "puzzle" && !ps.length)
      )
        throw Error("Invalid puzzle index");
      for (const p of Object.values(j.puzzles))
        if (
          !p ||
          !int(p.image) ||
          p.image > 3 ||
          !int(p.earned) ||
          p.earned > 5 ||
          typeof p.draft !== "string" ||
          ["hint", "letter", "revealed", "resolved"].some(
            (k) => typeof p[k as keyof PuzzleProgress] !== "boolean",
          )
        )
          throw Error("Invalid puzzle");
      if (c.stops[0]?.questions) {
        if (j.categories.length !== 1 || j.categories[0] !== "stories") throw Error("Invalid full journey categories");
        for (const [stopId, answers] of Object.entries(j.learning)) {
          const questions = c.stops.find(s => s.id === stopId)?.questions?.[id];
          if (!questions || !Array.isArray(answers) || answers.length > questions.length || answers.some((a, i) => !int(a) || a >= questions[i]!.options.length)) throw Error("Invalid lesson answers");
        }
        for (const [questId, a] of Object.entries(j.bonus)) {
          const question = c.stops.flatMap(s => bonusesFor(s, id)).find(q => q.id === questId);
          if (!question || !a || !Number.isFinite(a.deadline) || a.deadline < 0 || !["playing","correct","wrong","expired"].includes(a.status) || (a.selected !== null && (!int(a.selected) || a.selected >= question.options.length)) || (a.status === "correct" && a.selected !== question.answer)) throw Error("Invalid bonus attempt");
        }
        for (const s of c.stops) {
          if (j.awards[s.id] !== undefined && !s.puzzles.every(p => j.puzzles[puzzleKey(s.id,p.id)]?.resolved)) throw Error("Unsolved award");
        }
        if ((j.phase === "complete" || j.phase === "finished") && j.awards[c.stops[j.stop]!.id] === undefined) throw Error("Unsolved lesson");
        if (c.stops[0].visualQuestions) {
          const legacyFinished = (s: typeof c.stops[number], index: number) =>
            j.awards[s.id] !== undefined && j.learning[s.id]?.length === questionsFor(s, id).length &&
            (index < j.stop || (index === j.stop && (j.phase === "finished" || bonusesFor(s, id).every(q => j.bonus[q.id]?.status === "correct"))));
          if (j.visualAnswers === undefined) {
            j.visualAnswers = {};
            for (const [index, s] of c.stops.entries()) {
              if (legacyFinished(s, index)) j.visualAnswers[s.id] = "legacy-complete";
            }
          }
          if (!j.visualAnswers || typeof j.visualAnswers !== "object" || Array.isArray(j.visualAnswers)) throw Error("Invalid picture answers");
          for (const [stopId, answers] of Object.entries(j.visualAnswers)) {
            const index = c.stops.findIndex(s => s.id === stopId);
            const s = c.stops[index];
            if (!s || index > j.stop || j.awards[stopId] === undefined) throw Error("Unexpected picture answers");
            const questions = visualQuestionsFor(s, id);
            if (answers === "legacy-complete" ? !legacyFinished(s, index)
              : !Array.isArray(answers) || answers.length > questions.length || answers.some((a, i) => a !== questions[i]!.answer))
              throw Error("Invalid picture answers");
          }
          if (c.stops.slice(0, j.phase === "finished" ? c.stops.length : j.stop).some(s => !roundReady(s, j, id))) throw Error("Unfinished picture chapter");
        } else if (j.phase === "finished" && c.stops.some(s => (j.learning[s.id]?.length ?? 0) < questionsFor(s, id).length)) throw Error("Unfinished journey");
      }
      if (Object.values(j.awards).some((n) => !int(n)))
        throw Error("Invalid awards");
    }
  }
  const inUse = (p: Profile) => p.active !== null || p.tokens !== rules.startingTokens || Object.keys(p.journeys).length > 0;
  if (oldSchoolGroups && inUse(g.profiles.b)) g.pendingSchoolSplit = true;
  if (g.pendingSchoolSplit !== undefined && (g.pendingSchoolSplit !== true || inUse(g.profiles.teen)))
    throw Error("Invalid pending age selection");
  return g;
}

/** Preserve the old wallet and completed story riddles; never count a name-only riddle as a full chapter. */
function migrateLegacy(old: any, catalog: Character[]): Game {
  const next = newGame();
  if (old.tier === null || ["a","b","c"].includes(old.tier)) next.tier = old.tier;
  const mappings = [["burning-bush","burning-bush","life-moses-2"], ["before-pharaoh","pharaoh","life-moses-7"], ["the-sea","sea","life-moses-4"]];
  for (const tier of ["a","b","c"] as TierId[]) {
    const previous = old.profiles?.[tier];
    if (!previous || !Number.isSafeInteger(previous.tokens) || previous.tokens < 0) throw Error("Invalid legacy profile");
    next.profiles[tier].tokens = previous.tokens;
    const c = catalog.find(c => c.id === "moses");
    const legacy = previous.journeys?.moses;
    if (!c || !legacy) continue;
    const journey = newJourney(["stories"]);
    for (const [oldStop,oldPuzzle,newStop] of mappings) {
      const prior = legacy.puzzles?.[puzzleKey(oldStop!,oldPuzzle!)];
      const stop = c.stops.find(s => s.id === newStop);
      // Pharaoh alone is insufficient for the full encounter: replay that chapter.
      if (!stop || oldPuzzle === "pharaoh" || !prior?.resolved || prior.revealed) continue;
      const key = puzzleKey(stop.id,stop.puzzles[0]!.id);
      const earned = Number.isInteger(prior.earned) ? Math.max(0,Math.min(5,prior.earned)) : 0;
      journey.puzzles[key] = {...newPuzzle(),resolved:true,earned};
      journey.awards[stop.id] = Math.max(3,earned);
    }
    next.profiles[tier].journeys.moses = journey;
    if (previous.active === "moses") next.profiles[tier].active = "moses";
  }
  return next;
}
