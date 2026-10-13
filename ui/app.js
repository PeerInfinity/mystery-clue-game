// The casebook page: read the story a paragraph at a time; collect cards as they are mentioned (or, in Hard,
// by clicking the text); for every open question rule out what the evidence excludes; test theories.
// All the logic is in engine/; this file only draws and dispatches.

import { loadCase } from '../engine/loadCase.js';
import { Game, TRIVIAL, EASY, HARD, WAIT } from '../engine/game.js';

const CASE = 'cases/silver-blaze';
const STORE = 'mystery-clue-game:silver-blaze:v2';
const KIND_GROUPS = [
    ['person', 'People'], ['animal', 'Animals'], ['group', 'Groups'], ['place', 'Places'],
    ['object', 'Things'], ['document', 'Documents'], ['events', 'Events'], ['claims', 'Clues'],
];
const CHIP_LIMIT = 30;

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let model;
let game;
let story;
const ui = { tab: 'card', selected: null, kind: null, search: '', menu: null, menuNote: '', expanded: new Set(), timeline: 'fabula', theory: null, focusWindow: null, focusSlot: null };
const cache = new Map();

// ---------- names ----------
function cardName(id) {
    const c = model.cards.get(id);
    if (!c) return model.windows.find((w) => w.id === id)?.label ?? model.data.questions.find((q) => q.id === id)?.text ?? id;
    if (c.section === 'entities') return c.name;
    if (c.section === 'events') return c.label;
    if (c.section === 'claims' || c.section === 'rules') return c.text;
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
    return { events: 'event', claims: 'clue', rules: 'background', glosses: 'background' }[c.section];
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

// ---------- the story ----------
function renderStory() {
    const el = $('#story');
    const hard = game.difficulty === HARD;
    el.classList.toggle('hard', hard);
    let h = '';
    for (let i = 0; i < game.read; i++) {
        const segs = story.segments(i);
        const body = segs.map((s) => {
            const ids = s.ids.filter((id) => model.cards.has(id) || s.kinds.includes('window') || s.kinds.includes('question'));
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
    const next = game.nextAction();
    const label = game.read === 1 ? 'Begin' : next ? `${next.cue} →` : 'Read on →';
    const blocked = blockers.length && game.pace === WAIT;
    let note = '';
    if (blockers.length) {
        const prompts = blockers.map((s) => {
            const c = game.routeById.get(s).concludes;
            const slot = model.slots.get(c.slot ?? c.formula.eq[0]);
            const text = `${shortName(slot.on, 60)} — ${slot.prompt}`;
            return game.knows(slot.on) ? `<span class="link" data-slot-open="${slot.id}">${esc(text)}</span>` : esc(text);
        });
        note = blocked
            ? `<div class="note block">Holmes has worked something out. Before reading on, settle: ${prompts.join('; ')}${blockers.some((s) => game.routeById.get(s).concludes.slot) ? ' (at least rule out what Holmes rules out)' : ''}</div>`
            : '<div class="note">Holmes is a step ahead of you here.</div>';
    }
    el.innerHTML = `<button id="read" ${blocked ? 'disabled' : ''}>${esc(label)}</button><span class="muted small">${game.read - 1} of ${story.paragraphs.length - 1} paragraphs</span>${note}`;
}

function scrollStory() {
    const el = $('#story');
    const last = el.querySelector('p.latest');
    if (last) el.scrollTop = last.offsetTop + last.offsetHeight - el.clientHeight + 24;
}

// ---------- tools ----------
function renderTool() {
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
    $('#tool').innerHTML = { card: toolCard, cards: toolCards, questions: toolQuestions, theories: toolTheories, timeline: toolTimeline }[ui.tab]();
    const updated = [...game.unlocked.keys()].filter((k) => !['glosses', 'rules'].includes(model.cards.get(k)?.section) && game.lastSeen.has(k) && game.hasNew(k)).length;
    document.querySelector('.tab[data-tab="cards"]').textContent = updated ? `Cards (${updated} updated)` : 'Cards';
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
<li>Everything the story mentions — people, places, things, events, statements — becomes a card. ${game.difficulty === HARD ? 'In Hard mode you collect a card by clicking the words in the story that mention it.' : 'Click the marked words in the story to open a card.'}</li>
<li>Cards have <b>open questions</b>: who did it, where, when, whose is it, is it true. Each question lists its possible answers, like pencil marks in sudoku${game.difficulty === HARD ? ' — in Hard mode you list them yourself' : ''}.</li>
<li>${game.difficulty === TRIVIAL ? 'Cross answers out; the game greys the ones your clues already rule out.' : 'Rule answers out by citing the clues and background notes that exclude them. The game checks the reasoning; any sufficient set of reasons is accepted.'}</li>
<li>When one answer is left, or you prove it outright, the question is settled.</li>
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
    if (c.section === 'entities') h += `<h2>${esc(c.name)}</h2>`;
    else if (c.section === 'events') h += `<h2>${esc(c.label)}</h2>`;
    else h += `<p class="desc">${esc(c.text)}</p>`;
    const names = [...new Set(story.spans.slice(0, game.read).flatMap((list, p) => list.filter((sp) => sp.kind === 'entity' && sp.ids.includes(id)).map((sp) => story.paragraphs[p].display.slice(sp.start, sp.end))))]
        .filter((n, i, all) => n.toLowerCase() !== (c.name ?? '').toLowerCase() && all.findIndex((m) => m.toLowerCase() === n.toLowerCase()) === i);
    if (names.length) h += `<div class="small muted">called: ${names.slice(0, 8).map(esc).join(' · ')}</div>`;
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
        const title = gi === 0 && c.section !== 'claims' ? 'First mentioned' : 'Then';
        h += `<div class="info ${isNew ? 'fresh' : ''}"><div class="info-head"><span>${title}</span> <span class="link small" data-goto="${g.para}">${paraLabel(g.para)}</span>${isNew ? ' <span class="new-badge">new</span>' : ''}</div>`;
        const bg = g.items.filter((it) => it.kind === 'background').sort((x, y) => (x.term ?? x.text).localeCompare(y.term ?? y.text));
        for (const it of g.items) {
            if (it.kind === 'intro') h += `<p class="desc">${esc(it.text)}</p>`;
            else if (it.kind === 'note') h += `<p>${esc(it.text)}</p><p class="quote">${esc(it.quote.replace(/\s+/g, ' '))}</p>`;
            else if (it.kind === 'clue') h += `<p>${link(it.claim, it.text)} <span class="small muted">· ${source(it)}</span></p>`;
            else if (it.kind === 'attestation') h += `<p class="small">${source(it)}${it.to && game.knows(it.to) ? ` to ${link(it.to)}` : ''}</p><p class="quote">${esc(it.quote.replace(/\s+/g, ' '))}</p>`;
        }
        if (bg.length) {
            h += '<div class="bg"><div class="small muted">Background</div>';
            for (const n of bg) h += `<div class="bg-note">${n.term ? `<b>${esc(n.term)}.</b> ` : ''}${esc(n.text)}</div>`;
            h += '</div>';
        }
        h += '</div>';
    });
    if (c.section === 'claims') {
        if (c.truth_slot) h += '<p class="small muted">People can be wrong, or lie: whether this is true is one of the questions below.</p>';
        const about = (c.about ?? []).filter((x) => game.knows(x));
        if (about.length) h += `<p class="small">About: ${about.map((x) => link(x)).join(', ')}</p>`;
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
            return p.includes(id) && (game.difficulty === HARD || p.length <= 8);
        })());
        if (placed.length || maybe.length) {
            h += '<h3 class="section">Where it fits</h3><ul class="list">';
            for (const s of placed) h += `<li class="good">✓ ${link(s.on)} — ${esc(s.prompt)}</li>`;
            for (const s of maybe) h += `<li>? ${link(s.on)} — ${esc(s.prompt)} <span class="small muted">(${game.pencil(s.id).length} candidates)</span></li>`;
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
        if (given) chips.push(`<span class="small muted">given by ${link(given.claim, shortName(given.claim, 60))}</span>`);
    } else {
        const pencil = game.pencil(s.id);
        let live = pencil;
        let ruled = [];
        if (game.difficulty === TRIVIAL) {
            if (!cache.has(s.id)) cache.set(s.id, game.openValues(s.id));
            const open = cache.get(s.id);
            live = pencil.filter((v) => open.includes(v));
            ruled = pencil.filter((v) => !open.includes(v));
            ruledCount = ruled.length;
        }
        const shown = ui.expanded.has(s.id) ? live : live.slice(0, CHIP_LIMIT);
        chips = shown.map((v) => chip(s.id, v, ''));
        if (live.length > shown.length) chips.push(`<span class="link more" data-expand="${s.id}">+ ${live.length - shown.length} more</span>`);
        if (ruled.length) {
            if (ui.expanded.has(`${s.id}|ruled`)) chips.push(...ruled.map((v) => chip(s.id, v, 'ruled')));
            else chips.push(`<span class="link more" data-expand="${s.id}|ruled">${ruled.length} your clues already rule out — show</span>`);
        }
    }
    const struckChips = struck.filter(([v]) => v !== settled).map(([v, p]) => chip(s.id, v, p.cited ? 'proved' : 'struck'));
    let state;
    if (settled !== null) state = given ? 'given' : 'settled';
    else if (game.difficulty === HARD) state = `${game.pencil(s.id).length} proposed`;
    else state = `${game.pencil(s.id).length} left${ruledCount ? `, ${ruledCount} ruled out by your clues` : ''}`;
    let h = `<div class="slot ${settled !== null ? 'settled' : ''}" id="slot-${s.id.replace(/\./g, '-')}"><div class="slot-head"><b>${esc(s.prompt)}</b><span class="state">${state}</span></div>`;
    h += `<div class="chips">${chips.join('') || '<span class="empty">no candidates yet</span>'}</div>`;
    if (game.difficulty === HARD && settled === null) {
        const options = s.domain.filter((v) => game.knows(v) || !model.cards.has(v));
        h += `<div class="chips"><input list="dl-${s.id}" data-add="${s.id}" placeholder="+ propose an answer" size="26"><datalist id="dl-${s.id}">${options.map((v) => `<option value="${esc(valueName(s.id, v))}">`).join('')}</datalist></div>`;
    }
    if (struckChips.length) h += `<div class="chips small"><span class="muted">ruled out:</span>${struckChips.join('')}</div>`;
    if (ui.menu?.slot === s.id) h += slotMenu(s, ui.menu.value);
    return `${h}</div>`;
}

function chip(slot, v, cls) {
    const picked = ui.menu?.slot === slot && ui.menu?.value === v ? ' picked' : '';
    return `<span class="chip ${cls}${picked}" data-slot="${slot}" data-val="${esc(v)}">${esc(valueName(slot, v))}${cls === 'proved' ? ' <span class="x">✓</span>' : ''}</span>`;
}

function slotMenu(s, v) {
    const m = game.marks.get(s.id);
    const st = m?.struck.get(v);
    const isProven = m?.proven?.value === v;
    const isGiven = !!game.given(s.id);
    const b = [];
    if (isGiven) b.push('<span class="small muted">Given by a clue.</span>');
    else if (isProven) b.push('<button data-op="unprove">Undo the proof</button>');
    else if (st) b.push('<button data-op="unstrike">Restore</button>');
    else {
        if (game.difficulty === TRIVIAL) b.push('<button data-op="strike">Cross out</button>');
        b.push('<button data-op="strike-why">Rule out, with evidence…</button>', '<button data-op="prove">Prove it\'s this…</button>');
        if (game.difficulty === TRIVIAL) b.push('<button data-op="fit" class="quiet">Could it fit?</button>');
        if (game.difficulty === HARD) b.push('<button data-op="unpropose" class="quiet">Take back</button>');
    }
    const mine = game.theories.find((t) => t.id === ui.theory);
    if (mine && !isGiven) b.push(`<button data-op="theory" class="quiet">Add to “${esc(mine.label)}”</button>`);
    if (model.cards.has(v) && game.knows(v)) b.push(`<button data-op="open" class="quiet">Open ${esc(shortName(v, 30))}</button>`);
    return `<div class="menu" data-menu-slot="${s.id}" data-menu-val="${esc(v)}"><b>${esc(valueName(s.id, v))}</b>${b.join('')}${ui.menuNote ? `<div class="why">${ui.menuNote}</div>` : ''}</div>`;
}

function toolCards() {
    const known = [...game.unlocked.keys()].filter((id) => !['glosses', 'rules'].includes(model.cards.get(id)?.section));
    const counts = {};
    for (const id of known) {
        const c = model.cards.get(id);
        const k = c.section === 'entities' ? c.kind : c.section;
        counts[k] = (counts[k] ?? 0) + 1;
    }
    let h = `<input type="search" id="card-search" placeholder="Search your cards…" value="${esc(ui.search)}">`;
    h += `<div class="filters"><button data-kind="" class="${ui.kind ? '' : 'on'}">All ${known.length}</button><button data-kind="new" class="${ui.kind === 'new' ? 'on' : ''}">Updated</button><button data-kind="unread" class="${ui.kind === 'unread' ? 'on' : ''}">Not yet opened</button>${KIND_GROUPS.filter(([k]) => counts[k]).map(([k, label]) => `<button data-kind="${k}" class="${ui.kind === k ? 'on' : ''}">${label} ${counts[k]}</button>`).join('')}</div>`;
    const q = ui.search.toLowerCase();
    const shown = known.filter((id) => {
        const c = model.cards.get(id);
        const k = c.section === 'entities' ? c.kind : c.section;
        return (!ui.kind || k === ui.kind || (ui.kind === 'new' && game.lastSeen.has(id) && game.hasNew(id)) || (ui.kind === 'unread' && !game.lastSeen.has(id))) && (!q || cardName(id).toLowerCase().includes(q));
    });
    h += shown.length ? `<ul class="list">${shown.map((id) => {
        const open = game.slotsOn(id).filter((s) => game.settled(s.id) === null).length;
        return `<li class="${ui.selected === id ? 'sel' : ''}"><span class="kind">${kindOf(id)}</span>${link(id, shortName(id, 90))}${!game.lastSeen.has(id) ? ' <span class="new-badge quiet">new</span>' : game.hasNew(id) ? ' <span class="new-badge">updated</span>' : ''}${open ? ` <span class="small muted">· ${open} open</span>` : ''}</li>`;
    }).join('')}</ul>` : `<p class="empty">${game.difficulty === HARD ? 'No cards yet. Click the words in the story that mention someone or something.' : 'No cards yet. Start reading.'}</p>`;
    return h;
}

function toolQuestions() {
    const raised = model.data.questions.filter((q) => game.questionRaised(q.id));
    if (!raised.length) return '<p class="empty">The story has not raised any questions yet.</p>';
    let h = '<p class="small muted">The questions the case turns on, as the story raises them.</p><ul class="list">';
    for (const q of raised) {
        const slot = model.slots.get(q.slot);
        const visible = game.knows(slot.on);
        const settled = game.settled(q.slot);
        const state = !visible ? (game.difficulty === HARD ? 'collect the card first' : '') : settled !== null ? esc(valueName(q.slot, settled)) : game.difficulty === HARD ? `${game.pencil(q.slot).length} proposed` : `${game.pencil(q.slot).length} left`;
        h += `<li class="q"><span>${visible ? `<span class="link" data-slot-open="${q.slot}">${esc(q.text)}</span>` : esc(q.text)}</span><span class="state ${settled !== null ? 'done' : ''}">${state}</span></li>`;
    }
    return `${h}</ul>`;
}

function toolTheories() {
    let h = '<p class="small muted">A theory is a set of answers held together. It fits until a clue you hold breaks it. To add answers, pick an answer on any question and choose “Add to theory”.</p>';
    const story_ = (model.data.theories ?? []).filter((t) => {
        const at = t.source?.length ? story.find(t.source[0]) : null;
        return at && at.para < game.read && Object.keys(t.assignment).every((s) => game.knows(model.slots.get(s).on));
    });
    const all = [...story_.map((t) => ({ ...t, story: true })), ...game.theories];
    for (const t of all) {
        const res = game.checkTheory(t);
        h += `<div class="theory ${res.fits ? 'fits' : 'broken'}"><b>${esc(t.story ? `${t.held_by.filter((x) => game.knows(x)).map(cardName).join(', ')}: ` : '')}</b>${esc(t.label)}`;
        h += `<ul class="small">${Object.entries(t.assignment).map(([s, v]) => `<li><span class="link" data-slot-open="${s}">${esc(model.slots.get(s).prompt)}</span> → ${esc(valueName(s, v))}${t.story ? '' : ` <span class="link" data-untheory="${t.id}|${s}">remove</span>`}</li>`).join('') || '<li class="empty">no answers yet</li>'}</ul>`;
        if (game.difficulty === TRIVIAL) {
            h += res.fits ? '<div class="small good">Fits everything you hold so far.</div>'
                : `<div class="small bad">Broken by your clues:</div><ul class="small">${res.conflict.map((k) => `<li>${esc(model.constraints.get(k).label)}</li>`).join('')}</ul>`;
        } else {
            h += res.fits ? '<div class="small good">Nothing you hold rules it out yet.</div>' : '<div class="small bad">Something you hold rules it out. Find it: rule out one of its answers with evidence.</div>';
        }
        if (!t.story) h += `<div class="small"><span class="link" data-theory-current="${t.id}">${ui.theory === t.id ? '★ new answers go here' : 'add answers here'}</span> · <span class="link" data-del-theory="${t.id}">delete</span></div>`;
        h += '</div>';
    }
    return `${h}<div class="row"><button data-new-theory="1">New theory</button></div>`;
}

function toolTimeline() {
    const sub = (k, label) => `<button data-timeline="${k}" class="${ui.timeline === k ? 'on' : ''}">${label}</button>`;
    let h = `<div class="subtabs">${sub('fabula', 'What happened')}${sub('found', 'What you found')}${sub('told', 'What the story told')}</div><div class="timeline">`;
    if (ui.timeline === 'fabula') {
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

function render() {
    const settledQ = model.data.questions.filter((q) => game.settled(q.slot) !== null).length;
    const raised = model.data.questions.filter((q) => game.questionRaised(q.id)).length;
    const found = [...game.unlocked.keys()].filter((k) => !['glosses', 'rules'].includes(model.cards.get(k)?.section)).length;
    $('#progress').textContent = `${found} cards · ${settledQ} of ${raised} questions settled`;
    $('#difficulty').value = game.difficulty;
    $('#pace').value = game.pace;
    renderStory();
    renderTool();
}

// ---------- citing ----------
let citeFor = null;
const chosen = new Set();
function openCite(kind, slot, value) {
    citeFor = { kind, slot, value };
    chosen.clear();
    const s = model.slots.get(slot);
    $('#cite-title').textContent = kind === 'prove' ? `Prove: ${s.prompt} → ${valueName(slot, value)}` : `Rule out: ${s.prompt} — not ${valueName(slot, value)}`;
    $('#cite-help').textContent = 'Pick the clues and background notes that, together, settle it. Any sufficient set is accepted.';
    $('#cite-search').value = '';
    $('#cite-result').textContent = '';
    $('#cite-result').className = 'result';
    drawCite();
    $('#cite').showModal();
}
function drawCite() {
    const q = $('#cite-search').value.toLowerCase();
    // Background notes (period glosses and general facts alike) are all citable, so the list does not
    // reveal which of them matter.
    const notes = (model.data.glosses ?? []).filter((g) => g.attaches_to.some((x) => game.knows(x))).map((g) => g.id);
    const pool = [...[...game.unlocked.keys()].filter((k) => ['claims', 'rules'].includes(model.cards.get(k).section)), ...notes];
    const text = (k) => (model.cards.get(k).section === 'glosses' ? `${cardName(k)}: ${model.cards.get(k).text}` : cardName(k));
    const shown = pool.filter((k) => chosen.has(k) || !q || text(k).toLowerCase().includes(q));
    $('#cite-chosen').innerHTML = [...chosen].map((k) => `<span class="chip" data-unchoose="${k}">${esc(shortName(k, 50))} <span class="x">✕</span></span>`).join('') || '<span class="empty">nothing cited yet</span>';
    $('#cite-list').innerHTML = shown.slice(0, 250).map((k) => `<label><input type="checkbox" data-choose="${k}" ${chosen.has(k) ? 'checked' : ''}><span><span class="kind">${kindOf(k)}</span>${esc(text(k))}</span></label>`).join('');
}
function runCite() {
    const cited = [...chosen].filter((k) => model.cards.get(k).section !== 'glosses');
    const { kind, slot, value } = citeFor;
    const res = kind === 'prove' ? game.prove(slot, value, cited) : game.strike(slot, value, cited);
    const out = $('#cite-result');
    if (res.ok) {
        out.className = 'result ok';
        out.innerHTML = game.difficulty === TRIVIAL && res.used?.length ? `Accepted. It rests on: ${res.used.map((k) => esc(model.constraints.get(k).label)).join(' · ')}` : 'Accepted.';
        ui.menu = null;
        changed();
    } else {
        out.className = 'result no';
        out.textContent = res.reason && !res.reason.startsWith('cite') ? `Not accepted: ${res.reason}.` : 'Not enough: those do not rule it out yet. Something is missing — a clue, or the fact that connects them.';
    }
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
    if (game.difficulty === HARD) {
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
        if (q) return `<span class="item link" data-slot-open="${q.slot}"><span class="kind">question</span>${esc(q.text)}</span>`;
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

document.addEventListener('click', (e) => {
    if (e.target.closest('#story')) { onStoryClick(e); return; }
    if (!e.target.closest('#pop')) $('#pop').hidden = true;
    if (e.target.id === 'read') {
        const res = game.advance();
        if (res.ok && game.difficulty !== HARD && res.newCards.length) {
            const shown = res.newCards.filter((c) => !['rules'].includes(model.cards.get(c).section));
            if (shown.length) toast(`New: ${shown.slice(0, 5).map((c) => esc(shortName(c, 30))).join(', ')}${shown.length > 5 ? ` and ${shown.length - 5} more` : ''}`);
        }
        changed();
        scrollStory();
        return;
    }
    const t = e.target.closest('[data-card],[data-kind],[data-slot],[data-op],[data-expand],[data-timeline],[data-new-theory],[data-theory-current],[data-del-theory],[data-untheory],[data-slot-open],[data-goto],[data-window],.tab');
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
        renderTool();
        return;
    }
    if (t.dataset.op) {
        const menu = t.closest('.menu');
        const slot = menu.dataset.menuSlot;
        const value = menu.dataset.menuVal;
        const op = t.dataset.op;
        if (op === 'strike') { game.strike(slot, value); ui.menu = null; changed(); }
        else if (op === 'unstrike') { game.unstrike(slot, value); ui.menu = null; changed(); }
        else if (op === 'unprove') { game.unprove(slot); ui.menu = null; changed(); }
        else if (op === 'unpropose') { game.removeCandidate(slot, value); ui.menu = null; changed(); }
        else if (op === 'strike-why') openCite('strike', slot, value);
        else if (op === 'prove') openCite('prove', slot, value);
        else if (op === 'open') openCard(value);
        else if (op === 'theory') {
            game.theories.find((x) => x.id === ui.theory).assignment[slot] = value;
            ui.menuNote = '<span class="good">Added to the theory.</span>';
            save();
            renderTool();
        } else if (op === 'fit') {
            ui.menuNote = '<span class="muted">Checking…</span>';
            renderTool();
            setTimeout(() => {
                const r = game.plausible(slot, value);
                if (r.plausible) ui.menuNote = '<span class="good">It could fit everything you hold so far.</span>';
                else if (r.why === 'shape') ui.menuNote = '<span class="bad">Wrong kind of thing for this question.</span>';
                else ui.menuNote = `<span class="bad">It does not fit what you hold:</span> ${r.conflict.map((k) => esc(model.constraints.get(k).label)).join(' · ')}`;
                renderTool();
            }, 10);
        }
    }
});
document.addEventListener('input', (e) => {
    if (e.target.id === 'card-search') {
        ui.search = e.target.value;
        const pos = e.target.selectionStart;
        renderTool();
        const box = $('#card-search');
        box.focus();
        box.setSelectionRange(pos, pos);
    }
    if (e.target.id === 'cite-search') drawCite();
});
document.addEventListener('change', (e) => {
    if (e.target.dataset.choose) {
        if (e.target.checked) chosen.add(e.target.dataset.choose); else chosen.delete(e.target.dataset.choose);
        drawCite();
    }
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
    if (e.target.id === 'difficulty' || e.target.id === 'pace') {
        const state = game.save();
        if (e.target.id === 'difficulty' && state.difficulty !== $('#difficulty').value) {
            if (!confirm('Changing difficulty clears your answers (each difficulty keeps them differently). Your place in the story is kept.')) { render(); return; }
            state.marks = [];
            state.collected = null;
        }
        state.difficulty = $('#difficulty').value;
        state.pace = $('#pace').value;
        game.load(state);
        changed();
    }
});
$('#cite-check').addEventListener('click', runCite);
$('#cite-chosen').addEventListener('click', (e) => {
    const k = e.target.closest('[data-unchoose]')?.dataset.unchoose;
    if (k) { chosen.delete(k); drawCite(); }
});
$('#reset').addEventListener('click', () => {
    if (!confirm('Start the case over? Your place, marks and theories will be lost.')) return;
    game.reset();
    ui.selected = null;
    changed();
});

// ---------- start ----------
model = await loadCase(CASE);
story = model.story;
const saved = restore();
const defaults = model.data.settings_defaults ?? {};
game = new Game(model, { difficulty: defaults.difficulty ?? EASY, pace: defaults.pace ?? 'free', state: saved?.game ?? null });
ui.selected = saved?.selected ?? null;
render();
scrollStory();
