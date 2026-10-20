# The annotation reviewed as a reader's paper

Status: **AGREED** (Robert, 2026-10-19, Round 183: every recommendation, Q1–Q8, and the batches in their order). B1 with B5's mirror and id checks built (Round 183). Written Round 182. Piece 1 of `docs/kickoff-annotations.md`: a general review of the annotation's
content (`docs/reading-annotated.md`, the annotator's record, and `cases/silver-blaze/thoughts.json`, the same as
data), a verdict per thought, the fixes by kind in batches for Robert to agree. Earlier reviews looked at what the case
holds of each thought (`docs/annotation-review.md`) and what the game lets the player do with it
(`docs/review-closing.md`); this one reads the annotation itself: its prose, its honesty, its dates and its
consistency, and asks of each thought whether it can be typed into the story as a first-time reader's note (the
autoplay's need, `docs/autoplay.md` A3). Nothing is changed until Robert agrees.

## How it was measured

- **A dump per thought** (the session's scratch scripts `measure.mjs` and `dump.mjs`): the story's paragraphs in
  order, each followed by the thoughts dated there, as `docs/reading-annotated.md` writes them, with the
  `thoughts.json` fields the markdown does not show (`maps`, `inference`, `date_note`, `hindsight`, `candidates`, …).
- **Mechanical flags:** every thought or card id and every `¶` the prose cites, and whether it lies ahead of the
  thought's paragraph; every ⚠; phrases in the annotator's voice (scoring, "the game", "a reader who …", "for
  everyone else", "Added in Round …"); every field of the two files compared (prose, `reads`, `from`, relations,
  Holmes's dates, tags, subtypes, confidence, profile, the ⚠ level).
- **Then every thought read by hand at its paragraph,** with the story's text up to there, as a first-time reader
  would have it: does the prose say only what that reader could think; is it the reader's note or the annotator's
  comment on it; are its date and premises right; do the two files agree.

## What was found

| | Thoughts |
|---|---|
| All | 296 |
| With prose | 206 |
| Reading words with no prose (a highlight alone) | 85 (the autoplay paper said 81) |
| Neither (`t64.2`, `t202.2`, `t220.2`, `t221.2`, `t229.2`: TESTs the story settles) | 5 |
| **Clean**: the prose is the reader's note, honest at its paragraph, and can be typed as it stands | **108** |
| **Needing something** | **98** (with prose) |

The 98, by what they need (a thought can need more than one):

| Kind | Thoughts | What it is |
|---|---|---|
| **remark** | 58 | The prose carries the annotator's comment beside the reader's note: the ⚠ notes (15), the 20 forward references, scoring ("A reader who made `t92.10` scores it here", 7), game design ("The game should offer it as a background card", 8), remarks about readers ("Most readers jump to the drug"), and the history ("Added in Round 42", 12 in the markdown, 1 in the data). |
| **typed** | 28 | The reader's note is honest but cites earlier thoughts by id (`t37.7`'s "knew"), cards (`bk.blaze`) or paragraphs, which the autoplay cannot type: it needs the same in words. |
| **mirror** | 23 | The two files disagree (below), three of them in substance. |
| **ahead** | 5 | The reader's own note says something the reader cannot have yet, with no reference to show it. |
| **alt-reader** | 5 | Written for a reader other than the one who made the earlier moves ("For everyone else: go back to ¶29 …"). |
| **hindsight, unmarked** | 3 | A move that leans on knowing the end, with no ⚠: for Robert. |

### The two files

The markdown is the annotator's record, the data its mirror; `npm test` checks that ids and tags agree, and nothing
else. Compared field by field:

- **In substance (3):** `t92.6`'s prose in `thoughts.json` is **broken**: five of its nine steps lost their last line
  when the data was generated (step 3 ends "away from the loft", step 8 "The best candidate for the blow is the"). `t57.3`
  cites `t81.2`, the knife's notice before Round 160 renamed it `t80.2` (the markdown has `t80.2`). `t146.2` cites
  `t123.2`, which does not exist (the markdown has `t122.3`, as its relation does).
- **`from` (3):** `t78.2` cites `t35.2` in the data only; `t122.3` cites `bk.leading_intent` in the data only (the card
  was added to the data in a later round); `t224.1` cites `t78.1`, `t102.2` in the data only. The data is right in
  each; the markdown lags.
- **`reads` (1):** `t135.1` reads "Oh, come in if you wish to." in the data only.
- **History notes (13):** "(Added in Round 42: Holmes's step, which a careful reader can take here.)" and "(Dated ¶95
  in Round 160: …)" are in the markdown's prose only (12 thoughts), and in the data's only for `t34.8` (without its
  Round).
- **Notation:** `INFER·opportunity` (`t29.3`) is a subtype the data allows and the markdown's tag table does not list;
  `t92.9`–`t92.14` write their prose on the header line after "Holmes ¶…:", which the markdown's own format puts on
  a line of its own. Bold in the markdown (`**the visitor was someone the dog knew**`) is plain in the data: that is
  presentation, and the check should ignore it.

Tags, subtypes, confidence, profile, relations, Holmes's dates and the ⚠ levels agree everywhere.

### Honesty

- **The 20 forward references** (`docs/autoplay.md` A3) are all the annotator's: in each, the reader's note stands
  without them. `t4.2` "it has to be broken later (`t68.3`)", `t6.2` "used only to watch the race (¶199)", `t18.3`,
  `t19.1`, `t20.4`, `t21.2`, `t24.5`, `t28.3`, `t35.8`, `t37.10`, `t37.13`, `t39.4`, `t57.3`, `t64.3`, `t81.5` ("nicking
  a tendon under the skin, ¶221"), `t92.4` ("Holmes says as much at once, ¶93"), `t92.8` ("Holmes leaves the access
  question open (¶218)"), `t93.2` ("the answer to ¶96"), `t188.2` ("Holmes, ¶214"); and `t34.4`, below.
- **Five more say what the reader cannot have, without a reference** (verdict **ahead**):
  - `t14.1` "missing since Tuesday morning": at ¶14 the reader has Tuesday's telegrams and "another morning", not
    the hour (Monday night is ¶19, the morning ¶33). → "missing for days".
  - `t25.1` "The police theory depends on the answer": the police's window theory is told at ¶36. → "Whether he
    could have reached it depends on the answer."
  - `t34.4` "(only the lad's supper was analysed, `t37.3`)": the analysis is ¶37. → removed.
  - `t152.1` "the explanation for the race-day surprise": the race is ¶183–¶214. → "he means to have some fun with
    the Colonel."
  - `t6.2`: setting the field-glass aside at ¶6 is itself hindsight (the reader cannot know it carries nothing). The
    move can stand as a reader's guess: "For watching something far off, presumably; nothing to make of it yet."
- **The 15 ⚠ notes are right and still needed:** each marks a step a first-time reader rarely makes (`t37.13` and
  `t102.4` the horse as the killer, `t46.4` the victim as the instigator, `t92.14` the practice) or a fact disclosed
  late (`t146.1` the square toes; `t218.1`, `t220.1`, `t221.1` the background first stated by Holmes). They are the
  annotator's record of the honesty problem and belong with the thought, but not in the reader's note.
- **Three unmarked leanings on the end** (for Robert, Q5): `t21.2` expects a cravat in the maid's description, which
  only the cravat at ¶35 suggests (expert, and Round 93 left it unheld: a ⚠ high, or retired?); `t34.2`, the silent
  dog, which the annotator calls the hardest move in the story (a ⚠ medium, as the most famous line of the story makes
  it easy for anyone who knows it?); `t60.3` "as a strap or tie", close to Holmes's own guess at ¶226 (a ⚠ low?).

### The prose as a note

Most prose is the reader's note, short and in the reader's voice (108 clean). The rest mixes in the annotator's
comment, of six sorts, each a sentence or a parenthesis that comes off cleanly:

1. the ⚠ notes (15);
2. forward references (20);
3. scoring: "A reader who made `t92.10` scores it here" (`t95.2`, `t111.2`, `t114.3`, `t182.2`, `t198.2`, `t212.2`,
   `t216.2`); in `t182.2` and `t212.2` it is the whole prose;
4. game design: "The game should offer it as a background card early on" (`t6.2`, `t38.1`, `t81.5`, `t107.2`,
   `t114.2`, `t128.1`, `t163.3`, `t218.1`);
5. readers in general: "Most readers jump to the drug" (`t24.3`), "Most first-time readers miss this. It is the hardest
   move in the story" (`t34.2`), "A typical reader passes over it inside the action" (`t29.1`);
6. history: "Added in Round 42" (13).

**Alt-reader thoughts** (5): `t70.2` ("For a reader who missed `t37.6`, this is the prompt"), `t173.2` ("For an expert
who made `t92.14` … For everyone else"), `t175.1` ("For a reader who didn't predict it"), `t182.3` ("For everyone
else: go back to ¶29 and ¶34") and `t212.3` ("For everyone else, …") are written for a reader who did not make an
earlier move. The annotation's reader (and the autoplay, which plays every move) did make it, so typed as they stand
they contradict the notes before them. Their note, typed, should be the one that reader writes (Q4); the annotation
keeps both readers.

### Dates and premises

- **Round 166's three "not slips":** `t34.5` was the table script's order (fixed in Round 168); `t56.1`'s second raise
  and `t64.3`'s disguise need cards the story tells at ¶60 and ¶66. Read at their paragraphs, both thoughts are honest
  as written (`t56.1` weighs what Gregory has just said; `t64.3` needs only ¶64's search and the horse's name): the
  late part is the game's card, which the review recorded. **Close.**
- **The five `date_note`s** (`t4.2`, `t20.6`, `t29.3`, `t31.3`, `t36.2`) each say why the game can hold the step only
  later than the reader has it; each still matches the case. **Keep.**
- **`from` lists:** none cites a later thought. One prose slip: `t124.2` says "Since Mapleton was searched (`t64.1`)",
  but `t64.1` is the ten-mile search of ¶64; Mapleton's own search is `t66.1` (¶66). Its typed note says it in words.
- **Tags:** one tag fights its confidence: `t102.4` is an **INFER** ("as good as certain") at *weak*, through
  `bk.horse_kick`, a world rule: a **PHYSICAL** step (Q7). The rest fit.
- **Holmes's dates:** 108 thoughts that are not RECORDs have none (neither a paragraph nor "Holmes —"), mostly
  TESTs, GENREs and hypotheses where none applies. Listed, not worth changing.

### What `npm run validate-thoughts` does not check

- That the markdown mirrors the data **beyond ids and tags**: prose, `reads`, `from`, relations, Holmes's dates. The
  three substantive slips above went unseen.
- That **an id the prose cites exists** (`t123.2` does not, `t81.2` no longer does) and **lies no later** than the
  thought.
- That **a `¶` the prose cites lies no later** than the thought.
- **The typed form's rules** (`docs/autoplay.md` A3): no ⚠, no backtick, no `¶`, no thought or card id, in a `typed`
  and in any prose the autoplay types as it stands.

### Left open from earlier reviews

Read again as questions about the annotation (not the game):

| Item | Verdict |
|---|---|
| The "advise" template (`t92.13`) | The thought is honest and clean; holding it is a game question. **Close here** (it stays in the game's list). |
| Strains by improbability (`t24.4`, `t37.11`, `t120.2`) | Clean and honest; the case holds them authored. **Close here.** |
| Corroboration (`t26.1`, `t36.3`) | Clean. **Close here.** |
| The plain GENRE thoughts | Clean notes; nothing to score. **Close here.** |
| `t40.7` (nothing to doubt in Simpson's pallor) | Clean: it weighs and finds the pallor neutral, which is a reader's thought. **Keep as it is.** |
| `t21.2` (the cravat's absence) | Hindsight (above, Q5). **For Robert.** |
| `t78.4` (no lantern) | Clean and honest; unheld for its weak witness. **Keep.** |
| The rule `category`, theories proposing their own predictions, the purist at the story's gates | Not the annotation's. **Close here.** |

## Verdicts

The **clean** thoughts and those that **read words with no prose** (a highlight alone) are listed per scene; every
other thought has a row. Fix kinds: **B1** the two files agree; **B2** the annotator's remarks into their own field;
**B3** honesty; **B4** the typed notes; **B5** the validator's new checks (below).

### s01 Breakfast at Baker Street (¶1–¶7)

Clean: `t4.1`, `t6.1`.

| Thought | Tag | Verdict | Problem | Fix |
|---|---|---|---|---|
| `t4.2` | DEFAULT | remark | "The reader holds this without noticing it; it has to be broken later (`t68.3`)": forward. | B2 |
| `t6.2` | SET ASIDE | remark, ahead | "It is used only to watch the race (¶199) … A player who instead files it as a prediction shouldn't be penalised": forward and game design; the set-aside reads as hindsight. | B2; B3: "A field-glass, asked for by name. For watching something far off, presumably; nothing to make of it yet." |

### s02 The train: the facts of the case (¶8–¶46)

Clean: `t10.1`, `t12.1`, `t14.2`, `t14.4`, `t18.2`, `t19.3`, `t19.4`, `t19.5`, `t20.5`, `t20.6`, `t20.7`, `t24.2`,
`t24.4`, `t26.1`, `t28.2`, `t29.3`, `t29.4`, `t31.2`, `t31.3`, `t31.4`, `t32.3`, `t32.4`, `t33.2`, `t34.5`, `t35.2`,
`t35.7`, `t35.9`, `t35.10`, `t36.2`, `t36.3`, `t37.4`, `t37.5`, `t37.7`, `t37.8`, `t37.9`, `t37.11`, `t37.12`, `t39.2`,
`t39.3`, `t40.3`, `t40.4`, `t40.5`, `t40.6`, `t40.7`, `t41.2`, `t44.2`, `t46.2`.
A highlight alone: `t18.1`, `t19.2`, `t20.1`, `t20.2`, `t20.3`, `t21.1`, `t24.1`, `t28.1`, `t29.2`, `t31.1`, `t32.1`,
`t32.2`, `t33.1`, `t34.1`, `t35.1`, `t35.3`, `t35.4`, `t35.5`, `t36.1`, `t37.1`, `t37.2`, `t37.3`, `t39.1`, `t40.1`,
`t40.2`, `t41.1`, `t44.1`, `t46.1`.

| Thought | Tag | Verdict | Problem | Fix |
|---|---|---|---|---|
| `t12.2` | GENRE | remark | "This licenses the WEIGH moves below." | B2 |
| `t14.1` | RECORD | ahead | "missing since Tuesday morning": not told by ¶14. | B3: "missing for days" |
| `t14.3` | HYPOTHESIS | typed | Cites `bk.famous_horse`. | B4 |
| `t18.3` | NOTICE | remark | "This becomes a question once we learn the horse was led out (`t57.3`)": forward. | B2 |
| `t19.1` | RECORD | remark | The prose is "Straker." and a ⚠ that names `t84.7`: forward. | B2 (typed: "Straker.") |
| `t20.4` | NOTICE | remark | "Weak now; it becomes strong at `t37.6`": forward. | B2 |
| `t21.2` | ABSENCE | remark, hindsight | "The maid later recognises one (`t35.5`)": forward; expecting a cravat at ¶21 needs the cravat of ¶35. | B2; Q5 |
| `t24.3` | HYPOTHESIS | remark | "Most readers jump to the drug." | B2 |
| `t24.5` | SET ASIDE | remark | "A dress returns at ¶84 and ¶91": forward. | B2 (typed: "The new dress is only the colour of the bribe.") |
| `t25.1` | QUESTION | ahead | "The police theory depends on the answer": told at ¶36. | B3 |
| `t28.3` | HYPOTHESIS | remark | ⚠ medium with `bk.lay_against` and ¶192: forward. | B2 |
| `t29.1` | RECORD | remark | "A typical reader passes over it …; the dog inference later rests on it." | B2 |
| `t34.2` | ABSENCE | remark, hindsight | "Most first-time readers miss this. It is the hardest move …" | B2; Q5 |
| `t34.3` | WEIGH | typed | Cites `t34.2`; "the text's own defeater" is notation. | B4 |
| `t34.4` | HYPOTHESIS | ahead | "(only the lad's supper was analysed, `t37.3`)": ¶37. | B3: removed |
| `t34.6` | GENRE | remark | ⚠ medium. | B2 |
| `t34.7` | DEFAULT | typed, mirror | "(`t34.3`)"; the markdown's "(Added in Round 44 …)". | B4, B2 |
| `t34.8` | ABSENCE | mirror | "(Added in the annotation review …)" in both, with its Round in the markdown only. | B2 |
| `t35.6` | WEIGH | typed | "the 'embellishment' `t12.2` warned about". | B4 |
| `t35.8` | NOTICE | remark | "It stays weak until the wind is known (¶94–¶96)": forward. | B2 (typed: "It stays weak: the wind could have carried it there.") |
| `t37.6` | REVISE | remark | ⚠ low with `bk.opium_taste`. | B2 |
| `t37.10` | HYPOTHESIS | remark | "(Dropped at `t92.7`.)": forward. | B2 |
| `t37.13` | HYPOTHESIS | remark | ⚠ high with ¶212: forward. | B2 |
| `t37.14` | DEFAULT | mirror | The markdown's "(Added in Round 42 …)". | B2 |
| `t37.15` | DEFAULT | typed, mirror | "she survives through `t37.7`'s 'knew'"; "(Added in Round 42.)". | B4, B2 |
| `t37.16` | INFER | mirror | "(Added in Round 53.)". | B2 |
| `t38.1` | GENRE | remark | "The game could make this sorting an explicit task." | B2 |
| `t39.4` | HYPOTHESIS | remark | "Holmes states it in full at ¶46 (`t46.1`)": forward. | B2 |
| `t46.3` | RESIDUE | typed | Eight items, each citing ids. | B4: the list in words |
| `t46.4` | HYPOTHESIS | remark | ⚠ high, "The residue list (`t46.3`) is what pushes towards it." | B2 |
| `t46.5` | QUESTION | typed | "Only `t28.3` hints at a motive so far." | B4: "Only the tout's question about the stable's money hints at one so far." |
| `t46.6` | QUESTION | typed | "(`t37.13`)". | B4 |
| `t46.7` | INFER | mirror | "(Added in Round 55.)". | B2 |

### s03 Tavistock and the drive with Gregory (¶47–¶69)

Clean: `t54.1`, `t56.1`, `t57.2`, `t58.3`, `t58.4`, `t60.2`, `t60.3` (but Q5), `t62.2`, `t62.3`, `t62.4`, `t66.3`,
`t68.2`, `t68.3`. A highlight alone: `t52.1`, `t58.1`, `t58.2`, `t60.1`, `t62.1`, `t64.1`, `t66.1`, `t68.1`.

| Thought | Tag | Verdict | Problem | Fix |
|---|---|---|---|---|
| `t57.1` | TEST | remark | "items 3, 4 and 5 of the reader's list … A reader who built the list can check it against his." | B2 (typed: "Holmes's objections are on my list: the key, why take the horse out, where a stranger could hide him; and he adds the paper.") |
| `t57.3` | QUESTION | remark, mirror | "It waits for the knife (`t80.2`) and the candle (`t78.3`)": forward; the data cites `t81.2`. | B1, B2 |
| `t60.4` | INFER | mirror | "(Added in Round 54.)". | B2 |
| `t64.2` | TEST | empty | No prose, no `reads`. | — (Q6) |
| `t64.3` | HYPOTHESIS | remark | ⚠ medium with `bk.blaze`, ¶198: forward. | B2 |
| `t66.2` | TEST | typed | "counts against `t40.4` only as far as `t64.3` lets it". | B4 |

### s04 Straker's villa: the pockets and Mrs. Straker (¶70–¶92)

Clean: `t70.1`, `t75.1`, `t78.3`, `t78.4`, `t78.5`, `t81.3`, `t81.4`, `t82.2`, `t82.3`, `t82.4`, `t84.3`, `t84.4`,
`t84.5`, `t84.6`, `t84.7`, `t84.8`, `t85.2`, `t85.3`, `t92.3`, `t92.5`, `t92.7`, `t92.13`. A highlight alone: `t78.1`,
`t80.1`, `t81.1`, `t82.1`, `t84.1`, `t84.2`, `t85.1`, `t92.1`.

| Thought | Tag | Verdict | Problem | Fix |
|---|---|---|---|---|
| `t70.2` | GENRE | remark, alt-reader | "For a reader who missed `t37.6`, this is the prompt; a reader who already has it can confirm being there first." | B2 |
| `t78.2` | INFER | mirror | `from` `t35.2` in the data only. | B1 |
| `t80.2` | NOTICE | remark, mirror | "This is the loudest clue in the story, and the story says so through Holmes"; the markdown's "(Dated ¶80 in Round 160 …)". | B2 (typed: "… Holmes calls it a very singular knife.") |
| `t81.5` | INFER | remark | "(nicking a tendon under the skin, ¶221)": forward; "the game should accept it. The game holds it as a conditional …". | B2 |
| `t84.9` | DEFAULT | typed, mirror | "(`t84.4`)"; "(Added in Round 46 …)". | B4, B2 |
| `t92.2` | INFER | remark, typed | "he is running `t85.3`"; "The reader has to supply this link. Fair-play note: …". | B2, B4 |
| `t92.4` | TEST | remark | "(Holmes says as much at once, ¶93.)": forward. | B2 |
| `t92.6` | HYPOTHESIS | typed, mirror | Nine steps citing ids; the data's prose is broken (five steps cut short). | B1, B4: the nine steps in words |
| `t92.8` | QUESTION | remark, typed | "The default of `t37.16`"; "Holmes leaves the access question open (¶218)": forward. | B2, B4 |
| `t92.9`–`t92.12` | PREDICT | mirror | The prose on the header line in the markdown. | B1 |
| `t92.14` | AGENT | remark | ⚠ high. | B2 |
| `t92.15` | INFER | mirror | "(Added in Round 55.)". | B2 |

### s05 The hollow (¶93–¶113)

Clean: `t97.2`, `t100.1`, `t101.2`, `t102.3`, `t106.1`, `t108.2`. A highlight alone: `t93.1`, `t95.1`, `t97.1`,
`t99.1`, `t101.1`, `t102.1`, `t107.1`, `t108.1`, `t109.1`, `t111.1`.

| Thought | Tag | Verdict | Problem | Fix |
|---|---|---|---|---|
| `t93.2` | GENRE | remark | "the narration has already absorbed the answer to ¶96": forward. | B2 (typed: "The narrator says 'hung', where earlier the coat was 'flapping'. Watson writes after the event; the word may already carry the answer.") |
| `t95.2` | PHYSICAL | remark, mirror | "A reader who made `t92.10` scores it here"; "(Dated ¶95 in Round 160 …)". | B2 |
| `t102.2` | TEST | typed | "Step 7 of the inside story holds." | B4 |
| `t102.4` | INFER | remark | ⚠ high, "as with `t37.13`"; the tag (Q7). | B2 |
| `t107.2` | ABSENCE | remark | "The reader is shown the test (`t101.2`) but not its outcome. This is a fair-play gap, and the game has to choose …". | B2 |
| `t109.2` | GENRE | typed | "That is the reader's `t92.11`." | B4 |
| `t111.2` | GENRE | remark | "A reader who made `t92.13` scores it here." | B2 |

### s06 Across the moor to Mapleton (¶114–¶143)

Clean: `t116.2`, `t116.3`, `t117.2`, `t120.1`, `t120.2`, `t120.3`, `t122.3`, `t127.2`, `t127.3`, `t127.4`, `t140.2`,
`t141.2`. A highlight alone: `t114.1`, `t116.1`, `t117.1`, `t119.1`, `t122.1`, `t122.2`, `t124.1`, `t127.1`, `t133.1`,
`t137.1`, `t140.1`.

| Thought | Tag | Verdict | Problem | Fix |
|---|---|---|---|---|
| `t114.2` | DEFAULT | remark | "The reader's route (`t40.4` …) arrived at ¶40 … Both should be valid in the game." | B2 |
| `t114.3` | TEST | remark | "A reader who made `t62.4` scores it." | B2 |
| `t118.1` | SET ASIDE | typed | "It repeats `t39.3`". | B4 |
| `t122.3` | AGENT | mirror | `from` `bk.leading_intent` in the data only. | B1 |
| `t124.2` | INFER | typed | "Since Mapleton was searched (`t64.1`)": the wrong search (Mapleton's is `t66.1`); "the disguise (`t64.3`)". | B1 (cite `t66.1`), B4 |
| `t128.1` | SET ASIDE | remark | "(The game uses the half-crown as a starting item.)" | B2 |
| `t135.1` | WEIGH | mirror | `reads` in the data only. | B1 |
| `t141.1` | HYPOTHESIS | remark | ⚠ medium "the reader needs `t64.3` already in mind". | B2 |

### s07 The walk back (¶144–¶156)

Clean: `t148.2`, `t150.1`. A highlight alone: `t148.1`, `t156.1`.

| Thought | Tag | Verdict | Problem | Fix |
|---|---|---|---|---|
| `t146.1` | RECORD | remark | The prose is all a ⚠ fair-play note. | B2 (typed: "Square toes: nothing was said of them when we followed the tracks.") |
| `t146.2` | TEST | typed, mirror | Cites `t123.2` (no such thought) in the data, `t122.3` in the markdown. | B1, B4 |
| `t146.3` | RECORD | remark | "(`bk.blaze`). For a modern reader, this is the first time it is given." | B2 |
| `t152.1` | SET ASIDE | ahead | "the explanation for the race-day surprise". | B3 |
| `t156.2` | GENRE | remark | ⚠ medium. | B2 |

### s08 Departure: the photograph, the sheep, the dog (¶157–¶182)

Clean: `t163.2`. A highlight alone: `t161.1`, `t163.1`, `t173.1`, `t182.1`.

| Thought | Tag | Verdict | Problem | Fix |
|---|---|---|---|---|
| `t161.2` | TEST | typed | "as `t92.13` predicted". | B4 |
| `t161.3` | GENRE | remark | "A reader who made `t92.5` sees Holmes carrying out the same plan." | B2 |
| `t163.3` | HYPOTHESIS | remark | "(`t92.8`). The game could let the player write the question Holmes asked." | B2 |
| `t173.2` | TEST | remark, alt-reader | "For an expert who made `t92.14`, the prediction is scored. For everyone else …". | B2, Q4 |
| `t175.1` | INFER | remark, alt-reader | "For a reader who didn't predict it:". | B2, Q4 |
| `t182.2` | TEST | remark | The whole prose is a score: "scores it here, 148 paragraphs ahead". | B2 (typed: "The dog that did nothing: the silence I marked that morning.") |
| `t182.3` | GENRE | remark, alt-reader, typed | "For everyone else: go back to ¶29 and ¶34 … (`t34.4`)". | B2, B4, Q4 |

### s09 The Wessex Cup (¶183–¶214)

Clean: `t186.1`, `t214.2`. A highlight alone: `t188.1`, `t191.1`, `t192.1`, `t198.1`, `t200.1`, `t202.1`, `t204.1`,
`t212.1`, `t214.1`.

| Thought | Tag | Verdict | Problem | Fix |
|---|---|---|---|---|
| `t188.2` | NOTICE | remark, mirror | "(Holmes, ¶214, 'stand[s] to win a little'.)": forward; "(Dated ¶188 in Round 160 …)". | B2 |
| `t192.2` | SET ASIDE | typed | "its general pattern lived on in `t84.8`". | B4 |
| `t198.2` | IDENTIFY | remark | "A reader who made `t64.3` or `t141.1` scores it before Holmes says so." | B2 |
| `t202.2` | TEST | empty | | — (Q6) |
| `t212.2` | TEST | remark | The whole prose is a score: "A reader who made `t37.13` scores the hardest step in the story." | B2 (typed: "The horse, as I half suspected.") |
| `t212.3` | REVISE | remark, alt-reader | "For everyone else," | B2 |

### s10 The explanation on the train home (¶215–¶231)

Clean: `t229.1`. A highlight alone: `t216.1`, `t218.2`, `t226.1`, `t228.1`, `t231.1`.

| Thought | Tag | Verdict | Problem | Fix |
|---|---|---|---|---|
| `t216.2` | TEST | remark | "A reader who made `t37.6`–`t37.8` at ¶37 was ahead of Holmes by 32 paragraphs". | B2 (typed: "Holmes held the police theory until the carriage reached the house. I had the curry before he did.") |
| `t218.1` | RECORD | remark | ⚠ fair play, "The game should offer it as a background card early on." | B2 |
| `t218.3` | NOTICE | typed | "`t92.8` is answered only by the default of `t37.16` …". | B4 |
| `t219.1` | TEST | typed | "(`t34.3`) the same way the reader did". | B4 |
| `t220.1` | RECORD | remark | ⚠ fair play. | B2 |
| `t220.2` | TEST | empty | | — (Q6) |
| `t220.3` | NOTICE | typed | "at ¶218", "the default of `t37.16`" (earlier, but ids). | B4 |
| `t221.1` | RECORD | remark | ⚠ fair play with `bk.tendon_nick`, `t81.5`. | B2 |
| `t221.2` | TEST | empty | | — (Q6) |
| `t223.1` | TEST | typed | "The turn-around (`t57.3`) had two answers". | B4 |
| `t224.1` | TEST | remark, mirror | "a character in the story performs a reader's move"; `from` in the data only. | B1, B2 |
| `t225.1` | TEST | typed | "(`t92.2`)". | B4 |
| `t226.2` | REVISE | remark, typed | "The moment the old cards change meaning"; "(the second mechanism of `t44.2`)". | B2, B4 |
| `t226.3` | WEIGH | typed | "`t60.3` stays a hypothesis". | B4 |
| `t229.2` | TEST | empty | | — (Q6) |

## The fixes, in batches

Each batch one Round, gated on `npm test`; the logs, the reports and the gate listing diffed before and after.
None changes a thought's `maps`, `reads`, `inference`, `notices`, `raises`, `checks`, `dropped`, `asks`, `passage`,
`aside` or `candidates`, so **no move of the action table changes**. Q7 changes a tag, which the table writes into
its row, so `npm run action-table` reruns with it, and with any batch that touches `thoughts.json`, to be safe.

- **B1, the two files agree** (both files): `t92.6`'s prose restored in the data; `t57.3`'s `t81.2` → `t80.2`;
  `t146.2`'s `t123.2` → `t122.3`; the markdown takes the data's `from` (`t78.2`, `t122.3`, `t224.1`) and `reads`
  (`t135.1`); `t92.9`–`t92.14` written in the markdown's own format; `INFER·opportunity` in the tag table; `t124.2`
  cites `t66.1`.
- **B2, the annotator's remarks in their own field:** a field **`remark`** on the 58 thoughts (and the 13 with a history
  note), taking each remark out of `text`, which keeps only the reader's note. The ⚠ notes go there too (the
  `hindsight` level stays). In the markdown, the remark on a line of its own under the note, marked (Q1). Where the
  remark was the whole prose (`t146.1`, `t182.2`, `t212.2`, `t218.1`, `t220.1`, `t221.1`), the thought keeps a short
  note of the reader's (the drafts above) or none.
- **B3, honesty:** `t6.2`, `t14.1`, `t25.1`, `t34.4`, `t152.1` reworded, both files; and the ⚠ Robert chooses (Q5).
- **B4, the typed notes** (`docs/autoplay.md` A3 a): a field **`typed`** on each thought whose `text`, after B2, still
  cannot be typed: the 28 above, the alt-reader ones (Q4), and, if Robert agrees, those with sets in braces (Q3, 15
  thoughts). Drafted mechanically, then read and fixed by hand; earlier thoughts cited in words ("as I planned").
  The LLM leak checker over every note the autoplay will type (the typed notes and the clean prose), each against its
  paragraph (Robert: its cost has been trivial).
- **B5, the validator** (`engine/thoughts.js`, `scripts/validate-thoughts.js`, a test in `engine/thoughts.test.js`):
  - the markdown mirrors the data in prose (bold ignored), `reads`, `from`, relations and Holmes's dates, as well as
    ids and tags (a remark compared with the markdown's marked line);
  - every id the prose or remark cites exists; one in `text` lies no later than the thought, and so does a `¶` (a
    forward reference belongs in `remark`);
  - a `typed`, and a `text` without one, has no ⚠, backtick, `¶` or thought or card id (and no braces, if Q3);
  - the thoughts report gains a count: notes the autoplay types as they stand, typed forms, highlights alone, nothing.

Recommended order: **B5's mirror and id checks with B1** (the check finds the slips, the fix clears them), then **B2**,
**B3**, then **B4 with the rest of B5**. B1–B3 are one session's work; B4 is the larger, about 50 notes drafted and read.

## For Robert

1. **The remark field:** name it `remark`, and show it in the markdown on its own line under the reader's note,
   marked "*Note:*" (recommended); or keep the remarks in the prose and give every thought that has one a `typed`
   form instead (more typed forms, nothing moved)?
2. **The typed notes' voice:** a note in the first person where the reader speaks of an earlier move ("as I planned",
   "I had the curry before he did"), otherwise impersonal, as the prose is (recommended)? Or always impersonal ("as
   planned")?
3. **Sets in braces** (`{drug, money, message}`, 15 thoughts): typed as a plain question ("What is in the folded
   paper: a drug, money, a message?", recommended), or typed with the braces?
4. **The alt-reader thoughts** (`t70.2`, `t173.2`, `t175.1`, `t182.3`, `t212.3`): their typed note is the one the
   reader who made every earlier move writes (the autoplay's reader; recommended); the annotation keeps both readers
   in `text` and `remark`.
5. **Hindsight not marked:** a ⚠ on `t21.2` (high: expecting a cravat), `t34.2` (medium: the silent dog), `t60.3` (low:
   "a strap or tie")? Or `t21.2` retired (an absence nothing sets up)?
6. **The five empty TESTs** (`t64.2`, `t202.2`, `t220.2`, `t221.2`, `t229.2`): left with nothing to write
   (recommended), or a one-line note each?
7. **`t102.4`** re-tagged PHYSICAL (a weak step through a world rule), not INFER?
8. **The batches and their order** above?

## Agreed (Robert, Round 183)

Every recommendation: a field `remark`, shown in the markdown on its own line marked "*Note:*" (Q1); typed notes in
the first person where the reader speaks of an earlier move, otherwise impersonal (Q2); sets in braces typed as plain
questions (Q3); the alt-reader thoughts typed as the reader who made every move writes them (Q4); a ⚠ on `t21.2`
(high), `t34.2` (medium) and `t60.3` (low) (Q5); the five empty TESTs left with nothing to write (Q6); `t102.4`
re-tagged PHYSICAL (Q7); the batches in the order proposed (Q8). Robert: the LLM checker's cost has been trivial, so
it reads every note the autoplay types.
