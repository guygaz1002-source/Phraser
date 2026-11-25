import early from "../content/age-pools/early.json";
import primary from "../content/age-pools/primary.json";
import teen from "../content/age-pools/teen.json";
import adult from "../content/age-pools/adult.json";
import type { Language } from "./locale";
import type { Question, TierId } from "./types";

type Coverage = { source: string; grade: string; rank: number };
type Group = Coverage & { ids: string[] };
type Reading = Coverage & {
  id: string;
  stopId: string;
  artStep: number;
  opening?: boolean;
  reference: Record<Language, string>;
  he: Question;
  en: Question;
};
export type AgeCurriculum = {
  sources: Record<string, string>;
  groups: Group[];
  cards: Reading[];
  bonusSources: Record<string, string[]>;
};

export const ageCurricula: Record<TierId, AgeCurriculum> = { a: early, b: primary, teen, c: adult };

export function expandedIds(group: Group) {
  return group.ids.flatMap(id => id.endsWith("/*")
    ? Array.from({length: 5}, (_, step) => id.slice(0, -1) + step)
    : [id]);
}
