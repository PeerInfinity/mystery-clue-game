// Formula language for mystery constraints, evaluated in three-valued logic.
//
// A formula is a small JSON object over SLOTS (string ids) and literal values:
//   {eq: [slot, value]}      {ne: [slot, value]}
//   {in: [slot, [values]]}   {nin: [slot, [values]]}
//   {same: [slotA, slotB]}   {diff: [slotA, slotB]}
//   {before: [a, b]}         {not_after: [a, b]}    a/b = a time slot id, or {lit: windowId}
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
        case 'and': return and3(a.map((g) => evaluate(g, assign, timeOrder)));
        case 'or': return or3(a.map((g) => evaluate(g, assign, timeOrder)));
        case 'not': return not3(evaluate(a, assign, timeOrder));
        case 'implies': return or3([not3(evaluate(a[0], assign, timeOrder)), evaluate(a[1], assign, timeOrder)]);
        default: throw new Error(`unknown operator ${op}`);
    }
}

export const OPERATORS = ['true', 'false', 'eq', 'ne', 'in', 'nin', 'same', 'diff', 'before', 'not_after',
    'and', 'or', 'not', 'implies'];

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
        case 'and': return a.map((g) => `(${render(g, name)})`).join(' ∧ ');
        case 'or': return a.map((g) => `(${render(g, name)})`).join(' ∨ ');
        case 'not': return `¬(${render(a, name)})`;
        case 'implies': return `(${render(a[0], name)}) → (${render(a[1], name)})`;
    }
    return '?';
}
