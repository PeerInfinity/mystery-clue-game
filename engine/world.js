// The world model as data (<case>/world/), read: provenance chains, the order of time points, what each fact and
// each claim asserts, and the contradictions among a set of accepted assertions. Pure: the caller loads the files
// (scripts/world-provenance.js and scripts/validate-world.js in node; the page by fetch).
//
// `data`: { entities: [...the case's and the world's entities], moves: [place ids that move], times, facts,
// accounts, questions }.

const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
export const CLAIM_ATTRS = new Set(['says', 'believes']);
/** Attributes with one value at a time: two values at a time both certainly cover contradict each other. */
export const SINGLE_ATTRS = new Set(['location', 'identity']);

/** Provenance: the accounts holding each fact, and the chains of tellings that carry an account to a holder. */
export function provenance(data) {
    const { accounts, facts } = data;
    const byId = new Map(accounts.map((a) => [a.id, a]));
    const tellings = facts.filter((f) => f.attr === 'tells');

    // The bundles an account is a part of, directly or through other bundles.
    const parentsOf = new Map(accounts.map((a) => [a.id, []]));
    for (const a of accounts) for (const p of list(a.parts)) parentsOf.get(p)?.push(a.id);
    const ancestors = (id, seen = new Set()) => {
        for (const p of parentsOf.get(id) ?? []) if (!seen.has(p)) { seen.add(p); ancestors(p, seen); }
        return seen;
    };

    // A member holds what its groups hold (a fact on a group holds for its members): Gregory, of the police.
    const groupsOf = new Map();
    for (const f of facts) if (f.attr === 'member_of') for (const g of list(f.value)) groupsOf.set(f.of, [...(groupsOf.get(f.of) ?? []), g]);
    const selves = (h) => [h, ...new Set(groupsOf.get(h) ?? [])];

    // Chains carrying account `id` to `holder`: each a list of links from the origin onwards.
    const memo = new Map();
    const chains = (id, holder, visiting = new Set()) => {
        const key = `${id}>${holder}`;
        if (memo.has(key)) return memo.get(key);
        const a = byId.get(id);
        if (a.origin === holder) return [[]];
        if (selves(holder).includes(a.origin)) return [[{ from: a.origin, to: holder, how: 'member', uncertain: false }]];
        if (visiting.has(holder)) return [];
        visiting.add(holder);
        const carriers = new Set([id, ...ancestors(id)]);
        const out = [];
        for (const t of tellings) {
            if (!selves(holder).includes(t.to) || !list(t.value).some((v) => carriers.has(v))) continue;
            if (t.to !== holder) out.push(...chains(id, t.to, visiting).map((c) => [...c, { from: t.to, to: holder, how: 'member', uncertain: false }]));
            if (t.to !== holder) continue;
            const link = { from: t.of, to: holder, how: t.how, telling: t.id, uncertain: t.of === '?' || t.truth === null || !!t.partial, q: t.q };
            if (t.of === '?') out.push([{ from: a.origin ?? '?', to: '?', how: 'unknown', gap: true, uncertain: true, q: t.q }, link]);
            else for (const c of chains(id, t.of, visiting)) out.push([...c, link]);
        }
        // An account with no named origin starts, unknown, with the first holder no telling reaches.
        if (!out.length && a.origin == null) out.push([{ from: '?', to: holder, how: 'unknown', gap: true, uncertain: true }]);
        visiting.delete(holder);
        if (!visiting.size) memo.set(key, out);
        return out;
    };

    const holdersOf = new Map(facts.map((f) => [f.id, []]));
    for (const a of accounts) for (const f of list(a.facts)) holdersOf.get(f)?.push(a.id);
    const factById = new Map(facts.map((f) => [f.id, f]));
    // What a claim asserts reaches Watson as the claim did, with one link more at its head: the claimant's word
    // (said, or believed) to whoever first held the claim. A fact with `word` is what that person said in Watson's
    // hearing; a fact with `claim` is what that claim (a says or believes fact) asserts.
    const claimChains = (cid) => {
        const c = factById.get(cid);
        const how = c.attr === 'believes' ? 'believes' : 'said';
        return factChains(cid).map((ch) => ({ account: ch.account, claim: cid, origin: c.of, links: [{ from: c.of, to: ch.origin ?? '?', how, claim: cid, uncertain: false }, ...ch.links] }));
    };
    const factChains = (fid) => {
        const f = factById.get(fid);
        if (f?.claim) return claimChains(f.claim);
        if (f?.word) return [{ account: null, origin: f.word, links: [{ from: f.word, to: 'watson', how: 'said', uncertain: false }] }];
        return holdersOf.get(fid).flatMap((aid) => chains(aid, 'watson').map((links) => ({ account: aid, origin: byId.get(aid).origin, links })));
    };
    return { accounts, byId, facts, tellings, ancestors, chains, holdersOf, factChains, claimChains };
}

export const showChain = (c) => [c.origin ?? '?', ...c.links.map((l) => `${l.uncertain ? '?' : ''}${l.how}→ ${l.to}`)].join(' ');

/** The partial order of time points (`after`): `le(a, b)` when a is certainly no later than b. */
export function timeOrder(times) {
    const afterOf = new Map(times.map((t) => [t.id, list(t.after)]));
    const earlier = new Map();
    const below = (id) => {
        if (earlier.has(id)) return earlier.get(id);
        const s = new Set();
        earlier.set(id, s);
        for (const a of afterOf.get(id) ?? []) { s.add(a); for (const x of below(a)) s.add(x); }
        return s;
    };
    for (const t of times) below(t.id);
    const lt = (a, b) => a !== b && !!earlier.get(b)?.has(a);
    const le = (a, b) => a === b || lt(a, b);
    // A linear order for showing: earlier points first, ties by the paragraph that dates them, then file order.
    const index = new Map(times.map((t, i) => [t.id, i]));
    const sorted = [];
    const placed = new Set();
    const place = (id) => {
        if (placed.has(id)) return;
        placed.add(id);
        for (const a of [...(afterOf.get(id) ?? [])].sort((x, y) => index.get(x) - index.get(y))) place(a);
        sorted.push(id);
    };
    for (const t of times) place(t.id);
    const rank = new Map(sorted.map((id, i) => [id, i]));
    return { lt, le, sorted, rank };
}

/**
 * The span of time a fact certainly covers: `{at}` its point; `{from, to}` from `from` up to, not including, `to`;
 * an open end only its start (a state lasts until the next change, which is no contradiction); `{after, before}`
 * and `{to}` alone nothing certain.
 */
export function coverOf(time) {
    if (!time) return null;
    if (time.at) return { start: time.at, end: time.at, incl: true };
    if (time.from && time.to) return { start: time.from, end: time.to, incl: false };
    if (time.from) return { start: time.from, end: time.from, incl: true };
    return null;
}

/** Whether two covers certainly share a moment: one starts inside the other. */
export function overlaps(order, a, b) {
    if (!a || !b) return false;
    const inside = (p, c) => order.le(c.start, p) && (c.incl ? order.le(p, c.end) : order.lt(p, c.end));
    return inside(a.start, b) || inside(b.start, a);
}

/**
 * Everything the data asserts, one assertion each: `{id, fact, kind, ...}`.
 * - `kind: 'state'`: a fact itself (`of`, `attr`, `value`, `neg`, `time`), true as the answer key says (`truth`).
 * - `kind: 'pick'`: a question's possibility a fact or a claim asserts (`q`, `pick`, `neg`); a fact other than a
 *   claim asserts its own `pick`.
 * - A claim (`says`, `believes`) is itself a state (it was said, or held); what it asserts (`asserts`, each a pick
 *   or a state) is an assertion of its own with `claim` set and `by` the claimant, true as the answer key says.
 *   A claim with `modal: 'possible'` (may, could) asserts nothing that can contradict.
 */
export function assertions(data) {
    const qById = new Map(data.questions.map((q) => [q.id, q]));
    const pickTruth = (q, pick, neg) => {
        const answer = qById.get(q)?.answer;
        if (answer == null) return null;
        return (pick === answer) !== !!neg;
    };
    const out = [];
    for (const f of data.facts) {
        const claim = CLAIM_ATTRS.has(f.attr);
        out.push({ id: f.id, fact: f.id, kind: 'state', of: f.of, attr: f.attr, value: f.value, neg: !!f.neg, time: f.time, truth: claim ? true : ('truth' in f ? f.truth : true), para: f.given_at ?? f.para, ...(f.claim ? { claim: f.claim } : {}), ...(f.word ? { by: f.word } : {}) });
        if (!claim && f.q && f.pick != null) out.push({ id: `${f.id}#pick`, fact: f.id, kind: 'pick', q: f.q, pick: f.pick, neg: false, truth: 'truth' in f ? f.truth : true, para: f.given_at ?? f.para });
        if (!claim) continue;
        list(f.asserts).forEach((x, i) => {
            const base = { id: `${f.id}#${i}`, fact: f.id, claim: f.id, by: f.of, how: f.attr, modal: f.modal ?? null, para: f.given_at ?? f.para };
            if (x.q) out.push({ ...base, kind: 'pick', q: x.q, pick: x.pick, neg: !!x.neg, truth: pickTruth(x.q, x.pick, x.neg) });
            else out.push({ ...base, kind: 'state', of: x.of, attr: x.attr, value: x.value, neg: !!x.neg, time: x.time ?? f.time, truth: 'truth' in x ? x.truth : null });
        });
    }
    return out;
}

/** Places: what each is within, and which move (vehicles, and any thing that is not a place). */
export function places(data) {
    const byId = new Map(data.entities.map((e) => [e.id, e]));
    const moves = new Set(data.moves ?? []);
    const chain = (id) => {
        const out = [];
        for (let x = id; x && !out.includes(x); x = byId.get(x)?.within) out.push(x);
        return out;
    };
    const fixed = (id) => byId.get(id)?.kind === 'place' && !moves.has(id);
    return { byId, chain, fixed };
}

/**
 * The contradictions among `accepted` assertions (default: all of them): pairs `{a, b, why}`.
 * - Two picks of one question that cannot both hold: different possibilities, or one possibility asserted and
 *   denied.
 * - Two states of one single-valued attribute (location, identity) of one entity, at times both certainly cover,
 *   whose values cannot both hold: two places neither within the other (a thing that moves, or a person carrying
 *   it, is placed through its own location at that time where that is certain), different identities, or a place
 *   and its denial (`neg`) of the same place or one containing it.
 * Claims with `modal: 'possible'` take no part.
 */
export function contradictions(data, accepted = null) {
    const order = data.order ?? timeOrder(data.times);
    const pl = data.places ?? places(data);
    const all = (accepted ?? assertions(data)).filter((x) => !x.modal);
    const out = [];

    const byQ = new Map();
    for (const x of all) if (x.kind === 'pick') byQ.set(x.q, [...(byQ.get(x.q) ?? []), x]);
    for (const [q, xs] of byQ) for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) {
        const a = xs[i], b = xs[j];
        if (a.fact === b.fact) continue;
        if (!a.neg && !b.neg && a.pick !== b.pick) out.push({ a, b, why: `${q}: ${a.pick} or ${b.pick}` });
        else if (a.neg !== b.neg && a.pick === b.pick) out.push({ a, b, why: `${q}: ${a.pick}, asserted and denied` });
    }

    const states = all.filter((x) => x.kind === 'state' && SINGLE_ATTRS.has(x.attr) && x.value != null);
    const locs = states.filter((x) => x.attr === 'location');
    // Where a thing that moves certainly is over a cover: a fixed place, through at most a few hops.
    const fixedAt = (value, cover, depth = 0) => {
        if (pl.fixed(value)) return value;
        if (depth > 3) return null;
        for (const s of locs) if (s.of === value && !s.neg && covers(coverOf(s.time), cover)) {
            const v = fixedAt(s.value, cover, depth + 1);
            if (v) return v;
        }
        return null;
    };
    // Whether cover `c` holds throughout cover `d` (so a thing's place over c is its place at d).
    const covers = (c, d) => !!(c && d) && order.le(c.start, d.start) && (c.incl ? order.le(d.end, c.end) : (order.lt(d.end, c.end) || (!d.incl && d.end === c.end)));
    const groups = new Map();
    for (const s of states) {
        const k = `${s.of}|${s.attr}`;
        groups.set(k, [...(groups.get(k) ?? []), s]);
    }
    for (const xs of groups.values()) for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) {
        const a = xs[i], b = xs[j];
        if (a.fact === b.fact) continue;
        const ca = coverOf(a.time), cb = coverOf(b.time);
        if (!overlaps(order, ca, cb)) continue;
        if (a.attr === 'identity') {
            if (!a.neg && !b.neg && a.value !== b.value) out.push({ a, b, why: `${a.of}: ${a.value} or ${b.value}` });
            else if (a.neg !== b.neg && a.value === b.value) out.push({ a, b, why: `${a.of}: ${a.value}, asserted and denied` });
            continue;
        }
        // Locations: compare over the shorter cover (a point inside an interval: that point).
        const at = covers(ca, cb) ? cb : ca;
        const va = fixedAt(a.value, at), vb = fixedAt(b.value, at);
        if (!va || !vb) continue;
        const ka = pl.chain(va), kb = pl.chain(vb);
        if (!a.neg && !b.neg) {
            if (!ka.includes(vb) && !kb.includes(va)) out.push({ a, b, why: `${a.of} in two places: ${va} and ${vb}` });
        } else if (a.neg !== b.neg) {
            const [pos, neg] = a.neg ? [kb, va] : [ka, vb];
            if (pos.includes(neg)) out.push({ a, b, why: `${a.of}: at ${pos[0]} and not at ${neg}` });
        }
    }
    return out;
}
