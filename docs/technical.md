# Technical overview

How the game is built, how to run and check it, and where things live. This page has no spoilers; the case
format (`docs/case-format.md`), the annotated reading (`docs/reading-annotated.md`), the ideas page
(`docs/ideas.md`) and everything under `cases/` do.

## The model

The story's events (who did what, where, when, with what), the owners of things, the true identities of
placeholder characters ("the stranger") and whether each piece of testimony is true are **slots**. The solution
is one value per slot. A **claim** is an atomic clue: it says something about slots. A plain fact that states a
value outright is a *given*; testimony can be false, so it has a truth slot of its own.

The reasoning is carried by **inferences** written in a small formula language over slots (three-valued logic,
with schemas whose variables are grounded against the cards). Each rests on premise cards: clues, and **rule
cards** of general knowledge ("a dog barks at a stranger"). Ruling out an answer while citing some cards is
accepted when the constraints those cards switch on make that answer impossible; building an inference is
accepted when its premises are held. A finite-domain solver checks both. The validator proves the case is well
formed: with all the evidence, every slot the story settles has exactly one value left.

Three time axes are kept apart throughout: the **story's own events** in order (the fabula), the
**investigation** (what the detective and the player do), and **disclosure** (the paragraph where each card is
first told). Nothing on a card may run ahead of disclosure; the validator and the fair-play test enforce it.

Around that core the game models the world over time (where things are, who holds them, what people know and
intend), absences the player notices, testimony and belief, defeasible rules with named exceptions, clashes
between trusted cards, theories weighed by what they cost and leave unexplained, sealed checks (predictions),
the reader's own background, and the record against Holmes. `docs/case-format.md` describes each.

## Layout

| Path | What |
|---|---|
| `index.html`, `ui/app.js`, `ui/style.css` | The game page: the story, cards, questions, theories, checks, timelines, notes, hints, the record. |
| `guide.html` | The player's guide, linked from the game. |
| `logic.html`, `ui/logic.js` | The case's logic laid open (every inference, clue and step). Not part of the game: it shows every answer. |
| `ui/autoplay.js` | The autoplay: plays an action table through the page. |
| `ui/readings.js` | Formulas and clashes read back as plain sentences. |
| `engine/loadCase.js` | Loads a case directory (node or browser). |
| `engine/logic.js` | The formula language and rule schemas. |
| `engine/solver.js` | The finite-domain solver: candidates per slot, checked eliminations, uniqueness, minimal conflict sets. |
| `engine/solverWorker.js`, `engine/remoteProblem.js` | The solver in a Web Worker, for calls too slow for the page. |
| `engine/caseModel.js` | Turns a case into cards, slots and constraints; checks a cited step. |
| `engine/story.js`, `engine/steps.js` | Paragraphs and where everything is disclosed; Holmes's steps and the gates of the 'wait' pace. |
| `engine/game.js` | The player's state and every move; the difficulty options and presets; scoring and the record. |
| `engine/thoughts.js`, `engine/readers.js` | The annotated reading as data; the reader's background. |
| `engine/timeline.js` | The timeline board. |
| `engine/actionTable.js`, `engine/minimalTable.js` | The annotated reader's moves as a script for the page, and the fewest of them that reach the maximum. |
| `engine/hints.js`, `engine/hintData.js`, `engine/hintPlayer.js` | Hints: which row to hint, its rungs, and a player that only takes hints. |
| `engine/stats.js`, `engine/depgraph.js` | The statistics page and the DepGraph exports. |
| `cases/silver-blaze/` | The case: `story.txt`, `case.json` and its parts (entities, events, claims, relations, propositions, constraints, knowledge, states, actions, mentions, thoughts) and the generated files. |
| `schema/case.schema.json` | JSON Schema for the case format. |
| `scripts/` | Validation, generators, logs, the local server, the site build and the headless-Chrome checks. |
| `checker/` | The LLM leak checker over card texts and the autoplay's notes. |
| `reference/v0.1/` | The first extraction (one hand-built clue graph), kept for comparison. |

## Running and checking

No build step and no runtime dependencies. `ajv` (a dev dependency) checks the JSON Schema; the headless-Chrome
scripts need a local Chrome.

| Task | Command |
|---|---|
| Serve the game | `node scripts/serve.js` → http://localhost:8321/ |
| All tests (engine and full case validation, about 7–8 min) | `npm test` |
| One test file | `node --test engine/reasoning.test.js` (a directory argument does not work) |
| Validate the case and rewrite `cases/silver-blaze/report.md` | `npm run validate` |
| Check the annotated reading and rewrite `cases/silver-blaze/thoughts-report.md` | `npm run validate-thoughts` |
| What appears at each paragraph (leak checks) | `npm run reveal-log`, `npm run foreshadow-log` (→ `.cache/`) |
| Every clash met and what it sets aside, for three kinds of player (about a minute; `--build` adds a fourth) | `npm run clash-log` (→ `.cache/clash-log.txt`) |
| The action table: the annotated reader's moves in the page on Hard (about 3–5 min) | `npm run action-table` |
| The minimal playthrough: the fewest of those moves that reach the maximum (about 20–40 min; `WORKERS=n`) | `npm run minimal-table` |
| The hints' data (about 1½ min) | `npm run hints` |
| The statistics, `cases/silver-blaze/stats.md` (about 1½ min) | `npm run stats` |
| The DepGraph exports (about 5 min; `-- --prune` about 2 hours) | `npm run depgraph` |
| Play the action table through the page in headless Chrome, each move checked in the save (about 12–13 min; `STOP=<para>` for a part) | `node scripts/ui-run.mjs` |
| The player's notes through the page (about a minute) | `node scripts/notes-check.mjs [shots dir]` |
| The autoplay through the page to the end (about 6–8 min) | `node scripts/autoplay-check.mjs [minimal] [shots dir]` |
| The hints through the page; `all`: a game that only takes hints must reach the maximum (`DIFFICULTY=easy\|medium`) | `node scripts/hints-check.mjs [all] [shots dir]` |
| LLM leak checker over every card text (costs money; cached) | `node checker/check.js cases/silver-blaze --all --runs 2` |
| LLM leak checker over the notes the autoplay types | `node checker/check.js cases/silver-blaze --notes --runs 2` |

The headless-Chrome scripts share port 9333: run one at a time.

### Generated files

The generated files depend on each other. After a change to the case or to `thoughts.json`, rerun in this order:
`npm run validate` and `npm run validate-thoughts`, then `action-table`, `minimal-table`, `hints`, `stats`,
`depgraph`. Tests check that each is up to date.

### Tests that matter most

Node tests check the engine on saves built in node, but the page can refuse moves the engine accepts. Only the
headless-Chrome runs (`ui-run.mjs`, `hints-check.mjs all`, `autoplay-check.mjs`) play the real page; run them after
any change to the UI or to what a move needs, and check every difficulty, not only Hard.

## Conventions

- **Nothing runs ahead of the story.** Every piece of card text carries a quote from the story at or before the
  paragraph where it shows; a new background fact, trait or claim must read as plain description, never as a
  hint of what matters.
- **Case data files are one JSON object per line.** Edit lines; do not reformat whole files.
- `docs/reading-annotated.md` and `cases/silver-blaze/thoughts.json` mirror each other field by field
  (`npm run validate-thoughts` checks it): change both together.

## The live site

`.github/workflows/pages.yml` publishes the game to GitHub Pages on every push to `main`. `scripts/build-site.js`
collects what the pages load (following `import()`, CSS `url()` and the case's data files) into `_site/`.
