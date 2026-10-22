// The DepGraph export (docs/depgraph.md): depgraph-max.json is what `npm run depgraph` writes; it keeps DepGraph's rules
// (every dependency a node, no cycle, one sink, the goal last in its order) and loads under Archipelago-CC's own parser
// when that tree is there; and the orders it allows (every move as early as allowed, as late, a seeded draw between)
// all reach the Hard maximum through the engine, every move taking.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadCase } from './loadCase.js';
import { MAX, maxData, depgraph, depgraphJson, checkGraph, placeMoves } from './depgraph.js';
import { replayMoves, atMaximum } from './minimalTable.js';

const dir = new URL('../cases/silver-blaze/', import.meta.url);
const model = await loadCase(dir.pathname);
const read = (f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8'));
const table = read('action-table.json');
const data = maxData(model, table, read('action-table-minimal.json'), read('hints.json'));
const graph = depgraph(model, data, MAX);
const file = new URL('depgraph-max.json', dir).pathname;

test('depgraph-max.json is up to date (npm run depgraph)', () => {
    assert.equal(fs.readFileSync(file, 'utf8'), depgraphJson(graph));
});

test("the graph keeps DepGraph's rules: a DAG, one sink, the goal last", () => {
    const { order, sinks } = checkGraph(graph);
    assert.deepEqual(sinks, ['end']);
    assert.equal(order.at(-1), 'end');
    assert.equal(Object.keys(graph.nodes).filter((k) => k.startsWith('move.')).length, data.moves.length);
});

// Archipelago-CC beside this tree (or ARCHIPELAGO_CC), its venv's Python: its loader, read-only (no bytecode written).
const ap = process.env.ARCHIPELAGO_CC ?? new URL('../../Archipelago-CC/', import.meta.url).pathname;
const py = `${ap}/.venv/bin/python`;
test('it loads under DepGraph\'s own parser', { skip: !fs.existsSync(py) && `no Archipelago-CC venv at ${ap}` }, () => {
    const out = execFileSync(py, ['-c', `import sys; sys.path.insert(0, '.')
from worlds.depgraph.Rules import parse_json_graph
s = parse_json_graph(sys.argv[1])
print(len(s.nodes), s.nodes[len(s.nodes)].node_id)`, file], { cwd: ap, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }, encoding: 'utf8' });
    assert.equal(out.trim(), `${Object.keys(graph.nodes).length} end`);
});

for (const mode of ['early', 'late', 'random']) test(`every move ${mode === 'random' ? 'at a seeded draw' : `as ${mode} as the graph allows`}: the maximum`, () => {
    const { record, fails } = replayMoves(model, placeMoves(graph, data.moves, mode));
    assert.deepEqual(fails, []);
    assert.ok(atMaximum(record, table), `${record.ahead} ahead`);
});
