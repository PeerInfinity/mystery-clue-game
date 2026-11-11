# Technical overview

How the pages are built, how to run and check them, and where things live. The main page is Watson's timeline
(`index.html`, playing the short cases in `cases/miniatures/`; `start.html` lists them); the two Sherlock Holmes
cases it was built on are kept at `v2/` as they stood on 2026-11-11, and the earlier game at `v1/`, each with its own
copy of what it uses. This page has no spoilers; the case
format (`docs/case-format.md`), the annotated reading (`v2/docs/reading-annotated.md`), the ideas page
(`docs/ideas.md`) and everything under `cases/` do.

## The model

### Watson's timeline

The world model (a case's `world/`; the examples here are Silver Blaze's, `v2/cases/silver-blaze/world/`) holds the whole story as **facts**: typed states and actions (where
someone is, who holds what, what a door is, who did what), each at a **time point** of a partial order, each with the
paragraph and quote that give it. Every fact reached the reader through **accounts** passed on by **tellings** to a
**narrator** (Watson), who tells the reader, so each has one or more provenance chains from its origin to the
reader; the player is the reader. The player sets a **trust** level per link, per statement, per person and per
narrator (a narrator's own observations certain by default); a fact is as trusted as its best chain (of those whose tellings the story has told so far), a chain as its weakest link, and what reaches the
threshold is on the timeline. **Contradictions** among what is on the timeline are found automatically (two places,
two states or two identities at once, or a circled answer that needs someone at a place the timeline has them away from). **Questions** list possibilities; a circled one is the player's hypothesis, an
entry like any other. The player's **moves** (a change, what an action needs and does, what it is for, what a plan
would need, and the plan checks) are checked by a generic action table (`engine/actions.js`). The true path through
the page (`world/path.json`) is played by the checks, the autoplay and the hints. `docs/case-format.md` "The world
model as data" describes the files.

### The earlier game (`v1/`)

The earlier game is kept at `v1/` with its own copy of everything it loads and runs (`v1/ui/`, `v1/engine/`,
`v1/cases/`, `v1/scripts/`, `v1/checker/`, `v1/schema/`, `v1/reference/`), so the main tree owes it no
compatibility. Its model, layout and commands are in `v1/docs/technical.md`, its case format in
`v1/docs/case-format.md` (copies of these pages as they stood on 2026-11-06). Its tests are manual only, not part of `npm test`: `npm run v1:test` (about 7–8 min).

## Layout

| Path | What |
|---|---|
| `index.html`, `ui/world.js`, `ui/world.css` (over `ui/style.css`) | Watson's timeline, the main page: the story read so far, every name in it a link to its card (`world/mentions.json`, matched by `engine/story.js`), the world model as an ordered list of events with time points as headings (or the same events as a packed grid, with a column per place or per source: each entry starts a line below the start of the one before), trust controls on each link of a fact's chains and on the statement itself (with undo), an entity's card (its questions, the sentences of the story that mention it, its own event list), a Cards list of everyone and everything met so far by kind, the contradictions among what is on the timeline, each traced to both sides' chains, and the questions (a Questions panel, and each question at its time point on the timeline) whose possibilities the player circles or crosses out (those someone in the story puts forward first, the rest, with every person and animal or place met so far for a who or where question, behind "More"); a circle is an entry on the timeline, and both take part in contradictions. Its layout (Settings): three columns side by side (story, timeline with contradictions and questions, detail), or panels with tabs like the game's (Story, Timeline, Questions, Contradictions, Cards, Detail), two side by side or one; a phone always one. A link opens its tab in the other panel (in one column in place, with a way back). A paragraph number (¶) anywhere scrolls the story to that paragraph. The detail of a typed state or action offers the player's moves (a) and (b) (an entry with moves is marked ⚙ on the timeline, and the timeline can show only those); their entries (Watson's reasoning) go on the timeline, as trusted as their weakest premise, and can be withdrawn; a move that stops holding (a circle changed) is announced in a corner notice and listed on its entry's detail. A case with files (sub-stories) has a tab in the Story panel for each paper, from the paragraph that delivers it; Read on and Read to work on the tab shown, and only the main story has a gate. Reading only goes forward (Read on, or a later ¶ typed in; the story so far stays on the page to scroll back through), and stops before a give-away until each question it answers has exactly one circle (the commitment gate); the answers given show with the player's circle. Settings: what is on the timeline, the layout, the theme, the wait between hints, Reset trust…, Start over… (clears its save, `silver-blaze-world-v1`, but the layout, theme and hint wait, and the autoplay's, `silver-blaze-world-autoplay`), Watch the autoplay…, and the earlier game. Likely clashes (`world/strains.json`) show in amber when one side is the player's circle, and at the give-away as what a careful reader would have noticed. |
| `guide.html` | The player's guide to Watson's timeline, linked from its header and Settings; no spoilers. |
| `world.html` | The page's old address: a redirect to `./`, so links to it still work. |
| `ui/world-case.js` | Which case the page shows: `?case=<dir>`, and its saves' names. With no case named, `index.html` sends the reader to `start.html`, the start page that lists the short cases and links the two full ones; the old addresses of the two full cases go on to `v2/`. |
| `engine/refs.js` | Paragraph references for a case with files (sub-stories): a number for the main story, `"<file>:<n>"` for a file's; the reader's reading as the log of paragraphs read (how far each story is read, whether a reference has been read, the order of reading), saved as `log` beside `para` (the main story's). |
| `engine/shown.js` | What a name or a label may say at a paragraph (the names the story has used so far; time, question and account labels in steps), shared by the page and the leak check. |
| `ui/world-autoplay.js` | The autoplay of Watson's timeline: the true path (`world/path.json`) played through the page (Settings → Watch the autoplay…, `?autoplay`), in a save of its own, in the viewer's layout; the caption says each move in plain words and the reader's `why`, and what a move shows (`see`) is highlighted for a moment. It starts paused; speeds ¼× to 4×, Pause, Step, Stop. |
| `ui/world-moves.js`, `ui/world-hints.js` | The moves of Watson's timeline made through the page (shared by the autoplay and Do it), and the hints: on request (Hint, in the header and on the gate's notice), what a careful reader would do next from wherever the player is: a wrong mark on a question the path settles, a distrust the path does not make (unless it keeps only false things off the timeline: any link of a false chain is as good as the path's), else the next move of the path the page allows now (the soonest answer given away first), else "read on"; three rungs (where, the reasoning, the move with Do it), and a wait after each press (Settings, 30 seconds by default). |
| `engine/world.js` | The world model as data, read: provenance chains, the time order, what each fact and claim asserts, the player's marks on questions as assertions, the contradictions among accepted assertions (typed states such as a door's included, and an identity joining two entities' locations, with a third side, `via`), and the player's trust in links and people. |
| `engine/actions.js` | Typed states and actions for the world model: the generic action table (each action type's requirements just before and effects just after), persistence (a state lasts until something changes it), and the player's moves (a) a change between two differing states and (b) what an action needs and does, as entries from *Watson's reasoning*; where a thing is (`placeAt`), a door's sides, and a named agent's needs (`agentNeeds`); intentions (a goal and a plan) and the moves (c) "what is this for?" (`checkFit`), (d) "what would this need?" (`checkPlan`) and "does it account for this?" (`accountsFor`), and two plans compared (`comparePlans`); an aim's implied last step (`impliedSteps`) and needs a circled reason adds (`ctx.extraNeeds`); what stopped an intended step (`stops`). |
| `engine/story.js` | The story's paragraphs and where it names each entity. |
| `v2/cases/silver-blaze/` (archived, see `v2/`) | The case: `story.txt` and the world model in `world/` (the case header, entities, mentions, time points, facts, accounts, questions, the likely clashes, and the true path through the page, `path.json`). See `docs/case-format.md`, "A case". |
| `v2/cases/speckled-band/` (archived) | The second case, with a room (`room.json`) and observations (`observations.json`) as well: copied from the pipeline's run (`pipeline/runs/speckled-band/case/`, steps 1–12) on 2026-11-10, and edited here by hand from then on, as Silver Blaze is; the run stays as the record of what the pipeline made. Played with `?case=cases/speckled-band`; every check takes `CASE=cases/speckled-band`. `npm test` validates every case in `cases/`. |
| `cases/miniatures/` | The mechanic miniatures (`docs/authored-stories.md`, "What the miniatures showed"): invented stories of a few paragraphs, one game mechanic each, with the logic each was written from (`structure.json`: the questions, the clues and which clues each question needs). Played with `?case=cases/miniatures/<name>`; every check takes `CASE=cases/miniatures/<name>`. `npm test` validates each and checks its structure against its world model. Published, and linked from the README as the place to start. |
| `scripts/` | The world model's validator and provenance, the local server, the site build and the headless-Chrome checks. |
| `v1/` | The earlier game, with its own copy of everything it uses (`v1/docs/technical.md`). |
| `v2/pipeline/` (archived with the two cases it serves; run from `v2/`) | The process that sets up a new story (`pipeline/README.md`): the format spec sent to the model (`spec.md`, `reading-spec.md`: invented examples only), the step prompts (`steps/`), the driver (`run.mjs`: blind `claude -p` calls, checks, repair rounds), the run's assembled case (`assemble.mjs`), the comparison with a case's current data (`compare.mjs`), the source texts (`sources/`) and every run's records (`runs/<case>/`, spoilers). |
| `v2/` | The two Sherlock Holmes cases as they stood on 2026-11-11 (`v2/README.md`), with their own copy of the page, `ui/`, `engine/`, the checks in `scripts/`, the pipeline and the documents about them; like `v1/`, nothing is owed to it from the main tree, whose engine and page change for the short cases. `npm run v2:test`, `npm run v2:page-checks` (about 45 minutes). |

## Running and checking

No build step and no runtime dependencies. The headless-Chrome scripts need a local Chrome. `ajv` (a dev dependency)
is the earlier game's, for its JSON Schema.

| Task | Command |
|---|---|
| Serve the pages | `node scripts/serve.js` → http://localhost:8321/ (Watson's timeline; the earlier game: http://localhost:8321/v1/) |
| All tests of the main tree (the world model's, under a second; the earlier game's are `npm run v1:test`, manual only, about 7–8 min) | `npm test` |
| One test file | `node --test engine/world.test.js` (a directory argument does not work) |
| Check the world model of every short case (one case: `node scripts/validate-world.js <dir>`), including that the true story has no contradiction, and print its counts and the contradictions a reader trusting every source meets | `npm run validate-world` |
| Collect the live site into `_site/` (or a directory given) | `npm run build-site` |
| The earlier game's checks and generators (from `v1/`: `npm run v1:validate`, `v1:validate-thoughts`, `v1:reveal-log`, `v1:foreshadow-log`, `v1:clash-log`; the rest as `node scripts/…` in `v1/`) | see `v1/docs/technical.md` |
| Run one step of the new-story pipeline on a case (blind model calls, recorded with their cost; `--scene`, `--from`, `--dry`) | `node v2/pipeline/run.mjs <case> <step>` |
| Compare a pipeline run's data with the case's current data, by content | `node v2/pipeline/compare.mjs <case> [part]` |
| Rebuild a pipeline run's prompts (not committed), checked against their recorded hashes; rebuild its assembled case | `node v2/pipeline/prompts.mjs <case> [step] [--write]`; `node v2/pipeline/assemble.mjs <case>` |
| How each fact of the world model reached the reader (`--accounts`: per account, and who holds it when) | `node scripts/world-provenance.js <case dir>` |
| Every check of Watson's timeline that plays the page, one after another (the path, the autoplay in each layout and on a phone, the hints); starts the server and a headless Chrome of its own if they are not running, and stops only those (about 6 minutes). `CASE=<dir>` checks another case (a pipeline run's: `CASE=pipeline/runs/silver-blaze-r2/case`; its hint check makes its mistakes from the case's own data) | `npm run page-checks` |
| Every page check on every short case, three cases at a time, each with a headless Chrome of its own (`JOBS=<n>`; cases as arguments for only those); about two minutes | `npm run page-checks-all` |
| The reasoning routes of a case: for each gated question, the links "What is this for?" and plan checks the real page accepts just before its give-away, with the right answers circled that a careful reader could have circled by then, and the changes "It changed" points out, the stops "What stopped it?" finds, the plans to compare and what a plan accounts for (`window.__routes` in `ui/world.js`; `--json <file>` for the report; Silver Blaze: 10 of 27 gated questions, the rest reached by what is told and likely clashes) | `CASE=<dir> node scripts/route-check.mjs` |
| Play the true path (`world/path.json`) through Watson's timeline in headless Chrome (`CASE=<dir>` for another case): each move offered and taken, none possible before its paragraph, every answer right, no contradiction open at the end (about a minute; `STOP=<para>`, `SAVE=<file>` for the state there; a case with files: `ORDER=<story ids>` the order to read them in, `WHOLE=1` each file whole once opened, and `npm run page-checks` runs it in every order) | `node scripts/path-check.mjs` |
| The autoplay of Watson's timeline to the end (`?autoplay=fast`), its save against the path's, the player's own save untouched (under a minute; a layout: `three`, `two`, `one`; `PHONE=1`) | `node scripts/world-autoplay-check.mjs [layout]` |
| The hints of Watson's timeline: a player who only takes hints, from a fresh page and from one with mistakes in it, must reach the end with every answer right (about 3 minutes; `fresh` or `mistakes` for one) | `node scripts/world-hints-check.mjs` |

The headless-Chrome scripts share port 9333: run one at a time, the earlier game's (`v1/scripts/`, default
`http://localhost:8321/v1/`) included.

### Tests that matter most

Node tests check the engine on data built in node, but the page can refuse moves the engine accepts. Only the
headless-Chrome runs play the real page: `npm run page-checks` (`path-check.mjs`, `world-autoplay-check.mjs`,
`world-hints-check.mjs`, `room-check.mjs`: the room panel on the invented `scripts/fixtures/sealed-room`). Run them after any change to the UI, to the data's format or to what a move needs.

## Conventions

- **Nothing runs ahead of the story.** Every piece of card text carries a quote from the story at or before the
  paragraph where it shows; a new background fact, trait or claim must read as plain description, never as a
  hint of what matters.
- **Case data files are one JSON object per line.** Edit lines; do not reformat whole files.
- The world model points into no other file: a reader's step the facts do not model is written out where it is
  used (`reasoning`, `docs/case-format.md`).

## The live site

`.github/workflows/pages.yml` publishes the site to GitHub Pages on every push to `main`: Watson's timeline at the
base URL, its guide beside it, `world.html` redirecting there, and the earlier game with its guide and logic viewer
under `v1/`. `scripts/build-site.js` collects what the pages load (their links and scripts, resolved from each page's
own directory, then `import()`, CSS `url()`) and the cases' data files: for Watson's timeline every `world/*.json`
and the story its `case.json` names; for the earlier game the files `v1/cases/<case>/case.json` names and the data
files its page fetches itself, listed by name (the action tables, `hints.json`, `incremental.json`). A page check
can run against the built site: `node scripts/build-site.js <dir>`, serve `<dir>`, and run the check with
`URL=http://localhost:<port>/` (`URL=… npm run page-checks`; the earlier game's checks take
`URL=http://localhost:<port>/v1/`). The local server redirects a directory without its slash (`/v1` → `/v1/`), as
GitHub Pages does.
