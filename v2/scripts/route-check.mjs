// The reasoning routes of a case: for each gated question (one the page asks the reader to commit to before its
// give-away, and inferable earlier), how far the moves "What is this for?" and "What would this need?" reach just
// before the give-away, with the right answers circled that a careful reader could have circled by then, and (stage 2)
// the changes "It changed" points out, the stops "What stopped it?" finds and the comparisons of two plans.
// The real page does the reasoning (window.__routes in ui/world.js): every link it would offer and the engine
// accepts, made until nothing new fits. A question has a route when a link fits that names its answer: its aim
// served, its who-answer's action serving an aim, or the action its why-question presupposes.
//   CASE=<dir> node scripts/route-check.mjs [--json <file>]
// Needs the game served (node scripts/serve.js; URL, default http://localhost:8321/) and the headless Chrome on port
// 9333 (one script at a time). Prints a line per gated question; exits 1 if one has no route.
import fs from 'node:fs';
import path from 'node:path';
import { WORLD, STORE, pageUrl, CDP } from './case-env.mjs';

const BASE = process.env.URL ?? 'http://localhost:8321/v2/';
const J = JSON.stringify;
const out = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;
const read = (f) => JSON.parse(fs.readFileSync(path.join(WORLD, f), 'utf8'));
const qs = read('questions.json').questions;
const isRight = (q, v) => v === q.answer || (q.also_right ?? []).includes(v);
const gated = qs.filter((q) => q.answer != null && !q.latent && q.raised != null && q.answer_inferable_at != null && q.answer_inferable_at < q.answer_given_at).sort((a, b) => a.answer_given_at - b.answer_given_at);
/** The right answers a careful reader could have circled by ¶p: raised, available and inferable by then. */
function marksAt(p) {
    const marks = {};
    for (const q of qs) {
        if (q.answer == null || q.raised == null || q.raised > p || q.kind === 'provenance') continue;
        // The answer itself where it is available, else the earliest of its also-rights (Hunter also had a key, but
        // the reasoning runs through Straker's).
        const o = q.possibilities.filter((x) => isRight(q, x.value) && x.available <= p).sort((a, b) => (a.value !== q.answer) - (b.value !== q.answer) || a.available - b.available)[0];
        if (o && (q.answer_inferable_at ?? q.answer_given_at) <= p) marks[q.id] = { [o.value]: 'circled' };
    }
    return marks;
}

const list = await (await fetch(`${CDP}/json`)).json();
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let n = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise((r) => { const id = ++n; pending.set(id, r); ws.send(J({ id, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'eval failed'); return r.result?.result?.value; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Page.navigate', { url: pageUrl(BASE) }); await sleep(1200);

const report = [];
let none = 0;
for (const q of gated) {
    const p = q.answer_given_at - 1;
    await ev(`localStorage.setItem(${J(STORE)}, ${J(J({ layout: 'three', para: p, marks: marksAt(p) }))}); 1`);
    await send('Page.reload'); await sleep(600);
    for (let i = 0; i < 100 && !(await ev(`typeof window.__routes === 'function'`).catch(() => false)); i++) await sleep(100);
    const answers = [q.answer, ...(q.also_right ?? [])].map((v) => `hyp:${q.id}=${v}`);
    const r = await ev(`window.__routes(${J([...answers, `pre:${q.id}`])})`);
    const mine = r.links.filter((l) => answers.includes(l.of) || answers.includes(l.for) || l.of === `pre:${q.id}`);
    const plan = r.plans.some((id) => answers.includes(id));
    // Stage 2's moves: a change whose who-question this is, or a change of aim of its entry's agent; a stop by or of
    // an answer. A comparison of two plans names no answer: counted in all, never a route by itself.
    const changes = r.changes.filter((c) => c.q === q.id || (q.entry?.attr === 'intends' && c.aim && c.aim === q.entry.of));
    const stops = r.stops.filter((x) => answers.includes(x.on) || answers.includes(x.by));
    const any = mine.length + changes.length + stops.length;
    if (!any) none++;
    report.push({ q: q.id, label: q.label, at: p, answer: q.answer, entry: q.entry, links: mine, plan, changes, stops, allChanges: r.changes, allStops: r.stops, all: r.links.length, compares: r.compares, accounts: r.accounts, misses: any ? [] : r.misses, present: r.present });
    const extra = [changes.length && `${changes.length} change(s)`, stops.length && `${stops.length} stop(s)`].filter(Boolean).join(', ');
    console.log(`${any ? 'route' : 'NONE '} ¶${p} ${q.id} (${q.answer}): ${mine.length} link(s)${plan ? ', a plan' : ''}${extra ? ', ' + extra : ''}; ${r.links.length} links, ${r.compares.length} comparison(s) in all`);
}
if (errors.length) console.log(`page errors: ${errors.join(' | ')}`);
if (out) fs.writeFileSync(out, J({ gated: report }, null, 1) + '\n');
console.log(`${gated.length - none} of ${gated.length} gated questions have a reasoning route`);
ws.close();
process.exit(none ? 1 : 0);
