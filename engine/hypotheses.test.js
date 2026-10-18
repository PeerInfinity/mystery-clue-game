// Hypotheses, scenarios and residue (docs/hypotheses.md, workstream 6). A scenario is weighed by its cost: its answers
// held fast, the clashes they make with what the player trusts broken as clashes are, lightest first. A story that
// says a witness is wrong pays for it; one that goes against the player's own reasoning is at odds with it. Never by
// truth: the tests check the outcome against the answer key, the engine never reads it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, EASY } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);
const isFalse = (id) => model.cards.get(id)?.truth === false;
const theory = (id) => model.data.theories.find((t) => t.id === id);
// The annotation's inside story (t92.6) as a player would write it: a fixture, not a story theory (Q1).
const INSIDE = {
    assignment: {
        'e.opium_added.agent': 'straker', 'e.opium_added.place': 'straker_villa', 'e.horse_led_out.agent': 'straker',
        'e.horse_led_out.purpose': 'injure', 'e.fatal_blow.agent': 'silver_blaze', 'e.knife_taken.purpose': 'operation',
        'e.coat_off.purpose': 'work', 'william_derbyshire.identity': 'straker', 'straker.honest': 'false', 'silver_blaze.hidden_at': 'mapleton',
    },
};
const cards = (cost) => cost.items.flatMap((i) => i.cards);

function build(game, id) {
    for (const p of game.inferenceById.get(id)?.premises ?? []) if (game.inferenceById.has(p) && !game.knows(p)) build(game, p);
    return game.propose(game.connectSet(id));
}

// One passive reading (Easy, background when relevant, nothing built), weighed at a few paragraphs.
const AT = [92, 104, 231];
const seen = new Map();
{
    const game = new Game(model, { difficulty: EASY, options: { background: 'relevant' } });
    while (!game.finished()) {
        game.advance();
        const p = game.read - 1;
        if (!AT.includes(p)) continue;
        const clashes = JSON.stringify(game.clashes());
        seen.set(p, {
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
