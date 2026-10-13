import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, TRIVIAL, EASY, HARD, WAIT } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);

/** Prove a route step's conclusion, citing the step's own premises. Like Holmes, first doubt what disagrees. */
function proveStep(game, stepId) {
    const step = game.routeById.get(stepId);
    const c = step.concludes;
    const slot = c.slot ?? c.formula?.eq?.[0];
    for (const g of game.givers.get(slot) ?? []) {
        if (game.knows(g.claim) && (c.slot ? g.value === c.value : g.value !== c.formula.eq[1])) game.suspect(g.claim);
    }
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

test('doubt: no claim asks "is it true?" until the player suspects it', () => {
    const game = new Game(model);
    while (!game.knows('c.straker_honest_record')) game.advance();
    for (const id of ['c.straker_honest_record.truth', 'straker.honest']) assert.equal(game.slotVisible(id), false, id);
    game.suspect('c.straker_honest_record');
    assert.ok(game.slotVisible('c.straker_honest_record.truth'));
    assert.ok(game.slotVisible('straker.honest'), 'doubting it opens what it filled in');
    // A claim the case holds true is suspected the same way.
    while (!game.knows('c.stall_empty')) game.advance();
    assert.equal(game.slotVisible('c.stall_empty.truth'), false);
    game.suspect('c.stall_empty');
    assert.ok(game.slotVisible('c.stall_empty.truth'));
});

test('doubt: a trusted claim fills its details but never a case question; doubting it reopens them', () => {
    const game = new Game(model);
    while (!game.finished()) game.advance();
    assert.equal(game.given('straker.honest')?.value, 'true');
    assert.equal(game.given('the_bay.identity'), null, 'a case question is proved, not given');
    game.suspect('c.straker_honest_record');
    assert.equal(game.given('straker.honest')?.claim, 'c.straker_said_anxious', 'the other account still says so');
    game.suspect('c.straker_said_anxious');
    assert.equal(game.given('straker.honest'), null);
});

test('doubt: a proof resting on a claim lapses when the claim is suspected', () => {
    const game = new Game(model);
    while (!game.finished()) game.advance();
    assert.ok(game.prove('the_bay.identity', 'silver_blaze', ['c.wash_with_spirits']).ok);
    assert.equal(game.settled('the_bay.identity'), 'silver_blaze');
    game.suspect('c.wash_with_spirits');
    assert.equal(game.settled('the_bay.identity'), null);
    assert.ok(game.proofLapsed('the_bay.identity'));
    game.unsuspect('c.wash_with_spirits');
    assert.equal(game.settled('the_bay.identity'), 'silver_blaze');
});

test('doubt: citing clues that cannot all be true is refused, naming the clash', () => {
    const game = new Game(model);
    while (!game.finished()) game.advance();
    const step = game.routeById.get('i.straker_dishonest');
    const res = game.prove('straker.honest', 'false', [...step.premises, 'c.straker_honest_record']);
    assert.equal(res.ok, false);
    assert.ok(res.contradiction.includes('k.c.straker_honest_record#trusted'), res.contradiction.join(' '));
    game.suspect('c.straker_honest_record');
    assert.ok(game.prove('straker.honest', 'false', step.premises).ok);
});
