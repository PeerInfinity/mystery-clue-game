// The player's actions as an Archipelago-CC DepGraph: the story cut into stretches, the moves of a
// playthrough between them. A move depends on the stretch that holds its material and on the moves that first gave the
// cards it needs; a stretch depends on the one before, on the move that first makes each row due at its first paragraph,
// and on every move lost there (a build once the story states its inference, a proposal once its question is settled);
// "The end", the one sink (DepGraph's goal is the node last in its order), on the last stretch and any move nothing
// waits on. Written by scripts/depgraph.js (npm run depgraph); checked by engine/depgraph.test.js.
import { Game, WAIT } from './game.js';
import { dependencies, needs, movesOf, make } from './minimalTable.js';
import { madeRows } from './hints.js';

/** The three versions' titles and goals (choice 1). */
export const MAX = { title: 'Silver Blaze: the maximum score (Hard, 70 ahead of Holmes)', end: 'The end: 70 ahead of Holmes' };
export const WAITS = { title: 'Silver Blaze: keeping up with the story (Hard, at the pace that waits for Holmes\'s steps)', end: 'The end: the story read to its last paragraph', due: 'the story waits on' };
export const DEDUCTIONS = { title: 'Silver Blaze: every deduction before Holmes (Hard, 45 of 47)', end: 'The end: 45 deductions ahead of Holmes' };

const sid = (i) => `story.${String(i + 1).padStart(2, '0')}`;
const mid = (seq) => `move.${seq}`;
const short = (s, n) => (s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : s);

/**
 * A playthrough's moves for a graph (`play`, an action table's shape): each move with the paragraph its material is
 * first all read (`from`), the moves it needs (`needs`: those that first gave its cards, and the rules below) and where
 * it is lost (`lost`, a Map seq → paragraph, given); and the move after which the replay first makes each key `made(g)`
 * yields (`madeBy`). → {moves: [{...move, from, lost?, needs: [seq]}], madeBy: Map(key → seq), g: the replay's game}
 */
export function playData(model, play, { made, lost }) {
    const madeBy = new Map();
    const gotBy = new Map();
    let last = null;
    let g0 = null;
    // A theory is held in the page from its answers' chips: each question shown and each answer offered (its card held),
    // as for a proposal (`needs`); the move or paragraph after which each question first shows.
    const theorySlots = new Set(movesOf(play).filter((m) => m.op === 'theory').flatMap((m) => Object.keys(m.assignment)));
    const shown = new Map();
    const { all, depsOf, provider, settles } = dependencies(model, play, { onMove: (m, got, g) => {
        g0 = g;
        if (m) { last = m.seq; gotBy.set(m.seq, got); }
        for (const x of theorySlots) if (!shown.has(x) && g.slotVisible(x)) shown.set(x, m ? m.seq : { at: g.read - 1 });
        if (last !== null) for (const k of made(g)) if (!madeBy.has(k)) madeBy.set(k, last);
    } });
    // A move gives an implicit inference (and what it raises) only if its other premises, and the cards its formula
    // speaks of, are held: the moves that gave them come first (collect 192 shows what the paper packet held only with
    // "the paper in his hand", move 75's, and Simpson's card held).
    const extra = new Map(all.map((m) => [m.seq, new Set()]));
    const atLeast = new Map();
    const want = (m, q) => { if (typeof q === 'number') { if (q !== m.seq) extra.get(m.seq).add(q); } else if (q) atLeast.set(m.seq, Math.max(atLeast.get(m.seq) ?? 1, q.at)); };
    for (const m of all) for (const k of gotBy.get(m.seq) ?? []) {
        const inf = g0.inferenceById.get(k);
        if (inf?.implicit) for (const c of [...inf.premises, ...g0.inferenceWaits.get(k)]) want(m, provider.get(c));
    }
    for (const m of all) if (m.op === 'theory') for (const [x, v] of Object.entries(m.assignment)) {
        want(m, shown.get(x));
        if (model.cards.has(v)) want(m, provider.get(v));
    }
    const depsOf2 = (m) => new Set([...depsOf(m), ...extra.get(m.seq)]);
    const lostAt = new Map(lost);
    for (const m of all) if (m.op === 'candidate' && settles.get(m.slot) !== Infinity) lostAt.set(m.seq, Math.min(lostAt.get(m.seq) ?? Infinity, settles.get(m.slot)));
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
    // The moves that give what Holmes's step needs (its inferences, and an implicit one's premises): a step made after
    // the last of them needs them all, not only the last (t81.5's five inferences). Those whose material comes only at
    // the step's paragraph or later are another way to it, not this one's (t117.2 at ¶124).
    const stepMoves = (id, deadline) => {
        const out = new Set();
        for (const k of g0.stepInferences(id) ?? []) {
            const inf = g0.inferenceById.get(k);
            for (const c of [k, ...(inf?.implicit ? inf.premises : [])]) { const q = provider.get(c); if (typeof q === 'number' && from.get(q) < deadline) out.add(q); }
        }
        return [...out].sort((a, b) => a - b);
    };
    return {
        moves: all.map(({ was, ...m }) => ({ ...m, from: from.get(m.seq), needs: [...depsOf2(m)].sort((a, b) => a - b), ...(lostAt.has(m.seq) && { lost: lostAt.get(m.seq) }) })),
        madeBy, stepMoves, g: g0,
    };
}

/**
 * The maximum version's data, from the minimal playthrough (action-table-minimal.json) and hints.json (`lost`): its
 * moves (playData) and each row that scores on Hard with the move after which the replay first makes it (`by`) and, for
 * a deduction, the moves that give its step's inferences (`with`). → {moves, rows: [{thought, family, deadline, by, with}]}
 */
export function maxData(model, table, minimal, hints, { families = null } = {}) {
    const lost = new Map(hints.moves.filter((m) => m.lost !== undefined).map((m) => [m.seq, m.lost]));
    const { moves, madeBy, stepMoves } = playData(model, minimal, { made: madeRows, lost });
    const rows = [];
    for (const r of table.thoughts) for (const s of r.scores.filter((x) => x.scored && (!families || families.includes(x.family)))) {
        const by = madeBy.get(`${r.id}|${s.family}`);
        if (by === undefined) throw new Error(`depgraph: the minimal playthrough never makes ${r.id} (${s.family})`);
        rows.push({ thought: r.id, family: s.family, deadline: s.deadline, by, with: s.family === 'deduction' ? stepMoves(r.id, s.deadline) : [] });
    }
    return { moves, rows };
}

/** A table's moves restricted to `seqs` (the action table's shape). */
export const restrict = (table, seqs) => ({ ...table, thoughts: table.thoughts.map((t) => ({ ...t, moves: t.moves.filter((m) => seqs.has(m.seq)) })).filter((t) => t.moves.length) });

/** The steps the story waits on at the 'wait' pace (Game.blockers): step → the first paragraph it waits at. */
export function waitedSteps(model) {
    const g = new Game(model, { difficulty: 'hard', pace: WAIT });
    const at = new Map();
    for (const [p, ids] of g.gates) for (const id of ids) at.set(id, Math.min(at.get(id) ?? Infinity, p));
    return at;
}

/** Where the story states each inference by itself (a game that only reads): a build is lost from there. */
export function statedAt(model) {
    const g = new Game(model, { difficulty: 'hard' });
    const at = new Map();
    while (!g.finished()) { g.advance(); for (const id of g.unlocked.keys()) if (!at.has(id) && g.inferenceById.has(id)) at.set(id, g.read - 1); }
    return at;
}

/** The moves (each at its `at`) played at the 'wait' pace. → {finished, stuck: the paragraph the story waits at, or null, fails} */
export function replayWait(model, moves) {
    const g = new Game(model, { difficulty: 'hard', pace: WAIT });
    const byAt = new Map();
    for (const m of [...moves].sort((a, b) => a.seq - b.seq)) (byAt.get(m.at) ?? byAt.set(m.at, []).get(m.at)).push(m);
    const fails = [];
    for (const m of byAt.get(0) ?? []) if (!make(g, model, m)) fails.push(m.seq);
    while (!g.finished()) {
        if (!g.advance().ok) return { finished: false, stuck: g.read, fails };
        for (const m of byAt.get(g.read - 1) ?? []) if (!make(g, model, m)) fails.push(m.seq);
        g.clashes();
    }
    return { finished: true, stuck: null, fails };
}

/**
 * The story's waits' data, from a playthrough of the reader's moves (`play`): its moves (playData, a build lost where
 * the story states it) and each waited step with the move after which the replay first makes it.
 */
export function waitsData(model, play) {
    const steps = waitedSteps(model);
    const done = new Set();
    const made = (g) => [...steps.keys()].filter((id) => !done.has(id) && g.stepMade(id) && done.add(id));
    const stated = statedAt(model);
    const lost = new Map(movesOf(play).filter((m) => m.op === 'build' && stated.has(m.inference)).map((m) => [m.seq, stated.get(m.inference)]));
    const { moves, madeBy, stepMoves } = playData(model, play, { made, lost });
    const rows = [...steps].map(([id, p]) => {
        if (!madeBy.has(id)) throw new Error(`depgraph: the playthrough never makes ${id}, which the story waits on at ¶${p}`);
        return { thought: id, family: 'wait', deadline: p, by: madeBy.get(id), with: stepMoves(id, p) };
    });
    return { moves, rows };
}

/** Every deduction's data, from a playthrough of the minimal one's moves: as maxData, the deduction rows only. */
export const deductionsData = (model, table, play, hints) => maxData(model, table, play, hints, { families: ['deduction'] });

/** The moves the rows need: the moves that make them and, backwards, what those need. */
export function closure(data) {
    const bySeq = new Map(data.moves.map((m) => [m.seq, m]));
    const keep = new Set(data.rows.flatMap((r) => [r.by, ...r.with]));
    const queue = [...keep];
    while (queue.length) for (const d of bySeq.get(queue.pop()).needs) if (!keep.has(d)) { keep.add(d); queue.push(d); }
    return keep;
}

/** A move in plain words (choice 3: spoilers are fine). */
function label(model, m) {
    const name = (id) => { const c = model.cards.get(id); return c ? c.name ?? c.label ?? c.text : id; };
    switch (m.op) {
        // The words clicked, or the card they give when the words are a fragment of a longer span ("As ", ¶66).
        case 'collect': return m.words.trim().split(/\s+/).length >= 3 ? `Collect “${short(m.words.trim(), 60)}” (¶${m.from})` : `Collect: ${short(name(m.card), 70)} (¶${m.from})`;
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
export function depgraph(model, data, { title, end, due: dueText = 'Holmes is first to' }) {
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
        nodes[sid(i)] = { label: `Read ¶${x}–¶${y}`, description: i ? `From ¶${x}${due.length ? `, where ${dueText}: ${due.map((r) => (r.family === 'wait' ? r.thought : `${r.thought} (${r.family})`)).join(', ')}` : ''}.` : 'The story from the start.', depends_on: i ? [sid(i - 1)] : [] };
    });
    for (const m of moves) nodes[mid(m.seq)] = { label: label(model, m), description: `Thought ${m.thought}; from ¶${m.from}${m.lost !== undefined ? `, before ¶${m.lost}` : ''}.`, depends_on: [sid(of(m.from)), ...m.needs.map(mid)] };
    const wait = (i, seq) => { const n = nodes[sid(i)]; if (!n.depends_on.includes(mid(seq))) n.depends_on.push(mid(seq)); };
    for (const r of rows) for (const seq of [r.by, ...r.with]) wait(of(r.deadline), seq);
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

