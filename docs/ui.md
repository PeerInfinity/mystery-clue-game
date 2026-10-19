# The UI (workstream 9)

Status: **AGREED** (Robert, 2026-10-18, Round 143: every recommendation of Q1–Q7 and the order of work), **built**
(Rounds 144–148). Its review: `docs/review-ws9.md` (Round 149). Mission: `docs/kickoff-workstream-9.md`. Builds on
`docs/gap-analysis.md` (§2, every tag's "What is needed", for its UI half; §5 item 9; §6 decision 2, what scores),
Round 32 (the game should let the player perform every step of the annotation), the "UI" steps and "Left open"
lists of `docs/hypotheses.md`, `docs/predictions.md` and `docs/reader-layer.md`, their reviews, and Rounds 62
(the solver in a Web Worker), 106, 118, 130 and 136–139 (the UI steps so far).

## The player's process

Workstreams 1–8 modelled what a careful reader does with the story. This one is about the player at the page,
who does four things over and over:
- **Reads on**, a paragraph or a scene at a time, and expects the page to keep up. A wait is acceptable if the page
  says it is working (Round 62's ruling); a page that looks idle and does not respond is not.
- **Makes a move** from the annotation: a card noticed, a clue doubted, an inference built, a check sealed, a theory
  weighed, an absence filed. Round 32: every step of the annotation should be a move the game offers.
- **Looks for where they stand.** The game was built to let a player beat Holmes. Six score functions say by how much,
  and nothing shows them. A player who made the curry argument at ¶37 is never told that Holmes reached it at ¶218.
- **Changes the settings**, once or twice: the difficulty, then perhaps an option or two.

Two rules hold over all of it:
- **The reading layer is sacred** (Rounds 4–9). Nothing on the page may run ahead of the story. For scores this is
  sharp: telling a player "this deduction scores" before Holmes makes it tells them it is right.
- **The game never says, before Holmes acts, whether a sealed check matches anything** (`docs/predictions.md` Q1). Nor
  may a score.

## What exists

### Every tag: the move, the engine, the UI

Checked in headless Chrome on saves made in node (Easy, Medium, Hard and Trivial; ¶100, ¶110, ¶165, ¶170 and the end),
with each tab's headings, buttons, links and dropdowns listed, and a card of each kind opened. Thought counts are
from `thoughts.json` (295 thoughts).

| Tag (thoughts) | The player's move | Engine | Where the UI offers it | Verdict |
|---|---|---|---|---|
| RECORD (93) | read; collect (Hard) | `advance`, `readTo…`, `collect` | story pane, "Next paragraph / scene / deduction"; Card and Cards tabs; Timeline › What happened | **offered** |
| NOTICE (16, ·calculate 2) | mark a card odd, against an expectation | `notice`, `unnotice` | Card tab: "Does something here go against what you would expect?" with a "because…" list (109 background facts at ¶110), "That's odd"; Questions › Odd things | **offered**; the list is long |
| ABSENCE (6) | file what did not happen | `fileAbsence`, `fileableAbsences` | Timeline › By place / By thing only: "Something that should have happened did not" (Easy pre-selects the expectation) | **offered**, hard to find |
| QUESTION (10) | pose a question ("Who has a key?") | none: questions are raised by the story (`slotVisible`) | none. The re-read form takes a raised question | **missing**; no workstream took it (§5 lists none) |
| HYPOTHESIS (27) | candidates on a question; a scenario | pencil, circle, cross out, prove (`strike`, `circle`, `prove`…); `addTheory` | Card tab's open questions (the chip menu); Theories › "New theory" (a browser `prompt()`), "Add to …" on a chip | **offered** |
| INFER (24) | build an inference | `propose`; `applyRule`, `conclude`, `retract` | "Infer from this" / "Connect to this" and the building bar; **no UI for `applyRule`, `conclude`, `retract`** | **partial** (Q2) |
| DEFAULT (8, ·period 2) | raise an exception against a default | `raise`, `withdraw`, `exceptionsOf` | inference card: "Unless… could it fail here?"; background cards show their exceptions; "presented, not endorsed" (Round 141) | **offered** |
| AGENT (8), PHYSICAL (1) | as DEFAULT | as DEFAULT | as DEFAULT. The gap analysis's rule `category` (to sort the hand) was never built: no rule carries one; the Background tab groups by topic | **offered**, the sorting not |
| IDENTIFY (3) | ·merge an identity; ·split one culprit | identity slots; `suspect` + `setDoubtReason('two-stories')` | merge: the identity questions. split: `k.one_culprit` can be doubted, but **the doubt's "Why" list has no "two stories"**: `ui/app.js` keeps its own four reasons, while `DOUBT_REASONS` in the engine has five | **partial** (a defect) |
| WEIGH (19) | doubt, say how and why; split a statement | `suspect`, `doubtKinds`, `setDoubtReason`, `splitClaim` | clue and inference cards: "I suspect this may be false", "say how", "Why", "Split this statement" | **offered** |
| SOURCE (2) | trace who passed it on | `chainOf` | clue card: "Passed on: A → B → the story" | **offered** |
| TEST (30) | weigh a story; "could it fit?" | `scenarioCost`, `residue`, `assumedAnswers`, `plausible`, `checkLayer` | Theories tab (by `weigh`); "Could it fit?" (Easy); the board's "Does this night fit?" | **offered** |
| RESIDUE (1) | what a story leaves over | `residue` | Theories tab; the board's check | **offered** |
| PREDICT (8), TEST PLAN (4) | seal a check | `seal`, `unseal`, `sealStatus`, `sealTheoryTest` | Checks tab (Round 130) | **offered** |
| GENRE (20) | watch Holmes; re-read | `storySignals`, `reread` | Questions › Holmes's interest (Easy, Trivial); "Re-read…" on the reading bar; the story's prompt at ¶70 and ¶182 | **offered** (12 of 20, as agreed) |
| SET ASIDE (7) | put scenery aside | `setAside`, `putBack` | card: "Set aside"; Cards › "Set aside (N)" | **offered** (5 of 7, as agreed) |
| DROP (4) | drop a candidate or a story, with a reason | `drop`, `undrop`, `dropCheck` | chip menu "Drop it…"; Theories "drop it…" | **offered** |
| REVISE (4) | re-read an old card under a story | `readingsOf`, `revisedBy` | card: "How it reads under each story"; the toast on proving | **offered** |

### The score family

| Function | Rows (Silver Blaze) | Aggregate | UI |
|---|---|---|---|
| `thoughtScores` / `score` | 47 of Holmes's steps | `{scored, made, possible}` | **none** |
| `noticeScores` / `noticeScore` | 11 notable details | `{noticed, scored, possible, of}` | **none** |
| `raiseScores` / `raiseScore` | 5 | as above | **none** |
| `dropScores` / `dropScore` | 3 | as above | **none** |
| `checkScores` / `checkScore` | 11 (9 possible) | `{sealed, scored, possible, of}` | **none** |
| `absenceScores` / `absenceScore` | 1 (the dog) | `{filed, scored, possible}` | **none** |

Nothing scores in Trivial. No hint feeds any of them (Round 139).

### Methods with no caller in `ui/`

Of `Game`'s public methods, `ui/` never calls these player moves: `applyRule`, `ruleBindings`, `applicableRules`,
`conclude`, `conclusionMatches`, `retract`, and all twelve score functions. `nextAction` has had no caller since
Round 10 (the button says "Next paragraph"), and `checkTheory` none since Round 118 (the weighing replaced fit).

### The options

The Settings panel has Difficulty, Pace and (Trivial) "The game settles answers", then a folded "Difficulty options"
with all 14 `OPTIONS` in one flat grid, each with a hover help: who works out the answers, cards, answers, crossing
out, greying, clashes, weighing theories, hints, building an inference, background in inferences, background facts,
background you would not know, you read as, cards the solution does not need.

### The timeline board against workstreams 6–8

| Added by | What | On the board? |
|---|---|---|
| ws 6 | theories as layers, with their own pencil marks | **yes**: the layer picker (the six story theories and the player's) |
| ws 6 | cost, residue, assumed answers | **yes**: "Does this night fit?" on a theory's layer, by `weigh` |
| ws 5 | filing an absence | **yes**: the only place it is offered |
| ws 8 | set-aside cards | **yes**: left out of the board's lists (`inHand`) |
| ws 6 | readings by layer | on the card, not the board |
| ws 7 | sealed checks | **no** (Checks tab only) |
| ws 8 | Holmes's interest, what the story held back | **no** (Questions tab only) |

## Measured

Five scratch scripts (in the session's scratchpad): `prof.mjs` (a CPU profile of the page over the DevTools protocol,
with the busy veil polled every second), `wtime.mjs` (every request the page sends the solver's worker, with its
time, while loading a save and opening each tab), `readon.mjs` (pressing "Next paragraph" and timing each until the
page is idle), `scores.mjs` (all six score families replayed for a passive and an ideal player) and `conclude.mjs`
(what `conclude` and `applyRule` can do for the route's inferences).

### 1. The busy page

**Rounds 130 and 139 do not reproduce at HEAD.** Round 130's Medium game at ¶170, with Round 130's own save (four
seals, a theory, background when relevant), opens Theories in 12–15 s with the busy panel showing. Round 139's own Easy
save at the end is ready in about 36 s, not 90. The main thread never freezes for more than 4.7 s: the profile is idle
for 229 of 239 s, and the waiting is the worker's. Neither round recorded what else was running at the time.

What a player waits for (wall time until the busy panel is gone):

| Save | Load (Card tab) | Questions | Theories | Other tabs | Worker requests |
|---|---|---|---|---|---|
| Easy, ¶110 | ≈ 14 s | ready with the load | 6 s | < 1.5 s | load 10 (7 s); Theories 34 (1.5 s) |
| Easy, the end | 36–41 s | ready with the load | 27 s | < 1.5 s | load 21 (31 s); Theories 89 (17 s) |
| Medium, ¶110 | ≈ 9 s | < 1.5 s | 5.5 s | < 1.5 s | load 4 (2.5 s); Theories 20 (3.6 s) |
| Medium, ¶170 (Round 130's save) | ≈ 9 s | < 1.5 s | 15 s | < 1.5 s | load 4 (2.7 s); Theories 36 (10.6 s) |
| Hard, ¶110 | ≈ 9 s | < 1.5 s | < 1.5 s (on request) | < 1.5 s | load 4 (2.8 s) |

Reading on (Easy, "Next paragraph" twelve times from ¶100 and from ¶165): about 0.36 s a paragraph, with spikes
where a new clash arrives: ¶101→102 takes 7 s on the Card tab and 20 s with Theories open; ¶172→173 takes 9 s
with Theories open.

**Where the time goes:**
- **The first 5 s, blank.** `loadCase` builds the model on the main thread (`verifyInference` 5.5 s of the profile)
  before the page has drawn anything, and the page says nothing.
- **The clash weighing, on every load.** On Easy, `renderToolNow` puts the clash count on the Questions tab's label
  ("Questions (12 clashes)"), so `game.clashes()` runs on every render, whatever tab is open. A reloaded game has no
  clash cache, so it finds every clash again: 21 sequential requests, nearly all `explainConflict`, 31 s of worker time,
  at the end of the story. Each answer reruns the whole render. On Medium the working set needs the same weighing (4
  requests, about 2.7 s at ¶170). In play, the same clashes are found one at a time, as they arrive, which is
  why reading on is quick but for the spikes.
- **A reload could skip it.** The save already keeps `clashLog`, every clash met, in the order met. `clashes()` reuses
  a cached list and checks it with one `consistent` call. Seeded from the log, a reload would do one check instead of
  twelve searches. Measured in node at the end: the clashes found incrementally (as the Easy UI finds them, 28.9 s
  spread over 231 paragraphs) and those found fresh from the save (30.1 s at once) are the same twelve and leave the
  same working set; only their order differs.
- **Theories weighs every theory at once,** and the panel waits for all six before it shows any. At the end on Easy,
  that is 89 requests (`scenarioCost`, `residue` and `assumedAnswers` per theory).

### 2. Scores, replayed

Easy, background when relevant, `scores.mjs`:
- **Passive** (reads only): every family scores 0.
- **Ideal** (builds whatever it can at every paragraph, notices every notable card when held, raises every scored
  exception, seals every check from its first accepted plan, drops what it can, files every absence):

| Family | Ideal | Leads on Holmes (paragraphs) |
|---|---|---|
| deductions (`score`) | 41 of 47 | median 124; from 1 (`t92.4`, `t96.1`) to 185 (`t44.2`); 17 by ¶46, 29 by ¶92, 39 by ¶157 |
| notices | 8 scored, of 11 rows, "possible 6" | 1 to 196 (the curry, `t20.4`) |
| raises | 3 of 3 | 52 to 184 |
| drops | 2 of 3 | 44, 52 (the third, `t92.7`, needs a rival theory the replay did not make) |
| checks | 10 scored, "possible 9" | 5 to 179 |
| absences | 1 of 1 | 146 (the dog) |

Two findings:
- **"Possible" is smaller than "scored" in two families.** `noticeScore` counts as possible only the rows whose Holmes
  paragraph is after the thought's own paragraph. A card is dealt, and can be noticed, before the thought's date:
  `t81.2` (the knife) is noticed at ¶80 against Holmes's ¶81, and `t189.1` at ¶188 against ¶189. Both score and
  neither is "possible", so the ideal player has 8 of 6. `checkScore` has 10 of 9, from `t116.3`, which scores through
  `t92.11`'s earlier seal (as `docs/review-ws7.md` says). Shown as "8 of 6", either would read as a bug.
- **A row says more than its score.** A row with `made` set but Holmes's paragraph not yet read tells the player that
  this deduction is one of Holmes's, so that it is right. So does `possible: 47` minus `made`, read as "what is left to
  find". Only rows whose deadline has been read can be shown during play.

### 3. `conclude` and `applyRule`

`conclude.mjs`, for each of the 55 inferences Holmes's steps need, at the first paragraph its premises are held
(premises that are inferences lent for the test), with a 20 s budget a call:

| | Inferences |
|---|---|
| tested (premises all held by some paragraph; `k.straker_raised_no_alarm` never is) | 54 |
| `conclude` alone, citing the premises, reaches it | **3** (`k.derbyshire_is_straker`, `k.horse_at_mapleton_by_reach`, `k.horse_left_alone`) |
| with the inference's own rule applications made first (`applyRule`, then `conclude`) | **43** |
| not reached even so (they need further world ties or an earlier inference's applications) | 11 |
| calls | 20–350 ms in node, but `k.taker_had_a_key` (alone) ran past 20 s |
| rules a player holds at the end with a schema or formula, so applicable | 84 of 121 |

What it means:
- **`conclude` alone cannot reach most steps.** A background fact with a schema is not a constraint until it is
  applied (grounded on cards), so citing it does nothing. With the inference's own applications made first,
  `conclude` reaches them.
- **An `applyRule` form is a binding form.** The rules bind up to five variables, each over a list of held cards (people,
  events, places): 13 to 88 choices, the event lists growing with the story. The player would pick each: "a dish that is safe for the household (`dish`: 26 choices,
  `portion`: 26, `dosing`, `setting`, `meal`: 51 each)". That is the expert's move written out, and the annotation's
  reader never thinks it so.
- **Some calls do not finish.** A conclusion the cited cards do not settle needs a witness solution, and on the big
  component one search ran past the 20 s budget (format 0.3, "Open": "`conclude` on the big component … can take a
  few seconds"). A UI needs a budget and an answer for it: "too hard to check here".

## Questions, alternatives, recommendations

### Q1. Scores: where and when

The player should learn, at the moment the story gets there, that they were there first. They should never learn it
earlier, because "you have made one of Holmes's steps" is a confirmation.

- **(a) At the end only.** A summary when the story ends: each family, each scored row, the leads. Safe, but a game of
  232 paragraphs gives nothing back for three hours.
- **(b) At each deadline, as the story reaches it, and at the end (recommended).**
  - **At the paragraph where Holmes makes the step** (or performs the check, or the deadline passes), a note on the
    reading bar: "Holmes reasons here that ⟨the inference card⟩. You had it at ¶37: 181 paragraphs before him." It
    names only card text already held: the step's inference cards, a sealed check's own words (`checkText`), the
    noticed card, the dropped answer, the filed absence. Never the thought's text, which is the annotator's prose.
    A row not scored says nothing ("Holmes reasons here …" is the story's own business).
  - **A running record,** in the header beside "N cards · M questions settled": "Ahead of Holmes: 12". It opens a
    **Your record** panel listing the scored rows whose deadlines have been read, newest first, with the counts so
    far: "of the 17 steps Holmes has made so far, you made 12 before him". `possible` is never shown during play.
  - **At the end,** the panel gains the totals per family ("deductions: 23 of 47 before Holmes; notices: 4 of 8 …"),
    the longest leads, and, beside it, "What the story held back" (Round 139), which is the same moment.
- **(c) Live:** a row as soon as it is made. This tells the player that the move is right. Rejected.

**What counts as "possible"** (the finding of Measured §2): a row is possible when it has a deadline at all. The
aggregates are made consistent that way, and `scored` can never exceed it. This changes `noticeScore().possible` from
6 to 8, `checkScore().possible` from 9 to 10, and nothing else. Tests change with it.

**Trivial:** nothing scores (`autoSolves`). Recommended: no record, and at the end one line: "In Trivial the game
worked the case out: nothing is scored. On Easy you can race Holmes." **Hints never touch a score** (Round 139), and
the record shows no difference between a move made after a hint and one made without.

**Leak check:** the new text is fixed templates around card names and paragraph numbers. As in Round 139, the LLM
checker reads card text, so it is not run; the Round entry says so.

### Q2. `applyRule` and `conclude`

- **(a) A full UI:** a background fact's card gains "Apply this to…", a dropdown per variable over held cards, then
  "Conclude…" with a question and an answer, citing cards. This is the engine's whole power, and the forms are large
  (Measured §3). The busy indicator covers the calls.
- **(b) Retire them in favour of `propose` (recommended for `applyRule`).** Every route step is an authored inference,
  and "Infer from this" already reaches all of them with the rules implicit (or connected, on Hard). `applyRule` stays
  in the engine for the tests and the validator; the gap analysis's "INFER: UI for applyRule and conclude" is closed
  as answered: the player's inference is `propose`.
- **(c) A small `conclude` (recommended, with (b)):** "State it yourself" on the building bar, for a conclusion the
  authored inferences do not hold. The player picks a question on the table and an answer (or "not" an answer), and
  the cards connected so far are cited. The game grounds the cited background facts on the cited cards and the
  question's card itself (no binding form), and says "it follows" (a new inference card, saved, doubtable) or "it does
  not follow from these". Behind the busy indicator, with a time budget, and "too hard to check here" past it. A
  conclusion that matches an authored inference counts as that inference (`conclusionMatches`), so the score and the
  'wait' gates see it.

  Whether (c) is worth building depends on how often a player would need a conclusion that no authored inference
  holds. In the annotation, none: every INFER, DEFAULT, AGENT, PHYSICAL and IDENTIFY thought maps to an authored
  inference or a slot (gap analysis §7). Its use is the player who reasons another way. **Listed, if Robert prefers
  (b) alone.**

### Q3. The busy page

- **(a) Leave it.** It shows its panel and answers, so it is not broken. But 37 s to reload an Easy game at the end,
  and 27 s for Theories, are long.
- **(b) Three small fixes (recommended):**
  1. **Seed the clash cache from the saved `clashLog`** on load, so a reload checks the clashes it knows instead of
     searching for them again (Measured §1: the same twelve, the same working set). The clash log, the reports and
     the gates cannot move: they never reload a save.
  2. **Draw first, count after.** The tab labels' counts (clashes, inferences to build) come from the last render's
     values, refreshed after the page has drawn, so a tab never waits on a count it does not show.
  3. **Theories fills in theory by theory.** Each theory is drawn at once with "weighing…" and filled in as its cost
     arrives; the panel no longer waits for all six. The busy panel stays for a click's own work.

  And a "Loading the case…" line in `index.html` for the first 5 s.
- **(c) Speed the solver.** The weighing at the end is 21 searches of 0.1–4 s each. A faster `explainConflict` would
  help everywhere, but the solver has been tuned twice (Rounds 61, 66), and (b) removes the repeated work without
  touching it. Listed.

**Target, to check in headless Chrome:** an Easy save at the end ready in under 10 s; Theories at the end showing its
first theory within 3 s.

### Q4. The left-open items

| Item | From | Recommendation |
|---|---|---|
| An "advise" template for `t92.13` ("keep him entered") | `docs/review-ws7.md` | **Keep listed.** Advice is not a check; no other thought needs it. |
| Theories proposing their own predictions (Q6 (c)) | `docs/predictions.md` | **Keep listed.** It needs answer formulas on every check (`docs/predictions.md` §2). |
| A re-read's question is recorded, not used | `docs/review-ws8.md` | **Build (small).** While a re-read's passage is outlined, the reading bar says "Re-reading ¶8–¶46 with the question: Who drugged Ned Hunter's supper?", and Questions › Holmes's interest lists the player's re-reads under the story's prompts. No score. |
| The purist (`supplied: withheld`) still hears Holmes at the story's gates | `docs/review-ws8.md` | **Keep listed.** It is Holmes speaking, not the player knowing (Round 140). |
| `t68.3`'s "two stories" missing from the doubt's Why list | this inventory | **Fix:** the UI takes its reasons from the engine's `DOUBT_REASONS`, with a label for each. |
| ABSENCE only on the board | this inventory | **Build (small):** the same form on a clue's card ("Something that should have happened did not"), the clue as the witness. |

### Q5. The Options panel

- **(a) As it is:** 14 options in a grid.
- **(b) Grouped under headings, no change of behaviour (recommended):**
  - **You** (who the player is, kept across difficulties): you read as; background you would not know;
  - **The cards:** cards; cards the solution does not need; background facts;
  - **Your reasoning:** who works out the answers; answers to a question; crossing out; building an inference;
    background in inferences;
  - **What the game shows:** answers your clues rule out; clashes; weighing theories; hints.
- **(c) Fewer options.** Some are authoring conveniences (`irrelevant`). Removing any changes saves and presets. Not
  recommended.

### Q6. The board and workstreams 7–8

- **(a) Leave sealed checks and Holmes's interest off the board (recommended).** The board is where things were and
  when; a check is a plan and a signal is a quote, and each has its tab.
- **(b) Mark on the board the cells a sealed check speaks of** (a place and a thing). Listed.

### Q7. QUESTION: the player's own questions

The gap analysis (§2) asked for "the player poses questions: pin a ? on a card or blank, from templates". No
workstream took it; §5 left it out. Ten thoughts are QUESTIONs, six of them mapping to nothing. This is a design
question of its own, not a UI step. **For Robert:** keep it listed for a later workstream, or design it here (it
would touch the reading layer: a player's question that matches an authored slot must not open it before the story
has made it askable).

## The cases as tests

| Case | Setting | Expected |
|---|---|---|
| A deduction scored | Easy, the curry built at ¶37 | nothing about it before ¶218; at ¶218 the note "Holmes reasons here … You had it at paragraph 37: 181 paragraphs before him"; the record lists it |
| A deduction not scored | Easy, passive | at ¶218 no note; the record says "0 of N so far" |
| No confirmation early | Easy, ¶100, ideal player | the record shows only rows whose deadline ≤ ¶99; no count of what is left |
| A check scored | Easy, `ck.mud` sealed at ¶80 | at ¶102 "Holmes does this here … you planned it at paragraph 80"; the result line as today |
| The end | Easy, ideal, ¶231 | totals per family; `scored ≤ possible` everywhere |
| Trivial | the end | no record; the one line |
| `possible` | engine | `noticeScore().possible` 8, `checkScore().possible` 10; every other aggregate unchanged |
| No hint feeds a score | Easy with and without `hints: story` | identical rows (Round 139's test, extended to the record) |
| Reload at the end | Easy, ¶231 | busy panel gone within 10 s; the same clashes as before the reload |
| Theories at the end | Easy | first theory weighed within 3 s; all six as before |
| Two stories | any, `k.one_culprit` doubted | "two stories" in the Why list; `setDoubtReason` saves it |
| Re-read question | Easy, ¶80, re-read ¶20–¶30 with a question | the bar names the question while outlined; listed under Holmes's interest |
| Absence from a card | Easy, ¶34, the dog's card | the form files `c.dog_did_nothing` as the board's does |
| Options | — | the same 14 options under four headings; presets unchanged |
| Unchanged | all | reveal, foreshadow and clash logs, `report.md`, `thoughts-report.md` and the gate listing, except where a step says |

## Order of work (if agreed)

1. **The busy page** (Q3): the clash cache seeded from the log; counts after drawing; Theories theory by theory; the
   loading line. Checked in headless Chrome against the targets. A test: a reloaded game's clashes equal the played
   game's.
2. **Scores in the engine** (Q1): `possible` made consistent; a `record()` that gathers the six families' scored rows
   whose deadline is read (with the card ids each names), for the UI. Tests from the cases.
3. **Scores in the UI** (Q1): the deadline note, the header's "Ahead of Holmes", the record panel, the end summary,
   Trivial's line. Checked in headless Chrome.
4. **`conclude`** (Q2), if (c) is agreed: "State it yourself" on the building bar, the engine's grounding of cited
   rules, a time budget. Else the gap analysis's INFER row is closed as answered by `propose`.
5. **The small items** (Q4, Q5): two stories, the re-read question, absence from a card, the grouped options.
6. **The closing review:** each tag of the gap analysis's §2, playable in the UI or listed with why not.

Each step is one commit with a Round entry, gated on `npm test`; the logs, the reports and the gate listing diffed
before and after.

## For Robert

1. **Q1:** scores shown only as the story reaches each deadline (a note on the reading bar, an "Ahead of Holmes"
   count, a record panel), the totals at the end, never a row early; `possible` counted as rows with a deadline;
   Trivial a single line at the end?
2. **Q2:** `applyRule` retired from the UI plan in favour of `propose`; and a small "State it yourself" (`conclude`
   with the cited rules grounded for the player): build it, or list it?
3. **Q3:** the three fixes to the busy page (seeded clashes, counts after drawing, Theories theory by theory) and the
   loading line?
4. **Q4:** build the re-read question, "two stories" and absence from a card; keep the rest listed?
5. **Q5:** the options grouped under four headings?
6. **Q6:** the board left as it is?
7. **Q7:** the player's own questions: a later workstream, or here?
8. **The order of work** above?

## Agreed (Robert, Round 143)

The recommendations of Q1–Q7 as written, and the order of work:
- **Q2:** `applyRule` leaves the UI plan (`propose` is the player's inference); the small "State it yourself"
  (`conclude`, cited rules grounded for the player, with a time budget) is built as step 4.
- **Q7:** the player's own questions are a design question of their own, kept listed for a later workstream.

**At build time (Rounds 144–148):**
- **The busy page** (Round 144): a reload seeds the clash cache from the saved log; the worker shares a request
  already in flight (two waiting pieces had made the same search twice). Measured on a shared machine, so the
  targets of 10 s and 3 s were for an idle one: a reload at the end about 12 s (HEAD before: 43–97 s), the first theory
  at about 6 s.
- **`possible`** (Round 145): notices 6 → 8, checks 9 → 10; two tests' expectations changed.
- **State it yourself** (Round 147): the rules are applied as the case's inferences apply them (their
  `<inference>#ruleN` constraints), which needs no binding form; 41 of the route's 54 inferences follow from the clues
  alone. A lone card that completes nothing stays connected.
