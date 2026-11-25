import test from "node:test";
import assert from "node:assert/strict";
import { catalogFor } from "../src/catalogs";
import { companionChapter, companionPassages, guideStage } from "../src/companionJourney";

test("each companion travels through nine chronological episodes on seven named maps in both languages", () => {
  const firstTitles = new Set<string>();
  for (const language of ["he","en"] as const) {
    for (const hero of catalogFor(language)) {
      const journey = Array.from({length:28}, (_,i) => companionChapter(hero, i, language));
      firstTitles.add(journey[0]!.title);
      assert.equal(new Set(journey.map(x=>x.title)).size,7);
      assert.equal(new Set(journey.map(x=>x.line)).size,28);
      for (const [i,beat] of journey.entries()) {
        assert.equal(beat.title,journey[Math.floor(i/4)*4]!.title);
        assert(beat.stop.id.startsWith("life-"+hero.id+"-"));
        assert.equal(/[א-ת]/u.test(beat.line),language==="he");
        assert.equal(/[א-ת]/u.test(beat.title),language==="he");
        const mystery=beat.stop.puzzles[0]!.answer.toLowerCase();
        assert(!beat.title.toLowerCase().includes(mystery));
        assert(!beat.line.toLowerCase().includes(mystery));
      }
      assert.deepEqual([...new Set(journey.map(x=>x.stop.id))],hero.stops.map(s=>s.id));
    }
  }
  assert.equal(firstTitles.size,6);
});

test("the journey journal unlocks the companion passages in order without revealing future episodes",()=>{
  for(const hero of catalogFor("he")){
    const paid=Array<number>(28).fill(0);
    paid[17]=5;
    assert.deepEqual(companionPassages(hero,paid),[]);
    for(let i=0;i<28;i++){
      paid[i]=5;
      const pages=companionPassages(hero,paid);
      assert.deepEqual(pages,hero.stops.slice(0,pages.length));
      if(i===3)assert.deepEqual(pages,[hero.stops[0]]);
      if(i===10)assert.deepEqual(pages,hero.stops.slice(0,3));
    }
    assert.deepEqual(companionPassages(hero,paid),hero.stops);
  }
});

test("the companion changes appearance when the hero reaches that part of their life",()=>{
  assert.equal(guideStage("moses",0).id,"moses-baby");
  assert.equal(guideStage("moses",2).id,"moses-child");
  assert.equal(guideStage("moses",4).id,"moses-young");
  assert.equal(guideStage("moses",8).id,"moses-shepherd");
  assert.equal(guideStage("moses",10).id,"moses-leader");
  assert.equal(guideStage("moses",24).id,"moses-elder");
  assert.equal(guideStage("noah",9).id,"noah-keeper");
  assert.equal(guideStage("noah",10).id,"noah-watcher");
  assert.equal(guideStage("noah",20).id,"noah-renewed");
  assert.equal(guideStage("samson",19).id,"samson-adult");
  assert.equal(guideStage("samson",20).id,"samson-shorn");
  assert.equal(guideStage("samson",24).id,"samson-regrowth");
});
