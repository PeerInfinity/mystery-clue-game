# Archipelago integration: the plan

**Spoilers:** this page refers to the questions and accounts of "Silver Blaze".

**Status (2026-11-08): a plan, agreed in discussion with the user. Nothing here is built.** The game is in active
development (a second story, with mechanics that may be ported back to Silver Blaze), and the plan waits for the
mechanic that links evidence to questions to settle. The numbers below were measured at commits `5d6b19e` to `a5fb04e`;
they will move as the data does, so re-measure before relying on one.

This replaces the idea in `docs/ideas.md`, "Archipelago integration", of converting the earlier game to the DepGraph
world. What that attempt showed is still recorded there. The further aim of new stories in one interconnected world is
in `docs/interconnected-world.md`.

## The design in brief

- **A new world in Archipelago-CC**, not a DepGraph conversion, with the same kind of bridge Journey to Ascension uses.
- **Locations: answering questions**, one per gated question (27 for Silver Blaze). Locations for ruling out specific
  answers may come later.
- **Items: groups of evidence**, by default the witness accounts. Hint tokens are the filler. Reasoning tools as items
  are to be tried, as an option of the APWorld.
- **The check** fires on choosing an answer after linking all the required evidence. Any answer counts; right or wrong
  is judged at the give-away, as now.
- **Reading stops at each give-away** until that question's check has fired, so no check can be read past.
- **A missing account leaves the story readable.** The story panel marks the sentences that came from it as currently
  unusable.

## Why not DepGraph

DepGraph has only "all of these" prerequisites: no "any of these", and no way to say that a move is lost after a
certain point. The earlier game needed both. Watson's timeline removes the expiry, but its alternatives remain: 18 facts are
held by more than one account, and "accept every valid route" needs alternatives between facts too. Ordinary
Archipelago rules express these directly.

## What was measured

**Nothing expires any more.** The 15 reasoning moves of the true path were all delayed to the last paragraph, on a
throwaway copy, and the whole path still played through the real page.

**Evidence rarely blocks the engine's reasoning.** Of the 111 moves of the true path, 78 are circles and crossings, 18
are trust settings and 15 are reasoning the engine checks. Withholding each of the 25 accounts other than Watson's in
turn (the end state of the true path, a hook on the provenance chains) took up to 39 facts off the timeline, but only 5
of the 25 touched any checked reasoning. So "this clue unlocks that deduction" cannot be read off the engine's moves:
required evidence has to be stated as data.

**Where the 27 gated questions fall.** Scene 1 has none, scenes 2 and 3 one each, scenes 4 to 6 none, scene 7 four,
scene 8 three and scene 9 eighteen. Chapter keys as items would have too few checks to hold them. A question can be
answered well before its gate, though, so many are open at once:

| Reading stops before | Answerable by then | Still unanswered |
|---|---|---|
| ¶40 | 8 | 8 |
| ¶58 | 15 | 14 |
| ¶146 | 21 | 19 |
| ¶181 | 22 | 17 |
| ¶202 | 23 | 17 |
| ¶212 | 23 | 15 |
| ¶218 | 25 | 16 |
| ¶220 | 26 | 15 |
| ¶221 | 26 | 11 |
| ¶223 | 27 | 10 |
| ¶224 | 27 | 9 |
| ¶226 | 27 | 8 |
| ¶228 | 27 | 4 |
| ¶229 | 27 | 3 |

"Answerable" is the latest of the paragraph that raises the question, the one where its answer becomes available and
`answer_inferable_at`. It does not yet count what linking will add.

**How the evidence is recorded today.** Of the 27 gated answers, 7 point to a fact and 20 give their reasoning only as
prose (`answer_reasoning`); 26 are marked `likely`. Of the 55 wrong possibilities, 7 record what rules them out.

**Watson's own observations are free.** He alone holds 294 of the 681 facts. Using a rough stand-in for required
evidence (facts named by `answer_from`, `by`, likely clashes and the true path), 10 of the 27 questions needed no other
account at all.

**The story panel.** Facts held only by accounts other than Watson's fall in 63 paragraphs: 42 with one account, 17
with two, 4 with three or more. Every fact has its quote.

## Required evidence

Required evidence is the question's `essential` observations (`world/observations.json`, `engine/observations.js`):
an observation is filled when all its entries are on the timeline and linked to its question.

- **The check:** exactly one answer chosen, and `described(...).done` for that question. Essentials belong to the
  question and not to an answer, so choosing a wrong answer fires it too, and a check reveals nothing about which is right.
- **The items a question needs:** for each fact in an essential observation's `from`, any one account that carries
  it. A fact a narrator observes, or hears said, needs none unless Watson's account is split (below).
- **A withheld account** takes its facts off the timeline, so the observation empties, and it fills again when the
  item arrives. Nothing special is needed for this: withholding acts where trust does, on the chains.
- **Trust** is the player's own and can be set back, so it is no problem for the logic, and a check fires only once.
  An essential observation must not rest on a false statement.
- **`if: {q, pick}`** makes a question wait until that other question can be answered. It needs no item.
- **Trying everything:** linking from a question costs one click per entry, so a player can try every link. That was
  accepted for the game (`docs/ideas.md`, "Observations and open questions"), and it stands here.

## The logic

A question can be answered once the player can read to the paragraph where it is answerable and holds its evidence.
Reading to a paragraph needs every question given away by then to be answered. So:

    needs(q) = evidence(q) + needs(every question given away at or before q's earliest paragraph)

This cannot loop: a question depends only on gates strictly before its own. The rules are a fixed list of items for
each location, so the engine is not consulted at generation and more items can never remove a location.

The hints guarantee that a player holding every item cannot stall the multiworld, since a stall here holds up other
players' items. The hint check already proves that a player who only takes hints reaches the end; it has to go on
proving that with links.

## Items

The limit is the number of locations: 27 for Silver Blaze, with room left for hint tokens.

- **Groups of evidence.** An account is the default unit, but not a good enough one by itself: Watson's observations
  are free, which leaves questions with no gate, and in The Speckled Band most of the case may reach Watson in Helen
  Stoner's one narrative. Splitting Watson's account by scene closes the first gap, and gives 34 groups for Silver
  Blaze, so some would have to merge. The likely shape is a small list of evidence groups for each case, defaulting to
  accounts. To be settled once The Speckled Band's facts exist, so that one scheme serves both.
- **Hint tokens**, useful filler.
- **Reasoning tools, as an option.** A tool belongs in the logic only where an observation depends on what the tool
  produces: `route_through` already needs the route move, and a `from` could name a player's reasoning entry. Elsewhere
  a tool is a helpful item that nothing requires. Their use on the true path is uneven:

| Tool | Moves | Questions served |
|---|---|---|
| What is this for? | 9 | 10 |
| What would this need? | 3 | 6 |
| What stopped it? | 1 | 2 |
| It changed | 1 | 1 |
| Compare | 1 | 1 |
| What it needs | 0 | 0 |
| Accounts for | 0 | 0 |

With tools on, there are fewer slots for evidence, which is one reason to want the rule-out locations.

Item and location names are visible to the whole multiworld, so they must not give anything away. Account labels name
only the source and are safe. Question labels are not, so the world uses neutral names (DepGraph's generic names, with
the real ones sent in slot data, are the precedent), and the page shows them through `engine/shown.js`.

## The story panel

Each sentence that came from a missing account is marked, with a note such as "Edith Baxter's account: not yet usable".
Marking by sentence and not by paragraph is needed because a third of the affected paragraphs mix accounts. Every fact
of a missing account is marked, not only those a question needs, or the marks would show what matters. The label
follows the page's existing rules for what a name may say at a paragraph.

## What the game has to change

1. **The observations format.** `described` requires every essential, so there is no "any of these" between different
   facts proving the same point. Alternatives of account for one fact need nothing; alternatives of fact need something
   like a group of essentials, one of which is enough.
2. **Silver Blaze's `observations.json`** does not exist yet (only the invented `sealed-room` case has one so far). The
   27 gated questions need authoring: pipeline step 9d is written to produce this file for a new story, and
   `answer_reasoning` is the material.
3. **The true path and the hints learn linking**: `path.json` gains link moves, and the path check then proves that
   every required link can be made.
4. **The gate** waits for a question's check, not only one circle, when playing under Archipelago.
5. **A check must not announce itself early.** `described` is consulted only after the give-away today. The page goes
   on hiding what is missing, and only fires the check.
6. **The Archipelago layer**: withheld accounts, the marks in the story panel, a Commit or equivalent if choosing an
   answer proves too easy to do by accident, and the bridge's piece inside the page.

All of it depends on Archipelago mode being off by default, so that the plain game plays as it does now.

## The Archipelago side

- **An export from the game**, generated from a case in the structure format (below), with the game's commit. The world
  reads only this; Python does not run the engine. Observations naming facts, not moves, is what lets the file survive
  changes to the mechanics.
- **The world** in `worlds/`, with a case option if more than one story is exported. Fill tests can run on the export
  before any page work.
- **The bridge**, modelled on `frontend/modules/jtaArchipelago`: a host module with no UI turns the game's event into
  a location check (`user:locationCheck`), and on each `game:itemsReceived` re-reads the whole inventory and sends the
  held set to the page through `iframeAdapter`. Reading the whole inventory each time makes reconnects safe.
- **Hosting:** a built-site branch as a git submodule, like `swfrecomp-browser`, not the whole repository. The page and
  its data are about 2 MB, against about 85 MB tracked in all, most of it `pipeline/runs/`. The pin keeps the logic and
  the page of one version together while the game is changing, and a check should hold the export's commit to it.

## The structure format and its validator

One small format describes a story's logic: its questions, the clues each needs and the order of its gates. The names
in this sketch are invented.

```json
{ "story": "ferryman", "goal": "q.central",
  "questions": [{ "id": "q.who_signed", "gate": 3,
                  "needs": [["c.ledger", "c.stamp"], ["c.letter"]] }],
  "clues": [{ "id": "c.stamp", "for": "ferryman",
              "found_at": { "story": "clerk", "question": "q.who_paid" } }] }
```

A question becomes a location and a clue an item. `needs` lists alternative sets of clues; `gate` gives the reading
order. One world reads these files, the way DepGraph takes a custom `graph_file`. The export of a finished case is in
the same format, so what is validated is the code that ships. A person or an LLM can also write one by hand before a
story exists (`docs/interconnected-world.md`, "How a story is written").

A script runs a file through Archipelago's generator. Whether a pass means anything depends on its settings:

- **`found_at` becomes a real placement,** through `plando_items`, which can place an item in another player's world.
- **Item plando has to be on and strict.** It is not in the default host options (`--plando items`), and its `force`
  defaults to `"silent"`: it has to be `true`, or a failed placement could be skipped rather than reported.
- **Accessibility `full`.** With `minimal`, only the goal has to be reachable.
- **Several seeds**, and each combination of stories meant to be playable together.
- **Errors in the author's terms.** `FillError` speaks of Archipelago's items and locations; the script translates
  them back to clue and question ids.

This does not depend on the linking mechanic, which only has to supply the `needs`. How long a run takes has not been
measured.

## Order of work

Can start at any time:

1. The structure format, the world that reads it, and the validator, tried on hand-written files.

Once the linking mechanic has settled:

2. Finish the observations format, with "any of these" between facts.
3. Author `observations.json` for Silver Blaze, then give the true path and the hints their links.
4. Export Silver Blaze to the structure format, and run it through the validator.
5. Build the bridge and the marks in the story panel.

## Later

- **Locations for ruling out specific answers**, with the evidence for each. An observation's `against` is the place
  to start. The room panel's refusal of a crossing no fact supports is a precedent.
- **Reasoning tools** as an option of the APWorld, tried once the rest works.

## Open

- How evidence divides into items (above).
- The goal: reaching the end of the story, or a number of answers right. Not discussed yet.
