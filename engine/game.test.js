import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, TRIVIAL, EASY, HARD, WAIT } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);

/** Prove a route step's conclusion, citing the step's own premises. */
function proveStep(game, stepId) {
    const step = game.routeById.get(stepId);
    const c = step.concludes;
    if (c.slot) return game.strike(c.slot, c.value, step.premises);
    if (c.formula.eq) return game.prove(c.formula.eq[0], c.formula.eq[1], step.premises);
    return { ok: false, reason: 'not an eq step' };
}

test('reading the whole story (free pace, Easy) collects every clue, entity and event', () => {
    const game = new Game(model);
    while (!game.finished()) assert.ok(game.advance().ok);
    const missing = [...model.cards.values()]
        .filter((c) => ['entities', 'events', 'rules'].includes(c.section) || (c.section === 'claims' && !c.derived))
        .filter((c) => !game.knows(c.id)).map((c) => c.id);
    assert.deepEqual(missing, []);
    assert.equal(game.done.length, game.actions.length, 'every action is reached');
});

test("fair play under the 'wait' pace: every gate can be passed with what has been read", () => {
    const game = new Game(model, { pace: WAIT });
    const stuck = [];
    while (!game.finished()) {
        const res = game.advance();
        if (res.ok) continue;
        for (const s of res.needs) {
            const step = game.routeById.get(s);
            const c = step.concludes;
            const slot = c.slot ?? c.formula.eq[0];
            if (!game.slotVisible(slot)) stuck.push(`${s}: question ${slot} not visible at paragraph ${game.read}`);
            if (c.formula?.eq && !game.offered(slot, c.formula.eq[1])) stuck.push(`${s}: answer ${c.formula.eq[1]} not offered at paragraph ${game.read}`);
            const unread = step.premises.filter((p) => !game.knows(p));
            const proof = unread.length ? { ok: false } : proveStep(game, s);
            if (!proof.ok) stuck.push(`${s} before paragraph ${game.read}${unread.length ? ` (not yet read: ${unread.join(', ')})` : ''}`);
        }
        if (game.blockers().length) break;
    }
    assert.deepEqual(stuck, []);
    assert.ok(game.finished());
});

test('Easy needs evidence to cross out; Trivial allows a plain pencil mark', () => {
    const easy = new Game(model, { difficulty: EASY });
    assert.equal(easy.strike('e.opium_added.agent', 'watson').ok, false);
    const trivial = new Game(model, { difficulty: TRIVIAL });
    assert.ok(trivial.strike('e.opium_added.agent', 'watson').ok);
});

test('Hard: reading collects nothing; clicking the text does', () => {
    const game = new Game(model, { difficulty: HARD });
    while (game.read < 40) game.advance();
    assert.equal(game.knows('opium'), false);
    const p = model.story.firstAt.get('opium');
    assert.deepEqual(game.collect(p, ['opium']).includes('opium'), true);
    assert.ok(game.knows('r.opium_taste'), 'the background fact arrives with its card');
    assert.equal(game.addCandidate('e.opium_added.agent', 'stable').ok, false, 'a place cannot drug anyone');
    assert.equal(game.addCandidate('e.opium_added.agent', 'simpson').ok, false, 'only cards already collected');
    game.collect(model.story.firstAt.get('simpson'), ['simpson']);
    assert.ok(game.addCandidate('e.opium_added.agent', 'simpson').ok);
    assert.deepEqual(game.pencil('e.opium_added.agent'), ['simpson']);
});

test('a citation is accepted by any sufficient route, and refused when it is not enough', () => {
    const game = new Game(model);
    while (!game.finished()) game.advance();
    const curry = game.routeById.get('i.straker_took_horse').premises;
    const dog = game.routeById.get('i.visitor_known_to_dog').premises;
    assert.ok(game.checkElimination('e.horse_led_out.agent', 'simpson', curry).ok);
    assert.ok(game.checkElimination('e.horse_led_out.agent', 'simpson', dog).ok);
    assert.equal(game.checkElimination('e.horse_led_out.agent', 'colonel_ross', dog).ok, false);
    const fresh = new Game(model);
    assert.equal(fresh.checkElimination('e.opium_added.agent', 'simpson', curry).ok, false, 'cards not yet found cannot be cited');
});

test('the police theory survives the first part of the story and is broken by the end', () => {
    const game = new Game(model);
    while (game.read < 30) game.advance();
    const police = model.data.theories.find((t) => t.id === 't.police');
    assert.ok(game.checkTheory(police).fits);
    while (!game.finished()) game.advance();
    assert.equal(game.checkTheory(police).fits, false);
});

test('save and load round-trip', () => {
    const game = new Game(model, { difficulty: HARD });
    while (game.read < 45) game.advance();
    game.collect(21, ['the_stranger']);
    game.collect(model.story.firstAt.get('simpson'), ['simpson']);
    game.addCandidate('the_stranger.identity', 'simpson');
    const copy = new Game(model, { state: JSON.parse(JSON.stringify(game.save())) });
    assert.equal(copy.read, 45);
    assert.ok(copy.knows('the_stranger'));
    assert.deepEqual(copy.pencil('the_stranger.identity'), ['simpson']);
});
