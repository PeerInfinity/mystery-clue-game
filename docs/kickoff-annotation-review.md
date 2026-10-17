# Kickoff: a focused review of the annotation against what the model can now hold

**Date:** 2026-10-17. Handed off by the session that ran Rounds 80–91 of `docs/design.md`. **Supersedes**
`docs/kickoff-workstreams-4-5.md` (its mission is done). Read that one only for its traps.

## Why this session

Robert wants the model to be as complete and accurate as possible. Workstreams 4 and 5 are built: belief, testimony,
chains, splitting, noticing and absence. With the world model and knowledge before them (Rounds 60–78), most tags of
the annotated reading now have somewhere to live.

- **Inaccuracies compound as more is built on top.** The last session found three:
  - a thought wrongly called unmodelable (`t92.3`, Mrs. Straker's honest denial, fixed in Round 91);
  - eight premise disagreements;
  - a planned rule (`r.present_sees`) that could not be applied as designed.
- **The aim is to check, thought by thought, that the case holds each thought accurately**, and to list what is
  missing or wrong, before workstream 3 (defeasibility) and workstream 6 (hypotheses, scenarios, residue).
- **Agreed order (Robert, 2026-10-17):**
  1. this focused review;
  2. workstream 3;
  3. workstream 6;
  4. a second review of the tags those two make modelable.

## Read first, in this order

1. `CLAUDE.md` (commands, conventions; the reading layer is sacred).
2. `docs/gap-analysis.md`: the tag table (§2) and the workstreams (§5).
3. `docs/reading-annotated.md`: the spec. The data is `cases/silver-blaze/thoughts.json`, one thought per line.
4. `cases/silver-blaze/thoughts-report.md`: coverage, notable details, short chains, premise disagreements.
5. What each feature can hold:
   - `docs/knowledge-intention.md` (knowledge, aims, possession over time);
   - `docs/noticing-absence.md` (workstream 5);
   - `docs/testimony-belief.md` (workstream 4);
   - `docs/format-0.3.md`, the "As built" sections from Round 60 on.
6. `docs/design.md` Rounds 80–91, for what was built and the rulings.

## Scope: the tags whose features now exist (about 190 of 294 thoughts)

| Tag | Thoughts | Held by a card | What can hold it |
|---|---|---|---|
| RECORD | 93 | 89 | Claims, quoted at clause level; absences filed; parts of statements |
| INFER, DEFAULT, AGENT, PHYSICAL, IDENTIFY | 44 | 42 | Verified inferences with rule applications; states, aims, knowledge, belief |
| NOTICE | 16 | 4 | `notices` (cards whose marking counts); rules as expectations |
| ABSENCE | 5 | 2 | Absence claims with `files` (expectation, windows, witness) |
| WEIGH | 19 | 6 | Doubt as mistaken or lying; belief tracks; `said`; parts; reasons (recorded) |
| SOURCE | 2 | 2 | Chains with a belief per link |
| PREDICT, TEST PLAN | 12 | 9 | Actions (`actions.json`); sealed predictions are workstream 7 |

**Out of scope until workstreams 3 and 6:** HYPOTHESIS (27), TEST (30), QUESTION (10), GENRE (20), RESIDUE, DROP,
REVISE, and the undercut half of DEFAULT and WEIGH. Note one line per such thought only where something in the case
is wrong today, not where it is merely missing.

## Method (for each thought in scope)

1. **Read the thought**, its `reads`, `from` and the story around its paragraph.
2. **Find what holds it:** its `maps`, its `inference` (premises, formula, rule applications, `by`), its `notices`,
   the claims' `asserts`, `said`, `truth`, chain, parts, the states it touches.
3. **Classify it:**
   - **accurate:** the case holds what the reader thinks, at that paragraph, for those reasons;
   - **partial:** some of it is held. Say which part is not, and what feature would hold it;
   - **wrong:** the case says something else: a different conclusion, a premise the reader cannot have yet, a wrong
     truth value, a quote that does not say it, a date off;
   - **missing, modelable now:** nothing holds it, but the features exist. Sketch the data;
   - **missing, needs a later workstream:** say which.
4. **Record it** in a review table: `docs/annotation-review.md`, one row per thought (thought, tag, verdict, what
   holds it, the problem, the proposed fix). Group the rows by scene.
5. **Fix nothing in the case or the annotation without Robert.** The review is the deliverable. Propose fixes in
   batches by kind:
   - data fixes;
   - annotation fixes (a wrong `from`, a date);
   - new data for missing-but-modelable thoughts.

   Robert decides each batch. Each batch is then its own step and commit, with a Round entry.

## Known items to start from

- **The eight premise disagreements** (`thoughts-report.md`, Short chains). Each is a thought citing something its
  inference does not need. Decide per case: is the annotation's chain right and the data short, or the reverse?
  - `t32.3`, `t34.5`, `t84.6`, `t92.4`, `t97.2`, `t124.2`, `t133.2`, `t150.1`.
- **The four RECORDs the game deals late** ("Dealt later than the reader has it").
- **NOTICE:** 12 of 16 thoughts have no `notices` yet. Which have a plain card to notice?
- **ABSENCE:** the lantern (`t78.4`) and the cravat missing from Edith's description (`t21.2`). Robert deferred
  both (Round 82); check whether they now fit `files`.
- **WEIGH:** 13 of 19 thoughts are unheld. Several are graded ("counts a little", "neutral"). Say which could be a
  belief or a reading now, and which wait for graded support (workstream 6).
- **Unapplied rules:** `r.present_sees`, `r.told_knows`, `r.acts_on_knows` (Round 81). Does any thought want one?
- **The kickoff of Round 79's open list:**
  - `t124.2` (the one premise disagreement Robert was unsure of);
  - the two borderline rule texts `r.tendon_nick` and `r.horse_gregarious`;
  - the Strict column's thigh cut;
  - an authored "inside story" theory as a layer.

## Tools

- `npm run validate-thoughts`: the thoughts report.
- `npm run validate`: the case report.
- `npm run reveal-log` and `npm run foreshadow-log`: what appears at each paragraph.
- **Reading at a paragraph:** a scratch script (`new Game(model, {...})`, `advance()` to the paragraph, then
  `knows`, `checkConclusion`, `settled`).
- **The game in a browser:** `node scripts/serve.js`. Headless Chrome over CDP worked well for checks: load a
  save into `localStorage` (key `mystery-clue-game:silver-blaze:v2`), then drive the page.

## Discipline and traps (Rounds 60–91)

- **Gate every commit on the suite in the same command:** `npm test > log && git add <paths> && git commit …`.
  Then check the result before pushing. In Rounds 80–91 the gate stopped four commits that had a failing test.
- **`npm test` takes about 3–3.5 minutes** (76 tests).
  - Run it in the background.
  - Never edit engine or case files while it runs (the test files load them late). Documents and `ui/` are safe.
- **Before and after each step, diff in full** and say what moved:
  - the reveal and foreshadow logs;
  - `report.md`;
  - `thoughts-report.md`;
  - the gate listing (each gate's paragraph and the inferences it needs).
- **A clash sets aside every lowest-weight claim in it**, so two story clues that contradict each other both drop
  out. Never give a false claim content that contradicts a true one the inferences need (Rounds 78, 91).
- **A false claim (truth slot) cited as an inference premise is read trusted.** Bind it in the rule instead
  (Round 87).
- **A rule's window bound to a case window holds vacuously** when the event's time is an open question. Phrase
  the rule over the events instead (Round 83).
- **A background rule surfaces at its `relevant_from` line.** One that would hint at the culprit belongs where the
  story reveals him (Round 89).
- **A comparison of a state with a slot** (`same`/`diff` against `?x.place`) expands over the slot's domain. Name the
  value with a variable (Round 77).
- **Nothing the player can pick** (a condition, a proposition, a rule) may be offered before the story speaks of it
  (Round 80).
- **Case data files are one JSON object per line;** edit lines, do not reformat.

## Acceptance

- `docs/annotation-review.md` covers every thought in scope, with a verdict and, where needed, a proposed fix.
- The out-of-scope tags are noted where the case is wrong today.
- Robert has decided the fix batches. The agreed ones are built, each a step with a Round entry, gated, pushed.
