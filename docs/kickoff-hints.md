# Kickoff: a hint system, designed from the data the game has

**Date:** 2026-10-21. Handed off by the session that ran Rounds 197–202 of `docs/design.md` (the minimal playthrough
to the Hard maximum, the autoplay's choice of playthroughs, the game's statistics; on the way, collected words open
their card on Hard, a drop scores only for a reason that holds, a hedged check scores nothing). **Supersedes**
`docs/kickoff-minimal-playthrough.md` (done).

## Robert's ask (Round 203)

"What I want to do next is discuss how we can design a hint system based on the data we have so far."

So this session is a **discussion, then a paper** (`docs/hints.md`): what the game already knows that a hint could
use, what a hint should be, when it may be given, what it costs, how it is kept from running ahead of the story, and
the alternatives, with recommendations. **Robert decides direction; nothing is built until he agrees.** Talk it
through with him before writing the paper, and show any look by sight (mock-ups injected into the live page, desktop
and phone).

## What exists (measured 2026-10-21)

**Hints today** (`hints` option: `off` / `on` / `story`; Easy `story`, Medium and Hard `off`; `Game.helps('hints')`,
`showsSignals()`):
- the Inferences tab counts how many more inferences can be built from what is held (`Game.buildable()`);
- when the story waits on a deduction (the 'wait' pace), the bar names the held cards to start from (`connectSet` of
  the step's needed inferences, `ui/app.js` ~l.374);
- the absence form suggests an expectation (`fileableAbsences()`);
- `story`: the story's own signals, **Holmes's interest** (a log of what Holmes visibly attends to, on the Questions
  tab) and passages to re-read where the story points back itself (`docs/reader-layer.md`, Q3–Q4, Rounds 134–139);
- "Holmes is a step ahead of you here" on the reading bar.

**The constraint already measured** (`docs/reader-layer.md` §5, Q3): **a hint timed by the reader's profile gives the
score away.** Fired at the first scene start after a thought's earliest paragraph, it lands before Holmes for 34 of
the 38 careful deduction rows, a median 132 paragraphs ahead: it makes the beat-Holmes move for the player; fired at
Holmes's paragraph it is the story itself. So hints were limited to the story's own signals, and "no hint feeds any
score function". A real hint system must face this: a hint that helps before the deadline helps score. (Costed
hints, a hint ladder, hints that mark the score as helped: `docs/redesign.md` "A hint ladder with cost".)

**Data a hint could draw on:**
- **The annotation** (`thoughts.json`, 296 thoughts): per thought the tag, paragraph, profile (typical, careful,
  expert), confidence, Holmes's paragraphs, what it reads (`reads`), maps to (cards, inferences, slots), its moves
  (`notices`, `raises`, `checks`, `dropped`, `asks`, `candidates`…), prose (`text`), the typed note (`typed`, leak-checked
  against its paragraph), and `remark`.
- **The two playthroughs as data:** `action-table.json` (the careful reader's 396 moves, each with paragraph, kind,
  cards and UI steps, and per thought the scores and deadlines) and `action-table-minimal.json` (the 144 moves the
  maximum needs, the latest paragraph each can be made, and what each needs: `engine/minimalTable.js`'s closure). So
  at any paragraph the game can know *the next useful move*, *what it needs that the player lacks*, and *how long
  until its deadline*.
- **The engine:** `stepInferences` (what each of Holmes's steps needs), `connectSet`, `buildable()`, the gates
  (`nextDeductionAt`), `record()` (rows only once their deadline is read), `fileableAbsences()`, clashes,
  `disclosure` / `heldBack`, `canAsk` (background facts), the player's own questions (`pose`).
- **The statistics** (`cases/silver-blaze/stats.md`): 690 cards, 58 inferences to build, 47 deductions to beat, 72
  rows possible, per scene.

**The reading layer is sacred** (Rounds 4–9): nothing on the page may run ahead of the story. A hint text must name
only held cards and read paragraphs, in fixed templates or leak-checked prose (`node checker/check.js … --notes`
checks notes against their paragraph; it over-flags inferences, Round 184).

## Questions the paper might settle (candidates; the discussion decides)

- **What a hint is:** a nudge to *where* (a paragraph, a card), to *what kind of move* (notice, build, ask, seal), to
  *which cards* to connect, or the *conclusion* itself; a ladder from vague to explicit.
- **When:** on request only, or offered (stuck for N paragraphs, a deadline near, the story waiting); per difficulty.
- **Cost:** none; a row "made with a hint" scored apart or not at all; a hint budget; nothing scored in a hinted
  family until the deadline passes.
- **Source:** the reader's next move (action table), the minimal set's next needed move, the engine's live state
  (what can be built now), the story's signals, the annotation's prose; or an LLM "Watson" limited to what is held
  (`docs/redesign.md`, listed there).
- **Leaks:** hint texts never naming a card not held or a paragraph not read; how checked (templates, the LLM checker).
- **How tested:** a hinted playthrough (the autoplay taking a hint where a test player is stuck?), counts of hints
  per scene.

## Read first

1. `CLAUDE.md`, then `docs/reader-layer.md` (§5, Q3–Q4: hints and profiles) and `docs/ui.md` (the record, Q1).
2. `docs/minimal-playthrough.md` (what the minimal table knows), `cases/silver-blaze/stats.md`.
3. `docs/redesign.md` ("Pacing and feedback"), `docs/gap-analysis.md` (GENRE, profile rows).
4. The code: `Game.helps`, `buildable`, `stepInferences`, `connectSet`, `record` in `engine/game.js`; the hint spots in
   `ui/app.js` (search `helps('hints')`); `engine/minimalTable.js`.

## Discipline (Rounds 60–202)

- **Discuss before changing;** lay out the reader's process, the gaps and many alternatives; a paper before a build.
- **Measure before designing** (e.g. how far ahead of Holmes each kind of hint would land, per scene).
- Each step one commit with a Round entry, gated on `npm test` in the same command (`run_in_background`, never a shell
  `&`), checked before pushing; never write in the tree while the gate runs.
- Headless Chrome on port 9333, one script at a time; a screenshot script that emulates a phone can leave the window
  at 390 px (reset with `Browser.setWindowBounds`, Round 201).
- If the work runs past one session, hand off with a kickoff in `docs/` as this one does.
