import heMoses from "../content/curriculum/he/moses.json";
import heSamson from "../content/curriculum/he/samson.json";
import heNoah from "../content/curriculum/he/noah.json";
import enMoses from "../content/curriculum/en/moses.json";
import enSamson from "../content/curriculum/en/samson.json";
import enNoah from "../content/curriculum/en/noah.json";
import heMosesPictures from "../content/visual-rounds/he/moses.json";
import heNoahPictures from "../content/visual-rounds/he/noah.json";
import heSamsonPictures from "../content/visual-rounds/he/samson.json";
import enMosesPictures from "../content/visual-rounds/en/moses.json";
import enNoahPictures from "../content/visual-rounds/en/noah.json";
import enSamsonPictures from "../content/visual-rounds/en/samson.json";
import type { Language } from "./locale";
import type { Question, Stop, TierId } from "./types";

type Chapter = Record<TierId, { picturePrompt?: string; bonuses: Question[]; lessons: Question[] }>;
const chapters: Record<Language, Record<string, Chapter>> = {
  he: { ...heMoses, ...heSamson, ...heNoah },
  en: { ...enMoses, ...enSamson, ...enNoah },
};

const pictures: Record<Language, Record<string, Record<TierId, Question[]>>> = {
  he: { ...heMosesPictures, ...heNoahPictures, ...heSamsonPictures },
  en: { ...enMosesPictures, ...enNoahPictures, ...enSamsonPictures },
};

export function curriculumFor(language: Language, stop: Stop) {
  const chapter = chapters[language][stop.id];
  const visualQuestions = pictures[language][stop.id];
  if (!chapter || !visualQuestions) throw new Error(`Missing ${language} curriculum for ${stop.id}`);

  // The original treasure IDs and choice positions belong to the save format.
  const bonuses = (tier: TierId) => chapter[tier].bonuses.map((question, index) => {
    const treasure = stop.bonus![index]!;
    const title = language === "he" ? `בונוס ${index + 1}` : `Bonus ${index + 1}`;
    return { ...question, id: treasure.id, item: treasure.item, title };
  });
  return {
    visualQuestions,
    picturePrompt: { a: chapter.a.picturePrompt, b: chapter.b.picturePrompt, teen: chapter.teen.picturePrompt, c: chapter.c.picturePrompt },
    questions: { a: chapter.a.lessons, b: chapter.b.lessons, teen: chapter.teen.lessons, c: chapter.c.lessons },
    bonusByTier: { a: bonuses("a"), b: bonuses("b"), teen: bonuses("teen"), c: bonuses("c") },
  };
}
