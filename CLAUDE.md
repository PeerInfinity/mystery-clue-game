# Mystery clue game — quick reference

## Read first
- `docs/kickoff-closing-review.md` — the next sessions' work (Round 156), in Robert's order: a closing review of the
  whole game against the annotation, thought by thought (its paper: `docs/review-closing.md`); then the layout (tabs at
  the top of both panels, the story as a tab, one or two columns); the player's notes on the story text; an autoplay
  that plays Hard to the maximum score through the UI, typing the annotation's thoughts as notes. Each piece a paper
  agreed with Robert before it is built.
- `docs/questions.md` — the player's own questions (QUESTION): measured and agreed (Round 151), built (Rounds
  152–155): `Game.pose` over `QUESTION_TEMPLATES`, matched quietly to a slot and joining it only when the story (or the
  player's inference) raises it; a card's "Ask your own question", Your questions, the re-read form, the bar's note,
  the record (never counted); "Where is Silver Blaze?" raised at ¶14. QUESTION is now playable, unscored
  (`docs/review-ws9.md`). Kickoff: `docs/kickoff-questions.md`.
- `docs/ui.md` — workstream 9 (the UI): measured and agreed (Round 143), built (Rounds 144–148): the busy page
  (seeded clashes, pieces drawn after the page), the record against Holmes (`Game.record`, shown only as the story
  reaches each deadline), "state it yourself" (`concludeFrom`), the small items. Its review: `docs/review-ws9.md`
  (Round 149): 15 of the 20 tags playable, QUESTION (the player's own questions) not. Kickoff:
  `docs/kickoff-workstream-9.md`. All nine workstreams of `docs/gap-analysis.md` §5 are done.
- `docs/reader-layer.md` — workstream 8 (the reader layer): agreed (Round 133), built (Rounds 134–139): the `reader`
  and `supplied` options (`engine/readers.js`), `Game.disclosure` and `heldBack`, expert steps that never gate, set
  aside and re-read, `hints: story` (Holmes's interest). Kickoff: `docs/kickoff-workstream-8.md`. Its review:
  `docs/review-ws8.md` (Round 140).
- `docs/predictions.md` — workstream 7 (predictions and test plans): agreed (Round 125), built (Rounds 126–130):
  sealed checks (`ck.*` in `knowledge.json`, a Checks tab), `checkScores` and `absenceScores`. Kickoff:
  `docs/kickoff-workstream-7.md`. Its review: `docs/review-ws7.md` (Round 131), a verdict per thought.
- `docs/hypotheses.md` — workstream 6 (hypotheses, scenarios, residue): agreed (Round 113), built (Rounds 114–118).
  Kickoff: `docs/kickoff-workstream-6.md`.
- `docs/review-ws3-ws6.md` — the second review (Round 119): what workstreams 3 and 6 make modelable, a verdict per
  thought; its four fix batches built (Rounds 120–123).
- `docs/clashes.md` — how clashes weigh what they set aside, with Q6 (one culprit): agreed (Round 108), built
  (Rounds 109–111); its "Left open" feeds workstream 6.
- `docs/defeasibility.md` — workstream 3 (defeasibility): agreed (Round 101), built (Rounds 102–106); its Q6 was
  settled by the clash paper.
- `docs/annotation-review.md` — the focused review of the annotated reading: a verdict per thought in scope; its six
  fix batches built (Rounds 93–99); its "ws 3" rows are workstream 3's inputs. Workstreams 4 and 5 are done (Rounds
  80–91).
- `docs/noticing-absence.md` — noticing and absence (workstream 5): agreed (Round 82), built (Rounds 83–85).
- `docs/testimony-belief.md` — testimony, sources and belief (workstream 4): agreed (Round 86), built (Rounds 87–90).
- `docs/knowledge-intention.md` — knowledge, intention and belief: agreed (Round 72), built but belief (Rounds 76–78).
- `docs/format-0.3.md` — the case format as built, and the decisions taken on it.
- `docs/redesign.md` — the design discussion the format serves: the reader's process, what the logic and the
  gameplay are missing, the alternatives, and the order of work.
- `docs/reading-annotated.md` — a careful reader's thoughts through the whole story, tagged, with premises and dates:
  the spec for player actions (Round 32: the game should let the player perform every step).
- `docs/gap-analysis.md` — the annotation against the format and the game: what is covered, partial or missing,
  and the workstreams in order (Round 36).
- `docs/short-chains.md` and `docs/world-model.md` — the agreed designs for the next two pieces of work (Round 39).
- `docs/design.md` — the round-by-round log (one entry per session or ruling; append, never rewrite).

## Commands
| Task | Command |
|---|---|
| All tests (engine + full case validation, about 7–8 min; run it in the background) | `npm test` |
| One test file | `node --test engine/reasoning.test.js` (a directory argument does not work) |
| Validate the case and rewrite `cases/silver-blaze/report.md` | `npm run validate` |
| Serve the game | `node scripts/serve.js` → http://localhost:8321/ (`logic.html` lays the case's logic open; the Timeline tab has the board) |
| Check the annotated reading (`thoughts.json`) and rewrite `cases/silver-blaze/thoughts-report.md` | `npm run validate-thoughts` |
| What appears at each paragraph (leak checks) | `npm run reveal-log`, `npm run foreshadow-log` (→ `.cache/`) |
| Every clash met and what it sets aside, for three kinds of player (about a minute; `--build` adds a fourth, 5 min) | `npm run clash-log` (→ `.cache/clash-log.txt`) |
| LLM leak checker over every card text | `node checker/check.js cases/silver-blaze --all --runs 2` (costs money; cached) |

## Conventions
- Commit directly to `main`; one commit per completed step; push by default once `npm test` is green.
- Wrap-up = the record is WRITTEN (a Round entry in `docs/design.md`, the format doc updated), committed and
  pushed: `git status -sb` clean and no `[ahead N]`.
- The reading layer is sacred: nothing on a card may run ahead of the story (Rounds 4–9 of `docs/design.md`).
  Every piece of card text carries a quote; the validator and the fair-play test enforce it. A new background
  fact, trait or claim must read as plain description, never as a hint of what matters.
- Case data files are one JSON object per line; edit lines, do not reformat whole files.
- Discuss design alternatives before proposing changes; Robert decides direction, then the work proceeds.

## Launching the next session
`~/bin/wsl-launch-claude.sh` (Robert's launcher; see the Archipelago-CC memory `reference_wsl_launch_claude`) opens a
new Windows Terminal tab with a Claude Code session in this tree, the prompt read from a file. Write a kickoff
document in `docs/` first, then a short prompt file pointing at it, and run (from the harness's Bash the Windows
dirs must be on PATH):

```
PATH="$PATH:/mnt/c/Windows/System32:/mnt/c/Windows" ~/bin/wsl-launch-claude.sh -m opus \
  -C /home/robert/CC/mystery-clue-game -d true -t "<label>" -f <prompt file>
```

`-C` makes the session start here (so it loads this CLAUDE.md and this project's memory); `-d true` skips the
Archipelago venv; `-m opus` is the standing ruling unless Robert asks for Fable. A successful launch prints
nothing: verify by the new socket under `/run/user/1000/cc-socks/<pid>.sock` whose `/proc/<pid>/cwd` is this tree.
The handing-off session may end itself once its record is written, committed and pushed.
