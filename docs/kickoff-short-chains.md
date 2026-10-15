# Kickoff: workstream 2, short chains

**Date:** 2026-10-15 (Opus session, Rounds 32–40 of `docs/design.md`). **Supersedes** `docs/kickoff-0.3-migration.md`
(slice 3 is closed at chains 1–8; its open items were ruled in Rounds 33–35).

## Read first, in this order

1. `CLAUDE.md` (commands, conventions).
2. `docs/design.md` Rounds 32–40 (how this direction was reached, and every ruling since).
3. `docs/reading-annotated.md`: the spec. The game should let the player perform every step in it. Skim the
   notation section and one scene closely; its data is `cases/silver-blaze/thoughts.json`.
4. `docs/gap-analysis.md`: the workstreams and the four decisions of §6 (agreed).
5. `docs/short-chains.md`: **this work**, Q1–Q5 agreed.
6. `docs/world-model.md`: the next piece of work after this one (agreed design); keep it in mind so the chains do
   not make it harder (Q5).
7. `docs/format-0.3.md` "As built" sections and "Open", and the notes at the top of `engine/solver.js` before
   touching rules that range over many open slots.

## Mission

Turn the annotation's deduction-type thoughts (INFER, DEFAULT, AGENT, PHYSICAL, IDENTIFY: 40) into short verified
inferences that cite the inferences behind them; make Holmes's gates and the fair-play test come from the
thoughts; retire `route.json`; score deductions made before Holmes. Keep the reading layer untouched and every test
green throughout.

## Settled rulings: do not re-litigate

1. **Thoughts live in `thoughts.json`** and point to the case's cards (`maps`); the Markdown annotation is the
   prose. Change both together; `npm test` checks they agree on ids and tags. (Round 37)
2. **Q1:** each deduction-type thought maps to exactly one authored inference in `constraints.json`, whose
   premises are its cited thoughts' cards, two to five of them. Any conclusion of the player's that covers the
   thought's formula also makes it. (Round 39)
3. **Q2:** split and re-cite the flat inferences chain by chain; keep ids where an inference matches a thought;
   add inferences for the 21 thoughts without one; replace an old inference only in the commit where its rewritten
   form verifies.
4. **Q3:** gates come from the thoughts' Holmes paragraphs (only thoughts Holmes states positively; not
   `(contradicts)`, not `never`); each thought's earliest date is checked against the engine; `route.json` retires;
   scoring of deductions made before Holmes is added; 'wait' stays a pace option.
5. **Q4:** an inference with no thought is `implicit`: granted as soon as its premises are held, never gates,
   never scores, visible ("follows from …") and doubtable. The implicit list is provisional (Q5): the world model
   will turn much of the night's bookkeeping into rule applications over states. Chains that lean on bookkeeping
   cite it through one inference.
6. **The police's four** (`k.police_*`, `k.gregory_gypsies`) are not migrated here: they become candidate-set
   members defeated by undercut, strain and drop in workstream 3 (Round 33). Leave them as they are.
7. **Scoring:** deductions and sealed predictions made before Holmes score; notices only in aggregate; watch-holmes
   and genre moves only hint; wrong turns cost nothing. (Round 37)
8. **Rulings already applied:** the sheep's cause before its culprit (Round 34); the kitchen is the house (Round 35).
9. **The reading layer is sacred** (CLAUDE.md): nothing on a card may run ahead of the story.

## Steps

1. **Checker** (`engine/thoughts.js`, `scripts/validate-thoughts.js`):
   - an explicit `inference` field on each deduction-type thought (one `k.*` id), separate from `maps`;
   - `implicit: true` allowed on inferences (schema); an inference that no thought names must be implicit
     (warn first, error once the chains are done);
   - premises agree: each thought the deduction cites corresponds to a premise card of its inference (its
     inference, or the claims and rules it maps to), and each premise of the inference to a cited thought or a
     background card's rule; report mismatches;
   - earliest date: the paragraph by which the game (reading through, cards dealt, background "relevant") has dealt
     every premise of the thought's inference must be no later than the thought's paragraph; list misses in the
     report as warnings (the annotation is often earlier than today's gates; each miss is either a late card to fix
     or an annotation date to correct, a judgement per case).
2. **Chains**, in this order, each its own commit with a Round entry: the curry (`t20.6`, `t37.4`–`t37.9`); the
   key and the door (`t31.3`, `t33.2`, `t37.5`, `t46.2`); the dog (`t34.4`, `t219.1`); the knife (`t81.3`–`t81.5`,
   `t57.3`); the bill and the second household (`t84.3`–`t84.8`, `t92.2`, `t92.4`); the coat and the vesta
   (`t96.1`, `t97.2`, `t102.2`); Mapleton and Brown (`t19.5`, `t40.4`, `t114.2`, `t116.2`, `t120.1`, `t124.2`,
   `t127.3`, `t127.4`, `t140.2`); the disguise (`t64.3`, `t141.1`, `t148.2`, `t198.2`); the horse as killer
   (`t37.13`, `t120.2`); the sheep (`t92.14`, `t175.1`); the rest. Mark the leftovers implicit.
3. **Gates from thoughts:** `Story.#gates`, `stepNeeds`, `stepMade` and the 'wait' pace read the thoughts; the
   fair-play test (`engine/game.test.js`, "fair play under the 'wait' pace") replays the thoughts under all three
   background settings; the report's question table and Holmes's route section read the thoughts. Retire
   `route.json` last, once the replacement passes; say in the Round entry how each gate moved.
4. **Scoring** (engine only): record the paragraph at which the player makes each thought; a thought made before
   its Holmes paragraph scores; expose it for the UI.

Then stop and hand over: the world model (`docs/world-model.md`) is the next session's work.

## Discipline and traps

- `npm test` takes about two minutes: run it in the background, and before each commit. Push once green.
- Before and after each chain, save and diff in full: `npm run reveal-log`, `npm run foreshadow-log`,
  `cases/silver-blaze/report.md`, and `npm run validate-thoughts` (its report). Say in the Round entry what moved.
- A route step's (later: a thought's) gate deals the card holding its question one paragraph before the gate; if no
  text has named that card yet, the validator refuses it ("its first label rests on paragraph N, but the card
  appears at N−1"). Conclude on a card the reader already holds (Round 34, the sheep).
- A rule's `relevant_from` must neither run ahead of the story nor behind a gate (format-0.3 notes).
- Case data files are one JSON object per line; edit lines, never reformat. `thoughts.json` likewise.
- Discuss design alternatives with Robert before changing direction; he decides. Report in the tab.

## Open, for Robert when it comes up

- **The bill's items:** withheld facts stay withheld and marked (Round 37), but the dress test (`t85.3`, `t92.2`)
  is unplayable unless the player can see that the bill lists a dove-coloured silk costume. Raise it when the bill
  chain is done.
- The four RECORDs the game deals late (`thoughts-report.md`): Holmes's "not yet found" (¶14 → ¶37), the doubled
  track's turn and return (¶122, ¶123 → ¶124), the photograph (¶161 → ¶162).

## Acceptance

`npm test` green; every deduction-type thought has a verified inference (or is listed as implicit with Robert's
agreement); gates and the fair-play test come from the thoughts; `route.json` retired; scoring in the engine; the
thoughts report shows the earliest-date misses resolved or explained; a Round entry per step; committed and pushed.
