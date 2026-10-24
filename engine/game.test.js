import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, TRIVIAL, EASY, MEDIUM, HARD, CUSTOM, WAIT, BG_START, BG_RELEVANT, BG_ASK, PRESETS, presetOf } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);

/** Prove a route step's conclusion against everything held. Like Holmes, first doubt what disagrees. */
function proveStep(game, stepId) {
    const step = game.routeById.get(stepId);
    const c = step.concludes;
    const slot = c.slot ?? c.formula?.eq?.[0];
    for (const g of game.givers.get(slot) ?? []) {
        if (game.knows(g.claim) && (c.slot ? g.value === c.value : g.value !== c.formula.eq[1])) game.suspect(g.claim);
    }
    if (c.slot) return game.strike(c.slot, c.value);
    if (c.formula.eq) return game.prove(c.formula.eq[0], c.formula.eq[1]);
    return { ok: false, reason: 'not an eq step' };
}

/** Build an inference the way a player would: connect what it needs (naming its kind in Hard). */
function build(game, id) {
    // A chained inference wants the inferences it cites held first (implicit ones come by themselves).
    for (const p of game.inferenceById.get(id)?.premises ?? []) if (game.inferenceById.has(p) && !game.knows(p)) build(game, p);
    const kind = game.opts.kind === 'on' ? game.conclusionKinds(id)[0] : null;
    return game.propose(game.connectSet(id), kind);
}

/** Make Holmes's step: build the inferences it needs, or (when it needs none) prove its conclusion. */
function makeStep(game, stepId) {
    const needs = game.stepInferences(stepId);
    if (!needs) return proveStep(game, stepId);
    for (const id of needs) if (!game.knows(id)) build(game, id);
    const missing = needs.filter((id) => !game.knows(id));
    return missing.length ? { ok: false, reason: `could not build ${missing.join(', ')}` } : { ok: true };
}

/** Build everything buildable from what is held. */
function buildAll(game) {
    for (const id of game.buildable()) build(game, id);
}

test('reading the whole story (free pace, Easy, background when relevant) collects every clue, entity, event and fact', () => {
    const game = new Game(model, { background: BG_RELEVANT });
    while (!game.finished()) assert.ok(game.advance().ok);
    const missing = [...model.cards.values()]
        .filter((c) => ['entities', 'events', 'rules'].includes(c.section) || (c.section === 'claims' && !c.derived))
        .filter((c) => !game.knows(c.id)).map((c) => c.id);
    // An absence no later line states comes only when the player files it; it can be filed.
    const filedOnly = [...game.absenceById().keys()].filter((id) => !game.story.firstAt.has(id));
    // A part of a statement comes when the player splits the statement; each can be.
    const parts = model.data.claims.filter((c) => c.part_of).map((c) => c.id);
    assert.deepEqual(missing.filter((id) => !parts.includes(id)), filedOnly);
    assert.deepEqual(game.fileableAbsences().map((a) => a.id), filedOnly);
    for (const parent of new Set(model.data.claims.filter((c) => c.part_of).map((c) => c.part_of))) assert.ok(game.splitClaim(parent).ok, parent);
    assert.deepEqual(parts.filter((id) => !game.knows(id)), []);
    assert.equal(game.done.length, game.actions.length, 'every action is reached');
});

for (const background of [BG_ASK, BG_RELEVANT, BG_START]) {
    test(`fair play under the 'wait' pace, background '${background}': every gate can be passed with what has been read`, () => {
        const game = new Game(model, { pace: WAIT, background });
        const stuck = [];
        while (!game.finished()) {
            const res = game.advance();
            if (res.ok) continue;
            for (const s of res.needs) {
                const step = game.routeById.get(s);
                const c = step.concludes;
                const slot = c.slot ?? c.formula.eq?.[0];
                if (!game.stepInferences(s)) {
                    if (!game.slotVisible(slot)) stuck.push(`${s}: question ${slot} not visible at paragraph ${game.read}`);
                    if (c.formula?.eq && !game.offered(slot, c.formula.eq[1])) stuck.push(`${s}: answer ${c.formula.eq[1]} not offered at paragraph ${game.read}`);
                }
                // Like Holmes, recall what is known about the things the step turns on.
                // A needed inference's premises, down its chain (the inferences it cites are built on the way).
                const below = (id) => game.inferenceById.get(id).premises.flatMap((p) => (game.inferenceById.has(p) ? below(p) : [p]));
                const premises = [...new Set([...step.premises, ...(game.stepInferences(s) ?? []).flatMap(below)])];
                for (const p of premises) {
                    if (game.knows(p) || model.cards.get(p)?.section !== 'rules') continue;
                    for (const card of model.cards.get(p).attaches_to) game.ask(card);
                }
                const unread = premises.filter((p) => !game.knows(p));
                const proof = unread.length ? { ok: false } : makeStep(game, s);
                if (!proof.ok) stuck.push(`${s} before paragraph ${game.read}${unread.length ? ` (not yet available: ${unread.join(', ')})` : ''}`);
            }
            if (game.blockers().length) break;
        }
        assert.deepEqual(stuck, []);
        assert.ok(game.finished());
    });
}

test('background: all at once, when the story touches the subject, or when asked', () => {
    const start = new Game(model, { background: BG_START });
    assert.ok(start.knows('r.wind_and_coats'), 'a reference book from the start');
    const relevant = new Game(model, { background: BG_RELEVANT });
    while (relevant.read <= 34) relevant.advance();
    assert.equal(relevant.knows('r.wind_and_coats'), false, 'not before the coat is on the bush');
    relevant.advance();
    assert.ok(relevant.knows('r.wind_and_coats'));
    assert.ok(relevant.knows('r.bg_moor_27'), 'a filler fact arrives at the same point');
    const ask = new Game(model, { background: BG_ASK });
    while (ask.read <= 3) ask.advance();
    assert.deepEqual(ask.ask('moor').sort(), ['r.bg_moor_25', 'r.bg_moor_26'], 'only what the story has reached');
    while (ask.read <= 35) ask.advance();
    assert.ok(ask.knows('r.light_hidden_in_hollow'), 'an asked card goes on recalling as the story reaches each subject');
    assert.equal(ask.knows('r.bg_moor_28'), false, 'but nothing ahead of the story (bracken: ¶69)');
    assert.equal(ask.knows('r.cataract_knife_use'), false, 'nothing about cards never asked about');
    assert.ok(ask.info('moor').some((it) => it.card === 'r.wind_and_coats'));
    assert.deepEqual(ask.ask('simpson'), [], 'not a card the player holds yet');
    const again = new Game(model, { state: ask.save() });
    assert.ok(again.knows('r.wind_and_coats'), 'asking is saved');
});

test('Medium needs evidence to cross out; Easy allows a plain pencil mark', () => {
    const medium = new Game(model, { difficulty: MEDIUM });
    assert.equal(medium.strike('e.opium_added.agent', 'watson').ok, false);
    const easy = new Game(model, { difficulty: EASY });
    assert.ok(easy.strike('e.opium_added.agent', 'watson').ok);
});

test('Trivial works it out: questions settle themselves as the clues come in, and false statements do not mislead', () => {
    const game = new Game(model, { difficulty: TRIVIAL });
    while (!game.knows('c.hunter_blames_stranger')) game.advance();
    assert.ok(!game.pencil('e.opium_added.agent').includes('watson') || game.pencil('e.opium_added.agent').length > 1);
    while (!game.finished()) game.advance();
    assert.equal(game.settled('e.opium_added.agent'), 'straker', "Hunter's false account does not mislead it");
    assert.equal(game.settled('the_bay.identity'), 'silver_blaze');
    assert.ok(game.whyNot('the_bay.identity', 'bayard').length > 0);
});

test('a save from before Medium existed keeps its meaning', () => {
    const old = { difficulty: 'easy', pace: 'free', read: 5 };
    assert.equal(new Game(model, { state: old }).difficulty, MEDIUM);
    assert.equal(new Game(model, { state: { ...old, difficulty: 'trivial' } }).difficulty, EASY);
    const now = new Game(model, { difficulty: TRIVIAL });
    assert.equal(new Game(model, { state: now.save() }).difficulty, TRIVIAL);
});

test('Hard: reading collects nothing; clicking the text does', () => {
    const game = new Game(model, { difficulty: HARD });
    while (game.read < 40) game.advance();
    assert.equal(game.knows('opium'), false);
    const p = model.story.firstAt.get('opium');
    assert.deepEqual(game.collect(p, ['opium']).includes('opium'), true);
    assert.equal(game.knows('r.opium_taste'), false, 'background waits to be asked for (Hard defaults to asking)');
    assert.ok(game.ask('opium').includes('r.opium_taste'));
    assert.equal(game.addCandidate('e.opium_added.agent', 'stable').ok, false, 'a place cannot drug anyone');
    assert.equal(game.addCandidate('e.opium_added.agent', 'simpson').ok, false, 'only cards already collected');
    game.collect(model.story.firstAt.get('simpson'), ['simpson']);
    assert.ok(game.addCandidate('e.opium_added.agent', 'simpson').ok);
    assert.deepEqual(game.pencil('e.opium_added.agent'), ['simpson']);
});

test('a cross-out is checked against everything held and trusted, inferences included', () => {
    const game = new Game(model, { background: BG_START });
    while (game.read < 60) game.advance();
    // Before the curry inference is held, nothing rules Simpson out as the drugger.
    assert.equal(game.checkElimination('e.opium_added.agent', 'simpson').ok, false);
    // Connecting the curry clues builds the inferences that rest on them (background implicit), the menu first.
    assert.ok(build(game, 'k.drugger_knew_the_dish').built.includes('k.drugger_knew_the_dish'));
    assert.ok(game.knows('k.drugger_knew_the_menu'));
    assert.ok(build(game, 'k.drugger_chose_the_dish').built.includes('k.drugger_chose_the_dish'));
    const res = game.checkElimination('e.opium_added.agent', 'simpson');
    assert.ok(res.ok);
    assert.ok(res.used.some((k) => ['k.drugger_knew_the_dish', 'k.drugger_chose_the_dish'].includes(k)), res.used.join(' '));
    // Doubting the inference it rests on takes the proof away.
    const struck = game.strike('e.opium_added.agent', 'simpson');
    assert.ok(struck.ok);
    game.suspect(struck.used.map((k) => model.constraints.get(k).inference).find(Boolean));
    assert.ok(game.strikeLapsed('e.opium_added.agent', 'simpson'));
});

test('building an inference: one card may complete it; otherwise the game says how many connections are left', () => {
    const game = new Game(model, { background: BG_START });
    while (!game.finished()) game.advance();
    const fresh = (id) => !game.knows(id);
    // A two-clue inference, not stated in the story: the first card is onto something, the second builds it.
    const two = game.inferences.find((k) => fresh(k.id) && game.connectSet(k.id).length === 2 && game.buildable().includes(k.id));
    assert.ok(two, 'a two-clue inference to build');
    const [a, b] = game.connectSet(two.id);
    const first = game.propose([a]);
    assert.ok(first.onto && first.more >= 1, JSON.stringify(first));
    assert.ok(!game.knows(two.id));
    const second = game.propose([a, b]);
    assert.ok(second.built.includes(two.id), JSON.stringify(second));
    // Unrelated cards are onto nothing.
    const nothing = game.propose(['c.straker_rode_for_ross', 'c.geography']);
    assert.deepEqual([nothing.built, nothing.onto], [[], false]);
});

test('Hard: background facts are connections too, and the conclusion\'s kind must be named', () => {
    const game = new Game(model, { difficulty: HARD, background: BG_START });
    while (!game.finished()) game.advance();
    for (const p of game.story.spans.keys()) game.collect(p, game.story.spans[p].flatMap((sp) => sp.ids));
    const id = 'k.drugger_chose_the_dish';
    assert.ok(game.connectSet(id).some((x) => model.cards.get(x).section === 'rules'));
    if (game.knows(id)) return;
    const clues = game.connectSet(id).filter((x) => model.cards.get(x).section !== 'rules');
    assert.equal(game.propose(clues, 'who').built.length, 0, 'clues alone are not enough in Hard');
    assert.ok(game.propose(game.connectSet(id), null).needsKind);
    assert.ok(game.propose(game.connectSet(id), 'when').wrongKind);
    assert.deepEqual(game.propose(game.connectSet(id), 'who').built, [id]);
});

test("Holmes's inferences arrive where he states them; other readers must build the rest", () => {
    const game = new Game(model, { difficulty: MEDIUM });
    const step = 't34.7';
    const needs = game.stepInferences(step);
    assert.ok(needs.includes('k.dog_knew_the_visitor'), needs.join(' '));
    while (!game.finished() && !game.knows('k.dog_knew_the_visitor')) game.advance();
    assert.equal(game.howHeld('k.dog_knew_the_visitor').how, 'stated');
    assert.equal(game.howHeld('k.dog_knew_the_visitor').by, 'holmes');
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
    const res = game.prove('the_bay.identity', 'silver_blaze');
    assert.ok(res.ok);
    assert.equal(game.settled('the_bay.identity'), 'silver_blaze');
    const claim = game.lapsedBy(res.used).length ? null : res.used.map((k) => model.constraints.get(k).from_claim).find(Boolean);
    game.suspect(claim);
    assert.equal(game.settled('the_bay.identity'), null);
    assert.ok(game.proofLapsed('the_bay.identity'));
    game.unsuspect(claim);
    assert.equal(game.settled('the_bay.identity'), 'silver_blaze');
});

test('a clash among what the player trusts is set aside when checking a proof', () => {
    const game = new Game(model, { background: BG_START });
    while (!game.finished()) game.advance();
    assert.ok(game.clashes().some((c) => c.claims.includes('c.straker_honest_record')));
    const res = game.prove('straker.honest', 'false');
    assert.ok(res.ok);
    assert.ok(!res.used.includes('k.c.straker_honest_record'));
});

test('a card is called only what the story has called it so far', () => {
    const game = new Game(model);
    while (!game.knows('silver_blaze')) game.advance();
    assert.equal(game.nameOf('silver_blaze'), 'The favourite');
    assert.equal(game.nameOf('straker'), 'The trainer');
    const first = game.info('silver_blaze')[0];
    assert.equal(first.kind, 'mention');
    assert.match(first.text, /the favourite for the Wessex Cup/);
    while (game.read <= 10) game.advance();
    assert.equal(game.nameOf('silver_blaze'), 'Silver Blaze');
    assert.ok(game.info('silver_blaze').some((it) => it.kind === 'name' && it.text === 'Silver Blaze'));
});

test("Trivial at Holmes's pace settles an answer only when the story tells it", () => {
    const holmes = new Game(model, { difficulty: TRIVIAL });
    const logic = new Game(model, { difficulty: TRIVIAL, autoPace: 'logic' });
    for (const g of [holmes, logic]) while (g.read <= 120) g.advance();
    assert.equal(holmes.settled('e.fatal_blow.agent'), null, 'Holmes has not said who killed him yet');
    assert.equal(logic.settled('e.fatal_blow.agent'), 'silver_blaze', 'the clues already decide it');
    while (!holmes.finished()) holmes.advance();
    assert.equal(holmes.settled('e.fatal_blow.agent'), 'silver_blaze');
    assert.match(holmes.whyNot('e.fatal_blow.agent', 'simpson')[0].text, /^Holmes: /);
});

test('Next scene reads to the start of the next scene', () => {
    const game = new Game(model);
    const res = game.readToNextScene();
    assert.equal(game.read, game.sceneStarts[1]);
    assert.ok(res.read > 1);
});

test('circling marks an answer the player favours: it is saved, and proves and rules out nothing', () => {
    const game = new Game(model, { difficulty: EASY });
    while (game.read < 38) game.advance();
    const slot = 'e.horse_led_out.agent';
    const before = game.pencil(slot);
    game.circle(slot, 'straker');
    assert.ok(game.isCircled(slot, 'straker'));
    assert.deepEqual(game.pencil(slot), before);
    assert.equal(game.settled(slot), null);
    const again = new Game(model);
    again.load(JSON.parse(JSON.stringify(game.save())));
    assert.ok(again.isCircled(slot, 'straker'));
    again.uncircle(slot, 'straker');
    assert.ok(!again.isCircled(slot, 'straker'));
});

test('Easy: clashes are found and set aside, so one clash does not rule out answers elsewhere; a doubt resolves one', () => {
    const game = new Game(model, { difficulty: EASY });
    while (game.read < 90) game.advance();
    buildAll(game);
    const clashes = game.clashes();
    assert.ok(clashes.length > 0);
    assert.ok(clashes.every((c) => c.claims.length >= 1));
    assert.ok(model.problem.consistent(game.workingConstraints()).ok, 'what is left is consistent');
    // The Derbyshire clash says nothing about who took the horse.
    assert.equal(game.plausible('e.horse_led_out.agent', 'straker').plausible, true);
    const derbyshire = clashes.find((c) => c.claims.includes('c.derbyshire_a_friend'));
    assert.ok(derbyshire);
    const chain = game.chain(derbyshire.ids);
    assert.equal(chain.contradiction, true);
    game.suspect('c.derbyshire_a_friend');
    assert.ok(!game.clashes().some((c) => c.claims.includes('c.derbyshire_a_friend')));
    assert.deepEqual(game.resolvedClashes().map((r) => r.doubted), [['c.derbyshire_a_friend']]);
    const again = new Game(model);
    again.load(JSON.parse(JSON.stringify(game.save())));
    assert.deepEqual(again.resolvedClashes().map((r) => r.doubted), [['c.derbyshire_a_friend']]);
});

test('the difficulties are presets of the options; any other mix is Custom', () => {
    for (const d of [TRIVIAL, EASY, MEDIUM, HARD]) assert.equal(new Game(model, { difficulty: d }).difficulty, d);
    const g = new Game(model, { difficulty: MEDIUM, options: { greying: 'on' } });
    assert.equal(g.difficulty, CUSTOM);
    assert.ok(g.helps('greying') && g.opts.crossOut === 'checked', 'Medium with greying: checked cross-outs, greyed answers');
    assert.equal(new Game(model, { state: g.save() }).difficulty, CUSTOM, 'a custom mix is saved');
    // With the game solving, the player's options do not count against Trivial.
    assert.equal(presetOf({ ...PRESETS.trivial, kind: 'on' }), TRIVIAL);
    assert.equal(presetOf({ ...PRESETS.trivial, irrelevant: 'half' }), CUSTOM);
    // A save from before options keeps its background and connect choices.
    const old = { difficulty: 'medium', background: BG_START, connect: 'connect', pace: 'free', read: 3, version: 3 };
    const back = new Game(model, { state: old });
    assert.equal(back.background, BG_START);
    assert.equal(back.connect, 'connect');
    assert.equal(back.difficulty, CUSTOM);
});

test('pencil cross-outs and collecting cards are options of their own', () => {
    const g = new Game(model, { difficulty: HARD, options: { crossOut: 'pencil' } });
    g.addCandidate('e.opium_added.agent', 'straker');
    assert.equal(g.strike('e.opium_added.agent', 'watson').ok, true, 'pencil, though Hard otherwise');
    assert.equal(new Game(model, { difficulty: EASY, options: { cards: 'collect' } }).collecting(), true);
});

test('cards the solution does not need can be left out, and never one it needs', () => {
    const all = new Game(model, { difficulty: MEDIUM });
    const none = new Game(model, { difficulty: MEDIUM, options: { irrelevant: 'none' } });
    const half = new Game(model, { difficulty: MEDIUM, options: { irrelevant: 'half' } });
    for (const g of [all, none, half]) while (!g.finished()) g.advance();
    for (const id of model.relevant) if (all.knows(id)) assert.ok(none.knows(id), `${id} is needed, so it is dealt`);
    const left = (g) => [...all.unlocked.keys()].filter((id) => !g.knows(id));
    assert.ok(left(none).length > 50, `left out with none: ${left(none).length}`);
    assert.ok(left(half).length > 0 && left(half).length < left(none).length, 'half leaves out fewer');
    assert.ok(left(half).every((id) => left(none).includes(id)), 'a larger share keeps every card a smaller one did');
    assert.ok(all.knows('paddington') && !none.knows('paddington') && !none.knows('g.odds'), 'the station and the glossary are colour');
    // Every answer the case reaches is dealt.
    const solved = new Game(model, { difficulty: TRIVIAL, autoPace: 'logic' });
    while (!solved.finished()) solved.advance();
    let answers = 0;
    for (const q of model.data.questions) {
        const truth = solved.settled(q.slot);
        if (truth && model.cards.has(truth)) { answers++; assert.ok(none.knows(truth), `the answer to ${q.slot} is dealt`); }
    }
    assert.ok(answers >= 9, `answers checked: ${answers}`);
    // Left-out answers are not answers the player waits for or must rule out.
    assert.ok(!none.pencil('e.opium_added.agent').includes('chemist'));
    assert.equal(none.moreToCome('e.opium_added.agent'), false);
    // Trivial still reaches the same answers.
    const t = new Game(model, { difficulty: TRIVIAL, options: { irrelevant: 'none' } });
    while (!t.finished()) t.advance();
    assert.equal(t.settled('e.opium_added.agent'), 'straker');
    assert.equal(t.settled('the_bay.identity'), 'silver_blaze');
});

test('an implicit inference waits for the entities it speaks of, as for its events', () => {
    const game = new Game(model, { background: BG_RELEVANT });
    while (game.read < 40) game.advance();
    assert.equal(game.howHeld('k.went_out_to_the_stables')?.how, 'implicit', 'its premises are held by ¶33');
    assert.equal(game.knows('k.visitor_is_taker'), false, 'it names the midnight visitor, not met until Holmes speaks of him');
    while (game.read < 220) game.advance();
    assert.ok(game.knows('k.visitor_is_taker'));
});

test('scoring: a thought the player makes before Holmes states it scores; one Holmes hands over does not', () => {
    const game = new Game(model, { difficulty: MEDIUM, background: BG_RELEVANT });
    while (game.read < 40) game.advance();
    assert.deepEqual(game.thoughtScores().filter((r) => r.made !== null), []);
    build(game, 'k.drugger_knew_the_dish'); // and the menu inference it cites
    const row = (id) => game.thoughtScores().find((r) => r.thought === id);
    assert.deepEqual(row('t37.8'), { thought: 't37.8', holmes: 218, made: 39, scores: true });
    assert.equal(row('t37.7').scores, true);
    assert.equal(row('t34.7').made, null, 'the dog step is not the player\'s until they make it');
    assert.equal(game.score().scored, 2);
    // Kept in the save, at the paragraph where it was made.
    const copy = new Game(model, { state: JSON.parse(JSON.stringify(game.save())) });
    assert.equal(copy.thoughtScores().find((r) => r.thought === 't37.8').made, 39);
    // Trivial works things out for the player: nothing scores.
    const trivial = new Game(model, { difficulty: TRIVIAL, background: BG_RELEVANT });
    while (trivial.read < 40) trivial.advance();
    trivial.propose(trivial.connectSet('k.drugger_knew_the_menu'));
    assert.equal(trivial.score().scored, 0);
});

test('Hard: an inference whose conclusion speaks through a relation (the curry, the dog) names its kind, and the curry builds', () => {
    const game = new Game(model, { difficulty: HARD, background: BG_START });
    for (const id of ['k.drugger_knew_the_menu', 'k.drugger_knew_the_dish', 'k.dog_knew_the_visitor']) assert.deepEqual(game.conclusionKinds(id), ['who'], id);
    while (game.read < 38) game.advance();
    for (let p = 0; p < game.read; p++) game.collect(p, [...new Set(model.story.segments(p).flatMap((s) => s.ids).filter((x) => model.cards.has(x)))]);
    assert.ok(build(game, 'k.drugger_knew_the_menu').built.includes('k.drugger_knew_the_menu'));
});
