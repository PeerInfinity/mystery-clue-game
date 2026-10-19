# Kickoff: build the layout, then the player's notes, then the autoplay

**Date:** 2026-10-19. Handed off by the session that ran Rounds 157–170 of `docs/design.md` (the closing review, its
defect fixes, the action table, the layout paper). **Supersedes** `docs/kickoff-closing-review.md`, whose piece 1 is
done and whose pieces 2–4 continue here; read that one for the pieces' original questions.

## Where things stand

- **The closing review is done** (`docs/review-closing.md`, Round 165): every thought's move made in the UI on Hard, in
  one game played through the page. The Hard maximum is **70 ahead of Holmes** (deductions 45 of 47, every other family
  full); the engine, the annotation's player and the UI all reach it. Eleven defects were found and fixed on the way
  (Rounds 157–164), most of them in the UI, which no node test could see; Rounds 166–168 settled the review's questions.
- **The action table** (`engine/actionTable.js`, `npm run action-table` → `cases/silver-blaze/action-table.json`,
  Round 168) is the autoplay's script: one row per thought, its moves as engine calls and as UI steps (the tab, the card
  opened, the buttons, the fields). `engine/actionTable.test.js` keeps it at the maximum and up to date.
- **`scripts/ui-run.mjs`** (Round 170) plays the action table through the real UI in headless Chrome and checks each
  move in the saved game: 396 moves, none failed, about 12–13 minutes. It is the check for every UI step from now on.
  `scripts/cdp.mjs` is its DevTools client.
- **The layout paper is agreed** (`docs/layout.md`, Round 170): every recommendation and the order of work.

## Read first, in this order

1. `CLAUDE.md`.
2. `docs/layout.md` (the agreed paper; its "Agreed" section), then `docs/review-closing.md` (how the game was played
   through the UI, the defects, "Left open").
3. `docs/kickoff-closing-review.md` (pieces 3 and 4: the player's notes and the autoplay, with their questions).
4. Rounds 157–170 of `docs/design.md`.
5. The code: `ui/app.js` (`renderStory`, `renderReader`, `renderToolNow`, `openCard`, `onClick`, `onStoryClick`, the
   `ui` object), `index.html`, `ui/style.css`; `engine/actionTable.js`; `scripts/ui-run.mjs`, `scripts/cdp.mjs`.

## Mission

### 1. Build the layout (`docs/layout.md`, its order of work)

1. **Panels:** two panels drawing any tab (Story, Card, Cards, Questions, Inferences, Theories, Checks, Timeline,
   Background, Record); the selector at the top of both; choosing a tab the other panel shows swaps them; links routed by
   Q3 (a card opens in the other panel; a link inside the Card tab opens in place, with "back"). The reading bar stays
   with the story for this step.
2. **The reading bar** at page level, under the header, always shown, with the line saying what the paragraph brought
   (on Hard, "open the story to collect").
3. **One column** (the header toggle) and the phone layout (always one column below 700 px, the bar at the bottom of the
   screen); one sideways-scrolling row of tabs per panel with their counts.
4. **Remembered** per viewer under `mystery-clue-game:layout:v1`, apart from the save.

Each step: one commit with a Round entry, gated; screenshots for Robert (desktop 1400 × 900 and phone 390 wide, sent
with SendUserFile); **the action table played through the UI** with `scripts/ui-run.mjs`, none failed and 70 at the end.
`ui-run.mjs` and `engine/actionTable.js` write UI steps against today's page (`{open, tab}` clicks a tab button, then
the card's link in `#tool`; the story's words are `#story p[data-p] .m`): update them with the layout, and keep the
table's steps describing what a player does.

### 2. The player's notes on the story (a paper with visual alternatives, then the build)

`docs/kickoff-closing-review.md` piece 3: notes the player writes against the story text, visually distinct. Robert has
not decided the look: mock up several (margin notes beside the paragraph; notes between paragraphs; a highlighted span
with a note on hover or click; a different typeface, colour or hand) **inside the new layout**, screenshot them in
headless Chrome, and let him choose by sight. Questions: a note on a paragraph or a span; saved with the game; edited and
deleted; whether notes ever feed the game (recommended: never); the reading layer.

### 3. The autoplay (a paper, then the build)

`docs/kickoff-closing-review.md` piece 4. What this session settled for it:
- **The script is the action table**; the target is **70**, shown by the record at the end (Robert, Round 165).
- **The UI steps are proven**: the table's 396 moves all go through the page as a player would click. The autoplay
  draws its own cursor along the same steps and types each thought's prose as a note (piece 2's notes).
- **Measured pace without typing:** about 12–13 minutes for the whole game on the shared machine (most of it the page's
  own work). 296 thoughts typed at human speed will dominate: measure the prose's length and offer a speed control.
- **Naming a theory uses the browser's `prompt()`** (`docs/review-closing.md`, "Left open"), a dialog that stops the
  page; an inline field would let the autoplay show it. Decide in the paper.
- **What the autoplay types** must pass the reading layer: the annotation's prose carries hindsight notes, Holmes dates,
  ids and `t37.7` references. Decide what is typed.

## Discipline and traps (Rounds 60–170)

- **Measure before designing**, and **check in headless Chrome, through the page, not from saves made in node** (Rounds
  157–164: six UI defects that node tests and node-made saves never met). The action table through the UI is the check.
- **Only one script may drive the headless Chrome (port 9333) at a time.** It has one page; a second client navigates it
  away and spoils both runs (Round 164 lost a run so). Wait for one run to finish before the next check.
- **The browser caches `ui/app.js`:** `scripts/cdp.mjs` turns the cache off; a hand-rolled client must too, or it checks
  the old code.
- **Inspecting a save in node:** `new Game(model, { state })` reloads it; before Round 161 a reload lost "built", and a
  save inspected without care can mislead. Prefer the live game.
- **Script slips look like defects:** several "failures" this session were the scripts' (a half-made connection left
  behind, a check matched without its expectation, a theory's random id, a form toggled shut, a paragraph's moves made in
  the wrong order). Before calling a failure a defect, reproduce it by hand in the page.
- **Gate every commit, documentation-only ones included,** on `npm test` in the same command, with `run_in_background`,
  never a shell `&`; check the result before pushing. The suite is about 5–8 minutes (153 tests; the action table's test
  is 3–4 of them). **Never edit a file the running gate will commit**, nor engine or case files while it runs; a new
  test file written during a gate may or may not be picked up (Round 168's was not). Draft in a scratchpad
  `git worktree`, served on another port (`node scripts/serve.js 8322`), and copy back after the commit.
- **Before and after each step, diff in full** the reveal, foreshadow and clash logs, `report.md`, `thoughts-report.md`
  and the gate listing (a `snap.sh` of `npm run -s reveal-log`, `foreshadow-log`, `clash-log`, `validate`,
  `validate-thoughts`, and the gate listing); say what moved. UI steps should move nothing.
- **When the case or the thoughts change, rerun `npm run action-table`** (3–5 minutes) and commit the file with them.
- **Killing a process:** capture its PID when you start it; a pattern kill is blocked by a hook (it has killed live
  sessions).
- **The reading layer is sacred:** new text on the page goes through the leak checks; fixed UI words around card names
  are not run through the LLM checker, and the Round entry says so.

## Acceptance

- The layout built in its four steps, each with screenshots and a clean UI run of the action table.
- Then the notes paper (mock-ups by sight), agreed and built; then the autoplay paper, agreed and built.
- If the work runs past one session, hand off with a kickoff in `docs/` as this one does.
