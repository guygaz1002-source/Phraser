import manuscript from "../content/bible-connections.json";
import type { Language } from "./locale";
import { tierIds, type Question, type TierId } from "./types";

/** artStep uses the same five-frame numbering as the ordinary picture questions. */
export type BibleConnection = { id: string; stopId: string; artStep: 1 | 2 | 3 | 4; map: number };
type Wording = { prompt: string; options: string[]; explanation: string };
type Entry = BibleConnection & {
  reference: Record<Language, string>;
  cards: Record<TierId, Record<Language, Wording>>;
};
const entries = manuscript as Entry[];
const byId = new Map(entries.map(entry => [entry.id, entry]));
export const bibleConnections: readonly BibleConnection[] = entries;

export function bibleConnectionQuestion(id: string, tier: TierId, language: Language): Question {
  const entry = byId.get(id);
  if (!entry) throw Error("Unknown Bible connection: " + id);
  const card = entry.cards[tier][language];
  // The manuscript lists the correct answer first. Both languages use the same stable rotation.
  const answer = (entry.map + entry.artStep + tierIds.indexOf(tier)) % card.options.length;
  const options = card.options.map((_, i) => card.options[(i - answer + card.options.length) % card.options.length]!);
  return { prompt: card.prompt, options, answer, explanation: card.explanation + " (" + entry.reference[language] + ")" };
}
