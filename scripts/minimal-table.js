// The minimal playthrough: from the action table, the fewest of its moves that still reach
// the Hard maximum, batched at as few paragraphs as the deadlines allow, written to cases/<case>/action-table-minimal.json
// (the autoplay's second script). npm run minimal-table [case dir]. The pruning replays the game once per move, in
// parallel worker threads (WORKERS, default the cores less one): about 20–30 minutes. Rerun when the action table changes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { loadCase } from '../engine/loadCase.js';
import { closureAndBatch, replayMoves, atMaximum, minimalTable } from '../engine/minimalTable.js';

const dir = isMainThread ? process.argv[2] ?? path.join(path.dirname(new URL(import.meta.url).pathname), '../cases/silver-blaze') : workerData.dir;
const model = await loadCase(dir);
const table = JSON.parse(fs.readFileSync(path.join(dir, 'action-table.json'), 'utf8'));
/** Does the game still reach the maximum, every move taking, without the move `seq`? */
const holdsWithout = (moves, seq) => { const r = replayMoves(model, moves.filter((m) => m.seq !== seq)); return r.fails.length === 0 && atMaximum(r.record, table); };

if (!isMainThread) {
    for (const seq of workerData.seqs) parentPort.postMessage({ seq, ok: holdsWithout(workerData.moves, seq) });
    process.exit(0);
}

const t0 = Date.now();
const say = (s) => console.log(`[${Math.round((Date.now() - t0) / 1000)} s] ${s}`);
const { moves: batched, stops, pageOnly } = closureAndBatch(model, table);
let moves = batched;
const first = replayMoves(model, moves);
say(`closure: ${moves.length} moves at ${stops.length} stops; ${first.record.ahead} ahead${first.fails.length ? `; failed: ${first.fails.join(' ')}` : ''}`);
if (!atMaximum(first.record, table) || first.fails.length) throw new Error('the closure does not reach the maximum: the closure misses a need (engine/minimalTable.js)');

const WORKERS = Number(process.env.WORKERS ?? Math.max(1, os.cpus().length - 1));
/** Each candidate removed alone, in parallel: those after which the game still reaches the maximum. */
async function singles(list) {
    const seqs = list.filter((m) => !pageOnly.has(m.seq)).map((m) => m.seq);
    const parts = Array.from({ length: WORKERS }, (_, k) => seqs.filter((_, i) => i % WORKERS === k)).filter((p) => p.length);
    const out = [];
    await Promise.all(parts.map((part) => new Promise((resolve, reject) => {
        const w = new Worker(new URL(import.meta.url), { workerData: { dir, moves: list, seqs: part } });
        w.on('message', (r) => { if (r.ok) out.push(r.seq); });
        w.on('error', reject);
        w.on('exit', resolve);
    })));
    return out.sort((a, b) => a - b);
}
for (let round = 1; ; round++) {
    const can = await singles(moves);
    say(`round ${round}: ${can.length} of ${moves.length - pageOnly.size} can go alone${can.length ? `: ${can.join(' ')}` : ''}`);
    // Removed one by one, each removal replayed: two moves can be alternatives to each other.
    let removed = 0;
    for (const seq of can) if (holdsWithout(moves, seq)) { moves = moves.filter((m) => m.seq !== seq); removed++; }
    say(`round ${round}: ${removed} removed, ${moves.length} left`);
    if (!removed || round === 3) break; // a removal can leave a move nothing else needs: try again
}

const out = minimalTable(model, table, moves);
if (!atMaximum({ families: out.families }, table)) throw new Error('the minimal table does not reach the maximum');
const { thoughts, ...head } = out;
const lines = thoughts.map((t) => `    ${JSON.stringify(t)}`);
fs.writeFileSync(path.join(dir, 'action-table-minimal.json'), `${JSON.stringify(head, null, 1).replace(/\n}$/, ',')}\n "thoughts": [\n${lines.join(',\n')}\n ]\n}\n`);
say(`wrote action-table-minimal.json: ${out.moves} moves at ${out.stops.length} paragraphs (${Object.entries(out.byKind).map(([k, n]) => `${k} ${n}`).join(', ')}); ahead of Holmes ${out.ahead}`);
