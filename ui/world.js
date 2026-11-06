// Watson's timeline (world.html): the world model shown as it is, an ordered list of events, filled in as the story
// is read. What Watson observes himself is certain; everything else comes through a chain of tellings, each link
// trusted as far as the player says (engine/world.js). Facts at or above the threshold are on the timeline; the
// contradictions among them are listed. Nothing shown runs ahead of the paragraph read to.

import { provenance, timeOrder, assertions, contradictions, places, givenAt, LEVELS, DEFAULT_LEVEL, linkKey, levelOf, resolvingLinks, CLAIM_ATTRS, markAssertions, hypothesisChain, hypothesisKey, HYPOTHESIS, answerKinds, entityKinds, isRight } from '../engine/world.js';
import { ACTIONS, STATES, OPEN_STATES, REASONING, pointChange, pointImplications, requirementStatus, reasonedEntries, agentNeeds, checkFit, checkPlan, accountsFor, comparePlans, impliedSteps, stops, meets, orderSteps } from '../engine/actions.js';

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
// Likely clashes (world/strains.json): optional.
const strainList = await get(`${CASE}/world/strains.json`).then((x) => x.strains ?? []).catch(() => []);
const data = {
    entities: [...oldEntities.entities, ...w.entities], moves: w.moves ?? [], joins: w.joins ?? {}, times: times.times, facts: facts.facts,
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
// The entries the player's moves give (Watson's reasoning), worked out afresh at each drawing.
let reasoned = [];
let reasonedById = new Map();
let lapsed = [];          // the player's moves that no longer hold, each with why (engine/actions.js reasonedEntries)
let heldKeys = null;      // the moves that held at the last drawing (null before the first): one that lapses is announced
let lapseNews = [];       // the lapses announced, until dismissed or no longer lapsed
const factOf = (id) => factById.get(id) ?? reasonedById.get(id) ?? hypIntention(id) ?? hypAction(id) ?? presupposed(id);
/**
 * A circled aim with a goal (the stranger's "get information to bet on") as an intention: Watson's hypothesis, so
 * the player's plan can be built on it. Its id is the mark's key.
 */
function hypIntention(id, anyMark = false) {
    const m = /^hyp:(.+)=(.+)$/.exec(id ?? '');
    if (!m) return null;
    const q = qById.get(m[1]);
    const p = q?.possibilities.find((x) => x.value === m[2]);
    if (!p?.goal || (!anyMark && markOf(q, p.value) !== 'circled') || !possShown(q, p.value)) return null;
    return { id, of: q.entry.of, attr: 'intends', value: p.value, goal: p.goal, ...(p.step ? { step: p.step } : {}), time: hypTime(q), hyp: { q: q.id, pick: p.value }, given_at: q.raised };
}
const hypTime = (q) => (q.entry.time && typeof q.entry.time === 'object' ? q.entry.time : typeof q.entry.time === 'string' ? { at: q.entry.time } : {});
/**
 * A circled answer to a who-question whose entry is a typed action (who led the horse out?): that one doing it, as an
 * action of Watson's hypothesis, which the moves can link like any other.
 */
/**
 * A why-question presupposes its action ("Why was a match struck in the hollow?": Straker struck a light): with any of
 * its answers circled, that action is on the timeline as the player's hypothesis. Its id: `pre:<question>`.
 */
function presupposed(id) {
    const m = /^pre:(.+)$/.exec(id ?? '');
    const q = m && qById.get(m[1]);
    if (!q?.presupposes || !qListed(q) || !q.possibilities.some((p) => markOf(q, p.value) === 'circled' && possShown(q, p.value))) return null;
    return { id, of: q.entry.of, attr: 'action', ...q.presupposes, time: hypTime(q), hyp: { q: q.id, pre: true }, given_at: q.raised };
}
function hypAction(id) {
    const m = /^hyp:(.+)=(.+)$/.exec(id ?? '');
    if (!m) return null;
    const q = qById.get(m[1]);
    // An answer that is itself an action ("Straker's own knife": cut by it as he fell).
    const own = q?.possibilities.find((p) => p.value === m[2])?.action;
    if (own && markOf(q, m[2]) === 'circled' && possShown(q, m[2])) return { id, attr: 'action', ...own, time: own.time ?? hypTime(q), hyp: { q: q.id, pick: m[2] }, given_at: q.raised };
    if (!q?.entry?.act || !entityById.has(m[2]) || markOf(q, m[2]) !== 'circled' || !possShown(q, m[2])) return null;
    const { act, thing, to, item, via, where } = q.entry;
    return { id, of: m[2], attr: 'action', act, ...(thing ? { thing } : {}), ...(to ? { to } : {}), ...(item ? { item } : {}), ...(via ? { via } : {}), ...(where ? { where } : {}), time: hypTime(q), hyp: { q: q.id, pick: m[2] }, given_at: q.raised };
}
const allFacts = () => [...data.facts, ...reasoned];
const qById = new Map(data.questions.map((q) => [q.id, q]));
const accountById = new Map(data.accounts.map((a) => [a.id, a]));
const LAST = story.length - 1;

// --- State: how far the story is read, the player's trust and marks on questions. Saved in this browser only.
// `marks`: {question id: {possibility: 'circled' | 'crossed'}}; a possibility not in it is uncertain.
// `reasoning`: the player's moves on the timeline, in order: {move: 'a', a, b} (a change between two states) or
// {move: 'b', of} (what an action needs and does); the entries they give are worked out afresh (engine/actions.js).
const state = { para: 1, threshold: DEFAULT_LEVEL, showBelow: false, trust: { links: {}, people: {} }, marks: {}, reasoning: [], history: [], view: 'list', depth: 2, sel: null, qOpen: true, note: null, layout: 'three', panels: ['story', 'timeline'], theme: 'system', onlyMoves: false, held: [] };
try { Object.assign(state, JSON.parse(localStorage.getItem(STORE) ?? '{}')); } catch { /* a fresh start */ }
state.sel = null;
state.note = null;
if (!Array.isArray(state.held)) state.held = [];
const save = () => { try { localStorage.setItem(STORE, JSON.stringify({ para: state.para, threshold: state.threshold, showBelow: state.showBelow, trust: state.trust, marks: state.marks, reasoning: state.reasoning, history: state.history, view: state.view, depth: state.depth, qOpen: state.qOpen, layout: state.layout, panels: state.panels, theme: state.theme, onlyMoves: state.onlyMoves, held: state.held })); } catch { /* not saved */ } };
// Every change of trust or of a mark can be undone: the state before it is kept (the last 50).
const remember = () => { state.history = [...state.history, JSON.stringify({ trust: state.trust, marks: state.marks, reasoning: state.reasoning, held: state.held })].slice(-50); };
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
const nameOf = (id) => (id === '?' ? 'someone' : id === HYPOTHESIS ? 'Watson’s hypothesis' : id === REASONING ? 'Watson’s reasoning' : entityById.get(id)?.name ?? id);
const ent = (id) => (id === HYPOTHESIS || id === REASONING ? `<span class="hyp-name">${nameOf(id)}</span>` : id && entityById.has(id) ? `<a class="ent" data-ent="${esc(id)}">${esc(nameOf(id))}</a>` : esc(id === '?' ? 'Someone' : id ?? ''));
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
// When each entity is first met: the earliest paragraph a fact naming it is given at.
const kindOf = entityKinds(data);
const firstMet = new Map();
for (const f of data.facts) {
    const g = givenAt(f);
    if (g == null) continue;
    for (const id of [f.of, f.to, ...list(f.value)]) if (typeof id === 'string' && entityById.has(id) && !(firstMet.get(id) <= g)) firstMet.set(id, g);
}
const OTHER_IDEAS = 'Other ideas';
const KIND_GROUP = { person: 'People and animals met so far', animal: 'People and animals met so far', place: 'Places met so far' };
/**
 * Every answer the player may mark on a question now. `proposed`: put forward by someone in the story (`via: direct`),
 * or "something else"; the rest are behind "More": the reader's other ideas (`via: indirect`) and, for a "who"
 * question, every person and animal met so far, for a "where" question every place, so that no list points at one.
 */
function questionOptions(q) {
    // An idea that is itself a person, animal or place goes in among all the others met so far, not on its own.
    const kinds = answerKinds(q, kindOf);
    const isKind = (v) => kinds.includes(kindOf(v));
    const listed = q.possibilities.filter((p) => p.available <= state.para);
    const out = listed.filter((p) => p.via !== 'indirect' || !isKind(p.value)).map((p) => ({ value: p.value, proposed: p.via !== 'indirect', group: OTHER_IDEAS }));
    if (!kinds.length) return out;
    const met = data.entities.filter((e) => isKind(e.id) && e.id !== q.entry?.of && !out.some((o) => o.value === e.id)
        && (firstMet.get(e.id) <= state.para || listed.some((p) => p.value === e.id)));
    met.sort((a, b) => nameOf(a.id).localeCompare(nameOf(b.id)));
    return [...out, ...met.map((e) => ({ value: e.id, proposed: false, group: KIND_GROUP[e.kind] }))];
}
const possShown = (q, pick) => qListed(q) && questionOptions(q).some((o) => o.value === pick);
const shownPossibilities = questionOptions;
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
/** The key's answer, with any other right answers (`also_right`): "noise, or light". */
const answerText = (q) => [q.answer, ...(q.also_right ?? [])].map((p) => pickText(q, p)).join(', or ');

const KIND_WORD = { money: 'money', message: 'a message', drug: 'a drug' };
/** A typed action or an intention as a short phrase: who, doing what, to whom, with what. */
function stepText(x) {
    if (!list(x.act).length) return x.hyp ? (/^to /.test(x.value) ? `${ent(x.of)}, aiming ${esc(x.value)}` : `${ent(x.of)}, driven by ${esc(x.value)}`) : x.goal ? `${ent(x.of)} wants: ${phrase({ ...x.goal, id: '' })}` : phrase(x);
    const roles = [x.thing && ent(x.thing), x.to && `${x.act === 'give' ? 'to ' : ''}${ent(x.to)}`, x.item && (list(x.act).includes('take') ? val(x.item) : list(x.act).includes('cut_self') ? `by ${val(x.item)}` : `with ${val(x.item)}`), x.about && `for ${esc(x.about)}`, x.via && `through ${ent(x.via)}`].filter(Boolean).join(' ');
    const note = x.intended ? ' <span class="small muted">(intended)</span>' : x.hyp ? ' <span class="small muted">(your hypothesis)</span>' : '';
    return `${x.of === '?' ? 'Someone' : ent(x.of)}: ${list(x.act).map((t) => ACTIONS[t].label).join(' and ')} ${roles}${note}`;
}
/** A fact as a short sentence. */
function phrase(f) {
    const E = f.of === '?' ? 'Someone' : ent(f.of);
    if (f.reasoned && f.attr === 'action' && f.act) return `${E}: ${list(f.act).map((t) => ACTIONS[t].label).join(' and ')} ${ent(f.thing)}`;
    if (f.away) return `${E} away from ${ent(f.away)}${f.hyp === true ? ' <span class="small muted">(your hypothesis)</span>' : ''}`;
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
        case 'door': return `${E} ${f.neg ? 'is <b>not</b>' : 'is'} ${v}`;
        case 'willing': return `${E} willing to help ${v}`;
        case 'held_by': return `${E} in the hands of ${v}`;
        case 'heading': return `${E} making for ${v}${d}`;
        case 'purpose': {
            const x = factOf(f.reasoned?.premises[0]);
            const cond = f.cond ? ` <span class="small">(if ${val(f.cond.item)} is ${f.cond.kinds.map((k) => KIND_WORD[k] ?? k).join(' or ')})</span>` : '';
            return `${x ? stepText(x) : E} <b>in order that</b> ${f.serves ? phrase(f.serves) : esc(f.value)}${cond}`;
        }
        case 'name': return `${E} is called ${v}`;
        case 'says': return `${E}${f.to ? ` to ${ent(f.to)}` : ''}: <span class="said">${v}</span>`;
        case 'believes': return `${E} believes ${v}`;
        case 'knows': return `${E} knows ${v}`;
        case 'lit': return `${E} has ${v}${f.hyp === true ? ' <span class="small muted">(your hypothesis)</span>' : ''}`;
        case 'intends': return f.aimChange ? `${E} changes his mind: making for ${ent(f.aimChange.from)}, then for ${ent(f.aimChange.to)}` : `${E} means ${v}`;
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
    if (f.hyp) return markLevel(f.hyp.q, f.hyp.pick);
    if (f.reasoned) {
        // Watson's reasoning: as trusted as its weakest premise, and no more than the player trusts his reasoning.
        const ls = f.reasoned.premises.map((id) => { const p = factOf(id); return p ? levelOfFact(p) : null; });
        if (ls.some((l) => l == null)) return null;
        const cap = state.trust.people[REASONING];
        return Math.min(...ls, cap ?? LEVELS.length - 1);
    }
    if (f.attr === 'tells') return f.to === 'watson' ? LEVELS.length - 1 : DEFAULT_LEVEL;
    return levelOf(chainsOf(f), state.trust);
}
/** The chains of an assertion: a claim's own assertions travel as the claim does, with the claimant's word ahead. */
const chainsOfAssertion = (x) => (x.mark ? [x.from ? hypothesisChain(...x.from.slice(4).split('=')) : hypothesisChain(x.q, x.pick)] : x.claim && x.claim === x.fact ? prov.claimChains(x.fact) : chainsOf(factOf(x.fact)));
/** Told by the paragraph read to, and modelled (a chain reaches Watson, or a telling). */
const visible = (f) => { const g = givenAt(f); return g != null && g <= state.para && levelOfFact(f) != null; };
const accepted = (f) => levelOfFact(f) >= state.threshold;

/** The assertions on the timeline: told so far, and trusted at least to the threshold; and the player's marks. */
function acceptedAssertions() {
    // An implied answer is as trusted as the circle that implies it.
    const lvlOf = (x) => { const m = x.from && /^hyp:(.+)=(.+)$/.exec(x.from); return m ? markLevel(m[1], m[2]) : markLevel(x.q, x.pick); };
    const marks = markAssertions(data, state.marks, possShown).filter((x) => lvlOf(x) >= state.threshold);
    const mine = reasoned.filter((f) => visible(f) && accepted(f))
        .map((f) => ({ id: f.id, fact: f.id, kind: 'state', of: f.of, attr: f.attr, value: f.value, neg: !!f.neg, time: f.time, truth: null, para: f.given_at }));
    return [...marks, ...mine, ...allAssertions.filter((x) => {
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

/**
 * An entry the player can reason from (its detail offers moves): a typed state, a typed action, an intention with a
 * goal, a claim with a plan. Marked on the timeline so the moves can be found.
 */
const canReason = (f) => ((STATES[f.attr] || OPEN_STATES.has(f.attr)) && f.value != null && !f.neg) || list(f.act).length > 0 || !!f.goal || !!f.plan;
const REASON_MARK = '<span class="can-reason" title="You can reason from this: open it for the moves (what it needs, what changed, what it is for, what a plan would need)">⚙</span>';
function eventRow(f, clashing, tag = 'li') {
    const lvl = levelOfFact(f);
    const below = lvl < state.threshold;
    const cls = ['event', f.reasoned ? 'reasoned' : '', isTimeEvent(f) ? 'time-event' : '', below ? 'below' : '', clashing.has(f.id) ? 'clash' : '', state.sel === f.id ? 'sel' : ''].filter(Boolean).join(' ');
    return `<${tag} class="${cls}" data-fact="${esc(f.id)}"${f.reasoned ? ' title="Watson’s reasoning"' : ''}>${dot(lvl)}<span class="ph">${phrase(f)}${whenNote(f.time ?? {})}</span>${canReason(f) ? ` ${REASON_MARK}` : ''} <span class="para">¶${givenAt(f)}</span>${assertsHtml(f)}</${tag}>`;
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
    const head = `<${tag} class="question${sel}${clashing.has(`q:${q.id}`) ? ' clash' : ''}" data-q="${esc(q.id)}"><span class="q-mark">?</span> ${esc(q.label)} <span class="para">¶${q.raised ?? q.answer_given_at}</span>${crossed.length ? ` <span class="small muted">crossed out: <s>${crossed.join('</s>, <s>')}</s></span>` : ''}${givenAway(q) ? ` <span class="small">answered ¶${q.answer_given_at}: <b>${answerText(q)}</b></span>` : ''}</${tag}>`;
    const circles = shownPossibilities(q).filter((p) => markOf(q, p.value) === 'circled').map((p) => {
        const lvl = markLevel(q, p.value);
        if (lvl < state.threshold && !state.showBelow) return '';
        const cls = ['event', 'hyp', lvl < state.threshold ? 'below' : '', clashing.has(hypothesisKey(q.id, p.value)) ? 'clash' : '', givenAway(q) ? (isRight(q, p.value) ? 'right' : 'wrong') : ''].filter(Boolean).join(' ');
        const pp = q.possibilities.find((x) => x.value === p.value);
        const can = pp?.goal || pp?.need || q.presupposes || hypAction(hypothesisKey(q.id, p.value));
        return `<${tag} class="${cls}" data-q="${esc(q.id)}" title="Your hypothesis">${dot(lvl)}<span class="ph">${hypPhrase(q, p.value)}</span>${can ? ` ${REASON_MARK}` : ''}</${tag}>`;
    });
    return [head, ...circles];
}

/** The events (all, or one entity's) in time order, under the time points they start at, with the questions. */
/**
 * The timeline's filter "only entries with moves": an entry marked ⚙, and a question only where a circled answer of
 * it is (a circled aim with a goal). Elsewhere (an entity's own timeline in the detail) everything shows.
 */
const movesOnly = (f) => !state.onlyMoves || canReason(f);
const movesOnlyQ = (q) => !state.onlyMoves || q.possibilities.some((p) => (p.goal || p.need || q.presupposes || hypAction(hypothesisKey(q.id, p.value))) && markOf(q, p.value) === 'circled');
function eventList(filter, clashing, qFilter = () => true) {
    const shown = allFacts().filter((f) => visible(f) && filter(f) && (state.showBelow || accepted(f)));
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
    if (f.reasoned) return REASONING;
    if (f.attr === 'tells') return f.of;
    const cs = chainsOf(f);
    if (!cs.length) return null;
    let best = cs[0], bl = -1;
    for (const c of cs) { const l = levelOf([c], state.trust); if (l > bl) { bl = l; best = c; } }
    return best.origin ?? '?';
}
function eventGrid(clashing) {
    const shown = allFacts().filter((f) => visible(f) && movesOnly(f) && (state.showBelow || accepted(f)));
    const colOf = (f) => (state.view === 'source' ? sourceOf(f) : placeColumn(placeOf(f))) ?? '—';
    const at = new Map();
    for (const f of shown) { const a = anchorOf(f.time ?? {}); at.set(a, [...(at.get(a) ?? []), f]); }
    const qs = new Map();
    for (const q of listedQuestions()) { const a = qAnchor(q); if (a && movesOnlyQ(q)) qs.set(a, [...(qs.get(a) ?? []), q]); }
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
    // Columns in order of first appearance, those of one region together; "—" (no place known) first.
    const region = (c) => (state.view === 'place' && entityById.has(c) ? data.places.chain(c).at(-1) : c);
    const regions = [...new Set(cols.map(region))];
    cols.sort((a, b) => (b === '—') - (a === '—') || regions.indexOf(region(a)) - regions.indexOf(region(b)) || 0);
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

const markText = (x) => {
    // An answer implied by another circle (the stick: Simpson struck the blow) says which circle implies it.
    const m = x.from && /^hyp:(.+)=(.+)$/.exec(x.from);
    const via = m ? ` (implied by your answer to “${esc(qById.get(m[1])?.label ?? m[1])}”: ${pickText(qById.get(m[1]), m[2])})` : '';
    return `${x.neg ? 'You crossed out' : 'Your hypothesis'}: ${pickText(qById.get(x.q), x.pick)}${via}`;
};
function clashSide(x) {
    if (x.mark) return `<a class="link" data-q="${esc(x.q)}">${markText(x)}</a>`;
    const f = factOf(x.fact);
    if (x.kind === 'pick') {
        const q = qById.get(x.q);
        const who = x.claim ? `${ent(f.of)} ${f.attr === 'believes' ? 'believes' : 'says'}: ` : '';
        return `<a class="link" data-fact="${esc(f.id)}">${who}${x.neg ? 'not ' : ''}${pickText(q, x.pick)}</a> <span class="para">¶${givenAt(f)}</span>`;
    }
    return `<a class="link" data-fact="${esc(f.id)}">${phrase(f)}</a> <span class="para">¶${givenAt(f)}</span>`;
}
function clashTitle(c) {
    if (c.a.kind === 'pick') return esc(qById.get(c.a.q)?.label ?? c.a.q);
    const f = factOf(c.a.fact);
    return `${ent(f.of)}: ${f.attr === 'location' ? 'in two places at once?' : STATES[f.attr] ? 'two states at once?' : 'two identities?'}`;
}

const clashKey = (c) => `clash:${c.a.id}|${c.b.id}`;
let current = [];

// --- The layout: three columns side by side, or panels with tabs (two, or one; a phone always one). The page's parts
// (world.html) are moved where the layout puts them, the rest parked; each is drawn by render() wherever it is.
const PARTS = [['story', 'Story'], ['timeline', 'Timeline'], ['questions', 'Questions'], ['clashes', 'Contradictions'], ['detail', 'Detail']];
if (!Array.isArray(state.panels) || state.panels.length !== 2 || state.panels.some((t) => !PARTS.some(([x]) => x === t)) || state.panels[0] === state.panels[1]) state.panels = ['story', 'timeline'];
if (!['three', 'two', 'one'].includes(state.layout)) state.layout = 'three';
const partEl = (id) => document.querySelector(`.part[data-part="${id}"]`);
const phone = matchMedia('(max-width: 699px)');
const layoutNow = () => (phone.matches ? 'one' : state.layout);
const panelCount = () => (layoutNow() === 'two' ? 2 : 1);
let backs = [];    // one column: the tabs a link replaced, for "back"
/** Put each part where the layout shows it; only a part that has to move is moved (a move loses its scroll). */
function mountLayout() {
    const L = layoutNow();
    const three = document.getElementById('three'), tabbed = document.getElementById('tabbed'), parked = document.getElementById('parked');
    document.body.classList.toggle('tabbed', L !== 'three');
    three.hidden = L !== 'three';
    tabbed.hidden = L === 'three';
    tabbed.classList.toggle('one', L === 'one');
    const put = (el, where) => { if (el.parentElement !== where) where.appendChild(el); };
    if (L === 'three') {
        if (!three.children.length) three.innerHTML = '<div class="col-story"></div><div class="col-main"></div><div class="col-detail"></div>';
        put(partEl('story'), three.children[0]);
        for (const id of ['clashes', 'questions', 'timeline']) put(partEl(id), three.children[1]);
        put(partEl('detail'), three.children[2]);
        return;
    }
    const shown = state.panels.slice(0, panelCount());
    for (const [id] of PARTS) if (!shown.includes(id)) put(partEl(id), parked);
    shown.forEach((id, i) => put(partEl(id), document.getElementById(`panel-${i}`)));
}
function tabsHtml(i, counts) {
    return PARTS.map(([t, name]) => `<button type="button" data-tab="${t}" class="tab${state.panels[i] === t ? ' on' : ''}">${name}${counts[t] ? ` <span class="small">(${counts[t]})</span>` : ''}</button>`).join('');
}
function renderTabs(counts) {
    if (layoutNow() === 'three') return;
    document.querySelectorAll('#tabbed .panel').forEach((el, i) => {
        el.querySelector('.tabs').innerHTML = tabsHtml(i, counts);
        const back = el.querySelector('.back-row');
        const b = i === 0 && panelCount() === 1 ? backs.at(-1) : null;
        back.hidden = !b;
        back.innerHTML = b ? `<a class="link" data-back>← Back to ${PARTS.find(([t]) => t === b)[1]}</a>` : '';
    });
}
/** Choose a tab in a panel; if the other panel shows it, the two swap. */
function chooseTab(i, tab) {
    if (state.panels[1 - i] === tab) state.panels[1 - i] = state.panels[i];
    state.panels[i] = tab;
}
/**
 * Show a part where a link opens it: where it is shown already; else, in two columns, in the other panel than the one
 * clicked in; in one column, in place, with a way back.
 */
function reveal(tab, from) {
    if (layoutNow() === 'three') return;
    const n = panelCount();
    if (state.panels.slice(0, n).includes(tab)) return;
    if (n === 1) { backs = [...backs, state.panels[0]].slice(-20); chooseTab(0, tab); }
    else chooseTab(from == null ? 1 : 1 - from, tab);
    save();
}
const panelFrom = (e) => { const p = e.target.closest('#tabbed .panel'); return p ? Number(p.dataset.panel) : null; };
/** Select an event, a name, a question or a contradiction: its detail, revealed. */
function select(id, e) {
    state.sel = id;
    state.note = null;
    reveal('detail', panelFrom(e));
    render();
}
const visibleEl = (el) => !!el && el.offsetParent !== null;
function applyTheme() {
    if (state.theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.dataset.theme = state.theme;
}
phone.addEventListener('change', () => render());

let shownPara = null;
function render() {
    mountLayout();
    applyTheme();
    document.getElementById('layout').value = state.layout;
    document.getElementById('theme').value = state.theme;
    reasoned = [];
    reasonedById = new Map();
    const told = data.facts.filter((f) => f.attr !== 'tells' && visible(f) && accepted(f));
    placeCtx = engineCtx(told);
    const lapses = [], held = [];
    reasoned = reasonedEntries(state.reasoning, (id) => factById.get(id) ?? hypIntention(id) ?? hypAction(id) ?? presupposed(id), data.order, nameOf, givenAt, { ...placeCtx, entries: told, lapsed: lapses, held });
    reasonedById = new Map(reasoned.map((f) => [f.id, f]));
    // An aim still circled but not yet told (read back) is not a lapse: the link returns on reading on.
    lapsed = lapses.filter((l) => !(l.gone && /^(hyp|pre):/.test(l.gone) && !hypShown(l.gone)));
    // Announced: a move that held at the last drawing and no longer does (not one read back past and read on to again).
    const keys = new Set(lapsed.map((l) => moveKey(l.move)));
    lapseNews = heldKeys ? [...lapseNews.filter((l) => keys.has(moveKey(l.move))), ...lapsed.filter((l) => heldKeys.has(moveKey(l.move)))] : [];
    heldKeys = new Set(held.map(moveKey));
    syncQuestions();
    const qList = document.querySelector('#q-box ol');
    const qScroll = qList?.scrollTop ?? 0;
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
    // Only a new paragraph scrolls the story to its end: a click elsewhere leaves it where the player put it.
    if (shownPara !== state.para && visibleEl(st)) { shownPara = state.para; st.lastElementChild?.scrollIntoView({ block: 'nearest' }); }

    const clashes = contradictions(data, acceptedAssertions());
    const clashing = new Set(clashes.flatMap((c) => [c.a, c.b]).flatMap((x) => (x.mark ? [x.id, `q:${x.q}`] : [x.fact])));
    current = clashes;
    document.getElementById('undo').disabled = !state.history.length;
    document.getElementById('clashes').innerHTML = clashes.length
        ? `<details class="clash-box" open><summary>${clashes.length} contradiction${clashes.length > 1 ? 's' : ''} among what is on the timeline</summary><ol>${clashes.map((c) => `<li class="${state.sel === clashKey(c) ? 'sel' : ''}"><b>${clashTitle(c)}</b> <a class="link trace" data-clash="${esc(clashKey(c))}">trace</a><br>${clashSide(c.a)}<br>against ${clashSide(c.b)}</li>`).join('')}</ol><p class="small muted">Trace a contradiction to see both sides' chains, then lower your trust in a link of one of them.</p></details>`
        : '';
    const strains = activeStrains();
    document.getElementById('clashes').innerHTML += strainsHtml(strains);
    document.getElementById('questions').innerHTML = questionsPanel(clashing);
    const ol = document.querySelector('#q-box ol');
    if (ol) ol.scrollTop = qScroll;
    document.getElementById('view').value = state.view;
    document.getElementById('only-moves').value = state.onlyMoves ? 'moves' : 'all';
    document.getElementById('depth').value = String(state.depth);
    document.getElementById('depth-label').hidden = state.view !== 'place';
    document.querySelector('.world-main').classList.toggle('wide', state.view !== 'list');
    document.getElementById('timeline').innerHTML = state.view === 'list' ? eventList(movesOnly, clashing, movesOnlyQ) : eventGrid(clashing);
    if (state.view !== 'list' && visibleEl(document.getElementById('timeline'))) packGrid();
    renderTabs({ questions: listedQuestions().length, clashes: clashes.length + strains.filter((s) => !state.held.includes(s.id)).length });
    renderLapseNews();
    renderGate();
    renderAnswers();
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
    const f = factOf(x.fact);
    if (f.reasoned) {
        return `<div class="side"><h3>${label}</h3><p><a class="link" data-fact="${esc(f.id)}">${phrase(f)}</a></p>
      <p class="small">From Watson’s reasoning. Trusted: <b>${levelName(levelOfFact(f))}</b>, as its weakest premise. Lower your trust in a premise, or withdraw it.</p>
      <ul class="events">${f.reasoned.premises.map((id) => factOf(id)).filter(Boolean).map((p) => eventRow(p, new Set())).join('')}</ul></div>`;
    }
    const what = x.kind === 'pick'
        ? `${x.claim ? `${ent(f.of)} ${f.attr === 'believes' ? 'believes' : 'says'}: ` : ''}${x.neg ? 'not ' : ''}${pickText(qById.get(x.q), x.pick)}`
        : phrase(f);
    return `<div class="side"><h3>${label}</h3><p><a class="link" data-fact="${esc(f.id)}">${what}</a></p>
      <p class="quote">“${esc(f.given_quote ?? f.quote)}” <span class="para">¶${givenAt(f)}</span></p>
      <p class="small">Trusted: <b>${levelName(levelOf(chains, state.trust))}</b>${r.links.length || r.people.length ? '; <span class="resolving">marked</span>: distrusting it alone takes this side off the timeline' : '; no single link takes it off: it has independent chains'}.</p>
      <ul class="chains">${chains.map((c) => chainHtml(c, r)).join('')}</ul>${peopleHtml(chains, r)}</div>`;
}

// --- The player's moves on the timeline (engine/actions.js), and what they give.
let placeCtx = { joins: data.joins, places: data.places };
/**
 * What the engine needs of the timeline beyond its entries: two names of one person (an identity on the timeline, or
 * one the player has circled: the stranger and Simpson), the kinds an item may still be (the paper: what the player
 * has not crossed out, or what is circled), and which things are where they live unless moved (animals).
 */
function engineCtx(told) {
    const root = new Map();
    const find = (x) => { while (root.has(x) && root.get(x) !== x) x = root.get(x); return x; };
    const join = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) root.set(ra, rb); };
    for (const f of told) if (f.attr === 'identity' && !f.neg && entityById.has(f.of) && entityById.has(f.value)) join(f.of, f.value);
    for (const q of baseQuestions) if (q.entry?.attr === 'identity' && entityById.has(q.entry.of) && qListed(q)) {
        for (const [v, m] of Object.entries(state.marks[q.id] ?? {})) if (m === 'circled' && entityById.has(v)) join(q.entry.of, v);
    }
    const same = (a, b) => a === b || (a != null && b != null && find(a) === find(b));
    const itemKinds = (item) => {
        const q = baseQuestions.find((x) => x.entry?.of === item && x.entry?.attr === 'contents' && qListed(x));
        if (!q) return null;
        const ps = shownPossibilities(q).map((o) => q.possibilities.find((p) => p.value === o.value)).filter((p) => p?.kind);
        const circled = ps.filter((p) => markOf(q, p.value) === 'circled');
        return (circled.length ? circled : ps.filter((p) => markOf(q, p.value) !== 'crossed')).map((p) => p.kind);
    };
    const homes = (id) => entityById.get(id)?.kind === 'animal';
    // A circled reason with a need (injuring the horse would be heard in the stable) adds it to that action type.
    const extraNeeds = {};
    for (const q of baseQuestions) if (qListed(q)) for (const p of q.possibilities) if (p.need && markOf(q, p.value) === 'circled' && possShown(q, p.value)) addNeeds(extraNeeds, p.need);
    return { joins: data.joins, places: data.places, same, itemKinds, homes, extraNeeds };
}
/** Add a possibility's need (`{act, rule}`, or a list of them) to the needs by action type. */
function addNeeds(extra, need) {
    for (const n of list(need)) {
        const rules = (extra[n.act] ??= []);
        if (!rules.some((r) => JSON.stringify(r) === JSON.stringify(n.rule))) rules.push(n.rule);
    }
    return extra;
}
const changeText = (f) => `${list(f.act).map((t) => ACTIONS[t].label).join(' and ')} ${String(nameOf(f.thing)).replace(/^The /, 'the ')}`;
/** The question whose entry is this change (the same action on the same thing, in a window that can meet it). */
function questionOfChange(f) {
    const meets = (t, w) => !(w?.from && t.before && data.order.le(t.before, w.from)) && !(w?.to && t.after && data.order.le(w.to, t.after));
    return baseQuestions.find((x) => x.entry?.act && list(x.entry.act).every((t) => list(f.act).includes(t)) && x.entry.thing === f.thing && meets(f.time ?? {}, x.entry.time) && qListed(x)) ?? null;
}
/**
 * Who made a change the player pointed out is the player's hypothesis: the story's own question when the change is
 * its entry, otherwise a question of the player's own ("Who was unlocking and opening the stable door?"), answered
 * like any other: circling anyone met so far.
 */
const baseQuestions = data.questions.slice();
function syncQuestions() {
    const own = reasoned.filter((f) => f.reasoned.move === 'a' && f.of === '?' && !questionOfChange(f)).map((f) => ({
        id: `who:${f.id}`, who: true, own: true, change: f.id, label: `Who was ${changeText(f)}?`, raised: f.given_at,
        entry: { of: '?', attr: 'action', act: f.act, thing: f.thing, value: changeText(f), time: f.time },
        possibilities: [{ value: 'something else', available: 0, via: 'always' }], answer: null,
    }));
    data.questions = [...baseQuestions, ...own];
    qById.clear();
    for (const q of data.questions) qById.set(q.id, q);
}
/** The change on the timeline a question is about: its own change, or one the player pointed out that is its entry. */
const changeOfQuestion = (q) => (q.change ? reasonedById.get(q.change) : reasoned.find((f) => f.reasoned.move === 'a' && questionOfChange(f) === q)) ?? null;
/** For each person or animal circled as who made the change: what they would have needed, and what the timeline says. */
function candidatesHtml(q) {
    const f = changeOfQuestion(q);
    if (!f) return '';
    const picks = Object.entries(state.marks[q.id] ?? {}).filter(([v, m]) => m === 'circled' && entityById.has(v)).map(([v]) => v);
    if (!picks.length) return `<p class="small muted">Circle who you think it was, and what they would have needed shows here.</p>`;
    const on = onTimeline();
    const t = anchorOf(f.time ?? {});
    const row = (n) => { const x = n.status !== 'met' && metByKnown(n.req, t, f.id); return `<li>${phrase(n.req)} ${x ? `<span class="good small">met by ${stepText(x)}</span>` : statusHtml(n)}</li>`; };
    return picks.map((v) => `<h3>If it was ${ent(v)}</h3><ul class="moves">${agentNeeds(data.order, on, f, v, nameOf, placeCtx).map(row).join('')}</ul>`).join('');
}
function statusHtml(r) {
    if (r.status === 'met') return `<span class="good small">met${r.entry ? `: ${phrase(r.entry)}` : ''}</span>`;
    if (r.status === 'against') return `<span class="bad small">the timeline has ${phrase(r.entry)}${r.persisting ? `, since ${timeLabel(anchorOf(r.entry.time))}, and nothing changes it` : ''}</span>`;
    return `<span class="muted small">nothing on the timeline says so${r.entry ? ` (it has ${phrase(r.entry)})` : ''}</span>`;
}
/** What is on the timeline now: told so far and trusted to the threshold, with the player's own entries. */
const onTimeline = () => allFacts().filter((f) => f.attr !== 'tells' && visible(f) && accepted(f));
const isTypedState = (f) => (STATES[f.attr] || OPEN_STATES.has(f.attr)) && f.value != null && !f.neg;
const madeB = (id) => state.reasoning.some((m) => m.move === 'b' && m.of === id);
const noteHtml = () => (state.note ? `<p class="note small">${esc(state.note)}</p>` : '');
function addMove(m, select) {
    remember();
    state.reasoning = [...state.reasoning, m];
    state.note = null;
    state.sel = select;
    save(); render();
}
/** Move (a) on a typed state: the other states of the same thing on the timeline to compare it with. */
function changeMoveHtml(f) {
    if (!isTypedState(f)) return '';
    const on = onTimeline();
    const done = (o) => state.reasoning.some((m) => m.move === 'a' && [m.a, m.b].includes(f.id) && [m.a, m.b].includes(o.id));
    // Only the pairs the engine would accept (a state between them, or an uncertain order, rules a pair out).
    const others = on.filter((o) => o.id !== f.id && isTypedState(o) && o.of === f.of && o.attr === f.attr && o.value !== f.value && (done(o) || !pointChange(data.order, f, o, on).why));
    const next = on.filter((o) => o.id !== f.id && isTypedState(o) && o.of === f.of && o.attr === f.attr && (o.time?.at ?? o.time?.from ?? o.time?.to) && f.time && data.order.lt(anchorOf(f.time), anchorOf(o.time)))
        .sort((a, b) => rankOf(anchorOf(a.time)) - rankOf(anchorOf(b.time)))[0];
    const lasts = `<p class="small">It lasts until something changes it${next ? `: next on the timeline, ${phrase(next)} (${timeLabel(anchorOf(next.time))}).` : '; nothing on the timeline does yet.'}</p>`;
    const items = others.map((o) => `<li>${done(o) ? '<span class="small muted">pointed out:</span> ' : `<button type="button" class="move" data-move-a="${esc(f.id)}" data-with="${esc(o.id)}">It changed</button> `}${phrase(o)} <span class="small muted">${timeLabel(anchorOf(o.time))}</span></li>`).join('');
    return `<h3>A state</h3>${lasts}${others.length ? `<p class="small">Point out a change: it differs from another state of ${ent(f.of)} on the timeline, so something changed it between them.</p><ul class="moves">${items}</ul>` : ''}`;
}
/** Move (b) on a typed action: what it needs just before and does just after, each with what the timeline says. */
function implicationsHtml(f) {
    if (!list(f.act).length) return '';
    if (!madeB(f.id)) {
        return `<h3>An action</h3><p><button type="button" class="move" data-move-b="${esc(f.id)}">Point out what it needs and what it does</button></p>`;
    }
    const on = onTimeline();
    const { entries = [] } = pointImplications(f, nameOf, { ...placeCtx, order: data.order, entries: on });
    const row = (e) => {
        const mine = reasonedById.get(e.id);
        let st = '';
        if (e.role === 'requires') {
            const r = requirementStatus(data.order, on, e, placeCtx);
            st = statusHtml(r.entry?.id === e.id ? { ...r, entry: undefined } : r);
        }
        return `<li>${mine ? eventRow(mine, new Set(), 'span') : phrase(e)} ${st}</li>`;
    };
    const needs = entries.filter((e) => e.role === 'requires'), does = entries.filter((e) => e.role === 'effects');
    return `<h3>What it needs</h3><ul class="moves">${needs.map(row).join('')}</ul>${does.length ? `<h3>What it does</h3><ul class="moves">${does.map(row).join('')}</ul>` : ''}`;
}
/** The intentions on the timeline an action or intention of this agent could serve (stated, or circled aims). */
function intentionsOf(agent, except) {
    const stated = onTimeline().filter((g) => g.goal && g.id !== except && placeCtx.same(g.of, agent));
    const circled = baseQuestions.filter((q) => qListed(q) && q.entry?.attr === 'intends').flatMap((q) => q.possibilities.map((p) => hypIntention(hypothesisKey(q.id, p.value))))
        .filter((g) => g && g.id !== except && placeCtx.same(g.of, agent) && markLevel(g.hyp.q, g.hyp.pick) >= state.threshold);
    return [...stated, ...circled];
}
const linkedTo = (tid) => reasoned.filter((e) => e.reasoned.move === 'c' && e.for === tid);
/** Move (c): "what is this for?", offered on a typed action or an intention with a goal. */
function purposeHtml(f) {
    if (!list(f.act).length && !f.goal) return '';
    if (f.of === '?' || f.reasoned) return '';
    // A motive (`end` on its question) is what the rest is for: it serves nothing further.
    if (f.hyp && qById.get(f.hyp.q)?.end) return '';
    const targets = intentionsOf(f.of, f.id);
    const done = (t) => state.reasoning.some((m) => m.move === 'c' && m.of === f.id && m.for === t.id);
    const items = targets.map((t) => `<li>${done(t) ? '<span class="small muted">linked:</span> ' : `<button type="button" class="move" data-move-c="${esc(f.id)}" data-for="${esc(t.id)}">For this</button> `}${stepText(t)}${t.hyp ? ' <span class="small muted">(your hypothesis)</span>' : ''}</li>`).join('');
    return `<h3>What is this for?</h3>${targets.length ? `<p class="small">Point out the intention it serves: the engine checks that what it brings about meets the goal, or a need of a step already linked to it.</p><ul class="moves">${items}</ul>`
        : `<p class="small muted">No intention of ${ent(f.of)} with a goal is on the timeline: circle an aim, or read on.</p>`}`;
}
/** Move (d): "what would this need?", on a plan: a claim's, or the steps the player has linked to an intention. */
const planOpen = new Set();
function planOf(f) {
    if (f.plan) return { id: f.id, ...f.plan };
    if (!f.goal) return null;
    const linked = linkedTo(f.id).map((e) => factOf(e.reasoned.premises[0])).filter((x) => x && list(x.act).length);
    const steps = orderSteps(linked, (x) => rankOf(anchorOf(x.time ?? {})), nameOf, { ...placeCtx, order: data.order, entries: onTimeline() });
    // An aim with an implied last step has a plan even before anything is linked to it (what hiding him would need).
    return steps.length || f.step ? { id: f.id, agent: f.of, goal: f.goal, steps: [...steps, ...impliedSteps(f)] } : null;
}
function planHtml(f) {
    const plan = planOf(f);
    if (!plan) return '';
    const head = f.plan ? 'The plan it describes' : 'Your plan for it';
    if (!planOpen.has(f.id)) return `<h3>${head}</h3><p><button type="button" class="move" data-move-d="${esc(f.id)}">What would this need?</button></p>`;
    const r = checkPlan(plan, onTimeline(), nameOf, { ...placeCtx, order: data.order, entries: onTimeline() });
    const need = (n) => `<li>${phrase(n.req)} ${n.by ? `<span class="good small">met by step ${n.by.step + 1}</span>` : statusHtml(n)}</li>`;
    const steps = r.steps.map((s) => `<li>${stepText(s.step)}<ul class="moves">${s.needs.map(need).join('')}</ul></li>`).join('');
    const goal = plan.goal ? `<p class="small">Goal: ${phrase({ ...plan.goal, id: '' })}: <b>${r.goal === 'reached' ? 'the steps reach it' : r.goal === 'intended' ? 'only the intended last step would reach it, and nothing on the timeline says it was done' : 'the steps do not reach it'}</b>.</p>` : '';
    const open = r.open.length ? `<p class="small bad">Needed, and nothing on the timeline meets it: ${[...new Set(r.open.map((n) => phrase(n.req)))].join('; ')}.</p>` : '<p class="small good">Every need is met.</p>';
    return `<h3>${head}: what it would need</h3>${goal}<ol class="plan">${steps}</ol>${open}${stoppedHtml(f, r)}${compareHtml(f, plan)}${accountHtml(f, plan)}<p><button type="button" class="move" data-move-d="${esc(f.id)}">Hide</button></p>`;
}
/** Whether a hypothesis id's possibility (or a presupposing question) is told so far, circled or not. */
const hypShown = (id) => {
    const p = /^pre:(.+)$/.exec(id);
    if (p) { const q = qById.get(p[1]); return !!q && q.raised <= state.para; }
    const m = /^hyp:(.+)=(.+)$/.exec(id); const q = m && qById.get(m[1]); return !!q && possShown(q, m[2]);
};
/** The question a hypothesis id or a presupposition belongs to. */
const qOfHyp = (id) => qById.get(/^(?:hyp|pre):(.+?)(?:=.*)?$/.exec(id ?? '')?.[1]) ?? null;
/** A move's key, to find it again in `state.reasoning`. */
const moveKey = (m) => [m.move, m.a ?? m.of, m.b ?? m.for ?? ''].join('|');
/** An entry a move was reasoned from, though it may no longer be there (an aim no longer circled). */
const premiseText = (id) => {
    const f = factOf(id) ?? hypIntention(id, true) ?? hypGhost(id);
    return f ? (f.hyp && !list(f.act).length ? `${stepText(f)} <span class="small muted">(your hypothesis)</span>` : list(f.act).length || f.goal ? stepText(f) : phrase(f)) : esc(id);
};
/** A circled who-answer no longer circled, for its name in a lapse. */
const hypGhost = (id) => {
    const p = /^pre:(.+)$/.exec(id);
    if (p) { const q = qById.get(p[1]); return q?.presupposes ? { id, of: q.entry.of, ...q.presupposes, hyp: { q: q.id, pre: true } } : null; }
    const m = /^hyp:(.+)=(.+)$/.exec(id);
    const own = m && qById.get(m[1])?.possibilities.find((p) => p.value === m[2])?.action;
    if (own) return { id, ...own, hyp: { q: m[1], pick: m[2] } };
    const q = m && qById.get(m[1]); return q?.entry?.act && entityById.has(m[2]) ? { id, of: m[2], act: q.entry.act, thing: q.entry.thing, via: q.entry.via, hyp: { q: q.id, pick: m[2] } } : null; };
/** Why a move no longer holds, in the page's words. */
function lapseWhy(l) {
    if (l.gone) {
        if (/^pre:/.test(l.gone)) return `It came from your answer to “${esc(qOfHyp(l.gone)?.label ?? '')}”, which presupposes it: no answer is circled there now.`;
        const m = /^hyp:(.+)=(.+)$/.exec(l.gone);
        const q = m && qById.get(m[1]);
        return q ? `You no longer have “${esc(entityById.has(m[2]) ? nameOf(m[2]) : m[2])}” circled for “${esc(q.label)}”.` : 'What it was reasoned from is no longer there.';
    }
    if (l.ruledOut) {
        const q = baseQuestions.find((x) => x.entry?.of === l.ruledOut.item && x.entry?.attr === 'contents');
        const kinds = l.ruledOut.kinds.map((k) => KIND_WORD[k] ?? k).join(' or ');
        return `It would only work if ${val(l.ruledOut.item)} were ${kinds}${q ? `, and your marks on “${esc(q.label)}” rule that out` : ', and that is ruled out'}.`;
    }
    return lostNeedWhy(l) ?? esc(l.why);
}
/**
 * A link that held through a need the player's hypothesis added (injuring needs the horse away from the stable):
 * which reason, no longer circled, would bring it back.
 */
function lostNeedWhy(l) {
    if (l.move.move !== 'c') return null;
    const x = factOf(l.move.of), t = factOf(l.move.for);
    if (!x || !t) return null;
    const linked = linkedTo(t.id).map((e) => factOf(e.reasoned.premises[0])).filter((s) => s && list(s.act).length);
    for (const q of baseQuestions) if (qListed(q)) for (const p of q.possibilities) {
        if (!p.need || markOf(q, p.value) === 'circled' || !possShown(q, p.value)) continue;
        const ctx = { ...placeCtx, order: data.order, entries: onTimeline(), extraNeeds: addNeeds(structuredClone(placeCtx.extraNeeds ?? {}), p.need) };
        const r = checkFit(x, t, linked, nameOf, ctx);
        if (r.fits) return `It served a need of your hypothesis, ${phrase(r.need)}, which came from “${esc(p.value)}” on “${esc(q.label)}”: that is no longer circled.`;
    }
    return null;
}
/** A lapsed move as a line: what it linked, and why it no longer holds. */
function lapseText(l) {
    const m = l.move;
    const what = m.move === 'c' ? `${premiseText(m.of)} <b>for</b> ${premiseText(m.for)}`
        : m.move === 'a' ? `a change between ${premiseText(m.a)} and ${premiseText(m.b)}` : `what ${premiseText(m.of)} needs and does`;
    return `${what}. ${lapseWhy(l)}`;
}
/** On an entry's detail: the player's moves from it that no longer hold. */
function lapsedHtml(f) {
    const mine = lapsed.filter((l) => [l.move.a, l.move.b, l.move.of, l.move.for].includes(f.id));
    if (!mine.length) return '';
    return `<h3>No longer fits</h3><p class="small">Your reasoning from this that no longer holds. It comes back if what changed changes back.</p>
      <ul class="moves">${mine.map((l) => `<li>${lapseText(l)} <button type="button" class="move quiet" data-drop="${esc(moveKey(l.move))}">Withdraw</button></li>`).join('')}</ul>`;
}
/** The announcement of a lapse just made, wherever the player is looking. */
function renderLapseNews() {
    const el = document.getElementById('lapse-news');
    el.hidden = !lapseNews.length;
    el.innerHTML = lapseNews.length ? `<p><b>No longer fits:</b> ${lapseText(lapseNews.at(-1))}${lapseNews.length > 1 ? ` <span class="small muted">(and ${lapseNews.length - 1} more)</span>` : ''}</p>
      <p><button type="button" data-lapse-show="${esc(lapseNews.at(-1).move.of ?? lapseNews.at(-1).move.a)}">Show</button> <button type="button" class="quiet" data-lapse-close>Dismiss</button></p>` : '';
}
/**
 * "Does it account for this?", on an open plan: the other actions and intentions of its agent on the timeline, each to
 * check, one at a time, for whether it brings about something the plan needs. Checked ones show the answer, worked
 * out again at each drawing (it changes with the marks).
 */
const accountChecked = new Set();
/**
 * "What stopped it?", on a plan's intended step (never on the timeline): the known actions, each to check, one at a
 * time, for whether it left the step's agent unable to act in time (the horse's kick, struck down Straker).
 */
const stopChecked = new Set();
function stoppedHtml(f, r) {
    const step = r.steps.map((s) => s.step).find((s) => s.intended);
    if (!step) return '';
    const own = new Set(r.steps.map((s) => s.step.id));
    const xs = knownActions().filter((x) => !own.has(x.id) && !(planOf(f)?.steps ?? []).some((s) => s.id === x.id));
    const key = (x) => `${f.id}|${x.id}`;
    const answer = (x) => {
        const s = stops(x, step, nameOf, { ...placeCtx, order: data.order });
        return s.stops ? `<span class="good small">yes: ${phrase({ ...s.effect, id: '' })}, so the step was never done</span>` : `<span class="bad small">no: ${esc(s.why)}</span>`;
    };
    const items = xs.map((x) => `<li>${stopChecked.has(key(x)) ? '' : `<button type="button" class="move" data-stop="${esc(key(x))}">Check</button> `}${stepText(x)}${stopChecked.has(key(x)) ? ` ${answer(x)}` : ''}</li>`).join('');
    return `<h3>What stopped it?</h3><p class="small">${stepText(step)} is not on the timeline as done. An action that left ${ent(step.of)} unable to act in time would explain it.</p>${xs.length ? `<ul class="moves">${items}</ul>` : '<p class="small muted">No action on the timeline or in your hypotheses yet.</p>'}`;
}
/**
 * "Compare with another plan", on an open plan: the other plans of its agent on the timeline (one proposed in the
 * story: Holmes's "if he wished to injure it, why not there?"); a compared one shows each plan's goal, the steps in
 * one and not the other, and the needs nothing on the timeline meets in one and not the other.
 */
const compared = new Set();
function compareHtml(f, plan) {
    const others = onTimeline().filter((x) => x.id !== f.id && x.plan && placeCtx.same(x.plan.agent, plan.agent));
    if (!others.length) return '';
    const on = onTimeline();
    const steps = (ss) => (ss.length ? ss.map((s) => stepText(s)).join('; ') : 'none');
    const needs = (ns) => (ns.length ? ns.map((n) => phrase(n.req)).join('; ') : 'none');
    const goal = (g, reached) => (g ? `${phrase({ ...g, id: '' })} (${reached === 'reached' ? 'its steps reach it' : 'its steps do not reach it'})` : 'none the engine can read');
    const item = (x) => {
        const key = `${f.id}|${x.id}`;
        if (!compared.has(key)) return `<li><button type="button" class="move" data-compare="${esc(key)}">Compare</button> ${phrase(x)} <span class="para">¶${givenAt(x)}</span></li>`;
        const r = comparePlans(plan, { id: x.id, ...x.plan }, on, nameOf, { ...placeCtx, order: data.order, entries: on });
        return `<li>${phrase(x)} <span class="para">¶${givenAt(x)}</span>
          <table class="compare small"><tr><th></th><th>This plan</th><th>That plan</th></tr>
          <tr><th>Goal</th><td>${goal(r.a.goal, r.a.reached)}</td><td>${goal(r.b.goal, r.b.reached)}</td></tr>
          <tr><th>Steps</th><td>${r.a.steps}</td><td>${r.b.steps}</td></tr>
          <tr><th>Steps only in it</th><td>${steps(r.a.only)}</td><td>${steps(r.b.only)}</td></tr>
          <tr><th>Unmet needs only in it</th><td>${needs(r.a.open)}</td><td>${needs(r.b.open)}</td></tr></table>
          <p class="small muted">${r.shared} step${r.shared === 1 ? '' : 's'} in both.</p></li>`;
    };
    return `<h3>Compare with another plan</h3><p class="small">Another plan for ${ent(plan.agent)} on the timeline: what one has that the other does not.</p><ul class="moves">${others.map(item).join('')}</ul>`;
}
function accountHtml(f, plan) {
    const own = new Set(plan.steps.map((s) => s.id).filter(Boolean));
    const xs = onTimeline().filter((x) => x.id !== f.id && !own.has(x.id) && !x.plan && (list(x.act).length || x.goal) && !x.reasoned && placeCtx.same(x.of, plan.agent));
    if (!xs.length) return '';
    const answer = (x) => {
        const r = accountsFor(plan, x, nameOf, { ...placeCtx, order: data.order });
        if (r.fits === true) return `<span class="good small">yes: it brings about ${phrase({ ...r.need, id: '' })}, which the plan needs</span>`;
        if (r.fits === 'if') return `<span class="good small">only if ${val(r.cond.item)} is ${r.cond.kinds.map((k) => KIND_WORD[k] ?? k).join(' or ')}: it would bring about ${phrase({ ...r.need, id: '' })}, which the plan needs</span>`;
        return `<span class="bad small">no: nothing it brings about is the plan's goal or a need of its steps; the plan leaves it unexplained</span>`;
    };
    const key = (x) => `${f.id}|${x.id}`;
    const items = xs.map((x) => `<li>${accountChecked.has(key(x)) ? '' : `<button type="button" class="move" data-account="${esc(key(x))}">Check</button> `}${stepText(x)} <span class="para">¶${givenAt(x)}</span>${accountChecked.has(key(x)) ? ` ${answer(x)}` : ''}</li>`).join('');
    return `<h3>Does it account for this?</h3><p class="small">What else ${ent(plan.agent)} did or wanted, on the timeline: does it serve the plan?</p><ul class="moves">${items}</ul>`;
}
function movesHtml(f) {
    const q = f.reasoned?.move === 'a' && f.of === '?' ? (questionOfChange(f) ?? qById.get(`who:${f.id}`)) : null;
    const who = q ? `<h3>Who did it? <span class="small muted">(your hypothesis)</span></h3>
      <p class="small">${q.own ? 'Your own question' : 'The question'}: <a class="link" data-q="${esc(q.id)}">${esc(q.label)}</a></p>${chipsHtml(q)}${candidatesHtml(q)}` : '';
    return `${changeMoveHtml(f)}${implicationsHtml(f)}${who}${purposeHtml(f)}${lapsedHtml(f)}${planHtml(f)}`;
}
function reasonedDetail(f) {
    const how = f.reasoned.move === 'a' ? 'Two states of one thing differ, so something changed it between them.'
        : f.reasoned.move === 'c' ? 'What it brings about meets the goal of an intention, or a need of a step toward it.'
        : f.reasoned.role === 'requires' ? 'What an action needs just before it.' : 'What an action does.';
    const premises = f.reasoned.premises.map((id) => factOf(id)).filter(Boolean);
    const cap = { origin: REASONING, links: [{ from: REASONING, to: 'watson', how: 'reasoning' }] };
    return `<h2>${phrase(f)}</h2>
      <p class="small">When: ${timeLabel(anchorOf(f.time ?? {}))}${whenNote(f.time ?? {})}. From <span class="hyp-name">Watson’s reasoning</span>: ${how}
        Trusted: <b>${levelName(levelOfFact(f))}</b>, as its weakest premise.</p>
      <h3>From</h3><ul class="events">${premises.map((p) => eventRow(p, new Set())).join('')}</ul>
      ${peopleHtml([cap])}
      ${movesHtml(f)}
      <p><button type="button" class="move" data-withdraw="${esc(f.id)}">Withdraw this reasoning</button></p>`;
}

// --- Questions: the panel, and one question in the detail.
const MARK_TITLE = { undefined: 'Uncertain: click to circle', circled: 'Circled: click to cross out', crossed: 'Crossed out: click to make uncertain again' };
function chip(q, p) {
    const m = markOf(q, p.value);
    const judged = givenAway(q) && m ? ((m === 'circled') === isRight(q, p.value) ? ' right' : ' wrong') : '';
    return `<button type="button" class="poss ${m ?? 'open'}${judged}" data-mark-q="${esc(q.id)}" data-mark-pick="${esc(p.value)}" title="${MARK_TITLE[m]}">${pickText(q, p.value)}</button>`;
}
// The questions whose "More" list is open (not saved).
const moreOpen = new Set();
/**
 * A question's chips: the story's own proposals, then those of the rest the player has marked; with "More" open, the
 * rest in their groups instead (a chip never moves when it is clicked).
 */
function chipsHtml(q) {
    const opts = questionOptions(q);
    const rest = opts.filter((o) => !o.proposed);
    const open = moreOpen.has(q.id);
    const main = opts.filter((o) => o.proposed || (!open && markOf(q, o.value)));
    const more = rest.length ? `<button type="button" class="more" data-more-q="${esc(q.id)}" title="${open ? 'Hide the other answers' : 'Other answers: anyone or anything else it could be'}">${open ? 'Fewer' : `More (${rest.length})`}</button>` : '';
    let html = `<div class="poss-row">${main.map((o) => chip(q, o)).join('')}${more}</div>`;
    if (open) {
        for (const g of [...new Set(rest.map((o) => o.group))]) {
            html += `<div class="poss-group"><span class="small muted">${g}</span><div class="poss-row">${rest.filter((o) => o.group === g).map((o) => chip(q, o)).join('')}</div></div>`;
        }
    }
    return html;
}
function questionsPanel(clashing) {
    const qs = listedQuestions();
    if (!qs.length) return '';
    const items = qs.map((q) => `<li class="${state.sel === `q:${q.id}` ? 'sel' : ''}${clashing.has(`q:${q.id}`) ? ' clash' : ''}"><a class="link" data-q="${esc(q.id)}">${esc(q.label)}</a> <span class="para">¶${q.raised ?? q.answer_given_at}</span>${qAnchor(q) ? '' : ' <span class="small muted" title="Its entry has no place in time: it is only here">(no time)</span>'}
      ${chipsHtml(q)}${givenAway(q) ? `<div class="small">Answered at ¶${q.answer_given_at}: <b>${answerText(q)}</b></div>` : ''}</li>`).join('');
    return `<details class="q-box" id="q-box"${state.qOpen ? ' open' : ''}><summary>Questions (${qs.length})</summary><ol>${items}</ol><p class="small muted">The answers shown are those someone in the story puts forward; “More” has the rest. Click one to circle it, again to cross it out, again to leave it uncertain. What you circle goes on the timeline as your hypothesis.</p></details>`;
}
/** The typed actions on the timeline and those of the player's hypotheses (circled answers, presuppositions). */
function knownActions() {
    const hyps = baseQuestions.filter(qListed).flatMap((q) => [presupposed(`pre:${q.id}`), ...shownPossibilities(q).map((p) => hypAction(hypothesisKey(q.id, p.value)))]).filter(Boolean);
    return [...onTimeline().filter((f) => list(f.act).length && !f.reasoned), ...hyps];
}
/** A known action (typed, or the player's hypothesis) not after time `t` whose effect meets a need (a key kept). */
function metByKnown(req, t, except = null) {
    const ctx = { ...placeCtx, order: data.order, entries: onTimeline() };
    for (const x of knownActions()) {
        if (x.id === except) continue;
        const s = anchorOf(x.time ?? {});
        if (t && s && data.order.lt(t, s)) continue;
        if ((pointImplications(x, nameOf, ctx).entries ?? []).some((e) => e.role === 'effects' && !e.cond && meets(e, req, placeCtx))) return x;
    }
    return null;
}
/** What an action needs, each met by another known action's effect (not after it), by the timeline, or by nothing. */
function needsHtml(a) {
    const ctx = { ...placeCtx, order: data.order, entries: onTimeline() };
    const { entries = [] } = pointImplications(a, nameOf, ctx);
    const t = anchorOf(a.time ?? {});
    const row = (req) => {
        const x = metByKnown(req, t, a.id);
        if (x) return `<li>${phrase(req)} <span class="good small">met by ${stepText(x)}</span></li>`;
        return `<li>${phrase(req)} ${statusHtml(requirementStatus(data.order, onTimeline(), req, placeCtx))}</li>`;
    };
    const needs = entries.filter((e) => e.role === 'requires');
    return needs.length ? `<p class="small">What it needs:</p><ul class="moves">${needs.map(row).join('')}</ul>` : '';
}
/** On a who-question whose entry is a typed action: each circled one doing it, with "what is this for?". */
function actionMovesHtml(q) {
    const pre = presupposed(`pre:${q.id}`);
    return shownPossibilities(q).map((p) => hypAction(hypothesisKey(q.id, p.value))).filter(Boolean)
        .map((a) => `<h3>${q.possibilities.find((p) => p.value === a.hyp.pick)?.action ? 'Your answer, as an action' : `If ${ent(a.of)} did it`}</h3><p class="small">${stepText(a)}</p>${needsHtml(a)}${purposeHtml(a)}${lapsedHtml(a)}`).join('')
        + (pre ? `<h3>What your answer takes for granted</h3><p class="small">${stepText(pre)}</p>${purposeHtml(pre)}${lapsedHtml(pre)}`
            : q.presupposes ? `<p class="small muted">Circle an answer, and what the question takes for granted (${stepText({ of: q.entry.of, ...q.presupposes })}) goes on the timeline as your hypothesis.</p>` : '');
}
function aimPlansHtml(q) {
    const aims = q.possibilities.map((p) => hypIntention(hypothesisKey(q.id, p.value))).filter(Boolean);
    return aims.map((g) => {
        const steps = linkedTo(g.id);
        return `<h3>${/^to /.test(g.value) ? 'If the aim is' : 'If it was'} “${esc(g.value)}”</h3><p class="small">Goal: ${phrase({ ...g.goal, id: '' })}. ${steps.length ? `Linked to it: ${steps.map((e) => phrase(e)).join('; ')}.` : 'Nothing is linked to it yet: on an action of theirs, ask “What is this for?”.'}</p>${restsHtml(q, g)}${planHtml(g)}${purposeHtml(g)}${lapsedHtml(g)}`;
    }).join('');
}
/**
 * What an answer rests on (`rests_on` on a possibility: the debts motive, that Straker owed money): each state with
 * what the timeline says, two names of one person counting as one (William Derbyshire, once circled as Straker).
 */
function restsHtml(q, g) {
    const rs = q.possibilities.find((p) => p.value === g.hyp.pick)?.rests_on ?? [];
    if (!rs.length) return '';
    const on = onTimeline();
    const row = (x) => { const req = { id: `rest:${q.id}`, ...x, of: x.of === '$agent' ? g.of : x.of, neg: false, time: g.time }; return `<li>${phrase(req)} ${statusHtml(requirementStatus(data.order, on, req, placeCtx))}</li>`; };
    return `<p class="small">What it rests on:</p><ul class="moves">${rs.map(row).join('')}</ul>`;
}
/**
 * Likely clashes: two entries that can both hold but sit badly together (world/strains.json). In play one is shown only
 * when one side is the player's own circle and the other is on the timeline too (a reaction to the player's hypothesis,
 * not a hint); all of a question's are listed at its give-away, as what a careful reader would have noticed.
 */
const strainSideIsMark = (x) => typeof x !== 'string';
function strainSideOn(x) {
    if (typeof x === 'string') { const f = factById.get(x); return !!f && visible(f) && accepted(f); }
    const q = qById.get(x.q);
    return !!q && markOf(q, x.pick) === 'circled' && possShown(q, x.pick) && markLevel(q.id, x.pick) >= state.threshold;
}
const activeStrains = () => strainList.filter((s) => s.available <= state.para && (strainSideIsMark(s.a) || strainSideIsMark(s.b)) && strainSideOn(s.a) && strainSideOn(s.b));
function strainSideHtml(x, inKey = false) {
    if (inKey && typeof x !== 'string') { const q = qById.get(x.q); return `<b>${pickText(q, x.pick)}</b> for “${esc(q.label)}”`; }
    if (typeof x === 'string') { const f = factById.get(x); return f ? `<a class="link" data-fact="${esc(f.id)}">${phrase(f)}</a> <span class="para">¶${givenAt(f)}</span>` : esc(x); }
    const q = qById.get(x.q);
    return `your circle on “<a class="link" data-q="${esc(q.id)}">${esc(q.label)}</a>”: <b>${pickText(q, x.pick)}</b>`;
}
function strainsHtml(strains) {
    if (!strains.length) return '';
    const open = strains.filter((s) => !state.held.includes(s.id)), held = strains.filter((s) => state.held.includes(s.id));
    const li = (s, isHeld) => `<li class="${isHeld ? 'held' : ''}"><b>${esc(s.why)}</b><br>${strainSideHtml(s.a)}<br>with ${strainSideHtml(s.b)}<br>${isHeld ? '<span class="small muted">You hold both.</span> <a class="link" data-unhold="' + esc(s.id) + '">Reconsider</a>' : `<button type="button" class="quiet small" data-hold="${esc(s.id)}">I hold both</button>`}</li>`;
    return `<details class="strain-box" open><summary>${open.length ? `${open.length} unlikely together` : 'Unlikely together'}${held.length ? ` <span class="small muted">(${held.length} you hold both)</span>` : ''}</summary>
      <p class="small muted">Not a contradiction: both can hold, but they sit badly together. Your circle is one side.</p><ol>${[...open.map((s) => li(s, false)), ...held.map((s) => li(s, true))].join('')}</ol></details>`;
}
/** At a question's give-away: the likely clashes a careful reader would have noticed, whatever the player circled. */
function keyStrainsHtml(q) {
    const ss = strainList.filter((s) => s.key === q.id && s.available <= state.para);
    if (!givenAway(q) || !ss.length) return '';
    return `<h3>What a careful reader would have noticed</h3><ul class="strains-key small">${ss.map((s) => `<li><b>${esc(s.why)}</b> ${strainSideHtml(s.a, true)} / ${strainSideHtml(s.b, true)}</li>`).join('')}</ul>`;
}
function questionDetail(q, clashing) {
    const marked = shownPossibilities(q).filter((p) => markOf(q, p.value));
    const chains = marked.map((p) => hypothesisChain(q.id, p.value));
    const markLi = marked.map((p) => `<li>${markOf(q, p.value) === 'circled' ? 'Circled' : 'Crossed out'}: ${pickText(q, p.value)}${clashing.has(hypothesisKey(q.id, p.value)) ? ' <span class="bad small">in a contradiction</span>' : ''}<ul class="chains">${chainHtml(hypothesisChain(q.id, p.value))}</ul></li>`).join('');
    return `<h2><span class="q-mark">?</span> ${esc(q.label)}</h2>
      ${q.own ? `<p class="small">Raised by your reasoning: <a class="link" data-fact="${esc(q.change)}">${phrase(reasonedById.get(q.change) ?? {})}</a></p>` : `<p class="quote">“${esc(q.quote ?? '')}” <span class="para">¶${q.raised ?? q.answer_given_at}</span></p>`}
      ${qAnchor(q) ? `<p class="small">When: ${timeLabel(qAnchor(q))}${whenNote(typeof q.entry.time === 'string' ? {} : q.entry.time)}.</p>` : ''}
      ${chipsHtml(q)}
      ${givenAway(q) ? `<p class="small">Answered at ¶${q.answer_given_at}: <b>${answerText(q)}</b><br><span class="quote">“${esc(q.answer_given_quote ?? '')}”</span></p>${keyStrainsHtml(q)}` : ''}
      ${marked.length ? `<h3>Your marks, from Watson’s hypothesis</h3><ul class="marks">${markLi}</ul>${peopleHtml(chains)}` : '<p class="small muted">No marks yet: every possibility is uncertain.</p>'}${candidatesHtml(q)}${actionMovesHtml(q)}${aimPlansHtml(q)}`;
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
    if (sel && reasonedById.has(sel)) {
        el.innerHTML = noteHtml() + reasonedDetail(reasonedById.get(sel), clashing);
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
            : `<h3>How Watson has it</h3><ul class="chains">${chains.map((c) => chainHtml(c)).join('')}</ul>`}
          ${content.length ? `<h3>What it asserts reaches him</h3><ul class="chains">${content.map((c) => chainHtml(c)).join('')}</ul>${assertsHtml(f)}` : ''}
          ${peopleHtml([...chains, ...content])}${movesHtml(f)}`;
        el.insertAdjacentHTML('afterbegin', noteHtml());
        return;
    }
    if (sel?.startsWith('q:') && qById.has(sel.slice(2)) && qListed(qById.get(sel.slice(2)))) {
        el.innerHTML = noteHtml() + questionDetail(qById.get(sel.slice(2)), clashing);
        return;
    }
    if (sel && entityById.has(sel)) {
        el.innerHTML = `<h2>${esc(nameOf(sel))}</h2><h3>Its timeline</h3>${eventList((f) => f.of === sel, clashing, (q) => q.entry?.of === sel)}`;
        return;
    }
    el.innerHTML = '<p class="muted">Click an event for where it comes from, or a name for its own timeline.</p>';
}

// --- Events.
/**
 * The gate: before the story gives away the answer to a question a reader could have reached earlier (raised, not
 * latent, inferable before it is given), the player commits: exactly one possibility circled. Any answer passes, so
 * nobody is stuck. Reading stops before the first paragraph whose give-aways are not committed; reading back is free.
 */
const GATED = data.questions.filter((q) => q.answer != null && !q.latent && q.raised != null && q.answer_inferable_at != null && q.answer_inferable_at < q.answer_given_at);
const atPara = (p, fn) => { const was = state.para; state.para = p; try { return fn(); } finally { state.para = was; } };
const circledCount = (q) => shownPossibilities(q).filter((o) => markOf(q, o.value) === 'circled').length;
/** The gated questions given away at ¶p and not committed to just before it. */
const gateAt = (p) => atPara(p - 1, () => GATED.filter((q) => q.answer_given_at === p && qListed(q) && circledCount(q) !== 1));
let gateHidden = null;    // the gate's key while its notice is hidden
let answerNews = [];      // the answers just given: {q, mark}
const setPara = (n) => {
    const want = Math.max(1, Math.min(LAST, n | 0)), from = state.para;
    let to = want;
    for (let p = from + 1; p <= want; p++) if (gateAt(p).length) { to = p - 1; gateHidden = null; flashGate = true; break; }
    // The answers given on the way, with how the player's marks fare.
    if (to > from) answerNews = GATED.filter((q) => q.answer_given_at > from && q.answer_given_at <= to).map((q) => ({ q, picks: atPara(q.answer_given_at - 1, () => shownPossibilities(q).filter((o) => markOf(q, o.value) === 'circled').map((o) => o.value)) }));
    else answerNews = [];
    state.para = to;
    save(); render();
};
let flashGate = false;
function renderGate() {
    const el = document.getElementById('gate-news');
    const qs = gateAt(state.para + 1);
    const key = qs.map((q) => q.id).join('|');
    el.hidden = !qs.length || gateHidden === key;
    document.getElementById('next').title = qs.length ? `Before ¶${state.para + 1}: commit to an answer first` : 'Read the next paragraph';
    if (!qs.length) return;
    const count = (q) => { const n = circledCount(q); return n === 0 ? 'nothing circled yet' : `${n} circled`; };
    el.innerHTML = `<p><b>Before ¶${state.para + 1}</b>, the story gives away the answer to ${qs.length === 1 ? 'this question' : `these ${qs.length} questions`}. Commit first: circle exactly one answer${qs.length === 1 ? '' : ' for each'}. Any answer will do; the key shows at ¶${state.para + 1}.</p>
      <ul>${qs.map((q) => `<li><a class="link" data-q="${esc(q.id)}">${esc(q.label)}</a> <span class="small muted">(${count(q)})</span></li>`).join('')}</ul>
      <p><button type="button" class="quiet" data-gate-hide>Hide</button></p>`;
    if (flashGate) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); flashGate = false; }
}
function renderAnswers() {
    const el = document.getElementById('answer-news');
    el.hidden = !answerNews.length;
    if (!answerNews.length) return;
    const line = ({ q, picks }) => {
        const right = picks.length === 1 && isRight(q, picks[0]);
        const yours = picks.length ? picks.map((v) => pickText(q, v)).join(', ') : 'nothing';
        return `<li><a class="link" data-q="${esc(q.id)}">${esc(q.label)}</a>: <b>${answerText(q)}</b> <span class="small ${right ? 'good' : 'bad'}">(you circled ${yours}${right ? ': right' : ''})</span></li>`;
    };
    el.innerHTML = `<p><b>The story has answered:</b></p><ul>${answerNews.map(line).join('')}</ul><p><button type="button" class="quiet" data-answers-close>Dismiss</button></p>`;
}
document.getElementById('next').addEventListener('click', () => { if (gateAt(state.para + 1).length) { gateHidden = null; flashGate = true; render(); return; } setPara(state.para + 1); });
document.getElementById('back').addEventListener('click', () => setPara(state.para - 1));
document.getElementById('para').addEventListener('change', (e) => setPara(Number(e.target.value)));
document.getElementById('threshold').addEventListener('change', (e) => { state.threshold = Number(e.target.value); save(); render(); });
document.getElementById('only-moves').addEventListener('change', (e) => { state.onlyMoves = e.target.value === 'moves'; save(); render(); });
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
    if (h.trust) { state.trust = h.trust; state.marks = h.marks ?? {}; state.reasoning = h.reasoning ?? []; state.held = h.held ?? []; } else state.trust = h;
    state.history = state.history.slice(0, -1);
    save(); render();
});
document.getElementById('layout').addEventListener('change', (e) => { state.layout = e.target.value; backs = []; save(); render(); });
document.getElementById('theme').addEventListener('change', (e) => { state.theme = e.target.value; save(); render(); });
// The settings menu closes on a click outside it.
document.addEventListener('click', (e) => { const st = document.getElementById('settings'); if (st.open && !e.target.closest('#settings')) st.open = false; });
document.addEventListener('click', (e) => {
    const tb = e.target.closest('[data-tab]');
    if (tb) { chooseTab(panelFrom(e) ?? 0, tb.dataset.tab); backs = []; save(); render(); return; }
    if (e.target.closest('[data-back]')) { chooseTab(0, backs.at(-1)); backs = backs.slice(0, -1); save(); render(); return; }
    const ma = e.target.closest('[data-move-a]');
    if (ma) {
        const a = factOf(ma.dataset.moveA), b = factOf(ma.dataset.with);
        const r = pointChange(data.order, a, b, onTimeline());
        if (r.why) { state.note = r.why; render(); return; }
        addMove({ move: 'a', a: a.id, b: b.id }, r.entry.id);
        return;
    }
    const mc = e.target.closest('[data-move-c]');
    if (mc) {
        const x = factOf(mc.dataset.moveC), t = factOf(mc.dataset.for);
        const linked = linkedTo(t.id).map((l) => factOf(l.reasoned.premises[0])).filter((s) => s && list(s.act).length);
        const r = checkFit(x, t, linked, nameOf, { ...placeCtx, order: data.order, entries: onTimeline() });
        if (!r.fits) { state.note = `It does not serve that. ${r.why}`; render(); return; }
        addMove({ move: 'c', of: x.id, for: t.id }, x.hyp ? `q:${x.hyp.q}` : x.id);
        return;
    }
    const hd = e.target.closest('[data-hold], [data-unhold]');
    if (hd) { remember(); state.held = hd.dataset.hold ? [...state.held, hd.dataset.hold] : state.held.filter((x) => x !== hd.dataset.unhold); save(); render(); return; }
    const sp = e.target.closest('[data-stop]');
    if (sp) { stopChecked.add(sp.dataset.stop); render(); return; }
    const cp = e.target.closest('[data-compare]');
    if (cp) { compared.add(cp.dataset.compare); render(); return; }
    const ac = e.target.closest('[data-account]');
    if (ac) { accountChecked.add(ac.dataset.account); render(); return; }
    const md = e.target.closest('[data-move-d]');
    if (md) { const id = md.dataset.moveD; if (planOpen.has(id)) planOpen.delete(id); else planOpen.add(id); render(); return; }
    const mb = e.target.closest('[data-move-b]');
    if (mb) {
        const r = pointImplications(factOf(mb.dataset.moveB), nameOf);
        if (r.why) { state.note = r.why; render(); return; }
        addMove({ move: 'b', of: mb.dataset.moveB }, mb.dataset.moveB);
        return;
    }
    const dr = e.target.closest('[data-drop]');
    if (dr) { remember(); state.reasoning = state.reasoning.filter((x) => moveKey(x) !== dr.dataset.drop); save(); render(); return; }
    const ls = e.target.closest('[data-lapse-show]');
    if (ls) { const id = ls.dataset.lapseShow, q = qOfHyp(id); lapseNews = []; select(q ? `q:${q.id}` : id, e); return; }
    if (e.target.closest('[data-lapse-close]')) { lapseNews = []; renderLapseNews(); return; }
    if (e.target.closest('[data-gate-hide]')) { gateHidden = gateAt(state.para + 1).map((q) => q.id).join('|'); renderGate(); return; }
    if (e.target.closest('[data-answers-close]')) { answerNews = []; renderAnswers(); return; }
    const wd = e.target.closest('[data-withdraw]');
    if (wd) {
        // Withdraw the move that gave this entry; what was reasoned from it goes with it.
        const f = reasonedById.get(wd.dataset.withdraw);
        const m = f.reasoned.move === 'a' ? (x) => x.move === 'a' && x.a === f.reasoned.premises[0] && x.b === f.reasoned.premises[1] || x.move === 'a' && x.b === f.reasoned.premises[0] && x.a === f.reasoned.premises[1]
            : f.reasoned.move === 'c' ? (x) => x.move === 'c' && x.of === f.reasoned.premises[0] && x.for === f.reasoned.premises[1]
            : (x) => x.move === 'b' && x.of === f.reasoned.premises[0];
        remember();
        state.reasoning = state.reasoning.filter((x) => !m(x));
        state.sel = f.reasoned.premises[0];
        save(); render();
        return;
    }
    const mo = e.target.closest('[data-more-q]');
    if (mo) { const id = mo.dataset.moreQ; if (moreOpen.has(id)) moreOpen.delete(id); else moreOpen.add(id); render(); return; }
    const m = e.target.closest('[data-mark-q]');
    if (m) {
        // The page is drawn afresh, and a contradiction box may open or close above: keep the clicked chip under the
        // pointer, so a second click lands on it.
        const inPanel = !!m.closest('#q-box'), top = m.getBoundingClientRect().top;
        cycleMark(m.dataset.markQ, m.dataset.markPick);
        const again = [...document.querySelectorAll(`[data-mark-q="${CSS.escape(m.dataset.markQ)}"][data-mark-pick="${CSS.escape(m.dataset.markPick)}"]`)].find((x) => !!x.closest('#q-box') === inPanel);
        // What scrolls: a tabbed panel, or the page.
        if (again) (again.closest('#tabbed .panel-body') ?? window).scrollBy(0, again.getBoundingClientRect().top - top);
        return;
    }
    const pa = e.target.closest('.para');
    if (pa && !e.target.closest('#story')) {
        // A paragraph number scrolls the story to that paragraph.
        const n = Number(pa.textContent.match(/\d+/)?.[0]);
        reveal('story', panelFrom(e));
        render();
        const p = document.querySelectorAll('#story p')[n - 1];
        if (p) {
            if (layoutNow() === 'three') {
                const box = document.querySelector('.world-story');
                box.scrollTop += p.getBoundingClientRect().top - box.getBoundingClientRect().top - 30;
            } else p.scrollIntoView({ block: 'start' });
            p.classList.remove('flash'); void p.offsetWidth; p.classList.add('flash');
        }
        return;
    }
    const q = e.target.closest('[data-q]');
    if (q && !e.target.closest('select, [data-ent]')) { select(`q:${q.dataset.q}`, e); return; }
    const t = e.target.closest('[data-clash]');
    if (t) { select(t.dataset.clash, e); return; }
    const a = e.target.closest('[data-ent]');
    if (a) { select(a.dataset.ent, e); return; }
    const f = e.target.closest('[data-fact]');
    if (f && !e.target.closest('select')) select(f.dataset.fact, e);
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
