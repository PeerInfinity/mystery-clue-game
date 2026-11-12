// The world model as data (<case>/world/), read: provenance chains, the order of time points, what each fact and
// each claim asserts, and the contradictions among a set of accepted assertions. Pure: the caller loads the files
// (scripts/world-provenance.js and scripts/validate-world.js in node; the page by fetch).
//
// `data`: { entities, moves: [place ids that move], times, facts, accounts, questions, narrators }. `narrators`
// (world/case.json): who narrates the story to the reader, `{id, name?, trust?}`; every provenance chain ends at the
// reader, through one narrator's `narrates` link.

const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
export const CLAIM_ATTRS = new Set(['says', 'believes']);
/** Attributes with one value at a time: two values at a time both certainly cover contradict each other. */
export const SINGLE_ATTRS = new Set(['location', 'identity']);
/** Typed states: attributes whose values exclude each other (a door is open, shut or locked). See engine/actions.js. */
export const STATES = { door: ['open', 'shut', 'locked'] };
/**
 * States whose values are open (any place), not a fixed list: `heading`, where someone leading a horse is making for,
 * read from his track. Two of them that differ point to a change of aim (move (a)), not an action.
 */
export const OPEN_STATES = new Set(['heading']);

/** The end of every provenance chain: the reader, to whom each narrator tells the story. Not an entity of the story. */
export const READER = 'reader';
/**
 * A narrator's one link to the reader: keyed by the narrator, its level by default the narrator's `trust` (default
 * certain: the fair-play contract, a first-person narrator's own observations and an impersonal narrator's report);
 * the player may change it. An impersonal third-person narrator is the pseudo-entity `narrator`.
 */
export const narrationLink = (n) => ({ from: n.id, to: READER, how: 'narrates', narrator: n.id, base: LEVELS.indexOf(n.trust ?? 'certain'), uncertain: false });
/** The narrators of a case, `{id, name?, trust?}` (world/case.json). */
const narratorsOf = (data) => {
    if (!data.narrators?.length) throw new Error('a case needs narrators (world/case.json)');
    return data.narrators;
};

/** Provenance: the accounts holding each fact, and the chains of tellings that carry an account to the reader. */
export function provenance(data) {
    const { accounts, facts } = data;
    const narrators = narratorsOf(data);
    const narratorIds = new Set(narrators.map((n) => n.id));
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
    // What a claim asserts reaches the reader as the claim did, with one link more at its head: the claimant's word
    // (said, or believed) to whoever first held the claim. A fact with `word` is what that person said in a
    // narrator's hearing (`heard_by`, default the first narrator); a fact with `claim` is what that claim (a says or
    // believes fact) asserts.
    //
    // Every chain that reaches a narrator through someone starts with the statement's own link (`stmt`: the fact, or
    // the claim whose content it is), so the player can distrust one statement without the rest of what came along
    // the same links (the stranger's "lost" without his wish that the boy gets the paper). A narrator's own
    // observations have only the narration link.
    const stmtLink = (id, from) => ({ from, to: from, how: 'statement', stmt: id, uncertain: false });
    // A narrator marked `doubtable` (world/case.json: a story with an unreliable narrator) has a statement link on
    // each of their own observations too, so one can be distrusted without the rest; otherwise they are as certain
    // as the narration.
    const doubtable = new Set(narrators.filter((n) => n.doubtable).map((n) => n.id));
    // Such a statement starts as trusted as the narration (`base`), not at uncertain as what others say does.
    const withStmt = (id, ch) => (ch.links.some((l) => !l.narrator) ? { ...ch, links: [stmtLink(id, ch.origin ?? '?'), ...ch.links] }
        : doubtable.has(ch.origin) ? { ...ch, links: [{ ...stmtLink(id, ch.origin), base: ch.links.at(-1).base }, ...ch.links] } : ch);
    // The chains carrying an account to the reader: to a narrator, then that narrator's narration.
    const toReader = (aid) => narrators.flatMap((n) => chains(aid, n.id).map((links) => [...links, narrationLink(n)]));
    // `own`: the statement the link is for: the claim's own assertions by default, or one fact of its content (his walk
    // to the stables stands when "to see that all was well" is distrusted).
    const claimChains = (cid, own = cid) => {
        const c = factById.get(cid);
        const how = c.attr === 'believes' ? 'believes' : 'said';
        return plainChains(cid).map((ch) => ({ account: ch.account, claim: cid, origin: c.of, links: [stmtLink(own, c.of), { from: c.of, to: ch.origin ?? '?', how, claim: cid, uncertain: false }, ...ch.links] }));
    };
    const plainChains = (fid) => {
        const f = factById.get(fid);
        if (f?.claim) return claimChains(f.claim);
        if (f?.word) {
            const n = narrators.find((x) => x.id === (f.heard_by ?? narrators[0].id));
            return n ? [{ account: null, origin: f.word, links: [{ from: f.word, to: n.id, how: 'said', uncertain: false }, narrationLink(n)] }] : [];
        }
        return holdersOf.get(fid).flatMap((aid) => toReader(aid).map((links) => ({ account: aid, origin: byId.get(aid).origin, links })));
    };
    // A says or believes fact is itself an event (the speech, the belief), carried by the links that told it; its own
    // statement link is on what it asserts (claimChains), so distrusting it takes off the content, not the speech.
    const factChains = (fid) => {
        const f = factById.get(fid);
        if (f?.claim) return claimChains(f.claim, fid);
        return CLAIM_ATTRS.has(f?.attr) ? plainChains(fid) : plainChains(fid).map((ch) => withStmt(fid, ch));
    };
    return { accounts, byId, facts, tellings, ancestors, chains, holdersOf, factChains, claimChains, narrators, narratorIds };
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
        const qq = qById.get(q);
        if (qq?.answer == null) return null;
        return isRight(qq, pick) !== !!neg;
    };
    const out = [];
    for (const f of data.facts) {
        const claim = CLAIM_ATTRS.has(f.attr);
        out.push({ id: f.id, fact: f.id, kind: 'state', of: f.of, attr: f.attr, value: f.value, neg: !!f.neg, time: f.time, truth: claim ? true : ('truth' in f ? f.truth : true), para: f.given_at ?? f.para, ...(f.claim ? { claim: f.claim } : {}), ...(f.word ? { by: f.word } : {}), ...(f.event ? { event: f.event } : {}) });
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

/**
 * The player's marks on questions as assertions: a circled possibility asserts it, a crossed-out one denies it, each
 * on its own link from the reader's hypothesis (`hypothesisChain`). `marks`: `{q: {pick: 'circled' | 'crossed'}}`; only
 * the questions and possibilities in `shown` (a function (q, pick) → bool), if given, count. Truth by the answer key.
 */
export function markAssertions(data, marks = {}, shown = null) {
    const qById = new Map(data.questions.map((q) => [q.id, q]));
    const kindOf = entityKinds(data);
    const out = [];
    for (const [qid, picks] of Object.entries(marks)) {
        const q = qById.get(qid);
        if (!q) continue;
        for (const [pick, mark] of Object.entries(picks)) {
            if (mark !== 'circled' && mark !== 'crossed') continue;
            if (!isOption(q, pick, kindOf) || (shown && !shown(q, pick))) continue;
            const neg = mark === 'crossed';
            out.push({ id: hypothesisKey(qid, pick), fact: null, kind: 'pick', q: qid, pick, neg, mark, by: HYPOTHESIS, truth: q.answer == null ? null : isRight(q, pick) !== neg });
            // A circled answer that implies another question's answer asserts that too (the hoof: the horse struck).
            const imp = !neg && q.possibilities?.find((p) => p.value === pick)?.implies;
            const iq = imp && qById.get(imp.q);
            if (iq && (!shown || shown(iq, imp.pick))) out.push({ id: `${hypothesisKey(qid, pick)}>${imp.q}`, fact: null, kind: 'pick', q: imp.q, pick: imp.pick, neg: false, mark: 'implied', from: hypothesisKey(qid, pick), by: HYPOTHESIS, truth: iq.answer == null ? null : isRight(iq, imp.pick) });
        }
    }
    return out;
}
/**
 * The kinds of entity any of which may answer a question, beyond its listed possibilities: a "who" question (one whose
 * possibilities include a person or an animal) takes any person or animal, a "where" question (one with a place
 * among them) any place. A question about provenance takes only its own. `kindOf`: entity id → kind.
 */
export const WHO = ['person', 'animal'];
export const WHERE = ['place'];
export function answerKinds(q, kindOf) {
    if (q.kind === 'provenance') return [];
    if (q.who) return WHO;
    const kinds = new Set((q.possibilities ?? []).map((p) => kindOf(p.value)));
    if (WHO.some((k) => kinds.has(k))) return WHO;
    if (WHERE.some((k) => kinds.has(k))) return WHERE;
    return [];
}
export const entityKinds = (data) => { const m = new Map((data.entities ?? []).map((e) => [e.id, e.kind])); return (id) => m.get(id); };
/** A value the player may mark on a question: a listed possibility, or an entity of a kind it takes (not its subject). */
export function isOption(q, pick, kindOf) {
    if ((q.possibilities ?? []).some((p) => p.value === pick)) return true;
    return pick !== q.entry?.of && answerKinds(q, kindOf).includes(kindOf(pick));
}
/** The reader's hypothesis: the source of the player's marks, a person of its own so that one cap covers them all. */
export const HYPOTHESIS = 'hypothesis';
export const hypothesisKey = (q, pick) => `hyp:${q}=${pick}`;
/** The one chain of a mark: a single link from the reader's hypothesis to the reader, keyed by the mark, starting uncertain. */
export const hypothesisChain = (q, pick) => ({ account: null, origin: HYPOTHESIS, links: [{ from: HYPOTHESIS, to: READER, how: 'hypothesis', hyp: hypothesisKey(q, pick), uncertain: false }] });

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
 * - An identity (a state, or a circled answer of a question whose entry is one) against the locations it joins: the
 *   one it names elsewhere than where the other was (`{a, b: the identity, via: the other's location, why}`).
 * - One event told twice (two facts with the same `event`, an event that happens once) at two times that cannot meet:
 *   `{a, b, event, why}`.
 * Claims with `modal: 'possible'` take no part. Two circled marks of one question are an open choice, not reported.
 */
export function contradictions(data, accepted = null) {
    const order = data.order ?? timeOrder(data.times);
    const pl = data.places ?? places(data);
    const all = (accepted ?? assertions(data)).filter((x) => !x.modal);
    const out = [];

    const byQ = new Map();
    const qById = new Map((data.questions ?? []).map((q) => [q.id, q]));
    for (const x of all) if (x.kind === 'pick') byQ.set(x.q, [...(byQ.get(x.q) ?? []), x]);
    for (const [q, xs] of byQ) for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) {
        const a = xs[i], b = xs[j];
        if (a.fact != null && a.fact === b.fact) continue;
        if (a.mark === 'circled' && b.mark === 'circled') continue;
        if (compatible(qById.get(q), a.pick, b.pick)) continue;
        if (!a.neg && !b.neg && a.pick !== b.pick) out.push({ a, b, why: `${q}: ${a.pick} or ${b.pick}` });
        else if (a.neg !== b.neg && a.pick === b.pick) out.push({ a, b, why: `${q}: ${a.pick}, asserted and denied` });
    }

    const states = all.filter((x) => x.kind === 'state' && (SINGLE_ATTRS.has(x.attr) || STATES[x.attr]) && x.value != null);
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
        if (a.attr === 'identity' || STATES[a.attr]) {
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

    // A denial against what it denies, for any other kind of state: the same thing, attribute and value, asserted and
    // denied at times that meet ("he made every round" against "no round at three").
    const others = all.filter((x) => x.kind === 'state' && !(SINGLE_ATTRS.has(x.attr) || STATES[x.attr]) && x.value != null && x.of != null && !CLAIM_ATTRS.has(x.attr));
    const denials = others.filter((x) => x.neg);
    for (const d of denials) for (const p of others) {
        if (p.neg || p.fact === d.fact || p.of !== d.of || p.attr !== d.attr || p.value !== d.value) continue;
        if (!overlaps(order, coverOf(p.time), coverOf(d.time))) continue;
        out.push({ a: p, b: d, why: `${d.of}: ${d.value}, asserted and denied` });
    }

    // One event happens once: two tellings of it whose times certainly do not meet cannot both hold.
    const byEvent = new Map();
    for (const x of all) if (x.kind === 'state' && x.event && !x.neg) byEvent.set(x.event, [...(byEvent.get(x.event) ?? []), x]);
    for (const [event, xs] of byEvent) for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) {
        const a = xs[i], b = xs[j];
        if (a.fact === b.fact) continue;
        const ca = coverOf(a.time), cb = coverOf(b.time);
        // Certainly apart: one ends before the other starts (in the time order, not only by the paragraphs).
        const apart = (c, d) => (c.incl ? order.lt(c.end, d.start) : order.le(c.end, d.start));
        if (!ca || !cb || !(apart(ca, cb) || apart(cb, ca))) continue;
        out.push({ a, b, event, why: `${event}: once, at two times` });
    }

    // An identity carries whereabouts: "the figure was Dr. Mott" puts Dr. Mott where the figure was, at the time the
    // identity is about. The identity is a state on the timeline, or a circled answer of a question whose entry is one.
    // Each clash has three sides: the other one's location (`a`), the identity (`b`), and where the first one was
    // (`via`), so that distrusting any of them lifts it.
    const isEntity = (id) => typeof id === 'string' && pl.byId.has(id);
    const idents = [];
    for (const x of all) {
        if (x.neg) continue;
        if (x.kind === 'state' && x.attr === 'identity' && isEntity(x.of) && isEntity(x.value)) idents.push({ x, of: x.of, is: x.value, time: x.time });
        else if (x.kind === 'pick' && x.fact == null) {
            const e = qById.get(x.q)?.entry;
            if (e?.attr === 'identity' && isEntity(e.of) && isEntity(x.pick) && e.of !== x.pick) idents.push({ x, of: e.of, is: x.pick, time: typeof e.time === 'object' ? e.time : null });
        }
    }
    for (const id of idents) {
        const ct = id.time ? coverOf(id.time) : null;
        for (const la of locs) {
            if (la.of !== id.of || la.neg || la.fact === id.x.fact) continue;
            const ca = coverOf(la.time);
            if (!ca || (ct && !overlaps(order, ca, ct))) continue;
            const at0 = ct && covers(ca, ct) ? ct : ca;
            for (const lb of locs) {
                if (lb.of !== id.is || lb.neg || lb.fact === la.fact || lb.fact === id.x.fact) continue;
                const cb = coverOf(lb.time);
                if (!overlaps(order, at0, cb)) continue;
                const at = covers(cb, at0) ? at0 : cb;
                const va = fixedAt(la.value, at), vb = fixedAt(lb.value, at);
                if (!va || !vb) continue;
                const ka = pl.chain(va), kb = pl.chain(vb);
                if (!ka.includes(vb) && !kb.includes(va)) out.push({ a: lb, b: id.x, via: la, why: `${id.is} in two places, if ${id.of} was ${id.is}: ${vb} and ${va}` });
            }
        }
    }
    return out;
}

/**
 * Alibis: a hypothesis that needs someone at a place at some moment of a window (`needs`: `[{mark, of, places,
 * time: {from, to}, label}]`, `mark` the circle's assertion) against the accepted locations of that one. It is a
 * contradiction only when the timeline has them elsewhere for the whole window: one location covering it, or
 * several end to end, none of them within a needed place. Failing to place them at the scene is no alibi. Returns
 * contradictions `{a: a location, b: the mark (with `needs`: the label), why}`, one for each location of the cover,
 * so that distrusting any piece of the alibi lifts it.
 */
export function alibis(data, accepted, needs) {
    const order = data.order ?? timeOrder(data.times);
    const pl = data.places ?? places(data);
    const out = [];
    for (const n of needs) {
        const w = coverOf(n.time);
        if (!w || w.incl) continue;
        const away = accepted.filter((x) => x.kind === 'state' && x.attr === 'location' && !x.neg && (n.same ?? ((a, b) => a === b))(x.of, n.of) && typeof x.value === 'string' && pl.fixed(x.value)
            && !n.places.some((p) => pl.chain(x.value).includes(p)) && coverOf(x.time));
        // Walk the window from its start: each step a location that holds at the point reached.
        const cover = [];
        let at = w.start, done = false;
        for (let i = 0; i <= away.length && !done; i++) {
            const next = away.filter((x) => !cover.includes(x)).find((x) => { const c = coverOf(x.time); return !c.incl && order.le(c.start, at) && order.lt(at, c.end); });
            if (!next) break;
            cover.push(next);
            at = coverOf(next.time).end;
            done = order.le(w.end, at);
        }
        if (done) for (const x of cover) out.push({ a: x, b: { ...n.mark, needs: n.label }, why: `${n.of}: needed at ${n.places.join(' or ')}, and at ${x.value}` });
    }
    return out;
}

/** Where the story states a fact: `given_at`, else its paragraph; an inferable fact only by `given_at` (else null). */
/**
 * The answers that are right: the key's `answer`, and `also_right`, other possibilities that are just as true (the
 * light as well as the noise; the bets as well as the debts). Right answers do not exclude each other.
 */
export const isRight = (q, pick) => q?.answer != null && (pick === q.answer || (q.also_right ?? []).includes(pick));
/** Two possibilities of one question that can both hold: both right by the key. */
export const compatible = (q, a, b) => a !== b && isRight(q, a) && isRight(q, b);

export const givenAt = (f) => f.given_at ?? ((f.basis ?? 'stated') === 'inferable' ? null : f.para);

/** Trust levels, lowest first. A narration link starts at its narrator's trust (certain by default); every other link starts `uncertain`. */
export const LEVELS = ['distrusted', 'uncertain', 'trusted', 'certain'];
export const DEFAULT_LEVEL = 1;

/**
 * The key of a link the player can trust: a statement's own link by its fact (`stmt:<id>`); a telling by its fact id; a speech (a claim's or a word's link) by
 * speaker and hearer, so all of one person's words to another share it; a member's link by member and group; a
 * mark's link (the reader's hypothesis) by question and possibility; a narration by its narrator (`narrates:<id>`).
 */
export const linkKey = (l) => (l.hyp ? l.hyp : l.know ? l.know : l.narrator ? `narrates:${l.narrator}` : l.stmt ? `stmt:${l.stmt}` : l.telling ? l.telling : `${l.how === 'member' ? 'member' : l.how === 'unknown' ? 'unknown' : 'said'}:${l.from}>${l.to}`);

/**
 * How far the player trusts a chain: its weakest link, a link's level being the player's choice for it (default
 * uncertain; a narration link's its narrator's trust), lowered by the level set for the person it comes from, if any
 * (not a narration link: the narrator's trust as narrator is that link's own). `trust`: `{links: {key: level},
 * people: {id: level}}`.
 */
export function chainLevel(chain, trust = {}) {
    let level = LEVELS.length - 1;
    for (const l of chain.links) {
        let x = trust.links?.[linkKey(l)] ?? l.base ?? DEFAULT_LEVEL;
        const p = l.narrator ? null : trust.people?.[l.from];
        if (p != null) x = Math.min(x, p);
        level = Math.min(level, x);
    }
    return level;
}

/** How far the player trusts a fact or a claim's content: its best chain (null: no chain, the reader's own inference). */
export function levelOf(chains, trust = {}) {
    if (!chains.length) return null;
    return Math.max(...chains.map((c) => chainLevel(c, trust)));
}

/**
 * The links, and the people, whose distrust alone would take a fact below the threshold: every chain of it passes
 * through them (and the fact is now at or above it). `chains`: the fact's chains; returns `{links: [key], people: [id]}`.
 * A narration link is the frame every fact comes in, not a source to weigh against another: it is never listed.
 */
export function resolvingLinks(chains, trust = {}, threshold = DEFAULT_LEVEL) {
    const out = { links: [], people: [] };
    if (!chains.length || threshold <= 0 || levelOf(chains, trust) < threshold) return out;
    const keys = [...new Set(chains.flatMap((c) => c.links.filter((l) => !l.narrator).map(linkKey)))];
    for (const k of keys) if (levelOf(chains, { ...trust, links: { ...trust.links, [k]: 0 } }) < threshold) out.links.push(k);
    const people = [...new Set(chains.flatMap((c) => c.links.filter((l) => !l.narrator).map((l) => l.from)))].filter((p) => p && p !== '?');
    for (const p of people) if (levelOf(chains, { ...trust, people: { ...trust.people, [p]: 0 } }) < threshold) out.people.push(p);
    return out;
}
