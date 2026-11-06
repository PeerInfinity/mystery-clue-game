// The autoplay of Watson's timeline played to the end in headless Chrome (`world.html?autoplay=fast`: no pauses, no
// cursor): it must finish without stopping or a page error, at the last paragraph, with its save holding what the true
// path leaves (every mark, the reasoning moves, the trust set), and the player's own save untouched.
//   node scripts/world-autoplay-check.mjs [layout]      layout: three (default), two or one; PHONE=1 a phone's width
// Needs the game served (node scripts/serve.js; URL, default http://localhost:8321/) and the headless Chrome on port
// 9333 (one script at a time). Exits 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const moves = JSON.parse(fs.readFileSync(path.join(ROOT, 'cases/silver-blaze/world/path.json'), 'utf8')).moves;
const BASE = process.env.URL ?? 'http://localhost:8321/';
const LAYOUT = process.argv[2] ?? 'three';
const J = JSON.stringify;

const list = await (await fetch('http://127.0.0.1:9333/json')).json();
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
const phone = !!process.env.PHONE;
await send('Emulation.setDeviceMetricsOverride', phone ? { width: 390, height: 844, deviceScaleFactor: 1, mobile: true } : { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: `${BASE}world.html` }); await sleep(1500);
// The player's own timeline, which the autoplay must leave alone: a mark, a paragraph, the layout to play in.
const mine = { para: 3, layout: LAYOUT, marks: { 'q.who_killed': { simpson: 'circled' } } };
await ev(`localStorage.setItem('silver-blaze-world-v1', ${J(J(mine))}); localStorage.removeItem('silver-blaze-world-autoplay'); 1`);
const t0 = Date.now();
await send('Page.navigate', { url: `${BASE}world.html?autoplay=fast` });
let st = null;
while (Date.now() - t0 < 15 * 60000) {
    await sleep(2000);
    st = await ev(`window.__autoplay ?? null`).catch(() => null);
    if (st && (st.done || st.failed)) break;
}
let failures = 0;
const fail = (why) => { failures++; console.log(`FAIL ${why}`); };
if (!st?.done) fail(st?.failed ?? `did not finish (${J(st)})`);
for (const e of errors) fail(`page error: ${e}`);
const save = await ev(`JSON.parse(localStorage.getItem('silver-blaze-world-autoplay') ?? '{}')`);
const last = await ev(`+document.getElementById('para').max`);
if (st?.done && save.para !== last) fail(`at ¶${save.para}, not the last (¶${last})`);
if (!st?.done) { console.log(`${failures} failure(s) (${LAYOUT}${process.env.PHONE ? ', phone' : ''})`); process.exit(1); }
// What the path leaves: each mark as last set, every reasoning move, every trust set.
const marks = {};
for (const m of moves) if (m.do === 'circle' || m.do === 'cross') (marks[m.q] ??= {})[m.pick] = m.do === 'circle' ? 'circled' : 'crossed';
for (const [q, picks] of Object.entries(marks)) for (const [p, v] of Object.entries(picks)) if (save.marks?.[q]?.[p] !== v) fail(`mark ${q} = ${p}: ${save.marks?.[q]?.[p]}, not ${v}`);
const reasoned = moves.filter((m) => ['a', 'b', 'c'].includes(m.do)).length;
if ((save.reasoning?.length ?? 0) !== reasoned) fail(`${save.reasoning?.length ?? 0} reasoning moves, not ${reasoned}`);
for (const m of moves.filter((x) => x.do === 'trust' && x.link)) if (save.trust?.links?.[m.link] !== { distrusted: 0, uncertain: 1, trusted: 2 }[m.level]) fail(`trust ${m.link} not ${m.level}`);
const after = await ev(`localStorage.getItem('silver-blaze-world-v1')`);
if (after !== J(mine)) fail(`the player's own save changed: ${after}`);
console.log(`${failures ? `${failures} failure(s)` : `the autoplay played ${st?.moves} moves to ¶${save.para}`} in ${Math.round((Date.now() - t0) / 1000)} s (${LAYOUT}${phone ? ', phone' : ''})`);
ws.close();
process.exit(failures ? 1 : 0);
