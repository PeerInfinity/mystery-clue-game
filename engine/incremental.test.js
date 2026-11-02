// Incremental mode's waits: incremental.json is what `npm run incremental` writes; a player who moves only when the
// story waits reaches the Hard maximum, and without the waits for moves that expire does not; the minimal playthrough
// is never held up; a reader who only reads stops at the first wait; the mode is Hard whatever is asked; and a notice
// or a sealed check says whether it lifted a wait.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadCase } from './loadCase.js';
import { Game, INCREMENTAL, PRESETS, optionsFrom } from './game.js';
import { incrementalWaits, incrementalJson, playLazy } from './incremental.js';
import { make, movesOf } from './minimalTable.js';

const dir = new URL('../cases/silver-blaze/', import.meta.url);
const model = await loadCase(dir.pathname);
const read = (f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8'));
const hints = read('hints.json');
const waits = read('incremental.json');
const scored = (g) => Object.values(g.record().families).reduce((a, f) => a + f.scored, 0);

test('incremental.json is up to date (npm run incremental)', () => {
    assert.equal(fs.readFileSync(new URL('incremental.json', dir), 'utf8'), incrementalJson(incrementalWaits(model, hints)));
});

test('a player who moves only when the story waits reaches the maximum', () => {
    const { game, stuck, fails } = playLazy(model, hints, waits, make);
    assert.equal(stuck, null);
    assert.deepEqual(fails, []);
    assert.ok(game.finished());
    assert.equal(scored(game), hints.rows.length);
});

test('without the waits for moves that expire, that player is stuck', () => {
    const { stuck } = playLazy(model, hints, { waits: waits.waits.filter((w) => w.row) }, make);
    assert.ok(stuck, 'every keep wait would be needless');
});

test('the minimal playthrough, each move at its own paragraph, is never held up', () => {
    const g = new Game(model, { pace: INCREMENTAL, waits: waits.waits });
    const byAt = new Map();
    for (const m of movesOf(read('action-table-minimal.json'))) (byAt.get(m.at) ?? byAt.set(m.at, []).get(m.at)).push(m);
    for (const m of byAt.get(0) ?? []) make(g, model, m);
    while (!g.finished()) {
        const res = g.advance();
        assert.ok(res.ok, `held up at ¶${g.read}: ${JSON.stringify(res.needs)}`);
        for (const m of byAt.get(g.read - 1) ?? []) make(g, model, m);
    }
    assert.equal(scored(g), hints.rows.length);
});

test('a reader who only reads stops at the first wait, which names what it waits for', () => {
    const g = new Game(model, { pace: INCREMENTAL, waits: waits.waits });
    const first = Math.min(...waits.waits.map((w) => w.para));
    const res = g.readTo(g.story.paragraphs.length);
    assert.equal(g.read, first);
    assert.deepEqual(res.stopped.needs, waits.waits.filter((w) => w.para === first));
});

test('incremental mode is Hard, whatever difficulty or options are asked for', () => {
    const g = new Game(model, { pace: INCREMENTAL, difficulty: 'easy', options: { answers: 'listed', reader: '1892' }, waits: waits.waits });
    assert.deepEqual({ ...g.opts, reader: undefined }, { ...PRESETS.hard, reader: undefined });
    assert.equal(g.opts.reader, optionsFrom('hard', { reader: '1892' }).reader);
});

test('a notice or a sealed check says how many waits it lifted; a wrong one lifts none', () => {
    const noticed = new Set(model.data.thoughts.flatMap((t) => t.notices ?? []));
    const tried = { notice: 0, seal: 0 };
    const check = (g, model, m) => {
        if (m.op === 'notice') {
            const wrong = [...g.unlocked.keys()].find((c) => !noticed.has(c) && model.cards.get(c)?.section === 'entities');
            assert.equal(g.notice(wrong).lifts, 0);
            g.unnotice(wrong);
            const res = g.notice(m.card, m.because);
            assert.ok(res.lifts >= 1, `notice ${m.card} at ¶${g.read}`);
            tried.notice++;
            return true;
        }
        if (m.op === 'seal') {
            const res = g.seal(m.verb, m.fields, { expect: m.expect, answer: m.answer });
            // A seal lifts a wait unless an earlier seal made its row already (one check can serve two rows).
            assert.ok(res.ok && res.lifts >= 0, `seal at ¶${g.read}`);
            tried.seal += res.lifts;
            return true;
        }
        return make(g, model, m);
    };
    const { stuck } = playLazy(model, hints, waits, check);
    assert.equal(stuck, null);
    assert.equal(tried.notice, hints.moves.filter((m) => m.op === 'notice').length);
    assert.ok(tried.seal >= 1);
});

test('incremental mode answers for part of an absence, a sealed check or a drop, only over what is in hand', () => {
    // At each wait the lazy player meets, before it moves: a part of the row's own move is onto something once its
    // cards are held, and nothing is outside incremental mode or for a card not held.
    const free = new Game(model, { difficulty: 'hard' });
    free.readTo(60);
    assert.equal(free.sealOnto('look', {}), false);
    assert.equal(free.absenceOnto({}), false);
    const seen = { file: 0, seal: 0, drop: 0 };
    const check = (g, model, m) => {
        if (m.op === 'file' && !g.knows(m.absence)) {
            assert.ok(g.absenceOnto({ expectation: m.expectation }) && g.absenceOnto({ witness: m.witness }) && g.absenceOnto({ time: m.time }), `absence parts at ¶${g.read}`);
            assert.ok(g.absenceOnto({ expectation: m.expectation, witness: m.witness, time: m.time }));
            const other = [...g.unlocked.keys()].find((c) => model.cards.get(c)?.section === 'claims' && !g.absenceOnto({ witness: c }));
            assert.ok(other, 'some statement is no witness of an absence');
            seen.file++;
        }
        if (m.op === 'seal') {
            const [f1, f2] = Object.keys(m.fields);
            if (g.sealOnto(m.verb, m.fields)) {
                assert.ok(g.sealOnto(m.verb, {}) && g.sealOnto(m.verb, { [f1]: m.fields[f1] }) && g.sealOnto(m.verb, { [f2]: m.fields[f2] }));
                seen.seal++;
            }
        }
        if (m.op === 'drop') {
            assert.ok(g.dropOnto(m.target), `drop target at ¶${g.read}`);
            const wrong = g.visibleSlots().flatMap((s) => s.domain.filter((v) => g.offered(s.id, v)).map((v) => ({ slot: s.id, value: v }))).find((t) => !g.dropOnto(t));
            assert.ok(wrong, 'some answer is no wrong turn');
            seen.drop++;
        }
        return make(g, model, m);
    };
    const { stuck } = playLazy(model, hints, waits, check);
    assert.equal(stuck, null);
    assert.ok(seen.file >= 1 && seen.seal >= 5 && seen.drop >= 3, JSON.stringify(seen));
    // A card not held answers nothing.
    const g = new Game(model, { pace: INCREMENTAL, waits: waits.waits });
    g.readTo(30);
    assert.equal(g.sealOnto('look', { thing: 'silver_blaze', place: 'mapleton' }), false);
});
