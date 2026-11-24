import test from "node:test";
import assert from "node:assert/strict";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import data from "./fixtures/legacy-moses.json";
import {
  categories,
  current,
  matches,
  newGame,
  normalize,
  restore,
  rules,
  spokenPictureAnswer,
  transition,
} from "../src/game";
import { teachingWindow } from "../src/teaching";
import { createSaveQueue } from "../src/storage";
import { tiers } from "../theme/tiers";
import type { Action, Category, Character, Game, TierId } from "../src/types";
const moses = data as Character,
  catalog = [moses];
const step = (g: Game, a: Action) => transition(g, a, catalog);
function playing(
  tier: TierId = "c",
  tokens = 3,
  selected: Category[] = categories,
) {
  let g = newGame();
  g = step(g, { type: "tier", tier });
  g.profiles[tier].tokens = tokens;
  g = step(g, { type: "select", id: "moses" });
  g = step(g, { type: "start", categories: selected });
  g = step(g, { type: "enter" });
  return step(g, { type: "begin" });
}
test("fuzzy matching tolerates case, punctuation, aliases and two edits, never blank", () => {
  const p = moses.stops[0]!.puzzles[0]!;
  assert.equal(normalize(" THE Burning BUSH!! "), "burning bush");
  for (const s of [" THE BURNING BUSH!", "burning hush", "bush on fire"])
    assert.ok(matches(s, p));
  for (const s of ["", "!!!", "mountain"]) assert.equal(matches(s, p), false);
});
for (const tier of ["a", "b", "c"] as TierId[])
  test(`${tier}: all three stops can finish from zero tokens`, () => {
    let g = playing(tier, 0);
    assert.equal(step(g, { type: "buy", clue: "image" }), g);
    for (let s = 0; s < 3; s++) {
      for (const p of moses.stops[s]!.puzzles)
        g = step(g, { type: "guess", value: p.answer });
      assert.equal(current(g, catalog).journey!.phase, "complete");
      g = step(g, { type: "continue" });
      if (s < 2) {
        assert.equal(step(g, { type: "enter" }), g);
        g = step(g, { type: "walked" });
        g = step(g, { type: "enter" });
        g = step(g, { type: "begin" });
      }
    }
    assert.equal(current(g, catalog).profile.tokens, 30);
    assert.equal(current(g, catalog).journey!.phase, "finished");
  });
for (let image = 0; image < 4; image++)
  test(`image ${image + 1} earns ${5 - image} tokens`, () => {
    let g = playing("c", 3);
    for (let i = 0; i < image; i++) g = step(g, { type: "buy", clue: "image" });
    const before = current(g, catalog).profile.tokens;
    g = step(g, { type: "guess", value: "burning bush" });
    assert.equal(current(g, catalog).profile.tokens - before, 5 - image);
  });
test("wrong guesses preserve draft, image and balance", () => {
  let g = playing();
  g = step(g, { type: "draft", value: "river" });
  g = step(g, { type: "buy", clue: "image" });
  assert.equal(step(g, { type: "guess", value: "river" }), g);
});
test("tier clue policies are enforced in the engine", () => {
  let a = playing("a", 20);
  for (const clue of ["hint", "letter", "answer"] as const)
    assert.equal(step(a, { type: "buy", clue }), a);
  let b = playing("b", 20);
  b = step(b, { type: "buy", clue: "letter" });
  assert.equal(current(b, catalog).profile.tokens, 19);
  assert.equal(step(b, { type: "buy", clue: "answer" }), b);
  let c = playing("c", 20);
  c = step(c, { type: "buy", clue: "letter" });
  assert.equal(current(c, catalog).profile.tokens, 18);
  assert.equal(step(c, { type: "buy", clue: "letter" }), c);
});
test("answer reveal is unavailable in every age world", () => {
  for (const tier of ["a", "b", "c"] as TierId[]) {
    const g = playing(tier, 100);
    assert.equal(step(g, { type: "buy", clue: "answer" }), g);
  }
});
test("repeated final answer cannot duplicate a stop reward", () => {
  let g = playing();
  for (const p of moses.stops[0]!.puzzles)
    g = step(g, { type: "guess", value: p.answer });
  const done = g;
  for (let i = 0; i < 10; i++) g = step(g, { type: "guess", value: "Moses" });
  assert.equal(g, done);
});
for (const category of categories)
  test(`filter ${category} never serves an excluded puzzle or strands an empty stop`, () => {
    let g = playing("b", 0, [category]);
    for (let s = 0; s < 3; s++) {
      let state = current(g, catalog);
      while (state.journey!.phase === "puzzle") {
        assert.equal(state.puzzle!.category, category);
        g = step(g, { type: "guess", value: state.puzzle!.answer });
        state = current(g, catalog);
      }
      assert.equal(state.journey!.phase, "complete");
      g = step(g, { type: "continue" });
      if (s < 2) {
        g = step(g, { type: "walked" });
        g = step(g, { type: "enter" });
        g = step(g, { type: "begin" });
      }
    }
    assert.equal(current(g, catalog).journey!.phase, "finished");
  });
test("tier profiles retain separate progress and token balances", () => {
  let g = playing("a");
  g = step(g, { type: "buy", clue: "image" });
  g = step(g, { type: "tier", tier: "b" });
  assert.equal(current(g, catalog).profile.tokens, 3);
  assert.equal(current(g, catalog).journey, undefined);
  g = step(g, { type: "tier", tier: "a" });
  assert.equal(current(g, catalog).profile.tokens, 2);
  assert.equal(current(g, catalog).progress.image, 1);
});
test("full restart preserves purchases, draft and selected categories", () => {
  let g = playing("b", 12, ["stories"]);
  g = step(g, { type: "buy", clue: "hint" });
  g = step(g, { type: "buy", clue: "letter" });
  g = step(g, { type: "draft", value: "bush" });
  assert.deepEqual(restore(JSON.stringify(g), catalog), g);
  const bad = structuredClone(g);
  bad.profiles.b.tokens = -1;
  assert.throws(() => restore(JSON.stringify(bad), catalog));
  assert.throws(() => restore("{broken", catalog));
});
test("serialized saves keep the newest profile after a failed write", async () => {
  const saved: number[] = [];
  let n = 0;
  const save = createSaveQueue({
    setItem: async (_k, value) => {
      const call = ++n;
      await new Promise((r) => setTimeout(r, call === 1 ? 15 : 1));
      if (call === 2) throw Error("disk unavailable");
      saved.push(JSON.parse(value).profiles.c.tokens);
    },
  });
  const make = (tokens: number) => {
    const g = newGame();
    g.profiles.c.tokens = tokens;
    return g;
  };
  await Promise.allSettled([save(make(1)), save(make(2)), save(make(3))]);
  assert.deepEqual(saved, [1, 3]);
});
test("teaching waits for both the minimum and prefetch, then has a maximum deadline", async () => {
  let start = Date.now();
  await teachingWindow(Promise.resolve(true), 25, 80).promise;
  assert.ok(Date.now() - start >= 22);
  start = Date.now();
  await teachingWindow(new Promise((r) => setTimeout(r, 45)), 20, 90).promise;
  assert.ok(Date.now() - start >= 42);
  start = Date.now();
  await teachingWindow(new Promise(() => {}), 20, 55).promise;
  assert.ok(Date.now() - start >= 50 && Date.now() - start < 120);
});
test("tile paths are adjacent and take 2.5–3 seconds with discrete 180ms steps", () => {
  for (let i = 0; i < 2; i++) {
    const s = moses.stops[i]!,
      next = moses.stops[i + 1]!;
    let last = s.tile;
    for (const tile of s.pathToNext) {
      assert.equal(Math.abs(tile.x - last.x) + Math.abs(tile.y - last.y), 1);
      last = tile;
    }
    assert.deepEqual(last, next.tile);
    const ms = s.pathToNext.length * rules.stepMs;
    assert.ok(ms >= 2500 && ms <= 3000);
  }
});
test("Age worlds retain distinct inputs and legacy artwork remains readable", () => {
  assert.equal(tiers.b.imageSet, "teen");
  assert.equal(tiers.c.imageSet, "classic");
  assert.equal(tiers.a.imageSet, "kids");
  for (const s of moses.stops)
    for (const p of s.puzzles) {
      assert.deepEqual(Object.keys(p.images).sort(), ["classic", "kids"]);
      assert.equal(p.choicesKids.length, 4);
      assert.equal(p.choicePicturesKids.length, 4);
      assert.ok(p.choicesKids.includes(p.answer));
    }
});
test("a sixth character is added with only JSON and one sprite sheet", () => {
  const { generate } = require("../scripts/build-content.cjs");
  const root = path.resolve(__dirname, ".."),
    temp = mkdtempSync(path.join(tmpdir(), "tier-content-"));
  try {
    for (const d of ["content", "assets"])
      cpSync(path.join(root, d), path.join(temp, d), { recursive: true });
    writeFileSync(
      path.join(temp, "content/characters/sixth.json"),
      JSON.stringify({ ...moses, id: "sixth", name: "Sixth" }),
    );
    cpSync(
      path.join(temp, "assets/sprites/moses.png"),
      path.join(temp, "assets/sprites/sixth.png"),
    );
    assert.equal(generate(temp).characters, 6);
    assert.match(
      readFileSync(path.join(temp, "content/catalog.generated.ts"), "utf8"),
      /sixth.json/,
    );
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("the last visual clue never ends the game or blocks a free guess", () => {
  let g = playing("b", 3);
  for (let i = 0; i < 3; i++) g = step(g, { type: "buy", clue: "image" });
  assert.equal(current(g, catalog).profile.tokens, 0);
  assert.equal(current(g, catalog).progress.image, 3);
  const same = step(g, { type: "guess", value: "wrong answer" });
  assert.equal(same, g);
  g = step(g, { type: "guess", value: current(g, catalog).puzzle!.answer });
  assert.equal(current(g, catalog).profile.tokens, 2);
  assert.equal(current(g, catalog).journey!.puzzle, 1);
});

test("Storybook spoken picture labels complete all six puzzles", () => {
  let g = playing("a", 0);
  let solved = 0;
  for (let s = 0; s < moses.stops.length; s++) {
    for (const puzzle of moses.stops[s]!.puzzles) {
      const correct = puzzle.choicesKids.indexOf(puzzle.answer);
      const spoken = puzzle.choiceLabelsKids[correct]!;
      assert.equal(current(g, catalog).puzzle!.id, puzzle.id);
      const next = step(g, {
        type: "guess",
        value: spokenPictureAnswer(spoken, puzzle),
      });
      assert.notEqual(next, g, spoken);
      g = next;
      solved++;
    }
    assert.equal(current(g, catalog).journey!.phase, "complete");
    g = step(g, { type: "continue" });
    if (s < moses.stops.length - 1) {
      g = step(g, { type: "walked" });
      g = step(g, { type: "enter" });
      g = step(g, { type: "begin" });
    }
  }
  assert.equal(solved, 6);
  assert.equal(current(g, catalog).journey!.phase, "finished");
  assert.equal(current(g, catalog).profile.tokens, 30);
});

test("wrong spoken picture labels never become the correct answer", () => {
  for (const puzzle of moses.stops.flatMap((stop) => stop.puzzles)) {
    puzzle.choiceLabelsKids.forEach((label, index) => {
      if (puzzle.choicesKids[index] === puzzle.answer) return;
      assert.equal(
        matches(spokenPictureAnswer(label, puzzle), puzzle),
        false,
        `${puzzle.id}: ${label}`,
      );
    });
  }
});

test("spoken labels normalize case, punctuation, and a leading The without fuzzy mapping", () => {
  const puzzles = moses.stops.flatMap((stop) => stop.puzzles);
  const sea = puzzles.find((p) => p.id === "sea")!;
  const pride = puzzles.find((p) => p.id === "pride")!;
  assert.equal(spokenPictureAnswer("  THE SEA OPENS!!! ", sea), sea.answer);
  assert.equal(spokenPictureAnswer("The PRIDE CAN FALL.", pride), pride.answer);
  assert.equal(
    spokenPictureAnswer("Pride can falls", pride),
    "Pride can falls",
  );
  // Typed and older-tier matching keeps its existing canonical-answer rules.
  assert.equal(matches("The sea opens", sea), false);
  assert.equal(matches("Pride can fall", pride), false);
});

test("spoken answers preserve canonical and alias fallbacks", () => {
  for (const puzzle of moses.stops.flatMap((stop) => stop.puzzles)) {
    for (const value of [puzzle.answer, ...puzzle.aliases]) {
      const mapped = spokenPictureAnswer(value, puzzle);
      assert.ok(matches(mapped, puzzle), `${puzzle.id}: ${value}`);
      if (
        !puzzle.choiceLabelsKids.some(
          (label) => normalize(label) === normalize(value),
        )
      )
        assert.equal(mapped, value);
    }
    for (const value of ["", "!!!", "An unrelated answer"])
      assert.equal(spokenPictureAnswer(value, puzzle), value);
  }
});
