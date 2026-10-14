#!/usr/bin/env node
// Write what the player sees appear, paragraph by paragraph (Easy, free pace): new cards with their first
// text, new background, new questions, new answer options. For checking that nothing shows early.
//   node scripts/reveal-log.js cases/silver-blaze > .cache/reveal-log.txt
import { loadCase } from '../engine/loadCase.js';
import { Game } from '../engine/game.js';

const model = await loadCase(process.argv[2]);
const game = new Game(model, { background: 'relevant' }); // facts appear where the story reaches them
const seen = { cards: new Set(), slots: new Set(), options: new Set(), info: new Set() };
const show = (p) => {
    const out = [];
    for (const id of game.unlocked.keys()) {
        const c = model.cards.get(id);
        if (!seen.cards.has(id)) {
            seen.cards.add(id);
            if (c.section !== 'rules' && c.section !== 'glosses') out.push(`  + ${c.section.slice(0, -1)} ${id}: ${game.nameOf(id)}`);
        }
        for (const it of game.info(id)) {
            const key = `${id}|${it.key}`;
            if (seen.info.has(key) || it.kind === 'intro' || it.kind === 'clue' || it.kind === 'attestation') continue;
            seen.info.add(key);
            out.push(`    · ${id} ${it.kind}: ${it.term ? `${it.term}: ` : ''}${it.text}`);
        }
    }
    for (const s of game.visibleSlots()) {
        if (!seen.slots.has(s.id)) { seen.slots.add(s.id); out.push(`  ? ${s.id}: ${s.prompt}`); }
        if (s.domain.length <= 6) for (const v of game.pencil(s.id)) {
            const key = `${s.id}|${v}`;
            if (!seen.options.has(key)) { seen.options.add(key); out.push(`    option ${s.id} = ${s.labels?.[v] ?? v}`); }
        }
    }
    if (out.length) console.log(`¶${p}: ${model.story.paragraphs[p].display.slice(0, 70)}\n${out.join('\n')}`);
};
show(0);
while (!game.finished()) { game.advance(); show(game.read - 1); }
