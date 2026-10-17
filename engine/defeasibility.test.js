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
    // Doubting Holmes's curry step and trusting the police, Simpson drugged the guard and took the horse: that rules
    // the accomplice out.
    game.suspect('k.drugger_chose_the_dish');
    const ruled = game.raise(DRUGGER, 1, 'accomplice');
    assert.equal(ruled.status, 'ruled-out');
    assert.ok(ruled.used.includes('k.police_simpson_took_horse#trusted'), ruled.used.join(', '));
    assert.equal(game.raisedOn(DRUGGER).length, 0, 'a ruled-out exception is not recorded');
    // Doubting the police's account, nothing the player holds settles it: the default stands, with a reservation.
    game.suspect('k.police_simpson_took_horse');
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
