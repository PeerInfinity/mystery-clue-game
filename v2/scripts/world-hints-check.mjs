// The hints of Watson's timeline through the page, in headless Chrome: a player who only asks for hints (Hint to the
// last rung, then Do it, or read on when the hint says so) must reach the end of the story with every answer the story
// gives found right, no contradiction open and no likely clash unheld; first from a fresh page, then from a page with
// mistakes in it (a wrong answer circled early, a true account distrusted, a right answer crossed out), which the hints
// must find and undo. The wait between hints is set to none.
//   node scripts/world-hints-check.mjs [fresh|mistakes]      (default: both)
//   CASE=<dir> …    another case (the page's ?case=): its mistakes are made from its own data (see `mistakesOf`)
// Needs the game served (node scripts/serve.js; URL, default http://localhost:8321/) and the headless Chrome on port
// 9333 (one script at a time). Exits 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { WORLD, STORE, IS_DEFAULT, pageUrl, CDP } from './case-env.mjs';
const BASE = process.env.URL ?? 'http://localhost:8321/v2/';
const J = JSON.stringify;

const list = await (await fetch(`${CDP}/json`)).json();
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let n = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
});
const send = (method, params = {}) => new Promise((r) => { const id = ++n; pending.set(id, r); ws.send(J({ id, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'eval failed'); return r.result?.result?.value; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });

let failures = 0;
const fail = (why) => { failures++; console.log(`FAIL ${why}`); };
async function run(name, start, expect = []) {
    await send('Page.navigate', { url: pageUrl(BASE) }); await sleep(1200);
    await ev(`localStorage.setItem(${J(STORE)}, ${J(J({ layout: 'three', hintWait: 0, ...start }))}); 1`);
    await send('Page.reload'); await sleep(800);
    for (let i = 0; i < 100 && !(await ev(`!!window.__hint`).catch(() => false)); i++) await sleep(200);
    errors.length = 0;
    const t0 = Date.now(), seen = new Set();
    let hints = 0, presses = 0, last = null, same = 0, stuck = 0, lastPara = null;
    const kinds = {};
    while (hints < 2000) {
        const t = await ev(`window.__hint.target()`);
        if (t.kind === 'done') break;
        // "Read on" that does not move the reader on (the gate holds, and the hints have nothing more) is a failure.
        const at = await ev(`JSON.parse(localStorage.getItem(${J(STORE)})).para`);
        stuck = t.kind === 'read' && at === lastPara ? stuck + 1 : 0;
        lastPara = at;
        if (stuck > 2) { fail(`${name}: the hint is to read on, and the reader does not get past ¶${at}: ${await ev(`document.querySelector('#gate-news')?.innerText ?? ''`)}`); break; }
        const key = J(t);
        same = key === last && t.kind !== 'read' ? same + 1 : 0;
        last = key;
        if (same > 2) { fail(`${name}: the same hint three times over, at ¶${(await ev(`JSON.parse(localStorage.getItem(${J(STORE)})).para`))}: ${t.rungs.join(' / ')}`); break; }
        if (t.kind !== 'read') { hints++; kinds[t.kind] = (kinds[t.kind] ?? 0) + 1; seen.add(t.kind); }
        // Hint to the last rung, then Do it.
        for (let r = 0; r < t.rungs.length; r++) { await ev(`window.__hint.press()`); presses++; }
        await ev(`window.__hint.doIt({ fast: true })`);
        const bad = await ev(`[...document.querySelectorAll('#answer-news li')].filter((li) => li.querySelector('.bad')).map((li) => li.innerText)`);
        for (const b of bad) fail(`${name}: answered wrong: ${b}`);
        if (!(await ev(`document.getElementById('answer-news').hidden`))) await ev(`document.querySelector('[data-answers-close]')?.click(); 1`);
        const err = await ev(`document.querySelector('#hint-news .bad')?.innerText ?? ''`);
        if (err) { fail(`${name}: ${t.rungs.at(-1)} ${err}`); break; }
        if (errors.length) { fail(`${name}: page error: ${errors.splice(0).join(' | ')}`); break; }
    }
    const save = await ev(`JSON.parse(localStorage.getItem(${J(STORE)}))`);
    const end = await ev(`+document.getElementById('para').max`);
    if (save.para !== end) fail(`${name}: stopped at ¶${save.para}`);
    const open = await ev(`document.querySelector('#clashes .clash-box summary')?.innerText ?? ''`);
    if (open) fail(`${name}: at the end, ${open}`);
    const unheld = await ev(`[...document.querySelectorAll('#clashes [data-hold]')].length`);
    if (unheld) fail(`${name}: at the end, ${unheld} likely clash(es) not held`);
    for (const k of expect) if (!seen.has(k)) fail(`${name}: no hint of kind ${k}`);
    console.log(`${name}: ${hints} hints (${Object.entries(kinds).map(([k, v]) => `${k} ${v}`).join(', ')}), ${presses} presses, to ¶${save.para} in ${Math.round((Date.now() - t0) / 1000)} s`);
}
const which = process.argv[2];
const READ_ = (f) => JSON.parse(fs.readFileSync(path.join(WORLD, f), 'utf8'));
if (!which || which === 'fresh') await run('fresh', { para: 1 }, ['move']);
// Every question below the player's dividing line: a hint to link one must still reach it.
if (which === 'below') await run('below the line', { para: 1, qOrder: { above: [], below: READ_('questions.json').questions.map((q) => q.id) } }, ['move']);
// Mistakes. Silver Blaze's: Simpson circled for the blow and the stick for the weapon at ¶20 (before any reason is
// told), the true account of Holmes's recital distrusted, a right answer (the house) crossed out before it is raised.
// Another case's, from its own data (mistakesOf).
const READ = (f) => JSON.parse(fs.readFileSync(path.join(WORLD, f), 'utf8'));
/**
 * Mistakes of the same three kinds for any case: a wrong answer circled on the first question the gate asks about,
 * where it becomes a possibility; the answer of a question not raised yet crossed out; a telling told by then that
 * the true path never distrusts, distrusted.
 */
function mistakesOf() {
    const qs = READ('questions.json').questions, facts = READ('facts.json').facts, moves = READ('path.json').moves;
    const isRight = (q, v) => v === q.answer || (q.also_right ?? []).includes(v);
    const gated = qs.filter((q) => q.answer != null && !q.latent && q.raised != null && q.answer_inferable_at != null && q.answer_inferable_at < q.answer_given_at).sort((a, b) => a.raised - b.raised);
    const marks = {}, expect = ['move'];
    let para = 1;
    const wrongQ = gated.find((q) => q.possibilities.some((p) => p.via !== 'always' && !isRight(q, p.value)));
    if (wrongQ) {
        const w = wrongQ.possibilities.find((p) => p.via !== 'always' && !isRight(wrongQ, p.value));
        para = Math.max(wrongQ.raised, w.available);
        marks[wrongQ.id] = { [w.value]: 'circled' };
        expect.push('unmark');
    }
    const later = gated.find((q) => q.raised > para && q.possibilities.some((p) => p.value === q.answer));
    if (later) { marks[later.id] = { [later.answer]: 'crossed' }; expect.push('uncross'); }
    const distrusted = new Set(moves.filter((m) => m.do === 'trust').map((m) => m.link));
    const tell = facts.find((f) => f.attr === 'tells' && (f.given_at ?? f.para) <= para && f.truth !== false && f.truth !== null && !distrusted.has(f.id));
    const links = {};
    if (tell) { links[tell.id] = 0; expect.push('trust'); }
    return { start: { para, marks, trust: { links, people: {} } }, expect };
}
if (!which || which === 'mistakes') {
    if (IS_DEFAULT) await run('mistakes', { para: 20, marks: { 'q.who_killed': { simpson: 'circled' }, 'q.weapon': { "Simpson's Penang-lawyer": 'circled' }, 'q.drug_where': { 'at the house, after his portion was set apart': 'crossed' } }, trust: { links: { 'f.tell_recital': 0 }, people: {} } }, ['move', 'unmark', 'uncross', 'trust']);
    else { const m = mistakesOf(); console.log(`mistakes: ${J(m.start)}`); await run('mistakes', m.start, m.expect); }
}
console.log(failures ? `${failures} failure(s)` : 'the hints reach the end');
ws.close();
process.exit(failures ? 1 : 0);
