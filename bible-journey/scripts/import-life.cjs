// Run with the canonical application's tsx loader. Source journeys remain read-only.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = process.cwd();
const source = path.resolve(root, '..');
const {lifeHeroesForLanguage} = require(path.join(source,'src/lib/life/content.ts'));
const {storyById,storyImages,storySummary,storyQuestions,storyClueNotes} = require(path.join(source,'src/lib/adventure/content.ts'));
const {sideQuestsFor} = require(path.join(source,'src/lib/life/side-quests.ts'));
const relatedEvents = require('../content/related-events.json');
const {installPaintings} = require('./install-illustrated-plates.cjs');
const tiers = {a:'kids',b:'teen',c:'adult'};
const sets = {a:'kids',b:'teen',c:'classic'};
const jobs = new Set();
const provenance = [];
function imageFile(original) {
 const digest=crypto.createHash('sha256').update(original).digest('hex').slice(0,16);
 const file='journey-'+digest+'.webp';
 jobs.add(file);
 return file;
}
function routeMap() {
 const stops=[{x:3,y:11},{x:9,y:11},{x:15,y:11},{x:15,y:7},{x:9,y:7},{x:3,y:7},{x:3,y:3},{x:9,y:3},{x:15,y:3}];
 const tiles=Array.from({length:15},(_,y)=>Array.from({length:20},(_,x)=> (x===0||y===0||x===19||y===14)?'tree':((x+y*3)%17===0?'rock':'grass')));
 const paths=stops.map((s,i)=>{let at={...s};const to=stops[i+1];const steps=[];while(to&&(at.x!==to.x||at.y!==to.y)){at={x:at.x+Math.sign(to.x-at.x),y:at.y+(at.x===to.x?Math.sign(to.y-at.y):0)};steps.push(at);}return steps;});
 for(const tile of stops.concat(paths.flat()))tiles[tile.y][tile.x]='sand';
 return {stops,paths,tilemap:{width:20,height:15,tiles}};
}
async function main(){
 const all=[];
 for(const hero of lifeHeroesForLanguage('en')){
  const map=routeMap();
  const stories=hero.chapters.map(ch=>storyById(ch.storyId,'en'));
  const storyByChapter = new Map(stories.map(story => [story.id, story]));
  const stops=stories.map((s,i)=>{
   // Early rounds contrast different scenes. Later alternatives share a setting, action or theme.
   const alternatives = relatedEvents[s.id];
   const options = alternatives ? [s, ...alternatives.map(id => storyByChapter.get(id))]
     : [0, 2, 4, 6].map(offset => stories[(i + offset) % stories.length]);
   if (options.includes(undefined) || new Set(options).size !== 4) throw Error('Invalid picture choices for ' + s.id);
   const rotated=options.slice(i%4).concat(options.slice(0,i%4));
   const images={},notes={},passage={},questions={};
   for(const [tier,audience]of Object.entries(tiers)){
    images[sets[tier]]=storyImages(s,audience).map(imageFile);
    notes[tier]=storyClueNotes(s,audience);
    passage[tier]=storySummary(s,audience);
    questions[tier]=storyQuestions(s,audience);
   }
   const sourceHe=storyById(s.id,'he');
   const puzzle={id:s.id,category:'stories',answer:s.answer,aliases:s.alternates,partialAnswers:[hero.name,...(s.partialAnswers||[])],
    textHint:JSON.parse(fs.readFileSync(path.join(root,'content/SAFE_PICTURE_HINTS.json'),'utf8'))[s.id],moral:s.reflection||s.discovery,source:s.reference,sourceUrl:s.source,
    images,descriptions:Object.fromEntries(Object.keys(images).map(set=>[set,[1,2,3,4].map(n=>JSON.parse(fs.readFileSync(path.join(root,'content/SAFE_PICTURE_HINTS.json'),'utf8'))[s.id])])),
    choicesKids:rotated.map(story=>story.answer),choiceLabelsKids:rotated.map(story=>story.answer),choicePicturesKids:rotated.map(story=>imageFile(storyImages(story,'kids')[3])),
    clueNotes:notes,discovery:s.discovery,reflection:s.reflection,
   };
   provenance.push({id:s.id,originalAnswer:sourceHe.answer,answer:s.answer,originalImages:Object.fromEntries(Object.values(tiers).map(age=>[age,storyImages(s,age)])),deliveredImages:images});
   return {id:s.id,title:`Chapter ${i+1}`,shortTitle:`Chapter ${i+1}`,solvedTitle:s.title,tile:map.stops[i],signTile:{x:map.stops[i].x,y:map.stops[i].y-1},pathToNext:map.paths[i],
    passage,source:s.reference,sensitive:false,learned:passage,puzzles:[puzzle],questions,
    bonus:sideQuestsFor(s.id).map(q=>({id:q.id,item:q.item,title:q.title.en,prompt:q.prompt.en,options:q.options.en,answer:q.answer,explanation:q.explanation.en})),
    originalHebrew:{answer:sourceHe.answer,aliases:sourceHe.alternates,passage:Object.fromEntries(Object.entries(tiers).map(([t,a])=>[t,storySummary(sourceHe,a)])),questions:Object.fromEntries(Object.entries(tiers).map(([t,a])=>[t,storyQuestions(sourceHe,a)]))},
   };
  });
  const character={id:hero.id,name:hero.name,epithet:'Nine chapters. A life to discover.',epithetKids:'Nine picture adventures.',tilemap:map.tilemap,stops,ending:Object.fromEntries(Object.entries(tiers).map(([t,a])=>[t,hero.ending[a]]))};
  fs.writeFileSync(path.join(root,'content/characters',hero.id+'.json'),JSON.stringify(character,null,2)+'\n');
  all.push(character);
 }
 await installPaintings(root,provenance);
 fs.writeFileSync(path.join(root,'content/FULL_JOURNEYS_IMPORT.json'),JSON.stringify({date:'2026-11-15',sourceRoot:source,adaptation:'Age-matched illustrated plates compiled from AI-redrawn story plates and original visual references. Original stories and age-specific questions retained. Full explanations and bonus tasks unlock only after a correct picture answer.',stories:provenance},null,2)+'\n');
 console.log(JSON.stringify({heroes:all.map(c=>({id:c.id,chapters:c.stops.length})),images:jobs.size,questions:all.reduce((n,c)=>n+c.stops.reduce((m,s)=>m+Object.values(s.questions).flat().length,0),0),bonus:all.reduce((n,c)=>n+c.stops.reduce((m,s)=>m+s.bonus.length,0),0)}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
