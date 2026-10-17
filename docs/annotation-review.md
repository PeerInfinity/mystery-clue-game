# Annotation review: what the case holds of each thought

Status: **IN PROGRESS** (2026-10-17). Scenes s01–s02 written; s03–s10 follow. The mission is in
`docs/kickoff-annotation-review.md`. Nothing here has been changed in the case or the annotation yet: the fixes are
proposals, gathered by kind at the end, for Robert to decide batch by batch.

## How to read this

**Scope:** the 191 thoughts whose tags now have features to hold them: RECORD, INFER, DEFAULT, AGENT, PHYSICAL,
IDENTIFY, NOTICE, ABSENCE, WEIGH, SOURCE, PREDICT and TEST PLAN. Out-of-scope thoughts (HYPOTHESIS, TEST, QUESTION,
GENRE, RESIDUE, SET ASIDE, DROP, REVISE) get a line only where something in the case is wrong today.

**Verdicts:**
- **accurate:** the case holds what the reader thinks, at that paragraph, for those reasons.
- **partial:** some of it is held. The row says which part is not, and what would hold it.
- **wrong:** the case says something else: a different conclusion, a premise the reader cannot have yet, a wrong
  truth value, a quote that does not say it, a date off, a card mapped that is not the thought's.
- **missing, now:** nothing holds it, but the features exist; the row sketches the data.
- **missing, ws N:** nothing holds it, and it needs workstream N (3 defeasibility, 6 hypotheses and graded
  support, 7 predictions and test plans).

**Evidence:** each row was checked against a dump of what holds the thought: its `maps`, its inference's premises,
formula and rule applications, its `notices`, and the claims' `asserts`, `said`, `truth`, chains, parts and
absence filings. The dump also gave the paragraph where the game deals each card, read through with background
facts arriving where relevant and absences filed as soon as they can be. The story text was read at the
thought's paragraph.

**Fix kinds** (the last column): **A** an annotation fix (`thoughts.json` and `reading-annotated.md`: a `maps`,
a `from`, a date, a tag); **B** a data fix (the case's cards); **C** new data for a thought that is missing but
modelable now. "—" is no fix.

## s01 Breakfast at Baker Street (¶1–¶7)

| Thought | Tag | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|---|
| `t4.1` | RECORD | partial | nothing mapped | The two events are dealt at ¶4 as event cards (`e.horse_led_out` "The favourite disappears", `e.straker_dies` "The favourite's trainer dies"), but the thought maps nothing, so the coverage table counts it unheld. | **A1**: map `e.horse_led_out`, `e.straker_dies`. |
| `t4.2` | DEFAULT | missing, ws 3 | `no_inference: workstream-3` | The one-culprit default, broken at `t68.3`. Correctly deferred. | — |

## s02 The train: the facts of the case (¶8–¶46)

### ¶14–¶19: the horse, the stable, the household

| Thought | Tag | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|---|
| `t14.1` | RECORD | **wrong** | `c.no_news_of_horse` (dealt ¶37), `a.wait_for_news` | The thought reads ¶14 ("could long remain concealed", "nothing had been done"); the mapped claim quotes ¶37 ("no news has come of him"). It is one of the four "dealt late" RECORDs, but the late card is the wrong card: ¶14 has its own, `c.holmes_expected_horse_found` ("From hour to hour yesterday I expected to hear that he had been found"), dealt ¶14. | **A2**: map `c.holmes_expected_horse_found` in place of `c.no_news_of_horse` (which stays on `t37.2`, where it belongs). Clears one "dealt late" row. |
| `t18.1` | RECORD | accurate | `c.favourite_odds` | — | — |
| `t18.3` | NOTICE | missing, now (small extension) | nothing | The odd thing is that the horse was *taken*, when laming or hiding would serve. The card is the event `e.horse_led_out` (held from ¶4), but `notices` accepts only clue and entity cards. Holmes ¶57 ("why could he not do it there?"), so it would score. Expectation: none yet; `r.horse_would_wake_sleepers` (¶18) is close but not it. | **C1**: let `notices` name an event card; `t18.3` notices `e.horse_led_out`. Or wait for ¶33's `c.stall_empty` and redate the thought (I recommend the first: the reader has it at ¶18). |
| `t19.1` | RECORD | partial | `c.straker_household`, `c.straker_comfortable` | Reads "a retired jockey" and "five years as jockey and for seven as trainer", held by `c.straker_rode_for_ross` and `c.straker_trainer_seven_years` (both ¶19), not mapped. | **A3**: add both to `maps`. |
| `t19.2` | RECORD | accurate | `c.kp_establishment` | — | — |
| `t19.3` | RECORD | accurate | `c.geography`, `c.mapleton_brown` | — | — |
| `t19.4` | WEIGH | partial | nothing mapped | The reputation is a card: `c.straker_honest_record` ("a zealous and honest servant", Holmes's report and Ross's testimony, truth false, truth slot), asserting `straker.honest` = true. The case holds it as a statement the player may doubt (mistaken: Ross believes it). "Counts a little, no more" is graded support (ws 6); "reputation, not observation" is a doubt reason close to the recorded "hearsay". The lads' "excellent characters" is in `c.kp_establishment`'s text with no slot content, which suits "a little". | **A4**: map `c.straker_honest_record`. Grading waits for ws 6. |
| `t19.5` | INFER | accurate | `k.at_a_stable_in_reach` (¶19) | — | — |

### ¶20–¶31: supper, the stranger, the window, the dog, the lock

| Thought | Tag | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|---|
| `t20.1` | RECORD | accurate | `c.lads_supped_at_house`, `c.stables_locked_at_nine`, `c.hunter_on_guard` | — | — |
| `t20.2` | RECORD | accurate | `c.edith_carried_supper` (with her lantern), `c.curry_for_supper` | — | — |
| `t20.3` | RECORD | accurate | `c.no_liquid` | — | — |
| `t20.4` | NOTICE | accurate | notices `c.curry_for_supper`; Holmes ¶216, scores | — | — |
| `t20.5` | NOTICE | accurate | notices `c.no_liquid`; no Holmes paragraph, cannot score | — | — |
| `t20.6` | INFER | accurate | `k.drugged_in_food` (dealt ¶37, explained) | The date note is right: the question exists only once the drugging is told. | — |
| `t21.1` | RECORD | accurate | `c.stranger_description` | — | — |
| `t21.2` | ABSENCE | missing; does not fit `files` | nothing | Not an in-world absence: nothing failed to happen. It is a gap between two testimonies (her description at ¶21, her recognition at ¶35), a fact about the telling, with no slot content for an absence claim to assert. Expert, leads nowhere, Holmes never. The nearest fit is a notice on `c.edith_knows_cravat`, which would need `notices` allowed on an ABSENCE thought. | **C2** (optional): allow `notices` on ABSENCE thoughts and mark `c.edith_knows_cravat`; it cannot score. Or leave it (my recommendation: leave). |
| `t24.1` | RECORD | partial | `c.stranger_knew_lad_alone`, `c.bribe_to_edith` | Reads "I had almost made up my mind to sleep on the moor" (¶22). No claim holds the stranger's pretence of being lost. The data plan of `docs/knowledge-intention.md` named one (`c.stranger_says_lost`, aim `find_way`, truth false); it was never authored. | **C3**: author `c.stranger_says_lost` (see `t24.2`), map it here. |
| `t24.2` | AGENT | partial | `k.stranger_came_on_purpose`: aim at 21:05 is not `find_way` | The conclusion is held, but the reader's step is "the 'lost' story is a cover": a statement doubted as a lie. With workstream 4 that is a lying reading of the stranger's own words, and the case has no such statement to doubt. | **C3**: `c.stranger_says_lost`, quoted from ¶22 ("Can you tell me where I am? ... I had almost made up my mind to sleep on the moor"), asserting the aim `find_way` at `w.mon_2105`, truth false. A declared belief, `st.the_stranger.believes_stranger_says_lost` = false, from a lie inference over `k.stranger_came_on_purpose`. Trap to check when building: trusted, the claim contradicts the inference's conclusion; that conclusion is derived (clue plus rule), so the clash must not set aside `c.stranger_knew_lad_alone`. Test it before relying on it. |
| `t24.4` | WEIGH | missing, ws 6 | nothing | Graded: strains "drug", supports "money" in `t24.3`'s set. | — |
| `t26.1` | WEIGH | partial | nothing mapped | The sworn line is a card: `c.paper_in_hand` (¶26), no slot content. "Sworn and specific: good evidence" is graded (ws 6). | **A5**: map `c.paper_in_hand`. Then `t37.8`, which cites `t26.1`, gains a premise disagreement (`c.paper_in_hand` is not a premise of `k.drugger_knew_the_dish`, and need not be: the bribe at ¶24 already shows the paper made up). So also drop `t26.1` from `t37.8`'s `from`. |
| `t28.1` | RECORD | accurate | `c.two_horses_for_cup` | — | — |
| `t28.2` | WEIGH | partial | `c.stranger_asked_for_tip` | The card is held; the reading ("a tout after information") is not. The case has the aim `information` (`state_aims`) and the stranger's aim track at `w.mon_2105`, answered `information` but derived only as "not `find_way`". | **C4** (optional): a default rule "one who asks a stable-lad for the straight tip is after information about the horses", and an inference giving `st.the_stranger.aims` = `information` at the window. Supports `t24.2` as the annotation says. Simpson's own account (`c.simpson_came_for_information`, ¶40) already asserts it later. |
| `t29.1` | RECORD | accurate | `c.hunter_went_for_dog`, `c.dog_kept_in_stable`, `c.stranger_gone` | — | — |
| `t29.2` | RECORD | accurate | `c.stranger_leaning_in` | — | — |
| `t29.3` | INFER | accurate | `k.window_drugging_time` (Gregory's conditional) | Cites `t25.1` (a QUESTION, unheld), as it should. | — |
| `t29.4` | PREDICT | partial | nothing mapped | The expectation is a card: `r.dog_barks_at_strangers`, surfacing at ¶29 on the dog. Sealing it as a prediction is ws 7. | **A6**: map `r.dog_barks_at_strangers`. |
| `t31.1` | RECORD | accurate | `c.window_too_small`, `c.door_locked_behind` | — | — |
| `t31.3` | INFER | accurate | `k.later_entry_needs_key` (dealt ¶33, explained) | — | — |

### ¶32–¶34: Straker goes out; the morning; the dog and the alarm

| Thought | Tag | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|---|
| `t32.1` | RECORD | accurate | `c.lads_returned_message`, `c.straker_uneasy` | — | — |
| `t32.2` | RECORD | **wrong** (short) | `c.straker_dressing_at_one`, `c.straker_left_in_mackintosh`, `c.rain_heard` | Reads "he intended to walk down to the stables to see that all was well", which is the same sentence as `c.straker_said_anxious` ("he said that he could not sleep on account of his anxiety about the horses", ¶32). That claim is not mapped. **This is the cause of `t32.3`'s premise disagreement:** `t32.3` cites `t32.2`, and `t32.2` does not hold the statement its inference rests on. | **A7**: map `c.straker_said_anxious` on `t32.2`. |
| `t32.3` | SOURCE | accurate once A7 | `k.mrs_straker_passes_in_good_faith`; chain Straker → Mrs. Straker | Premise disagreement 1 of 8: the annotation's chain is right and the data short (A7). The case's chain stops at Mrs. Straker; the annotation's goes on to the police, the papers and Holmes. Nothing turns on the later links (each passes the statement on in good faith), so I would not add them. | A7 |
| `t32.4` | WEIGH | missing, now (low value) | nothing | "He does not seem to have quite realized its true significance" is the narrator's gloss inside `c.straker_uneasy`'s line. It is modelable as a split (`parts`): the seen part (excited, uneasy) and the gloss (an inference written as fact). The gloss has no slot content, so the split would carry a doubt reason and nothing else until ws 3. | **C5** (optional, low): parts on `c.straker_uneasy`. My recommendation: leave until ws 3 gives the undercut some logic. |
| `t33.1` | RECORD | accurate | `c.stall_empty`, `c.hunter_stupor`, `c.stable_door_open` | — | — |
| `t33.2` | INFER | accurate | `k.door_opened_with_key` | — | — |
| `t34.1` | RECORD | **wrong** | `c.lads_heard_nothing`, `c.dog_did_nothing`, `c.no_alarm` | A RECORD of "they had heard nothing" maps the two absences, which are the player's filings (`t34.2`, and the alarm under `t34.5`), not what a typical reader records. Through `from`, every thought citing `t34.1` silently gets the absences. `c.no_alarm` was put here in Round 83 so that `t34.5` would cite its premise. | **A8**: `t34.1` maps `c.lads_heard_nothing` only. The alarm absence gets a thought of its own (the annotation never tagged it, `docs/noticing-absence.md`): **`t34.8` ABSENCE** · *fair* · careful · from `t34.1`, `t32.2`, `t33.1`, `bk.alarm`, maps `c.no_alarm`: "Nobody raised the alarm in the night: the lads slept until seven." `t34.5` then cites `t34.8`. (Alternative: `t34.5` maps `c.no_alarm` itself.) `t34.7` cites `t34.2`, which already maps the dog. |
| `t34.2` | ABSENCE | accurate | `c.dog_did_nothing`, filed (`r.dog_barks_at_strangers`, the stable hour, the lads) | — | — |
| `t34.3` | WEIGH | missing, ws 3 | nothing | The undercut ("sound sleepers"). The line is inside `c.lads_heard_nothing`. | — |
| `t34.5` | AGENT | accurate, with a premise disagreement | `k.straker_raised_no_alarm`: if Straker came into the stable, he was not honest | Premise disagreement 2 of 8: cites `t32.2` (he went out at one, to the stables by his own account), which the conditional does not need. The thought's "by his own account to the stables" is why the reader asks the question, not a premise of the answer. The annotation is the long side. | **A9**: drop `t32.2` from `from`; keep the sentence in the text. With A8, cite `t34.8`. |
| `t34.7` | DEFAULT | accurate | `k.dog_knew_the_visitor`; gate ¶182 | — | — |

### ¶35–¶37: the hollow, the body, the cravat, the opium

| Thought | Tag | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|---|
| `t35.1` | RECORD | accurate | `c.coat_on_bush_seen` | — | — |
| `t35.2` | RECORD | accurate | `c.head_shattered`, `c.body_in_hollow` ("a blow", one event) | — | — |
| `t35.3` | RECORD | accurate | `c.thigh_cut` | — | — |
| `t35.4` | RECORD | accurate | `c.knife_in_right_hand` | — | — |
| `t35.5` | RECORD | accurate | `c.edith_knows_cravat`, `c.cravat_in_left_hand` | — | — |
| `t35.6` | WEIGH | accurate (for ws 4) | the two parts of `c.straker_defended_himself`, both the police's reading, false | "Re-file it as the police reading" is the split. The doubt reason "an inference written as fact" is recorded; its logic is ws 3. | — |
| `t35.8` | NOTICE | accurate | notices `c.coat_on_bush_seen`; Holmes ¶226, scores | — | — |
| `t36.1` | RECORD | accurate | `c.hunter_blames_stranger` (with `said`), `c.hunter_knows_cravat` | — | — |
| `t36.2` | WEIGH | partial | `c.hunter_blames_stranger`: truth false, believed (`said`), so "mistaken" fits and "lying" clashes | "Downgrade it to 'Hunter believes'" is held. "He could not have seen it" is a recorded reason with no logic (ws 3 undercut). | — (ws 3) |
| `t36.3` | WEIGH | partial | nothing mapped | Both identifications are cards (`c.edith_knows_cravat`, `c.hunter_knows_cravat`), true. "Two witnesses agree" is corroboration (ws 6). | **A10**: map both. |
| `t37.1` | RECORD | accurate | `c.horse_was_in_hollow` | — | — |
| `t37.2` | RECORD | accurate | `c.no_news_of_horse`, `c.reward_offered` | One caution: `c.no_news_of_horse` asserts the horse is not hidden at King's Pyland. "No news has come of him" says it only by reading (they would know at home). Acceptable. | — |
| `t37.3` | RECORD | accurate | `c.household_same_dish`, `c.opium_in_remains`, `c.opium_in_portion_only`, `c.hunter_ate_drugged` | — | — |
| `t37.4` | INFER | accurate | `k.drugged_after_set_aside` | — | — |
| `t37.5` | INFER | accurate | `k.taker_had_a_key` | — | — |
| `t37.7` | DEFAULT | accurate | `k.drugger_knew_the_menu` | — | — |
| `t37.8` | INFER | accurate | `k.drugger_knew_the_dish` | See A5: drop `t26.1` from `from` if `t26.1` is mapped. | A5 |
| `t37.14` | DEFAULT | accurate | `k.menu_choosers` | — | — |
| `t37.15` | DEFAULT | accurate | `k.drugger_chose_the_dish` | — | — |
| `t37.16` | INFER | accurate | `k.drugger_took_the_horse` | — | — |

### ¶39–¶46: Simpson, Watson's suggestion, the police theory

| Thought | Tag | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|---|
| `t39.1` | RECORD | accurate | `c.simpson_background`, `c.betting_book_5000`, `c.simpson_lives_at_villas` | — | — |
| `t40.1` | RECORD | accurate | `c.simpson_came_for_information` (truth slot) | — | — |
| `t40.2` | RECORD | accurate | `c.simpson_pale_at_cravat`, `c.simpson_clothes_wet`, `c.simpson_stick` | — | — |
| `t40.4` | INFER | partial | `k.horse_at_mapleton_by_reach` (dealt ¶37) | The thought is "motive, means to hide, and two miles away"; the inference is reach only (`k.at_a_stable_in_reach` plus no news), so the case has it at ¶37, three paragraphs before the reader's ¶40. Mapleton's motive (`t40.3`, a HYPOTHESIS) is not held, which is right for now (ws 6). But the inference's label claims it: "which also has every reason to keep him from running". | **B1**: cut that clause from the label (it is not among the premises). |
| `t40.5` | NOTICE | missing, now | nothing | "By repeated blows" against "a savage blow". Both cards are held at ¶40 (`c.simpson_stick`, whose text carries the police's "by repeated blows", and `c.head_shattered`). No Holmes paragraph, so it cannot score. | **C6**: `notices`: `c.simpson_stick`, `c.head_shattered`. |
| `t40.6` | WEIGH | partial | nothing mapped | `c.simpson_clothes_wet` asserts `simpson.out_in_storm`, an untimed slot: the case already says nothing about one o'clock, which is the reader's point. Holding the point as a doubt (of the police's use) is ws 3. | **A11**: map `c.simpson_clothes_wet`. |
| `t40.7` | WEIGH | accurate once mapped | nothing mapped | `c.simpson_pale_at_cravat` has no slot content: the case already treats it as neutral, as the reader does. "It cuts both ways" is a recorded doubt reason. | **A12**: map `c.simpson_pale_at_cravat`. |
| `t41.1` | RECORD | accurate | `c.simpson_no_wound` | — | — |
| `t44.1` | RECORD | accurate | `c.watson_self_wound` (¶43), `r.convulsions_after_brain_injury` | — | — |
| `t46.2` | INFER | accurate | `k.bridled_by_taker` | "Someone who knew how" (a horseman) is not held; nothing turns on it. | — |
| `t46.7` | INFER | accurate | `k.drugging_is_dishonest` | — | — |

**Out of scope, s01–s02:** nothing wrong found in the HYPOTHESIS, QUESTION, GENRE, TEST, REVISE and SET ASIDE
thoughts' maps.

## Fix proposals so far (gathered by kind)

### A. Annotation fixes (`thoughts.json` and `reading-annotated.md`)

| # | Thought | Change | Why |
|---|---|---|---|
| A1 | `t4.1` | maps `e.horse_led_out`, `e.straker_dies` | held at ¶4, unmapped |
| A2 | `t14.1` | maps `c.holmes_expected_horse_found` instead of `c.no_news_of_horse` | the ¶14 card; clears a "dealt late" row |
| A3 | `t19.1` | add `c.straker_rode_for_ross`, `c.straker_trainer_seven_years` | read, unmapped |
| A4 | `t19.4` | maps `c.straker_honest_record` | the reputation is a card |
| A5 | `t26.1`, `t37.8` | `t26.1` maps `c.paper_in_hand`; drop `t26.1` from `t37.8`'s `from` | the sworn line is a card; `t37.8` does not need it |
| A6 | `t29.4` | maps `r.dog_barks_at_strangers` | the expectation is a card |
| A7 | `t32.2` | add `c.straker_said_anxious` | read, unmapped; resolves premise disagreement `t32.3` |
| A8 | `t34.1`, new `t34.8` | `t34.1` maps `c.lads_heard_nothing` only; new ABSENCE `t34.8` maps `c.no_alarm`; `t34.5` cites it | a RECORD should not hold the player's filings |
| A9 | `t34.5` | drop `t32.2` from `from` | resolves premise disagreement `t34.5` |
| A10 | `t36.3` | maps `c.edith_knows_cravat`, `c.hunter_knows_cravat` | held, unmapped |
| A11 | `t40.6` | maps `c.simpson_clothes_wet` | held, unmapped |
| A12 | `t40.7` | maps `c.simpson_pale_at_cravat` | held, unmapped |

### B. Data fixes (case cards)

| # | Card | Change | Why |
|---|---|---|---|
| B1 | `k.horse_at_mapleton_by_reach` | cut "which also has every reason to keep him from running" from the label | not among its premises |

### C. New data (missing, modelable now)

| # | Thought | Data | Recommendation |
|---|---|---|---|
| C1 | `t18.3` | `notices` may name an event card; `t18.3` notices `e.horse_led_out` (Holmes ¶57, scores) | do |
| C2 | `t21.2` | `notices` on an ABSENCE thought, marking `c.edith_knows_cravat` | leave |
| C3 | `t24.1`, `t24.2` | `c.stranger_says_lost` (¶22, aim `find_way`, false), a declared belief (false), a lie inference | do, testing the clash first |
| C4 | `t28.2` | a tout rule and the stranger's aim `information` at the window | optional |
| C5 | `t32.4` | parts on `c.straker_uneasy` (seen versus the narrator's gloss) | leave until ws 3 |
| C6 | `t40.5` | `notices`: `c.simpson_stick`, `c.head_shattered` | do |
