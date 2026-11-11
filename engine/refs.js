// Paragraph references and the reader's reading, for a case told in more than one story (docs/authored-stories.md,
// "The two-index design"): the main story and its sub-stories (case files), each with its own paragraphs. A reference
// is a bare number for the main story (every case written before sub-stories stays as it was) or "<story>:<n>" for a
// sub-story's paragraph ("rudd:2"). Paragraph 0 of every story is its title; a reference at or below 0 is always read.
//
// The reading is the log of paragraphs read, in the order read: how far each story is read is how many of its
// paragraphs the log holds, and where an order among what is read is wanted (which mention of a name came first, how
// entries of one time point are sorted) it is the order of the log. A position is never shown to the player.

export const MAIN = 'main';

/** `{story, n}` of a reference, or null. A number, or a string of digits, is the main story's. */
export function parseRef(x) {
    if (x == null || x === '') return null;
    if (typeof x === 'number') return Number.isFinite(x) ? { story: MAIN, n: x } : null;
    if (typeof x === 'object' && x.story) return { story: x.story, n: x.n };
    const s = String(x);
    if (/^-?\d+$/.test(s)) return { story: MAIN, n: Number(s) };
    const m = /^([A-Za-z0-9_-]+):(\d+)$/.exec(s);
    return m ? { story: m[1], n: Number(m[2]) } : null;
}
/** The canonical string of a reference: "<story>:<n>" (the main story's too). */
export const refKey = (x) => { const r = parseRef(x); return r ? `${r.story}:${r.n}` : null; };
/** A reference as data writes it: a bare number for the main story. */
export const refData = (story, n) => (story === MAIN ? n : `${story}:${n}`);
/** A reference or a list of them, as a list. */
export const refList = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);

/** The reader's reading: `log`, the references read in order (canonical keys). */
export class Reading {
    /** `lengths`: the paragraphs of each story (`{story: n}`), so that what is unread has a place after what is read. */
    constructor(log = [], lengths = null) {
        this.lengths = lengths;
        this.order = null;
        this.log = [];
        this.index = new Map();
        this.to = new Map();
        for (const k of log) this.push(k);
    }
    /** From a save: its `log`, or (a save from before sub-stories) its `para`, the main story read to it. */
    static fromSave(save = {}, lengths = null) {
        // A log, and the main story read at least to `para` (a save whose `para` was moved on by hand, as the checks do).
        if (Array.isArray(save.log) && save.log.length) {
            const r = new Reading(save.log.map(refKey).filter(Boolean), lengths);
            if (Number(save.para) > r.readTo(MAIN)) r.readOn(MAIN, Number(save.para));
            return r;
        }
        const p = Math.max(1, Number(save.para) || 1);
        return new Reading(Array.from({ length: p }, (_, i) => `${MAIN}:${i + 1}`), lengths);
    }
    push(key) {
        const r = parseRef(key);
        if (!r || this.index.has(refKey(r))) return;
        this.log.push(refKey(r));
        this.order = null;
        this.index.set(refKey(r), this.log.length);
        this.to.set(r.story, Math.max(this.to.get(r.story) ?? 0, r.n));
    }
    /** How far a story is read (0: not begun). */
    readTo(story = MAIN) { return this.to.get(story) ?? 0; }
    /** The number of paragraphs read: every position of what is read is at most this. */
    get count() { return this.log.length; }
    /**
     * Where a reference stands in the reading: 0 for a title or "always", its place in the log; unread, a place after
     * every paragraph read (the main story's first, then each story's as `lengths` lists them), or Infinity.
     */
    pos(x) {
        const r = parseRef(x);
        if (!r) return Infinity;
        if (r.n <= 0) return 0;
        return this.index.get(refKey(r)) ?? this.full().index.get(refKey(r)) ?? Infinity;
    }
    /** Every paragraph, the read ones first in the order read, then the rest: `{keys, index}`. */
    full() {
        if (this.order) return this.order;
        const keys = [...this.log];
        for (const [story, len] of Object.entries(this.lengths ?? {}).sort(([a], [b]) => (a === MAIN ? -1 : b === MAIN ? 1 : 0))) {
            for (let n = 1; n <= len; n++) if (!this.index.has(`${story}:${n}`)) keys.push(`${story}:${n}`);
        }
        this.order = { keys, index: new Map(keys.map((k, i) => [k, i + 1])) };
        return this.order;
    }
    /** Whether a reference has been read (null: never). */
    seen(x) { return this.pos(x) <= this.count; }
    /** Whether every reference of a list (or one) has been read. */
    seenAll(x) { return refList(x).every((r) => this.seen(r)); }
    /** Of some references, the one read last (null if any is unread or none given). */
    latest(xs) {
        let best = null, at = -1;
        for (const x of xs) { const p = this.pos(x); if (p > this.count) return null; if (p > at) { at = p; best = x; } }
        return best;
    }
    /** Read on in a story to paragraph n (from where it stands). */
    readOn(story, n) { for (let i = this.readTo(story) + 1; i <= n; i++) this.push(`${story}:${i}`); }
    /** Of some references, the one read first (by `pos`: unread ones after every read one). */
    earliest(xs) { let best = null; for (const x of xs) if (x != null && (best == null || this.pos(x) < this.pos(best))) best = x; return best; }
    /** The reading as it was before a reference was read (the gate's "just before"): the log up to it. */
    before(x) {
        const p = this.pos(x);
        return p > this.count ? new Reading(this.log, this.lengths) : new Reading(this.log.slice(0, Math.max(0, p - 1)), this.lengths);
    }
}
