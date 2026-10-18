# Predictions and test plans (workstream 7)

Status: **AGREED** (Robert, 2026-10-18, Round 125: every recommendation and the order of work; the maid's question
recorded, unscored). Mission: `docs/kickoff-workstream-7.md`. Builds on
`docs/gap-analysis.md` (§2 PREDICT, TEST PLAN and TEST; §3 "late or never disclosed"; §4; §6 decisions 2 and 4),
`docs/reading-annotated.md` (the PREDICT and TEST PLAN thoughts, the audit), the ws 7 rows of
`docs/annotation-review.md` and `docs/review-ws3-ws6.md`, and `docs/hypotheses.md` (the score family, the presets,
theories and their cost).

## The reader's process

The reader does not only conclude. Holding a story of the night, they say what it implies will be **found**, and
which **check** would tell two stories apart, before Holmes makes it. Then they read on to see.

**Predictions (what will be found).** Each follows from a hypothesis the reader holds:
- the dog should have barked if a stranger came (`t29.4`, from the guard-dog default);
- a spent match in the mud of the hollow (`t78.5`, `t92.9`, from the candle in Straker's pocket);
- the coat was laid on the bush, which a still night would show (`t92.10`);
- the horse's tracks lead towards Mapleton (`t92.11`);
- the milliner will recognise Straker's photograph (`t92.12`);
- the horse will be found in time to run, so Holmes will keep him entered (`t92.13`);
- Straker practised on something first (`t92.14`, AGENT then PREDICT);
- Silver Blaze will run disguised (`t141.2`).

**Test plans (which check to make).** Each is chosen because its result splits two stories:
- ask Mrs. Straker about the dress on the bill: hers, or another woman's (`t85.3`);
- show Straker's photograph at the milliner's (`t92.5`);
- compare the boots with the prints in the hollow: if Simpson's shoe is not there, the police lose their meeting
  (`t101.2`);
- search the wet hollow on the line to Mapleton, with the horseshoe (`t116.3`);
- what Holmes asked the maid (`t163.3`, a HYPOTHESIS over candidate questions: the reader writes the question).

**Settling.** The story settles each one in one of three ways:
- **Holmes performs the check and the result is shown at once:** the match (¶102), the wind (¶94–¶95), the dress
  (¶89–¶92), the track (¶117).
- **The result arrives late:** the photograph is asked for at ¶161, and the milliner's recognition is reported at
  ¶229, offstage.
- **The result never comes:** the boot comparison (¶107, `t107.2`) and the question to the maid (¶163, `t163.2`).
  "The game shouldn't ask the player to prove anything the story itself leaves open."

The TEST thoughts are where a reader collects: `t102.2` (the match), `t96.1` (the coat), `t117.2` (the tracks),
`t161.2` (the horse will run), `t173.2` (the sheep), `t182.2` (the dog), `t198.2` (the bay), `t229.2` (the milliner).
The GENRE thoughts `t109.2`, `t111.2`, `t156.2` and `t161.3` are the same moment seen from Holmes's side: he pockets
the horseshoe, lets the name stand, leaves for London, asks for the photograph. Decision 2 says watch-holmes never
scores. For a reader who predicted first, these are confirmations.

## What exists

- **Holmes's actions** (`actions.json`, 36): `requires` (earlier actions, cards, Holmes's steps, items, people),
  `yields` (cards, items, steps), a spoiler-free `cue`, `during_scene` and `narrated_in`.
  Two actions say their result is unknown, as free text: `a.compare_boots` and `a.question_maid` (`yields.unknown`).
- **Where an action happens** is its anchor: the paragraph of its first `source` quote
  (`story.anchors.actions`). At that paragraph the action is done (`Game.done`) and Holmes's items arrive. The cue
  is no longer shown: since Round 10 the button always says "Next paragraph", and `Game.nextAction` has no caller.
- **The 'wait' pace** holds a paragraph until the player has the steps that Holmes acts on there: an action's
  `requires.thoughts`, at its anchor; Holmes's sharp route steps, at their own paragraphs (`Story.#gates`,
  `stepNeeds`).
- **`Game.disclosure(card)`**: only the paragraph where a card is first mentioned. Nothing marks a result as late or
  never.
- **The score family:**
  - `thoughtScores` / `score`: route steps the player made before Holmes's paragraph;
  - `noticeScores`, `raiseScores`, `dropScores`, each with an aggregate.

  Each row has the thought, Holmes's paragraph (or a deadline), the player's paragraph, and `scores`. Nothing
  counts in Trivial. **No score is shown in the UI yet** (`ui/` never calls them); that is workstream 9's.
- **Absences** (workstream 5): the player files one (`fileAbsence`). It is recorded with its paragraph
  (`this.filed`) but **not scored**.
- **Theories** (workstream 6): `scenarioCost`, `residue` and `assumedAnswers`. Puzzles carry explanations as
  formulas over slots.
- **Slots that predictions speak of:**
  - `silver_blaze.hidden_at`, held from ¶14;
  - `silver_blaze.disguised`;
  - `william_derbyshire.identity`, held from ¶84;
  - the coat's event (`e.coat_off`, held from ¶35).

  The finds themselves are claims whose `asserts` sit on events the player has not met. `c.vesta_in_mud` speaks of
  `e.light_struck`, first mentioned at ¶226. `c.horse_track_in_wet_hollow` speaks of `e.horse_bolts`.

## Measured

A scratch replay (`measure.mjs` in the session's scratchpad) reads the story on Easy, background when relevant, for
two players:
- a **passive** player, who builds nothing;
- a **builder**, who builds everything buildable at every paragraph.

For each thought, and for each action it maps to, the replay records:
- when its premises are held;
- where the action is anchored, and what it requires;
- when its result cards are disclosed;
- which TEST or GENRE thoughts settle it, and when the player holds them.

### 1. The windows

"Earliest" is the thought's paragraph, or the builder's paragraph where that comes sooner (premises that map to no
card, such as the scenario `t92.6`, are dated by the annotation). "Holmes" is the first paragraph where he performs
the check. "Result" is where the story shows its outcome.

| Thought | What | Earliest | Holmes | Result | Window |
|---|---|---|---|---|---|
| `t29.4` | the dog should have barked | ¶29 | ¶180–¶182, ¶219 | absence filable ¶34 | 151 ¶ |
| `t78.5`, `t92.9` | a match in the hollow's mud | ¶78 | ¶102 (anchor ¶104) | ¶102 shown | 24 ¶ |
| `t85.3` | ask Mrs. Straker about the dress | ¶85 | ¶89 (**anchor ¶225**) | ¶89–¶92 shown | 4 ¶ |
| `t92.10` | the coat laid; a still night | ¶92 (`t35.8` ¶35, weak) | ¶94 | ¶95–¶97 shown | 2–59 ¶ |
| `t92.11` | the tracks lead to Mapleton | ¶92 (builder ¶37) | ¶116 | ¶117–¶123 shown | 24–79 ¶ |
| `t116.3` | search the wet hollow | ¶116 (builder ¶37 as `t92.11`) | ¶116 | ¶117 shown | 0 (as `t92.11`: 79) |
| `t92.5` | show the photograph at the milliner's | ¶84 | ¶161 (photo asked) | ¶229, **late** | 77 ¶ |
| `t92.12` | the milliner recognises him | ¶92 | ¶229 | ¶229, **late** (offstage) | 137 ¶ |
| `t92.13` | the horse will run; kept entered | ¶92 (builder: `t40.4` ¶37) | ¶111 | ¶161 (Holmes's word), ¶199 | 19 ¶ |
| `t92.14` | he practised first | ¶92 | ¶170 | ¶173 shown | 78 ¶ |
| `t101.2` | compare the boots with the prints | ¶101 | ¶107 | **never** | 6 ¶ |
| `t141.2` | Silver Blaze will run disguised | ¶141 (builder: `t141.1` ¶66) | ¶197 | ¶198–¶202 shown | 56 ¶ |
| `t163.3` | what Holmes asks the maid | ¶163 | ¶163 | **never** | 0 |

The beat-Holmes windows table of the audit agrees where it overlaps: the match (¶78 → ¶102), Mapleton (¶40 →
¶116), the coat (¶35 or ¶92 → ¶96), the sheep (¶92 → ¶173), the milliner (¶84 → ¶229). `t116.3` has no window of
its own: at ¶116 Holmes names the wet hollow in the same paragraph. A reader who planned the search earlier did it
as `t92.11`.

### 2. The predictions mostly cannot be said as answers

A prediction as "a formula over slots" works only where the player holds the slot when they predict:
- **Mapleton:** `silver_blaze.hidden_at`, ¶14.
- **Derbyshire is Straker:** `william_derbyshire.identity`, ¶84.
- **The horse is disguised:** `silver_blaze.disguised`, held early (the builder concludes it at ¶66).

All three are already route steps, scored as deductions when built: `t40.4`, `t84.6` and `t141.1`.

The finds are claims about events the player has not met: the match (`e.light_struck`, first at ¶226), the track
(`e.horse_bolts`), the sheep (`lame_sheep`, ¶173). A reader at ¶78 cannot pick "a light was struck" from any
question on the table. They can say "look in the hollow's mud for one of the vestas from his pocket": the
vesta box and the candle are met at ¶76. **The vocabulary of a prediction is a check over things the player has
met,** not an answer to a question they do not have.

### 3. Holmes's action list cannot be the menu

The 36 cues are spoiler-free one at a time, but not as a list. A menu offered at
¶92 would say "Ask about the sheep" (the sheep are first mentioned at ¶170), "Call on the milliner", "Watch the
race", "Confront Silas Brown". Filtering the menu by what the player holds still tells them that such a check
exists. **A plan has to be composed from what the player holds, and matched against Holmes's checks quietly.**

### 4. Nothing names Holmes's next action ahead of it

The draft of this paper took the read-on button to show the next action's cue a paragraph early. It does not
(Round 10; Robert, Round 125). A deadline can therefore be Holmes's paragraph itself, as for the other scores.

### 5. Two anchors are late

- **`a.dress_trick`** is anchored at **¶225** ("I questioned Mrs. Straker as to the dress without her knowing it", the
  explanation). The ruse itself is ¶89, and its cards arrive at ¶87–¶92, so the action is "done" 136 paragraphs
  after it happened. The gate it adds (`t84.6` at ¶225) duplicates `a.reason_about_bill`'s.
- **`a.search_mud`** is anchored at **¶104** ("I only saw it because I was looking for it"). The search and the find
  are ¶102, so the 'wait' pace asks for `t81.5` (the knife was for the horse) two paragraphs after Holmes has
  acted on it and the vesta is found.

Other actions anchor a little after their first card (`a.examine_pockets` ¶76 against ¶73, `a.take_bag` ¶102 against
¶99, `a.follow_tracks` ¶123 against ¶119, `a.question_gregory` ¶57 against ¶54, `a.at_the_race` ¶199 against ¶184).
This is harmless for scoring if a check carries its own paragraph (Q3).

### 6. Absences are filed but never scored

`t34.2` (the dog: nobody mentions it, ¶34) is the story's hardest move, and `t182.2` says a reader who made it
"scores it here, 148 paragraphs ahead". Today filing the absence is recorded and counts for nothing. Of the six
ABSENCE thoughts, only `t34.2` has a Holmes date (¶180). `t29.4`'s "sealing" is exactly this: the expectation set up
at ¶29, filed against the night at ¶34.

### 7. The ws 7 thoughts by form

| Form | Thoughts |
|---|---|
| A check over held things, with an expected result | `t78.5`, `t92.9`, `t92.10`, `t92.11`, `t92.12`, `t141.2` |
| A check, the result being the point | `t85.3`, `t92.5`, `t101.2`, `t116.3` |
| A check whose question the player writes; never answered | `t163.3` |
| An expectation sealed by filing an absence | `t29.4` (with `t34.2`, settled by `t182.2`) |
| A settling moment, not a move | `t161.2` (settles `t92.13`), `t182.2` (settles `t34.2`) |
| An answer to a held question, already a deduction | `t92.13`'s "the horse will run" (`t40.4`), `t141.2`'s "disguised" (`t141.1`) |
| No vocabulary before Holmes | `t92.14`: the sheep arrive at ¶170, with Holmes's question |
| Watch-holmes (decision 2: never scores) | `t109.2`, `t111.2`, `t156.2`, `t161.3` |

## Questions, alternatives, recommendations

### Q1. What is a sealed prediction?

- **(a) A formula over slots** ("seal an answer"). It reuses the slots and the solver, and settles computably. But
  most predictions are finds whose slots the player has not met (Measured §2). The three that fit are already
  scored as deductions. Sealing an unproved answer would also score guesses.
- **(b) "Holmes will do X"**, picked from his actions. The list leaks (§3).
- **(c) "This will be found": a check plus its expected result (recommended).** The player composes a check from
  what they hold (Q2) and may add what they expect:
  - **found or not found**, for a look;
  - **yes or no**, for a question or a showing;
  - **matches or does not**, for a comparison;
  - optionally an **answer** over a slot they hold, when the result would settle one: "she will know him as
    Derbyshire" is `william_derbyshire.identity = straker`.

  PREDICT and TEST PLAN become one object, a **sealed check**. A TEST PLAN is a sealed check without an expected
  result, or with one either way ("if Simpson's shoe isn't there…").
- **(d) A theory's consequence,** the game deriving what a scenario says will be found. This needs every check's
  outcome as a formula over slots the player's theories answer, and they rarely hold those slots (§2). Q6 takes the
  part that works.

**Sealed** means it is recorded with the paragraph and cannot be edited. The player may withdraw it, and a
withdrawn seal no longer scores. Wrong ones cost nothing (decision 2). The game never says before Holmes acts
whether a seal matches anything.

`t29.4` is not a new object. Its seal is the absence filed at ¶34 (Q5).

### Q2. What is a test plan, and how is it matched?

- **(a) Holmes's actions chosen in advance.** This leaks (§3).
- **(b) Templates over held things (recommended):**
  - **look for** {a thing} **at** {a place};
  - **ask** {a person} **about** {a card or a thing};
  - **show** {a person or thing} **to** {a person};
  - **compare** {a thing} **with** {a thing or a card}.

  The slots of a template are filled from what the player holds: entities met, cards held, places on the board.
  Nothing in a dropdown is new to the player. A plan is shown back in those names, which are already card text, so
  it adds no new text to leak-check.
- **(c) Both.** Easy offers Holmes's menu, filtered. This still leaks on Easy, and the reading layer is sacred on
  every preset.

**Matching:** a new list of **checks** (`ck.*`), one per line in `knowledge.json` beside `puzzles` and `readings`.
Each check has:
- its action;
- its template verb;
- for each field, the ids it accepts. More than one is accepted where the reader could name the same check
  differently: the vesta box, the candle or Straker for the match; Mapleton, the wet hollow or the moor towards
  Mapleton for the tracks;
- its paragraph (Q3);
- its result (Q4);
- optionally an answer formula and the expected outcome.

A plan matches a check when every field the check names is filled with an accepted id. The validator checks, for
each scored check, that some accepted combination is met before the deadline (else the window is empty, as for
`t92.14`), and that no accepted id reveals a later fact.

Which actions get a check: those a PREDICT or TEST PLAN thought maps to, which is about ten. The other actions
stay without one. A plan that matches no check is still the player's, recorded, and Holmes "never does that".

### Q3. When is a sealed check settled, and by what?

- **Holmes performs it:** at the check's own paragraph, taken from the thought's first Holmes paragraph. For the
  dress trick that is ¶89, the match ¶102, the coat ¶94, the photograph ¶161, the wet hollow ¶116, the boots ¶107
  and the race ¶197. Using the check's own paragraph rather than the action's anchor avoids the late anchors of §5.
- **The deadline** is the check's paragraph: a seal counts if made before it, as for the other scores (§4).
- **The result** is settled at the check's result paragraph: shown, late or never (Q4). An expected result is
  **borne out** or **not borne out** there. An answer is borne out when the story's result card asserts it
  (`c.milliner_knows_straker` asserts `william_derbyshire.identity = straker`).

**The two anchors (§5).**
- **(a) Move both:** `a.dress_trick` to ¶89 ("Surely I met you in Plymouth…") and `a.search_mud` to ¶102 ("he made a
  careful study of the trampled mud"). The gates move:
  - `t84.6` from ¶161 to ¶89 (the 'wait' pace would hold ¶89 until the player has Derbyshire as Straker, which a
    builder has at ¶84);
  - `t81.5` from ¶104 to ¶102.

  This follows the rule that a paragraph where Holmes acts on a deduction waits for it, as the search already does
  with `t81.5`.
- **(b) Move both, and drop `a.dress_trick`'s `requires.thoughts`.** The gate stays at ¶161. The ruse is visible at
  ¶89 but its purpose is told only at ¶92–¶93.
- **(c) Leave the anchors; checks carry their own paragraph.** The dress trick stays "done" at ¶225.

  Recommended: **(b)** for the dress trick and **(a)** for the mud. The ruse is a test, and at ¶89 the story does not
  show Holmes acting on the identity: a reader cannot tell why he asks. The search for a match is Holmes looking
  for what `t81.5` predicts, and ¶102 is where he does it.

### Q4. Withheld results

A `result` on each check replaces `yields.unknown`'s free text:
- **`{shown: N}`**: the result is at ¶N;
- **`{late: N}`**: the check is made at its paragraph, and the result comes at ¶N (the milliner: ¶161, then ¶229);
- **`{never: true}`**: the result is never told (the boots, the maid).

What the game shows on the player's sealed check, on every preset but Trivial:
- **at the check's paragraph:** "Holmes does this here (¶107)." If the result is not in the paragraph: "The story
  does not say here what he found." This is true when read and tells nothing about the future;
- **at the result's paragraph:** the result, and "borne out" or "not borne out" for an expected result;
- **at the end of the story,** for `never`: "The story never says what he found. It is left open." Nothing is
  scored on the result.

What it asks of the player: nothing they must do. They may seal an expected result for a `never` check ("Simpson's
shoe is not among the prints"). It stays open and is never scored. `t163.3` is the plan "ask Edith Baxter about
{a card}" (the curry, the dish, the window). It is recorded, matched to Holmes's question as a plan, and never
answered.

Out of scope here, and left to workstream 8's disclosure typing:
- **The bill's items** (`t92.2`): settled already by `k.dove_silk_on_the_bill`.
- **The square toes** (late, ¶146): a fact, not a check's result.

### Q5. Scoring

In the shape of the family: rows, an aggregate, the deadline, nothing in Trivial, and wrong seals cost nothing.
- **`checkScores()` / `checkScore()`.** One row per PREDICT or TEST PLAN thought that names a check (`checks: [{check,
  expect?}]` on the thought), with:
  - the deadline;
  - the paragraph the player sealed a matching check (null if not);
  - whether the expected result, if the thought has one, was borne out (`true`, `false`, or `null` while pending or
    `never`);
  - `scores`: sealed before the deadline, and not "not borne out".

  So a plan scores when Holmes performs it, and a prediction when its result is shown as expected or is never
  told. The aggregate: sealed, scored, possible, of.

  **Alternative:** a plan scores only once its result is shown. That would never score the boots, the maid or
  (until ¶229) the photograph. Recommended as above: the plan is the move, and the result is the story's.
- **`absenceScores()` / `absenceScore()`.** One row per ABSENCE thought with a Holmes date (today only `t34.2`):
  filed before Holmes's paragraph. This scores `t29.4` and `t34.2`, and `t182.2` is where it is settled.
- **Not scored:**
  - the GENRE thoughts (decision 2);
  - `t163.3` (Holmes never says what he asked);
  - the answers of `t92.13` and `t141.2`, which are deductions already scored as `t40.4` and `t141.1`;
  - `t92.14`: no vocabulary before ¶170. It is scored as the deduction `t175.1` (¶228), as now.

### Q6. How a prediction meets workstream 6

- **(a) Not at all.**
- **(b) A sealed check may cite a theory, and the game checks its answer against it (recommended).** Where the
  sealed check carries an answer, the game says whether the cited theory's answers, with the facts left after its
  cost, entail it (the residue machinery's test, Round 115). The three outcomes are "your story says so", "says
  nothing" and "says otherwise". It is never refused. This is the drop check's shape (Q5 of `docs/hypotheses.md`).
- **(c) A theory proposes its own predictions:** for each check with an answer formula, the outcome each theory
  implies. This needs answer formulas for every check and theories that answer the slots (§2). Listed, not built.

### Q7. The difficulty presets

- **Trivial:** nothing. No checks are sealed for the player and nothing scores.
- **Easy, Medium, Hard:** the same action. Composing from held things is the reader's move at every level, and
  nothing about matching is shown before Holmes acts. The differences:
  - **Easy:** the plans list shows a sealed check's theory test (Q6) by name, and at the end, the `never` and `late`
    marks;
  - **Medium:** the theory test as yes or no;
  - **Hard:** the theory test on request.

  This is the `weigh` option's split; it is reused, not a new option.

## The cases as tests

| Case | Player | Expected |
|---|---|---|
| The match (`t78.5`, `t92.9`) | seals "look for the vestas at the fatal hollow" at ¶80, expects found | scores (deadline ¶102); borne out ¶102 |
| The match, too late | the same seal at ¶102 | does not score (Holmes's paragraph) |
| The dress (`t85.3`) | seals "ask Mrs. Straker about the bill" at ¶86 | scores (¶89); result shown ¶89–¶92 |
| The coat (`t92.10`) | seals "ask Gregory about the coat on the bush" at ¶92 | scores (¶94) |
| The tracks (`t92.11`) | seals "look for Silver Blaze at Mapleton" at ¶40 (builder) | scores (¶116); borne out ¶117 |
| The wet hollow (`t116.3`) | the same seal at ¶116 | does not score (window 0) |
| The photograph (`t92.5`, `t92.12`) | seals "show Straker to Madame Lesurier", expects Derbyshire = Straker, at ¶92 | the plan scores at ¶161; the answer is pending until ¶229, then borne out |
| The boots (`t101.2`) | seals "compare Simpson's shoe with the marks in the hollow" at ¶101 | scores (¶107); "the story does not say here"; at the end, never told |
| The maid (`t163.3`) | seals "ask Edith Baxter about the curry" at ¶150 | matched at ¶163, unscored, never told |
| The race (`t141.2`) | seals "look for Silver Blaze at the Wessex Cup", expects found, at ¶141 | scores (¶197); borne out ¶198 |
| Not borne out | expects "not found" for the match | no score, no cost |
| Withdrawn | the match sealed at ¶80, withdrawn at ¶90 | no score |
| A theory's test (Q6) | the photograph sealed with Derbyshire = Straker, citing the player's inside story | "your story says so"; citing the police: "says nothing" |
| The dog (`t29.4`, `t34.2`) | files the absence at ¶34 | `absenceScores` scores (deadline ¶180) |
| No leak | every check's accepted ids | first mentioned before the deadline; no new card text |
| Trivial | any | no rows score |
| Unchanged | all | clash log, reveal and foreshadow logs, `report.md` and `thoughts-report.md` except the new checks; gate listing except the agreed anchor moves |

## Order of work (if agreed)

1. **The anchors** (data, Q3): move `a.search_mud` to ¶102 and `a.dress_trick` to ¶89, dropping its
   `requires.thoughts` if (b) is agreed. Diff the gates.
2. **Checks as data** (data, schema, validator): `checks` in `knowledge.json`; `result` replacing `yields.unknown`;
   `checks` on the thoughts (`t78.5`, `t92.9`, `t92.10`, `t92.11`, `t92.12`, `t92.5`, `t85.3`, `t101.2`, `t116.3`,
   `t141.2`, `t163.3`); the vocabulary check (accepted ids met before the deadline); the thoughts report lists the
   checks.
3. **Sealing and scoring** (engine): `Game.seal(plan, {expect, answer, theory})`, `withdraw`, matching, the status of
   each sealed check (performed, result shown, late, never), `checkScores` and `absenceScores` with their aggregates,
   save and load; tests from the cases.
4. **The theory test** (engine, Q6), from the residue machinery.
5. **UI** (Q7): the "Plan a check" panel (templates, dropdowns of held things), the sealed list with its marks, the
   presets; checked in headless Chrome.
6. Then **the short review** of the PREDICT and TEST PLAN thoughts, and `t161.2`, `t163.3` and `t182.2`, against what
   was built.

Each step is one commit with a Round entry, gated on `npm test`. The logs, the reports and the gate listing are
diffed before and after.

## For Robert

1. **Q1:** a sealed prediction is a check composed from held things, with an optional expected result
   (found / yes / matches, or an answer over a held slot); PREDICT and TEST PLAN as one object; no sealing of bare
   answers (those are deductions); `t29.4` sealed by filing its absence?
2. **Q2:** plans from four templates over held things, matched quietly against about ten authored checks
   (`ck.*`), never a menu of Holmes's actions?
3. **Q3:** settled at each check's own paragraph, the deadline being that paragraph; and the anchors: the mud
   moved to ¶102 (gate `t81.5` ¶104 → ¶102), the dress trick moved to ¶89 *without* its thought requirement (the
   gate stays at ¶161)?
4. **Q4:** `result: shown / late / never` on each check; "the story does not say here", then "never told" at the
   end; never-results open and unscored; the maid's question as a plan the player writes?
5. **Q5:** `checkScores` (a plan scores when Holmes performs it; an expectation must not be contradicted) and
   `absenceScores` (`t34.2` before ¶180)?
6. **Q6:** a sealed check may cite a theory, tested like a drop; theories proposing predictions listed, not built?
7. **Q7:** the same action on Easy, Medium and Hard, with the theory test split by `weigh`?
8. **The order of work** above?

## Agreed (Robert, Round 125)

The recommendations of Q1–Q7 as written, and the order of work. Two points settled in discussion:
- **No cue is shown** (Round 10). The draft took the read-on button to name Holmes's next action a paragraph early,
  and its deadline closed before that. The deadline is now the check's paragraph, and the anchors move for the
  'wait' pace and for when an action is done, not for a label.
- **A plan scores when Holmes performs the check, whether or not the story shows the result** (Robert asked; this was
  Q5's recommendation). Holmes choosing the check is the story's endorsement of it, and what it finds is not the
  player's to control. Only an expected result waits on the story. **The maid's question (`t163.3`)** is the
  exception: the story never says what was asked, so "ask Edith Baxter about anything" would be a free point. It is
  recorded, shown as matched at ¶163, and never scored (the simpler of the two options).

