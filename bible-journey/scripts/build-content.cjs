const fs = require("node:fs"),
  path = require("node:path");
function generate(root) {
  const dir = path.join(root, "content/characters");
  const chars = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((file) => ({
      file,
      c: JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")),
    }));
  const ids = new Set(),
    images = new Set();
  const asset = (f) => {
    if (
      !/^[a-z0-9-]+\.(png|webp)$/i.test(f) ||
      !fs.existsSync(path.join(root, "assets/puzzles", f))
    )
      throw Error(`Missing or unsafe asset: ${f}`);
    images.add(f);
  };
  for (const { file, c } of chars) {
    if (
      !/^[a-z0-9-]+$/.test(c.id) ||
      ids.has(c.id) ||
      !c.name ||
      !c.epithet ||
      !Array.isArray(c.stops)
    )
      throw Error(`Invalid character: ${file}`);
    ids.add(c.id);
    if (!fs.existsSync(path.join(root, "assets/sprites", c.id + ".png")))
      throw Error(`Missing sprite sheet: ${c.id}`);
    const m = c.tilemap;
    if (
      !m ||
      m.tiles.length !== m.height ||
      m.tiles.some(
        (r) =>
          r.length !== m.width ||
          r.some(
            (t) =>
              !["grass", "sand", "water", "tree", "rock", "building"].includes(
                t,
              ),
          ),
      )
    )
      throw Error(`Invalid tilemap: ${c.id}`);
    const stopIds = new Set();
    c.stops.forEach((s, i) => {
      if (!s.id || stopIds.has(s.id) || !s.title || !s.puzzles.length)
        throw Error(`Invalid stop: ${s.id}`);
      stopIds.add(s.id);
      for (const [tier, max] of [
        ["a", 25],
        ["b", 45],
        ["c", 70],
      ])
        if (!s.passage[tier] || (!s.questions && s.passage[tier].split(/\s+/).length > max))
          throw Error(`Passage ${s.id}/${tier} exceeds limit`);
      const tileOk = (t) =>
        Number.isInteger(t.x) &&
        Number.isInteger(t.y) &&
        t.x >= 0 &&
        t.y >= 0 &&
        t.x < m.width &&
        t.y < m.height;
      if (!tileOk(s.tile)) throw Error(`Invalid stop tile: ${s.id}`);
      let last = s.tile;
      for (const p of s.pathToNext) {
        if (!tileOk(p) || Math.abs(p.x - last.x) + Math.abs(p.y - last.y) !== 1)
          throw Error(`Non-adjacent path: ${s.id}`);
        last = p;
      }
      if (
        i < c.stops.length - 1 &&
        (last.x !== c.stops[i + 1].tile.x || last.y !== c.stops[i + 1].tile.y)
      )
        throw Error(`Path misses next stop: ${s.id}`);
      const pids = new Set();
      for (const p of s.puzzles) {
        if (
          !p.id ||
          pids.has(p.id) ||
          !p.answer ||
          !Array.isArray(p.aliases) ||
          !["stories", "figures", "proverbs"].includes(p.category) ||
          p.choicesKids.length !== 4 ||
          p.choicePicturesKids.length !== 4 ||
          !p.choicesKids.includes(p.answer)
        )
          throw Error(`Invalid puzzle: ${p.id}`);
        pids.add(p.id);
        if (p.imageGrid && (p.imageGrid.columns !== 2 || p.imageGrid.rows !== 2)) throw Error(`Invalid four-picture atlas: ${p.id}`);
        if (!["classic,kids", "classic,kids,teen"].includes(Object.keys(p.images).sort().join(",")))
          throw Error("Invalid age image sets");
        for (const set of Object.keys(p.images)) {
          if (p.images[set].length !== 4 || p.descriptions[set].length !== 4)
            throw Error(`Four images required: ${p.id}/${set}`);
          p.images[set].forEach(asset);
        }
        p.choicePicturesKids.forEach(asset);
      }
    });
  }
  // The shared Bible bank also has fully illustrated mysteries outside the three companion lives.
  const generalScenes = JSON.parse(fs.readFileSync(path.join(root, "content/general-bible-illustrations.json"), "utf8"));
  for (const scene of generalScenes) {
    for (const files of Object.values(scene.deliveredImages)) files.forEach(asset);
  }
  // Age-matched drawings of the alternate views used for hints and the fifth riddle.
  for (const name of fs.readdirSync(path.join(root, "assets/puzzles"))) {
    if (/^(?:kids|teen|classic)-journey-[a-f0-9]+\.webp$/.test(name)) asset(name);
  }
  const order = ["moses", "david", "solomon", "samson", "noah"];
  chars.sort(
    (a, b) =>
      (order.indexOf(a.c.id) < 0 ? 99 : order.indexOf(a.c.id)) -
      (order.indexOf(b.c.id) < 0 ? 99 : order.indexOf(b.c.id)),
  );
  const result = `// Generated from JSON and sprite sheets at Metro startup.\nimport type { Character } from '../src/types';\nexport const characters:Character[]=[${chars.map((x) => `require('./characters/${x.file}')`).join(",")}];\nexport const sprites:Record<string,number>={${chars.map((x) => `${JSON.stringify(x.c.id)}:require('../assets/sprites/${x.c.id}.png')`).join(",")}};\nexport const puzzleImages:Record<string,number>={${[
    ...images,
  ]
    .sort()
    .map((f) => `${JSON.stringify(f)}:require('../assets/puzzles/${f}')`)
    .join(",")}};\n`;
  const target = path.join(root, "content/catalog.generated.ts");
  if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== result)
    fs.writeFileSync(target, result);
  return {
    characters: chars.length,
    available: chars.filter((x) => x.c.stops.length).length,
    images: images.size,
  };
}
module.exports = { generate };
if (require.main === module)
  console.log(generate(path.resolve(__dirname, "..")));
