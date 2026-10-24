// The hint-only player: a game that only reads and, at every paragraph, takes every hint to its
// fourth rung and makes its moves, as Do it does (a drop whose reason would not hold now is left for later). For the
// test (engine/hints.test.js: it must reach the maximum) and the statistics (engine/stats.js: its hints by scene).
// Node only: the page's Do it plays the moves through the page instead.
import { Game } from './game.js';
import { Hints } from './hints.js';
import { make } from './minimalTable.js';

/** → {game, hints, targets: [{para, key}], fails: [text]}: each target taken to the fourth rung, each move that failed. */
export function playHints(model, data, { difficulty = 'hard', onRead = null } = {}) {
    const g = new Game(model, { difficulty });
    const h = new Hints(g, data);
    const targets = [];
    const fails = [];
    while (!g.finished()) {
        g.advance();
        onRead?.(g, h);
        const skip = new Set(); // a row whose moves did not make it, for this paragraph
        for (let n = h.next({ skip }); n; n = h.next({ skip })) {
            let p;
            do p = h.take({ skip }); while (p.rung < 4);
            targets.push({ para: g.read - 1, key: n.row.key });
            for (const m of p.moves) {
                if (m.op === 'drop' && !h.wouldHold(m)) continue;
                if (!make(g, model, m) && m.op !== 'candidate') fails.push(`¶${g.read - 1} ${n.row.key}: ${m.op} ${m.seq}`);
            }
            if (h.open().some((r) => r.key === n.row.key)) skip.add(n.row.key);
        }
        g.clashes();
    }
    return { game: g, hints: h, targets, fails };
}
