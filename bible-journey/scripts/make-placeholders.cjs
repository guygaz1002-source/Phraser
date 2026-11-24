// Retired utility: this writes over the production puzzle art and duck sprites.
// Keep this check before dependency loading and all filesystem mutations.
if (!process.argv.includes("--overwrite-production-art")) {
  console.error(
    "Refusing to overwrite production art. This legacy utility is not part of the app build. " +
      "Use npm run content to refresh the catalog, or npm run assets:install -- <manifest> " +
      "to import approved art. Destructive legacy use requires --overwrite-production-art.",
  );
  process.exit(1);
}

const fs = require("node:fs"),
  path = require("node:path"),
  sharp = require("sharp");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "assets/puzzles");
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(path.join(root, "assets/sprites"), { recursive: true });
const chars = fs
  .readdirSync(path.join(root, "content/characters"))
  .filter((f) => f.endsWith(".json"))
  .map((f) =>
    JSON.parse(
      fs.readFileSync(path.join(root, "content/characters", f), "utf8"),
    ),
  );
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const wrap = (s) =>
  s.split(" ").reduce(
    (lines, w) => {
      if ((lines.at(-1) + " " + w).trim().length > 41) lines.push(w);
      else lines[lines.length - 1] = (lines.at(-1) + " " + w).trim();
      return lines;
    },
    [""],
  );
const svg = (body, w = 800, h = 560) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const ink = "#4A3728",
  clay = "#E0A868",
  green = "#8DBF6E",
  paper = "#F7EFE0";
const person = (kind) =>
  `<path d="M75 83Q53 97 48 156H130Q124 97 105 83Z" fill="${kind === "pharaoh" ? clay : green}" stroke="${ink}" stroke-width="3"/><circle cx="90" cy="57" r="24" fill="${clay}" stroke="${ink}" stroke-width="3"/>${kind === "pharaoh" ? `<path d="M59 40L61 12L77 26L90 6L104 26L121 12L121 40Z" fill="${clay}" stroke="${ink}" stroke-width="3"/>` : `<path d="M65 62Q90 95 115 62V79Q90 109 65 79Z" fill="${ink}"/>`}${kind === "moses" ? `<path d="M145 152V56Q145 34 131 44" fill="none" stroke="${ink}" stroke-width="6"/>` : kind === "noah" ? `<path d="M119 131L148 113L161 131L144 150Z" fill="${clay}" stroke="${ink}" stroke-width="3"/>` : kind === "david" ? `<path d="M144 87L131 109L151 136" stroke="${ink}" fill="none" stroke-width="5"/>` : ""}`;
const icons = {
  bush: `<path d="M90 155V76M90 128L54 99M90 116L131 83" stroke="${ink}" stroke-width="6"/><path d="M33 105Q19 70 62 72Q54 28 94 42Q127 26 135 65Q177 76 145 113Q112 137 69 121Z" fill="${green}" stroke="${ink}" stroke-width="3"/><path d="M85 125C48 97 93 83 83 54C132 94 120 120 101 131C111 106 91 93 94 77C76 99 96 111 85 125Z" fill="${clay}"/>`,
  tree: `<path d="M81 162V72H98V162" fill="${ink}"/><path d="M34 94Q13 68 51 50Q54 12 90 27Q127 13 135 52Q174 79 139 102Z" fill="${green}" stroke="${ink}" stroke-width="3"/>`,
  river: `<path d="M45 7C146 39 28 70 114 102S88 145 134 174H41C8 135 84 122 41 95S114 48 14 19Z" fill="${clay}"/><path d="M68 30Q120 46 64 65M80 118Q128 134 77 153" fill="none" stroke="${paper}" stroke-width="5"/>`,
  rock: `<path d="M21 141L40 79L82 44L134 56L165 138Z" fill="${clay}" stroke="${ink}" stroke-width="4"/><path d="M40 79L92 100L134 56M92 100L106 141" fill="none" stroke="${ink}" stroke-width="3"/>`,
  sea: `<path d="M8 11H59Q85 83 57 172H8ZM172 11H122Q92 83 121 172H172Z" fill="${clay}"/><path d="M87 25L63 173H117L96 25Z" fill="${paper}"/><path d="M19 44H51M18 87H54M127 50H160M126 111H163" stroke="${ink}" stroke-width="3"/>`,
  ark: `<path d="M17 99H164L137 148H48Z" fill="${clay}" stroke="${ink}" stroke-width="4"/><path d="M47 95V54L86 31L132 54V95Z" fill="${green}" stroke="${ink}" stroke-width="4"/><path d="M79 95V63H101V95M7 158Q26 148 44 158T82 158T120 158T170 158" fill="none" stroke="${ink}" stroke-width="3"/>`,
  mountain: `<path d="M12 157L88 20L168 157Z" fill="${clay}" stroke="${ink}" stroke-width="4"/><path d="M63 65L88 20L114 65L94 55L81 70Z" fill="${paper}"/>`,
  pride: `<path d="M38 86L24 30L60 47L87 12L116 47L156 30L140 86Z" fill="${clay}" stroke="${ink}" stroke-width="4"/><path d="M43 106H135V155H43Z" fill="${green}"/><path d="M95 104L85 126L103 137L95 157" fill="none" stroke="${ink}" stroke-width="4"/>`,
  gentle: `<path d="M18 33Q90 4 159 37V102Q125 125 82 112L53 139L57 110Q17 98 18 33Z" fill="${green}" stroke="${ink}" stroke-width="3"/><path d="M60 64Q90 93 120 64" fill="none" stroke="${ink}" stroke-width="4"/>`,
  patience: `<path d="M89 147V87M89 107Q35 108 46 62Q86 58 89 107M89 89Q126 90 135 49Q92 42 89 89" fill="${green}" stroke="${ink}" stroke-width="3"/><path d="M24 150Q88 130 156 150" fill="none" stroke="${ink}" stroke-width="4"/>`,
  help: `<path d="M18 100L49 75L83 101L100 70L159 110L141 147L97 116L77 137L36 117Z" fill="${clay}" stroke="${ink}" stroke-width="4"/><path d="M67 103L94 120" stroke="${ink}" stroke-width="3"/>`,
  trust: `<path d="M19 143Q63 99 81 83T147 24" fill="none" stroke="${clay}" stroke-width="28"/><path d="M42 98L70 72L96 94L117 72L154 106L127 134L100 111L78 130Z" fill="${green}" stroke="${ink}" stroke-width="4"/>`,
};
for (const p of ["moses", "pharaoh", "noah", "david"]) icons[p] = person(p);
async function main() {
  for (const c of chars)
    for (const s of c.stops)
      for (const p of s.puzzles)
        for (const set of ["kids", "classic"])
          for (let i = 0; i < 4; i++) {
            const lines = wrap(p.descriptions[set][i]),
              bg = set === "kids" ? paper : "#856341",
              fg = set === "kids" ? ink : "#EFE6D4";
            const body = `<rect width="800" height="560" fill="${bg}"/>${lines.map((line, n) => `<text x="400" y="${266 + (n - (lines.length - 1) / 2) * 34}" fill="${fg}" font-family="Georgia,serif" font-size="24" text-anchor="middle">${esc(line)}</text>`).join("")}`;
            await sharp(Buffer.from(svg(body)))
              .png()
              .toFile(path.join(out, p.images[set][i]));
          }
  for (const [id, body] of Object.entries(icons))
    await sharp(
      Buffer.from(
        svg(
          `<rect width="180" height="180" fill="${paper}"/>${body}`,
          180,
          180,
        ),
      ),
    )
      .png()
      .toFile(path.join(out, `choice-${id}.png`));
  // One 64×24 sprite sheet per character: idle 0/1, walk 2/3.
  for (const [index, c] of chars.entries()) {
    let pixels = "";
    for (let f = 0; f < 4; f++) {
      const rect = (x, y, w, h, col) => {
        pixels += `<rect x="${f * 16 + x}" y="${y}" width="${w}" height="${h}" fill="${col}"/>`;
      };
      const bob = f % 2;
      rect(5, 2 + bob, 6, 2, ink);
      rect(4, 4 + bob, 8, 6, clay);
      rect(5, 7 + bob, 6, 4, paper);
      rect(5, 7 + bob, 1, 1, ink);
      rect(10, 7 + bob, 1, 1, ink);
      rect(4, 11 + bob, 8, 8, index % 2 ? clay : green);
      rect(3, 13 + bob, 2, 5, clay);
      rect(12, 13 + bob, 2, 5, clay);
      rect(4, f === 2 ? 20 : 19, 3, 3, ink);
      rect(9, f === 3 ? 20 : 19, 3, 3, ink);
      rect(14, 8, 1, 15, ink);
    }
    await sharp(Buffer.from(svg(pixels, 64, 24)))
      .png()
      .toFile(path.join(root, "assets/sprites", `${c.id}.png`));
  }
  console.log(
    "48 described placeholders, 16 answer pictograms, 5 four-frame sprite sheets.",
  );
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
