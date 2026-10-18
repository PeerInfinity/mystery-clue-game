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
    for (const s of ['t148.2', 't92.4', 't92.15']) assert.ok(!gated.has(s), `${s}: a premise is never told`);
    assert.ok(model.story.gates.get(204).has('t148.2'), 'the story\'s own gates are untouched');
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

test('an expert step is a bonus: it never gates the wait pace, arrives as Holmes explains it, and still scores', async () => {
    const { WAIT } = await import('./game.js');
    const gated = new Set([...model.story.gates.values()].flatMap((x) => [...x]));
    for (const s of ['t46.4', 't37.13', 't102.4']) assert.ok(!gated.has(s), s);
    const free = readTo(new Game(model, { difficulty: EASY }), 225);
    assert.ok(!free.knows('k.horse_kicked'), 'not before Holmes explains the kick');
    readTo(free, 226);
    assert.ok(free.knows('k.horse_kicked'));
    const rows = new Game(model, { difficulty: EASY }).thoughtScores().map((r) => r.thought);
    assert.ok(rows.includes('t102.4') && rows.includes('t37.13'), 'still scored rows');
    // The wait pace reads ¶202 without the kick (it held there before, Round 137).
    const w = new Game(model, { difficulty: EASY, pace: WAIT });
    const state = w.save();
    w.load({ ...state, read: 202 });
    assert.deepEqual(w.blockers(), ['t198.2'], 'the bay is still waited for; the kick is not');
});

test('set aside: a card leaves the lists, stays held, is saved, and changes no score', () => {
    const g = readTo(new Game(model, { difficulty: EASY }), 7);
    assert.ok(g.knows('field_glass'));
    assert.ok(g.setAside('field_glass'));
    assert.ok(g.isSetAside('field_glass') && g.knows('field_glass'));
    assert.ok(!g.setAside('r.dog_barks_at_strangers'), 'a background fact is not set aside');
    assert.ok(!g.setAside('bayard') || g.knows('bayard'), 'only a held card');
    const h = new Game(model, { difficulty: EASY, state: g.save() });
    assert.deepEqual(h.setAsideCards(), ['field_glass']);
    assert.ok(h.putBack('field_glass') && !h.isSetAside('field_glass'));
    // A card the solution uses may be set aside too; nothing is said, and its inferences still build.
    const a = readTo(new Game(model, { difficulty: EASY }), 40);
    const b = readTo(new Game(model, { difficulty: EASY }), 40);
    for (const id of [...b.unlocked.keys()].filter((x) => ['claims', 'entities'].includes(model.cards.get(x).section))) b.setAside(id);
    assert.deepEqual(b.buildable(), a.buildable());
    const scores = (x) => [x.thoughtScores(), x.noticeScores(), x.raiseScores(), x.dropScores(), x.checkScores(), x.absenceScores()];
    assert.deepEqual(scores(b), scores(a));
});

test('re-read: a passage gone back over is recorded with its question, saved, and only within what was read', () => {
    const g = readTo(new Game(model, { difficulty: EASY }), 70);
    assert.equal(g.reread(8, 46), g.rereads[0]);
    assert.deepEqual(g.rereads[0], { from: 8, to: 46, question: null, para: 70 });
    assert.equal(g.reread(60, 90), null, 'not past what was read');
    assert.equal(g.reread(20, 10), null);
    assert.ok(g.reread(20, 37, 'curried_mutton'));
    assert.equal(g.reread(20, 37, 'the_bay'), null, 'a card not held');
    assert.equal(new Game(model, { difficulty: EASY, state: g.save() }).rereads.length, 2);
});

test('the story\'s own signals: Holmes\'s interest quoted with the cards it mentions, and the passages it points back to', async () => {
    const { PRESETS, MEDIUM } = await import('./game.js');
    assert.equal(PRESETS.easy.hints, 'story');
    assert.equal(PRESETS.medium.hints, 'off');
    const g = readTo(new Game(model, { difficulty: EASY }), 109);
    assert.ok(g.helps('hints') && g.showsSignals());
    const s = g.storySignals();
    for (const x of s) assert.ok(x.para < g.read, x.thought);
    assert.ok(!s.some((x) => x.thought === 't111.2'), 'not before its paragraph');
    const shoe = s.find((x) => x.thought === 't109.2');
    assert.ok(shoe.cards.includes('horseshoe') && shoe.quote.includes('horseshoe into my pocket'));
    assert.deepEqual(s.find((x) => x.thought === 't70.2').passage, [8, 46]);
    // A signal names only cards held, and says nothing of what it implies: no check, no slot, no inference.
    for (const x of s) for (const c of x.cards) assert.ok(g.knows(c) && !c.startsWith('k.') && !c.startsWith('ck.'), c);
    assert.ok(!new Game(model, { difficulty: MEDIUM }).showsSignals());
    // Hints feed no score.
    const h = readTo(new Game(model, { difficulty: EASY, options: { hints: 'off' } }), 109);
    const scores = (x) => [x.thoughtScores(), x.noticeScores(), x.checkScores(), x.absenceScores()];
    assert.deepEqual(scores(g), scores(h));
});
