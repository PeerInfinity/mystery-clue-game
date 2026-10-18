# Hypotheses, scenarios and residue (workstream 6)

Status: **AGREED** (Robert, 2026-10-17, Round 113: every recommendation, and the order of work; where one proves
hard to build, fall back to a simpler alternative). **Built:** step 1, the cost (Round 114); step 2, puzzles and residue (Round 115); step 3, drop with a reason (Round 116); step 4, readings by layer (Round 117). Mission: `docs/kickoff-workstream-6.md`. Builds on `docs/gap-analysis.md`
(§2 HYPOTHESIS, WEIGH, TEST, RESIDUE, DROP, REVISE; §6: supports and strains authored first, computed later; wrong
turns cost nothing), Round 19 (theories), workstream 5 (notices), workstream 3 (exceptions) and the clash paper
(`docs/clashes.md`: the four classes, "never by truth").

## The reader's process

The case can refute: a clash, a defeat, a cross-out. The reader mostly does something else. They hold several
stories at once and weigh them, and most stories lose without being refuted.

**Sets and stories.** The reader holds two sizes of hypothesis.
- **A candidate set on one question:** what is in the paper (`t24.3`), where the horse is (`t14.3`), why the dog was
  quiet (`t34.4`), who in the house drugged the dish (`t37.9`), why the knife (`t81.3`), who Derbyshire is (`t84.4`).
  These are pruned member by member, and the relations address a member: `t24.4` strains "drug" and supports
  "money".
- **A scenario, a whole story of the night:**
  - the police's (`t39.4`, `t46.1`);
  - Straker took the horse out (`t46.4`);
  - Gregory's gypsies (`t62.2`);
  - Silas Brown organised it (`t66.3`);
  - the inside story (`t92.6`).

  A scenario answers several questions at once. It is what the timeline table after s02 holds.

**How a story loses without being refuted.** Five ways, in the annotation:
1. **It needs witnesses to be wrong.** A scenario that goes against testimony is not refuted by it. It takes on a
   cost. The reader gives Hunter's certainty up (`t36.2`), and counts Straker's reputation "a little, and no more"
   (`t19.4`). Gregory's case falls apart item by item, each item someone's word or reading (`t56.1`).
2. **It leaves things unexplained** (residue). The police theory leaves eight items over (`t46.3`): the curry, the
   dog, the key, why take the horse out at all, hiding the most famous horse in England, no alarm, one blow
   against "repeated blows", and the coat off in the rain. The gypsies "explain nothing about the curry or the dog"
   (`t62.4`).
3. **It is held up by patches.** "Gregory meets each objection with a new assumption, not with evidence" (`t58.4`).
4. **It needs more hands.** "The inside story explains the drugging and the night visit with one person, while the
   maid version needs two" (`t92.7`).
5. **It paints an unlikely picture,** a single strain: the maid leading a racehorse over the moor at one in the
   morning (`t37.11`), a search that finds nothing (`t64.2`), a stick against one blow (`t40.5`), a man arming
   himself with an eye-knife (`t81.4`). Genre adds its weak voice (`t39.3`, `t14.4`). It never decides.

**Support without entailment.** The horse is still missing despite the reward (`t37.12`); Brown has motive (`t66.2`);
the tracks go towards Mapleton (`t117.2`); nobody left the hollow with the horse, "consistent, not proof" (`t120.2`).
Two witnesses agree (`t36.3`, corroboration). And the reverse: Simpson's pallor "cuts both ways" (`t40.7`), so it
supports nothing.

**Dropping.** Every wrong turn ends in a DROP that cites its reason.
- `t58.3`: a fact. The paper was money.
- `t62.4`: reasons and residue together.
- `t68.2`: "nothing connects".
- `t92.7`: parsimony.

The reader never drops a story because it is wrong. They drop it because a rival does better.

**Revising.** An old card changes meaning when the reader changes stories:
- the curry matters (`t37.6`);
- the motive (`t84.8`);
- "the savage blow" was a hoof (`t212.3`);
- at ¶226, five cards at once (`t226.2`): the cravat, the knife, the coat, the thigh cut and "assailants".

`t68.3` is the reader's own revision. One culprit gives way at ¶68 because the night has become three stories: who
took the horse out, what killed Straker, and who has the horse. Nothing contradicts one culprit at ¶68.

**Confirming.** From ¶93 on, most thoughts are TESTs. A scenario held early is borne out step by step, and its
parts score as route steps (`t102.2`, `t117.2`, `t212.2`).

## What exists

- **Candidate sets** are slots with domains. The player pencils, circles and crosses out candidates (pencil or
  checked).
- **Theories** (`case.json`, six): `t.police`, `t.gypsies`, `t.honest_trainer`, `t.derbyshire_a_friend`,
  `t.not_my_horse` and `t.self_wound`. Each has an `assignment` over slots, `rests_on` (its holders' inferences),
  `held_by` and the line that tells it. The player can add theories (`addTheory`) and add answers to them.
  `visibleTheories` shows a story theory once its line is read and the cards its answers sit on are held.
- **`checkTheory`:** fits or broken, against everything active (`explainConflict`). It ignores clashes.
  `checkLayer` does the same against the working set (clashes set aside), with pencil marks.
- **The Theories panel** (`toolTheories`) lists each theory's answers, what it rests on, and "agrees with" and
  "goes against" among the player's held inferences, read off a partial evaluation of each formula.
- **The timeline's layers** (`Game.layers`): one per visible theory, with its answers drawn on the board and its
  own pencil marks.
- **Clashes** (Round 109): the `[class, within]` key and its four classes (others' inferences, heuristics,
  statements by how told, the player's and Holmes's inferences); one member set aside, ties all.
- **Notices** (workstream 5): the player marks a card as odd. NOTICE thoughts list `notices` (the cards), and
  `noticeScores` scores them in aggregate by Holmes's paragraph.
- **Raises** (workstream 3): exceptions raised against a step; `raiseScores` has the same shape.
- **Doubt reasons:** `could-not-see`, `inference-as-fact`, `hearsay` and `neutral`. They are recorded and change
  nothing.
- **Thoughts' relations,** all authored and all unplayed: 102 `supports`, 18 `strains`, 10 `revises`,
  5 `undercuts`, 5 `answers`, 4 `drops`, 4 `refutes` and 1 `strained_by`.
- **Missing:** no causal or explains data anywhere in the case (no `causes`, `enables` or `explains` on any
  event). Explains-links would be new data.

## Measured

A scratch script (kept in the session's scratchpad, to become a test) replays the whole story on Easy (background
when relevant) for four players, the clash log's three and a builder:
- **passive** builds nothing;
- **police** also doubts Holmes's curry step;
- **culprit** builds `k.one_culprit`;
- **builder** builds everything it can.

It follows twelve hypotheses: the four story theories that bear on the night; the thought-only scenarios as
provisional assignments (`t46.4` Straker took the horse; `t66.3` Brown organised it; `t92.6` the inside story, with
ten answers); the candidates paper-as-drug, the maid, Mapleton and the horse killed him; and one culprit as a formula.

### 1. Fit is the wrong instrument

Today's check says "broken" whenever a scenario contradicts anything trusted. Every rival story contradicts some
trusted statement almost at once, so the check says nothing useful for most of the story.

| Hypothesis | Broken from | By (the conflict found first) | Until |
|---|---|---|---|
| inside story (true) | ¶84 (passive, police, culprit, builder) | ✗Straker's honest record | ¶225 (passive, culprit); **never** (police, builder) |
| Straker took the horse (true) | ¶37 (passive) / ¶40 (builder) | ✗Hunter's charge (passive); ✗the honest record (builder) | ¶104 (passive); **never** (builder) |
| police | ¶36 | ✗the hope of early exercise | never |
| paper as drug | ¶40 | Simpson came for information (true) | never |
| maid | ¶40 | Simpson's admission, ✗Hunter's charge | never |

A **false** statement is what breaks the true story. The reader's answer is `t19.4`'s: a reputation "counts a
little, and no more". A scenario that says a witness is wrong is not refuted; it pays for it.

### 2. Cost: a clash weighing with the scenario held fast

A prototype adds the scenario's answers as fixed, then breaks the clashes the way `Game.clashes` does (lightest
class first, one member, ties all) until what is left is consistent. What it sets aside is the scenario's
**cost**: what it must disbelieve. A selection, passive player (✗ marks a false card):

| ¶ | Inside story | Police | Gypsies | Maid |
|---|---|---|---|---|
| 46 | — | 2: Simpson came for information (testimony), ✗the hope of exercise | — | 2: ✗Hunter's charge, ✗the police's "Simpson drugged" |
| 92 | **9**, all false: the honest record, Hunter's charge, "anxious", the hope of exercise, "poor weapon", "a friend", three police steps | 2 (as at ¶46) | 2 | 2 |
| 104 | 5, all false | 2: **Holmes's dish step** (own inference), Simpson came for information | 2: the dish step, Simpson came for information | 1: the dish step |
| 146 | 4, all false | 2 | **7**: five own inferences, the double track's end (seen), Simpson | 1 |
| 220 | 1, ✗"a friend" | **4**: two own inferences, two true statements | 9 | 1 |
| 231 | **0** | 4 | 9 | 1 |

For the builder, the inside story costs 5 at ¶92 and 4 from ¶104 to the end. Every one is false: the honest record,
"anxious", the hope of exercise, "poor weapon", and the heuristic one culprit at ¶92. Gregory's gypsies cost 7 at
¶62 and 13 by ¶220. The cost falls for the true story and grows for the false ones. Its *class* says what kind of
loss it is:
- statements only: a scenario that needs witnesses wrong (the inside story throughout);
- the player's or Holmes's own inferences, or something seen: a scenario at odds with the player's own reasoning
  (police from ¶104 for a passive player, the gypsies at ¶62 for a builder). That is as near "refuted" as the
  player's own hand can say, never by truth.

Two oddities:
- Builder's `t.honest_trainer` is free throughout, and so is the maid. The ¶40 tie (`docs/clashes.md`, "Left open")
  sets Holmes's dish step aside with the police step the builder built. The tie spreads; this is the known case.
- Time: 0.1–3.4 s per scenario at ¶220 after the first clash computation (11 s). A cost must be computed on
  demand, cached, and behind the busy indicator.

### 3. The authored relations are mostly unplayable

Of the 18 `strains`, 10 come from a thought that maps to no card: `t58.4`, `t40.5`, `t37.11`, `t64.2`, `t46.3`,
`t39.3`, `t14.4`, `t111.2`, `t214.2` and `t24.4`. Of the 4 `drops`:
- `t68.2` and `t92.7` have no card;
- `t58.3` maps to a slot;
- only `t62.4` has an inference, which a passive player holds at ¶114 and a builder at ¶62.

So the authored relations can be checked against but not played. Round 37's "computed later" has to come from
something new.

### 4. "Agrees with" and "goes against" in the Theories panel

The panel's "agrees with" is read off a partial evaluation, and an implication with an unbound antecedent comes out
true. In the first replay the police theory "agreed with" `k.operation_in_the_open` and `k.knife_for_an_operation`,
which the inside story rests on. Done properly (agrees: the inference alone entails one of the answers; goes
against: it contradicts them), the counts are small but right. They are also mostly about provenance: the inside
story's "against" are the police's false steps. This is a bug to fix whatever is decided.

### 5. Residue needs its own data

The cost says what a story contradicts, not what it leaves unexplained. At ¶46 the police cost 2 and the inside
story nothing yet (its slots are not all on the table). `t46.3`'s eight items appear nowhere. The noticed cards of
workstream 5 come close to that list:
- `c.curry_for_supper` (`t20.4`);
- `c.coat_on_bush_seen` (`t35.8`);
- `c.simpson_stick` with `c.head_shattered` (`t40.5`);
- `c.pocket_inventory`, the candle (`t78.3`);
- the knife (`t81.2`);
- the bill (`t84.3`);
- `e.horse_led_out` (`t18.3`);
- the dog (`c.dog_did_nothing`, `t34.2`);
- no alarm (`c.no_alarm`, `t34.8`).

The missing three are the key (`k.later_entry_needs_key`), the hiding of a famous horse (`t37.12`) and the found
knife's blood (`t35.7`).

### 6. One culprit at ¶68

For every player it costs nothing at ¶68. It first costs something at ¶102 (builder), ¶104 (passive), ¶182 (police)
or ¶202 (culprit). `t68.3` is not a computable loss at ¶68. It is a stance the reader takes on residue: the taker is
inside, the killer is open, and the horse is perhaps at Mapleton.

## Questions, alternatives, recommendations

### Q1. What is a hypothesis in the game?

- **(a) A theory only.** Every hypothesis, even "the maid drugged it", is a theory with an assignment.
- **(b) A thought as a card.** HYPOTHESIS thoughts become cards the player holds and drops. This mixes the reader
  layer into the case, which Round 37 kept apart.
- **(c) Two sizes, as the reader has them (recommended).**
  - A **candidate set** stays a slot, pruned with the pencil and the cross-out. The paper, the maid, the dog's
    reason, Derbyshire.
  - A **scenario** is a theory: the story's and the player's.

  The thought-only scenarios (`t46.4` Straker took the horse, `t66.3` Brown organised it, `t92.6` the inside story)
  **stay the player's to make.** No character tells any of them, so showing one as a story theory would give steps
  away (Rounds 89, 95, 104). The annotation review's C13 (`t.inside_story` as an authored theory) is answered no.
  The three become test fixtures (provisional assignments in the tests), not case data. The story's theories stay
  the six.

**Status, and who sets it.**
- **(a) The game computes it** (live, strained, refuted, confirmed). Confirmed would read the answer key.
- **(b) The player sets it.**
- **(c) Both, split (recommended):**
  - the player sets the **stance**: live, the default, or dropped, with a reason (Q5), reversible;
  - the game shows the **standing** from what the player holds: the cost and its classes (Q2), the residue (Q3),
    and "at odds with your own reasoning" when the cost reaches the player's own inferences or something seen.

  Nothing is ever called confirmed or wrong (never by truth).

### Q2. What does checking a scenario return?

- **(a) Fit or broken, as now.** Measured (§1): useless for most of the story, and it calls the true story broken by
  false testimony.
- **(b) The cost (recommended):** the clash weighing with the scenario held fast (§2). Each item is shown with its
  class:
  - "It needs these to be wrong: Hunter's charge (a witness's word), Straker's record (a report)";
  - "It goes against your own reasoning: Holmes's dish step"; and
  - "It goes against what was seen: the double track's end".

  It reuses `#clashWeight` and the search order, and it is cached per theory and per working set. It replaces fit
  in the Theories panel and in `checkLayer`'s verdict.
- **(c) A count only.** This hides why, and the why is what the reader uses (`t56.1`).

Corroboration (`t36.3`) and "cuts both ways" (`t40.7`) belong here as refinements, not now. Corroboration would be
a within-class key for statements attested by two independent witnesses. Today no case turns on it: the cravat
identification is never set aside. Listed, not built.

### Q3. Explains-links and residue

- **(a) Authored per scenario:** each theory lists what it leaves unexplained. Only authored scenarios get residue,
  and the player's own scenarios get none.
- **(b) Authored per oddity (recommended).** A **puzzle** is an oddity with the explanations it admits, each a
  formula over slots. Examples:
  - the curry: "the drugger knew the menu" (the drugger is among those who choose or know the menu);
  - the dog: "the dog knew the visitor" (`e.horse_led_out.agent` is one of the dog's own);
  - the coat: "taken off to work" (`e.coat_off.purpose` = work);
  - one blow: "a single blow from something heavy" (the instrument is not the stick);
  - the knife: "for an operation";
  - the bill: "his own, under another name";
  - why take the horse out: "to do it harm away from the stable";
  - no alarm: "the man who went out took the horse";
  - the key: "the taker had a key";
  - hiding the horse: "hidden at a stable, disguised".

  A scenario **explains** a puzzle when its answers, with what the player trusts, entail one of the explanations.
  Its **residue** is the puzzles the player has met that it does not explain. This works for the player's own
  scenarios too, and an item comes out of the tray by adding an answer that explains it. That is the reader's
  "patch" (`t58.4`), and the tray shows that the answer rests on nothing held.
  - Where puzzles live: a new `puzzles` list in `knowledge.json` (one per line), each with:
    - its cards (the noticed ones);
    - the NOTICE or ABSENCE thought;
    - its explanations (label, quote where the story names it, formula);
    - "coincidence" as the explanation with no formula, which never takes an item out of the tray.

    Every label is card text and goes through the leak checker.
  - When a puzzle is "met": Easy, once its cards are held and its thought's paragraph is read; Medium and Hard, once
    the player has noticed one of its cards (workstream 5's action). Noticing gains a use.
- **(c) Causal links on events,** with residue derived (the redesign's full model). This is far larger, and the
  explanations would still be authored as formulas underneath. Not now.

Round 37's "computed later from explains-links" becomes: the authored strains and supports stay as the spec, and the
tests check that the computed residue reproduces them:
- the police's eight (`t46.3`);
- the gypsies explain neither the curry nor the dog (`t62.4`);
- Brown the organiser leaves the curry and the dog (`t68.2`).

### Q4. What graded support and strain do in play

- **(a) Show, score nothing, gate nothing (recommended for strain).** The cost and the residue are shown (Q8 says
  how much on each preset). The pace never waits on them.
- **(b) Weigh in clashes.** The clash paper left two hooks: a reservation weighing less, and a "strained step".
  Strain as measured here belongs to a *scenario*, not to a step. A step has no residue. **Recommended: neither
  hook now.** The tuple stays as built, and the reservation keeps its weight (Round 108).
- **(c) Gate.** A drop or a residue count holding the pace. Against Round 101's "never holds the pace".

### Q5. DROP, for reasons that are not logical

The player drops a scenario (a new action) or a candidate (the cross-out already does it) and gives a reason.
- **(a) A free stance:** dropped, no reason, nothing checked.
- **(b) A reason the game checks where it can (recommended).** Reasons:
  - **out-explained by** another scenario: checked by residue, the rival's tray is a strict part of this one's. This
    is `t62.4` and `t68.2`;
  - **needs more hands:** the scenario's answers name more distinct agents for the night's acts than the rival's.
    This is `t92.7`. Counted over the agent answers both scenarios give;
  - **costs too much:** the cost's items are listed, and nothing more is checked;
  - **a card:** a cited card or step (`t58.3` cites the ten-pound note).

  A check that fails is reported ("the inside story leaves the cravat over too") and the drop still stands. A drop
  is a stance, never refused, and reversible. Wrong turns cost nothing.
- **(c) The game drops what is at odds with the player's own reasoning.** Against "the player decides", and it hides
  the move the reader makes.

**`t68.3` (one culprit).** Recommended: the player doubts `k.one_culprit` with a new doubt reason, **"two stories"**
(the night is several stories; exception "two hands acted apart"). That is a defeat on the player's own judgement,
as Q2 of `docs/defeasibility.md` allows. The game checks nothing at ¶68, because nothing is checkable there (§6).
`t68.3` maps to the doubt, and its `no_inference: workstream-6` goes.

### Q6. REVISE: switching readings

- **(a) Readings by layer (recommended).** A few slots carry what an old card *means*:
  - `k.cravat_order` (torn from an assailant, or picked up);
  - `e.coat_off.purpose`;
  - `e.knife_taken.purpose`;
  - `e.thigh_cut.instrument`;
  - `e.fatal_blow.agent` (the "assailants");
  - `william_derbyshire.identity`.

  Each is linked (authored, `reinterprets`) to the held cards it changes, and the card shows its reading under the
  current layer: "Under the police theory: torn from Simpson in the struggle. Under your theory: picked up."
  Switching layers *is* switching readings. When the player settles one of these slots, or adds it to a theory,
  the game lists the cards whose reading changed: the REVISE moment. `t226.2` is then, for a player who got there
  first, a series of confirmations, and for one who did not, a reveal (the annotation's "both ways").
- **(b) Named readings on claims,** generalising `truth_slot`. A bigger change to the claims format, for the same
  effect.
- **(c) Only text,** a reveal at ¶226. Nothing for the player to do.

### Q7. Scoring

In the shape of `noticeScores` and `raiseScores`, nothing in Trivial, wrong turns cost nothing.
- **(a) Drops before the story refutes (recommended).** A DROP thought (`drops`) scores when the player dropped
  its target before the paragraph where the story itself makes it untenable. That paragraph comes from Holmes's date
  where he has one (`t62.4`: ¶114). Three of the four drops have none (`t58.3`, `t68.2` and `t92.7` are "Holmes
  never"). Recommended for those: the first paragraph at which a passive player's cost for it reaches the player's
  own reasoning (measured: the maid ¶104, the paper ¶104). It is computed once by the validator and written to
  the report, like the gates.
- **(b) Residue items found before Holmes's objections** (`t57.1`). This is already counted by notices, so no.
- **(c) Holding the right scenario.** Already counted by its parts (the route steps).

`t68.3` scores nothing (Holmes never says it), as `t4.2` scores nothing.

### Q8. The difficulty presets

- **Trivial:** nothing new.
- **Easy:** the Theories panel and the board's layer show the cost with its classes and the residue by name, and
  each drop's check.
- **Medium:** counts only ("needs 4 things wrong, leaves 3 unexplained"), and the drop's check as yes or no.
- **Hard:** nothing shown. "Weigh it" on request gives the counts (like "Could it fit?").

The alternative is Easy only (as with clashes). Recommended as above: residue is the reader's tool at every level,
and Medium already shows "Could it fit?".

## The cases as tests

| Case | Player | Expected |
|---|---|---|
| The inside story's cost (Q2) | passive | ¶92: 9 items, all statements or others' inferences; ¶231: 0 |
| The police's cost reaches own reasoning | passive | from ¶104 (Holmes's dish step), with Simpson's statement |
| The gypsies at odds with own reasoning | builder | from ¶62 |
| No true card in the inside story's cost | passive, builder | every item false |
| The police residue (`t46.3`) | Easy, at ¶46 | the curry, the dog, the key, why take him out, no alarm, one blow, the coat (the eight, as far as met) |
| The gypsies explain neither the curry nor the dog (`t62.4`) | Easy, ¶62 | both in the gypsies' residue |
| Out-explained (`t68.2`) | a player scenario "Brown organised it" | its residue strictly contains the inside story's |
| Needs more hands (`t92.7`) | "the maid drugged, Straker took him" against the inside story | 2 hands against 1 |
| A patch (`t58.4`) | the police scenario plus "had a duplicate key" | the key leaves the tray; the tray marks the answer as resting on nothing held |
| Readings by layer (`t226.2`) | the inside story's layer | the cravat, the coat, the knife, the thigh cut and the blow read differently from the police's |
| One culprit, doubted "two stories" at ¶68 (`t68.3`) | culprit | recorded; no clash met later from it |
| The drop scores | maid dropped at ¶92 | scores (before ¶104) |
| The Theories panel's agree / against | Easy | no vacuous "agrees" (§4) |
| Unchanged | all | clash log, reveal and foreshadow logs, gate listing |

## Order of work (if agreed)

1. **The cost** (engine): `Game.scenarioCost(theory)`, cached, with the busy indicator, replacing fit in the Theories
   panel and `checkLayer`. The agree/against fix (§4). Tests from the measuring script (the cost rows). No card text
   changes.
2. **Puzzles and residue** (data and engine): `puzzles` in `knowledge.json` with explanations; `Game.residue`; the
   residue in the panel and on the layer. Leak-checked labels. Thoughts `t46.3`, `t62.4` and `t68.2` map to them.
3. **Drop with a reason** (engine and UI): scenarios and candidates; the four reasons and their checks; the drop
   scores; the "two stories" doubt reason and `t68.3`; `t92.7` and `t58.3` mapped.
4. **Readings by layer** (data and UI): `reinterprets` on the meaning slots; the card's reading per layer; the
   REVISE list on settling. `t226.2` and `t212.3` mapped.
5. **Presets** (Q8), checked in headless Chrome.
6. Then **the second review** of the tags workstreams 3 and 6 make modelable.

Each step is one commit with a Round entry, gated on `npm test`, with the logs, reports and gates diffed.

## For Robert

1. **Q1:** two sizes (slots for candidate sets, theories for scenarios); the annotation's three scenarios kept as
   test fixtures, not story theories; stance set by the player, standing shown by the game, nothing ever called
   confirmed?
2. **Q2:** a scenario's check is its cost (the clash weighing with the scenario held fast), shown by class, in place
   of fit?
3. **Q3:** residue from authored puzzles (oddities with their explanations as formulas), met by noticing on Medium
   and Hard?
4. **Q4:** strain is shown, scores nothing, gates nothing; the clash tuple unchanged?
5. **Q5:** drop with a reason the game checks where it can (out-explained, more hands, cost, a card), never
   refused; `t68.3` as a "two stories" doubt of `k.one_culprit`?
6. **Q6:** readings by layer through the meaning slots?
7. **Q7:** drops score before the story makes them untenable (Holmes's date, or the passive player's cost)?
8. **Q8:** Easy names, Medium counts, Hard on request?
9. **The order of work** above?

## Agreed (Robert, Round 113)

The recommendations of Q1–Q8 as written, and the order of work. Robert: "If we encounter problems with
implementation, then we can fall back to simpler options." A fallback taken at build time is recorded in its Round
entry and here.

**At build time (Round 115):**
- **Residue is read against the facts, not everything trusted.** Q3 said "its answers, with what the player trusts".
  Built that way, every consistent story borrowed the explanations Holmes states, and by ¶231 the police theory
  "explained" the curry, the dog and the key (nothing stops Simpson having known the menu). A story now explains an
  oddity by its answers and the facts left once its cost is paid: trusted clues and world ties, not inferences.
- **Ids are `pz.*`,** since propositions use `p.*`.
- **Listed, not chased:**
  - why the horse was taken out at all: the police and the gypsies explain it by theft, where `t46.3` counts the
    theft itself improbable;
  - partial theories (the honest trainer, the self-wound) leave nearly every puzzle over, which is right but noisy;
  - the candle (`t78.3`) has no puzzle: no slot says what the light was for.

**At build time (Round 116):**
- **A candidate is dropped against a rival as the rival's story with the candidate in its place** ("the maid version"
  is the player's inside story with the maid drugging). Without a rival a candidate stands alone (its slot = value).
- **`t68.3`** names the doubt (`dropped: {inference: "k.one_culprit", reason: "two-stories"}`, `no_inference: doubt`).
  It is not scored: Holmes never says it.
- **Deadlines:** the three drops Holmes never makes carry `dropped.deadline`. A test checks the two that a passive
  player's cost can date (the maid and the paper, ¶104). `t68.2` (Brown as organiser) names no game target: Brown's
  story is the player's own.
- **A bug found and fixed:** two theories added in the same millisecond got the same id.

**At build time (Round 117):** readings are authored as `readings` in `knowledge.json` (`rd.*`: a slot and the cards it
re-reads), not as `reinterprets` on the slots, so that `t226.2` and `t212.3` can map to them. The cravat's reading
is who picked it up (`e.cravat_picked_up.agent`); the police theory does not answer it, so the card shows only the
player's own story there.
