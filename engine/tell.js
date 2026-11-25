// A story told from its typed data (2026-11-25; docs/authored-stories.md, findings 137 and 139): one plain sentence
// for each typed entry, by a template for its form, in the order a telling gives. Nothing here is written for a
// case: what a sentence says is the entry's subject, attribute, value and time, the names of the entities, the
// labels of the times and, for a deed, the past form of its act (`past` in the case's action table, or below for the
// engine's own acts). What an entry's free text adds (`detail`) is not told. Whoever speaks is "I": the narrator in
// the story's own sentences, a witness in what the witness says. No DOM: used by scripts/tell-story.mjs.

const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** The past forms of the engine's own acts (engine/actions.js), for a deed told. */
export const PAST = { take: 'took', take_locked: 'took', give: 'gave', make: 'made', hide: 'hid', open: 'opened', lock: 'locked', unlock: 'unlocked' };

/**
 * `ctx`: {speaker (who is "I"), listener (who is "you", or null), name(id), act(id): {label, past}, question(id)}.
 * Returns `sentence(fact)`, `deed(question)` and `said(fact)` (what a `says` entry's value is, in the third person,
 * for the page's own line).
 */
export function teller(ctx) {
    const me = (id) => id === ctx.speaker, you = (id) => ctx.listener != null && id === ctx.listener;
    const subj = (id) => (me(id) ? 'I' : you(id) ? 'you' : ctx.name(id));
    const obj = (id) => (me(id) ? 'me' : you(id) ? 'you' : ctx.name(id));
    // In a speaker's own words what is theirs by name is "my" ("Abel Crouch's marrow", said by Abel Crouch).
    const mine = (who, s) => s.split(`${ctx.name(who)}'s `).join('my ');
    const past = (a) => ctx.act(list(a.act)[0])?.past ?? PAST[list(a.act)[0]] ?? `did the ${ctx.act(list(a.act)[0])?.label ?? list(a.act)[0]} of`;
    const state = (x, be = 'was') => {
        const not = x.neg ? ' not' : '';
        if (x.attr === 'location') return `${subj(x.of)} ${be}${not} at ${ctx.name(x.value)}`;
        if (x.attr === 'lives_at') return `${subj(x.of)} ${me(x.of) ? 'live' : 'lives'} at ${ctx.name(x.value)}`;   // a standing state, as a role is
        if (x.attr === 'owner') return `${subj(x.of)} ${x.neg ? 'did not belong' : 'belonged'} to ${obj(x.value)}`;
        if (x.attr === 'carrying') return x.neg ? `${subj(x.of)} ${be} without ${ctx.name(x.value)}` : `${subj(x.of)} had ${ctx.name(x.value)}`;
        return `${subj(x.of)} ${be}${not} ${x.value}`;   // a condition, a door's state, or any state whose value reads after "was"
    };
    /** What is wanted, in the wanter's words: "X to be V", and what that needs. */
    const want = (g) => `${ctx.name(g.of)} to be ${g.value}${list(g.needs).map((n) => `, and for that ${ctx.name(n.of)} must${n.neg ? ' not' : ''} be ${n.value}`).join('')}`;
    const done = (a, who) => `${who} ${past(a)} ${ctx.name(a.thing ?? a.item)}${a.to ? ` to ${obj(a.to)}` : ''}${a.where ? ` ${list(a.act)[0].startsWith('take') ? 'from' : 'at'} ${ctx.name(a.where)}` : ''}`;
    const owns = (f) => list(f.asserts).find((x) => x.q && x.pick === f.of);
    function said(f) {
        if (f.goal) return `wants ${want(f.goal)}`;
        const o = owns(f);
        if (o) { const e = ctx.question(o.q).entry; return `owns to ${ctx.act(list(e.act)[0])?.label ?? `the ${list(e.act)[0]}`} ${ctx.name(e.thing ?? e.item)}`; }
        return f.value;
    }
    function sentence(f) {
        let s;
        if (f.attr === 'role') s = me(f.of) ? `I am ${ctx.name(f.of)}, ${f.value}` : `${ctx.name(f.of)} is ${f.value}`;
        else if (f.attr === 'says') {
            const to = f.to ? ` to ${obj(f.to)}` : '';
            if (f.goal) return `${subj(f.of)} said${to}: "I want ${mine(f.of, want(f.goal))}."`;
            const o = owns(f);
            if (o) { const e = ctx.question(o.q).entry; return `${subj(f.of)} said${to}: "It was I who ${mine(f.of, done(e, '').trim())}."`; }
            return `${subj(f.of)} said${to}: "${f.value}."`;
        } else if (f.attr === 'action' && list(f.act).length) s = done(f, subj(f.of));
        else s = state(f) + list(f.gives).map((g) => `; by that ${obj(g.to)} gained ${g.what}`).join('');
        return ctx.speaker ? mine(ctx.speaker, s) : s;
    }
    /** The deed a question asks about, its doer unknown. */
    const deed = (q) => done(q.entry, 'somebody');
    return { sentence, deed, said };
}
