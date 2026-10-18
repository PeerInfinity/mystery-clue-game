// The reader layer (docs/reader-layer.md, workstream 8): disclosure, readers, hints from the story, set aside.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, EASY } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);
const readTo = (game, p) => { while (game.read <= p && !game.finished()) game.advance(); return game; };

test('disclosure: a rule offered before the story states it, a fact told late, a check never told', () => {
    const g = new Game(model, { difficulty: EASY });
    assert.deepEqual(g.disclosure('r.opium_taste'), { at: 37, told: 218, supplied: true });
    assert.deepEqual(g.disclosure('r.dog_barks_at_strangers'), { at: 29, told: 219, supplied: true });
    assert.equal(g.disclosure('r.hoof_strikes_as_horse_kicks').told, null, 'common sense the story never states');
    assert.equal(g.disclosure('r.hoof_strikes_as_horse_kicks').supplied, false);
    assert.deepEqual(g.disclosure('c.square_toes'), { at: 146, late: 119, policy: 'withhold' });
    assert.deepEqual(g.disclosure('ck.boots'), { at: 107, result: { never: true } });
    assert.deepEqual(g.disclosure('silver_blaze'), { at: model.story.firstAt.get('silver_blaze') });
});

test('what the story held back names no paragraph the player has not read, and the never-told only at the end', () => {
    const g = readTo(new Game(model, { difficulty: EASY }), 100);
    const now = g.heldBack();
    assert.ok(now.length > 0);
    for (const x of now) {
        assert.notEqual(x.kind, 'never', x.id);
        for (const p of [x.at, x.told, x.due]) if (p !== undefined) assert.ok(p < g.read, `${x.id} names ¶${p} at ¶${g.read - 1}`);
    }
    assert.ok(now.some((x) => x.id === 'r.wind_and_coats' && x.kind === 'supplied' && x.told === 96));
    assert.ok(!now.some((x) => x.id === 'r.opium_taste'), 'stated only at ¶218');
    readTo(g, 231);
    const end = g.heldBack();
    for (const id of ['k.dove_silk_on_the_bill', 'ck.boots', 'ck.maid']) assert.ok(end.some((x) => x.id === id && x.kind === 'never'), id);
    assert.ok(end.some((x) => x.id === 'c.square_toes' && x.kind === 'late' && x.due === 119 && x.told === 146));
    assert.ok(end.some((x) => x.id === 'ck.photograph' && x.kind === 'late' && x.told === 229));
    assert.ok(end.some((x) => x.id === 'r.opium_taste' && x.kind === 'supplied'));
});
