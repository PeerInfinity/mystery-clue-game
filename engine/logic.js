// Formula language for mystery constraints, evaluated in three-valued logic.
//
// A formula is a small JSON object over SLOTS (string ids) and literal values:
//   {eq: [slot, value]}      {ne: [slot, value]}
//   {in: [slot, [values]]}   {nin: [slot, [values]]}
//   {same: [slotA, slotB]}   {diff: [slotA, slotB]}
//   {before: [a, b]}         {not_after: [a, b]}    a/b = a time slot id, or {lit: windowId}
//   {index: [slot, {value: slotId...}, value, outside?]}   the slot the first slot's value selects holds `value`
//   {nindex: [...]}                                        ... does not hold `value`
//     (a relation looked up by a slot's value: rel.acquainted.dog.<visitor>. A value with no entry in the map
//      reads as `outside`, the relation's value beyond its range; with no `outside`, as impossible.)
//   {and: [f...]} {or: [f...]} {not: f} {implies: [f, g]}
//   {true: true} / {false: true}
//
// eval returns true, false, or undefined (= not yet decided by the partial assignment).

export const U = undefined;

function and3(values) {
    let unknown = false;
    for (const v of values) {
        if (v === false) return false;
        if (v === U) unknown = true;
    }
    return unknown ? U : true;
}

function or3(values) {
    let unknown = false;
    for (const v of values) {
        if (v === true) return true;
        if (v === U) unknown = true;
    }
    return unknown ? U : false;
}

function not3(v) {
    return v === U ? U : !v;
}

/**
 * @param {object} f formula
 * @param {Map<string,string>|object} assign slot -> value (partial)
 * @param {Map<string,number>} timeOrder window id -> order index
 */
export function evaluate(f, assign, timeOrder) {
    const get = assign instanceof Map ? (s) => assign.get(s) : (s) => assign[s];
    const time = (arg) => {
        if (arg && typeof arg === 'object') {
            if (!timeOrder.has(arg.lit)) throw new Error(`unknown time window ${arg.lit}`);
            return timeOrder.get(arg.lit);
        }
        const v = get(arg);
        if (v === U) return U;
        if (!timeOrder.has(v)) throw new Error(`slot ${arg} holds ${v}, not a time window`);
        return timeOrder.get(v);
    };
    const op = opOf(f);
    const a = f[op];
    switch (op) {
        case 'true': return true;
        case 'false': return false;
        case 'eq': { const v = get(a[0]); return v === U ? U : v === a[1]; }
        case 'ne': { const v = get(a[0]); return v === U ? U : v !== a[1]; }
        case 'in': { const v = get(a[0]); return v === U ? U : a[1].includes(v); }
        case 'nin': { const v = get(a[0]); return v === U ? U : !a[1].includes(v); }
        case 'same': case 'diff': {
            const x = get(a[0]), y = get(a[1]);
            if (x === U || y === U) return U;
            return op === 'same' ? x === y : x !== y;
        }
        case 'before': case 'not_after': {
            const x = time(a[0]), y = time(a[1]);
            if (x === U || y === U) return U;
            return op === 'before' ? x < y : x <= y;
        }
        case 'index': case 'nindex': {
            const key = get(a[0]);
            if (key === U) return U;
            const target = a[1][key];
            let held;
            if (target === undefined) { if (a[3] === undefined || a[3] === null) return op === 'nindex'; held = a[3]; }
            else { held = get(target); if (held === U) return U; }
            return (held === a[2]) === (op === 'index');
        }
        case 'and': return and3(a.map((g) => evaluate(g, assign, timeOrder)));
        case 'or': return or3(a.map((g) => evaluate(g, assign, timeOrder)));
        case 'not': return not3(evaluate(a, assign, timeOrder));
        case 'implies': return or3([not3(evaluate(a[0], assign, timeOrder)), evaluate(a[1], assign, timeOrder)]);
        default: throw new Error(`unknown operator ${op}`);
    }
}

export const OPERATORS = ['true', 'false', 'eq', 'ne', 'in', 'nin', 'same', 'diff', 'before', 'not_after',
    'index', 'nindex', 'and', 'or', 'not', 'implies'];

export function opOf(f) {
    const keys = Object.keys(f);
    if (keys.length !== 1 || !OPERATORS.includes(keys[0])) {
        throw new Error(`a formula has exactly one operator key, got ${JSON.stringify(f)}`);
    }
    return keys[0];
}

/** The slot ids a formula mentions. */
export function slotsOf(f, out = new Set()) {
    const op = opOf(f);
    const a = f[op];
    switch (op) {
        case 'true': case 'false': break;
        case 'eq': case 'ne': case 'in': case 'nin': out.add(a[0]); break;
        case 'same': case 'diff': out.add(a[0]); out.add(a[1]); break;
        case 'before': case 'not_after':
            for (const x of a) if (typeof x === 'string') out.add(x);
            break;
        case 'index': case 'nindex': out.add(a[0]); for (const s of Object.values(a[1])) out.add(s); break;
        case 'and': case 'or': for (const g of a) slotsOf(g, out); break;
        case 'not': slotsOf(a, out); break;
        case 'implies': slotsOf(a[0], out); slotsOf(a[1], out); break;
    }
    return out;
}

/** The literal values a formula compares a slot with, as [slot, value] pairs (for reference checks). */
export function literalsOf(f, out = []) {
    const op = opOf(f);
    const a = f[op];
    switch (op) {
        case 'eq': case 'ne': out.push([a[0], a[1]]); break;
        case 'in': case 'nin': for (const v of a[1]) out.push([a[0], v]); break;
        case 'before': case 'not_after':
            for (const x of a) if (x && typeof x === 'object') out.push([null, x.lit]);
            break;
        case 'index': case 'nindex': for (const s of Object.values(a[1])) out.push([s, a[2]]); break;
        case 'and': case 'or': for (const g of a) literalsOf(g, out); break;
        case 'not': literalsOf(a, out); break;
        case 'implies': literalsOf(a[0], out); literalsOf(a[1], out); break;
    }
    return out;
}

/** A short human rendering, for reports and the UI. */
export function render(f, name = (x) => x) {
    const op = opOf(f);
    const a = f[op];
    const t = (x) => (typeof x === 'string' ? name(x) : x.lit);
    switch (op) {
        case 'true': return 'TRUE';
        case 'false': return 'FALSE';
        case 'eq': return `${name(a[0])} = ${a[1]}`;
        case 'ne': return `${name(a[0])} ≠ ${a[1]}`;
        case 'in': return `${name(a[0])} ∈ {${a[1].join(', ')}}`;
        case 'nin': return `${name(a[0])} ∉ {${a[1].join(', ')}}`;
        case 'same': return `${name(a[0])} = ${name(a[1])}`;
        case 'diff': return `${name(a[0])} ≠ ${name(a[1])}`;
        case 'before': return `${t(a[0])} < ${t(a[1])}`;
        case 'not_after': return `${t(a[0])} ≤ ${t(a[1])}`;
        case 'index': case 'nindex': {
            const some = Object.values(a[1])[0] ?? '';
            const prefix = some.slice(0, some.lastIndexOf('.')) || '?';
            return `${prefix}[${name(a[0])}] ${op === 'index' ? '=' : '≠'} ${a[2]}`;
        }
        case 'and': return a.map((g) => `(${render(g, name)})`).join(' ∧ ');
        case 'or': return a.map((g) => `(${render(g, name)})`).join(' ∨ ');
        case 'not': return `¬(${render(a, name)})`;
        case 'implies': return `(${render(a[0], name)}) → (${render(a[1], name)})`;
    }
    return '?';
}

// ---------------------------------------------------------------------------------------------------------
// SCHEMAS: formulas with variables, grounded against a case (format 0.3).
//
// A schema term may be: a slot id; '?v' (a variable bound to a card); '?v.facet' (a slot of the bound card);
// {rel: [name, arg...]} (a relation slot; an arg is a card id, '?v', or a slot whose VALUE indexes the relation,
// in which case the formula is expanded over that slot's domain); {lit: window} as before.
// {state: [name, thing, time]} (a declared state, format 0.3 world model: the thing's location `at`, its holder
// `held`, or a condition by name, in one time window; `time` is a window id, '?w' bound to one, or a time slot such
// as '?e.time', which grounds to a lookup over the thing's declared windows. A window the thing has no state for
// is unconstrained: the comparison holds there. A place is folded to the nearest listed place containing it (a thing
// in the bedroom is at the villa; the stable means the stable apart from its listed loft). It may be compared with a
// value (eq, ne), with a slot or another state (same, diff).
// Extra operators: {forall: [{var, kind|kinds|only|section}, body]}, {exists: [...]} expand over cards;
// {only: [name, fixedArg..., [trueFor]]} sets the relation's last argument true for the listed cards and false
// for every other card it ranges over.
//
// ground(f, env) returns an ordinary formula. env:
//   bind: {var -> card id}
//   hasSlot(id), domainOf(slotId) -> values
//   relation(name) -> {argValues: [ids[]...], slotId(args[]) -> slot id or null, outside: 'false'|'true'|'error'}
//   cards(spec) -> card ids a quantifier ranges over ({kind|kinds|only|section})
//   state(name, thing) -> {domain, slotFor(window) -> slot id or null, overlaps(v), inside(v) -> domain values} or null
//   isWindow(id)
// Throws Error with a readable message when a variable is unbound, a facet is missing, etc.

export const SCHEMA_OPERATORS = [...OPERATORS, 'forall', 'exists', 'only'];

export const isVar = (x) => typeof x === 'string' && x.startsWith('?');

/** Variables a schema formula mentions ('?v' and '?v.facet' both name v). */
export function varsOf(f, out = new Set()) {
    const term = (x) => {
        if (isVar(x)) out.add(x.slice(1).split('.')[0]);
        else if (x && typeof x === 'object' && x.rel) x.rel.slice(1).forEach(term);
        else if (x && typeof x === 'object' && x.state) x.state.forEach(term);
        else if (x && typeof x === 'object' && x.lit) term(x.lit);
    };
    const keys = Object.keys(f);
    if (keys.length !== 1) throw new Error(`a formula has exactly one operator key, got ${JSON.stringify(f)}`);
    const op = keys[0];
    const a = f[op];
    switch (op) {
        case 'true': case 'false': break;
        case 'eq': case 'ne': term(a[0]); term(a[1]); break;
        case 'in': case 'nin': term(a[0]); a[1].forEach(term); break;
        case 'same': case 'diff': case 'before': case 'not_after': term(a[0]); term(a[1]); break;
        case 'index': case 'nindex': break;
        case 'and': case 'or': for (const g of a) varsOf(g, out); break;
        case 'not': varsOf(a, out); break;
        case 'implies': varsOf(a[0], out); varsOf(a[1], out); break;
        case 'forall': case 'exists': { const inner = new Set(); varsOf(a[1], inner); inner.delete(a[0].var); for (const v of inner) out.add(v); break; }
        case 'only': a.slice(1, -1).forEach(term); a[a.length - 1].forEach(term); break;
        default: throw new Error(`unknown operator ${op}`);
    }
    return out;
}

/** True when a formula uses no variables, relations or quantifiers: it needs no grounding. */
export function isGround(f) {
    const plain = (x) => typeof x === 'string' ? !isVar(x) : !(x && typeof x === 'object' && (x.rel || x.state || isVar(x.lit)));
    const op = Object.keys(f)[0];
    const a = f[op];
    switch (op) {
        case 'true': case 'false': return true;
        case 'eq': case 'ne': return plain(a[0]) && plain(a[1]);
        case 'in': case 'nin': return plain(a[0]) && a[1].every(plain);
        case 'same': case 'diff': case 'before': case 'not_after': return plain(a[0]) && plain(a[1]);
        case 'index': case 'nindex': return true;
        case 'and': case 'or': return a.every(isGround);
        case 'not': return isGround(a);
        case 'implies': return isGround(a[0]) && isGround(a[1]);
        default: return false;
    }
}

export function ground(f, env) {
    const bind = env.bind ?? {};
    const card = (x) => {
        if (!isVar(x)) return x;
        const v = x.slice(1);
        if (v.includes('.')) throw new Error(`${x} names a slot where a card was expected`);
        if (!(v in bind)) throw new Error(`variable ?${v} is not bound`);
        return bind[v];
    };
    // A slot term: a slot id or '?v.facet'. Returns the slot id (checked to exist).
    const slotOf = (x) => {
        let id = x;
        if (isVar(x)) {
            const [v, ...rest] = x.slice(1).split('.');
            if (!rest.length) throw new Error(`${x} names a card where a slot was expected`);
            if (!(v in bind)) throw new Error(`variable ?${v} is not bound`);
            id = `${bind[v]}.${rest.join('.')}`;
        }
        if (!env.hasSlot(id)) throw new Error(`no such slot ${id}${isVar(x) ? ` (${x})` : ''}`);
        return id;
    };
    // Resolve a term to {slot} or {alts: [{cond: [[slot, value]...], slot}]} (a relation indexed by slot values).
    const resolve = (x) => {
        if (typeof x === 'string') return { slot: slotOf(x) };
        if (!x || typeof x !== 'object' || !x.rel) throw new Error(`bad term ${JSON.stringify(x)}`);
        const [name, ...args] = x.rel;
        const rel = env.relation(name);
        if (!rel) throw new Error(`unknown relation ${name}`);
        if (args.length !== rel.argValues.length) throw new Error(`relation ${name} takes ${rel.argValues.length} argument(s), got ${args.length}`);
        // Each arg: a card (literal or ?v), or a slot whose value indexes the relation.
        const fixed = args.map((a) => {
            if (typeof a === 'string' && (isVar(a) ? a.slice(1).includes('.') : env.hasSlot(a))) return { slot: slotOf(a) };
            return { card: card(a) };
        });
        if (fixed.every((a) => a.card)) {
            const id = rel.slotId(fixed.map((a) => a.card));
            if (!id) throw new Error(`relation ${name} is not defined for (${fixed.map((a) => a.card).join(', ')})`);
            return { slot: id };
        }
        // Expand over the indexing slots' domains.
        let combos = [{ cond: [], args: [] }];
        fixed.forEach((a) => {
            combos = combos.flatMap((c) => (a.card
                ? [{ cond: c.cond, args: [...c.args, a.card] }]
                : env.domainOf(a.slot).map((v) => ({ cond: [...c.cond, [a.slot, v]], args: [...c.args, v] }))));
        });
        const alts = [];
        for (const c of combos) {
            const id = rel.slotId(c.args);
            if (id) alts.push({ cond: c.cond, slot: id });
            else if (rel.outside === 'error') throw new Error(`relation ${name} is not defined for (${c.args.join(', ')}); widen its arguments or set "outside"`);
            else alts.push({ cond: c.cond, value: rel.outside }); // a fixed value outside the relation's range
        }
        return { alts };
    };
    const value = (x) => card(x);
    // Build a formula from resolved terms: with alternatives, guard each combination by its conditions.
    const lift = (terms, build) => {
        if (terms.every((t) => t.slot)) return build(terms.map((t) => ({ slot: t.slot })));
        let combos = [{ cond: [], ts: [] }];
        for (const t of terms) {
            combos = combos.flatMap((c) => (t.slot
                ? [{ cond: c.cond, ts: [...c.ts, { slot: t.slot }] }]
                : t.alts.map((a) => ({ cond: [...c.cond, ...a.cond], ts: [...c.ts, a.slot ? { slot: a.slot } : { value: a.value }] }))));
        }
        const parts = combos.map((c) => {
            const body = build(c.ts);
            if (!c.cond.length) return body;
            const ante = c.cond.length === 1 ? { eq: c.cond[0] } : { and: c.cond.map((p) => ({ eq: p })) };
            return { implies: [ante, body] };
        });
        return parts.length === 1 ? parts[0] : { and: parts };
    };
    // A relation indexed by ONE slot, compared with one literal: a native lookup, which the solver propagates
    // directly instead of one implication per value of the slot.
    const lookup = (op, x, val) => {
        if (typeof x !== 'object' || !x.rel) return null;
        const [name, ...args] = x.rel;
        const rel = env.relation(name);
        if (!rel) return null;
        const idx = args.map((a) => typeof a === 'string' && (isVar(a) ? a.slice(1).includes('.') : env.hasSlot(a)));
        if (idx.filter(Boolean).length !== 1) return null;
        const i = idx.indexOf(true);
        const key = slotOf(args[i]);
        const fixed = args.map((a, j) => (j === i ? null : card(a)));
        const map = {};
        for (const v of env.domainOf(key)) {
            const id = rel.slotId(fixed.map((a, j) => (j === i ? v : a)));
            if (id) map[v] = id;
            else if (rel.outside === 'error') throw new Error(`relation ${name} is not defined for (${fixed.map((a, j) => (j === i ? v : a)).join(', ')}); widen its arguments or set "outside"`);
        }
        return { [op === 'eq' ? 'index' : 'nindex']: [key, map, val, rel.outside === 'error' ? null : rel.outside] };
    };
    // ---- states (world model) ----
    const TRUE = { true: true };
    const isState = (x) => !!(x && typeof x === 'object' && Array.isArray(x.state));
    const stateOf = (x) => {
        if (x.state.length !== 3) throw new Error(`a state term takes [name, thing, time], got ${JSON.stringify(x)}`);
        const [n, th, t] = x.state;
        const name = card(n), thing = card(th);
        const track = env.state?.(name, thing) ?? null; // no track: nothing declared, nothing constrained
        let time;
        if (typeof t === 'string' && !isVar(t) && env.isWindow?.(t)) time = { window: t };
        else if (isVar(t) && !t.slice(1).includes('.')) time = { window: card(t) };
        else time = { slot: slotOf(t) };
        return { name, thing, track, time };
    };
    // The state takes one of `allowed` (a subset of its domain); true wherever it is not declared.
    const stateIn = (st, allowed) => {
        if (!st.track) return TRUE;
        const dom = st.track.domain;
        const out = dom.filter((v) => !allowed.includes(v));
        if (!out.length) return TRUE;
        if (st.time.window) {
            const id = st.track.slotFor(st.time.window);
            if (!id) return TRUE;
            return allowed.length === 1 ? { eq: [id, allowed[0]] } : out.length === 1 ? { ne: [id, out[0]] } : { in: [id, allowed] };
        }
        const map = {};
        for (const w of env.domainOf(st.time.slot)) { const id = st.track.slotFor(w); if (id) map[w] = id; }
        if (!Object.keys(map).length) return TRUE;
        // A lookup by the time slot: outside the declared windows it reads a value that never matches, so it holds.
        if (allowed.length === 1) return { index: [st.time.slot, map, allowed[0], allowed[0]] };
        return conj(out.map((v) => ({ nindex: [st.time.slot, map, v, '*'] })));
    };
    const conj = (parts) => {
        const kept = parts.filter((p) => !p.true);
        return kept.length === 0 ? TRUE : kept.length === 1 ? kept[0] : { and: kept };
    };
    const without = (dom, xs) => dom.filter((v) => !xs.includes(v));
    const stateCmp = (op, st, val) => {
        if (!st.track) return TRUE;
        if (op === 'eq') {
            const ok = st.track.overlaps(val);
            if (!ok.length) throw new Error(`${val} is not a value of ${st.name}(${st.thing})`);
            return stateIn(st, ok);
        }
        // "is not there": none of the places inside it (not being in the bedroom says nothing of the villa).
        return stateIn(st, without(st.track.domain, st.track.inside(val)));
    };
    const stateVsSlot = (op, st, slot) => {
        if (!st.track) return TRUE;
        const groups = new Map();
        for (const v of env.domainOf(slot)) {
            const allowed = op === 'same' ? st.track.overlaps(v) : without(st.track.domain, st.track.inside(v));
            const key = allowed.join('|');
            if (!groups.has(key)) groups.set(key, { allowed, vs: [] });
            groups.get(key).vs.push(v);
        }
        const parts = [];
        for (const { allowed, vs } of groups.values()) {
            const then = stateIn(st, allowed);
            if (then.true) continue;
            parts.push({ implies: [vs.length === 1 ? { eq: [slot, vs[0]] } : { in: [slot, vs] }, then] });
        }
        return conj(parts);
    };
    const stateVsState = (op, a, b) => {
        if (!a.track || !b.track) return TRUE;
        if (!a.time.window || !b.time.window) throw new Error('two states compared must both be at a given window');
        const ia = a.track.slotFor(a.time.window);
        const ib = b.track.slotFor(b.time.window);
        if (!ia || !ib) return TRUE;
        if (a.track.domain.join('|') === b.track.domain.join('|')) return { [op]: [ia, ib] };
        const parts = [];
        for (const u of a.track.domain) {
            const allowed = op === 'same' ? b.track.overlaps(u) : without(b.track.domain, b.track.inside(u));
            const then = stateIn(b, allowed);
            if (!then.true) parts.push({ implies: [{ eq: [ia, u] }, then] });
        }
        return conj(parts);
    };
    const cmp = (op, t, vals) => lift([t], ([a]) => {
        if (a.slot) return { [op]: [a.slot, vals] };
        // The term resolved to a fixed value (a relation outside its range): compare constants.
        const hit = Array.isArray(vals) ? vals.includes(a.value) : a.value === vals;
        const pos = op === 'eq' || op === 'in';
        return hit === pos ? { true: true } : { false: true };
    });
    const g = (f) => {
        const keys = Object.keys(f);
        if (keys.length !== 1) throw new Error(`a formula has exactly one operator key, got ${JSON.stringify(f)}`);
        const op = keys[0];
        const a = f[op];
        switch (op) {
            case 'true': case 'false': return f;
            case 'eq': case 'ne':
                if (isState(a[0])) return stateCmp(op, stateOf(a[0]), value(a[1]));
                return lookup(op, a[0], value(a[1])) ?? cmp(op, resolve(a[0]), value(a[1]));
            case 'in': case 'nin':
                if (isState(a[0])) throw new Error('a state is compared with eq, ne, same or diff');
                return cmp(op, resolve(a[0]), a[1].map(value));
            case 'same': case 'diff':
                if (isState(a[0]) && isState(a[1])) return stateVsState(op, stateOf(a[0]), stateOf(a[1]));
                if (isState(a[0]) || isState(a[1])) {
                    const [st, other] = isState(a[0]) ? [a[0], a[1]] : [a[1], a[0]];
                    const r = resolve(other);
                    if (!r.slot) throw new Error('a state is compared with a plain slot');
                    return stateVsSlot(op, stateOf(st), r.slot);
                }
                return lift([resolve(a[0]), resolve(a[1])], ([x, y]) => {
                if (x.slot && y.slot) return { [op]: [x.slot, y.slot] };
                if (x.slot || y.slot) return { [op === 'same' ? 'eq' : 'ne']: [x.slot ?? y.slot, x.slot ? y.value : x.value] };
                return (x.value === y.value) === (op === 'same') ? { true: true } : { false: true };
            });
            case 'before': case 'not_after': {
                const t = (x) => (x && typeof x === 'object' && x.lit ? { lit: card(x.lit) } : isVar(x) && !x.slice(1).includes('.') ? { lit: card(x) } : slotOf(x));
                return { [op]: [t(a[0]), t(a[1])] };
            }
            case 'and': case 'or': return { [op]: a.map(g) };
            case 'not': return { not: g(a) };
            case 'implies': return { implies: [g(a[0]), g(a[1])] };
            case 'forall': case 'exists': {
                const [spec, body] = a;
                const ids = env.cards(spec);
                const parts = ids.map((id) => ground(body, { ...env, bind: { ...bind, [spec.var]: id } }));
                if (!parts.length) return op === 'forall' ? { true: true } : { false: true };
                return parts.length === 1 ? parts[0] : { [op === 'forall' ? 'and' : 'or']: parts };
            }
            case 'only': {
                const [name, ...rest] = a;
                const trueFor = new Set(rest[rest.length - 1].map(card));
                const fixed = rest.slice(0, -1).map(card);
                const rel = env.relation(name);
                if (!rel) throw new Error(`unknown relation ${name}`);
                if (fixed.length !== rel.argValues.length - 1) throw new Error(`only: relation ${name} needs ${rel.argValues.length - 1} fixed argument(s)`);
                const parts = [];
                for (const v of rel.argValues[rel.argValues.length - 1]) {
                    const id = rel.slotId([...fixed, v]);
                    if (id) parts.push({ eq: [id, trueFor.has(v) ? 'true' : 'false'] });
                }
                for (const v of trueFor) if (!rel.argValues[rel.argValues.length - 1].includes(v)) throw new Error(`only: ${v} is not in the range of ${name}`);
                return parts.length === 1 ? parts[0] : { and: parts };
            }
            default: throw new Error(`unknown operator ${op}`);
        }
    };
    return g(f);
}
