import test from "node:test";
import assert from "node:assert/strict";
import { catalogFor } from "../src/catalogs";
import { current, newGame, restore, routeFor, transition } from "../src/game";
import { visualQuestionsFor, bonusesFor, roundLength, roundReady, roundStep } from "../src/round";
import { tierIds, type Action, type Game, type TierId } from "../src/types";

const catalog = catalogFor("he");
const act = (game: Game, action: Action) => transition(game, action, catalog);
function finishPictures(game: Game) {
  const { stop, tier } = current(game, catalog);
  for (const [i, q] of visualQuestionsFor(stop, tier).entries())
    game = act(game, { type: "picture-answer", questionIndex: i, stopId: stop!.id, choice: q.answer });
  return game;
}

function start(hero: string, tier: TierId = "c") {
  let game = act(newGame(), { type: "tier", tier });
  game = act(game, { type: "select", id: hero });
  game = act(game, { type: "start", categories: ["stories"] });
  return game;
}

test("every hero and age completes nine rounds of five picture riddles and two bonuses on one route with exactly-once rewards", () => {
  for (const tier of tierIds) for (const hero of catalog) {
    let game = start(hero.id, tier);
    for (const stop of hero.stops) {
      game = act(game, { type: "round-open", stopId: stop.id });
      assert.equal(routeFor(game, catalog), "/journey");
      assert.equal(roundLength(stop, tier), 7);
      assert.equal(roundStep(stop, current(game, catalog).journey!, tier), 0);
      assert.equal(act(game, { type: "round-next", stopId: stop.id }), game);
      game = act(game, { type: "guess", value: stop.puzzles[0]!.answer });
      assert.equal(act(game, { type: "round-next", stopId: stop.id }), game, "bonuses are part of the round");
      const firstBonus = bonusesFor(stop, tier)[0]!;
      assert.equal(act(game, { type: "bonus-start", id: firstBonus.id, now: 999 }), game);
      for (const [i, question] of visualQuestionsFor(stop, tier).entries()) {
        assert.equal(roundStep(stop, current(game, catalog).journey!, tier), i + 1);
        const before = current(game, catalog).profile.tokens;
        const answer = { type: "picture-answer", stopId: stop.id, questionIndex: i, choice: question.answer } as const;
        assert.equal(act(game, { ...answer, stopId: "another-chapter" }), game);
        assert.equal(act(game, { ...answer, choice: (answer.choice + 1) % question.options.length }), game);
        assert.equal(act(game, { ...answer, questionIndex: i + 1 }), game);
        game = act(game, answer);
        assert.equal(current(game, catalog).profile.tokens, before + 1);
        game = restore(JSON.stringify(game), catalogFor("en"));
        assert.equal(act(game, answer), game, "a saved picture cannot be paid twice");
        assert.equal(routeFor(game, catalog), "/journey");
      }
      assert.equal(act(game, { type: "continue" }), game);
      for (const [i, bonus] of bonusesFor(stop, tier).entries()) {
        assert.equal(roundStep(stop, current(game, catalog).journey!, tier), i + 5);
        game = act(game, { type: "bonus-start", id: bonus.id, now: 1000 });
        game = act(game, { type: "bonus-answer", id: bonus.id, choice: bonus.answer, now: 1100 });
        assert.equal(act(game, { type: "bonus-answer", id: bonus.id, choice: bonus.answer, now: 1101 }), game);
      }
      assert.ok(roundReady(stop, current(game, catalog).journey!, tier));
      const stale = { type: "round-next", stopId: stop.id } as const;
      game = act(game, stale);
      assert.equal(act(game, stale), game, "stale timers cannot advance another chapter");
    }
    assert.equal(current(game, catalog).journey!.phase, "finished");
    assert.equal(current(game, catalog).profile.tokens, 102, "3 starting + 9 × (5 event + 4 picture details + 2 bonuses)");
    assert.deepEqual(restore(JSON.stringify(game), catalog), game);
  }
});

test("old saves resume the first unfinished question without resetting wallets, drafts, or map positions", () => {
  let game = start("moses");
  const stop = current(game, catalog).stop!;
  game = act(game, { type: "enter" }); game = act(game, { type: "begin" });
  game = act(game, { type: "draft", value: "משה ביאור" });
  const restored = restore(JSON.stringify(game), catalog);
  assert.equal(roundStep(stop, current(restored, catalog).journey!, "c"), 0);
  assert.equal(current(restored, catalog).progress.draft, "משה ביאור");
  game = act(restored, { type: "guess", value: "משה ביאור" });
  // A correct lesson recorded before lesson rewards existed keeps its original balance.
  current(game, catalog).journey!.learning[stop.id] = [stop.questions!.c[0]!.answer];
  game = restore(JSON.stringify(game), catalog);
  assert.equal(roundStep(stop, current(game, catalog).journey!, "c"), 1);
  assert.equal(current(game, catalog).profile.tokens, 8);
  game = finishPictures(game);
  assert.equal(roundStep(stop, current(game, catalog).journey!, "c"), 5);
  assert.equal(current(game, catalog).profile.tokens, 12);
  assert.equal(act(game, { type: "learn", choice: 0, stopId: stop.id, questionIndex: 1 }), game);
});

test("wrong and expired bonus attempts stay on their slide and retry cannot duplicate a reward", () => {
  let game = start("noah"); const stop = current(game, catalog).stop!;
  game = act(game, { type: "round-open", stopId: stop.id });
  game = act(game, { type: "guess", value: stop.puzzles[0]!.answer });
  game = finishPictures(game);
  const bonus = bonusesFor(stop, "c")[0]!;
  game = act(game, { type: "bonus-start", id: bonus.id, now: 100 });
  game = act(game, { type: "bonus-answer", id: bonus.id, choice: (bonus.answer + 1) % 4, now: 101 });
  assert.equal(roundStep(stop, current(game, catalog).journey!, "c"), 5);
  game = act(game, { type: "bonus-start", id: bonus.id, now: 200 });
  game = act(game, { type: "bonus-expire", id: bonus.id, now: 45200 });
  assert.equal(roundStep(stop, current(game, catalog).journey!, "c"), 5);
  game = act(game, { type: "bonus-start", id: bonus.id, now: 50000 });
  game = act(game, { type: "bonus-answer", id: bonus.id, choice: bonus.answer, now: 50001 });
  assert.equal(roundStep(stop, current(game, catalog).journey!, "c"), 6);
  assert.equal(current(game, catalog).profile.tokens, 13);
  assert.equal(act(game, { type: "bonus-start", id: bonus.id, now: 60000 }), game);
});

test("bonus pause preserves remaining time and rejects duplicate, stale, or already expired resumes", () => {
  let game = start("noah"); const stop = current(game, catalog).stop!;
  game = act(game, { type: "round-open", stopId: stop.id });
  game = act(game, { type: "guess", value: stop.puzzles[0]!.answer });
  game = finishPictures(game);
  const bonus = bonusesFor(stop, "c")[0]!;
  game = act(game, { type: "bonus-start", id: bonus.id, stopId: stop.id, now: 1000 });
  const resume = { type: "bonus-resume", id: bonus.id, stopId: stop.id, expectedDeadline: 46000, pausedAt: 11000, now: 71000 } as const;
  assert.equal(act(game, { ...resume, stopId: "another-chapter" }), game);
  assert.equal(act(game, { ...resume, pausedAt: 46000 }), game, "an already elapsed attempt cannot be revived by pausing");
  game = act(game, resume);
  assert.equal(current(game, catalog).journey!.bonus[bonus.id]!.deadline, 106000, "35 seconds remain after a 60-second pause");
  assert.equal(act(game, resume), game, "a repeated resume cannot extend the same deadline twice");
  assert.equal(act(game, { ...resume, now: 72000 }), game, "a delayed event from the old deadline is ignored");
  assert.equal(act(game, { type: "bonus-expire", id: bonus.id, stopId: stop.id, now: 105999 }), game);
  game = act(game, { type: "bonus-answer", id: bonus.id, stopId: stop.id, choice: bonus.answer, now: 105999 });
  assert.equal(current(game, catalog).profile.tokens, 13);
  assert.equal(act(game, { ...resume, expectedDeadline: 106000, now: 120000 }), game, "a solved attempt cannot resume");
  assert.equal(act(game, { type: "bonus-answer", id: bonus.id, stopId: stop.id, choice: bonus.answer, now: 106000 }), game);
  assert.deepEqual(restore(JSON.stringify(game), catalog), game, "extended attempts preserve the existing save schema");

  const second = stop.bonus![1]!;
  game = act(game, { type: "bonus-start", id: second.id, stopId: stop.id, now: 200000 });
  game = act(game, { type: "bonus-expire", id: second.id, stopId: stop.id, now: 245000 });
  game = act(game, { type: "bonus-start", id: second.id, stopId: stop.id, now: 250000 });
  assert.equal(act(game, { type: "bonus-resume", id: second.id, stopId: stop.id, expectedDeadline: 245000, pausedAt: 210000, now: 260000 }), game, "a pause from the previous attempt cannot extend its retry");
});
