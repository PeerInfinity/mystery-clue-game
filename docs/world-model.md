# The world model: states over time, and the timeline

Status: AGREED (Robert, 2026-10-15, Round 39). Design; nothing built yet. Builds after workstream 2's chains
(`docs/short-chains.md`) and before hypotheses and scenarios (workstream 6 of `docs/gap-analysis.md`), which it
serves.

## Why

The reader works on a picture of Monday night: who was where, who had what, who knew what, who meant what. The
annotation's "state of mind" blocks are that picture as a timeline with blanks, and the reader's rival theories are
filled-in versions of it. The case has **events** (93, with who, where, when, to whom, with what as questions) but
no **states**: nothing says where Straker was between nine and one, or who held the cravat at midnight. The night's
bookkeeping inferences (`k.lads_slept`, `k.wife_stayed_home`, `k.found_before_seven`, `k.hunter_was_drugged`,
`k.straker_went_out_first`) exist to work around that absence.

## What exists to build on

- **Time:** 27 ordered windows (`w.years_before` … `w.mon_2100`, `w.mon_2105`, `w.mon_2110`, `w.mon_late`,
  `w.tue_0100`, `w.tue_stable`, `w.tue_hollow`, `w.tue_blow`, `w.tue_after`, `w.tue_dawn`, `w.tue_0700` … `w.race_day`).
- **Events** with facets that are already questions, ordered in the fabula.
- **Scattered states:** `silver_blaze.disguised`, `simpson.wounded`, `simpson.out_in_storm` (condition);
  `acquainted`, `knew_menu`, `of_establishment` (knowledge and belonging); `e.horse_led_out.purpose`,
  `simpson.purpose`, `straker.motive` (intention). None of them is dated.
- **Rules already about states:** `r.one_place_at_a_time`, `r.sleeper_stays_put`, `r.stupor_is_helpless`,
  `r.leaves_before_arriving`, `r.gone_before_found`.
- **The player's marks** on any question: listed candidates (Hard), circled (any number), struck (pencil or
  checked), proven. Unknown, several hypotheses, ruled out and settled are already expressible.
- **Theories:** authored assignments over slots, held by named characters; the player can add one and check it.

## The model

A **state** is a question about one thing in one time window, in one **aspect**:

| Aspect | Question | Values | First version |
|---|---|---|---|
| location | Where is X at T? | places (and "elsewhere") | yes |
| possession | Who has X at T? (objects, the horse) | people, groups, places | yes |
| condition | Is X drugged / disguised / wounded / lame at T? | per condition | yes |
| knowledge | Does X know F at T? (the menu, the horse's whereabouts, the tout's visit) | true / false | second |
| intention | What is X trying to do at T? | per case (injure the horse, get a tip, hide the horse) | second |
| belief | Does X believe F at T? (Hunter: the stranger drugged him; Mrs. Straker: Derbyshire is a friend) | true / false | second (with workstream 4, testimony) |

**Sparse, not a grid.** All people and animals × 27 windows × 49 places would swamp the solver. A state slot exists
only where the case declares it (a `states` file: the cells the story's logic turns on) or the player opens it on the
board. A cell the player opens that the case never declared is checked against the rules only; it has no authored
answer and is not part of uniqueness.

**Rules tie states to events** (general, with schemas, as the library already does):
- whoever does an event is at its place at its time (agent, and patient where it is a person or animal);
- a thing stays where it is from one window to the next unless an event moves it (persistence, a default with
  named exceptions);
- one place at a time; a holder and the held are in the same place;
- a condition holds from the event that causes it until the event that ends it (drugged at nine, in a stupor at
  seven; disguised from Mapleton to the race).

With these, several bookkeeping inferences become plain rule applications over states, and some of the
"implicit" steps of `short-chains.md` Q4 disappear (Q5 there).

**Claims fill states as they fill event facets now.** "Mrs. Straker, waking at one, found that he was dressing" gives
Straker's and his wife's location at `w.tue_0100`; "the two lads ... had heard nothing" gives theirs through the
night. No new kind of card text: every state a claim fills is quoted from the claim's own line.

## The timeline (the player's view)

- **Rows** are the entities the player follows (added from the hand; the story's principals offered); **columns**
  are the time windows, the story's own order; **events** sit in their cells.
- **A cell is a question** with the usual marks. Placing a card on a cell circles that candidate; moving it changes
  the candidate; leaving it empty is "unknown"; several cards in a cell are several hypotheses held at once; a
  struck card stays visible, crossed out.
- **Checking** follows the difficulty options already defined for crossing out: Easy greys placements the player's
  clues rule out; Medium checks a placement when the player commits it; Hard lets the player list candidates first.
  Free pencil marks by default.
- **A proven placement is a card**: "Straker was in the hollow at the blow" can be cited as a premise.
- **Layers:** a named hypothesis is a layer of the board (the police's night, the inside story, the player's own),
  stored as a theory's assignment. Switching layers shows that story's night; the engine says whether it fits what
  the player holds and (with workstream 6) what it leaves unexplained.

## Order of work

1. **States in the format:** the `states` file, the aspect types, state slots, the rules above with schemas; claims
   filling location, possession and condition. Validator: every declared state quoted through a claim or derived;
   uniqueness for declared states. Solver cost watched.
2. **Re-derive the bookkeeping** with state rules; the implicit inferences shrink (record which).
3. **A minimal timeline view** (read-only, then placement with pencil marks), early, so the model can be seen.
4. **Layers** over theories, with fit checking.
5. **Knowledge, intention, belief**, with workstream 4 for belief.
6. The full board UI with workstream 9.

## Decisions taken (Round 39)

1. Location, possession and condition first; knowledge, intention and belief second.
2. The state model builds after the short chains (workstream 2) and before scenarios and residue (workstream 6);
   a minimal timeline view comes early.
3. Placement is a free pencil mark by default, checked at commit in the harder settings, with the existing
   difficulty options.
