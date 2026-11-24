import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import moses from "../content/characters/moses.json";
import samson from "../content/characters/samson.json";
import noah from "../content/characters/noah.json";
import legacyMoses from "./fixtures/legacy-moses.json";
import { current, matches, newGame, normalize, puzzleKey, restore, routeFor, transition } from "../src/game";
import type { Action, Character, Game, TierId } from "../src/types";
const catalog=[moses,samson,noah] as Character[];
const step=(g:Game,a:Action)=>transition(g,a,catalog);
function playing(id:string,tier:TierId="b"){
 let g=step(newGame(),{type:"tier",tier});
 g.profiles[tier].tokens=0;
 g=step(g,{type:"select",id});g=step(g,{type:"start",categories:["figures"]});
 g=step(g,{type:"enter"});return step(g,{type:"begin"});
}
test("all 27 chapters, 324 age illustrations, 162 learning questions and 54 bonus tasks are present",()=>{
 const images=new Set<string>();let questions=0,bonus=0;
 for(const c of catalog){assert.equal(c.stops.length,9);
  c.stops.forEach((s,i)=>{assert.equal(s.title,`Chapter ${i+1}`);assert.equal(s.puzzles.length,1);
   for(const p of s.puzzles){assert.equal(p.category,"stories");for(const files of Object.values(p.images)){assert.equal(files.length,4);assert.equal(new Set(files).size,4);files.forEach(file=>{images.add(file);assert.ok(existsSync(path.join(__dirname,"../assets/puzzles",file)));});}
    assert.equal(new Set(p.choicesKids).size,4);assert.equal(p.choicesKids.filter(x=>x===p.answer).length,1);
    assert.equal(p.choicePicturesKids.length,4);
    for(const choice of p.choicesKids)assert.ok(c.stops.some(s=>s.puzzles[0]!.answer===choice),"every option belongs to the same hero");
   }
   for(const qs of Object.values(s.questions!)){assert.equal(qs.length,2);questions+=qs.length;}
   assert.equal(s.bonus!.length,2);bonus+=s.bonus!.length;
  });
 }
 assert.equal(images.size,324);assert.equal(questions,162);assert.equal(bonus,54);
});
test("every canonical answer and alias works; a hero name, partial answer or other chapter does not",()=>{
 for(const c of catalog)for(const s of c.stops){const p=s.puzzles[0]!;
  for(const value of [p.answer,...p.aliases])assert.ok(matches(value,p),`${p.id}: ${value}`);
  for(const name of ["Moses","Samson","Noah","Moshe","משה","שמשון","נח",...(p.partialAnswers??[])])assert.equal(matches(name,p),false,`${p.id}: ${name}`);
  for(const other of c.stops)if(other.id!==s.id)assert.equal(matches(other.puzzles[0]!.answer,p),false,`${p.id}: ${other.id}`);
 }
});
for(const tier of ["a","b","c"] as const)for(const c of catalog)test(`${tier}/${c.id}: nine chapters require a picture solution before learning, then two learning answers`,()=>{
 let g=playing(c.id,tier);
 for(let i=0;i<9;i++){
  let state=current(g,catalog);assert.equal(state.stop?.id,c.stops[i]!.id);assert.equal(routeFor(g,catalog),"/journey");
  for(const a of [{type:"continue"},{type:"learn",choice:0},{type:"buy",clue:"answer"},{type:"bonus-start",id:state.stop!.bonus![0]!.id,now:100}] as Action[])assert.equal(step(g,a),g);
  assert.equal(step(g,{type:"guess",value:c.name}),g);
  g=step(g,{type:"guess",value:state.puzzle!.answer});
  assert.equal(routeFor(g,catalog),"/journey");assert.equal(step(g,{type:"continue"}),g);
  g=restore(JSON.stringify(g),catalog);
  for(let q=0;q<2;q++)g=step(g,{type:"learn",choice:(state.stop!.questions![tier][q]!.answer+1)%4});
  // Wrong learning choices still teach and do not trap the player.
  const before=current(g,catalog).profile.tokens;
  assert.equal(step(g,{type:"guess",value:state.puzzle!.answer}),g);
  assert.equal(current(g,catalog).profile.tokens,before);
  g=step(g,{type:"continue"});
  if(i<8){assert.equal(step(g,{type:"enter"}),g);g=step(g,{type:"walked"});g=step(g,{type:"enter"});g=step(g,{type:"begin"});}
 }
 assert.equal(current(g,catalog).journey!.phase,"finished");assert.equal(current(g,catalog).profile.tokens,45);
 assert.deepEqual(restore(JSON.stringify(g),catalog),g);
 assert.equal(step(g,{type:"start",categories:["stories"]}),g,"reopening the completed journey preserves it");
});
test("bonus time and rewards survive refresh without extending the deadline or awarding twice",()=>{
 let g=playing("moses");let state=current(g,catalog);const q=state.stop!.bonus![0]!;
 g=step(g,{type:"guess",value:state.puzzle!.answer});g=step(g,{type:"bonus-start",id:q.id,now:1000});
 g=restore(JSON.stringify(g),catalog);assert.equal(current(g,catalog).journey!.bonus[q.id]!.deadline,46000);
 assert.equal(step(g,{type:"bonus-start",id:q.id,now:2000}),g);
 const before=current(g,catalog).profile.tokens;g=step(g,{type:"bonus-answer",id:q.id,choice:q.answer,now:45999});
 assert.equal(current(g,catalog).profile.tokens,before+1);assert.equal(step(g,{type:"bonus-answer",id:q.id,choice:q.answer,now:45999}),g);
 const q2=state.stop!.bonus![1]!;g=step(g,{type:"bonus-start",id:q2.id,now:1000});g=step(g,{type:"bonus-answer",id:q2.id,choice:q2.answer,now:46000});
 assert.equal(current(g,catalog).journey!.bonus[q2.id]!.status,"expired");
});
test("saved progress is independent for every hero and age",()=>{
 let g=playing("samson","a");g=step(g,{type:"draft",value:"remember this"});
 g=step(g,{type:"select",id:"noah"});g=step(g,{type:"start",categories:["stories"]});
 assert.equal(current(g,catalog).progress.draft,"");g=step(g,{type:"tier",tier:"c"});assert.equal(current(g,catalog).journey,undefined);
 g=step(g,{type:"tier",tier:"a"});g=step(g,{type:"select",id:"samson"});assert.equal(current(g,catalog).progress.draft,"remember this");
 assert.deepEqual(restore(JSON.stringify(g),catalog),g);
});
test("old three-stop saves retain the wallet and solved events without marking the expanded journey finished",()=>{
 const p={image:0,hint:false,letter:false,revealed:false,resolved:true,earned:5,draft:""};
 const old={version:2,tier:"a",profiles:Object.fromEntries(["a","b","c"].map(t=>[t,{tokens:23,active:"moses",journeys:{moses:{phase:"finished",stop:2,puzzle:1,categories:["stories","figures","proverbs"],walkingFrom:null,puzzles:{"burning-bush/burning-bush":p,"burning-bush/moses":p,"the-sea/sea":p},awards:{"burning-bush":10,"the-sea":10}}}}]))};
 const g=restore(JSON.stringify(old),catalog);assert.equal(g.version,4);assert.equal(g.profiles.a.tokens,23);
 const j=g.profiles.a.journeys.moses!;assert.equal(j.stop,0);assert.equal(j.phase,"map");assert.equal(Object.keys(j.awards).length,2);
 // Enter a migrated chapter: read its lesson without a second payout.
 j.stop=2;let next=step(g,{type:"enter"});next=step(next,{type:"begin"});assert.equal(current(next,catalog).journey!.phase,"complete");assert.equal(current(next,catalog).profile.tokens,23);
});
test("invalid lesson and reward state cannot unlock an unsolved story",()=>{
 const g=playing("noah");const bad=structuredClone(g);bad.profiles.b.journeys.noah!.phase="complete";
 assert.throws(()=>restore(JSON.stringify(bad),catalog));
 const bad2=structuredClone(g);bad2.profiles.b.journeys.noah!.learning[noah.stops[0]!.id]=[99];assert.throws(()=>restore(JSON.stringify(bad2),catalog));
});
