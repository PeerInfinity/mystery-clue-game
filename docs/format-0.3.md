# Case format 0.3: checkable inferences

Status: STEP 1 BUILT (2026-10-14); traits and the establishment relation built (2026-10-15); migration of the
asserted inferences in progress (chains 1 to 8 done 2026-10-15: 43 verified, 11 asserted of which 7 carry a reason; the police's four await a ruling). Step 1 of the plan in `redesign.md` ("Where to start"). The reading layer
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
- **Quantifiers over a trait** give a rule its closed world honestly: `exists`/`forall` over `{kind: "animal",
  trait: "entered"}` says "one of the runners, and his" without naming them (`r.colours_identify_owner`).
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

## As built (2026-10-15): the sheep's cause (Round 34)

- **Facet types may carry labels and reveals.** A `facet_types` entry with `values` can give `labels` (and
  `reveal`, as a declared slot can); every event facet of that type gets them. New facet types: `cause` ("What
  caused it?": *ordinary* or *someone*) and `subject` ("Who or what was affected?").
- **An observation with an open cause is its own event.** `e.sheep_go_lame` (¶173: subject, place, time, cause)
  is what the lad reports; `e.practice_on_sheep` (agent, patient, place, time) is what Holmes infers, and appears
  at ¶228. `r.practise_first` binds the lameness too: given an outing to injure, the lameness is someone's doing
  and the practice shares its subject, place and time. Holmes's step `i.practised_on_sheep` concludes the cause
  (its gate would otherwise deal the practice card a paragraph before the text names it).

## As built (2026-10-15): short chains, the checker (Round 41)

- A deduction-type thought in `thoughts.json` names its inference (`inference: "k.*"`); an inference may carry
  `implicit: true` (a step no thought names, granted when its premises are held). `engine/thoughts.js` checks that
  the thought's `from` and the inference's premises agree both ways, and the earliest date: the paragraph by which
  the game, with background facts where relevant, has dealt every premise (recursively through inference premises)
  must not be later than the thought's. The thoughts report lists every deduction with its inference, its dates and
  its premise mismatches, and the inferences no thought names.
- (Round 42) A rule the inference applies is its warrant and needs no citation. The earliest date also waits for
  the event cards the conclusion speaks of. `date_note` on a thought explains an accepted miss.
- (Round 42) An implicit inference is granted when its premises are held, at every level; an inference the game
  grants by itself waits for the story to deal the events it speaks of. `activeConstraints` closes the known cards
  over inferences, so a chained inference counts wherever its flat ancestry would.
- (Round 46) A TEST that concludes something may name its inference too.
- (Round 53) An inference the game grants by itself also waits for the entities whose questions it speaks of.
- (Round 56) A deduction with no possible inference says why: `no_inference` is `workstream-3`, `action` or
  `world-model`. `implicitRequired` is on: an inference neither named nor implicit is an error, and so is a
  deduction with neither an inference nor a reason.

## As built (2026-10-15): Holmes's steps from the thoughts (Round 57)

- **`route.json` is retired.** `case.json` names the annotated reading (`thoughts_file`), and `engine/steps.js`
  builds Holmes's steps from it when the model is built (`data.route`, in the shape the route file had):
  - a thought that names an inference is a step whose conclusion is that inference's formula, and whose premises
    are the clues and rules down its chain. It gates the reading (the 'wait' pace) when the inference is Holmes's
    own (`by: holmes`) and not implicit and the thought has a Holmes paragraph (not `never`), at the first one
    (never before its premises are told). Its step's need is its own inference;
  - a thought that carries a conclusion of Holmes's that no single inference gives has `concludes`: a formula (or
    a slot and the value ruled out), the cards it rests on (`premises`) and Holmes's line (`source`). It gates the
    paragraph of that line, and its need is the fewest inferences that give the conclusion, as for route steps.
    Eleven thoughts carry one: `t37.9`, `t37.13`, `t46.4`, `t81.5`, `t84.8`, `t114.2`, `t117.2`, `t127.4`,
    `t141.1`, `t173.2`, `t220.3`.
- **Actions** require and yield thoughts (`requires.thoughts`, `yields.thoughts`), where they named route steps.
- Only Holmes's own steps have their inferences stated by Holmes at the gate.

## As built (2026-10-15): scoring (Round 58)

- The game records, for each of Holmes's steps (thoughts), the last paragraph read when the player first made it
  by their own reasoning: every inference the step needs built by them, or one of their own conclusions or
  applied rules covering its conclusion, or their proofs (proven values and proven cross-outs, not a clue's
  given value) entailing it. Inferences stated by a character, granted by the game or implicit do not count;
  nothing counts in Trivial. The check runs before each paragraph and on request, after a move of the player's.
- A thought scores when it was made before its Holmes paragraph. `game.thoughtScores()` gives each thought with
  `holmes`, `made` and `scores`; `game.score()` gives `{scored, made, possible}` (44 possible in Silver Blaze).
  The record is saved (`made`, save version 6). The UI is workstream 9.

## As built (2026-10-16): states (world model, step 1; Round 60)

- **`states.json`** (a case part; one track per line). A **track** is one thing in one aspect over the time windows the
  case's logic turns on: `{"id": "st.<thing>.<name>", "of", "aspect": "location"|"possession"|"condition",
  "condition"?, "places"?, "holders"?, "windows": {window: answer|null}}`, where `<name>` is `at`, `held` or the
  condition's id. Each declared window is a slot `st.<thing>.<name>.<window without "w.">` on the thing's card
  (`facet: 'state'`, with `track` and `window`). `null` is left open by the story. **Sparse:** a window not declared
  has no slot. A second track for the same thing and aspect is an error.
- **Domains.** Location: a named place set (`state_places`) or an inline list, plus `elsewhere` ("a place not
  listed"). Possession: the holders (people, animals, groups by default; `holders` gives other kinds), the set's
  places (lying there) and `elsewhere`. Condition: true/false, the condition named in `state_conditions` with its
  prompt. A place's `within` (on its entity) folds it into the listed place that contains it: the bedroom reads
  as the villa, the stable window as the stable, Mapleton's parlour as Mapleton, London as `elsewhere`.
- **Unknown is not a value:** for the case it is `null`, for the player an empty cell.
- **Claims fill states** by naming the slot in `asserts` (`{"eq": ["st.mrs_straker.at.tue_0700", "straker_villa"]}`),
  quoted from the claim's own line. As with any value a clue fills in, the question shows only once the clue is
  doubted; a state's question also waits for its window's `reveal` line, since the prompt names the window.
- **Rules reach states** with a schema term `{"state": [name, thing, time]}`: `name` and `thing` are literals or
  bound variables; `time` is a window, a variable bound to one (variable spec `{"window": true}`; a condition name
  binds with `{"condition": true}`), or a time slot (`?e.time`), which grounds to a lookup over the thing's declared
  windows. A window with no declared state is unconstrained: the lookup's outside value makes the comparison hold
  (and its denial fail). Comparisons: `eq`/`ne` with a value (`eq` folds the value; `ne` says something only for a
  value of the domain itself), `same`/`diff` with a slot (expanded over the slot's values, grouped by their folded
  place) or with another state at a given window. A thing with no track is unconstrained too.
- **Tying rules** (`knowledge.json`, shown from ¶32 and ¶33): `r.agent_is_there` and `r.patient_is_there` (hard:
  whoever does a thing, or has it done to them, is where it is done when it is done), `r.stays_put` (default: a
  thing stays where it is from one window to a later one unless moved), `r.holder_with_held` (hard: a holder is
  where the held thing is), `r.condition_lasts` (default: a condition holds from its cause to its end). One place at
  a time needs no rule: a state slot has one value. None is applied by an inference yet (step 2).
- **Silver Blaze:** seven tracks, eleven states, all from claims: Straker at one (the villa) and in the morning (the
  hollow); Mrs. Straker at one and at seven (the villa); the lads at seven (the loft); Hunter at nine and at seven
  (the stable) and stupefied at seven (`c.hunter_stupor` gains its `asserts`); the overcoat held by Straker at one,
  lying in the hollow in the morning; the cravat in Straker's hand in the morning. The older state-like slots
  (`silver_blaze.hidden_at`, `.disguised`, `simpson.wounded`, `simpson.out_in_storm`) are unchanged until step 2.
- **Validator:** place sets list places; a track's id matches its thing and aspect; no window twice on a line; a
  declared answer is stated by a claim or appears in an inference's formula or rule application; uniqueness as for
  every slot. The report counts tracks and lists every state with what gives it.

## As built (2026-10-16): the world's workings, splits and order (world model, step 2; Round 61)

- **Places fold** to the nearest listed place that contains them: a listed place means itself apart from the
  listed places inside it. A state holds **throughout** its time.
- **Splits** (`state_splits: [{window, by, why}]`): a window or a part of one, split at an event into
  `<parent>.before.<event>` and `<parent>.after.<event>`; a track may declare states at those parts. Every event
  whose time no trusted clue puts elsewhere gets an **order slot** `ord.<event>.<splitter>` (before/after; answer
  from `fabula_order`; open unless a clue asserts it). The validator reports order slots as settled or open,
  never as a uniqueness failure.
- **The world's ties** (`k.world.<thing>.<event>.<role>`, `k.world.<thing>.held.<window>`, `k.world.order.*`,
  `k.world.split.*`): built by the engine, never written in the case. Agent or patient of an event is where it is
  done, at the event's window (a lookup by its time slot) or in the part of a split window its order puts it in.
  A holder is where the held thing is, and a thing held by a place lies there. Order runs through. A tie is active
  where an active card speaks of the thing's states; the solver treats ties as lazy (checked after the rest) and
  as background in explanations.
- **Pruning (by the case's trusted clues):** no tie for an event a clue gives to someone else, puts in a window
  with no declared state, or fully states (who, when and where); a stated place gives a one-branch tie. A player
  who doubts that very clue loses those ties, never gains a wrong one.

## As built (2026-10-16): the solver in a Web Worker (Round 62)

- `model.wrapProblem(local, args)`, when set, wraps every problem `rebuildProblem` makes; the page sets it to a
  `RemoteProblem` (`engine/remoteProblem.js`) that answers a call on the spot within 60 ms, or throws `NeedSolve`
  for `settle` to have `engine/solverWorker.js` answer it, with progress. Node (tests, validator) leaves it unset.
- `Problem.deadline` (a `Date.now()` value; past it a search throws `OverBudget`) and `Problem.onProgress(done,
  total, what)` (`what`: `answers` in the candidates batch, `clues` while explaining a clash).
- A game move must ask the solver before it changes anything (or change only what it would change the same way
  again): a slow call makes the move run twice.

## As built (2026-10-16): solver speed (Round 66)

- Formulas are compiled once into closures (`logic.js`, cached per formula object); a formula must not be changed
  after it is first evaluated.
- `Problem.allCandidates` keeps its last call: a later call whose active constraints include all of the last call's
  starts from its answers and solutions, and mends a known solution before searching for a value.
  `Problem.consistent` keeps its last 16 whole solutions, and tries a check with ties eagerly for a bounded number
  of steps before Round 61's lazy order. A `Problem`'s constraints never change, so these caches live on it.
- `Game.stepNeeds` is kept per `model.problem`.

## As built (2026-10-16): the board (world model, step 3; Round 63)

- `engine/timeline.js` reads the board off a Game: times reached (and the player's parts), followed things, and
  per cell what is given (a declared state the player's clues or proofs settle) and pencilled (the player's free
  marks). Layouts `place` (rows times, columns places + elsewhere + not placed, with the events there) and `thing`
  (rows things, columns times). The player's board is saved as `board` (save version 7). Nothing on the board is
  checked yet; a split's parts use the case's subwindow ids.

## As built (2026-10-16): a card's own timeline (Round 67)

- `cardTimeline(game, id, layer)` (`timeline.js`) reads one card's part of the board:
  - **a thing:** per time, its given place, holder and conditions, its pencil marks, and the events it is the
    settled agent, patient or recipient of;
  - **a place:** who or what is given or pencilled there or inside it, and its events;
  - **an event:** its time and place.

  Only times reached and lines with something on them; undated events are listed apart. The Card tab draws it,
  with the board's layer selector and pencil marks.

## As built (2026-10-16): checked placements (B; Rounds 68–70)

- **Board marks:** a pencil mark may carry `aspect` (`held`, or a condition's id; default `at`).
- **Committing a mark** (Game `proveMark`, `ruleOutMark`, `proveOrder`):
  - proving a state is checked in every setting; ruling one out follows `crossOut`;
  - a proven state or order becomes a player card (as `conclude` makes, saved with them);
  - nothing is checked where what the player trusts plus the ties is inconsistent: the thing has no single
    answer throughout that time.
- **Opened states** (`openState`/`closeState`): a slot the case never declared, made when a mark there is
  committed. It carries `opened: true`, has no answer and plays no part in uniqueness. Its ties (`windowTies`)
  are its own (`…@<window>`); the case's ties do not change.
- **Opened splits** (`openSplit`/`closeSplit`): a split the player made, built when a part of it is committed:
  its parts (`opened: true`), its order questions (no answer) and their order ties.
- **Both** are held by count, saved (`opened`, `openedSplits`), and closed on reset.
- **The splitting event lies in neither part** (Round 70; before, on the boundary of both).
- **Event order within a window:** stated by claims with `seq` (next section).

## As built (2026-10-16): the order of events within a window (Round 73)

- **`{seq: [a, b, ...]}`** in a claim's `asserts`: the events happen in one window, in this order. Each consecutive
  pair grounds to `same(a.time, b.time)` and `ord.<a>.<b> = before`. Claims only (an order the story tells, quoted
  through the claim's own line); never from `fabula_order`, which only gives the answer key.
- **The order question is the pair's own:** the case builds `ord.<a>.<b>` for every pair a claim states, whether or
  not a split asks it (answer from `fabula_order`; settled by the claim). A split at `b` (the case's or the
  player's) asks exactly that question; it is reused, not opened, and stays when the split closes.
- **Order runs through over every order question** (`orderTies`, generalised from the splitters' to all `ord.*`
  slots): two questions over one pair agree, and for three events in one window `x` before `m` and `m` before `z`
  gives `x` before `z`. So a stated pair reaches the questions of any split of its window: on the player's split at
  Hunter locking the door, "she fled before it" carries "she ran to the window before it". Ties keep their ids
  (`k.world.order.<x>.<m>.<z>`, the middle event in the middle); the case's earlier ones are unchanged.
- **Simultaneous events** ("as she ran she looked back and saw…"): the model orders a window's events totally, so a
  pair the story tells as happening together gets no `seq`; its order stays open.
- **Validator:** a `seq` names two different events, both timed; on a claim with a quoted line, never a derived
  one (a conclusion to prove); in fabula order unless the claim is false; not in rules, inferences or
  propositions. As with any conjunct, the claim's card must not deal an event before its own label is told. The report's "Orders within a window"
  lists each stated order with its claim, and the case's split questions it settles.
- **Opened states' ties fold places** (`windowTies` now goes through the state term): "Edith at the stable window"
  reads as the stable. Before, the unfolded place made a tie that could never hold once an order was known.
- **Silver Blaze** (Round 74): ten orders, in the evening (the lads' return, the message, Straker's unease), the
  window scene (the tip and the dog, Edith's run and flight, the leaning and the search, the locked door), one
  o'clock (dressing and leaving), and seven o'clock and the morning (waking, the open door, the lads roused, the
  body and the cravat).

## As built (2026-10-16): layers (world model, step 4; Round 64)

- A pencil mark may carry `layer` (a theory id; none = the player's own). `theoryMarks` derives where a theory's
  answers put agents and patients; `checkLayer(layer)` fixes the theory's answers and requires each pencilled
  declared state to take one of its marked places, against the working constraints (clashes set aside).
  `Game.visibleTheories()` decides which theories the player has met.

## Open

- **The Strict column counts unstated rules as late.** It drops every rule without `stated_in`; the night chain's
  rules are common sense the story never states, so two questions show more candidates under Strict than before
  (the editorial inferences used to carry the same common sense with no rule). Whether unstated general rules
  should count as known from the start under Strict is open. *Ruled (Round 33):* superseded by the annotation's
  background cards (`bk.*`, each marked for an 1892 and a modern reader); settle it in the gap analysis.
- **The kitchen as a place of its own.** The drugging's place is recorded as "one of straker_villa, villa_kitchen";
  the kitchen is a place card used only by the lads' supper, so a rule over the portion's keeping place reaches
  the villa half only and `k.drugged_in_house_means_before_nine_five` stays asserted. Fold the kitchen into the
  villa (the answer becomes "straker_villa"), or keep it: Robert's call. *Done (Round 35):* folded into the villa; nothing
  in the story turns on the difference.
- **The police's four false inferences** (`k.police_simpson_drugged`, `k.police_simpson_took_horse`,
  `k.police_stick_killed`, `k.gregory_gypsies`) are the asserted inferences without a reason. To verify them as
  the police's reasoning, their rule applications must take the inference's reading: today a `#rule` constraint of
  a `truth: false` inference is checked against the true solution like any other and the validator refuses it
  ("the true solution violates k.police_stick_killed#rule1"). Robert's ruling on the kickoff's open question 2
  (their own wrong rule cards, or stated only) decides the shape; slice 4 (the report gate) waits on it.
  *Ruled (Round 33):* neither as asked. Model them as the annotation does: each police conclusion is a member of
  a candidate set (`t39.4`, `t46.1`, `t62.2`), the police's rules are defeasible defaults, and the reader defeats
  them by undercut, strain and drop (`t36.2`, `t40.5`, `t46.3`, `t62.4`). Built as part of the infrastructure the
  gap analysis lays out, not separately; slice 4 waits on that.
- **Cards quoted later than they appear** (19, listed in the report): an earlier quote where the story has one.
  *Ruled (Round 33):* handle with the annotation's fair-play table and late-disclosure typing, in the gap analysis.
- **The sheep event at ¶173** now shows its four questions, "Who did it?" among them, when the lad reports the
  lameness; whether that runs ahead of the story is Robert's call. *Done (Round 34).* *Ruled (Round 33):* at ¶173 the question is
  first what caused the lameness, not who did it. The lameness is an observation whose cause is open (the
  annotation's `t173.1`, `t175.1`); someone's practice is one candidate cause, and the agent question belongs to
  the practice event once the player or Holmes reaches it.
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
