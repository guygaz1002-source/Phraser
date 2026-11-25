import test from "node:test";
import assert from "node:assert/strict";
import { ageCurricula, expandedIds } from "../src/ageCurriculum";
import { catalogFor } from "../src/catalogs";
import { curriculumTreasure } from "../src/expeditionBonus";
import { drawExpeditionDeck, questionBank, validateDeck } from "../src/expeditionDeck";
import { expeditionView } from "../src/expedition";
import { newGame, restore, transition } from "../src/game";
import { tierIds, type Action } from "../src/types";

const he = catalogFor("he"), en = catalogFor("en");
test("each school band lists its own playable passages, grade and sources", () => {
  const hebrewPrompts = new Set<string>(), englishPrompts = new Set<string>();
  for (const tier of tierIds) {
    const bank = questionBank(he,tier), spec = ageCurricula[tier];
    const sources = [...spec.groups, ...spec.cards];
    for (const item of sources) {
      assert.match(spec.sources[item.source]!,/^https:\/\//, item.source);
      assert.ok(item.grade && item.rank >= 0 && item.rank <= 8);
    }
    assert.equal(bank.cards.length, spec.groups.flatMap(expandedIds).length + spec.cards.length);
    assert.ok(spec.cards.length >= 10);
    for (const card of spec.cards) {
      for (const language of ["en","he"] as const) {
        const q = card[language];
        assert.ok(q.prompt && q.explanation && card.reference[language] && q.options[q.answer], card.id);
        assert.equal(new Set(q.options).size, 3, card.id);
      }
      assert.equal(card.he.answer,card.en.answer,card.id);
    }
    const english = questionBank(en,tier);
    assert.deepEqual(english.cards.map(c => c.id),bank.cards.map(c => c.id));
    for (const [ageBank, seen] of [[bank,hebrewPrompts],[english,englishPrompts]] as const) {
      for (const card of ageBank.cards) {
        const prompt = card.question?.(tier)?.prompt ?? card.stop.picturePrompt?.[tier];
        assert.ok(prompt && !seen.has(prompt),card.id);
        seen.add(prompt);
      }
    }
  }
  for (const tier of ["a","b","teen"] as const)
    assert.ok(!questionBank(he,tier).eligible!.has("connection/ebed-melech-ropes"));
  assert.ok(questionBank(he,"c").eligible!.has("connection/ebed-melech-ropes"));
  assert.ok(!questionBank(he,"a").eligible!.has("life-samson-4/0"));
  assert.ok(questionBank(he,"b").eligible!.has("life-samson-4/0"));
});

test("at every age the seven maps draw 140 distinct allowed cards and increase difficulty", () => {
  for (const tier of tierIds) {
    const bank = questionBank(he,tier);
    const selectable = new Set(bank.cards.filter(c => !c.question).map(c => c.stop.puzzles[0]!.answer));
    for (let i=0; i<100; i++) {
      const seed = Math.imul(i,2654435761) >>> 0;
      const deck = drawExpeditionDeck(bank,seed,new Set());
      validateDeck(deck,bank);
      assert.ok(!bank.byId.get(deck[0]!)!.question);
      assert.deepEqual(deck,drawExpeditionDeck(questionBank(en,tier),seed,new Set()));
      assert.ok(deck.some(id=>id.startsWith("age/"+tier+"/")));
      let previous = -1;
      for (let map=0; map<7; map++) {
        const cards = deck.slice(map*20,(map+1)*20).map(id=>bank.byId.get(id)!);
        assert.ok(cards.every(c=>bank.eligible!.has(c.id)));
        const difficulty = cards.reduce((sum,c)=>sum+c.rank,0)/20;
        assert.ok(difficulty > previous, tier+" seed "+seed+" map "+map+" ranks "+previous+" -> "+difficulty);
        previous = difficulty;
        for (let l=0;l<4;l++) {
          const group=cards.slice(l*5,l*5+5);
          assert.equal(new Set(group.map(c=>c.stop.id+"/"+c.artStep)).size,5);
          if (tier==="a" && !group[0]!.question) {
            for (const label of group[0]!.stop.puzzles[0]!.choicesKids) assert.ok(selectable.has(label),label);
          }
        }
      }
    }
  }
});

test("all 42 possible treasures use the companion and age curriculum in both languages", () => {
  for (const tier of tierIds) for (const [i,hero] of he.entries()) {
    const ids=new Set<string>(), prompts=new Set<string>();
    const approved=ageCurricula[tier].bonusSources[hero.id]!;
    for (let map=0;map<7;map++) for (const slot of [0,1] as const) {
      const event=curriculumTreasure(hero,map,hero.stops[map]!,tier,slot,"he");
      const english=curriculumTreasure(en[i]!,map,en[i]!.stops[map]!,tier,slot,"en");
      assert.ok(approved.includes(event.stop.id));
      assert.ok(event.stop.id.startsWith("life-"+hero.id+"-"));
      assert.equal(event.stop.id,english.stop.id);
      assert.equal(event.question.answer,english.question.answer);
      assert.equal(event.question.id,english.question.id);
      ids.add(event.question.id); prompts.add(event.question.prompt);
    }
    assert.equal(ids.size,14); assert.equal(prompts.size,14);
  }
});

test("an active shared-bank save retains its question and paid clues while unvisited landmarks use the age bank", () => {
  const tier="a";
  let game=newGame();
  for (const action of [{type:"tier",tier},{type:"select",id:"samson"},{type:"start",categories:["stories"]},{type:"expedition-start",seed:1973}] as Action[])
    game=transition(game,action,he);
  const state=expeditionView(game,he)!.state, bank=questionBank(he);
  state.deck=drawExpeditionDeck(bank,state.seed,new Set());
  delete state.curriculumTier;
  state.phase="question"; state.progress.hint=true; state.progress.draft="שמ";
  const original=[...state.deck];
  const upgraded=restore(JSON.stringify(game),en);
  const current=expeditionView(upgraded,he)!;
  assert.deepEqual(current.state.deck!.slice(0,5),original.slice(0,5));
  assert.equal(current.state.curriculumTier,tier);
  assert.deepEqual(current.progress,state.progress);
  assert.ok(current.state.deck!.slice(5).every(id=>questionBank(he,tier).eligible!.has(id)));
  assert.deepEqual(upgraded,restore(JSON.stringify(upgraded),he));
});
