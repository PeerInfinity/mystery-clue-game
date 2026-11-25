// Prose written by a model from a case's typed data, and audited (docs/authored-stories.md, finding 138):
//   node scripts/prose-story.mjs <dir>      MODEL=sonnet (the writer), AUDIT=sonnet (the two readers), TRIES=3
//   node scripts/prose-story.mjs <dir> --audit      the audit alone, of the prose the case has
// The case has world/telling.json (scripts/tell-story.mjs). The writer is given only the sentences the templates
// make of the typed entries, paragraph by paragraph, and the telling's `style` (one line, the author's): it returns
// each paragraph as prose and, for each entry, the words of its prose that state it. The script holds it to that:
// every entry quoted, every quote in its paragraph, every form of a name it says it used in the text, every time
// told. Then two readers audit it. The first reads the prose alone and lists what it states; the second sets that
// list against the typed sentences: what is not stated, what is stated otherwise, what is stated that no entry
// covers. The result is world/prose.json (the prose as given, and the audit), from which tell-story.mjs writes
// the case's files. Each call is `claude -p` from an empty directory with no tools (the pattern of
// scripts/blind-solve.mjs). Costs money: cents for a miniature.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { tell } from './tell-story.mjs';

const MODEL = process.env.MODEL ?? 'sonnet', AUDIT = process.env.AUDIT ?? 'sonnet', TRIES = +(process.env.TRIES ?? 3);
const dir = process.argv.slice(2).find((a) => !a.startsWith('--')), auditOnly = process.argv.includes('--audit');
if (!dir) { console.error('usage: node scripts/prose-story.mjs <dir> [--audit]'); process.exit(1); }
const W = path.join(dir, 'world'), OUT = path.join(W, 'prose.json');
const J = JSON.stringify;
const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'prose-story-'));
let spent = 0;
async function call(model, system, prompt) {
    const args = ['-p', '--model', model, '--tools', '', '--strict-mcp-config', '--setting-sources', '', '--no-session-persistence', '--system-prompt', system, '--output-format', 'json'];
    const so = await new Promise((resolve, reject) => {
        const child = spawn('claude', args, { cwd: empty, stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, CLAUDE_CODE_MAX_OUTPUT_TOKENS: '6000' } });
        let out = '', err = '';
        child.stdout.on('data', (d) => { out += d; });
        child.stderr.on('data', (d) => { err += d; });
        child.on('close', (code) => (out.trim().startsWith('{') ? resolve(out) : reject(new Error(`claude exited ${code}: ${err.slice(0, 400)} ${out.slice(0, 400)}`))));
        child.stdin.end(prompt);
    });
    const r = JSON.parse(so);
    spent += r.total_cost_usd ?? 0;
    return r.result ?? '';
}
/** The JSON object in a reply (a model may wrap it in a fence or a sentence). */
const jsonOf = (text) => { const a = text.indexOf('{'), b = text.lastIndexOf('}'); if (a < 0 || b < a) throw new Error('no JSON object in the reply'); return JSON.parse(text.slice(a, b + 1)); };

const src = tell(dir, { dry: true });
const listing = src.dry.map((items, i) => `Paragraph ${i + 1}\n${items.map((x) => `  [${x.key}] ${x.full}`).join('\n')}`).join('\n\n');

// --- The writer.
const WRITER = `You write the prose of a short detective story from a fixed list of statements. You answer with one JSON object and nothing else.`;
const writerPrompt = (problems) => `Below are the statements of a story titled "${src.title}", paragraph by paragraph, each with its key in square brackets. The narrator is ${src.narrator.name}, who says "I". ${src.style ? `The style wanted: ${src.style}` : ''}

The statements are a clerk's notes: bare, each said the same flat way, every name in full every time. Your work is to tell the same story so that it is a pleasure to read. Use your own sentences. A paragraph that keeps the notes' wording, or that names a person in full where "he", "she" or "his" would do, is not an answer.

What you are free to do:
- Use pronouns and possessives, and after a person is first named in full, a shorter name ("Abel", "Mrs. Crouch", "Pask").
- Join statements into one sentence, split one into two, and order them inside the paragraph as a storyteller would.
- Give the narrator a voice: her turn of phrase, a dry remark, how she came to hear a thing ("he told me over the fence" is NOT allowed, since it adds a place; "he told me, and plainly" is).
- Put what someone said in their own manner of speech, so long as it is direct speech in the first person and says the same want, with what they say it needs, and nothing more.

What you must not do:
- Change the paragraphs: there are as many as in the notes, in the same order, each carrying its own statements.
- Leave a statement out, or weaken it, or make it stronger.
- Add a fact: a new person, place, thing or time; a reason for what anyone did or wanted; how anyone looked or felt, where that tells the reader something about what happened; any hint at the answer.
- Change a time, or leave one unsaid: say each time where the notes say it, though you may word it as reads best ("after dark on the Friday").
- Turn the question (a key beginning "raise:") into anything but a question the narrator asks.

An example, from another story. Notes:
  [f.a] On Tuesday, Mary Holt was at the mill.
  [f.b] On Tuesday, Mary Holt said to me: "I want John Holt's ledger to be burnt."
Prose: "Mary Holt was at the mill on the Tuesday. 'That ledger of John's,' she said to me, 'I want it burnt, and there's an end.'"
Quotes: f.a = "Mary Holt was at the mill on the Tuesday"; f.b = "'That ledger of John's,' she said to me, 'I want it burnt, and there's an end.'"

Answer with this JSON object only:
{"paragraphs": [{"text": "<the paragraph>", "quotes": {"<key>": "<words copied exactly from your paragraph that state this statement>", ...}}, ...],
 "mentions": {"<entity id>": ["<every form of its name you used, exactly as written>", ...], ...},
 "times": {"<time id>": "<the words, copied exactly, that first tell this time>", ...}}
Every key of a paragraph must have its quote, a quote must be one unbroken run of your own words in that paragraph, and it must be enough to state the statement by itself.

The entities: ${src.entities.map((e) => `${e.id} = ${e.name}`).join('; ')}.
The times: ${src.times.filter((x) => x.para != null).map((x) => `${x.id} = ${x.label}`).join('; ')}.

${listing}
${problems?.length ? `\nYour last answer had these faults; mend them and answer again in full:\n${problems.map((p) => `- ${p}`).join('\n')}\n` : ''}`;

/** What is wrong with a writer's answer, by the script's own checks. */
function faults(a) {
    const out = [];
    if (!Array.isArray(a.paragraphs) || a.paragraphs.length !== src.dry.length) return [`there must be exactly ${src.dry.length} paragraphs`];
    a.paragraphs.forEach((p, i) => {
        if (typeof p.text !== 'string' || !p.text.trim()) { out.push(`paragraph ${i + 1} has no text`); return; }
        if (/\n/.test(p.text.trim())) out.push(`paragraph ${i + 1} must be one paragraph, with no line break`);
        const copied = src.dry[i].filter((x) => !x.key.startsWith('raise:') && p.text.includes(x.text.replace(/^On [^,]+(, after dark)?, /, ''))).length;
        for (const e of src.entities) { const k = p.text.split(e.name).length - 1; if (k > 2) out.push(`paragraph ${i + 1} names "${e.name}" in full ${k} times: after the first, a shorter name or a pronoun`); }
        // Copied outright: every statement of a paragraph of two or more, word for word (a name and a role, or a want in someone's own words, may well come out the same).
        if (copied >= 2 && copied >= src.dry[i].filter((x) => !x.key.startsWith('raise:')).length) out.push(`paragraph ${i + 1} copies the notes' own wording (${copied} of its statements word for word): tell it in your own sentences`);
        for (const { key } of src.dry[i]) {
            const q = p.quotes?.[key];
            if (!q) out.push(`paragraph ${i + 1}: no quote for [${key}]`);
            else if (!p.text.includes(q)) out.push(`paragraph ${i + 1}: the quote for [${key}] is not in the paragraph word for word: "${q}"`);
        }
        for (const { key } of src.dry[i]) if (key.startsWith('raise:') && !/\?\s*$/.test(p.quotes?.[key] ?? '?')) out.push(`paragraph ${i + 1}: [${key}] must stay a question`);
    });
    const all = a.paragraphs.map((p) => p.text ?? '').join('\n');
    for (const e of src.entities) for (const m of a.mentions?.[e.id] ?? []) if (!all.includes(m)) out.push(`mentions: "${m}" (${e.id}) is not in the text`);
    for (const x of src.times.filter((t) => t.para != null)) { const q = a.times?.[x.id]; if (!q) out.push(`times: nothing for ${x.id} (${x.label})`); else if (!all.includes(q)) out.push(`times: "${q}" (${x.id}) is not in the text`); }
    return out;
}

let prose = auditOnly ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
if (!prose) {
    let problems = [];
    for (let n = 1; n <= TRIES; n++) {
        const answer = jsonOf(await call(MODEL, WRITER, writerPrompt(problems)));
        problems = faults(answer);
        console.log(`the writer (${MODEL}), try ${n}: ${problems.length ? `${problems.length} fault(s)` : 'kept to the rules the script can check'}`);
        for (const p of problems) console.log(`  ${p}`);
        if (!problems.length) { prose = { model: MODEL, written: new Date().toISOString().slice(0, 10), paragraphs: answer.paragraphs.map((p) => ({ text: p.text.trim(), quotes: p.quotes })), mentions: answer.mentions ?? {}, times: answer.times ?? {} }; break; }
    }
    if (!prose) { console.error(`no answer without faults in ${TRIES} tries ($${spent.toFixed(3)})`); process.exit(1); }
}

// --- The audit: a reader of the prose alone, then a comparer.
const text = prose.paragraphs.map((p, i) => `¶${i + 1} ${p.text}`).join('\n\n');
const read = await call(AUDIT, 'You read a short story closely and list what it states. You answer with one JSON object and nothing else.',
    `Read this story. List every statement of fact it makes: who is who, what was where and when, what was done, what was so, what anyone said and what they said they wanted or needed. One plain sentence each, with the paragraph it is in, the names in full. Leave nothing out, and add nothing the text does not say; where the text only suggests something, list it with "suggests:" in front.\n\nAnswer with this JSON object only: {"statements": [{"para": <n>, "says": "<sentence>"}, ...]}\n\n${text}`);
const statements = jsonOf(read).statements;
const compared = jsonOf(await call(AUDIT, 'You compare two lists of statements about the same story, strictly. You answer with one JSON object and nothing else.',
    `List A is what a story was meant to state, each with its key. List B is what a careful reader found the written story to state.\n\nFor each statement of A say whether B has it: "stated" (the same people, things, places, times and sense), "changed" (B has it weaker, stronger or otherwise different: say how) or "missing". Then list every statement of B that no statement of A covers, leaving out only B's restatements of A and the bare fact that the narrator asks the reader a question. For each such addition say whether it is "colour" (voice or description that tells nothing about what happened or who did it) or "fact" (it tells the reader something A does not).\n\nAnswer with this JSON object only: {"a": [{"key": "<key>", "verdict": "stated" | "changed" | "missing", "how": "<only when changed>"}, ...], "additions": [{"para": <n>, "says": "<B's statement>", "kind": "colour" | "fact"}, ...]}\n\nList A:\n${src.dry.flat().map((x) => `[${x.key}] ${x.full}`).join('\n')}\n\nList B:\n${statements.map((s) => `(¶${s.para}) ${s.says}`).join('\n')}`));
prose.audit = { model: AUDIT, statements: statements.length, missing: compared.a.filter((x) => x.verdict === 'missing').map((x) => x.key), changed: compared.a.filter((x) => x.verdict === 'changed').map((x) => ({ key: x.key, how: x.how ?? '' })), additions: compared.additions ?? [] };
fs.writeFileSync(OUT, `${JSON.stringify(prose, null, 1)}\n`);
for (const [file, t] of Object.entries(tell(dir))) if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== t) { fs.writeFileSync(file, t); console.log(`written: ${file}`); }
const words = prose.paragraphs.reduce((n, p) => n + p.text.split(/\s+/).length, 0);
console.log(`\n${prose.paragraphs.map((p) => p.text).join('\n\n')}\n`);
console.log(`${words} words. The audit (${AUDIT}): the reader found ${statements.length} statements; of the ${compared.a.length} meant, ${prose.audit.missing.length} missing, ${prose.audit.changed.length} changed; ${prose.audit.additions.filter((x) => x.kind === 'fact').length} addition(s) of fact, ${prose.audit.additions.filter((x) => x.kind !== 'fact').length} of colour. $${spent.toFixed(3)}`);
for (const k of prose.audit.missing) console.log(`  missing: ${k}`);
for (const c of prose.audit.changed) console.log(`  changed: ${c.key}: ${c.how}`);
for (const x of prose.audit.additions) console.log(`  added (${x.kind}, ¶${x.para}): ${x.says}`);
fs.rmSync(empty, { recursive: true, force: true });
