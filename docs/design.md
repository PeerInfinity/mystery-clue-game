# Mystery clue game — design proposal (draft 1, 2026-10-13)

Status: PROPOSAL, awaiting the user's answers on the open questions at the bottom. Nothing is implemented.
Story: "Silver Blaze" only, fully fleshed out before a second story. The v0.1 extraction is kept in
`reference/v0.1/`. Code: this repository (`~/CC/mystery-clue-game`, local only, no remote).

## The user's requirements (2026-10-13, in their words, condensed)

1. Nodes for **everything** in the story: every character, event, location, object — chain or not.
2. The interface reports whether nodes **could plausibly fit together**, not whether a link is in the real solution.
3. Play like **jigsaw × sudoku**: rule out what doesn't fit until one solution is left. The player can list several
   **possible connections per node** (pencil marks). Easy mode: the game lists every option; the player only eliminates.
4. A node shows **everything the player knows about it so far**, including period knowledge the original readers had
   and modern readers may not (racing terms, money, Victorian household, medicine, Dartmoor).
5. Nodes **as granular as possible**.
6. Knowledge on cards; some of it maybe its own nodes/edges — try and see.
7. **Every valid route** accepted.
8. False hypotheses: a set of nodes that seem to fit together but don't fit the rest — **building it is gameplay**.
9. Track **each time axis separately**.

## Proposal

### A. Data: case format v0.2

- **Cards for every entity** (person, animal, place, object, document, group) and **every fabula event**, not only
  the 100 clue nodes. Today's 62 entities / 46 events grow to a full inventory (every named or described thing,
  every action anyone takes on or off stage).
- **Atomic claims.** One proposition per node: "the stable door was locked", "Hunter was inside", "Edith saw a
  man at the window", "the man wore a red-and-black cravat"... A testimony becomes *who said it, when* + the claims
  it asserts; reliability is a property of the telling, not of the claim.
- **Facets on cards** — the "what you know" view. Each card lists facts the player has unlocked about it (each
  facet is a claim node, so the card view is a query, not duplicated text), plus **period notes** (a glossary layer:
  *tout, laying against a horse, the Wessex Cup, stable lad, curried mutton, cataract knife, milliner, guinea,
  field glass, a "plate", King's Pyland as a training stable...*). A period note is shown as context; when the
  reasoning needs it as a premise it is also a **rule** node (opium can be tasted → rule card).
- **Slots (the jigsaw tabs).** A node's kind decides what open questions it has:
  - event: *who did it, where, when, with what, why (cause), what followed*;
  - object found: *whose, how it got there (event)*;
  - claim / testimony: *which event it is about; true or false*;
  - person: *where at time T* (a whereabouts row per key time window);
  - the case questions (who drugged the curry, who took the horse...) are slots too.
  Each slot has a typed domain (persons, events, places, a time range...). The tab shapes are the edge-type rules.
- **Constraints instead of a fixed answer graph.** Each authored constraint says which slot values it excludes (or
  how two slots must relate) and lists its **premises** (the claim/rule nodes it rests on). Example: "the drugger was
  in the kitchen between 9.00 and 9.10" ← [Edith carried the dish from the kitchen at 9; opium can be tasted; curry
  hides it]. Several constraints may exclude the same value — that is how **all valid routes** are accepted.
  Existing v0.1 inferences convert into constraints; their conclusions stay as derived claims.
- **Three time axes stay separate:** fabula (`when` on events/claims, itself sometimes a slot to solve),
  investigation (Holmes's actions; for the game, the player's own discovery log), disclosure (scene).

### B. Engine (pure JS, unit-tested, no UI)

- Load a case; maintain the player's state: unlocked nodes, pencil marks per slot, eliminations, theories.
- **Plausibility** of "X fits slot S": always the shape check (type/domain, time ranges overlap, place reachable);
  the deeper check uses only constraints whose premises the **player has unlocked** — never hidden facts, never
  the answer.
- **Justified elimination** (the MetaMath part): the player strikes X from S citing nodes; the engine accepts if the
  cited set contains the premises of any constraint that excludes X. Uncited strikes allowed as pencil-only.
- **Theories** (sudoku "what if" branches): a named set of slot assignments. The engine reports which unlocked
  constraints a theory violates. The police theory = consistent with the scene-1–4 clues, broken once the curry /
  dog / knife / bill clues are placed. Building it is play; breaking it is play.
- **Validator, not engine:** with every node unlocked, every case slot has exactly one surviving value
  (uniqueness, like a well-formed sudoku); with the police's clues only, the Simpson theory survives.

### C. UI (first version)

- Board of cards (jigsaw), card detail panel (facets, period notes, all three times), slot editor with pencil marks,
  a timeline view per axis, a theory switcher. Clue collection v1 = reveal by scene (or by Holmes's actions); the
  text-adventure phase replaces this later.

### Slices

1. Data v0.2 + schema + validator with the uniqueness check (in the worktree).
2. Engine + vitest.
3. UI.
Each slice is reviewed with the user before the next.

## Rulings (user, 2026-10-13)

- **Plausibility depth = a difficulty setting.** Easy: shape + the player's unlocked facts, candidates auto-listed.
  Hard: shape only; ruling out by facts is the player's job (checked when they cite reasons).
- **Eliminations: reasons optional.** Plain cross-outs are pencil marks; a cross-out with cited clues + rule is
  checked MetaMath-style and marked proven.
- **Location: standalone page**, pure-JS engine with tests; wrap as an Archipelago substrate/panel later.
  Revised the same day: **a new repository, local for now** (`~/CC/mystery-clue-game`), not a branch of
  Archipelago-CC.
- **Publishing: local commits only**; no remote until the user says so.

## Model refinement (slice 1, my choices — revisable, report back to the user)

- The fabula is a set of **facets** (event.agent, event.place, event.time, object.owner, person whereabouts at a
  time window...). Each facet is a **slot**. The solution is one assignment of every slot.
- An atomic **claim** mostly asserts a facet value. Claims from observation/physical evidence are givens;
  claims from testimony get a **truth slot** of their own (`implies(truth=true, facet=value)`), so a lie or a
  mistake is part of the jigsaw rather than an inconsistency.
- **Constraints** are small formulas over slots (`eq`, `ne`, `in`, `implies`, `and/or/not`, `before`), each with
  its premise nodes. Elimination check = "S=X is inconsistent with the constraints whose premises are all in the
  cited set" — so ANY sufficient citation is accepted (every valid route), no route authored by hand.
- Uniqueness (validator): all constraints active → exactly one solution. Police check: police-known constraints →
  the Simpson theory is consistent.
- v0.1's inference hyperedges are kept as **Holmes's route** (documentation / hints), not as the checker.
