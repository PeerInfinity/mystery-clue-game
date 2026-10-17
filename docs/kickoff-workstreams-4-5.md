# Kickoff: noticing and absence, then testimony and belief (workstreams 5 and 4)

**Date:** 2026-10-16. Handed off by the session that ran Rounds 66–78 of `docs/design.md`. **Supersedes**
`docs/kickoff-world-model-2.md` (its mission, A to C, is done) and `docs/kickoff-event-order.md` (done, Rounds
73–75). Read those two only for their traps.

## Read first, in this order

1. `CLAUDE.md` (commands, conventions; the reading layer is sacred).
2. `docs/gap-analysis.md`:
   - the WEIGH, NOTICE and ABSENCE rows of its table;
   - workstreams 4 and 5 in its order of work.
3. `docs/reading-annotated.md`: the NOTICE, ABSENCE and WEIGH thoughts (16, 5 and 19 in
   `cases/silver-blaze/thoughts.json`). The dog that did nothing (`t34.x`) is the story's own absence.
4. `docs/knowledge-intention.md`:
   - knowledge, intention and belief, agreed (Round 72) and built (Rounds 76–78);
   - Q4 fixes belief's shape for workstream 4.
5. `docs/design.md` Rounds 66–78:
   - 66: solver speed;
   - 67–70: the card timeline and checked placements, with states and splits opened on demand;
   - 71–78: step C;
   - 73–75: event order, from a parallel session.
6. `docs/format-0.3.md`, the "As built" sections from Round 66 on.

## What was built since the last kickoff (one line each)

- **Speed (66):** compiled formulas, incremental Trivial candidates with solution mending, remembered solutions,
  ties tried first within a step budget. `npm test` 16 min → about 3 min.
- **Cards (67):** each card shows its own timeline, with the board's layer and pencil marks. The board's pencil
  form wraps on a phone.
- **Board (68–70):**
  - prove or rule out a mark, and a proven state becomes a card;
  - holder, condition, aim and knowledge marks;
  - cells and splits the case never declared, opened on commit;
  - refused where nothing can have one answer throughout;
  - the splitting event lies in neither part.
- **Order (73–75):** `seq` on claims: the order of events within a window, as the story tells it.
- **Step C (76–78):**
  - aims tied to the purposes of acts;
  - possession over time;
  - knowledge over propositions, with two built-in laws.

  Four of the six `world-model` thoughts gained an inference: `t24.2`, `t78.2`, `t123.2`, `t150.1`.

## Mission, in order

### 0. Starter batch (small; one commit each)

1. **`t82.3`** (the knife unsheathed in the hollow): a condition track "sheathed" on the knife, and an implicit
   inference. It settles no question.
2. **The three default knowledge rules of Q2,** authored as rule cards with `unless`: told, seen, acts on it.
   Wire one where the story uses it, if a thought does; otherwise leave them unapplied and say so.
3. **Aims and knowledge in the board's three-dropdown form:** they are on the cards only. Ask Robert first whether
   the form should grow an aspect choice, since he asked to keep the three dropdowns (Round 67).

### 1. Workstream 5: noticing and absence (design first, agree with Robert)

- **What exists:** `c.dog_did_nothing` is dealt to the player at ¶34 (`via: "absence"`). The game makes the
  hardest move in the story for them.
- **What the gap analysis proposes:**
  - an **expectation** (a default rule attached to a card or trait: a guard dog barks at strangers);
  - a **notice** action, scored against the authored notable details with their earliest dates;
  - **absence claims withheld until the player files them:** expectation plus window.
- **It unlocks `t34.5`:** "no alarm was raised", the knowledge half built in Round 78. Its `no_inference` reason
  becomes `absence` until then.
- **Lay out the alternatives with a recommendation.** Robert decides before building.

### 2. Workstream 4: testimony and sources, with belief (design first, agree with Robert)

- **Split mixed claims** (observed versus concluded) where the WEIGH thoughts need it. Hunter's cravat is one
  claim, his blaming the stranger another.
- **Reporting chains,** and the "split this statement" action where the story invites it.
- **Belief, in the shape Q4 fixed:**
  - a boolean track per person and proposition;
  - knowing implies believing;
  - a sincere speaker believes what he says;
  - mistaken (believes, false) against lying (does not believe).

## Open, for Robert when it comes up

- **`t124.2`** cites `t123.2`, whose inference (`k.track_man_changed_his_mind`) is not among
  `k.tracks_end_at_mapleton`'s premises: the one premise disagreement in `thoughts-report.md`. Robert was unsure;
  left as it is.
- The four RECORDs the game deals late (`thoughts-report.md`).
- The two borderline rule texts: `r.tendon_nick` and `r.horse_gregarious`.
- The Strict column's thigh cut.
- An authored "inside story" theory as a layer.

## Discipline and traps (Rounds 60–78)

- **Gate every commit on the suite in the same command:** `npm test > log && git add <paths> && git commit …`.
  Then check the result before pushing. A Round 77 commit slipped through with a failing test, because the commit
  ran after the suite rather than on its exit code.
- **`npm test` takes about 3 minutes.**
  - Run it in the background.
  - Never edit engine files while it runs: `node --test` starts its eighth file late, and it would load the edited
    code. Experiment in a scratch copy.
  - Never watch it with `pgrep -f "node --test"`.
- **Parallel sessions share one working tree.**
  - Commit by explicit path, never `git add -A`.
  - No pull is needed: their commits are already on the local branch.
  - Check `git diff docs/design.md` holds only your own entry.
- **Before and after each step, diff in full** and say in the tab what moved:
  - the reveal and foreshadow logs;
  - `report.md`;
  - `thoughts-report.md`;
  - the gate listing: each gate's paragraph and the inferences it needs, from `game.stepNeeds` after
    `model.story.gates`.
- **A clash sets aside every lowest-weight claim in it.** Two story clues that contradict each other both drop out.
  Do not author a false claim that clashes with a true one the inferences need (Round 78: the stranger's "lost"
  story).
- **A rule that compares a state with a slot** (`diff`/`same` against `?blow.patient`) is expanded over the slot's
  whole domain, which makes every value a card the solution needs. Name the value with a variable instead
  (Round 77).
- **The reading layer, for background facts:** a rule surfaces at its `relevant_from` line. Put that line where
  the reader's thought is, not just before the clue it bears on, or it reads as a hint (Round 78).
- **A new case split** (`state_splits`) asks an order question for every event no clue puts elsewhere. Dawn added
  33 and about 100 order ties (Round 76); `npm run validate` 34 → 47 s. Watch the cost.
- **Ties are lazy** (`world: true`); order ties are definitions. A state slot's check takes its thing's ties
  (`#withTies`).
- **Formulas are compiled once:** never change a formula object after it is first evaluated.
- **Case data files are one JSON object per line;** edit lines, do not reformat.
- **Checking the UI:** `scripts/serve.js` (one may already run on 8321 from this tree), plus headless Chrome over
  the DevTools protocol. Clear `localStorage` first.

## Acceptance

- The starter batch is done, or asked about.
- Workstream 5 is designed and agreed, and built if the session gets that far, with `t34.5` taking its inference.
- Workstream 4 is designed and agreed.
- A Round entry per step; everything committed and pushed.
