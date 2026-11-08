// The arrangement of things in a place, and general knowledge brought in by the player's reasoning
// (docs/ideas.md, "The arrangement of a room, and general knowledge"): a sealed place's ways in, the moves "Something
// got through" and the route, and "What else of this kind?". Pure functions over the entries the page has on the
// timeline (`known`: facts and reasoned entries); nothing here reads a case's data files.

/** What can pass, largest first. `closed_to: v` stops v and everything larger; `passes: v` lets v and everything smaller through. */
export const SIZES = ['person', 'small', 'air'];
const rank = (s) => SIZES.indexOf(s);
export const ARRANGEMENT_ATTRS = new Set(['attached', 'reaches', 'near']);
export const GENERAL = 'general knowledge';

const covers = (t, f, ctx) => !t || !f.time || !ctx?.at || ctx.at(f.time, t);

/** The openings the timeline has told of: an opening with no known fact about it is not yet a row. */
const told = (openings, known) => Object.entries(openings ?? {}).filter(([id]) => known.some((f) => f.of === id));
const within = (place, target, ctx) => place === target || (ctx?.within?.(place, target) ?? false);

/**
 * The ways into a sealed place (`{place, surfaces?, time?}`) as the timeline has them: one row for each opening and
 * surface told of, and one for each opening the player has inferred and the story has not yet shown. Each row has a
 * cell per size: `closed` or `open` with the entries behind it, or `unsaid`.
 */
export function waysIn(sealed, known, openings = {}, ctx = {}) {
    const onThis = told(openings, known).filter(([, o]) => o.sides.some((s) => within(s, sealed.place, ctx)));
    const rows = [
        ...onThis.map(([id, o]) => ({ id, kind: o.kind ?? 'opening' })),
        ...(sealed.surfaces ?? []).filter((id) => known.some((f) => f.of === id)).map((id) => ({ id, kind: 'surface' })),
    ];
    for (const e of known) {
        if (e.attr !== 'opening' || !e.sides?.some((s) => within(s, sealed.place, ctx))) continue;
        const shownBy = foundBy(e, known, openings);
        if (!shownBy) rows.push({ id: e.id, kind: 'unfound', entry: e });
    }
    return rows.map((r) => ({ ...r, cells: Object.fromEntries(SIZES.map((s) => [s, cellOf(r, s, sealed, known, ctx)])) }));
}

function cellOf(row, size, sealed, known, ctx) {
    if (row.kind === 'unfound') return rank(size) >= rank(row.entry.passes) ? { status: 'open', by: [row.entry] } : { status: 'unsaid', by: [] };
    const about = known.filter((f) => f.of === row.id && covers(sealed.time, f, ctx));
    const closed = about.filter((f) => f.attr === 'closed_to' && rank(size) <= rank(f.value));
    const open = about.filter((f) => f.attr === 'passes' && rank(size) >= rank(f.value));
    if (open.length) return { status: 'open', by: open };   // what got through outweighs a general "closed"
    if (closed.length) return { status: 'closed', by: closed };
    return { status: 'unsaid', by: [] };
}

/** The player's mark on a cell: allowed only when an entry on the timeline supports it. */
export function checkWayMark(rows, rowId, size, mark) {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return { why: 'That way in is not on the timeline.' };
    const cell = row.cells[size];
    if (!cell) return { why: `No such column: ${size}.` };
    if (mark !== 'closed' && mark !== 'open') return { why: `No such mark: ${mark}.` };
    if (cell.status !== mark) return { why: cell.status === 'unsaid' ? 'Nothing on the timeline says so yet.' : `The timeline has this ${cell.status}.` };
    return { ok: true, by: cell.by };
}

/** For one size: whether the place is sealed. `open` and `unsaid` list the rows that stop it being so. */
export function sealedFor(rows, size) {
    const open = rows.filter((r) => r.cells[size].status === 'open').map((r) => r.id);
    const unsaid = rows.filter((r) => r.cells[size].status === 'unsaid').map((r) => r.id);
    return { sealed: rows.length > 0 && !open.length && !unsaid.length, open, unsaid };
}

const joinsBoth = (sides, a, b) => sides.includes(a) && sides.includes(b);

/** The told opening that shows an inferred one, if any: it joins the same two places and lets the same size through. */
export function foundBy(entry, known, openings = {}) {
    const hit = told(openings, known).find(([id, o]) => joinsBoth(o.sides, entry.sides[0], entry.sides[1]) && known.some((f) => f.of === id && f.attr === 'passes' && rank(entry.passes) >= rank(f.value)));
    return hit?.[0] ?? null;
}

/**
 * Move "Something got through": a fact that something crossed between two places (`attr: 'passed'`, `between: [from, to]`,
 * `passes`) gives an opening between them, even if none has been found. Refused if a told opening already accounts for it.
 */
export function pointPassage(f, known = [], openings = {}) {
    if (f?.attr !== 'passed' || f.between?.length !== 2 || !SIZES.includes(f.passes)) return { why: 'That is not something crossing from one place to another.' };
    const entry = { id: `r:g:${f.id}`, of: '?', attr: 'opening', sides: f.between, passes: f.passes, para: f.para, reasoned: { move: 'g', premises: [f.id] } };
    if (foundBy(entry, known, openings)) return { why: 'A way between those two places is already on the timeline.' };
    return { entry };
}

/** The undirected links the timeline gives between places and things: through told openings, and by arrangement facts. */
export function linksOf(known, openings = {}) {
    const links = [];
    for (const [id, o] of told(openings, known)) for (const s of o.sides) links.push({ a: s, b: id, kind: 'opening', opening: id, by: known.filter((f) => f.of === id) });
    for (const f of known) if (ARRANGEMENT_ATTRS.has(f.attr) && typeof f.value === 'string') links.push({ a: f.of, b: f.value, kind: f.attr, by: [f] });
    return links;
}

/**
 * The route move: a chain the player builds, node by node. Every step must be a link on the timeline. A finished
 * route gives an entry with what must be true of anything that used it (`requirements`), and what holds its far end
 * in place (`steady`: `fixed` facts of a thing linked to the end).
 */
export function checkRoute(route, known, openings = {}) {
    if (!Array.isArray(route) || route.length < 2) return { why: 'A route runs from one thing to another.' };
    if (new Set(route).size !== route.length) return { why: 'A route does not come back on itself.' };
    const links = linksOf(known, openings);
    const steps = [];
    for (let i = 0; i < route.length - 1; i++) {
        const [a, b] = [route[i], route[i + 1]];
        const l = links.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
        if (!l) return { why: 'Nothing on the timeline links those two.', failAt: i, steps };
        steps.push({ from: a, to: b, ...l });
    }
    const requirements = [];
    const add = (r) => { if (!requirements.some((x) => JSON.stringify(x) === JSON.stringify(r))) requirements.push(r); };
    for (const s of steps) {
        if (s.kind === 'opening') {
            const sizes = known.filter((f) => f.of === s.opening && f.attr === 'passes').map((f) => f.value);
            if (sizes.length) add({ trait: 'size', value: sizes.sort((x, y) => rank(y) - rank(x))[0], by: s.opening });
        } else if (s.kind === 'attached' || s.kind === 'reaches') {
            add({ trait: 'travels', value: s.by[0].of });   // the rope, in "the rope is attached to the hook" and "the rope reaches the bed"
        }
    }
    const end = route.at(-1);
    const near = new Set([end, ...links.filter((l) => l.a === end || l.b === end).map((l) => (l.a === end ? l.b : l.a))]);
    const steady = known.filter((f) => f.attr === 'fixed' && near.has(f.of));
    const premises = [...new Set(steps.flatMap((s) => s.by.map((f) => f.id)))];
    return { ok: true, steps, requirements, steady, entry: { id: `r:r:${route.join('>')}`, of: '?', attr: 'route', value: route, requirements, reasoned: { move: 'r', premises } } };
}

/** The one chain of a piece of general knowledge: from that source to the reader, starting uncertain, keyed by its category. */
export const knowledgeKey = (category) => `general:${category}`;
export const knowledgeChain = (category, reader = 'reader') => ({ account: null, origin: GENERAL, links: [{ from: GENERAL, to: reader, how: GENERAL, know: knowledgeKey(category), uncertain: false }] });

/**
 * Move "What else of this kind?": a category (`{id, on, members}`) can be asked about once one of the facts it hangs
 * on (`on`) is on the timeline. Gives its members, each with the chain every general-knowledge line comes with.
 */
export function whatElse(category, known) {
    if (!category) return { why: 'That is not a kind of thing.' };
    if (!known.some((f) => [].concat(category.on).includes(f.id))) return { why: 'Nothing on the timeline raises that yet.' };
    return { members: category.members, chain: knowledgeChain(category.id) };
}

/** A possibility that general knowledge brings is listed only after the player's move; every other one by its paragraph. */
export const isListed = (p, para, asked = new Set()) => (p.via === 'knowledge' ? asked.has(p.category) : p.available <= para);

/**
 * Whether a candidate meets a requirement. `fits`, `fails` or `unknown`; `no test` for a requirement the data marks
 * as evidence only (`filter: false`: what shows an animal is kept, say, without saying which kind).
 */
export function fits(member, req) {
    if (req.filter === false) return 'no test';
    const v = member.traits?.[req.trait];
    if (v === undefined) return 'unknown';
    if (req.trait === 'size') return rank(v) >= rank(req.value) ? 'fits' : 'fails';
    if (req.trait === 'travels') return v ? 'fits' : 'fails';
    return v === req.value ? 'fits' : 'fails';
}

/** A candidate may be crossed out only for a requirement it fails: the page shows traits, and objects to a crossing they do not support. */
export function checkCrossing(member, reqs) {
    const failed = reqs.find((r) => fits(member, r) === 'fails');
    return failed ? { ok: true, by: failed } : { why: 'Nothing established yet rules that out.' };
}

/** The candidates against the requirements: each row with one result per requirement, and whether any fails. */
export function fitTable(members, reqs) {
    return members.map((m) => {
        const results = reqs.map((r) => fits(m, r));
        return { member: m, results, out: results.includes('fails') };
    });
}
