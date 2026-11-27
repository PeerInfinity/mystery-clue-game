// The lock of a case that is one region of a generated world (`lock` and `inOffice` in `mystery:state`; ui/world.js
// `locked`, ui/bridge.js), against the stand-in host (`?bridge=stub`).
//   CASE=<dir> [SEED=<n>] node scripts/bridge-lock-check.mjs
// Away from the office: the page says so, the careful reader is refused (`stopped`, `locked`) or stopped if it runs,
// a click on any move changes nothing in the save and sends nothing to the host; under `new-reading` a paper not yet
// begun is listed and does not open. Back in the office everything works again and the case can be played to its end.
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
const URL_ = pageUrl(process.env.URL ?? 'http://localhost:8321/', [`seed=${SEED}`, 'iframeId=mystery&bridge=stub', 'answers=evidence'].join('&'));
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


const MOVES = '[data-link-entry], [data-move-s], [data-move-a], [data-move-m], [data-move-c], [data-move-b], [data-hold], [data-mark-q], [data-set-trust], [data-agree], #undo';
const kept = async () => { const sv = await save(); return J([sv.marks ?? {}, sv.links ?? [], sv.trust ?? {}, sv.reasoning ?? [], sv.held ?? [], Object.keys(sv.solved ?? {})]); };
const lockedNow = () => ev(`document.body.classList.contains('ap-locked') && !document.getElementById('ap-lock')?.hidden`);

await fresh();
if (await lockedNow()) fail('with no lock in the state the page is locked');
// Some play first, so that there is something on the page to click: the careful reader, stopped by the lock.
// (A case with visits: its papers given as the visits would find them, but for the last, which comes while away.)
const found = VISITS ? [...new Set(moves.filter((m) => m.do === 'visit').map((m) => m.file))] : [], late = found.pop() ?? null;
for (const p of found) await ev(`window.__stub.give(${J(p)}); 1`);
await ev('window.__stub.autoSolve({}); 1');
for (let i = 0; i < 50 && !(await ev(`!!document.querySelector('.autoplay-strip')`)); i++) await sleep(100);
await sleep(2500);
await ev(`window.__stub.lock('actions', false); 1`);
{
    const s = await until(['stopped'], 15000);
    if (s.state !== 'stopped') fail(`locked while the careful reader ran: the page says ${s.state}`);
}
await sleep(400);
if (!(await lockedNow())) fail('away from the office the page does not say it is locked');
// Asked while locked: refused.
await ev('window.__stub.autoSolve({ fast: true }); 1');
await sleep(600);
{
    const s = (await statuses()).at(-1);
    if (s?.state !== 'stopped' || s.locked !== true) fail(`asked for the careful reader while locked, the page says ${J(s)}`);
}
// Every move on the page, clicked: nothing changes, nothing is sent.
{
    const before = await kept(), host = J(await ev('window.__stub.solved()'));
    const count = await ev(`document.querySelectorAll(${J(MOVES)}).length`);
    let clicked = 0;
    for (let i = 0; i < Math.min(count, 40); i++) {
        clicked += await ev(`(() => { const el = document.querySelectorAll(${J(MOVES)})[${i}]; if (!el) return 0; el.click(); return 1; })()`);
        if ((await kept()) !== before) { fail(`locked, and a click changed the save (move ${i})`); break; }
    }
    // A level of trust set by its list.
    const sel = await ev(`(() => { const el = document.querySelector('.link-trust, .person-trust, .narration-trust'); if (!el) return 0; el.selectedIndex = (el.selectedIndex + 1) % el.options.length; el.dispatchEvent(new Event('change', { bubbles: true })); return 1; })()`);
    if ((await kept()) !== before) fail('locked, and a level of trust was set');
    if (J(await ev('window.__stub.solved()')) !== host) fail('locked, and a solved question was sent');
    if (!clicked) fail('locked: no move on the page to click');
    console.log(`  locked: ${clicked} move(s) clicked${sel ? ' and a level of trust set' : ''}, nothing changed`);
}
// Reading is not locked.
{
    const at = await ev(`(() => { const b = document.getElementById('next'); return b && !b.disabled ? (b.click(), 1) : 0; })()`);
    if (!(await lockedNow())) fail('locked: reading on unlocked the page');
    console.log(`  locked: ${at ? 'read on' : 'nothing more to read in the story shown'}`);
}
// `new-reading`: a paper not begun is listed and does not open.
await ev(`window.__stub.lock('new-reading', false); 1`); await sleep(400);
if (late) { await ev(`window.__stub.give(${J(late)}); 1`); await sleep(400); }
{
    if (late && !(await ev(`!!document.querySelector('.story-tab.shut[data-story=${J(late)}]')`))) fail(`locked (new-reading): ${late} came and is not listed as shut`);
    const id = late ?? await ev(`document.querySelector('.story-tab.shut')?.dataset.story ?? null`);
    if (id) {
        await ev(`document.querySelector('.story-tab.shut[data-story=${J(id)}]').click(); 1`);
        if ((await save()).story === id || await ev(`document.querySelector('.story-tab.on')?.dataset.story === ${J(id)}`)) fail(`locked (new-reading): the paper ${id} opened`);
        await ev(`window.__stub.lock('new-reading', true); 1`); await sleep(400);
        if (await ev(`!!document.querySelector('.story-tab.shut')`)) fail('back in the office a paper is still shut');
        await ev(`document.querySelector('.story-tab[data-story=${J(id)}]').click(); 1`);
        if (!(await ev(`document.querySelector('.story-tab.on')?.dataset.story === ${J(id)}`))) fail(`back in the office the paper ${id} does not open`);
        console.log(`  new-reading: ${id} listed and shut while away, opened in the office`);
    } else console.log('  new-reading: no paper unread at this point (nothing to shut)');
}
// Back in the office: unlocked, and the case plays to its end.
await ev(`window.__stub.lock('actions', true); 1`); await sleep(400);
if (await lockedNow()) fail('back in the office the page is still locked');
await ev('window.__stub.autoSolve({ fast: true }); 1');
{
    const s = await until(['done']);
    if (s.state !== 'done') fail(`back in the office the careful reader says ${s.state}${s.failed ? `: ${s.failed.why}` : ''}`);
    const sv = await save(), host = await ev('window.__stub.solved()');
    for (const q of Object.keys(sv.solved ?? {})) if (!host.includes(q)) fail(`${q} is solved on the page and the host has no check for it`);
    if (Object.keys(sv.solved ?? {}).length !== questions.length) fail(`${Object.keys(sv.solved ?? {}).length} of ${questions.length} questions solved`);
}
if (errors.length) fail(`page error: ${errors.splice(0).join(' | ')}`);
console.log(failures ? `${failures} FAILED` : 'ok: away from the office nothing can be changed or sent, a new paper stays shut, and back in the office the case plays on');
ws.close();
process.exit(failures ? 1 : 0);
