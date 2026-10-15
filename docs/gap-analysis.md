# Gap analysis: the annotated reading against format 0.3 and the game

Status: AGREED (Robert accepted the recommendations of §6, Round 37), 2026-10-15. Workstream 1 built (Round 37). Compares `docs/reading-annotated.md` (the spec, Round 32) with the
case format and engine as of Round 35 (slice 3 paused at chains 1–8; the sheep and kitchen rulings applied).
Purpose: order the infrastructure work that lets a player perform every step of the annotation.

**Verdicts.** *Covered*: the format can hold it and the game lets the player do it (perhaps without UI yet).
*Partial*: the data or the engine half exists, the other half does not, or it exists only as authoring practice.
*Missing*: nothing corresponds.

## 1. What exists today, in one paragraph

Cards: entities (with traits), events (facets become questions), claims (each quoted at clause level, with
`attested` by speaker and channel: narration, report, testimony, admission, document, physical, observation,
absence, inference, editorial), rules (`knowledge.json`: schemas with typed variables, `strength`, `unless` for
display, `stated_in`, `relevant_from`, period and stereotype flags), relations and propositions as slots,
inferences (premises, formula, rule applications; verified or asserted), Holmes's route (steps with premises,
conclusion, the paragraph that tells them), Holmes's actions (requires and yields), theories (authored, with
assignments; the player can add one and check it), case questions (raised by a quote). Play: the story is read
paragraph by paragraph; cards are dealt by mention or collected by clicking; every visible question has
candidates, which the player crosses out (pencil or checked), circles or proves; claims and inferences can be
doubted; `applyRule` and `conclude` let the player derive any entailed conclusion (no UI yet); the 'wait' pace
holds a paragraph until the player has Holmes's deduction; background facts arrive at the start, where relevant,
or on asking. Validation: every quote found, nothing on a card ahead of the story (reveal and foreshadow logs,
LLM checker), fair play under every background setting, uniqueness of answers.

## 2. Tag by tag

| Tag | Today | Verdict | What is needed |
|---|---|---|---|
| RECORD | Claims, quoted at clause level, dealt by mention or collected (Hard). The fabula view orders held events by time. | **Covered** | A crosswalk from each RECORD thought to its claim(s). A timeline board with blanks (redesign §3) is a UI over the fabula. |
| NOTICE | Nothing. Every card is dealt or collected alike; nothing marks a detail as odd. | **Missing** | An *expectation* (a default rule attached to a card or trait: "a trainer does not carry a surgeon's knife", "people do not carry others' bills") and an action *notice(card or span, expectation)*, scored against the authored list of notable details with their earliest dates. ·calculate needs no arithmetic engine: it is a notice whose expectation names the figures. |
| ABSENCE | `via: "absence"` exists, and `c.dog_did_nothing` is such a claim, but it is **dealt to the player** at ¶34: the game makes the hardest move in the story for them. | **Partial** | Absence claims become things the player *files*, not cards they are dealt: an expectation set up earlier (the dog at ¶29, `bk.guard_dog`) plus a window; filing it yields the claim. Until filed, the claim is withheld. |
| QUESTION | Case questions (raised by a quote), event facets, declared slots, relation slots raised by clues. All authored and raised by the story. | **Partial** | The player poses questions: pin a "?" on a card or blank, from templates over facets ("Why did {person} carry {object}?", "Who has a key?"). ·turn-around is a template pair. A player question that matches an authored slot opens it early (if the story has made it askable). |
| HYPOTHESIS | Slot domains are candidate sets; in Hard the player lists candidates; theories hold scenario assignments. | **Partial** | Slot-shaped sets are covered (the paper's contents, the horse's purpose, the cause of the lameness). Missing: a hypothesis with a status (live, strained, dropped) and its reasons; scenarios as the player's own boards (·scenario), not only authored theories. |
| INFER | `conclude(cited, formula)` accepts any entailed conclusion; `applyRule`. 44 inferences verified. | **Covered** (no UI) | UI for `applyRule` and `conclude`, behind the busy indicator (ruled 2026-10-14). Premise lists are flat (see §3, short chains). |
| DEFAULT | Rules carry `strength` and `unless`, but strength is never used and `unless` is display text. A rule application is set aside only when its inference is doubted. | **Partial** | Defeasible application: a default holds unless an *exception card* is played against it. Exceptions become cards (`unless` entries with quotes and, where they can be, formulas); playing one suspends that application (undercut). ·period: the `stereotype` flag exists; add "presented, not endorsed" display. |
| AGENT | Rules with schemas over people (`r.honest_men_dont_drug`, `r.drugged_guard`). | **Partial** | As DEFAULT. A rule `category` (agent, physical, world, genre) so the hand can be sorted and the annotation's tags mapped. |
| PHYSICAL | Rules over things (`r.wind_and_coats`, `r.startled_horse_kicks`). | **Partial** | As AGENT. |
| IDENTIFY | ·merge: identity slots on placeholder cards (the stranger, Derbyshire, the bay, the track's maker). | **Partial** | ·merge covered. ·split (`t68.3`: one culprit becomes three stories) has no form: the one-culprit default is the reader's, not the case's. It becomes a default rule the player may hold ("one hand did it all") and later drop. |
| WEIGH | Testimony and admissions carry speaker and hearer; a statement that may be false has a truth slot and can be doubted; observed and concluded parts are split **by authoring** (Hunter's cravat is one claim, his blaming the stranger another, with truth false). | **Partial** | Doubt with a reason: *could not have seen it* (`t36.2`), *inference written as fact* (`t35.6`), *mistaken*, *lying*, *hearsay*, *neutral either way* (`t40.7`). A claim that mixes observation and conclusion is split; the split becomes a player action where the story invites it (`t35.6` "it was clear ... his assailants"). Credibility per speaker optional. |
| SOURCE | One hop: `attested.by` and `to`. | **Partial** | A chain (`via` list): Straker's words → Mrs. Straker → police → papers → Holmes (`t32.3`); Mrs. Straker repeating her husband about Derbyshire (`t84.5`). The action is "trace this": show the chain and mark the weak link. |
| TEST | Checks are logical: elimination (checked cross-outs), "Could it fit?", theory consistency, clashes, `whyNot`. | **Partial** | Graded tests: a fact *supports* or *strains* a hypothesis without entailing or contradicting it (`t37.12`, `t64.2`). Needs an authored or rule-derived support relation (see §3, explains-links). Refute is covered (a clash). |
| RESIDUE | Nothing (redesign step 3, coverage). | **Missing** | Explains-links: which events or claims a scenario accounts for. A scenario's residue is the held items it does not explain; the player argues an item out of the tray by citing an explanation. The police residue of eight (`t46.3`) is the first test case. |
| PREDICT | Nothing. Holmes's route steps have gates, but the player never seals a prediction. | **Missing** | A sealed prediction: a formula over slots (or "Holmes will do X") with the paragraph it was made at; scored when the story settles it. The beat-Holmes windows (audit table) are the scoring data. |
| TEST PLAN | Holmes's actions (`actions.json`) with requires and yields and a cue; the story performs them. | **Partial** | The player names a check (from the actions Holmes could take, or a template "ask {person} about {card}", "look for {trace} at {place}") before Holmes performs it; scored when he does (`t101.2`, `t116.3`, `t92.5`). Actions never shown to the reader (the boot comparison's result, the question to the maid) need a "withheld" marker. |
| GENRE | Nothing. | **Missing** | ·watch-holmes: a card when Holmes visibly attends to something (the knife, the bill, the horseshoe), which raises a hint, worth less than reasoning from the evidence. ·re-read: a reading-pane action that marks a passage re-read with a question. Plain GENRE (the narrator's contract) is a hint layer, not a mechanic. |
| SET ASIDE | The `irrelevant` option controls how many unused cards are shown. | **Missing** | A per-card state that hides it from the hand and the board, costs nothing, reversible. |
| DROP | Crossing out a value (checked against what is held); retracting a player card; un-doubting. | **Partial** | Dropping a hypothesis *for a reason that is not entailment*: a strain, an undercut, or being out-explained (`t92.7`: the maid version needs two agents, the inside story one). Needs the graded TEST and RESIDUE machinery. |
| REVISE | Labels and names that change as the story goes (the narrator's revision); doubting a claim and trusting it again. | **Partial** | The player's revision: an old card's *interpretation* changes (the cravat from "torn from the assailant" to "picked up", `t226.2`). Modelled as switching which reading of a card is held: the claim's alternative readings (`truth_slot`) generalised to named readings. |

## 3. Fields and relations

| Annotation field | Today | Verdict | What is needed |
|---|---|---|---|
| id `t<¶>.<n>`, earliest date | Cards are dated by first mention; route steps by the paragraph that tells them; the validator's playability walk computes where a step becomes possible. | **Partial** | A thoughts file whose ids the case's cards point to, and a check that each thought's earliest date matches the engine's (its premises all held by then). |
| Holmes date | Route steps (`source`, `explained_in`); Holmes's actions. | **Covered** | Mapped through the crosswalk. |
| confidence | Rule `strength` only. | **Missing** | On thoughts and on player hypotheses: weak, fair, strong. Feeds graded TEST and hint text. |
| profile (typical, careful, expert) | Difficulty presets govern help, not content. | **Missing** | Per thought; drives hint tiers ("a typical reader would have noticed by now…") and which thoughts are bonuses rather than gates. |
| premises | Inferences and route steps list premises, flat (20–30 on some route steps). | **Partial** | Short chains: each thought cites two to five items, other thoughts among them. This is the redesign's step 2, re-specified from the annotation: the thoughts *are* the propositions. |
| background cards (`bk.*`) with 1892 / modern availability | Rules with `stated_in`, `relevant_from`, the background setting, and the Strict column (drops rules stated after the challenge). | **Partial** | Availability per reader (1892, modern) replaces Strict (ruled Round 33). Late-stated knowledge (opium's taste ¶218, laying against one's horse ¶220, the blaze ¶146) is offered early as a card, which `relevant_from` already supports; mark which ones the story itself never supplies in time. |
| supports, strains | Nothing. | **Missing** | Graded relations (see TEST). |
| refutes | Clashes and contradictions. | **Covered** | |
| undercuts | Doubting an inference sets its rule applications aside, but nothing says why, and a rule cannot be suspended by an exception. | **Partial** | Exception cards against rule applications (see DEFAULT). |
| revises, drops | See REVISE, DROP. | **Partial** | |
| relations addressed to a set member (`t24.3 (drug)`) | Values of a slot. | **Covered** for slot-shaped sets | |
| clause-level quotes | Every card text carries a quote; validator enforces it. | **Covered** | |
| late or never disclosed (fair-play table) | The report lists cards quoted later than they appear (18); nothing marks a fact the story never discloses. | **Partial** | A `disclosure` field on facts and actions: `late` (with the paragraph), `never`; and a per-case policy for each (withhold, supply as background, let the player supply it). |

## 4. The audit's other findings

- **Beat-Holmes windows:** the 'wait' pace already knows Holmes's paragraph per deduction; missing is the
  scoring of a deduction made before it, and the record of when the player made it.
- **Wrong turns:** the paper (a slot value), the gypsies and Silas Brown (authored theories and
  values), the maid (a value of who drugged) all have somewhere to live; dropping them for non-logical reasons
  does not (see DROP).
- **Things the story leaves open** (who dosed the dish, why the cravat, the maid's question, the boot comparison):
  the uniqueness check already records slots "left open by the story"; the game must not ask the player to prove
  them.

## 5. Workstreams, in dependency order

1. **Thoughts as data** (`cases/silver-blaze/thoughts.json`, one object per line, schema and validator). Each
   thought: id, tag and subtype, confidence, profile, premises, relations, quote spans, Holmes date, and a
   crosswalk to the case's cards (claim, rule, inference, slot or value, action). Checks: references resolve,
   quotes found, premises earlier than the thought, earliest date consistent with the engine. Converting the
   Markdown is mechanical. *Everything after this cites thoughts by id.*
2. **Short chains** (redesign step 2, re-specified). INFER, DEFAULT, AGENT, PHYSICAL and IDENTIFY thoughts become
   small verified inferences over two to five premises, other thoughts among them; route steps become chains of
   them; the two dates replace the gate machinery as the fair-play frontier. The flat premise lists go. The
   verified inferences of slice 3 stay as regression cases.
3. **Defeasibility.** Default rule applications that an exception card suspends (undercut); doubts with a
   reason type; the police's four as candidate-set members defeated this way (ruled Round 33). Slice 4's report
   gate lands here.
4. **Testimony and sources.** Split mixed claims (observed versus concluded) where the annotation's WEIGH thoughts
   need it; reporting chains; the "split this statement" action where the story invites it.
5. **Noticing and absence.** Expectations attached to cards and traits; the notice action and its scoring; absence
   claims withheld until filed.
6. **Hypotheses, scenarios, residue.** Hypothesis status and reasons; explains-links; graded support and strain;
   scenario boards with residue trays; DROP for non-logical reasons; REVISE as switching readings.
7. **Prediction and test plans.** Sealed predictions, the player's checks, scoring against the story; the
   beat-Holmes windows as scoring data; withheld results marked.
8. **Reader layer.** Background availability (1892, modern) replacing Strict; disclosure typing; profiles and
   hint tiers; GENRE (watch-holmes, re-read) and SET ASIDE.
9. **UI** for all of the above, behind the busy indicator; the timeline board.

Workstreams 3 to 8 depend on 1 and 2 but are largely independent of each other, so their order can follow
Robert's priorities for play.

## 6. Decisions for Robert

1. **Where thoughts live.** (a) A separate `thoughts.json` that points to the case's cards (recommended: the
   reading-layer cards stay as they are, and a thought can map to several cards or to none yet, which is itself a
   gap report); or (b) thoughts replace propositions and inferences outright.
2. **What scores.** Recommended: deductions and sealed predictions made before Holmes score; notices score by
   later use, not by themselves, and in aggregate ("six of the nine things Holmes used"); watch-holmes and
   genre moves never score, only hint; wrong turns cost nothing.
3. **Graded relations: authored or computed?** Recommended: authored first (each thought's `supports` and
   `strains` from the annotation), computed later from explains-links once they exist.
4. **Withheld facts** (the boot comparison, the bill's items, the question to the maid, the square toes):
   recommended default is to withhold as the story does and mark them `never` or `late`, with the bill's items an
   exception worth discussing (the dress test is unplayable without them).

## 7. What stays from format 0.3

The rule library (general rules with schemas over events and traits, strength and `unless`), traits, the
establishment relation, the verified inferences (as regression cases), the solver fixes, first-mention gating,
the reading layer and its leak checks, and the per-chain discipline (needs per step against HEAD, reveal and
foreshadow logs diffed in full). Every INFER, DEFAULT, AGENT, PHYSICAL and IDENTIFY thought in the annotation is
an application of a rule from that library.
