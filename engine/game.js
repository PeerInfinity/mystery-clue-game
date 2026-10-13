// Player state and the game's questions, on top of a case model (caseModel.js).
//
// Collecting: actions from the investigation (actions.json) unlock cards; an action can also need reasoning
//   steps, which count as made once the player has proved the step's conclusion.
// Connecting: every visible slot has candidates. Easy mode lists the whole domain; hard mode starts empty and
//   the player adds candidates. Crossing a candidate out is a pencil mark; citing cards with it turns it into
//   a checked elimination. Proving a value = citing cards that rule out every other value.
// Plausibility: "shape" = the value has the right type for the slot. Easy mode also checks the clues the
//   player has unlocked (never hidden ones, never the answer) and names the constraints that conflict.
// Theories: named assignments, checked against the unlocked clues.

import { activeConstraints, checkStep } from './caseModel.js';

export const EASY = 'easy';
export const HARD = 'hard';

export class Game {
    constructor(model, { difficulty = EASY, allRules = true, state = null } = {}) {
        this.model = model;
        this.difficulty = difficulty;
        this.allRules = allRules;
        this.actions = [...(model.data.actions ?? [])].sort((a, b) => a.order - b.order);
        this.actionById = new Map(this.actions.map((a) => [a.id, a]));
        this.routeById = new Map((model.data.route ?? []).map((r) => [r.id, r]));
        // GIVENS (sudoku's printed digits): a clue that is not testimony and states a slot's value outright fills
        // that slot as soon as the clue is found. Testimony (truth-slotted claims) never does: it may be false.
        this.givers = new Map();
        for (const c of model.data.claims ?? []) {
            if (c.derived || c.truth_slot || !c.asserts) continue;
            for (const f of c.asserts.and ?? [c.asserts]) {
                if (!f.eq) continue;
                const [slot, value] = f.eq;
                if (!this.givers.has(slot)) this.givers.set(slot, []);
                this.givers.get(slot).push({ claim: c.id, value });
            }
        }
        this.reset();
        if (state) this.load(state);
    }

    reset() {
        this.done = [];                 // action ids, in the order the player did them (investigation axis)
        this.unlocked = new Map();      // card id → {via: action id | 'start', at: index in this.done}
        this.items = new Set(this.model.data.case.starting_items ?? []);
        this.marks = new Map();         // slot id → {listed: Set|null, struck: Map value → {cited, used}|{}, proven: {value, cited, used}|null}
        this.theories = [];             // {id, label, assignment: {slot: value}}
        if (this.allRules) for (const r of this.model.data.rules ?? []) this.unlocked.set(r.id, { via: 'start', at: -1 });
    }

    // ---------- persistence ----------
    save() {
        return {
            difficulty: this.difficulty,
            allRules: this.allRules,
            done: this.done,
            marks: [...this.marks].map(([slot, m]) => [slot, {
                listed: m.listed ? [...m.listed] : null,
                struck: [...m.struck],
                proven: m.proven,
            }]),
            theories: this.theories,
        };
    }

    load(state) {
        this.difficulty = state.difficulty ?? this.difficulty;
        this.allRules = state.allRules ?? this.allRules;
        this.reset();
        for (const id of state.done ?? []) if (this.actionById.has(id)) this.#apply(this.actionById.get(id));
        for (const [slot, m] of state.marks ?? []) {
            if (!this.model.slots.has(slot)) continue;
            this.marks.set(slot, { listed: m.listed ? new Set(m.listed) : null, struck: new Map(m.struck), proven: m.proven });
        }
        this.theories = state.theories ?? [];
    }

    // ---------- collecting ----------
    knows(cardId) { return this.unlocked.has(cardId); }
    known() { return new Set(this.unlocked.keys()); }

    /** A reasoning step counts as made once the player has proved its conclusion. */
    stepMade(stepId) {
        const step = this.routeById.get(stepId);
        if (!step) return false;
        const c = step.concludes;
        if (c.slot) {
            if (this.isStruckWithProof(c.slot, c.value)) return true;
            const p = this.provenValue(c.slot);
            return p !== null && p !== c.value;
        }
        const f = c.formula ?? this.model.cards.get(c.claim)?.asserts;
        return this.#entailedByProofs(f);
    }

    missingFor(action) {
        const r = action.requires ?? {};
        return {
            actions: (r.actions ?? []).filter((a) => !this.done.includes(a)),
            cards: (r.cards ?? []).filter((c) => !this.knows(c)),
            steps: (r.steps ?? []).filter((s) => !this.stepMade(s)),
            items: (r.items ?? []).filter((i) => !this.items.has(i)),
        };
    }

    available() {
        return this.actions.filter((a) => !this.done.includes(a.id) && Object.values(this.missingFor(a)).every((m) => m.length === 0));
    }

    perform(actionId) {
        const a = this.actionById.get(actionId);
        if (!a || this.done.includes(actionId)) return null;
        const missing = this.missingFor(a);
        if (Object.values(missing).some((m) => m.length)) return { ok: false, missing };
        const before = new Set(this.unlocked.keys());
        this.#apply(a);
        return { ok: true, newCards: [...this.unlocked.keys()].filter((k) => !before.has(k)), items: a.yields?.items ?? [] };
    }

    #apply(a) {
        const at = this.done.length;
        this.done.push(a.id);
        for (const c of a.yields?.cards ?? []) this.#unlock(c, a.id, at);
        for (const i of a.yields?.items ?? []) { this.items.add(i); this.#unlock(i, a.id, at); }
        // A claim brings the cards it is about, and the events whose slots it speaks of.
        for (const c of a.yields?.cards ?? []) {
            const claim = this.model.cards.get(c);
            for (const x of claim?.about ?? []) this.#unlock(x, a.id, at);
            const k = this.model.constraints.get(`k.${c}`);
            if (k) for (const s of slotsIn(k.formula)) this.#unlock(this.model.slots.get(s)?.on, a.id, at);
        }
        for (const x of [a.place, a.actor]) this.#unlock(x, a.id, at);
        if (!this.allRules) this.#unlockToldRules(at, a.id);
    }

    /** "As told" rule cards: a rule becomes known once the story has reached the scene that states it. */
    #unlockToldRules(at, via) {
        const order = this.model.sceneOrder;
        let reached = -1;
        for (const id of this.done) {
            const a = this.actionById.get(id);
            for (const s of [a.during_scene, a.narrated_in]) if (s) reached = Math.max(reached, order.get(s));
        }
        for (const r of this.model.data.rules ?? []) {
            if (r.stated_in && order.get(r.stated_in) <= reached) this.#unlock(r.id, via, at);
        }
    }

    #unlock(id, via, at) {
        if (id && this.model.cards.has(id) && !this.unlocked.has(id)) this.unlocked.set(id, { via, at });
    }

    // ---------- slots ----------
    visibleSlots() {
        return [...this.model.slots.values()].filter((s) => this.knows(s.on));
    }

    slotsOn(cardId) {
        return [...this.model.slots.values()].filter((s) => s.on === cardId);
    }

    #mark(slot) {
        if (!this.marks.has(slot)) this.marks.set(slot, { listed: this.difficulty === HARD ? new Set() : null, struck: new Map(), proven: null });
        return this.marks.get(slot);
    }

    /** The values the player is currently considering for a slot (listed minus struck). */
    pencil(slot) {
        const m = this.marks.get(slot);
        const s = this.model.slots.get(slot);
        const g = this.given(slot);
        if (g) return [g.value];
        if (m?.proven) return [m.proven.value];
        const base = m?.listed ? [...m.listed] : this.difficulty === HARD ? [] : s.domain;
        return base.filter((v) => !m?.struck.has(v));
    }

    addCandidate(slot, value) {
        const m = this.#mark(slot);
        if (!m.listed) m.listed = new Set(this.model.slots.get(slot).domain);
        m.listed.add(value);
        m.struck.delete(value);
        return this.shapeFits(slot, value);
    }

    /** Cross a value out. With cited cards, the elimination is checked; a failed check leaves no mark. */
    strike(slot, value, cited = null) {
        const m = this.#mark(slot);
        if (!cited || !cited.length) {
            m.struck.set(value, {});
            return { ok: true, proof: false };
        }
        const res = this.checkElimination(slot, value, cited);
        if (res.ok) m.struck.set(value, { cited, used: res.used });
        return { ...res, proof: res.ok };
    }

    unstrike(slot, value) {
        this.marks.get(slot)?.struck.delete(value);
    }

    isStruckWithProof(slot, value) {
        return !!this.marks.get(slot)?.struck.get(value)?.cited;
    }

    provenValue(slot) {
        return this.marks.get(slot)?.proven?.value ?? null;
    }

    /** Prove a value outright: the cited cards must leave nothing else possible. */
    prove(slot, value, cited) {
        const res = this.checkConclusion({ eq: [slot, value] }, cited);
        if (res.ok) this.#mark(slot).proven = { value, cited, used: res.used };
        return res;
    }

    unprove(slot) {
        const m = this.marks.get(slot);
        if (m) m.proven = null;
    }

    /** The clue that hands this slot its value, if the player holds one. */
    given(slot) {
        return (this.givers.get(slot) ?? []).find((g) => this.knows(g.claim)) ?? null;
    }

    /** Settled = given by a clue, proven, or every other value struck with a proof. */
    settled(slot) {
        const g = this.given(slot);
        if (g) return g.value;
        if (this.provenValue(slot) !== null) return this.provenValue(slot);
        const s = this.model.slots.get(slot);
        const left = s.domain.filter((v) => !this.isStruckWithProof(slot, v));
        return left.length === 1 ? left[0] : null;
    }

    // ---------- checking ----------
    /** Only cards the player holds can be cited. */
    #citable(cited) {
        const bad = cited.filter((c) => !this.knows(c));
        if (bad.length) return { ok: false, reason: `not yet found: ${bad.join(', ')}` };
        return null;
    }

    checkElimination(slot, value, cited) {
        return this.#citable(cited) ?? checkStep(this.model, cited, { slot, value });
    }

    checkConclusion(formula, cited) {
        return this.#citable(cited) ?? checkStep(this.model, cited, { formula });
    }

    shapeFits(slot, value) {
        return this.model.slots.get(slot).domain.includes(value);
    }

    /**
     * Could `value` fill `slot`? Always the shape check; in easy mode also the unlocked clues (and the
     * player's own proofs stay out of it: they follow from the clues anyway).
     */
    plausible(slot, value) {
        if (!this.shapeFits(slot, value)) return { plausible: false, why: 'shape' };
        if (this.difficulty === HARD) return { plausible: true, why: 'shape only' };
        const active = this.activeConstraints();
        if (this.model.problem.consistent(active, { [slot]: value }, { focus: true }).ok) return { plausible: true };
        return { plausible: false, why: 'clues', conflict: this.model.problem.explainConflict(active, { [slot]: value }) };
    }

    /** Easy mode's automatic list: every value the unlocked clues still allow. */
    openValues(slot) {
        return this.model.problem.candidates(this.activeConstraints(), slot);
    }

    activeConstraints() {
        return activeConstraints(this.model, this.known()).filter((id) => !this.model.constraints.get(id).derived);
    }

    #entailedByProofs(formula) {
        if (!formula) return false;
        // The player's settled values, as fixed assignments: does the formula hold under them?
        const fixed = {};
        for (const s of this.marks.keys()) {
            const v = this.settled(s);
            if (v !== null) fixed[s] = v;
        }
        const res = this.model.problem.consistent([], fixed, { extra: [{ not: formula }] });
        return !res.ok;
    }

    // ---------- theories ----------
    addTheory(label, assignment = {}) {
        const id = `t.player_${this.theories.length + 1}`;
        this.theories.push({ id, label, assignment });
        return id;
    }

    checkTheory(theory) {
        const active = this.activeConstraints();
        const conflict = this.model.problem.explainConflict(active, theory.assignment);
        return { fits: !conflict, conflict };
    }

    // ---------- the three time axes ----------
    /** Fabula: events the player holds, with the time windows still open for each. */
    fabula() {
        return (this.model.data.events ?? []).filter((e) => this.knows(e.id)).map((e) => {
            const slot = `${e.id}.time`;
            const has = this.model.slots.has(slot);
            return { event: e, slot: has ? slot : null, settled: has ? this.settled(slot) : null, pencil: has ? this.pencil(slot) : [] };
        });
    }

    /** Investigation: the player's own order of discovery. */
    investigation() {
        return this.done.map((id, i) => ({ action: this.actionById.get(id), index: i, cards: [...this.unlocked].filter(([, u]) => u.at === i).map(([c]) => c) }));
    }

    /** Disclosure: where in the story each held card is first told. */
    disclosure(cardId) {
        const c = this.model.cards.get(cardId);
        if (!c) return null;
        if (c.section === 'claims') return c.attested.map((a) => a.scene).sort((a, b) => this.model.sceneOrder.get(a) - this.model.sceneOrder.get(b))[0];
        if (c.section === 'entities') return c.first_mentioned;
        if (c.section === 'events') return c.told_in;
        if (c.section === 'rules') return c.stated_in;
        return null;
    }
}

function slotsIn(f, out = new Set()) {
    for (const [op, a] of Object.entries(f)) {
        if (['eq', 'ne', 'in', 'nin'].includes(op)) out.add(a[0]);
        else if (['same', 'diff'].includes(op)) { out.add(a[0]); out.add(a[1]); }
        else if (['before', 'not_after'].includes(op)) for (const x of a) { if (typeof x === 'string') out.add(x); }
        else if (op === 'and' || op === 'or') for (const g of a) slotsIn(g, out);
        else if (op === 'not') slotsIn(a, out);
        else if (op === 'implies') { slotsIn(a[0], out); slotsIn(a[1], out); }
    }
    return out;
}
