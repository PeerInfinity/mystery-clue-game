// Plain readings of the case's logic. Every clue is a small formula over the case's questions (engine/logic.js);
// these read one back in words ("The true identity of William Derbyshire is not John Straker."), and turn a
// replayed clash (Problem.steps) into lines to show. Shared by the game, which names only what the player has
// met, and the logic viewer, which names everything.
//
// ctx: {model, knows(id), offered(slot, v), nameOf(id), promptOf(slot), cardName(id), valueName(slot, v)}

export function makeReadings({ model, knows, offered, nameOf, promptOf, cardName, valueName }) {
    const NOT_MET = 'one the story has not brought up yet';
    const lowerArticle = (n) => n.replace(/^(The|A|An) /, (a) => a.toLowerCase());
    const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    /** A card's name mid-sentence, or a stand-in for one the player has not met (nothing leaks). */
    function heldName(id) {
        if (model.cards.has(id) && !knows(id)) return NOT_MET;
        return lowerArticle(cardName(id));
    }
    function valueText(slot, v) {
        if (model.cards.has(v) && !knows(v) && !model.slots.get(slot)?.labels?.[v]) return NOT_MET;
        if (model.windows.some((w) => w.id === v)) {
            if (slot && !offered(slot, v)) return 'a time the story has not reached yet';
            // "Years before", "Race day" mid-sentence; a day's name keeps its capital.
            return cardName(v).replace(/^([A-Z])(?![a-z]*day\b)/, (ch) => ch.toLowerCase());
        }
        // An answer's own label ("For early exercise") reads mid-sentence in lower case; a name keeps its capitals.
        if (model.slots.get(slot)?.labels?.[v]) return valueName(slot, v).replace(/^[A-Z](?=[a-z ])/, (ch) => ch.toLowerCase());
        return lowerArticle(valueName(slot, v));
    }
    const FACET_SUBJECT = {
        agent: (e) => `the one who did “${e}”`,
        patient: (e) => `the one “${e}” was done to`,
        time: (e) => `the time of “${e}”`,
        place: (e) => `the place of “${e}”`,
        object: (e) => `the thing involved in “${e}”`,
        instrument: (e) => `what “${e}” was done with`,
        recipient: (e) => `the one “${e}” was for`,
        purpose: (e) => `the purpose of “${e}”`,
        identity: (n) => `the true identity of ${n}`,
        owner: (n) => `the owner of ${n}`,
        contents: (n) => `the contents of ${n}`,
        whereabouts: (n) => `where ${n} has been`,
        motive: (n) => `the motive of ${n}`,
    };
    const EVENT_FACETS = new Set(['agent', 'patient', 'time', 'place', 'object', 'instrument', 'recipient', 'purpose']);
    // Several facts about one event read as one line: "“Heavy rain”: at Dartmoor, Tuesday, 1 a.m.".
    const EVENT_PART = { agent: 'done by', patient: 'done to', object: 'involving', instrument: 'done with', recipient: 'for', place: 'at', time: '', purpose: 'purpose:' };
    const EVENT_ORDER = ['agent', 'patient', 'object', 'instrument', 'recipient', 'place', 'time', 'purpose'];
    /** One fact about an event, as a phrase for its line ("done by John Straker", "not at the hollow"), or null. */
    function eventPart(f) {
        const op = Object.keys(f)[0];
        if (!['eq', 'ne', 'in', 'nin'].includes(op)) return null;
        const [slotId, val] = f[op];
        const sl = model.slots.get(slotId);
        if (!sl || !EVENT_FACETS.has(sl.facet) || model.cards.get(sl.on)?.section !== 'events') return null;
        const vals = [...new Set((Array.isArray(val) ? val : [val]).map((v) => valueText(slotId, v)))];
        const neg = op === 'ne' || op === 'nin';
        const lead = EVENT_PART[sl.facet];
        const body = vals.length > 1 ? `${sl.facet === 'time' ? 'some time from ' : ''}${orList(vals, neg ? 'nor' : 'or')}` : vals[0];
        return { on: sl.on, facet: sl.facet, text: `${neg ? (vals.length > 1 ? 'neither ' : 'not ') : ''}${lead ? `${lead} ` : ''}${body}` };
    }

    /** A question as the subject of a sentence: "the owner of the milliner's bill". */
    function subjectOf(slotId) {
        const sl = model.slots.get(slotId);
        const on = sl.on;
        const known = knows(on);
        const isEvent = model.cards.get(on)?.section === 'events';
        const name = known ? (isEvent ? nameOf(on) : heldName(on)) : 'something not yet told';
        if (FACET_SUBJECT[sl.facet] && isEvent === EVENT_FACETS.has(sl.facet)) return FACET_SUBJECT[sl.facet](name);
        return `the answer to “${promptOf(slotId)}”`;
    }
    /** "X is Y", with yes/no questions and a statement's truth read naturally. */
    function isPhrase(slotId, v, negated = false) {
        const sl = model.slots.get(slotId);
        if (sl.facet === 'truth') {
            const text = knows(sl.on) ? `“${cardName(sl.on)}”` : 'a statement not yet met';
            return `${text} is ${(v === 'true') !== negated ? 'true' : 'false'}`;
        }
        if (sl.domain.length === 2 && sl.domain.includes('true')) return `“${promptOf(slotId)}” — ${(v === 'true') !== negated ? 'yes' : 'no'}`;
        return `${subjectOf(slotId)} is ${negated ? 'not ' : ''}${valueText(slotId, v)}`;
    }
    const orList = (xs, word = 'or') => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${word} ${xs[xs.length - 1]}`);
    function reading(f) {
        const op = Object.keys(f)[0];
        const a = f[op];
        const term = (x) => (typeof x === 'string' ? subjectOf(x) : valueText(null, x.lit));
        switch (op) {
            case 'true': return 'always so';
            case 'false': return 'never so';
            case 'eq': return isPhrase(a[0], a[1]);
            case 'ne': return isPhrase(a[0], a[1], true);
            case 'in': return `${subjectOf(a[0])} is ${orList([...new Set(a[1].map((v) => valueText(a[0], v)))])}`;
            case 'nin': return `${subjectOf(a[0])} is not ${orList([...new Set(a[1].map((v) => valueText(a[0], v)))])}`;
            case 'same': return `${subjectOf(a[0])} is the same as ${subjectOf(a[1])}`;
            case 'diff': return `${subjectOf(a[0])} is not the same as ${subjectOf(a[1])}`;
            case 'before': return `${term(a[0])} comes before ${term(a[1])}`;
            case 'not_after': return `${term(a[0])} comes no later than ${term(a[1])}`;
            case 'and': {
                // Facts about the same event gather into one line; the rest read as they are.
                const lines = [];
                const byEvent = new Map();
                for (const g of a) {
                    const part = eventPart(g);
                    if (!part) { lines.push(reading(g)); continue; }
                    if (!byEvent.has(part.on)) { byEvent.set(part.on, []); lines.push(part.on); }
                    byEvent.get(part.on).push(part);
                }
                return lines.map((x) => {
                    const parts = byEvent.get(x);
                    if (!parts) return x;
                    if (parts.length === 1) return reading(a.find((g) => eventPart(g)?.on === x));
                    parts.sort((p, q) => EVENT_ORDER.indexOf(p.facet) - EVENT_ORDER.indexOf(q.facet));
                    return `“${knows(x) ? nameOf(x) : 'something not yet told'}”: ${parts.map((p) => p.text).join(', ')}`;
                }).map((t, i, all) => (i < all.length - 1 && !t.endsWith('.') ? `${t}.` : t)).join(' ');
            }
            case 'or': return `either ${a.map(reading).join(', or ')}`;
            case 'not': return `it is not so that ${reading(a)}`;
            case 'implies': return `if ${reading(a[0])}, then ${reading(a[1])}`;
        }
        return '?';
    }
    const readingOf = (f) => reading(f).split('. ').map(cap).join('. ').replace(/([^.])$/, '$1.');

    /**
     * A replayed clash (Problem.steps) as lines to show: for each step, what it narrowed that is worth saying — what
     * empties a question, or what a later step builds on; failing that, the step's plainest effect, so no step
     * reads as doing nothing. Returns {suppose: [text], lines: [{id, says: [{text, bad}]}], unused: [ids]}.
     */
    function chainLines(ids, { steps, contradiction }, fixed = {}) {
        const later = (i, slot) => steps.slice(i + 1).some((st) => st.changes.some((c) => c.slot === slot));
        const say = (c) => {
            const removed = c.before.filter((v) => !c.after.includes(v));
            if (!c.after.length) {
                return c.before.length === 1
                    ? { text: `${isPhrase(c.slot, c.before[0], true)}: but that was the only possibility left`, bad: true }
                    : { text: `none of the possibilities left for ${subjectOf(c.slot)} will do`, bad: true };
            }
            if (c.after.length === 1) return { text: isPhrase(c.slot, c.after[0]) };
            const named = (vs) => [...new Set(vs.map((v) => valueText(c.slot, v)))];
            if (removed.length <= 3) return { text: `${subjectOf(c.slot)} is not ${orList(named(removed))}` };
            if (c.after.length <= 8) return { text: `${subjectOf(c.slot)} is ${orList(named(c.after))}` };
            return { text: `${subjectOf(c.slot)} has ${c.after.length} possibilities left` };
        };
        const plain = (c) => (c.after.length === 1 ? 2 : c.before.length - c.after.length <= 3 ? 1 : c.after.length <= 8 ? 0.75 : 0) - (model.slots.get(c.slot).facet === 'time' ? 0.5 : 0);
        const pick = (i, st) => {
            const key = st.changes.filter((c) => !c.after.length || (later(i, c.slot) && plain(c) > 0));
            if (key.length) return key;
            const best = [...st.changes].sort((x, y) => plain(y) - plain(x))[0];
            return best && plain(best) > 0 ? [best] : [];
        };
        return {
            suppose: Object.entries(fixed).map(([slot, v]) => `Suppose ${isPhrase(slot, v)}.`),
            lines: steps.map((st, i) => ({ id: st.id, says: pick(i, st).map(say) })),
            unused: ids.filter((id) => !steps.some((st) => st.id === id)),
            contradiction,
        };
    }

    return { reading, readingOf, subjectOf, isPhrase, valueText, orList, chainLines };
}
