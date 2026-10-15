# Case format 0.3: checkable inferences

Status: STEP 1 BUILT (2026-10-14), migration of the inferences in progress. Step 1 of the plan in `redesign.md` ("Where to start"). The reading layer
(entities, events, claims, mentions, disclosure dating, the validator's leak checks) is unchanged. The
reasoning layer gains the pieces that let the engine *check* an inference instead of looking it up.

## What changes

**Rules carry formulas.** A background fact (`knowledge.json`, `rules`) may have a `schema`: a formula with
typed variables (`vars`), written over the bound cards' slots. "A stable dog barks at strangers" becomes

```
vars: dog (animal), visit (event), silence (event)
if silence.agent = dog and silence.place = visit.place and silence.time = visit.time
then acquainted(dog, visit.agent)
```

Applying the rule means binding its variables to cards. The engine grounds the schema into an ordinary
formula over slots (`ground()` in `engine/logic.js`) and the solver uses it like any constraint. A rule also
has a `strength` (`hard`, `default`, `heuristic`) and may list `unless` (its named defeaters) for display.

**Relations are slots.** `relations.json` declares relations such as `acquainted(animal, person)` or
`knew_menu(person)`; each argument tuple becomes a slot `rel.<name>.<arg>.<arg>` (default domain
true/false; `values` may give another). A schema may refer to a relation with a slot-valued argument,
`acquainted(dog, visit.agent)`: grounding expands it over the slot's domain into
`visit.agent = p → rel.acquainted.dog.p = true` for every p. Claims give relation slots their values with the
usual `eq`, or with `only` (true for the listed arguments, false for the rest).

**Propositions are slots.** `propositions.json` declares intermediate conclusions ("the opium needed hiding")
as boolean slots `p.<name>`, each a card. One may have a `means` formula; the model then adds a definitional
constraint tying it to the world. A proposition can be the conclusion of one inference and a premise of the next.

**Inferences are verified.** An inference (`constraints.json`) may list `rules: [{rule, bind}]`, the rule
applications it uses. The validator checks that its claim premises (trusted), its rule applications and any
premise propositions or inferences together entail its `formula`; the report counts inferences as
*verified* or *asserted*. Asserted inferences keep working as before; the aim is to migrate them all.

**Players build inferences by concluding, not by matching.** `Game.applyRule(rule, bind)` holds an applied
rule as a card. `Game.conclude(cited, formula)` accepts any conclusion that the cited cards (claims, applied
rules, propositions, inferences) entail, creates a player inference card holding that conclusion, and says
which authored inferences it matches. Holmes's gates are passed by holding his inferences or by entailing
his conclusion from anything held: every valid route.

## Schema formulas

A schema formula is a formula whose terms may be:

- a slot id (ground), or `?v` (a variable bound to a card) or `?v.facet` (a slot of the bound card);
- `{"rel": [name, arg, ...]}`: a relation slot; each arg is a card id, `?v`, or a slot (id or `?v.facet`)
  whose value indexes the relation;
- `{"lit": window}` as before.

Operators add `forall`/`exists`: `{"forall": [{"var": "p", "kind": "person"}, body]}` expands over the
domain; and `only`: `{"only": [name, fixedArg..., [trueFor]]}` fixes the last argument's slots.

Bindings are checked: a variable with `kind` binds only an entity of that kind (`event` binds an event card);
`only` lists the cards it may bind to. A facet the bound card lacks fails the binding.

## As built (2026-10-14)

- `engine/logic.js`: `ground(schema, env)` with variables, `?v.facet` slots, relation terms, `forall`/`exists`,
  `only`; `varsOf`, `isGround`. A relation looked up by one slot's value grounds to a native **lookup**
  operator, `{index: [key, {value: slot…}, value, outside]}` (and `nindex`), which the solver propagates
  directly (prune the key's values whose target cannot hold the value; a settled key settles its target). The
  first version expanded such lookups into one implication per value, which made every search six times slower.
- `engine/caseModel.js`: `relations` and `propositions` sections; claims and rules are grounded once at build;
  `instantiateRule`, `verifyInference` (verified / asserted / vacuous), `addDynamic` / `removeDynamic` for the
  player's cards, `rebuildProblem`. An inference's listed rule applications become constraints of their own
  (`<id>#rule1`…), active with the inference and set aside when it is doubted, so the case's reading contains
  the derivation and not only the conclusion.
- `engine/game.js`: `applyRule(rule, bind)`, `ruleBindings`, `applicableRules`, `conclude(cited, formula)`,
  `conclusionMatches`, `retract`; player cards are saved (`applied`, `concluded`, save version 5) and restored,
  with fresh ids when a saved id is taken on the same model. A Holmes gate is passed by holding his inferences
  or by holding any inference or applied rule whose formula alone covers his conclusion (checked formula
  against formula, which is cheap; the whole-hand entailment runs only when the player commits in `conclude`).
  The old `propose` (connect the premises of an authored inference) still works for the inferences not yet
  migrated.
- `scripts/validate-case.js` and the schema (0.3): relations, propositions, rule schemas, `rules` on
  inferences, `via: editorial` attestations; the report lists every inference as verified or asserted.
- `cases/silver-blaze`: `relations.json` (acquainted, knew_menu, heads_household, dish_of, needed_hiding,
  masks_taste, found_on), an empty `propositions.json`; schemas on six rules and one new rule
  (`r.planned_the_dish`, Holmes's "no stranger could have caused curry to be served"); two editorial claims
  with `only` (the dog knows the people of King's Pyland; only the household knew the menu); six inferences
  verified: the dog, the curry (knew the dish; chose the dish; who chooses), the bill (his own; made out to
  Derbyshire). 47 remain asserted.
- Tests: `engine/reasoning.test.js` (grounding, bindings, verification, applyRule, conclude, a gate passed by
  the player's own route, relation questions waiting to be raised). The whole suite runs in about 55 s.

## Open

- **Editorial closed-world claims leak a little.** "The stable dog knows the people of King's Pyland and no
  one else" appears with the dog and says the dog matters. The relational version (`of_establishment(person)`
  with the general rule "a stable dog knows its own establishment") would need an establishment for every
  person in the agent domain, or the dog argument leaves the unplaced ones open, which is the honest result.
  Decide when the knowledge library is redesigned.
- **Rules bound to one card** (`r.curry_masks` on curried mutton) are ground facts in disguise; fine for now.
- **`conclude` on the big component late in the story** can take a few seconds when the conclusion is not
  entailed (the solver must find a witness). A time budget or a weaker first check may be wanted for the UI.
- The UI does not yet offer `applyRule` or `conclude`; it still builds inferences by connecting premises.

## Decisions and next steps (user, 2026-10-14)

- **Closed-world facts go relational.** Instead of editorial claims that list who the dog knew or who knew
  the menu, a general rule over an establishment relation: `of_establishment(person) → place` (and the same
  for the household), with "a stable dog knows the people of its own establishment" and "the people of a
  house know what it will eat" as rules. People whose establishment the story never gives are not eliminated
  by the dog argument alone; that is the honest result, and the curry route closes them. Migrate the two
  editorial `only` claims (`c.dog_knows_household`, `c.menu_known_to_household`) first, then the other 47
  asserted inferences chain by chain, checking the fair-play test after each.
- **Rules bound to one card** (`r.curry_masks` only on curried mutton) stay for now. Recommendation for later:
  give entity cards *traits* (`traits: ["spiced"]`, shown on the card as a gloss, where it reads naturally) and
  let a variable range over a trait (`{kind: "object", trait: "spiced"}`), so the rule reads "a strongly spiced
  dish hides other tastes" and applies to any spiced dish. Facts that really are about one specific thing
  ("Weiss & Co. make surgical knives") stay ground facts attached to that card, with a formula and no schema.
- **A busy indicator in the UI.** Checks against the whole hand (`conclude`, `prove`, clashes) can take
  seconds late in the story. The engine is synchronous, so the page should run the solver in a Web Worker (or
  yield between steps) and show that it is working, with a time budget and a "still checking…" state. Needed
  before `applyRule` and `conclude` get their UI.
- **Order of work:** the migration above; then step 2 of `redesign.md` (propositions as citable intermediate
  conclusions, short chains, route steps re-expressed as chains); then the UI for applying rules and
  concluding, with the busy indicator; then step 3 (coverage and the scenario board).
