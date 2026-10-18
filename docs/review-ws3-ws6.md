# Second review: what workstreams 3 and 6 make modelable

Status: **REVIEW COMPLETE; all four batches agreed** (Robert, 2026-10-17: "I want to build all of these, if possible";
B1 as (a), with C2). Built: batch 1 (Round 120), batch 2 (Round 121). The kickoff's third task
(`docs/kickoff-workstream-6.md`): after workstream 6, review again the thoughts whose tags workstreams 3
(defeasibility) and 6 (hypotheses, scenarios, residue) give features to hold, in the manner of
`docs/annotation-review.md` (Round 93). Fixes are proposed by kind at the end, for Robert to decide batch by batch.

## How to read this

**Scope (85 thoughts):**
- every thought tagged HYPOTHESIS (27), TEST (30), DROP (4), REVISE (4) and RESIDUE (1);
- the 19 rows the first review marked "ws 3" or "ws 6": `t4.2`, `t19.4`, `t24.4`, `t26.1`, `t32.4`, `t34.3`,
  `t35.6`, `t36.2`, `t36.3`, `t40.4`, `t40.6`, `t40.7`, `t56.1`, `t58.4`, `t60.2`, `t62.3`, `t68.3`, `t84.5`,
  `t120.2`;
- and `t133.2`, which A22 re-dated as `t135.1`.

**What can hold a thought now,** beyond the first review's cards, inferences and slots:
- a **theory** (story or the player's), weighed by its **cost**;
- a **puzzle** (`pz.*`) in a scenario's **residue**;
- a **drop** (`dropped`), checked and scored;
- a **reading** (`rd.*`);
- a **raise** (workstream 3);
- a doubt reason, now including **two stories**.

The first review's verdicts are used unchanged: **accurate**, **partial**, **wrong**, **missing, now** (modelable
with what exists), and **missing, later** (a later workstream, or left out by an agreed paper, "listed").

**Evidence:** a dump per thought of its `maps` (by kind, with the paragraph the game deals each card, read through
with background when relevant and absences filed), its `dropped`, and each relation with its target's `maps`
(the script is in the session's scratchpad, like Round 93's). The engine's behaviour for the scenario thoughts comes
from `engine/hypotheses.test.js` and the measurements of Rounds 113–118.

**Fix kinds:** **A** an annotation fix (`thoughts.json`; `maps` or `from`, mirrored in `reading-annotated.md` where
ids or tags change); **B** a data fix to the case; **C** new data or a small feature for a thought that is missing
but modelable now.

## Hypotheses: candidate sets (slots)

| Thought | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|
| `t14.3` where the horse is | accurate | `silver_blaze.hidden_at`; `pz.not_found` | "Loose: he would have been seen" is held as residue: a scenario with the horse on the moor leaves `pz.not_found` over (only a disguise explains it). | — |
| `t18.2` who gains | accurate | `c.many_interested` | — | — |
| `t24.3` the paper | partial | `paper_packet.contents` {note, opium} | "message" is no candidate; nothing in the story keeps it alive. | — |
| `t28.3` laying against | partial | nothing | The pattern is `r.laying_against` (¶18), which `t84.8` maps; the hypothesis maps nothing. | **A1**: map `r.laying_against`. |
| `t34.4` why the dog was quiet | accurate | `k.dog_knew_the_visitor`, `r.dog_barks_at_strangers`; the raise `barked_unheard` (`t34.3`); `pz.dog` | — | — |
| `t35.7` whose blood | accurate | `e.thigh_cut.instrument`, `k.only_one_blade`; `rd.thigh` | — | — |
| `t35.9` the coat | **wrong** | `e.coat_off.agent` | The set is {torn off in a fight, taken off to work}: the purpose, not the agent. `e.coat_off.purpose` {fight, work} and `rd.coat` hold it. | **A2**: map `e.coat_off.purpose` and `rd.coat` in place of `e.coat_off.agent`. |
| `t35.10` the cravat | partial | `k.cravat_order` | The reading the set is about is `rd.cravat` (who picked it up). | **A3**: add `rd.cravat`. |
| `t37.9` who in the household | accurate | `k.menu_choosers`, `e.opium_added.agent` | — | — |
| `t37.10` the maid | accurate | `e.opium_added.agent` = the maid; dropped by `t92.7` | — | — |
| `t37.13` the horse killed him | accurate | `k.horse_kicked`, `e.fatal_blow.agent`; `rd.assailants` | — | — |
| `t39.2` Simpson's motive | partial | nothing | Simpson's betting is a card (`c.simpson_background`); the motive is the police theory's (`simpson.purpose` = steal). Harmless as it is. | — |
| `t40.3` Mapleton's motive | partial | nothing | `c.mapleton_interest` and `c.brown_bets` (¶40) hold it. | **A4**: map `c.mapleton_interest`. |
| `t60.3` the cravat picked up | partial | `k.cravat_order`, `e.cravat_picked_up` | The reading `rd.cravat` is the hypothesis's own slot. | **A5**: add `rd.cravat`. |
| `t81.3` why the knife | accurate | `e.knife_taken.purpose`; `rd.knife`; `pz.knife` | — | — |
| `t84.4` who Derbyshire is | accurate | `william_derbyshire.identity`; `rd.derbyshire`; `pz.bill` | — | — |
| `t102.3` why the match | missing, now | `k.vesta_from_strakers_box` | {pipe, candle and work}: no slot says what the light was for, so neither a reading nor the candle's puzzle (`t78.3`) exists. | **C1**: a facet `e.light_struck.purpose` {pipe, work}; a puzzle `pz.candle` (`c.pocket_inventory`, `t78.3`); map `t102.3`. |
| `t127.4` the track's man | accurate | `track_man.identity`, `k.found_at_dawn` | — | — |
| `t141.1` "change it" | accurate | `silver_blaze.disguised` | — | — |
| `t163.3` the question to the maid | missing, later (ws 7) | `a.question_maid` | The player writing Holmes's question is a TEST PLAN move. | — |

## Hypotheses: scenarios (theories)

| Thought | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|
| `t39.4`, `t46.1` the police | accurate | `t.police`; its cost (Simpson's word, from ¶104 Holmes's dish step); its residue (`t46.3`'s puzzles) | Strained by `t46.3` (residue, held), `t58.4` (patches, below), `t97.2` (the coat: `pz.coat`, `rd.coat`), `t120.1` (no human tracks: not a puzzle; it is an inference the police cost includes from ¶231). Refuted by `t212.3` (the cost from ¶202). | — |
| `t46.4` Straker took the horse | partial | a player's theory (Q1) | Maps nothing. Its one answer is `e.horse_led_out.agent` = Straker, and its "against: his reputation" is held: its cost includes Straker's record (`t19.4`, `strained_by`). | **A6**: map `e.horse_led_out.agent`. |
| `t62.2` the gypsies | accurate | `t.gypsies`, `k.gregory_gypsies`; dropped by `t62.4` | — | — |
| `t66.3` Brown organised it | accurate (as the player's) | a player's theory; `t68.2`'s out-explained check | Not authored, by Q1. | — |
| `t92.6` the inside story | accurate (as the player's) | a player's theory; the fixture of `engine/hypotheses.test.js` | Not authored, by Q1 (C13 answered no). | — |

## WEIGH, graded (the "ws 6" rows)

| Thought | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|
| `t19.4` reputation counts a little | accurate | `c.straker_honest_record`; a scenario that needs it wrong pays one item of cost (a report) | — | — |
| `t24.4` a poisoner would not ask openly | missing, later (listed) | nothing | An improbability strain on one candidate. Neither cost nor residue holds it (see "Strains by improbability" below). | — |
| `t26.1` sworn and specific | partial | `c.paper_in_hand` | Held as a statement; "good evidence" is corroboration, listed by the paper (Q2). | — |
| `t36.3` two witnesses agree | partial | both identifications | Corroboration, listed (Q2). | — |
| `t40.7` cuts both ways | accurate | `c.simpson_pale_at_cravat`; the doubt reason `neutral` | A claim never counts for or against a theory in `theorySupport` (inferences only), so its neutrality holds by construction. | — |
| `t58.4` held up by patches | **missing, now** | nothing | Q3 promised that the tray marks an answer that rests on nothing held. It was not built. And Gregory's patches are not answers of `t.police`: its label says "a duplicate key", its assignment does not. | **C2** (a feature): mark a theory's *assumed* answers (no held card gives them) and count them with the cost. **B1** (a question for Robert, below): give `t.police` its duplicate key. |
| `t60.2` unverifiable | accurate | `c.simpson_lost_cravat` (truth slot) | The "if true" half is the cravat reading's (`rd.cravat`). | — |
| `t84.5` fits "alias" equally | accurate | `k.mrs_straker_believes_friend`; `pz.bill`, explained by both "a friend's" and "his own under another name" | That is the thought: her evidence explains the bill either way. | — |
| `t120.2` consistent, not proof | missing, later (listed) | nothing | Support by consistency. The horse's scenario costs nothing at ¶120; no mechanism says "a little more likely". | — |
| `t135.1` (was `t133.2`) a violent denial | partial | `k.brown_lied` (¶140) | C11 of the first review: `r.guilty_denial` and a ¶135 inference. This is workstream 3's machinery (a default with exceptions), not workstream 6's. | **C3**: `r.guilty_denial` (default, "commonly taken to …", leak-checked) and a ¶135 inference that Brown's denial is false; map `t135.1`. |

## WEIGH and DEFAULT (the "ws 3" rows)

| Thought | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|
| `t4.2` one culprit | accurate | `k.one_culprit` (Round 111) | — | — |
| `t32.4` a gloss | partial | nothing | Could be split; to little effect (first review). | — |
| `t34.3` sound sleepers | accurate | the raise `barked_unheard` on `k.dog_knew_the_visitor` (a reservation) | — | — |
| `t35.6` an inference written as fact | accurate | the split parts of `c.straker_defended_himself`; the reason `inference-as-fact`; `rd.assailants` | — | — |
| `t36.2` Hunter could not have seen | accurate | `k.hunter_could_not_see` | — | — |
| `t40.4` Mapleton by reach | accurate | `k.horse_at_mapleton_by_reach` | The first review's label point stands (reach only). | — |
| `t40.6` wet clothes | accurate | `c.simpson_clothes_wet` | — | — |
| `t56.1` Gregory's case item by item | accurate | the police's cost (Hunter's charge, the hope of exercise) and residue (`pz.one_blow`, `pz.key`); `rd.cravat`; `t36.2`, `t40.6` | Each item is now somewhere the player sees it, on Easy by name. | — |
| `t62.3` they would leave anyway | accurate | `k.gypsies_would_leave_anyway` | — | — |
| `t68.3` one culprit splits | accurate | the doubt of `k.one_culprit`, reason "two stories" | Unscored (Holmes never says it). | — |

## TEST

| Thought | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|
| `t37.11` the maid's strained picture | partial | the maid's "more hands" check against a rival | Half of it is held (the night needs two people under the maid). "A maid leading a racehorse at one" is an improbability (listed). | — |
| `t37.12` missing despite the reward | partial | nothing; `pz.not_found` names it as its thought | **A7**: map `pz.not_found`. |
| `t41.2`, `t44.2`, `t54.1` | accurate | `k.knife_marks_assailant`, `k.only_one_blade`, `c.gregory_self_wound` | — | — |
| `t57.1` Holmes's objections | partial | nothing | Items 3, 4 and 5 are puzzles (`pz.key`, `pz.led_out`, `pz.not_found`). | **A8**: map the three. |
| `t64.2` the search found nothing | partial | nothing | The card is `c.mapleton_searched_nothing`. Its strain on Mapleton is an improbability (listed); `t64.3`'s disguise undercuts it, and `pz.not_found` is the same fact seen from the other side. | **A9**: map `c.mapleton_searched_nothing`. |
| `t66.2` Brown adds motive | partial | nothing | `c.brown_bets`. | **A10**: map `c.brown_bets`. |
| `t92.4`, `t102.2`, `t114.3`, `t146.2`, `t173.2`, `t202.2`, `t218.2`, `t219.1`, `t220.2`, `t221.2`, `t223.1`, `t224.1`, `t229.2` | accurate | the inference, rule or claim Holmes states | — | — |
| `t117.2` towards Mapleton | partial | nothing | `k.horse_goes_home` (¶117) is the confirmation. | **A11**: map it. |
| `t161.2`, `t182.2` | accurate as actions; scoring missing, later (ws 7) | `a.keep_horse_entered`, `a.point_out_dog` | Sealed predictions are workstream 7's. | — |
| `t212.2` the hardest step scores | partial | nothing | `k.horse_kicked`. | **A12**: map it. |
| `t214.2` "self-defence" | partial | nothing | Holmes's line (¶214) has no claim; its RECORD `t214.1` maps `c.holmes_names_horse`. The strain on Straker's record is held by the cost (the record is in the inside story's cost to ¶220). | — |
| `t216.2` Holmes was behind | missing, later (ws 8) | nothing | A GENRE confirmation. | — |
| `t225.1` the Derbyshire chain | partial | nothing | `k.derbyshire_is_straker`, `k.second_household`. | **A13**: map them. |
| `t228.1` the sheep | partial | nothing | `k.practice_first`. | **A14**: map it. |
| `t231.1` the amnesty | partial | nothing | `k.horse_left_alone`, `k.tracks_end_at_mapleton`. | **A15**: map them. |

## DROP, REVISE, RESIDUE

| Thought | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|
| `t58.3` the paper was money | accurate | `dropped` (a card; deadline ¶104) | — | — |
| `t62.4` the gypsies | accurate | `dropped` (a card, `k.gypsies_did_not_take_him`) | Its residue half ("explains nothing about the curry or the dog") is held by the residue, not by the drop's reason. The thoughts report lists the premise disagreement (`t46.3` cited, not a premise). | — |
| `t68.2` Brown as organiser | accurate (as the player's) | the out-explained check (tested on the fixture) | No game target, so unscored. | — |
| `t92.7` the maid | accurate | `dropped` (more hands; deadline ¶104) | — | — |
| `t37.6` the curry matters | partial | `r.curry_masks`, `r.opium_taste` | The curry's puzzle names it as its thought. | **A16**: add `pz.curry`. |
| `t84.8` the motive | accurate | `r.laying_against` | — | — |
| `t212.3`, `t226.2` | accurate | the readings (Round 117) | — | — |
| `t46.3` the police residue | accurate | eight puzzles | Item 4 (why take the horse out) is explained by theft (listed, Round 115). | — |

## Summary

| Verdict | Count |
|---|---|
| accurate | 53 |
| partial | 23 |
| wrong | 1 (`t35.9`) |
| missing, now | 2 (`t58.4`, `t102.3`) |
| missing, later | 6 (`t24.4`, `t120.2`: listed; `t163.3`, `t161.2`, `t182.2`: ws 7; `t216.2`: ws 8) |

Most partials are TESTs and HYPOTHESES with nothing mapped where a card now holds them: annotation fixes only.

**Strains by improbability** (`t24.4`, `t37.11`'s second half, `t64.2`, `t120.2`) are the one kind of reasoning that
workstream 6 did not give a mechanism. The paper's fifth way a story loses ("it paints an unlikely picture") has
cost and residue for the first four ways, and nothing for this one. There are three options:
- **(a) Leave it authored** (the thoughts say it; the game does not). This is my recommendation: these are weak,
  "a flag, an itch", and Q4 agreed that strain gates nothing.
- **(b) Heuristic rules applied to a scenario's answers** (workstream 3's machinery): "a maid does not commonly lead
  a racehorse at night" set aside in a scenario's cost as class 1. Each needs a rule, a leak check, and a formula
  over the scenario's answers.
- **(c) Likelihoods.** A different engine.

## A question for Robert

**B1. Should `t.police` include its duplicate key?** The police's label says Simpson "let himself in with a duplicate
key"; its assignment does not say it.
- **(a) Add `e.stable_entered.instrument` = `duplicate_key`.** The police then explain the locked door, by an
  answer no card gives (C2 marks it assumed). This is `t57.1`'s "has a duplicate key been found?" and `t58.4`'s
  patches. `t46.3`'s item 3 moves from the residue to the assumptions.
- **(b) Leave it out.** The locked door stays in the police's residue, as `t46.3` lists it.

I recommend (a) with C2: it is how the reader sees it (the police have an answer, resting on nothing), and it gives
`t58.4` a hold. Without C2, (b).

## Fix proposals (gathered by kind)

### A. Annotation fixes (`thoughts.json`; maps only, so `reading-annotated.md` is unchanged)

| # | Thought | Change |
|---|---|---|
| A1 | `t28.3` | map `r.laying_against` |
| A2 | `t35.9` | map `e.coat_off.purpose`, `rd.coat` in place of `e.coat_off.agent` |
| A3 | `t35.10` | add `rd.cravat` |
| A4 | `t40.3` | map `c.mapleton_interest` |
| A5 | `t60.3` | add `rd.cravat` |
| A6 | `t46.4` | map `e.horse_led_out.agent` |
| A7 | `t37.12` | map `pz.not_found` |
| A8 | `t57.1` | map `pz.key`, `pz.led_out`, `pz.not_found` |
| A9 | `t64.2` | map `c.mapleton_searched_nothing` |
| A10 | `t66.2` | map `c.brown_bets` |
| A11 | `t117.2` | map `k.horse_goes_home` |
| A12 | `t212.2` | map `k.horse_kicked` |
| A13 | `t225.1` | map `k.derbyshire_is_straker`, `k.second_household` |
| A14 | `t228.1` | map `k.practice_first` |
| A15 | `t231.1` | map `k.horse_left_alone`, `k.tracks_end_at_mapleton` |
| A16 | `t37.6` | add `pz.curry` |

Each map is checked by `npm run validate-thoughts`. A map to an inference cited as a premise elsewhere can add a
premise disagreement; the thoughts report will show any.

### B. Data

| # | Change | Holds |
|---|---|---|
| B1 | `t.police` gains `e.stable_entered.instrument` = `duplicate_key` (the question above) | `t57.1`, `t58.4` with C2 |

### C. New data and small features

| # | What | Holds |
|---|---|---|
| C1 | facet `e.light_struck.purpose` {pipe, work}; puzzle `pz.candle` (`c.pocket_inventory`, `t78.3`), explained by work; reading `rd.light` | `t102.3`, `t78.3`, `t224.1` |
| C2 | a theory's **assumed answers**: those no held card gives (the working set does not entail them), shown beside the cost ("rests on nothing you hold: the duplicate key") and counted on Medium | `t58.4`, and Q3's promise |
| C3 | `r.guilty_denial` (default) and a ¶135 inference that Brown's denial is false (C11 of the first review) | `t135.1` |

**Suggested batches:**
1. A1–A16 (annotation only);
2. B1 with C2 (or neither);
3. C1;
4. C3.
