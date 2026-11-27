import assert from "node:assert/strict";
import test from "node:test";
import { catalogFor } from "../src/catalogs";
import { expeditionView } from "../src/expedition";
import { curriculumTreasure } from "../src/expeditionBonus";
import { questionBank } from "../src/expeditionDeck";
import { newGame, restore, transition } from "../src/game";
import { gentlerQuestions } from "../src/gentlerQuestions";
import { guidedChoices, pictureChoiceLimit } from "../src/questionDifficulty";
import { tierIds, type Action } from "../src/types";

test("every scoped card presents its bilingual manuscript and retains its passage reference", () => {
  for (const tier of tierIds) {
    const manuscript = gentlerQuestions[tier];
    for (const lang of ["he","en"] as const) {
      const catalog = catalogFor(lang);
      const bank = questionBank(catalog,tier);
      const prior = questionBank(catalog,tier,true);
      assert.deepEqual(new Set(Object.keys(manuscript)),bank.eligible);
      for (const card of bank.cards) {
        const wording = manuscript[card.id]![lang];
        const q = card.question?.(tier);
        assert.equal(q?.prompt ?? card.stop.picturePrompt?.[tier],wording.prompt,card.id);
        if (!q) {
          const puzzle = card.stop.puzzles[0]!;
          assert.ok(puzzle.choicesKids.includes(puzzle.answer),card.id + " " + lang);
          continue;
        }
        assert.equal(new Set(q.options).size,3,card.id);
        assert.ok(q.options[q.answer] && q.explanation,card.id);
        const other = manuscript[card.id]![lang === "he" ? "en" : "he"];
        assert.ok("answer" in other && other.answer === q.answer,card.id);
        const original = prior.byId.get(card.id)!.question!(tier);
        const reference = original.explanation.match(/\([^()]+\)[.׳]?\s*$/u)?.[0];
        if (reference) assert.ok(q.explanation.endsWith(reference),card.id);
      }
    }
  }
});

test("opening choices taper across maps and shorter lists preserve the winning index", () => {
  const maps = [1,2,3,4,5,6,7];
  assert.deepEqual(maps.map(map=>pictureChoiceLimit(map,true)),[2,3,4,4,4,4,4]);
  assert.deepEqual(maps.map(map=>pictureChoiceLimit(map,false)),[2,3,3,3,0,0,0]);
  for (const limit of [2,3]) for (let correct=0; correct<4; correct++) {
    const positions = new Set<number>();
    for (let i=0; i<80; i++) {
      const seed = Math.imul(i,2654435761);
      const choices = guidedChoices(4,correct,limit,seed);
      assert.equal(choices.length,limit);
      assert.equal(new Set(choices).size,limit);
      assert.ok(choices.includes(correct));
      assert.deepEqual(choices,guidedChoices(4,correct,limit,seed));
      positions.add(choices.indexOf(correct));
    }
    assert.equal(positions.size,limit);
  }
});

const he = catalogFor("he");
function start() {
  let game = newGame();
  for (const a of [{type:"tier",tier:"b"},{type:"select",id:"moses"},{type:"start",categories:["stories"]},{type:"expedition-start",seed:214}] as Action[])
    game = transition(game,a,he);
  return game;
}

test("a player returning mid-question finishes the original card before switching editions", () => {
  let game = start();
  const view = () => expeditionView(game,he)!;
  game = transition(game,{type:"expedition-arrive",key:view().key,now:100},he);
  game = transition(game,{type:"expedition-answer",value:view().puzzle.answer,key:view().key,now:101},he);
  const old = view();
  delete old.state.questionEdition;
  const saved = JSON.stringify(game);
  for (const lang of ["en","he"] as const) {
    const catalog = catalogFor(lang);
    const restored = restore(saved,catalog);
    const resumed = expeditionView(restored,catalog)!;
    assert.equal(resumed.previousQuestion,true);
    const prior = questionBank(catalog,"b",true).byId.get(old.cardId)!.question!("b");
    assert.deepEqual(resumed.question,prior);
    assert.deepEqual(resumed.state.deck!.slice(0,5),old.state.deck!.slice(0,5));
    assert.deepEqual(resumed.state.paid,old.state.paid);
    assert.deepEqual(restore(JSON.stringify(restored),catalog),restored);
    const answered = transition(restored,{type:"expedition-answer",key:resumed.key,choice:prior.answer,now:102},catalog);
    const next = expeditionView(answered,catalog)!;
    assert.equal(next.previousQuestion,false);
    assert.equal(next.question!.prompt,gentlerQuestions.b[next.cardId]![lang].prompt);
  }
});

test("an open timed treasure keeps its question, timer and reward when resuming the previous edition", () => {
  let game = start();
  let now = 1000;
  while (expeditionView(game,he)!.state.phase !== "bonus") {
    const v = expeditionView(game,he)!;
    assert.ok(v.map === 1 && now < 1050);
    const action: Action = v.state.phase === "question"
      ? {type:"expedition-answer", key:v.key, now:++now, ...(v.question ? {choice:v.question.answer} : {value:v.puzzle.answer})}
      : {type:"expedition-arrive", key:v.key, now:++now};
    game = transition(game,action,he);
  }
  const old = expeditionView(game,he)!;
  delete old.state.questionEdition;
  const slot = Number(old.bonus!.id.split("/").at(-1)) as 0 | 1;
  const saved = JSON.stringify(game);
  for (const lang of ["he","en"] as const) {
    const catalog = catalogFor(lang);
    const restored = restore(saved,catalog);
    const v = expeditionView(restored,catalog)!;
    const previous = curriculumTreasure(v.character,v.map-1,v.mapStop,"b",slot,lang,true);
    assert.deepEqual(v.bonus,previous.question);
    assert.equal(v.state.deadline,old.state.deadline);
    assert.equal(v.state.previousBonusAt,v.state.landmark);
    assert.deepEqual(restore(JSON.stringify(restored),catalog),restored);
    const answered = transition(restored,{type:"expedition-answer",key:v.key,choice:v.bonus!.answer,now:now+1},catalog);
    assert.equal(expeditionView(answered,catalog)!.state.encounters[old.state.landmark],"correct");
  }
});
