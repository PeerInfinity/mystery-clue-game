// The hints: hints.json is what `npm run hints` writes; a player who only reads and takes every hint to
// its fourth rung reaches the Hard maximum; at every paragraph, of that game and of one that only reads, every rung of
// every open row names only held cards, read paragraphs and the words of read paragraphs; the log is saved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadCase } from './loadCase.js';
import { Game } from './game.js';
import { Hints, hintTiers } from './hints.js';
import { hintData, hintJson } from './hintData.js';
import { make } from './minimalTable.js';
import { playHints } from './hintPlayer.js';

const dir = new URL('../cases/silver-blaze/', import.meta.url);
const model = await loadCase(dir.pathname);
const read = (f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8'));
const data = read('hints.json');
const table = read('action-table.json');

test('hints.json is up to date (npm run hints)', () => {
    const want = hintJson(hintData(model, table, read('action-table-minimal.json')));
    assert.equal(fs.readFileSync(new URL('hints.json', dir), 'utf8'), want);
});

/** Every rung of every open row, checked against what the player holds and has read. */
function checkRungs(g, h) {
    for (const r of h.open()) {
        const p = h.parts(r, 4);
        const at = `¶${g.read - 1} ${r.key}`;
        for (const x of p.where) assert.ok(x < g.read, `${at}: where ¶${x} not read`);
        for (const c of p.which.cards) {
            assert.ok(!c.missing, `${at}: a card with no way to it`);
            if (c.card) assert.ok(g.knows(c.card), `${at}: names ${c.card}, not held`);
            if (c.ask) assert.ok(g.knows(c.ask), `${at}: asks about ${c.ask}, not held`);
            if (c.words !== undefined) {
                assert.ok(c.para < g.read, `${at}: words of ¶${c.para}, not read`);
                assert.ok(g.story.segments(c.para).some((s) => s.text === c.words), `${at}: "${c.words}" not in ¶${c.para}`);
            }
        }
        const named = JSON.stringify(p.which.move).match(/"[^"]+"/g)?.map((x) => x.slice(1, -1)).filter((x) => model.cards.has(x)) ?? [];
        for (const x of named) assert.ok(g.knows(x), `${at}: the step names ${x}, not held`);
        for (const m of p.moves) assert.ok(m.at < g.read, `${at}: a move of ¶${m.at}`);
    }
}

test('a player who only reads finds the rungs within what is read', () => {
    const g = new Game(model, { difficulty: 'hard' });
    const h = new Hints(g, data);
    let open = 0;
    while (!g.finished()) { g.advance(); checkRungs(g, h); open = Math.max(open, h.open().length); }
    assert.ok(open > 0);
});

test('a player who only reads and takes every hint to the fourth rung reaches the Hard maximum', () => {
    const { game: g, targets, fails } = playHints(model, data, { onRead: checkRungs });
    assert.deepEqual(fails, []);
    const rec = g.record();
    for (const [f, a] of Object.entries(table.families)) assert.equal(rec.families[f].scored, a.scored, f);
    assert.equal(rec.ahead, table.ahead);
    // The rows by the rung of hint taken on each: all 70, most by Do it (four), some made by another's moves (none).
    const tiers = hintTiers(g);
    assert.equal(tiers.reduce((a, b) => a + b, 0), rec.ahead);
    assert.ok(tiers[4] > 0 && tiers[1] === 0 && tiers[2] === 0 && tiers[3] === 0, `${tiers}`);
    // Each hint logged, rung by rung; the log comes back with the save.
    assert.equal(g.hintLog.length, targets.length * 4);
    const g2 = new Game(model, { difficulty: 'hard' });
    g2.load(JSON.parse(JSON.stringify(g.save())));
    assert.deepEqual(g2.hintLog, g.hintLog);
});

test('a hint climbs one target, a rung a press, and starts at the first on the next', () => {
    const g = new Game(model, { difficulty: 'hard' });
    const h = new Hints(g, data);
    while (g.read <= 40) g.advance();
    const first = h.take({ at: 1 });
    assert.equal(first.rung, 1);
    assert.ok(first.fresh);
    assert.ok(!first.kind && !first.which && !first.moves);
    const second = h.take();
    assert.equal(second.thought, first.thought);
    assert.equal(second.rung, 2);
    assert.ok(second.kind && !second.which);
    h.take();
    const fourth = h.take();
    assert.equal(fourth.rung, 4);
    assert.ok(fourth.moves.length);
    assert.equal(h.take().rung, 4); // the fourth stays until the move is made
    for (const m of fourth.moves) make(g, model, m);
    const next = h.next();
    assert.ok(!next || (next.rung === 1 && next.row.key !== `${first.thought}|${first.family}`));
    assert.deepEqual(g.hintLog[0], { para: g.read - 1, thought: first.thought, family: first.family, rung: 1, at: 1 });
});

test('no hints where the game works the case out (Trivial)', () => {
    const g = new Game(model, { difficulty: 'trivial' });
    while (g.read <= 60) g.advance();
    assert.equal(new Hints(g, data).next(), null);
});

test('the catch-up note of every row comes from before its deadline, from cards of the case', () => {
    const h = new Hints(new Game(model, { difficulty: 'hard' }), data);
    for (const r of data.rows) {
        const c = h.catchUp(r.thought, r.family);
        assert.ok(c.para <= r.deadline, `${r.thought} ${r.family}: ¶${c.para} after ¶${r.deadline}`);
        assert.ok(c.cards.every((x) => model.cards.has(x)), `${r.thought} ${r.family}`);
    }
    assert.equal(h.catchUp('t0', 'deduction'), null);
});
