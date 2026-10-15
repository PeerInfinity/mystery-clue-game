# Workstream 2, short chains: the options

Status: DISCUSSION, 2026-10-15. Workstream 2 of `docs/gap-analysis.md`. The deduction-type thoughts of the annotated
reading (INFER, DEFAULT, AGENT, PHYSICAL, IDENTIFY: 40 of them) are to become small checkable steps that cite other
thoughts; Holmes's route is to become chains of them; the thoughts' two dates are to replace the gate machinery.
Four questions, each with options and a recommendation.

## Where things stand

- **Inferences** (`constraints.json`, 54): premises (2 to 11), a formula, rule applications; 44 verified by the engine.
  The player builds one by connecting its premises (`propose`), hears it stated, or (no UI yet) concludes any
  entailed formula from cited cards (`conclude`). An inference may already cite another inference: verification
  counts it as held, and `buildable` wants it in hand first. Chains are possible today; they were not used because
  route steps cite only claims and rules.
- **Holmes's route** (`route.json`, 24 steps): premises 2 to 32 (flat: every clue and rule in the ancestry), a
  conclusion, the paragraph that tells it. A step **gates** the paragraph where Holmes acts on it or announces it
  (never before its last premise is told). Under the 'wait' pace the player passes a gate by holding the fewest
  authored inferences the step needs (found by search, `stepNeeds`) or by proving its conclusion.
- **The mismatch:** 21 of the 40 deduction-type thoughts have no inference or route step. 20 inferences match no
  thought: mostly the night's bookkeeping (`k.lads_slept`, `k.wife_stayed_home`, `k.found_before_seven`,
  `k.hunter_was_drugged`, `k.straker_went_out_first`, `k.hollow_order`), steps the engine needs and a reader makes
  without noticing; plus the police's four and `k.simpson_purpose`. Five route steps match no thought.

## Q1. How does a thought become something the engine checks?

**A. Each deduction-type thought maps to one authored inference** in `constraints.json` whose premises are the
cards of the thoughts it cites (claims, rules, other inferences), two to five of them. The thought file stays the
reader's layer; the inference stays the logic. The validator checks that the thought's `from` and the inference's
premises agree (each premise thought maps to a premise card).
- For: no new engine concept; verification, doubting, `conclude`, rule applications all work as now.
- Against: two files describe one step, kept in step by the validator.

**B. Thoughts carry their own logic** (`concludes`, `rules` in `thoughts.json`), verified directly; `constraints.json`
inferences retire.
- For: one place per step.
- Against: the game, the validator and the tests all read inferences from `constraints.json`; moving them is a large
  change for no gain in what the player can do, and it mixes the reading layer with the logic.

**C. Thoughts carry only a target formula; the player concludes freely** (`conclude`), and the game counts a
thought as made when a held conclusion covers its formula. No authored inferences at all.
- For: the most open play (any valid route counts).
- Against: no recipe to check fair play with, nothing to hint from, and the fair-play test would have to search for
  routes instead of replaying one.

**Recommendation: A**, with C's acceptance rule kept as it already is (a conclusion that covers a thought's formula
counts, by any route). A thought's inference is the authored route; the player may take another.

## Q2. What happens to the 54 existing inferences?

**A. Split and re-cite.** Each flat inference whose thought cites other thoughts is rewritten to cite their
inferences instead of re-listing their clues (premises fall to two to five). Inferences matching a thought keep
their ids; new ones are added for the 21 thoughts without one.
**B. Keep them and add the chain beside them.** Old inferences stay as written; new short ones are added; both
verify.
**C. Regenerate them from the thoughts.**

**Recommendation: A.** B leaves two routes to every conclusion and doubles the authoring; C needs B's logic in
the thought file (Q1 B). Under A the 44 verified inferences remain regression cases until their rewritten form
verifies, then are replaced in the same commit, chain by chain, as slice 3 did.

## Q3. What replaces the gates?

**A. Gates from thoughts.** Every deduction-type thought that has a Holmes paragraph gates it: under 'wait' the
player must have made the thought (hold its inference, or a conclusion that covers its formula) before reading
Holmes's paragraph. Its earliest date is checked against the engine: the paragraph by which the game has dealt
every premise card must not be later than the thought's own paragraph (the report lists the misses, as it already
does for RECORDs). `route.json` retires: its steps' conclusions and paragraphs move to the thoughts.
- For: one source of truth for "when can a reader know this" and "when does Holmes say it"; the beat-Holmes window
  is the difference; the fair-play frontier becomes a per-thought check.
- Against: the fair-play test and `stepNeeds` must be rewritten around thoughts; gates move (the report shows by
  how much, and the annotation's dates are often earlier than today's gates).

**B. No hard gates; scoring only.** 'Wait' becomes optional; the game scores each thought made before Holmes's
paragraph.
- For: never blocks the reader.
- Against: drops the one coupling between reasoning and reading that exists today.

**C. Keep `route.json`; replace each step's flat premises with the thought chain behind it.**
- For: the smallest change.
- Against: keeps two lists of Holmes's steps (route and thoughts) that already disagree in five places.

**Recommendation: A, with B's scoring added** (scoring was agreed in Round 37: deductions made before Holmes score).
'Wait' stays a pace option. Only thoughts whose Holmes paragraph states them positively gate; the ones marked
`(contradicts)` or `never` do not.

## Q4. Steps the engine needs but a reader makes without noticing

The night's bookkeeping (the lads slept until seven, Mrs. Straker stayed home, the horse was gone before seven)
has to be derived for the solver to close "who took the horse", but no reader experiences it as a step, and the
annotation has no thought for it.

**A. Add thoughts for them.** The annotation gains INFER thoughts (profile *typical*) for each; the player must make
them like any other.
- For: every step the logic needs is a move the player makes; strict.
- Against: tedium; these are not the moves the annotation was written to capture.

**B. Implicit steps.** An inference with no thought is marked `implicit`: the game grants it as soon as its premises
are held, as Trivial does for everything. It never gates and never scores.
- For: the player reasons at the grain a reader does; the solver still has what it needs.
- Against: the game does a little reasoning for the player; it must be visible (the card says "follows from …") so
  it can be doubted.

**C. Fold them into rules.** Make the bookkeeping general enough that the solver closes it from rules alone (e.g.
"people in bed at one and at seven were home between"), with no inference card at all.
- For: nothing to grant.
- Against: possible for some (the sleepers), not for all; more solver load.

**Recommendation: B, and C where it comes cheap.** Each implicit inference is listed in the thoughts report so the
set stays small and deliberate; if Robert later wants one to be a player move, it gets a thought.

## Order of work, if the recommendations stand

1. Checker: every deduction-type thought maps to exactly one inference (or is listed as missing); premises agree;
   inferences without a thought must be `implicit`; the earliest-date check for deduction thoughts.
2. Chains, in the annotation's order (the curry chain first: `t37.4`–`t37.8`), splitting flat inferences and adding
   the missing ones, verified as slice 3 did; police's four excluded (workstream 3).
3. Gates from thoughts; `route.json` retired; the fair-play test rewritten to replay the thoughts.
4. Scoring of thoughts made before Holmes's paragraph (engine only; UI in workstream 9).
