// Observations (docs/ideas.md, "Observations and open questions"): the player points out that a timeline entry is
// relevant to an open question, and the game fills in what that entry shows about it. An observation is data, hidden
// until linked: `{id, q, from: [entry], says, essential?, against?: [possibility], if?: {q, pick}}`.
// An entry in `from` is a fact's id, or `{route_through: [things]}` for a route the player has built through them, or
// `{doubted: id}` for a statement (a telling, or a claim) the player has linked and no longer believes: a lie as
// evidence. Whether it is doubted is the page's to say (`ctx.doubted(id)`: what it carried that is false is off the
// timeline). Or `{reasoned: move, premises: [ids]}` for the entry a move of the player's puts on the timeline:
// "changed" (It changed, from two states, in either order) or "got_through" (Something got through, from a crossing),
// so that an author can make that move necessary; or `{reasoned: "missing", of: rule, at: time}` for "Something is
// missing here" (a gap in the rule's series at that time), named by its rule and its time, since what else it rests
// on (the record) is what the timeline holds. Or `{solved: q}`: question q is solved (`ctx.solved(q)`), a larger
// question's evidence that fills by itself, with no link for the player to make. Or `{any: [ids]}`: any one of those
// facts, for entries that show the same thing equally (three passes alike, three entries of one book): the link of
// any of them fills it, and the others are evidence too (a checked link of one is kept, not refused). A premise of
// a `reasoned` entry can be `{any: [ids]}` in the same way: the move made from any one of them is the entry.

/** The moves whose entries an observation can name, by the name it uses: the move's code in `reasoned.move`. */
export const REASONED_MOVES = { changed: 'a', got_through: 'g', missing: 'm' };
// A premise named by an observation is a fact's id, or `{any: [ids]}` for any one of several alike.
const alts = (p) => (typeof p === 'string' ? [p] : p.any);
const samePremises = (a, b) => a.length === b.length && b.every((p) => a.some((x) => alts(p).includes(x)));

const matches = (from, e, ctx) => (typeof from === 'string' ? e.id === from
    : from.any ? from.any.includes(e.id)
    : from.solved ? false
    : from.doubted ? e.id === from.doubted && !!ctx.doubted?.(e.id)
    : from.reasoned === 'missing' ? e.reasoned?.move === 'm' && e.rule === from.of && e.gap === from.at
    : from.reasoned ? e.reasoned?.move === REASONED_MOVES[from.reasoned] && samePremises(e.reasoned.premises ?? [], from.premises ?? [])
    : e.attr === 'route' && from.route_through.every((n) => e.value.includes(n)));

/**
 * What the player's links give, from the entries on the timeline (`known`). An observation is filled when every entry
 * it comes from is on the timeline and linked to its question; it goes if one of them leaves the timeline. `if`: only
 * with that answer of another question circled (`marks`: `{question: {possibility: mark}}`), for what depends on how
 * a clue is read. `partial`: the observations from several entries that are begun (some linked, not all), with the
 * entries linked, so the page can say that something is still missing. A link that does neither stays as a note.
 */
export function fill(observations, links, known, marks = {}, ctx = {}) {
    const entry = (id) => known.find((e) => e.id === id);
    const used = new Set();
    const filled = [];
    for (const o of observations) {
        const mine = links.filter((l) => l.q === o.q && entry(l.entry));
        const hits = o.from.map((f) => (f.solved ? (ctx.solved?.(f.solved) ? { solved: f.solved } : null) : mine.find((l) => matches(f, entry(l.entry), ctx))));
        if (hits.some((h) => !h)) continue;
        if (o.if && marks[o.if.q]?.[o.if.pick] !== 'circled') continue;
        hits.filter((h) => !h.solved).forEach((h) => used.add(h));
        filled.push({ obs: o, entries: hits.map((h) => (h.solved ? { id: `solved:${h.solved}`, solved: h.solved } : entry(h.entry))), says: o.says });
    }
    // Begun: an observation from more than one entry, some of them linked, not all (and, with `if`, its reading
    // circled); or one whose statement is linked and only partly disbelieved (`ctx.partlyDoubted(id)`: some of what
    // it carried that is false is off the timeline, not all). The links say that something is still missing, not what.
    const partial = [];
    const half = (f, e) => !!f.doubted && e.id === f.doubted && !!ctx.partlyDoubted?.(e.id);
    for (const o of observations) {
        if (filled.some((x) => x.obs === o)) continue;
        if (o.if && marks[o.if.q]?.[o.if.pick] !== 'circled') continue;
        const mine = links.filter((l) => l.q === o.q && entry(l.entry));
        const halves = o.from.map((f) => mine.find((l) => half(f, entry(l.entry)))).filter(Boolean);
        if (o.from.length < 2 && !halves.length) continue;
        const hits = [...o.from.filter((f) => !f.solved).map((f) => mine.find((l) => matches(f, entry(l.entry), ctx))).filter(Boolean), ...halves];
        if (!hits.length) continue;
        hits.forEach((h) => used.add(h));
        partial.push({ obs: o, entries: hits.map((h) => entry(h.entry)), of: o.from.length });
    }
    const notes = links.filter((l) => entry(l.entry) && !used.has(l));
    return { filled, partial, notes };
}

/** For one question: what its essential observations are and which of them the player's description still lacks. */
/**
 * Whether an entry is evidence for a question at all: it is one of the entries some observation of `q` comes from,
 * whatever else that observation waits for (the rest of its entries, the statement disbelieved, a reading circled,
 * the entry trusted enough to be on the timeline, a reasoning move made from it). What a checked link is judged by: such a link is kept, any other
 * is refused.
 */
// A premise of a reasoning move an observation comes from is evidence too, waiting for the move: the two states of
// "It changed", the crossing of "Something got through", the rule of "Something is missing here" and the entries of
// its record (`e.series`).
const couldMatch = (from, e) => (typeof from === 'string' ? e.id === from
    : from.any ? from.any.includes(e.id)
    : from.solved ? false
    : from.doubted ? e.id === from.doubted
    : from.reasoned === 'missing' ? matches(from, e, {}) || e.id === from.of || e.series === from.of
    : from.reasoned ? matches(from, e, {}) || (from.premises ?? []).some((p) => alts(p).includes(e.id))
    : matches(from, e, {}));
export const bears = (observations, q, e) => observations.some((o) => o.q === q && o.from.some((f) => couldMatch(f, e)));
/** Whether something that entry is evidence for is still not shown (`filled`: what `fill` gave): the link waits. */
export const waits = (observations, q, e, filled) => observations.some((o) => o.q === q && o.from.some((f) => couldMatch(f, e)) && !filled.some((x) => x.obs === o));

/**
 * Whether a question's required evidence is on the page yet, whatever is linked: `{all, here}`, the essential
 * observations of `q` and those of them whose entries the reader has (`has(id)`: the fact is given by what was read).
 * An entry that is the player's own move counts by its premises (a gap or a route, which have none named: as here),
 * and "question solved" counts as here: what a question rests on is told apart from what has not come yet.
 */
export function onPage(observations, q, has) {
    const all = observations.filter((o) => o.q === q && o.essential);
    const there = (f) => (typeof f === 'string' ? has(f) : f.any ? f.any.some(has) : f.solved ? true : f.doubted ? has(f.doubted) : f.reasoned && f.premises ? f.premises.every((p) => alts(p).some(has)) : true);
    return { all: all.length, here: all.filter((o) => o.from.every(there)).length };
}

export function described(observations, q, filled) {
    const all = observations.filter((o) => o.q === q && o.essential);
    const missing = all.filter((o) => !filled.some((x) => x.obs === o)).map((o) => o.says);
    return { any: all.length > 0, done: all.length > 0 && !missing.length, missing };
}
