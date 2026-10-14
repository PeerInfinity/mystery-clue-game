#!/usr/bin/env node
// Step 3: redraft the old card descriptions (notes marked from_description). For each, a model sees the story so
// far (to the paragraph where the note shows), the sentence that first mentions the card, the card's other
// notes and clues, and the old note, and says: drop it (it adds nothing), keep it, or rewrite it — every kept or
// rewritten note with a verbatim quote from the story so far that supports all of it.
//   node checker/draft-notes.js cases/silver-blaze [--model sonnet] [--only id,id] > .cache/drafts.json
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { loadCase } from '../engine/loadCase.js';
import { Game } from '../engine/game.js';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };
const model = await loadCase(args[0]);
const story = model.story;
const modelName = opt('model', 'sonnet');
const only = opt('only', null)?.split(',');
const here = path.dirname(new URL(import.meta.url).pathname);

const SYSTEM = `You edit the cards of a mystery game built from a Sherlock Holmes story. The player reads the story a
paragraph at a time; each card collects what the story has said about one person, place or thing.

A card always opens with the story's own sentence that first mentions it. Under it may sit a short NOTE in the
game's words. You are given one old note, written by an editor who knew the whole story, and must decide:

- DROP it if it adds nothing the player does not already have from the card's name, its first-mention sentence,
  its other notes and clues (a restatement, or a vague label like "Cigars.").
- KEEP it as it is if it is useful, short, and every word of it is supported by the story so far.
- REWRITE it if it is useful but says too much, says it badly, or reads oddly where it appears.

A kept or rewritten note must:
- say only what the story so far states (no later knowledge, no guesses, no names the story has not yet used
  for this thing, no comments on what the story will or will not say);
- be short: one plain sentence or phrase, in the game's voice, not a quotation;
- come with QUOTE: a short passage copied EXACTLY, character for character, from the story so far, that supports
  everything in the note (prefer the paragraph where the card appears or the note shows).

Prefer DROP when in doubt: a card with only the story's own sentence is fine.`;

const SCHEMA = {
    type: 'object',
    properties: {
        action: { type: 'string', enum: ['drop', 'keep', 'rewrite'] },
        text: { type: 'string', description: 'The note (keep: the old text; rewrite: the new one; drop: empty).' },
        quote: { type: 'string', description: 'Exact words from the story so far supporting the note (empty for drop).' },
        reason: { type: 'string', description: 'One sentence: why.' },
    },
    required: ['action', 'text', 'quote', 'reason'],
};

const game = new Game(model, { background: 'relevant' });
while (!game.finished()) game.advance();

const items = [];
for (const e of model.data.entities) {
    if (e.kind === 'topic') continue;
    (e.notes ?? []).forEach((n, i) => {
        if (!n.from_description) return;
        const first = story.firstAt.get(e.id);
        const para = Math.max(first, story.find(n.source[0])?.para ?? -1);
        items.push({ id: `${e.id}#${i}`, card: e.id, index: i, para, first, old: n.text, oldQuote: n.source[0] });
    });
}
const todo = only ? items.filter((x) => only.includes(x.id) || only.includes(x.card)) : items;

function prompt(it) {
    const so = story.paragraphs.slice(1, it.para + 1).map((p, i) => `[${i + 1}] ${p.display}`).join('\n\n');
    const sentence = story.firstSentence(it.card);
    // What else the card shows by then: other notes and clue statements up to this paragraph.
    const e = model.cards.get(it.card);
    const others = [
        ...(e.notes ?? []).filter((n, i) => i !== it.index && !n.from_description && (story.find(n.source[0])?.para ?? 0) <= it.para).map((n) => `note: ${n.text}`),
        ...(model.data.claims ?? []).filter((c) => (c.about ?? []).includes(it.card) && game.unlocked.get(c.id)?.para <= it.para).map((c) => `clue: ${c.text}`),
    ];
    return `THE STORY SO FAR (paragraphs 1 to ${it.para}):\n\n${so}\n\n---\n\nTHE CARD: "${game.nameOf(it.card)}" (as the story calls it by paragraph ${it.para}).
It opens with the sentence that first mentions it (paragraph ${it.first}): "${sentence?.text ?? ''}"
${others.length ? `It also shows:\n${others.map((o) => `- ${o}`).join('\n')}\n` : ''}
THE OLD NOTE (shows at paragraph ${it.para}): "${it.old}"
(its old supporting quote: "${it.oldQuote.replace(/\s+/g, ' ')}")

Decide: drop, keep or rewrite.`;
}

function ask(it) {
    return new Promise((resolve) => {
        const child = spawn('claude', ['-p', '--model', modelName, '--system-prompt', SYSTEM, '--tools', '', '--strict-mcp-config',
            '--setting-sources', '', '--no-session-persistence', '--output-format', 'json', '--json-schema', JSON.stringify(SCHEMA)],
        { cwd: here, stdio: ['pipe', 'pipe', 'pipe'] });
        let out = '';
        child.stdout.on('data', (d) => { out += d; });
        child.on('close', () => {
            try {
                const d = JSON.parse(out);
                resolve({ ...it, ...d.structured_output, cost: d.total_cost_usd ?? 0 });
            } catch (err) { resolve({ ...it, error: `${err.message}: ${out.slice(0, 200)}` }); }
        });
        child.stdin.end(prompt(it));
    });
}

const results = [];
const queue = [...todo];
const conc = Number(opt('concurrency', 6));
await Promise.all(Array.from({ length: conc }, async () => {
    while (queue.length) {
        let r = await ask(queue.shift());
        if (r.error) r = await ask(r);
        results.push(r);
        if (results.length % 20 === 0) process.stderr.write(`${results.length}/${todo.length}\n`);
    }
}));
results.sort((a, b) => a.para - b.para || a.id.localeCompare(b.id));
// A quote must really be in the story, at or before where the note shows.
for (const r of results) {
    if (r.action === 'drop' || r.error) continue;
    const hit = story.find(r.quote ?? '');
    r.quoteAt = hit?.para ?? null;
    if (!hit) r.problem = 'quote not found in the story';
    else if (hit.para > r.para) r.problem = `quote is at ¶${hit.para}, after the note shows (¶${r.para})`;
}
console.log(JSON.stringify(results, null, 1));
process.stderr.write(`done: ${results.length}; cost $${results.reduce((a, r) => a + (r.cost ?? 0), 0).toFixed(2)}\n`);
