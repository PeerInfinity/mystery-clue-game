# Redesign discussion (2026-10-14)

Status: DISCUSSION. The user is not satisfied with the first draft and wants, before any change is proposed,
a description of the real process a reader uses to solve the mystery, what the representation of the story's
logic is missing, and what the gameplay is missing, each with a from-scratch design and as many alternatives
as possible. The inference system is the part to improve most. Decision so far: implement as many of these
ideas as are technically possible, starting with the infrastructure they need (see "Where to start" at the end).

## 1. How a reader actually solves Silver Blaze ahead of Holmes

The reader's work falls into stages that are not the same kind of thinking, and the current game models only
one of them well.

**Building the scenario with its gaps.** On the train, Holmes recites the facts. The reader turns them into a
story of Monday night with blanks: supper at nine, the stranger, the drugging at some point, Straker leaving at
one, six silent hours, the open stable at seven, the body in the hollow. The unknowns are the blanks in that
narrative, not a list of independent questions. "Who drugged the lad" and "who took the horse" are the same
blank to a reader until something separates them.

**Noticing what does not fit.** This is the stage that beats Holmes or fails to. The reader flags details that a
normal version of this story would not contain. A trainer carries a surgeon's knife. A bill in his pocket is
made out to another man. The narrator bothers to say the supper was curry. The coat lies on a bush on a night
with no wind. Nobody heard the dog. Each flag is an observation that violates an expectation, and the
expectation comes from background knowledge. The dog is the hardest case because it is an absence: nothing in
the text says "the dog did not bark". The reader must notice that a stable with a dog had a visitor and that no
one mentions the dog.

**Asking "what would produce this?" for each flag.** For the knife: a weapon, or an instrument for something
delicate. For the curry: coincidence, or someone who knew the menu. For the bill: carried for a friend, or his
own under another name. For the dog: it was asleep, or drugged, or the visitor was someone it knew. This is
abduction. The reader generates a small set of explanations and holds them open.

**Testing the standing theory for residue.** The police theory explains the drugging, the missing horse and
the death. The reader asks what it leaves unexplained: the curry coincidence, the dog, the knife, the placed
coat, why Straker went out at one in the rain. A theory with much residue is suspect before it is contradicted.
Holmes says exactly this: "the first consideration is to get rid of the hypothesis that the horse was stolen".

**Building the rival scenario by chaining.** The dog says someone known. The curry says someone of the house.
Straker left at one. So Straker took the horse. Then why. The knife is for an operation, so to injure it. Why
injure your own horse: period knowledge says trainers lay against their own horses. Why would he need money:
the bill, the second household. Each conclusion becomes the premise of the next question. The chain is short
steps of two or three premises each, never one step with twenty premises.

**Reinterpreting old evidence under the new scenario.** The cravat stops being the murderer's and becomes
something Straker picked up. The knife stops being a weapon. The coat was removed for work, not torn off in a
struggle. The cut on the thigh becomes self-inflicted. The same cards change meaning. This is the moment the
solution clicks.

**Predicting and checking.** A good scenario makes predictions. If Straker meant to nick a tendon he would
have practised; on what; the sheep. If the horse bolted it went to a stable, so look for tracks on the wet
ground towards Mapleton. If Brown found it, he was first up. If the bill is Straker's, the milliner will
recognise his photograph. Anticipating what Holmes will check is the most satisfying way to beat him.

**Weighing testimony as speech, not as fact.** Hunter's "he drugged my supper at the window" is Hunter's
inference, not his observation. Mrs. Straker's "Derbyshire was a friend" is honest and wrong. Simpson's "I lost
the cravat" is unverifiable and turns out true. The reader separates what a witness saw from what they
concluded, and asks whether they are lying, mistaken, or repeating someone else's lie.

**Knowing the genre's contract.** The reader trusts that details the narrator dwells on will matter, and that
Holmes's facts are true even when his theory is unstated. That is why the pocket inventory gets read twice.

Two things stand out against the engine. First, most of Holmes's steps are not deductions. "Too monstrous a
coincidence", "men do not carry other people's bills", "a dog barks at strangers" are defaults, each with
obvious exceptions; the reader accepts them as the best explanation, not as entailments. Second, the reader's
unit of thought is a scenario, a joint story of the night. Per-slot elimination is a tool used inside that, not
the activity itself.

## 2. What the representation is missing, and a from-scratch design

**What it does well and should keep.** Atomic claims with provenance and a truth slot. Disclosure dated by
quotes, with the validator and the LLM checker guarding against leaks. The finite-domain solver with minimal
conflict sets, so that any sufficient set of reasons is accepted for an elimination. Three time axes kept
apart. Doubt that withdraws givens and lapses proofs. The fair-play frontier tooling.

**The central gap: inferences are locks, not reasoning.** An inference in `constraints.json` is a hand-picked
premise set and a hand-written conclusion formula. The engine never checks that the premises support the
conclusion. It cannot, because background facts carry no formula and the logical content of the step lives
only in the label. So the elimination layer is MetaMath-style, but the inference layer is a key that fits one
lock. "Every valid route accepted" is true of crossing out and false of building. A player who reasons "the
wife could have chosen the curry, but she saw him leave and stayed in bed, so it was him" is understood only
if an author wrote exactly that premise set.

**No intermediate propositions in practice.** "The drugger knew the menu", "the drugger was of the household",
"the drugger was master or mistress" are three conclusions collapsed into one or two formulas. Because
intermediate conclusions are not cited as premises, route steps carry their whole ancestry: several steps in
`route.json` list twenty-one premises. An inference card can technically be a premise of another, but the
data never does it.

**No defeasibility.** Every constraint is hard. The model cannot say that the dog argument is strong but not
certain, or that the police theory is consistent but strained. Doubt applies to claims and inferences but not
to the rules themselves, which is where the real weak points are. "Perhaps the dog was drugged too" has no move.

**Anomalies are not objects.** The reader's process is driven by things that need explaining. The data has
preset questions on preset slots. There is no node for "the cataract knife needs an explanation" with its
candidate explanations attached. Purpose is a slot with three enumerated values, and the step from knife to
"injure" is a cross-out.

**Explanation and cause are not modelled.** Events have facets and time ordering but no causal links: the
drugging enables the taking, the match startles the horse, the kick kills and fells him, the fall and the knife
cut the thigh. Without "because" the engine cannot compute what a scenario explains, so theories can only be
"fits" or "broken". The police theory's real defect, that it explains nothing about the curry, the dog, the
knife or the coat, is invisible.

**Opportunity, knowledge and acquaintance are smuggled in.** "Only the household knew the menu" is about who
knew what. "The dog knew the visitor" is acquaintance. "Mrs. Straker was home all night" is whereabouts. All
three are encoded as the agent belonging to an enumerated set, written by hand as editorial constraints. A
whereabouts table, a knows relation and an acquainted relation would let the engine derive these sets and
give the player alibi reasoning, the most naturally sudoku-like part of a detective story.

**Rules are a curated set, so the curation is a hint.** The report's strict column shows the case is unsolvable
until the end if background arrives only when the story states it. Making it available earlier is load-bearing,
and the thirty filler facts patch over the fact that the relevant rules were chosen by someone who knew the
answer. Background should be a large neutral library the player searches, not a hand dealt to them.

**Smaller gaps.** The closed world: "an unknown accomplice" is never a candidate. Witness error and witness lie
are not distinguished, though their consequences differ. Claims are of uneven grain. Durations and distances
are absent, though the reader uses them.

### From scratch: six layers

1. **A world model** of entities, events with role slots, states over time including whereabouts and
   knowledge, and causal links between events. Hidden events exist as nodes with unknown participants.
2. **An evidence model** of observations, traces, documents and speech acts. Each piece of evidence links to
   the fabula events that would produce it. Testimony is a speech act whose reliability has kinds: honest,
   mistaken, lying, hearsay.
3. **A knowledge library** of rule schemas with variables and a strength grade (hard, default, heuristic),
   each with its named defeaters. Period glosses stay separate as non-inferential.
4. **A proposition store** where every conclusion, intermediate or final, is a node that can be a premise. An
   inference is premises, a pattern and a conclusion. Patterns: deduction, elimination, best explanation among
   listed rivals, coincidence rejection, identification, prediction confirmed.
5. **Scenarios** as consistent partial world models with computed coverage: what each explains, leaves
   unexplained, contradicts, or needs as coincidence.
6. **A derivation engine** that instantiates rule schemas against known facts, so that what follows is computed
   rather than authored. Holmes's authored inferences become test cases for the engine and hints for the
   player, not the mechanism.

Trade-off: authoring cost, and the risk of over-derivation (the Easy-mode-solves-itself finding of round 1).
Guard: the engine derives only what the player instantiates, never spontaneously, outside Trivial.

A middle path that keeps the current solver: boolean slots for intermediate propositions; inferences capped at
about three premises; typed relation slots for whereabouts, knowledge and acquaintance; rules tagged with a
strength and an "unless" list; explains-links from claims to events for coverage scoring.

## 3. What the gameplay is missing, and a from-scratch design

**What the player never does.** They never notice: cards are dealt, or clicked indiscriminately in Hard. They
never state a conclusion: building is matching a hidden recipe until the game says "onto something". They never
compare whole stories: theories exist but nothing in the loop needs them. They never propose an explanation
and ask what would follow. They never predict what Holmes will check. They doubt for free, with no reason
given. They never act. The only coupling between reasoning and story is the Wait gate.

### Alternatives

**Noticing**
- Flag anything as odd. Feedback is delayed or aggregate ("you flagged six of the nine things Holmes used"),
  never which.
- Each object card shows the expectation from the library; the player marks where the story departs from it.
- An absence builder: pick a card and a time window and assert "this did not happen". The dog that did not
  bark becomes a move the player makes.
- Player-authored questions from templates over cards ("Why did [Straker] carry [the knife]?"); the game
  recognises templates that match an explanandum.

**Building inferences**
- Conclusion picker: cite premises, then choose a slot and a value or a set of values; the existing elimination
  checker accepts or refuses. Building becomes MetaMath-style, like crossing out already is.
- Rule instantiation: pick a rule card and fill its blanks with cards ("dogs bark at strangers": dog = the stable
  dog, night = Monday, visitor = the midnight visitor) to yield the constraint. Replaces recipe matching with a
  fill-in-the-blanks act; the generative option.
- Small steps that chain: intermediate conclusions become citable cards; the UI nudges decomposition when a
  connection has more than three cards.
- Pattern naming: the player says whether the step is elimination, best explanation, coincidence or
  identification.
- Rival explanations: for an anomaly, the player lists or picks explanations, each with consequences, and
  eliminates explanations rather than slot values.
- Socratic prompts instead of counts: when a connection is onto something, the game asks "what does this tell
  you about who chose the supper?"
- Freestyle formulas for power users, run but not compared.

**Scenario play**
- A scenario board: the night as a timeline with blanks for each hidden event. Filling it shows coverage:
  explained, unexplained, contradicted, coincidence required.
- Two boards side by side, the police's and yours, with a residue count.
- Theory-first mode: the game states the police theory; the player finds the first card that breaks it, then
  repairs it.
- Steelman each suspect: the best case for and against, scored by coverage.

**Prediction**
- At each gate, "what will Holmes look for?" with a choice among his possible actions; correct predictions score.
- "If your theory is right, what else must be true?" The player picks consequences; the story confirms or
  refutes them later.
- Light text-adventure: the player picks Holmes's next action among several. Only the order of disclosure
  branches, never the content.

**Evidence reliability**
- Doubt with a reason type: lying, mistaken, hearsay, incomplete. A lie suggests motive; a mistake does not.
- Split a testimony card into what the witness saw and what they concluded; only the former becomes a given.
- A trust dial per witness that shades all their claims.

**Pacing and feedback**
- Race Holmes: score each deduction made before the paragraph that tells it; a replay shows the fair-play
  frontier against the player's own.
- A notebook of free-text notes on cards, checked afterwards against Holmes (possibly by the model-based checker).
- Memory pressure as an option: cards fade unless noted.
- A hint ladder with cost: which cards, which question, which pattern, the conclusion.
- An in-game Watson: a conversational partner limited to the player's known set, to whom the player explains
  their reasoning and who runs it against the engine.

### From scratch: one core loop

Read a stretch. Flag what is odd. Turn a flag into a question. Propose explanations for it. For each
explanation, instantiate the rules it rests on and see what it requires. Eliminate explanations the evidence
refuses. Promote the survivor to a conclusion card. Place it on the scenario board and watch coverage change.
Predict what would confirm it, and read on to see. Commit before Holmes speaks.

The central object becomes the scenario board, a story of Monday night with blanks, rather than a list of
questions with candidate answers. Slots still exist underneath and crossing out remains a tool, but the player
is composing an account, not filling a grid. Inference construction becomes rule instantiation plus a chosen
conclusion, checked by the solver, which closes the gap between how eliminations are accepted and how
inferences are. The Wait gate stays, but prediction gives the player something to do at a gate.

## Where to start

Order of infrastructure, each step enabling the next:

1. **Checkable inferences.** A conclusion picker on top of the existing checker, and rules with formulas so
   that instantiation is possible.
2. **Intermediate propositions** as first-class, citable nodes; short-step chaining; route steps re-expressed
   as chains and verified by the engine rather than by hand-listed ancestry.
3. **Coverage and the scenario board**: explains-links from evidence to events, causal links between events,
   scenarios scored by what they explain.

Everything in the alternatives lists layers on without disturbing those three.

### Start over, or continue? (recommendation, 2026-10-14)

Continue, but treat it as a new case format (0.3) with a migration, and re-author the reasoning layer rather
than patch it.

- The reading layer is a sunk investment that is orthogonal to the inference problem and was expensive to get
  right: paragraph indexing and mentions, disclosure dating of every piece of card text, the reveal and
  foreshadow logs, the LLM leak checker, the validator, the fair-play test under every background setting,
  names and labels that change as the story goes. A rewrite would re-encounter every leak fixed in rounds 4
  to 9.
- The engine is modular enough to swap parts: the formula language (`engine/logic.js`) is about a hundred
  lines and can grow variables and schemas; the solver stays if relations are encoded as slots; the case model
  and game are where the inference semantics live and are the parts to replace.
- The data to re-author is the reasoning layer: `knowledge.json` (rules gain formulas, strength, defeaters),
  `constraints.json` (decomposed into short steps over a new propositions file), `route.json` (derived and
  checked, not hand-listed), theories (scenarios with coverage), plus new causal and explains links on events
  and claims. Entities, events, claims and mentions stay, with claims split where their grain is uneven.
- The tests are the safety net: the engine tests, the validator tests and the whole-story fair-play reading
  must keep passing through the migration, which a from-scratch rebuild would lose until late.
