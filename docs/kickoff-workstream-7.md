# Kickoff: workstream 7 — predictions and test plans

**Date:** 2026-10-18. Handed off by the session that ran Rounds 113–123 of `docs/design.md` (workstream 6:
hypotheses, scenarios, residue; then the second review and its four fix batches). **Supersedes**
`docs/kickoff-workstream-6.md`, whose mission is done. Read that one only for its traps. They are repeated below with
this session's.

## Why this session

Robert's order (2026-10-18): the next workstream in `docs/gap-analysis.md` §5 after workstream 6.

## The question

`docs/gap-analysis.md` §5 item 7: "Sealed predictions, the player's checks, scoring against the story; the
beat-Holmes windows as scoring data; withheld results marked."

The reader does not only conclude. They also expect and plan:
- They expect: the dog should have barked (`t29.4`). A match will be found in the mud (`t78.5`, `t92.9`). The horse
  will run (`t141.2`).
- They plan checks before Holmes makes them: compare the boots (`t101.2`), search the wet hollow (`t116.3`), take the
  photograph to the milliner (`t92.5`, `t85.3`), ask the maid a question (`t163.3`).

The game holds Holmes's actions (`actions.json`: requires, yields, a spoiler-free `cue`). The story performs them, and
the player never commits to one in advance. Some results are never shown to the reader: the boot comparison, the
question to the maid, the milliner's recognition (which happens offstage and is reported late). Nothing marks them.

## Read first, in this order

1. `CLAUDE.md` (commands, conventions; the reading layer is sacred).
2. `docs/gap-analysis.md`:
   - §2's PREDICT and TEST PLAN rows, and TEST;
   - §3's "late or never disclosed" row;
   - §4 (the beat-Holmes windows; things the story leaves open);
   - §5 item 7;
   - §6's decisions 2 (what scores: deductions and sealed predictions made before Holmes; wrong turns cost nothing)
     and 4 (withheld facts).
3. `docs/reading-annotated.md`:
   - the thoughts tagged PREDICT and TEST PLAN (17 in all);
   - "After the story: the audit", especially the beat-Holmes windows and the fair-play gaps tables.
4. The ws 7 rows of the reviews:
   - in `docs/annotation-review.md`: `t29.4`, `t78.5`, `t85.3`, `t92.5`, `t92.9`–`t92.13`, `t101.2`, `t116.3`,
     `t141.2`;
   - in `docs/review-ws3-ws6.md`: `t163.3`, `t161.2`, `t182.2`.
5. `docs/hypotheses.md`, the workstream 6 paper and its "At build time" notes. Its scores (`dropScores`) and its
   presets (`weigh`) are the latest shape to follow.
6. `docs/redesign.md` on predictions and tests, and Round 32 of `docs/design.md` ("the game should let the player
   perform every step").
7. The code:
   - `cases/silver-blaze/actions.json` (41 actions) and how the story performs them;
   - the 'wait' pace (`WAIT` in `engine/game.js`) and `stepNeeds`;
   - `Game.disclosure`;
   - the score family, the shape any new score should take: `noticeScores`, `raiseScores` and `dropScores`, each with
     an aggregate, Holmes's paragraph and "before Holmes scores", and nothing counting in Trivial;
   - the theories and scenarios of workstream 6 (`scenarioCost`, `residue`, `assumedAnswers`), since a prediction
     will often be "what this theory says should be found".

## What the earlier work hands this one

- **Actions mapped by thoughts:**
  - `a.search_mud`, `a.examine_coat`, `a.search_wet_hollow`, `a.visit_milliner` and `a.keep_horse_entered` (the
    `t92.9`–`t92.13` family);
  - `a.compare_boots` (`t101.2`), `a.dress_trick` (`t85.3`) and `a.request_photograph` (`t92.5`);
  - `a.question_maid`, `a.point_out_dog` and `a.at_the_race`.
- **The expectation as a card:** `r.dog_barks_at_strangers` at ¶29 (`t29.4`). An absence filed against it is
  workstream 5's. Sealing it as a prediction is this one's.
- **Withheld facts (§6 decision 4, still open in practice):**
  - the boot comparison's result (never shown);
  - the bill's items (only inferred, `t92.2`);
  - Holmes's question to the maid (never, `t163.2`);
  - the square toes (late, ¶146);
  - the milliner's recognition (late, offstage).
- **Scores:** notice, raise and drop scores exist. A prediction score and a test plan score would join them.

## Mission

1. **Measure first.** Replay the story for a few kinds of player. For each PREDICT and TEST PLAN thought, find:
   - the earliest paragraph at which the player holds what it needs;
   - what Holmes does and when;
   - what the story discloses of the result, and when.

   Use the beat-Holmes windows as a check.
2. **Design.** A paper, `docs/predictions.md`, in the shape of the earlier ones: the reader's process, what exists,
   questions with alternatives and a recommendation each, the cases as tests, an order of work. **Robert decides
   before anything is built.** Questions it must at least answer:
   - What is a sealed prediction in the game? Options include:
     - a formula over slots;
     - "Holmes will do X";
     - "this will be found";
     - a theory's consequence.

     When is it settled, and by what: a card, an action, a paragraph?
   - What is a test plan? Holmes's actions chosen in advance, a template ("ask {person} about {card}", "look for
     {trace} at {place}"), or both? How is it matched against what Holmes does?
   - The withheld results: what does the game show when a planned check's result never comes (`never`, `late`, a
     `disclosure` field)? What does it ask of the player?
   - Scoring: what scores before Holmes, in the shape of the notice, raise and drop scores? Wrong turns cost nothing.
   - The difficulty presets: what each one shows or offers.
   - How a prediction meets workstream 6: does a theory propose its own predictions or tests?
3. **Build in agreed steps,** one commit each, with a Round entry. Keep every test passing, or say which expectation
   changes and why.
4. Then a **short review** of the PREDICT and TEST PLAN thoughts against what was built, as `docs/review-ws3-ws6.md`
   did.

## Discipline and traps (Rounds 60–123)

- **Measure before designing.** In workstream 6 the replay showed that the planned signal ("fit") was useless:
  every story is broken by some trusted false statement. Cost was the signal instead (Round 113).
- **Gate every commit on the suite in the same command:** `npm test > log && git add <paths> && git commit …`, with
  `run_in_background`, not a shell `&` (a detached job sends no notification). Check the result before pushing.
  This includes documentation-only follow-ups: Round 120's ungated doc commit went out without the trailer.
- **Do not wait on the suite with `pgrep -f "node --test"`:** it matches the waiting shell's own command line.
- **`npm test` takes about 4–5 minutes** (109 tests). Never edit engine or case files while it runs. Documents and
  `ui/` are safe.
- **Rerun a whole test file before the suite:** a run filtered to one test by name hides stale asserts elsewhere in
  the file (Round 103).
- **Before and after each step, diff in full** and say what moved:
  - the reveal and foreshadow logs;
  - the clash log;
  - `report.md` and `thoughts-report.md`;
  - the gate listing: a scratch script that, for each `game.story.gates` paragraph, lists the step ids and
    `game.stepNeeds`.
- **A thought that names an inference becomes a route step,** unless the inference is false (Round 111).
- **A new slot needs an inference forcing it,** or the validator fails on uniqueness (Round 122).
- **Slot prompts and card text must not name a hidden agent** (Round 122: "Why was a light struck in the hollow?",
  not "Why did Straker strike a light?").
- **Claims need `truth`** (the schema rejects one without it, Round 123).
- **Making an inference `implicit` moves `belief.test.js`-style expectations** (Round 123). Grep the tests for its
  id first.
- **A false claim cited as an inference premise is read trusted.** Bind it in the rule instead (Round 87).
- **A rule that would give a step away goes where Holmes says it** (Rounds 89, 95, 104).
- **Case data files are one JSON object per line;** edit lines, do not reformat. Thoughts are mirrored in
  `docs/reading-annotated.md` (ids and tags checked).
- **The leak checker:**
  - `--background` for rule texts;
  - `--exceptions` for exceptions;
  - `--all` for card text.

  Any new card text (a prediction label, a template, a withheld marker) goes through it.
- **UI checks in headless Chrome:**
  - serve with `node scripts/serve.js`, and capture its PID and Chrome's to stop them (pattern kills are blocked);
  - run `google-chrome --headless=new --remote-debugging-port=9333`;
  - load a save made in node into `localStorage` (`mystery-clue-game:silver-blaze:v2`) over the DevTools protocol;
  - reload, wait about 25 s, click the tab, and read `#tool`.
- **Robert's standard for conveniences:** the lower difficulties' helpers need not be perfect. List a case they get
  wrong rather than chase it (Round 108).

## Acceptance

- `docs/predictions.md` written, discussed and agreed by Robert.
- The agreed steps built, each a Round entry, gated and pushed.
- Each of the 17 PREDICT and TEST PLAN thoughts, and `t161.2`, `t163.3` and `t182.2`, either held as agreed or listed
  with why not.
