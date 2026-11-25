import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { additionalBibleStops } from "../src/generalBibleStops";
import { classifyGuess } from "../src/puzzleAnswer";
import { roundArtwork } from "../src/round";
import { tierIds } from "../src/types";

test("the four additional picture stories have matched Hebrew and English cards at every age", () => {
  const english = additionalBibleStops("en");
  const hebrew = additionalBibleStops("he");
  assert.deepEqual(english.map(s => s.id), hebrew.map(s => s.id));
  assert.equal(english.length, 4);
  for (const [index, en] of english.entries()) {
    const he = hebrew[index]!;
    for (const stop of [he, en]) {
      const puzzle = stop.puzzles[0]!;
      assert.equal(puzzle.choicesKids.filter(title => title === puzzle.answer).length, 1);
      assert.equal(puzzle.choicePicturesKids.length, puzzle.choicesKids.length);
      assert.equal(new Set(Object.values(stop.picturePrompt!)).size, tierIds.length);
      for (const tier of tierIds) {
        const qs = stop.visualQuestions![tier];
        assert.equal(new Set(qs.map(q => q.prompt)).size, 4);
        for (const q of qs) {
          assert.equal(new Set(q.options).size, q.options.length);
          assert.ok(q.options[q.answer] && q.explanation);
          assert.equal(/[א-ת]/u.test(q.prompt), stop === he);
        }
      }
    }
    for (const tier of tierIds) {
      assert.deepEqual(he.visualQuestions![tier].map(q => q.answer), en.visualQuestions![tier].map(q => q.answer));
    }
  }
});

test("each scene provides distinct, installed artwork for all five cards and three extra clues per age", () => {
  const files = new Set<string>();
  for (const stop of additionalBibleStops("en")) {
    const puzzle = stop.puzzles[0]!;
    for (const edition of ["kids", "teen", "classic"] as const) {
      const selected = [[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[0,2],[0,3]].map(([step, clue]) => {
        const art = roundArtwork(edition, step!, clue!);
        const original = puzzle.images[art.set]![art.index]!;
        const file = edition === art.set ? original : edition + "-" + original;
        assert.match(file, /^(?:(?:kids|teen|classic)-)?journey-[a-f0-9]{16}\.webp$/);
        assert.ok(existsSync(resolve("assets/puzzles",file)), file);
        files.add(file);
        return file;
      });
      assert.equal(new Set(selected).size, 8);
    }
  }
  assert.equal(files.size, 96);
});

test("naming the pictured event solves it while a related person or object earns a near hint", () => {
  for (const lang of ["he", "en"] as const) {
    const stops = additionalBibleStops(lang);
    for (const stop of stops) {
      const puzzle = stop.puzzles[0]!;
      for (const other of stops)
        assert.equal(classifyGuess(other.title,puzzle), other === stop ? "correct" : "wrong");
    }
    const cases: [string, string][] = [
      ["gen-babel", "bricks"], ["gen-abram", "אברם"], ["gen-jacob", "יעקב"],
      ["gen-joseph", "Joseph"], ["gen-joseph", "coat of many colors"],
    ];
    for (const [id, guess] of cases)
      assert.equal(classifyGuess(guess,stops.find(s => s.id === id)!.puzzles[0]!), "near", guess);
  }
});
