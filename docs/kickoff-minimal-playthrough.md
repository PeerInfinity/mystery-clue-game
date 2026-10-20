# Kickoff: a minimal playthrough to the maximum, a choice of playthroughs, and the game's statistics

**Date:** 2026-10-20. Handed off by the session that ran Rounds 190–195 of `docs/design.md` (the site's build fixed
for the autoplay; the autoplay at ½× and ¼×, its cursor at half speed, paused at the start, a Step button; a note
written in the story's line). **Supersedes** `docs/kickoff-annotations.md` (done, Rounds 182–189).

## Robert's ask (Round 196)

"Set up an alternate playthrough that does just the minimal set of actions required to earn the maximum score. That
means not writing any annotations and not following any paths that are dead ends. Also minimizing the number of clicks
required, for example by following the links directly from the story panel if it's already open, rather than opening
the Cards panel first. I want to have a way to select which playthrough to use.

I also want to collect some statistics about how much content is in the game, and the total number of each type of
action required for the minimal max score playthrough."

So, three pieces, **a paper first** (`docs/minimal-playthrough.md`: measure, questions, alternatives, recommendations;
Robert decides), then build:

1. **The minimal playthrough:** the fewest moves (and UI steps) that still reach the Hard maximum, **70 ahead of
   Holmes** (deductions 45 of 47, odd details 8, steps seen through 3, wrong turns dropped 3, checks planned 10, what did
   not happen 1). No notes or highlights. No move that scores nothing and enables nothing that scores.
2. **A choice of playthroughs** in the autoplay: the annotated reader's (today's) and the minimal one.
3. **Statistics:** how much content the game has, and how many actions of each kind the minimal playthrough needs.

## Where things stand (measured 2026-10-20)

- **The annotated playthrough** is the action table, `cases/silver-blaze/action-table.json`, built by
  `engine/actionTable.js` from `thoughts.json` (`npm run action-table`, 3–5 minutes; `engine/actionTable.test.js` keeps
  it current and at the maximum). Keys: `difficulty`, `families`, `ahead`, `thoughts` (per thought: `moves`, each with
  `op`, `at` (paragraph), `seq` and `ui` steps).
  - **396 moves:** collect 151, ask 123, build 52, seal 11, notice 11, pose 10, candidate 17, setAside 5, raise 5, drop
    3, file 2, reread 2, split 1, doubt 1, weigh 1, theory 1.
  - **1,140 UI steps:** story 151 (words clicked), open 380 (a card opened from a list), click 391, select 117, expect
    52, propose 25, a tab 14, fill 5, open_details 2, click_if_absent 2, select_text 1.
- **The autoplay** (`ui/autoplay.js`, `docs/autoplay.md`) plays that table in the page (`?autoplay`; `?autoplay=fast`
  for the check), and also writes 376 notes and highlights from `thoughts.json`. It opens every card through the left
  panel's lists (`openCard`: tries the tab named in the step, then cards, inferences, background, questions), as
  `scripts/ui-run.mjs` does. That is where the clicks Robert wants saved go: a card the story's words already open
  (on Hard a click on collected words opens the card), or a link on the card shown, needs no list.
- **Checks:** `scripts/autoplay-check.mjs` (the autoplay to the end at its fastest: 70, every family, the notes, no
  console error; about 6–8 minutes), `scripts/ui-run.mjs` (the table through the page from outside, each move checked in
  the save; 12–15 minutes).
- **The score:** `Game.record` (the record against Holmes, the Record tab); the families above; on Hard scores come
  only at Holmes's deadlines (`docs/ui.md`).

## Questions the paper should settle with Robert (candidates)

- **What is "minimal"?** Fewest moves, fewest UI steps (clicks and choices), or both, in which order. A greedy pruning
  (drop each move of the annotated table and replay: does it still reach 70?) against a search from the scoring moves
  backwards (what each score needs: the cards, the asks that bring the background cards a build needs, …).
- **What is a dead end?** Some scored families *are* the reader's wrong turns: "wrong turns dropped" (3) means a wrong
  theory or inference was made and then dropped; "odd details" are notices; a check planned is a seal. Those stay. Which
  moves score nothing and feed nothing: probably many of the 123 asks and some of the 151 collects (a card collected
  only because the reader noticed it), the poses (the player's own questions are never scored), the rereads, setAside,
  weigh. To be measured, not assumed.
- **Timing:** scores come only at Holmes's deadlines. A move may be needed before a deadline, and may be cheaper
  later (when more links show).
- **The fewest clicks:** opening a card from the story's words, from a link on the card in view, or from the other
  panel; the layout (one or two columns) and which tab each panel shows; the reading bar's "Next deduction" / "Next
  scene" in place of reading one paragraph at a time (allowed when nothing is to be done in between?).
- **Where the minimal playthrough lives:** a second table file (`cases/silver-blaze/action-table-minimal.json`, built by
  a script, kept current and at 70 by a test), or computed in the page.
- **How it is chosen:** "Watch the autoplay…" offering both; `?autoplay=minimal`; a menu on the strip before Resume
  (the autoplay now starts paused, Round 195: a natural place to choose).
- **Statistics:** which counts ("how much content"): paragraphs, words, cards by kind, background cards, questions
  (slots) and candidates, inferences, checks, theories, thoughts, notes in the annotation, …; per playthrough, the moves
  and UI steps by kind, per scene or chapter; where they are shown (a document, `cases/silver-blaze/stats.md` written by
  a script like `report.md`; the Record tab at the end; both).

## Read first, in this order

1. `CLAUDE.md`.
2. `docs/autoplay.md`, then Rounds 180–195 of `docs/design.md`.
3. `docs/review-closing.md` (how the action table came about, the Hard maximum, "Left open").
4. The code: `engine/actionTable.js`, `engine/actionTable.test.js`, `ui/autoplay.js`, `scripts/autoplay-check.mjs`,
   `scripts/ui-run.mjs`; `Game.record` in `engine/game.js`.

## Discipline and traps (Rounds 60–195)

- **Discuss before changing**, a paper before a build; Robert decides direction. **Measure before designing.** Robert
  chooses looks by sight (mock-ups injected into the live page through the DevTools protocol, desktop 1400×900 and
  phone 390×844, sent with SendUserFile).
- **Gate every commit,** documentation-only ones included, on `npm test` in the same command, the commit after it
  (`npm test > log && git add -A && git commit …`), with `run_in_background`, never a shell `&`; check the result
  before pushing. The suite is about 5–7 minutes (162 tests). **The gate commits with `git add -A`: never write a file
  in the tree while it runs** (draft in the scratchpad, or a scratchpad `git worktree` served on another port).
- **Before and after each step, diff in full** the reveal, foreshadow and clash logs, `report.md`,
  `thoughts-report.md` and the gate listing; say what moved.
- **Headless Chrome on port 9333: one script at a time.** `scripts/serve.js` serves the tree on 8321; restart it (by its
  PID) after it changes. **Killing a process:** capture its PID when you start it; a pattern kill is blocked by a hook.
- **A change to `ui/autoplay.js` is checked by `scripts/autoplay-check.mjs`** (Round 193: a helper shared by the notes
  and the answer box broke "proposing an answer" at ¶14; only the full run caught it).
- **The site:** GitHub Pages publishes what `scripts/build-site.js` collects (Rounds 190–191: a module loaded by
  `import()`, a font in a stylesheet and the action table were missing). **A new runtime file (a second table) must be
  published:** after building, serve `_site` alone and play `?autoplay` from it before calling the site done.
- **Script slips look like defects:** reproduce a failure by hand in the page before calling it one.
- **The reading layer is sacred:** nothing on the page may run ahead of the story. Statistics shown in the page must
  not tell a player what is to come (a count of cards still to collect is a leak; at the end it is not).

## Acceptance

- The paper agreed; the minimal playthrough built and checked to 70 through the page (an autoplay check for it, and
  `ui-run.mjs` if it plays the table format); the choice of playthroughs; the statistics; each step a Round, gated.
- If the work runs past one session, hand off with a kickoff in `docs/` as this one does.
