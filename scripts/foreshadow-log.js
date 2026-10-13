#!/usr/bin/env node
// For every card, at the paragraph where it first appears (Easy, free pace): its text, and the words in it that
// the story has not used yet. A card must not speak of what the story has not told; this lists the suspects.
//   node scripts/foreshadow-log.js cases/silver-blaze > .cache/foreshadow-log.txt
import { loadCase } from '../engine/loadCase.js';
import { Game } from '../engine/game.js';

const model = await loadCase(process.argv[2]);
const game = new Game(model);
const STOP = new Set('that this with from have been were they them their there what when which while would could should about into also only than then upon some such your more most other being does did done each very will shall just like over after before where whose whom these those here every once still even said says'.split(' '));
const stem = (w) => w.toLowerCase().replace(/[^a-z]/g, '').slice(0, 5);
const words = (t) => (t.match(/[A-Za-z][A-Za-z'’-]{3,}/g) ?? []).filter((w) => !STOP.has(w.toLowerCase()));
const told = new Set();
const tell = (p) => { for (const w of words(model.story.paragraphs[p].display)) told.add(stem(w)); };
const seen = new Set();
const seenGloss = new Set();
const show = (p) => {
    for (const id of game.unlocked.keys()) {
        for (const it of game.info(id)) {
            if (!it.term || seenGloss.has(it.key)) continue;
            seenGloss.add(it.key);
            const text = `${it.term}: ${it.text}`;
            const fresh = [...new Set(words(text).filter((w) => !told.has(stem(w))))];
            console.log(`¶${p} ${it.key} [gloss on ${id}] ${text}${fresh.length ? `\n      untold: ${fresh.join(', ')}` : ''}`);
        }
        if (seen.has(id)) continue;
        seen.add(id);
        const c = model.cards.get(id);
        const pieces = [];
        if (c.section === 'entities') pieces.push(['name', c.name], ['intro', c.description]);
        else if (c.section === 'events') pieces.push(['label', c.label]);
        else if (c.section === 'claims') pieces.push(['claim', c.text]);
        else if (c.section === 'rules') pieces.push(['rule', c.text]);
        for (const [kind, text] of pieces) {
            if (!text) continue;
            const fresh = [...new Set(words(text).filter((w) => !told.has(stem(w))))];
            console.log(`¶${p} ${id} [${kind}] ${text}${fresh.length ? `\n      untold: ${fresh.join(', ')}` : ''}`);
        }
    }
};
tell(0);
show(0);
while (!game.finished()) { game.advance(); tell(game.read - 1); show(game.read - 1); }
