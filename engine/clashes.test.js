// How a clash weighs what it sets aside (docs/clashes.md, Round 108): others' inferences first, then the player's
// heuristics, then clues (someone's word before a report, a report before an admission), then the player's and
// Holmes's inferences; one member goes, and on a tie every tied one. Never by truth: the tests check the outcome
// against the answer key, the engine never reads it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, EASY } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);
const isFalse = (id) => model.cards.get(id)?.truth === false;

/** Read the story on Easy, building nothing; `each` runs after every paragraph. Returns every clash met. */
function replay(each = () => {}, until = Infinity) {
    const game = new Game(model, { difficulty: EASY, options: { background: 'relevant' } });
    const met = new Map();
    while (!game.finished() && game.read <= until) {
        game.advance();
        each(game);
        for (const c of game.clashes()) {
            const key = `${c.ids.join('|')}>${c.aside.join('|')}`;
            if (!met.has(key)) met.set(key, { ...c, para: game.read - 1 });
        }
    }
    return { game, met: [...met.values()] };
}

test('a player who keeps the police\'s account loses no true card: the police go before a clue, Hunter\'s charge before Simpson\'s admission', () => {
    const { met } = replay();
    for (const c of met) assert.ok(c.aside.every(isFalse), `¶${c.para}: ${c.aside.join(', ')} set aside`);
    // ¶46: the police's "took the horse to steal it" against the hope of early exercise (false, but a statement).
    const first = met.find((c) => c.claims.includes('k.police_simpson_took_horse'));
    assert.deepEqual(first.aside, ['k.police_simpson_took_horse']);
    assert.equal(first.why, 'others-inference');
    // Hunter's charge beside Simpson's admission (¶104): the testimony goes, the admission stays.
    const hunter = met.find((c) => c.claims.includes('c.hunter_blames_stranger') && c.claims.includes('c.simpson_admits_visit'));
    assert.deepEqual(hunter.aside, ['c.hunter_blames_stranger']);
    assert.equal(hunter.why, 'statement');
    // Every false statement still gives way to Holmes's chain, alone.
    for (const c of ['c.straker_honest_record', 'c.straker_said_anxious', 'c.gregory_poor_weapon', 'c.derbyshire_a_friend', 'c.brown_denies', 'c.ross_not_my_horse']) {
        assert.ok(met.some((x) => x.aside.length === 1 && x.aside[0] === c), c);
    }
});

test('a player who doubts Holmes\'s curry step keeps Simpson\'s lodging against the police\'s "Simpson drugged him"', () => {
    const doubtCurry = (game) => {
        if (game.knows('k.drugger_chose_the_dish') && !game.isSuspected('k.drugger_chose_the_dish')) game.suspect('k.drugger_chose_the_dish');
    };
    const { met } = replay(doubtCurry, model.story.find('That was the curious incident').para + 1);
    const police = met.find((c) => c.claims.includes('k.police_simpson_drugged'));
    assert.ok(police);
    assert.deepEqual(police.aside, ['k.police_simpson_drugged']);
    assert.ok(!met.some((c) => c.aside.includes('c.simpson_lives_at_villas')), 'the lodging is never set aside');
    for (const c of met) assert.ok(c.aside.every(isFalse), `¶${c.para}: ${c.aside.join(', ')} set aside`);
});

test('a tie sets aside every tied member: the police\'s step built by the player against Holmes\'s dish step', () => {
    const game = new Game(model, { difficulty: EASY, options: { background: 'relevant' } });
    while (!game.buildable().includes('k.police_simpson_drugged')) game.advance();
    for (const id of ['k.police_simpson_drugged', 'k.drugger_chose_the_dish']) assert.deepEqual(game.propose(game.connectSet(id)).built, [id]);
    const [c] = game.clashes();
    assert.deepEqual([...c.aside].sort(), ['k.drugger_chose_the_dish', 'k.police_simpson_drugged']);
    assert.ok(c.tie);
    assert.equal(c.why, 'inference', 'both are the player\'s own: the game has no ground to choose');
    // A doubt resolves it the player's way; the dish step then shows Hunter's charge wrong, and only the charge goes.
    game.suspect('k.police_simpson_drugged');
    assert.deepEqual(game.clashes().map((x) => x.aside), [['c.hunter_blames_stranger']]);
    assert.ok(game.workingConstraints().includes('k.drugger_chose_the_dish'));
});
