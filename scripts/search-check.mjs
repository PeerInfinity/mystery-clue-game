// Incremental mode's Search tab in the real page: the pace chosen (Hard, locked), the tab, the story waiting, one check
// a second with a bar in the tab and in the reading bar, the queue (its first is the next check; its box one height), the nine categories
// counted; the page does not jump, the log and the tab bars keep their place; Pause; at 0 s a
// check the search lifts the wait and the player reads on; reading by itself it goes on; a reload keeps the counts; no
// console error (about 5 minutes).
//   node scripts/search-check.mjs [shots dir]   (the game served at URL, default http://localhost:8321/; Chrome on 9333)
// Only one script may drive that Chrome at a time.
import fs from 'node:fs';
import { open } from './cdp.mjs';
const SHOTS = process.argv[2] ?? null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const p = await open();
await p.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
const fails = [];
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) fails.push(what); };
const reload = async () => { await p.send('Page.reload'); await p.sleep(1500); await p.idle(); await p.ev('window.confirm = () => true; 1'); };
await p.ev('localStorage.clear(); 1'); await reload();
check(await p.ev(`!!document.querySelector('#pace option[value="incremental"]')`), 'the pace offers incremental');
await p.choose('#pace', 'incremental');
const g = async () => (await p.state())?.game ?? {};
check((await g()).pace === 'incremental', 'the game is incremental');
check(await p.ev(`document.querySelector('#difficulty').disabled && document.querySelector('#difficulty').value === 'hard'`), 'difficulty Hard, locked');
check(await p.ev(`!!document.querySelector('.tab[data-tab="search"]')`), 'a Search tab');
await p.click('.panel[data-panel="1"] .tab[data-tab="search"]');
check(/The search/.test(await p.text('#panel-1') ?? ''), 'the Search tab opens');
check(/not waiting/.test(await p.text('#panel-1') ?? ''), 'idle while the story does not wait');
// Read on until the story waits.
for (let i = 0; i < 300 && !(await p.ev(`document.querySelector('#read')?.disabled`)); i++) await p.click('#read');
const at = (await g()).read;
check(at > 30 && at < 70, `the story waits (¶${at})`);
check(/The story waits for/.test(await p.text('#reader') ?? ''), 'the reading bar says what it waits for');
await p.sleep(3500);
const n1 = await p.ev(`JSON.parse(localStorage.getItem('mystery-clue-game:silver-blaze:v2:search') || 'null')?.automation?.n ?? -1`);
const log1 = await p.ev(`document.querySelectorAll('.search-log li').length`);
check(log1 >= 2 && log1 <= 5, `about one check a second (${log1} in ~3.5 s)`);
check(await p.ev(`!!document.querySelector('#panel-1 .search-fill.run') && !!document.querySelector('#reader .search-fill.run')`), 'a bar in the tab and one in the reading bar');
check(await p.ev(`document.querySelectorAll('.search-queue li').length`) >= 1, 'the queue shows the next checks');
check(await p.ev(`document.querySelectorAll('.search-table tbody tr:not(.terms)').length`) === 9, 'nine categories counted');
if (SHOTS) await p.shot(`${SHOTS}/search-1s.png`);
// The page does not jump: over about eight checks, nothing below the reading bar moves up (a piece may grow, never
// shrink back). And the queue says what comes next: when the check under way changes, it is the one the queue showed
// first, unless the check before it found something.
const look = `JSON.stringify({
    box: Math.round(document.querySelector('#panel-1 .search-queue-box')?.getBoundingClientRect().height ?? -1),
    tops: [...document.querySelectorAll('#panel-1 h4.sub, #panel-1 .search-table-wrap, .layout')].map((e) => Math.round(e.getBoundingClientRect().top)),
    now: document.querySelector('#panel-1 .search-now b')?.parentElement.textContent.replace(/^\\S+:\\s*/, '') ?? '',
    head: document.querySelector('#panel-1 .search-queue li')?.textContent ?? '',
    found: document.querySelector('#panel-1 .search-log li')?.classList.contains('out-found') ?? false })`;
let prev = JSON.parse(await p.ev(look));
let movedUp = 0, moved = 0, nexts = 0, wrong = [];
const boxes = new Set([prev.box]);
for (let i = 0; i < 40; i++) {
    await p.sleep(200);
    const cur = JSON.parse(await p.ev(look));
    if (cur.tops.length === prev.tops.length && cur.tops.some((t, j) => t < prev.tops[j])) movedUp++;
    boxes.add(cur.box);
    // A check that found nothing moves nothing at all, down either (the table's rows are one line each).
    if (!cur.found && cur.tops.length === prev.tops.length && cur.tops.some((t, j) => t !== prev.tops[j])) moved++;
    if (cur.now && prev.now && cur.now !== prev.now) {
        nexts++;
        if (!cur.found && cur.now !== prev.head) wrong.push(`${prev.head} ≠ ${cur.now}`);
    }
    prev = cur;
}
check(movedUp === 0, `the page does not jump (moved up ${movedUp} times in 8 s)`);
check(moved === 0, `a check that finds nothing moves nothing (moved ${moved} times)`);
check(boxes.size === 1 && !boxes.has(-1), `the "Next up" box keeps one height (${[...boxes].join(', ')} px)`);
check(nexts >= 4 && wrong.length === 0, `the queue's first is the next check (${nexts} checks${wrong.length ? `; ${wrong.slice(0, 2).join(' | ')}` : ''})`);
// The tab bars keep where they were scrolled sideways: a check redraws the Search tab's label in place, and a full
// redraw (a find) keeps the scroll.
const rowsAt = `[...document.querySelectorAll('.tabs')].map((r) => r.scrollLeft).join(',')`;
await p.ev(`document.querySelectorAll('.tabs').forEach((r) => { r.scrollLeft = 60; }); 1`);
const rows0 = await p.ev(rowsAt);
const tabN0 = await p.ev(`document.querySelectorAll('.search-log li').length`);
await p.sleep(4500);
const rows1 = await p.ev(rowsAt);
const tabN1 = await p.ev(`document.querySelectorAll('.search-log li').length`);
check(rows0 === rows1 && rows0 !== '0,0' && tabN1 > tabN0, `the tab bars keep their sideways scroll over ${tabN1 - tabN0} checks (${rows0} → ${rows1})`);
// The log keeps its place: scrolled down, new entries come in above, out of view.
await p.ev(`document.querySelector('.settings').open = true; 1`);
await p.choose('#search-delay', '0.2');
await p.ev(`document.querySelector('.settings').open = false; 1`);
for (let i = 0; i < 60 && (await p.ev(`document.querySelectorAll('.search-log li').length`)) < 30; i++) await p.sleep(500);
const topEntry = `(() => { const l = document.querySelector('.search-log'); const li = [...l.children].find((x) => x.offsetTop + x.offsetHeight > l.scrollTop); return li?.dataset.n + '@' + Math.round(li.offsetTop - l.scrollTop); })()`;
await p.ev(`document.querySelector('.search-log').scrollTop = 200; 1`);
const before = await p.ev(topEntry);
const logN = await p.ev(`document.querySelectorAll('.search-log li').length`);
await p.sleep(2500);
const after = await p.ev(topEntry);
const grew = (await p.ev(`document.querySelectorAll('.search-log li').length`)) - logN;
check(before === after && grew > 0, `the log keeps its place while entries come in (${before} → ${after}, ${grew} new)`);
await p.ev(`document.querySelector('.settings').open = true; 1`);
await p.choose('#search-delay', '1');
await p.ev(`document.querySelector('.settings').open = false; 1`);
// Pause, then fast.
check(await p.click('[data-search-play="0"]'), 'the Pause button');
await p.sleep(1500); // the check under way may finish
const paused = await p.ev(`document.querySelectorAll('.search-log li').length`);
await p.sleep(3000);
check(await p.ev(`document.querySelectorAll('.search-log li').length`) === paused, 'paused: no further checks');
await p.ev(`document.querySelector('.settings').open = true; 1`);
await p.choose('#search-delay', '0');
await p.ev(`document.querySelector('.settings').open = false; 1`);
await p.click('[data-search-play="1"]');
const t0 = Date.now();
let read = at;
let lifted = false;
while (Date.now() - t0 < 120000 && !lifted) { await p.sleep(2000); lifted = !(await p.ev(`document.querySelector('#read')?.disabled`)); }
check(lifted, 'at 0 s a check, the search lifts the wait: the player may read on');
await p.click('#read');
check((await g()).read === at + 1, 'and the player reads on');
// The search reads by itself too.
await p.click('[data-search-autoread]');
const t1 = Date.now();
while (Date.now() - t1 < 240000) { await p.sleep(5000); const r = (await g()).read; if (r > 110) { read = r; break; } read = r; }
check(read > 110, `reading by itself, the search goes on (¶${read})`);
if (SHOTS) await p.shot(`${SHOTS}/search-fast.png`);
// A reload keeps the counts.
const nBefore = await p.ev(`JSON.parse(localStorage.getItem('mystery-clue-game:silver-blaze:v2:search')).automation.n`);
await reload();
check(/Search \(/.test(await p.text('.tab[data-tab="search"]') ?? ''), 'the tab counts the checks after a reload');
const nAfter = await p.ev(`JSON.parse(localStorage.getItem('mystery-clue-game:silver-blaze:v2:search')).automation.n`);
check(nAfter >= nBefore - 25, `the counts are kept (${nBefore} → ${nAfter})`);
if (SHOTS) await p.shot(`${SHOTS}/search-phone.png`, 390, 844);
check(p.errors.length === 0, `no console error${p.errors.length ? `: ${p.errors.slice(0, 3).join(' | ')}` : ''}`);
console.log(fails.length ? `${fails.length} failed` : 'all passed');
p.close();
process.exit(fails.length ? 1 : 0);
