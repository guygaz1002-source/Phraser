import { bonusesFor, visualQuestionsFor } from "../src/round";
import test from "node:test";
import assert from "node:assert/strict";
import { catalogFor } from "../src/catalogs";
import { DEFAULT_LANGUAGE, savedLanguage } from "../src/locale";
import { current, matches, newGame, normalize, restore, transition } from "../src/game";
import { tierIds, type Game } from "../src/types";

test("Hebrew defaults safely and English preference remains selectable", () => {
  assert.equal(DEFAULT_LANGUAGE, "he");
  assert.equal(savedLanguage(null), "he");
  assert.equal(savedLanguage("bad-value"), "he");
  assert.equal(savedLanguage("en"), "en");
});

test("Hebrew normalization accepts niqqud, cantillation, punctuation and maqaf without erasing letters", () => {
  assert.equal(normalize("מֹשֶׁה בַּתֵּיבָה"), "משה בתיבה");
  assert.equal(normalize("  קריעת־ים סוף!  "), "קריעת ים סוף");
  assert.equal(normalize("The burning bush"), "burning bush");
  const puzzle = catalogFor("he")[0]!.stops[0]!.puzzles[0]!;
  assert.ok(matches("מֹשֶׁה בַּתֵּיבָה", puzzle));
  assert.equal(matches("!!!", puzzle), false);
});

test("every localized puzzle accepts either language and rejects hero-only and other Hebrew event names", () => {
  for (const language of ["he", "en"] as const) {
    const catalog = catalogFor(language);
    for (const hero of catalog) for (const stop of hero.stops) {
      const puzzle = stop.puzzles[0]!;
      for (const otherLanguage of ["he", "en"] as const) {
        const translatedHero = catalogFor(otherLanguage).find(h => h.id === hero.id)!;
        const translated = translatedHero.stops.find(s => s.id === stop.id)!.puzzles[0]!;
        assert.ok(matches(translated.answer, puzzle), `${stop.id} / ${otherLanguage}`);
        assert.equal(matches(translatedHero.name, puzzle), false, `${stop.id} must require an event`);
      }
      for (const other of catalogFor("he").find(h => h.id === hero.id)!.stops) {
        if (other.id !== stop.id) assert.equal(matches(other.puzzles[0]!.answer, puzzle), false, `${other.id} must not solve ${stop.id}`);
      }
    }
  }
  const birth = catalogFor("he")[1]!.stops[0]!.puzzles[0]!;
  assert.equal(matches("חידת שמשון", birth), false);
  assert.ok(matches("לידת שמשון", birth));
});

test("switching catalogs midjourney preserves IDs, picture answers, bonus deadlines, wallets and restored progression", () => {
  const en = catalogFor("en"), he = catalogFor("he");
  for (const tier of tierIds) for (const hero of he) {
    let game: Game = transition(newGame(), { type: "tier", tier }, en);
    game = transition(game, { type: "select", id: hero.id }, en);
    game = transition(game, { type: "start", categories: ["stories"] }, en);
    for (const stop of hero.stops) {
      game = transition(game, { type: "enter" }, en);
      game = transition(game, { type: "begin" }, he);
      game = transition(game, { type: "draft", value: stop.puzzles[0]!.answer }, he);
      const before = JSON.stringify(game);
      assert.equal(current(game, en).progress.draft, stop.puzzles[0]!.answer);
      assert.equal(JSON.stringify(game), before);
      game = transition(game, { type: "guess", value: stop.puzzles[0]!.answer }, en);
      assert.equal(current(game, he).journey!.phase, "complete");
      for (const [questionIndex, q] of visualQuestionsFor(stop, tier).entries())
        game = transition(game, { type: "picture-answer", stopId: stop.id, questionIndex, choice: q.answer }, he);
      for (const bonus of bonusesFor(stop, tier)) {
        game = transition(game, { type: "bonus-start", id: bonus.id, now: 1000, stopId: stop.id }, he);
        const deadline = current(game, en).journey!.bonus[bonus.id]!.deadline;
        const restored = restore(JSON.stringify(game), en);
        assert.deepEqual(restored, game);
        assert.equal(current(restored, he).journey!.bonus[bonus.id]!.deadline, deadline);
        game = transition(restored, { type: "bonus-answer", id: bonus.id, now: 1100, choice: bonus.answer, stopId: stop.id }, en);
        assert.equal(current(game, he).journey!.bonus[bonus.id]!.status, "correct");
      }
      game = transition(game, { type: "continue" }, en);
      game = transition(game, { type: "walked" }, he);
    }
    assert.equal(current(game, en).journey!.phase, "finished");
    assert.deepEqual(restore(JSON.stringify(game), he), game);
    assert.equal(Object.keys(current(game, he).journey!.awards).length, 9);
  }
});
