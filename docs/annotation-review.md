# Annotation review: what the case holds of each thought

Status: **REVIEW COMPLETE** (2026-10-17): every thought in scope has a verdict. The fix batches await Robert. The mission is in
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

## s03 Tavistock and the drive with Gregory (¶47–¶69)

| Thought | Tag | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|---|
| `t52.1` | RECORD | missing, now (low value) | nothing | Gregory's "the evidence is purely circumstantial" has no card; it is a judgment with no slot content. | **C7** (optional): a claim with no `asserts`, Gregory's testimony. My recommendation: leave; a coverage gap only. |
| `t56.1` | WEIGH | missing, ws 3 | nothing | Gregory's case item by item. Each item is a card already (`c.hunter_blames_stranger`, `c.simpson_clothes_wet`, `c.simpson_stick`, `c.cravat_in_left_hand`, `c.betting_book_5000`); the item-by-item undercuts are ws 3. | — |
| `t57.2` | NOTICE | missing; no plain card | nothing | The "detail" is Holmes's own question, not something in the world. It reads as GENRE (Holmes puts injury on the table). | — (leave; ws 8 if anywhere) |
| `t58.1` | RECORD | accurate | `c.simpson_ten_pound_note` (truth slot) | — | — |
| `t58.2` | RECORD | accurate | `c.simpson_summers`, `c.no_chemist_found`, `c.no_duplicate_key_found` | "The horse may be at the bottom of one of the pits" has no card; nothing turns on it. | — |
| `t58.4` | WEIGH | missing, ws 6 | nothing | "A theory held up by patches is losing": a strain. The case agrees in its way: Gregory's three patches carry no slot content. | — |
| `t60.1` | RECORD | accurate | `c.simpson_owns_cravat`, `c.simpson_lost_cravat` (truth slot) | — | — |
| `t60.2` | WEIGH | partial | nothing mapped | "Unverifiable" is held: `c.simpson_lost_cravat` has a truth slot. "If true, most likely lost near the stables" is graded (ws 6); `k.cravat_worn_at_window` (implicit) already fixes "no earlier than the window scene". | **A13**: map `c.simpson_lost_cravat`. |
| `t60.4` | INFER | accurate | `k.cravat_order` | — | — |
| `t62.1` | RECORD | accurate | `c.gypsies_camped`, `c.gypsies_gone` | — | — |
| `t62.3` | DEFAULT | **wrong** | `k.gypsies_did_not_take_him`, by `r.gypsies_avoid_trouble`: "a band that has gone did not take the horse with it" | The thought says the departure **points at nothing**: under the period belief they would leave either way (an undercut of `t62.2`, ws 3). The case concludes from the departure that they did not take him, which is the opposite use of it. Holmes's own argument (¶114) is not from the departure either: they keep clear of the police and "could not hope to sell such a horse", so they would not take him. The reader's conclusion is `t62.4` (DROP), from `bk.gypsies` and `bk.famous_horse`. | **B2**: reword the rule as Holmes argues it ("(A prejudice of the period.) Gypsies were said to keep clear of anything that would bring the police on them: they would not steal a horse they could never sell"), its schema over the band and the hiding, not the leaving, with `r.famous_horse_unsellable` among the inference's premises. **A14**: `t62.3` gets `no_inference: workstream-3`; the inference moves to `t62.4`, which needs DROP allowed to name an inference (a dropped candidate is a conclusion "not X"), or to `t114.3` (TEST, Holmes ¶114). `t114.3` and `t62.4` today map `k.horse_goes_home`, the horse-instinct step, which is not about the gypsies. Your call on where the inference sits. |
| `t64.1` | RECORD | accurate | `c.stables_within_ten_miles` | — | — |
| `t66.1` | RECORD | accurate | `c.brown_bets`, `c.mapleton_searched_nothing`, `c.desborough_second` | — | — |
| `t68.1` | RECORD | accurate | `c.no_simpson_mapleton_link` | — | — |
| `t68.3` | IDENTIFY | missing, ws 3 | `no_inference: workstream-3` | — | — |

**Out of scope, s03:** `t62.4` (DROP) and `t114.3` map `k.horse_goes_home` for the gypsies' drop; see A14.

## s04 Straker's villa: the pockets and Mrs. Straker (¶70–¶92)

| Thought | Tag | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|---|
| `t78.1` | RECORD | accurate | `c.pocket_inventory` | — | — |
| `t78.2` | INFER | accurate | `k.not_a_robbery` | "Nobody searched him" is not held; nothing turns on it. | — |
| `t78.3` | NOTICE | accurate | notices `c.pocket_inventory`; Holmes ¶224, scores | — | — |
| `t78.4` | ABSENCE | missing; fits `files`, weakly | nothing | It fits the format: an expectation (a new default, "a man who goes out over the open moor on a very dark night takes a lantern", from ¶20, where Edith takes one "as it was very dark"), the windows from one o'clock, a false proposition (`p.straker_took_lantern`). The weak part is the witness: `c.pocket_inventory` lists his pockets, and a lantern is carried in the hand; no line lists what lay in the hollow. The rule's exception ("unless he did not want his light seen") is the insight, and `r.light_hidden_in_hollow` already carries the hidden light. Expert, Holmes never. | **C8** (optional): as sketched. My recommendation: leave, as Round 82 did; the witness would be a closed-world reading of the inventory. |
| `t78.5` | PREDICT | partial | nothing mapped | The check is Holmes's action `a.search_mud` ("looking for a match"), already mapped by `t92.9`. Sealing is ws 7. | **A15**: map `a.search_mud`. |
| `t81.1` | RECORD | accurate | `c.knife_is_cataract_knife` (¶80), `c.knife_delicate` | — | — |
| `t81.2` | NOTICE | accurate | notices both knife cards; Holmes ¶81, cannot score | — | — |
| `t81.4` | AGENT | accurate | `k.knife_not_a_weapon` | — | — |
| `t81.5` | INFER | accurate | `k.knife_for_an_operation` (conditional on Straker taking the horse) | "By candle" is not among its premises; `k.operation_in_the_open` carries "away from the sleepers". Fine. | — |
| `t82.1` | RECORD | accurate | `c.knife_from_dressing_table`, `c.gregory_poor_weapon`, `c.cork_by_body` | — | — |
| `t82.2` | WEIGH | **wrong** (mapping) | maps `k.knife_for_an_operation` | That inference is `t81.5`'s and uses neither card the thought weighs. What the thought weighs is held: Mrs. Straker's report (`c.knife_from_dressing_table`, true, her belief latent and sincere) and Gregory's "best he could lay his hands on" (`c.gregory_poor_weapon`, truth false, truth slot: the "mistaken" reading with the reason "an inference written as fact"). | **A16**: map `c.knife_from_dressing_table`, `c.gregory_poor_weapon` instead. |
| `t82.3` | INFER | accurate | `k.knife_bared` | — | — |
| `t82.4` | NOTICE | missing, now | nothing | The card is plain: `c.knife_from_dressing_table`. No Holmes paragraph, so it cannot score. | **C9**: `notices`: `c.knife_from_dressing_table`. |
| `t84.1` | RECORD | accurate | `c.milliner_bill`, `c.papers_in_pocket` | — | — |
| `t84.2` | RECORD | accurate | `c.derbyshire_a_friend` (splits into her own observation and what she was told) | — | — |
| `t84.3` | NOTICE | accurate | notices `c.milliner_bill`; expectation `r.others_bills`; Holmes ¶225, scores | — | — |
| `t84.5` | SOURCE | partial | `k.mrs_straker_believes_friend`; the "friend" part's chain (Straker → Mrs. Straker) | The chain and the good faith are held. "Her evidence fits 'alias' equally well" rests on `bk.alias_post`, which has no rule; it is graded (ws 6). | — (a rule `r.alias_post` could come with ws 6) |
| `t84.6` | IDENTIFY | accurate, with a premise disagreement | `k.derbyshire_is_straker` | Premise disagreement 3 of 8: cites `t84.5`, which the inference does not need. **The annotation is right.** Trusted, Mrs. Straker's statement says Derbyshire is not Straker, so the merge needs her statement weighed and set aside: that is `t84.5`'s work. The format has no way to say "this step needs that statement doubted"; in play a clash sets the story clue aside by itself. | **B4** (checker): a cited WEIGH or SOURCE thought whose inference is a belief about a statement counts as covered when that statement contradicts the conclusion (a defeater weighed) or is a premise (trust weighed). Resolves this one and `t92.4`. |
| `t84.7` | NOTICE | partial | notices `c.milliner_bill`; maps `k.second_household` | The notice is right. `k.second_household` is `t92.15`'s inference and needs the dress test (¶92); the reader at ¶84 has the suspicion, not the conclusion. | **A17**: drop `k.second_household` from `t84.7`'s `maps`. |
| `t84.9` | DEFAULT | accurate | `k.bill_is_his_own` | — | — |
| `t85.1` | RECORD | accurate | `c.bill_22_guineas` | — | — |
| `t85.3` | TEST PLAN | accurate (ws 7 for sealing) | `a.dress_trick` | — | — |
| `t92.1` | RECORD | accurate | `c.wife_never_had_dress`, `c.holmes_plymouth_ruse` | — | — |
| `t92.2` | INFER | accurate | `k.dove_silk_on_the_bill` | — | — |
| `t92.3` | WEIGH | accurate | `k.wife_denies_in_good_faith` | — | — |
| `t92.5` | TEST PLAN | accurate (ws 7) | `a.request_photograph`, `a.visit_milliner` | — | — |
| `t92.9` | PREDICT | accurate (ws 7) | `a.search_mud` | — | — |
| `t92.10` | PREDICT | accurate (ws 7) | `a.examine_coat` | — | — |
| `t92.11` | PREDICT | accurate (ws 7) | `a.search_wet_hollow` | — | — |
| `t92.12` | PREDICT | accurate (ws 7) | `a.visit_milliner` | — | — |
| `t92.13` | PREDICT | accurate (ws 7) | `a.keep_horse_entered` | — | — |
| `t92.14` | AGENT | accurate | `no_inference: action`; `a.ask_about_sheep`, `k.practice_first` | — | — |
| `t92.15` | INFER | accurate | `k.second_household` | — | — |

**Out of scope, s04:** `t92.4` (TEST) has premise disagreement 4 of 8: it cites `t92.3`, her honest denial, which
`k.dresses_for_the_other_woman` does not need. As with `t84.6`, the annotation is right (the denial is trusted
because it is weighed honest) and B4 resolves it. **`t92.8`** (QUESTION, "who drugged: Straker or his wife?") is
not open in the case; see the s10 note on `t220.3`.

## s05 The hollow (¶93–¶113)

| Thought | Tag | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|---|
| `t93.1` | RECORD | partial | nothing mapped | A scene-setting line; the hollow and the bush are cards (the entity `fatal_hollow`; `c.coat_on_bush_seen`). Nothing new. | **A18**: map `fatal_hollow`. |
| `t95.1` | RECORD | accurate | `c.no_wind` | — | — |
| `t96.1` | PHYSICAL | accurate | `k.coat_placed`; gate ¶96 | — | — |
| `t97.1` | RECORD | accurate | `c.coat_laid_across` | — | — |
| `t97.2` | AGENT | accurate, with a premise disagreement | `k.coat_off_to_work` | Premise disagreement 5 of 8: cites `t35.6` (the papers' "defended himself against his assailants"), which the inference does not need. `t35.6` is what this step **strains**, not what it rests on. The annotation is the long side. | **A19**: move `t35.6` from `from` to a relation (`strains: t35.6`). |
| `t99.1` | RECORD | accurate | `c.matting_laid` | — | — |
| `t100.1` | NOTICE | missing, now (low value) | nothing | A physical inference more than a notice. The card would be `c.matting_laid`; no Holmes paragraph. | **C10** (optional): `notices`: `c.matting_laid`. |
| `t101.1` | RECORD | accurate | `a.take_bag` (the boot, the shoe, the horseshoe as items) | — | — |
| `t101.2` | TEST PLAN | accurate (ws 7) | `a.compare_boots` | — | — |
| `t102.1` | RECORD | accurate | `c.vesta_in_mud` | — | — |
| `t102.4` | INFER | accurate | `k.horse_kicked` | — | — |
| `t107.1` | RECORD | accurate | `c.boots_compared` | — | — |
| `t107.2` | ABSENCE | partial | nothing mapped | A narrative omission (disclosure typing, ws 8), not the player's to file. `a.question_maid` already carries a marker for its untold result (`yields.unknown`); `a.compare_boots` does not. | **B5**: `a.compare_boots` gains `yields.unknown` ("The text never says what the comparison showed"); `t107.2` maps it. |
| `t108.1` | RECORD | accurate | `c.no_more_tracks` | — | — |
| `t109.1` | RECORD | missing (low value) | nothing | Holmes pocketing the horseshoe is behaviour (GENRE, `t109.2`); no card. | — (leave) |
| `t111.1` | RECORD | accurate | `a.keep_horse_entered` | — | — |

## s06 Across the moor to Mapleton (¶114–¶143)

| Thought | Tag | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|---|
| `t114.1` | RECORD | accurate | `r.horse_gregarious`, `a.reason_about_horse` | — | — |
| `t114.2` | DEFAULT | accurate | `k.horse_goes_home` (dealt ¶37) | Round 79's open item: `r.horse_gregarious` surfaces at ¶18 ("is from the Isonomy stock") as "taken out and loose, it makes for its own stable or the nearest other one ...; that is where it is". At ¶18 the story has not said the horse was taken out, let alone loose; "taken out and loose" and "that is where it is" lean towards the solution (he bolted; he is at a stable). Nothing uses the rule before ¶37 (`c.horse_was_in_hollow`). | **B6**: text in Holmes's words, "A horse is a gregarious creature: left to himself, he makes for his own stable or the nearest other one"; `relevant_from` at ¶37 ("he had been there at the time of the struggle"). No inference date moves. |
| `t116.1` | RECORD | accurate | `c.wet_hollow_exists`, `c.moor_hard_dry` | — | — |
| `t116.2` | NOTICE | partial | maps `r.wet_ground_holds_tracks` | The expectation is held. A notice would mark `c.moor_hard_dry`; Holmes says it in the same paragraph, so it cannot score. It is closer to a PHYSICAL inference answering `t108.2`. | — (leave) |
| `t116.3` | TEST PLAN | accurate (ws 7) | `a.search_wet_hollow` | — | — |
| `t117.1` | RECORD | accurate | `c.horse_track_in_wet_hollow` | — | — |
| `t119.1` | RECORD | accurate | `c.horse_alone` | — | — |
| `t120.1` | INFER | accurate | `k.horse_left_alone` | — | — |
| `t120.2` | WEIGH | missing, ws 6 | nothing | Consistent, not proof: graded. | — |
| `t122.1` | RECORD | **wrong** (date) | `c.double_track_loops`, dealt ¶124 | Two of the four "dealt late" RECORDs. The claim is quoted only from ¶124 ("It ended at the paving of asphalt"), but its text tells the turn (¶122) and the return (¶123) too. Quoting it earlier would run its ¶124 ending ahead of the story. | **B3**: split it in three, each quoted from its own line: the turn towards King's Pyland (¶122), the return (¶123, carrying `e.brown_turns_back`), the end at the Mapleton gates (¶124, carrying `e.horse_hidden`'s agent). `k.track_man_changed_his_mind` then rests on the first two, dealt ¶123 as the reader has it (its date note goes); `k.tracks_end_at_mapleton` on the return and the end. Gates do not move (¶146). |
| `t123.1` | RECORD | **wrong** (date) | as `t122.1` | As `t122.1`. | B3 |
| `t123.2` | AGENT | accurate (date explained) | `k.track_man_changed_his_mind` | With B3 the explained miss goes. | B3 |
| `t124.1` | RECORD | accurate | `c.double_track_loops` | — | B3 |
| `t124.2` | INFER | accurate, with a premise disagreement | `k.tracks_end_at_mapleton` | Premise disagreement 6 of 8 (Round 79's open one): cites `t123.2`, the man's change of mind, which "the horse is at Mapleton" does not need. What it needs from ¶123 is the **return track** (`t123.1`): it is the return that ends at the gates. The annotation names the intention where it means the track. | **A20**: replace `t123.2` with `t123.1` in `from` (with B3, `t123.1` maps the return). |
| `t127.1` | RECORD | accurate | `c.brown_first_up` | — | — |
| `t127.3` | AGENT | accurate | `k.first_up_and_no_subordinate` | — | — |
| `t133.1` | RECORD | partial | `a.confront_brown` | Brown's "It's a lie! an infernal lie!" is a card, `c.brown_denies` (¶133, false, truth slot), not mapped. | **A21**: map `c.brown_denies`. |
| `t133.2` | WEIGH | partial, with a premise disagreement and a date off | `k.brown_lied` (¶140): Brown has the horse (`k.brown_broke`), so he did not believe his denial | Premise disagreement 7 of 8: cites `t133.1`; the inference binds the denial in its rule (Round 87: trusted, it contradicts what Brown did) and rests on `k.brown_broke`. The reader's step is different and earlier: a violent denial "followed at once by an invitation into the parlour" (`bk.guilty_denial`, no rule). The invitation is ¶134–¶135, so the thought's date is **¶135, not ¶133**. And it is graded ("hit something true"), not certain. | **A22**: date ¶135 (`t135.1`). Then either **(a)** keep the inference, with A21 and a checker rule that a statement bound in the inference's rule application counts as cited (B4 extended); the ¶140 date note stays; or **(b)** **C11**: a rule `r.guilty_denial` (default, from ¶133–¶135) and an inference of the lie from the denial and the invitation at ¶135, named by this thought, with `k.brown_lied` marked implicit (certain at ¶140). I recommend (a) now and (b) with ws 6, which grades it. |
| `t137.1` | RECORD | accurate | `a.confront_brown` | — | — |
| `t140.1` | RECORD | accurate | `c.brown_capitulates` | — | — |
| `t140.2` | INFER | accurate | `k.brown_broke` | — | — |
| `t141.2` | PREDICT | missing, ws 7 | nothing | A sealed prediction. The race-day actions (`a.at_the_race`, `a.reveal`) would settle it. | **A23** (optional): map `a.at_the_race`. |

## s07 The walk back (¶144–¶156)

| Thought | Tag | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|---|
| `t146.1` | RECORD | accurate (late disclosure, ws 8) | `c.square_toes` | — | — |
| `t146.3` | RECORD | accurate | `c.silver_blaze_markings` | — | — |
| `t148.1` | RECORD | partial | maps `r.disguise_washes_off` | Holmes's "an old horse-faker like him has many a dodge" has no card; the rule (dealt ¶18) stands in for it. Fine for the inference (`k.disguised_to_survive_search` is dealt ¶66, the date of the expert `t64.3`). | — |
| `t148.2` | INFER | accurate | `k.disguised_to_survive_search` | — | — |
| `t150.1` | AGENT | accurate, with a premise disagreement | `k.brown_keeps_horse_safe`, from `c.brown_hope_of_mercy` (the thought's own line) | Premise disagreement 8 of 8: cites `t140.1` (Brown gives in), which the inference does not need. The thought reads Holmes's ¶150 line and is dated there; the capitulation is context. The alternative, an earlier step from the capitulation alone at ¶140, would be a different thought (the reader ahead of Holmes). | **A24**: drop `t140.1` from `from`. |
| `t156.1` | RECORD | accurate | `a.return_to_london` | — | — |

## s08 Departure: the photograph, the sheep, the dog (¶157–¶182)

| Thought | Tag | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|---|
| `t161.1` | RECORD | **wrong** (mapping) | `a.request_photograph`, `c.photograph_available` (dealt ¶162) | The fourth "dealt late" RECORD. ¶161 is Holmes's hope that the horse will start and his request; `c.photograph_available` is the Inspector handing one over (¶162), which the thought does not read. | **A25**: drop `c.photograph_available` from `maps`. Clears the last "dealt late" row. |
| `t163.1` | RECORD | accurate | `a.question_maid` | — | — |
| `t163.2` | ABSENCE | accurate (ws 8 for the policy) | `a.question_maid`, whose `yields.unknown` marks the untold result | — | — |
| `t173.1` | RECORD | accurate | `c.sheep_lame` | — | — |
| `t175.1` | INFER | accurate | `k.sheep_lamed_by_hand` | — | — |
| `t182.1` | RECORD | accurate | `c.dog_did_nothing` (Gregory's ¶181 attestation) | — | — |

## s09 The Wessex Cup (¶183–¶214)

| Thought | Tag | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|---|
| `t186.1` | RECORD | partial | `c.silver_blaze_markings` | "Two markings, not one": the card says only the white forehead (it is dealt at ¶146, where only the forehead is told). The mottled off-foreleg (¶186) has no card. | **C12**: a claim for the foreleg, quoted from ¶186; map it. |
| `t188.1` | RECORD | accurate | `c.odds_shortened` | — | — |
| `t189.1` | NOTICE | accurate | notices `c.odds_shortened`; Holmes ¶189, cannot score | — | — |
| `t191.1` | RECORD | accurate | `c.race_card` | — | — |
| `t192.1` | RECORD | accurate | `c.bayard_scratched` | — | — |
| `t198.1` | RECORD | accurate | `c.bay_in_ross_colours` (¶197), `c.bay_no_white` | — | — |
| `t198.2` | IDENTIFY | accurate | `k.bay_is_ross_entry` | — | — |
| `t200.1` | RECORD | accurate | `c.race_result` | — | — |
| `t202.1` | RECORD | accurate | `c.wash_with_spirits` | — | — |
| `t204.1` | RECORD | accurate | `c.found_with_faker` | — | — |
| `t212.1` | RECORD | accurate (by design) | `a.reveal`, `c.holmes_names_horse` (derived) | The card is a conclusion to prove, not dealt: Holmes's naming of the horse does not hand the player the answer. | — |
| `t214.1` | RECORD | partial | `c.holmes_names_horse` | "Self-defence" is in its text; "John Straker was a man who was entirely unworthy of your confidence" has no card (the case derives `straker.honest` false elsewhere). | — (leave) |

## s10 The explanation on the train home (¶215–¶231)

| Thought | Tag | Verdict | What holds it | Problem | Fix |
|---|---|---|---|---|---|
| `t216.1` | RECORD | accurate | `a.realise_curry` | — | — |
| `t218.1` | RECORD | accurate | `r.opium_taste` (offered early, as the fair-play table asks) | — | — |
| `t218.3` | NOTICE | missing; no plain card | nothing | About Holmes's argument, not a detail of the world. | — (see `t220.3`) |
| `t220.1` | RECORD | accurate | `r.laying_against` (offered early) | — | — |
| `t220.3` | NOTICE | **the annotation disagrees with itself, and the case follows one side** | nothing | `t220.3`, `t218.3` and `t92.8` say who drugged the dish is open, answered by Holmes's scenario, not by evidence (and "still open when the story ends"). But `t37.16` (INFER, added Round 53) says "whoever drugged him took the horse" (`r.drugged_guard`, default, unless "the drugger had an accomplice"), and with the dog, the key and the alarm the case proves `e.opium_added.agent` = Straker, unique. The accomplice exception is exactly the wife. | **Direction question for you** (see the end). |
| `t221.1` | RECORD | accurate | `r.tendon_nick`, `r.cataract_knife_use` | Round 79's other borderline rule: `r.tendon_nick` surfaces at ¶18 on the horse's racing record, a laming method shown long before laming is in the story. It is a premise only of `k.practice_first` and `k.lame_plan`, both implicit and both resting on the sheep (¶173). | **B7**: `relevant_from` at the sheep's lameness (¶173). Nothing earlier uses it. |
| `t226.1` | RECORD | partial | maps three rules | The paragraph is Holmes stating his steps; the steps are inferences he states here (`k.horse_kicked`, `k.coat_off_to_work`, `k.cravat_order`, gates ¶226). | **A26**: map those three as well. |
| `t226.3` | WEIGH | accurate | nothing claims why Straker picked the cravat up (no purpose facet) | The case leaves it open, as the reader does. | — |
| `t229.1` | RECORD | accurate | `c.milliner_knows_straker` | — | — |

**Out of scope, s05–s10:** `t224.1` (TEST, the Colonel's "that was why he needed the candle, and struck the match")
maps `k.horse_kicked`, which is not what the Colonel says; it should map `k.vesta_from_strakers_box` only (**A27**).

## Summary

**Verdicts (191 thoughts in scope):**

| Scene | In scope | Accurate | Partial | Wrong | Missing, now | Missing, later ws |
|---|---|---|---|---|---|---|
| s01 | 2 | 0 | 1 | 0 | 0 | 1 |
| s02 | 70 | 50 | 11 | 3 | 4 | 2 |
| s03 | 15 | 8 | 1 | 1 | 2 | 3 |
| s04 | 33 | 27 | 3 | 1 | 2 | 0 |
| s05 | 16 | 12 | 2 | 0 | 2 | 0 |
| s06 | 22 | 15 | 3 | 2 | 0 | 2 |
| s07 | 6 | 5 | 1 | 0 | 0 | 0 |
| s08 | 6 | 5 | 0 | 1 | 0 | 0 |
| s09 | 12 | 10 | 2 | 0 | 0 | 0 |
| s10 | 9 | 6 | 1 | 0 | 1 | 0 |
| **all** | **191** | **138** | **25** | **8** | **11** | **8** |

One more, `t220.3` (s10), is counted in no column: the annotation disagrees with itself there (the question below).
"Missing, now" counts the thoughts that have no card and no plain one to give them (`t57.2`, `t218.3`, `t109.1`,
`t21.2`) as well as the modelable ones. "Accurate"
includes PREDICT and TEST PLAN thoughts whose action is held and whose sealing waits for ws 7.

**The kickoff's known items:**
- **The eight premise disagreements:**
  - data short: `t32.3` (A7);
  - annotation long: `t34.5` (A9), `t97.2` (A19), `t124.2` (A20), `t150.1` (A24);
  - annotation right, the format cannot say it (a statement weighed before a step may use or set it aside):
    `t84.6`, `t92.4` (B4), and `t133.2` (A21 with B4 extended, or C11).
- **The four RECORDs dealt late:** `t14.1` maps the wrong card (A2); `t122.1` and `t123.1` need the track claim
  split (B3); `t161.1` maps a card it does not read (A25). All four clear.
- **NOTICE (12 of 16 without `notices`):** four have a plain card (`t18.3`, needing `notices` on an event card;
  `t40.5`; `t82.4`; `t100.1`, optional). Four are about Holmes's words, not the world (`t57.2`, `t218.3`, `t220.3`,
  and `t116.2`, already held by its rule). `t84.7` keeps its notice and loses a map.
- **ABSENCE:** the lantern (`t78.4`) fits `files`, but its witness is weak; the cravat in Edith's description
  (`t21.2`) does not fit (no world fact). I recommend leaving both, as Round 82 did. `t107.2` (the boot comparison)
  wants the "untold" marker `t163.2` already has (B5).
- **WEIGH (13 unheld):** six are held by cards once mapped (`t19.4`, `t26.1`, `t36.3`, `t40.6`, `t40.7`, `t60.2`);
  `t82.2` is mapped to the wrong card. The graded ones wait for ws 6: `t24.4`, `t58.4`, `t120.2`, and the grading
  half of `t19.4`, `t26.1`, `t36.3`, `t60.2`, `t84.5`. The undercuts wait for ws 3: `t34.3`, `t56.1`, and the
  logic of `t36.2`'s and `t35.6`'s recorded reasons. `t32.4` could be split now, to little effect.
- **Unapplied rules** (`r.present_sees`, `r.told_knows`, `r.acts_on_knows`): no thought in scope wants one. The
  thoughts that could (`t24.2`, `t150.1`, `t34.5`) take their knowledge from better evidence, as Rounds 81 and 83
  found.
- **Round 79's open list:**
  - `t124.2`: the annotation names the intention where it means the return track (A20).
  - `r.tendon_nick` and `r.horse_gregarious`: both surface at ¶18 and lean towards the solution; both can move
    later at no cost (B6, B7).
  - the Strict column's thigh cut: nothing wrong today; the Strict column gives way to background availability
    (ws 8).
  - an authored "inside story" theory: modelable now as a theory like `t.police` (C13), though `t92.6` is a
    HYPOTHESIS, ws 6's territory.

## A question of direction for Robert

**Who drugged the dish?** The annotation says the story leaves it open (`t92.8`, `t218.3`, `t220.3`, and "still
open when the story ends"): the curry names the household, the dog and the key name the man who came at one, and
Holmes's "which of them had access to that dish without the maid seeing them?" (¶218) is never answered. But the
annotation's own `t37.16` (Round 53) takes the default that whoever drugged the guard took the horse, and the case
follows it: `e.opium_added.agent` = Straker, unique, through `r.drugged_guard`, whose stated exception is an
accomplice.
- **(a) Keep the case as it is** and correct the three thoughts: the question is answered by a default, and the
  open part is its exception (Mrs. Straker drugged it, he took the horse), which ws 3 can play against it.
- **(b) Leave it open in the case,** as the story does: `e.opium_added.agent` recorded as left open between Straker
  and his wife, `k.drugger_took_the_horse` weakened to "the drugger is of the household" (the curry already gives
  that). The gates and the uniqueness report would move.

I recommend (a): the default is the reader's own (`t37.16` is typical and strong), Holmes asserts it (¶220), and
ws 3 is the place for the exception.

## Fix proposals (gathered by kind)

Each batch is one step and one commit if agreed. Numbers are stable; pick by number.

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
| A13 | `t60.2` | maps `c.simpson_lost_cravat` | held, unmapped |
| A14 | `t62.3`, `t62.4`, `t114.3` | `t62.3`: `no_inference: workstream-3`; the gypsies' inference named by `t62.4` (DROP allowed to name one) or `t114.3`; their maps lose `k.horse_goes_home` | goes with B2 |
| A15 | `t78.5` | maps `a.search_mud` | the check is held |
| A16 | `t82.2` | maps `c.knife_from_dressing_table`, `c.gregory_poor_weapon` instead of `k.knife_for_an_operation` | wrong card |
| A17 | `t84.7` | drop `k.second_household` from `maps` | `t92.15`'s, needs ¶92 |
| A18 | `t93.1` | maps `fatal_hollow` | coverage |
| A19 | `t97.2` | `t35.6` from `from` to `strains` | resolves premise disagreement `t97.2` |
| A20 | `t124.2` | `t123.1` instead of `t123.2` in `from` | resolves premise disagreement `t124.2` |
| A21 | `t133.1` | add `c.brown_denies` | read, unmapped |
| A22 | `t133.2` | date ¶135 (id `t135.1`) | the invitation is ¶134–¶135 |
| A23 | `t141.2` | maps `a.at_the_race` (optional) | the settling action |
| A24 | `t150.1` | drop `t140.1` from `from` | resolves premise disagreement `t150.1` |
| A25 | `t161.1` | drop `c.photograph_available` | not read; clears a "dealt late" row |
| A26 | `t226.1` | add `k.horse_kicked`, `k.coat_off_to_work`, `k.cravat_order` | Holmes states them here |
| A27 | `t224.1` | maps `k.vesta_from_strakers_box` only | the Colonel says nothing of the kick |

### B. Data and checker fixes

| # | What | Change | Why |
|---|---|---|---|
| B1 | `k.horse_at_mapleton_by_reach` | cut "which also has every reason to keep him from running" from the label | not among its premises |
| B2 | `r.gypsies_avoid_trouble`, `k.gypsies_did_not_take_him` | the rule as Holmes argues it (they would not steal a horse they could not sell), over the band and the hiding, not the leaving; `r.famous_horse_unsellable` a premise | the case uses the departure as evidence; the reader and Holmes do not |
| B3 | `c.double_track_loops` | split into the turn (¶122), the return (¶123) and the end (¶124); the two inferences re-pointed | clears two "dealt late" rows and `t123.2`'s date note |
| B4 | the thoughts checker | a cited WEIGH or SOURCE thought whose inference is a belief about a statement counts as covering it, when the statement contradicts the conclusion or is a premise; extended to a statement bound in a rule application | resolves `t84.6`, `t92.4`, and with A21 `t133.2` |
| B5 | `a.compare_boots` | `yields.unknown`: the result is never told; `t107.2` maps it | the marker `a.question_maid` has |
| B6 | `r.horse_gregarious` | Holmes's words ("left to himself"); `relevant_from` ¶37 | leans towards the solution at ¶18 |
| B7 | `r.tendon_nick` | `relevant_from` ¶173 (the sheep) | a laming method shown at ¶18; nothing earlier uses it |

### C. New data (missing, modelable now)

| # | Thought | Data | Recommendation |
|---|---|---|---|
| C1 | `t18.3` | `notices` may name an event card; `t18.3` notices `e.horse_led_out` (Holmes ¶57, scores) | do |
| C2 | `t21.2` | `notices` on an ABSENCE thought, marking `c.edith_knows_cravat` | leave |
| C3 | `t24.1`, `t24.2` | `c.stranger_says_lost` (¶22, aim `find_way`, false), a declared belief (false), a lie inference | do, testing the clash first |
| C4 | `t28.2` | a tout rule and the stranger's aim `information` at the window | optional |
| C5 | `t32.4` | parts on `c.straker_uneasy` (seen versus the narrator's gloss) | leave until ws 3 |
| C6 | `t40.5` | `notices`: `c.simpson_stick`, `c.head_shattered` | do |
| C7 | `t52.1` | a claim for "purely circumstantial", no content | leave |
| C8 | `t78.4` | the lantern as a filed absence (rule, `p.straker_took_lantern`, witness the inventory) | leave |
| C9 | `t82.4` | `notices`: `c.knife_from_dressing_table` | do |
| C10 | `t100.1` | `notices`: `c.matting_laid` | optional |
| C11 | `t133.2` | `r.guilty_denial` and a ¶135 inference of the lie; `k.brown_lied` implicit | with ws 6 |
| C12 | `t186.1` | a claim for the mottled off-foreleg (¶186) | do |
| C13 | `t92.6` | an authored theory `t.inside_story` (the scenario as a layer) | with ws 6, or now if wanted |

**Suggested batches:** (1) A1–A27 with B1 (mappings, `from`s, one label: no logic moves); (2) B3 with B6 and B7
(reading-layer moves, diffed in the logs); (3) B2 with A14 (the gypsies); (4) B4 and B5 (checker and marker);
(5) C1, C6, C9, C12 (notices and the foreleg); (6) C3 (the stranger's lie, with its clash test). The rest wait for
ws 3 or 6, unless you want them.
