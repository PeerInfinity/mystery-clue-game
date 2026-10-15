# Format 0.3, slice 2 — traits, the relational closed world, and the migration of the asserted inferences

**Date:** 2026-10-14 (Fable session; rulings taken from Robert).
**Parent:** `docs/format-0.3.md` (the format as built, decisions), `docs/redesign.md` (why), `docs/design.md`
Round 22 (what shipped). Read those first; this document says what to do next and what not to re-open.

**Status (2026-10-15, Opus session):** slices 1 (traits) and 2 (the establishment relation) are DONE, see
`docs/format-0.3.md` "As built (2026-10-15)" and `docs/design.md` Round 23. The report now lists 7 verified and
46 asserted inferences (the "47" below predates one). Start at slice 3. Anchors that changed: the two editorial
claims are gone; `relations.json` has 8 relations (`knew_menu` is now `knew_menu(house, person)`); `npm test`
takes about 67 s; the solver gained guarded lookups and branching on lookup keys first (read its notes before
adding relations that range over many open slots).

**Status (2026-10-15, Fable session):** slice 3, chain 1 (the night sequence and whereabouts) is DONE: 14 verified,
39 asserted; see `docs/design.md` Round 24. Robert ruled: no `at` relation, rules over events bound to the event in
question; propositions wait for step 2. Next chain: the drugging's place and time.

## 0. Mission in one paragraph

Finish making the case's reasoning checkable. Add traits so rules read generally; replace the two editorial
closed-world claims with an establishment relation and general rules; then convert the 47 inferences the
report lists as *asserted* into *verified* ones, chain by chain, until the report shows every inference
derived by the engine from its premises. Keep the reading layer untouched and every test green throughout.
After that, step 2 of the redesign (propositions as citable intermediate conclusions, short chains) and the
UI for the player's two new moves, behind a busy indicator.

## 1. Settled rulings — do not re-litigate

1. **Closed-world facts go relational** (Robert, 2026-10-14). No editorial claims listing whom the dog knew
   or who knew the menu. Instead `of_establishment(person) → place` (and the household), with general rules:
   "a stable dog knows the people of its own establishment", "the people of a house know what it will eat".
   People whose establishment the story never gives are not eliminated by the dog argument alone. That is the
   honest result; the curry route closes them.
2. **Traits first** (Robert, 2026-10-14). Entity cards get `traits` (e.g. `spiced` on curried mutton); a
   variable spec may say `trait`; rule binding refuses a card without it. A trait shows on its card as a gloss
   and must read as plain description. This replaces `only` lists on rules such as `r.curry_masks`. Facts
   about one specific thing stay ground facts with a formula and no schema.
3. **A busy indicator** before the new moves get a UI: the solver runs in a Web Worker (or yields), with a
   "still checking…" state and a time budget.
4. **Order:** traits → establishment relation → the 47 inferences → step 2 (propositions, chains) → the UI
   for `applyRule`/`conclude` → step 3 (coverage, scenario board). Each a separate commit; `npm test` green.
5. Standing rulings carry: nothing on a card before the story says it; every valid route accepted; doubt is
   the player's move; difficulty is a set of options; discuss before changing.

## 2. Anchors (verified this session)

- Engine: `engine/logic.js` (`ground`, `index`/`nindex` lookup), `engine/caseModel.js` (`instantiateRule`,
  `verifyInference`, `addDynamic`, the `#rule` constraints an inference's rule applications become),
  `engine/solver.js` (`indexPrune`), `engine/game.js` (`applyRule`, `conclude`, `stepMade` by covering
  formulas). Tests: `engine/reasoning.test.js`.
- Data: `cases/silver-blaze/relations.json` (7 relations), `propositions.json` (empty), `knowledge.json`
  (6 rules with schemas + `r.planned_the_dish`), `constraints.json` (6 verified: `k.dog_knew_the_visitor`,
  `k.drugger_knew_the_dish`, `k.drugger_chose_the_dish`, `k.menu_choosers`, `k.bill_is_his_own`,
  `k.bill_names_its_debtor`), `claims.json` (`c.dog_knows_household`, `c.menu_known_to_household`: the two
  editorial claims to retire; `c.milliner_bill` now says the bill is made out to Derbyshire).
- Report: `cases/silver-blaze/report.md` § Inferences lists verified vs asserted.
- Timings: `npm test` ≈ 55 s; a whole-hand `prove` late in the story ≈ 4 s; the fair-play walk under Wait
  ≈ 0.3 s. The expanded-implication encoding of lookups made searches 6× slower; keep the native lookup.
- Variable specs: `{kind|kinds|section: 'event'|only|also}`; relation args the same; `outside` on a relation
  says what it is beyond its range. A relation looked up by one slot grounds to a lookup; by two slots, to
  guarded implications.

## 3. Slices

1. **Traits.** `traits` on entities (schema, validator: every trait a rule names exists on some card, and a
   trait reads on the card as a gloss dated by the card's first mention); `trait` in variable specs
   (`cardsOf`); `describeSpec`; a test; `r.curry_masks` moves from `only` to `trait: 'spiced'`.
2. **Establishment.** Relation `of_establishment(person|animal|group) → place` with answers from the story
   (King's Pyland for the household and lads; the villas for Simpson; Mapleton for Brown and Dawson; the camp
   for the gypsies; London for Holmes, Watson, the milliner; open for the rest). Claims give the values where
   the story says them (Straker's household, the lads, Simpson at the villas, Brown managing Mapleton…).
   Rules: dog knows own establishment; a house's people know its menu. Retire the two editorial claims.
   Re-verify the dog and curry chains; update the route steps' premises; theories' `holder_lacks`.
3. **The chains**, in this order, each a commit: the night sequence and whereabouts (`k.wife_stayed_home`,
   `k.lads_slept`, `k.hunter_was_drugged`, `k.straker_went_out_first`, `k.night_sequence`: needs an
   `at(person, window) → place` relation); the drugging's place and time; the coat and the vesta; the knife
   and the purpose (`k.knife_for_an_operation`, `k.operation_in_the_open`, `k.horse_kicked`,
   `k.blow_needs_a_wielder`, `k.only_one_blade`); the second household; the horse's whereabouts and Brown;
   the disguise and the bay; the police's four false inferences (verify them *as* the police's reasoning:
   their premises plus their rules entail their conclusion; the case still reads them doubted).
4. **Report gate:** 0 asserted, or each remaining one carries `asserted: "<why>"`; then make an unexplained
   asserted inference a validator error.

## 4. Discipline and traps

- The fair-play test (`engine/game.test.js`, "fair play under the 'wait' pace") must pass under all three
  background settings after every chain. If a gate moves, say so in the Round entry.
- A rule's binding must fail cleanly when the bound event lacks a facet (`no such slot`): that is intended.
- Relation slots on events wait to be raised (never show with the event); on entities they are raised by a
  held clue, and filled ones stay hidden until doubted.
- Do not reformat the one-object-per-line JSON files. Edit lines.
- A shared model across several `Game`s: the player's cards get model-unique ids; loads rename on collision.
- `node --test engine/` does not work; name the files.

## 5. Open questions (ask only if blocking)

- Whether `at(person, window)` should be one relation or the existing event facets suffice for whereabouts.
- Whether the police's false inferences should list their own (wrong) rules as rule cards the player can
  hold and doubt, or stay stated-only.

## 6. Acceptance

`npm test` green; `report.md` shows 0 (or explained) asserted inferences; the reveal and foreshadow logs show
no new text ahead of the story; a Round entry in `docs/design.md`; committed and pushed.
