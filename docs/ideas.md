# Ideas, lessons and open problems

**Spoilers:** this document gives away the solution of "Silver Blaze".

The planning documents of the project (design papers, reviews, session handoffs and the round-by-round design log)
were retired once the game reached its present state. This page keeps what is still relevant from them: why the
game falls short of its aim, the directions that might still make it playable, the ideas never built, and the
known limitations. How the game works now is in `docs/technical.md` and `docs/case-format.md`; the git history
keeps the retired documents.

Thought ids (`t92.13`) are those of the annotated reading, `docs/reading-annotated.md`; rule and inference ids
(`r.…`, `k.…`) are the case's.

## 1. Where the experiment stands

The aim was to analyse the reasoning Holmes uses to solve the case and turn it into game mechanics, so that a
player could solve the case "like sudoku": rule out answers with reasons the game checks, and accept any
sufficient set of reasons, not only the detective's.

What works: the case is modelled completely (every slot the story settles has one value left with all the
evidence), nothing on a card runs ahead of the story, every one of the annotated reader's thoughts that the game
can hold can be made through the page, and a player can beat Holmes to 70 of the 72 scored rows on Hard.

What does not: the game hits the classic adventure-game problem. Knowing the solution is not enough; the player
must also guess how to express it in the game's moves, and so ends up trying combinations of cards until one is
accepted. The size of the game makes this worse. Multiple choice would remove the guessing, but would make the
game too easy. And the play is not like sudoku.

### The problem, measured

- **Building is recipe matching.** An inference counts only when it matches an authored one whose premises are all
  in hand ("Infer from this", then "Connect to this"). "Every valid route accepted" holds for crossing answers out,
  not for building: the player never states a conclusion, they look for the hidden recipe until the game accepts
  it. The first design review said so before the game was built; nothing since has changed it.
- **Common sense needs authored rules.** Every everyday step needs a rule card, and the library grew past 110
  rules, most of which the story never states.
- **The content is large.** 690 cards, 1,041 clickable spans in the text, 921 questions (39 about the case, 784
  about events, 98 about states), 58 inferences to build against 47 deductions to beat.
- **Many rows are open at once.** From ¶47 a median of 36 scorable rows (at most 45) are open together; a row's
  window from "everything it needs is in the story" to Holmes's paragraph has a median of 111 paragraphs, over 100
  for 34 rows. One deduction sits on a median of 6 moves (1–2 builds, 3–4 word clicks, 1 ask; the largest, 31).
- **A full game is long.** The careful annotated reader makes 396 moves (151 collects, 123 asks, 52 builds, …);
  the minimal playthrough to 70 makes 144 moves and 734 clicks in the page, of which the 37 builds alone take about
  300. Most of the careful reader's moves are not needed to score: 121 of their 123 asks are redundant on Hard.
- **The hints solve the game.** Pressing Hint to its last rung and Do it, and nothing else, reaches 70 on every
  difficulty (58 hints, 232 presses on Hard). Only the cooldown costs anything.
- **The scored moves are mostly confirmations.** Most of what scores is a step Holmes later states; 35 of the 70
  deadlines fall in his final explanation (¶215–231).

### Why it is not like sudoku

- The reader's unit of thought is a scenario (a story of the night with blanks), not a grid of slots. Elimination
  per slot is a tool used inside that, not the activity itself.
- Most of Holmes's steps are defaults (what usually happens), not deductions. The decisive work of a reader is
  noticing (including absences), weighing testimony as speech, and listing what a theory leaves unexplained. Plain
  inference steps are short and few. The slot-and-constraint design put the game's weight on the smallest part of
  the real reasoning. The project should have started from the annotated reading, not from the format.
- The grain is wrong for sudoku: the engine needs bookkeeping steps a reader makes without noticing, and making them
  moves is tedium (they became implicit inferences instead).
- The one naturally sudoku-like part of a detective story is whereabouts and alibis (who was where, who knew whom).
  It exists only as sparse state tracks in the engine, never as player-facing play.

### Tensions every design meets

- **Whatever the engine knows, a helper gives away.** With every rule card in hand from the start, Easy's
  auto-check greys out everyone but the culprit as soon as the papers are read; Trivial named the killer about 85
  paragraphs ahead of Holmes. A derivation engine that reasons by itself solves the case.
- **Menus leak.** A menu of Holmes's next actions would name the sheep, the milliner and the race ahead of time; a
  menu of answers names the candidates that matter; a question the game answers differently from others is a
  detector. The workaround (free composition from templates, matched quietly against authored targets) is exactly
  what produces the guess-the-phrasing problem.
- **Fewer cards is itself a hint.** The filler cards exist to hide which rules matter. Any cut must come from the
  player (setting a card aside), never from the answer key.
- **Fairness depends on the reader.** A modern reader lacks background an 1892 racing man has (the curry, the
  kick, the second household); without supplied cards the case cannot be beaten before Holmes, and three needed
  rules are never stated by the story at all.
- **Placement hints.** A fact placed beside the question it answers, or arriving late, stands out.
- **Fixes trade fairness for discoverability.** Dealing the dog's silence as a clue made it easy; leaving it to the
  player makes it arrive, unfiled, only at ¶181.

## 2. Directions that might make it playable

### The chosen direction: Watson fills in the world model (2026-11-04)

Set by the user after the questions-scoring discussion, which measured that the annotated reader's game reaches the
Hard maximum of 70 with none of the 14 case questions settled (no cross-out or proof on any of them): every point
came from builds, checks, leads, drops and the absence, never from elimination.

- **The player is Watson**, whose aim is to keep up with Holmes; the story is told from his side.
- **The world model is the game.** It holds each entity's state over time: location, motive, knowledge, beliefs,
  what it wears or carries, what it is doing, and more as needed. An event is a change of an attribute; the clock
  and calendar are state; a character's observation is an event. The timeline is a view of the world model (events
  in chronological order), and it includes what Watson is living through, filled in as the story goes on. The card's
  own focused timeline stays, and the controls go there. The timeline's UI is not designed yet.
- **Questions are uncertain entries** of the world model, each with possibilities that are eliminated as information
  arrives; every question is about something in the world model. Details the story gives directly are filled in
  automatically.
- **Provenance:** every fact carries its source chain: Watson saw it, a character said it, or a character said what
  another told them. Most facts before ¶47 reach Watson through Holmes's recital on the train, which relays the
  papers and the police, who relay the witnesses.
- **Two dates per fact:** when the story has given what is needed to infer it, and when it gives it away. Wanted
  later: the story does not go past a give-away the player has not filled in (it must not name the entry, and it
  needs a way through for a stuck player).
- **Reasons, in steps.** First version (c): eliminating a possibility is a pencil mark, with no reason checked (the
  answer key shows when the story gives the entry away). Later, (a) the player cites the cards that rule it out and
  the engine checks them (any valid set accepted, as checked cross-outs are now), and/or (b) small authored steps of
  one or two premises. Card-combining inferences, if kept, keep only those leading to world-model facts, split as
  small as possible.
- **Out for now:** scoring, difficulty levels, incremental mode and its Search tab, checks (wanted back later), and
  every mechanic not leading to world-model information: leads, theories, exceptions, hints, notes, the
  important/unimportant marks. Each may come back where it earns a place. The new model is to be built beside the
  old game, which stays playable until it can be replaced.
- **First step: a pilot.** Fill the world model for ¶1–46 (Watson's present in Baker Street and the train, and
  Holmes's recital of the night at King's Pyland) and look at its shape before going on; provenance, the two dates
  and the questions with their possibilities as passes over the same data.
- **Built (2026-11-04):** the pilot's shape was agreed on ¶1–46, then the passes were made (answers available
  only from where the story opens them, "something else" on every question, groups by membership, `lives_at`,
  provenance as accounts and tellings with its uncertainty as questions, the two dates), and the whole story was
  filled in: 674 facts, 55 time points, 31 questions (`cases/silver-blaze/world/`, `docs/case-format.md` "The
  world model as data"). Then the game's use of it was settled (below).
- **The timeline and trust (the user's rulings, 2026-11-04).** First the world model is shown as it is: an ordered
  list of events, the passage of time as events of its own (styled apart), no cell holding several events and no
  splitting of cells; the present-day section (the order Watson met each piece) stays, and each card shows its
  entity's own plain event list. Later views: a grid with times as rows and places as columns, with alternates whose
  columns are another detail (provenance, say); swimlanes and chips are advanced, for later. What Watson observes
  himself fills in by itself; every other fact comes through a provenance chain, and the player sets a trust level on
  each link (and on people, where that helps): four levels, *certain* (Watson's own, fixed), *trusted*, *uncertain*
  (where every other link starts) and *distrusted*. What is at or above the threshold (uncertain, to begin with) is
  on the timeline. Contradictions are found automatically, never written by hand; one is traced back through the
  chains of its facts, and the player picks the link to downgrade. A speech Watson hears is certain as an event;
  what it asserts goes through the speaker's link. Player inferences are left unmodelled for now. Later, unless
  easy: highlighting the links that would resolve a contradiction, and undo.
- **Built for it (2026-11-04), the data:** locations as place ids with `detail` and `neg`, and the places that move;
  what each claim asserts (`asserts`, `modal`); facts that are a speaker's content tied to the claim or the speaker
  (`claim`, `word`), out of Watson's own account (about 50 had been counted as his observations); `engine/world.js`
  with the provenance, the time order, the assertions and the contradiction finder; the validator requiring the true
  story to be consistent. What it shows: a reader trusting every source meets 41 contradictions, the first at ¶28,
  all between a question's picks, most at Holmes's explanation. In this case the relayed witness accounts are all
  true: what is false is four lies and some twenty beliefs and theories, so a contradiction sets a claimant's word or
  a theory against evidence, almost never two witnesses against each other; and with player inferences unmodelled,
  most come only when the story gives the answer away.
- **Built (2026-11-04), the first page:** Watson's timeline (`world.html`, beside the game and not linked from it):
  the story read to a paragraph; the world model as an ordered list of events under their time points (a time
  point's label only once the story has dated it, before that only its day and hour; the clock, calendar and weather
  styled as time events); a dot per event for its trust; a claim's assertions under it; an entity's own plain event
  list on clicking its name; a fact's quote and chains, with a trust select on each link and a cap per person; the
  threshold, and the facts below it shown faded on request; the contradictions among what is on the timeline, each
  side clickable to its chains. Distrusting the stranger's word to Edith clears the four contradictions of ¶46.
- **Built (2026-11-04), the contradiction report:** "trace" on a contradiction shows both sides, each with its
  quote, its trust and all its chains with their trust selects; the links and people whose distrust alone would take
  that side off the timeline are marked, and each shows how many events now on the timeline distrusting it would
  take off (at ¶58, the stranger's word to Edith 2, the police's report to the papers 151); a resolved contradiction
  says so. Every change of trust can be undone.
- **Built (2026-11-04), the grid, to try against the list:** the same events, one per row under their time points,
  each in a column: its place (a location's place; any other event, where its entity is at that time as far as the
  timeline knows; a vehicle whose own place is unknown, a column of its own), at a depth of region, area, place or in
  full (an outermost region holding one place, Devonshire, adds no level); or its source (who first had it, on its
  best chain). One event per row keeps the ruling that no cell holds two events, so the grid is sparse, mostly a
  diagonal walk across the columns. The user was unsure it would read more easily than the list; the list stays the
  main view, the grid an option.
- **The grid packed (the user's idea, 2026-11-04):** order is kept if each entry's first line is only lower than the
  first line of the entry before it, so an entry starts one line below the start of the previous one, or below the end
  of the entry above it in its own column, whichever is lower; entries in different columns sit side by side. A time
  point (and a time event) spans the grid and starts below everything before it.
- **The player's moves (the user's rulings, 2026-11-04), not yet built.** Settled by discussing three topics (marks
  on questions, entries added by hand, inferences) and working two examples on paper.
  - *Marks on questions.* Each possibility is uncertain (the default), circled or crossed out; several may be
    circled. A question with a place in time is shown there on the timeline, marked as a question, and all are in a
    Questions panel. A circled possibility is an entry on the timeline (several for one question if so circled); a
    crossed-out one is the player's denial of it. Both take part in contradictions as far as the data can recognise
    them (a crossed-out pick against a claim asserting it), except two circles of one question, which are an open
    choice and not reported. Their source is *Watson's hypothesis*. No hints beyond tracking contradictions.
  - *The stable door (¶20–33), worked on paper.* At ¶30 the story's Watson makes the move himself ("Did the
    stable-boy … leave the door unlocked behind him?"). It needs states with exclusive values (locked / shut / open),
    a **generic action table** (an action type's requirements and effects: unlocking needs that door's key and
    leaves it unlocked; going through needs it open), persistence and "a change needs an action". Run over the story:
    Hunter going out through a locked door carried a key (no line says so, and it makes him a real candidate for
    opening it); locked at night and open at seven means an opening between, by "?", needing a key: the question's
    entry, and Holmes's "where is the key?" (¶57) is that requirement unmet. Rulings: the action table is generic
    where possible, the case types only the actions that matter; **the engine itself runs persistence** (a state
    lasts until something specific changes it); events the story never tells (Hunter going back in, which would
    leave the door unlocked) are left out unless the player points them out. The player's "point out" moves, each
    checked by the generic rules: (a) two states of one thing differ, so an action of change took place between;
    (b) an action, so what it requires and what it effects.
  - *The stranger's intention (¶22–28), worked on paper.* An intention is a goal (a state in the world model's own
    shape: the tout wants a `knows`, Straker later a lame horse) and a plan (typed actions whose effects feed the
    next step's requirements), with "in order to" between goals. The plan's fit closes only if the paper makes Hunter
    willing: money or a message fit, a drug does not (the reader's "a poisoner would not ask a witness to pass the
    poison", reached without an authored rule). The police theory is Simpson's plan, and Holmes's objections at ¶57
    are its requirements nothing on the timeline meets; Straker's plan, with every requirement met, is most of
    Holmes's explanation. Moves: (c) "what is this for?" (an action as a step of an intention: the engine checks the
    fit) and (d) "what would this need?" (the requirements of a plan, the player's or a claim's, that nothing on the
    timeline meets), on request; this counts as tracking, like contradictions, not a hint. The goal and its motive
    as a move of their own: later, only if the logic needs it. Clashes that are only likely (the stranger "lost"
    while knowing the stable's night routine): wanted eventually, out of the first version if hard.
  - *Sources.* An entry the player adds and the engine verifies (moves a–d) has the source *Watson's reasoning*; its
    chains run through its premises, so it is as trusted as its weakest premise. Arbitrary entries added by hand
    (a form over entities, attributes, values and times) are undecided and not in the first version: it starts
    with direct implications the engine can verify.
  - *The gate.* Before the story gives away the answer to a question a reader could have reached earlier, the player
    must commit: exactly one possibility circled, any answer passing (a gate opening only on the right answer would
    be an oracle to guess against). At the give-away the answer key shows, with wrong circles and crossings marked.
    Latent questions are not gated. The pile-up (19 give-aways in ¶212–229, five at ¶226) is to be seen in play
    before it is designed around.
  - *Order of work:* questions and marks; typed states, the action table, persistence and moves (a)–(b), tried on
    the door; intentions and moves (c)–(d), tried on the stranger and the police theory; the gate. Later: likely
    clashes, named scenarios (sets of hypotheses switched on and off together), entries by hand.
- **Built (2026-11-04), questions and marks (step 1):** a Questions panel (the questions raised so far, in the order
  raised, each with its possibilities available so far as chips: click to circle, again to cross out, again to leave
  uncertain) and each question with a time in its entry shown at that time point on the timeline, marked "?", with
  what is crossed out beside it and each circle as an entry under it (the question's entry with the possibility
  filled in). A question's detail shows its marks, each on its own link from Watson's hypothesis with a trust select
  (starting uncertain) and a cap for Watson's hypothesis as a person. Marks take part in contradictions (a crossed-out
  possibility against every claim asserting it; a circle against a claim of another), two circles of one question
  excepted; a contradiction's side that is a mark leads to its question. Once the story gives the answer away, the
  answer shows with its quote and each mark is judged (right or wrong). Undo covers marks as well as trust. Questions
  whose entry has no time (who the man by the tracks is, the two Derbyshires, the bay, who drugged the supper, where
  the opium went in) are in the panel only. Seen in play: at ¶37 the panel already offers Silver Blaze as a candidate
  for the blow (an indirect possibility from the horse being in the hollow): the data's availability rulings now
  decide what the menu shows, and so what it hints. Ruled and built against it: only what someone in the story puts
  forward (`via: direct`) and "something else" are shown; a "More" button opens the rest: the reader's other ideas
  (`via: indirect`), and for a "who" question every person and animal met so far (animals included: the horse struck
  the blow), for a "where" question every place, alphabetically, an indirect possibility of that kind among them
  rather than on its own. A "why" question may get a bigger list later. Left: the places list holds every room
  and path met (long), and the reader's text ideas behind "More" still name the answer for some questions (the hoof).
- **Built (2026-11-04), typed states, the action table, persistence and moves (a)–(b) (step 2):** `engine/actions.js`
  and the detail of a typed state or action in `world.html`. Played on the door at ¶33: Hunter going out needs the
  door open (b), but it has been locked since nine, nothing changing it ("the timeline has it locked … and nothing
  changes it"); pointing out the change (a) gives "someone unlocking and opening the stable door" before he went out;
  his locking it (b) needs a key ("nothing on the timeline says so": no line says he carried one) and leaves it
  locked; locked then and open in the morning (a) gives a second unlocking and opening, recognised as the entry of
  "Who opened the stable door in the night?", whose need (b) is "someone has a key to the stable door": Holmes's
  "where is the key?" (¶57). None of it adds a contradiction, as the true story should not. Typed so far: the three
  door states and Hunter's two actions; the tin box is not.
- **Built (2026-11-04), places and who did it (step 2b, the user's choice: naming the agent is a hypothesis, not a
  list of candidates the engine allows, which would do the elimination and, with Hunter alone in the stable, give
  the answer):** a door's two sides (`joins`); being at the door is a need of every door action; going through puts
  the agent on the other side (Hunter going out: at King's Pyland). Who made a change the player pointed out is a
  question: the story's when the change is its entry (who opened the door in the night), otherwise the player's own
  ("Who was unlocking and opening the stable door?"), answered by circling anyone met so far; for each one circled,
  their needs and what the timeline says (Hunter, before he went out: in the stable, met; a key, nothing says so;
  Simpson and Straker at night: nothing says either). Straker's opening (¶220) is typed (unlocking and opening): the
  key is never mentioned, so his key stays unsaid too. Only the pairs the engine would accept are offered for (a).
- **Built (2026-11-04), intentions and moves (c)–(d) (step 3):** the action table extended by roles (give, ask,
  drug, strike, hide, lead_out); goals on the stranger's aims and on his wish that the boy has the paper; the
  paper's possible contents by kind; the police theory as Simpson's plan. Played at ¶46: the stranger's asking for
  the tip serves "get information to bet on", not "find the way"; his wish that the boy has the paper serves it only
  through the asking (which needs Hunter willing), and only "if the paper is money or a message": circling "a drug"
  takes the link off (the reader's "a poisoner would not ask a witness to pass the poison", with no rule written for
  it). "What would this need?" on the police theory: the steps reach the goal, the door open by the step before, the
  horse in its stall, the stick his own; nothing on the timeline meets Simpson having opium, a key, being at the
  door, or knowing a hiding-place: Holmes's "who sold the opium, where is the key, where could he hide the horse"
  (¶57), found at ¶46. Not yet: "why take the horse out, why not injure it in the stable" (a goal of injuring, and
  a plan that needs fewer steps), "what of the paper"; Straker's plan; a link that stops fitting disappears without
  a word; likely clashes (the "lost" stranger who knows the routine) remain for later.
- **Built (2026-11-05), the layouts:** the three-column page was practically unplayable on a phone (the user). Now a
  choice in Settings, as in the game: three columns (kept for a laptop), or panels with tabs, two or one; a phone
  always one. The page's parts are moved where the layout puts them, so each is drawn the same in every layout. The
  threshold, "show the rest" and reset moved into a Settings menu like the game's; reading on and undo stay in the
  header.
- **Built (2026-11-05), the ⚙ mark and the filter:** an entry the player can reason from (a typed state, a typed
  action, an intention with a goal, a claim with a plan, a circled aim with a goal) is marked ⚙, and the timeline
  can show only those ("Show: only entries with moves"; at ¶46, 8 of 271 entries). Known problem: since only the
  actions that matter are typed, the mark, and the filter more so, point at what matters (Hunter going out, at
  ¶29, before the reader has a reason to think of the door). **The user's ruling:** distracting data (typing the
  ordinary actions and states too, so the mark stops singling any out) is for later; when it is added, it is
  flagged as distracting (e.g. `distractor: true` on the fact's typing), so an option can turn the distractions off.
- **Order of what step 3 left (the user agreed, 2026-11-05):** (1) say when a link stops fitting; (2) Holmes's two
  objections, "why take the horse out?" (a goal of injuring; two plans for one goal compared) and "what of the
  paper?" (does a plan account for a fact), as step 3c; (3) Straker's plan, built from the player's own circles
  and links (the tin box typed only where a move needs it); (4) step 4, the commitment gate, after it, so the key
  at the give-away comes when the player could have reasoned to it; (5) distracting data, once the true path
  exists; (6) likely clashes last, to be discussed first: pointing out a likely clash is close to a hint.
- **Built (2026-11-05), a link that stops fitting:** a move that held and no longer does (a circle changed, an aim
  no longer circled, a premise's trust lowered) is announced in a corner notice, wherever the player is looking,
  with why in the page's words ("It would only work if the paper were money or a message, and your marks on 'What
  was in the stranger's paper?' rule that out"), Show (the entry's detail) and Dismiss; the entry's detail lists it
  under "No longer fits", with Withdraw. The move stays, so it comes back if what changed changes back (Undo).
  Reading back past a premise and on again is not a lapse.
- **Built (2026-11-05), "what of the paper?" (step 3c, half):** on an open plan, "Does it account for this?" lists
  the plan's agent's other typed actions and intentions on the timeline, each checked one at a time at the player's
  click (the user's choice over checking every fact at once): does it bring about the plan's goal or a need of a
  step? On the police theory at ¶46, neither the stranger's wish that the boy has the paper nor his asking for the
  tip serves it, whatever the paper's marks: "the plan leaves it unexplained".
- **Built (2026-11-05), "why take the horse out?" (step 3c, the rest):** **the user's ruling:** a plan the story
  proposes, even as a supposition (Holmes's "If he wished to injure it why could he not do it there?", ¶57), is a
  plan in the data and a selectable option, not something the player builds from scratch. It is
  `f.h_injure_there` (Simpson drugs the boy, unlocks and opens the door, injures the horse where it stands; a new
  typed action, `injure`). On an open plan, "Compare with another plan" lists the agent's other plans on the
  timeline; a compared pair shows each goal and whether its steps reach it, the step counts (5 and 3), the steps in
  one and not the other (leading out, striking, hiding against injuring), and the unmet needs in one and not the
  other (only the theft needs a hiding-place). Not built: that both goals serve one wish (Simpson stands to lose if
  the horse wins), so the comparison does not itself say the shorter plan would do.
- **Built (2026-11-05), Straker's plan:** **the user's rulings:** (1) the reason leading out is needed comes from a
  why-question, not a rule given in advance: "Why take the horse out of the stable?" (`q.why_out`), raised by
  Holmes's objection at ¶57, offers "for early exercise" (¶34) and "to steal him" (the police) first, and behind
  More "to do something that would be heard in the stable" and "... by a light that would be seen from the stable"
  (the annotated reading's turn-around, t57.3; Holmes gives noise at ¶223). Circling either adds a need to injuring,
  as the player's hypothesis: the horse away from the stable. (2) An aim implies its last step: "to injure the
  horse" carries Straker injuring it, intended, never on the timeline. Played at ¶57: circle Straker for who led the
  horse out and "to injure the horse" for why he went out; leading out serves nothing toward injuring until the noise
  reason is circled, then it serves it (it puts the horse outside); "What would this need?" on the aim: only the
  intended last step would reach the goal (he failed), the door open and Straker at it unmet. Holmes's own plan
  ("injure it there") now has an unmet need: the horse is in its stall. Uncircling the reason announces the lapse.
  A circled who-answer to a question whose entry is a typed action (who led the horse out, who opened the door) is
  an action the moves can link. Not yet: the match and the candle (the light reason has the same coarse need), the
  knife as what injuring needs, the hoof as why the last step never happened, the lapse's why for a lost
  hypothesis need (it says only "nothing it brings about meets...").
- **Built (2026-11-05), the knife and a lost need's why:** a lapse that a reason no longer circled would restore says
  so ("It served a need of your hypothesis, the horse away from the stable, which came from 'to do something that
  would be heard in the stable' on 'Why take the horse out of the stable?': that is no longer circled"). Straker
  picking up the knife (¶82) is a typed action (`take`); "for delicate work", circled on "What was Straker's knife
  for?", adds to injuring the need to carry that knife, so the taking links to his aim. "To light the candle for
  close work" adds a light; the light answer of `q.why_out` now adds a light and away from the stable. The struck
  match (`strike_light`) is typed but reaches the timeline only at ¶226 (an inference until then).
- **Built (2026-11-05), a why-question presupposes its action (the user's choice):** "Why was a match struck in the
  hollow?" (¶102) carries `presupposes` (Straker striking a light with his vestas); with any answer circled, that
  action is on the timeline as the player's hypothesis, offered on the question's detail ("What your answer takes for
  granted") for "What is this for?". Played at ¶102: with the noise, the knife and the candle reasons circled,
  Straker's plan has leading out, taking the knife and striking a light, each meeting a need of the intended
  injuring; only the door (open, Straker at it) stays unmet. Uncircling the answer announces the lapse ("It came
  from your answer to ..., which presupposes it").
- **Built (2026-11-05), the commitment gate (step 4):** the 26 questions the story raises and a reader could answer
  before it gives the answer away (`answer_inferable_at` before `answer_given_at`; latent ones, never raised, are
  not gated) hold the reading: Read on, or a later ¶ typed in, stops before the first paragraph whose give-aways do
  not each have exactly one circle. Any answer passes, "something else" included, so nobody is stuck; reading back
  is free. A notice (with Hide; Read on shows it again) lists the questions, each linked, with how many are circled.
  Reading a give-away shows the answer with the player's circle, right or not; the questions' own lists mark right
  and wrong as before. Gates by paragraph (questions answered there): ¶40, ¶58, ¶181, ¶212, ¶223, ¶224, ¶228 one each;
  ¶202, ¶218, ¶221 two; ¶146, ¶220, ¶229 three; ¶226 four.
- **Built (2026-11-05), the hoof and the thigh cut (the user's choices):** "Who struck the blow that killed Straker?"
  has a typed entry (striking Straker), so a circled answer (Silver Blaze, Simpson) is an action of the hypothesis
  that strikes him down. On a plan with an intended step, "What stopped it?" lists the known actions (typed ones on
  the timeline, the player's hypotheses), each checked at a click (`stops`): did it leave the step's agent unable to
  act (struck down, drugged, dead) before the step's time was over? Straker's injuring now has a window (one to
  seven); at ¶102, with the horse circled, the horse's kick is the one that stops it. "Straker's own knife" on the
  thigh cut is an answer that is itself an action (`action` on a possibility): cut, as he fell, by his knife; its
  needs (carrying the knife, struck down) are met by his taking it up and by the kick, shown on the question's
  detail. A circled Simpson would stop it too: the marks, and the key at ¶212 and ¶226, decide between them.
- **Built (2026-11-05), likely clashes ("unlikely together"). The user's rulings:** they come from the moves where
  the moves can catch them, otherwise from the data; in play one is shown only when one side is the player's own
  circle and the other is on the timeline (a reaction to the player's hypothesis, not a hint), and every one is
  listed at its question's give-away as "what a careful reader would have noticed"; shown as an amber entry, softer
  than a contradiction (when to show them may become a setting later: all four ways seemed reasonable). Data:
  `world/strains.json`, 13 pairs from the annotated reading's `strains` and the questions' ruled-out answers (the
  lost stranger who knows the night arrangements; the stranger who could not have known the dish; a horse loose but
  bridled; the coat torn off in a fight, or blown by a wind that did not blow, yet laid across the bush; the knife
  as a weapon; the moor and the gypsies against Holmes's reasoning; and, for the key only, three between story
  facts: the police's repeated blows against a single savage blow, their led horse against its lone tracks, their
  fight against the laid coat). Not in the data because already caught: the poisoner who asks a witness to pass the
  poison (the paper's link lapses), Simpson's admission and Mrs Straker's dress (certain contradictions with
  their claims). An amber entry can be set aside ("I hold both", undoable).
- **The logic audit (2026-11-05):** `docs/logic-audit.md` measured, for the 26 gated questions, which links of the
  careful reader's chain the page supports: 8 by reasoning, 3 only told early, 7 partial, 8 missing; the largest gap
  the night at the stable (one culprit, the key, the dog, the alarm). The user agreed to its recommendations (a
  guard rule for the stable, data for the judgement questions) and ruled: **where several answers are valid, the game
  accepts any of them**. Order left to the session: the audit's.
- **Built (2026-11-05), the audit's step 1 (small data and likely clashes):** `also_right` on a question (the light as
  well as the noise for "why take the horse out?"; laying against his own horse as well as the debts for the motive):
  right at the give-away, never contradicting the answer. Six likely clashes, each shown on the player's circle: the
  stick as weapon against the single blow (s.blows, moved off two story facts so it shows in play), a message in the
  paper against "you won't be a loser", "to see that all was well" against the lads sleeping till morning, Simpson as
  the striker against his having no wound, Derbyshire as a friend against the bill in Straker's pocket, the bay as
  another Ross horse against Bayard scratched. The police's suspicion (¶39) asserts that the stranger is Simpson, so
  a wrong circle meets a contradiction there.
- **Built (2026-11-05), the audit's step 2 (the night at the stable, the guard rule the user agreed to):** the drugging
  is a typed action of whoever is circled for it; a guard on watch (Hunter, `guards: stable`) must be unable to act
  for anyone else to lead the horse out or injure it there; "did not bark" adds that the dog knew the agent, met for
  the people who live at King's Pyland. Played at ¶57: with Straker circled for the drugging, the leading out and his
  aim, "What is this for?" links the drugging to his aim ("in order that Ned Hunter: unable to act"); his plan's dog
  need is met (he lives at the villa), while the police theory's is not ("The stable dog knows Fitzroy Simpson:
  nothing on the timeline says so", beside the opium, the key and the hiding-place). An action serves only its own
  agent's intention (one culprit). Four more likely clashes (the dog barking unheard; the opium at the window or on
  the path; exercise against Straker's own drugging). Left for step 3: who holds a key.
- **Built (2026-11-05), the audit's step 3 (who held a key):** a question raised by Holmes's "Has a duplicate key been
  found in his possession?" (¶57), whose circled holder keeps a key (a hypothesis action): it meets the key need on
  "Who opened the stable door?" and links into a plan through the unlocking. Straker is the answer, Hunter also
  right. Played at ¶57, with Straker circled for the drugging, the door, the leading out, the key and his aim, and
  the noise reason and "did not bark": his plan's steps run key, drugging, unlocking and opening, leading out,
  injuring (intended), every need met but the opium and his being at the door, which the story never tells either.
  The gate gains the question at ¶220 (27 gated).
- **Built (2026-11-05), the audit's step 4 (presence and the instrument):** striking needs the striker in the hollow
  (met for the horse from ¶37, nothing for Simpson); each weapon implies its striker (the hoof the horse, the stick
  Simpson), so the stick against a circled horse is a contradiction, its side saying which circle implies it, and
  it goes when that circle is distrusted. With the clashes of step 1 (no wound on Simpson, the single blow), who
  struck the blow and with what now have a route from ¶41.
- **Built (2026-11-05), the audit's step 6 (the motive, on the user's go-ahead):** an aim can serve a motive ("What is
  this for?" on a circled aim); an injured horse loses the race (`GOAL_RAMIFIES`); the bets motive wants that, the
  debts motive wants Straker in funds through laying against his horse; the debts rest on Straker owing an account,
  met by the milliner's account once William Derbyshire is circled as Straker. Played at ¶214: injuring links to
  either motive "in order that Silver Blaze: loses the race". The user does not want distracting data yet; step 5
  (traces) is under discussion.
- **The audit's step 5, options (2026-11-05):** a "What made this?" move on a track (the open topic of player-added
  inferences); tracks read by themselves (Watson sees them); questions and likely clashes only; a change of heading as
  a change of aim; hiding needing someone in charge. The user saw valid reasons for each and chose the recommended
  mix for now: tracks read by themselves, the heading change, hiding needs charge, clashes for the gaps.
- **Built (2026-11-05), the audit's step 5 (tracks):** what the tracks show is on the timeline where Watson sees them
  (¶117–124); "It changed" on the man's two headings gives "changes his mind: making for King's Pyland, then for
  Mapleton"; hiding the horse at Mapleton needs its master (met once the man is circled as Silas Brown; a groom has
  "nothing says" and the clash "no groom would dare"); five likely clashes (the pit, far away, a secret place, hiding
  from the start, the groom). Played at ¶127.
- **Built (2026-11-05), two loose ends (the user's choice before the next session):** the motive no longer offers
  "What is this for?" toward the aim (`end: true`); Straker at the stable after one comes from his own word at ¶32,
  so his plan's needs are all met but the opium.
- **Features of the old game for the new page (the user's choices, 2026-11-05):** the priorities are links in the
  story panel, a Cards panel, hints and autoplay. Agreed order: the true path as data and a check that plays it
  through the page first, then the autoplay (which plays the path), then story links (names to their entity, from
  `mentions.json`; links on each fact's quote only after measuring how evenly facts cover the text, since uneven
  cover points at what matters) and a Cards tab, then hints. Cards: a tab holding only the list of the people,
  animals, places and things met so far, by kind (not the model's own entities before the story names them); a
  name opens its card in Detail, which gains the quotes that mention it and its questions. Hints: as in the old game
  (a Hint button with a cooldown, rungs), ideally working after the player leaves the path; details to be discussed.
- **Built (2026-11-05), the true path:** `world/path.json`, 112 moves from ¶24 to ¶216, and `scripts/path-check.mjs`,
  which plays them through the page in under a minute. Every gated question is answered right through the real page
  and every move is offered at its paragraph, so the audit's routes hold end to end. Writing it found that trust per
  link could not set a lie aside: a false claim shares its link with that speaker's true words (the stranger's "lost"
  with his wish that the boy gets the paper; Straker's "to see that all was well" with his walk to the stables;
  Gregory's theories with the contents of Straker's pockets; Ross's "not my horse" with Bayard scratched), and "Straker
  had defended himself" had no link of its own at all: 58 contradictions stayed open at the end. **The user's choice**
  among trust per statement, beliefs on a link of their own, a "false" mark on a contradiction's side, or tolerating
  them: **trust per statement** (each statement's own link, `stmt:<id>`, drawn once above its chains). The path now
  distrusts 18 false statements and ends with no contradiction open and no likely clash unheld.
- **Built (2026-11-05), the earliest check (the user agreed to do it before the autoplay):** the path check now fails a
  move the page allows before its paragraph. The first run found 11, all the path being late, none the page running
  ahead of the story: seven circles (the hoof and the horse as striker at ¶37, Mapleton at ¶40 by the data's
  `answer_inferable_at`, the knife's delicate work at ¶81, the sheep at ¶173, the bay at ¶197, money in the paper at ¶24)
  and the police plan's unmet needs and "What stopped it?" (both at ¶46, not ¶57). A plan or a check counts only once
  it shows what the move is for (the man's plan offered at ¶126 meets its need only with Silas Brown circled at ¶127).
  Money in the paper had been held back to ¶36 so that trying the drug would show its lapse (with money circled the
  link holds through money); **the user's choice:** circle money at ¶24 (the data's `answer_inferable_at`, kept) and
  cross out the drug at ¶36 without trying it; the rule is covered by `engine/actions.test.js`. No move is late. Note:
  Mapleton at ¶40 is the reader's own reach (who gains, means, distance), which the page does not support until the
  likely clashes of ¶114–124; the data's `answer_inferable_at` times it, not the page.
- **Built (2026-11-05), the autoplay (the user agreed to the proposal):** `ui/world-autoplay.js`, from Settings → Watch the
  autoplay… (`world.html?autoplay`), as the old game's: a save of its own (the player's timeline kept aside, only its
  layout and theme borrowed), fresh each time; a strip with the paragraph, the caption, Pause, Step, speeds ¼×–4× and
  Stop; a cursor gliding to each control, the page's own events; Read on with the real button, so the gate is met as a
  player meets it. One playthrough, the careful reader's path (a just-in-time one from `for_q` could come later). The
  caption says each move in plain words with the reader's `why` (a wrong answer circled reads "Trying"); what a move
  shows (`see`) is highlighted for a moment, its tab chosen first in tabbed layouts. It plays in the viewer's layout,
  choosing tabs as a player would; on a phone the header moves below the strip. It starts paused, so a speed can be
  chosen first. About a quarter of an hour at 1× (two seconds a paragraph, about five a move). `scripts/world-autoplay-check.mjs` plays it with no pauses in each layout.
- **Built (2026-11-05), story links and the Cards (option A, the user's choice):** every name in the story is a link
  to its card, every one alike (the old game's `mentions.json`, matched by `engine/story.js` as the game matches it;
  233 links by ¶46). A Cards tab (in three columns a folded box under Questions) lists the people, animals, places,
  things and groups met so far, by kind, in the order met: first named in the story, or first on the timeline for the
  world model's own entities, which have no mention (the two other lads, the analyst); the calendar, clock and weather
  and the old game's topics are not cards. A name opens its card in Detail: the questions about it (whose entry is
  about it, raised so far), the sentences of the story that mention it (folded), and its own timeline.
- **Measured (2026-11-05), for links on each fact's quote (option ii, not built):** the 681 quoted facts cover 56% of
  the story's text; the median paragraph is 56% covered, 24 of 231 not at all (12 of them in ¶161–211, the Colonel and
  the race), 77 more than three quarters. Paragraphs with typed facts are covered no more than the rest (54% against
  56%). So cover would not point at the paragraphs that matter; within a paragraph it would still mark which sentences
  are facts, about half of every paragraph's text.
- **Built (2026-11-05), hints (the user's choices among the options put):** `ui/world-hints.js`, with the moves made
  through the page shared with the autoplay (`ui/world-moves.js`). A Hint button in the header (and on the gate's
  notice); each press goes a rung further on the same thing: (1) where to look, (2) the reasoning, the path's `why`, (3)
  the move, with Do it. After a press the button waits (Settings: none, 10, 30 or 60 seconds; 30 by default); reading on
  is shown whole and starts no wait. What a hint is about, from wherever the player is: (a) a wrong mark on a question
  the path settles, once the path has its reason at or before the paragraph read to (Simpson circled at ¶30 is let be;
  at ¶41 the hint says to look again), and only on an answer the page lists now; (b) a distrust the path does not make
  (a false statement's own is let be); (c) the next move of the path not made that the page allows now, tried and taken
  back at once, the soonest answer given away first; a circle or crossing counts as done once the question has any
  right answer circled; views (plans, checks) are not hinted; (d) **the user's addition:** when nothing is possible,
  read on. A move is offered from its `hint_at` if it has one (Mapleton from ¶114, **the user's ruling**: a hint points
  only at what the page supports). `scripts/world-hints-check.mjs`: a player who only takes hints reaches the end with
  every answer right, no contradiction open, no likely clash unheld, in 66 hints from a fresh page; from a page with
  mistakes (Simpson and the stick circled at ¶20, the house crossed out, Holmes's recital distrusted) in 67, each mistake
  found and undone. Found on the way: an answer behind "More" goes back behind it when its mark passes through
  uncertain (crossed out → circled), and a mark can sit on an answer not yet listed (reading back), which no click
  reaches.

### An incremental game about trying every combination

Embrace the absurdity: the combination-trying the game forces on the player becomes the game. The player
automates the search (try every pairing of these cards, every answer to that question) and the main mechanic is
deciding where to look first: which cards, questions or scenes to point the search at. The engine already checks
any proposed move cheaply (`checkStep`, `propose`, `concludeFrom`), the action tables and `hints.json` list every
scoring move with what it needs, and the statistics give the size of each search space.

**Decided so far (2026-11-02).**

- **No purchases.** Nothing is bought or upgraded: progress speeds up by itself as parts of the search space are
  ruled out.
- **Every existing mechanic stays.** The search is steered with the marks the game has: circling and crossing out
  answers, setting cards aside, marking them odd.
- **The counts are shown.** For each category: the combinations in all, how many are checked and how many ruled
  out, and the separate numbers that are added or multiplied to make the total.
- **Every scored family is a search space**, however few its targets.
- **The search narrows with "onto something"** (`propose`: is this set part of a recipe whose cards are all in
  hand, and how many are missing); more feedback of that kind is wanted for the other families.
- **Hard only.** Incremental mode is built on the Hard preset.
- **The maximum is mandatory**, and the game allows no move that would lose a point.

**Decided next (2026-11-02).**

- **No new feedback at first.** Try with only the feedback the game has ("onto something" for builds, the checks
  of cross-outs, exceptions and drops), and measure which categories need more.
- **The stale count is shown**: negatives that a new card may have overturned, checked again only where it can
  complete a target ((c) below).
- **The story waits before every deadline** of the 70 rows, and before every point where a move expires.
- **Start with the options that give the largest search space** (builds and answers as routes; no added feedback),
  and narrow only what turns out to need it.
- **The story need not be read to the end at the waiting pace.** Once the maximum is reached the player reads on
  freely. (The 'wait' pace's stop at ¶146 does not carry over: it waits on `k.first_up_and_no_subordinate`, a step
  of Holmes's that scores nothing; incremental mode waits only on scoring rows.)

**The search spaces, measured.** On Hard, the story read to a paragraph, every card there collected and asked
about, each move's arguments counted (at the end of the story the player holds 611 cards: 175 entities, 93 events,
150 statements, 121 background facts, 68 inferences, 4 propositions):

| Category | Made of | ¶46 | ¶92 | ¶146 | End | Targets |
|---|---|---:|---:|---:|---:|---|
| Collect | spans clicked (→ cards) | 383 | 573 | 717 | 977 (→ 422) | all; linear |
| Ask what I know | entity and event cards | 141 | 195 | 218 | 268 (→ 121 facts) | linear |
| Answers (propose, cross out, circle, prove) | Σ over the visible questions of their answers | 4,734 | 8,013 | 9,816 | 14,717 | one solver check each |
| Build: pairs (any size) | C(cards held, k), k = 2…8; ×6 kinds on Hard | 52,650 | 94,830 | 126,253 | 186,355 (4.7×10¹⁷) | 58 recipes |
| Theory | Π over the visible questions of (answers + 1) | 10²⁷⁸ | 10³⁷⁴ | 10⁴²⁴ | 10⁵³⁰ | the solution |
| Seal a check | look and compare: cards² × 3; ask and show: people × cards × 3 | 167,040 | 350,784 | 476,418 | 692,250 | 31 field pairs, 10 rows |
| File an absence | facts × times × statements | 128,744 | 256,520 | 346,104 | 490,050 (121 × 27 × 150) | 2 (1 row) |
| Drop | (theories + answers) × (2 × theories + cost + cards) | 1.57 M | 3.58 M | 5.05 M | 9.19 M | 3 |
| Mark as odd | cards held (a reason, ×122, does not count) | 325 | 436 | 503 | 611 | 11 (8 rows) |
| Raise an exception | exceptions open against held cards | 1 | 5 | 6 | 18 | 5 (3 rows) |
| Ask my own question | Σ over the 13 templates of their card choices | 4,502 | 8,742 | 11,069 | 16,743 | unscored |
| Board: a place / a holder / a split | things × times × places (holders); times × events | | | | 151,200 / 305,424 / 2,511 | unscored |
| Doubt, split, set aside, weigh | | | | | 274 / 2 / 418 / 6 | |

"State it yourself" takes a free formula and has no size. The questions of the whole case (921, not only the 335
visible at the end) have 17,322 answers and 10⁷⁷⁵ scenarios. Not yet measured: how many of the answer pairs can be
crossed out with everything held.

What the counts show:

- **Two shapes.** Answers, notices and asks are sums: a check removes one item. Builds, theories, seals, absences
  and drops are products: ruling out one value of a factor removes a slice (a card in no recipe removes 610 pairs;
  a crossed-out answer shrinks the scenarios by a factor). The products give the speed-up without purchases.
- **The build space is far smaller than it looks.** Only 157 cards are a premise of any recipe (70 statements, 65
  facts, 20 inferences, 2 events). Tried one card at a time first (611 probes), "onto something" finds them; at the
  end there are 1,763 distinct sets it accepts.
- **Checks differ in cost.** Collect, ask, notice, seal, pose and propose are lookups; cross-outs, proofs, drop
  checks and absences call the solver (milliseconds to seconds, some over the 20 s budget).
- **The space grows while it is searched**: every paragraph adds cards.
- **Moves the game never checks** (notices, seals) are not search spaces as they stand: marking all 611 cards odd
  scores every notice row, and sealing every plan with no expectation scores the checks.

**Feedback like "onto something" for every family.** It answers for a part of a combination (is this part in some
complete target whose cards are all in hand?), which turns a product into about a sum: an absence's fact, statement
and time checked apart (121 + 150 + 27 instead of their product); a check's verb and each field card; a drop's
target, after which `dropCheck` searches its reasons; for notices and exceptions the part is the whole target, and
the spaces are small (611, 18). The leak guard stays: only targets whose cards are all in hand count.

**A "no" lasts only until the next card.** A set not "onto something" becomes so once a missing card is collected;
an answer not ruled out now may be later. Only "yes" answers last. Three ways: (a) check everything again after
each new card; (b) make negatives permanent by asking over every recipe of the case; (c) check again only what a
new card can complete (the engine knows which recipes, absences and checks each card is in), shown as a "stale"
count. (b) comes from the answer key, not from what the player holds, and is ruled out at every level ("fewer cards
is itself a hint"). (c) is preferred; (a) against (c) is only a cost.

**No move that loses a point.** The two rows that can never score leave a maximum of 70. Points are lost by:

- reading past a row's deadline (every family);
- reading past where a move expires: a build once the story states its inference, a proposal once its question is
  settled, the implicit inference not collected by ¶102 (four deductions). The DepGraph waits export computes
  these points (`engine/depgraph.js`, `lost`);
- moves that can be undone before the deadline: a doubt that lapses a built inference, a seal hedged by an opposite
  expectation (withdrawing it before Holmes acts clears it), the clash tie of the police's "Simpson drugged him"
  beside the dish step (a doubt resolves it), a drop whose reason does not hold (it can be dropped again).

A made row stays made. So only reading is irreversible, and the preferred design gates it: the story waits before
every row's deadline and every expiry point until the move is made, and refuses to read on when the state can no
longer reach the gated row, naming what to undo. The alternative, refusing every move that makes a needed move
impossible, needs a reachability check per move. Before building: the 'wait' pace gates only Holmes's sharp,
non-expert deductions, so incremental mode needs gates on all 70 rows and the expiry points. A gate on every row
tells the player that something scores before ¶N; the 'wait' pace already accepts that for deductions, and the
search would find the row anyway.

**Step 1 built: the waits** (engine only; `docs/case-format.md`, "The 'incremental' pace"). The story waits before
the deadline of each of the 70 rows and at 16 paragraphs where a needed move is lost (33 paragraphs in all), each
wait met by any route; notices and sealed checks say how many waits they lifted (the wait as their check, agreed
over limits or costs on false marks). Found on the way:

- **The waits for moves that expire are needed.** A player who moves only when the story waits reaches 70 with
  them; without them, it is stuck at ¶146 with 23 rows made. The heaviest is ¶102, where four inferences of the
  night (`k.wife_stayed_home` serves 19 rows) are stated.
- **`hints.json`'s `needs` miss the hidden needs the DepGraph export found**: a move that gives an implicit
  inference also needs the moves that give its other premises and the cards it waits for (proposing "opium" for the
  paper packet needs the question shown, which `k.paper_held_opium_means_nobbling` raises once Simpson is held). Now
  in the hints' data (`engine/hintData.js`). This also closed an old gap: the page's hint-only player needed 69 hints
  against the engine's 57; both now need 58.
- **The hints' `at` is the reader's paragraph, not a schedule**: replayed there even the free pace loses the raise
  of `t36.2`. The minimal table's own `at` is one.
- **A move only the page can lose.** The page offers "Drop it…" on an answer only from its chip; once the
  ten-pound note is held the packet's contents are settled, the "opium" chip no longer shows, and the drop of
  `t58.3` cannot be made in the page (the engine takes it). A player who collects the note before proposing "opium"
  would lose that row in the page: an expiry caused by a move, not by reading. Fixed (the user's choice): a settled
  question keeps the other answers the story has shown folded beside it on Hard too, as on Easy and Medium, each with
  "Drop it…".

**Step 2 measured: what a blind search costs** (`npm run search-cost` → `.cache/search-cost.md`;
`engine/searchCost.js`). An automaton plays incremental mode on the page's rules with only the feedback the game
gives: at each wait it collects every span and asks about every card, then searches each open wait. Builds grow sets
card by card with "onto something" (one check per set tried, then the kinds); notices and exceptions are tried one
by one, the wait lifting as the check; seals, absences, drops and the answers route are counted (the space, the
solutions in it, the expected position of the first). Three random orders:

- **It reaches 70 every time**, every wait met by its own search.
- **Builds are cheap with "onto something"**: about 71,000 checks over the whole game (lookups), most at the first
  stops, where the search builds every recipe in hand; the dearest wait is ¶93 (`k.dresses_for_the_other_woman`,
  about 37,000: it rests on another inference that must be built first). Most deduction waits find their row made
  already. No deduction needed the answers route.
- **Notices about 250 checks a wait** (1,900 in all), **exceptions under 10**: small spaces, the wait as the check.
- **Seals, absences and drops need narrowing**: a seal wait costs 15,000–130,000 checks (589,000 in all), the one
  absence 188,000, a drop 82,000–107,000 (and each drop check runs the solver). Their spaces are products with very
  few solutions (2–24 seal plans, 1 absence, 5–12 drop reasons that hold).
- **A row the page could not reach**: `t58.3`'s drop, at ¶102. Once the ten-pound note is collected the packet's
  contents are settled, and the page showed no "opium" answer to drop. A search that collects everything always
  met it. Fixed as above.
- **Side effects of building everything**: about 16 inferences the minimal playthrough never builds (the police's
  and Gregory's among them) and 13 clashes at the end. They cost no row here, but they slow every solver check.
- **Stale negatives** at a stop are few (0–9 sets of the build search, checked again where a new card completes a
  recipe).

**Step 3 built: feedback on part of a move** (the user's choice, for the three families that needed narrowing;
`docs/case-format.md`). Absences, sealed checks and drops answer for each part apart, as "onto something" does for a
build; the expected result of a check, the value of its expected answer and the reason of a drop are still tried
whole. Measured again (`npm run search-cost`, three orders, the searches now run, not counted): 70 every time, no wait
forced.

| Family | Blind (expected, counted) | With the feedback (run) |
|---|---:|---:|
| Sealed checks (8 waits) | about 2.5 × 10⁹ (2.5 × 10⁹ for `t92.12` alone, 120,000 for the others) | 6,600 (1,400 for `t92.12`; 500–900 for the others) |
| Drops (3 waits) | 1.6 million (each a solver check) | 11,300, of which 650 solver checks |
| The absence | 188,000 | 284 |

- **`t92.12`, the photograph check that must expect the answer "William Derbyshire is Straker"**, was what was left
  large: with no feedback on the answer the search tried answers one by one (836–45,531 checks, 30,400 on average).
  The question an expected answer is about is now a part too (`sealOnto(verb, fields, {slot})`, the user's choice;
  never its value): 614–1,779 checks, and the sealed checks 6,600 in all instead of 35,600.
- **A trap of sealed checks, found by the search.** Two rows can wait on one check, one wanting any plan, the other a
  given result (`t116.3` and `t92.11`; `t92.5` and `t92.12`). A seal that expects the wrong result makes the first row
  and then hedges the second (a check sealed expecting both results scores nothing). It can be undone (withdrawing the
  wrong seal before Holmes acts clears it), so the page must make that plain; a seal with no expectation never hedges.
- **Lessons for the automation**: never take back a move that made another row (a notice, a raise, a drop, a seal);
  feedback stops pointing at a row once it is made; rebuild the card pool after a build (an inference is a premise
  too).

**Step 4 built: the automation** (engine only; `engine/automation.js`). An `Automation` plays a game at the
incremental pace a check at a time (`step(budget)`): it reads until the story waits, collects every span read and asks
about every card, then searches the families the open waits name in turn, with only the feedback the game gives (step
3's parts, the question of an expected answer among them: the user's choice for `t92.12`). What it built on the
measurement of steps 2 and 3:

- **Alone it reaches 70** in every order tried (three), with no hints: 20–30 seconds of engine time, except where a
  drop's reasons are tried against a theory (`t62.4`, about 5,000 solver checks, four minutes in one order).
- **The player steers with the marks**, never the case data: a card set aside goes last; the cards of a circled answer
  (its question's card, the answer if it is a card) first, then cards marked odd. A circled answer is tried first as
  a check's expected answer and last as a drop; a crossed-out one the other way. Each category can be paused
  (`setRunning`); a paused one leaves its wait open, and the automation goes idle naming it.
- **The counts** (`counts()`), per category: the space as terms added, each a product of factors (sealed checks: Σ
  over the verbs of field × field × expected results; builds: Σ over the set sizes of C(cards, k) × kinds), the
  checks made, what they found, what is ruled out now, and the stale count. What a build rules out is a lower bound
  (only cards alone not onto anything are counted).
- **Stale negatives, option (c)**: a build set that is part of a recipe now complete; a check's verb or field card
  when a plan that takes it names the new card in another field; an absence's parts when one of its cards or times
  arrives or the story passes it; a drop's reasons on any new card; a notice, a raise or a sealed check that lifted
  nothing, when a new wait of its family opens. At the end of a run: 10–24 build sets, 60–90 check parts, 35–200 drop
  reasons, and 440–575 notices (each new notice wait makes every earlier "no" stale, and the wait lifts long
  before they are all checked again).
- **Checks over a whole run** (three orders): builds about 35,000 (54 inferences built), notices 1,200–1,550,
  sealed checks 4,500–6,800, drops 4,600–7,100, the absence about 280, raises about 20; collecting about 340 spans
  and asking about 265 cards.
- **Traps**: a search is a generator abandoned whenever the hand changes, so whatever it counts must be counted before
  it yields; a move that made something is never taken back (it may be another row's).

**Step 5 built: the page** (the user's asks: a new panel with the contents above and a log of past actions; each
check one second, configurable; a progress bar, in more than one place). The pace *Incremental* in Settings starts
the case over on Hard (difficulty locked). The **Search tab** (`ui/search.js`) shows what the story waits for (by
family only, never the row), the check under way with a bar filling over its time, *Next up*, the counts per category
with the numbers they are made of (and a bar of what is ruled out), and the log (newest first; the finds alone on a
tick). Each category can be paused; *Read on by itself* lets the search read the story on. *Time per check* (the
page's settings, default 1 s, 0 as fast as it can) sets the clock; the reading bar carries a second bar and the check
under way.

- **The queue** (the user asked whether it makes sense): the checks to come while nothing is found. Collect and ask run
  to the end before the rest, and their lists are known ahead (the spans not yet collected, the cards held not yet
  asked about), so each is listed; after them, only the next check of each category in turn. Further ahead it would
  be invented, since each check's answer decides the next (a "yes" grows the set, a "no" moves on). The first version
  showed one check per category including collect and ask, and the user found it wrong: it named an ask while a dozen
  collects came first. Measured over 20,000 checks, the queue now names what follows in 4,570 of 4,578 predictions
  (the misses: a check that changed the hand without counting as a find).
- **The plan** (the user asked for the rest of the current category, what comes after it, a category per size of
  set, and a list while builds run, rather than the one check of each category): each search's loops publish their
  list and where they are (frames, `#frame`), and `plan()` interleaves them as the categories take turns
  (`next()`/`execute()`'s own rule: a category leaves the turns after its last check). A frame's rest is exact while
  every answer is "no"; a build level's list holds whatever its answers (they decide the next level), except that a
  complete set's "yes" puts its kinds first; the list stops where a stage is not made yet (a build's next level, a
  check's second field, the pairs) and a line says what comes then. Measured over 19,000 checks: 180,020 checks
  foretold, none wrong outside those cases; the search itself unchanged (the same 18,522, 18,648 and 22,324 checks to
  70 on seeds 1–3, since the lists consume the shuffle in the same order). Sizes are shown, not separate
  categories (the user's choice): a size cannot take turns with the one before it, whose answers make its list. Per
  size (seed 1) the checks were 875, 3,297, 472, 395, 257, 112, 29 and 15 for sets of 1 to 8.
- **"Unchecked" in place of "Ruled out"** (the user's ask and name): for builds the two were huge and nearly equal
  (2.38 × 10¹⁵ both), so what is left could not be read. The column is now In all − Ruled out, the bar still the
  share ruled out. For builds it counts by the search's own rule rather than the lower bound: alone, the cards not
  answered; a larger size only once the size below is all answered, as the sets its level would list, not answered
  yet (the same count as the plan's); before that, "—" and a "+" on the whole. Otherwise sets of 3 would read in the
  millions while the plan lists a few hundred.
- **Next up keeps one shape** (the user saw the panel shift as the queue changed): the grow-only floor alone did not
  hold it, since the floors start again when the story moves on or the width changes, and the rows' wrapping and
  count changed the height from one check to the next. The box now always has ten one-line rows (a long label cut
  short, the whole of it on hover; blank rows where the queue is shorter) and the same words beneath; search-check
  measures its height over eight checks. The panel still moved below it: the table's rows wrapped as their numbers
  grew (a category row 28 → 42 px, its line of terms 24 → 56 px), and the floor kept each growth. Every row is now one
  line (the terms cut short, whole on hover); search-check now fails if a check that finds nothing moves anything.
  The rows no longer wrapping, the table scrolls sideways in a narrow panel: a check's redraw now keeps every
  scroll of the tab, both ways (`hold`/`fit`).
- **A page that does not jump** (the user's ask, after the Prestige Tree loader's grow-only floors): every piece of
  the tab (the waits, the check under way, *Next up*, the table, the log) is drawn even when empty and keeps the
  largest height it has had; the reading bar too. Each number in the table has its own box whose width in characters
  only grows, with tabular figures. The floors are the page's, not the save's, and start again when the story moves
  on. A first try floored the measured column widths and fed back on itself (the table spreads its spare width over
  the columns and the floor kept the spread, pushing *Stale* out of view). The log, redrawn with the tab, keeps the
  entry at its top in place when scrolled down; the next check is planned before the page is drawn, so "nothing under
  way" no longer flashes between checks. The engine plans a check before making it (`next()`, `queue()`, `execute()`), which also makes a
  check safe to make again when the solver hands it to its worker (the move is made once).
- **The log** (the user's ask, 2026-11-02): every find and the last 100 other checks, saved whole. Before, the last 500
  in the page and 200 in the save, so the finds (77 in a game of about 18,500 checks; 1,880 "yes" parts, 602
  collects and asks, some 16,000 "no") were pushed out within minutes. The "yes" parts are not kept as finds: they
  are steps on the way, and would be nearly 2,000. Where checks were let go, the page says how many (from the
  check numbers).
- **Kept across reloads**: the counts, the negatives and the log, beside the game's save. A whole game's
  negatives are 2.8 MB written as card ids; as the cards' places in the case, under 0.9 MB.
- **The time a game takes**: at first 46,000–55,000 checks over three orders (13–15 hours at one a second), 33,000–38,000
  of them builds. Since builds go by "onto something" (below), 18,500–22,300 (5–6 hours), 5,500–6,000 of them builds.
- **Builds by "onto something"** (the user's ask, 2026-11-02, after the Cards list showed 206 of 517 cards never
  tried alone at 30,000 checks: the old search grew sets depth first from the top of the order and began again at
  every find). Propose's "onto something" means a strict part of a recipe whose cards are all held, so no set is onto
  anything unless every part of it is. The search now goes level by level: every card alone first; then a set found
  onto something and one more card itself onto something alone, only when every part one card smaller is onto
  something too. Both answers are kept: a "no" until it goes stale, an "onto something" (`onto`, saved) until an
  inference it may have pointed to is held. Before, a pair could pair a card with one already "no" alone, and
  "onto" sets were proposed again on every pass. A test holds the order: no set of two or more before each of its
  cards was onto something alone.
- **Checked through the page** (`scripts/search-check.mjs`): the clock, both bars, the queue (its first is the next
  check), nothing moving up over eight checks, the log keeping its place, pause, a wait lifted at 0 s, reading by
  itself past ¶110, a reload, no console error.

**Simplifications (2026-11-02, the user's asks, after the alternatives were laid out; the user took the
recommendations).**

- **"Mark as odd" and "Set aside" are now *important* and *unimportant*** on the page (the engine keeps `notice` and
  `setAside`, the saves and the action tables their names). They exclude each other: one mark of three states. The
  record's family reads *Important details*; the theories still weigh the *odd things* left unexplained, because that
  speaks of the case's puzzles, not of the mark. The rename also ends a clash of words: the game's own clash weighing
  "sets aside" a card, which is a different thing.
- **Important cards are listed first** in the Cards tab (open), the unimportant folded at the bottom.
- **The Cards list says what is left with each card**, from what the page shows anyway and never whether a card
  matters: its open questions, *not asked*, a ✎ for a note, and in incremental mode the combinations the search still
  has to try with it (`Automation.perCard()`). For builds, the user's rule: only as far as "onto something" has told.
  The card alone if not tried; the pairs with it not tried (a card "no" alone rules out every pair: onto means a
  strict part of a recipe whose cards are all held); larger sets only where a set of two or more with it was onto
  something (that proves a larger recipe), counted as that set and one more card. So a card whose pairs are all "no"
  shows nothing left to build. The search now remembers its "onto" sets (`onto`, saved) for this. A first version
  counted every set of up to 8 cards (10⁹ and more per card: no use for steering). A "still matters" list was
  rejected as a spoiler (it would run ahead of the story); the hints already give that a rung at a time.
- **The "because…" of a notice and the question form went for one free note per card** (`setCardNote`). Neither was
  ever scored: the reason was only stored and shown, a question only joined the story's when the story asked it (the
  record showed the lead, never counted it; its candidates became circles). The careful reader's 10 questions are now
  `cardNote` moves of the action table (the question's words written as the note). Card notes show on the card, in the Notes tab beside the story notes, and as ✎.
  In incremental mode the note box keeps its words and focus through the search's redraws.
- **Two more folds (2026-11-02, the user's choice of the surveyed candidates; the rest kept as they are):** a card's
  doubt and split sit in one section, *I don't believe this…*, folded until either is in force (weighing a theory
  stays in the Theories tab; the autoplay opens a folded section before clicking in it); *How it reads under each
  story* shows only once the player has written a theory down. Kept for now: propose, the card's timeline pencil, the
  difficulty options, the 13 tabs.

Not yet done: the hedge of a sealed check made plain on the page (the search itself never hedges: no expectation
first, a seal kept only if a wait lifts).

**Settings proposed.** Kept apart from the difficulty presets, as the reader option is; the first build uses the
largest space of each (builds and answers, no added feedback):

- **The routes to a deduction**: builds only (proven enough: the minimal playthrough reaches 70 with no cross-out or
  proof), or builds and answers (a second, often cheaper way to a one-answer deduction, steered by circles and
  cross-outs). Not answers only: steps concluding a formula probably cannot be reached that way.
- **The strength of the feedback**: the whole combination only, pairs, or each part apart. It sets how far a
  product collapses, so it sets the pace more than anything else.
- **Stale negatives**: (a) or (c), a cost only; never (b).

Each setting multiplies the runs of the page checks (12–13 minutes each; "check every difficulty"), so start with
the feedback strength and the routes, and add more only when play shows the need.

### Investigation: leads, split from "important" (2026-11-03)

"Mark as important" did two jobs: the player's own mark (it sorts the Cards list and steers the search) and the
scored notice (a NOTICE row scored if one of its cards was marked before Holmes's paragraph). The scored job cost
nothing (marking every card scored all 8 rows), the player got no signal, and the automation could only brute-force
it (1,200–1,550 checks a game for 8 rows; "onto something" cannot help a single card). The user's rulings:

- **The split (built, step 1).** *Important / unimportant* are personal marks only: no score, still sorting the list
  and steering the search, and *important* still meets a puzzle on Hard. The scored act is **investigating a lead**.
- **A lead, not a card.** The game proposes leads (leads.json): lines of inquiry in plain words, each proposed once
  its quotes are read and its cards held; a lead can be false where a card cannot.
- **One verb, "Investigate", in every mode.** Outside incremental mode a lead is a flag set and cleared freely, with a
  budget of leads under investigation at a time (larger on lower difficulties); what scores is whether it is under
  investigation when the story reaches Holmes's paragraph. A wrong flag costs a place a true lead needed at its
  deadline. Once Holmes's paragraph passes, the lead is settled and its place frees. Built (step 2): the option
  `leads`, 8 on Hard (the user's number), 12 on Medium, 16 on Easy and Trivial; at the cap the move is refused with a
  message, never something dropped to make room (the user). With only the 8 true leads it never binds: the
  careful reader, flagging each when noticed, holds at most 6 at once (¶188–189); a player who knew the deadlines
  would need 2 (the two bill leads, both due at ¶225).
- **Incremental mode:** an investigation takes a minute, its clock running beside the checks (one investigation at a
  time), and ends with its result at once (*something in it* / *nothing came of it*); the minute is the only cost. The
  automation investigates every lead, by default in the order they came; the player chooses which to put first.
  Built (2026-11-03): the user chose *nothing yet* for a false lead (and *something* for any lead that goes somewhere,
  scored or not); a false lead is answered like a real one, at the story's paragraph, and every settled lead shows its
  answer whether or not it was investigated and says whether it was real or false (`false` in leads.json). The
  player's priority: *Investigate next* in the Leads tab puts a lead ahead of the rest. The minute is the page's
  (Settings *Time per investigation*); the engine's move is instant, and the automation's slot (`inquiry`) sits
  beside the check queue rather than in it, so the lead category is no longer a check search.
  Known and left as it is (the user, 2026-11-03): since every lead that goes somewhere finds *something* at once,
  *nothing yet* still marks a false lead as soon as its minute is up, long before the story settles it. One way to
  tell less, not built: some real leads also find *nothing yet* until nearer their answer.
- **As many leads as possible**, the story's false ones among them (police, Gregory, Hunter, Mrs. Straker, Ross, the
  papers), each proposed only once the player holds what it rests on, some only after an inference is built; new
  inferences so that the true leads are earned by reasoning. Of the 8 unscored NOTICE rows only t40.5 (one blow,
  against "repeated blows") reads as a lead; t20.5, t82.4 and t100.1 are better premises of a proposing inference,
  t57.2 and t116.2 are the story proposing a lead itself, t218.3 and t220.3 commentary.
- **A panel of its own**: the Leads tab. Under *Settled by the story* each lead shows the story's answer once it is
  given (`answer`, with its quotes), *Answer pending* until then.
- **False leads, batch 1 (built 2026-11-03)**, the user's rulings: every lead is worded as a question about a detail
  the player holds (*why / what / who*), never as a theory ("Did the maid drug it?"), so the form of the question does
  not tell true from false; a false lead is a red herring, not a wrong theory. A lead that scores nothing settles when
  the story answers it, frees its place and shows its answer, with no score and no penalty; true leads that score
  nothing are allowed (the wound, t40.5) and settle the same way. Built: the paper offered the maid (¶24 → ¶58), the
  gypsies breaking camp (¶62 → ¶114), Simpson's £5,000 against the favourite (¶39 → ¶218), the wound (¶40 → ¶226).
  Left out: the maid (as a detail question, "who could get at the dish?", it leads to Straker, and the scored drop
  covers her) and Brown's bets (too borderline: they explain why he hid the horse).
- **Batch 2 (built 2026-11-03)**: what the stranger wanted (¶28 → ¶40, false), Straker going down at one (¶32 →
  ¶220), the cravat (¶35 → ¶226), the blood on the knife (¶35 → ¶226), why nobody has seen the horse (¶37 → ¶146,
  Brown's dawn rather than Holmes's ¶114 "would surely have been seen"), the winner with no white (¶198 → ¶202): true
  leads that score nothing, but the stranger's. Worded as detail questions, most of the catalogue's false theories
  become the detail they rest on, whose answer is true: real red herrings are few.
- **Batch 3 (built 2026-11-03)**: scored leads proposed only once an inference is built (an inference in `needs`),
  so they are earned by reasoning. The proposer must raise the question without answering it (an inference that
  also settles the lead would make the flag free). Four, three on inferences the case had: the horse led out onto
  the moor (k.taker_had_a_key, ¶37; reworded from "Why is Silver Blaze missing?"), the curry (k.drugged_in_food,
  ¶37), the milliner's sum (k.bill_is_his_own, ¶84); and one new, k.coat_came_off (t35.11, ¶35: he went out in his
  overcoat at one, by morning it hung on a bush). Left card-proposed: the knife and the odds (one paragraph before
  Holmes), the bill's name (anything upstream answers it), and the candle: its only reasoning, r.candle_for_work,
  answers it (a steady light for close work), and the cards say nothing short of that. Measured: Hard still reaches 70 (notice
  8/8); the minimal playthrough grows from 145 to 148 moves (39 builds). Two fixes it needed: the automation runs
  the build search while a lead wait is open (it stalled at ¶57: the horse lead waits on k.taker_had_a_key, whose own
  row is not due until ¶220), and the DepGraph places a move no earlier than a background fact it needs becomes
  relevant when an ask gives it (k.drugged_in_food, new to the maximum graph, was placed before ¶37's opium).
- **Leads, checks and questions as one chain (the user, 2026-11-03).** Laid side by side, most leads are a case
  question in prose (16 of 18 name a slot; 11 a case question) and most of Holmes's checks are how he follows a lead
  up (7 of 8), so the three tabs are one chain in the story: a detail that needs explaining (the coat on the bush),
  how Holmes finds out (he asks whether the night was still), the answer (he took it off to work). The user's
  rulings: the mechanics stay as they are, and each gives "onto something" hints for the next, where *onto
  something* means which parts of the check or question (verb, fields, answer chips, cards) belong to a valid set.
  An investigated lead opens hints for its check; a valid sealed check opens hints for its question; a question with
  no check takes its hints from its lead. In incremental mode the hints come as soon as the investigation ends;
  outside it, on Hard once a lead is investigated (it can then no longer be stopped), on the other difficulties once
  the lead is settled, and then for its question only (its check is past by then). The links live on the lead
  (`check`, `question`); a lead for every check and every question, questions joined to checks where it reads
  sensibly, false leads linked to nothing, and the story's remaining false leads added. Before this, only the
  incremental automation used the check hints (`sealOnto`: verb, field, pair, the question an expected answer is
  about), and the page showed nothing of them. Order: settle at the check; the links and their validation; the new
  leads; the check hints gated on a lead; the question hints; the incremental automation. Settling a question
  scores nothing (its count is only the header's progress): making questions scoreable, the original aim of a
  sudoku-like game of elimination, is a session of its own; the timeline's score later still.
- **A lead settles at Holmes's check (built, 2026-11-03).** A lead stayed open, free to flag, long after the story
  showed Holmes acting on it (the coat: he asks about the wind at ¶94, the lead settled at ¶226), because its
  deadline was the paragraph where he explains it. A lead's `check` now settles it at the check's paragraph when
  that comes first, and the NOTICE row's deadline moves with it (worked out in the engine; `thoughts.json` keeps the
  explanation paragraph). Seven leads have a check: the curry ¶216 → ¶163 (ck.maid), the coat ¶226 → ¶94, the
  candle ¶224 → ¶102 (ck.mud), the bill's name ¶225 → ¶161 (ck.photograph) and its sum ¶225 → ¶89 (ck.dress), the
  odds (ck.race, ¶197, after its own ¶189: unchanged) and why nobody has seen the horse ¶146 → ¶116 (ck.tracks).
  ck.boots waits for a lead of its own. Step 2 (built): every lead but the odds and the gypsies names its `question`
  (two false leads share `simpson.purpose`; the paper's is `paper_packet.contents`, whose answer is the harmless one);
  the validator checks the slot and that a check with an `answer` answers the lead's question.
  Step 3 (built): six leads so that every check and every case question has one, all scoring nothing: who else was
  in the hollow (ck.boots, ¶37 → ¶107), why the house felt no ill effect from the same dish (q.where_drugged, ¶218),
  who the stranger was (¶21 → ¶39), what Holmes said to Silas Brown (q.who_hid, ¶140 → ¶146), why Straker was
  unworthy of the Colonel's confidence (q.motive, ¶214 → ¶229; it needs no card, Holmes's line raises it), and one
  false: why Hunter is sure the stranger drugged him (¶36 → ¶218). Left out (the user agreed): a duplicate key (no
  key found points to the truth, an insider), the pits and old mines (no way to word it but as a theory), Brown's
  bets (borderline: they explain why he hid the horse). 24 leads, 5 false; the careful reader's moves unchanged. The careful reader's moves are unchanged and still score 8/8 (the bill's sum
  is the tightest: proposed at ¶84 once k.bill_is_his_own is built, due at ¶89).
- **No backward-compatible saves** (there are no players): the save version is checked, a save of another version
  dropped, and the migration code removed.

Measured after step 1 (seeds 1–3 to 70): the lead search takes 18 checks a game for its 8 rows (the 1,200–1,550 of
the card search gone), 18,718, 17,544 and 18,053 checks in all (were 18,522, 18,648 and 22,324: the other searches
move with the shuffle). Steps 1–2 had only the 8 scored leads, so the tab was an answer key; batch 1 of false leads (below) began to change that, and the timer comes later. A first catalogue of candidates (72 leads, 36 true, 31 false, 5 ambiguous; 11 new inferences drafted)
raised the problems the later steps must meet: where a lead came from must not tell true from false (the story
itself has characters proposing true things and buildable inferences that are false); an inference that proposes a
lead often also settles it, which makes the flag free, so proposers must sit earlier in the chain; late in the story
almost only true leads remain; some deadlines are later than Holmes's own act (the coat until ¶226, though he asks
about the wind at ¶94); some leads overlap scored drops and checks.

### Archipelago integration

Clues cannot be used for inference until the player receives their Archipelago item, much like the DepGraph
world. The three DepGraph exports (`npm run depgraph`) are a first experiment. What they showed:

- **DepGraph's format.** `{title, nodes: {id: {label, description, depends_on}}}`; the loader (`parse_json_graph`
  in Archipelago-CC's `worlds/depgraph/Rules.py`) reads only those fields, refuses cycles (Kahn sort, ties broken by
  id), and makes each node an item, a location and a region. The goal is whichever node sorts last, so each graph
  needs one sink (`end`), with every move nothing else waits on made its dependency.
- **The graphs are dense.** Convergence nodes have up to 15 dependencies (bundled graphs: at most 9, up to 356
  nodes). DepGraph's default `relaxed_items` suits that; `strict` may fail in a multiworld. The exports are Hard
  only.
- **This game's moves have deadlines and expiry, not just prerequisites.** DepGraph has no "before" constraint. A
  build is lost once the story states its inference (37 of the minimal playthrough's 144 moves), a proposal once
  its question is settled; an implicit inference not collected by ¶102 loses four deductions for good. The export
  works around it by cutting the story at every paragraph where a move is lost and making that stretch depend on
  the move; without that, the "as late as allowed" order scores only 59. "A clue usable only once its item arrives"
  maps poorly onto moves that expire. An integration would need either a different logic (items that unlock
  without expiring, or no deadlines) or a game rule that pauses the story until the move is possible.
- **"Any one of these" is not expressible.** A row's moves are alternatives, but `depends_on` means all; treating
  them as dependencies made a cycle. Each row waits only on the move after which it is first made.
- **Hidden needs.** A move that yields an implicit inference also needs the moves giving its other premises and the
  cards its formula mentions; a theory needs each of its questions shown and each answer offered; a row waits on the
  moves giving every inference of Holmes's step. These rules were found only by replaying the graph's own orders.
- **Not done:** copying the exports into Archipelago-CC's `data/` with an entry in its bundled list and options
  (until then a YAML can name the file with `graph_file:`); a fourth pruning round of the waits export (the third
  removed only 2 moves); a "Holmes's stated steps only" reading of "keeping up"; CSV or DOT output.

### Alternatives considered and not taken

From the redesign discussion and the later papers; any of them may be worth revisiting with a fresh design.

- **Rule instantiation.** Fill a rule card's blanks with cards ("dogs bark at strangers": dog = the stable dog,
  visitor = …) and the engine derives the constraint: generative, instead of matching a recipe. A full
  `applyRule` UI was rejected for the present game (rules bind up to 5 variables over 13–88 choices each).
- **No authored inferences at all.** The player concludes freely and a thought counts when the conclusion is
  covered. The most open play, but it leaves nothing to hint from or to check fair play against.
- **A conclusion picker** over the existing elimination checker; **pattern naming** (elimination, best explanation,
  coincidence, identification); **rival explanations per anomaly**, eliminated as wholes; **Socratic prompts**
  instead of counts ("what does this tell you about who chose the supper?").
- **Scenario play.** Two boards side by side (the police's story and yours) with a residue count; a theory-first
  mode (the game states the police theory, the player finds the first card that breaks it, then repairs it);
  steelmanning each suspect, scored by coverage.
- **Whereabouts and acquaintance** as player-facing alibi play: the sudoku-like part.
- **Noticing.** An expectation shown on each object card, the player marking where the story departs from it.
- **A light text adventure**: the player picks Holmes's next action from several; only the order of disclosure
  branches.
- **A trust dial per witness.**
- **Memory pressure**: cards fade unless noted.
- **An in-game Watson** (possibly an LLM) to whom the player explains their reasoning, limited to what the player
  holds and checked against the engine. Listed only: cost, latency and a leak check per answer.
- **A large neutral background library** the player searches, instead of a curated hand ("the curation is a
  hint").
- **Causal links between events** (enables, startles, kills), so that what a theory explains is computed rather
  than authored. Rejected as too large.
- **Typing instead of clicking** to collect a card on Hard.
- **Multiple choice**: removes the guessing, but too easy.

## 3. Ideas not built, by area

- **Pace.** A scored "keep up with Holmes" mode with an optional warning (only Free and Wait exist).
- **Conflicts.** List every minimal conflict set behind a broken theory (the UI shows the first found). Whether an
  open reservation, or a strained step, should weigh less in a clash (the clash key is a tuple, so it can be added).
  Corroboration (two independent witnesses, `t26.1`, `t36.3`) as a weight, and a "cuts both ways" doubt reason.
- **Background.** "When asked" answers with a fact only for cards that have one, which hints that they matter; the
  fixes proposed were filler for every card, or recalling a topic's facts with any of its cards. Easy marks every
  clue sentence (busy, and itself a hint): mark only names, or add a toggle. Borderline rule texts
  (`r.tendon_nick`, `r.horse_gregarious`, the same-dish rule) and leak-sensitive rules placed where Holmes says
  them (`r.saw_drug_would_not_eat` at ¶218) to revisit. `r.markings_identify_horse` repeats its exception text.
- **World model.** Knowledge rules never applied (`r.present_sees`; a knowledge route for the alarm would need the
  trainer's state in all 27 windows); the stranger excluded from `who` variables; simultaneous events ("as she ran
  she looked back") get no order; durations and distances; the closed world (an unknown accomplice is never a
  candidate). An authored "inside story" layer on the board.
- **Absences.** The lantern (`t78.4`) and the cravat in Edith's description (`t21.2`).
- **Checks and predictions.** An "advise {person} about {card}" template for `t92.13` ("keep him entered");
  sealing a slot's answer, or "Holmes will do X"; theories proposing their own predictions (needs answer formulas
  on every check); watch-Holmes thoughts shown as confirmations in the Checks tab; sealed checks on the timeline
  board.
- **Questions.** Templates for turning a question round; free-text or LLM-matched questions; scoring the player's
  questions like notices; questions feeding checks or theories.
- **Reader layer.** A catch-up hint after Holmes (built as the hints' catch-up note); a player-made "Holmes is
  interested in X" card; reader profiles and confidence drive nothing beyond expert steps not gating.
- **Hints.** Marking each hinted row in the record (the count by rungs exists; the hint log is kept for this);
  showing the annotation's `typed` lines at rung 2 or 3; rung 1 naming the scene rather than the paragraph; a fifth
  rung splitting "which cards". Rejected costs, kept for reference: hinted rows recorded apart or scoring nothing,
  a hint budget.
- **Minimal playthrough.** A search beyond the annotated reader's moves (other inferences, cheaper routes), so
  that "minimal" means minimal over everything the game allows; "fewest clicks" even at the cost of more moves;
  content counts shown in the Record after the story ends.
- **UI.** A "pin this card" second Card tab to compare two cards; a draggable column divider; a `retract` action;
  a rule `category` to sort the hand; the case loaded off the main thread; a faster `explainConflict`; cancelling a
  running check.
- **Freestyle formulas** for power users, run without comparing to an authored one.

## 4. Known limitations


- **Two rows can never score**, so the Hard maximum is 70 of 72: `t127.4` (the square toes are disclosed only at
  Holmes's own ¶146) and `t36.2` (its background fact is offered only at ¶218). `t212.1` and `t214.1` are never
  held (Holmes naming the horse is proved, not dealt).
- **Thoughts the game cannot hold.** Plain GENRE thoughts (the narrator's contract: `t6.1`, `t12.1`, `t39.3`,
  `t34.6`, `t93.2`); setting aside a passage (`t118.1`, `t152.1`: there is no card to set aside); strains by
  improbability (`t24.4`, `t37.11`, `t64.2`, `t120.2`) and support by consistency, authored only; 10 of 18 authored
  strains come from thoughts with no card; `t68.2` (Brown as organiser) has no target; `t92.13`, `t92.14` (no
  vocabulary for the sheep before ¶170) and `t161.2` are not held; the maid's question (`t163.3`) is recorded,
  never scored; 5 of the 10 QUESTION thoughts match no slot.
- **Who drugged the dish** is left open by the story; the case answers it by default, and the wife-as-accomplice
  exception stays a permanent reservation that never scores (`t218.3`).
- **A clash tie.** A player who builds the police's "Simpson drugged him" beside Holmes's dish step loses both;
  only a doubt resolves it, and the tie spreads into scenario costs.
- **The dog alone never rules out Ross**; only the curry route closes it.
- **Givens come only from a top-level `eq`.** A trusted false claim quietly fills a detail (Hunter's time for the
  drugging) until the player doubts it.
- **The story's own fair-play gaps.** Opium's taste, laying against one's own horse and the blaze are stated only
  after they are needed; the boot comparison, the bill's items and the question to the maid are never reported (the
  dress link is bridged by `r.asks_about_what_he_read`). Some asserted inferences cannot be derived and stay
  asserted with a reason.
- **"State it yourself"** reaches 41 of the route's 54 inferences from the cited cards (2 exceed the time budget,
  11 need world ties or an earlier step).
- **Theories.** Partial theories leave long lists of unexplained puzzles; theft explains for the police why the
  horse was led out, so `t46.3`'s item 4 is not reproduced.
- **Hard shows none of the story's signals**, so the watch-Holmes thoughts exist only on Easy and Trivial. The
  purist reader (`supplied: withheld`) still hears Holmes at the story's gates.
- **The minimal playthrough at the 'wait' pace stops at ¶146.**
- **A toast took the clicks under it** (found 2026-11-02, by the autoplay check missing 7 of its 376 notes, an older
  fault): on a short window the toast at the foot covers the story's last lines, and a click there (a note at a
  paragraph's end) went to the toast. Toasts now let clicks through, except on their links (undo).
- **The engine accepts moves the page cannot make** (dropping an answer never proposed, a candidate that fails on
  Hard). Only runs through the page (`scripts/ui-run.mjs`, `hints-check all`) catch these.
- **Speed.** The case loads on the main thread (about 5 s blank); weighing all six theories at the end of an Easy
  game takes about 30 s; a reload at the end about 12 s; reading where new clashes arrive (¶101→102) 7–20 s; some
  `conclude` calls exceed the 20 s budget. The world's ties join the night's events into large search components
  (397 slots in one at the end).
- **Wording.** Entity names keep their capitals mid-sentence ("Look for A box of vestas"); a step resting on
  several inferences is quoted in full.
- **The LLM leak checker over-flags.** It reads the reader's own inferences as untold facts (22 accepted flags on
  typed notes) and real-world glosses as claims (about 20 on card texts).
- **Case data left unfinished.** Seven inferences are asserted rather than verified (`k.straker_home_all_evening`,
  `k.window_drugging_time`, `k.operation_in_the_open`, `k.simpson_purpose`, `k.paper_held_opium_means_nobbling`,
  `k.track_man_changed_his_mind`, `k.found_at_dawn`). Four older slots act like states but were never moved onto
  state tracks (`silver_blaze.hidden_at`, `silver_blaze.disguised`, `simpson.wounded`, `simpson.out_in_storm`).
  Some cards are quoted from a later line than where they first appear (the report lists them). Two event orders
  stay open (Edith at the window before the tip; Brown's morning). About twenty people and animals have no
  establishment in the story. Some inferences may still repeat a rule application, a leftover from when premises
  had to be flat.
- **Exceptions and moves that never score.** The "sound sleepers" exception has no formula, so it is always open;
  `t56.1` has no Holmes paragraph; `t68.3`'s "two stories" drop doubts an inference.
- **Validation gaps.** The validator errors when a theory that should fail survives, but never checks that a true
  theory survives; the schema's `pattern` field is unused; the schema does not cover `thoughts.json` or
  `mentions.json`. `conclude` and `prove` have no time budget (only `concludeFrom` has), and the test suite slows
  with each wide constraint.
- **Annotation slips left as they are.** `t35.7`, `t35.10`, `t40.3`, `t64.2` (their move comes after their date);
  `t124.2` cites `t123.2`, whose inference is not among its premises.

## 5. Lessons of method

- **Play the real page.** Saves built in node never meet the page's defects: on Hard no inference with a background
  premise could be built at all, inferences resting on another inference had no Connect button, and a settled
  question hid the player's other answers. Only full playthroughs in headless Chrome found these.
- **Diff the engine's maximum against the annotated player.** Every disagreement was a defect in the engine, the
  case or the annotation.
- **Check every difficulty.** Hints were checked on Hard only, and Easy and Medium broke.
- **A score rule needs a check that its reasoning holds.** Drops scored whatever their reason, and a check sealed
  expecting both results scored either way, until both were closed.
- **Planned signals often fail to discriminate.** "Fits" said nothing (every rival story contradicts some false
  testimony at once, and the true story reads broken), so theories are weighed by cost. Hints timed by reader
  profiles landed a median of 132 paragraphs before Holmes. Honest hints come from the story's own signals.
- **Card text leaks.** Early rule texts spelled out the solution's step; show only the general fact and keep the
  binding in the schema. Granted inferences must wait for the cards they speak of. Read the reveal and foreshadow
  logs in full.
- **Logic traps.** A cell means its whole time window, so a thing that moves inside it makes a proof vacuous; a
  clash sets aside every story clue in it, so an extra plausible claim can knock out a true one; a rule compared
  against a slot expanded over every person makes every person "needed".
- **Solver.** Branching order matters as much as anything (urgent slot first); push negations inward; profile
  before optimising.
- **The LLM leak checker** needs a prompt per kind of text, and rules written as presumptions ("commonly taken
  to…").
- **Process.** Wait on the test's exit code before committing; timings on a loaded machine mislead; the site build
  must follow `import()`, CSS `url()` and data files, so check through the built site.
