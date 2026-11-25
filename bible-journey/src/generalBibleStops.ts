import plates from "../content/general-bible-illustrations.json";
import questions from "../content/general-bible-questions.json";
import scenes from "../content/general-bible-scenes.json";
import type { Language } from "./locale";
import type { Stop } from "./types";

type SceneId = keyof typeof scenes;
const rankById = new Map(plates.map(plate => [plate.id, plate.rank]));

export function generalBibleRank(stopId: string) {
  return rankById.get(stopId);
}

function localize(language: Language): Stop[] {
  return plates.map((plate, index) => {
    const id = plate.id as SceneId;
    const scene = scenes[id];
    const text = scene[language];
    const choices = plates.map((_, i) => plates[(i + 1 + index * 2) % plates.length]!);
    const titles = choices.map(other => scenes[other.id as SceneId][language].title);
    return {
      id,
      title: text.title,
      shortTitle: text.title,
      solvedTitle: text.title,
      tile: { x: 0, y: 0 },
      pathToNext: [],
      passage: text.passage,
      learned: text.passage,
      source: text.reference,
      sensitive: false,
      picturePrompt: text.picturePrompt,
      visualQuestions: questions[language][id],
      puzzles: [{
        id,
        category: "stories",
        answer: text.title,
        aliases: scene.aliases,
        partialAnswers: scene.partialAnswers,
        source: text.reference,
        sourceUrl: scene.sourceUrl,
        textHint: text.hint,
        moral: text.passage.a,
        images: plate.deliveredImages,
        descriptions: { kids: text.descriptions, teen: text.descriptions, classic: text.descriptions },
        choicesKids: titles,
        choiceLabelsKids: titles,
        choicePicturesKids: choices.map(other => other.deliveredImages.kids[3]!),
      }],
    };
  });
}

const catalogs = { he: localize("he"), en: localize("en") };

export function additionalBibleStops(language: Language): Stop[] {
  return catalogs[language];
}
