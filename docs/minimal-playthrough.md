# A minimal playthrough to the Hard maximum, a choice of playthroughs, and the game's statistics

Status: **AGREED** (Robert, 2026-10-20, Round 200: every recommendation as written). Written Round 197. Two findings settled first: collected words open their card on Hard (Round 198); drops score only for a reason that holds, hedged checks not at all (Round 199). Nothing is built until he does. The work of
`docs/kickoff-minimal-playthrough.md` (Robert's ask, Round 196). Builds on the action table
(`cases/silver-blaze/action-table.json`, `engine/actionTable.js`: the annotated reader's moves on Hard) and the autoplay
(`docs/autoplay.md`, `ui/autoplay.js`).

## What is asked

"An alternate playthrough that does just the minimal set of actions required to earn the maximum score": no notes, no
dead ends, the fewest clicks (a card opened from what is already on screen rather than from a list); a way to choose
which playthrough the autoplay plays; statistics on how much content the game has and how many actions of each kind
the minimal playthrough needs.

## What exists, measured (2026-10-20)

All the measures below were made by replaying moves through the engine on Hard (a fresh `Game`, each move's engine
call at its paragraph, the record at the end), in scratch scripts, not yet in the repository. A replay of the whole
annotated table takes about 2½ minutes, of the minimal one about 30–40 seconds (the solver's work).

### The maximum, and the moves that score

The Hard maximum is **70 ahead of Holmes**: deductions 45 of 47, odd details 8, steps seen through 3, wrong turns
dropped 3, checks planned 10, what did not happen 1. Those 70 rows belong to **68 thoughts** of the 296. A row scores
when one move of its kind is made before Holmes's paragraph (its deadline):

| Family | Scored by | Rows |
|---|---|---|
| Deductions | holding the inferences Holmes's step needs, built by the player (or proving its conclusion) | 45 |
| Odd details | marking a card as odd (`notice`) | 8 |
| Steps seen through | raising an exception against an inference (`raise`) | 3 |
| Wrong turns dropped | dropping a theory or an answer (`drop`) | 3 |
| Checks planned | sealing a check with the expected result (`seal`) | 10 |
| What did not happen | filing an absence (`file`) | 1 |

Everything else a move does is to make those possible: the cards a build connects (collected from the story, recalled
by asking, or built before), the theory a drop is weighed against, the card a notice marks.

### The minimal set of moves: 141 (143 in the page) of 396

**How it was found.** (1) *Backwards from the scores:* the scoring moves of the 68 thoughts, and the inferences the 45
deductions need; then, repeatedly, the move that first gave each card those moves need (found by replaying the whole
table and noting what each move unlocked; a background fact that arrives by itself as the story reaches it comes from
the earlier ask of a card it is about). That closure is **154 moves**, and its replay reaches 70. (2) *Pruning:* each of
the 154 removed in turn and the rest replayed (in parallel, 20 minutes): 17 could go alone, 13 of them together (the
other four were alternatives to each other). **141 moves reach 70**, and no single one of them can be removed
(checked the same way).

| Move | Annotated | Minimal | What drops out |
|---|---:|---:|---|
| Collect (words clicked) | 151 | 72 | cards no score uses (the reader's colour: "the stable boy", "a long grey cloak"…) |
| Ask what I know | 123 | 10 | most: the background facts a build needs arrive by themselves once one card about them was asked (Hard recalls further facts as the story reaches them) |
| Build an inference | 52 | 37 | inferences no step of Holmes's needs and nothing scored rests on |
| Mark as odd | 11 | 7 | notices of thoughts Holmes never takes up (one card's notice scores two thoughts) |
| Seal a check | 11 | 7 | one sealed check scores every thought that plans it (three checks are each planned by two thoughts) |
| Raise an exception | 5 | 3 | the two that score nothing |
| Drop a wrong turn | 3 | 3 | — (all three score) |
| Hold a theory | 1 | 1 | — (the inside story: the rival a "more hands" drop needs) |
| File what did not happen | 2 | 1 | the second absence (no deadline) |
| Propose an answer | 17 | 0 (2 in the page) | the engine drops a candidate without it, but **the page's "Drop it…" is on the answer's chip**, so the two answers dropped (opium in the packet, Edith Baxter) must be proposed first |
| Ask my own question | 10 | 0 | never scored (`docs/questions.md`) |
| Re-read, set aside, split, doubt, weigh | 10 | 0 | none scores or feeds a score on Hard |
| **Moves** | **396** | **141** (143) | |

The minimal moves touch 106 of the 296 thoughts. The 37 builds connect 148 cards (at most 8 in one).

**Limits of "minimal".** It is the fewest moves *among the annotated reader's*: a pruning of the action table, not a
search over every move the game allows. A different inference (fewer cards, another route to Holmes's step) could be
cheaper; finding it would need a search over the case's inferences, a larger piece of work (listed, not proposed).

### A finding: a drop scored whatever its reason (fixed, Round 199)

`dropScores()` counted a drop made before the deadline **whatever the reason given, and whether or not it held**
(`dropCheck` was not consulted). So the minimal playthrough could have dropped Edith Baxter "for its cost" and skipped
the inside story theory. **Robert: fix it.** Since Round 199 a drop scores from where a reason that holds was first
given, and a check expected both ways (the same looseness for sealed checks) scores nothing. The annotated reader's
three drops hold where they are made; at ¶92 only "more hands" against the inside story holds for Edith Baxter, so the
theory stays in the minimal playthrough.

### Where the clicks go

**The kickoff assumed** that on Hard a click on words already collected opens their card. **It does not:** on Hard a
click on the story's words always collects (`onStoryClick`: "You already have that."). A card is opened from a list (a
tab of the left panel), or from **a link on the card in view**: a card shows its background facts as links once
asked, an inference its premises ("Rests on"), a claim what it is about ("About"); the building bar shows the cards in
the connection, and a build names the inference made.

Counted for the moves alone (two columns: the story or a list on the left, the card on the right), one click per tab
changed, card opened, button pressed and menu chosen, one per answer or name typed:

| | Moves | Tabs | Cards opened | Buttons | Menus | Typed | **UI** | Reading | **Total** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Annotated, cards from the lists (as the autoplay plays it, without the notes) | 396 | 340 | 370 | 544 | 105 | 26 | 1,385 | 231 | **1,616** |
| Annotated, the shortcuts | 396 | 211 | 356 | 544 | 105 | 26 | 1,242 | 176 | 1,418 |
| **Minimal**, cards from the lists, ¶ by ¶ | 141 | 142 | 180 | 274 | 75 | 9 | 680 | 231 | 911 |
| **Minimal**, the shortcuts | 141 | 121 | 176 | 274 | 75 | 9 | 655 | 130 | 785 |
| **Minimal**, the shortcuts, the moves batched (see M3) | 142 (144) | 94 | 184 | 282 | 76 | 9 | 645 | 81 | **726** |

*The shortcuts:* a card already shown is not reopened; a card linked from the card in view is opened by its link; a
list already chosen is not chosen again; a paragraph's collects are made first, while the story is shown. *Reading:*
"Next paragraph" each time (231), or the farthest of Next paragraph, Next scene and Next deduction that does not pass
the next paragraph with a move. The counts are estimates from a model of the page (the links each card shows are
approximated from the case's data); the built playthrough will be counted in the page itself.

The builds are most of the cost: each connected card is opened and "Connect to this" pressed (148 cards, about 300
clicks).

## Questions, alternatives, recommendations

### M1. What "minimal" means

- **(a) Fewest moves first, then the fewest clicks for those moves (recommended).** The moves are the playthrough's
  substance (what a player must do); the clicks are how the page is driven. 143 moves, about 726 clicks.
- (b) Fewest clicks overall: could prefer more moves if they save clicks (e.g. an ask whose links open several cards).
  The gain looks small (the shortcuts save about 25 clicks on the minimal moves) and the search is much harder.
- (c) A search beyond the annotation's moves (other inferences, other routes): listed, not proposed (see Limits).

### M2. What a dead end is

**Recommended:** a move is kept only if it scores, or something kept needs it (as measured above). The wrong turns stay
because dropping them scores: the drop, the theory it is weighed against, and the two answers proposed so the page can
drop them. Everything else goes: notes and highlights, the player's own questions, re-reads, set-asides, the split and
the doubt, the weighing, and the asks, collects and builds nothing scored uses.

### M3. When each move is made

- **(a) At the annotated reader's paragraph:** 45 paragraphs with moves; with the shortcuts 785 clicks. Reads like the
  reader, without the reader's detours.
- **(b) Batched (recommended, as Robert asked for the fewest clicks):** each move made as late as its deadline allows
  (the earliest Holmes's paragraph among the scores it feeds), gathered at as few stops as possible. **12 stops** (¶35, 80,
  88, 92, 95, 106, 115, 123, 124, 145, 188, 201), 81 reading clicks, about **726** in all. Checked by replay: 70 (one build the pruning had dropped had to come back, 142
  moves, because a step it made "by proof" at the reader's paragraph is not proved when the moves come later). Watching
  it: long stretches read with Next scene / Next deduction, then a burst of moves just before Holmes speaks.
- Both are the same table format; the choice is only when each move is made.

### M4. The fewest clicks in the page

- **(a) The autoplay takes the shortest way to each card (recommended):** a card already shown is left; a link to it in
  the card panel is clicked; otherwise the list (as now). Collects first within a paragraph. Reading by the farthest of
  Next paragraph, Next scene and Next deduction. For the minimal playthrough only, or for both (the annotated one would
  save about 200 clicks; recommended for the minimal one only, so the annotated reader is shown as it was checked).
- **(b) Collected words open their card:** **fixed, Round 198** (Robert: a bug). On Hard a click on words that bring
  nothing new opens their card (or the menu of their cards), as on the other levels. With the story on the left and the
  card on the right, a clue opens in one click from the story with no tab change; the counts above predate it (most of
  the 94 tab changes left were story↔list switches) and are to be measured again.

### M5. Where the minimal playthrough lives

- **(a) A second table file (recommended):** `cases/silver-blaze/action-table-minimal.json`, the same format as
  `action-table.json` (thoughts → moves → UI steps, so `scripts/ui-run.mjs` plays it unchanged), written by
  `npm run minimal-table` from the action table: the closure, the pruning and the batching above (about 20–30 minutes:
  run when the action table changes). A test replays it (under a minute) and checks it reaches 70 and that its moves are
  the action table's; the site's build publishes it (Round 191's lesson).
- (b) Computed in the page from the action table: the pruning needs hundreds of replays; not possible in the page.

### M6. How a playthrough is chosen

- **Recommended:** a menu on the autoplay's strip, shown while it waits to start (Round 195), "Playthrough: The
  annotated reader (396 moves, with notes) · The fewest moves (143, no notes)", fixed once Resume or Step is pressed;
  and the address: `?autoplay` (the annotated, as now), `?autoplay=minimal`, `?autoplay=minimal-fast` for its check.
  Settings → "Watch the autoplay…" says there are two. The minimal one writes no notes, so its speed menu loses "notes
  at once".
- Alternatives: two entries in Settings ("Watch the careful reader…", "Watch the fewest moves…"); or a question in the
  confirm dialog.

### M7. The statistics

**How much content the game has** (measured):

| | |
|---|---:|
| The story | 231 paragraphs, 9,574 words, 10 parts, 10 scenes |
| Words a player can click (spans carrying cards) | 1,041 |
| Cards | 690: 175 people, places and things; 93 events; 157 statements; 121 background facts; 49 words explained; 5 propositions; 90 inferences (58 to build, 32 that follow by themselves) |
| Questions | 39 about the case, 784 about the events (who, when, where…), 98 about states (who knew, who held); 14 raised by the story |
| Theories | 6 in the story; checks 8 (Holmes's tests); puzzles 11; absences 2; background groups 25 |
| Holmes's steps | 62, of which 47 have a paragraph to beat |
| The annotated reading | 296 thoughts in 20 kinds (RECORD 94, TEST 30, HYPOTHESIS 27, INFER 23, GENRE 20, WEIGH 19, NOTICE 16, …); 206 with prose, 142 quoting the story; the autoplay writes 376 notes and highlights |
| The score | 72 rows possible on Hard, 70 reachable |

**Per playthrough:** moves by kind (the table above), clicks by kind, the paragraphs with moves, and per scene.

**Where:**
- **(a) A document written by a script (recommended):** `cases/silver-blaze/stats.md`, written by `npm run stats`
  (like `report.md`), with both playthroughs side by side; a test checks it is up to date.
- **(b) In the page, at the end:** the autoplay's closing line already gives its moves and notes; it could add the
  clicks it made, by kind. Recommended as well (cheap, and it is the real count, not the model's).
- (c) Content counts in the page for players (the Record tab, once the story is over): possible without a leak only at
  the end; listed, not proposed.

## Order of work (if agreed)

1. **The minimal table:** `engine/minimalTable.js` and `npm run minimal-table` (closure, pruning, batching, the two
   candidates the page needs), `cases/silver-blaze/action-table-minimal.json`, its test; played through the page by
   `scripts/ui-run.mjs` (each move checked in the save).
2. **The choice and the shortest way:** the strip's menu and `?autoplay=minimal`; the autoplay's shortest way to a card
   and its reading by jumps for the minimal playthrough; no notes; its click count at the end; the site publishes the
   second table; `scripts/autoplay-check.mjs minimal` (70, no notes, no console error), and the built site played.
3. **The statistics:** `npm run stats` → `cases/silver-blaze/stats.md`, its test.

Each step one commit with a Round entry, gated on `npm test`; the logs, reports and gate listing diffed.

## For Robert

1. **M1–M2:** minimal = the fewest of the annotated reader's moves that still reach 70 (141, 143 in the page), then the
   fewest clicks for them; the wrong turns kept because they score?
2. **The drop finding:** settled, the scoring fixed (Round 199).
3. **M3:** the moves batched just before their deadlines (12 stops, about 726 clicks), or made at the reader's
   paragraphs (45, about 785)?
4. **M4:** the autoplay takes the shortest way to each card in the minimal playthrough only? And do you want the game
   change (on Hard, collected words open their card) considered separately?
5. **M5–M6:** a second table file built by a script and tested; chosen on the strip before starting, and by
   `?autoplay=minimal`?
6. **M7:** `stats.md` written by a script, and the autoplay's closing line counting its clicks?
7. **The order of work** above?

## Agreed (Robert, Round 200)

Every recommendation as written: minimal = the fewest of the annotated reader's moves that reach 70, then the fewest
clicks for them, the wrong turns kept (M1–M2); the moves batched just before their deadlines (M3 b); the autoplay
takes the shortest way to each card in the minimal playthrough only (M4 a); a second table file built by a script and
tested (M5 a); chosen on the strip before starting and by `?autoplay=minimal` (M6); `stats.md` written by a script,
and the autoplay's closing line counting its clicks (M7 a, b); the order of work. Settled before: collected words open
their card on Hard (Round 198), a drop scores only for a reason that holds and a hedged check not at all (Round 199).

## As built (Rounds 200–202)

- **The minimal table** (Round 200: `engine/minimalTable.js`, `npm run minimal-table`, `action-table-minimal.json`):
  **144 moves at 13 paragraphs, 70 ahead** (collect 73, ask 10, build 37, notice 7, seal 7, raise 3, drop 3, candidate
  2, theory 1, file 1); none can be removed alone. Three changes from the measures above:
  - **batched first, then pruned** under the batched timing, so the pruning never removes a move that only proved a
    step at the reader's own paragraph (in the measures one build had to be put back by hand);
  - **the paragraphs with moves are chosen for the fewest reading clicks** (every move's window holds one; a search
    over the paragraphs, the reading between them counted as the page reads, `readingClicks`): ¶29, 46, 80, 85, 92,
    95, 101, 115, 122, 124, 143, 188, 201, **76 reading clicks** (231 a paragraph at a time; 18 to read the story
    through with no moves at all);
  - **what the page needs and the engine does not** (found by `scripts/ui-run.mjs`): an answer is proposed only on a
    question the page shows and has not settled, so the two answers dropped are proposed before their questions settle
    in the reader's game, and the cards that show the questions are kept (two collects more: 144, not 142).
- **Checked:** `engine/minimalTable.test.js` (the table's moves are the action table's, none earlier than the reader
  made them; replayed it reaches the maximum, every move taking); `scripts/ui-run.mjs` on it: 144 moves, none failed,
  the record 70.

