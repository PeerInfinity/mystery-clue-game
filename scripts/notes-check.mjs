// The player's notes played through the real page (docs/notes.md): with real mouse and keys over the DevTools protocol,
// on Hard at ¶37, a note at a point, a note on marked words, a highlight alone, an edit, a delete and its undo, from the
// story and from the Notes tab; that notes mode neither collects nor opens cards; a reload keeps the notes and Start over
// clears them. Each step is checked in the saved game.
//   node scripts/notes-check.mjs [shots dir]   (the game served at URL, default http://localhost:8321/; Chrome on 9333)
// Only one script may drive that Chrome at a time.
import fs from 'node:fs';
import { open } from './cdp.mjs';
const SHOTS = process.argv[2] ?? null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const p = await open({ url: process.env.URL ?? 'http://localhost:8321/' });
await p.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
const fails = [];
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) fails.push(what); };
const reload = async () => { await p.send('Page.reload'); await p.sleep(1500); await p.idle(); };
const game = async () => (await p.state())?.game ?? {};
const notes = async () => (await game()).notes ?? [];
const shot = async (name, w, h) => { if (SHOTS) await p.shot(`${SHOTS}/${name}.png`, w, h); };
const text = (para) => p.ev(`(() => { const p = document.querySelector('#story p[data-p="${para}"]'); const f = document.createRange(); f.selectNodeContents(p); const c = f.cloneContents(); c.querySelectorAll('.n-note, .n-mark, .n-edit').forEach((x) => x.remove()); return c.textContent; })()`);
// The page coordinates of a point in a paragraph's own text (the offset skips the notes' words), scrolled into view.
const point = (para, offset) => p.ev(`(() => {
  const p = document.querySelector('#story p[data-p="${para}"]');
  const w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); let n = 0;
  for (let t; (t = w.nextNode());) {
    if (t.parentElement.closest('.n-note, .n-mark, .n-edit')) continue;
    if (n + t.length >= ${offset}) { const r = document.createRange(); r.setStart(t, ${offset} - n); r.setEnd(t, Math.min(t.length, ${offset} - n + 1)); t.parentElement.scrollIntoView({ block: 'center' }); const b = r.getBoundingClientRect(); return { x: b.left + 1, y: b.top + b.height / 2 }; }
    n += t.length;
  }
  return null; })()`);
const mouse = async (type, { x, y }) => p.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1, buttons: type === 'mouseReleased' ? 0 : 1 });
const clickAt = async (at) => { await mouse('mousePressed', at); await mouse('mouseReleased', at); await p.sleep(300); await p.idle(); };
const drag = async (a, b) => { await mouse('mousePressed', a); for (let k = 1; k <= 5; k++) await mouse('mouseMoved', { x: a.x + ((b.x - a.x) * k) / 5, y: a.y + ((b.y - a.y) * k) / 5 }); await mouse('mouseReleased', b); await p.sleep(300); await p.idle(); };
const type = async (s) => { await p.send('Input.insertText', { text: s }); };
const key = async (k) => { for (const t of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type: t, key: k, code: k, windowsVirtualKeyCode: k === 'Enter' ? 13 : 27 }); await p.sleep(300); await p.idle(); };

// A fresh game on Hard, read to ¶37.
await p.ev(`localStorage.clear(); 1`); await reload();
await p.ev(`document.querySelector('.settings').open = true; 1`); await p.choose('#difficulty', 'hard'); await p.ev(`document.querySelector('.settings').open = false; 1`);
while ((await game()).read <= 37) await p.click('#read');
const t37 = await text(37);
const collected0 = ((await game()).collected ?? []).length;

await p.click('#notes-mode');
check(await p.ev(`document.body.classList.contains('notes-mode') && document.querySelector('#notes-mode').textContent.includes('on')`), 'notes mode on');
// 1. A note at a point: a click just after "Finally,".
const afterFinally = t37.indexOf('Finally,') + 'Finally,'.length;
await clickAt(await point(37, afterFinally));
check(await p.ev(`!!document.querySelector('#note-text')`), 'a click opens a note there');
await type('So the horse was there; the drug is the next thing.');
await key('Enter');
let ns = await notes();
check(ns.length === 1 && ns[0][1] === 37 && Math.abs(ns[0][2] - afterFinally) <= 1 && ns[0][3] === null, `the note is at ¶37, offset ${ns[0]?.[2]} (asked ${afterFinally})`);
check(((await game()).collected ?? []).length === collected0, 'the click collected nothing');
// 2. A note on marked words: a drag over "powdered opium".
const op = t37.indexOf('powdered opium');
await drag(await point(37, op), await point(37, op + 'powdered opium'.length - 1));
await type('The opium went in after the portions were separated.');
await key('Enter');
ns = await notes();
const onOpium = ns.find((n) => n[3] !== null);
check(onOpium && t37.slice(onOpium[3], onOpium[4]) === 'powdered opium' && onOpium[5].startsWith('The opium'), `marked words, snapped to whole words: “${onOpium ? t37.slice(onOpium[3], onOpium[4]) : ''}”`);
// 3. A highlight alone: a drag over "the same dish", kept empty.
const dish = t37.indexOf('the same dish');
await drag(await point(37, dish), await point(37, dish + 'the same dish'.length - 1));
await p.click('[data-note-keep]');
ns = await notes();
const hl = ns.find((n) => n[5] === '');
check(hl && t37.slice(hl[3], hl[4]) === 'the same dish', 'a highlight with nothing written');
check(((await game()).collected ?? []).length === collected0, 'the drags collected nothing');
await shot('notes-desktop');
// 4. Edit: click the first note in the story, rewrite it.
await p.click('#story .n-note');
await p.ev(`(() => { const t = document.querySelector('#note-text'); t.select(); return 1; })()`);
await type('So the horse was in the hollow.');
await key('Enter');
ns = await notes();
check(ns.some((n) => n[5] === 'So the horse was in the hollow.') && ns.length === 3, 'edited in place');
// 5. Esc cancels a new note.
await clickAt(await point(37, 10));
await type('not kept');
await key('Escape');
check((await notes()).length === 3, 'Esc cancels');
// 6. Mode off: a click on the words collects again (Hard).
await p.click('#notes-mode');
const ok = await p.ev(`(() => { const m = document.querySelector('#story p[data-p="37"] .m'); if (!m) return false; m.click(); return true; })()`);
await p.idle();
check(ok && ((await game()).collected ?? []).length > collected0, 'mode off: a click collects');
// 7. The Notes tab: listed; delete and undo.
await p.click('.panel[data-panel="1"] .tab[data-tab="notes"]');
check((await p.ev(`document.querySelectorAll('.tool-body .n-list li').length`)) === 3, 'the Notes tab lists three');
await shot('notes-tab-desktop');
await p.click('.tool-body [data-note-delete]');
check((await notes()).length === 2, 'deleted from the tab');
await p.click('#toast [data-note-undo]');
check((await notes()).length === 3, 'undo puts it back');
await p.click('.tool-body [data-note-show]');
check(await p.ev(`!!document.querySelector('#story .n-flash')`), '"show" brings it into view in the story');
// 8. The settings: highlight style, notes only in the tab, the page's face.
await p.ev(`document.querySelector('.settings').open = true; 1`);
await p.choose('#highlight', 'underline'); await p.ev(`document.querySelector('.settings').open = false; 1`);
await p.ev(`document.querySelector('#story p[data-p="37"]').scrollIntoView({ block: 'center' }); 1`);
await shot('notes-underline-desktop');
await p.ev(`document.querySelector('.settings').open = true; 1`);
await p.choose('#highlight', 'wash'); await p.choose('#notes-hand', 'page'); await p.choose('#notes-shown', 'tab'); await p.ev(`document.querySelector('.settings').open = false; 1`);
check(await p.ev(`!document.querySelector('#story .n-note') && document.querySelectorAll('#story .n-mark').length === 2`), 'only in the tab: marks in the story, no words');
await shot('notes-wash-tab-desktop');
await p.ev(`document.querySelector('.settings').open = true; 1`);
await p.choose('#highlight', 'marker'); await p.choose('#notes-hand', 'hand'); await p.choose('#notes-shown', 'story'); await p.choose('#theme', 'dark'); await p.ev(`document.querySelector('.settings').open = false; 1`);
await p.ev(`document.querySelector('#story p[data-p="37"]').scrollIntoView({ block: 'center' }); 1`);
await shot('notes-dark-desktop');
await p.ev(`document.querySelector('.settings').open = true; 1`); await p.choose('#theme', 'system'); await p.ev(`document.querySelector('.settings').open = false; 1`);
// 9. A reload keeps them; the phone shows them; Start over clears them.
const before = JSON.stringify(await notes());
await reload();
check(JSON.stringify(await notes()) === before && (await p.ev(`document.querySelectorAll('#story .n-note').length`)) === 2, 'a reload keeps them');
if (SHOTS) { await p.ev(`document.querySelector('#story p[data-p="37"]').scrollIntoView({ block: 'center' }); 1`); await shot('notes-phone', 390, 844); await p.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false }); await p.sleep(500); }
await p.ev(`window.confirm = () => true; document.querySelector('.settings').open = true; 1`);
await p.click('#reset');
check((await notes()).length === 0, 'Start over clears them');
check(p.errors.length === 0, `no console error${p.errors.length ? `: ${p.errors.join(' | ')}` : ''}`);
console.log(fails.length ? `${fails.length} failed` : 'all passed');
p.close();
process.exit(fails.length ? 1 : 0);
