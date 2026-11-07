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
  the time (`runs/<case>/NN-<step>/…`). The runs are committed.
- **Checks after every step**, and up to three repair rounds when a check fails: the step's own prompt, its own
  previous output and the check's messages, nothing else.
- **What compensated for knowing the ending** in the hand-made data is kept as steps or checks: the reading's honesty
  rules and ⚠ marks (step 4), the reading written from the story alone (step 4 sees nothing else), redating once the
  whole story is in (step 9), the validator's rule that the true story has no contradiction (step 9), the earliest
  check of the true path (step 11), and a blind leak check of every label (step 12).

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
| 9 | The whole story | everything, the whole story | answers, truth, the two dates of each fact and answer | model, per part of the data; the validator, no contradiction in the true story |
| 10 | Logic audit and likely clashes | everything | `strains.json`, data for missing links | model and the page |
| 11 | The true path | everything | `path.json` | model drafts, `scripts/path-check.mjs` plays it; the earliest check |
| 12 | Leak check | each label with the story up to where it shows | a report | model, blind, per paragraph; Opus and Haiku compared |

The first run goes to step 9, then the comparison and the fix-and-rerun loop; steps 10–12 follow once the facts are
good.

## The comparison

`compare.mjs` scores a run's data against a case's current data by content, not by id: entities by name and
mentions, time points by label and paragraph, facts by (of, attr, value, time, paragraph) through the entity
matching, questions by label and possibilities, accounts by origin and facts, the reading's thoughts by paragraph,
tag and words. What the current data lacks and is clearly right (a fact the text states, with its quote) is added
to it, listed in the commit message; anything that changes a question, an answer or the true path goes to the user
first. What the new data lacks is traced to the step's instructions, which are fixed, and the step is rerun.

## Running

```
node pipeline/run.mjs <case> <step> [--model opus] [--scene <id>] [--from <scene id>] [--dry]
node pipeline/compare.mjs <case> [step]
```

`<case>` is the run's name (`silver-blaze`); the source text and the target case come from
`pipeline/cases.json`. A run's assembled data is `runs/<case>/case/` (`story.txt`, `world/`), rebuilt from the
steps' outputs; `--dry` writes the prompts without calling the model.

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
