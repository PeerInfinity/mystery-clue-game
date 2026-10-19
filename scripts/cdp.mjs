// A small DevTools client for the headless Chrome on port 9333 (Rounds 125–168): load a save, wait on the page (the busy
// veil, not a timer), click, choose, read the saved game, take a screenshot. The cache is off, so the page is always the
// served tree as it is now. Used by scripts/ui-run.mjs.
import fs from 'node:fs';
export async function open({ save = null, url = process.env.URL ?? 'http://localhost:8321/' } = {}) {
    const list = await (await fetch('http://127.0.0.1:9333/json')).json();
    const page = list.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    let n = 0; const pending = new Map(); const errors = [];
    ws.addEventListener('message', (e) => {
        const m = JSON.parse(e.data);
        if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
        if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
        if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
    });
    const send = (method, params = {}) => new Promise((r) => { const id = ++n; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
    const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'eval failed'); return r.result?.result?.value; };
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    // Ready: the case is loaded (the reading bar has its button) and the busy veil is down, twice in a row.
    const idle = async (max = 180000) => { const t0 = Date.now(); let ok = 0; while (Date.now() - t0 < max) { const s = await ev(`!!document.querySelector('#read, #reader .muted') && document.querySelector('#busy').hidden && !document.querySelector('#tool .pending')`).catch(() => false); ok = s ? ok + 1 : 0; if (ok >= 2) return Date.now() - t0; await sleep(300); } throw new Error('page not idle'); };
    await send('Page.enable');
    // Always the files as they are now: the served tree changes between runs.
    await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Page.navigate', { url }); await sleep(1500);
    if (save) { await ev(`localStorage.setItem('mystery-clue-game:silver-blaze:v2', ${JSON.stringify(typeof save === 'string' ? fs.readFileSync(save, 'utf8') : JSON.stringify(save))}); 1`); await send('Page.reload'); await sleep(1500); }
    await send('Runtime.enable'); await idle(); errors.length = 0;
    const click = async (sel) => { const ok = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true; })()`); if (ok) await idle(); return ok; };
    const choose = async (sel, value) => { const ok = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.value = ${JSON.stringify(value)}; e.dispatchEvent(new Event('change', { bubbles: true })); return e.value === ${JSON.stringify(value)}; })()`); if (ok) await idle(); return ok; };
    const text = (sel) => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText ?? null`);
    const state = () => ev(`JSON.parse(localStorage.getItem('mystery-clue-game:silver-blaze:v2') || 'null')`);
    const shot = async (file, w = 1400, h = 900) => { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 }); await sleep(800); const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(file, Buffer.from(r.result.data, 'base64')); };
    return { ws, send, ev, sleep, idle, click, choose, text, state, shot, errors, close: () => ws.close() };
}
