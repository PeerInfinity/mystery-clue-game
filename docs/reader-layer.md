# The reader layer (workstream 8)

Status: **AGREED** (Robert, 2026-10-18, Round 133: every recommendation of Q1–Q6 and the order of work), **built**
(Rounds 134–139). Its review: `docs/review-ws8.md` (Round 140). Mission: `docs/kickoff-workstream-8.md`. Builds on
`docs/gap-analysis.md` (§2 GENRE and SET ASIDE; §3 background cards, profile, confidence, "late or never
disclosed"; §5 item 8; §6 decisions 2 and 4), `docs/reading-annotated.md` (the background cards, the GENRE and SET
ASIDE thoughts, the fair-play table, "Notes for the next pass"), Round 33 (availability per reader supersedes
Strict), `docs/predictions.md` (`result: shown | late | never`) and `docs/review-ws7.md` ("Left open").

## The reader's process

The other workstreams model what the reader does with the evidence. This one models **who the reader is** and
**what the story does to them**:

- **What they already know.** The solution rests on background a reader brings. Most of it everyone has: a guard
  dog barks at strangers, people do not carry other people's bills. Some of it a reader of 1892 had and a modern
  reader often lacks: opium's taste, what a blaze is, laying against one's own horse, how a frightened horse
  kicks. The story states several of these only after they are needed (opium's taste at ¶218, laying at ¶220).
  For a reader without them, the background cards are the difficulty (annotation, "Notes for the next pass").
- **What the story tells them, and when.** Some facts arrive late (the square toes at ¶146, though Holmes saw the
  prints at ¶119) or never (the bill's items, the boot comparison, the question to the maid). The reader should
  know, at least at the end, that this was the story's doing.
- **How far ahead of the story they are.** Each thought is marked typical, careful or expert. A typical reader
  makes the typical moves and is told the rest by Holmes. A puzzle player wants the careful ones. Almost nobody
  makes the expert ones. Hints and gates should respect this.
- **Reading the storyteller.** The reader watches Holmes (his gleam at ¶70, the horseshoe pocketed at ¶109, the
  photograph at ¶161) and the narrator (a detail spelled out, the obvious suspect arrested in act one). The reader
  re-reads earlier text with a new question (`t70.2`, `t182.3`). These moves are worth less than reasoning from
  the evidence (decision 2: they never score).
- **Clearing the table.** The field-glass, the telegraph posts and the half-crown are scenery, and the reader
  puts them aside (`t6.2`, `t10.1`, `t128.1`). Doing so costs nothing and can be undone.

## What exists

- **Background facts** are 121 rules in `knowledge.json`:
  - 28 are editorial filler;
  - 40 carry a `source` and `stated_in`: the story says them, often late;
  - 81 are never stated by the story: common sense the solution uses.

  Each rule arrives at `ruleAt`: its `relevant_from` quote, and never before one of its `attaches_to` cards. The
  background setting is `start`, `relevant` (Trivial and Easy) or `ask` (Medium and Hard). Gates count a rule as
  told at the same point (`Story.#gates`).
- **Glosses** (49, display only): background for a modern reader, attached to cards and shown with them, some
  after an `after` quote (`g.laying_against` after "registered by him against the favourite").
- **The 25 background cards** (`bk.*` in `thoughts.json`) carry `reader_1892` and `reader_modern` marks. 21 of them
  `maps` to rules. `engine/thoughts.js` checks the marks against `READERS` and the maps, and nothing reads them.
- **The Strict column** (`scripts/validate-case.js`, `knownNoLateRules`): by the challenge (s08, ¶157), with
  every rule dropped that is stated after s08 or never stated. That drops the 81 common-sense rules too.
- **`Game.disclosure(card)`**: for a rule, its `ruleAt`; otherwise the paragraph of first mention. No caller in
  `ui/`.
- **Checks** (workstream 7) carry `result: {shown | late | never}`, and the Checks tab shows "The story does not say
  here" and "never told" at the end.
- **The report's "Quoted later than they appear"**: 17 event cards an early clue speaks of, quoted only later.
- **Profiles and confidence** are on every thought: 128 typical, 149 careful and 18 expert, plus 15 `hindsight`
  notes. They are checked, never read.
- **The `hints` option** (on in Easy): the Inferences tab counts what can be built. When 'wait' holds a paragraph,
  the note names the held cards the waiting inferences start from. The absence form pre-selects the first fileable
  expectation. None of this reads profiles.
- **`irrelevant`** (`none`…`all`, every preset `all`): leaves out a hashed share of the cards the solution has no
  use for (`model.relevant`): 66 entities, 28 claims, 36 rules, 49 glosses and 2 propositions. Left out means no
  card and nothing to click.
- **GENRE and SET ASIDE:** 20 GENRE thoughts (10 watch-holmes, 2 re-read, 8 plain) and 7 SET ASIDE. No card, no
  state, no action.

## Measured

Three scratch scripts (in the session's scratchpad) replay the story on Easy with background "when relevant":
- `avail.mjs`: per reader, the rules held back, the inferences and gates they move, and the case questions by the
  challenge;
- `genre.mjs`: each GENRE thought against its targets, and each SET ASIDE thought against the cards on its
  paragraph;
- `profiles.mjs` and `hints.mjs`: the gates and score rows by profile, and when a profile-timed hint would fire.

**The readers.** A rule is *lacking* for a reader when a background card that maps to it has a mark that reader
does not hold. A lacking rule arrives where the story states it (its `source`), or at the gloss paragraph, or
never. The readers:
- **1892** holds "yes", "likely" and "period";
- **1892, racing** also holds "racing public" and "racing-literate";
- **modern** holds "yes" and "period" only ("partial" counts as lacking);
- **modern-partial** also holds "partial" and "likely".

### 1. The background cards and their rules

| Card | 1892 | Modern | Rule | Arrives now | Story states it | Used by |
|---|---|---|---|---|---|---|
| `bk.opium_taste` | likely | partial | `r.opium_taste`, `r.curry_masks` | ¶37, ¶20 | ¶218 | `t37.7`, `t37.8`, `t37.15` (the curry, ¶37) |
| `bk.horse_kick` | yes | partial | `r.startled_horse_kicks`, `r.hoof_strikes_as_horse_kicks` | ¶18 | ¶226, never | `t102.4` (¶102) |
| `bk.blaze` | racing public | rare | `r.markings_identify_horse` | ¶18 | ¶186 | `k.markings_identify` (¶198) |
| `bk.lay_against` | racing-literate | rare | `r.laying_against` | ¶18 | ¶220 | `t92.15` (¶92), `k.lame_plan` |
| `bk.milliner_prices` | yes | gloss ¶225 | `r.servant_wages`, `r.no_finery_for_servants` | ¶85 | ¶225, never | `t92.4`, `t92.15` (¶92) |
| `bk.gypsies` | period | period | `r.gypsies_avoid_trouble`, `r.gypsies_clear_out` | ¶19, ¶62 | ¶114 | `t62.3`, `t62.4` |
| `bk.horse_gregarious` | yes | partial | `r.horse_gregarious` | ¶37 | ¶114 | `t114.2` |
| `bk.horse_faker` | racing public | rare | `r.searched_and_not_found`, `r.disguise_washes_off` | ¶18 | never, ¶148 | `t148.2` (¶66 at the earliest) |
| `bk.tendon_nick` | specialist | rare | `r.tendon_nick` | ¶173 | ¶221 | `k.practice_first`, `k.lame_plan` (implicit) |

The other 16 cards are "yes" for both readers. `bk.genre_obvious` and `bk.genre_named_detail` map to no rule:
they are the GENRE premises.

### 2. What each reader loses

| Reader | Lacks | Inferences moved | 'Wait' gates moved | By the challenge (¶157) |
|---|---|---|---|---|
| 1892 | blaze, laying, faker, tendon | `t92.15` ¶92 → ¶220; `t148.2` never | `t37.13` ¶202 → ¶222; `t141.1` and `t148.2` have a premise never told | the motive: debts → "debts, other" |
| 1892, racing | tendon | only the implicit `k.practice_first`, `k.lame_plan` (¶173 → ¶221) | `t37.13` ¶202 → ¶222 | unchanged |
| modern-partial | as 1892, plus the milliner's prices | as 1892, plus `t92.4` ¶92 → ¶225 | as 1892, plus `t92.4`, `t92.15`, `t84.8` never | the motive |
| modern | the rules of eight cards (all but the gypsies) | as modern-partial, plus the curry (`t37.7`, `t37.8`, `t37.15`) ¶37 → ¶218, the kick (`t102.4`) never, `t114.2` ¶37 → ¶114 | also `t81.5` ¶102 → ¶219, `t46.4` ¶111 → ¶219, the curry steps ¶218 → ¶219, `t102.4`, `t37.13` never | who drugged: straker → 20 left; where: villa → 48 left; who took the horse → 20 left; why taken → 3 left; who killed → 43 left; the motive |

What it means:
- **For a modern reader, the case cannot be solved before Holmes without the background cards.** The curry, the
  kick and the second household are the three pillars of the solution, and each rests on a card the modern
  reader lacks. The game solves this today by handing every reader every rule at its `relevant_from`. In
  effect, every player is an ideal 1892 racing man.
- **Three of the lacking rules are never stated by the story:** `r.hoof_strikes_as_horse_kicks`,
  `r.searched_and_not_found` and `r.no_finery_for_servants`. For a reader without them, the steps resting on them
  have a premise that is never told, and `Story.#gates` reports it as a problem. A per-reader gate listing must
  handle that.
- **The 1892 racing reader is today's player** but for the tendon nick, which only implicit inferences use.

### 3. Strict against availability

Strict says "45 left" for who drugged, "48 left" for where, "45 left" for who took the horse, "44 left" for the
killer and "25 left" for Derbyshire. It also leaves the coat, the knife and the purpose open. The **modern** reader
of §2 loses the drugger, the place, the taker, the purpose, the killer and the motive. They keep the coat, the
knife and Derbyshire, which rest on "yes" cards that Strict drops because the story never states them. The **1892**
reader loses only the motive. Strict mixes two things: knowledge the reader lacks, and common sense the story never
bothers to state. Availability per reader keeps the second.

### 4. Disclosure: the fair-play gaps as the game holds them now

| Item | Where it should be | In the story | In the game today | Policy in effect |
|---|---|---|---|---|
| Opium's taste | before ¶37 | ¶218 | `r.opium_taste` from ¶37 (`relevant_from`) | supplied as background |
| Laying against one's horse | before ¶84 | ¶220 | `r.laying_against` from ¶18, plus `g.laying_against` | supplied as background |
| What a blaze is | before ¶64 | ¶146 | `r.markings_identify_horse` from ¶18 | supplied as background |
| The tendon nick | not needed | ¶221 | `r.tendon_nick` from ¶173 | supplied (implicit only) |
| The bill's items | ¶85 | never | `k.dove_silk_on_the_bill`, an editorial inference (`t92.2`), ¶92 | the player supplies it by inference |
| The boot comparison | ¶107 | never | `ck.boots` `result: {never}` | withheld, marked (ws 7) |
| The square toes | ¶119 | ¶146 | `c.square_toes` dealt at ¶146 | withheld as the story does, unmarked |
| The question to the maid | ¶163 | never | `ck.maid` `result: {never}` | the player writes it, unscored (ws 7) |
| The milliner's recognition | — | ¶229 | `ck.photograph` `result: {late: 229}` | late, marked (ws 7) |

Every gap already has a policy, chosen piecemeal. What is missing is the **mark** on the facts and the rules. Today
nothing tells the player that opium's taste was given early by the game, not by the story, or that the square toes
were seen at ¶119 and told at ¶146. Workstream 7 marked the checks. The facts and the rules are not marked.

### 5. Profiles: the gates and the scores

- **Three of the 38 'wait' gates are expert thoughts with high hindsight:**
  - `t46.4`, Straker took the horse (¶111);
  - `t37.13`, the horse killed him (¶202);
  - `t102.4`, the kick (¶226).

  The first needs only what `t81.5` needs at ¶102, so it holds nothing new. The other two need `k.horse_kicked`,
  so a 'wait' player must build the expert step "the horse kicked him" before reading ¶202. The remaining 35
  gates are careful (29) or typical (6).
- **The score rows are almost all careful.** `thoughtScores` has 47 rows: 38 careful, 6 typical, 3 expert. Of the
  other families, the notices are 8 careful, 2 expert and 1 typical, and the checks are 10 careful and 1 expert.
- **A hint timed by profile gives the score away.** Suppose a hint fires at the first scene start after a thought's
  earliest date. Then it lands before Holmes for 34 of the 38 careful deduction rows, with a median lead of 132
  paragraphs. A hint that early does more than help: it makes the beat-Holmes move for the player. Fired later, at
  Holmes's paragraph, it is no longer a hint but the story itself. **So the profile cannot time hints for the
  scored moves.** As a filter it is nearly flat: almost everything that scores is careful. This is the workstream 6
  lesson again: the planned signal does not discriminate.

### 6. GENRE: where the signal lands

| Thought | ¶ | What the story shows | Its target | Target's earliest, Holmes | Lead on Holmes |
|---|---|---|---|---|---|
| `t70.1` watch, `t70.2` re-read | 70 | Holmes's gleam after Gregory's answers | the curry (`t37.6`, NOTICE) | ¶37, ¶216 | 146 ¶ |
| `t75.1` watch | 75 | he asks about Straker's character | `t46.4` (Straker took the horse) | ¶46, ¶220 | 145 ¶ |
| `t85.2` watch | 85 | he reads the bill line by line | the dress test (`t85.3`) | ¶85, ¶89 | 4 ¶ |
| `t31.2` watch | 31 | Holmes's wire about the stable door | access (`t31.3`) | ¶31, gate ¶57 | 26 ¶ |
| `t106.1` watch | 106 | "I only saw it because I was looking for it" | the match (`t92.9`, `ck.mud`) | ¶92, ¶102 | after Holmes |
| `t109.2` watch | 109 | he pockets the horseshoe | the tracks (`t92.11`, `ck.tracks`) | ¶92, ¶116 | 7 ¶ |
| `t111.2` watch | 111 | "let the name stand" | alive at Mapleton (`t40.4`), `t92.13` | ¶40, ¶116 | 5 ¶ |
| `t127.2` watch | 127 | who is about at dawn | `a.ask_groom` | ¶127 | 0 |
| `t156.2` watch | 156 | he leaves Dartmoor | the horse killed him (`t37.13`) | ¶37, gate ¶202 | 46 ¶ |
| `t161.3` watch | 161 | he asks for the photograph | `t84.6`, `ck.photograph` | ¶84, gate ¶161 | 0 (the same paragraph) |
| `t182.3` re-read | 182 | the curious incident | the dog (`t34.4`) | ¶34, gate ¶182 | 0 |
| plain GENRE (8) | 6–93 | the narrator's contract | method (`t12.1`, `t12.2`, `t38.1`) or the police (`t6.1`, `t14.4`, `t39.3`) | — | — |

What it means:
- **The story's own signals are the honest hint layer.** They come from the text at the paragraph the reader
  reads them, so a card for one cannot run ahead of the story. The leads are where hints are wanted:
  - the two signals with long leads (`t70.1`, `t75.1`) point back at the recital, where the decisive notices are;
  - `t156.2` points at the kick, 46 paragraphs ahead of the gate.
- **A watch-holmes card must name what Holmes visibly did, not what it implies.** "Holmes pocketed the horseshoe"
  is in ¶109. "He means to match a track at Mapleton" is the reader's inference, and it is the `ck.tracks`
  prediction, which scores until ¶116.
- **The Checks-tab confirmation** (`docs/review-ws7.md`, "Left open") would mark a sealed `ck.tracks` at ¶109,
  seven paragraphs before Holmes performs it. `docs/predictions.md` Q1 rules that "the game never says before Holmes
  acts whether a seal matches anything". So this is not available, except where the signal and the performance
  are the same paragraph (`t161.3` at ¶161, which the Checks tab already marks).

### 7. SET ASIDE: the cards

| Thought | ¶ | The detail | Its card | Used by the solution? |
|---|---|---|---|---|
| `t6.2` | 6 | the field-glass | `field_glass` | no |
| `t10.1` | 10 | the telegraph posts | `telegraph_posts` | no |
| `t24.5` | 24 | "the price of a new dress" | `new_dress` | no |
| `t128.1` | 128 | the half-crown | `half_crown` | no (a starting item) |
| `t192.2` | 192 | Bayard withdrawn | `bayard` | **yes** (the two horses, the tout's question) |
| `t118.1` | 118 | Holmes on imagination | none (a passage) | — |
| `t152.1` | 152 | the Colonel's manner | none (a passage) | — |

- **`irrelevant` already leaves out the first four**, but only if the player turns it down, and no preset does.
  It is the game deciding, from the answer key, what is scenery. Turned to `none` it would leave exactly the cards
  that matter, a leak by subtraction. So it is a different thing from the reader's move.
- **The reader's SET ASIDE is a choice made without the key.** It may be wrong: Bayard is used. Two of the seven
  thoughts set aside a passage, not a card.

## Questions, alternatives, recommendations

### Q1. Availability: what a reader setting changes

- **(a) Report only.** The reader marks drive a report column; play is unchanged, and every player stays an ideal
  1892 racing man.
- **(b) A reader setting that withholds.** A lacking rule arrives only where the story states it. This is honest,
  but a modern reader cannot reach the curry before ¶218 or the kick at all (§2). It is unplayable as a default.
- **(c) A reader setting that marks what the game supplies (recommended).** A new option, `reader`: `1892`,
  `racing` (1892 and racing-literate) or `modern`. For the chosen reader:
  - a rule the reader *holds* is background as today;
  - a rule the reader *lacks* is **supplied**. It still arrives by the background setting (at relevance, or on
    asking), but its card says so. "A reader of 1892 would know this", or "the story says this at ¶218", shown once
    the story has passed that paragraph, never before;
  - a second option, `supplied`: `offered` (the default, every preset) or `withheld` (the purist reading of (b),
    in no preset). Withheld rules arrive at their `source` paragraph or never. Gates are then computed per game
    (§2's never-told steps stop gating).

  "Partial" counts as lacking for the modern reader, as the annotation's fair-play table already treats opium's
  taste. The default reader is `modern`, since the player is one. The reader setting is not a difficulty: it says
  who the player is. Scoring is unchanged: a deduction made with a supplied card still scores. Supplied cards are
  the annotation's "natural hint system", and the player may decline them by setting `withheld`.
- **What replaces Strict:** two columns, **1892** and **modern**, by the challenge, each with the rules that reader
  holds plus those the story has stated by ¶157 (§3). Also a new report section, **Background by reader**: the §1
  table, with what each reader loses (§2).

### Q2. Disclosure on facts

- **(a) Computed only.** For rules, compare `ruleAt` with the `source` paragraph. For facts, nothing.
- **(b) A field on the few facts, computed for rules (recommended).**
  - **Rules:** `Game.disclosure(id)` returns `{at, told, supplied}`. `at` is where it arrives, `told` where the story
    states it (null if never), and `supplied` is true when it arrives earlier than it is told, or is lacking for
    the reader. No new data.
  - **Facts:** a `disclosure` field on a claim or an inference, in the shape of a check's `result`:
    - `{late: N}`: what should have been shown at ¶N is told at the card's own paragraph. `c.square_toes` is
      `{late: 119}`: seen at ¶119, told at ¶146;
    - `{never: true, policy}`: for the bill's items on `k.dove_silk_on_the_bill`, with `policy: "inferred"` (the
      player supplies it).

    The policies are `withhold` (as the story does), `background` (offered early) and `inferred` (the player
    supplies it). Today's choices stand (§4). Only the marks are new.
  - **Checks** keep `result` (ws 7). One reader of the three shapes, `Game.disclosure`, serves the facts, the rules
    and the checks.
  - **What the player sees:** at the end of the story, a short list, **What the story held back**:
    - the late facts, with both paragraphs;
    - the never-told results (the Checks tab's, gathered);
    - the facts the game supplied early, with the paragraph where the story finally says them.

    This is the annotation's audit, played back. Nothing is shown before the story passes the paragraph a mark
    names. The validator checks that each `late: N` is before the card's first mention, and that each `never` card
    is not quoted by a later paragraph.
- **(c) Change the policies.** For example, deal the square toes at ¶119. That changes where a card appears, which
  moves gates (Round 126's lesson). Not recommended without a reason from play.

### Q3. Profiles and hints

§5 shows that a hint timed by profile either gives the beat-Holmes move away or arrives with Holmes. The
alternatives:
- **(a) Profile-timed nudges** (the gap analysis's first idea): "a typical reader would have noticed by now".
  Rejected by the measurement, for the scored moves.
- **(b) Hints from the story's own signals (recommended), with the profile as the gate rule.** Three parts:
  1. **Expert thoughts never gate 'wait'.** A route step whose thought is `expert` is still scored if made before
     Holmes, but the 'wait' pace does not hold a paragraph for it: its inferences arrive as Holmes states them,
     as for a free-pace player. This moves `t37.13` (¶202) and `t102.4` (¶226) out of the gates. `t46.4` (¶111) goes
     too, but its needs stay required by `t81.5` at ¶102, so nothing changes there. Expert moves become bonuses,
     as the gap analysis asked.
  2. **The hint tier is the profile a hint may serve.** The `hints` option gains a value: `off`, `on` (today's: the
     counts and where to start) and `story` (today's plus the GENRE signals of Q4 as hints). Easy gets `story`;
     Medium and Hard keep `off`, as now. Nothing fires because the player is slow. A hint fires only where the story itself
     signals.
  3. **What a hint may name:** the paragraph range of a re-read, and held cards. It never names a conclusion, a
     slot value, a rule the player does not hold, or a card not yet dealt. Hint text is fixed templates over card
     names, plus the thought's own quote. Any new template goes through the leak checker.
- **(c) A catch-up hint after Holmes:** past a step's Holmes paragraph, Easy offers "Holmes has explained this;
  build it from …". It is harmless (it cannot score), but the 'wait' note already does it where it matters. Listed,
  not recommended.
- **Hints and the score:** no hint feeds any score function. A move made after a hint still scores if it is
  before Holmes. The story's signals are visible to every reader who reads the paragraph, so the hint only
  points back at what the reader just read.

### Q4. GENRE: a watch-holmes mark, a re-read action, the Checks tab

- **Watch-holmes.**
  - **(a) No mechanic.** The text is there to read.
  - **(b) A "Holmes's interest" log (recommended).** At each watch-holmes thought's paragraph, an entry: the quote,
    the paragraph, and the held cards it touches (from the thought's RECORD premise: the horseshoe, the bill, the
    photograph). There is no interpretation. It sits on the Questions tab beside "Odd things", it is never scored,
    and it shows when `hints` is `story`. The entries for `t70.1` and `t75.1` link to a re-read (below).
  - **(c) A player-made card "Holmes is interested in X".** This is a move worth less than reasoning, and decision 2
    keeps it unscored, so it would be bookkeeping. Listed.
- **Re-read.**
  - **(a) An action on the reading pane (recommended):** "Re-read with a question". The player marks a paragraph
    range they go back over, with an optional question card (a raised question, or a held card). It is recorded with
    its paragraph and never scored. The pane scrolls there and outlines the clickable spans. The two GENRE·re-read
    thoughts become **prompts** under `hints: story`:
    - at ¶70 (`t70.2`), "Holmes has seen something in what you have read: re-read ¶8–¶46";
    - at ¶182 (`t182.3`), "re-read ¶29–¶34".

    `t182.3` is typical, and its prompt comes with Holmes's own remark.
  - **(b) Prompts only, no action.**
- **The Checks tab when Holmes visibly prepares a check:** not before he performs it (§6, `docs/predictions.md` Q1).
  The log entry for ¶109 says only "Holmes put the horseshoe in his pocket". A player who sealed `ck.tracks` may draw
  the conclusion. Recommended: close the "Left open" item this way.
- **Plain GENRE** (the narrator's contract: `t6.1`, `t12.1`, `t12.2`, `t14.4`, `t38.1`, `t39.3`, `t34.6`, `t93.2`):
  no mechanic. `t38.1`'s "sort the recital" is the WEIGH machinery already. Listed in the review as held by
  existing moves, or not held.

### Q5. SET ASIDE

- **(a) A per-card state (recommended).** `Game.setAside(id)` / `restore(id)`. A set-aside card leaves the Cards
  list and the board (the timeline, the hand in the inference builder and the check dropdowns) and goes to a
  folded "Set aside (N)" list. It stays held: it still counts as a premise, inferences already built stand, and
  the game never says whether it was right to set it aside (the key is never consulted). It is saved and costs
  nothing. It works on entity, event and claim cards. The two passage thoughts (`t118.1`, `t152.1`) have no card
  and are not held.
- **(b) Fold into `irrelevant`.** This mixes the game's knowledge with the player's choice. Not recommended.
- **`irrelevant` stays** as an author's convenience. Every preset keeps `all`, and its label could say that a
  lower value leaves out cards the answer key marks as unused.

### Q6. The difficulty presets

| | Trivial | Easy | Medium | Hard |
|---|---|---|---|---|
| `reader` | modern (marks only) | modern | modern | modern |
| `supplied` | offered | offered | offered | offered |
| `hints` | — (the game solves) | `story` | `off` | `off` |
| Expert steps gate 'wait' | — | no | no | no |
| Holmes's interest log | shown | shown | hidden | hidden |
| Re-read action | — | yes | yes | yes |
| Set aside | yes | yes | yes | yes |
| What the story held back (the end) | shown | shown | shown | shown |

The reader is the player's choice in Options, not the difficulty's, so `presetOf` ignores it. `supplied:
withheld` is a custom choice.

## The cases as tests

| Case | Setting | Expected |
|---|---|---|
| Opium's taste supplied | modern, ¶40 | `r.opium_taste` held (relevant), `disclosure` says supplied, told ¶218; no "¶218" text before ¶218 |
| Opium's taste held | 1892, ¶40 | held, not marked supplied |
| Withheld | modern, `supplied: withheld` | `r.opium_taste` arrives ¶218; `k.drugger_knew_the_menu` not buildable before ¶218; no gate waits on `t102.4` |
| The kick never told | modern, withheld | `k.horse_kicked` never buildable; game finishes; no problem raised by gates |
| Report | — | Strict replaced by 1892 and modern columns matching §3; Background by reader table |
| The square toes | ¶150 | `disclosure(c.square_toes)` = late from ¶119, told ¶146 |
| The bill's items | end | "held back" lists them as never told, inferred |
| Held back list | ¶100 | nothing that names a paragraph after ¶100 |
| Expert gate | 'wait', ¶202 without `k.horse_kicked` | the paragraph is not held; `k.horse_kicked` arrives with Holmes; still scores if built at ¶150 |
| Watch-holmes log | Easy, ¶109 | an entry quoting ¶109, naming `horseshoe`; no Checks-tab mark on a sealed `ck.tracks` until ¶116 |
| Re-read prompt | Easy, ¶70 | "re-read ¶8–¶46"; Medium: none |
| Re-read action | any, ¶80 re-reads ¶20 | recorded, saved, unscored |
| Set aside | the field-glass at ¶7 | gone from Cards and dropdowns, in "Set aside"; restored on request; saved; no score row changes |
| Set aside a used card | Bayard at ¶192 | allowed, nothing said; inferences on it still build |
| No score from the layer | all | every `*Scores()` row identical with and without hints, log, re-reads and set-asides |
| Unchanged | default settings | reveal and foreshadow logs, clash log, `thoughts-report.md` unchanged; `report.md` only in the replaced column and the new section; gates only the two expert removals |

## Order of work (if agreed)

1. **The report** (validator only): the 1892 and modern columns replace Strict; the Background by reader section.
   The reader rule ("which marks a reader holds") goes in `engine/thoughts.js` beside `READERS`, for the engine to
   share.
2. **Disclosure as data** (data, schema, validator): `disclosure` on `c.square_toes` and `k.dove_silk_on_the_bill`;
   `Game.disclosure` returning the three shapes; the validator's checks.
3. **The reader setting** (engine): the `reader` and `supplied` options; supplied marks; `withheld` with per-game
   gates; tests from the cases. The background tab and card marks in the UI.
4. **Expert steps stop gating** (engine): diff the gates (the two removals expected).
5. **Set aside and re-read** (engine and UI): `setAside`, `restore`, `reread`; saved.
6. **Hints from the story** (engine and UI): `hints: story`; the Holmes's interest log; re-read prompts; the held-back
   list at the end. New template text through the leak checker. Checked in headless Chrome.
7. **The short review** of the GENRE and SET ASIDE thoughts and the background marks.

Each step is one commit with a Round entry, gated on `npm test`. The logs, the reports and the gate listing are
diffed before and after.

## For Robert

1. **Q1:** a `reader` option (1892, racing, modern; default modern; "partial" counts as lacking) that marks rules
   as supplied, with an optional `supplied: withheld` for purists. Do the 1892 and modern columns replace Strict?
2. **Q2:** `Game.disclosure` covering rules (computed), facts (a `disclosure` field on the square toes and the
   bill's items) and checks, with today's policies kept, and a "What the story held back" list at the end?
3. **Q3:** no profile-timed hints (§5); expert steps stop gating 'wait' but still score; hints only where the story
   signals (`hints: story`)?
4. **Q4:** a Holmes's interest log that quotes and names held cards, never interprets; a re-read action with the two
   re-read prompts; no Checks-tab mark before Holmes performs?
5. **Q5:** a per-card set aside, held and silent, separate from `irrelevant`?
6. **Q6:** the presets as tabled?
7. **The order of work** above?

## Agreed (Robert, Round 133)

The recommendations of Q1–Q6 as written, and the order of work.

**At build time (Rounds 134–139):**
- **"Supplied" means this reader lacks it** (Round 136). A rule offered before the story states it is `early`; an 1892
  reader's opium's taste is early but their own, so "held back" lists only the supplied (the paper's case "Opium's
  taste held"). The report keeps the 36 early rules.
- **Expert steps** took their follow-on gates with them: `t46.4` at ¶220 and `t37.13` at ¶226 as well as the three
  named. `k.horse_kicked` now reaches a free-pace player at ¶226, Holmes's explanation (Round 137).
- **The re-read prompts** needed their passages as data: `passage` on `t70.2` and `t182.3` (Round 139).

**Changed (Robert, Round 207): Re-read removed.** The Re-read button did nothing that scrolling back in the story cannot
(the passage outlined, a question shown, a record nothing read). Removed with it: `Game.reread` and `rereads` (an old
save's re-reads are dropped on load), the form, the outline and "Your re-reads", the re-read signals of Q4 (the two
places the story points back on Easy, ¶70 and ¶182), and the reader's two re-read moves from the action table. The
annotation keeps `t70.2` and `t182.3` and their `passage`: the reader's thoughts, no longer a move. Holmes's interest
(Q4's watch-holmes log) stays.
