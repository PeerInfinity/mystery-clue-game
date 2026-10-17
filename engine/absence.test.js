// Absences the player files (workstream 5, docs/noticing-absence.md): never dealt by mention; filed from an
// expectation (a rule held), a time and a witness (a clue held); otherwise dealt at the story's next attestation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, MEDIUM, HARD, TRIVIAL } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);
const paraOf = (q) => model.story.find(q).para;
const LADS = paraOf('They had heard nothing during\n      the night');
const DOG = ['r.dog_barks_at_strangers', 'w.tue_stable', 'c.lads_heard_nothing'];

test('the dog that did nothing: filed from the expectation, the time and the witness, or dealt at the story\'s own line', () => {
    const game = new Game(model, { difficulty: MEDIUM, options: { background: 'relevant' } });
    while (game.read <= LADS) game.advance();
    assert.ok(game.knows('c.lads_heard_nothing') && game.knows('r.dog_barks_at_strangers'));
    assert.ok(!game.knows('c.dog_did_nothing') && !game.knows('e.dog_silent'), 'the lads\' line does not deal the absence');
    assert.deepEqual(game.fileableAbsences().map((a) => a.id).sort(), ['c.dog_did_nothing', 'c.no_alarm']);
    assert.equal(game.fileAbsence('r.dog_barks_at_strangers', 'w.tue_stable', 'c.stall_empty').reason, 'the story does not bear that out');
    assert.equal(game.fileAbsence('r.dog_barks_at_strangers', 'w.mon_2105', 'c.lads_heard_nothing').reason, 'the story does not bear that out');
    assert.match(game.fileAbsence('r.opium_taste', 'w.tue_stable', 'c.lads_heard_nothing').reason, /background fact you hold/);
    assert.ok(!game.knows('c.dog_did_nothing'), 'a wrong filing costs nothing and deals nothing');
    const res = game.fileAbsence(...DOG);
    assert.deepEqual(res, { ok: true, id: 'c.dog_did_nothing' });
    assert.ok(game.knows('e.dog_silent'), 'its event comes with it');
    assert.equal(game.fileAbsence(...DOG).existing, true);
    // The player can now make Holmes's dog deduction long before he does.
    assert.deepEqual(game.propose(game.connectSet('k.dog_knew_the_visitor'), 'who').built, ['k.dog_knew_the_visitor']);
    // Saved and restored.
    const again = new Game(model);
    again.load(game.save());
    assert.ok(again.knows('c.dog_did_nothing') && again.filed.some((f) => f.id === 'c.dog_did_nothing'));
    // Not filed: the story deals it where Gregory says it, and Holmes's step waits for the paragraph after.
    const late = new Game(model, { difficulty: MEDIUM });
    const told = paraOf('The dog did nothing in the night-time.');
    while (late.read <= told - 1) late.advance();
    assert.ok(!late.knows('c.dog_did_nothing'));
    late.advance();
    assert.ok(late.knows('c.dog_did_nothing'));
    assert.ok([...late.story.gates.get(told + 1) ?? []].includes('t34.7'), 'the dog step gates the paragraph after the clue');
});

test('Hard: clicking the lads\' line collects their clue, not the absence; Trivial files it by itself', () => {
    const hard = new Game(model, { difficulty: HARD });
    while (hard.read <= LADS) hard.advance();
    const ids = hard.story.spans[LADS].flatMap((s) => s.ids);
    hard.collect(LADS, ids);
    assert.ok(hard.knows('c.lads_heard_nothing') && !hard.knows('c.dog_did_nothing'));
    const trivial = new Game(model, { difficulty: TRIVIAL });
    while (trivial.read <= LADS) trivial.advance();
    assert.ok(trivial.knows('c.dog_did_nothing') && trivial.knows('c.no_alarm'));
});

test('no alarm was raised: either Straker never got to the stable, or he was not honest (t34.5)', () => {
    const game = new Game(model, { difficulty: MEDIUM, options: { background: 'relevant' } });
    while (game.read <= LADS) game.advance();
    assert.ok(game.knows('r.honest_trainer_alarms'));
    assert.equal(game.fileAbsence('r.honest_trainer_alarms', 'w.mon_2105', 'c.lads_heard_nothing').ok, false, 'not before one o\'clock');
    assert.ok(game.fileAbsence('r.honest_trainer_alarms', 'w.tue_0100', 'c.lads_heard_nothing').ok, 'any time in the night the story has reached');
    assert.ok(game.knows('c.no_alarm') && game.knows('p.alarm_raised_in_night'));
    while (!game.knows('k.entrant_took_the_horse')) game.advance();
    assert.deepEqual(game.propose(game.connectSet('k.straker_raised_no_alarm')).built, ['k.straker_raised_no_alarm']);
});
