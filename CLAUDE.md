# Mystery clue game — quick reference

## Read first
- `README.md` — what the project is and where it stands: Watson's timeline (`index.html`, the main page) is a
  working foundation; the earlier game, kept at `v1/` with its own copy of everything it uses (no compatibility owed
  to it from the main tree), was an experiment that ran into the adventure-game problem of
  guessing how to express a solution in moves.
- `docs/technical.md` — the model, the layout of the code, every command, the checks that play the real page.
- `docs/case-format.md` — what a case is (the story and `world/`) and the world model's format (spoilers). The
  earlier game's docs are `v1/docs/`.
- `docs/ideas.md` — where the project stands, the chosen direction (Watson fills in the world model) and what was
  built of it, why the earlier game falls short (measured), its other directions (an incremental game, Archipelago
  integration and what the DepGraph exports showed), ideas not built, known limitations, lessons of method.
- `docs/logic-audit.md` — for each gated answer of Watson's timeline, which links of the reader's reasoning the page
  supports, which are partial or missing, grouped by kind, with a proposed order of work (spoilers).
- `docs/reading-annotated.md` — a careful reader's thoughts through the whole story: the spec for the player's
  moves (the earlier game mirrors it in `v1/cases/silver-blaze/thoughts.json`).
- `pipeline/README.md` — the process for setting up a new story, step by step, its blind runs and the comparison
  with the current data.
- `guide.html` — the player's guide to Watson's timeline, linked from its header and Settings; keep it in step with
  the UI and free of spoilers. The earlier game's guide is `v1/guide.html`.

## Commands
See `docs/technical.md`. The ones used most:

| Task | Command |
|---|---|
| All tests of the main tree (under a second) | `npm test` |
| The earlier game's tests (manual only, about 7–8 min; run it in the background) | `npm run v1:test` |
| One test file | `node --test engine/world.test.js` (a directory argument does not work) |
| Serve the pages | `node scripts/serve.js` → http://localhost:8321/ (the earlier game: `/v1/`) |
| Validate the case (the world model) | `npm run validate-world` |
| Every page check of Watson's timeline (about 6 min; starts the server and its own Chrome if needed; `CASE=<dir>` another case) | `npm run page-checks` |
| Play the true path through Watson's timeline (about a minute; port 9333) | `node scripts/path-check.mjs` |
| Watson's timeline's autoplay to the end (under a minute; port 9333; a layout argument) | `node scripts/world-autoplay-check.mjs` |
| Watson's timeline's hints, a hint-only player to the end (about 3 min; port 9333) | `node scripts/world-hints-check.mjs` |
| One step of the new-story pipeline (blind model calls; costs money; recorded in `pipeline/runs/`) | `node pipeline/run.mjs <case> <step>` |
| Compare a pipeline run with the current data | `node pipeline/compare.mjs <case>` |
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
