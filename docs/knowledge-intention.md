# Knowledge, intention and belief (world model, step 5)

Status: **PROPOSED** (2026-10-16, Round 71). For Robert to decide; nothing is built. Builds on the world model as
built (Rounds 60–70: location, possession, condition, splits and order). Belief goes with workstream 4
(testimony) of `docs/gap-analysis.md`.

## Why

The reader's picture of Monday night is not only where things were. It is also who knew what, and who meant what:
- the stranger knew the stable's night arrangements, so he was not lost;
- Straker meant to lame his horse;
- Brown first meant to lead the horse home, and then to hide it;
- after Holmes's visit, Brown means to keep it safe.

The inside story of the s04 checkpoint (`t92.6`) is half intentions ("needs money", "means to profit", "plans to
lame"). Six thoughts still have no inference for this reason (`no_inference: world-model`): `t24.2`, `t34.5`,
`t78.2`, `t82.3`, `t123.2`, `t150.1`.

## What exists

- **Knowledge, untimed, as relations:**
  - `knew_menu` ("did this person know beforehand what the supper would be?");
  - `acquainted` ("does the dog know this person well?").

  Both are written in `relations.json` and argued with by rule schemas. Neither has a time.
- **Intention, untimed, as facets:**
  - the purpose of an act: `e.horse_led_out.purpose` (injure / steal / exercise), `e.knife_taken.purpose`,
    `e.coat_off.purpose`;
  - a person's: `simpson.purpose`, `straker.motive`.
- **Belief, only through claims:**
  - a claim may be false (`truth` slot), and the player may doubt it;
  - Hunter blaming the stranger is a claim with truth false;
  - nothing says whether a speaker believes what he says (mistaken) or not (lying).
- **The world model:**
  - sparse state tracks per thing, aspect and window;
  - built-in ties to events (agent and patient there, holder with held);
  - splits and order questions;
  - checked placements on the board, with states opened on commit (Rounds 68–70).

## The six thoughts, and what each needs

| Thought | The reader's step | What it needs |
|---|---|---|
| `t24.2` | A lost man would not know the stable's night arrangements; the "lost" story is a cover: he came on purpose. | **Knowledge** (the stranger knew the arrangements when he came to the window), a rule tying knowledge to acting on it, and an **intention** (he came on purpose: `simpson.purpose` is not "lost"). |
| `t34.5` | Straker went out at one to the stables; either he never got there, or he got there and raised no alarm. | **Knowledge** (had he got there, he would know the stall was empty), a **disposition** (an honest trainer who knows raises the alarm), and an **absence** (no alarm was raised). The absence is workstream 5. |
| `t78.2` | His money and watch are on the body: not a robbery, nobody searched him. | **Possession** in the morning (built: the sovereigns and the watch, held by Straker) and an **intention** for the blow or the visit (to rob, or not), with a rule: a robber who kills takes what he came for. |
| `t82.3` | The guard was by the body: the blade was unsheathed in the hollow. That fits both readings. | A **condition** only ("sheathed", on the knife). It settles no question; an implicit inference would hold it. Nothing new. |
| `t123.2` | Brown set out to lead the horse home, then turned back: he found the horse first and decided afterwards. | **Intention over time:** Brown's aim before he turned and after (a window split at his turning back), from the tracks. Needs the event order of the parallel session (`docs/kickoff-event-order.md`). |
| `t150.1` | Brown now has every reason to keep the horse safe. | **Knowledge of knowledge** (Brown knows Holmes knows), a **motive** (his only hope of mercy) and an **intention** (keep it safe) after Holmes's visit. |

## Questions, alternatives, recommendations

### Q1. What is a piece of knowledge about?

- **(a) Propositions (recommended).** Knowledge is a boolean track per thing and proposition:
  `st.<thing>.knows.<proposition>.<window>` ("does Brown know, at dawn, that Holmes knows?").
  - Propositions are cards already (`propositions.json`, boolean, with a `means` formula), and new ones are
    authored where the story needs them ("the stall is empty", "the night arrangements of the stable", "Holmes
    knows Brown has the horse").
  - It reuses the condition machinery: a knowledge track is a condition whose name is `knows` and whose object is
    a proposition.
- **(b) Relations, extended with a time** (today's `knew_menu`, `acquainted`). Small, but every new kind of fact
  needs a relation of its own, and a fact about a fact (`t150.1`) does not fit.
- **(c) A slot and a value** ("knows that `e.horse_led_out.agent` = straker"). General, but it ties knowledge to
  the case's questions, and most of what characters know is not a case question.

The existing relations stay as they are; they work and are untimed. Moving them onto knowledge tracks would be a
later clean-up, if ever.

### Q2. What ties knowledge to the world?

By Round 61's ruling, what holds always is built in, not a rule card. Knowledge has few such laws.

- **Built in (recommended):**
  - knowledge persists: known in a window, known in every later one of that track;
  - what is known is true: knowing F at T means F.
- **Default rule cards** (`knowledge.json`, with `unless`, so a player can see and doubt them):
  - who is told something knows it (a telling event with a `recipient` and a content proposition), unless he
    did not believe it;
  - who is present and awake at an event sees it (location and condition states, built), unless it was dark or
    hidden;
  - who acts on a fact knows it ("he came to the window at the hour the lad was alone with his supper"), unless
    by chance.
- **Alternative:** all of these built in. Simpler, but seeing and being told have real exceptions, and the story
  turns on one: Hunter "saw" the stranger drug him and did not.

### Q3. Intention

- **(a) An intention track per person (recommended),** a sparse aspect like location:
  - `st.<person>.aims.<window>`, over a case-specific domain of aims (to get a tip, to lame the horse, to lead the
    horse home, to hide it, to keep it safe);
  - a built-in tie: an act's purpose (the facet that exists) is its agent's aim at its time;
  - aims change at an event (a window split, as for places): Brown before and after he turned back.
- **(b) Only the purposes of acts,** as now. `t123.2` and `t150.1` are about a person's aim over time, not one
  act's, so they would stay without an inference.

A motive (`straker.motive`) stays a facet: it is why, not what for, and it has no time in this story.

### Q4. Belief

- **Recommended: defer to workstream 4 (testimony), fixing the shape now.**
  - Belief is a boolean track per person and proposition, like knowledge: `st.<person>.believes.<proposition>`.
  - Built in: knowing implies believing.
  - With workstream 4: a sincere speaker believes what he says. A testimony claim then splits into what was said
    (narrated, true) and what the speaker believes (a belief state, which may be false): mistaken (believes,
    false) against lying (does not believe).
- **Alternative:** build belief now with knowledge. It would be unused: no thought among the six needs it, and its
  real use (Hunter mistaken against lying; Mrs. Straker taking Derbyshire for a friend) is the testimony work.

### Q5. On the board

- **Knowledge and intention go on the "By thing" board and the cards,** pencilled and committed as conditions are
  (Round 68).
  - Knowledge is yes or no per proposition the player picks.
  - An aim is chosen from the case's aims.
- **No "By place" view for them.**
- **Checked commits and states opened on demand work unchanged**, since they are aspects of the same tracks.

## How each thought would take its inference (with Q1–Q4 as recommended)

- **`t24.2`:**
  - Simpson's knowledge at the window scene of "the lad on guard eats his supper alone at nine" is given by the
    "acts on a fact" default: he came to that window at that hour with a paper.
  - A rule then says a stranger who is lost does not know a place's night arrangements, which doubts his "lost"
    account.
  - The inference concludes that `simpson.purpose` is not to find his way.
- **`t34.5`:**
  - If Straker was at the stable after one, he would know the stall was empty: "present and awake sees".
  - An honest trainer who knows raises the alarm (a disposition rule).
  - No alarm was raised. That needs the absence of an event as a fact the player holds (workstream 5). Until
    then the thought keeps `no_inference`, with the reason changed to `absence`.
- **`t78.2`:**
  - The sovereigns and the watch are held by Straker in the morning: possession, built, with two new tracks.
  - A robber who struck him would have taken them (default).
  - So the visit's aim was not robbery (Q3a, the aim of whoever struck him; or a purpose facet on the blow).
- **`t82.3`:** a condition track "sheathed" on the knife, unsheathed at the blow, and an implicit inference. No
  case question, no gate.
- **`t123.2`:**
  - Brown's aims split at his turning back: to lead the horse home before, to keep it after.
  - It rests on the tracks (claims) and on the order of the events, which the parallel session provides.
- **`t150.1`:**
  - After Holmes's visit, Brown knows Holmes knows (he was told, with Holmes's own words as the quote).
  - A rule: one whose only hope of mercy is to produce a thing safe keeps it safe.
  - The inference concludes Brown's aim after the visit is to keep the horse safe.

## Order of work (if agreed)

1. **Intention:**
   - the aim aspect, its tie to purposes, aims over split windows;
   - `t123.2` (after the event-order session) and `t78.2`;
   - two possession tracks.
2. **Knowledge over propositions:**
   - the two built-in laws and the three default rules;
   - the propositions the six thoughts need;
   - `t24.2` and `t150.1`, and `t34.5`'s knowledge half.
3. **The board:** knowledge and aims pencilled and committed.
4. **Belief:** with workstream 4.
5. **Rewrite the reasons** of the thoughts left without an inference (`t34.5`: absence).

Each step keeps the reading layer sacred: every proposition, aim and track answer is quoted through a claim's
own line, and the fair-play test, the reveal and foreshadow logs and the gate listing are diffed.

## For Robert

1. Q1: knowledge about propositions?
2. Q2: two laws built in, three as default rule cards?
3. Q3: an aim track per person, tied to the purposes of acts?
4. Q4: belief deferred to workstream 4, with its shape fixed now?
5. The order of work above, starting with intention?
