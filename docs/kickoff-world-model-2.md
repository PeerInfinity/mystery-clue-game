# Kickoff: the world model, part 2 (solver speed, checked placements, then knowledge and intention)

**Date:** 2026-10-16. The previous session (Opus) ran Rounds 60–65 of `docs/design.md`. **Supersedes**
`docs/kickoff-world-model.md`, whose steps 1–4 are done; read that one only for its traps.

## Read first, in this order

1. `CLAUDE.md` (commands, conventions).
2. `docs/world-model.md`: the agreed design.
3. `docs/design.md` Rounds 59–65, which record what was built and Robert's rulings. Rounds 61 and 62 matter most.
4. `docs/format-0.3.md`, the five newest "As built" sections (states; the world's ties, splits and order; the solver
   worker; the board; layers).
5. The code these rest on:
   - `engine/timeline.js` (the board and layers);
   - `engine/remoteProblem.js` and `engine/solverWorker.js` (the worker);
   - the "world model" parts of `engine/caseModel.js` (splits, state tracks, ties);
   - the lazy constraints in `engine/solver.js`.
6. For part C, `docs/reading-annotated.md`'s state-of-mind blocks, and the six thoughts marked
   `no_inference: world-model` in `cases/silver-blaze/thoughts.json`. Round 61 records why each still has no
   inference.

## Settled rulings: do not re-litigate

1. **The world model's workings are built in, not rule cards.** Whoever does a thing, or has it done to them, is
   where it is done, when it is done. A holder is where the held thing is (Round 61).
2. **No hard-coded window splits.** A window, or a part of one, is split at an event into the part before it and
   the part after it, recursively.
   - The window stays, and what is in it stays there until moved into a part.
   - A cell means "throughout" its time.
   - Which part an event falls in is an order question (before or after), answered by a clue where the story
     tells it, and otherwise left open.
   - The case lists only the splits its own reasoning needs (`state_splits`); the player can split any window.
3. **A listed place means itself apart from the listed places inside it** ("the stable" is the stable apart from
   its loft). A place folds to the nearest listed place containing it.
4. **Long waits are acceptable if the page shows progress** (the worker and panel, Round 62).
5. Everything earlier stays green:
   - short chains and gates from thoughts;
   - only Holmes's own non-implicit inferences gate;
   - the police's four wait for workstream 3;
   - the reading layer is sacred.

## Mission, in order

### A. Solver speed (first: every later step pays for it)
Since Round 61, the ties join the night's events into large search components:
- `npm test` takes 11–15 min (207 s before);
- `npm run validate` takes about 75 s (47 s before);
- Trivial takes about 2 s per paragraph in the browser;
- a full clash search at the end of the story takes about 52 s (22 s before).

The measurements are in Round 61. Leads:
- **Incremental candidates for Trivial.** `Game.autoValues` reruns the whole all-candidates batch for every new
  card; most groups do not change. Cache per component, keyed by its active constraints, and recompute only the
  components a new card touches.
- **Reuse a witness.** The lazy two-phase check in `Problem.consistent` (run without the ties, then with them)
  could start the second phase from the first phase's witness.
- **Cheaper `explainConflict` when ties are background.** QuickXplain re-checks the ties on every subset. A first
  pass could find the clash's suspects with the ties fixed to the witness's values.
- **The test suite itself.** `game.test.js` "cards the solution does not need" (268 s) and the Trivial tests play
  whole games three times; see whether they can share one played game.

Target: `npm test` back under about 5 minutes, with no loss of soundness. Time before and after, and put the
figures in the Round entry.

### B. Checked placements (the rest of world-model step 3)
1. **Check a placement when the player commits it** in the harder settings, as checked cross-outs are now. The
   free pencil stays the default.
2. **Cells the case never declared.** A state slot is created when the player opens one (a dynamic track or window,
   with its world ties), checked against the rules only; it has no authored answer and plays no part in
   uniqueness. Remove it on reset, like the player's dynamic cards.
3. **A proven placement becomes a card** the player can cite.
4. **Possession and condition** on the board, pencilled like places.
5. **The order questions a split raises:** pencil the before/after of an event as a mark, and check it at commit.

### C. Knowledge, intention, belief (world-model step 5)
Design first. Lay out the alternatives with a recommendation, and let Robert decide before building:
- the aspects' slots and values, which relations they need, and how claims fill them;
- belief, which goes with workstream 4 (testimony);
- how the six `world-model` thoughts would each take an inference: `t24.2`, `t34.5`, `t78.2`, `t82.3`, `t123.2`,
  `t150.1`.

## Discipline and traps (from Rounds 60–64)

- **`npm test` is slow.** Run it in the background and gate the commit on its exit code:
  `npm test && … && git commit && git push`.
- **Never watch a test run with `pgrep -f "node --test"`** from a shell whose own command line contains that
  string: it matches itself.
- **Before and after each step**, save and diff in full: the reveal and foreshadow logs, `report.md`, the thoughts
  report, and the gate listing (each gate's paragraph and the inferences it needs, from `game.stepNeeds` after
  `model.story.gates`).
- **Ties are lazy constraints** (`world: true`).
  - They are active where an active card speaks of their thing's states (`activeConstraints`, `stateThings`).
  - Verification adds only the ties for the things an inference's formula or rule applications speak of. With
    claim premises included, `k.drugger_took_the_horse` never finished.
  - Explanations keep ties as background.
- **A game move asks the solver before it changes anything.** In the browser a slow call throws `NeedSolve` and the
  move is retried once the worker answers. Any cache must be keyed after it is filled; `autoValues` was the bug
  found in Round 62.
- **The `Game` constructor calls the solver**, so in the browser it runs through `settle`.
- **Clash set-aside drops every lowest-weight claim in a clash.** A derivation that cites two of the story's clues
  where one used to do can make an innocent clue drop out. That is why the night's bound lives in
  `k.found_before_seven` (Round 61).
- **Checking the UI:** `scripts/serve.js`, plus headless Chrome over the DevTools protocol. The previous session's
  driver opened `ws://` to `--remote-debugging-port`, evaluated clicks, and took screenshots with
  `Page.captureScreenshot`. Clear `localStorage` first, or the page resumes an old game.

## Open, for Robert when it comes up

- The four RECORDs the game deals late (`thoughts-report.md`).
- The two borderline rule texts: `r.tendon_nick` and `r.horse_gregarious`.
- The Strict column's thigh cut.
- An authored "inside story" theory as a layer. Today the player makes it as their own theory.

## Acceptance

- `npm test` is green and much faster, with the figures recorded.
- Placements are checked at commit in the harder settings, cells the case never declared can be opened, and a
  proven placement is a card.
- Step 5 is designed and agreed (or built, if the session gets that far).
- There is a Round entry per step and "As built" notes; everything is committed and pushed.
