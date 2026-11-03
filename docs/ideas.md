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
  Open: what a false lead's result says before the story drops it (a flat "nothing" for the maid at ¶37 tells more
  than the story does until ¶92; *nothing yet* until the story drops it is one answer).
- **As many leads as possible**, the story's false ones among them (police, Gregory, Hunter, Mrs. Straker, Ross, the
  papers), each proposed only once the player holds what it rests on, some only after an inference is built; new
  inferences so that the true leads are earned by reasoning. Of the 8 unscored NOTICE rows only t40.5 (one blow,
  against "repeated blows") reads as a lead; t20.5, t82.4 and t100.1 are better premises of a proposing inference,
  t57.2 and t116.2 are the story proposing a lead itself, t218.3 and t220.3 commentary.
- **A panel of its own**: the Leads tab. Under *Taken up by Holmes* each lead shows the story's answer once it is
  given (`answer`, with its quotes), *Answer pending* until then.
- **To look into later** (the user, 2026-11-03): how leads relate to the Questions mechanic (the case's questions and
  their answers).
- **No backward-compatible saves** (there are no players): the save version is checked, a save of another version
  dropped, and the migration code removed.

Measured after step 1 (seeds 1–3 to 70): the lead search takes 18 checks a game for its 8 rows (the 1,200–1,550 of
the card search gone), 18,718, 17,544 and 18,053 checks in all (were 18,522, 18,648 and 22,324: the other searches
move with the shuffle). Steps 1–2 have only the 8 scored leads, so the tab is an answer key for now; the false leads and the timer come next. A first catalogue of candidates (72 leads, 36 true, 31 false, 5 ambiguous; 11 new inferences drafted)
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
