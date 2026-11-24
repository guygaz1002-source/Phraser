const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
async function run() {
  const generated = JSON.parse(fs.readFileSync(process.argv[2] || '/private/tmp/bible-journey-visual-assets.json','utf8'));
  const characterPath = path.join(root,'content/characters/moses.json');
  const character = JSON.parse(fs.readFileSync(characterPath,'utf8'));
  const sources = [];
  const descriptions = {
    'burning-bush': ['Sandals and a staff beside a softly glowing desert shrub.','A shepherd notices flames around a living green bush.','The shepherd removes a sandal before the unconsumed bush.','Barefoot Moses listens beside a living bush in flame.'],
    'sea': ['Strong wind moves over water beside an emerging shore.','A dry corridor opens between walls of blue water.','Families walk safely along dry ground between the waters.','Moses guides the people through the sea toward freedom.'],
    'moses': ['Worn sandals and a shepherd’s staff on rocky ground.','A hooded shepherd tends a small flock in the wilderness.','A silver-bearded shepherd listens, a burning bush behind him.','Barefoot Moses answers his calling beside the unconsumed bush.'],
    'pharaoh': ['An empty royal throne in an Egyptian columned court.','A striped royal headdress and gold collar rest on a throne.','An Egyptian ruler sits proudly in his striped headdress.','Pharaoh refuses Moses and Aaron with a raised palm.'],
    'pride': ['A golden crown rests on a cracked stone pedestal.','A proud noble overlooks a loose stone beneath his foot.','The crown falls; the surprised noble sits unharmed beside it.','Humbled, the noble helps another traveller up a step.'],
    'trust': ['A walking staff rests at a fork in the path.','A traveller pauses with a hand over his heart.','The traveller kneels in prayer beside a sunlit path.','With trust, the traveller follows the path into the light.'],
  };
  for (let i=0;i<character.stops.length;i++) character.stops[i].scene=['desert','palace','sea'][i];
  for (const stop of character.stops) for (const puzzle of stop.puzzles) {
    const slug = puzzle.images.kids[0].replace(/-kids-.*/, '');
    if (slug === 'burning-bush' || slug === 'sea') {
      const chapter = slug === 'burning-bush' ? 2 : 4;
      for (const [set, audience] of [['kids','kids'],['classic','adult']]) {
        const files=[];
        for(let i=1;i<=4;i++) {
          const source=path.join(root,`../public/art/life/moses-${chapter}-${audience}-${i}.png`);
          const file=`${slug}-${set}-art-${i}.webp`;
          await sharp(source).resize({width:1024,withoutEnlargement:true}).webp({quality:88}).toFile(path.join(root,'assets/puzzles',file));
          files.push(file); sources.push({file,source,method:'Existing original image, optimized for app delivery'});
        }
        puzzle.images[set]=files;
      }
    } else {
      if (!['kids','classic'].every(set=>generated.some(g=>g.key===`${slug}_${set}`))) continue;
      puzzle.imageGrid={columns:2,rows:2};
      for (const set of ['kids','classic']) {
        const asset=generated.find(g=>g.key===`${slug}_${set}`);
        const file=`${slug}-${set}-atlas.webp`;
        await sharp(asset.path).resize({width:1536,withoutEnlargement:true}).webp({quality:90}).toFile(path.join(root,'assets/puzzles',file));
        puzzle.images[set]=[file,file,file,file];
        sources.push({file,source:asset.path,prompt:asset.prompt,method:'Built-in image_gen; four separate clue frames rendered from one atlas'});
      }
    }
    if (descriptions[slug]) puzzle.descriptions={kids:descriptions[slug],classic:descriptions[slug]};
  }
  for (const asset of generated.filter(g=>g.key.startsWith('duck_') && g.key.endsWith('_pixel'))) {
    const id=asset.key.replace('duck_','').replace('_pixel','');
    const dest=path.join(root,'assets/sprites',`${id}.png`);
    await sharp(asset.path).resize(512,192,{kernel:'nearest',fit:'fill'}).png({palette:true,colours:32,dither:0}).toFile(dest);
    sources.push({file:`sprites/${id}.png`,source:asset.path,prompt:asset.prompt,method:'Built-in image_gen pixel art, optimized as a four-frame transparent sheet'});
  }
  fs.writeFileSync(characterPath,JSON.stringify(character,null,2)+'\n');
  fs.writeFileSync(path.join(root,'content/VISUAL_ASSETS.json'),JSON.stringify({date:'2026-11-02',method:'Built-in image_gen plus previously generated original game art. Two image sets only.',sources},null,2)+'\n');
  console.log({installed:sources.length,generated:generated.length});
}
run().catch(e=>{console.error(e);process.exit(1)});
