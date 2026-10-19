# Kickoff: the closing review, then the layout, the player's notes and the autoplay

**Date:** 2026-10-18. Handed off by the session that ran Rounds 151–156 of `docs/design.md` (the player's own
questions, `docs/questions.md`). **Supersedes** `docs/kickoff-questions.md`, whose mission is done; read that one only
for its traps (repeated below, with this session's).

## Why this session

Every tag of `docs/gap-analysis.md` §2 is now playable in some form (`docs/review-ws9.md`, QUESTION since Round 154).
Robert (2026-10-18) asked for four pieces of work, **in this order**, and said they may take more than one session:

1. **A closing review of the whole game against the annotation.**
2. **The layout:** both the left and the right panel get their tab selector at the top; the story becomes one of the
   selectable tabs; a toggle between one column and two open at a time.
3. **The player's own notes on the story text** (annotations), visually distinct from the story. Robert has not
   decided how they should look: that is a design question to put to him with alternatives.
4. **An autoplay mode:** the game plays itself through the whole story on the hardest difficulty, reaching the maximum
   possible score. It reads the annotation file (`cases/silver-blaze/thoughts.json`), writes each thought as a note on
   the story text "as if it were thinking through the details for the first time", and clicks the UI's buttons to make
   the game moves. It animates its own cursor and types each key individually, at about a human player's speed.

Robert's standing rule holds for each: **discuss design alternatives first; Robert decides; then build** (one paper
per piece, agreed before anything is built). The order matters: the review's per-thought table is the autoplay's
script, and the autoplay writes its thoughts with piece 3's notes, inside piece 2's layout.

## Read first, in this order

1. `CLAUDE.md` (commands, conventions; the reading layer is sacred).
2. `docs/reading-annotated.md` (the spec: the tag table, the notation, the audit at the end) and `docs/gap-analysis.md`
   (§2, §6 decision 2: what scores).
3. The reviews, in order: `docs/annotation-review.md` (the dump-per-thought method), `docs/review-ws3-ws6.md`,
   `docs/review-ws7.md`, `docs/review-ws8.md`, `docs/review-ws9.md` (tag by tag against the UI, with QUESTION now
   playable, unscored).
4. `docs/questions.md` (the latest paper, and the shape to follow), `docs/ui.md` (the UI as built, Q1 the scores).
5. Rounds 32 (every step of the annotation playable), 143–156 of `docs/design.md`.
6. The code: `ui/app.js` (the tabs, `renderTool`, `renderReader`, `renderStory`), `index.html`, `ui/style.css`;
   `Game.record`, `thoughtScores` and the other score families; `engine/readers.js` (the presets); the scripts of
   `scripts/` (the logs).

## Mission

### 1. The closing review (this session's first deliverable)

**Measure first.** For every one of the 295 thoughts of `thoughts.json` (not tag by tag, as `docs/review-ws9.md` did,
but thought by thought, as `docs/annotation-review.md` did): can the player make this thought's move **in the UI** at
the thought's paragraph, on which presets, with which clicks; does it score, and when is the score shown; and if not,
why not (agreed out of scope, a gap, a defect). Check in headless Chrome, not from the code (Round 125), on replays
made in node.

Questions it must answer:
- **The per-thought action table:** thought → the UI move(s) → the buttons and fields, with the paragraph it is first
  possible. This table is also the autoplay's script (piece 4), so write it as data the autoplay can read (for
  instance a scratch JSON first, then decide with Robert where it lives).
- **What "the maximum possible score" is on Hard** (`difficulty: hard`: cards collected by clicking, answers proposed,
  background connected). Round 143 measured an ideal Easy builder at 41 of 47 deductions; nobody has measured Hard,
  nor the other families (notices 8, raises 3, drops 3, checks 10, absences 1 possible). Which rows can no player
  score at all, and why.
- **Defects found** on the way: list them; fix only small ones, each its own step, after Robert agrees.

Write `docs/review-closing.md` (verdict per thought, totals per tag, the Hard maximum, the defects, what is left open)
and discuss it with Robert.

### 2. The layout (a paper, then the build)

Robert's wishes: tab selectors at the top of both panels; the story as a selectable tab; a one-or-two-columns toggle.
Questions for the paper: which tabs each panel may hold (can the story be on the right? can a tab be in both?); what
the reading bar ("Next paragraph", the deadline notes, the re-read form) does when the story tab is not shown; what
one column means on a phone width; what is remembered (per viewer, `localStorage` like the save). Check today's layout
in headless Chrome and screenshot it for the paper.

### 3. The player's notes on the story (a paper with visual alternatives, then the build)

The player writes their own notes against the story text. Robert has not decided the look: offer several (margin
notes beside the paragraph; notes between paragraphs; a highlighted span with a note on hover or click; a different
typeface, colour or hand), each **mocked up and screenshotted** in headless Chrome, so he can choose by sight. Other
questions: a note on a paragraph or on a selected span (the re-read and notice machinery already handles spans and
paragraphs); saved with the game; edited and deleted; whether notes ever feed the game (recommended: never, they are
the player's paper); and the reading layer (a note is the player's own text, so it cannot leak, but the autoplay's
notes are the annotator's, which is a piece-4 question).

### 4. The autoplay (a paper, then the build)

Questions for the paper:
- **Where it runs:** in the page (a mode, e.g. `?autoplay`, that drives the real UI with synthetic events and draws its
  own cursor), or outside it (a driver over the DevTools protocol, like the review scripts). Robert wants to watch it:
  in the page is the natural reading.
- **What it writes:** the thought's text, typed as a note at the thought's paragraph. The annotation obeys the honesty
  rules, but some thoughts carry ⚠ hindsight notes, Holmes dates, ids and `` `t37.7` `` references: decide what is
  typed (the prose only?), and check that no typed note runs ahead of the story (the reading layer), since the game has
  never shown thought text before (Round 146 showed card text only).
- **What it clicks:** from the review's action table; each move through the UI, never through the engine directly, so
  the run also tests the UI.
- **Human pacing:** cursor paths and per-key typing at about human speed; 295 thoughts typed at, say, 5 characters a
  second is several hours, so offer a speed control (and a skip-typing mode) and measure the run's length.
- **The maximum score** from piece 1, and a check at the end that the record shows it.
- **On a loaded machine** the case takes up to a minute to load and a clash search seconds: the autoplay must wait on
  the busy indicator, never on fixed timers.

## Discipline and traps (Rounds 60–156)

- **Measure before designing** (Rounds 113, 125, 133, 143, 151: each time the planned signal or shape failed on the
  data). **Check a flag's meaning before calling something a gap** (Round 141), and **check what the UI shows in
  headless Chrome** before reasoning from it.
- **Gate every commit, documentation-only ones included,** on the suite in the same command: `npm test > log && git
  add <paths> && git commit …`, with `run_in_background`, never a shell `&`; check the result before pushing. The
  suite takes 5–8 minutes (147 tests). **Never edit a file the running gate will commit, nor engine or case files**
  while it runs (Round 146 committed half of the next step). Round 151–155's way to keep working: **draft the next step
  in a scratchpad `git worktree`** (served on another port for the browser), and copy its files back after the commit.
- **Before and after each step, diff in full** and say what moved: the reveal and foreshadow logs, the clash log,
  `report.md`, `thoughts-report.md`, and the gate listing. Round 151's `snap.sh` and `gates.mjs` (below) do it.
- **The machine is shared** (load average up to 16 on 8 cores): pages took up to a minute to load in Round 153. Wait
  on the page's state (the busy veil, `#progress`), not on fixed sleeps. Compare timings by serving HEAD from a
  worktree on another port and alternating (Round 144).
- **Do not wait on the suite with `pgrep -f "node --test"`** (it matches the waiting shell). **A new `Game` method can
  shadow an old one** (Round 128): grep `^    name(` in `engine/game.js` (Round 152: `ask` was taken, so `pose`).
- **The reading layer is sacred:** any new text shown on the page goes through the leak checks; fixed UI templates
  around card names are not run through the LLM checker, and the Round entry says so.
- **Case data files are one JSON object per line;** thoughts are mirrored in `docs/reading-annotated.md`.
- **UI checks in headless Chrome:** serve with `node scripts/serve.js [port]` and stop it by PID; the headless Chrome
  on port 9333 works, use it and leave it alone; make saves in node and load them into `localStorage`
  (`mystery-clue-game:silver-blaze:v2`, `{game, selected}`). `Runtime.enable` replays old console entries: clear them
  after navigating. Section headings are uppercased by CSS. Round 151–155's scripts are in that session's scratchpad,
  `/tmp/claude-1000/-home-robert-CC-mystery-clue-game/f56b82a2-64e6-4f34-8873-cd60ee8d36af/scratchpad/`: `cdp.mjs`
  (load a save, open a tab, run an action, print `#tool`; `URL` for another port), `bar.mjs` (the reading bar after
  "Next paragraph"), `errs.mjs` (console errors), `mksave-pass.mjs`, `mksave-build.mjs` and `mksave-q.mjs` (saves),
  `measure.mjs`, `eager.mjs`, `snap.sh`, `gates.mjs`.
- **Robert's standard for conveniences:** the lower difficulties' helpers need not be perfect; list a case they get
  wrong rather than chase it (Round 108).

## Acceptance

- `docs/review-closing.md` written and discussed with Robert (this session's first deliverable), with the per-thought
  action table and the Hard maximum.
- Then, in order and each only after Robert agrees its paper: the layout, the player's notes, the autoplay. Each built
  in steps, one commit per step with a Round entry, gated and pushed. If the work runs past one session, hand off with
  a kickoff in `docs/` as this one does.
