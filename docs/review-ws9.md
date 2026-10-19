# Review: every tag of the gap analysis against the UI (workstream 9)

Status: written 2026-10-18 (Round 149), after the steps of `docs/ui.md` were built (Rounds 144–148). The kickoff's
closing review (`docs/kickoff-workstream-9.md`, mission 4): for each tag of `docs/gap-analysis.md` §2, can the player
now perform the annotation's step in the game, in the UI (Round 32's ruling)? It follows the shape of
`docs/review-ws8.md`.

**Verdicts.**
- *Playable*: the move is offered in the UI on the presets where the agreed papers put it, and where it scores, the
  player now sees the score as the story reaches its deadline.
- *Playable, unscored*: as playable; decision 2 (`docs/gap-analysis.md` §6) keeps it out of every score.
- *Partly playable*: some of the tag's thoughts are, others are not, and why.
- *Not playable*: listed with the reason.

Each "Where" was checked in headless Chrome in Rounds 143–148, or in the rounds named.

## Tag by tag

| Tag (thoughts) | Where in the UI | Scored, and seen | Verdict | Not held, and why |
|---|---|---|---|---|
| RECORD (93) | the story pane, "Next paragraph / scene / deduction"; the Card and Cards tabs; Hard collects by clicking; Timeline › What happened, What you found | — | **playable** | — |
| NOTICE (16, ·calculate 2) | a card's "That's odd", with an optional expectation; Questions › Odd things | `noticeScores`: "Holmes draws attention to …" at his paragraph; the record (Round 146) | **playable** | ·calculate is a notice whose expectation names the figures, as the gap analysis asked; nothing computes |
| ABSENCE (6) | the board's form, and a clue's own card (Round 148) | `absenceScores` (the dog): "Holmes points to …" | **playable** | the four absences without a Holmes date are filed, unscored, as agreed (ws 7) |
| QUESTION (10) | *Since Rounds 152–154 (`docs/questions.md`):* a card's "Ask your own question" (13 templates over held cards); Your questions on the card and the Questions tab, with the player's candidates; the re-read form; the bar's note when the story asks the same | the record's "Questions you asked before the story", never counted (Q5) | **playable, unscored** | five of the ten match no question of the case and stay the player's notes (`t20.7`, `t25.1`, `t31.4`, `t57.3`, `t108.2`), as agreed; ·turn-around is one ordinary template (Q4) |
| HYPOTHESIS (27) | the open questions' chips (pencil, circle, cross out, prove); Theories (new theory, add answers, weigh); the board's layers | through the deductions they become | **playable** | — |
| INFER (24) | "Infer from this" / "Connect to this"; "Or state it yourself" (Round 147) | `thoughtScores`: "Holmes reasons: …" at his paragraph, "Ahead of Holmes" | **playable** | `applyRule` has no UI by agreement (`docs/ui.md` Q2); `concludeFrom` reaches 41 of the route's 54 inferences from the clues alone (Round 147) |
| DEFAULT (8, ·period 2) | "Unless…" on an inference's card; a background fact's exceptions; "presented, not endorsed" (Round 141) | `raiseScores`: "Holmes shows that a step does not hold …" | **playable** | — |
| AGENT (8), PHYSICAL (1) | as DEFAULT | as DEFAULT, through the deductions | **playable** | the rule `category` to sort the hand was never built; the Background tab groups by topic (listed) |
| IDENTIFY (3) | ·merge: the identity questions; ·split: doubting `k.one_culprit` with "the night is several stories" (Round 148) | ·merge through the deductions; ·split unscored (Holmes never says it) | **playable** | — |
| WEIGH (19) | a clue's or inference's card: doubt, say how, say why, split the statement | — | **playable** | corroboration and "cuts both ways" as weights: listed in `docs/hypotheses.md` Q2 |
| SOURCE (2) | a clue's card: "Passed on: A → B → the story" | — | **playable** | marking the weak link is the doubt's "hearsay" |
| TEST (30) | Theories (the weighing by `weigh`, drawn theory by theory since Round 144); "Could it fit?"; the board's "Does this night fit?" | the settling TESTs are confirmations, unscored | **playable** | strains by improbability (`t24.4`, `t37.11`, `t64.2`, `t120.2`) stay authored (`docs/review-ws3-ws6.md`) |
| RESIDUE (1) | the Theories tab and the board's check | — | **playable** | — |
| PREDICT (8), TEST PLAN (4) | the Checks tab (Round 130) | `checkScores`: "Holmes does this: …" at his paragraph | **partly playable** | `t92.13` (advice), `t92.14` (no vocabulary before Holmes): `docs/review-ws7.md`, unchanged |
| GENRE (20) | Questions › Holmes's interest (Easy, Trivial); "Re-read…" with a question, now shown and listed (Round 148); the story's prompts at ¶70 and ¶182 | never (decision 2) | **playable, unscored** (12 of 20) | the 8 plain thoughts, the narrator's contract, have no mechanic (`docs/review-ws8.md`) |
| SET ASIDE (7) | a card's "Set aside"; Cards › "Set aside (N)" | never | **playable, unscored** (5 of 7) | the two passages have no card |
| DROP (4) | "Drop it…" on a chip; "drop it…" on a theory | `dropScores`: "The story leaves behind …" at the deadline | **playable** | `t68.2` (Brown as organiser) has no game target (`docs/hypotheses.md`) |
| REVISE (4) | a card's "How it reads under each story"; the toast on proving | through the deductions | **playable** | — |

## The score family

| Family | Shown | Possible (end) |
|---|---|---|
| deductions | at Holmes's paragraph, on the reading bar; the record | 47 |
| notices | as above | 8 (was 6, Round 145) |
| raises | as above | 3 |
| drops | at the deadline ("before the story did") | 3 |
| checks | at Holmes's paragraph | 10 (was 9, Round 145) |
| absences | at Holmes's paragraph | 1 |

Nothing is shown before its deadline; Trivial shows one line at the end. No hint feeds any family (Round 139).

## In numbers

- **Of the 20 tags of §2: playable,** 15. **Playable, unscored:** 2 (GENRE, SET ASIDE), with the thoughts the agreed
  papers leave out; 3 since Round 154 (QUESTION, `docs/questions.md`).
- **Partly playable:** 2 (PREDICT and TEST PLAN, as workstream 7's review left them).
- **Not playable:** 1 (QUESTION: the player's own questions, kept for a later workstream); none since Round 154.
- **The busy page:** a reload at the end ready in about 12 s on a loaded machine (HEAD before: 43–97 s); Theories
  usable at once, each theory filled in as weighed (Round 144).

## Left open

- **The player's own questions** (QUESTION, `docs/ui.md` Q7): a design question of its own, which touches the
  reading layer. *Designed and built since:* `docs/questions.md` (Rounds 151–154).
- **`applyRule`** keeps no UI (agreed); **`retract`** has none either: a player's own conclusion is doubted, not
  taken back.
- **The rule `category`** (AGENT, PHYSICAL) to sort the hand: never built, nothing asks for it.
- **The board** carries no sealed checks and no signals (agreed, `docs/ui.md` Q6).
- **From earlier reviews, unchanged:** the "advise" template (`t92.13`), theories proposing their own predictions, the
  purist hearing Holmes at the story's gates, strains by improbability, corroboration.
- **Wording:** a check's text keeps entity capitals mid-sentence ("Look for A box of vestas"), as Round 130 listed.
- **Timing:** the case still loads on the main thread (about 5 s on an idle machine, 11 s on a loaded one), with
  "Loading the case…" on the page; Theories at the end takes about 30 s to weigh all six theories on a loaded machine.
