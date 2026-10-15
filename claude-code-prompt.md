# Pictaphrase — build prompt for Claude Code

Paste everything below the line into Claude Code, started in an empty project folder. Attach `pictaphrase-pilot.html` too, so Claude Code can reuse its prompt recipe, puzzle packs and answer checker.

---

You are building **Pictaphrase**, a picture-guessing game. The game shows an AI-generated image of a phrase, saying, Bible story, quote or sentence, and the player types what it is. Attached is `pictaphrase-pilot.html`, a working single-file pilot. Reuse its STYLE prompt recipe, the puzzle packs (idioms, Bible stories, Who Said It?, Kids English) and the answer-checking logic (normalize → Levenshtein similarity ≥ 0.85 = correct, ≥ 0.6 = "so close"; exact mode with a word diff for kids).

## Goal of this build
A web app (mobile-first, installable as a PWA) with three modes, a content pipeline that pre-generates and quality-checks images, and an admin screen for curating packs. Keep it simple enough for one developer to run.

## Stack
- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Storage + Auth) — or SQLite + local file storage if I choose "local mode" in `.env`
- OpenAI API for images (`gpt-image-1-mini` default, configurable) and text (`gpt-4.1-mini` default, configurable). All model names live in `.env`, never hard-coded.
- **The API key is read only on the server from `OPENAI_API_KEY` in `.env.local`. It must never reach the browser.** Add `.env*` to `.gitignore` and create `.env.example` with placeholders.

## Data model
- `packs`: id, slug, name, emoji, description, mode (`phrase` | `who` | `exact`), language, is_published
- `puzzles`: id, pack_id, answer, alternates[], hint, scene, quote (for `who`), difficulty (`easy|medium|hard|rejected|unrated`), image_url, solve_rate, plays, status (`draft|approved|rejected`)
- `candidates`: id, puzzle_id, image_url, blind_guess, blind_score, has_text (bool), chosen (bool)
- `plays`: id, puzzle_id, user_id (nullable), correct, tries, hints_used, ms_to_solve
- `rooms` + `room_players` for party mode

## The image quality pipeline (most important part)
Build it as a script `npm run generate -- --pack=<slug>` plus a button in admin:
1. For each puzzle without an approved image, build the prompt = STYLE recipe + scene (KIDS_STYLE for `exact` mode).
2. Generate **3 candidates** (quality `low` for drafts; regenerate the winner at `medium`).
3. **Blind test** each candidate with a vision-capable model: send ONLY the image with "What well-known phrase/story/person does this picture show? Answer in under 8 words." Do not send the answer.
4. Score the blind guess against answer + alternates with the same similarity function. ≥ 0.85 → `easy`, 0.6–0.85 → `medium`, partial keyword overlap → `hard`, else reject.
5. Ask the vision model separately: "Is there any readable text, letters or numbers in this image? yes/no." Reject any "yes".
6. Pick the best candidate, store it in Storage, mark the puzzle `draft` for human approval in admin.
7. Log cost per image and print a total at the end. Stop if a `--budget` (USD) is exceeded.
8. After launch, nightly recompute `difficulty` from real `solve_rate` (≥ 75% easy, 40–75% medium, < 40% hard).

## Player modes
1. **Solo**: pick a category (or Random / Mixed), difficulty, rounds. Easy shows first letters + hint; Medium shows blanks; Hard shows nothing and allows 2 tries. Score, streak, hint and reveal buttons, as in the pilot.
2. **Daily Puzzle**: one puzzle per day for everyone, shareable emoji result (e.g. `Pictaphrase #42 🟩🟩⬜ 2/3`), no login needed.
3. **Party / Event mode (Kahoot-style)**: host creates a room on a big screen and gets a 4-letter code; players join on phones at `/join`. Host screen shows the image and a timer; phones have a text box; points for speed and accuracy; live leaderboard between rounds. Use Supabase Realtime (or WebSockets in local mode). Hosts can type their own list of phrases ("custom game"): the server writes scenes with the text model, then runs the pipeline live with a progress bar.

## Seniors & accessibility
- A "Large & calm" setting: 20px+ base font, high contrast, no timers, voice answer via the browser's Web Speech API, big buttons.
- Every image has alt text **only after** the round is solved (so it doesn't leak the answer).

## Kids English
- Mode `exact`: the full sentence must match an accepted answer (case and final punctuation ignored). Show a word-by-word diff with a gentle tip (is/are, a/an, plurals). No ads, no tracking, no accounts for under-13 players (COPPA).

## Admin (`/admin`, protected by an env password for now)
- Create/edit packs and puzzles; bulk import CSV (answer, alternates, hint, scene).
- "Write scenes with AI" button for rows missing a scene.
- Grid view of candidates with blind guess + score; approve/reject/regenerate; edit the scene and regenerate one.
- Stats per puzzle: plays, solve rate, average tries.

## Safety & rights
- Moderate all host-entered phrases and generated scenes with the OpenAI moderation endpoint before generating.
- Scene writer rules: no real living people's faces, no trademarked characters, no written words in images.

## Deliverables & order of work
1. Scaffold, env handling, DB schema + seed from the pilot's packs.
2. Pipeline script with blind test and cost log; run it on the Idioms pack with `--budget=3`.
3. Solo mode UI (port the pilot's look: warm cream background, coral `#F2542D` accent, Fraunces headings, Inter body).
4. Admin curation screen.
5. Daily puzzle + share card.
6. Party mode.
7. README with setup steps, costs, and how to add a pack.

Work in small commits. After each step, run the app, fix errors, and tell me what to look at. Ask me before anything that spends more than $5 of API credit.
