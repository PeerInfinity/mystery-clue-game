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
            this.constraints.set(c.id, { id: c.id, formula: c.formula, scope });
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
        const cons = [...active].map((id) => this.#get(id));
        const want = new Set(Object.keys(fixed));
        extra.forEach((formula, i) => {
            const scope = [...slotsOf(formula)];
            for (const s of scope) {
                if (!this.domains.has(s)) throw new Error(`formula names unknown slot ${s}`);
                want.add(s);
            }
            cons.push({ id: `_extra${i}`, formula, scope });
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
        const out = [];
        for (const v of this.domains.get(slot)) {
            if (slot in fixed && fixed[slot] !== v) continue;
            if (this.consistent(active, { ...fixed, [slot]: v }, { focus: true }).ok) out.push(v);
        }
        return out;
    }

    /** Number of solutions over the slots the active constraints mention, capped at `limit`. */
    countSolutions(active, limit = 2) {
        const cons = [...active].map((id) => this.#get(id));
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

    #search(group, fixed, limit) {
        const domains = new Map();
        for (const s of group.slots) {
            let d = this.domains.get(s);
            if (s in fixed) d = d.includes(fixed[s]) ? [fixed[s]] : [];
            domains.set(s, d);
        }
        const bySlot = new Map(group.slots.map((s) => [s, []]));
        for (const c of group.cons) for (const s of c.scope) bySlot.get(s).push(c);
        const assign = new Map();
        const order = this.timeOrder;
        const ok = (c) => evaluate(c.formula, assign, order) !== false;

        // Node consistency first: no-slot constraints, then one-slot constraints filter domains.
        for (const c of group.cons) {
            if (c.scope.length === 0 && evaluate(c.formula, assign, order) === false) return { count: 0 };
            if (c.scope.length === 1) {
                const s = c.scope[0];
                const d = domains.get(s).filter((v) => {
                    assign.set(s, v);
                    const r = ok(c);
                    assign.delete(s);
                    return r;
                });
                domains.set(s, d);
            }
        }
        for (const d of domains.values()) if (d.length === 0) return { count: 0 };

        let count = 0;
        let first = null;
        const trail = [];
        const prune = (slot) => {
            for (const c of bySlot.get(slot)) {
                if (!ok(c)) return false;
                const open = c.scope.filter((s) => !assign.has(s));
                if (open.length !== 1) continue;
                const u = open[0];
                const d = domains.get(u);
                const nd = d.filter((v) => {
                    assign.set(u, v);
                    const r = ok(c);
                    assign.delete(u);
                    return r;
                });
                if (nd.length !== d.length) {
                    trail.push([u, d]);
                    domains.set(u, nd);
                    if (nd.length === 0) return false;
                }
            }
            return true;
        };
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
                if (prune(best) && step()) return true;
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
