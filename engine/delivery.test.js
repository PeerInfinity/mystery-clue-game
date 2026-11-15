import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng, isOpen, play, choices, fill, fillOnce, placement, heldAfter } from './delivery.js';

// a and b are open from the start (b with the paper held from the start); c is raised in p1; the goal needs p2 and all three.
const logic = {
    questions: [
        { id: 'a', sets: [[]], requires: [] },
        { id: 'b', sets: [['p0']], requires: [] },
        { id: 'c', sets: [['p1']], requires: [] },
        { id: 'goal', sets: [['p2']], requires: ['a', 'b', 'c'] },
    ],
    start: ['p0'], earned: ['p1', 'p2'], goal: 'goal',
};

test('the generator is the same for the same seed', () => {
    const a = rng(7), b = rng(7);
    assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
    assert.notEqual(rng(8)(), rng(7)());
});

test('a question is open with one set of its papers held and what it requires solved', () => {
    const [a, b, , goal] = logic.questions;
    assert.ok(isOpen(a, new Set(), new Set()));
    assert.ok(!isOpen(b, new Set(), new Set()));
    assert.ok(!isOpen(a, new Set(), new Set(['a'])), 'not once solved');
    assert.ok(!isOpen(goal, new Set(['p2']), new Set(['a', 'b'])));
    assert.ok(isOpen(goal, new Set(['p2']), new Set(['a', 'b', 'c'])));
    assert.ok(isOpen({ id: 'x', sets: [['p9'], ['p0']] }, new Set(['p0']), new Set()), 'any one set');
});

test('every placement drawn plays to the end, puts no paper on the goal, and places every earned paper once', () => {
    const seen = new Set();
    for (let seed = 1; seed <= 200; seed++) {
        const place = placement(logic, seed);
        assert.ok(place, `seed ${seed}`);
        assert.ok(play(logic, place).done);
        assert.ok(!place.has('goal'));
        assert.deepEqual([...place.values()].sort(), ['p1', 'p2']);
        seen.add([...place].sort().map((x) => x.join('=')).join(','));
    }
    // p1 on a or b; p2 on the other of them or on c.
    assert.equal(seen.size, 4);
    assert.equal(JSON.stringify([...placement(logic, 5)]), JSON.stringify([...placement(logic, 5)]), 'a seed gives one placement');
});

test('a draw that strands a paper fails and is made again', () => {
    // Only a is open at first; b needs p1. If p2 goes on a, b can never open and p1 has nowhere to go.
    const narrow = { questions: [{ id: 'a', sets: [[]] }, { id: 'b', sets: [['p1']] }, { id: 'goal', sets: [['p2']], requires: ['a', 'b'] }], start: [], earned: ['p1', 'p2'], goal: 'goal' };
    let failed = 0;
    for (let seed = 1; seed <= 50; seed++) if (!fillOnce(narrow, rng(seed))) failed++;
    assert.ok(failed > 0);
    for (let seed = 1; seed <= 50; seed++) assert.deepEqual([...fill(narrow, rng(seed)).place], [['a', 'p1'], ['b', 'p2']]);
});

test('one question at a time: how many were open at each step, and what is held after', () => {
    const place = new Map([['a', 'p1'], ['c', 'p2']]);
    const r = choices(logic, place, null, (open) => open[0]);
    assert.deepEqual(r.order, ['a', 'b', 'c', 'goal']);
    assert.deepEqual(r.counts, [2, 2, 1, 1]);
    assert.ok(r.done);
    assert.deepEqual([...heldAfter(logic, place, new Set(['a']))].sort(), ['p0', 'p1']);
});
