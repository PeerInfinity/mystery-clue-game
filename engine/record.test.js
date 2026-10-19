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
