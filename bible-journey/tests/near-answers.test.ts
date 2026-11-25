import assert from "node:assert/strict";
import test from "node:test";
import { catalogFor } from "../src/catalogs";
import { classifyGuess } from "../src/puzzleAnswer";

for (const language of ["he", "en"] as const) {
  const puzzles = catalogFor(language).flatMap(hero => hero.stops.flatMap(stop => stop.puzzles));
  const find = (id: string) => puzzles.find(puzzle => puzzle.id === id)!;

  test(`related free responses get encouragement in the ${language} catalog`, () => {
    const ark = find("life-noah-1");
    for (const value of ["סיפור נוח", "הסיפור של נֹחַ", "סיפורו של נח", "תיבת נוח", "Noah’s story", "the story of Noah", "the story of the ark", "Noah's ark", "נח והתיבה", "Noah and the ark"]) {
      assert.equal(classifyGuess(value, ark), "near", value);
    }
    const simpleArk = { ...ark, answer: "תיבת נוח", partialAnswers: [], aliases: ["Noah's Ark"] };
    assert.equal(classifyGuess("סיפור נוח", simpleArk), "near");
    assert.equal(classifyGuess("Noah’s story", simpleArk), "near");
    assert.equal(classifyGuess("תיבת נוח", simpleArk), "correct");
    assert.equal(classifyGuess("בניית התבה", ark), "near");
    assert.equal(classifyGuess("the story of Miriam", find("life-moses-1")), "near");
    assert.equal(classifyGuess("דלילה", find("life-samson-4")), "near");
    assert.equal(classifyGuess("Noah shovel", ark), "wrong");
    assert.equal(classifyGuess("Noah and the burning bush", ark), "wrong");
    assert.equal(classifyGuess("נח ודלילה", ark), "wrong");
    assert.equal(classifyGuess("סיפור משה", ark), "wrong");
    assert.equal(classifyGuess("לא בניית התיבה", ark), "wrong");
    assert.equal(classifyGuess("", ark), "wrong");
    assert.equal(classifyGuess("סיפור חידת שמשון", find("life-samson-1")), "wrong");
    assert.equal(classifyGuess("the story of the Exodus", find("life-moses-4")), "wrong");
  });

  test(`each event remains a win only for its own picture in the ${language} catalog`, () => {
    for (const puzzle of puzzles) {
      for (const other of puzzles) {
        assert.equal(classifyGuess(other.answer, puzzle), other.id === puzzle.id ? "correct" : "wrong",
          `${puzzle.id}: ${other.answer}`);
      }
    }
    assert.equal(classifyGuess("Building the Ark", find("life-noah-1")), "correct");
    assert.equal(classifyGuess("בניית התיבה", find("life-noah-1")), "correct");
    assert.equal(classifyGuess("Builidng the Ark", find("life-noah-1")), "correct");
  });
}
