// Play the action table through the real UI in headless Chrome (docs/review-closing.md, Rounds 163–168): a fresh game on
// Hard chosen in the settings, "Next paragraph" until each move's paragraph, then the move's clicks and fields; after
// each move the saved game is read to check that the engine took it. At the end, the record against Holmes.
//   node scripts/ui-run.mjs [table.json] [out.json]   (default: cases/silver-blaze/action-table.json → .cache/ui-run.json)
// Needs the game served (node scripts/serve.js → URL, default http://localhost:8321/) and the headless Chrome on port
// 9333. Only one script may drive that Chrome at a time: two clients on its one page spoil each other's runs.
// STOP=<para> stops after that paragraph's moves. About 12–13 minutes for the whole game on a loaded machine.
import fs from 'node:fs';
import path from 'node:path';
import { open } from './cdp.mjs';
import { loadCase } from '../engine/loadCase.js';
import { Game } from '../engine/game.js';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const model = await loadCase(path.join(ROOT, 'cases/silver-blaze'));
const table = JSON.parse(fs.readFileSync(process.argv[2] ?? path.join(ROOT, 'cases/silver-blaze/action-table.json')));
fs.mkdirSync(path.join(ROOT, '.cache'), { recursive: true });
const OUT = process.argv[3] ?? path.join(ROOT, '.cache/ui-run.json');
const moves = table.thoughts.flatMap((t) => t.moves.map((m) => ({ ...m, thought: t.id }))).sort((a, b) => a.seq - b.seq);
const STOP = +(process.env.STOP ?? 1e9);
const p = await open({ url: process.env.URL ?? 'http://localhost:8321/' });
// A fresh game on Hard: clear the save, reload, choose Hard in the settings.
await p.ev(`localStorage.clear(); 1`); await p.send('Page.reload'); await p.sleep(1500); await p.idle();
await p.ev(`document.querySelector('.settings').open = true; 1`);
await p.choose('#difficulty', 'hard');
await p.ev(`document.querySelector('.settings').open = false; 1`);
// The theory's name: answer the page's prompt().
let promptText = null;
p.ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.method === 'Page.javascriptDialogOpening') p.send('Page.handleJavaScriptDialog', { accept: true, promptText: promptText ?? '' }); });
const st = async () => (await p.state())?.game ?? {};
const has = (list, id) => (list ?? []).some((x) => (Array.isArray(x) ? x[0] : x) === id);
const results = [];
let mirror = null; // a node Game from the save, for answer labels
const label = async (slot, v) => {
    const s = model.slots.get(slot);
    if (s?.labels?.[v]) return s.labels[v];
    mirror = new Game(model, { state: await st() });
    const c = model.cards.get(v);
    return c && (c.section === 'entities' || c.section === 'events') ? mirror.nameOf(v) : c?.text ?? v;
};
// The default layout (docs/layout.md): the story in the left panel, the card in the right. As a player would, the
// lists are chosen in the left panel, so a card clicked there opens on the right, and the left goes back to the story
// to click its words. The reading bar is above both panels.
const LEFT = '.panel[data-panel="0"]';
const choose = async (t) => (await p.ev(`document.querySelector('${LEFT} .tab.on')?.dataset.tab === ${JSON.stringify(t)}`)) || p.click(`${LEFT} .tab[data-tab="${t}"]`);
const showStory = async () => (await p.ev(`!!document.querySelector('#story')`)) || choose('story');
async function openCard(id, tab) {
    for (const t of [...new Set([tab, 'cards', 'inferences', 'background', 'questions'])]) {
        await choose(t);
        if (await p.click(`#panel-0 [data-card="${id}"]`)) return true;
    }
    // A set-aside card is listed under the fold of the Cards tab.
    await choose('cards');
    await p.ev(`document.querySelectorAll('#panel-0 details.set-aside').forEach((d) => d.open = true); 1`);
    return p.click(`#panel-0 [data-card="${id}"]`);
}
async function step(u) {
    if (u.story !== undefined) {
        await showStory();
        const sel = `#story p[data-p="${u.story}"] .m`;
        const ok = await p.ev(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(sel)})].find((e) => e.dataset.ids.split(' ').includes(${JSON.stringify(u.span)}) && e.textContent === ${JSON.stringify(u.words)}) ?? [...document.querySelectorAll(${JSON.stringify(sel)})].find((e) => e.dataset.ids.split(' ').includes(${JSON.stringify(u.span)})); if (!el) return false; el.scrollIntoView(); el.click(); return true; })()`);
        if (ok) await p.idle();
        return ok || `no words for ${u.span} in ¶${u.story}`;
    }
    if (u.open) return (await openCard(u.open, u.tab)) || `cannot open ${u.open}`;
    if (u.tab) return (await choose(u.tab)) || `no tab ${u.tab}`;
    if (u.open_details) { await p.ev(`document.querySelectorAll(${JSON.stringify(u.open_details)}).forEach((d) => d.open = true); 1`); return true; }
    if (u.select_text) {
        const v = await p.ev(`[...(document.querySelector(${JSON.stringify(u.select_text)})?.options ?? [])].find((o) => o.text === ${JSON.stringify(u.text)})?.value ?? null`);
        return v ? ((await p.choose(u.select_text, v)) || `cannot choose ${u.text}`) : `no option “${u.text}” in ${u.select_text}`;
    }
    if (u.select) return (await p.choose(u.select, u.value)) || `no option ${u.value} in ${u.select}`;
    if (u.fill) return (await p.ev(`(() => { const e = document.querySelector(${JSON.stringify(u.fill)}); if (!e) return false; e.value = ${JSON.stringify(String(u.value))}; return true; })()`)) || `no field ${u.fill}`;
    if (u.propose) {
        const text = await label(u.propose, u.value);
        const ok = await p.ev(`(() => { const e = document.querySelector('.tool-body input[data-add="${u.propose}"]'); if (!e) return false; e.value = ${JSON.stringify(text)}; e.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
        if (ok) await p.idle();
        return ok || `no answer box for ${u.propose}`;
    }
    if (u.click_if_absent) { if (await p.ev(`!!document.querySelector(${JSON.stringify(u.click_if_absent)})`)) return true; }
    if (u.click) {
        // This headless Chrome has no window.prompt: answer it in the page (the dialog handler covers a real one).
        if (u.prompt) { promptText = u.prompt; await p.ev(`window.prompt = () => ${JSON.stringify(u.prompt)}; 1`); }
        return (await p.click(u.click)) || `nothing to click: ${u.click}`;
    }
    if (u.expect) return true;
    return `unknown step ${JSON.stringify(u)}`;
}
// What the save must show once a move is made.
async function took(m) {
    const s = await st();
    const known = (id) => has(s.collected, id) || has(s.built, id) || has(s.filed, id);
    switch (m.op) {
        case 'collect': return has(s.collected, m.card);
        case 'ask': return has(s.asked, m.card);
        case 'build': return has(s.built, m.inference);
        case 'notice': return has(s.noticed, m.card);
        case 'raise': return (s.raised ?? []).some((r) => r[0] === m.target && r[2] === m.exception);
        case 'seal': return (s.seals ?? []).some((x) => x.verb === m.verb && JSON.stringify(x.fields) === JSON.stringify(m.fields) && (x.expect ?? null) === (m.expect ?? null) && JSON.stringify(x.answer ?? null) === JSON.stringify(m.answer ?? null));
        case 'file': return has(s.filed, m.absence);
        case 'pose': return (s.posed ?? []).some((q) => q[1] === m.template && JSON.stringify(q[2]) === JSON.stringify(m.cards));
        case 'reread': return (s.rereads ?? []).some((r) => r.from === m.from && r.to === m.to);
        case 'setAside': return has(s.setAside, m.card);
        case 'split': return has(s.split, m.card);
        case 'doubt': return (s.suspected ?? []).includes(m.card) && (s.doubtReason ?? []).some(([id, r]) => id === m.card && r === m.reason);
        case 'candidate': return (s.marks ?? []).some(([slot, mk]) => slot === m.slot && (mk.listed ?? []).includes(m.value));
        case 'theory': return (s.theories ?? []).some((t) => t.label === m.label && Object.entries(m.assignment).every(([k, v]) => t.assignment?.[k] === v));
        case 'drop': return (s.drops ?? []).some((d) => JSON.stringify(d.target) === JSON.stringify(m.target) && d.reason === m.reason);
        case 'weigh': return true; // a view: the residue shown (checked by the click)
        default: return known(m.card);
    }
}
const t0 = Date.now();
for (const m of moves) {
    if (m.at > STOP) break;
    // Read on until the move's paragraph has been read (the move was made with read = at + 1).
    while (((await st()).read ?? 1) <= m.at) { if (!(await p.click('#read'))) { results.push({ ...m, ok: false, why: 'cannot read on' }); break; } }
    let why = null;
    if (await took(m) && m.op !== 'theory') { results.push({ seq: m.seq, thought: m.thought, op: m.op, at: m.at, ok: true, already: true }); continue; }
    // A connection left half made by an earlier move would take this one's cards: start clean.
    await p.click('[data-build-clear]');
    // A theory's answers are added one by one: a failed one is noted and the rest still tried.
    const fails = [];
    for (const u of m.ui) { const r = await step(u); if (r !== true) { fails.push(r); why = r; if (m.op !== 'theory') break; } }
    if (fails.length > 1) why = fails.join('; ');
    const ok = await took(m);
    const toast = await p.text('#toast');
    results.push({ seq: m.seq, thought: m.thought, op: m.op, at: m.at, ok, why: ok ? null : why ?? 'the save does not show it', toast: ok ? undefined : toast });
    if (!ok) console.log(`FAIL ¶${m.at} ${m.thought} ${m.op} ${m.card ?? m.inference ?? m.check ?? m.target?.slot ?? m.target?.theory ?? m.label ?? ''}: ${why ?? 'the save does not show it'} | toast: ${toast}`);
    if (results.length % 50 === 0) { console.log(`${results.length} moves, ¶${m.at}, ${Math.round((Date.now() - t0) / 1000)} s, failed ${results.filter((r) => !r.ok).length}`); fs.writeFileSync(OUT, JSON.stringify({ results }, null, 1)); }
}
// Read to the end and take the record.
while (await p.click('#read-deduction') || await p.click('#read')) { if (await p.ev(`!document.querySelector('#read')`)) break; }
await p.click('[data-record-open]');
const record = await p.text('.panel-body[data-tab="record"]');
fs.writeFileSync(OUT.replace(/\.json$/, '-save.json'), JSON.stringify(await p.state()));
fs.writeFileSync(OUT, JSON.stringify({ secs: Math.round((Date.now() - t0) / 1000), failed: results.filter((r) => !r.ok).length, results, record, errors: p.errors }, null, 1));
console.log(`done in ${Math.round((Date.now() - t0) / 1000)} s; ${results.length} moves, failed ${results.filter((r) => !r.ok).length}; console errors ${p.errors.length}`);
console.log(record.slice(0, 1500));
p.close();
