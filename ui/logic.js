// The case's logic, laid open: every inference, clue, background fact, question and step of Holmes's route, with
// how they connect, in several views. Not part of the game (it shows every answer); a page for the author and
// the curious. Everything is read from the same case files and engine the game uses.

import { loadCase } from '../engine/loadCase.js';
import { Game, MEDIUM, BG_RELEVANT } from '../engine/game.js';
import { slotsOf } from '../engine/logic.js';
import { makeReadings } from './readings.js';

const CASE = 'cases/silver-blaze';
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const model = await loadCase(CASE);
// Read the whole story once, so every card has the paragraph where it arrives and its final name.
const game = new Game(model, { difficulty: MEDIUM, background: BG_RELEVANT });
while (!game.finished()) game.advance();

// ---------- names and readings (everything is known here) ----------
function cardName(id) {
    const c = model.cards.get(id);
    if (!c) return model.windows.find((w) => w.id === id)?.label ?? id;
    if (c.section === 'entities' || c.section === 'events') return game.nameOf(id);
    if (c.section === 'glosses') return c.term;
    return c.text;
}
function valueName(slot, v) {
    const s = model.slots.get(slot);
    if (s?.labels?.[v]) return s.labels[v];
    if (v === s?.on && s.facet === 'identity') return 'nobody else in the story';
    return cardName(v);
}
const R = makeReadings({ model, knows: () => true, offered: () => true, nameOf: (id) => game.nameOf(id), promptOf: (s) => game.promptOf(s), cardName, valueName });

// ---------- indexes ----------
const D = model.data;
const inferences = D.constraints ?? [];
const claims = D.claims ?? [];
const rules = D.rules ?? [];
const route = D.route ?? [];
const questionBySlot = new Map((D.questions ?? []).map((q) => [q.slot, q]));
const byId = new Map([...inferences.map((x) => [x.id, { kind: 'inference', x }]), ...claims.map((x) => [x.id, { kind: 'clue', x }]),
    ...rules.map((x) => [x.id, { kind: 'background', x }]), ...route.map((x) => [x.id, { kind: 'route', x }]), ...(D.theories ?? []).map((x) => [x.id, { kind: 'theory', x }])]);
const kindOf = (id) => byId.get(id)?.kind ?? (model.slots.has(id) ? 'question' : model.cards.get(id)?.section === 'events' ? 'event'
    : model.cards.has(id) ? 'thing' : model.windows.some((w) => w.id === id) ? 'time' : 'unknown');

const para = (id) => game.unlocked.get(id)?.para;
const paraOfQuote = (q) => (q ? game.story.find(q)?.para : undefined);
/** The paragraph by which every premise has arrived (undefined if one never does). */
const availableAt = (premises) => {
    const ps = premises.map(para);
    return ps.some((p) => p === undefined) ? undefined : Math.max(0, ...ps);
};
const routeTold = (st) => paraOfQuote(st.source?.[0]);
const formulaSlots = (f) => (f ? [...slotsOf(f)] : []);
const concl = (st) => st.concludes?.formula ?? (st.concludes?.slot ? { ne: [st.concludes.slot, st.concludes.value] } : null);

const usingCard = new Map(); // card id -> inference ids / route ids with it as a premise
for (const k of [...inferences, ...route]) for (const p of k.premises ?? []) { if (!usingCard.has(p)) usingCard.set(p, []); usingCard.get(p).push(k.id); }
const onSlot = new Map(); // slot -> {inferences, clues, route}
const addOn = (slot, kind, id) => {
    if (!onSlot.has(slot)) onSlot.set(slot, { inferences: [], clues: [], route: [] });
    const e = onSlot.get(slot)[kind];
    if (!e.includes(id)) e.push(id);
};
for (const k of inferences) for (const s of formulaSlots(k.formula)) addOn(s, 'inferences', k.id);
for (const c of claims) for (const s of formulaSlots(c.asserts)) addOn(s, 'clues', c.id);
for (const st of route) for (const s of formulaSlots(concl(st))) addOn(s, 'route', st.id);

// ---------- small renderers ----------
const KIND_LABEL = { theory: 'theory', inference: 'inference', clue: 'clue', background: 'background', route: 'Holmes', question: 'question', event: 'event', thing: 'card', time: 'time' };
const shortText = (id, n = 90) => {
    const k = kindOf(id);
    const t = k === 'inference' || k === 'theory' ? byId.get(id).x.label : k === 'route' ? routeTitle(byId.get(id).x) : k === 'question' ? questionTitle(id) : cardName(id);
    return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};
const ref = (id, n) => `<span class="ref k-${kindOf(id)}" data-id="${esc(id)}"><span class="kind">${KIND_LABEL[kindOf(id)] ?? ''}</span>${esc(shortText(id, n))}</span>`;
const paraTag = (p) => (p === undefined ? '<span class="para none">never in hand</span>' : `<span class="para">¶${p}</span>`);
const reading = (f) => (f ? `<p class="reading">${esc(R.readingOf(f))}</p>` : '');
const raw = (f, label = 'formula') => (f ? `<details class="raw"><summary>${label}</summary><pre>${esc(JSON.stringify(f, null, 1))}</pre></details>` : '');
function questionTitle(slot) {
    const q = questionBySlot.get(slot);
    const s = model.slots.get(slot);
    const on = model.cards.get(s.on)?.section === 'events' ? ` (${cardName(s.on)})` : '';
    return q ? game.questionText(q) : `${game.promptOf(slot)}${on}`;
}
function routeTitle(st) {
    const f = concl(st);
    return f ? R.readingOf(f) : st.id;
}
/** The case's answer; some questions the story never settles (where the opium went in), and the case leaves open. */
/** Where the player is given an inference: a character states it, or Holmes where the story tells his step. */
const statedAt = new Map();
for (const k of inferences) for (const st of k.stated ?? []) statedAt.set(k.id, [...(statedAt.get(k.id) ?? []), { by: st.by, at: paraOfQuote(st.source[0]) }]);
for (const st of route) {
    for (const id of game.stepInferences(st.id) ?? []) if (!statedAt.has(id)) statedAt.set(id, [{ by: 'holmes', at: routeTold(st) }]);
}
const statedText = (k) => (statedAt.has(k.id) ? ` · stated by ${statedAt.get(k.id).map((x) => `${esc(cardName(x.by))} ¶${x.at ?? '?'}`).join(', ')}` : ' · never stated: built by the player');
const answerOf = (slot) => {
    const a = model.slots.get(slot).answer;
    return a === null || a === undefined ? '— left open by the story' : valueName(slot, a);
};

// ---------- views ----------
const VIEWS = [
    ['overview', 'Overview'], ['inferences', `Inferences (${inferences.length})`], ['clues', `Clues (${claims.length})`],
    ['background', `Background (${rules.length})`], ['questions', 'Questions'], ['route', `Holmes's route (${route.length})`],
    ['timeline', 'Timeline'], ['graph', 'Graph'],
];
const state = { view: 'overview', id: null, filter: '', allQuestions: false, depth: 1 };

function viewOverview() {
    const qs = D.questions ?? [];
    return `<div class="prose">
<h2>How the game checks a deduction</h2>
<p>The case is a set of <b>questions</b> (${model.slots.size} of them: who did each event, when, where, whose is each thing,
is each statement true…), each with a fixed list of possible answers. Everything else is a formula over those questions.</p>
<ol>
<li><b>Clues</b> (${claims.length}) are what the story tells, each with a formula for what it asserts. A clue is
taken at its word until the player doubts it; ${claims.filter((c) => c.truth === false).length} of them are false.</li>
<li><b>Background</b> facts (${rules.length}) are general knowledge. They have no formula of their own: they are
premises of inferences.</li>
<li><b>Inferences</b> (${inferences.length}) are reasoning written into the case: each rests on premises (clues and
background facts) and has a formula. The player <i>holds</i> an inference once they have built it (connecting its
premises: “Infer from this”), or heard a character state it (Holmes's arrive where the story tells his step), or, in
Trivial, as soon as its premises are known. A held inference counts like a trusted clue until it is doubted;
${inferences.filter((k) => k.truth === false).length} are false — the police's and Gregory's wrong reasoning.</li>
<li><b>Holmes's route</b> (${route.length} steps) is the reasoning Holmes does in the story, each step a conclusion
with its premises. Each step needs a fewest set of inferences; with “wait for deductions” the story waits until the
player holds them.</li>
</ol>
<p>To <b>rule out</b> an answer, the game takes everything the player holds and trusts — the clues' formulas and the
held inferences, with any clash among them set aside — <i>supposes the answer</i>, and searches for any way to fill in
every question that satisfies all of them. None means the answer is ruled out (a proof by contradiction); the game
then trims the formulas to a smallest set that still does it (“rests on”), and the proof lapses if one of those is
later doubted. To <b>prove</b> an answer it supposes the opposite. Nothing is cited: the player's work is building
the inferences and choosing what to doubt.</p>
<p>The ${qs.length} case questions: ${qs.map((q) => ref(q.slot)).join(' ')}</p>
<h2>Views</h2>
<ul><li><b>Inferences</b>, <b>Clues</b>, <b>Background</b>, <b>Questions</b>, <b>Holmes's route</b>: every item, with
its plain reading, when it is in hand, and what it connects to. Click anything for the full picture.</li>
<li><b>Timeline</b>: the story paragraph by paragraph: what arrives, which inferences switch on, what Holmes concludes.</li>
<li><b>Graph</b>: the neighbourhood of one item: premises → inferences → questions.</li></ul></div>`;
}

const matches = (...texts) => !state.filter || texts.join(' ').toLowerCase().includes(state.filter.toLowerCase());

function viewInferences() {
    const rows = inferences.filter((k) => matches(k.id, k.label, k.by ?? '', R.readingOf(k.formula)))
        .map((k) => ({ k, at: availableAt(k.premises ?? []) }))
        .sort((a, b) => (a.at ?? 1e9) - (b.at ?? 1e9));
    return `<p class="small muted">Written into the case. The player holds one once they build it (connecting its premises) or hear it stated. Sorted by when the last premise arrives.</p>` + rows.map(({ k, at }) => `
<div class="item" data-id="${esc(k.id)}"><div class="item-head">${paraTag(at)} ${k.truth === false ? '<span class="tag bad">false</span> ' : ''}<b>${esc(k.label)}</b> <span class="small muted">${esc(k.by ?? '')}${statedText(k)}</span></div>
${reading(k.formula)}<div class="refs">${(k.premises ?? []).map((p) => ref(p, 50)).join(' ')}</div></div>`).join('');
}

function viewClues() {
    const rows = claims.filter((c) => matches(c.id, c.text, c.asserts ? R.readingOf(c.asserts) : ''))
        .sort((a, b) => (para(a.id) ?? 1e9) - (para(b.id) ?? 1e9));
    return `<p class="small muted">What the story tells, with what each asserts. Sorted by where it arrives.</p>` + rows.map((c) => `
<div class="item" data-id="${esc(c.id)}"><div class="item-head">${paraTag(para(c.id))} ${c.truth === false ? '<span class="tag bad">false</span>' : ''} <b>${esc(c.text)}</b></div>
${c.asserts ? reading(c.asserts) : '<p class="small muted">Asserts nothing the questions can hold (colour only).</p>'}
${(usingCard.get(c.id) ?? []).length ? `<div class="small muted">premise of ${usingCard.get(c.id).length}</div>` : ''}</div>`).join('');
}

function viewBackground() {
    const rows = rules.filter((r) => matches(r.id, r.text)).sort((a, b) => (para(a.id) ?? 1e9) - (para(b.id) ?? 1e9));
    return `<p class="small muted">General knowledge. A fact does nothing alone: it switches on the inferences it is a premise of.</p>` + rows.map((r) => `
<div class="item" data-id="${esc(r.id)}"><div class="item-head">${paraTag(para(r.id))} <b>${esc(r.text)}</b></div>
<div class="refs">${(usingCard.get(r.id) ?? []).map((k) => ref(k, 60)).join(' ') || '<span class="small muted">switches on nothing (filler)</span>'}</div></div>`).join('');
}

function viewQuestions() {
    const all = [...model.slots.keys()];
    const shown = (state.allQuestions ? all : all.filter((s) => questionBySlot.has(s) || onSlot.get(s)?.inferences.length || onSlot.get(s)?.route.length))
        .filter((s) => matches(s, questionTitle(s), answerOf(s)))
        .sort((a, b) => (questionBySlot.has(b) ? 1 : 0) - (questionBySlot.has(a) ? 1 : 0));
    return `<p class="small muted">${state.allQuestions ? `All ${all.length} questions.` : 'The case questions and every question an inference or Holmes speaks of.'}
<label><input type="checkbox" id="all-q" ${state.allQuestions ? 'checked' : ''}> show all ${all.length}</label></p>
<table class="qtable"><thead><tr><th>Question</th><th>Answer</th><th>Answers</th><th>Clues</th><th>Inferences</th><th>Holmes</th></tr></thead><tbody>
${shown.map((s) => {
        const o = onSlot.get(s) ?? { inferences: [], clues: [], route: [] };
        return `<tr data-id="${esc(s)}"><td>${questionBySlot.has(s) ? '<b>' : ''}${esc(questionTitle(s))}${questionBySlot.has(s) ? '</b>' : ''}</td><td>${esc(answerOf(s))}</td><td>${model.slots.get(s).domain.length}</td><td>${o.clues.length || ''}</td><td>${o.inferences.length || ''}</td><td>${o.route.length || ''}</td></tr>`;
    }).join('')}</tbody></table>`;
}

function viewRoute() {
    const rows = route.map((st, i) => ({ st, i, told: routeTold(st), at: availableAt(st.premises ?? []) }))
        .filter(({ st }) => matches(st.id, routeTitle(st), (st.source ?? []).join(' ')));
    return `<p class="small muted">Holmes's reasoning in the story, in the case's order. “In hand” is when the reader holds every premise; “told” is where the story states it.</p>` + rows.map(({ st, i, told, at }) => `
<div class="item" data-id="${esc(st.id)}"><div class="item-head"><span class="para">${i + 1}</span> <b>${esc(routeTitle(st))}</b></div>
<div class="small muted">in hand ${at === undefined ? 'never' : `¶${at}`} · told ${told === undefined ? '—' : `¶${told}`} · ${esc(st.pattern ?? '')} · ${esc(st.reasoner ?? '')}</div>
${st.source?.length ? `<p class="quote">${esc(st.source[0].replace(/\s+/g, ' '))}</p>` : ''}
<div class="refs">${(st.premises ?? []).map((p) => ref(p, 50)).join(' ')}</div></div>`).join('');
}

function viewTimeline() {
    const by = new Map();
    const add = (p, kind, id) => {
        if (p === undefined) return;
        if (!by.has(p)) by.set(p, { clue: [], background: [], inference: [], route: [] });
        by.get(p)[kind].push(id);
    };
    for (const c of claims) add(para(c.id), 'clue', c.id);
    for (const r of rules) add(para(r.id), 'background', r.id);
    for (const k of inferences) add(availableAt(k.premises ?? []), 'inference', k.id);
    for (const st of route) add(routeTold(st), 'route', st.id);
    const paras = [...by.keys()].sort((a, b) => a - b).filter((p) => {
        const e = by.get(p);
        return matches(story(p), ...[...e.clue, ...e.background, ...e.inference, ...e.route].map((id) => shortText(id, 400)));
    });
    return `<p class="small muted">The story paragraph by paragraph (only those where something arrives). Inferences appear where their last premise arrives (background facts as they become relevant).</p>` + paras.map((p) => {
        const e = by.get(p);
        const part = (label, ids) => (ids.length ? `<div class="tl-part"><span class="small muted">${label}</span> ${ids.map((id) => ref(id, 70)).join(' ')}</div>` : '');
        return `<div class="item tl"><div class="item-head"><span class="para">¶${p}</span> <span class="quote">${esc(story(p).slice(0, 160))}${story(p).length > 160 ? '…' : ''}</span></div>
${part('clues', e.clue)}${part('background', e.background)}${part('inferences switch on', e.inference)}${part('Holmes concludes', e.route)}</div>`;
    }).join('');
}
const story = (p) => (game.story.paragraphs[p]?.display ?? '').replace(/\s+/g, ' ');

// ---------- graph ----------
function viewGraph() {
    if (!state.id) return '<p class="empty">Pick an item (click anything in another view, or a case question below), then come back here.</p>' + `<p>${(D.questions ?? []).map((q) => ref(q.slot)).join(' ')}</p>`;
    return `<div class="graph-bar small">Around ${ref(state.id)} · depth <select id="depth">${[1, 2, 3].map((d) => `<option ${d === state.depth ? 'selected' : ''}>${d}</option>`).join('')}</select>
<span class="muted">· clues and background → inferences → questions. Click a node to move there.</span></div><div id="cy"></div>`;
}
/** Neighbours of an item in the logic graph (both directions). */
function neighbours(id) {
    const out = new Set();
    const k = kindOf(id);
    if (k === 'inference' || k === 'route') {
        const x = byId.get(id).x;
        for (const p of x.premises ?? []) out.add(p);
        for (const s of formulaSlots(k === 'route' ? concl(x) : x.formula)) out.add(s);
    } else if (k === 'clue') {
        for (const s of formulaSlots(byId.get(id).x.asserts)) out.add(s);
        for (const u of usingCard.get(id) ?? []) out.add(u);
    } else if (k === 'background') {
        for (const u of usingCard.get(id) ?? []) out.add(u);
    } else if (k === 'question') {
        const o = onSlot.get(id);
        for (const x of [...(o?.inferences ?? []), ...(o?.clues ?? []), ...(o?.route ?? [])]) out.add(x);
    }
    return [...out];
}
function drawGraph() {
    const box = $('#cy');
    if (!box || !state.id) return;
    if (!window.cytoscape) { box.innerHTML = '<p class="empty">The graph library has not loaded.</p>'; return; }
    const nodes = new Set([state.id]);
    let frontier = [state.id];
    for (let d = 0; d < state.depth; d++) {
        const next = [];
        for (const n of frontier) for (const m of neighbours(n)) if (!nodes.has(m) && nodes.size < 160) { nodes.add(m); next.push(m); }
        frontier = next;
    }
    // Edges point the way reasoning flows: premise → inference/route → question; clue → question.
    const edges = [];
    for (const n of nodes) {
        const k = kindOf(n);
        if (k === 'inference' || k === 'route') {
            const x = byId.get(n).x;
            for (const p of x.premises ?? []) if (nodes.has(p)) edges.push([p, n]);
            for (const s of formulaSlots(k === 'route' ? concl(x) : x.formula)) if (nodes.has(s)) edges.push([n, s]);
        } else if (k === 'clue') for (const s of formulaSlots(byId.get(n).x.asserts)) if (nodes.has(s)) edges.push([n, s]);
    }
    const css = getComputedStyle(document.body);
    const color = { clue: '#b5651d', background: '#6b7f3a', inference: '#7a3b8a', route: '#2f5f8a', question: '#9b2c2c' };
    const cy = window.cytoscape({
        container: box,
        elements: [
            ...[...nodes].map((n) => ({ data: { id: n, label: shortText(n, 40), kind: kindOf(n) } })),
            ...edges.map(([a, b], i) => ({ data: { id: `e${i}`, source: a, target: b } })),
        ],
        style: [
            { selector: 'node', style: { label: 'data(label)', 'font-size': 9, color: css.getPropertyValue('--ink'), 'text-wrap': 'wrap', 'text-max-width': 120, 'text-valign': 'bottom', width: 14, height: 14, 'background-color': '#888' } },
            ...Object.entries(color).map(([k, c]) => ({ selector: `node[kind = "${k}"]`, style: { 'background-color': c } })),
            { selector: `node[id = "${state.id}"]`, style: { width: 22, height: 22, 'border-width': 3, 'border-color': css.getPropertyValue('--accent') } },
            { selector: 'edge', style: { width: 1, 'line-color': '#aaa', 'target-arrow-color': '#aaa', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'arrow-scale': 0.7 } },
        ],
        layout: { name: 'breadthfirst', directed: true, spacingFactor: 1.1, padding: 10 },
    });
    cy.on('tap', 'node', (e) => select(e.target.id(), true));
}

// ---------- detail ----------
function detail(id) {
    const k = kindOf(id);
    const list = (title, ids) => (ids.length ? `<h3>${title}</h3><div class="refs col">${ids.map((x) => ref(x)).join('')}</div>` : '');
    let h = `<div class="detail-head"><span class="kind">${KIND_LABEL[k] ?? k}</span> <code>${esc(id)}</code> <span class="link small" data-graph="${esc(id)}">graph</span></div>`;
    if (k === 'inference') {
        const x = byId.get(id).x;
        h += `<h2>${esc(x.label)}</h2><p class="small muted">${x.truth === false ? '<span class="tag bad">false</span> ' : ''}by ${esc(x.by ?? '?')} · premises in hand ${paraTag(availableAt(x.premises ?? []))}${statedText(x)}</p>${reading(x.formula)}${raw(x.formula)}`;
        h += (x.stated ?? []).map((st) => `<p class="quote">${esc(cardName(st.by))}: “${esc(st.source[0].replace(/\s+/g, ' '))}”</p>`).join('');
        h += list('Theories resting on it', (D.theories ?? []).filter((t) => (t.rests_on ?? []).includes(id)).map((t) => t.id));
        h += list('Premises (connect these to build it)', x.premises ?? []);
        h += list('Questions it speaks of', formulaSlots(x.formula));
        h += list('Holmes steps sharing its premises', route.filter((st) => (x.premises ?? []).every((p) => (st.premises ?? []).includes(p))).map((st) => st.id));
    } else if (k === 'clue') {
        const x = byId.get(id).x;
        h += `<h2>${esc(x.text)}</h2><p class="small muted">${x.truth === false ? '<span class="tag bad">false</span> ' : 'true · '}arrives ${paraTag(para(id))}</p>`;
        h += x.asserts ? `${reading(x.asserts)}${raw(x.asserts)}` : '<p class="small muted">Asserts nothing the questions can hold.</p>';
        h += (x.attested ?? []).map((a) => `<p class="small">${esc(a.via)} by ${esc(a.by ?? '?')}${a.to ? ` to ${esc(a.to)}` : ''}${a.source?.[0] ? `: <span class="quote">${esc(a.source[0].replace(/\s+/g, ' '))}</span>` : ''}</p>`).join('');
        h += list('Questions it speaks of', formulaSlots(x.asserts));
        h += list('Premise of', usingCard.get(id) ?? []);
        h += list('About', (x.about ?? []));
    } else if (k === 'background') {
        const x = byId.get(id).x;
        h += `<h2>${esc(x.text)}</h2><p class="small muted">arrives ${paraTag(para(id))}${x.relevant_from ? ` (relevant from “${esc(x.relevant_from.replace(/\s+/g, ' '))}”)` : ''}</p>`;
        h += list('Switches on (with the other premises)', usingCard.get(id) ?? []);
        h += list('Attaches to', x.attaches_to ?? []);
    } else if (k === 'route') {
        const x = byId.get(id).x;
        const f = concl(x);
        h += `<h2>${esc(routeTitle(x))}</h2><p class="small muted">${esc(x.pattern ?? '')} · ${esc(x.reasoner ?? '')} · in hand ${paraTag(availableAt(x.premises ?? []))} · told ¶${routeTold(x) ?? '—'}</p>${raw(f, 'conclusion')}`;
        h += (x.source ?? []).map((q) => `<p class="quote">${esc(q.replace(/\s+/g, ' '))}</p>`).join('');
        h += list('Premises', x.premises ?? []);
        h += list('Questions it settles', formulaSlots(f));
    } else if (k === 'theory') {
        const x = byId.get(id).x;
        h += `<h2>${esc(x.label)}</h2><p class="small muted">held by ${x.held_by.map((b) => esc(cardName(b))).join(', ')}</p>`;
        h += `<h3>Its answers</h3><ul class="small">${Object.entries(x.assignment).map(([sl, v]) => `<li>${ref(sl, 60)} → ${esc(valueName(sl, v))}${model.slots.get(sl).answer === v ? '' : ' <span class="tag bad">wrong</span>'}</li>`).join('')}</ul>`;
        h += list('Rests on', x.rests_on ?? []);
    } else if (k === 'question') {
        const s = model.slots.get(id);
        const o = onSlot.get(id) ?? { inferences: [], clues: [], route: [] };
        h += `<h2>${esc(questionTitle(id))}</h2><p>Answer: <b>${esc(answerOf(id))}</b></p><p class="small muted">On ${ref(s.on)} · ${s.domain.length} possible answers</p>`;
        h += `<details class="raw"><summary>possible answers</summary><p class="small">${s.domain.map((v) => (v === s.answer ? `<b>${esc(valueName(id, v))}</b>` : esc(valueName(id, v)))).join(' · ')}</p></details>`;
        h += list('Clues that speak of it', o.clues);
        h += list('Inferences that speak of it', o.inferences);
        h += list('Holmes steps', o.route);
    } else if (model.cards.has(id) || k === 'time') {
        h += `<h2>${esc(cardName(id))}</h2><p class="small muted">arrives ${paraTag(para(id))}</p>`;
        h += list('Its questions', [...model.slots.values()].filter((s) => s.on === id).map((s) => s.id));
        h += list('Clues about it', claims.filter((c) => (c.about ?? []).includes(id)).map((c) => c.id));
    }
    return h;
}

// ---------- drawing and events ----------
function render() {
    $('#views').innerHTML = VIEWS.map(([v, label]) => `<button class="tab ${v === state.view ? 'on' : ''}" data-view="${v}">${esc(label)}</button>`).join('');
    const fn = { overview: viewOverview, inferences: viewInferences, clues: viewClues, background: viewBackground, questions: viewQuestions, route: viewRoute, timeline: viewTimeline, graph: viewGraph }[state.view];
    $('#list').innerHTML = fn();
    $('#detail').innerHTML = state.id ? detail(state.id) : '<p class="empty">Click anything to see everything connected to it.</p>';
    document.body.classList.toggle('graph-view', state.view === 'graph');
    if (state.view === 'graph') drawGraph();
    // The tab bar sticks under the header, and the detail panel under both.
    document.documentElement.style.setProperty('--head', `${document.querySelector('header.top').offsetHeight}px`);
    document.documentElement.style.setProperty('--tabs', `${$('#views').offsetHeight}px`);
    const hash = `#${state.view}${state.id ? `/${encodeURIComponent(state.id)}` : ''}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
}
function select(id, keepView = false) {
    state.id = id;
    if (!keepView && state.view === 'overview') state.view = viewFor(id);
    render();
    if (window.innerWidth < 900) $('#detail').scrollIntoView({ block: 'start' });
}
const viewFor = (id) => ({ inference: 'inferences', clue: 'clues', background: 'background', route: 'route', question: 'questions' }[kindOf(id)] ?? 'overview');

document.addEventListener('click', (e) => {
    const v = e.target.closest('[data-view]');
    if (v) { state.view = v.dataset.view; render(); return; }
    const g = e.target.closest('[data-graph]');
    if (g) { state.view = 'graph'; state.id = g.dataset.graph; render(); return; }
    if (e.target.closest('details, summary, input, select, label')) return;
    const r = e.target.closest('[data-id]');
    if (r) select(r.dataset.id, true);
});
document.addEventListener('change', (e) => {
    if (e.target.id === 'all-q') { state.allQuestions = e.target.checked; render(); }
    if (e.target.id === 'depth') { state.depth = Number(e.target.value); render(); }
});
$('#search').addEventListener('input', (e) => {
    state.filter = e.target.value;
    const pos = e.target.selectionStart;
    render();
    e.target.focus();
    e.target.setSelectionRange(pos, pos);
});

const [v, id] = location.hash.slice(1).split('/');
if (VIEWS.some(([x]) => x === v)) state.view = v;
if (id) state.id = decodeURIComponent(id);
render();
