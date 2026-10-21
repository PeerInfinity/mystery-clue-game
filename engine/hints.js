// The hints (docs/hints.md): on request, a ladder of four rungs toward the open row with the nearest deadline. A row is
// one of the score's (a thought and its family); it is open while its deadline is not read, the player has not made it,
// and all it needs is in what the player has read. What it needs comes from cases/<case>/hints.json (engine/hintData.js:
// the minimal playthrough's moves, each with the moves that first gave what it needs), pruned live by what the player
// has already: a card held, a background fact asked, an inference built. The rungs name only held cards, read paragraphs
// and the words of read paragraphs (engine/hints.test.js checks it at every paragraph); the fourth gives the moves.

const key = (thought, family) => `${thought}|${family}`;

/** The rows the player has made (as the score functions count them, a deadline or not): Set of `thought|family`. */
export function madeRows(g) {
    const out = new Set();
    const add = (family, rows, made) => { for (const r of rows) if (made(r)) out.add(key(r.thought, family)); };
    add('deduction', g.thoughtScores(), (r) => r.made !== null);
    add('notice', g.noticeScores(), (r) => r.noticed !== null);
    add('raise', g.raiseScores(), (r) => r.raised !== null);
    add('drop', g.dropScores(), (r) => r.held !== null);
    add('check', g.checkScores(), (r) => r.sealed !== null && !r.hedged);
    add('absence', g.absenceScores(), (r) => r.filed !== null);
    return out;
}

/** Has the player already what move `m` gives? */
function had(g, m) {
    switch (m.op) {
        case 'collect': return g.knows(m.card);
        case 'ask': return g.hasAsked(m.card) || (!!m.got?.length && m.got.every((x) => g.knows(x)));
        case 'build': return g.knows(m.inference);
        case 'notice': return g.noticed.has(m.card);
        case 'raise': return [...g.raised.values()].some((r) => r.id === m.target && r.exception === m.exception);
        case 'file': return g.filed.some((f) => f.id === m.absence);
        // The engine drops an answer it does not list; the page drops it from its chip (a settled question shows none).
        case 'candidate': return !!g.marks.get(m.slot)?.listed?.has(m.value) || g.settled(m.slot) !== null;
        case 'theory': return g.theories.some((t) => t.label === m.label);
        case 'drop': return (g.dropOf(m.target)?.held ?? null) !== null;
        default: return false;
    }
}

/** Is a want (a card, `theory:`, `cand:` or `shown:`) in hand already? */
function holds(g, w) {
    if (w.startsWith('theory:')) return g.theories.some((t) => t.label === w.slice(7));
    if (w.startsWith('cand:')) { const [slot, value] = w.slice(5).split('='); return !!g.marks.get(slot)?.listed?.has(value) || g.settled(slot) !== null; }
    if (w.startsWith('shown:')) return g.slotVisible(w.slice(6));
    return g.knows(w);
}

export class Hints {
    /** `data`: hints.json. */
    constructor(game, data) {
        this.g = game;
        this.data = data;
        this.bySeq = new Map(data.moves.map((m) => [m.seq, m]));
    }

    /** The moves row `r` still needs, in order (those that make it, and backwards what they need that is not had). */
    plan(r) {
        const out = new Set();
        const visit = (seq) => {
            const m = this.bySeq.get(seq);
            if (out.has(seq) || had(this.g, m)) return;
            for (const d of m.needs) visit(d);
            out.add(seq);
        };
        for (const s of r.makes) visit(s);
        return [...out].sort((a, b) => a - b).map((s) => this.bySeq.get(s));
    }

    /** The moves of `plan` that can be made now: at a read paragraph, every want in hand or coming from another of them
     *  that can (`src`: the move that gave it in the minimal playthrough), in order. */
    ready(plan) {
        const g = this.g;
        const ok = new Map();
        const can = (m) => {
            if (ok.has(m.seq)) return ok.get(m.seq);
            ok.set(m.seq, false);
            const deps = plan.filter((x) => m.needs.includes(x.seq));
            const v = m.at < g.read && deps.every(can) && m.wants.every((w) => holds(g, w) || deps.some((d) => d.seq === m.src[w]));
            ok.set(m.seq, v);
            return v;
        };
        return plan.filter(can);
    }

    /**
     * The open rows: deadline not read, not made, and a step of it (a move other than collecting or asking) that can be
     * made now; each with its plan, `now` (the moves that can be made now) and `due`, the nearer of its deadline and
     * the paragraph where the story states an inference it still needs (the player can no longer build it then).
     * `skip`: keys to leave out. Sorted: the nearest `due`, then the fewest moves.
     */
    open({ skip = null } = {}) {
        if (this.g.autoSolves()) return [];
        const made = madeRows(this.g);
        const read = this.g.read;
        const out = [];
        for (const r of this.data.rows) {
            const k = key(r.thought, r.family);
            if (r.deadline < read || made.has(k) || skip?.has(k)) continue;
            const plan = this.plan(r);
            const now = this.ready(plan);
            if (!now.some((m) => !['collect', 'ask'].includes(m.op))) continue;
            const due = Math.min(r.deadline, ...plan.filter((m) => m.lost !== undefined && m.lost !== null).map((m) => m.lost));
            out.push({ ...r, key: k, plan, now, due });
        }
        return out.sort((a, b) => a.due - b.due || a.plan.length - b.plan.length);
    }

    /** The next hint: the row the last hint served while it stays open (the next rung, at most the fourth), or else the
     *  open row with the nearest deadline at the first rung. → {row, rung, fresh} or null (nothing open). */
    next({ skip = null } = {}) {
        const open = this.open({ skip });
        if (!open.length) return null;
        const last = this.g.hintLog.at(-1);
        const same = last && open.find((r) => r.thought === last.thought && r.family === last.family);
        if (same) return { row: same, rung: Math.min(last.rung + 1, 4), fresh: false };
        return { row: open[0], rung: 1, fresh: true };
    }

    /** Take the next hint: logged, and its parts (`rung`). → parts or null. */
    take({ at = null, skip = null } = {}) {
        const n = this.next({ skip });
        if (!n) return null;
        this.g.logHint(n.row.thought, n.row.family, n.rung, at);
        return this.parts(n.row, n.rung, n.fresh);
    }

    /**
     * What a hint on row `r` says up to `rung` (each rung adds to the ones before):
     *   where: [paragraphs]   the read paragraphs holding what it still needs (or the cards its next step uses)
     *   kind:  {family, op, about, steps}   the next step's move, what its conclusion is about (a build), how many steps
     *   which: {op, cards: [{card} held | {words, para} to click | {ask, words?, para?} to ask about | {build: true}], move}
     *   moves: [the moves, in order]   the fourth rung: what Do it makes (those that can be made now)
     */
    parts(r, rung, fresh = false) {
        const g = this.g;
        const plan = r.now ?? this.ready(this.plan(r));
        const step = plan.find((m) => !['collect', 'ask'].includes(m.op)) ?? plan.at(-1);
        const out = { thought: r.thought, family: r.family, rung, fresh };
        const collects = plan.filter((m) => m.op === 'collect');
        const placed = (c) => (g.knows(c) && g.model.cards.get(c)?.section !== 'rules' ? g.unlocked.get(c).para : null);
        let where = collects.length ? collects.map((m) => m.from) : step.wants.map(placed).filter((p) => p !== null);
        if (!where.length) where = [step.at];
        out.where = [...new Set(where)].sort((a, b) => a - b);
        if (rung >= 2) out.kind = { family: r.family, op: step.op, about: step.about ?? null, steps: plan.filter((m) => !['collect', 'ask'].includes(m.op)).length };
        if (rung >= 3) out.which = { op: step.op, cards: step.wants.filter((c) => g.model.cards.has(c)).map((c) => this.#how(c, step, plan)), move: this.#bare(step) };
        if (rung >= 4) out.moves = plan;
        return out;
    }

    /** How the player gets card `c` for the next step: held, words to click, a card to ask about, or a build first
     *  (from the move it came from in the minimal playthrough, `src`, else a move of the plan that gives it). */
    #how(c, step, plan) {
        const g = this.g;
        if (g.knows(c)) return { card: c };
        const collect = (id) => plan.find((m) => m.op === 'collect' && m.card === id);
        const click = (m) => ({ words: m.words, para: m.from, section: g.model.cards.get(c)?.section ?? null });
        const p = plan.find((m) => m.seq === step.src[c])
            ?? collect(c)
            ?? plan.find((m) => m.op === 'build' && m.inference === c)
            ?? plan.find((m) => m.op === 'ask' && ((m.got ?? []).includes(c) || (g.rulesOn.get(m.card) ?? []).includes(c)));
        if (p?.op === 'collect') return click(p);
        if (p?.op === 'build') return { build: true };
        if (p?.op === 'ask') {
            if (g.knows(p.card)) return { ask: p.card };
            const cc = collect(p.card);
            return cc ? { ask: null, ...click(cc) } : { ask: null };
        }
        return { missing: true };
    }

    /** The next step as the third rung may show it besides its cards (those are the rung's `cards`, each held or named by
     *  how to get it; what a build concludes comes with the fourth): what kind of conclusion, which exception, the check's
     *  fields and expected result, the drop's target and reason, the absence's time, a candidate or a theory. A card not yet
     *  held is not named. */
    #bare(m) {
        const keep = ['seq', 'op', 'at', 'thought', 'about', 'exception', 'n', 'check', 'verb', 'fields', 'expect', 'answer', 'target', 'reason', 'rival', 'time', 'slot', 'value', 'label', 'assignment'];
        // A card not yet held is not named (null): the rung's `cards` say how to get it.
        const mask = (v) => (typeof v === 'string' ? (this.g.model.cards.has(v) && !this.g.knows(v) ? null : v)
            : Array.isArray(v) ? v.map(mask) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, mask(x)])) : v);
        return Object.fromEntries(keep.filter((k) => m[k] !== undefined).map((k) => [k, mask(m[k])]));
    }
}
