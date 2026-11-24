import assert from "node:assert/strict";
import test from "node:test";
import { catalogFor } from "../src/catalogs";
import { current, newGame, restore, transition } from "../src/game";
import { questionsFor, bonusesFor, roundArtwork, roundStep, visualQuestionsFor } from "../src/round";
import relatedEvents from "../content/related-events.json";
import oldMoses from "../content/characters/moses.json";
import oldSamson from "../content/characters/samson.json";
import oldNoah from "../content/characters/noah.json";
import { tierIds, type Character } from "../src/types";

const imports = [oldMoses, oldSamson, oldNoah] as Character[];
const tiers = ["a", "b", "c"] as const;

test("each playable round has four distinct, localized questions for its age and preserves saved choices", () => {
  for (const lang of ["he", "en"] as const) for (const hero of catalogFor(lang)) {
    const imported = imports.find(other => other.id === hero.id)!;
    for (const [index, stop] of hero.stops.entries()) {
      const previous = imported.stops[index]!;
      assert.equal(previous.id, stop.id);
      const prompts = tierIds.map(tier => {
        const picture = stop.picturePrompt?.[tier];
        assert.ok(picture && picture.length > 0);
        const bonus = bonusesFor(stop, tier), lessons = questionsFor(stop, tier);
        assert.equal(bonus.length, 2);
        assert.equal(lessons.length, 2);
        const current = [...bonus, ...lessons];
        const historical = [...previous.bonus!, ...previous.questions![tier === "teen" ? "b" : tier]];
        for (const [i, q] of current.entries()) {
          assert.ok(q.prompt.trim() && q.explanation.trim());
          assert.ok(q.options.every(answer => !!answer.trim()));
          assert.equal(q.options.length, historical[i]!.options.length);
          assert.equal(new Set(q.options).size, q.options.length);
          assert.equal(q.answer, historical[i]!.answer);
          if (lang === "he") for (const text of [q.prompt, ...q.options, q.explanation]) {
            assert.match(text, /[א-ת]/);
            assert.doesNotMatch(text, /[a-z]/i);
          }
        }
        assert.deepEqual(bonus.map(q => [q.id, q.item]), previous.bonus!.map(q => [q.id, q.item]));
        assert.equal(new Set(current.map(q => q.prompt)).size, 4);
        const visuals = visualQuestionsFor(stop, tier);
        const translated = catalogFor(lang === "he" ? "en" : "he").find(h => h.id === hero.id)!.stops[index]!;
        assert.equal(visuals.length, 4);
        assert.deepEqual(visuals.map(q => q.answer), visualQuestionsFor(translated, tier).map(q => q.answer));
        const set = tier === "a" ? "kids" : tier === "c" ? "classic" : "teen";
        const file = (step: number, clue = 0) => {
          const art = roundArtwork(set, step, clue);
          const path = stop.puzzles[0]!.images[art.set]?.[art.index];
          assert.ok(path);
          return path;
        };
        for (const clue of [1, 2, 3]) assert.equal(roundArtwork(set, 0, clue).index, clue);
        assert.equal(new Set([file(0), file(1), file(2), file(3), file(4), file(0, 1), file(0, 2), file(0, 3)]).size, 8);
        for (const q of visuals) {
          assert.ok(q.prompt.trim() && q.explanation.trim());
          assert.equal(q.options.length, 3);
          assert.equal(new Set(q.options).size, 3);
          assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length);
          for (const text of [q.prompt, ...q.options, q.explanation])
            assert.match(text, lang === "he" ? /[א-ת]/ : /[a-z]/i);
        }
        const live = [picture, ...visuals.map(q => q.prompt), ...bonus.map(q => q.prompt)];
        assert.equal(new Set(live).size, 7);
        return live;
      });
      assert.notEqual(stop.picturePrompt?.b, stop.picturePrompt?.teen, stop.id);
      // Each slot must actually use its age's content; catch shared-default regressions.
      for (let i = 0; i < 7; i++) assert.equal(new Set(prompts.map(round => round[i])).size, tierIds.length, stop.id);
    }
  }
});

test("each age can resume a pre-curriculum bonus in another language without losing tokens or moving a question", () => {
  const localized = catalogFor("he");
  for (const tier of tiers) {
    const hero = imports[0]!, original = hero.stops[0]!;
    let game = transition(newGame(), { type: "tier", tier }, imports);
    game = transition(game, { type: "select", id: hero.id }, imports);
    game = transition(game, { type: "start", categories: ["stories"] }, imports);
    game = transition(game, { type: "round-open", stopId: original.id }, imports);
    game = transition(game, { type: "guess", value: original.puzzles[0]!.answer }, imports);
    const [first, second] = original.bonus!;
    game = transition(game, { type: "bonus-start", id: first!.id, now: 1000 }, imports);
    game = transition(game, { type: "bonus-answer", id: first!.id, choice: first!.answer, now: 2000 }, imports);
    game = transition(game, { type: "bonus-start", id: second!.id, now: 3000 }, imports);
    assert.deepEqual(restore(JSON.stringify(game), localized), game);
    const { stop, journey, profile } = current(game, localized);
    assert.equal(roundStep(stop!, journey!, tier), 1);
    for (const [questionIndex, q] of visualQuestionsFor(stop, tier).entries())
      game = transition(game, { type: "picture-answer", stopId: stop!.id, questionIndex, choice: q.answer }, localized);
    assert.equal(roundStep(stop!, current(game, localized).journey!, tier), 6);
    const resumed = bonusesFor(stop, tier)[1]!;
    game = transition(game, { type: "bonus-answer", id: resumed.id, choice: resumed.answer, now: 4000 }, localized);
    assert.equal(current(game, localized).profile.tokens, profile.tokens + 5);
    assert.equal(roundStep(stop!, current(game, localized).journey!, tier), 7);
  }
});

test("a completed bonus and current lesson survive assigning an 8–17 journey to teens", () => {
  const catalog = catalogFor("he");
  const stop = catalog[0]!.stops[0]!;
  let old = transition(newGame(), { type: "tier", tier: "b" }, imports);
  const submit = (action: Parameters<typeof transition>[1]) => { old = transition(old, action, imports); };
  submit({ type: "select", id: "moses" });
  submit({ type: "start", categories: ["stories"] });
  submit({ type: "round-open", stopId: stop.id });
  submit({ type: "guess", value: imports[0]!.stops[0]!.puzzles[0]!.answer });
  for (const q of bonusesFor(stop, "b")) {
    submit({ type: "bonus-start", id: q.id, now: 100 });
    submit({ type: "bonus-answer", id: q.id, choice: q.answer, now: 101 });
  }
  const { a, b, c } = old.profiles;
  const migrated = restore(JSON.stringify({ version: 3, tier: "b", profiles: { a, b, c } }), catalog);
  const assigned = transition(migrated, { type: "assign-school-profile", tier: "teen" }, catalog);
  const resumed = restore(JSON.stringify(assigned), catalogFor("en"));
  assert.deepEqual(resumed.profiles.teen, b);
  assert.deepEqual(resumed.profiles.b, newGame().profiles.b);
  assert.equal(roundStep(stop, current(resumed, catalog).journey!, "teen"), 1);
});

test("completed chapters in older saves keep their rewards, including historical optional bonuses", () => {
  const hero = imports.find(h => h.id === "noah")!;
  let game = newGame();
  const play = (action: Parameters<typeof transition>[1]) => { game = transition(game, action, imports); };
  play({ type: "tier", tier: "c" });
  play({ type: "select", id: hero.id });
  play({ type: "start", categories: ["stories"] });
  for (const s of hero.stops) {
    play({ type: "round-open", stopId: s.id });
    play({ type: "guess", value: s.puzzles[0]!.answer });
    for (const q of questionsFor(s, "c")) play({ type: "learn", choice: q.answer });
    play({ type: "continue" });
  }
  const journey = current(game, imports).journey!;
  assert.equal(journey.phase, "finished");
  delete journey.visualAnswers;
  const catalog = catalogFor("he");
  const migrated = restore(JSON.stringify(game), catalog);
  assert.equal(current(migrated, catalog).profile.tokens, current(game, imports).profile.tokens);
  assert.deepEqual(Object.values(current(migrated, catalog).journey!.visualAnswers!), hero.stops.map(() => "legacy-complete"));
  assert.deepEqual(restore(JSON.stringify(migrated), catalogFor("en")), migrated);
});


test("later child opening riddles pair each related event with its own illustration in both languages", () => {
  const alternatives: Record<string, string[]> = relatedEvents;
  for (const language of ["en", "he"] as const) for (const hero of catalogFor(language)) {
    for (const [chapter, stop] of hero.stops.entries()) {
      if (chapter < 3) continue;
      const ids = alternatives[stop.id];
      assert.ok(ids, stop.id);
      assert.equal(ids.length, 3);
      const puzzle = stop.puzzles[0]!;
      const expected = [stop.id, ...ids].map(id => hero.stops.find(s => s.id === id)!.puzzles[0]!);
      assert.deepEqual(new Set(puzzle.choicesKids), new Set(expected.map(p => p.answer)));
      for (const [index, label] of puzzle.choiceLabelsKids.entries()) {
        const event = expected.find(p => p.answer === label)!;
        assert.equal(puzzle.choicesKids[index], event.answer);
        assert.equal(puzzle.choicePicturesKids[index], event.images.kids[3]);
      }
    }
  }
});
