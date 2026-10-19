// The casebook page: read the story a paragraph at a time; collect cards as they are mentioned (or, in Hard,
// by clicking the text); for every open question rule out what the evidence excludes; test theories.
// All the logic is in engine/; this file only draws and dispatches.

import { loadCase } from '../engine/loadCase.js';
import { makeReadings } from './readings.js';
import { rebuildProblem } from '../engine/caseModel.js';
import { RemoteProblem, NeedSolve, workerClient, settle } from '../engine/remoteProblem.js';
import { Game, MEDIUM, CUSTOM, WAIT, BG_START, BG_ASK, CONCLUSION_KINDS, OPTIONS, PLAYER_OPTIONS, READER_OPTIONS, PRESETS, DROP_REASONS, CHECK_TEMPLATES } from '../engine/game.js';

const CASE = 'cases/silver-blaze';
const STORE = 'mystery-clue-game:silver-blaze:v2';
const KIND_GROUPS = [
    ['person', 'People'], ['animal', 'Animals'], ['group', 'Groups'], ['place', 'Places'],
    ['object', 'Things'], ['document', 'Documents'], ['events', 'Events'], ['claims', 'Clues'],
];
const CHIP_LIMIT = 30;

const $ = (sel) => document.querySelector(sel);
const same = (s) => s.toLowerCase().replace(/[’‘`]/g, "'").replace(/^(the|a|an) /, '');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let model;
let game;
let story;
const ui = { tab: 'card', selected: null, kind: null, search: '', menu: null, menuNote: '', expanded: new Set(), timeline: 'fabula', theory: null, focusWindow: null, focusSlot: null, fit: null, building: null, reread: null, rereadShown: null };
const cache = new Map();

// ---------- names ----------
function cardName(id) {
    const c = model.cards.get(id);
    if (!c) return model.windows.find((w) => w.id === id)?.label ?? model.data.questions.find((q) => q.id === id)?.text ?? id;
    if (c.section === 'entities' || c.section === 'events') return game.nameOf(id);
    if (['claims', 'rules', 'inferences', 'propositions', 'applied'].includes(c.section)) return c.text;
    if (c.section === 'glosses') return c.term;
    return id;
}
const shortName = (id, n = 70) => { const s = cardName(id); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };
function valueName(slot, v) {
    const s = model.slots.get(slot);
    if (s?.labels?.[v]) return s.labels[v];
    if (v === s?.on && s.facet === 'identity') return 'nobody else in the story';
    return cardName(v);
}
const link = (id, text = null) => `<span class="link" data-card="${esc(id)}">${esc(text ?? shortName(id))}</span>`;
function kindOf(id) {
    const c = model.cards.get(id);
    if (!c) return '';
    if (c.section === 'entities') return c.kind;
    return { events: 'event', claims: 'clue', rules: 'background', glosses: 'background', inferences: 'inference', propositions: 'proposition', applied: 'applied fact' }[c.section] ?? c.section;
}
const paraLabel = (p) => `paragraph ${p}`;
// A card in the player's hand: neither left out of the game nor set aside by the player (docs/reader-layer.md, Q5).
const inHand = (id) => !game.isHidden(id) && !game.isSetAside(id);

// ---------- state ----------
function save() {
    try { localStorage.setItem(STORE, JSON.stringify({ game: game.save(), selected: ui.selected })); } catch { /* private mode */ }
}
function restore() {
    try { return JSON.parse(localStorage.getItem(STORE) ?? 'null'); } catch { return null; }
}
function changed() {
    cache.clear();
    save();
    render();
}
function toast(html) {
    const t = $('#toast');
    t.innerHTML = html;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { t.hidden = true; }, 2600);
}

// ---------- the solver at arm's length ----------
// A check too slow for the page goes to a Web Worker (engine/remoteProblem.js); meanwhile a panel shows how far it
// has got, and clicks wait. `run(fn)` does a piece of work (a click's, a render's) until it gets through.
let busyDepth = 0;
function showBusy(on) {
    $('#busy').hidden = !on;
    if (on) { $('#busy-bar').style.width = '0%'; $('#busy-bar').classList.add('indeterminate'); $('#busy-detail').textContent = ''; }
}
function busyProgress(done, total, what) {
    const known = what === 'answers';
    $('#busy-bar').classList.toggle('indeterminate', !known);
    if (known) $('#busy-bar').style.width = `${Math.round((100 * done) / Math.max(total, 1))}%`;
    $('#busy-detail').textContent = known ? `Weighing the answers to ${done} of ${total} questions` : `Sifting the clues: check ${done}`;
}
function run(fn) {
    return settle(fn, () => model.problem, {
        onBusy: () => { if (busyDepth++ === 0) showBusy(true); },
        onProgress: busyProgress,
        onIdle: () => { if (--busyDepth <= 0) { busyDepth = 0; showBusy(false); } },
    }).catch((e) => { console.error(e); toast(`Something went wrong: ${esc(e.message)}`); });
}
const later = (fn, ms) => setTimeout(() => run(fn), ms);

// A piece of the page that may wait on the solver (a tab's count, a theory's weighing; docs/ui.md Q3): drawn now if
// its answer is at hand, else a placeholder; after the page is drawn the pieces are worked out one at a time, without
// the busy veil, and the tool redrawn as each arrives. A piece only reads the game, so working it out again is harmless.
const pending = new Map();
let filling = false;
function piece(key, fn, placeholder) {
    try { return fn(); } catch (e) {
        if (!(e instanceof NeedSolve)) throw e;
        pending.set(key, fn);
        return placeholder;
    }
}
async function fillPieces() {
    if (filling) return;
    filling = true;
    try {
        while (pending.size) {
            const [key, fn] = pending.entries().next().value;
            pending.delete(key);
            await settle(fn, () => model.problem).catch((e) => console.error(e));
            await run(() => { renderToolNow(); renderReader(); });
        }
    } finally { filling = false; }
}

// ---------- the story ----------
function renderStory() {
    const el = $('#story');
    const hard = game.collecting();
    el.classList.toggle('hard', hard);
    let h = '';
    for (let i = 0; i < game.read; i++) {
        const segs = story.segments(i);
        const body = segs.map((s) => {
            const ids = s.ids.filter((id) => (model.cards.has(id) && !game.isHidden(id)) || s.kinds.includes('window') || s.kinds.includes('question'));
            if (!ids.length) return esc(s.text);
            const got = ids.some((id) => game.knows(id));
            const kind = s.kinds.includes('entity') ? 'entity' : s.kinds.includes('question') ? 'question' : s.kinds.includes('event') ? 'event' : s.kinds.includes('window') ? 'window' : 'claim';
            return `<span class="m ${kind}${got ? ' got' : ''}" data-para="${i}" data-ids="${esc(ids.join(' '))}">${esc(s.text)}</span>`;
        }).join('');
        const again = ui.rereadShown && i >= ui.rereadShown.from && i <= ui.rereadShown.to;
        h += `<p class="${i === 0 ? 'title' : ''}${i === game.read - 1 && i > 0 ? ' latest' : ''}${again ? ' reread' : ''}" data-p="${i}">${body}</p>`;
    }
    const top = el.scrollTop;
    el.innerHTML = h;
    el.scrollTop = top;
    renderReader();
}

function renderReader() {
    const el = $('#reader');
    const news = recordNews();
    if (game.finished()) {
        el.innerHTML = `${news}<span class="muted">The end.</span> ${game.autoSolves() ? '<span class="small muted">In Trivial the game worked the case out: nothing is scored. On Easy you can race Holmes.</span>' : '<span class="link small" data-record-open="1">Your record against Holmes</span>'}`;
        return;
    }
    const blockers = game.blockers();
    const ahead = game.nextDeductionAt() - game.read;
    const aheadScene = game.nextSceneAt() - game.read;
    const blocked = blockers.length && game.pace === WAIT;
    let note = '';
    if (blockers.length && blockers.some((s) => game.stepInferences(s))) {
        // Holmes is about to reason: the story waits until the player has built the inferences he uses.
        const needs = [...new Set(blockers.flatMap((s) => game.stepInferences(s) ?? []))].filter((id) => !game.knows(id));
        note = blocked
            ? `<div class="note block">Holmes has worked something out. Before reading on, build the ${needs.length === 1 ? 'inference' : `${needs.length} inferences`} he is about to draw (see <span class="link" data-tab-open="inferences">Inferences</span>).${game.helps('hints') ? ` They start from: ${[...new Set(needs.flatMap((id) => game.connectSet(id)))].filter((x) => game.knows(x)).map((x) => link(x, shortName(x, 40))).join(', ')}.` : ''}</div>`
            : '<div class="note">Holmes is a step ahead of you here.</div>';
    } else if (blockers.length) {
        const prompts = blockers.map((s) => {
            const c = game.routeById.get(s).concludes;
            const slot = model.slots.get(c.slot ?? c.formula.eq[0]);
            const text = `${shortName(slot.on, 60)} — ${game.promptOf(slot.id)}`;
            return game.knows(slot.on) ? `<span class="link" data-slot-open="${slot.id}">${esc(text)}</span>` : esc(text);
        });
        note = blocked
            ? `<div class="note block">Holmes has worked something out. Before reading on, settle: ${prompts.join('; ')}${blockers.some((s) => game.routeById.get(s).concludes.slot) ? ' (at least rule out what Holmes rules out)' : ''}</div>`
            : '<div class="note">Holmes is a step ahead of you here.</div>';
    }
    const toEnd = game.nextDeductionAt() >= story.paragraphs.length;
    const jump = ahead > 1
        ? `<button id="read-deduction" class="quiet" ${blocked ? 'disabled' : ''} title="${toEnd ? 'Read to the end of the story' : 'Read on to just before Holmes works something out, so you can try it first'}">${toEnd ? 'To the end' : 'Next deduction'} <span class="small">(${ahead} ¶)</span></button>`
        : '';
    const sceneJump = aheadScene > 1 && game.nextSceneAt() < story.paragraphs.length
        ? `<button id="read-scene" class="quiet" ${blocked ? 'disabled' : ''} title="Read on to the start of the next scene">Next scene <span class="small">(${aheadScene} ¶)</span></button>`
        : '';
    const points = game.showsSignals() ? game.storySignals().filter((x) => x.kind === 'reread' && x.para === game.read - 1) : [];
    for (const x of points) note += `<div class="note">The story points back: <span class="link" data-reread-prompt="${x.passage.join('-')}">re-read paragraphs ${x.passage[0]}–${x.passage[1]}</span>.</div>`;
    note = news + note;
    el.innerHTML = `<button id="read" ${blocked ? 'disabled' : ''}>Next paragraph</button>${sceneJump}${jump}<button id="reread-open" class="quiet" title="Go back over a passage you have read, with a question in mind">Re-read…</button><span class="muted small">${game.read - 1} of ${story.paragraphs.length - 1} paragraphs</span>${note}${rereadForm()}`;
}

// Re-read (docs/reader-layer.md, Q4): go back over paragraphs already read, with a question in mind. Recorded; the
// passage is outlined in the story until the next re-read is closed.
function rereadForm() {
    const r = ui.reread;
    if (!r) return '';
    const raised = model.data.questions.filter((q) => game.questionRaised(q.id));
    const opt = (v, label, cur) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(label)}</option>`;
    return `<div class="note reread-form small">Re-read from paragraph <input id="rr-from" type="number" min="1" max="${game.read - 1}" value="${r.from}">
        to <input id="rr-to" type="number" min="1" max="${game.read - 1}" value="${r.to}">
        with the question <select id="rr-q">${opt('', 'none in particular', r.question)}${raised.map((q) => opt(q.id, game.questionText(q), r.question)).join('')}</select>
        <button id="rr-go">Re-read</button> <button id="rr-close" class="quiet">Close</button>${r.error ? ` <span class="muted">${esc(r.error)}</span>` : ''}</div>`;
}

function scrollStory() {
    const el = $('#story');
    const last = el.querySelector('p.latest');
    if (last) el.scrollTop = last.offsetTop + last.offsetHeight - el.clientHeight + 24;
}

// ---------- tools ----------
function renderTool() { run(renderToolNow); }
function renderToolNow() {
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
    $('#tool').innerHTML = buildingBar() + { card: toolCard, cards: toolCards, questions: toolQuestions, inferences: toolInferences, theories: toolTheories, checks: toolChecks, timeline: toolTimeline, background: toolBackground, record: toolRecord }[ui.tab]();
    const infTab = document.querySelector('.tab[data-tab="inferences"]');
    infTab.hidden = game.autoSolves() && !game.heldInferences().length;
    const left = game.helps('hints') ? game.buildable().length : 0;
    infTab.textContent = `Inferences${left ? ` (${left} to build)` : ''}`;
    const tally = cardTally([...game.unlocked.keys()].filter((k) => !['glosses', 'rules'].includes(model.cards.get(k)?.section) && !game.isSetAside(k)));
    document.querySelector('.tab[data-tab="cards"]').textContent = `Cards${tallyText(tally) ? ` (${tallyText(tally)})` : ''}`;
    // The count waits for nothing: until the clashes are weighed, the last count stands.
    const clashes = game.helps('clashes') ? piece('count:clashes', () => (ui.clashCount = game.clashes().length), ui.clashCount ?? 0) : 0;
    document.querySelector('.tab[data-tab="questions"]').textContent = `Questions${clashes ? ` (${clashes} clash${clashes > 1 ? 'es' : ''})` : ''}`;
    if (ui.focusSlot) {
        document.getElementById(`slot-${ui.focusSlot.replace(/\./g, '-')}`)?.scrollIntoView({ block: 'center' });
        ui.focusSlot = null;
    }
    if (ui.focusWindow) {
        document.getElementById(`win-${ui.focusWindow.replace(/\./g, '-')}`)?.scrollIntoView({ block: 'center' });
        ui.focusWindow = null;
    }
    if (pending.size) setTimeout(fillPieces, 0);
}

function intro() {
    return `<h2>${esc(model.data.case.title)}</h2>
<p class="desc">${esc(model.data.case.teaser)}</p>
<h3 class="section">How to play</h3>
<ul>
<li>Read the story on the left, one paragraph at a time.</li>
<li>Everything the story mentions — people, places, things, events, statements — becomes a card. ${game.collecting() ? 'You collect a card by clicking the words in the story that mention it.' : 'Click the marked words in the story to open a card.'}</li>
<li>Cards have <b>open questions</b>: who did it, where, when, whose is it, is it true. Each question lists its possible answers, like pencil marks in sudoku${game.proposing() ? ' — you list them yourself' : ''}.</li>
<li>${game.autoSolves() ? 'The game works out what your clues allow: each question shows only the answers still possible, and settles itself when one is left. Click a ruled-out answer to see why.' : `${game.opts.crossOut === 'pencil' ? 'Cross answers out as you see fit' : 'Rule answers out: the game checks each against every clue and inference you hold and trust'}${game.helps('greying') ? '; the game greys the ones your clues already rule out' : ''}. Circle the answers you favour.`}</li>
<li>${game.autoSolves() ? 'The game draws the inferences for you; they are listed under Inferences.' : `<b>Inferences</b> are the reasoning that connects clues. Open a clue or background card and press “Infer from this”, then connect further cards; the game tells you when you are onto something${game.opts.kind === 'on' ? ', and you name what the conclusion is about' : ''}. Holmes and the others state some inferences themselves.`}</li>
<li>When one answer is left, or you prove it outright, the question is settled.</li>
<li>${game.background === BG_START ? 'Background facts — what a reader of the time knew — are all in the Background tab from the start.' : game.background === BG_ASK ? 'Background facts — what a reader of the time knew — come when you ask: open a card and ask what you know about it.' : 'Background facts — what a reader of the time knew — appear as the story reaches their subject.'}</li>
</ul>`;
}

function source(it) {
    const who = it.by && game.knows(it.by) ? link(it.by) : it.by ? 'someone' : '';
    const via = { testimony: 'says', admission: 'admits', report: 'reports', document: 'a document', physical: 'the object itself', observation: 'seen', absence: 'what did not happen', inference: 'reasons', narration: 'the narrator' }[it.via] ?? it.via;
    return `${who ? `${who} — ` : ''}${esc(via)}`;
}

function toolCard() {
    const id = ui.selected;
    if (!id || !game.knows(id)) return intro();
    const c = model.cards.get(id);
    const hideFlags = ['placeholder', 'fiction_within_story', 'implied'];
    let h = `<div class="card-head"><span class="kind">${kindOf(id)}</span>${(c.flags ?? []).filter((f) => !hideFlags.includes(f)).map((f) => `<span class="flag">${esc(f.replace(/_/g, ' '))}</span>`).join('')}`;
    if (game.isSuspected(id)) h += '<span class="flag doubted">suspected</span>';
    if (game.noticed.has(id)) h += '<span class="flag odd">marked odd</span>';
    if (game.isSetAside(id)) h += '<span class="flag">set aside</span>';
    if (c.section === 'entities' || c.section === 'events') h += `<h2>${esc(game.nameOf(id))}</h2>`;
    else h += `<p class="desc">${esc(c.text)}</p>`;
    const names = [...new Set(story.spans.slice(0, game.read).flatMap((list, p) => list.filter((sp) => sp.kind === 'entity' && sp.ids.includes(id)).map((sp) => story.paragraphs[p].display.slice(sp.start, sp.end))))]
        // Compared without case or apostrophe style (the story's ’ against a card name's '), so a name is never listed as another name for itself.
        .filter((n, i, all) => same(n) !== same(game.nameOf(id)) && all.findIndex((m) => same(m) === same(n)) === i);
    // A topic is a subject, not a thing in the story: what it covers instead of other names for it.
    if (c.kind === 'topic') h += `<p class="desc topic-summary">A topic: ${esc(c.summary ?? '')}${game.background === BG_ASK ? ' Ask what you know about it.' : ''}</p>`;
    else if (names.length) h += `<div class="small muted">called: ${names.slice(0, 8).map(esc).join(' · ')}</div>`;
    h += '</div>';

    // What is known, in the order the story told it: one section per paragraph, only what is new there.
    const items = game.info(id);
    const groups = [];
    for (const it of items) {
        const last = groups[groups.length - 1];
        if (last && last.para === it.para) last.items.push(it); else groups.push({ para: it.para, items: [it] });
    }
    groups.forEach((g, gi) => {
        const isNew = g.items.some((it) => game.isNew(id, it));
        const title = gi === 0 && c.section !== 'claims' ? (c.kind === 'topic' ? 'Comes up' : 'First mentioned') : 'Then';
        h += `<div class="info ${isNew ? 'fresh' : ''}"><div class="info-head"><span>${title}</span> <span class="link small" data-goto="${g.para}">${paraLabel(g.para)}</span>${isNew ? ' <span class="new-badge">new</span>' : ''}</div>`;
        const bg = g.items.filter((it) => it.kind === 'background').sort((x, y) => (x.term ?? x.text).localeCompare(y.term ?? y.text));
        for (const it of g.items) {
            if (it.kind === 'intro') h += `<p class="desc">${esc(it.text)}</p>`;
            else if (it.kind === 'mention') h += `<p class="quote">${esc(it.text)}</p>`;
            else if (it.kind === 'name') h += `<p>${it.event ? 'Now described as' : 'Now known as'} <b>${esc(it.text)}</b></p><p class="quote">${esc(it.quote.replace(/\s+/g, ' '))}</p>`;
            else if (it.kind === 'note') h += `<p>${esc(it.text)}</p><p class="quote">${esc(it.quote.replace(/\s+/g, ' '))}</p>`;
            else if (it.kind === 'clue') h += `<p>${link(it.claim, it.text)} <span class="small muted">· ${source(it)}</span></p>`;
            else if (it.kind === 'attestation') h += `<p class="small">${source(it)}${it.to && game.knows(it.to) ? ` to ${link(it.to)}` : ''}</p><p class="quote">${esc(it.quote.replace(/\s+/g, ' '))}</p>`;
        }
        // Glossary notes explain a word the story uses (always shown); background facts are what the player
        // knows or recalls (by the Background setting). Two headings, so it is clear which is which.
        const words = bg.filter((n) => n.term);
        const facts = bg.filter((n) => !n.term);
        if (words.length) {
            h += '<div class="bg"><div class="small muted">Words</div>';
            for (const n of words) h += `<div class="bg-note"><b>${esc(n.term)}.</b> ${esc(n.text)}</div>`;
            h += '</div>';
        }
        // A background fact's exceptions (workstream 3) follow it; one whose own line comes later shows there, with
        // the fact it belongs to.
        const unless = g.items.filter((it) => it.kind === 'exception');
        const later = unless.filter((x) => !facts.some((n) => n.card === x.card));
        if (facts.length || later.length) {
            h += '<div class="bg"><div class="small muted">Background</div>';
            for (const n of facts) {
                h += `<div class="bg-note">${esc(n.text)}${suppliedNote(n.card)}</div>`;
                for (const x of unless.filter((u) => u.card === n.card)) h += `<div class="bg-note unless">Unless ${esc(x.text)}.</div>`;
            }
            for (const x of later) h += `<div class="bg-note unless">${esc(shortName(x.card, 60))}: unless ${esc(x.text)}.</div>`;
            h += '</div>';
        }
        h += '</div>';
    });
    if (['claims', 'rules'].includes(c.section) && !game.autoSolves()) h += inferButton(id);
    // Scenery: set it aside (it leaves your lists and costs nothing), or put it back.
    if (['entities', 'events', 'claims'].includes(c.section)) h += `<p class="small"><button class="quiet" data-${game.isSetAside(id) ? 'putback' : 'setaside'}="${id}" title="${game.isSetAside(id) ? 'Back among your cards' : 'Out of your lists as scenery; you still hold it, and you can put it back'}">${game.isSetAside(id) ? 'Put back' : 'Set aside'}</button></p>`;
    if (c.section === 'inferences') {
        const how = game.howHeld(id);
        h += `<p class="small muted">${how?.how === 'built' ? 'You built this inference' : how?.how === 'stated' ? `${esc(cardName(how.by))} drew this inference` : how?.how === 'implicit' ? 'Follows from what you hold' : 'Worked out for you'} · ${paraLabel(game.unlocked.get(id).para)}</p>`;
        h += `<div class="small">Rests on: ${model.cards.get(id).premises.map((x) => (game.knows(x) ? link(x, shortName(x, 60)) : '<span class="muted">something you do not know yet</span>')).join(' · ')}</div>`;
    }
    if (c.section === 'claims' || c.section === 'inferences') {
        if (c.section === 'inferences') h += `<p class="means"><span class="small muted">What it means for the case:</span> ${esc(readingOf(c.formula))}</p>`;
        if (game.canSuspect(id)) h += weighHtml(id);
        if (c.section === 'inferences') h += unlessHtml(id);
        const form = model.claimForms.get(id);
        const f = c.section === 'claims' && form && model.constraints.get(form.trusted)?.formula;
        if (f) h += `<p class="means"><span class="small muted">What it means for the case:</span> ${esc(readingOf(f))}</p>`;
        const about = (c.about ?? []).filter((x) => game.knows(x));
        if (about.length) h += `<p class="small">About: ${about.map((x) => link(x)).join(', ')}</p>`;
    }

    // Readings (workstream 6, docs/hypotheses.md Q6): what this card means under each story, by the answers that carry it.
    const readings = game.autoSolves() ? [] : game.readingsOf(id).filter((r) => r.mine !== null || r.layers.length);
    if (readings.length) {
        h += '<div class="readings small"><div class="muted">How it reads under each story</div>';
        for (const r of readings) {
            const q = slotQuestion(r.slot);
            const rows = [...(r.mine !== null ? [['your answer', r.mine]] : []), ...r.layers.map((l) => [layerName(l.layer), l.value])];
            h += `<div>${q} ${rows.map(([who, v]) => `<span class="reading">${esc(who)}: <b>${esc(valueName(r.slot, v))}</b></span>`).join(' · ')}</div>`;
        }
        h += '</div>';
    }
    // Noticing (workstream 5): mark a clue, a thing or an event as odd, against what one would expect (events: Round 98). Nothing is told back.
    if (['claims', 'entities', 'events'].includes(c.section) && !game.autoSolves()) {
        const n = game.noticed.get(id);
        if (n) h += `<p class="small notice on">You marked this as odd at ${paraLabel(n.para)}${n.because ? `, against: ${link(n.because, shortName(n.because, 70))}` : ''}. <span class="link" data-unnotice="${esc(id)}">Not odd after all</span></p>`;
        else {
            const rules = [...game.unlocked.keys()].filter((x) => model.cards.get(x)?.section === 'rules' && inHand(x));
            h += `<p class="small notice">Does something here go against what you would expect? <select id="notice-because"><option value="">because… (optional)</option>${rules.map((x) => `<option value="${esc(x)}">${esc(shortName(x, 60))}</option>`).join('')}</select> <button data-notice="${esc(id)}" class="quiet">That's odd</button></p>`;
        }
    }
    if (game.canAsk(id)) {
        h += game.hasAsked(id)
            ? `<p class="small muted">${(game.rulesOn.get(id) ?? []).some((r) => game.knows(r)) ? 'You have recalled what you know about this (under Background above); more will come to mind as the story goes on.' : 'You asked: nothing in particular comes to mind yet.'}</p>`
            : `<p><button data-ask="${id}">What do I know about this?</button></p>`;
    }
    const u = game.unlocked.get(id);
    h += `<p class="small muted">You collected this card at ${paraLabel(u.para)} (card ${u.at + 1}).${c.section === 'events' && model.slots.has(`${id}.time`) && game.settled(`${id}.time`) ? ` It happened: ${esc(cardName(game.settled(`${id}.time`)))}.` : ''}</p>`;

    h += cardTimelineHtml(id);

    const slots = game.slotsOn(id);
    if (slots.length) {
        h += `<h3 class="section">Open questions (${slots.filter((s) => game.settled(s.id) === null).length} of ${slots.length})</h3>`;
        for (const s of slots) h += renderSlot(s);
    }

    if (c.section === 'entities') {
        const placed = game.visibleSlots().filter((s) => s.on !== id && game.settled(s.id) === id);
        const maybe = game.visibleSlots().filter((s) => s.on !== id && game.settled(s.id) === null && (() => {
            const p = game.pencil(s.id);
            return p.includes(id) && (game.proposing() || p.length <= 8);
        })());
        if (placed.length || maybe.length) {
            h += '<h3 class="section">Where it fits</h3><ul class="list">';
            for (const s of placed) h += `<li class="good">✓ ${link(s.on)} — ${esc(game.promptOf(s.id))}</li>`;
            for (const s of maybe) h += `<li>? ${link(s.on)} — ${esc(game.promptOf(s.id))} <span class="small muted">(${game.pencil(s.id).length} candidates)</span></li>`;
            h += '</ul>';
        }
    }
    return h;
}

function renderSlot(s) {
    const settled = game.settled(s.id);
    const given = game.given(s.id);
    const m = game.marks.get(s.id);
    const struck = m ? [...m.struck] : [];
    let chips = [];
    let ruledCount = 0;
    if (settled !== null) {
        chips.push(`<span class="chip proven" data-slot="${s.id}" data-val="${esc(settled)}">${esc(valueName(s.id, settled))}</span>`);
        if (game.autoSolves()) chips.push(`<span class="small muted">${game.autoPace === 'holmes' ? 'settled by the story' : 'worked out from your clues'}</span>`);
        else if (given && game.provenValue(s.id) === null) chips.push(`<span class="small muted">given by ${link(given.claim, shortName(given.claim, 60))} · <span class="link" data-suspect="${given.claim}">doubt it</span></span>`);
        for (const k of game.givenClash(s.id)) chips.push(`<span class="small bad">but ${link(k, shortName(k, 60))}, which you trust, says ${esc(valueName(s.id, game.given(s.id)?.value ?? ''))} · <span class="link" data-suspect="${k}">doubt it</span></span>`);
    } else {
        const pencil = game.pencil(s.id);
        let live = pencil;
        let ruled = [];
        if (game.autoSolves()) {
            // The pencil is already what the clues allow; show the rest as ruled out, with a "why" on each.
            ruled = s.domain.filter((v) => !live.includes(v) && game.offered(s.id, v));
            ruledCount = ruled.length;
        } else if (game.helps('greying')) {
            if (!cache.has(s.id)) cache.set(s.id, game.openValues(s.id));
            const open = cache.get(s.id);
            live = pencil.filter((v) => open.includes(v));
            ruled = pencil.filter((v) => !open.includes(v));
            ruledCount = ruled.length;
        }
        live = [...live.filter((v) => game.isCircled(s.id, v)), ...live.filter((v) => !game.isCircled(s.id, v))];
        const shown = ui.expanded.has(s.id) ? live : live.slice(0, CHIP_LIMIT);
        chips = shown.map((v) => chip(s.id, v, ''));
        if (live.length > shown.length) chips.push(`<span class="link more" data-expand="${s.id}">+ ${live.length - shown.length} more</span>`);
        if (ruled.length) {
            // A circled answer the clues rule out stays in view: the player should see their pick has gone.
            const circledRuled = ruled.filter((v) => game.isCircled(s.id, v));
            if (ui.expanded.has(`${s.id}|ruled`)) chips.push(...[...circledRuled, ...ruled.filter((v) => !circledRuled.includes(v))].map((v) => chip(s.id, v, 'ruled')));
            else {
                chips.push(...circledRuled.map((v) => chip(s.id, v, 'ruled')));
                const rest = ruled.length - circledRuled.length;
                if (rest) chips.push(`<span class="link more" data-expand="${s.id}|ruled">${circledRuled.length ? `${rest} more` : rest} your clues already rule out — show</span>`);
            }
        }
    }
    const standing = struck.filter(([v]) => v !== settled && !game.strikeLapsed(s.id, v));
    const crossedChips = standing.filter(([, p]) => !p.cited).map(([v]) => chip(s.id, v, 'struck'));
    const ruledOutChips = standing.filter(([, p]) => p.cited).map(([v]) => chip(s.id, v, 'proved'));
    const lapsed = [...struck.filter(([v]) => game.strikeLapsed(s.id, v)).map(([, p]) => p.used), ...(game.proofLapsed(s.id) ? [m.proven.used] : [])];
    let state;
    if (settled !== null) state = given ? 'given' : 'settled';
    else if (game.proposing()) state = `${game.pencil(s.id).length} proposed`;
    else if (game.autoSolves()) state = `${game.pencil(s.id).length} possible${game.moreToCome(s.id) ? ' so far' : ''}`;
    else state = `${countLeft(s.id)}${ruledCount ? `, ${ruledCount} ruled out by your clues` : ''}`;
    let h = `<div class="slot ${settled !== null ? 'settled' : ''}" id="slot-${s.id.replace(/\./g, '-')}"><div class="slot-head"><b>${esc(game.promptOf(s.id))}</b><span class="state">${state}</span></div>`;
    h += `<div class="chips">${chips.join('') || '<span class="empty">no candidates yet</span>'}</div>`;
    if (game.proposing() && settled === null) {
        const options = s.domain.filter((v) => game.offered(s.id, v));
        h += `<div class="chips"><input list="dl-${s.id}" data-add="${s.id}" placeholder="+ propose an answer" size="26"><datalist id="dl-${s.id}">${options.map((v) => `<option value="${esc(valueName(s.id, v))}">`).join('')}</datalist></div>`;
    }
    if (crossedChips.length) h += `<div class="chips small"><span class="muted">crossed out:</span>${crossedChips.join('')}</div>`;
    if (ruledOutChips.length) h += `<div class="chips small"><span class="muted">ruled out, with evidence:</span>${ruledOutChips.join('')}</div>`;
    if (lapsed.length) {
        const why = [...new Set(lapsed.flatMap((u) => game.lapsedBy(u)))];
        h += `<div class="small bad">${lapsed.length === 1 ? 'A proof here' : `${lapsed.length} proofs here`} rested on ${why.map((k) => link(k, shortName(k, 50))).join(', ')}, which you now doubt.</div>`;
    }
    if (game.helps('greying') && settled === null && cache.get(s.id)?.length === 0) {
        // No value at all fits, met or not: the trusted clues contradict each other.
        h += `<div class="small bad">Nothing could fit, not even an answer the story has yet to bring up: some of the clues you trust contradict each other, so one of them must be false. <span class="link" data-clash="${s.id}">Find the clash</span></div>`;
        if (ui.clash?.slot === s.id) h += `<div class="why">${ui.clash.html}</div>`;
    } else if (game.helps('greying') && settled === null && (game.pencil(s.id).length || !game.moreToCome(s.id)) && !game.pencil(s.id).some((v) => cache.get(s.id)?.includes(v))) {
        // Something fits, but not among the answers on offer yet.
        h += `<div class="small muted">${game.moreToCome(s.id) ? 'None of the answers met so far fits your clues. The answer may be one the story has not brought up yet.' : 'Every answer has been ruled out.'}</div>`;
    }
    if (ui.menu?.slot === s.id) h += slotMenu(s, ui.menu.value);
    return `${h}</div>`;
}

/** "3 left", or "3 so far" while the story may still bring answers not yet on offer (a time, a person). */
function countLeft(slot) {
    return `${game.pencil(slot).length} ${game.moreToCome(slot) ? 'so far' : 'left'}`;
}

function chip(slot, v, cls) {
    const picked = ui.menu?.slot === slot && ui.menu?.value === v ? ' picked' : '';
    const circled = !game.autoSolves() && game.isCircled(slot, v) ? ' circled' : '';
    const dropped = !game.autoSolves() && game.dropOf({ slot, value: v }) ? ' dropped' : '';
    return `<span class="chip ${cls}${circled}${dropped}${picked}" data-slot="${slot}" data-val="${esc(v)}">${esc(valueName(slot, v))}${cls === 'proved' ? ' <span class="x">✓</span>' : ''}</span>`;
}

function slotMenu(s, v) {
    const m = game.marks.get(s.id);
    const st = m?.struck.get(v);
    const isProven = game.provenValue(s.id) === v;
    const isGiven = !!game.given(s.id);
    const b = [];
    if (game.autoSolves()) {
        // The game does the deducing: offer the reasons, nothing to do.
        if (game.settled(s.id) === v) b.push(`<span class="small muted">${game.autoPace === 'holmes' ? 'Settled by the story.' : 'Worked out from your clues.'}</span> <button data-op="why" class="quiet">Why?</button>`);
        else if (!game.pencil(s.id).includes(v)) b.push('<button data-op="whynot" class="quiet">Why not?</button>');
        else b.push('<span class="small muted">Still possible.</span>');
        if (model.cards.has(v) && game.knows(v)) b.push(`<button data-op="open" class="quiet">Open ${esc(shortName(v, 30))}</button>`);
        return `<div class="menu" data-menu-slot="${s.id}" data-menu-val="${esc(v)}"><b>${esc(valueName(s.id, v))}</b>${b.join('')}${ui.menuNote ? `<div class="why">${ui.menuNote}</div>` : ''}</div>`;
    }
    if (isGiven && !isProven) b.push(`<span class="small muted">Given by a clue you trust.</span> <button data-suspect="${game.given(s.id).claim}" class="quiet">Doubt that clue</button>`);
    else if (isProven) b.push('<button data-op="unprove">Undo the proof</button>');
    else if (st && !game.strikeLapsed(s.id, v)) b.push('<button data-op="unstrike">Restore</button>');
    else {
        b.push(game.isCircled(s.id, v) ? '<button data-op="uncircle">Uncircle</button>' : '<button data-op="circle">Circle</button>');
        if (game.opts.crossOut === 'pencil') b.push('<button data-op="strike">Cross out</button>');
        else b.push('<button data-op="rule" title="Checked against every clue and inference you hold and trust">Rule it out</button>');
        b.push('<button data-op="prove" title="Checked against every clue and inference you hold and trust">Prove it\'s this</button>');
        if (game.helps('greying')) b.push('<button data-op="fit" class="quiet">Could it fit?</button>');
        if (game.proposing()) b.push('<button data-op="unpropose" class="quiet">Take back</button>');
    }
    const mine = game.theories.find((t) => t.id === ui.theory);
    if (mine && !isGiven) b.push(`<button data-op="theory" class="quiet">Add to “${esc(mine.label)}”</button>`);
    if (model.cards.has(v) && game.knows(v)) b.push(`<button data-op="open" class="quiet">Open ${esc(shortName(v, 30))}</button>`);
    // Dropping a candidate for a reason that is not a proof (docs/hypotheses.md, Q5).
    const key = `c|${s.id}|${v}`;
    if (!isGiven && !isProven && !game.dropOf({ slot: s.id, value: v })) b.push(`<button class="quiet" data-drop-open="${esc(key)}">Drop it…</button>`);
    const drop = game.dropOf({ slot: s.id, value: v }) ? dropHtml(key) : ui.dropping === key ? dropForm(key) : '';
    return `<div class="menu" data-menu-slot="${s.id}" data-menu-val="${esc(v)}"><b>${esc(valueName(s.id, v))}</b>${b.join('')}${drop}${ui.menuNote ? `<div class="why">${ui.menuNote}</div>` : ''}</div>`;
}

// ---------- dropping a hypothesis (docs/hypotheses.md, Q5) ----------
const DROP_LABELS = {
    'out-explained': 'another theory explains more',
    'more-hands': 'it needs more people than another theory',
    cost: 'it needs too much of what I trust to be wrong',
    card: 'the card I have open tells against it',
};
/** A theory's short name, as a story to read cards under. */
function layerName(id) {
    const t = game.visibleTheories().find((x) => x.id === id);
    if (!t) return id;
    return t.story ? t.label.split(':')[0] : `your “${shortName(t.label, 30)}”`;
}
/** The REVISE moment: the old cards that an answer re-reads (Game.revisedBy). */
function revisedNote(slot) {
    const cards = game.revisedBy(slot);
    return cards.length ? ` It changes how you read: ${cards.map((x) => link(x, shortName(x, 40))).join(' · ')}.` : '';
}
/** A drop target from its key: t|theory or c|slot|value. */
function dropTarget(key) {
    const [kind, a, b] = key.split('|');
    return kind === 't' ? { theory: a } : { slot: a, value: b };
}
function dropForm(key) {
    const target = dropTarget(key);
    const rivals = game.visibleTheories().filter((t) => t.id !== target.theory);
    const card = ui.selected && game.knows(ui.selected) ? ui.selected : null;
    return `<div class="small drop-form">Why drop it? <select id="drop-reason">${DROP_REASONS.map((r) => `<option value="${r}">${esc(DROP_LABELS[r])}</option>`).join('')}</select>`
        + (rivals.length ? ` Than: <select id="drop-rival">${rivals.map((t) => `<option value="${esc(t.id)}">${esc(shortName(t.label, 50))}</option>`).join('')}</select>` : '')
        + `${card ? ` <span class="muted">(the card open: ${esc(shortName(card, 40))})</span>` : ''} <button data-drop-go="${esc(key)}">Drop</button> <span class="link" data-drop-cancel="1">cancel</span></div>`;
}
/** A dropped hypothesis: the reason, on Easy the game's check of it, and a way back. */
function dropHtml(key) {
    const target = dropTarget(key);
    const d = game.dropOf(target);
    const rival = d.rival ? game.visibleTheories().find((t) => t.id === d.rival) : null;
    let h = `<div class="small dropped-note">Dropped: ${esc(DROP_LABELS[d.reason])}${rival ? ` (${esc(shortName(rival.label, 50))})` : ''}${d.cites?.length ? ` (${d.cites.map((c) => link(c, shortName(c, 40))).join(', ')})` : ''}.`;
    if (weighMode() === 'counts') {
        const c = game.dropCheck(target);
        h += ` <span class="${c.ok ? 'good' : 'muted'}">${c.ok ? 'The game finds it so.' : 'The game does not find it so.'}</span>`;
    } else if (weighMode() === 'names') {
        const c = game.dropCheck(target);
        const names = (ids) => ids.map((x) => esc(cardName(x))).join(', ') || 'nobody';
        const says = c.gone ? 'The theory it was weighed against is gone.'
            : d.reason === 'out-explained' ? (c.ok ? `The other leaves ${c.rivalResidue.length} odd things unexplained; this one ${c.residue.length}, those among them.` : `The other does not explain everything this one does (it leaves ${c.rivalResidue.length}, this one ${c.residue.length}).`)
                : d.reason === 'more-hands' ? (c.ok ? `It needs ${names(c.hands)}; the other only ${names(c.rivalHands)}.` : `It needs ${names(c.hands)}, no more than the other (${names(c.rivalHands)}).`)
                    : d.reason === 'cost' ? (c.ok ? `It needs ${c.cost.items.length} thing${c.cost.items.length === 1 ? '' : 's'} you trust to be wrong.` : 'It needs nothing you trust to be wrong.')
                        : c.ok ? 'The card tells against it.' : 'The card does not tell against it on its own.';
        h += ` <span class="${c.ok ? 'good' : 'muted'}">${says}</span>`;
    }
    return `${h} <span class="link" data-undrop="${esc(key)}">take it back</span></div>`;
}



/** New = never opened; updated = opened, and something has been added since. */
function cardTally(ids) {
    let fresh = 0;
    let updated = 0;
    for (const id of ids) {
        if (!game.lastSeen.has(id)) fresh++;
        else if (game.hasNew(id)) updated++;
    }
    return { fresh, updated };
}
const tallyText = ({ fresh, updated }) => [fresh && `${fresh} new`, updated && `${updated} updated`].filter(Boolean).join(', ');

/**
 * Weighing a clue (workstream 4): trust it or doubt it; for a statement, say how (mistaken: believed and false;
 * lying: not believed), and along a reporting chain whose; why (recorded); split it into what was seen and what
 * concluded; trace who passed it on.
 */
const DOUBT_REASONS = { 'could-not-see': 'could not have seen it', 'inference-as-fact': 'an inference written as fact', hearsay: 'hearsay', neutral: 'it cuts both ways' };
function weighHtml(id) {
    let h = '';
    const chain = game.chainOf(id);
    if (chain.length) h += `<p class="small chain">Passed on: ${chain.map((l) => (game.knows(l.by) ? link(l.by, shortName(l.by, 24)) : esc(cardName(l.by)))).join(' → ')}${chain[chain.length - 1].to ? '' : ' → the story'}</p>`;
    const kindName = (k) => {
        const [kind, who] = k.split(':');
        const name = who ? (game.knows(who) ? shortName(who, 24) : cardName(who)) : 'the speaker';
        return kind === 'lying' ? `${name} lied` : `${name} was mistaken`;
    };
    const defeat = game.raisedOn(id).find((r) => r.status === 'established');
    if (defeat) {
        // A defeat (workstream 3): the step no longer counts, for the reason shown; its conclusion is not shown false.
        h += `<p class="doubt on">This step no longer counts: you have shown that ${esc(defeat.text)}. That does not make its conclusion false; “Does it hold?” is open below. <button data-withdraw="${esc(`${id}|${defeat.n}|${defeat.exception}`)}" class="quiet">Count it again</button></p>`;
    } else if (game.isSuspected(id)) {
        const kind = game.doubtKind.get(id);
        h += `<p class="doubt on">You suspect this may be false${kind ? `: ${esc(kindName(kind))}` : ''}. It counts as fact nowhere${kind ? ', and what the speaker believed counts as you say' : ', and “Is it true?” is open below'}. <button data-unsuspect="${id}" class="quiet">Trust it again</button></p>`;
        const kinds = game.doubtKinds(id).filter((k) => k !== kind);
        if (kinds.length) h += `<p class="small doubt">Say how: ${kinds.map((k) => `<span class="link" data-suspect="${esc(id)}" data-kind="${esc(k)}">${esc(kindName(k))}</span>`).join(' · ')}</p>`;
        if (game.doubtReason) {
            const r = game.doubtReason.get(id) ?? '';
            h += `<p class="small doubt">Why: <select id="doubt-reason" data-reason-for="${esc(id)}"><option value="">(say why, if you like)</option>${Object.entries(DOUBT_REASONS).map(([v, l]) => `<option value="${v}"${v === r ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></p>`;
        }
    } else {
        const kinds = game.doubtKinds(id);
        h += `<p class="doubt">Until you doubt it, the game takes this at its word. <button data-suspect="${id}">I suspect this may be false</button>${kinds.length ? ` <span class="small">or: ${kinds.map((k) => `<span class="link" data-suspect="${esc(id)}" data-kind="${esc(k)}">${esc(kindName(k))}</span>`).join(' · ')}</span>` : ''}</p>`;
    }
    if (game.partsOf(id).length) {
        h += game.splitClaims.has(id)
            ? `<p class="small muted">You split this statement: ${game.partsOf(id).filter((x) => game.knows(x)).map((x) => link(x, shortName(x, 50))).join(' · ')}. It counts nowhere itself.</p>`
            : `<p class="small">Does this mix what was seen with what was concluded? <button data-split-claim="${esc(id)}" class="quiet">Split this statement</button></p>`;
    }
    return h;
}

// The exceptions of the defaults a step applies (workstream 3): raise one against it; what was raised, where it stands.
function unlessHtml(id) {
    const open = game.exceptionsOf(id);
    const raised = game.raisedOn(id);
    if (!open.length && !raised.length) return '';
    const word = { open: 'a reservation: the step still counts', established: 'shown: the step no longer counts', 'ruled-out': 'since ruled out by what you hold' };
    let h = '';
    for (const r of raised.filter((x) => x.status !== 'established')) h += `<p class="small">Unless ${esc(r.text)} — ${esc(word[r.now] ?? r.now)}${r.now !== r.status && r.status !== 'established' ? ` (raised as ${esc(r.status === 'open' ? 'a reservation' : r.status)})` : ''}. <span class="link" data-withdraw="${esc(`${id}|${r.n}|${r.exception}`)}">take it back</span></p>`;
    const left = open.filter((x) => !raised.some((r) => r.n === x.n && r.exception === x.id));
    if (left.length) h += `<p class="small">This step leans on a general rule. Could it fail here? ${left.map((x) => `<span class="link" data-raise="${esc(`${id}|${x.n}|${x.id}`)}">unless ${esc(x.text)}</span>`).join(' · ')}</p>`;
    if (game.restingOnDefeated(id)) h += '<p class="small bad">It rests on a step you have shown does not hold.</p>';
    return h ? `<div class="unless"><div class="small muted">Unless…</div>${h}</div>` : '';
}

function toolCards() {
    const known = [...game.unlocked.keys()].filter((id) => !['glosses', 'rules'].includes(model.cards.get(id)?.section) && !game.isSetAside(id));
    const counts = {};
    const members = {};
    for (const id of known) {
        const c = model.cards.get(id);
        const k = c.section === 'entities' ? c.kind : c.section;
        counts[k] = (counts[k] ?? 0) + 1;
        (members[k] ??= []).push(id);
    }
    const badge = (ids) => { const t = tallyText(cardTally(ids)); return t ? ` <span class="tally">· ${t}</span>` : ''; };
    let h = `<input type="search" id="card-search" placeholder="Search your cards…" value="${esc(ui.search)}">`;
    h += `<div class="filters"><button data-kind="" class="${ui.kind ? '' : 'on'}">All ${known.length}${badge(known)}</button><button data-kind="unread" class="${ui.kind === 'unread' ? 'on' : ''}">New ${cardTally(known).fresh}</button><button data-kind="new" class="${ui.kind === 'new' ? 'on' : ''}">Updated ${cardTally(known).updated}</button>${KIND_GROUPS.filter(([k]) => counts[k]).map(([k, label]) => `<button data-kind="${k}" class="${ui.kind === k ? 'on' : ''}">${label} ${counts[k]}${badge(members[k])}</button>`).join('')}</div>`;
    const q = ui.search.toLowerCase();
    const shown = known.filter((id) => {
        const c = model.cards.get(id);
        const k = c.section === 'entities' ? c.kind : c.section;
        return (!ui.kind || k === ui.kind || (ui.kind === 'new' && game.lastSeen.has(id) && game.hasNew(id)) || (ui.kind === 'unread' && !game.lastSeen.has(id))) && (!q || cardName(id).toLowerCase().includes(q));
    });
    h += shown.length ? `<ul class="list">${shown.map((id) => {
        const open = game.slotsOn(id).filter((s) => game.settled(s.id) === null).length;
        return `<li class="${ui.selected === id ? 'sel' : ''}"><span class="kind">${kindOf(id)}</span>${link(id, shortName(id, 90))}${!game.lastSeen.has(id) ? ' <span class="new-badge quiet">new</span>' : game.hasNew(id) ? ' <span class="new-badge">updated</span>' : ''}${open ? ` <span class="small muted">· ${open} open</span>` : ''}</li>`;
    }).join('')}</ul>` : `<p class="empty">${game.collecting() ? 'No cards yet. Click the words in the story that mention someone or something.' : 'No cards yet. Start reading.'}</p>`;
    const aside = game.setAsideCards();
    if (aside.length) h += `<details class="set-aside"><summary class="small muted">Set aside (${aside.length})</summary><ul class="list">${aside.map((id) => `<li><span class="kind">${kindOf(id)}</span>${link(id, shortName(id, 90))} <button class="quiet small" data-putback="${id}">Put back</button></li>`).join('')}</ul></details>`;
    return h;
}

// A background fact this reader lacks is supplied by the game (docs/reader-layer.md, Q1): who would have known it,
// and, once the story has said so, where it does.
function suppliedNote(ruleId) {
    // A period prejudice the story voices (flag `stereotype`): shown as the period's, not the game's (Q1, bk.gypsies).
    const period = (model.cards.get(ruleId)?.flags ?? []).includes('stereotype') ? ' <span class="small muted period">· A belief of the period: presented, not endorsed.</span>' : '';
    const d = game.disclosure(ruleId);
    if (!d?.supplied) return period;
    const mark = (model.data.background ?? []).find((b) => b.id === d.lacks)?.reader_1892 ?? '';
    const who = /^racing/.test(mark) ? 'a racing man of 1892 would know this' : /^specialist/.test(mark) ? 'a specialist would know this' : 'a reader of 1892 would know this';
    const told = d.told !== null && d.told < game.read ? `; the story says so at ${paraLabel(d.told)}` : '';
    return ` <span class="small muted supplied">· Supplied: ${who}${told}.</span>`;
}

function toolBackground() {
    const facts = [...game.unlocked.keys()].filter((k) => model.cards.get(k).section === 'rules');
    const how = game.background === BG_ASK ? 'You recall a fact when you ask about a card it concerns.' : game.background === BG_START ? 'Everything a reader of the time knew, from the start.' : 'Each fact appears where the story first touches its subject.';
    if (!facts.length) return `<p class="empty">No background facts yet. ${how}</p>`;
    // Grouped under the topic (or card) each sits on; a fact on several cards is listed once, under the first held.
    const groups = new Map();
    for (const r of facts) {
        const on = model.cards.get(r).attaches_to.find((c) => model.cards.get(c)?.kind === 'topic' || c === 'moor') ?? model.cards.get(r).attaches_to[0];
        if (!groups.has(on)) groups.set(on, []);
        groups.get(on).push(r);
    }
    let h = `<p class="small muted">${how} Some of these matter to the case; most do not.</p>`;
    for (const [on, list] of groups) {
        // Never name a card the story has not reached: a topic heading is fine, anything else waits.
        const heading = game.knows(on) ? link(on) : model.cards.get(on)?.kind === 'topic' ? esc(game.nameOf(on)) : 'Other';
        h += `<h3 class="section">${heading}</h3><ul class="list">`;
        // By text, not id: ids would sort the filler apart from the facts that matter.
        for (const r of list.sort((a, b) => model.cards.get(a).text.localeCompare(model.cards.get(b).text))) h += `<li>${esc(model.cards.get(r).text)}${suppliedNote(r)}</li>`;
        h += '</ul>';
    }
    return h;
}

function toolQuestions() {
    const raised = model.data.questions.filter((q) => game.questionRaised(q.id));
    const doubts = [...game.suspected].filter((c) => game.knows(c));
    let d = '';
    if (doubts.length) {
        d = '<h3 class="section">Statements you doubt</h3><ul class="list">';
        for (const c of doubts) {
            const v = game.settled(`${c}.truth`);
            d += `<li class="q"><span>${link(c, shortName(c, 90))}</span><span class="state ${v !== null ? 'done' : ''}">${v === 'true' ? 'true after all' : v === 'false' ? 'false' : 'open'}</span></li>`;
        }
        d += '</ul>';
    }
    d += oddThingsHtml();
    d += signalsHtml();
    d += heldBackHtml();
    const c = game.helps('clashes') ? clashesHtml() : '';
    if (!raised.length) return `${c}<p class="empty">The story has not raised any questions yet.</p>${d}`;
    let h = `${c}<p class="small muted">The questions the case turns on, as the story raises them.</p><ul class="list">`;
    for (const q of raised) {
        const slot = model.slots.get(q.slot);
        const visible = game.knows(slot.on);
        const settled = game.settled(q.slot);
        const state = !visible ? (game.collecting() ? 'collect the card first' : '') : settled !== null ? esc(valueName(q.slot, settled)) : game.proposing() ? `${game.pencil(q.slot).length} proposed` : game.autoSolves() ? `${game.pencil(q.slot).length} possible${game.moreToCome(q.slot) ? ' so far' : ''}` : countLeft(q.slot);
        const picks = visible && settled === null && !game.autoSolves() ? game.pencil(q.slot).filter((v) => game.isCircled(q.slot, v)) : [];
        h += `<li class="q"><span>${visible ? `<span class="link" data-slot-open="${q.slot}">${esc(game.questionText(q))}</span>` : esc(game.questionText(q))}</span><span class="state ${settled !== null ? 'done' : ''}">${state}${picks.length ? ` · circled: ${picks.map((v) => esc(valueName(q.slot, v))).join(', ')}` : ''}</span></li>`;
    }
    return `${h}</ul>${d}`;
}

/** The details the player marked as odd, and the absences they filed (workstream 5). */
function oddThingsHtml() {
    const noticed = [...game.noticed].filter(([id]) => game.knows(id));
    const filed = game.filed.filter((f) => game.knows(f.id));
    if (!noticed.length && !filed.length) return '';
    let h = '<h3 class="section">Odd things</h3><ul class="list">';
    for (const [id, n] of noticed) h += `<li>${link(id, shortName(id, 80))} <span class="small muted">· ${paraLabel(n.para)}${n.because ? ` · against ${esc(shortName(n.because, 50))}` : ''}</span> <span class="link small" data-unnotice="${esc(id)}">not odd</span></li>`;
    for (const f of filed) h += `<li>${link(f.id, shortName(f.id, 80))} <span class="small muted">· what did not happen, filed at ${paraLabel(f.para)}</span></li>`;
    return `${h}</ul>`;
}

// The story's own signals (hints 'story'; docs/reader-layer.md, Q3–Q4): what Holmes visibly attends to, quoted with
// the cards it mentions and never interpreted, and the passages the story points back to.
function signalsHtml() {
    if (!game.showsSignals()) return '';
    const list = game.storySignals().reverse();
    if (!list.length) return '';
    let h = '<h3 class="section">Holmes\'s interest</h3><p class="small muted">Where the story shows what Holmes attends to. It points; it proves nothing.</p><ul class="list">';
    for (const x of list) {
        h += x.kind === 'reread'
            ? `<li><span class="small muted">${paraLabel(x.para)} ·</span> The story points back: <span class="link" data-reread-prompt="${x.passage.join('-')}">re-read paragraphs ${x.passage[0]}–${x.passage[1]}</span>.</li>`
            : `<li><span class="small muted">${paraLabel(x.para)} ·</span> <span class="quote-inline">“${esc(x.quote)}”</span>${x.cards.length ? ` <span class="small">· ${x.cards.map((c) => link(c, shortName(c, 40))).join(', ')}</span>` : ''}</li>`;
    }
    return `${h}</ul>`;
}

// What the story held back (docs/reader-layer.md, Q2), as far as read: facts told late, background the game supplied,
// results told late, and at the end what was never told.
function heldBackHtml() {
    const list = game.heldBack();
    if (!list.length) return '';
    const label = (id) => (id.startsWith('ck.') ? model.data.actions.find((a) => a.id === model.data.checks.find((c) => c.id === id)?.action)?.label ?? id : null);
    let h = '<h3 class="section">What the story held back</h3><ul class="list small">';
    for (const x of list) {
        const name = label(x.id);
        if (name) h += `<li>${esc(name)} — ${x.kind === 'late' ? `the result is told only at ${paraLabel(x.told)}` : 'the story never says what came of it'}.</li>`;
        else if (x.kind === 'supplied') h += `<li>${esc(model.cards.get(x.id).text)} — supplied by the game; ${x.told === null ? 'the story never says so' : `the story says so at ${paraLabel(x.told)}`}.</li>`;
        else if (x.kind === 'late') h += `<li>${link(x.id, shortName(x.id, 80))} — due at ${paraLabel(x.due)}; the story tells it only at ${paraLabel(x.told)}.</li>`;
        else h += `<li>${link(x.id, shortName(x.id, 80))} — the story never tells it${x.policy === 'inferred' ? '; it can only be inferred' : ''}.</li>`;
    }
    return `${h}</ul>`;
}

/** Easy: the clashes among the clues the player trusts, each as a chain, and the ones a doubt has resolved. */
function clashesHtml() {
    const list = game.clashes();
    const resolved = game.resolvedClashes();
    if (!list.length && !resolved.length) return '';
    let h = `<h3 class="section" id="clashes">Clashes${list.length ? ` (${list.length})` : ''}</h3>`;
    if (list.length) {
        h += '<p class="small muted">Clues you trust that cannot all be true. Until you doubt one, the game sets aside what weighs least in each clash when it checks answers, so a clash here does not rule out answers elsewhere.</p>';
        list.forEach((cl, i) => { h += `<div class="clash"><b>Clash ${i + 1}</b>${clashHtml(cl.ids, cl)}</div>`; });
    }
    if (resolved.length) {
        h += `<details class="resolved"><summary class="small">${resolved.length} resolved by a doubt</summary><ul class="list">`;
        for (const rc of resolved) h += `<li>${rc.doubted.map((x) => `You doubt ${link(x, shortName(x, 80))} <span class="link small" data-unsuspect="${x}">trust it again</span>`).join('; ')}</li>`;
        h += '</ul></details>';
    }
    return h;
}

function toolTheories() {
    const mode = weighMode();
    const weigh = { names: 'The game weighs each one against what you trust: what it needs to be wrong, what it goes against, and the odd things it leaves unexplained.', counts: 'The game weighs each one against what you trust, and says how much it needs wrong and leaves unexplained.', asked: 'Weigh one to see how much it needs wrong and leaves unexplained.' }[mode];
    let h = `<p class="small muted">A theory is a set of answers held together. ${weigh} To add answers, pick an answer on any question and choose “Add to theory”.</p>`;
    const all = game.visibleTheories();
    for (const t of all) {
        // Weighed (docs/hypotheses.md, Q8): by name on Easy, as counts on Medium, on request on Hard.
        const weighed = mode !== 'asked' || ui.weighed?.has(t.id);
        // Weighed one theory at a time, after the panel is drawn (docs/ui.md Q3): until then, "weighing…".
        const w = piece(`theory:${t.id}:${weighed}`, () => {
            const cost = weighed ? game.scenarioCost(t) : null;
            return { cost, support: game.theorySupport(t), html: !cost ? '' : mode === 'names' ? costHtml(cost) + residueHtml(game.residue(t)) + assumedHtml(game.assumedAnswers(t)) : countsHtml(cost, game.residue(t), game.assumedAnswers(t).length) };
        }, null);
        const cost = w?.cost ?? null;
        h += `<div class="theory${cost ? (cost.atOdds ? ' broken' : ' fits') : ''}${game.dropOf({ theory: t.id }) ? ' dropped' : ''}"><b>${esc(t.story ? `${t.held_by.filter((x) => game.knows(x)).map(cardName).join(', ')}: ` : '')}</b>${esc(t.label)}`;
        h += `<ul class="small">${Object.entries(t.assignment).map(([s, v]) => `<li><span class="link" data-slot-open="${s}">${esc(game.promptOf(s))}</span> → ${esc(valueName(s, v))}${t.story ? '' : ` <span class="link" data-untheory="${t.id}|${s}">remove</span>`}</li>`).join('') || '<li class="empty">no answers yet</li>'}</ul>`;
        // The inferences the theory rests on (the ones its holders drew) and, among those the player holds, the
        // ones its answers agree with and the ones they go against.
        const restsOn = (t.rests_on ?? []).filter((x) => game.knows(x));
        if (restsOn.length) h += `<div class="small">Rests on: ${restsOn.map((x) => link(x, shortName(x, 70))).join(' · ')}</div>`;
        if (!w) h += '<div class="small muted weighing">Weighing…</div>';
        else {
            const { agree, against } = w.support;
            if (agree.length) h += `<div class="small">Agrees with your inferences: ${agree.map((x) => link(x, shortName(x, 60))).join(' · ')}</div>`;
            if (against.length) h += `<div class="small bad">Goes against your inferences: ${against.map((x) => link(x, shortName(x, 60))).join(' · ')}</div>`;
            h += cost ? w.html : `<div class="small"><span class="link" data-weigh="${esc(t.id)}">Weigh it</span></div>`;
        }
        const tkey = `t|${t.id}`;
        h += game.dropOf({ theory: t.id }) ? dropHtml(tkey) : ui.dropping === tkey ? dropForm(tkey) : `<div class="small"><span class="link" data-drop-open="${esc(tkey)}">drop it…</span></div>`;
        if (!t.story) h += `<div class="small"><span class="link" data-theory-current="${t.id}">${ui.theory === t.id ? '★ new answers go here' : 'add answers here'}</span> · <span class="link" data-del-theory="${t.id}">delete</span></div>`;
        h += '</div>';
    }
    return `${h}<div class="row"><button data-new-theory="1">New theory</button></div>`;
}

// ---------- the record against Holmes (workstream 9, docs/ui.md Q1) ----------
// Told only as the story reaches each deadline (Game.record never gives a row whose deadline is ahead), in fixed
// templates around held cards and paragraph numbers: never the annotation's own words.
const FAMILY_WORDS = {
    deduction: ['Deductions', 'steps Holmes has made'],
    notice: ['Odd details', 'details Holmes has drawn attention to'],
    raise: ['Steps seen through', 'steps Holmes has taken apart'],
    drop: ['Wrong turns dropped', 'wrong turns the story has left behind'],
    check: ['Checks planned', 'checks Holmes has made'],
    absence: ['What did not happen', 'absences Holmes has pointed to'],
};
// A card that is a sentence (a clue, an inference) is quoted; a thing or a person is named.
const names = (ids) => ids.map((x) => (['claims', 'inferences', 'applied'].includes(model.cards.get(x)?.section) ? `“${link(x, shortName(x, 110).replace(/\.$/, ''))}”` : link(x, shortName(x, 60)))).join('; ');
/** Each line once: two thoughts can rest on the same inference. */
const once = (lines) => [...new Set(lines)];
/** What a row says Holmes (or the story) did at its deadline, and what the player had done. */
function recordLine(r) {
    const seal = r.seal ? game.seals.find((x) => x.id === r.seal) : null;
    const what = {
        deduction: () => (r.names.length ? `Holmes reasons: ${names(r.names)}` : r.concludes?.slot ? `Holmes settles ${slotQuestion(r.concludes.slot)} → ${esc(valueName(r.concludes.slot, r.concludes.value))}` : 'Holmes reasons it out'),
        notice: () => `Holmes draws attention to ${names(r.names)}`,
        raise: () => `Holmes shows that a step does not hold, ${names(r.names)}${r.exceptions?.[0]?.text ? `, unless ${esc(r.exceptions[0].text)}` : ''}`,
        drop: () => `The story leaves behind ${r.target.theory ? esc(layerName(r.target.theory)) : `${slotQuestion(r.target.slot)} → ${esc(valueName(r.target.slot, r.target.value))}`}`,
        check: () => (seal ? `Holmes does this: ${checkText(seal)}` : 'Holmes makes a check'),
        absence: () => `Holmes points to ${names(r.names)}`,
    }[r.family]();
    const done = { deduction: 'You had it', notice: 'You marked it odd', raise: 'You raised it', drop: 'You dropped it', check: 'You planned it', absence: 'You filed it' }[r.family];
    const before = r.family === 'drop' ? 'before the story did' : 'before him';
    return `${what}. ${done} at ${paraLabel(r.at)}: ${r.lead} paragraph${r.lead === 1 ? '' : 's'} ${before}.`;
}
/** On the reading bar: the rows whose deadline fell in the paragraphs just read, scored. */
function recordNews() {
    if (game.autoSolves() || ui.readFrom == null) return '';
    const from = ui.readFrom - 1;
    const rows = piece(`news:${from}:${game.read}`, () => game.record().rows.filter((r) => r.scores && r.deadline >= from && r.deadline < game.read), []);
    return once(rows.map((r) => `<div class="note record-news">${paraLabel(r.deadline)} · ${recordLine(r)}</div>`)).join('');
}
function toolRecord() {
    if (game.autoSolves()) return '<h3 class="section">Your record against Holmes</h3><p class="small muted">In Trivial the game works the case out: nothing is scored. On Easy you can race Holmes.</p>';
    const rec = piece('record', () => game.record(), null);
    let h = '<h3 class="section">Your record against Holmes</h3>';
    if (!rec) return `${h}<p class="small muted weighing">Weighing…</p>`;
    h += `<p class="small muted">${game.finished() ? 'The story is over: what you reached before Holmes, out of everything he does.' : 'As far as the story has gone: what you reached before Holmes, out of what he has done so far. The rest is told as the story reaches it.'}</p><ul class="list">`;
    for (const [f, [label, of]] of Object.entries(FAMILY_WORDS)) {
        const a = rec.families[f];
        if (!a.passed && !a.possible) continue;
        h += `<li><b>${label}:</b> ${a.scored} ${game.finished() ? `of ${a.possible}` : `of the ${a.passed} ${of} so far`}</li>`;
    }
    h += '</ul>';
    const scored = rec.rows.filter((r) => r.scores);
    if (game.finished() && scored.length) {
        const best = [...scored].sort((a, b) => b.lead - a.lead).slice(0, 5);
        h += `<h3 class="section">Furthest ahead</h3><ul class="list small">${once(best.map((r) => `<li>${paraLabel(r.deadline)} · ${recordLine(r)}</li>`)).join('')}</ul>`;
    }
    h += scored.length ? `<h3 class="section">Before Holmes (${scored.length})</h3><ul class="list small">${once([...scored].reverse().map((r) => `<li>${paraLabel(r.deadline)} · ${recordLine(r)}</li>`)).join('')}</ul>` : '<p class="empty">Nothing yet.</p>';
    if (game.finished()) h += heldBackHtml();
    return h;
}

// ---------- checks (workstream 7, docs/predictions.md) ----------
const CHECK_WORDS = { look: ['Look for', 'at'], ask: ['Ask', 'about'], show: ['Show', 'to'], compare: ['Compare', 'with'] };
const OUTCOME_WORDS = { found: 'found', 'not-found': 'not found', yes: 'yes', no: 'no', matches: 'they match', differs: 'they differ' };
const SAYS_WORDS = { 'says-so': 'says so', 'says-otherwise': 'says otherwise', 'says-nothing': 'says nothing either way', refuted: 'cannot hold, whatever you set aside' };
/** A sealed check in words: the template with the player's cards. */
function checkText(x) {
    const [a, b] = CHECK_WORDS[x.verb];
    const [f, g] = CHECK_TEMPLATES[x.verb].fields;
    // A clue is a sentence: it reads in quotation marks.
    const name = (id) => (model.cards.get(id)?.section === 'claims' ? `“${link(id, shortName(id, 60).replace(/\.$/, ''))}”` : link(id, shortName(id, 50)));
    return `${a} ${name(x.fields[f])} ${b} ${name(x.fields[g])}`;
}
/**
 * Plan a check before Holmes makes it (docs/predictions.md): a template filled with cards the player holds, the result
 * they expect, the answer it would give, and the theory it comes from. Sealed, it says nothing until the story
 * reaches it; then where Holmes made it and what the story shows of the result.
 */
function toolChecks() {
    if (game.autoSolves()) return '<p class="small muted">In Trivial the game works the case out; there are no checks to plan.</p>';
    const f = ui.plan ?? (ui.plan = { verb: 'look', fields: {}, expect: '', slot: '', value: '', theory: '' });
    const tpl = CHECK_TEMPLATES[f.verb];
    const held = [...game.unlocked.keys()].filter((x) => inHand(x) && ['entities', 'claims'].includes(model.cards.get(x)?.section));
    const people = held.filter((x) => model.cards.get(x).kind === 'person');
    const opt = (v, label, cur) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(label)}</option>`;
    const pick = (field, i) => {
        const list = field === 'person' || field === 'to' ? people : held;
        return `<select id="plan-${i}">${opt('', `${field}…`, f.fields[field] ?? '')}${list.map((x) => opt(x, shortName(x, 50), f.fields[field])).join('')}</select>`;
    };
    const slots = game.visibleSlots();
    const slot = slots.find((x) => x.id === f.slot);
    let h = `<p class="small muted">Plan a check before Holmes makes it: what you would do, with cards you hold, and what you expect it to show. It is sealed when you plan it; nothing tells you whether Holmes will do the same until the story gets there. A check made before he makes it counts, whatever the story shows of the result; a wrong guess costs nothing.</p>`;
    h += `<div class="pen small"><div class="row"><select id="plan-verb">${Object.keys(CHECK_TEMPLATES).map((v) => opt(v, CHECK_WORDS[v][0], f.verb)).join('')}</select> ${pick(tpl.fields[0], 0)} ${esc(CHECK_WORDS[f.verb][1])} ${pick(tpl.fields[1], 1)}</div>`;
    h += `<div class="row">Expecting: <select id="plan-expect">${opt('', 'nothing in particular', f.expect)}${tpl.outcomes.map((o) => opt(o, OUTCOME_WORDS[o], f.expect)).join('')}</select>`;
    if (f.expect) {
        h += ` which would answer <select id="plan-slot">${opt('', 'no question', f.slot)}${slots.map((x) => opt(x.id, shortName(x.on, 30) + ': ' + game.promptOf(x.id), f.slot)).join('')}</select>`;
        if (slot) h += ` <select id="plan-value">${opt('', 'with…', f.value)}${slot.domain.filter((v) => !game.isHidden(v)).map((v) => opt(v, valueName(slot.id, v), f.value)).join('')}</select>`;
    }
    h += '</div>';
    const theories = game.visibleTheories();
    if (f.expect && f.slot && theories.length) h += `<div class="row">From the theory: <select id="plan-theory">${opt('', 'none', f.theory)}${theories.map((t) => opt(t.id, t.label, f.theory)).join('')}</select></div>`;
    h += '<div class="row"><button data-plan-seal="1">Seal it</button></div></div>';
    const mode = weighMode();
    for (const x of [...game.seals].reverse()) {
        const st = game.sealStatus(x.id);
        h += `<div class="theory${x.withdrawn !== null ? ' dropped' : ''}">${checkText(x)}${x.expect ? `, expecting ${esc(OUTCOME_WORDS[x.expect])}` : ''}${x.answer ? ` (${esc(game.promptOf(x.answer.eq[0]))} → ${esc(valueName(x.answer.eq[0], x.answer.eq[1]))})` : ''}`;
        h += `<div class="small muted">Sealed at ${paraLabel(x.para)}${x.withdrawn !== null ? `; withdrawn at ${paraLabel(x.withdrawn)}` : ''}.</div>`;
        if (st.performed !== null) {
            h += `<div class="small">Holmes does this (${paraLabel(st.performed)}).</div>`;
            if (st.result !== null) h += `<div class="small${st.borne === false ? ' bad' : st.borne ? ' good' : ''}">The result (${paraLabel(st.result)}): ${esc(OUTCOME_WORDS[st.outcome] ?? st.outcome)}${st.borne === null ? '' : st.borne ? ', as you expected.' : ', not as you expected.'}</div>`;
            else if (st.never) h += '<div class="small">The story never says what he found. It is left open.</div>';
            else h += '<div class="small">The story does not say here what he found.</div>';
        } else if (st.made === false) h += '<div class="small muted">Holmes never did this.</div>';
        if (x.theory && x.answer) {
            const name = theories.find((t) => t.id === x.theory)?.label ?? 'the theory';
            if (mode === 'asked' && !ui.tested?.has(x.id)) h += `<div class="small"><span class="link" data-plan-test="${esc(x.id)}">What does ${esc(name)} say?</span></div>`;
            else {
                const tt = game.sealTheoryTest(x.id);
                if (tt) h += `<div class="small">${esc(name)}: ${mode === 'counts' ? (tt.says === 'says-so' ? 'yes, it gives this answer' : 'no, it does not give this answer') : esc(SAYS_WORDS[tt.says])}.</div>`;
            }
        }
        if (x.withdrawn === null && st.performed === null) h += `<div class="small"><span class="link" data-unseal="${esc(x.id)}">withdraw</span></div>`;
        h += '</div>';
    }
    return h;
}

const COST_TOLD = { testimony: 'someone\'s word', report: 'a report', admission: 'an admission' };
const COST_WHY = { 'others-inference': 'someone else\'s reasoning', heuristic: 'a rule of thumb you applied' };
/**
 * A scenario's cost (Game.scenarioCost, docs/hypotheses.md Q2): what it needs to be wrong among what you trust, and
 * what it goes against of your own reasoning or of what was seen. A story that says a witness is wrong is not
 * refuted; it pays for it.
 */
function costHtml(cost) {
    if (cost.refuted) return '<div class="small bad">It cannot hold, whatever you set aside.</div>';
    if (!cost.items.length) return '<div class="small good">It needs nothing you trust to be wrong.</div>';
    const names = (i) => i.cards.map((x) => link(x, shortName(x, 60))).join(' and ');
    const words = cost.items.filter((i) => i.why !== 'inference' && i.told !== 'seen');
    const own = cost.items.filter((i) => i.why === 'inference');
    const seen = cost.items.filter((i) => i.told === 'seen');
    let h = '';
    if (words.length) h += `<div class="small">It needs ${words.length === 1 ? 'this' : `these ${words.length}`} to be wrong: ${words.map((i) => `${names(i)} <span class="muted">(${esc(COST_TOLD[i.told] ?? COST_WHY[i.why])})</span>`).join(' · ')}</div>`;
    if (own.length) h += `<div class="small bad">It goes against your own reasoning (or Holmes's): ${own.map(names).join(' · ')}</div>`;
    if (seen.length) h += `<div class="small bad">It goes against what was seen, found or written: ${seen.map(names).join(' · ')}</div>`;
    return h;
}

/** How much the game shows when it weighs a theory: names (Easy), counts (Medium), asked (Hard). */
function weighMode() {
    return game.autoSolves() ? 'names' : game.opts.weigh;
}
/** A question as it stands alone: an event's facet ("Who did it?") is prefixed with the event. */
function slotQuestion(id) {
    const slot = model.slots.get(id);
    return slot.prompt.includes('{') ? esc(game.promptOf(id)) : `${esc(shortName(slot.on, 50))}: ${esc(game.promptOf(id))}`;
}
/** A theory's assumed answers (Game.assumedAnswers): what it says that nothing you hold gives. */
function assumedHtml(assumed) {
    if (!assumed.length) return '';
    return `<div class="small">It rests on nothing you hold for: ${assumed.map((a) => `${slotQuestion(a.slot)} → ${esc(valueName(a.slot, a.value))}`).join(' · ')}</div>`;
}
/** A scenario weighed as counts (Medium, and Hard on request): how much it needs wrong, leaves over, and assumes. */
function countsHtml(cost, res, assumed = 0) {
    if (cost.refuted) return '<div class="small bad">It cannot hold, whatever you set aside.</div>';
    const own = cost.items.filter((i) => i.why === 'inference' || i.told === 'seen').length;
    const words = cost.items.length - own;
    const all = res.explained.length + res.residue.length;
    const parts = [`it needs ${words} thing${words === 1 ? '' : 's'} you trust to be wrong`];
    if (own) parts.push(`goes against ${own} of your own steps or of what was seen`);
    if (all) parts.push(`leaves ${res.residue.length} of ${all} odd things unexplained`);
    if (assumed) parts.push(`rests on nothing you hold for ${assumed} of its answers`);
    return `<div class="small ${own ? 'bad' : ''}">Weighed: ${parts.join(', ')}.</div>`;
}

/**
 * A scenario's residue (Game.residue, docs/hypotheses.md Q3): the odd things met that it leaves unexplained, each
 * shown by its cards, and how many it explains.
 */
function residueHtml(res) {
    const all = res.explained.length + res.residue.length;
    if (!all) return '';
    const cardsOf = (id) => (model.data.puzzles ?? []).find((z) => z.id === id).cards.map((x) => link(x, shortName(x, 50))).join(' with ');
    if (!res.residue.length) return `<div class="small good">It explains every odd thing you have met (${all}).</div>`;
    return `<div class="small">It leaves ${res.residue.length} of ${all} odd things unexplained: ${res.residue.map(cardsOf).join(' · ')}</div>`;
}

// ---------- the board: where things were, when (world model; engine/timeline.js) ----------
const BOARD_KINDS = ['person', 'animal', 'group', 'object'];
const thingChip = (x, time) => {
    if (x.theory) return `<span class="chip theory" title="The theory's answers put it here">${esc(shortName(x.thing, 24))}</span>`;
    const cls = x.given ? 'given' : x.pencil ? `pencil${x.struck ? ' struck' : ''}` : 'open';
    const name = esc(shortName(x.thing, 24));
    if (!x.pencil) return `<span class="chip ${cls}" title="${x.given ? 'Your clues place it here' : 'Not placed'}">${x.given ? name : `<span class="link" data-pen-pick="${esc(`${x.thing}|${time}`)}">${name}</span>`}</span>`;
    return markChip(x.thing, time, x.value, name, x);
};
const placeName = (v) => esc(v === 'elsewhere' ? 'somewhere else' : shortName(v, 24));
const aimName = (v) => esc((model.data.state_aims ?? []).find((a) => a.id === v)?.label.replace(/^To /, 'to ') ?? v);
/** A mark's status, as a class and a title (proven, ruled out with a proof, or excluded by the clues when greying). */
const STATUS = {
    proven: ['mark-proven', 'You proved it'],
    ruled: ['mark-ruled', 'You ruled it out'],
    excluded: ['mark-excluded', 'Your clues rule this out'],
};
/**
 * A mark on the timeline: given (solid), the layer's theory (dotted), or the player's pencil (click to strike or
 * restore, × to erase). With `commit`, a mark of the player's own board also offers to prove it or rule it out.
 */
function markChip(thing, time, value, label, m, { aspect = 'at', commit = false } = {}) {
    if (m.given) return `<span class="chip given" title="Your clues place it here">${label}</span>`;
    if (m.theory) return `<span class="chip theory" title="The theory's answers put it here">${label}</span>`;
    const key = `${thing}|${time}|${value}|${aspect}`;
    const [cls, why] = STATUS[m.status] ?? ['', ''];
    const title = `${why ? `${why}. ` : ''}Your pencil mark: click to ${m.struck ? 'restore' : 'strike'} it`;
    let h = `<span class="chip pencil${m.struck ? ' struck' : ''}${cls ? ` ${cls}` : ''}" title="${esc(title)}"><span class="link" data-pen-toggle="${esc(`${thing}|${time}|${value}|${m.struck ? 0 : 1}|${aspect}`)}">${label}</span> <span class="link x" data-pen-erase="${esc(key)}" title="Erase">×</span></span>`;
    if (commit && !m.struck && m.status !== 'proven') h += ` <span class="small"><span class="link" data-mark-prove="${esc(key)}" title="Prove it from what you hold and trust">prove</span> · <span class="link" data-mark-rule="${esc(key)}" title="${game.opts.crossOut === 'pencil' ? 'Cross it out' : 'Rule it out: the game checks it against what you hold and trust'}">rule out</span></span>`;
    return h;
}
const layerOpt = (v, label, cur) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(label)}</option>`;
function layerPicker() {
    const layers = game.layers();
    if (!layers.some((l) => l.id === ui.layer)) ui.layer = 'mine';
    return `Layer <select id="layer-pick">${layers.map((l) => layerOpt(l.id, l.id === 'mine' ? l.label : `${l.story ? 'Theory' : 'Your theory'}: ${l.label.length > 70 ? `${l.label.slice(0, 69)}…` : l.label}`, ui.layer)).join('')}</select>`;
}

/** The card's own timeline (engine: cardTimeline), with its marks editable and a pencil form for the card. */
function cardTimelineHtml(id) {
    const picker = layerPicker();
    const layer = ui.layer;
    const tl = game.cardTimeline(id, layer);
    if (!tl.kind) return '';
    const shown = game.timelineTimes().filter((t) => t.kind !== 'boundary');
    if (!shown.length) return '';
    const evLink = (e) => link(e, shortName(e, 50));
    let h = '<h3 class="section">Timeline</h3>';
    if (tl.kind !== 'event') h += `<div class="row small card-layer">${picker}</div>`;
    if (tl.kind === 'event') {
        const line = tl.lines[0];
        if (!line) h += '<p class="small muted">When it happened is not settled yet.</p>';
        else {
            h += `<p class="small">${esc(line.label ?? cardName(line.time))}${tl.place ? ` · ${link(tl.place, shortName(tl.place, 30))}` : ''}</p>`;
            const sp = game.board.splits.find((x) => x.time === line.time);
            if (sp && sp.by !== id) h += `<p class="small">Split at ${evLink(sp.by)}: this happened <span class="link" data-move="${esc(`${id}|${line.time}.before.${sp.by.slice(2)}`)}">before</span> / <span class="link" data-move="${esc(`${id}|${line.time}.after.${sp.by.slice(2)}`)}">after</span> it?</p>`;
            if (line.placed) h += `<p class="small"><span class="link" data-order-prove="${esc(`${id}|${line.time}`)}">Prove it</span> · <span class="link" data-move="${esc(`${id}|`)}">Back to the whole window</span></p>`;
        }
        return h;
    }
    if (!tl.lines.length) h += '<p class="small muted">Nothing on the timeline yet.</p>';
    h += '<ul class="list card-timeline">';
    for (const l of tl.lines) {
        const bits = [];
        if (tl.kind === 'thing') {
            const commit = layer === 'mine';
            if (l.at !== null) bits.push(markChip(id, l.time, l.at, placeName(l.at), { given: true }));
            for (const m of l.pencil.filter((x) => x.value !== l.at || x.struck)) bits.push(markChip(id, l.time, m.value, placeName(m.value), m, { commit }));
            if (l.held || l.heldPencil.length) bits.push('<span class="small muted">held by</span>');
            if (l.held) bits.push(markChip(id, l.time, l.held, placeName(l.held), { given: true }));
            for (const m of l.heldPencil) bits.push(markChip(id, l.time, m.value, placeName(m.value), m, { aspect: 'held', commit }));
            for (const k of l.conditions) {
                const yes = (v) => (k.kind === 'knowledge' ? `${v === 'true' ? 'knew' : 'did not know'}: “${esc(k.label)}”` : v === 'true' ? esc(k.id) : `not ${esc(k.id)}`);
                if (k.value !== null) bits.push(markChip(id, l.time, k.value, yes(k.value), { given: true }));
                for (const m of k.pencil) bits.push(markChip(id, l.time, m.value, yes(m.value), m, { aspect: k.id, commit }));
            }
            if (l.aims || l.aimsPencil.length) bits.push('<span class="small muted">trying</span>');
            if (l.aims) bits.push(markChip(id, l.time, l.aims, aimName(l.aims), { given: true }));
            for (const m of l.aimsPencil.filter((x) => x.value !== l.aims || x.struck)) bits.push(markChip(id, l.time, m.value, aimName(m.value), m, { aspect: 'aims', commit }));
            for (const e of l.events) bits.push(`<div class="ev">• ${evLink(e.event)}</div>`);
        } else {
            for (const x of l.things) bits.push(markChip(x.thing, l.time, x.value, `${esc(shortName(x.thing, 24))}${x.value !== id ? ` <span class="small">(${placeName(x.value)})</span>` : ''}`, x, { commit: layer === 'mine' }));
            for (const e of l.events) bits.push(`<div class="ev">• ${evLink(e)}</div>`);
        }
        h += `<li><span class="when" style="padding-left:${12 * l.depth}px">${esc(l.label)}</span> ${bits.join(' ')}</li>`;
    }
    h += '</ul>';
    if (tl.undated.length) h += `<p class="small muted">When not yet known: ${tl.undated.map(evLink).join(' · ')}</p>`;
    // The pencil form, with the card itself as who (a thing) or where (a place).
    const cp = ui.cardPen?.card === id ? ui.cardPen : (ui.cardPen = { card: id, time: null, other: null, aspect: 'at' });
    const whens = `<select id="cpen-time">${layerOpt('', 'when…', cp.time)}${shown.map((t) => layerOpt(t.id, `${'· '.repeat(t.depth)}${t.label}`, cp.time)).join('')}</select>`;
    if (tl.kind === 'thing') {
        // What to pencil: where it was, who had it, or one of the case's conditions.
        const held = (k) => inHand(k) && (model.cards.get(k)?.kind === 'place' || ['person', 'animal', 'group'].includes(model.cards.get(k)?.kind));
        const conds = game.knowableConditions().map((id) => ({ id }));
        const aims = model.data.state_aims ?? [];
        const person = ['person', 'group'].includes(model.cards.get(id)?.kind);
        const aspects = `<select id="cpen-aspect">${layerOpt('at', 'was at', cp.aspect)}${layerOpt('held', 'was held by', cp.aspect)}${person && aims.length ? layerOpt('aims', 'was trying', cp.aspect) : ''}${conds.map((c) => layerOpt(c.id, `was ${c.id}?`, cp.aspect)).join('')}${game.knowablePropositions().map((p) => layerOpt(`knows_${p.slice(2)}`, `knew: “${shortName(p, 50)}”?`, cp.aspect)).join('')}</select>`;
        const values = cp.aspect === 'at' ? [['', 'where…'], ...[...game.unlocked.keys()].filter((x) => model.cards.get(x)?.kind === 'place' && inHand(x)).map((x) => [x, shortName(x, 30)]), ['elsewhere', 'somewhere else']]
            : cp.aspect === 'held' ? [['', 'who, or where it lay…'], ...[...game.unlocked.keys()].filter(held).map((x) => [x, shortName(x, 30)]), ['elsewhere', 'someone or somewhere else']]
                : cp.aspect === 'aims' ? [['', 'to do what…'], ...aims.map((a) => [a.id, a.label.replace(/^To /, 'to ')])]
                : [['', 'yes or no…'], ['true', 'yes'], ['false', 'no']];
        h += `<div class="pen row small">Pencil in: at ${whens} it ${aspects} <select id="cpen-other">${values.map(([v, label]) => layerOpt(v, label, cp.other)).join('')}</select> <button data-cpen-add="${esc(id)}">Pencil it in</button></div>`;
    } else {
        const people = [...game.unlocked.keys()].filter((x) => BOARD_KINDS.includes(model.cards.get(x)?.kind) && inHand(x));
        h += `<div class="pen row small">Pencil in <select id="cpen-other">${layerOpt('', 'who or what…', cp.other)}${people.map((x) => layerOpt(x, shortName(x, 30), cp.other)).join('')}</select> here at ${whens} <button data-cpen-add="${esc(id)}">Pencil it in</button></div>`;
    }
    return h;
}

function boardHtml(layout) {
    const pen = ui.pen ?? (ui.pen = { thing: null, time: null, place: null });
    const layers = game.layers();
    if (!layers.some((l) => l.id === ui.layer)) ui.layer = 'mine';
    const layer = ui.layer;
    const opt = (v, label, cur) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(label)}</option>`;
    const times = game.timelineTimes();
    const shown = times.filter((t) => t.kind !== 'boundary');
    const followed = game.followedThings(ui.layer ?? 'mine');
    const people = [...game.unlocked.keys()].filter((id) => BOARD_KINDS.includes(model.cards.get(id)?.kind) && inHand(id));
    const places = [...game.unlocked.keys()].filter((id) => model.cards.get(id)?.kind === 'place' && inHand(id));
    let h = '<p class="small muted">Where everyone and everything was, when. Your clues place some of it (solid); the rest is yours to pencil in (dashed: several marks are several guesses; click a mark to strike it). Click a cell to start a mark there. Each theory you have met is a night of its own: choose it as the layer to see where its answers put people (dotted), and pencil its night.</p>';
    h += `<div class="row small">${layerPicker()} <button data-layer-check="1" class="quiet">Does this night fit?</button></div>`;
    if (ui.layerFit?.layer === layer) h += `<div class="note block">${ui.layerFit.html}</div>`;
    h += `<div class="small muted pen-hint">To pencil a mark: choose who or what, when and where below and press “Pencil it in”. Clicking a cell fills in ${layout === 'place' ? 'when and where' : 'who and when'} (the cell is outlined).</div>`;
    h += `<div class="pen row small">Pencil in <select id="pen-thing">${opt('', 'who or what…', pen.thing)}${people.map((id) => opt(id, shortName(id, 30), pen.thing)).join('')}</select>
        at <select id="pen-time">${opt('', 'when…', pen.time)}${shown.map((t) => opt(t.id, `${'· '.repeat(t.depth)}${t.label}`, pen.time)).join('')}</select>
        in <select id="pen-place">${opt('', 'where…', pen.place)}${places.map((id) => opt(id, shortName(id, 30), pen.place)).join('')}${opt('elsewhere', 'somewhere else', pen.place)}</select>
        <button data-pen-add="1">Pencil it in</button></div>`;
    h += absenceFormHtml(shown);
    const unfollowed = people.filter((id) => !followed.includes(id));
    h += `<div class="small follow">Following ${followed.map((id) => `${link(id, shortName(id, 24))} <span class="link x" data-unfollow="${esc(id)}" title="Stop following">×</span>`).join(', ') || 'no one yet'}.
        ${unfollowed.length ? `Follow <select id="follow-pick">${unfollowed.map((id) => opt(id, shortName(id, 30), null)).join('')}</select> <button data-follow-go="1" class="quiet">Follow</button>` : ''}</div>`;
    h += `<div class="row small split-toggle"><button data-split-toggle="1" class="quiet">${ui.showSplits ? 'Hide' : 'Show'} the split controls</button></div>`;
    const splitCtl = (t) => {
        if (t.kind === 'boundary' || !ui.showSplits) return '';
        if (game.board.splits.some((x) => x.time === t.id)) return ` <span class="link small" data-unsplit="${esc(t.id)}" title="Undo this split">unsplit</span>`;
        if (ui.splitting !== t.id) return ` <span class="link small" data-split="${esc(t.id)}" title="Split this time at an event: the part before it and the part after">split</span>`;
        const evs = [...game.unlocked.keys()].filter((id) => model.cards.get(id)?.section === 'events' && !game.board.splits.some((x) => x.by === id));
        return ` <select id="split-pick">${evs.map((id) => opt(id, shortName(id, 40), null)).join('')}</select> <button data-split-go="${esc(t.id)}" class="quiet">Split here</button>`;
    };
    if (layout === 'place') {
        const bp = game.timeline('place', layer);
        h += `<div class="board-wrap"><table class="board"><thead><tr><th>When</th>${bp.columns.map((c) => `<th>${c === 'elsewhere' ? 'Somewhere else' : c === 'unknown' ? '<i>Not placed</i>' : link(c, shortName(c, 18))}</th>`).join('')}</tr></thead><tbody>`;
        for (const r of bp.rows) {
            const t = r.time;
            h += `<tr class="${t.kind}"><th style="padding-left:${4 + 12 * t.depth}px">${t.kind === 'boundary' ? `<i>${esc(shortName(t.event, 40))}</i>` : esc(t.label)}${splitCtl(t)}</th>`;
            for (const c of bp.columns) {
                const cell = r.cells.get(c);
                const evs = cell.events.map((e) => {
                    const sp = game.board.splits.find((x) => x.time === t.id);
                    const mv = sp && t.kind !== 'boundary' ? ` <span class="small muted">→ <span class="link" data-move="${esc(`${e}|${t.id}.before.${sp.by.slice(2)}`)}">before</span> / <span class="link" data-move="${esc(`${e}|${t.id}.after.${sp.by.slice(2)}`)}">after</span></span>` : '';
                    const placedHere = game.board.placed.some((p) => p.event === e) && t.kind === 'part';
                    const back = placedHere ? ` <span class="link small" data-move="${esc(`${e}|`)}" title="Back to the whole window">↑</span> <span class="link small" data-order-prove="${esc(`${e}|${t.id}`)}" title="Prove it happened in this part, from what you hold and trust">prove</span>` : '';
                    return `<div class="ev" title="${esc(cardName(e))}">• ${link(e, shortName(e, 26))}${mv}${back}</div>`;
                }).join('');
                const pick = t.kind === 'boundary' || c === 'unknown' ? '' : ` data-pen-cell="${esc(`time=${t.id}|place=${c}`)}"${pen.time === t.id && pen.place === c ? ' class="picked"' : ''}`;
                h += `<td${pick}>${cell.things.map((x) => thingChip({ value: c, ...x }, t.id)).join(' ')}${evs}</td>`;
            }
            h += '</tr>';
        }
        h += '</tbody></table></div>';
    } else {
        const bt = game.timeline('thing', layer);
        h += `<div class="board-wrap"><table class="board"><thead><tr><th></th>${bt.times.map((t) => `<th title="${esc(t.label)}">${esc(t.label)}</th>`).join('')}</tr></thead><tbody>`;
        for (const r of bt.rows) {
            h += `<tr><th>${link(r.thing, shortName(r.thing, 24))}</th>`;
            for (const c of r.cells) {
                const bits = [];
                if (c.at) bits.push(markChip(r.thing, c.time, c.at, placeName(c.at), { given: true }));
                for (const m of c.pencil.filter((x) => x.value !== c.at || x.struck)) bits.push(markChip(r.thing, c.time, m.value, placeName(m.value), m));
                if (c.held || c.heldPencil.length) bits.push('<span class="small muted">held by</span>');
                if (c.held) bits.push(markChip(r.thing, c.time, c.held, placeName(c.held), { given: true }));
                for (const m of c.heldPencil) bits.push(markChip(r.thing, c.time, m.value, placeName(m.value), m, { aspect: 'held' }));
                for (const k of c.conditions) {
                    const yes = (v) => (k.kind === 'knowledge' ? `${v === 'true' ? 'knew' : 'did not know'}: “${esc(k.label)}”` : v === 'true' ? esc(k.id) : `not ${esc(k.id)}`);
                    if (k.value !== null) bits.push(markChip(r.thing, c.time, k.value, yes(k.value), { given: true }));
                    for (const m of k.pencil) bits.push(markChip(r.thing, c.time, m.value, yes(m.value), m, { aspect: k.id }));
                }
                if (c.aims || c.aimsPencil.length) bits.push('<span class="small muted">trying</span>');
                if (c.aims) bits.push(markChip(r.thing, c.time, c.aims, aimName(c.aims), { given: true }));
                for (const m of c.aimsPencil.filter((x) => x.value !== c.aims || x.struck)) bits.push(markChip(r.thing, c.time, m.value, aimName(m.value), m, { aspect: 'aims' }));
                h += `<td data-pen-cell="${esc(`thing=${r.thing}|time=${c.time}`)}"${pen.thing === r.thing && pen.time === c.time ? ' class="picked"' : ''}>${bits.join(' ')}</td>`;
            }
            h += '</tr>';
        }
        h += '</tbody></table></div>';
    }
    return h;
}

/**
 * Filing an absence (workstream 5): something that should have happened did not. The player names what they
 * expected (a background fact), when, and the clue that would have registered it. Easy suggests the expectation.
 */
function absenceFormHtml(shown) {
    if (game.autoSolves()) return '';
    const ab = ui.absence ?? (ui.absence = { expectation: null, time: null, witness: null });
    const opt = (v, label, cur) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(label)}</option>`;
    const rules = [...game.unlocked.keys()].filter((x) => model.cards.get(x)?.section === 'rules' && inHand(x));
    const clues = [...game.unlocked.keys()].filter((x) => model.cards.get(x)?.section === 'claims' && inHand(x));
    const suggested = game.helps('hints') ? game.fileableAbsences()[0]?.expectation ?? null : null;
    const exp = ab.expectation ?? suggested;
    return `<div class="pen row small absence">Something that should have happened did not: <select id="ab-exp">${opt('', 'what you would expect…', exp)}${rules.map((x) => opt(x, shortName(x, 50), exp)).join('')}</select>
        at <select id="ab-time">${opt('', 'when…', ab.time)}${shown.map((t) => opt(t.id, `${'· '.repeat(t.depth)}${t.label}`, ab.time)).join('')}</select>
        and <select id="ab-witness">${opt('', 'who or what would have noticed…', ab.witness)}${clues.map((x) => opt(x, shortName(x, 50), ab.witness)).join('')}</select>
        <button data-absence-file="1">File it</button></div>`;
}

function toolTimeline() {
    const sub = (k, label) => `<button data-timeline="${k}" class="${ui.timeline === k ? 'on' : ''}">${label}</button>`;
    let h = `<div class="subtabs">${sub('place', 'By place')}${sub('thing', 'By thing')}${sub('fabula', 'What happened')}${sub('found', 'What you found')}${sub('told', 'What the story told')}</div><div class="timeline">`;
    if (ui.timeline === 'place' || ui.timeline === 'thing') {
        h += boardHtml(ui.timeline);
    } else if (ui.timeline === 'fabula') {
        const rows = game.fabula();
        h += '<p class="small muted">Events you hold, placed once their time is settled.</p>';
        for (const w of model.windows) {
            const here = rows.filter((r) => r.settled === w.id);
            if (here.length || ui.focusWindow === w.id) h += `<div class="window" id="win-${w.id.replace(/\./g, '-')}"><h4>${esc(w.label)}</h4><ul>${here.map((r) => `<li>${link(r.event.id)}</li>`).join('') || '<li class="empty">nothing placed here yet</li>'}</ul></div>`;
        }
        const open = rows.filter((r) => r.slot && r.settled === null);
        if (open.length) h += `<h3 class="section">Not yet placed (${open.length})</h3><ul class="list small">${open.map((r) => `<li>${link(r.event.id)}</li>`).join('')}</ul>`;
        const untimed = rows.filter((r) => !r.slot);
        if (untimed.length) h += `<p class="small muted">No time given: ${untimed.map((r) => link(r.event.id, shortName(r.event.id, 40))).join(', ')}</p>`;
    } else if (ui.timeline === 'found') {
        const inv = game.investigation().filter((r) => !['glosses', 'rules'].includes(model.cards.get(r.id).section));
        h += inv.length ? `<ol class="small">${inv.map((r) => `<li>${link(r.id, shortName(r.id, 60))} <span class="muted">· ${paraLabel(r.para)}</span></li>`).join('')}</ol>` : '<p class="empty">Nothing yet.</p>';
    } else {
        for (const s of model.scenes) {
            const at = story.find(s.source[0])?.para ?? 0;
            if (at >= game.read) break;
            const here = [...game.unlocked.keys()].filter((c) => model.cards.get(c).section === 'claims').filter((c) => {
                const p = game.disclosure(c).at;
                const next = model.scenes[model.scenes.indexOf(s) + 1];
                const end = next ? story.find(next.source[0])?.para ?? Infinity : Infinity;
                return p >= at && p < end;
            });
            h += `<div class="window"><h4><span class="link" data-goto="${at}">${esc(s.title)}</span></h4><div class="small">${here.length} of your clues are first told here</div></div>`;
        }
    }
    return `${h}</div>`;
}

function render() { run(renderNow); }
function renderNow() {
    const settledQ = model.data.questions.filter((q) => game.settled(q.slot) !== null).length;
    const raised = model.data.questions.filter((q) => game.questionRaised(q.id)).length;
    const found = [...game.unlocked.keys()].filter((k) => !['glosses', 'rules'].includes(model.cards.get(k)?.section)).length;
    // The record against Holmes (docs/ui.md Q1): only what the story has already reached; nothing in Trivial.
    const ahead = game.autoSolves() ? null : piece('count:record', () => (ui.ahead = game.record().ahead), ui.ahead ?? 0);
    $('#progress').innerHTML = `${found} cards · ${settledQ} of ${raised} questions settled${ahead === null ? '' : ` · <span class="link" data-record-open="1" title="Your record against Holmes, as far as the story has gone">Ahead of Holmes: ${ahead}</span>`}`;
    $('#difficulty').value = game.difficulty;
    $('#pace').value = game.pace;
    $('#autopace').value = game.autoPace;
    $('#autopace-label').hidden = !game.autoSolves();
    for (const k of Object.keys(OPTIONS)) {
        $(`#opt-${k}`).value = game.opts[k];
        // With the game working out the answers, the player's options have nothing to act on.
        $(`#opt-${k}`).closest('label').classList.toggle('opt-off', game.autoSolves() && PLAYER_OPTIONS.includes(k));
    }
    if (game.difficulty === CUSTOM) $('#difficulty-options').open = true;
    const pick = (id) => $(`#${id}`).selectedOptions[0]?.textContent ?? '';
    $('#settings-summary').textContent = `${pick('difficulty')} · ${pick('pace') === 'Free' ? 'Free pace' : 'Waits'} · Background ${pick('opt-background').toLowerCase()}`;
    $('#settings-short').textContent = pick('difficulty');
    renderStory();
    renderToolNow();
}

// ---------- plain readings (ui/readings.js) ----------
// Built once the case has loaded (see the bottom of this file).
let R = null;
const readingOf = (f) => R.readingOf(f);

/** A clue in a chain: a claim links to its card, with a way to doubt it. */
function clueHtml(id, aside = null) {
    const k = model.constraints.get(id);
    const c = k.from_claim;
    if (!c) return esc(k.label);
    if (game.suspected.has(c)) return `${link(c, shortName(c, 90))} <span class="small muted">doubted</span>`;
    // In a listed clash: the card the game set aside, and the others, which the player may doubt instead.
    if (aside?.includes(c)) return `${link(c, shortName(c, 90))} <span class="small bad">set aside</span> <span class="link small" data-suspect="${c}">doubt it</span>`;
    return `${link(c, shortName(c, 90))} <span class="link small" data-suspect="${c}">${aside ? 'doubt this instead' : 'doubt it'}</span>`;
}

/**
 * Clues that cannot all hold, replayed as numbered steps: what each one narrows ("so the owner of the bill is
 * John Straker"), ending where some question is left with nothing. `fixed` is an assumed answer to start from.
 */
function chainHtml(ids, fixed = {}, aside = null) {
    const replay = game.chain(ids, fixed);
    if (!replay.steps.length) return doubtableHtml(ids);
    const { suppose, lines, unused, contradiction } = R.chainLines(ids, replay, fixed);
    const say = (x) => `${esc(x.text)}${x.bad ? ' <span class="bad">✗</span>' : ''}`;
    let h = '<ol class="chain">';
    for (const t of suppose) h += `<li class="suppose">${esc(t)}</li>`;
    for (const l of lines) h += `<li>${clueHtml(l.id, aside)}${l.says.length ? `<div class="so">so ${l.says.map(say).join('; and ')}</div>` : ''}</li>`;
    h += '</ol>';
    if (!contradiction || unused.length) h += `<div class="small muted">${contradiction ? 'Also involved' : 'Together with'}: ${unused.map((x) => clueHtml(x, aside)).join(' · ')}</div>`;
    return h;
}

// ---------- building inferences ----------
// The player builds an inference from a card ("Infer from this"), then connects further cards; the game says
// when they are onto something and how many connections are left, and builds the inference when they complete it.

/** The button on a clue or background card. */
function inferButton(id) {
    const b = ui.building;
    if (b?.cards.includes(id)) return `<p class="infer"><span class="small muted">In your connection.</span> <span class="link small" data-unbuild="${id}">take it out</span></p>`;
    return `<p class="infer"><button data-infer="${id}" class="quiet" title="Propose an inference that starts from this card">${b?.cards.length ? 'Connect to this' : 'Infer from this'}</button></p>`;
}

/** The connection in progress, above whatever tab is open. */
function buildingBar() {
    const b = ui.building;
    if (!b) return '';
    let h = '<div class="building"><b>Building an inference</b> ';
    h += b.cards.map((x) => `<span class="chip">${link(x, shortName(x, 40))} <span class="x" data-unbuild="${x}">✕</span></span>`).join(' + ') || '<span class="small muted">open a clue or background card and press “Infer from this”</span>';
    if (game.opts.kind === 'on') {
        h += ` <label class="small">about <select id="build-kind"><option value="">…choose</option>${Object.entries(CONCLUSION_KINDS).map(([k, label]) => `<option value="${k}" ${b.kind === k ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></label>`;
    }
    h += ` <button class="quiet small" data-build-clear>Done</button>`;
    if (b.note) h += `<div class="small build-note">${b.note}</div>`;
    if (b.cards.length) h += stateForm();
    return `${h}</div>`;
}

/**
 * State it yourself (docs/ui.md Q2): a conclusion of the player's own from the cards connected, as an answer to a
 * question on the table (or not that answer). The game says whether it follows, with the background facts the cards
 * call on applied as the case applies them; it never says what does follow.
 */
function stateForm() {
    const st = ui.state ?? (ui.state = { slot: '', neg: '', value: '' });
    const opt = (v, label, cur) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(label)}</option>`;
    const slots = game.visibleSlots().filter((x) => game.knows(x.on) && game.settled(x.id) === null);
    const slot = slots.find((x) => x.id === st.slot);
    let h = `<div class="small state-form">Or state it yourself: <select id="st-slot">${opt('', 'a question…', st.slot)}${slots.map((x) => opt(x.id, `${shortName(x.on, 30)}: ${game.promptOf(x.id)}`, st.slot)).join('')}</select>`;
    if (slot) h += ` <select id="st-neg">${opt('', 'is', st.neg)}${opt('not', 'is not', st.neg)}</select> <select id="st-value">${opt('', 'which…', st.value)}${slot.domain.filter((v) => game.offered(slot.id, v)).map((v) => opt(v, valueName(slot.id, v), st.value)).join('')}</select> <button data-state-go="1" class="quiet">Does it follow?</button>`;
    return `${h}</div>`;
}
function runState() {
    const st = ui.state;
    const b = ui.building;
    if (!st?.slot || !st.value || !b?.cards.length) { b.note = 'Choose a question and an answer.'; renderTool(); return; }
    const formula = st.neg ? { ne: [st.slot, st.value] } : { eq: [st.slot, st.value] };
    const res = game.concludeFrom(b.cards, formula);
    if (res.ok) {
        b.note = `<span class="good">It follows:</span> ${link(res.id, shortName(res.id, 90))}`;
        toast(`New inference: ${esc(shortName(res.id, 70))}`);
        ui.state = null;
        b.cards = [];
        changed();
        return;
    }
    b.note = res.tooHard ? 'Too hard to check from here: try connecting fewer cards, or build the steps one at a time.'
        : res.contradiction ? 'These cards clash among themselves: one of them must be false.'
            : res.error ? esc(res.error) : 'It does not follow from these cards.';
    renderTool();
}

/** Try the connection as it stands, and say what came of it. */
function runPropose() {
    const b = ui.building;
    if (!b) return;
    if (!b.cards.length) { b.note = ''; renderTool(); return; }
    if (game.opts.kind === 'on' && !b.kind) { b.note = 'Choose what the conclusion would be about.'; renderTool(); return; }
    const res = game.propose(b.cards, b.kind);
    if (res.built.length) {
        b.note = `<span class="good">You inferred:</span> ${res.built.map((x) => link(x, shortName(x, 90))).join('; ')}${res.onto ? ' <span class="muted">— and these cards are onto something more.</span>' : ''}`;
        toast(`New inference: ${esc(shortName(res.built[0], 70))}`);
        if (!res.onto) b.cards = [];
        changed();
        return;
    }
    if (res.lacking) b.note = `You're onto something, but it needs knowledge you do not have yet.${game.background === BG_ASK ? ' Try asking what you know about the things involved.' : ''}`;
    else if (res.wrongKind) b.note = 'You\'re onto something, but the conclusion would not be about that.';
    else if (res.onto) b.note = res.more === 1 ? 'You\'re onto something: connect one more card.' : `You're onto something, but it needs ${res.more} more connections.`;
    // A lone card stays connected: the player may still state a conclusion of their own from it.
    else if (b.cards.length === 1) b.note = 'Nothing follows from that card on its own: connect another, or state a conclusion yourself.';
    else { const last = b.cards.pop(); b.note = `${esc(shortName(last, 50))} does not connect with the others.`; }
    renderTool();
}

function toolInferences() {
    const held = game.heldInferences().sort((a, b) => game.unlocked.get(a).at - game.unlocked.get(b).at);
    let h = '<p class="small muted">Conclusions drawn from the clues and what you know. You hold the ones you have built and the ones you have heard someone draw; until you doubt one, the game takes it as so. To build one, open a clue or background card and press “Infer from this”.</p>';
    if (game.helps('hints')) {
        const n = game.buildable().length;
        h += `<p class="${n ? '' : 'small muted'}">${n ? `<b>${n}</b> more can be built from what you hold.` : 'Nothing more can be built from what you hold yet.'}</p>`;
    }
    if (!held.length) return `${h}<p class="empty">No inferences yet.</p>`;
    h += '<ul class="list inferences">';
    for (const id of held) {
        const how = game.howHeld(id);
        const by = how?.how === 'built' ? 'you' : how?.how === 'stated' ? cardName(how.by) : how?.how === 'implicit' ? 'follows' : 'worked out';
        h += `<li class="${game.isSuspected(id) ? 'doubted' : ''}">${link(id, shortName(id, 140))} <span class="small muted">· ${esc(by)}, ${paraLabel(game.unlocked.get(id).para)}${game.isSuspected(id) ? ' · doubted' : ''}</span>`
            + `<div class="small muted">${esc(readingOf(model.cards.get(id).formula))}</div></li>`;
    }
    return `${h}</ul>`;
}
/** "Could it fit?": check the answer against everything trusted; when it does not fit, offer to doubt the claims in the way. */
function runFit(slot, value) {
    ui.fit = { slot, value };
    ui.menuNote = '<span class="muted">Checking…</span>';
    renderTool();
    later(() => {
        const r = game.plausible(slot, value);
        const aside = r.aside ? ` <span class="small muted">(Setting aside the claims in ${r.aside === 1 ? 'the clash' : `the ${r.aside} clashes`} listed under <span class="link" data-show-clashes>Questions</span>.)</span>` : '';
        if (r.plausible) ui.menuNote = `<span class="good">It could fit everything you trust so far.</span>${aside}`;
        else if (r.why === 'shape') ui.menuNote = '<span class="bad">Wrong kind of thing for this question.</span>';
        else ui.menuNote = `<span class="bad">It does not fit what you trust:</span>${chainHtml(r.conflict, { [slot]: value })}${aside}`;
        renderTool();
    }, 10);
}

/** Clues that together exclude something: each claim among them linked, with a way to doubt it; the rest named. */
function doubtableHtml(ids) {
    const claims = [...new Set(ids.map((k) => model.constraints.get(k).from_claim).filter(Boolean))];
    const rest = ids.filter((k) => !model.constraints.get(k).from_claim);
    const doubt = (c) => (game.suspected.has(c) ? '<span class="small muted">doubted</span>' : `<span class="link small" data-suspect="${c}">doubt it</span>`);
    return `${claims.map((c) => `${link(c, shortName(c, 70))} ${doubt(c)}`).join(' · ')}${rest.length ? (claims.length ? ` <span class="muted">(with: ${rest.map((k) => esc(model.constraints.get(k).label)).join(' · ')})</span>` : rest.map((k) => esc(model.constraints.get(k).label)).join(' · ')) : ''}`;
}
// Why the game set aside what it did (Game.clashes, docs/clashes.md): by the class of what weighed least.
const CLASH_WHY = {
    'others-inference': 'Someone else\'s reasoning gives way first.',
    heuristic: 'A rule of thumb gives way before what the story tells.',
    statement: 'Someone\'s word gives way before reasoning (a witness\'s word first, a confession last).',
    inference: 'Your own reasoning (and Holmes\'s) gives way last.',
};

/**
 * A set of clues that cannot all hold, with a way to doubt each claim in it. Given the clash as the game found it
 * (Easy's list), it says what the game set aside and why, and offers the others to doubt instead.
 */
function clashHtml(ids, clash = null) {
    if (!clash?.aside?.length) return `${chainHtml(ids)}<div class="small">One of the claims must be false.</div>`;
    const which = clash.tie ? 'the ones marked “set aside”: they weigh the same, so it cannot choose between them' : 'the one marked “set aside”';
    return `${chainHtml(ids, {}, clash.aside)}<div class="small">One of the claims must be false. Until you doubt one, the game sets aside ${which}. ${esc(clash.tie ? '' : CLASH_WHY[clash.why] ?? '')}</div>`;
}

// ---------- events ----------
function openCard(id) {
    ui.selected = id;
    ui.tab = 'card';
    ui.menu = null;
    ui.menuNote = '';
    renderTool();
    $('#tool').scrollTop = 0;
    // Shown with its new pieces highlighted; from now on they count as seen.
    if (game.knows(id)) game.markSeen(id);
    save();
}

function onStoryClick(e) {
    const m = e.target.closest('.m');
    const p = e.target.closest('p[data-p]');
    $('#pop').hidden = true;
    if (!p) return;
    if (game.collecting()) {
        const para = Number(p.dataset.p);
        const ids = m ? m.dataset.ids.split(' ').filter((id) => model.cards.has(id)) : [];
        const got = game.collect(para, ids).filter((id) => !['rules'].includes(model.cards.get(id).section));
        if (got.length) {
            toast(`Collected: ${got.map((id) => esc(shortName(id, 40))).join(', ')}`);
            changed();
        } else if (ids.length) {
            toast('You already have that.');
        } else toast('Nothing to note there.');
        return;
    }
    if (!m) return;
    const ids = m.dataset.ids.split(' ');
    const items = ids.map((id) => {
        if (model.cards.has(id)) return game.knows(id) ? `<span class="item link" data-card="${id}"><span class="kind">${kindOf(id)}</span>${esc(shortName(id, 60))}</span>` : '';
        if (id.startsWith('w.')) return `<span class="item link" data-window="${id}"><span class="kind">time</span>${esc(cardName(id))}</span>`;
        const q = model.data.questions.find((x) => x.id === id);
        if (q) return `<span class="item link" data-slot-open="${q.slot}"><span class="kind">question</span>${esc(game.questionText(q))}</span>`;
        return '';
    }).filter(Boolean);
    if (items.length === 1 && ids.length === 1) { $('#pop').innerHTML = items[0]; $('#pop').querySelector('.item').click(); return; }
    const pop = $('#pop');
    pop.innerHTML = items.join('');
    const r = m.getBoundingClientRect();
    pop.style.left = `${Math.min(r.left, window.innerWidth - 350)}px`;
    pop.style.top = `${r.bottom + 4}px`;
    pop.hidden = false;
}

document.addEventListener('click', (e) => game && run(() => onClick(e)));
function onClick(e) {
    // A click anywhere outside the settings panel closes it.
    const settings = document.querySelector('.settings');
    if (settings?.open && !e.target.closest('.settings')) settings.open = false;
    if (e.target.closest('#story')) { onStoryClick(e); return; }
    if (!e.target.closest('#pop')) $('#pop').hidden = true;
    const prompt = e.target.closest('[data-reread-prompt]');
    if (prompt) { const [from, to] = prompt.dataset.rereadPrompt.split('-').map(Number); ui.reread = { from, to, question: '' }; renderReader(); return; }
    if (e.target.closest('#reread-open')) { ui.reread = ui.reread ? null : { from: 1, to: game.read - 1, question: '' }; renderReader(); return; }
    if (e.target.closest('#rr-close')) { ui.reread = null; ui.rereadShown = null; renderStory(); return; }
    if (e.target.closest('#rr-go')) {
        const [from, to, question] = [+$('#rr-from').value, +$('#rr-to').value, $('#rr-q').value || null];
        if (!game.reread(from, to, question)) { ui.reread = { from, to, question, error: 'Choose paragraphs you have read, the first no later than the last.' }; renderReader(); return; }
        ui.reread = { from, to, question };
        ui.rereadShown = { from, to };
        renderStory();
        save();
        document.querySelector(`#story p[data-p="${from}"]`)?.scrollIntoView({ block: 'start' });
        return;
    }
    const readBtn = e.target.closest('#read, #read-scene, #read-deduction');
    if (readBtn) {
        // The paragraphs this read covers: the record's rows whose deadline falls in them are told (recordNews).
        ui.readFrom = game.read;
        const res = readBtn.id === 'read' ? game.advance() : readBtn.id === 'read-scene' ? game.readToNextScene() : game.readToNextDeduction();
        if (!game.collecting() && res.newCards?.length) {
            const shown = res.newCards.filter((c) => !['rules'].includes(model.cards.get(c).section));
            if (shown.length) toast(`New: ${shown.slice(0, 5).map((c) => esc(shortName(c, 30))).join(', ')}${shown.length > 5 ? ` and ${shown.length - 5} more` : ''}`);
        }
        changed();
        scrollStory();
        return;
    }
    const asking = e.target.closest('[data-ask]');
    if (asking) {
        const got = game.ask(asking.dataset.ask);
        toast(got.length ? `You recall ${got.length} fact${got.length > 1 ? 's' : ''} about it.` : 'Nothing in particular comes to mind.');
        changed();
        return;
    }
    const aside = e.target.closest('[data-setaside]');
    if (aside) { game.setAside(aside.dataset.setaside); changed(); return; }
    const back = e.target.closest('[data-putback]');
    if (back) { game.putBack(back.dataset.putback); changed(); return; }
    const inf = e.target.closest('[data-infer]');
    if (inf) {
        ui.building ??= { cards: [], kind: null, note: '' };
        if (!ui.building.cards.includes(inf.dataset.infer)) ui.building.cards.push(inf.dataset.infer);
        runPropose();
        return;
    }
    const unb = e.target.closest('[data-unbuild]');
    if (unb) {
        ui.building.cards = ui.building.cards.filter((x) => x !== unb.dataset.unbuild);
        ui.building.note = '';
        renderTool();
        return;
    }
    if (e.target.closest('[data-build-clear]')) { ui.building = null; ui.state = null; renderTool(); return; }
    if (e.target.closest('[data-state-go]')) { Object.assign(ui.state, { neg: $('#st-neg').value, value: $('#st-value').value }); runState(); return; }
    if (e.target.closest('[data-record-open]')) { ui.tab = 'record'; renderTool(); $('#tool').scrollTop = 0; return; }
    const tabOpen = e.target.closest('[data-tab-open]');
    if (tabOpen) { ui.tab = tabOpen.dataset.tabOpen; renderTool(); return; }
    if (e.target.closest('[data-show-clashes]')) {
        ui.tab = 'questions';
        renderTool();
        document.getElementById('clashes')?.scrollIntoView({ block: 'start' });
        return;
    }
    const d = e.target.closest('[data-suspect],[data-unsuspect],[data-clash]');
    if (d) {
        if (d.dataset.suspect) { game.suspect(d.dataset.suspect, d.dataset.kind || null); toast(`You now doubt: ${esc(shortName(d.dataset.suspect, 60))}`); }
        else if (d.dataset.unsuspect) game.unsuspect(d.dataset.unsuspect);
        else {
            ui.clash = { slot: d.dataset.clash, html: '<span class="muted">Checking everything you trust… (a few seconds)</span>' };
            renderTool();
            later(() => {
                const ids = game.contradiction();
                ui.clash = { slot: d.dataset.clash, html: ids ? `These cannot all be true: ${clashHtml(ids)}` : 'No clash found among what you trust.' };
                renderTool();
            }, 20);
            return;
        }
        ui.clash = null;
        changed();
        // Doubting from a "Could it fit?" answer: check again, so the player sees whether it fits now.
        if (ui.menu && ui.fit?.slot === ui.menu.slot && ui.fit.value === ui.menu.value) runFit(ui.fit.slot, ui.fit.value);
        return;
    }
    const t = e.target.closest('[data-card],[data-kind],[data-slot],[data-op],[data-expand],[data-timeline],[data-new-theory],[data-theory-current],[data-del-theory],[data-untheory],[data-slot-open],[data-goto],[data-window],[data-pen-cell],[data-pen-pick],[data-pen-add],[data-pen-toggle],[data-pen-erase],[data-follow-go],[data-unfollow],[data-split],[data-split-go],[data-unsplit],[data-move],[data-layer-check],[data-cpen-add],[data-split-toggle],[data-mark-prove],[data-mark-rule],[data-order-prove],[data-notice],[data-unnotice],[data-raise],[data-withdraw],[data-absence-file],[data-split-claim],[data-drop-open],[data-drop-go],[data-drop-cancel],[data-undrop],[data-weigh],[data-plan-seal],[data-plan-test],[data-unseal],.tab');
    if (!t) return;
    if (t.classList.contains('tab')) { ui.tab = t.dataset.tab; renderTool(); return; }
    if (t.dataset.card) { $('#pop').hidden = true; openCard(t.dataset.card); return; }
    if (t.dataset.slotOpen) {
        $('#pop').hidden = true;
        const s = model.slots.get(t.dataset.slotOpen);
        if (!game.knows(s.on)) { toast('You have not collected that card yet.'); return; }
        ui.focusSlot = s.id;
        openCard(s.on);
        renderTool();
        return;
    }
    if (t.dataset.window) { $('#pop').hidden = true; ui.tab = 'timeline'; ui.timeline = 'fabula'; ui.focusWindow = t.dataset.window; renderTool(); return; }
    if (t.dataset.goto) { document.querySelector(`#story p[data-p="${t.dataset.goto}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    if (t.dataset.kind !== undefined && t.closest('.filters')) { ui.kind = t.dataset.kind || null; renderTool(); return; }
    if (t.dataset.expand) { ui.expanded.add(t.dataset.expand); renderTool(); return; }
    if (t.dataset.timeline) { ui.timeline = t.dataset.timeline; renderTool(); return; }
    if (t.dataset.penCell) {
        for (const kv of t.dataset.penCell.split('|')) { const [k, v] = kv.split('='); ui.pen[k] = v; }
        renderTool();
        return;
    }
    if (t.dataset.penPick) { const [thing, time] = t.dataset.penPick.split('|'); Object.assign(ui.pen, { thing, time }); renderTool(); return; }
    if (t.dataset.penAdd) {
        Object.assign(ui.pen, { thing: $('#pen-thing').value || null, time: $('#pen-time').value || null, place: $('#pen-place').value || null });
        if (!ui.pen.thing || !ui.pen.time || !ui.pen.place) { toast('Choose who or what, when and where.'); renderTool(); return; }
        if (!game.pencilPlace(ui.pen.thing, ui.pen.time, ui.pen.place, { layer: ui.layer ?? 'mine' })) toast('That cannot be pencilled in here.');
        ui.layerFit = null;
        changed();
        return;
    }
    if (t.dataset.notice) {
        const res = game.notice(t.dataset.notice, $('#notice-because')?.value || null);
        if (!res.ok) toast(esc(res.reason));
        changed();
        return;
    }
    if (t.dataset.unnotice) { game.unnotice(t.dataset.unnotice); changed(); return; }
    if (t.dataset.raise) {
        const [id, n, x] = t.dataset.raise.split('|');
        const res = game.raise(id, Number(n), x);
        if (res.status === 'ruled-out') toast(`What you hold rules that out: ${chainHtml(res.used)}`);
        else if (res.status === 'established') toast('What you hold shows it: the step no longer counts, and this is why.');
        else if (res.ok) toast('Noted as a reservation: nothing you hold settles it, so the step still counts.');
        else toast(esc(res.reason));
        changed();
        return;
    }
    if (t.dataset.withdraw) { const [id, n, x] = t.dataset.withdraw.split('|'); game.withdraw(id, Number(n), x); changed(); return; }
    if (t.dataset.splitClaim) {
        const res = game.splitClaim(t.dataset.splitClaim);
        if (res.ok) toast(`Split into: ${res.parts.map((x) => link(x, shortName(x, 50))).join(' · ')}`); else toast(esc(res.reason));
        changed();
        return;
    }
    if (t.dataset.planSeal) {
        const f = ui.plan;
        readPlan();
        const tpl = CHECK_TEMPLATES[f.verb];
        const fields = Object.fromEntries(tpl.fields.map((x) => [x, f.fields[x]]));
        const answer = f.expect && f.slot && f.value ? { eq: [f.slot, f.value] } : null;
        const res = game.seal(f.verb, fields, { expect: f.expect || null, answer, theory: answer && f.theory ? f.theory : null });
        if (res.ok) { toast('Sealed. The story will tell.'); ui.plan = null; } else toast(esc(res.reason));
        changed();
        return;
    }
    if (t.dataset.planTest) { (ui.tested ??= new Set()).add(t.dataset.planTest); renderTool(); return; }
    if (t.dataset.unseal) { game.unseal(t.dataset.unseal); changed(); return; }
    if (t.dataset.absenceFile) {
        Object.assign(ui.absence, { expectation: $('#ab-exp').value || null, time: $('#ab-time').value || null, witness: $('#ab-witness').value || null });
        const { expectation, time, witness } = ui.absence;
        if (!expectation || !time || !witness) { toast('Choose what you would expect, when, and who or what would have noticed.'); renderTool(); return; }
        const res = game.fileAbsence(expectation, time, witness);
        if (res.ok) { toast(`Filed. ${res.existing ? 'You hold it already' : 'A new clue'}: ${link(res.id, shortName(res.id, 70))}`); ui.absence = null; }
        else toast(esc(res.reason));
        changed();
        return;
    }
    if (t.dataset.splitToggle) { ui.showSplits = !ui.showSplits; ui.splitting = null; renderTool(); return; }
    if (t.dataset.cpenAdd) {
        const card = t.dataset.cpenAdd;
        Object.assign(ui.cardPen, { card, time: $('#cpen-time').value || null, other: $('#cpen-other').value || null, aspect: $('#cpen-aspect')?.value ?? 'at' });
        const { time, other, aspect } = ui.cardPen;
        const thing = model.cards.get(card)?.kind === 'place' ? other : card;
        const place = thing === card ? other : card;
        if (!time || !other) { toast(`Choose when and ${thing === card ? 'what' : 'who or what'}.`); renderTool(); return; }
        if (!game.pencilPlace(thing, time, place, { layer: ui.layer ?? 'mine', aspect })) toast('That cannot be pencilled in here.');
        ui.layerFit = null;
        changed();
        return;
    }
    if (t.dataset.penToggle) { const [thing, time, value, struck, aspect = 'at'] = t.dataset.penToggle.split('|'); game.pencilPlace(thing, time, value, { struck: struck === '1', layer: ui.layer ?? 'mine', aspect }); ui.layerFit = null; changed(); return; }
    if (t.dataset.penErase) { const [thing, time, value, aspect = 'at'] = t.dataset.penErase.split('|'); game.erasePlace(thing, time, value, ui.layer ?? 'mine', aspect); ui.layerFit = null; changed(); return; }
    if (t.dataset.orderProve) {
        const [ev, part] = t.dataset.orderProve.split('|');
        const res = game.proveOrder(ev, part);
        if (res.ok) toast(res.card ? `Proven. A new card: ${link(res.card, shortName(res.card, 60))}` : 'Proven.');
        else toast(esc(res.reason ?? res.error ?? 'Not proven.'));
        changed();
        return;
    }
    if (t.dataset.markProve || t.dataset.markRule) {
        const [thing, time, value, aspect] = (t.dataset.markProve ?? t.dataset.markRule).split('|');
        const res = t.dataset.markProve ? game.proveMark(thing, time, value, aspect) : game.ruleOutMark(thing, time, value, aspect);
        if (res.ok && t.dataset.markProve) toast(res.card ? `Proven. A new card: ${link(res.card, shortName(res.card, 60))}` : 'Proven.');
        else if (res.ok) toast(res.proof ? 'Ruled out: your clues exclude it.' : 'Crossed out.');
        else toast(res.contradiction ? 'Some of the clues you trust clash: one of them must be false.' : esc(res.reason ?? res.error ?? 'Not proven.'));
        ui.layerFit = null;
        changed();
        return;
    }
    if (t.dataset.layerCheck) {
        const layer = ui.layer ?? 'mine';
        const r = game.checkLayer(layer);
        const skip = r.unchecked ? ` <span class="small muted">(${r.unchecked} of your marks are at times or for things none of your clues speaks of: not checked.)</span>` : '';
        // A theory's night, on Easy, is weighed for what it must disbelieve (docs/hypotheses.md, Q2).
        const html = r.cost ? `${weighMode() === 'names' ? costHtml(r.cost) + residueHtml(r.residue) + assumedHtml(r.assumed) : countsHtml(r.cost, r.residue, r.assumed.length)}${skip}`
            : r.fits ? `<span class="good">This night fits everything you trust so far.</span>${skip}` : `<span class="bad">This night does not fit what you trust:</span>${chainHtml(r.conflict, r.fixed)}${skip}`;
        ui.layerFit = { layer, html };
        renderTool();
        return;
    }
    if (t.dataset.followGo) { game.follow($('#follow-pick').value); changed(); return; }
    if (t.dataset.unfollow) { game.unfollow(t.dataset.unfollow); changed(); return; }
    if (t.dataset.split) { ui.splitting = t.dataset.split; renderTool(); return; }
    if (t.dataset.splitGo) { if (!game.splitTime(t.dataset.splitGo, $('#split-pick').value)) toast('That time cannot be split at that event.'); ui.splitting = null; changed(); return; }
    if (t.dataset.unsplit) { game.unsplitTime(t.dataset.unsplit); changed(); return; }
    if (t.dataset.move) { const [ev, time] = t.dataset.move.split('|'); game.placeEvent(ev, time || null); changed(); return; }
    if (t.dataset.newTheory) {
        const label = prompt('Name your theory', `Theory ${game.theories.length + 1}`);
        if (label) { ui.theory = game.addTheory(label); changed(); }
        return;
    }
    if (t.dataset.weigh) { (ui.weighed ??= new Set()).add(t.dataset.weigh); renderTool(); return; }
    if (t.dataset.dropOpen) { ui.dropping = t.dataset.dropOpen; renderTool(); return; }
    if (t.dataset.dropCancel) { ui.dropping = null; renderTool(); return; }
    if (t.dataset.dropGo) {
        const reason = $('#drop-reason').value;
        const res = game.drop(dropTarget(t.dataset.dropGo), reason, { rival: $('#drop-rival')?.value ?? null, cites: reason === 'card' && ui.selected ? [ui.selected] : [] });
        if (!res.ok) { toast(esc(res.reason)); return; }
        ui.dropping = null;
        changed();
        return;
    }
    if (t.dataset.undrop) { game.undrop(dropTarget(t.dataset.undrop)); changed(); return; }
    if (t.dataset.theoryCurrent) { ui.theory = t.dataset.theoryCurrent; renderTool(); return; }
    if (t.dataset.delTheory) { game.theories = game.theories.filter((x) => x.id !== t.dataset.delTheory); changed(); return; }
    if (t.dataset.untheory) {
        const [tid, slot] = t.dataset.untheory.split('|');
        delete game.theories.find((x) => x.id === tid).assignment[slot];
        changed();
        return;
    }
    if (t.dataset.slot) {
        const same = ui.menu?.slot === t.dataset.slot && ui.menu?.value === t.dataset.val;
        ui.menu = same ? null : { slot: t.dataset.slot, value: t.dataset.val };
        ui.menuNote = '';
        ui.fit = null;
        renderTool();
        return;
    }
    if (t.dataset.op) {
        const menu = t.closest('.menu');
        const slot = menu.dataset.menuSlot;
        const value = menu.dataset.menuVal;
        const op = t.dataset.op;
        if (op === 'strike') { game.strike(slot, value); ui.menu = null; changed(); }
        else if (op === 'circle') { game.circle(slot, value); ui.menu = null; changed(); }
        else if (op === 'uncircle') { game.uncircle(slot, value); ui.menu = null; changed(); }
        else if (op === 'unstrike') { game.unstrike(slot, value); ui.menu = null; changed(); }
        else if (op === 'unprove') { game.unprove(slot); ui.menu = null; changed(); }
        else if (op === 'unpropose') { game.removeCandidate(slot, value); ui.menu = null; changed(); }
        else if (op === 'rule' || op === 'prove') {
            ui.menuNote = '<span class="muted">Checking against everything you hold…</span>';
            renderTool();
            later(() => {
                const res = op === 'prove' ? game.prove(slot, value) : game.strike(slot, value);
                if (res.ok) {
                    ui.menu = null;
                    toast(`${op === 'prove' ? 'Proved' : 'Ruled out'}. It rests on ${res.used.length} of your clues and inferences.${op === 'prove' ? revisedNote(slot) : ''}`);
                    changed();
                } else {
                    ui.menuNote = `<span class="bad">Not yet: nothing you hold and trust ${op === 'prove' ? 'leaves only this answer' : 'rules it out'}.</span> <span class="small muted">Build the inference that would${game.clashes().length ? ', or resolve a clash' : ''}.</span>`;
                    renderTool();
                }
            }, 10);
        }
        else if (op === 'open') openCard(value);
        else if (op === 'why' || op === 'whynot') {
            ui.menuNote = '<span class="muted">Checking…</span>';
            renderTool();
            later(() => {
                const reasons = (v) => game.whyNot(slot, v).map((r) => esc(r.text)).join(' · ') || 'nothing yet';
                if (op === 'whynot') ui.menuNote = `Ruled out by: ${reasons(value)}`;
                else {
                    // The same reasons for every other answer are said once.
                    const others = model.slots.get(slot).domain.filter((v) => v !== value && game.offered(slot, v));
                    const groups = new Map();
                    for (const v of others) { const r = reasons(v); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(v); }
                    ui.menuNote = [...groups].slice(0, 6).map(([r, vs]) => `<div><b>${groups.size === 1 && vs.length > 1 ? 'Every other answer' : `Not ${vs.slice(0, 3).map((v) => esc(valueName(slot, v))).join(', ')}${vs.length > 3 ? ` and ${vs.length - 3} more` : ''}`}:</b> ${r}</div>`).join('') || 'Nothing else was ever on offer.';
                }
                renderTool();
            }, 10);
        }
        else if (op === 'theory') {
            game.theories.find((x) => x.id === ui.theory).assignment[slot] = value;
            ui.menuNote = `<span class="good">Added to the theory.</span>${revisedNote(slot)}`;
            save();
            renderTool();
        } else if (op === 'fit') runFit(slot, value);
    }
}
document.addEventListener('input', (e) => {
    if (e.target.id === 'card-search') {
        ui.search = e.target.value;
        const pos = e.target.selectionStart;
        renderTool();
        const box = $('#card-search');
        box.focus();
        box.setSelectionRange(pos, pos);
    }
});
document.addEventListener('change', (e) => game && run(() => onChange(e)));
/** The plan form's choices, read back into ui.plan before a re-render or a seal. */
function readPlan() {
    const f = ui.plan;
    const tpl = CHECK_TEMPLATES[f.verb];
    tpl.fields.forEach((x, i) => { const v = $(`#plan-${i}`)?.value; if (v !== undefined) f.fields[x] = v || undefined; });
    f.expect = $('#plan-expect')?.value ?? f.expect;
    f.slot = $('#plan-slot')?.value ?? (f.expect ? f.slot : '');
    f.value = $('#plan-value')?.value ?? '';
    f.theory = $('#plan-theory')?.value ?? '';
}
function onChange(e) {
    if (e.target.id?.startsWith('plan-')) {
        if (e.target.id === 'plan-verb') ui.plan = { verb: e.target.value, fields: {}, expect: '', slot: '', value: '', theory: '' };
        else readPlan();
        if (['plan-verb', 'plan-expect', 'plan-slot'].includes(e.target.id)) renderTool();
        return;
    }
    if (e.target.id === 'cpen-aspect') { Object.assign(ui.cardPen, { aspect: e.target.value, other: null, time: $('#cpen-time')?.value || null }); renderTool(); return; }
    if (e.target.id === 'layer-pick') { ui.layer = e.target.value; ui.layerFit = null; renderTool(); return; }
    if (e.target.id === 'doubt-reason') { game.setDoubtReason(e.target.dataset.reasonFor, e.target.value || null); changed(); return; }
    if (e.target.id === 'build-kind') { ui.building.kind = e.target.value || null; runPropose(); return; }
    if (e.target.id === 'st-slot') { ui.state = { slot: e.target.value, neg: '', value: '' }; renderTool(); return; }
    if (e.target.dataset.add) {
        const slot = e.target.dataset.add;
        const s = model.slots.get(slot);
        const typed = e.target.value.trim().toLowerCase();
        const v = s.domain.find((x) => valueName(slot, x).toLowerCase() === typed);
        if (v) { game.addCandidate(slot, v); changed(); return; }
        // Not in the slot's domain: is it a card of the wrong kind?
        const other = [...game.unlocked.keys()].find((k) => cardName(k).toLowerCase() === typed);
        toast(other ? 'That is not the right kind of thing for this question.' : 'No card of yours by that name.');
    }
    if (['difficulty', 'pace', 'autopace'].includes(e.target.id) || e.target.id.startsWith('opt-')) {
        const state = game.save();
        const opts = e.target.id === 'difficulty'
            ? { ...(PRESETS[e.target.value] ?? game.opts), ...Object.fromEntries(READER_OPTIONS.map((k) => [k, game.opts[k]])) }
            : { ...game.opts, ...(e.target.id.startsWith('opt-') && { [e.target.id.slice(4)]: e.target.value }) };
        // Answers are kept differently by who works them out, how they are listed and how they are crossed out.
        if (['solver', 'answers', 'crossOut'].some((k) => opts[k] !== game.opts[k]) && game.marks.size) {
            if (!confirm('This change clears your answers (they are kept differently under it). Your place in the story, your cards and your inferences are kept.')) { render(); return; }
            state.marks = [];
        }
        // Starting to collect cards by clicking: the cards already dealt count as collected.
        if (opts.cards === 'collect' && !game.collecting()) state.collected = [...game.unlocked].map(([id, u]) => [id, u.para]);
        state.options = opts;
        state.pace = $('#pace').value;
        state.autoPace = $('#autopace').value;
        ui.building = null;
        game.load(state);
        changed();
    }
}
$('#reset').addEventListener('click', () => run(() => {
    if (!confirm('Start the case over? Your place, marks and theories will be lost.')) return;
    game.reset();
    ui.selected = null;
    changed();
}));

// ---------- difficulty options ----------
// Labels for OPTIONS (engine/game.js), in its order of values.
const OPTION_UI = {
    solver: ['Who works out the answers', { game: 'The game', player: 'You' }, 'The game: it works out what your clues allow and settles each question itself; you read and watch. You: you rule answers out and prove them.'],
    cards: ['Cards', { dealt: 'Dealt as you read', collect: 'Collected by clicking the text' }, 'Dealt: a card comes as the story first mentions it. Collected: you collect a card only by clicking the words in the story that mention it.'],
    answers: ['Answers to a question', { listed: 'All listed', propose: 'You propose them' }, 'All listed: every possible answer you have met is listed. You propose them: the list starts empty and you add the answers you think possible.'],
    crossOut: ['Crossing out', { pencil: 'Freely, in pencil', checked: 'Checked by the game' }, 'In pencil: cross out what you like. Checked: an answer is ruled out only if what you hold and trust rules it out (the game checks).'],
    greying: ['Answers your clues rule out', { on: 'Greyed out', off: 'Not shown' }, 'Greyed out: the game greys the answers your clues already rule out, and offers “Could it fit?” on each answer and a check on each theory.'],
    clashes: ['Clashes among your clues', { on: 'Listed', off: 'Not listed' }, 'Listed: the Questions tab lists the clues you trust that cannot all be true.'],
    weigh: ['Weighing theories', { names: 'What and which', counts: 'How much', asked: 'When you ask' }, 'What and which: each theory shows what it needs you to disbelieve, what it goes against, and which odd things it leaves unexplained. How much: only the counts. When you ask: nothing until you weigh a theory, then the counts.'],
    hints: ['Hints', { story: 'Also the story\'s own signals', on: 'How many, and where to start', off: 'None' }, 'How many: the Inferences tab counts how many more you could build; when the story waits on a deduction, it names the cards to start from. The story\'s own signals: the Questions tab also lists what Holmes visibly attends to, and the story points you back to a passage to re-read where it does so itself.'],
    kind: ['Building an inference', { off: 'Connect the cards', on: 'Also name what it is about' }, 'Also name it: you say whether the conclusion is about who, when, where, what, why, or whether something is so.'],
    connect: ['Background in inferences', { implicit: 'Needed in hand', connect: 'Connected too' }, 'Needed in hand: connect an inference\'s clues; the background facts it rests on need only be known. Connected too: background facts are cards to connect like clues.'],
    background: ['Background facts', { start: 'All at once', relevant: 'When relevant', ask: 'When asked' }, 'General knowledge a reader of the time had. All at once: a reference book from the start. When relevant: each appears where the story first touches its subject. When asked: open a card and ask what you know about it.'],
    supplied: ['Background you would not know', { offered: 'Supplied by the game', withheld: 'Only where the story says it' }, 'The background facts a reader like you would not bring to the story. Supplied: they arrive like any other, marked as supplied. Only where the story says it: each comes when the story states it, often late, and some never.'],
    reader: ['You read as', { modern: 'A reader of today', 1892: 'A reader of 1892', racing: 'A racing man of 1892' }, 'What you bring to the story. The background facts such a reader would not know are marked as supplied by the game.'],
    irrelevant: ['Cards the solution does not need', { none: 'None', few: 'One in four', half: 'Half', most: 'Three in four', all: 'All' }, 'How many of the cards with no part in the solution you get at all (the people, places, things and facts that are only colour). The rest are left out of the game: no card, and nothing to click in the text.'],
};
function buildOptions() {
    $('#options').innerHTML = Object.entries(OPTIONS).map(([k, values]) => {
        const [label, names, help] = OPTION_UI[k];
        return `<label title="${esc(help)}">${esc(label)}<select id="opt-${k}">${values.map((v) => `<option value="${v}">${esc(names[v])}</option>`).join('')}</select></label>`;
    }).join('');
}

// ---------- start ----------
model = await loadCase(CASE);
story = model.story;
R = makeReadings({
    model,
    knows: (id) => game.knows(id),
    offered: (slot, v) => game.offered(slot, v),
    nameOf: (id) => game.nameOf(id),
    promptOf: (slot) => game.promptOf(slot),
    cardName: (id) => cardName(id),
    valueName: (slot, v) => valueName(slot, v),
});
buildOptions();
const saved = restore();
const defaults = model.data.settings_defaults ?? {};
// The solver's worker: the page answers quick checks itself and hands the slow ones over.
const client = workerClient(new Worker(new URL('../engine/solverWorker.js', import.meta.url), { type: 'module' }));
model.wrapProblem = (local, args) => { client.init(args); return new RemoteProblem(local, client); };
rebuildProblem(model);
run(() => {
    game = new Game(model, { difficulty: defaults.difficulty ?? MEDIUM, pace: defaults.pace ?? 'free', state: saved?.game ?? null });
    ui.selected = saved?.selected ?? null;
    renderNow();
    scrollStory();
});
