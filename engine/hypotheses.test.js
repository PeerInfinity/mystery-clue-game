// Hypotheses, scenarios and residue (docs/hypotheses.md, workstream 6). A scenario is weighed by its cost: its answers
// held fast, the clashes they make with what the player trusts broken as clashes are, lightest first. A story that
// says a witness is wrong pays for it; one that goes against the player's own reasoning is at odds with it. Never by
// truth: the tests check the outcome against the answer key, the engine never reads it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, EASY, MEDIUM } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);
const isFalse = (id) => model.cards.get(id)?.truth === false;
const theory = (id) => model.data.theories.find((t) => t.id === id);
// The annotation's inside story (t92.6) as a player would write it: a fixture, not a story theory (Q1).
const INSIDE = {
    assignment: {
        'e.opium_added.agent': 'straker', 'e.opium_added.place': 'straker_villa', 'e.horse_led_out.agent': 'straker',
        'e.horse_led_out.purpose': 'injure', 'e.fatal_blow.agent': 'silver_blaze', 'e.knife_taken.purpose': 'operation',
        'e.coat_off.purpose': 'work', 'william_derbyshire.identity': 'straker', 'straker.honest': 'false', 'silver_blaze.hidden_at': 'mapleton',
        'silver_blaze.disguised': 'true', 'e.fatal_blow.instrument': 'steel_shoe',
    },
};
const cards = (cost) => cost.items.flatMap((i) => i.cards);

function build(game, id) {
    for (const p of game.inferenceById.get(id)?.premises ?? []) if (game.inferenceById.has(p) && !game.knows(p)) build(game, p);
    return game.propose(game.connectSet(id));
}

// The annotation's Silas Brown as organiser (t66.3), as a player would write it.
const BROWN = { assignment: { 'e.horse_hidden.agent': 'silas_brown', 'e.horse_led_out.purpose': 'steal' } };

// One passive reading (Easy, background when relevant, nothing built), weighed at a few paragraphs; the absences
// filed as Easy offers them.
const AT = [46, 92, 104, 231];
const seen = new Map();
{
    const game = new Game(model, { difficulty: EASY, options: { background: 'relevant' } });
    while (!game.finished()) {
        game.advance();
        for (const a of game.fileableAbsences()) game.fileAbsence(a.expectation, a.windows[0], a.witness);
        const p = game.read - 1;
        if (!AT.includes(p)) continue;
        const clashes = JSON.stringify(game.clashes());
        seen.set(p, {
            met: game.metPuzzles().map((z) => z.id),
            residue: Object.fromEntries([['police', theory('t.police')], ['gypsies', theory('t.gypsies')], ['inside', INSIDE], ['brown', BROWN],
                ['patched', { assignment: { ...theory('t.police').assignment, 'e.stable_entered.instrument': 'duplicate_key' } }]].map(([n, t]) => [n, game.residue(t).residue])),
            inside: game.scenarioCost(INSIDE),
            police: game.scenarioCost(theory('t.police')),
            support: game.theorySupport(theory('t.police')),
            layer: game.checkLayer('t.police').cost,
            clashesAfter: JSON.stringify(game.clashes()) === clashes,
        });
    }
}

test('the inside story needs only false things to be wrong, fewer as the story goes, and none at the end', () => {
    const at92 = seen.get(92).inside;
    assert.equal(at92.atOdds, false);
    assert.ok(at92.items.length >= 5, `${at92.items.length} items at ¶92`);
    for (const p of AT) {
        const c = seen.get(p).inside;
        assert.ok(cards(c).every(isFalse), `¶${p}: ${cards(c).join(', ')}`);
    }
    assert.ok(seen.get(104).inside.items.length < at92.items.length);
    assert.deepEqual(seen.get(231).inside.items, []);
    // Straker's record is a report: a statement, told second-hand.
    const record = at92.items.find((i) => i.cards.includes('c.straker_honest_record'));
    assert.deepEqual([record.why, record.told], ['statement', 'report']);
});

test('the police theory needs a witness wrong until ¶92, and from ¶104 goes against Holmes\'s dish step', () => {
    const at92 = seen.get(92).police;
    assert.equal(at92.atOdds, false);
    assert.ok(at92.items.every((i) => i.why === 'statement'), JSON.stringify(at92.items));
    const at104 = seen.get(104).police;
    assert.equal(at104.atOdds, true);
    assert.ok(at104.items.some((i) => i.why === 'inference' && i.cards.includes('k.drugger_chose_the_dish')), JSON.stringify(at104.items));
    // The layer's check weighs the same night (no pencil marks on it).
    assert.deepEqual(seen.get(104).layer, at104);
});

test('weighing a scenario changes no clash', () => {
    for (const p of AT) assert.ok(seen.get(p).clashesAfter, `¶${p}`);
});

test('the Theories panel\'s agree and against are read off the solver: no implication agrees vacuously', () => {
    const { agree, against } = seen.get(104).support;
    for (const k of ['k.operation_in_the_open', 'k.knife_for_an_operation']) assert.ok(!agree.includes(k), k);
    assert.ok(against.includes('k.drugger_chose_the_dish'), against.join(' '));
});

test('a player who sees through the gypsies by ¶62 holds them at odds with their own reasoning', () => {
    const game = new Game(model, { difficulty: EASY, options: { background: 'relevant' } });
    while (game.read <= 62) game.advance();
    const before = game.scenarioCost(theory('t.gypsies'));
    assert.equal(before.atOdds, false, JSON.stringify(before.items));
    assert.ok(build(game, 'k.gypsies_did_not_take_him').built?.includes('k.gypsies_did_not_take_him'));
    const after = game.scenarioCost(theory('t.gypsies'));
    assert.equal(after.atOdds, true);
    assert.ok(after.items.some((i) => i.why === 'inference' && i.cards.includes('k.gypsies_did_not_take_him')), JSON.stringify(after.items));
});

test('the police leave the annotation\'s residue (t46.3) over; the inside story explains it', () => {
    const at46 = seen.get(46);
    // The dog and the alarm are absences, filed here as Easy offers them; why take the horse out, the police explain
    // by theft (a listed difference from t46.3, which finds the theft itself improbable).
    for (const z of ['pz.curry', 'pz.dog', 'pz.key', 'pz.no_alarm', 'pz.coat', 'pz.one_blow', 'pz.not_found']) {
        assert.ok(at46.met.includes(z), `${z} met by ¶46`);
        assert.ok(at46.residue.police.includes(z), `${z} in the police's residue`);
    }
    assert.ok(!at46.residue.police.includes('pz.led_out'));
    for (const p of AT) assert.deepEqual(seen.get(p).residue.inside, [], `¶${p}`);
});

test('the gypsies explain neither the curry nor the dog (t62.4); Brown as organiser leaves more over than the inside story (t68.2)', () => {
    const at92 = seen.get(92).residue;
    for (const z of ['pz.curry', 'pz.dog']) assert.ok(at92.gypsies.includes(z), z);
    assert.ok(at92.brown.length > at92.inside.length && at92.inside.every((z) => at92.brown.includes(z)));
    for (const z of ['pz.curry', 'pz.dog']) assert.ok(at92.brown.includes(z), z);
});

test('a patch takes an item out of the tray: the police with a duplicate key explain the locked door (t58.4)', () => {
    const at92 = seen.get(92).residue;
    assert.ok(at92.police.includes('pz.key'));
    assert.ok(!at92.patched.includes('pz.key'));
});

test('off Easy, a puzzle is met only once the player notices one of its cards', () => {
    const game = new Game(model, { difficulty: MEDIUM });
    while (game.read <= 40) game.advance();
    assert.ok(!game.metPuzzles().some((z) => z.id === 'pz.curry'));
    assert.ok(game.notice('c.curry_for_supper').ok);
    assert.ok(game.metPuzzles().some((z) => z.id === 'pz.curry'));
    assert.ok(game.residue(theory('t.police')).residue.includes('pz.curry'));
});

test('drops for reasons that are not proofs: checked where they can be, never refused, scored before the story settles them', () => {
    const game = new Game(model, { difficulty: EASY, options: { background: 'relevant' } });
    const readTo = (p) => { while (game.read <= p) { game.advance(); for (const a of game.fileableAbsences()) game.fileAbsence(a.expectation, a.windows[0], a.witness); } };
    // ¶58: the paper was money (t58.3), by the card that says so.
    readTo(58);
    const paper = { slot: 'paper_packet.contents', value: 'opium' };
    assert.ok(game.drop(paper, 'card', { cites: ['c.simpson_ten_pound_note'] }).ok);
    assert.equal(game.dropCheck(paper).ok, true);
    // ¶62: the gypsies (t62.4), by the player's own step.
    readTo(62);
    assert.ok(build(game, 'k.gypsies_did_not_take_him').built?.includes('k.gypsies_did_not_take_him'));
    assert.ok(game.drop({ theory: 't.gypsies' }, 'card', { cites: ['k.gypsies_did_not_take_him'] }).ok);
    assert.equal(game.dropCheck({ theory: 't.gypsies' }).ok, true);
    // ¶92: the player's inside story; the maid needs two hands where it needs one (t92.7); Brown as organiser is
    // out-explained (t68.2).
    readTo(92);
    const inside = game.addTheory('Inside', { ...INSIDE.assignment });
    const brown = game.addTheory('Brown', { ...BROWN.assignment });
    const maid = { slot: 'e.opium_added.agent', value: 'edith_baxter' };
    assert.ok(game.drop(maid, 'more-hands', { rival: inside }).ok);
    const hands = game.dropCheck(maid);
    assert.deepEqual([hands.ok, hands.hands.length, hands.rivalHands.length], [true, 2, 1]);
    assert.ok(game.drop({ theory: brown }, 'out-explained', { rival: inside }).ok);
    assert.equal(game.dropCheck({ theory: brown }).ok, true);
    // Never refused: a reason that does not hold is recorded, and the check says so.
    assert.ok(game.drop({ theory: inside }, 'out-explained', { rival: 't.police' }).ok);
    assert.equal(game.dropCheck({ theory: inside }).ok, false);
    assert.ok(game.undrop({ theory: inside }));
    // Scored before the deadline: Holmes's paragraph (the gypsies, ¶114), or where the story makes it untenable (¶104).
    const rows = Object.fromEntries(game.dropScores().map((r) => [r.thought, r]));
    for (const t of ['t58.3', 't62.4', 't92.7']) assert.equal(rows[t].scores, true, t);
    assert.deepEqual([rows['t62.4'].deadline, rows['t92.7'].deadline], [114, 104]);
    assert.deepEqual(game.dropScore(), { dropped: 3, scored: 3, possible: 3, of: 3 });
    // Saved and loaded.
    const again = new Game(model, { difficulty: EASY, options: { background: 'relevant' }, state: JSON.parse(JSON.stringify(game.save())) });
    assert.equal(again.dropOf(maid).reason, 'more-hands');
    assert.equal(again.dropOf({ theory: 't.gypsies' }).cites[0], 'k.gypsies_did_not_take_him');
});

test('the deadlines the annotation gives for the drops Holmes never makes are where the story makes them untenable', () => {
    // The passive reading's cost: the maid and the paper are at odds with the player's own reasoning first at ¶104.
    const game = new Game(model, { difficulty: EASY, options: { background: 'relevant' } });
    const maid = { assignment: { 'e.opium_added.agent': 'edith_baxter' } };
    const paper = { assignment: { 'paper_packet.contents': 'opium' } };
    while (game.read <= 103) game.advance();
    assert.deepEqual([game.scenarioCost(maid).atOdds, game.scenarioCost(paper).atOdds], [false, false]);
    game.advance();
    assert.deepEqual([game.scenarioCost(maid).atOdds, game.scenarioCost(paper).atOdds], [true, true]);
    const deadline = (id) => model.data.thoughts.find((t) => t.id === id).dropped.deadline;
    assert.deepEqual([deadline('t92.7'), deadline('t58.3')], [104, 104]);
});

test('one culprit is doubted for "two stories" (t68.3)', () => {
    const game = new Game(model, { difficulty: EASY, options: { background: 'relevant' } });
    while (game.read <= 68) game.advance();
    assert.ok(build(game, 'k.one_culprit').built?.includes('k.one_culprit'));
    assert.ok(game.suspect('k.one_culprit'));
    assert.ok(game.setDoubtReason('k.one_culprit', 'two-stories'));
    assert.equal(model.data.thoughts.find((t) => t.id === 't68.3').dropped.inference, 'k.one_culprit');
});

test('an old card reads differently under each story (t226.2): the blow under the police and under the inside story', () => {
    const game = new Game(model, { difficulty: EASY, options: { background: 'relevant' } });
    while (game.read <= 104) game.advance();
    const inside = game.addTheory('Inside', { ...INSIDE.assignment });
    const byLayer = (r) => Object.fromEntries(r.layers.map((l) => [l.layer, l.value]));
    const reads = game.readingsOf('c.head_shattered');
    const who = reads.find((r) => r.slot === 'e.fatal_blow.agent');
    const what = reads.find((r) => r.slot === 'e.fatal_blow.instrument');
    assert.deepEqual([byLayer(who)['t.police'], byLayer(who)[inside]], ['simpson', 'silver_blaze']);
    assert.deepEqual([byLayer(what)['t.police'], byLayer(what)[inside]], ['penang_lawyer', 'steel_shoe']);
    // Settling who struck the blow re-reads the old cards it carries.
    for (const c of ['c.head_shattered', 'c.straker_defended_himself']) assert.ok(game.revisedBy('e.fatal_blow.agent').includes(c), c);
    assert.deepEqual(game.readingsOf('c.horse_alone'), []);
});

test('the presets weigh theories by name on Easy, as counts on Medium, on request on Hard (Q8)', async () => {
    const { PRESETS, presetOf } = await import('./game.js');
    assert.deepEqual(['trivial', 'easy', 'medium', 'hard'].map((d) => PRESETS[d].weigh), ['names', 'names', 'counts', 'asked']);
    for (const d of ['easy', 'medium', 'hard']) assert.equal(presetOf(PRESETS[d]), d);
});
