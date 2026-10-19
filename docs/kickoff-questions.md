# Kickoff: the player's own questions (QUESTION)

**Date:** 2026-10-18. Handed off by the session that ran Rounds 143–150 of `docs/design.md` (workstream 9: the UI, its
review). **Supersedes** `docs/kickoff-workstream-9.md`, whose mission is done. Read that one only for its traps; they
are repeated below with this session's.

## Why this session

All nine workstreams of `docs/gap-analysis.md` §5 are done. Workstream 9's closing review (`docs/review-ws9.md`) finds
15 of the 20 tags of §2 playable, and one not playable at all: **QUESTION**, the player's own questions. No workstream
ever took it: §2 asked for it, §5 never listed it. `docs/ui.md` Q7 kept it for a session of its own, because it touches
the reading layer. Robert (2026-10-18): launch that session, for a **planning discussion**.

## The question

The annotation's reader asks questions before the story does, and the game does not let the player do so.
- **What the annotation says** (`docs/reading-annotated.md`, the tag table): QUESTION is "naming a blank", with three
  subtypes: ·opportunity, ·motive, ·turn-around ("inverting a question to make it productive"). The player's move is
  "pin a ? card on a blank or a card".
- **What the gap analysis asked** (§2, QUESTION, "Partial"): "The player poses questions: pin a ? on a card or blank, from
  templates over facets ('Why did {person} carry {object}?', 'Who has a key?'). ·turn-around is a template pair. A player
  question that matches an authored slot opens it early (if the story has made it askable)."
- **The ten thoughts** (`thoughts.json`, tag QUESTION): `t14.2` where a famous horse can be hidden; `t20.7` who handles
  the dish (·opportunity); `t25.1` where the dish was during the window scene (·opportunity); `t31.4` who has a key
  (·opportunity); `t46.5` if Straker, why (·motive, maps `straker.motive`); `t46.6` if Straker, what killed him (maps
  `e.fatal_blow.agent`); `t57.3` what needed doing away from the stable (·turn-around, expert, maps
  `k.operation_in_the_open`); `t92.8` who drugged, Straker or his wife (maps `e.opium_added.agent`); `t108.2` how the
  horse left the hollow without tracks; `t120.3` who is the man. Six map to nothing.
- **What exists today:**
  - questions are slots; a slot is visible once the story raises it (`Game.slotVisible`): an event's own facets with
    the event, a declared slot by a case question's quote (`case.json` `questions`, 14, anchored by
    `story.anchors.questions`), by a held clue or inference that speaks of it, or by a gate of Holmes's;
  - the re-read form (Round 138, shown since Round 148) takes a raised question or a held card;
  - the Checks tab's "Ask {person} about {card}" is a plan, not a question;
  - the reading layer is sacred: a question a player could pick from a list that names a slot the story has not
    raised would tell them where the case turns.

## Read first, in this order

1. `CLAUDE.md` (commands, conventions; the reading layer is sacred).
2. `docs/gap-analysis.md` §2 (QUESTION, and HYPOTHESIS beside it) and §6 decision 2 (what scores).
3. `docs/reading-annotated.md`: the tag table, and the ten QUESTION thoughts in place (search `QUESTION`), with what
   comes before and after each.
4. `docs/review-ws9.md` (where the game stands, tag by tag) and `docs/ui.md` (Q7, and the UI as built).
5. Rounds 4–9 of `docs/design.md` (the reading layer), 32 (every step of the annotation playable), 33–34 (the sheep's
   "who did it?" ruled a question of cause first) and 143–150.
6. The code: `Game.slotVisible`, `questionRaised`, `visibleSlots`, the questions in `case.json`, and in `ui/app.js`
   `toolQuestions` and the slot chips (`renderSlot`).

## Mission

1. **Measure first.**
   - For each of the ten QUESTION thoughts: the paragraph the reader asks it, the slot it would be (if any), and when
     that slot is visible today (raised by what, at which paragraph), for a passive and a builder reader on Easy. How
     early does the reader ask before the game opens the question?
   - Which of the ten could be posed from a template over what the player holds, and what the template's dropdowns
     would offer at that paragraph (and whether any choice would name something not yet met).
   - Whether a posed question should score (decision 2 says deductions and predictions score; questions are not
     mentioned), and against what deadline.
2. **Design, then discuss.** A paper, `docs/questions.md`, in the shape of the earlier ones: the reader's process, what
   exists, what was measured, questions with alternatives and a recommendation each, the cases as tests, an order of
   work. **This session is a planning discussion: Robert decides before anything is built.** Questions it must at
   least answer:
   - **What a player's question is:** a slot opened early, a new card the player holds ("?"), or a note with no logic.
   - **The vocabulary:** templates over facets and held cards, free text, or a list; how none of them leaks.
   - **What a question does:** opens a slot early (when the story "has made it askable" — how is that decided?), feeds
     the re-read form, the Checks tab, the theories; or nothing but the record.
   - **·turn-around** (`t57.3`, expert): a pair of templates, or out of scope.
   - **Scoring:** none, the record only, or scored before the story raises the question.
3. **Build in agreed steps,** one commit each with a Round entry, only after Robert agrees.

## Discipline and traps (Rounds 60–150)

- **Measure before designing** (Rounds 113, 125, 133, 143: each time the planned signal or shape failed on the data).
- **Check a flag's meaning before calling something a gap** (Round 141), and **check what the UI shows in headless
  Chrome** before reasoning from it (Round 125).
- **Gate every commit, documentation-only ones included, on the suite in the same command:** `npm test > log && git
  add <paths> && git commit …`, with `run_in_background`, never a shell `&`. Check the result before pushing.
- **The suite takes 7–8 minutes** (136 tests). **Never edit a file a running gate will commit, nor engine or case
  files:** the gate's `git add` takes them as they stand when the suite ends (Round 146 committed half of the next
  step that way; amended before pushing).
- **The machine is shared** with other projects' jobs (load average up to 16 on 8 cores): every browser time is
  inflated. Compare old and new by serving HEAD from a git worktree on another port and alternating (Round 144).
- **Do not wait on the suite with `pgrep -f "node --test"`:** it matches the waiting shell's own command line.
- **Rerun a whole test file before the suite** (Round 103). **A test that reads on under 'wait' loops at a gate:**
  load a save with `read: N` (Round 137). **A new `Game` method can shadow an old one** (Round 128): grep
  `^    name(` in `engine/game.js`.
- **Before and after each step, diff in full** and say what moved: the reveal and foreshadow logs, the clash log,
  `report.md`, `thoughts-report.md`, and the gate listing (for each `game.story.gates` paragraph, the step ids and
  `game.stepNeeds`). Opening a slot earlier can move what the reveal log shows: a question is card text.
- **Case data files are one JSON object per line;** edit lines. Thoughts are mirrored in `docs/reading-annotated.md`.
- **Any new card text goes through the LLM leak checker** (`--all`; `--background` for rules); fixed UI templates
  around card names have not been, and the Round entry says so.
- **UI checks in headless Chrome:** serve with `node scripts/serve.js` and stop it by PID; the older headless Chrome on
  port 9333 works, use it and leave it alone; make saves in node and load them into `localStorage`
  (`mystery-clue-game:silver-blaze:v2`, `{game, selected}`). `Runtime.enable` replays old console entries: clear them
  after navigating. Section headings are uppercased by CSS, which `innerText` reflects. Workstream 9's scripts
  (`ready.mjs`, `wtime.mjs`, `tlplace.mjs`, `mksave-inc.mjs`, `mksave-build.mjs`, `scores.mjs`) are in its session
  scratchpad, `/tmp/claude-1000/-home-robert-CC-mystery-clue-game/e3345da5-a7fd-4897-a5b6-681a1e9c2365/scratchpad/`.
- **Robert's standard for conveniences:** the lower difficulties' helpers need not be perfect; list a case they get
  wrong rather than chase it (Round 108).

## Acceptance

- `docs/questions.md` written, discussed and agreed by Robert (this session's main deliverable).
- If Robert agrees to build in this session: the agreed steps built, each a Round entry, gated and pushed.
