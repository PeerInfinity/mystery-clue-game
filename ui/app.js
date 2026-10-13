// The casebook page: collect cards by investigating, pencil in and rule out the values of every open
// question, and test theories. All the logic is in engine/; this file only draws and dispatches.

import { loadCase } from '../engine/loadCase.js';
import { Game, EASY, HARD } from '../engine/game.js';

const CASE = 'cases/silver-blaze';
const STORE = 'mystery-clue-game:silver-blaze';
const KIND_GROUPS = [
    ['person', 'People'], ['animal', 'Animals'], ['group', 'Groups'], ['place', 'Places'],
    ['object', 'Things'], ['document', 'Documents'], ['events', 'Events'], ['claims', 'Clues'], ['rules', 'Rule cards'],
];
const CHIP_LIMIT = 24;

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let model;
let game;
const ui = {
    tab: 'investigate', selected: null, kind: null, search: '', menu: null, menuNote: '', expanded: new Set(),
    timeline: 'fabula', lastFound: [], theory: null,
};
const cache = new Map(); // slot → open values (easy mode), cleared whenever knowledge changes

// ---------- names ----------
function cardName(id) {
    const c = model.cards.get(id);
    if (!c) return model.windows.find((w) => w.id === id)?.label ?? id;
    if (c.section === 'entities') return c.name;
    if (c.section === 'events') return c.label;
    if (c.section === 'claims') return c.text;
    if (c.section === 'rules') return c.text;
    if (c.section === 'glosses') return c.term;
    return id;
}
function shortName(id, n = 70) {
    const s = cardName(id);
    return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
function valueName(slot, v) {
    const s = model.slots.get(slot);
    if (s?.labels?.[v]) return s.labels[v];
    if (s?.facet === 'truth') return v === 'true' ? 'true' : 'false';
    if (v === s?.on && s.facet === 'identity') return 'nobody else in the story';
    return cardName(v);
}
const sceneTitle = (id) => model.scenes.find((s) => s.id === id)?.title ?? id;
const link = (id, text = null) => `<span class="link" data-card="${esc(id)}">${esc(text ?? shortName(id))}</span>`;
function kindOf(id) {
    const c = model.cards.get(id);
    if (!c) return '';
    if (c.section === 'entities') return c.kind;
    return { events: 'event', claims: 'clue', rules: 'rule', glosses: 'note' }[c.section];
}

// ---------- state ----------
function save() {
    try { localStorage.setItem(STORE, JSON.stringify({ game: game.save(), selected: ui.selected })); } catch { /* private mode */ }
}
function restore() {
    try {
        const raw = localStorage.getItem(STORE);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch { return null; }
}
function changed() {
    cache.clear();
    save();
    render();
}
function openValues(slot) {
    if (!cache.has(slot)) cache.set(slot, game.openValues(slot));
    return cache.get(slot);
}

// ---------- side panel ----------
function renderSide() {
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
    const el = $('#side');
    el.innerHTML = { investigate: sideInvestigate, cards: sideCards, questions: sideQuestions, theories: sideTheories, timeline: sideTimeline }[ui.tab]();
}

function sideInvestigate() {
    const avail = game.available();
    let h = '';
    if (ui.lastFound.length) {
        h += `<div class="gloss small"><b>Found:</b> ${ui.lastFound.slice(0, 12).map((c) => link(c, shortName(c, 40))).join(', ')}${ui.lastFound.length > 12 ? ` and ${ui.lastFound.length - 12} more (see Cards)` : ''}</div>`;
    }
    h += '<h3 class="section">What you can do now</h3>';
    h += avail.length
        ? `<ul class="list">${avail.map((a) => `<li class="action"><span>${esc(a.label)}</span><button data-do="${a.id}">Do it</button><span class="where">${esc(cardName(a.place))} · ${esc(cardName(a.time))}</span></li>`).join('')}</ul>`
        : '<p class="empty">Nothing more to do until you have reasoned further.</p>';
    const blocked = game.actions.filter((a) => !game.done.includes(a.id) && !avail.includes(a)).map((a) => [a, game.missingFor(a)])
        .filter(([, m]) => m.actions.length === 0);
    if (blocked.length) {
        h += '<h3 class="section">Waiting on your reasoning</h3><ul class="list">';
        for (const [a, m] of blocked) {
            const needs = [
                ...m.steps.map((s) => {
                    const c = game.routeById.get(s).concludes;
                    const slot = c.slot ?? Object.values(c.formula)[0][0];
                    const sl = model.slots.get(slot);
                    return `settle ${link(sl.on, `“${sl.prompt}”`)}${c.slot ? ' (rule something out)' : ''}`;
                }),
                ...m.items.map((i) => `have ${esc(cardName(i))}`),
                ...m.cards.map((c) => `know ${link(c)}`),
            ];
            h += `<li><span>${esc(a.label)}</span><div class="small muted">Needs you to ${needs.join('; ')}</div></li>`;
        }
        h += '</ul>';
    }
    h += `<h3 class="section">Your investigation so far (${game.done.length})</h3>`;
    h += game.done.length ? `<ol class="small">${game.done.map((id) => `<li>${esc(game.actionById.get(id).label)}</li>`).join('')}</ol>` : '<p class="empty">Nothing yet.</p>';
    h += `<h3 class="section">Items</h3><p class="small">${[...game.items].map((i) => link(i)).join(', ') || '—'}</p>`;
    return h;
}

function sideCards() {
    const known = [...game.unlocked.keys()].filter((id) => model.cards.get(id)?.section !== 'glosses');
    const counts = {};
    for (const id of known) {
        const c = model.cards.get(id);
        const k = c.section === 'entities' ? c.kind : c.section;
        counts[k] = (counts[k] ?? 0) + 1;
    }
    let h = `<input type="search" id="card-search" placeholder="Search your cards…" value="${esc(ui.search)}">`;
    h += `<div class="filters"><button data-kind="" class="${ui.kind ? '' : 'on'}">All ${known.length}</button>${KIND_GROUPS.filter(([k]) => counts[k]).map(([k, label]) => `<button data-kind="${k}" class="${ui.kind === k ? 'on' : ''}">${label} ${counts[k]}</button>`).join('')}</div>`;
    const q = ui.search.toLowerCase();
    const shown = known.filter((id) => {
        const c = model.cards.get(id);
        const k = c.section === 'entities' ? c.kind : c.section;
        return (!ui.kind || k === ui.kind) && (!q || cardName(id).toLowerCase().includes(q));
    });
    h += `<ul class="list">${shown.map((id) => {
        const open = game.slotsOn(id).filter((s) => game.settled(s.id) === null).length;
        return `<li class="${ui.selected === id ? 'sel' : ''}"><span class="kind">${kindOf(id)}</span>${link(id, shortName(id, 80))}${open ? ` <span class="small muted">· ${open} open</span>` : ''}</li>`;
    }).join('')}</ul>`;
    return h;
}

function sideQuestions() {
    let h = '<p class="small muted">The case questions. Settle each by ruling out every other answer with reasons, or by proving the answer outright.</p><ul class="list">';
    for (const q of model.data.questions) {
        const slot = model.slots.get(q.slot);
        const visible = game.knows(slot.on);
        const settled = game.settled(q.slot);
        const state = !visible ? 'not yet' : settled !== null ? esc(valueName(q.slot, settled)) : `${game.pencil(q.slot).length} left`;
        h += `<li class="q"><span>${visible ? link(slot.on, q.text) : `<span class="muted">${esc(q.text)}</span>`}</span><span class="state ${settled !== null ? 'done' : ''}">${state}</span></li>`;
    }
    return `${h}</ul>`;
}

function sideTheories() {
    let h = '<p class="small muted">A theory is a set of answers held together. It fits until one of your clues breaks it. Add answers to a theory from any question (pick a value, then “Add to theory”).</p>';
    const story = (model.data.theories ?? []).filter((t) => Object.keys(t.assignment).every((s) => game.knows(model.slots.get(s).on)));
    const all = [...story.map((t) => ({ ...t, story: true })), ...game.theories];
    for (const t of all) {
        const res = game.checkTheory(t);
        h += `<div class="theory ${res.fits ? 'fits' : 'broken'}"><b>${esc(t.story ? `${t.held_by.map(cardName).join(', ')}: ` : '')}</b>${esc(t.label)}`;
        h += `<ul class="small">${Object.entries(t.assignment).map(([s, v]) => `<li>${link(model.slots.get(s).on, model.slots.get(s).prompt)} → ${esc(valueName(s, v))}${t.story ? '' : ` <span class="link" data-untheory="${t.id}|${s}">remove</span>`}</li>`).join('') || '<li class="empty">no answers yet</li>'}</ul>`;
        h += res.fits ? '<div class="small good">Fits everything you know so far.</div>'
            : `<div class="small bad">Broken by your clues:</div><ul class="small">${res.conflict.map((k) => {
                const c = model.constraints.get(k);
                return `<li>${esc(c.label)} <span class="muted">(${c.premises.map((p) => link(p, shortName(p, 40))).join(', ')})</span></li>`;
            }).join('')}</ul>`;
        if (!t.story) h += `<div class="small"><span class="link" data-theory-current="${t.id}">${ui.theory === t.id ? '★ answers go here' : 'add answers here'}</span> · <span class="link" data-del-theory="${t.id}">delete</span></div>`;
        h += '</div>';
    }
    h += '<div class="row"><button data-new-theory="1">New theory</button></div>';
    return h;
}

function sideTimeline() {
    const sub = (k, label) => `<button data-timeline="${k}" class="${ui.timeline === k ? 'on' : ''}">${label}</button>`;
    let h = `<div class="subtabs">${sub('fabula', 'What happened')}${sub('investigation', 'What you found, when')}${sub('disclosure', 'What the story told, when')}</div><div class="timeline">`;
    if (ui.timeline === 'fabula') {
        const rows = game.fabula();
        h += '<p class="small muted">Events you hold, placed once their time is settled (open them to settle it).</p>';
        for (const w of model.windows) {
            const here = rows.filter((r) => r.settled === w.id || (!r.slot && false));
            if (here.length) h += `<div class="window"><h4>${esc(w.label)}</h4><ul>${here.map((r) => `<li>${link(r.event.id)}</li>`).join('')}</ul></div>`;
        }
        const open = rows.filter((r) => r.slot && r.settled === null);
        if (open.length) {
            h += `<h3 class="section">Not yet placed (${open.length})</h3><ul class="list small">`;
            for (const r of open) {
                const p = r.pencil;
                const range = p.length === model.windows.length ? 'any time' : p.length === 1 ? cardName(p[0]) : `${cardName(p[0])} … ${cardName(p[p.length - 1])} (${p.length})`;
                h += `<li>${link(r.event.id)} <span class="muted">· ${esc(range)}</span></li>`;
            }
            h += '</ul>';
        }
        const untimed = rows.filter((r) => !r.slot);
        if (untimed.length) h += `<p class="small muted">No time given: ${untimed.map((r) => link(r.event.id, shortName(r.event.id, 40))).join(', ')}</p>`;
    } else if (ui.timeline === 'investigation') {
        const inv = game.investigation();
        h += inv.length ? '' : '<p class="empty">You have not done anything yet.</p>';
        for (const r of inv) {
            h += `<div class="window"><h4>${r.index + 1}. ${esc(r.action.label)}</h4><div class="small">${r.cards.filter((c) => model.cards.get(c).section === 'claims').map((c) => link(c, shortName(c, 50))).join('<br>') || '<span class="muted">nothing new</span>'}</div></div>`;
        }
    } else {
        const held = [...game.unlocked.keys()].filter((c) => model.cards.get(c).section === 'claims');
        for (const s of model.scenes) {
            const here = held.filter((c) => game.disclosure(c) === s.id);
            h += `<div class="window"><h4>${esc(s.title)}</h4><div class="small">${here.length ? `${here.length} of your clues are first told here` : '<span class="muted">none of your clues yet</span>'}${s.id === model.data.case.challenge_scene ? ' <b>· the challenge: Holmes has everything he needs</b>' : ''}</div></div>`;
        }
    }
    return `${h}</div>`;
}

// ---------- detail ----------
function renderDetail() {
    const el = $('#detail');
    const id = ui.selected;
    if (!id || !game.knows(id)) {
        el.innerHTML = intro();
        return;
    }
    const c = model.cards.get(id);
    let h = `<div class="card-head"><span class="kind">${kindOf(id)}</span>${(c.flags ?? []).map((f) => `<span class="flag">${esc(f.replace(/_/g, ' '))}</span>`).join('')}${c.implied ? '<span class="flag">implied</span>' : ''}${c.period ? '<span class="flag">period knowledge</span>' : ''}`;
    if (c.section === 'entities') h += `<h2>${esc(c.name)}</h2>${c.aliases ? `<div class="small muted">also: ${c.aliases.map(esc).join(', ')}</div>` : ''}<p class="desc">${esc(c.description)}</p>${c.within ? `<div class="small muted">in ${link(c.within)}</div>` : ''}`;
    else if (c.section === 'events') h += `<h2>${esc(c.label)}</h2>`;
    else h += `<p class="desc">${esc(c.text)}</p>`;
    h += '</div>';

    if (c.section === 'claims') {
        h += '<h3 class="section">Who says so</h3><ul class="list">';
        for (const a of c.attested) {
            h += `<li>${esc(a.via)}${a.by ? ` by ${link(a.by)}` : ''}${a.to ? ` to ${link(a.to)}` : ''} <span class="small muted">· told in “${esc(sceneTitle(a.scene))}”</span>${(a.source ?? []).map((q) => `<p class="quote">${esc(q.replace(/\s+/g, ' '))}</p>`).join('')}</li>`;
        }
        h += '</ul>';
        if (c.truth_slot) h += '<p class="small muted">Testimony can be wrong: whether this is true is one of the questions below.</p>';
        if (c.about?.length) h += `<p class="small">About: ${c.about.map((x) => (game.knows(x) ? link(x) : esc(cardName(x)))).join(', ')}</p>`;
    }
    if (c.section === 'rules') {
        h += `${(c.source ?? []).map((q) => `<p class="quote">${esc(q.replace(/\s+/g, ' '))}</p>`).join('')}<p class="small muted">Stated in “${esc(sceneTitle(c.stated_in))}”.</p>`;
    }

    const glosses = (model.data.glosses ?? []).filter((g) => g.attaches_to.includes(id));
    if (glosses.length) {
        h += '<h3 class="section">Period notes</h3>';
        for (const g of glosses) h += `<div class="gloss"><b>${esc(g.term)}.</b> ${esc(g.text)}</div>`;
    }

    const clues = (model.data.claims ?? []).filter((k) => game.knows(k.id) && k.about?.includes(id) && k.id !== id);
    if (clues.length) {
        h += `<h3 class="section">What you know about it (${clues.length})</h3><ul class="list">${clues.map((k) => `<li>${link(k.id, k.text)}</li>`).join('')}</ul>`;
    }

    h += '<h3 class="section">When</h3><dl class="times">';
    if (c.section === 'events') {
        const ts = `${id}.time`;
        const v = model.slots.has(ts) ? game.settled(ts) : null;
        h += `<dt>It happened</dt><dd>${model.slots.has(ts) ? (v ? esc(cardName(v)) : 'not settled yet — see below') : 'the story gives no time'}</dd>`;
    }
    const u = game.unlocked.get(id);
    h += `<dt>You found it</dt><dd>${u.via === 'start' ? 'you knew it from the start' : `${u.at + 1}. ${esc(game.actionById.get(u.via)?.label ?? u.via)}`}</dd>`;
    const told = game.disclosure(id);
    if (told) h += `<dt>The story tells it</dt><dd>${esc(sceneTitle(told))}</dd>`;
    h += '</dl>';

    const slots = game.slotsOn(id);
    if (slots.length) {
        h += `<h3 class="section">Open questions (${slots.filter((s) => game.settled(s.id) === null).length} of ${slots.length})</h3>`;
        for (const s of slots) h += renderSlot(s);
    }

    if (c.section === 'entities') {
        const fill = game.visibleSlots().filter((s) => s.on !== id && game.settled(s.id) === null && (() => {
            const p = game.pencil(s.id);
            return p.length <= 8 && p.includes(id);
        })());
        const placed = game.visibleSlots().filter((s) => game.settled(s.id) === id);
        if (fill.length || placed.length) {
            h += '<h3 class="section">Where it fits</h3><ul class="list">';
            for (const s of placed) h += `<li class="good">✓ ${link(s.on)} — ${esc(s.prompt)}</li>`;
            for (const s of fill) h += `<li>? ${link(s.on)} — ${esc(s.prompt)} <span class="small muted">(${game.pencil(s.id).length} candidates)</span></li>`;
            h += '</ul>';
        }
    }
    el.innerHTML = h;
}

function renderSlot(s) {
    const settled = game.settled(s.id);
    const m = game.marks.get(s.id);
    const struck = m ? [...m.struck] : [];
    let chips = [];
    let ruledCount = 0;
    const given = game.given(s.id);
    if (settled !== null) {
        chips.push(`<span class="chip proven" data-slot="${s.id}" data-val="${esc(settled)}">${esc(valueName(s.id, settled))}</span>`);
        if (given) chips.push(`<span class="small muted">given by ${link(given.claim, shortName(given.claim, 60))}</span>`);
    } else {
        const pencil = game.pencil(s.id);
        const open = game.difficulty === EASY ? openValues(s.id) : null;
        const live = open ? pencil.filter((v) => open.includes(v)) : pencil;
        const ruled = open ? pencil.filter((v) => !open.includes(v)) : [];
        ruledCount = ruled.length;
        const showAll = ui.expanded.has(s.id);
        const shown = showAll ? live : live.slice(0, CHIP_LIMIT);
        chips = shown.map((v) => chip(s.id, v, ''));
        if (live.length > shown.length) chips.push(`<span class="link more" data-expand="${s.id}">+ ${live.length - shown.length} more</span>`);
        if (ruled.length) {
            if (ui.expanded.has(`${s.id}|ruled`)) chips.push(...ruled.map((v) => chip(s.id, v, 'ruled')));
            else chips.push(`<span class="link more" data-expand="${s.id}|ruled">${ruled.length} your clues already rule out — show</span>`);
        }
    }
    const struckChips = struck.filter(([v]) => v !== settled).map(([v, p]) => chip(s.id, v, p.cited ? 'proved' : 'struck'));
    let state = settled !== null ? (given ? 'given' : `settled${m?.proven ? ' (proved)' : ''}`) : `${game.pencil(s.id).length} left${ruledCount ? `, ${ruledCount} of them ruled out by your clues` : ''}`;
    if (s.undetermined && settled === null) state += ' · the story may never settle this';
    let h = `<div class="slot ${settled !== null ? 'settled' : ''}" id="slot-${s.id.replace(/\./g, '-')}"><div class="slot-head"><b>${esc(s.prompt)}</b><span class="state">${state}</span></div>`;
    h += `<div class="chips">${chips.join('') || '<span class="empty">no candidates listed</span>'}</div>`;
    if (game.difficulty === HARD && settled === null) {
        h += `<div class="chips"><input list="dl-${s.id}" data-add="${s.id}" placeholder="+ add a candidate" size="24"><datalist id="dl-${s.id}">${s.domain.map((v) => `<option value="${esc(valueName(s.id, v))}">`).join('')}</datalist></div>`;
    }
    if (struckChips.length) h += `<div class="chips small"><span class="muted">crossed out:</span>${struckChips.join('')}</div>`;
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
    const buttons = [];
    if (isProven) buttons.push(`<button data-op="unprove">Undo the proof</button>`);
    else if (st) buttons.push(`<button data-op="unstrike">Restore</button>`);
    else {
        buttons.push(`<button data-op="strike">Cross out</button>`, `<button data-op="strike-why">Cross out, with reasons…</button>`, `<button data-op="prove">Prove it's this…</button>`, `<button data-op="fit" class="quiet">Could it fit?</button>`);
    }
    const mine = game.theories.find((t) => t.id === ui.theory);
    if (mine) buttons.push(`<button data-op="theory" class="quiet">Add to “${esc(mine.label)}”</button>`);
    if (model.cards.has(v)) buttons.push(`<button data-op="open" class="quiet">Open ${esc(shortName(v, 30))}</button>`);
    return `<div class="menu" data-menu-slot="${s.id}" data-menu-val="${esc(v)}"><b>${esc(valueName(s.id, v))}</b>${buttons.join('')}${ui.menuNote ? `<div class="why">${ui.menuNote}</div>` : ''}</div>`;
}

function intro() {
    return `<div class="card-head"><h2>The disappearance of Silver Blaze</h2>
<p class="desc">${esc(model.data.case.summary)}</p></div>
<h3 class="section">How to play</h3>
<ul>
<li><b>Investigate</b> (left) to find clues. Each clue, person, place and thing becomes a card.</li>
<li>Every card has <b>open questions</b>: who did it, where, when, whose is it, is it true. Each lists its possible answers, like pencil marks in sudoku.</li>
<li><b>Cross out</b> answers that cannot be right. Do it <b>with reasons</b> — cite clue cards and rule cards — and the game checks the reasoning; any sufficient set of reasons is accepted, not only Holmes's.</li>
<li>When one answer is left (or you prove it outright), the question is <b>settled</b>. Some of Holmes's next moves wait until you have settled what he had.</li>
<li><b>Theories</b> let you hold a set of answers together and see which clue breaks them. The police already have one.</li>
<li>In <b>Easy</b> mode every possible answer is listed and the ones your clues already rule out are greyed — you still have to cross them out. In <b>Hard</b> mode you list candidates yourself, and the game only checks that they are the right kind of thing.</li>
</ul>
<p class="muted small">Start with “Holmes receives telegrams…” on the Investigate tab.</p>`;
}

function render() {
    const settledQ = model.data.questions.filter((q) => game.settled(q.slot) !== null).length;
    const found = [...game.unlocked.keys()].filter((k) => model.cards.get(k)?.section !== 'glosses').length;
    $('#progress').textContent = `${found} cards · ${settledQ}/${model.data.questions.length} case questions settled`;
    $('#difficulty').value = game.difficulty;
    $('#rules').value = game.allRules ? 'all' : 'told';
    renderSide();
    renderDetail();
}

// ---------- citing ----------
let citeFor = null; // {kind: 'strike'|'prove', slot, value}
const chosen = new Set();
function openCite(kind, slot, value) {
    citeFor = { kind, slot, value };
    chosen.clear();
    const s = model.slots.get(slot);
    $('#cite-title').textContent = kind === 'prove' ? `Prove: ${s.prompt} → ${valueName(slot, value)}` : `Rule out: ${s.prompt} ≠ ${valueName(slot, value)}`;
    $('#cite-help').textContent = 'Pick the clue cards and rule cards that, together, settle it. Any sufficient set is accepted.';
    $('#cite-search').value = '';
    $('#cite-result').textContent = '';
    $('#cite-result').className = 'result';
    drawCite();
    $('#cite').showModal();
}
function drawCite() {
    const q = $('#cite-search').value.toLowerCase();
    const pool = [...game.unlocked.keys()].filter((k) => ['claims', 'rules'].includes(model.cards.get(k).section));
    const shown = pool.filter((k) => chosen.has(k) || !q || cardName(k).toLowerCase().includes(q));
    $('#cite-chosen').innerHTML = [...chosen].map((k) => `<span class="chip" data-unchoose="${k}">${esc(shortName(k, 50))} <span class="x">✕</span></span>`).join('') || '<span class="empty">nothing cited yet</span>';
    $('#cite-list').innerHTML = shown.slice(0, 200).map((k) => `<label><input type="checkbox" data-choose="${k}" ${chosen.has(k) ? 'checked' : ''}><span><span class="kind">${kindOf(k)}</span>${esc(cardName(k))}</span></label>`).join('');
}
function runCite() {
    const cited = [...chosen];
    const { kind, slot, value } = citeFor;
    const res = kind === 'prove' ? game.prove(slot, value, cited) : game.strike(slot, value, cited);
    const out = $('#cite-result');
    if (res.ok) {
        out.className = 'result ok';
        out.innerHTML = `Accepted. ${res.used?.length ? `It rests on: ${res.used.map((k) => esc(model.constraints.get(k).label)).join(' · ')}` : ''}`;
        ui.menu = null;
        changed();
    } else {
        out.className = 'result no';
        out.textContent = res.reason ? `Not accepted: ${res.reason}.` : 'Not enough: those cards do not rule it out yet. Something is missing — a clue, or the rule that connects them.';
    }
}

// ---------- events ----------
document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-card],[data-do],[data-kind],[data-slot],[data-op],[data-expand],[data-timeline],[data-new-theory],[data-theory-current],[data-del-theory],[data-untheory],.tab');
    if (!t) return;
    if (t.classList.contains('tab')) { ui.tab = t.dataset.tab; render(); return; }
    if (t.dataset.card) { ui.selected = t.dataset.card; ui.menu = null; ui.menuNote = ''; save(); render(); $('#detail').scrollTop = 0; return; }
    if (t.dataset.do) {
        const res = game.perform(t.dataset.do);
        ui.lastFound = res?.newCards ?? [];
        changed();
        return;
    }
    if (t.dataset.kind !== undefined && t.closest('.filters')) { ui.kind = t.dataset.kind || null; render(); return; }
    if (t.dataset.expand) { ui.expanded.add(t.dataset.expand); render(); return; }
    if (t.dataset.timeline) { ui.timeline = t.dataset.timeline; render(); return; }
    if (t.dataset.newTheory) {
        const label = prompt('Name your theory', `Theory ${game.theories.length + 1}`);
        if (label) { ui.theory = game.addTheory(label); changed(); }
        return;
    }
    if (t.dataset.theoryCurrent) { ui.theory = t.dataset.theoryCurrent; render(); return; }
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
        renderDetail();
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
        else if (op === 'strike-why') openCite('strike', slot, value);
        else if (op === 'prove') openCite('prove', slot, value);
        else if (op === 'open') { ui.selected = value; ui.menu = null; render(); }
        else if (op === 'theory') {
            game.theories.find((x) => x.id === ui.theory).assignment[slot] = value;
            ui.menuNote = '<span class="good">Added to the theory.</span>';
            save();
            renderDetail();
        } else if (op === 'fit') {
            ui.menuNote = '<span class="muted">Checking…</span>';
            renderDetail();
            setTimeout(() => {
                const r = game.plausible(slot, value);
                if (r.plausible) ui.menuNote = `<span class="good">It could fit${r.why === 'shape only' ? ' — it is the right kind of thing (in Hard mode that is all the game checks)' : ' everything you have found so far'}.</span>`;
                else if (r.why === 'shape') ui.menuNote = '<span class="bad">Wrong kind of thing for this question.</span>';
                else ui.menuNote = `<span class="bad">It does not fit what you know:</span> ${r.conflict.map((k) => esc(model.constraints.get(k).label)).join(' · ')}`;
                renderDetail();
            }, 10);
        }
    }
});
document.addEventListener('input', (e) => {
    if (e.target.id === 'card-search') {
        ui.search = e.target.value;
        const pos = e.target.selectionStart;
        renderSide();
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
        const v = s.domain.find((x) => valueName(slot, x).toLowerCase() === e.target.value.trim().toLowerCase());
        if (v) { game.addCandidate(slot, v); changed(); }
        else e.target.setCustomValidity('Not the right kind of thing for this question');
    }
    if (e.target.id === 'difficulty' || e.target.id === 'rules') {
        const state = game.save();
        state.difficulty = $('#difficulty').value;
        state.allRules = $('#rules').value === 'all';
        if (e.target.id === 'difficulty') state.marks = []; // the two modes keep pencil marks differently
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
    if (!confirm('Start the case over? Your marks and theories will be lost.')) return;
    game.reset();
    ui.selected = null;
    ui.lastFound = [];
    changed();
});

// ---------- start ----------
model = await loadCase(CASE);
const saved = restore();
game = new Game(model, { state: saved?.game ?? null });
ui.selected = saved?.selected ?? null;
render();
