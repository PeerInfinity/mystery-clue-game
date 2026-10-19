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

## Round 9 (2026-10-13): the full checker run

`node checker/check.js cases/silver-blaze --all --runs 2` asks Haiku about every piece of card text at the
paragraph where it first shows (712 pieces: names, event labels, notes, glosses, clue statements; topic headings
are editorial and skipped), twice each; a piece is flagged if either answer finds a leak. Answers are cached by
prompt in `.cache/checker-answers-haiku.json`, so a rerun asks only about what changed.
`node checker/report.js > .cache/checker-report.md` lists the flags in story order. First run: $2.26, 67 flagged.

What it found, besides wording:
- **Clue statements that sum up a passage running past their paragraph**, so the card said at ¶N what the story
  says at ¶N+1 or later: the man "asked where he was" (¶22, dealt ¶21), "only five have passed" (¶196, dealt
  ¶194), the dove-coloured silk (¶91, dealt ¶89), the woman in the passage named as Mrs. Straker (¶89, dealt ¶87),
  the "mottled off-foreleg… a child would know him" (later, dealt ¶146).
- **Logic leaks**, where the solver got a fact early: "Hunter ate the curried mutton" at ¶34 (now at ¶37, "the
  remains of his supper left by the stable-lad"); the tracks ending at the Mapleton gates at ¶122 (now ¶124);
  Desborough's owner at ¶40 (now ¶66, "their horse").
- **Two plain errors of mine**: the race result said Silver Blaze won "by six lengths from Desborough" (the story
  never says who was second); the knoll was put "a quarter of a mile from the stables" (that was the coat).
- **Names a paragraph or more early**: "Dawson" (¶129) in two ¶127 clues; "The stable key" when only a lock had
  been mentioned; "Heavy rain" (¶95) for rain "pattering against the window" (¶32); a "tin box" a paragraph early.

After the fixes and two cheap reruns (only changed pieces are re-asked): 20 flagged, all judged false alarms —
real-world facts in glosses ("the Wessex Cup is a fictional race", "tallow is cheap"), a question taken as a claim
(Holmes's "What chemist sold him the powdered opium?" supports a card naming the chemist), descriptive names close
to the text ("The stable dog" for "the dog… in the stable"), and two misreadings (Gregory's ¶58 reply taken as
Holmes's). The fair-play test still passes under all three Background settings after the moves.

## Round 10 (user, 2026-10-13): question wording, counts, reading ahead, difficulty

- **Question wording names cards through `{card}` placeholders**, filled with what the story calls them so far
  (`Game.phrase`, `questionText`, `promptOf`): "Who killed {straker}?" reads "Who killed the trainer?" at ¶4.
  The validator checks every placeholder is a card. "Where was the opium put…" became "the drug" (opium is named
  a paragraph after the question is raised).
- **New and updated counts** on the Cards tab ("Cards (12 new, 3 updated)") and on every category button; New =
  never opened, Updated = opened and added to since.
- **Reading**: the button always says "Next paragraph"; "Next deduction (N ¶)" reads on to just before Holmes's
  next deduction (the next gate), so the player can try it first, stopping where the Wait pace waits. The action
  cues ("Read the papers") are no longer shown.
- **Difficulty**: old Trivial → **Easy**, old Easy → **Medium** (the default, same behaviour as before), Hard
  unchanged, and a new **Trivial**: the game works out what the held clues allow — read as the case reads them,
  so false statements never mislead — shows only those answers, settles a question when one is left, and says
  why any answer was ruled out. Saves from before keep their meaning (`version: 3`). `Problem.allCandidates`
  does every question in one pass per group of linked questions (late story: 2.7 s → 80 ms).
- Trivial settled answers as soon as the logic allowed — at ¶115 it already named the killer and Derbyshire, some
  85 paragraphs before Holmes. User ruling: **make it a setting** ("Trivial answers", shown only in Trivial):
  *Keep pace with Holmes* (default) applies what the narrator states outright and each of Holmes's deductions
  once the story has told it (`holmesReasons`), so "Why?" quotes Holmes; *As soon as the clues allow* is the
  solver's reading above.
- "Next deduction" from the start jumped 95 paragraphs, so (user ruling) there is also **Next scene (N ¶)**, to the
  start of the next of the 10 scenes.

## Round 11 (user, 2026-10-13): asking recalls only what the story has reached

Asking about Dartmoor at ¶3 recalled every fact on the card — a light in a hollow, a coat on a bush — long before
the story has either. Now asking recalls only the facts whose `relevant_from` the story has reached, and a card
once asked about goes on recalling the rest as the story reaches them, without asking again (a button that came
back would itself say "something new is relevant here"). The stale old description "Dartmoor, where Holmes must
go." was dropped from the moor's notes.

## Round 12 (2026-10-13): step 3 — the old descriptions redrafted

`node checker/draft-notes.js cases/silver-blaze > .cache/drafts.json` asks Sonnet, for each old description kept as
a note in step 1 (168; the six topic cards are editorial and skipped), to drop, keep or rewrite it, with the
story so far, the card's first-mention sentence and its other notes and clues in front of it; a kept or rewritten
note must carry a verbatim quote, which the script checks. Cost $5.84.

Result, all reviewed by hand: 162 dropped (nearly all restated the first-mention sentence the card opens with;
two more dropped because their only quote came before the card's first mention, which the validator caught),
4 kept (Watson "who tells the story", Ross's drag, Simpson's purse, the midnight visitor), 2 rewritten (the
sitting-room; the hollow "just beyond the furze-bush, about a quarter of a mile from the stables" — my correction:
the model's draft gave the coat's distance). The rewrite of "the ring" lost that it means the bookmakers, so it
was dropped (the gloss says it). No note carries `from_description` any more except the topic cards'. The
checker passes all six survivors; its 19 remaining flags are the false alarms of Round 9.

## Round 13 (user, 2026-10-13): King's Pyland's confusing background

- The owner/trainer/jockey gloss sat on King's Pyland at ¶3, before the story says it is a training stable (¶19);
  it now sits on the King's Pyland stable card. An audit of every gloss against where the story first uses its
  term found four more shown early, now dated with `after`: Odds (¶18, was on Silver Blaze at ¶4), Off-foreleg
  (¶186), Penang-lawyer (¶40, was on the stick at ¶21), Landau (¶51, was on "an open carriage" at ¶50).
- "called: King’s Pyland" repeated the card's own name: the story's ’ did not match the name's '. Names are now
  compared without case, apostrophe style or a leading article.
- Cards now show glossary notes under **Words** (always shown: they explain a word the story uses) and recalled
  facts under **Background** (by the Background setting), so it is clear why one appears before asking.
- (Round 13, continued) The gloss audit is now a validator rule: a gloss may not show on any card before the story
  first uses its term (found in the text, each part of a list term counting, long words also by their first five
  letters), unless its `after` quote dates it. Checked by undoing three of the fixes in a scratch copy: all three
  are reported. "Laying against a horse" — a phrase the story never uses — became "Betting against a horse
  ('laying')", dated by "registered by him against the favourite" (¶39).

## Round 14 (user, 2026-10-13): topic cards read as topics

The racing topic showed "topictopic", "called: the singular disappearance of the favourite…", the disappearance
sentence, and its old description with that phrase as if it were the quote. Now a topic card shows its kind once
(the redundant `topic` flag is gone), no "called" line, a `summary` written for the game ("A topic: Horse-racing
and the betting on it. Ask what you know about it."), and the sentence where it comes up under "Comes up". The
racing topic now comes up where the story first touches betting (¶18, "the betting being three to one on him"),
not at ¶4, where asking about it recalled nothing; every topic now appears where its first fact becomes relevant.

## Round 15 (user, 2026-10-13): the disappearance is an event; time answers wait for the story

- "the singular disappearance of the favourite for the Wessex Cup" (¶4) lost its link when the racing topic
  moved to ¶18. It now links to the event of the horse being taken out, whose labels run "The favourite
  disappears" (¶4) → "Silver Blaze is gone from his stall" (¶33) → "…is taken out of the stable" (¶220).
- Dealing that event at ¶4 showed two more leaks. Its declared question "Why was the horse taken out?" showed
  with the card: a declared question on an event now waits, like any other, until the story raises it (only an
  event's own facets — who, what, where, when — show with it). And "When?" offered all 27 time windows, whose
  labels describe hidden events ("Tuesday, after 1 a.m. — the blow"): every window now has a `reveal` quote
  and is offered only once the story has reached it ("the blow" at ¶35, "in the hollow" at ¶37, "at dawn" at
  ¶126; "Race day, evening" at ¶215, where it had been tied to ¶20's Monday "that evening").
- Validator: every window needs a `reveal` quote, and no clue may give an event a time before that time's
  reveal (found four; two reveals moved earlier; verified by reverting one).
- (Round 15, continued) A question's count says "N so far" while the story could still bring answers not yet on
  offer (a time it has not reached, someone not yet mentioned — `Game.moreToCome`), and "N left" once every
  answer is on the table; Trivial says "N possible so far". So "When? 1 so far" at ¶4 no longer reads as solved.

## Round 16 (user, 2026-10-13): what "nothing fits" means; circling; doubting from "Could it fit?"

- Easy's "Nothing fits: something you trust must be false" read as if the answer just had not come up yet. It
  only ever showed on a real clash (the check counts answers not yet offered), so it now says so: "Nothing could
  fit, not even an answer the story has yet to bring up…". When the trusted clues are consistent but no answer
  on offer fits, the question says "None of the answers met so far fits your clues. The answer may be one the
  story has not brought up yet."
- "Could it fit?" names the clues in the way as before, now with a link to each claim among them and "doubt it"
  beside it; doubting from there re-runs the check.
- Circling: beside "Cross out", a "Circle" button marks an answer the player favours (Easy, Medium, Hard). It is
  tracked per question like crossing out (`marks.circled`, saved), proves and rules out nothing, sorts first and
  shows with a ring, and the Questions tab lists it ("circled: …"). The word may change.
- Wording: "crossed out" is the player's own mark without evidence (Easy); "ruled out" is with evidence the game
  checked, or what the clues rule out on their own. The two kinds now show on separate rows ("crossed out:" and
  "ruled out, with evidence:") instead of both under "ruled out:".

## Round 17 (user, 2026-10-13): what each clue implies; clashes get their own section

- The user could not see how "Mrs. Straker says Derbyshire was a friend of her husband's…" kept Straker from
  having taken the horse. It did not: by ¶85 three trusted clues clash over who Derbyshire is, and once trusted
  clues clash every answer "does not fit", so "Could it fit?" reported that clash against any answer.
- Clashes (`Game.clashes`): the minimal clashes among trusted clues, found one at a time, each set aside (its
  claims read as doubted) before the next. Claims go last in the search, so each clash rests on as few claims
  as it can (in Silver Blaze every clash has exactly one). Cached and incremental. Easy's greying and "Could it
  fit?" judge answers against what is left (`workingConstraints`), so a clash elsewhere rules nothing out. As a
  result Easy at ¶90 leaves only Straker for who took the horse (before, a clash greyed everyone).
- `explainConflict` is now QuickXplain (about 10× faster: every clash to the end of the story in 2.5 s, once).
- Chains (`Problem.steps`): a clash is replayed one clue at a time, each step saying what it narrows ("so the
  owner of the milliner's account is John Straker"), ending at the question left with nothing (✗). "Could it
  fit?" starts the chain from the answer ("Suppose …"); clashes found when citing show the same chain.
- Plain readings: every claim card says "What it means for the case", read from its formula ("The true identity
  of William Derbyshire is not John Straker."); several facts about one event gather into one line ("“Heavy
  rain”: at Dartmoor, Tuesday, 1 a.m."). Unmet cards and unreached times are never named.
- Clashes section (Easy): at the top of the Questions tab, each clash as a chain with "doubt it" on its claims;
  the tab says "Questions (6 clashes)"; clashes a doubt resolved are kept (saved) under "N resolved by a doubt",
  with "trust it again". Medium and Hard do not list clashes: finding them is the player's work there.

## Round 18 (user, 2026-10-14): how evidence is checked; a page that lays the logic open

- How a citation is checked: the cited clues' formulas, plus every authored inference (`constraints.json`) whose
  premises are all cited, are searched with the answer supposed (to rule out) or its negation (to prove); no
  solution means accepted, and the formulas are trimmed to a minimal "rests on" set. Background facts carry no
  formula: they only switch inferences on. The inference layer is the part the player never sees directly.
- Proposed, not built: (A) the citation dialog shows the inferences the ticked cards switch on, and an accepted
  step shows its chain; (B) inferences become a step of their own, a card the player derives and then cites.
- `logic.html` (deployed with the game, not linked from it; it shows every answer): Overview (how checking
  works), Inferences, Clues (true/false), Background (what each switches on, or "filler"), Questions (answer;
  how many clues, inferences and Holmes steps speak of each; 23 the story leaves open), Holmes's route (in hand
  vs told), Timeline (per paragraph: what arrives, which inferences switch on, what Holmes concludes), Graph (a
  neighbourhood, cytoscape). Anything clicked shows everything connected to it. Readings are shared with the
  game through `ui/readings.js` (the viewer names everything; the game only what the player has met).

## Round 19 (user, 2026-10-14): inferences are held, built, stated and doubted, like clues

The user: inferences get their own panel; instead of choosing evidence for each claim, inferences are accepted or
rejected globally, like claims; theories show the inferences they rest on; inferences stated by characters appear by
themselves (Holmes's too, driving the pace); the player constructs new ones from cards. Rulings: cross-outs are
checked against everything held ("Check against all"); background premises are a setting by difficulty; Holmes's
inferences arrive when he states them and 'wait' waits for them; false character inferences are in.

- Model: every inference (constraints.json) is a card with a truth slot and trusted/doubted readings. A player
  (outside Trivial) holds it once built or stated; the case (validator, route checks) and Trivial still switch it on
  when its premises are in hand (`activeConstraints(…, {heldInferences})`).
- Building: "Infer from this" on a clue or background card, then "Connect to this" on others. A connection builds
  every inference it completes; otherwise the game says "onto something: connect one more card" or "needs N more
  connections", or that some knowledge is lacking. Only inferences whose connections are all in hand count (no
  hint of what is unmet). Setting "Inferences": background needed in hand (Trivial–Medium) or connected too
  (Hard). Hard names what the conclusion is about (who, when, where, what, why, whether). Easy shows how many
  can be built. A false inference can be built too.
- Stated: `stated` quotes (Ross's "not a white hair", the police's bridle and knife reasoning, Holmes on the
  dresses and on running the horse as sent over). Holmes's: each route step needs a fewest set of inferences
  (computed), given where the story tells the step; 'wait' waits until they are held.
- Four false inferences (truth false), stated where the police and Gregory voice them: Simpson drugged the lad,
  took the horse to steal it, killed Straker with his stick; the gypsies have the horse. Theories list `rests_on`.
- No citations: "Rule it out" / "Prove it's this" check against everything held and trusted, clashes set aside;
  a proof records what it rests on and lapses if that is doubted. A clash sets aside what weighs least by
  provenance (never by truth): the story's clues, then inferences others stated, then the player's and Holmes's.
- Theories panel: what a theory rests on, and the held inferences its answers agree with or go against.
- Not yet: freestyle formulas (the player writes the formula; the game runs it without comparing).

## Round 20 (user, 2026-10-14): difficulties become presets of separate options

The user: make Trivial, Easy, Medium and Hard presets; add Custom, selected by itself when the options match no
preset; split everything a difficulty decided into options of its own; and add an option for how many cards
irrelevant to the solution are shown.

- `OPTIONS` (engine/game.js), with `PRESETS` and `presetOf`: who works out the answers (the game: Trivial; you),
  cards (dealt; collected by clicking), answers (all listed; you propose them), crossing out (pencil; checked),
  greying (answers your clues rule out greyed, "Could it fit?", theory checks), clashes listed, inference hints
  (count left to build; the cards a waiting deduction starts from), naming an inference's kind, background in
  inferences (needed in hand; connected), background facts (all at once; when relevant; when asked), and cards
  the solution does not need (none, one in four, half, three in four, all). Pace and Trivial's settling pace
  stay outside the presets.
- `game.difficulty` is derived: the matching preset, or Custom. While the game solves, the player's options do not
  count against Trivial (they are shown dimmed). Saves carry `options` (version 4); older saves map their
  difficulty, background and connect onto options.
- Changing who solves, how answers are listed or how they are crossed out clears the answers (asked first);
  switching to collecting keeps the cards already dealt as collected.
- Relevance (`relevantCards`, caseModel.js): every premise and inference, everything a constraint, theory or route
  step speaks of, the cards holding the case questions, whoever told a used clue, and the cards a used background
  fact attaches to. Silver Blaze: 73 entities, 28 claims, 33 background facts and all 49 glosses are not needed.
  A left-out card is never dealt or collected, its words are not marked, it is not offered as an answer, not
  waited for ("so far"), and not counted against settling a question by elimination. Which cards go is a hash of
  the id, so it is stable and a larger share keeps every card a smaller one kept. The logic viewer tags them
  "not needed". Every preset shows all of them (unchanged behaviour); the option is the player's choice.

## Round 21 (user, 2026-10-14): a redesign discussion before any change

The user is not satisfied with the first draft and asked, before any proposal, for the real process a reader
uses to solve the mystery, what the representation of the logic is missing, and what the gameplay is missing,
each with a from-scratch design and as many alternatives as possible; the inference system above all. The
discussion is in `docs/redesign.md`. Decision: implement as many of its ideas as are technically possible,
starting with the infrastructure they need; continue from the current state as a new case format with a
migration, re-authoring the reasoning layer and keeping the reading layer.

## Round 22 (2026-10-14): format 0.3, step 1 — checkable inferences

Built from `docs/redesign.md`, "Where to start", item 1 (see `docs/format-0.3.md` for the format and what is
open): rule schemas with variables grounded against cards, relations and propositions as slots, a native lookup
constraint in the solver, inferences verified by the engine from their premises (6 of 53 so far; the report
lists the rest as asserted), and the player's own moves `applyRule` and `conclude`, which pass Holmes's gates
by any route. 42 tests pass; the case validates with 0 errors.

## Round 23 (2026-10-15): traits and the establishment relation (kickoff slices 1 and 2)

From `docs/kickoff-0.3-migration.md`; Robert's rulings of 2026-10-14 (closed-world facts go relational; traits
first). Scope narrowed with Robert to slices 1 and 2; slice 3 (the asserted inferences) and the discussion of
steps 2 and 3 of `redesign.md` go to a later session.

- **Traits.** Entities may carry `traits` (id, term, text, quote); a rule variable or relation argument may say
  `trait`. `r.curry_masks` and `masks_taste` range over spiced dishes, not over the curried mutton by name. The
  curried mutton's trait ("Spiced: a curry is a strongly spiced dish") shows under Words at its first mention;
  it is the one new piece of card text, plain description, and the foreshadow log lists "spiced" as a word the
  story never uses.
- **Establishment.** `of_establishment(x) → place`, given by claims the story already makes; two general rules
  (`r.dog_knows_its_own`, `r.menu_known_at_home`) replace the editorial claims `c.dog_knows_household` and
  `c.menu_known_to_household`, which are retired. The dog and curry inferences now conclude "belonged to King's
  Pyland" and are verified; the people the story never places stay open to the dog argument (the honest result)
  and the curry route closes them. The route step that leaned on the dog alone now says exactly that.
- **Solver and game** changes the open relation slots required (guarded lookups, branching on lookup keys first,
  independent parts searched apart, negations pushed inward; a lookup raises only its key). See the format doc.
- **Gates:** no fair-play gate moved; the question table and every non-relation slot in the report are
  unchanged. The reveal log differs only by the two retired claims and the two new rules shown as background
  where they were (¶20 menu, ¶29 dog). Report: 7 verified, 46 asserted. 43 tests pass; `npm test` about 67 s.


## Round 24 (2026-10-15): slice 3, chain 1 — the night sequence and whereabouts

From `docs/kickoff-0.3-migration.md` slice 3, first chain. Robert's rulings (2026-10-15): no `at(person, window)`
relation; whereabouts the story gives are already event facets, so general rules over events, each bound to the
event in question (no `forall`, no new slots); propositions wait for step 2; Edith leaves the whereabouts
inference (the story never places her between ten past nine and seven; the curry route closes her); the sheep
lad is a person card the lads' claim does not reach, and is left to the curry route too.

- **Seven general rules** (`knowledge.json`, after `r.bridle_needs_a_hand`): `r.one_place_at_a_time` (hard),
  `r.sleeper_stays_put` (default: in bed at night and woke there, so at home in between), `r.stupor_is_helpless`
  (hard), `r.drugged_guard` (default: whoever drugged the guard took what he guarded, after the draught worked and
  after he was last seen about his duties), `r.gone_before_found` (hard), `r.leaves_before_arriving` (default),
  `r.blow_is_the_death` (default). Each has a schema over events, a strength and `unless` where it is a default;
  none is stated by the story, so none has `stated_in`.
- **Claims say what the story says.** `c.horse_was_in_hollow`: the horse was there *at the time of* the struggle
  (`not_after`); `c.horse_alone`: the horse's track ran *alone before* the man's; `c.head_shattered` pins the blow
  to its window, as `c.thigh_cut` already did; `c.lads_heard_nothing` makes the lads the agents of their rousing
  (`e.lads_roused.agent`, so the sleeper rule binds).
- **Seven inferences verified**: `k.drugger_took_the_horse` (now also: the horse went after Hunter was last seen
  at his duties, sending word of the tout), `k.found_before_seven`, `k.hunter_was_drugged`, `k.lads_slept`,
  `k.wife_stayed_home`, `k.straker_went_out_first`, `k.night_sequence`. Formulas narrowed to the honest result:
  the wife alone, the two lads alone, the horse in the hollow no later than the blow. The whole derivation of
  "the horse went between one and seven" is: drugged guard (after the message at `w.mon_late`), gone before found
  (before seven), so the sleeper rule bites.
- **Premises are flat.** An inference as a premise of another is not yet playable (`buildable` wants it held, a
  route step cites claims and rules), so each inference lists the rule applications it needs; nine route steps
  that carry the ancestry of "Straker took the horse" gained the same premises. Step 2 (chains) is the remedy.
  `i.straker_took_horse_by_dog` now concludes the honest set (not the wife, Hunter or the two lads).
- **Solver.** A soundness gap, found because the first verification came back "asserted" with a witness that broke
  the rule: the search counted only its own choices as assigned, so a wide part whose other slots the clues had
  settled was skipped as too wide and never enforced at the leaves. Settled slots now count as assigned (undone
  on backtrack); an ordinary implication part is dropped once its condition fails and shrinks to its consequent
  once it holds; one copy of identical parts per search (several inferences carry the same rule application).
  Regression test in `engine/solver.test.js`. The fix made the suite faster, not slower; the new constraints cost
  the rest: `npm test` about 100 s (67 s before), `npm run validate` about 26 s (20 s).
- **Gates.** "By the challenge" unchanged for every question; uniqueness unchanged (398 forced, 142 open). The
  Strict column moved for two questions (who drugged: 21 → 45 left; who took the horse: 21 → 25), because strict
  drops rules the story never states, and the editorial inferences used to carry that common sense with no rule
  at all. Reveal log: the seven facts appear as background at their topic cards and nowhere earlier; the
  foreshadow log shows nothing new. Report: 14 verified, 39 asserted. 44 tests pass.

## Round 25 (2026-10-15): slice 3, chain 2 — the drugging's place and time

- **Verified:** `k.drugged_after_set_aside` and `k.portion_set_aside_before_edith`, by two rules: `r.same_dish_safe`
  gains a schema (a drug found in one portion while the others ate the dish unharmed went into the portion after
  it was set aside), and `r.set_aside_at_the_meal` (a portion set aside for someone absent is set aside at the
  meal where the dish is served, and where it is served). The household's supper (`e.household_sups`) gets a
  time, nine, given by `c.household_same_dish`; giving it through the lads' claim at ¶20 would have pulled the
  card ahead of ¶37, where the story first says the household ate the same dish, and the validator refused it.
  `k.drugged_after_set_aside` no longer lists the five places on the portion's way (the premises never said
  that; the place question is unchanged, since `k.straker_home_all_evening` still narrows it).
- **Asserted, with their reasons in the file** (`asserted: "<why>"`, shown in the report): `k.straker_home_all_evening`
  (the story never places Straker between nine and the message that reached him at the house), `k.window_drugging_time`
  (Gregory's conditional rests on the stranger standing at the window at ten past nine and nothing more), and
  `k.drugged_in_house_means_before_nine_five`: its new rule `r.dosed_before_carried_off` (what was tampered with where
  it was kept was tampered with before it was carried away) reaches the villa half; the kitchen half does not
  follow, because the kitchen is a place card of its own (the lads supped there) while the portion was set aside
  at the villa. **Open for Robert:** fold the kitchen into the villa as the drugging's place (the question's answer
  would read "straker_villa" instead of "one of straker_villa, villa_kitchen"), or keep the kitchen and leave the
  inference asserted.
- **Foreshadow check, done properly this time** (the Round 24 entry had looked only at the tail of the log). Three
  of the new rules surfaced before the story says opium (¶37): `r.drugged_guard` at ¶20 ("remained on guard"),
  `r.stupor_is_helpless` at ¶35 ("absolute stupor") and `r.dosed_before_carried_off` at ¶20 ("carried down to"). A
  rule about a drugged guard before the reader knows of any drug runs ahead of the story, so all three now take
  the opium's quote as their `relevant_from`, like `r.opium_taste`. The other six surface where their subject is
  first told (¶32 to ¶37).
- **Gates:** question table unchanged from Round 24; uniqueness 399 forced (the supper's time is the new slot), 142
  open. Report: 16 verified, 37 asserted. 44 tests pass, about 96 s.

## Round 26 (2026-10-15): slice 3, chain 3 — the coat and the vesta; a leak in first mentions

- **Verified:** `k.coat_placed`, `k.vesta_from_strakers_box`, `k.led_by_taker` and a new `k.hollow_order` (20
  verified, 34 asserted). `r.wind_and_coats` carries a schema (the one who wore the coat out put it there, after
  he went out); new rules `r.dead_men_do_nothing` (hard), `r.vesta_from_box`, `r.acts_after_arriving`,
  `r.taker_leads_on` (defaults with `unless`). `c.coat_on_bush_seen` now says the coat came to be on the bush by
  the hollow. The two hollow inferences keep what their own premises give (the wearer placed the coat; the match
  was Straker's and he struck it; both before the blow); the narrative order "the horse came first, then the coat
  and the light" is `k.hollow_order`, a *conditional* conclusion (if the man who did those things brought the
  horse, he did them no earlier than he came) which the full model closes once the horse's leader is known
  through `k.led_by_taker`. Without that split the two inferences would have needed the whole ancestry of
  "Straker took the horse" as premises; with it the fabula's windows stay forced.
- **Solver, twice more.** The conditional inference hung the validator: the search branched on the time windows
  before the agents and rediscovered the contradiction under every pair of windows. Branching on every
  condition's slots first fixed that and broke everything else (the quick tests ran for minutes). What works: a
  dynamic pick, an *urgent* slot first, one of at most two still open in a condition not yet decided, then the
  pools as before. The scan is allocation-free (condition slots precomputed). Suite about 120 s; test 27 (minimal
  sets of cards) is the one that grew, 13 s → 27 s, and the validator 26 s → 36 s.
- **A leak in first mentions, pre-existing.** A card shows, under "First mentioned ¶n", the sentence of the
  story's first quote for it. An implied event quoted only from Holmes's explanation, but spoken of by an early
  clue's `asserts`, appears early and showed that sentence at once: the drugging card (¶36) carried "The opium was
  added after the dish was set aside for the stable-boy…", the curry card (¶20) "Therefore Simpson becomes
  eliminated from the case…", the dog's silence (¶34) "The dog did nothing in the night-time." The chain-3 change
  to `c.coat_on_bush_seen` moved the coat event from ¶95 to ¶35 and made it visible in the reveal log. Fixed in
  the engine: `Game.info` shows the first-mention quote only once its paragraph is read, like every other piece
  of card text. The validator lists the 19 cards quoted later than they appear in a new report section ("Quoted
  later than they appear"), for an earlier quote to be given where the story has one; `e.coat_off` got its
  (the flapping overcoat, ¶35).
- **Gates:** question table unchanged from Round 24; uniqueness unchanged (399 forced, 142 open). Reveal log: the
  five rules at their topics from ¶35 on, the coat event and its four questions at ¶35 (the lads see the coat
  there), and the 19 first-mention quotes now at their own paragraphs. Foreshadow log: nothing new before its
  paragraph. 44 tests pass.

## Round 27 (2026-10-15): slice 3, chain 4 — the knife and the purpose

- **Verified:** `k.knife_for_an_operation`, `k.horse_kicked`, `k.blow_needs_a_wielder`, `k.only_one_blade`,
  `k.knife_marks_assailant`, `k.drugging_is_dishonest` (26 verified, 28 asserted). Three **traits** carry the
  general reading: the knife is *surgical* ("a surgeon's instrument, made for the most delicate operations", at
  "cataract knife"), the stick is *weighted* ("heavy enough to serve as a weapon"), the steel shoe is a *shod
  hoof*. Schemas on `r.cataract_knife_use` (a man who takes a surgeon's knife out to a horse at night means an
  operation: `purpose = injure`), `r.horse_would_wake_sleepers`, `r.startled_horse_kicks` (a light struck beside
  the horse in the dark, a man struck down there: the horse lashed out), `r.convulsions_after_brain_injury`,
  `r.knife_marks_assailant`, `r.honest_men_dont_drug`; new `r.hoof_strikes_as_horse_kicks` (hard),
  `r.stick_needs_a_hand`, `r.wounds_in_a_struggle`. `k.horse_kicked` now concludes unconditionally (the rule
  needs the light and the horse in the hollow, not the purpose); `k.blow_needs_a_wielder` drops its two editorial
  exclusions (the cast shoe, the hunting-crop), which nothing needed.
- **Asserted, with its reason:** `k.operation_in_the_open`. "It was absolutely necessary to do it in the open air"
  explains why the horse had to be taken out at all; as a derivation it needs the hollow event tied to the horse,
  which only the marks in the hollow give, and those already give the place. Cause and explanation are redesign
  step 3. The route step `i.done_in_the_open` now concludes by a strike (the horse was not led to the stable)
  instead of naming the hollow, which its cited premises could only reach through the asserted inference.
- **Two gate slips caught by the needs check and undone.** Citing the marks in the step made it trivial (no
  inference needed, and the five inferences Holmes states there would have moved to a later step). The hoof rule
  anchored at the steel shoe (¶226) moved the gate of `i.horse_killed_straker` from ¶202 to ¶227, after Holmes's
  explanation; it now arrives with the other horse rules (¶18). A per-step listing of gate paragraph and needed
  inferences, diffed against HEAD, is the check to run with every chain (`scratchpad/needs.mjs` this session).
- **Strict column:** "Who killed Straker" went from "simpson, silver_blaze" to 45 left, for the reason of Round 24:
  the editorial exclusions carried that narrowing without a rule, and the rules that replace them are never
  stated by the story. "By the challenge" unchanged for every question; uniqueness unchanged.
- **Validator:** stops with the model's build errors instead of crashing on a model without a solver.
  `engine/reasoning.test.js` names `k.window_drugging_time` as its asserted example. 44 tests pass, about 135 s.

## Round 28 (2026-10-15): slice 3, chain 5 — the second household and the plot

- **Verified:** `k.second_household`, `k.dresses_for_the_other_woman`, `k.practice_first`, `k.lame_plan` (30
  verified, 24 asserted). New rules `r.second_establishment` (a married man who buys fine dresses for a woman not
  his wife keeps a second establishment, and its debts drive him) and `r.no_finery_for_servants`; schemas on
  `r.servant_wages` (the buyer is in debt), `r.practise_first` (the lame sheep are the practice; the plot came
  before it) and `r.laying_against` (the plot and the money laid, before the horse went out). The maid carries the
  trait *in service*. `c.sheep_lame` now says what the lad says (which sheep, where, lately); the second
  household's place comes from the milliner's recognition at s10. `k.second_household` keeps its conditional
  form (if Derbyshire is Straker…) and drops the place conjunct; `k.lame_plan` bounds the laying by the night
  the horse went out instead of a literal one o'clock, so `e.lays_against.time` records one o'clock as open too.
- **Solver: denied conclusions split wherever the negation sits.** "If P then A and B and C", denied, is "P and
  not A" or "P and not B" or "P and not C"; the search had been handed one wide part to enumerate and ran past
  five minutes. `alternatives()` pushes a negation inward (through conjunctions, implications and double
  negations) and `consistent` tries each alternative; the suite is faster for it (about 107 s).
- **Reveal:** the sheep event ("Three of the sheep go lame") and its four questions now appear at ¶173, where the
  lad reports the lameness and Holmes asks about it, instead of at Holmes's explanation; its label is quoted
  there. The agent question ("Who did it?") is the usual one for an event with an agent. Robert may judge
  whether that runs ahead; the story's own hint at ¶173 is Holmes's interest in the sheep.
- **Gates:** question table unchanged from Round 27; needs per step unchanged; uniqueness unchanged. 44 tests pass.

## Round 29 (2026-10-15): slice 3, chain 6 — the horse's whereabouts and Brown

- **Verified:** `k.horse_goes_home`, `k.tracks_end_at_mapleton`, `k.boots_identify`, `k.first_up_and_no_subordinate`,
  `k.brown_broke` (35 verified, 19 asserted). Schemas on `r.horse_gregarious` (a horse taken out and loose is at
  its own stable or the nearest other one: the binding names the two), `r.gypsies_avoid_trouble` (a band that has
  gone did not take the horse) and `r.prints_identify_boots`; new `r.tracks_lead_in`, `r.first_up_takes_it_in`
  (the master's establishment through `of_establishment`, from `c.mapleton_brown`) and
  `r.undertaking_means_possession`. `k.horse_goes_home` also says the gypsies did not take it.
- **Asserted, with its reason:** `k.found_at_dawn`: the hour is Holmes's reconstruction, told only as his account
  at s07 (`c.brown_story_told`, a derived claim); no earlier claim gives it.
- **A rule variable may range over the placeholder cards** (`{kind: "person", placeholder: true}`): the man whose
  track joins the horse's is a placeholder, excluded from ordinary domains, and the boot rule needs it
  (`?walker.identity`). Schema and `describeSpec` updated.
- **A premise order trap.** Binding the gregarious rule to the horse's bolting needed `c.horse_alone`, an
  observation of s06 that comes after the action which yields the step `i.horse_at_mapleton` (the validator's
  playability walk refused it). Bound to the taking (`c.stall_empty`, s02) instead.
- **Gates:** question table unchanged from Round 27; needs per step unchanged; the new rules surface at ¶124
  (the gates), ¶127 (the groom), ¶140 (Brown's capitulation). 44 tests pass, about 115 s.

## Round 30 (2026-10-15): slice 3, chain 7 — the disguise and the bay

- **Verified:** `k.disguised_to_survive_search`, `k.markings_identify`, `k.bay_is_ross_entry` (38 verified, 16
  asserted). The seven horses in for the Cup carry the trait *entered* (quoted from the race card, and for
  Silver Blaze and Bayard from "two horses in for the Wessex Cup"), so `r.colours_identify_owner` can say what it
  means: a horse on the course in a man's colours is one of the runners (`exists` over the entered horses) and his
  (`forall`: whichever it is, that horse's owner is he). `r.scratched_horse_does_not_run` (hard) and
  `r.searched_and_not_found` are new; `r.markings_identify_horse` carries a schema. The bay and the other
  placeholder animal bind through `placeholder: true`.
- **Solver:** QuickXplain recursed forever when the clash lay in the extra formulas alone (an inference whose only
  claim premises carry no formula, so no constraint is active); guarded, with a test.
- **Placement:** the searched-and-not-found rule first took the Mapleton search's quote (¶66), which would have
  pointed at the disguise long before Holmes reaches it; it now surfaces with the disguise rule among the racing
  background (¶18), as that rule always has.
- **Gates:** question table unchanged from Round 27; needs per step unchanged; uniqueness unchanged. 45 tests pass,
  about 140 s.

## Round 31 (2026-10-15): slice 3, chain 8 — the visitor, the bridle, the cravat

- **Verified:** `k.visitor_is_taker`, `k.went_out_to_the_stables`, `k.bridled_by_taker`, `k.cravat_order`,
  `k.cravat_worn_at_window` (43 verified, 11 asserted). New `r.taker_entered` (whoever took the horse came in for
  it; the night's visitor, a placeholder, is the one who came in), `r.dropped_before_found`, `r.not_his_so_found_out`
  (a thing on a dead man that was not his came to his hand after he last left home: this replaces the editorial
  "picked up after one"), `r.worn_then_lost_later` (hard); schema on `r.bridle_needs_a_hand`.
  `c.cravat_in_left_hand` says what he clasped. `k.cravat_order` no longer rests on the knife or the dressing.
- **Asserted, with their reasons:** `k.simpson_purpose` and `k.paper_held_opium_means_nobbling`: they state what the
  purpose values mean (to drug the guard, to steal the horse); there is nothing to derive them from. Seven
  asserted inferences now carry a reason; the four left without one are the police's.
- **Strict column:** "who took the horse" 25 → 45 left. The visitor-is-taker link used to be an editorial formula
  with no rule; its rule is never stated by the story, so Strict drops it and the dog argument no longer reaches
  the taker there. "By the challenge" unchanged throughout slice 3.
- **Gates:** needs per step unchanged; uniqueness unchanged. 45 tests pass, about 130 s.

## Round 32 (2026-10-15): the annotated reading, and a change of direction

- **The idea (Robert):** the project should have started with a document that annotates the story with every
  thought a reader has while trying to solve it; the game mechanics are then planned around letting the player
  perform those steps, or a valid alternative. Written in a separate worktree while slice 3 ran on main:
  `docs/reading-annotated.md`, about 280 thoughts over ¶0–¶231, written without reference to the case files so
  that it describes the reader, not the format.
- **Its format:** each thought has an id `t<¶>.<n>` whose paragraph is its earliest possible date; a tag (RECORD,
  NOTICE, ABSENCE, QUESTION, HYPOTHESIS, INFER, DEFAULT, AGENT, PHYSICAL, IDENTIFY, WEIGH, SOURCE, TEST, RESIDUE,
  PREDICT, TEST PLAN, GENRE, SET ASIDE, DROP, REVISE, some with subtypes); a confidence; a reader profile (typical,
  careful, expert); premises (thoughts and `bk.*` background cards, each marked for an 1892 and a modern reader);
  typed relations (supports, strains, refutes, undercuts, revises, drops, addressable to one member of a candidate
  set); clause-level quotes; and Holmes's date. Wrong turns are a HYPOTHESIS plus a DROP citing its reason; the
  game never names them as wrong. A pilot (¶0–¶92) fixed the format before the rest was written.
- **What it shows:** most of the reader's decisive work is noticing (including absences: the dog), weighing
  testimony as speech (Hunter's "certainty", the "assailants"), and listing a theory's residue; INFER steps are
  short and few. From ¶93 on the reader mostly scores earlier predictions and anticipates Holmes's tests. The audit
  at its end gives the beat-Holmes windows, the fair-play gaps (opium's taste, laying against one's own horse and
  the blaze are stated only after they are needed; the boot comparison, the bill's items and the question to the
  maid are never reported) and what the story leaves open.
- **Ruling (Robert):** the game should let the player perform every step of the annotation, each tag becoming a
  game action; as many of its ideas as possible are to be implemented, starting with the infrastructure they need.
- **Slice 3 paused** at 07181e3 (chains 1–8, Round 31) by agreement with the session running it. Its assessment:
  the rule library, the verified inferences (as regression cases), the solver fixes, first-mention gating and the
  per-chain leak checks stay; propositions and short chains (step 2) should be re-specified from the thoughts, which
  are those propositions; the route's gate machinery would give way to the thoughts' two dates; the police's four
  become HYPOTHESIS and WEIGH thoughts in a pruned set rather than inferences to verify; undercut needs defeasible
  rules; the Strict column and `asserted: "<why>"` likely give way to SOURCE, GENRE and late-disclosure typing.
- **Next:** a gap analysis of the annotation against the format and the engine as of slice 3 (each tag, field and
  relation: covered, partial or missing), which orders the infrastructure work; then a machine-readable form of the
  annotation that the validator can check.

## Round 33 (2026-10-15): rulings on the open items of slice 3

- **The police's four false inferences** (kickoff open question 2): neither their own wrong rule cards as asked,
  nor stated only. They are modelled as the annotated reading has them: each police conclusion is one member of a
  candidate set (the police scenario `t39.4` / `t46.1`, the gypsies `t62.2`); the police's rules are defeasible
  defaults with named exceptions; the reader defeats them by undercut (`t36.2`: Hunter could not have seen the
  drugging), strain (`t40.5`: repeated blows against one), residue (`t46.3`) and drop (`t62.4`). This is option A
  built on the infrastructure the annotation needs anyway (candidate sets, defeasible rules, undercut), so it is
  built as part of that work, not separately. Slice 4 (the report gate) waits on it; no temporary
  `asserted: "<why>"` is added meanwhile.
- **The Strict column:** superseded by the annotation's background cards, each marked for what an 1892 and a modern
  reader knows. **Cards quoted later than they appear:** handled by the annotation's fair-play table and
  late-disclosure typing. Both are settled in the gap analysis.
- **The sheep (¶173):** the question raised when the lad reports the lameness is first *what caused it*, not *who
  did it*. The lameness is an observation with an open cause (ordinary causes among the candidates); someone's
  practice is one candidate, and "who did it?" belongs to the practice event once the player or Holmes reaches it
  (annotation `t173.1`, `t173.2`, `t175.1`, Holmes ¶228).
- **The kitchen** (fold into the villa or keep it): still open (ruled in Round 35).

## Round 34 (2026-10-15): the sheep's cause before its culprit

- **Ruling applied (Round 33):** at ¶173 the lad's report raises *what caused it?*, not *who did it?*. The one
  event that served both (first labelled "Three of the sheep go lame", then "Someone practises the operation
  first") is split. `e.sheep_go_lame` is the observation: subject, place, time and a new `cause` facet ("What
  caused it?": "Something ordinary: illness, a strain, an accident" or "Someone's doing"). `e.practice_on_sheep`
  keeps agent, patient, place and time and now appears at ¶228, where Holmes names it.
- **Engine:** a `facet_types` entry may carry `labels` and `reveal` like a declared slot; new facet types `cause`
  and `subject`. `c.sheep_lame` now speaks of the lameness only.
- **Rule:** `r.practise_first` binds the lameness (`lameness` variable): an outing to injure means the lameness is
  someone's doing, and the practice shares its subject, place and time; its `unless` ("the sheep went lame of
  themselves") is now the other value of that slot. `k.practice_first` and `k.lame_plan` stay verified.
- **Route:** `i.practised_on_sheep` concludes `e.sheep_go_lame.cause = someone`. Concluding the practice's agent,
  as before, made its gate deal the practice card at ¶227, one paragraph before any text names it (the validator
  refused it); the cause is also what Holmes's ¶228 actually settles. Straker as the one who practised still
  follows from `k.practice_first`.
- **Reveal and foreshadow logs:** only the intended changes (the lameness and its four questions at ¶173, the
  practice card and its four at ¶228). Cards quoted later than they appear: 19 → 18. Uniqueness: 402 forced, 143
  left open as recorded. 45 tests pass, about 145 s.

## Round 35 (2026-10-15): the kitchen is the house

- **Ruling (Robert):** treat the kitchen as the same place as the house, unless something makes the difference
  meaningful. Nothing does: the story puts the lads' supper "in the kitchen" of the trainer's house and the
  household's meal "at the house", and neither it nor Holmes ever sets the kitchen against the rest of the house
  (Holmes's open question, ¶218, is who had access to the dish without the maid seeing, not where in the house).
- **Done:** the `villa_kitchen` place card is gone; "the kitchen" is a mention of `straker_villa`; the lads sup at
  the villa; the drugging's place is `straker_villa` (was "one of straker_villa, villa_kitchen", left open).
  `k.straker_home_all_evening` and `k.drugged_in_house_means_before_nine_five` name the villa; the second is now
  verified (44 verified, 10 asserted: six with a reason, the police's four). Question table: "Where was the drug
  put into the supper?" is settled as the villa in every column.
- **Reveal and foreshadow logs:** only the kitchen card's appearance at ¶20 is gone. 45 tests pass, about 130 s.

## Round 36 (2026-10-15): the gap analysis

- **`docs/gap-analysis.md`** (draft for review): every tag, field and relation of the annotated reading against
  the format and the game as of Round 35, each *covered*, *partial* or *missing*. Covered: RECORD, INFER (no UI
  yet), refutes, clause-level quotes, Holmes's dates, slot-shaped candidate sets. Missing: NOTICE, RESIDUE,
  PREDICT, GENRE, SET ASIDE, confidence, reader profiles, supports and strains. Everything else is partial.
- **Two findings that change existing behaviour:** the dog's silence (`c.dog_did_nothing`, `via: absence`) is
  dealt to the player at ¶34, so the game makes the story's hardest move for them; and default rules' `strength`
  and `unless` are display only, so nothing can undercut a rule application.
- **Workstreams in order:** thoughts as data (a `thoughts.json` with a crosswalk to the case's cards) → short
  chains (step 2 re-specified; the two dates replace the gate machinery) → then, largely independent:
  defeasibility (with the police's four and slice 4), testimony and sources, noticing and absence, hypotheses
  with scenarios and residue, prediction and test plans, the reader layer (1892/modern availability replacing
  Strict, disclosure typing, profiles, genre, set aside) → the UI.
- **Four decisions put to Robert:** where thoughts live; what scores; graded relations authored or computed;
  the policy for facts the story withholds.

## Round 37 (2026-10-15): the gap analysis agreed; the annotated reading as data

- **Decisions (Robert accepted the gap analysis's recommendations, §6):** thoughts live in their own file that
  points to the case's cards; deductions and sealed predictions made before Holmes score, notices score only in
  aggregate by later use, watch-holmes and genre moves only hint, wrong turns cost nothing; supports and strains
  are authored first (from the annotation) and computed later from explains-links; facts the story withholds stay
  withheld and are marked, the bill's items being the one to discuss (the dress test is unplayable without them).
- **Workstream 1 built.** `cases/silver-blaze/thoughts.json`: 284 thoughts and 24 background cards, one per line,
  converted once from `docs/reading-annotated.md` (id with its earliest paragraph, scene, tag, subtype, confidence,
  profile, premises, typed relations with set members, Holmes's paragraphs, quotes, hindsight, prose) plus a
  crosswalk `maps` to the case cards that hold each thought: claims for 87 of the 92 RECORDs (matched by quote, the
  rest by hand: actions and rules), claims, rules, inferences, question slots, actions, route steps and theories for
  the others, rules for 16 of the 24 background cards. From now on the JSON is the data and the Markdown the prose.
- **`engine/thoughts.js`** (`checkThoughts`): ids carry their paragraph and scene; tags, subtypes, confidence,
  profile known; premises and relation targets exist and come no later; every quote found and none ahead of its
  thought; a relation to a set member names a candidate the target lists; `maps` resolve; the data mirrors the
  annotation's ids and tags. Reports coverage by tag, RECORDs the game deals later than the reader has them, and
  background cards with no rule. `scripts/validate-thoughts.js` (`npm run validate-thoughts`) writes
  `cases/silver-blaze/thoughts-report.md`; `engine/thoughts.test.js` runs the checks and three negative cases. 47 tests pass, about 120 s.
- **What the checks found in the annotation:** ¶70 belongs to s04 (the ¶69–¶70 block moved there); `t92.1`
  quoted Holmes's "that quite settles it", which is ¶93 (`t92.4` now gives ¶93 as a Holmes paragraph); two set
  members named no candidate; four quotes carried their speech tags. All fixed in the Markdown before conversion.
- **What the report shows about the case:** coverage is high where the format is strong (RECORD 87/92,
  HYPOTHESIS 22/27, TEST 22/30, INFER 15/21) and near nothing where the gap analysis said so (WEIGH 3/17, GENRE
  3/20, SOURCE, RESIDUE, SET ASIDE 0). Four RECORDs are dealt late: Holmes's "not yet found" at ¶14 has its card
  only at ¶37; the doubled track's turn (¶122) and return (¶123) share one claim dealt at ¶124; the photograph a
  paragraph late. Eight background cards have no rule (one culprit, the two genre conventions, the drug paper, the
  alarm, the coat taken off to work, the alias's post, the guilty denial).
- **Next:** workstream 2, short chains: the INFER, DEFAULT, AGENT, PHYSICAL and IDENTIFY thoughts become small
  verified inferences citing other thoughts; the route becomes chains of them; the two dates replace the gates.

## Round 38 (2026-10-15): short chains, the options

- **`docs/short-chains.md`** (discussion): four questions for workstream 2, each with options and a
  recommendation. Q1, how a thought becomes checkable: map each deduction-type thought to one authored inference
  whose premises are its cited thoughts' cards (recommended), versus logic in the thought file, versus no authored
  inferences. Q2, the 54 existing inferences: split and re-cite chain by chain (recommended), versus keeping both,
  versus regenerating. Q3, the gates: from the thoughts' Holmes paragraphs, with the earliest date checked against
  the engine and `route.json` retired, plus scoring (recommended), versus scoring only, versus keeping the route
  with chained premises. Q4, steps the engine needs but a reader makes unnoticed (20 inferences match no thought,
  mostly the night's bookkeeping): implicit inferences granted when their premises are held, visible and doubtable,
  folded into rules where cheap (recommended), versus thoughts for each, versus rules only.

## Round 39 (2026-10-15): short chains agreed; a world model

- **Short chains** (`docs/short-chains.md`): Robert accepted the recommendations. Each deduction-type thought maps
  to one authored inference citing its premise thoughts' cards; flat inferences are split and re-cited chain by
  chain; the gates come from the thoughts' Holmes paragraphs (earliest dates checked against the engine,
  `route.json` retired) with scoring of deductions made before Holmes; inferences with no thought are `implicit`,
  granted when their premises are held, visible and doubtable.
- **The world model (Robert):** the game should have a timeline on which the player places cards (where each thing
  was at each time), moves them, marks a cell unknown or holds several hypotheses, and the idea should extend
  beyond location and time to actions, knowledge and intentions. Agreed design in `docs/world-model.md`: sparse
  **state** questions (one thing, one time window, one aspect: location, possession, condition first; knowledge,
  intention, belief second), general rules tying states to events (agents are where their acts happen;
  persistence; one place at a time; conditions last from cause to end), claims filling states from their own
  lines; the timeline as rows of followed entities by the 27 time windows, each cell a question with the usual
  marks (place = circle, unknown = open, several cards = several hypotheses), checked by the existing difficulty
  options, proven placements citable, named hypotheses as layers stored as theories.
- **Order:** the chains first; then the states, re-deriving the night's bookkeeping (Q5 of `short-chains.md`: the
  implicit list is provisional); a minimal timeline view early; layers; then knowledge, intention and belief; the
  full board with the UI workstream.

## Round 40 (2026-10-15): the timeline's layout; handing over

- **Layout (Robert):** rows for times and columns for places, or the other way round; try both, or make it a
  setting. Recorded in `docs/world-model.md`: two layouts over the same state questions, *by place* (rows the
  time windows, columns the places plus "unknown", a cell holding whoever and whatever is there) and *by thing*
  (rows the followed entities, columns the windows), chosen by a setting; both built with the first timeline view.
- **Handover:** this session (annotation, gap analysis, thoughts as data, the rulings of Rounds 33–35, the designs
  of Rounds 38–40) ends here; the next session builds workstream 2 from `docs/kickoff-short-chains.md`.

## Round 41 (2026-10-15): short chains, step 1 — the checker

- **`inference` on thoughts** (`thoughts.json`): a deduction-type thought (INFER, DEFAULT, AGENT, PHYSICAL,
  IDENTIFY: 40) names its one authored inference, separate from `maps`. Set now where an existing inference
  already is the thought's step (11): `t29.3`, `t37.4`, `t37.7`, `t46.2`, `t92.14`, `t96.1`, `t114.2`, `t124.2`,
  `t127.3`, `t140.2`, `t198.2`. Where a thought maps to two inferences, or its inference is the conclusion of a
  later thought too (`t37.8`, `t81.5`, `t84.6`, `t97.2`, `t175.1`, `t37.5`, `t120.1`), its chain decides.
- **`implicit: true`** on inferences (schema): granted when its premises are held, never gates, never scores (Q4).
  None marked yet.
- **Checks** (`engine/thoughts.js`, `checkChains`): `inference` only on deduction tags and only to a known
  inference (errors); an inference marked implicit that a thought names (error); an inference that no thought
  names and is not implicit (a warning; an error under `implicitRequired`, to be switched on once the chains are
  done); an inference named by two thoughts; premises agree, both ways: each cited thought or background card
  stands for some premise card (its inference, its `maps`, a `bk.*`'s rules), and each premise is stood for by a
  cited item. A character's wrong reasoning (`truth: false`, the police's four) needs no thought (ruling 6) and is
  listed apart.
- **Earliest date:** the story read through with background facts arriving where relevant; an inference is
  available once all its premises are (recursively, whether or not a character states it then); a thought whose
  inference becomes available after the thought's paragraph is a miss.
- **Report** (`thoughts-report.md`, "Short chains"): one row per deduction (inference, the thought's paragraph,
  dealt, cited-not-a-premise, premise-not-cited), the shared, implicit, unnamed and wrong-reasoning lists.
- **What it shows now:** 11/40 deductions have an inference; all 11 disagree on premises, as expected of flat
  inferences (e.g. `k.drugged_after_set_aside` lists the curry, the supper and two rules that `t37.4` reaches
  through `t37.3`); 39 inferences are neither named nor implicit. Two earliest-date misses: `t92.14` (Straker
  practised first, ¶92) uses `k.practice_first`, which needs the lame sheep (¶173): the sheep chain splits the
  prediction from its confirmation; `t127.3` (only Brown could have hidden him, ¶127) uses
  `k.first_up_and_no_subordinate`, whose `c.no_subordinate` is dealt at ¶146: the Mapleton chain.
- **Logs:** reveal and foreshadow logs and the case report unchanged; only the thoughts report gained its section.
  Tests: one new (`engine/thoughts.test.js`, negative cases and two dates).

## Round 42 (2026-10-15): short chains, chain 1 — the curry

- **Ruling (Robert): a rule the inference applies is its warrant** and need not be cited by the thought; claims
  and inference premises must agree both ways, and a cited `bk.*` must stand for a premise. The `bk.*` cards keep
  their purpose (knowledge that differs between an 1892 and a modern reader).
- **Checker refinements:** the earliest date also waits for the event cards the conclusion speaks of (before that
  the player has no question to answer, and a card stating it would deal them early); a thought may explain an
  accepted miss in `date_note`; a cited thought no card holds yet (a NOTICE, a WEIGH) and an implicit premise
  (bookkeeping) are listed apart, not as mismatches.
- **Engine:** an `implicit` inference is granted when its premises are held, at every level (`how: 'implicit'`,
  shown as "Follows from what you hold"), and is never offered to build. An inference the game grants by itself
  (implicit, or anything in Trivial) waits until the story has dealt the events its formula speaks of: before, it
  dealt them early (in Trivial, `k.straker_home_all_evening` brought the drugging card at ¶32, four paragraphs
  before Hunter's charge). `activeConstraints` closes the known cards over inferences (premises known cover an
  inference, and an inference citing it, and so on), so a re-cited inference counts wherever its flat ancestry
  did: route steps, `stepNeeds`, hints.
- **The chain** (all verified; 47 verified, 10 asserted):
  - `t20.6` → `k.drugged_in_food` (new): the lad drank only from the stable tap, so a drug was in his food
    (`c.no_liquid`, new rule `r.tap_water_not_dosed` over a new trait *running water* on the tap, relevant with the
    opium at ¶37). Dealt at ¶37 against the thought's ¶20: explained (the drugging has no card before ¶36; Holmes
    never states it, so it neither gates nor scores).
  - `t37.4` → `k.drugged_after_set_aside` (re-cited): the household's dish, the portion's opium, the curry, and the
    implicit `k.portion_dished_at_supper` (new: the portion was taken from the dish at the house at nine, by
    `r.set_aside_at_the_meal`); formula now the order alone. `e.portion_set_aside` was first dealt at ¶218, which
    made the thought unplayable at ¶37: it now appears at ¶37 ("Hunter's portion is taken from the household's
    dish", quoting "the people at the house partook of the same dish"; `c.household_same_dish` names the portion),
    and keeps Holmes's label at ¶218. Annotation: `t37.4` also cites `t20.2` (the supper was the dish).
  - `t37.7` → `k.drugger_knew_the_menu` (new): opium's taste, the curry, the coincidence: the drugger knew the
    menu. Annotation: cites `t37.3` and `t20.2` as well.
  - `t37.8` → `k.drugger_knew_the_dish` (re-cited: `k.drugger_knew_the_menu`, the household, the stranger's ready
    paper `c.bribe_to_edith`, `r.menu_known_at_home`): the drugger was of King's Pyland. Annotation: cites `t19.1`
    (who the household are). Route `i.not_simpson_drugger` gains `c.bribe_to_edith`.
  - Implicit (bookkeeping): `k.portion_dished_at_supper`, `k.portion_set_aside_before_edith`,
    `k.drugged_in_house_means_before_nine_five`, `k.straker_home_all_evening` (asserted: the editorial reading of
    the evening; the world model should re-derive it).
- **Moved:** reveal log: the tap's gloss at ¶20, its rule at ¶37; `e.portion_set_aside` and its three questions at
  ¶37 instead of ¶218; the implicit inferences appear (Easy) at ¶36–¶37. Foreshadow log: the same, nothing early.
  Case report: the chain's inferences; no gate, need or question-table change; quoted-late unchanged (18). Thoughts
  report: 15/42 deductions have an inference, premise disagreements 11 → 9; curry thoughts all agree and are dealt
  on time.
- **Ruling (Robert): Holmes's steps that no thought makes get reader thoughts** (marking them implicit would hand
  the player Holmes's conclusion). Added to the annotation and the data: `t37.14` (DEFAULT·period: in a one-maid
  household the master or mistress chooses supper; → `k.menu_choosers`) and `t37.15` (DEFAULT, weak: if the
  drugger *chose* the dish, it is Straker or his wife; strains the maid of `t37.9`, who survives through `t37.7`'s
  "knew" until `t92.7`; → `k.drugger_chose_the_dish`). Both Holmes ¶218. 42 deduction-type thoughts now.
- **Test:** the cross-out test builds both curry conclusions, as connecting the flat premises used to (the menu
  inference alone clashes with the police's "Simpson drugged" and is set aside with it). The test helper builds
  a chained inference's premise inferences first. 49 tests pass, about 118 s.

## Round 43 (2026-10-15): short chains, chain 2 — the key and the door

- **Model:** the night's entry (`e.stable_entered`) gains an `instrument` facet ("With what?"), recorded as one of
  the stable key and a duplicate (the story never says whose key it was: left open, 143 slots so). Both keys carry a
  new trait *key* ("A key to the stable door"). `r.locked_door_needs_key` gets a schema (a door locked before an
  opening is opened with a key; text now "with a key, from outside or from inside"); new `r.opened_between` (a
  door locked at night and found open in the morning was opened in between, relevant at ¶33).
- **The chain** (all verified; 51 verified, 10 asserted):
  - `t31.3` → `k.later_entry_needs_key` (new): locked door, window too small: whoever came in by the door
    afterwards had a key. Dealt at ¶33 against ¶31: explained (the entry has no card before the open door).
  - `t33.2` → `k.door_opened_with_key` (new): that conditional, the door found open at seven: it was opened with
    a key. Annotation: cites `t31.3` as well.
  - `t37.5` → `k.taker_had_a_key` (new): the key, and the horse led to the hollow by the one who came in.
    Bookkeeping, implicit: `k.entrant_took_the_horse` (new; whoever came in took the horse, by `r.taker_entered`)
    and `k.led_by_taker` (now implicit). Annotation: cites `t37.1`, `t33.2` (was `t37.1`, `t33.1`, `t31.3`).
  - `t46.2` → `k.bridled_by_taker` (unchanged). Annotation: cites `t33.1` (the empty stall) instead of the police
    theory `t46.1`; the bridle is its own reading. Checker: a deduction holds the claims it maps to itself.
- **Moved:** `r.taker_entered` relevant at ¶33 (the open door, was ¶46) and `r.taker_leads_on` at ¶37 (the
  hollow, was ¶46), so the implicit steps come where the reader has the facts; both plain common sense. Reveal log:
  those rules, the new rule and trait, the "With what?" question at ¶33, `k.entrant_took_the_horse` at ¶33 and
  `k.led_by_taker` at ¶37 (was ¶46). Foreshadow log: the same. Case report: the chain's inferences, one more slot
  left open; no gate, need or question-table change. Thoughts report: 18/42 deductions have an inference.

## Round 44 (2026-10-15): short chains, chain 3 — the dog

- **No deduction-type thought held Holmes's step** (`k.dog_knew_the_visitor`, ¶219): the annotation has the
  hypothesis set (`t34.4`: drugged, barked unheard, someone it knew) and Holmes's TEST (`t219.1`). Under the ruling
  of Round 42, a reader thought is added: `t34.7` (DEFAULT, fair, careful; from `t34.2`, `t29.1`, `t33.1`,
  `bk.guard_dog`; supports `t34.4 (knew)`; Holmes ¶219) → `k.dog_knew_the_visitor`, unchanged (already short;
  verified). Premises agree; dealt at ¶34.
- **Still open, workstream 5:** `c.dog_did_nothing` is dealt at ¶34, so the game makes the absence (`t34.2`) for
  the player.
- **Moved:** nothing in the reveal or foreshadow logs or the case report; thoughts report 19/43.

## Round 45 (2026-10-15): short chains, chain 4 — the knife

- **Model:** a new question "Why did Straker take the knife?" (`e.knife_taken.purpose`: to defend himself, for
  some delicate work), raised by Holmes's "A strange thing for a man to carry with him upon a rough expedition"
  (¶81), both readings offered there. The knife's taking (`e.knife_taken`) now appears at ¶35 ("Straker has a knife
  with him", quoting "in his right hand he held a small knife"; `c.knife_in_right_hand` names who took what) and
  keeps the dressing-table label at ¶82: before, the question could not exist until ¶82, a paragraph after the
  reader's thoughts. `r.cataract_knife_use` is split: a cataract knife is no weapon, so a man who takes one takes it
  for delicate work (`t81.4`); new `r.operation_on_the_horse`: a man who takes a blade for delicate work out to a
  horse at night means an operation on it (`t81.5`). Same content, now two steps.
- **The chain** (all verified; 52 verified, 10 asserted):
  - `t81.4` → `k.knife_not_a_weapon` (new). Annotation: cites `t35.4` (the knife in his hand) as well.
  - `t81.5` → `k.knife_for_an_operation` (re-cited: `k.knife_not_a_weapon`, `k.operation_in_the_open`,
    `r.operation_on_the_horse`): if Straker took the horse, it was to injure it, away from the stable. Annotation:
    no longer cites the hypothesis `t46.4`, which is the conditional's antecedent, not a premise; its prose says so.
  - `t81.3` (the HYPOTHESIS "why carry it") now maps the new question; `t57.3` holds `k.operation_in_the_open`
    (still asserted). Checker: a cited thought that holds a question the inference (or a premise inference)
    answers counts as agreeing.
- **Gates:** a script compares each route step's gate paragraph and needed inferences (scratchpad, against a
  worktree of HEAD and of the session's first commit): no gate moved in chains 1–4; `i.done_in_the_open` needs one
  inference fewer (`k.operation_in_the_open` is now inside `k.knife_for_an_operation`'s chain). Route steps citing
  the knife rule gain `r.operation_on_the_horse` and `c.knife_in_right_hand` (and two, the hollow's rules).
- **Moved:** reveal log: the knife's taking and its four questions at ¶35 (was ¶82), the new question and both
  options at ¶81, the split rule's two texts at ¶80 (where the old one was). Foreshadow log: the same. Case
  report: the new question in the table (settled in every column but Strict), the chain's inferences. Thoughts
  report: 21/43 deductions have an inference.
- **Slip and fix:** the chain was committed and pushed with the fair-play test failing under all three background
  settings (the commit command did not wait on the test's exit code). The test counted a needed inference's
  premise inferences (`k.knife_not_a_weapon`, `k.operation_in_the_open`) as "not yet available"; it now expands
  premises down the chain, as its helper builds them. Fixed in the next commit; from now on a commit runs only
  after `npm test` exits green.

## Round 46 (2026-10-15): short chains, chain 5 — the bill and the second household

- **Ruling (Robert): the bill's items stay withheld; the reader infers the dress link from Holmes.** Holmes read
  the bill item by item (¶85) and then asked about one costume (¶91–¶92); a heuristic rule
  `r.asks_about_what_he_read` ("When a detective who has just studied a document item by item asks a witness about
  one particular thing, that thing is in the document") lets the reader conclude that the dove-coloured silk is
  among the clothes on Derbyshire's account. Worded generally and shown with the reasoning notes from ¶12 (as
  `r.no_coincidence` is): on the costume's own card it read as a pointer to the step. Before, Mrs. Straker's
  denial (`c.wife_never_had_dress`) asserted outright that the billed clothes did not go to her, so the game made
  the reader's link (`t92.2`) for them.
- **Model:** the dove silk loses the `fiction_within_story` flag (the garden-party is Holmes's fiction, the
  costume is real: it is on the bill), gains a gloss trait *asked about* and a question "Who had a dove-coloured
  silk costume?" (answer: Mrs. Derbyshire); the denial now says only that it was not Mrs. Straker.
- **The chain** (all verified; 54 verified, 10 asserted):
  - `t84.9` (new reader thought, DEFAULT, Holmes ¶225, under the Round 42 ruling) → `k.bill_is_his_own`.
  - `t84.6` → `k.derbyshire_is_straker` (new): his own bill, made out to Derbyshire. `k.bill_names_its_debtor` is
    implicit (bookkeeping). Annotation: cites `t84.9` instead of `t84.3`.
  - `t92.2` → `k.dove_silk_on_the_bill` (new). Annotation: cites `t84.1`, `t85.1`, `t85.2`, `t92.1`; `t92.1` maps
    Holmes's ruse claim too.
  - `t92.4` (TEST) → `k.dresses_for_the_other_woman` (re-cited on `k.dove_silk_on_the_bill`). The checker now
    lets a TEST that concludes name its inference. Annotation: cites `t92.1`, `t85.1` as well.
  - `k.second_household` re-cited on `k.dresses_for_the_other_woman` (it relied on the denial's old reading);
    still held by `t84.7` (NOTICE·calculate), left for "the rest". Route `i.debt_motive` gains the ruse, the new
    rule and `r.no_finery_for_servants`.
- **Gates:** none moved, no need changed (script against HEAD).
- **Moved:** reveal log: the new rule at ¶12; the dove silk's gloss and question at ¶91; `k.bill_names_its_debtor`
  (implicit) at ¶84; the other-woman inference's label. Foreshadow log: the same. Case report: the chain's
  inferences, the new question (unique). Thoughts report: 25/45.

## Round 47 (2026-10-15): short chains, chain 6 — the coat and the vesta

- **Model:** a new question "Why did Straker take off his coat?" (`e.coat_off.purpose`: to fight, to have his
  arms free for some work), raised by Holmes's "it was laid across the bush" (¶97); Holmes answers it at ¶226 ("taken
  off his overcoat in order to do his delicate task"). `bk.coat_work` gets its rule, `r.coat_off_to_work` ("A man
  takes his coat off to work with his arms free, not to stand in the rain, and not in the middle of a fight"),
  shown where the coat first appears (¶35, with `r.wind_and_coats`). Shown at ¶97 it sat beside the question it
  answers; a first wording ("lay his coat across a bush") ran ahead of Holmes's finding at ¶97.
- **The chain** (all verified; 55 verified, 10 asserted):
  - `t96.1` → `k.coat_placed`, trimmed to its own step: no wind, so the coat was put there by the man who wore it
    out (the "before the blow" part moves on). Annotation: cites `t32.2` (he left in his mackintosh).
  - `t97.2` → `k.coat_off_to_work` (new): he laid it there himself, before the blow, to work. Annotation: cites
    `t35.2` (the blow) as well.
  - `t102.2` (TEST) → `k.vesta_from_strakers_box` (unchanged). Annotation: cites `t78.1` (his vesta box) and
    `t35.2`.
- **Gates:** none moved, no need changed. **Moved:** reveal log: the coat rule at ¶35, the new question and both
  options at ¶97, `k.coat_placed`'s label. Foreshadow log: the rule at ¶35. Case report: the new question
  (settled in every column but Strict), the chain's inferences. Thoughts report: 27/46.

## Round 48 (2026-10-15): short chains, chain 7 — Mapleton and Brown

- **Model:** King's Pyland and Mapleton carry a trait *training stable*; new heuristic rule `r.hidden_among_horses`
  ("A famous horse is known on sight: one that goes missing and is not seen on open country is hidden among other
  horses, at a stable"; `bk.famous_horse` now maps it too), shown where Holmes raises concealment (¶14). A first
  wording added "then at another training stable within reach", which spelled out the reader's step at ¶19.
  Gregory's gypsy theory lacks the rule (`holder_lacks`), as it lacks the curry's and the dog's.
- **The chain** (all verified; 59 verified, 10 asserted):
  - `t19.5` → `k.at_a_stable_in_reach` (new): if he is not at King's Pyland, he is at Mapleton (the reader's
    conditional at ¶19; the horse's absence from King's Pyland has no card before ¶37).
  - `t40.4` → `k.horse_at_mapleton_by_reach` (new): with "no news of him" (`c.no_news_of_horse`, ¶37). Annotation:
    cites `t37.2`. Holmes reaches Mapleton by another route (¶116).
  - `t114.2` → `k.horse_goes_home`, split: the horse instinct alone (bound to the horse loose in the hollow);
    the gypsies' part is `t62.3` → `k.gypsies_did_not_take_him` (new). Premises now agree.
  - `t120.1` → `k.horse_left_alone` (new, the reading of the two tracks): he bolted from the hollow alone and
    was met later. It no longer points at the flat `k.night_sequence` (left for the bookkeeping).
  - `t124.2` → `k.tracks_end_at_mapleton` (unchanged). Annotation: cites `t117.1` (the track in the hollow).
  - `t127.3` → `k.first_up_and_no_subordinate`, re-cited (the tracks into Mapleton, Brown first stirring, Brown
    its master): unconditional now, and dealt at ¶127. It waited for Holmes's "no subordinate would have dared"
    (¶146), which the rule's text carries. Annotation: cites `t127.1`, `t19.3` (which maps `c.mapleton_brown`).
  - `t140.2` → `k.brown_broke` (unchanged). Annotation: cites `t140.1` only; `t124.2` and `t111.2` corroborate,
    they are not premises.
  - `t116.2` (PHYSICAL: hard ground takes no tracks) has no inference: it explains an absence of tracks and
    settles no question (workstream 6, explains-links). Listed for Robert at the end of the chains.
- **Gates:** none moved; `i.brown_hid_horse` needs one inference fewer (the tracks are inside the chain now).
  Route `i.horse_at_mapleton` and `i.horse_disguised` gain `c.horse_was_in_hollow`.
- **Moved:** reveal log: the training-stable glosses at ¶19, the new rule at ¶14–¶18, two inference labels.
  Foreshadow log: the same. Case report: the chain's inferences. Thoughts report: 31/46, two earliest-date misses
  left (`t29.3`, `t92.14`).

## Round 49 (2026-10-15): short chains, chain 8 — the disguise

- **The chain** (all verified; 60 verified, 10 asserted):
  - `t148.2` → `k.disguised_to_survive_search`, split like `t114.2`. It now says only "if he is at Mapleton, he
    is disguised", a slot on the horse, so it can be made at ¶148 (dealt ¶66, where Gregory reports the search).
    It no longer needs `c.silver_blaze_markings`, which is not told until ¶146–¶186. The details of the event
    (the hider did it, with dye, at Mapleton) are a new bookkeeping inference, `k.disguised_by_hider` (implicit),
    which waits until ¶202 deals the event. Annotation: cites `t66.1` (the search). `t148.1` maps
    `r.disguise_washes_off`: its quote is the rule's source.
  - `t198.2` → `k.bay_is_ross_entry` (id kept), extended: the bay is Silver Blaze *and* his markings are hidden.
    Its premises are what the reader cites: the colours (`t198.1`), the race card (new RECORD `t191.1`),
    Bayard scratched (`t192.1`), Desborough not Ross's (`t66.1` now also reads "As Desborough, their horse, was
    second in the betting"), the markings (`t186.1`), and `k.markings_identify`, now implicit, for the
    bookkeeping. `c.all_six_there`, `c.silver_blaze_record` and `c.two_horses_for_cup` were not needed.
    `t141.1` maps `silver_blaze.disguised`.
- **Gates:** `i.bay_is_silver_blaze` moves from ¶198 to ¶199: the disguise needs "not a white hair" (¶198).
  The route step's premises follow the inference (the markings in, the three unneeded claims out).
- **Moved:** reveal log: `k.disguised_by_hider` and two inference labels. Foreshadow log: nothing. Case report:
  the new inference and the route step's premises. Thoughts report: 32/46, `t148.2` and `t198.2` agree
  with no unmatched premise; two earliest-date misses left (`t29.3`, `t92.14`).

## Round 50 (2026-10-15): short chains, chain 9 — the horse as killer

- **Rule wording:** `r.startled_horse_kicks`, shown from ¶18, read "A horse startled from behind — by a sudden
  glare, say — lashes out …; a shod hoof can kill a man. A light struck beside a horse in the dark, and a man
  found struck down there: the horse lashed out." That spelled out the solution's step. It now reads only "A
  horse startled from behind lashes out with its hind feet; a shod hoof can kill a man."
- **The chain** (all verified; 60 verified, 10 asserted):
  - `t37.13` (HYPOTHESIS, expert, ¶37) proposes the horse; it maps `k.horse_kicked` and needs no inference of
    its own.
  - `t102.4` (INFER, expert, high hindsight; new under the Round 42 ruling) → `k.horse_kicked`: a match struck
    beside the horse in the dark, one blow to the head, and a startled horse kicks. From `t102.1`, `t37.1`,
    `t35.2`, `bk.horse_kick`. Holmes ¶226. The inference drops `r.light_hidden_in_hollow`, which explains the
    choice of the hollow, not the kick.
  - `k.blow_needs_a_wielder` (editorial) is implicit. Granted at ¶40, it raises "Whose is the heavy stick?",
    which the same paragraph answers.
  - `t120.2` ("nobody left the hollow with the horse; consistent with no human killer, not proof") has no
    inference: it supports and settles no question, like `t116.2`. Listed for Robert at the end of the chains.
- **Gates:** none moved.
- **Moved:** reveal log: the rule's wording at ¶18, `k.blow_needs_a_wielder` and the stick question at ¶40, a
  label. Foreshadow log: the rule's wording (fewer untold words). Case report: nothing. Thoughts report: 33/47.

## Round 51 (2026-10-15): short chains, chain 10 — the sheep

- **Leak fixed:** `r.practise_first`, shown as background from ¶12, read "… practises it first on something that
  does not matter: the lame sheep are the practice for the operation on the horse, and the plot came before the
  practice." The sheep are not mentioned until ¶173. It now reads only the general fact (up to "does not
  matter"). This was the second rule text in two chains to spell out the solution (`r.startled_horse_kicks`,
  Round 50): the other early-shown rule texts get a scan after the chains.
- **The chain** (split as the kickoff asks: the prediction apart from the confirmation; 61 verified, 10
  asserted):
  - `t175.1` → `k.sheep_lamed_by_hand` (new): if Straker took the horse out to operate on him
    (`k.knife_for_an_operation`, held by the cited `t81.5`), three sheep gone lame are someone's doing. Dealt ¶173.
  - `k.practice_first` (Straker practised on the sheep, in the paddock, before the plot's night) is implicit
    now: the practice event has no card until ¶228.
  - `t92.14` (AGENT then PREDICT, ¶92: "he practised on something first") no longer names `k.practice_first`
    (dealt ¶228, a miss). Its conclusion is about an event with no card yet, so it is played as its action
    (`a.ask_about_sheep`) and scored by `t173.2`. Listed for Robert with `t116.2` and `t120.2`.
- **Test:** the checker test read `t92.14`'s late date from the case; it now names `k.practice_first` on a copy.
- **Gates:** none moved. `i.practised_on_sheep` needs `k.sheep_lamed_by_hand` in place of
  `k.knife_for_an_operation` and `k.practice_first`.
- **Moved:** reveal log: the rule's wording at ¶12, the new inference. Foreshadow log: the rule's wording.
  Case report: the new inference. Thoughts report: one earliest-date miss left (`t29.3`), one premise
  disagreement left.

## Round 52 (2026-10-15): rule texts shown early, trimmed to their general fact

Robert's ruling: trim now, in a commit of its own. The scan after Round 51 ranked every rule shown before the
story raises its subject by its untold words. Four of them spelled out the solution's step (the fault Rounds 48,
50 and 51 fixed one at a time). Each is cut back to its general fact. Their schemas, which are the inferences'
warrants, are unchanged.
- `r.searched_and_not_found` (¶18): was "Where the police have searched and found nothing, though the horse they
  sought is there and a child would know it, its markings have been hidden there by the man who hides it: a
  horse-faker's trick." Now: "Searchers know a horse by its markings: if his markings are hidden, they can look
  straight at him and not know him."
- `r.planned_the_dish` (¶12): was "A man who brings a drug that must be hidden, on the one night a dish that hides
  it is served, arranged for that dish: he is one of those who decide what the house eats." Now: "A plan that
  needs a particular thing at hand on a particular day is made by someone who can see to it that it is."
- `r.laying_against` (¶18): the clause "whoever took the horse out to lame it had plotted it and laid his money
  beforehand" is cut.
- `r.horse_would_wake_sleepers` (¶18): the clause "work that would hurt it is done away from them" is cut.
- Left as they are (borderline, plain period knowledge): `r.tendon_nick` (¶18) and `r.horse_gregarious` (¶18,
  "that is where it is").
- **Moved:** the four texts in the reveal and foreshadow logs (fewer untold words). Gates, case report and
  thoughts report: nothing.

## Round 53 (2026-10-15): short chains, the rest 1 — the night

- **Holmes's step gets a reader thought** (Round 42 ruling): `t37.16` (INFER, typical, ¶37) →
  `k.drugger_took_the_horse`: the lad on guard was drugged and by morning the horse was gone, so he was drugged so
  the horse could be taken; whoever drugged him took the horse, after he had eaten and after he sent word of the
  tout. From `t37.3`, `t33.1`, `t20.1`, `t32.1`; Holmes ¶220.
- **Bookkeeping marked implicit** (the night's timing and order, no step a reader notices making):
  `k.visitor_is_taker`, `k.went_out_to_the_stables`, `k.straker_went_out_first`, `k.hunter_was_drugged`,
  `k.lads_slept`, `k.wife_stayed_home`, `k.found_before_seven`, `k.night_sequence`, `k.hollow_order`,
  `k.cravat_worn_at_window`. Each is now granted where its premises are held (¶33, ¶37, ¶60, ¶102, ¶119), not
  where Holmes states it. Their labels were read against those paragraphs. `k.visitor_is_taker`'s label quoted
  Holmes's later "the midnight visitor" and now reads "Whoever came into the stable in the night is the one who
  took out the horse."
- **Engine: an inference the game grants by itself waits for the entities it speaks of**, as it waited for the
  events (Round 42). `k.visitor_is_taker` speaks of `midnight_visitor.identity`; that entity is not dealt until
  ¶219, and granting it at ¶33 would have named it early. The checker's earliest date counts entities the same
  way (`t92.2` is now dealt at ¶91, where the dove-silk costume is dealt, not ¶89). Test: `game.test.js`, "an
  implicit inference waits for the entities it speaks of". The checker test's example of an unnamed inference
  (`k.lads_slept`, now implicit) is unflagged on its copy.
- **Gates:** none moved.
- **Moved:** reveal log: the ten bookkeeping inferences at the paragraphs above; `k.bill_names_its_debtor`
  later within ¶84. Foreshadow log and case report: nothing. Thoughts report: 34/48; 12 inferences left unnamed.

## Round 54 (2026-10-15): short chains, the rest 2 — Simpson, the knife, the cravat

- **The knife and the wound** (TESTs name their inference, Round 46):
  - `t41.2` → `k.knife_marks_assailant`: Simpson bears no wound, so Straker's knife did not cut him. It now cites
    the ¶35 records (`t35.4`, `t35.3`, `t35.2`); `t35.7`, the question it bears on, stays linked by "supports".
  - `t44.2` → `k.only_one_blade`, re-cited as the reader makes it: Watson's mechanism (`t44.1`, the source of
    `r.convulsions_after_brain_injury`, which it now maps) plus "no wound on Simpson" (`k.knife_marks_assailant`,
    held by `t41.2`). It no longer needs `c.simpson_no_knife` (¶56), which dated it after ¶44; the label is
    reworded to match. Route `i.self_wound` (Gregory, ¶54) gains `c.simpson_no_wound` and the two wound rules:
    his source line says both, "neither a knife nor any sign of a wound".
  - The case report's Strict column now leaves the thigh cut open (`cataract_knife`, `assailant_blade`): the step
    passes through a default rule ("a bloody knife usually wounded someone"). Watson calls the self-wound only
    "probable", so the defeasible reading is the honest one.
- **The cravat** (Round 42 ruling): `t60.4` (INFER, careful, ¶60, new) → `k.cravat_order`: the cravat is
  Simpson's and was in Straker's dead hand, so Simpson parted with it before Straker had it, after Straker left
  home at one and before he died. Holmes ¶226.
- **The police's framings marked implicit:** `k.simpson_purpose` (the three purposes) and
  `k.paper_held_opium_means_nobbling` (true conditionals and option lists, not steps). Granted at ¶26, the second
  would have tied the stranger at the window to Simpson before ¶40. It now also rests on
  `c.simpson_admits_visit`, which it needed anyway to speak of Simpson. Both come at ¶40, and so does
  "What was in the folded paper?" (`t24.3`'s question), which no card raised before.
- **Gates:** none moved.
- **Moved:** reveal log: the two framings, the paper and purpose questions at ¶40, a label. Foreshadow log:
  nothing. Case report: the Strict column above, the route step. Thoughts report: 37/51; 7 inferences unnamed.

## Round 55 (2026-10-15): short chains, the rest 3 — motive and the end

- **Named:** `t146.2` (TEST) → `k.boots_identify` (the square toes; it already held it).
- **Holmes's steps get reader thoughts** (Round 42 ruling):
  - `t46.7` (INFER, careful, ¶46, where Straker first comes under suspicion) → `k.drugging_is_dishonest`: if
    Straker drugged his own lad, it was for no honest purpose, and the horse went out for some harm. From the
    drugging and guard records and `t37.16`; Holmes ¶220.
  - `t92.15` (INFER, careful, ¶92) → `k.second_household`, split like the disguise (Round 49). It now says only
    "if Derbyshire is Straker, his motive is the second household's debts" (`straker.motive`, `t46.5`'s
    question), so it is dealt at ¶92. The events (he kept the establishment from before the dresses, and fell
    into debt) are a new bookkeeping inference, `k.second_household_kept` (implicit), granted at ¶229 when they
    are dealt. `t84.7` (NOTICE, ¶84) still holds the idea first.
- **Marked implicit:** `k.lame_plan` and `k.sent_over_by_hider` (order and identity bookkeeping, ¶229 and
  ¶204); `k.found_at_dawn` and `k.operation_in_the_open` (asserted, not derivable). Granted earlier now, two
  labels ran ahead and were reworded to say only what their formulas say:
  - `k.operation_in_the_open` (¶78, before the knife): "If the horse was taken out to be hurt, that was done away
    from the stable, where a hurt horse would not wake the sleepers and a light would not show."
  - `k.found_at_dawn` (¶127) named Brown as the man who met the horse, which is the player's own step
    (`t127.3`). It now reads "The man whose track joins the horse's met it at dawn, when the first man up is
    stirring, and led it in then."
- **Every inference is now named by a thought or marked implicit** (0 unnamed; the police's four stay apart).
- **Gates:** none moved.
- **Moved:** reveal log: the four implicit inferences and `k.second_household_kept`. Foreshadow log: nothing.
  Case report: the new inference (62 verified, 10 asserted). Thoughts report: 40/54, one earliest-date miss left
  (`t29.3`).

## Round 56 (2026-10-15): the chains closed — no-inference reasons, implicitRequired on

Robert's ruling on the deduction thoughts that can have no inference: **retag the ones that are not deductions,
mark the rest with a reason.**
- **Retagged** (both files): `t18.3` (laming would do as well) INFER → NOTICE; `t24.4` (a poisoner would not ask
  openly) AGENT → WEIGH; `t120.2` (consistent with no human killer, not proof) INFER → WEIGH; `t100.1` (the
  trampled mud) and `t116.2` (hard ground keeps no tracks) PHYSICAL → NOTICE, `also: PHYSICAL`.
- **`no_inference`**, a new field on a deduction that names no inference, says why:
  - `workstream-3` (a default to be defeated, or its revision): `t4.2`, `t68.3`;
  - `action` (a prediction played as an action, scored when confirmed): `t92.14`;
  - `world-model` (it needs a slot the case lacks yet): `t24.2` (the "lost" story is a cover), `t34.5` (no alarm
    raised), `t78.2` (not a robbery), `t82.3` (the blade unsheathed in the hollow), `t123.2` (meant to lead him
    home, then turned back), `t150.1` (Brown will keep him safe). A ready list for the world model.
- **Checker:** `no_inference` is one of the three reasons, on a deduction tag, never with an inference.
  `implicitRequired` is on in `validate-thoughts` and in the main test: an inference that no thought names and
  is not implicit is an error, and so is a deduction with neither an inference nor a reason. The thoughts report
  lists the reasons.
- **The last miss:** `t29.3` (Gregory's asserted conditional on the window, ¶29) gets a `date_note`: the game can
  pose it only once the drugging is told (¶36). It cites `t28.2`, which now maps the tip it reads
  (`c.stranger_asked_for_tip`).
- **State at the end of the chains:** 49 deduction thoughts, 40 with an inference and 9 with a reason; 0 date
  misses (3 explained); 0 premise disagreements; every inference named or implicit (the police's four apart);
  62 inferences verified, 10 asserted. The thought tags in `docs/gap-analysis.md` predate this; the counts
  above are current.
- **Moved:** thoughts report only (tag counts, the reasons). Reveal and foreshadow logs, case report, gates:
  nothing.

## Round 57 (2026-10-15): step 3, gates from the thoughts; route.json retired

Robert's rulings: (1) a route step whose answer no deduction thought concludes moves onto the thought that maps it,
as `concludes`; the steps with no thought are dropped; (2) a thought with an inference gates when the inference is
Holmes's own and not implicit, at its first Holmes paragraph (never before its premises are told); steps by Watson,
Gregory or the editor do not gate.
- **Engine:** `engine/steps.js` builds Holmes's steps from `thoughts.json` (named by `case.json`'s
  `thoughts_file`) in the shape `route.json` had; the story's gates, `stepNeeds`, `stepMade`, the 'wait' pace,
  the validator's step checks and the logic page read them. A thought's own inference is its step's need; a
  `concludes` step's need is the fewest inferences giving its conclusion, as before. Only Holmes's own steps have
  their inferences stated by Holmes (Gregory's window conditional, the editor's Mapleton steps and Gregory's
  self-wound no longer arrive as Holmes's; `k.only_one_blade` is built, no longer handed over at ¶54).
- **Data:** eleven thoughts carry `concludes` (formula, premises, Holmes's line), moved from the route:
  `t37.9` (drugger in the household), `t46.4` (Straker took the horse; its `_by_dog` twin had the same answer),
  `t220.3` (Straker drugged the lad), `t81.5` (the purpose was to injure), `t84.8` (the debt motive), `t173.2`
  (the sheep's cause), `t37.13` (the horse killed him), `t114.2` and `t117.2` (at Mapleton), `t127.4` (the man was
  Brown), `t141.1` (disguised). Route steps that a thought's inference already gives became that thought:
  `i.coat_placed` → `t96.1`, `i.not_simpson_drugger` → `t37.8`, `i.after_set_aside` → `t37.4`,
  `i.derbyshire_is_straker` → `t84.6`, `i.self_wound` → `t44.2`, `i.brown_hid_horse` → `t140.2` (its gate is now
  `t127.3`'s), `i.bay_is_silver_blaze` → `t198.2`. Dropped: `i.visitor_known_to_dog`, `i.straker_dishonest`,
  `i.done_in_the_open`, `i.simpson_innocent`, `i.cravat_is_simpsons`; where an action required or yielded one of
  the first three it now names the thought whose inference carries it (`t34.7`, `t46.7`, `t81.5`). The `i.*`
  entries leave the thoughts' `maps`. Actions use `requires.thoughts` and `yields.thoughts`.
- **How the gates moved** (old route → now): ¶96 coat → `t96.1` ¶96; ¶104 open air → `t81.5` ¶104 (by the mud
  search; now the purpose to injure); ¶111 Straker took the horse → `t46.4` ¶111; ¶116/¶117 Mapleton → `t114.2`
  ¶116/¶117; ¶125 tracks → `t117.2` ¶125; ¶147 Brown hid the horse → `t127.3` ¶146; ¶147 the man was Brown →
  `t127.4` ¶147; ¶148 disguise → `t141.1` ¶148; ¶161 Derbyshire → `t84.6` ¶161; ¶170 plan to lame → `t81.5` ¶170;
  ¶180 the dog → `t34.7` ¶180; ¶199 the bay → `t198.2` ¶202 (Holmes's paragraph); ¶202 killer and disguise →
  `t37.13`, `t141.1` ¶202; ¶218 Simpson not the drugger → `t37.8` ¶218; ¶219 the dog → `t34.7` ¶219; ¶220 →
  `t46.4`, `t220.3`, `t46.7` ¶220; ¶221 → `t81.5` ¶221; ¶223 open air: gone (dropped); ¶225 → `t84.6` ¶225;
  ¶226 → `t37.13` ¶226; ¶228 → `t173.2` ¶228; ¶229 → `t84.6`, `t84.8` ¶229. **New gates** (Holmes's own inferences
  at his paragraph): ¶57 `t31.3`; ¶93 `t92.4`; ¶114 `t62.3`; ¶146 `t124.2`; ¶204 `t148.2`; ¶218 `t37.4`, `t37.7`,
  `t37.14`, `t37.15`; ¶220 `t37.5`, `t37.16`; ¶221 `t81.4`; ¶224 `t102.2`; ¶225 `t84.9`, `t92.15`; ¶226 `t60.4`,
  `t97.2`, `t102.4`; ¶228 `t175.1`; ¶231 `t120.1`.
- **Fair play:** the 'wait' test replays the thought steps under all three background settings and passes. Tests:
  the route ids in `reasoning.test.js` and `game.test.js` became their thoughts; the wait-pace conclusion test
  builds a chained inference's premises first, as the fair-play helper does.
- **Schema and validator:** `route` and `routeStep` leave the schema; `thoughts_file` joins it; the report's
  section is "Holmes's steps (from the thoughts)" (all 51 ✓) and lists the Holmes steps no action yields. The site
  build copies `thoughts.json`. `docs/format-0.3.md` has an "As built" section for this round.
- **Moved:** reveal log: Holmes now states his inferences at their gates (¶93, ¶114, ¶146, ¶218–¶231), the
  `straker.honest` question comes with `t46.7`'s gate at ¶220. Foreshadow log: nothing. Case report: the steps
  section, 1009 quotes (the route's went). Thoughts report: the `i.*` maps gone from coverage.

## Round 58 (2026-10-15): step 4, scoring (engine)

- **What counts as made:** a thought (one of Holmes's steps, Round 57) is made by the player when their own
  reasoning gives it: every inference it needs built by them, or a conclusion or applied rule of theirs that covers
  its conclusion, or their proofs (proven values, values left alone by proven cross-outs; a clue's given value is
  not theirs) entailing it. Inferences stated by a character or Holmes, granted by the game, or implicit do not
  count, and nothing counts in Trivial.
- **When:** the game records the last paragraph read at the moment it first finds the thought made. It checks
  before each paragraph and whenever scores are asked for, only after a player's move (propose, apply, conclude,
  strike, prove), so reading stays fast. The record is saved (`made`, save version 6) and restored as saved.
- **Score:** a thought scores when it was made before its Holmes paragraph (the thought's Holmes paragraph, or the
  line of a conclusion Holmes draws). `thoughtScores()` and `score()` expose it for the UI (workstream 9); 44
  thoughts can score.
- **Test:** `game.test.js`, "scoring": building `k.drugger_knew_the_dish` at ¶39 makes `t37.8` (and `t37.7`,
  whose inference it cites) before Holmes's ¶218; the dog step Holmes hands over is not the player's; the record
  survives a save; Trivial scores nothing.
- **Moved:** nothing in the logs or reports (engine only).

## Round 59 (2026-10-16): hand-off to the world model

Workstream 2 is done (Rounds 41–58). `docs/kickoff-world-model.md` hands the next session steps 1–4 of
`docs/world-model.md`: states (location, possession, condition) in the format, the bookkeeping re-derived with
state rules, a minimal timeline in both layouts, and layers over theories. It carries the six `world-model`
thoughts, the traps this session met and the items still open for Robert. `CLAUDE.md` points at it.

## Round 60 (2026-10-16): world model, step 1 — states in the format

- **Ruling (Robert): the shape as proposed.** One track per line in a new part `states.json` (one thing, one aspect,
  its declared windows); each window a slot `st.<thing>.<at|held|condition>.<window>`; location over a named place set
  folded through the places' `within` (the entities already carried it), plus `elsewhere`; possession over holders,
  the set's places and `elsewhere`; conditions true/false. "Unknown" is no value: `null` for the case, an empty cell
  for the player. The older state-like slots (`silver_blaze.hidden_at`, `.disguised`, `simpson.wounded`,
  `simpson.out_in_storm`) stay as they are until step 2.
- **Engine:** `engine/logic.js` grounds a schema term `{state: [name, thing, time]}`: at a window, the slot (or nothing
  where none is declared); at a time slot (`?act.time`), a lookup over the declared windows whose outside value makes
  the comparison hold, so a window with no state is unconstrained, and its denial fails there. `same` with a place
  slot is expanded over that slot's values grouped by their folded place (the bedroom reads as the villa).
  `engine/caseModel.js` builds the tracks (`model.stateTracks`, `env.state`); variable specs `{window: true}` and
  `{condition: true}`. `engine/game.js`: a state's question also waits for its window's `reveal` line (its prompt
  names the window).
- **Rules** (`knowledge.json`, general, none applied yet): `r.agent_is_there`, `r.patient_is_there`,
  `r.holder_with_held` (hard), `r.stays_put`, `r.condition_lasts` (default, with their `unless`). One place at a time
  is the slot itself.
- **Data:** seven tracks, eleven states, each from its claim's own line (nine claims gain a conjunct;
  `c.hunter_stupor`, which asserted nothing, gains its `asserts`): Straker at one and in the morning, Mrs. Straker at
  one and at seven, the lads at seven, Hunter at nine and at seven and stupefied at seven, the overcoat at one and in
  the morning, the cravat in the morning.
- **Validator and schema:** the three sections, the `state` term and the new variable specs in the schema; place
  sets list places, a track's id matches its thing and aspect, no window twice, every declared answer stated by a
  claim or derived by an inference; uniqueness as for every slot. The report counts the tracks and lists the states
  with what gives each.
- **Test:** `reasoning.test.js`, "states": sparse slots, the folding, the lookup by time, undeclared windows free;
  on a copy with an open window at the stable hour, staying put in the loft until seven rules the lads out as the
  taker, and without persistence it does not.
- **Timings:** `npm run validate` 50 s before, 45–47 s after; `npm test` 221 s before, 207 s after (53 tests) (this machine
  runs both slower than the figures of Round 58; same machine, before and after).
- **Moved:** reveal and foreshadow logs: the five rule texts as background at ¶32 (four, with "found that he was
  dressing") and ¶33 (`r.condition_lasts`, with the stupor). Case report: counts, the States section, eleven more
  slots unique. Thoughts report and the gate listing: nothing.

## Round 61 (2026-10-16): world model, step 2 — the world's workings and the night re-derived

- **Rulings (Robert):**
  - The hard rules (whoever does a thing is where it is done; a holder is where the held thing is) are not rule
    cards but how the world model works by default, always on.
  - No hard-coded window splits. A window may be **split at an event** into the part before and the part after
    it, and split again inside a part; the window itself stays, and what is placed in it stays there until moved
    into a part. A cell means **throughout** its time: a thing that moves within a window has no single place in
    it. Which part an event falls in is an **order question** (before or after the splitting event), answered by a
    clue where the story tells it and otherwise left open; the true order is the events' fabula order. The case
    lists the splits its own reasoning needs (`state_splits`); the player will split any window (step 3).
- **Places, corrected:** a listed place means itself apart from the listed places inside it ("the stable" is the
  stable apart from its loft), so a place folds to the nearest listed place containing it. An overlap reading,
  tried in between, made the lads in the loft compatible with the horse led out of the stable.
- **Engine:**
  - `engine/caseModel.js` builds subwindows (`w.tue_0700.before.wife_wakes`) and order slots
    (`ord.<event>.<splitter>`, before/after) for every event whose time no trusted clue puts in another window.
    It also builds the world's **ties** (`k.world.*`): for each tracked thing and each event it may take part in, its
    state agrees with the event's place when it is the agent or patient. Order runs through (transitivity), and a
    nested splitter lies in its part. Ties are skipped where a clue gives the event to someone else or puts it in a
    window with no state, and where clues state who, when and where outright.
  - A tie is active wherever an active card speaks of its thing's states (`activeConstraints`, `stateThings`).
    Verifying an inference adds the ties for the things its formula or rule applications speak of.
  - `engine/solver.js`: ties are **lazy**. A check first runs without them, since what fails without them fails
    with them, and adds them only if it succeeds and its solution does not already keep them. An explanation
    keeps them as background, never as the clash.
  - `engine/game.js`: an order question waits to be raised; a part's state waits for the events that split it.
- **The night re-derived:**
  - **Gone:** `k.lads_slept` (the lads' own line, "they had heard nothing during the night", now places them in
    the loft through every night window, and the ties do the rest) and `k.straker_went_out_first` (Straker at home
    at one is a state; the ties and the taking's window give the rest).
  - **Rewritten:** `k.wife_stayed_home` now concludes states: at home in each night window, by `r.stays_put` from
    one o'clock. `k.found_before_seven` now carries when the horse was taken: after Hunter's message, before seven
    (the bound the old inferences each built in). Without it, "Straker is honest" clashed through two of the
    story's clues at once, and the clash rule set both aside.
  - **New, implicit:** `k.met_after_bolting`, the other half of the old `k.found_before_seven`.
  - **Retired:** `r.sleeper_stays_put`, `r.one_place_at_a_time` and the three hard-rule cards of Round 60.
  - **Stay as they were:** `k.hunter_was_drugged` (needs "a stupefied man does nothing", a condition-to-action
    default not yet in the world model) and the event-order bookkeeping (`k.night_sequence`, `k.hollow_order`,
    `k.cravat_worn_at_window`, ...).
  - The implicit list goes from 28 to 27.
- **The six `world-model` thoughts stay without an inference:**
  - `t24.2` (the lost story is a cover), `t123.2` (meant to lead him home, then turned back) and `t150.1` (Brown will
    keep him safe) are intention and knowledge (step 5).
  - `t34.5` (no alarm raised) needs what Straker would have done had he found the stall empty (intention).
  - `t78.2` (not a robbery): his money and watch on the body would be possession states, but "a robbery" is a
    motive question the case has no slot for.
  - `t82.3` (the blade unsheathed in the hollow) could be a condition, but it settles no question ("fits both
    readings").
- **Data:** `states.json` gains `state_splits` (seven o'clock at Mrs. Straker's waking), the lads' night
  windows and Mrs. Straker's (22 states). Five `concludes` steps cite `r.stays_put` for `r.sleeper_stays_put`.
- **Timings:** `npm run validate` 47 s → 74–77 s; `npm test` 207 s → 670 s. Most of it is Trivial play (an
  all-candidates batch per card, 2× per batch) and the clash search (22 s → 52 s at the end of the story). The ties
  join the night's events into larger search components. Pruning, laziness and background explanation brought the
  suite down from 1359 s; the rest is structural. Robert: accepted for now; the solver moves to a Web Worker with a
  progress display next, and incremental candidates come later.
- **Moved:**
  - **Reveal and foreshadow logs:** the five retired rule texts gone. `k.wife_stayed_home` comes at ¶33 with its
    new label, and `k.found_before_seven` where the old three came (¶37). Mrs. Straker's state questions appear as
    their windows are reached (¶33 to ¶126).
  - **Gates:** none moved; `t81.5`, `t46.4`, `t220.3` and `t173.2` need `k.found_before_seven` as well.
  - **Case report:** counts, states, 35 order slots, the Strict column for the killer 45 → 44, and one theory's
    minimal break.
  - **Thoughts report:** the implicit list.

## Round 62 (2026-10-16): the solver in a Web Worker, with progress

- **Ruling (Robert):** long waits are tolerable if the page shows progress; move the processing to a worker
  before the timeline view (agreed 2026-10-14 in principle, never built).
- **Design: answer quick checks on the spot, hand slow ones over.** The game's code stays synchronous.
  - `engine/remoteProblem.js`: a `RemoteProblem` wraps the page's own `Problem`. Each slow call (consistent,
    candidates, allCandidates, countSolutions, explainConflict) first runs here under a 60 ms budget (`deadline`,
    checked in the search loops; `OverBudget`).
  - Past the budget it throws `NeedSolve` with the request (method and arguments, plain data). `settle(fn)` catches
    it, has the worker answer, caches the answer by request, and runs `fn` again; the retry finds it in the cache.
  - The game's moves ask the solver before they change anything, so a retried move happens once. Two spots changed
    to keep that true: the scoring check (`#noteMade`) clears its "the player moved" flag only after the check, and
    Trivial's candidate cache records its key only after it is filled. A browser test caught the second: Trivial
    read on with an empty cache.
- **`engine/solverWorker.js`** holds a `Problem` built from the same slots and constraints, re-sent whenever the
  model rebuilds its problem (`rebuildProblem` calls `model.wrapProblem` when set; a player's new inference
  rebuilds). It answers requests and posts progress at most every 100 ms: questions weighed of total for the
  all-candidates batch, checks made while explaining a clash.
- **`ui/app.js`:** every click and change handler, every delayed check and both render functions run through
  `run(fn)`. While the worker works, a veil holds clicks and a panel shows "Working it out…" with a bar (a real
  fraction for the candidates batch, a moving bar while sifting clues) and a line of detail; both appear after
  250 ms, so quick trips do not flash. The page is driven the same way on loading (the `Game` constructor asks the
  solver too). The logic page (`logic.html`) stays synchronous.
- **Site build:** follows `new URL('./x.js', import.meta.url)` as well as imports, so the worker is published and
  stamped with the version.
- **Checked:**
  - Test `engine/remoteProblem.test.js` runs the real handler and client through a stand-in Worker: a slow call
    goes over with progress, the answer equals the local one and is cached, and a game reads 60 paragraphs, makes
    a checked cross-out and lists its clashes through `settle`.
  - In headless Chrome (served, driven over the DevTools protocol): Medium reads all 232 paragraphs in about 14 s.
    Easy reads all 232 in about 52 s, the page never freezing more than 0.3 s, the panel showing while clashes are
    sifted. Trivial (the game working everything out) about 2 s per paragraph with the bar, never freezing more
    than 0.15 s.
- **Not done:** the cost itself (Round 61); incremental candidates for Trivial; cancelling a check.
- **Suite:** 54 tests, green, 798 s (a browser run overlapped part of it; 670 s in Round 61).
- **Moved:** nothing in the logs, reports or gates (engine plumbing and UI).

## Round 63 (2026-10-16): world model, step 3 — the board (timeline) in both layouts, with pencil marks and splits

- **Engine** (`engine/timeline.js`, Game methods `timeline(layout)`, `timelineTimes`, `followedThings`, `follow`,
  `unfollow`, `pencilPlace`, `erasePlace`, `splitTime`, `unsplitTime`, `placeEvent`, `reached`):
  - **Times** are the windows the story has reached (their `reveal` line), and the parts the player has split them
    into. Each part is shown as before it, the splitting event on its boundary row, after it.
  - **Followed things:** every card a held clue places somewhere (declared state, settled), unless the player drops
    it, plus any card they choose to follow. Listing every tracked thing would show which ones the case thinks
    matter.
  - **A cell** shows what is GIVEN (a held clue or the player's proof settles the declared state; a part's state
    once the player has made that part) and the player's PENCIL marks. Pencil marks are free: several are several
    hypotheses, a struck one stays visible, crossed out. Nothing is checked yet.
  - **Splits** are the player's (Round 61's design) and use the case's ids, so a state the case declares in a part
    shows once the player makes it. Events stay in the window until moved into a part; undoing a split takes its
    parts and what was placed there.
  - **The board** (followed, pencil, splits, placed) is saved (`board`, save version 7).
  - **By place:** columns are the case's place-set places the player has met, then "somewhere else" and "not
    placed". Events and given places fold to the nearest column, so the bedroom is the villa. **By thing:** a row
    per followed thing, a column per time, with what the clues say of its holder and conditions.
- **UI** (`ui/app.js`, Timeline tab): two new views, "By place" and "By thing", beside the three event views.
  - Pencil form: who, when, where. Clicking a cell fills it in.
  - Clicking a mark strikes or restores it, and × erases it.
  - Follow and unfollow; split a row at an event and unsplit it; "before" and "after" on an event in a split window.
  - Solid chips are given, dashed ones pencilled. Checked in headless Chrome at ¶40 with screenshots: the Strakers
    at the villa at one and the lads in the loft through the night are given; two pencil hypotheses for Silver Blaze
    at one; seven o'clock split at Mrs. Straker's waking.
- **Test:** `engine/timeline.test.js`:
  - what held clues place, in both layouts, and only times reached;
  - pencil marks, struck marks, follow by pencilling;
  - the split, with the part's given state and the event moved and moved back;
  - the save.
- **Not yet** (later steps, or step 3's checking): a placement checked at commit in the harder settings; possession
  and condition pencilled (shown only when given); a cell the player opens that the case never declared, checked
  against the rules; a proven placement as a citable card; the order questions that a split raises in the case.
- **Suite:** 56 tests, green, 878 s.
- **Moved:** nothing in the logs, reports or gates (engine and UI only).

## Round 64 (2026-10-16): world model, step 4 — layers over theories, with a fit check

- **Layers** (`engine/timeline.js`; Game `layers`, `visibleTheories`, `checkLayer`):
  - **What a layer is:** one night on the board. Your own board is the default, and every theory the player has
    met is a layer too: the story's (once its line is read and the cards its answers sit on are held, as the
    Theories tab showed them; that test moved into the engine) and the player's own.
  - **Pencil marks** carry their layer.
  - **A theory's answers place people:** an agent or patient it names is at the event's place and time, from the
    theory's own answers or else what the player's clues settle, at times the story has reached. A state it names
    counts too. These marks are drawn dotted and are read-only.
  - **The police's night:** at ¶46 it puts Simpson at the stable, by its window, while the supper was drugged, and
    in the hollow at the blow, with Straker.
- **Fit (`checkLayer`):** the theory's answers fixed, and each pencilled declared state must take one of the places
  pencilled for it (struck marks left out; several marks are a disjunction). This is checked against what the
  player trusts with the claims caught in a clash set aside, as "Could it fit?" does. It returns the clash to show,
  and counts the marks no declared state speaks of (not judged).
- **UI:** a layer selector on the board; "Does this night fit?" shows the clash as a chain, or "fits"; pencil marks
  go to the chosen layer. The Theories tab reads its list from the engine.
- **Test** (`timeline.test.js`, layers):
  - the police layer once told, with Simpson's theory mark at the stable and not on the player's own board;
  - a mark against Mrs. Straker's clue does not fit, and the clash names it; a mark with no state is counted, not
    judged; a second guess in the cell makes it fit again; marks keep to their layer.
- **Checked in headless Chrome** at ¶46: four layers (yours, the police, the honest trainer, the self-wound), the
  police layer drawn, "This night fits everything you trust so far".
- **Suite:** 57 tests, green, 697 s.
- **Not yet:** what a layer leaves unexplained (workstream 6); an "inside story" layer authored by the case (the
  player can make it as their own theory); possession and condition on layers.

## Round 65 (2026-10-16): hand-off to the world model, part 2

World-model steps 1–4 are done (Rounds 60–64), with the solver in a Web Worker. `docs/kickoff-world-model-2.md`
hands the next session three pieces of work:
- solver speed: the suite is back above 10 minutes since the ties, and incremental candidates are the main lead;
- checked placements on the board, cells the case never declared, and proven placements as cards;
- the design of knowledge, intention and belief (step 5), to agree with Robert before building.

It carries the rulings of this session and the traps met. `CLAUDE.md` points at it.

## Round 66 (2026-10-16): solver speed (kickoff part 2, A)

- **Where the time went** (profiled before changing anything):
  - **Building a `Game` took 4–12 s.** It was the step needs (`#inferencesFor`: one QuickXplain per route step),
    and about 90% of that was the lazy check's second phase, with the ties. The suite builds dozens of Games.
  - **A Trivial game at logic pace took 200–400 s:** 21 all-candidates batches of 7–16 s each (from `stepMade` →
    `settled` → `autoValues`).
  - **The per-component cache (the kickoff's lead) would not have helped.** At the end of the story one component
    holds 397 slots and 300 constraints, and even after propagation 158 open slots stay linked. A batch made about
    740 searches, every one backtrack-free, so their cost was propagation, not branching.
  - **Half of all solver time was `evaluate`:** it read the operator with `Object.keys` and built closures and
    arrays on every call.
- **Changes** (each sound by construction: what is shortcut is either a verified solution or a value already
  proven out):
  - **`engine/logic.js`: formulas are compiled once** (cached per formula object) into closures with the same
    three-valued reading; `and`/`or` stop at the first deciding member.
  - **`engine/game.js`: the step needs are kept per problem** (a WeakMap on `model.problem`), set once complete,
    so a slow check retried through the worker cannot leave half a map. A player's inference rebuilds the problem
    and so the needs.
  - **`Problem.allCandidates` is incremental.** When the active constraints include all those of the last call
    (Trivial only ever holds more), a value ruled out then stays out, and the last call's solutions that keep the
    new constraints still show their values. The same active set returns the last answer.
  - **`Problem.allCandidates` mends before it searches:** a value is shown by the first solution with that value
    set, mended greedily in up to 8 other slots and checked against every part of the group. Only where mending
    fails does the full search run.
  - **`Problem.consistent` remembers its last 16 whole solutions;** one that keeps the active constraints, the
    fixed values and the extra formulas answers at once.
  - **`Problem.consistent` tries the ties first:** a check with ties tries everything together for at most 20,000
    search steps (`OverSteps`), then falls back to Round 61's order (without the ties, then with them). In the
    clash search most checks passed without the ties only to be decided with them: 129 of 251 passed the first
    phase and failed the second.
- **Checked:**
  - Each of the 21 batches of a full Trivial game was compared with a fresh solver's answer: identical.
  - The step needs are identical, and the end-of-story clashes are the same twelve.
- **Timings** (this machine, shared with other sessions' jobs, so there is noise):

  | Measure | Before | After |
  |---|---|---|
  | Case load | 10 s | 2.4 s |
  | First `Game` | 8.6 s | 1.2 s (later ones ≈ 0) |
  | `npm run validate` | 78.5 s | 39.8 s |
  | Trivial batch | 7–16 s | 0.4–2.4 s (0 when nothing changed) |
  | Full Trivial game, solver time | 200–400 s | about 16 s |
  | End-of-story clash search, Easy | 48–66 s | 21 s |
  | `npm test` (57 tests) | 970 s (697 s in Round 64) | **216 s** |

  The slowest tests are now validation (72 s), "cards the solution does not need" (40 s, 351 s before) and "a
  clash … set aside" (32 s, 169 s before).
- **Not done:** sharing played games between tests (not needed for the target); the ties-fixed first pass for
  `explainConflict`; witness value ordering (tried, about 5%, dropped). The browser was not re-timed; its worker
  runs the same `Problem`, so Trivial's per-paragraph batch gains as above.
- **Moved:** nothing in the reveal and foreshadow logs, `report.md`, `thoughts-report.md` or the gate listing
  (diffed in full).

## Round 67 (2026-10-16): each card's own timeline; the board's pencil form fixed

- **Robert:** the board's "Pencil it in" said to choose what, when and where, but not how. On a phone the "what"
  dropdown was not visible. He wants every card to show its own timeline so far, with controls to edit it there
  and a layer selector, before step B. The board keeps its three dropdowns.
- **The board's form:**
  - **Why "what" was hidden on a phone:** the form shared `.row`, which aligns right without wrapping, so a row
    wider than the screen overflowed off the left edge. The pencil form now wraps and aligns left.
  - **Hint:** a line above the form says how it works (choose the three and press the button; clicking a cell
    fills in when and where, or who and when).
  - **Clicked cell:** it is outlined, so the player can see what the form now holds.
- **Each card's timeline** (`engine/timeline.js` `cardTimeline`; Game `cardTimeline(id, layer)`; a "Timeline"
  section on the Card tab):
  - **A person, animal, group or object:** for each time the story has reached, where it was:
    - given by a clue (solid), pencilled (dashed) or the layer's theory (dotted);
    - who held it, and its conditions;
    - the events the player holds where it is the settled agent, patient or recipient.

    Then the events whose time is not settled yet.
  - **A place:** for each time, who and what the board puts there or somewhere inside it (the lads in the loft show
    on the stable, "(The loft)"), and the events done there.
  - **An event:** when and where it happened; before/after if its window is split.
  - **Only lines with something on them.** Nothing is shown that the board does not show: same times reached,
    same clues held, same marks.
  - **Editing:** the layer selector (shared with the board); strike or erase a mark as on the board; a pencil form
    with the card itself as who (a thing: when, where) or where (a place: who, when). The marks are the board's,
    so an edit in one shows in the other.
- **Checked:**
  - Test (`timeline.test.js`): a thing's places and events, only times reached; a board mark shown on the card;
    the loft folded into the stable's card; an event's time; a clue has no timeline.
  - In headless Chrome at ¶46: Straker's, Silver Blaze's and the stable's cards. A mark pencilled on Silver Blaze's
    card shows dashed on the stable's.
  - At 390 px wide: the board's form wraps with all three dropdowns visible, and the clicked cell is outlined.
- **Moved:** nothing in the logs, reports or gates.

## Round 68 (2026-10-16): checked placements (B, part 1) — prove or rule out a mark; a proven state is a card; holders and conditions pencilled; the split controls behind a button

- **Robert:** go with the plan for B, including the order questions of the player's own splits. If problems
  come up while building, stop and check with him. The split/unsplit links get a button on the board that shows
  or hides them.
- **Split controls:** hidden by default; "Show the split controls" on the board shows them. The before/after
  links on the events in a split window stay.
- **Commit, as the question cards do** (Game `proveMark`, `ruleOutMark`; the card timeline's "prove" and
  "rule out" on each of the player's own marks):
  - **Prove:** what the player holds and trusts must leave nothing else possible (`prove` on the declared state,
    with the mark's place folded to the track's: the bedroom proves the villa). Every setting checks it, as
    proving an answer always is.
  - **A proven state becomes a card of the player's,** made the way a stated conclusion is (`conclude`, citing the
    proof's cards). Its text is the player's own: "John Straker was at Straker's villa (Tuesday, 1 a.m.)" (not
    a quote; it is the player's card). Proving it again makes no second card. It is saved and restored with
    the concluded cards.
  - **Rule out:** a cross-out of that answer. It is checked where cross-outs are checked (Medium, Hard) and free
    where they are free (Easy). The mark is struck. Restoring a struck mark takes the ruling back.
  - **The free pencil stays the default:** strike, restore and erase as before.
  - **Status on every mark of the player's board:** proven (green, solid), ruled out (green, struck), or, with
    greying on, excluded by the clues (faded) (`timeline.js` `markStatus`, `stateOf`).
- **Holders and conditions pencilled** (`pencilPlace(…, {aspect})`; a mark's `aspect` is `at` by default, `held`,
  or a condition's id):
  - A holder mark is a person, animal or group the player holds, or a place where the thing lies; a condition
    mark is yes or no.
  - **Where they show:** in the "By thing" board and on the card, beside what the clues give. The card's form has
    a "was at / was held by / was stupefied?" choice. The board's three dropdowns stay for places.
  - **Layers:** a layer's fit check takes every aspect.
- **Not yet:** a cell the case never declared answers "the case has no question here yet". That comes with
  part 2.
- **Test** (`timeline.test.js`, checked placements): proven state as a card (text, no duplicate); not provable
  without the inference; ruled out with the lads' clue in Medium, freely in Easy; restoring takes the ruling
  back; a condition mark is yes or no, apart from places, and checked by a layer; the save restores the board
  and the card.
- **Checked in headless Chrome** at ¶46: the lads ruled out of the stable at the stable hour (struck, green); a
  failed proof explained; a stupefied mark for Hunter on his card and on the board.
- **Moved:** nothing in the logs, reports or gates.

## Round 69 (2026-10-16): checked placements (B, part 2) — cells the case never declared

- **Opened on commit:** a mark the player proves or rules out where the case declares no state opens one
  (`caseModel.js` `openState`). It is a slot on the thing's track (a new track if it has none), with no answer
  and no part in uniqueness. Its domain is the case's place set, the holders, or yes/no.
  - **Its own ties** (`windowTies`): whoever does or undergoes an event in that window is there, and a holder is
    with the thing held. These are direct implications for that window.
  - **The case's ties are untouched:** built over the declared windows, they read an opened window as
    unconstrained, so the new ties only add to them.
  - **Closing:** opened states are held by count (several games may share a model) and closed when the last
    holder lets go (`closeState`; Game `reset`). They are saved (`opened`) and reopened before the cards that
    speak of them.
- **Refactor, no change in what is built:** the per-track ties (`trackTies`, `inTimeConds`, `statedOutright`) and
  the making of a track (`makeTrack`, with `addWindow`/`removeWindow`) are functions of their own. The case's
  slots and 65 ties come out identical: the same ids, formulas, labels and order.
- **A check about a state takes that thing's ties** (`#withTies` in proving, ruling out, greying and `conclude`),
  even where no card the player holds speaks of its states.
- **Problem met, and Robert's ruling (option 1 of three):**
  - **The problem:** a cell means its whole time. Edith runs to the stable window and flees to the house, both in
    "Monday, at the stable window", so one place for her there contradicts her own clue. The proof check,
    which assumes what is held is consistent, called "Edith was at the stable" proven: vacuous.
  - **The ruling:** before any placement is proven or ruled out, what the player trusts plus the ties must be
    consistent. If not, nothing is checked. The player is told the thing has no single place throughout that
    time and can split the time at an event; a state opened for it is closed again. The alternatives, read an
    opened cell as "at some point in the window" or split automatically, were declined.
- **Speed:** opening a state, adding a proven card (and any conclusion or applied rule) no longer throws the clash
  cache away. A new card only adds to what is trusted, so the clashes found are checked again first. At the end
  of the story in Easy a placement proof takes about 4 s (23 s before the change, most of it a full clash
  search).
- **Display:** a pencil mark that repeats what is given (or proven) is not shown twice.
- **Checked:**
  - Test (`timeline.test.js`): Hunter at the stable during the window scene, proven from "he locked the door
    behind him", and the villa then ruled out by that card. Edith refused, her state closed. Save, reload,
    reset and the shared count.
  - At the end of the story in Easy (scratch run): Silver Blaze at the stable during the stable hour and in the
    hollow, and Straker at both, proven and made cards.
  - In headless Chrome at ¶46: Hunter's card proves the cell; Edith's is refused with the explanation.
- **Not yet:** the parts of a window the player splits ("a part of a window you split yourself cannot be checked
  yet"). That comes with part 3, the order questions.
- **Moved:** nothing in the logs, reports or gates.

## Round 70 (2026-10-16): checked placements (B, part 3) — the order questions of the player's own splits

- **Opened on commit** (`caseModel.js` `openSplit`/`closeSplit`; Game `#ensurePart`): when the player commits
  something about a part of a window they split themselves (a placement, or an event's part), the split is built.
  - **What is built:** its two parts, an order question `ord.<event>.<splitter>` with no answer for each event
    that may share the window, and the order ties these add (`orderTies`, extracted from `buildModel` unchanged).
    The parents of a nested part are built first.
  - **Held by count, saved and closed** as opened states are (`openedSplits` in the save, before `opened`).
- **Commit an event's part** (Game `proveOrder(event, part)`; "prove" beside an event placed in a part, on the
  board and on the event's card):
  - **What is proven:** it happened before or after each event that splits the windows above that part.
  - **The card:** a proven order becomes a card, "“…” happened after “…”".
  - **The guard:** what the player trusts must be consistent first, as for states.
  - **Example:** on the case's own split, the finding of the open door is proven to come after Mrs. Straker woke
    (her waking at seven, the door found open).
- **Problem met, and Robert's ruling (Option A):**
  - **The problem:** Round 61's convention put the event that splits a window on the boundary of both parts, so
    whoever does it was tied to its place in both. That fits a split at Mrs. Straker's waking. It breaks a split
    at a move: at "Edith flees" it put her on the moor path throughout the part before her flight, against her
    running to the window.
  - **The ruling:** the splitting event lies in neither part (`inTimeConds`). For the case this drops one tie (her
    waking), and her state before waking stays unique, given by her own clue. The other alternative, keep the
    boundary and refuse splits at moves, was declined.
- **Problem met, open (Robert: the case will get the data, in a session of its own):**
  - No clue in the case states the order of two events within a window. No claim asserts an order question.
  - So an order on the player's own splits is provable only where the world's states force it. "Edith ran to the
    window before she fled" stays "does not settle it yet", though the story tells it ("As Edith fled she looked
    back…").
  - `docs/kickoff-event-order.md` hands the format and the data to a new session.
- **Test** (`timeline.test.js`, order questions):
  - the finding after the waking, proven and placed;
  - the player's split of the window scene opened on commit, with its order questions;
  - Edith's part well-posed (the flight in neither part) and still unproven;
  - save, restore and reset.
- **Moved:** `report.md`: constraints 327 → 326; the waking tie no longer among what gives Mrs. Straker's state
  before waking. Nothing in the logs, the thoughts report or the gates.

## Round 71 (2026-10-16): step C proposed — knowledge, intention and belief (`docs/knowledge-intention.md`)

- **Design only; for Robert to decide.** The document goes through the six `world-model` thoughts (`t24.2`,
  `t34.5`, `t78.2`, `t82.3`, `t123.2`, `t150.1`) and what each needs, and recommends:
  - **Knowledge:** boolean tracks per thing and proposition. Built in: knowledge persists, and what is known is
    true. Default rule cards: being told, seeing, acting on a fact.
  - **Intention:** an aim track per person, tied to the purposes of acts, and split like places.
  - **Belief:** deferred to workstream 4 (testimony), with its shape fixed (knowing implies believing; a sincere
    speaker believes what he says).
  - **The six:** `t34.5` also needs absence (workstream 5); `t82.3` needs only a condition track; `t123.2` waits
    for the event-order session.
- **Moved:** nothing (documents only).

## Round 72 (2026-10-16): step C agreed

- **Robert:** agreed to all five recommendations of `docs/knowledge-intention.md`, as written:
  - knowledge over propositions;
  - two laws built in (knowledge persists; what is known is true) and three default rule cards (told, seen, acts
    on it);
  - an aim track per person, tied to the purposes of acts;
  - belief deferred to workstream 4, with its shape fixed;
  - the order of work, starting with intention.
- **Building waits for the event-order session** (`docs/kickoff-event-order.md`), which owns the engine, the case
  data and the format while it runs. The two sessions share one working tree, so each commits its own files by
  path.
- **Moved:** nothing (documents only).

## Round 73 (2026-10-16): the order of events within a window, step 1 — `seq` in the format, Edith's order

- **Robert's ruling** (of the alternatives in `docs/kickoff-event-order.md`, and the recommendation taken):
  - **The sequence fact is an order question of its own.** `{seq: [a, b]}` in a claim's `asserts` grounds to the
    same window and `ord.<a>.<b> = before`. The case builds that question for every pair a claim states, split or
    not.
  - **The bridge to every split is the order ties, generalised:** two questions over one pair agree, and order runs
    through any three events in one window. A player's split asks `ord.*.<splitter>`, which the ties tie to the
    stated pairs. So no constraint is built per claim and per split, and doubting, clashes and saves are unchanged.
  - **Declined:**
    - per-split grounding of each claim's fact: bookkeeping in doubt, clashes and saves;
    - a position slot per event: wide slots, hidden questions, solver risk;
    - `ord.*` asserted only for the case's splits: never reaches the player's.
  - **Simultaneous events** ("as she ran she looked back and saw…") get no `seq`; their order stays open.
  - **Two steps:** this one (format, engine, validator, Edith's line, the test), then the data window by window.
- **Engine:** `logic.js` grounds `seq` (chains as consecutive pairs). `caseModel.js` adds `seqPairs`, builds the
  stated pairs' order slots (answer from `fabula_order`, settled), and extends `orderTies` over every order slot.
  The case's earlier ties keep their ids and formulas.
- **Problem met and fixed:** an opened state's ties (`windowTies`, Round 69) compared the state with the event's
  place unfolded. "Edith at the stable window" was then a value outside the state's domain, a tie that could never
  hold once the order was known, so her place before the flight was refused as "no single place". They now go
  through the state term, as the case's ties do.
- **Data:** `c.stranger_leaning_in` (Edith's testimony) gains `{seq: [e.edith_runs_to_window, e.edith_flees]}`;
  its quote now starts at "The girl fled away to the house" (same paragraph, ¶29).
- **Validator and report:**
  - a `seq` names two different timed events, on a claim with a quoted line, in fabula order unless the claim is
    false, and only on claims;
  - the report's new "Orders within a window" lists the stated orders and the split questions the case settles.
- **Test** (`timeline.test.js`, order questions), on the player's split of the window scene at Edith's flight:
  - her order is not provable while her testimony is doubted, and is proven once it is trusted, citing it alone;
  - she is proven at the stable before her flight;
  - the stranger's question stays open;
  - on a nested split at Hunter locking the door, "she fled before it" gives "she ran to the window before it";
  - the stated question is the case's own and stays after reset.
- **Timing:** `npm test` 61 tests, 137 s.
- **Moved:**
  - **Report:** one more slot (`ord.edith_runs_to_window.edith_flees`, settled: before) and the new table;
    constraints unchanged (326).
  - **Reveal and foreshadow logs:** `e.edith_flees` moves a few lines within ¶29, its quote now starting earlier
    in the paragraph.
  - **Thoughts report and gates:** nothing.

## Round 74 (2026-10-16): the order of events within a window, step 2 — the data

- **Ten orders stated**, each on a true claim whose own quoted line tells it. Five quotes were widened within their
  paragraph, and two claims gained a second quote from their paragraph:

  | Order | Claim | The line |
  |---|---|---|
  | lads return → Hunter's message | `c.lads_returned_message` | "waited until his fellow-grooms had returned, when he sent" |
  | message → Straker uneasy | `c.straker_uneasy` | "Straker was excited at hearing the account" (added) |
  | Straker dressing → leaves | `c.straker_left_in_mackintosh` | "in spite of her entreaties he pulled on…" (widened) |
  | stranger's question → Hunter goes for the dog | `c.hunter_went_for_dog` | "So, you're one of those damned touts!" (added) |
  | Edith runs to the window → flees | `c.stranger_leaning_in` | Round 73 |
  | stranger leaning in → Hunter's search | `c.stranger_gone` | "A minute later, however, when Hunter rushed out…" (widened) |
  | Hunter locks the door → his search | `c.door_locked_behind` | "locked the door before he left it" |
  | Mrs. Straker wakes → door found open | `c.stable_door_open` | "set off for the stables. The door was open" (widened) |
  | door found open → lads roused | `c.lads_heard_nothing` | "…were quickly aroused" (added) |
  | body found → maid knows the cravat | `c.edith_knows_cravat` | the cravat in the dead man's hand, recognised |

- **Problems met:**
  - **The leak guard held twice.** "She had begun to tell him… when the stranger came up again" (¶25) tells that
    Edith reached the window before the stranger asked for the tip. On her claim it dealt the tip event at ¶25,
    ahead of its label (¶28); as a second quote on the tip's claim it dated that card at ¶25. Left out.
  - **A derived claim** (`c.brown_story_told`, Holmes's account of Brown's morning, which the player proves) would
    have made its order a thing to prove that no clue gives. Left out. The validator now refuses `seq` on a derived
    claim (before, the validator's derived-claim check read the claim's raw formula and failed on the `seq`).
- **Held back for Robert:**
  - **The stranger's flight against Hunter's search.** "When Hunter rushed out with the hound he was gone" puts the
    flight first, but `fabula_order` has it after (370 against 360). Stating it means correcting the answer key.
  - **Pairs told only by consecutive sentences, with no connective:** the stables locked → the lads go up to
    supper; Hunter goes for the dog → Edith flees; the stranger stops Edith → the bribe; the knife taken "as he
    left the room" → he leaves the house.
- **Moved:**
  - **Report:** slots 607 → 616, constraints 326 → 330 (four order ties over Mrs. Straker's waking, the door and the
    lads), quotes 1009 → 1012. The new table has twelve rows. `ord.lads_roused.wife_wakes`, the case's own split
    question, is now settled (after), by order running on. The theories, clashes and minimal breaks are unchanged.
  - **Reveal and foreshadow logs:** four cards reorder within ¶28, ¶32, ¶33 and ¶34 (their quotes now start
    earlier in the same paragraph). Nothing appears in another paragraph.
  - **Thoughts report and gates:** nothing.
- **Timing:** `npm test` 61 tests, 160 s.

## Round 75 (2026-10-16): the order of events within a window, step 3 — Robert's rulings on what was held back

- **Robert:** make all the updates held back in Round 74.
- **The answer key corrected:** `e.simpson_flees` moves from 370 to 355, after Hunter locks the door (350) and
  before his search (360). "When Hunter rushed out with the hound he was gone": the stranger fled first.
  - `c.stranger_gone` now states the chain: stranger leaning in → stranger flees → Hunter's search. "A minute
    later" is from the leaning.
- **Pairs told by consecutive sentences, now stated:**

  | Order | Claim |
  |---|---|
  | the stables locked → the lads go up to supper | `c.lads_supped_at_house` |
  | the stranger stops Edith → the bribe | `c.bribe_to_edith` |
  | Hunter goes for the dog → Edith flees | `c.stranger_leaning_in` |
  | the knife taken "as he left the room" → he leaves the house | `c.knife_from_dressing_table` |

- **Moved:**
  - **Report:** slots 616 → 621, constraints unchanged (330), fifteen stated orders. The fabula table and the
    slot list put the stranger's flight before Hunter's search. The theories, clashes and minimal breaks are
    unchanged.
  - **Reveal log:** the questions on Hunter's search come after the flight's within ¶29.
  - **Foreshadow log, thoughts report and gates:** nothing.
- **Test** (`timeline.test.js`, order questions): the stranger's question now comes before Edith's flight through
  the chain (the question, Hunter going for the dog, her flight), citing those two clues. His leaning in, told as
  happening while she ran, stays open on both sides of her flight.
- **Timing:** `npm test` 61 tests, 128 s.

## Round 76 (2026-10-16): step C, 1a — intention: aims, tied to the purposes of acts; the man who found the horse

- **Format** (`states.json` `state_aims`; aspect `intention`, track `st.<thing>.aims`; schema and validator):
  - the aims are one vocabulary with the purposes of acts: information, injure, steal, exercise, find the way,
    lead the horse home, hide it, keep it safe, rob;
  - an intention track ranges over them, with an aim checked against the list.
- **Engine** (`caseModel.js` `aimTies`, in `trackTies` and `windowTies`): built in, whoever does an act with a
  `purpose` slot has that purpose as their aim at its time, for the purpose values that are aims. On the board
  and the cards an aim is pencilled ("was trying …") and committed like a condition. Card text: "John Straker was
  trying to injure the horse (…)".
- **Data:**
  - **Straker:** `st.straker.aims` at the stable hour = injure, derived through the tie from why the horse was taken
    out.
  - **The split:** `state_splits` gains dawn at `e.brown_turns_back`.
  - **The man who found the horse:** `st.track_man.aims`, before his turning = lead home, after it open.
  - **The inference:** `k.track_man_changed_his_mind` (Holmes; asserted: which way a track went is not a facet,
    so the engine cannot derive the aim from it), from `c.double_track_loops` and the new default rule
    `r.leads_where_he_means`.
  - **The thought:** `t123.2` maps to it, with a date note: the tracks' claim ends at ¶124, one paragraph on.
  - **The annotation's background:** `bk.leading_intent` maps to the rule.
- **Changed from the plan** (`docs/knowledge-intention.md`, data plan):
  - **The aims are the track man's, not Brown's.** At ¶123 the reader does not yet know it was Brown (the boots
    tell it at ¶146).
  - **The aim after the turning is left open.** "To hide" is learned a paragraph later.
  - **Step 1 is split.** The money and watch, and "not a robbery" (`t78.2`), become 1b: they need possession to
    carry over windows (`r.stays_put` is for places only).
- **Moved:**
  - **Report:**
    - slots 621 → 656, constraints 330 → 428, rules 96 → 97, quotes 1012 → 1013;
    - states 22 → 25 (1 open), asserted inferences 10 → 11;
    - 33 order questions at dawn, all open: the new split asks one for every event no clue puts elsewhere;
    - their order ties.
  - **Reveal log:**
    - the rule as background at ¶122;
    - the inference at ¶146, where Holmes tells it;
    - the man's two aim questions there too.
  - **Foreshadow log:** the rule at ¶122 (untold words: means, changed).
  - **Gates:** a new gate at ¶146, `t123.2` needing `k.track_man_changed_his_mind`: Holmes's own deduction, stated
    there.
  - **Thoughts report:** `t123.2` gains an inference (41 of 49); one premise disagreement remains. `t124.2` cites
    `t123.2`, whose inference is not among its premises. Left for Robert: the annotation's chain, not the data, is
    the question.
- **Cost:** `npm run validate` 34 s → 47 s and `npm test` 128 s → 149 s (62 tests), from the dawn split's order questions and ties.

## Round 77 (2026-10-16): step C, 1b — possession over time; "not a robbery" (`t78.2`)

- **Data:**
  - **Possession tracks:** `st.sovereigns.held` (after the blow, and in the morning) and `st.silver_watch.held`
    (in the morning). `c.pocket_inventory` gains the morning holder, Straker, for both, quoted through its own line.
  - **A slot:** `e.fatal_blow.purpose` ("Was Straker struck down to rob him?", rob / not), answer not.
  - **Two default rules** (`knowledge.json`, background from ¶78):
    - `r.stays_held`: what a man has about him stays with him until something takes it. It is the possession
      counterpart of `r.stays_put`.
    - `r.robber_takes_valuables`: a man who strikes another down to rob him takes the money and the watch he
      carries.
  - **The inference:** `k.not_a_robbery` (editorial: nobody in the story states it), **verified** by the engine
    from the inventory, the blow on Straker and the two rule applications. "Rob" is an aim too, so whoever struck
    to rob would have that aim then (the tie of 1a).
  - **The thought:** `t78.2` maps to it. Its `from` gains `t35.2` (the blow shattered Straker's head): "still on
    the body" presumes he was struck down, and without that clue the engine cannot verify the step.
- **Test:** `timeline.test.js`, possession over time: verified, built by a player at ¶78, shown on the
  sovereigns' card. `thoughts.test.js` takes `t82.3` as its thought with no inference, since `t78.2` now has one.
- **Moved:**
  - **Report:** rules 97 → 99, slots 656 → 660, constraints 428 → 431, verified inferences 61 → 62, states 25 → 28.
  - **Reveal and foreshadow logs:** the two rules as background at ¶78.
  - **Thoughts report:** 42 of 49 deductions with an inference; one premise disagreement (`t124.2`, left as it is).
  - **Gates:** nothing (the step is editorial, so it does not gate).
- **The six `world-model` thoughts:** `t123.2` and `t78.2` done; `t24.2` and `t150.1` with step 2 (knowledge);
  `t34.5` waits for absence (workstream 5); `t82.3` needs only a condition track.
- **Fix after the commit** (Round 77, second commit): the first commit went in with one test failing ("cards the
  solution does not need"); it was not gated on the suite's exit code. `r.robber_takes_valuables` compared the
  holder with the blow's patient slot, which the engine expands over every person, so every person became a
  card the solution needs. The rule now names the victim (`victim`, bound to Straker); still verified.

## Round 78 (2026-10-16): step C, 2 — knowledge over propositions; the stranger came on purpose (`t24.2`), Brown keeps the horse safe (`t150.1`)

- **Format** (aspect `knowledge`, `knows: <proposition>`, track `st.<thing>.knows_<proposition>`; schema and
  validator): did the thing know the proposition then, yes or no.
- **The two laws, built in** (`knowledgeTies`): known means the proposition holds, and known in one window means
  known in every later one of the track. The three default rules of Q2 (told, seen, acts on it) are not authored
  yet: no thought among the six needs them.
- **Dealing:** a clue that states what someone knew deals the proposition with it (`#spokenOf`), so its words come
  from that clue's own line. The card's pencil form offers only propositions the player holds or a visible
  question asks about (`knowablePropositions`).
- **Data:**
  - **Propositions** (`propositions.json`, the first): `p.lad_alone_at_night` ("A stable-boy sleeps alone in the
    stable every night") and `p.mercy_in_safe_return` ("Brown's only hope of mercy is to produce the horse safe").
  - **`t24.2`:**
    - `c.stranger_knew_lad_alone` gains the stranger's knowledge at a few minutes past nine, from his own "I
      understand that a stable-boy sleeps there alone every night".
    - The default rule `r.lost_does_not_know` (background from ¶24): a stranger lost on the moor does not know
      how the stable is kept.
    - `k.stranger_came_on_purpose` (editorial, **verified**): his aim then was not to find his way.
  - **`t150.1`:**
    - A new claim, `c.brown_hope_of_mercy`, from Holmes's "He knows that his only hope of mercy is to produce it
      safe" (¶150).
    - The default rule `r.mercy_keeps_safe`, stated there.
    - `k.brown_keeps_horse_safe` (Holmes, **verified**): Brown's aim on Thursday night is to keep it safe. No gate:
      the thought has no Holmes paragraph of its own.
- **Changed from the plan:** no "lost" claim for the stranger ("Can you tell me where I am?" as his aim to find
  the way). It would clash with his "I understand…", and a clash sets aside every story clue in it, this one too.
  The inference concludes from the knowledge alone. The rule moved from ¶22 (his question) to ¶24 (his
  knowledge), so it does not surface two paragraphs before the clue it bears on.
- **Test** (`timeline.test.js`, knowledge):
  - the proposition is dealt at the stranger's line and not before;
  - the inference is built at ¶24, and the mark and its wording follow;
  - at the end of the story, Brown's aim and the proposition are settled.
- **Moved:**
  - **Reveal log:** the proposition at ¶24; the rule at ¶24; at ¶150, the new claim, the rule and the
    proposition.
  - **Foreshadow log:** the two rules and the claim.
  - **Report:** two propositions, four tracks, two verified inferences.
  - **Thoughts report:** 44 of 49 deductions with an inference.
  - **Gates:** nothing.
- **The six `world-model` thoughts:**
  - done: `t24.2`, `t78.2`, `t123.2`, `t150.1`;
  - left: `t34.5` (absence, workstream 5; its reason becomes `absence` when that is built) and `t82.3` (a
    condition track only).

## Round 79 (2026-10-16): hand-off — workstreams 5 and 4

The kickoff of Round 65 is done: A in Round 66, B in Rounds 67–70, C designed in Rounds 71–72 and built in
Rounds 76–78; event order came from a parallel session in Rounds 73–75. `docs/kickoff-workstreams-4-5.md` hands
the next session a starter batch, then noticing and absence (workstream 5, which unlocks `t34.5`), then testimony
and belief (workstream 4). It carries the open items and this session's traps. `CLAUDE.md` points at it.

## Round 80 (2026-10-16): starter batch, 1 — the knife unsheathed in the hollow (`t82.3`); conditions offered once the story speaks of them

- **Robert:** agreed to the proposed start. The board's three-dropdown form stays as it is (option a): aims and
  knowledge are pencilled on the cards only.
- **Data:**
  - **A condition** `sheathed` ("Was the blade of {0} sheathed?") and a track `st.cataract_knife.sheathed`: at
    one o'clock true, given by `c.cork_by_body` ("The tip was guarded by a disk of cork"), and in the morning
    false, derived.
  - **A default rule,** `r.guard_off_bares`: a knife whose guard is found beside it, off the tip, is no longer
    guarded (unless it was put back on before). Background from the cork line (¶82), where the reader's thought
    is.
  - **The inference** `k.knife_bared` (editorial, **verified**), from the cork clue and the rule. `t82.3` maps to
    it. It settles no case question and does not gate: an editorial step, like `k.not_a_robbery`. (The kickoff
    said "implicit", but a thought names it, and an implicit inference is one no thought names.)
- **Engine, the reading layer:** the card's pencil form offered every condition on every card from ¶1, so
  "was sheathed?" would have shown before the story has a sheath. `Game.knowableConditions()` now offers a
  condition only once a card the player holds speaks of it, or a question they can see asks it, as Round 78 did
  for propositions. `pencilPlace` and the card form use it. "Stupefied" now first appears with Hunter's stupor
  (¶33 in Easy and Medium; in Hard, once the player collects that clue).
- **Test** (`thoughts.test.js` takes `t68.3` as its thought with no inference; `timeline.test.js`): no sheath offered at ¶32 (the knife in his hand); at ¶82 it is, the inference is
  built, and the unsheathed knife in the morning is proven as a mark; sheathed at one o'clock cannot be ruled out.
- **Moved:**
  - **Report:** rules 101 → 102, slots 666 → 668, constraints 440 → 442, quotes 1019 → 1020, states 15 → 16 tracks
    (32 → 34 declared), verified inferences 64 → 65.
  - **Reveal log:** the rule as background on the cork at ¶82.
  - **Foreshadow log:** the rule at ¶82 (untold: "longer").
  - **Thoughts report:** 45 of 49 deductions with an inference; `world-model` reasons left: `t34.5` only.
  - **Gates:** nothing.

## Round 81 (2026-10-16): starter batch, 2 — the three default knowledge rules (told, seen, acts on it)

- **Format and engine:** a schema variable may range over the propositions (`{"proposition": true}`). Bound to
  `p.<name>`, it stands as a state term's name and reads that proposition's knowledge track (`env.state`). So one
  rule speaks of knowing any fact, where Round 78's rules named their track literally.
- **Data** (`knowledge.json`, default, each with `unless`):
  - `r.told_knows`: who is told something knows it from then on, unless he did not believe it. Background from
    Hunter's message to Straker (¶32), "told him what had occurred".
  - `r.present_sees`: who is there, awake, when something happens sees it, unless asleep or stupefied, or it was
    dark or hidden. From Edith looking back and seeing the stranger at the window (¶29). The place is a variable,
    so the rule compares the state with a named value, not with the event's place slot (Round 77's trap).
  - `r.acts_on_knows`: who acts on a fact knows it when he acts, unless by chance. From the stranger's "I
    understand that a stable-boy sleeps there alone" (¶24), beside `r.lost_does_not_know`.
- **Unapplied, as the kickoff allows:** no thought needs them. `t24.2` and `t150.1` take their knowledge from the
  speaker's own words, which is better evidence than the defaults. `r.present_sees` has its first use waiting in
  workstream 5 (`t34.5`: had Straker been at the stable when the horse was led out, he would know the stall was
  empty; `docs/noticing-absence.md`, Q5).
- **Limit found:** `who` ranges over people and groups, which excludes placeholders (the stranger). A rule applied
  to him would need `also`, as `r.lost_does_not_know` has. Left until a rule is applied to him.
- **Test** (`reasoning.test.js`): `r.told_knows` bound to Brown and `p.mercy_in_safe_return` grounds to his
  knowledge track; a place is refused as the fact.
- **Moved:**
  - **Report:** rules 102 → 105, quotes 1020 → 1023.
  - **Reveal and foreshadow logs:** the three rules as background on the reasoning topic, at ¶24, ¶29 and ¶32.
  - **Thoughts report and gates:** nothing.

## Round 82 (2026-10-16): workstream 5 agreed — noticing and absence (`docs/noticing-absence.md`)

- **Proposed** (the paper, written in Round 81's session): the reader's two moves, a detail odd against an
  expectation (notice) and an expected thing missing (absence), with five questions.
- **Robert:** agreed to all five recommendations, as written:
  - expectations are default rules the player holds;
  - a notice is a mark on a card, with an optional "because", recorded, flagged and scored in aggregate before
    Holmes's paragraph; player questions are deferred;
  - an absence is filed from an expectation, a time and a witness; until filed it comes at the story's next
    attestation (the dog at ¶181, its gate moving from ¶180);
  - new absences are false propositions; the dog stays a silence event;
  - the alarm for `t34.5`; notices on eight thoughts; the lantern and the cravat later.
- **Now:** `t34.5`'s `no_inference` is `absence` (a new reason), no longer `world-model`.
- **Moved:** the thoughts report's reasons (`world-model` none left; `absence`: `t34.5`).

## Round 83 (2026-10-16): workstream 5, step 1 — absences the player files; the dog; no alarm (`t34.5`)

- **Format** (`files` on a `via: absence` attestation; schema and validator):
  - `{expectation, windows, witness}`: the default rule that expected what did not happen, the windows it did not
    happen in, and the clue that would have registered it;
  - the validator checks each (a rule, known windows, a witness that is a claim and no absence itself, only on
    absences, never on a derived claim);
  - the report's new table, "Absences the player files", lists each absence with its line and where it is
    otherwise dealt.
- **Engine:**
  - **Dealing** (`story.js`): an absence line is no span, so it deals nothing by mention or by click.
    `story.absenceAt` keeps its paragraph. The claim's own later attestations deal it as before.
  - **Filing** (`Game.fileAbsence(expectation, time, witness)`, `fileableAbsences()`):
    - the rule and the witness must be held, and the time reached (a part of a window counts as its window);
    - a match deals the claim, and its events with it;
    - a mismatch answers "the story does not bear that out" and costs nothing.
  - **Trivial** files by itself as soon as it can.
  - **Kept:** filed absences are saved (`filed`) and never left out by the "irrelevant cards" option, so a true
    filing is never refused.
  - **The thoughts checker's readers file** each absence as soon as they can, so a filed absence is not "dealt
    late".
- **Data:**
  - **The dog:** `c.dog_did_nothing` is filed against `r.dog_barks_at_strangers`, at the stable hour, witness
    `c.lads_heard_nothing`. Unfiled, it comes at Gregory's "The dog did nothing in the night-time" (¶181).
  - **No alarm:**
    - a proposition `p.alarm_raised_in_night` (false);
    - an absence claim `c.no_alarm`, quoted from the lads' two lines (¶34). It is filed against the new default
      rule `r.honest_trainer_alarms` ("An honest trainer who comes into his stable in the night and finds his horse
      gone raises the alarm", background from ¶34), at any time from one o'clock to dawn, witness the lads. No later
      line states it, so it comes only by filing.
  - **The inference:** `k.straker_raised_no_alarm` (editorial, **verified**): if Straker came into the stable, he
    was not honest. `t34.5` maps to it; `bk.alarm` maps to the rule; `t34.1` also maps `c.no_alarm`.
- **Changed from the plan** (Q5): the alarm rule speaks of coming into the stable and finding the horse gone, not
  of knowledge through `r.present_sees`. The knowledge route needs Straker's place and knowledge at the time the
  horse was taken. That time is an open case question at ¶34 (any of 27 windows), so the tracks would need a state
  in every one of them, or the rule would hold vacuously. `r.present_sees` stays unapplied.
- **Not yet:** the UI (step 3). Until then a player in Easy, Medium or Hard meets the dog's silence at ¶181, and the
  alarm not at all.
- **Test** (`absence.test.js`, new):
  - at ¶34 the lads' line deals no absence;
  - wrong witnesses, times and expectations are refused at no cost;
  - the right filing deals the clue and its event, and Holmes's dog deduction can be built then;
  - saved and restored;
  - unfiled, the clue comes at ¶181 and the step gates ¶182;
  - Hard's click collects only the lads' clue, and Trivial files both by itself;
  - the alarm is filed for the night (not at nine) and `k.straker_raised_no_alarm` built.

  `reasoning.test.js`: the two dog tests file the absence first. `game.test.js`: reading the whole story collects
  every clue but the filed-only absences, which can then be filed.
- **Moved:**
  - **Report:**
    - cards 647 → 651, claims 147 → 148, rules 105 → 106, propositions 2 → 3, verified inferences 65 → 66;
    - the new absences table;
    - `e.dog_silent` leaves "cards quoted later than they appear".
    - The honest-servant theory's minimal break set changed: the alarm's inference and `k.visitor_is_taker` in,
      `k.drugging_is_dishonest` out. The absence of an alarm is a shorter refutation of "the honest servant who
      went down to the stables".
  - **Reveal log:** the dog's clue, its event and their three questions move from ¶34 to ¶181. Holmes's dog
    inference moves from ¶180 to ¶182. The alarm rule appears at ¶34.
  - **Foreshadow log:** the rule at ¶34; the dog's clue and label at ¶181.
  - **Gates:** `t34.7` (the dog) moves from ¶180 to ¶182: its clue is told at ¶181, and a gate never falls on
    the paragraph that tells its evidence.
  - **Thoughts report:** 46 of 49 deductions with an inference. Premise disagreements 2 → 3: `t34.5` cites
    `t32.2` (Straker went out at one), which the inference does not need. Left as the annotation's framing.

## Round 84 (2026-10-16): workstream 5, step 2 — notices and their scoring

- **Data** (`thoughts.json`): eight NOTICE thoughts gain `notices`, the cards whose marking as odd counts:
  - the dish (`t20.4`) and the rule against drink (`t20.5`);
  - the coat on the bush (`t35.8`) and the pocket inventory, for the candle (`t78.3`);
  - the cataract knife (`t81.2`);
  - the milliner's bill, for whose bill (`t84.3`) and for the sum (`t84.7`);
  - the odds (`t189.1`).
- **Can score:** five of them, those Holmes draws attention to in a later paragraph (`t20.4`, `t35.8`, `t78.3`,
  `t84.3`, `t84.7`). The knife (¶81) and the odds (¶189) are Holmes's in their own paragraph, and he never
  remarks on the rule against drink.
- **Engine** (`Game.notice(card, because?)`, `unnotice`, `noticeScores()`, `noticeScore()`; saved as `noticed`):
  - **Notice:** a card the player holds, with an optional reason (a background fact they hold). Nothing is checked
    or told when a card is marked: a notice gives nothing away about what matters.
  - **Scoring:** a detail is noticed at the first paragraph any of its cards was marked, and scores if that is
    before Holmes's paragraph. In aggregate: `{noticed, scored, possible, of}` (possible 5, of 8). Nothing counts
    in Trivial.
  - Kept apart from `score()` (Holmes's deductions), as the gap analysis ruled (§6.2).
- **Checks** (`thoughts.js`): only a NOTICE thought lists `notices`; each is a clue or entity card; the game deals
  it by the thought's paragraph. The thoughts report gains "Notable details".
- **Test** (`absence.test.js`): not before the card is held; a reason must be a background fact; one card serves
  two details; the aggregate; saved, restored and withdrawn; nothing in Trivial.
- **Moved:** the thoughts report's new table. Nothing in the logs, the case report or the gates.
- **Next:** step 3, the UI ("That's odd" on a card; filing an absence; the "Odd things" list).

## Round 85 (2026-10-16): workstream 5, step 3 — the UI for noticing and absence

- **"That's odd"** on a clue or thing card (not in Trivial), with an optional "because…" (a background fact
  held). A marked card shows "marked odd" in its head and "You marked this as odd at paragraph N", with "Not odd
  after all". Nothing is told back.
- **"Something that should have happened did not"** on the board (both layouts), under the pencil form: what you
  would expect (a background fact held), when (a time on the board), and who or what would have noticed (a clue
  held). "File it" deals the clue, or says "the story does not bear that out". Easy suggests the expectation of the
  first absence that can be filed (the agreed help). In Medium and Hard the background comes by asking, so the dog's
  expectation is held only once the player asks about the dog.
- **"Odd things"** in the Questions tab: the cards marked odd (with "not odd") and the absences filed.
- **Scores** are not shown: the score display for deductions and notices together is workstream 9's.
- **Checked in headless Chrome** at ¶40:
  - Easy: the knife clue marked odd; the dog filed from the board, with the expectation suggested; both listed under
    "Odd things".
  - Medium: no suggestion, and a filing without the expectation is refused with the prompt.
- **Moved:** nothing in the logs, reports or gates (the UI only).
- **Workstream 5 is done** as agreed (Round 82), apart from the lantern and the cravat in Edith's description, left
  for later.

## Round 86 (2026-10-16): workstream 4 agreed — testimony, sources and belief (`docs/testimony-belief.md`)

- **Proposed** (the paper, written in Round 85's session): how a reader weighs what people say, against what the
  case holds, with seven questions.
- **Robert:** agreed to all seven recommendations, as written:
  - a statement's content becomes a derived proposition; the speaker's belief is a track over it;
  - doubt in two readings, mistaken (believed, false) and lying (not believed), beside the plain doubt; a
    sincerity default rule; knowing implies believing;
  - `parts` on the two mixed claims (Derbyshire the friend; the papers' struggle), split by the player;
  - reporting chains on the attestation, with belief per link;
  - mistaken and lying with logic, the other reasons recorded until workstream 3; no scoring yet;
  - the belief answers, parts and chains listed in Q7.
- **Order of work:** belief and the two doubts; parts; chains; recorded reasons and the UI.
- **Moved:** nothing (documents only).

## Round 87 (2026-10-16): workstream 4, step 1 — belief over statements; mistaken or lying

- **Format** (schema, validator):
  - **A belief track:** `aspect: "belief"`, `believes: <proposition or claim>`, id `st.<thing>.believes_<name>`. A
    claim as the object is the statement's own content, "what he said". This is Q1's derived proposition, with no
    second card.
  - **`said` on a claim:** what the clue tells for certain whatever the player makes of its content (Hunter "was
    equally certain"). It holds whenever the clue is held, doubted or not (`k.<claim>#said`).
  - **`said_at`:** when the speaker said it. By default it is the time of the scene that tells the statement.
  - **A schema variable over statements:** `{"statement": true}`. Bound to `c.<name>`, it names the speaker's
    belief in a state term.
  - **WEIGH and SOURCE thoughts may name an inference** (a belief weighed).
- **Engine:**
  - **Automatic belief:** every testimony or admission whose speaker is a person or group gets a belief track at the
    time he spoke. It is latent (like a clue's truth: open, no part of uniqueness) unless the case declares it. That
    makes 55 latent belief slots. Reports by Holmes from the papers wait for the chains (step 3), which name the
    first speaker.
  - **Doubt in two readings** (`Game.suspect(id, kind)`, `doubtKinds(id)`; saved as `doubtKind`):
    - mistaken: false, and believed;
    - lying: false, and not believed.

    The plain doubt is unchanged. The readings are variant forms of the claim (`claimForms.mistaken`, `.lying`,
    `.belief`), chosen in `activeConstraints` (`kinds`). A clash's set-aside still falls back to the plain doubt.
  - **Built in:** knowing implies believing, where one person has both tracks over one proposition (no instance in
    the case yet). A belief brings no ties of its own: what someone believed places him nowhere.
- **Data:**
  - **Rules** (default):
    - `r.witness_believes`: a witness says what he believes, unless he has a reason to lie (from Hunter's "equally
      certain", ¶36);
    - `r.denies_own_deed`: a man who denies a thing he did himself does not believe his denial, unless he has
      forgotten it (from Brown's "It's a lie!", ¶133).
  - **Belief answers** (declared tracks, each given or derived):
    - Hunter believes his charge: `said` on `c.hunter_blames_stranger`, from "He was equally certain";
    - Mrs. Straker believes Derbyshire a friend: `k.mrs_straker_believes_friend` (editorial, **verified**, by the
      sincerity default); `t84.5` names it;
    - the Colonel believes "That's not my horse": `k.ross_believes_not_his` (implicit, **verified**);
    - Brown did not believe his denial: `k.brown_lied` (editorial, **verified**, from `k.brown_broke` and the new
      rule); `t133.2` names it, with a date note (the lie is certain at ¶140, when Brown gives in).
  - **So "lying" about Hunter clashes** with what the story tells: that he was certain.
- **Changed from the plan:**
  - The denial is not among `k.brown_lied`'s premises: trusted, it contradicts what Brown did. The inference rests on
    his deed and binds the denial in the rule.
  - **Not yet:** Mrs. Straker's honest denial at the Plymouth ruse (her denial is not a clue in the case) and
    Straker's "anxiety" (a lie passed on by his wife, with the chains of step 3).
- **Test** (`belief.test.js`, new):
  - Hunter: mistaken fits, lying clashes with "certain";
  - a statement with a latent belief: proven a lie only once doubted as one; the kind is saved;
  - the answer key at the end; `k.brown_lied` built by a player.
- **Moved:**
  - **Report:**
    - rules 106 → 108, slots 669 → 673, constraints 445 → 452, verified inferences 66 → 69;
    - four declared belief tracks, all unique;
    - 55 latent belief slots, counted apart.
  - **Reveal log:** the two rules as background at ¶36 and ¶133. At the race, the Colonel's implicit inference and
    his belief question.
  - **Foreshadow log:** the two rules.
  - **Thoughts report:** `t84.5` (SOURCE) and `t133.2` (WEIGH) have inferences, 48 of 51.
    - Premise disagreements 3 → 5: `t84.6` cites `t84.5`, whose inference it does not need, and `t133.2` cites
      `t133.1`, the denial left out above.
    - One more date explained (`t133.2`).
  - **Gates:** nothing.

## Round 88 (2026-10-16): workstream 4, step 2 — splitting a statement into what was seen and what concluded

- **Format:** a claim may be `part_of` another (schema, validator). The validator checks:
  - a part's line lies within its statement's own line;
  - the parts together assert what the statement asserts (the same formula, or its conjuncts);
  - a statement splits into two parts or more; neither is derived.
- **Engine** (`Game.splitClaim(id)`, `partsOf(id)`; saved as `split`):
  - **Never dealt by mention:** a part has no span in the story. It comes only when the player splits its statement.
  - **Splitting** deals the parts, each to trust or doubt apart, in any reading (a statement part is a statement,
    with its own latent belief).
  - **The statement stays in the hand** but counts nowhere from then on, as a plain doubt does, without being marked
    doubted.
  - **Kept:** the parts are never left out by the "irrelevant cards" option.
- **Data:**
  - **`c.derbyshire_a_friend`** splits into:
    - `c.derbyshire_letters_came`: "occasionally his letters were addressed here", what she saw herself, true;
    - `c.derbyshire_friend_said`: "Derbyshire was a friend of her husband's", what she was told, false, with a
      truth slot. It carries the statement's whole assertion (Derbyshire is not Straker).
  - **`c.straker_defended_himself`** (the papers' reading, which asserts nothing in slot terms) splits into:
    - `c.papers_struggle_inferred`: "defended himself vigorously", the police reading;
    - `c.papers_assailants_inferred`: the plural "assailants".

    Both are re-filed as inference by the police (`t35.6`: "Re-file it as the police reading"), and both are false.
    The knife in his hand, the part that was seen, is its own clue already (`c.knife_in_right_hand`).
  - **`t35.6`** maps the two parts.
- **Test** (`belief.test.js`; `game.test.js`: reading the whole story deals every clue but the parts, and each
  statement with parts can be split): not dealt by reading; a clue without parts refuses; held whole, the statement says
  Derbyshire is not Straker; after the split the "friend" part says it while trusted, and nothing says it once that
  part is doubted as mistaken; the statement stays held and undoubted; saved and restored.
- **Moved:**
  - **Report:** claims 148 → 152, quotes 1028 → 1032, one more unique slot (the "friend" part's truth), one more
    latent belief.
  - **Thoughts report:** WEIGH thoughts held by a card 4 → 5. Premise disagreements 5 → 6: `t97.2` cites `t35.6`,
    which now holds cards that are not among its premises (before, "not held").
  - **Reveal and foreshadow logs, gates:** nothing.
- **Not yet:** the UI (step 4).

## Round 89 (2026-10-16): workstream 4, step 3 — reporting chains, with a belief per link

- **Format:** `chain: [{by, to, at?}]` on an attestation: who passed it on before the one quoted, first speaker first
  (schema). `at` is when that speaker said it.
- **Engine:**
  - **A belief per speaker:** each person or group along a statement's chain gets a belief of his own in its content,
    at his link's time. These are latent unless declared, as in Round 87.
  - **The doubt names whose belief failed:** `lying:straker`, `mistaken:mrs_straker` (`doubtKinds`). A statement
    with one speaker keeps the bare `mistaken` and `lying`.
  - **`Game.chainOf(id)`** gives the chain for "trace this": `[{by, to}]`, ending with the speaker the story quotes.
- **Data:**
  - **Straker's "anxiety about the horses"** (`c.straker_said_anxious`): Straker → Mrs. Straker at one o'clock, then
    she to the police. The answer key:
    - Straker did not believe it: `k.straker_lied_to_wife` (implicit, **verified**), with the new default
      `r.knows_own_errand` (a man knows his own errand: if it is not honest, he does not believe it is). Background
      from Holmes's "For a dishonest one, obviously" (¶220), not beside Straker's words, where it would hint.
    - Mrs. Straker believed it: `k.mrs_straker_passes_in_good_faith` (**verified**, by the sincerity default).
      `t32.3` names it.
  - **"A friend of her husband's"** (`c.derbyshire_friend_said`, the part from Round 88): Straker → Mrs. Straker, in
    the weeks before. Straker did not believe it: `k.straker_lied_about_derbyshire` (implicit, **verified**), from
    `k.derbyshire_is_straker` and the new default `r.knows_himself` (a man who speaks of another who is himself under
    another name does not believe what he says of him). Background from "dispose of the mythical Derbyshire" (¶225).
  - **The papers' struggle:** police → newspapers → Holmes. It is shown in the chain; it asserts nothing, so no
    belief.
  - **The sincerity default** (`r.witness_believes`) now surfaces at ¶32, beside Mrs. Straker's report, where
    `t32.3` weighs it (it was ¶36). It says a witness means what he says, so it hints at nothing.
- **Test** (`belief.test.js`):
  - the chain and its four doubts;
  - "lying:straker" puts the lie on his link only, and a bare "lying" is refused along a chain;
  - the papers' chain;
  - the answer key at the end;
  - Round 88's split test now doubts the "friend" part as `mistaken:mrs_straker`, since that part has a chain.
- **Moved:**
  - **Report:**
    - rules 108 → 110, constraints 453 → 459, verified inferences 69 → 72;
    - three declared belief tracks, all unique.
  - **Reveal log:**
    - the sincerity rule from ¶36 to ¶32;
    - at ¶220, the errand rule, Straker's lie and its question;
    - at ¶225, the alias rule, the Derbyshire lie and its question.
  - **Foreshadow log:** the same three rules.
  - **Thoughts report:** both SOURCE thoughts are held. Premise disagreements 6 → 7: `t32.3` cites `t32.2`, her own
    observation, which its inference does not need.
  - **Gates:** nothing.

## Round 90 (2026-10-16): workstream 4, step 4 — reasons recorded, and the UI for weighing testimony

- **Engine** (`Game.setDoubtReason(id, reason)`, `DOUBT_REASONS`; saved as `doubtReason`): a doubt may say why.
  - **The reasons:** could not have seen it, an inference written as fact, hearsay, it cuts both ways.
  - **Recorded only:** their logic (undercuts) is workstream 3's. Mistaken and lying are the readings with logic
    (Round 87).
  - Only for a clue the player doubts; trusting it again clears the reason.
- **UI** (the card):
  - **Doubting a statement:** "I suspect this may be false", or at once how ("the speaker was mistaken", "the
    speaker lied"). Along a chain the choices name each speaker ("John Straker lied", "Mrs. Straker was
    mistaken").
  - **Once doubted:** the reading in force, "Say how" to change it, and "Why" (the recorded reasons).
  - **"Passed on: John Straker → Mrs. Straker"** for a statement with a chain.
  - **"Split this statement"** where the statement has parts. Afterwards the card lists the parts and says it
    counts nowhere itself.
- **Checked in headless Chrome** at ¶84, Medium: the Derbyshire statement split; its "friend" part showing the
  chain and four doubts; "John Straker lied" taken; "hearsay" kept as the reason.
- **Test** (`belief.test.js`): a reason only on a doubted clue, from the list; saved; cleared with the doubt.
- **Moved:** nothing in the logs, reports or gates.
- **Workstream 4 is done** as agreed (Round 86), with two items left:
  - **Not built:** Mrs. Straker's honest denial at the Plymouth ruse (`t92.3`). Her denial is not a clue in the case;
    it would need one.
  - **Not done:** scoring WEIGH thoughts. It was deferred by the agreement (Q6), to workstream 6.

## Round 91 (2026-10-17): Mrs. Straker's honest denial at the ruse (`t92.3`); a correction to Round 90

- **Correction:** Round 90 said her denial at Holmes's Plymouth ruse "is not a clue in the case". It is:
  `c.wife_never_had_dress` ("I never had such a dress, sir", ¶92), a true testimony that `k.dresses_for_the_other_woman`
  rests on. Only Holmes's own line (`c.holmes_plymouth_ruse`) had been looked at. Robert asked.
- **Data:**
  - a declared belief track, `st.mrs_straker.believes_wife_never_had_dress` (Thursday evening, true);
  - `k.wife_denies_in_good_faith` (editorial, **verified**, by the sincerity default), named by `t92.3`. Doubting her
    denial as a lie now clashes with the case.
- **Left as it is:** Holmes's ruse line keeps no slot content. "The dress was hers" (false) would clash with her
  true denial, and a clash sets aside both story clues, her denial among them, which the dress inferences need.
- **Test** (`belief.test.js`): her denial has the two readings; the inference is built at ¶92; the answer key.
- **Moved:**
  - **Report:** one more declared belief (unique) and verified inference (72 → 73).
  - **Thoughts report:** WEIGH thoughts held 5 → 6, deductions with an inference 50 of 53. Premise disagreements
    7 → 8: `t92.4` cites `t92.3`, now an inference of its own that `k.dresses_for_the_other_woman` does not need.
  - **Logs and gates:** nothing.

## Round 92 (2026-10-17): hand-off — a focused review of the annotation

- **Robert:** agreed to the plan. First a focused review of the annotated reading against what the case can now
  hold (the tags whose features exist, about 190 of 294 thoughts); then workstream 3 (defeasibility); then
  workstream 6 (hypotheses, scenarios, residue); then a second review of the tags those make modelable.
- **`docs/kickoff-annotation-review.md`** hands the review to a new session:
  - the scope;
  - a per-thought method with five verdicts;
  - the review table to write (`docs/annotation-review.md`);
  - the known items to start from (the eight premise disagreements, the four late RECORDs, NOTICE and WEIGH gaps,
    the unapplied knowledge rules, Round 79's open list);
  - the traps of Rounds 60–91.

  Fixes are proposed in batches for Robert, and nothing is changed without him. `CLAUDE.md` points at it.
- **Moved:** nothing (documents only).

## Round 93 (2026-10-17): the annotation review — verdicts, one question of direction, fix batches

- **`docs/annotation-review.md`**: every one of the 191 thoughts in scope, checked against a dump of what holds it
  (maps, inference premises, formula and rules, notices, the claims' asserts, `said`, truth, chains, parts and
  filings, the paragraph each card is dealt). 138 accurate, 25 partial, 8 wrong, 11 missing but modelable now
  (or with no plain card), 8 waiting for workstreams 3 or 6.
- **Found:** the eight premise disagreements sort into data short (`t32.3`), annotation long (`t34.5`, `t97.2`,
  `t124.2`, `t150.1`) and annotation right where the format cannot say it (`t84.6`, `t92.4`, `t133.2`: a step
  that needs a statement weighed first). The four "dealt late" RECORDs were wrong mappings or a claim quoted only
  from its last line. The gypsies' inference uses their departure as evidence, which the reader and Holmes do
  not. A RECORD (`t34.1`) held the player's two absences. Two rules (`r.horse_gregarious`, `r.tendon_nick`) surface
  at ¶18 and lean towards the solution.
- **Robert:** agreed to every recommendation, and to building all six batches. On the question of direction (who
  drugged the dish: the annotation says open, its own `t37.16` and the case say Straker by default) he took (a):
  the case keeps Straker; the three thoughts that called it open are corrected, its exception (an accomplice, the
  wife) left for workstream 3.
- **Moved:** nothing (documents only).

## Round 94 (2026-10-17): review batch 1 — mappings, citations, one label; who drugged the dish

- **Annotation** (`thoughts.json` and `reading-annotated.md`), the review's A1–A27 but A14 (with batch 3):
  - **maps added** where a held card was unmapped: `t4.1` (the two ¶4 events), `t19.1`, `t19.4` (the reputation),
    `t26.1` (the sworn paper), `t29.4` (the dog rule), `t32.2` (Straker's stated reason), `t36.3`, `t40.6`,
    `t40.7`, `t60.2`, `t78.5`, `t93.1`, `t133.1` (Brown's denial), `t141.2`, `t226.1` (the three steps Holmes
    states there);
  - **maps corrected:** `t14.1` (the ¶14 card, not the ¶37 one), `t34.1` (the lads' line only, not the two
    absences), `t82.2` (the two statements it weighs, not `t81.5`'s inference), `t84.7` (not `t92.15`'s
    inference), `t161.1` (not the ¶162 photograph), `t224.1` (the vesta only);
  - **a new thought, `t34.8` ABSENCE** (careful): nobody raised the alarm in the night, mapping `c.no_alarm`.
    `t34.5` cites it in place of `t34.1` and `t32.2`;
  - **citations:** `t37.8` drops `t26.1`; `t97.2` moves `t35.6` from its premises to `strains`; `t124.2` cites the
    return track (`t123.1`), not the man's change of mind; `t150.1` drops `t140.1`;
  - **a date:** `t133.2` is now `t135.1` (the invitation into the parlour is ¶134–¶135). Older Rounds keep the old
    id;
  - **who drugged the dish** (Round 93, (a)): `t92.8`, `t218.3`, `t220.3` and "Still open when the story ends"
    now say the default of `t37.16` answers it and its exception, an accomplice, is the open part.
- **Data:** `k.horse_at_mapleton_by_reach` loses "which also has every reason to keep him from running" from its
  label (not among its premises).
- **Moved:**
  - **Thoughts report:** 295 thoughts. Held by a card: RECORD 89 → 91, ABSENCE 2 → 3 of 6, WEIGH 6 → 12, PREDICT
    5 → 8; NOTICE 4 → 3 (`t84.7` keeps its `notices`, which the coverage table does not count). "Dealt later than
    the reader has it" 4 → 2 (`t122.1`, `t123.1`: batch 2). Premise disagreements 8 → 3 (`t84.6`, `t92.4`,
    `t135.1`: batch 4).
  - **Case report:** the inference table's row for Brown's lie names `t135.1`.
  - **Reveal and foreshadow logs, gates:** nothing.

## Round 95 (2026-10-17): review batch 2 — the double track in three lines; two rules moved to where they are used

- **The double track** (B3): `c.double_track_loops`, quoted only from its last line (¶124) but telling the turn and
  the return as well, is three claims, each quoted from its own line:
  - `c.double_track_turns`: "The double track turned sharp off and took the direction of King's Pyland" (no slot
    content);
  - `c.double_track_returns`: "the same tracks coming back again in the opposite direction", carrying
    `e.brown_turns_back` (agent the track's man, patient the horse, near Mapleton);
  - `c.double_track_ends`: "It ended at the paving of asphalt ...", carrying `e.horse_hidden`'s agent and patient.

  `k.track_man_changed_his_mind` rests on the turn and the return, `k.tracks_end_at_mapleton` on the return and the
  end; Holmes's route step `t117.2` and `a.follow_tracks` are re-pointed.
- **Found while building:** the turn and the return are both in story paragraph 122 (¶123 is "One for you,
  Watson"). `t123.1` and `t123.2` are now **`t122.2`** and **`t122.3`**, dated ¶122; `t124.2` and `t146.2` follow.
  The review had them at ¶123.
- **Two rules** (B6, B7; Round 79's borderline texts):
  - `r.horse_gregarious` in Holmes's words, "left to himself, he makes for his own stable or the nearest other
    one" (no more "taken out and loose ... that is where it is"), relevant from the horse in the hollow (¶37), not
    ¶18;
  - `r.tendon_nick` relevant from the lame sheep (¶173), not ¶18. Holmes's route step for the knife (`t81.5`)
    listed it among its flat premises, which moved the step's gates (¶104, ¶170) to ¶174 on the first try. It
    does not need it (the annotation's own point: the general form carries the chain) and no longer lists it.
- **Moved:**
  - **Reveal and foreshadow logs:** the two rules leave ¶18 (gregarious at ¶37, the tendon nick and its gloss at
    ¶173); the turn, the return and `e.brown_turns_back` with its four questions at ¶122 (were ¶124); the end at
    ¶124.
  - **Case report:** claims 152 → 154, constraints 461 → 462, quotes 1034 → 1036; `e.brown_turns_back` first told
    at ¶122; the route rows re-pointed.
  - **Thoughts report:** "Dealt later than the reader has it": none (was 2). Explained date misses 5 → 4
    (`t122.3`'s note is gone: dealt ¶122, as the reader has it).
  - **Gates:** `t123.2` at ¶146 is `t122.3`; nothing moves.

## Round 96 (2026-10-17): review batch 3 — the gypsies, argued as Holmes and the reader argue it

- **The fault** (review, `t62.3`): `r.gypsies_avoid_trouble` read "a band that has gone did not take the horse with
  it", so `k.gypsies_did_not_take_him` concluded from their departure. The reader's `t62.3` says the departure
  points at nothing (under the period belief they would leave either way), and Holmes (¶114) argues from what they
  would risk: "They could not hope to sell such a horse. They would run a great risk and gain nothing".
- **Data:**
  - `r.gypsies_avoid_trouble` (still flagged a stereotype): "(A prejudice of the period.) Gypsies were said to keep
    clear of anything that would bring the police on them: they would not steal a horse they could never sell."
    Quoted from both of Holmes's lines; its schema says a band camped near does not hide the horse.
  - `k.gypsies_did_not_take_him` (verified): from the band camped near the hollow (`c.gypsies_camped`), the
    famous horse no one could sell (`r.famous_horse_unsellable`) and the rule. No longer from their departure.
- **Annotation:** `t62.3` gets `no_inference: workstream-3` (the departure undercut, ws 3's); `t62.4` (DROP) names
  the inference and cites `t62.1`; `t114.3` maps it in place of the horse-instinct step.
- **Checker:** a DROP thought may name an inference (a dropped candidate is a conclusion, "not X").
- **Moved:**
  - **Reveal and foreshadow logs:** the rule's new text at ¶19; the inference's new label at its gate.
  - **Case report:** quotes 1036 → 1037; the inference's rule binding; the route row is `t62.4`'s.
  - **Thoughts report:** deduction-type thoughts 53 → 54 (a DROP that names one), reasons `workstream-3` 2 → 3.
  - **Gates:** ¶114 `t62.3` → `t62.4`, same inference.

## Round 97 (2026-10-17): review batch 4 — a weighed statement counts as cited; the boot comparison's untold result

- **The thoughts checker** (`engine/thoughts.js`, `checkChains`): two kinds of citation now count, where before
  they were "cited, not a premise":
  - **a weighed statement:** a cited WEIGH or SOURCE thought whose inference is a belief about a statement (the
    statements its rule applications bind) stands for that statement. It counts when the step uses the statement
    (a premise: trusted, as weighed) or must set it aside (the statement speaks of the conclusion's questions);
  - **a statement the inference binds in a rule application:** the step weighs it without resting on it (Round 87's
    denial, which trusted would contradict the deed).
- **Resolved:** `t84.6` (Mrs. Straker's "friend", weighed by `t84.5`, is what the merge sets aside), `t92.4` (her
  honest denial, weighed by `t92.3`, is what the dress test uses), and `t135.1`'s citation of the denial. `t135.1`
  keeps one disagreement, `k.brown_broke` (¶140) not cited: the review's option (a), with its date note. The
  manner reading at ¶135 (C11) waits for workstream 6.
- **Data:** `a.compare_boots` gains `yields.unknown`, "The text never says what the comparison showed", the marker
  `a.question_maid` has; `t107.2` maps it.
- **Test** (`thoughts.test.js`): the three rows; a weighed statement about something else (Hunter's charge cited
  by `t84.6`) still counts as uncited.
- **Moved:** thoughts report: premise disagreements 3 → 1 (`t135.1`); ABSENCE held 3 → 4 of 6. Logs, case report,
  gates: nothing.

## Round 98 (2026-10-17): review batch 5 — three notable details, one on an event card; the second marking

- **Notices on an event card:** the odd thing may be that something happened at all. `t18.3`: the horse was taken,
  when laming or hiding him in his stall would serve (Holmes asks it at ¶57, so it can score). The thoughts checker
  lets `notices` name an event card; the card view offers "That's odd" on events (checked in headless Chrome at
  ¶19: the button, the mark, the flag).
- **Two more notices** (no Holmes paragraph, so they cannot score):
  - `t40.5`: "by repeated blows" against "a savage blow" (`c.simpson_stick`, `c.head_shattered`);
  - `t82.4`: a cataract knife kept on a trainer's dressing-table (`c.knife_from_dressing_table`).
- **The second marking** (`t186.1`, "two markings, not one"): `c.silver_blaze_foreleg`, "Silver Blaze also has a
  mottled off-foreleg", Ross's testimony quoted from ¶186. `c.silver_blaze_markings` is dealt at ¶146, where only
  the forehead is told, so its text could not carry the leg.
- **Test** (`absence.test.js`): the aggregate is now possible 6, of 11; an event card marked odd, scored against
  Holmes's ¶57.
- **Moved:**
  - **Reveal and foreshadow logs:** the foreleg clue at ¶186.
  - **Case report:** claims 154 → 155, quotes 1037 → 1038.
  - **Thoughts report:** "Notable details" 8 → 11 rows.
  - **Gates:** nothing.

## Round 99 (2026-10-17): review batch 6 — the stranger's "Can you tell me where I am?" as a lie

- **The thought** (`t24.2`): "the 'lost' story is a cover". The case concluded his aim was not to find his way
  (`k.stranger_came_on_purpose`, Round 78) but had no statement of his to doubt.
- **Data:**
  - `c.stranger_says_lost` (¶22, "Can you tell me where I am? ... I had almost made up my mind to sleep on the
    moor"): Edith's testimony, passed on from the stranger (chain: the stranger → Edith, at 21:05), asserting his
    aim then was `find_way`; truth false, with a truth slot. Its doubts: mistaken or lying, by him or by Edith.
  - `r.lost_is_a_pretence` (default, from ¶24, beside `r.lost_does_not_know`): a man who says he has lost his way,
    when he came where he is on purpose, does not believe what he says.
  - `k.stranger_lied_about_lost` (implicit, **verified**): from `k.stranger_came_on_purpose` and the rule, the
    stranger did not believe his own words; a declared belief track (false at 21:05).
  - `t24.1` and `t24.2` map the statement.
- **The clash trap checked** (Rounds 78, 91): trusted, the statement contradicts the inference's conclusion, not a
  clue. Once the player builds `k.stranger_came_on_purpose`, the clash is {the inference, the statement}, and only
  the statement (a story clue, the lowest weight) is set aside; `c.stranger_knew_lad_alone` stays trusted. Doubted
  as his lie, nothing clashes.
- **Test** (`belief.test.js`): the four doubts; the inference built, the lie granted, the one clash and what it
  sets aside; the answer key.
- **Moved:**
  - **Reveal and foreshadow logs:** the statement at ¶22; the rule as background at ¶24 (it names the reader's own
    step there, as `r.lost_does_not_know` does, and hints at nothing later).
  - **Case report:** claims 155 → 156, rules 110 → 111, constraints 462 → 465, quotes 1038 → 1040, a 25th track,
    verified inferences 73 → 74, two more unique slots (the statement's truth, his belief).
  - **Thoughts report:** one more implicit inference. **Gates:** nothing.
- **The review's batches are all built** (Rounds 94–99). Left, as recommended: C2, C5, C7, C8, C10 (leave), C4
  (optional), C11 and C13 (with workstream 6). `CLAUDE.md` now points at the review and at workstream 3 next.

## Round 100 (2026-10-17): hand-off — workstream 3, defeasibility

- **Leak check** (Robert asked for it; cheap on his plan): `node checker/check.js cases/silver-blaze --all --runs 2`
  passed all six card texts added in Rounds 95–99 (the three track claims, the stranger's "where am I", the
  foreleg); `--background` passed the four rules moved or reworded (gregarious, gypsies, the pretence, the tendon
  nick). 549 of 569 pieces "ok"; the 20 flags are on cards untouched since Round 92 (18 as on 2026-10-13, and two
  traits never checked before), listed in the kickoff.
- **`docs/kickoff-workstream-3.md`** hands workstream 3 to a new session: design first (`docs/defeasibility.md`),
  with the inputs the review gathered (the annotation's undercuts, the defaults with named exceptions including
  the accomplice exception Round 93 left open, the police's four, the recorded doubt reasons) and the traps of
  Rounds 60–99. `CLAUDE.md` points at it; it supersedes `docs/kickoff-annotation-review.md`.
- **Moved:** nothing (documents only).

## Round 101 (2026-10-17): workstream 3 agreed — defeasibility (`docs/defeasibility.md`)

- **Proposed** (the paper): the reader's three moves with an exception (a reservation, a defeat, a refutation),
  what the case holds (`unless` never read or shown; one application cannot be set aside; the police's four
  asserted without a reason; `k.drugger_took_the_horse` in seven gates), seven questions, the data per thought.
- **Robert:** agreed to the recommendations of Q1–Q5 and Q7, and to the order of work:
  - an exception is a named entry of a rule's `unless` (id, text, source, formula), shown with its rule after a
    leak check;
  - a played exception is ruled out, a reservation (open: the step still counts) or a defeat (established by
    what the player holds: the step counts nowhere, the exception its reason);
  - the police's four get police defaults with `defeated_by`, are verified as their reasoning, and slice 4's gate
    then makes an unexplained `asserted` an error;
  - "could not have seen it" gets logic; inference-as-fact, hearsay and neutral stay recorded;
  - undercuts score before Holmes's paragraph, in aggregate, and never gate;
  - the accomplice is an exception sourced at ¶218, always a reservation.
- **Deferred:** Q6 as a whole (one culprit, `t4.2` and `t68.3`, and whether an applied default yields in a clash
  before a story clue).
- **Moved:** nothing (documents only).

## Round 102 (2026-10-17): workstream 3, step 1 — named exceptions, and raising one against an application

- **Format** (schema, model, validator): an `unless` entry may be `{id, text, source?, formula?}`. The formula is
  over the rule's variables, grounded per application (`exceptions` on each `#rule<n>`); ids unique in the rule;
  the source quoted within one paragraph.
- **Engine** (`Game.applicationsOf`, `exceptionsOf`, `exceptionStatus`, `raise`, `withdraw`, `raisedOn`,
  `restingOnDefeated`; saved as `raised`): Q2's three outcomes. Ruled out: refused, with the constraints that rule
  it out. Open: a reservation, the card still counts. Established: a defeat, the card doubted with the exception
  as its reason. Raisable once the rule is held and the exception's line read.
  - **Found while building:** the check must leave out every use of the default with the same grounded exception,
    not only the card's own. `k.hunter_was_drugged`, `k.found_before_seven` and `k.drugging_is_dishonest` apply
    `r.drugged_guard` to the same events, and each ruled the accomplice out by assuming it away.
  - **Cost:** the check itself takes about 0.1 s at ¶218. The first clash computation there (about 11 s, done
    anyway by the game) is the slow part.
- **Data:** `r.dog_barks_at_strangers`'s "the dog did bark and nobody heard" (`barked_unheard`, from "for they are
  both sound sleepers", ¶34, no formula); `r.drugged_guard`'s "the drugger had an accomplice" (`accomplice`, from
  "Which of them, then, had access to that dish without the maid seeing them?", ¶218, formula `diff` of the
  dosing's and the taking's agents).
- **Test** (`defeasibility.test.js`, new):
  - the grounded exceptions, and two format errors;
  - the accomplice: not before ¶218; ruled out for a player who doubts Holmes's curry step and trusts the police
    (Simpson drugged and took), by the police's inference; with that doubted, a reservation that leaves the card
    counting and blocks nothing, saved, and still open at the end of the story;
  - the sleepers, a reservation;
  - on a copy of the case, a made-up pair on the dog rule: one the clues entail (a defeat: doubted, saved, withdrawn
    by trusting again) and one they contradict (refused).
- **Seen for step 3:** a police inference that clashes with a true story clue sets the clue aside (story clues
  weigh least, then inferences someone else stated): `k.police_simpson_took_horse` against
  `c.simpson_came_for_information`. The police's chain then rules the accomplice out for a player who keeps it.
- **Moved:**
  - **Report:** quotes 1040 → 1042; a new "Exceptions" section, five rows (the accomplice on the four applications
    of `r.drugged_guard`, each "left open by the story; in the answer key: does not hold (the default's answer)";
    the sleepers, no formula).
  - **Reveal and foreshadow logs, thoughts report, gates:** nothing. Exceptions are not shown yet (step 2).

## Round 103 (2026-10-17): workstream 3, step 2 — exceptions shown with their background facts

- **Engine** (`Game.info`): each `unless` entry is a piece of the cards its rule attaches to (`kind: 'exception'`),
  from the fact's paragraph or the exception's own source line, whichever is later.
- **UI:** "Unless …" under the fact in the card's Background; one whose line comes later shows there, with its fact
  named. Checked in headless Chrome at ¶35 (Easy, the Horses topic): the exceptions under their facts, the drugged
  sleepers arriving at ¶34.
- **Held back** (Q1 (i)), each made a named exception with a source. Reviewed by eye at the paragraph each would
  show:
  - three that speak of drugging before anyone is drugged, to ¶34 ("under the influence of some powerful drug"):
    `r.horse_would_wake_sleepers` (¶18), `r.dog_barks_at_strangers`'s "asleep, drugged, muzzled or shut away" (¶29),
    `r.present_sees`'s "asleep or stupefied" (¶29);
  - `r.no_coincidence`'s drug brought on the chance of a dish (¶12), to the opium (¶37);
  - `r.practise_first`'s sheep (¶12), to the lame sheep (¶173);
  - `r.laying_against`'s "he meant to lame it for someone else" (¶18, the solution's method), to "laying against
    their own horses" (¶220);
  - found by the checker: `r.planned_the_dish`'s "he learned the menu from someone in the house" (¶12), to the supper
    (¶20).
- **Leak checker** (`--exceptions`, and in `--all`): each exception once, where it first shows, with a system prompt
  of its own. The first run used the story prompt and flagged 53 of 71: it read the rule as a claim the story had not
  made and the exception as an event. With its own prompt (the fact is background, the exception a possibility; a
  leak is a particular of this story not yet told, or a pointer at an unhinted turn), 70 of 71 ok; the one flag is
  the menu above, now ok at ¶20 ($0.18).
- **Left as it is:** `r.markings_identify_horse`'s own text already says "unless the markings have been hidden"
  (twice), so its exception line repeats it.
- **Test** (`defeasibility.test.js`): the drugged sleepers and the dog's wait for ¶34 while their facts show earlier;
  an exception with no line comes with its fact; the menu at the supper; the sheep not yet.
- **Moved:**
  - **Reveal and foreshadow logs:** 104 exception lines (71 exceptions, some on more than one card); nothing else.
  - **Report:** quotes 1042 → 1049; the Exceptions table gains eight rows (the seven held back, on their
    applications; no formulas).
  - **Thoughts report, gates:** nothing.

## Round 104 (2026-10-17): workstream 3, step 3 — the police's four as reasoning; slice 4's report gate

- **Format** (schema, model, validator):
  - `defeated_by` on a false inference's rule application: the named exception (with a formula) that holds in the
    true story. Verification keeps the application, so the inference is verified as the character's reasoning. The
    case's reading leaves it out (`defeated`): it is active only for a player who trusts the inference. The validator
    checks the exception in the answer key.
  - A schema variable may serve only a named exception; a variable bound to a proposition stands for its slot.
  - A proposition may carry `source` lines, and is dealt at the first.
  - **The report gate (slice 4):** an inference the engine does not derive and that gives no `asserted: "<why>"` is
    an error. Silver Blaze: 80 verified, 7 asserted, each with its reason.
- **Data** (seven rules, two propositions, two inferences; the four rewritten):
  - `k.police_simpson_drugged` takes Hunter's charge as fact by `r.witness_saw_it` (¶36: "a witness who is sure of
    what he says he saw is commonly taken to have it right"), defeated by "he could not have seen it"
    (`p.hunter_saw_the_dosing` false). The reader's `k.hunter_could_not_see` (`t36.2`, editorial, verified) gives it
    from Hunter's eating and `r.saw_drug_would_not_eat`. The rule and the proposition come at Holmes's line on the
    eater (¶218), not beside Hunter's charge, where they would give the step away; `t36.2` gets a date note.
  - `k.police_simpson_took_horse` rests on the first and applies `r.drugged_guard`, as Holmes does (sound; the false
    part is its premise), and `r.night_taker_steals` (¶46), defeated by "he meant to injure it" (from "If he wished to
    injure it", ¶57). Its formula drops `simpson.purpose`, which `t.police`'s assignment keeps.
  - `k.police_stick_killed`: `r.clutched_from_assailant` (¶35), defeated by "it was in his own hands before he was
    struck" (from Simpson's "he had lost it", ¶60); `r.weapon_fits_the_wounds` (¶40), sound in the true story.
  - `k.gregory_gypsies`: `r.flight_shows_guilt` (¶62), defeated by "they would have gone anyway"
    (`p.gypsies_leave_on_trouble`, raised at ¶62, given by the period belief `r.gypsies_clear_out`, flagged a
    stereotype, from Holmes's "These people always clear out", ¶114). `k.gypsies_would_leave_anyway` (editorial,
    verified) is `t62.3`'s, which loses `no_inference`; `bk.gypsies` maps the new rule.
- **Found while building:**
  - With the police's second step applying `r.drugged_guard` to the same events, it cannot answer the accomplice
    either: trusting the police no longer rules the accomplice out (Round 102's test said it did). The test now says
    so; the made-up pair still covers "ruled out".
  - A proposition reaches the player only through a clue that speaks of it; the two new ones had none, so the
    thoughts report dated their inferences "never". Hence `source` on propositions.
  - The States table counted the defeated application as giving Hunter's belief; it no longer does.
  - **A clash set an inference aside but left its rule applications active** (`Game.clashes`). Harmless while every
    application was true; with the police's defeated ones it was not. At the end of the story the gypsies' step,
    set aside by the horse's instinct, kept "people who leave … have what was taken" active, which then set aside
    `c.gypsies_gone`, and the stick's and Hunter's applications set aside the shattered head, the cravat and the whole
    curry chain (`game.test.js`'s clash test caught it: the honest-record clue was no longer the one set aside). Now an
    application counts as part of its inference: caught in a clash it is weighed as the inference, and a card set
    aside goes whole, its applications with it. This is how a doubt already treats them (`doubt_with`), not a change
    of the clash order (which stays open, with Q6).
- **Leak check:** the seven rules under `--background`. Four were flagged as untrue rules (a witness's certainty, the
  clutched thing, the fitting weapon, flight), so they are now written as presumptions ("commonly taken to …",
  "commonly suspected of …"); then 4/4 ok. `--exceptions` 80/80 ok ($0.16 in all).
- **Played** (test, Medium): at ¶62 every police exception can be raised, as a reservation; the gypsies' becomes a
  defeat once the player builds `k.gypsies_would_leave_anyway`; at ¶219, with `k.hunter_could_not_see` built, "he
  could not have seen it" defeats the police's first step, and their second is marked as resting on it. "He meant to
  injure it" is ruled out for a player who still trusts Gregory's "poor weapon".
- **Test** (`defeasibility.test.js`): the four verified and their defeated applications out of the case's reading;
  the gypsies' defeat at ¶62; Hunter's at ¶219, with the police's second step resting on it; at the end of the story no
  true clue lost to a police step, and the applications gone with their inferences.
- **Seen, for Robert:** a stated inference outweighs a story clue in a clash (Round 102), so a player who keeps the
  police's account loses true clues to it. Robert: leave it; the clash order is to be rethought after this workstream,
  with Q6 and workstream 6's graded support.
- **Moved:**
  - **Reveal and foreshadow logs:** 24 reveal lines, all additions: the seven rules and their exceptions where
    planned (¶35, ¶36, ¶40, ¶46, ¶57, ¶60, ¶62, ¶218), and the two propositions (¶62, ¶218); 46 foreshadow lines.
  - **Report:** rules 111 → 118, propositions 3 → 5, constraints 465 → 470, quotes 1049 → 1062, verified 74 → 80,
    asserted 11 → 7 (each with its reason), forced slots 453 → 455; the four police rows verified with their rules;
    five Exceptions rows (four "established; holds, and defeats this application", the accomplice left open).
  - **Thoughts report:** with an inference 50 → 52 (`t36.2`, `t62.3`); `workstream-3` left on `t4.2`, `t68.3`
    (Q6, deferred); premise disagreements 1 → 2 (`t36.2` cites Hunter's charge, where the reader takes his eating;
    the inference rests on the analysed remains, ¶37); date misses explained 4 → 5.
  - **Gates:** nothing.

## Round 105 (2026-10-17): workstream 3, step 4 — the exceptions the annotation counts, and their scoring

- **Annotation** (`thoughts.json`): `raises: [{target, exception}]`, the plays that count for a thought. The field
  is named for the action (as `notices` and `files` are), not `undercuts` as the paper had it: that is already a
  relation type on thoughts.
  - `t34.3` (the sleepers against `k.dog_knew_the_visitor`), now with Holmes ¶219 (his "not barked enough to
    arouse", `t219.1`); mirrored in `reading-annotated.md`;
  - `t36.2` (could not have seen it, against `k.police_simpson_drugged`), Holmes ¶218;
  - `t62.3` (gone anyway, against `k.gregory_gypsies`), Holmes ¶114;
  - `t56.1` (the poisoning and the cravat items of Gregory's case) and `t218.3` (the accomplice): recorded, with no
    Holmes paragraph, so they cannot score.
- **Checker** (`engine/thoughts.js`): the target is an inference, the exception a named one of a rule it applies.
  The report's new "Exceptions raised" table: where each exception shows, Holmes's paragraph, whether it can score.
- **Engine** (`Game.raiseScores`, `raiseScore`): Q5 as agreed, in the shape of the notice scores. A raise (a
  reservation or a defeat) scores when made before the thought's first Holmes paragraph; nothing counts in Trivial;
  nothing gates.
- **Test** (`defeasibility.test.js`): two checker errors; the gypsies raised at ¶62 score against ¶114, and are saved;
  the accomplice is recorded and never scores.
- **The kickoff's "ws 3" thoughts, each held or given a reason:**
  - held: `t34.3` (a reservation, scored), `t36.2` (an inference and a defeat, scored), `t62.3` (the same),
    `t37.16` (the accomplice, a reservation, never scored), `t35.6` (the parts of Round 88; inference-as-fact stays
    recorded), `t40.6` (mapped; no police step rests on the storm), `t64.3` (the case holds the corrected default
    already);
  - partial: `t56.1`, two of its four items (the stick against one blow is a strain, workstream 6; the cravat's
    history is the clutch exception, counted);
  - given a reason: `t29.3` (Gregory's asserted conditional, no rule), `t32.4` (a gloss with no content);
  - deferred by Robert (Q6): `t4.2`, `t68.3`, still `no_inference: workstream-3`.
- **Moved:** thoughts report: the "Exceptions raised" table (six rows, three can score). Logs, case report, gates:
  nothing.

## Round 106 (2026-10-17): workstream 3, step 5 — the UI for exceptions; workstream 3 done

- **UI** (`ui/app.js`, `ui/style.css`): on an inference's card, "Unless…" lists the exceptions of the defaults it
  applies, each a link to raise it. The answer comes as a toast: ruled out (with what rules it out), a reservation
  (the step still counts) or a defeat (it no longer does). A raised exception shows where it stands now, with "take
  it back". A defeated step's card says "This step no longer counts: you have shown that …. That does not make its
  conclusion false", with "Count it again", in place of the plain doubt's line and its "Why" list. A step resting on
  a defeated one is flagged.
- **Checked in headless Chrome** at ¶62, Medium, on Gregory's gypsies card: the exception offered; clicking it
  raises a reservation (toast, then "Unless they would have gone anyway — a reservation: the step still counts");
  with `k.gypsies_would_leave_anyway` built, the defeat shown in place of the doubt line.
- **Workstream 3 is done** as agreed (Round 101): `docs/defeasibility.md` marked built, with a "Left open" section:
  - Q6 (deferred);
  - the clash rethink (Robert, Round 104: after this workstream, before or as the start of workstream 6), with what
    was seen;
  - the reading-layer calls made by precedent;
  - the doubled markings text.
- **`CLAUDE.md`** points at the paper as built, and at workstream 6 next.
- **Moved:** nothing in the logs, reports or gates (the UI only).

## Round 107 (2026-10-17): hand-off — how clashes weigh what they set aside

- **Robert:** next, the clash rethink as a short design question of its own, in a new session, before workstream 6;
  Q6 (one culprit) goes with it.
- **`docs/kickoff-clashes.md`** hands it over: the question (Round 17's clashes, Round 19's provenance order), the
  cases gathered (a stated inference outweighing true clues; a false applied default; what works today and must keep
  working), what workstream 3 gives a better rule, the questions the paper must answer, and the traps of Rounds
  60–106. It supersedes `docs/kickoff-workstream-3.md`. `CLAUDE.md` points at it.
- **Moved:** nothing (documents only).

## Round 108 (2026-10-17): how clashes weigh what they set aside — agreed (`docs/clashes.md`)

- **Measured** (a scratch script, four players over the whole story on Easy: one builds everything; one is passive
  and keeps the police's account; one doubts Holmes's curry step; one applies one culprit from ¶4). Today's rule
  loses true cards:
  - Simpson's admission with Hunter's charge (¶104);
  - Simpson's lodging to the police's steps (¶60, ¶182);
  - with one culprit applied, the empty stall and the open door (¶102), and "the horse kicked him" (¶219).

  Which minimal clash is found depends on the search order as much as on the weights. The kickoff's first case
  (`c.simpson_came_for_information`) no longer arises since Round 104.
- **Proposed** (the paper):
  - Q1: four classes, the lowest given up first: others' inferences; the player's heuristics; statements
    (testimony, then report, then admission); the player's and Holmes's inferences;
  - Q2: "never by truth" kept;
  - Q3: one member set aside, ties all; Easy says which and why;
  - Q4: Medium and Hard unchanged;
  - Q5: `r.one_culprit` an applied heuristic with a formula; `t68.3` to workstream 6;
  - an order of work in three steps.
- **Robert:** agreed to all of it. The clash system is a convenience of the lower difficulties and need not be
  perfect.
- **Moved:** nothing (documents only).

## Round 109 (2026-10-17): clashes, step 1 — the weighing

- **Engine** (`Game.clashes`, `#clashWeight`, `CLASH_CLASSES`): a member caught in a clash weighs `[class, within]`,
  and the lightest gives way first. The classes:
  - an inference someone other than Holmes stated;
  - an inference of the player's or Holmes's that applies a `heuristic`;
  - a clue, ordered within by how it was told: someone's word (testimony, or an inference stated as fact), then a
    report, then an admission, then anything seen, found or written;
  - the player's or Holmes's other inferences.

  One member is set aside, the lightest. On a tie every tied member goes, and the clash says so. The search tries
  members heaviest first, so a clash rests on as light a member as it can. Each clash now carries `aside`, `why`
  (its class) and `tie`. Nothing reads the answer key.
- **Played** (Easy, the whole story, building nothing): every card set aside is false. At ¶46 the police's "took
  the horse to steal it" goes, and the hope of early exercise (false) stays until Holmes's chain at ¶104. At ¶104
  Hunter's charge goes, and Simpson's admission stays (before, both went). A player who doubts Holmes's curry step
  keeps Simpson's lodging at ¶182, and the police's "Simpson drugged him" goes (before, the lodging went and the
  police's two steps stayed to the end). That replay takes 17 s, against 64 s before: fewer clashes are found
  along the way.
- **Left as a tie:** a player who builds the police's "Simpson drugged him" (¶40) beside Holmes's dish step holds
  both as their own, so both go. A doubt of either resolves it.
- **Test** (`clashes.test.js`, new, about 30 s): the passive player loses no true card, and the police and Hunter
  cases above; the doubter of the curry step; the tie, and its resolution by a doubt. Every other clash test is
  unchanged and passes.
- **An expectation that changed:** `remoteProblem.test.js` drove a Medium game to ¶60 and crossed out "the other
  lads" for who led the horse out. That cross-out rested on the police's "Simpson took the horse", which ¶46 now
  sets aside (the hope of early exercise stays). At ¶60 nothing a passive player trusts rules anyone out for that
  question. The test is about the worker round-trip, so it now crosses out Holmes as the one who added the opium.
- **`docs/format-0.3.md`:** rule strength is authored as the rule's general reliability (a heuristic now gives way
  in a clash).
- **Moved:** nothing in the reveal and foreshadow logs, the case report, the thoughts report or the gates.

## Round 110 (2026-10-17): clashes, step 2 — Easy says what the game set aside, and why

- **UI** (`ui/app.js`, Easy's Clashes list): in each clash the member the game set aside is marked "set aside"
  (with "doubt it"), and every other member offers "doubt this instead". A line under the chain gives the reason,
  by the class of what weighed least: someone else's reasoning goes first; a rule of thumb before what the story
  tells; someone's word before reasoning (a witness's word first, a confession last); your own reasoning, and
  Holmes's, last. A tie says the game cannot choose between the members marked. The list's heading now says the
  game sets aside "what weighs least in each clash". Clashes met while checking an answer are shown as before.
- **Checked in headless Chrome** (Easy, saves made in node):
  - at ¶104, five clashes, each marked as the engine sets them aside, with its reason;
  - a "doubt this instead" on Holmes's dish step resolves the four clashes it is in;
  - at ¶41, the tie (the police's "Simpson drugged him", built by the player, against the dish step): both marked,
    with the tie line.
- **Moved:** nothing in the logs, reports or gates (the UI only).

## Round 111 (2026-10-17): clashes, step 3 — one culprit (Q6); the clash work done

- **Robert** (at build time): one culprit is an inference the reader builds, not only a rule the player applies,
  so that `t4.2` names it as every DEFAULT thought does. The thoughts checker wants each deduction to name an
  inference or give a reason for none.
- **Data:**
  - `r.one_culprit`, a `heuristic`: "Two crimes of one night, close together, are commonly taken to be the work of
    one hand". Its formula says the two events have the same agent. It has two named exceptions: "one of them led
    to the other" (no formula) and "two hands acted apart" (the agents differ). Dealt at ¶4 ("the tragic murder of
    its trainer"); its text shows under Holmes's methods from ¶12.
  - `k.one_culprit` (editorial, false, verified): "One hand did both: whoever took the horse out struck the blow that
    killed the trainer". It is built from the taking, the blow and the rule. Its application is `defeated_by`
    `two_hands`, which holds in the answer key, so the case's reading never uses it.
  - `t4.2` names it, with a `date_note`: the murder at ¶4 has no agent slot, so the inference is about the blow,
    told at ¶35. `bk.one_culprit` maps the rule. `t68.3` is `no_inference: workstream-6`, a new value: the break
    is by strain at ¶68, not by a clash.
- **Played** (`clashes.test.js`): a passive player who builds it at ¶35 loses it at ¶202, as a heuristic, to Holmes's
  "the horse kicked him". No clue is lost; the stall, the door and the shattered head stay. Under Round 108's
  trial of the old rule, the same card cost the stall and the door at ¶102.
- **Leak check:** the rule text under `--background` (ok); `--exceptions` 82/82 ok, the two new ones included
  ($0.15).
- **Found while building** (the suite's validation test): a thought that names an inference becomes a route step,
  and the case's reading cannot prove a false conclusion ("route t4.2: premises do not yield its conclusion"). No
  thought had named a false inference before. `stepsFromThoughts` now leaves a false inference off the route: it is
  verified as its reasoner's reasoning, not as a step of the case's.
- **An expectation that changed:** `defeasibility.test.js` lists the defeated applications; `k.one_culprit#rule1`
  (two hands) joins the police's four.
- **Moved:**
  - **Reveal log:** three lines at ¶12 under Holmes's methods (the rule and its two exceptions).
  - **Foreshadow log:** the rule at ¶4, and the three lines at ¶12.
  - **Report:** rules 118 → 119, constraints 470 → 471, quotes 1062 → 1063, verified 80 → 81, forced slots
    455 → 456. New rows: the verified inference, its two exceptions ("two hands" established in the answer key,
    defeating the application) and its truth slot (false, unique).
  - **Thoughts report:**
    - with an inference 52 → 53;
    - explained date misses 5 → 6 (`t4.2`, dealt ¶35);
    - premise disagreements 2 → 3: `t4.2`'s inference rests on the blow, where `t4.1` maps the death;
    - `bk.one_culprit` is no longer listed as mapping nothing;
    - `workstream-3` → `workstream-6` for `t68.3`.
  - **Gates:** nothing.
- **The clash work is done** as agreed (Round 108). `docs/clashes.md` is marked built, with a "Left open" section:
  the authored inference, the tie, reservations, `t68.3`. Q6 of `docs/defeasibility.md` is closed with a pointer.
  `CLAUDE.md` points at the paper as built, and at workstream 6 next.

## Round 112 (2026-10-17): hand-off — workstream 6 (hypotheses, scenarios, residue)

- **Robert:** before the next session, make the clash replay a standing log and write the kickoff.
- **`scripts/clash-log.js`** (`npm run clash-log` → `.cache/clash-log.txt`, about a minute): every clash met through
  the story, and what it sets aside and why, for three kinds of player (passive; doubting Holmes's curry step;
  building one culprit). `--build` adds one who builds everything (about 5 minutes). Cards are marked ✓/✗ by the
  answer key, which the engine never reads. Today it reports no true card set aside for any of them. The kickoff
  makes it one of the logs diffed at each step.
- **Tidy-up:** `workstream-3` is retired as a `no_inference` value; no thought uses it since Round 111. The thoughts
  report's legend now names `workstream-6` in its place.
- **`docs/kickoff-workstream-6.md`** hands the workstream over:
  - the question (rival stories weighed, not refuted);
  - what to read;
  - what the earlier work leaves it (the thoughts' authored relations, the strains and drops deferred by name,
    `t68.3`, the clash paper's two open questions, the clash log);
  - the questions its paper must answer;
  - the traps of Rounds 60–111, with this session's added.

  It supersedes `docs/kickoff-clashes.md`. `CLAUDE.md` points at it and lists the clash log.
- **Moved:** the thoughts report's legend line only; nothing in the logs, the case report or the gates.

## Round 113 (2026-10-17): workstream 6 — hypotheses, scenarios and residue, agreed (docs/hypotheses.md)

- **Measured first:** a replay of the whole story (Easy, background when relevant) for four players (passive; doubting
  Holmes's curry step; building one culprit; building everything), following twelve hypotheses: the story's theories,
  the annotation's thought-only scenarios as provisional assignments, four candidates, and one culprit.
  - **Fit is the wrong instrument:** every rival story reads "broken" almost at once, by a trusted statement. The true
    inside story is broken from ¶84 by Straker's false honest record, until ¶225 or never.
  - **A scenario's cost** (the clash weighing with its answers held fast) falls for the true story (passive: 9 at ¶92,
    0 at ¶231, every item false) and grows for the false ones (the gypsies 9, and 13 for a builder). From ¶104 the
    police's cost includes the player's own reasoning.
  - **The authored relations are mostly unplayable:** 10 of 18 strains, and two of the four drops, come from thoughts
    with no card. The case has no explains or causal data.
  - **The Theories panel's "agrees with"** counts implications whose condition is unmet (a bug).
  - **One culprit** costs nothing at ¶68 for any player: `t68.3` is a stance, not a computable loss.
- **Agreed (Robert): every recommendation.** Where one proves hard to build, fall back to a simpler alternative.
  - **Q1:** two sizes, candidate sets on slots and scenarios as theories. The annotation's three scenarios stay the
    player's to make (test fixtures, not story theories; C13 answered no). The player sets the stance, the game
    shows the standing, nothing is ever called confirmed.
  - **Q2:** a scenario's check is its cost, by class, in place of fit.
  - **Q3:** residue from authored puzzles (oddities with explanations as formulas), met by noticing on Medium and
    Hard.
  - **Q4:** strain shown, scores nothing, gates nothing; the clash tuple unchanged.
  - **Q5:** drop with a reason the game checks where it can (out-explained, more hands, cost, a card), never refused;
    `t68.3` a "two stories" doubt of `k.one_culprit`.
  - **Q6:** readings by layer through the meaning slots.
  - **Q7:** drops score before the story makes them untenable.
  - **Q8:** Easy names, Medium counts, Hard on request.
- **Order of work:**
  1. the cost, with the panel fix;
  2. puzzles and residue;
  3. drop with a reason;
  4. readings by layer;
  5. presets;
  6. the second review.

## Round 114 (2026-10-17): workstream 6, step 1 — a scenario's cost

- **`Game.scenarioCost(theory, {extra})`** (`docs/hypotheses.md`, Q2): the theory's answers held fast, the clashes
  they make with the working set broken as `clashes()` breaks them (lightest class first, one member, ties all), until
  what is left fits. It returns each item set aside, with its class and, for a clue, how it was told (testimony,
  report, admission, seen). `atOdds` means it gives up the player's or Holmes's own reasoning, or something seen;
  `refuted` means the answers cannot hold at all. It is cached while the working set stands, and reset with the
  clash cache.
- **The clash weighing is shared:** `#weigher()` (order, weight, break one) is used by `clashes()` and the cost alike.
  Clash outcomes are unchanged.
- **`Game.theorySupport(theory)`:** the held inferences a theory's answers agree with (one alone entails an answer)
  and go against (one contradicts them), read off the solver and cached per pair. This fixes the Theories panel's
  vacuous "agrees with": the police theory no longer agrees with the steps the inside story rests on.
- **`checkLayer`** also returns a theory layer's `cost`.
- **UI (Easy):**
  - the Theories panel weighs each theory: "It needs these to be wrong: … (someone's word)", "It goes against your
    own reasoning (or Holmes's): …", "… what was seen, found or written: …". A theory is marked broken only when it
    is at odds;
  - "Check this night" on a theory's layer says the same;
  - Medium and Hard are unchanged until step 5.

  Checked in headless Chrome at ¶104 (the police: Simpson's word, and Holmes's dish step).
- **`engine/hypotheses.test.js`:**
  - the inside story (the annotation's `t92.6` as a fixture) costs only false cards, fewer from ¶92 to ¶104, and
    nothing at ¶231;
  - the police cost statements to ¶92 and are at odds from ¶104 (Holmes's dish step);
  - the layer's check gives the same cost;
  - weighing changes no clash;
  - no vacuous agreement;
  - a player who builds `k.gypsies_did_not_take_him` at ¶62 holds the gypsies at odds.
- **Moved:** nothing. The reveal, foreshadow and clash logs, the case report, the thoughts report and the gate listing are unchanged (the clash weighing's refactor keeps every outcome).

## Round 115 (2026-10-17): workstream 6, step 2 — puzzles and residue

- **Puzzles** (`knowledge.json`, `docs/hypotheses.md` Q3): ten oddities, each a list of the cards that show it, the
  thought that reads it, and its explanations as formulas over slots, or an inference's formula. They carry no text.
  - the curry (the drugger knew the menu, or was of the household);
  - the dog (the visitor, or the one who led the horse out, was of the stable);
  - no alarm, and the locked door (the entrant had a key, or Straker led the horse out);
  - the coat (taken off to work);
  - one blow (not the stick);
  - the knife (for an operation);
  - the bill (Straker's own; Derbyshire is Straker; or a friend's);
  - the horse not found (disguised);
  - why the horse was led out (to steal him, or to harm him away from the stable).
- **`Game.metPuzzles()`:** on Easy, once a puzzle's cards are held and its thought's paragraph is read; off Easy, once
  the player notices one of its cards (an absence: once filed).
- **`Game.residue(theory)`:** a puzzle is explained when the theory's answers, with the facts left once its cost is
  paid, entail an explanation.
  - **A fallback taken:** against facts (trusted clues and world ties), not inferences. Read against everything
    trusted, the police theory "explained" the curry, the dog and the key by ¶231, borrowing Holmes's explanations
    (Simpson might have known the menu).
  - `checkLayer` returns it for a theory's layer.
- **UI (Easy):** each theory says "It leaves N of M odd things unexplained: …" (by their cards), or that it explains
  every odd thing met. "Check this night" says the same. Checked in headless Chrome at ¶92: the police and the gypsies
  leave 7 of 8; the honest trainer 8 of 8.
- **Validator:** puzzles' references and slots resolve, and an explanation holds in the answer key. The report gains a
  "Puzzles" table.
- **Thoughts:** `t46.3` (RESIDUE) maps to the eight puzzles of its list; puzzle ids are valid `maps` targets.
- **Tests** (`engine/hypotheses.test.js`, the passive reading now files absences as Easy offers them):
  - at ¶46 the police leave the curry, the dog, the key, no alarm, the coat, one blow and the horse not found;
  - the inside story (the fixture now also names the steel shoe and the disguise) leaves nothing, at ¶46, ¶92, ¶104
    and ¶231;
  - the gypsies leave the curry and the dog (`t62.4`);
  - Brown as organiser leaves strictly more than the inside story (`t68.2`);
  - the police with a duplicate key explain the locked door (a patch, `t58.4`);
  - on Medium the curry is met only once noticed.
- **Listed, not chased** (`docs/hypotheses.md`): theft explains why the horse was taken out (`t46.3`'s item 4 is not
  reproduced); partial theories show long trays; the candle has no puzzle.
- **Moved:**
  - **Case report:** a new "Puzzles" section, ten rows. The answer key bears out at least one explanation of each
    puzzle. The friend's theory explains the bill by its answers alone; the police's and the gypsies' explain why the
    horse was led out.
  - **Thoughts report:** RESIDUE mapped 0 → 1 (`t46.3`). Premise disagreements 3 → 4: `t62.4` cites `t46.3`, now
    held, which `k.gypsies_did_not_take_him` does not rest on. Its "explains nothing about the curry or the dog" is a
    residue reason, for step 3's drop.
  - **Unchanged:** the reveal, foreshadow and clash logs, and the gates.

## Round 116 (2026-10-17): workstream 6, step 3 — drop with a reason

- **`Game.drop(target, reason, {rival, cites})`** (`docs/hypotheses.md`, Q5): a story or player theory, or a candidate
  (slot = value), dropped for one of `DROP_REASONS`:
  - out-explained (a rival theory);
  - more hands (a rival);
  - cost;
  - a card (cites held cards).

  It is a stance: never refused, taken back with `undrop`, and saved.
- **`Game.dropCheck(target)`:**
  - out-explained: the rival's residue is a strict part of the dropped one's;
  - more hands: more people among its agents (`Game.hands`) than the rival's;
  - cost: something it needs wrong;
  - a card: the cited card is in its cost, or contradicts its answers outright.

  A candidate weighed against a rival is the rival's story with the candidate in its place.
- **Scoring:** `dropScores` / `dropScore`, in the shape of the raise and notice scores. A thought with `dropped` scores
  when its target is dropped before its deadline: Holmes's paragraph, or `dropped.deadline` where he never makes it.
  - `t58.3`: the paper, by the ten-pound note; deadline ¶104.
  - `t62.4`: the gypsies, by the player's step; Holmes ¶114.
  - `t92.7`: the maid, more hands; deadline ¶104.
  - `t68.3` is the "two stories" doubt of `k.one_culprit`, a new doubt reason. Its `no_inference` is `doubt`, and it
    is unscored.
  - `t68.2` names no game target (Brown's story is the player's).
- **Validation** (`engine/thoughts.js`): a drop's target, reason, citations and deadline resolve.
- **UI:**
  - "drop it…" on each theory, and "Drop it…" in each candidate's menu: a reason, a rival theory, and for a card the
    one open in the Card tab;
  - a dropped theory is dimmed and a dropped candidate struck with dots, with "take it back";
  - on Easy, the game's check of the reason in a line ("The other leaves 2 odd things unexplained; this one 9, those
    among them.").

  Checked in headless Chrome at ¶92 with three drops.
- **A bug fixed:** `addTheory` gave two theories made in the same millisecond one id.
- **Tests** (`engine/hypotheses.test.js`):
  - the paper, the gypsies, the maid (2 hands to 1) and Brown (out-explained) dropped with checks that hold;
  - a reason that does not hold is recorded and checked false;
  - the scores, 3 of 3;
  - save and load;
  - the passive player's cost dates the maid's and the paper's deadline at ¶104;
  - one culprit doubted for "two stories".
- **Tidy-up:** `workstream-6` is retired as a `no_inference` value, as `workstream-3` was in Round 112. The thoughts
  report's legend names `doubt` in its place.
- **Moved:** the thoughts report only: `t68.3`'s reason `workstream-6` → `doubt`, and the legend. Unchanged: the
  reveal, foreshadow and clash logs, the case report and the gates.

## Round 117 (2026-10-17): workstream 6, step 4 — readings by layer

- **Readings** (`knowledge.json`, `docs/hypotheses.md` Q6): seven slots that carry what old cards mean, each with the
  cards it re-reads:
  - why the knife was taken (the knife cards, "poor weapon");
  - why the coat came off (the coat on the bush, laid across);
  - who struck the blow ("assailants", "defended himself", the shattered head);
  - with what (the head, Simpson's stick);
  - what cut the thigh;
  - who picked up the cravat;
  - who Derbyshire is (the bill, "a friend", the letters).

  They carry no text. The schema and the validator check them.
- **`Game.readingsOf(card)`** gives, per reading whose question is visible, the player's settled answer and each met
  theory's. **`Game.revisedBy(slot)`** gives the held cards an answer re-reads.
- **UI:** a card shows "How it reads under each story", for example "Straker's head is shattered by a savage blow:
  Who did it? The police theory: Fitzroy Simpson · your “Inside story”: Silver Blaze". Proving an answer, or adding
  it to a theory, adds "It changes how you read: …". Checked in headless Chrome at ¶104.
- **Thoughts:** `t226.2` maps also to the five readings it names, and `t212.3` to the blow's two.
- **Test:** the shattered head reads Simpson and the stick under the police, the horse and the shoe under the
  player's inside story; settling who struck re-reads the head and "defended himself".
- **Moved:** the thoughts report, REVISE mapped 3 → 4. Unchanged: the reveal, foreshadow and clash logs, the case
  report and the gates.

## Round 118 (2026-10-17): workstream 6, step 5 — what each preset shows

- **A new option, `weigh`** (`docs/hypotheses.md` Q8), in `PLAYER_OPTIONS` and each preset:
  - **names** (Trivial, Easy): as built in steps 1–3, with each drop's check in a line;
  - **counts** (Medium): "Weighed: it needs 2 things you trust to be wrong, leaves 2 of 2 odd things unexplained",
    and a drop's check as "The game finds it so" or "does not";
  - **asked** (Hard): nothing until the player clicks "Weigh it" on a theory, then the counts; no drop check.

  "Check this night" on a theory's layer follows the same option. The settings panel offers it ("Weighing
  theories").
- **Off Easy, the Theories panel no longer says whether a theory "fits".** The fit was the misleading signal (the
  measurement of Round 113); the weighing replaces it at every level. `checkTheory` stays in the engine (tests).
- **Checked in headless Chrome:**
  - Medium at ¶92: counts, with only the two filed absences met, since the player had noticed nothing;
  - Hard: "Weigh it", then the counts.
- **Test:** the presets' `weigh` values, and `presetOf` still recognises each preset.
- **Moved:** nothing (UI and options only). The logs, both reports and the gates are unchanged.

## Round 119 (2026-10-17): the second review — what workstreams 3 and 6 make modelable

- **`docs/review-ws3-ws6.md`:** a verdict for each of the 85 thoughts in scope:
  - every HYPOTHESIS, TEST, DROP, REVISE and RESIDUE thought;
  - the first review's "ws 3" and "ws 6" rows.

  Read from a dump of each thought's maps, drops and relations, with deal paragraphs.
- **Verdicts:** 53 accurate, 23 partial, 1 wrong, 2 missing now, 6 missing later.
  - **wrong:** `t35.9` maps the coat's agent where its set is the purpose;
  - **missing now:** `t58.4` (patches: Q3's "rests on nothing held" was not built) and `t102.3` (no slot for what the
    light was for);
  - most partials are TESTs and HYPOTHESES that map nothing where a card, puzzle or reading now holds them.
- **Not given a mechanism by workstream 6:** strains by improbability (`t24.4`, `t37.11`, `t64.2`, `t120.2`).
  Recommended: leave them authored.
- **Fixes proposed, for Robert, in batches:**
  1. A1–A16, maps only;
  2. B1 with C2: the police's duplicate key as an answer, and a theory's assumed answers marked;
  3. C1: the light's purpose, a candle puzzle and a reading;
  4. C3: `r.guilty_denial`, C11 of the first review.

## Round 120 (2026-10-17): the second review's batch 1 — maps (A1–A16)

- **Robert:** build all four batches, if possible (B1 as (a), with C2).
- **Built:** sixteen `maps` changes in `thoughts.json`, as listed in `docs/review-ws3-ws6.md`.
  - `t35.9` now maps the coat's purpose and reading instead of its agent (the one wrong verdict).
  - The others map the card, puzzle or reading that now holds them.

  Ids and tags are unchanged, so `reading-annotated.md` is too.
- **Moved:**
  - **Thoughts report:** HYPOTHESIS mapped 21 → 24, TEST 17 → 26. Premise disagreements 4 → 5: `t40.4` cites
    `t40.3` (Mapleton's motive, now held by `c.mapleton_interest`), which `k.horse_at_mapleton_by_reach` does not rest
    on. This is the first review's point on `t40.4`: the inference is reach only, the thought motive and reach.
    Listed, not changed.
  - **Unchanged:** the reveal, foreshadow and clash logs, the case report and the gates.

## Round 121 (2026-10-17): the second review's batch 2 — the duplicate key, and assumed answers (B1, C2)

- **B1:** `t.police` gains `e.stable_entered.instrument` = `duplicate_key`; its label already said it. It becomes
  visible at ¶46 as before (`e.stable_entered` is dealt at ¶33).
- **C2, `Game.assumedAnswers(theory)`:** the answers the working set leaves open, neither entailed nor contradicted.
  A trusted statement gives its own truth, so "Straker's 'anxious' is true" is not assumed while it is trusted.
  - Easy: "It rests on nothing you hold for: The stable door is opened: With what? → A duplicate key".
  - Medium and Hard: counted with the cost.
  - `checkLayer` returns them.
  - Questions in the panel now name their event (`slotQuestion`), as the readings do.
- **This is Q3's promise, unbuilt until now:** a patch takes a puzzle out of the tray and shows that it rests on
  nothing held (`t58.4`).
- **Tests that changed:**
  - the police's residue at ¶46 no longer holds the locked door (their key explains it);
  - the patch test now checks the key both ways (without it, the door is left over), that it is assumed, and that
    the opium answer, which the police's own trusted step gives, is not.
- **Moved:** the case report's Puzzles table (`pz.key` is now explained by `t.police` by its answers alone). Unchanged:
  the reveal, foreshadow and clash logs, the thoughts report and the gates.

## Round 122 (2026-10-17): the second review's batch 3 — the light's purpose (C1)

- **New slot** `e.light_struck.purpose` {pipe, work}, answer work. Its prompt does not name who struck the light,
  since that is told only at ¶224: "Why was a light struck in the hollow?" ("To light a pipe", "To see to some close
  work").
- **New rule** `r.candle_for_work` (default; "commonly taken to …"; exception "he struck the match only for his
  pipe"). It is shown from ¶78, where the pocket inventory names the candle; the reader's `t78.3` has the same thought
  there.
- **New inference** `k.light_to_work` (verified): the candle, with Holmes's `k.vesta_from_strakers_box`, gives the
  purpose. The Colonel states it at ¶224 ("Of course that was why he needed the candle, and struck the match"). It is
  named by `t224.1`, which now cites `t78.1` and `t102.2`, and so becomes a route step at ¶224.
- **Puzzle** `pz.candle` (the pocket inventory, `t78.3`) and **reading** `rd.light` (the inventory, the vesta in the
  mud). The inside-story fixture names the purpose. The police leave the candle over.
- **Thoughts:** `t102.3` maps the slot and the reading; `t78.3` the puzzle; `t224.1` the inference and the reading.
- **Leak checker** (haiku, two runs, cached): the rule (`--background`) and its exception (`--exceptions`, 83 of 83)
  both pass.
- **Test:** the candle met by ¶92 and left over by the police, not by the inside story. At ¶224 the Colonel's step is
  held as stated and leaves only "work" open, and settling it re-reads the inventory.
- **Moved:**
  - **Reveal and foreshadow logs:** the rule and its exception at ¶78; the inference, the slot and its two options
    where they are dealt.
  - **Case report:** rules 119 → 120, constraints 471 → 473, quotes 1063 → 1065, verified 81 → 82, forced slots
    456 → 457. New rows for the puzzle, the inference, the route step `t224.1` and the slot (unique).
  - **Thoughts report:** NOTICE mapped 3 → 4; deductions 55 → 56, with an inference 53 → 54; premise
    disagreements unchanged at 5.
  - **Unchanged:** the clash log and the gates.

## Round 123 (2026-10-17): the second review's batch 4 — a guilty denial (C3, the first review's C11)

- **New claim** `c.brown_invites` (¶135, observed by Watson): "Asked whether to argue it out in public or in his
  parlour, Brown lets Holmes in: 'Oh, come in if you wish to.'" Plain description, with no "gives way".
- **New rule** `r.guilty_denial`, a **heuristic**: "A man who flares up to deny a charge and then at once agrees to
  talk it over in private is commonly taken to have been touched by the truth of it." Its exception is "he wants a
  false charge settled quietly". It is shown from ¶133, the denial.
- **New inference** `k.denial_struck_home` (verified): from the denial, the invitation and the rule, the denial is
  false (its truth slot). It gives nothing away on its own. Trusting the denial, who hid the horse stays open;
  doubting it, the falsehood names Brown, five paragraphs before he gives in.
  - As a heuristic step it weighs class 1 in a clash.
  - It is named by `t135.1`, which reads ¶135's line. `t135.1`'s date note is gone, since its step is now dealt on
    its own paragraph.
  - `k.brown_lied` (¶140, the belief) becomes implicit, as C11 proposed. `bk.guilty_denial` maps the rule.
- **Leak checker** (haiku, two runs): the rule (`--background`), its exception (`--exceptions`) and the claim
  (`--all`) all pass. The full `--all` pass came almost wholly from the cache ($0.09); its 20 flags are on unchanged
  pieces.
- **Test:** the step is not buildable before ¶135. Built at ¶135, it leaves the hider open while the denial is
  trusted, and names Brown once it is doubted.
- **Moved:**
  - **Reveal and foreshadow logs:** the rule and its exception at ¶133, the claim at ¶135.
  - **Case report:** cards 687 → 690, claims 156 → 157, rules 120 → 121, constraints 473 → 475, quotes 1063 → 1067,
    verified 82 → 83. `t135.1`'s route row now concludes the denial's falsehood at ¶135.
  - **Thoughts report:** premise disagreements 5 → 4 (`t135.1`'s, from the first review, is resolved); explained
    date misses 6 → 5; `k.brown_lied` is listed among the implicit inferences.
  - **Unchanged:** the clash log and the gates.
- **An expectation that changed:** `belief.test.js` built `k.brown_lied` by hand. Now implicit, it follows by itself
  once `k.brown_broke` is held, and the test checks that instead. (The first suite run caught it; nothing was
  committed until it passed.)
- **The second review's four batches are all built.**

## Round 124 (2026-10-18): hand-off — workstream 7 (predictions and test plans)

Robert asked for workstream 7 in a new session. `docs/kickoff-workstream-7.md` hands it over:
- the question: sealed predictions, the player's checks, scoring against the story, and withheld results;
- the reading list: the PREDICT and TEST PLAN thoughts, the audit's beat-Holmes windows and fair-play gaps, the ws 7
  rows of both reviews, `actions.json`, and the score family;
- the mission: measure first, write `docs/predictions.md` and agree it with Robert, build in steps, then a short
  review;
- the traps of Rounds 60–123.

The kickoff also records that Round 120's documentation follow-up was committed without the suite and without the
trailer. The next session is told to gate documentation-only commits too.

## Round 125 (2026-10-18): workstream 7 — measured, and the paper agreed

- **Measured** (a scratch replay, passive and builder players on Easy): for each PREDICT and TEST PLAN thought, when
  its premises are held, where Holmes performs the check, and when the result is shown. The windows run from 0
  (`t116.3`, `t163.3`) to 151 paragraphs (`t29.4`). Findings:
  - most predictions are finds about events the player has not met (the match's `e.light_struck` is first mentioned
    at ¶226), so a prediction cannot be a sealed answer over slots; the three that can are already deductions;
  - Holmes's actions cannot be offered as a menu: the list names the sheep, the milliner and the race ahead of time;
  - `a.dress_trick` is anchored at ¶225 (the explanation), not ¶89, and `a.search_mud` at ¶104, not ¶102;
  - filed absences are recorded but never scored, the dog (`t34.2`) among them;
  - the kickoff's "17" thoughts are 13 in the data, plus the four watch-holmes GENRE thoughts.
- **`docs/predictions.md` written and agreed** (Robert): a sealed check composed from four templates over held
  things, matched quietly against authored checks (`ck.*`), with an optional expected result; settled at the check's
  own paragraph; `result: shown / late / never`; `checkScores` (a plan scores when Holmes performs it, whatever the
  story shows) and `absenceScores`; a sealed check may cite a theory; the same action on every preset but Trivial.
- **Corrected in discussion:** the draft assumed the read-on button names Holmes's next action. Robert pointed out it
  has said "Next paragraph" since Round 10. The deadline is the check's paragraph.
- **The maid's question** (`t163.3`): recorded and matched, never scored (Robert: the simpler option).
- **Next:** step 1, the anchors.


## Round 126 (2026-10-18): workstream 7 step 1 — the anchors, and the earliest gate

- **Anchors** (`docs/predictions.md` Q3):
  - `a.search_mud` is anchored at ¶102 ("he made a careful study of the trampled mud"), where Holmes searches and
    finds the vesta, not ¶104;
  - `a.dress_trick` at ¶89 ("Surely I met you in Plymouth…"), not ¶225 (the explanation), and without
    `requires.thoughts` (option (b)): at ¶89 the story does not show Holmes acting on the identity.

  The old quotes stay as second sources.
- **The earliest gate (Robert: option A).** A Holmes step's inferences reach a free-pace player at the gate where the
  story waits for them. The code took the first gate *registered* (actions before route steps), not the earliest.
  `a.dress_trick`'s gate at ¶225 had been holding "Derbyshire is Straker" back to ¶225 by accident. `Game` now
  takes the earliest gate:
  - `t84.6` at ¶161 (the photograph request, where 'wait' already waits);
  - `t114.2` at ¶116;
  - `t141.1` at ¶148, both Holmes's own paragraphs.

  The alternatives were to keep the dress trick at ¶225 (B), or to hand steps out only at Holmes's paragraph (C, a
  large ripple).
- **Moved:**
  - **Gates:** `t81.5` ¶104 → ¶102.
  - **Reveal log:** the dish, horse-taking and knife inferences ¶104 → ¶102; `k.horse_goes_home` ¶117 → ¶116;
    `k.disguised_to_survive_search` ¶202 → ¶148; `k.derbyshire_is_straker` and `k.straker_lied_about_derbyshire`
    ¶225 → ¶161.
  - **Clash log:** the ¶104 clashes now at ¶102; Mrs. Straker's "a friend" is set aside at ¶161 against
    `k.derbyshire_is_straker`, not at ¶225 against the bill steps.
  - **Case report:** quotes 1067 → 1069.
  - **Unchanged:** the foreshadow log, the thoughts report.
- **Expectations that changed:** the passive player's cost for the maid and the paper first reaches their own
  reasoning at ¶102, not ¶104, so `t92.7`'s and `t58.3`'s `dropped.deadline` are 102 and `hypotheses.test.js` says
  so (two tests).

## Round 127 (2026-10-18): workstream 7 step 2 — checks as data

- **`checks`** in `knowledge.json` (`ck.*`, one per line; `docs/predictions.md` Q2–Q4), eight of them: the mud, the
  dress, the coat, the boots, the wet hollow's tracks, the photograph, the maid and the race. Each has:
  - its action;
  - its plans: a template verb (`look`, `ask`, `show`, `compare`; `CHECK_TEMPLATES` in `engine/game.js`) with the
    ids each field accepts. A field left out accepts anything (the maid: "ask Edith Baxter", about anything);
  - `at`: the paragraph where Holmes makes it, which is also the deadline;
  - `result`: `{shown}`, `{late}` (the photograph: asked for at ¶161, the milliner's word at ¶229) or `{never}`
    (the boots, the maid);
  - the outcome, and for the photograph the answer its result asserts (Derbyshire is Straker).

  No text of its own: a plan is shown in names the player already holds, so there is nothing new for the leak
  checker.
- **`yields.unknown`** goes from `a.compare_boots` and `a.question_maid` (and from the schema): the checks' `never`
  replaces it.
- **Thoughts** name their checks (`checks: [{check, expect?, answer?}]`): `t78.5`, `t92.9`, `t85.3`, `t92.5`,
  `t92.10`, `t92.11`, `t92.12`, `t101.2`, `t116.3`, `t141.2` and `t163.3`.
- **Validation:**
  - the case validator checks the action, the fields against the template, the paragraphs, outcome against result,
    and that the answer holds in the answer key. It also checks that some plan can be made before Holmes's
    paragraph (every field has an accepted id already mentioned). The report gains a **Checks** table with the
    paragraph each becomes plannable;
  - the thoughts validator checks each thought's links. The thoughts report gains **Checks planned**: nine can
    score; `t116.3` (window 0) and `t163.3` (no Holmes date) cannot.
- **Plannable from:** the mud ¶78, the dress ¶84, the photograph ¶84, the race ¶18 (the Wessex Cup cards; the
  racecourse is first named at ¶183). Two open early because the accepted words are broad, and are left so
  (Robert's standard for conveniences):
  - **the coat:** ¶32 (ask Gregory about the overcoat);
  - **the boots:** ¶35 (compare Simpson with the hollow), which is the point of `t101.2`.

## Round 128 (2026-10-18): workstream 7 step 3 — sealing and scoring

- **`Game.seal(verb, fields, {expect, answer, theory})`** (`docs/predictions.md` Q1–Q3):
  - every field of the template must be filled with a card the player holds;
  - `expect` is one of the template's outcomes;
  - `answer` goes with `expect`, over a question the player holds.

  It is recorded with the paragraph (`seals`, saved; save version 8). **`unseal(id)`** keeps the record and stops it
  scoring (not `withdraw`, which withdraws a raised exception: the first suite run caught the clash).
- **`sealStatus(id)`** tells nothing until Holmes's paragraph has been read, not even whether he will make the
  check. Then it gives where he made it, the result where the story tells it (borne out or not, for an
  expectation), and at the end of the story "never told" (the boots, the maid) or, for a check he never made,
  `made: false`.
- **`checkScores()` / `checkScore()`**, in the family's shape. One row per thought's check: the deadline (the check's
  paragraph), the earliest unwithdrawn matching seal that expects what the thought expects, `borne`, and `scores`
  (sealed before the deadline and not contradicted; a thought with no Holmes paragraph never scores). Of 11 rows, 9
  can score.
- **`absenceScores()` / `absenceScore()`:** ABSENCE thoughts with a Holmes paragraph and a fileable clue (today only
  `t34.2`, the dog: filed at ¶34, against ¶180). This is how `t29.4` is sealed, and `t182.2` settles it.
- **Nothing counts in Trivial.** Wrong expectations cost nothing.
- **Tests:** `engine/predictions.test.js` (11) from the paper's cases: the match early and too late; not borne out;
  withdrawn; the dress and the coat; the tracks early and the wet hollow at ¶116 (no window, though the earlier
  Mapleton plan counts for `t116.3` too, being the same check); the photograph (plan at ¶161, answer at ¶229); the
  boots (scored, never told); the maid (matched, unscored); the race; a check Holmes never makes; the dog; Trivial;
  save and load.
- **Not yet:** the theory test (step 4) and any UI (step 5). `theory` is recorded and checks nothing.

## Round 129 (2026-10-18): workstream 7 step 4 — the theory test

- **`Game.sealTheoryTest(id)`** (`docs/predictions.md` Q6): a sealed check with an expected answer and a cited
  theory is tested as residue is (Round 115). The theory's answers are held fast with the facts left once its cost
  is paid (trusted clues and the world's ties, not inferences). Possible results: `says-so`, `says-otherwise`,
  `says-nothing`, or `refuted`. It is cached with the cost and never refuses. `seal` now refuses a theory the
  player cannot see.
- **Found when testing:** the paper expected the police to say nothing of "Derbyshire is Straker". They say
  otherwise: their story keeps Mrs. Straker's word that Derbyshire is a friend, which costs it nothing. Once the
  player doubts her, they say nothing. That is the method working: a story is read with the testimony it does not
  pay to reject. The test now checks both.
- **Test:** `predictions.test.js` gains the case (12 tests): the player's inside story says so; the police say
  otherwise, then nothing once her word is doubted; her own belief says otherwise; a seal with no answer tests
  nothing.
- **Presets** (Q7) are the UI's: Easy names the result, Medium says yes or no, Hard on request (the `weigh` option).

## Round 130 (2026-10-18): workstream 7 step 5 — the Checks tab

- **A Checks tab** (`toolChecks` in `ui/app.js`, `docs/predictions.md` Q7). The form is "Look for / Ask / Show /
  Compare" {a card} "at / about / to / with" {a card}:
  - the dropdowns hold only cards the player has (people only for "ask" and "show … to");
  - "Expecting" offers the template's outcomes;
  - with an expectation, the player may name the answer it would give (a question on the table and a value), and
    the theory it comes from;
  - "Seal it" records the check. A clue is quoted in the sealed text.
- **The sealed list.** Each shows the paragraph it was sealed at and, once read, what the story showed: "Holmes does
  this (¶N)"; the result, "as you expected" or "not as you expected"; "The story does not say here what he found";
  at the end, "never says … It is left open", or "Holmes never did this". A seal can be withdrawn until Holmes acts.
- **The theory test by `weigh`:**
  - Easy names it ("says so / says otherwise / says nothing either way");
  - Medium says yes or no;
  - Hard has a "What does … say?" link.

  Trivial shows no form: the game works the case out.
- **Checked in headless Chrome** (saves made in node, loaded through `localStorage`):
  - Easy at ¶170: four seals; borne out, not borne out, a late result pending, the theory named;
  - Easy at the end: the boots "left open", the photograph's result at ¶229, "as you expected";
  - the counts and on-request branches;
  - sealing through the form itself.
- **Listed, not chased:**
  - a Medium game at ¶170 with background "when relevant" (the save's options) never left the Card tab within two
    minutes, the Theories tab included. The committed UI does the same, so it is not this step's. Its page shows no
    busy overlay and logs no error;
  - on Hard a player can seal only with cards they have collected, as everywhere on Hard;
  - entity names keep their capitals mid-sentence ("Look for A box of vestas at The hollow").
- **No engine or case change:** the logs, the reports and the gate listing cannot move. They were rerun before the
  commit and did not.

## Round 131 (2026-10-18): workstream 7's review

- **`docs/review-ws7.md`:** each PREDICT and TEST PLAN thought, the second review's three ws 7 rows and the four
  watch-holmes thoughts behind the kickoff's "17", against what Rounds 126–130 built.
  - **Held (12):** `t29.4`, `t78.5`, `t85.3`, `t92.5`, `t92.9`, `t92.10`, `t92.11`, `t92.12`, `t101.2`, `t141.2`
    and `t182.2`, plus `t116.3`, which has no window of its own and scores through `t92.11`'s earlier plan.
  - **Held, unscored:** `t163.3`.
  - **Not held, with reasons:**
    - `t92.13`: "the horse will run" is an answer, already scored as `t40.4`, and "keep him entered" is advice no
      template fits;
    - `t92.14`: the sheep have no name before Holmes asks about them;
    - `t161.2`: it settles `t92.13`.
  - **Unscored by rule (decision 2):** the four watch-holmes thoughts.
- **Left open:** an "advise" template; watch-holmes as a confirmation in the Checks tab (workstream 8); theories
  proposing their own predictions; the Medium page that stays busy (workstream 9).
- **`CLAUDE.md`'s reading list** now points at `docs/predictions.md` and this review. **Workstream 7 is done.**

## Round 132 (2026-10-18): hand-off — workstream 8 (the reader layer)

Robert asked for the next session. `docs/kickoff-workstream-8.md` hands over workstream 8 (`docs/gap-analysis.md`
§5 item 8):
- the four strands: background availability replacing Strict, disclosure typing on facts, profiles and hint tiers,
  and GENRE and SET ASIDE;
- the reading list;
- the mission: measure first, write `docs/reader-layer.md` and agree it with Robert, build in steps, then a short
  review;
- the traps of Rounds 60–131, with this session's added: check what the UI shows before reasoning from it; method
  names that shadow; anchors that move gates; the headless Chrome notes.

## Round 133 (2026-10-18): the reader layer, measured and agreed

- **Measured** (scratch replays, Easy, background when relevant; `docs/reader-layer.md` "Measured"):
  - a **modern** reader without the background cards they lack (opium's taste, the kick, the blaze, laying, the
    milliner's prices, the faker, the tendon) cannot reach the curry before ¶218, nor the kick or the disguise at
    all; by the challenge six case questions go open. An **1892** reader loses only the motive; an 1892 racing
    reader nothing that matters. Today every player is the last.
  - **Strict** also drops the 81 common-sense rules the story never states, hence its "45 left".
  - every fair-play gap already has a policy (supplied, inferred, withheld, marked on checks); facts and rules
    carry no mark.
  - **profiles cannot time hints:** 38 of the 47 scored deduction rows are careful, and a hint at the next scene
    after the earliest date lands before Holmes in 34 of them (median 132 ¶). Three expert, high-hindsight thoughts
    gate 'wait' (`t46.4`, `t37.13`, `t102.4`).
  - the **story's own signals** (watch-holmes, re-read) are the honest hint layer; a Checks-tab mark at ¶109 would
    confirm `ck.tracks` before Holmes performs it, against `docs/predictions.md` Q1.
  - **SET ASIDE** is the reader's choice without the key (Bayard is used); `irrelevant` is the key's.
- **Agreed (Robert):** every recommendation and the order of work: a `reader` option marking supplied rules (and
  `supplied: withheld` for purists), 1892 and modern columns replacing Strict; `Game.disclosure` over rules, facts
  and checks with a "held back" list at the end; expert steps stop gating 'wait'; `hints: story` on Easy (the
  Holmes's interest log, re-read prompts); a re-read action; per-card set aside; no Checks-tab mark before Holmes acts.

## Round 134 (2026-10-18): ws 8 step 1 — readers in the report

- **`engine/readers.js`:** the reader rule (`READERS`: modern, 1892, racing; "partial" lacking for the modern
  reader) and `lackingRules`; `READER_MARKS` moved here from `engine/thoughts.js`. A test in `thoughts.test.js`.
- **The report:** Strict replaced by **1892 reader** and **Modern reader** columns, and a **Background by reader**
  section (eight cards some reader lacks; each rule's offered and told paragraph). The columns are the measurement's
  §3: the 1892 reader loses only the motive; the modern reader the drugger (20 left), the place (48), the taker (20),
  the purpose (3), the killer (43) and the motive. Derbyshire, the coat, the knife and the cut, which Strict left
  open only because their common sense is never stated, are settled for both.
- **Diffs:** `report.md` only in the Questions table and the new section; reveal, foreshadow and clash logs,
  `thoughts-report.md` and the gate listing unchanged.

## Round 135 (2026-10-18): ws 8 step 2 — disclosure as data

- **Data:** `disclosure` on `c.square_toes` (`{late: 119, policy: withhold}`) and `k.dove_silk_on_the_bill`
  (`{never: true, policy: inferred}`); `$defs/disclosure` in the schema; the validator refuses a `late` not before the
  card's first mention.
- **Engine:** `Game.disclosure(id)` returns `{at, told, supplied}` for a rule, `{at, result}` for a check, `{at,
  ...disclosure}` for a fact (it returned a bare paragraph; its one UI caller reads `.at`). `Game.heldBack()` lists
  what the story held back as far as it has been read, the never-told only at the end. Tests in the new
  `engine/reader.test.js`.
- **The report:** a "Held back by the story" section: the two facts, `ck.boots`, `ck.photograph`, `ck.maid`, and 36
  rules the game offers before the story states them (opium's taste ¶37 → ¶218, the dog ¶29 → ¶219, …).

## Round 136 (2026-10-18): ws 8 step 3 — the reader setting

- **Options:** `reader` (modern, 1892, racing; default modern; not part of the difficulty, kept across a change of
  it) and `supplied` (offered in every preset; `withheld` for purists).
- **Engine:** `Game.lacking` from `lackingRules`, set on every reset; with `withheld`, a lacking rule's `ruleAt` is
  where the story states it (or never), and the game computes its own gates (`Story.gatesFor`, factored out of
  `#gates`): `t102.4`, `t37.13` and `t148.2` stop gating for a modern purist, since a premise is never told. The
  loader carries the background cards (`data.background`).
- **A refinement of Q2, found in the tests:** "supplied" means *this reader lacks it*. A rule offered before the
  story states it is `early`; for an 1892 reader opium's taste is early but their own, so it is not listed as held
  back (the paper's case "Opium's taste held"). `heldBack()` lists supplied rules; the report keeps the 36 early ones.
- **UI:** "· Supplied: a reader of 1892 would know this" (a racing man, a specialist) on supplied facts, with the
  paragraph where the story says so once read past it; checked in headless Chrome on an Easy save at ¶120 (the
  loose horse "the story says so at paragraph 114"; the kick and the faker supplied).
- **Tests:** three more in `engine/reader.test.js` (the readers, the reader outside the difficulty, withheld).
- **Diffs:** none: the reveal, foreshadow and clash logs, both reports and the gate listing are unchanged (the default
  reader is offered everything, as before).

## Round 137 (2026-10-18): ws 8 step 4 — expert steps stop gating

- **`Story.gatesFor`** skips expert thoughts (Q3, part 1). Gates gone: `t46.4` at ¶111 and ¶220, `t37.13` at ¶202
  and ¶226, `t102.4` at ¶226. The 'wait' pace now reads ¶202 waiting only for the bay (`t198.2`).
- **Moved, as expected:** `k.horse_kicked` reaches a free-pace player at ¶226 (Holmes's explanation of the kick)
  instead of ¶202, so the reveal log moves its line, and the clash log's three clashes it wins
  (`k.police_stick_killed` twice, `k.one_culprit` once) from ¶202 to ¶226. `t46.4`'s needs still arrive at ¶102
  with `t81.5`. Unchanged: the foreshadow log, both reports.
- **Tests:** `reader.test.js` (an expert step is a bonus; the withheld case now pins `t148.2`, which still gates the
  story at ¶204).

## Round 138 (2026-10-18): ws 8 step 5 — set aside and re-read

- **Engine:** `setAside`, `putBack`, `isSetAside`, `setAsideCards` (Q5: held, silent, saved) and `reread(from, to,
  question)` (Q4: recorded, saved); none reaches a score function (a test sets aside every clue and entity at ¶40 and
  compares all six score families and `buildable()`).
- **UI:** a card's "Set aside" / "Put back"; the hand filter `inHand` (not left out, not set aside) in the lists and
  dropdowns that offer held cards; a folded "Set aside (N)" list on the Cards tab; "Re-read…" on the reading bar.
  Checked in headless Chrome on an Easy save at ¶70: two cards set aside (the list shows "Set aside (2)", the tab's
  tally drops by two); re-reading ¶8–¶46 with "Who drugged Ned Hunter's supper?" outlines 39 paragraphs and saves
  `{from: 8, to: 46, question: q.who_drugged, para: 70}`.
- **Diffs:** none: the reveal, foreshadow and clash logs, both reports and the gate listing are unchanged.

## Round 139 (2026-10-18): ws 8 step 6 — hints from the story

- **Option:** `hints` gains `story` (Trivial and Easy). **Data:** `passage` on `t70.2` (¶8–¶46) and `t182.3`
  (¶29–¶34), checked. **Engine:** `storySignals()`, the twelve watch-holmes and re-read thoughts as clauses and the
  held cards they mention (¶109: "put this horseshoe into my pocket", the horseshoe and the moor), never
  interpreted; `showsSignals()`. A test: signals only up to the paragraph read, cards only held ones, no score moves.
- **UI:** the Questions tab's **Holmes's interest** and **What the story held back**; the reading bar's "The story
  points back: re-read paragraphs 8–46" at ¶70 (and ¶29–¶34 at ¶182), which opens the re-read form. Checked in
  headless Chrome on Easy saves at ¶70, ¶110 and the end (the end's list: eleven supplied facts, the square toes
  "due at paragraph 119; … only at paragraph 146", the boots and the maid never, the photograph's result at ¶229,
  the bill's items never, inferred). A long save needs about 90 s before the tab responds (the busy page of Round 130).
- **Leak check:** no card text changed; the new text is fixed templates around card names and story quotes shown at
  their own paragraph, so the LLM checker (which reads card text) was not run.
- **Diffs:** none in the logs, the reports or the gate listing.

## Round 140 (2026-10-18): workstream 8's review

- **`docs/review-ws8.md`:** the 20 GENRE thoughts, the 7 SET ASIDE thoughts and the 25 background cards' marks,
  against what Rounds 134–139 built.
  - **GENRE:** the 10 watch-holmes and 2 re-read thoughts held, unscored (Holmes's interest, the two passages);
    `t12.2`, `t14.4`, `t38.1` held by existing moves (the doubt reasons, the one-culprit heuristic); 5 plain ones not
    held, as agreed (no mechanic for the narrator's contract).
  - **SET ASIDE:** 5 held (the field-glass, the telegraph posts, the new dress, the half-crown, Bayard); the two
    passages (`t118.1`, `t152.1`) have no card.
  - **Background cards:** 24 held; `bk.gypsies`'s "presented, not endorsed" is not shown (the `period` flag is never
    read by the UI).
- **Left open:** the period mark; the purist still hears Holmes at the story's gates; a re-read's question is
  recorded, unused; profiles and confidence drive nothing beyond the expert gates; the busy page on long saves
  (workstream 9). A correction to Round 139: the end-of-story list showed twelve supplied facts, not eleven.
- **`CLAUDE.md`'s reading list** now points at `docs/reader-layer.md` and this review. **Workstream 8 is done.**

## Round 141 (2026-10-18): the period mark

- **Robert asked for it** after the review. The review had read `period: true` (1890s knowledge, eight rules) as the
  period-belief flag. The gypsies' two rules carry `flags: ["stereotype"]` and open "(A prejudice of the period.)",
  so the card head already showed "stereotype". Now a `stereotype` rule also reads "· A belief of the period:
  presented, not endorsed." on its card and in the Background tab (`suppliedNote`). `docs/review-ws8.md` corrected:
  25 background cards held.
- **Diffs:** UI only; the logs, the reports and the gate listing are untouched (no engine or data change).

## Round 142 (2026-10-18): hand-off — workstream 9 (the UI)

Robert asked for the next session. `docs/kickoff-workstream-9.md` hands over workstream 9 (`docs/gap-analysis.md`
§5 item 9):
- what has no UI: the whole score family, `applyRule` and `conclude`; the busy page (Rounds 130, 139); the reviews'
  left-open items;
- the reading list;
- the mission: an inventory per tag and a profile of the busy page, then `docs/ui.md` agreed with Robert, steps,
  and a closing review tag by tag;
- the traps of Rounds 60–141, with this session's added: profiles that could not time hints; a flag's meaning
  checked before a gap is claimed; the 'wait'-pace test loop; the save waits in headless Chrome; the shell `&`.

## Round 143 (2026-10-18): workstream 9 measured; docs/ui.md agreed

- **Measured** (scratch scripts in the session's scratchpad; headless Chrome over the DevTools protocol):
  - **The inventory:** every tag's move, its engine method and where the UI offers it. Missing: QUESTION (the
    player's own questions; no workstream took it), the UI of `applyRule`, `conclude`, `retract` and all twelve score
    functions. A defect: the UI's doubt reasons lack "two stories" (`t68.3`). Filing an absence is offered only on the
    board.
  - **The busy page:** Rounds 130 and 139 do not reproduce at HEAD with their own saves. The waits are real but shown:
    an Easy reload at the end 36–41 s (the twelve clashes searched for again: 21 worker requests, 31 s), Theories 15–27 s
    late in the story (every theory weighed before any is shown), reading on 0.36 s with spikes of 7–20 s where a
    clash arrives, the first 5 s blank (the model built on the main thread).
  - **Scores replayed:** an ideal player beats Holmes on 41 of 47 deductions (median lead 124 ¶). `noticeScore` and
    `checkScore` can report more scored than possible (8 of 6, 10 of 9). A row shown before its deadline confirms a
    deduction.
  - **`conclude`:** alone it reaches 3 of 54 route inferences, 43 with their rules applied first; `applyRule` binds up
    to five variables over 13–88 cards; one call ran past 20 s.
- **Agreed (Robert):** every recommendation of `docs/ui.md`: scores shown as the story reaches each deadline (a note
  at Holmes's paragraph, "Ahead of Holmes", the record, the end's totals), `possible` as rows with a deadline;
  `applyRule` out of the UI plan, a small "State it yourself" over `conclude`; the busy page's three fixes and a
  loading line; the re-read question, "two stories" and absence from a card built, the rest listed; the options
  grouped; the board left as it is; the player's own questions kept for a later workstream.

## Round 144 (2026-10-18): ws 9 step 1 — the busy page

- **Engine:** `Game.load` seeds the clash cache from the saved `clashLog`, so a reload checks the clashes it met instead
  of searching for them again; `RemoteProblem.fetch` shares a request already in flight (the first Chrome check found
  the deferred count and the Questions tab making the same search twice).
- **UI:** `piece` / `fillPieces`: the Questions tab's clash count and each theory's weighing are drawn after the page,
  one at a time, without the busy veil; Theories shows each theory at once with "Weighing…". "Loading the case…" while
  the case loads.
- **Checked in headless Chrome,** HEAD (a worktree served on port 8322) against this step, alternating, on an Easy save
  at the end with a played game's clash log. The machine was shared (load average 5–16 from other jobs; it may have
  slowed Round 143's measurements too, and perhaps Rounds 130 and 139's):
  - ready after a reload: HEAD 97 s and 43 s; now 12.5 s and 11.2 s, nearly all of it the case loading; the Questions
    tab then opens in under 1 s, its count arriving after;
  - Theories: HEAD 56 s and 29 s before anything shows; now the first theory at 6 s, all six at about 31 s, the panel
    usable throughout;
  - reading on with Theories open: 0.8 s a paragraph, the weighing finishing behind.

  The paper's targets (10 s, 3 s) were for an idle machine; under this load they are missed by the case's own loading
  time (11 s here, 5 s idle).
- **Test:** `clashes.test.js`: a game reloaded at ¶110 has the same clashes in the same order, setting aside the same
  cards, with no clash searched for again, and the same working set.
- **Moved:** nothing. The reveal, foreshadow and clash logs, both reports and the gate listing are unchanged (none
  of them reloads a save).

## Round 145 (2026-10-18): ws 9 step 2 — the record against Holmes, in the engine

- **`possible` made consistent** (`docs/ui.md` Q1): every row with a deadline. `noticeScore().possible` 6 → 8 and
  `checkScore().possible` 9 → 10, so the ideal player's "8 of 6" and "10 of 9" (Round 143) cannot happen. Two tests'
  expectations change with it (`absence.test.js`, `predictions.test.js`); `docs/review-ws7.md`'s count annotated.
- **`Game.record()`:** the six families' rows whose deadline has been read, with the player's paragraph, the lead and
  the held cards that tell each; per family scored and passed, and possible only at the end. A builder replay to the
  end: deductions 41 of 47, the first rows `t29.3` (¶36, made ¶29, lead 7) and `t31.3` (¶57, lead 26).
- **Tests:** `engine/record.test.js`: at ¶40 nothing whose deadline is ahead (not the curry), only held cards named;
  at ¶219 the curry with its lead; at the end every family within its possible; Trivial scores nothing.
- **Moved:** nothing in the logs, the reports or the gate listing.

## Round 146 (2026-10-18): ws 9 step 3 — the record in the UI

- **UI** (`docs/ui.md` Q1): "Ahead of Holmes: N" in the header, opening **Your record against Holmes**; a note on the
  reading bar for each scored row whose deadline the read just passed; at the end the totals per family, the five
  longest leads and what the story held back; Trivial's one line. Fixed templates around held cards (quoted when a
  card is a sentence), paragraph numbers and a sealed check's own words; the annotation's text is never shown.
- **Checked in headless Chrome** on Easy builder saves (everything buildable built, the curry noticed at ¶20, the
  vesta box sealed at ¶80):
  - ¶217: "Ahead of Holmes: 20"; reading to ¶219, the bar: "paragraph 218 · Holmes reasons: “The others ate the same
    dish unharmed, …” You had it at paragraph 37: 181 paragraphs before him"; the record: "Deductions: 24 of the 26
    steps Holmes has made so far";
  - ¶102: "Holmes does this: Look for A box of vestas at The hollow. You planned it at paragraph 80: 22 paragraphs
    before him";
  - the end: deductions 41 of 47, odd details 1 of 8, checks 2 of 10; the curry noticed 196 paragraphs before Holmes
    first among the longest leads; Trivial: "nothing is scored".
- **Leak check:** no card text changed; the new text is fixed templates around held card names, quotes of held cards
  and paragraph numbers, shown only once the story has read each deadline, so the LLM checker (which reads card text)
  was not run.
- **Listed, not chased:** a check's text keeps entity capitals mid-sentence ("Look for A box of vestas"), as Round 130
  listed; a step resting on several inferences is quoted in full, which can make a long line.
- **Moved:** nothing in the logs, the reports or the gate listing (UI only).

## Round 147 (2026-10-18): ws 9 step 4 — state it yourself

- **Engine:** `Game.concludeFrom` (`docs/ui.md` Q2): the player's own conclusion from the connected cards, the
  background they call on applied as the case's inferences apply it, so there is no binding form. A time budget
  (20 s a call) crosses to the worker (`RemoteProblem.withBudget`, the worker's `OVER` answer); past it, "too hard to
  check here". `applyRule` keeps no UI.
- **Measured** (the route's 54 inferences, each at the paragraph its premises are held, citing only what "Infer from
  this" would connect, background implicit): 41 follow, 2 run past the budget, 11 do not (they need more than the
  cards cite: world ties, or an earlier step of the player's). Calls take 50–500 ms in node.
- **UI:** "Or state it yourself" on the building bar: a question, "is" / "is not", an answer, "Does it follow?". A lone
  card that completes nothing stays connected ("connect another, or state a conclusion yourself"). Checked in headless
  Chrome at ¶38: the curry clue alone, "who drugged the supper is not Fitzroy Simpson": "It does not follow from these
  cards". The positive case is the test's (a clue that completes an inference alone is built by "Infer from this").
- **Test:** `reasoning.test.js`: from the tap clue alone, plain `conclude` refuses and `concludeFrom` makes the card,
  with the rule as a premise and no unheld inference; a false conclusion refused; a 1 ms budget too hard, nothing made;
  Trivial refused.
- **A slip in Round 146, mended before pushing:** its gate had committed `ui/app.js` with this step's form, written
  while that suite ran, calling a method that did not yet exist. The commit was amended to step 3 alone and re-gated
  (135 pass) before it was pushed. Files a running gate will commit are now left alone until it finishes.
- **Leak check:** no card text; the form offers only questions on held cards and answers on offer.
- **Moved:** nothing in the logs, the reports or the gate listing.

## Round 148 (2026-10-18): ws 9 step 5 — the small items

- **UI only** (`docs/ui.md` Q4, Q5): the doubt's reasons taken from the engine, so "two stories" (`t68.3`) is offered;
  the re-read's question on the reading bar and a "Your re-reads" list on the Questions tab; the absence form on a
  clue's own card, the clue as the witness; the 14 options under four headings.
- **Checked in headless Chrome:**
  - ¶101 (a builder's save): `k.one_culprit` doubted, its Why list ends "the night is several stories, not one", and it
    is kept; re-reading ¶20–¶30 with "Who drugged Ned Hunter's supper?", the bar names the question and the Questions
    tab lists the re-read (saved);
  - ¶38: on the lads' clue, the folded form files the dog's absence (`r.dog_barks_at_strangers`, Tuesday at the stable):
    "Filed. A new clue: The two lads in the loft heard nothing …", listed under Odd things;
  - the settings panel: You, The cards, Your reasoning, What the game shows, every option there.
- **Leak check:** no card text; the new labels are fixed words.
- **Moved:** nothing in the logs, the reports or the gate listing.
