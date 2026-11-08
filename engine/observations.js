// Observations (docs/ideas.md, "Observations and open questions"): the player points out that a timeline entry is
// relevant to an open question, and the game fills in what that entry shows about it. An observation is data, hidden
// until linked: `{id, q, from: [entry], says | readings: [{says, essential?}], essential?, against?: [possibility]}`.
// An entry in `from` is a fact's id, or `{route_through: [things]}` for a route the player has built through them.

const matches = (from, e) => (typeof from === 'string' ? e.id === from : e.attr === 'route' && from.route_through.every((n) => e.value.includes(n)));

/**
 * What the player's links give, from the entries on the timeline (`known`). An observation is filled when every entry
 * it comes from is on the timeline and linked to its question; it goes if one of them leaves the timeline. A link the
 * data does not know stays as the player's note. `readings`: `{observation id: index}`, the player's choice between
 * two readings the story puts forward.
 */
export function fill(observations, links, known, readings = {}) {
    const entry = (id) => known.find((e) => e.id === id);
    const used = new Set();
    const filled = [];
    for (const o of observations) {
        const mine = links.filter((l) => l.q === o.q && entry(l.entry));
        const hits = o.from.map((f) => mine.find((l) => matches(f, entry(l.entry))));
        if (hits.some((h) => !h)) continue;
        hits.forEach((h) => used.add(h));
        const reading = o.readings ? o.readings[readings[o.id]] ?? null : null;
        filled.push({ obs: o, entries: hits.map((h) => entry(h.entry)), reading, says: o.readings ? reading?.says ?? null : o.says, choose: !!o.readings && !reading });
    }
    const notes = links.filter((l) => entry(l.entry) && !used.has(l));
    return { filled, notes };
}

/** An observation's essential text, or null: it is essential itself, or one of its readings is. */
export const essentialOf = (o) => (o.readings ? o.readings.find((r) => r.essential)?.says ?? null : o.essential ? o.says : null);

/** For one question: what its essential observations are and which of them the player's description still lacks. */
export function described(observations, q, filled) {
    const all = observations.filter((o) => o.q === q && essentialOf(o) != null);
    const have = (o) => filled.some((x) => x.obs === o && x.says === essentialOf(o));
    const missing = all.filter((o) => !have(o)).map(essentialOf);
    return { any: all.length > 0, done: all.length > 0 && !missing.length, missing };
}
