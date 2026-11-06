// Play the true path (cases/silver-blaze/world/path.json) through Watson's timeline (world.html) in headless Chrome:
// a fresh page, "Read on" to each move's paragraph (so the commitment gate is met for real), then the move's clicks,
// each checked: its control is offered, the save shows the move, `see` (a pattern) is on the page after it, and the
// page throws nothing. Every answer the story gives on the way must find the player's one circle right; at the end of
// the story no contradiction may be open and no likely clash unheld.
//   node scripts/path-check.mjs [path.json]      STOP=<para> stops after that paragraph's moves (and keeps the page)
// Needs the game served (node scripts/serve.js; URL, default http://localhost:8321/world.html) and the headless Chrome
// on port 9333 (one script at a time). Prints one line per move; exits 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const FILE = process.argv[2] ?? path.join(ROOT, 'cases/silver-blaze/world/path.json');
const moves = JSON.parse(fs.readFileSync(FILE, 'utf8')).moves;
const URL_ = process.env.URL ?? 'http://localhost:8321/world.html';
const STOP = +(process.env.STOP ?? 1e9);
const STORE = 'silver-blaze-world-v1';

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
const send = (method, params = {}) => new Promise((r) => { const id = ++n; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'eval failed'); return r.result?.result?.value; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = JSON.stringify;
const ready = async () => { for (let i = 0; i < 150; i++) { if (await ev(`!!document.querySelector('#timeline')?.children.length`).catch(() => false)) return; await sleep(200); } throw new Error('page not ready'); };

await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: URL_ }); await sleep(1500);
// A fresh page in three columns: every part in view, as on a laptop.
await ev(`localStorage.setItem(${J(STORE)}, ${J(J({ layout: 'three' }))}); 1`);
await send('Page.reload'); await sleep(800); await ready();
errors.length = 0;

const save = () => ev(`JSON.parse(localStorage.getItem(${J(STORE)}) ?? '{}')`);
const exists = (sel) => ev(`!!document.querySelector(${J(sel)})`);
const click = async (sel) => { const ok = await ev(`(() => { const e = document.querySelector(${J(sel)}); if (!e) return false; e.click(); return true; })()`); await sleep(30); return ok; };
const choose = async (sel, value) => { const ok = await ev(`(() => { const e = document.querySelector(${J(sel)}); if (!e) return false; e.value = ${J(String(value))}; e.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`); await sleep(30); return ok; };
const pageText = () => ev(`document.body.innerText`);
const esc = (s) => s.replace(/["\\]/g, '\\$&');
const LEVELS = { distrusted: 0, uncertain: 1, trusted: 2 };

let failures = 0;
const fail = (m, why) => { failures++; console.log(`FAIL ¶${m.at} ${m.do} ${m.q ?? m.of ?? m.a ?? m.key ?? ''}${m.pick ? ' = ' + m.pick : ''}: ${why}`); };

/** Open what a move works on in the detail panel: a fact on the timeline, a question, or a likely clash's side. */
async function openOn(on) {
    if (on.startsWith('q:')) return (await click(`#q-box a.link[data-q="${esc(on.slice(2))}"]`)) || click(`#q-box [data-q="${esc(on.slice(2))}"]`);
    if (/^(hyp|pre):/.test(on)) return openOn(`q:${on.slice(4).split('=')[0]}`);
    if (await exists(`#timeline [data-fact="${esc(on)}"]`)) return click(`#timeline [data-fact="${esc(on)}"] .ph`) || click(`#timeline [data-fact="${esc(on)}"]`);
    return false;
}
const defaultOn = (m) => m.on ?? (['a', 'b', 'c', 'plan'].includes(m.do) ? (m.a ?? m.of) : null);

async function readTo(p) {
    while (true) {
        const now = (await save()).para ?? 1;
        if (now >= p) return true;
        await click('#next');
        const after = (await save()).para ?? 1;
        const news = await ev(`(() => { const e = document.querySelector('#answer-news'); return e && !e.hidden ? [...e.querySelectorAll('li')].map((li) => ({ text: li.innerText, bad: !!li.querySelector('.bad') })) : []; })()`);
        for (const a of news) if (a.bad) { failures++; console.log(`FAIL ¶${after} answer: ${a.text}`); }
        if (news.length) { console.log(`  ¶${after} answered: ${news.map((a) => a.text.replace(/\s+/g, ' ')).join(' | ')}`); await click('[data-answers-close]'); }
        if (after === now) {
            const gate = await ev(`document.querySelector('#gate-news')?.innerText ?? ''`);
            failures++; console.log(`FAIL gate before ¶${now + 1}: ${gate.replace(/\s+/g, ' ')}`);
            return false;
        }
    }
}

async function play(m) {
    const on = defaultOn(m);
    if (on && !(await openOn(on))) return fail(m, `cannot open ${on}`);
    const before = await save();
    switch (m.do) {
        case 'circle': case 'cross': {
            const sel = `#q-box [data-mark-q="${esc(m.q)}"][data-mark-pick="${esc(m.pick)}"]`;
            if (!(await exists(sel))) await click(`#q-box [data-more-q="${esc(m.q)}"]`);
            if (!(await exists(sel))) return fail(m, 'possibility not offered');
            const want = m.do === 'circle' ? 'circled' : 'crossed';
            for (let i = 0; i < 3 && (await save()).marks?.[m.q]?.[m.pick] !== want; i++) await click(sel);
            if ((await save()).marks?.[m.q]?.[m.pick] !== want) return fail(m, 'mark not saved');
            break;
        }
        case 'trust': {
            const sel = m.link ? `#detail .link-trust[data-key="${esc(m.link)}"]` : `#detail .person-trust[data-person="${esc(m.person)}"]`;
            if (!(await exists(sel))) return fail(m, `no trust control for ${m.link ?? m.person} on ${on}`);
            await choose(sel, LEVELS[m.level]);
            const tr = (await save()).trust ?? {};
            const got = m.link ? tr.links?.[m.link] : tr.people?.[m.person];
            if (got !== LEVELS[m.level] && !(m.level === 'uncertain' && got == null)) return fail(m, 'trust not saved');
            break;
        }
        case 'a': case 'b': case 'c': {
            const sel = m.do === 'a' ? `#detail [data-move-a="${esc(m.a)}"][data-with="${esc(m.b)}"]` : m.do === 'b' ? `#detail [data-move-b="${esc(m.of)}"]` : `#detail [data-move-c="${esc(m.of)}"][data-for="${esc(m.for)}"]`;
            if (!(await exists(sel))) return fail(m, 'move not offered');
            await click(sel);
            const note = await ev(`document.querySelector('#detail .note')?.innerText ?? ''`);
            if ((await save()).reasoning?.length !== (before.reasoning?.length ?? 0) + 1) return fail(m, `not taken${note ? ': ' + note : ''}`);
            break;
        }
        case 'plan': {
            const sel = `#detail [data-move-d="${esc(m.of)}"]`;
            if (!(await exists(sel))) return fail(m, 'no "What would this need?"');
            const shut = await ev(`document.querySelector(${J(sel)}).innerText !== 'Hide'`);
            if (shut) await click(sel);
            break;
        }
        case 'stop': case 'compare': case 'account': {
            const sel = `#detail [data-${m.do}="${esc(m.key)}"]`;
            if (!(await exists(sel))) return fail(m, 'check not offered');
            await click(sel);
            break;
        }
        case 'hold': {
            const sel = `[data-hold="${esc(m.strain)}"]`;
            if (!(await exists(sel))) return fail(m, 'likely clash not shown');
            await click(sel);
            if (!(await save()).held?.includes(m.strain)) return fail(m, 'not held');
            break;
        }
        default: return fail(m, 'unknown move');
    }
    if (m.see && !new RegExp(m.see).test(await pageText())) return fail(m, `not on the page: /${m.see}/`);
    if (errors.length) { const e = errors.splice(0); return fail(m, `page error: ${e.join(' | ')}`); }
    console.log(`ok ¶${m.at} ${m.do} ${m.q ?? m.of ?? m.a ?? m.key ?? m.strain ?? m.link ?? m.person ?? ''}${m.pick ? ' = ' + m.pick : ''}${m.for ? ' → ' + m.for : ''}${m.b ? ' ~ ' + m.b : ''}`);
}

const t0 = Date.now();
// SAVE=<file>: write the save at the end (with STOP, the state to look at a paragraph from).
const dump = async () => { if (process.env.SAVE) fs.writeFileSync(process.env.SAVE, JSON.stringify(await save())); };
let last = 1;
for (const m of moves) {
    if (m.at > STOP) break;
    if (m.at < last) { fail(m, `out of order (after ¶${last})`); continue; }
    if (!(await readTo(m.at))) break;
    last = m.at;
    await play(m);
}
if (STOP >= 1e9 && !failures) {
    const end = await ev(`+document.getElementById('para').max`);
    if (!(await readTo(end))) { console.log(`${failures} failure(s)`); process.exit(1); }
    const open = await ev(`document.querySelector('#clashes .clash-box summary')?.innerText ?? ''`);
    if (open) { failures++; console.log(`FAIL at the end: ${open}\n${await ev(`document.querySelector('#clashes').innerText`)}`); }
    const unheld = await ev(`[...document.querySelectorAll('#clashes [data-hold]')].map((b) => b.closest('li').innerText.replace(/\\s+/g, ' '))`);
    for (const s of unheld) { failures++; console.log(`FAIL at the end, a likely clash not held: ${s}`); }
}
await dump();
console.log(`${failures ? `${failures} failure(s)` : 'all moves played'} in ${Math.round((Date.now() - t0) / 1000)} s`);
ws.close();
process.exit(failures ? 1 : 0);
