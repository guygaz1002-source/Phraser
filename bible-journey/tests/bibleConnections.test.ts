import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { bibleConnections, bibleConnectionQuestion } from "../src/bibleConnections";
import { catalogFor } from "../src/catalogs";
import { roundArtwork } from "../src/round";
import { tierIds } from "../src/types";

test("each map can draw Bible connections on three distinct illustrated scenes", () => {
  assert.equal(new Set(bibleConnections.map(card => card.id)).size, bibleConnections.length);
  const stops = catalogFor("en").flatMap(character => character.stops);
  for (let map = 1; map <= 7; map++) {
    const entries = bibleConnections.filter(card => card.map === map);
    assert.equal(new Set(entries.map(card => card.stopId)).size, 3);
    for (const {stopId, artStep} of entries) {
      const puzzle = stops.find(stop => stop.id === stopId)?.puzzles[0];
      assert.ok(puzzle, stopId);
      for (const edition of ["kids", "teen", "classic"] as const) {
        const {set, index} = roundArtwork(edition, artStep, 0);
        const file: string = (puzzle.images[set] ?? puzzle.images.classic)[index]!;
        assert.ok(existsSync(resolve("assets/puzzles", file)), file);
        if (set !== edition) assert.ok(existsSync(resolve("assets/puzzles", edition + "-" + file)));
      }
    }
  }
});

test("every language and age gets its own question with a source and the same answer position after switching language", () => {
  const prompts = new Set<string>();
  const positions = new Set<number>();
  for (const {id} of bibleConnections) {
    for (const tier of tierIds) {
      const he = bibleConnectionQuestion(id, tier, "he");
      const en = bibleConnectionQuestion(id, tier, "en");
      assert.equal(he.answer, en.answer, id);
      assert.match(he.prompt, /[א-ת]/);
      assert.match(en.prompt, /[A-Za-z]/);
      positions.add(he.answer);
      for (const q of [he, en]) {
        assert.ok(!prompts.has(q.prompt), id);
        prompts.add(q.prompt);
        assert.equal(new Set(q.options).size, 3, q.prompt);
        assert.ok(q.options[q.answer]);
        assert.match(q.explanation, /\(.+\)$/);
      }
    }
  }
  assert.deepEqual([...positions].sort(), [0, 1, 2]);
});
