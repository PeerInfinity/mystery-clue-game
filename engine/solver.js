// A small finite-domain constraint solver for mystery cases.
//
// The case is a set of SLOTS (each with a finite domain of values) and CONSTRAINTS (formulas from logic.js,
// each resting on premise nodes). Every game question reduces to one call here:
//   - could slot S hold X, given these constraints?          → consistent(..., {S: X})
//   - which values survive for S?                             → candidates()
//   - is the case well formed (exactly one solution)?          → countSolutions() / candidates() per slot
//   - why does this theory fail?                               → explainConflict() (a minimal constraint subset)
//
// Search: MRV backtracking with forward checking, run per connected component of the constraint graph, so a
// question about one slot only searches the slots tied to it.

import { evaluate, slotsOf } from './logic.js';

export class Problem {
    /**
     * @param {object} p
     * @param {Map<string,string[]>} p.domains slot id -> possible values
     * @param {{id:string, formula:object}[]} p.constraints
     * @param {Map<string,number>} p.timeOrder time window id -> order
     */
    constructor({ domains, constraints, timeOrder }) {
        this.domains = domains;
        this.timeOrder = timeOrder;
        this.constraints = new Map();
        for (const c of constraints) {
            const scope = [...slotsOf(c.formula)];
            for (const s of scope) {
                if (!domains.has(s)) throw new Error(`constraint ${c.id} names unknown slot ${s}`);
            }
            // The search works on small PARTS: a conjunction (also under an implication) is split, so most
            // constraints become one- or two-slot checks that propagate cheaply.
            const parts = splitConjunctions(c.formula).map((formula) => ({ formula, scope: [...slotsOf(formula)] }));
            this.constraints.set(c.id, { id: c.id, formula: c.formula, scope, parts });
        }
    }

    /**
     * Is there an assignment of every slot that satisfies all `active` constraints and agrees with `fixed`?
     * @param {Iterable<string>} active constraint ids
     * @param {object} fixed slot -> value
     * @param {object} [opts]
     * @param {boolean} [opts.focus] only search the components that contain a fixed slot or an extra formula
     *   (assumes the rest is consistent — check that once with no focus)
     * @param {object[]} [opts.extra] further formulas to hold, e.g. the negation of a claimed conclusion
     * @returns {{ok:boolean, witness?:Map<string,string>}}
     */
    consistent(active, fixed = {}, { focus = false, extra = [] } = {}) {
        const cons = [...active].flatMap((id) => this.#get(id).parts);
        const want = new Set(Object.keys(fixed));
        extra.forEach((formula) => {
            for (const part of splitConjunctions(formula)) {
                const scope = [...slotsOf(part)];
                for (const s of scope) {
                    if (!this.domains.has(s)) throw new Error(`formula names unknown slot ${s}`);
                    want.add(s);
                }
                cons.push({ formula: part, scope });
            }
        });
        let groups = components(cons, Object.keys(fixed));
        if (focus) {
            groups = groups.filter((g) => g.slots.some((s) => want.has(s)) || g.slots.length === 0);
        }
        const witness = new Map();
        for (const g of groups) {
            const sol = this.#search(g, fixed, 1);
            if (sol.count === 0) return { ok: false };
            for (const [k, v] of sol.first) witness.set(k, v);
        }
        return { ok: true, witness };
    }

    /** Values of `slot` that some full solution of the active constraints allows. */
    candidates(active, slot, fixed = {}) {
        const cons = [...active].flatMap((id) => this.#get(id).parts);
        const group = components(cons, [slot, ...Object.keys(fixed)]).find((g) => g.slots.includes(slot));
        // Propagate once for the whole group, then try each surviving value from that state.
        const root = this.#search(group, fixed, 0);
        if (!root.domains) return [];
        const out = [];
        for (const v of root.domains.get(slot)) {
            if (this.#search(group, { ...fixed, [slot]: v }, 1, root.domains).count) out.push(v);
        }
        return out;
    }

    /** Number of solutions over the slots the active constraints mention, capped at `limit`. */
    countSolutions(active, limit = 2) {
        const cons = [...active].flatMap((id) => this.#get(id).parts);
        let total = 1;
        for (const g of components(cons, [])) {
            const n = this.#search(g, {}, limit).count;
            if (n === 0) return 0;
            total = Math.min(limit, total * n);
        }
        return total;
    }

    /**
     * A minimal subset of `active` that is still inconsistent with `fixed` (deletion filter).
     * Returns null when `fixed` is consistent with all of `active`.
     */
    explainConflict(active, fixed = {}) {
        let keep = [...active];
        if (this.consistent(keep, fixed).ok) return null;
        for (const id of [...keep]) {
            const without = keep.filter((x) => x !== id);
            if (!this.consistent(without, fixed).ok) keep = without;
        }
        return keep;
    }

    #get(id) {
        const c = this.constraints.get(id);
        if (!c) throw new Error(`unknown constraint ${id}`);
        return c;
    }

    /**
     * Search one component. limit = 0 only propagates and returns the reduced domains ({domains} or {} when
     * inconsistent); otherwise counts solutions up to `limit`. `start` = domains to begin from (already
     * propagated for the same constraints).
     */
    #search(group, fixed, limit, start = null) {
        const domains = new Map();
        for (const s of group.slots) {
            let d = (start ?? this.domains).get(s);
            if (s in fixed) d = d.includes(fixed[s]) ? [fixed[s]] : [];
            domains.set(s, d);
        }
        const bySlot = new Map(group.slots.map((s) => [s, []]));
        for (const c of group.cons) for (const s of c.scope) bySlot.get(s).push(c);
        const assign = new Map();
        const order = this.timeOrder;
        const trail = [];
        const setDomain = (x, d) => {
            trail.push([x, domains.get(x)]);
            domains.set(x, d);
        };

        // Does value v of slot x have a support in constraint c: some values of c's other open slots (from their
        // current domains) under which c is not false? Three-valued evaluation cuts the enumeration short; past
        // SUPPORT_BUDGET steps the value is kept (sound: it only weakens pruning, never the answer).
        const supported = (c, x, v) => {
            const others = c.scope.filter((s) => s !== x && !assign.has(s))
                .sort((a, b) => domains.get(a).length - domains.get(b).length);
            assign.set(x, v);
            let steps = 0;
            const dfs = (i) => {
                const r = evaluate(c.formula, assign, order);
                if (r === false) return false;
                if (r === true || i === others.length) return true;
                if (++steps > SUPPORT_BUDGET) return true;
                const s = others[i];
                for (const w of domains.get(s)) {
                    assign.set(s, w);
                    const found = dfs(i + 1);
                    assign.delete(s);
                    if (found) return true;
                }
                return false;
            };
            const found = dfs(0);
            assign.delete(x);
            return found;
        };

        // Generalised arc consistency over a queue of constraints.
        const propagate = (queue) => {
            const queued = new Set(queue);
            while (queue.length) {
                const c = queue.pop();
                queued.delete(c);
                if (c.scope.every((s) => assign.has(s))) {
                    if (evaluate(c.formula, assign, order) === false) return false;
                    continue;
                }
                const open = c.scope.filter((x) => !assign.has(x));
                if (open.length > GAC_MAX_SCOPE) continue; // checked once few enough of its slots stay open
                for (const x of open) {
                    const d = domains.get(x);
                    const nd = d.filter((v) => supported(c, x, v));
                    if (nd.length === d.length) continue;
                    setDomain(x, nd);
                    if (nd.length === 0) return false;
                    for (const c2 of bySlot.get(x)) {
                        if (c2 !== c && !queued.has(c2)) {
                            queued.add(c2);
                            queue.push(c2);
                        }
                    }
                }
            }
            return true;
        };

        for (const d of domains.values()) if (d.length === 0) return { count: 0 };
        if (start) {
            const queue = new Set();
            for (const s of Object.keys(fixed)) for (const c of bySlot.get(s) ?? []) queue.add(c);
            if (!propagate([...queue])) return { count: 0 };
        } else if (!propagate([...group.cons])) return { count: 0 };
        if (limit === 0) return { count: 0, domains: new Map(domains) };

        let count = 0;
        let first = null;
        const step = () => {
            let best = null;
            for (const s of group.slots) {
                if (assign.has(s)) continue;
                if (best === null || domains.get(s).length < domains.get(best).length) best = s;
            }
            if (best === null) {
                count++;
                if (!first) first = new Map(assign);
                return count >= limit;
            }
            for (const v of domains.get(best)) {
                const mark = trail.length;
                assign.set(best, v);
                setDomain(best, [v]);
                if (propagate([...bySlot.get(best)]) && step()) return true;
                assign.delete(best);
                while (trail.length > mark) {
                    const [u, d] = trail.pop();
                    domains.set(u, d);
                }
            }
            return false;
        };
        step();
        return { count, first };
    }
}

const SUPPORT_BUDGET = 5000;
const GAC_MAX_SCOPE = 3;

/** Split a formula into parts whose conjunction is equivalent: and(a,b) → a, b; implies(p, and(a,b)) → implies(p,a), implies(p,b). */
export function splitConjunctions(f) {
    if (f.and) return f.and.flatMap(splitConjunctions);
    if (f.implies && f.implies[1].and) return f.implies[1].and.flatMap((g) => splitConjunctions({ implies: [f.implies[0], g] }));
    return [f];
}

/** Connected components of the constraint graph; `extra` slots with no constraint form their own groups. */
function components(cons, extra) {
    const parent = new Map();
    const find = (x) => {
        while (parent.get(x) !== x) {
            parent.set(x, parent.get(parent.get(x)));
            x = parent.get(x);
        }
        return x;
    };
    const add = (x) => { if (!parent.has(x)) parent.set(x, x); };
    for (const s of extra) add(s);
    for (const c of cons) {
        for (const s of c.scope) add(s);
        for (let i = 1; i < c.scope.length; i++) parent.set(find(c.scope[i]), find(c.scope[0]));
    }
    const groups = new Map();
    for (const s of parent.keys()) {
        const r = find(s);
        if (!groups.has(r)) groups.set(r, { slots: [], cons: [] });
        groups.get(r).slots.push(s);
    }
    const closed = [];
    for (const c of cons) {
        if (c.scope.length === 0) closed.push(c);
        else groups.get(find(c.scope[0])).cons.push(c);
    }
    const out = [...groups.values()];
    if (closed.length) out.push({ slots: [], cons: closed });
    return out;
}
