import { test } from 'node:test';
import assert from 'node:assert/strict';
import { timeOrder, coverOf, overlaps, assertions, contradictions, provenance, chainLevel, levelOf, linkKey, givenAt, LEVELS, resolvingLinks, markAssertions, hypothesisChain, hypothesisKey, HYPOTHESIS } from './world.js';

const times = [
    { id: 't1' }, { id: 't2', after: 't1' }, { id: 't3', after: 't2' }, { id: 't4', after: 't3' }, { id: 'tx', after: 't1' },
];
const entities = [
    { id: 'moor', kind: 'place' }, { id: 'stable', kind: 'place', within: 'moor' }, { id: 'stall', kind: 'place', within: 'stable' },
    { id: 'hollow', kind: 'place', within: 'moor' }, { id: 'london', kind: 'place' }, { id: 'cart', kind: 'place' },
    { id: 'horse', kind: 'animal' }, { id: 'man', kind: 'person' }, { id: 'watson', kind: 'person' }, { id: 'box', kind: 'object' },
];
const world = (facts, questions = [], accounts = [{ id: 'acct.w', origin: 'watson', how: 'saw', facts: facts.map((f) => f.id) }]) =>
    ({ entities, moves: ['cart'], times, facts, accounts, questions });
const loc = (id, of, value, time, extra = {}) => ({ id, of, attr: 'location', value, time, para: 1, quote: 'x', ...extra });
const why = (w) => contradictions(w).map((c) => c.why);

test('the time order: certain only along `after`', () => {
    const o = timeOrder(times);
    assert.ok(o.lt('t1', 't3') && o.le('t2', 't2') && !o.lt('t3', 't1'));
    assert.ok(!o.lt('tx', 't3') && !o.lt('t3', 'tx'), 'tx is unordered against t3');
    assert.ok(o.sorted.indexOf('t1') < o.sorted.indexOf('t4'));
});

test('covers: a point, a half-open interval, an open end only at its start, an uncertain time nothing', () => {
    const o = timeOrder(times);
    assert.ok(overlaps(o, coverOf({ at: 't2' }), coverOf({ from: 't1', to: 't3' })));
    assert.ok(!overlaps(o, coverOf({ at: 't3' }), coverOf({ from: 't1', to: 't3' })), 'the end point is not covered');
    assert.ok(!overlaps(o, coverOf({ at: 't3' }), coverOf({ from: 't1' })), 'an open end: a later state is a change');
    assert.ok(overlaps(o, coverOf({ at: 't1' }), coverOf({ from: 't1' })));
    assert.equal(coverOf({ after: 't1', before: 't3' }), null);
    assert.ok(!overlaps(o, coverOf({ at: 'tx' }), coverOf({ from: 't2', to: 't4' })), 'unordered: not certain');
});

test('two places at once, but not a place and one within it', () => {
    assert.deepEqual(why(world([loc('a', 'man', 'stable', { at: 't2' }), loc('b', 'man', 'hollow', { from: 't1', to: 't3' })])), ['man in two places: stable and hollow']);
    assert.deepEqual(why(world([loc('a', 'man', 'stall', { at: 't2' }), loc('b', 'man', 'moor', { at: 't2' })])), []);
    assert.deepEqual(why(world([loc('a', 'man', 'stable', { at: 't2' }), loc('b', 'man', 'hollow', { at: 't3' })])), [], 'different times');
});

test('a denied place contradicts the place and anything within it', () => {
    assert.equal(why(world([loc('a', 'horse', 'stall', { at: 't2' }), loc('b', 'horse', 'stable', { at: 't2' }, { neg: true })])).length, 1);
    assert.deepEqual(why(world([loc('a', 'horse', 'hollow', { at: 't2' }), loc('b', 'horse', 'stable', { at: 't2' }, { neg: true })])), []);
});

test('a thing that moves is placed through its own location, where that is certain', () => {
    const base = [loc('c', 'cart', 'london', { from: 't1', to: 't4' }), loc('a', 'man', 'cart', { at: 't2' })];
    assert.deepEqual(why(world([...base, loc('b', 'man', 'moor', { at: 't2' })])), ['man in two places: london and moor']);
    assert.deepEqual(why(world([loc('a', 'man', 'cart', { at: 't2' }), loc('b', 'man', 'moor', { at: 't2' })])), [], 'the cart unplaced: no contradiction');
    assert.deepEqual(why(world([loc('c', 'box', 'man', { at: 't2' }), loc('m', 'man', 'stable', { at: 't2' }), loc('b', 'box', 'hollow', { at: 't2' })])), ['box in two places: stable and hollow']);
});

test('picks of one question: two possibilities, or one asserted and denied; a modal claim none', () => {
    const questions = [{ id: 'q.who', answer: 'man', possibilities: [{ value: 'man' }, { value: 'horse' }, { value: 'something else' }] }];
    const says = (id, of, asserts, extra = {}) => ({ id, of, attr: 'says', value: 'x', time: { at: 't2' }, para: 2, quote: 'x', asserts, ...extra });
    const w = world([
        says('s1', 'man', [{ q: 'q.who', pick: 'horse' }]),
        { id: 'f1', of: '?', attr: 'action', value: 'x', time: { at: 't1' }, para: 3, quote: 'x', q: 'q.who', pick: 'man' },
        says('s2', 'man', [{ q: 'q.who', pick: 'man', neg: true }]),
        says('s3', 'man', [{ q: 'q.who', pick: 'something else' }], { modal: 'possible' }),
    ], questions);
    assert.deepEqual(why(w).sort(), ['q.who: horse or man', 'q.who: man, asserted and denied']);
    const xs = assertions(w);
    assert.equal(xs.find((x) => x.id === 's1#0').truth, false);
    assert.equal(xs.find((x) => x.id === 's2#0').truth, false);
    assert.equal(xs.find((x) => x.id === 'f1#pick').truth, true);
    assert.equal(xs.find((x) => x.id === 's1').truth, true, 'the saying itself is true');
});

test("a claim's content and a word heard reach Watson through the speaker", () => {
    const facts = [
        { id: 's', of: 'man', attr: 'says', value: 'x', to: 'watson', time: { at: 't2' }, para: 2, quote: 'x' },
        { id: 'c', of: 'horse', attr: 'condition', value: 'lame', time: { at: 't2' }, para: 2, quote: 'x', claim: 's' },
        { id: 'w', of: 'horse', attr: 'condition', value: 'fit', time: { at: 't2' }, para: 2, quote: 'x', word: 'man' },
    ];
    const p = provenance(world(facts, [], [{ id: 'acct.w', origin: 'watson', how: 'saw', facts: ['s'] }]));
    assert.deepEqual(p.factChains('c').map((c) => [c.origin, c.links.map((l) => `${l.from}>${l.to}:${l.how}`)]), [['man', ['man>watson:said']]]);
    assert.deepEqual(p.factChains('w').map((c) => [c.origin, c.links.map((l) => `${l.from}>${l.to}:${l.how}`)]), [['man', ['man>watson:said']]]);
    assert.deepEqual(p.factChains('s').map((c) => c.links.length), [0], 'the saying: Watson heard it');
});

test('trust: a chain is as strong as its weakest link, a fact as its best chain; Watson’s own is certain', () => {
    const told = { links: [{ from: 'edith', to: 'police', how: 'sworn statement', telling: 'f.tell' }, { from: 'police', to: 'watson', how: 'report', telling: 'f.rep' }] };
    const heard = { links: [{ from: 'holmes', to: 'watson', how: 'said' }] };
    assert.equal(LEVELS[chainLevel({ links: [] })], 'certain');
    assert.equal(LEVELS[chainLevel(told)], 'uncertain', 'every link starts uncertain');
    assert.equal(LEVELS[chainLevel(told, { links: { 'f.tell': 2, 'f.rep': 2 } })], 'trusted');
    assert.equal(LEVELS[chainLevel(told, { links: { 'f.tell': 2 } })], 'uncertain', 'the weakest link');
    assert.equal(LEVELS[chainLevel(told, { links: { 'f.tell': 2, 'f.rep': 2 }, people: { edith: 0 } })], 'distrusted', 'a person caps their links');
    assert.equal(linkKey(heard.links[0]), 'said:holmes>watson', 'all of one person’s words to another share a link');
    assert.equal(LEVELS[levelOf([told, heard], { links: { 'f.tell': 0 } })], 'uncertain', 'the best chain');
    assert.equal(levelOf([]), null, 'no chain: not modelled');
    assert.equal(givenAt({ para: 9, basis: 'inferable' }), null);
    assert.equal(givenAt({ para: 9, given_at: 4 }), 4);
});

test('the links whose distrust alone takes a fact off the timeline: those every chain passes through', () => {
    const a = { links: [{ from: 'edith', to: 'police', how: 'statement', telling: 'f.e' }, { from: 'police', to: 'papers', how: 'report', telling: 'f.p' }, { from: 'papers', to: 'watson', how: 'newspaper', telling: 'f.w' }] };
    const b = { links: [{ from: 'edith', to: 'police', how: 'statement', telling: 'f.e' }, { from: 'police', to: 'papers', how: 'report', telling: 'f.p' }, { from: 'papers', to: 'holmes', how: 'newspaper', telling: 'f.h' }, { from: 'holmes', to: 'watson', how: 'told', telling: 'f.t' }] };
    const r = resolvingLinks([a, b]);
    assert.deepEqual(r.links, ['f.e', 'f.p']);
    assert.deepEqual(r.people, ['edith', 'police', 'papers']);
    assert.deepEqual(resolvingLinks([{ links: [] }]).links, [], "Watson's own: nothing takes it off");
    assert.deepEqual(resolvingLinks([a], {}, 0).links, [], 'threshold distrusted: nothing is below it');
});

test("the player's marks: circled asserts, crossed out denies; two circles of one question are no contradiction", () => {
    const questions = [{ id: 'q.who', answer: 'man', possibilities: [{ value: 'man' }, { value: 'horse' }, { value: 'something else' }] }];
    const claim = { id: 's1', of: 'man', attr: 'says', value: 'x', time: { at: 't2' }, para: 2, quote: 'x', asserts: [{ q: 'q.who', pick: 'horse' }] };
    const w = world([claim], questions);
    const marks = { 'q.who': { man: 'circled', horse: 'circled', 'something else': 'crossed', nobody: 'circled' } };
    const ms = markAssertions(w, marks);
    assert.deepEqual(ms.map((x) => [x.pick, x.neg, x.truth]), [['man', false, true], ['horse', false, false], ['something else', true, true]], 'an unknown possibility is ignored');
    assert.ok(ms.every((x) => x.by === HYPOTHESIS && x.fact === null));
    const clash = (acc) => contradictions(w, acc).map((c) => c.why).sort();
    assert.deepEqual(clash([...assertions(w), ...ms]), ['q.who: horse or man'], 'the claim against the circled man; the two circles not');
    assert.deepEqual(clash([...assertions(w), ...markAssertions(w, { 'q.who': { horse: 'crossed' } })]), ['q.who: horse, asserted and denied'], 'crossed out against the claim');
    assert.deepEqual(markAssertions(w, marks, (q, pick) => pick !== 'man').map((x) => x.pick), ['horse', 'something else'], 'only what is shown');
});

test("a mark's chain: one link from Watson's hypothesis, starting uncertain, capped like a person", () => {
    const c = hypothesisChain('q.who', 'man');
    assert.equal(linkKey(c.links[0]), hypothesisKey('q.who', 'man'));
    assert.equal(LEVELS[chainLevel(c)], 'uncertain');
    assert.equal(LEVELS[chainLevel(c, { links: { [hypothesisKey('q.who', 'man')]: 2 } })], 'trusted');
    assert.equal(LEVELS[chainLevel(c, { links: { [hypothesisKey('q.who', 'man')]: 2 }, people: { [HYPOTHESIS]: 0 } })], 'distrusted');
});
