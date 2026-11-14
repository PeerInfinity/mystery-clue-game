// A blind solver: a model plays one case through the real page, seeing only what a player sees (the page as text and
// a numbered list of the controls it may use) and the player's guide, and never the case's data, the hints or the
// autoplay. Experiment 2 of docs/authored-stories.md ("Is a miniature fun?"): can the case be solved from the page?
//   CASE=<dir> MODEL=haiku MAX=150 BUDGET=3 node scripts/blind-solve.mjs   (DRY=1: the first prompt only, no call;
//   OUTPUT_CAP: the output tokens one call may write, default 4000; BUDGET: dollars, the run stops there)
// Each turn is one blind call (`claude -p` from an empty directory, no tools, no settings: the pattern of
// v2/pipeline/lib.mjs, copied here). Costs money. The record goes to .cache/blind/<case>/<time>/: each turn's prompt
// and reply, and summary.json (turns, cost, what the story answered and whether the circles were right).
// Starts the local server and a headless Chrome (port 9333, CDP_PORT another) if they are not running.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CASE, WORLD, STORE, pageUrl, CDP, ROOT } from './case-env.mjs';

const MODEL = process.env.MODEL ?? 'haiku';
const MAX = +(process.env.MAX ?? 150);
// Guards on spending: a reply is a few hundred tokens, so each call's output is capped (a Sonnet run of 2026-11-14 had
// two turns write some 128,000 hidden tokens each, $1.70 apiece, before a short reply); and the run stops at BUDGET
// dollars.
const OUTPUT_CAP = +(process.env.OUTPUT_CAP ?? 4000);
const BUDGET = +(process.env.BUDGET ?? 3);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const up = (url) => fetch(url).then((r) => r.ok, () => false);
const J = JSON.stringify;

// --- The page: server and Chrome as page-checks.mjs starts them.
const started = [];
if (!(await up('http://localhost:8321/'))) {
    started.push(spawn(process.execPath, [path.join(ROOT, 'scripts/serve.js')], { stdio: 'ignore' }));
    for (let i = 0; i < 50 && !(await up('http://localhost:8321/')); i++) await sleep(100);
}
if (!(await up(`${CDP}/json/version`))) {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'blind-chrome-'));
    started.push(spawn(process.env.CHROME ?? 'google-chrome', ['--headless=new', `--remote-debugging-port=${process.env.CDP_PORT ?? 9333}`, `--user-data-dir=${profile}`, '--window-size=1400,900', 'about:blank'], { stdio: 'ignore' }));
    for (let i = 0; i < 100 && !(await up(`${CDP}/json/version`)); i++) await sleep(100);
}
const stop = () => { for (const p of started) p.kill(); };

const tabs = await (await fetch(`${CDP}/json`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let n = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise((r) => { const id = ++n; pending.set(id, r); ws.send(J({ id, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'eval failed'); return r.result?.result?.value; };
await send('Page.enable'); await send('Runtime.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: pageUrl('http://localhost:8321/') }); await sleep(1500);
// A fresh page in three columns: every part in view at once.
await ev(`localStorage.setItem(${J(STORE)}, ${J(J({ layout: 'three' }))}); 1`);
await send('Page.reload'); await sleep(1500);
const save = () => ev(`JSON.parse(localStorage.getItem(${J(STORE)}) ?? '{}')`);

// --- What the solver sees. The controls it may not use: the hints, the autoplay, Settings, starting over, the guide
// link (the guide is in the prompt), and the layout. A hint button inside a notice (the gate's) is a hint too.
const SKIP = '#hint, [data-hint], #settings, #reset, #start-over, #autoplay-open, #guide-link, #layout, #theme, #hint-wait, #gate-rule, #hint-news, #view, #only-moves, #depth';
const VIEW = `(() => {
    const vis = (e) => !!e && e.offsetParent !== null;
    const part = (sel, title) => { const e = document.querySelector(sel); const t = vis(e) ? e.innerText.trim() : ''; return t ? '## ' + title + '\\n' + t : ''; };
    const skip = ${J(SKIP)};
    const els = [...document.querySelectorAll('button, a.link, select, #timeline [data-fact] .ph, [data-story], [data-mark-q], input[type=checkbox]')]
        .filter((e) => vis(e) && !e.disabled && !e.matches(skip) && !e.closest(skip));
    document.querySelectorAll('[data-blind]').forEach((e) => e.removeAttribute('data-blind'));
    const where = (e) => (e.closest('#story') ? 'story' : e.closest('#questions') ? 'questions' : e.closest('#clashes') ? 'contradictions' : e.closest('#timeline') ? 'timeline' : e.closest('#detail') ? 'detail' : 'page');
    const controls = els.map((e, i) => {
        e.setAttribute('data-blind', String(i + 1));
        const t = (e.tagName === 'SELECT' ? (e.title || e.closest('label')?.innerText.split('\\n')[0] || 'choose') + ' [now: ' + e.options[e.selectedIndex]?.text + '; options: ' + [...e.options].map((o) => o.text).join(' / ') + ']'
            : (e.getAttribute('title') && e.matches('[data-mark-q]') ? e.innerText + ' (' + e.getAttribute('title') + ')' : e.innerText)).replace(/\\s+/g, ' ').trim().slice(0, 140);
        return (i + 1) + '. [' + where(e) + '] ' + (e.tagName === 'SELECT' ? 'select ' : '') + t;
    });
    const para = document.getElementById('para');
    return {
        text: [part('#gate-news', 'Notice: the gate'), part('#answer-news', 'Notice: the story answered'), part('#lapse-news', 'Notice'),
            part('#story', 'Story panel (read so far, paragraph ' + para.value + ' of ' + para.max + ' of the story shown)'), part('#questions', 'Questions'), part('#clashes', 'Contradictions'),
            part('#timeline', 'Timeline'), part('#detail', 'Detail (what you last opened)')].filter(Boolean).join('\\n\\n'),
        controls: controls.join('\\n'),
        answers: [...document.querySelectorAll('#answer-news li')].filter(vis).map((li) => ({ text: li.innerText.replace(/\\s+/g, ' ').trim(), bad: !!li.querySelector('.bad') })),
    };
})()`;

// The guide, as text (spoiler-free by the project's rule).
const guide = fs.readFileSync(path.join(ROOT, 'guide.html'), 'utf8')
    .replace(/<(style|script|nav)[\s\S]*?<\/\1>/g, '').replace(/<\/(p|h\d|li|dt|dd|section|tr)>/g, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&[a-z]+;/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

const SYSTEM = `You are playing a detective game in a web page, as its reader. A short mystery story is told a paragraph at a time; you build a timeline of what you learn, decide whom to trust, mark answers to the story's questions (circle the one you believe, cross out the ones you rule out), and link the evidence that shows each answer. Before the story gives an answer away, a gate stops you until you have linked the evidence for it and circled an answer. Your aim is to reach the end of the story with every question answered rightly, by reasoning from the evidence; guessing is not the point.

You see the page as text, and a numbered list of the controls you may use. Each turn you do one thing. Reply with only a JSON object, no other text:
{"thought": "<one or two sentences: what you are doing and why>", "notes": "<your running notes, which replace the previous ones and are all you remember besides your last actions: suspects, evidence, what is left to do; under 150 words>", "action": {"click": <number>}}
or, for a control listed as "select", {"select": <number>, "value": "<one of its options>"}.
Click a timeline entry to open it in the Detail panel; the Detail panel then offers what you can do with it (trust, "Relevant to…" links, moves). "Read on ▶" reads the next paragraph.

The player's guide follows.

${guide}`;

// --- One blind call (v2/pipeline/lib.mjs's pattern): no tools, no settings, an empty directory.
const RUN = path.join(ROOT, '.cache', 'blind', CASE.replace(/[^A-Za-z0-9]+/g, '-'), new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(RUN, { recursive: true });
const blindDir = path.join(os.tmpdir(), 'blind-solver');
fs.mkdirSync(blindDir, { recursive: true });
async function call(prompt) {
    const args = ['-p', '--model', MODEL, '--tools', '', '--strict-mcp-config', '--setting-sources', '', '--no-session-persistence', '--system-prompt', SYSTEM, '--output-format', 'json'];
    const out = await new Promise((resolve, reject) => {
        const child = spawn('claude', args, { cwd: blindDir, stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, CLAUDE_CODE_MAX_OUTPUT_TOKENS: String(OUTPUT_CAP) } });
        let so = '', se = '';
        child.stdout.on('data', (d) => { so += d; });
        child.stderr.on('data', (d) => { se += d; });
        child.on('error', reject);
        child.on('close', (code) => (so.trim().startsWith('{') ? resolve(so) : reject(new Error(`claude exited ${code}: ${se.slice(0, 400)} ${so.slice(0, 400)}`))));
        child.stdin.end(prompt);
    });
    const r = JSON.parse(out);
    if (r.is_error) throw new Error(`model error: ${String(r.result).slice(0, 300)}`);
    return { text: r.result ?? '', cost: r.total_cost_usd ?? 0, model: Object.keys(r.modelUsage ?? {})[0] ?? MODEL, usage: r.usage ?? {} };
}
const parse = (text) => { const m = /\{[\s\S]*\}/.exec(text); if (!m) return null; try { return JSON.parse(m[0]); } catch { return null; } };

// --- The loop.
const mainLen = fs.readFileSync(path.join(ROOT, CASE, 'story.txt'), 'utf8').split(/\n\s*\n/).filter((p) => p.trim()).length - 1;
const history = [];
const answered = [];
let notes = '', cost = 0, model = MODEL, turn = 0, end = 'turns ran out';
fs.writeFileSync(path.join(RUN, 'system.md'), SYSTEM);
for (; turn < MAX; turn++) {
    if (cost >= BUDGET) { end = `budget of $${BUDGET} reached`; break; }
    const v = await ev(VIEW);
    for (const a of v.answers) if (!answered.some((x) => x.text === a.text)) { answered.push({ ...a, turn }); console.log(`turn ${turn}: the story answered: ${a.text}${a.bad ? '  (WRONG)' : ''}`); }
    if (((await save()).para ?? 1) >= mainLen) { end = 'reached the end of the story'; break; }
    const prompt = `Your last actions (oldest first):\n${history.slice(-12).map((h) => `- ${h}`).join('\n') || '(none yet)'}\n\nYour notes:\n${notes || '(none yet)'}\n\n# The page now\n\n${v.text}\n\n# Controls\n${v.controls}\n\nYour move (one JSON object).`;
    if (process.env.DRY) { fs.writeFileSync(path.join(RUN, 'dry.md'), prompt); console.log(`DRY: the first prompt is ${prompt.length} characters, the system prompt ${SYSTEM.length}; written to ${path.relative(ROOT, RUN)}/dry.md`); end = 'dry run'; break; }
    let reply, a;
    try { reply = await call(prompt); } catch (e) { console.log(`turn ${turn}: ${e.message}`); end = `call failed: ${e.message}`; break; }
    cost += reply.cost; model = reply.model;
    if (reply.cost > 0.25) console.log(`turn ${turn}: this call cost $${reply.cost.toFixed(2)} (${reply.usage.output_tokens} output tokens)`);
    fs.writeFileSync(path.join(RUN, `${String(turn).padStart(3, '0')}.md`), `${prompt}\n\n<!-- reply -->\n${reply.text}\n\n<!-- cost ${reply.cost} usage ${J(reply.usage)} -->\n`);
    a = parse(reply.text);
    if (!a?.action) { history.push(`(a reply that was not a JSON action: ${reply.text.slice(0, 80)})`); continue; }
    if (typeof a.notes === 'string') notes = a.notes.slice(0, 1500);
    const num = a.action.click ?? a.action.select;
    const label = (v.controls.split('\n').find((l) => l.startsWith(`${num}. `)) ?? `${num}. (no such control)`).replace(/^\d+\. /, '');
    const before = J(await save()) + (await ev(`document.querySelector('.world-main')?.innerText ?? document.body.innerText`));
    const did = a.action.select != null
        ? await ev(`(() => { const e = document.querySelector('[data-blind="${num}"]'); if (!e || e.tagName !== 'SELECT') return false; const o = [...e.options].find((o) => o.text.trim() === ${J(String(a.action.value ?? '').trim())}); if (!o) return false; e.value = o.value; e.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`)
        : await ev(`(() => { const e = document.querySelector('[data-blind="${num}"]'); if (!e) return false; e.click(); return true; })()`);
    await sleep(200);
    const after = J(await save()) + (await ev(`document.querySelector('.world-main')?.innerText ?? document.body.innerText`));
    const note = await ev(`document.querySelector('#detail .note')?.innerText ?? ''`);
    const what = a.action.select != null ? `select ${label} = ${a.action.value}` : `click ${label}`;
    const result = !did ? 'not possible' : before === after ? 'nothing changed' : 'done';
    history.push(`${what} → ${result}${note ? ` (${note})` : ''}`);
    console.log(`turn ${turn}: ${what} → ${result}  | ${String(a.thought ?? '').slice(0, 120)}`);
    if (errors.length) console.log(`  page error: ${errors.splice(0).join(' | ')}`);
}
const final = await save();
const keys = JSON.parse(fs.readFileSync(path.join(WORLD, 'questions.json'), 'utf8')).questions.map((q) => ({ q: q.id, answer: q.answer, marks: final.marks?.[q.id] ?? {} }));
const summary = { case: CASE, model, turns: turn, end, cost_usd: Math.round(cost * 1000) / 1000, answered, marks: keys, links: final.links ?? [], reasoning: final.reasoning ?? [], record: path.relative(ROOT, RUN) };
fs.writeFileSync(path.join(RUN, 'summary.json'), J(summary, null, 2) + '\n');
console.log(`\n${end} after ${turn} turns, $${summary.cost_usd} (${model}); record in ${summary.record}`);
for (const k of keys) console.log(`  ${k.q}: the answer ${k.answer}; marks ${J(k.marks)}`);
ws.close();
stop();
process.exit(0);
