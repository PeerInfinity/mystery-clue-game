// The hints' data: from the minimal playthrough (action-table-minimal.json), each of its moves with
// what it needs (the moves that first gave the cards it needs, `dependencies` in engine/minimalTable.js, and for a move
// that gives an implicit inference the moves that gave its other premises and the cards it speaks of), the cards it
// wants (`src`: the move each came from, when a move gave it) and where a move is too late (`lost`: the story states the inference it builds, or the implicit one it gives a premise of), and each row that scores on Hard (the action table's) with its deadline and the moves that make it. Written to
// cases/<case>/hints.json by scripts/hints.js (npm run hints); engine/hints.js reads it in play.
import { Game } from './game.js';
import { dependencies, needs, replayMoves } from './minimalTable.js';
import { madeRows } from './hints.js';

/** Does move `m` make the row of `family` for thought `t` (the annotation's thought)? */
function makes(g, m, family, t) {
    switch (family) {
        case 'deduction': return m.op === 'build' && ((g.stepInferences(t.id) ?? []).includes(m.inference) || m.inference === t.inference);
        case 'notice': return m.op === 'investigate' && g.leadById().get(m.lead)?.scores === t.id;
        case 'raise': return m.op === 'raise' && (t.raises ?? []).some((x) => x.target === m.target && x.exception === m.exception);
        case 'drop': return m.op === 'drop' && (t.dropped.theory ? m.target.theory === t.dropped.theory : m.target.slot === t.dropped.slot && m.target.value === t.dropped.value);
        case 'check': return m.op === 'seal' && (t.checks ?? []).some((c) => c.check === m.check);
        case 'absence': return m.op === 'file' && (t.maps ?? []).includes(m.absence);
        default: return false;
    }
}

/** → {description, rows: [{thought, family, deadline, makes: [seq]}], moves: [move, `at` the reader's paragraph, `needs`: [seq], `wants`]} */
export function hintData(model, table, minimal) {
    const gotBy = new Map();
    const { all, depsOf, sourcesOf, provider, g0 } = dependencies(model, minimal, { onMove: (m, got) => { if (m) gotBy.set(m.seq, got); } });
    // Hidden needs (as the DepGraph export found them): a move that gives an implicit inference gives it only once its
    // other premises and the cards its formula speaks of are held, so it needs the moves that gave them.
    const hidden = new Map(all.map((m) => [m.seq, new Set()]));
    for (const m of all) for (const k of gotBy.get(m.seq) ?? []) {
        const inf = g0.inferenceById.get(k);
        if (!inf?.implicit) continue;
        for (const c of [...inf.premises, ...g0.inferenceWaits.get(k)]) {
            const p = provider.get(c);
            if (typeof p === 'number' && p < m.seq) hidden.get(m.seq).add(p);
        }
    }
    const thoughts = new Map(model.data.thoughts.map((t) => [t.id, t]));
    // The move after which each row is first made, replayed (a deduction can be made by an inference that covers its
    // conclusion rather than by the ones its step needs); a row made as a paragraph is read goes to the last move made.
    const madeBy = new Map();
    let last = null;
    replayMoves(model, all, { onMove: (m, got, g) => {
        if (m) last = m.seq;
        if (last === null) return;
        for (const k of madeRows(g)) if (!madeBy.has(k)) madeBy.set(k, last);
    } });
    // Where the story states each inference by itself (a game that only reads): a build is lost from there, and so is
    // an implicit inference (one that comes by itself once its premises are held) not held by then.
    const stated = new Map();
    const g = new Game(model, { difficulty: 'hard' });
    while (!g.finished()) { g.advance(); for (const id of g.unlocked.keys()) if (!stated.has(id)) stated.set(id, g.read - 1); }
    const lost = new Map(all.filter((m) => m.op === 'build' && stated.has(m.inference)).map((m) => [m.seq, stated.get(m.inference)]));
    const rows = [];
    for (const r of table.thoughts) for (const s of r.scores.filter((x) => x.scored)) {
        const seeds = new Set(all.filter((m) => makes(g0, m, s.family, thoughts.get(r.id))).map((m) => m.seq));
        const by = madeBy.get(`${r.id}|${s.family}`);
        if (by !== undefined) seeds.add(by);
        // An implicit inference the step needs: the moves that gave its premises, before the story states it.
        if (s.family === 'deduction') for (const inf of g0.stepInferences(r.id) ?? []) {
            if (!g0.inferenceById.get(inf)?.implicit) continue;
            for (const c of g0.inferenceById.get(inf).premises) {
                const p = provider.get(c);
                if (typeof p !== 'number') continue;
                seeds.add(p);
                if (stated.has(inf)) lost.set(p, Math.min(lost.get(p) ?? Infinity, stated.get(inf)));
            }
        }
        if (!seeds.size) throw new Error(`hints: no move of the minimal playthrough makes ${r.id} (${s.family})`);
        rows.push({ thought: r.id, family: s.family, deadline: s.deadline, makes: [...seeds].sort((a, b) => a - b) });
    }
    rows.sort((a, b) => a.deadline - b.deadline || a.thought.localeCompare(b.thought, 'en', { numeric: true }));
    const moves = all.map(({ was, thought, ...m }) => ({ ...m, at: was, thought, needs: [...new Set([...depsOf(m), ...hidden.get(m.seq)])].sort((a, b) => a - b), wants: needs(model, m).filter(Boolean), src: sourcesOf(m),
        ...(lost.has(m.seq) && { lost: lost.get(m.seq) }) }));
    return {
        description: 'The hints\' data: the minimal playthrough\'s moves, each at the reader\'s paragraph with the moves it needs, and the rows that score on Hard with the moves that make them. Generated by `npm run hints`; do not edit.',
        rows, moves,
    };
}

/** The file's text: one row and one move per line (the case's data files are read and diffed by line). */
export function hintJson(data) {
    const lines = (xs) => xs.map((x) => `    ${JSON.stringify(x)}`).join(',\n');
    return `{\n "description": ${JSON.stringify(data.description)},\n "rows": [\n${lines(data.rows)}\n ],\n "moves": [\n${lines(data.moves)}\n ]\n}\n`;
}
