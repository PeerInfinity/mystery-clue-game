// A player who only tries things, with the answers marked from the evidence (world/implications.json): it reads
// whatever can be read, then takes the entries of the timeline in a shuffled order and, for each, links it to every
// question in a shuffled order and makes the reasoning moves offered on it ("It changed", "Something is missing
// here"); then reads again. When that brings nothing more and questions are open, it tries disbelieving each
// statement in turn (the trust of the telling set to ruled out), and puts the
// trust back at once: a lie that is evidence counts from that moment, and a question once solved stays solved. It
// marks no answer.
//   CASE=<dir> [SEED=<placement>] [SHUFFLE=<n>] node scripts/random-links-check.mjs
// After every entry the page's save is read and the engine asked, from the links alone, what follows
// (engine/observations.js fill, engine/implications.js derive and verdict): no wrong answer may ever be circled, an
// answer the page has circled must be the one that follows, an answer it has crossed out must be ruled out, and a
// question is solved on the page exactly when its answer follows. At the end every question that has implications
// must be solved and the story read to its last paragraph: the case can be finished by trial alone, in any order.
// Needs the game served and the headless Chrome (scripts/page-checks.mjs starts both).
import fs from 'node:fs';
import path from 'node:path';
import { CASE, CDP, WORLD, STORE, pageUrl } from './case-env.mjs';
import { fill } from '../engine/observations.js';
import { derive, verdict } from '../engine/implications.js';
import { deliveryMode, rng, shuffle } from '../engine/delivery.js';

const R = (f) => JSON.parse(fs.readFileSync(path.join(WORLD, f), 'utf8'));
const header = R('case.json');
const EARNED = deliveryMode(header) === 'earned';
const SEED = Number(process.env.SEED ?? 1), SHUFFLE = Number(process.env.SHUFFLE ?? 1);
const rand = rng(SHUFFLE);
const facts = R('facts.json').facts, observations = R('observations.json').observations, questions = R('questions.json').questions;
const implications = (await import('./case-rules.mjs')).caseRules(CASE);
const qById = new Map(questions.map((q) => [q.id, q]));
// A question whose evidence needs a route built in the room panel, or something got through: this player makes
// no room moves, so such a case cannot be finished by it. Said, and passed over.
const roomOnly = observations.filter((o) => o.from.some((f) => f && typeof f === 'object' && (f.route_through || f.reasoned === 'got_through')));
if (roomOnly.length) { console.log(`skipped: ${roomOnly.map((o) => o.id).join(', ')} need${roomOnly.length === 1 ? 's' : ''} a move in the room panel, which this player does not make`); process.exit(0); }
const autoQs = [...new Set(implications.map((i) => i.q))].filter((q) => qById.has(q));
const right = (q) => [].concat(qById.get(q).answer ?? [], qById.get(q).also_right ?? []);
const values = (q) => qById.get(q).possibilities.map((x) => x.value);
const J = JSON.stringify, sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tabs = await (await fetch(`${CDP}/json`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let n = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise((r) => { const id = ++n; pending.set(id, r); ws.send(J({ id, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'eval failed'); return r.result?.result?.value; };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
const base = process.env.URL ?? 'http://localhost:8321/';
await send('Page.navigate', { url: pageUrl(base, 'answers=evidence') }); await sleep(1500);
await ev(`localStorage.setItem(${J(STORE)}, ${J(J({ layout: 'three' }))}); 1`);
await send('Page.navigate', { url: pageUrl(base, [EARNED ? `seed=${SEED}` : '', 'answers=evidence'].filter(Boolean).join('&')) });
for (let i = 0; i < 100 && !(await ev(`!!document.querySelector('#timeline [data-fact]') || !!document.getElementById('next')`).catch(() => false)); i++) await sleep(100);
await sleep(800);
errors.length = 0;
const save = () => ev(`JSON.parse(localStorage.getItem(${J(STORE)}) ?? '{}')`);

let failures = 0;
const fail = (why) => { failures++; console.log(`FAIL ${why}`); };

// Read everything that can be read: each story's tab in turn, Read on until it reads no more.
// Where there are visits (the present): after reading, the first visit never made that is open is made, and all is
// read again; where one never made waits for another the same day, that one is made first; where nothing more fits
// in the day, the day is ended. Until every visit known has been made once.
const AFTER = Object.fromEntries((header.files ?? []).filter((f) => f.visit).map((f) => [f.id, (f.visit.after ?? [])[0] ?? []]));
const readAll = () => ev(`(() => {
    const after = ${J(AFTER)};
    const visitNext = () => {
        const bs = [...document.querySelectorAll('#story [data-visit]')], fresh = bs.filter((b) => !b.dataset.visited);
        if (!fresh.length) return false;
        const open = fresh.find((b) => !b.disabled);
        if (open) { open.click(); return true; }
        for (const b of fresh) for (const id of after[b.dataset.visit] ?? []) { const p = bs.find((x) => x.dataset.visit === id && !x.disabled); if (p) { p.click(); return true; } }
        document.querySelector('#story [data-day-end]').click();
        return true;
    };
    let total = 0;
    for (let step = 0; step < 60; step++) { total += readOnce(); if (!visitNext()) break; }
    return total + readOnce();
    function readOnce() {
    const at = () => { const s = JSON.parse(localStorage.getItem(${J(STORE)}) ?? '{}'); return s.para + '|' + (s.log ?? []).length; };
    let read = 0;
    for (let round = 0; round < 3; round++) for (let i = 0; i < document.querySelectorAll('#story .story-tab, #story [data-story]').length; i++) {
        document.querySelectorAll('#story .story-tab, #story [data-story]')[i]?.click();
        for (let k = 0; k < 80; k++) { const b = at(); document.getElementById('next').click(); if (at() === b) break; read++; }
    }
    if (!document.querySelector('#story [data-story]')) for (let k = 0; k < 80; k++) { const b = at(); document.getElementById('next').click(); if (at() === b) break; read++; }
    return read;
    }
})()`);
const entriesNow = () => ev(`[...new Set([...document.querySelectorAll('#timeline [data-fact]')].map((e) => e.dataset.fact))]`);
// One entry: opened, linked to each question in this order where the page offers the link, and its moves made.
const tryEntry = (id, qs) => ev(`(() => {
    const ph = document.querySelector('#timeline [data-fact=' + ${J(J(id))} + '] .ph');
    if (!ph) return null;
    ph.click();
    let links = 0, moves = 0;
    const offered = [];   // the questions the page offered a link to (one not raised yet is tried again later)
    for (const q of ${J(qs)}) {
        document.querySelector('#detail [data-link-more]')?.click();
        const b = document.querySelector('#detail [data-link-entry=' + ${J(J(id))} + '][data-link-q="' + q + '"]');
        if (b) offered.push(q);
        if (b && !b.disabled) { b.click(); links++; }
    }
    for (let i = 0; i < 12; i++) {
        document.querySelector('#timeline [data-fact=' + ${J(J(id))} + '] .ph')?.click();
        const m = document.querySelector('#detail button.move[data-move-a], #detail button.move[data-move-m]');
        if (!m) break;
        m.click(); moves++;
    }
    // What its own words speak of: every entry offered is tried in turn, until one is taken (a wrong one is refused,
    // and is no move: a long case offers some hundreds, and a round of refusals alone must not keep this player going).
    for (let i = 0; i < 1000; i++) {
        document.querySelector('#timeline [data-fact=' + ${J(J(id))} + '] .ph')?.click();
        const m = document.querySelectorAll('#detail button.move[data-move-s]')[i];
        if (!m) break;
        m.click();
        if (!document.querySelector('#detail button.move[data-move-s]')) { moves++; break; }
    }
    return { links, moves, offered };
})()`);

// The entry a link names, for the engine: a fact, or a reasoning move's entry rebuilt from its id.
const factById = new Map(facts.map((f) => [f.id, f]));
const entryOf = (id) => {
    if (factById.has(id)) return factById.get(id);
    let m = /^r:a:(.+)\|(.+)$/.exec(id);
    if (m) return { id, reasoned: { move: 'a', premises: [m[1], m[2]] } };
    m = /^r:s:(.+)>(.+)$/.exec(id);
    if (m) return { id, reasoned: { move: 's', premises: [m[1], m[2]] } };
    m = /^r:m:(.+)@(.+)$/.exec(id);
    if (m) return { id, reasoned: { move: 'm', premises: [] }, rule: m[1], gap: m[2] };
    return { id, reasoned: { move: id.split(':')[1] ?? '?', premises: [] } };
};
let pendingQ = new Set();
const followed = new Map();   // the answer that followed for a question, kept: a question solved stays solved when a statement is believed again
async function check(where) {
    const sv = await save();
    const solved = new Set(Object.keys(sv.solved ?? {}));
    const known = [...new Set((sv.links ?? []).map((l) => l.entry))].map(entryOf);
    // A telling distrusted is disbelieved whole. (What it carried is off the page's timeline meanwhile and still in
    // this reckoning, which can only make the engine conclude more than the page: that is waited for, not a fault.)
    const filled = fill(observations, sv.links ?? [], known, sv.marks ?? {}, { solved: (q) => solved.has(q), doubted: (id) => sv.trust?.links?.[id] === 0, partlyDoubted: () => false }).filled;
    const derived = derive(implications, (id) => filled.some((x) => x.obs.id === id), (q) => solved.has(q));
    pendingQ = new Set();
    for (const q of autoQs) {
        const v = verdict(q, values(q), derived), marks = sv.marks?.[q] ?? {};
        const circled = Object.keys(marks).filter((k) => marks[k] === 'circled'), crossed = Object.keys(marks).filter((k) => marks[k] === 'crossed');
        for (const c of circled) if (!right(q).includes(c)) fail(`${where}: ${q}: ${c} is circled, and it is not right`);
        if (circled.length > 1) fail(`${where}: ${q}: ${circled.length} answers circled`);
        if (v.concluded != null) followed.set(q, v.concluded);
        if (circled.length && (v.concluded ?? followed.get(q)) !== circled[0]) fail(`${where}: ${q}: the page has ${circled[0]} circled; from its links ${v.concluded ?? 'nothing'} follows`);
        if (solved.has(q) !== (circled.length === 1)) fail(`${where}: ${q}: ${solved.has(q) ? 'solved with no answer circled' : 'an answer circled and not solved'}`);
        if (!solved.has(q)) for (const c of crossed) if (!v.ruled.has(c)) fail(`${where}: ${q}: ${c} is crossed out, and nothing linked rules it out`);
        // An answer that follows and is not circled yet: the page may not have offered it yet. It must be by the end.
        if (v.concluded != null && !circled.length) pendingQ.add(q);
    }
    if (errors.length) fail(`${where}: page error: ${errors.splice(0).join(' | ')}`);
    return { sv, solved };
}

const t0 = Date.now();
const tried = new Set();
let links = 0, moves = 0, rounds = 0, doubts = 0, doubtedOnce = false;
for (;; rounds++) {
    const read = await readAll();
    // What anyone says starts as uncertain and counts for nothing: this player takes everyone at their word (likely),
    // as soon as their words arrive, under Sources.
    await ev(`(() => { for (let i = 0; i < 50; i++) { const s = [...document.querySelectorAll('#sources .person-trust')].find((x) => x.value === ''); if (!s) break; s.value = '3'; s.dispatchEvent(new Event('change', { bubbles: true })); } return 1; })()`);
    const ids = shuffle((await entriesNow()).filter((id) => !id.startsWith('hyp:')), rand);
    const open = autoQs.filter((q) => true);
    let did = 0;
    for (const id of ids) {
        const { solved } = await check(`before ${id}`);
        const qs = shuffle(open.filter((q) => !solved.has(q) && !tried.has(`${id}>${q}`)), rand);
        if (!qs.length) continue;
        const r = await tryEntry(id, qs);
        if (!r) continue;
        for (const q of r.offered) tried.add(`${id}>${q}`);
        links += r.links; moves += r.moves; did += r.links + r.moves;
        if (failures > 5) break;
    }
    const { solved: now } = await check(`round ${rounds + 1}`);
    if (failures > 5) break;
    if (!read && !did) {
        // Nothing more by reading, linking or reasoning: disbelieve each statement in turn, and believe it again.
        if (autoQs.every((q) => now.has(q)) || doubtedOnce) break;
        doubtedOnce = true;
        for (const t of shuffle(facts.filter((f) => f.attr === 'tells').map((f) => f.id), rand)) {
            const set = (level) => ev(`(() => {
                const sel = () => document.querySelector('#detail .link-trust[data-key=' + ${J(J(t))} + ']');
                if (!sel()) { document.querySelector('#timeline [data-fact=' + ${J(J(t))} + '] .ph')?.click(); document.querySelector('#detail .told-list [data-fact] .ph')?.click(); }
                const s = sel(); if (!s) return false;
                s.value = ${J(String('LEVEL'))}.replace('LEVEL', ${J(String(level))}); s.dispatchEvent(new Event('change', { bubbles: true })); return true;
            })()`);
            if (!(await set(0))) continue;
            doubts++;
            await check(`disbelieving ${t}`);
            await set('');
        }
        continue;
    }
    if (rounds > 40) { fail('still going after 40 rounds'); break; }
}
const { sv, solved } = await check('the end');
for (const q of pendingQ) fail(`the end: ${q}: its answer follows from the links and the page has not circled it`);
const unsolved = autoQs.filter((q) => !solved.has(q));
if (unsolved.length) fail(`not solved by trying everything: ${unsolved.join(', ')}`);
await ev(`document.querySelector('#story .story-tab')?.click(); 1`);
const last = await ev(`+document.getElementById('para').max`);
if (!unsolved.length && sv.para !== last) fail(`every question solved, and the story stands at ¶${sv.para} of ${last}`);
console.log(`${failures ? `${failures} FAILED` : 'ok'}: ${links} links, ${moves} moves${doubts ? ` and ${doubts} statements disbelieved in turn` : ''} tried in ${rounds + 1} rounds, ${solved.size} of ${autoQs.length} questions solved, the story at ¶${sv.para} of ${last}, ${Math.round((Date.now() - t0) / 1000)} s (shuffle ${SHUFFLE}${EARNED ? `, seed ${SEED}` : ''})`);
ws.close();
process.exit(failures ? 1 : 0);
