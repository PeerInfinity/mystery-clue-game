# Case format and engine reference

> **The earlier game's copy.** This page was copied here on 2026-11-06, when `v1/` got its own copy of everything
> the earlier game uses. Paths in it are relative to `v1/` (`cases/silver-blaze/` is `v1/cases/silver-blaze/`), and
> its commands run from `v1/` (`cd v1 && node scripts/…`; `npm test` from the root runs its tests too; the root's
> `npm run v1:validate`, `v1:validate-thoughts`, `v1:reveal-log`, `v1:foreshadow-log`, `v1:clash-log`). What it
> says of Watson's timeline is out of date: see `docs/technical.md` and `docs/case-format.md` at the root.

**Spoilers:** this page gives away the solution of "Silver Blaze".

The case format (version 0.3) as it stands, and the engine behaviour it drives. The case lives in
`cases/silver-blaze/`; the JSON Schema is `schema/case.schema.json`; the engine is `engine/` and the validator
`scripts/validate-case.js`. Commands, the source layout and the tests are in `docs/technical.md`; the annotated
reading the thoughts mirror is `docs/reading-annotated.md`.

**Which page each section is for.** The main page, Watson's timeline (`index.html`), reads "The world model as data
(`world/`)" and its subsections, plus the story (`story.txt`) and `mentions.json` for the story's links and cards.
Everything else here (the model of cards and slots, the other case files, formulas, slots, Holmes's steps and the
paces, and every section from "The world model" (tracks) to the end) describes the earlier game, kept at `v1/`.

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
  `doubt`), `concludes` (below), `notices` (the notable detail's cards; NOTICE only; it scores through its leads), `raises`
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

### The 'incremental' pace

Incremental mode (an experiment: `docs/ideas.md`, section 2) is Hard whatever the options say (the reader option is
kept), and reads at its own pace, `INCREMENTAL`, which waits on **`incremental.json`** (`engine/incremental.js`, from
`hints.json`) instead of the gates. Each wait is before a paragraph:

- `{para, row}`: a row that scores on Hard (`thought|family`, as `hints.json`'s rows), at its deadline, until the
  player has made it (`madeRows`, as the score functions count it);
- `{para, keep: {inferences}, rows}`: a move a later row needs is lost there (`hints.json`'s `lost`: the story states
  the inference it builds, or an implicit inference it gives a premise of), until the player holds the inference (by
  any route), or every row in `rows` is made.

A wait names the row or the inference, never the move or the cards. `advance` refuses a paragraph with a wait not
met, returning the open waits (`blockers`). The maximum is therefore mandatory. Without the keeps, a player who
moves only when the story waits is stuck at ¶146 with 23 rows made; with them, it reaches 70
(`engine/incremental.test.js`, `playLazy`). The page offers it as a pace (Settings), with the Search tab
(`ui/search.js`).

Leads investigated and sealed checks, which the game otherwise never checks, return `lifts`: how many of the rows the story
waits on now the move made. It tells nothing about a row that is not yet due.

**Part of a move.** As `propose` says whether a set of cards is "onto something", incremental mode answers for part of
the moves whose spaces are products, over the moves that would make a row not yet made, whose cards are all in hand
and whose time has not passed: `absenceOnto({expectation, time, witness})` (any of them), `sealOnto(verb, fields, {slot})`
(the verb and any of its fields; only checks Holmes has yet to make that a dated row still waits for; with `slot`,
whether such a row expects an answer to that question, which must be shown) and
`dropOnto(target)` (a hypothesis shown to the player that the record counts dropping). Never the part that guesses at
the story (a check's expected result and the value of its answer, a drop's reason): those are tried whole, with `lifts` or `dropCheck`.
All three are false outside incremental mode.

## The world model as data (`world/`)

The chosen direction (`docs/ideas.md` §2, "Watson fills in the world model"), Watson's timeline, the main page. It
covers the whole story in `cases/silver-blaze/world/`, shaped first on ¶1–46. `engine/world.js` reads it (provenance,
the time order, assertions and contradictions, below) and `engine/actions.js` the typed states and actions; the page
is `index.html` (`ui/world.js`). `npm run validate-world` checks it and prints its counts. Every file has one object per line.

- **`entities.json`**: entities the old `entities.json` lacks (the kitchen, the train, the Wessex Cup, the two
  unnamed lads, the searchers…), plus three state entities: `calendar` (weekday), `clock` (hour) and `weather`. Ids
  share the old file's namespace, and `of` may name either. `moves` (a list beside `entities`) names the vehicles
  (the carriage, the landau, the Pullman car, the two trains); a place in it moves, and a thing that is not a place moves
  too (a purse, a person). The grid gives a vehicle a column of its own while its own place is not known.
- **Groups.** A group (`kind: group`) is an entity like any other; who is in it is the `member_of` attribute of each
  member, with its own time, so membership changes like any attribute (the two lads join `searchers` at the stable
  on Tuesday morning and leave it at the finding). A fact on a group holds for every member at that time.
- **`times.json`**: time points `{id, label, day?, clock?, after?, para?, quote?, window?, note?}`. `after` (one id
  or a list) gives a partial order. `day` and `clock` are labels only: the weekday and the hour are facts on
  `calendar` and `clock`, each with its quote. `window` names the old game's nearest window.
- **`facts.json`**: one fact each, `{id, of, attr, value, detail?, neg?, to?, time, para, quote, basis?, from?,
  inferable_at?, truth?, q?, pick?, asserts?, modal?, claim?, word?, old?, how?, partial?, given_at?, given_quote?,
  strength?, note?}`.
  - `attr` is one of `location` (where it is at that time), `lives_at` (where it lives or is kept), `member_of`,
    `carrying`, `wearing`, `action`, `says`, `observes`, `knows`, `believes`,
    `intends`, `condition`, `contents`, `role`, `reputed`, `rule`, `position`, `owner`, `identity`, `name`, `weekday`,
    `hour`, `speed`, `time` or `tells`.
  - `value` is an entity id where there is one, otherwise short text. A `location` is always a place or thing id (or
    null when unknown), with the rest in `detail` ("at the bottom", "walking slowly with Holmes"), so that places can
    be compared; `neg: true` denies it ("not at King's Pyland", the stall empty). `observes` takes fact ids: an observation is
    an event, and the root of a provenance chain.
  - `time` is `{at}`, `{from, to}` (an open end means until further notice) or `{after, before}` (somewhere
    between two points).
  - `basis` is `stated` (the default), `implied` (the text presupposes it) or `inferable` (`from` the facts it
    follows from, at `inferable_at`).
  - **Two dates.** `given_at` is where the story states the fact. It defaults to `para`; it is earlier, with a
    `given_quote`, when an earlier line already says it (Straker's death at ¶4, "the tragic murder of its trainer",
    told in full at ¶35); for an inferable fact it is where it is stated, if ever (past ¶46 too: the opium added
    after the dish was set apart, ¶218), and absent when nothing yet states it. `inferable_at` is the earliest
    paragraph the fact follows from what came before (`from`), each premise dated by its own earliest date. It
    appears on a stated fact only when it is earlier than `given_at` (the lads back in the loft: ¶32 from "his
    fellow-grooms had returned" and the night rule, stated at ¶34). `strength: likely` marks what a careful reader
    would hold but does not strictly follow (the stranger is Simpson at ¶39, from the arrest of the man suspicion
    rested on). Both dates will be revisited once the rest of the story is in.
  - `truth` comes from the answer key: `true` (the default), `false` or `null` (never settled).
  - **Claims.** A `says` or `believes` fact records that it was said, or held (true: the saying happened). What it
    asserts is in `asserts`, a list of picks `{q, pick, neg?}` (a question's possibility, or with `neg` its denial:
    the police's "nothing connects Silas Brown" denies Mapleton) or states `{of, attr, value, time?, neg?, truth?}`.
    One claim may assert several (the police theory: who drugged, opened the door, led the horse out, struck the
    blow, with what). Each assertion is true or false by the answer key. On a `believes` fact, `truth` is the truth
    of what it holds (false exactly when something it asserts is false; the validator checks). `modal: possible`
    marks a claim of what may or could be (the stick could have made the wounds; the horse may be in a pit): shown,
    but it contradicts nothing. A `q` with no `pick` on a claim only says which question it bears on.
  - **A claim's content as a fact.** A fact that is what a claim says is tied to it by `claim` (the fact id: Brown is
    an old horse-faker, from Holmes's words); a fact that is what someone said in Watson's hearing, with no speech
    fact of its own, by `word` (the speaker: Gregory reading out the papers in Straker's pockets). Such a fact is in
    no account: it reaches Watson through the speaker, so it is never Watson's own observation.
  - A `tells` fact passes accounts (`value`, account ids) to `to`, `how` (told, statement, sworn statement,
    report, newspaper, telegram, analysis, letter). `partial`: the story says only part of the account was passed
    (Watson's papers held "most of the facts", ¶42). A telling the story never settles has `truth: null` and the
    question of what else it could have been; an unknown sender is `of: "?"`, with its question.
  - `old` names the old game's claims and events the fact comes from.
- **`accounts.json`**: what one source tells, as a bundle of facts `{id, label, origin, how, facts?, parts?}`, so
  that one telling passes many details: Edith's account, Hunter's, Mrs. Straker's, the searchers', the police
  findings, Simpson's statement, the answer to Holmes's wire, Holmes's own part, what Watson sees himself. `origin`
  is who first had it (null when not said), `how` how (saw, did, said, examination, analysis, inference, own,
  report). A `bundle` is made of `parts` (everything the police hold; what the papers print; Holmes's account in
  the train). A fact may be in several accounts: the talk at the window is in both Edith's and Hunter's.
- **Provenance is derived, not written on facts.** `scripts/world-provenance.js` follows the tellings that carry an
  account (or a bundle containing it) from its origin to Watson, and gives each fact its chains, for example
  `edith_baxter sworn statement→ police ?report→ newspapers ?newspaper→ holmes told→ watson`, with `?` on uncertain
  links. A claim's content (by `claim`, or a claim's `asserts`) has the claim's chains with one link more at the
  head, the claimant's word: `straker said→ mrs_straker statement→ police …`; a `word` fact the one link
  `gregory said→ watson`. It also gives who holds each account from when. Every told fact must be in an account that reaches Watson;
  the facts in none are the reader's own inferences.
- **`questions.json`**: an uncertain entry `{id, label, entry, raised, quote, possibilities, answer, kind?, latent?,
  settled?, old?, note?}`. `label` is the question as the player reads it ("Who drugged Hunter's supper?"), shown only
  once the story raises the question or gives its answer, so that a latent one (Straker's honesty) is not flagged early. `kind: provenance` marks a question about how something was passed on (who answered
  Holmes's wire; whether the papers had the night from the police or from the witnesses). It is kept in the data
  and off the player's list unless the story itself raises it.
  - `entry` is `{of, attr, time}`, with `of: "?"` for a question about who.
  - `raised` is the paragraph where the story opens the question (null while it never doubts the entry: `latent`).
  - Each possibility is `{value, how?, available, via, from?, quote?, out?, by?}`. An answer is listed to the
    player only from its `available` paragraph, the point where the story makes it a possibility. `via: direct`
    means the story names it; `via: indirect` means it follows from what has been told, or from a careful reader's
    thought (`from` a fact, or `thought t<id>`, told no later). A `quote` in the `available` paragraph serves where
    the facts so far do not reach (answers opened after ¶46). `out`/`by` give the paragraph and the fact that rule
    it out.
  - Every question has exactly one `something else` (`via: always`), available from the paragraph it is raised.
  - `answer` is always one of the possibilities (null where the story never settles it), even when it is
    available only late: what Straker meant at one in the morning is available indirectly at ¶46 and named at ¶57.
  - `also_right`: other possibilities just as true as `answer` (`q.why_out`: the light as well as the noise;
    `q.motive`: laying against his own horse as well as the debts). They are judged right at the give-away, a
    claim or circle of one is true, and they do not contradict the answer or each other (`isRight`, `compatible` in
    `engine/world.js`). Where several answers are valid, the game accepts any of them (the user's ruling).
  - The answer's two dates: `answer_given_at` and `answer_given_quote`, where the story gives it away (often in
    Holmes's explanation, ¶212–229), and `answer_inferable_at`, the earliest paragraph a reader can reach it, with
    `answer_from` (a fact, or the careful reader's thought from the audit in `docs/reading-annotated.md`) and
    `answer_strength: likely`; null when only the give-away brings it (how the cravat came into Straker's hand).

A fact's `from`, like an answer's, may cite a careful reader's thought (`thought t<id>`) from the reading audit:
most of what Holmes's explanation gives away (¶212–229) is reachable much earlier that way (Straker took the horse
out: ¶46 → ¶220).

### Assertions and contradictions (`engine/world.js`)

`assertions(data)` lists everything the data asserts: each fact (a `state`), the `pick` of a fact that is not a
claim, and each item of a claim's `asserts`, with its truth by the answer key and the paragraph that tells it.
`contradictions(data, accepted)` finds the pairs among accepted assertions that cannot both hold, with no
contradiction written by hand:

- **Picks** of one question: two different possibilities, or one possibility asserted and denied. A question's
  possibilities exclude each other, so Hunter's belief that the stranger drugged him contradicts the explanation's
  "why should he drug his own stable-boy?".
- **States** of a single-valued attribute (`location`, `identity`) of one entity at times both certainly cover:
  two places neither within the other, a place and its denial (of it or of a place containing it), two identities.
  A thing that moves is placed through its own location at that time where that is certain (Watson in the carriage,
  the carriage in the train); otherwise it is not compared.
- **Time.** `{at}` covers its point; `{from, to}` from `from` up to, not including, `to`; an open end only its start
  (a state lasts until the next change, and a later different value is a change, not a contradiction); `{after,
  before}` nothing certain. Only the partial order of `after` decides "certainly": unordered points never overlap.
  So a move needs its own time point (the horse near Mapleton at dawn, led into Mapleton after: `t.tue_into_mapleton`).
- Claims with `modal: possible` take no part.

**The player's marks** (`markAssertions`). Each possibility of a question is uncertain (unmarked), circled or crossed
out; several may be circled. A circle asserts the possibility and a crossing denies it, as picks with `mark` set and
no fact, so they meet the claims' picks in the contradictions above; two circles of one question are an open choice
and are not reported. Each mark comes on its own link from *Watson's hypothesis* (`hypothesisChain`, keyed
`hyp:<question>=<possibility>`), which starts uncertain like any other link; Watson's hypothesis is a person of its
own, so one cap covers every mark. Only marks on questions raised so far and on possibilities available so far count.
A "who" question (one with a person or an animal among its possibilities) may also be answered by any person or
animal, a "where" question (a place among them) by any place, its own subject excepted (`answerKinds`, `isOption`);
the page offers those met so far (named by a fact given so far). The page shows first only what someone in the story
puts forward (`via: direct`) and "something else"; the rest (`via: indirect`, and the people, animals or places, an
indirect possibility among them in its place) sit behind a "More" button, so that no list points at the answer.

**Typed states and actions** (`engine/actions.js`). A typed state is an attribute whose values exclude each other
(`STATES`; for now `door`: `open`, `shut`, `locked`): two of them at a time both certainly cover contradict, like two
identities. A fact is a typed action when it has `act` (an action type of the generic table `ACTIONS`: `lock`,
`unlock`, `open`, `close`, `go_through`) and `thing` (what it acts on); its agent is its `of`. The table gives each
type its requirements just before (a state of the thing, `carrying: 'key'`, a key to the thing, or `at`: the agent at
the thing, on one of a door's two sides) and its effects just after (a state of the thing, or `through`: the agent on
the other side of the door from where it was). A door's sides are in `world/entities.json` `joins` (`{door: [inside,
outside]}`; a place within the inside counts as inside, only the outside itself as outside). Where a thing is at a
time (`placeAt`): a location covering it, or the latest one with no end (a place lasts until something moves it).
Only the actions that matter are typed (Hunter going out through the stable door and locking it, Straker's
unlocking and opening it at ¶220, the stranger's asking Hunter for the tip); the validator checks `act`, the roles,
a typed state's value, plans and goals. The rules name their subjects by role: `agent` (the fact's `of`), `thing`,
`to`, `item`, `about`, `via` (the action table: lock, unlock, open, close, go_through, lead_out, give, ask, drug,
strike, hide). Two names of one person count as one once an identity is on the timeline or circled (the stranger
and Simpson); an animal is where it lives unless something moves it; over a night, a place seen only at a point
before it does not count.

**Intentions.** An intention is a goal, a state in the world model's shape (`goal: {of, attr, value}`), and a plan,
typed steps whose effects feed the next step's needs. A fact may carry a goal (the stranger wants the boy to have
the paper); a question's possibilities may (the stranger's aims: to know the tip, to know the way, Hunter drugged,
the horse in his hands), so a circled aim is an intention of the player's hypothesis; a claim may carry a plan
(`plan: {agent, goal, steps}`, each step a typed action with its own time: the police theory is Simpson's). A question's entry may carry `act` and `thing` too, so a
change the player points out can be recognised as its entry (who opened the stable door). Persistence
(`holdsBefore`): a state lasts until something specific changes it; events the story never tells are not invented.
The player's moves, each checked by these rules, give entries with the source *Watson's reasoning*, as trusted as
their weakest premise (and no more than the player's cap on Watson's reasoning):
- (a) `pointChange`: two states of one thing on the timeline differ, so something changed it between them: an action
  by "?" (the shortest run of action types, `changePath`: locked to open is unlocking and opening), in the window
  between. Refused when nothing differs, the order is not certain, or a state or a change of the thing lies between.
- (b) `pointImplications`: an action's requirements (time `{to}` the action: holding up to it) and effects (`{from}`
  it); a change from (a) gives only its other needs (the key), its states being its premises. Each requirement is
  shown met, against (persistence gives another value) or with nothing on the timeline saying so
  (`requirementStatus`).
- (c) `checkFit`, "what is this for?": an action or an intention serves an intention if something it brings about
  (`productsOf`: an action's effects; an intention's goal, and what that goal brings with it) meets the goal or a
  need of a step already linked to it, so a plan is built one link at a time from the goal back. An effect that
  holds only for some kinds of an item fits on that condition ("if the paper is money or a message"); the kinds
  still open are those of the item's contents question (`kind` on its possibilities) that the player has not
  crossed out, or the circled ones. A link is an entry `{attr: 'purpose', for, serves}` from Watson's reasoning, and
  disappears when it no longer fits (the paper circled as a drug). `reasonedEntries` lists such moves in
  `ctx.lapsed` with why (`ruledOut`: the item's kinds that would make it fit; `gone`: a premise no longer there) and
  the moves that hold in `ctx.held`; the page announces a move that held and no longer does.
- (d) `checkPlan`, "what would this need?": a plan's steps in order, each need met by an earlier step's effect, by
  the timeline, or by nothing (`open`), and whether the steps reach the goal. On a claim's plan (the police theory)
  or on the steps the player has linked to an intention.
- "Does this plan account for this?" (`accountsFor`): as (c), with a plan's own steps as the steps linked to its
  goal: an action or intention outside the plan accounts for nothing unless it brings about the goal or a need of a
  step (the paper, on the police theory).
- "Compare with another plan" (`comparePlans`): two plans of one agent (the police theory and Holmes's supposition
  that Simpson could have injured the horse in the stable, `f.h_injure_there`): each goal and whether it is
  reached, the steps in one and not the other, the needs nothing meets in one and not the other. A plan the story
  proposes, even as a supposition, is data (a claim with a `plan` and no `asserts`).
- Straker's plan: an aim's possibility may carry `step`, the last step it implies (`{act: 'injure', thing:
  'silver_blaze'}`), an intended action of the aim's agent that links can be made to (`impliedSteps`); a plan's
  intended step does not reach its goal (`checkPlan` says `'intended'`). A reason's possibility may carry `need`
  (`{act, rule}`): circled, the rule is added to that action type's needs as the player's hypothesis
  (`ctx.extraNeeds`; `q.why_out`'s noise and light answers add `{of: '$thing', away: 'stable'}` to `injure`). A need
  `away` is met by a place not within that place. A circled who-answer to a question whose entry is a typed action
  (`q.horse_out_by` is `lead_out` of the horse through the stable door) is that one doing it, an action of the
  hypothesis. A rule naming a role the action lacks is left out (injuring with no door named needs no door). A
  `need` may be a list (the light answer: a light, and away from the stable); the knife's "for delicate work" adds
  carrying the knife, the match's "to light the candle" a light (`take`, `strike_light`). A why-question may carry
  `presupposes`, a typed action of its entry's entity (`q.why_light`: Straker striking a light): with any of its
  answers circled, that action is the player's hypothesis (`pre:<question>`), linkable like any other. A possibility
  may carry `action`, the answer as an action of an entity (`q.thigh_cut`'s "Straker's own knife": `cut_self`), a
  hypothesis when circled. "What stopped it?" (`stops`): an action stops an intended step if one of its effects leaves
  the step's agent unable to act (`DISABLED`: struck down, dead, drugged) no later than the step's window ends.
- The night at the stable (the logic audit's step 2). "Who drugged Hunter's supper?" has a typed entry (`drug`, to
  Hunter, the opium, between nine and the lads' return), so a circled answer is a drugging of the hypothesis. A
  guard: a fact with `guards: <place>` (Hunter on watch that night guards the stable, ¶20) makes leading the horse
  out, or injuring it there, need that guard *unable to act* (`DISABLED`: drugged, struck down) unless the guard is the
  agent (`{guard: '$via'}` in the action table, one need per guard on watch). So "What is this for?" links a drugging
  to the plan that leads the horse out (the reader's "he was drugged so the horse could be taken", t37.16, with no rule
  written for it), and the police theory's drugging meets the same need. One culprit: an action serves only its own
  agent's intention (`checkFit`, as the page's own offer already was); an accomplice's drugging still meets the need
  on the timeline (the story's open exception, ¶218). The dog comes in from the player's circle: "did not bark" on
  "Did the dog bark in the night?" adds to leading out the need that the dog knew the agent (`{of, knows: '$agent',
  among: '$via'}`), met when the agent lives at the place the door opens onto (King's Pyland: Straker's villa, the
  lads' loft; not Simpson's villa on the moor). Likely clashes for the rest: barking unheard (the loft is over the
  harness-room), the drug put in at the window (the stranger could not know the dish) or on the path (the maid ran
  from him), exercise against Straker's own drugging.
- Who held a key (the audit's step 3): "Who had a key to the stable door?" (`q.key_holder`, raised by Holmes's
  "Has a duplicate key been found in his possession?", ¶57) has a typed entry, `keep_key` (its effect: carrying a key
  to the door), so a circled holder is a hypothesis action whose effect meets the key need of unlocking: on "Who
  opened the stable door?" (its entry now unlocking and opening, as the police plan and ¶220 have it), and as a step
  of a plan, linked by "What is this for?" through the unlocking. Straker is the key's answer, Hunter also right (he
  locked the door, ¶31). A plan's steps at the same time are ordered by what they need (`orderSteps`: unlocking and
  opening before leading the horse through the door).
- Presence and the instrument (the audit's step 4). A strike needs its striker at the place of the deed (`where` on
  the action: "Who struck the blow?" names the hollow), so a circled horse is met (in the hollow at the time, ¶37) and
  a circled Simpson has "nothing on the timeline says so". A possibility may carry `implies` (`{q, pick}`): circled,
  it asserts that answer of the other question too, as a mark of its own (`mark: 'implied'`, `from` the circle),
  with the circle's trust: the hoof implies the horse struck, the stick Simpson, so a weapon circled against another
  striker meets an ordinary contradiction.
- Goals serving goals (the audit's step 6, the motive; the user's go-ahead for "the goal and its motive as a move,
  only if the logic needs it"). "What is this for?" is offered on a circled aim too, so an aim can serve a motive: an
  intention serves another when what its goal brings with it meets the other's goal or a need of its implied step.
  `GOAL_RAMIFIES` says what a goal's state brings: a horse injured loses the race. "What drove Straker to it?" has
  goals on its answers: laying against his own horse wants the horse to lose; the debts want Straker in funds, through
  an implied step, laying against his horse (`lay_against`: needs the horse to lose, leaves him in funds). A
  possibility may carry `rests_on`, states it takes for granted, shown with what the timeline says ("What it rests
  on": the debts rest on Straker owing an account, met by the milliner's account to William Derbyshire once Derbyshire
  is circled as Straker, and not when he is circled as a friend).
- Tracks (the audit's step 5; the user chose reading tracks by themselves, a change of heading as a change of aim, and
  hiding needing someone in charge, with likely clashes for the rest). A fact with `read_from_track: true` is what a
  track Watson sees himself shows (the horse in the long hollow, ¶117; near Mapleton with a man beside him, ¶119; the
  turn, ¶122; both at the Mapleton gates, ¶124): it is in Watson's own account and told where he sees the track, with
  no move. `heading` (an open state, `OPEN_STATES`: any place) is where someone is making for; move (a) on two headings
  of one walker gives his own change of aim between them (`aimChange`), not an action by "?". `hide` needs its agent in
  charge at the place where it is done (`{charge: '$where'}`, met by a role with `charge`: Silas Brown manages
  Mapleton, ¶19), and a hiding-place to know only when no place is named (`unless: '$where'`). "What did the man with
  the horse mean to do?" has its two answers as aims with the hiding as their last step; leading him home first rests
  on the heading for King's Pyland. Likely clashes: the pit, far away or a secret place against the tracks to the
  Mapleton gates; hiding from the start against the turn toward King's Pyland; the groom against "no groom would dare".
  An aim with an implied last step shows its plan before anything is linked to it.
- Two loose ends tied (2026-11-05). A question with `end: true` (the motive) is what the rest is for: its circled
  answers serve nothing further, so "What is this for?" is not offered on them (it was offered toward the aim, the
  wrong way round). Straker at the stable after one is the content of his own word at ¶32 (`f.straker_to_stables`,
  "he intended to walk down to the stables"), reaching Watson through Mrs Straker's account; being at a door over a
  `{from, to}` window, like an `{after, before}` one, is met by a place reached inside it. His plan's one unmet need
  is now the opium, which the story never accounts for (¶218 leaves it open).
- The true path (`world/path.json`): the moves a careful reader makes on Watson's timeline, in order, each at the
  paragraph `at` where the page first allows it, to the end of the story: `circle` and `cross` (a wrong answer is
  tried, its clash seen with `see`, then crossed out), `trust` (a `link` or `person` set to `level` on the detail of
  `on`; the path distrusts only false statements, by their statement link), `a`, `b`, `c` (the moves), `plan` (open
  "What would this need?"), `stop`, `compare`, `account` (a check `key` on an open plan) and `hold` (a likely clash set
  aside). `see`: a pattern the page must show after the move; `for_q`: the gated questions the move serves (so a
  just-in-time path can be derived); `why`: the reader's thought in plain words (the autoplay's caption; hints later);
  `late`: why a move comes after the first paragraph the page allows it (none at present); `hint_at`: the paragraph
  from which a hint may offer the move, when later than `at` (Mapleton, the reader's own reach at ¶40, is hinted only
  from ¶114, where the page supports it: the user's ruling).
  `scripts/path-check.mjs` plays it through the page: Read on to each move's paragraph (the gate met for real), each
  move's control offered and its result in the save, every answer given found right, and at the end no contradiction
  open and no likely clash unheld. It also fails a move found possible earlier than its `at` (unless `late`): before
  each paragraph it tries the next paragraph's reasoning moves (a–c taken and undone; a plan or a check counts once it
  shows its `see`), and it sets each circle of a right answer against the question's earliest paragraph in the data
  (raised, the possibility available, `answer_inferable_at`), and each wrong answer tried against its likely clash's
  `available`. Crossings and trust are judgement and not timed. A move found early is either the path being late
  (move it) or the page running ahead of the story (a leak to fix).
- Likely clashes (`world/strains.json`): pairs that can both hold but sit badly together, each side a fact or a
  question's possibility `{q, pick}`, with `why`, `available`, `from` (a thought, a fact, a question) and `key` (the
  question at whose give-away it is listed). In play a pair shows only when one side is a circle of the player's
  and both sides are on the timeline; all a question's pairs show at its give-away. A pair between two story facts would
  show only at the give-away, so where one side is a reading of a question it is written as that question's
  possibility (the police's repeated blows: the stick on `q.weapon`, against the single blow). The validator checks the sides,
  that `available` is no earlier than both, and the key.
- Who made a change from (a) is the player's hypothesis: the story's question when the change is its entry, otherwise
  a question of the player's own ("Who was unlocking and opening the stable door?", `who: true`, so any person or
  animal met so far may answer it). For each one circled, the page shows what they would have needed (`agentNeeds`:
  at the door, a key) and what the timeline says of it.

**Trust** (`chainLevel`, `levelOf`). The levels, lowest first: *distrusted*, *uncertain*, *trusted*, *certain*. A
chain with no links is Watson's own and certain; every link starts uncertain, and the player may set it lower or
higher (never certain). A link is keyed by its telling, or for a speech by speaker and hearer (all of Holmes's words
to Watson are one link), or for a member by member and group (`linkKey`). Every chain that reaches Watson through
someone also starts with the **statement's own link** (`stmt:<id>`, the user's choice, 2026-11-05): a relayed fact's
own, what a claim asserts by the claim's, a fact of a claim's content (`claim`) by that fact's. Distrusting it takes off
that one statement and nothing else that came along the same links: the stranger's "lost" without his wish that the boy
gets the paper, Straker's "to see that all was well" without his walk to the stables, Gregory's theories without what
he found in Straker's pockets. A says or believes fact is itself an event (the speech, the belief) and has none: its
statement link is on what it asserts. The page draws it once, above the chains, as "This statement itself". A person's level, when set, caps every link
from that person. A chain is as strong as its weakest link, a fact as its best chain; a fact with no chain (the
reader's own inference) is not modelled and not shown. A telling is shown as an event: certain when it is to Watson,
uncertain otherwise. `resolvingLinks` gives the links and people whose distrust alone would take a fact below the
threshold (those every chain of it passes through): the page marks them when it traces a contradiction.

The validator requires the true story to be consistent (no contradiction among the assertions the answer key holds
true: every one it found was a data error) and prints the contradictions a reader who trusts every source meets, by
the paragraph that completes them: 41 for the whole story, the first at ¶28 (the stranger "lost" against his asking
for the straight tip), most at Holmes's explanation (¶212–229), since player inferences are not modelled.

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

**Important** (`markImportant(card)`, `unmarkImportant`, `isImportant`) is the player's own mark on a held card: it
lists the card first among theirs, the search tries it early, and marking a card of a puzzle meets the puzzle. Nothing
is checked, told or scored. It and *unimportant* (set aside) exclude each other. Until 2026-11-03 the mark was also
the scored notice; that job went to leads.

**Leads** (`leads.json`, section `leads`, one per line): lines of inquiry the game proposes. Each has `text` (plain
words, a question or a detail; never ahead of the story), `source` (its quotes: it is proposed once they are all
read), `needs` (cards that must be held; an inference among them makes the lead wait until it is built), `scores` (the NOTICE thought it scores for; null for a lead that scores
nothing), `check` (the case check Holmes makes on it, if any: the lead settles at the check's paragraph when that
comes before its own deadline, since from there the story shows him on it; the validator wants the lead proposed
before the check), `question` (the slot the lead bears on: the question its check answers, or the lead's own where
it has no check; the hints chain of docs/ideas.md, Investigation, runs lead → check → question; a check whose result
has an `answer` must answer this slot; recorded, not yet read by the game), and `answer` with `answer_source` (the story's answer, its quotes; shown on a settled lead once they are
read, *pending* until then; the validator wants them at or after Holmes's paragraph). A lead that scores nothing (a false
lead, or a true one Holmes never draws attention to) must have an answer after it is proposed: its deadline is the
answer's paragraph, where it settles and frees its place; it never scores and costs only the place while it is held. `leads()` lists those proposed, in the order they came, each `open`, `investigating` or `settled`; it never
says which score. `investigate(id)` puts a proposed lead under investigation, `stopInvestigating(id)` takes it off;
both are free, within a cap (`leadBudget()`, the option `leads`: 16 on Trivial and Easy, 12 on Medium, 8 on Hard; no
cap in incremental mode): at the cap `investigate` is refused (`full`) and nothing is dropped to make room. A lead
Holmes has taken up leaves its place. Before Holmes's first paragraph on its NOTICE thought (or his check on it, if earlier) is read, the lead is settled as it stands
(`leadsSettled`: under investigation then or not) and can no longer be changed. A NOTICE row scores if a lead for it
was under investigation at that point: the row's deadline is the earlier of Holmes's paragraph and the check of
any of its leads (`thoughts.json` keeps the paragraph where Holmes explains it). `npm run validate` checks the quotes and cards, that a lead is proposed before
its deadline, and that every NOTICE thought Holmes speaks to has a lead. Silver Blaze: the 8 scored NOTICE rows, one
lead each (two on the milliner's bill, its name and its sum), and 16 that score nothing: the paper offered the maid
(answered ¶58), the gypsies breaking camp (¶114), Simpson's bets (¶218), the wound (¶226, the horse's shoe), what the
stranger wanted (¶40), Straker going down at one (¶220), the cravat and the blood on the knife (¶226), why nobody has
seen the horse (¶146), the winner with no white (¶202), and six that give every check and case question a lead:
who else was in the hollow (ck.boots, ¶107), why the house felt no ill effect from the same dish (¶218), who the
stranger was (¶39), what Holmes said to Silas Brown (¶146), why Straker was unworthy of the Colonel's confidence
(¶229; it needs no card: Holmes's line raises it), and why Hunter is sure the stranger drugged him (¶218, false). Twenty-two name a question; the odds and the gypsies none. Eight have a check, one per case check, and settle there: the hollow (ck.boots, ¶107, not ¶226), the curry (ck.maid, ¶163, not ¶216), the coat (ck.coat, ¶94, not ¶226), the
candle (ck.mud, ¶102, not ¶224), the bill's name (ck.photograph, ¶161) and its sum (ck.dress, ¶89; both were ¶225),
the odds (ck.race, ¶197, after its own ¶189) and why nobody has seen the horse (ck.tracks, ¶116, not ¶146). Five are `false` (a red herring: the paper, the gypsies,
Simpson's bets, what the stranger wanted, Hunter's certainty); a settled lead says whether it was real (`real` in `leads()`), and shows
its answer whether or not it was investigated.

**Incremental mode:** `investigate(id)` ends with a `result`: `something` for a lead that goes somewhere (scored or
not), `nothing yet` for a false one (the user's ruling: what it says until the story settles it). The engine makes
the move at once; the minute is the page's (ui/search.js, Settings *Time per investigation*, 60 s), one
investigation at a time on a clock of its own beside the checks. The automation takes them in `leadOrder()`: those
the player put first (`putLeadFirst`, `unputLeadFirst`; saved as `leadFirst`), then the rest as they came; with
the category paused, only the player's. `Automation.startLead()` / `finishLead()` run the slot (`inquiry`); `step()`
without a page lets an investigation take `LEAD_CHECKS` (60) checks, or ends it at once when nothing is left to
check.

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
  its cards are held and its thought's paragraph read; otherwise once the player marks one of its cards important,
  investigates a lead that needs one, or files one that is an absence.
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

**Set aside** (`setAside(id)`, `putBack`; the page calls the mark *unimportant*): a held entity, event or claim set
aside as scenery. It stays held and counts as a premise; nothing checks it against the key; no score reads it. It takes
off the mark important (the two marks exclude each other).

**Notes on cards** (`setCardNote(id, text)`, `cardNote`, `allCardNotes`): the player's free words on a held card,
with the paragraph first written at; no words removes it. Never read by the game.

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
| `leads` | 16, 12, 8 (leads under investigation at a time; none in incremental mode) | 16 | 16 | 12 | 8 |

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
| `markImportant(card)`, `unmarkImportant` | the player's own mark (the page: important) |
| `investigate(lead)`, `stopInvestigating` | a lead under investigation (Leads) |
| `setCardNote(id, text)` | the player's note on a card; never read by the game |
| `pencilPlace`, `erasePlace`, `follow`, `unfollow`, `splitTime`, `unsplitTime`, `placeEvent`, `proveMark`, `ruleOutMark`, `proveOrder` | the board |
| `addTheory`, `drop`, `undrop` | theories and drops |
| `seal`, `unseal` | sealed checks |
| `setAside`, `putBack` | scenery (the page: unimportant) |
| `addNote`, `editNote`, `deleteNote` | the player's notes on the story: at a point of a read paragraph, optionally on marked words; never read by the game |
| `ask(card)` | background `ask` |
| `logHint` | the hints given; never read by a score |

Trivial refuses `applyRule` and `conclude`. Where a whole-hand check runs late in the story it can take
seconds; the page runs it in a worker (see The solver).

**The annotated reader's questions** (`QUESTION_TEMPLATES`, thirteen; a QUESTION thought's `asks`): fixed words
around one or two cards of named kinds (an entity kind, or `events`): who, where, when, why of an event; where is,
whose is, who really is, why would {person} do it; who had, who could get at, where was {thing} during {event}, how
did {thing} leave {place}, what could not be done at {place}. `askedText(template, cards)` gives the words. Until
2026-11-02 the player could pose them (matched quietly to a slot, joining it once the story raised it, its candidates
then becoming circles); the form went for a free note on the card, which is all it ever was to the score. The action
table writes the reader's question as that note (`cardNote` moves).

## Scoring and the record

Six families, each a row per thought with a **deadline**; a row scores when the player made the move by their own
reasoning before its deadline (the last paragraph read when the move was made is before the deadline). Nothing
scores in Trivial.

| Family | Rows | Made when | Deadline |
|---|---|---|---|
| deduction | Holmes's steps with an anchor | every inference the step needs is the player's own (built, concluded or applied, and trusted) or implicit, at least one their own; or their proven cross-out of its slot's value; or a trusted card of theirs covers its conclusion; or their proofs entail it (a clue's given value is not theirs) | the anchor |
| notice | NOTICE thoughts with `notices` | a lead for it is under investigation when Holmes's paragraph is read (the paragraph it was put under investigation is the move's) | Holmes's first paragraph |
| raise | thoughts with `raises` | the player first raises one of its exceptions against its target (a reservation or a defeat) | Holmes's first paragraph |
| drop | thoughts with `dropped` naming a theory or candidate | the player gives a reason that holds (`held`) | Holmes's first paragraph, else `dropped.deadline` |
| check | each of a thought's `checks` | a live, unhedged seal matching the check and its expectation; it must not be contradicted once the result is told | the check's `at` |
| absence | ABSENCE thoughts with a Holmes paragraph mapping a fileable absence | the player files it | Holmes's first paragraph |

A deduction is checked before each paragraph and on request after a player's move (`madeAt`, saved as `made`).
Inferences stated by a character, granted by the game or implicit do not count as the player's own. `possible` is
every row with a deadline; rows with none (Holmes never takes it up) are recorded and cannot score. Expert steps
score as bonuses. The annotated reader's game reaches 70 on Hard (45 of 47 deductions, every other family full:
8 notices (leads investigated), 3 raises, 3 drops, 10 checks, 1 absence), as `action-table.json` records.

**What does not count**: anything in Trivial; a drop whose reason did not hold (it scores only from where a
reason that holds was given); a hedged or withdrawn seal; a seal contradicted by the result; a move made at or
after its deadline; the marks important and unimportant, signals, notes (on the story or on cards) and hints.

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

`Game.save()` (version `SAVE_VERSION`, 9): `difficulty`, `options`, `pace`, `autoPace`, `read`, `collected` (Hard), `marks`
(listed, struck with their proofs, proven, circled), `theories`, `lastSeen`, `suspected`, `doubtKind`,
`doubtReason`, `split`, `asked`, `clashLog`, `built`, `applied`, `concluded`, `filed`, `important`, `investigating`,
`leadsSettled` (each with the incremental `result`), `leadFirst`, `drops`, `raised`,
`seals`, `setAside`, `cardNotes`, `notes`, `hints`, `made`, `board`, `openedSplits`, `opened`. `load` replays the
reading to `read` (re-asking and rebuilding at the paragraphs they were made), reopens splits and states before the
cards and marks that speak of them, and remakes the player's cards in order (fresh ids where a saved id is taken on
the same model). Saves are not kept across versions (there are no players yet): the page drops a save of another
version, with its search, and starts over; there is no migration code.

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
has them, notable details, the reader's questions, exceptions raised, checks planned, the short chains with their dates,
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
| `incremental.json` | `npm run incremental` | incremental mode's waits: each row's deadline, and each paragraph where a needed move is lost, from `hints.json` |
| `stats.md` | `npm run stats` | content counts, both playthroughs by kind and by scene, the hint-only player |
| `depgraph-max.json`, `depgraph-waits.json`, `depgraph-deductions.json` | `npm run depgraph` | the moves between the story's stretches as Archipelago-CC DepGraphs: the maximum, the story read at the 'wait' pace, every deduction by its deadline |

After a change to the case or to `thoughts.json`, regenerate in this order: `validate` and `validate-thoughts`,
then `action-table`, `minimal-table`, `hints`, `incremental`, `stats`, `depgraph`. Tests check that each is up to date. Never edit
a generated file by hand.
