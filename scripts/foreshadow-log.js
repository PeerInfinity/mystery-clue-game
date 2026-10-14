#!/usr/bin/env node
// Everything the player can read on the cards, at the paragraph where it first appears (Easy, free pace): each
// card's name when it is dealt, then every new piece of card text (later names, notes, background, clues), with
// the words the story has not used yet. A card must not speak of what the story has not told; this lists the
// suspects for a reader (or a checker) to judge.
//   node scripts/foreshadow-log.js cases/silver-blaze > .cache/foreshadow-log.txt
import { loadCase } from '../engine/loadCase.js';
import { Game } from '../engine/game.js';

const model = await loadCase(process.argv[2]);
const game = new Game(model, { background: 'relevant' }); // facts appear where the story reaches them
const STOP = new Set('that this with from have been were they them their there what when which while would could should about into also only than then upon some such your more most other being does did done each very will shall just like over after before where whose whom these those here every once still even said says'.split(' '));
const stem = (w) => w.toLowerCase().replace(/[^a-z]/g, '').slice(0, 5);
const words = (t) => (t.match(/[A-Za-z][A-Za-z'’-]{3,}/g) ?? []).filter((w) => !STOP.has(w.toLowerCase()));
const told = new Set();
const tell = (p) => { for (const w of words(model.story.paragraphs[p].display)) told.add(stem(w)); };
const line = (p, id, kind, text) => {
    const fresh = [...new Set(words(text).filter((w) => !told.has(stem(w))))];
    console.log(`¶${p} ${id} [${kind}] ${text}${fresh.length ? `\n      untold: ${fresh.join(', ')}` : ''}`);
};
const dealt = new Set();
const pieces = new Set();
const show = (p) => {
    for (const id of game.unlocked.keys()) {
        const c = model.cards.get(id);
        if (!dealt.has(id)) {
            dealt.add(id);
            if (c.section === 'entities' || c.section === 'events') line(p, id, c.section === 'events' ? 'label' : 'name', game.nameOf(id));
            else if (c.section === 'claims' || c.section === 'rules') line(p, id, c.section.slice(0, -1), c.text);
        }
        for (const it of game.info(id)) {
            const key = `${id}|${it.key}`;
            // Mentions and attestations are the story's own words; clues are printed with their claim card.
            if (pieces.has(key) || ['mention', 'attestation', 'clue'].includes(it.kind)) continue;
            pieces.add(key);
            line(p, id, it.kind === 'background' && it.term ? 'gloss' : it.kind, it.term ? `${it.term}: ${it.text}` : it.text);
        }
    }
};
tell(0);
show(0);
while (!game.finished()) { game.advance(); tell(game.read - 1); show(game.read - 1); }
