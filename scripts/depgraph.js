// The player's actions as Archipelago-CC DepGraphs (engine/depgraph.js), in cases/<case>/:
//   depgraph-max.json         the maximum score: the minimal playthrough's moves;
//   depgraph-waits.json       keeping up with the story: the fewest of the reader's moves that read to the end at the
//                             pace that waits for Holmes's steps;
//   depgraph-deductions.json  every deduction before Holmes: the fewest of the minimal playthrough's moves for the 45.
// npm run depgraph [case dir] (about 3 minutes) redraws the three from the moves each graph holds; with --prune (about
// 20–40 minutes, parallel worker threads, WORKERS) the two "keeping up" move sets are found again: the closure of the
// moves under their rows, then each move removed in turn and the rest replayed. Each graph written is checked: DepGraph's
// rules, and three orders it allows replayed to its target. Rerun when the case, a table or hints.json changes (a test
// checks it); --prune when the tables change.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { loadCase } from '../engine/loadCase.js';
import { MAX, WAITS, DEDUCTIONS, maxData, waitsData, deductionsData, closure, restrict, depgraph, depgraphJson, checkGraph, placeMoves, replayWait } from '../engine/depgraph.js';
import { movesOf, replayMoves, atMaximum } from '../engine/minimalTable.js';

const args = isMainThread ? process.argv.slice(2) : [];
const dir = isMainThread ? args.find((a) => !a.startsWith('--')) ?? path.join(path.dirname(new URL(import.meta.url).pathname), '../cases/silver-blaze') : workerData.dir;
const model = await loadCase(dir);
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const table = read('action-table.json');
const minimal = read('action-table-minimal.json');
const hints = read('hints.json');
const DEDUCED = table.families.deduction.scored;

/** Does a playthrough reach the version's target, every move taking? */
const reaches = {
    waits: (moves) => { const r = replayWait(model, moves); return r.finished && !r.fails.length; },
    deductions: (moves) => { const r = replayMoves(model, moves); return !r.fails.length && r.record.families.deduction.scored === DEDUCED; },
    max: (moves) => { const r = replayMoves(model, moves); return !r.fails.length && atMaximum(r.record, table); },
};

if (!isMainThread) {
    for (const seq of workerData.seqs) parentPort.postMessage({ seq, ok: reaches[workerData.kind](workerData.moves.filter((m) => m.seq !== seq)) });
    process.exit(0);
}

const t0 = Date.now();
const say = (s) => console.log(`[${Math.round((Date.now() - t0) / 1000)} s] ${s}`);
const WORKERS = Number(process.env.WORKERS ?? Math.max(1, os.cpus().length - 1));
/** Each move removed alone, in parallel: those after which the playthrough still reaches the target. */
async function singles(kind, moves) {
    const seqs = moves.map((m) => m.seq);
    const parts = Array.from({ length: WORKERS }, (_, k) => seqs.filter((_, i) => i % WORKERS === k)).filter((p) => p.length);
    const out = [];
    await Promise.all(parts.map((seqs) => new Promise((resolve, reject) => {
        const w = new Worker(new URL(import.meta.url), { workerData: { dir, kind, moves, seqs } });
        w.on('message', (r) => { if (r.ok) out.push(r.seq); });
        w.on('error', reject);
        w.on('exit', resolve);
    })));
    return out.sort((a, b) => a - b);
}
/** The fewest of the closure's moves that still reach the target (the minimal table's method). */
async function prune(kind, moves) {
    if (!reaches[kind](moves)) throw new Error(`${kind}: the closure does not reach its target`);
    for (let round = 1; ; round++) {
        const can = await singles(kind, moves);
        let removed = 0;
        for (const seq of can) { const rest = moves.filter((m) => m.seq !== seq); if (reaches[kind](rest)) { moves = rest; removed++; } }
        say(`${kind}, round ${round}: ${can.length} could go alone, ${removed} removed, ${moves.length} left`);
        if (!removed || round === 3) return new Set(moves.map((m) => m.seq));
    }
}
/** The moves a graph already written holds. */
const held = (f) => new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).nodes).filter((k) => k.startsWith('move.')).map((k) => +k.slice(5)));

/** Write a graph and check it: DepGraph's rules, and three orders it allows reaching the target. */
function write(file, kind, data, opts) {
    const g = depgraph(model, data, opts);
    const { sinks } = checkGraph(g);
    if (sinks.length !== 1 || sinks[0] !== 'end') throw new Error(`${file}: sinks ${sinks.join(' ')}`);
    for (const mode of ['early', 'late', 'random']) if (!reaches[kind](placeMoves(g, data.moves, mode))) throw new Error(`${file}: the ${mode} order does not reach its target`);
    fs.writeFileSync(path.join(dir, file), depgraphJson(g));
    say(`wrote ${file}: ${Object.keys(g.nodes).length} nodes (${Object.keys(g.nodes).filter((k) => k.startsWith('story.')).length} stretches, ${data.moves.length} moves), ${Object.values(g.nodes).reduce((k, x) => k + x.depends_on.length, 0)} edges; three orders reach the target`);
}

write('depgraph-max.json', 'max', maxData(model, table, minimal, hints), MAX);

const PRUNE = args.includes('--prune') || !fs.existsSync(path.join(dir, 'depgraph-waits.json'));
let waits = PRUNE ? null : held('depgraph-waits.json');
if (!waits) {
    const all = waitsData(model, table);
    const keep = closure(all);
    say(`waits: the closure ${keep.size} of ${all.moves.length} moves`);
    waits = await prune('waits', movesOf(restrict(table, keep)));
}
write('depgraph-waits.json', 'waits', waitsData(model, restrict(table, waits)), WAITS);

let deductions = PRUNE ? null : held('depgraph-deductions.json');
if (!deductions) {
    const all = deductionsData(model, table, minimal, hints);
    const keep = closure(all);
    say(`deductions: the closure ${keep.size} of ${all.moves.length} moves`);
    deductions = await prune('deductions', movesOf(restrict(minimal, keep)));
}
write('depgraph-deductions.json', 'deductions', deductionsData(model, table, restrict(minimal, deductions), hints), DEDUCTIONS);
