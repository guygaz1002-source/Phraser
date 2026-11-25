import test from "node:test";
import assert from "node:assert/strict";
import { catalogFor } from "../src/catalogs";
import { activeProfile, current, newGame, restore, routeFor, transition } from "../src/game";
import { BONUS_TIME_MS, expeditionView } from "../src/expedition";
import { tierIds, type Action, type Character, type Game, type PlayMode, type TierId } from "../src/types";

const he = catalogFor("he"), en = catalogFor("en");
function start(hero: string, tier: TierId = "a", mode: PlayMode = "solo", seed = 3001) {
  let game = newGame();
  for (const action of [
    { type: "tier", tier }, { type: "play-mode", mode }, { type: "select", id: hero },
    { type: "start", categories: ["stories"] }, { type: "expedition-start", seed },
  ] as Action[]) game = transition(game, action, he);
  return game;
}

function view(game: Game, catalog = he) {
  const v = expeditionView(game, catalog);
  assert.ok(v);
  return v;
}
function play(game: Game, action: Action, catalog = he) {
  const updated = transition(game, action, catalog);
  assert.notEqual(updated,game);
  return updated;
}
function answer(game: Game, catalog: Character[], right = true) {
  const v = view(game,catalog);
  const card = v.bonus ?? v.question;
  const action: Action = card
    ? {type:"expedition-answer",key:v.key,now:1010,choice:right ? card.answer : (card.answer+1)%card.options.length}
    : {type:"expedition-answer",key:v.key,now:1010,value:right ? v.puzzle.answer : "neither answer"};
  const updated = play(game,action,catalog);
  assert.equal(transition(updated,action,catalog),updated,"duplicate taps cannot affect the next turn");
  return updated;
}
function arrive(game: Game, catalog = he) {
  const v = view(game,catalog);
  return play(game,{type:"expedition-arrive",key:v.key,now:1000},catalog);
}

test("every companion plays the same 28 landmarks with five illustrated age-graded cards and one or two hidden treasures per map", () => {
  const common:string[][]=[];
  for (const tier of tierIds) for (const hero of he) {
    let game=start(hero.id,tier);
    const ids:string[]=[], perMap=Array(7).fill(0) as number[];
    const completedBonusIds=new Set<string>();
    let correct=0;
    for(let i=0;i<28;i++){
      let v=view(game);
      assert.equal(v.state.phase,"travel"); assert.equal(v.bonus,undefined); assert.equal(v.map,1+Math.floor(i/4)); assert.equal(v.landmark,i%4+1);
      assert.ok(hero.stops.some(s=>s.id===v.mapStop.id));
      game=arrive(game);ids.push(v.stop.id);
      const pictures=new Set<string>();
      for(let step=0;step<5;step++){
        const catalog=step%2===0?en:he;
        v=view(game,catalog);assert.equal(v.state.phase,"question");assert.equal(v.step,step);assert.equal(v.bonus,undefined);
        const art=v.puzzle.images.kids[step===4?3:step]!;
        pictures.add(step===4?v.puzzle.images.teen![3]!:art);
        if (i===27) assert.ok(v.question, "every finale scene has its own comparison");
        game=answer(game,catalog);correct++;
        assert.deepEqual(restore(JSON.stringify(game),catalog===en?he:en),game);
      }
      assert.equal(pictures.size,5);
      v=view(game);
      if(v.state.phase==="discovery"){
        perMap[Math.floor(i/4)]!++;assert.ok(v.bonus);assert.ok(v.bonusStop?.id.startsWith("life-"+hero.id+"-"));
        assert.ok(!completedBonusIds.has(v.bonus.id));completedBonusIds.add(v.bonus.id);
        game=arrive(game);assert.equal(view(game).state.deadline,1000+BONUS_TIME_MS);
        game=answer(game,en);correct++;
      }
    }
    assert.ok(perMap.every(n=>n===1||n===2));
    assert.equal(new Set(ids.slice(0,27)).size,27);
    assert.equal(view(game).state.phase,"finished");
    assert.deepEqual(view(game).state.paid,Array(28).fill(5));
    assert.equal(view(game).completedStops.length,27);
    assert.equal(view(game).state.scores[0],correct);
    assert.equal(routeFor(game,he),"/journey");
    common.push(ids);
  }
  for(const ids of common) assert.deepEqual(ids,common[0]);
});

test("a near event name gives the same player another try, even on the last heart", () => {
  for (const [catalog, near] of [[he, "סיפור נוח"], [en, "Noah's story"]] as const) {
    let game = arrive(start("moses", "b", "duo"), catalog);
    game = answer(game, catalog, false);
    game = answer(game, catalog, false);
    const opening = view(game, catalog);
    assert.equal(opening.state.lives, 1);
    game = play(game, {type:"expedition-draft", key:opening.key, value:near}, catalog);
    const attempt = {type:"expedition-answer", key:opening.key, now:1010, value:near} as const;
    assert.equal(transition(game, attempt, catalog), game);
    assert.deepEqual(restore(JSON.stringify(game), catalog), game);
    const next = answer(game, catalog);
    assert.equal(view(next, catalog).step, 1);
    assert.equal(view(next, catalog).state.lives, 1);
    assert.notEqual(view(next, catalog).state.turn, opening.state.turn);
    assert.deepEqual(view(next, catalog).state.scores, [1, 0]);
  }
});

test("three misses end a landmark; retry keeps rewards and buys are idempotent",()=>{
  let game=arrive(start("moses"));
  let v=view(game);
  const buy:Action={type:"expedition-buy",key:v.key,clue:"hint"};
  game=play(game,buy);assert.equal(activeProfile(game).tokens,1);
  assert.equal(view(game).progress.hint,true);assert.equal(transition(game,buy,he),game);
  game=answer(game,he);const paid=activeProfile(game).tokens;
  for(let i=0;i<3;i++) game=answer(game,he,false);
  assert.equal(view(game).state.phase,"game-over");assert.equal(view(game).state.lives,0);
  game=restore(JSON.stringify(game),en);v=view(game);
  game=play(game,{type:"expedition-retry",key:v.key});
  assert.equal(view(game).landmark,1);assert.equal(view(game).step,0);assert.equal(view(game).state.lives,3);
  game=arrive(game);game=answer(game,en);
  assert.equal(activeProfile(game).tokens,paid);assert.equal(view(game).state.scores[0],1);
  game=answer(game,he);assert.equal(activeProfile(game).tokens,paid+1);
});

test("same-device turns, scores, wallets and progress persist separately from single player and from other ages",()=>{
  let game=start("noah","b","duo");
  game=arrive(game);game=answer(game,he,false);
  assert.equal(view(game).state.turn,1);
  game=answer(game,he);assert.equal(view(game).state.turn,0);assert.deepEqual(view(game).state.scores,[0,1]);
  const tokens=activeProfile(game).tokens;assert.ok(tokens>3);
  game=play(game,{type:"play-mode",mode:"solo"});assert.equal(activeProfile(game).tokens,3);assert.equal(expeditionView(game,he),undefined);
  for(const action of [{type:"select",id:"noah"},{type:"start",categories:["stories"]},{type:"expedition-start",seed:3001}] as Action[])game=play(game,action);
  assert.equal(view(game).step,0);
  game=play(game,{type:"tier",tier:"c"});assert.equal(expeditionView(game,he),undefined);
  game=play(game,{type:"play-mode",mode:"duo"});assert.equal(activeProfile(game).tokens,3);
  game=play(game,{type:"tier",tier:"b"});game=restore(JSON.stringify(game),en);
  assert.equal(activeProfile(game).tokens,tokens);assert.equal(view(game).step,1);assert.equal(view(game).state.lives,2);
  assert.deepEqual(view(game).state.scores,[0,1]);assert.equal(view(game).state.turn,0);
});

function nextBonus(game:Game){
  while(view(game).state.phase!=="discovery"){
    const state=view(game).state;
    assert.notEqual(state.phase,"finished");
    game=state.phase==="travel"?arrive(game):answer(game,he);
  }
  return arrive(game);
}

test("treasure timeout, pause and penalties are bounded and each type grants its advertised reward",()=>{
  const found=new Set<string>();
  for(let seed=1;seed<=9&&found.size<4;seed++){
    let game=start("noah","a","solo",seed);
    while(view(game).state.phase!=="finished"){
      const v=view(game);
      if(v.state.phase!=="bonus"){game=v.state.phase==="question"?answer(game,he):arrive(game);continue;}
      const item=v.bonusItem!,initial=activeProfile(game).tokens;
      const lives=v.state.lives;
      game=play(game,{type:"expedition-pause",now:2000,key:v.key});
      let frozen=view(game);assert.equal(frozen.state.remainingMs,44000);assert.equal(frozen.state.deadline,null);
      assert.equal(transition(game,{type:"expedition-expire",now:1000000,key:frozen.key},he),game);
      game=restore(JSON.stringify(game),he);
      game=play(game,{type:"expedition-resume",now:3000,key:view(game).key});
      frozen=view(game);assert.equal(frozen.state.deadline,47000);
      const ok:Action={type:"expedition-answer",key:frozen.key,choice:frozen.bonus!.answer,now:4000};
      game=play(game,ok);assert.equal(transition(game,ok,he),game);
      assert.equal(activeProfile(game).tokens,initial+(item==="jar"?1:0));
      assert.equal(view(game).state.lives,lives+(item==="staff"?1:0));found.add(item);
      if((item==="lamp"||item==="seal")&&view(game).state.phase==="travel"&&!view(game).finale){
        game=arrive(game);const before=view(game);
        const n=activeProfile(game).tokens;
        game=play(game,{type:"expedition-buy",key:before.key,clue:item==="lamp"?"hint":"letter"});
        assert.equal(view(game).state.inventory[item],before.state.inventory[item]-1);assert.equal(activeProfile(game).tokens,n);
      }
    }
  }
  assert.equal(found.size,4);
  let game=nextBonus(start("samson","a","duo"));let v=view(game);
  let lives=v.state.lives, tokens=activeProfile(game).tokens, turn=v.state.turn;
  game=play(game,{type:"expedition-expire",key:v.key,now:v.state.deadline!});
  assert.equal(view(game).state.lives,lives);assert.equal(activeProfile(game).tokens,tokens);assert.notEqual(view(game).state.turn,turn);
  game=nextBonus(game);v=view(game);tokens=activeProfile(game).tokens;lives=v.state.lives;
  game=answer(game,he,false);assert.equal(view(game).state.lives,lives);assert.equal(activeProfile(game).tokens,tokens);
});

test("legacy chapter credits and clue purchases survive adoption of the cross-story route",()=>{
  let game=newGame();
  for(const action of [{type:"tier",tier:"b"},{type:"select",id:"noah"},{type:"start",categories:["stories"]}] as Action[])game=play(game,action);
  const legacy=current(game,he).stop!;
  game=play(game,{type:"round-open",stopId:legacy.id});
  game=play(game,{type:"buy",clue:"image"});
  game=play(game,{type:"guess",value:legacy.puzzles[0]!.answer});
  game=play(game,{type:"picture-answer",stopId:legacy.id,questionIndex:0,choice:legacy.visualQuestions!.b[0]!.answer});
  const old=current(game,he).journey!, wallet=activeProfile(game).tokens;
  game=play(restore(JSON.stringify(game),en),{type:"expedition-start",seed:17});
  let v=view(game);assert.equal(v.stop.id,legacy.id);assert.equal(v.step,2);assert.equal(activeProfile(game).tokens,wallet);
  assert.equal(v.progress.image,1);assert.deepEqual(current(game,he).journey!.awards,old.awards);
  game=arrive(game);game=answer(game,he);assert.equal(activeProfile(game).tokens,wallet+1);
  assert.equal(transition(game,{type:"round-next",stopId:legacy.id},he),game);
  const invalid=structuredClone(game);current(invalid,he).journey!.expedition!.lives=-1;
  assert.throws(()=>restore(JSON.stringify(invalid),he));
});

test("migrating a completed companion journey relocates treasures to the remaining landmarks on each map", () => {
  const hero = he.find(c=>c.id==="noah")!;
  let old = newGame();
  for (const a of [{type:"tier",tier:"c"},{type:"select",id:hero.id},{type:"start",categories:["stories"]}] as Action[]) old=play(old,a);
  for(const stop of hero.stops){
    old=play(old,{type:"round-open",stopId:stop.id});
    old=play(old,{type:"guess",value:stop.puzzles[0]!.answer});
    for(const [questionIndex,q] of stop.visualQuestions!.c.entries()) old=play(old,{type:"picture-answer",stopId:stop.id,questionIndex,choice:q.answer});
    for(const q of stop.bonusByTier!.c){
      old=play(old,{type:"bonus-start",id:q.id,stopId:stop.id,now:1000});
      old=play(old,{type:"bonus-answer",id:q.id,stopId:stop.id,now:1010,choice:q.answer});
    }
    old=play(old,{type:"round-next",stopId:stop.id});
  }
  for (const seed of [5,501,901,20000]) {
    let g=play(old,{type:"expedition-start",seed});
    const tally=Array(7).fill(0) as number[];
    assert.equal(view(g).completedStops.length,9);
    while(view(g).state.phase!=="finished"){
      const v=view(g);
      if(v.state.phase==="travel"||v.state.phase==="discovery"){
        if(v.state.phase==="discovery")tally[v.map-1]!++;
        g=arrive(g);
      } else {
        const previous=activeProfile(g).tokens;
        g=answer(g,en);
        if(v.state.phase==="bonus")assert.equal(activeProfile(g).tokens,previous+(v.bonusItem==="jar"?1:0),"a new treasure grants its advertised item once");
      }
      assert.deepEqual(restore(JSON.stringify(g),he),g);
    }
    assert.ok(tally.every(n=>n===1||n===2));
  }
});
