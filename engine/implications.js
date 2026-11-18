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
