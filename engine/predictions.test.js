// Predictions and test plans (docs/predictions.md, workstream 7). The player seals a check before Holmes makes it:
// a template filled with cards they hold, and optionally the result they expect. It is matched quietly against the
// case's checks: nothing says before Holmes's paragraph whether he will make it. A plan scores when he does, whatever
// the story shows of the result; an expectation must not be contradicted; wrong ones cost nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, EASY, TRIVIAL } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);
const DERBY = { eq: ['william_derbyshire.identity', 'straker'] };
const DOG = ['r.dog_barks_at_strangers', 'w.tue_stable', 'c.lads_heard_nothing'];

const fresh = (difficulty = EASY) => new Game(model, { difficulty, options: { background: 'relevant' } });
/** Read until `para` is the last paragraph read. */
const readTo = (game, para) => { while (game.read <= para) game.advance(); return game; };
const row = (game, thought, check) => game.checkScores().find((r) => r.thought === thought && (!check || r.check === check));

test('a check is sealed from cards the player holds, in a template, and never says whether Holmes will make it', () => {
    const game = readTo(fresh(), 80);
    assert.match(game.seal('look', { thing: 'vesta_box' }).reason, /place/);
    assert.match(game.seal('look', { thing: 'vesta_box', place: 'wet_hollow' }).reason, /card you hold/, 'the wet hollow is first named at ¶116');
    assert.match(game.seal('peer', { thing: 'vesta_box' }).reason, /one of/);
    assert.match(game.seal('look', { thing: 'vesta_box', place: 'fatal_hollow' }, { expect: 'yes' }).reason, /expect one of/);
    const res = game.seal('look', { thing: 'vesta_box', place: 'fatal_hollow' }, { expect: 'found' });
    assert.equal(res.ok, true);
    const before = game.sealStatus(res.id);
    assert.equal(before.performed, null);
    assert.equal(before.check, undefined, 'no match is told before Holmes acts');
    readTo(game, 102);
    const after = game.sealStatus(res.id);
    assert.deepEqual([after.performed, after.check, after.result, after.outcome, after.borne], [102, 'ck.mud', 102, 'found', true]);
});

test('the match (t78.5, t92.9): sealed at ¶80 it scores; sealed at ¶102 it is too late', () => {
    const game = readTo(fresh(), 80);
    game.seal('look', { thing: 'tallow_candle', place: 'fatal_hollow' }, { expect: 'found' });
    readTo(game, 103);
    assert.deepEqual([row(game, 't78.5').sealed, row(game, 't78.5').scores, row(game, 't92.9').scores], [80, true, true]);
    const late = readTo(fresh(), 102);
    late.seal('look', { thing: 'vesta_box', place: 'fatal_hollow' }, { expect: 'found' });
    assert.equal(row(late, 't78.5').scores, false);
});

test('an expectation the story does not bear out costs nothing and scores nothing; a withdrawn seal no longer scores', () => {
    const game = readTo(fresh(), 80);
    const wrong = game.seal('look', { thing: 'vesta_box', place: 'fatal_hollow' }, { expect: 'not-found' });
    const plan = game.seal('look', { thing: 'vesta_box', place: 'fatal_hollow' }, { expect: 'found' });
    readTo(game, 90);
    assert.equal(game.unseal(plan.id), true);
    readTo(game, 103);
    assert.equal(game.sealStatus(wrong.id).borne, false);
    assert.equal(row(game, 't78.5').sealed, null);
    assert.equal(game.checkScore().scored, 0);
});

test('the dress (t85.3) and the coat (t92.10)', () => {
    const game = readTo(fresh(), 86);
    game.seal('ask', { person: 'mrs_straker', about: 'c.milliner_bill' });
    game.seal('ask', { person: 'gregory', about: 'c.coat_on_bush_seen' }, { expect: 'yes' });
    readTo(game, 96);
    assert.equal(row(game, 't85.3').scores, true);
    assert.deepEqual([row(game, 't92.10').scores, row(game, 't92.10').borne], [true, true]);
});

test('the tracks (t92.11) sealed early score; the wet hollow at ¶116 (t116.3) has no window', () => {
    const game = readTo(fresh(), 40);
    game.seal('look', { thing: 'silver_blaze', place: 'mapleton' }, { expect: 'found' });
    readTo(game, 116);
    game.seal('look', { thing: 'horseshoe', place: 'wet_hollow' });
    readTo(game, 118);
    assert.deepEqual([row(game, 't92.11').sealed, row(game, 't92.11').scores], [40, true]);
    assert.deepEqual([row(game, 't116.3').sealed, row(game, 't116.3').scores], [40, true], 'the earlier plan is the same check');
    const late = readTo(fresh(), 116);
    late.seal('look', { thing: 'horseshoe', place: 'wet_hollow' });
    assert.equal(row(late, 't116.3').scores, false);
});

test('the photograph (t92.5, t92.12): the plan scores at ¶161; the answer is pending until ¶229, then borne out', () => {
    const game = readTo(fresh(), 92);
    assert.match(game.seal('show', { thing: 'straker', to: 'madame_lesurier' }, { answer: DERBY }).reason, /expected result/);
    const id = game.seal('show', { thing: 'straker', to: 'madame_lesurier' }, { expect: 'yes', answer: DERBY }).id;
    readTo(game, 162);
    assert.deepEqual([row(game, 't92.5').scores, row(game, 't92.12').scores, row(game, 't92.12').borne], [true, true, null]);
    assert.deepEqual([game.sealStatus(id).performed, game.sealStatus(id).result], [161, null]);
    readTo(game, 229);
    assert.deepEqual([row(game, 't92.12').borne, game.sealStatus(id).result, game.sealStatus(id).borne], [true, 229, true]);
});

test('the boots (t101.2) score though the result is never told; the maid (t163.3) is matched and never scored', () => {
    const game = readTo(fresh(), 101);
    const boots = game.seal('compare', { thing: 'simpson_shoe', with: 'fatal_hollow' }, { expect: 'differs' }).id;
    readTo(game, 150);
    const maid = game.seal('ask', { person: 'edith_baxter', about: 'c.curry_for_supper' }).id;
    readTo(game, 170);
    assert.equal(row(game, 't101.2').scores, true);
    assert.deepEqual([game.sealStatus(boots).performed, game.sealStatus(boots).result, game.sealStatus(boots).never], [107, null, false]);
    assert.deepEqual([row(game, 't163.3').sealed, row(game, 't163.3').scores], [150, false]);
    assert.equal(game.sealStatus(maid).check, 'ck.maid');
    while (!game.finished()) game.advance();
    assert.deepEqual([game.sealStatus(boots).never, game.sealStatus(boots).borne], [true, null], 'left open');
});

test('the race (t141.2), a check Holmes never makes, and the aggregate', () => {
    const game = readTo(fresh(), 141);
    game.seal('look', { thing: 'silver_blaze', place: 'c.two_horses_for_cup' }, { expect: 'found' });
    const never = game.seal('ask', { person: 'colonel_ross', about: 'c.simpson_stick' }).id;
    while (!game.finished()) game.advance();
    assert.deepEqual([row(game, 't141.2').scores, row(game, 't141.2').borne], [true, true]);
    assert.equal(game.sealStatus(never).made, false);
    assert.deepEqual(game.checkScore(), { sealed: 1, scored: 1, possible: 10, of: 11 });
});

test('the dog (t29.4, t34.2): filing the absence before Holmes scores', () => {
    const game = readTo(fresh(), 34);
    assert.equal(game.fileAbsence(...DOG).ok, true);
    assert.deepEqual(game.absenceScores(), [{ thought: 't34.2', para: 34, holmes: 180, filed: 34, scores: true }]);
    assert.deepEqual(game.absenceScore(), { filed: 1, scored: 1, possible: 1 });
});

test('nothing scores in Trivial', () => {
    const game = readTo(fresh(TRIVIAL), 80);
    game.seal('look', { thing: 'vesta_box', place: 'fatal_hollow' }, { expect: 'found' });
    readTo(game, 103);
    assert.equal(game.checkScore().scored, 0);
    assert.equal(game.absenceScore().scored, 0);
});

test('sealed checks are saved and loaded', () => {
    const game = readTo(fresh(), 80);
    game.seal('look', { thing: 'vesta_box', place: 'fatal_hollow' }, { expect: 'found' });
    readTo(game, 103);
    const again = new Game(model, { state: JSON.parse(JSON.stringify(game.save())) });
    assert.deepEqual(again.seals, game.seals);
    assert.equal(row(again, 't78.5').scores, true);
});

test('a sealed check may cite a theory: the game says whether the theory gives its expected answer (Q6)', () => {
    const game = readTo(fresh(), 92);
    const mine = game.addTheory('Straker is Derbyshire', { 'william_derbyshire.identity': 'straker', 'e.horse_led_out.agent': 'straker' });
    assert.match(game.seal('show', { thing: 'straker', to: 'madame_lesurier' }, { expect: 'yes', answer: DERBY, theory: 't.nobody' }).reason, /theory you can see/);
    const seal = (theory) => game.seal('show', { thing: 'straker', to: 'madame_lesurier' }, { expect: 'yes', answer: DERBY, theory }).id;
    assert.equal(game.sealTheoryTest(seal(mine)).says, 'says-so');
    // The police keep Mrs. Straker's word that Derbyshire is a friend (it costs their story nothing), so they say
    // otherwise; once the player doubts her, they say nothing. Her own belief says otherwise either way.
    assert.equal(game.sealTheoryTest(seal('t.police')).says, 'says-otherwise');
    assert.equal(game.sealTheoryTest(seal('t.derbyshire_a_friend')).says, 'says-otherwise');
    assert.ok(game.suspect('c.derbyshire_a_friend'));
    assert.equal(game.sealTheoryTest(seal('t.police')).says, 'says-nothing');
    assert.equal(game.sealTheoryTest(game.seal('show', { thing: 'straker', to: 'madame_lesurier' }).id), null, 'no answer, nothing to test');
});
