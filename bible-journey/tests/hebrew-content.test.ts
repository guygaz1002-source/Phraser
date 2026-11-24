import test from "node:test";
import assert from "node:assert/strict";
import enMoses from "../content/characters/moses.json";
import enSamson from "../content/characters/samson.json";
import enNoah from "../content/characters/noah.json";
import heMoses from "../content/hebrew/characters/moses.json";
import heSamson from "../content/hebrew/characters/samson.json";
import heNoah from "../content/hebrew/characters/noah.json";
import type { Character } from "../src/types";
const english = [enMoses, enSamson, enNoah] as Character[];
const hebrew = [heMoses, heSamson, heNoah] as Character[];
const tiers = ["a", "b", "c"] as const;
const assertHebrew = (text: string | undefined, where: string) => {
  assert.ok(text && /[א-ת]/.test(text), `Missing Hebrew ${where}`);
  assert.equal(/[A-Za-z]/.test(text!), false, `Visible English leaked into ${where}: ${text}`);
};

test("Hebrew preserves every chapter, image, map and saved-answer position", () => {
  let learning = 0, bonus = 0;
  const images = new Set<string>();
  english.forEach((en, heroIndex) => {
    const he = hebrew[heroIndex]!;
    assert.equal(he.id, en.id);
    assert.deepEqual(he.tilemap, en.tilemap);
    assert.deepEqual(he.stops.map(s => s.id), en.stops.map(s => s.id));
    assert.equal(he.stops.length, 9);
    he.stops.forEach((stop, index) => {
      const original = en.stops[index]!;
      assert.equal(stop.title, `פרק ${index + 1}`);
      assert.equal(stop.shortTitle, stop.title);
      for (const key of ["tile", "signTile", "pathToNext", "sensitive", "scene"] as const) assert.deepEqual(stop[key], original[key], `${stop.id}/${key}`);
      assert.equal(stop.puzzles.length, original.puzzles.length);
      stop.puzzles.forEach((puzzle, pi) => {
        const originalPuzzle = original.puzzles[pi]!;
        assert.equal(puzzle.id, originalPuzzle.id);
        assert.equal(puzzle.category, originalPuzzle.category);
        assert.equal(puzzle.sourceUrl, originalPuzzle.sourceUrl);
        assert.deepEqual(puzzle.images, originalPuzzle.images);
        assert.deepEqual(puzzle.choicePicturesKids, originalPuzzle.choicePicturesKids);
        Object.values(puzzle.images).flat().forEach(image => images.add(image));
        const correctIndex = originalPuzzle.choicesKids.indexOf(originalPuzzle.answer);
        assert.equal(puzzle.choicesKids.indexOf(puzzle.answer), correctIndex);
        assert.equal(puzzle.choiceLabelsKids[correctIndex], puzzle.answer);
        puzzle.choicesKids.forEach((choice, ci) => {
          const matchingEnglishStop = en.stops.find(s => s.puzzles[0]!.answer === originalPuzzle.choicesKids[ci])!;
          assert.equal(choice, he.stops.find(s => s.id === matchingEnglishStop.id)!.puzzles[0]!.answer);
        });
      });
      for (const tier of tiers) {
        assert.equal(stop.questions![tier].length, 2);
        stop.questions![tier].forEach((q, qi) => {
          const enQuestion = original.questions![tier][qi]!;
          assert.equal(q.answer, enQuestion.answer);
          assert.equal(q.options.length, enQuestion.options.length);
          learning++;
        });
      }
      assert.equal(stop.bonus!.length, 2);
      stop.bonus!.forEach((q, qi) => {
        const enQuestion = original.bonus![qi]!;
        assert.equal(q.id, enQuestion.id);
        assert.equal(q.item, enQuestion.item);
        assert.equal(q.answer, enQuestion.answer);
        assert.equal(q.options.length, enQuestion.options.length);
        bonus++;
      });
    });
  });
  assert.equal(images.size, 324);
  assert.equal(learning, 162);
  assert.equal(bonus, 54);
});

test("Hebrew stories retain the previously reviewed Hebrew passages and learning questions", () => {
  const originals = [enMoses, enSamson, enNoah];
  hebrew.forEach((hero, hi) => hero.stops.forEach((stop, si) => {
    const source = originals[hi]!.stops[si]!.originalHebrew;
    assert.deepEqual(stop.passage, source.passage);
    assert.deepEqual(stop.learned, source.passage);
    assert.deepEqual(stop.questions, source.questions);
    assert.equal(stop.puzzles[0]!.answer, source.answer);
    source.aliases.forEach(alias => assert.ok(stop.puzzles[0]!.aliases.includes(alias)));
  }));
});

test("every visible story, question, picture description and ending is in Hebrew", () => {
  hebrew.forEach(hero => {
    for (const key of ["name", "epithet", "epithetKids"] as const) assertHebrew(hero[key], `${hero.id}/${key}`);
    tiers.forEach(tier => assertHebrew(hero.ending![tier], `${hero.id}/ending/${tier}`));
    hero.stops.forEach(stop => {
      for (const key of ["title", "shortTitle", "solvedTitle", "source"] as const) assertHebrew(stop[key], `${stop.id}/${key}`);
      for (const tier of tiers) {
        assertHebrew(stop.passage[tier], `${stop.id}/passage/${tier}`);
        stop.questions![tier].forEach((q, qi) => [q.prompt, ...q.options, q.explanation].forEach(text => assertHebrew(text, `${stop.id}/question/${tier}/${qi}`)));
      }
      stop.bonus!.forEach(q => [q.title, q.prompt, ...q.options, q.explanation].forEach(text => assertHebrew(text, q.id)));
      stop.puzzles.forEach(puzzle => {
        [puzzle.answer, puzzle.textHint, puzzle.moral, puzzle.source, puzzle.discovery, puzzle.reflection, ...puzzle.choicesKids, ...puzzle.choiceLabelsKids, ...Object.values(puzzle.descriptions).flat(), ...Object.values(puzzle.clueNotes!).flat()].forEach(text => assertHebrew(text, puzzle.id));
        assert.ok(!puzzle.textHint.includes(puzzle.answer), `Hint reveals canonical answer ${puzzle.id}`);
        assert.ok(puzzle.partialAnswers!.includes(hero.name), `Character-only answer not marked partial ${puzzle.id}`);
      });
    });
  });
});

test("Hebrew accepts the same English canonical and alternative phrases across a language switch", () => {
  english.forEach((hero, hi) => hero.stops.forEach((stop, si) => {
    const en = stop.puzzles[0]!, he = hebrew[hi]!.stops[si]!.puzzles[0]!;
    for (const answer of [en.answer, ...en.aliases]) assert.ok(he.aliases.includes(answer), `${stop.id}: ${answer}`);
    for (const partial of en.partialAnswers!) assert.ok(he.partialAnswers!.includes(partial), `${stop.id}: ${partial}`);
  }));
});
