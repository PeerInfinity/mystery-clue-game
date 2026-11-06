import { test } from 'node:test';
import assert from 'node:assert/strict';
import { timeOrder, contradictions } from './world.js';
import { ACTIONS, changePath, pointChange, pointImplications, holdsBefore, requirementStatus, reasonedEntries, placeAt, sideOf, agentNeeds, checkFit, checkPlan, accountsFor, comparePlans, impliedSteps, stops } from './actions.js';
import { places } from './world.js';

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
        ['requires', 'boy', 'location', 'door', false, '{"at":"tout"}'],
        ['effects', 'door', 'door', 'locked', false, '{"from":"tout"}'],
    ]);
    assert.ok(entries.every((e) => e.reasoned.move === 'b' && e.reasoned.premises[0] === 'f.locks'));
    assert.deepEqual(pointImplications(goesOut).entries.map((e) => [e.attr, e.value]), [['door', 'open'], ['location', 'door']], 'going through: the door open, and at it');
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
    assert.deepEqual(es.map((e) => e.id), ['r:b:f.out:needs0', 'r:b:f.out:needs1', 'r:a:f.locked9|r:b:f.out:needs0', 'r:b:r:a:f.locked9|r:b:f.out:needs0:needs1'], 'someone: no place needed');
    assert.ok(es.every((e) => e.given_at === 2));
    // Open and locked at one time contradict; open up to the boy's going out and locked from nine do not.
    const asState = (f) => ({ id: f.id, fact: f.id, kind: 'state', of: f.of, attr: f.attr, value: f.value, neg: !!f.neg, time: f.time });
    const w = { times, order, entities: [], questions: [], facts: [] };
    assert.equal(contradictions(w, [asState(locked9), asState(es[0])]).length, 0);
    assert.equal(contradictions(w, [asState(lockedOut), asState({ ...openMorn, time: { at: 'tout' } })]).length, 1);
});

// The door's two sides: the stable (inside, with its stall) and the yard outside.
const yard = { entities: [{ id: 'yard', kind: 'place' }, { id: 'stable', kind: 'place', within: 'yard' }, { id: 'stall', kind: 'place', within: 'stable' }, { id: 'moor', kind: 'place' }] };
const ctx = { joins: { door: ['stable', 'yard'] }, places: places(yard), order };
const inStable = { id: 'f.in', of: 'boy', attr: 'location', value: 'stall', time: { from: 't9' } };

test('places: where a thing is at a time, which side of a door a place is on', () => {
    assert.equal(placeAt(order, [inStable], 'boy', 'tout'), inStable, 'a place lasts until something moves him');
    assert.equal(placeAt(order, [{ ...inStable, time: { from: 't9', to: 'tout' } }], 'boy', 'tout'), null, 'an interval that has ended');
    assert.equal(placeAt(order, [inStable], 'boy', 't9', true), null, 'strictly before');
    assert.deepEqual(['stall', 'stable', 'yard', 'moor', null].map((p) => sideOf(ctx, 'door', p)), [0, 0, 1, -1, -1]);
});

test('going through puts the agent on the other side; being at the door is a need', () => {
    const es = pointImplications(goesOut, nameOf, { ...ctx, entries: [inStable] }).entries;
    assert.deepEqual(es.filter((e) => e.role === 'effects').map((e) => [e.of, e.attr, e.value, JSON.stringify(e.time)]), [['boy', 'location', 'yard', '{"from":"tout"}']]);
    const at = es.find((e) => e.attr === 'location' && e.role === 'requires');
    assert.equal(requirementStatus(order, [inStable], at, ctx).status, 'met');
    assert.equal(requirementStatus(order, [{ ...inStable, value: 'moor' }], at, ctx).status, 'against');
    assert.equal(requirementStatus(order, [], at, ctx).status, 'unknown');
    const after = es.find((e) => e.role === 'effects');
    assert.equal(requirementStatus(order, [inStable, after], at, ctx).entry, inStable, 'his place once through is not where he was');
});

test('a hypothesis about who made a change: their needs, checked against the timeline', () => {
    const change = pointChange(order, lockedOut, openMorn).entry;
    const boy = agentNeeds(order, [inStable], change, 'boy', nameOf, ctx);
    assert.deepEqual(boy.map((n) => [n.req.attr, n.status]), [['carrying', 'unknown'], ['location', 'met']], 'in the stable all night; no line gives him a key');
    const man = agentNeeds(order, [{ id: 'f.m', of: 'man', attr: 'location', value: 'moor', time: { from: 't9' } }], change, 'man', nameOf, ctx);
    assert.deepEqual(man.map((n) => n.status), ['unknown', 'unknown'], 'on the moor at nine: over a window, it could still be');
    const keyed = agentNeeds(order, [{ id: 'k', of: 'man', attr: 'carrying', value: 'a duplicate key', time: { after: 'tout', before: 'tmorn' } }], change, 'man', nameOf, ctx);
    assert.equal(keyed[0].status, 'met');
});

// The stranger in small: he asks the boy for the tip; he wants the boy to have the paper.
const asks = { id: 'f.asks', of: 'man', attr: 'says', act: 'ask', to: 'boy', about: 'the tip', time: { at: 'tout' } };
const wantsPaper = { id: 'f.wants', of: 'man', attr: 'intends', goal: { of: 'boy', attr: 'carrying', value: 'paper' }, time: { at: 't9' } };
const aimTip = { id: 'aim.tip', of: 'man', attr: 'intends', goal: { of: 'man', attr: 'knows', value: 'the tip' } };
const aimWay = { id: 'aim.way', of: 'man', attr: 'intends', goal: { of: 'man', attr: 'knows', value: 'the way' } };
const kinds = (ks) => ({ itemKinds: (item) => (item === 'paper' ? ks : null), order });

test('move (c): an action serves an intention when what it brings about meets the goal', () => {
    assert.equal(checkFit(asks, aimTip, [], nameOf, kinds(null)).fits, true, 'asking for the tip: to know the tip');
    assert.equal(checkFit(asks, aimWay, [], nameOf, kinds(null)).fits, false, 'not to find the way');
    assert.match(checkFit(asks, { id: 'x', of: 'man' }).why, /no goal/);
});

test('move (c) along a chain: the paper serves the tip only through a linked step, and only if it makes the boy willing', () => {
    assert.equal(checkFit(wantsPaper, aimTip, [], nameOf, kinds(['money', 'message', 'drug'])).fits, false, 'nothing linked yet: no need it meets');
    const open = checkFit(wantsPaper, aimTip, [asks], nameOf, kinds(['money', 'message', 'drug']));
    assert.deepEqual([open.fits, open.cond.kinds, open.need.attr], ['if', ['money', 'message'], 'willing'], 'money or a message would make him willing to tell');
    assert.equal(checkFit(wantsPaper, aimTip, [asks], nameOf, kinds(['money'])).fits, true);
    assert.equal(checkFit(wantsPaper, aimTip, [asks], nameOf, kinds(['drug'])).fits, false, 'a drug would not: a poisoner does not ask the boy for a tip');
    assert.deepEqual(checkFit(wantsPaper, aimTip, [asks], nameOf, kinds(['drug'])).ruledOut, { item: 'paper', kinds: ['money', 'message'] }, 'what rules it out: the kind');
    assert.equal(checkFit(asks, aimWay, [], nameOf, kinds(['drug'])).ruledOut, undefined, 'no kind would make it fit');
});

test('does a plan account for this? only if it brings about the goal or a need of a step', () => {
    const plan = { id: 'p', agent: 'man', goal: { of: 'horse', attr: 'held_by', value: 'man' }, steps: [{ act: 'drug', to: 'boy', item: 'opium' }, { act: 'hide', thing: 'horse' }] };
    const k = kinds(['money', 'message', 'drug']);
    assert.equal(accountsFor(plan, wantsPaper, nameOf, k).fits, false, 'the paper: nothing the plan needs');
    assert.equal(accountsFor(plan, asks, nameOf, k).fits, false, 'asking for the tip: nor that');
    const sells = { id: 'f.sells', of: 'chemist', act: 'give', to: 'man', item: 'opium', time: { at: 't9' } };
    const r = accountsFor(plan, sells, nameOf, k);
    assert.deepEqual([r.fits, r.need.attr, r.need.value], [true, 'carrying', 'opium'], 'opium sold to him: the drugging needs it');
});

test('two plans compared: the steps and the unmet needs in one and not the other', () => {
    const steal = { id: 'p1', agent: 'man', time: { after: 't9', before: 'tmorn' }, goal: { of: 'horse', attr: 'held_by', value: 'man' }, steps: [{ act: 'drug', to: 'boy', item: 'opium' }, { act: ['unlock', 'open'], thing: 'door' }, { act: 'lead_out', thing: 'horse', via: 'door' }, { act: 'hide', thing: 'horse' }] };
    const injure = { id: 'p2', agent: 'man', time: { after: 't9', before: 'tmorn' }, goal: { of: 'horse', attr: 'condition', value: 'injured' }, steps: [{ act: 'drug', to: 'boy', item: 'opium' }, { act: ['unlock', 'open'], thing: 'door' }, { act: 'injure', thing: 'horse', via: 'door' }] };
    const r = comparePlans(steal, injure, [locked9], nameOf, { ...ctx, order });
    assert.deepEqual([r.a.reached, r.b.reached, r.shared], ['reached', 'reached', 2], 'each reaches its own goal; drugging and the door in both');
    assert.deepEqual(r.a.only.map((s) => s.act), ['lead_out', 'hide']);
    assert.deepEqual(r.b.only.map((s) => s.act), ['injure']);
    assert.deepEqual(r.a.open.map((n) => [n.req.of, n.req.value]), [['horse', 'door'], ['man', 'a hiding-place']], 'only the theft needs the horse at the door and a hiding-place');
    assert.deepEqual(r.b.open, []);
});

test("Straker's plan in small: an aim's intended last step, and a need the player's hypothesis adds", () => {
    // The stall is within the stable; the door joins the stable and the yard. The horse lives in the stall.
    const pl = places({ entities: [...yard.entities, { id: 'horse', kind: 'animal' }] });
    const c = { joins: { door: ['stable', 'yard'] }, places: pl, order, homes: (id) => id === 'horse' };
    const lives = { id: 'f.lives', of: 'horse', attr: 'lives_at', value: 'stall', time: { from: 't9' } };
    const leads = { id: 'h.leads', of: 'trainer', act: 'lead_out', thing: 'horse', via: 'door', time: { from: 't9', to: 'tmorn' } };
    const aim = { id: 'h.aim', of: 'trainer', attr: 'intends', goal: { of: 'horse', attr: 'condition', value: 'injured' }, step: { act: 'injure', thing: 'horse' }, time: { at: 'tout' } };
    assert.deepEqual(impliedSteps(aim).map((s) => [s.of, s.act, s.intended]), [['trainer', 'injure', true]]);
    const plain = { ...c, entries: [lives] };
    assert.equal(checkFit(leads, aim, [], nameOf, plain).fits, false, 'no reason circled: leading out serves nothing toward injuring');
    const heard = { ...plain, extraNeeds: { injure: [{ of: '$thing', away: 'stable' }] } };
    const r = checkFit(leads, aim, [], nameOf, heard);
    assert.deepEqual([r.fits, r.need.away, r.need.hyp], [true, 'stable', true], 'it would be heard: injuring needs the horse away from the stable, and leading out does that');
    assert.equal(requirementStatus(order, [lives], r.need, heard).status, 'against', 'in its stall it is in the stable');
    const plan = { id: 'p', agent: 'trainer', goal: aim.goal, steps: [leads, ...impliedSteps(aim)] };
    const d = checkPlan(plan, [lives], nameOf, heard);
    assert.equal(d.goal, 'intended', 'only the intended step would injure it');
    assert.equal(d.steps[1].needs.find((n) => n.req.away).by.step, 0, 'away from the stable: met by leading out');
    assert.ok(!d.steps[1].needs.some((n) => n.req.attr === 'location' && !n.req.away), 'no door named for the injuring: no need to be at one');
});

test('the guard: leading out needs the lad on watch unable to act; the dog, if it was quiet, to know the agent', () => {
    const pl = places({ entities: [...yard.entities, { id: 'horse', kind: 'animal' }, { id: 'dog', kind: 'animal' }, { id: 'villa', kind: 'place', within: 'yard' }, { id: 'town', kind: 'place' }] });
    const watch = { id: 'f.watch', of: 'boy', attr: 'role', value: 'on guard', guards: 'stable', time: { from: 't9', to: 'tmorn' } };
    const home = { id: 'f.home', of: 'trainer', attr: 'lives_at', value: 'villa', time: { from: 't9' } };
    const away = { id: 'f.away', of: 'tout', attr: 'lives_at', value: 'town', time: { from: 't9' } };
    const c = { joins: { door: ['stable', 'yard'] }, places: pl, order, entries: [watch, home, away], extraNeeds: { lead_out: [{ of: 'dog', knows: '$agent', among: '$via' }] } };
    const leads = (who) => ({ id: `h.leads.${who}`, of: who, act: 'lead_out', thing: 'horse', via: 'door', time: { from: 'tout', to: 'tmorn' } });
    const needs = (who) => pointImplications(leads(who), nameOf, c).entries.filter((e) => e.role === 'requires');
    const guard = needs('trainer').find((e) => e.guard);
    assert.deepEqual([guard.of, guard.value, guard.by], ['boy', 'unable to act', 'f.watch'], 'one need per guard on watch');
    assert.ok(!needs('boy').some((e) => e.guard), 'the guard himself needs no guard out of the way');
    assert.equal(requirementStatus(order, c.entries, guard, c).status, 'unknown', 'nothing says the boy was drugged');
    const drugs = { id: 'h.drugs', of: 'trainer', act: 'drug', to: 'boy', item: 'opium', time: { after: 't9', before: 'tout' } };
    const aim = { id: 'h.aim', of: 'trainer', attr: 'intends', goal: { of: 'horse', attr: 'condition', value: 'injured' }, step: { act: 'injure', thing: 'horse' }, time: { at: 'tout' } };
    const fit = checkFit(drugs, aim, [leads('trainer')], nameOf, c);
    assert.deepEqual([fit.fits, fit.need.guard], [true, 'stable'], 'the guard drugged so that the horse could be taken: the drugging serves the plan');
    assert.equal(checkFit({ ...drugs, of: 'wife' }, aim, [leads('trainer')], nameOf, c).other, true, "one culprit: the wife's drugging is not the trainer's doing");
    const dog = (who) => needs(who).find((e) => e.knows);
    assert.equal(requirementStatus(order, c.entries, dog('trainer'), c).status, 'met', 'the dog knows those who live at the yard');
    assert.equal(requirementStatus(order, c.entries, dog('tout'), c).status, 'unknown', 'a stranger from town: nothing says it knew him');
    assert.ok(!pointImplications({ ...leads('trainer'), via: undefined }, nameOf, c).entries.some((e) => e.guard), 'no door: no guard');
});

test('what stopped an intended step: an action that left its agent unable to act, in time', () => {
    const step = { id: 's', of: 'trainer', act: 'injure', thing: 'horse', intended: true, time: { after: 't9', before: 'tmorn' } };
    const kick = { id: 'k', of: 'horse', act: 'strike', to: 'trainer', time: { at: 'tout' } };
    assert.deepEqual([stops(kick, step, nameOf, { order }).stops, stops(kick, step, nameOf, { order }).effect.value], [true, 'struck down']);
    assert.equal(stops({ ...kick, to: 'boy' }, step, nameOf, { order }).stops, false, 'someone else struck down');
    assert.equal(stops({ ...kick, time: { at: 'tlater' } }, step, nameOf, { order: timeOrder([...times, { id: 'tlater', after: 'tmorn' }]) }).stops, false, 'too late');
});

test('a link that stops fitting is listed with why; one not yet told is not', () => {
    const tip = { ...aimTip, para: 1 }, facts = new Map([asks, wantsPaper, tip].map((f) => [f.id, { para: 1, ...f }]));
    const moves = [{ move: 'c', of: asks.id, for: tip.id }, { move: 'c', of: wantsPaper.id, for: tip.id }, { move: 'c', of: asks.id, for: 'hyp:gone' }];
    const run = (ks, given = (f) => f.para) => { const lapsed = []; const es = reasonedEntries(moves, (id) => facts.get(id), order, nameOf, given, { ...kinds(ks), lapsed }); return { es, lapsed }; };
    const ok = run(['money', 'drug']);
    assert.equal(ok.es.length, 2);
    assert.deepEqual(ok.lapsed.map((l) => l.gone), ['hyp:gone'], 'an aim no longer circled');
    const drug = run(['drug']);
    assert.equal(drug.es.length, 1);
    assert.deepEqual(drug.lapsed.map((l) => [l.move.of, l.ruledOut?.kinds]), [[wantsPaper.id, ['money', 'message']], [asks.id, undefined]]);
    assert.deepEqual(run(['drug'], () => undefined).lapsed.map((l) => l.gone), ['hyp:gone'], 'not yet told: not listed');
});

test('move (d): a plan, each need met by an earlier step, the timeline, or nothing', () => {
    const plan = {
        id: 'plan.police', agent: 'man', time: { after: 't9', before: 'tmorn' }, goal: { of: 'horse', attr: 'held_by', value: 'man' },
        steps: [
            { act: 'drug', to: 'boy', item: 'opium' }, { act: ['unlock', 'open'], thing: 'door' },
            { act: 'lead_out', thing: 'horse', via: 'door' }, { act: 'hide', thing: 'horse' },
        ],
    };
    const entries = [locked9, { id: 'f.horse', of: 'horse', attr: 'lives_at', value: 'stall', time: { from: 't9' } }, { id: 'f.stick', of: 'stick', attr: 'owner', value: 'man', time: { from: 't9' } },
        { id: 'f.seen', of: 'man', attr: 'location', value: 'yard', time: { at: 't9' } }];
    const r = checkPlan(plan, entries, nameOf, { ...ctx, order, homes: (id) => id === 'horse' });
    assert.equal(r.goal, 'reached', 'the steps reach the goal');
    const status = (i, attr) => r.steps[i].needs.find((n) => n.req.attr === attr)?.status;
    assert.equal(status(1, 'door'), 'met', 'locked since nine, as unlocking needs');
    assert.equal(r.steps[2].needs.find((n) => n.req.attr === 'door').by.step, 1, 'the door open: by the step before');
    assert.equal(r.steps[2].needs.find((n) => n.req.of === 'horse').status, 'met', 'the horse lives in its stall, inside the door');
    assert.equal(r.steps[1].needs.find((n) => n.req.attr === 'location').status, 'unknown', 'seen in the yard at nine: not there all night');
    assert.deepEqual(r.open.map((n) => `${n.req.of} ${n.req.attr} ${n.req.value}`), [
        'man carrying opium', 'man carrying a key to the stable door', 'man location door', 'man location door', 'man knows a hiding-place',
    ], 'who sold the opium, where is the key, where could he hide the horse');
    const armed = checkPlan({ ...plan, steps: [{ act: 'strike', to: 'boy', item: 'stick' }] }, entries, nameOf, { ...ctx, order });
    assert.equal(armed.open.length, 0, 'his own stick: owning it will do');
});

test('two names of one person: a need of one is met by an entry of the other', () => {
    const same = (a, b) => a === b || (new Set([a, b]).size === 2 && [a, b].every((x) => ['man', 'stranger'].includes(x)));
    const req = pointImplications({ id: 's', of: 'man', act: 'strike', to: 'boy', item: 'stick', time: { at: 'tout' } }).entries[0];
    const e = [{ id: 'c', of: 'stranger', attr: 'carrying', value: 'stick', time: { at: 't9' } }];
    assert.equal(requirementStatus(order, e, req).status, 'unknown');
    assert.equal(requirementStatus(order, e, req, { same }).status, 'met');
});
