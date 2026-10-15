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
