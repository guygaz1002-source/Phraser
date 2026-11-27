import early from "../content/gentler/early.json";
import primary from "../content/gentler/primary.json";
import teen from "../content/gentler/teen.json";
import adult from "../content/gentler/adult.json";
import type { Language } from "./locale";
import type { Question, TierId } from "./types";

type Opening = Pick<Question,"prompt">;
type Wording = Record<Language, Opening | Question> & {introductory?: boolean};
export const gentlerQuestions: Record<TierId, Record<string,Wording>> = {a:early, b:primary, teen, c:adult};

export function retainPassageReference(question: Question, prior: Question) {
  const reference = prior.explanation.match(/\s+\([^()]+\)[.׳]?\s*$/u)?.[0]?.trim();
  if (!reference || question.explanation.endsWith(reference)) return question;
  return {...question, explanation:question.explanation + " " + reference};
}
