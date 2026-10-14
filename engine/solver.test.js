import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Problem } from './solver.js';
import { evaluate } from './logic.js';

const timeOrder = new Map([['w1', 0], ['w2', 1], ['w3', 2]]);

function problem() {
    const people = ['ann', 'bob', 'cat'];
    return new Problem({
        domains: new Map([
            ['drugger', people],
            ['visitor', people],
            ['drug_time', ['w1', 'w2', 'w3']],
            ['visit_time', ['w1', 'w2', 'w3']],
        ]),
        constraints: [
            { id: 'k.household', formula: { in: ['drugger', ['ann', 'bob']] } },
            { id: 'k.dog', formula: { ne: ['visitor', 'cat'] } },
            { id: 'k.same', formula: { same: ['drugger', 'visitor'] } },
            { id: 'k.alibi', formula: { implies: [{ eq: ['visit_time', 'w3'] }, { ne: ['visitor', 'ann'] }] } },
            { id: 'k.late', formula: { eq: ['visit_time', 'w3'] } },
            { id: 'k.order', formula: { before: ['drug_time', 'visit_time'] } },
        ],
        timeOrder,
    });
}

test('three-valued evaluation leaves unassigned slots undecided', () => {
    assert.equal(evaluate({ eq: ['a', 'x'] }, {}, timeOrder), undefined);
    assert.equal(evaluate({ or: [{ eq: ['a', 'x'] }, { true: true }] }, {}, timeOrder), true);
    assert.equal(evaluate({ implies: [{ eq: ['a', 'x'] }, { false: true }] }, { a: 'y' }, timeOrder), true);
    assert.equal(evaluate({ before: ['t', { lit: 'w2' }] }, { t: 'w1' }, timeOrder), true);
});

test('candidates shrink as constraints become active', () => {
    const p = problem();
    assert.deepEqual(p.candidates([], 'drugger'), ['ann', 'bob', 'cat']);
    assert.deepEqual(p.candidates(['k.household'], 'drugger'), ['ann', 'bob']);
    assert.deepEqual(p.candidates(['k.household', 'k.same', 'k.alibi', 'k.late'], 'drugger'), ['bob']);
});

test('elimination is checked against any sufficient set of constraints (several routes)', () => {
    const p = problem();
    // Route 1: the household argument alone rules cat out as drugger.
    assert.equal(p.consistent(['k.household'], { drugger: 'cat' }).ok, false);
    // Route 2: the dog argument plus "same person" also rules cat out.
    assert.equal(p.consistent(['k.dog', 'k.same'], { drugger: 'cat' }).ok, false);
    // Not enough: the dog argument alone says nothing about the drugger.
    assert.equal(p.consistent(['k.dog'], { drugger: 'cat' }).ok, true);
});

test('extra formulas let a conclusion be checked by refuting its negation', () => {
    const p = problem();
    const conclusion = { eq: ['drugger', 'bob'] };
    const all = [...p.constraints.keys()];
    assert.equal(p.consistent(all, {}, { extra: [{ not: conclusion }] }).ok, false);
    assert.equal(p.consistent(['k.household'], {}, { extra: [{ not: conclusion }] }).ok, true);
});

test('uniqueness and time ordering', () => {
    const p = problem();
    const all = [...p.constraints.keys()];
    assert.deepEqual(p.candidates(all, 'visit_time'), ['w3']);
    assert.deepEqual(p.candidates(all, 'drug_time'), ['w1', 'w2']);
    assert.equal(p.countSolutions(all, 5), 2);
});

test('a theory that fits some clues fails on others, with a minimal explanation', () => {
    const p = problem();
    const theory = { drugger: 'ann', visitor: 'ann' };
    assert.equal(p.consistent(['k.household', 'k.same', 'k.dog'], theory).ok, true);
    const all = [...p.constraints.keys()];
    assert.deepEqual(p.explainConflict(all, theory).sort(), ['k.alibi', 'k.late']);
    assert.equal(p.explainConflict(['k.household'], theory), null);
});

test('steps replays a clash as a chain that ends with a question left empty', () => {
    const p = new Problem({
        domains: new Map([['a', ['x', 'y']], ['b', ['x', 'y']]]),
        constraints: [{ id: 'k1', formula: { eq: ['a', 'x'] } }, { id: 'k2', formula: { same: ['a', 'b'] } }, { id: 'k3', formula: { ne: ['b', 'x'] } }],
        timeOrder: new Map(),
    });
    const r = p.steps(['k1', 'k2', 'k3']);
    assert.equal(r.contradiction, true);
    assert.deepEqual(r.steps.map((s) => s.id), ['k1', 'k2', 'k3']);
    assert.deepEqual(r.steps[1].changes, [{ slot: 'b', before: ['x', 'y'], after: ['x'] }]);
    assert.deepEqual(r.steps[2].changes[0].after, []);
});
