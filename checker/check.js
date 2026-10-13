#!/usr/bin/env node
// The card checker: asks a model whether a piece of card text says anything the story has not told yet.
// It sees only the story up to the paragraph where the text appears, and the sentence that first mentions the
// card's subject — never the card's id or the case's own name for it.
//   node checker/check.js cases/silver-blaze --tests [--model haiku] [--only id,id] [--concurrency 4]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { loadCase } from '../engine/loadCase.js';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };
const caseDir = args[0];
const modelName = opt('model', 'haiku');
const only = opt('only', null)?.split(',');
const concurrency = Number(opt('concurrency', 4));
const here = path.dirname(new URL(import.meta.url).pathname);

const model = await loadCase(caseDir);
const story = model.story;

const SYSTEM = `You check the cards of a mystery game for spoilers.

The player reads a story one paragraph at a time. Each card shows text about one person, place, thing or event in
the story. A card may only tell the player what the story has already told them.

You are given THE STORY SO FAR (everything the player has read) and ONE PIECE OF CARD TEXT. Decide whether every
fact in the card text is supported.

A fact is SUPPORTED when:
- the story so far states it, or it follows directly and obviously from what is stated; or
- it is general knowledge that is not about this story's particular people, places, things or events (what a
  word means, how horses or trains work, what was usual in the period).

A fact is UNSUPPORTED when it is about this story's people, places, things or events and the story so far does
not state it — even if it is true, and even if you happen to know the story. Do not use any memory of this
story: judge only from the text you are given. Names count as facts: a name, title, or description of something
that the story so far has not used for it is unsupported (for example, a full name when only a surname has
appeared, or a specific detail that only a later part of the story could supply). Counts and directions count
too.

Three things to watch:
- THE SUBJECT. A name or description is supported only if the story so far uses it for THIS card's subject (the
  thing in the sentence you are given). A name that appears in the story but for something or someone else —
  or that the story has not yet connected with this subject — is unsupported. Example: if the story has named
  a man who was arrested, and separately described a stranger, calling the stranger by the arrested man's name
  is unsupported until the story says they are the same person.
- THE FUTURE. Statements about what the story will or will not do later ("the story never explains…", "its
  verdict is never told", "the story repeats…") are unsupported: the reader cannot know that yet.
- THE REAL WORLD. Facts about real places, real people, real horses, real things as they are in reality
  (Dartmoor is in Devon; Isonomy was a real champion racehorse) are general knowledge and supported, as long as
  they say nothing about this story's events or characters.

Be strict but fair: ordinary paraphrase of what is stated is fine.`;

const SCHEMA = {
    type: 'object',
    properties: {
        facts: {
            type: 'array',
            description: 'Every fact in the card text, each judged.',
            items: {
                type: 'object',
                properties: {
                    fact: { type: 'string' },
                    supported: { type: 'boolean' },
                    evidence: { type: 'string', description: 'If supported: the words of the story that support it (or "general knowledge"). If not: why not.' },
                },
                required: ['fact', 'supported', 'evidence'],
            },
        },
        verdict: { type: 'string', enum: ['ok', 'leak'] },
    },
    required: ['facts', 'verdict'],
};

function prompt(item) {
    const so = story.paragraphs.slice(1, item.para + 1).map((p, i) => `[${i + 1}] ${p.display}`).join('\n\n');
    const first = story.firstSentence(item.card);
    const subject = first && first.para <= item.para
        ? `The card is about the thing referred to in this sentence (paragraph ${first.para}): "${first.text}"`
        : 'The card is about something the story so far refers to.';
    return `THE STORY SO FAR (paragraphs 1 to ${item.para}):\n\n${so}\n\n---\n\n${subject}\n\nTHE CARD TEXT (a ${item.kind}):\n"${item.text}"\n\nJudge every fact in the card text.`;
}

function ask(item) {
    return new Promise((resolve) => {
        const child = spawn('claude', ['-p', '--model', modelName, '--system-prompt', SYSTEM, '--tools', '', '--strict-mcp-config',
            '--setting-sources', '', '--no-session-persistence', '--output-format', 'json', '--json-schema', JSON.stringify(SCHEMA)],
        { cwd: here, stdio: ['pipe', 'pipe', 'pipe'] });
        let out = '';
        let errText = '';
        child.stdout.on('data', (d) => { out += d; });
        child.stderr.on('data', (d) => { errText += d; });
        child.on('close', () => {
            try {
                const d = JSON.parse(out);
                resolve({ item, answer: d.structured_output, cost: d.total_cost_usd ?? 0, error: d.is_error ? d.result : null });
            } catch (e) {
                resolve({ item, answer: null, cost: 0, error: `${e.message}: ${(out || errText).slice(0, 300)}` });
            }
        });
        child.stdin.end(prompt(item));
    });
}

let items;
if (args.includes('--tests')) items = JSON.parse(fs.readFileSync(path.join(here, 'tests.json'), 'utf8')).cases;
else throw new Error('only --tests for now');
if (only) items = items.filter((x) => only.includes(x.id));

const results = [];
const queue = [...items];
await Promise.all(Array.from({ length: concurrency }, async () => {
    while (queue.length) results.push(await ask(queue.shift()));
}));
results.sort((a, b) => items.indexOf(a.item) - items.indexOf(b.item));

let right = 0;
let cost = 0;
for (const r of results) {
    cost += r.cost;
    const got = r.answer?.verdict ?? 'error';
    const unscored = r.item.expect === 'unsettled';
    const ok = got === r.item.expect;
    if (ok) right++;
    if (unscored) { console.log(`· ${r.item.group ? `[${r.item.group}] ` : ''}${r.item.id}: unscored, got ${got}`); continue; }
    console.log(`${ok ? "✓" : "✗"} ${r.item.group ? `[${r.item.group}] ` : ""}${r.item.id}: expected ${r.item.expect}, got ${got}${r.error ? ` (${r.error})` : ''}`);
    for (const f of r.answer?.facts ?? []) if (!f.supported || !ok) console.log(`    ${f.supported ? '+' : '−'} ${f.fact} — ${f.evidence}`);
    if (r.item.why && !ok) console.log(`    (known: ${r.item.why})`);
}
console.log(`\n${right}/${results.filter((r) => r.item.expect !== 'unsettled').length} right · model ${modelName} · $${cost.toFixed(4)}`);
fs.mkdirSync('.cache', { recursive: true });
fs.writeFileSync(`.cache/checker-${modelName}.json`, JSON.stringify(results, null, 1));
