// Incremental mode, step 4: the automation. It plays a Game at the 'incremental' pace on the page's rules, with only the
// feedback the game gives: it reads until the story waits, collects every span read and asks about every card, then
// searches the families the open waits name until they lift, a check at a time (`step(budget)`), and counts.
//
// The searches (one generator per category; a check is one call that asks the game something):
//   collect, ask  every span read, every card that can be asked about (lookups; run first, they feed the rest)
//   build         sets grown card by card while "onto something" (propose); a complete set tries the kinds (Hard)
//   notice        each held card marked odd, kept only if a wait lifts
//   raise         each exception open against a held card, kept only if a wait lifts
//   check         a sealed check part by part (sealOnto: the verb, each field, the pair, the question of an expected
//                 answer), then the expectation (none first: it never hedges) and the answer's value, kept if a wait lifts
//   absence       the fact, the statement and the time apart (absenceOnto), then their positives filed together
//   drop          the target (dropOnto), then its reasons tried whole, kept if the drop holds
// A move that made something is never taken back (it may be another row's); a move that made nothing is.
//
// The player steers with the marks the game has (never the case data): a card set aside goes last; the cards of a
// circled answer (its question's card, and the answer if it is a card) go first, then cards marked odd. A circled
// answer is tried first as a check's expected answer and last as a drop; a crossed-out one the other way. `running`
// pauses or resumes a category. The order within a tier is a seeded shuffle.
//
// A "no" lasts only until something changes (docs/ideas.md, option (c)): negatives are kept across passes, and those
// a new card could overturn are marked stale and checked again: a build set that is part of a recipe now complete; a
// check's parts of a verb with a plan that takes the new card; every absence part when a card of an absence or a new
// time arrives; a drop's reasons on a new card; a notice, a raise or a sealed check that lifted nothing, when a new
// wait of its family opens. `counts()` reports, per category, the space (terms added, each a product of factors), the
// checks made, what is ruled out now, and the stale count.
import { INCREMENTAL, CHECK_TEMPLATES, CONCLUSION_KINDS, dropKey } from './game.js';
import * as TL from './timeline.js';

export const CATEGORIES = ['collect', 'ask', 'build', 'notice', 'raise', 'check', 'absence', 'drop', 'answers'];
const FAMILY = { deduction: 'build', notice: 'notice', raise: 'raise', check: 'check', absence: 'absence', drop: 'drop' };
const SEARCHED = ['collect', 'ask', 'build', 'notice', 'raise', 'check', 'absence', 'drop'];
const POOL = ['entities', 'events', 'claims', 'rules', 'inferences', 'propositions'];
const MAX_SET = 8;

function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const choose = (n, k) => { if (k < 0 || k > n) return 0; let c = 1; for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1); return Math.round(c); };

export class Automation {
    /**
     * `game`: a Game at the 'incremental' pace. `seed`: the order within a priority tier. `running`: the categories
     * searched (all by default). `autoRead`: read on whenever the story does not wait (default true).
     */
    constructor(game, { seed = 1, running = SEARCHED, autoRead = true } = {}) {
        if (game.pace !== INCREMENTAL) throw new Error('the automation plays incremental mode');
        this.g = game;
        this.model = game.model;
        this.r = rng(seed);
        this.running = new Set(running);
        this.autoRead = autoRead;
        this.stats = Object.fromEntries(CATEGORIES.map((c) => [c, { checked: 0, found: 0, solver: 0 }]));
        // Negatives per category: key → the set (builds) or true; stale: keys to check again.
        this.neg = Object.fromEntries(CATEGORIES.map((c) => [c, new Map()]));
        this.stale = Object.fromEntries(CATEGORIES.map((c) => [c, new Set()]));
        this.gens = new Map();          // category → {it, version, waits}
        this.spent = new Map();         // category → {version, waits}: a pass that found nothing
        this.version = 0;               // bumped when the hand changes
        this.hand = new Set(this.#held());
        this.complete = this.#completeRecipes();
        this.reached = new Set(TL.times(game).map((t) => t.id));
        this.lastRead = game.read;
        this.dirty = true;              // the waits may have changed
        this.open = [];
        this.waitsKey = '';
        this.families = new Set();
        this.turn = 0;
    }

    // ---------- the steering ----------
    setRunning(category, on) { if (on) this.running.add(category); else this.running.delete(category); }
    /** Start every search afresh (after the player changes a mark: the order is the marks'). Negatives are kept. */
    restart() { this.gens.clear(); this.spent.clear(); }

    #circledCards() {
        const out = new Set();
        for (const [slot, m] of this.g.marks) {
            if (!m.circled?.size) continue;
            const s = this.model.slots.get(slot);
            if (s?.on) out.add(s.on);
            for (const v of m.circled) if (this.model.cards.has(v)) out.add(v);
        }
        return out;
    }
    /** Cards in the player's order: circled, odd, the rest, set aside; shuffled within a tier. */
    order(cards) {
        const circled = this.#circledCards();
        const tier = (c) => (this.g.isSetAside(c) ? 3 : circled.has(c) ? 0 : this.g.noticed.has(c) ? 1 : 2);
        return this.#shuffle(cards).map((c, i) => [tier(c), i, c]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((x) => x[2]);
    }
    /** A question's answers as a check expects them: circled first, crossed out last. */
    orderValues(slot, values) {
        const m = this.g.marks.get(slot);
        const tier = (v) => (m?.circled?.has(v) ? 0 : m?.struck?.has(v) ? 2 : 1);
        return this.#shuffle(values).map((v, i) => [tier(v), i, v]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((x) => x[2]);
    }
    /** Hypotheses to drop: crossed-out answers first, circled ones last. */
    orderTargets(targets) {
        const tier = (t) => { if (t.theory) return 1; const m = this.g.marks.get(t.slot); return m?.struck?.has(t.value) ? 0 : m?.circled?.has(t.value) ? 2 : 1; };
        return this.#shuffle(targets).map((t, i) => [tier(t), i, t]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((x) => x[2]);
    }
    #shuffle(xs) { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

    // ---------- what the player holds ----------
    #held() { return [...this.g.unlocked.keys()].filter((x) => !this.g.hidden.has(x)); }
    #sec(id) { return this.model.cards.get(id)?.section; }
    #sealCards() { return this.#held().filter((x) => ['entities', 'claims'].includes(this.#sec(x))); }
    #fieldList(f) { const cs = this.#sealCards(); return f === 'person' || f === 'to' ? cs.filter((x) => this.model.cards.get(x).kind === 'person') : cs; }
    #times() { return TL.times(this.g).filter((t) => t.kind !== 'boundary'); }
    #answers() { return this.g.visibleSlots().flatMap((s) => s.domain.filter((v) => this.g.offered(s.id, v)).map((v) => ({ slot: s.id, value: v }))); }
    #dropTargets() { return [...this.g.visibleTheories().map((t) => ({ theory: t.id })), ...this.#answers()]; }
    #dropReasons() {
        const th = this.g.visibleTheories();
        return [...th.flatMap((x) => [['out-explained', x.id, null], ['more-hands', x.id, null]]), ['cost', null, null], ...this.#held().map((c) => ['card', null, c])];
    }
    #completeRecipes() {
        return new Set(this.g.inferences.filter((k) => !k.implicit && !this.g.knows(k.id) && k.premises.every((x) => this.g.knows(x))).map((k) => k.id));
    }
    #openRows() { return this.g.blockers().filter((w) => w.row).length; }

    // ---------- a check ----------
    /** One check of a part (a lookup): a negative not stale answers without a check. */
    *#part(cat, key, ask) {
        if (this.neg[cat].has(key) && !this.stale[cat].has(key)) return false;
        const yes = ask();
        this.stale[cat].delete(key);
        if (yes) this.neg[cat].delete(key); else this.neg[cat].set(key, true);
        this.stats[cat].checked++;
        yield;
        return yes;
    }
    /** One move tried whole: kept (true) if `made()` says it made something, else taken back and kept as a negative. */
    *#try(cat, key, move, made, undo) {
        if (this.neg[cat].has(key) && !this.stale[cat].has(key)) return false;
        const res = move();
        const ok = res?.ok !== false && made(res);
        this.stale[cat].delete(key);
        this.stats[cat].checked++;
        if (ok) { this.stats[cat].found++; this.neg[cat].delete(key); this.dirty = true; } else { if (res?.ok !== false) undo(res); this.neg[cat].set(key, true); }
        yield;
        return ok;
    }

    // ---------- the searches (each a pass; returns 'changed' when it should start again) ----------
    *collect() {
        for (let q = 1; q < this.g.read; q++) for (const s of this.g.story.spans[q] ?? []) {
            const ids = s.ids.filter((x) => this.model.cards.has(x));
            if (!ids.some((x) => !this.g.knows(x) && !this.g.hidden.has(x))) continue;
            const got = this.g.collect(q, ids);
            this.stats.collect.checked++;
            if (got.length) this.stats.collect.found++;
            yield;
        }
    }
    *ask() {
        for (let grew = true; grew;) {
            grew = false;
            for (const id of this.#held()) {
                if (!this.g.canAsk(id) || this.g.hasAsked(id)) continue;
                this.g.ask(id);
                this.stats.ask.checked++;
                this.stats.ask.found++;
                grew = true;
                yield;
            }
        }
    }
    *build() {
        const pool = this.order(this.#held().filter((x) => POOL.includes(this.#sec(x))));
        const tried = new Set();
        const self = this;
        function* grow(S) {
            for (const x of pool) {
                if (S.includes(x)) continue;
                const T = [...S, x];
                const k = [...T].sort().join('|');
                if (tried.has(k)) continue;
                tried.add(k);
                if (self.neg.build.has(k) && !self.stale.build.has(k)) continue;
                const res = self.g.propose(T);
                self.stats.build.checked++;
                self.stale.build.delete(k);
                yield;
                if (res.needsKind || res.wrongKind) {
                    for (const kind of self.#shuffle(Object.keys(CONCLUSION_KINDS))) {
                        const b = self.g.propose(T, kind);
                        self.stats.build.checked++;
                        // A built inference is a card: the hand changes and the search starts again with it in the pool.
                        if (b.built.length) { self.stats.build.found += b.built.length; self.dirty = true; yield; return 'changed'; }
                        yield;
                    }
                }
                if (res.onto && T.length < MAX_SET) { if ((yield* grow(T)) === 'changed') return 'changed'; } else if (!res.onto && !res.needsKind && !res.wrongKind) self.neg.build.set(k, T);
            }
            return null;
        }
        return yield* grow([]);
    }
    *notice() {
        for (const x of this.order(this.#held().filter((c) => !this.g.noticed.has(c)))) {
            if (yield* this.#try('notice', x, () => this.g.notice(x), (res) => res.lifts > 0, () => this.g.unnotice(x))) return 'changed';
        }
        return null;
    }
    *raise() {
        const all = this.#held().flatMap((id) => this.g.exceptionsOf(id).map((x) => [id, x.n, x.id])).filter(([id, n, x]) => !this.g.raised.has(`${id}#${n}:${x}`));
        for (const [id, n, x] of this.#shuffle(all)) {
            let before = 0;
            const move = () => { before = this.#openRows(); return this.g.raise(id, n, x); };
            if (yield* this.#try('raise', `${id}#${n}:${x}`, move, () => this.#openRows() < before, () => this.g.withdraw(id, n, x))) return 'changed';
        }
        return null;
    }
    *check() {
        const slots = this.g.visibleSlots();
        for (const verb of this.#shuffle(Object.keys(CHECK_TEMPLATES))) {
            if (!(yield* this.#part('check', `v|${verb}`, () => this.g.sealOnto(verb, {})))) continue;
            const tpl = CHECK_TEMPLATES[verb];
            const [f1, f2] = tpl.fields;
            const p1 = [];
            for (const c of this.order(this.#fieldList(f1))) if (yield* this.#part('check', `f|${verb}|${f1}|${c}`, () => this.g.sealOnto(verb, { [f1]: c }))) p1.push(c);
            const p2 = [];
            for (const c of this.order(this.#fieldList(f2))) if (yield* this.#part('check', `f|${verb}|${f2}|${c}`, () => this.g.sealOnto(verb, { [f2]: c }))) p2.push(c);
            for (const c1 of p1) for (const c2 of p2) {
                const fields = { [f1]: c1, [f2]: c2 };
                const pair = `${verb}|${c1}|${c2}`;
                if (!(yield* this.#part('check', `p|${pair}`, () => this.g.sealOnto(verb, fields)))) continue;
                const seal = (opts, key) => this.#try('check', `s|${pair}|${key}`, () => this.g.seal(verb, fields, opts), (res) => res.lifts > 0, (res) => this.g.unseal(res.id));
                // No expectation first: it never hedges another seal of the same check.
                for (const expect of [null, ...this.#shuffle(tpl.outcomes)]) if (yield* seal({ expect }, `${expect}`)) return 'changed';
                // The question an expected answer is about is a part; its value is tried whole.
                const qs = [];
                for (const sl of this.#shuffle(slots)) if (yield* this.#part('check', `q|${pair}|${sl.id}`, () => this.g.sealOnto(verb, fields, { slot: sl.id }))) qs.push(sl);
                for (const expect of tpl.outcomes) for (const sl of qs) for (const v of this.orderValues(sl.id, sl.domain.filter((x) => this.g.offered(sl.id, x)))) {
                    if (yield* seal({ expect, answer: { eq: [sl.id, v] } }, `${expect}|${sl.id}=${v}`)) return 'changed';
                }
            }
        }
        return null;
    }
    *absence() {
        const held = this.#held();
        const parts = function* (self, list, key, prefix) {
            const out = [];
            for (const x of self.order(list)) if (yield* self.#part('absence', `${prefix}|${x}`, () => self.g.absenceOnto({ [key]: x }))) out.push(x);
            return out;
        };
        const fs = yield* parts(this, held.filter((x) => this.#sec(x) === 'rules'), 'expectation', 'e');
        const ws = yield* parts(this, held.filter((x) => this.#sec(x) === 'claims'), 'witness', 'w');
        const ts = [];
        for (const t of this.#shuffle(this.#times().map((x) => x.id))) if (yield* this.#part('absence', `t|${t}`, () => this.g.absenceOnto({ time: t }))) ts.push(t);
        for (const f of fs) for (const w of ws) for (const t of ts) {
            if (yield* this.#try('absence', `a|${f}|${t}|${w}`, () => this.g.fileAbsence(f, t, w), (res) => res.ok && !res.existing, () => {})) return 'changed';
        }
        return null;
    }
    *drop() {
        for (const tg of this.orderTargets(this.#dropTargets())) {
            const tk = dropKey(tg);
            if (!(yield* this.#part('drop', `d|${tk}`, () => this.g.dropOnto(tg)))) continue;
            for (const [reason, rival, cite] of this.#shuffle(this.#dropReasons())) {
                const move = () => { this.stats.drop.solver++; return this.g.drop(tg, reason, { rival, cites: cite ? [cite] : [] }); };
                if (yield* this.#try('drop', `r|${tk}|${reason}|${rival}|${cite}`, move, () => (this.g.dropOf(tg)?.held ?? null) !== null, () => this.g.undrop(tg))) return 'changed';
            }
        }
        return null;
    }

    // ---------- keeping track ----------
    /** After any check: the hand, the times on the board and the waits; mark what they make stale. */
    #update() {
        const now = this.#held();
        const fresh = now.filter((x) => !this.hand.has(x));
        const times = TL.times(this.g).map((t) => t.id);
        const newTimes = times.filter((t) => !this.reached.has(t));
        const from = this.lastRead;
        this.lastRead = this.g.read;
        if (fresh.length || newTimes.length || from !== this.g.read) {
            for (const x of fresh) this.hand.add(x);
            for (const t of newTimes) this.reached.add(t);
            const marked = this.#staleOn(fresh, new Set(newTimes), from);
            if (fresh.length || newTimes.length || marked) { this.version++; this.dirty = true; }
        }
        if (this.dirty) {
            this.dirty = false;
            this.open = this.g.blockers();
            const key = JSON.stringify(this.open);
            if (key !== this.waitsKey) {
                this.families = new Set(this.open.map((w) => (w.keep ? 'build' : FAMILY[w.row.split('|')[1]])));
                // A notice, a raise or a seal that lifted nothing may lift a wait that has just opened.
                const opened = new Set(this.open.filter((w) => !JSON.parse(this.waitsKey || '[]').some((v) => JSON.stringify(v) === JSON.stringify(w))).map((w) => (w.keep ? 'build' : FAMILY[w.row.split('|')[1]])));
                for (const cat of ['notice', 'raise']) if (opened.has(cat)) for (const k of this.neg[cat].keys()) this.stale[cat].add(k);
                if (opened.has('check')) for (const k of this.neg.check.keys()) if (k.startsWith('s|')) this.stale.check.add(k);
                this.waitsKey = key;
            }
        }
    }
    /**
     * What a change can overturn (option (c)): the new cards `fresh`, the new times on the board `newTimes`, the
     * paragraphs read since `from`. Marks those negatives stale; → how many.
     */
    #staleOn(fresh, newTimes, from) {
        let n = 0;
        const mark = (cat, k) => { if (!this.stale[cat].has(k)) { this.stale[cat].add(k); n++; } };
        // Builds: a set that is part of a recipe now complete.
        const now = this.#completeRecipes();
        for (const id of now) {
            if (this.complete.has(id)) continue;
            const ps = new Set(this.g.inferenceById.get(id).premises);
            for (const [k, T] of this.neg.build) if (T.every((x) => ps.has(x))) mark('build', k);
        }
        this.complete = now;
        // Sealed checks: a verb or a field's card, when a plan of that verb that takes it names the new card in another
        // field. (A pair names both fields: no card overturns it.)
        if (fresh.length) {
            const plans = (this.model.data.checks ?? []).flatMap((ck) => ck.plans);
            for (const k of this.neg.check.keys()) {
                const [kind, verb, f, c] = k.split('|');
                if (kind !== 'v' && kind !== 'f') continue;
                if (plans.some((p) => p.verb === verb && (kind === 'v' || !p[f] || p[f].includes(c))
                    && CHECK_TEMPLATES[verb].fields.some((g) => (kind === 'v' || g !== f) && p[g] && fresh.some((x) => p[g].includes(x))))) mark('check', k);
            }
        }
        // Absences: the parts of an absence one of whose cards or times has just arrived, or that the story has just
        // passed; and the combination itself, once passed.
        const root = (t) => String(t).split('.').slice(0, 2).join('.');
        for (const a of this.g.absenceById().values()) {
            const passed = a.para >= from && a.para < this.g.read;
            if (!(passed || fresh.includes(a.expectation) || fresh.includes(a.witness) || [...newTimes].some((t) => a.windows.includes(root(t))))) continue;
            for (const k of this.neg.absence.keys()) {
                const [kind, x, t, w] = k.split('|');
                if ((kind === 'e' && x === a.expectation) || (kind === 'w' && x === a.witness) || (kind === 't' && a.windows.includes(root(x)))
                    || (kind === 'a' && passed && x === a.expectation && w === a.witness && a.windows.includes(root(t)))) mark('absence', k);
            }
        }
        // Drops: every reason tried (whether a reason holds rests on everything the player holds).
        if (fresh.length) for (const k of this.neg.drop.keys()) if (k.startsWith('r|')) mark('drop', k);
        return n;
    }

    /** The category to search next: collect, then ask, then the open waits' families in turn. */
    #next() {
        const wkey = this.waitsKey;
        const live = (cat) => {
            if (!this.running.has(cat)) return false;
            const s = this.spent.get(cat);
            return !(s && s.version === this.version && s.waits === wkey);
        };
        for (const cat of ['collect', 'ask']) if (live(cat)) return cat;
        const cats = SEARCHED.slice(2).filter((c) => this.families.has(c) && live(c));
        if (!cats.length) return null;
        this.turn = (this.turn + 1) % cats.length;
        return cats[this.turn];
    }

    /**
     * Up to `budget` checks: read on while the story does not wait (autoRead), search while it does. → {checks, read,
     * idle: nothing left to search with what is held and running (the reason, if the story waits), end}.
     */
    step(budget = 1000) {
        const out = { checks: 0, read: 0, idle: null, end: false };
        while (out.checks < budget) {
            if (this.g.finished()) { out.end = true; break; }
            this.#update();
            if (!this.open.length) {
                if (!this.autoRead) { out.idle = 'the story does not wait'; break; }
                const a = this.g.advance();
                if (a.ok) { out.read++; this.dirty = true; continue; }
                this.dirty = true;
                continue;
            }
            const cat = this.#next();
            if (!cat) { out.idle = this.open.map((w) => w.row ?? `keep ${w.keep.inferences.join(',')}`).join('; '); break; }
            let gen = this.gens.get(cat);
            if (!gen || gen.version !== this.version) {
                gen = { it: this[cat](), version: this.version, found: false };
                this.gens.set(cat, gen);
            }
            const before = this.stats[cat].checked;
            const { done, value } = gen.it.next();
            out.checks += this.stats[cat].checked - before;
            if (done) {
                this.gens.delete(cat);
                // A pass that changed nothing is spent until the hand or the waits change.
                if (value !== 'changed') this.spent.set(cat, { version: this.version, waits: this.waitsKey });
            }
        }
        return out;
    }

    // ---------- the counts ----------
    /**
     * Per category: {terms: [{label, factors: [{label, n}]}], total (Σ of the terms' products), checked, found, ruledOut
     * (of the space as it stands, known not to make anything now), stale (negatives to check again), searched}.
     */
    counts() {
        const g = this.g;
        const held = this.#held();
        const out = {};
        const put = (cat, terms, ruledOut) => {
            const total = terms.reduce((a, t) => a + t.factors.reduce((p, f) => p * f.n, 1), 0);
            out[cat] = { terms, total, ...this.stats[cat], ruledOut: Math.min(total, Math.max(0, ruledOut)), stale: this.stale[cat].size, searched: SEARCHED.includes(cat) };
        };
        // Collect: the spans read; ruled out, those with nothing left to give.
        let spans = 0, empty = 0;
        for (let q = 1; q < g.read; q++) for (const s of g.story.spans[q] ?? []) {
            const ids = s.ids.filter((x) => this.model.cards.has(x));
            if (!ids.length) continue;
            spans++;
            if (!ids.some((x) => !g.knows(x) && !g.hidden.has(x))) empty++;
        }
        put('collect', [{ label: 'spans read', factors: [{ label: 'spans', n: spans }] }], empty);
        const askable = held.filter((x) => g.canAsk(x));
        put('ask', ['entities', 'events'].map((s) => ({ label: s, factors: [{ label: 'cards', n: askable.filter((x) => this.#sec(x) === s).length }] })), askable.filter((x) => g.hasAsked(x)).length);
        // Builds: sets of 1 to 8 of the cards held (× the kinds on Hard); a card alone not onto anything rules out every
        // set it is in (a lower bound of what is ruled out).
        const pool = held.filter((x) => POOL.includes(this.#sec(x)));
        const out1 = pool.filter((x) => this.neg.build.has(x) && !this.stale.build.has(x)).length;
        const kinds = Object.keys(CONCLUSION_KINDS).length;
        const sizes = Array.from({ length: MAX_SET }, (_, i) => i + 1);
        const buildTerms = sizes.map((k) => ({ label: `sets of ${k}`, factors: [{ label: `C(${pool.length}, ${k})`, n: choose(pool.length, k) }, { label: 'kinds', n: kinds }] }));
        put('build', buildTerms, sizes.reduce((a, k) => a + (choose(pool.length, k) - choose(pool.length - out1, k)) * kinds, 0));
        const live = (cat, k) => this.neg[cat].has(k) && !this.stale[cat].has(k);
        put('notice', [{ label: 'cards held', factors: [{ label: 'cards', n: held.length }] }], held.filter((x) => g.noticed.has(x) || live('notice', x)).length);
        const exc = held.flatMap((id) => g.exceptionsOf(id).map((x) => `${id}#${x.n}:${x.id}`));
        put('raise', [{ label: 'exceptions open', factors: [{ label: 'exceptions', n: exc.length }] }], exc.filter((k) => g.raised.has(k) || live('raise', k)).length);
        // Sealed checks: Σ over the verbs of field × field × (results + none).
        let sealOut = 0;
        const sealTerms = Object.entries(CHECK_TEMPLATES).map(([verb, t]) => {
            const [f1, f2] = t.fields;
            const a = this.#fieldList(f1), b = this.#fieldList(f2);
            const e = t.outcomes.length + 1;
            if (live('check', `v|${verb}`)) sealOut += a.length * b.length * e;
            else {
                const ra = a.filter((c) => live('check', `f|${verb}|${f1}|${c}`)).length;
                const rb = b.filter((c) => live('check', `f|${verb}|${f2}|${c}`)).length;
                sealOut += (a.length * b.length - (a.length - ra) * (b.length - rb)) * e;
                for (const k of this.neg.check.keys()) if (live('check', k) && k.startsWith(`p|${verb}|`)) sealOut += e;
                for (const k of this.neg.check.keys()) if (live('check', k) && k.startsWith(`s|${verb}|`) && k.split('|').length === 5) sealOut++;
            }
            return { label: verb, factors: [{ label: f1, n: a.length }, { label: f2, n: b.length }, { label: 'expected results', n: e }] };
        });
        put('check', sealTerms, sealOut);
        // Absences: facts × times × statements.
        const facts = held.filter((x) => this.#sec(x) === 'rules'), stmts = held.filter((x) => this.#sec(x) === 'claims'), times = this.#times().map((t) => t.id);
        const rf = facts.filter((x) => live('absence', `e|${x}`)).length, rs = stmts.filter((x) => live('absence', `w|${x}`)).length, rt = times.filter((x) => live('absence', `t|${x}`)).length;
        const triples = [...this.neg.absence.keys()].filter((k) => k.startsWith('a|') && live('absence', k)).length;
        put('absence', [{ label: 'absences', factors: [{ label: 'facts', n: facts.length }, { label: 'times', n: times.length }, { label: 'statements', n: stmts.length }] }],
            facts.length * times.length * stmts.length - (facts.length - rf) * (times.length - rt) * (stmts.length - rs) + triples);
        // Drops: targets × reasons.
        const targets = this.#dropTargets(), reasons = this.#dropReasons().length;
        const rtg = targets.filter((t) => live('drop', `d|${dropKey(t)}`)).length;
        const tries = [...this.neg.drop.keys()].filter((k) => k.startsWith('r|') && live('drop', k)).length;
        put('drop', [{ label: 'drops', factors: [{ label: 'targets', n: targets.length }, { label: 'reasons', n: reasons }] }], rtg * reasons + tries);
        // Answers: the other route to a deduction (not searched: the builds route).
        put('answers', [{ label: 'answers shown', factors: [{ label: 'answers', n: this.#answers().length }] }], 0);
        return out;
    }
}
