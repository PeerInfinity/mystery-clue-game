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
  difficulty (57 hints, 228 presses on Hard). Only the cooldown costs anything.
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

### An incremental game about trying every combination

Embrace the absurdity: the combination-trying the game forces on the player becomes the game. The player
automates the search (try every pairing of these cards, every answer to that question) and the main mechanic is
deciding where to look first: which cards, questions or scenes to point the search at. The engine already checks
any proposed move cheaply (`checkStep`, `propose`, `concludeFrom`), the action tables and `hints.json` list every
scoring move with what it needs, and the statistics give the size of each search space.

**Decided so far (2026-11-02; nothing built).**

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
non-expert deductions, so incremental mode needs gates on all 70 rows and the expiry points; and the minimal
playthrough at the 'wait' pace stops at ¶146 (section 4), which a mandatory maximum turns into a blocker, so it
comes first. A gate on every row tells the player that something scores before ¶N; the 'wait' pace already
accepts that for deductions, and the search would find the row anyway.

**Settings proposed (to be decided).** Kept apart from the difficulty presets, as the reader option is:

- **The routes to a deduction**: builds only (proven enough: the minimal playthrough reaches 70 with no cross-out or
  proof), or builds and answers (a second, often cheaper way to a one-answer deduction, steered by circles and
  cross-outs). Not answers only: steps concluding a formula probably cannot be reached that way.
- **The strength of the feedback**: the whole combination only, pairs, or each part apart. It sets how far a
  product collapses, so it sets the pace more than anything else.
- **Stale negatives**: (a) or (c), a cost only; never (b).

Each setting multiplies the runs of the page checks (12–13 minutes each; "check every difficulty"), so start with
the feedback strength and the routes, and add more only when play shows the need.

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
- **The engine's hint-only player takes 57 hints to reach 70, the page's 69**; the gap was never looked into.
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
