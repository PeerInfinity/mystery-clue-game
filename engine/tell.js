// A story told from its typed data (2026-11-25; docs/authored-stories.md, findings 137, 139 and 150): one plain sentence
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
 * `ctx`: {speaker (who is "I"), listener (who is "you", or null), name(id), act(id): {label, past}, question(id),
 * and optionally kind(id), prep(id) ("in" for a thing something is in; default "at"), plural(id) ("the walls": "were"),
 * fact(id) (for what someone knows), time(id): its label, prefix(time)}.
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
    // And in words said to someone, what is theirs by name is "your" ("George Marlow's notes", said to George Marlow).
    const yours = (who, s) => (who ? s.split(`${ctx.name(who)}'s `).join('your ') : s);
    // Several acts done as one ("unlocked and opened") are told together.
    const past = (a) => list(a.act).map((t) => ctx.act(t)?.past ?? PAST[t] ?? `did the ${ctx.act(t)?.label ?? t} of`).join(' and ');
    const at = (id) => `${ctx.prep?.(id) ?? 'at'} ${ctx.name(id)}`;
    // The arrangement of a room (2026-11-26; finding 150), in the page's own words: what a way in is closed to and lets
    // through (`closed_to: v` stops v and anything larger, so "small" is a person too), what crossed, and a route's links.
    const CLOSED = { person: 'a person', small: 'a person and to anything small', air: 'everything, even air' };
    const PASSES = { person: 'a person', small: 'anything small', air: 'air' };
    const state = (x, be = ctx.plural?.(x.of) ? 'were' : 'was') => {
        if (x.attr === 'closed_to') return `${subj(x.of)} ${be}${x.neg ? ' not' : ''} closed to ${CLOSED[x.value] ?? x.value}`;
        if (x.attr === 'passes') return `${subj(x.of)} ${x.neg ? 'did not let' : 'let'} ${PASSES[x.value] ?? x.value} through`;
        if (x.attr === 'passed') return `${subj(x.of)} crossed ${x.between ? `from ${ctx.name(x.between[0])} to ${ctx.name(x.between[1])}` : `into ${ctx.name(x.value)}`}`;
        if (x.attr === 'attached') return `${subj(x.of)} ${be}${x.neg ? ' not' : ''} fastened to ${ctx.name(x.value)}`;
        if (x.attr === 'near') return `${subj(x.of)} ${be}${x.neg ? ' not' : ''} beside ${ctx.name(x.value)}`;
        if (x.attr === 'reaches') return `${subj(x.of)} ${x.neg ? 'did not reach' : 'reached'} ${ctx.name(x.value)}`;
        if (x.attr === 'fixed') return `${subj(x.of)} ${be}${x.neg ? ' not' : ''} fixed to ${ctx.name(x.value)}`;
        // What someone knows, where it is an entry (`what`): "knew that …", the entry as an onlooker would say it.
        if (x.attr === 'knows' && x.what && ctx.fact?.(x.what)) return `${subj(x.of)} ${x.neg ? 'did not know' : 'knew'} that ${teller({ ...ctx, speaker: null, listener: null }).sentence(ctx.fact(x.what))}`;
        if (x.of === '*') { const who = everyone(x); return x.attr === 'location' ? `${who} ${be} ${at(x.value)}` : x.attr === 'carrying' ? `${who} had ${ctx.name(x.value)}` : `${who} ${be} ${x.value}`; }
        const not = x.neg ? ' not' : '';
        if (x.attr === 'location') return `${subj(x.of)} ${be}${not} ${at(x.value)}`;
        if (x.attr === 'identity') return `${subj(x.of)} ${be}${not} ${obj(x.value)}`;
        if (x.attr === 'wearing') return `${subj(x.of)} ${x.neg ? 'did not wear' : 'wore'} ${ctx.name(x.value)}`;
        if (x.attr === 'made') return `${subj(x.of)} ${be}${not} made`;   // a paper, at the time it says
        if (x.attr === 'lives_at') return `${subj(x.of)} ${me(x.of) ? 'live' : 'lives'} ${at(x.value)}`;   // a standing state, as a role is
        if (x.attr === 'owner') return `${subj(x.of)} ${x.neg ? 'did not belong' : 'belonged'} to ${obj(x.value)}`;
        if (x.attr === 'carrying') return x.neg ? `${subj(x.of)} ${be} without ${ctx.name(x.value)}` : `${subj(x.of)} had ${ctx.name(x.value)}`;
        // A door that is shut is not locked (the engine's three states of a door); a state of a rule's series claimed
        // over a stretch is claimed of every time the rule names; what a state leaves someone unable to do (`cannot`)
        // is the deed of the question that asks about such an act.
        const value = x.attr === 'door' && x.value === 'shut' ? 'shut, and not locked' : x.value;
        const every = ctx.ruled?.(x) && !x.time?.at ? ' at every time the rule names' : '';
        const deed = list(x.cannot).map((t) => ctx.deedOf?.(t)).find(Boolean);
        return `${subj(x.of)} ${be}${not} ${value}${every}${deed ? `, and in no state to be the one who ${done(deed, '').trim()}` : ''}`;   // a condition, a door's state, or any state whose value reads after "was"
    };
    /** What is wanted, in the wanter's words: "X to be V", and what that needs. */
    const want = (g) => `${ctx.name(g.of)} to be ${g.value}${list(g.needs).map((n) => `, and for that ${ctx.name(n.of)} must${n.neg ? ' not' : ''} be ${n.value}`).join('')}`;
    // An act may have nothing it is done to ("died").
    const done = (a, who) => `${who} ${past(a)}${a.thing ?? a.item ? ` ${ctx.name(a.thing ?? a.item)}` : ''}${a.to ? ` to ${obj(a.to)}` : ''}${a.where ? ` ${list(a.act)[0].startsWith('take') ? `from ${ctx.name(a.where)}` : at(a.where)}` : ''}`;
    // A paper's own properties (2026-11-25; finding 145): its date, what it revokes, what it gives to whom, what it speaks of.
    const paper = (f) => {
        if (f.dated) return `${subj(f.of)} was dated ${ctx.time(f.dated)}`;
        // Where its own words are given (`words`), they are told and what they speak of is not: that is the reader's to point out.
        const parts = [f.revokes && `revoked ${ctx.name(f.revokes)}`, list(f.gives).length && `gave ${listed(list(f.gives).map((g) => `${ctx.name(g.what)} to ${obj(g.to)}`))}`, f.speaks_of && !f.words && !f.reads_as && `spoke of ${ctx.name(f.speaks_of.of)} as ${f.speaks_of.value}`].filter(Boolean);
        const said = f.words ? `${parts.length ? ', in these words' : ' said'}: "${f.words}"` : '';
        return parts.length || said ? `${subj(f.of)}${parts.length ? ` ${listed(parts)}` : ''}${said}` : null;
    };
    const owns = (f) => list(f.asserts).find((x) => x.q && x.pick === f.of);
    function said(f) {
        if (f.goal) return `wants ${want(f.goal)}`;
        const o = owns(f);
        if (o && ctx.question(o.q).entry?.attr === 'identity') return `owns to being ${ctx.name(ctx.question(o.q).entry.of)}`;
        if (o) { const e = ctx.question(o.q).entry; return `owns to ${list(e.act).map((t) => ctx.act(t)?.label ?? ctx.label?.(t) ?? `the ${t}`).join(' and ')} ${ctx.name(e.thing ?? e.item)}`; }
        const a = list(f.asserts).find((x) => x.q && x.pick != null);
        if (a && ctx.kind?.(a.pick)) return `says it was ${ctx.name(a.pick)}`;
        if (a) return `says it was ${a.pick}`;
        return f.value;
    }
    function sentence(f) {
        let s;
        // A rule of a regular series (`series: {attr, value, at}`): what is to be so at each of its times.
        if (f.attr === 'rule' && f.series?.at) s = `by rule, ${subj(f.series.of ?? f.of)} was to be ${f.series.value} at ${listed(f.series.at.map((t) => ctx.time(t)))}`;
        else if (f.attr === 'role') s = me(f.of) ? `I am ${ctx.name(f.of)}, ${f.value}` : `${ctx.name(f.of)} is ${f.value}`;
        else if (f.attr === 'says') {
            const to = f.to ? ` to ${obj(f.to)}` : '';
            if (f.goal) return `${subj(f.of)} said${to}: "I want ${mine(f.of, want(f.goal))}."`;
            const o = owns(f);
            // Who someone was (a question of identity): "I was the figure at the side door."
            if (o && ctx.question(o.q).entry?.attr === 'identity') return `${subj(f.of)} said${to}: "I was ${ctx.name(ctx.question(o.q).entry.of)}."`;
            if (o) { const e = ctx.question(o.q).entry; return `${subj(f.of)} said${to}: "It was I who ${yours(f.to, mine(f.of, done(e, '').trim()))}."`; }
            // An answer that is not a person, asserted: "It was after the gate lamp was lit."
            const a = list(f.asserts).find((x) => x.q && x.pick != null);
            // "Yes" or "no" asserted is the state that answer stands for (the other's, denied, where only one is typed), in the speaker's own person.
            if (a && (a.pick === 'yes' || a.pick === 'no')) {
                const ps = ctx.question(a.q).possibilities, own = list(ps.find((p) => p.value === a.pick)?.asserts), twin = list(ps.find((p) => p.value === (a.pick === 'yes' ? 'no' : 'yes'))?.asserts);
                const x = own[0] ?? (twin[0] ? { ...twin[0], neg: !twin[0].neg } : null);
                if (x) { const inner = teller({ ...ctx, speaker: f.of }); return `${subj(f.of)} said${to}: "${cap(`${ctx.prefix?.(x.time) ?? ''}${mine(f.of, inner.sentence(x))}`)}."`; }
            }
            // Another named as the doer, by one who can speak for it (a keeper of his monkey): "It was my monkey who took …".
            if (a && ctx.kind?.(a.pick) && list(ctx.question(a.q).entry?.act).length) return `${subj(f.of)} said${to}: "It was ${yours(f.to, mine(f.of, `${obj(a.pick)} who ${done(ctx.question(a.q).entry, '').trim()}`))}."`;
            if (a) return `${subj(f.of)} said${to}: "It was ${a.pick}."`;
            return `${subj(f.of)} said${to}: "${f.value}."`;
        } else if (f.attr === 'action' && list(f.act).length) s = done(f, subj(f.of));
        else if ((f.dated || f.revokes || f.speaks_of || f.words || ctx.kind?.(f.of) === 'document') && paper(f)) s = paper(f);
        else s = state(f) + list(f.gives).map((g) => `; by that ${obj(g.to)} gained ${g.what}`).join('');
        return ctx.speaker ? mine(ctx.speaker, s) : s;
    }
    /** The deed a question asks about, its doer unknown. */
    const deed = (q) => done(q.entry, 'somebody');
    return { sentence, deed, said };
}
