// The hints played through the real page (docs/hints.md, H9): on Hard at ¶40, Hint pressed and More to the fourth rung,
// each rung and the log checked in the saved game; Do it made through the page; the Hints tab; a reload keeps the log;
// Trivial has no Hint button; Start over clears the log. With `all`: a fresh Hard game that only reads and, at every
// paragraph, takes every hint to Do it (on `?hintfast`), which must reach the Hard maximum (70) through the page (about
// 15 minutes).
//   node scripts/hints-check.mjs [all] [shots dir]   (the game served at URL, default http://localhost:8321/; Chrome on 9333)
// Only one script may drive that Chrome at a time.
import fs from 'node:fs';
import { open } from './cdp.mjs';
const ALL = process.argv[2] === 'all';
const SHOTS = process.argv[ALL ? 3 : 2] ?? null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const base = process.env.URL ?? 'http://localhost:8321/';
const p = await open({ url: ALL ? `${base}?hintfast` : base });
await p.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
const fails = [];
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) fails.push(what); };
const reload = async () => { await p.send('Page.reload'); await p.sleep(1500); await p.idle(); };
const game = async () => (await p.state())?.game ?? {};
const shot = async (name, w, h) => { if (SHOTS) await p.shot(`${SHOTS}/${name}.png`, w, h); };
const note = () => p.text('.hint-note');
const settings = async (fn) => { await p.ev(`document.querySelector('.settings').open = true; 1`); await fn(); await p.ev(`document.querySelector('.settings').open = false; 1`); };
// Do it goes on after the click: until the page says it is done.
const doIt = async () => { await p.click('#hint-do'); for (let i = 0; i < 1200 && (await p.ev('!!window.__hintDoing')); i++) await p.sleep(250); await p.idle(); };

await p.ev(`localStorage.clear(); 1`); await reload();
await settings(() => p.choose('#difficulty', 'hard'));

if (ALL) {
    // Every hint taken to Do it, paragraph by paragraph.
    let targets = 0;
    const failed = new Map();
    const t0 = Date.now();
    while (await p.ev(`!!document.querySelector('#read')`)) {
        await p.click('#read');
        for (let n = 0; n < 12; n++) {
            await p.click('#hint');
            if (/Nothing you have read/.test((await note()) ?? '')) break;
            while (await p.ev(`!!document.querySelector('#hint-more')`)) await p.click('#hint-more');
            const at = (await game()).read - 1;
            const target = (await game()).hints.at(-1);
            await doIt();
            targets++;
            const bad = await p.text('.hint-note .bad');
            if (bad) { failed.set(`${target.thought}|${target.family}`, `¶${at}: ${bad}`); break; }
        }
    }
    const ahead = Number((await p.text('header'))?.match(/Ahead of Holmes: (\d+)/)?.[1] ?? -1);
    console.log(`${targets} hints taken to Do it, ${Math.round((Date.now() - t0) / 60000)} minutes`);
    for (const [k, v] of failed) console.log(`  Do it failed for ${k} (${v})`);
    check(ahead === 70, `the hint-only player reaches 70 through the page (${ahead})`);
} else {
    while ((await game()).read <= 40) await p.click('#read');
    // 1. Hint: the first rung, logged.
    await p.click('#hint');
    let g = await game();
    check(g.hints?.length === 1 && g.hints[0].rung === 1 && g.hints[0].para === 40, 'Hint gives the first rung, logged at ¶40');
    check(/^Where\. Look again at ¶\d+/.test((await note()) ?? '') && (await p.text('#hint')) === 'Hint (1/4)', 'the bar says where, and Hint (1/4)');
    // 2. More, to the fourth rung.
    for (let i = 2; i <= 4; i++) await p.click('#hint-more');
    g = await game();
    const t = g.hints.at(-1);
    check(g.hints.length === 4 && g.hints.every((h, i) => h.rung === i + 1 && h.thought === t.thought), 'More climbs the same target to the fourth rung');
    const n4 = (await note()) ?? '';
    check(/What kind of move\./.test(n4) && /Which\./.test(n4) && /The step\./.test(n4) && (await p.ev(`!!document.querySelector('#hint-do') && !document.querySelector('#hint-more')`)), 'the fourth rung: what kind, which, the step and Do it');
    await shot('hints-rung4-desktop');
    if (SHOTS) { await p.shot(`${SHOTS}/hints-rung4-phone.png`, 390, 844); await p.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false }); await p.sleep(500); }
    // 3. Do it, through the page.
    await doIt();
    g = await game();
    check((g.noticed ?? []).some((x) => x[0] === 'e.horse_led_out') && /Made\./.test((await note()) ?? ''), 'Do it makes the move through the page (the notice of t18.3), and the bar says so');
    // 4. The Hints tab.
    await p.ev(`document.querySelector('.panel[data-panel="1"] .tab[data-tab="hints"]').click(); 1`); await p.idle();
    const tab = (await p.text('#panel-1')) ?? '';
    check(/Given at ¶40 · odd detail · 4 of 4/.test(tab) && /made/.test(tab), 'the Hints tab lists the hint, made');
    await shot('hints-tab-desktop');
    // 5. The next hint starts at the first rung on a new target; read on, it folds.
    await p.click('#hint');
    g = await game();
    check(g.hints.length === 5 && g.hints[4].rung === 1 && g.hints[4].thought !== t.thought, 'the next Hint starts a new target at the first rung');
    await p.click('#read');
    check(/of 4 given · show/.test((await note()) ?? ''), 'read on, the hint folds to one line');
    // 6. A reload keeps the log.
    const before = JSON.stringify((await game()).hints);
    await reload();
    check(JSON.stringify((await game()).hints) === before, 'a reload keeps the log');
    // 7. Trivial: no Hint button.
    await settings(() => p.choose('#difficulty', 'trivial'));
    check(!(await p.ev(`!!document.querySelector('#hint')`)), 'Trivial has no Hint button');
    await settings(() => p.choose('#difficulty', 'hard'));
    // 8. Start over clears the log.
    await p.ev(`window.confirm = () => true; document.querySelector('.settings').open = true; 1`);
    await p.click('#reset');
    check(((await game()).hints ?? []).length === 0, 'Start over clears the log');
}
check(p.errors.length === 0, `no console error${p.errors.length ? `: ${p.errors.join(' | ')}` : ''}`);
console.log(fails.length ? `${fails.length} failed` : 'all passed');
p.close();
process.exit(fails.length ? 1 : 0);
