# Kickoff: how clashes weigh what they set aside (with Q6, one culprit)

**Date:** 2026-10-17. Handed off by the session that ran Rounds 101–106 of `docs/design.md` (workstream 3,
defeasibility, built). **Supersedes** `docs/kickoff-workstream-3.md`, whose mission is done. Read that one only for
its traps; they are repeated below with this session's.

## Why this session

Robert's order (2026-10-17), after workstream 3: rethink how clashes work, as a short design question of its own,
before workstream 6 (hypotheses, scenarios, residue). Then workstream 6, then a second review of the tags workstreams
3 and 6 make modelable. Q6 of `docs/defeasibility.md` (one culprit for both crimes, `t4.2` and `t68.3`) was deferred
by Robert because it is the same question, and belongs here.

## The question

When what the player trusts cannot all be true, the game finds a minimal clash and sets something in it aside (reads
it as doubted) so that one clash does not rule out answers everywhere (Round 17). What it sets aside is decided by
**provenance only, never by truth** (Robert, Round 19): the story's clues first, then inferences someone else stated,
then the player's own and Holmes's. Within the lowest weight, every member is set aside.

Workstream 3 found where this goes wrong, and gave the engine what a better rule could use.

## Read first, in this order

1. `CLAUDE.md` (commands, conventions; the reading layer is sacred).
2. `docs/defeasibility.md`: the reader's three moves with an exception (reservation, defeat, refutation), Q2's
   outcomes, Q6, and its "Left open" section.
3. `docs/design.md` Round 17 (clashes, `Game.clashes`, set aside one at a time), Round 19 (the provenance order,
   Robert's ruling), and Rounds 101–106 (workstream 3; Round 104's clash fix).
4. The code: `Game.clashes`, `workingConstraints`, `resolvedClashes` (`engine/game.js`); `activeConstraints`
   (`engine/caseModel.js`); the tests that pin clash behaviour (`game.test.js`: "a clash among what the player trusts
   is set aside when checking a proof", "Easy: clashes are found and set aside…"; `belief.test.js`: Hunter's
   "lying" clashes with "certain", the stranger's pretence (Round 99); `defeasibility.test.js`: "a clash sets aside
   an inference whole").
5. `docs/testimony-belief.md` and `docs/noticing-absence.md` only where a clash case touches them.

## The cases gathered

- **A stated inference outweighs a true story clue.** A player who keeps the police's account loses true clues to
  it: `k.police_simpson_took_horse` clashes with `c.simpson_came_for_information` and with `c.hoped_early_exercise`,
  and the clues are set aside (Round 102). `k.police_simpson_drugged` with `k.drugger_knew_the_dish` and
  `c.simpson_lives_at_villas`: the clue goes.
- **A false default the player applies would cost story clues before their own card.** One culprit
  (`bk.one_culprit`: whoever took the horse killed the trainer) is false in the true story; applied, it clashes late,
  and the player's applied card weighs more than a clue. This is why Q6 was deferred: `r.one_culprit` with a formula
  needs this settled.
- **What works today and should keep working:**
  - false statements give way to Holmes's chain: the honest-record clue, Straker's "anxiety", the hope of early
    exercise, Gregory's "poor weapon", Mrs. Straker's "friend", Brown's denial, Ross's "not my horse";
  - the stranger's "Can you tell me where I am?" (Round 99): trusted, it clashes with
    `k.stranger_came_on_purpose`, and only the statement is set aside, not `c.stranger_knew_lad_alone` (the trap
    in the list below);
  - Mrs. Straker's honest denial (Round 91): a false statement that contradicted her true one would set both aside.
- **Fixed in Round 104, as a bug:** an inference set aside in a clash left its rule applications active. Now an
  application counts as part of its inference: weighed as it, and set aside with it.

## What workstream 3 gives a better rule

- Each inference's **rule applications**, and whether each rule is a **default** (65 of 118 rules).
- **Named exceptions** per application: whether one is **raised** by the player (a reservation), **established** (a
  defeat), or ruled out (`Game.raise`, `raisedOn`, `exceptionStatus`).
- **Defeated applications** of the characters' false inferences (`defeated_by`): the true story says which exception
  holds; never part of the case's reading.
- `restingOn` (what a held card rests on), `restingOnDefeated`.

## Mission

1. **Design first.** A paper (`docs/clashes.md`) in the shape of the earlier ones: the reader's process (what a
   careful reader gives up when two things they believe conflict, and why: `t36.2`, `t58.4`, `t62.4`, `t68.3`,
   `t92.7`, `t226.2` are a start), what exists, questions with alternatives and a recommendation each, the cases above
   as tests, an order of work. Robert decides before anything is built (`CLAUDE.md`). Questions it must at least
   answer:
   - What should give way first: by provenance as now; by defeasibility (a default application, above all one with
     an open exception, before an observation); by some mix; or by the player's choice with the game proposing?
   - Is Round 19's "never by truth" kept? (A defeat is not truth: it is what the player holds.)
   - Does a clash set aside every lowest-weight member, or one, and how is the choice shown?
   - Q6: can `r.one_culprit` then carry a formula the player applies, and is `t68.3` (its break, a REVISE) this
     paper's or workstream 6's?
   - What the difficulty presets show (Easy lists clashes; Medium and Hard do not, Round 17).
   - How much of this waits for workstream 6's graded support and strain.
2. **Build in agreed steps,** one commit each, with a Round entry. Keep every test above passing, or say which
   expectation changes and why.

## Discipline and traps (Rounds 60–106)

- **Gate every commit on the suite in the same command:** `npm test > log && git add <paths> && git commit …`, with
  `run_in_background`, not a shell `&` (a detached job sends no notification). Check the result before pushing.
- **`npm test` takes about 4–5 minutes** (89 tests). Never edit engine or case files while it runs (documents and
  `ui/` are safe).
- **Rerun a whole test file before the suite:** a run filtered to one test by name hides stale asserts elsewhere in
  the file (Round 103).
- **Before and after each step, diff in full** and say what moved: the reveal and foreshadow logs, `report.md`,
  `thoughts-report.md`, and the gate listing (a scratch script: for each `game.story.gates` paragraph, the step ids
  and `game.stepNeeds`).
- **The first clash computation late in the story takes about 11 s** (Easy, ¶218); the whole-story clash test about
  35 s. A new rule must not multiply that.
- **A false claim cited as an inference premise is read trusted.** Bind it in the rule instead (Round 87).
- **Never give a false claim content that contradicts a true clue the inferences need** while clashes weigh story
  clues least.
- **An exception check leaves out every use of the same default with the same grounded exception** (Round 102).
- **A rule that would give a step away goes where Holmes says it** (Rounds 89, 95, 104).
- **Case data files are one JSON object per line;** edit lines, do not reformat. Thoughts are mirrored in
  `docs/reading-annotated.md` (ids and tags checked).
- **The leak checker:** `--background` for rule texts (write a deliberately weak default as a presumption, "commonly
  taken to …"), `--exceptions` for exceptions (the story prompt misreads them), `--all` for card text.
- **UI checks in headless Chrome:** serve with `node scripts/serve.js` (capture its PID to stop it; pattern kills are
  blocked), load a save made in node into `localStorage` (`mystery-clue-game:silver-blaze:v2`) over the DevTools
  protocol, wait about 25 s for the page, read `#tool`.

## Acceptance

- `docs/clashes.md` written, discussed and agreed by Robert.
- The agreed steps built, each a Round entry, gated and pushed.
- Q6 settled or given a reason; the cases above either behaving as agreed or listed with why not.
