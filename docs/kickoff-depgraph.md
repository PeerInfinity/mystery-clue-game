# Kickoff: the player's actions as an Archipelago-CC DepGraph

**Date:** 2026-10-22. Handed off by the session that ran Rounds 203–211 of `docs/design.md` (the hint system: agreed,
built in four steps, then the cooldown and the count by rungs). **Supersedes** `docs/kickoff-hints.md` (done).

## Robert's ask (Round 212)

"What I want to do next is discuss how we could export a dependency graph of the player's actions in the format of the
Archipelago-CC DepGraph. I want two versions, one for reaching maximum score, and one for just keeping up with Holmes.
I want to treat completing the necessary actions with the currently available cards as a dependency for continuing the
story, and I want to treat continuing the story as a dependency for getting the next set of cards. We should start a
new session for this."

So this session is a **discussion, then a paper** (`docs/depgraph.md`): what the nodes and edges are, how the story's
progress is cut into steps, what each of the two versions contains, and how the export is made and checked, with
alternatives and recommendations. **Robert decides direction; nothing is built until he agrees.**

The shape Robert set: a chain that alternates **story → cards → actions → story → …**. A stretch of story gives
the cards it opens; the actions needed now are made with the cards held; those actions are needed before the story may
go on; the next stretch gives the next cards.

## The target format (Archipelago-CC, read 2026-10-22)

`/home/robert/CC/Archipelago-CC/worlds/depgraph/` (Robert's other project; **don't change that tree without asking**).
`docs/setup_en.md` has the custom graph formats, and `Rules.py` (~l.110–290) is the loader. In JSON:

```json
{ "title": "…", "nodes": { "id": { "label": "…", "description": "…", "depends_on": ["other_id"] } } }
```

DOT and CSV (`id,label,depends_on,description`, with the dependencies split by `;`) also load. The graph must be a DAG.
Each node becomes an item and a location, and each edge becomes an access rule. `entrance_rule_mode` controls how
nodes with many dependencies are handled, which matters for large convergence nodes. The loader reads only `label`,
`description` and `depends_on`, so check `Rules.py` before relying on any other field. Bundled examples are in `data/`
(e.g. `taskflow_example.json`), and `tasklist/` has two converters into this format.

## What exists here (the data a graph could draw on)

- **`cases/silver-blaze/hints.json`** (`npm run hints`, `engine/hints.js`):
  - `moves`: the minimal playthrough's moves, each with `seq`, `at` (the paragraph), `op`, the cards, `ui`, `thought`,
    `needs` (the moves it needs, by `seq`) and `wants`;
  - `rows`: the 70 score rows, each with `thought`, `family`, `deadline` and `makes` (the moves that make it).
  This is close to a dependency graph already.
- **`action-table-minimal.json`**: the 144 moves to 70 on Hard, batched before their deadlines (the latest paragraph
  each can be made). **`action-table.json`**: the careful reader's 396 moves, with per thought the scores and
  deadlines.
- **The engine:** `nextDeductionAt` and the gates (the story's waits on a deduction), `record()` (Holmes's deadlines),
  and `stepInferences`.
- **The statistics** (`stats.md`): the scenes, and the moves by kind and by scene.

## Questions the paper might settle (candidates; the discussion decides)

- **"Keeping up with Holmes":** what the minimum is. Options include:
  - what the story's own gates require (the deductions the story waits on, Hard's 'wait' pace);
  - every row by its deadline, rather than ahead of Holmes;
  - Holmes's stated steps only;
  - something else.
  Measure how many moves each needs.
- **"Maximum score":** the minimal playthrough (144 moves) or the careful reader's whole table. It could also be on a
  difficulty other than Hard.
- **The story's steps:** how the story is cut:
  - by paragraph;
  - by deadline (each of Holmes's deductions closes a stretch);
  - by scene;
  - by the batches the minimal table already makes.
  The cut decides how many story nodes there are and how coarse "the next set of cards" is.
- **Nodes:** what an action node is (one move, one thought, one score row), and whether cards are nodes of their own or
  only labels on a story node.
- **Edges:** whether a move depends on the story step that opened its cards, on the moves it `needs`, or on both. Does
  the next story step depend on every action of the previous step, or only on those whose deadline it is? Moves that can
  wait past the next step (made later but before their deadline) change this.
- **Labels and descriptions:** the graph is a full spoiler. Decide whether that is fine for this use, and how labels
  read (the thought's typed note, the card names, the move in words).
- **Where it lives:** a script here (`npm run depgraph` → `cases/silver-blaze/…json`), and whether a copy goes into
  Archipelago-CC's `data/` (Robert's call, in that repo).
- **Checks:**
  - a test that each export is a DAG and loads under DepGraph's own rules (perhaps by running its loader with Python);
  - a test that playing the nodes in any order the graph allows reaches the target (70, or kept up), replayed through
    the engine.

## Read first

1. `CLAUDE.md`, then `docs/minimal-playthrough.md` (how the minimal table and its batches are made) and
   `docs/hints.md` (what `hints.json` holds and why).
2. Archipelago-CC's `worlds/depgraph/docs/en_DepGraph.md`, `docs/setup_en.md`, `Rules.py`, and an example from `data/`.
3. `engine/minimalTable.js`, `engine/hints.js` (`makeHints`, the closure of `needs`), and `cases/silver-blaze/stats.md`.

## Discipline (Rounds 60–211)

- **Discuss before changing.** Lay out the alternatives, measure, and write a paper before any build. Show Robert
  sample output (a few nodes of each version) before he decides.
- Each step is one commit with a Round entry, gated on `npm test` in the same command (`run_in_background`, never a
  shell `&`), and checked before pushing. Never write in the tree while the gate runs.
- Headless Chrome runs on port 9333, one script at a time.
- If the work runs past one session, hand off with a kickoff in `docs/` as this one does.
