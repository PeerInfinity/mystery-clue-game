# Review: the GENRE and SET ASIDE thoughts and the background cards against workstream 8

Status: written 2026-10-18 (Round 140), after the steps of `docs/reader-layer.md` were built (Rounds 134–139). It
takes the kickoff's acceptance list one item at a time:
- the 20 GENRE thoughts (10 watch-holmes, 2 re-read, 8 plain);
- the 7 SET ASIDE thoughts;
- the 25 background cards' availability marks.

For each it says whether the item is now held as agreed and how, or why not. It follows the shape of
`docs/review-ws7.md`.

**Verdicts.**
- *Held*: the player can make the move (or the game shows the signal), as the paper agreed.
- *Held, unscored*: as held; decision 2 keeps it out of every score.
- *Not held*: listed with the reason.

## The GENRE thoughts

| Thought | Kind | What | Verdict | How, or why not |
|---|---|---|---|---|
| `t31.2` | watch-holmes | the special wire about the stable door | **held, unscored** | Holmes's interest at ¶31: the clause and the wire's card. |
| `t70.1` | watch-holmes | the gleam after Gregory's answers | **held, unscored** | Holmes's interest at ¶70: the clause (no card in it). |
| `t70.2` | re-read | go back over the recital | **held, unscored** | `passage: [8, 46]`. At ¶70 the reading bar and the list say "The story points back: re-read paragraphs 8–46", which opens the re-read form (Easy, Trivial). The re-read itself is `Game.reread`, on every preset. |
| `t75.1` | watch-holmes | he asks about Straker's character | **held, unscored** | ¶75: the two clauses, Colonel Ross, `c.straker_honest_record`. |
| `t85.2` | watch-holmes | he reads the bill line by line | **held, unscored** | ¶85: the clauses, Madam Derbyshire, the 22-guinea costume. That the bill's items are never told is in "What the story held back" at the end (`k.dove_silk_on_the_bill`, inferred). |
| `t106.1` | watch-holmes | "I only saw it because I was looking for it" | **held, unscored** | ¶106, after Holmes's check at ¶102: a confirmation for a player who sealed `ck.mud`. |
| `t109.2` | watch-holmes | he pockets the horseshoe | **held, unscored** | ¶109: the clause, the horseshoe and the moor. As agreed (Q4), the Checks tab does not mark a sealed `ck.tracks` before Holmes performs it at ¶116. This closes `docs/review-ws7.md`'s "Left open" item. |
| `t111.2` | watch-holmes | "let the name stand" | **held, unscored** | ¶111: the clauses, Silver Blaze. |
| `t127.2` | watch-holmes | who is about at dawn | **held, unscored** | ¶127: Silas Brown, `c.brown_first_up`. |
| `t156.2` | watch-holmes | he leaves for London | **held, unscored** | ¶156: the clauses, Straker, London. Its hindsight note (medium) is not shown; the clause is the story's. |
| `t161.3` | watch-holmes | he asks for the photograph | **held, unscored** | ¶161: the photograph and Straker. The Checks tab already marks a sealed `ck.photograph` at ¶161, where Holmes performs it. |
| `t182.3` | re-read | go back to the dog | **held, unscored** | `passage: [29, 34]`, prompted at ¶182 with the curious-incident clause. |
| `t6.1` | plain | "absolutely unique": the obvious will be wrong | **not held** | Agreed (Q4): no mechanic for the narrator's contract. `bk.genre_obvious` maps to no rule. |
| `t12.1` | plain | the solution is in public facts | **not held** | As `t6.1`. |
| `t12.2` | plain | sort fact from embellishment | **held by existing moves** | The doubt reasons of workstream 4 (`inference-as-fact`, `could-not-see`) are the sorting it licenses. |
| `t14.4` | plain | the one-culprit blunder | **held by existing moves** | `k.one_culprit` is a heuristic the clash weighing sets aside first (Round 109), and its drop is workstream 6's. |
| `t34.6` | plain, expert | the household's first hope | **not held** | No mechanic. It is expert with hindsight; its Holmes step `t46.4` no longer gates (Round 137). |
| `t38.1` | plain | "stripped of all surmise" is not | **held by existing moves** | As `t12.2`. |
| `t39.3` | plain | the unimaginative detective | **not held** | As `t6.1`. |
| `t93.2` | plain, expert | "hung" for "flapping" | **not held** | No mechanic. A narration signal with hindsight, expert. |

## The SET ASIDE thoughts

| Thought | What | Verdict | How, or why not |
|---|---|---|---|
| `t6.2` | the field-glass | **held** | `setAside('field_glass')`, from ¶6. It is the headless check's own case. |
| `t10.1` | the telegraph posts | **held** | `telegraph_posts`. |
| `t24.5` | the price of a new dress | **held** | `new_dress`. |
| `t128.1` | the half-crown | **held** | `half_crown`. |
| `t192.2` | Bayard withdrawn | **held** | `bayard` can be set aside. The game says nothing, though the solution uses the card, and its inferences still build (a test). |
| `t118.1` | Holmes on imagination | **not held** | A passage, not a card: nothing to set aside (agreed, Q5). |
| `t152.1` | the Colonel's manner | **not held** | As `t118.1`. |

## The background cards

| Card(s) | 1892 | Modern | Verdict | How, or why not |
|---|---|---|---|---|
| the other 12 cards marked yes / yes | yes | yes | **held** | No reader lacks them. Their rules arrive as before. |
| `bk.genre_obvious`, `bk.genre_named_detail`, `bk.drug_paper`, `bk.alias_post` | yes | yes | **held, nothing to supply** | They map to no rule (the first two are the GENRE premises above), so their marks have nothing to act on. |
| `bk.opium_taste` | likely | partial | **held** | 1892 holds it. For the modern reader it is supplied: "a reader of 1892 would know this", and the story says so at ¶218. |
| `bk.horse_kick` | yes | partial | **held** | Supplied for the modern reader. `r.hoof_strikes_as_horse_kicks` is never stated: "the story never says so" at the end. |
| `bk.horse_gregarious` | yes | partial | **held** | Supplied for the modern reader; told at ¶114. |
| `bk.milliner_prices` | yes | gloss (¶225) | **held** | Supplied for the modern reader. The "¶225" is where `r.servant_wages` is stated; `r.no_finery_for_servants` is never stated. |
| `bk.blaze`, `bk.horse_faker` | racing public | rare | **held** | Lacked by 1892 and modern, held by the racing reader ("a racing man of 1892 would know this"). |
| `bk.lay_against` | racing-literate | rare | **held** | As `bk.blaze`; told at ¶220. |
| `bk.tendon_nick` | specialist | rare | **held** | Lacked by every reader: always supplied ("a specialist would know this"), told at ¶221. Only implicit inferences use it, as the fair-play table accepts. |
| `bk.gypsies` | period | period (presented, not endorsed) | **held** (Round 141) | Both readers hold it. Its two rules are flagged `stereotype` and their text opens "(A prejudice of the period.)", so the card head already showed the flag. *Corrected in Round 141:* this row first said nothing showed it, misreading `period: true`, which marks 1890s knowledge. Round 141 adds the explicit "· A belief of the period: presented, not endorsed." on the card and in the Background tab. |

## In numbers

- **GENRE:** 12 held, unscored (all watch-holmes and re-read); 3 held by existing moves; 5 not held (the plain
  narrator's-contract thoughts, as agreed).
- **SET ASIDE:** 5 held; 2 not held (passages).
- **Background cards:** 25 held (the period mark made explicit in Round 141).

## Left open

- ~~**The period mark**~~: done in Round 141, on the `stereotype` rules.
- **The purist (`supplied: withheld`) still hears Holmes.** The inferences of Holmes's steps arrive at the
  *story's* earliest gates (Round 126). For example, `t81.5`'s needs arrive at ¶102 for a modern purist too, though
  that player's own gate for `t81.5` moves to ¶219. This is Holmes speaking, not the player knowing, so it is left so.
- **A re-read's question is recorded, not used.** Nothing reads it yet. Workstream 9 could show it with the passage.
- **Profiles and confidence** still drive nothing beyond the expert gates. The measurement (paper §5) showed that
  they cannot time hints for the scored moves.
- **The busy page on long saves** (Round 130's): an Easy save at the end needs about 90 s before a tab responds.
  This is for workstream 9.
- **A count in Round 139:** the end-of-story list showed **twelve** supplied facts, not eleven.
