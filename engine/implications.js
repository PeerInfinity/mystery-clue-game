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
import { answerAction, actNeeds, pointImplications, productsOf, meets, requirementStatus } from './actions.js';

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
            if (got.includes(i) || !i.from.every((p) => holds(p, has, solved))) continue;
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
        for (const v of i.rules_out ?? []) { if (!vs.includes(v)) out.push(`${i.id}: rules out ${v}, no answer of ${i.q}`); else if (ok.includes(v)) out.push(`${i.id}: rules out ${v}, a right answer`); }
        if (i.concludes != null && !ok.includes(i.concludes)) out.push(`${i.id}: concludes ${i.concludes}, not a right answer of ${i.q}`);
    }
    // Everything shown and every question solved: every implication must hold (none rests on itself), and each
    // question that has implications must have its answer.
    const all = derive(implications, (id) => obsIds.has(id), () => true);
    for (const i of implications) if (!all.includes(i)) out.push(`${i.id}: never holds (it rests on itself, or on what does not exist)`);
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
    for (const q of data.questions) (q.possibilities ?? []).forEach((p, n) => {
        if (isRight(q, p.value)) return;
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
            if (sets.every(against)) out.push({ id: `t.${o.id.replace(/^o\./, '')}.${n}`, q: q.id, from: [o.id], says: `${o.says}: one of the answers cannot stand with that`, rules_out: [p.value], table: true });
            else if (aims.length && sets.every((ids) => alibis(data, told.filter((x) => ids.includes(x.fact)), aims).length > 0)) out.push({ id: `t.${o.id.replace(/^o\./, '')}.${n}`, q: q.id, from: [o.id], says: `${o.says}: had one of the answers been the aim, something would have been done toward it`, rules_out: [p.value], strength: LIKELY, table: true });
        }
    });
    return out;
}
/** A case's implications with the table's own added (those not already written by hand with the same premise and answer). */
export function withTable(implications, data, observations) {
    const same = (t) => implications.some((i) => i.q === t.q && i.from.length === 1 && i.from[0] === t.from[0] && (i.rules_out ?? []).includes(t.rules_out[0]));
    return [...implications, ...tableRules(data, observations).filter((t) => !same(t))];
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
        const act = answerAction(q, pick, isEntity);
        if (!act || act.of !== pick) continue;
        const mark = markAssertions(data, { [q.id]: { [pick]: 'circled' } })[0] ?? { id: hypothesisKey(q.id, pick) };
        const w = coverOf(act.time);
        const within = (t) => { const k = coverOf(t); return !w || !k || overlaps(order, k, w); };
        // What is carried is kept until something says otherwise: begun by the window's end, and not over before its start.
        const kept = (t) => { const s0 = t?.at ?? t?.from; return !w || (t?.at ? within(t) : !!s0 && order.le(s0, w.end) && !(t.to && order.le(t.to, w.start))); };
        const row = { pick, opportunity: [], means: [], motive: [] };
        for (const req of (pointImplications(act, nameOf, c).entries ?? []).filter((r) => r.role === 'requires' && r.of === pick)) {
            const where = req.at ? (c.joins[req.at] ?? []) : req.place ? [req.place] : null;
            if (where) {
                const no = w ? alibis(data, told, [{ mark, of: pick, places: where, time: act.time, label: '' }]) : [];
                const yes = told.filter((x) => x.attr === 'location' && !x.neg && x.of === pick && typeof x.value === 'string' && where.some((p) => pl.chain(x.value).includes(p)) && within(x.time));
                if (no.length) row.opportunity.push({ status: 'against', req, facts: [...new Set(no.map((k) => k.a.fact))] });
                else if (yes.length) row.opportunity.push({ status: 'met', req, facts: [...new Set(yes.map((x) => x.fact))] });
                continue;
            }
            if (req.key || req.item) {
                const fit = (e) => e.attr === 'carrying' && e.of === pick && (req.key ? e.key === req.key : (e.item ?? String(e.value).split(/[ ,]/)[0]) === req.item) && kept(e.time);
                const yes = entries.filter((e) => fit(e) && !e.neg), no = entries.filter((e) => fit(e) && e.neg);
                if (yes.length) row.means.push({ status: 'met', req, facts: yes.map((e) => e.id) });
                else if (no.length) row.means.push({ status: 'against', req, facts: no.map((e) => e.id) });
                continue;
            }
            const st = requirementStatus(order, entries, req, c);
            if (st.status !== 'unknown' && st.entry) (req.away ? row.opportunity : row.means).push({ status: st.status, req, facts: [st.entry.id] });
        }
        const brings = productsOf(act, nameOf, c);
        for (const e of entries) {
            if (!e.goal || e.of !== pick) continue;
            if (brings.some((p) => meets(p, { of: e.goal.of, attr: e.goal.attr, value: e.goal.value, neg: !!e.goal.neg }, c))) row.motive.push({ status: 'met', req: { of: e.goal.of, attr: e.goal.attr, value: e.goal.value, neg: !!e.goal.neg }, facts: [e.id] });
        }
        rows.push(row);
    }
    return rows.length ? rows : null;
}
