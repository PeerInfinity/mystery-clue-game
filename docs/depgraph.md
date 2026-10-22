# The player's actions as an Archipelago-CC DepGraph

Status: **DRAFT, partly decided** (Robert, 2026-10-22, Round 213: three choices below, by question). Written Round
213, the work of `docs/kickoff-depgraph.md` (Robert's ask, Round 212). Nothing is built until he agrees the rest.

## What is asked

"Export a dependency graph of the player's actions in the format of the Archipelago-CC DepGraph … two versions, one for
reaching maximum score, and one for just keeping up with Holmes … completing the necessary actions with the currently
available cards [is] a dependency for continuing the story, and continuing the story [is] a dependency for getting the
next set of cards."

The shape: a chain **story → cards → actions → story → …**, a DAG that DepGraph turns into items, locations and access
rules.

## Decided (Robert, Round 213)

1. **"Keeping up with Holmes": both readings, as two graphs**, if both make sense (they do: measured below, they are
   different sets), so **three exports**: the maximum score; the story's own waits; every deduction by its deadline.
2. **The cards are the collect moves:** each word-click on Hard is its own node, opened by the story stretch that holds
   its words. (Not chosen: a "Cards from ¶a–¶b" node per stretch; the cards coming with the story as on Easy.)
3. **Labels in plain words; spoilers are fine** (the graph is a map of the solution, used outside the game): "Build: If
   the opium went in at the stable window…", "Collect “The girl” (¶29)"; the thought and the paragraph in the
   description. (Not chosen: spoiler-light labels.)

## The target format (Archipelago-CC `worlds/depgraph`, read 2026-10-22)

- JSON `{title, nodes: {id: {label, description, depends_on: [id]}}}`; the loader (`Rules.py`, `parse_json_graph`)
  reads only those three fields, checks every dependency names a node, and sorts the nodes by Kahn's algorithm (ties
  by id), refusing a cycle ("Graph contains cycles: sorted n of m nodes").
- Each node becomes an item, a location and a region; a node's entrance needs its dependencies' items and completion
  events (`entrance_rule_mode`: `strict` all of both; `relaxed_items`, the default, all events and the source's item;
  `relaxed_events`; `fully_relaxed`, any one branch).
- **The goal is the node last in that order** (`__init__.py`, `completion_condition`: "Completed Node {num_nodes}").
  So each export has **one sink, "The end"**, which everything leads to; a move that nothing else waits on is made a
  dependency of the end.
- The bundled graphs run to 356 nodes (`swfrecomp_vibe_coding.json`), at most 9 dependencies on a node.

## What exists, measured (2026-10-22)

Scratch scripts replaying moves through the engine on Hard (about 40 seconds a replay of the minimal playthrough, 2½
minutes of the reader's table), not in the repository.

### The story's waits on Hard

At the 'wait' pace (`Game.advance`: the next paragraph is refused while a step gating it is not made) there are **26
paragraphs where the story waits, on 35 of Holmes's 47 steps with a paragraph to beat** (42 waits counting repeats:
`t81.5` waits at ¶102, ¶170 and ¶221). A game that only reads stops at ¶57 (`t31.3`). The waits are not the record's
deadlines: four steps are waited on earlier than they score (`t81.5` ¶102 against ¶221, `t84.6` ¶161 against ¶225,
`t34.7` ¶182 against ¶219, and `t141.1` waits at ¶148 and again at ¶202). One waited step can never score
(`t127.4`, ¶147: its inference comes by itself once its premises are held).

### The three versions

| | Maximum score | The story's waits | Every deduction by its deadline |
|---|---|---|---|
| Target | 70 ahead of Holmes, every family | read to the end at the 'wait' pace | the 45 deduction rows before Holmes |
| Moves (from) | **144** (the minimal playthrough, pruned) | **106**, not yet pruned (the reader's table: the minimal playthrough cannot do it) | **110**, not yet pruned (within the minimal playthrough) |
| · collect / ask / build / other | 73 / 10 / 37 / 24 | 62 / 11 / 32 / 1 | 62 / 10 / 37 / 1 |
| Story cut at | 31 deadlines + 3 more paragraphs where a move is lost → 35 stretches | the 26 waits (+ where a move is lost) | 21 deadlines (+ where a move is lost) |
| Checked | prototype: loads in DepGraph; 70 in three orders (below) | closure replayed at the reader's paragraphs: reads to the end (39 ahead, incidentally) | measured only |

**Why the story's waits need the reader's table:** the minimal playthrough never builds
`k.first_up_and_no_subordinate`; it lets the story state it at ¶146, and at the 'wait' pace the story stops just
before ¶146. A graph for the waits must build what the free reading lets the story say.

### The prototype (the maximum version)

`depgraph-max.json`: **180 nodes** (35 story stretches, 144 moves, the end), **448 edges**, at most 15 dependencies on
one node (the stretch from ¶102: 14 moves, 11 of them lost there). It loads under DepGraph's own `parse_json_graph` (run
read-only from Archipelago-CC's venv, no bytecode written), and its goal falls on `end`.

```json
"story.01": {"label": "Read ¶1–¶35", "description": "The story from the start.", "depends_on": []},
"move.86":  {"label": "Collect “The girl” (¶29)", "description": "collect, thought t29.2, from ¶29", "depends_on": ["story.01"]},
"move.88":  {"label": "Build: If the opium went in at the stable window, it was while the stranger stood…",
             "description": "build, thought t29.3, from ¶29", "depends_on": ["story.01", "move.78", "move.86"]},
"story.02": {"label": "Read ¶36–¶56", "description": "Holmes's paragraph ¶36: 1 row due (t29.3 deduction)",
             "depends_on": ["story.01", "move.88"]},
"end":      {"label": "The end: 70 ahead of Holmes", "description": "Hard, every row the game can score.", "depends_on": ["story.35"]}
```

**It took three tries, and each failure is a rule the export must keep:**

1. **A row's `makes` (in `hints.json`) are alternatives,** any one of which makes the row; `depends_on` means all. Taken
   as dependencies they gave a cycle (`t117.2`: moves at ¶124 that serve a later row, its own deadline ¶124), and
   DepGraph refused it. **Rule:** the stretch at a row's deadline depends on the move after which the replay *first
   makes* the row (`madeBy`, as `engine/hintData.js` finds it); the rest follows through the moves' needs.
2. **A move can be lost as the story goes on:** a build once the story states its inference (37 of the 144, `lost` in
   `hints.json`), a proposal once its question is settled (the page offers no answer box). DepGraph has no "before"
   except a story stretch depending on the move. Without these edges, every move as late as the graph allowed reached
   only 59. **Rule:** the story is also cut where a move is lost, and that stretch depends on it.
3. **Implicit inferences** (they come by themselves once their premises are held) need the moves that gave their
   premises, not a build (`t81.5`'s `k.wife_stayed_home`, `k.found_before_seven`). **Rule:** as `hintData` does.

With those rules, the graph's three orders replayed through the engine all reach **70**: every move as early as its
stretch allows (17 stops), every move as late as allowed (30 stops), and a random order between (64 stops). One loose
end: as late as allowed, the proposal "opium in the packet" (move 204) is refused (the engine still scores the drop
without it; the page would not). Its loss paragraph (its question settled) is the reader's game's, and the latest
order settles it sooner: a check through the page (`scripts/ui-run.mjs`) would find it, as it did in Round 200.

## Questions, alternatives, recommendations

### D1. How the story is cut

- **(a) At every paragraph where something falls due or is lost (recommended):** each stretch ends just before a
  deadline (or a wait), or before a move is lost. The fewest stretches that let every move sit in its own window.
- (b) By scene (10): a move due mid-scene would have to be made before the scene starts, before its material is read
  (empty windows); not possible.
- (c) By paragraph (231 story nodes): faithful but long; every move's window is exact. No gain over (a) for the access
  rules, and 200 more nodes.
- (d) By the minimal table's stops (13): the stops are one playthrough's choice, not the story's constraint.

### D2. What a node is

- **One per move (recommended, and decided for the collects):** the move as the tables give it; its id `move.<seq>`.
- (b) One per thought (the annotation's 107 thoughts with moves): fewer nodes, but a thought's moves fall in
  different stretches.
- (c) One per score row (70): the closure under each row in one node; loses what is shared between rows.

### D3. The edges

As the prototype: a move depends on **the stretch that holds its material** (the latest paragraph among its words, the
cards it needs, a background fact recalled, a question shown) and on **the moves that first gave the cards it needs**
(`needs`); a stretch depends on **the previous stretch**, **the move that first makes each row due at its first
paragraph** (maximum; deductions only for the third version) or **that passes each wait** (the story's waits), and
**every move lost there**; the end depends on the last stretch and on any move nothing waits on. **Recommended.**

*Alternative:* each stretch depends on every move made in the previous one (the batched playthrough's own order):
simpler, but it removes the freedom DepGraph is for (a move may wait until its deadline).

### D4. The two "keeping up" graphs, pruned

The closures above are not minimal. **Recommended:** prune each as the minimal table was (each move removed in turn and
the rest replayed; `engine/minimalTable.js`'s method, parallel), the target being the version's own (reads to the end
at 'wait'; the 45 deductions). Expect tens of minutes each; run when the action tables change, like `npm run
minimal-table`. *Alternative:* the unpruned closure (faster, but not "just keeping up").

### D5. Where it lives

- **Recommended:** `engine/depgraph.js` and `npm run depgraph` → `cases/silver-blaze/depgraph-max.json`,
  `depgraph-waits.json`, `depgraph-deductions.json` (pretty-printed JSON, like the bundled graphs; the pruned move
  lists cached so a rerun is quick unless the tables change). A test checks they are up to date.
- **A copy in Archipelago-CC's `data/`** (and an entry in `Rules.py`'s bundled list and `Options.py`) is a change in that
  repo: **Robert's call, there**; until then a YAML can name the file by path (`graph_file: /path/to/depgraph-max.json`).

### D6. The checks

- **(a) Loads in DepGraph (recommended):** a test runs Archipelago-CC's `parse_json_graph` on each export through its
  venv, read-only (`PYTHONDONTWRITEBYTECODE=1`), and checks one sink, the goal last. Skipped (with a message) when the
  Archipelago-CC tree is not there, so `npm test` still runs alone; and a JS check of the same rules (a DAG, every
  dependency a node, one sink) always.
- **(b) The graph's orders reach the target (recommended):** replayed through the engine, every move as early as allowed,
  as late as allowed, and one seeded random order: 70 for the maximum; the end read at 'wait' for the waits; 45
  deductions for the third. About two minutes per version: in `npm test` for the maximum, the others with the script.
- **(c) Through the page:** the latest order of the maximum played by `scripts/ui-run.mjs` (it would have caught move
  204). Recommended once, when built; not in `npm test`.

### D7. The difficulty, and the mode

- **Hard only (recommended):** the collects are the cards (choice 2) only on Hard; the minimal playthrough and the record
  are Hard's.
- The graphs have convergence nodes of up to 15 dependencies; DepGraph's default `relaxed_items` suits them (its docs:
  `strict` may fail in a multiworld with large convergence gates). A note in the description, no change.

## Order of work (if agreed)

1. **The maximum graph:** `engine/depgraph.js` (the stretches, the edges of D3, the labels), `npm run depgraph` →
   `depgraph-max.json`, its tests (D6 a, b); the loose end of move 204 settled (D6 c).
2. **The story's waits:** its closure over the reader's table, pruned (D4), `depgraph-waits.json`, its checks.
3. **Every deduction by its deadline:** the same, `depgraph-deductions.json`.
4. `CLAUDE.md`'s commands; the copy into Archipelago-CC only if Robert asks there.
