// Every check of Watson's timeline that plays the real page, one after another: the true path (path-check.mjs), the
// autoplay in three, two and one columns and at a phone's width (world-autoplay-check.mjs), the hints from a fresh page
// and from one with mistakes (world-hints-check.mjs). About 7 minutes.
//   npm run page-checks          (URL=… to check another server, for example the built site; CASE=<dir> another
//                                case, the page's ?case=: scripts/case-env.mjs)
// Starts what is missing and stops only what it started: the local server (scripts/serve.js, port 8321) and a headless
// Chrome on port 9333 with a profile of its own (CHROME: the browser to run; default google-chrome; CDP_PORT: another
// port, so that several runs can go side by side, each with its own Chrome: scripts/page-checks-all.mjs). FIXTURE=0
// leaves out the checks on the invented case (the room panel and its moves), which are the same for every CASE.
// Exits 1 if any check fails.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const up = (url) => fetch(url).then((r) => r.ok, () => false);

const CDP = `http://127.0.0.1:${process.env.CDP_PORT ?? 9333}`;
const started = [];
let profile = null;
if (!process.env.URL && !(await up('http://localhost:8321/'))) {
    started.push(spawn(process.execPath, [path.join(ROOT, 'scripts/serve.js')], { stdio: 'ignore' }));
    for (let i = 0; i < 50 && !(await up('http://localhost:8321/')); i++) await sleep(100);
}
if (!(await up(`${CDP}/json/version`))) {
    profile = fs.mkdtempSync(path.join(os.tmpdir(), 'page-checks-chrome-'));
    started.push(spawn(process.env.CHROME ?? 'google-chrome', ['--headless=new', `--remote-debugging-port=${process.env.CDP_PORT ?? 9333}`, `--user-data-dir=${profile}`, '--window-size=1400,900', 'about:blank'], { stdio: 'ignore' }));
    for (let i = 0; i < 100 && !(await up(`${CDP}/json/version`)); i++) await sleep(100);
}
const checks = [
    ['path-check.mjs'],
    ['world-autoplay-check.mjs', 'three'], ['world-autoplay-check.mjs', 'two'], ['world-autoplay-check.mjs', 'one'],
    ['world-autoplay-check.mjs', 'one', { PHONE: '1' }],
    ['world-hints-check.mjs'],
    ['room-check.mjs'],
    // The room and link moves of the true path, on the invented case that has them.
    ['path-check.mjs', { CASE: 'scripts/fixtures/sealed-room' }],
    ['world-autoplay-check.mjs', 'one', { CASE: 'scripts/fixtures/sealed-room' }],
    ['world-hints-check.mjs', 'fresh', { CASE: 'scripts/fixtures/sealed-room' }],
    ['world-hints-check.mjs', 'below', { CASE: 'scripts/fixtures/sealed-room' }],
];
// A case with files (sub-stories): the true path again in every order of reading the files, the main story read
// first and then last, and once reading each file whole when it is opened (scripts/path-check.mjs, ORDER and WHOLE).
const caseDir = path.join(ROOT, process.env.CASE ?? 'cases/miniatures/rent-box');
const caseFiles = (() => { try { return JSON.parse(fs.readFileSync(path.join(caseDir, 'world', 'case.json'), 'utf8')).files ?? []; } catch { return []; } })();
const perms = (xs) => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
if (caseFiles.length) {
    const orders = perms(caseFiles.map((f) => f.id)).flatMap((p) => [['main', ...p], [...p, 'main']]);
    checks.splice(1, 0, ...orders.map((o) => ['path-check.mjs', { ORDER: o.join(',') }]), ['path-check.mjs', { WHOLE: '1' }]);
}
const failed = [];
const fixture = process.env.FIXTURE !== '0';
for (const [script, ...rest] of checks.filter(([s, ...r]) => fixture || !(s === 'room-check.mjs' || r.some((x) => typeof x === 'object' && x.CASE)))) {
    const env = { ...process.env, ...(typeof rest.at(-1) === 'object' ? rest.pop() : {}) };
    const label = [script, ...rest, env.PHONE ? '(phone)' : '', env.ORDER ? `(order ${env.ORDER})` : '', env.WHOLE ? '(each file whole)' : '', env.CASE && env.CASE !== process.env.CASE ? `(${path.basename(env.CASE)})` : ''].join(' ').trim();
    console.log(`\n== ${label}`);
    const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', script), ...rest], { env, encoding: 'utf8' });
    // Only what matters: the failures and each check's last line.
    const lines = (r.stdout + r.stderr).split('\n').filter(Boolean);
    for (const l of lines.filter((x) => /^FAIL|Error/.test(x))) console.log(l);
    console.log(lines.at(-1) ?? '(no output)');
    if (r.status !== 0) failed.push(label);
}
for (const p of started) p.kill();
if (profile) { await sleep(500); fs.rmSync(profile, { recursive: true, force: true }); }
console.log(failed.length ? `\n${failed.length} check(s) failed: ${failed.join('; ')}` : '\nevery page check passed');
process.exit(failed.length ? 1 : 0);
