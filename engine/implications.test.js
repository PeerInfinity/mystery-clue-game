import test from 'node:test';
import assert from 'node:assert/strict';
import { derive, verdict, problems, spare, premiseIds, ways } from './implications.js';

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

test('every way to an answer: the smallest sets of statements it follows from', () => {
    assert.deepEqual(ways(IMP, 'q.cart', VALUES['q.cart'], ['cellar']), [['o.note', 'o.out']]);
    assert.deepEqual(ways(IMP, 'q.who', VALUES['q.who'], ['ward']), [['o.note', 'o.out', 'solved:q.cart']]);
    // Two ways (an implication for each, and any one of two premises), and a way by ruling the others out.
    const or = [
        { id: 'i.a', q: 'q.x', from: [{ any: ['o.1', 'o.2'] }, 'o.3'], says: 'a', concludes: 'x' },
        { id: 'i.b', q: 'q.x', from: ['o.4'], says: 'b', concludes: 'x' },
        { id: 'i.c', q: 'q.x', from: ['o.4', 'o.5'], says: 'c', concludes: 'x' },      // contains a smaller way: left out
        { id: 'i.d', q: 'q.x', from: ['o.6'], says: 'd', rules_out: ['y'] },
        { id: 'i.e', q: 'q.x', from: ['o.7'], says: 'e', rules_out: ['z'] },
    ];
    assert.deepEqual(ways(or, 'q.x', ['x', 'y', 'z'], ['x']), [['o.4'], ['o.1', 'o.3'], ['o.2', 'o.3'], ['o.6', 'o.7']]);
    // Every way found is a way (the answer follows from exactly those statements), and no smaller one is.
    for (const w of ways(or, 'q.x', ['x', 'y', 'z'], ['x'])) {
        assert.equal(verdict('q.x', ['x', 'y', 'z'], derive(or, (id) => w.includes(id), () => false)).concluded, 'x');
        for (const out of w) assert.equal(verdict('q.x', ['x', 'y', 'z'], derive(or, (id) => w.includes(id) && id !== out, () => false)).concluded, null);
    }
    assert.deepEqual(ways([or[3]], 'q.x', ['x', 'y', 'z'], ['x']), []);
});

test('what follows as assertions: answers, the states they are, typed statements and statements denied by name', async () => {
    const { derivedAssertions, supportLevel, supportIds } = await import('./implications.js');
    const { contradictions, assertions } = await import('./world.js');
    const data = {
        entities: [{ id: 'town', kind: 'place' }, { id: 'mole', kind: 'place', within: 'town' }, { id: 'inn', kind: 'place', within: 'town' }, { id: 'house', kind: 'place', within: 'town' }, { id: 'watch', kind: 'person' }, { id: 'clerk', kind: 'person' }, { id: 'figure', kind: 'person' }],
        moves: [], times: [{ id: 't1' }, { id: 't2', after: 't1' }, { id: 't3', after: 't2' }],
        accounts: [], narrators: [{ id: 'n' }],
        facts: [
            { id: 'f.seen', of: 'watch', attr: 'location', value: 'mole', time: { from: 't1', to: 't3' }, para: 1 },
            { id: 'f.said', of: 'watch', attr: 'location', value: 'house', time: { from: 't1', to: 't3' }, para: 1, truth: false },
            { id: 'f.rounds', of: 'watch', attr: 'round', value: 'made', time: { from: 't1', to: 't3' }, para: 1, truth: false },
            { id: 'f.ledger', of: 'clerk', attr: 'action', value: 'ships the casks, by the ledger', time: { at: 't2' }, para: 1, truth: false },
            { id: 'f.was_clerk', of: 'figure', attr: 'identity', value: 'watch', time: { at: 't2' }, para: 1, truth: false },
        ],
        questions: [
            { id: 'q.where', entry: { of: 'watch', attr: 'location', time: { from: 't1', to: 't3' } }, possibilities: [{ value: 'mole' }, { value: 'inn' }, { value: 'house' }], answer: 'mole' },
            { id: 'q.fig', entry: { of: 'figure', attr: 'identity', time: { at: 't2' } }, possibilities: [{ value: 'watch' }, { value: 'clerk' }], answer: 'clerk' },
            { id: 'q.text', entry: { of: 'house', attr: 'condition', time: { after: 't1', before: 't3' } }, possibilities: [{ value: 'yes' }, { value: 'no' }], answer: 'no' },
        ],
    };
    const imps = [
        { id: 'i.mole', q: 'q.where', from: ['o.a'], says: 'he was on the mole', concludes: 'mole' },
        { id: 'i.not_house', q: 'q.where', from: ['o.a', 'o.b'], says: 'not at the house', rules_out: ['house'] },
        { id: 'i.not_watch', q: 'q.fig', from: ['i.mole'], says: 'not the watch', rules_out: ['watch'] },
        { id: 'i.no', q: 'q.text', from: ['o.b'], says: 'no round at two, and nothing was shipped', concludes: 'no', asserts: [{ of: 'watch', attr: 'round', value: 'made', neg: true, time: { at: 't2' } }], denies: 'f.ledger' },
    ];
    const values = (q) => q.possibilities.map((p) => p.value);
    const all = derive(imps, () => true, () => true);
    const got = derivedAssertions(data, all, values);
    const byId = new Map(got.map((x) => [x.id, x]));
    assert.equal(byId.get('hyp:q.where=mole').mark, 'circled');
    assert.equal(byId.get('hyp:q.where=mole@state').value, 'mole');
    assert.equal(byId.get('hyp:q.where=house@state').whole, true, 'ruled out over a stretch: not there throughout');
    assert.ok(byId.get('hyp:q.where=inn').neg, 'the others once one is concluded');
    assert.ok(!byId.has('hyp:q.where=inn@state'), 'crossed out only by the conclusion: no state denied');
    assert.deepEqual(byId.get('hyp:q.where=house@state').derived, { any: ['i.not_house'] });
    assert.equal(byId.get('hyp:q.fig=watch@state').attr, 'identity');
    assert.ok(!byId.has('hyp:q.text=no@state'), 'a free-text answer has no typed form');
    assert.equal(byId.get('i.no!f.ledger').denies, 'f.ledger');
    assert.equal(byId.get('r:i:i.no:0').neg, true);
    assert.ok(!derivedAssertions(data, all, values, { states: false }).some((x) => x.id === 'r:i:i.no:0'));
    // Against the story: nothing true is contradicted, and each lie is.
    const told = assertions(data);
    const clash = (xs) => contradictions(data, [...xs, ...got]).filter((c) => got.includes(c.a) || got.includes(c.b)).map((c) => (got.includes(c.a) ? c.b : c.a).id).sort();
    assert.deepEqual(clash(told.filter((x) => x.truth === true)), []);
    assert.deepEqual(clash(told), ['f.ledger', 'f.rounds', 'f.said', 'f.said', 'f.was_clerk']);
    // Trust: an implication as its weakest premise, the better of two ways.
    const lv = { 'o.a': 3, 'o.b': 1 };
    const level = (id) => supportLevel(byId.get(id).derived, all, (o) => lv[o] ?? null, 3);
    assert.equal(level('hyp:q.where=mole'), 3);
    assert.equal(level('hyp:q.where=house'), 3, 'ruled out by the weaker rule, and by the conclusion');
    assert.equal(level('i.no!f.ledger'), 1);
    assert.equal(level('hyp:q.fig=watch'), 3);
    assert.deepEqual(supportIds(byId.get('hyp:q.where=house').derived).sort(), ['i.mole', 'i.not_house']);
    assert.equal(supportLevel('i.mole', all.filter((i) => i.id !== 'i.mole'), () => null, 3), null, 'not holding');
});
