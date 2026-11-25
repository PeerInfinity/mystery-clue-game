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
/** The names of several, as a list: "A", "A and B", "A, B and C". */
const listed = (xs, and = 'and') => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${and} ${xs.at(-1)}`);

/**
 * `ctx`: {speaker (who is "I"), listener (who is "you", or null), name(id), act(id): {label, past}, question(id)}.
 * Returns `sentence(fact)`, `deed(question)` and `said(fact)` (what a `says` entry's value is, in the third person,
 * for the page's own line).
 */
export function teller(ctx) {
    const me = (id) => id === ctx.speaker, you = (id) => ctx.listener != null && id === ctx.listener;
    const subj = (id) => (id === '?' ? 'somebody' : me(id) ? 'I' : you(id) ? 'you' : ctx.name(id));
    // A statement about everyone (`of: "*"`, `but`): "nobody but A and B" for a denial, "everyone but …" otherwise; told without its own "not".
    const everyone = (x) => `${x.neg ? 'nobody' : 'everyone'}${list(x.but).length ? ` but ${listed(list(x.but).map(obj))}` : ''}`;
    const obj = (id) => (me(id) ? 'me' : you(id) ? 'you' : ctx.name(id));
    // In a speaker's own words what is theirs by name is "my" ("Abel Crouch's marrow", said by Abel Crouch).
    const mine = (who, s) => s.split(`${ctx.name(who)}'s `).join('my ');
    const past = (a) => ctx.act(list(a.act)[0])?.past ?? PAST[list(a.act)[0]] ?? `did the ${ctx.act(list(a.act)[0])?.label ?? list(a.act)[0]} of`;
    const state = (x, be = 'was') => {
        if (x.of === '*') { const who = everyone(x); return x.attr === 'location' ? `${who} ${be} at ${ctx.name(x.value)}` : x.attr === 'carrying' ? `${who} had ${ctx.name(x.value)}` : `${who} ${be} ${x.value}`; }
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
        const a = list(f.asserts).find((x) => x.q && x.pick != null);
        if (a) return `says it was ${a.pick}`;
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
            // An answer that is not a person, asserted: "It was after the gate lamp was lit."
            const a = list(f.asserts).find((x) => x.q && x.pick != null);
            // "Yes" or "no" asserted is the state that answer stands for (the other's, denied, where only one is typed), in the speaker's own person.
            if (a && (a.pick === 'yes' || a.pick === 'no')) {
                const ps = ctx.question(a.q).possibilities, own = list(ps.find((p) => p.value === a.pick)?.asserts), twin = list(ps.find((p) => p.value === (a.pick === 'yes' ? 'no' : 'yes'))?.asserts);
                const x = own[0] ?? (twin[0] ? { ...twin[0], neg: !twin[0].neg } : null);
                if (x) { const inner = teller({ ...ctx, speaker: f.of }); return `${subj(f.of)} said${to}: "${cap(`${ctx.prefix?.(x.time) ?? ''}${mine(f.of, inner.sentence(x))}`)}."`; }
            }
            if (a) return `${subj(f.of)} said${to}: "It was ${a.pick}."`;
            return `${subj(f.of)} said${to}: "${f.value}."`;
        } else if (f.attr === 'action' && list(f.act).length) s = done(f, subj(f.of));
        else s = state(f) + list(f.gives).map((g) => `; by that ${obj(g.to)} gained ${g.what}`).join('');
        return ctx.speaker ? mine(ctx.speaker, s) : s;
    }
    /** The deed a question asks about, its doer unknown. */
    const deed = (q) => done(q.entry, 'somebody');
    return { sentence, deed, said };
}
