#!/usr/bin/env node
// Write every clash a player meets through the whole story, and what the game sets aside in it (docs/clashes.md):
// one section per kind of player (Easy, background when relevant), a line per clash as it first appears:
// the paragraph, what is set aside and why, and what is kept. Each card is marked ✓ or ✗ by the answer key, so a
// true card set aside stands out (the engine never reads the key; this log does, to judge it).
//   node scripts/clash-log.js cases/silver-blaze [--build] > .cache/clash-log.txt
// Players: passive (builds nothing: keeps the police's account until a clash); curry-doubter (also doubts Holmes's
// curry step as it arrives); one-culprit (also builds k.one_culprit as soon as it can). With --build, also one who
// builds everything buildable at every paragraph (about 5 minutes; the others take about a minute together).
import { loadCase } from '../engine/loadCase.js';
import { Game, EASY } from '../engine/game.js';

const model = await loadCase(process.argv[2]);
const mark = (id) => `${model.cards.get(id)?.truth === false ? '✗' : '✓'}${id}`;

function build(game, id) {
    for (const p of game.inferenceById.get(id)?.premises ?? []) if (game.inferenceById.has(p) && !game.knows(p)) build(game, p);
    return game.propose(game.connectSet(id));
}

const PLAYERS = {
    passive: () => {},
    'curry-doubter': (game) => {
        if (game.knows('k.drugger_chose_the_dish') && !game.isSuspected('k.drugger_chose_the_dish')) game.suspect('k.drugger_chose_the_dish');
    },
    'one-culprit': (game) => {
        if (!game.knows('k.one_culprit') && game.buildable().includes('k.one_culprit')) build(game, 'k.one_culprit');
    },
};
if (process.argv.includes('--build')) PLAYERS.builder = (game) => { for (const id of game.buildable()) build(game, id); };

for (const [name, each] of Object.entries(PLAYERS)) {
    console.log(`== ${name}`);
    const game = new Game(model, { difficulty: EASY, options: { background: 'relevant' } });
    const seen = new Set();
    while (!game.finished()) {
        game.advance();
        each(game);
        for (const c of game.clashes()) {
            const key = `${c.ids.join('|')}>${c.aside.join('|')}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const kept = c.claims.filter((x) => !c.aside.includes(x));
            console.log(`¶${game.read - 1} aside ${c.aside.map(mark).join(' ')} (${c.why}${c.tie ? ', tie' : ''}) | kept ${kept.map(mark).join(' ') || '—'}`);
        }
    }
    const lost = [...new Set(game.clashes().flatMap((c) => c.aside))].filter((id) => model.cards.get(id)?.truth !== false);
    console.log(`at the end: ${game.clashes().length} clashes; true cards set aside: ${lost.join(', ') || 'none'}`);
}
