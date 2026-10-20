# Kickoff: review the annotation's content, write its typed notes, then build the autoplay

**Date:** 2026-10-19. Handed off by the session that ran Rounds 171–181 of `docs/design.md` (the layout, the Settings
menu, the player's notes, the autoplay paper). **Supersedes** `docs/kickoff-layout.md`, whose pieces 1 (the layout)
and 2 (the notes) are built and whose piece 3 (the autoplay) is agreed and continues here.

## Where things stand

- **The layout is built** (`docs/layout.md`, Rounds 171–174): two panels drawing any tab (Story, Notes, Card, Cards,
  Questions, Inferences, Theories, Checks, Timeline, Background, Record), a tab in one panel at a time (the other swaps),
  a link opening in the other panel (in place with "← back to …" in one column), the reading bar under the header (at
  the bottom on a phone), one or two columns, remembered per viewer under `mystery-clue-game:layout:v1`.
- **The Settings menu** (Round 177): "The game" (difficulty, pace, options) and "The page" (layout, theme, the notes'
  settings), Start over at its foot.
- **The player's notes are built** (`docs/notes.md`, Rounds 175–179): a notes mode ("✎ Notes" in the header); a note
  written into the story's line at any point, the words it speaks of highlighted (a highlight alone allowed); the Notes
  tab; saved with the game (`Game.addNote`, `editNote`, `deleteNote`, `allNotes`; `engine/notes.test.js`); never read
  by the game. `scripts/notes-check.mjs` plays them through the page with real mouse and keys.
- **The autoplay paper is agreed** (`docs/autoplay.md`, Rounds 180–181): every recommendation. In the page
  (`ui/autoplay.js`) with its own cursor; started from Settings or `?autoplay`; its own save, the player's game kept
  aside; a control strip (pause, 1×, 2×, 4×, notes at once, stop) and a caption of each move in plain words; each
  thought's `reads` highlighted and its prose typed as a note; an inline field for a theory's name in place of
  `prompt()`; the record at the end, **70 ahead of Holmes**; `scripts/autoplay-check.mjs`.
- **What blocks the autoplay is the annotation** (`docs/autoplay.md`, A3): of the 296 thoughts, 206 have prose; **134
  can be typed as they stand, 72 cannot** (15 carry a ⚠ hindsight note, 61 cite ids such as `t37.6` or `bk.opium_taste`,
  17 cite paragraphs, and **20 point ahead in the story**, e.g. `t6.2` "It is used only to watch the race (¶199)",
  `t4.2` "it has to be broken later (`t68.3`)", `t37.10` "Dropped at `t92.7`"). Typed as they stand they would run
  ahead of the story. Agreed: a `typed` field on those thoughts in `thoughts.json`, a first-time reader's note at that
  paragraph, checked by the validator.

## Robert's ask for this session (Round 181)

"There is a lot of cleanup work to do to get the annotations in the right format for this … a new session for that,
and for a general review of the content of the annotations." So, in this order:

### 1. A general review of the annotation's content (a paper first)

`docs/reading-annotated.md` (the annotator's record, prose) and `cases/silver-blaze/thoughts.json` (the same as data):
296 thoughts and 25 background cards. Earlier reviews looked at what the **case** holds of each thought
(`docs/annotation-review.md`, Rounds 92–99) and at what the **game** lets the player do with it
(`docs/review-closing.md`, Rounds 157–165). None has reviewed **the annotation itself** as a reader's paper: its prose,
its honesty, its dates and its consistency. Measure first, then write `docs/review-annotations.md` with a verdict per
thought, the fixes proposed by kind, for Robert to agree batch by batch. Candidate questions (the session decides the
list with Robert):
- **Honesty** (`docs/reading-annotated.md`, "The honesty problem"): does each thought say only what a first-time reader
  could think at its paragraph? The 20 forward references; the 15 ⚠ notes (are they right, and still needed?); prose
  that names a later card or event without a reference.
- **The prose as a note**: is each thought written as the reader would write it (short, in the reader's voice), or as
  the annotator's commentary ("A player who instead files …", "This becomes a question once …")? Which part is the
  reader's thought and which the annotator's remark (the annotator's remarks may belong in a separate field, e.g.
  `note`)?
- **Dates and premises**: the three of Round 166's slips that were not slips (`t34.5`, `t56.1`, `t64.3`); `date_note`s;
  `from` lists; tags and subtypes; the five thoughts with neither prose nor `reads`.
- **The two files agree**: `thoughts.json` against `docs/reading-annotated.md` (prose, reads, dates, ids).
- **What `npm run validate-thoughts` does not check yet** and should (e.g. the typed form's rules).
- **Left open from earlier reviews** (`docs/review-closing.md`, "Left open"): the "advise" template (`t92.13`), strains
  by improbability (`t24.4`, `t37.11`, `t120.2`), corroboration (`t26.1`, `t36.3`), the plain GENRE thoughts, `t40.7`,
  `t21.2` and `t78.4`, the rule `category`: listed, to keep or close.

### 2. The typed notes (`docs/autoplay.md` A3 a; may be folded into the review's batches)

A field `typed` on each thought whose prose cannot be typed as it stands: a first-time reader's note at that paragraph
(⚠ notes, ids and forward references removed; a citation of an earlier thought put in words). Drafted mechanically,
then read and fixed by hand. **The validator** (`scripts/validate-thoughts.js` / `engine/thoughts.js`) refuses, in a
`typed` and in any prose the autoplay types unchanged, a ⚠, a backtick, a `¶` or a thought or card id; a test
(`engine/thoughts.test.js`). The thoughts report gains a count. The LLM leak checker over the typed notes against their
paragraphs: Robert's choice (it costs money); ask.

### 3. The autoplay (`docs/autoplay.md`, its order of work)

1. **The inline theory name** (A4): a name field on the Theories tab in place of `prompt()`; `engine/actionTable.js`'s
   theory step and `scripts/ui-run.mjs` follow (the runner today replaces `window.prompt`).
2. (The typed notes: above.)
3. **The autoplay** in `ui/autoplay.js` (A1 a, A2, A5, A6) and `scripts/autoplay-check.mjs` (A7): the record must read
   70. Screenshots and frames for Robert.

## Read first, in this order

1. `CLAUDE.md`.
2. `docs/autoplay.md` (the agreed paper), then `docs/notes.md` ("Agreed") and `docs/layout.md` ("Agreed").
3. `docs/reading-annotated.md`: "What this is", "The honesty problem", "Notation"; then a scene or two of thoughts.
4. `docs/annotation-review.md` (the method of the first review: a dump per thought, verdicts, fix kinds, batches) and
   `docs/review-closing.md` (the verdicts per thought on Hard, "Left open").
5. Rounds 157–181 of `docs/design.md`.
6. The code: `engine/thoughts.js` and `scripts/validate-thoughts.js` (the annotation's checks), `engine/actionTable.js`
   (the table built from `thoughts.json`), `cases/silver-blaze/thoughts.json` (one thought per line).

## Discipline and traps (Rounds 60–181)

- **Discuss before changing**, a paper before a build; Robert decides direction. **Measure before designing.**
- **When `thoughts.json` changes, rerun `npm run action-table`** (3–5 minutes) and commit the table with it; its test
  fails otherwise. A change to a thought's `maps`, `reads`, `inference`, `notices`, `raises`, `checks`, `dropped`,
  `asks`, `passage`, `aside` or `candidates` can change the table and the score: then play it through the UI again
  (`node scripts/ui-run.mjs`, 12–15 minutes: none failed, 70 at the end). A `typed` field changes neither.
- **Edit `thoughts.json` and `docs/reading-annotated.md` together** where the prose or the ids change (Round 160);
  older review documents keep the ids they had (they are records).
- **Gate every commit, documentation-only ones included,** on `npm test` in the same command, the commit after it
  (`npm test > log && git add -A && git commit …`), with `run_in_background`, never a shell `&`; check the result
  before pushing. The suite is about 5–7 minutes (158 tests). **The gate commits with `git add -A`: never write a file
  in the tree while it runs** (draft in the scratchpad, or a scratchpad `git worktree` served on another port, `node
  scripts/serve.js 8322`), nor engine or case files.
- **Before and after each step, diff in full** the reveal, foreshadow and clash logs, `report.md`, `thoughts-report.md`
  and the gate listing (a `snap.sh` of `npm run -s reveal-log`, `foreshadow-log`, `clash-log`, `validate`,
  `validate-thoughts`, and `.cache/gates.mjs`); say what moved.
- **Headless Chrome on port 9333: one script at a time** (it has one page). `scripts/cdp.mjs` turns the cache off; the
  page is ready when its tabs are drawn. `scripts/serve.js` must be restarted (by its PID) after it changes.
- **Script slips look like defects:** reproduce a failure by hand in the page before calling it one (this session: a
  drag that stopped a character short looked like a marking bug; it led to snapping markings to whole words).
- **Killing a process:** capture its PID when you start it; a pattern kill is blocked by a hook.
- **The reading layer is sacred:** nothing on the page may run ahead of the story. The typed notes are new text on the
  page: the validator's rules, and the leak checks if Robert wants them.

## Acceptance

- The review paper agreed and its batches built (each a Round, gated).
- The typed notes written, checked by the validator, and (if Robert chooses) the LLM checker.
- Then the autoplay in its order of work, to 70 through the page.
- If the work runs past one session, hand off with a kickoff in `docs/` as this one does.
