# Mystery clue game — design proposal (draft 1, 2026-10-13)

Status: PROPOSAL, awaiting the user's answers on the open questions at the bottom. Nothing is implemented.
Story: "Silver Blaze" only, fully fleshed out before a second story. The v0.1 extraction is kept in
`reference/v0.1/`. Code: this repository (`~/CC/mystery-clue-game`; private GitHub repo `PeerInfinity/mystery-clue-game` since 2026-10-13).

## The user's requirements (2026-10-13, in their words, condensed)

1. Nodes for **everything** in the story: every character, event, location, object — chain or not.
2. The interface reports whether nodes **could plausibly fit together**, not whether a link is in the real solution.
3. Play like **jigsaw × sudoku**: rule out what doesn't fit until one solution is left. The player can list several
   **possible connections per node** (pencil marks). Easy mode: the game lists every option; the player only eliminates.
4. A node shows **everything the player knows about it so far**, including period knowledge the original readers had
   and modern readers may not (racing terms, money, Victorian household, medicine, Dartmoor).
5. Nodes **as granular as possible**.
6. Knowledge on cards; some of it maybe its own nodes/edges — try and see.
7. **Every valid route** accepted.
8. False hypotheses: a set of nodes that seem to fit together but don't fit the rest — **building it is gameplay**.
9. Track **each time axis separately**.

## Proposal

### A. Data: case format v0.2

- **Cards for every entity** (person, animal, place, object, document, group) and **every fabula event**, not only
  the 100 clue nodes. Today's 62 entities / 46 events grow to a full inventory (every named or described thing,
  every action anyone takes on or off stage).
- **Atomic claims.** One proposition per node: "the stable door was locked", "Hunter was inside", "Edith saw a
  man at the window", "the man wore a red-and-black cravat"... A testimony becomes *who said it, when* + the claims
  it asserts; reliability is a property of the telling, not of the claim.
- **Facets on cards** — the "what you know" view. Each card lists facts the player has unlocked about it (each
  facet is a claim node, so the card view is a query, not duplicated text), plus **period notes** (a glossary layer:
  *tout, laying against a horse, the Wessex Cup, stable lad, curried mutton, cataract knife, milliner, guinea,
  field glass, a "plate", King's Pyland as a training stable...*). A period note is shown as context; when the
  reasoning needs it as a premise it is also a **rule** node (opium can be tasted → rule card).
- **Slots (the jigsaw tabs).** A node's kind decides what open questions it has:
  - event: *who did it, where, when, with what, why (cause), what followed*;
  - object found: *whose, how it got there (event)*;
  - claim / testimony: *which event it is about; true or false*;
  - person: *where at time T* (a whereabouts row per key time window);
  - the case questions (who drugged the curry, who took the horse...) are slots too.
  Each slot has a typed domain (persons, events, places, a time range...). The tab shapes are the edge-type rules.
- **Constraints instead of a fixed answer graph.** Each authored constraint says which slot values it excludes (or
  how two slots must relate) and lists its **premises** (the claim/rule nodes it rests on). Example: "the drugger was
  in the kitchen between 9.00 and 9.10" ← [Edith carried the dish from the kitchen at 9; opium can be tasted; curry
  hides it]. Several constraints may exclude the same value — that is how **all valid routes** are accepted.
  Existing v0.1 inferences convert into constraints; their conclusions stay as derived claims.
- **Three time axes stay separate:** fabula (`when` on events/claims, itself sometimes a slot to solve),
  investigation (Holmes's actions; for the game, the player's own discovery log), disclosure (scene).

### B. Engine (pure JS, unit-tested, no UI)

- Load a case; maintain the player's state: unlocked nodes, pencil marks per slot, eliminations, theories.
- **Plausibility** of "X fits slot S": always the shape check (type/domain, time ranges overlap, place reachable);
  the deeper check uses only constraints whose premises the **player has unlocked** — never hidden facts, never
  the answer.
- **Justified elimination** (the MetaMath part): the player strikes X from S citing nodes; the engine accepts if the
  cited set contains the premises of any constraint that excludes X. Uncited strikes allowed as pencil-only.
- **Theories** (sudoku "what if" branches): a named set of slot assignments. The engine reports which unlocked
  constraints a theory violates. The police theory = consistent with the scene-1–4 clues, broken once the curry /
  dog / knife / bill clues are placed. Building it is play; breaking it is play.
- **Validator, not engine:** with every node unlocked, every case slot has exactly one surviving value
  (uniqueness, like a well-formed sudoku); with the police's clues only, the Simpson theory survives.

### C. UI (first version)

- Board of cards (jigsaw), card detail panel (facets, period notes, all three times), slot editor with pencil marks,
  a timeline view per axis, a theory switcher. Clue collection v1 = reveal by scene (or by Holmes's actions); the
  text-adventure phase replaces this later.

### Slices

1. Data v0.2 + schema + validator with the uniqueness check. **Done 2026-10-13.**
2. Engine + tests. **Done 2026-10-13** (node's built-in test runner, no vitest).
3. UI. **First prototype done 2026-10-13**; collection v1 = Holmes's own actions (actions.json).

## Rulings (user, 2026-10-13)

- **Plausibility depth = a difficulty setting.** Easy: shape + the player's unlocked facts, candidates auto-listed.
  Hard: shape only; ruling out by facts is the player's job (checked when they cite reasons).
- **Eliminations: reasons optional.** Plain cross-outs are pencil marks; a cross-out with cited clues + rule is
  checked MetaMath-style and marked proven.
- **Location: standalone page**, pure-JS engine with tests; wrap as an Archipelago substrate/panel later.
  Revised the same day: **a new repository, local for now** (`~/CC/mystery-clue-game`), not a branch of
  Archipelago-CC.
- **Publishing: local commits only**; no remote until the user says so.

## Model refinement (slice 1, my choices — revisable, report back to the user)

- The fabula is a set of **facets** (event.agent, event.place, event.time, object.owner, person whereabouts at a
  time window...). Each facet is a **slot**. The solution is one assignment of every slot.
- An atomic **claim** mostly asserts a facet value. Claims from observation/physical evidence are givens;
  claims from testimony get a **truth slot** of their own (`implies(truth=true, facet=value)`), so a lie or a
  mistake is part of the jigsaw rather than an inconsistency.
- **Constraints** are small formulas over slots (`eq`, `ne`, `in`, `implies`, `and/or/not`, `before`), each with
  its premise nodes. Elimination check = "S=X is inconsistent with the constraints whose premises are all in the
  cited set" — so ANY sufficient citation is accepted (every valid route), no route authored by hand.
- Uniqueness (validator): all constraints active → exactly one solution. Police check: police-known constraints →
  the Simpson theory is consistent.
- v0.1's inference hyperedges are kept as **Holmes's route** (documentation / hints), not as the checker.

## As built (2026-10-13)

- **Cards:** 170 entities (every named or described person, animal, place, object, document — including
  hypothetical ones like the duplicate key and the chemist, and Holmes's invented Plymouth garden-party),
  92 events, 146 atomic claims, 32 rule cards, 49 period glosses. 465 quotes, all found in the text.
- **Slots:** 344; **givens:** 239 are filled by a plain clue the moment it is found (sudoku's printed digits);
  **105 are real puzzle cells** (who did what in the hidden part of the night, the identities, the truth of
  the testimony, purposes and motive). 23 slots are left open because the story never settles them (when the
  cravat was dropped, whether the opium went in in the kitchen or elsewhere in the house, …).
- **Givens rule (my choice):** a non-testimony claim whose assertion contains `eq(slot, value)` fills that slot.
  Testimony never does — it might be false.
- **Steps gate actions:** some of Holmes's actions need a reasoning step (search the wet hollow needs "where is
  the horse?" settled). A step counts once the player has proved its conclusion, by any route.
- **Placeholders:** "the stranger", "the midnight visitor", "the track man", "the neighbour", "the bay",
  "William Derbyshire" are cards whose identity is a slot. Claims link events to them (`same(event.agent,
  placeholder.identity)`), so identifying the stranger is itself a jigsaw step.

## Findings worth a decision

1. **Easy mode + all rule cards = the engine solves it for you.** With every rule card known from the start, the
   moment the papers are read Easy mode greys out everyone but Straker as the drugger. Options: (a) rule cards are
   earned (an action like "think about the curry" hands them over); (b) Easy's auto-check only uses rule cards the
   player has already cited somewhere; (c) default to "rule cards as told" — but the story states most of them
   only in the final explanation, so the case is then unsolvable before the end (that IS the fair-play finding).
2. **Holmes never rules out Colonel Ross for the night visit.** The dog argument alone leaves Straker and anyone
   else the dog knew who is not otherwise accounted for; only the curry argument closes it. The game accepts
   either route but a player using only the dog will be stuck on Ross.
3. **Several of the puzzle's links are editorial** (`by: "editorial"` in constraints.json): e.g. Mrs. Straker was
   at home all night; Straker never left the house that evening. The story assumes them silently. They are
   listed so a game can show them as rule cards or leave them out.
4. **Watson's self-wound suggestion is only a sound step after the landau** (when Gregory reports Simpson had no
   knife); the action graph enforces that.
5. **The minimal conflict set is one of several.** The police theory is broken by the dog argument alone, or the
   curry argument, or the knife; the UI shows the first minimal set found. A later version could list them all.

## Round 2 (user, 2026-10-13): play by reading

Rulings:
- The old Easy mode is kept and renamed **Trivial**. **Easy** = every possible connection listed; the player must
  identify the evidence that eliminates each option (cross-outs need accepted citations). **Hard** = the player
  first proposes connections, then eliminates them with evidence. Default difficulty: **Easy**.
- The game revealed too much too soon (incl. the opening summary). Now: a **story panel** advancing **one
  paragraph per press**; the button carries Holmes's next action as a short neutral cue. Easy/Trivial: the text
  links to cards, questions and timeline windows. **Hard: a card is collected only by clicking the text that
  mentions it.** Later: a mode where the player types the text instead of clicking.
- **Every entity's card appears at its first mention**, and gains information as the story goes on. Cards start
  with **background** (period notes + general facts) mixed so the clue-relevant facts (opium's taste) do not stand
  out. (This replaced separate "rule cards" and the "as told / from the start" setting.)
- **Pace** is a separate setting: *Free* (no restrictions) or *Wait for deductions* (the story waits where
  Holmes acts on, or announces, a deduction until the player has made it). A scored "keep up with Holmes" mode,
  with an optional warning, is deferred.

As built:
- `cases/silver-blaze/mentions.json` names every entity's phrases in the text (scoped by paragraph where a phrase
  is ambiguous: "the trainer" is Straker until Mapleton, where it is Brown). `engine/story.js` splits the 232
  paragraphs, resolves overlapping mentions to the longest, and locates every clue quote, event, question,
  action and route step.
- Rules now carry `attaches_to` and general wording; glosses are also citable, so the citation list does not
  single out the facts that matter.
- Answer lists never show a card the story has not mentioned yet. Ruling out every *visible* option but one
  does not settle a question (the answer may not have been mentioned yet); proving it does.
- Gates sit where Holmes acts on a deduction (actions' required steps) or announces one (his route steps that
  settle or rule out one answer), but never before the step's last premise has been told. A test reads the
  whole story under *Wait* and proves every gate from what has been read; it found two gates that came before
  their evidence (the coat: rebased on the coat seen on the bush; Brown: the gate moves past paragraph 146).
- Event labels and entity names/descriptions were rewritten so they give nothing away before the text does
  ("The horse is taken to the hollow", "The knife from Straker's hand").

Open:
- Easy marks every clue sentence in the text, which is busy and itself a hint. Options: mark only entity names
  and let clue sentences be found by clicking (as in Hard), or a toggle.
- The background note on opium ("no master has an honest reason to dose a servant") still leans towards the
  answer; the general facts may need more neutral company on each card.

## Round 3 (user, 2026-10-13): cards reveal nothing early

Rulings: a card is split into sections. The first holds only what is known at the entity's first mention, plus
general background; each later section holds only the new piece of information, and says where it came from.
The interface marks cards with information added since the player last looked. The repository went to GitHub
as a private repo.

As built:
- Entity `description` = the first mention only (rewritten for every entity against its first-mention
  paragraph). Later descriptive details became `notes`, each with its quote; the validator refuses a note whose
  quote comes before the first mention (it caught one).
- `Game.info(card)` lists every piece known about a card, dated by paragraph: the intro, the background, notes,
  and each attestation of each clue about it (who said it, how). The card view groups them by paragraph:
  "First mentioned ¶12", "Then ¶39", … The "called:" line lists the phrases the text has used so far.
- `lastSeen` per card (paragraph read + collection counter) is saved with the game. A card is marked seen when
  the player opens it; pieces after that are highlighted, and the card list shows "new" (never opened) and
  "updated" (new information since last opened), with filters for both.

## Round 4 (user, 2026-10-13): nothing on a card before the story says it

The user found the title "Silver Blaze" clickable before the story starts, opening a card full of information,
and expected more such cases. A reveal log (`npm run reveal-log` → `.cache/reveal-log.txt`: everything that
appears, paragraph by paragraph) was read end to end. Fixed:
- The title paragraph no longer counts as a mention.
- Questions appear only once raised: event questions with their event; identity and truth questions with their
  card; others when a held clue speaks of them, the story raises the case question, or Holmes reaches the point
  where he settles it (the card holding that question is dealt to the player just before such a point).
- Multiple-choice answers carry `reveal` quotes and are offered only once the story suggests them ("for early
  exercise" with the lads' hope, "to steal him" with the police theory, "to injure him" with Holmes's question —
  "lame" and "kill" merged into "injure" so the true answer is not on offer from the start).
- Background facts moved off the cards they solve onto **topic cards** (The turf and betting, Horses, Training
  stables, Households and servants, Medicine and injuries, Holmes's methods; and the moor), each mixed with true
  but irrelevant facts (`editorial: true`), and each appearing where the story first touches its topic.
- Period notes that gave answers away were rewritten (the bay "dyed over", Simpson's stick "weighted with
  lead", the trainer's fraud in "laying against", …).
- Event labels, entity names and first descriptions that ran ahead of the text were rewritten ("Simpson's
  clothing" → "The stranger's clothes", "Dawson" → "The Mapleton groom" until he is named, "Heavy rain, and no
  wind" → "Heavy rain", …).
- The fair-play test now also checks, at every gate, that the question is visible and the answer on offer.

## Round 5 (user, 2026-10-13): doubt is the player's move

> "Rather than automatically adding questions for things like whether the servant is honest, it might be
> better to have a more general mechanic where the player can mark claims they have encountered that they
> suspect might be false."

As built:
- **Every claim card has "I suspect this may be false".** Until then the game takes the claim at its word; no
  claim asks "Is it true?" by itself (it used to, for the 13 the case marks `truth_slot`, which singled them out).
- **Two readings per claim** (`caseModel.js`): TRUSTED (what it says holds) and DOUBTED (it holds exactly when
  its truth slot is 'true'). The case's own reading — what the validator checks — is unchanged; the other
  reading is a `variant` constraint, and the truth slot of a claim the case holds true is `latent`. The player's
  view (`activeConstraints(model, known, suspected)`) trusts every claim not suspected.
- **Givens** now come from every trusted claim, testimony included, but **never fill a case question** (those
  are always proved). Doubting a claim withdraws what it filled in. A given no longer raises its own question:
  "he is an honest servant" opens "Was Straker an honest servant?" only once the player doubts it, or when
  Holmes reaches the point where he settles it.
- **Proofs lapse.** A cross-out or proof whose accepted constraints trusted a claim the player later doubts
  stops counting (and comes back if they trust it again); the slot says which doubt broke it. A proof that
  disagrees with a trusted given wins, and the given's claim is flagged ("but X, which you trust, says …").
- **Contradictions are named.** Citing clues that cannot all be true is refused with the clash ("One of them
  must be false"), with a "doubt it" link on each claim. In Trivial a question with nothing left says
  "something you trust must be false" and can find the clash (a whole-hand check, ~3 s late in the story).
- The Questions tab lists the statements you doubt, with their state (open / false / true after all).
- Open: givens still come only from a claim's top-level `eq`, so a doubtful claim that only says `ne`/`same`
  fills nothing either way; and a trusted false claim can quietly fill a detail (Hunter's time for the drugging)
  until the player doubts it — intended, but worth watching in play.

## Round 6 (user, 2026-10-13): no card speaks of what the story has not told

> "I don't want any of the cards to refer to future events that haven't been directly mentioned in the story yet."

`npm run foreshadow-log` (`scripts/foreshadow-log.js` → `.cache/foreshadow-log.txt`) prints every card's text and
every gloss at the paragraph where it first appears, with the words the story has not used yet; it was read end
to end. Fixed: Holmes "about to leave for Dartmoor" (¶1); "The train to Exeter, Thursday"; "The other two King's
Pyland horses" (Bayard comes at ¶28); "The chaff-cutting loft" at ¶19 (named at ¶34 — now a dated note);
Mapleton "to the west" (¶69 — now a note); "Brown's hunting-crop" and dog before he is named; the race card's
"Wessex Plate" before the card is shown; "Opium is put into Hunter's supper" a paragraph before opium; "The
overcoat is put on the bush" and "The horse is taken to the hollow" (which take sides); "Silver Blaze is bridled"
dealt at ¶33 (the stall being empty no longer asserts the bridling — the missing bridle at ¶46 does); and the
remarks about what the story will never tell (the inquest's verdict, the disguise, the second household, the
A.D.P. initials, the boot comparison's result). Glosses may now carry an `after` quote and show only once it is
read (Ross's eye-glass at ¶47, the Telegraph and Chronicle, curried mutton); the tout, bookmaking and laying-against
glosses no longer sit on Simpson's card from ¶14; Doyle's loose Tavistock geography is a note at ¶47.
Background rules on topic cards are general facts, not events, and stay as they are (Round 4).

## Round 7 (user, 2026-10-13): a systematic fix — step 1, every piece of card text is dated by a quote

> "The cards are full of information that hasn't yet been revealed by the story. We'll need a more systematic way
> of fixing this." (Proposed: an LLM rewrites each card's content per paragraph, from the story so far.)

Agreed plan: (1) make every piece of card text carry a quote and show only once it is read, validated;
(2) build an LLM checker and measure it on the known leaks; (3) draft paraphrases from quotes; (4) review what the
checker flags. Step 1, as built:
- Entities have `names` and events `labels`: a history, in story order, of what the player sees it called, each
  with the line that gives it. The first must be read by the time the card appears (validated by reading the
  story through); `Game.nameOf` returns the latest one read. The case's own `name`/`label` are for reports and
  authoring only. Silver Blaze is "The favourite" until ¶10, Straker "The trainer", the landau "An open carriage".
  Topic headings are the one `editorial` exception.
- A card's first section is the **sentence where the story first mentions it**, not a written description. The
  old descriptions became notes (`from_description: true`, 175 of them), dated by their quote like every note;
  step 2 checks them.
- The 21 events dealt before their label's line got neutral first labels resting on the clue that deals them
  ("Silver Blaze is gone from his stall" before "…is taken out of the stable").
- The validator caught six names quoted with the wrong capitals (one, "Powdered opium", resolved to ¶218) and a
  note dated before its card.
- `npm run foreshadow-log` now lists every piece of card text where it first appears — the checker's input.

## Round 8 (user, 2026-10-13): a Background setting

> "…a separate setting for whether the background facts are all available from the beginning, whether they
> appear when they become relevant, or whether we have a mechanic where the player has to ask for background
> information on topics from the cards before they are revealed?"

As built (`Game.background`, saved with the game; changing difficulty brings that difficulty's default):
- **All at once** (`start`): every fact is held from paragraph 0 — a reference book in the new Background tab.
- **When relevant** (`relevant`, Trivial's default): each fact arrives at its `relevant_from` line, never before one
  of its cards is mentioned. Filler facts have their own triggers spread through the story ("a shoe that comes
  off is 'cast'" with the cast horseshoe, "bracken turns bronze" with the bronze ferns), so the facts that matter
  do not stand out by arriving later.
- **When asked** (`ask`, Easy and Hard default): each card has "What do I know about this?"; asking recalls every
  fact attached to it. Topic cards hold the general facts. Asking is saved and replayed on load.
- Every fact is attached to the cards it is about (and its topic). Gates count a fact as told at its
  `relevant_from` line — the latest point any setting makes it available — and the fair-play test passes under
  all three settings (the ideal player asks about the cards a step turns on).
- The Background tab groups facts by topic, sorted by text (sorting by id put the filler apart from the facts that
  matter), and never names a card the story has not reached.
- The checker has a `--background` mode: is each fact true general knowledge rather than a story fact? It
  flagged 7 (three overstated rules: "only a key", "never honest", "will wake the soundest sleeper"; three story
  facts in disguise: "the houses round about", "the posts on this line", "so famous a horse"; and a "Holmes's
  habit" that is really this story's), all reworded. One stays borderline: the same-dish rule (Haiku passes it 1
  run in 3, objecting that a drug could be spread unevenly — the ordinary reasoning the deduction needs).
- Known weakness of **When asked**: a card that answers with a fact (the mackintosh recalls only the coat rule)
  hints that it matters. Fix to discuss: every card answers something (filler about its kind), or asking about a
  card also recalls its topic's facts.
