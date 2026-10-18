# Kickoff: workstream 8 — the reader layer

**Date:** 2026-10-18. Handed off by the session that ran Rounds 125–131 of `docs/design.md` (workstream 7:
predictions and test plans, and its review). **Supersedes** `docs/kickoff-workstream-7.md`, whose mission is done.
Read that one only for its traps. They are repeated below with this session's.

## Why this session

Robert's order (2026-10-18): the next workstream in `docs/gap-analysis.md` §5 after workstream 7.

## The question

`docs/gap-analysis.md` §5 item 8: "Reader layer. Background availability (1892, modern) replacing Strict;
disclosure typing; profiles and hint tiers; GENRE (watch-holmes, re-read) and SET ASIDE."

Four strands, each with data already in place and little or nothing played:
- **Background availability.** The 25 background cards (`bk.*` in `thoughts.json`) are marked `reader_1892` and
  `reader_modern` ("yes", "partial", "rare", "period (presented, not endorsed)", "needs the text's gloss (¶225)",
  "racing public", …). Some are stated only after they are needed: opium's taste (¶218), laying against one's own
  horse (¶220), the blaze (¶146). The game's background setting (`start`, `relevant`, `ask`) and the rules'
  `stated_in` and `relevant_from` exist. The case report's **Strict** column (`scripts/validate-case.js`,
  `knownNoLateRules`) still shows what is left when rules stated late are dropped. Round 33 ruled that availability
  per reader replaces Strict.
- **Disclosure typing.** `Game.disclosure(card)` gives only a first-mention paragraph. Workstream 7 built
  `result: {shown | late | never}` for Holmes's checks (`ck.*`). The facts the fair-play table lists (the bill's
  items, the square toes at ¶146, the milliner's word at ¶229, the boot comparison, the maid's question) and §3's
  "late or never disclosed" row ask for the same on facts, with a per-case policy for each: withhold, supply as
  background, or let the player supply it.
- **Profiles and hint tiers.** Every thought carries a `profile` (typical 128, careful 149, expert 18) and a
  `confidence`; 15 carry a `hindsight` note. Nothing reads them. Gap analysis §3: profiles should drive hint tiers
  ("a typical reader would have noticed by now…") and decide which thoughts are bonuses rather than gates.
- **GENRE and SET ASIDE.** There are 20 GENRE thoughts (10 watch-holmes, 2 re-read) and 7 SET ASIDE. Decision 2
  says watch-holmes and genre moves never score, only hint. The `irrelevant` option controls how many unused cards
  are shown. There is no per-card "set aside" state, no re-read action, and no watch-holmes card.

## Read first, in this order

1. `CLAUDE.md` (commands, conventions; the reading layer is sacred).
2. `docs/gap-analysis.md`:
   - §2's GENRE and SET ASIDE rows;
   - §3's background cards, profile, confidence and "late or never disclosed" rows;
   - §5 item 8;
   - §6's decisions 2 (watch-holmes and genre never score) and 4 (withheld facts).
3. `docs/reading-annotated.md`:
   - "Background knowledge cards" (the availability notation);
   - the GENRE and SET ASIDE thoughts;
   - the audit's fair-play gaps table and "Notes for the next pass" (Holmes's behaviour as evidence; background
     cards carry the difficulty).
4. Round 33 of `docs/design.md` (the Strict column superseded by availability per reader), and the Rounds that
   built background arrival (`BG_START`, `BG_RELEVANT`, `BG_ASK`; grep `relevant_from`).
5. `docs/predictions.md` (workstream 7: checks with `result`; its "Left open") and `docs/review-ws7.md` (the
   watch-holmes thoughts as confirmations).
6. The code:
   - `engine/game.js`: `OPTIONS` and `PRESETS` (the preset shape; `weigh` is the latest option), `ruleAt`, the
     background arrival, `irrelevant`, `disclosure`;
   - `engine/thoughts.js` (`READERS`, the profile and confidence checks);
   - `scripts/validate-case.js` (the Strict column);
   - the score family, which a hint must never feed: `thoughtScores`, `noticeScores`, `raiseScores`, `dropScores`,
     `checkScores` and `absenceScores`.

## Mission

1. **Measure first.** Replay the story for a few kinds of player and answer, for instance:
   - which steps become unreachable, or late, for a modern reader given the `reader_modern` marks, and which for a
     reader of 1892;
   - what the Strict column shows today, and what availability per reader would show instead;
   - where each GENRE thought's signal lands against the step it hints at, and how far ahead of Holmes;
   - which cards a SET ASIDE thought names, and whether the `irrelevant` option already hides them.

   The workstream 6 lesson stands: the planned signal may turn out useless.
2. **Design.** A paper, `docs/reader-layer.md`, in the shape of the earlier ones: the reader's process, what exists,
   what was measured, questions with alternatives and a recommendation each, the cases as tests, an order of work.
   **Robert decides before anything is built.** Questions it must at least answer:
   - **Availability:** how a reader setting (1892, modern, and perhaps a racing-literate one) changes what is offered
     and when, and what replaces Strict in the report.
   - **Disclosure on facts:** the field, and the policy for each fair-play gap (withhold, background card, the
     player supplies it). How it meets workstream 7's check results.
   - **Profiles and hints:** what a hint tier is, when it fires, what it may name without giving a step away, and
     whether expert thoughts become bonuses that never gate.
   - **GENRE:** a watch-holmes card or mark (worth less than reasoning, never scored), a re-read action, and whether
     the Checks tab marks a sealed check when Holmes visibly prepares it (`docs/review-ws7.md`, "Left open").
   - **SET ASIDE:** a per-card state that hides a card and costs nothing, and how it relates to `irrelevant`.
   - **The difficulty presets:** what each one gets.
3. **Build in agreed steps,** one commit each, with a Round entry. Keep every test passing, or say which expectation
   changes and why.
4. Then a **short review** of the GENRE and SET ASIDE thoughts and the background cards against what was built, as
   `docs/review-ws7.md` did.

## Discipline and traps (Rounds 60–131)

- **Measure before designing.** In workstream 6 the replay showed that the planned signal ("fit") was useless (Round
  113). In workstream 7 it showed that predictions could not be answers over slots, and that Holmes's action list
  could not be a menu (Round 125).
- **Check what the UI actually shows before reasoning from it.** Workstream 7's draft assumed the read-on button
  names Holmes's next action. It has said "Next paragraph" since Round 10, and `Game.nextAction` has no caller
  (Robert, Round 125).
- **Gate every commit on the suite in the same command:** `npm test > log && git add <paths> && git commit …`, with
  `run_in_background`, not a shell `&` (a detached job sends no notification). Check the result before pushing.
  This includes documentation-only commits.
- **Do not wait on the suite with `pgrep -f "node --test"`:** it matches the waiting shell's own command line.
- **`npm test` takes about 4–5 minutes** (121 tests). Never edit engine or case files while it runs. Documents and
  `ui/` are safe.
- **Rerun a whole test file before the suite:** a run filtered to one test by name hides stale asserts elsewhere in
  the file (Round 103).
- **A new `Game` method can silently replace an old one of the same name** (Round 128: a new `withdraw` replaced the
  exceptions' `withdraw`). Grep `^    name(` in `engine/game.js` before adding one.
- **Before and after each step, diff in full** and say what moved:
  - the reveal and foreshadow logs;
  - the clash log;
  - `report.md` and `thoughts-report.md`;
  - the gate listing: a scratch script that, for each `game.story.gates` paragraph, lists the step ids and
    `game.stepNeeds`.
- **Moving where something happens moves gates, deadlines and the clash log** (Round 126: the mud search's anchor
  moved the knife step's gate, two drop deadlines and four clashes). A free-pace player gets a Holmes step's
  inferences at its earliest gate.
- **A thought that names an inference becomes a route step,** unless the inference is false (Round 111).
- **A new slot needs an inference forcing it,** or the validator fails on uniqueness (Round 122).
- **Slot prompts and card text must not name a hidden agent** (Round 122).
- **Claims need `truth`** (Round 123).
- **Making an inference `implicit` moves `belief.test.js`-style expectations** (Round 123). Grep the tests for its
  id first.
- **A false claim cited as an inference premise is read trusted.** Bind it in the rule instead (Round 87).
- **A rule that would give a step away goes where Holmes says it** (Rounds 89, 95, 104). A hint is the same: it must
  never run ahead of the story.
- **Case data files are one JSON object per line;** edit lines, do not reformat. Thoughts are mirrored in
  `docs/reading-annotated.md` (ids and tags checked).
- **The leak checker:**
  - `--background` for rule texts;
  - `--exceptions` for exceptions;
  - `--all` for card text.

  Any new card or hint text goes through it.
- **UI checks in headless Chrome:**
  - serve with `node scripts/serve.js`, and capture its PID and Chrome's to stop them (pattern kills are blocked);
  - run `google-chrome --headless=new --remote-debugging-port=9333 --user-data-dir=<scratchpad>/chrome`. An older
    headless Chrome may already hold port 9333; it works, but leave it alone;
  - load a save made in node into `localStorage` (`mystery-clue-game:silver-blaze:v2`) over the DevTools protocol;
  - reload, wait about 25 s, click the tab, and read `#tool`, with each `<select>` replaced by its chosen option
    (`innerText` includes every option);
  - a Medium game at ¶170 with background "when relevant" never leaves the Card tab within two minutes (Round 130,
    existing). Check the Medium branches on an Easy save with the option overridden.
- **Robert's standard for conveniences:** the lower difficulties' helpers need not be perfect. List a case they get
  wrong rather than chase it (Round 108).

## Acceptance

- `docs/reader-layer.md` written, discussed and agreed by Robert.
- The agreed steps built, each a Round entry, gated and pushed.
- Each GENRE and SET ASIDE thought, and each background card's availability marks, either held as agreed or listed
  with why not.
