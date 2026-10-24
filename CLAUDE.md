# Mystery clue game — quick reference

## Read first
- `README.md` — what the game is and where it stands: an unfinished experiment (it models Holmes's reasoning but
  runs into the adventure-game problem of guessing how to express a solution in moves).
- `docs/technical.md` — the model, the layout of the code, every command, the generated files and their order, the
  checks that play the real page.
- `docs/case-format.md` — the case format and the engine behaviour it drives (spoilers).
- `docs/ideas.md` — why the game falls short (measured), directions that might make it playable (an incremental
  game, Archipelago integration and what the DepGraph exports showed), ideas not built, known limitations, lessons
  of method.
- `docs/reading-annotated.md` — a careful reader's thoughts through the whole story: the spec for the player's
  moves, mirrored field by field in `cases/silver-blaze/thoughts.json`.
- `guide.html` — the player's guide, linked from the game; keep it in step with the UI and free of spoilers.

## Commands
See `docs/technical.md`. The ones used most:

| Task | Command |
|---|---|
| All tests (about 7–8 min; run it in the background) | `npm test` |
| One test file | `node --test engine/reasoning.test.js` (a directory argument does not work) |
| Serve the game | `node scripts/serve.js` → http://localhost:8321/ |
| Validate the case | `npm run validate`, `npm run validate-thoughts` |
| Play the action table through the real page (about 12–13 min; port 9333, one script at a time) | `node scripts/ui-run.mjs` |

## Conventions
- Commit directly to `main`; one commit per completed step; push by default once `npm test` is green.
- Wrap-up = the record is written (the commit message says what was decided and why; `docs/technical.md`,
  `docs/case-format.md` or `docs/ideas.md` updated where they change), committed and pushed: `git status -sb`
  clean and no `[ahead N]`. There is no round-by-round log any more; do not start one.
- The reading layer is sacred: nothing on a card may run ahead of the story. Every piece of card text carries a
  quote; the validator and the fair-play test enforce it. A new background fact, trait or claim must read as plain
  description, never as a hint of what matters.
- The README and `guide.html` carry no spoilers.
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
