// Format 0.3: rule schemas grounded against cards, relations and propositions as slots, verified inferences,
// and the player's own moves: applying a rule and concluding from cited cards.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { ground, isGround, varsOf } from './logic.js';
import { instantiateRule, verifyInference, checkStep, buildModel } from './caseModel.js';
import { Game, WAIT, BG_START, TRIVIAL } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);

test('ground: variables, facets, relation terms indexed by a slot, quantifiers and only', () => {
    const env = {
        bind: { dog: 'stable_dog', visit: 'e.stable_entered' },
        hasSlot: (id) => model.slots.has(id),
        domainOf: (id) => model.slots.get(id).domain,
        relation: (n) => model.relations.get(n),
        cards: (spec) => model.env.cards(spec),
    };
    const f = ground({ eq: [{ rel: ['acquainted', '?dog', '?visit.agent'] }, 'true'] }, env);
    assert.equal(f.index[0], 'e.stable_entered.agent', 'a lookup keyed by the slot');
    assert.equal(f.index[1].simpson, 'rel.acquainted.stable_dog.simpson');
    assert.ok(Object.keys(f.index[1]).length > 10, 'one target per value of the slot');
    assert.equal(f.index[2], 'true');
    // Two slot-valued arguments still expand into guarded implications.
    const two = ground({ eq: [{ rel: ['heads_household', 'e.curry_chosen.place', '?visit.agent'] }, 'true'] }, { ...env, relation: (n) => ({ ...model.relations.get(n), outside: 'false' }) });
    assert.ok(two.and.length > 10 && two.and[0].implies, 'guarded by the values of both slots');
    assert.deepEqual(ground({ same: ['?visit.place', 'e.dog_silent.place'] }, env), { same: ['e.stable_entered.place', 'e.dog_silent.place'] });
    assert.throws(() => ground({ eq: ['?horse.agent', 'x'] }, env), /not bound/);
    assert.throws(() => ground({ eq: ['?dog.colour', 'x'] }, env), /no such slot/);
    const only = ground({ only: ['heads_household', 'straker_villa', ['straker']] }, env);
    assert.ok(only.and.some((p) => p.eq[0] === 'rel.heads_household.straker_villa.straker' && p.eq[1] === 'true'));
    assert.ok(only.and.some((p) => p.eq[0] === 'rel.heads_household.straker_villa.mrs_straker' && p.eq[1] === 'false'));
    const all = ground({ forall: [{ var: 'p', only: ['straker', 'simpson'] }, { ne: ['e.opium_added.agent', '?p'] }] }, env);
    assert.deepEqual(all, { and: [{ ne: ['e.opium_added.agent', 'straker'] }, { ne: ['e.opium_added.agent', 'simpson'] }] });
    assert.ok(isGround(all) && !isGround({ eq: ['?x.agent', 'y'] }));
    assert.deepEqual([...varsOf({ implies: [{ eq: ['?a.time', 'w'] }, { eq: [{ rel: ['r', '?b'] }, 'true'] }] })], ['a', 'b']);
});

test('instantiateRule checks the bindings against the variables', () => {
    const ok = instantiateRule(model, 'r.dog_barks_at_strangers', { dog: 'stable_dog', visit: 'e.stable_entered', silence: 'e.dog_silent' });
    assert.ok(ok.ok, ok.error);
    assert.deepEqual(ok.premises, ['r.dog_barks_at_strangers', 'stable_dog', 'e.stable_entered', 'e.dog_silent']);
    assert.match(instantiateRule(model, 'r.dog_barks_at_strangers', { dog: 'straker', visit: 'e.stable_entered', silence: 'e.dog_silent' }).error, /must be a animal/);
    assert.match(instantiateRule(model, 'r.dog_barks_at_strangers', { dog: 'stable_dog' }).error, /not bound/);
    assert.match(instantiateRule(model, 'r.curry_masks', { dish: 'hunter_portion' }).error, /a object that is spiced/);
    assert.match(instantiateRule(model, 'r.curry_masks', { dish: 'hay' }).error, /not a card/);
    assert.match(instantiateRule(model, 'r.wet_ground_holds_tracks').error, /no formula/);
});

test('verified inferences: the engine derives the conclusion; an asserted one only stands on its word', () => {
    const k = (id) => model.data.constraints.find((x) => x.id === id);
    assert.equal(verifyInference(model, k('k.dog_knew_the_visitor')).status, 'verified');
    assert.equal(verifyInference(model, k('k.drugger_chose_the_dish')).status, 'verified');
    assert.equal(verifyInference(model, k('k.bill_is_his_own')).status, 'verified');
    assert.equal(verifyInference(model, k('k.window_drugging_time')).status, 'asserted');
    // Without the rule application the premises alone do not reach the conclusion.
    assert.equal(verifyInference(model, { ...k('k.dog_knew_the_visitor'), rules: [] }).status, 'asserted');
    // The rule application is part of the inference in the case's reading: Holmes's step (the thought) still checks.
    const step = model.data.route.find((r) => r.id === 't34.7');
    assert.ok(checkStep(model, step.premises, step.concludes).ok);
});

test('applyRule: the player grounds a background fact against cards and holds it', () => {
    const game = new Game(model, { background: BG_START });
    while (!game.knows('e.stable_entered') || !game.knows('e.dog_silent')) game.advance();
    assert.ok(game.applicableRules().includes('r.dog_barks_at_strangers'));
    assert.ok(game.ruleBindings('r.dog_barks_at_strangers').dog.includes('stable_dog'));
    assert.match(game.applyRule('r.dog_barks_at_strangers', { dog: 'stable_dog', visit: 'e.stable_entered', silence: 'e.straker_jockey' }).error, /no such slot/, 'an event without the facets the rule speaks of cannot be bound');
    const res = game.applyRule('r.dog_barks_at_strangers', { dog: 'stable_dog', visit: 'e.stable_entered', silence: 'e.dog_silent' });
    assert.ok(res.ok, res.error);
    assert.ok(game.knows(res.id) && game.heldApplied().includes(res.id));
    assert.equal(game.applyRule('r.dog_barks_at_strangers', { dog: 'stable_dog', visit: 'e.stable_entered', silence: 'e.dog_silent' }).existing, true);
    // The dog knew whoever came in; it knows only its own establishment; Simpson lodged at the villas: not him.
    assert.equal(game.checkElimination('e.stable_entered.agent', 'simpson').ok, false, 'who the dog knows is still open');
    while (!game.knows('c.simpson_lives_at_villas')) game.advance();
    const own = game.applyRule('r.dog_knows_its_own', { dog: 'stable_dog' });
    assert.ok(own.ok, own.error);
    assert.ok(game.checkElimination('e.stable_entered.agent', 'simpson').ok);
    game.suspect(res.id);
    assert.equal(game.checkElimination('e.stable_entered.agent', 'simpson').ok, false, 'doubting the application takes it away');
    game.unsuspect(res.id);
    assert.ok(game.retract(res.id));
    assert.equal(game.knows(res.id), false);
});

test('conclude: a stated conclusion the cited cards entail becomes an inference card; one they do not is refused', () => {
    const game = new Game(model, { background: BG_START });
    while (game.read < 60) game.advance();
    const cited = ['c.dog_kept_in_stable', 'c.dog_did_nothing', 'c.stall_empty', 'c.stable_door_open', 'c.simpson_lives_at_villas'];
    const nope = game.conclude(cited, { ne: ['e.stable_entered.agent', 'simpson'] });
    assert.equal(nope.ok, false, 'the clues alone do not say who the dog knew');
    const applied = game.applyRule('r.dog_barks_at_strangers', { dog: 'stable_dog', visit: 'e.stable_entered', silence: 'e.dog_silent' });
    const own = game.applyRule('r.dog_knows_its_own', { dog: 'stable_dog' });
    assert.equal(game.conclude([...cited, applied.id], { ne: ['e.stable_entered.agent', 'simpson'] }).ok, false, 'nor who it knows');
    const res = game.conclude([...cited, applied.id, own.id], { ne: ['e.stable_entered.agent', 'simpson'] });
    assert.ok(res.ok, JSON.stringify(res));
    assert.ok(game.knows(res.id) && game.heldInferences().includes(res.id));
    assert.ok(res.premises.includes(applied.id) && res.premises.includes(own.id) && res.premises.includes('c.simpson_lives_at_villas'), res.premises.join(' '));
    assert.ok(!res.premises.includes('c.stall_empty'), 'only what was needed is kept as a premise');
    // The authored inference's own conclusion: the visitor belonged to King's Pyland.
    const wide = game.conclude([...cited, applied.id, own.id], model.cards.get('k.dog_knew_the_visitor').formula);
    assert.ok(wide.ok && wide.matches.includes('k.dog_knew_the_visitor'), JSON.stringify(wide.matches));
    // Citing clues that clash is refused as a contradiction, not accepted as a proof of anything.
    while (!game.knows('c.derbyshire_a_friend') || !game.knows('c.milliner_knows_straker')) game.advance();
    const clash = game.conclude(['c.derbyshire_a_friend', 'c.milliner_knows_straker', 'c.milliner_bill', 'c.papers_in_pocket'], { eq: ['e.opium_added.agent', 'watson'] });
    assert.ok(clash.contradiction, JSON.stringify(clash));
    assert.equal(game.conclude(['c.stall_empty'], { eq: ['e.opium_added.agent', 'nobody'] }).ok, false);
    assert.equal(new Game(model, { difficulty: TRIVIAL }).conclude(['c.stall_empty'], { true: true }).ok, false, 'not while the game solves');
});

test("a player's own conclusion passes Holmes's gate under the wait pace", () => {
    const game = new Game(model, { pace: WAIT, background: BG_START });
    // Up to the Derbyshire gate, make Holmes's steps the old way (connecting the premises of his inferences).
    let res;
    for (;;) {
        res = game.advance();
        if (res.ok) continue;
        if (res.needs.includes('t84.6')) break;
        // A chained inference wants the inferences it cites held first (implicit ones come by themselves).
        const build = (id) => {
            for (const p of game.inferenceById.get(id)?.premises ?? []) if (game.inferenceById.has(p) && !game.knows(p)) build(p);
            game.propose(game.connectSet(id));
        };
        for (const s of res.needs) for (const id of game.stepInferences(s) ?? []) build(id);
        assert.deepEqual(game.blockers(), [], `stuck at ${game.read} on ${res.needs}`);
    }
    assert.ok(!game.stepMade('t84.6'));
    // Now the player's own route: apply "men carry their own bills" to the milliner's bill, and conclude.
    const applied = game.applyRule('r.others_bills', { doc: 'milliner_bill' });
    assert.ok(applied.ok, applied.error);
    const made = game.conclude(['c.milliner_bill', 'c.papers_in_pocket', applied.id], { eq: ['william_derbyshire.identity', 'straker'] });
    assert.ok(made.ok, JSON.stringify(made));
    assert.ok(made.matches.includes('k.bill_is_his_own') || made.premises.includes(applied.id));
    assert.ok(game.stepMade('t84.6'));
    assert.ok(game.advance().ok, 'the story goes on');
    // Saved and restored, the player's cards come back and the gate stays open.
    const copy = new Game(model, { state: JSON.parse(JSON.stringify(game.save())) });
    // (On the same model the first game still holds its cards, so the copy's get fresh ids.)
    assert.equal(copy.heldApplied().length, 1);
    assert.ok(copy.stepMade('t84.6'));
    assert.equal(copy.heldInferences().filter((id) => id.startsWith('k.player_')).length, 1);
});

test('relation and proposition slots: a relation question shows only once a held clue speaks of it', () => {
    const game = new Game(model);
    while (!game.knows('stable_dog')) game.advance();
    assert.equal(game.slotVisible('rel.acquainted.stable_dog.simpson'), false, 'nothing has spoken of it yet');
    assert.equal(game.slotVisible('rel.of_establishment.stable_dog'), false);
    while (!game.knows('c.dog_kept_in_stable')) game.advance();
    assert.equal(game.slotVisible('rel.of_establishment.stable_dog'), false, 'a given fills it without raising it');
    game.suspect('c.dog_kept_in_stable');
    assert.ok(game.slotVisible('rel.of_establishment.stable_dog'), 'doubting it opens the question');
    assert.match(game.promptOf('rel.of_establishment.stable_dog'), /belong\?/);
    assert.equal(game.slotVisible('rel.needed_hiding.e.opium_added'), false, 'a relation on an event waits to be raised too');
});

test('traits: a variable may range over the cards that carry a trait; the trait shows on its card like a gloss', () => {
    assert.deepEqual(model.env.cards({ kind: 'object', trait: 'spiced' }), ['curried_mutton']);
    assert.deepEqual(model.env.cards({ trait: 'spiced' }), ['curried_mutton']);
    assert.deepEqual(model.env.cards({ kind: 'person', trait: 'spiced' }), []);
    const ok = instantiateRule(model, 'r.curry_masks', { dish: 'curried_mutton' });
    assert.ok(ok.ok, ok.error);
    assert.deepEqual(ok.formula, { eq: ['rel.masks_taste.curried_mutton', 'true'] });
    // Shown with the card's first mention, as a word explained, never before the story names the dish.
    const g = new Game(model);
    const first = model.story.firstAt.get('curried_mutton');
    while (g.read <= first) g.advance();
    const t = g.info('curried_mutton').find((it) => it.trait === 'spiced');
    assert.ok(t && t.kind === 'background' && t.term === 'Spiced' && t.para === first);
});

test('states: declared windows are slots; rule terms fold places, look up by time, and leave undeclared windows free', () => {
    const s = model.slots.get('st.straker.at.tue_0100');
    assert.equal(s.on, 'straker');
    assert.equal(s.answer, 'straker_villa');
    assert.ok(s.domain.includes('elsewhere') && s.domain.includes('fatal_hollow') && !s.domain.includes('straker_bedroom'));
    assert.ok(!model.slots.has('st.straker.at.tue_stable'), 'sparse: only declared windows');
    // The bedroom folds into the villa; a time slot becomes a lookup over the declared windows.
    const at = instantiateRule(model, 'r.agent_is_there', { who: 'straker', act: 'e.straker_dresses' });
    assert.ok(at.ok, at.error);
    const villa = at.formula.implies[1].and.find((p) => p.implies[0].in?.[1].includes('straker_bedroom'));
    assert.deepEqual(villa.implies[1].index.slice(0, 1), ['e.straker_dresses.time']);
    assert.equal(villa.implies[1].index[2], 'straker_villa');
    assert.equal(instantiateRule(model, 'r.stays_put', { thing: 'mrs_straker', from: 'w.tue_0100', to: 'w.tue_0700' }).formula.same[0], 'st.mrs_straker.at.tue_0100');
    assert.match(instantiateRule(model, 'r.stays_put', { thing: 'mrs_straker', from: 'straker', to: 'w.tue_0700' }).error, /time window/);
    // No declared window at the time asked: the rule says nothing there.
    assert.deepEqual(ground({ same: [{ state: ['at', 'straker', 'w.tue_blow'] }, 'e.fatal_blow.place'] }, model.env), { true: true });
    // With an open window at the stable hour, staying put in the loft until seven rules the lads out as the taker.
    const data = structuredClone(model.data);
    data.states.find((t) => t.id === 'st.other_lads.at').windows['w.tue_stable'] = null;
    const m2 = buildModel(data);
    assert.deepEqual(m2.errors, []);
    const rules = [
        instantiateRule(m2, 'r.agent_is_there', { who: 'other_lads', act: 'e.horse_led_out' }).formula,
        instantiateRule(m2, 'r.stays_put', { thing: 'other_lads', from: 'w.tue_stable', to: 'w.tue_0700' }).formula,
    ];
    const fixed = { 'e.horse_led_out.place': 'stable', 'e.horse_led_out.time': 'w.tue_stable' };
    const active = ['k.c.lads_heard_nothing'];
    assert.equal(m2.problem.consistent(active, { ...fixed, 'e.horse_led_out.agent': 'other_lads' }, { extra: rules }).ok, false);
    assert.equal(m2.problem.consistent(active, { ...fixed, 'e.horse_led_out.agent': 'straker' }, { extra: rules }).ok, true);
    // Without persistence the loft at seven says nothing about the stable hour.
    assert.equal(m2.problem.consistent(active, { ...fixed, 'e.horse_led_out.agent': 'other_lads' }, { extra: rules.slice(0, 1) }).ok, true);
});
