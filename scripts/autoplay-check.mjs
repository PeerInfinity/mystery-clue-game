// The autoplay checked: the page opened on `?autoplay=fast` in the headless Chrome on port 9333
// (no pauses, the notes at once), played to the end by ui/autoplay.js itself; then the record must read 70 ahead of
// Holmes with every family as the action table says, no console error, and the save must hold the notes it wrote.
//   node scripts/autoplay-check.mjs [minimal] [shots dir]
// `minimal`: the fewest moves (`?autoplay=minimal-fast`): the record as its table says, no
// notes written, and its clicks counted by kind (→ .cache/autoplay-check-minimal.json).
// Needs the game served (node scripts/serve.js → URL, default http://localhost:8321/). Only one script may drive that
// Chrome at a time. About the runner's time (scripts/ui-run.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { open } from './cdp.mjs';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const MINIMAL = process.argv[2] === 'minimal';
const table = JSON.parse(fs.readFileSync(path.join(ROOT, `cases/silver-blaze/${MINIMAL ? 'action-table-minimal.json' : 'action-table.json'}`), 'utf8'));
const thoughts = JSON.parse(fs.readFileSync(path.join(ROOT, 'cases/silver-blaze/thoughts.json'), 'utf8')).thoughts;
const shots = process.argv[MINIMAL ? 3 : 2] ?? null;
if (shots) fs.mkdirSync(shots, { recursive: true });
const base = process.env.URL ?? 'http://localhost:8321/';
const p = await open({ url: base });
// The player's game, kept aside: a save under the player's key must come back untouched.
const PLAYER = 'mystery-clue-game:silver-blaze:v2';
const AUTO = 'mystery-clue-game:silver-blaze:autoplay';
const mine = await p.ev(`localStorage.getItem(${JSON.stringify(PLAYER)})`);
const t0 = Date.now();
await p.send('Page.navigate', { url: `${base}?autoplay=${MINIMAL ? 'minimal-fast' : 'fast'}` });
await p.sleep(2000);
let st = null;
for (;;) {
    st = await p.ev('window.__autoplay ?? null').catch(() => null);
    if (st?.done || st?.failed) break;
    if (Date.now() - t0 > 60 * 60 * 1000) { st = { ...st, failed: 'timed out' }; break; }
    await p.sleep(2000);
}
const secs = Math.round((Date.now() - t0) / 1000);
const record = await p.text('.panel-body[data-tab="record"]');
const save = JSON.parse(await p.ev(`localStorage.getItem(${JSON.stringify(AUTO)})`) ?? 'null')?.game ?? {};
if (shots) await p.shot(path.join(shots, 'autoplay-end.png'));
const checks = [];
const check = (name, ok, detail = '') => { checks.push({ name, ok, detail }); console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`); };
const clicks = Object.values(st?.clicks ?? {}).reduce((a, b) => a + b, 0);
check('played to the end', !!st?.done && !st?.failed, st?.failed ?? `${st?.moves} moves, ${st?.notes} notes, ${clicks} clicks (${Object.entries(st?.clicks ?? {}).map(([k, n]) => `${k} ${n}`).join(', ')}), ${secs} s`);
if (MINIMAL) check('every move of the table made', st?.moves + st?.had === table.moves, `${st?.moves} made, ${st?.had} made already by another, of ${table.moves}`);
const ahead = (await p.text('#progress'))?.match(/Ahead of Holmes: (\d+)/)?.[1];
check('70 ahead of Holmes', String(table.ahead) === '70' && ahead === '70', `the page: ${ahead ?? 'not found'}; the table: ${table.ahead}`);
const LABELS = { deduction: 'Deductions', notice: 'Odd details', raise: 'Steps seen through', drop: 'Wrong turns dropped', check: 'Checks planned', absence: 'What did not happen' };
for (const [fam, f] of Object.entries(table.families)) check(`${LABELS[fam]}: ${f.scored} of ${f.possible}`, (record ?? '').includes(`${LABELS[fam]}: ${f.scored} of ${f.possible}`));
// The notes: one per clause read, and one for a note with no clause (the highlights and notes it wrote).
const want = MINIMAL ? 0 : thoughts.reduce((n, t) => n + Math.max((t.reads ?? []).length, (t.typed ?? t.text) ? 1 : 0), 0);
const got = (save.notes ?? []).length;
check('the save holds its notes', got === want, `${got} notes and highlights, ${want} expected`);
if (!MINIMAL) check('the notes hold the typed forms', thoughts.filter((t) => t.typed).every((t) => (save.notes ?? []).some((n) => (Array.isArray(n) ? n[5] : n.text) === t.typed)), '');
check('no console error', p.errors.length === 0, p.errors.slice(0, 3).join(' | '));
check('the player\'s game kept aside', (await p.ev(`localStorage.getItem(${JSON.stringify(PLAYER)})`)) === mine, '');
fs.mkdirSync(path.join(ROOT, '.cache'), { recursive: true });
fs.writeFileSync(path.join(ROOT, `.cache/autoplay-check${MINIMAL ? '-minimal' : ''}.json`), JSON.stringify({ secs, status: st, checks, record, errors: p.errors }, null, 1));
console.log(`${checks.filter((c) => c.ok).length}/${checks.length} checks passed in ${secs} s`);
p.close();
process.exit(checks.every((c) => c.ok) ? 0 : 1);
