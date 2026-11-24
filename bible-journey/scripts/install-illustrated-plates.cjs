// Run from bible-journey: node scripts/install-illustrated-plates.cjs
// Sources remain in the original art archive. Only compiled square WebPs enter the game bundle.
const path = require("node:path");
const fs = require("node:fs/promises");
const { existsSync } = require("node:fs");
const sharp = require("sharp");
const { paintPicture } = require("./paint-picture.cjs");
const editions = ["kids", "teen", "classic"];
const sourceName = {kids:"kids", teen:"teen", classic:"adult"};

function plateCells(story, alternate) {
  const cells=[];
  for(const edition of editions) {
    const other=edition==="teen" ? "classic" : "teen";
    const lastHint=edition==="kids" ? "classic" : "kids";
    const requested = alternate ? [[other,1],[other,2],[lastHint,3],[other,3]]
      : [0,1,2,3].map(index=>[edition,index]);
    for(const [set,index] of requested) {
      const original=story.originalImages[sourceName[set]][index];
      const base=story.deliveredImages[set][index];
      cells.push({edition,original,file:alternate ? edition+"-"+base : base});
    }
  }
  return cells;
}

async function writePlate(appRoot, output, story, alternate) {
  const slug=story.id+(alternate?"-alternate":"");
  const master=path.join(appRoot,"art-sources","plates",slug+".webp");
  const cells=plateCells(story, alternate);
  if(existsSync(master)) {
    const {width,height}=await sharp(master).metadata();
    if(Math.abs(width/height-4/3)>.025) throw Error("Unexpected 4×3 plate proportions: "+slug);
    for(const [i,cell] of cells.entries()){
      const col=i%4, row=Math.floor(i/4);
      const left=Math.round(width*col/4)+3, top=Math.round(height*row/3)+3;
      const right=Math.round(width*(col+1)/4)-3, bottom=Math.round(height*(row+1)/3)-3;
      await sharp(master).extract({left,top,width:right-left,height:bottom-top})
        .resize(512,512,{fit:"cover"}).webp({quality:92,effort:4}).toFile(path.join(output,cell.file));
    }
  } else {
    for(const cell of cells) {
      await paintPicture(path.join(appRoot,"../public",cell.original),path.join(output,cell.file),cell.edition);
    }
  }
}

async function installPaintings(root, stories, output=path.join(root,"assets/puzzles")) {
  await fs.mkdir(output,{recursive:true});
  // Finish each file in a temporary directory. Failed encodes never truncate a playable illustration.
  const temporary=await fs.mkdtemp(path.join(output,".print-"));
  try {
    for(const story of stories) {
      await writePlate(root,temporary,story,false);
      await writePlate(root,temporary,story,true);
    }
    const files=await fs.readdir(temporary);
    for(const file of files) await fs.rename(path.join(temporary,file),path.join(output,file));
    return files.length;
  } finally {
    await fs.rm(temporary,{recursive:true,force:true});
  }
}
if(require.main===module){
 const root=path.resolve(__dirname,"..");
 const manifest=require(path.join(root,"content/FULL_JOURNEYS_IMPORT.json"));
 installPaintings(root,manifest.stories).then(n=>console.log("Installed "+n+" illustrated game frames."))
  .catch(error=>{console.error(error);process.exitCode=1;});
}
module.exports={installPaintings,plateCells,writePlate};
