#!/usr/bin/env node
// The card checker: asks a model whether a piece of card text says anything the story has not told yet.
// It sees only the story up to the paragraph where the text appears, and the sentence that first mentions the
// card's subject — never the card's id or the case's own name for it.
//   node checker/check.js cases/silver-blaze --tests [--model haiku] [--only id,id] [--concurrency 4]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadCase } from '../engine/loadCase.js';
import { Game } from '../engine/game.js';

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

// Background facts are checked for one thing only: are they general knowledge, rather than facts about this
// story? (When they appear is the Background setting's business.)
const SYSTEM_BACKGROUND = `You check the background facts of a mystery game built from a Sherlock Holmes story.

Background facts are meant to be GENERAL KNOWLEDGE that a reader of the 1890s had (and a modern reader may lack):
how horses, racing, stables, households, medicine, the weather, the moor, money and the law worked; what words
meant; real places, people and horses as they really were; and Sherlock Holmes's well-known habits and sayings
as a character.

A background fact must NOT be a fact about this particular story: its events, its characters' actions or
circumstances, what happened at a particular place in it, or what the story will say. A general rule that
happens to be useful for solving the mystery is fine, as long as it is phrased as general knowledge and is true.
Watch for a "general" fact that smuggles in a detail only this story could supply (a specific sum, place, name,
or object from the plot).

Judge every fact in the text. Also say whether each fact is TRUE as general knowledge.`;

// An exception to a background fact (workstream 3): the fact is the player's general knowledge, the exception a
// possibility it allows for. Checked for one thing: does it speak of anything in this story the story has not told?
const SYSTEM_EXCEPTION = `You check the cards of a mystery game for spoilers.

The player reads a story one paragraph at a time. Beside the story they hold BACKGROUND FACTS: general rules of
common knowledge (how horses, dogs, households, people behave), written for the game and not part of the story.
Each background fact may list EXCEPTIONS: possibilities that would make the rule not apply ("unless the dog was
asleep"). An exception is NOT a claim that anything happened. It only names a possibility.

You are given THE STORY SO FAR, ONE BACKGROUND FACT and ONE OF ITS EXCEPTIONS. Decide whether the exception runs
ahead of the story.

The exception is a LEAK when it speaks of a particular person, thing, event or detail of this story that the
story so far has not mentioned (for example "the sheep" when no sheep have appeared, or "the drugged guard" when
nobody has been drugged yet), or when it points the reader towards a specific turn of the plot the story has given
no hint of.

The exception is OK when it is a general possibility that anyone would think of for that rule, worded in general
terms ("he", "it", "someone", "the searchers", "the door"), even if the story has not raised it. That the story has
not stated the rule, or the possibility, is NOT a leak: background facts and their exceptions are never in the
story. Do not use any memory of this story: judge only from the text you are given.

List each fact or possibility in the exception, say whether it is supported (general, or already in the story) or
not (a particular of this story the story has not told), and give the verdict.`;

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

function promptException(item) {
    const so = story.paragraphs.slice(1, item.para + 1).map((p, i) => `[${i + 1}] ${p.display}`).join('\n\n');
    return `THE STORY SO FAR (paragraphs 1 to ${item.para}):\n\n${so}\n\n---\n\nTHE BACKGROUND FACT:\n"${item.rule}"\n\nTHE EXCEPTION:\n"unless ${item.text}"\n\nDoes the exception run ahead of the story?`;
}
const systemOf = (item) => item.background ? SYSTEM_BACKGROUND : item.exception ? SYSTEM_EXCEPTION : SYSTEM;
const promptOf = (item) => item.background ? promptBackground(item) : item.exception ? promptException(item) : prompt(item);

function promptBackground(item) {
    return `THE BACKGROUND FACT (${item.kind}):\n"${item.text}"\n\nJudge every fact in it: is it general knowledge (and true), or a fact about this particular story?`;
}

function ask(item) {
    return new Promise((resolve) => {
        const child = spawn('claude', ['-p', '--model', modelName, '--system-prompt', systemOf(item), '--tools', '', '--strict-mcp-config',
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
        child.stdin.end(promptOf(item));
    });
}

let items;
if (args.includes('--tests')) items = JSON.parse(fs.readFileSync(path.join(here, 'tests.json'), 'utf8')).cases;
else if (args.includes('--background')) {
    // Every background fact. (Glosses explain words in the text and show only once the text has used them: the
    // story-so-far check covers them.) Expected 'ok' is the hope, not a known answer: misses are the findings.
    items = (model.data.rules ?? []).map((r) => ({ id: r.id, kind: 'background fact', text: r.text, expect: 'ok', background: true }));
} else if (args.includes('--all')) items = allPieces();
// A background fact's exceptions (workstream 3), each checked against the story so far where it first shows.
else if (args.includes('--exceptions')) items = allPieces().filter((x) => x.kind === 'exception').filter((x, i, all) => all.findIndex((y) => y.id.split('|').slice(1).join('|') === x.id.split('|').slice(1).join('|')) === i);
else throw new Error('use --tests, --background, --all or --exceptions');

/**
 * Every piece of card text the player reads, at the paragraph where it first shows (reading the story through,
 * Easy, background when relevant): names and labels as cards are dealt, claim texts, and every later piece
 * (names, notes, glosses). Not the story's own words (mentions, attestations), nor background facts (--background).
 */
function allPieces() {
    const game = new Game(model, { background: 'relevant' });
    const out = [];
    const seen = new Set();
    const add = (card, para, kind, key, text, extra = {}) => {
        const id = `${card}|${key}`;
        if (seen.has(id) || !text) return;
        seen.add(id);
        out.push({ id, card, para, kind, text, expect: 'ok', ...extra });
    };
    const scan = () => {
        for (const [id, u] of game.unlocked) {
            const c = model.cards.get(id);
            // Topic headings ("Horses") are written for the game on purpose (editorial): not checked.
            if ((c.section === 'entities' && !c.names?.[0]?.editorial) || c.section === 'events') add(id, u.para, c.section === 'events' ? 'event label' : 'name', 'name0', game.nameOf(id));
            if (c.section === 'claims') add(id, u.para, 'statement of a clue', 'text', c.text);
            if (c.section === 'rules') continue;
            for (const it of game.info(id)) {
                if (['mention', 'attestation', 'clue'].includes(it.kind) || (it.kind === 'background' && !it.term)) continue;
                if (it.kind === 'exception') { add(id, it.para, 'exception', it.key, it.text, { exception: true, rule: model.cards.get(it.card).text }); continue; }
                add(id, it.para, it.kind === 'background' ? 'gloss' : it.kind === 'name' ? (it.event ? 'event label' : 'name') : it.kind, it.key, it.term ? `${it.term}: ${it.text}` : it.text);
            }
        }
    };
    while (!game.finished()) { game.advance(); scan(); }
    return out;
}
if (only) items = items.filter((x) => only.includes(x.id));
if (args.includes('--dry')) {
    const by = {};
    for (const i of items) by[i.kind] = (by[i.kind] ?? 0) + 1;
    const words = items.reduce((a, i) => a + story.paragraphs.slice(1, i.para + 1).reduce((b, p) => b + p.display.split(/\s+/).length, 0), 0);
    console.log(`${items.length} pieces`, by, `story words sent in all: ${words} (≈${Math.round(words * 1.35 / 1e6 * 10) / 10}M tokens per run)`);
    process.exit(0);
}

// Answers are cached per (model, run, prompt), so an interrupted run resumes and an unchanged piece is not
// asked again. --runs N asks every piece N times; a piece is flagged if any answer says it leaks.
const runs = Number(opt('runs', 1));
const cacheFile = `.cache/checker-answers-${modelName}.json`;
const answers = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};
const keyOf = (item, run) => crypto.createHash('sha1').update(`${run}|${systemOf(item)}|${promptOf(item)}`).digest('hex');
const useCache = args.includes('--all');
const jobs = [];
for (const item of items) for (let run = 0; run < runs; run++) jobs.push({ item, run });
let done = 0;
const perItem = new Map(items.map((i) => [i, []]));
await Promise.all(Array.from({ length: concurrency }, async () => {
    while (jobs.length) {
        const { item, run } = jobs.shift();
        const key = keyOf(item, run);
        let r = useCache && answers[key] ? { item, ...answers[key], cost: 0 } : null;
        if (!r) {
            r = await ask(item);
            if (r.error) r = await ask(item); // one retry
            if (useCache && !r.error) {
                answers[key] = { answer: r.answer };
                if (++done % 20 === 0) fs.writeFileSync(cacheFile, JSON.stringify(answers));
            }
        }
        perItem.get(item).push(r);
        if (useCache && done % 50 === 0 && done) process.stderr.write(`${done} asked, ${jobs.length} left\n`);
    }
}));
if (useCache) fs.writeFileSync(cacheFile, JSON.stringify(answers));
// One result per item: the first answer that says it leaks, else the first answer.
const results = items.map((item) => {
    const rs = perItem.get(item);
    const leak = rs.find((r) => r.answer?.verdict === 'leak');
    const r = leak ?? rs[0];
    return { ...r, item, cost: rs.reduce((a, x) => a + (x.cost ?? 0), 0), votes: rs.map((x) => x.answer?.verdict ?? 'error') };
});

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
fs.writeFileSync(`.cache/checker-${args.includes('--all') ? 'all-' : ''}${modelName}.json`, JSON.stringify(results, null, 1));
