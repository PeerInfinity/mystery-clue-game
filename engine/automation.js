// Incremental mode, step 4: the automation. It plays a Game at the 'incremental' pace on the page's rules, with only the
// feedback the game gives: it reads until the story waits (when it reads by itself), collects every span read and
// asks about every card, then searches the families the open waits name, a check at a time, and counts.
//
// A check is planned before it is made: `next()` is the check about to be made (shown to the player, with `queue()`,
// the next check of every category in the order they take turns), `execute()` makes it. The page makes one a second
// (its setting); `step(budget)` makes many at once (node). A check may be stopped by the solver (NeedSolve, in the
// page) and made again: `execute` is safe to call again until it returns.
//
// The searches (one generator per category, yielding the checks it plans):
//   collect, ask  every span read, every card that can be asked about (lookups; run first, they feed the rest)
//   build         level by level by "onto something" (propose): each card alone, then a set onto something and one
//                 more card onto something alone; a complete set tries the kinds (Hard)
//   notice        each held card marked important (odd, in the data), kept only if a wait lifts
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
// check's verb or field card when a plan that takes it names the new card in another field; an absence's parts when
// one of its cards or times arrives or the story passes it; a drop's reasons on a new card; a notice, a raise or a
// sealed check that lifted nothing, when a new wait of its family opens. `counts()` reports, per category, the space
// (terms added, each a product of factors), the checks made, what they found, what is ruled out now, and the stale
// count; `log` the checks made, newest last.
import { INCREMENTAL, CHECK_TEMPLATES, CONCLUSION_KINDS, dropKey } from './game.js';
import * as TL from './timeline.js';

export const CATEGORIES = ['collect', 'ask', 'build', 'notice', 'raise', 'check', 'absence', 'drop', 'answers'];
export const SEARCHED = ['collect', 'ask', 'build', 'notice', 'raise', 'check', 'absence', 'drop'];
/** The category that searches for a wait: a row's family, or a keep (an inference to build). */
export const FAMILY = { deduction: 'build', notice: 'notice', raise: 'raise', check: 'check', absence: 'absence', drop: 'drop' };
export const waitCategory = (w) => (w.keep ? 'build' : FAMILY[w.row.split('|')[1]]);
const POOL = ['entities', 'events', 'claims', 'rules', 'inferences', 'propositions'];
const MAX_SET = 8;
// The log keeps every find and the last RECENT of the other checks (a game makes some 77 finds in about 18,500 checks);
// the checks between two entries kept are told by their numbers (`n`).
const RECENT = 100;

function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const choose = (n, k) => { if (k < 0 || k > n) return 0; let c = 1; for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1); return Math.round(c); };

export class Automation {
    /**
     * `game`: a Game at the 'incremental' pace. `seed`: the order within a priority tier. `running`: the categories
     * searched (all by default). `autoRead`: read on whenever the story does not wait (default true). `names`: how the
     * log names things ({card(id), slot(id), value(slot, v), time(id)}; ids by default). `state`: a saved `save()`.
     */
    constructor(game, { seed = 1, running = SEARCHED, autoRead = true, names = {}, state = null } = {}) {
        if (game.pace !== INCREMENTAL) throw new Error('the automation plays incremental mode');
        this.g = game;
        this.model = game.model;
        this.seed = seed;
        this.r = rng(seed);
        this.running = new Set(running);
        this.autoRead = autoRead;
        this.names = { card: (id) => id, slot: (id) => id, value: (s, v) => v, time: (id) => id, ...names };
        this.stats = Object.fromEntries(CATEGORIES.map((c) => [c, { checked: 0, found: 0, solver: 0 }]));
        // Negatives per category: key → the set (builds) or true; stale: keys to check again.
        this.neg = Object.fromEntries(CATEGORIES.map((c) => [c, new Map()]));
        // The build sets last found "onto something" (keys as in neg.build): part of a larger set that builds. Only for
        // the Cards list's count (perCard); the search itself tries them again on each pass.
        this.onto = new Set();
        this.stale = Object.fromEntries(CATEGORIES.map((c) => [c, new Set()]));
        this.log = [];                  // {n, para, cat, label, out: 'yes' | 'no' | 'found', what?}: every find, the last RECENT others
        this.n = 0;                     // checks made
        this.gens = new Map();          // category → {it, version, pending: check | null}
        this.plans = new Map();         // category → the frames of its search's plan (queue(); #frame)
        this.spent = new Map();         // category → {version, waits}: a pass that found nothing
        this.version = 0;               // bumped when the hand changes or a negative goes stale
        this.current = null;            // the check about to be made
        this.turn = 0;
        if (state) this.#restore(state);
        this.hand = new Set(this.#held());
        this.complete = this.#completeRecipes();
        this.reached = new Set(TL.times(game).map((t) => t.id));
        this.lastRead = game.read;
        this.dirty = true;              // the waits may have changed
        this.open = [];
        this.waitsKey = '';
        this.families = new Set();
    }

    // ---------- keeping it ----------
    /** What a reload needs: the counts, the negatives (keys), the stale ones, the log, the steering. */
    // A build set is kept as the cards' places in the case (a full game's sets: 2.8 MB as ids, a fifth as places).
    #ids() { return (this.idList ??= [...this.model.cards.keys()]); }
    #places() { return (this.placeOf ??= new Map(this.#ids().map((id, i) => [id, i.toString(36)]))); }
    #pack(c, k) { return c === 'build' ? k.split('|').map((id) => this.#places().get(id)).join('.') : k; }
    #unpack(c, k) { return c === 'build' ? k.split('.').map((i) => this.#ids()[parseInt(i, 36)]).join('|') : k; }
    save() {
        return {
            seed: this.seed, n: this.n, cards: this.model.cards.size, running: [...this.running], autoRead: this.autoRead, stats: this.stats, log: this.log,
            neg: Object.fromEntries(CATEGORIES.map((c) => [c, [...this.neg[c].keys()].map((k) => this.#pack(c, k))])),
            onto: [...this.onto].map((k) => this.#pack('build', k)),
            stale: Object.fromEntries(CATEGORIES.map((c) => [c, [...this.stale[c]].map((k) => this.#pack(c, k))])),
        };
    }
    #restore(s) {
        this.n = s.n ?? 0;
        if (s.running) this.running = new Set(s.running);
        if (s.autoRead !== undefined) this.autoRead = s.autoRead;
        // Saved against another version of the case: the negatives may not name the same cards; checked again.
        const same = s.cards === this.model.cards.size;
        for (const c of CATEGORIES) {
            if (s.stats?.[c]) Object.assign(this.stats[c], s.stats[c]);
            if (!same) continue;
            for (const p of s.neg?.[c] ?? []) { const k = this.#unpack(c, p); this.neg[c].set(k, c === 'build' ? k.split('|') : true); }
            for (const p of s.stale?.[c] ?? []) this.stale[c].add(this.#unpack(c, p));
        }
        if (same) for (const p of s.onto ?? []) this.onto.add(this.#unpack('build', p));
        this.log = s.log ?? [];
        this.#trimLog();
        // The order goes on from where it was, not from the start.
        for (let i = 0; i < this.n % 1000; i++) this.r();
    }

    /** The log: every find kept; of the rest, only the last RECENT (the oldest dropped first). */
    #trimLog() {
        let others = this.log.reduce((m, e) => m + (e.out === 'found' ? 0 : 1), 0);
        if (others <= RECENT) return;
        this.log = this.log.filter((e) => e.out === 'found' || others-- <= RECENT);
    }

    // ---------- the steering ----------
    setRunning(category, on) { if (on) this.running.add(category); else this.running.delete(category); this.current = null; }
    /** Start every search afresh (after the player changes a mark: the order is the marks'). Negatives are kept. */
    restart() { this.gens.clear(); this.spent.clear(); this.current = null; }

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
    #byTier(xs, tier) { return this.#shuffle(xs).map((x, i) => [tier(x), i, x]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((x) => x[2]); }
    /** Cards in the player's order: circled, odd, the rest, set aside; shuffled within a tier. */
    order(cards) {
        const circled = this.#circledCards();
        return this.#byTier(cards, (c) => (this.g.isSetAside(c) ? 3 : circled.has(c) ? 0 : this.g.noticed.has(c) ? 1 : 2));
    }
    /** A question's answers as a check expects them: circled first, crossed out last. */
    orderValues(slot, values) {
        const m = this.g.marks.get(slot);
        return this.#byTier(values, (v) => (m?.circled?.has(v) ? 0 : m?.struck?.has(v) ? 2 : 1));
    }
    /** Hypotheses to drop: crossed-out answers first, circled ones last. */
    orderTargets(targets) {
        return this.#byTier(targets, (t) => { if (t.theory) return 1; const m = this.g.marks.get(t.slot); return m?.struck?.has(t.value) ? 0 : m?.circled?.has(t.value) ? 2 : 1; });
    }
    #shuffle(xs) { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

    // ---------- what the player holds ----------
    #held() { return [...this.g.unlocked.keys()].filter((x) => !this.g.hidden.has(x)); }
    #sec(id) { return this.model.cards.get(id)?.section; }
    #sealCards() { return this.#held().filter((x) => ['entities', 'claims'].includes(this.#sec(x))); }
    #fieldList(f) { const cs = this.#sealCards(); return f === 'person' || f === 'to' ? cs.filter((x) => this.model.cards.get(x).kind === 'person') : cs; }
    #times() { return TL.times(this.g).filter((t) => t.kind !== 'boundary'); }
    #answers() { return this.g.visibleSlots().flatMap((s) => s.domain.filter((v) => this.g.offered(s.id, v)).map((v) => ({ slot: s.id, value: v }))); }
    #dropTargets() { return [...this.g.visibleTheories().map((t) => ({ theory: t.id, label: t.label })), ...this.#answers()]; }
    #dropReasons() {
        const th = this.g.visibleTheories();
        return [...th.flatMap((x) => [['out-explained', x.id, null, x.label], ['more-hands', x.id, null, x.label]]), ['cost', null, null, null], ...this.#held().map((c) => ['card', null, c, null])];
    }
    #completeRecipes() {
        return new Set(this.g.inferences.filter((k) => !k.implicit && !this.g.knows(k.id) && k.premises.every((x) => this.g.knows(x))).map((k) => k.id));
    }
    #openRows() { return this.g.blockers().filter((w) => w.row).length; }

    // ---------- naming, for the log ----------
    #card(id) { return this.names.card(id); }
    #target(t) { return t.theory ? `the theory “${t.label ?? t.theory}”` : `${this.names.slot(t.slot)} — ${this.names.value(t.slot, t.value)}`; }

    // ---------- the plan (queue()) ----------
    /** A search's loop publishes its list and where it is: {list, i, key(x) (a negative in force skips it), label(x)}
     *  or {items()}; gap(): a stage not made yet comes after it; then(): that stage; after(): what follows the pass;
     *  stage(): the name of where it is. */
    #frame(cat, f) { (this.plans.get(cat) ?? this.plans.set(cat, []).get(cat)).push(f); return f; }
    #unframe(cat, f) { const st = this.plans.get(cat); const i = st ? st.lastIndexOf(f) : -1; if (i >= 0) st.splice(i, 1); }
    #ruled(cat, k) { return this.neg[cat].has(k) && !this.stale[cat].has(k); }
    #frameItems(cat, f) {
        if (f.items) return f.items();
        return f.list.slice(f.i + 1).filter((x) => !(f.key && this.#ruled(cat, f.key(x)))).map((x) => ({ cat, label: f.label(x) }));
    }
    /** A category's checks after the one it has planned, from the innermost loop out to the first stage not made yet:
     *  {items, open (more after them, not known yet), then, stage}. */
    #planOf(cat) {
        const st = this.plans.get(cat) ?? [];
        const items = [];
        for (let j = st.length - 1; j >= 0; j--) {
            const f = st[j];
            items.push(...this.#frameItems(cat, f));
            if (f.gap?.()) return { items, open: true, then: f.then?.() ?? null, stage: st.at(-1)?.stage?.() ?? null };
        }
        return { items, open: false, then: st[0]?.after?.() ?? null, stage: st.at(-1)?.stage?.() ?? null };
    }
    /** The build checks and finds of one set size (counts()). */
    #bySize(k) { const by = (this.stats.build.sizes ??= {}); return (by[k] ??= { checked: 0, found: 0 }); }

    // ---------- a check ----------
    /** A part (a lookup): a negative not stale answers without a check. */
    *#part(cat, key, label, ask) {
        if (this.neg[cat].has(key) && !this.stale[cat].has(key)) return false;
        const yes = yield { cat, label, run: ask };
        this.stale[cat].delete(key);
        if (yes) this.neg[cat].delete(key); else this.neg[cat].set(key, true);
        return yes;
    }
    /**
     * A move tried whole: kept (true) if `made(res, memo)` says it made something, else taken back and kept as a
     * negative. The move is made once even if the check is made again (`memo`).
     */
    *#try(cat, key, label, move, made, undo) {
        if (this.neg[cat].has(key) && !this.stale[cat].has(key)) return false;
        const memo = {};
        const ok = yield {
            cat, label, kept: true,
            run: () => {
                if (!('res' in memo)) memo.res = move(memo);
                const res = memo.res;
                const yes = res?.ok !== false && made(res, memo);
                if (!yes && res?.ok !== false && !memo.undone) { undo(res); memo.undone = true; }
                return yes;
            },
        };
        this.stale[cat].delete(key);
        if (ok) { this.stats[cat].found++; this.neg[cat].delete(key); this.dirty = true; } else this.neg[cat].set(key, true);
        return ok;
    }

    // ---------- the searches (each a pass; returns 'changed' when it should start again) ----------
    #spanLabel(q, s, ids) { return `collect “${this.g.story.paragraphs[q]?.display?.slice(s.start, s.end) ?? ids.join(', ')}” (¶${q})`; }
    *collect() {
        for (let q = 1; q < this.g.read; q++) for (const s of this.g.story.spans[q] ?? []) {
            const ids = s.ids.filter((x) => this.model.cards.has(x));
            if (!ids.some((x) => !this.g.knows(x) && !this.g.hidden.has(x))) continue;
            const got = yield { cat: 'collect', label: this.#spanLabel(q, s, ids), run: () => this.g.collect(q, ids).length > 0 };
            if (got) this.stats.collect.found++;
        }
    }
    /** The collects still to come, in order: each span's cards (and the events its claims name) taken as collected. */
    #collectAhead(limit) {
        const got = new Set();
        const out = [];
        for (let q = 1; q < this.g.read && out.length < limit; q++) for (const s of this.g.story.spans[q] ?? []) {
            const ids = s.ids.filter((x) => this.model.cards.has(x));
            if (!ids.some((x) => !this.g.knows(x) && !this.g.hidden.has(x) && !got.has(x))) continue;
            out.push({ cat: 'collect', label: this.#spanLabel(q, s, ids) });
            for (const x of ids) { got.add(x); for (const e of this.g.claimEvents.get(x) ?? []) got.add(e); }
            if (out.length >= limit) break;
        }
        return out;
    }
    #askLabel(id) { return `ask what I know about ${this.#card(id)}`; }
    *ask() {
        for (let grew = true; grew;) {
            grew = false;
            for (const id of this.#held()) {
                if (!this.g.canAsk(id) || this.g.hasAsked(id)) continue;
                yield { cat: 'ask', label: this.#askLabel(id), run: () => { if (!this.g.hasAsked(id)) this.g.ask(id); return true; } };
                this.stats.ask.found++;
                grew = true;
            }
        }
    }
    /** The asks still to come about the cards held now, in order (cards still to arrive are asked about after them). */
    #askAhead(limit) {
        return this.#held().filter((id) => this.g.canAsk(id) && !this.g.hasAsked(id)).slice(0, limit).map((id) => ({ cat: 'ask', label: this.#askLabel(id) }));
    }
    /**
     * Builds, by what "onto something" tells (propose: a set is onto something when it is a strict part of a recipe
     * whose cards are all held). Level by level: every card on its own first; then sets one card larger, only from a
     * set found onto something, with a card itself onto something, and only when every part one card smaller is onto
     * something too (no part can be onto anything unless the whole is). A set already answered is not tried again:
     * a "no" until it goes stale, an "onto something" until an inference it may have pointed to is learned
     * (#update). A complete set (the game asks what the conclusion is about) tries the kinds; one that builds starts
     * the search again with the new card.
     */
    *build() {
        const self = this;
        const pool = this.order(this.#held().filter((x) => POOL.includes(this.#sec(x))));
        const rank = new Map(pool.map((x, i) => [x, i]));
        const inPool = (T) => T.every((x) => rank.has(x));
        const key = (T) => [...T].sort().join('|');
        const live = (k) => this.neg.build.has(k) && !this.stale.build.has(k);
        const known = (k) => live(k) || this.onto.has(k);
        const names = (T) => T.map((x) => this.#card(x)).join(' + ');
        const ontoCheck = (T) => ({ cat: 'build', size: T.length, label: `connect ${names(T)}: onto something?` });
        const kindCheck = (T, kind) => ({ cat: 'build', size: T.length, label: `connect ${names(T)} as ${CONCLUSION_KINDS[kind].toLowerCase()}` });
        // The plan (queue()): the sets of this level still to try, in order, and the kinds left of a complete set. A
        // level's list does not depend on its answers (they decide the next level), so it is exact until something builds.
        const at = { level: 1, list: [], i: -1, kinds: null };
        this.#frame('build', {
            items: () => [...(at.kinds ? at.kinds.list.slice(at.kinds.i + 1).map((kind) => kindCheck(at.kinds.T, kind)) : []),
                ...at.list.slice(at.i + 1).filter((T) => !known(key(T))).map(ontoCheck)],
            gap: () => at.level < MAX_SET,
            stage: () => `sets of ${at.level} card${at.level === 1 ? '' : 's'}`,
            after: () => 'this pass is over (no set is larger than 8)',
            then: () => {
                const n = [...this.onto].filter((k) => k.split('|').length === at.level && inPool(k.split('|'))).length;
                return `sets of ${at.level + 1} cards, made from the ${n} ${at.level === 1 ? `card${n === 1 ? '' : 's'}` : `set${n === 1 ? '' : 's'} of ${at.level}`} found onto something so far`;
            },
        });
        // One set: → 'changed' when it built something. Its answer is kept only once its kinds (if any) are all tried:
        // a pass abandoned between them tries the set again.
        function* attempt(T) {
            const k = key(T);
            const res = yield { ...ontoCheck(T), run: () => self.g.propose(T), out: (r) => (r.onto || r.needsKind || r.wrongKind ? 'yes' : 'no') };
            if (res.needsKind || res.wrongKind) {
                at.kinds = { T, list: self.#shuffle(Object.keys(CONCLUSION_KINDS)), i: -1 };
                for (const kind of at.kinds.list) {
                    at.kinds.i++;
                    const b = yield { ...kindCheck(T, kind), run: () => self.g.propose(T, kind), out: (r) => (r.built.length ? 'found' : 'no'), what: (r) => r.built.map((id) => self.#card(id)).join('; ') };
                    // A built inference is a card: the search starts again with it in the pool.
                    if (b.built.length) { self.stats.build.found += b.built.length; self.#bySize(T.length).found += b.built.length; self.dirty = true; return 'changed'; }
                }
                at.kinds = null;
            }
            self.stale.build.delete(k);
            if (res.onto) { self.onto.add(k); self.neg.build.delete(k); } else { self.onto.delete(k); self.neg.build.set(k, T); }
            return null;
        }
        // Level 1: every card on its own.
        at.list = pool.map((x) => [x]);
        for (at.i = 0; at.i < at.list.length; at.i++) if (!known(pool[at.i]) && (yield* attempt([pool[at.i]])) === 'changed') return 'changed';
        // Levels 2 and up: a set onto something and one more card onto something alone, every part one card smaller
        // onto something too. The list of a level is made when it starts (its parts are the level before's answers).
        const ones = pool.filter((x) => this.onto.has(x));
        for (let d = 1; d < MAX_SET; d++) {
            const base = [...this.onto].map((k) => k.split('|')).filter((T) => T.length === d && inPool(T))
                .map((T) => T.sort((x, y) => rank.get(x) - rank.get(y)))
                .sort((A, B) => { for (let i = 0; i < d; i++) if (rank.get(A[i]) !== rank.get(B[i])) return rank.get(A[i]) - rank.get(B[i]); return 0; });
            if (!base.length) break;
            const seen = new Set();
            const list = [];
            for (const T of base) for (const z of ones) {
                if (T.includes(z)) continue;
                const U = [...T, z];
                const k = key(U);
                if (seen.has(k)) continue;
                seen.add(k);
                if (d >= 2 && !U.every((_, i) => this.onto.has(key(U.filter((__, j) => j !== i))))) continue;
                list.push(U);
            }
            Object.assign(at, { level: d + 1, list, i: -1 });
            for (at.i = 0; at.i < list.length; at.i++) if (!known(key(list[at.i])) && (yield* attempt(list[at.i])) === 'changed') return 'changed';
        }
        return null;
    }
    *notice() {
        const label = (x) => `mark ${this.#card(x)} as important`;
        const f = this.#frame('notice', { list: this.order(this.#held().filter((c) => !this.g.noticed.has(c))), key: (x) => x, label, after: () => 'done until a new card or a new wait' });
        for (f.i = 0; f.i < f.list.length; f.i++) {
            const x = f.list[f.i];
            // Marking important takes a card out of the unimportant ones: undone, it goes back there.
            const aside = this.g.setAsideAt.get(x);
            const undo = () => { this.g.unnotice(x); if (aside !== undefined) this.g.setAside(x, aside); };
            if (yield* this.#try('notice', x, label(x), () => this.g.notice(x), (res) => res.lifts > 0, undo)) return 'changed';
        }
        return null;
    }
    *raise() {
        const all = this.#held().flatMap((id) => this.g.exceptionsOf(id).map((x) => [id, x.n, x.id, x.text])).filter(([id, n, x]) => !this.g.raised.has(`${id}#${n}:${x}`));
        const label = ([id, , x, text]) => `raise against ${this.#card(id)}: ${text ?? x}`;
        const f = this.#frame('raise', { list: this.#shuffle(all), key: ([id, n, x]) => `${id}#${n}:${x}`, label, after: () => 'done until a new card or a new wait' });
        for (f.i = 0; f.i < f.list.length; f.i++) {
            const [id, n, x] = f.list[f.i];
            const move = (m) => { m.before ??= this.#openRows(); return this.g.raise(id, n, x); };
            if (yield* this.#try('raise', `${id}#${n}:${x}`, label(f.list[f.i]), move, (res, m) => this.#openRows() < m.before, () => this.g.withdraw(id, n, x))) return 'changed';
        }
        return null;
    }
    // The part-by-part searches publish their plan in frames (queue()): each loop's list and where it is, innermost
    // last. A frame's rest is exact while every answer is "no"; `gap`: a stage whose list is not made yet comes
    // between it and the frame outside it (then: what), so the plan stops there.
    *check() {
        const slots = this.g.visibleSlots();
        const verbLabel = (verb) => `a check that ${verb}s: onto something?`;
        const vf = this.#frame('check', { list: this.#shuffle(Object.keys(CHECK_TEMPLATES)), key: (verb) => `v|${verb}`, label: verbLabel, after: () => 'done, unless one is onto something (its fields come first)' });
        for (vf.i = 0; vf.i < vf.list.length; vf.i++) {
            const verb = vf.list[vf.i];
            if (!(yield* this.#part('check', `v|${verb}`, verbLabel(verb), () => this.g.sealOnto(verb, {})))) continue;
            const tpl = CHECK_TEMPLATES[verb];
            const [f1, f2] = tpl.fields;
            const field = function* (self, f) {
                const out = [];
                const label = (c) => `${verb}, ${f} ${self.#card(c)}: onto something?`;
                const ff = self.#frame('check', { list: self.order(self.#fieldList(f)), key: (c) => `f|${verb}|${f}|${c}`, label, gap: () => true,
                    then: () => (f === f1 ? `the ${f2} cards, then the pairs found onto something` : `the pairs of what was found onto something (${out.length ? `${p1.length} × ${out.length} so far` : `${p1.length} × none so far`})`) });
                for (ff.i = 0; ff.i < ff.list.length; ff.i++) {
                    const c = ff.list[ff.i];
                    if (yield* self.#part('check', `f|${verb}|${f}|${c}`, label(c), () => self.g.sealOnto(verb, { [f]: c }))) out.push(c);
                }
                self.#unframe('check', ff);
                return out;
            };
            let p1 = [];
            p1 = yield* field(this, f1);
            const p2 = yield* field(this, f2);
            const planOf = ([c1, c2]) => `${verb}: ${f1} ${this.#card(c1)}, ${f2} ${this.#card(c2)}`;
            const pairKey = ([c1, c2]) => `${verb}|${c1}|${c2}`;
            const pf = this.#frame('check', { list: p1.flatMap((c1) => p2.map((c2) => [c1, c2])), key: (pr) => `p|${pairKey(pr)}`, label: (pr) => `${planOf(pr)}: onto something?` });
            for (pf.i = 0; pf.i < pf.list.length; pf.i++) {
                const [c1, c2] = pf.list[pf.i];
                const fields = { [f1]: c1, [f2]: c2 };
                const pair = pairKey(pf.list[pf.i]);
                const plan = planOf(pf.list[pf.i]);
                if (!(yield* this.#part('check', `p|${pair}`, `${plan}: onto something?`, () => this.g.sealOnto(verb, fields)))) continue;
                const seal = (opts, key, label) => this.#try('check', `s|${pair}|${key}`, label, () => this.g.seal(verb, fields, opts), (res) => res.lifts > 0, (res) => this.g.unseal(res.id));
                // No expectation first: it never hedges another seal of the same check.
                const sealLabel = (expect) => `seal ${plan}${expect ? `, expecting ${expect}` : ''}`;
                const ef = this.#frame('check', { list: [null, ...this.#shuffle(tpl.outcomes)], key: (expect) => `s|${pair}|${expect}`, label: sealLabel, gap: () => true,
                    then: () => 'the questions an expected answer could be about, then the answers' });
                for (ef.i = 0; ef.i < ef.list.length; ef.i++) if (yield* seal({ expect: ef.list[ef.i] }, `${ef.list[ef.i]}`, sealLabel(ef.list[ef.i]))) return 'changed';
                this.#unframe('check', ef);
                // The question an expected answer is about is a part; its value is tried whole.
                const qs = [];
                const qLabel = (sl) => `${plan}, expecting an answer to “${this.names.slot(sl.id)}”?`;
                const qf = this.#frame('check', { list: this.#shuffle(slots), key: (sl) => `q|${pair}|${sl.id}`, label: qLabel, gap: () => true, then: () => 'the answers expected to the questions found' });
                for (qf.i = 0; qf.i < qf.list.length; qf.i++) {
                    const sl = qf.list[qf.i];
                    if (yield* this.#part('check', `q|${pair}|${sl.id}`, qLabel(sl), () => this.g.sealOnto(verb, fields, { slot: sl.id }))) qs.push(sl);
                }
                this.#unframe('check', qf);
                for (const expect of tpl.outcomes) for (const sl of qs) {
                    const vLabel = (v) => `seal ${plan}, expecting ${expect}: ${this.names.slot(sl.id)} — ${this.names.value(sl.id, v)}`;
                    const af = this.#frame('check', { list: this.orderValues(sl.id, sl.domain.filter((x) => this.g.offered(sl.id, x))), key: (v) => `s|${pair}|${expect}|${sl.id}=${v}`, label: vLabel, gap: () => true, then: () => 'the other answers expected' });
                    for (af.i = 0; af.i < af.list.length; af.i++) if (yield* seal({ expect, answer: { eq: [sl.id, af.list[af.i]] } }, `${expect}|${sl.id}=${af.list[af.i]}`, vLabel(af.list[af.i]))) return 'changed';
                    this.#unframe('check', af);
                }
            }
            this.#unframe('check', pf);
        }
        return null;
    }
    *absence() {
        const held = this.#held();
        const parts = function* (self, list, key, prefix, what, then) {
            const out = [];
            const label = (x) => `an absence, ${what} ${prefix === 't' ? self.names.time(x) : self.#card(x)}: onto something?`;
            const f = self.#frame('absence', { list, key: (x) => `${prefix}|${x}`, label, gap: () => true, then });
            for (f.i = 0; f.i < f.list.length; f.i++) {
                const x = f.list[f.i];
                if (yield* self.#part('absence', `${prefix}|${x}`, label(x), () => self.g.absenceOnto({ [key]: x }))) out.push(x);
            }
            self.#unframe('absence', f);
            return out;
        };
        const fs = yield* parts(this, this.order(held.filter((x) => this.#sec(x) === 'rules')), 'expectation', 'e', 'what should have happened:', () => 'who would have noticed, then when, then the absences made of what was found');
        const ws = yield* parts(this, this.order(held.filter((x) => this.#sec(x) === 'claims')), 'witness', 'w', 'who would have noticed:', () => 'when, then the absences made of what was found');
        const ts = yield* parts(this, this.#shuffle(this.#times().map((x) => x.id)), 'time', 't', 'when:', () => `the absences made of what was found (${fs.length} × ${ws.length} × the times found)`);
        const label = ([f, t, w]) => `file an absence: ${this.#card(f)}; ${this.names.time(t)}; ${this.#card(w)}`;
        const cf = this.#frame('absence', { list: fs.flatMap((f) => ws.flatMap((w) => ts.map((t) => [f, t, w]))), key: ([f, t, w]) => `a|${f}|${t}|${w}`, label });
        for (cf.i = 0; cf.i < cf.list.length; cf.i++) {
            const [f, t, w] = cf.list[cf.i];
            if (yield* this.#try('absence', `a|${f}|${t}|${w}`, label(cf.list[cf.i]), () => this.g.fileAbsence(f, t, w), (res) => res.ok && !res.existing, () => {})) return 'changed';
        }
        return null;
    }
    *drop() {
        const tLabel = (tg) => `drop ${this.#target(tg)}: a wrong turn?`;
        const tkOf = (tg) => dropKey(tg.theory ? { theory: tg.theory } : tg);
        const tf = this.#frame('drop', { list: this.orderTargets(this.#dropTargets()), key: (tg) => `d|${tkOf(tg)}`, label: tLabel, after: () => 'done, unless one is a wrong turn (its reasons come first)' });
        for (tf.i = 0; tf.i < tf.list.length; tf.i++) {
            const tg = tf.list[tf.i];
            const target = tg.theory ? { theory: tg.theory } : tg;
            const tk = dropKey(target);
            if (!(yield* this.#part('drop', `d|${tk}`, tLabel(tg), () => this.g.dropOnto(target)))) continue;
            const rLabel = ([reason, , cite, rivalName]) => `drop ${this.#target(tg)} ${reason === 'card' ? `because of ${this.#card(cite)}` : reason === 'cost' ? 'for what it costs' : `${reason === 'out-explained' ? 'out-explained by' : 'needing more hands than'} “${rivalName}”`}`;
            const rf = this.#frame('drop', { list: this.#shuffle(this.#dropReasons()), key: ([reason, rival, cite]) => `r|${tk}|${reason}|${rival}|${cite}`, label: rLabel });
            for (rf.i = 0; rf.i < rf.list.length; rf.i++) {
                const [reason, rival, cite] = rf.list[rf.i];
                const move = () => { this.stats.drop.solver++; return this.g.drop(target, reason, { rival, cites: cite ? [cite] : [] }); };
                if (yield* this.#try('drop', `r|${tk}|${reason}|${rival}|${cite}`, rLabel(rf.list[rf.i]), move, () => (this.g.dropOf(target)?.held ?? null) !== null, () => this.g.undrop(target))) return 'changed';
            }
            this.#unframe('drop', rf);
        }
        return null;
    }

    // ---------- keeping track ----------
    /** The hand, the times on the board, the paragraphs read and the waits; mark what they make stale. */
    #update() {
        const now = this.#held();
        const fresh = now.filter((x) => !this.hand.has(x));
        const newTimes = TL.times(this.g).map((t) => t.id).filter((t) => !this.reached.has(t));
        const from = this.lastRead;
        if (fresh.length || newTimes.length || from !== this.g.read) {
            for (const x of fresh) this.hand.add(x);
            for (const t of newTimes) this.reached.add(t);
            this.lastRead = this.g.read;
            // An inference now held no longer counts as a recipe: a set onto something may have been so only for it.
            for (const x of fresh) {
                const inf = this.g.inferenceById.get(x);
                if (!inf) continue;
                const ps = new Set(inf.premises);
                for (const k of [...this.onto]) if (k.split('|').every((c) => ps.has(c))) this.onto.delete(k);
            }
            const marked = this.#staleOn(fresh, new Set(newTimes), from);
            if (fresh.length || newTimes.length || marked) { this.version++; this.dirty = true; }
        }
        if (this.dirty) {
            // Asking for the waits may stop for the solver: `dirty` stays until it is answered.
            const open = this.g.blockers();
            this.dirty = false;
            this.open = open;
            const key = JSON.stringify(open);
            if (key !== this.waitsKey) {
                const before = new Set(JSON.parse(this.waitsKey || '[]').map((w) => JSON.stringify(w)));
                this.families = new Set(open.map(waitCategory));
                // A notice, a raise or a seal that lifted nothing may lift a wait that has just opened.
                const opened = new Set(open.filter((w) => !before.has(JSON.stringify(w))).map(waitCategory));
                for (const cat of ['notice', 'raise']) if (opened.has(cat)) for (const k of this.neg[cat].keys()) this.stale[cat].add(k);
                if (opened.has('check')) for (const k of this.neg.check.keys()) if (k.startsWith('s|')) this.stale.check.add(k);
                this.waitsKey = key;
                this.current = null;
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

    #live(cat) {
        if (!this.running.has(cat)) return false;
        const s = this.spent.get(cat);
        return !(s && s.version === this.version && s.waits === this.waitsKey);
    }
    /** The categories with something to search now, in the order they take turns from the next one. */
    #turns() {
        const first = ['collect', 'ask'].filter((c) => this.#live(c));
        const rest = SEARCHED.slice(2).filter((c) => this.families.has(c) && this.#live(c));
        const i = rest.length ? this.turn % rest.length : 0;
        return [...first, ...rest.slice(i), ...rest.slice(0, i)];
    }
    /** The check a category plans next (its search advanced past its bookkeeping); null when its pass is over. */
    #pending(cat) {
        let gen = this.gens.get(cat);
        if (gen && gen.version !== this.version) gen = null;
        if (!gen) { this.plans.set(cat, []); gen = { it: this[cat](), version: this.version, pending: null }; this.gens.set(cat, gen); }
        if (gen.pending) return gen.pending;
        return this.#advance(cat, gen, undefined);
    }
    #advance(cat, gen, value) {
        let r;
        try { r = gen.it.next(value); } catch (e) { this.gens.delete(cat); throw e; }
        if (r.done) {
            if (this.gens.get(cat) === gen) this.gens.delete(cat);
            // A pass that changed nothing is spent until the hand or the waits change.
            if (r.value !== 'changed') this.spent.set(cat, { version: this.version, waits: this.waitsKey });
            return null;
        }
        gen.pending = r.value;
        return r.value;
    }

    /**
     * The check about to be made, planned and not yet made (null: nothing to search; `idle()` says why). Reads on first
     * if the story does not wait and the automation reads by itself.
     */
    next() {
        for (let guard = 0; guard < 100000; guard++) {
            if (this.g.finished()) return (this.current = null);
            this.#update();
            if (!this.open.length) {
                if (!this.autoRead) return (this.current = null);
                this.g.advance();
                this.dirty = true;
                continue;
            }
            if (this.current && this.gens.get(this.current.cat)?.pending === this.current) return this.current;
            const turns = this.#turns();
            if (!turns.length) return (this.current = null);
            const check = this.#pending(turns[0]);
            if (check) return (this.current = check);
        }
        throw new Error('automation: no check planned');
    }
    /** Why nothing is planned: 'end', 'reading' (the story does not wait), 'paused' (a waiting category is paused),
     *  'stuck' (searched everything with what is held), or null. */
    idle() {
        if (this.g.finished()) return 'end';
        if (this.current) return null;
        if (!this.open.length) return 'reading';
        return this.open.some((w) => !this.running.has(waitCategory(w))) ? 'paused' : 'stuck';
    }
    /**
     * The checks to come, in the order they will be made (the first is next()), as far as they can be known: every
     * collect, then every ask (these two run to the end before the rest), then the categories of the open waits taking
     * turns, each from its plan (#planOf: exact while every answer is "no"; a build level's list holds whatever its
     * answers). The list stops where a category's next stage is not made yet. → {list (up to `limit`), lines: per
     * category {cat, stage, more (planned, not in the list), open, then}, end (the list runs to the end of the search)}.
     */
    plan(limit = 11) {
        const c = this.next();
        if (!c) return { list: [], lines: [], end: false };
        const lists = new Map();
        for (const cat of this.#turns()) {
            if (cat === 'collect' || cat === 'ask') {
                if (!this.#pending(cat)) continue;
                lists.set(cat, { items: cat === 'collect' ? this.#collectAhead(Infinity) : this.#askAhead(Infinity), open: false, then: null, stage: null });
            } else {
                const p = this.#pending(cat);
                if (!p) continue;
                const pl = this.#planOf(cat);
                lists.set(cat, { ...pl, items: [p, ...pl.items] });
            }
        }
        const took = new Map([...lists.keys()].map((cat) => [cat, 0]));
        const out = [];
        const take = (cat) => { out.push(lists.get(cat).items[took.get(cat)]); took.set(cat, took.get(cat) + 1); };
        for (const cat of ['collect', 'ask']) while (lists.has(cat) && out.length < limit && took.get(cat) < lists.get(cat).items.length) take(cat);
        // The others take turns as next() and execute() turn them: a category leaves the turns after its last check.
        let rest = SEARCHED.slice(2).filter((cat) => lists.has(cat));
        let turn = this.turn, end = false;
        if (['collect', 'ask'].every((cat) => !lists.has(cat) || took.get(cat) >= lists.get(cat).items.length)) {
            while (out.length < limit) {
                if (!rest.length) { end = true; break; }
                const cat = rest[turn % rest.length];
                const L = lists.get(cat);
                if (took.get(cat) >= L.items.length) break;     // an open plan: what comes next is not known yet
                take(cat);
                turn++;
                if (took.get(cat) >= L.items.length && !L.open) rest = rest.filter((x) => x !== cat);
            }
        }
        // The head is the check planned (the same one, not a copy).
        if (out[0]?.label === c.label && out[0]?.cat === c.cat) out[0] = c; else out.unshift(c);
        const lines = [...lists].map(([cat, L]) => ({ cat, stage: L.stage, more: L.items.length - took.get(cat), open: L.open, then: L.then }));
        return { list: out.slice(0, limit), lines, end };
    }
    /** The checks to come (plan().list). */
    queue(limit = 12) { return this.plan(limit).list; }
    /**
     * Make the check next() planned: → its log entry {n, para, cat, label, out: 'yes' | 'no' | 'found', what?} (null if
     * none). Safe to call again after the solver stopped it (the move is made once).
     */
    execute() {
        const c = this.current ?? this.next();
        if (!c) return null;
        if (!('result' in c)) {
            const result = c.run();
            c.result = result;
            this.n++;
            this.stats[c.cat].checked++;
            if (c.size) this.#bySize(c.size).checked++;
            const out = c.out ? c.out(result) : c.kept ? (result ? 'found' : 'no') : result ? 'yes' : 'no';
            c.entry = { n: this.n, para: this.g.read - 1, cat: c.cat, ...(c.size && { size: c.size }), label: c.label, out, ...(c.what && out === 'found' && { what: c.what(result) }) };
            this.log.push(c.entry);
            this.#trimLog();
        }
        const gen = this.gens.get(c.cat);
        if (gen?.pending === c) { gen.pending = null; this.#advance(c.cat, gen, c.result); }
        this.current = null;
        // The categories of the open waits take turns.
        if (!['collect', 'ask'].includes(c.cat)) this.turn++;
        if (c.entry.out === 'found' || ['collect', 'ask'].includes(c.cat)) this.dirty = true;
        return c.entry;
    }

    /** Up to `budget` checks at once: → {checks, idle: null | 'end' | 'reading' | 'paused' | 'stuck', end}. */
    step(budget = 1000) {
        let checks = 0;
        while (checks < budget) {
            if (!this.next()) break;
            this.execute();
            checks++;
        }
        return { checks, idle: checks < budget ? this.idle() : null, end: this.g.finished() };
    }

    // ---------- the counts ----------
    /**
     * Per category: {terms: [{label, factors: [{label, n}]}], total (Σ of the terms' products), checked, found, ruledOut
     * (of the space as it stands, known not to make anything now), left (unchecked: the rest), leftMore (builds: a set
     * size not known yet), stale (negatives to check again), searched; builds: sizes [{k, total, ruledOut, left (null:
     * not known until the size below is all answered), stale, checked, found, terms}]}.
     */
    /**
     * Per card held, what the search still has to try with it, by the same rules as counts() (a negative not stale
     * rules out every combination it is part of): → Map card → {left, cats: {category: n}}. Collect, drops and answers
     * are not per card.
     */
    perCard() {
        const g = this.g;
        const held = this.#held();
        const live = (cat, k) => this.neg[cat].has(k) && !this.stale[cat].has(k);
        const out = new Map(held.map((x) => [x, { left: 0, cats: {} }]));
        const add = (x, cat, n) => { const o = out.get(x); if (!o || !n) return; o.cats[cat] = (o.cats[cat] ?? 0) + n; o.left += n; };
        for (const x of held) {
            if (g.canAsk(x) && !g.hasAsked(x)) add(x, 'ask', 1);
            if (!g.noticed.has(x) && !live('notice', x)) add(x, 'notice', 1);
            for (const e of g.exceptionsOf(x)) { const k = `${x}#${e.n}:${e.id}`; if (!g.raised.has(k) && !live('raise', k)) add(x, 'raise', 1); }
        }
        // Builds, as far as "onto something" has told (never more): the card alone if not tried yet; the pairs with it
        // not tried yet (none with a card ruled out alone: no pair with it is onto anything); and larger sets only
        // where a set of two or more with it was found onto something (a larger set builds), each such set and one
        // more card. A card whose pairs are all tried, none onto anything, has nothing left.
        const pool = held.filter((x) => POOL.includes(this.#sec(x)));
        const out1 = new Set(pool.filter((x) => live('build', x)));
        const free = pool.filter((x) => !out1.has(x));
        const freeSet = new Set(free);
        const triedPairs = new Map();   // card → pairs with it tried (a "no" still in force, or onto something)
        for (const k of [...this.neg.build.keys(), ...this.onto]) {
            const T = k.split('|');
            if (T.length !== 2 || !T.every((x) => freeSet.has(x)) || (!this.onto.has(k) && !live('build', k))) continue;
            for (const x of T) triedPairs.set(x, (triedPairs.get(x) ?? 0) + 1);
        }
        // Larger sets: those the search will try (*build): an onto set of two or more and one more card onto something
        // alone, every part one card smaller onto something too, not tried yet.
        const larger = new Map();       // card → those sets with it
        const ones = free.filter((x) => this.onto.has(x));
        const key = (T) => [...T].sort().join('|');
        for (const k of this.onto) {
            const T = k.split('|');
            if (T.length < 2 || T.length >= MAX_SET || !T.every((x) => freeSet.has(x))) continue;
            for (const z of ones) {
                if (T.includes(z)) continue;
                const U = [...T, z];
                const k2 = key(U);
                if (live('build', k2) || this.onto.has(k2)) continue;
                if (!U.every((_, i) => this.onto.has(key(U.filter((__, j) => j !== i))))) continue;
                for (const x of U) (larger.get(x) ?? larger.set(x, new Set()).get(x)).add(k2);
            }
        }
        for (const x of free) {
            const o = out.get(x);
            const alone = !this.neg.build.has(x) && !this.onto.has(x) ? 1 : this.stale.build.has(x) ? 1 : 0;
            const pairs = free.length - 1 - (triedPairs.get(x) ?? 0);
            const big = larger.get(x)?.size ?? 0;
            o.build = { alone, pairs, larger: big };
            add(x, 'build', alone + pairs + big);
        }
        // Sealed checks: for each verb and field the card can fill, the other field's cards not ruled out × the results.
        for (const [verb, t] of Object.entries(CHECK_TEMPLATES)) {
            if (live('check', `v|${verb}`)) continue;
            const [f1, f2] = t.fields;
            const e = t.outcomes.length + 1;
            const open = (f) => this.#fieldList(f).filter((c) => !live('check', `f|${verb}|${f}|${c}`));
            const a = open(f1), b = open(f2);
            for (const x of a) add(x, 'check', b.length * e);
            for (const x of b) add(x, 'check', a.length * e);
        }
        // Absences: a fact or a statement not ruled out, × the times and the other part not ruled out.
        const facts = held.filter((x) => this.#sec(x) === 'rules' && !live('absence', `e|${x}`));
        const stmts = held.filter((x) => this.#sec(x) === 'claims' && !live('absence', `w|${x}`));
        const times = this.#times().filter((t) => !live('absence', `t|${t.id}`)).length;
        for (const x of facts) add(x, 'absence', times * stmts.length);
        for (const x of stmts) add(x, 'absence', times * facts.length);
        return out;
    }

    counts() {
        const g = this.g;
        const held = this.#held();
        const out = {};
        const put = (cat, terms, ruledOut) => {
            const total = terms.reduce((a, t) => a + t.factors.reduce((p, f) => p * f.n, 1), 0);
            const r = Math.min(total, Math.max(0, ruledOut));
            // left: unchecked, not ruled out (the rest of the space); leftMore: more may come (builds: a size not known yet).
            out[cat] = { terms, total, ...this.stats[cat], ruledOut: r, left: total - r, leftMore: false, stale: this.stale[cat].size, searched: SEARCHED.includes(cat) };
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
        const live = (cat, k) => this.neg[cat].has(k) && !this.stale[cat].has(k);
        const pool = held.filter((x) => POOL.includes(this.#sec(x)));
        const out1 = pool.filter((x) => live('build', x)).length;
        const kinds = Object.keys(CONCLUSION_KINDS).length;
        const sizes = Array.from({ length: MAX_SET }, (_, i) => i + 1);
        // Per size: a set with a card ruled out alone, or itself a "no" in force (a lower bound, as for the whole).
        const out1Set = new Set(pool.filter((x) => live('build', x)));
        const negOf = new Map(sizes.map((k) => [k, 0]));
        for (const [k, T] of this.neg.build) if (T.length > 1 && live('build', k) && !T.some((x) => out1Set.has(x))) negOf.set(T.length, negOf.get(T.length) + 1);
        const staleOf = (k) => [...this.stale.build].filter((key) => key.split('|').length === k).length;
        // Unchecked, by the search's own rule (*build): alone, every card not answered yet; a size larger only once the
        // size below is all answered, as the sets its level would list (a set onto something and a card onto something
        // alone, every part one card smaller onto something), not answered yet. Before that, not known (null).
        const keyOf = (T) => [...T].sort().join('|');
        const known = (k) => live('build', k) || this.onto.has(k);
        const inPool = new Set(pool);
        const ones = pool.filter((x) => this.onto.has(x));
        const unchecked = [pool.filter((x) => !known(x)).length];
        for (let k = 2; k <= MAX_SET; k++) {
            if (unchecked.at(-1) !== 0) { unchecked.push(null); continue; }
            const seen = new Set();
            let n = 0;
            for (const T of [...this.onto].map((x) => x.split('|')).filter((T) => T.length === k - 1 && T.every((x) => inPool.has(x)))) for (const z of ones) {
                if (T.includes(z)) continue;
                const U = [...T, z];
                const kk = keyOf(U);
                if (seen.has(kk)) continue;
                seen.add(kk);
                if (k > 2 && !U.every((_, i) => this.onto.has(keyOf(U.filter((__, j) => j !== i))))) continue;
                if (!known(kk)) n++;
            }
            unchecked.push(n);
        }
        const bySize = sizes.map((k) => {
            const total = choose(pool.length, k) * kinds;
            const left = unchecked[k - 1] === null ? null : unchecked[k - 1] * kinds;
            const ruledOut = left === null ? Math.min(total, (choose(pool.length, k) - choose(pool.length - out1, k) + negOf.get(k)) * kinds) : total - left;
            return { k, total, ruledOut, left, stale: staleOf(k), checked: this.#bySize(k).checked, found: this.#bySize(k).found, terms: `${choose(pool.length, k)} sets × ${kinds} kinds` };
        });
        put('build', sizes.map((k) => ({ label: `sets of ${k}`, factors: [{ label: 'sets', n: choose(pool.length, k) }, { label: 'kinds', n: kinds }] })),
            bySize.reduce((a, x) => a + x.ruledOut, 0));
        out.build.sizes = bySize;
        // The whole: the sizes known, and whether a size is not known yet (more may come).
        out.build.left = bySize.reduce((a, x) => a + (x.left ?? 0), 0);
        out.build.leftMore = bySize.some((x) => x.left === null);
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
        const targets = this.#dropTargets().map((t) => (t.theory ? { theory: t.theory } : t)), reasons = this.#dropReasons().length;
        const rtg = targets.filter((t) => live('drop', `d|${dropKey(t)}`)).length;
        const tries = [...this.neg.drop.keys()].filter((k) => k.startsWith('r|') && live('drop', k)).length;
        put('drop', [{ label: 'drops', factors: [{ label: 'targets', n: targets.length }, { label: 'reasons', n: reasons }] }], rtg * reasons + tries);
        // Answers: the other route to a deduction (not searched: the builds route).
        put('answers', [{ label: 'answers shown', factors: [{ label: 'answers', n: this.#answers().length }] }], 0);
        return out;
    }
}
