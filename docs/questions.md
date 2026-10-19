# The player's own questions (QUESTION)

Status: **AGREED** (Robert, 2026-10-18, Round 151: every recommendation of Q1–Q6, (d) of Q2, and the order of
work), **built** (Rounds 152–155; see "At build time" at the end). Mission:
`docs/kickoff-questions.md`. Builds on `docs/gap-analysis.md` (§2, QUESTION and HYPOTHESIS; §6 decision 2, what
scores), Rounds 4–11 (the reading layer; questions shown only once raised), 32 (every step of the annotation playable),
33–34 (the sheep's cause before its culprit), `docs/noticing-absence.md` (the notice, whose shape this paper borrows),
`docs/ui.md` Q7 and `docs/review-ws9.md` (QUESTION, the one tag not playable).

## The reader's process

The annotation's reader names a blank before the story names it, and the naming is what makes the next moves
possible. Ten thoughts are QUESTIONs:

| Thought | ¶ | Profile | The reader asks |
|---|---|---|---|
| `t14.2` | 14 | typical | Where can a famous horse be hidden for days? |
| `t20.7` ·opportunity | 20 | careful | Who handles the dish between the kitchen and the lad? |
| `t25.1` ·opportunity | 25 | careful | Where was the dish during the window scene? |
| `t31.4` ·opportunity | 31 | careful | Who has a key: {Hunter, the trainer, anyone with a copy}? |
| `t46.5` ·motive | 46 | careful | If Straker, why? |
| `t46.6` | 46 | careful | If Straker, what killed him: {Simpson, someone else, the horse}? |
| `t57.3` ·turn-around | 57 | expert | Turned round: what needed doing *away from* the stable? |
| `t92.8` | 92 | careful | Who drugged the dish: Straker or his wife? |
| `t108.2` | 108 | careful | How did the horse leave the hollow without tracks? |
| `t120.3` | 120 | typical | Who is the man? |

What the reader does with a question:
- **Holds it open,** often with candidates already in it (`t31.4`, `t46.6`, `t92.8`): a QUESTION is usually the head
  of a HYPOTHESIS (`t14.2` → `t14.3`, `t31.4` → `t46.4`).
- **Reads on with it in mind:** the next details are sorted by whether they bear on it (`t25.1`: "The police theory
  depends on the answer"). That is also what a re-read with a question is for (Round 138).
- **Turns it round** when it is stuck (`t57.3`): "why take the horse out?" becomes "what could not be done at the
  stable?", which waits for the knife and the candle.
- **Never learns from asking.** A question asked is not a fact found. The story does not answer because the reader
  asked, and the reader cannot tell from asking whether the question matters.

The last point is the constraint on everything below. The reading layer is sacred (Rounds 4–9): a game that responds
differently to a question the case turns on than to one it does not would tell the player where the case turns.

## What exists

- **Questions are slots** (921 in the model). A slot shows only once the story raises it (`Game.slotVisible`,
  `engine/game.js:1672`). It shows when:
  - it is an event's own who, what, where or when, with the event;
  - it is an identity question (with its placeholder) or a truth question (once the player doubts the claim);
  - a held clue or inference speaks of it;
  - it is one of the 14 case questions (`case.json` `questions`) and the story has reached its quote;
  - Holmes reaches a gate that settles it.

  Declared questions (why was it done?) wait until one of these raises them. Round 4 made that rule so that the list
  of questions would not tell the player what matters.
- **Answers on offer** are gated by `offered()`: held cards only, and labelled values only after their `reveal` quote.
  Both gates assume the slot is shown no earlier than it is raised; that assumption is why some labels carry no
  `reveal` (see Measured §3).
- **Where a question lives in the UI** (checked in headless Chrome at ¶46, Easy):
  - a card's "Open questions (N of M)", with its chips (pencil, circle, cross out, prove);
  - Questions › "The questions the case turns on, as the story raises them";
  - the re-read form's "with the question" list, which offers only the raised case questions (seven at ¶46),
    not held cards.
- **The precedent: the notice** (workstream 5). "That's odd" works on any held card, checks nothing and tells nothing.
  It is matched quietly against the annotation's list (`notices`) and scored only at Holmes's paragraph
  (`noticeScores`). The game's response is the same whether the detail matters or not, which is exactly the property a
  question needs.
- **Scoring:** decision 2 scores deductions and sealed predictions made before Holmes; notices by later use, shown at
  Holmes's paragraph since Round 146. It says nothing of questions. Only one of the ten QUESTION thoughts has a
  Holmes date (`t57.3`, ¶223).

## Measured

Scratch scripts in this session's scratchpad (`measure.mjs`, `raisers.mjs`, `eager.mjs`); Easy, background
"relevant"; the **passive** reader reads on and does nothing else; the **builder** builds every inference it can at
every paragraph (as Round 145's replay).

### 1. When the reader asks, against when the game opens the question

| Thought | Asked | The slot it would be | Card held | Open today: passive | builder | Raised by |
|---|---|---|---|---|---|---|
| `t14.2` | ¶14 | `silver_blaze.hidden_at` (q.where_horse) | ¶4 | ¶37 | ¶19 | passive: the case question's quote ("no news has come of him"); builder: `k.at_a_stable_in_reach` |
| `t20.7` | ¶20 | none. Nearest is `e.opium_added.agent` (q.who_drugged), but the drugging is not yet told | ¶36 | ¶36 | ¶29 | the drugging's card (Hunter's claim; `k.window_drugging_time` for the builder) |
| `t25.1` | ¶25 | none (where the dish was: no state of the dish). Nearest `e.opium_added.place` | ¶36 | ¶36 | ¶29 | as above |
| `t31.4` | ¶31 | none: no slot says who holds the stable key (`stable_key`, held at ¶31, has no owner slot) | — | — | — | — |
| `t46.5` | ¶46 | `straker.motive` (q.motive) | ¶4 | **¶214** | ¶92 | passive: the case question's quote ("entirely unworthy of your confidence"); builder: `k.second_household` |
| `t46.6` | ¶46 | `e.fatal_blow.agent` (q.who_killed) | ¶35 | ¶35 | ¶35 | the blow's own facet |
| `t57.3` | ¶57 | none as a slot: it maps to an inference, `k.operation_in_the_open` (Holmes ¶223). Its unturned form is `e.horse_led_out.purpose` | ¶4 | ¶46 | ¶37 | the lads' hope (`c.hoped_early_exercise`) with the police theory |
| `t92.8` | ¶92 | `e.opium_added.agent` (q.who_drugged) | ¶36 | ¶36 | ¶29 | as `t20.7` |
| `t108.2` | ¶108 | none ("how" has no facet). The event that answers it, `e.horse_bolts`, is dealt at ¶117 | ¶117 | ¶117 | ¶117 | the event's own facets |
| `t120.3` | ¶120 | `track_man.identity` | ¶119 | ¶119 | ¶119 | identity, with the placeholder |

In short:
- **Already open when asked: 3** (`t46.6`, `t92.8`, `t120.3`). The game's question is there; the player has nothing
  to add but the asking.
- **A slot the story opens later: 2.**
  - `t14.2`: 23 paragraphs early for the passive reader, 5 for the builder.
  - `t46.5`: 168 paragraphs early for the passive reader, 46 for the builder.
- **No slot: 5** (`t20.7`, `t25.1`, `t31.4`, `t57.3`, `t108.2`). Two of them (`t20.7`, `t25.1`) sit near the
  drugging's slots, but that event is not yet held when they are asked: opening its slot would announce the drugging
  (¶29–¶36) before the story does.

So "a player question that matches an authored slot opens it early" (§2) would act on **two of the ten**.

### 2. What a template over held cards would offer

A template is an interrogative and one or two held cards, nothing else: "Where is {thing}?", "Who had {thing}?",
"Why did {event} happen?", "Who could reach {thing} {when}?". At the thoughts' paragraphs the held cards are:

| ¶ | people | places | objects | events |
|---|---|---|---|---|
| 14 | 7 | 7 | 6 | 4 |
| 31 | 13 | 15 | 18 | 25 |
| 46 | 14 | 20 | 28 | 58 |
| 92 | 20 | 34 | 43 | 73–76 |
| 120 | 21 | 37 | 49 | 77–80 |

**The dropdowns themselves cannot leak.** Every choice is a card already dealt, named as the story names it
(`nameOf`), and the interrogatives are fixed words. Each of the ten can be phrased with what is held at its
paragraph:
- `t14.2`: Where is {Silver Blaze}? (held from ¶4, named at ¶10)
- `t20.7`: Who could reach {the curried mutton}? (¶20)
- `t25.1`: Where was {the curried mutton} during {Frightened, Edith runs past him to the stable window}?
- `t31.4`: Who had {the stable door's lock}? (¶31)
- `t46.5`: Why would {Straker} do it?
- `t46.6`: Who killed {Straker}?
- `t57.3`: What could not be done at {the stable}?
- `t92.8`: Who drugged {the supper}?
- `t108.2`: How did {Silver Blaze} leave {the hollow}?
- `t120.3`: Who is {The man whose track appears beside the horse's}?

**What leaks is the response.** At ¶46 the passive reader holds 58 events; five events in the whole case carry a
declared "why" (the horse led out, the knife, the coat, the light, the blow) and one a "what caused it" (the sheep's
lameness). If "Why did {event} happen?" opened a slot for those and a bare note for the rest, the template would be a
detector for what the case turns on: exactly the list Round 4 took away. The same holds for "Whose is {thing}?" (11
objects have an owner slot, among them the knife, the candle, the vestas and the boots, against 49 objects held at
¶120) and "Why would {person} do it?" (of 21 people, Straker alone has a motive slot and Simpson a purpose).

### 3. What a slot shows if it opens as soon as its card is held

`eager.mjs` lists, for every slot, its prompt and its labelled answers at the paragraph its card is first held, before
the story raises it, with the words the story has not yet used. This is what any "open it early" design has to pass.
Facets with card-name answers only (who, where, when) are clean, since their answers are held cards. The declared
ones are not:

| Slot | Card held | Shown early | Leak |
|---|---|---|---|
| `straker.motive` | ¶4 | "What drove the trainer to it?" with "Debts run up by the woman of his second household" | **the prompt presumes his guilt; the answer names the second household** (the bill ¶84–¶92; Holmes tells it at ¶220–¶225) |
| `straker.honest` | ¶4 | "Was the trainer an honest servant?" | the prompt casts doubt where the story praises him (¶19) |
| `e.coat_off.purpose` | ¶35 | "To have his arms free for some work" | Holmes's answer, on offer with the body |
| `e.light_struck.purpose` | ¶102 | "To see to some close work" | Holmes's answer, on offer with the match |
| `simpson.purpose` | ¶14 | "Seeking information to bet on" | mild: his own later account (¶39) |
| 19 owner slots | — | "Who owns Bayard?", "Whose are the vestas?" | the list of which objects have an owner is itself the signal |
| 101 state and 82 order slots | ¶4 on | "What was the trainer trying to do? (Tuesday, after 1 a.m. — at the stable)", "Did it happen before or after the horse is led towards King's Pyland, then turned back?" | **these prompts carry window labels and event descriptions written for later**: never safe to open on demand |

The answer labels without a `reveal` are not authoring errors: they were safe because the slot could not show before
the story raised it. An early-opening design would need a `reveal` on every such label (`straker.motive` gets one at
¶84 or later, which leaves "Something else, or nothing" alone on offer at ¶46), neutral prompts, and the internal
state and order slots kept out of the vocabulary altogether.

### 4. Whether a question should score

- **Nothing in a question is right or wrong.** A deduction scores because the engine checks it; a check scores because
  Holmes performs it; a notice scores because Holmes draws attention to the same detail. A question has no content to
  check, only a match against an authored slot.
- **It can be spammed** at no cost: every template over every held card. Notices share this weakness, and decision 2's
  answer for them was "by later use, in aggregate". A question would be "asked before the story asked it" for any
  player who asks everything.
- **A deadline exists** for the two thoughts that match a later slot: the paragraph the story raises it (¶37 for
  `t14.2`, ¶214 for `t46.5`). The builder's own inferences raise them earlier (¶19, ¶92). That is the player raising
  it by reasoning, and it would count as asked then. Holmes dates the thoughts in only one case (`t57.3`, ¶223, not a
  slot).

## Questions, alternatives, recommendations

### Q1. What is a player's question?

- **(a) A slot opened early.** The gap analysis's reading. It acts on two of the ten thoughts (Measured §1), needs every
  declared slot's prompt and labels made safe for any paragraph after its card (§3), and leaks by its response unless
  every template also opens something (§2). Not recommended.
- **(b) A "?" card the player holds (recommended).** `ask(template, cards)` makes a question card of the player's
  own, kept like a notice:
  - it sits on the card or cards it names, under "Your questions" on each and in the Questions tab;
  - the player may put candidates on it from held cards, pencilled and circled like a slot's but checked by nothing;
  - it is **matched quietly** to a slot when its template and cards map to one (Q2), and nothing in the UI shows
    whether it is matched.

  When the story (or the player's own inference) raises the matched slot, the question **joins** it:
  - the player's candidates carry over as pencil and circles;
  - the reading bar says "The story asks here: Where is Silver Blaze? You asked it at paragraph 14";
  - the "?" card now opens the real question.

  An unmatched question stays the player's note for the rest of the game. Before the join, matched and unmatched
  questions look identical.
- **(c) A note with no logic.** Free text pinned to a card. Safe, but it can never join the story's question, never
  carry candidates over and never be recorded. It is (b) without the match.

### Q2. The vocabulary

- **(a) Templates over held cards (recommended).** A small fixed set, each an interrogative and one or two held cards
  of the right kinds; dropdowns list only held cards, named by `nameOf`:

  | Template | Over | Matches (when one exists) |
  |---|---|---|
  | Who {did} {event}? / Where…? / When…? | an event | the event's agent, place, time |
  | Why {event}? | an event | its declared purpose (or cause) |
  | Where is {thing}? | a person, animal or object | its whereabouts |
  | Whose is {thing}? / Who had {thing}? | an object | its owner |
  | Who is {placeholder}? | a person or animal | its identity |
  | Why would {person} do it? | a person | their motive |
  | Who could reach {thing} {when}? | an object, and a time or event | nothing (opportunity) |
  | How did {thing} {get} to/from {place}? | a thing and a place | nothing (manner) |
  | What could not be done at {place}? | a place | nothing (·turn-around, Q4) |

  The matching table lives in the engine, never in the UI. State, order, truth and relation slots are never matched:
  their prompts are not safe (§3), and the truth questions already have the doubt.
- **(b) Free text,** matched by nothing or by an LLM. Nothing parses the text in the first case, so it is (Q1c); the
  second costs money per question and its answer is a response that can leak. Listed.
- **(c) A list of questions to pick from.** Any list drawn from the case's slots is the list Round 4 removed.
  Rejected.
- **(d) Moving case questions earlier where the story itself asks them** (complementary, authoring only). `t14.2` is a
  typical reader's question, and ¶14 reads "I could not believe it possible that the most remarkable horse in England
  could long remain concealed". The case question "Where is {silver_blaze}?" could be anchored there instead of ¶37,
  which is the story raising it, not the player. It is a reading of the text, so it is for Robert. Recommended only for
  `t14.2`. No other QUESTION thought is the story's own question.

### Q3. What a question does

Recommended, with Q1 (b):
- **The re-read form** takes the player's questions beside the raised case questions. Today it offers only the
  latter (seven at ¶46), though `questionName` already reads a held card. This is the thought's own use: read on, or
  back, with it in mind.
- **Candidates** on the question, the player's own HYPOTHESIS, carried over at the join.
- **The join** at the raise, with the bar's note.
- **Nothing early.** No answers offered by the game, no "ruled out by your clues", no "Could it fit?", no greying
  before the join. Any of them would tell the player that the case models the question.
- **Not the Checks tab or the theories.** A check is already a plan with its own templates; a theory's answers are
  slots. Listed.

### Q4. ·turn-around (`t57.3`)

- **(a) A template pair:** "Why {event} at {place}?" offered beside its turn, "What could not be done at {place}?".
  The turned question matches nothing; its content is an inference (`k.operation_in_the_open`, Holmes ¶223) that the
  player can already build or state ("Or state it yourself"). The pair adds one template.
- **(b) Out of scope (recommended).** The turned question is in Q2's table as an ordinary template, a note that
  matches nothing; the move it leads to is an inference the game already scores. A "turn this question round" link
  would itself be a hint that the question is stuck. `t57.3` is the only thought of its subtype, and expert.

### Q5. Scoring

- **(a) None.**
- **(b) The record only (recommended).** At the raise, the bar's note ("You asked it at paragraph 14") and a line in
  *Your record against Holmes*, under a new heading "Questions you asked before the story", not counted in "Ahead of
  Holmes" and never in a family's possible. As with genre moves (decision 2), it is shown, not scored, because a
  question can be asked of everything at no cost (§4).
- **(c) Scored like a notice,** before the story raises the matched slot, in aggregate. It rewards asking everything;
  notices accepted that weakness (`docs/noticing-absence.md`). Listed, if Robert prefers parity with notices.

In every case nothing is shown before the raise, and Trivial records nothing.

### Q6. The presets

The move is the player's own and costs nothing, so it is offered on every difficulty but Trivial (where the game
works the case out). Hard collects by clicking: a question needs its cards held, as now. No new option.

## The cases as tests

| Case | Setting | Expected |
|---|---|---|
| Ask, matched | Easy, passive, ¶14: "Where is {Silver Blaze}?" | a "?" on Silver Blaze's card and in Questions › Your questions; no answers offered; nothing says it matches |
| Ask, unmatched | Easy, ¶31: "Who had {the stable door's lock}?" | the same display as above, the same buttons |
| Candidates | ¶31: Hunter, the trainer, a duplicate key (¶46) put on the question | pencilled; no greying, no "ruled out", no "Could it fit?" |
| The join | the ¶14 question, read to ¶37 | the bar: "The story asks here: Where is Silver Blaze? You asked it at paragraph 14"; the slot's pencil holds the player's candidates; the record lists it |
| Join by reasoning | builder, ¶14 question, `k.at_a_stable_in_reach` built at ¶19 | joins at ¶19 |
| The long lead | ¶46: "Why would {Straker} do it?" | nothing until the slot is raised (¶214 passive, ¶92 builder); then the join; "Debts run up by…" never shown before the slot is raised |
| Already open | ¶46: "Who killed {Straker}?" | the "?" opens the existing question at once (it is visible, so nothing leaks) |
| No event, no template | ¶20 | no template names the drugging (its card is not held); "Who could reach {the curried mutton}?" is offered |
| Re-read | ¶46, re-read ¶20–¶30 with the player's question | listed in the form; the bar names it |
| Spam | ask every template over every held card at ¶46 | the record counts asked questions only at their raises; no family's score moves |
| Trivial | any | no "Ask…"; nothing recorded |
| Leak logs | all | the reveal and foreshadow logs, the clash log, both reports and the gate listing unchanged: the move adds no card text and changes no slot's visibility for a player who does not ask |

## Order of work (if agreed)

1. **The engine:** `Game.ask(template, cards)`, `unask`, the player's candidates on a question, saved and loaded; the
   matching table (Q2); `joinedAt` when the matched slot is raised, carrying the candidates into the pencil; the
   thoughts crosswalk (`asks` on QUESTION thoughts, like `notices`) so `validate-thoughts` reports which thoughts the
   templates can express. Tests from the cases.
2. **The UI:** "Ask…" on a card (a template list for the card's kind, a second dropdown where the template needs one),
   "Your questions" on the card and in the Questions tab, candidates as chips, the re-read form taking them, the bar's
   note at the join. Checked in headless Chrome at ¶14, ¶31, ¶37 and ¶46.
3. **The record** (Q5): the "Questions you asked before the story" heading. `docs/review-ws9.md`'s QUESTION row
   revisited.
4. **If agreed (Q2 d):** the case question q.where_horse anchored at ¶14. A case-data change: the reveal log moves
   (the question at ¶14 instead of ¶37), and the gate listing and both reports are diffed.

Each step is one commit with a Round entry, gated on `npm test`; the logs, the reports and the gate listing diffed
before and after. The templates are fixed words around card names, so the LLM checker is not run on them; the Round
entry says so.

## For Robert

1. **Q1:** a player's question is a "?" card they hold, matched quietly to a slot, joining it only when the story or
   their own reasoning raises it, rather than opening the slot early?
2. **Q2:** a fixed set of templates over held cards, matched in the engine, never to state, order, truth or relation
   slots? And (d): anchor "Where is Silver Blaze?" at ¶14, where the story itself asks it?
3. **Q3:** the question feeds the re-read form and carries the player's candidates; nothing before the join; not the
   Checks tab or the theories?
4. **Q4:** ·turn-around as one ordinary template, without a pair?
5. **Q5:** the record only (shown at the raise, never counted), or scored like a notice?
6. **The order of work** above?

## Agreed (Robert, Round 151)

Every recommendation as written: a player's question is a "?" card they hold, matched quietly and joining the story's
question when it is raised (Q1 b); templates over held cards, matched in the engine, never to state, order, truth or
relation slots, and the case question "Where is Silver Blaze?" anchored at ¶14 (Q2 a, d); the re-read form and the
player's candidates, nothing before the join (Q3); ·turn-around as one ordinary template (Q4 b); the record only, never
counted (Q5 b); every difficulty but Trivial (Q6); the order of work.

**At build time (Rounds 152–155):**
- **The move is `Game.pose`** (`Game.ask` is background asking). Thirteen templates; the article of an entity's name is
  lowered as `phrase` does ("Who could get at the curried mutton?").
- **The join is checked before and after each paragraph and on every listing,** so a question raised by the player's
  own inference joins at the paragraph they made it (the builder's "Why did “The favourite disappears” happen?" at
  ¶37, the passive reader's at ¶46).
- **The re-read form** lists a joined question once (the story's own wording).
- **With "Where is Silver Blaze?" anchored at ¶14 (step 4),** `t14.2` is asked with the story and no longer recorded;
  of the ten thoughts only `t46.5` joins later than asked (¶214 for a reader who only reads on). The tests' late join
  became "Whose is the heavy stick?" (asked at ¶21, raised at ¶40).
