// Every page check (scripts/page-checks.mjs) on every case, several cases side by side: each run has a headless
// Chrome of its own (ports from 9340), and all share the local server. The checks on the invented case (the room
// panel) are the same whatever the case, so only the first run makes them.
//   npm run page-checks-all            JOBS=<n> runs at once (default 3: more, and a loaded machine makes moves time out)
//   npm run page-checks-all -- cases/silver-blaze cases/miniatures/rent-box      only these
// Prints each case's result as it ends, slowest last; exits 1 if any check fails.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const up = (url) => fetch(url).then((r) => r.ok, () => false);

const found = [];
for (const base of ['cases', 'cases/miniatures'].filter((b) => fs.existsSync(path.join(ROOT, b)))) for (const dir of fs.readdirSync(path.join(ROOT, base))) if (fs.existsSync(path.join(ROOT, base, dir, 'world', 'path.json'))) found.push(`${base}/${dir}`);
const cases = process.argv.slice(2).length ? process.argv.slice(2).map((c) => c.replace(/\/+$/, '')) : found;
// The longest first, so the short ones fill in beside them: by the size of the true path.
const size = (c) => fs.statSync(path.join(ROOT, c, 'world', 'path.json')).size;
cases.sort((a, b) => size(b) - size(a));
const JOBS = Math.max(1, Number(process.env.JOBS ?? 2));

let server = null;
if (!process.env.URL && !(await up('http://localhost:8321/'))) {
    server = spawn(process.execPath, [path.join(ROOT, '..', 'scripts/serve.js')], { stdio: 'ignore' });
    for (let i = 0; i < 50 && !(await up('http://localhost:8321/')); i++) await sleep(100);
}
const t0 = Date.now();
const mins = (ms) => `${Math.round(ms / 6000) / 10} min`;
const failed = [];
let next = 0;
async function worker(slot) {
    while (next < cases.length) {
        const i = next++, c = cases[i], t = Date.now();
        const env = { ...process.env, CASE: c, CDP_PORT: String(9340 + slot), FIXTURE: i === 0 ? '1' : '0' };
        const out = await new Promise((resolve) => {
            const p = spawn(process.execPath, [path.join(ROOT, 'scripts/page-checks.mjs')], { env });
            let text = '';
            p.stdout.on('data', (d) => { text += d; });
            p.stderr.on('data', (d) => { text += d; });
            p.on('close', (code) => resolve({ code, text }));
        });
        const lines = out.text.split('\n').filter(Boolean);
        const ok = out.code === 0;
        if (!ok) failed.push(c);
        console.log(`${ok ? 'ok  ' : 'FAIL'} ${c} (${mins(Date.now() - t)})${ok ? '' : '\n' + lines.map((l) => `     ${l}`).join('\n')}`);
    }
}
await Promise.all(Array.from({ length: Math.min(JOBS, cases.length) }, (_, slot) => worker(slot)));
server?.kill();
console.log(failed.length ? `\n${failed.length} case(s) failed: ${failed.join(', ')}` : `\nevery page check passed on ${cases.length} case(s) in ${mins(Date.now() - t0)}`);
process.exit(failed.length ? 1 : 0);
