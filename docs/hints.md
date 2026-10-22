# A hint system, from the data the game has

Status: **AGREED** (Robert, 2026-10-21: the direction in Round 204, the six choices of "Decided" below, by question
and by sight; H1–H9 as recommended in Round 205). Steps 1 (the engine) and 2 (the page) built in Rounds 205–206 ("As built", at the end); H8's
question (a cooldown per press or per target) is left for when the cooldown is built. The work of
`docs/kickoff-hints.md` (Robert's ask, Round 203).

## What is asked

"Discuss how we can design a hint system based on the data we have so far": what a hint is, when it is given, what it
costs, where it comes from, how it is kept from running ahead of the story, and how it is tested.

## Decided (Robert, Round 204)

Asked as questions with alternatives, after the measurements below, and the look by sight (mock-ups injected into the
live page at ¶40, desktop and phone):

1. **Cost: free for now.** Later a **timer on the Hint button, with a configurable cooldown**. (Not chosen: a hinted
   row recorded apart, a hinted row scoring nothing, a budget of hints.)
2. **When: on request only.** Nothing fires by itself. (Not chosen: an offer near a deadline; hints only after the
   deadline.)
3. **Target: the open row with the nearest deadline.** (Not chosen: the row whose material was read last; a thread the
   player points at.)
4. **Difficulties: all three.** (Not chosen: Easy and Medium only; Easy only.)
5. **Place: both** the reading bar (a Hint button beside Re-read…, the rungs given so far under the bar) **and a Hints
   tab** (every hint given, by paragraph, a log like Notes).
6. **The ladder: four rungs, and the last makes the move** for the player. Separately: **the catch-up note at a missed
   deadline, on all difficulties** ("Holmes reasons here that … You could have had it from ¶31, from …").

## What exists

**Hints today** (the `hints` option: `off` / `on` / `story`; Easy `story`, Medium and Hard `off`): the Inferences
tab's count of what can be built from what is held (`buildable()`); the 'wait' note naming the held cards to start
from (`connectSet`); the absence form's suggested expectation (`fileableAbsences()`); under `story`, Holmes's interest
and the story's own re-read prompts (`docs/reader-layer.md` Q3–Q4); "Holmes is a step ahead of you here".

**The rule they keep** (Round 139, `docs/reader-layer.md` §5): a hint timed by the reader's profile lands before Holmes
for 34 of 38 careful rows, a median 132 paragraphs ahead, so it makes the beat-Holmes move for the player; "no hint
feeds any score function". Robert's choice 1 keeps the letter of that rule (a hint changes no score function) and
accepts what follows from it: a move a hint leads to, or makes, scores like any other (H6).

## Measured (2026-10-21)

For each of the 70 rows that score on Hard, the moves under it (the minimal table's closure, `closureAndBatch` in
`engine/minimalTable.js`: its scoring move and, backwards, the move that first gave each card it needs), its **ready**
paragraph (where the last of those moves is first possible, in the reader's game) and its **deadline** (Holmes). A
scratch script, not in the repository; a replay of the action table, about 2½ minutes.

| | |
|---|---|
| The window, ready to deadline | within 5 ¶: 10 rows; 5–20: 6; 20–50: 8; 50–100: 11; **over 100: 34**; median 111 |
| By family (median window) | deductions 45 rows (129 ¶), notices 8 (146), checks 10 (24), raises 3 (178), drops 3 (44), absence 1 (146) |
| Rows open at once (ready, deadline not read) | **median 36, at most 45**, from ¶47 to the end; only ¶1–¶18 have none or one |
| Where they become ready | 23 on the train (¶8–46), 7 at Tavistock, 19 at the villa (¶70–92), 6 at the hollow, 10 on the moor |
| Where their deadlines fall | **35 of 70 in the explanation on the train home** (¶215–231); 10 on the moor, 8 at the hollow |
| What lies under one row | deductions: median 6 moves (1–2 builds, 3–4 words clicked, 1 ask), at most 31 (`t173.2`: 5 builds, 19 words, 7 asks); notices 2; checks 3 |

What follows:
- **"There is something to do" says nothing.** From ¶47 on there are always about 36 things; a hint must choose one
  (choice 3: the nearest deadline).
- **A hint before the deadline helps the score**, and with these windows it almost always lands long before Holmes.
  Choice 1 accepts that for now; the cooldown is the cost to come.
- **A target is several moves deep,** most of them in paragraphs already read (words not clicked, a background fact not
  asked). So a hint can point back ("look again at ¶31") without running ahead of the story.
- **The nearest deadline favours the short windows:** the ten rows within 5 paragraphs (`t80.2`, `t92.4`, `t95.2`,
  `t116.3`, `t117.2`, …) are the ones a nearest-deadline hint reaches first when their material arrives.

## The look (by sight, Round 204)

Mock-ups injected into the live page at ¶40 on Medium, desktop and phone (the scratch script `mock.mjs`, through
`scripts/cdp.mjs`): the target `t31.3`, "whoever came in by the door afterwards came in with a key" (Holmes ¶57).

- **Two rungs given:** the bar reads `Hint (2/4)`; under the bar, a ruled note:
  1. **Where.** Look again at ¶31: something there lets you get ahead of Holmes.
  2. **What kind of move.** An inference to build, from things said there. Its conclusion is about: *what*.

  and a **More** button, "the next rung says which cards".
- **Four rungs:** 3. **Which cards.** Connect "Hunter locked the stable door…" (click "The boy locked the door" in
  ¶31), "The stable window is not large enough for a man…" and the background fact "A locked door is opened again with
  a key…" (ask what you know about the stable door). 4. **The step.** (In the mock-up, Holmes's inference text; by
  choice 6 the fourth rung makes the move, H4.) On the phone four rungs take about a third of the screen.
- **The catch-up note** at ¶57 (the record's line on the reading bar): "Holmes reasons here that whoever came in by the
  door afterwards came in with a key. You could have had it from ¶31, from ⟨card⟩, ⟨card⟩ and ⟨card⟩."

## Questions, alternatives, recommendations

### H1. The target

- **Open rows:** every row (all six families) whose deadline is not yet read, not yet made by the player, and **ready
  for this player**: all it needs is held, or can be had from read paragraphs (words to click), from an ask (a
  background fact about a held card) or by building from those. A row whose material is not yet read is not a target.
- **The nearest deadline first;** ties to the row with the fewest missing moves, then the annotation's order.
- **Sticky:** once a hint is given on a target, the next press climbs the same target's ladder until the row is made
  or its deadline is read; then the next press starts a new target at rung 1. The bar says when a target changes
  ("A new hint", rung 1 again).
- **Nothing open:** "Nothing you have read yet gets you ahead of Holmes. Read on." This tells the player they are
  level with the story; as the measurement shows, it can only happen before ¶19 or for a player who has made
  everything.
- **Recommended** as written. *Alternative:* the deadline itself named ("Holmes gets there within 20 paragraphs"):
  not recommended; it times the story.

### H2. Where a hint comes from

- **(a) Live from the engine, the moves from the action table (recommended).** The target and what the player lacks
  are worked out live: for a deduction, the step's inferences (`stepInferences`), what each needs (`connectSet`), and
  for each card not held where to get it (a span in a read paragraph; an ask of a held card it is about, `rulesOn`; or
  a build, recursively: the hint first targets the deepest missing piece). The move's parameters for the other
  families (which card is odd and why, which exception, which check sealed with what, which drop with what reason,
  which absence) come from the action table's scoring move for that thought, which `engine/actionTable.js` derives from
  the annotation (`notices`, `raises`, `checks`, `dropped`, `maps`) and which the page already loads for the autoplay.
  A new case gets hints once its action table is made.
- **(b) The action table alone:** the reader's next move, replayed. Simpler, but blind to a player who took another
  way (another inference, a card collected elsewhere), and it would point at moves the player has made.
- **(c) The annotation's prose:** `text` is the annotator's voice and runs ahead (Round 184 found inferences
  over-flagged; prose is not leak-checked except `typed`). Only `typed` (59 thoughts, leak-checked against their
  paragraph) may appear, as an optional line under rung 2 or 3. Recommended: not in the first build.
- **(d) An LLM "Watson"** limited to what is held (`docs/redesign.md`). Listed, not proposed: cost, latency and leak
  checking per answer.

### H3. The rungs, by family

The four rungs say where, what kind, which, and then make the move. The texts are fixed templates over held card
names, the words of read paragraphs and paragraph numbers.

| Family | 1. Where | 2. What kind | 3. Which | 4. The move |
|---|---|---|---|---|
| Deduction | the read paragraphs holding what is still missing (or, all held, those of the cards to connect) | "an inference to build"; its conclusion kind (Hard's "what is it about") | the cards to connect; for each missing one, the words to click (in ¶N) or the card to ask about | collects, asks and builds, in order |
| Notice | the card's paragraph | "something here is odd" | the card (and the card it is odd against, `because`) | marks it odd |
| Raise | the inference's paragraph | "a step you hold may not follow" | the inference and the exception's text | raises it |
| Drop | where the reason is | "an answer (a theory) can be ruled out" | the answer or theory, and the cited cards | drops it with that reason (proposing the answer, or holding the rival theory, first) |
| Check | the paragraph of the plan's cards | "a check to plan before Holmes makes it" | the check's verb and fields | seals it with the expected result |
| Absence | the expectation's paragraph | "something that should have happened did not" | the expectation (and time, witness) | files it |

- **Rung 1 never names a paragraph not yet read;** rung 3 names only held cards, and for a card not held the **words**
  of a read paragraph that carry it, or the held card to ask about (never the background fact's own text before it is
  asked). A built inference's text appears only when it is built (rung 4).
- **Recommended** as the table. *Alternatives:* rung 1 at the scene ("in the train scene") rather than the paragraph,
  vaguer; a fifth rung splitting "which cards" into "one card" then "all".

### H4. The fourth rung makes the move

- **(a) Played through the page, in view (recommended):** the moves of rung 4 are played by the autoplay's step player
  (`ui/autoplay.js` plays a move's `ui` steps: the tab, the card opened, the buttons, the fields), at the autoplay's
  speed, so the player sees how the move is made in the page; then the bar says what was done ("Built: …").
  Deductions with missing pieces play each in order (collect, ask, build). Needs: the step player callable on one move
  outside an autoplay run, on the player's own game and save (the autoplay keeps the player's game aside today).
- **(b) Engine calls, the page redrawn:** quicker to build, but the player learns nothing about where the move lives.
- **(c) A Do it button on rung 4,** showing the step's text first (the mock-up's rung 4) and making the move on a second
  press: one more press, and the player sees the conclusion before deciding to have it made. Recommended as part of (a):
  rung 4 shows what will be done and a **Do it** button.

### H5. The bar and the Hints tab

- **The bar:** a `Hint` button beside Re-read… (`Hint (2/4)` while a target is being climbed); the rungs given on the
  current target under the bar in a ruled note, with **More** (the next rung's name) or, on rung 4, **Do it**. The note
  stays while the target is open and is folded (one line, "Hint: ¶31, 2 of 4") when the next paragraph is read.
- **The Hints tab** (beside Notes): every hint given, newest first, by paragraph: the target's rungs as given, whether
  the move was then made (by the player or by rung 4) and whether it was before Holmes once the deadline is read (the
  record's own rule: nothing said before the deadline).
- **The save:** a hint log `{para, row, rung, at: time}`; the cooldown (later) and the statistics read it. Start over
  clears it; the autoplay keeps it aside with the player's game.
- **Recommended** as written.

### H6. The score

- **By choice 1, free:** a move a hint leads to or makes scores like any other; the record shows no difference. On Hard
  this means pressing Hint (to rung 4, Do it) can reach the 70 without reading closely: **the Hard maximum stops being
  the unassisted maximum until the cooldown comes.** Robert chose hints on all three difficulties, the cost (the
  cooldown) to do the work later.
- **The hint log is kept** (H5), so a later choice can still mark hinted rows ("with a hint") without losing the past.
  Listed for later: hinted rows in the record at the end only, never during play.

### H7. The catch-up note

At each deadline read for a row the player did not make (any difficulty but Trivial): "Holmes reasons here that ⟨the
step's held text⟩. You could have had it from ¶R, from ⟨cards⟩." ¶R is the row's ready paragraph *for this player's
reading* (the last of its pieces in the story; the action table's closure gives the reader's); the cards are those of
rung 3. It names only what the story has now told. At the end the record lists the missed rows the same way, under
"Where you could have been first". **Recommended.** It also covers rows with no hint taken.

### H8. The cooldown (later)

A setting in the Settings menu: "Hint cooldown" (none, 1, 2, 5, 10 minutes; default none), per game. The Hint button
shows the time left. **For Robert:** whether the cooldown counts per press (every rung waits) or per target (More and
Do it free once a target's first rung is given). Not built with the first steps.

### H9. Leaks, and how hints are tested

- **The invariant test (engine):** at every paragraph of three games (a fresh one that only reads, the minimal
  playthrough, the action table), every rung of the current target is generated; each names only held cards, read
  paragraphs and the words of read paragraphs. The templates are fixed, so the LLM checker is not run on them (as in
  Rounds 139 and 143); `typed` lines, if used later (H2c), are already checked.
- **The hint-only player (engine):** a fresh Hard game that only reads, and whenever a target is open presses Hint to
  rung 4 and Do it. It must reach the 70 (every row is someone's nearest deadline in turn, or the hints miss rows), and
  it counts the presses per scene. A measure of the hints and a check that every family's rung 4 can be made.
- **In the page:** `scripts/hints-check.mjs` in headless Chrome: the ladder at ¶40 pressed to rung 4, Do it played in
  view, the Hints tab, the save, Start over; desktop and phone by sight.

## Order of work (if agreed)

1. **The engine:** `Game.hintTarget()` (H1), `Game.hint(rung)` → the rung's text parts and, for rung 4, the moves
   (H2a, H3); the hint log in the save; the invariant test and the hint-only player (H9).
2. **The page:** the bar's Hint button and note, More and Do it (H4a, the autoplay's step player on one move), the
   Hints tab (H5); `scripts/hints-check.mjs`; by sight.
3. **The catch-up note** (H7) on the reading bar and in the record at the end.
4. **The statistics:** the hint-only player's presses per scene in `stats.md`.
5. Later, on Robert's word: the cooldown (H8); marking hinted rows (H6).

Each step one commit with a Round entry, gated on `npm test`.

## For Robert

- H1–H5, H7 and H9 as recommended?
- H4: the fourth rung shows what it will do with a **Do it** button (one more press), played through the page in
  view: agreed?
- H6: with free hints, Hard's 70 can be reached by pressing Hint. Accepted as decided, the log kept for later?
- H8 (later): a cooldown per press or per target?

## Agreed (Robert, Round 205)

"I agree with your recommendations": H1–H7 and H9 as recommended; H4 with Do it; H6 as decided (free, the log kept).
H8's question stays open until the cooldown is built.

## As built

### Step 1, the engine (Round 205)

- **The data** (`cases/silver-blaze/hints.json`, `npm run hints`, about 1½ minutes; `engine/hintData.js`): the
  minimal playthrough's 144 moves, each at the reader's paragraph, with `needs` (the moves that first gave what it
  needs: `dependencies`, drawn out of `closureAndBatch` in `engine/minimalTable.js`), `wants` (its cards, theories,
  candidates, questions shown), `src` (for each want, the move it came from) and `lost` (the paragraph from which the
  move is too late); and the 70 rows that score on Hard, each with its deadline and `makes`, the moves that make it.
- **`makes` is found by replay as well as by kind.** A deduction can be made by an inference that covers its conclusion
  rather than by its step's own (`t127.3`: the minimal playthrough never builds `k.first_up_and_no_subordinate`), so
  the move after which each row is first made is added to the moves that make it by kind.
- **Implicit inferences have a deadline of their own.** `k.wife_stayed_home` comes by itself once its premises are held
  (the minimal playthrough collects them at ¶33); a player who has not collected them by ¶102 hears Holmes state it and
  can never make the four deductions that need it (`t46.4`, `t220.3`, `t81.5`, `t173.2`). So the moves that give an
  implicit inference's premises are among the moves that make the row, `lost` where the story states it; and a build is
  `lost` where the story states its inference. A row's `due` is the nearer of its deadline and its moves' `lost`, and
  the target is the open row with the nearest `due` (H1's "nearest deadline", made exact).
- **A row is open as soon as a step of it can be made** (a move other than collecting or asking, all it wants held or
  coming from another move that can be made now), not only when all of it can: the hint works on the deepest missing
  piece, as H2a said. Readiness by the reader's paragraph alone was not enough: a raise wanted a card the reader held at
  ¶40 and a player who had done less did not.
- **`engine/hints.js`:** `madeRows(game)`; `new Hints(game, data)`: `plan(row)` (pruned by what the player has: a card
  held, a fact asked, an inference built, an answer listed or settled, a theory held), `ready(plan)`, `open()`,
  `next()` (the same row while it stays open, a rung a press, the fourth kept), `take()` (logged), `parts(row, rung)`:
  `where` (paragraphs), `kind` (the move, what it is about, how many steps), `which` (each card held, or the words to
  click in a read paragraph, or the held card to ask about, or a build first; the step's fields with any card not held
  masked), `moves` (the fourth rung: what Do it makes). `Game.logHint` and `hintLog`, saved as `hints`.
- **Tested** (`engine/hints.test.js`, about 1½ minutes): `hints.json` up to date; at every paragraph of a game that only
  reads and of the hint-only player, every rung of every open row names only held cards, read paragraphs and words of
  read paragraphs; **the hint-only player** (a fresh Hard game that only reads and takes every hint to the fourth rung)
  **reaches 70 with 57 targets, 228 presses**; the ladder climbs one target and moves on; the log comes back with a save;
  no hints in Trivial.
- **Left for step 2, the page:** a candidate the drop needs is proposed in the page from its chip, while the question
  shows and is not settled (Round 200); at ¶40 the hint-only player's candidate for `t58.3` does not take in the engine
  (the engine drops an answer unlisted), so Do it in the page must propose it where the page allows, or the rung say so.

### Step 2, the page (Round 206)

- **The bar:** `Hint` beside Re-read… (`Hint (2/4)` while a target is climbed; none in Trivial, nor without
  `hints.json`); under the bar the rungs given on the target, in words (`hintRungs` in `ui/app.js`, H3's table):
  1. *Where.* "Look again at ¶4: something there lets you get ahead of Holmes." (each paragraph a link that brings it
     into view in the story);
  2. *What kind of move*, by the next step's move ("An inference to build (the first of 2 steps). Its conclusion is
     about: *where*." · "Something there is odd: mark it as odd." · a check, a drop, an absence, an answer to propose,
     a theory to write down);
  3. *Which:* the cards, each held (named) or by how to get it without naming it ("the event you get when you click
     'the favourite' in ¶4", "a background fact (ask what you know about ⟨held card⟩)"), in the move's sentence
     ("Connect …", "Mark … as odd", "Against …, raise: '⟨exception⟩'", "Drop … : a card tells against it (…)", "Plan
     the check …, expecting …", "File it: …");
  4. *The step:* the moves in order ("Click 'the favourite' in ¶4, then mark it as odd"; a build named by its
     inference's text) and **Do it**.

  **More** under the rungs names the next ("the next says which cards"). Read on, the hint folds to one line ("Hint
  (from ¶40): 2 of 4 given · show"). A made target says "Made. Press Hint for the next."; nothing open, "Nothing you
  have read yet gets you ahead of Holmes. Read on." A reload shows the last hint again (from the saved log).
- **Do it** (H4a): the fourth rung's moves made through the page by the autoplay's player, the cursor shown at 2×, a
  card reached the shortest way; the left panel's tab put back after. The player was drawn out of the autoplay's
  `start()` into `makePlayer()` (`ui/autoplay.js`, with `makeCursor()` and `playMoves()`); the autoplay plays as before.
  A move the page cannot make says so under the rungs ("Do it could not make the move here (…). The rungs above say how
  to make it yourself."). `?hintfast`: Do it with no cursor travel (the check).
- **The Hints tab** (after Notes): each target hinted, newest first: "Given at ¶40 · odd detail · 4 of 4 (up to the
  step itself)", then "not made yet" / "made" and, once its deadline is read, "made before Holmes (paragraph 57)" or
  "Holmes got there first"; "show" brings an open target's rungs back to the bar.
- **`scripts/hints-check.mjs`** (headless Chrome, real page): at ¶40 on Hard, Hint and More to the fourth rung, each
  checked in the save; Do it (the notice of `t18.3`); the Hints tab; the next target at the first rung; folded on
  reading on; a reload keeps the log; no Hint in Trivial; Start over clears it: 12 of 12. **`all`:** a fresh Hard game
  that only reads and takes every hint to Do it through the page **reaches 70** (69 hints, 6 minutes; the engine's
  hint-only player takes 57, not looked into), no Do it failed, no console error. `hints.json` is in the site build.
- **The leak check:** the rung texts are fixed templates around held card names, paragraph numbers and the words of
  read paragraphs, checked at every paragraph by `engine/hints.test.js`; the LLM checker reads card text and was not run
  (as in Rounds 139 and 143). The fourth rung names the inference to build before it is built: that is its purpose
  (H4c).

### Easy and Medium (Round 208)

Step 2 was checked on Hard only; Robert met Do it failing on another difficulty. The engine's hint-only player reached
70 on all three, but through the page Easy and Medium fell short (59 and 55). What differed, and what was done:

- **The answers are listed by the game** off Hard: a candidate move counts as had there (`!game.proposing()`), so no
  hint asks to propose an answer (Do it found no answer box). The engine test lets a candidate fail on Hard, which hid it.
- **What a conclusion is about** is asked only on Hard: Do it passes over that menu where it is not on the page.
- **A settled question showed only its answer** off Hard, so an answer the story had already settled against could not
  be dropped through the page (t58.3: the packet's question is settled at ¶58 on Easy and Medium, and dropping opium is
  the row). Its other answers are now folded under "N other answers — show", as the player's proposed ones stay in view
  on Hard (Round 164); Do it unfolds them, and folded answers past the first few.
- **A drop counts only from a reason that holds** (Round 199), checked when it is made. On Easy the gypsies' theory,
  hinted at ¶62, is dropped there before its reason holds (¶102); the ladder then stuck on it for fifty paragraphs and
  the rows due meanwhile were never hinted. A drop step with all it needs in hand is now ready only if it would hold
  (tried and put back, `wouldHold`), and Do it leaves for later a drop that would not hold once the steps before it are
  made (the row is hinted again when it would count; in the page that question waits for the solver's worker, and the
  trial puts the drops back also when the solver throws to be asked first, which had left a drop made and not held);
  and Do it takes back a drop made already whose reason did not hold, and makes it
  again.
- On the way: the third rung named a story's theory as "a theory" (it looked among the player's own); a Drop pressed
  after its form was gone threw (guarded).
- **Checked:** `DIFFICULTY=easy|medium node scripts/hints-check.mjs all` (new) reaches 70 on both (55 and 56 hints; Hard 57), no Do it failing; it
  now names a target whose moves Do it made without making it, and stops at the story's end.

### Step 3, the catch-up note (Round 209)

- **On the reading bar,** at each deadline read for a row the player did not make (every difficulty but Trivial), the
  record's line of what Holmes did, then: "You could have had it from paragraph 31, from “Hunter locked the stable
  door…”, “The stable window is not large enough…” and a background fact." The verb by family (had it, marked it odd,
  raised it, dropped it, planned it, filed it). Before this, the bar told only the rows made or not counted.
- **The paragraph** (`Hints.catchUp`) is the latest reader's paragraph among the moves that make the row and all they
  need, from `hints.json`: where the last piece is in the story. Every row's is at or before its deadline (the test);
  t117.2's is its deadline, ¶124, where Holmes speaks later in the same paragraph. It is a link to that paragraph.
- **The cards** are those of the move that makes the row, less those the line already names: a card held is linked; a
  statement, event, person or thing of the story not held is quoted, the story having told it; an inference not drawn
  or a background fact not asked is named by its kind only ("an inference", "a background fact").
- **At the end** the record lists the rows missed the same way, under "Where you could have been first" (65 for a
  Medium game that only reads).
- **Checked:** `engine/hints.test.js` (every row's paragraph at or before its deadline); `scripts/hints-check.mjs` step
  9, at ¶57 on Hard with nothing made: "You could have had it from paragraph 31…" and "…marked it odd from paragraph
  18."; by sight, desktop and phone, and the end of a Medium game.

### Step 4, the statistics (Round 210)

- `stats.md` has a section "The hints": a player on Hard who only reads and takes each hint open to its fourth rung,
  letting Do it make the moves: 57 hints taken to Do it, 228 presses, 4 rows hinted more than once (made in two goes,
  or come back), 70 ahead of Holmes; and a column "Hints to Do it" by scene (22 in the train's facts, 14 at Straker's
  villa, none in the explanation on the train home).
- The player is `engine/hintPlayer.js` (`playHints`), shared by the test and the statistics; the page's
  `engine/hints.js` stays free of node-only code. Hard only: it takes about half a minute there, minutes on Easy and
  Medium (the page's `hints-check all` measures those: 55 and 56 hints).
