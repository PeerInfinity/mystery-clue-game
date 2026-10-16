// The casebook page: read the story a paragraph at a time; collect cards as they are mentioned (or, in Hard,
// by clicking the text); for every open question rule out what the evidence excludes; test theories.
// All the logic is in engine/; this file only draws and dispatches.

import { loadCase } from '../engine/loadCase.js';
import { makeReadings } from './readings.js';
import { evaluate } from '../engine/logic.js';
import { rebuildProblem } from '../engine/caseModel.js';
import { RemoteProblem, workerClient, settle } from '../engine/remoteProblem.js';
import { Game, MEDIUM, CUSTOM, WAIT, BG_START, BG_ASK, CONCLUSION_KINDS, OPTIONS, PLAYER_OPTIONS, PRESETS } from '../engine/game.js';

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
const ui = { tab: 'card', selected: null, kind: null, search: '', menu: null, menuNote: '', expanded: new Set(), timeline: 'fabula', theory: null, focusWindow: null, focusSlot: null, fit: null, building: null };
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
        h += `<p class="${i === 0 ? 'title' : ''}${i === game.read - 1 && i > 0 ? ' latest' : ''}" data-p="${i}">${body}</p>`;
    }
    const top = el.scrollTop;
    el.innerHTML = h;
    el.scrollTop = top;
    renderReader();
}

function renderReader() {
    const el = $('#reader');
    if (game.finished()) { el.innerHTML = '<span class="muted">The end.</span>'; return; }
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
    el.innerHTML = `<button id="read" ${blocked ? 'disabled' : ''}>Next paragraph</button>${sceneJump}${jump}<span class="muted small">${game.read - 1} of ${story.paragraphs.length - 1} paragraphs</span>${note}`;
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
    $('#tool').innerHTML = buildingBar() + { card: toolCard, cards: toolCards, questions: toolQuestions, inferences: toolInferences, theories: toolTheories, timeline: toolTimeline, background: toolBackground }[ui.tab]();
    const infTab = document.querySelector('.tab[data-tab="inferences"]');
    infTab.hidden = game.autoSolves() && !game.heldInferences().length;
    const left = game.helps('hints') ? game.buildable().length : 0;
    infTab.textContent = `Inferences${left ? ` (${left} to build)` : ''}`;
    const tally = cardTally([...game.unlocked.keys()].filter((k) => !['glosses', 'rules'].includes(model.cards.get(k)?.section)));
    document.querySelector('.tab[data-tab="cards"]').textContent = `Cards${tallyText(tally) ? ` (${tallyText(tally)})` : ''}`;
    const clashes = game.helps('clashes') ? game.clashes().length : 0;
    document.querySelector('.tab[data-tab="questions"]').textContent = `Questions${clashes ? ` (${clashes} clash${clashes > 1 ? 'es' : ''})` : ''}`;
    if (ui.focusSlot) {
        document.getElementById(`slot-${ui.focusSlot.replace(/\./g, '-')}`)?.scrollIntoView({ block: 'center' });
        ui.focusSlot = null;
    }
    if (ui.focusWindow) {
        document.getElementById(`win-${ui.focusWindow.replace(/\./g, '-')}`)?.scrollIntoView({ block: 'center' });
        ui.focusWindow = null;
    }
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
        if (facts.length) {
            h += '<div class="bg"><div class="small muted">Background</div>';
            for (const n of facts) h += `<div class="bg-note">${esc(n.text)}</div>`;
            h += '</div>';
        }
        h += '</div>';
    });
    if (['claims', 'rules'].includes(c.section) && !game.autoSolves()) h += inferButton(id);
    if (c.section === 'inferences') {
        const how = game.howHeld(id);
        h += `<p class="small muted">${how?.how === 'built' ? 'You built this inference' : how?.how === 'stated' ? `${esc(cardName(how.by))} drew this inference` : how?.how === 'implicit' ? 'Follows from what you hold' : 'Worked out for you'} · ${paraLabel(game.unlocked.get(id).para)}</p>`;
        h += `<div class="small">Rests on: ${model.cards.get(id).premises.map((x) => (game.knows(x) ? link(x, shortName(x, 60)) : '<span class="muted">something you do not know yet</span>')).join(' · ')}</div>`;
    }
    if (c.section === 'claims' || c.section === 'inferences') {
        if (c.section === 'inferences') h += `<p class="means"><span class="small muted">What it means for the case:</span> ${esc(readingOf(c.formula))}</p>`;
        if (game.canSuspect(id)) {
            h += game.isSuspected(id)
                ? `<p class="doubt on">You suspect this may be false: it counts as fact nowhere, and “Is it true?” is open below. <button data-unsuspect="${id}" class="quiet">Trust it again</button></p>`
                : `<p class="doubt">Until you doubt it, the game takes this at its word. <button data-suspect="${id}">I suspect this may be false</button></p>`;
        }
        const form = model.claimForms.get(id);
        const f = c.section === 'claims' && form && model.constraints.get(form.trusted)?.formula;
        if (f) h += `<p class="means"><span class="small muted">What it means for the case:</span> ${esc(readingOf(f))}</p>`;
        const about = (c.about ?? []).filter((x) => game.knows(x));
        if (about.length) h += `<p class="small">About: ${about.map((x) => link(x)).join(', ')}</p>`;
    }

    if (game.canAsk(id)) {
        h += game.hasAsked(id)
            ? `<p class="small muted">${(game.rulesOn.get(id) ?? []).some((r) => game.knows(r)) ? 'You have recalled what you know about this (under Background above); more will come to mind as the story goes on.' : 'You asked: nothing in particular comes to mind yet.'}</p>`
            : `<p><button data-ask="${id}">What do I know about this?</button></p>`;
    }
    const u = game.unlocked.get(id);
    h += `<p class="small muted">You collected this card at ${paraLabel(u.para)} (card ${u.at + 1}).${c.section === 'events' && model.slots.has(`${id}.time`) && game.settled(`${id}.time`) ? ` It happened: ${esc(cardName(game.settled(`${id}.time`)))}.` : ''}</p>`;

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
    return `<span class="chip ${cls}${circled}${picked}" data-slot="${slot}" data-val="${esc(v)}">${esc(valueName(slot, v))}${cls === 'proved' ? ' <span class="x">✓</span>' : ''}</span>`;
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
    return `<div class="menu" data-menu-slot="${s.id}" data-menu-val="${esc(v)}"><b>${esc(valueName(s.id, v))}</b>${b.join('')}${ui.menuNote ? `<div class="why">${ui.menuNote}</div>` : ''}</div>`;
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

function toolCards() {
    const known = [...game.unlocked.keys()].filter((id) => !['glosses', 'rules'].includes(model.cards.get(id)?.section));
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
    return h;
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
        for (const r of list.sort((a, b) => model.cards.get(a).text.localeCompare(model.cards.get(b).text))) h += `<li>${esc(model.cards.get(r).text)}</li>`;
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

/** Easy: the clashes among the clues the player trusts, each as a chain, and the ones a doubt has resolved. */
function clashesHtml() {
    const list = game.clashes();
    const resolved = game.resolvedClashes();
    if (!list.length && !resolved.length) return '';
    let h = `<h3 class="section" id="clashes">Clashes${list.length ? ` (${list.length})` : ''}</h3>`;
    if (list.length) {
        h += '<p class="small muted">Clues you trust that cannot all be true. Until you doubt one, the game sets aside the claims caught in a clash when it checks answers, so a clash here does not rule out answers elsewhere.</p>';
        list.forEach((cl, i) => { h += `<div class="clash"><b>Clash ${i + 1}</b>${clashHtml(cl.ids)}</div>`; });
    }
    if (resolved.length) {
        h += `<details class="resolved"><summary class="small">${resolved.length} resolved by a doubt</summary><ul class="list">`;
        for (const rc of resolved) h += `<li>${rc.doubted.map((x) => `You doubt ${link(x, shortName(x, 80))} <span class="link small" data-unsuspect="${x}">trust it again</span>`).join('; ')}</li>`;
        h += '</ul></details>';
    }
    return h;
}

function toolTheories() {
    let h = '<p class="small muted">A theory is a set of answers held together. It fits until a clue or inference you hold breaks it. To add answers, pick an answer on any question and choose “Add to theory”.</p>';
    const all = game.visibleTheories();
    for (const t of all) {
        const res = game.checkTheory(t);
        h += `<div class="theory ${res.fits ? 'fits' : 'broken'}"><b>${esc(t.story ? `${t.held_by.filter((x) => game.knows(x)).map(cardName).join(', ')}: ` : '')}</b>${esc(t.label)}`;
        h += `<ul class="small">${Object.entries(t.assignment).map(([s, v]) => `<li><span class="link" data-slot-open="${s}">${esc(game.promptOf(s))}</span> → ${esc(valueName(s, v))}${t.story ? '' : ` <span class="link" data-untheory="${t.id}|${s}">remove</span>`}</li>`).join('') || '<li class="empty">no answers yet</li>'}</ul>`;
        // The inferences the theory rests on (the ones its holders drew) and, among those the player holds, the
        // ones its answers agree with and the ones they go against.
        const restsOn = (t.rests_on ?? []).filter((x) => game.knows(x));
        if (restsOn.length) h += `<div class="small">Rests on: ${restsOn.map((x) => link(x, shortName(x, 70))).join(' · ')}</div>`;
        const assign = new Map(Object.entries(t.assignment));
        const agree = [];
        const against = [];
        for (const k of game.heldInferences()) {
            if (game.isSuspected(k) || restsOn.includes(k)) continue;
            const v = evaluate(model.cards.get(k).formula, assign, model.timeOrder);
            if (v === true) agree.push(k); else if (v === false) against.push(k);
        }
        if (agree.length) h += `<div class="small">Agrees with your inferences: ${agree.map((x) => link(x, shortName(x, 60))).join(' · ')}</div>`;
        if (against.length) h += `<div class="small bad">Goes against your inferences: ${against.map((x) => link(x, shortName(x, 60))).join(' · ')}</div>`;
        if (game.assisted()) {
            h += res.fits ? '<div class="small good">Fits everything you hold so far.</div>'
                : `<div class="small bad">Broken by what you hold:</div><div class="small">${chainHtml(res.conflict, t.assignment)}</div>`;
        } else {
            h += res.fits ? '<div class="small good">Nothing you hold rules it out yet.</div>' : '<div class="small bad">Something you hold and trust rules it out. Find it: try ruling out its answers.</div>';
        }
        if (!t.story) h += `<div class="small"><span class="link" data-theory-current="${t.id}">${ui.theory === t.id ? '★ new answers go here' : 'add answers here'}</span> · <span class="link" data-del-theory="${t.id}">delete</span></div>`;
        h += '</div>';
    }
    return `${h}<div class="row"><button data-new-theory="1">New theory</button></div>`;
}

// ---------- the board: where things were, when (world model; engine/timeline.js) ----------
const BOARD_KINDS = ['person', 'animal', 'group', 'object'];
const thingChip = (x, time) => {
    if (x.theory) return `<span class="chip theory" title="The theory's answers put it here">${esc(shortName(x.thing, 24))}</span>`;
    const cls = x.given ? 'given' : x.pencil ? `pencil${x.struck ? ' struck' : ''}` : 'open';
    const name = esc(shortName(x.thing, 24));
    if (!x.pencil) return `<span class="chip ${cls}" title="${x.given ? 'Your clues place it here' : 'Not placed'}">${x.given ? name : `<span class="link" data-pen-pick="${esc(`${x.thing}|${time}`)}">${name}</span>`}</span>`;
    return `<span class="chip ${cls}" title="Your pencil mark: click to ${x.struck ? 'restore' : 'strike'} it"><span class="link" data-pen-toggle="${esc(`${x.thing}|${time}|${x.value}|${x.struck ? 0 : 1}`)}">${name}</span> <span class="link x" data-pen-erase="${esc(`${x.thing}|${time}|${x.value}`)}" title="Erase">×</span></span>`;
};
function boardHtml(layout) {
    const pen = ui.pen ?? (ui.pen = { thing: null, time: null, place: null });
    const layers = game.layers();
    if (!layers.some((l) => l.id === ui.layer)) ui.layer = 'mine';
    const layer = ui.layer;
    const opt = (v, label, cur) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(label)}</option>`;
    const times = game.timelineTimes();
    const shown = times.filter((t) => t.kind !== 'boundary');
    const followed = game.followedThings(ui.layer ?? 'mine');
    const people = [...game.unlocked.keys()].filter((id) => BOARD_KINDS.includes(model.cards.get(id)?.kind) && !game.isHidden(id));
    const places = [...game.unlocked.keys()].filter((id) => model.cards.get(id)?.kind === 'place' && !game.isHidden(id));
    let h = '<p class="small muted">Where everyone and everything was, when. Your clues place some of it (solid); the rest is yours to pencil in (dashed: several marks are several guesses; click a mark to strike it). Click a cell to start a mark there. Each theory you have met is a night of its own: choose it as the layer to see where its answers put people (dotted), and pencil its night.</p>';
    h += `<div class="row small">Layer <select id="layer-pick">${layers.map((l) => opt(l.id, l.id === 'mine' ? l.label : `${l.story ? 'Theory' : 'Your theory'}: ${l.label.length > 70 ? `${l.label.slice(0, 69)}…` : l.label}`, layer)).join('')}</select> <button data-layer-check="1" class="quiet">Does this night fit?</button></div>`;
    if (ui.layerFit?.layer === layer) h += `<div class="note block">${ui.layerFit.html}</div>`;
    h += `<div class="pen row small">Pencil in <select id="pen-thing">${opt('', 'who or what…', pen.thing)}${people.map((id) => opt(id, shortName(id, 30), pen.thing)).join('')}</select>
        at <select id="pen-time">${opt('', 'when…', pen.time)}${shown.map((t) => opt(t.id, `${'· '.repeat(t.depth)}${t.label}`, pen.time)).join('')}</select>
        in <select id="pen-place">${opt('', 'where…', pen.place)}${places.map((id) => opt(id, shortName(id, 30), pen.place)).join('')}${opt('elsewhere', 'somewhere else', pen.place)}</select>
        <button data-pen-add="1">Pencil it in</button></div>`;
    const unfollowed = people.filter((id) => !followed.includes(id));
    h += `<div class="small follow">Following ${followed.map((id) => `${link(id, shortName(id, 24))} <span class="link x" data-unfollow="${esc(id)}" title="Stop following">×</span>`).join(', ') || 'no one yet'}.
        ${unfollowed.length ? `Follow <select id="follow-pick">${unfollowed.map((id) => opt(id, shortName(id, 30), null)).join('')}</select> <button data-follow-go="1" class="quiet">Follow</button>` : ''}</div>`;
    const splitCtl = (t) => {
        if (t.kind === 'boundary') return '';
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
                    const back = game.board.placed.some((p) => p.event === e) && t.kind === 'part' ? ` <span class="link small" data-move="${esc(`${e}|`)}" title="Back to the whole window">↑</span>` : '';
                    return `<div class="ev" title="${esc(cardName(e))}">• ${link(e, shortName(e, 26))}${mv}${back}</div>`;
                }).join('');
                const pick = t.kind === 'boundary' || c === 'unknown' ? '' : ` data-pen-cell="${esc(`time=${t.id}|place=${c}`)}"`;
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
                if (c.at) bits.push(`<span class="chip given">${esc(c.at === 'elsewhere' ? 'somewhere else' : shortName(c.at, 20))}</span>`);
                for (const m of c.pencil.filter((x) => x.theory)) bits.push(`<span class="chip theory" title="The theory's answers put it here">${esc(m.value === 'elsewhere' ? 'somewhere else' : shortName(m.value, 20))}</span>`);
                for (const m of c.pencil.filter((x) => !x.theory)) bits.push(`<span class="chip pencil${m.struck ? ' struck' : ''}"><span class="link" data-pen-toggle="${esc(`${r.thing}|${c.time}|${m.value}|${m.struck ? 0 : 1}`)}">${esc(m.value === 'elsewhere' ? 'somewhere else' : shortName(m.value, 20))}</span> <span class="link x" data-pen-erase="${esc(`${r.thing}|${c.time}|${m.value}`)}">×</span></span>`);
                if (c.held) bits.push(`<span class="small muted">held by ${esc(cardName(c.held))}</span>`);
                for (const k of c.conditions) bits.push(`<span class="small muted">${k.value === 'true' ? esc(k.id) : `not ${esc(k.id)}`}</span>`);
                h += `<td data-pen-cell="${esc(`thing=${r.thing}|time=${c.time}`)}">${bits.join(' ')}</td>`;
            }
            h += '</tr>';
        }
        h += '</tbody></table></div>';
    }
    return h;
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
                const p = game.disclosure(c);
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
    $('#progress').textContent = `${found} cards · ${settledQ} of ${raised} questions settled`;
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
function clueHtml(id) {
    const k = model.constraints.get(id);
    const c = k.from_claim;
    if (!c) return esc(k.label);
    return `${link(c, shortName(c, 90))} ${game.suspected.has(c) ? '<span class="small muted">doubted</span>' : `<span class="link small" data-suspect="${c}">doubt it</span>`}`;
}

/**
 * Clues that cannot all hold, replayed as numbered steps: what each one narrows ("so the owner of the bill is
 * John Straker"), ending where some question is left with nothing. `fixed` is an assumed answer to start from.
 */
function chainHtml(ids, fixed = {}) {
    const replay = game.chain(ids, fixed);
    if (!replay.steps.length) return doubtableHtml(ids);
    const { suppose, lines, unused, contradiction } = R.chainLines(ids, replay, fixed);
    const say = (x) => `${esc(x.text)}${x.bad ? ' <span class="bad">✗</span>' : ''}`;
    let h = '<ol class="chain">';
    for (const t of suppose) h += `<li class="suppose">${esc(t)}</li>`;
    for (const l of lines) h += `<li>${clueHtml(l.id)}${l.says.length ? `<div class="so">so ${l.says.map(say).join('; and ')}</div>` : ''}</li>`;
    h += '</ol>';
    if (!contradiction || unused.length) h += `<div class="small muted">${contradiction ? 'Also involved' : 'Together with'}: ${unused.map(clueHtml).join(' · ')}</div>`;
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
    return `${h}</div>`;
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
    else if (b.cards.length === 1) { b.note = 'Nothing follows from that card.'; b.cards = []; }
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
/** A set of clues that cannot all hold, with a way to doubt each claim in it. */
function clashHtml(ids) {
    return `${chainHtml(ids)}<div class="small">One of the claims must be false.</div>`;
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
    const readBtn = e.target.closest('#read, #read-scene, #read-deduction');
    if (readBtn) {
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
    if (e.target.closest('[data-build-clear]')) { ui.building = null; renderTool(); return; }
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
        if (d.dataset.suspect) { game.suspect(d.dataset.suspect); toast(`You now doubt: ${esc(shortName(d.dataset.suspect, 60))}`); }
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
    const t = e.target.closest('[data-card],[data-kind],[data-slot],[data-op],[data-expand],[data-timeline],[data-new-theory],[data-theory-current],[data-del-theory],[data-untheory],[data-slot-open],[data-goto],[data-window],[data-pen-cell],[data-pen-pick],[data-pen-add],[data-pen-toggle],[data-pen-erase],[data-follow-go],[data-unfollow],[data-split],[data-split-go],[data-unsplit],[data-move],[data-layer-check],.tab');
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
    if (t.dataset.penToggle) { const [thing, time, value, struck] = t.dataset.penToggle.split('|'); game.pencilPlace(thing, time, value, { struck: struck === '1', layer: ui.layer ?? 'mine' }); ui.layerFit = null; changed(); return; }
    if (t.dataset.penErase) { const [thing, time, value] = t.dataset.penErase.split('|'); game.erasePlace(thing, time, value, ui.layer ?? 'mine'); ui.layerFit = null; changed(); return; }
    if (t.dataset.layerCheck) {
        const layer = ui.layer ?? 'mine';
        const r = game.checkLayer(layer);
        const skip = r.unchecked ? ` <span class="small muted">(${r.unchecked} of your marks are at times or for things none of your clues speaks of: not checked.)</span>` : '';
        ui.layerFit = { layer, html: r.fits ? `<span class="good">This night fits everything you trust so far.</span>${skip}` : `<span class="bad">This night does not fit what you trust:</span>${chainHtml(r.conflict, r.fixed)}${skip}` };
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
                    toast(`${op === 'prove' ? 'Proved' : 'Ruled out'}. It rests on ${res.used.length} of your clues and inferences.`);
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
            ui.menuNote = '<span class="good">Added to the theory.</span>';
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
function onChange(e) {
    if (e.target.id === 'layer-pick') { ui.layer = e.target.value; ui.layerFit = null; renderTool(); return; }
    if (e.target.id === 'build-kind') { ui.building.kind = e.target.value || null; runPropose(); return; }
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
            ? { ...(PRESETS[e.target.value] ?? game.opts) }
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
    hints: ['Inference hints', { on: 'How many, and where to start', off: 'None' }, 'How many: the Inferences tab counts how many more you could build; when the story waits on a deduction, it names the cards to start from.'],
    kind: ['Building an inference', { off: 'Connect the cards', on: 'Also name what it is about' }, 'Also name it: you say whether the conclusion is about who, when, where, what, why, or whether something is so.'],
    connect: ['Background in inferences', { implicit: 'Needed in hand', connect: 'Connected too' }, 'Needed in hand: connect an inference\'s clues; the background facts it rests on need only be known. Connected too: background facts are cards to connect like clues.'],
    background: ['Background facts', { start: 'All at once', relevant: 'When relevant', ask: 'When asked' }, 'General knowledge a reader of the time had. All at once: a reference book from the start. When relevant: each appears where the story first touches its subject. When asked: open a card and ask what you know about it.'],
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
