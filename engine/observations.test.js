import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fill, described } from './observations.js';

// An invented case: what came down the chain to the desk?
const OBS = [
    { id: 'o.size', q: 'q', from: ['f.grating'], says: 'small enough for the grating', essential: true },
    { id: 'o.climb', q: 'q', from: [{ route_through: ['grating', 'chain'] }], says: 'can travel a chain', essential: true },
    { id: 'o.teeth', q: 'q', from: ['f.bite', 'f.doctor'], says: 'bites, and leaves a small wound' },
    { id: 'o.shape', q: 'q', from: ['f.words'], says: 'looks like a grey stripe', essential: true, if: { q: 'q.words', pick: 'a look-alike' } },
    { id: 'o.other', q: 'q2', from: ['f.grating'], says: 'the grating is new' },
];
const known = ['f.grating', 'f.bite', 'f.doctor', 'f.words', 'f.idle'].map((id) => ({ id }));
const route = { id: 'r:r:office>grating>chain', attr: 'route', value: ['office', 'grating', 'chain'] };
const link = (entry, q = 'q') => ({ entry, q });

test('an observation is hidden until its entry is linked to its question', () => {
    assert.deepEqual(fill(OBS, [], known).filled, []);
    const { filled } = fill(OBS, [link('f.grating')], known);
    assert.deepEqual(filled.map((x) => [x.obs.id, x.says, x.entries.map((e) => e.id)]), [['o.size', 'small enough for the grating', ['f.grating']]]);
    assert.deepEqual(fill(OBS, [link('f.grating', 'q2')], known).filled.map((x) => x.obs.id), ['o.other'], 'linked to the other question, the other observation');
});

test('a link the data does not know stays as a note', () => {
    const r = fill(OBS, [link('f.idle'), link('f.grating')], known);
    assert.deepEqual(r.notes, [link('f.idle')]);
    assert.equal(r.filled.length, 1);
});

test('an observation resting on two entries needs both linked', () => {
    assert.equal(fill(OBS, [link('f.bite')], known).filled.length, 0);
    assert.deepEqual(fill(OBS, [link('f.bite')], known).notes, [link('f.bite')], 'until then, a note');
    const r = fill(OBS, [link('f.bite'), link('f.doctor')], known);
    assert.deepEqual(r.filled.map((x) => x.obs.id), ['o.teeth']);
    assert.deepEqual(r.notes, []);
});

test('a route counts by what it runs through', () => {
    assert.deepEqual(fill(OBS, [link(route.id)], [route]).filled.map((x) => x.obs.id), ['o.climb']);
    const elsewhere = { ...route, id: 'r:r:office>door', value: ['office', 'door'] };
    assert.deepEqual(fill(OBS, [link(elsewhere.id)], [elsewhere]).filled, []);
});

test('an entry leaving the timeline takes its observation with it', () => {
    const links = [link('f.grating')];
    assert.equal(fill(OBS, links, known).filled.length, 1);
    const r = fill(OBS, links, known.filter((e) => e.id !== 'f.grating'));
    assert.deepEqual([r.filled, r.notes], [[], []]);
});

test('an observation can depend on an answer of another question', () => {
    const links = [link('f.words')];
    const none = fill(OBS, links, known);
    assert.deepEqual([none.filled, none.notes], [[], links], 'until it is circled, the link is a note');
    assert.deepEqual(fill(OBS, links, known, { 'q.words': { 'a gang': 'circled' } }).filled, [], 'another answer circled: nothing');
    assert.deepEqual(fill(OBS, links, known, { 'q.words': { 'a look-alike': 'crossed' } }).filled, [], 'crossed out: nothing');
    const m = { 'q.words': { 'a look-alike': 'circled' } };
    assert.deepEqual(fill(OBS, links, known, m).filled.map((x) => x.says), ['looks like a grey stripe']);
    assert.deepEqual(fill(OBS, links, known, m).notes, []);
});

test('the description: essentials only', () => {
    const all = [link('f.grating'), link(route.id), link('f.words')];
    const ks = [...known, route];
    const right = { 'q.words': { 'a look-alike': 'circled' } };
    assert.deepEqual(described(OBS, 'q', fill(OBS, all, ks, right).filled), { any: true, done: true, missing: [] });
    assert.deepEqual(described(OBS, 'q', fill(OBS, all, ks, { 'q.words': { 'a gang': 'circled' } }).filled).missing, ['looks like a grey stripe'], 'the other reading does not count');
    assert.deepEqual(described(OBS, 'q', fill(OBS, [link('f.grating')], ks).filled).missing, ['can travel a chain', 'looks like a grey stripe']);
    assert.deepEqual(described(OBS, 'q2', []), { any: false, done: false, missing: [] });
});

test('a lie as evidence: a statement linked counts once the page says it is doubted', () => {
    const obs = [{ id: 'o.lie', q: 'q', from: [{ doubted: 'f.tells' }], says: 'what he said cannot stand', essential: true }];
    const links = [{ entry: 'f.tells', q: 'q' }];
    const known = [{ id: 'f.tells', attr: 'tells' }];
    assert.equal(fill(obs, links, known).filled.length, 0, 'believed: the link is only a note');
    assert.equal(fill(obs, links, known).notes.length, 1);
    assert.equal(fill(obs, links, known, {}, { doubted: (id) => id === 'f.tells' }).filled.length, 1);
    assert.equal(fill(obs, [], known, {}, { doubted: () => true }).filled.length, 0, 'doubted but not linked');
});

test('an entry a move reveals counts by its move and its premises, in either order', () => {
    const OB = [{ id: 'o.changed', q: 'q', from: [{ reasoned: 'changed', premises: ['f.locked', 'f.open'] }], says: 'someone opened it', essential: true },
        { id: 'o.got', q: 'q', from: [{ reasoned: 'got_through', premises: ['f.ring'] }], says: 'there is a way in', essential: true }];
    const changed = { id: 'r:a:f.open|f.locked', attr: 'action', reasoned: { move: 'a', premises: ['f.open', 'f.locked'] } };
    const got = { id: 'r:g:f.ring', attr: 'opening', reasoned: { move: 'g', premises: ['f.ring'] } };
    const other = { id: 'r:a:f.open|f.shut', attr: 'action', reasoned: { move: 'a', premises: ['f.open', 'f.shut'] } };
    assert.deepEqual(fill(OB, [link(changed.id), link(got.id)], [changed, got]).filled.map((x) => x.obs.id), ['o.changed', 'o.got']);
    assert.deepEqual(fill(OB, [link(other.id)], [other]).filled, [], 'another change is not it');
    assert.deepEqual(fill(OB, [link('f.open'), link('f.locked')], [{ id: 'f.open' }, { id: 'f.locked' }]).filled, [], 'the premises linked are not the move');
});

test('a gap pointed out ("Something is missing here") is named by its rule and its time', () => {
    const gap = { id: 'r:m:f.rule@t3', rule: 'f.rule', gap: 't3', reasoned: { move: 'm', premises: ['f.rule', 'p1', 'p2'] } };
    const obs = [{ id: 'o', q: 'q', from: [{ reasoned: 'missing', of: 'f.rule', at: 't3' }], says: 'no round at three' }];
    assert.equal(fill(obs, [{ entry: gap.id, q: 'q' }], [gap]).filled.length, 1);
    assert.equal(fill([{ ...obs[0], from: [{ reasoned: 'missing', of: 'f.rule', at: 't2' }] }], [{ entry: gap.id, q: 'q' }], [gap]).filled.length, 0);
});
