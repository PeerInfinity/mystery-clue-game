// A story told from its typed data (2026-11-25; docs/authored-stories.md, finding 137): one plain sentence for each
// typed entry, by a template for its form, in the order a telling gives. Nothing here is written for a case: what a
// sentence says is the entry's subject, attribute, value and time, the names of the entities, the labels of the
// times and, for a deed, the past form of its act (`past` in the action table). What an entry's free text adds
// (`detail`) is not told. The narrator is "I". No DOM: used by scripts/tell-story.mjs.

const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * `ctx`: {narrator, name(id), time(id): label, act(id): {label, past}, question(id)}.
 * Returns the tellers: `sentence(fact)`, `deed(question)`, `prefix(time)`, and `said(fact)` (what a `says` entry's
 * value is, in the third person, for the page's own line).
 */
export function teller(ctx) {
    const me = (id) => id === ctx.narrator;
    const subj = (id) => (me(id) ? 'I' : ctx.name(id));
    const obj = (id) => (me(id) ? 'me' : ctx.name(id));
    const state = (x, be = 'was') => {
        const not = x.neg ? ' not' : '';
        if (x.attr === 'location') return `${subj(x.of)} ${be}${not} at ${ctx.name(x.value)}`;
        if (x.attr === 'carrying') return x.neg ? `${subj(x.of)} ${be} without ${x.value}` : `${subj(x.of)} had ${x.value}`;
        return `${subj(x.of)} ${be}${not} ${x.value}`;   // a condition, or any state whose value reads after "was"
    };
    /** What is wanted, in the wanter's words: "X to be V", and what that needs. */
    const want = (g) => `${ctx.name(g.of)} to be ${g.value}${list(g.needs).map((n) => `, and for that ${ctx.name(n.of)} must${n.neg ? ' not' : ''} be ${n.value}`).join('')}`;
    const done = (a, who) => `${who} ${ctx.act(list(a.act)[0]).past} ${ctx.name(a.thing ?? a.item)}${a.where ? ` at ${ctx.name(a.where)}` : ''}`;
    const owns = (f) => list(f.asserts).find((x) => x.q && x.pick === f.of);
    function said(f) {
        if (f.goal) return `wants ${want(f.goal)}`;
        const o = owns(f);
        if (o) { const e = ctx.question(o.q).entry; return `owns to ${ctx.act(list(e.act)[0]).label} ${ctx.name(e.thing ?? e.item)}`; }
        return f.value;
    }
    function sentence(f) {
        if (f.attr === 'role') return me(f.of) ? `I am ${ctx.name(f.of)}, ${f.value}` : `${ctx.name(f.of)} is ${f.value}`;
        if (f.attr === 'says') {
            const to = f.to ? ` to ${obj(f.to)}` : '';
            // In a speaker's own words what is theirs by name is "my" ("Abel Crouch's marrow", said by Abel Crouch).
            const mine = (s) => (me(f.of) ? s : s.split(`${ctx.name(f.of)}'s `).join('my '));
            if (f.goal) return `${subj(f.of)} said${to}: "I want ${mine(want(f.goal))}."`;
            const o = owns(f);
            if (o) { const e = ctx.question(o.q).entry; return `${subj(f.of)} said${to}: "It was I who ${mine(done(e, '').trim())}."`; }
            return `${subj(f.of)} said${to}: "${f.value}."`;
        }
        if (f.attr === 'action' && list(f.act).length) return done(f, subj(f.of));
        const gains = list(f.gives).map((g) => `; by that ${obj(g.to)} gained ${g.what}`).join('');
        return state(f) + gains;
    }
    /** The deed a question asks about, its doer unknown. */
    const deed = (q) => done(q.entry, 'somebody');
    /** How a sentence at a time begins ("On Monday, "); a state that held from before has none. */
    const prefix = (t) => (t?.at ? `On ${ctx.time(t.at)}, ` : '');
    return { sentence, deed, prefix, said, cap };
}
