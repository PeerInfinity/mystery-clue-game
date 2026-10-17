# Kickoff: the order of events within a time window (format and case data)

**Date:** 2026-10-16. Handed off by the session that ran Rounds 66–70 of `docs/design.md`, which is still running
(it is designing step C, knowledge, intention and belief, in documents only). **Robert's decision (Round 70):** the
case gets the data it needs to state the order of events within a window, in a session of its own: this one.

## Read first, in this order

1. `CLAUDE.md` (commands, conventions; the reading layer is sacred).
2. `docs/design.md` Rounds 61 and 66–70: the world's ties, splits and order questions, and checked placements.
   Round 70 states the problem this session solves.
3. `docs/format-0.3.md`: the "As built" sections from Round 60 on, especially "the world's workings, splits and
   order" (Round 61) and "checked placements" (Rounds 68–70).
4. The code:
   - `engine/caseModel.js`: the split block (`makeSplit`, the order slots `ord.<event>.<splitter>`),
     `inTimeConds`, `orderTies`, `openSplit`;
   - `engine/game.js`: `proveOrder`, `#ensurePart`, `#stateFor`;
   - `engine/timeline.test.js`, the last test, "order questions".
5. `cases/silver-blaze/events.json` (93 events, each with `fabula_order` and `facets.time`) and `claims.json`
   (each claim's `asserts` and its quoted `attested` lines).

## The problem

- **Windows hold several events.** A time window (`w.mon_2110`, "Monday, at the stable window") holds several
  events. Eight of them fall there: Edith runs to the window, the stranger asks for a tip, Hunter goes for the
  dog, the stranger leans in, Edith flees, ...
- **Order questions.** The player (and the case, in `state_splits`) can split a window at an event into the part
  before and the part after. Which part another event falls in is an **order question**,
  `ord.<event>.<splitter>`, before or after.
- **No clue states any order.** No claim in the case asserts an order question. The true order is the events'
  `fabula_order`, which is the answer key, never evidence.
- **So orders are provable only where states force them.** A part's states and the world's ties can force an
  order: the stable door was found open after Mrs. Straker woke. Otherwise an order is never provable.
- **Example:** "Edith ran to the window before she fled" stays "does not settle it yet", though the story tells
  it: Edith's testimony says "as she ran she looked back and saw that the stranger was leaning through the
  window".
- **Already settled (Round 70):** the event that splits a window lies in neither part.

## Mission

1. **Design first; agree with Robert before building.** Lay out the alternatives with a recommendation; Robert
   decides. Candidates (not exhaustive):
   - **(a) Pairwise sequence facts on claims:** a claim's `asserts` may say "a before b" for two events in one
     window, e.g. a new formula term `{seq: [a, b]}` grounded to the order questions of every split that separates
     them. It needs a meaning even where no split exists yet.
   - **(b) A position slot per event within its window:** e.g. `e.x.seq` over 1..n, with claims fixing relative
     order. General, but it adds wide slots to the search; watch the solver (`npm test` is about 2–3 minutes now;
     keep it so).
   - **(c) Order statements only for splits:** claims assert `ord.*` directly. Simple, but they exist only for the
     case's own splits, never for the player's.

   Whatever is chosen must feed the order questions of a split the player makes (`openSplit` builds them on
   demand), so that "Edith ran to the window before she fled" becomes provable once her testimony is held.
2. **The format:** schema, validator (every order fact carries its quote, through a claim's own line), the
   report (which orders are given by what), and an "As built" section in `docs/format-0.3.md`.
3. **The data:** go through the story's windows with several events. A sequence is told by the narration's and
   the witnesses' own words ("as Edith fled", "then", "after", "when he returned"). Each fact comes from a claim's
   quoted line, never from `fabula_order`.
   - A new conjunct on an existing claim is preferred, as Round 60 did for states.
   - A new claim only where no line carries it.
   - Nothing on a card may run ahead of the story; the fair-play test and the reveal and foreshadow logs check it.
4. **Wire it in:**
   - the engine reads the facts into the order questions, for the case's splits and the player's;
   - the case's own order questions report as settled where the story tells them;
   - a test: Edith's order on a player split becomes provable once her testimony is held, and not before.

## Coordination with the running session

- **Two sessions, one branch.** The other session works on step C in documents only (`docs/`). It will not edit
  the engine, the case data or `docs/format-0.3.md` while this session runs. This session owns those.
- **Round numbers:** `git pull --rebase` before every commit, and take the **next free Round number** in
  `docs/design.md` at commit time (the other session appends there too).

## Discipline and traps (from Rounds 60–70)

- **Commits:** one commit per step; push once `npm test` is green.
  - Run `npm test` in the background (about 2–3 minutes) and gate the commit on its exit code.
  - **Never edit engine files while `npm test` runs:** `node --test` starts its eighth file late, and it would load
    the edited code. Experiment in a scratch copy.
- **Before and after each step, diff in full:**
  - the reveal and foreshadow logs (`npm run reveal-log`, `npm run foreshadow-log`, written to `.cache/`);
  - `cases/silver-blaze/report.md` (`npm run validate`);
  - `thoughts-report.md` (`npm run validate-thoughts`);
  - the gate listing: each gate's paragraph and the inferences it needs, from `game.stepNeeds` after
    `model.story.gates`.

  Say in the tab what moved.
- **Case data files are one JSON object per line;** edit lines, never reformat whole files.
- **Clash set-aside drops every lowest-weight claim in a clash.** A new conjunct on a claim can make that claim
  part of a clash it was not in before, and drop it out. Check `report.md` and the clash tests after adding facts.
- **Ties are lazy constraints** (`world: true`), active where an active card speaks of their thing's states. Order
  ties are definitions (always active).
- **Formulas are compiled once** (Round 66): never change a formula object after it is first evaluated.
- **The solver caches on the `Problem`;** a model change goes through `rebuildProblem`.
- **Checking the UI:** `node scripts/serve.js` (a server may already be running on 8321 from this tree), plus
  headless Chrome over the DevTools protocol. Clear `localStorage` first.

## Acceptance

- The format is agreed with Robert and built, with its validator checks and an "As built" section.
- The case states the within-window orders its story tells, each quoted.
- On a player's split of the window scene at Edith's flight, "she ran to the window before she fled" is provable
  once her testimony is held.
- `npm test` is green and no slower than about 3 minutes.
- A Round entry per step; everything committed and pushed.
