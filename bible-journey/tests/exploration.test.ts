import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import moses from "../content/characters/moses.json";
import samson from "../content/characters/samson.json";
import noah from "../content/characters/noah.json";
import { canExplore, explorePosition, findExplorePath, sameTile, worlds } from "../src/exploration";
import { current, newGame, restore, transition } from "../src/game";
import type { Action, Character, Game } from "../src/types";
const catalog = [moses, samson, noah] as Character[];
const step = (g: Game, a: Action) => transition(g, a, catalog);
function start(id = "moses") {
  let g = step(newGame(), { type: "tier", tier: "b" });
  g = step(g, { type: "select", id });
  return step(g, { type: "start", categories: ["stories"] });
}
test("all 27 original chapter maps have reachable story scrolls and 54 separate bonus spots", () => {
  assert.equal(Object.keys(worlds).length, 27);
  for (const c of catalog) for (const s of c.stops) {
    const w = worlds[s.id]!;
    assert.ok(w && existsSync(path.join(__dirname, "../assets/worlds", w.image)));
    assert.equal(w.bonusSpots.length, 2);
    assert.ok(!sameTile(w.bonusSpots[0]!, w.bonusSpots[1]!));
    for (const goal of [w.checkpoint, ...w.bonusSpots]) {
      const route = findExplorePath(w, w.start, goal);
      assert.ok(route.length > 0, s.id);
      let from = w.start;
      for (const to of route) { assert.ok(canExplore(w, to)); assert.equal(Math.abs(from.x-to.x)+Math.abs(from.y-to.y), 1); from = to; }
      assert.deepEqual(from, goal);
    }
  }
});
test("exploration rejects walls and teleporting, and saves positions independently", () => {
  let g = start(); const s = current(g, catalog).stop!, w = worlds[s.id]!;
  assert.equal(step(g, { type: "move", stopId: s.id, position: { x: 0, y: 0 } }), g);
  assert.equal(step(g, { type: "move", stopId: s.id, position: w.checkpoint }), g);
  const next = findExplorePath(w, w.start, w.checkpoint)[0]!;
  g = step(g, { type: "move", stopId: s.id, position: next });
  const saved = restore(JSON.stringify(g), catalog);
  assert.deepEqual(explorePosition(current(saved, catalog).journey!, s.id), next);
  assert.equal(current(saved, catalog).profile.tokens, 3);
  g = step(g, { type: "select", id: "noah" }); g = step(g, { type: "start", categories: ["stories"] });
  assert.deepEqual(explorePosition(current(g, catalog).journey!, noah.stops[0]!.id), worlds[noah.stops[0]!.id]!.start);
});
test("existing v3 saves without map positions still load; invalid positions do not", () => {
  const g = start(), s = current(g, catalog).stop!;
  assert.deepEqual(restore(JSON.stringify(g), catalog), g);
  const bad = structuredClone(g); bad.profiles.b.journeys.moses!.positions = { [s.id]: { x: 99, y: 99 } };
  assert.throws(() => restore(JSON.stringify(bad), catalog));
});
test("locked chapters and unsolved map bonuses cannot be opened", () => {
  const g = start(), s = current(g, catalog).stop!;
  assert.equal(step(g, { type: "explore", stopId: moses.stops[1]!.id }), g);
  assert.equal(step(g, { type: "bonus-start", id: s.bonus![0]!.id, stopId: s.id, now: 100 }), g);
  assert.equal(step(g, { type: "continue" }), g);
});
test("returning from a puzzle keeps its draft and purchased clue", () => {
  let g = start(); const s = current(g, catalog).stop!;
  g = step(g, { type: "enter" }); g = step(g, { type: "begin" });
  g = step(g, { type: "draft", value: "my guess" }); g = step(g, { type: "buy", clue: "image" });
  g = step(g, { type: "explore", stopId: s.id });
  g = step(g, { type: "enter" }); g = step(g, { type: "begin" });
  assert.equal(current(g, catalog).progress.draft, "my guess"); assert.equal(current(g, catalog).progress.image, 1);
});
test("map return keeps the learning gate; collected bonuses persist and cannot pay twice", () => {
  let g = start(); let st = current(g, catalog); const s = st.stop!, q = s.bonus![0]!;
  g = step(g, { type: "enter" }); g = step(g, { type: "begin" });
  g = step(g, { type: "guess", value: st.puzzle!.answer });
  g = step(g, { type: "explore", stopId: s.id }); assert.equal(step(g, { type: "continue" }), g);
  g = step(g, { type: "enter" }); g = step(g, { type: "begin" });
  for (const question of s.questions!.b) g = step(g, { type: "learn", choice: question.answer });
  g = step(g, { type: "explore", stopId: s.id });
  const before = current(g, catalog).profile.tokens;
  g = step(g, { type: "bonus-start", id: q.id, stopId: s.id, now: 1000 });
  g = restore(JSON.stringify(g), catalog);
  assert.equal(current(g, catalog).journey!.bonus[q.id]!.deadline, 46000);
  g = step(g, { type: "bonus-answer", id: q.id, stopId: s.id, choice: q.answer, now: 2000 });
  assert.equal(current(g, catalog).profile.tokens, before + 1);
  assert.equal(step(g, { type: "bonus-start", id: q.id, stopId: s.id, now: 3000 }), g);
  g = step(g, { type: "continue" }); g = step(g, { type: "walked" });
  g = step(g, { type: "explore", stopId: s.id });
  assert.equal(current(g, catalog).journey!.stop, 1, "revisiting does not reset current progress");
  assert.equal(step(g, { type: "continue" }), g, "a review map cannot advance the active chapter");
  assert.equal(current(g, catalog).journey!.bonus[q.id]!.status, "correct");
});
