import test from "node:test";
import assert from "node:assert/strict";
import moses from "../content/characters/moses.json";
import samson from "../content/characters/samson.json";
import noah from "../content/characters/noah.json";
import { chapterLifeStages, hasMosesChildInterlude, lifeStageFor, lifeStages } from "../src/lifecycle";
import { worlds } from "../src/exploration";
import { current, newGame, restore, transition } from "../src/game";
import type { Action, Character, Game, TierId } from "../src/types";
const catalog = [moses, samson, noah] as Character[];
const step = (game: Game, action: Action) => transition(game, action, catalog);
function start(id = "moses", tier: TierId = "b") {
  let game = step(newGame(), { type: "tier", tier });
  game = step(game, { type: "select", id });
  return step(game, { type: "start", categories: ["stories"] });
}

test("every chapter follows its hero's chronological life sequence, including nonnumeric IDs", () => {
  const expected = [
    ["moses-baby", "moses-young", "moses-shepherd", "moses-leader", "moses-leader", "moses-leader", "moses-leader", "moses-leader", "moses-elder"],
    ["samson-child", "samson-adult", "samson-adult", "samson-adult", "samson-adult", "samson-adult", "samson-adult", "samson-shorn", "samson-regrowth"],
    ["noah-builder", "noah-keeper", "noah-keeper", "noah-watcher", "noah-watcher", "noah-watcher", "noah-watcher", "noah-renewed", "noah-renewed"],
  ];
  assert.equal(Object.keys(chapterLifeStages).length, 27);
  catalog.forEach((hero, index) => {
    assert.deepEqual(hero.stops.map(stop => lifeStageFor(stop.id)?.id), expected[index]);
    for (const stop of hero.stops) assert.equal(lifeStageFor(stop.id)!.hero, hero.id);
  });
  assert.equal(lifeStageFor("unknown-chapter"), undefined);
});

test("the infant basket floats in the Nile while every other stage uses the chapter's walking geometry", () => {
  for (const hero of catalog) for (const stop of hero.stops) {
    const stage = lifeStageFor(stop.id)!;
    assert.equal(stage.motion, worlds[stop.id]!.movement, stop.id);
    assert.equal(stage.motion === "float", stop.id === "life-moses-1");
  }
});

test("Samson retains long hair until Delilah's outcome is revealed, including a zero-token solution", () => {
  const id = "life-samson-4";
  assert.equal(lifeStageFor(id)?.id, "samson-adult");
  assert.equal(lifeStageFor(id, { "life-samson-3": 5 })?.id, "samson-adult");
  assert.equal(lifeStageFor(id, { [id]: 0 })?.id, "samson-shorn");
  assert.equal(lifeStageFor(id, { [id]: 5 })?.id, "samson-shorn");
  assert.equal(lifeStageFor("life-samson-9")?.id, "samson-shorn");
  assert.equal(lifeStageFor("life-samson-9", { "life-samson-9": 5 })?.id, "samson-regrowth");
  assert.equal(lifeStageFor("life-samson-5")?.id, "samson-regrowth");
});

test("Moses's childhood interlude waits for the solved story and both lessons in all age profiles", () => {
  for (const tier of ["a", "b", "c"] as const) {
    let game = start("moses", tier);
    let state = current(game, catalog);
    const first = state.stop!;
    assert.equal(hasMosesChildInterlude(first, state.journey!, tier), false);
    game = step(game, { type: "enter" }); game = step(game, { type: "begin" });
    game = step(game, { type: "guess", value: state.puzzle!.answer });
    state = current(game, catalog);
    assert.equal(hasMosesChildInterlude(first, state.journey!, tier), false);
    for (const [index, question] of first.questions![tier].entries()) {
      game = step(game, { type: "learn", choice: question.answer });
      state = current(game, catalog);
      assert.equal(hasMosesChildInterlude(first, state.journey!, tier), index === first.questions![tier].length - 1);
    }
    assert.equal(lifeStageFor(first.id, state.journey!.awards)?.id, "moses-baby", "the original map keeps its infant avatar");
    game = step(game, { type: "continue" }); game = step(game, { type: "walked" });
    state = current(game, catalog);
    assert.equal(lifeStageFor(state.stop!.id, state.journey!.awards)?.id, "moses-young", "the well episode starts in adulthood");
    assert.equal(hasMosesChildInterlude(state.stop!, state.journey!, tier), false);
  }
});

test("stage selection is chapter-local and does not mutate existing saves or wallets", () => {
  const game = start("samson");
  const before = JSON.stringify(game);
  const state = current(game, catalog);
  for (const hero of catalog) for (const stop of hero.stops) lifeStageFor(stop.id, state.journey!.awards);
  assert.equal(JSON.stringify(game), before);
  const restored = restore(before, catalog);
  assert.deepEqual(restored, game);
  assert.equal(lifeStageFor("life-samson-1", { "life-samson-4": 5, "life-samson-9": 5 })?.id, "samson-child");
  assert.equal(lifeStageFor("life-moses-1", { "life-moses-5": 5 })?.id, "moses-baby");
});

test("Noah always remains an adult; every visual appearance has a story use", () => {
  const used = new Set(["moses-child"]);
  for (const hero of catalog) for (const stop of hero.stops) {
    used.add(lifeStageFor(stop.id)!.id);
    used.add(lifeStageFor(stop.id, { [stop.id]: 5 })!.id);
  }
  assert.deepEqual([...used].sort(), Object.keys(lifeStages).sort());
  for (const stop of noah.stops) {
    assert.match(lifeStageFor(stop.id)!.description, /^Adult Noah/);
    assert.equal(lifeStageFor(stop.id)!.motion, "walk");
  }
});
