// A blind solver: a model plays one case through the real page, seeing only what a player sees (the page as text and
// a numbered list of the controls it may use) and the player's guide, and never the case's data, the hints or the
// autoplay. Experiment 2 of docs/authored-stories.md ("Is a miniature fun?"): can the case be solved from the page?
//   CASE=<dir> MODEL=haiku MAX=150 BUDGET=3 node scripts/blind-solve.mjs   (ANSWERS=hand: the answers marked by the solver; DRY=1: the first prompt only, no call;
//   OUTPUT_CAP: the output tokens one call may write, default 4000; BUDGET: dollars for the whole run, it stops there)
// A long run in parts: MAX is the turns of one invocation, and the run's state (the page's save, the solver's notes
// and last actions, the cost) is kept in its record after every turn, so
//   CASE=<dir> RESUME=last MAX=100 node scripts/blind-solve.mjs    goes on where the case's latest run stopped
//   CASE=<dir> STATUS=last node scripts/blind-solve.mjs            says where it stands (no call, no Chrome)
// (`last` or a record's directory). STUCK=200: the run ends when that many turns pass with nothing new read and no
// question solved (0: never). SEED: the placement of an earned case's papers (default: drawn by the page).
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
const STUCK = +(process.env.STUCK ?? 200);
const OUTPUT_CAP =+(process.env.OUTPUT_CAP ?? 4000);
const BUDGET = +(process.env.BUDGET ?? 3);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const up = (url) => fetch(url).then((r) => r.ok, () => false);
const J = JSON.stringify;

// --- The run's record, and the state a run goes on from (RESUME) or reports (STATUS).
const RUNS = path.join(ROOT, '.cache', 'blind', CASE.replace(/[^A-Za-z0-9]+/g, '-'));
const runDir = (v) => {
    if (v !== 'last') return path.resolve(ROOT, v);
    const all = fs.existsSync(RUNS) ? fs.readdirSync(RUNS).sort().filter((d) => fs.existsSync(path.join(RUNS, d, 'state.json'))) : [];
    if (!all.length) { console.error(`no run of ${CASE} with a state to go on from in ${path.relative(ROOT, RUNS)}`); process.exit(1); }
    return path.join(RUNS, all.at(-1));
};
const from = process.env.RESUME ?? process.env.STATUS;
const RUN = from ? runDir(from) : path.join(RUNS, new Date().toISOString().replace(/[:.]/g, '-'));
const kept = from ? JSON.parse(fs.readFileSync(path.join(RUN, 'state.json'), 'utf8')) : null;
const QUESTIONS = JSON.parse(fs.readFileSync(path.join(WORLD, 'questions.json'), 'utf8')).questions;
const standing = (st) => {
    const sv = st.save ?? {}, solved = Object.keys(sv.solved ?? {});
    return [`${path.relative(ROOT, RUN)}: ${st.turn} turns, $${Math.round(st.cost * 1000) / 1000} (${st.model}); ${st.end ?? 'not ended'}`,
        `  the story: paragraph ${sv.para ?? 1} of ${st.mainLen}; paragraphs read in all (the papers too): ${sv.log?.length ?? 0}`,
        `  questions solved: ${solved.length} of ${QUESTIONS.length}${solved.length ? ` (${solved.join(', ')})` : ''}`,
        `  questions circled: ${QUESTIONS.filter((q) => Object.values(sv.marks?.[q.id] ?? {}).includes('circled')).length}; links: ${sv.links?.length ?? 0}`,
        `  the last turn that read something new or solved a question: ${st.progressTurn} (${st.turn - st.progressTurn} turns ago${STUCK ? `; the run ends at ${STUCK}` : ''})`,
        `  the story answered: ${st.answered.length ? st.answered.map((a) => `${a.text}${a.bad ? ' (WRONG)' : ''}`).join(' | ') : 'nothing yet'}`,
        `  the solver's notes: ${st.notes || '(none)'}`,
        '  its last actions:', ...st.history.slice(-8).map((h) => `    - ${String(h).split('  [why: ')[0]}`),
        `  its reports: ${st.reports?.length ? '' : 'none'}`, ...(st.reports ?? []).map((r) => `    - turn ${r.turn} (story paragraph ${r.para}): ${r.report}`)].join('\n');
};
if (process.env.STATUS) { console.log(standing(kept)); process.exit(0); }
if (kept?.done) { console.error(`that run is over (${kept.end}); nothing to go on with`); process.exit(1); }

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
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { stop(); process.exit(1); });

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
// The answers marked from what the evidence implies, the page's default (the address says it: the setting is not
// the solver's); ANSWERS=hand: marked by the solver. A run gone on with keeps its own.
const ANSWERS = (process.env.ANSWERS ?? kept?.answers ?? 'evidence') === 'hand' ? '' : 'answers=evidence';
await send('Page.navigate', { url: pageUrl('http://localhost:8321/', ANSWERS) }); await sleep(1500);
// A fresh page in three columns: every part in view at once. A run gone on with: the page as it was saved.
await ev(`localStorage.setItem(${J(STORE)}, ${J(J(kept?.save ?? { layout: 'three', ...(process.env.SEED ? { seed: +process.env.SEED } : {}) }))}); 1`);
await send('Page.reload'); await sleep(1500);
const save = () => ev(`JSON.parse(localStorage.getItem(${J(STORE)}) ?? '{}')`);

// --- What the solver sees. The controls it may not use: the hints, the autoplay, Settings, starting over, the guide
// link (the guide is in the prompt), and the layout. A hint button inside a notice (the gate's) is a hint too.
const SKIP = '#answer-rule, #hint, [data-hint], #settings, #reset, #start-over, #autoplay-open, #guide-link, #layout, #theme, #hint-wait, #gate-rule, #hint-news, #view, #only-moves, #depth';
const VIEW = `(() => {
    const vis = (e) => !!e && e.offsetParent !== null;
    const part = (sel, title) => { const e = document.querySelector(sel); const t = vis(e) ? e.innerText.trim() : ''; return t ? '## ' + title + '\\n' + t : ''; };
    const skip = ${J(SKIP)};
    const els = [...document.querySelectorAll('button, a.link, select, #left-box > summary, #timeline [data-fact] .ph, #timeline .question, #timeline .event.hyp, [data-story], [data-mark-q], input[type=checkbox]')]
        .filter((e) => vis(e) && !e.disabled && !e.matches(skip) && !e.closest(skip));
    document.querySelectorAll('[data-blind]').forEach((e) => e.removeAttribute('data-blind'));
    const where = (e) => (e.closest('#story') ? 'story' : e.closest('#questions') ? 'questions' : e.closest('#clashes') ? 'contradictions' : e.closest('#timeline') ? 'timeline' : e.closest('#detail') ? 'detail' : e.closest('#room') ? 'room' : 'page');
    const controls = els.map((e, i) => {
        e.setAttribute('data-blind', String(i + 1));
        const t = (e.tagName === 'SELECT' ? (e.title || e.closest('label')?.innerText.split('\\n')[0] || 'choose') + ' [now: ' + e.options[e.selectedIndex]?.text + '; options: ' + [...e.options].map((o) => o.text).join(' / ') + ']'
            : (e.getAttribute('title') && e.matches('[data-mark-q]') ? e.innerText + ' (' + e.getAttribute('title') + ')'
            : e.matches('input[type=checkbox]') ? 'checkbox: ' + (e.closest('label')?.innerText || e.title || 'a setting') + (e.checked ? ' [now: on]' : ' [now: off]')
            // A button on an entry's line of the timeline (the link button, while linking) names its entry: a reader sees it
            // beside the entry, and a bare "+ relevant" among hundreds sent a solver to click the entry's line instead.
            : e.matches('[data-move-s]') ? (e.closest('li')?.innerText ?? e.innerText)   // "This speaks of…" with the entry it is offered beside
            : e.tagName === 'BUTTON' && e.closest('#timeline [data-fact]')?.querySelector('.ph') ? e.innerText + ' ← for the entry: ' + e.closest('#timeline [data-fact]').querySelector('.ph').innerText : e.innerText)).replace(/\\s+/g, ' ').trim().slice(0, 170);
        return (i + 1) + '. [' + where(e) + '] ' + (e.tagName === 'SELECT' ? 'select ' : '') + t;
    });
    const para = document.getElementById('para');
    return {
        text: [part('#gate-news', 'Notice: the gate'), part('#answer-news', 'Notice: the story answered'), part('#solved-news', 'Notice: solved'), part('#lapse-news', 'Notice'),
            part('#story', 'Story panel (read so far, paragraph ' + para.value + ' of ' + para.max + ' of the story shown)'), part('#questions', 'Questions'), part('#clashes', 'Contradictions'),
            part('#timeline', 'Timeline'), part('#room', 'The room'), part('#detail', 'Detail (what you last opened)')].filter(Boolean).join('\\n\\n'),
        controls: controls.join('\\n'),
        answers: [...document.querySelectorAll('#answer-news li')].filter(vis).map((li) => ({ text: li.innerText.replace(/\\s+/g, ' ').trim(), bad: !!li.querySelector('.bad') })),
    };
})()`;

// The guide, as text (spoiler-free by the project's rule).
const guide = fs.readFileSync(path.join(ROOT, 'guide.html'), 'utf8')
    .replace(/<(style|script|nav)[\s\S]*?<\/\1>/g, '').replace(/<\/(p|h\d|li|dt|dd|section|tr)>/g, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&[a-z]+;/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

const SYSTEM = (ANSWERS ? `In this game the setting "Answers: marked from the evidence" is on (the guide's Settings describe it). For the questions it covers you do not circle or cross out answers, and clicking one does nothing: link evidence, and the page crosses an answer out when what you have shown rules it out, circles it when it follows, and shows under the question what follows from what. Where the text below speaks of circling an answer, for those questions it is done for you. A question whose answers still respond to your click is marked by you as usual.\n\n` : '') + `You are playing a detective game in a web page, as its reader. A mystery story is told a paragraph at a time; you build a timeline of what you learn, decide whom to trust, mark answers to the story's questions (circle the one you believe, cross out the ones you rule out), and link the evidence that shows each answer. Before the story gives an answer away, a gate stops you until you have linked the evidence for it and circled an answer. In a longer story, papers come to you as you solve its questions (the guide says how), and the story's ending is held until its last question is solved. In such a story solve the smaller questions first: the last question rests on them, and most of its evidence is in papers that only come as they are solved. A question is solved only when the page says "Solved"; a circled answer alone is not. Your aim is to reach the end of the story with every question answered rightly, by reasoning from the evidence; guessing is not the point.

You see the page as text, and a numbered list of the controls you may use. Each turn you do one thing. You have no tools: do not write tool calls or XML. Reply with only a JSON object, no other text:
{"thought": "<one or two sentences: what you are doing and why>", "notes": "<your running notes, which replace the previous ones and are all you remember besides your last actions and the thought you had for each: suspects, evidence, what is left to do; under 150 words>", "action": {"click": <number>}}
or, for a control listed as "select", {"select": <number>, "value": "<one of its options>"}.
If you notice something wrong, you may add one more field to that object: "report": "<what is wrong and where, in a sentence or two>". Use it for a fault in the story's logic (two things that cannot both be true and are not meant as a lie, a question that cannot be answered from what you have, an answer you were held to that the evidence does not show), a fault in the page (a control that does not do what it says, text that is unclear or misleading), or anything else the game's makers should know. A report changes nothing in the game and is not shown to you again, so make each one once, and only when you are fairly sure; being unsure of an answer is not a fault.
Click a timeline entry to open it in the Detail panel; the Detail panel then offers what you can do with it (trust, "Relevant to…" links, moves). "Read on ▶" reads the next paragraph.

The player's guide follows.

${guide}`;

// --- One blind call (v2/pipeline/lib.mjs's pattern): no tools, no settings, an empty directory.
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
// The reply: the JSON asked for, or (Sonnet, 2026-11-14, a turn in four) a tool call written out as text
// (`<invoke name="click"><parameter name="click">43</parameter></invoke>`, often repeated): its first action is taken.
const parse = (text) => {
    const m = /\{[\s\S]*\}/.exec(text);
    if (m) try { return JSON.parse(m[0]); } catch { /* not JSON: try the other form */ }
    const c = /<parameter name="(click|select)">\s*(\d+)\s*<\/parameter>/.exec(text);
    if (!c) return null;
    const v = /<parameter name="value">([^<]*)<\/parameter>/.exec(text);
    return { action: c[1] === 'select' ? { select: +c[2], value: v?.[1] ?? '' } : { click: +c[2] }, written_as_a_call: true };
};

// --- The loop.
const mainLen = fs.readFileSync(path.join(ROOT, CASE, 'story.txt'), 'utf8').split(/\n\s*\n/).filter((p) => p.trim()).length - 1;
// What the solver remembers besides its notes: its last HISTORY actions, each with how it went and the thought it
// had for it (so that it sees why it did a thing, and that it did not work), and a count of any action it has
// repeated (a run of 2026-11-16 pressed one button 117 times in 146 turns with twelve actions and no thoughts kept).
const HISTORY = +(process.env.HISTORY ?? 30), REPEATS = 4;
const history = kept?.history ?? [];
const actOf = (h) => String(h).split(' → ')[0];
const repeated = () => {
    const n = new Map();
    for (const h of history.slice(-HISTORY)) n.set(actOf(h), (n.get(actOf(h)) ?? 0) + 1);
    return [...n].filter(([a, k]) => k >= REPEATS && !/Read on/.test(a)).sort((x, y) => y[1] - x[1]).map(([a, k]) => `- ${k} times: ${a}`);
};
const answered = kept?.answered ?? [];
const reports = kept?.reports ?? [];
let notes = kept?.notes ?? '', cost = kept?.cost ?? 0, model = kept?.model ?? MODEL, turn = kept?.turn ?? 0, end = `the ${MAX} turns of this part ran out`;
// Progress: something newly read (the story or a paper) or a question solved. `progressTurn`: the last turn with any.
let progressTurn = kept?.progressTurn ?? 0, done = false;
const measure = (sv) => (sv.log?.length ?? 0) + 1000 * Object.keys(sv.solved ?? {}).length;
let best = kept ? measure(kept.save) : 0;
/** Keeps the run's state after `turns` turns, so that it can be gone on with from there. */
const keep = async (turns) => {
    const sv = await save();
    if (measure(sv) > best) { best = measure(sv); progressTurn = turns; }
    fs.writeFileSync(path.join(RUN, 'state.json'), J({ case: CASE, model, turn: turns, cost, notes, history: history.slice(-HISTORY), answered, reports, progressTurn, mainLen, done, end: done ? end : null, answers: ANSWERS ? 'evidence' : 'hand', save: sv }) + '\n');
};
if (kept) console.log(`going on with ${path.relative(ROOT, RUN)} from turn ${turn} ($${cost.toFixed(3)} so far)`);
fs.writeFileSync(path.join(RUN, 'system.md'), SYSTEM);
for (const first = turn; turn < first + MAX; turn++) {
    if (STUCK && turn - progressTurn >= STUCK) { end = `stuck: ${STUCK} turns with nothing new read and no question solved`; done = true; break; }
    if (cost >= BUDGET) { end = `budget of $${BUDGET} reached`; break; }
    const v = await ev(VIEW);
    for (const a of v.answers) if (!answered.some((x) => x.text === a.text)) { answered.push({ ...a, turn }); console.log(`turn ${turn}: the story answered: ${a.text}${a.bad ? '  (WRONG)' : ''}`); }
    if (((await save()).para ?? 1) >= mainLen) { end = 'reached the end of the story'; done = true; break; }
    const again = repeated();
    const prompt = `Your last actions (oldest first), each with how it went and why you did it:\n${history.slice(-HISTORY).map((h) => `- ${h}`).join('\n') || '(none yet)'}${again.length ? `\n\nRepeated in your last ${Math.min(HISTORY, history.length)} actions (if one of these has not got you further, do something else):\n${again.join('\n')}` : ''}\n\nYour notes:\n${notes || '(none yet)'}\n\n# The page now\n\n${v.text}\n\n# Controls\n${v.controls}\n\nYour move (one JSON object).`;
    if (process.env.DRY) { fs.writeFileSync(path.join(RUN, 'dry.md'), prompt); console.log(`DRY: the first prompt is ${prompt.length} characters, the system prompt ${SYSTEM.length}; written to ${path.relative(ROOT, RUN)}/dry.md`); end = 'dry run'; break; }
    let reply, a;
    try { reply = await call(prompt); } catch (e) { console.log(`turn ${turn}: ${e.message}`); end = `call failed: ${e.message}`; break; }
    cost += reply.cost; model = reply.model;
    if (reply.cost > 0.25) console.log(`turn ${turn}: this call cost $${reply.cost.toFixed(2)} (${reply.usage.output_tokens} output tokens)`);
    fs.writeFileSync(path.join(RUN, `${String(turn).padStart(3, '0')}.md`), `${prompt}\n\n<!-- reply -->\n${reply.text}\n\n<!-- cost ${reply.cost} usage ${J(reply.usage)} -->\n`);
    a = parse(reply.text);
    if (!a?.action) { history.push(`(a reply that was not a JSON action: ${reply.text.slice(0, 80)})`); await keep(turn + 1); continue; }
    if (typeof a.notes === 'string') notes = a.notes.slice(0, 1500);
    if (typeof a.report === 'string' && a.report.trim()) { reports.push({ turn, para: (await save()).para ?? 1, report: a.report.trim().slice(0, 1000) }); console.log(`turn ${turn}: REPORT: ${a.report.trim().slice(0, 1000)}`); }
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
    history.push(`${what} → ${result}${note ? ` (${note})` : ''}${a.thought ? `  [why: ${String(a.thought).replace(/\s+/g, ' ').slice(0, 200)}]` : ''}`);
    console.log(`turn ${turn}: ${what} → ${result}  | ${String(a.thought ?? '').slice(0, 120)}`);
    if (errors.length) console.log(`  page error: ${errors.splice(0).join(' | ')}`);
    await keep(turn + 1);
}
if (!process.env.DRY) await keep(turn);
const final = await save();
const keys = QUESTIONS.map((q) => ({ q: q.id, answer: q.answer, marks: final.marks?.[q.id] ?? {} }));
const summary = { case: CASE, model, turns: turn, end, solved: Object.keys(final.solved ?? {}), reports, cost_usd: Math.round(cost * 1000) / 1000, answered, marks: keys, links: final.links ?? [], reasoning: final.reasoning ?? [], record: path.relative(ROOT, RUN) };
fs.writeFileSync(path.join(RUN, 'summary.json'), J(summary, null, 2) + '\n');
console.log(`\n${end} after ${turn} turns, $${summary.cost_usd} (${model}); record in ${summary.record}`);
if (!done && !process.env.DRY) console.log(`to go on: CASE=${CASE} RESUME=last MAX=${MAX} node scripts/blind-solve.mjs   (where it stands: STATUS=last)`);
for (const k of keys) console.log(`  ${k.q}: the answer ${k.answer}; marks ${J(k.marks)}`);
ws.close();
stop();
process.exit(0);
