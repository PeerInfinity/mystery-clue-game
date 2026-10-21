// The minimal playthrough (docs/minimal-playthrough.md, Round 200): cases/silver-blaze/action-table-minimal.json, written
// by `npm run minimal-table`, is made of the action table's own moves, each made no earlier than the reader made it,
// and replayed it reaches the Hard maximum with every move taking. (The pruning is the script's: too slow for a test.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadCase } from './loadCase.js';
import { movesOf, replayMoves, atMaximum } from './minimalTable.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);
const read = (f) => JSON.parse(fs.readFileSync(new URL(`../cases/silver-blaze/${f}`, import.meta.url), 'utf8'));
const table = read('action-table.json');
const minimal = read('action-table-minimal.json');
const moves = movesOf(minimal);

test('the minimal table is made of the action table\'s moves, none earlier than the reader made it (npm run minimal-table)', () => {
    const reader = new Map(movesOf(table).map((m) => [m.seq, m]));
    for (const m of moves) {
        const { at, was, ...rest } = m;
        const r = reader.get(m.seq);
        assert.ok(r, `move ${m.seq} is not in the action table: rerun npm run minimal-table`);
        const { at: rat, ...rrest } = r;
        assert.deepEqual(rest, rrest, `move ${m.seq}`);
        assert.equal(was, rat, `move ${m.seq}: the reader's paragraph`);
        assert.ok(at >= was, `move ${m.seq} is made before the reader could`);
    }
    assert.equal(minimal.moves, moves.length);
    assert.deepEqual(minimal.stops, [...new Set(moves.map((m) => m.at))].sort((a, b) => a - b));
    // No notes, and none of the moves that never score nor feed a score on Hard.
    for (const op of ['pose', 'setAside', 'split', 'doubt', 'weigh']) assert.ok(!moves.some((m) => m.op === op), op);
    // A candidate the page drops from its chip is proposed first.
    for (const d of moves.filter((m) => m.op === 'drop' && m.target.slot)) assert.ok(moves.some((m) => m.op === 'candidate' && m.slot === d.target.slot && m.value === d.target.value && m.seq < d.seq), JSON.stringify(d.target));
});

test('replayed, the minimal playthrough reaches the Hard maximum, every move taking', () => {
    const { record, fails } = replayMoves(model, moves);
    assert.deepEqual(fails, []);
    assert.ok(atMaximum(record, table), JSON.stringify(record.families));
    assert.equal(record.ahead, table.ahead);
    assert.deepEqual(minimal.families, JSON.parse(JSON.stringify(record.families)));
});
