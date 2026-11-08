# Setting up a new story: the pipeline

**Spoilers:** the runs under `runs/` give away the solutions of their stories.

The process that turns a story's text into a case for the timeline (`docs/case-format.md`, "A case"), step by step,
each step's prompt run by a model in a fresh, blind context, each step's results kept. It was agreed with the user on
2026-11-06 and is tested first on "Silver Blaze", whose hand-made data it is compared against; then on "The
Adventure of the Speckled Band".

## Principles

- **The process produces only what the timeline needs** (`story.txt` and `world/`).
- **Blind runs.** Each step's prompt runs in a fresh context: `claude -p` from an empty temporary directory, with
  every tool disabled (`--tools ""`), no settings, memory or CLAUDE.md (`--setting-sources ""`), no MCP servers
  (`--strict-mcp-config`) and its own system prompt. It sees only what the prompt holds: the step's listed inputs,
  and for the steps that read forward, the story only up to the end of the scene being worked on. The orchestrating
  session never puts a case's existing data into a prompt. The model knows famous stories from training; that is
  unavoidable (a lesser-known author is a later blind test).
- **The format spec has no real case in it** (`spec.md`: an invented story's examples). `docs/case-format.md` is
  never sent: its examples are one case's answers.
- **Everything is recorded.** Each call keeps the prompt as sent, the response, the model, the tokens, the cost and
  the time (`runs/<case>/NN-<step>/…`). See "Records" for what is committed.
- **Checks after every step**, and up to three repair rounds when a check fails: the step's own prompt, its own
  previous output and the check's messages, nothing else.
- **What compensated for knowing the ending** in the hand-made data is kept as steps or checks: the reading's honesty
  rules and ⚠ marks (step 4), the reading written from the story alone (step 4 sees nothing else), redating once the
  whole story is in (step 9), the validator's rule that the true story has no contradiction (step 9), the earliest
  check of the true path (step 11), and a blind leak check of every label (step 12).

## Records

Each call's directory holds `prompt.md` (the system prompt and the message as sent), `response.md`, `meta.json`
(the model, the prompt's SHA-256, the tokens, the cache tokens, the cost, the time), the checks' messages
(`repairN.errors.txt`, `errors.txt`) and the step's accepted `items.json`; a repair round has its own
`repairN.prompt.md`, `.response.md` and `.meta.json`. The responses, items, metadata and messages are committed.
The prompts are not (the user's ruling, 2026-11-07: no large files a script already generates): they are mostly
copies of the story and the data so far, and `node pipeline/prompts.mjs <case> [step] [--write]` rebuilds them,
repairs included, and checks each against its recorded hash. Nor is a run's assembled case (`runs/<case>/case/`),
which `node pipeline/assemble.mjs <case>` rebuilds from the items. A prompt rebuilt at a later commit differs from
the one sent wherever the code or the spec has changed since: check out the run's commit to rebuild it exactly.
The two runs of 2026-11-06 committed their prompts and cases, which stay in the repository; they have no hashes, and
`prompts.mjs` compares with the committed prompt instead (at the current commit, 289 of their 347 prompts rebuild
exactly; the rest differ only by the spec and the repair template changed since).

## The steps

| # | Step | Reads | Writes | How |
|---|---|---|---|---|
| 1 | Text | the source file | `story.txt` | script: paragraphs, ¶0 the title |
| 2 | Header | the story | `world/case.json` | model, one call |
| 3 | Scenes | the story | `scenes.json` (the pipeline's own: id, title, paragraphs) | model, one call |
| 4 | Annotated reading | the story so far, the reading so far | `reading.json` (thoughts) | model, one call per scene |
| 5 | Entities and mentions | the story so far, entities so far | `entities.json`, `mentions.json` | model, per scene; every phrase must be found |
| 6 | Time points | the story so far, entities, times so far | `times.json` | model, per scene |
| 7 | Facts and accounts | the scene, the story so far, entities, times, facts and accounts so far | `facts.json`, `accounts.json` (and new entities and times) | model, per scene; the validator after each |
| 8 | Questions | the story so far, the reading so far, entities, facts, questions so far | `questions.json` (no answers), the facts' picks | model, per scene |
| 9a | Answers | everything, the whole story | each question's answer and its two dates | model, one call |
| 9b | Truth and dates | everything (compact), the whole story, these scenes' facts in full and their annotations | truth, `given_at`, `inferable_at`, inferable facts | model, three scenes a call (`--group 1`: per scene) |
| 9c | Consistency | everything, the validator's messages | patches | model, until the whole case validates |
| 10 | Likely clashes | everything | `strains.json` | model, one call |
| 10b | Typed data | everything, the generic action types | typed actions, doors, guards, goals, implied steps, needs, plans, a case's own action types (`actions.json`) | model, one call |
| 10c | Reasoning routes | the route check's report | more typed data, or why the story reaches an answer another way (`noroute`) | `scripts/route-check.mjs` on the real page; model fills what is missing, until each question the moves could reach has a route or a reason |
| 11 | Leak check, and its fixes | each label with the story up to where it shows | `leak/opus`, `leak/haiku` (reports); 11b, 11c: patches (label steps, plainer names, later possibilities) | `leak.mjs`, blind, per paragraph (Opus judges, Haiku compared); model for the fixes, the leak check again where labels changed |
| 12 | The true path | everything (with the leak fixes) | `path.json` | model writes the moves, a script dates each right answer's circle at its earliest; `scripts/path-check.mjs` plays it through the real page (`?case=`). Then `CASE=<the run's case> npm run page-checks`: the autoplay in every layout and the hints, from a fresh page and with mistakes |

The reasoning moves, in stages (the user, 2026-11-07: all kinds eventually, in more than one task): stage 1,
built, gives "What is this for?" and plan checks (steps 10b, 10c, and step 12 writing those moves); stage 2, built,
adds "It changed", "What stopped it?" and "Compare two plans" (states over time, disabling effects, rival plans).
"Does this plan account for this?" is not yet among the candidates.

Step 11 comes before the true path so that the path is played on the data as it will be published. `run.mjs
--recheck` checks a step's recorded output again (after a fix to its checks), calling the model only to repair.

## The comparison

`compare.mjs` scores a run's data against a case's current data by content, not by id: entities by name and
mentions, time points by label and paragraph, facts by (of, attr, value, time, paragraph) through the entity
matching, questions by label and possibilities, accounts by origin and facts, the reading's thoughts by paragraph,
tag and words. What the current data lacks and is clearly right (a fact the text states, with its quote) is added
to it, listed in the commit message; anything that changes a question, an answer or the true path goes to the user
first. What the new data lacks is traced to the step's instructions, which are fixed, and the step is rerun.

## Running

```
node pipeline/run.mjs <case> <step> [--model opus] [--scene <id>] [--from <scene id>] [--dry] [--recheck]
node pipeline/compare.mjs <case> [step]
node pipeline/prompts.mjs <case> [step] [--write]     rebuild the prompts, checked against their hashes
node pipeline/assemble.mjs <case>                     rebuild the run's case from its items
```

`<case>` is the run's name (`silver-blaze`); the source text and the target case come from
`pipeline/cases.json`. A run's assembled data is `runs/<case>/case/` (`story.txt`, `world/`), rebuilt from the
steps' outputs; `--dry` writes the prompts (`dry.prompt.md`) without calling the model; `--recheck` checks a
step's recorded output again, calling the model only to repair it. Step names: `text`, `header`, `scenes`, `reading`,
`entities`, `times`, `facts`, `questions`, `answers`, `dates`, `consistency`, `strains`, `leak`, `leakfix`,
`leakfix2`, `path`.

## Lessons of the runs

- **Wording that trips the safeguards.** The first prompt for the annotated reading asked for "the thoughts a
  careful reader has", and the model's safeguards refused it (`reasoning_extraction`: it reads as a request for the
  model's own reasoning). Phrased as what it is, a reading guide of a reader's annotations, it runs. Keep that
  wording in `reading-spec.md` and `steps/04-reading.md`.
- **Repairs ask only for what changes.** Asked to give a long output again with its problems fixed, the model gave a
  shorter one and lost lines (step 7, scene s02: 2 problems became 111). The data steps (4 onward) now ask for only
  the lines that change, merged into the earlier output by key (`steps/repair-patch.md`, `run.mjs` `mergeLines`).
- **What waits for a later step.** The facts step leaves out what only the questions or the answer key can give;
  its check ignores those messages of the validator (`steps.mjs` `LATER`).

## The leak check: Opus and Haiku (2026-11-06)

Run first on the current hand-made data of Silver Blaze (`runs/silver-blaze/leak/`), 351 labels at 96 paragraphs,
one call per paragraph, each model the same prompt (`leak.mjs`):

| | flagged | cost |
|---|---|---|
| Opus | 54 | $8.22 |
| Haiku | 65 | $0.23 |
| both | 48 | |

Where they differ (`leak/compare-current-opus-current-haiku.md`), Opus's six of its own were mostly real (two
possibilities whose wording points at their answers, a time label naming a woman before the text does); Haiku's
seventeen of its own were mostly false (it judged a possibility as if it were a claim, or misread who said what). So
Haiku finds nearly every real leak Opus finds, at a thirtieth of the cost, with more false alarms to read through;
Opus is the better judge. The labels both flagged are mostly real and are leaks of the current page and data, which
the timeline never had checked: names shown before the text uses them ("Sherlock Holmes" and "Dr. Watson" at ¶1,
"Silver Blaze" and "John Straker" at ¶4, because a fact told at ¶4 names them), time labels shown with an event told
early ("Tuesday, between one and seven: in the hollow, at the time of the struggle" at ¶4), and account labels
that describe their whole account where its first fact shows. These are for the user to decide on; the pipeline's
own data gets the same check at step 12.

## The first run on Silver Blaze (2026-11-06): steps 1–9 (`runs/silver-blaze/`)

| Step | Calls | Cost | Result | Against the current data (`compare.mjs`) |
|---|---|---|---|---|
| 1 text | – | – | 232 paragraphs | the same text |
| 2 header | 1 | $0.02 | Watson, first person | the same |
| 3 scenes | 1 | $0.18 | 9 scenes | the earlier game's 10, one of its splits merged; starts within a few paragraphs |
| 4 reading | 12 | $5.04 | 253 annotations, 9 wrong turns, 11 hindsight marks | 297, 4, 18; 40% matched by words (a rough measure: two honest readings word things differently) |
| 5 entities | 11 | $3.06 | 204 | 83% of the current 187 found |
| 6 times | 9 | $2.42 | 133 | 98% of the current 56 matched |
| 7 facts | 15 | $14.22 | 960 facts in their accounts | 66% of the current 681 by shape, 86% with the same quote in another shape; 76% of the matched from the same origin |
| 8 questions | 11 | $10.52 | 58 | 19 of the current 33 matched; most of the rest are fair questions the current data does not ask |
| 9a answers | 1 | $1.97 | 49 answered | the same answer, in other words, on every matched question |
| 9b truth, dates | 16 | $28.77 | 15 inferable facts, 11 false | the current has 33 and 28; two validator errors left |
| | 77 | $66.20 | | |

Besides: the stopped first attempt at step 7's scene s02 (about $2.65) and the refused reading call (about $0.12)
are not in the records; the leak checks of the current data cost $8.45.

What to fix next (the fix-and-rerun loop; all taken up in the second run, below):

- **Step 9b is the dearest and gives the least.** Each call sends the whole story and every fact, and each repair
  sends it again: put the per-scene part last so the shared part is cached across calls, or make it one call; and
  it adds few inferable facts (15 against 33), so its instructions need the reading's INFER and HYPOTHESIS
  annotations put to it as candidates.
- **Provenance.** The commonest repair in step 7 was a told account no chain carried to the narrator; `spec.md`
  should show a whole chain (witness → police → newspaper → detective → narrator) in the example.
- **Questions.** The run asks more questions than the current data, many about what Holmes means or does
  (`q.whisper`, `q.photo_why`): fair, but many are not about the events. The prompt should say a question is about
  the events of the case, not the detective's behaviour.
- **The facts the run lacks** (14% of the current): `compare/facts.md` lists them; the classes to trace are the
  `implied` facts, the tellings between third parties and the `observes` facts.
- **The comparison itself** is rough for the reading and the questions (word overlap); read `compare/*.md` rather
  than trusting the percentages.

### The current page's leaks, fixed (2026-11-06)

The user asked for the leaks found in the current page to be fixed. The page and the leak check now share one
module for what may show at a paragraph (`engine/shown.js`; `docs/case-format.md`, "What the page may show at a
paragraph"): names as the story has used them so far, time-point, question and account labels in steps
(`labels`), no day or hour before a time is told, and a fact told early in brief shown only in its brief words. The
data: 8 time labels, 15 account labels, one question label and two names changed (`world/*.json`). The leak check
itself was corrected to time an account's label by the telling that shows it, and to check a paragraph again
only where its labels changed.

Opus, after the fix (`leak/fixed2-opus/report.md`): 5 of 359 labels flagged, against 54 before. All five are
possibilities a careful reader is meant to be able to consider before the story names them, dated by the logic
audit (`q.horse_where` "dead, in a pit or mine" at ¶14, `q.straker_aim` "to injure the horse" at ¶46, the two
answers of `q.why_out` at ¶57, `q.sheep_lame` "someone practised on them" at ¶173); the checker says nothing yet
gives a reason to consider them. That is a judgement on the data's dates, left for the user. The page checks pass
with the fix.

The user (2026-11-07): move them to where the story first suggests them. Moved: "dead, in a pit or mine" to ¶58
(Gregory says it), "to do something that would be heard in the stable" to ¶219 (the dog did not bark enough to
rouse the lads in the loft), "someone practised on them" to ¶221 (the knife was for a delicate operation that
night), "to injure the horse" to ¶57 (Holmes: "If he wished to injure it why could he not do it there?") and "to do
something by a light that would be seen from the stable" to ¶102 (the match struck in the hollow); each answer's
earliest inferable paragraph with them, and the true path's circles (with the links "what is this for?" that need
the reason the horse went out, now at ¶102). The path check and every page check pass. Opus accepts the first three;
it still flags the last two (at ¶57 it reads "injure" as said of the police's suspect, Straker still an honest
servant; at ¶102 nothing yet says why a light mattered), and, this time, "to light the candle for close work" at
¶102, which it passed before. Probing each at candidate paragraphs (`leak/probe-2026-11-07/`), the checker first accepts "to
injure the horse" at ¶175, "to light the candle for close work" at ¶214, and "by a light that would be seen from
the stable" nowhere (¶102 to ¶223). The user: apply what the probes found. So the injury moved to ¶175, the candle
to ¶214, and the light answer was removed; the true path's moves with them (`docs/logic-audit.md`, the note at its
top). After it, the leak check flags none of the 358 labels; the path check and every page check pass.

## The second run on Silver Blaze (2026-11-06): steps 5–12 (`runs/silver-blaze-r2/`)

Steps 1–4 copied from the first run (the reading is the same), steps 5–9 rerun with the fixes the first run asked
for (a whole chain of tellings and the facts easy to leave out in `spec.md`, questions about the events, label rules
from the leak work, 9b's shared part first and the reading's steps as candidates), then steps 9c–12.

| Step | Calls | Cost | Result | Against the current data, or the first run |
|---|---|---|---|---|
| 5 entities | 10 | $2.84 | 207 | 83% of the current found (the same) |
| 6 times | 9 | $2.47 | 114 | 89% matched (98%: labels now in steps read less like the current ones) |
| 7 facts | 14 | $15.60 | 1,111 | 91% of the current found (86%), 80% from the same origin (76%); missing tellings 12 → 5 |
| 8 questions | 10 | $10.73 | 50 | 20 matched; no longer about Holmes's behaviour |
| 9a answers | 1 | $2.01 | | |
| 9b truth, dates | 21 | $37.65 | 19 inferable facts, 35 earlier inferable dates | not thin after all: 54 dated steps against the current 60 ("Step 9b's cost") |
| 9c consistency | 5 | $7.27 | 0 validator errors | a first attempt kept in `.09c-first/` |
| 10 strains | 1 | $1.95 | 37 likely clashes | current 27; the first is the current's "a lost man who knows the night arrangements" |
| 11 leak check | 130 + 130 | $11.67 + $0.33 | Opus 37 → 9 → 0 flagged of 526 after two fix rounds ($0.68) | Haiku 40 at the end, all of them false alarms by Opus's judgement |
| 12 path | 8 | $13.73 | 94 moves (48 circles, 11 crossings, 35 trust) | played through the real page to the end: every answer right, no contradiction open, no likely clash unheld |
| | | $112.17 in all, with the copied steps 1–4 ($5.24) and the leak checks | | |

A reader trusting every source meets 44 contradictions in the run's data (the current data: 41; the first run: 98).

Lessons of the second run:

- **The cache needs a fixed working directory** (and even then helps only an exactly repeated prompt: "Step 9b's cost"). The model's environment block holds its working directory: a fresh
  random one per call made every prompt differ at the start, so nothing was cached (9b's calls cost the same with
  the shared part first). `lib.mjs` now uses one fixed empty directory, and repairs put the task first, so a
  repair shares its prefix with its call; the cache tokens are recorded in each `meta.json`.
- **A source quote as a string** (the pipeline's) where the hand-made data has a list made `engine/story.js` find
  an entity at ¶1 by its first letter; it takes both now.
- **Data errors the validator now catches:** an answer that can be inferred before any right possibility is
  available (the gate could not be met); a line of the wrong kind from a whole-story step.
- **A label naming what the story has not given** (a day, a place, a person) is caught without a model, by its
  capitalised words (`steps.mjs` `aheadWords`, in steps 6, 8 and 11b).
- **A dry run wrote over a recorded prompt** (`--dry` wrote `prompt.md`): step 12's prompt was recovered from its
  first repair's record, which begins with the task; step 11b's was lost (a note in its place). `--dry` now writes
  `dry.prompt.md`.
- **A recheck of an earlier step repairs again** what a later step already fixed (step 9a, after a validator rule
  added later: one call, $1.74, kept in `09a-answers/.recheck-2026-11-07/`, the record restored). `--recheck` now
  refuses a step that later steps have built on.
- **A step run once never sees its own last output**, so a rerun replaces it (the first rerun of step 11 played both
  the old and the new move).

What is next:

- ~~Step 9b's cost~~: done (2026-11-07), below.
- **The typed data for the reasoning moves** (a step between 10 and 12), so that the pipeline's true path can use
  the moves (a)–(d) as the hand-made one does.
- ~~The autoplay and hint checks for a pipeline case~~: done (2026-11-07). `CASE=<dir>` for every page check; on run
  2's case the autoplay plays its 94 moves to the end and the hints reach the end from a fresh page (83 hints) and
  with mistakes made from its data (85, the three mistakes found and undone).
- **The Speckled Band** (`cases.json` has it; no target to compare with): steps 1–12.

## Step 9b's cost (2026-11-07)

Step 9b was the dearest step (run 2: $37.65 in 21 calls of about 220,000 input tokens each). Two findings and four
trials, each on a copy of run 2 up to step 9a (`runs/silver-blaze-9b-*`, experiments, not runs):

- **It was not thin.** Run 2's 9b gave 19 inferable facts against the current data's 33, but also an earlier
  inferable paragraph on 35 stated facts (the current data: 27): 54 dated steps against 60. Its dates are later
  than the current data's where they differ (Straker took the horse out: ¶182, from the dog's silence, against
  ¶46), which is the stricter reading, not a gap.
- **The prompt cache does not help across calls.** Through `claude -p`, Opus reads the cache only for a prompt
  repeated exactly (a repair round identical to the one before: $0.06 against $1.80); a prompt sent as separate
  content blocks after a call that cached the first block alone reads nothing (tested on a small text: Haiku did
  read it, Opus did not). `lib.mjs` can still send blocks (`call` with a list), for whatever it is worth later.

| 9b as | Lines | New inferable | Earlier inferable | given_at | Truth false | Claims' parts | Cost |
|---|---|---|---|---|---|---|---|
| run 2, per scene | 121 | 19 | 35 | 19 | 19 | 33 | $37.65 |
| compact, per scene (`runs/silver-blaze-9b-scenes`) | 135 | 32 | 32 | 22 | 16 | 34 | $24.43 |
| compact, three scenes a call (`runs/silver-blaze-9b-groups`) | 110 | 20 | 33 | 19 | 13 | 29 | $11.57 |
| the whole story in one call (`runs/silver-blaze-9b-whole`) | 69 | 4 | 25 | 3 | 13 | 29 | $7.80 |

Compact: the facts outside the scene in brief (what each says, where told, how reasoned; `steps.mjs`
`COMPACT_KEEP`), the reading without RECORD and SET ASIDE: a scene's prompt 27% smaller. Three scenes a call is now
the default: about the same as run 2 for a third of the cost, with fewer facts found false, which step 9c's
consistency catches; `--group 1` gives the most thorough (per scene, about twice the cost). A call no longer sees
the patches of the calls before it in the same step (each starts from the data as 9b found it); 9c reconciles.

## The reasoning moves, stage 1 (2026-11-07)

The user agreed: a generic core of action types in the engine and each story's own as data (`world/actions.json`;
`docs/case-format.md`, "Typed states and actions"); a typed-data step, a route check by script with a fix call, and
the true path with the reasoning moves; first "What is this for?" and plan checks. A case's own type that a second
story needs too is a candidate for the generic table.

- **The route check** (`scripts/route-check.mjs`, `window.__routes` in the page): just before each gated question's
  give-away, with the right answers circled a careful reader could have by then, every link the page offers and the
  engine accepts, made until nothing new fits. On the hand-made Silver Blaze it finds the true path's nine links and
  routes for 8 of 27 gated questions (the rest come by what is told, clashes, and the moves of stage 2).
- **Run 2 with steps 10b–10c**: 10b ($3.83) typed 47 things, with a case action of its own (nicking a tendon) and its
  ramification (a lame horse loses the race); routes for 4 of 37 gated questions. 10c ($7.53, after a first attempt
  kept in `.10c-first/`) gave the tendon-nicking the needs the story supports (practice, a light, the horse away
  from the stables, out of the lads' hearing), the practice on the sheep as an action of its own, and for five
  questions a reason why the story reaches them otherwise (the turn back is a change of course, the horse's blow
  served no aim, the drugger is found by elimination): 8 of 37.
- **Step 12 with the reasoning moves** ($6.38 after a first try kept in `.12-path-try1/`; the circles-only path
  in `.12-path-circles-only/`): the route check's links as candidates; 121 moves, 11 "What is this for?" (the
  knife, the candle and the match, taking the horse out and opening the door serve the harm to the horse; the
  practice on the sheep leads to it; the harm serves his dishonest purpose) and 4 plan checks, against the
  hand-made path's 9 and 3. It plays through the real page to the end, and every page check passes on it
  (`CASE=pipeline/runs/silver-blaze-r2/case npm run page-checks`: the autoplay in every layout, the hints from a
  fresh page and with mistakes). A link's paragraph is the latest of what it rests on (the circles it names, the
  fact's paragraph); one the page allows earlier is moved down by script from what `path-check.mjs` reports,
  which comes a stop of the path at a time (slow: a run of the step took about an hour of page play). Only the
  statements the page can distrust are listed as false (a narrator's own observation and a claim asserting
  nothing have no trust control).
- **Lessons:** the repairs' merge key must name what a line is about (a `noroute` line by its question, a reasoning
  move by what it links: two such slips collapsed several lines into one); a prompt must carry the action table it
  asks the model to use; a patch's target is checked (`patchShape`); the route check prefers the answer itself to an
  also-right (Hunter also had a key, but the reasoning runs through Straker's).

### Reasoning moves, stage 2: "It changed", "What stopped it?", "Compare two plans"

- **The route check** also lists, just before each gated question's give-away, the changes the page lets the reader
  point out (two typed states of one thing: a door, a walker's `heading`), the known actions that stop a plan's
  intended last step (an effect leaving its agent unable to act), and the pairs of plans of one agent to compare. A
  change counts as a route for the question whose entry it is (who opened the door) or, for a change of heading,
  for the question of that walker's aim; a stop for the questions of its two sides; a comparison names no answer and
  is never a route by itself. On the hand-made Silver Blaze it finds the true path's change (the man's turn back),
  stop (the horse's kick) and comparison (the police theory against "why not in the stable?"): routes for 10 of 27.
- **Step 10b** asks for changing states, disabling effects and plans the story only proposes; **step 12** gets the
  changes, stops and comparisons as candidates and dates each at the latest of its two sides (marks, then changes
  and links, then plan checks, then the checks made on a plan).
- **Run 2 with them** (stage 1's outputs kept in `.10b-stage1/`, `.10c-stage1/`, `.12-path-stage1/`): 10b $3.86
  (the man's two headings, two plans); 10c $5.65, routes 9 of 37, now from all the kinds (the turn back and the
  door's opening by a change, who struck the blow by three stops; who took the horse lost its link and has a
  noroute reason instead). Step 12's first call came back empty ("stopped partway"; kept in
  `.12-path-stage2-refused/`): its repair rewrote the whole path and dropped most wrong turns (4 of 17 crosses). An
  empty answer is now a failure of its own; the step rerun ($2.42, the prompt cached): 120 moves with 8 links, 4 plan
  checks, the change, 2 stops and the comparison of the police's two theories (the hand-made path: 9, 3, 1, 1, 1).
  Every page check passes on its case.
- **Lesson:** a repair that has to write a whole answer loses what the first prompt asked for beyond the errors (the
  wrong turns); an empty first answer is better rerun than repaired.
