import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, HARD } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);

/** Make a route step's conclusion count as proved, citing the step's own premises. */
function proveStep(game, stepId) {
    const step = game.routeById.get(stepId);
    const c = step.concludes;
    if (c.slot) return game.strike(c.slot, c.value, step.premises);
    const [slot, value] = c.formula.eq;
    return game.prove(slot, value, step.premises);
}

test("Holmes's investigation replays, proving each step it needs from the story's premises", () => {
    const game = new Game(model);
    for (const a of game.actions) {
        for (const s of game.missingFor(a).steps) {
            const res = proveStep(game, s);
            assert.ok(res.ok, `${a.id}: could not prove ${s}`);
        }
        const res = game.perform(a.id);
        assert.ok(res?.ok, `${a.id}: ${JSON.stringify(res?.missing)}`);
    }
    assert.equal(game.done.length, game.actions.length);
});

test('a citation is accepted by any sufficient route, and refused when it is not enough', () => {
    const game = new Game(model);
    for (const a of game.actions) {
        for (const s of game.missingFor(a).steps) proveStep(game, s);
        game.perform(a.id);
    }
    // The curry route and the dog route both clear Simpson of taking the horse.
    const curry = game.routeById.get('i.straker_took_horse').premises;
    const dog = game.routeById.get('i.visitor_known_to_dog').premises;
    assert.ok(game.checkElimination('e.horse_led_out.agent', 'simpson', curry).ok);
    assert.ok(game.checkElimination('e.horse_led_out.agent', 'simpson', dog).ok);
    // The dog alone does not clear the Colonel.
    assert.equal(game.checkElimination('e.horse_led_out.agent', 'colonel_ross', dog).ok, false);
    // Citing a card the player has not found is refused.
    const fresh = new Game(model);
    assert.equal(fresh.checkElimination('e.opium_added.agent', 'simpson', curry).ok, false);
});

test('easy mode lists what the unlocked clues allow; hard mode starts empty', () => {
    const easy = new Game(model);
    easy.perform('a.receive_telegrams');
    easy.perform('a.read_papers');
    assert.ok(easy.plausible('e.opium_added.agent', 'simpson').plausible === false, 'with the rule cards, the curry argument already rules Simpson out');
    const noRules = new Game(model, { allRules: false });
    noRules.perform('a.receive_telegrams');
    noRules.perform('a.read_papers');
    assert.ok(noRules.plausible('e.opium_added.agent', 'simpson').plausible, 'without the rules, Simpson still fits');
    const hard = new Game(model, { difficulty: HARD });
    hard.perform('a.receive_telegrams');
    hard.perform('a.read_papers');
    assert.deepEqual(hard.pencil('e.opium_added.agent'), []);
    assert.ok(hard.plausible('e.opium_added.agent', 'simpson').plausible, 'hard mode checks shape only');
    assert.equal(hard.plausible('e.opium_added.agent', 'stable').plausible, false, 'a place cannot drug anyone');
});

test('the police theory fits the early clues without the key rules, and breaks with them', () => {
    const game = new Game(model, { allRules: false });
    game.perform('a.receive_telegrams');
    game.perform('a.read_papers');
    const police = model.data.theories.find((t) => t.id === 't.police');
    assert.ok(game.checkTheory(police).fits);
    const withRules = new Game(model);
    withRules.load(game.save());
    withRules.allRules = true;
    withRules.load({ ...game.save(), allRules: true });
    assert.equal(withRules.checkTheory(police).fits, false);
});

test('save and load round-trip', () => {
    const game = new Game(model);
    game.perform('a.receive_telegrams');
    game.strike('e.opium_added.agent', 'watson');
    const copy = new Game(model, { state: JSON.parse(JSON.stringify(game.save())) });
    assert.deepEqual(copy.done, game.done);
    assert.equal(copy.pencil('e.opium_added.agent').includes('watson'), false);
});
