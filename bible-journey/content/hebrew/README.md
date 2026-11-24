# Hebrew story catalog

`characters/{moses,samson,noah}.json` contains the complete Hebrew presentation of the same 27 chapters. Each has the same IDs, map geometry, 324 picture assets, four children’s choices in the same positions, 162 learning questions and 54 bonus questions. Correct-option indices remain identical across languages so switching language does not reinterpret saved learning or bonus answers.

The story passages and learning questions reuse each English source file’s retained `originalHebrew` fields. Titles, source references, clue explanations, discoveries, reflections, endings and bonus text reuse the original Hebrew stories in the read-only parent game. They are not reverse translations of the English adaptation. Clothing and evolving duck artwork are unchanged.

Regenerate from the canonical application directory:

```sh
node --import tsx scripts/import-hebrew-content.cjs
```

The script reads `../src/lib/life/content.ts`, `../src/lib/adventure/content.ts`, and `../src/lib/life/side-quests.ts` without modifying them. English content remains the authority for geometry, IDs, image filenames and answer order. The script rejects changed question indices rather than silently changing persisted answer meaning.

`answer-aliases.json` is the authoring source for additional, reviewed Hebrew event descriptions. It covers all 27 story IDs and supplies natural verb phrases and Hebrew equivalents of accepted English aliases. The importer merges these with the retained original aliases and, only in Noah's event phrases, adds both complete-name spellings `נח` and `נוח`. Attached prepositions (for example `לנח`/`לנוח`) are explicitly authored. The matcher remains exact after its existing punctuation/niqqud normalization: it does not accept arbitrary Hebrew substrings, misspellings, hero-only answers or a generic `תיבת נח` for every chapter. Edit this file before regenerating the three Hebrew catalogs; do not hand-edit generated alias arrays. Regeneration writes only `characters/{moses,samson,noah}.json`.

Neutral pre-solve text hints are separately written in Hebrew and keyed by the actual story ID. The numerical suffix is not chronological: for example `life-samson-6` is the lion encounter while `life-samson-3` is the gates of Gaza. Sources, story titles, full passages and clue explanations retain their existing solve gates. A hero name alone remains a partial answer. English canonical answers and aliases are retained as non-visible accepted alternatives.

Hebrew references and story-specific primary-source URLs are retained from the source material: [Exodus](https://mechon-mamre.org/p/pt/pt0202.htm), [Judges](https://mechon-mamre.org/p/pt/pt0713.htm), and [Genesis](https://mechon-mamre.org/p/pt/pt0106.htm). Wording distinguishes events that are easily conflated: the basket among reeds, Exodus and the sea crossing, Sinai and the later tablets, the lion encounter and the later honey, rain stopping and land drying, and the dove’s successive flights. Age-specific passages and existing gentle treatment of difficult endings remain intact.

`tests/hebrew-content.test.ts` checks complete coverage, identity/geometry/assets, choice and saved-answer ordering, reuse of reviewed Hebrew, absence of visible English and cross-language answer aliases.

`tests/hebrew-answers.test.ts` checks the seven reproduced adult-answer failures, semantic English/Hebrew parity for every chapter, both UI languages, Noah spelling variants, unrelated-event rejection, and exactly-once progression after a natural answer.
