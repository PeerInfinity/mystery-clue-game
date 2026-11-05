// Actions and typed states for the world model (the player's moves on Watson's timeline, step 2).
//
// A typed state is an attribute with exclusive values (`STATES`): a door is open, shut or locked, never two at once.
// An action is an event that changes a state: the generic table (`ACTIONS`) gives each action type what it requires
// of its thing and agent just before, and what it effects just after. A fact is a typed action when it has `act` (the
// action type) and `thing` (what it acts on); its agent is its `of`.
//
// Persistence: a state lasts until something specific changes it (`holdsBefore`). Events the story never tells are
// not invented: the player points them out, and the engine checks each move by these generic rules.
// - (a) `pointChange`: two states of one thing differ, so an action of change took place between them, by someone.
// - (b) `pointImplications`: an action, so what it requires and what it effects.
// What the player points out is an entry of the world model with the source *Watson's reasoning* (`REASONING`), as
// trusted as its weakest premise.

import { coverOf, STATES } from './world.js';

export { STATES };

/**
 * The generic action table. `requires`: a state of the thing (`state`, `value`, `neg`: not that value) or something
 * the agent carries (`carrying: 'key'`: a key to the thing), just before; `effects`: a state of the thing, just after.
 */
export const ACTIONS = {
    lock: { label: 'locking', requires: [{ state: 'door', value: 'locked', neg: true }, { carrying: 'key' }], effects: [{ state: 'door', value: 'locked' }] },
    unlock: { label: 'unlocking', requires: [{ state: 'door', value: 'locked' }, { carrying: 'key' }], effects: [{ state: 'door', value: 'shut' }] },
    open: { label: 'opening', requires: [{ state: 'door', value: 'shut' }], effects: [{ state: 'door', value: 'open' }] },
    close: { label: 'shutting', requires: [{ state: 'door', value: 'open' }], effects: [{ state: 'door', value: 'shut' }] },
    go_through: { label: 'going through', requires: [{ state: 'door', value: 'open' }], effects: [] },
};

export const REASONING = 'watsons_reasoning';
const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const anchorOf = (t) => (t ? (t.at ?? t.from ?? t.after ?? t.before ?? t.to) : null);
const startOf = (t) => (t ? (t.at ?? t.from ?? t.after ?? null) : null);
const isTyped = (f) => f && STATES[f.attr] && f.value != null;

/** The shortest run of actions that takes a state from one value to another (unlock, open: locked to open). */
export function changePath(attr, from, to) {
    if (from === to) return null;
    const seen = new Set([from]);
    let frontier = [[from, []]];
    while (frontier.length) {
        const next = [];
        for (const [v, path] of frontier) for (const [type, a] of Object.entries(ACTIONS)) {
            if (!a.effects.some((e) => e.state === attr)) continue;
            const ok = a.requires.every((r) => r.state !== attr || (r.neg ? r.value !== v : r.value === v));
            if (!ok) continue;
            const w = a.effects.find((e) => e.state === attr).value;
            if (w === to) return [...path, type];
            if (!seen.has(w)) { seen.add(w); next.push([w, [...path, type]]); }
        }
        frontier = next;
    }
    return null;
}

/** What an action's requirements and effects come to for a run of action types: the first state, every carrying. */
function pathRules(types) {
    const requires = [], effects = [];
    types.forEach((t, i) => {
        for (const r of ACTIONS[t].requires) if (!r.state || i === 0) if (!requires.some((x) => JSON.stringify(x) === JSON.stringify(r))) requires.push(r);
        if (i === types.length - 1) effects.push(...ACTIONS[t].effects);
    });
    return { requires, effects };
}

/**
 * Move (b): what an action requires just before it and effects just after, as entries. `f`: a typed action (`act`,
 * `thing`; a change from move (a) has a run of types). `nameOf`: entity id → name. A requirement holds up to the
 * action (`{to}`), or over the action's own window if it has no point; an effect from it (`{from}`).
 */
export function pointImplications(f, nameOf = (id) => id) {
    const types = list(f.act);
    if (!types.length || types.some((t) => !ACTIONS[t])) return { why: 'Not an action the engine knows the rules of.' };
    // A change pointed out by move (a) is already between the two states it came from: only its other needs are new.
    const change = f.from != null;
    const { requires, effects } = pathRules(types);
    const t = f.time ?? {};
    const point = t.at ?? null;
    const before = point ? { to: point } : { ...t };
    const after = point ? { from: point } : t.before ? { from: t.before } : null;
    const out = [];
    requires.forEach((r, i) => {
        const base = { id: `r:b:${f.id}:needs${i}`, role: 'requires', time: before };
        if (r.state && !change) out.push({ ...base, of: f.thing, attr: r.state, value: r.value, neg: !!r.neg });
        else if (r.carrying === 'key') out.push({ ...base, of: f.of, attr: 'carrying', value: `a key to ${String(nameOf(f.thing)).replace(/^The /, 'the ')}`, key: f.thing, time: point ? { at: point } : { ...t } });
    });
    if (after && !change) effects.forEach((e, i) => out.push({ id: `r:b:${f.id}:does${i}`, role: 'effects', time: after, of: f.thing, attr: e.state, value: e.value, neg: false }));
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
    const mid = known.find((e) => between(e) && ((isTyped(e) && !e.neg && e.of === x.of && e.attr === x.attr) || (e.thing === x.of && list(e.act).length)));
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
 * starting certainly before `t`, lasting until something specific changes it (or one said to hold up to `t`). Returns `{entry, value}`, `{ambiguous}`
 * when the latest are several and differ, or null when nothing says.
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
 * an entry denies it), or `unknown` (nothing says). `req`: an entry from `pointImplications`.
 */
export function requirementStatus(order, entries, req) {
    const t = anchorOf(req.time);
    if (req.attr === 'carrying') {
        const c = coverOf(req.time);
        const has = entries.find((e) => e.attr === 'carrying' && e.of === req.of && e.id !== req.id && (e.key === req.key || /\bkey\b/.test(String(e.value))) && (!c || anchorOf(e.time) === t));
        return has ? { status: 'met', entry: has } : { status: 'unknown' };
    }
    const exact = entries.find((e) => e.id !== req.id && e.of === req.of && e.attr === req.attr && e.value === req.value && !!e.neg === !!req.neg && anchorOf(e.time) === t);
    if (exact) return { status: 'met', entry: exact };
    const h = holdsBefore(order, entries.filter((e) => e.id !== req.id), req.of, req.attr, t);
    if (!h) return { status: 'unknown' };
    if (h.ambiguous) return { status: 'unknown', ambiguous: h.ambiguous };
    const ok = req.neg ? h.value !== req.value : h.value === req.value;
    return { status: ok ? 'met' : 'against', entry: h.entry, persisting: true };
}

/**
 * The entries the player's moves give, in the order made; a move whose premises are gone gives nothing. `moves`:
 * `[{move: 'a', a, b} | {move: 'b', of}]`; `lookup`: id → a fact or an earlier entry; `givenAt`: when an entry is told.
 */
export function reasonedEntries(moves, lookup, order, nameOf, givenAt) {
    const out = new Map();
    const find = (id) => out.get(id) ?? lookup(id);
    for (const m of moves) {
        const premises = m.move === 'a' ? [m.a, m.b] : [m.of];
        const ps = premises.map(find);
        if (ps.some((p) => !p)) continue;
        const given = Math.max(...ps.map((p) => givenAt(p) ?? Infinity));
        if (!Number.isFinite(given)) continue;
        const r = m.move === 'a' ? pointChange(order, ps[0], ps[1]) : pointImplications(ps[0], nameOf);
        for (const e of r.entry ? [r.entry] : r.entries ?? []) out.set(e.id, { ...e, given_at: given });
    }
    return [...out.values()];
}
