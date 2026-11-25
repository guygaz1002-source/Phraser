export const tierIds = ["a", "b", "teen", "c"] as const;
export type TierId = (typeof tierIds)[number];
export type StoryEdition = "a" | "b" | "c";
export type Category = "stories" | "figures" | "proverbs";
export type Tile = { x: number; y: number };
export type TileKind =
  | "grass"
  | "sand"
  | "water"
  | "tree"
  | "rock"
  | "building";
export type Question = { prompt: string; options: string[]; answer: number; explanation: string };
export type BonusQuestion = Question & { id: string; title: string; item: string };
export type BonusAttempt = { deadline: number; status: "playing" | "correct" | "wrong" | "expired"; selected: number | null };
export type Puzzle = {
  id: string;
  category: Category;
  answer: string;
  aliases: string[];
  partialAnswers?: string[];
  sourceUrl?: string;
  clueNotes?: Record<StoryEdition, string[]>;
  discovery?: string;
  reflection?: string;
  textHint: string;
  moral: string;
  source: string;
  images: { kids: string[]; teen?: string[]; classic: string[] };
  imageGrid?: { columns: number; rows: number };
  descriptions: { kids: string[]; teen?: string[]; classic: string[] };
  choicesKids: string[];
  choiceLabelsKids: string[];
  choicePicturesKids: string[];
};
export type Stop = {
  solvedTitle?: string;
  questions?: Record<StoryEdition, Question[]> & { teen?: Question[] };
  bonus?: BonusQuestion[];
  visualQuestions?: Record<TierId, Question[]>;
  bonusByTier?: Record<TierId, BonusQuestion[]>;
  picturePrompt?: Partial<Record<TierId, string>>;
  scene?: "desert" | "palace" | "sea";
  id: string;
  title: string;
  shortTitle: string;
  tile: Tile;
  signTile?: Tile;
  pathToNext: Tile[];
  passage: Record<StoryEdition, string>;
  source: string;
  sensitive: boolean;
  contentWarning?: string;
  learned: Record<StoryEdition, string>;
  puzzles: Puzzle[];
};
export type Character = {
  ending?: Record<StoryEdition, string>;
  id: string;
  name: string;
  epithet: string;
  epithetKids: string;
  tilemap: { width: number; height: number; tiles: TileKind[][] };
  stops: Stop[];
};
export type Phase = "map" | "intro" | "puzzle" | "complete" | "finished";
export type PuzzleProgress = {
  image: number;
  hint: boolean;
  letter: boolean;
  revealed: boolean;
  resolved: boolean;
  earned: number;
  draft: string;
};
export type PlayMode = "solo" | "duo";
export type ExpeditionPhase = "travel" | "question" | "discovery" | "bonus" | "game-over" | "finished";
export type ExpeditionItem = "jar" | "staff" | "lamp" | "seal";
export type Expedition = {
  seed: number;
  /** Saved ordinary card IDs. Absent in the original fixed-route saves. */
  deck?: string[];
  curriculumTier?: TierId;
  /** A previously displayed treasure keeps its question until it closes. */
  legacyBonusAt?: number;
  landmark: number;
  step: number;
  phase: ExpeditionPhase;
  revision: number;
  lives: number;
  turn: 0 | 1;
  scores: [number, number];
  inventory: { lamp: number; seal: number };
  paid: number[];
  encounters: Record<string, "correct" | "wrong" | "expired">;
  progress: PuzzleProgress;
  deadline: number | null;
  remainingMs: number | null;
};
export type KeyedExpeditionAction =
  | { type: "expedition-arrive" | "expedition-expire" | "expedition-pause" | "expedition-resume"; key: string; now: number }
  | { type: "expedition-answer"; key: string; choice?: number; value?: string; now: number }
  | { type: "expedition-buy"; key: string; clue: Exclude<Clue, "answer"> }
  | { type: "expedition-draft"; key: string; value: string }
  | { type: "expedition-retry"; key: string };
export type Journey = {
  expedition?: Expedition;
  positions?: Record<string, Tile>;
  exploring?: string;
  phase: Phase;
  stop: number;
  puzzle: number;
  categories: Category[];
  walkingFrom: number | null;
  puzzles: Record<string, PuzzleProgress>;
  awards: Record<string, number>;
  visualAnswers?: Record<string, number[] | "legacy-complete">;
  learning: Record<string, number[]>;
  bonus: Record<string, BonusAttempt>;
};
export type Profile = {
  tokens: number;
  active: string | null;
  journeys: Record<string, Journey>;
};
export type Game = {
  version: 4;
  playMode?: PlayMode;
  duoProfiles?: Record<TierId, Profile>;
  tier: TierId | null;
  profiles: Record<TierId, Profile>;
  pendingSchoolSplit?: true;
};
export type Clue = "image" | "hint" | "letter" | "answer";
export type Action =
  | KeyedExpeditionAction
  | { type: "expedition-start"; seed: number }
  | { type: "play-mode"; mode: PlayMode }
  | { type: "tier"; tier: TierId }
  | { type: "assign-school-profile"; tier: "b" | "teen" }
  | { type: "select"; id: string }
  | { type: "restart-journey"; id: string }
  | { type: "start"; categories: Category[] }
  | { type: "round-open" | "round-next"; stopId: string }
  | { type: "enter" | "begin" | "continue" | "walked" | "accept-reveal" }
  | { type: "guess" | "draft"; value: string }
  | { type: "buy"; clue: Clue }
  | { type: "explore"; stopId: string }
  | { type: "move"; stopId: string; position: Tile }
  | { type: "picture-answer"; stopId: string; questionIndex: number; choice: number }
  | { type: "learn"; choice: number; stopId?: string; questionIndex?: number }
  | { type: "bonus-start" | "bonus-expire"; id: string; now: number; stopId?: string }
  | { type: "bonus-resume"; id: string; stopId: string; expectedDeadline: number; pausedAt: number; now: number }
  | { type: "bonus-answer"; id: string; now: number; choice: number; stopId?: string };
