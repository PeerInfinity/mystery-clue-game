// The record against Holmes (workstream 9, docs/ui.md Q1): a row is shown only once the story has read its deadline,
// it names only held cards, and at the end no family scores more than it could.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, EASY, TRIVIAL } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);

function build(game, id) {
    for (const p of game.inferenceById.get(id)?.premises ?? []) if (game.inferenceById.has(p) && !game.knows(p)) build(game, p);
    return game.propose(game.connectSet(id));
}
const buildAll = (g) => { for (let i = 0; i < 3; i++) { const b = g.buildable(); if (!b.length) break; for (const id of b) build(g, id); } };

test('the record shows a row only once its deadline is read, then the lead; at the end every family within its possible', () => {
    const game = new Game(model, { difficulty: EASY, options: { background: 'relevant' } });
    while (game.read <= 40) { game.advance(); buildAll(game); }
    let r = game.record();
    assert.ok(r.rows.length, 'some deadlines passed by ¶40');
    assert.ok(r.rows.every((x) => x.deadline < game.read), 'nothing whose deadline is ahead');
    const time = r.rows.find((x) => x.thought === 't29.3');
    assert.equal(time.scores, true);
    assert.equal(time.lead, time.deadline - time.at);
    assert.ok(!r.rows.some((x) => x.thought === 't37.7'), 'the curry, Holmes\'s at ¶218, is not shown at ¶40');
    assert.equal(r.families.deduction.possible, null, 'no possible during play');
    assert.ok(r.rows.every((x) => x.names.every((id) => game.knows(id))), 'only held cards are named');
    game.readTo(219);
    r = game.record();
    const curry = r.rows.find((x) => x.thought === 't37.7');
    assert.ok(curry.scores && curry.deadline === 218 && curry.lead === 218 - curry.at, 'the curry: made by ¶40, shown at ¶218 with its lead');
    assert.ok(curry.names.length, 'named by its inference cards');
    game.readTo(model.story.paragraphs.length);
    r = game.record();
    assert.equal(r.ahead, r.rows.filter((x) => x.scores).length);
    for (const [f, a] of Object.entries(r.families)) assert.ok(a.scored <= a.possible, `${f}: ${a.scored} of ${a.possible}`);
    assert.equal(r.families.deduction.possible, game.score().possible);
});

test('possible counts every row with a deadline (docs/ui.md Q1): notices 8, checks 10', () => {
    const game = new Game(model, { difficulty: EASY });
    assert.equal(game.noticeScore().possible, 8);
    assert.equal(game.checkScore().possible, 10);
    assert.deepEqual([game.score().possible, game.raiseScore().possible, game.dropScore().possible, game.absenceScore().possible], [47, 3, 3, 1]);
});

test('Trivial: the record scores nothing', () => {
    const game = new Game(model, { difficulty: TRIVIAL });
    game.readTo(120);
    const r = game.record();
    assert.equal(r.ahead, 0);
    assert.ok(r.rows.every((x) => !x.scores));
});

test('an implicit inference neither makes a step nor blocks it: Straker took the horse, made by ¶46 (Round 159)', () => {
    const steps = ['t46.4', 't81.5', 't173.2', 't220.3'];
    const builder = new Game(model, { difficulty: EASY, options: { background: 'relevant' } });
    const passive = new Game(model, { difficulty: EASY, options: { background: 'relevant' } });
    while (builder.read <= 175) { builder.advance(); passive.advance(); buildAll(builder); }
    const made = (g) => Object.fromEntries(g.thoughtScores().filter((r) => steps.includes(r.thought)).map((r) => [r.thought, r.made]));
    assert.ok(steps.every((s) => builder.stepInferences(s).some((x) => builder.howHeld(x)?.how === 'implicit')), 'each needs an implicit inference');
    const b = made(builder);
    assert.ok(b['t46.4'] !== null && b['t46.4'] <= 46, `Straker took the horse: made at ${b['t46.4']}`);
    for (const s of steps) assert.ok(b[s] !== null && b[s] < builder.holmesAt(s), `${s} made before Holmes`);
    assert.deepEqual(Object.values(made(passive)), [null, null, null, null], 'the implicit inferences alone make nothing');
});

test('a reload keeps what the player built, though a character states it later: the sheep still count after it (Round 161)', () => {
    const game = new Game(model, { difficulty: EASY, options: { background: 'relevant' } });
    while (game.read <= 110) { game.advance(); buildAll(game); }
    assert.equal(game.howHeld('k.drugger_took_the_horse')?.how, 'built');
    const again = new Game(model, { state: JSON.parse(JSON.stringify(game.save())) });
    assert.deepEqual([again.howHeld('k.drugger_took_the_horse'), again.unlocked.get('k.drugger_took_the_horse').para], [{ how: 'built' }, game.unlocked.get('k.drugger_took_the_horse').para], 'not "stated by Holmes" at ¶102');
    while (again.read <= 176) { again.advance(); buildAll(again); }
    const sheep = again.thoughtScores().find((r) => r.thought === 't173.2');
    assert.ok(sheep.made !== null && sheep.made < sheep.holmes, `the sheep made at ${sheep.made}`);
});
