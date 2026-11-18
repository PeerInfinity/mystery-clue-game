import { test } from 'node:test';
import assert from 'node:assert/strict';
import { timeOrder, coverOf, overlaps, assertions, contradictions, alibis, provenance, chainLevel, levelOf, linkKey, givenAt, LEVELS, resolvingLinks, markAssertions, hypothesisChain, hypothesisKey, HYPOTHESIS, answerKinds, entityKinds, isOption, WHO, WHERE, isRight, compatible, narrationLink } from './world.js';

const times = [
    { id: 't1' }, { id: 't2', after: 't1' }, { id: 't3', after: 't2' }, { id: 't4', after: 't3' }, { id: 'tx', after: 't1' },
];
const entities = [
    { id: 'moor', kind: 'place' }, { id: 'stable', kind: 'place', within: 'moor' }, { id: 'stall', kind: 'place', within: 'stable' },
    { id: 'hollow', kind: 'place', within: 'moor' }, { id: 'london', kind: 'place' }, { id: 'cart', kind: 'place' },
    { id: 'horse', kind: 'animal' }, { id: 'man', kind: 'person' }, { id: 'watson', kind: 'person' }, { id: 'box', kind: 'object' },
];
const world = (facts, questions = [], accounts = [{ id: 'acct.w', origin: 'watson', how: 'saw', facts: facts.map((f) => f.id) }]) =>
    ({ entities, moves: ['cart'], times, facts, accounts, questions, narrators: [{ id: 'watson', name: 'Watson' }] });
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

test("a claim's content and a word heard reach the reader through the speaker and the narrator", () => {
    const facts = [
        { id: 's', of: 'man', attr: 'says', value: 'x', to: 'watson', time: { at: 't2' }, para: 2, quote: 'x' },
        { id: 'c', of: 'horse', attr: 'condition', value: 'lame', time: { at: 't2' }, para: 2, quote: 'x', claim: 's' },
        { id: 'w', of: 'horse', attr: 'condition', value: 'fit', time: { at: 't2' }, para: 2, quote: 'x', word: 'man' },
    ];
    const p = provenance(world(facts, [], [{ id: 'acct.w', origin: 'watson', how: 'saw', facts: ['s'] }]));
    assert.deepEqual(p.factChains('c').map((c) => [c.origin, c.links.map((l) => `${l.from}>${l.to}:${l.how}`)]), [['man', ['man>man:statement', 'man>watson:said', 'watson>reader:narrates']]]);
    assert.deepEqual(p.factChains('w').map((c) => [c.origin, c.links.map((l) => `${l.from}>${l.to}:${l.how}`)]), [['man', ['man>man:statement', 'man>watson:said', 'watson>reader:narrates']]]);
    assert.deepEqual(p.factChains('s').map((c) => c.links.map(linkKey)), [['narrates:watson']], 'the saying: Watson heard it, and narrates it');
    assert.equal(linkKey(p.factChains('c')[0].links[0]), 'stmt:c', 'a fact of a claim\'s content: its own statement link');
    assert.equal(linkKey(p.claimChains('s')[0].links[0]), 'stmt:s', 'what the claim itself asserts');
    assert.equal(linkKey(p.factChains('w')[0].links[0]), 'stmt:w');
});

test('every chain ends at the reader through a narrator, whose trust the case sets and the player may change', () => {
    const facts = [
        loc('own', 'horse', 'moor', { at: 't1' }),
        { id: 'told', of: 'man', attr: 'carrying', value: 'box', time: { at: 't1' }, para: 1, quote: 'x' },
        { id: 'f.t', of: 'man', attr: 'tells', value: 'acct.m', to: 'watson', how: 'told', time: { at: 't2' }, para: 2, quote: 'x' },
    ];
    const accounts = [{ id: 'acct.w', origin: 'watson', how: 'saw', facts: ['own'] }, { id: 'acct.m', origin: 'man', how: 'saw', facts: ['told'] }];
    const p = provenance(world(facts, [], accounts));
    const own = p.factChains('own');
    assert.deepEqual(own.map((c) => c.links.map(linkKey)), [['narrates:watson']], 'a narrator’s own observation: only the narration, no statement link');
    assert.equal(LEVELS[levelOf(own)], 'certain');
    assert.equal(LEVELS[levelOf(own, { links: { 'narrates:watson': 1 } })], 'uncertain', 'the player may doubt the narrator');
    assert.equal(LEVELS[levelOf(own, { people: { watson: 0 } })], 'certain', 'a person’s cap is not on the narration');
    assert.deepEqual(p.factChains('told')[0].links.map(linkKey), ['stmt:told', 'f.t', 'narrates:watson']);
    assert.deepEqual(resolvingLinks(own, {}, 1), { links: [], people: [] }, 'the narration is never a resolving link');
    const doubted = provenance({ ...world(facts, [], accounts), narrators: [{ id: 'watson', trust: 'trusted' }] });
    assert.equal(LEVELS[levelOf(doubted.factChains('own'))], 'trusted', 'the case sets a narrator’s trust');
    const two = provenance({ ...world(facts, [], [{ id: 'acct.w', origin: 'watson', how: 'saw', facts: ['own'] }, { id: 'acct.m', origin: 'man', how: 'saw', facts: ['told'] }]), narrators: [{ id: 'watson' }, { id: 'man' }] });
    assert.deepEqual(two.factChains('told').map((c) => c.links.map(linkKey)), [['stmt:told', 'f.t', 'narrates:watson'], ['narrates:man']], 'two narrators: one chain through each');
    assert.throws(() => provenance({ ...world(facts), narrators: [] }), /narrators/);
});

test('one statement can be distrusted without the rest of what came along the same links', () => {
    const facts = [
        { id: 'lie', of: 'man', attr: 'says', value: 'lost', to: 'maid', time: { at: 't2' }, para: 2, quote: 'x' },
        { id: 'ask', of: 'man', attr: 'says', value: 'take this', to: 'maid', time: { at: 't2' }, para: 2, quote: 'x' },
        { id: 'saw', of: 'man', attr: 'carrying', value: 'paper', time: { at: 't2' }, para: 2, quote: 'x' },
    ];
    const tells = [{ id: 'f.t', of: 'maid', attr: 'tells', value: 'acct.m', to: 'watson', how: 'told', time: { at: 't2' }, para: 2, quote: 'x' }];
    const p = provenance(world([...facts, ...tells], [], [{ id: 'acct.m', origin: 'maid', how: 'saw', facts: ['lie', 'ask', 'saw'] }]));
    const trust = { links: { 'stmt:lie': 0 } };
    assert.equal(LEVELS[levelOf(p.claimChains('lie'), trust)], 'distrusted', 'what the lie asserts');
    assert.equal(LEVELS[levelOf(p.claimChains('ask'), trust)], 'uncertain', 'his other words to her stand');
    assert.equal(LEVELS[levelOf(p.factChains('lie'), trust)], 'uncertain', 'that he said it stands');
    assert.equal(LEVELS[levelOf(p.factChains('saw'), { links: { 'stmt:saw': 0 } })], 'distrusted', 'a relayed fact has its own statement link');
    assert.equal(LEVELS[levelOf(p.factChains('ask'), { links: { 'stmt:saw': 0 } })], 'uncertain');
});

test('trust: a chain is as strong as its weakest link, a fact as its best chain; a narrator’s own is certain', () => {
    const told = { links: [{ from: 'edith', to: 'police', how: 'sworn statement', telling: 'f.tell' }, { from: 'police', to: 'watson', how: 'report', telling: 'f.rep' }] };
    const heard = { links: [{ from: 'holmes', to: 'watson', how: 'said' }] };
    assert.equal(LEVELS[chainLevel({ links: [narrationLink({ id: 'watson' })] })], 'certain');
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

test('other right answers (also_right): judged right, and no contradiction with the answer', () => {
    const questions = [{ id: 'q.why', answer: 'noise', also_right: ['light'], possibilities: [{ value: 'noise' }, { value: 'light' }, { value: 'exercise' }, { value: 'something else' }] }];
    const q = questions[0];
    assert.deepEqual(['noise', 'light', 'exercise'].map((p) => isRight(q, p)), [true, true, false]);
    assert.equal(compatible(q, 'noise', 'light'), true);
    assert.equal(compatible(q, 'noise', 'exercise'), false);
    const claim = { id: 's1', of: 'man', attr: 'says', value: 'x', time: { at: 't2' }, para: 2, quote: 'x', asserts: [{ q: 'q.why', pick: 'light' }] };
    const w = world([claim], questions);
    assert.equal(assertions(w).find((x) => x.kind === 'pick').truth, true, 'a claim of the other right answer is true');
    const clash = (marks) => contradictions(w, [...assertions(w), ...markAssertions(w, marks)]).map((c) => c.why);
    assert.deepEqual(clash({ 'q.why': { noise: 'circled' } }), [], 'the light and the noise can both hold');
    assert.deepEqual(clash({ 'q.why': { exercise: 'circled' } }), ['q.why: light or exercise']);
    assert.equal(markAssertions(w, { 'q.why': { light: 'circled' } })[0].truth, true, 'a circle on it is right');
});

test('an answer that implies another question\'s answer asserts it too (the hoof: the horse struck)', () => {
    const questions = [
        { id: 'q.who', answer: 'horse', possibilities: [{ value: 'horse' }, { value: 'man' }, { value: 'something else' }] },
        { id: 'q.weapon', answer: 'hoof', possibilities: [{ value: 'hoof', implies: { q: 'q.who', pick: 'horse' } }, { value: 'stick', implies: { q: 'q.who', pick: 'man' } }, { value: 'something else' }] },
    ];
    const w = world([], questions);
    const ms = markAssertions(w, { 'q.who': { horse: 'circled' }, 'q.weapon': { stick: 'circled' } });
    const imp = ms.find((x) => x.mark === 'implied');
    assert.deepEqual([imp.q, imp.pick, imp.from, imp.truth], ['q.who', 'man', 'hyp:q.weapon=stick', false]);
    assert.deepEqual(contradictions(w, ms).map((c) => c.why), ['q.who: horse or man'], 'the stick implies the man, against the horse circled');
    assert.equal(markAssertions(w, { 'q.weapon': { stick: 'crossed' } }).length, 1, 'a crossing implies nothing');
});

test('who and where questions take any person or animal, or any place, beyond their listed possibilities', () => {
    const kindOf = entityKinds({ entities });
    const who = { id: 'q.who', entry: { of: 'man', attr: 'identity' }, possibilities: [{ value: 'horse' }, { value: 'a friend' }] };
    const where = { id: 'q.where', possibilities: [{ value: 'stable' }] };
    const what = { id: 'q.what', possibilities: [{ value: 'a drug' }, { value: 'box' }] };
    assert.equal(answerKinds(who, kindOf), WHO);
    assert.equal(answerKinds(where, kindOf), WHERE);
    assert.deepEqual(answerKinds(what, kindOf), []);
    assert.deepEqual(answerKinds({ ...where, kind: 'provenance' }, kindOf), [], 'provenance: only its own');
    assert.ok(isOption(who, 'watson', kindOf) && isOption(who, 'a friend', kindOf));
    assert.ok(!isOption(who, 'man', kindOf), 'not its own subject');
    assert.ok(!isOption(who, 'moor', kindOf) && !isOption(who, 'box', kindOf));
    assert.ok(isOption(where, 'hollow', kindOf) && !isOption(where, 'horse', kindOf));
    const w = world([], [{ ...who, answer: 'watson' }]);
    assert.deepEqual(markAssertions(w, { 'q.who': { watson: 'circled', moor: 'circled' } }).map((x) => [x.pick, x.truth]), [['watson', true]]);
});

test("a mark's chain: one link from the reader's hypothesis, starting uncertain, capped like a person", () => {
    const c = hypothesisChain('q.who', 'man');
    assert.equal(linkKey(c.links[0]), hypothesisKey('q.who', 'man'));
    assert.equal(LEVELS[chainLevel(c)], 'uncertain');
    assert.equal(LEVELS[chainLevel(c, { links: { [hypothesisKey('q.who', 'man')]: 2 } })], 'trusted');
    assert.equal(LEVELS[chainLevel(c, { links: { [hypothesisKey('q.who', 'man')]: 2 }, people: { [HYPOTHESIS]: 0 } })], 'distrusted');
});

test('a doubtable narrator: each of their own observations has a statement link, starting as certain as the narration', () => {
    const facts = [loc('own', 'horse', 'moor', { at: 't1' }), loc('own2', 'man', 'moor', { at: 't1' })];
    const p = provenance({ ...world(facts), narrators: [{ id: 'watson', doubtable: true }] });
    const own = p.factChains('own');
    assert.deepEqual(own.map((c) => c.links.map(linkKey)), [['stmt:own', 'narrates:watson']]);
    assert.equal(LEVELS[levelOf(own)], 'certain', 'undoubted, it is as certain as before');
    assert.equal(LEVELS[levelOf(own, { links: { 'stmt:own': 0 } })], 'distrusted');
    assert.equal(LEVELS[levelOf(p.factChains('own2'), { links: { 'stmt:own': 0 } })], 'certain', 'the rest of what the narrator says stands');
    assert.deepEqual(resolvingLinks(own, {}, 1).links, ['stmt:own']);
});

test('an alibi: elsewhere for the whole window, by one location or several end to end', () => {
    const mark = { id: 'hyp:q=man', kind: 'pick', q: 'q', pick: 'man', mark: 'circled' };
    const need = (time) => [{ mark, of: 'man', places: ['stable'], time, label: 'it needs him at the stable' }];
    const st = (id, value, time, of = 'man') => ({ id, fact: id, kind: 'state', of, attr: 'location', value, neg: false, time });
    const w = world([]);
    const whole = alibis(w, [st('a', 'london', { from: 't1', to: 't4' })], need({ from: 't2', to: 't3' }));
    assert.deepEqual(whole.map((c) => [c.a.id, c.b.id, c.b.needs]), [['a', 'hyp:q=man', 'it needs him at the stable']]);
    assert.equal(alibis(w, [st('a', 'london', { from: 't1', to: 't3' })], need({ from: 't2', to: 't4' })).length, 0, 'part of the window is no alibi');
    assert.equal(alibis(w, [st('a', 'london', { at: 't2' })], need({ from: 't2', to: 't3' })).length, 0, 'seen elsewhere at one moment is no alibi');
    assert.equal(alibis(w, [st('a', 'london', { from: 't1' })], need({ from: 't1', to: 't3' })).length, 0, 'an open end covers only its start');
    assert.equal(alibis(w, [st('a', 'stall', { from: 't1', to: 't4' })], need({ from: 't2', to: 't3' })).length, 0, 'a place within the one needed is no alibi');
    assert.equal(alibis(w, [st('a', 'london', { from: 't1', to: 't4' }, 'horse')], need({ from: 't2', to: 't3' })).length, 0, 'someone else');
    const chain = alibis(w, [st('a', 'london', { from: 't1', to: 't2' }), st('b', 'hollow', { from: 't2', to: 't4' })], need({ from: 't1', to: 't3' }));
    assert.deepEqual(chain.map((c) => c.a.id), ['a', 'b'], 'two locations end to end: a contradiction with each');
    assert.equal(alibis(w, [st('a', 'london', { from: 't1', to: 't2' }), st('b', 'hollow', { from: 't3', to: 't4' })], need({ from: 't1', to: 't4' })).length, 0, 'a gap between them');
});

test('an identity carries whereabouts: the figure was the man, so the man was where the figure was', () => {
    const ents = [...entities, { id: 'figure', kind: 'person' }];
    const q = { id: 'q.fig', entry: { of: 'figure', attr: 'identity', time: { at: 't2' } }, answer: 'horse', possibilities: [{ value: 'man' }, { value: 'something else' }] };
    const facts = [loc('fd', 'figure', 'stable', { at: 't2' }), loc('mh', 'man', 'london', { from: 't1', to: 't3' }),
        { id: 'fid', of: 'figure', attr: 'identity', value: 'man', time: { at: 't2' }, para: 2, quote: 'x', truth: false, q: 'q.fig', pick: 'man' }];
    const w = { ...world(facts, [q]), entities: ents };
    const cs = contradictions(w);
    assert.deepEqual(cs.map((c) => [c.a.id, c.b.id, c.via?.id, c.why]), [['mh', 'fid', 'fd', 'man in two places, if figure was man: london and stable']]);
    assert.deepEqual(contradictions(w, assertions(w).filter((x) => x.id !== 'fid')).map((c) => c.why), [], 'the identity set aside: no clash');
    assert.deepEqual(contradictions(w, assertions(w).filter((x) => x.id !== 'fd')).map((c) => c.why), [], 'nor without where the figure was');
    const others = assertions(w).filter((x) => x.id !== 'fid' && x.fact !== 'fid');
    assert.deepEqual(contradictions(w, [...others, ...markAssertions(w, { 'q.fig': { man: 'circled' } })]).map((c) => [c.b.id, c.why]),
        [['hyp:q.fig=man', 'man in two places, if figure was man: london and stable']], 'a circled answer of an identity question too');
    assert.deepEqual(contradictions(w, [...others, ...markAssertions(w, { 'q.fig': { man: 'crossed' } })]), [], 'a crossing joins nothing');
    const near = { ...world([facts[0], loc('ms', 'man', 'stall', { at: 't2' }), facts[2]], [q]), entities: ents };
    assert.deepEqual(contradictions(near), [], 'within the same place: no clash');
});

test('one event told at two times: a contradiction, only when the times certainly do not meet', () => {
    const shot = (id, time, extra = {}) => ({ id, of: '?', attr: 'action', value: 'fires a shot', event: 'e.shot', time, para: 1, quote: 'x', ...extra });
    assert.deepEqual(why(world([shot('s1', { at: 't2' }), shot('s2', { at: 't3' })])), ['e.shot: once, at two times']);
    assert.deepEqual(why(world([shot('s1', { at: 't2' }), shot('s2', { at: 't2' })])), [], 'the same time');
    assert.deepEqual(why(world([shot('s1', { at: 't2' }), shot('s2', { at: 'tx' })])), [], 'times not ordered: not certain');
    assert.deepEqual(why(world([shot('s1', { at: 't2' }), shot('s2', { after: 't1', before: 't4' })])), [], 'an uncertain time');
    assert.deepEqual(why(world([shot('s1', { at: 't2' }), { ...shot('s2', { at: 't3' }), event: 'e.other' }])), [], 'another event');
    const w = world([shot('s1', { at: 't2' }), shot('s2', { at: 't3' })]);
    assert.deepEqual(contradictions(w, assertions(w).filter((x) => x.id !== 's2')), [], 'one of them set aside');
});

test('a denial against what it denies, for any kind of state, when the times meet', () => {
    const round = (id, time, extra = {}) => ({ id, of: 'w', attr: 'round', value: 'round made', time, para: 1, quote: 'x', ...extra });
    assert.deepEqual(why(world([round('r1', { from: 't1', to: 't4' }), round('r2', { at: 't2' }, { neg: true })])), ['w: round made, asserted and denied']);
    assert.deepEqual(why(world([round('r1', { at: 't1' }), round('r2', { at: 't2' }, { neg: true })])), [], 'times that do not meet');
    assert.deepEqual(why(world([round('r1', { at: 't2' }), round('r2', { at: 't2' }, { neg: true, value: 'other' })])), [], 'another value');
});

test('a need of any other state against a state that denies it, while it holds', () => {
    const mark = { id: 'hyp:q=maid', kind: 'pick', q: 'q', pick: 'maid', mark: 'circled' };
    const need = [{ mark, of: 'maid', attr: 'knows', value: 'bend', time: { from: 't2', to: 't3' }, req: 'r1', label: 'it needs the maid to know the bend' }];
    const st = (time, neg = true) => ({ id: 's', fact: 's', kind: 'state', of: 'maid', attr: 'knows', value: 'bend', neg, time });
    const w = world([]);
    const got = alibis(w, [st({ from: 't1' })], need);
    assert.deepEqual(got.map((c) => [c.a.id, c.b.id, c.b.req]), [['s', 'hyp:q=maid', 'r1']]);
    assert.equal(alibis(w, [st({ from: 't1' }, false)], need).length, 0, 'saying so is no contradiction');
    assert.equal(alibis(w, [st({ from: 't4' })], need).length, 0, 'begun after the window');
    assert.equal(alibis(w, [st({ from: 't0', to: 't1' })], need).length, 0, 'over before it');
});

test('a denial for a stretch against what held at some moment between two points inside it', () => {
    const neg = loc('f.never', 'man', 'stable', { from: 't1', to: 't4' }, { neg: true });
    assert.deepEqual(why(world([neg, loc('f.some', 'man', 'stall', { after: 't2', before: 't3' })])), ['man: at stall and not at stable']);
    assert.deepEqual(why(world([neg, loc('f.some', 'man', 'london', { after: 't2', before: 't3' })])), [], 'somewhere else');
    assert.deepEqual(why(world([neg, loc('f.some', 'man', 'stall', { after: 't2', before: 'tx' })])), [], 'tx is not certainly inside the stretch');
    assert.deepEqual(why(world([loc('f.at', 'man', 'stable', { at: 't2' }, { neg: true }), loc('f.some', 'man', 'stall', { after: 't1', before: 't3' })])), [], 'a denial at one point does not hold the stretch');
    const st = (id, time, extra = {}) => ({ id, of: 'man', attr: 'round', value: 'made', time, para: 1, quote: 'x', ...extra });
    assert.deepEqual(why(world([st('f.no', { from: 't1', to: 't4' }, { neg: true }), st('f.yes', { after: 't1', before: 't3' })])), ['man: made, asserted and denied']);
});

test('a denial of a whole stretch: only locations within the place that hold it end to end contradict it', () => {
    const not = { id: 'd', fact: null, kind: 'state', of: 'man', attr: 'location', value: 'stable', neg: true, whole: true, time: { from: 't1', to: 't4' }, by: 'derived' };
    const run = (facts) => { const w = world(facts); return contradictions(w, [...assertions(w), not]).map((c) => `${c.a.id}: ${c.why}`); };
    assert.deepEqual(run([loc('f.a', 'man', 'stall', { at: 't2' })]), [], 'there for a moment: he may have left');
    assert.deepEqual(run([loc('f.a', 'man', 'stall', { from: 't1', to: 't3' })]), [], 'not to the end');
    assert.deepEqual(run([loc('f.a', 'man', 'stall', { from: 't1', to: 't4' })]), ['f.a: man: at stable throughout, and not']);
    assert.deepEqual(run([loc('f.a', 'man', 'stall', { from: 't1', to: 't3' }), loc('f.b', 'man', 'stable', { from: 't3', to: 't4' })]).length, 2, 'end to end: each piece a side');
    assert.deepEqual(run([loc('f.a', 'man', 'london', { from: 't1', to: 't4' })]), [], 'elsewhere agrees with it');
});

test('a statement denied by name contradicts that statement, while both are accepted', () => {
    const w = world([{ id: 'f.entry', of: 'box', attr: 'action', value: 'is shipped, by the ledger', time: { at: 't2' }, para: 1, quote: 'x', truth: false }]);
    const d = { id: 'i.x!f.entry', fact: null, kind: 'denial', denies: 'f.entry', q: 'q', by: 'derived' };
    assert.deepEqual(contradictions(w, [...assertions(w), d]).map((c) => [c.a.id, c.b.id]), [['f.entry', 'i.x!f.entry']]);
    assert.deepEqual(contradictions(w, [d]), []);
});

test('a statement about everyone is one about each, but those named and those whose identity is in question', () => {
    const ents = [...entities, { id: 'groom', kind: 'person' }, { id: 'figure', kind: 'person' }];
    const w = (facts) => ({ ...world(facts, [{ id: 'q.fig', entry: { of: 'figure', attr: 'identity', time: { at: 't2' } }, possibilities: [] }]), entities: ents });
    const nobody = { id: 'f.nobody', of: '*', every: 'person', but: ['watson'], attr: 'location', value: 'stable', neg: true, time: { from: 't1', to: 't4' }, para: 1, quote: 'x' };
    const run = (facts) => { const x = w(facts); return contradictions(x).map((c) => `${c.a.id}/${c.b.id}: ${c.why}`); };
    assert.deepEqual(run([nobody, loc('f.w', 'watson', 'stall', { at: 't2' })]), [], 'one of those named');
    assert.deepEqual(run([nobody, loc('f.h', 'horse', 'stall', { at: 't2' })]), [], 'an animal is no person');
    assert.deepEqual(run([nobody, loc('f.f', 'figure', 'stall', { at: 't2' })]), [], 'the figure may be one of those named');
    assert.deepEqual(run([nobody, loc('f.m', 'man', 'stall', { at: 't2' }), loc('f.g', 'groom', 'stall', { after: 't2', before: 't3' })]), ['f.nobody/f.m: man: at stall and not at stable', 'f.g/f.nobody: groom: at stall and not at stable']);
});

test("an answer's typed form: asserted with a circle, denied with a cross where one state says the denial", () => {
    const q = { id: 'q', entry: { of: 'man', attr: 'condition', time: { at: 't2' } }, answer: 'no', possibilities: [
        { value: 'yes', asserts: [{ of: 'man', attr: 'location', value: 'stable' }] },
        { value: 'all night', asserts: [{ of: 'man', attr: 'round', value: 'made', time: { from: 't1', to: 't4' } }] },
        { value: 'never', asserts: [{ of: 'man', attr: 'round', value: 'made', neg: true, time: { from: 't1', to: 't4' } }] },
        { value: 'two', asserts: [{ of: 'man', attr: 'location', value: 'stable' }, { of: 'horse', attr: 'location', value: 'stable' }] },
        { value: 'no' }] };
    const round = { id: 'f.r', of: 'man', attr: 'round', value: 'made', time: { from: 't1', to: 't4' }, para: 1, quote: 'x' };
    const w = world([loc('f.s', 'man', 'stall', { at: 't2' }), loc('f.l', 'man', 'london', { at: 't2' }, { truth: false }), round], [q]);
    const marks = (m) => markAssertions(w, { q: m });
    assert.deepEqual(marks({ yes: 'circled' }).map((x) => [x.id, x.kind, x.neg, x.time]), [['hyp:q=yes', 'pick', false, undefined], ['hyp:q=yes@a0', 'state', false, { at: 't2' }]], "the entry's time");
    const clash = (m) => contradictions(w, [...assertions(w), ...marks(m)]).filter((c) => c.a.mark || c.b.mark).map((c) => [c.a.id, c.b.id].sort().join('/'));
    assert.deepEqual(clash({ yes: 'circled' }), ['f.l/hyp:q=yes@a0']);
    assert.deepEqual(clash({ yes: 'crossed' }), ['f.s/hyp:q=yes@a0']);
    assert.equal(marks({ 'all night': 'crossed' })[1].whole, true);
    assert.deepEqual(clash({ 'all night': 'crossed' }), ['f.r/hyp:q=all night@a0'], 'not for the whole of it, against the whole of it');
    assert.equal(marks({ never: 'crossed' }).length, 1, 'the denial of "at no moment" is no one state');
    assert.equal(marks({ two: 'crossed' }).length, 1, 'the denial of two states is neither');
    assert.equal(marks({ two: 'circled' }).length, 3);
});

test('typed acts: the same act by its types and roles; a denial that names fewer denies the more specific; nobody, of an act', () => {
    const ents = [...entities, { id: 'door', kind: 'object' }, { id: 'sack', kind: 'object' }];
    const act = (id, of, time, extra = {}) => ({ id, of, attr: 'action', act: ['go_through'], thing: 'door', value: 'x', time, para: 1, quote: 'x', ...extra });
    const run = (facts) => contradictions({ ...world(facts), entities: ents }).map((c) => `${c.a.id}/${c.b.id}`);
    const nobody = act('f.nobody', '*', { from: 't1', to: 't4' }, { every: 'person', neg: true, value: undefined });
    assert.deepEqual(run([nobody, act('f.m', 'man', { at: 't2' }, { item: 'sack', value: 'goes in with a sack' })]), ['f.m/f.nobody']);
    assert.deepEqual(run([nobody, act('f.s', '?', { after: 't1', before: 't3' })]), ['f.s/f.nobody'], 'with nobody excepted, someone unnamed too');
    assert.deepEqual(run([{ ...nobody, but: ['man'] }, act('f.s', '?', { at: 't2' }), act('f.m', 'man', { at: 't2' })]), [], 'the one excepted, and someone who may be he');
    assert.deepEqual(run([nobody, act('f.o', 'man', { at: 't2' }, { thing: 'sack' })]), [], 'another thing');
    assert.deepEqual(run([nobody, act('f.o', 'man', { at: 't2' }, { act: ['open'] })]), [], 'another act');
    assert.deepEqual(run([act('f.no', 'man', { at: 't2' }, { neg: true, item: 'sack' }), act('f.m', 'man', { at: 't2' })]), [], 'a denial of the more specific does not deny the plain act');
    assert.deepEqual(run([act('f.no', 'man', { at: 't2' }, { neg: true, act: ['go_through'] }), act('f.m', 'man', { at: 't2' }, { act: ['open', 'go_through'] })]), ['f.m/f.no'], 'one of two acts denied');
});
