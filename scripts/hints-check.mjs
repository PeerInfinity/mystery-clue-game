// The hints played through the real page: on Hard at ¶40, Hint pressed and More to the fourth rung,
// each rung and the log checked in the saved game; Do it made through the page; the Hints tab; a reload keeps the log;
// the Record's tally by rungs; Trivial has no Hint button; Start over clears the log; read on to ¶57, the catch-up
// notes on the bar; the cooldown (30 seconds by default; at 3 Hint and More wait). With `all`: a fresh Hard game that only reads and, at every
// paragraph, takes every hint to Do it (on `?hintfast`), which must reach the Hard maximum (70) through the page (about
// 15 minutes); `DIFFICULTY=easy|medium` plays that game on another difficulty (its maximum the same 70).
//   node scripts/hints-check.mjs [all] [shots dir]   (the game served at URL, default http://localhost:8321/; Chrome on 9333)
// Only one script may drive that Chrome at a time.
import fs from 'node:fs';
import { open } from './cdp.mjs';
const ALL = process.argv[2] === 'all';
const DIFFICULTY = process.env.DIFFICULTY ?? 'hard';
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
await settings(() => p.choose('#difficulty', ALL ? DIFFICULTY : 'hard'));
// The cooldown (Settings, seconds): 30 by default; this script presses at once, so 0 but where it checks the wait.
const cooldown = (sec) => settings(() => p.ev(`(() => { const e = document.querySelector('#hint-cooldown'); e.value = '${sec}'; e.dispatchEvent(new Event('change', { bubbles: true })); return 1; })()`));
const cooldownAtFirst = await p.ev(`document.querySelector('#hint-cooldown').value`);
await cooldown(0);

if (ALL) {
    // Every hint taken to Do it, paragraph by paragraph.
    let targets = 0;
    const failed = new Map();
    const t0 = Date.now();
    while (await p.ev(`!!document.querySelector('#read')`)) {
        await p.click('#read');
        let prev = null;
        for (let n = 0; n < 12; n++) {
            const logged = (await game()).hints?.length ?? 0;
            if (!(await p.ev(`!!document.querySelector('#hint')`))) break;
            await p.click('#hint');
            if (/Nothing you have read/.test((await note()) ?? '') || ((await game()).hints?.length ?? 0) === logged) break;
            while (await p.ev(`!!document.querySelector('#hint-more')`)) await p.click('#hint-more');
            const at = (await game()).read - 1;
            const target = (await game()).hints.at(-1);
            await doIt();
            targets++;
            const bad = await p.text('.hint-note .bad');
            if (bad) { failed.set(`${target.thought}|${target.family}`, `¶${at}: ${bad}${process.env.DUMP ? ` [${await p.ev(`[...document.querySelectorAll('.theory')].map((x) => x.innerText.replace(/\\s+/g, ' ').slice(0, 160)).join(' || ')`)}]` : ''}`); break; }
            // Done without a fault, yet the next hint is on the same target: its moves did not make it.
            if (prev === `${target.thought}|${target.family}`) {
                const g = await game();
                failed.set(prev, `¶${at}: Do it made its moves, the row is still open; the save's drops ${JSON.stringify(g.drops)}; the note: ${(await note())?.slice(0, 600)}`);
                break;
            }
            prev = `${target.thought}|${target.family}`;
        }
    }
    const ahead = Number((await p.text('header'))?.match(/Ahead of Holmes: (\d+)/)?.[1] ?? -1);
    if (process.env.DUMP) fs.writeFileSync(process.env.DUMP, JSON.stringify((await p.state()).game));
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
    await p.ev(`document.querySelector('.panel[data-panel="1"] .tab[data-tab="record"]').click(); 1`); await p.idle();
    // The tally counts rows as the Record tells them, at their deadlines: t18.3 (Holmes ¶57) is not in it yet.
    check(/Made with hints: no hint 0 · one rung 0 · two rungs 0 · three rungs 0 · all four rungs 0\./.test((await p.text('#panel-1')) ?? ''), 'the Record has the tally of rows made by rungs of hint');
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
    // 9. The catch-up note (H7): read on to Holmes's ¶57, nothing made; the bar says where the player could have had it.
    await p.ev(`document.querySelector('.settings').open = false; 1`);
    while ((await game()).read <= 57) await p.click('#read');
    const bar = (await p.text('.reader')) ?? '';
    check(/came in with a key”\. You could have had it from paragraph 31, from “Hunter locked the stable door/.test(bar) && /You could have marked it odd from paragraph 18\./.test(bar), 'at ¶57 the catch-up notes: had from ¶31, marked odd from ¶18');
    await shot('hints-catchup-desktop');
    // 11. The cooldown: 30 seconds by default; at 3, Hint and More wait, counting down, then work again.
    check(cooldownAtFirst === '30', `the cooldown is 30 seconds by default (${cooldownAtFirst})`);
    await cooldown(3);
    const n0 = ((await game()).hints ?? []).length;
    await p.click('#hint');
    const waiting = await p.ev(`(() => { const b = document.querySelector('#hint'); const m = document.querySelector('#hint-more'); return b.disabled && /· [1-3] s/.test(b.textContent) && (!m || m.disabled); })()`);
    await p.click('#hint');
    const n1 = ((await game()).hints ?? []).length;
    await p.sleep(3500);
    await p.click('#hint-more') || await p.click('#hint');
    const n2 = ((await game()).hints ?? []).length;
    check(waiting && n1 === n0 + 1 && n2 === n1 + 1, `with a cooldown of 3 s, Hint and More wait and count down, then work (${n0}, ${n1}, ${n2})`);
    await cooldown(0);
}
check(p.errors.length === 0, `no console error${p.errors.length ? `: ${p.errors.join(' | ')}` : ''}`);
console.log(fails.length ? `${fails.length} failed` : 'all passed');
p.close();
process.exit(fails.length ? 1 : 0);
