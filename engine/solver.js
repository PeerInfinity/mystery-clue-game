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

import { evaluate, slotsOf, U } from './logic.js';

/** Thrown when a search runs past `problem.deadline` (a Date.now() value): the caller may hand it elsewhere. */
export class OverBudget extends Error {
    constructor() { super('the search ran past its time budget'); }
}

/** Thrown when a search bounded in steps runs out of them (see the lazy constraints in Problem.consistent). */
class OverSteps extends Error {}

export class Problem {
    /** When set, a search past this time (Date.now()) throws OverBudget. */
    deadline = null;
    /** When set, called now and then as (done, total, what) during the long calls. */
    onProgress = null;
    #ticks = 0;
    /** Steps left before a bounded search gives up (OverSteps), or null. */
    #steps = null;
    #tick() {
        if (this.#steps !== null && --this.#steps < 0) throw new OverSteps();
        if (this.deadline !== null && (++this.#ticks & 255) === 0 && Date.now() > this.deadline) throw new OverBudget();
    }

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
            const parts = splitConjunctions(c.formula).map(makePart);
            for (const p of parts) p.key = JSON.stringify(p.formula);
            this.constraints.set(c.id, { id: c.id, formula: c.formula, scope, parts, lazy: !!c.world });
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
    consistent(active, fixed = {}, { focus = false, extra = [], eager = false } = {}) {
        // A recent solution that already keeps everything asked answers at once: the clash search asks about many
        // subsets of a set it found consistent.
        if (!eager) {
            const known = this.#knownSolution(active, fixed, extra);
            if (known) return { ok: true, witness: known };
        }
        // LAZY constraints (the world model's ties) only ever add to the rest: when the rest already fails, so does
        // the whole, and that is found without them (their open states widen a failing search enormously). Most
        // checks settle quickly with them all, though, so that is tried first, for a bounded number of steps.
        if (!eager) {
            const list = [...active];
            const strict = list.filter((id) => !this.constraints.get(id)?.lazy);
            if (strict.length < list.length) {
                if (this.#steps === null) {
                    this.#steps = EAGER_STEPS;
                    try {
                        return this.consistent(list, fixed, { focus, extra, eager: true });
                    } catch (e) {
                        if (!(e instanceof OverSteps)) throw e;
                    } finally {
                        this.#steps = null;
                    }
                }
                const first = this.consistent(strict, fixed, { focus, extra, eager: true });
                if (!first.ok) return first;
                // Often the solution found already keeps them too.
                const lazy = list.filter((id) => this.constraints.get(id)?.lazy);
                if (first.witness && lazy.every((id) => evaluate(this.constraints.get(id).formula, first.witness, this.timeOrder) === true)) return first;
                return this.consistent(list, fixed, { focus, extra, eager: true });
            }
        }
        // A denied conclusion of several parts is a disjunction (one part fails), which the search cannot propagate:
        // try each alternative in turn. `alternatives` pushes the negation inward, so "if P then A and B", denied,
        // becomes "P and not A" or "P and not B" rather than one wide part the search would have to enumerate.
        const split = extra.findIndex((f) => alternatives(f).length > 1);
        if (split >= 0) {
            for (const alt of alternatives(extra[split])) {
                const res = this.consistent(active, fixed, { focus, extra: [...extra.slice(0, split), ...alt, ...extra.slice(split + 1)] });
                if (res.ok) return res;
            }
            return { ok: false };
        }
        const cons = this.#parts(active);
        const want = new Set(Object.keys(fixed));
        extra.forEach((formula) => {
            for (const part of splitConjunctions(formula).map(makePart)) {
                for (const s of part.scope) {
                    if (!this.domains.has(s)) throw new Error(`formula names unknown slot ${s}`);
                    want.add(s);
                }
                cons.push(part);
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
        if (!focus) this.#remember(witness);
        return { ok: true, witness };
    }

    /** The last few whole solutions found (each of every slot its constraints spoke of), newest first. */
    #solutions = [];
    #remember(sol) {
        this.#solutions.unshift(sol);
        if (this.#solutions.length > KEPT_SOLUTIONS) this.#solutions.pop();
    }

    /** A remembered solution that keeps the active constraints, `fixed` and the `extra` formulas, if any. */
    #knownSolution(active, fixed, extra) {
        if (!this.#solutions.length) return null;
        const parts = this.#parts(active);
        const order = this.timeOrder;
        for (const sol of this.#solutions) {
            if (!Object.entries(fixed).every(([s, v]) => sol.get(s) === v)) continue;
            if (extra.every((f) => evaluate(f, sol, order) === true) && parts.every((p) => evaluate(p.formula, sol, order) === true)) return sol;
        }
        return null;
    }

    /** Values of `slot` that some full solution of the active constraints allows. */
    candidates(active, slot, fixed = {}) {
        const cons = this.#parts(active);
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

    /**
     * candidates() for many slots at once. Every solution found supports all the values in it, so per group of
     * linked slots: propagate once, take one solution, and search again only for values no solution has shown yet.
     * Returns Map slot -> values (slots no active constraint touches keep their whole domain).
     *
     * Incremental: when the active constraints include all those of the last call (the player holds more), every
     * solution now was one then, so a value ruled out then stays out, and a solution found then that keeps the
     * new constraints too still shows its values without a search.
     */
    allCandidates(active, slots) {
        const ids = new Set(active);
        const prior = this.#lastAll && [...this.#lastAll.active].every((id) => ids.has(id)) ? this.#lastAll : null;
        if (prior && prior.active.size === ids.size && slots.every((s) => prior.out.has(s))) return new Map(slots.map((s) => [s, prior.out.get(s)]));
        let start = null;
        if (prior) {
            start = new Map(this.domains);
            for (const [s, vs] of prior.out) start.set(s, start.get(s).filter((v) => vs.includes(v)));
        }
        const cons = this.#parts(active);
        const want = new Set(slots);
        const out = new Map();
        const sols = [];
        let done = 0;
        for (const group of components(cons, [...want])) {
            const mine = group.slots.filter((s) => want.has(s));
            if (!mine.length) continue;
            const root = this.#search(group, {}, 0, start, null, true);
            if (!root.domains) { for (const s of mine) out.set(s, []); continue; }
            const seen = new Map(group.slots.map((s) => [s, new Set()]));
            const note = (sol) => { if (!sol) return; sols.push(sol); for (const [s, v] of sol) seen.get(s)?.add(v); };
            // Each search tries the values no solution has shown yet first, so one solution covers many of them.
            const unseenFirst = (x, d) => { const fresh = d.filter((v) => !seen.get(x).has(v)); return fresh.length && fresh.length < d.length ? [...fresh, ...d.filter((v) => seen.get(x).has(v))] : d; };
            const base = this.#search(group, {}, 1, root.domains).first;
            note(base);
            if (base && group.slots.some((s) => root.domains.get(s).length > 1)) {
                // The last call's solutions, completed from this one's, where they keep every constraint now.
                for (const old of prior?.sols ?? []) {
                    const sol = new Map(base);
                    let fresh = false;
                    for (const s of group.slots) {
                        const v = old.get(s);
                        if (v !== undefined && v !== sol.get(s)) { sol.set(s, v); fresh ||= !seen.get(s).has(v); }
                    }
                    if (fresh && group.cons.every((c) => evaluate(c.formula, sol, this.timeOrder) === true)) note(sol);
                }
            }
            // A value the first solution, so changed and mended in a few of its other slots, still satisfies needs no
            // search: most values of a large group differ from a solution in a handful of slots. Mending is greedy
            // (a broken part takes the change that leaves the fewest parts broken); what it finds is checked whole.
            const touching = new Map(group.slots.map((s) => [s, []]));
            for (const c of group.cons) for (const x of c.scope) touching.get(x).push(c);
            const order = this.timeOrder;
            const holds = (c, sol) => evaluate(c.formula, sol, order) === true;
            const mended = (s, v) => {
                if (!base) return null;
                const sol = new Map(base).set(s, v);
                const kept = new Set([s]);
                const broken = (x) => touching.get(x).filter((c) => !holds(c, sol));
                let todo = broken(s);
                for (let round = 0; todo.length && round < MEND_STEPS; round++) {
                    const c = todo[0];
                    let best = null;
                    for (const x of c.scope) {
                        if (kept.has(x)) continue;
                        const was = sol.get(x);
                        for (const w of root.domains.get(x)) {
                            if (w === was) continue;
                            sol.set(x, w);
                            if (holds(c, sol)) { const n = broken(x).length; if (!best || n < best.n) best = { x, w, n }; }
                        }
                        sol.set(x, was);
                    }
                    if (!best) return null;
                    sol.set(best.x, best.w);
                    kept.add(best.x);
                    todo = [...new Set([...todo, ...touching.get(best.x)])].filter((c2) => !holds(c2, sol));
                }
                return !todo.length && group.cons.every((c) => holds(c, sol)) ? sol : null;
            };
            for (const s of mine) {
                this.onProgress?.(++done, slots.length, 'answers');
                for (const v of root.domains.get(s)) {
                    if (seen.get(s).has(v)) continue;
                    const sol = mended(s, v);
                    if (sol) { note(sol); continue; }
                    const r = this.#search(group, { [s]: v }, 1, root.domains, unseenFirst);
                    if (r.count) note(r.first);
                }
                out.set(s, root.domains.get(s).filter((v) => seen.get(s).has(v)));
            }
        }
        this.#lastAll = { active: ids, out, sols };
        return out;
    }
    #lastAll = null;

    /** Number of solutions over the slots the active constraints mention, capped at `limit`. */
    countSolutions(active, limit = 2) {
        const cons = this.#parts(active);
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
    explainConflict(active, fixed = {}, { extra = [] } = {}) {
        const all = [...active];
        if (this.consistent(all, fixed, { extra }).ok) return null;
        // QuickXplain (Junker 2004): halve the candidates, keeping a half whenever the rest already clashes, so a
        // clash of k among n costs about k·log n checks instead of n.
        let checks = 0;
        const ok = (ids) => { this.onProgress?.(++checks, Math.max(checks, 2 * Math.ceil(Math.log2(all.length + 1)) * 4), 'clues'); return this.consistent(ids, fixed, { extra }).ok; };
        const qx = (base, added, cands) => {
            if (added && !ok(base)) return [];
            if (cands.length <= 1) return cands; // none: the clash is in `fixed` and `extra` alone
            const mid = cands.length >> 1;
            const c1 = cands.slice(0, mid);
            const c2 = cands.slice(mid);
            const d2 = qx([...base, ...c1], c1.length > 0, c2);
            const d1 = qx([...base, ...d2], d2.length > 0, c1);
            return [...d1, ...d2];
        };
        // The world model's ties are background: always in, never the explanation (no one doubts them).
        const background = all.filter((id) => this.constraints.get(id)?.lazy);
        const cands = all.filter((id) => !this.constraints.get(id)?.lazy);
        const found = background.length && ok(cands) ? qx(background, false, cands) : qx([], false, cands);
        return all.filter((id) => found.includes(id));
    }

    /**
     * Replay a clash one clue at a time, for showing it as a chain of reasoning. Starting from the full domains
     * (narrowed by `fixed`), each step applies the clue that narrows most decisively (empties a slot, then pins
     * one, then prunes most) and records what it narrowed. Stops when a slot has nothing left (contradiction:
     * true) or no clue narrows anything more (a clash too tangled to replay this simply).
     * @returns {{steps: {id:string, changes:{slot:string, before:string[], after:string[]}[]}[], contradiction:boolean}}
     */
    steps(ids, fixed = {}) {
        const domains = new Map();
        for (const id of ids) {
            for (const sl of this.#get(id).scope) {
                if (domains.has(sl)) continue;
                const d = this.domains.get(sl);
                domains.set(sl, sl in fixed ? d.filter((v) => v === fixed[sl]) : d);
            }
        }
        const used = new Set();
        const out = [];
        for (let round = 0; round < ids.length * 3; round++) {
            let best = null;
            for (const id of ids) {
                const changed = this.#narrow(id, domains);
                if (!changed.size) continue;
                const emptied = [...changed.values()].some((d) => d.length === 0);
                const pinned = [...changed.values()].filter((d) => d.length === 1).length;
                const pruned = [...changed].reduce((n, [sl, d]) => n + domains.get(sl).length - d.length, 0);
                const score = [emptied ? 1 : 0, pinned, used.has(id) ? 0 : 1, -pruned];
                if (!best || compare(score, best.score) > 0) best = { id, changed, score };
            }
            if (!best) return { steps: out, contradiction: false };
            used.add(best.id);
            out.push({ id: best.id, changes: [...best.changed].map(([slot, after]) => ({ slot, before: domains.get(slot), after })) });
            for (const [sl, d] of best.changed) domains.set(sl, d);
            if (best.score[0]) return { steps: out, contradiction: true };
        }
        return { steps: out, contradiction: false };
    }

    /** What one constraint alone removes from the given domains: Map slot -> narrowed domain (changed slots only). */
    #narrow(id, domains) {
        const local = new Map();
        const dom = (sl) => local.get(sl) ?? domains.get(sl);
        const order = this.timeOrder;
        let progress = true;
        while (progress) {
            progress = false;
            for (const part of this.#get(id).parts) {
                const lookup = part.index ? part.formula : part.guard && settled(part.guard, dom, order) ? part.lookup : null;
                if (lookup) {
                    const changed = indexPrune(lookup, dom);
                    if (!changed) { local.set(part.scope[0], []); return local; }
                    for (const [x, nd] of changed) {
                        if (nd.length === dom(x).length) continue;
                        local.set(x, nd);
                        progress = nd.length > 0;
                        if (!nd.length) return local;
                    }
                    continue;
                }
                for (const x of part.scope) {
                    const d = dom(x);
                    const others = part.scope.filter((sl) => sl !== x);
                    const nd = d.filter((v) => {
                        const assign = new Map([[x, v]]);
                        let budget = SUPPORT_BUDGET;
                        const dfs = (i) => {
                            const r = evaluate(part.formula, assign, order);
                            if (r === false) return false;
                            if (r === true || i === others.length || --budget < 0) return true;
                            for (const w of dom(others[i])) {
                                assign.set(others[i], w);
                                const ok = dfs(i + 1);
                                assign.delete(others[i]);
                                if (ok) return true;
                            }
                            return false;
                        };
                        return dfs(0);
                    });
                    if (nd.length < d.length) {
                        local.set(x, nd);
                        progress = nd.length > 0;
                        if (!nd.length) return local;
                    }
                }
            }
        }
        return local;
    }

    /** The parts of the active constraints, one copy of each distinct formula (several inferences may carry the same rule application). */
    #parts(active) {
        const seen = new Set();
        const out = [];
        for (const id of active) for (const p of this.#get(id).parts) if (!seen.has(p.key)) { seen.add(p.key); out.push(p); }
        return out;
    }

    #get(id) {
        const c = this.constraints.get(id);
        if (!c) throw new Error(`unknown constraint ${id}`);
        return c;
    }

    /**
     * Search one component. limit = 0 only propagates and returns the reduced domains ({domains} or {} when
     * inconsistent); otherwise counts solutions up to `limit`. `start` = domains to begin from (already
     * propagated for the same constraints, unless `full`: then propagate them all). `valueOrder(slot, values)` may
     * reorder the values tried.
     */
    #search(group, fixed, limit, start = null, valueOrder = null, full = false) {
        const domains = new Map();
        for (const s of group.slots) {
            let d = (start ?? this.domains).get(s);
            if (s in fixed) d = d.includes(fixed[s]) ? [fixed[s]] : [];
            domains.set(s, d);
        }
        const bySlot = new Map(group.slots.map((s) => [s, []]));
        for (const c of group.cons) for (const s of c.scope) bySlot.get(s).push(c);
        // `assign`: every slot down to one value, whether the search chose it or propagation (or a fixed value)
        // settled it. A constraint is checked once all its slots are in here, and only the rest count as open:
        // a wide part whose other slots the clues pin would otherwise never be enforced.
        const assign = new Map();
        for (const [s, d] of domains) if (d.length === 1) assign.set(s, d[0]);
        const order = this.timeOrder;
        const trail = [];
        const setDomain = (x, d) => {
            const settledNow = d.length === 1 && !assign.has(x);
            trail.push([x, domains.get(x), settledNow]);
            domains.set(x, d);
            if (settledNow) assign.set(x, d[0]);
        };
        const undoTo = (mark) => {
            while (trail.length > mark) {
                const [u, d, settledNow] = trail.pop();
                domains.set(u, d);
                if (settledNow) assign.delete(u);
            }
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
                this.#tick();
                const c = queue.pop();
                queued.delete(c);
                if (c.scope.every((s) => assign.has(s))) {
                    if (evaluate(c.formula, assign, order) === false) return false;
                    continue;
                }
                const lookup = c.index ? c.formula : c.guard && settled(c.guard, (s) => domains.get(s), order) ? c.lookup : null;
                if (lookup) {
                    // A lookup: prune the key's values whose target cannot hold what is required; a settled key
                    // settles its target.
                    const changed = indexPrune(lookup, (s) => domains.get(s));
                    if (!changed) return false;
                    for (const [x, nd] of changed) {
                        if (nd.length === domains.get(x).length) continue;
                        setDomain(x, nd);
                        if (nd.length === 0) return false;
                        for (const c2 of bySlot.get(x)) if (c2 !== c && !queued.has(c2)) { queued.add(c2); queue.push(c2); }
                    }
                    continue;
                }
                // A guarded lookup whose key is settled is a small implication: "if the guard holds, this target
                // has this value". Check that, though its guard may span more slots than a plain part may.
                let p = c;
                if (c.guard) {
                    p = settledLookup(c, (s) => domains.get(s));
                    if (!p) continue;
                } else if (c.cond) {
                    const g = evaluate(c.cond, assign, order);
                    if (g === false) continue; // the condition fails: the part holds whatever the rest
                    if (g === true) p = c.then; // only the consequent is left to enforce
                }
                const open = p.scope.filter((x) => !assign.has(x));
                if (open.length > (p === c || p === c.then ? GAC_MAX_SCOPE : GUARD_MAX_SCOPE)) continue; // checked once few enough of its slots stay open
                for (const x of open) {
                    const d = domains.get(x);
                    const nd = d.filter((v) => supported(p, x, v));
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

        // The keys of lookups and the slots of their guards: the search branches on these first (see `step`).
        const pivots = [...new Set(group.cons.flatMap((c) => {
            const lookup = c.index ? c.formula : c.lookup;
            return lookup ? [(lookup.index ?? lookup.nindex)[0], ...(c.guard ? slotsOf(c.guard) : [])] : [];
        }))];
        // Conditional parts, for `urgent` below.
        const conditionals = group.cons.filter((c) => c.cond);

        for (const d of domains.values()) if (d.length === 0) return { count: 0 };
        if (start && !full) {
            const queue = new Set();
            for (const s of Object.keys(fixed)) for (const c of bySlot.get(s) ?? []) queue.add(c);
            if (!propagate([...queue])) return { count: 0 };
        } else if (!propagate([...group.cons])) return { count: 0 };
        if (limit === 0) return { count: 0, domains: new Map(domains) };

        // Slots propagation has settled link nothing: split what is still open into independent parts and search
        // each alone (a solution is one solution of each part). A constraint whose slots are all settled is checked
        // here, since propagation skips a wide one.
        for (const c of group.cons) if (c.scope.every((x) => domains.get(x).length === 1)) {
            if (evaluate(c.formula, new Map(c.scope.map((x) => [x, domains.get(x)[0]])), order) === false) return { count: 0 };
        }
        const parent = new Map();
        const find = (x) => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
        const openSlots = group.slots.filter((x) => domains.get(x).length > 1);
        for (const x of openSlots) parent.set(x, x);
        for (const c of group.cons) {
            const open = c.scope.filter((x) => parent.has(x));
            for (let i = 1; i < open.length; i++) parent.set(find(open[i]), find(open[0]));
        }
        const parts = new Map();
        for (const x of openSlots) { const r = find(x); if (!parts.has(r)) parts.set(r, []); parts.get(r).push(x); }

        // Smallest domain first, but the keys and guards of lookups before everything else: once they are settled
        // the lookups act, and the many small relation slots they range over need no branching. The open slots of
        // each pool are kept from `at` on: the chosen one is swapped to `at`, which moves past it while it is set.
        const pivotSet = new Set(pivots);
        const solve = (slots, cap) => {
            let count = 0;
            let first = null;
            const pools = [{ open: slots.filter((x) => pivotSet.has(x)), at: 0 }, { open: slots.filter((x) => !pivotSet.has(x)), at: 0 }];
            // A condition with at most two slots still open, not yet decided: settling one of them lets the
            // implication act (or drop) instead of being rediscovered under every combination of the other slots.
            const urgent = () => {
                let out = null;
                for (const c of conditionals) {
                    let open = 0;
                    for (const x of c.condSlots) if (!assign.has(x) && ++open > 2) break;
                    if (open === 0 || open > 2 || evaluate(c.cond, assign, order) !== U) continue;
                    out ??= new Set();
                    for (const x of c.condSlots) if (!assign.has(x)) out.add(x);
                }
                return out;
            };
            const step = () => {
                this.#tick();
                const pool = pools.find((p) => p.at < p.open.length);
                if (!pool) {
                    count++;
                    if (!first) first = new Map(slots.map((x) => [x, assign.get(x)]));
                    return count >= cap;
                }
                const { open, at } = pool;
                const hot = conditionals.length ? urgent() : null;
                let pick = at;
                for (let i = at, best = [Infinity, Infinity]; i < open.length; i++) {
                    const n = domains.get(open[i]).length;
                    const score = [n <= 1 ? -1 : hot?.has(open[i]) ? 0 : 1, n];
                    if (compare(score, best) < 0) { pick = i; best = score; if (n <= 1) break; } // nothing beats a settled slot
                }
                [open[at], open[pick]] = [open[pick], open[at]];
                const best = open[at];
                pool.at++;
                for (const v of valueOrder ? valueOrder(best, domains.get(best)) : domains.get(best)) {
                    const mark = trail.length;
                    assign.set(best, v);
                    setDomain(best, [v]);
                    if (propagate([...bySlot.get(best)]) && step()) { pool.at--; return true; }
                    assign.delete(best);
                    undoTo(mark);
                }
                pool.at--;
                return false;
            };
            step();
            return { count, first };
        };
        const first = new Map(group.slots.filter((x) => domains.get(x).length === 1).map((x) => [x, domains.get(x)[0]]));
        let count = 1;
        for (const slots of parts.values()) {
            const r = solve(slots, limit);
            if (!r.count) return { count: 0 };
            count = Math.min(limit, count * r.count);
            for (const [x, v] of r.first) first.set(x, v);
        }
        return { count, first };
    }
}

const SUPPORT_BUDGET = 5000;
/** How many further slots allCandidates may change to mend a solution for a value before it searches. */
const MEND_STEPS = 8;
/** How many whole solutions consistent() remembers. */
const KEPT_SOLUTIONS = 16;
/** How many search steps a check with the ties gets before it falls back to checking without them first. */
const EAGER_STEPS = 20000;

/**
 * Propagate one lookup part ({index: [key, map, value, outside]} or nindex) over domains read through `dom`.
 * Returns a Map of narrowed domains (key, and the target when the key is settled), or null when the key has no
 * value left. index: a key value whose target cannot be `value` goes; a settled key pins its target to `value`.
 * nindex: a key value whose target can only be `value` goes; a settled key removes `value` from its target.
 */
function indexPrune(formula, dom) {
    const op = 'index' in formula ? 'index' : 'nindex';
    const [key, map, value, outside] = formula[op];
    const pos = op === 'index';
    const out = new Map();
    const keys = dom(key).filter((v) => {
        const target = map[v];
        if (target === undefined) return (outside === value) === pos; // beyond the relation's range: a fixed value
        const d = dom(target);
        return pos ? d.includes(value) : d.some((w) => w !== value);
    });
    if (!keys.length) return null;
    out.set(key, keys);
    if (keys.length === 1 && map[keys[0]] !== undefined) {
        const target = map[keys[0]];
        out.set(target, dom(target).filter((w) => (w === value) === pos));
    }
    return out;
}

/**
 * A formula as a list of alternatives, each a list of formulas to hold together (their disjunction is the
 * formula): a denied conjunction is one denied part or another; a denied implication is its condition with a
 * denied consequent; a conjunction combines its members' alternatives. Anything else is itself, alone.
 */
export function alternatives(f) {
    if (f.not) {
        const g = f.not;
        if (g.not) return alternatives(g.not);
        if (g.and) return g.and.flatMap((q) => alternatives({ not: q }));
        if (g.implies) return alternatives({ not: g.implies[1] }).map((alt) => [g.implies[0], ...alt]);
        if (g.or) return [g.or.map((q) => ({ not: q }))];
        return [[f]];
    }
    if (f.or) return f.or.flatMap(alternatives);
    if (f.and) {
        let out = [[]];
        for (const g of f.and) {
            const alts = alternatives(g);
            if (alts.length === 1) { out = out.map((o) => [...o, ...alts[0]]); continue; }
            if (out.length * alts.length > 64) { out = out.map((o) => [...o, g]); continue; } // too many: keep it whole
            out = out.flatMap((o) => alts.map((a) => [...o, ...a]));
        }
        return out;
    }
    return [[f]];
}

/** Does formula `f` already hold, reading every slot whose domain is down to one value as assigned? */
function settled(f, dom, order) {
    const assign = new Map();
    for (const s of slotsOf(f)) {
        const d = dom(s);
        if (d.length === 1) assign.set(s, d[0]);
    }
    return evaluate(f, assign, order) === true;
}

/** Lexicographic comparison of two score arrays. */
function compare(a, b) {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
    return 0;
}
const GAC_MAX_SCOPE = 3;
const GUARD_MAX_SCOPE = 8;

/**
 * A guarded lookup part ({implies: [guard, index]}) once its key is settled: {formula: implies(guard, target is /
 * is not value), scope}. Null while the key is open.
 */
function settledLookup(part, dom) {
    const pos = 'index' in part.lookup;
    const [key, map, value, outside] = part.lookup.index ?? part.lookup.nindex;
    const kd = dom(key);
    if (kd.length !== 1) return null;
    const target = map[kd[0]];
    const then = target === undefined ? ((outside === value) === pos ? { true: true } : { false: true }) : pos ? { eq: [target, value] } : { ne: [target, value] };
    const formula = { implies: [part.guard, then] };
    return { formula, scope: [...slotsOf(formula)] };
}

const isIndex = (f) => 'index' in f || 'nindex' in f;

/**
 * One part of a constraint for the search. A lookup part propagates as a lookup. A lookup under an implication
 * ("if these hold, the visitor's relation is true") is GUARDED: its scope spans every target of the lookup, so it
 * is propagated as a lookup once its condition is settled.
 */
function makePart(formula) {
    const guarded = formula.implies && isIndex(formula.implies[1]) ? { guard: formula.implies[0], lookup: formula.implies[1] } : {};
    // Any other implication: once its condition is settled, either nothing is left to enforce or only the
    // consequent is (a rule application's "if these facts hold" is usually settled by the clues).
    const conditional = formula.implies && !guarded.guard ? { cond: formula.implies[0], condSlots: [...slotsOf(formula.implies[0])], then: { formula: formula.implies[1], scope: [...slotsOf(formula.implies[1])] } } : {};
    return { formula, scope: [...slotsOf(formula)], index: isIndex(formula), ...guarded, ...conditional };
}

/**
 * Push a negation inward where that keeps the parts small: not(not f) = f, not(a → b) = a ∧ ¬b, and the negation
 * of a lookup is the opposite lookup (with the same reading beyond the relation's range).
 */
function pushNot(f) {
    if (!f.not) return f;
    const g = f.not;
    if (g.not) return pushNot(g.not);
    if (g.implies) return { and: [g.implies[0], pushNot({ not: g.implies[1] })] };
    if (g.index) return { nindex: g.index };
    if (g.nindex) return { index: g.nindex };
    return f;
}

/**
 * Split a formula into parts whose conjunction is equivalent: and(a,b) → a, b; implies(p, and(a,b)) →
 * implies(p,a), implies(p,b); implies(p, implies(q, r)) → implies(p ∧ q, r). (A doubted rule application,
 * "if it is false, the rule fails here", so splits into a guard and a lookup the search can propagate.)
 */
export function splitConjunctions(f) {
    f = pushNot(f);
    if (f.and) return f.and.flatMap(splitConjunctions);
    if (f.implies) {
        const [p, q0] = f.implies;
        const q = pushNot(q0);
        if (q.and) return q.and.flatMap((g) => splitConjunctions({ implies: [p, g] }));
        if (q.implies) return splitConjunctions({ implies: [{ and: [p, q.implies[0]] }, q.implies[1]] });
        if (q !== q0) return [{ implies: [p, q] }];
    }
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
