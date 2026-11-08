import { test } from 'node:test';
import assert from 'node:assert/strict';
import { waysIn, checkWayMark, sealedFor, pointPassage, foundBy, checkRoute, whatElse, isListed, fits, fitTable, knowledgeChain, knowledgeKey } from './arrangement.js';
import { linkKey } from './world.js';

// An invented case: a counting-house strongroom found sealed, with the clerk's office next door. A smell of pipe tobacco
// crossed between them; a grating, a chain on a hook and a bolted stool make a way from the office to the ledger desk.
const openings = {
    door: { kind: 'door', sides: ['strongroom', 'hall'] },
    flue: { kind: 'chimney', sides: ['strongroom', 'roof'] },
    grating: { kind: 'vent', sides: ['strongroom', 'office'] },
};
const sealed = { place: 'strongroom', surfaces: ['walls'] };
const doorShut = { id: 'f.door', of: 'door', attr: 'closed_to', value: 'small', para: 3 };
const flueBarred = { id: 'f.flue', of: 'flue', attr: 'closed_to', value: 'person', para: 3 };
const wallsSound = { id: 'f.walls', of: 'walls', attr: 'closed_to', value: 'small', para: 3 };
const smell = { id: 'f.smell', of: 'tobacco', attr: 'passed', from: 'office', to: 'strongroom', passes: 'air', para: 2 };
const gratingOpen = { id: 'f.grating', of: 'grating', attr: 'passes', value: 'small', para: 9 };
const chain = { id: 'f.chain', of: 'chain', attr: 'attached', value: 'hook', para: 10 };
const hookNear = { id: 'f.hook', of: 'hook', attr: 'near', value: 'grating', para: 10 };
const chainReaches = { id: 'f.reach', of: 'chain', attr: 'reaches', value: 'desk', para: 11 };
const deskFixed = { id: 'f.fixed', of: 'desk', attr: 'fixed', value: 'floor', para: 12 };

test('ways in: a row only once told, and each column closed, open or unsaid', () => {
    assert.deepEqual(waysIn(sealed, [], openings), [], 'nothing told, no rows: the list of openings is not given away');
    const rows = waysIn(sealed, [doorShut, flueBarred, wallsSound], openings);
    assert.deepEqual(rows.map((r) => r.id), ['door', 'flue', 'walls']);
    const flue = rows.find((r) => r.id === 'flue');
    assert.deepEqual([flue.cells.person.status, flue.cells.small.status], ['closed', 'unsaid'], 'barred to a person says nothing of something small');
    assert.deepEqual(sealedFor(rows, 'person'), { sealed: true, open: [], unsaid: [] }, 'alone: as far as a person goes');
    assert.deepEqual(sealedFor(rows, 'small'), { sealed: false, open: [], unsaid: ['flue'] }, 'but not for something small');
});

test('marks on the table: only what the timeline supports', () => {
    const rows = waysIn(sealed, [doorShut, flueBarred], openings);
    assert.deepEqual(checkWayMark(rows, 'door', 'small', 'closed').by, [doorShut]);
    assert.match(checkWayMark(rows, 'flue', 'small', 'closed').why, /Nothing/);
    assert.match(checkWayMark(rows, 'door', 'small', 'open').why, /closed/);
    assert.match(checkWayMark(rows, 'nowhere', 'small', 'closed').why, /not on the timeline/);
});

test('something got through: a way not yet found, until the story shows it', () => {
    const { entry } = pointPassage(smell, [doorShut], openings);
    assert.deepEqual([entry.of, entry.attr, entry.sides, entry.passes, entry.reasoned.premises], ['?', 'opening', ['office', 'strongroom'], 'air', ['f.smell']]);
    const before = waysIn(sealed, [doorShut, entry], openings);
    assert.deepEqual(before.map((r) => [r.kind, r.cells.air.status, r.cells.person.status]), [['door', 'unsaid', 'closed'], ['unfound', 'open', 'unsaid']], 'a door shut to something small says nothing of air');
    assert.equal(foundBy(entry, [gratingOpen], openings), 'grating');
    const after = waysIn(sealed, [doorShut, entry, gratingOpen], openings);
    assert.deepEqual(after.map((r) => r.id), ['door', 'grating'], 'the grating takes the place of the unfound row');
    assert.match(pointPassage(smell, [gratingOpen], openings).why, /already/);
    assert.match(pointPassage(doorShut).why, /not something crossing/);
});

test('the route: link by link, each on the timeline, giving requirements and what holds the end', () => {
    const known = [gratingOpen, chain, hookNear, chainReaches, deskFixed];
    const route = ['office', 'grating', 'hook', 'chain', 'desk'];
    const r = checkRoute(route, known, openings);
    assert.ok(r.ok);
    assert.deepEqual(r.requirements, [{ trait: 'size', value: 'small', by: 'grating' }, { trait: 'travels', value: 'chain' }]);
    assert.deepEqual(r.steady.map((f) => f.id), ['f.fixed']);
    assert.deepEqual(r.entry.value, route);
    const gap = checkRoute(route, [gratingOpen, hookNear, chainReaches], openings);
    assert.equal(gap.failAt, 2, 'the chain is not yet known to hang from the hook');
    assert.match(gap.why, /links/);
    assert.match(checkRoute(['office'], known, openings).why, /from one thing/);
    assert.match(checkRoute(['office', 'grating', 'office'], known, openings).why, /back on itself/);
});

const animals = { id: 'c.colonial', on: ['f.menagerie'], members: [
    { id: 'ferret', traits: { size: 'small', travels: true, marks: 'bites' } },
    { id: 'mastiff', traits: { size: 'person', travels: false } },
    { id: 'marmoset', traits: { size: 'small', travels: true } },
] };

test('what else of this kind: needs its fact on the timeline, and comes as general knowledge', () => {
    assert.match(whatElse(animals, []).why, /Nothing/);
    const r = whatElse(animals, [{ id: 'f.menagerie' }]);
    assert.equal(r.members.length, 3);
    assert.equal(r.chain.origin, 'general knowledge');
    assert.equal(linkKey(knowledgeChain('c.colonial').links[0]), knowledgeKey('c.colonial'), 'the link has its own trust setting');
    const told = { value: 'a clerk', available: 3 }, known = { value: 'ferret', via: 'knowledge', category: 'c.colonial', available: 0 };
    assert.ok(isListed(told, 3));
    assert.ok(!isListed(known, 99), 'not by reading on');
    assert.ok(isListed(known, 1, new Set(['c.colonial'])), 'only by the move');
});

test('requirements filter candidates; evidence-only ones do not', () => {
    const size = { trait: 'size', value: 'small' }, rope = { trait: 'travels', value: 'chain' }, kept = { trait: 'comes when called', filter: false };
    assert.equal(fits(animals.members[1], size), 'fails');
    assert.equal(fits(animals.members[0], size), 'fits');
    assert.equal(fits(animals.members[0], { trait: 'marks', value: 'none' }), 'fails');
    assert.equal(fits(animals.members[2], { trait: 'marks', value: 'none' }), 'unknown');
    assert.equal(fits(animals.members[0], kept), 'no test');
    assert.deepEqual(fitTable(animals.members, [size, rope, kept]).map((r) => [r.member.id, r.out]), [['ferret', false], ['mastiff', true], ['marmoset', false]]);
});
