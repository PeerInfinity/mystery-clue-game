// The reader layer (docs/reader-layer.md, workstream 8): disclosure, readers, hints from the story, set aside.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, EASY } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);
const readTo = (game, p) => { while (game.read <= p && !game.finished()) game.advance(); return game; };

test('disclosure: a rule offered before the story states it, a fact told late, a check never told', () => {
    const g = new Game(model, { difficulty: EASY });
    assert.deepEqual(g.disclosure('r.opium_taste'), { at: 37, told: 218, early: true, supplied: true, lacks: 'bk.opium_taste' });
    assert.deepEqual(g.disclosure('r.dog_barks_at_strangers'), { at: 29, told: 219, early: true, supplied: false });
    assert.deepEqual(g.disclosure('r.set_aside_at_the_meal'), { at: g.ruleAt.get('r.set_aside_at_the_meal'), told: null, early: false, supplied: false }, 'common sense the story never states');
    assert.deepEqual(g.disclosure('c.square_toes'), { at: 146, late: 119, policy: 'withhold' });
    assert.deepEqual(g.disclosure('ck.boots'), { at: 107, result: { never: true } });
    assert.deepEqual(g.disclosure('silver_blaze'), { at: model.story.firstAt.get('silver_blaze') });
});

test('what the story held back names no paragraph the player has not read, and the never-told only at the end', () => {
    const g = readTo(new Game(model, { difficulty: EASY }), 150);
    const now = g.heldBack();
    assert.ok(now.length > 0);
    for (const x of now) {
        assert.notEqual(x.kind, 'never', x.id);
        for (const p of [x.at, x.told, x.due]) if (p !== undefined) assert.ok(p < g.read, `${x.id} names ¶${p} at ¶${g.read - 1}`);
    }
    assert.ok(now.some((x) => x.id === 'r.horse_gregarious' && x.kind === 'supplied' && x.told === 114 && x.lacks === 'bk.horse_gregarious'));
    assert.ok(now.some((x) => x.id === 'c.square_toes' && x.kind === 'late'));
    assert.ok(!now.some((x) => x.id === 'r.opium_taste'), 'stated only at ¶218');
    assert.ok(!now.some((x) => x.id === 'r.dog_barks_at_strangers'), 'a reader of today knows it: not supplied');
    readTo(g, 231);
    const end = g.heldBack();
    for (const id of ['k.dove_silk_on_the_bill', 'ck.boots', 'ck.maid']) assert.ok(end.some((x) => x.id === id && x.kind === 'never'), id);
    assert.ok(end.some((x) => x.id === 'c.square_toes' && x.kind === 'late' && x.due === 119 && x.told === 146));
    assert.ok(end.some((x) => x.id === 'ck.photograph' && x.kind === 'late' && x.told === 229));
    assert.ok(end.some((x) => x.id === 'r.opium_taste' && x.kind === 'supplied'));
    assert.ok(end.some((x) => x.id === 'r.hoof_strikes_as_horse_kicks' && x.kind === 'supplied' && x.told === null), 'supplied, never stated: at the end');
});

test('the reader: an 1892 reader holds opium\'s taste; a racing man the blaze; a modern reader neither', () => {
    const at = (reader) => new Game(model, { difficulty: EASY, options: { reader } });
    assert.equal(at('1892').disclosure('r.opium_taste').supplied, false);
    assert.equal(at('1892').disclosure('r.markings_identify_horse').supplied, true);
    assert.equal(at('racing').disclosure('r.markings_identify_horse').supplied, false);
    assert.equal(at('racing').disclosure('r.tendon_nick').supplied, true);
    assert.equal(at('modern').opts.reader, 'modern');
    assert.equal(new Game(model, { difficulty: EASY }).opts.reader, 'modern', 'the default');
});

test('the reader is not the difficulty, and survives a change of it', async () => {
    const { presetOf, PRESETS, optionsFrom } = await import('./game.js');
    assert.equal(presetOf({ ...PRESETS.medium, reader: '1892' }), 'medium');
    assert.equal(presetOf({ ...PRESETS.medium, supplied: 'withheld' }), 'custom');
    assert.equal(optionsFrom('hard', { reader: 'racing' }).reader, 'racing');
    const g = new Game(model, { difficulty: EASY, options: { reader: '1892' } });
    g.load({ ...g.save(), options: { ...PRESETS.hard, reader: g.opts.reader } });
    assert.equal(g.opts.reader, '1892');
});

test('withheld: a fact the reader lacks comes only where the story states it, and never-told steps do not gate', () => {
    const g = new Game(model, { difficulty: EASY, options: { supplied: 'withheld' } });
    assert.equal(g.ruleAt.get('r.opium_taste'), 218);
    assert.equal(g.ruleAt.get('r.hoof_strikes_as_horse_kicks'), Infinity);
    readTo(g, 150);
    assert.ok(!g.knows('r.opium_taste'));
    assert.ok(!g.buildable().includes('k.drugger_knew_the_menu'));
    const gated = new Set([...g.gates.values()].flatMap((s) => [...s]));
    for (const s of ['t102.4', 't37.13', 't148.2']) assert.ok(!gated.has(s), `${s}: a premise is never told`);
    assert.ok(model.story.gates.get(226).has('t102.4'), 'the story\'s own gates are untouched');
    readTo(g, 218);
    assert.ok(g.knows('r.opium_taste'));
    // All at once, the withheld still wait.
    const s = new Game(model, { difficulty: EASY, options: { supplied: 'withheld', background: 'start' } });
    assert.ok(!s.knows('r.opium_taste') && s.knows('r.dog_barks_at_strangers'));
    // Offered (the default): nothing moves.
    const o = new Game(model, { difficulty: EASY });
    assert.equal(o.ruleAt.get('r.opium_taste'), 37);
    assert.equal(o.gates, model.story.gates);
});
