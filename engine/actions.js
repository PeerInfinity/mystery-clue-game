// Actions, typed states and intentions for the world model (the player's moves on Watson's timeline).
//
// A typed state is an attribute with exclusive values (`STATES`): a door is open, shut or locked, never two at once.
// An action is an event that changes a state: the generic table (`ACTIONS`) gives each action type what it requires
// just before and what it effects just after, in terms of its roles: `agent` (the fact's `of`), `thing` (what it acts
// on), `to` (the one it is done to), `item` (what is given, used or carried), `about` (what is asked) and `via` (the
// door gone through). A fact is a typed action when it has `act`; its roles are fields of the same names.
//
// An intention is a goal (a state in the world model's own shape, `goal: {of, attr, value}`) and a plan (typed
// actions whose effects feed the next step's requirements). A claim may carry a plan (`plan: {agent, goal, time,
// steps}`): the police theory is Simpson's plan.
//
// Persistence: a state lasts until something specific changes it (`holdsBefore`, `placeAt`). Events the story never
// tells are not invented: the player points them out, and the engine checks each move by these generic rules.
// - (a) `pointChange`: two states of one thing differ, so an action of change took place between them, by someone.
// - (b) `pointImplications`: an action, so what it requires and what it effects.
// - (c) `checkFit`: "what is this for?": an action or an intention serves an intention, if what it brings about meets
//   the goal or a need of a step already linked to it.
// - (d) `checkPlan`: "what would this need?": a plan's steps in order, each need met by an earlier step, by the
//   timeline, or by nothing.
// What the player points out is an entry of the world model with the source *Watson's reasoning* (`REASONING`), as
// trusted as its weakest premise.

import { coverOf, STATES } from './world.js';

export { STATES };

/**
 * The generic action table. A rule names its subject by role (`of: '$agent'`) and is one of:
 * - `{of, state, value, neg?}`: a typed state (a door's); `{of, attr, value, neg?}`: any other state (`value` a role
 *   or a literal);
 * - `{of, key: role}`: carrying a key to it; `{of, carrying: role}`: carrying it (owning it will do);
 * - `{of, at: door}`: on one of a door's two sides (`joins` in the data);
 * - effects only: `{of, through: door}`: on the other side of the door from where it was just before.
 * An effect with `kinds` holds only if the item is of one of those kinds (a paper of money makes its taker willing; a
 * paper of opium does not).
 */
export const ACTIONS = {
    lock: { label: 'locking', requires: [{ of: '$thing', state: 'door', value: 'locked', neg: true }, { of: '$agent', key: '$thing' }, { of: '$agent', at: '$thing' }], effects: [{ of: '$thing', state: 'door', value: 'locked' }] },
    unlock: { label: 'unlocking', requires: [{ of: '$thing', state: 'door', value: 'locked' }, { of: '$agent', key: '$thing' }, { of: '$agent', at: '$thing' }], effects: [{ of: '$thing', state: 'door', value: 'shut' }] },
    open: { label: 'opening', requires: [{ of: '$thing', state: 'door', value: 'shut' }, { of: '$agent', at: '$thing' }], effects: [{ of: '$thing', state: 'door', value: 'open' }] },
    close: { label: 'shutting', requires: [{ of: '$thing', state: 'door', value: 'open' }, { of: '$agent', at: '$thing' }], effects: [{ of: '$thing', state: 'door', value: 'shut' }] },
    go_through: { label: 'going through', requires: [{ of: '$thing', state: 'door', value: 'open' }, { of: '$agent', at: '$thing' }], effects: [{ of: '$agent', through: '$thing' }] },
    lead_out: { label: 'leading out', requires: [{ of: '$via', state: 'door', value: 'open' }, { of: '$agent', at: '$via' }, { of: '$thing', at: '$via' }], effects: [{ of: '$thing', through: '$via' }, { of: '$agent', through: '$via' }] },
    give: { label: 'giving', requires: [{ of: '$agent', carrying: '$item' }], effects: [{ of: '$to', attr: 'carrying', value: '$item' }, { of: '$to', attr: 'willing', value: '$agent', kinds: ['money', 'message'] }] },
    ask: { label: 'asking', requires: [{ of: '$to', attr: 'willing', value: '$agent' }], effects: [{ of: '$agent', attr: 'knows', value: '$about' }] },
    drug: { label: 'drugging', requires: [{ of: '$agent', carrying: '$item' }], effects: [{ of: '$to', attr: 'condition', value: 'drugged' }] },
    strike: { label: 'striking', requires: [{ of: '$agent', carrying: '$item' }], effects: [{ of: '$to', attr: 'condition', value: 'struck down' }] },
    injure: { label: 'injuring', requires: [{ of: '$via', state: 'door', value: 'open' }, { of: '$agent', at: '$via' }], effects: [{ of: '$thing', attr: 'condition', value: 'injured' }] },
    hide: { label: 'hiding', requires: [{ of: '$agent', attr: 'knows', value: 'a hiding-place' }], effects: [{ of: '$thing', attr: 'held_by', value: '$agent' }] },
};
/** What a goal of carrying an item brings with it, by the item's kind (the same rule as `give`'s). */
const CARRY_RAMIFIES = { attr: 'willing', kinds: ['money', 'message'] };

export const REASONING = 'watsons_reasoning';
const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const anchorOf = (t) => (t ? (t.at ?? t.from ?? t.after ?? t.before ?? t.to) : null);
const startOf = (t) => (t ? (t.at ?? t.from ?? t.after ?? null) : null);
const isTyped = (f) => f && STATES[f.attr] && f.value != null;
const eq = (ctx) => ctx.same ?? ((a, b) => a === b);

/** A role of an action: `$agent` is its `of`; any other `$name` its field of that name; anything else a literal. */
function roleOf(f, r) {
    if (typeof r !== 'string' || !r.startsWith('$')) return r;
    return r === '$agent' ? f.of : f[r.slice(1)];
}

/**
 * Where a thing is at time `t`, as far as `entries` say: a location covering `t`, or the latest one starting before
 * it that has no end (a place lasts until something moves it). `strict`: starting strictly before `t`. `homes`: for
 * a thing whose home is its place unless something moves it (a horse in its stall), its `lives_at` will do.
 */
export function placeAt(order, entries, of, t, strict = false, same = (a, b) => a === b, homes = null) {
    const starts = (e) => { const s = startOf(e.time); return s && (strict ? order.lt(s, t) : order.le(s, t)); };
    const ok = (e) => {
        if (e.attr !== 'location' || !same(e.of, of) || e.neg || typeof e.value !== 'string' || !starts(e)) return false;
        const c = coverOf(e.time);
        if (e.time?.to && c) return c.incl ? order.le(t, c.end) : order.lt(t, c.end);
        return true;
    };
    let cands = entries.filter(ok);
    if (!cands.length && homes?.(of)) cands = entries.filter((e) => ok({ ...e, attr: e.attr === 'lives_at' ? 'location' : null }));
    const latest = cands.filter((e) => !cands.some((o) => o !== e && order.lt(startOf(e.time), startOf(o.time))));
    return latest.length === 1 || new Set(latest.map((e) => e.value)).size === 1 ? latest[0] ?? null : null;
}
/** Which side of a door a place is on: 0 inside (within the inner side), 1 outside (the outer side itself), or -1. */
export function sideOf(ctx, door, place) {
    const sides = ctx.joins?.[door];
    if (!sides || !place) return -1;
    if (place === sides[1]) return 1;
    return (ctx.places?.chain(place) ?? [place]).includes(sides[0]) ? 0 : -1;
}

/** The shortest run of actions that takes a state of a thing from one value to another (locked to open: unlock, open). */
export function changePath(attr, from, to) {
    if (from === to) return null;
    const own = (a) => a.effects.find((e) => e.of === '$thing' && e.state === attr);
    const seen = new Set([from]);
    let frontier = [[from, []]];
    while (frontier.length) {
        const next = [];
        for (const [v, path] of frontier) for (const [type, a] of Object.entries(ACTIONS)) {
            const eff = own(a);
            if (!eff) continue;
            const ok = a.requires.every((r) => r.of !== '$thing' || r.state !== attr || (r.neg ? r.value !== v : r.value === v));
            if (!ok) continue;
            if (eff.value === to) return [...path, type];
            if (!seen.has(eff.value)) { seen.add(eff.value); next.push([eff.value, [...path, type]]); }
        }
        frontier = next;
    }
    return null;
}

/** A run of action types as one action: the first one's state needs, every other need, the last one's effects. */
function pathRules(types) {
    const requires = [], effects = [];
    types.forEach((t, i) => {
        for (const r of ACTIONS[t].requires) if (!r.state || i === 0) if (!requires.some((x) => JSON.stringify(x) === JSON.stringify(r))) requires.push(r);
        if (i === types.length - 1) effects.push(...ACTIONS[t].effects);
    });
    return { requires, effects };
}

/** The kinds an item may be, as the context says (the paper: money, a message or a drug, as the player has it). */
const kindsOf = (ctx, item) => ctx.itemKinds?.(item) ?? null;
/** An effect that depends on the item's kind: `true` (it holds), `false`, or the kinds it holds for. */
function kindHolds(ctx, item, kinds) {
    if (ctx.anyKind) return kinds;
    const ks = kindsOf(ctx, item);
    if (!ks) return false;
    const fit = ks.filter((k) => kinds.includes(k));
    if (!fit.length) return false;
    return fit.length === ks.length ? true : fit;
}

/**
 * Move (b): what an action requires just before it and effects just after, as entries. `f`: a typed action (`act`
 * and its roles; a change from move (a) has a run of types). `nameOf`: entity id → name. A requirement holds up to
 * the action (`{to}`), or over the action's own window if it has no point; an effect from it (`{from}`). An effect
 * that holds only for some kinds of the item carries `cond` (those kinds).
 */
export function pointImplications(f, nameOf = (id) => id, ctx = {}) {
    const types = list(f.act);
    if (!types.length || types.some((t) => !ACTIONS[t])) return { why: 'Not an action the engine knows the rules of.' };
    // A change pointed out by move (a) is already between the two states it came from: only its other needs are new.
    const change = f.from != null;
    const { requires, effects } = pathRules(types);
    const R = (r) => roleOf(f, r);
    const t = f.time ?? {};
    const point = t.at ?? null;
    const before = point ? { to: point } : { ...t };
    const during = point ? { at: point } : { ...t };
    const after = point ? { from: point } : t.before ? { from: t.before } : null;
    const out = [];
    requires.forEach((r, i) => {
        const base = { id: `r:b:${f.id}:needs${i}`, role: 'requires', time: before, of: R(r.of) };
        if (base.of == null) return;
        if (r.state) { if (!change) out.push({ ...base, attr: r.state, value: r.value, neg: !!r.neg }); }
        else if (r.key) out.push({ ...base, attr: 'carrying', value: `a key to ${String(nameOf(R(r.key))).replace(/^The /, 'the ')}`, key: R(r.key), time: during });
        else if (r.at) { if (base.of !== '?') out.push({ ...base, attr: 'location', value: R(r.at), at: R(r.at), time: during }); }
        else if (r.carrying) out.push({ ...base, attr: 'carrying', value: R(r.carrying), item: R(r.carrying), time: during });
        else out.push({ ...base, attr: r.attr, value: R(r.value), neg: !!r.neg, time: during });
    });
    if (after && !change) effects.forEach((e, i) => {
        const id = `r:b:${f.id}:does${i}`;
        const of = R(e.of);
        if (of == null) return;
        if (e.state) out.push({ id, role: 'effects', time: after, of, attr: e.state, value: e.value, neg: false });
        else if (e.through) {
            // Through the door: on the other side from where it was just before (if the timeline says).
            if (!point || !ctx.entries) return;
            const door = R(e.through);
            const was = placeAt(ctx.order, ctx.entries, of, point, true, eq(ctx));
            const side = sideOf(ctx, door, was?.value);
            if (side >= 0) out.push({ id, role: 'effects', time: after, of, attr: 'location', value: ctx.joins[door][1 - side], neg: false });
        } else {
            const holds = e.kinds ? kindHolds(ctx, R('$item'), e.kinds) : true;
            if (holds === false) return;
            out.push({ id, role: 'effects', time: after, of, attr: e.attr, value: R(e.value), neg: false, ...(holds === true ? {} : { cond: { item: R('$item'), kinds: holds } }) });
        }
    });
    return { entries: out.map((e) => ({ ...e, reasoned: { move: 'b', premises: [f.id], role: e.role } })) };
}

/**
 * Move (a): two states of one thing differ, so something changed it between them. `a`, `b`: typed states (either
 * order); `known`: the entries on the timeline (to refuse a pair with a state or a change between). Returns the
 * change as an action entry by someone ("?"), between the two, or `why` it is refused.
 */
export function pointChange(order, a, b, known = []) {
    if (!isTyped(a) || !isTyped(b) || a.of !== b.of || a.attr !== b.attr) return { why: 'Two states of the same thing, please.' };
    if (a.neg || b.neg) return { why: 'A state that says what something is not does not say what it changed from.' };
    if (a.value === b.value) return { why: 'They are the same: nothing changed.' };
    let [x, y] = [a, b];
    const sx = startOf(x.time), sy = anchorOf(y.time);
    if (!(sx && sy && order.lt(sx, sy))) {
        [x, y] = [b, a];
        if (!(startOf(x.time) && anchorOf(y.time) && order.lt(startOf(x.time), anchorOf(y.time)))) return { why: 'The timeline does not say which came first.' };
    }
    const from = startOf(x.time), to = anchorOf(y.time);
    const between = (e) => e !== x && e !== y && startOf(e.time) && order.lt(from, startOf(e.time)) && order.lt(startOf(e.time), to);
    const mid = known.find((e) => between(e) && ((isTyped(e) && !e.neg && e.of === x.of && e.attr === x.attr) || ((e.thing === x.of || e.via === x.of) && list(e.act).length)));
    if (mid) return { why: 'Something on the timeline lies between them: point out the change from the nearer one.', mid };
    const path = changePath(x.attr, x.value, y.value);
    if (!path) return { why: 'No action the engine knows changes one into the other.' };
    const label = path.map((t) => ACTIONS[t].label).join(' and ');
    return {
        entry: {
            id: `r:a:${x.id}|${y.id}`, of: '?', attr: 'action', act: path, thing: x.of, from: x.value, to: y.value,
            value: `${label} ${x.of}`, time: { after: from, before: to },
            reasoned: { move: 'a', premises: [x.id, y.id] },
        },
    };
}

/**
 * Persistence: the value a typed state of `of` has just before time `t`, as far as the entries say: the latest state
 * starting certainly before `t`, lasting until something specific changes it (or one said to hold up to `t`).
 * Returns `{entry, value}`, `{ambiguous}` when the latest are several and differ, or null when nothing says.
 */
export function holdsBefore(order, entries, of, attr, t) {
    // A state said to hold up to `t` (a requirement of an action at t) is the one just before it.
    const upTo = entries.filter((e) => isTyped(e) && !e.neg && e.of === of && e.attr === attr && e.time?.to === t);
    if (upTo.length) return new Set(upTo.map((e) => e.value)).size > 1 ? { ambiguous: upTo } : { entry: upTo[0], value: upTo[0].value };
    const cands = entries.filter((e) => isTyped(e) && !e.neg && e.of === of && e.attr === attr && startOf(e.time) && order.lt(startOf(e.time), t));
    const latest = cands.filter((e) => !cands.some((o) => o !== e && order.lt(startOf(e.time), startOf(o.time))));
    if (!latest.length) return null;
    const values = new Set(latest.map((e) => e.value));
    if (values.size > 1) return { ambiguous: latest };
    return { entry: latest[0], value: latest[0].value };
}

/**
 * Whether a requirement is met by the timeline: `met` (by an entry), `against` (persistence gives another value, or
 * an entry denies it), or `unknown` (nothing says). `req`: an entry from `pointImplications`. `ctx`: `{joins,
 * places}` for being at a door, `same` for two names of one person (the stranger and Simpson, once identified).
 */
export function requirementStatus(order, entries, req, ctx = {}) {
    const same = eq(ctx);
    const t = anchorOf(req.time);
    const others = entries.filter((e) => e.id !== req.id);
    const notAfter = (e) => { const s = startOf(e.time); return !s || !t || !order.lt(t, s); };
    if (req.at) {
        // At the door: a place on one of its sides. Over a window, any place on a side within it will do.
        // Just before the action: a place starting at its own point (going through puts him outside) does not count.
        const p = placeAt(order, others, req.of, t, !!req.time?.at, same, ctx.homes);
        // Over a window, a place seen only at a point before it does not last the night (a stranger seen at nine).
        const window = req.time?.after && req.time?.before;
        if (p && sideOf(ctx, req.at, p.value) >= 0 && !(window && p.time?.at)) return { status: 'met', entry: p };
        if (window) {
            const inside = others.find((e) => e.attr === 'location' && same(e.of, req.of) && !e.neg && startOf(e.time) && order.lt(req.time.after, startOf(e.time)) && order.lt(startOf(e.time), req.time.before) && sideOf(ctx, req.at, e.value) >= 0);
            if (inside) return { status: 'met', entry: inside };
            return { status: 'unknown', entry: p ?? undefined };
        }
        return p ? { status: 'against', entry: p } : { status: 'unknown' };
    }
    if (req.key) {
        const c = coverOf(req.time);
        const has = others.find((e) => e.attr === 'carrying' && same(e.of, req.of) && (e.key === req.key || /\bkey\b/.test(String(e.value))) && (!c || anchorOf(e.time) === t));
        return has ? { status: 'met', entry: has } : { status: 'unknown' };
    }
    if (req.item) {
        const has = others.find((e) => ((e.attr === 'carrying' && same(e.of, req.of) && String(e.value).split(/[ ,]/)[0] === req.item)
            || (e.attr === 'owner' && e.of === req.item && same(e.value, req.of))) && notAfter(e));
        return has ? { status: 'met', entry: has } : { status: 'unknown' };
    }
    if (STATES[req.attr]) {
        const exact = others.find((e) => e.of === req.of && e.attr === req.attr && e.value === req.value && !!e.neg === !!req.neg && anchorOf(e.time) === t);
        if (exact) return { status: 'met', entry: exact };
        const h = holdsBefore(order, others, req.of, req.attr, t);
        if (!h) return { status: 'unknown' };
        if (h.ambiguous) return { status: 'unknown', ambiguous: h.ambiguous };
        const ok = req.neg ? h.value !== req.value : h.value === req.value;
        return { status: ok ? 'met' : 'against', entry: h.entry, persisting: true };
    }
    // Any other state: an entry saying so, not after the time it is needed.
    const has = others.find((e) => same(e.of, req.of) && e.attr === req.attr && same(e.value, req.value) && !!e.neg === !!req.neg && notAfter(e));
    return has ? { status: 'met', entry: has } : { status: 'unknown' };
}

/** Whether an effect (or a goal) meets a need: the same state of the same thing (a door not locked: open or shut). */
export function meets(eff, req, ctx = {}) {
    const same = eq(ctx);
    if (!same(eff.of, req.of)) return false;
    if (req.at) return eff.attr === 'location' && sideOf(ctx, req.at, eff.value) >= 0;
    if (req.key) return eff.attr === 'carrying' && (eff.key === req.key || /\bkey\b/.test(String(eff.value)));
    if (eff.attr !== req.attr) return false;
    if (STATES[req.attr]) return req.neg ? eff.value !== req.value : eff.value === req.value;
    return same(eff.value, req.value) && !!eff.neg === !!req.neg;
}

/**
 * What an action or an intention brings about: an action's effects; an intention's goal, with what that goal brings
 * with it (carrying an item of money or a message makes the carrier willing toward the one who wants it so).
 */
export function productsOf(x, nameOf, ctx = {}) {
    if (list(x.act).length) return (pointImplications(x, nameOf, ctx).entries ?? []).filter((e) => e.role === 'effects');
    if (!x.goal) return [];
    const g = { id: `${x.id}:goal`, of: x.goal.of, attr: x.goal.attr, value: x.goal.value, neg: false, time: x.time };
    const out = [g];
    if (g.attr === 'carrying' && x.of) {
        const holds = kindHolds(ctx, g.value, CARRY_RAMIFIES.kinds);
        if (holds !== false) out.push({ id: `${x.id}:goal1`, of: g.of, attr: CARRY_RAMIFIES.attr, value: x.of, neg: false, time: x.time, ...(holds === true ? {} : { cond: { item: g.value, kinds: holds } }) });
    }
    return out;
}

/**
 * Move (c), "what is this for?": whether `x` (a typed action, or an intention with a goal) serves the intention
 * `target`: something it brings about meets the target's goal, or a need of a step already linked to it (`linked`:
 * the actions so linked). Returns `{fits: true, product, need}`, `{fits: 'if', product, need, cond}` (only for some
 * kinds of an item), or `{fits: false, why}`.
 */
export function checkFit(x, target, linked = [], nameOf = (id) => id, ctx = {}) {
    if (!target.goal) return { fits: false, why: 'That intention has no goal the engine can read.' };
    const products = productsOf(x, nameOf, ctx);
    if (!products.length) return { fits: false, why: 'The engine does not know what this brings about.' };
    const goal = { of: target.goal.of, attr: target.goal.attr, value: target.goal.value, neg: false };
    const needs = [goal, ...linked.flatMap((s) => (pointImplications(s, nameOf, ctx).entries ?? []).filter((e) => e.role === 'requires'))];
    let conditional = null;
    for (const n of needs) for (const p of products) {
        if (!meets(p, n, ctx)) continue;
        if (!p.cond) return { fits: true, product: p, need: n };
        conditional ??= { fits: 'if', product: p, need: n, cond: p.cond };
    }
    if (conditional) return conditional;
    // Would it fit if the item could be any kind? Then what rules it out is the kind the player has it as.
    if (!ctx.anyKind) {
        const any = checkFit(x, target, linked, nameOf, { ...ctx, anyKind: true });
        if (any.fits) return { fits: false, ruledOut: any.cond, why: `It would fit only if ${nameOf(any.cond.item)} were one of: ${any.cond.kinds.join(', ')}; you have ruled that out.` };
    }
    return { fits: false, why: 'Nothing it brings about meets the goal, or a need of a step already linked to it.' };
}

/**
 * Move (d), "what would this need?": a plan's steps in order (`plan.steps`: typed actions; a step's agent is its own
 * `of` or the plan's `agent`, its time its own or the plan's), each need met by an earlier step's effect, by the
 * timeline (`entries`), or by nothing; and whether the steps reach the goal. `open`: the needs nothing meets.
 */
/** A plan's steps as actions: each with an id, its agent (its own or the plan's) and its time (its own or the plan's). */
const planSteps = (plan) => (plan.steps ?? []).map((s, i) => ({ ...s, id: s.id ?? `${plan.id}#${i}`, of: s.of ?? plan.agent, time: s.time ?? plan.time }));

export function checkPlan(plan, entries, nameOf = (id) => id, ctx = {}) {
    const produced = [];
    const steps = planSteps(plan).map((f, i) => {
        const es = pointImplications(f, nameOf, ctx).entries ?? [];
        const needs = es.filter((e) => e.role === 'requires').map((req) => {
            const by = produced.find((p) => !p.cond && meets(p, req, ctx));
            return by ? { req, status: 'met', by } : { req, ...requirementStatus(ctx.order, entries, req, ctx) };
        });
        produced.push(...es.filter((e) => e.role === 'effects').map((e) => ({ ...e, step: i })));
        return { step: f, needs };
    });
    const goal = plan.goal ? (produced.some((p) => !p.cond && meets(p, { ...plan.goal, neg: false }, ctx)) ? 'reached' : 'not reached') : null;
    return { steps, goal, open: steps.flatMap((s) => s.needs.filter((n) => n.status !== 'met').map((n) => ({ ...n, step: s.step }))) };
}

/**
 * "Does this plan account for this?": whether an action or an intention outside the plan (the stranger's wish that
 * the boy has the paper) brings about something the plan needs: its goal, or a need of one of its steps. As move (c),
 * with the plan's steps as the steps linked: `{fits: true | 'if', need, cond?}` or `{fits: false, why}`.
 */
export function accountsFor(plan, x, nameOf = (id) => id, ctx = {}) {
    if (!plan.goal) return { fits: false, why: 'The plan has no goal the engine can read.' };
    return checkFit(x, { goal: plan.goal }, planSteps(plan), nameOf, ctx);
}

/**
 * Two plans compared (the police theory and Holmes's "why not injure it there?"): each one's goal and whether its
 * steps reach it, the steps in one and not the other (the same action on the same things), and the needs nothing on
 * the timeline meets, in one and not the other. `{a: {goal, reached, only, open}, b: {...}, shared}`.
 */
export function comparePlans(pa, pb, entries, nameOf = (id) => id, ctx = {}) {
    const sig = (s) => JSON.stringify([[...list(s.act)].sort(), s.of ?? null, s.thing ?? null, s.to ?? null, s.item ?? null, s.via ?? null]);
    const needSig = (n) => JSON.stringify([n.req.of, n.req.attr, n.req.value, !!n.req.neg]);
    const [ra, rb] = [pa, pb].map((p) => checkPlan(p, entries, nameOf, ctx));
    const [sa, sb] = [ra, rb].map((r) => r.steps.map((s) => ({ ...s.step, of: s.step.of })));
    const ka = new Set(sa.map(sig)), kb = new Set(sb.map(sig));
    const [na, nb] = [ra, rb].map((r) => new Set(r.open.map(needSig)));
    const side = (p, r, steps, other, mine, theirs) => ({
        goal: p.goal ?? null, reached: r.goal, steps: steps.length,
        only: steps.filter((s) => !other.has(sig(s))),
        open: [...new Map(r.open.filter((n) => !theirs.has(needSig(n))).map((n) => [needSig(n), n])).values()],
    });
    return { a: side(pa, ra, sa, kb, na, nb), b: side(pb, rb, sb, ka, nb, na), shared: sa.filter((s) => kb.has(sig(s))).length };
}

/**
 * The entries the player's moves give, in the order made; a move whose premises are gone, or that no longer holds,
 * gives nothing, and is listed in `ctx.lapsed` (if given) as `{move, why, gone?, ruledOut?}`: `gone`, the premise no
 * longer there (a hypothesis no longer circled). A move whose premises are not yet told is not listed. The moves that
 * hold are listed in `ctx.held`, if given. `moves`:
 * `[{move: 'a', a, b} | {move: 'b', of} | {move: 'c', of, for}]`; `lookup`: id → a fact or an earlier entry;
 * `givenAt`: when an entry is told. A move (c) gives the link "this, in order that that": `{attr: 'purpose', for,
 * serves}`, at the time of what it links.
 */
export function reasonedEntries(moves, lookup, order, nameOf, givenAt, ctx = {}) {
    const out = new Map();
    const find = (id) => out.get(id) ?? lookup(id);
    const linkedTo = (tid) => [...out.values()].filter((e) => e.reasoned.move === 'c' && e.for === tid).map((e) => find(e.reasoned.premises[0])).filter((s) => s && list(s.act).length);
    for (const m of moves) {
        const premises = m.move === 'a' ? [m.a, m.b] : m.move === 'c' ? [m.of, m.for] : [m.of];
        const ps = premises.map(find);
        const lapse = (x) => ctx.lapsed?.push({ move: m, ...x });
        const gone = premises.find((id, i) => !ps[i]);
        if (gone) { lapse({ gone, why: 'What it was reasoned from is no longer there.' }); continue; }
        const given = Math.max(...ps.map((p) => givenAt(p) ?? Infinity));
        if (!Number.isFinite(given)) continue;
        const c = { ...ctx, order };
        let r;
        if (m.move === 'a') r = pointChange(order, ps[0], ps[1]);
        else if (m.move === 'b') r = pointImplications(ps[0], nameOf, c);
        else {
            const fit = checkFit(ps[0], ps[1], linkedTo(ps[1].id), nameOf, c);
            if (!fit.fits) { lapse({ why: fit.why, ...(fit.ruledOut ? { ruledOut: fit.ruledOut } : {}) }); continue; }
            r = { entry: { id: `r:c:${ps[0].id}>${ps[1].id}`, of: ps[0].of, attr: 'purpose', for: ps[1].id, serves: fit.need, ...(fit.cond ? { cond: fit.cond } : {}), value: `in order that ${fit.need.of} ${fit.need.attr} ${fit.need.value}`, time: ps[0].time, reasoned: { move: 'c', premises } } };
        }
        if (r.why && !r.entry && !r.entries?.length) lapse({ why: r.why });
        const es = r.entry ? [r.entry] : r.entries ?? [];
        if (es.length) ctx.held?.push(m);
        for (const e of es) out.set(e.id, { ...e, given_at: given });
    }
    return [...out.values()];
}

/**
 * A hypothesis about who did a change pointed out by move (a): what that one would have needed (at the door, a key),
 * each with what the timeline says. Returns `[{req, status, entry?}]`.
 */
export function agentNeeds(order, entries, change, agent, nameOf, ctx = {}) {
    const { entries: reqs = [] } = pointImplications({ ...change, id: `${change.id}@${agent}`, of: agent }, nameOf, { ...ctx, order });
    return reqs.filter((r) => r.role === 'requires').map((req) => ({ req, ...requirementStatus(order, entries, req, ctx) }));
}
