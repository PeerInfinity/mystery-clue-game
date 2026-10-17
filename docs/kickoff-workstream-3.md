# Kickoff: workstream 3, defeasibility

**Date:** 2026-10-17. Handed off by the session that ran Rounds 93–99 of `docs/design.md` (the annotation review
and its six fix batches). **Supersedes** `docs/kickoff-annotation-review.md`, whose mission is done. Read that one
only for its traps; they are repeated below with this session's.

## Why this session

Robert's order (2026-10-17):
1. the focused review (done, Rounds 93–99);
2. **workstream 3, defeasibility** (this session);
3. workstream 6 (hypotheses, scenarios, residue);
4. a second review of the tags those two make modelable.

Today a default rule's `unless` is display text, and a rule application is set aside only when the player doubts
the whole inference. A doubt's reason ("could not have seen it", "an inference written as fact") is recorded since
Round 90, but it has no logic. The annotation's reader does more: an exception is played against one application of
a default (undercut), which weakens the step without making its conclusion false.

## Read first, in this order

1. `CLAUDE.md` (commands, conventions; the reading layer is sacred).
2. `docs/gap-analysis.md`: the DEFAULT, WEIGH and DROP rows of §2, the "undercuts" row of §3, workstream 3 in §5.
3. `docs/annotation-review.md`: the summary, and every row marked "ws 3".
4. `docs/testimony-belief.md` Q5 (the doubt reasons recorded, their logic left to this workstream) and
   `docs/noticing-absence.md` (expectations are default rules).
5. `docs/format-0.3.md`, "Open": the police's four false inferences, ruled (Round 33) to be modelled as
   candidates defeated by undercut, strain and drop.
6. `docs/design.md` Rounds 86–99.

## The inputs the review gathered

**Undercuts the annotation names** (a thought that attacks the step to a conclusion, not the conclusion):
- `t34.3`: "for they are both sound sleepers" against the dog's silence (`t34.2`); weakens, does not defeat
  (Holmes handles it the same way at ¶219, "not barked enough to arouse").
- `t36.2`: Hunter could not have seen the drugging (had he seen it, he would not have eaten) against his charge
  (`t36.1 (drugged)`) and against the window opportunity (`t29.3`). Today: the "mistaken" reading, with the
  recorded reason "could not have seen it".
- `t62.3`: the gypsies' departure points at nothing (they would leave either way) against `t62.2`. Since Round 96
  the case no longer reasons from the departure; the undercut itself has no form (`no_inference: workstream-3`).
- `t64.3`: a search finds a horse only if the searchers know him; a dyed blaze undercuts "searched and not found"
  (`t64.2`).
- `t35.6`: the papers' "defended himself against his assailants" re-filed as the police reading (split, Round 88;
  reason "an inference written as fact", recorded).
- `t56.1`: Gregory's case item by item (the poisoning is Hunter's conclusion; "out in the storm" fixes no hour;
  the stick fits a weapon but not one blow).

**Defaults with named exceptions:**
- `t4.2` and `t68.3`: one culprit for both crimes (`bk.one_culprit`), held without noticing and broken at ¶68.
  Both `no_inference: workstream-3`.
- `t37.16` (`r.drugged_guard`): whoever drugged the guard took the horse, unless "the drugger had an accomplice".
  Robert's ruling (Round 93): the case keeps Straker as the drugger by this default; the accomplice exception
  (his wife drugged, he took the horse) is the open part, and belongs here.
- 65 rules are `default`, 67 carry `unless` (display text today). `r.gypsies_avoid_trouble` is the one flagged
  `stereotype` (·period: "presented, not endorsed").

**Strains and drops** (graded, workstream 6's, but the drop half may touch this one): `t58.4` (Gregory's patches),
`t24.4`, `t64.2`, and the four DROPs (`t58.3`, `t62.4`, `t68.2`, `t92.7`). `t62.4` names an inference since
Round 96.

**The police's four** (`k.police_simpson_drugged`, `k.police_simpson_took_horse`, `k.police_stick_killed`,
`k.gregory_gypsies`, `truth: false`): candidates the reader defeats by undercut, strain and drop (Round 33).
Slice 4's report gate waits on this.

**The doubt reasons recorded** (`DOUBT_REASONS`, Round 90): `could-not-see`, `inference-as-fact`, `hearsay`,
`neutral`. Which of them get logic here, and what logic?

## Mission

1. **Design first.** A paper (`docs/defeasibility.md`) in the shape of the earlier ones: the reader's process,
   what exists, questions with alternatives and a recommendation each, the data each thought above would take, an
   order of work. Robert decides before anything is built (`CLAUDE.md`: discuss alternatives before proposing
   changes). Questions it must at least answer:
   - What is an exception: a card (with a quote, and a formula where it can have one), a reading of a rule, or a
     doubt reason with logic?
   - What does playing one do: suspend one rule application (undercut), or more?
   - How do the police's four become candidates the player defeats, and what gates on them (slice 4)?
   - Which recorded doubt reasons get logic, and which stay recorded?
   - Scoring: is an undercut scored, and against which Holmes paragraph?
2. **Build in agreed steps,** one commit each, with a Round entry.

## Discipline and traps (Rounds 60–99)

- **Gate every commit on the suite in the same command:** `npm test > log && git add <paths> && git commit …`.
  Check the result before pushing.
- **`npm test` takes about 4 minutes** (79 tests). Run it in the background. Never edit engine or case files while
  it runs (documents and `ui/` are safe).
- **Before and after each step, diff in full** and say what moved: the reveal and foreshadow logs, `report.md`,
  `thoughts-report.md`, and the gate listing (a scratch script: for each `game.story.gates` paragraph, the step ids
  and `game.stepNeeds`).
- **A clash sets aside every lowest-weight claim in it** (story clues weigh least, then inferences someone else
  stated, then the player's and Holmes's). Never give a false claim content that contradicts a true clue the
  inferences need. A false statement that contradicts only a built inference is set aside alone (Round 99): test
  it before relying on it.
- **A false claim cited as an inference premise is read trusted.** Bind it in the rule instead (Round 87).
- **A rule's window bound to a case window holds vacuously** when the event's time is an open question (Round 83).
- **A background rule surfaces at its `relevant_from` line.** One that leans towards the solution belongs where
  the story uses it (Rounds 89, 95).
- **Route steps (`concludes.premises` on Holmes's thoughts) are flat lists:** moving a rule's `relevant_from` can
  move a step's gates if the step lists the rule (Round 95: `r.tendon_nick` and `t81.5`). Check the gate listing.
- **Check the story's own paragraph split before trusting an annotation date:** `story.txt` splits on blank lines,
  and a reader's "¶123" can be in ¶122 (Round 95).
- **Nothing the player can pick** may be offered before the story speaks of it (Round 80).
- **Case data files are one JSON object per line;** edit lines, do not reformat. `JSON.stringify` of a parsed
  line round-trips: compact in `thoughts.json`, `", "` / `": "` separators in the case files.
- **Thoughts are mirrored** in `docs/reading-annotated.md` (ids and tags checked); change both together.
- **The LLM leak checker** (`node checker/check.js cases/silver-blaze --all --runs 2`) is cheap on Robert's plan;
  run it after new or reworded card text.

## Acceptance

- `docs/defeasibility.md` written, discussed and agreed by Robert.
- The agreed steps built, each a Round entry, gated and pushed.
- The thoughts marked "ws 3" in `docs/annotation-review.md` either held or given a reason.

## Open, from the leak check of 2026-10-17 (Round 100)

The full checker run (`--all --runs 2`, haiku) passed every card text this review added or reworded, and the four
rules it moved or reworded passed `--background`. It flags 20 pieces, none touched since Round 92: 18 are the
flags of the 2026-10-13 run (names and glosses haiku reads as claims, already looked at), and two are traits added
since then that no run had checked: `stable_key`'s "key" trait (the story says the door was locked, never "key",
before ¶31's card) and `penang_lawyer`'s "bludgeon" trait (haiku mixes up the stranger's stick at ¶21 with
Simpson's at ¶40). Worth a look when either card is next touched; neither is this workstream's.
