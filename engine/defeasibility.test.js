// Defeasibility (workstream 3, docs/defeasibility.md): a rule's named exceptions, raised by the player against one
// application. Ruled out by what they hold: refused. Open: a reservation (the card still counts). Established: a
// defeat (the card counts nowhere, with the exception as its reason).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadCase } from './loadCase.js';
import { buildModel, mergeCase } from './caseModel.js';
import { Game, MEDIUM } from './game.js';

const base = new URL('../cases/silver-blaze', import.meta.url).pathname;
const model = await loadCase(base);
const paraOf = (q) => model.story.find(q).para;
const ACCESS = paraOf('Which of them, then, had access to\n      that dish');
const SLEEPERS = paraOf('for they are both sound sleepers');
const DRUGGER = 'k.drugger_took_the_horse';

const readTo = (para, opts = {}) => {
    const game = new Game(model, { difficulty: MEDIUM, options: { background: 'relevant', ...opts } });
    while (game.read <= para) game.advance();
    return game;
};

test('named exceptions are grounded on each application of their rule', () => {
    const k = model.constraints.get(`${DRUGGER}#rule1`);
    assert.deepEqual(k.exceptions, [{ id: 'accomplice', formula: { diff: ['e.opium_added.agent', 'e.horse_led_out.agent'] } }]);
    assert.deepEqual(model.constraints.get('k.dog_knew_the_visitor#rule1').exceptions, [{ id: 'dog_put_out', formula: null }, { id: 'barked_unheard', formula: null }]);
    // A plain string stays text with no id; a named one needs an id and a text, unique in its rule, over its variables.
    const data = mergeCase(JSON.parse(fs.readFileSync(`${base}/case.json`, 'utf8')), Object.fromEntries(JSON.parse(fs.readFileSync(`${base}/case.json`, 'utf8')).parts.map((p) => [p, JSON.parse(fs.readFileSync(`${base}/${p}`, 'utf8'))])));
    const rule = data.rules.find((r) => r.id === 'r.drugged_guard');
    rule.unless = [...rule.unless, { id: 'accomplice', text: 'again' }, { id: 'x', text: 'a stray variable', formula: { eq: ['?nobody.agent', 'straker'] } }];
    const errors = buildModel(data).errors;
    assert.ok(errors.includes('r.drugged_guard: exception accomplice named twice'), errors.join('\n'));
    assert.ok(errors.some((e) => e.startsWith('r.drugged_guard: exception x uses ?nobody')), errors.join('\n'));
});

test('the accomplice: raised from ¶218, a reservation that holds back nothing, saved', () => {
    const before = readTo(ACCESS - 1);
    assert.ok(before.knows(DRUGGER));
    assert.deepEqual(before.exceptionsOf(DRUGGER), [], 'not before the story asks who had access to the dish');
    assert.equal(before.raise(DRUGGER, 1, 'accomplice').ok, false);
    const game = readTo(ACCESS);
    assert.deepEqual(game.exceptionsOf(DRUGGER).map((e) => [e.n, e.id, e.para]), [[1, 'accomplice', ACCESS]]);
    // Doubting Holmes's curry step and trusting the police (Simpson drugged the guard and took the horse) does not rule
    // it out: the police's "and so he took the horse" applies the same default to the same events (step 3), so it
    // cannot answer the exception. Nothing the player holds settles it: the default stands, with a reservation.
    game.suspect('k.drugger_chose_the_dish');
    assert.deepEqual(game.raise(DRUGGER, 1, 'accomplice'), { ok: true, status: 'open', used: [] });
    assert.ok(!game.isSuspected(DRUGGER), 'a reservation leaves the card counting');
    assert.deepEqual(game.blockers(), [], 'and holds back no paragraph');
    assert.deepEqual(game.raisedOn(DRUGGER).map((r) => [r.exception, r.status, r.para, r.now]), [['accomplice', 'open', ACCESS, 'open']]);
    const again = new Game(model);
    again.load(game.save());
    assert.deepEqual(again.raisedOn(DRUGGER).map((r) => [r.exception, r.status, r.para]), [['accomplice', 'open', ACCESS]]);
    // The story never settles it.
    while (!game.finished()) game.advance();
    assert.equal(game.raisedOn(DRUGGER)[0].now, 'open');
    assert.ok(game.withdraw(DRUGGER, 1, 'accomplice'));
    assert.equal(game.raisedOn(DRUGGER).length, 0);
});

test('the sound sleepers: an exception with no formula is always a reservation', () => {
    const game = readTo(SLEEPERS);
    assert.ok(game.fileAbsence('r.dog_barks_at_strangers', 'w.tue_stable', 'c.lads_heard_nothing').ok);
    assert.deepEqual(game.propose(game.connectSet('k.dog_knew_the_visitor'), 'who').built, ['k.dog_knew_the_visitor']);
    assert.deepEqual(game.exceptionsOf('k.dog_knew_the_visitor').map((e) => e.id), ['dog_put_out', 'barked_unheard']);
    assert.deepEqual(game.raise('k.dog_knew_the_visitor', 1, 'barked_unheard'), { ok: true, status: 'open', used: [] });
    assert.ok(!game.isSuspected('k.dog_knew_the_visitor'));
});

test('an established exception defeats the card; a contradicted one is refused (a made-up pair on the dog rule)', async () => {
    const changed = await loadCase(base, async (url, as = 'json') => {
        const body = fs.readFileSync(url, 'utf8');
        if (as !== 'json') return body;
        const json = JSON.parse(body);
        const rule = json.rules?.find((r) => r.id === 'r.dog_barks_at_strangers');
        if (rule) rule.unless.push(
            { id: 'same_place', text: '(test) the silence was where the visit was', formula: { same: ['?silence.place', '?visit.place'] } },
            { id: 'elsewhere', text: '(test) the silence was somewhere else', formula: { diff: ['?silence.place', '?visit.place'] } });
        return json;
    });
    assert.deepEqual(changed.errors, []);
    const game = new Game(changed, { difficulty: MEDIUM, options: { background: 'relevant' } });
    while (game.read <= SLEEPERS) game.advance();
    game.fileAbsence('r.dog_barks_at_strangers', 'w.tue_stable', 'c.lads_heard_nothing');
    game.propose(game.connectSet('k.dog_knew_the_visitor'), 'who');
    const K = 'k.dog_knew_the_visitor';
    const no = game.raise(K, 1, 'elsewhere');
    assert.equal(no.status, 'ruled-out');
    assert.ok(no.used.length);
    const yes = game.raise(K, 1, 'same_place');
    assert.equal(yes.status, 'established');
    assert.ok(game.isSuspected(K), 'a defeat: the card counts nowhere');
    assert.ok(game.raisedOn(K).some((r) => r.exception === 'same_place' && r.now === 'established'));
    const again = new Game(changed);
    again.load(game.save());
    assert.ok(again.isSuspected(K) && again.raisedOn(K).some((r) => r.status === 'established'));
    // Trusting the card again withdraws the defeat; withdrawing the defeat trusts it again.
    game.unsuspect(K);
    assert.ok(!game.raisedOn(K).some((r) => r.status === 'established'));
    game.raise(K, 1, 'same_place');
    assert.ok(game.withdraw(K, 1, 'same_place'));
    assert.ok(!game.isSuspected(K));
});

test('a background fact shows its exceptions, each from its own line where it has one (step 2)', () => {
    const DRUG = paraOf('under the influence of some powerful drug');
    const unless = (game, card, rule) => game.info(card).filter((it) => it.kind === 'exception' && it.card === rule).map((it) => [it.text, it.para]);
    const game = new Game(model, { difficulty: MEDIUM, options: { background: 'relevant' } });
    while (game.read <= DRUG - 1) game.advance();
    const rule = game.info('topic_horses').find((it) => it.card === 'r.horse_would_wake_sleepers');
    assert.ok(rule && rule.para < DRUG, 'the fact itself shows early');
    assert.deepEqual(unless(game, 'topic_horses', 'r.horse_would_wake_sleepers'), [], 'its drugged sleepers wait for the drugged lad');
    assert.deepEqual(unless(game, 'stable_dog', 'r.dog_barks_at_strangers'), [], 'and so do the dog\'s');
    game.advance();
    assert.deepEqual(unless(game, 'topic_horses', 'r.horse_would_wake_sleepers'), [['the sleepers were drugged too', DRUG]]);
    assert.deepEqual(unless(game, 'stable_dog', 'r.dog_barks_at_strangers').map(([t]) => t), ['the dog was asleep, drugged, muzzled or shut away', 'the dog did bark and nobody heard']);
    // An exception with no line of its own comes with its fact; the menu waits for the supper (¶20).
    const fact = game.info('topic_reasoning').find((it) => it.card === 'r.asks_about_what_he_read');
    assert.deepEqual(unless(game, 'topic_reasoning', 'r.asks_about_what_he_read'), [['he asked about it for some other reason', fact.para]]);
    assert.deepEqual(unless(game, 'topic_reasoning', 'r.planned_the_dish'), [['he learned the menu from someone in the house', paraOf('his supper, which consisted of a dish of curried')]]);
    assert.deepEqual(unless(game, 'topic_reasoning', 'r.practise_first'), [], 'the sheep wait for the sheep');
});

test("the police's four: verified as their reasoning; a defeated application is never the case's (step 3)", async () => {
    const { activeConstraints, verifyInference } = await import('./caseModel.js');
    for (const k of ['k.police_simpson_drugged', 'k.police_simpson_took_horse', 'k.police_stick_killed', 'k.gregory_gypsies']) {
        assert.equal(model.verified.get(k).status, 'verified', k);
    }
    const defeated = [...model.constraints.values()].filter((k) => k.defeated).map((k) => `${k.id}:${k.defeated}`);
    // And the reader's own one culprit (t4.2, Round 111): two hands acted apart.
    assert.deepEqual(defeated, ['k.police_simpson_drugged#rule1:could_not_see', 'k.police_simpson_took_horse#rule2:to_injure', 'k.police_stick_killed#rule1:his_before', 'k.gregory_gypsies#rule1:gone_anyway', 'k.one_culprit#rule1:two_hands']);
    const everything = new Set(model.cards.keys());
    assert.ok(!activeConstraints(model, everything).some((id) => model.constraints.get(id).defeated), 'the case\'s reading leaves them out');
    assert.ok(activeConstraints(model, everything, new Set()).includes('k.gregory_gypsies#rule1'), 'a player who trusts Gregory holds his step');
    assert.equal(verifyInference(model, model.data.constraints.find((k) => k.id === 'k.hunter_could_not_see')).status, 'verified');
});

test('the gypsies: their going points at nothing, which defeats Gregory\'s step (t62.3)', () => {
    const game = readTo(paraOf('On Tuesday they were gone'));
    const K = 'k.gregory_gypsies';
    assert.ok(game.knows(K) && game.knows('r.gypsies_clear_out') && game.knows('p.gypsies_leave_on_trouble'));
    assert.deepEqual(game.exceptionsOf(K).map((e) => e.id), ['gone_anyway']);
    assert.equal(game.raise(K, 1, 'gone_anyway').status, 'open', 'holding the period belief is not yet using it');
    game.withdraw(K, 1, 'gone_anyway');
    assert.deepEqual(game.propose(game.connectSet('k.gypsies_would_leave_anyway')).built, ['k.gypsies_would_leave_anyway']);
    const res = game.raise(K, 1, 'gone_anyway');
    assert.equal(res.status, 'established');
    assert.ok(res.used.includes('k.gypsies_would_leave_anyway'), res.used.join(', '));
    assert.ok(game.isSuspected(K), 'Gregory\'s step counts nowhere');
    assert.deepEqual(game.blockers(), []);
});

test('Hunter could not have seen it: from Holmes\'s line on the eater, a defeat of the police\'s first step (t36.2)', () => {
    const before = readTo(paraOf('would undoubtedly detect it, and would probably eat no more') - 1);
    assert.ok(!before.knows('p.hunter_saw_the_dosing') && !before.knows('r.saw_drug_would_not_eat'), 'not beside Hunter\'s charge');
    assert.equal(before.raise('k.police_simpson_drugged', 1, 'could_not_see').status, 'open', 'raised early, it is a reservation');
    const game = readTo(paraOf('not barked enough'));
    assert.deepEqual(game.propose(game.connectSet('k.hunter_could_not_see')).built, ['k.hunter_could_not_see']);
    const res = game.raise('k.police_simpson_drugged', 1, 'could_not_see');
    assert.equal(res.status, 'established');
    assert.ok(game.isSuspected('k.police_simpson_drugged'));
    assert.ok(game.restingOnDefeated('k.police_simpson_took_horse'), 'the police\'s next step rests on it');
    assert.ok(!game.isSuspected('c.hunter_blames_stranger'), 'Hunter\'s charge itself is weighed apart (mistaken, as before)');
});

test('a clash sets aside an inference whole, its rule applications with it (step 3)', () => {
    // The police's applications are false in the true story: once their inference is set aside in a clash, they must
    // go with it, and never cost the player a true clue (the gypsies' going, the shattered head, the curry).
    const game = new Game(model, { options: { background: 'start' } });
    while (!game.finished()) game.advance();
    const lost = game.clashes().flatMap((c) => c.claims);
    for (const c of ['c.gypsies_gone', 'c.head_shattered', 'c.cravat_in_left_hand', 'c.curry_for_supper', 'c.stall_empty']) assert.ok(!lost.includes(c), c);
    assert.ok(lost.includes('k.gregory_gypsies') && lost.includes('k.police_stick_killed'));
    const working = new Set(game.workingConstraints());
    assert.ok(!working.has('k.gregory_gypsies#rule1') && !working.has('k.police_stick_killed#rule1'), 'the applications went with them');
});

test('raising an exception scores before Holmes takes the step apart; the checker knows the plays (step 4)', async () => {
    const { checkThoughts } = await import('./thoughts.js');
    const data = JSON.parse(fs.readFileSync(`${base}/thoughts.json`, 'utf8'));
    const bad = { ...data, thoughts: data.thoughts.map((t) => (t.id === 't62.3' ? { ...t, raises: [{ target: 'k.gregory_gypsies', exception: 'accomplice' }, { target: 'k.nothing', exception: 'x' }] } : t)) };
    const errors = checkThoughts(bad, model).errors;
    assert.ok(errors.includes('t62.3: accomplice is not a named exception of a rule k.gregory_gypsies applies'), errors.join('\n'));
    assert.ok(errors.includes('t62.3: raises an exception against k.nothing, which is not in constraints.json'));

    const game = readTo(paraOf('On Tuesday they were gone'));
    assert.deepEqual(game.raiseScore(), { raised: 0, scored: 0, possible: 3, of: 5 });
    game.raise('k.gregory_gypsies', 1, 'gone_anyway');
    const row = game.raiseScores().find((r) => r.thought === 't62.3');
    assert.equal(row.holmes, paraOf('These people always clear out'));
    assert.ok(row.scores, 'a reservation made before Holmes\'s ¶114 scores');
    assert.deepEqual(game.raiseScore(), { raised: 1, scored: 1, possible: 3, of: 5 });
    const again = new Game(model);
    again.load(game.save());
    assert.equal(again.raiseScore().scored, 1, 'the paragraph it was raised at is saved');
    // The accomplice is recorded, and can never score: Holmes never takes it up.
    const late = readTo(ACCESS);
    late.suspect('k.police_simpson_took_horse');
    late.raise(DRUGGER, 1, 'accomplice');
    const acc = late.raiseScores().find((r) => r.thought === 't218.3');
    assert.ok(acc.raised === ACCESS && acc.holmes === null && !acc.scores);
});
