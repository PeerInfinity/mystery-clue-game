# Review: the PREDICT and TEST PLAN thoughts against workstream 7

Status: written 2026-10-18 (Round 131), after the steps of `docs/predictions.md` were built (Rounds 126–130). It
takes the kickoff's acceptance list one thought at a time:
- every PREDICT and TEST PLAN thought in `thoughts.json` (9 and 4);
- the three ws 7 rows of the second review (`t161.2`, `t163.3`, `t182.2`);
- the four watch-holmes thoughts behind the kickoff's "17" (`t109.2`, `t111.2`, `t156.2`, `t161.3`).

For each it says whether the thought is now held as agreed and how, or why not. It follows the shape of
`docs/review-ws3-ws6.md`.

**Verdicts.**
- *Held*: the player can make the move, and it scores where the paper says it should.
- *Held, unscored*: the move can be made and is recorded, and the paper rules it out of scoring.
- *Not held*: listed with the reason.

## The thoughts

| Thought | Tag | What | Verdict | How, or why not |
|---|---|---|---|---|
| `t29.4` | PREDICT | the dog should have barked | **held** | Its seal is the absence filed at ¶34 (`fileAbsence`). `absenceScores` scores the dog (`t34.2`) against ¶180. The expectation is `r.dog_barks_at_strangers`, dealt at ¶29. |
| `t78.5` | PREDICT | a match in the hollow's mud | **held** | `ck.mud`: "look for the vesta box or the candle at the hollow", expecting found. Plannable from ¶78; Holmes ¶102; the result at ¶102. Tested (sealed ¶80 scores, ¶102 does not). |
| `t85.3` | TEST PLAN | ask Mrs. Straker about the dress | **held** | `ck.dress`: "ask Mrs. Straker about the bill, the milliner or Derbyshire". Plannable from ¶84; Holmes ¶89 (the anchor moved from ¶225, Round 126); the result at ¶92. Its two versions need no expectation; `t92.4` refutes (a) at ¶92 as before. |
| `t92.5` | TEST PLAN | show the photograph at the milliner's | **held** | `ck.photograph`: "show Straker to Madame Lesurier". The photograph itself is first named at ¶161, so Straker stands for it. Holmes ¶161; the result is late (¶229). The plan scores at ¶161. |
| `t92.9` | PREDICT | a spent match in the hollow | **held** | As `t78.5` (the same check and expectation). |
| `t92.10` | PREDICT | the coat was laid; a still night | **held** | `ck.coat`: "ask Gregory or the Colonel about the coat on the bush", expecting yes. Holmes ¶94; the result at ¶95. Plannable from ¶32, earlier than the reader's ¶92 (broad words, left so). |
| `t92.11` | PREDICT | the tracks lead to Mapleton | **held** | `ck.tracks`: "look for Silver Blaze or the horseshoe at Mapleton or the wet hollow", expecting found. Holmes ¶116; the result at ¶117. |
| `t92.12` | PREDICT | the milliner recognises him | **held** | `ck.photograph` expecting yes, with the answer "Derbyshire is Straker". The plan scores at ¶161; the answer stays pending until ¶229, then is borne out. Citing a theory, the game says whether it gives the answer (Round 129). |
| `t92.13` | PREDICT | the horse will run; kept entered | **not held as a check** | "The horse will run" is an answer, not a find. Its deduction is `t40.4` (Mapleton, alive), already scored. `a.keep_horse_entered` is advice, not a check, and no template fits it. `t161.2` (Holmes's "every hope … your horse will start") and `t111.2` remain its confirmations, unscored. |
| `t92.14` | AGENT → PREDICT | he practised first | **not held as a check** | The sheep are first named at ¶170, in Holmes's own question: no vocabulary before him. The step is the deduction `t175.1` (¶228), scored as before. |
| `t101.2` | TEST PLAN | compare the boots with the prints | **held** | `ck.boots`: "compare the boot, the shoe, Straker or Simpson with the hollow or its marks". Holmes ¶107. The result is **never** told: the plan scores (Robert, Round 125), the result is shown as left open at the end. |
| `t116.3` | TEST PLAN | search the wet hollow | **held, cannot score alone** | `ck.tracks`. At ¶116 Holmes names the hollow in the same paragraph: window 0. A player who planned it earlier did it as `t92.11`, and that seal counts for `t116.3` too (the same check). |
| `t141.2` | PREDICT | Silver Blaze will run disguised | **held** | `ck.race`: "look for Silver Blaze at the Wessex Cup", expecting found. The Cup cards from ¶18 stand for the racecourse (¶183). Holmes ¶197; the result at ¶198. "Disguised" is the deduction `t141.1`, scored as such. |
| `t161.2` | TEST | the horse will run, as `t92.13` predicted | **not a move** | A settling moment. With `t92.13` not a check, it has nothing to settle in ws 7's machinery. It stays an authored confirmation. |
| `t163.3` | HYPOTHESIS | what Holmes asks the maid | **held, unscored** | `ck.maid`: "ask Edith Baxter about" any card. Matched at ¶163 and **never** told; never scored (Robert, Round 125: the simpler option). |
| `t182.2` | TEST | the dog, scored "148 paragraphs ahead" | **held** | Through `absenceScores` (`t34.2` filed before ¶180). Its own action `a.point_out_dog` has no check: it is Holmes pointing, not checking. |
| `t109.2` | GENRE watch-holmes | he pockets the horseshoe | **unscored by rule** | Decision 2: watch-holmes never scores. For a player who sealed `ck.tracks` it is a confirmation the UI does not mark. |
| `t111.2` | GENRE watch-holmes | let the name stand | **unscored by rule** | As `t109.2`; it confirms `t92.13`, which is not a check. |
| `t156.2` | GENRE watch-holmes | leaving for London | **unscored by rule** | As `t109.2`. |
| `t161.3` | GENRE watch-holmes | he asks for the photograph | **unscored by rule** | As `t109.2`. For a player who sealed `ck.photograph`, ¶161 is where the Checks tab says "Holmes does this". |

## In numbers

- **Held:** 12. These are `t29.4`, `t78.5`, `t85.3`, `t92.5`, `t92.9`, `t92.10`, `t92.11`, `t92.12`, `t101.2`,
  `t141.2` and `t182.2`, plus `t116.3`, which scores only through the earlier plan of `t92.11`.
- **Held, unscored:** 1 (`t163.3`).
- **Not held:** 3, each with its reason: `t92.13` (an answer, not a find), `t92.14` (no vocabulary before Holmes),
  and `t161.2` (it settles `t92.13`).
- **Unscored by rule:** the 4 watch-holmes thoughts.

`checkScore().possible` is 9 of 11 rows, and `absenceScore().possible` is 1.

## Left open

- **"Holmes will do X" for advice** (`t92.13`'s "keep him entered"). A fifth template ("advise {person} about
  {card}") would hold it. It was not in the agreed four and is listed, not built.
- **Watch-holmes as confirmation in the UI:** the Checks tab could mark a sealed check when Holmes visibly prepares
  it (the horseshoe pocketed at ¶109, the photograph asked for at ¶161). That is workstream 8's GENRE.
- **Theories proposing their own predictions** (Q6 (c)): listed, not built.
- **The Medium page that stays busy** (Round 130): an existing behaviour, not workstream 7's, for workstream 9's UI
  pass.
