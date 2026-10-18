# Kickoff: workstream 9 — the UI

**Date:** 2026-10-18. Handed off by the session that ran Rounds 133–141 of `docs/design.md` (workstream 8: the
reader layer, its review and the period mark). **Supersedes** `docs/kickoff-workstream-8.md`, whose mission is done.
Read that one only for its traps. They are repeated below with this session's.

## Why this session

Robert's order (2026-10-18): launch the next session after workstream 8. Next in `docs/gap-analysis.md` §5 is item
9: "UI for all of the above, behind the busy indicator; the timeline board."

## The question

Workstreams 1–8 built the engine for every tag of the annotation, and each built some UI. They left these gaps:
- **No score is shown anywhere.** The family `thoughtScores` / `score`, `noticeScores`, `raiseScores`, `dropScores`,
  `checkScores` and `absenceScores`, each with an aggregate, has no caller in `ui/`. Decision 2 (`docs/gap-analysis.md`
  §6) says what scores and what never does. Nothing tells the player that they beat Holmes, or by how much.
- **Reasoning with no UI:** `applyRule` and `conclude` (gap analysis §2 INFER, "Covered (no UI)"). Neither is called
  from `ui/`. The player builds inferences only through "Infer from this" (`propose`).
- **The busy page.** A Medium game at ¶170 never leaves the Card tab within two minutes (Round 130), and an Easy save
  at the end needs about 90 s before a tab responds (Round 139). There is a busy indicator (`run`, `showBusy`), but
  this page shows no overlay and logs no error.
- **Left open by the reviews:**
  - `docs/review-ws7.md`: an "advise" template (`t92.13`'s "keep him entered"); theories proposing their own
    predictions (Q6 (c));
  - `docs/review-ws8.md`: a re-read's question is recorded and not used; the purist (`supplied: withheld`) still
    hears Holmes at the story's gates.
- **The timeline board** (`docs/world-model.md`, Rounds 63–70) exists. Whether it carries what workstreams 6–8 added
  (scenarios, residue, sealed checks, set-aside cards) has not been checked.

## Read first, in this order

1. `CLAUDE.md` (commands, conventions; the reading layer is sacred).
2. `docs/gap-analysis.md`: §2 (every tag's "What is needed", for its UI half), §5 item 9, and §6's decisions.
3. `docs/reader-layer.md` and `docs/review-ws8.md` (workstream 8 as built), `docs/predictions.md` and
   `docs/review-ws7.md`, `docs/hypotheses.md` and `docs/review-ws3-ws6.md`: each has a "UI" step and a "Left open".
4. `docs/format-0.3.md`: the "As built" sections, which say what each step put in `ui/`.
5. Rounds 62 (the solver in a Web Worker), 106, 118, 130 and 136–139 of `docs/design.md` (the UI steps so far).
6. The code: `ui/app.js` (about 1,800 lines: `renderNow`, the tool tabs, the `run` busy wrapper, `OPTION_UI`) and
   `ui/logic.js` (`logic.html`). `engine/game.js`'s public methods are the inventory to check the UI against.

## Mission

1. **Measure first.**
   - **An inventory:** for every annotation tag, the player's move, the engine method, and whether and where the UI
     offers it. Do the same for the score family and the options.
   - **Profile the busy page:** what runs during those two minutes, and on which call.

   **Check what the UI actually shows before reasoning from it**, in headless Chrome, not from the code.
2. **Design.** A paper, `docs/ui.md`, in the shape of the earlier ones: the player's process, what exists, what was
   measured, questions with alternatives and a recommendation each, the cases as tests, an order of work.
   **Robert decides before anything is built.** Questions it must at least answer:
   - **Scores:** where and when the player sees them, during play and at the end. What Trivial shows. How "beat
     Holmes by N paragraphs" reads without running ahead of the story.
   - **`applyRule` and `conclude`:** a UI, or retire them in favour of `propose`.
   - **The busy page:** the fix, or a measured reason it cannot be fixed now.
   - **The left-open items above:** build, or keep listed.
   - **The presets:** whether the Options panel, now 15 options, needs grouping.
3. **Build in agreed steps,** one commit each, with a Round entry. Keep every test passing, or say which expectation
   changes and why.
4. Then a **short review** against the gap analysis's §2, tag by tag: can the player now perform every step of the
   annotation in the game (Round 32's ruling)?

## Discipline and traps (Rounds 60–141)

- **Measure before designing.**
  - In workstream 6 the replay showed that the planned signal ("fit") was useless (Round 113).
  - In workstream 7 it showed that predictions could not be answers over slots (Round 125).
  - In workstream 8 it showed that profiles cannot time hints: 38 of 47 scored rows are careful, and a hint at the
    next scene lands about 132 ¶ before Holmes (Round 133).
- **Check a flag's meaning before calling something a gap.** Workstream 8's review read `period: true` (1890s
  knowledge) as the period-belief flag, which is `flags: ["stereotype"]` (Round 141).
- **Check what the UI actually shows before reasoning from it** (Round 125: the read-on button says "Next paragraph").
- **Gate every commit on the suite in the same command:** `npm test > log && git add <paths> && git commit …`, with
  `run_in_background`, not a shell `&` (a detached job sends no notification). Check the result before pushing.
  This includes documentation-only commits.
- **Do not wait on the suite with `pgrep -f "node --test"`:** it matches the waiting shell's own command line.
- **`npm test` takes about 7–8 minutes** (131 tests). Never edit engine or case files while it runs. Documents and
  `ui/` are safe.
- **Rerun a whole test file before the suite:** a run filtered to one test by name hides stale asserts elsewhere in
  the file (Round 103).
- **A test that reads on under the 'wait' pace loops forever at a gate.** Load a save with `read: N` instead (Round
  137).
- **A new `Game` method can silently replace an old one of the same name** (Round 128). Grep `^    name(` in
  `engine/game.js` before adding one. `restore` is the UI's localStorage function, and set aside's inverse is
  `putBack`.
- **Before and after each step, diff in full** and say what moved:
  - the reveal and foreshadow logs;
  - the clash log;
  - `report.md` and `thoughts-report.md`;
  - the gate listing: a scratch script that, for each `game.story.gates` paragraph, lists the step ids and
    `game.stepNeeds`.

  A UI-only step cannot move them. Rerun them anyway.
- **Moving where something happens moves gates, deadlines and the clash log** (Rounds 126, 137).
- **Hints and scores:** no hint may feed a score function, and no hint may run ahead of the story. The story's own
  signals (`storySignals`) are quoted, never interpreted (Round 139).
- **The game never says, before Holmes acts, whether a sealed check matches anything** (`docs/predictions.md` Q1).
  A score display must not either.
- **Case data files are one JSON object per line;** edit lines, do not reformat. Thoughts are mirrored in
  `docs/reading-annotated.md` (ids and tags checked).
- **The leak checker:**
  - `--background` for rule texts;
  - `--exceptions` for exceptions;
  - `--all` for card text.

  Any new card text goes through it. Fixed UI templates around card names and story quotes have not been (Round 139);
  say so in the Round entry.
- **UI checks in headless Chrome:**
  - serve with `node scripts/serve.js`, and capture its PID and Chrome's to stop them (pattern kills are blocked);
  - an older headless Chrome already holds port 9333 (`--remote-debugging-port=9333`). It works; use it and leave
    it alone;
  - make a save in node (`new Game(model, {difficulty, options})`, read to ¶N, `game.save()`) and load it into
    `localStorage` (`mystery-clue-game:silver-blaze:v2`, `{game, selected}`) over the DevTools protocol;
  - reload, then wait: 25 s for an early save, about 60 s at ¶110, about 90 s at the end. Click the tab, and read
    `#tool`, with each `<select>` replaced by its chosen option (`innerText` includes every option). Long tabs:
    search the text for a heading rather than slicing its start.
  - workstream 8's scripts (`cdp.mjs` with `TAB`, `ACT` and `SHOW`; `mksave.mjs <difficulty> <para> <out> [options]`
    with `STEP`) are in its session scratchpad,
    `/tmp/claude-1000/-home-robert-CC-mystery-clue-game/6586568d-c5aa-44be-9e70-1fa18d917bca/scratchpad/`.
- **Robert's standard for conveniences:** the lower difficulties' helpers need not be perfect. List a case they get
  wrong rather than chase it (Round 108).

## Acceptance

- `docs/ui.md` written, discussed and agreed by Robert.
- The agreed steps built, each a Round entry, gated and pushed.
- The closing review: each tag of the gap analysis's §2, playable in the UI or listed with why not.
