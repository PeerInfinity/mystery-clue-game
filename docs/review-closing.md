# The closing review: the whole game against the annotation, thought by thought

Status: **written** 2026-10-19 (Rounds 157–164), for discussion with Robert. Mission: `docs/kickoff-closing-review.md`,
piece 1. It follows the shape of `docs/annotation-review.md` (a verdict per thought) and of `docs/review-ws9.md` (the
UI), and adds what neither had: every thought's move made **in the UI, on Hard**, in one game from the first
paragraph to the last, and the maximum score that game reaches.

## How it was measured

Three scratch scripts (in the session's scratchpad):
- **`hard.mjs`, the engine's maximum.** A Hard game in node that clicks every marked span, asks "What do I know about
  this?" of every card, builds everything buildable, and makes every scored move at the earliest paragraph the engine
  accepts it.
- **`table.mjs`, the annotation's player and its action table.** A Hard game in node that makes each thought's own move
  at the thought's paragraph (retried each paragraph until it holds), from what `thoughts.json` says the thought holds
  (`maps`, `inference`, `notices`, `raises`, `checks`, `dropped`, `asks`, `passage`) and a few script rules (below).
  Each move is logged as the engine call it is and as the UI makes it: the tab, the card opened, the buttons and the
  fields. That log is **the action table** (the autoplay's script). The player's clicks on the story collect every
  card the clicked words carry, as the UI does.
- **`ui-run.mjs`, the action table played through the UI.** Headless Chrome, a fresh game set to Hard in the settings,
  "Next paragraph" until each move's paragraph, then the move's clicks and fields; after each move the saved game is
  read to check that the engine took it. At the end, the record against Holmes.

Robert's standard (Round 157): if everything works as intended, the engine's maximum and the annotation's player
reach the same score. Every difference was a defect of the engine, the case, the annotation or the UI, and each was
fixed (Rounds 157–164) before the review went on.

**The script's own rules** (what the annotation does not say, and the table had to decide):
- A careful Hard player asks "What do I know about this?" of each card they collect. Without it, four of Holmes's main
  steps cannot be made on Hard: their implicit inferences need background facts no thought names (Round 162).
- The five SET ASIDE thoughts name no card; the table uses the cards `docs/review-ws8.md` checked (the field-glass,
  the telegraph posts, the new dress, the half-crown, Bayard).
- The candidates a hypothesis puts on a question (`t14.3` where the horse is, `t24.3` the paper, `t35.9` the coat,
  `t37.9`–`t37.13` the drugger and the blow, `t81.3` the knife, `t84.4` Derbyshire, `t102.3` the match, `t127.4` the
  track's man, `t141.1` the disguise), proposed once the question is raised and the answer on offer.
- `t92.6` (the inside story) is a theory the player writes at ¶92 with the answers the UI lets them add there (7 of
  the 13 of `engine/hypotheses.test.js`'s fixture; the other six are questions not yet raised, answers not yet on
  offer, or a question a clue already settles). `t163.3`'s check asks Edith about the curried mutton; `t46.3` weighs
  the police theory; `t35.6` splits the papers' statement (its parts cannot be doubted; the split files them as the
  police's reasoning).

## The Hard maximum

**70 ahead of Holmes**, the same for the engine's maximum, the annotation's player in node, and the action table played
through the UI (395 moves, none failed, no console error; about 13 minutes on the shared machine, with no typing):

| Family | Ahead of Holmes | Possible | The rows no player can score |
|---|---|---|---|
| Deductions | 45 | 47 | `t127.4` (the track's man is Brown): the square toes are disclosed at Holmes's own paragraph (¶146), a fair-play gap the annotation records; `t36.2` (Hunter could not have seen the drugging): its background fact is offered only at ¶218, Holmes's paragraph, by its `date_note` |
| Odd details (notices) | 8 | 8 | — |
| Steps seen through (raises) | 3 | 3 | — |
| Wrong turns dropped | 3 | 3 | — |
| Checks planned | 10 | 10 | — |
| What did not happen | 1 | 1 | — |

Before this review the numbers were 41 of 47 deductions for the engine on Hard (Round 143 measured the same on Easy),
63 for the annotation's player, and through the UI on Hard almost nothing: no inference with a background premise
could be built at all.

## Defects found, and fixed

| | What | Where | Round |
|---|---|---|---|
| a | On Hard (background connected) no inference with a background premise could be built: no control opened a background fact's card. 34 of the 39 inferences behind Holmes's dated steps | UI | 157 |
| b | `conclusionKinds` threw on a relation term: on Hard, connecting the curry's last card said "Something went wrong" | engine | 158 |
| c | Four of Holmes's main steps (`t46.4`, `t81.5`, `t173.2`, `t220.3`) never scored on any difficulty: each needs an implicit inference, which never counted as the player's | engine | 159 |
| d | Three thoughts dated a paragraph after their move is possible (`t81.2` → `t80.2`, `t96.1` → `t95.2`, `t189.1` → `t188.2`) | annotation | 160 |
| e | A reload lost "you built this": an inference a character states later came back as his, so a step made after the reload could not count | engine | 161 |
| f | The annotation did not record Mrs. Straker waking at seven, a premise of the four steps' implicit inferences | annotation | 162 |
| g | An inference resting on another inference (or an event) could not be built: no "Connect to this" on those cards. 18 of 58 inferences | UI | 163 |
| h | The papers' "defended himself against his assailants" could not be split | UI | 163 |
| j | "New theory" failed in every browser since Round 139 (a local `prompt` shadowed the browser's) | UI | 163 |
| i | A question settled by a clue hid the player's other answers, so the paper's wrong turn could not be dropped | UI | 164 |
| k | A drop "because of a card" could cite only the question's own card | UI | 164 |

What they have in common: the checks of Rounds 143–156 used saves built in node, which call the engine directly. The
engine was right about what a player could do; the UI did not let the player do it. Playing the whole game through the
UI found (a), (g), (h), (i), (j) and (k) in two days of runs; no node test could have.

## Totals per tag

Verdicts:
- **scores**: the thought's move is made in the UI on Hard and scores, shown at Holmes's paragraph;
- **played**: its move is made in the UI on Hard (unscored by decision 2, or with no Holmes date);
- **played, by an earlier thought**: the same move was made already (the same card, inference or theory);
- **played, not ahead**: made, but no earlier than Holmes (`t127.4`);
- **held otherwise**: nothing to do but read, or held by another move (a card, a theory's residue, the readings);
- **a confirmation**: a TEST the story settles; the record shows the player's earlier move at Holmes's paragraph;
- **Easy and Trivial only**: the ten watch-holmes thoughts (Holmes's interest is shown with hints "story"; Hard shows no
  signals);
- **playable, not scripted**: a move the UI offers that the table leaves out (no score turns on it);
- **not held**: no mechanic, by an agreed paper, with the reason in the row.

| Tag | scores | played | played, by an earlier thought | played, not ahead | held otherwise | a confirmation | Easy and Trivial only | playable, not scripted | not held | all |
|---|---|---|---|---|---|---|---|---|---|---|
| RECORD | · | 72 | 1 | · | 19 | · | · | · | 2 | 94 |
| DEFAULT | 7 | 1 | · | · | · | · | · | · | · | 8 |
| GENRE | · | 2 | · | · | 3 | · | 10 | · | 5 | 20 |
| SET ASIDE | · | 5 | · | · | · | · | · | · | 2 | 7 |
| QUESTION | · | 10 | · | · | · | · | · | · | · | 10 |
| HYPOTHESIS | 4 | 14 | 4 | 1 | 2 | · | · | 1 | 1 | 27 |
| NOTICE | 9 | 4 | · | · | 1 | · | · | · | 2 | 16 |
| WEIGH | 2 | 7 | 5 | · | 2 | · | · | · | 3 | 19 |
| INFER | 19 | 5 | · | · | · | · | · | · | · | 24 |
| ABSENCE | 1 | 1 | · | · | 2 | · | · | · | 2 | 6 |
| AGENT | 4 | 3 | · | · | · | · | · | · | 1 | 8 |
| PREDICT | 6 | · | · | · | 1 | · | · | · | 1 | 8 |
| SOURCE | · | 2 | · | · | · | · | · | · | · | 2 |
| REVISE | 1 | · | · | · | 3 | · | · | · | · | 4 |
| TEST | 5 | 3 | 2 | · | 2 | 17 | · | · | 1 | 30 |
| RESIDUE | · | 1 | · | · | · | · | · | · | · | 1 |
| DROP | 3 | · | · | · | · | · | · | 1 | · | 4 |
| IDENTIFY | 2 | 1 | · | · | · | · | · | · | · | 3 |
| TEST PLAN | 4 | · | · | · | · | · | · | · | · | 4 |
| PHYSICAL | 1 | · | · | · | · | · | · | · | · | 1 |
| **all** | **68** | **131** | **12** | **1** | **35** | **17** | **10** | **2** | **20** | **296** |

68 thoughts score; they make 70 rows, since a thought can score in two families (`t36.2`'s raise scores, its
deduction cannot; `t92.11`'s seal counts for `t116.3` too).

## Thoughts whose move comes after their paragraph

Eleven thoughts can make their move on Hard only later than their date. None changes the maximum.

| Thought | Its ¶ | Move possible | Why |
|---|---|---|---|
| `t4.2` | 4 | 35 | the one-culprit default speaks of the blow, told at ¶35 (its `date_note`, Round 111) |
| `t36.2` | 36 | 218 | its background fact is stated only at ¶218 (its `date_note`); its raise against the police's reading scores at ¶40 |
| `t35.9` | 35 | 97 | why the coat came off is a declared question, raised only when a held inference speaks of it (Round 4) |
| `t102.3` | 102 | 224 | the same for why the match was struck: raised at the Colonel's ¶224 |
| `t35.7`, `t35.10` | 35 | 41, 60 | the hypotheses map inferences that are later thoughts' (`k.only_one_blade`, `t44.2`; `k.cravat_order`, `t60.4`); the sets themselves are open from ¶35 |
| `t40.3` | 40 | 66 | maps `c.mapleton_interest`, quoted from ¶66; ¶40 tells of Desborough in Simpson's notes |
| `t64.2`, `t64.3` | 64 | 66 | rest on `c.mapleton_searched_nothing` (¶66); ¶64 searched "every stable … for a radius of ten miles" (`c.stables_within_ten_miles`) |
| `t34.5` | 34 | 35 | its inference rests on `k.entrant_took_the_horse`, whose premises reach ¶35 |
| `t56.1` | 56 | 60 | its second raise is against the police's "his stick killed him", which needs Simpson's cravat owned (¶60) |

The first four are by design. The other seven are small annotation slips of map or date, left for Robert.

## The action table

`table.mjs` writes it as JSON, one row per thought: `{id, para, tag, profile, holmes, moves: [{seq, at, op, …, ui:
[steps]}], same: [{key, by}], scores: [{family, deadline, at, scored, lead}]}`. The UI steps are `{story, span, words}`
(click the words), `{open, tab}` (open a card from a tab), `{click}`, `{select, value}`, `{select_text, text}`,
`{fill, value}`, `{propose, value}` (type an answer), `{open_details}`. 395 moves: 151 clicks on the story, 121
"What do I know?", 52 inferences built, 16 candidates, 11 notices, 11 seals, 10 questions, 5 raises, 5 set-asides, 3
drops, 2 absences filed, 2 re-reads, 1 split, 1 theory, 1 weighing.

Where it should live is for Robert (below).

## Left open

- **Naming a theory uses the browser's `prompt()`**, a dialog that stops the page. It works (Round 163), but the
  autoplay cannot show it moving, and it is the only one in the game. A small inline field would suit pieces 2 and 4.
- **Seven annotation slips** of map or date (the table above).
- **From earlier reviews, unchanged:** the "advise" template (`t92.13`), theories proposing their own predictions, the
  purist hearing Holmes at the story's gates, strains by improbability (`t24.4`, `t37.11`, `t120.2`), corroboration
  (`t26.1`, `t36.3`), the plain GENRE thoughts, `t40.7` (nothing to doubt in Simpson's pallor), `t21.2` and `t78.4`
  (absences left), the rule `category`.
- **Hard shows none of the story's signals**, so the ten watch-holmes thoughts and the two "the story points back"
  prompts are Easy and Trivial's. The re-reads themselves are on every difficulty (the table makes them by the form).

## For Robert

1. **The Hard maximum is 70** (45 of 47 deductions and every other family full), reached through the UI. Is that the
   score the autoplay should show at the end?
2. **The action table's home.** (a) A script in `scripts/` (`npm run action-table`) that writes
   `cases/silver-blaze/action-table.json`, checked in and regenerated when the case changes, with a test that the
   annotation's player still reaches the engine's maximum (recommended: the autoplay reads a file, and the test keeps
   it honest); (b) generated by the page at load (no file, but every load replays the case in node terms); (c) left in
   the scratchpad until the autoplay paper.
3. **The script's own rules** (above): keep them in the script, or move them into `thoughts.json` as data (`aside` on
   the SET ASIDE thoughts, `candidates` on the hypotheses), so the annotation carries them? Recommended: into the data,
   since they are the reader's moves.
4. **The seven annotation slips:** fix them now, as one annotation step, or leave them listed?

## The thoughts

Every thought of `thoughts.json`, by scene. "Move on Hard, in the UI" is the action table's (at most three moves shown);
"¶" is where they are made; "Scores" gives the family, Holmes's paragraph and the lead.

### s01 Breakfast at Baker Street (¶1–¶7)

| Thought | Tag | Move on Hard, in the UI | ¶ | Scores | Verdict |
|---|---|---|---|---|---|
| `t4.1` | RECORD | click “the singular disappearance of” (¶4); “Silver Blaze is taken out of the stable”: What do I know?; click “the tragic murder of” (¶4); +1 more | 4 | — | played |
| `t4.2` | DEFAULT | click “His head had been shattered by” (¶35); “Straker's head is shattered by a savage blow”: What do I know?; connect 3 cards, about who | 35 | — | played |
| `t6.1` | GENRE | — | — | — | not held: the narrator's contract has no mechanic (review-ws8) |
| `t6.2` | SET ASIDE | click “field-glass” (¶6); “Watson's field-glass”: What do I know?; Set aside “Watson's field-glass” | 6 | — | played |

### s02 The train: the facts of the case (¶8–¶46)

| Thought | Tag | Move on Hard, in the UI | ¶ | Scores | Verdict |
|---|---|---|---|---|---|
| `t10.1` | SET ASIDE | click “the telegraph posts” (¶10); “The telegraph posts”: What do I know?; Set aside “The telegraph posts” | 10 | — | played |
| `t12.1` | GENRE | — | — | — | not held: the narrator's contract has no mechanic (review-ws8) |
| `t12.2` | GENRE | — | — | — | held by existing moves: the doubt reasons and the split (`t35.6`) are the sorting it licenses |
| `t14.1` | RECORD | click “From hour to hour” (¶14) | 14 | — | played |
| `t14.2` | QUESTION | click “the favourite” (¶4); “Silver Blaze”: What do I know?; Ask your own question (where-is) | 14 | — | played |
| `t14.3` | HYPOTHESIS | click “King’s Pyland” (¶3); “King's Pyland”: What do I know?; propose “King's Pyland”; +3 more | 14–19 | — | played |
| `t14.4` | GENRE | — | — | — | held by existing moves: `k.one_culprit` can be doubted ("two stories", `t68.3`) |
| `t18.1` | RECORD | click “the betting being three to one on him” (¶18); “The turf and betting”: What do I know?; “The public lays enormous sums on Silver Blaze”: What do I know? | 18 | — | played |
| `t18.2` | HYPOTHESIS·motive | click “there were many people who had the stron” (¶18) | 18 | — | played |
| `t18.3` | NOTICE | That's odd: “Silver Blaze is taken out of the stable” | 18 | notice ¶57, ahead 39 | scores |
| `t19.1` | RECORD | click “John Straker” (¶19); “John Straker”: What do I know?; click “keeps one maid-servant” (¶19); +5 more | 19 | — | played |
| `t19.2` | RECORD | click “One of these lads sat up each night in” (¶19); “Training stables”: What do I know? | 19 | — | played |
| `t19.3` | RECORD | click “which belongs to” (¶19) | 19 | — | played |
| `t19.4` | WEIGH | click “has always shown himself to be a zealous” (¶19) | 19 | — | played |
| `t19.5` | INFER | connect 2 cards, about where | 19 | deduction ¶116, ahead 97 | scores |
| `t20.1` | RECORD | click “Two of the lads” (¶20); “Two lads go up to the house and sup in the kit…”: What do I know?; “The stables are locked up”: What do I know?; +6 more | 20 | — | played |
| `t20.2` | RECORD | click “At” (¶20); “Edith Baxter carries the supper down to the st…”: What do I know?; click “his supper” (¶20); +2 more | 20 | — | played |
| `t20.3` | RECORD | click “She took no liquid, as there was” (¶20) | 20 | — | played |
| `t20.4` | NOTICE | That's odd: “Hunter's supper was a dish of curried mutton.” | 20 | notice ¶216, ahead 196 | scores |
| `t20.5` | NOTICE | That's odd: “Edith took no liquid: there was a water-tap in…” | 20 | — | played |
| `t20.6` | INFER | click “a water-tap” (¶20); “The stable water-tap”: What do I know?; click “a savage blow from some heavy weapon” (¶35); +2 more | 20–37 | — | played |
| `t20.7` | QUESTION·opportunity | click “a dish of curried mutton” (¶20); “The curried mutton”: What do I know?; Ask your own question (reach) | 20 | — | played |
| `t21.1` | RECORD | click “she saw that he was a person of gentlema” (¶21) | 21 | — | played |
| `t21.2` | ABSENCE | — | — | — | not held: a gap between two testimonies, no world fact to file (Round 93: left) |
| `t24.1` | RECORD | click “I understand that a stable-boy sleeps th” (¶24); click “He took” (¶24); “The stranger offers Edith a dress if the boy g…”: What do I know?; +2 more | 24 | — | played |
| `t24.2` | AGENT | connect 2 cards, about whether | 24 | — | played |
| `t24.3` | HYPOTHESIS | click “a piece of white paper” (¶24); “The folded white paper”: What do I know?; click “powdered opium” (¶37); +5 more | 24–58 | — | played |
| `t24.4` | WEIGH | — | — | — | not held: a strain by improbability (review-ws3-ws6: left authored) |
| `t24.5` | SET ASIDE | click “a new dress” (¶24); “The promised dress”: What do I know?; Set aside “The promised dress” | 24 | — | played |
| `t25.1` | QUESTION·opportunity | click “ran past him to” (¶25); “Frightened, Edith runs past him to the stable …”: What do I know?; Ask your own question (where-during) | 25 | — | played |
| `t26.1` | WEIGH | click “The girl” (¶26); “Edith Baxter”: What do I know? | 26 | — | played |
| `t28.1` | RECORD | click “You’ve two horses in for the Wessex Cup—” (¶28) | 28 | — | played |
| `t28.2` | WEIGH | click “Is it a fact that at the weights” (¶28); “At the window the stranger asks Hunter for a t…”: What do I know? | 28 | — | played |
| `t28.3` | HYPOTHESIS·motive | — | — | — | held as a card: `r.laying_against`, asked for; the hypothesis itself is not a question of the case |
| `t29.1` | RECORD | click “So, you’re one of those damned touts!” (¶29); “Hunter calls him a tout and rushes to unloose …”: What do I know?; click “when” (¶29); +3 more | 29 | — | played |
| `t29.2` | RECORD | click “The girl” (¶29); “Edith flees to the house, looking back to see …”: What do I know? | 29 | — | played |
| `t29.3` | INFER·opportunity | connect 2 cards, about when | 29 | deduction ¶36, ahead 7 | scores |
| `t29.4` | PREDICT | — | — | — | held: the dog's expectation is a card; filing the absence (`t34.2`) is its seal |
| `t31.1` | RECORD | click “The window, I may add, was not large eno” (¶31); click “The boy locked” (¶31); “The stable door's lock”: What do I know?; +2 more | 31 | — | played |
| `t31.2` | GENRE·watch-holmes | — | — | — | held, unscored, on Easy and Trivial only: Holmes's interest (hints "story"); Hard shows no signals |
| `t31.3` | INFER | connect 3 cards, about what | 31 | deduction ¶57, ahead 26 | scores |
| `t31.4` | QUESTION·opportunity | Ask your own question (who-had) | 31 | — | played |
| `t32.1` | RECORD | click “Hunter” (¶32); “The other two lads come back to the stable”: What do I know?; “Hunter sends word of the tout to Straker”: What do I know?; +3 more | 32 | — | played |
| `t32.2` | RECORD | click “Mrs. Straker” (¶32); “Mrs. Straker wakes at one to find her husband …”: What do I know?; “Mrs. Straker”: What do I know?; +5 more | 32 | — | played |
| `t32.3` | SOURCE | click “the art of the reasoner” (¶12); “Holmes's methods”: What do I know?; connect 2 cards, about whether | 32 | — | played |
| `t32.4` | WEIGH | — | — | — | not held: the narrator's gloss; splitting it would change nothing (Round 93: left) |
| `t33.1` | RECORD | click “Mrs. Straker” (¶33); “Mrs. Straker wakes at seven; her husband has n…”: What do I know?; click “the favourite’s stall” (¶33); +4 more | 33 | — | played |
| `t33.2` | INFER | connect 4 cards, about what | 33 | — | played |
| `t34.1` | RECORD | click “The two lads” (¶34); “The two lads in the loft are woken; they heard…”: What do I know? | 34 | — | played |
| `t34.2` | ABSENCE | absence filed from “The two lads asleep in the chaff-cutting loft …” | 34 | absence ¶180, ahead 146 | scores |
| `t34.3` | WEIGH | connect 6 cards, about who; Unless… on “A dog was in the stable; someone came in while…” | 34 | raise ¶219, ahead 185 | scores |
| `t34.4` | HYPOTHESIS | — | — | — | held by `t34.3` and `t34.7`: the raise and the inference are the set's members |
| `t34.5` | AGENT | connect 5 cards, about whether | 35 | — | played |
| `t34.6` | GENRE | — | — | — | not held: the narrator's contract has no mechanic (review-ws8) |
| `t34.7` | DEFAULT | — | — | deduction ¶219, ahead 185 | scores |
| `t34.8` | ABSENCE | absence filed from “The two lads asleep in the chaff-cutting loft …” | 34 | — | played |
| `t35.1` | RECORD | click “John Straker” (¶35); “The lads and the two women climb the knoll”: What do I know?; “The overcoat comes to be on the furze-bush”: What do I know? | 35 | — | played |
| `t35.2` | RECORD | click “at the bottom of this was found the dead” (¶35); “Straker's body is found at the bottom of the h…”: What do I know? | 35 | — | played |
| `t35.3` | RECORD | click “inflicted evidently by” (¶35); “Straker's thigh is cut”: What do I know? | 35 | — | played |
| `t35.4` | RECORD | click “in his right hand he held” (¶35); “Straker picks up the knife from the dressing-t…”: What do I know? | 35 | — | played |
| `t35.5` | RECORD | click “which was recognised by” (¶35); “The maid recognises the cravat as the stranger's”: What do I know?; click “in his left he clasped” (¶35); +1 more | 35 | — | played |
| `t35.6` | WEIGH | click “It was clear, however, that” (¶35); Split this statement | 35 | — | played |
| `t35.7` | HYPOTHESIS | connect 5 cards, about what | 41 | — | played |
| `t35.8` | NOTICE | That's odd: “From the knoll they saw Straker's overcoat fla…” | 35 | notice ¶226, ahead 191 | scores |
| `t35.9` | HYPOTHESIS | propose “To fight”; propose “To have his arms free for some work” | 97 | — | played |
| `t35.10` | HYPOTHESIS | click “He acknowledges that it is his” (¶60); connect 7 cards, about who | 60 | — | played |
| `t36.1` | RECORD | click “He was equally certain that the same str” (¶36); click “Hunter” (¶36); “Hunter recovers; he too knows the cravat and b…”: What do I know? | 36 | — | played |
| `t36.2` | WEIGH | click “the remains of his supper” (¶37); “Hunter eats from his drugged supper”: What do I know?; click “He did not attempt to deny that he had a” (¶40); +3 more | 37–218 | deduction ¶218, not ahead; raise ¶218, ahead 178 | scores |
| `t36.3` | WEIGH | — | — | — | played (by `t35.5`, `t36.1`) |
| `t37.1` | RECORD | click “there were abundant proofs in the mud wh” (¶37); “Silver Blaze comes to the hollow”: What do I know? | 37 | — | played |
| `t37.2` | RECORD | click “although” (¶37); click “a large reward” (¶37); “A large reward is offered for the horse”: What do I know?; +1 more | 37 | — | played |
| `t37.3` | RECORD | click “the people at” (¶37); “The household eats the same curried mutton wit…”: What do I know?; “Hunter's portion is set aside”: What do I know? | 37 | — | played |
| `t37.4` | INFER | connect 5 cards, about when | 37 | deduction ¶218, ahead 181 | scores |
| `t37.5` | INFER | connect 4 cards, about what | 37 | deduction ¶220, ahead 183 | scores |
| `t37.6` | REVISE | — | — | — | held: the two background facts, asked for; the curry's puzzle on the Theories tab |
| `t37.7` | DEFAULT | connect 7 cards, about who | 37 | deduction ¶218, ahead 181 | scores |
| `t37.8` | INFER | connect 4 cards, about who | 37 | deduction ¶218, ahead 181 | scores |
| `t37.9` | HYPOTHESIS·opportunity | propose “John Straker”; propose “Mrs. Straker”; propose “Edith Baxter”; +1 more | 37 | deduction ¶218, ahead 181 | scores |
| `t37.10` | HYPOTHESIS | — | — | — | played (by `t37.9`) |
| `t37.11` | TEST | — | — | — | not held: a strain by improbability (review-ws3-ws6: left authored) |
| `t37.12` | TEST | — | — | — | held: the police theory's residue on the Theories tab (`t46.3`'s weighing) |
| `t37.13` | HYPOTHESIS | click “Fitzroy Simpson” (¶14); “Fitzroy Simpson”: What do I know?; propose “Fitzroy Simpson”; +6 more | 37–102 | deduction ¶226, ahead 124 | scores |
| `t37.14` | DEFAULT·period | — | — | deduction ¶218, ahead 181 | scores |
| `t37.15` | DEFAULT | connect 8 cards, about who | 37 | deduction ¶218, ahead 181 | scores |
| `t37.16` | INFER | connect 6 cards, about who | 37 | deduction ¶220, ahead 183 | scores |
| `t38.1` | GENRE | — | — | — | held by existing moves: the split of the papers' statement (`t35.6`) and Hunter's doubt (`t36.2`) |
| `t39.1` | RECORD | click “He was a man of excellent birth and educ” (¶39); “Simpson squanders a fortune on the turf”: What do I know?; “Simpson lives by quiet bookmaking in the Londo…”: What do I know?; +4 more | 39 | — | played |
| `t39.2` | HYPOTHESIS·motive | — | — | — | not held: Simpson's motive is the police theory's, not a question of its own (review-ws3-ws6) |
| `t39.3` | GENRE | — | — | — | not held: the narrator's contract has no mechanic (review-ws8) |
| `t39.4` | HYPOTHESIS·scenario | click “a man appeared out of the darkness” (¶21); “The stranger at the stable”: What do I know? | 39 | — | played |
| `t40.1` | RECORD | click “declared that he had no sinister designs” (¶40) | 40 | — | played |
| `t40.2` | RECORD | click “When confronted with” (¶40); click “His wet clothing” (¶40); “The stranger's clothes”: What do I know?; +2 more | 40 | — | played |
| `t40.3` | HYPOTHESIS·motive | click “they had an interest in the disappearanc” (¶66) | 66 | — | played |
| `t40.4` | INFER | connect 2 cards, about where | 40 | deduction ¶116, ahead 76 | scores |
| `t40.5` | NOTICE | That's odd: “Simpson's stick is a Penang-lawyer weighted wi…”; That's odd: “Straker's head had been shattered by a savage …” | 40 | — | played |
| `t40.6` | WEIGH | — | — | — | played (by `t40.2`) |
| `t40.7` | WEIGH | — | — | — | played (by `t40.2`) |
| `t41.1` | RECORD | click “there was no wound upon his person” (¶41) | 41 | — | played |
| `t41.2` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |
| `t44.1` | RECORD | click “Is it not possible,” I suggested, “that ” (¶43) | 44 | — | played |
| `t44.2` | TEST | — | — | deduction ¶226, ahead 185 | scores |
| `t46.1` | HYPOTHESIS·scenario | — | — | — | played (by `t39.4`, `t37.9`, `t36.1`, `t4.1`, `t37.13`, `t35.7`) |
| `t46.2` | INFER | click “His bridle” (¶46); “Silver Blaze's bridle”: What do I know? | 46 | — | played |
| `t46.3` | RESIDUE | Weigh it: 5 left over | 46 | — | played |
| `t46.4` | HYPOTHESIS·scenario | — | — | deduction ¶220, ahead 183 | scores |
| `t46.5` | QUESTION·motive | Ask your own question (why-person) | 46 | — | played |
| `t46.6` | QUESTION | Ask your own question (event-who) | 46 | — | played |
| `t46.7` | INFER | connect 8 cards, about whether | 46 | deduction ¶220, ahead 180 | scores |

### s03 Tavistock and the drive with Gregory (¶47–¶69)

| Thought | Tag | Move on Hard, in the UI | ¶ | Scores | Verdict |
|---|---|---|---|---|---|
| `t52.1` | RECORD | — | — | — | not held: no card (Round 93: left) |
| `t54.1` | TEST | click “We have quite come to the conclusion tha” (¶54) | 54 | — | played |
| `t56.1` | WEIGH | Unless… on “Simpson's lead-weighted stick is just such a w…” | 60 | — | played |
| `t57.1` | TEST | — | — | — | held: the police theory's residue on the Theories tab (`t46.3`'s weighing) |
| `t57.2` | NOTICE | — | — | — | not held: about Holmes's words, not the world (Round 93) |
| `t57.3` | QUESTION·turn-around | Ask your own question (not-here) | 57 | — | played |
| `t58.1` | RECORD | — | — | — | read: its cards came with an earlier click |
| `t58.2` | RECORD | click “The key” (¶58); “A duplicate key”: What do I know?; click “He is not a stranger to the district.” (¶58); +2 more | 58 | — | played |
| `t58.3` | DROP | Drop it… (card, because of “Simpson says the folded paper was a ten-pound …”) | 58 | drop ¶102, ahead 44 | scores |
| `t58.4` | WEIGH | — | — | — | held on Easy and Medium: a theory's assumed answers beside its cost; on Hard on request |
| `t60.1` | RECORD | click “declares that he had lost it” (¶60) | 60 | — | played |
| `t60.2` | WEIGH | — | — | — | played (by `t60.1`) |
| `t60.3` | HYPOTHESIS | — | — | — | played (by `t35.10`) |
| `t60.4` | INFER | — | — | deduction ¶226, ahead 166 | scores |
| `t62.1` | RECORD | click “We have found traces which show that” (¶62); “A party of gypsies camps within a mile of the …”: What do I know?; click “On Tuesday they were gone” (¶62); +1 more | 62 | — | played |
| `t62.2` | HYPOTHESIS | — | — | — | played (by `t4.1`, `t39.4`, `t14.3`) |
| `t62.3` | DEFAULT·period | click “gypsies” (¶19); “A party of gypsies”: What do I know?; connect 2 cards, about whether; +1 more | 62 | deduction ¶114, ahead 52; raise ¶114, ahead 52 | scores |
| `t62.4` | DROP | connect 3 cards, about who; Drop it… (card, because of “Gypsies keep clear of the police, and no one c…”) | 62 | deduction ¶114, ahead 52; drop ¶114, ahead 52 | scores |
| `t64.1` | RECORD | click “examined” (¶64); “Gregory examines every stable and out-house wi…”: What do I know? | 64 | — | played |
| `t64.2` | TEST | click “We have, however, examined” (¶66); “The police examine the Mapleton stables and fi…”: What do I know? | 66 | — | played |
| `t64.3` | HYPOTHESIS | connect 3 cards, about whether | 66 | — | played |
| `t66.1` | RECORD | click “Silas Brown” (¶66); “Silas Brown places large bets on the race”: What do I know?; “Silas Brown”: What do I know?; +1 more | 66 | — | played |
| `t66.2` | TEST | — | — | — | played (by `t66.1`) |
| `t66.3` | HYPOTHESIS·scenario | — | — | — | playable, unscored: a theory the player may write; not in the script (no score turns on it) |
| `t68.1` | RECORD | click “Nothing at all.” (¶68) | 68 | — | played |
| `t68.2` | DROP | — | — | — | playable, unscored: dropping that theory; no game target (docs/hypotheses.md) |
| `t68.3` | IDENTIFY·split | doubt | 68 | — | played |

### s04 Straker's villa: the pockets and Mrs. Straker (¶70–¶92)

| Thought | Tag | Move on Hard, in the UI | ¶ | Scores | Verdict |
|---|---|---|---|---|---|
| `t70.1` | GENRE·watch-holmes | — | — | — | held, unscored, on Easy and Trivial only: Holmes's interest (hints "story"); Hard shows no signals |
| `t70.2` | GENRE·re-read | Re-read ¶8–¶46 | 70 | — | played |
| `t75.1` | GENRE·watch-holmes | — | — | — | held, unscored, on Easy and Trivial only: Holmes's interest (hints "story"); Hard shows no signals |
| `t78.1` | RECORD | click “There was” (¶78); “The police keep the contents of Straker's pock…”: What do I know? | 78 | — | played |
| `t78.2` | INFER | connect 4 cards, about why | 78 | — | played |
| `t78.3` | NOTICE | That's odd: “Straker's pockets held a box of vestas, two in…” | 78 | notice ¶224, ahead 146 | scores |
| `t78.4` | ABSENCE | — | — | — | not held: the lantern fits a filing, but its witness is weak (Round 93: left) |
| `t78.5` | PREDICT | click “a box of vestas” (¶78); “A box of vestas”: What do I know?; click “a bowl-shaped depression” (¶35); +2 more | 78 | check ¶102, ahead 24 | scores |
| `t80.1` | RECORD | click “It is what we call” (¶80) | 80 | — | played |
| `t80.2` | NOTICE | That's odd: “The bloodstained knife from Straker's hand is …” | 80 | notice ¶81, ahead 1 | scores |
| `t81.1` | RECORD | click “A strange thing for a man to carry with ” (¶81) | 81 | — | played |
| `t81.3` | HYPOTHESIS | propose “To defend himself”; propose “For some delicate work” | 81 | — | played |
| `t81.4` | AGENT | connect 4 cards, about who | 81 | deduction ¶221, ahead 140 | scores |
| `t81.5` | INFER | connect 3 cards, about why | 81 | deduction ¶221, ahead 140 | scores |
| `t82.1` | RECORD | click “His wife tells us that” (¶82); “Someone obtains the knife”: What do I know?; click “It was a poor weapon, but perhaps the be” (¶82); +2 more | 82 | — | played |
| `t82.2` | WEIGH | — | — | — | played (by `t82.1`) |
| `t82.3` | INFER | click “a disk of cork” (¶82); “The disk of cork”: What do I know?; connect 2 cards, about whether | 82 | — | played |
| `t82.4` | NOTICE | That's odd: “Mrs. Straker says the knife had lain on the dr…” | 82 | — | played |
| `t84.1` | RECORD | click “a milliner’s account” (¶84); “Clothes are bought from Madame Lesurier on Der…”: What do I know?; “The milliner's account”: What do I know?; +1 more | 84 | — | played |
| `t84.2` | RECORD | click “Mrs. Straker” (¶84) | 84 | — | played |
| `t84.3` | NOTICE | That's odd: “The milliner's account is for £37 15s, made ou…” | 84 | notice ¶225, ahead 141 | scores |
| `t84.4` | HYPOTHESIS | click “William Derbyshire” (¶84); “William Derbyshire”: What do I know?; propose “John Straker” | 84 | — | played |
| `t84.5` | SOURCE | connect 2 cards, about whether | 84 | — | played |
| `t84.6` | IDENTIFY·merge | connect 3 cards, about who; connect 2 cards, about who | 84 | deduction ¶225, ahead 141 | scores |
| `t84.7` | NOTICE·calculate | — | — | notice ¶225, ahead 141 | scores |
| `t84.8` | REVISE | — | — | deduction ¶229, ahead 137 | scores |
| `t84.9` | DEFAULT | — | — | deduction ¶225, ahead 141 | scores |
| `t85.1` | RECORD | click “Twenty-two guineas is rather heavy for” (¶85) | 85 | — | played |
| `t85.2` | GENRE·watch-holmes | — | — | — | held, unscored, on Easy and Trivial only: Holmes's interest (hints "story"); Hard shows no signals |
| `t85.3` | TEST PLAN | Checks: Ask Mrs. Straker / The milliner's account is for £37 15s, made ou… | 85 | check ¶89, ahead 4 | scores |
| `t92.1` | RECORD | click “I never had” (¶92); click “Surely I met you in” (¶89) | 92 | — | played |
| `t92.2` | INFER | connect 4 cards, about who | 92 | deduction ¶225, ahead 133 | scores |
| `t92.3` | WEIGH | connect 2 cards, about whether | 92 | — | played |
| `t92.4` | TEST | connect 4 cards, about who | 92 | deduction ¶93, ahead 1 | scores |
| `t92.5` | TEST PLAN | click “Madame Lesurier” (¶84); “Madame Lesurier”: What do I know?; Checks: Show John Straker / Madame Lesurier | 92 | check ¶161, ahead 69 | scores |
| `t92.6` | HYPOTHESIS·scenario | New theory, 8 answers | 92 | — | played |
| `t92.7` | DROP | Drop it… (more-hands) | 92 | drop ¶102, ahead 10 | scores |
| `t92.8` | QUESTION | Ask your own question (event-who) | 92 | — | played |
| `t92.9` | PREDICT | Checks: Look for A box of vestas / The hollow, expecting found | 92 | check ¶102, ahead 24 | scores |
| `t92.10` | PREDICT | click “Inspector Gregory” (¶12); “Colonel Ross telegraphs Holmes”: What do I know?; “Inspector Gregory telegraphs Holmes”: What do I know?; +2 more | 92 | check ¶94, ahead 2 | scores |
| `t92.11` | PREDICT | Checks: Look for Silver Blaze / Mapleton, expecting found | 92 | check ¶116, ahead 24 | scores |
| `t92.12` | PREDICT | Checks: Show John Straker / Madame Lesurier, expecting yes | 92 | check ¶161, ahead 69 | scores |
| `t92.13` | PREDICT | — | — | — | not held as a check: advice, not a find (review-ws7) |
| `t92.14` | AGENT | — | — | — | not held as a check: no vocabulary before Holmes names the sheep (review-ws7) |
| `t92.15` | INFER | connect 6 cards, about why | 92 | deduction ¶225, ahead 133 | scores |

### s05 The hollow (¶93–¶113)

| Thought | Tag | Move on Hard, in the UI | ¶ | Scores | Verdict |
|---|---|---|---|---|---|
| `t93.1` | RECORD | — | — | — | read: its cards came with an earlier click |
| `t93.2` | GENRE | — | — | — | not held: the narrator's contract has no mechanic (review-ws8) |
| `t95.1` | RECORD | click “None; but very heavy rain.” (¶95) | 95 | — | played |
| `t95.2` | PHYSICAL | click “Dartmoor” (¶3); “Dartmoor”: What do I know?; connect 4 cards, about who | 95 | deduction ¶96, ahead 1 | scores |
| `t97.1` | RECORD | click “Yes,” (¶97) | 97 | — | played |
| `t97.2` | AGENT | connect 5 cards, about when | 97 | deduction ¶226, ahead 129 | scores |
| `t99.1` | RECORD | click “A piece of matting” (¶99); “A piece of matting is laid at the side of the …”: What do I know?; “A piece of matting”: What do I know? | 99 | — | played |
| `t100.1` | NOTICE | — | — | — | not held: no notable card (Round 93: optional, left) |
| `t101.1` | RECORD | — | — | — | read: Holmes's action, told by the story; nothing to collect |
| `t101.2` | TEST PLAN | Checks: Compare John Straker / The hollow | 101 | check ¶107, ahead 6 | scores |
| `t102.1` | RECORD | — | — | — | read: its cards came with an earlier click |
| `t102.2` | TEST | connect 5 cards, about who | 102 | deduction ¶224, ahead 122 | scores |
| `t102.3` | HYPOTHESIS | propose “To light a pipe”; propose “To see to some close work” | 224 | — | played |
| `t102.4` | INFER | — | — | deduction ¶226, ahead 124 | scores |
| `t106.1` | GENRE·watch-holmes | — | — | — | held, unscored, on Easy and Trivial only: Holmes's interest (hints "story"); Hard shows no signals |
| `t107.1` | RECORD | click “compared the impressions of each of them” (¶107) | 107 | — | played |
| `t107.2` | ABSENCE | — | — | — | held: the story never tells it; "What the story held back" at the end |
| `t108.1` | RECORD | click “I have examined the ground very carefull” (¶108) | 108 | — | played |
| `t108.2` | QUESTION | Ask your own question (how-left) | 108 | — | played |
| `t109.1` | RECORD | — | — | — | not held: no card (Round 93: left) |
| `t109.2` | GENRE·watch-holmes | — | — | — | held, unscored, on Easy and Trivial only: Holmes's interest (hints "story"); Hard shows no signals |
| `t111.1` | RECORD | — | — | — | read: Holmes's action, told by the story; nothing to collect |
| `t111.2` | GENRE·watch-holmes | — | — | — | held, unscored, on Easy and Trivial only: Holmes's interest (hints "story"); Hard shows no signals |

### s06 Across the moor to Mapleton (¶114–¶143)

| Thought | Tag | Move on Hard, in the UI | ¶ | Scores | Verdict |
|---|---|---|---|---|---|
| `t114.1` | RECORD | — | — | — | read: Holmes's action, told by the story; nothing to collect |
| `t114.2` | DEFAULT | connect 2 cards, about where | 114 | deduction ¶116, ahead 76 | scores |
| `t114.3` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |
| `t116.1` | RECORD | click “there is” (¶116); click “This part of” (¶116) | 116 | — | played |
| `t116.2` | NOTICE | — | — | — | held as a card: `r.wet_ground_holds_tracks` |
| `t116.3` | TEST PLAN | Checks: Look for Silver Blaze / Mapleton | 116 | check ¶116, ahead 24 | scores |
| `t117.1` | RECORD | click “The track of a horse was plainly outline” (¶117); “The horse leaves the hollow”: What do I know? | 117 | — | played |
| `t117.2` | TEST | — | — | deduction ¶124, ahead 84 | scores |
| `t118.1` | SET ASIDE | — | — | — | not held: a passage, not a card (review-ws8) |
| `t119.1` | RECORD | click “A man’s track” (¶119); “Someone meets the loose horse near Mapleton”: What do I know?; “The man whose track appears beside the horse's”: What do I know? | 119 | — | played |
| `t120.1` | INFER | connect 2 cards, about who | 120 | deduction ¶231, ahead 111 | scores |
| `t120.2` | WEIGH | — | — | — | not held: a strain by improbability (review-ws3-ws6: left authored) |
| `t120.3` | QUESTION | Ask your own question (who-is) | 120 | — | played |
| `t122.1` | RECORD | click “The double track turned sharp off and to” (¶122) | 122 | — | played |
| `t122.2` | RECORD | click “the same tracks coming back again in the” (¶122); “The horse is led towards King's Pyland, then t…”: What do I know? | 122 | — | played |
| `t122.3` | AGENT | connect 3 cards, about whether | 122 | deduction ¶146, ahead 24 | scores |
| `t124.1` | RECORD | click “It ended at the paving of asphalt which ” (¶124) | 124 | — | played |
| `t124.2` | INFER | connect 4 cards, about where | 124 | deduction ¶146, ahead 22 | scores |
| `t127.1` | RECORD | click “if any one is about he will be, for he i” (¶127) | 127 | — | played |
| `t127.2` | GENRE·watch-holmes | — | — | — | held, unscored, on Easy and Trivial only: Holmes's interest (hints "story"); Hard shows no signals |
| `t127.3` | AGENT | connect 4 cards, about who | 127 | deduction ¶146, ahead 19 | scores |
| `t127.4` | HYPOTHESIS | propose “Silas Brown” | 127 | deduction ¶146, not ahead | played, not ahead |
| `t128.1` | SET ASIDE | click “the half-crown” (¶128); “A half-crown”: What do I know?; Set aside “A half-crown” | 128 | — | played |
| `t133.1` | RECORD | click “It’s a lie!” he shouted, “an infernal li” (¶133) | 133 | — | played |
| `t135.1` | WEIGH | click “Oh, come in if you wish to.” (¶135); connect 3 cards, about whether; click “Should I change it first or not?” (¶140); +2 more | 135–140 | — | played |
| `t137.1` | RECORD | — | — | — | read: Holmes's action, told by the story; nothing to collect |
| `t140.1` | RECORD | — | — | — | read: its cards came with an earlier click |
| `t140.2` | INFER | — | — | deduction ¶146, ahead 19 | scores |
| `t141.1` | HYPOTHESIS | propose “true” | 141 | deduction ¶148, ahead 34 | scores |
| `t141.2` | PREDICT | Checks: Look for Silver Blaze / King's Pyland has two horses in for the Wessex…, expecting found | 141 | check ¶197, ahead 56 | scores |

### s07 The walk back (¶144–¶156)

| Thought | Tag | Move on Hard, in the UI | ¶ | Scores | Verdict |
|---|---|---|---|---|---|
| `t146.1` | RECORD | click “you observed the peculiarly square toes ” (¶146) | 146 | — | played |
| `t146.2` | TEST | connect 2 cards, about who | 146 | — | played |
| `t146.3` | RECORD | click “from the white forehead which has given” (¶146) | 146 | — | played |
| `t148.1` | RECORD | — | — | — | read: a background fact, asked for or stated |
| `t148.2` | INFER | — | — | deduction ¶204, ahead 138 | scores |
| `t150.1` | AGENT | click “knows that his only hope of mercy is to ” (¶150); connect 2 cards, about whether | 150 | — | played |
| `t152.1` | SET ASIDE | — | — | — | not held: a passage, not a card (review-ws8) |
| `t156.1` | RECORD | — | — | — | read: Holmes's action, told by the story; nothing to collect |
| `t156.2` | GENRE·watch-holmes | — | — | — | held, unscored, on Easy and Trivial only: Holmes's interest (hints "story"); Hard shows no signals |

### s08 Departure: the photograph, the sheep, the dog (¶157–¶182)

| Thought | Tag | Move on Hard, in the UI | ¶ | Scores | Verdict |
|---|---|---|---|---|---|
| `t161.1` | RECORD | — | — | — | read: Holmes's action, told by the story; nothing to collect |
| `t161.2` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |
| `t161.3` | GENRE·watch-holmes | — | — | — | held, unscored, on Easy and Trivial only: Holmes's interest (hints "story"); Hard shows no signals |
| `t163.1` | RECORD | — | — | — | read: Holmes's action, told by the story; nothing to collect |
| `t163.2` | ABSENCE | — | — | — | held: the story never tells it; "What the story held back" at the end |
| `t163.3` | HYPOTHESIS | Checks: Ask Edith Baxter / The curried mutton | 163 | — | played |
| `t173.1` | RECORD | click “not of much account; but” (¶173); “Three of the sheep go lame”: What do I know? | 173 | — | played |
| `t173.2` | TEST | — | — | deduction ¶228, ahead 53 | scores |
| `t175.1` | INFER | connect 3 cards, about what | 175 | deduction ¶228, ahead 53 | scores |
| `t182.1` | RECORD | — | — | — | played (by `t34.2`) |
| `t182.2` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |
| `t182.3` | GENRE·re-read | Re-read ¶29–¶34 | 182 | — | played |

### s09 The Wessex Cup (¶183–¶214)

| Thought | Tag | Move on Hard, in the UI | ¶ | Scores | Verdict |
|---|---|---|---|---|---|
| `t186.1` | RECORD | click “his mottled off-foreleg” (¶186) | 186 | — | played |
| `t188.1` | RECORD | click “You could have got fifteen to one” (¶188); “The odds on Silver Blaze shorten from fifteen …”: What do I know? | 188 | — | played |
| `t188.2` | NOTICE·calculate | That's odd: “You could have got fifteen to one on Silver Bl…” | 188 | notice ¶189, ahead 1 | scores |
| `t191.1` | RECORD | click “4.” (¶191) | 191 | — | played |
| `t192.1` | RECORD | click “We scratched” (¶192); “Ross scratches Bayard and puts all his hopes o…”: What do I know? | 192 | — | played |
| `t192.2` | SET ASIDE | click “Bayard” (¶28); “Bayard”: What do I know?; Set aside “Bayard” | 192 | — | played |
| `t198.1` | RECORD | click “bearing on its back the well-known” (¶197); “The Wessex Cup is run”: What do I know?; “Ross's jockey rides the bay”: What do I know?; +2 more | 198 | — | played |
| `t198.2` | IDENTIFY·merge | connect 8 cards, about who | 198 | deduction ¶202, ahead 4 | scores |
| `t200.1` | RECORD | click “passed the post a good six lengths befor” (¶200) | 200 | — | played |
| `t202.1` | RECORD | click “You have only to” (¶202) | 202 | — | played |
| `t202.2` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |
| `t204.1` | RECORD | click “I found him in the hands of” (¶204) | 204 | — | played |
| `t212.1` | RECORD | — | — | — | read: Holmes names the horse; a conclusion to prove, not dealt (by design) |
| `t212.2` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |
| `t212.3` | REVISE | — | — | — | held: "How it reads under each story" on the old cards |
| `t214.1` | RECORD | — | — | — | read: Holmes names the horse; a conclusion to prove, not dealt (by design) |
| `t214.2` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |

### s10 The explanation on the train home (¶215–¶231)

| Thought | Tag | Move on Hard, in the UI | ¶ | Scores | Verdict |
|---|---|---|---|---|---|
| `t216.1` | RECORD | — | — | — | read: Holmes's action, told by the story; nothing to collect |
| `t216.2` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |
| `t218.1` | RECORD | — | — | — | read: a background fact, asked for or stated |
| `t218.2` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |
| `t218.3` | NOTICE | Unless… on “The guard was drugged so that the horse could …” | 218 | — | played |
| `t219.1` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |
| `t220.1` | RECORD | — | — | — | read: a background fact, asked for or stated |
| `t220.2` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |
| `t220.3` | NOTICE | — | — | deduction ¶220, ahead 183 | scores |
| `t221.1` | RECORD | — | — | — | read: a background fact, asked for or stated |
| `t221.2` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |
| `t223.1` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |
| `t224.1` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |
| `t225.1` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |
| `t226.1` | RECORD | — | — | — | read: a background fact, asked for or stated |
| `t226.2` | REVISE | — | — | — | held: "How it reads under each story" on the old cards |
| `t226.3` | WEIGH | — | — | — | held: the case leaves it open, as the reader does |
| `t228.1` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |
| `t229.1` | RECORD | click “the milliner” (¶229); “Straker keeps a second establishment”: What do I know? | 229 | — | played |
| `t229.2` | TEST | — | — | — | played (by `t229.1`) |
| `t231.1` | TEST | — | — | — | a confirmation: the story settles it; the record shows the player's earlier move at Holmes's paragraph |
