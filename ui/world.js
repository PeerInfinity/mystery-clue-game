// Watson's timeline (world.html): the world model shown as it is, an ordered list of events, filled in as the story
// is read. What Watson observes himself is certain; everything else comes through a chain of tellings, each link
// trusted as far as the player says (engine/world.js). Facts at or above the threshold are on the timeline; the
// contradictions among them are listed. Nothing shown runs ahead of the paragraph read to.

import { provenance, timeOrder, assertions, contradictions, places, givenAt, LEVELS, DEFAULT_LEVEL, linkKey, levelOf, CLAIM_ATTRS } from '../engine/world.js';

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
const story = text.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
const entityById = new Map(data.entities.map((e) => [e.id, e]));
const timeById = new Map(data.times.map((t) => [t.id, t]));
const factById = new Map(data.facts.map((f) => [f.id, f]));
const qById = new Map(data.questions.map((q) => [q.id, q]));
const accountById = new Map(data.accounts.map((a) => [a.id, a]));
const LAST = story.length - 1;

// --- State: how far the story is read, and the player's trust. Saved in this browser only.
const state = { para: 1, threshold: DEFAULT_LEVEL, showBelow: false, trust: { links: {}, people: {} }, sel: null };
try { Object.assign(state, JSON.parse(localStorage.getItem(STORE) ?? '{}')); } catch { /* a fresh start */ }
state.sel = null;
const save = () => { try { localStorage.setItem(STORE, JSON.stringify({ para: state.para, threshold: state.threshold, showBelow: state.showBelow, trust: state.trust })); } catch { /* not saved */ } };

// --- Words.
const DAYS = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
const nameOf = (id) => (id === '?' ? 'someone' : entityById.get(id)?.name ?? id);
const ent = (id) => (id && entityById.has(id) ? `<a class="ent" data-ent="${esc(id)}">${esc(nameOf(id))}</a>` : esc(id === '?' ? 'Someone' : id ?? ''));
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
/** Told by the paragraph read to, and modelled (a chain reaches Watson, or a telling). */
const visible = (f) => { const g = givenAt(f); return g != null && g <= state.para && levelOfFact(f) != null; };
const accepted = (f) => levelOfFact(f) >= state.threshold;

/** The assertions on the timeline: told so far, and trusted at least to the threshold. */
function acceptedAssertions() {
    return allAssertions.filter((x) => {
        const f = factById.get(x.fact);
        if (!visible(f)) return false;
        if (x.claim && x.claim === x.fact) return levelOf(prov.claimChains(x.claim), state.trust) >= state.threshold;
        return accepted(f);
    });
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

function eventRow(f, clashing) {
    const lvl = levelOfFact(f);
    const below = lvl < state.threshold;
    const cls = ['event', isTimeEvent(f) ? 'time-event' : '', below ? 'below' : '', clashing.has(f.id) ? 'clash' : '', state.sel === f.id ? 'sel' : ''].filter(Boolean).join(' ');
    return `<li class="${cls}" data-fact="${esc(f.id)}">${dot(lvl)}<span class="ph">${phrase(f)}${whenNote(f.time ?? {})}</span> <span class="para">¶${givenAt(f)}</span>${assertsHtml(f)}</li>`;
}

/** The events (all, or one entity's) in time order, under the time points they start at. */
function eventList(filter, clashing) {
    const shown = data.facts.filter((f) => visible(f) && filter(f) && (state.showBelow || accepted(f)));
    const at = new Map();
    for (const f of shown) {
        const a = anchorOf(f.time ?? {});
        at.set(a, [...(at.get(a) ?? []), f]);
    }
    const out = [];
    for (const id of data.order.sorted) {
        const fs = at.get(id);
        if (!fs) continue;
        fs.sort((a, b) => givenAt(a) - givenAt(b));
        out.push(`<li class="time-head">${timeLabel(id)}</li>`, ...fs.map((f) => eventRow(f, clashing)));
    }
    return out.length ? `<ol class="events">${out.join('')}</ol>` : '<p class="muted">Nothing yet.</p>';
}

function clashSide(x) {
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
    const clashing = new Set(clashes.flatMap((c) => [c.a.fact, c.b.fact]));
    document.getElementById('clashes').innerHTML = clashes.length
        ? `<details class="clash-box" open><summary>${clashes.length} contradiction${clashes.length > 1 ? 's' : ''} among what is on the timeline</summary><ol>${clashes.map((c) => `<li><b>${clashTitle(c)}</b><br>${clashSide(c.a)}<br>against ${clashSide(c.b)}</li>`).join('')}</ol><p class="small muted">Click a side to see where it comes from, then lower your trust in a link of its chain.</p></details>`
        : '';
    document.getElementById('timeline').innerHTML = eventList(() => true, clashing);
    renderDetail(clashing);
}

function chainHtml(c) {
    const links = c.links.map((l) => {
        const key = linkKey(l);
        const level = state.trust.links[key] ?? DEFAULT_LEVEL;
        const opts = LEVELS.slice(0, -1).map((n, i) => `<option value="${i}"${i === level ? ' selected' : ''}>${n}</option>`).join('');
        return `<span class="link-step">→ <span class="how">${esc(l.how)}${l.uncertain ? '?' : ''}</span> → ${ent(l.to)} <select class="link-trust" data-key="${esc(key)}" title="How far you trust this link">${opts}</select></span>`;
    }).join(' ');
    return `<li>${dot(levelOf([c], state.trust))}${ent(c.origin ?? '?')}${c.links.length ? ' ' + links : ' <span class="muted">(Watson’s own)</span>'}</li>`;
}
function peopleHtml(chains) {
    const people = [...new Set(chains.flatMap((c) => c.links.map((l) => l.from)))].filter((p) => p && p !== '?' && p !== 'watson');
    if (!people.length) return '';
    return `<h3>People</h3><ul class="people">${people.map((p) => {
        const v = state.trust.people[p];
        const opts = ['<option value="">no limit</option>', ...LEVELS.slice(0, -1).map((n, i) => `<option value="${i}"${v === i ? ' selected' : ''}>${n}</option>`)].join('');
        return `<li>${ent(p)}: at most <select class="person-trust" data-person="${esc(p)}">${opts}</select></li>`;
    }).join('')}</ul>`;
}

function renderDetail(clashing) {
    const el = document.getElementById('detail');
    const sel = state.sel;
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
    if (sel && entityById.has(sel)) {
        el.innerHTML = `<h2>${esc(nameOf(sel))}</h2><h3>Its timeline</h3>${eventList((f) => f.of === sel, clashing)}`;
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
document.getElementById('show-below').addEventListener('change', (e) => { state.showBelow = e.target.checked; save(); render(); });
document.getElementById('reset').addEventListener('click', () => {
    if (!confirm('Put every link and person back to uncertain?')) return;
    state.trust = { links: {}, people: {} }; save(); render();
});
document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-ent]');
    if (a) { state.sel = a.dataset.ent; render(); return; }
    const f = e.target.closest('[data-fact]');
    if (f && !e.target.closest('select')) { state.sel = f.dataset.fact; render(); }
});
document.addEventListener('change', (e) => {
    if (e.target.matches('.link-trust')) {
        const v = Number(e.target.value);
        if (v === DEFAULT_LEVEL) delete state.trust.links[e.target.dataset.key]; else state.trust.links[e.target.dataset.key] = v;
        save(); render();
    } else if (e.target.matches('.person-trust')) {
        const p = e.target.dataset.person;
        if (e.target.value === '') delete state.trust.people[p]; else state.trust.people[p] = Number(e.target.value);
        save(); render();
    }
});
render();
