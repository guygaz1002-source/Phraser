import moses from "../content/characters/moses.json";
import samson from "../content/characters/samson.json";
import noah from "../content/characters/noah.json";
import mosesHe from "../content/hebrew/characters/moses.json";
import samsonHe from "../content/hebrew/characters/samson.json";
import noahHe from "../content/hebrew/characters/noah.json";
import { curriculumFor } from "./curriculum";
import type { Character } from "./types";
import type { Language } from "./locale";
const original = [moses, samson, noah] as Character[];
const hebrew = [mosesHe, samsonHe, noahHe] as Character[];
// IDs and choice indexes stay identical across languages, so existing saves are shared.
// Accept either language after switching, without changing the displayed answer.
function bilingual(language: Language, catalog: Character[], other: Character[]): Character[] {
  return catalog.map(character => ({ ...character, stops: character.stops.map(stop => {
    const translated = other.find(c => c.id === character.id)!.stops.find(s => s.id === stop.id)!;
    return { ...stop, ...curriculumFor(language, stop), puzzles: stop.puzzles.map(puzzle => {
      const alternate = translated.puzzles.find(p => p.id === puzzle.id)!;
      return { ...puzzle, aliases: [...new Set([...puzzle.aliases, alternate.answer, ...alternate.aliases])],
        partialAnswers: [...new Set([...(puzzle.partialAnswers ?? []), ...(alternate.partialAnswers ?? []), character.name, other.find(c => c.id === character.id)!.name])] };
    }) };
  }) }));
}
const catalogs: Record<Language, Character[]> = { he: bilingual("he", hebrew, original), en: bilingual("en", original, hebrew) };
export function catalogFor(language: Language): Character[] { return catalogs[language]; }
