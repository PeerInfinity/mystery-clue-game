import test from 'node:test';
import assert from 'node:assert/strict';
import { derive, verdict, problems, spare, premiseIds } from './implications.js';

const OBS = [
    { id: 'o.out', q: 'q.cart', says: 'the cart went out by the town gate' },
    { id: 'o.inside', q: 'q.cart', says: 'the berths lie inside the quay gate' },
    { id: 'o.note', q: 'q.cart', says: 'he writes of casks going to his cellar' },
    { id: 'o.limp', q: 'q.who', says: 'he could not have carried it', against: ['tanner'] },
    { id: 'o.cart', q: 'q.who', says: 'the casks went to the cellar' },
];
const IMP = [
    { id: 'i.not_ship', q: 'q.cart', from: ['o.out', 'o.inside'], says: 'the cart was not going to a vessel', rules_out: ['berths'] },
    { id: 'i.cellar', q: 'q.cart', from: ['o.out', 'o.note'], says: 'the casks went to the cellar', concludes: 'cellar' },
    { id: 'i.deeper', q: 'q.who', from: ['i.cellar', { solved: 'q.cart' }], says: 'so the merchant had them', concludes: 'ward' },
];
const VALUES = { 'q.cart': ['something else', 'cellar', 'berths'], 'q.who': ['something else', 'ward', 'tanner'] };
const shown = (...ids) => (id) => ids.includes(id);

test('an implication holds when all its premises are shown, and what follows from it after it', () => {
    assert.deepEqual(derive(IMP, shown('o.out'), () => false), []);
    assert.deepEqual(derive(IMP, shown('o.out', 'o.inside'), () => false).map((i) => i.id), ['i.not_ship']);
    assert.deepEqual(derive(IMP, shown('o.out', 'o.note'), () => false).map((i) => i.id), ['i.cellar']);
    assert.deepEqual(derive(IMP, shown('o.out', 'o.note'), (q) => q === 'q.cart').map((i) => i.id), ['i.cellar', 'i.deeper']);
    assert.deepEqual(premiseIds(IMP[2], () => true), ['i.cellar', 'solved:q.cart']);
    const any = [{ id: 'i.a', q: 'q.cart', from: [{ any: ['o.out', 'o.note'] }], says: 'x' }];
    assert.equal(derive(any, shown('o.note'), () => false).length, 1);
    assert.equal(derive(any, shown('o.inside'), () => false).length, 0);
});

test('an answer is known by an implication that concludes it, or as the one answer left', () => {
    const v = (q, ids, solved = () => false) => verdict(q, VALUES[q], derive(IMP, shown(...ids), solved));
    // Ruled out, and nothing concluded: the question stays open.
    let r = v('q.cart', ['o.out', 'o.inside']);
    assert.deepEqual([[...r.ruled], r.concluded], [['berths'], null]);
    // Concluded without the piece that rules the other answer out: every other answer is crossed out with it.
    r = v('q.cart', ['o.out', 'o.note']);
    assert.deepEqual([r.concluded, r.by, [...r.ruled].sort()], ['cellar', 'implication', ['berths', 'something else']]);
    // An observation's own `against` is a label and rules nothing out; the one answer left is concluded only when
    // every other is ruled out ("something else" too).
    r = v('q.who', ['o.limp']);
    assert.deepEqual([[...r.ruled], r.concluded], [[], null]);
    const out = (vs) => [{ id: 'i.x', q: 'q.x', from: ['o'], says: 's', rules_out: vs }];
    let two = verdict('q.x', ['something else', 'a', 'b'], out(['a']));
    assert.deepEqual([two.concluded, two.by], [null, null]);
    two = verdict('q.x', ['something else', 'a', 'b'], out(['a', 'something else']));
    assert.deepEqual([two.concluded, two.by], ['b', 'elimination']);
});

test('the checks: references, right and wrong answers, and an answer that never follows', () => {
    const qs = [{ id: 'q.cart' }, { id: 'q.who' }];
    const right = (q) => (q === 'q.cart' ? ['cellar'] : ['ward']), values = (q) => VALUES[q];
    assert.deepEqual(problems(IMP, OBS, qs, right, values), []);
    const bad = [...IMP, { id: 'i.bad', q: 'q.cart', from: ['o.nowhere'], says: 'x', rules_out: ['cellar'] }, { id: 'i.loop', q: 'q.who', from: ['i.loop'], says: 'y', concludes: 'tanner' }];
    const errs = problems(bad, OBS, qs, right, values).join('\n');
    assert.match(errs, /i\.bad: no statement o\.nowhere/);
    assert.match(errs, /i\.bad: rules out cellar, a right answer/);
    assert.match(errs, /i\.loop: concludes tanner, not a right answer/);
    assert.match(errs, /i\.loop: never holds/);
    assert.match(problems([IMP[0]], OBS, qs, right, values).join('\n'), /q\.cart: with everything shown, no answer follows/);
});

test('the observations an answer can do without', () => {
    assert.deepEqual(spare(IMP, OBS, 'q.cart', VALUES['q.cart']), { needed: ['o.out', 'o.note'], spare: ['o.inside'] });
});
