# Defeasibility (workstream 3)

Status: **AGREED** (Robert, 2026-10-17, Round 101: the recommendations of Q1–Q5 and Q7, and the order of work; Q6 deferred as a whole). **Built:** step 1, exceptions and the raise action (Round 102); step 2, exceptions shown (Round 103); step 3, the police's four and slice 4 (Round 104); step 4, thoughts and scoring (Round 105); step 5, the UI (Round 106). Mission: `docs/kickoff-workstream-3.md`. Builds on the
rule library (default rules with `strength` and `unless`), belief and the doubt readings (workstream 4, Rounds
86–91), expectations as default rules (workstream 5, Round 82), and the review's "ws 3" rows
(`docs/annotation-review.md`, Round 93).

## The reader's process

A careful reader reasons from defaults: a guard dog barks at strangers; whoever drugs a guard means to take what
he guards; a witness who is sure has it right. Each default has exceptions, and the reader does four things with
them.

- **Raise an exception against one use of a default, and keep the conclusion.** "For they are both sound
  sleepers" (¶34): the dog might have barked unheard. The reader still concludes the visitor was someone the dog
  knew, but more loosely (`t34.3`: "weakens `t34.2` without defeating it"). Holmes reads it the same way at ¶219:
  "not barked enough to arouse". Whoever drugged the guard took the horse, unless "the drugger had an accomplice"
  (`t37.16`). Holmes himself asks "which of them, then, had access to that dish?" (¶218) and never answers.
  The default stands, and the exception stays open.
- **Show that the exception holds, and stop using the step.** Hunter "was equally certain" the stranger drugged
  his supper at the window (¶36). But he could not have seen it: had he seen it, he would not have eaten
  (`t36.2`). His certainty stops counting as evidence. It is not shown false (that comes at ¶218), only
  unsupported. The gypsies left on Tuesday (¶62), but under the period belief they would have left either way, so
  their leaving points at nothing (`t62.3`).
- **Hold a default without noticing it, and lose it later.** One culprit for both crimes (`t4.2`, from
  `bk.one_culprit`), held from ¶4 and broken at ¶68, when the night comes apart into three stories (`t68.3`).
- **Take apart someone else's reasoning, item by item.** Gregory's case (`t56.1`, ¶56). The poisoning is
  Hunter's conclusion. "Out in the storm" fixes no hour. The stick fits a weapon but not one blow. The cravat is
  real, but how it got there is open. This is how the police's four false inferences fall: by undercut here,
  by strain and residue later (workstream 6), and by refutation at the end.

So the reader has three moves an exception can make: a **reservation** (the step stands, weakened), a **defeat**
(the step stops counting, its conclusion not shown false) and, as today, a **refutation** (the conclusion
contradicts what is known).

## What exists

- **Rules:** 111. 65 are `default`, 8 `hard`, 2 `heuristic`, 36 unmarked. 67 carry `unless`, 71 entries in all,
  plain strings. **`unless` is never shown and never checked:** the engine and the UI do not read it, and the leak
  checker does not see it. `strength` is checked against a list and used nowhere.
- **Rule applications:** 97 in the case's inferences, 81 of them of defaults. Each is a constraint `k.X#ruleN`,
  active with its inference and set aside when the inference is doubted (`doubt_with`). There is no way to set
  aside one application, or to say why.
- **Doubt:** plain (the clue or inference counts nowhere, "Is it true?" or "Does it hold?" opens); for a
  statement, mistaken or lying, per speaker along a chain (Rounds 87–89). A recorded reason (`DOUBT_REASONS`,
  Round 90): `could-not-see`, `inference-as-fact`, `hearsay`, `neutral`, with no logic.
- **Clashes** set aside the lowest weight in a minimal clash: story clues, then inferences someone else stated,
  then the player's and Holmes's.
- **The police's four** (`k.police_simpson_drugged`, `k.police_simpson_took_horse`, `k.police_stick_killed`,
  `k.gregory_gypsies`): `truth: false`, `by` police or Gregory, no rules, so **asserted** without a reason. They are
  dealt where the story states them (¶40, ¶46, ¶62), and the player trusts them like any stated inference until
  a clash sets them aside or the player doubts them. The theories `t.police` and `t.gypsies` rest on them.
- **Slice 4, the report gate** (`docs/kickoff-0.3-migration.md`): "0 asserted, or each remaining one carries
  `asserted: "<why>"`; then make an unexplained one an error". Today 11 are asserted: 7 with a reason, and the
  police's four without one. Round 33 ruled that no temporary reason be added to them.
- **`k.drugger_took_the_horse`** (`r.drugged_guard`, the default of `t37.16`) is in the needs of Holmes's steps
  at ¶104, ¶111, ¶170, ¶220 (twice), ¶221 and ¶228. Anything that makes it count nowhere would hold the 'wait'
  pace at those paragraphs.
- **Thoughts:** five `undercuts` relations (`t34.3` → `t34.2`, `t36.2` → `t36.1` (drugged) and `t29.3`, `t62.3` →
  `t62.2`, `t64.3` → `t64.2`). Three thoughts are `no_inference: workstream-3` (`t4.2`, `t62.3`, `t68.3`).

## Questions, alternatives, recommendations

### Q1. What is an exception?

- **(a) A named entry in the rule's `unless` (recommended).** An entry becomes an object:
  `{id, text, source?, formula?}`. A plain string stays valid as text with no logic.
  - `source` is the story line that speaks of it (sound sleepers, ¶34; "which of them had access", ¶218), and it
    dates the exception.
  - `formula` is over the rule's own variables, so it is grounded with each application's bind. It is given only
    where the case's questions can say it.
  - The exception belongs to its rule, as the expectation of workstream 5 is a rule. It is played against one
    application, the way mistaken and lying are readings of one statement.
- **(b) Exceptions as cards of their own** (a new section, dealt at their quotes). This is clearer as a thing in
  the hand. But it is a second vocabulary beside the rules, and most of the 71 entries have no line in the story
  to deal them by.
- **(c) Only the doubt reasons, given logic.** "Could not have seen it" and the rest become general reasons for
  doubting anything. That covers `t36.2` and `t35.6`, but not the dog, the accomplice or the gypsies, which are
  exceptions of particular rules.

**When does an exception show?** It is new card text, so the reading layer applies.
- **(i) Show every exception with its rule, after a leak check (recommended).** An exception with a `source`
  shows from that line. Without one, it shows with the rule (its `relevant_from`), unless the checker flags it.
  A flagged one waits for a story line or stays hidden. Some will lean: "someone inside let him in"
  (`r.locked_door_needs_key`), "the drugger had an accomplice". This is a step of its own, diffed in the logs.
- **(ii) Show only the exceptions this workstream gives ids.** Smaller, but a player cannot raise the others.
- **(iii) Show none.** Exceptions are played from a menu of reasons, and nothing new is shown on a card. Safe,
  but the player cannot see what a default allows for.

### Q2. What does playing one do?

The player raises exception E against application N of rule R in inference K (`Game.raise(K, N, E)`). The
engine checks E against what the player holds, as the clash and conclusion checks do. The **outcome depends on
E's status**, as in default logic: a default holds unless its exception is shown.

- **(a) Three outcomes by status (recommended):**
  - **ruled out:** what the player holds contradicts E's formula. The game says by what ("he had not barked
    enough to arouse", ¶219). Nothing changes.
  - **open:** E is consistent with what the player holds but not shown, or it has no formula. This is a
    **reservation**: K still counts. It is marked "unless…" on the card and recorded with the paragraph. It never
    holds the pace. The dog, the accomplice and the cravat's history are reservations.
  - **established:** the cited or held cards entail E. This is a **defeat**: K counts nowhere (as a plain doubt
    does, with its truth open), and the reason is the exception, shown and saved. Inferences the player holds that
    rest on K are marked as resting on a defeated step. They are not removed. Hunter's charge and the gypsies'
    departure are defeats.

  The player can still doubt K outright (the plain doubt, as now) with E as the reason. That is a defeat on
  their own judgement, recorded as such.
- **(b) Always suspend:** raising any exception sets the application aside, and K counts nowhere. This is
  simple, and it is the kickoff's "suspend one application". But it makes "unless an accomplice" stop the curry
  chain at seven gates, which is not what the reader does (`t37.16` is strong and typical) or what Holmes does.
- **(c) Defeat the rule everywhere:** a played exception switches the rule off in every application. Too strong:
  "barked unheard" on Monday night says nothing about another dog.

Under (a), defeating a **true** inference needs an exception the true story bears out, so it cannot happen by
the case's own logic. A player who doubts one on their own judgement is where they are today.

### Q3. The police's four, and slice 4

- **(a) Give each its reasoning: police defaults whose exceptions hold (recommended).** Each false inference gets
  `rules` like any other. An application that is wrong in the true story says which exception defeats it:
  `{rule, bind, defeated_by: "<exception id>"}`.
  - **Verification** checks the conclusion from the premises with every application in force. The report says
    "verified as the police's (Gregory's) reasoning".
  - **The case's reading** uses the exception's formula instead of the application. The validator checks that
    the formula holds in the answer key. This is what Round 33 asked for, and what the open item in
    `docs/format-0.3.md` could not do ("the true solution violates `k.police_stick_killed#rule1`").
  - **The player** meets them as today (dealt where stated, trusted until doubted) and defeats them by
    establishing the exception. A clash still refutes them later, as now.
  - **Slice 4 lands:** with the four verified, the 7 remaining asserted inferences all carry reasons, and the
    validator then makes an unexplained `asserted` an error.
- **(b) Give them `asserted: "<why>"`** ("a character's reasoning, not derived") and close slice 4 at once. Cheap,
  but it is the temporary reason Round 33 ruled out, and nothing becomes playable.
- **(c) Retire them as cards,** keeping only the theories. The story's statements of the police reasoning lose
  their cards, and `t36.2`, `t56.1` and `t62.3` lose their targets.

The proposed rules for (a) are in the data section below. Two of them are general defaults the reader also
holds (`r.drugged_guard` in the police's hands; a witness who is sure has it right), which is the point of
`t56.1`: the police's steps are ordinary steps, wrong on one exception each.

### Q4. Which recorded doubt reasons get logic?

- **(a) "Could not have seen it" gets logic; the other three stay recorded (recommended).**
  - **could-not-see** becomes the exception of a new default, `r.witness_saw_it`: "A witness who is sure of what
    he saw has it right", unless "he could not have seen it". Its formula is over a perception proposition. For
    Hunter, `p.hunter_saw_the_dosing` (false) is entailed by `c.hunter_ate_drugged` and a rule, "a man who saw
    his food drugged would not eat it" (from Holmes's "the eater would undoubtedly detect it, and would probably
    eat no more", ¶218, relevant from ¶36). The player's "could not have seen it" on Hunter's charge is then
    checked: established, it defeats the police's use of it in `k.police_simpson_drugged`.
  - **inference-as-fact** stays recorded. The parts of Round 88 already re-file the papers' struggle as the
    police's reading, and those parts assert nothing in slot terms, so there is nothing for logic to remove.
    `t32.4` (the narrator's gloss) has no content either.
  - **hearsay** stays recorded: chains (Round 89) carry its logic, a doubt per link.
  - **neutral** ("cuts both ways", `t40.7`) is graded support, workstream 6.
- **(b) Give all four logic,** as exceptions of one general testimony default with no formulas. Uniform, but
  three of them would be reservations that check nothing.
- **(c) None.** Then `t36.2` stays a recorded reason, and the police's first inference has nothing to defeat it.

### Q5. Scoring

- **(a) Score a reservation or defeat made before Holmes's paragraph, in aggregate (recommended),** as notices
  are scored (Round 84). An undercutting thought gains `undercuts: [{target, exception}]`, the plays that count
  for it, and is scored against its first Holmes paragraph:
  - `t36.2`, ¶218 (Simpson eliminated);
  - `t62.3`, ¶114;
  - `t34.3`, ¶219, where Holmes answers the sound sleepers (today `t34.3` has no Holmes date; `t219.1` gives it).

  Reported as "you saw through three of the four steps Holmes took apart". A play that leads nowhere costs
  nothing. Nothing gates on an undercut.
- **(b) Not yet:** record the plays and score them with graded support (workstream 6).
- **(c) As route steps** (Holmes's steps that gate the pace). No: the reader is never made to wait for a defeat.

The accomplice (`t37.16`'s exception) cannot score, because Holmes never takes it up. It is recorded as "left
open", as the story leaves it.

### Q6. One culprit for both crimes (`t4.2`, `t68.3`)

The default is the reader's, not the case's. It is false in the true story: Straker took the horse, and the
horse killed him. If the player applied it as a rule, it would clash late, and a clash sets aside the story
clues before a player's own card. That is the wrong way round, and it is not this workstream's to change.

- **(a) A rule card with no formula (recommended):** `r.one_culprit`, "Two crimes at one place and hour share a
  culprit", unless "one caused the other" or "two hands acted apart". It is shown from ¶4 (after a leak check of
  its exceptions), and `t4.2` maps it. It cannot be applied, so it cannot clash. `t68.3` (the break, a REVISE)
  waits for workstream 6, its `no_inference` changed to say so.
- **(b) A default with a formula, as other rules have.** That needs the clash order changed for applied
  defaults (a default yields before a clue). It is a real question, but a larger one.
- **(c) Leave both for workstream 6.**

### Q7. The accomplice (`t37.16`, Round 93)

- **(a) An exception with a source and a formula (recommended):** `r.drugged_guard`'s "the drugger had an
  accomplice" gets an id, `source` ¶218 ("Which of them, then, had access to that dish without the maid seeing
  them?") and the formula `?dosing.agent ≠ ?taking.agent`. Before ¶218 it does not show. Nothing in the story
  establishes or rules it out, so it is always a reservation:
  - the case keeps Straker by the default, as ruled;
  - a player who raises it sees "unless…" on `k.drugger_took_the_horse` and on Holmes's ¶220 step, with no
    pace held;
  - the case report lists `e.opium_added.agent` as "answered by a default; its exception left open".
- **(b) Without a source,** shown with the rule from ¶37. That is earlier, but it leans: it points at a second
  person in the house before the story does.

## The data each thought would take

| Thought | Data | Result |
|---|---|---|
| `t34.3` | `r.dog_barks_at_strangers`'s "the dog did bark and nobody heard" gets an id and `source` ("for they are both sound sleepers", ¶34). No formula: there is no barking question, and "not barked enough to arouse" (¶219) answers it as a reading, not as a fact. `undercuts: [{target: k.dog_knew_the_visitor, exception: …}]`; Holmes ¶219. | Held: a reservation, scored before ¶219. |
| `t36.2` | `r.witness_saw_it` (default; could-not-see with a formula); `p.hunter_saw_the_dosing` (false); `r.saw_drug_would_not_eat` (default, from ¶218, relevant from ¶36); an inference `k.hunter_could_not_see` (verified). `k.police_simpson_drugged` applies `r.witness_saw_it` to Hunter's charge, bound in the rule (a false claim must not be a premise, Round 87), `defeated_by` could-not-see. `t36.2` maps the inference and `undercuts` the police inference. | Held: a defeat, scored before ¶218. Hunter's "mistaken" reading is unchanged. |
| `t29.3` | Nothing. `k.window_drugging_time` is Gregory's asserted conditional, with a reason, and no rule. `t36.2`'s `undercuts` relation to it stays as annotation. | Given a reason. |
| `t62.3` | A Gregory default `r.flight_shows_guilt`: "people who leave the place soon after a crime nearby had a hand in it", unless "they would have gone anyway". That exception's source is Holmes's "These people always clear out when they hear of trouble" (¶114). It is relevant from ¶62 as a period belief, flagged `stereotype`, beside `r.gypsies_avoid_trouble`. Its formula is over a proposition `p.gypsies_leave_on_trouble` (true), given by the period rule. `k.gregory_gypsies` applies it, `defeated_by` that exception. `t62.3` loses `no_inference` and maps the exception's inference. | Held: a defeat, scored before ¶114. |
| `t64.3` | Nothing. The case already holds the reader's corrected default (`r.searched_and_not_found`: searchers know a horse by his markings) and its use, `k.disguised_to_survive_search`. The naive default it undercuts was never a rule. | Held as it is; the reason recorded in the review. |
| `t35.6` | Nothing. The parts (Round 88) are the re-filing; they assert nothing. | Held (ws 4); inference-as-fact stays recorded. |
| `t56.1` | Maps the defeats of the police inferences it names: could-not-see (the poisoning) and the stick's exception (below). "Out in the storm" (`t40.6`): no police inference rests on it, so there is nothing to undercut. The cravat's "how it got there" is the exception of the clutch rule (below). | Partial: two of four items are defeats. "One blow, not repeated" is a strain (ws 6). |
| `t40.6` | Nothing more (mapped in Round 94). | Held as a WEIGH; nothing to undercut. |
| `t4.2` | `r.one_culprit` (no formula, Q6); maps it; `no_inference` dropped. | Held as a default the reader holds. |
| `t68.3` | `no_inference: workstream-6` (a new value: the REVISE that breaks `t4.2`). | Deferred, with its reason. |
| `t37.16` | The accomplice exception (Q7). The text of `t92.8`, `t218.3` and `t220.3` names it. | Held: a reservation, never scored. |
| `t32.4` | Nothing (review C5, "leave until ws 3"): a gloss with no content, inference-as-fact recorded. | Left, with that reason. |

**The police's four** (Q3 (a)). The rules are sketched; the exact schemas follow at build time.
- **`k.police_simpson_drugged`** (opium added by Simpson):
  - `r.witness_saw_it` over Hunter's charge, `defeated_by` could-not-see;
  - the stranger's identity from Simpson's own account. That part is true and needs no default.
- **`k.police_simpson_took_horse`** (Simpson led the horse out, to steal it):
  - `r.drugged_guard` in the police's hands, citing `k.police_simpson_drugged`. The application is sound: its
    premise is the false part, so this inference falls with the first one;
  - a default `r.night_taker_steals` ("a man who leads a horse from its stable by night means to steal it"),
    `defeated_by` "he meant to injure it", formula `?outing.purpose = injure`. Holmes's
    `k.knife_for_an_operation` establishes that.
- **`k.police_stick_killed`** (Simpson struck the blow, with the stick):
  - a default `r.clutched_from_assailant` ("what a dead man clutches he tore from his assailant"),
    `defeated_by` "it was in his own hands before". Its formula is over the cravat's possession track; Holmes's
    `k.cravat_order` establishes it;
  - a default `r.weapon_fits_the_wounds` ("a heavy weapon on the suspect that could have made the wounds made
    them"), unless "something else there could have made them". No formula; refuted by `k.horse_kicked` at ¶226.
- **`k.gregory_gypsies`** (the gypsies have the horse):
  - `r.flight_shows_guilt`, `defeated_by` "they would have gone anyway" (`t62.3`).

**Strains and drops** (`t58.4`, `t24.4`, `t64.2`, `t58.3`, `t62.4`, `t68.2`, `t92.7`) stay with workstream 6.
`t62.4` already names an inference (Round 96), and nothing here changes it.

## Order of work (if agreed)

1. **Exceptions and the raise action.**
   - Format: `unless` entries as objects (id, text, source, formula), with plain strings still valid.
   - Validator: ids unique per rule, sources found, formulas grounded under every application's bind.
   - Engine: `Game.exceptionsOf(K)`, `Game.raise(K, N, E)` with the three outcomes, reservations and defeats saved
     (save version unchanged, as in Round 83).
   - Data: the sound sleepers and the accomplice.
   - Tests; diffs of the logs, reports and gates.
2. **Showing exceptions** (Q1 (i)): every exception on its rule card at its line; the leak checker over them;
   flagged ones held back. Reveal and foreshadow logs diffed in full.
3. **The police's four as reasoning, and slice 4.**
   - Format and engine: `defeated_by` (verification, the case's reading, the validator's check of the exception
     in the answer key).
   - Data: `r.witness_saw_it` with could-not-see given logic, Hunter's perception, the flight rule and the
     gypsies' exception, the night-taker and clutch rules.
   - Then the report gate: an unexplained `asserted` becomes an error.
4. **Thoughts and scoring:** `undercuts` on thoughts, the thoughts checker, the aggregate score; `t4.2` with
   `r.one_culprit`, `t68.3` deferred; the annotation mirrored in `reading-annotated.md`.
5. **UI:** "Unless…" on an inference card (the exceptions of its rules, with their status), the reservation
   mark, the defeat with its reason, behind the busy indicator.

Each step keeps the reading layer: an exception shows no earlier than its source or its rule, and new rule and
exception text goes through the leak checker.

## For Robert

1. **Q1:** exceptions as named entries of a rule's `unless`, with source and formula where they can have them (a)?
   Shown with their rules after a leak check (i)?
2. **Q2:** a played exception is ruled out, a reservation (open) or a defeat (established), by what the player
   holds (a)?
3. **Q3:** the police's four given police defaults with `defeated_by`, verified, and slice 4's gate then made
   strict (a)?
4. **Q4:** logic for "could not have seen it" only (a)?
5. **Q5:** undercuts scored before Holmes, in aggregate, never gating (a)?
6. **Q6 and Q7:** one culprit as a rule with no formula, its break deferred to workstream 6; the accomplice as an
   exception sourced at ¶218, always a reservation?
7. **The order of work** above?

## Agreed (Robert, Round 101)

The recommendations of Q1–Q5 and Q7 as written, and the order of work. **Q6 is deferred** as a whole: `t4.2` and
`t68.3` keep `no_inference: workstream-3` for now, and no `r.one_culprit` is authored; the larger question behind
it (whether an applied default yields in a clash before a story clue) waits with it.

## Left open (Round 106)

- **Q6** (one culprit, `t4.2` and `t68.3`): deferred by Robert; both keep `no_inference: workstream-3`.
- **How clashes weigh what they set aside** (Robert, Round 104: leave it for now; rethink it after this workstream,
  as the first design question of workstream 6 or a short paper before it). What has been seen:
  - the order is by source only: story clues give way first, then inferences someone else stated, then the
    player's and Holmes's. A player who keeps the police's account loses true clues to it
    (`k.police_simpson_took_horse` against `c.simpson_came_for_information`, Round 102);
  - Q6's question is the same one: an applied default that is false (one culprit) would clash late and cost story
    clues before the player's own card;
  - workstream 3 now marks what a better order could use: which steps rest on a default, which default has an
    exception open (a reservation), which step is defeated;
  - workstream 6's graded support and strain are the other half of "what should give way".
  - Fixed meanwhile, as a bug (Round 104): an inference set aside in a clash now goes whole, its rule applications
    with it.
- **Reading-layer calls made by precedent** (Rounds 89, 95: a rule that would give a step away goes where Holmes says
  it), for Robert to revisit if he wishes: `r.saw_drug_would_not_eat` and Hunter's perception at ¶218 (so `t36.2`'s
  defeat comes no earlier, though a reservation can be raised from ¶36); "he could not have seen it" shown with
  `r.witness_saw_it` at ¶36; "they would have gone anyway" and the period belief `r.gypsies_clear_out` at ¶62, where
  the gypsies' going is told (a period belief, like `r.gypsies_avoid_trouble` at ¶19).
- **`r.markings_identify_horse`'s** own text says "unless the markings have been hidden" twice, and its exception
  repeats it.
