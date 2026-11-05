import { test } from 'node:test';
import assert from 'node:assert/strict';
import { timeOrder, contradictions } from './world.js';
import { ACTIONS, changePath, pointChange, pointImplications, holdsBefore, requirementStatus, reasonedEntries } from './actions.js';

// The stable door in small: locked at nine, the boy goes out and locks it behind him, open in the morning.
const times = [{ id: 't9' }, { id: 'tout', after: 't9' }, { id: 'tnight', after: 'tout' }, { id: 'tmorn', after: 'tnight' }];
const order = timeOrder(times);
const locked9 = { id: 'f.locked9', of: 'door', attr: 'door', value: 'locked', time: { from: 't9' }, para: 1 };
const lockedOut = { id: 'f.lockedOut', of: 'door', attr: 'door', value: 'locked', time: { from: 'tout' }, para: 2 };
const openMorn = { id: 'f.open', of: 'door', attr: 'door', value: 'open', time: { at: 'tmorn' }, para: 3 };
const goesOut = { id: 'f.out', of: 'boy', attr: 'action', act: 'go_through', thing: 'door', value: 'going out', time: { at: 'tout' }, para: 2 };
const locks = { id: 'f.locks', of: 'boy', attr: 'action', act: 'lock', thing: 'door', value: 'locking the door', time: { at: 'tout' }, para: 2 };
const nameOf = (id) => ({ door: 'The stable door' })[id] ?? id;

test('the action table: a change from one value to another is the shortest run of actions', () => {
    assert.deepEqual(changePath('door', 'locked', 'open'), ['unlock', 'open']);
    assert.deepEqual(changePath('door', 'open', 'locked'), ['lock']);
    assert.deepEqual(changePath('door', 'shut', 'open'), ['open']);
    assert.equal(changePath('door', 'open', 'open'), null);
    for (const a of Object.values(ACTIONS)) assert.ok(a.label && a.requires && a.effects);
});

test('move (b): an action requires a state and a key just before, and effects a state just after', () => {
    const { entries } = pointImplications(locks, nameOf);
    assert.deepEqual(entries.map((e) => [e.role, e.of, e.attr, e.value, !!e.neg, JSON.stringify(e.time)]), [
        ['requires', 'door', 'door', 'locked', true, '{"to":"tout"}'],
        ['requires', 'boy', 'carrying', 'a key to the stable door', false, '{"at":"tout"}'],
        ['effects', 'door', 'door', 'locked', false, '{"from":"tout"}'],
    ]);
    assert.ok(entries.every((e) => e.reasoned.move === 'b' && e.reasoned.premises[0] === 'f.locks'));
    assert.deepEqual(pointImplications(goesOut).entries.map((e) => [e.attr, e.value]), [['door', 'open']], 'going through: the door open');
    assert.ok(pointImplications({ id: 'x', of: 'a', attr: 'action', value: 'x' }).why, 'an untyped action: nothing');
});

test('move (a): two differing states of one thing give a change between them, by someone', () => {
    const r = pointChange(order, openMorn, lockedOut, [locked9, lockedOut, openMorn]);
    assert.deepEqual([r.entry.of, r.entry.act, r.entry.thing, r.entry.time], ['?', ['unlock', 'open'], 'door', { after: 'tout', before: 'tmorn' }], 'either order');
    assert.match(pointChange(order, locked9, openMorn, [locked9, lockedOut, openMorn]).why, /between/, 'a state between: the nearer pair');
    assert.match(pointChange(order, locked9, lockedOut).why, /same/);
    assert.match(pointChange(order, locked9, { ...goesOut }).why, /same thing/);
    assert.match(pointChange(order, lockedOut, { ...openMorn, time: { from: 'tout' } }).why, /which came first/);
    // The change needs a key: what Holmes asks ("where is the key?").
    const needs = pointImplications(r.entry, nameOf).entries;
    assert.deepEqual(needs.map((e) => [e.role, e.of, e.attr, e.value]), [['requires', '?', 'carrying', 'a key to the stable door']], 'only the key: the states are its premises');
    assert.deepEqual(needs[0].time, { after: 'tout', before: 'tmorn' });
});

test('persistence: a state lasts until something changes it; requirements are met, against, or unknown', () => {
    const entries = [locked9, openMorn];
    assert.equal(holdsBefore(order, entries, 'door', 'door', 'tnight').entry, locked9, 'locked at nine still holds at night');
    assert.equal(holdsBefore(order, entries, 'door', 'door', 't9'), null, 'nothing before nine');
    const [needOpen] = pointImplications(goesOut).entries;
    const s = requirementStatus(order, entries, needOpen);
    assert.deepEqual([s.status, s.entry, s.persisting], ['against', locked9, true], 'locked since nine: going out needs a change');
    const [notLocked, key] = pointImplications(locks, nameOf).entries;
    assert.equal(requirementStatus(order, [...entries, { ...needOpen, id: 'r1' }], notLocked).status, 'met', 'open (pointed out) is not locked');
    assert.equal(requirementStatus(order, entries, key).status, 'unknown', 'no line says he had a key');
    assert.equal(requirementStatus(order, [{ id: 'k', of: 'boy', attr: 'carrying', value: 'the stable key', time: { at: 'tout' } }], key).status, 'met');
});

test("the player's moves in order: entries from facts and from earlier entries; typed states contradict", () => {
    const facts = new Map([locked9, lockedOut, openMorn, goesOut, locks].map((f) => [f.id, f]));
    const moves = [{ move: 'b', of: 'f.out' }, { move: 'a', a: 'f.locked9', b: 'r:b:f.out:needs0' }, { move: 'b', of: 'r:a:f.locked9|r:b:f.out:needs0' }, { move: 'b', of: 'f.gone' }];
    const es = reasonedEntries(moves, (id) => facts.get(id), order, nameOf, (f) => f.given_at ?? f.para);
    assert.deepEqual(es.map((e) => e.id), ['r:b:f.out:needs0', 'r:a:f.locked9|r:b:f.out:needs0', 'r:b:r:a:f.locked9|r:b:f.out:needs0:needs1']);
    assert.ok(es.every((e) => e.given_at === 2));
    // Open and locked at one time contradict; open up to the boy's going out and locked from nine do not.
    const asState = (f) => ({ id: f.id, fact: f.id, kind: 'state', of: f.of, attr: f.attr, value: f.value, neg: !!f.neg, time: f.time });
    const w = { times, order, entities: [], questions: [], facts: [] };
    assert.equal(contradictions(w, [asState(locked9), asState(es[0])]).length, 0);
    assert.equal(contradictions(w, [asState(lockedOut), asState({ ...openMorn, time: { at: 'tout' } })]).length, 1);
});
