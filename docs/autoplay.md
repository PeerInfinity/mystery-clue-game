# The autoplay: the game played to its maximum through the page, the reader's thoughts written as notes

Status: **for Robert** (2026-10-19, Round 180). Piece 3 of `docs/kickoff-layout.md` (first set out as piece 4 of
`docs/kickoff-closing-review.md`). Builds on the action table (`engine/actionTable.js`, Round 168: its script), the
UI runner that plays it (`scripts/ui-run.mjs`, Round 170), the layout (`docs/layout.md`, Rounds 171–174) and the
player's notes (`docs/notes.md`, Rounds 175–179: what it writes). Nothing is built until Robert agrees.

## What it is for

Robert wants to watch the game played as a careful reader plays it: every move of the annotated reading made in the
page, as a player would make it, on Hard, from the first paragraph to the last, with the reader's thoughts written
into the story as they occur, and the record at the end showing **70 ahead of Holmes** (Round 165: the Hard maximum,
45 of 47 deductions and every other family full). It is also a demonstration of what the game asks of a player, and
a check: if the page cannot make a move, the autoplay stops there.

## What exists, measured

- **The script** (`cases/silver-blaze/action-table.json`): 396 moves at 78 paragraphs, 1,139 UI steps: 151 clicks on
  the story's words, 380 cards opened from a list, 391 button clicks, 117 choices in a menu, 25 answers typed, 14 tabs,
  4 fields, 2 details opened, 1 menu chosen by its text, and 52 `expect` (a check, no action).
- **The runner** (`scripts/ui-run.mjs`) plays them from outside the page (the DevTools protocol), checking each move in
  the save: 396 moves, none failed, 12–15 minutes on this machine, almost all of it the page's own work (the solver).
  It answers the theory's name by replacing `window.prompt` (Round 163).
- **The thoughts as notes** (`thoughts.json`, 296 thoughts):
  - **142 quote the words they read** (`reads`): the autoplay can mark them. 81 of these have no prose (RECORD
    thoughts: the reader files the clause): a highlight alone.
  - **206 have prose** (28,000 characters). **134** (14,900 characters) can be typed as they are. **72** cannot: 15
    carry a ⚠ hindsight note, 61 cite ids (`t37.6`, `bk.opium_taste`), 17 cite paragraphs, and **20 point ahead in the
    story**: "It is used only to watch the race (¶199)" (`t6.2`), "it has to be broken later (`t68.3`)" (`t4.2`),
    "Dropped at `t92.7`" (`t37.10`). Typed as they stand, these would run ahead of the story, which the reading layer
    forbids (Rounds 4–9).
  - 5 thoughts have neither (TESTs the story settles): nothing to write.
- **Pace:** at a watchable typing speed (about 12 characters a second) the 134 clean thoughts alone take about 21
  minutes; with the 72 rewritten (say 9,000 characters) about 33; with the cursor travelling to each of the 1,139 steps
  (about half a second each, 10 minutes) and a pause at each paragraph read (231 × 1 s, 4 minutes), **about an hour**,
  on top of the page's own work (12–15 minutes). At 4× about 20–25 minutes; with typing instant, about the runner's
  time.

## Questions, alternatives, recommendations

### A1. Where it runs

- **(a) In the page (recommended):** `ui/autoplay.js`, loaded only when started, plays the table with the page's own
  events (a click on the element, a value set and its `change`/`input` dispatched, a selection made for a highlight),
  and draws **its own cursor** (an arrow that glides to each target before it acts) and types each note a character at a
  time into the note's box. Robert watches it in his own browser, at his own size, light or dark; nothing else to run.
- **(b) Outside, over the DevTools protocol** (like `ui-run.mjs`): real mouse and keys, but it needs a Chrome started
  for it and a script run in a terminal; to watch it, a visible (not headless) Chrome. Listed: `ui-run.mjs` stays the
  check.

### A2. How it is started, controlled and stopped

- **Started** from Settings, The page: **"Watch the autoplay…"**, which says what it does and asks first. Also by the
  address `?autoplay` (for a link to send).
- **Its own game (recommended):** the autoplay plays in a save of its own, so the player's game is kept aside and comes
  back when it stops ("Back to your game"). It starts from a fresh Hard game in the default layout (two columns: lists
  on the left, the card on the right, as the runner plays; one column on a phone). Alternatives: (b) it replaces the
  player's game after a warning; (c) it plays on from wherever the player is (not possible: the table is one game from
  ¶1).
- **A small control strip** over the page while it plays: pause / resume, **speed** (1×, 2×, 4×, and "notes appear at
  once"), the current paragraph, "skip to the next paragraph's moves", and stop. The page itself stays usable while
  paused (to look at a card), and the autoplay goes on from where it is.
- **A caption** in the strip says the move in plain words, from a fixed list ("Collecting: the words clicked", "Asking
  what I know about it", "Building an inference from 3 cards", "Marking it as odd", "Planning a check", "Proposing an
  answer", "Writing a note"), never the thought's id or tag.

### A3. What it writes (the reading layer)

For each thought, at its moves' paragraph (or at its own paragraph when it has no move):
- **Its `reads`** highlighted (each clause it quotes; a highlight alone when it has no prose).
- **Its prose** written as a note after the last clause it reads, or at the end of its paragraph when it reads none.

For the prose that cannot be typed as it stands (72 thoughts):
- **(a) A typed form in the annotation (recommended):** a new field `typed` on those 72 thoughts in `thoughts.json`,
  written once as a first-time reader would have written the note at that paragraph (the hindsight notes, ids and
  forward references removed; a citation of an earlier thought put in words: "as the paper suggested"). Drafted
  mechanically, then read and fixed by hand, thought by thought, in one annotation step; `docs/reading-annotated.md`
  unchanged (it is the annotator's record). **The validator** refuses a `typed` (and an untyped prose the autoplay
  types) that has ⚠, a backtick, a ¶ or a thought id; **the leak checks** (the LLM checker, Robert's choice, it costs
  money) can read every typed note against its paragraph.
- **(b) Strip mechanically at run time:** remove ⚠ parentheses, parentheses with ids, sentences with a forward
  reference. Cheaper, but the 20 forward references are not all marked ("It is used only to watch the race"), and the
  results read badly.
- **(c) Type only the 134 clean thoughts;** the other 72 make their moves silently. Honest but loses a third of the
  reader's voice (most of the HYPOTHESIS and WEIGH thoughts).

### A4. Naming a theory: an inline field

Today "New theory" asks for its name with the browser's `prompt()`, a dialog that stops the page (the only one in the
game; Round 163, "Left open"). **Recommended:** an inline field on the Theories tab ("Name: [Theory 1] Create"), for
players too; the autoplay types the name into it. The runner and the action table's step follow.

### A5. How it moves

- **The cursor** glides (about half a second at 1×) to the centre of each step's target, scrolling it into view first;
  a click shows as a brief ring. A drag for a highlight sweeps over the words.
- **Opening a card** follows the layout: the list chosen in the left panel, the card clicked, opening on the right; the
  story chosen again on the left before its words are clicked (the runner's way, `scripts/ui-run.mjs`).
- **Reading on:** "Next paragraph" pressed for each paragraph, with a pause (about a second at 1×) so the new paragraph
  is seen; between paragraphs with no move, the pause only.
- **Typing:** a character at a time into the note's box (about 12 a second at 1×, with a little variation), then Enter.
- **A move that fails** (the page refused it) stops the autoplay with a message naming the paragraph and the move: it
  is a defect to fix, as in Rounds 157–164.

### A6. The end

At the last paragraph the autoplay opens **the record** (the Record tab) and stops: "The story is over … Deductions 45
of 47 …", **70 ahead of Holmes**. "Back to your game" restores the player's.

### A7. How it is checked

- **`scripts/autoplay-check.mjs`:** the autoplay started in headless Chrome at its fastest ("notes appear at once", no
  pauses), to the end; the record must read 70, every family as in Round 165, no console error, and the save must hold
  the notes it wrote (296 thoughts: so many highlights and notes). About the runner's time.
- **`ui-run.mjs` stays** the independent check of the table through the page (it checks each move in the save).
- **`engine/actionTable.test.js`** already keeps the table at the maximum; a new test checks every typed note against
  the validator's rules (A3).

## Order of work (if agreed)

1. **The inline theory name** (A4), the runner and the table's step with it.
2. **The typed notes** (A3 a): the 72 drafted, read and fixed; the validator's rule; the reports diffed (the thoughts
   report gains a count); the leak checker over them if Robert wants it.
3. **The autoplay** (A1 a, A2, A5, A6) in `ui/autoplay.js`, with its controls and its own save; `autoplay-check.mjs`.
   Screenshots and a short screen recording (frames from headless Chrome) for Robert.

Each step one commit with a Round entry, gated on `npm test`; the logs, reports and gate listing diffed.

## For Robert

1. **A1:** in the page, with its own cursor (recommended), or outside it?
2. **A2:** started from Settings (and `?autoplay`); its own save, the player's game kept aside; the control strip with
   speeds 1×, 2×, 4× and "notes at once"; a caption of the move in plain words?
3. **A3:** a typed form for the 72 thoughts that cannot be typed as they stand, written into `thoughts.json` and checked
   (recommended), or stripped at run time, or only the 134 clean ones typed? The LLM leak checker over the typed notes?
4. **A4:** an inline field for a theory's name, in place of the browser's dialog?
5. **The order of work** above?
