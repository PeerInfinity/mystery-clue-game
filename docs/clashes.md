# How clashes weigh what they set aside (with Q6, one culprit)

Status: **AGREED** (Robert, 2026-10-17, Round 108: every recommendation, and the order of work). **Built:** step 1,
the weighing (Round 109); step 2, showing the choice (Round 110);
step 3, one culprit (Round 111). Mission: `docs/kickoff-clashes.md`. Builds on Round 17
(clashes, `Game.clashes`), Round 19 (the provenance order), workstream 3 (`docs/defeasibility.md`: rule strength,
named exceptions, reservations and defeats) and Round 104 (an inference set aside goes whole).

## The reader's process

When two things a careful reader believes cannot both be true, the reader does not drop both, and does not drop
whatever came from the story. The reader gives up the thing that is held on the weakest ground. The annotation shows
what that ground is.

- **A witness's word against a chain from what was found.** Hunter was "equally certain" the stranger drugged him
  (¶36). The curry, the opium and the dish say the drug was put in at the house. The reader gives up Hunter's
  certainty, not the curry: "had he seen it, he wouldn't have eaten the food", and his certainty is "a conclusion
  … from a man just out of an opium stupor" (`t36.2`). The other false statements go the same way: Straker's honest
  record, his "anxiety", the hope of early exercise, Gregory's "poor weapon", Mrs. Straker's "friend", Brown's
  denial, Ross's "not my horse". Each of them is someone's word, and each meets a chain built from things seen.
- **Someone else's reasoning, before a fact.** The police's steps are ordinary presumptions (a sure witness has it
  right; a man who leads a horse out by night means to steal it). The reader takes them apart item by item
  (`t56.1`) and drops Gregory's gypsies with the reader's own reasons (`t62.4`). The reader never gives up "the
  stall was empty" to keep the police's account.
- **The reader's own presumption, once the facts need two stories.** One culprit for both crimes (`t4.2`) is held
  without noticing it. At ¶68 it breaks: the night "is three stories … They may involve different people"
  (`t68.3`). What gives way is the presumption, not a fact.
- **Not by contradiction at all.** Much of what the reader drops goes by strain or by a better explanation, not
  by a clash. A theory "held up by patches" (`t58.4`); the gypsies' theory "explains nothing about the curry or
  the dog" (`t62.4`); the maid as drugger "needs two" people where the inside story needs one (`t92.7`); at ¶226
  five old cards change meaning at once (`t226.2`). These are workstream 6's (graded support, strain, residue).
  A clash is only the logical edge of the same process.

So the reader's order, when a contradiction must be broken, is roughly as follows. Someone else's presumption goes
first. Then the reader's own rule of thumb. Then a witness's word. Then, last, a chain the reader drew from what was
found, and never the found thing itself. Within that order, a confession counts for more than a self-serving
denial.

## What exists

- **`Game.clashes`** (`engine/game.js:1808`) finds a minimal clash among the active constraints (QuickXplain),
  sets members aside, and searches again until what is left is consistent. A clash member is a doubtable reading:
  a clue's trusted reading, or an inference (with its rule applications, Round 104).
- **The weight** is by provenance only (Round 19): a story clue weighs 0, an inference stated by someone other
  than Holmes weighs 1, and one the player built or Holmes drew weighs 2. **Every member at the lowest weight is
  set aside.**
- **Which clash is found** depends on the order the search tries the members. The engine tries the heaviest first
  and the lightest last, so a clash rests on as light a member as it can. This matters as much as the weights. In a
  trial with the order unsorted, the narrated facts `c.stall_empty` and `c.head_shattered` were set aside.
- **What the player sees.** Easy lists each clash as a chain, with "doubt it" on its members. The text says the
  game "sets aside the claims caught in a clash". It never says which member was set aside. Medium and Hard do not
  list clashes; a check that fails says "or resolve a clash" when there is one.
- **A doubt resolves a clash** (the player's choice already wins). Resolved clashes are kept and saved.
- **Rule strength** (Round 104 onward): 72 rules `default`, 8 `hard`, 2 `heuristic`, 36 unmarked. Strength is
  checked against a list and used nowhere.
- **Attestation:** of the case's claims, 79 are testimony, 40 are a report (the narrator or Holmes relaying what was
  found or told), 2 are an admission, 15 are an observation and 5 are documents. Most of the night is told through
  the police's and Holmes's recital, so "a story clue" mostly means "someone's word". The line the reader draws is
  not between observation and testimony in the data.
- **Cost:** the first clash computation late in the story takes about 11 s (Easy, ¶218); the whole-story clash
  test about 35 s.

### Measured

A scratch script (kept in the session's scratchpad, to be made a test) replays the whole story for four players on
Easy (background when relevant). It records each clash as it appears and what each rule sets aside.

- **build:** builds everything buildable at every paragraph;
- **passive:** builds nothing, so it holds what is stated and keeps the police's account until a clash;
- **police:** passive, and doubts Holmes's curry step (`k.drugger_chose_the_dish`) as soon as it arrives;
- **culprit:** build, and from ¶4 applies one culprit (the taker of the horse is the killer, as a heuristic) and
  trusts it.

**Today's rule (R0), the true cards it sets aside:**

| Player | ¶ | Clash | Set aside today |
|---|---|---|---|
| passive | ¶104 | Holmes's dish step against Simpson's admission (true) and Hunter's charge (false) | **both statements**, the admission with the charge |
| police | ¶182 | Holmes's steps against `k.police_simpson_drugged` and `c.simpson_lives_at_villas` (true) | **the clue**; the police's step is kept to the end, with `k.police_simpson_took_horse` |
| build | ¶40 | `k.drugger_knew_the_dish` against Simpson's admission, his lodging (both true) and Hunter's charge | **all three statements** |
| build | ¶60 | the curry chain against `k.police_simpson_took_horse` and Simpson's lodging | **the clue**, again; the police's step is kept |
| build | ¶40 | `k.drugger_chose_the_dish` (true) against `k.police_simpson_drugged`, which this player built (not stated, so weighed as the player's own) | **both** |
| culprit | ¶40 | one culprit with the curry chain, the police's stick, and Simpson's lodging | **Simpson's lodging** (true) |
| culprit | ¶102 | one culprit with "the horse kicked him" and the stable door and empty stall | **`c.stable_door_open`, `c.stall_empty`** (narrated facts) |
| culprit | ¶219 | one culprit against "the horse kicked him" and `k.visitor_is_taker` | **all three**, Holmes's two true steps with it |

What works today, and must keep working: every false statement gives way to Holmes's chain (¶37 for a builder,
¶104 and ¶220 for a passive player); the stranger's "Can you tell me where I am?" goes alone at ¶24 (Round 99);
the police's four go once Holmes's steps arrive (¶102, ¶104, ¶114, ¶202).

**The kickoff's first case** (`k.police_simpson_took_horse` against `c.simpson_came_for_information`, Round 102)
no longer arises: Round 104 dropped `simpson.purpose` from that inference's formula. Its kin is the ¶60 and ¶182
rows above (Simpson's lodging lost to the police).

## Questions, alternatives, recommendations

### Q1. What gives way first?

- **(a) Provenance, as now:** a story clue, then others' inferences, then the player's and Holmes's. The trials
  show what it costs: the police's account outweighs true statements (¶60, ¶182), and an applied presumption
  outweighs narrated facts (¶102).
- **(b) Provenance, reordered:** others' inferences first, then statements, then the player's and Holmes's
  inferences. In the trials (R3) it loses no true card for the passive and police players. It still loses the
  stable door and the stall to one culprit.
- **(c) Defeasibility first:** weigh each member by the weakest rule it rests on (heuristic < default < hard), and
  by provenance only within a strength. One culprit then gives way, but so does the reader's own heuristic
  `k.at_a_stable_in_reach` before Gregory's gypsies (a default). Statements have no rule to weigh, so they need a
  strength of their own (the testimony default), and they tie with nearly everything.
- **(d) Classes from both (recommended).** Four classes, lowest given up first:
  1. an inference someone other than Holmes stated (the police's four, Gregory's);
  2. an inference of the player's (or Holmes's) that applies a **heuristic**: a rule of thumb, held without
     ground (one culprit);
  3. a statement: a clue's trusted reading;
  4. an inference of the player's or Holmes's, applying defaults and hard rules.

  Within class 3, by how it was told: testimony, then report, then admission (a man's word against himself counts
  most). This is the reader's order above. In the trials (R8) it loses no true card for the passive and police
  players. One culprit gives way at ¶102 to "the horse kicked him", keeping the stall and the door. The builder
  loses only the ¶40 tie (Q3).
- **(e) The player's choice, the game proposing.** This already exists in part: a doubt resolves a clash. A
  proposal still needs (a)–(d) to say what the game sets aside until the player chooses. See Q4.

**Reservations (a sub-question of (d)).** Should an inference with an exception raised and open (a reservation)
also drop to class 2? This is `t34.3`'s "weakens without defeating". But a player who raises the accomplice
against Holmes's `k.drugger_took_the_horse` at ¶218 would then lose that step, not Straker's false honest record,
at ¶220. **Recommended: not now.** A reservation keeps counting, as Round 101 agreed (Q2 (a): "it never holds the
pace"), and workstream 6's graded support is where a weakened step should weigh less.

### Q2. Is Round 19's "never by truth" kept?

**Yes (recommended).** Every key in Q1 (d) is something the player can see:
- who stated the inference;
- the strength of the rules it applies. This is a property of the rule as general knowledge. It is not shown on
  the card today, but the rule's text says it ("commonly taken to …"), and the "why" line of Q3 would name it;
- how the statement was told.

None of them reads the answer key. A **defeat** is not truth either: it is what the player holds, and it already
takes the step out (it is doubted). One discipline follows. A rule's strength must be authored as the rule's
general reliability, never by whether its use in this case is true. This is noted in the format doc. It cannot be
checked by the validator; the leak checker's `--background` prompt can be told to look for it.

The cost of keeping the rule: a player who builds a false inference themselves (the police's "Simpson drugged him",
built at ¶40 before the police state it) holds it as their own, class 4. That is what such a reader would do. The
game is not to rescue them by knowing it is false.

### Q3. One member set aside, or every one at the lowest weight?

A minimal clash is broken by setting aside any one of its members, so setting aside all of the lowest weight loses
more than it must (¶40, ¶104 above).

- **(a) One: the lowest by Q1's key; on a tie, every tied member (recommended).** A tie means the game has no ground
  to choose, so it does not choose. The builder's ¶40 clash (`k.drugger_chose_the_dish` against the police step the
  player built, both class 4) is the one tie left in the trials. The reader breaks it by `t36.2` (he could not have
  seen it), which the player can play from ¶218, or by a doubt at any time. Round 91's Holmes ruse against Mrs.
  Straker's denial would tie the same way. It stays as it was left (no slot content for the ruse).
- **(b) One, ties broken by recency** (the newer card gives way, or the older). This is deterministic, but it
  chooses on no ground the reader uses. At ¶40 the builder made both steps in the same paragraph.
- **(c) All at the lowest weight, as now.**

**How the choice is shown** (Easy): each clash names what the game set aside and why, in one line ("Set aside:
Hunter's charge. A witness's word gives way to a chain you drew from what was found."). Each other member gets
"doubt this instead". Doubting it resolves the clash the player's way, as a doubt does today.

### Q4. What the difficulty presets show

- **(a) Easy as above; Medium and Hard unchanged (recommended).** Finding clashes is the player's work there
  (Round 17). The set-aside rule still decides what their checks use, and a failed check already says "or resolve a
  clash".
- **(b) Medium shows the count** ("2 clashes among what you trust"), not the members. This is a hint that something
  you hold is wrong, which the reader of a whodunit already knows.
- **(c) Every preset shows them.** This takes the work away from Medium and Hard.

### Q5. One culprit (Q6 of `docs/defeasibility.md`)

With Q1 (d), an applied heuristic gives way before a story clue, which was the blocker.

- **(a) `r.one_culprit` with a formula, `heuristic`, applied by the player (recommended).**
  - "Two crimes of one night at one place are commonly the work of one hand", unless "one caused the other" or "two
    hands acted apart". Shown from ¶4 after a leak check; exceptions named, no formulas (nothing in the story
    settles them as such).
  - The formula, over two events: the agents are the same. The player applies it to the taking and the blow.
  - `t4.2` maps it and loses `no_inference`.
  - Played (the trials): it clashes at ¶40 for a builder (with the police's stick and the curry chain; the police's
    step goes first) and is set aside at ¶102, when "the horse kicked him" is built. For a passive player it is
    set aside at ¶202, when Holmes states the kick. No clue is lost.
- **(b) A rule card with no formula,** as Round 101 proposed: shown, mapped, never applied, never clashes.
- **(c) Leave it for workstream 6.**

**`t68.3` (the break at ¶68) is workstream 6's** (recommended). At ¶68 nothing contradicts one culprit. The reader
lets it go because the night now needs three stories, which is strain and explanation, not a clash. The clash at
¶102 or ¶202 is the later refutation, which this paper gives. `t68.3`'s `no_inference` becomes `workstream-6`.

### Q6. What waits for workstream 6

- Graded support and strain: a theory losing to patches (`t58.4`), the better explanation (`t62.4`, `t92.7`), the
  REVISE moment (`t68.3`, `t226.2`). They may later refine class 4 (a strained step weighs less) and decide whether
  a reservation weakens a step in a clash (Q1).
- The key in Q1 (d) is a tuple, so workstream 6 can add to it without changing what this paper fixes.
- Nothing here needs to wait for it.

## The cases as tests

Each becomes an assertion in a new `clashes.test.js` (the measuring script, reduced to the paragraphs that matter):

| Case | Player | Expected |
|---|---|---|
| Simpson's lodging against the police's account (¶60 build, ¶182 police) | build, police | the police's step set aside; `c.simpson_lives_at_villas` kept |
| Simpson's admission beside Hunter's charge (¶104 passive, ¶40 build) | passive, build | only Hunter's charge set aside |
| One culprit applied from ¶4 | culprit | set aside at ¶102 (build) or ¶202 (passive); `c.stall_empty`, `c.stable_door_open`, `k.horse_kicked`, `k.visitor_is_taker` kept |
| False statements against Holmes's chain (¶37, ¶104, ¶220) | build, passive | each statement set aside alone (unchanged) |
| The stranger's "lost" (¶24, Round 99) | Medium | only his statement (unchanged; `belief.test.js`) |
| Hunter's "lying" reading against "he was certain" | Medium | still a clash (unchanged) |
| The police's four at the end of the story (Round 104) | background at start | set aside whole, their applications with them; no true clue lost (unchanged) |
| A tie (the builder's ¶40) | build | both set aside, shown as a tie |
| No true card lost to the end of the story | passive, police | the set-aside lists hold only false cards |

**Expectations that change:** at ¶46 a passive player keeps the hope of early exercise (false) and sets aside the
police's "took the horse to steal it" instead. The hope goes at ¶104, to Holmes's chain. No current test asserts
the ¶46 outcome. I will check every clash test file whole before the suite.

## Order of work (if agreed)

1. **The weighing** (engine). Q1 (d)'s classes and the testimony/report/admission sub-order. One member set aside,
   ties all. The search tries members in key order, heaviest first. Each clash carries `aside` (what was set
   aside) and `why` (its class). `clashes.test.js` with the cases above. The logs, reports and gates diffed (no
   card text changes, so I expect nothing to move there; the clash lists will).
2. **Showing the choice** (Easy UI): "Set aside: …, because …", and "doubt this instead". Checked in headless
   Chrome.
3. **One culprit** (data and thoughts). `r.one_culprit` (heuristic, formula, two named exceptions), leak-checked;
   `t4.2` maps it; `t68.3` deferred to workstream 6 with that reason; mirrored in `reading-annotated.md`. Tests:
   the culprit rows above. `docs/defeasibility.md`'s Q6 closed with a pointer here.

Each step is one commit with a Round entry, gated on `npm test`.

## For Robert

1. **Q1:** the four classes (others' inferences; the player's heuristics; statements, by how told; the player's and
   Holmes's inferences) (d)? Reservations left out of it for now?
2. **Q2:** "never by truth" kept, with rule strength authored as general reliability?
3. **Q3:** one member set aside, ties all, and Easy says which and why, with "doubt this instead"?
4. **Q4:** Medium and Hard unchanged?
5. **Q5:** `r.one_culprit` as an applied heuristic with a formula, and `t68.3` to workstream 6?
6. **The order of work** above?

## Agreed (Robert, Round 108)

The recommendations of Q1–Q5 as written, and the order of work:
- the four classes, with reservations left out of them for now;
- "never by truth" kept;
- one member set aside, ties all, and Easy says which and why;
- Medium and Hard unchanged;
- `r.one_culprit` as an applied heuristic, with `t68.3` going to workstream 6.

Robert, on the standard to aim for: the clash system is a convenience the lower difficulties provide, so it need not
be perfect. A case it gets wrong is listed, not chased.

## Left open (Round 111)

- **One culprit is an authored inference, not only an applied rule.** Q5 said the player applies the rule. Robert
  chose, at build time, an inference the reader builds (`k.one_culprit`), so that `t4.2` names it as every DEFAULT
  thought does. Its application is defeated by "two hands acted apart" in the answer key.
- **The tie** at ¶40 (a player who builds the police's "Simpson drugged him" beside Holmes's dish step) sets aside
  both. The player resolves it with a doubt, or with "he could not have seen it" from ¶218.
- **Reservations** keep their weight in a clash (Q1); workstream 6's graded support is where a weakened step could
  weigh less.
- **`t68.3`** (the break of one culprit by strain at ¶68) is workstream 6's: `no_inference: workstream-6`.
- **`workstream-3`** is no longer used by any thought. It stays a valid `no_inference` value for now.
