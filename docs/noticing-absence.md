# Noticing and absence (workstream 5)

Status: **AGREED** (Robert, 2026-10-16, Round 82: the five recommendations, as written). **Built:** step 1, absence filing (Round 83; the alarm rule changed from the plan, see there). Builds on the world model and on knowledge (Rounds 60–78)
and on the default knowledge rules (Round 81, starter batch).

## The reader's process

A careful reader does two things the game cannot yet let them do.

- **Notice:** a detail is odd against what one expects. A trainer carries a surgeon's knife (`t81.2`); a dead
  man carries another man's bill (`t84.3`); a man going out in heavy rain takes his coat off (`t35.8`). Noticing
  proves nothing. It flags a detail for later, and Holmes's reasoning later rests on it.
- **Absence:** something that should have happened did not, and nobody says so. The stable has a dog, set on
  intruders (¶29); someone came in the night and took out a horse; the lads in the loft heard nothing (¶34). The
  story never says "the dog did not bark" until Holmes points at it (¶180) and Gregory says it (¶181). The
  annotation calls this the hardest move in the story (`t34.2`), because nothing in the text points at the gap.

The two are one move seen from two sides. A notice is something present that was not expected. An absence is
something expected that is not there.

**The thoughts** (`thoughts.json`): 16 NOTICE and 5 ABSENCE.
- **In-world absences:**
  - the dog (`t34.2`, careful);
  - the lantern Straker did not take (`t78.4`, expert);
  - the cravat missing from Edith's description (`t21.2`, expert).
- **Narrative omissions:** the boot comparison's result (`t107.2`) and the question to the maid (`t163.2`). The
  story never reports them. They are not the player's to file. They belong to disclosure typing (workstream 8).
- **`t34.5`** ("he went to the stables and raised no alarm") rests on a fourth in-world absence the annotation
  does not tag: no alarm was raised in the night.

## What exists

- `c.dog_did_nothing`, `via: "absence"`, quoted from "They had heard nothing during the night" (¶34), with a
  second attestation by Gregory at ¶181. It is **dealt at ¶34** like any clue, so the game makes the move for the
  player.
- Its logic is a positive event, `e.dog_silent` (agent the dog, at the stable, at the time of the entry), which
  `r.dog_barks_at_strangers` reads. `k.dog_knew_the_visitor` (Holmes) rests on it and gates ¶180 and ¶219.
- Nothing marks a detail as noticed. Scoring (Round 58) counts only deductions made before Holmes's paragraph.
- Default rules carry `unless` and a `relevant_from` line. Several NOTICE thoughts already map to one:
  - `r.others_bills` (`t84.3`);
  - `r.wet_ground_holds_tracks` (`t116.2`);
  - `r.money_talks` (`t189.1`).

## Questions, alternatives, recommendations

### Q1. What is an expectation?

- **(a) A default rule the player holds (recommended).** The rule cards already say what is expected, with
  exceptions (`unless`), a schema and a reading-layer line. The dog's expectation is `r.dog_barks_at_strangers`.
  Where a NOTICE has no rule yet (the knife, the coat, the candle), one is authored when that notice is wired. A
  thought's expectation is its `from` entry, a rule or a `bk.*` background card that maps to one.
- **(b) A new card kind, `expectation`,** attached to a card or trait ("a guard dog barks at strangers"). It is
  clearer to the player, but it is a second vocabulary beside the rules for the same knowledge.
- **(c) No expectation object.** The player notices or files freely; only the authored list knows why.

### Q2. The notice action

**What the player marks:**
- **(a) A card they hold (recommended).** "That's odd" on a clue card, with an optional "because" (a rule they
  hold). Simple to score and to show.
- **(b) A span of the story text.** Closer to reading, but matching spans to the authored quotes is fuzzy, and
  it needs UI work first.
- **(c) Nothing to mark.** Notable details only feed hints ("a careful reader would have paused here").

**What a notice does:**
- **(i) It is recorded and scored (recommended).** Scoring is the gap analysis's ruling (§6.2):
  - in aggregate: "you noticed six of the nine things Holmes used";
  - by later use: a notice counts if it comes before the paragraph where Holmes draws attention to it;
  - no cost for a notice that leads nowhere.
- **(ii) Also a flag on the card,** listed under "Odd things" (recommended with (i)). Workstream 6's residue
  tray would start from it.
- **(iii) Also raising the question the detail poses** ("why did he carry the knife?"). This is the QUESTION tag
  (player-posed questions). Defer it.

**The data:** a NOTICE thought gains `notices: [card ids]`, the cards whose marking counts for it. Its
`holmes.paras` (built) gives the deadline.

### Q3. Absence: what is filed, and how it is checked

An absence claim cannot be checked by logic from what the player holds. "They heard nothing" does not entail
"the dog did not bark": it entails it only under a closed-world reading of the narration ("had it barked, they
would have said"). So the claim must be authored, and the question is how the player reaches it.

- **(a) Filed from three things (recommended):**
  - an expectation: a rule the player holds (the dog barks at strangers);
  - a time: a window on the board (the stable hour);
  - the clue that would have registered it: a witness or record (the lads heard nothing).

  If an authored absence claim matches (its `expectation`, `window` and `witness`), it is dealt as the player's
  find. Otherwise the answer is "the story does not bear that out", at no cost. Asking for the witness makes a
  filing an act of reasoning ("who would have heard?"). It also limits probing: a filing is three choices, not a
  guess per window.
- **(b) Free negative statements, checked by the solver.** Not possible, for the closed-world reason above.
- **(c) Keep dealing absence claims, only later** (at Holmes's pointer). This removes the move from the player
  altogether.

**Recommended, (a) with (c) as the fallback:** an absence claim no longer comes by mention. Its `via: absence`
attestation never deals it, in any setting, by mention or by click. It comes to the player either when they file
it, or at the story's own next attestation of it: for the dog, Gregory's "The dog did nothing in the night-time"
(¶181).
- **Consequence:** the ¶180 gate on `k.dog_knew_the_visitor` cannot be met at ¶180 by a player who has not filed
  it. The gate moves to ¶181, where the clue is told; Holmes's explanation follows there anyway. **Alternative:**
  count Holmes's "the curious incident of the dog in the night-time" (¶180) as an attestation, so the gate stays.
  It points at the dog rather than stating the silence. I recommend ¶181.

**Easy and Trivial:** the filing is offered with the expectation pre-chosen (the rule the absence names) once its
witness clue is held. Trivial files it by itself at ¶34, as today. Medium and Hard ask for all three.

### Q4. How is an absence written in the logic?

- **(a) As a positive "silence" event** (`e.dog_silent`, as built). It works for the dog. Each absence then
  needs an event invented for it.
- **(b) As a boolean proposition that is false (recommended for new absences):** `p.alarm_raised_in_night` = false.
  Rules can conclude it ("an honest trainer who knows raises the alarm"), and the existing proposition and
  knowledge machinery carries it.
- **(c) An `occurred` facet on every event** ("did it happen?"). This is the general form, but every event
  gains a slot. Too heavy for what the story needs.

The dog stays as built; nothing is gained by migrating it.

### Q5. `t34.5`: the alarm

With Q1–Q4 as recommended:
- **A proposition:** `p.alarm_raised_in_night` ("Someone raised the alarm at the stable in the night").
- **An absence claim:** `c.no_alarm` (`via: absence`; expectation `r.honest_trainer_alarms`; window: the night,
  one o'clock to seven; witness `c.lads_heard_nothing`). It is quoted through "They had heard nothing during the
  night" and "were quickly aroused" (¶34), and asserts the proposition false. No later line states it, so it comes
  only by filing.
- **A proposition for what he would see:** `p.stall_empty` ("Silver Blaze's stall was empty").
- **Rules:**
  - `r.present_sees` (from the starter batch): who is at the stable when the horse is led out knows the stall is
    empty;
  - `r.honest_trainer_alarms` (new default): an honest trainer who knows his horse is gone raises the alarm,
    unless he is prevented.
- **The inference** (editorial, verified): if Straker was at the stable when the horse was led out, he was not
  honest. That is "either he never got there, or he got there and raised no alarm".
- **No gate:** `t34.5` has no Holmes paragraph.

### Q6. Which absences and notices get data now

**Recommended:**
- **Absences:** the dog (moved to filing) and the alarm (new).
- **Notices:** `notices` on the NOTICE thoughts whose card is plain:
  - the knife (`t81.2`), the bill (`t84.3`), the milliner's sum (`t84.7`), the candle (`t78.3`), the coat
    (`t35.8`), the odds (`t189.1`): six scoring ones;
  - the dish (`t20.4`) and the drink rule (`t20.5`), which have no Holmes deadline.

**Later:** the lantern (`t78.4`) and the cravat in Edith's description (`t21.2`), both expert and leading
nowhere. They can be authored as absences that score as notices, if wanted.

## Order of work (if agreed)

1. **Absence filing:**
   - the engine: withheld absence attestations, `fileAbsence(rule, window, witness)`, the fallback at the next
     attestation;
   - the dog moved to filing, its gate checked;
   - the alarm, `t34.5`'s inference with `r.present_sees`;
   - tests;
   - the reveal log and gate diff explained.
2. **Notices:** `notices` on the thoughts, `Game.notice(card, because?)`, scoring in `thoughtScores`/`score`,
   and the saved record.
3. **UI:**
   - "That's odd" on a card;
   - "Something didn't happen" on the board (expectation, time, witness);
   - the "Odd things" list.

Each step keeps the reading layer: no absence or notice shows before its witness and expectation are told, and the
fair-play test runs on the filed path and on the fallback path.

## For Robert

1. Q1: expectations are default rules (a)?
2. Q2: notice on a card, recorded, scored and flagged (a, i, ii); questions deferred?
3. Q3: absence filed from expectation, time and witness, with the story's next attestation as the fallback, and
   the dog's gate moving to ¶181?
4. Q4: new absences as false propositions; the dog stays a silence event?
5. Q5 and Q6: the alarm for `t34.5`; the notice data listed; the lantern and cravat later?

## Agreed (Robert, Round 82)

All five as recommended:

- expectations are default rules;
- a notice is a mark on a card, recorded, flagged and scored; player questions are deferred;
- an absence is filed from an expectation, a time and a witness, with the story's next attestation as the
  fallback (the dog's gate moves to ¶181);
- new absences are false propositions, and the dog stays a silence event;
- the alarm for `t34.5`, the notice data as listed, with the lantern and the cravat later.

The order of work above follows.
