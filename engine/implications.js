// Implications (an experiment, 2026-11-18; docs/authored-stories.md, finding 105): what the statements a player has
// shown imply when they are put together. An observation is a statement shown by a link ("the cart went out by the
// town gate"); an implication is a statement that follows from others, shown by itself the moment they all are:
//   {id, q, from: [premise], says, rules_out?: [possibility], concludes?: possibility}
// A premise is the id of an observation or of another implication (so the implications make a tree), or
// `{any: [ids]}` for any one of several, or `{solved: q}` for another question's answer being known. Two implications
// with the same conclusion are two ways to it. `rules_out` crosses those answers of `q` out; `concludes` is the
// answer. An observation's `against` is not read here: it was a label, and what rules an answer out is said by an
// implication, with every premise it takes (often the observation alone does not).
//
// With these a question needs no checklist: its answer is known when an implication concludes it, or when every
// other answer is ruled out. What is shown beyond that is support, and wanted by nothing.

import { isRight, coverOf, overlaps, places, timeOrder, hypothesisKey, answerStates, DERIVED, assertions, markAssertions, contradictions, alibis, entityKinds, CONFIRMED, LIKELY_LEVEL } from './world.js';
import { answerAction, conditionsOf, actNeeds, pointImplications, productsOf, meets, requirementStatus } from './actions.js';

const holds = (p, has, solved) => (typeof p === 'string' ? has(p) : p.any ? p.any.some(has) : p.solved ? !!solved?.(p.solved) : false);

/**
 * The implications that hold, given the observations shown (`shown(id)`) and the questions solved (`solved(q)`):
 * to a fixed point, in the order they came to hold (a premise before what follows from it).
 */
export function derive(implications, shown, solved) {
    const got = [];
    const has = (id) => shown(id) || got.some((i) => i.id === id);
    for (let more = true; more;) {
        more = false;
        for (const i of implications) {
            if (got.includes(i) || !i.from.every((p) => holds(p, has, solved)) || (i.unless ?? []).some((p) => holds(p, shown, solved))) continue;
            got.push(i);
            more = true;
        }
    }
    return got;
}

/**
 * What the statements shown say of a question's answers: `{ruled, concluded, by}`. `ruled`: the answers ruled out
 * (by an implication's `rules_out`, and every other answer once one is concluded);
 * `concluded`: the answer, by an implication that concludes it or as the one answer left; `by`: 'implication',
 * 'elimination' or null. `values`: the question's possible answers; `derived`: what `derive` gave.
 */
export function verdict(q, values, derived) {
    const ruled = new Set(derived.filter((i) => i.q === q).flatMap((i) => i.rules_out ?? []).filter((v) => values.includes(v)));
    const said = [...new Set(derived.filter((i) => i.q === q && i.concludes != null).map((i) => i.concludes))];
    let concluded = said.length === 1 ? said[0] : null, by = concluded != null ? 'implication' : null;
    if (concluded == null && !said.length) {
        const left = values.filter((v) => !ruled.has(v));
        if (left.length === 1 && values.length > 1) { concluded = left[0]; by = 'elimination'; }
    }
    if (concluded != null) for (const v of values) if (v !== concluded) ruled.add(v);
    return { ruled, concluded, by };
}

/** The premises of an implication as ids, for drawing the tree (`{solved}` as `solved:q`). */
export const premiseIds = (i, has) => i.from.map((p) => (typeof p === 'string' ? p : p.any ? p.any.find(has) ?? p.any[0] : `solved:${p.solved}`));

/**
 * What is wrong with a case's implications, as lines: references, cycles, a wrong answer concluded or a right one
 * ruled out, and a question that has implications and whose answer does not follow when everything is shown.
 * `right(q)`: the answers accepted for q; `values(q)`: its possible answers.
 */
export function problems(implications, observations, questions, right, values) {
    const out = [];
    const obsIds = new Set(observations.map((o) => o.id)), ids = new Set(implications.map((i) => i.id)), qIds = new Set(questions.map((q) => q.id));
    const seen = new Set();
    for (const i of implications) {
        if (seen.has(i.id) || obsIds.has(i.id)) out.push(`${i.id}: the id is used twice`);
        seen.add(i.id);
        if (!qIds.has(i.q)) { out.push(`${i.id}: no question ${i.q}`); continue; }
        if (!Array.isArray(i.from) || !i.from.length) out.push(`${i.id}: from: a list of premises`);
        if (!i.says) out.push(`${i.id}: says nothing`);
        for (const p of i.from ?? []) for (const id of typeof p === 'string' ? [p] : p.any ?? []) if (!obsIds.has(id) && !ids.has(id)) out.push(`${i.id}: no statement ${id}`);
        for (const p of i.from ?? []) if (typeof p !== 'string' && !p.any && !(p.solved && qIds.has(p.solved))) out.push(`${i.id}: no premise ${JSON.stringify(p)}`);
        const vs = values(i.q), ok = right(i.q);
        for (const v of i.rules_out ?? []) { if (!vs.includes(v)) out.push(`${i.id}: rules out ${v}, no answer of ${i.q}`); else if (ok.includes(v) && !(i.unless ?? []).length) out.push(`${i.id}: rules out ${v}, a right answer`); }
        if (i.concludes != null && !ok.includes(i.concludes)) out.push(`${i.id}: concludes ${i.concludes}, not a right answer of ${i.q}`);
    }
    // Everything shown and every question solved: every implication must hold (none rests on itself), and each
    // question that has implications must have its answer.
    const all = derive(implications, (id) => obsIds.has(id), () => true);
    // (A rule with `unless` is set aside by what defeats it, which is then shown too.)
    for (const i of implications) if (!all.includes(i) && !(i.unless ?? []).length) out.push(`${i.id}: never holds (it rests on itself, or on what does not exist)`);
    for (const q of new Set(implications.map((i) => i.q))) {
        if (!qIds.has(q)) continue;
        const v = verdict(q, values(q), all);
        if (v.concluded == null) out.push(`${q}: with everything shown, no answer follows`);
        else if (!right(q).includes(v.concluded)) out.push(`${q}: with everything shown, ${v.concluded} follows, which is not right`);
    }
    return out;
}

/**
 * Every way to a question's answer: the smallest sets of statements from which it follows, the and/or tree of its
 * implications flattened. A set's members are observation ids and `solved:<q>` (a premise that another question is
 * solved). An answer follows by an implication that concludes a right answer (`right`: the answers accepted), or by
 * every other answer (`values`) being ruled out. A set that contains another is left out. `[]` if nothing concludes.
 */
export function ways(implications, q, values, right) {
    const byId = new Map(implications.map((i) => [i.id, i]));
    const memo = new Map();
    const key = (set) => [...set].sort().join('\u0001');
    const least = (sets) => {
        const uniq = [...new Map(sets.map((x) => [key(x), x])).values()].sort((a, b) => a.size - b.size);
        return uniq.filter((x, n) => !uniq.slice(0, n).some((y) => [...y].every((e) => x.has(e))));
    };
    const both = (a, b) => least(a.flatMap((x) => b.map((y) => new Set([...x, ...y]))));
    const ofId = (id, trail) => (byId.has(id) ? ofImp(byId.get(id), trail) : [new Set([id])]);
    const ofPremise = (p, trail) => (typeof p === 'string' ? ofId(p, trail) : p.any ? least(p.any.flatMap((id) => ofId(id, trail))) : [new Set([`solved:${p.solved}`])]);
    function ofImp(i, trail = []) {
        if (memo.has(i.id)) return memo.get(i.id);
        if (trail.includes(i.id)) return [];
        const out = i.from.reduce((acc, p) => both(acc, ofPremise(p, [...trail, i.id])), [new Set()]);
        memo.set(i.id, out);
        return out;
    }
    const mine = implications.filter((i) => i.q === q);
    const concluded = mine.filter((i) => i.concludes != null && right.includes(i.concludes)).flatMap((i) => ofImp(i));
    // By elimination: for one right answer, every other answer ruled out, each by any implication that does so.
    const eliminated = right.flatMap((ok) => {
        const others = values.filter((v) => v !== ok);
        if (!others.length) return [];
        const per = others.map((v) => least(mine.filter((i) => (i.rules_out ?? []).includes(v)).flatMap((i) => ofImp(i))));
        return per.some((x) => !x.length) ? [] : per.reduce((acc, x) => both(acc, x), [new Set()]);
    });
    return least([...concluded, ...eliminated]).map((x) => [...x].sort());
}

/**
 * For a question with implications: the observations its answer can do without. Each smallest set of its
 * observations from which the answer follows (other questions taken as solved) is found by leaving out one at a
 * time; an observation in none of them is support only. `{needed: [ids], spare: [ids]}`, for the author to read.
 */
export function spare(implications, observations, q, values) {
    const mine = observations.filter((o) => o.q === q);
    const follows = (set) => verdict(q, values, derive(implications, (id) => set.has(id) || (!mine.some((o) => o.id === id) && observations.some((o) => o.id === id)), () => true)).concluded != null;
    const all = new Set(mine.map((o) => o.id));
    if (!follows(all)) return { needed: [], spare: [] };
    const needed = mine.filter((o) => { const s = new Set(all); s.delete(o.id); return !follows(s); }).map((o) => o.id);
    return { needed, spare: mine.map((o) => o.id).filter((id) => !needed.includes(id)) };
}

// --- What follows, as assertions the contradiction engine reads (engine/world.js `contradictions`).
//
// An answer that follows is asserted and one ruled out is denied, as a circle and a cross are, but resting on the
// implications that say so (`derived`: a support, below) and not on the reader's hypothesis. Where the question's
// entry gives the answer a typed form, the state is asserted too: a place answer of a location entry with a certain
// time is that location (ruled out by an implication over a stretch: denied for the whole stretch, `whole`, which
// only locations holding it end to end contradict), and an identity an implication rules out is that identity denied. An implication can say
// more, in two optional fields:
//   asserts: [{of, attr, value, neg?, time}]   typed statements, in the form of a claim's `asserts` (states only);
//   denies: <assertion id> | [ids]             a statement that cannot be typed, reasoned not to be so.
// A support is an implication's id, `{all: [supports]}` or `{any: [supports]}`.

/** The typed statements of the implications that hold: `{id: 'r:i:<implication>:<n>', imp, of, attr, value, neg, time}`. */
export const impliedStates = (derived) => derived.flatMap((i) => (i.asserts ?? []).map((x, n) => ({ ...x, id: `r:i:${i.id}:${n}`, imp: i.id, neg: !!x.neg })));

/**
 * The assertions of what follows. `data`: the world (questions, entities); `derived`: what `derive` gave;
 * `valuesOf(q)`: the question's possible answers (those shown); `opts.states: false` leaves out the typed
 * statements of `asserts` (the page puts those on the timeline as entries of its own); `opts.level(id)`: how far
 * the statement under an observation is trusted (default: confirmed if `opts.shown(id)`).
 */
export function derivedAssertions(data, derived, valuesOf, opts = {}) {
    const out = [];
    const shown = opts.shown ?? (() => true);
    const qById = new Map(data.questions.map((q) => [q.id, q]));
    const entities = new Set((data.entities ?? []).map((e) => e.id));
    for (const qid of new Set(derived.map((i) => i.q))) {
        const q = qById.get(qid);
        if (!q) continue;
        const values = valuesOf(q), mine = derived.filter((i) => i.q === qid);
        const v = verdict(qid, values, derived);
        const concluded = values.includes(v.concluded) ? v.concluded : null;
        const rulers = (x) => mine.filter((i) => (i.rules_out ?? []).includes(x)).map((i) => i.id);
        const why = concluded == null ? null : v.by === 'implication' ? { any: mine.filter((i) => i.concludes === concluded).map((i) => i.id) } : { all: values.filter((x) => x !== concluded).map((x) => ({ any: rulers(x) })) };
        const truth = (pick, neg) => (q.answer == null ? null : isRight(q, pick) !== neg);
        const e = q.entry ?? {}, cover = coverOf(typeof e.time === 'object' ? e.time : null);
        // `ruled`: the implications that rule the answer out themselves. An answer crossed out only because another
        // is concluded is not denied as a state: "not at Saltmere" is not so of what hung in the Custom House there.
        const add = (pick, neg, support, ruled = null) => {
            const base = { fact: null, q: qid, pick, neg, by: DERIVED, derived: support, truth: truth(pick, neg) };
            out.push({ ...base, id: hypothesisKey(qid, pick), kind: 'pick', mark: neg ? 'crossed' : 'circled' });
            // What the answer says in typed form, where its possibility says (`asserts`): the author's own word for
            // it, so it is denied with the answer however that was ruled out.
            for (const st of answerStates(q, pick, neg)) out.push({ ...base, ...st, id: `${hypothesisKey(qid, pick)}@a${st.n}`, kind: 'state', truth: null });
            base.denied = neg;
            if (!cover || !entities.has(e.of) || !entities.has(pick) || e.of === pick) return;
            if (neg) { if (!ruled?.length) return; base.derived = { any: ruled }; }
            if (e.attr === 'location') out.push({ ...base, id: `${hypothesisKey(qid, pick)}@state`, kind: 'state', of: e.of, attr: 'location', value: pick, time: e.time, ...(neg && !cover.incl ? { whole: true } : {}) });
            else if (e.attr === 'identity' && neg && cover.incl) out.push({ ...base, id: `${hypothesisKey(qid, pick)}@state`, kind: 'state', of: e.of, attr: 'identity', value: pick, time: e.time });
        };
        if (concluded != null) add(concluded, false, why);
        for (const x of values) {
            if (x === concluded) continue;
            const r = rulers(x);
            if (r.length || concluded != null) add(x, true, { any: [...r, ...(concluded != null ? [why] : [])] }, r);
        }
    }
    for (const i of derived) for (const id of [].concat(i.denies ?? [])) out.push({ id: `${i.id}!${id}`, fact: null, kind: 'denial', denies: id, q: i.q, imp: i.id, by: DERIVED, derived: i.id, truth: null });
    if (opts.states !== false) for (const s of impliedStates(derived)) out.push({ ...s, fact: null, kind: 'state', by: DERIVED, derived: s.imp, truth: null });
    // How strong each is (`level`), and what rests on a likely step or a likely statement by every way to it is
    // likely, and no more (`likely`).
    const level = opts.level ?? ((id) => (shown(id) ? CONFIRMED : null));
    for (const x of out) { x.level = strength(x.derived, derived, level); if (x.level !== CONFIRMED) x.likely = true; }
    return out;
}

/** The implications a support names, each once. */
export const supportIds = (s) => (typeof s === 'string' ? [s] : [...new Set((s?.all ?? s?.any ?? []).flatMap(supportIds))]);

/**
 * The rules nobody has to write (2026-11-18): where an answer has a typed form (its possibility's `asserts`, its
 * act with what that needs and leaves, an identity) and what one observation comes from contradicts it, linking
 * that observation rules the answer out: `{id: 't.<observation>.<n>', q, from: [observation], says, rules_out: [answer],
 * table: true}`. Only from true entries (a lie rules nothing out), only observations that come from entries (not
 * from a move, a doubt or another question), and never a right answer (that would be a fault of the data, which
 * the validator's check of the key finds). An observation from any one of several entries rules out only what
 * each of them contradicts. The case's actions must be set (`setCaseActions`).
 */
export function tableRules(data, observations) {
    const told = assertions(data).filter((x) => x.kind === 'state' && x.truth === true && !(x.claim && x.claim === x.fact));
    const kindOf = entityKinds(data), isEntity = (id) => kindOf(id) != null;
    const ctx = { joins: data.joins ?? {}, order: data.order };
    const out = [];
    const qById = new Map(data.questions.map((q) => [q.id, q])), factOf = new Map((data.facts ?? []).map((f) => [f.id, f])), chainOf = (v) => (data.places ?? places(data)).chain(v) ?? [];
    // An aim is judged by what its holder believed (2026-11-22; finding 119): the rule that an aim not carried out is
    // unlikely does not hold (`unless`) once the doer is taken to have believed the thing aimed at was where the deed
    // was done. The deed is the question the motive question names (`entry.deed`); the belief is the right answer of
    // a question, typed (`believes: {by: {answer: <the deed's question>}, of, attr: 'location', value}` on the
    // possibility), or a `believes` entry of someone who could be the doer, under an observation of its own.
    const defeaters = (q, p) => {
        const dq = qById.get(q.entry?.deed), spots = [dq?.entry?.thing, dq?.entry?.where].filter(Boolean);
        if (!dq || !p.goal) return [];
        const fits = (b) => !!b && b.of === p.goal.of && b.attr === 'location' && !b.neg && spots.some((s) => b.value === s || chainOf(b.value).includes(s));
        const byQ = data.questions.filter((k) => { const b = k.possibilities?.find((x) => x.value === k.answer)?.believes; return fits(b) && b.by?.answer === dq.id; }).map((k) => ({ solved: k.id }));
        const who = new Set((dq.possibilities ?? []).map((x) => x.value));
        const byEntry = observations.filter((o) => o.q === q.id && !o.if && o.from.length === 1 && typeof o.from[0] === 'string').filter((o) => { const f = factOf.get(o.from[0]); return f?.attr === 'believes' && f.truth !== false && who.has(f.of) && [f.asserts ?? []].flat().some(fits); }).map((o) => o.id);
        return [...byQ, ...byEntry];
    };
    // In a yes-or-no question where one answer is the other's denial, what rules one out for certain concludes the
    // other (2026-11-22; finding 120): "something else" is no third answer there.
    const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
    // The same for any question of two answers whose typed forms deny each other ("before the lamp was lit": the cup
    // not in the vestry then; "after": in it), whatever they are called (2026-11-25; finding 143).
    const denies = (a, b) => { const x = list(a.asserts), y = list(b.asserts); return x.length === 1 && y.length === 1 && x[0].of === y[0].of && x[0].attr === y[0].attr && JSON.stringify(x[0].value) === JSON.stringify(y[0].value) && JSON.stringify(x[0].time ?? null) === JSON.stringify(y[0].time ?? null) && !!x[0].neg !== !!y[0].neg; };
    const other = (q, p) => {
        const o = p.value === 'yes' ? 'no' : p.value === 'no' ? 'yes' : null, op = o && q.possibilities.find((x) => x.value === o);
        if (op && isRight(q, o) && list(p.asserts).length > 0 !== list(op.asserts).length > 0) return { concludes: o };
        const two = q.possibilities.filter((x) => x.via !== 'always'), twin = two.length === 2 ? two.find((x) => x !== p) : null;
        return twin && two.includes(p) && isRight(q, twin.value) && denies(p, twin) ? { concludes: twin.value } : {};
    };
    for (const q of data.questions) (q.possibilities ?? []).forEach((p, n) => {
        // A right answer is never ruled out, but for an aim that failed and a belief that explains it.
        const right = isRight(q, p.value), unless = defeaters(q, p);
        if (right && !unless.length) return;
        const marks = markAssertions(data, { [q.id]: { [p.value]: 'circled' } });
        if (!marks.length) return;
        const needs = actNeeds(marks[0], answerAction(q, p.value, isEntity), ctx);
        // An aim (`goal`: the state wanted) that an entry denies after the deed: nothing was done toward it, so it
        // was likely not the aim. Likely only: an aim can fail.
        const t = q.entry?.time && typeof q.entry.time === 'object' ? q.entry.time : {};
        const span = { from: t.from ?? t.after, to: t.to ?? t.before };
        const aims = p.goal && span.from && span.to ? [{ mark: marks[0], of: p.goal.of, attr: p.goal.attr, value: p.goal.value, neg: !!p.goal.neg, time: span, effect: true, label: 'its aim' }] : [];
        if (marks.length < 2 && !needs.length && !aims.length && q.entry?.attr !== 'identity') return;
        const against = (ids) => { const a = told.filter((x) => ids.includes(x.fact)); return a.length > 0 && (contradictions(data, [...a, ...marks]).some((c) => marks.includes(c.a) || marks.includes(c.b)) || alibis(data, a, needs).length > 0); };
        for (const o of observations) {
            if (o.q !== q.id || o.if || !o.from.every((f) => typeof f === 'string' || Array.isArray(f.any))) continue;
            const fixed = o.from.filter((f) => typeof f === 'string'), anys = o.from.filter((f) => typeof f !== 'string');
            // Every choice among "any one of" must contradict it (one such group at most is tried one by one).
            const sets = anys.length ? anys[0].any.map((x) => [...fixed, x, ...anys.slice(1).flatMap((g) => g.any)]) : [fixed];
            if (anys.length > 1) continue;
            if (!right && sets.every(against)) out.push({ id: `t.${o.id.replace(/^o\./, '')}.${n}`, q: q.id, from: [o.id], says: `${o.says}: one of the answers cannot stand with that`, rules_out: [p.value], ...other(q, p), table: true });
            else if (aims.length && sets.every((ids) => alibis(data, told.filter((x) => ids.includes(x.fact)), aims).length > 0)) out.push({ id: `t.${o.id.replace(/^o\./, '')}.${n}`, q: q.id, from: [o.id], says: `${o.says}: had one of the answers been the aim, something would have been done toward it${unless.length ? ', unless its doer was mistaken about where it was' : ''}`, rules_out: [p.value], strength: LIKELY, table: true, ...(unless.length ? { unless } : {}) });
        }
    });
    // A paper that speaks of what was not yet so on its date (2026-11-22; finding 120): an answer that has a thing made
    // at a time (`asserts: {of, attr: 'made', time: {at}}`), an entry of the thing that gives that date (`dated`), an
    // entry of it that speaks of something (`speaks_of: {of, attr?, value?}`), and an entry of that something which
    // happened (an action) or began (`begins: true`) later. Each entry must be what an observation of the question
    // comes from.
    {
        const order = data.order ?? timeOrder(data.times), facts = (data.facts ?? []).filter((f) => f.truth !== false);
        const obs = (qid, f) => observations.filter((o) => o.q === qid && !o.if && o.from.every((x) => typeof x === 'string') && o.from.includes(f)).sort((a, b) => a.from.length - b.from.length)[0];
        // Where the paper's entry gives its own words (`words`), what it speaks of is the reader's to point out: the
        // rule then rests on the observation of that reading (`{reasoned: "speaks", premises: [entry, what it speaks of]}`).
        const read = (qid, g, h) => observations.find((o) => o.q === qid && !o.if && o.from.length === 1 && o.from[0]?.reasoned === 'speaks' && (o.from[0].premises ?? []).includes(g) && (o.from[0].premises ?? []).includes(h));
        for (const q of data.questions) (q.possibilities ?? []).forEach((p, n) => {
            if (isRight(q, p.value)) return;
            for (const a of list(p.asserts)) {
                const at = a.attr === 'made' && !a.neg && a.time?.at;
                if (!at) continue;
                for (const d of facts.filter((f) => f.of === a.of && f.dated === at)) for (const g of facts.filter((f) => f.of === a.of && f.speaks_of && (f.dated ?? at) === at)) {
                    const so = g.speaks_of, h = facts.find((f) => f.of === so.of && (so.attr == null || f.attr === so.attr) && (so.value == null || f.value === so.value) && (f.begins || f.attr === 'action') && order.lt(at, f.time?.at ?? f.time?.from ?? at));
                    const from = h && [...new Set([obs(q.id, d.id), g.words || g.reads_as ? read(q.id, g.id, h.id) : obs(q.id, g.id), obs(q.id, h.id)])];
                    if (!h || from.some((o) => !o) || out.some((t) => t.id === `t.dated.${n}`)) continue;
                    out.push({ id: `t.dated.${n}`, q: q.id, from: from.map((o) => o.id), says: `${from.map((o) => o.says).join('; ')}: it speaks of what was not yet so on its date`, rules_out: [p.value], ...other(q, p), table: true });
                }
            }
        });
    }
    // When it could have been done (`deedTimes`, 2026-11-22): the true entries close part of the act's window (nobody
    // was at the place), and an answer's agent was elsewhere through all that is left. Likely only: it rests on what
    // witnesses did not see. Each entry it rests on must be what some observation of the question comes from.
    const trueIds = (data.facts ?? []).filter((f) => f.truth !== false).map((f) => f.id);
    const obsOf = (qid, f) => observations.filter((o) => o.q === qid && !o.if && o.from.every((x) => typeof x === 'string') && o.from.includes(f)).sort((a, b) => a.from.length - b.from.length)[0];
    for (const q of data.questions) (q.possibilities ?? []).forEach((p, n) => {
        if (isRight(q, p.value)) return;
        const act = answerAction(q, p.value, isEntity);
        if (!act || act.of !== p.value) return;
        const dt = deedTimes(data, act, trueIds, undefined, ctx);
        if (!dt || !dt.left.length) return;
        const pl = data.places ?? places(data), order = data.order ?? timeOrder(data.times);
        const mine = told.filter((x) => x.attr === 'location' && !x.neg && x.of === p.value && typeof x.value === 'string' && !pl.chain(x.value).includes(dt.place));
        const through = (l) => mine.find((x) => { const k = coverOf(x.time); return !!k && order.le(k.start, l.from) && order.le(l.to, k.end); });
        const alibi = dt.left.map(through);
        if (!alibi.every(Boolean)) return;
        const obs = [...new Set([...dt.closed.flatMap((k) => k.facts), ...alibi.map((x) => x.fact)])].map((f) => obsOf(q.id, f));
        if (!obs.every(Boolean)) return;
        const from = [...new Set(obs.map((o) => o.id))];
        out.push({ id: `t.when.${n}`, q: q.id, from, says: `${obs.map((o) => o.says).join('; ')}: one of the answers was elsewhere whenever it could have been done`, rules_out: [p.value], strength: LIKELY, table: true });
    });
    // (Likely only, by the user's ruling: who holds a key is not who used one; a key can be borrowed.)
    // A key the deed needs and an answer has not (2026-11-23; finding 121): the suspect table's means, where a true
    // entry denies the key ("it has two keys: X's and Y's", a statement about everyone else). From the observation of
    // each entry it rests on.
    for (const q of data.questions) {
        const picks = (q.possibilities ?? []).filter((p) => !isRight(q, p.value) && isEntity(p.value));
        if (!picks.length || !answerAction(q, picks[0].value, isEntity)) continue;
        // What the deed needs only once another question is answered so: taken as answered, and that question a premise.
        const conds = conditionsOf(q).filter((k) => isRight(data.questions.find((x) => x.id === k.q), k.pick));
        const rows = suspectGrid(data, q, picks.map((p) => p.value), trueIds, undefined, { ...ctx, solved: Object.fromEntries(conds.map((k) => [k.q, k.pick])) }) ?? [];
        for (const r of rows) {
            const cell = r.means.find((m) => m.status === 'against' && (m.req?.key || m.req?.cannot) && m.facts?.length) ?? r.motive.find((m) => m.status === 'against' && m.req?.undone);
            const obs = cell && cell.facts.map((f) => obsOf(q.id, f));
            if (!cell || obs.some((o) => !o)) continue;
            const from = [...conds.map((k) => ({ solved: k.q })), ...new Set(obs.map((o) => o.id))], n = q.possibilities.findIndex((p) => p.value === r.pick);
            if (out.some((t) => t.q === q.id && t.rules_out[0] === r.pick && JSON.stringify(t.from) === JSON.stringify(from))) continue;
            out.push({ id: `t.${cell.req.cannot ? 'cannot' : cell.req.undone ? 'want' : 'key'}.${n}`, q: q.id, from, says: `${[...new Set(obs)].map((o) => o.says).join('; ')}: one of the answers ${cell.req.cannot ? 'could not have done it' : cell.req.undone ? 'had said they wanted what it undid' : 'had no key for it'}`, rules_out: [r.pick], ...(cell.req.cannot ? {} : { strength: LIKELY }), table: true });
        }
        // The list of answers closed (2026-11-24; finding 133): a true statement about everyone ("nobody but X and Y")
        // that denies what the deed needs of its doer, a key or its place through the whole window, to all but people
        // who are among the answers. "Something else" (the answers always offered) is then ruled out, as likely only:
        // it rests on what a witness or a record did not show. From the observation of that entry. With every other
        // answer ruled out too, the one left is concluded by elimination (`verdict`).
        const open = (q.possibilities ?? []).filter((p) => p.via === 'always' && !isRight(q, p.value)).map((p) => p.value);
        const act = answerAction(q, picks[0].value, isEntity, Object.fromEntries(conds.map((k) => [k.q, k.pick])));
        if (!open.length || !act || act.of !== picks[0].value) continue;
        const pl = data.places ?? places(data), order = data.order ?? timeOrder(data.times), w = coverOf(act.time);
        const reqs = (pointImplications(act, undefined, { ...ctx, places: pl, solved: Object.fromEntries(conds.map((k) => [k.q, k.pick])) }).entries ?? []).filter((r) => r.role === 'requires' && r.of === act.of);
        // One it excepts may be a narrator, who is no listed answer: the one telling the story is taken as accounted for
        // (2026-11-25; finding 143; likely only, as the rule is).
        const answers = new Set(q.possibilities.map((p) => p.value)), narrators = new Set((data.narrators ?? []).map((n) => n.id));
        const denies = (f) => {
            if (f.attr === 'carrying') return reqs.some((r) => r.key && f.key === r.key);
            const k = coverOf(f.time);
            return f.attr === 'location' && !!w && !!k && order.le(k.start, w.start) && order.le(w.end, k.end) && reqs.some((r) => r.place && pl.chain(r.place).includes(f.value));
        };
        (data.facts ?? []).filter((f) => f.truth !== false && f.of === '*' && f.neg && list(f.every).includes('person') && list(f.but).every((b) => answers.has(b) || narrators.has(b)) && denies(f)).forEach((f, n) => {
            const o = obsOf(q.id, f.id);
            if (o) out.push({ id: `t.closed.${q.id.replace(/^q\./, '')}.${n}`, q: q.id, from: [...conds.map((k) => ({ solved: k.q })), o.id], says: `${o.says}: nobody else could have done it`, rules_out: open, strength: LIKELY, table: true });
        });
    }
    // The same for a question of who someone was (2026-11-26; finding 149): a typed act of the one in question that
    // needs a key ("the figure came out by the side door"), and a true statement that nobody but people among the
    // answers has that key. Whoever the figure was did that act, so "something else" is ruled out, as likely. From the
    // observations of the act and of the statement.
    {
        const pl = data.places ?? places(data), narrators = new Set((data.narrators ?? []).map((n) => n.id));
        for (const q of data.questions) {
            if (q.entry?.attr !== 'identity' || !q.entry.of) continue;
            const open = (q.possibilities ?? []).filter((p) => p.via === 'always' && !isRight(q, p.value)).map((p) => p.value), answers = new Set(q.possibilities.map((p) => p.value));
            if (!open.length) continue;
            for (const a of (data.facts ?? []).filter((f) => f.truth !== false && f.of === q.entry.of && f.attr === 'action' && list(f.act).length && !f.neg)) {
                const keys = (pointImplications(a, undefined, { ...ctx, places: pl }).entries ?? []).filter((r) => r.role === 'requires' && r.of === a.of && r.key).map((r) => r.key);
                (data.facts ?? []).filter((f) => f.truth !== false && f.of === '*' && f.neg && f.attr === 'carrying' && keys.includes(f.key) && list(f.every).includes('person') && list(f.but).every((b) => answers.has(b) || narrators.has(b))).forEach((f, n) => {
                    const oa = obsOf(q.id, a.id), of = obsOf(q.id, f.id);
                    if (oa && of && !out.some((t) => t.id === `t.closed.${q.id.replace(/^q\./, '')}.${n}`)) out.push({ id: `t.closed.${q.id.replace(/^q\./, '')}.${n}`, q: q.id, from: [...new Set([oa.id, of.id])], says: `${[...new Set([oa, of])].map((o) => o.says).join('; ')}: nobody else could have been the one`, rules_out: open, strength: LIKELY, table: true });
                });
            }
        }
    }
    return out;
}
/** A case's implications with the table's own added (those not already written by hand with the same premise and answer). */
export function withTable(implications, data, observations) {
    const same = (t) => t.from.length === 1 && implications.some((i) => i.q === t.q && i.from.length === 1 && i.from[0] === t.from[0] && (i.rules_out ?? []).includes(t.rules_out[0]));
    // Where a written rule concludes an answer, the table does not conclude it on less (the author asks for more:
    // two witnesses, not one); it still rules the other answer out.
    const written = (t) => implications.some((i) => i.q === t.q && i.concludes === t.concludes);
    return [...implications, ...tableRules(data, observations).filter((t) => !same(t)).map((t) => { if (t.concludes == null || !written(t)) return t; const { concludes, ...rest } = t; return rest; })];
}

/**
 * Strength (2026-11-18): how strong what follows is, on the scale of trust (engine/world.js `LEVELS`): as its
 * weakest step by the best way to it. A step is a premise, as far as the statement under it is trusted
 * (`levelOfStatement(id)`: an observation's level; null: not shown), or a rule: certain unless it says
 * `strength: 'likely'` (a step that is probable and not forced: an aim that nothing was done toward; initials that
 * are "surely" the clerk's), and then worth likely at most. `all` is as strong as its weakest, `any` as its best
 * that holds; a question solved needs no trust. `support`: an implication's id, `{all: [supports]}` or
 * `{any: [supports]}`; `derived`: the implications that hold. Null: it does not hold.
 */
export const LIKELY = 'likely';
export function strength(support, derived, levelOfStatement = () => CONFIRMED) {
    const byId = new Map(derived.map((i) => [i.id, i]));
    const least = (xs) => (xs.some((x) => x == null) ? null : Math.min(CONFIRMED, ...xs));
    const best = (xs) => { const ok = xs.filter((x) => x != null); return ok.length ? Math.max(...ok) : null; };
    const of = (s, trail) => {
        if (typeof s !== 'string') return s.all ? least(s.all.map((x) => of(x, trail))) : best((s.any ?? []).map((x) => of(x, trail)));
        const i = byId.get(s);
        if (!i) return levelOfStatement(s);
        if (trail.includes(s)) return null;
        const l = least(i.from.map((p) => (typeof p === 'string' ? of(p, [...trail, s]) : p.any ? best(p.any.map((x) => of(x, [...trail, s]))) : CONFIRMED)));
        return l == null ? null : i.strength === LIKELY ? Math.min(l, LIKELY_LEVEL) : l;
    };
    return of(support, []);
}
/** Whether what follows is certain: confirmed throughout by some way to it. `shown(id)`: an observation is shown (and taken as confirmed). */
export const certain = (support, derived, shown = () => true) => strength(support, derived, (id) => (shown(id) ? CONFIRMED : null)) === CONFIRMED;

/**
 * When a deed could have been done (2026-11-22; finding 118, step 3): the act needs its agent at a place at some
 * moment of the window, and for a stretch of the window the entries shown say nobody was: a statement about everyone
 * (`of: "*"`, a location denied) of the place itself, of a place it lies in, or of the far side of its one door
 * (`joins`), with each person it excepts denied the place (or the far side) for the whole stretch too. Returns null
 * when nothing shown closes any of the window, else `{place, closed: [{from, to, facts}], left: [{from, to,
 * after}]}`: the stretches that are left, by the case's time points (`after`: the closed point just before).
 */
export function deedTimes(data, act, shown, nameOf = (id) => id, ctx = {}) {
    const order = data.order ?? timeOrder(data.times), pl = data.places ?? places(data), joins = ctx.joins ?? data.joins ?? {};
    const w = coverOf(act?.time);
    if (!act || !w) return null;
    const place = (pointImplications(act, nameOf, { joins, order, places: pl, ...ctx }).entries ?? []).find((r) => r.role === 'requires' && r.of === act.of && r.place)?.place;
    if (!place) return null;
    const has = new Set(shown), list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
    const told = assertions(data).filter((x) => x.kind === 'state' && x.fact != null && has.has(x.fact) && !x.mark && x.attr === 'location' && x.neg && typeof x.value === 'string' && coverOf(x.time));
    // Each way into the place (`joins`: {door: [inside, outside]}), and what closes it for a stretch: the door seen
    // shut or locked throughout, or everyone denied its far side (when the place has that one door only, since a far
    // side shared with another door says nothing of which was used). Everyone denied the place itself, or a place it
    // lies in, closes every way at once. A stretch is closed when every way is (2026-11-23; finding 124: a room with
    // two doors, each watched by a different witness, is closed only while both are).
    const doors = Object.entries(joins).filter(([, sides]) => sides.includes(place)).map(([door, sides]) => ({ door, far: sides.find((p) => p !== place) }));
    const covers = (k, s) => order.le(k.start, s.start) && order.le(s.end, k.end);
    const everyone = told.filter((x) => x.of === '*' && list(x.every).includes('person'));
    const excepted = (e, bars) => { const s = coverOf(e.time); const rest = list(e.but).map((b) => told.find((x) => x.of === b && bars(x.value) && covers(coverOf(x.time), s))); return rest.every(Boolean) ? [e.fact, ...rest.map((x) => x.fact)] : null; };
    const inPlace = (v) => pl.chain(place).includes(v);
    const spans = [];   // {from, to, facts, door: the way it closes, or null for every way}
    for (const e of everyone.filter((x) => inPlace(x.value))) { const facts = excepted(e, inPlace), s = coverOf(e.time); if (facts) spans.push({ from: s.start, to: s.end, facts, door: null }); }
    if (doors.length === 1) { const far = (v) => inPlace(v) || pl.chain(doors[0].far).includes(v); for (const e of everyone.filter((x) => !inPlace(x.value) && far(x.value))) { const facts = excepted(e, far), s = coverOf(e.time); if (facts) spans.push({ from: s.start, to: s.end, facts, door: null }); } }
    const doorStates = assertions(data).filter((x) => x.kind === 'state' && x.fact != null && has.has(x.fact) && !x.mark && x.attr === 'door' && !x.neg && (x.value === 'shut' || x.value === 'locked') && coverOf(x.time) && !coverOf(x.time).incl);
    for (const d of doors) for (const x of doorStates.filter((y) => y.of === d.door)) { const s = coverOf(x.time); spans.push({ from: s.start, to: s.end, facts: [x.fact], door: d.door }); }
    const at = (t, sp) => order.le(sp.from, t) && order.le(t, sp.to);
    const closedAt = (t) => { const all = spans.find((sp) => sp.door == null && at(t, sp)); if (all) return [all]; const each = doors.map((d) => spans.find((sp) => sp.door === d.door && at(t, sp))); return doors.length && each.every(Boolean) ? each : null; };
    const inWindow = (data.times ?? []).map((t) => t.id).filter((t) => order.le(w.start, t) && order.le(t, w.end)).sort((a, b) => (a === b ? 0 : order.le(a, b) ? -1 : 1));
    const closed = [];
    for (const t of inWindow) {
        const by = closedAt(t);
        if (!by) continue;
        const facts = [...new Set(by.flatMap((sp) => sp.facts))], last = closed.at(-1);
        if (last && last.next === t && last.facts.length === facts.length && facts.every((f) => last.facts.includes(f))) { last.to = t; last.next = inWindow[inWindow.indexOf(t) + 1]; }
        else closed.push({ from: t, to: t, facts, next: inWindow[inWindow.indexOf(t) + 1] });
    }
    for (const k of closed) delete k.next;
    if (!closed.length) return null;
    const pts = (data.times ?? []).map((t) => t.id).filter((t) => order.le(w.start, t) && order.le(t, w.end)).sort((a, b) => (a === b ? 0 : order.le(a, b) ? -1 : 1));
    const shut = (t) => closed.some((k) => order.le(k.from, t) && order.le(t, k.to));
    const left = [];
    pts.forEach((t, i) => {
        if (shut(t)) return;
        const prev = i > 0 ? pts[i - 1] : null;
        if (prev && !shut(prev) && left.length) left.at(-1).to = t;
        else left.push({ from: t, to: t, after: prev && shut(prev) ? prev : null });
    });
    return { place, closed, left };
}
/** `deedTimes` for a question: by the act of the first of `picks` whose answer is a typed act (the stretches are the same for each). */
export function deedTimesOf(data, q, picks, shown, nameOf = (id) => id, ctx = {}) {
    const kindOf = entityKinds(data);
    for (const pick of picks) { const act = answerAction(q, pick, (id) => kindOf(id) != null); if (act && act.of === pick) return deedTimes(data, act, shown, nameOf, ctx); }
    return null;
}
/**
 * Means, opportunity and motive (2026-11-21; docs/authored-stories.md, finding 116): each suspect of a "who"
 * question against what the act needs of its agent, by the action table, as far as the entries the player has
 * shown say (`shown`: the ids of the facts linked to the question and trusted). Nothing is hand-written: the act is
 * the question's typed entry with the suspect as its agent (`answerAction`), its needs are the table's
 * (`pointImplications`), and a motive is a goal the suspect holds (a shown fact of theirs with `goal`) that
 * something the act brings about meets.
 * Returns null when no suspect's answer is a typed act, else `[{pick, opportunity, means, motive}]`, each a list of
 * `{status: 'met' | 'against', req, facts: [ids]}`: a need appears only when something shown meets it or is against
 * it, so the grid names nothing the player has not shown. Opportunity is a need to be at a place or a door (against:
 * shown whereabouts elsewhere that cover the whole window, as `alibis`); means, any other need of the agent (a key,
 * something carried, something known).
 */
export function suspectGrid(data, q, picks, shown, nameOf = (id) => id, ctx = {}) {
    const order = data.order ?? timeOrder(data.times), pl = data.places ?? places(data);
    const kindOf = entityKinds(data), isEntity = (id) => kindOf(id) != null;
    const c = { joins: data.joins ?? {}, order, places: pl, ...ctx };
    const has = new Set(shown);
    const told = assertions(data).filter((x) => x.kind === 'state' && x.fact != null && has.has(x.fact) && !x.mark);
    const entries = data.facts.filter((f) => has.has(f.id));
    const rows = [];
    for (const pick of picks) {
        const act = answerAction(q, pick, isEntity, ctx.solved);
        if (!act || act.of !== pick) continue;
        const mark = markAssertions(data, { [q.id]: { [pick]: 'circled' } })[0] ?? { id: hypothesisKey(q.id, pick) };
        const w = coverOf(act.time);
        const within = (t) => { const k = coverOf(t); return !w || !k || overlaps(order, k, w); };
        // What is carried is kept until something says otherwise: begun by the window's end, and not over before its start.
        const kept = (t) => { const s0 = t?.at ?? t?.from; return !w || (t?.at ? within(t) : !!s0 && order.le(s0, w.end) && !(t.to && order.lt(t.to, w.start))); };
        const row = { pick, opportunity: [], means: [], motive: [] };
        for (const req of (pointImplications(act, nameOf, c).entries ?? []).filter((r) => r.role === 'requires' && r.of === pick)) {
            const where = req.at ? (c.joins[req.at] ?? []) : req.place ? [req.place] : null;
            if (where) {
                // Where the entries shown leave only part of the window (`deedTimes`), the suspect is judged against what
                // is left: elsewhere through every stretch of it is against; away from where they otherwise were, at
                // a moment of it, is a chance (`says`).
                const dt = req.place ? deedTimes(data, act, shown, nameOf, c) : null;
                const inLeft = (t) => { const k = coverOf(t); return !dt || (!!k && dt.left.some((l) => order.le(l.from, k.end) && order.le(k.start, l.to))); };
                const elsewhere = (time) => alibis(data, told, [{ mark, of: pick, places: where, time, label: '' }]);
                // A stretch left that is one time point: elsewhere at that point (`alibis` asks a window with two ends).
                const at = (t) => told.filter((x) => x.attr === 'location' && !x.neg && x.of === pick && typeof x.value === 'string' && !where.some((p) => pl.chain(x.value).includes(p)) && (() => { const k = coverOf(x.time); return !!k && order.le(k.start, t) && order.le(t, k.end); })()).map((x) => ({ a: x }));
                const parts = dt ? dt.left.map((l) => (l.from === l.to ? at(l.from) : elsewhere({ from: l.from, to: l.to }))) : [];
                const no = !w ? [] : dt ? (dt.left.length && parts.every((p) => p.length) ? parts.flat() : []) : elsewhere(act.time);
                const yes = told.filter((x) => x.attr === 'location' && !x.neg && x.of === pick && typeof x.value === 'string' && where.some((p) => pl.chain(x.value).includes(p)) && within(x.time) && inLeft(x.time));
                const away = dt && !no.length && !yes.length ? told.filter((x) => x.attr === 'location' && x.neg && x.of === pick && typeof x.value === 'string' && !where.some((p) => pl.chain(p).includes(x.value)) && inLeft(x.time)) : [];
                if (away.length) { row.opportunity.push({ status: 'met', req, says: `away from ${away.map((x) => nameOf(x.value)).join(', ')} when it could have been done`, facts: [...new Set(away.map((x) => x.fact))] }); continue; }
                if (no.length) row.opportunity.push({ status: 'against', req, facts: [...new Set(no.map((k) => k.a.fact))] });
                else if (yes.length) row.opportunity.push({ status: 'met', req, facts: [...new Set(yes.map((x) => x.fact))] });
                continue;
            }
            if (req.key || req.item) {
                // A record that names everyone ("one key drawn that evening") is about each person it does not except.
                const isOf = (e) => e.of === pick || (e.of === '*' && [e.every].flat().includes(kindOf(pick)) && ![e.but ?? []].flat().includes(pick));
                const fit = (e) => e.attr === 'carrying' && isOf(e) && (req.key ? e.key === req.key : (e.item ?? String(e.value).split(/[ ,]/)[0]) === req.item) && kept(e.time);
                // A typed act of the suspect's that leaves them with it (drawing a key: `keep_key`) counts as carrying it.
                const got = entries.filter((e) => e.of === pick && e.act).flatMap((e) => productsOf(e, nameOf, c).filter((p) => !p.cond).map((p) => ({ ...p, id: e.id })));
                const yes = [...entries, ...got].filter((e) => fit(e) && !e.neg), no = entries.filter((e) => fit(e) && e.neg);
                if (yes.length) row.means.push({ status: 'met', req, facts: [...new Set(yes.map((e) => e.id))] });
                else if (no.length) row.means.push({ status: 'against', req, facts: no.map((e) => e.id) });
                continue;
            }
            const st = requirementStatus(order, entries, req, c);
            if (st.status !== 'unknown' && st.entry) (req.away ? row.opportunity : row.means).push({ status: st.status, req, facts: [st.entry.id] });
        }
        // An entry of the suspect that says they could not have done a deed of this kind (`cannot: [act]`: an ankle in
        // splints, and a bale to carry; 2026-11-23, finding 121).
        const acts = [act.act ?? []].flat();
        for (const e of entries) if (e.of === pick && [e.cannot ?? []].flat().some((a) => acts.includes(a))) row.means.push({ status: 'against', req: { cannot: true }, says: 'could not have done it', facts: [e.id] });
        const brings = productsOf(act, nameOf, c);
        for (const e of entries) {
            if (!e.goal || e.of !== pick) continue;
            if (brings.some((p) => meets(p, { of: e.goal.of, attr: e.goal.attr, value: e.goal.value, neg: !!e.goal.neg }, c))) row.motive.push({ status: 'met', req: { of: e.goal.of, attr: e.goal.attr, value: e.goal.value, neg: !!e.goal.neg }, facts: [e.id] });
            // A want the deed undoes (2026-11-23; finding 125): what the want needs (`goal.needs`: states) and the deed
            // brings about the opposite of ("to beat it on the bench" needs it not kept off the bench).
            const undone = [e.goal.needs ?? []].flat().find((n) => brings.some((p) => meets(p, { of: n.of, attr: n.attr, value: n.value, neg: !n.neg }, c)));
            if (undone) row.motive.push({ status: 'against', req: { undone: true }, says: 'it undid what they said they wanted', facts: [e.id] });
        }
        // Gain and loss: what the thing the act makes or handles gives a person or takes from them (`gives`, `takes` on
        // an entry of that thing), and what it takes by revoking another thing (`revokes`) that gave it.
        const things = [act.item, act.thing].filter(Boolean), list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
        const what = (g) => (g.what == null ? 'by it' : isEntity(g.what) ? nameOf(g.what) : g.what);
        const about = entries.filter((e) => things.includes(e.of));
        for (const e of about) {
            for (const g of list(e.gives)) if (g.to === pick) row.motive.push({ status: 'met', req: { gain: g.what ?? null }, says: `gains ${what(g)}`, facts: [e.id] });
            for (const g of list(e.takes)) if (g.from === pick) row.motive.push({ status: 'against', req: { loss: g.what ?? null }, says: `loses ${what(g)}`, facts: [e.id] });
            if (e.revokes) for (const u of entries.filter((x) => x.of === e.revokes)) for (const g of list(u.gives)) {
                if (g.to !== pick || about.some((x) => list(x.gives).some((k) => k.to === pick && (k.what === g.what || k.all)))) continue;
                row.motive.push({ status: 'against', req: { loss: g.what ?? null }, says: `loses ${what(g)}`, facts: [u.id, e.id] });
            }
        }
        // A tie: the suspect is for or against a person (`tie: {to, kind}` on an entry of the suspect's), and the act
        // helps or harms that person (`helps`, `harms` on the act). For and helps, or against and harms, is a motive.
        for (const e of entries) for (const t of list(e.tie)) {
            if (e.of !== pick) continue;
            const does = act.helps === t.to ? 'helps' : act.harms === t.to ? 'harms' : null;
            if (!does) continue;
            const fits = (t.kind === 'for') === (does === 'helps');
            row.motive.push({ status: fits ? 'met' : 'against', req: { tie: t.to }, says: `${t.kind === 'for' ? 'for' : 'against'} ${nameOf(t.to)}, whom it ${does}`, facts: [e.id] });
        }
        // A threat removed: a thing threatens a person (`threat: {to, by}` on any entry; `to` a person, or `{answer:
        // <question>}`: whoever that question's answer is, once it is solved), and the act removes the thing
        // (`removes: <thing>`, or `{thing, if: {q, pick}}`: only once that question is solved so). `ctx.solved` is
        // the answers solved so far, by question.
        const solved = ctx.solved ?? {};
        const gone = list(act.removes).filter((r) => typeof r === 'string' || solved[r.if?.q] === r.if?.pick).map((r) => (typeof r === 'string' ? r : r.thing));
        for (const e of entries) for (const t of list(e.threat)) {
            const to = typeof t.to === 'string' ? t.to : solved[t.to?.answer];
            if (to === pick && gone.includes(t.by)) row.motive.push({ status: 'met', req: { threat: t.by }, says: `threatened by ${nameOf(t.by)}, which it would remove`, facts: [e.id] });
        }
        rows.push(row);
    }
    return rows.length ? rows : null;
}
