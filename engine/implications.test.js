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
    const { derivedAssertions, strength, supportIds } = await import('./implications.js');
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
    // Strength: as the weakest premise, by the better of two ways; a likely rule gives likely at most.
    const lv = { 'o.a': 4, 'o.b': 3 };
    const level = (id) => strength(byId.get(id).derived, all, (o) => lv[o] ?? null);
    assert.equal(level('hyp:q.where=mole'), 4);
    assert.equal(level('hyp:q.where=house'), 4, 'ruled out by the weaker rule, and by the conclusion');
    assert.equal(level('i.no!f.ledger'), 3);
    assert.equal(level('hyp:q.fig=watch'), 4);
    assert.deepEqual(supportIds(byId.get('hyp:q.where=house').derived).sort(), ['i.mole', 'i.not_house']);
    assert.equal(strength('i.mole', all.filter((i) => i.id !== 'i.mole'), () => null), null, 'not holding');
    assert.equal(strength('i.mole', all.map((i) => (i.id === 'i.mole' ? { ...i, strength: 'likely' } : i)), () => 4), 3, 'a likely rule over confirmed statements');
    // The assertions carry it: a statement held only as likely gives what is likely, and no more.
    const weak = new Map(derivedAssertions(data, all, values, { level: (o) => lv[o] }).map((x) => [x.id, x]));
    assert.equal(weak.get('i.no!f.ledger').level, 3);
    assert.ok(weak.get('i.no!f.ledger').likely && !weak.get('hyp:q.where=mole').likely);
});

test("the rules nobody writes: an answer's typed form against what one observation comes from", async () => {
    const { tableRules, withTable } = await import('./implications.js');
    const { setCaseActions } = await import('./actions.js');
    const { timeOrder } = await import('./world.js');
    setCaseActions({ actions: [{ id: 'force', label: 'forcing', requires: [], effects: [{ of: '$thing', attr: 'condition', value: 'mark' }] }] });
    const times = [{ id: 't1' }, { id: 't2', after: 't1' }, { id: 't3', after: 't2' }, { id: 't4', after: 't3' }];
    const win = { from: 't1', to: 't3' };
    const data = {
        entities: [{ id: 'door', kind: 'object' }, { id: 'inn', kind: 'place' }, { id: 'house', kind: 'place' }, { id: 'ann', kind: 'person' }, { id: 'bob', kind: 'person' }],
        moves: [], joins: {}, times, order: timeOrder(times), accounts: [], narrators: [{ id: 'n' }],
        facts: [
            { id: 'f.unmarked', of: 'door', attr: 'condition', value: 'mark', neg: true, time: { at: 't4' }, para: 1 },
            { id: 'f.fast1', of: 'door', attr: 'door', value: 'locked', time: { at: 't1' }, para: 1 },
            { id: 'f.fast2', of: 'door', attr: 'door', value: 'locked', time: { at: 't2' }, para: 1 },
            { id: 'f.ann_inn', of: 'ann', attr: 'location', value: 'inn', time: win, para: 1 },
            { id: 'f.lie', of: 'bob', attr: 'location', value: 'inn', time: win, para: 1, truth: false },
        ],
        questions: [
            { id: 'q.how', entry: { of: 'door', attr: 'condition', time: { after: 't1', before: 't3' } }, answer: 'with a key', possibilities: [
                { value: 'with a key', action: { of: '?', act: ['unlock'], thing: 'door', time: win } },
                { value: 'by force', action: { of: '?', act: ['force'], thing: 'door', time: win } },
                { value: 'left open', asserts: [{ of: 'door', attr: 'door', value: 'locked', neg: true, time: win }] }] },
            { id: 'q.who', entry: { of: '?', attr: 'action', act: ['take'], item: 'door', where: 'house', time: win }, answer: 'bob', possibilities: [{ value: 'ann' }, { value: 'bob' }] },
        ],
    };
    const obs = [
        { id: 'o.unmarked', q: 'q.how', from: ['f.unmarked'], says: 'the door is not marked' },
        { id: 'o.fast', q: 'q.how', from: [{ any: ['f.fast1', 'f.fast2'] }], says: 'the door was found fast' },
        { id: 'o.ann', q: 'q.who', from: ['f.ann_inn'], says: 'Ann was at the inn' },
        { id: 'o.bob', q: 'q.who', from: ['f.lie'], says: 'Bob says he was at the inn' },
        { id: 'o.solved', q: 'q.who', from: [{ solved: 'q.how' }], says: 'with a key' },
    ];
    const rules = tableRules(data, obs);
    assert.deepEqual(rules.map((r) => [r.from[0], r.rules_out[0]]), [['o.unmarked', 'by force'], ['o.fast', 'left open'], ['o.ann', 'ann']], 'what the act leaves, a typed state, an alibi; never from a lie, never the right answer');
    assert.ok(rules.every((r) => r.table && r.q && r.says));
    const hand = [{ id: 'i.x', q: 'q.who', from: ['o.ann'], says: 'not Ann', rules_out: ['ann'] }];
    assert.deepEqual(withTable(hand, data, obs).map((r) => r.id), ['i.x', 't.unmarked.1', 't.fast.2'], 'a rule written by hand for the same is kept, and not doubled');
    setCaseActions({});
});

test('strength: what follows is as strong as its weakest step, by the best way to it', async () => {
    const { certain, derivedAssertions } = await import('./implications.js');
    const imps = [
        { id: 'i.a', q: 'q', from: ['o.1'], says: 'a', rules_out: ['x'], strength: 'likely' },
        { id: 'i.b', q: 'q', from: ['o.2'], says: 'b', rules_out: ['x'] },
        { id: 'i.c', q: 'q', from: ['i.a'], says: 'c', rules_out: ['y'] },
        { id: 'i.d', q: 'q', from: [{ any: ['i.a', 'o.3'] }], says: 'd', concludes: 'z' },
    ];
    const run = (shown) => { const has = (id) => shown.includes(id); const d = derive(imps, has, () => false); return { d, has }; };
    let { d, has } = run(['o.1']);
    assert.equal(certain('i.a', d, has), false);
    assert.equal(certain('i.c', d, has), false, 'it rests on a likely step');
    assert.equal(certain('i.d', d, has), false, 'the one way that holds is likely');
    ({ d, has } = run(['o.1', 'o.2', 'o.3']));
    assert.equal(certain({ any: ['i.a', 'i.b'] }, d, has), true, 'another way is certain');
    assert.equal(certain('i.d', d, has), true, 'by the other premise');
    const data = { entities: [], questions: [{ id: 'q', entry: {}, answer: 'z', possibilities: [{ value: 'x' }, { value: 'y' }, { value: 'z' }] }] };
    ({ d, has } = run(['o.1']));
    const got = Object.fromEntries(derivedAssertions(data, d, (q) => q.possibilities.map((p) => p.value), { shown: has }).map((x) => [x.pick, !!x.likely]));
    assert.deepEqual(got, { z: true, x: true, y: true });
});

test('suspectGrid: each suspect against what the act needs, from what is shown; a motive is a goal the act brings about', async () => {
    const { suspectGrid } = await import('./implications.js');
    const { setCaseActions } = await import('./actions.js');
    setCaseActions({ actions: [{ id: 'take_locked', label: 'taking', requires: [{ of: '$agent', place: '$where' }, { of: '$agent', key: '$via' }], effects: [{ of: '$agent', attr: 'carrying', value: '$item' }] }] });
    const data = {
        entities: [{ id: 'a', kind: 'person' }, { id: 'b', kind: 'person' }, { id: 'room', kind: 'place' }, { id: 'kitchen', kind: 'place' }, { id: 'bag', kind: 'object' }, { id: 'door', kind: 'object' }],
        times: [{ id: 't1' }, { id: 't2', after: 't1' }, { id: 't3', after: 't2' }],
        accounts: [],
        facts: [
            { id: 'f.a_kitchen', of: 'a', attr: 'location', value: 'kitchen', time: { from: 't1', to: 't3' } },
            { id: 'f.a_room', of: 'a', attr: 'location', value: 'room', time: { at: 't2' } },
            { id: 'f.b_room', of: 'b', attr: 'location', value: 'room', time: { at: 't2' } },
            { id: 'f.b_key', of: 'b', attr: 'carrying', value: 'key', key: 'door', time: { at: 't2' } },
            { id: 'f.b_wants', of: 'b', attr: 'intends', value: 'to have the bag', goal: { of: 'b', attr: 'carrying', value: 'bag' }, time: { from: 't1' } },
        ],
        questions: [{ id: 'q', entry: { of: '?', attr: 'action', act: 'take_locked', item: 'bag', where: 'room', via: 'door', time: { from: 't1', to: 't3' } }, answer: 'b', possibilities: [{ value: 'a' }, { value: 'b' }] }],
    };
    const q = data.questions[0];
    const cells = (shown) => Object.fromEntries(suspectGrid(data, q, ['a', 'b'], shown).map((r) => [r.pick, ['opportunity', 'means', 'motive'].map((k) => r[k].map((c) => `${c.status}:${c.facts}`).join(',')).join('|')]));
    assert.deepEqual(cells([]), { a: '||', b: '||' });                                   // nothing shown, nothing named
    assert.equal(cells(['f.a_room']).a, 'met:f.a_room||');                               // a sighting at the place
    assert.equal(cells(['f.a_room', 'f.a_kitchen']).a, 'against:f.a_kitchen||');         // elsewhere the whole window: against
    assert.equal(cells(['f.b_room', 'f.b_key', 'f.b_wants']).b, 'met:f.b_room|met:f.b_key|met:f.b_wants');
    assert.equal(suspectGrid(data, { ...q, entry: { of: '?', attr: 'action' } }, ['a', 'b'], []), null);   // no typed act: no grid
    // Gain and loss: what the thing made gives a person is a motive; what it revokes that gave another is one against.
    const wills = { ...data, entities: [...data.entities, { id: 'old', kind: 'document' }, { id: 'new', kind: 'document' }], facts: [
        { id: 'f.old', of: 'old', attr: 'condition', value: 'leaves the room to a', gives: [{ to: 'a', what: 'room' }], time: { from: 't1' } },
        { id: 'f.new', of: 'new', attr: 'condition', value: 'revokes the old and leaves all to b', gives: [{ to: 'b', what: 'all', all: true }], revokes: 'old', time: { at: 't3' } },
    ], questions: [{ id: 'q', entry: { of: '?', attr: 'action', act: 'make', item: 'new', time: { before: 't3' } }, possibilities: [{ value: 'a' }, { value: 'b' }] }] };
    const motive = (shown) => Object.fromEntries(suspectGrid(wills, wills.questions[0], ['a', 'b'], shown, (id) => id.toUpperCase()).map((r) => [r.pick, r.motive.map((c) => `${c.status}:${c.says}:${c.facts}`).join(',')]));
    assert.deepEqual(motive(['f.old']), { a: '', b: '' });                                // the old will alone says nothing of the new
    assert.deepEqual(motive(['f.new']), { a: '', b: 'met:gains all:f.new' });
    assert.deepEqual(motive(['f.old', 'f.new']), { a: 'against:loses ROOM:f.old,f.new', b: 'met:gains all:f.new' });
    // A tie: for a person the act helps, or against one it harms, is a motive; the other way about is one against.
    const ties = { ...data, facts: [{ id: 'f.a_for', of: 'a', attr: 'role', value: 'to marry b', tie: { to: 'b', kind: 'for' }, time: { from: 't1' } }], questions: [{ id: 'q', entry: { of: '?', attr: 'action', time: { at: 't2' } }, possibilities: [{ value: 'a', action: { of: 'a', act: 'make', item: 'bag', helps: 'b' } }, { value: 'b' }] }] };
    const tied = (action) => suspectGrid({ ...ties, questions: [{ ...ties.questions[0], possibilities: [{ value: 'a', action }, { value: 'b' }] }] }, { ...ties.questions[0], possibilities: [{ value: 'a', action }, { value: 'b' }] }, ['a', 'b'], ['f.a_for'], (id) => id.toUpperCase()).find((r) => r.pick === 'a').motive.map((c) => `${c.status}:${c.says}`).join();
    assert.equal(tied({ of: 'a', act: 'make', item: 'bag', helps: 'b' }), 'met:for B, whom it helps');
    assert.equal(tied({ of: 'a', act: 'make', item: 'bag', harms: 'b' }), 'against:for B, whom it harms');
    setCaseActions({});
});
