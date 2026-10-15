# Case format 0.3: checkable inferences

Status: STEP 1 BUILT (2026-10-14); traits and the establishment relation built (2026-10-15); migration of the
asserted inferences in progress (chains 1 to 6, the night, the drugging, the hollow, the knife, the plot, Brown, done 2026-10-15). Step 1 of the plan in `redesign.md` ("Where to start"). The reading layer
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

**Traits** (kickoff slice 1, 2026-10-14). An entity may carry `traits: [{id, term, text, source}]`, general properties a
rule can range over: a variable spec `{kind: "object", trait: "spiced"}` binds only cards that carry the trait,
so `r.curry_masks` reads "a strongly spiced dish hides other tastes" instead of naming the curried mutton. A
trait shows on its card like a gloss (under "Words": term and text), dated by the card's first mention or its
quote, whichever is later; its text must be plain description. The validator checks the quote, that every
trait a rule or relation names is carried by some card, and that no card lists a trait twice. Facts about one
specific thing stay ground facts with a formula and no schema.

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

## As built (2026-10-15): the establishment relation (slice 2 of the kickoff)

- **`of_establishment(x) → place`** (`relations.json`): people, animals, groups and Straker's villa, valued among
  the establishments the story names (King's Pyland, Mapleton, the villas, the gypsy camp, Tavistock, London,
  the Derbyshire household). Answers only where a claim gives them; every other one is open (`default_answer:
  null`), so the uniqueness check records it as left open by the story. The values are added to claims the
  story already makes: `c.straker_trainer_seven_years` (Straker, the Colonel), `c.straker_household` (wife, maid,
  the villa), `c.kp_establishment` (Hunter, the other lads), `c.dog_kept_in_stable` (the dog),
  `c.simpson_lives_at_villas`, `c.mapleton_brown` (Brown, Lord Backwater), `c.gypsies_camped`.
- **Two general rules** replace the editorial `only` claims (`c.dog_knows_household`, `c.menu_known_to_household`,
  retired): `r.dog_knows_its_own` ("a stable dog knows well the people of its own establishment; anyone else is
  a stranger to it": acquainted(dog, p) → p belongs where the dog belongs) and `r.menu_known_at_home` ("what a
  house will have for supper is known beforehand only to the people of its own establishment"). `knew_menu`
  becomes `knew_menu(house, person)`; `r.no_coincidence` binds the choosing event and the house.
- **The honest result.** `k.dog_knew_the_visitor` now concludes "the visitor belonged to King's Pyland" and
  `k.drugger_knew_the_dish` "the drugger belonged to King's Pyland" (both lookups, both verified). The dog
  alone no longer rules out people the story never places; the route step `i.straker_took_horse_by_dog` says
  so (the taker belonged to King's Pyland and was none of its people accounted for that night). Simpson is
  ruled out by the dog or the curry because the story places him at the villas, and the route steps that do
  that cite `c.simpson_lives_at_villas`. No fair-play gate moved; the report's question table is unchanged.
- **Solver** (`engine/solver.js`), needed because the relation slots are now open instead of fixed by `only`:
  a lookup under an implication (a rule's "if the dog was silent while someone came in, the dog knew them") is
  a *guarded* part, propagated as a lookup once its guard is settled, and as a small implication once its key
  is; the search branches first on the keys and guards of lookups, then on everything else; after propagation
  it splits the still-open slots into independent parts and searches each alone; negations are pushed inward
  (`not index` = `nindex`, `not (a → b)` = `a ∧ ¬b`, nested implications flattened), so a doubted rule
  application still splits; `consistent` with a denied conjunction tries each conjunct. `allCandidates` accepts
  a value the first solution satisfies with only that slot changed, and searches try unseen values first.
- **Game:** a held clue that fills a relation slot through a nested conjunction (an `only` inside `and`) fills
  it without raising it; a lookup raises only its key ("who came in?"), not every person's establishment.
- **Validator:** the schema is checked on the files as written (route conclusions are grounded in place); open
  relation slots are checked for a second possible value only, the rest in one `allCandidates` batch.
- Timings: `npm test` about 67 s (55 s before); `npm run validate` about 20 s (16 s before).

## As built (2026-10-15): the night chain (slice 3, chain 1)

- **Whereabouts without a relation.** Where the story places someone is already an event facet; the chain's
  rules range over events and are bound to the event in question: `r.one_place_at_a_time`, `r.sleeper_stays_put`,
  `r.stupor_is_helpless`, `r.drugged_guard`, `r.gone_before_found`, `r.leaves_before_arriving`,
  `r.blow_is_the_death`. A default rule carries `unless` (its named defeaters, for display). Verified:
  `k.drugger_took_the_horse`, `k.found_before_seven`, `k.hunter_was_drugged`, `k.lads_slept`,
  `k.wife_stayed_home`, `k.straker_went_out_first`, `k.night_sequence` (14 verified, 39 asserted).
- **Premises stay flat until step 2.** An inference may cite another inference for verification
  (`verifyInference` counts it as held), but in play `buildable` wants the premise inference held first and a
  route step cites only claims and rules, so the migrated inferences list every rule application they need and
  the route steps carry the ancestry. Several inferences therefore repeat the same application.
- **Solver** (`engine/solver.js`): slots settled by propagation or by a fixed value count as assigned, so a wide
  part is checked once its *open* slots are few and enforced when all are settled (before, a part whose other
  slots the clues pinned was never enforced: unsound, caught by the first wide rule application). An implication
  part is dropped once its condition fails and shrinks to its consequent once it holds. One copy of identical
  parts per search.
- Timings: `npm test` about 100 s; `npm run validate` about 26 s.

## As built (2026-10-15): the drugging chain (slice 3, chain 2)

- `r.same_dish_safe` carries a schema; `r.set_aside_at_the_meal` and `r.dosed_before_carried_off` are new.
  `e.household_sups` has a time (nine, from `c.household_same_dish`). Verified: `k.drugged_after_set_aside`,
  `k.portion_set_aside_before_edith` (16 verified, 37 asserted).
- **`asserted: "<why>"`** on an inference the engine cannot verify: the reason shows in the report's table, and
  the validator warns if the engine verifies it after all. Used by `k.straker_home_all_evening`,
  `k.window_drugging_time` and `k.drugged_in_house_means_before_nine_five`.
- **A conditional inference** states "if X then Y" and is verified from small premises; the full model closes
  the condition through other inferences (`k.hollow_order`). The shape to prefer when an ordering depends on an
  identity the inference's own premises do not settle.
- **First mentions wait for their paragraph.** `Game.info` shows a card's first-mention quote only once that
  paragraph is read; the report's "Quoted later than they appear" lists the cards whose quote lies ahead of the
  clue that deals them.
- **Solver:** an implication part whose condition has at most two slots still open, and is not yet decided, gets
  one of those slots branched on first (the *urgent* pick); without it a conditional conclusion over two open
  agent slots made the search enumerate every pair of time windows.
- **Variable specs** may say `placeholder: true`: the variable ranges over the cards that stand for someone not yet
  identified (flag `placeholder`), which ordinary kind domains leave out.
- **Solver:** a denied conclusion is tried alternative by alternative wherever its negation sits (`alternatives`
  in `engine/solver.js`): "if P then A and B" denied is "P and not A" or "P and not B".
- **A rule's `relevant_from` must not run behind a gate either.** A route step's gate waits for its premises;
  a rule first relevant at ¶226 moved a gate from ¶202 to ¶227. Check each step's gate paragraph and needed
  inferences against HEAD after every chain.
- **Traits carry the general reading of specific things:** the knife is *surgical*, the stick *weighted*, the shoe
  a *shod hoof*; the rules range over the trait, the binding names the card.
- **A rule's `relevant_from` must not run ahead of the story.** A rule about a drugged guard surfaces with the
  opium (¶37), not with the guard (¶20): check the foreshadow log's diff for every new rule, not its tail.

## Open

- **The Strict column counts unstated rules as late.** It drops every rule without `stated_in`; the night chain's
  rules are common sense the story never states, so two questions show more candidates under Strict than before
  (the editorial inferences used to carry the same common sense with no rule). Whether unstated general rules
  should count as known from the start under Strict is open.
- **The kitchen as a place of its own.** The drugging's place is recorded as "one of straker_villa, villa_kitchen";
  the kitchen is a place card used only by the lads' supper, so a rule over the portion's keeping place reaches
  the villa half only and `k.drugged_in_house_means_before_nine_five` stays asserted. Fold the kitchen into the
  villa (the answer becomes "straker_villa"), or keep it: Robert's call.
- **The suite grows with each chain** (67 s → 100 s after one chain, about 135 s after four, 107 s after five once denied conclusions split properly). The remaining cost is the extra wide
  constraints themselves; watch it as the chains land.

- **Unplaced people.** Twenty-odd people and animals have no establishment in the story; the dog argument
  leaves them open and the curry route closes them. Should a later chain need them placed, add the value to the
  claim the story makes, never an editorial list.
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
