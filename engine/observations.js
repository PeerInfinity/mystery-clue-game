// Observations (docs/ideas.md, "Observations and open questions"): the player points out that a timeline entry is
// relevant to an open question, and the game fills in what that entry shows about it. An observation is data, hidden
// until linked: `{id, q, from: [entry], says, essential?, against?: [possibility], if?: {q, pick}}`.
// An entry in `from` is a fact's id, or `{route_through: [things]}` for a route the player has built through them, or
// `{doubted: id}` for a statement (a telling, or a claim) the player has linked and no longer believes: a lie as
// evidence. Whether it is doubted is the page's to say (`ctx.doubted(id)`: what it carried that is false is off the
// timeline).

const matches = (from, e, ctx) => (typeof from === 'string' ? e.id === from
    : from.doubted ? e.id === from.doubted && !!ctx.doubted?.(e.id)
    : e.attr === 'route' && from.route_through.every((n) => e.value.includes(n)));

/**
 * What the player's links give, from the entries on the timeline (`known`). An observation is filled when every entry
 * it comes from is on the timeline and linked to its question; it goes if one of them leaves the timeline. `if`: only
 * with that answer of another question circled (`marks`: `{question: {possibility: mark}}`), for what depends on how
 * a clue is read. A link that fills nothing stays as the player's note.
 */
export function fill(observations, links, known, marks = {}, ctx = {}) {
    const entry = (id) => known.find((e) => e.id === id);
    const used = new Set();
    const filled = [];
    for (const o of observations) {
        const mine = links.filter((l) => l.q === o.q && entry(l.entry));
        const hits = o.from.map((f) => mine.find((l) => matches(f, entry(l.entry), ctx)));
        if (hits.some((h) => !h)) continue;
        if (o.if && marks[o.if.q]?.[o.if.pick] !== 'circled') continue;
        hits.forEach((h) => used.add(h));
        filled.push({ obs: o, entries: hits.map((h) => entry(h.entry)), says: o.says });
    }
    const notes = links.filter((l) => entry(l.entry) && !used.has(l));
    return { filled, notes };
}

/** For one question: what its essential observations are and which of them the player's description still lacks. */
export function described(observations, q, filled) {
    const all = observations.filter((o) => o.q === q && o.essential);
    const missing = all.filter((o) => !filled.some((x) => x.obs === o)).map((o) => o.says);
    return { any: all.length > 0, done: all.length > 0 && !missing.length, missing };
}
