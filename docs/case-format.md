# Case format and engine reference

**Spoilers:** this page gives away the solution of "Silver Blaze".

The case format (version 0.3) as it stands, and the engine behaviour it drives. The case lives in
`cases/silver-blaze/`; the JSON Schema is `schema/case.schema.json`; the engine is `engine/` and the validator
`scripts/validate-case.js`. Commands, the source layout and the tests are in `docs/technical.md`; the annotated
reading the thoughts mirror is `docs/reading-annotated.md`.

## The model

- **Cards** are what the player sees, holds and connects: entities, events, claims (clues), rules (background
  facts), glosses, propositions and inferences, all with ids unique across the case. The player adds cards of
  their own while playing: applied rules and concluded inferences.
- **Slots** are the open questions on cards: an event's agent, place, time; an object's owner; a placeholder's
  true identity; whether a statement is true; a relation tuple; a state of a thing in a time window. The
  solution is one value per slot. A slot whose answer is `null` (or a list of values) is left open by the story.
- **Constraints** are formulas over slots, each resting on premise cards. One per claim that asserts something,
  one per authored inference (plus one per rule application it lists), definitions (always active), and the
  world model's ties. A constraint is active once its premises are known (the case's reading) or while its card
  is held (the player's reading).
- **Givens** (sudoku's printed digits): a clue whose `asserts` states a slot's value outright (`eq`, at top level
  or in a top-level `and`) fills that slot as soon as the clue is held and trusted. Never a case question: those
  the player proves.
- **Rule cards** carry general knowledge; with a `schema` (a formula with variables) or a ground `formula` they
  can be applied to cards and checked like any constraint.
- **Inferences** (`constraints.json`) are reasoning written into the case, each with premises and a formula; the
  engine verifies most of them from their premises and rule applications.

Three time axes stay apart throughout: the **fabula** (what happened, `fabula_order`, the time windows), the
**investigation** (what Holmes and the player do: `actions.json`, the order cards are collected) and
**disclosure** (the paragraph where each card is first told). Nothing on a card may run ahead of disclosure.

### Two readings of every claim and inference

Every claim that asserts something has two readings. **Trusted**: its formula holds. **Doubted**: its formula
holds exactly when its truth slot `<id>.truth` is `true`. The case's own reading (validator, Holmes's steps)
doubts the claims marked `truth_slot` and trusts the rest; a player trusts every clue until they doubt it. The
reading the case does not use is a **variant** constraint (`k.<claim>#trusted` or `k.<claim>#doubted`), and the
truth slot of a claim the case trusts is **latent**: both exist only for the player's view, and the validator
skips them. An inference has the same pair (`<id>` and `<id>#doubted`, or for a `truth: false` inference `<id>`
doubted and `<id>#trusted`), with a truth slot asking "Does it hold?".

## Loading

`case.json` lists its `parts`; each part file is an object of named sections, every section an array, merged into
one case (`mergeCase` in `engine/caseModel.js`; a part's `description` and `$`-keys are skipped). `mentions_file`
and `thoughts_file` are loaded separately (`engine/loadCase.js`): the mentions as `data.mentions`, the thoughts as
`data.thoughts` and their background cards as `data.background`. `buildModel` makes the cards, slots and
constraints and a solver problem over them; `Story` (`engine/story.js`) indexes the text.

Conventions: data files hold one JSON object per line (edit lines, never reformat a file); ids match
`^[a-z][a-z0-9_.]*$`; quotes (`source`, `raised`, `reveal`, `relevant_from`…) are verbatim from `story.txt` and
each must lie within one paragraph (curly quotes, dashes, underscores and whitespace are normalised). Id prefixes:
`e.` events, `c.` claims, `r.` rules, `g.` glosses, `k.` inferences, `p.` propositions, `rel.` relation slots,
`st.` state tracks, `ord.` order slots, `q.` questions, `t.` theories, `a.` actions, `pz.` puzzles, `rd.`
readings, `ck.` checks, `bk.` background cards, `t<para>.<n>` thoughts, `s<nn>_` scenes, `w.` windows.

## The case files

### story.txt

The text, split into paragraphs at blank lines (paragraph 0 is the title). A paragraph number is an index into
that split; `read` counts paragraphs read, so paragraph `p` has been read once `read > p`.

### case.json

- `schema_version` (`"0.3"`), `parts`, `mentions_file`, `thoughts_file`.
- `case`: `id`, `title`, `author`, `source` (`text_file`, Gutenberg id, collection, year, word count),
  `setting`, `protagonists`, `narrator`, `starting_items` (items the player holds from the start),
  `challenge_scene` (the last scene before the solution: the fair-play cut), `summary`, `solution_summary`,
  `teaser` (shown before reading; gives nothing away).
- `facet_types`: facet name → its values, as a domain spec (below): `agent`, `patient`, `recipient`, `object`,
  `instrument`, `place`, `time`, `owner`, `identity`, `truth`, `subject`, `cause`. Each has a `prompt`; a facet
  with `values` may give `labels` and `reveal`. An event or entity facet becomes the slot `<card>.<facet>`; a facet
  with no entry is an error (declare such a slot in `slots.json`).
- `time.windows`: ordered time points `{id, label, day, clock?, reveal}`. `day` 0 is the day of the crime, null
  before the story. Windows are ordered points, not clock readings; `before`/`not_after` compare their order. A
  window is offered as an answer, and a state question naming it is shown, only once its `reveal` line is read
  (a label can describe what happened then).
- `scenes`: `{id, title, time, place, summary, source}`. A scene starts at its first quote's paragraph.
- `questions`: the headline questions `{id, slot, text, raised}`. `text` names cards only through `{card}`
  placeholders, filled with what the story calls each card so far. A question shows from its `raised` line.
- `theories`: the story's theories (see Theories and scenarios).
- `inconsistencies`: places the text contradicts itself `{id, summary, source}` (listed in the report).
- `notes`, `settings_defaults` (`difficulty`, `pace`).

### entities.json

`{id, kind, name, names, first_mentioned, source, aliases?, within?, flags?, facets?, notes?, traits?, summary?}`.

- `kind`: `person`, `animal`, `group`, `place`, `object`, `document`, `topic`. A topic card is a subject, not a
  thing (its `names` may be `editorial`, with a `summary`).
- `name` is the case's own; the player never sees it. `names` (`[{name, source}]`, in story order) are what the
  player sees: the latest whose line has been read. The first must be given by a line read by the time the card
  appears.
- The card appears at its first mention (`mentions.json`), or with its `source` quote if no mention is found.
- `within`: for a place, the larger place it is part of (folds places in the world model).
- `flags`: `placeholder` (stands for someone not yet identified; its identity is a slot), `hypothetical`,
  `fiction_within_story`, `implied`, `stereotype`. Placeholders and fictions are left out of kind domains;
  hypothetical cards stay in (a theory may need them).
- `notes`: details the story adds after the first mention, `{text, source}`, each shown from its quote (never
  before the first mention).
- `traits`: `{id, term, text, source}`, general properties a rule can range over (a variable with `trait`). A
  trait shows on the card like a gloss, from the first mention or its quote, whichever is later; its text is
  plain description. Traits carry the general reading of specific things (the knife is *surgical*, the curry
  *spiced*, the horse *entered*): the rule ranges over the trait, the binding names the card. A fact about one
  specific thing stays a ground fact with a formula and no schema.

### events.json

`{id, label, labels, fabula_order, facets, told_in?, source, implied?}`. `label` is the case's; `labels` (dated
like `names`) are the player's. `fabula_order` is the true order (ties inside a window are broken by it). Each
facet value is the true answer: an id, a list (the story narrows it to these and never settles it) or null (never
said). An event told directly appears at its quote; an implied one also arrives with any held clue or inference
whose formula speaks of it. An observation whose cause is open is its own event (the sheep going lame, with a
`cause` facet), apart from the act that may explain it (someone's practice on the sheep).

### claims.json

`{id, text, about, asserts?, truth, truth_slot?, truth_undetermined?, derived?, said?, said_at?, part_of?,
disclosure?, attested, note?}`. One proposition each.

- `asserts`: what it says in slot terms; becomes `k.<claim>`. May use relation terms and `only`, and `seq`.
- `truth`: whether it is true. A false claim that asserts something needs `truth_slot`. `truth_slot`: it may be
  false (testimony, opinion), so it has an open truth slot in the case's reading; `truth_undetermined`: the story
  never settles it.
- `derived`: a conclusion to prove, not a clue to collect. It is never dealt, never part of the uniqueness
  evidence, and the validator checks it follows from the rest.
- `said`: what the clue tells for certain whatever the player makes of its content (that the speaker was certain
  of it), as `k.<claim>#said`, active whenever the clue is held, doubted or not. `said_at`: when the speaker said
  it (default the time of the scene that tells it).
- `part_of`: a part of a statement (what was seen, what concluded), dealt only when the player splits that
  statement. Its lines lie within the statement's own, and the parts together assert what it asserts.
- `disclosure`: see The reader.
- `attested`: who told it and how, `[{via, by?, to?, scene, source, chain?, files?}]`. `via`: `narration`,
  `report`, `testimony`, `admission`, `document`, `physical`, `observation`, `absence`, `inference`,
  `editorial`. The claim appears at its earliest attestation quote. `chain` (`[{by, to, at?}]`) names who passed
  it on before the one quoted. `files` makes it an absence the player files (see Absences).

### mentions.json

`{entities: {id: [phrase…]}, windows: {window: [phrase…]}}`: how the text names each card and time. A phrase is
matched exactly on word boundaries; overlapping mentions resolve to the longest; `{text, paras: [from, to]}` limits
a phrase to a paragraph range. Paragraph 0 never introduces anyone. Clicking a mention collects its card on Hard.

### slots.json

Slots that are not plain facets: owners, identities, purposes, motives and other case-specific questions,
`{id, on, facet?, prompt, domain, answer, note?}`. A **domain spec** is one of `{kinds}` (entity cards of these
kinds, placeholders and fictions excluded), `{time: true}` (every window) or `{values}`, with optional `labels`,
`include_self` (the slot's own card as a value: "nobody else in the story"), `also` (extra values) and `reveal`
(value → a quote: offered only from there). An identity facet's domain is the placeholder's own kind plus itself.

### relations.json

`{id, text, args, values?, labels?, prompt, default_answer?, answers?, open?, outside?}`: a relation between
cards; every argument tuple is a slot `rel.<id>.<arg>…` on its first argument's card. `args` are variable specs
(below); `values` a domain spec (default true/false). `answers` are `[arg…, value]` rows; the rest take
`default_answer` (null: open), unless listed in `open`. `outside` says what a lookup reads for an argument
outside the declared range (`error`, the default; `true`; `false`). Claims give relation slots their values with
`eq` on a `rel` term, or with `only`.

Closed-world facts go relational: instead of an editorial claim listing who the dog knew, a general rule over
`of_establishment` ("a stable dog knows well the people of its own establishment"). People whose establishment the
story never gives are then not eliminated by the dog alone, which is the honest result; a value is added only to a
claim the story makes, never as an editorial list. Silver Blaze declares `acquainted`, `knew_menu`,
`heads_household`, `dish_of`, `needed_hiding`, `masks_taste`, `found_on` and `of_establishment`.

### propositions.json

`{id, text, prompt?, answer, means?, source?, note?}`: an intermediate conclusion as a boolean slot `p.<name>`,
which is also a card the player can conclude and cite. `answer` defaults to true; null leaves it open. `means`
(a formula) adds the always-active definition `k.<p>#def`. `source` lines deal the card at the first; otherwise
it comes with a clue or inference that speaks of it. A proposition also names knowledge and belief tracks.

### constraints.json (inferences)

`{id, label, by, premises, formula, rules?, implicit?, asserted?, truth?, stated?, source?, disclosure?, pattern?}`.

- `by`: who reasons so (`holmes`, `police`, `gregory`…, or `editorial`: needed by the puzzle, voiced by nobody).
- `premises`: clues, rules, propositions, events or other inferences. An inference may cite another (a short
  chain): it counts wherever its flat ancestry would.
- `rules`: the rule applications it uses, `[{rule, bind, defeated_by?}]`. Each rule must be among its premises and
  carry a schema or formula. Each application is a constraint of its own, `<id>#rule<n>`, active with the
  inference and set aside when it is doubted, so the case's reading holds the derivation and not only the
  conclusion. `defeated_by`: see Defeasibility.
- `implicit`: a step the engine needs but a reader makes without noticing; no thought names it. It is granted as
  soon as its premises are held (at every difficulty), never gates, never scores, and is shown as following from
  its premises and doubtable.
- `asserted: "<why>"`: the engine cannot derive it from its premises; the reason shows in the report. An
  inference neither verified nor carrying `asserted` is a validator error; one marked asserted that verifies is a
  warning.
- `truth: false`: a character's wrong reasoning. The case reads it doubted (its truth slot answers false); a
  player trusts it until they doubt it. It is verified as its reasoner's reasoning, never a step of Holmes's.
- `stated`: `[{by, source}]`, where a character states it: it arrives there by itself.
- `pattern`: an optional label (deduction, elimination…); the case does not use it.

**Verification** (`verifyInference`): claim premises in their trusted reading, premise inferences as held,
premise propositions as true, ground rule formulas and the grounded rule applications, the definitions, and the
world ties of the things whose states it speaks of, must entail the formula. Result: `verified`, `asserted` (the
premises do not entail it), `vacuous` (the premises clash: an error) or `error`. A **conditional inference**
("if X then Y") verified from small premises is the shape to prefer when an ordering depends on an identity its
own premises do not settle; the full model closes the condition through other inferences.

### knowledge.json

Five sections.

**rules** `{id, text, attaches_to, source?, stated_in?, relevant_from?, schema?, formula?, strength?, unless?,
period?, editorial?, flags?}`. A background fact shown on the cards it `attaches_to` (and its topic card), mixed
with period notes so that it does not stand out as a clue. `source` is where the story itself states it;
`stated_in` the scene. `relevant_from` is where the story first touches its subject: a fact arrives there, never
before one of its cards is mentioned. A rule's `relevant_from` must neither run ahead of the story (a rule about
a drugged guard surfaces with the opium, not with the guard) nor behind a gate it serves (it would move the gate).
`schema` is `{vars, formula}`; `formula` a ground formula the fact asserts outright. A rule with neither only
switches authored inferences on. `strength`: `hard` (always so), `default` (so unless a named defeater holds),
`heuristic` (usually so): authored as the rule's general reliability, never by whether its use in this case is
true. `unless`: its exceptions (see Defeasibility). `period`: knowledge an 1890s reader had and a modern one may
not. `editorial`: true but plays no part in the solution (keeps the clue-relevant facts from standing out).
`flags: ["stereotype"]` marks a period prejudice voiced in the story.

**glosses** `{id, term, text, attaches_to, editorial?, after?}`: background for a modern reader, shown with the
card's first mention, or from the `after` quote. None may show before the story uses its term (or reaches its
`after` quote).

**puzzles** `{id: "pz.<name>", cards, thought, explanations: [{formula} | {inference}]}`: an oddity a story of the
night must explain. `cards` show it; `thought` is the annotated thought that reads it; an explanation is a formula
over slots or an inference whose formula is borrowed. No text of its own. At least one explanation must hold in
the answer key.

**readings** `{id: "rd.<name>", slot, cards}`: a slot that carries what old cards mean (why the knife was taken
re-reads the knife clues).

**checks** `{id: "ck.<name>", action, plans, at, result, outcome?, answer?}`: a check Holmes makes that a reader
can plan first (see Checks). No text of its own.

### states.json

`state_places` (`[{id, text, places}]`, named place sets), `state_splits`, `state_conditions` (`[{id, prompt}]`,
`{0}` for the thing), `state_aims` (`[{id, label}]`) and `states` (one track per line). See The world model.

### actions.json

The investigation: `{id, order, actor, label, time, place, during_scene, narrated_in, requires, yields, source,
cue, note?}`. `order` is the investigation axis; `during_scene` null is offstage. `requires`: earlier `actions`,
`cards` known, `thoughts` (Holmes's steps made), `items` held, `access`. `yields`: `cards`, `items`, `thoughts`.
An action happens when the reading reaches its first quote: its items are added and `cue` labels the read-on
button. An action's `requires.thoughts` gate that paragraph on the 'wait' pace. The validator walks the actions in
order and checks every requirement is met by what came before (rules count as known from the start).

### thoughts.json

The annotated reading as data, mirrored field by field from `docs/reading-annotated.md` (`npm run
validate-thoughts` checks the mirror).

`background`: `{id: "bk.<name>", text, reader_1892, reader_modern, maps}`: what a reader brings, marked for an
1892 and a modern reader (`yes`, `likely`, `partial`, `rare`, `period`, `specialist`, `racing public`,
`racing-literate`, `needs the text's gloss`, each optionally followed by words), with `maps` naming the rules that
hold it.

`thoughts`: `{id: "t<para>.<n>", para, scene, tag, subtype?, confidence?, profile, from?, relations?, reads?,
holmes?, maps?, text?, typed?, remark?, hindsight?, …}`.

- `tag`: `RECORD`, `NOTICE`, `ABSENCE`, `QUESTION`, `HYPOTHESIS`, `INFER`, `DEFAULT`, `AGENT`, `PHYSICAL`,
  `IDENTIFY`, `WEIGH`, `SOURCE`, `TEST`, `RESIDUE`, `PREDICT`, `TEST PLAN`, `GENRE`, `SET ASIDE`, `DROP`,
  `REVISE`; `also` and `then_tag` a second tag. Subtypes per tag (`GENRE`: `re-read`, `watch-holmes`;
  `IDENTIFY`: `merge`, `split`; …). The deduction tags are INFER, DEFAULT, AGENT, PHYSICAL, IDENTIFY.
- `confidence` (`weak` … `strong`; not needed for RECORD, QUESTION, SET ASIDE, re-read); `profile`: `typical`,
  `careful` or `expert`.
- `from`: earlier thoughts or `bk.*` cards it rests on; `relations`: `[{type, target, member?}]` with type
  `supports`, `strains`, `refutes`, `undercuts`, `revises`, `drops`, `answers`, `strained_by`.
- `reads`: the clauses it reads (none later than its paragraph). `holmes`: `{paras, range, note}` (where Holmes
  takes it up) or `{never: true}`.
- `maps`: the case cards, slots, actions, theories, puzzles, readings or checks that hold it.
- `text`: the reader's note at that paragraph (cites no later thought or paragraph); `typed`: what the autoplay
  types instead (no ids, backticks, ¶, ⚠ or braces); `remark`: the annotator's hindsight note, never typed;
  `hindsight` (`low`, `medium`, `high`, `noted`) matches the ⚠ mark in the remark.
- Game fields: `inference` (a deduction's authored inference; also allowed on TEST, WEIGH, SOURCE and DROP),
  `date_note` (an accepted miss of the earliest date), `no_inference` (`action`, `world-model`, `absence`,
  `doubt`), `concludes` (below), `notices` (cards whose marking as odd counts; NOTICE only), `raises`
  (`[{target, exception}]`), `dropped`, `checks` (`[{check, expect?, answer?}]`; PREDICT, TEST PLAN or
  HYPOTHESIS), `asks` (`{template, cards}`; QUESTION only), `candidates` (`{slot, values}`; HYPOTHESIS only),
  `aside` (a card to set aside; SET ASIDE only), `passage` (`[from, to]`, paragraphs already read; GENRE·re-read
  only; it makes no move).

`dropped` is `{theory | slot, value | inference, reason, cites?, deadline?}`: the game target it drops, why
(`DROP_REASONS`, or a doubt reason for an inference), the cards cited, and, where Holmes never takes it up, the
paragraph by which the story makes it untenable.

`concludes` is `{formula | slot, value; premises; source}`: a conclusion of Holmes's that no single inference
gives, the cards it rests on and Holmes's line.

The thoughts checker (`engine/thoughts.js`) requires a deduction to name an inference or give a `no_inference`
reason, and every inference to be named by a thought, marked `implicit`, or false. A thought's `from` and its
inference's premises must agree both ways: a rule the inference applies is its warrant and needs no citation, an
implicit premise is bookkeeping. Its **earliest date**: the paragraph by which the game (read through, background
where relevant, absences filed as soon as possible) has dealt every premise, recursively, and the event,
proposition and entity cards its conclusion speaks of, must not be later than the thought's.

## Formulas

A formula is a JSON object with exactly one operator key, read in three-valued logic (true, false, undecided):

| Operator | Meaning |
|---|---|
| `eq`, `ne` `[term, value]` | a slot has / has not the value |
| `in`, `nin` `[term, [values]]` | among / not among |
| `same`, `diff` `[term, term]` | two slots equal / unequal |
| `before`, `not_after` `[a, b]` | time order of two time slots or `{lit: window}` |
| `and`, `or` `[f…]`; `not` f; `implies` `[f, g]` | |
| `true`, `false` | constants |
| `index`, `nindex` `[key, {value: slot}, value, outside?]` | the slot selected by the key's value holds (or not) `value`; produced by grounding |
| `seq` `[e1, e2, …]` | events in one window, in this order (claims only) |
| `forall`, `exists` `[varSpec, body]` | over cards (schemas) |
| `only` `[relation, fixedArg…, [trueFor]]` | the relation's last argument true for the listed cards, false for every other it ranges over |

Formulas are compiled once into closures, cached per formula object: a formula must not be changed after it is
first evaluated.

### Terms and schemas

A term is a slot id, `?v` (a variable bound to a card), `?v.facet` (a slot of the bound card), `{rel: [name,
arg…]}` (a relation slot; an arg is a card id, `?v`, or a slot whose value indexes the relation) or `{state:
[name, thing, time]}` (a declared state; see The world model).

A rule's `schema` is `{vars, formula}`. Each variable has a spec: `kind`/`kinds` (entity cards, placeholders and
fictions excluded), `section: "event"` (event cards), `only` (a list), `trait` (cards carrying it), `also` (extra
cards), `placeholder: true` (the cards standing for someone not yet identified), `window: true` (time windows and
parts), `condition: true` (declared conditions), `proposition: true` (propositions; in a state term the bound
proposition names its knowledge track; bound to `p.x` it also stands for that slot), `statement: true`
(testimonies and admissions by a person or group; in a state term it names the speaker's belief in it). Every
declared variable must be used, by the formula or by a named exception's formula (a variable may serve only an
exception). Quantifiers over a trait give a rule its closed world honestly ("one of the runners") without naming
cards.

**Grounding** (`ground` in `engine/logic.js`) binds the variables and returns an ordinary formula. A relation term
indexed by slots expands over those slots' domains; indexed by one slot and compared with one literal it grounds
to a native lookup (`index`/`nindex`), which the solver propagates directly. A missing facet, an unbound variable
or an argument outside a relation's range (with `outside: error`) fails the grounding. **Binding** checks each card
against its variable's spec (`instantiateRule`). Claims, propositions' `means`, rule formulas, inference formulas
and Holmes's step conclusions are grounded once when the model is built.

## Slots

Built by `buildModel`: one per event facet and entity facet; a truth slot per claim with `truth_slot` (open) or
with `asserts` (latent); a truth slot per inference (latent when true); the declared slots; one per relation
tuple; one per proposition; one per declared state; the order slots of splits and `seq` pairs; a latent belief
slot per statement and speaker; and, during play, a latent truth slot per player card and the states and splits
the player opens.

**When a question shows** (`Game.slotVisible`): an event's own facets show with the event; a claim's other slots
and identity slots show with their card; otherwise a slot waits until it is raised: by a held clue that speaks of
it (a slot the clue simply fills shows only once the clue is doubted), a held inference that speaks of it, a case
question whose `raised` line is read, or a gate of Holmes's at or before the paragraph read. A state question also
waits for its window's `reveal` line and for the events that split its window to be held. A claim's or
inference's truth question opens when it is doubted.

**Which answers are offered** (`offered`): a window only from its `reveal`; a value with a `reveal` quote only
from there; a card only once held. A card left out of the game (see Difficulty) is no answer to rule out.

**Settled** (`settled`): proven by the player; else (Trivial) the one value the game leaves; else given by a held
trusted clue; else the one value left after proven cross-outs. A proof outranks a given; where they disagree the
player is shown the clash (`givenClash`).

## Holmes's steps and the 'wait' pace

Holmes's steps are built from the thoughts when the model is built (`engine/steps.js`, `data.route`):

- a thought naming a true inference is a step whose conclusion is the inference's formula and whose premises are
  the clues and rules down its chain. It is Holmes's own (it gates and he states it) when the inference is `by:
  holmes`, not implicit, and the thought has Holmes paragraphs; its anchor is the first of them;
- a thought with `concludes` is a step of Holmes's whose conclusion is that formula (or the slot and the value
  ruled out), anchored at Holmes's line.

A step's **needs** are its own inference, or for a `concludes` step the fewest inferences among those resting on
its premises that give the conclusion (cached per problem).

**Gates** (`Story.gatesFor`): paragraph → the steps a reader must have made before reading it. A Holmes step gates
its anchor if its conclusion is sharp (an inference, a slot ruled out, or a top-level `eq`); an action gates its
paragraph with its `requires.thoughts`. A gate never comes before the step's last premise is told: a background
fact counts as told at its `ruleAt` (below); if a premise is first told in the gated paragraph itself, the gate
moves to the next. A step whose thought is `expert` never gates (an expert's leap is a bonus); it still scores. A
step with a premise never told gates nothing.

With the 'wait' pace `advance` refuses a gated paragraph until its steps are made (`blockers`); with 'free' the
unmade steps are logged as `told`. A step is **made** (`stepMade`) when the player holds and trusts every inference
it needs (however they got them), or has struck its slot's value with a proof, or settled the slot to another
value, or their settled values entail its conclusion, or a held trusted inference or applied rule of theirs covers
its conclusion (formula against formula: cheap; the whole-hand entailment runs only when the player concludes).

Holmes's needed inferences are **stated by Holmes** at the earliest paragraph that waits for the step, else at its
anchor. One paragraph before a gate, the card holding the step's question is dealt, so the player can see what the
story waits for.

## The world model

### Tracks

A **track** is one thing in one aspect over the time windows the case's logic turns on:
`{id: "st.<thing>.<name>", of, aspect, windows: {window: answer | null}, places?, holders?, condition?, knows?,
believes?}`. `<name>` is `at` (location), `held` (possession), `aims` (intention), the condition's id, `knows_<p>`
or `believes_<p or c>`. Each declared window (or part of one) is a slot `<track>.<window without "w.">` on the
thing's card. **Sparse**: a window not declared has no slot and is unconstrained. `null` is left open by the story;
for the player unknown is an empty cell, not a value. A second track for one thing and aspect is an error.

Domains: **location**, a place set (`places`: a `state_places` id or a list) plus `elsewhere`; **possession**, the
holders (people, animals and groups, or the kinds in `holders`), the set's places (lying there) and `elsewhere`;
**condition**, **knowledge**, **belief**, true/false; **intention**, the `state_aims`.

**Places fold**: a thing at a place is at the nearest listed place containing it (`within`), else `elsewhere`; a
listed place means itself apart from the listed places inside it (the stable apart from its loft). A state holds
**throughout** its time: a thing that moves within a window has no state there, only in the parts either side of
the move.

Every declared answer must be stated by a claim (naming the state slot in `asserts`, quoted from the claim's own
line) or derived by an inference (its formula or a rule application it lists). As with any given, the question
shows only once the clue is doubted.

### State terms in rules

`{state: [name, thing, time]}`: `name` and `thing` are literals or bound variables; `time` is a window, a
variable bound to one (`{window: true}`) or a time slot (`?e.time`), which grounds to a lookup over the thing's
declared windows. A window with no declared state (and a thing with no track) is unconstrained: the comparison
holds there and its denial fails. Comparisons: `eq`/`ne` with a value (`eq` folds the value; `ne` constrains only
for a value of the domain itself: not being in the bedroom says nothing of the villa), `same`/`diff` with a slot
(expanded over its values, grouped by folded place) or with another state at a given window. A knowledge track is
named by its literal name or a variable bound to its proposition.

### Splits and order

`state_splits: [{window, by, why}]` split a window (or a part) at an event into `<parent>.before.<event>` and
`<parent>.after.<event>`; a track may declare states at those parts. Every event that may share the window (no
trusted clue puts its time elsewhere) gets an **order slot** `ord.<event>.<splitter>` (before/after), answered
from `fabula_order`, open unless a claim settles it. The splitting event lies in neither part. The validator
reports order slots as settled or open, never as a uniqueness failure.

`{seq: [a, b, …]}` in a claim's `asserts` states that the events happen in one window, in this order: each
consecutive pair grounds to `same(a.time, b.time)` and `ord.<a>.<b> = before`, and the case builds that order slot
whether or not a split asks it. Only claims carry `seq` (an order the story tells, quoted from the claim's own
line), never rules, inferences or propositions, never derived claims; the events are different and timed, and in
fabula order unless the claim is false. Events the story tells as happening together get no `seq`; their order
stays open, since the model orders a window's events totally.

### The world's ties

Built by the engine, never written in the case (`k.world.*`), always-active definitions:

- whoever is the agent or patient of an event is where it is done, when it is done (a lookup by the event's time
  over the thing's windows, and guarded by order slots for the parts of split windows);
- a holder is where the held thing is; a thing held by a place lies there;
- order runs through over every order question (`x` before `m` and `m` before `z` gives `x` before `z` within one
  window), and two questions over one pair agree;
- whoever does an act with a `purpose` slot has that purpose as their aim at its time (for purposes that are aims);
- what one knows is true, and goes on being known in every later window of the track;
- what one knows one believes (where the same person has both tracks).

A tie is active only where an active card speaks of that thing's states (beliefs bring no ties); the solver
treats ties as lazy and as background in explanations. Ties are pruned by the case's trusted clues: none for an
event a clue gives to someone else, puts in a window with no declared state, or fully states (who, when, where);
a stated place gives a one-branch tie. A player who doubts that very clue loses those ties, never gains a wrong one.

### The board

`engine/timeline.js` reads the board off a game: times reached (and the player's parts), followed things, and per
cell what is **given** (a declared state the player's clues or proofs settle) and **pencilled** (free marks;
several are several hypotheses; a struck mark stays visible). Layouts by place and by thing; `cardTimeline` reads
one card's part. A mark may carry `aspect` (`held`, `aims`, a condition, `knows_<p>`) and `layer` (a theory id).

Committing a mark (`proveMark`, `ruleOutMark`, `proveOrder`) is checked: proving a state as any proof, ruling it
out as a cross-out; a proven state or order becomes a player card. Nothing is checked where what the player trusts
plus the ties gives the thing no single answer throughout that time (split it first). A state the case never
declared is **opened** (`openState`: no answer, no part in uniqueness, ties of its own); a split the player made is
opened when a part of it is committed (`openSplit`: its parts, order questions with no answer, order ties). Both
are held by count, saved, and closed on reset. `checkLayer(layer)` fixes a theory's answers and requires each
pencilled declared state to take one of its marked places; for a theory it also returns cost, residue and assumed
answers.

## Knowledge, intention and belief

- **Knowledge track** (`aspect: knowledge`, `knows: p.<name>`): did the thing know the proposition in each window.
  A clue that states a knowledge state also deals its proposition. The default rules `r.told_knows`,
  `r.present_sees`, `r.acts_on_knows` range over propositions.
- **Intention track** (`aspect: intention`, `st.<thing>.aims`): what the person was trying to do, over
  `state_aims`, one vocabulary with the purposes of acts.
- **Belief track** (`aspect: belief`, `believes: p.<name>` or `c.<name>`): did the thing believe the proposition,
  or the statement's content. Every testimony or admission by a person or group has one per speaker (along a
  `chain` too), at `said_at` or the scene's time; it is latent unless the case declares it.
- **Readings of a doubted statement**: besides the plain doubt, `mistaken` (false and believed) and `lying` (false
  and not believed), as variant constraints `k.<claim>#mistaken[:who]` and `#lying[:who]`; along a chain one pair
  per speaker (`Game.doubtKinds`, `chainOf`).
- **Conditions and propositions offered** on the board only once a held card speaks of them or a visible
  question asks them (`knowableConditions`, `knowablePropositions`), so "was it sheathed?" is not offered before
  the story gives a sheath.

## Absences and noticing

An **absence** is a clue no line states: something a default rule expected did not happen in a time, and a witness
would have registered it. `files: {expectation, windows, witness}` on a `via: absence` attestation: the expectation
is a rule, the windows the times, the witness a claim that is not itself an absence. The claim is never dealt by
mention or click at that line. The player files it (`fileAbsence(rule, time, witness)`: the rule and witness held,
the time reached and among `windows`, a part counting as its window, the line read); it is otherwise dealt at a
later attestation of its own. Trivial files it by itself. Silver Blaze: the dog did nothing (`c.dog_did_nothing`,
also told at ¶181) and no alarm (`c.no_alarm`, filed only), both witnessed by the lads' "They had heard nothing".

A **notice** marks a held card as odd, optionally because of a held rule (`notice(card, because)`); nothing is
checked or told. NOTICE thoughts with `notices` count (Scoring). Noticing a card of a puzzle meets the puzzle.

## Defeasibility

An `unless` entry is plain text (shown only) or a **named exception** `{id, text, source?, formula?}`: the id unique
in its rule, the formula over the rule's own variables, grounded with each application's bind (stored on the
`#rule<n>` constraint), the source within one paragraph. An exception shows on the cards its rule attaches to as
"Unless …", from the fact's paragraph or its own source line, whichever is later; exceptions that would run ahead
of the story (those that speak of drugging) carry a later source.

`Game.raise(card, n, exception)` against application `n` of a held card (an authored inference's `#rule<n>`, or a
rule the player applied, n = 1), once the rule is held and the exception's line read (`exceptionsOf`). It is
checked against what the player holds and trusts, leaving out the card, what rests on it, and every use of a
default with the same grounded exception (the same default over the same events answers it only by assuming it
does not hold) (`exceptionStatus`):

- **ruled out**: refused, with what rules it out;
- **open** (or no formula): a **reservation**, recorded; the card still counts and holds back nothing;
- **established**: a **defeat**: the card is doubted (counts nowhere) with the exception as its reason.

`withdraw` takes either back; trusting the card again withdraws a defeat. `raisedOn` gives where each now stands
(a reservation may since be ruled out); `restingOnDefeated` marks what rests on a defeat.

**`defeated_by`** on a false inference's application names the rule's exception (with a formula) that holds in the
true story. Verification keeps the application (the character's reasoning, verified); the case's reading leaves it
out (`defeated` on the constraint), so it is active only in a player's reading while they trust the inference; the
validator checks the exception's formula in the answer key instead. Silver Blaze's four wrong steps are built so:
the police's "Simpson drugged the lad" (defeated by "he could not have seen it"), "Simpson took the horse" (he meant
to injure it), "his stick killed Straker" (the knife was in his own hands before he was struck), and Gregory's
gypsies (they would have gone anyway). The reader's default `k.one_culprit` (one hand did both) is false too.

The report's "Exceptions" table gives, per application, whether the whole story rules the exception out,
establishes it or leaves it open, and whether the answer key bears it out.

## Clashes

A **clash** is a minimal set of active constraints the player trusts that cannot all hold (`Game.clashes`). Found
one at a time; each is broken by setting aside its lightest doubtable member (on a tie, every tied member: the
game has no ground to choose), before looking for the next. A card set aside goes whole (its trusted reading and
its rule applications); a claim is read as doubted instead. The weight is by what the player can see, never by
truth (`CLASH_CLASSES`, lightest first):

0. `others-inference`: an inference stated by someone other than Holmes;
1. `heuristic`: an inference of the player's or Holmes's that applies a heuristic rule;
2. `statement`: a clue, by how it was told: testimony or an inference stated as fact, then a report, then an
   admission, then what was seen, found or written;
3. `inference`: the player's or Holmes's other inferences.

Clashes are a convenience: the set-aside need not be perfect. `workingConstraints()` is what the player trusts
with the clashes set aside; checks run against it. Clashes met are logged (`clashLog`, saved) and seed the cache on
reload, so a reload weighs no clash again; `resolvedClashes` lists those a doubt has since resolved.

## Theories and scenarios

**Story theories** (`case.json` `theories`): `{id, label, held_by, held_in?, rests_on?, holder_knows_by_scene?,
holder_knows?, holder_lacks?, assignment, false?, source}`. `assignment` maps slots to values. The holders know
every claim told by `holder_knows_by_scene` plus `holder_knows`, and every rule except `holder_lacks`. The
validator requires each theory to fit what its holders knew and to fail on the full evidence (unless `false:
false`). A theory is met (`visibleTheories`) once its line is read and every card its answers sit on is held. The
player makes theories of their own (`addTheory(label, assignment)`).

- **Cost** (`scenarioCost(theory)`): the theory's answers held fast, the clashes they make with the working set
  broken as clashes are, until what is left fits. Each item: the cards set aside, their class, and for a clue how
  it was told. `atOdds` when it gives up the player's or Holmes's own reasoning or something seen; `refuted` when
  nothing doubtable is left to give up.
- **Assumed answers** (`assumedAnswers`): the theory's answers the working set leaves open (a trusted statement
  gives its own truth).
- **Residue** (`residue(theory)`): a met puzzle is explained when the theory's answers, with the facts left once
  its cost is paid (trusted clues and world ties, **not inferences**), entail one of its explanations. Read against
  inferences, every consistent story would borrow Holmes's explanations. A puzzle is met on Easy and Trivial once
  its cards are held and its thought's paragraph read; otherwise once the player notices one of its cards or files
  one that is an absence.
- **Support** (`theorySupport`): held inferences that agree with or go against its answers.
- **Readings** (`readingsOf(card)`, `revisedBy(slot)`): for each reading whose question is visible, the player's
  settled answer and each met theory's; the held cards an answer re-reads.
- **Drops** (`drop(target, reason, {rival, cites})`): the player drops a theory or a candidate (`{slot, value}`;
  weighed against a rival it is the rival's story with the candidate in its place) for one of `DROP_REASONS`:
  `out-explained` (the rival's residue a strict part of its own), `more-hands` (more people act in it than in the
  rival), `cost` (it needs something wrong), `card` (a cited card is in its cost or contradicts its answers).
  Never refused for a reason that does not hold; `dropCheck` checks it, and `held` records the paragraph a reason
  that holds was first given (dropping again with a better reason sets it, a worse one never clears it).

The `weigh` option sets how much of this the game shows: `names` (what a theory needs wrong, goes against and leaves
over, by name; a drop's check in a line), `counts` (the counts; a drop's check as yes or no), `asked` (nothing until
the player weighs a theory, then the counts; no drop check).

## Checks (predictions)

A case check (`knowledge.json` `checks`): `action` (the action that performs it), `plans` (`[{verb, <field>:
[accepted ids]…}]`; a field left out accepts anything), `at` (Holmes's paragraph), `result` (`{shown: N}`,
`{late: N}` or `{never: true}`), `outcome` (none for a result never told) and `answer` (a formula the result
asserts, true in the answer key). The validator requires a plan to be possible before `at` (every field it names
has an accepted card mentioned before).

`CHECK_TEMPLATES`: `look` (thing, place; found / not-found), `ask` (person, about; yes / no), `show` (thing, to;
yes / no), `compare` (thing, with; matches / differs).

The player **seals** a check (`seal(verb, fields, {expect, answer, theory})`): each field a held card, optionally
the expected result, an answer over a held question it would give, and a theory it comes from. Recorded with the
paragraph, never edited; `unseal` withdraws it (it stays on record and no longer scores). A seal matches a case
check with the same verb whose fields accept its cards. `sealStatus` shows nothing before Holmes's paragraph (not
even whether he will make it); then where he made it and the result once told (borne out or not), "never told" at
the end, or "not made". `sealTheoryTest` says what the cited theory, read as residue is, says of the expected
answer (`says-so`, `says-otherwise`, `says-nothing`, `refuted`).

A seal expecting a result is **hedged** when another live seal of the same check (sealed before Holmes acts, not
withdrawn before) expects a different result, or the same result with a different answer: expecting every result
is no expectation, and a hedged seal scores nothing. A plan with no expectation is never hedged.

## The reader

**Readers** (`engine/readers.js`): `modern`, `1892`, `racing`. Each reads one of a background card's two marks
(`reader_modern`; `reader_1892` for both others) and holds some marks (modern: `yes`, `period`; 1892: also
`likely`; racing: also racing marks). A reader **lacks** the rules a background card maps to when they do not hold
its mark (`lackingRules`); "partial" is lacking.

**`ruleAt`** (per game): where a background fact becomes available: its `relevant_from` line, never before one of
its `attaches_to` cards is first mentioned. Options:

- `reader` (default `modern`) is who the player is, not part of the difficulty: kept when the difficulty changes.
- `supplied: offered` (every preset): a lacking rule arrives like the rest, marked as supplied. `withheld`: it
  arrives where the story states it (its `source`), or never; the game then has its own gates, with that rule told
  there.

**Disclosure** on a claim or inference: `{late: N, policy}` (it should have been shown at ¶N, before its first
mention; it is told at its first mention) or `{never: true, policy}`; policy `withhold`, `background` or
`inferred`. `Game.disclosure(id)`: for a rule `{at, told, early, supplied, lacks?}`, for a check `{at, result}`,
for a fact `{at, …disclosure}`, otherwise `{at}`. `heldBack()`: late facts once told and held, supplied rules once
the story states them (or at the end), late check results once told, and at the end what was never told. Nothing
names a paragraph not yet read; never scored.

**The story's signals** (`hints: story`): `storySignals()` gives, as far as read, each GENRE·watch-holmes thought
as its clause and the held cards that clause mentions; never what it implies, never scored.

**Set aside** (`setAside(id)`, `putBack`): a held entity, event or claim set aside as scenery. It stays held and
counts as a premise; nothing checks it against the key; no score reads it.

The report's fair-play table gives, for each case question, the candidates left by the challenge scene with every
rule, and for the 1892 and modern readers without the rules they lack (unless stated by then).

## Difficulty

Difficulty is a set of options (`OPTIONS` in `engine/game.js`); the four presets are below, any other mix is
`custom`. With the game solving, the player's options do not count towards the preset.

| Option | Values | Trivial | Easy | Medium | Hard |
|---|---|---|---|---|---|
| `solver` | game, player | game | player | player | player |
| `cards` | dealt (as mentioned), collect (click the words) | dealt | dealt | dealt | collect |
| `answers` | listed, propose | listed | listed | listed | propose |
| `crossOut` | pencil, checked | pencil | pencil | checked | checked |
| `greying` | on, off: grey what the clues rule out, "Could it fit?" | on | on | off | off |
| `clashes` | on, off: list the clashes | on | on | off | off |
| `weigh` | names, counts, asked | names | names | counts | asked |
| `hints` | story, on, off | story | story | off | off |
| `kind` | off, on: name what a built inference is about | off | off | off | on |
| `connect` | implicit (background needed in hand), connect (connected like clues) | implicit | implicit | implicit | connect |
| `background` | start, relevant, ask | relevant | relevant | ask | ask |
| `irrelevant` | none, few, half, most, all (share of unneeded cards shown) | all | all | all | all |
| `supplied` | offered, withheld | offered | offered | offered | offered |

Also per game: `pace` (`free`, `wait`) and, for Trivial, `autoPace`: `holmes` (settle each answer when the story
tells Holmes's step or a narrator statement excludes the rest) or `logic` (as soon as the held clues allow, read the
way the case reads them). Cards the solution has no use for (`model.relevant`) are hidden beyond the chosen share,
by a stable hash of the id; absences, parts and inferences are never hidden.

## Reading and dealing

`advance()` reads the next paragraph (refused on 'wait' while it is gated); `readTo`, `readToNextScene`,
`readToNextDeduction` (to just before the next gate). Each paragraph read:

1. background facts arrive: with `relevant`, at their `ruleAt`; with `start`, all at reset (a withheld one where
   the story states it); with `ask`, the facts of each card already asked about, as the story reaches them;
2. actions anchored there are done and yield their items;
3. unless collecting, every card with a span in the paragraph is dealt (mentions, claim and event quotes, raised
   propositions and questions);
4. inferences a character states there arrive (`how: stated`);
5. Trivial files every absence it can;
6. the card holding the question of a gate on the next paragraph is dealt.

Dealing a card (`unlock`) also deals the events and propositions a held clue or inference speaks of, and grants
inferences whose premises are now all held: implicit ones at every level (`how: implicit`), every one in Trivial
(`how: auto`), each only once the events and entities its conclusion speaks of are held, so that a granted card
never introduces them early. On Hard a card is collected only by clicking the words that mention it (`collect`).
Background `ask`: `ask(card)` recalls the facts about a held entity or event whose subject the story has reached,
and the card goes on recalling the rest.

What a card shows (`info`): the sentence of its first mention; later names; on an entity its glosses, traits,
held rules and their exceptions, and notes; every held clue about it with each attestation; each piece dated, none
before its line is read. `nameOf` gives the latest name read, never the case's own.

## The player's moves

| Move | What it does |
|---|---|
| `addCandidate`, `removeCandidate` | Hard: propose an answer (only its type is checked) |
| `strike`, `unstrike` | cross out: pencil, or checked (what is held and trusted must rule it out; the proof records what it used, and lapses if one of those clues is doubted) |
| `prove`, `unprove` | prove a value: what is held and trusted must leave nothing else |
| `circle`, `uncircle` | the player's pick; proves nothing |
| `propose(cards, kind?)` | connect cards: builds every authored inference the connection completes (all of `connectSet` connected and every premise held; on Hard the named kind must match); else says whether it is onto something and how many connections are missing. Only inferences whose connections are all in hand count |
| `applyRule(rule, bind)` | hold a rule's grounded formula as a card (`a.<rule>_N`) the player can cite and doubt; the same application twice returns the first. No UI |
| `conclude(cited, formula)` | any conclusion the cited cards entail, read as the player trusts them, becomes a card (`k.player_N`) resting on the cited cards that were needed; says which authored inferences it matches. Refused if the cited cards clash or do not settle it |
| `concludeFrom(cards, formula, {budget})` | "state it yourself": `conclude` with the case's own rule applications applied for the player where their rule is held (cited, with `connect`), every card they bind is held, and one is cited or spoken of by a cited card; never a defeated one. Within a time budget (20 s), else `tooHard` |
| `retract(id)` | take back an applied rule or a conclusion |
| `suspect(id, kind?)`, `unsuspect`, `setDoubtReason` | doubt a clue or inference (plain, `mistaken`, `lying`, per speaker along a chain); the reason (`DOUBT_REASONS`: could-not-see, inference-as-fact, hearsay, neutral, two-stories) is recorded, not checked |
| `splitClaim(id)` | deal a statement's parts; the statement counts nowhere from then on |
| `raise`, `withdraw` | an exception against an application (Defeasibility) |
| `fileAbsence(rule, time, witness)` | file an absence (Absences) |
| `notice(card, because?)`, `unnotice` | mark a held card odd |
| `pose(template, cards)`, `unpose`, `poseCandidate` | a question of the player's own (below) |
| `pencilPlace`, `erasePlace`, `follow`, `unfollow`, `splitTime`, `unsplitTime`, `placeEvent`, `proveMark`, `ruleOutMark`, `proveOrder` | the board |
| `addTheory`, `drop`, `undrop` | theories and drops |
| `seal`, `unseal` | sealed checks |
| `setAside`, `putBack` | scenery |
| `addNote`, `editNote`, `deleteNote` | the player's notes on the story: at a point of a read paragraph, optionally on marked words; never read by the game |
| `ask(card)` | background `ask` |
| `logHint` | the hints given; never read by a score |

Trivial refuses `applyRule`, `conclude` and `pose`. Where a whole-hand check runs late in the story it can take
seconds; the page runs it in a worker (see The solver).

**The player's own questions** (`QUESTION_TEMPLATES`, thirteen): fixed words around one or two held cards of named
kinds (an entity kind, or `events`): who, where, when, why of an event; where is, whose is, who really is, why would
{person} do it; who had, who could get at, where was {thing} during {event}, how did {thing} leave {place}, what
could not be done at {place}. Each template lists the facets it may match on its first card. A posed question
(`pq.N`) is matched quietly to a slot (never a state, order, truth or relation slot) and **joins** it only once
that slot is visible (checked before and after each paragraph and on listing, so a slot raised by the player's own
inference joins where they made it); nothing shows the match before. At the join its candidates become circles
(and proposals on Hard). A question that matches nothing stays the player's note.

## Scoring and the record

Six families, each a row per thought with a **deadline**; a row scores when the player made the move by their own
reasoning before its deadline (the last paragraph read when the move was made is before the deadline). Nothing
scores in Trivial.

| Family | Rows | Made when | Deadline |
|---|---|---|---|
| deduction | Holmes's steps with an anchor | every inference the step needs is the player's own (built, concluded or applied, and trusted) or implicit, at least one their own; or their proven cross-out of its slot's value; or a trusted card of theirs covers its conclusion; or their proofs entail it (a clue's given value is not theirs) | the anchor |
| notice | NOTICE thoughts with `notices` | the player first marks one of its cards | Holmes's first paragraph |
| raise | thoughts with `raises` | the player first raises one of its exceptions against its target (a reservation or a defeat) | Holmes's first paragraph |
| drop | thoughts with `dropped` naming a theory or candidate | the player gives a reason that holds (`held`) | Holmes's first paragraph, else `dropped.deadline` |
| check | each of a thought's `checks` | a live, unhedged seal matching the check and its expectation; it must not be contradicted once the result is told | the check's `at` |
| absence | ABSENCE thoughts with a Holmes paragraph mapping a fileable absence | the player files it | Holmes's first paragraph |

A deduction is checked before each paragraph and on request after a player's move (`madeAt`, saved as `made`).
Inferences stated by a character, granted by the game or implicit do not count as the player's own. `possible` is
every row with a deadline; rows with none (Holmes never takes it up) are recorded and cannot score. Expert steps
score as bonuses. The annotated reader's game reaches 70 on Hard (45 of 47 deductions, every other family full:
8 notices, 3 raises, 3 drops, 10 checks, 1 absence), as `action-table.json` records.

**What does not count**: anything in Trivial; a drop whose reason did not hold (it scores only from where a
reason that holds was given); a hedged or withdrawn seal; a seal contradicted by the result; a move made at or
after its deadline; the player's own questions (recorded, never counted); set-asides, signals, notes and hints.

**`Game.record()`**: the rows whose deadline has been read (never one still ahead: shown early, it would tell the
player the move is right), each `{family, thought, deadline, at, scores, lead, names}` plus what its family needs
to be told (`concludes`, `exceptions`, `target`, `check`, `seal`), and `why` on a passed row the player made that
does not count (`reason` or `hedged`); `families` (scored and passed so far, `possible` once the story has ended);
`ahead` (the rows scored); `questions` (the player's questions joined after they asked them, with their lead).

## Hints

`engine/hints.js`, on request, gives a ladder of four rungs toward the open row with the nearest deadline: where
(read paragraphs), what kind of move, which cards, and the moves themselves (the page's Do it makes them). A row is
open while its deadline is not read, the player has not made it, and what it needs is in what has been read. What
it needs comes from `hints.json` (the minimal playthrough's moves, each with the moves that first gave the cards it
needs), pruned live by what the player already has. The rungs name only held cards, read paragraphs and the words
of read paragraphs. At a missed deadline a catch-up note says where the row's material was. The hint log is saved
and never read by a score.

## The save

`Game.save()` (version 8): `difficulty`, `options`, `pace`, `autoPace`, `read`, `collected` (Hard), `marks`
(listed, struck with their proofs, proven, circled), `theories`, `lastSeen`, `suspected`, `doubtKind`,
`doubtReason`, `split`, `asked`, `clashLog`, `built`, `applied`, `concluded`, `filed`, `noticed`, `drops`, `raised`,
`seals`, `setAside`, `posed`, `notes`, `hints`, `made`, `board`, `openedSplits`, `opened`. `load` replays the
reading to `read` (re-asking and rebuilding at the paragraphs they were made), reopens splits and states before the
cards and marks that speak of them, and remakes the player's cards in order (fresh ids where a saved id is taken on
the same model). Older saves without a field load with none; saves without options map their old difficulty names.

## The solver

`engine/solver.js`, a finite-domain solver over the model's slots and active constraints: `consistent` (with
`fixed` values, `extra` formulas, `focus`), `candidates`, `allCandidates` (one batch per group of linked
questions), `explainConflict` (a minimal conflicting set, members tried in the given order), `steps` (a clash
replayed as a chain). It propagates lookups natively, treats a lookup under an implication as a guarded part,
branches first on the keys and guards of lookups and on urgent implications, splits the open slots into
independent parts, pushes negations inward and tries a denied conclusion alternative by alternative. A
`Problem`'s constraints never change, so its caches (the last `allCandidates` call, recent whole solutions) live on
it; the model rebuilds the problem when the player's cards or opened states change.

In the page, `model.wrapProblem` puts the problem behind a `RemoteProblem` (`engine/remoteProblem.js`): a call is
answered on the spot within 60 ms, or throws `NeedSolve` for `settle` to have the worker (`engine/solverWorker.js`)
answer it, with progress. `Problem.deadline` (and `withBudget` across the worker) throws `OverBudget` past a time
budget. Because a slow call makes a move run twice, **a game move must ask the solver before it changes anything**
(or change only what it would change the same way again).

## Validation

`npm run validate` (`scripts/validate-case.js`) checks the JSON Schema on the files as written, then: unique ids and
resolving references; every quote found; every window has a `reveal`; mentions, notes, traits, names and labels
dated in story order and never before the card appears; glosses never before their term; no clue gives an event a
time the story has not reached; rules attached to at least one card; relation tuples, propositions, schema
variables (none ranging over nothing), traits carried by some card; tracks (ids, places, aims, one window per line,
every answer stated or derived); parts of statements; absences; `seq`; slot answers in their domains; the true
solution satisfies every constraint (a defeated application's exception must hold instead) and extends to every
open slot; **uniqueness**: with all the evidence (derived claims excluded) every determined slot has exactly its
answer left and every open one really is open (a relation slot left open needs only a second value; order slots
are reported, never failed); derived claims and Holmes's steps follow from their premises; theories fit their
holders and fail on the full set; puzzles, readings and checks resolve and hold in the answer key; every inference
verified or asserted with a reason; disclosure; and the actions are playable in order. It writes
`cases/silver-blaze/report.md`: counts, the case questions by reader at the challenge, what the story holds back,
background by reader, theories, puzzles, checks, inferences, exceptions, cards quoted later than they appear,
derived claims, states, orders within a window, absences, every slot's status, the fabula, the investigation and
the text's inconsistencies.

`npm run validate-thoughts` runs the thoughts checker (above) with the dates and the Markdown mirror, and writes
`cases/silver-blaze/thoughts-report.md`: coverage, the notes the autoplay types, cards dealt later than the reader
has them, notable details, questions posed, exceptions raised, checks planned, the short chains with their dates,
and background cards with no rule.

The LLM leak checker (`checker/check.js`) checks each card text, exception (`--exceptions`) and typed note
(`--notes`) against the story so far where it first shows.

## Generated files

| File | Made by | From |
|---|---|---|
| `report.md` | `npm run validate` | the case |
| `thoughts-report.md` | `npm run validate-thoughts` | the case, `thoughts.json`, `docs/reading-annotated.md` |
| `action-table.json` | `npm run action-table` | the annotated reader's moves made on Hard at each thought's paragraph, logged as engine calls and as the page makes them; the autoplay's script; must reach the Hard maximum |
| `action-table-minimal.json` | `npm run minimal-table` | the fewest of the table's moves that still reach the maximum, each as late as its deadlines allow, batched at as few stops as possible |
| `hints.json` | `npm run hints` | the minimal playthrough's moves with what each needs, and every scoring row with the moves that make it |
| `stats.md` | `npm run stats` | content counts, both playthroughs by kind and by scene, the hint-only player |
| `depgraph-max.json`, `depgraph-waits.json`, `depgraph-deductions.json` | `npm run depgraph` | the moves between the story's stretches as Archipelago-CC DepGraphs: the maximum, the story read at the 'wait' pace, every deduction by its deadline |

After a change to the case or to `thoughts.json`, regenerate in this order: `validate` and `validate-thoughts`,
then `action-table`, `minimal-table`, `hints`, `stats`, `depgraph`. Tests check that each is up to date. Never edit
a generated file by hand.
