// The careful reader asked for by the host of an Archipelago (`mystery:autoSolve`; ui/world-autoplay.js `live`,
// ui/bridge.js), against the stand-in host (`?bridge=stub`): in the page's own save, with no reload.
//   CASE=<dir> [SEED=<n>] [OFFLINE=1] node scripts/bridge-solve-check.mjs   (OFFLINE: the host has no server; the same must hold)
// A case with visits: asked with no paper held, it must wait and say what each question lacks; the papers are then
// given one at a time, in the reverse of the path's order, and after each it must go on by itself and never fail; it
// makes no visit and ends no day; it ends `done` with the goal solved and checked by the host. A case whose papers
// are earned: asked once, it must reach `done` with every question solved (each solve brings the next papers).
// Then, afresh: a stop from the host and a click of the player's each end it (`stopped`, the strip gone, no reload),
// and it can be asked again.
// Needs the game served and the headless Chrome (scripts/page-checks.mjs starts both).
import fs from 'node:fs';
import path from 'node:path';
process.env.BRIDGE = '1';
const { CASE, CDP, WORLD, STORE, pageUrl } = await import('./case-env.mjs');

const R = (f) => JSON.parse(fs.readFileSync(path.join(WORLD, f), 'utf8'));
const header = R('case.json'), moves = R('path.json').moves, questions = R('questions.json').questions;
const VISITS = (header.files ?? []).some((f) => f.visit), SEED = Number(process.env.SEED ?? 1);
const J = JSON.stringify, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tabs = await (await fetch(`${CDP}/json`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let n = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    // A save left by an earlier run, with questions the stand-in host does not list: the page asks whether this is a new room. It is.
    if (m.method === 'Page.javascriptDialogOpening') send('Page.handleJavaScriptDialog', { accept: true });
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise((r) => { const id = ++n; pending.set(id, r); ws.send(J({ id, method, params })); });
// (An evaluation sent while the page is loading may never be answered: it is given up after a while.)
const ev = async (expr) => { const r = await Promise.race([sleep(20000).then(() => { throw new Error('no answer from the page'); }), send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })]); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'eval failed'); return r.result?.result?.value; };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
let failures = 0;
const fail = (why) => { failures++; console.log(`FAIL ${why}`); };
const URL_ = pageUrl(process.env.URL ?? 'http://localhost:8321/', [`seed=${SEED}`, 'iframeId=mystery&bridge=stub', ...(process.env.OFFLINE ? ['stubOffline=1'] : []), 'answers=evidence'].join('&'));
const marker = `window.__sameLoad = true; 1`;
async function fresh() {
    await send('Page.navigate', { url: URL_ }); await sleep(800);
    await ev(`localStorage.removeItem(${J(STORE)}); 1`);
    await send('Page.navigate', { url: URL_ }); await sleep(1200);
    for (let i = 0; i < 150 && !(await ev(`!!window.__stub && !!window.__ap?.onAutoSolve && !!document.getElementById('next')`).catch(() => false)); i++) await sleep(100);
    await sleep(500);
    await ev(marker);
    errors.length = 0;
}
const statuses = () => ev('window.__stub.statuses()');
const save = () => ev(`JSON.parse(localStorage.getItem(${J(STORE)}) ?? '{}')`);
/** Wait until the page's last word is one of these (and, for `waiting`, has stood a second). */
async function until(states, ms = 600000) {
    let last = null, since = Date.now();
    for (const t0 = Date.now(); Date.now() - t0 < ms;) {
        const all = await statuses(), s = all.at(-1);
        const key = `${all.length}:${s?.state}`;
        if (key !== last) { last = key; since = Date.now(); }
        if (s && states.includes(s.state) && (s.state !== 'waiting' || Date.now() - since > 1000)) return s;
        if (s?.state === 'failed') return s;
        await sleep(150);
    }
    return { state: 'timeout' };
}

// ---------- to the end ----------
await fresh();
const t0 = Date.now();
await ev('window.__stub.autoSolve({ fast: true }); 1');
if (VISITS) {
    const papers = [...new Set(moves.filter((m) => m.do === 'visit').map((m) => m.file))].reverse();
    let s = await until(['waiting', 'done']);
    if (s.state !== 'waiting') fail(`asked with no paper held, the page says ${s.state}`);
    else if (!s.waiting?.length || !s.waiting.every((w) => w.ways.length && w.ways.every((x) => x.papers.length))) fail(`waiting, and it does not say what each question lacks: ${J(s.waiting)}`);
    let given = 0;
    for (const p of papers) {
        if (s.state !== 'waiting') break;
        await ev(`window.__stub.give(${J(p)}); 1`); given++;
        await sleep(300);
        s = await until(['waiting', 'done']);
        if (s.state === 'waiting' && s.waiting.some((w) => w.ways.some((x) => x.papers.includes(p)))) fail(`${p} was given, and the page still says it lacks it`);
    }
    if (s.state !== 'done') fail(`with every paper given the page says ${s.state}${s.failed ? `: ${s.failed.why}` : ''}`);
    const sv = await save();
    if ((sv.visits?.day ?? 1) !== 1) fail(`the page ended a day (day ${sv.visits.day}): the day is the host's`);
    console.log(`  ${given} of ${papers.length} papers given, in the reverse of the path's order`);
} else {
    const s = await until(['done']);
    if (s.state !== 'done') fail(`the page says ${s.state}${s.failed ? `: ${s.failed.why}` : ''}`);
}
{
    const sv = await save(), solved = Object.keys(sv.solved ?? {}), host = await ev('window.__stub.solved()'), last = (await statuses()).at(-1);
    const goal = questions.find((q) => q.answer != null && Number.isInteger(q.answer_given_at)) ?? questions[0];
    if (!solved.includes(goal.id)) fail(`the goal (${goal.id}) is not solved`);
    for (const q of solved) if (!host.includes(q)) fail(`${q} is solved on the page and the host has no check for it`);
    if (J([...(last?.solved ?? [])].sort()) !== J([...solved].sort())) fail(`the last status lists ${J(last?.solved)} solved, the page has ${J(solved)}`);
    if (!(await ev('window.__sameLoad === true'))) fail('the page was reloaded');
    if (errors.length) fail(`page error: ${errors.splice(0).join(' | ')}`);
    console.log(`  ${(await statuses()).map((x) => x.state).join(' → ').replace(/(running → waiting → )+/g, (m) => `(running → waiting)×${m.length / 20} → `)}; ${solved.length} question(s) solved in ${Math.round((Date.now() - t0) / 1000)} s`);
}

// ---------- stopped by the host, and by the player ----------
for (const [who, stop] of [['the host', () => ev('window.__stub.autoSolve({ stop: true }); 1')], ['the player', async () => {
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: 700, y: 880, button: 'left', clickCount: 1 });
}]]) {
    await fresh();
    await ev('window.__stub.autoSolve({}); 1');
    for (let i = 0; i < 50 && !(await ev(`!!document.querySelector('.autoplay-strip')`)); i++) await sleep(100);
    if (!(await ev(`!!document.querySelector('.autoplay-strip')`))) { fail(`stopped by ${who}: the strip never showed`); continue; }
    await sleep(700);
    await stop();
    const s = await until(['stopped'], 15000);
    if (s.state !== 'stopped') fail(`stopped by ${who}: the page says ${s.state}`);
    if (await ev(`!!document.querySelector('.autoplay-strip') || document.body.classList.contains('autoplaying')`)) fail(`stopped by ${who}: the strip is still there`);
    if (!(await ev('window.__sameLoad === true'))) fail(`stopped by ${who}: the page was reloaded`);
    // And asked again, it starts again.
    const before = (await statuses()).length;
    await ev('window.__stub.autoSolve({ fast: true }); 1');
    for (let i = 0; i < 50 && (await statuses()).length === before; i++) await sleep(100);
    if ((await statuses()).length === before) fail(`stopped by ${who}: asked again, the page says nothing`);
    await ev('window.__stub.autoSolve({ stop: true }); 1');
    await sleep(300);
    if (errors.length) fail(`stopped by ${who}: page error: ${errors.splice(0).join(' | ')}`);
}
console.log(failures ? `${failures} FAILED` : 'ok: the careful reader, asked for by the host, plays in the live save, waits for papers, and stops when told');
ws.close();
process.exit(failures ? 1 : 0);
