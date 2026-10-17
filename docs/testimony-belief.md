# Testimony, sources and belief (workstream 4)

Status: **AGREED** (Robert, 2026-10-16, Round 86: the seven recommendations, as written). Builds on knowledge over propositions (Round 78) and the
shape of belief fixed in `docs/knowledge-intention.md` Q4 (Round 72).

## The reader's process

A careful reader weighs what people say before using it. This annotation's WEIGH and SOURCE thoughts do four things.

- **Split what was seen from what was concluded.** Hunter saw a stranger at the window. That the stranger drugged
  his supper is his conclusion, and he could not have seen it: had he seen it, he would not have eaten (`t36.2`).
  The papers' "Straker had defended himself vigorously against his assailants" is an inference written as fact
  (`t35.6`).
- **Tell a mistaken witness from a lying one.** Hunter believes what he says, and is wrong. Mrs. Straker believes
  Derbyshire was her husband's friend (`t84.5`), and is wrong because he lied to her. Brown's violent denial is a
  lie (`t133.2`). Mrs. Straker's denial at the Plymouth ruse is honest (`t92.3`).
- **Trace the chain.** Straker's words → Mrs. Straker → the police → the papers → Holmes (`t32.3`). What she saw
  (him dressing at one, going out) is her own observation. The reason he gave ("anxiety about the horses") is his
  statement, passed on in good faith.
- **Weigh without deciding.** Some evidence is good but not proof ("sworn and specific", `t26.1`). Some cuts both
  ways (Simpson pale at the cravat, `t40.7`). Some is reputation, not observation (`t19.4`).

## What exists

- **Claims** carry `attested` (`via` testimony, admission, report…, `by`, `to`) and may have a `truth` slot the
  player can doubt. Doubt is one switch: trusted (the content holds) or suspected (it counts nowhere, and "Is it
  true?" opens).
- **Fifteen claims** have a truth slot or are false. Among the false:
  - mistaken:
    - Hunter blaming the stranger;
    - Mrs. Straker on Derbyshire;
    - the household's hope of early exercise;
    - the papers' "defended himself";
    - Gregory's "poor weapon";
    - Ross's "That's not my horse";
  - lying:
    - Straker's "anxiety about the horses", passed on by his wife;
    - Brown's denial;
  - a deliberate test: Holmes's Plymouth ruse.
- **Mixed claims are split by authoring** where it was needed before: the cravat recognised (true) apart from
  Hunter's charge (false); Straker dressing at one (true) apart from the reason he gave (false).
- **Knowledge tracks** over propositions, with two laws built in (Round 78). No belief.
- **Workstream 3** (doubt with a reason, defeasible defaults with exception cards) is not built. Its "could not have
  seen it" and "inference written as fact" overlap with this workstream.

## Questions, alternatives, recommendations

### Q1. What does a speaker believe? The content of a statement as a proposition

Q4 of the knowledge paper fixed belief as a boolean track per person and proposition. But a statement's content is a
formula over the case's questions ("the stranger drugged the dish at the window"), not an authored proposition.

- **(a) The engine makes each statement's content a proposition (recommended).** Every testimony, admission or
  report claim with a speaker gets a derived proposition, "what X said" (its `means` is the claim's content). The
  speaker's belief is a track over it at the time he speaks. Nothing is authored per claim. It reuses the knowledge
  machinery, and Q4's shape holds.
- **(b) Author a proposition per statement that matters.** Explicit and readable, but every statement is written
  twice, and the claim and the proposition can drift apart.
- **(c) A sincerity slot per claim** ("Does Hunter believe it?"), with no proposition. Simplest, but it leaves
  Q4's shape. Knowing-implies-believing then cannot connect to it.

### Q2. What a statement asserts, once belief exists

Today a trusted claim asserts its content. With belief, a statement can be split in three: it was said (narrated,
true), the speaker believes it (sincere), and the content is true.

- **(a) Two readings of doubt (recommended).** Trusting stays as it is: said, believed, true. A doubt now says
  which:
  - **mistaken:** believed, and false;
  - **lying:** not believed, and false.

  The plain doubt (it counts nowhere) stays for the player who does not want to say. A default rule card, "a witness
  says what he believes", carries sincerity, with `unless` ("he has a reason to lie"), so a player can see and doubt
  it.
- **(b) Belief only for claims flagged in the data.** Less engine, but a player who suspects a lie elsewhere has
  nowhere to put it.
- **(c) Belief as display only** (a label "mistaken" or "lying" on a doubt). No logic: it cannot take part in
  inferences such as "Brown lied, so he has something to hide".

**Built in:** knowing implies believing. A sincere speaker believes what he says. A belief may be false (unlike
knowledge).

### Q3. Statements that mix what was seen with what was concluded

- **(a) Author `parts` on the mixed claims the WEIGH thoughts name (recommended).** The player can split the claim
  ("split this statement"), getting the parts as cards of their own to trust or doubt apart. Until split, it is dealt
  and trusted whole, as now. Where:
  - `c.derbyshire_a_friend`: "his letters were addressed here" (her own observation, true) against "a friend of her
    husband's" (passed on from him, false), for `t84.5`;
  - `c.straker_defended_himself`: the knife in his hand (seen) against "defended himself against his assailants"
    (the papers' inference), for `t35.6`.
- **(b) Split them all by authoring now.** No action for the player, so the move `t35.6` describes ("re-file it as
  the police reading") is made for them.
- **(c) A generic split by clause,** any claim at its commas. That is not well defined, and the parts would have no
  logic.

### Q4. Reporting chains

- **(a) A chain on the attestation (recommended):** `chain: [{by, to}, …]` from the first speaker to the reporter.
  - **"Trace this"** on the card shows the chain and who saw what.
  - **Belief per link:** each relayer believes the one before said it. A lie or a mistake sits on one link. Straker
    lied to his wife, and she passes it on sincerely, which is `t32.3` and `t84.5`.
  - **Where:** Straker's reason for going out; Derbyshire the friend; the papers' account of the struggle.
- **(b) Display only.** The chain is shown, but a doubt cannot say which link failed.
- **(c) Nothing new.** `by` and `to` stay one hop.

### Q5. Doubt with a reason, and workstream 3

The gap analysis lists six reasons:
- could not have seen it;
- inference written as fact;
- mistaken;
- lying;
- hearsay;
- neutral either way.

- **(a) Mistaken and lying with logic now; the others recorded as reasons (recommended).** "Could not have seen
  it" and "inference written as fact" are undercuts, which are workstream 3's defeasibility. Recorded now, so the
  player's reason is kept and the WEIGH thoughts can score by it later. Logic follows with workstream 3.
- **(b) All six with logic now.** That pulls workstream 3 into this one.
- **(c) Only mistaken and lying,** with no recorded reasons.

### Q6. Scoring

- **(a) Not yet (recommended).** WEIGH thoughts are mostly "how much to trust this". Scoring them needs graded
  support and strain (workstream 6). Record the player's doubts and reasons now, and score later.
- **(b) Score a doubt with the right reason made before Holmes's paragraph,** where a WEIGH thought has one
  (`t36.2`, ¶218; `t35.6`, ¶226).

### Q7. Which statements get data now

**Recommended:**
- **Belief answers in the answer key, quoted where the story tells them:**
  - Hunter believes his charge: "He was equally certain";
  - Mrs. Straker believes Derbyshire a friend;
  - Straker did not believe his "anxiety", derived from the inside story;
  - Brown did not believe his denial;
  - Mrs. Straker's honest denial at the ruse;
  - Ross believes "not my horse".
- **Parts** for the two mixed claims of Q3.
- **Chains** for the three of Q4.
- **Thoughts:** `t36.2` maps to the mistaken reading of Hunter's charge; `t32.3` and `t84.5` to their chains;
  `t133.2` and `t92.3` to Brown's and Mrs. Straker's belief.

## Order of work (if agreed)

1. **Belief over statements:** derived propositions, belief tracks, the two laws, the sincerity default, the two
   doubts (mistaken, lying). Data: the belief answers of Q7. Tests, and the reveal log and gate diff.
2. **Parts and the split action:** the two mixed claims.
3. **Chains:** data, "trace this", doubt per link.
4. **Doubt reasons recorded**, and the UI for all of the above.

Each step keeps the reading layer: a belief answer is quoted through a claim's own line, a part's text comes from
its claim's quote, and the fair-play test, logs and gates are diffed.

## For Robert

1. Q1: a statement's content as a derived proposition, and the speaker's belief a track over it?
2. Q2: two readings of doubt (mistaken, lying), with a sincerity default rule?
3. Q3: `parts` on the two mixed claims, split by the player?
4. Q4: chains on the attestation, with belief per link?
5. Q5–Q7: mistaken and lying with logic, the other reasons recorded; no scoring yet; the data listed?

## Agreed (Robert, Round 86)

All seven as recommended, and the order of work above.
