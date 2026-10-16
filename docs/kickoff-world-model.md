# Kickoff: the world model (states over time, and the timeline)

**Date:** 2026-10-16. The previous session (Opus) ran Rounds 41–58 of `docs/design.md`. **Supersedes**
`docs/kickoff-short-chains.md`: workstream 2 is done, so read it only for its traps.

## Read first, in this order

1. `CLAUDE.md` (commands, conventions).
2. `docs/world-model.md`: **this work**, an agreed design (Rounds 39–40).
3. `docs/design.md` Rounds 41–58, with Rounds 53, 56, 57 and 58 above all. They cover how the thoughts drive the
   game now:
   - implicit inferences, and the wait for events and entities;
   - `no_inference` reasons;
   - Holmes's steps built from `thoughts.json` by `engine/steps.js`, with `route.json` retired;
   - scoring.
4. `docs/format-0.3.md`, its "As built" sections (the last three above all) and "Open".
5. `docs/short-chains.md` Q4–Q5 (the implicit steps the world model should shrink) and `docs/gap-analysis.md`
   (where this sits among the workstreams).
6. `docs/reading-annotated.md`: its "state of mind" blocks are the picture the timeline should hold. Its data is
   `cases/silver-blaze/thoughts.json`.
7. The notes at the top of `engine/solver.js`, before adding rules that range over many open slots. State rules
   will.

## Mission

Give the case **states**: location, possession and condition of one thing in one time window. Tie them to events
with general rules. Fill them from claims, as event facets are filled now. Re-derive the night's bookkeeping with
them, so the implicit inferences shrink. Then show the states on a minimal timeline, in both layouts, and add
layers over theories. This is steps 1–4 of `docs/world-model.md`'s "Order of work".

Knowledge, intention and belief (step 5) and the full board UI (step 6) are later sessions' work.

## Settled rulings: do not re-litigate

1. **The design** in `docs/world-model.md`:
   - states are sparse, existing only where the case declares them or the player opens one;
   - location, possession and condition come first;
   - placement is a free pencil mark by default, checked at commit in the harder settings;
   - the timeline has two layouts, by place and by thing, as a setting;
   - a proven placement is a card;
   - a layer is a theory's assignment.
2. **Short chains, as built** (Rounds 41–58):
   - each deduction thought names one inference or gives a `no_inference` reason;
   - an inference no thought names is `implicit`;
   - `implicitRequired` is on;
   - Holmes's steps, gates and scoring come from the thoughts.

   Keep all of it green. A state rule that replaces an implicit inference removes or rewrites that inference in the
   same commit, and the Round entry names it.
3. **Only Holmes's own non-implicit inferences gate**, at his first Holmes paragraph; a thought with `concludes`
   gates at Holmes's line (Round 57). New states must not add gates by themselves.
4. **The police's four** (`k.police_*`, `k.gregory_gypsies`) stay as they are, for workstream 3.
5. **The reading layer is sacred** (CLAUDE.md): nothing on a card may run ahead of the story. Every state a claim
   fills is quoted from the claim's own line. A rule's text is a general fact, never the case's answer (Round 52).

## Steps

1. **States in the format.** The design does not settle the file and slot shape, so propose it to Robert before
   building:
   - a `states.json` part, its schema and its id pattern;
   - how a state slot's domain is given;
   - "elsewhere" and "unknown";
   - how a claim's `asserts` names a state.

   Then:
   - build the location, possession and condition aspects and their state slots;
   - write the tying rules, with schemas: an event's agent is at its place at its time; persistence as a default
     with named exceptions; one place at a time; holder and held together; a condition from its cause to its end;
   - have claims fill states.

   The validator checks:
   - every declared state is quoted through a claim or derived;
   - declared states are unique.

   Watch solver cost: time `npm run validate` and `npm test` before and after, and put the figures in the Round
   entry.
2. **Re-derive the bookkeeping** with state rules: `k.lads_slept`, `k.wife_stayed_home`, `k.found_before_seven`,
   `k.hunter_was_drugged`, `k.straker_went_out_first`, `k.night_sequence`, `k.hollow_order` and the others marked
   `implicit`. Record which implicit inferences go and which stay, and why. The six thoughts marked
   `no_inference: world-model` (`t24.2`, `t34.5`, `t78.2`, `t82.3`, `t123.2`, `t150.1`) get an inference where a
   state now gives them a slot to settle. Where one still cannot, say so.
3. **A minimal timeline view**, read-only first, then placement with pencil marks, in both layouts. It goes in
   `ui/`, next to the existing views, and can be seen with `node scripts/serve.js`. Engine first, then the view;
   the engine API is tested.
4. **Layers** over theories, with fit checking: the police's night, the inside story, the player's own.

Each step, or each chain within a step, is its own commit with a Round entry. Then stop and hand over.

## Discipline and traps

- `npm test` takes about 2–2.5 minutes: run it in the background, before each commit. Gate the commit on its exit
  code (`npm test && … && git commit && git push`). One push in Round 45 went out red.
- Do not wait on `pgrep -f "node --test"` from a shell whose own command line contains that string: it matches
  itself. Run the gated commit itself in the background; the harness reports when it exits.
- Before and after each step, save and diff in full:
  - `npm run reveal-log` and `npm run foreshadow-log`;
  - `cases/silver-blaze/report.md`;
  - `npm run validate-thoughts` (its report);
  - a listing of every gate and the inferences it needs (the previous session's script printed
    `model.story.gates` after `stepsBefore(0, data)`).

  Read the diffs, not only their size: they caught real leaks this time. Say in the Round entry what moved.
- Making an inference implicit moves it to where its premises are held, often far earlier. Read its label against
  that paragraph (Rounds 53–55 reworded four). A granted card must never name an entity not yet dealt; the engine
  now waits for that (Round 53).
- A gate deals the card that holds an `eq` conclusion's question one paragraph before the gate. If no text has
  named that card yet, the validator refuses it.
- A rule's `relevant_from` must neither run ahead of the story nor lag behind a gate.
- Case data files hold one JSON object per line: edit lines, never reformat. `thoughts.json` likewise. Change
  `docs/reading-annotated.md` and `thoughts.json` together.
- Discuss design alternatives with Robert before changing direction; he decides. Report in the tab.

## Open, for Robert when it comes up

- The four RECORDs the game deals late (`thoughts-report.md`): Holmes's "not yet found" (¶14 → ¶37), the
  doubled track's turn and return (¶122, ¶123 → ¶124), the photograph (¶161 → ¶162). States may settle some of
  these.
- Two borderline rule texts were left as written in Round 52: `r.tendon_nick` and `r.horse_gregarious` (both
  shown from ¶18).
- The case report's Strict column leaves the thigh cut open since Round 54, because the step passes through a
  default rule.

## Acceptance

- `npm test` is green.
- Location, possession and condition states are in the format, validated and filled from claims.
- The bookkeeping is re-derived, with the change to the implicit list recorded.
- The world-model thoughts are resolved or explained.
- A timeline view shows both layouts and takes pencil placements.
- Layers over theories check fit.
- There is a Round entry per step, `docs/format-0.3.md` has "As built" notes, and the work is committed and pushed.
