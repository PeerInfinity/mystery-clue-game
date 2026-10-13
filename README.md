# Mystery clue game

A deduction game built from fair-play mystery stories. You collect clues by investigating, and every person,
place, thing, event and clue becomes a card. Every card has open questions (who did it, where, when, whose is it,
is it true?), each with a list of candidate answers, like pencil marks in sudoku. You rule answers out, alone or
with cited reasons that the game checks MetaMath-style, until only one solution is left. Any sufficient set of
reasons is accepted, not just the detective's.

The first case is Conan Doyle's "Silver Blaze" (1892, public domain).

## Run it

```
node scripts/serve.js            # http://localhost:8321/
npm test                         # engine tests + full case validation (~30 s)
npm run validate                 # validate the case and rewrite cases/silver-blaze/report.md
```

No build step and no runtime dependencies. `ajv` (a dev dependency) checks the JSON Schema.

## Layout

| Path | What |
|---|---|
| `index.html`, `ui/` | The casebook page: investigate, cards, questions, theories, three timelines. |
| `engine/logic.js` | The formula language for constraints, in three-valued logic. |
| `engine/solver.js` | A finite-domain solver: candidates per slot, checked eliminations, uniqueness, minimal conflict sets. |
| `engine/caseModel.js` | Turns a case into cards, slots and constraints; `checkStep` checks a cited elimination or conclusion. |
| `engine/game.js` | Player state: collecting, pencil marks, givens, proofs, theories, the three time axes. |
| `cases/silver-blaze/` | The case: `case.json` (meta, time windows, scenes, questions, theories) and its parts. |
| `cases/silver-blaze/report.md` | Generated: fair-play table, theories and what breaks them, the route check, every slot's status, the fabula. |
| `schema/case.schema.json` | JSON Schema for case format 0.2. |
| `scripts/validate-case.js` | Checks everything the schema can't, and writes the report. |
| `docs/design.md` | Requirements, rulings, the model, open questions. |
| `reference/v0.1/` | The first extraction (one big hand-built clue graph), kept for comparison. |

## The model in one paragraph

The story's fabula is a set of **slots**: each event's agent, place, time, object and instrument; owners;
identities of placeholder cards ("the stranger", "the midnight visitor", "the bay in Ross's colours"); and
whether each piece of testimony is true. The solution is one value for each slot. A **claim** (an atomic clue)
asserts something about slots. A plain fact that states a value outright is a *given*, but testimony can be
false, so it gets its own truth slot. **Constraints** carry the reasoning, and each rests on premise cards,
usually clues plus **rule cards** (general knowledge: opium can be tasted; a dog barks at strangers).
Crossing out "Simpson" as the drugger, citing some cards, is accepted when the constraints those cards switch
on make "Simpson" impossible. The validator proves the case is well formed: with all the evidence, every slot
the story settles has exactly one value left.

Three time axes are kept apart throughout: **fabula** (event time slots and `fabula_order`), **investigation**
(`actions.json`, and the player's own log), and **disclosure** (the scene where each card is first told).
