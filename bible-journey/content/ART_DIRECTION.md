# Art direction — pictures to solve, pixel ducks to follow

The active expedition uses three illustrated editions. Ages 4–7 use the storybook plates, both school-age groups use illustrated ink-and-color scenes and adults use engraved or painted scenes with finer detail. The questions differ across all four age groups. Each regular landmark shows five picture riddles. Extra picture clues have their own age-matched views. The scenery must preserve the objects, gestures and relationships a player needs to answer.

## Children’s pictures

Use friendly storybook gouache for ages four to seven: a few large rounded shapes, warm cream, gold, terracotta and sage, gentle faces and a clear uncluttered subject. Keep the narrative legible at phone size. Illustrations can use their own warm palette; the four-ink restriction belongs to the surrounding Storybook interface. Avoid deep shadows, frightening imagery, graphic violence, nudity, modern objects, lettering, religious emblems, haloes or denominational symbols.

Reusable prompt: “A friendly children’s gouache illustration of [SUBJECT / CLUE STAGE]. [IMAGE-SPECIFIC DESCRIPTION]. One clear subject, large readable shapes, sunny gentle light, uncluttered ancient setting. Preserve the same character design across the four pictures. No text or written answer.”

## Classic pictures

Use classical academic oil painting, warm ochre and gold, visible brushwork and oil-on-canvas texture, a dramatic natural light source and restrained compositions. Ancient clothing and material culture should be plausible. Keep the scenes suitable for teenagers as well as adults. For difficult events, show anticipation or safe aftermath. Avoid graphic harm, nudity, modern objects, visible deity figures, text, religious emblems, haloes or denominational symbols.

Reusable prompt: “Classical oil painting of [SUBJECT / CLUE STAGE]. [IMAGE-SPECIFIC DESCRIPTION]. Warm ochre and gold, visible brushwork, one dramatic natural light source, dignified human anatomy, one clear visual idea. Preserve character identity and visual continuity. No text or written answer.”

## Four-picture sequence

1. Suggest an object, gesture or setting without revealing the answer.
2. Add a clearer identifying relationship or object.
3. Make the event, figure or proverb recognizable.
4. Clarify the calling, action or moral through the scene itself.

Narrative paintings portray humans; duck avatars belong to the game interface. `descriptions` supplies accessible descriptions for each picture. Wisdom puzzles cite Proverbs as later reflections and do not claim these sayings were spoken in Exodus. Sea scenes show people crossing safely, without graphic harm.

The current expedition distributes each frame as an individual square WebP. The art installer crops the 4-by-3 source plates and prepares the remaining source illustrations using the appropriate palette and brush treatment. Each scene has twelve primary pictures and twelve alternate views across the three editions.

## Duck avatars

All five characters use the same friendly cream-white duck, orange beak and webbed feet, and small dark eyes. The style is a 1990s handheld RPG sprite: obvious square pixels, stepped silhouettes, compact proportions and a limited flat palette. Aim for the readability of roughly 32×48 logical pixels per figure, with enough detail to distinguish clothes, hair and beards. Avoid smooth vector contours, realistic feathers, gradients, soft shading or detailed rendered mascots.

- **Moses:** sandy desert galabeya, terracotta sash, cream headcloth, short gray beard and wooden staff.
- **Noah:** long white hair and a very long white beard, sage robe and staff.
- **David:** young curly chestnut hair, blue tunic, small lyre and a folded sling at his belt.
- **Solomon:** small gold crown, short dark beard, plum robe and a closed scroll.
- **Samson:** strong friendly build, long soft brown hair and a fully clothed ancient tunic; no combat is needed to identify him.

Each sheet has exactly four equal horizontal cells: idle A, idle B, left-foot walk, right-foot walk. Use a shared scale and foot baseline, with the entire figure inside each cell. Preserve genuine transparent alpha outside the figures, without scenery, shadows, labels or text. The sheet is 8:3; the delivery copy is 512×192. Resize with nearest-neighbor sampling to preserve visible pixels.

## Asset maintenance

Regenerate the expedition artwork with `node scripts/install-illustrated-plates.cjs` from the app directory, then run `npm run content` to refresh the local asset catalog. The compiler reads the masters in `art-sources/plates` and the original illustrations listed in `content/FULL_JOURNEYS_IMPORT.json`. The game loads the finished images locally. Pixel ducks are delivered as transparent PNG sheets. Historical art sources and prompts are preserved in `content/VISUAL_ASSETS.json`.

`scripts/make-placeholders.cjs` is a retired development utility. Its `assets:legacy-placeholders` command refuses to run without the explicit `--overwrite-production-art` flag because it overwrites art and sprite paths. Do not run it as part of installation, content validation, development or release.
