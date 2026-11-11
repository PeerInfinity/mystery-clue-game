#!/usr/bin/env node
// The room panel (ui/world-room.js) played through the real page, on the invented case scripts/fixtures/sealed-room:
// the ways-in table, "Something got through", the route link by link, "What else of this kind?", a crossing refused
// and one allowed, undo and a reload; and that a case with no world/room.json has no panel. Needs the page served
// (node scripts/serve.js) and the headless Chrome on port 9333 (one script at a time). Exits 1 on any failure.
const BASE = process.env.URL ?? 'http://localhost:8321/v2/';
const CDP = `http://127.0.0.1:${process.env.CDP_PORT ?? 9333}`;
const FIXTURE = 'scripts/fixtures/sealed-room';
const STORE = `${FIXTURE.replace(/[^A-Za-z0-9]+/g, '-')}-world-v1`;
const target = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => { ws.onopen = r; });
let n = 0; const pending = new Map(); const problems = [];
ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') problems.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
};
const send = (method, params = {}) => new Promise((r) => { const id = ++n; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(`${expression}: ${JSON.stringify(r.result.exceptionDetails).slice(0, 400)}`); return r.result?.result?.value; };
let failed = 0;
const ok = (cond, label, more = '') => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}${cond ? '' : ` ${more}`}`); if (!cond) failed++; };
const open = async (url) => { await send('Page.navigate', { url }); for (let i = 0; i < 80; i++) { await sleep(100); if (await ev(`!!document.querySelector('#story p')`)) break; } await sleep(150); };
const click = (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.click(); return true; })()`);
const text = (sel) => ev(`document.querySelector(${JSON.stringify(sel)})?.textContent ?? ''`);
const count = (sel) => ev(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
const way = (row, size, mark) => `[data-way="${row}|${size}|${mark}"]`;
const url = `${BASE}?case=${encodeURIComponent(FIXTURE)}`;

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
await open(`${BASE}guide.html`);
await ev(`localStorage.removeItem(${JSON.stringify(STORE)})`);
await open(`${BASE}`);
ok(await count('[data-part="room"]') === 0, 'a case with no room.json has no panel');
await ev(`localStorage.setItem(${JSON.stringify(STORE)}, JSON.stringify({ para: 4 }))`);
await open(url);
ok(await count('[data-part="room"]') === 1, 'the fixture has the panel');
ok(await count('[data-way-row="grating"]') === 0, 'a way not yet told is no row (¶4)');
ok(await count('[data-way-row]') === 3, 'three rows told by ¶4', String(await count('[data-way-row]')));
ok(await count('[data-ask]') === 0, 'no "What else of this kind?" before its fact');

await click(way('chimney', 'small', 'closed'));
ok(/Nothing on the timeline/.test(await text('.rm-note')), 'a mark with no fact behind it is refused', await text('.rm-note'));
ok(await count('.way-chip') === 0, 'and leaves no mark');
await click(way('door', 'small', 'closed'));
ok(await count('.way-chip.closed') === 1, 'a supported mark is taken');
ok(/¶2/.test(await text('[data-way-row="door"]')), 'and shows where it comes from', await text('[data-way-row="door"]'));
ok(!await text('.rm-note'), 'the refusal is gone at the next drawing');
await click('#undo');
ok(await count('.way-chip') === 0, 'undo takes the mark back');
await click(way('door', 'small', 'closed'));

await ev(`localStorage.setItem(${JSON.stringify(STORE)}, JSON.stringify({ ...JSON.parse(localStorage.getItem(${JSON.stringify(STORE)})), para: 6 }))`);
await open(url);
ok(await count('.way-chip.closed') === 1, 'the mark survives a reload');
await click('[data-got="f.smoke"]');
ok(await count('[data-way-row^="r:g:"]') === 1, '"Something got through" adds a way not yet found');
ok(/not yet found/.test(await text('#timeline')), 'and an entry on the timeline', await text('#timeline'));
ok(await count('[data-got]') === 0, 'and is offered once');

await ev(`localStorage.setItem(${JSON.stringify(STORE)}, JSON.stringify({ ...JSON.parse(localStorage.getItem(${JSON.stringify(STORE)})), para: 9 }))`);
await open(url);
ok(await count('[data-way-row^="r:g:"]') === 0 && await count('[data-way-row="grating"]') === 1, 'the grating takes the place of the way not yet found');
ok(!/not yet found/.test(await text('#timeline')), 'and the timeline no longer calls it not yet found', await text('#timeline'));
await click('[data-route-add="office"]');
for (const n of ['grating', 'hook', 'chain', 'desk']) { const did = await click(`[data-route-add="${n}"]`); ok(did, `the route goes on to ${n}`); }
ok(await count('.rm-node') === 5, 'five nodes');
ok(/fixed to/.test(await text('#room')), 'the far end held in place', await text('#room'));
ok(/A route/.test(await text('#timeline')), 'the route is on the timeline');
// The link move: from the event (A).
await click('#timeline [data-fact="f.grating"] .ph');
ok(await count('#detail [data-link-entry="f.grating"]') === 2, 'an event offers every open question');
ok(!await count('.desc-list'), 'nothing shown before a link');
await click('#detail [data-link-entry="f.grating"]');
ok(/small enough for the grating/.test(await text('.desc-list')), 'a known link fills in the observation', await text('#q-box'));
ok(/¶7/.test(await text('.desc-list')), 'with where it came from');
await click('#timeline [data-fact="f.walls"] .ph');
await click('#detail [data-link-entry="f.walls"]');
ok(/Your notes/.test(await text('#q-box')) && (await count('.desc-list li')) === 1, 'an unknown link stays as a note', await text('#q-box'));
await click('#undo');
ok(!/Your notes/.test(await text('#q-box')), 'undo takes a link back');
// From the question (B), and a route as an entry.
await click('[data-linking="q.what_came"]');
ok(/Linking to/.test(await text('#timeline')), 'the linking mode shows on the timeline');
ok(await click('#timeline [data-fact^="r:r:"] [data-link-entry]'), 'the route can be linked');
ok(/travel down a chain/.test(await text('.desc-list')), 'a route counts by what it runs through', await text('.desc-list'));
await click('#timeline [data-fact="f.dead"] [data-link-entry]');
ok(/Your notes/.test(await text('#q-box')) && !/something that bites/.test(await text('.desc-list')), 'an observation that depends on an answer waits for it', await text('#q-box'));
await click('[data-linking-done]');
ok(!/Linking to/.test(await text('#timeline')), 'Done leaves the mode');
await click('#q-box [data-mark-q="q.how"][data-mark-pick="a bite"]');
ok(/something that bites/.test(await text('.desc-list')), 'circling the answer fills it in', await text('.desc-list'));
ok(!/Your notes/.test(await text('#q-box')), 'and the note gives way to it');
ok(await count('[data-part="timeline"] .link-row') === 0, 'no buttons on the rows outside the mode');
// The player's order of the questions, and the line that decides what "Relevant to…" offers. A real drag, by the mouse.
const rows = () => ev(`[...document.querySelectorAll('#q-box [data-q-row]')].map((x) => x.dataset.qRow).join(' ')`);
const centre = (sel) => ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
const mouse = (type, p, extra = {}) => send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', ...extra });
async function drag(from, to, offset) {
    const a = await centre(from), b = await centre(to);
    await mouse('mouseMoved', a, { button: 'none' }); await mouse('mousePressed', a, { buttons: 1, clickCount: 1 });
    await mouse('mouseMoved', { x: a.x, y: (a.y + b.y) / 2 }, { buttons: 1 }); await mouse('mouseMoved', { x: a.x, y: b.y + offset }, { buttons: 1 });
    await mouse('mouseReleased', { x: a.x, y: b.y + offset }, { clickCount: 1 }); await sleep(100);
}
ok(await rows() === 'q.what_came q.how |' || await rows() === 'q.how q.what_came |', 'the line starts at the bottom', await rows());
const [first, second] = (await rows()).split(' ');
await click(`[data-q-top="${second}"]`);
ok(await rows() === `${second} ${first} |`, 'to the top', await rows());
await drag('#q-box [data-q-row="|"] .q-grip', `#q-box [data-q-row="${first}"]`, -30);
ok(await rows() === `${second} | ${first}`, 'the line dragged up', await rows());
await click('#timeline [data-fact="f.grating"] .ph');
ok(await count('#detail [data-link-entry="f.grating"]') === 2, 'a question already linked stays offered, below the line or not', String(await count('#detail [data-link-entry="f.grating"]')));
await click('#timeline [data-fact="f.smoke"] .ph');
ok(await count('#detail [data-link-entry="f.smoke"]') === 1, 'only what is above the line is offered', String(await count('#detail [data-link-entry="f.smoke"]')));
ok(/Show the others \(1\)/.test(await text('#detail')), 'with the rest one press away', await text('#detail'));
await click('[data-link-more]');
ok(await count('#detail [data-link-entry="f.smoke"]') === 2, 'and they come');
await drag(`#q-box [data-q-row="${first}"] .q-grip`, `#q-box [data-q-row="${second}"]`, -30);
ok(await rows() === `${first} ${second} |`, 'a question dragged above the line; the line ends last', await rows());
await ev(`document.querySelector('#q-box [data-q-row="${first}"] .q-grip').focus()`);
await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 }); await sleep(100);
ok(await rows() === `${second} ${first} |`, 'moved by the arrow key', await rows());
await open(url);
ok(await rows() === `${second} ${first} |`, 'the order survives a reload', await rows());
await ev(`localStorage.setItem(${JSON.stringify(STORE)}, JSON.stringify({ ...JSON.parse(localStorage.getItem(${JSON.stringify(STORE)})), para: 10 }))`);
await open(url);
ok(/had everything it needed/.test(await text('#q-box')), 'at the give-away the description is judged', await text('#q-box'));
ok(/small enough for the grating/.test(await text('.desc-list')), 'links survive a reload');
await click('[data-route-back]');
ok(await count('.rm-node') === 4, 'a link taken back');
ok(/travel down a chain/.test(await text('.desc-list')), 'the link stays with the route, which still runs through the chain');
await click('[data-route-back]');
ok(await count('.rm-node') === 3, 'another link taken back');
ok(!/travel down a chain/.test(await text('.desc-list')), 'and the observation that rested on the chain goes with it');
ok(problems.length === 0, 'no errors in the page', problems.join(' | ').slice(0, 600));

await ev(`localStorage.removeItem(${JSON.stringify(STORE)})`);
await fetch(`${CDP}/json/close/${target.id}`);
console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
