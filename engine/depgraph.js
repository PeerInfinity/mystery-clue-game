// The player's actions as an Archipelago-CC DepGraph (docs/depgraph.md): the story cut into stretches, the moves of a
// playthrough between them. A move depends on the stretch that holds its material and on the moves that first gave the
// cards it needs; a stretch depends on the one before, on the move that first makes each row due at its first paragraph,
// and on every move lost there (a build once the story states its inference, a proposal once its question is settled);
// "The end", the one sink (DepGraph's goal is the node last in its order), on the last stretch and any move nothing
// waits on. Written by scripts/depgraph.js (npm run depgraph); checked by engine/depgraph.test.js.
import { dependencies, needs, movesOf } from './minimalTable.js';
import { madeRows } from './hints.js';

/** The maximum version's title and goal. */
export const MAX = { title: 'Silver Blaze: the maximum score (Hard, 70 ahead of Holmes)', end: 'The end: 70 ahead of Holmes' };

const sid = (i) => `story.${String(i + 1).padStart(2, '0')}`;
const mid = (seq) => `move.${seq}`;
const short = (s, n) => (s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : s);

/**
 * The maximum version's data, from the minimal playthrough (action-table-minimal.json) and hints.json (`lost`): each
 * move with the paragraph its material is first all read (`from`) and where it is lost; each row with the move after
 * which the replay first makes it (`by`). → {moves: [{...move, from, lost?, needs: [seq]}], rows: [{thought, family, deadline, by}]}
 */
export function maxData(model, table, minimal, hints) {
    const madeBy = new Map();
    const gotBy = new Map();
    let last = null;
    let g0 = null;
    // A theory is held in the page from its answers' chips: each question shown and each answer offered (its card held),
    // as for a proposal (`needs`); the move or paragraph after which each question first shows.
    const theorySlots = new Set(movesOf(minimal).filter((m) => m.op === 'theory').flatMap((m) => Object.keys(m.assignment)));
    const shown = new Map();
    const { all, depsOf, provider, settles } = dependencies(model, minimal, { onMove: (m, got, g) => {
        g0 = g;
        if (m) { last = m.seq; gotBy.set(m.seq, got); }
        for (const x of theorySlots) if (!shown.has(x) && g.slotVisible(x)) shown.set(x, m ? m.seq : { at: g.read - 1 });
        if (last !== null) for (const k of madeRows(g)) if (!madeBy.has(k)) madeBy.set(k, last);
    } });
    // A move gives an implicit inference (and what it raises) only if its other premises, and the cards its formula
    // speaks of, are held: the moves that gave them come first (collect 192 shows what the paper packet held only with
    // "the paper in his hand", move 75's, and Simpson's card held).
    const extra = new Map(all.map((m) => [m.seq, new Set()]));
    const atLeast = new Map();
    for (const m of all) for (const k of gotBy.get(m.seq) ?? []) {
        const inf = g0.inferenceById.get(k);
        if (!inf?.implicit) continue;
        for (const c of [...inf.premises, ...g0.inferenceWaits.get(k)]) {
            const q = provider.get(c);
            if (typeof q === 'number') { if (q !== m.seq) extra.get(m.seq).add(q); } else if (q) atLeast.set(m.seq, Math.max(atLeast.get(m.seq) ?? 1, q.at));
        }
    }
    for (const m of all) if (m.op === 'theory') for (const [x, v] of Object.entries(m.assignment)) {
        for (const q of [shown.get(x), model.cards.has(v) ? provider.get(v) : undefined]) {
            if (typeof q === 'number') { if (q !== m.seq) extra.get(m.seq).add(q); } else if (q) atLeast.set(m.seq, Math.max(atLeast.get(m.seq) ?? 1, q.at));
        }
    }
    const depsOf2 = (m) => new Set([...depsOf(m), ...extra.get(m.seq)]);
    const lost = new Map(hints.moves.filter((m) => m.lost !== undefined).map((m) => [m.seq, m.lost]));
    for (const m of all) if (m.op === 'candidate' && settles.get(m.slot) !== Infinity) lost.set(m.seq, Math.min(lost.get(m.seq) ?? Infinity, settles.get(m.slot)));
    // Where a move's material is all read: its words, and for each card it needs the paragraph that brought it (or the
    // move that gave it, from that move's own paragraph).
    const from = new Map();
    for (const m of all) {
        let p = Math.max(m.op === 'collect' ? m.from : 1, atLeast.get(m.seq) ?? 1);
        for (const c of needs(model, m)) {
            const q = c && provider.get(c);
            if (typeof q === 'number') { if (q !== m.seq) p = Math.max(p, from.get(q)); } else if (q) p = Math.max(p, q.at);
        }
        for (const d of depsOf2(m)) p = Math.max(p, from.get(d));
        from.set(m.seq, p);
    }
    const rows = [];
    for (const r of table.thoughts) for (const s of r.scores.filter((x) => x.scored)) {
        const by = madeBy.get(`${r.id}|${s.family}`);
        if (by === undefined) throw new Error(`depgraph: the minimal playthrough never makes ${r.id} (${s.family})`);
        rows.push({ thought: r.id, family: s.family, deadline: s.deadline, by });
    }
    return {
        moves: all.map(({ was, ...m }) => ({ ...m, from: from.get(m.seq), needs: [...depsOf2(m)].sort((a, b) => a - b), ...(lost.has(m.seq) && { lost: lost.get(m.seq) }) })),
        rows,
    };
}

/** A move in plain words (docs/depgraph.md, choice 3: spoilers are fine). */
function label(model, m) {
    const name = (id) => { const c = model.cards.get(id); return c ? c.name ?? c.label ?? c.text : id; };
    switch (m.op) {
        case 'collect': return `Collect “${short(m.words, 60)}” (¶${m.from})`;
        case 'ask': return `Ask what I know: ${name(m.card)}`;
        case 'build': return `Build: ${short(name(m.inference), 90)}`;
        case 'notice': return `Mark as odd: ${short(name(m.card), 70)}`;
        case 'raise': return `Raise an exception: ${short(name(m.target), 70)}`;
        case 'seal': return `Seal the check: ${short(name(m.check), 70)}`;
        case 'file': return `File what did not happen: ${short(name(m.expectation), 70)}`;
        case 'drop': return `Drop: ${m.target.theory ? name(m.target.theory) : `${m.target.slot} = ${m.target.value}`}`;
        case 'theory': return `Hold the theory: ${m.label}`;
        case 'candidate': return `Propose: ${m.slot} = ${m.value}`;
        default: return `${m.op}: ${m.card ?? ''}`;
    }
}

/**
 * The graph: `data` as maxData gives it, `end` the end node's label. The story is cut before every deadline and every
 * paragraph where a move is lost (D1). → {title, nodes: {id: {label, description, depends_on}}}
 */
export function depgraph(model, data, { title, end }) {
    const { moves, rows } = data;
    const last = model.story.paragraphs.length - 1;
    const cuts = [...new Set([...rows.map((r) => r.deadline), ...moves.filter((m) => m.lost !== undefined).map((m) => m.lost)])].filter((p) => p > 1).sort((a, b) => a - b);
    const stretches = [];
    let a = 1;
    for (const d of cuts) { stretches.push([a, d - 1]); a = d; }
    stretches.push([a, last]);
    const of = (p) => stretches.findIndex(([x, y]) => p >= x && p <= y);
    const nodes = {};
    stretches.forEach(([x, y], i) => {
        const due = rows.filter((r) => r.deadline === x);
        nodes[sid(i)] = { label: `Read ¶${x}–¶${y}`, description: i ? `From ¶${x}${due.length ? `, where Holmes is first to: ${due.map((r) => `${r.thought} (${r.family})`).join(', ')}` : ''}.` : 'The story from the start.', depends_on: i ? [sid(i - 1)] : [] };
    });
    for (const m of moves) nodes[mid(m.seq)] = { label: label(model, m), description: `Thought ${m.thought}; from ¶${m.from}${m.lost !== undefined ? `, before ¶${m.lost}` : ''}.`, depends_on: [sid(of(m.from)), ...m.needs.map(mid)] };
    const wait = (i, seq) => { const n = nodes[sid(i)]; if (!n.depends_on.includes(mid(seq))) n.depends_on.push(mid(seq)); };
    for (const r of rows) wait(of(r.deadline), r.by);
    for (const m of moves) if (m.lost !== undefined) wait(of(m.lost), m.seq);
    const used = new Set(Object.values(nodes).flatMap((n) => n.depends_on));
    nodes.end = { label: end, description: 'The goal.', depends_on: [sid(stretches.length - 1), ...Object.keys(nodes).filter((k) => !used.has(k) && !k.startsWith('story.'))] };
    return { title, nodes };
}

/** The file's text: one node per line (the case's data files are read and diffed by line). */
export function depgraphJson(g) {
    const lines = Object.entries(g.nodes).map(([k, n]) => `    ${JSON.stringify(k)}: ${JSON.stringify(n)}`).join(',\n');
    return `{\n "title": ${JSON.stringify(g.title)},\n "nodes": {\n${lines}\n }\n}\n`;
}

/** The rules DepGraph's loader keeps (Rules.py): every dependency a node, no cycle; and one sink, last in its order. */
export function checkGraph(g) {
    const ids = Object.keys(g.nodes);
    for (const [k, n] of Object.entries(g.nodes)) for (const d of n.depends_on) if (!g.nodes[d]) throw new Error(`${k} depends on unknown ${d}`);
    const indeg = new Map(ids.map((k) => [k, g.nodes[k].depends_on.length]));
    const out = new Map(ids.map((k) => [k, []]));
    for (const [k, n] of Object.entries(g.nodes)) for (const d of n.depends_on) out.get(d).push(k);
    const order = [];
    const q = ids.filter((k) => indeg.get(k) === 0);
    while (q.length) { q.sort(); const k = q.shift(); order.push(k); for (const u of out.get(k)) { indeg.set(u, indeg.get(u) - 1); if (!indeg.get(u)) q.push(u); } }
    if (order.length !== ids.length) throw new Error(`a cycle: sorted ${order.length} of ${ids.length}`);
    const sinks = ids.filter((k) => !out.get(k).length);
    return { order, sinks };
}

/**
 * The moves placed as the graph allows: each move made at the end of the stretch it depends on (`early`), just before
 * the first stretch that waits on it (`late`), or between them by a seeded draw, after what it needs (`random`).
 */
export function placeMoves(g, moves, mode, seed = 12345) {
    const range = (k) => g.nodes[k].label.match(/¶(\d+)–¶(\d+)/).slice(1).map(Number);
    const users = new Map();
    for (const [k, n] of Object.entries(g.nodes)) for (const d of n.depends_on) (users.get(d) ?? users.set(d, []).get(d)).push(k);
    const memo = new Map();
    const waitsAt = (k) => {
        if (!memo.has(k)) memo.set(k, Math.min(Infinity, ...(users.get(k) ?? []).map((u) => (u.startsWith('story.') ? range(u)[0] : u === 'end' ? Infinity : waitsAt(u)))));
        return memo.get(k);
    };
    const last = Math.max(...Object.keys(g.nodes).filter((k) => k.startsWith('story.')).map((k) => range(k)[1]));
    let s = seed;
    const draw = () => (s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
    const placed = moves.map((m) => {
        const k = mid(m.seq);
        const lo = range(g.nodes[k].depends_on.find((d) => d.startsWith('story.')))[1];
        const hi = Math.min(last, waitsAt(k) - 1);
        if (lo > hi) throw new Error(`${k}: no paragraph between ¶${lo} and ¶${hi}`);
        return { ...m, at: mode === 'early' ? lo : mode === 'late' ? hi : lo + Math.floor(draw() * (hi - lo + 1)), lo, hi };
    });
    if (mode === 'random') {
        const bySeq = new Map(placed.map((m) => [m.seq, m]));
        for (const m of [...placed].sort((x, y) => x.seq - y.seq)) for (const d of m.needs) m.at = Math.max(m.at, Math.min(m.hi, bySeq.get(d).at));
    }
    return placed;
}

