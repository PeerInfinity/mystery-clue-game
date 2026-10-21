// The minimal playthrough (docs/minimal-playthrough.md, Round 200): the fewest of the annotated reader's moves (the
// action table, engine/actionTable.js) that still reach the Hard maximum, each made as late as its deadlines allow, at
// as few paragraphs as possible. Built in four stages by scripts/minimal-table.js (the pruning replays the game a few
// hundred times, so it runs in parallel there); replayed and checked by engine/minimalTable.test.js.
//   1. closure: the moves that score, and backwards the move that first gave each card they need;
//   2. batch: each move's latest paragraph (the earliest deadline it feeds), the moves gathered at as few stops as can
//      be (interval stabbing), each at a stop between its own paragraph and its latest;
//   3. prune: each move removed in turn and the game replayed; those that can go alone, removed one by one, each
//      removal replayed again (two moves can be alternatives to each other);
//   4. the moves the page needs and the engine does not: a candidate is dropped from its chip, so it is proposed first,
//      before its question is settled (the page offers no answer box from then on).
import { Game } from './game.js';

export const SCORING_OPS = { deduction: ['build'], notice: ['notice'], raise: ['raise'], drop: ['drop', 'theory'], check: ['seal'], absence: ['file'] };

/** The action table's moves in order, each with its thought. */
export const movesOf = (table) => table.thoughts.flatMap((t) => t.moves.map((m) => ({ ...m, thought: t.id }))).sort((a, b) => a.seq - b.seq);

/**
 * Play `moves` (each at its `at`) through a fresh Hard game, as the action table makes them (its engine calls, the
 * clashes weighed at each paragraph). `onMove(move | null, gained cards, game)` after each move and each paragraph read.
 * → {record, fails: [seq of moves that did not take], game}
 */
export function replayMoves(model, moves, { onMove = null } = {}) {
    const g = new Game(model, { difficulty: 'hard' });
    const byAt = new Map();
    for (const m of [...moves].sort((a, b) => a.seq - b.seq)) (byAt.get(m.at) ?? byAt.set(m.at, []).get(m.at)).push(m);
    const fails = [];
    const gained = (before) => [...g.unlocked.keys()].filter((k) => !before.has(k));
    while (!g.finished()) {
        let before = new Set(g.unlocked.keys());
        g.advance();
        onMove?.(null, gained(before), g);
        for (const m of byAt.get(g.read - 1) ?? []) {
            before = new Set(g.unlocked.keys());
            if (!make(g, model, m)) fails.push(m.seq);
            onMove?.(m, gained(before), g);
        }
        g.clashes();
    }
    return { record: g.record(), fails, game: g };
}

export function make(g, model, m) {
    switch (m.op) {
        case 'collect': {
            const segs = g.story.segments(m.from);
            const s = segs.find((x) => x.text === m.words && x.ids.includes(m.card)) ?? segs.find((x) => x.ids.includes(m.card));
            g.collect(m.from, s.ids.filter((x) => model.cards.has(x)));
            return g.knows(m.card);
        }
        case 'ask': if (!g.canAsk(m.card) || g.hasAsked(m.card)) return false; g.ask(m.card); return true;
        case 'build': g.propose(m.cards, m.about); return g.knows(m.inference);
        case 'notice': return g.notice(m.card, m.because).ok !== false;
        case 'raise': return g.raise(m.target, m.n, m.exception).ok !== false;
        case 'seal': return !!g.seal(m.verb, m.fields, { expect: m.expect, answer: m.answer }).ok;
        case 'file': return !!g.fileAbsence(m.expectation, m.time, m.witness).ok;
        case 'pose': return g.pose(m.template, m.cards).ok !== false;
        case 'reread': return !!g.reread(m.from, m.to);
        case 'setAside': return g.setAside(m.card) !== false;
        case 'split': return !!g.splitClaim(m.card).ok;
        case 'doubt': { const ok = !!g.suspect(m.card); g.setDoubtReason(m.card, m.reason); return ok; }
        // The page offers an answer box only on a question it shows, not yet settled, for an answer it offers (the engine
        // would list it regardless).
        case 'candidate': return g.slotVisible(m.slot) && g.settled(m.slot) === null && g.offered(m.slot, m.value) && !!g.addCandidate(m.slot, m.value).ok;
        case 'theory': return !!g.addTheory(m.label, { ...m.assignment });
        case 'weigh': { const th = g.visibleTheories().find((x) => x.id === m.theory); if (th) g.residue(th); return !!th; }
        case 'drop': { const rival = m.rival ? g.theories.find((x) => x.label === m.rival)?.id : null; return g.drop(m.target, m.reason, { cites: m.cites, rival }).ok !== false; }
        default: return false;
    }
}

/**
 * How many clicks of the reading bar take the story from `read` (the next paragraph to read) to `to`: each the farthest
 * of Next paragraph, Next scene and Next deduction (the page shows a jump only when it reads more than one paragraph,
 * Next scene only before the last scene) that does not pass `to`. Greedy is the fewest: from farther on, every jump
 * lands no nearer. → (read, to) → clicks
 */
export function readingClicks(g) {
    const end = g.story.paragraphs.length;
    const gates = [...(g.gates?.keys() ?? [])].sort((a, b) => a - b);
    const scene = (r) => g.sceneStarts.find((p) => p > r) ?? end;
    const deduction = (r) => gates.find((p) => p > r) ?? end;
    return (read, to) => {
        let n = 0;
        for (let r = read; r < to; n++) {
            const s = scene(r);
            const d = deduction(r);
            r = Math.max(r + 1, ...(s - r > 1 && s < end && s <= to ? [s] : []), ...(d - r > 1 && d <= to ? [d] : []));
        }
        return n;
    };
}

/** Every family full but the deductions no player can make: what the action table reaches. */
export function atMaximum(record, table) {
    return Object.entries(table.families).every(([f, a]) => record.families[f].scored === a.scored);
}

/** What a move needs held: cards, a theory (`theory:<label>`), a listed candidate (`cand:<slot>=<value>`) or a question
 *  shown (`shown:<slot>`: a held clue or inference that speaks of it, or the story raising it). */
export function needs(model, m) {
    const on = (s) => model.slots.get(s)?.on;
    const theoryCards = (id) => Object.keys((model.data.theories ?? []).find((x) => x.id === id)?.assignment ?? {}).map(on);
    switch (m.op) {
        case 'collect': return [];
        case 'build': return m.cards;
        case 'notice': return [m.card, m.because];
        case 'raise': return [m.target];
        case 'seal': return [...Object.values(m.fields), ...(m.answer ? [on(m.answer.eq[0])] : [])];
        case 'file': return [m.expectation, m.witness];
        case 'candidate': return [on(m.slot), `shown:${m.slot}`, ...(model.cards.has(m.value) ? [m.value] : [])];
        case 'theory': return Object.keys(m.assignment).map(on);
        // A candidate is dropped from its chip in the page: proposed first (the engine would drop it unlisted).
        case 'drop': return [...m.cites, ...(m.target.theory ? theoryCards(m.target.theory) : [on(m.target.slot), `cand:${m.target.slot}=${m.target.value}`]), ...(m.rival ? [`theory:${m.rival}`] : [])];
        default: return [m.card];
    }
}

/**
 * What each of the table's moves needs: replayed, the move (or, for a background fact the story brought, the first ask
 * of a card it is about) that first gave each card it needs. → {all: moves, bySeq, depsOf: (move) → Set(seq), settles:
 * Map(slot → paragraph first settled, for the candidates), g0: a fresh Hard game}
 */
export function dependencies(model, table) {
    const all = movesOf(table);
    const bySeq = new Map(all.map((m) => [m.seq, m]));
    const g0 = new Game(model, { difficulty: 'hard' });
    // Who gave each card first, in the reader's game: a move, or a paragraph read (a background fact recalled for a
    // card asked before, or something the story tells).
    const provider = new Map();
    // And where each question a candidate answers is first settled (the page offers no answer box from then on).
    const settles = new Map(all.filter((m) => m.op === 'candidate').map((m) => [m.slot, Infinity]));
    replayMoves(model, all, { onMove: (m, got, g) => {
        for (const c of got) if (!provider.has(c)) provider.set(c, m ? m.seq : { at: g.read - 1 });
        for (const [slot, at] of settles) {
            if (at === Infinity && g.settled(slot) !== null) settles.set(slot, g.read - 1);
            if (!provider.has(`shown:${slot}`) && g.slotVisible(slot)) provider.set(`shown:${slot}`, m ? m.seq : { at: g.read - 1 });
        }
    } });
    for (const m of all) {
        if (m.op === 'theory' && !provider.has(`theory:${m.label}`)) provider.set(`theory:${m.label}`, m.seq);
        if (m.op === 'candidate' && !provider.has(`cand:${m.slot}=${m.value}`)) provider.set(`cand:${m.slot}=${m.value}`, m.seq);
    }
    const owners = new Map();
    for (const [c, rs] of g0.rulesOn) for (const r of rs) (owners.get(r) ?? owners.set(r, []).get(r)).push(c);
    const deps = new Map();
    const sources = new Map(); // seq → {want: the seq of the move it came from}
    const depsOf = (m) => {
        if (deps.has(m.seq)) return deps.get(m.seq);
        const out = new Set();
        const from = {};
        for (const c of needs(model, m)) {
            if (!c) continue;
            const p = provider.get(c);
            if (typeof p === 'number') { if (p !== m.seq) { out.add(p); from[c] = p; } continue; }
            if (!p) continue; // never held in the reader's game: the move would not have been made
            // A background fact that arrived as the story reached it: from the first ask of a card it is about.
            const ask = all.find((x) => x.op === 'ask' && (owners.get(c) ?? []).includes(x.card) && x.at < p.at);
            if (ask) { out.add(ask.seq); from[c] = ask.seq; }
        }
        deps.set(m.seq, out);
        sources.set(m.seq, from);
        return out;
    };
    const sourcesOf = (m) => { depsOf(m); return sources.get(m.seq); };
    return { all, bySeq, depsOf, sourcesOf, deps, settles, provider, g0 };
}

/**
 * Stages 1 and 2: the closure of the scoring moves and their batched paragraphs.
 * → {moves: [move with `at` its stop and `was` the reader's paragraph], stops, deps: Map(seq → Set(seq)), pageOnly: Set(seq)}
 */
export function closureAndBatch(model, table) {
    const { all, bySeq, depsOf, deps, settles, provider, g0 } = dependencies(model, table);
    // The scoring moves: those of the families' scored thoughts, and the inferences Holmes's steps need.
    const latest = new Map();
    const seed = new Set();
    const due = (seq, d) => { seed.add(seq); latest.set(seq, Math.min(latest.get(seq) ?? Infinity, d - 1)); };
    for (const r of table.thoughts) for (const s of r.scores.filter((x) => x.scored)) {
        for (const m of r.moves) if (SCORING_OPS[s.family].includes(m.op)) due(m.seq, s.deadline);
        if (s.family === 'deduction') for (const inf of g0.stepInferences(r.id) ?? []) { const p = provider.get(inf); if (typeof p === 'number') due(p, s.deadline); }
    }
    const keep = new Set(seed);
    const queue = [...seed];
    while (queue.length) for (const d of depsOf(bySeq.get(queue.pop()))) if (!keep.has(d)) { keep.add(d); queue.push(d); }
    const moves = all.filter((m) => keep.has(m.seq));
    // A candidate the page needs (to drop it from its chip) is proposed before its question is settled in the reader's
    // game (the minimal game, holding less, settles it no sooner): from then on the page offers no answer box (Round 200,
    // found by scripts/ui-run.mjs).
    const pageOnly = new Set(moves.filter((m) => m.op === 'candidate').map((m) => m.seq));
    for (const m of moves) if (pageOnly.has(m.seq)) latest.set(m.seq, Math.min(latest.get(m.seq) ?? Infinity, settles.get(m.slot) - 1));
    // Latest paragraphs, backwards through the needs (a move comes after what it needs: seq order is an order of needs).
    for (const m of [...moves].reverse()) for (const d of depsOf(m)) latest.set(d, Math.min(latest.get(d) ?? Infinity, latest.get(m.seq) ?? Infinity));
    const iv = moves.map((m) => ({ m, lo: m.at, hi: Math.max(m.at, latest.get(m.seq) ?? m.at) })).sort((a, b) => a.hi - b.hi || a.lo - b.lo);
    // The paragraphs to make moves at: every move's window holds one, and the reading between them (readingClicks) is
    // the fewest. Over the paragraphs in order: the cheapest way to make moves at p having made the last ones at q, no
    // window lying wholly between them; then the story read to its end.
    const reading = readingClicks(g0);
    const end = g0.story.paragraphs.length;
    const missed = (q, p) => iv.some((x) => x.lo > q && x.hi < p); // a window between two stops holds neither
    const best = new Map([[0, { cost: 0, from: null }]]); // a paragraph made moves at (0: the start) → its cheapest way
    for (let p = 1; p < end; p++) {
        let w = null;
        for (const [q, b] of best) if (!missed(q, p)) { const cost = b.cost + reading(q + 1, p + 1); if (!w || cost < w.cost) w = { cost, from: q }; }
        if (w) best.set(p, w);
    }
    let last = null;
    for (const [p, b] of best) if (p && !missed(p, end)) { const cost = b.cost + reading(p + 1, end); if (!last || cost < last.cost) last = { p, cost }; }
    const stops = [];
    for (let p = last.p; p; p = best.get(p).from) stops.unshift(p);
    const chosen = { cost: last.cost };
    // Each move at the first stop in its window.
    const placed = new Map(iv.map((x) => [x.m.seq, stops.find((s) => s >= x.lo && s <= x.hi)]));
    return { moves: moves.map((m) => ({ ...m, was: m.at, at: placed.get(m.seq) })), stops, reading: chosen.cost, deps, pageOnly };
}

/**
 * The minimal table from the batched moves that remain: the action table's shape (thoughts → moves, each move's `ui`
 * as the reader's), with `was` the reader's paragraph, the record replayed, and the counts by kind.
 */
export function minimalTable(model, table, moves) {
    const { record } = replayMoves(model, moves);
    const bySeq = new Set(moves.map((m) => m.seq));
    const at = new Map(moves.map((m) => [m.seq, [m.at, m.was]]));
    const thoughts = table.thoughts.map((t) => ({ id: t.id, para: t.para, tag: t.tag, moves: t.moves.filter((m) => bySeq.has(m.seq)).map((m) => ({ ...m, at: at.get(m.seq)[0], was: at.get(m.seq)[1] })) })).filter((t) => t.moves.length);
    const count = {};
    for (const m of moves) count[m.op] = (count[m.op] ?? 0) + 1;
    return {
        description: 'The minimal playthrough (docs/minimal-playthrough.md): the fewest of the action table\'s moves that reach the Hard maximum, each made as late as its deadlines allow. Generated by `npm run minimal-table`; do not edit.',
        playthrough: 'minimal', difficulty: 'hard',
        families: record.families, ahead: record.ahead,
        moves: moves.length, byKind: count, stops: [...new Set(moves.map((m) => m.at))].sort((a, b) => a - b),
        thoughts,
    };
}
