import assert from "node:assert/strict";
import test from "node:test";
import { catalogFor } from "../src/catalogs";
import { expeditionView } from "../src/expedition";
import { questionBank } from "../src/expeditionDeck";
import { activeProfile, newGame, transition } from "../src/game";
import { visualQuestionsFor } from "../src/round";
import { tierIds, type Action } from "../src/types";

const selected = [
  ["life-noah-6", "רות", "Ruth"], ["life-moses-6", "בראשית", "Genesis"],
  ["life-moses-7", "שמואל", "Samuel"], ["life-noah-8", "יונה", "Jonah"],
  ["life-moses-4", "יהושע", "Joshua"], ["life-moses-9", "נחמיה", "Nehemiah"],
] as const;

test("the saved original timetable retains its six picture-and-passage comparisons across ages and languages", () => {
  const prompts = new Set<string>();
  const answers = new Map<string,number>();
  for (const lang of ["he", "en"] as const) for (const tier of tierIds) {
    const catalog = catalogFor(lang);
    let game = newGame();
    const setup: Action[] = [{ type: "tier", tier }, { type: "select", id: "noah" },
      { type: "start", categories: ["stories"] }, { type: "expedition-start", seed: 3030 }];
    for (const action of setup) game = transition(game, action, catalog);
    const expedition = activeProfile(game).journeys.noah!.expedition!;
    expedition.deck = [...questionBank(catalog).legacy];
    const perMap = [0,0,0,0,0,0,0];
    for (let landmark = 0; landmark < 27; landmark++) {
      for (let step = 0; step < 5; step++) {
        // Inspect the actual presentation at each coordinate without re-solving the other 134 cards.
        Object.assign(expedition, { landmark, step, phase: "question" });
        const view = expeditionView(game, catalog)!;
        const previous = visualQuestionsFor(view.stop, tier)[step - 1];
        const scene = selected.find(([id]) => id === view.stop.id);
        if (!scene || step !== 4) { assert.equal(view.question, previous); continue; }

        const q = view.question!;
        assert.equal(scene, selected[view.map - 1]);
        assert.notEqual(q.prompt, previous!.prompt);
        assert.equal(new Set(q.options).size, 3);
        assert.ok(q.options[q.answer]);
        assert.ok(q.explanation.includes(lang === "he" ? scene[1] : scene[2]));
        const key = scene[0] + tier;
        if (lang === "he") answers.set(key, q.answer);
        else assert.equal(q.answer, answers.get(key), "switching language preserves the meaning of each choice");
        assert.ok(!prompts.has(q.prompt)); prompts.add(q.prompt);
        perMap[view.map - 1]!++;
      }
    }
    assert.deepEqual(perMap, [1,1,1,1,1,1,0]);
  }
  assert.equal(prompts.size, 48);
});
