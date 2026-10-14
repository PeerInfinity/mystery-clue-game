// The casebook page: read the story a paragraph at a time; collect cards as they are mentioned (or, in Hard,
// by clicking the text); for every open question rule out what the evidence excludes; test theories.
// All the logic is in engine/; this file only draws and dispatches.

import { loadCase } from '../engine/loadCase.js';
import { Game, TRIVIAL, EASY, MEDIUM, HARD, WAIT, BG_START, BG_ASK, BACKGROUND_DEFAULTS } from '../engine/game.js';

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
const ui = { tab: 'card', selected: null, kind: null, search: '', menu: null, menuNote: '', expanded: new Set(), timeline: 'fabula', theory: null, focusWindow: null, focusSlot: null, fit: null };
const cache = new Map();

// ---------- names ----------
function cardName(id) {
    const c = model.cards.get(id);
    if (!c) return model.windows.find((w) => w.id === id)?.label ?? model.data.questions.find((q) => q.id === id)?.text ?? id;
    if (c.section === 'entities' || c.section === 'events') return game.nameOf(id);
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
    const ahead = game.nextDeductionAt() - game.read;
    const aheadScene = game.nextSceneAt() - game.read;
    const blocked = blockers.length && game.pace === WAIT;
    let note = '';
    if (blockers.length) {
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
function renderTool() {
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
    $('#tool').innerHTML = { card: toolCard, cards: toolCards, questions: toolQuestions, theories: toolTheories, timeline: toolTimeline, background: toolBackground }[ui.tab]();
    const tally = cardTally([...game.unlocked.keys()].filter((k) => !['glosses', 'rules'].includes(model.cards.get(k)?.section)));
    document.querySelector('.tab[data-tab="cards"]').textContent = `Cards${tallyText(tally) ? ` (${tallyText(tally)})` : ''}`;
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
<li>${game.difficulty === TRIVIAL ? 'The game works out what your clues allow: each question shows only the answers still possible, and settles itself when one is left. Click a ruled-out answer to see why.' : game.difficulty === EASY ? 'Cross answers out; the game greys the ones your clues already rule out. Circle the answers you favour.' : 'Rule answers out by citing the clues and background notes that exclude them. The game checks the reasoning; any sufficient set of reasons is accepted. Circle the answers you favour.'}</li>
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
    if (c.section === 'claims') {
        if (game.canSuspect(id)) {
            h += game.isSuspected(id)
                ? `<p class="doubt on">You suspect this may be false: it counts as fact nowhere, and “Is it true?” is open below. <button data-unsuspect="${id}" class="quiet">Trust it again</button></p>`
                : `<p class="doubt">Until you doubt it, the game takes this at its word. <button data-suspect="${id}">I suspect this may be false</button></p>`;
        }
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
            return p.includes(id) && (game.difficulty === HARD || p.length <= 8);
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
        if (game.difficulty === TRIVIAL) chips.push(`<span class="small muted">${game.autoPace === 'holmes' ? 'settled by the story' : 'worked out from your clues'}</span>`);
        else if (given && game.provenValue(s.id) === null) chips.push(`<span class="small muted">given by ${link(given.claim, shortName(given.claim, 60))} · <span class="link" data-suspect="${given.claim}">doubt it</span></span>`);
        for (const k of game.givenClash(s.id)) chips.push(`<span class="small bad">but ${link(k, shortName(k, 60))}, which you trust, says ${esc(valueName(s.id, game.given(s.id)?.value ?? ''))} · <span class="link" data-suspect="${k}">doubt it</span></span>`);
    } else {
        const pencil = game.pencil(s.id);
        let live = pencil;
        let ruled = [];
        if (game.difficulty === TRIVIAL) {
            // The pencil is already what the clues allow; show the rest as ruled out, with a "why" on each.
            ruled = s.domain.filter((v) => !live.includes(v) && game.offered(s.id, v));
            ruledCount = ruled.length;
        } else if (game.difficulty === EASY) {
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
    else if (game.difficulty === HARD) state = `${game.pencil(s.id).length} proposed`;
    else if (game.difficulty === TRIVIAL) state = `${game.pencil(s.id).length} possible${game.moreToCome(s.id) ? ' so far' : ''}`;
    else state = `${countLeft(s.id)}${ruledCount ? `, ${ruledCount} ruled out by your clues` : ''}`;
    let h = `<div class="slot ${settled !== null ? 'settled' : ''}" id="slot-${s.id.replace(/\./g, '-')}"><div class="slot-head"><b>${esc(game.promptOf(s.id))}</b><span class="state">${state}</span></div>`;
    h += `<div class="chips">${chips.join('') || '<span class="empty">no candidates yet</span>'}</div>`;
    if (game.difficulty === HARD && settled === null) {
        const options = s.domain.filter((v) => game.offered(s.id, v));
        h += `<div class="chips"><input list="dl-${s.id}" data-add="${s.id}" placeholder="+ propose an answer" size="26"><datalist id="dl-${s.id}">${options.map((v) => `<option value="${esc(valueName(s.id, v))}">`).join('')}</datalist></div>`;
    }
    if (crossedChips.length) h += `<div class="chips small"><span class="muted">crossed out:</span>${crossedChips.join('')}</div>`;
    if (ruledOutChips.length) h += `<div class="chips small"><span class="muted">ruled out, with evidence:</span>${ruledOutChips.join('')}</div>`;
    if (lapsed.length) {
        const why = [...new Set(lapsed.flatMap((u) => game.lapsedBy(u)))];
        h += `<div class="small bad">${lapsed.length === 1 ? 'A proof here' : `${lapsed.length} proofs here`} rested on ${why.map((k) => link(k, shortName(k, 50))).join(', ')}, which you now doubt.</div>`;
    }
    if (game.difficulty === EASY && settled === null && cache.get(s.id)?.length === 0) {
        // No value at all fits, met or not: the trusted clues contradict each other.
        h += `<div class="small bad">Nothing could fit, not even an answer the story has yet to bring up: some of the clues you trust contradict each other, so one of them must be false. <span class="link" data-clash="${s.id}">Find the clash</span></div>`;
        if (ui.clash?.slot === s.id) h += `<div class="why">${ui.clash.html}</div>`;
    } else if (game.difficulty === EASY && settled === null && (game.pencil(s.id).length || !game.moreToCome(s.id)) && !game.pencil(s.id).some((v) => cache.get(s.id)?.includes(v))) {
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
    const circled = game.difficulty !== TRIVIAL && game.isCircled(slot, v) ? ' circled' : '';
    return `<span class="chip ${cls}${circled}${picked}" data-slot="${slot}" data-val="${esc(v)}">${esc(valueName(slot, v))}${cls === 'proved' ? ' <span class="x">✓</span>' : ''}</span>`;
}

function slotMenu(s, v) {
    const m = game.marks.get(s.id);
    const st = m?.struck.get(v);
    const isProven = game.provenValue(s.id) === v;
    const isGiven = !!game.given(s.id);
    const b = [];
    if (game.difficulty === TRIVIAL) {
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
        if (game.difficulty === EASY) b.push('<button data-op="strike">Cross out</button>');
        b.push('<button data-op="strike-why">Rule out, with evidence…</button>', '<button data-op="prove">Prove it\'s this…</button>');
        if (game.difficulty === EASY) b.push('<button data-op="fit" class="quiet">Could it fit?</button>');
        if (game.difficulty === HARD) b.push('<button data-op="unpropose" class="quiet">Take back</button>');
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
    }).join('')}</ul>` : `<p class="empty">${game.difficulty === HARD ? 'No cards yet. Click the words in the story that mention someone or something.' : 'No cards yet. Start reading.'}</p>`;
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
    if (!raised.length) return `<p class="empty">The story has not raised any questions yet.</p>${d}`;
    let h = '<p class="small muted">The questions the case turns on, as the story raises them.</p><ul class="list">';
    for (const q of raised) {
        const slot = model.slots.get(q.slot);
        const visible = game.knows(slot.on);
        const settled = game.settled(q.slot);
        const state = !visible ? (game.difficulty === HARD ? 'collect the card first' : '') : settled !== null ? esc(valueName(q.slot, settled)) : game.difficulty === HARD ? `${game.pencil(q.slot).length} proposed` : game.difficulty === TRIVIAL ? `${game.pencil(q.slot).length} possible${game.moreToCome(q.slot) ? ' so far' : ''}` : countLeft(q.slot);
        const picks = visible && settled === null && game.difficulty !== TRIVIAL ? game.pencil(q.slot).filter((v) => game.isCircled(q.slot, v)) : [];
        h += `<li class="q"><span>${visible ? `<span class="link" data-slot-open="${q.slot}">${esc(game.questionText(q))}</span>` : esc(game.questionText(q))}</span><span class="state ${settled !== null ? 'done' : ''}">${state}${picks.length ? ` · circled: ${picks.map((v) => esc(valueName(q.slot, v))).join(', ')}` : ''}</span></li>`;
    }
    return `${h}</ul>${d}`;
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
        h += `<ul class="small">${Object.entries(t.assignment).map(([s, v]) => `<li><span class="link" data-slot-open="${s}">${esc(game.promptOf(s))}</span> → ${esc(valueName(s, v))}${t.story ? '' : ` <span class="link" data-untheory="${t.id}|${s}">remove</span>`}</li>`).join('') || '<li class="empty">no answers yet</li>'}</ul>`;
        if (game.assisted()) {
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
    $('#background').value = game.background;
    $('#autopace').value = game.autoPace;
    $('#autopace-label').hidden = game.difficulty !== TRIVIAL;
    const pick = (id) => $(`#${id}`).selectedOptions[0]?.textContent ?? '';
    $('#settings-summary').textContent = `${pick('difficulty')} · ${pick('pace') === 'Free' ? 'Free pace' : 'Waits'} · Background ${pick('background').toLowerCase()}`;
    $('#settings-short').textContent = pick('difficulty');
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
    $('#cite-title').textContent = kind === 'prove' ? `Prove: ${game.promptOf(slot)} → ${valueName(slot, value)}` : `Rule out: ${game.promptOf(slot)} — not ${valueName(slot, value)}`;
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
/** "Could it fit?": check the answer against everything trusted; when it does not fit, offer to doubt the claims in the way. */
function runFit(slot, value) {
    ui.fit = { slot, value };
    ui.menuNote = '<span class="muted">Checking…</span>';
    renderTool();
    setTimeout(() => {
        const r = game.plausible(slot, value);
        if (r.plausible) ui.menuNote = '<span class="good">It could fit everything you trust so far.</span>';
        else if (r.why === 'shape') ui.menuNote = '<span class="bad">Wrong kind of thing for this question.</span>';
        else ui.menuNote = `<span class="bad">It does not fit what you trust:</span> ${doubtableHtml(r.conflict)}`;
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
    return `${doubtableHtml(ids)}. One of them must be false.`;
}

function runCite() {
    const cited = [...chosen].filter((k) => model.cards.get(k).section !== 'glosses');
    const { kind, slot, value } = citeFor;
    const res = kind === 'prove' ? game.prove(slot, value, cited) : game.strike(slot, value, cited);
    const out = $('#cite-result');
    if (res.ok) {
        out.className = 'result ok';
        const word = game.restsOn(res.used);
        out.innerHTML = (game.assisted() && res.used?.length ? `Accepted. It rests on: ${res.used.map((k) => esc(model.constraints.get(k).label)).join(' · ')}` : 'Accepted.')
            + (word.length ? ` <span class="muted">It takes ${word.map((k) => esc(shortName(k, 50))).join('; ')} on trust.</span>` : '');
        ui.menu = null;
        changed();
    } else if (res.contradiction) {
        out.className = 'result no';
        out.innerHTML = `Those cannot all be true: ${clashHtml(res.contradiction)}`;
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

document.addEventListener('click', (e) => {
    // A click anywhere outside the settings panel closes it.
    const settings = document.querySelector('.settings');
    if (settings?.open && !e.target.closest('.settings')) settings.open = false;
    if (e.target.closest('#story')) { onStoryClick(e); return; }
    if (!e.target.closest('#pop')) $('#pop').hidden = true;
    const readBtn = e.target.closest('#read, #read-scene, #read-deduction');
    if (readBtn) {
        const res = readBtn.id === 'read' ? game.advance() : readBtn.id === 'read-scene' ? game.readToNextScene() : game.readToNextDeduction();
        if (game.difficulty !== HARD && res.newCards?.length) {
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
    const d = e.target.closest('[data-suspect],[data-unsuspect],[data-clash]');
    if (d) {
        if (d.dataset.suspect) { game.suspect(d.dataset.suspect); toast(`You now doubt: ${esc(shortName(d.dataset.suspect, 60))}`); }
        else if (d.dataset.unsuspect) game.unsuspect(d.dataset.unsuspect);
        else {
            ui.clash = { slot: d.dataset.clash, html: '<span class="muted">Checking everything you trust… (a few seconds)</span>' };
            renderTool();
            setTimeout(() => {
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
        else if (op === 'strike-why') openCite('strike', slot, value);
        else if (op === 'prove') openCite('prove', slot, value);
        else if (op === 'open') openCard(value);
        else if (op === 'why' || op === 'whynot') {
            ui.menuNote = '<span class="muted">Checking…</span>';
            renderTool();
            setTimeout(() => {
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
    if (['difficulty', 'pace', 'background', 'autopace'].includes(e.target.id)) {
        const state = game.save();
        if (e.target.id === 'difficulty' && state.difficulty !== $('#difficulty').value) {
            if (!confirm('Changing difficulty clears your answers (each difficulty keeps them differently). Your place in the story is kept.')) { render(); return; }
            state.marks = [];
            state.collected = null;
        }
        // A new difficulty brings its own background default (When relevant for Trivial, When asked otherwise).
        state.background = e.target.id === 'difficulty' ? BACKGROUND_DEFAULTS[$('#difficulty').value] : $('#background').value;
        state.difficulty = $('#difficulty').value;
        state.pace = $('#pace').value;
        state.autoPace = $('#autopace').value;
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
game = new Game(model, { difficulty: defaults.difficulty ?? MEDIUM, pace: defaults.pace ?? 'free', state: saved?.game ?? null });
ui.selected = saved?.selected ?? null;
render();
scrollStory();
