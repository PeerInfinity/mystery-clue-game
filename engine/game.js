// Player state and the game's questions, on top of a case model (caseModel.js + story.js).
//
// Reading: the story advances one paragraph at a time. Holmes's actions happen as the text reaches them. With
//   the 'wait' pace, a paragraph where Holmes acts on (or announces) a deduction cannot be read until the
//   player has made that deduction.
// Collecting: in Trivial and Easy, every card mentioned in a paragraph is collected as it is read. In Hard,
//   a card is collected only when the player clicks the text that mentions it.
// Connecting: every visible slot has candidates.
//   Trivial: the whole domain, the values the collected clues already rule out are greyed; cross-outs may be
//     plain pencil marks.
//   Easy: the whole domain, nothing greyed; every cross-out needs cited evidence the game accepts.
//   Hard: the player proposes candidates first (only their type is checked); cross-outs need evidence.
// Background facts (rule cards) sit on the entity cards they belong to and arrive with them.

import { activeConstraints, checkStep } from './caseModel.js';

export const TRIVIAL = 'trivial';
export const EASY = 'easy';
export const HARD = 'hard';
export const FREE = 'free';
export const WAIT = 'wait';

export class Game {
    constructor(model, { difficulty = EASY, pace = FREE, state = null } = {}) {
        this.model = model;
        this.story = model.story;
        this.difficulty = difficulty;
        this.pace = pace;
        this.actions = [...(model.data.actions ?? [])].sort((a, b) => a.order - b.order);
        this.actionById = new Map(this.actions.map((a) => [a.id, a]));
        this.routeById = new Map((model.data.route ?? []).map((r) => [r.id, r]));
        // GIVENS (sudoku's printed digits): a clue that is not testimony and states a slot's value outright fills
        // that slot as soon as the clue is held. Testimony (truth-slotted claims) never does: it may be false.
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
        this.rulesOn = new Map();
        for (const r of model.data.rules ?? []) {
            for (const e of r.attaches_to ?? []) {
                if (!this.rulesOn.has(e)) this.rulesOn.set(e, []);
                this.rulesOn.get(e).push(r.id);
            }
        }
        // A clue brings the (often unseen) events it speaks of: that is where the open questions live.
        this.claimEvents = new Map();
        for (const c of model.data.claims ?? []) {
            const k = model.constraints.get(`k.${c.id}`);
            if (!k) continue;
            this.claimEvents.set(c.id, [...slotsIn(k.formula)].map((s) => model.slots.get(s)?.on).filter((o) => model.cards.get(o)?.section === 'events'));
        }
        this.reset();
        if (state) this.load(state);
    }

    reset() {
        this.read = 1;                  // paragraphs [0, read) have been read; paragraph 0 is the title
        this.seq = 0;                   // discovery counter (the investigation axis)
        this.unlocked = new Map();      // card id → {para, at}
        this.items = new Set(this.model.data.case.starting_items ?? []);
        this.done = [];                 // Holmes's actions the text has reached
        this.told = [];                 // reasoning steps the story revealed before the player made them
        this.marks = new Map();         // slot id → {listed: Set|null, struck: Map value → {cited, used}|{}, proven}
        this.theories = [];
        this.#process(0);
    }

    // ---------- persistence ----------
    save() {
        return {
            difficulty: this.difficulty,
            pace: this.pace,
            read: this.read,
            collected: this.difficulty === HARD ? [...this.unlocked].map(([id, u]) => [id, u.para]) : null,
            marks: [...this.marks].map(([slot, m]) => [slot, { listed: m.listed ? [...m.listed] : null, struck: [...m.struck], proven: m.proven }]),
            theories: this.theories,
        };
    }

    load(state) {
        this.difficulty = state.difficulty ?? this.difficulty;
        this.pace = state.pace ?? this.pace;
        this.reset();
        const target = Math.min(state.read ?? 1, this.story.paragraphs.length);
        while (this.read < target) this.#readNext();
        if (this.difficulty === HARD) for (const [id, para] of state.collected ?? []) this.#unlock(id, para);
        for (const [slot, m] of state.marks ?? []) {
            if (!this.model.slots.has(slot)) continue;
            this.marks.set(slot, { listed: m.listed ? new Set(m.listed) : null, struck: new Map(m.struck), proven: m.proven });
        }
        this.theories = state.theories ?? [];
    }

    // ---------- reading ----------
    finished() { return this.read >= this.story.paragraphs.length; }

    /** Reasoning steps the next paragraph waits for, not yet made. */
    blockers() {
        if (this.finished()) return [];
        return this.story.stepsBefore(this.read, this.model.data).filter((s) => !this.stepMade(s));
    }

    /** The action the next paragraph shows Holmes doing, if any (labels the read-on button). */
    nextAction() {
        return this.actions.find((a) => this.story.anchors.actions.get(a.id) === this.read) ?? null;
    }

    advance() {
        if (this.finished()) return { ok: false, end: true };
        const blocking = this.blockers();
        if (blocking.length && this.pace === WAIT) return { ok: false, needs: blocking };
        this.told.push(...blocking);
        const before = new Set(this.unlocked.keys());
        this.#readNext();
        return { ok: true, para: this.read - 1, newCards: [...this.unlocked.keys()].filter((k) => !before.has(k)) };
    }

    #readNext() {
        const p = this.read;
        this.read++;
        this.#process(p);
    }

    #process(p) {
        for (const a of this.actions) {
            if (this.story.anchors.actions.get(a.id) !== p) continue;
            this.done.push(a.id);
            for (const i of a.yields?.items ?? []) this.items.add(i);
        }
        if (this.difficulty !== HARD) for (const s of this.story.spans[p]) for (const id of s.ids) this.#unlock(id, p);
    }

    /** Hard mode: the player clicked text in paragraph `para` covering these ids. Returns the newly collected. */
    collect(para, ids) {
        if (para >= this.read) return [];
        const before = new Set(this.unlocked.keys());
        for (const id of ids) this.#unlock(id, para);
        return [...this.unlocked.keys()].filter((k) => !before.has(k));
    }

    #unlock(id, para) {
        const c = this.model.cards.get(id);
        if (!c || this.unlocked.has(id)) return;
        this.unlocked.set(id, { para, at: this.seq++ });
        if (c.section === 'entities') for (const r of this.rulesOn.get(id) ?? []) this.#unlock(r, para);
        if (c.section === 'claims') for (const e of this.claimEvents.get(id) ?? []) this.#unlock(e, para);
    }

    knows(cardId) { return this.unlocked.has(cardId); }
    known() { return new Set(this.unlocked.keys()); }

    questionRaised(qid) {
        const p = this.story.anchors.questions.get(qid);
        return p !== undefined && p < this.read;
    }

    /** A reasoning step counts as made once the player has proved its conclusion. */
    stepMade(stepId) {
        const step = this.routeById.get(stepId);
        if (!step) return false;
        const c = step.concludes;
        if (c.slot) {
            if (this.isStruckWithProof(c.slot, c.value)) return true;
            const v = this.settled(c.slot);
            return v !== null && v !== c.value;
        }
        const f = c.formula ?? this.model.cards.get(c.claim)?.asserts;
        return this.#entailedBySettled(f);
    }

    // ---------- slots ----------
    visibleSlots() { return [...this.model.slots.values()].filter((s) => this.knows(s.on)); }
    slotsOn(cardId) { return [...this.model.slots.values()].filter((s) => s.on === cardId); }

    #mark(slot) {
        if (!this.marks.has(slot)) this.marks.set(slot, { listed: this.difficulty === HARD ? new Set() : null, struck: new Map(), proven: null });
        return this.marks.get(slot);
    }

    /** The values the player is still considering for a slot. */
    pencil(slot) {
        const g = this.given(slot);
        if (g) return [g.value];
        const m = this.marks.get(slot);
        if (m?.proven) return [m.proven.value];
        const s = this.model.slots.get(slot);
        const base = m?.listed ? [...m.listed] : this.difficulty === HARD ? [] : s.domain;
        // Never list a card the story has not shown the player yet: that would give it away.
        return base.filter((v) => !m?.struck.has(v) && (v === s.on || !this.model.cards.has(v) || this.knows(v)));
    }

    /** Hard mode: propose a candidate. Refused when it is the wrong kind of thing for the slot. */
    addCandidate(slot, value) {
        if (!this.shapeFits(slot, value)) return { ok: false, why: 'shape' };
        if (this.model.cards.has(value) && !this.knows(value) && value !== this.model.slots.get(slot).on) return { ok: false, why: 'unknown' };
        const m = this.#mark(slot);
        if (!m.listed) m.listed = new Set();
        m.listed.add(value);
        return { ok: true };
    }

    removeCandidate(slot, value) {
        this.marks.get(slot)?.listed?.delete(value);
    }

    /** Cross a value out. Outside Trivial, it must come with cited evidence the game accepts. */
    strike(slot, value, cited = null) {
        const m = this.#mark(slot);
        if (!cited || !cited.length) {
            if (this.difficulty !== TRIVIAL) return { ok: false, reason: 'cite the evidence that rules it out' };
            m.struck.set(value, {});
            return { ok: true, proof: false };
        }
        const res = this.checkElimination(slot, value, cited);
        if (res.ok) m.struck.set(value, { cited, used: res.used });
        return { ...res, proof: res.ok };
    }

    unstrike(slot, value) { this.marks.get(slot)?.struck.delete(value); }
    isStruckWithProof(slot, value) { return !!this.marks.get(slot)?.struck.get(value)?.cited; }
    provenValue(slot) { return this.marks.get(slot)?.proven?.value ?? null; }

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

    /** The held clue that hands this slot its value, if any. */
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
    #citable(cited) {
        const bad = cited.filter((c) => !this.knows(c));
        return bad.length ? { ok: false, reason: `not yet found: ${bad.join(', ')}` } : null;
    }

    checkElimination(slot, value, cited) {
        return this.#citable(cited) ?? checkStep(this.model, cited, { slot, value });
    }

    checkConclusion(formula, cited) {
        return this.#citable(cited) ?? checkStep(this.model, cited, { formula });
    }

    shapeFits(slot, value) { return this.model.slots.get(slot).domain.includes(value); }

    /** Could `value` fill `slot`? Trivial checks the held clues; Easy and Hard only the type. */
    plausible(slot, value) {
        if (!this.shapeFits(slot, value)) return { plausible: false, why: 'shape' };
        if (this.difficulty !== TRIVIAL) return { plausible: true, why: 'shape only' };
        const active = this.activeConstraints();
        if (this.model.problem.consistent(active, { [slot]: value }, { focus: true }).ok) return { plausible: true };
        return { plausible: false, why: 'clues', conflict: this.model.problem.explainConflict(active, { [slot]: value }) };
    }

    /** Trivial's automatic list: every value the held clues still allow. */
    openValues(slot) {
        return this.model.problem.candidates(this.activeConstraints(), slot);
    }

    activeConstraints() {
        return activeConstraints(this.model, this.known()).filter((id) => !this.model.constraints.get(id).derived);
    }

    #entailedBySettled(formula) {
        if (!formula) return false;
        const fixed = {};
        for (const s of this.model.slots.keys()) {
            if (!this.marks.has(s) && !this.givers.has(s)) continue;
            const v = this.settled(s);
            if (v !== null) fixed[s] = v;
        }
        return !this.model.problem.consistent([], fixed, { extra: [{ not: formula }] }).ok;
    }

    // ---------- theories ----------
    addTheory(label, assignment = {}) {
        const id = `t.player_${Date.now().toString(36)}`;
        this.theories.push({ id, label, assignment });
        return id;
    }

    checkTheory(theory) {
        const conflict = this.model.problem.explainConflict(this.activeConstraints(), theory.assignment);
        return { fits: !conflict, conflict };
    }

    // ---------- the three time axes ----------
    /** Fabula: events the player holds, with their time if settled. */
    fabula() {
        return (this.model.data.events ?? []).filter((e) => this.knows(e.id)).map((e) => {
            const slot = `${e.id}.time`;
            const has = this.model.slots.has(slot);
            return { event: e, slot: has ? slot : null, settled: has ? this.settled(slot) : null, pencil: has ? this.pencil(slot) : [] };
        });
    }

    /** Investigation: cards in the order the player collected them, with the paragraph they came from. */
    investigation() {
        return [...this.unlocked].sort((a, b) => a[1].at - b[1].at).map(([id, u]) => ({ id, ...u }));
    }

    /** Disclosure: the paragraph where the story first mentions a card. */
    disclosure(cardId) {
        const c = this.model.cards.get(cardId);
        if (c?.section === 'rules') return Math.min(...(c.attaches_to ?? []).map((e) => this.story.firstAt.get(e) ?? Infinity));
        return this.story.firstAt.get(cardId) ?? null;
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
