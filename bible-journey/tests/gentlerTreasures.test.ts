import assert from "node:assert/strict";
import test from "node:test";
import { catalogFor } from "../src/catalogs";
import { curriculumTreasure } from "../src/expeditionBonus";
import { tierIds, type Question } from "../src/types";

const landscapes = [0, 1, 2, 4, 5, 7, 8];
function wordsToRead(question: Question) {
  return [question.prompt, ...question.options].join(" ").split(/\s+/).length;
}

test("revised treasures keep the approved art and map reward with unique prompts for every age", () => {
  for (const language of ["he", "en"] as const) {
    const seen = new Set<string>();
    for (const hero of catalogFor(language)) for (const tier of tierIds) {
      let currentReading = 0, previousReading = 0;
      for (const [map, index] of landscapes.entries()) for (const slot of [0, 1] as const) {
        const mapStop = hero.stops[index]!;
        const current = curriculumTreasure(hero, map, mapStop, tier, slot, language);
        const previous = curriculumTreasure(hero, map, mapStop, tier, slot, language, true);
        assert.equal(current.stop.id, previous.stop.id);
        assert.equal(current.question.item, previous.question.item);
        assert.equal(current.question.id, previous.question.id);
        assert.notEqual(current.question.prompt, previous.question.prompt);
        assert.ok(!seen.has(current.question.prompt), current.question.id);
        seen.add(current.question.prompt);
        const { options, answer, explanation } = current.question;
        assert.equal(options.length, 3);
        assert.equal(new Set(options).size, 3);
        assert.ok(options[answer] && explanation.trim());
        if (map < 2) {
          currentReading += wordsToRead(current.question);
          previousReading += wordsToRead(previous.question);
        }
      }
      assert.ok(currentReading < previousReading, language + "/" + hero.id + "/" + tier);
    }
    assert.equal(seen.size, 168);
  }
});
