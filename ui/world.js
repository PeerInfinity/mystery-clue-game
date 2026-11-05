// Watson's timeline (world.html): the world model shown as it is, an ordered list of events, filled in as the story
// is read. What Watson observes himself is certain; everything else comes through a chain of tellings, each link
// trusted as far as the player says (engine/world.js). Facts at or above the threshold are on the timeline; the
// contradictions among them are listed. Nothing shown runs ahead of the paragraph read to.

import { provenance, timeOrder, assertions, contradictions, places, givenAt, LEVELS, DEFAULT_LEVEL, linkKey, levelOf, resolvingLinks, CLAIM_ATTRS, markAssertions, hypothesisChain, hypothesisKey, HYPOTHESIS } from '../engine/world.js';

const CASE = 'cases/silver-blaze';
const STORE = 'silver-blaze-world-v1';
const get = (url, as = 'json') => fetch(url, { cache: 'no-cache' }).then((r) => {
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return as === 'json' ? r.json() : r.text();
});
const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const main = await get(`${CASE}/case.json`);
const [oldEntities, w, times, facts, accounts, questions, text] = await Promise.all([
    get(`${CASE}/entities.json`), get(`${CASE}/world/entities.json`), get(`${CASE}/world/times.json`),
    get(`${CASE}/world/facts.json`), get(`${CASE}/world/accounts.json`), get(`${CASE}/world/questions.json`),
    get(`${CASE}/${main.case.source.text_file}`, 'text'),
]);
const data = {
    entities: [...oldEntities.entities, ...w.entities], moves: w.moves ?? [], times: times.times, facts: facts.facts,
    accounts: accounts.accounts, questions: questions.questions,
};
data.order = timeOrder(data.times);
data.places = places(data);
const prov = provenance(data);
const allAssertions = assertions(data);
const assertionById = new Map(allAssertions.map((x) => [x.id, x]));
const story = text.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
const entityById = new Map(data.entities.map((e) => [e.id, e]));
const timeById = new Map(data.times.map((t) => [t.id, t]));
const factById = new Map(data.facts.map((f) => [f.id, f]));
const qById = new Map(data.questions.map((q) => [q.id, q]));
const accountById = new Map(data.accounts.map((a) => [a.id, a]));
const LAST = story.length - 1;

// --- State: how far the story is read, the player's trust and marks on questions. Saved in this browser only.
// `marks`: {question id: {possibility: 'circled' | 'crossed'}}; a possibility not in it is uncertain.
const state = { para: 1, threshold: DEFAULT_LEVEL, showBelow: false, trust: { links: {}, people: {} }, marks: {}, history: [], view: 'list', depth: 2, sel: null, qOpen: true };
try { Object.assign(state, JSON.parse(localStorage.getItem(STORE) ?? '{}')); } catch { /* a fresh start */ }
state.sel = null;
const save = () => { try { localStorage.setItem(STORE, JSON.stringify({ para: state.para, threshold: state.threshold, showBelow: state.showBelow, trust: state.trust, marks: state.marks, history: state.history, view: state.view, depth: state.depth, qOpen: state.qOpen })); } catch { /* not saved */ } };
// Every change of trust or of a mark can be undone: the state before it is kept (the last 50).
const remember = () => { state.history = [...state.history, JSON.stringify({ trust: state.trust, marks: state.marks })].slice(-50); };
const changeTrust = (fn) => { remember(); fn(state.trust); save(); render(); };
const MARK_NEXT = { undefined: 'circled', circled: 'crossed', crossed: undefined };
function cycleMark(qid, pick) {
    remember();
    const m = { ...(state.marks[qid] ?? {}) };
    const next = MARK_NEXT[m[pick]];
    if (next) m[pick] = next; else delete m[pick];
    state.marks = { ...state.marks, [qid]: m };
    save(); render();
}

// --- Words.
const DAYS = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
const nameOf = (id) => (id === '?' ? 'someone' : id === HYPOTHESIS ? 'Watson’s hypothesis' : entityById.get(id)?.name ?? id);
const ent = (id) => (id === HYPOTHESIS ? `<span class="hyp-name">${nameOf(id)}</span>` : id && entityById.has(id) ? `<a class="ent" data-ent="${esc(id)}">${esc(nameOf(id))}</a>` : esc(id === '?' ? 'Someone' : id ?? ''));
// A value: an entity id becomes its name; a text that starts with one ("silver_blaze (in his keeping)") too.
const val = (v) => list(v).map((x) => {
    if (x == null) return '<span class="muted">unknown</span>';
    const s = String(x);
    if (entityById.has(s)) return ent(s);
    const m = s.match(/^([a-z][a-z0-9_]*)([ ,(].*)$/);
    if (m && m[1].includes('_') && entityById.has(m[1])) return ent(m[1]) + esc(m[2]);
    return esc(s);
}).join(', ');
// A time point's label, once the story has dated it; before that only its day and hour.
const timeLabel = (id) => {
    const t = timeById.get(id);
    if (!t) return esc(id);
    if (t.para == null || t.para <= state.para) return esc(t.label);
    return esc([DAYS[t.day], t.clock].filter(Boolean).join(', ') || 'a time not yet told');
};
const qVisible = (q) => q && ((q.raised != null && q.raised <= state.para) || (q.answer_given_at != null && q.answer_given_at <= state.para));
// The player's questions: raised (or answered) so far; a question about provenance only if the story raises it.
const qListed = (q) => qVisible(q) && (q.kind !== 'provenance' || (q.raised != null && q.raised <= state.para));
const listedQuestions = () => data.questions.filter(qListed).sort((a, b) => (a.raised ?? a.answer_given_at) - (b.raised ?? b.answer_given_at));
const possShown = (q, pick) => qListed(q) && q.possibilities.some((p) => p.value === pick && p.available <= state.para);
const shownPossibilities = (q) => q.possibilities.filter((p) => p.available <= state.para);
const markOf = (q, pick) => state.marks[q.id]?.[pick];
const givenAway = (q) => q.answer != null && q.answer_given_at != null && q.answer_given_at <= state.para;
// The time point a question sits at on the timeline, if its entry has one.
const qAnchor = (q) => {
    const t = q.entry?.time;
    const id = typeof t === 'string' ? t : t ? (t.at ?? t.from ?? t.after ?? t.before ?? t.to) : null;
    return id && timeById.has(id) ? id : null;
};
const markLevel = (q, pick) => levelOf([hypothesisChain(q, pick)], state.trust);
const pickText = (q, pick) => (entityById.has(pick) ? ent(pick) : esc(pick));

/** A fact as a short sentence. */
function phrase(f) {
    const E = f.of === '?' ? 'Someone' : ent(f.of);
    const v = val(f.value);
    const d = f.detail ? ` <span class="muted">(${esc(f.detail)})</span>` : '';
    switch (f.attr) {
        case 'location': return f.value == null ? `${E}: ${esc(f.detail ?? 'whereabouts unknown')}` : `${E} ${f.neg ? '<b>not</b> at' : 'at'} ${v}${d}`;
        case 'lives_at': return `${E} lives at ${v}${d}`;
        case 'member_of': return `${E} is one of ${v}`;
        case 'carrying': return `${E} has ${v}${d}`;
        case 'wearing': return `${E} wears ${v}${d}`;
        case 'owner': return f.neg ? `${E} is <b>not</b> ${v}'s${d}` : `${E} belongs to ${v}${d}`;
        case 'identity': return `${E} ${f.neg ? 'is <b>not</b>' : 'is'} ${v}`;
        case 'name': return `${E} is called ${v}`;
        case 'says': return `${E}${f.to ? ` to ${ent(f.to)}` : ''}: <span class="said">${v}</span>`;
        case 'believes': return `${E} believes ${v}`;
        case 'knows': return `${E} knows ${v}`;
        case 'intends': return `${E} means ${v}`;
        case 'observes': {
            const seen = list(f.value).map((x) => factById.get(x)).filter((o) => o && visible(o));
            return seen.length ? `${E} sees: ${seen.map(phrase).join('; ')}` : `${E} notices something`;
        }
        case 'contents': return `${E} holds ${v}`;
        case 'reputed': return `${E}, by repute: ${v}`;
        case 'rule': return `${E}, as a rule: ${v}`;
        case 'weekday': return `It is ${v}`;
        case 'hour': return `${v}`;
        case 'tells': {
            const accts = list(f.value).map((a) => esc(accountById.get(a)?.label ?? a)).join(', ');
            return `${E} tells ${ent(f.to)} (${esc(f.how)}${f.partial ? ', in part' : ''}): ${accts}`;
        }
        default: return f.of === 'weather' ? `The weather: ${v}` : `${E}: ${v}${d}`;
    }
}
const TIME_ATTRS = new Set(['weekday', 'hour', 'time']);
const isTimeEvent = (f) => TIME_ATTRS.has(f.attr) || ['calendar', 'clock', 'weather'].includes(f.of);

// --- What is known, and how far it is trusted.
const chainsOf = (f) => (f.attr === 'tells' ? [] : prov.factChains(f.id));
/** A fact's level: a telling to Watson he witnesses (certain), any other telling as the story reports it (uncertain). */
function levelOfFact(f) {
    if (f.attr === 'tells') return f.to === 'watson' ? LEVELS.length - 1 : DEFAULT_LEVEL;
    return levelOf(chainsOf(f), state.trust);
}
/** The chains of an assertion: a claim's own assertions travel as the claim does, with the claimant's word ahead. */
const chainsOfAssertion = (x) => (x.mark ? [hypothesisChain(x.q, x.pick)] : x.claim && x.claim === x.fact ? prov.claimChains(x.fact) : chainsOf(factById.get(x.fact)));
/** Told by the paragraph read to, and modelled (a chain reaches Watson, or a telling). */
const visible = (f) => { const g = givenAt(f); return g != null && g <= state.para && levelOfFact(f) != null; };
const accepted = (f) => levelOfFact(f) >= state.threshold;

/** The assertions on the timeline: told so far, and trusted at least to the threshold; and the player's marks. */
function acceptedAssertions() {
    const marks = markAssertions(data, state.marks, possShown).filter((x) => markLevel(x.q, x.pick) >= state.threshold);
    return [...marks, ...allAssertions.filter((x) => {
        const f = factById.get(x.fact);
        if (!visible(f)) return false;
        if (x.claim && x.claim === x.fact) return levelOf(prov.claimChains(x.claim), state.trust) >= state.threshold;
        return accepted(f);
    })];
}

// --- Rendering.
const levelName = (l) => (l == null ? 'unmodelled' : LEVELS[l]);
const dot = (l) => `<span class="lvl lvl-${levelName(l)}" title="${levelName(l)}"></span>`;
const anchorOf = (t) => t.at ?? t.from ?? t.after ?? t.before ?? t.to;
function whenNote(t) {
    if (t.at) return '';
    if (t.from && t.to) return ` <span class="when">until ${timeLabel(t.to)}</span>`;
    if (t.after && t.before) return ` <span class="when">sometime before ${timeLabel(t.before)}</span>`;
    if (t.before && !t.after) return ` <span class="when">before this</span>`;
    if (t.to && !t.from) return ` <span class="when">until this</span>`;
    return '';
}

function assertsHtml(f) {
    if (!CLAIM_ATTRS.has(f.attr) || !list(f.asserts).length) return '';
    const items = list(f.asserts).filter((x) => !x.q || qVisible(qById.get(x.q)));
    if (!items.length) return '';
    const lvl = levelOf(prov.claimChains(f.id), state.trust);
    const may = f.modal ? ' <span class="small">(may be)</span>' : '';
    const li = items.map((x) => (x.q
        ? `<li>${dot(lvl)}${esc(qById.get(x.q).label)} ${x.neg ? '<b>Not</b> ' : ''}${pickText(qById.get(x.q), x.pick)}${may}</li>`
        : `<li>${dot(lvl)}${phrase({ ...x, id: '' })}${may}</li>`)).join('');
    return `<ul class="asserts" title="What this asserts">${li}</ul>`;
}

function eventRow(f, clashing, tag = 'li') {
    const lvl = levelOfFact(f);
    const below = lvl < state.threshold;
    const cls = ['event', isTimeEvent(f) ? 'time-event' : '', below ? 'below' : '', clashing.has(f.id) ? 'clash' : '', state.sel === f.id ? 'sel' : ''].filter(Boolean).join(' ');
    return `<${tag} class="${cls}" data-fact="${esc(f.id)}">${dot(lvl)}<span class="ph">${phrase(f)}${whenNote(f.time ?? {})}</span> <span class="para">¶${givenAt(f)}</span>${assertsHtml(f)}</${tag}>`;
}

/** A circled possibility as an entry of the world model: the question's entry with the possibility filled in. */
function hypPhrase(q, pick) {
    const e = q.entry ?? {};
    if (pick === 'something else') return `${esc(q.label)} <b>Something else</b>`;
    if (e.of === '?') return `${pickText(q, pick)}: ${esc(e.value ?? q.label)}`;
    if (e.value == null && ['location', 'identity', 'intends', 'contents', 'carrying', 'owner'].includes(e.attr)) return phrase({ of: e.of, attr: e.attr, value: pick });
    return `${esc(q.label)} <b>${pickText(q, pick)}</b>`;
}
/** A question at its place on the timeline, with its circled possibilities as entries under it. */
function questionRows(q, clashing, tag = 'li') {
    const sel = state.sel === `q:${q.id}` ? ' sel' : '';
    const crossed = shownPossibilities(q).filter((p) => markOf(q, p.value) === 'crossed').map((p) => pickText(q, p.value));
    const head = `<${tag} class="question${sel}${clashing.has(`q:${q.id}`) ? ' clash' : ''}" data-q="${esc(q.id)}"><span class="q-mark">?</span> ${esc(q.label)} <span class="para">¶${q.raised ?? q.answer_given_at}</span>${crossed.length ? ` <span class="small muted">crossed out: <s>${crossed.join('</s>, <s>')}</s></span>` : ''}${givenAway(q) ? ` <span class="small">answered ¶${q.answer_given_at}: <b>${pickText(q, q.answer)}</b></span>` : ''}</${tag}>`;
    const circles = shownPossibilities(q).filter((p) => markOf(q, p.value) === 'circled').map((p) => {
        const lvl = markLevel(q, p.value);
        if (lvl < state.threshold && !state.showBelow) return '';
        const cls = ['event', 'hyp', lvl < state.threshold ? 'below' : '', clashing.has(hypothesisKey(q.id, p.value)) ? 'clash' : '', givenAway(q) ? (p.value === q.answer ? 'right' : 'wrong') : ''].filter(Boolean).join(' ');
        return `<${tag} class="${cls}" data-q="${esc(q.id)}" title="Your hypothesis">${dot(lvl)}<span class="ph">${hypPhrase(q, p.value)}</span></${tag}>`;
    });
    return [head, ...circles];
}

/** The events (all, or one entity's) in time order, under the time points they start at, with the questions. */
function eventList(filter, clashing, qFilter = () => true) {
    const shown = data.facts.filter((f) => visible(f) && filter(f) && (state.showBelow || accepted(f)));
    const at = new Map();
    for (const f of shown) {
        const a = anchorOf(f.time ?? {});
        at.set(a, [...(at.get(a) ?? []), f]);
    }
    const qs = new Map();
    for (const q of listedQuestions()) {
        const a = qAnchor(q);
        if (a && qFilter(q)) qs.set(a, [...(qs.get(a) ?? []), q]);
    }
    const out = [];
    for (const id of data.order.sorted) {
        const fs = at.get(id) ?? [];
        const qq = qs.get(id) ?? [];
        if (!fs.length && !qq.length) continue;
        fs.sort((a, b) => givenAt(a) - givenAt(b));
        out.push(`<li class="time-head">${timeLabel(id)}</li>`, ...fs.map((f) => eventRow(f, clashing)), ...qq.flatMap((q) => questionRows(q, clashing)));
    }
    return out.length ? `<ol class="events">${out.join('')}</ol>` : '<p class="muted">Nothing yet.</p>';
}

// --- The grid: the same events, one per row, each in a column (its place, or its source).
const rankOf = (t) => data.order.rank.get(t) ?? -1;
/** Where an entity is at time t, as far as the timeline knows: its latest location on the timeline up to t. */
function locAt(id, t, depth = 0) {
    if (depth > 3) return null;
    let best = null;
    for (const f of data.facts) {
        if (f.of !== id || f.attr !== 'location' || f.neg || f.value == null || !visible(f) || !accepted(f)) continue;
        const r = rankOf(anchorOf(f.time ?? {}));
        if (r <= rankOf(t) && (!best || r >= best.r)) best = { r, f };
    }
    return best ? resolvePlace(best.f.value, t, depth + 1) : null;
}
/** A place that stays put is itself; a thing that moves (a vehicle, a purse, a person) is where it is at t. */
// A vehicle whose own place is not known is a column of its own (the train west of Reading); any other thing, none.
const movers = new Set(data.moves);
const resolvePlace = (v, t, depth = 0) => (data.places.fixed(v) ? v : locAt(v, t, depth) ?? (movers.has(v) ? v : null));
function placeOf(f) {
    const t = anchorOf(f.time ?? {});
    if (f.attr === 'location' && f.value != null) return f.neg ? f.value : resolvePlace(f.value, t);
    if (data.places.fixed(f.of)) return f.of;
    return f.of === '?' ? null : locAt(f.of, t);
}
// An outermost region with only one place inside it adds no level of its own (Devonshire holds only the moor).
const childCount = new Map();
for (const e of data.entities) if (e.within) childCount.set(e.within, (childCount.get(e.within) ?? 0) + 1);
const onlyChild = new Set([...childCount].filter(([, n]) => n === 1).map(([id]) => id));
/** A place's column at the chosen depth: its ancestor that many steps below the outermost region. */
function placeColumn(p) {
    if (!p) return null;
    const top = data.places.chain(p).reverse();
    while (top.length > 1 && onlyChild.has(top[0])) top.shift();
    return top[Math.min(state.depth - 1, top.length - 1)];
}
/** A fact's source: who first had it, on its best chain. */
function sourceOf(f) {
    if (f.attr === 'tells') return f.of;
    const cs = chainsOf(f);
    if (!cs.length) return null;
    let best = cs[0], bl = -1;
    for (const c of cs) { const l = levelOf([c], state.trust); if (l > bl) { bl = l; best = c; } }
    return best.origin ?? '?';
}
function eventGrid(clashing) {
    const shown = data.facts.filter((f) => visible(f) && (state.showBelow || accepted(f)));
    const colOf = (f) => (state.view === 'source' ? sourceOf(f) : placeColumn(placeOf(f))) ?? '—';
    const at = new Map();
    for (const f of shown) { const a = anchorOf(f.time ?? {}); at.set(a, [...(at.get(a) ?? []), f]); }
    const qs = new Map();
    for (const q of listedQuestions()) { const a = qAnchor(q); if (a) qs.set(a, [...(qs.get(a) ?? []), q]); }
    const rows = [];
    const cols = [];
    for (const id of data.order.sorted) {
        const fs = at.get(id) ?? [];
        const qq = qs.get(id) ?? [];
        if (!fs.length && !qq.length) continue;
        fs.sort((a, b) => givenAt(a) - givenAt(b));
        rows.push({ head: id });
        for (const f of fs) {
            const c = isTimeEvent(f) ? null : colOf(f);
            if (c && !cols.includes(c)) cols.push(c);
            rows.push({ f, c });
        }
        for (const q of qq) for (const html of questionRows(q, clashing, 'div')) if (html) rows.push({ html });
    }
    if (!rows.length) return '<p class="muted">Nothing yet.</p>';
    // Columns in order of first appearance, those of one region together; "—" (no place known) last.
    const region = (c) => (state.view === 'place' && entityById.has(c) ? data.places.chain(c).at(-1) : c);
    const regions = [...new Set(cols.map(region))];
    cols.sort((a, b) => (a === '—') - (b === '—') || regions.indexOf(region(a)) - regions.indexOf(region(b)) || 0);
    const colName = (c) => (c === '—' ? (state.view === 'place' ? 'place not known' : 'not modelled') : c === '?' ? 'unknown' : ent(c));
    // Each entry is placed by packGrid once it is drawn: `data-col` its column, or none for one across the grid.
    const head = `<div class="pack-head" style="--cols:${cols.length}">${cols.map((c) => `<div>${colName(c)}</div>`).join('')}</div>`;
    const body = rows.map((r) => {
        if (r.head) return `<div class="pack-item pack-time">${timeLabel(r.head)}</div>`;
        if (r.html) return `<div class="pack-item grid-span">${r.html}</div>`;
        if (!r.c) return `<div class="pack-item grid-span">${eventRow(r.f, clashing, 'div')}</div>`;
        return `<div class="pack-item" data-col="${cols.indexOf(r.c)}">${eventRow(r.f, clashing, 'div')}</div>`;
    }).join('');
    return `<div class="grid-wrap"><div class="pack" style="--cols:${cols.length}">${head}<div class="pack-body">${body}</div></div></div>`;
}

/**
 * Pack the grid: entries keep their order, but an entry only has to start a line below the start of the one before
 * it (and below the end of the one above it in its own column), so entries in different columns sit side by side.
 * An entry across the grid (a time point, a time event) starts below everything before it.
 */
function packGrid() {
    const body = document.querySelector('.pack-body');
    if (!body) return;
    const ncols = Number(body.parentElement.style.getPropertyValue('--cols'));
    const colW = body.parentElement.querySelector('.pack-head > div')?.getBoundingClientRect().width ?? 160;
    const step = parseFloat(getComputedStyle(body).lineHeight) || 17;
    const GAP = 4;
    const bottoms = new Array(ncols).fill(0);
    let lastTop = -step;
    for (const el of body.children) {
        const col = el.dataset.col;
        if (col == null) {
            el.style.left = '0'; el.style.width = `${ncols * colW}px`;
            const top = Math.max(lastTop + step, ...bottoms);
            el.style.top = `${top}px`;
            const bottom = top + el.offsetHeight + GAP;
            bottoms.fill(bottom);
            lastTop = top;
        } else {
            const c = Number(col);
            el.style.left = `${c * colW}px`; el.style.width = `${colW}px`;
            const top = Math.max(lastTop + step, bottoms[c]);
            el.style.top = `${top}px`;
            bottoms[c] = top + el.offsetHeight + GAP;
            lastTop = top;
        }
    }
    body.style.height = `${Math.max(...bottoms, 0)}px`;
}

const markText = (x) => `${x.neg ? 'You crossed out' : 'Your hypothesis'}: ${pickText(qById.get(x.q), x.pick)}`;
function clashSide(x) {
    if (x.mark) return `<a class="link" data-q="${esc(x.q)}">${markText(x)}</a>`;
    const f = factById.get(x.fact);
    if (x.kind === 'pick') {
        const q = qById.get(x.q);
        const who = x.claim ? `${ent(f.of)} ${f.attr === 'believes' ? 'believes' : 'says'}: ` : '';
        return `<a class="link" data-fact="${esc(f.id)}">${who}${x.neg ? 'not ' : ''}${pickText(q, x.pick)}</a> <span class="para">¶${givenAt(f)}</span>`;
    }
    return `<a class="link" data-fact="${esc(f.id)}">${phrase(f)}</a> <span class="para">¶${givenAt(f)}</span>`;
}
function clashTitle(c) {
    if (c.a.kind === 'pick') return esc(qById.get(c.a.q)?.label ?? c.a.q);
    const f = factById.get(c.a.fact);
    return `${ent(f.of)}: ${f.attr === 'location' ? 'in two places at once?' : 'two identities?'}`;
}

const clashKey = (c) => `clash:${c.a.id}|${c.b.id}`;
let current = [];

function render() {
    document.getElementById('para').value = state.para;
    document.getElementById('para').max = LAST;
    document.getElementById('next').disabled = state.para >= LAST;
    document.getElementById('back').disabled = state.para <= 1;
    document.getElementById('show-below').checked = state.showBelow;
    const th = document.getElementById('threshold');
    th.innerHTML = LEVELS.slice(0, -1).map((l, i) => `<option value="${i}"${i === state.threshold ? ' selected' : ''}>${l}</option>`).join('');

    // The story so far, the newest paragraph last and in view.
    const st = document.getElementById('story');
    st.innerHTML = story.slice(1, state.para + 1).map((p, i) => `<p class="${i + 1 === state.para ? 'now' : ''}"><span class="para">¶${i + 1}</span> ${esc(p).replace(/_([^_]+)_/g, '<em>$1</em>')}</p>`).join('');
    st.lastElementChild?.scrollIntoView({ block: 'nearest' });

    const clashes = contradictions(data, acceptedAssertions());
    const clashing = new Set(clashes.flatMap((c) => [c.a, c.b]).flatMap((x) => (x.mark ? [x.id, `q:${x.q}`] : [x.fact])));
    current = clashes;
    document.getElementById('undo').disabled = !state.history.length;
    document.getElementById('clashes').innerHTML = clashes.length
        ? `<details class="clash-box" open><summary>${clashes.length} contradiction${clashes.length > 1 ? 's' : ''} among what is on the timeline</summary><ol>${clashes.map((c) => `<li class="${state.sel === clashKey(c) ? 'sel' : ''}"><b>${clashTitle(c)}</b> <a class="link trace" data-clash="${esc(clashKey(c))}">trace</a><br>${clashSide(c.a)}<br>against ${clashSide(c.b)}</li>`).join('')}</ol><p class="small muted">Trace a contradiction to see both sides' chains, then lower your trust in a link of one of them.</p></details>`
        : '';
    document.getElementById('questions').innerHTML = questionsPanel(clashing);
    document.getElementById('view').value = state.view;
    document.getElementById('depth').value = String(state.depth);
    document.getElementById('depth-label').hidden = state.view !== 'place';
    document.querySelector('.world-main').classList.toggle('wide', state.view !== 'list');
    document.getElementById('timeline').innerHTML = state.view === 'list' ? eventList(() => true, clashing) : eventGrid(clashing);
    if (state.view !== 'list') packGrid();
    renderDetail(clashing);
}

function chainHtml(c, resolving = null) {
    const links = c.links.map((l) => {
        const key = linkKey(l);
        const mark = resolving?.links.includes(key) ? ' resolving' : '';
        const level = state.trust.links[key] ?? DEFAULT_LEVEL;
        const opts = LEVELS.slice(0, -1).map((n, i) => `<option value="${i}"${i === level ? ' selected' : ''}>${n}</option>`).join('');
        return `<span class="link-step${mark}"${mark ? ' title="Distrusting this link alone takes this side off the timeline"' : ''}>→ <span class="how">${esc(l.how)}${l.uncertain ? '?' : ''}</span> → ${ent(l.to)} <select class="link-trust" data-key="${esc(key)}" title="How far you trust this link">${opts}</select>${dropChip(resolving?.drop?.links.get(key))}</span>`;
    }).join(' ');
    return `<li>${dot(levelOf([c], state.trust))}${ent(c.origin ?? '?')}${c.links.length ? ' ' + links : ' <span class="muted">(Watson’s own)</span>'}</li>`;
}
function peopleHtml(chains, resolving = null) {
    const people = [...new Set(chains.flatMap((c) => c.links.map((l) => l.from)))].filter((p) => p && p !== '?' && p !== 'watson');
    if (!people.length) return '';
    return `<h3>People</h3><ul class="people">${people.map((p) => {
        const v = state.trust.people[p];
        const opts = ['<option value="">no limit</option>', ...LEVELS.slice(0, -1).map((n, i) => `<option value="${i}"${v === i ? ' selected' : ''}>${n}</option>`)].join('');
        const mark = resolving?.people.includes(p) ? ' class="resolving" title="Distrusting this person alone takes this side off the timeline"' : '';
        return `<li${mark}>${ent(p)}: at most <select class="person-trust" data-person="${esc(p)}">${opts}</select>${dropChip(resolving?.drop?.people.get(p))}</li>`;
    }).join('')}</ul>`;
}

/** How many events now on the timeline distrusting a link (or a person) would take off it. */
function dropCounts(chains) {
    const on = data.facts.filter((f) => f.attr !== 'tells' && visible(f) && accepted(f));
    const count = (trust) => on.filter((f) => levelOf(chainsOf(f), trust) < state.threshold).length;
    const links = new Map(), people = new Map();
    for (const k of new Set(chains.flatMap((c) => c.links.map(linkKey)))) links.set(k, count({ ...state.trust, links: { ...state.trust.links, [k]: 0 } }));
    for (const p of new Set(chains.flatMap((c) => c.links.map((l) => l.from)))) people.set(p, count({ ...state.trust, people: { ...state.trust.people, [p]: 0 } }));
    return { links, people };
}
const dropChip = (n) => (!n ? '' : ` <span class="drop" title="Distrusting it takes ${n} event${n === 1 ? '' : 's'} now on the timeline off it">−${n}</span>`);

function sideHtml(x, label) {
    const chains = chainsOfAssertion(x);
    const r = { ...resolvingLinks(chains, state.trust, state.threshold), drop: dropCounts(chains) };
    if (x.mark) {
        return `<div class="side"><h3>${label}</h3><p><a class="link" data-q="${esc(x.q)}">${markText(x)}</a></p>
      <p class="small">Trusted: <b>${levelName(levelOf(chains, state.trust))}</b>. Change the mark, or lower your trust in it.</p>
      <ul class="chains">${chains.map((c) => chainHtml(c, r)).join('')}</ul>${peopleHtml(chains, r)}</div>`;
    }
    const f = factById.get(x.fact);
    const what = x.kind === 'pick'
        ? `${x.claim ? `${ent(f.of)} ${f.attr === 'believes' ? 'believes' : 'says'}: ` : ''}${x.neg ? 'not ' : ''}${pickText(qById.get(x.q), x.pick)}`
        : phrase(f);
    return `<div class="side"><h3>${label}</h3><p><a class="link" data-fact="${esc(f.id)}">${what}</a></p>
      <p class="quote">“${esc(f.given_quote ?? f.quote)}” <span class="para">¶${givenAt(f)}</span></p>
      <p class="small">Trusted: <b>${levelName(levelOf(chains, state.trust))}</b>${r.links.length || r.people.length ? '; <span class="resolving">marked</span>: distrusting it alone takes this side off the timeline' : '; no single link takes it off: it has independent chains'}.</p>
      <ul class="chains">${chains.map((c) => chainHtml(c, r)).join('')}</ul>${peopleHtml(chains, r)}</div>`;
}

// --- Questions: the panel, and one question in the detail.
const MARK_TITLE = { undefined: 'Uncertain: click to circle', circled: 'Circled: click to cross out', crossed: 'Crossed out: click to make uncertain again' };
function chip(q, p) {
    const m = markOf(q, p.value);
    const judged = givenAway(q) && m ? ((m === 'circled') === (p.value === q.answer) ? ' right' : ' wrong') : '';
    return `<button type="button" class="poss ${m ?? 'open'}${judged}" data-mark-q="${esc(q.id)}" data-mark-pick="${esc(p.value)}" title="${MARK_TITLE[m]}">${pickText(q, p.value)}</button>`;
}
function questionsPanel(clashing) {
    const qs = listedQuestions();
    if (!qs.length) return '';
    const items = qs.map((q) => `<li class="${state.sel === `q:${q.id}` ? 'sel' : ''}${clashing.has(`q:${q.id}`) ? ' clash' : ''}"><a class="link" data-q="${esc(q.id)}">${esc(q.label)}</a> <span class="para">¶${q.raised ?? q.answer_given_at}</span>${qAnchor(q) ? '' : ' <span class="small muted" title="Its entry has no place in time: it is only here">(no time)</span>'}
      <div class="poss-row">${shownPossibilities(q).map((p) => chip(q, p)).join('')}</div>${givenAway(q) ? `<div class="small">Answered at ¶${q.answer_given_at}: <b>${pickText(q, q.answer)}</b></div>` : ''}</li>`).join('');
    return `<details class="q-box" id="q-box"${state.qOpen ? ' open' : ''}><summary>Questions (${qs.length})</summary><ol>${items}</ol><p class="small muted">Click a possibility to circle it, again to cross it out, again to leave it uncertain. What you circle goes on the timeline as your hypothesis.</p></details>`;
}
function questionDetail(q, clashing) {
    const marked = shownPossibilities(q).filter((p) => markOf(q, p.value));
    const chains = marked.map((p) => hypothesisChain(q.id, p.value));
    const markLi = marked.map((p) => `<li>${markOf(q, p.value) === 'circled' ? 'Circled' : 'Crossed out'}: ${pickText(q, p.value)}${clashing.has(hypothesisKey(q.id, p.value)) ? ' <span class="bad small">in a contradiction</span>' : ''}<ul class="chains">${chainHtml(hypothesisChain(q.id, p.value))}</ul></li>`).join('');
    return `<h2><span class="q-mark">?</span> ${esc(q.label)}</h2>
      <p class="quote">“${esc(q.quote ?? '')}” <span class="para">¶${q.raised ?? q.answer_given_at}</span></p>
      ${qAnchor(q) ? `<p class="small">When: ${timeLabel(qAnchor(q))}${whenNote(typeof q.entry.time === 'string' ? {} : q.entry.time)}.</p>` : ''}
      <div class="poss-row">${shownPossibilities(q).map((p) => chip(q, p)).join('')}</div>
      ${givenAway(q) ? `<p class="small">Answered at ¶${q.answer_given_at}: <b>${pickText(q, q.answer)}</b><br><span class="quote">“${esc(q.answer_given_quote ?? '')}”</span></p>` : ''}
      ${marked.length ? `<h3>Your marks, from Watson’s hypothesis</h3><ul class="marks">${markLi}</ul>${peopleHtml(chains)}` : '<p class="small muted">No marks yet: every possibility is uncertain.</p>'}`;
}

function renderDetail(clashing) {
    const el = document.getElementById('detail');
    const sel = state.sel;
    if (sel?.startsWith('clash:')) {
        const [a, b] = sel.slice(6).split('|').map((id) => assertionById.get(id));
        const open = current.find((c) => clashKey(c) === sel);
        const c = open ?? { a, b };
        el.innerHTML = `<h2>${clashTitle(c)}</h2>
          <p class="small ${open ? 'bad' : 'good'}">${open ? 'Both sides are on the timeline: they cannot both hold.' : 'Resolved: one side is no longer on the timeline.'}</p>
          ${sideHtml(c.a, 'One side')}${sideHtml(c.b, 'Against')}`;
        return;
    }
    if (sel && factById.has(sel)) {
        const f = factById.get(sel);
        const chains = chainsOf(f);
        const content = CLAIM_ATTRS.has(f.attr) && list(f.asserts).length ? prov.claimChains(f.id) : [];
        el.innerHTML = `<h2>${phrase(f)}</h2>
          <p class="quote">“${esc(f.given_quote ?? f.quote)}” <span class="para">¶${givenAt(f)}</span></p>
          <p class="small">When: ${timeLabel(anchorOf(f.time ?? {}))}${whenNote(f.time ?? {})}. Trusted: <b>${levelName(levelOfFact(f))}</b>.</p>
          ${f.attr === 'tells' ? '<p class="small muted">A telling: how an account passed from one person to another.</p>'
            : `<h3>How Watson has it</h3><ul class="chains">${chains.map(chainHtml).join('')}</ul>`}
          ${content.length ? `<h3>What it asserts reaches him</h3><ul class="chains">${content.map(chainHtml).join('')}</ul>${assertsHtml(f)}` : ''}
          ${peopleHtml([...chains, ...content])}`;
        return;
    }
    if (sel?.startsWith('q:') && qById.has(sel.slice(2)) && qListed(qById.get(sel.slice(2)))) {
        el.innerHTML = questionDetail(qById.get(sel.slice(2)), clashing);
        return;
    }
    if (sel && entityById.has(sel)) {
        el.innerHTML = `<h2>${esc(nameOf(sel))}</h2><h3>Its timeline</h3>${eventList((f) => f.of === sel, clashing, (q) => q.entry?.of === sel)}`;
        return;
    }
    el.innerHTML = '<p class="muted">Click an event for where it comes from, or a name for its own timeline.</p>';
}

// --- Events.
const setPara = (n) => { state.para = Math.max(1, Math.min(LAST, n | 0)); save(); render(); };
document.getElementById('next').addEventListener('click', () => setPara(state.para + 1));
document.getElementById('back').addEventListener('click', () => setPara(state.para - 1));
document.getElementById('para').addEventListener('change', (e) => setPara(Number(e.target.value)));
document.getElementById('threshold').addEventListener('change', (e) => { state.threshold = Number(e.target.value); save(); render(); });
document.getElementById('view').addEventListener('change', (e) => { state.view = e.target.value; save(); render(); });
document.getElementById('depth').addEventListener('change', (e) => { state.depth = Number(e.target.value); save(); render(); });
document.getElementById('show-below').addEventListener('change', (e) => { state.showBelow = e.target.checked; save(); render(); });
document.getElementById('reset').addEventListener('click', () => {
    if (!confirm('Put every link and person back to uncertain?')) return;
    changeTrust((tr) => { tr.links = {}; tr.people = {}; });
});
document.addEventListener('toggle', (e) => { if (e.target.id === 'q-box') { state.qOpen = e.target.open; save(); } }, true);
document.getElementById('undo').addEventListener('click', () => {
    if (!state.history.length) return;
    const h = JSON.parse(state.history.at(-1));
    if (h.trust) { state.trust = h.trust; state.marks = h.marks ?? {}; } else state.trust = h;
    state.history = state.history.slice(0, -1);
    save(); render();
});
document.addEventListener('click', (e) => {
    const m = e.target.closest('[data-mark-q]');
    if (m) { cycleMark(m.dataset.markQ, m.dataset.markPick); return; }
    const q = e.target.closest('[data-q]');
    if (q && !e.target.closest('select, [data-ent]')) { state.sel = `q:${q.dataset.q}`; render(); return; }
    const t = e.target.closest('[data-clash]');
    if (t) { state.sel = t.dataset.clash; render(); return; }
    const a = e.target.closest('[data-ent]');
    if (a) { state.sel = a.dataset.ent; render(); return; }
    const f = e.target.closest('[data-fact]');
    if (f && !e.target.closest('select')) { state.sel = f.dataset.fact; render(); }
});
document.addEventListener('change', (e) => {
    if (e.target.matches('.link-trust')) {
        const v = Number(e.target.value), k = e.target.dataset.key;
        changeTrust((tr) => { if (v === DEFAULT_LEVEL) delete tr.links[k]; else tr.links[k] = v; });
    } else if (e.target.matches('.person-trust')) {
        const p = e.target.dataset.person, v = e.target.value;
        changeTrust((tr) => { if (v === '') delete tr.people[p]; else tr.people[p] = Number(v); });
    }
});
render();
