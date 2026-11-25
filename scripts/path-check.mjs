// Play the true path (cases/miniatures/rent-box/world/path.json) through Watson's timeline (index.html) in headless Chrome:
// a fresh page, "Read on" to each move's paragraph (so the commitment gate is met for real), then the move's clicks,
// each checked: its control is offered, the save shows the move, `see` (a pattern) is on the page after it, and the
// page throws nothing. Every answer the story gives on the way must find the player's one circle right; at the end of
// the story no contradiction may be open and no likely clash unheld.
//   node scripts/path-check.mjs [path.json]      STOP=<para> stops after that paragraph's moves (and keeps the page)
//   CASE=<dir> node scripts/path-check.mjs       another case (the page's ?case=; default cases/miniatures/rent-box)
// A case with files (sub-stories): each move's `at` lists what must have been read, and the check reads just that,
// story by story, in the order ORDER gives (story ids, comma-separated; default the main story, then the files as the
// case lists them); WHOLE=1 reads a file to its end once it is opened. scripts/page-checks.mjs tries several orders.
// Papers earned by solving questions (case.json `delivery.mode: earned`): the check plays a seed (SEED, default 1;
// the page's ?seed=), question by question: the placement is drawn here by the same module as the page's
// (engine/delivery.js) from the case's own data, and the questions are solved in an order drawn from the seed among
// those open, each by its moves (`for_q`); before each, the papers on the page must be exactly those held, and after
// it the question must be solved and the notice must say what it brought.
// BRIDGE=1 (earned papers): the same, played as in an Archipelago: the papers come from the stand-in host of
// ui/bridge.js, which places them as the seed does and must end with every solved question checked.
// Needs the game served (node scripts/serve.js; URL, default http://localhost:8321/) and the headless Chrome
// on port 9333 (one script at a time). Prints one line per move; exits 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { CASE, WORLD, STORE, BRIDGE, pageUrl, CDP } from './case-env.mjs';
import { controlOf, made, nextRead, readToOf, needsOf } from '../ui/world-moves.js';
import { MAIN, refList } from '../engine/refs.js';
import { caseLogic, deliveryMode, placement, choices, rng, heldAfter } from '../engine/delivery.js';
const FILE = process.argv[2] ?? path.join(WORLD, 'path.json');
// LIES=1 (with ANSWERS=evidence): the path without its moves of distrust (a false statement stays uncertain: its
// clash is then an undecided one).
// What a move would then show (`see`) is not asked, and the story is not read to its end: at the end every false
// statement that what follows from the evidence contradicts, by the engine, must be in a contradiction on the page.
const LIES = !!process.env.LIES;
const moves = JSON.parse(fs.readFileSync(FILE, 'utf8')).moves.filter((m) => !LIES || m.do !== 'trust' || ['likely', 'confirmed'].includes(m.level));
const header = JSON.parse(fs.readFileSync(path.join(WORLD, 'case.json'), 'utf8'));
const EARNED = deliveryMode(header) === 'earned';
const SEED = Number(process.env.SEED ?? 1);
// ANSWERS=evidence: the answers marked from what the evidence implies (world/implications.json). A circle of the
// path on a question that has implications is not clicked: it must be there already, from the path's links.
const ANSWERS = process.env.ANSWERS ?? '';
const AQ = ANSWERS ? `answers=${ANSWERS}` : '';
const impQs = new Set(ANSWERS === 'evidence' ? (await import('./case-rules.mjs')).caseRules(CASE).map((i) => i.q) : []);
const URL_ = pageUrl(process.env.URL ?? 'http://localhost:8321/', [EARNED ? `seed=${SEED}` : '', BRIDGE ? 'iframeId=mystery&bridge=stub' : '', AQ].filter(Boolean).join('&'));
const STOP = +(process.env.STOP ?? 1e9);
const files = JSON.parse(fs.readFileSync(path.join(WORLD, 'case.json'), 'utf8')).files ?? [];
const ORDER = process.env.ORDER ? process.env.ORDER.split(',') : null;
const WHOLE = !!process.env.WHOLE;
// GOAL_FIRST=1 (earned papers): the goal is solved as soon as it can be, the ending read with questions still open,
// and the rest solved after it. The ending must stay shut until then and take nothing from the questions left.
const GOAL_FIRST = !!process.env.GOAL_FIRST;
const atText = (at) => refList(at).join(', ');

const list = await (await fetch(`${CDP}/json`)).json();
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let n = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
});
const send = (method, params = {}) => new Promise((r) => { const id = ++n; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'eval failed'); return r.result?.result?.value; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = JSON.stringify;
const ready = async () => { for (let i = 0; i < 150; i++) { if (await ev(`!!document.querySelector('#timeline')?.children.length`).catch(() => false)) return; await sleep(200); } throw new Error('page not ready'); };

await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
// The case's address without a seed first: a save from another seed would make the page ask before starting anew.
await send('Page.navigate', { url: pageUrl(process.env.URL ?? 'http://localhost:8321/', AQ) }); await sleep(1500);
// A fresh page in three columns: every part in view, as on a laptop.
await ev(`localStorage.setItem(${J(STORE)}, ${J(J({ layout: 'three' }))}); 1`);
if (EARNED) await send('Page.navigate', { url: URL_ }); else await send('Page.reload');
await sleep(800); await ready();
errors.length = 0;

const reload = async () => { await send('Page.reload'); await sleep(500); await ready(); };
const save = () => ev(`JSON.parse(localStorage.getItem(${J(STORE)}) ?? '{}')`);
const exists = (sel) => ev(`!!document.querySelector(${J(sel)})`);
const click = async (sel) => { const ok = await ev(`(() => { const e = document.querySelector(${J(sel)}); if (!e) return false; e.click(); return true; })()`); await sleep(30); return ok; };
const choose = async (sel, value) => { const ok = await ev(`(() => { const e = document.querySelector(${J(sel)}); if (!e) return false; e.value = ${J(String(value))}; e.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`); await sleep(30); return ok; };
const pageText = () => ev(`document.body.innerText`);
const esc = (s) => s.replace(/["\\]/g, '\\$&');
const LEVELS = { 'ruled out': 0, unlikely: 1, uncertain: 2, likely: 3, confirmed: 4 };

let failures = 0;
const fail = (m, why) => { failures++; console.log(`FAIL ¶${atText(m.at)} ${m.do} ${m.q ?? m.of ?? m.a ?? m.key ?? ''}${m.pick ? ' = ' + m.pick : ''}: ${why}`); };

/** Open what a move works on in the detail panel: a fact on the timeline, a question, or a likely clash's side. */
async function openOn(on) {
    if (on === 'route') return click(`#timeline [data-fact^="r:r:"] .ph`);
    if (on.startsWith('q:')) return (await click(`#q-box a.link[data-q="${esc(on.slice(2))}"]`)) || click(`#q-box [data-q="${esc(on.slice(2))}"]`);
    if (/^(hyp|pre):/.test(on)) return openOn(`q:${on.slice(4).split('=')[0]}`);
    if (await exists(`#timeline [data-fact="${esc(on)}"]`)) return click(`#timeline [data-fact="${esc(on)}"] .ph`) || click(`#timeline [data-fact="${esc(on)}"]`);
    return false;
}
const defaultOn = (m) => m.on ?? (m.do === 'link' ? m.entry : ['a', 'b', 'c', 'm', 'plan'].includes(m.do) ? (m.a ?? m.of) : null);

// --- Earliest. The data's earliest paragraph for a circle; the page's, for the reasoning moves, found in play.
const W = WORLD;
const qs = new Map(JSON.parse(fs.readFileSync(path.join(W, 'questions.json'), 'utf8')).questions.map((q) => [q.id, q]));
const strains = fs.existsSync(path.join(W, 'strains.json')) ? JSON.parse(fs.readFileSync(path.join(W, 'strains.json'), 'utf8')).strains : [];
const label = (m) => `${m.do} ${m.q ?? m.of ?? m.a ?? m.key ?? ''}${m.pick ? ' = ' + m.pick : ''}${m.for ? ' → ' + m.for : ''}${m.b ? ' ~ ' + m.b : ''}`;
const early = [];
const report = (m, at, why) => { early.push({ m, at }); failures++; console.log(`FAIL EARLY ¶${atText(m.at)} → ¶${atText(at)} ${label(m)}${why ? ` (${why})` : ''}`); };
// A case with files: a move is early when what the data needs (each story read to, a paper's delivery counted) is
// at most what the move's `at` reads, and less somewhere.
const lessNeeds = (x, y) => {
    const a = needsOf(x, files), b = needsOf(y, files);
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].every((k) => (a[k] ?? 0) <= (b[k] ?? 0)) && [...keys].some((k) => (a[k] ?? 0) < (b[k] ?? 0));
};
for (const m of moves.filter((x) => x.do === 'circle' && !x.late && files.length)) {
    const q = qs.get(m.q), o = q?.possibilities.find((x) => x.value === m.pick);
    if (!o) continue;
    const right = q.answer === m.pick || (q.also_right ?? []).includes(m.pick);
    const strain = strains.find((x) => [x.a, x.b].some((y) => y?.q === m.q && y.pick === m.pick));
    const at = right ? [q.raised, o.available, ...refList(q.answer_inferable_at)].filter((x) => x != null)
        : m.see && strain ? [q.raised, o.available, ...refList(strain.available)].filter((x) => x != null) : null;
    if (at && lessNeeds(at, m.at)) report(m, Object.entries(needsOf(at, files)).map(([k, n]) => (k === MAIN ? n : `${k}:${n}`)), right ? 'the answer is inferable there' : `its likely clash ${strain.id} shows there`);
}
for (const m of moves.filter((x) => x.do === 'circle' && !x.late && !files.length)) {
    const q = qs.get(m.q), o = q?.possibilities.find((x) => x.value === m.pick);
    if (!o) continue;
    const right = q.answer === m.pick || (q.also_right ?? []).includes(m.pick);
    const strain = strains.find((x) => [x.a, x.b].some((y) => y?.q === m.q && y.pick === m.pick));
    const at = right ? Math.max(q.raised ?? 0, o.available, q.answer_inferable_at ?? 0) : m.see && strain ? Math.max(q.raised ?? 0, o.available, strain.available) : null;
    if (at != null && at < m.at) report(m, at, right ? 'the answer is inferable there' : `its likely clash ${strain.id} shows there`);
}
const REASON = new Set(['a', 'b', 'c', 'm', 'plan', 'stop', 'compare', 'account']);
/** Does the page allow move m now? Nothing is left behind: a move taken is undone, a plan opened is closed. */
async function allowed(m) {
    const on = defaultOn(m);
    if (on && !(await openOn(on))) return false;
    if (['a', 'b', 'c', 'm'].includes(m.do)) {
        const sel = m.do === 'm' ? `#detail [data-move-m="${esc(m.of)}"][data-at="${esc(m.time)}"]` : m.do === 'a' ? `#detail [data-move-a="${esc(m.a)}"][data-with="${esc(m.b)}"]` : m.do === 'b' ? `#detail [data-move-b="${esc(m.of)}"]` : `#detail [data-move-c="${esc(m.of)}"][data-for="${esc(m.for)}"]`;
        if (!(await exists(sel))) return false;
        const n = (await save()).reasoning?.length ?? 0;
        await click(sel);
        const took = ((await save()).reasoning?.length ?? 0) === n + 1;
        if (took) await click('#undo');
        return took;
    }
    // A plan or a check is a view: allowed once it shows what the move is for (`see`), or, without one, once offered.
    // A check clicked can only be taken back by reloading the page (its result is not saved).
    const plan = m.do === 'plan' ? m.of : m.key.split('|')[0], d = `#detail [data-move-d="${esc(plan)}"]`;
    if (!(await exists(d))) return false;
    const shut = await ev(`document.querySelector(${J(d)}).innerText !== 'Hide'`);
    if (shut) await click(d);
    let ok = true, clicked = false;
    if (m.do !== 'plan') {
        const sel = `#detail [data-${m.do}="${esc(m.key)}"]`;
        ok = await exists(sel);
        if (ok && m.see) { await click(sel); clicked = true; }
    }
    if (ok && m.see) ok = new RegExp(m.see).test(await ev(`document.querySelector('#detail').innerText`));
    if (clicked) { await reload(); await ev(`window.__trying?.(true); 1`); }
    else if (shut && (await exists(d))) await click(d);
    return ok;
}
let probing = [];   // the next paragraph's reasoning moves not yet found allowed earlier
/** Where the reading stands, for a report: each story read to. */
const readingText = (sv) => [MAIN, ...files.map((f) => f.id)].map((id) => [id, readToOf(sv)(id)]).filter(([, n]) => n).map(([id, n]) => (id === MAIN ? n : `${id}:${n}`));
async function probe(now) {
    // A move tried here is taken back: nothing it would complete is judged solved meanwhile.
    await ev(`window.__trying?.(true); 1`);
    try { for (const m of probing) if (await allowed(m)) { report(m, now, 'the page allows it'); probing = probing.filter((x) => x !== m); } } finally { await ev(`window.__trying?.(false); 1`).catch(() => null); }
    if (errors.length) { failures++; console.log(`FAIL ¶${now} page error while trying moves early: ${errors.splice(0).join(' | ')}`); }
}

/** Read one paragraph more of a story, through its tab (a case with files) and Read on. */
const readOne = async (story) => {
    if (files.length && !(await exists(`.story-tab[data-story="${story}"].on`)) && !(await click(`.story-tab[data-story="${story}"]`))) return false;
    return click('#next');
};
async function readTo(at) {
    if (files.length) {
        // Story by story, in ORDER, just what `at` needs (WHOLE: a file once opened, to its end). Before each paragraph,
        // the reasoning moves of this `at` are tried: one the page takes already is early.
        probing = moves.filter((m) => J(m.at) === J(at) && REASON.has(m.do) && !m.late);
        for (let story; (story = nextRead(at, files, readToOf(await save()), ORDER)) != null;) {
            if (probing.length) await probe(readingText(await save()));
            const was = readToOf(await save())(story);
            const to = WHOLE && story !== MAIN ? Infinity : was + 1;
            for (let i = was; i < to; i++) { await readOne(story); if (readToOf(await save())(story) === i) break; }
            let now = readToOf(await save())(story);
            // A click the page did not take (nothing read, and no gate named): seen now and then at the very first
            // paragraph when three Chromes run side by side. Tried once more before it counts.
            if (now === was && !(await ev(`document.querySelector('#gate-news')?.innerText ?? ''`)).trim()) { await new Promise((r) => setTimeout(r, 500)); await readOne(story); now = readToOf(await save())(story); if (now !== was) console.log(`  (¶${was + 1} read at the second try)`); }
            const news = await ev(`(() => { const e = document.querySelector('#answer-news'); return e && !e.hidden ? [...e.querySelectorAll('li')].map((li) => ({ text: li.innerText, bad: !!li.querySelector('.bad') })) : []; })()`);
            for (const a of news) if (a.bad) { failures++; console.log(`FAIL ¶${now} answer: ${a.text}`); }
            if (news.length) { console.log(`  ¶${now} answered: ${news.map((a) => a.text.replace(/\s+/g, ' ')).join(' | ')}`); await click('[data-answers-close]'); }
            if (now === was) {
                const gate = await ev(`document.querySelector('#gate-news')?.innerText ?? ''`);
                failures++; console.log(`FAIL ${story === MAIN ? `gate before ¶${was + 1}: ${gate.replace(/\s+/g, ' ')}` : `could not read ${story} ¶${was + 1}`}`);
                return false;
            }
        }
        return true;
    }
    const p = at;
    probing = moves.filter((m) => m.at === p && REASON.has(m.do) && !m.late);
    while (true) {
        const now = (await save()).para ?? 1;
        if (now >= p) return true;
        if (probing.length) await probe(now);
        await click('#next');
        const after = (await save()).para ?? 1;
        const news = await ev(`(() => { const e = document.querySelector('#answer-news'); return e && !e.hidden ? [...e.querySelectorAll('li')].map((li) => ({ text: li.innerText, bad: !!li.querySelector('.bad') })) : []; })()`);
        for (const a of news) if (a.bad) { failures++; console.log(`FAIL ¶${after} answer: ${a.text}`); }
        if (news.length) { console.log(`  ¶${after} answered: ${news.map((a) => a.text.replace(/\s+/g, ' ')).join(' | ')}`); await click('[data-answers-close]'); }
        if (after === now) {
            const gate = await ev(`document.querySelector('#gate-news')?.innerText ?? ''`);
            failures++; console.log(`FAIL gate before ¶${now + 1}: ${gate.replace(/\s+/g, ' ')}`);
            return false;
        }
    }
}

async function play(m) {
    const on = defaultOn(m);
    if (on && !(await openOn(on))) return fail(m, `cannot open ${on}`);
    const before = await save();
    switch (m.do) {
        case 'circle': case 'cross': {
            if (impQs.has(m.q)) {
                const q = qs.get(m.q), right = q && (q.answer === m.pick || (q.also_right ?? []).includes(m.pick));
                if (m.do === 'circle' && right && !LIES && (await save()).marks?.[m.q]?.[m.pick] !== 'circled') return fail(m, 'the answer does not follow from what the path has linked');
                break;
            }
            const sel = `#q-box [data-mark-q="${esc(m.q)}"][data-mark-pick="${esc(m.pick)}"]`;
            if (!(await exists(sel))) await click(`#q-box [data-more-q="${esc(m.q)}"]`);
            if (!(await exists(sel))) return fail(m, 'possibility not offered');
            const want = m.do === 'circle' ? 'circled' : 'crossed';
            for (let i = 0; i < 3 && (await save()).marks?.[m.q]?.[m.pick] !== want; i++) await click(sel);
            if ((await save()).marks?.[m.q]?.[m.pick] !== want) return fail(m, 'mark not saved');
            break;
        }
        case 'trust': {
            // Confirmed is earned: the path takes the offer under two sources that agree, unless a question solved
            // since has confirmed the statement already.
            if (m.level === 'confirmed') {
                if (((await save()).trust?.links?.[m.link]) !== LEVELS.confirmed) { const b = `#clashes [data-agree="${esc(m.link)}"]`; if (!(await exists(b))) return fail(m, `no offer to confirm ${m.link}`); await click(b); }
                break;
            }
            const sel = m.link ? `#detail .link-trust[data-key="${esc(m.link)}"]` : `#detail .person-trust[data-person="${esc(m.person)}"]`;
            if (!(await exists(sel))) return fail(m, `no trust control for ${m.link ?? m.person} on ${on}`);
            await choose(sel, LEVELS[m.level]);
            const tr = (await save()).trust ?? {};
            const got = m.link ? tr.links?.[m.link] : tr.people?.[m.person];
            if (got !== LEVELS[m.level]) return fail(m, 'trust not saved');
            break;
        }
        case 'a': case 'b': case 'c': case 'm': {
            const sel = m.do === 'm' ? `#detail [data-move-m="${esc(m.of)}"][data-at="${esc(m.time)}"]` : m.do === 'a' ? `#detail [data-move-a="${esc(m.a)}"][data-with="${esc(m.b)}"]` : m.do === 'b' ? `#detail [data-move-b="${esc(m.of)}"]` : `#detail [data-move-c="${esc(m.of)}"][data-for="${esc(m.for)}"]`;
            if (!(await exists(sel))) return fail(m, 'move not offered');
            await click(sel);
            const note = await ev(`document.querySelector('#detail .note')?.innerText ?? ''`);
            if ((await save()).reasoning?.length !== (before.reasoning?.length ?? 0) + 1) return fail(m, `not taken${note ? ': ' + note : ''}`);
            break;
        }
        case 'plan': {
            const sel = `#detail [data-move-d="${esc(m.of)}"]`;
            if (!(await exists(sel))) return fail(m, 'no "What would this need?"');
            const shut = await ev(`document.querySelector(${J(sel)}).innerText !== 'Hide'`);
            if (shut) await click(sel);
            break;
        }
        case 'stop': case 'compare': case 'account': {
            const sel = `#detail [data-${m.do}="${esc(m.key)}"]`;
            const d = `#detail [data-move-d="${esc(m.key.split('|')[0])}"]`;
            if (!(await exists(sel)) && (await exists(d)) && (await ev(`document.querySelector(${J(d)}).innerText !== 'Hide'`))) await click(d);
            if (!(await exists(sel))) return fail(m, 'check not offered');
            await click(sel);
            break;
        }
        case 'hold': {
            const sel = `[data-hold="${esc(m.strain)}"]`;
            if (!(await exists(sel))) return fail(m, 'likely clash not shown');
            await click(sel);
            if (!(await save()).held?.includes(m.strain)) return fail(m, 'not held');
            break;
        }
        case 'visit': case 'day':
            // The day's box is under the main story.
            if (files.length && !(await exists(`.story-tab[data-story="${MAIN}"].on`))) await click(`.story-tab[data-story="${MAIN}"]`);
            // falls through
        case 'way': case 'got': case 'route': case 'link': {
            const sel = controlOf(m);
            if (!(await exists(sel))) return fail(m, 'not offered');
            await click(sel);
            if (!made(m, await save())) return fail(m, `not taken: ${await ev(`document.querySelector('.rm-note')?.innerText ?? ''`)}`);
            break;
        }
        default: return fail(m, 'unknown move');
    }
    if (m.see && !LIES && !new RegExp(m.see).test(await pageText())) return fail(m, `not on the page: /${m.see}/`);
    if (errors.length) { const e = errors.splice(0); return fail(m, `page error: ${e.join(' | ')}`); }
    console.log(`ok ¶${atText(m.at)} ${m.do} ${m.way ?? m.node ?? m.entry ?? m.q ?? m.of ?? m.a ?? m.key ?? m.strain ?? m.link ?? m.person ?? ''}${m.pick ? ' = ' + m.pick : ''}${m.do === 'link' ? ' → ' + m.q : ''}${m.for ? ' → ' + m.for : ''}${m.b ? ' ~ ' + m.b : ''}`);
}

const t0 = Date.now();
// SAVE=<file>: write the save at the end (with STOP, the state to look at a paragraph from).
const dump = async () => { if (process.env.SAVE) fs.writeFileSync(process.env.SAVE, JSON.stringify(await save())); };
let last = 1;
if (EARNED) {
    const R = (f) => JSON.parse(fs.readFileSync(path.join(WORLD, f), 'utf8'));
    const logic = caseLogic({ questions: R('questions.json').questions, observations: R('observations.json').observations, facts: R('facts.json').facts, files, delivery: header.delivery });
    const place = placement(logic, SEED);
    // The order of solving: among the questions open, one drawn by a generator of its own from the seed.
    // GOAL_FIRST: the goal when it is open, else what it rests on (and what those rest on), else any.
    const lq = new Map(logic.questions.map((q) => [q.id, q]));
    const under = new Set();
    const walk = (id) => { for (const r of lq.get(id)?.requires ?? []) if (!under.has(r)) { under.add(r); walk(r); } };
    if (GOAL_FIRST) walk(logic.goal);
    const rand = rng(SEED ^ 0x5bd1e995);
    const first = (open) => open.find((q) => q.id === logic.goal) ?? (() => { const u = open.filter((q) => under.has(q.id)), from = u.length ? u : open; return from[Math.floor(rand() * from.length)]; })();
    const order = choices(logic, place, rand, GOAL_FIRST ? first : null).order;
    const mainEnd = await ev(`+document.getElementById('para').max`), ENDING = header.delivery.ending ?? mainEnd;
    const mainAt = async () => readToOf(await save())(MAIN);
    let after = 0;
    const title = (id) => files.find((f) => f.id === id)?.title ?? id;
    console.log(`seed ${SEED}: ${order.map((q) => `${q}${place.get(q) ? ` brings ${place.get(q)}` : ''}`).join(', ')}`);
    const byQ = new Map();
    for (const m of moves) { const q = m.for_q?.[0]; if (!byQ.has(q)) byQ.set(q, []); byQ.get(q).push(m); }
    for (const q of byQ.keys()) if (!order.includes(q)) fail({ at: [], do: 'path' }, `moves for ${q}, which is no question to solve`);
    const solved = new Set();
    if (GOAL_FIRST) {
        // The ending is shut while the goal is open: the story reads up to it and no further.
        await click(`.story-tab[data-story="${MAIN}"]`);
        for (let i = await mainAt(); i < ENDING - 1; i++) await readOne(MAIN);
        await readOne(MAIN);
        const at = await mainAt();
        if (at !== ENDING - 1) { failures++; console.log(`FAIL the ending (¶${ENDING} on) with the goal open: the story is read to ¶${at}`); }
        else console.log(`  the ending is shut at ¶${ENDING} while the goal is open`);
    }
    const restsOfGoal = [...new Set(JSON.parse(fs.readFileSync(path.join(WORLD, 'observations.json'), 'utf8')).observations.filter((o) => o.q === logic.goal).flatMap((o) => o.from.filter((f) => f?.solved).map((f) => f.solved)))];
    let restsSeen = false;
    for (const q of order) {
        // The papers held, and the replies to the questions solved (a reply comes with its question, whatever the seed).
        if (BRIDGE) await sleep(150);   // the papers come by a message
        const want = [...heldAfter(logic, place, solved), ...files.filter((f) => f.reply != null && solved.has(f.reply)).map((f) => f.id)].sort();
        const tabs = (await ev(`[...document.querySelectorAll('.story-tab')].map((b) => b.dataset.story).filter((x) => x !== 'main')`)).sort();
        if (J(tabs) !== J(want)) { failures++; console.log(`FAIL before ${q}: the papers on the page are ${tabs.join(', ') || 'none'}, not ${want.join(', ') || 'none'}`); }
        if (!(await ev(`window.__delivery.open(${J(q)})`))) { failures++; console.log(`FAIL ${q}: the page does not have it open`); }
        let ok = true;
        for (const m of byQ.get(q) ?? []) { if (!(await readTo(m.at))) { ok = false; break; } await play(m); }
        if (!ok) break;
        const sv = await save();
        if (!sv.solved?.[q]) { failures++; console.log(`FAIL ${q}: not solved after its moves`); break; }
        const news = (await ev(`document.querySelector('#solved-news')?.hidden ? '' : document.querySelector('#solved-news').innerText`)).replace(/\s+/g, ' ');
        const expect = q === logic.goal ? 'The case is solved' : BRIDGE ? 'Its check is sent to the Archipelago' : place.get(q) ? `It brought: ${title(place.get(q))}` : 'It brought nothing new';
        if (!news.includes(expect)) { failures++; console.log(`FAIL ${q}: the notice says "${news}", not "${expect}"`); }
        else console.log(`  solved ${q}: ${expect}`);
        await click('[data-solved-close]');
        solved.add(q);
        // Linking to the goal: the line of a question it rests on says that it counts (solved), or will once solved.
        if (!restsSeen && restsOfGoal.includes(q) && !solved.has(logic.goal) && (await exists(`[data-linking="${logic.goal}"]`))) {
            restsSeen = true;
            await click(`[data-linking="${logic.goal}"]`);
            const tag = await ev(`document.querySelector('#timeline [data-rests="${q}"]')?.innerText ?? ''`);
            if (!/counted/.test(tag)) { failures++; console.log(`FAIL linking to the goal: the line of ${q}, solved, does not say it is counted ("${tag}")`); }
            const open = restsOfGoal.find((r) => !solved.has(r));
            const other = open ? await ev(`document.querySelector('#timeline [data-rests="${open}"]')?.innerText ?? null`) : null;
            if (other != null && !/counts once/.test(other)) { failures++; console.log(`FAIL linking to the goal: the line of ${open}, not solved, says "${other}"`); }
            await click('[data-linking-done]');
            console.log(`  linking to the goal: the line of ${q} says "${tag}"${other != null ? `, that of ${open} "${other}"` : ''}`);
        }
        if (GOAL_FIRST && q !== logic.goal && solved.has(logic.goal)) after++;
        if (GOAL_FIRST && q === logic.goal) {
            const left = order.length - solved.size;
            await click(`.story-tab[data-story="${MAIN}"]`);
            for (let i = await mainAt(); i < mainEnd; i++) await readOne(MAIN);
            const at = await mainAt();
            if (at !== mainEnd) { failures++; console.log(`FAIL the ending after the goal: the story is read to ¶${at} of ${mainEnd}`); break; }
            if (!left) console.log('  nothing was left open when the goal was solved (the goal rests on every question, or this seed leaves none)');
            else console.log(`  the ending read to ¶${mainEnd} with ${left} question(s) open`);
        }
    }
    if (GOAL_FIRST && !failures) console.log(`  ${after} question(s) solved after the ending`);
    if (BRIDGE) {
        await sleep(150);
        const got = (await ev('window.__stub.solved()')).sort(), want = [...solved].sort();
        if (J(got) !== J(want)) { failures++; console.log(`FAIL the bridge: the host has ${got.length} question(s) checked, the page solved ${want.length}`); }
        else console.log(`  the bridge: the host has all ${got.length} solved questions checked`);
    }
}
for (const m of EARNED ? [] : moves) {
    if (!files.length) {
        if (m.at > STOP) break;
        if (m.at < last) { fail(m, `out of order (after ¶${last})`); continue; }
    }
    if (!(await readTo(m.at))) break;
    if (!files.length) last = m.at;
    await play(m);
}
if (LIES) {
    const { loadWorld } = await import('./world-provenance.js');
    const { assertions, contradictions } = await import('../engine/world.js');
    const { derive, derivedAssertions } = await import('../engine/implications.js');
    const world = loadWorld(CASE), imps = (await import('./case-rules.mjs')).caseRules(CASE);
    const follows = derivedAssertions(world, derive(imps, () => true, () => true), (q) => q.possibilities.map((x) => x.value));
    const lies = [...new Set(contradictions(world, [...assertions(world), ...follows]).flatMap((c) => (follows.includes(c.a) ? [c.b] : follows.includes(c.b) ? [c.a] : [])).filter((x) => x.truth === false).map((x) => x.fact))];
    const keys = await ev(`[...document.querySelectorAll('#clashes [data-clash]')].map((a) => a.dataset.clash)`);
    // Only what the path has read to: a statement the page has not come to is on no timeline.
    const there = await ev(`${J(lies)}.filter((id) => document.querySelector('#timeline [data-fact="' + id + '"]'))`);
    for (const id of there) if (!keys.some((k) => k.slice(6).split('|').some((x) => x === id || x.startsWith(id + '#')))) { failures++; console.log(`FAIL at the end: ${id} is false and what follows contradicts it, and no contradiction on the page names it`); }
    console.log(`${there.length} false statement(s) on the timeline that the evidence contradicts; ${keys.length} contradiction(s) on the page`);
} else if (STOP >= 1e9 && !failures) {
    if (files.length) await click(`.story-tab[data-story="${MAIN}"]`);
    const end = await ev(`+document.getElementById('para').max`);
    if (!(await readTo(end))) { console.log(`${failures} failure(s)`); process.exit(1); }
    const lacked = await ev(`[...document.querySelectorAll('#q-box p')].filter((p) => /^Your description lacked/.test(p.textContent)).map((p) => p.closest('li').querySelector('a.link').textContent + ': ' + p.textContent)`);
    for (const l of lacked) { failures++; console.log(`FAIL at the end: ${l}`); }
    const open = await ev(`document.querySelector('#clashes .clash-box:not(.against-box) summary')?.innerText ?? ''`);
    if (open) { failures++; console.log(`FAIL at the end: ${open}\n${await ev(`document.querySelector('#clashes').innerText`)}`); }
    const unheld = await ev(`[...document.querySelectorAll('#clashes [data-hold]')].map((b) => b.closest('li').innerText.replace(/\\s+/g, ' '))`);
    for (const s of unheld) { failures++; console.log(`FAIL at the end, a likely clash not held: ${s}`); }
}
await dump();
if (early.length) console.log(`${early.length} move(s) allowed before their paragraph`);
console.log(`${failures ? `${failures} failure(s)` : 'all moves played'} in ${Math.round((Date.now() - t0) / 1000)} s`);
ws.close();
process.exit(failures ? 1 : 0);
