# Mystery clue game — quick reference

## Read first
- `README.md` — what the project is and where it stands: Watson's timeline (`index.html`, the main page) plays the
  short cases written for it (`cases/miniatures/`; `start.html` lists them). The two Sherlock Holmes cases it was
  built on, with the new-story pipeline, are archived at `v2/` as they stood on 2026-11-11 (`v2/README.md`), and the
  earlier game at `v1/`: each has its own copy of everything it uses, and no compatibility is owed to either from the
  main tree. Do not re-test or update `v2/` for a change to the main tree unless the user asks.
- `docs/technical.md` — the model, the layout of the code, every command, the checks that play the real page.
- `docs/case-format.md` — what a case is (the story and `world/`) and the world model's format (spoilers). The
  earlier game's docs are `v1/docs/`.
- `docs/ideas.md` — where the project stands, the chosen direction (Watson fills in the world model) and what was
  built of it, why the earlier game falls short (measured), its other directions (an incremental game, Archipelago
  integration and what the DepGraph exports showed), ideas not built, known limitations, lessons of method.
- `docs/authored-stories.md` — the direction since 2026-11-10: new stories written for this system, clues as case
  files, a pluggable spine, the order of experiments, what each miniature showed, the mechanics to add and the
  user's rulings on them (spoilers).
- `v2/docs/logic-audit.md`, `v2/docs/reading-annotated.md`, `v2/pipeline/README.md` — about Silver Blaze and the
  pipeline, archived with them: the audit of each gated answer, the careful reader's thoughts (the spec for the
  player's moves), and the process for setting up a new story.
- `guide.html` — the player's guide to Watson's timeline, linked from its header and Settings; keep it in step with
  the UI and free of spoilers. The earlier game's guide is `v1/guide.html`.

## Commands
See `docs/technical.md`. The ones used most:

| Task | Command |
|---|---|
| All tests of the main tree (under a second) | `npm test` |
| One test file | `node --test engine/world.test.js` (a directory argument does not work) |
| Serve the pages | `node scripts/serve.js` → http://localhost:8321/ (the full cases: `/v2/`; the earlier game: `/v1/`) |
| Validate every short case (one: `node scripts/validate-world.js <dir>`) | `npm run validate-world` |
| Every page check on every short case, three at a time, each with its own Chrome (about 2 min; cases as arguments for only those) | `npm run page-checks-all` |
| Every page check on one case (starts the server and its own Chrome if needed; `CDP_PORT` another Chrome port) | `CASE=<dir> npm run page-checks` |
| Play one case's true path through the page (seconds; port 9333) | `CASE=<dir> node scripts/path-check.mjs` |
| The autoplay to the end (port 9333; a layout argument), the hints (a hint-only player to the end) | `CASE=<dir> node scripts/world-autoplay-check.mjs`, `CASE=<dir> node scripts/world-hints-check.mjs` |
| The archived full cases: their tests, and their page checks (manual only, about 45 min; run in the background) | `npm run v2:test`, `npm run v2:page-checks` |
| The archived pipeline (blind model calls; costs money) | `node v2/pipeline/run.mjs <case> <step>` (`v2/pipeline/README.md`) |
| The earlier game's tests (manual only, about 7–8 min; run it in the background) | `npm run v1:test` |
| The earlier game: its autoplay through the real page (about 6–8 min; port 9333, one script at a time; `/v1/`) | `node v1/scripts/autoplay-check.mjs` |

## Conventions
- Commit directly to `main`; one commit per completed step; push by default once `npm test` is green.
- Wrap-up = the record is written (the commit message says what was decided and why; `docs/technical.md`,
  `docs/case-format.md` or `docs/ideas.md` updated where they change), committed and pushed: `git status -sb`
  clean and no `[ahead N]`. There is no round-by-round log any more; do not start one.
- The reading layer is sacred: nothing on a card may run ahead of the story. Every piece of card text carries a
  quote; the validator and the fair-play test enforce it. A new background fact, trait or claim must read as plain
  description, never as a hint of what matters.
- The README, `guide.html` and `v1/guide.html` carry no spoilers.
- Case data files are one JSON object per line; edit lines, do not reformat whole files.
- Discuss design alternatives before proposing changes; the user decides direction, then the work proceeds.
- Do not name the user in the documentation; write "the user".

## Launching the next session
`~/bin/wsl-launch-claude.sh` (the user's launcher; see the Archipelago-CC memory `reference_wsl_launch_claude`)
opens a new Windows Terminal tab with a Claude Code session in this tree, the prompt read from a file. Write a
kickoff document in `.cache/` (not committed) first, then a short prompt file pointing at it, and run (from the
harness's Bash the Windows dirs must be on PATH):

```
PATH="$PATH:/mnt/c/Windows/System32:/mnt/c/Windows" ~/bin/wsl-launch-claude.sh -m opus \
  -C ~/CC/mystery-clue-game -d true -t "<label>" -f <prompt file>
```

`-C` makes the session start here (so it loads this CLAUDE.md and this project's memory); `-d true` skips the
Archipelago venv; `-m opus` is the standing ruling unless the user asks for Fable. A successful launch prints
nothing: verify by the new socket under `/run/user/1000/cc-socks/<pid>.sock` whose `/proc/<pid>/cwd` is this tree.
The handing-off session may end itself once its record is written, committed and pushed.
