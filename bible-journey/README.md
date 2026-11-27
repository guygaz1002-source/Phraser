# Phraser | פרייזר

A bilingual illustrated Bible game for iOS, Android and web. Players travel with a duck companion, solve picture mysteries and discover hidden treasures in seven maps.

## Hebrew and English

The interface, stories and questions are available in Hebrew and English. Hebrew has RTL text, Hebrew answer matching and he-IL voice configuration. The game bundles Frank Ruhl Libre for Hebrew and EB Garamond for English across all four age groups. Changing language preserves progress, drafts and bonus deadlines. Physical map directions stay unchanged.

## Run and verify

Use Node 24 and npm from this application directory.

```sh
npm ci
npx expo start --web
npm test
npm run typecheck
npm run export
```

For native development, use `npx expo start --ios` with Xcode and an installed simulator, or `npx expo start --android` with an emulator/device. Shared routes live in `app/`. The full web game is available at [Play Phraser](https://bible-journey-noah.vercel.app).

## Sound, demo reset and phone preview

The game plays an original chiptune theme and short effects. The score, the effects and every level sit in [src/soundScore.ts](src/soundScore.ts): `SOUND_ENABLED` (set to `false` to remove all sound, the speaker button and the tap-to-begin prompt), `HAPTICS_ENABLED`, `MASTER_VOLUME`, `MUSIC_VOLUME`, `SFX_VOLUME`, `MUSIC_IN_GAME`, `TEMPO_BPM`, the `MELODY`, `BASS` and `DRUMS` patterns and the `SFX` table. The web build synthesises them live with the Web Audio API in [src/sound.ts](src/sound.ts). The iOS and Android builds play rendered copies from `assets/sound/` through [src/sound.native.ts](src/sound.native.ts), with the phone's haptic engine for answers and completed landmarks. After changing the score run `npm run sound` to render those files again. Browsers only start audio after a tap, so the web title screen waits for one; the apps start the theme on their own. The speaker button mutes everything and remembers the choice. An iPhone with its silent switch on stays silent.

Open the game at `/?reset=1` to clear saved progress before a demo. Language and sound choices are kept.

To try the production build on a phone on the same Wi-Fi, run `npm run preview:web` and open the address it prints. The page head, loading splash and icons live in `public/`.

## The expedition

Choose an age group, a play mode and a duck companion. Single-player and two-player pass-and-play have separate saves. The companion travels for about 3.5 seconds before the first question. Each of seven maps has four landmarks with five illustrated Bible questions apiece. The companion follows their own story across seven named maps. Each new expedition shuffles 140 distinct ordinary cards from the bank for the selected age group. Each bank selects passages and illustrated cards independently, including stories and questions specific to that age. Companion treasures follow the same age scope. A landmark can feature Moses, Noah, Samson or other Bible figures regardless of the companion. Comparisons across passages grow more frequent on the later maps. The landscape, travel narration, growth stages and surprise treasure questions follow the chosen companion. Resuming a game preserves its question order. When upgrading a save from the shared bank, the current question, opened landmark and paid progress are preserved. The remaining unplayed landmarks draw from the selected age group.

The four question sets serve ages 4–7, 8–12, 13–17 and 18+. The first map offers two answers per picture question, the second offers three. Children aged 4–7 keep illustrated choices for the opening riddles. Older players can type instead from the start. Maps 3–4 open those riddles with a text field and optional choices, and maps 5–7 ask for the event name. Follow-up questions progress from one visible action to sequence, cause or a supported comparison. [Curriculum by age](docs/curriculum-he.md).

## Travel, treasures and lives

The map is an automatic interlude. The current companion walks between four visible landmarks. After a completed story, a short fact appears above the map. Players can open the treasure guide at any time. The illustrated story album unlocks after the first four landmarks.

One or two hidden encounters appear during each map. The companion’s 45-second treasure question begins when the picture loads. A clay jar awards a token, a staff awards an extra heart, an oil lamp pays for a written clue and a bronze seal pays for a letter. The expedition continues after a correct answer, a miss or a timeout. Ordinary questions award tokens once; an incorrect ordinary answer costs a heart. After losing all three starting hearts, players can retry the current landmark while keeping previous progress. In two-player mode the players take turns, keep individual scores and share the party’s hearts and wallet.

## Answers, stars and paid help

A correct answer opens a result card with the answer, the explanation and the tokens earned; the game waits there for Continue (or Enter). A wrong answer costs a heart, strikes that option out and returns to the same question. Consecutive first-try answers build a streak shown beside the hearts, and every fifth in a row pays one more token. Each landmark ends with a summary: three stars for no mistakes, two for one or two, one otherwise, with the map and journey totals. Tokens also buy help: striking out one wrong option (3 tokens, while three options remain) and, when the hearts run out, carrying on from the same question with one heart (12 tokens) instead of restarting the landmark. The prices and thresholds are constants at the top of [src/expedition.ts](src/expedition.ts).

## Progress and storage

The game saves age, mode, companion, landmark, purchases and treasure outcomes locally. Each age and mode has its own wallet, initially funded with three tokens. Opening picture mysteries pay 5, 4, 3 or 2 tokens depending on purchased pictures. Subsequent correct picture answers earn one token. Previously paid answers keep their credit on a retry. Version 4 storage reads v3 and v2 saves and preserves credits from earlier chapter journeys. [Interaction and visual design](docs/design.md).

## Content and provenance

The source journeys are the parent project’s `src/lib/life/content.ts`, `src/lib/adventure/content.ts` and `src/lib/life/side-quests.ts`. Building and playing use the included illustrations and catalogs. To regenerate original content, supply the development source archive in the parent directory and run:

```sh
node --import tsx scripts/import-life.cjs
node --import tsx scripts/import-worlds.cjs
npm run content
```

The importer reads the parent source without changing it. It retains all nine chapters per hero, age-specific summaries and questions, canonical answers and aliases, original clue notes, reflections, endings and sources. The illustrated bank has 744 WebP views across 31 scenes. The four additional Genesis scenes and their source frames are recorded in [general-bible-illustrations.json](content/general-bible-illustrations.json). [FULL_JOURNEYS_IMPORT.json](content/FULL_JOURNEYS_IMPORT.json) records their provenance; `content/SAFE_PICTURE_HINTS.json` supplies neutral pre-solve descriptions and hints. Home art provenance is in `content/HOME_ART_PROMPTS_2026-11-15.json`; earlier artwork records remain in `content/VISUAL_ASSETS.json`.

The world importer copies the original map geometry and bonus locations from `src/lib/life/world.ts`, converts the original pixel SVGs to PNG, and writes `content/worlds.json` plus `content/world-images.generated.ts`.

Character JSON lives in `content/characters/`; the generator validates assets and produces the catalog. `kids`, `teen` and `classic` sets each contain four filenames. New sprites use four horizontal idle/idle/walk/walk frames. Empty David and Solomon records remain available to the generic generator but are not playable choices. The legacy placeholder generator can overwrite artwork and must not be used to refresh production content.

## Spoken answers and limits

“Say your answer” starts English recognition only after a tap and any required permission. Storybook submits a final transcript; older tiers put it in the editable answer field for review. Recognition stops on leaving the puzzle or backgrounding the app. The app does not persist recordings. Unsupported recognition leaves picture and typed controls available.

Native voice requires a development or production build containing the speech module, plus device permissions. Real microphone capture, native device runtime and screen-reader sessions have not been verified. No accounts, backend, payments or analytics are included.

## App Store and Google Play

`app.json` carries the icon, splash screen, Hebrew and English names and permission texts (`locales/`), and `eas.json` has `simulator`, `preview` and `production` build profiles. The steps, the store listing text and the open decisions are in [docs/app-store.md](docs/app-store.md). The iOS bundle is checked with `npx expo export --platform ios`; it has not yet been run on a simulator or a phone.
