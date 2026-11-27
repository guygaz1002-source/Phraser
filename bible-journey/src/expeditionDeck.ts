import { gentlerQuestions, retainPassageReference } from "./gentlerQuestions";
import { ageCurricula, expandedIds } from "./ageCurriculum";
import { bibleConnectionQuestion, bibleConnections } from "./bibleConnections";
import { isPassageComparison, routePictureQuestion } from "./expeditionConnections";
import { finaleCard, finaleSceneIds } from "./expeditionFinale";
import { additionalBibleStops, generalBibleRank } from "./generalBibleStops";
import type { Language } from "./locale";
import type { Character, Question, Stop, TierId } from "./types";

export const MAP_COUNT = 7;
export const LANDMARKS_PER_MAP = 4;
export const QUESTIONS_PER_LANDMARK = 5;
export const LANDMARK_COUNT = MAP_COUNT * LANDMARKS_PER_MAP;

type Card = {
  id: string;
  stop: Stop;
  artStep: number;
  rank: number;
  afterFirstMap?: boolean;
  opening?: boolean; // Some age-specific picture riddles open with illustrated multiple choice.
  map?: number; // Cross-story comparisons are authored for a particular difficulty map.
  question?: (tier: TierId) => Question;
};

type Bank = { cards: Card[]; byId: Map<string, Card>; legacy: string[]; legacyStops: Stop[]; tier?: TierId; eligible?: Set<string> };
const banks = new WeakMap<Character[], Bank>();

function pictureId(stop: Stop, step: number) { return stop.id + "/" + step; }

// IDs, never translated strings or array positions in the shuffled pool, are saved to disk.
function originalBank(catalog: Character[]): Bank {
  const cached = banks.get(catalog);
  if (cached) return cached;
  const guides = ["noah","moses","samson"].map(id => catalog.find(hero => hero.id === id));
  if (guides.some(hero => hero?.stops.length !== 9)) throw Error("Missing Bible expedition content");
  const legacyStops = Array.from({length:27}, (_,i) => guides[i % 3]!.stops[Math.floor(i / 3)]!);
  const language: Language = /[א-ת]/.test(guides[0]!.name) ? "he" : "en";
  const scenes = [...legacyStops, ...additionalBibleStops(language)];
  const stops = new Map(scenes.map(stop => [stop.id, stop]));
  const cards: Card[] = [];
  for (const [index,stop] of scenes.entries()) {
    const rank = generalBibleRank(stop.id) ?? Math.floor(index / 3);
    for (let step = 0; step < QUESTIONS_PER_LANDMARK; step++) {
      cards.push({id:pictureId(stop,step), stop, artStep:step, rank,
        question: step === 0 ? undefined : tier => routePictureQuestion(stop,tier,step,language)!});
    }
  }
  const legacy = legacyStops.flatMap(stop => Array.from({length:5},(_,i) => pictureId(stop,i)));
  for (const [i,scene] of finaleSceneIds.entries()) {
    const id = "finale/" + i;
    cards.push({id,stop:stops.get(scene)!,artStep:i,rank:8,map:7,question:tier => finaleCard(tier,i,language)});
    legacy.push(id);
  }
  for (const extra of bibleConnections) {
    const stop = stops.get(extra.stopId);
    if (!stop) throw Error("Missing scene for " + extra.id);
    cards.push({id:"connection/" + extra.id, stop, artStep:extra.artStep, rank:(extra.map-1)*8/(MAP_COUNT-1),
      map:extra.map, question:tier => bibleConnectionQuestion(extra.id,tier,language)});
  }
  const bank = {cards, byId:new Map(cards.map(card => [card.id,card])), legacy, legacyStops};
  if (bank.byId.size !== cards.length) throw Error("Duplicate Bible card ID");
  banks.set(catalog,bank);
  return bank;
}

// Every suggested answer should be an event in the player’s age-specific curriculum.
function scopePictureChoices(cards: Card[]) {
  const known = cards.filter(card => !card.question).map(card => card.stop);
  const names = new Set(known.map(stop => stop.puzzles[0]!.answer));
  const scopedStops = new Map<string, Stop>();
  for (const card of cards) {
    const stop = card.stop;
    if (!scopedStops.has(stop.id)) {
      const puzzle = stop.puzzles[0]!;
      const answers = [...puzzle.choicesKids], labels = [...puzzle.choiceLabelsKids], pictures = [...puzzle.choicePicturesKids];
      const prefix = stop.id.split("-").slice(0,-1).join("-") + "-";
      const candidates = [...known.filter(s => s.id.startsWith(prefix)), ...known.filter(s => !s.id.startsWith(prefix))];
      for (let i=0; i<answers.length; i++) {
        if (names.has(answers[i]!) || answers[i] === puzzle.answer) continue;
        const replacement = candidates.find(s => !answers.includes(s.puzzles[0]!.answer))?.puzzles[0];
        if (!replacement) throw Error("Not enough age-appropriate picture choices");
        answers[i] = labels[i] = replacement.answer;
        pictures[i] = replacement.images.kids[3]!;
      }
      scopedStops.set(stop.id, {...stop, puzzles:[{...puzzle, choicesKids:answers,
        choiceLabelsKids:labels, choicePicturesKids:pictures}, ...stop.puzzles.slice(1)]});
    }
    card.stop = scopedStops.get(stop.id)!;
  }
}

function applyGentlerQuestions(cards: Card[], tier: TierId, language: Language) {
  const manuscript = gentlerQuestions[tier];
  const revisedStops = new Map<string,Stop>();
  for (const card of cards) {
    const row = manuscript[card.id];
    const wording = row?.[language];
    const crossStory = card.id.startsWith("age/") || card.id.startsWith("connection/")
      || card.id.startsWith("finale/") || isPassageComparison(card.stop.id,card.artStep);
    card.afterFirstMap = crossStory && !row?.introductory;
    if (!wording) throw Error("Missing " + tier + " wording for " + card.id);
    if (card.question && "options" in wording) {
      const question = retainPassageReference(wording,card.question(tier));
      card.question = () => question;
    } else if (!card.question && !("options" in wording)) {
      const stop = card.stop;
      revisedStops.set(stop.id, {...stop,picturePrompt:{...stop.picturePrompt,[tier]:wording.prompt}});
    } else {
      throw Error("Incompatible wording for picture card " + card.id);
    }
  }
  for (const card of cards) card.stop = revisedStops.get(card.stop.id) ?? card.stop;
}

const ageBanks = new WeakMap<Character[], Partial<Record<TierId, Bank>>>();

const previousAgeBanks = new WeakMap<Character[], Partial<Record<TierId, Bank>>>();

export function questionBank(catalog: Character[], tier?: TierId, previousWording = false): Bank {
  const original = originalBank(catalog);
  if (!tier) return original; // Unversioned saves contain the shared question IDs.
  const cache = previousWording ? previousAgeBanks : ageBanks;
  const cached = cache.get(catalog) ?? {};
  if (cached[tier]) return cached[tier];
  const language = /[א-ת]/.test(catalog[0]!.name) ? "he" : "en";
  const syllabus = ageCurricula[tier];
  const cards: Card[] = [];
  for (const group of syllabus.groups) {
    for (const id of expandedIds(group)) {
      const card = original.byId.get(id);
      if (!card) throw Error("Unknown curriculum question: " + id);
      // In an age-specific route the curriculum rank determines when a card is taught.
      cards.push({...card, rank:group.rank, map:undefined});
    }
  }
  const stops = new Map(original.cards.map(card => [card.stop.id, card.stop]));
  for (const reading of syllabus.cards) {
    const stop = stops.get(reading.stopId);
    if (!stop) throw Error("Unknown curriculum illustration: " + reading.stopId);
    const wording = reading[language];
    const question = {...wording, explanation: wording.explanation + " (" + reading.reference[language] + ")"};
    cards.push({id:"age/" + tier + "/" + reading.id, stop, artStep:reading.artStep,
      rank:reading.rank, opening:reading.opening, question:() => question});
  }
  if (!previousWording) applyGentlerQuestions(cards, tier, language);
  if (!previousWording || tier === "a") scopePictureChoices(cards);
  const eligible = new Set(cards.map(card => card.id));
  if (eligible.size !== cards.length) throw Error("Duplicate curriculum question in " + tier);
  const bank = {...original, cards, byId:new Map(original.byId), tier, eligible};
  for (const card of cards) bank.byId.set(card.id,card);
  cached[tier] = bank;
  cache.set(catalog,cached);
  return bank;
}

function opensLandmark(card: Card) { return !card.question || card.opening === true; }

export function randomSequence(seed: number) {
  let value = seed | 0;
  return () => {
    value = (Math.imul(value,1664525) + 1013904223) | 0;
    return (value >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], next: () => number) {
  for (let i = items.length-1; i > 0; i--) {
    const j = Math.floor(next()*(i+1));
    [items[i],items[j]] = [items[j]!,items[i]!];
  }
  return items;
}

// Split the curriculum in seven ascending bands. Shuffling ties before dividing keeps a
// story at a boundary eligible on either map. A map draws only a subset of its cards.
function preferredMaps(cards: Card[], next: () => number) {
  const ordered = shuffle([...cards],next).sort((a,b) => a.rank-b.rank);
  return new Map(ordered.map((card,i) => {
    const map = 1 + Math.floor(i * MAP_COUNT / ordered.length);
    return [card.id, card.afterFirstMap ? Math.max(2,map) : map];
  }));
}

export function drawExpeditionDeck(bank: Bank, seed: number, pinned: ReadonlySet<number>, previous = bank.legacy): string[] {
  const salt = bank.tier ? {a:29, b:521, teen:1987, c:7919}[bank.tier] : 0;
  const next = randomSequence(seed ^ 0x51bd143a ^ salt);
  const openers = bank.cards.filter(opensLandmark);
  const pictures = bank.cards.filter(card => !opensLandmark(card) && !card.map);
  const bands = new Map([...preferredMaps(openers,next), ...preferredMaps(pictures,next)]);
  // Reserving every pinned card up front prevents a migrated landmark appearing twice.
  const deck: string[] = Array(bank.legacy.length);
  const used = new Set<string>();
  for (const i of pinned) {
    const first = i * QUESTIONS_PER_LANDMARK;
    for (let j=first; j<first+QUESTIONS_PER_LANDMARK; j++) {
      deck[j] = previous[j]!;
      used.add(deck[j]!);
    }
  }

  // Random tie order, independent of the companion, language and current answers.
  const pool = shuffle([...bank.cards],next);
  const featured = new Set(pool.filter(card => card.id.startsWith("age/") && next() < 0.55).map(card => card.id));
  for (let map=1; map<=MAP_COUNT; map++) {
    const start = (map-1)*LANDMARKS_PER_MAP;
    const landmarks = Array.from({length:LANDMARKS_PER_MAP},(_,i) => start+i).filter(i => !pinned.has(i));
    // Hide the comparisons among the ordinary questions, at most one per landmark.
    const comparisons = pool.filter(card => card.map === map && !used.has(card.id));
    const comparisonSlots = new Map<number,{slot:number;card:Card}>();
    const comparisonCount = map === MAP_COUNT ? 4 : map >= 5 ? 3 : 2;
    for (const [index,landmark] of shuffle([...landmarks],next).slice(0,Math.min(comparisonCount,comparisons.length)).entries()) {
      const card = comparisons[index]!;
      comparisonSlots.set(landmark,{slot:1+Math.floor(next()*4),card});
      used.add(card.id);
    }
    for (const landmark of landmarks) {
      const comparison = comparisonSlots.get(landmark);
      const seenScenes = new Set<string>(), seenPictures = new Set<string>();
      if (comparison) {
        seenScenes.add(comparison.card.stop.id);
        seenPictures.add(pictureId(comparison.card.stop,comparison.card.artStep));
      }
      for (let step=0; step<QUESTIONS_PER_LANDMARK; step++) {
        const slot = landmark*QUESTIONS_PER_LANDMARK+step;
        if (step === comparison?.slot) {
          deck[slot] = comparison.card.id;
          continue;
        }
        let best: Card | undefined, bestScore = Infinity;
        for (const card of pool) {
          const laterReading = map === 1 && card.afterFirstMap;
          if (laterReading && !pinned.size) continue;
          if (used.has(card.id) || opensLandmark(card) !== (step===0) || (card.map && card.map!==map)) continue;
          if (seenPictures.has(pictureId(card.stop,card.artStep))) continue;
          const bandDistance = card.map ? 0 : Math.abs(bands.get(card.id)!-map);
          // Ordinary school-bank questions stay in their band, with nearest-band fallback
          // only when a legacy reservation exhausted it. Prefer different pictures locally.
          // Start each fresh game with the familiar multi-clue picture puzzle. Within a
          // difficulty band give the readings written specifically for this age a turn.
          const firstRiddle = slot === 0 && card.question ? 100 : 0;
          const ageReading = featured.has(card.id) ? -0.5 : 0;
          const score = (laterReading ? 1000 : 0) + firstRiddle + bandDistance*8 + (card.map ? 4 : 0)
            + (seenScenes.has(card.stop.id) ? 1 : 0) + ageReading;
          if (score < bestScore) {best=card;bestScore=score;}
        }
        if (!best) throw Error("Not enough distinct Bible cards for the expedition");
        deck[slot]=best.id; used.add(best.id); seenScenes.add(best.stop.id);
        seenPictures.add(pictureId(best.stop,best.artStep));
      }
    }
  }
  // Let players build up to the more demanding follow-ups within a landmark.
  // Keep the opening and any sequence already seen in an older save in place.
  if (bank.tier) {
    for (let landmark=0; landmark<LANDMARK_COUNT; landmark++) {
      if (pinned.has(landmark)) continue;
      const start = landmark * QUESTIONS_PER_LANDMARK + 1;
      const followups = deck.slice(start,start + QUESTIONS_PER_LANDMARK - 1);
      followups.sort((a,b) => bank.byId.get(a)!.rank - bank.byId.get(b)!.rank);
      deck.splice(start,followups.length,...followups);
    }
  }
  return deck;
}

export function validateDeck(deck: string[], bank: Bank, pinned: ReadonlySet<number> = new Set()) {
  if (!Array.isArray(deck) || deck.length !== bank.legacy.length || new Set(deck).size !== deck.length)
    throw Error("Invalid saved question deck");
  for (const [i,id] of deck.entries()) {
    const card = bank.byId.get(id);
    const map = 1 + Math.floor(i / (LANDMARKS_PER_MAP * QUESTIONS_PER_LANDMARK));
    // The previously published final landmark opened with a comparison rather than a riddle.
    const legacyOpening = i === deck.length - QUESTIONS_PER_LANDMARK && id === bank.legacy[i];
    if (!card || (bank.eligible && !bank.eligible.has(id) && !pinned.has(Math.floor(i/QUESTIONS_PER_LANDMARK))) ||
        (card.map !== undefined && card.map !== map) ||
        (!legacyOpening && (i % QUESTIONS_PER_LANDMARK === 0) !== opensLandmark(card)))
      throw Error("Invalid saved question card");
  }
}
