# Kickoff: workstream 6 — hypotheses, scenarios, residue

**Date:** 2026-10-17. Handed off by the session that ran Rounds 108–112 of `docs/design.md` (the clash rethink, with
Q6). **Supersedes** `docs/kickoff-clashes.md`, whose mission is done. Read that one only for its traps; they are
repeated below with this session's.

## Why this session

Robert's order (2026-10-17): after workstream 3 (defeasibility) and the clash rethink, workstream 6. Then a second
review of the tags that workstreams 3 and 6 make modelable.

## The question

`docs/gap-analysis.md` §5 names the workstream: "Hypothesis status and reasons; explains-links; graded support and
strain; scenario boards with residue trays; DROP for non-logical reasons; REVISE as switching readings."

The case can already **refute**: a clash, a defeat, a cross-out checked against what is held. The reader mostly does
something else. They hold several stories at once and weigh them. A theory "held up by patches is losing" (`t58.4`).
Another "explains nothing about the curry or the dog" (`t62.4`). The maid "needs two" people where the inside story
needs one (`t92.7`). One culprit lets go when the night "is three stories" (`t68.3`). At ¶226 five old cards change
meaning at once (`t226.2`). None of these is a contradiction. The game has no way to represent a hypothesis as live,
strained, dropped or revised, or to say what it explains and what it leaves over.

## Read first, in this order

1. `CLAUDE.md` (commands, conventions; the reading layer is sacred).
2. `docs/gap-analysis.md`: §2 (HYPOTHESIS, WEIGH, RESIDUE, DROP, REVISE, TEST), §5 item 6, and §6's decisions
   (Round 37: supports and strains are **authored first** from the annotation, computed later from explains-links;
   wrong turns cost nothing; deductions made before Holmes score).
3. `docs/clashes.md`, all of it, with its "Left open". `docs/defeasibility.md`: "Left open", and Q2's three moves.
4. `docs/reading-annotated.md`: the thoughts tagged HYPOTHESIS (27), WEIGH (19), TEST (30), DROP (4), REVISE (4) and
   RESIDUE (1). Also "After the story: the audit" (what each hypothesis ended as, and how).
5. `docs/annotation-review.md`: the 14 rows marked "ws 6" (`t19.4`, `t24.4`, `t26.1`, `t36.3`, `t40.4`, `t58.4`,
   `t60.2`, `t84.5`, `t120.2`, `t133.2`, …).
6. `docs/redesign.md` on hypotheses and scenarios (the reader's process, the alternatives), and Round 19 and Round 32
   of `docs/design.md` (theories; "the game should let the player perform every step").
7. The code:
   - theories: `case.json`'s six, `t.police`, `t.gypsies`, `t.honest_trainer`, `t.derbyshire_a_friend`,
     `t.not_my_horse`, `t.self_wound`, each with `rests_on`, `held_by` and an `assignment`;
   - `Game.checkTheory`, `visibleTheories`, the Theories panel (`ui/app.js`, `toolTheories`), and the timeline's
     per-theory layers (`Game.layers`);
   - the clash weighing, `Game.#clashWeight` (a `[class, within]` tuple, built to be extended);
   - the raise and notice scores (`raiseScores`, the notice scores of Round 84), the shape any new score should take.

## What the earlier work hands this one

- **Thoughts' relations, authored:** 102 `supports`, 18 `strains`, 10 `revises`, 5 `undercuts`, 5 `answers`,
  4 `drops`, 4 `refutes`, 1 `strained_by`. Today the checker validates them and nothing plays them.
- **Deferred here by name:**
  - `t68.3` (`no_inference: workstream-6`, Round 111): the break of one culprit by strain;
  - the strains and drops `t58.4`, `t24.4`, `t64.2`, `t58.3`, `t62.4`, `t68.2`, `t92.7` (`docs/defeasibility.md`);
  - `t56.1`'s "one blow, not repeated" (a strain on `k.police_stick_killed`);
  - the "neutral" doubt reason ("cuts both ways", `t40.7`) and corroboration (`t36.3`);
  - from `docs/clashes.md`: whether a **reservation** (an exception raised and open) should weigh less in a clash,
    and whether a **strained** step should drop below its class. The clash key is a tuple so this can be added.
- **The clash log** (`npm run clash-log` → `.cache/clash-log.txt`, Round 112): every clash, for players with three
  habits (passive, doubting Holmes's curry step, building one culprit; `--build` adds one who builds everything), and
  what is set aside, marked ✓/✗ by the answer key. Today no true card is lost for any of them.

## Mission

1. **Design first.** A paper, `docs/hypotheses.md`, in the shape of the earlier ones:
   - the reader's process, from the thoughts above: how a careful reader holds rival stories, what makes one lose
     without being refuted, what "residue" is, and what a REVISE does to old cards;
   - what exists;
   - questions with alternatives and a recommendation each;
   - the cases as tests;
   - an order of work.

   **Robert decides before anything is built** (`CLAUDE.md`). Questions it must at least answer:
   - What is a hypothesis in the game: a theory (as the six are), a thought, a new card? What is its status
     (live, strained, dropped, refuted, confirmed), and who sets it, the player or the game?
   - What is an explains-link, and is it authored or computed (Round 37: authored first)?
   - What does graded support or strain do in play: show, score, gate nothing? How does it meet the clash weighing?
   - What is a scenario board, what is a residue tray, and what goes in them? How do they sit with the timeline's
     theory layers?
   - DROP for non-logical reasons (parsimony, `t92.7`; explanation, `t62.4`): what does the player do, and what
     does the game check?
   - REVISE as switching readings (`t226.2`, `t68.3`): what changes on the old cards, and how is it shown?
   - Scoring: what scores before Holmes, in the shape of the notice and raise scores.
   - The difficulty presets: what each shows.
2. **Build in agreed steps,** one commit each, with a Round entry. Keep every test passing, or say which
   expectation changes and why.
3. Then the **second review**: the tags workstreams 3 and 6 make modelable (as `docs/annotation-review.md` did).

## Discipline and traps (Rounds 60–111)

- **Measure before designing.** For the clashes, a replay of the whole story for players with different habits found
  more and better cases than the kickoff's list (Round 108). Do the same here: what each hypothesis's support looks
  like, paragraph by paragraph, for a few kinds of player.
- **Gate every commit on the suite in the same command:** `npm test > log && git add <paths> && git commit …`, with
  `run_in_background`, not a shell `&` (a detached job sends no notification). Check the result before pushing.
  **Do not wait on the suite with `pgrep -f "node --test"`:** it matches the waiting shell's own command line.
- **`npm test` takes about 4–5 minutes** (93 tests). Never edit engine or case files while it runs (documents and
  `ui/` are safe).
- **Rerun a whole test file before the suite:** a run filtered to one test by name hides stale asserts elsewhere in
  the file (Round 103).
- **Before and after each step, diff in full** and say what moved:
  - the reveal and foreshadow logs;
  - the clash log (new in Round 112);
  - `report.md` and `thoughts-report.md`;
  - the gate listing: a scratch script that, for each `game.story.gates` paragraph, lists the step ids and
    `game.stepNeeds`.
- **Clash outcomes reach elsewhere:** a test that crosses out an answer at an early paragraph can rest on what a
  clash sets aside (`remoteProblem.test.js`, Round 109). The clash search order matters as much as the weights.
- **A thought that names an inference becomes a route step,** unless the inference is false (Round 111:
  `stepsFromThoughts` leaves false ones off the route).
- **The first clash computation late in the story takes about 11 s** (Easy, ¶218). A new check must not multiply it.
- **A false claim cited as an inference premise is read trusted.** Bind it in the rule instead (Round 87).
- **An exception check leaves out every use of the same default with the same grounded exception** (Round 102).
- **A rule that would give a step away goes where Holmes says it** (Rounds 89, 95, 104).
- **Case data files are one JSON object per line;** edit lines, do not reformat. Thoughts are mirrored in
  `docs/reading-annotated.md` (ids and tags checked).
- **The leak checker:**
  - `--background` for rule texts: write a deliberately weak default as a presumption ("commonly taken to …");
  - `--exceptions` for exceptions;
  - `--all` for card text. Any new card text (a hypothesis label, a residue line) goes through it.
- **UI checks in headless Chrome:**
  - serve with `node scripts/serve.js`, and capture its PID and Chrome's to stop them (pattern kills are blocked);
  - run `google-chrome --headless=new --remote-debugging-port=9333`;
  - load a save made in node into `localStorage` (`mystery-clue-game:silver-blaze:v2`) over the DevTools protocol
    (Node 22 has a global `WebSocket`);
  - reload, wait about 25 s, click the tab, and read `#tool`.
- **Robert's standard for conveniences:** the clash system is a convenience of the lower difficulties and need not
  be perfect (Round 108). List a case it gets wrong rather than chase it.

## Acceptance

- `docs/hypotheses.md` written, discussed and agreed by Robert.
- The agreed steps built, each a Round entry, gated and pushed.
- `t68.3` and the strains and drops above either held as agreed or listed with why not.
