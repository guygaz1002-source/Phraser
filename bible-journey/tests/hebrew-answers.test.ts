import test from "node:test";
import assert from "node:assert/strict";
import authoredAliases from "../content/hebrew/answer-aliases.json";
import { catalogFor } from "../src/catalogs";
import { current, matches, newGame, restore, transition } from "../src/game";
import type { Language } from "../src/locale";

const languages: Language[] = ["he", "en"];
const puzzleFor = (language: Language, stopId: string) => {
  const stop = catalogFor(language).flatMap(hero => hero.stops).find(stop => stop.id === stopId);
  assert.ok(stop, `Missing ${language}/${stopId}`);
  return stop.puzzles[0]!;
};
const reproduced: [string, string][] = [
  ["life-moses-1", "משה ביאור"],
  ["life-moses-1", "משה התינוק ביאור"],
  ["life-moses-1", "משה התינוק נמצא בתיבה"],
  ["life-moses-1", "בת פרעה מוצאת את משה בתיבה"],
  ["life-samson-1", "המלאך מבשר על לידת שמשון"],
  ["life-samson-1", "הבשורה על הולדת שמשון"],
  ["life-noah-1", "נוח בונה את התיבה"],
  ["life-noah-1", "בניית התיבה של נח"],
];

test("the eight natural Hebrew answers rejected in the adult browser flow are accepted in either UI language", () => {
  for (const language of languages) for (const [id, answer] of reproduced) {
    assert.ok(matches(answer, puzzleFor(language, id)), `${language}/${id}: ${answer}`);
  }
  assert.ok(matches("  מֹשֶׁה הַתִּינוֹק בַּיְאוֹר!  ", puzzleFor("he", "life-moses-1")));
  assert.ok(matches("בניית־התיבה של נוח", puzzleFor("he", "life-noah-1")));
});

// Independent examples: each Hebrew description means an already accepted
// English alternative, including later chapters beyond the reported failures.
const semanticPairs: [string, string, string][] = [
  ["life-moses-1", "משה התינוק ביאור", "Baby Moses in the Nile"],
  ["life-moses-6", "משה עוזר לרועות", "Moses helps the shepherdesses"],
  ["life-moses-2", "הסנה שלא נשרף", "the bush that was not consumed"],
  ["life-moses-7", "משה ואהרן נפגשים עם פרעה", "Moses and Aaron meet Pharaoh"],
  ["life-moses-3", "בני ישראל עוזבים את מצרים", "the Israelites leave Egypt"],
  ["life-moses-4", "משה בוקע את ים סוף", "Moses parts the Red Sea"],
  ["life-moses-8", "לחם מהשמים", "bread from heaven"],
  ["life-moses-9", "קבלת עשרת הדברות", "receiving the Ten Commandments"],
  ["life-moses-5", "משה בוחר ביהושע", "Moses chooses Joshua"],
  ["life-samson-1", "המלאך מבשר על לידת שמשון", "an angel announces Samson's birth"],
  ["life-samson-6", "שמשון מנצח את האריה", "Samson defeats the lion"],
  ["life-samson-2", "חידת הדבש והאריה", "the lion and honey riddle"],
  ["life-samson-7", "שמשון שובר את החבלים", "Samson breaks the ropes"],
  ["life-samson-8", "שמשון צמא ומבקש מים", "Samson asks for water"],
  ["life-samson-3", "שמשון מרים את השערים", "Samson lifts the gates"],
  ["life-samson-4", "גוזרים לשמשון את השיער", "Samson's hair is cut"],
  ["life-samson-9", "השיער של שמשון צומח מחדש", "Samson's hair grows back"],
  ["life-samson-5", "התפילה האחרונה של שמשון", "Samson's last prayer"],
  ["life-noah-1", "בניית התיבה של נוח", "construction of Noah's ark"],
  ["life-noah-6", "אחסון מזון בתיבה", "storing food"],
  ["life-noah-2", "בעלי החיים נכנסים לתיבה", "the animals enter the ark"],
  ["life-noah-3", "ארבעים יום של גשם", "forty days of rain"],
  ["life-noah-7", "הגשם נפסק", "the rain stops"],
  ["life-noah-8", "נחיתה על הרי אררט", "landing on Ararat"],
  ["life-noah-4", "נח שולח את היונה", "Noah sends out the dove"],
  ["life-noah-9", "משפחת נח יוצאת מהתיבה", "the family leaves the ark"],
  ["life-noah-5", "ההבטחה לנוח", "the promise to Noah"],
];

test("all 27 events accept natural Hebrew counterparts of existing English alternatives", () => {
  assert.deepEqual(semanticPairs.map(([id]) => id).sort(), catalogFor("he").flatMap(hero => hero.stops.map(stop => stop.id)).sort());
  for (const language of languages) for (const [id, hebrew, english] of semanticPairs) {
    const puzzle = puzzleFor(language, id);
    assert.ok(matches(english, puzzle), `English baseline ${language}/${id}: ${english}`);
    assert.ok(matches(hebrew, puzzle), `Hebrew parity ${language}/${id}: ${hebrew}`);
  }
});

test("reviewed phrases regenerate into both catalogs and cannot solve a different event", () => {
  const ids = catalogFor("he").flatMap(hero => hero.stops.map(stop => stop.id));
  assert.deepEqual(Object.keys(authoredAliases).sort(), [...ids].sort());
  for (const language of languages) for (const [id, aliases] of Object.entries(authoredAliases)) {
    for (const alias of aliases) {
      assert.ok(matches(alias, puzzleFor(language, id)), `${language}/${id}: ${alias}`);
      for (const otherId of ids) if (otherId !== id) {
        assert.equal(matches(alias, puzzleFor(language, otherId)), false, `${id} phrase must not solve ${language}/${otherId}: ${alias}`);
      }
    }
  }
});

test("both complete-name Noah spellings work within event phrases, including retained aliases", () => {
  for (const language of languages) {
    const noah = catalogFor(language).find(hero => hero.id === "noah")!;
    let checked = 0;
    for (const stop of noah.stops) {
      const puzzle = stop.puzzles[0]!;
      const phrases = [puzzle.answer, ...puzzle.aliases].filter(alias => /(^|\s)נ(?:ו)?ח(?=\s|$)/.test(alias));
      checked += phrases.length;
      for (const phrase of phrases) {
        assert.ok(matches(phrase.replace(/(^|\s)נוח(?=\s|$)/g, "$1נח"), puzzle), phrase);
        assert.ok(matches(phrase.replace(/(^|\s)נח(?=\s|$)/g, "$1נוח"), puzzle), phrase);
      }
    }
    assert.ok(checked > 0, "No Noah spelling variants were checked");
  }
});

test("similar Hebrew events, partial names, unrelated text and substring guesses remain wrong", () => {
  const confused: [string, string[]][] = [
    ["life-samson-1", ["חידת שמשון", "שמשון שואל חידה", "חידת שמשון על האריה והדבש"]],
    ["life-samson-2", ["לידת שמשון", "הבשורה על הולדת שמשון", "המלאך מבשר על לידת שמשון"]],
    ["life-samson-6", ["שמשון מוצא דבש באריה", "הדבש בפגר האריה"]],
    ["life-samson-2", ["שמשון נלחם באריה", "שמשון מנצח את האריה"]],
    ["life-moses-3", ["קריעת ים סוף", "בני ישראל עוברים בים סוף"]],
    ["life-moses-4", ["יציאת מצרים", "בני ישראל עוזבים את מצרים"]],
    ["life-noah-2", ["נח והחיות יוצאים מהתיבה", "היציאה מתיבת נוח"]],
    ["life-noah-9", ["נוח והחיות נכנסים לתיבה", "הכניסה לתיבת נח"]],
    ["life-noah-7", ["היציאה מהתיבה", "התיבה על הרי אררט", "היונה חוזרת לתיבה"]],
  ];
  for (const language of languages) {
    for (const [id, wrongAnswers] of confused) for (const wrong of wrongAnswers) {
      assert.equal(matches(wrong, puzzleFor(language, id)), false, `${id}: ${wrong}`);
    }
    for (const hero of catalogFor(language)) for (const stop of hero.stops) {
      const puzzle = stop.puzzles[0]!;
      for (const wrong of ["", "!!!", "משה", "שמשון", "נח", "נוח", "אין לי מושג", "תיבת נח", "תיבת נוח", ...(puzzle.partialAnswers ?? [])]) {
        assert.equal(matches(wrong, puzzle), false, `${stop.id}: ${wrong}`);
      }
      assert.equal(matches(`לא ${puzzleFor("he", stop.id).answer}`, puzzle), false, `Negated event ${stop.id}`);
    }
  }
});

test("natural adult answers resolve once, survive restoration and retain saved progress across language switches", () => {
  for (const [id, answer] of reproduced) {
    const heroId = id.split("-")[1]!;
    const he = catalogFor("he"), en = catalogFor("en");
    let game = transition(newGame(), {type: "tier", tier: "c"}, he);
    game = transition(game, {type: "select", id: heroId}, he);
    game = transition(game, {type: "start", categories: ["stories"]}, he);
    game = transition(game, {type: "enter"}, he);
    game = transition(game, {type: "begin"}, he);
    game = transition(game, {type: "draft", value: answer}, he);
    assert.equal(current(game, he).stop!.id, id);
    assert.deepEqual(transition(game, {type: "guess", value: "אין לי מושג"}, he), game);
    const beforeTokens = current(game, he).profile.tokens;
    game = transition(game, {type: "guess", value: answer}, he);
    const solved = current(game, he);
    assert.equal(solved.progress.resolved, true);
    assert.equal(solved.journey!.phase, "complete");
    assert.equal(solved.profile.tokens, beforeTokens + 5);
    assert.equal(solved.journey!.awards[id], 5);
    assert.deepEqual(transition(game, {type: "guess", value: answer}, en), game, "A repeated Enter must not pay twice");
    assert.deepEqual(restore(JSON.stringify(game), en), game);
  }
});
