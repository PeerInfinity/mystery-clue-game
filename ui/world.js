// The timeline (index.html; for Silver Blaze, "Watson's timeline"): the world model shown as it is, an ordered list of
// events, filled in as the story is read. Every fact reaches the reader through a narrator (what a first-person
// narrator observes is certain by default); the rest comes through a chain of tellings, each link trusted as far as
// the player says (engine/world.js). The player is the reader: the marks and moves are the reader's own. Facts at or above the threshold are on the timeline; the
// contradictions among them are listed. Nothing shown runs ahead of the paragraph read to.

import { READER, narrationLink, provenance, timeOrder, assertions, contradictions, alibis, places, givenAt, LEVELS, DEFAULT_LEVEL, linkKey, levelOf, resolvingLinks, CLAIM_ATTRS, markAssertions, hypothesisChain, hypothesisKey, HYPOTHESIS, answerKinds, entityKinds, isRight } from '../engine/world.js';
import { coverOf, overlaps } from '../engine/world.js';
import { Story } from '../engine/story.js';
import { MAIN, Reading, parseRef, refKey, refList } from '../engine/refs.js';
import { shownNames, timeLabelAt, questionLabelAt } from '../engine/shown.js';
import { ACTIONS, setCaseActions, STATES, OPEN_STATES, REASONING, pointChange, pointImplications, requirementStatus, reasonedEntries, agentNeeds, checkFit, checkPlan, accountsFor, comparePlans, impliedSteps, stops, meets, orderSteps } from '../engine/actions.js';

import { waysIn, checkWayMark, pointPassage, foundBy, linksOf, checkRoute } from '../engine/arrangement.js';
import { fill, described } from '../engine/observations.js';
import { roomHtml } from './world-room.js';
import { CASE, PLAYER_STORE, AUTOPLAY_STORE, pageUrl } from './world-case.js';
// `?autoplay`: the true path played through the page (ui/world-autoplay.js) in a save of its own, fresh each time;
// the player's timeline is kept aside, only its layout and theme borrowed. `?autoplay=fast`: no pauses (the check).
const AUTOPLAY = new URLSearchParams(location.search).get('autoplay');
const STORE = AUTOPLAY === null ? PLAYER_STORE : AUTOPLAY_STORE;
const get = (url, as = 'json') => fetch(url, { cache: 'no-cache' }).then((r) => {
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return as === 'json' ? r.json() : r.text();
});
const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// A case is its story and the files in world/ (docs/case-format.md, "A case"); world/case.json names the story file.
const W = `${CASE}/world`;
const header = await get(`${W}/case.json`);
const [w, times, facts, accounts, questions, text, mentions] = await Promise.all([
    get(`${W}/entities.json`), get(`${W}/times.json`), get(`${W}/facts.json`), get(`${W}/accounts.json`),
    get(`${W}/questions.json`), get(`${W}/${header.story}`, 'text'), get(`${W}/mentions.json`),
]);
// The case's own action types (world/actions.json): optional; the generic ones are the engine's.
setCaseActions(await get(`${W}/actions.json`).catch(() => ({})));
// Likely clashes (world/strains.json): optional.
const strainList = await get(`${W}/strains.json`).then((x) => x.strains ?? []).catch(() => []);
// The arrangement of a room and the general knowledge the player may bring in (world/room.json): optional.
const room = await get(`${W}/room.json`).catch(() => null);
// What an entry shows about a question once the player links them (world/observations.json): optional.
const observations = await get(`${W}/observations.json`).then((x) => x.observations ?? []).catch(() => null);
const data = {
    entities: w.entities, moves: w.moves ?? [], joins: w.joins ?? {}, times: times.times, facts: facts.facts,
    accounts: accounts.accounts, questions: questions.questions, narrators: header.narrators,
};
// The narrators (world/case.json): each by name, and its narration link, which the player may trust less.
const narratorIds = new Set(data.narrators.map((n) => n.id));
const narratorName = (id) => data.narrators.find((n) => n.id === id)?.name ?? (id === 'narrator' ? 'the narrator' : null);
document.title = `${header.title}: ${header.subtitle ?? 'the timeline'}`;
document.querySelector('.case-title').textContent = header.title;
document.querySelector('h1 .subtitle').textContent = header.subtitle ?? 'the timeline';
// The guide's links keep the case, so that its "Back to the timeline" comes back to this one.
for (const a of document.querySelectorAll('a[href="guide.html"]')) a.href = `guide.html${pageUrl().slice(2)}`;
data.order = timeOrder(data.times);
data.places = places(data);
const prov = provenance(data);
const allAssertions = assertions(data);
const assertionById = new Map(allAssertions.map((x) => [x.id, x]));
const paragraphs = (t) => t.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
const story = paragraphs(text);
// The case files (world/case.json `files`): sub-stories the narrator reads, each with its own paragraphs, each
// delivered when the main story reaches its `delivered` paragraph (or from the start). A paragraph's reference is a
// bare number in the main story, "<file>:<n>" in a file (engine/refs.js).
const files = header.files ?? [];
const fileTexts = await Promise.all(files.map((f) => get(`${W}/${f.text}`, 'text')));
const fileById = new Map(files.map((f) => [f.id, f]));
const stories = new Map([[MAIN, story], ...files.map((f, i) => [f.id, paragraphs(fileTexts[i])])]);
const storyIds = [...stories.keys()];
const lastOf = (id) => (stories.get(id)?.length ?? 1) - 1;
const lengths = Object.fromEntries(storyIds.map((id) => [id, lastOf(id)]));
// Where each story names each entity (world/mentions.json, matched by engine/story.js): the story's names are links to
// their card, every one alike. An entity the story never names by a phrase is placed by its `source` quote.
const storyOpts = { mentions: { entities: mentions.entities }, entities: w.entities };
const namedBy = new Map([[MAIN, new Story(text, storyOpts)], ...files.map((f, i) => [f.id, new Story(fileTexts[i], storyOpts)])]);
const entityById = new Map(data.entities.map((e) => [e.id, e]));
// The name each entity goes by by what has been read (engine/shown.js): never one the story has not used yet. Over
// every paragraph in the order of reading (what is read first), worked out again when more is read.
const textOf = (key) => { const r = parseRef(key); return stories.get(r.story)?.[r.n] ?? ''; };
let namesMemo = null;
const names = () => {
    if (namesMemo?.r !== reading || namesMemo.n !== reading.count) namesMemo = { r: reading, n: reading.count, v: shownNames(data.entities, mentions.entities, ['', ...reading.full().keys.map(textOf)], posOf) };
    return namesMemo.v;
};
const timeById = new Map(data.times.map((t) => [t.id, t]));
const factById = new Map(data.facts.map((f) => [f.id, f]));
// The entries the player's moves give (the reader's reasoning), worked out afresh at each drawing.
let reasoned = [];
let reasonedById = new Map();
let lapsed = [];          // the player's moves that no longer hold, each with why (engine/actions.js reasonedEntries)
let heldKeys = null;      // the moves that held at the last drawing (null before the first): one that lapses is announced
let lapseNews = [];       // the lapses announced, until dismissed or no longer lapsed
const factOf = (id) => factById.get(id) ?? reasonedById.get(id) ?? hypIntention(id) ?? hypAction(id) ?? presupposed(id);
/**
 * A circled aim with a goal (the stranger's "get information to bet on") as an intention: the reader's hypothesis, so
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
 * action of the reader's hypothesis, which the moves can link like any other.
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
    const { act, thing, to, item, via, where, about } = q.entry;
    return { id, of: m[2], attr: 'action', act, ...(thing ? { thing } : {}), ...(to ? { to } : {}), ...(item ? { item } : {}), ...(via ? { via } : {}), ...(where ? { where } : {}), ...(about ? { about } : {}), time: hypTime(q), hyp: { q: q.id, pick: m[2] }, given_at: q.raised };
}
const allFacts = () => [...data.facts, ...reasoned];
const qById = new Map(data.questions.map((q) => [q.id, q]));
const accountById = new Map(data.accounts.map((a) => [a.id, a]));
const LAST = story.length - 1;   // the main story's last paragraph

// --- State: how far the story is read, the player's trust and marks on questions. Saved in this browser only.
// `marks`: {question id: {possibility: 'circled' | 'crossed'}}; a possibility not in it is uncertain.
// `reasoning`: the player's moves on the timeline, in order: {move: 'a', a, b} (a change between two states) or
// {move: 'b', of} (what an action needs and does); the entries they give are worked out afresh (engine/actions.js).
const state = { para: 1, log: null, story: MAIN, threshold: DEFAULT_LEVEL, showBelow: false, trust: { links: {}, people: {} }, marks: {}, reasoning: [], history: [], view: 'list', depth: 2, sel: null, qOpen: true, cardsOpen: false, hintWait: 30, note: null, layout: 'three', panels: ['story', 'timeline'], theme: 'system', onlyMoves: false, held: [], room: null, links: [], qOrder: null };
if (AUTOPLAY === null) try { Object.assign(state, JSON.parse(localStorage.getItem(STORE) ?? '{}')); } catch { /* a fresh start */ }
// Saves from before the reader model (2026-11-06) capped Watson's hypothesis and reasoning under other ids.
for (const [was, now] of [['watsons_hypothesis', HYPOTHESIS], ['watsons_reasoning', REASONING]]) if (state.trust?.people?.[was] != null) { state.trust.people[now] ??= state.trust.people[was]; delete state.trust.people[was]; }
else try { const own = JSON.parse(localStorage.getItem(PLAYER_STORE) ?? '{}'); for (const k of ['layout', 'panels', 'theme']) if (own[k] != null) state[k] = own[k]; } catch { /* the defaults */ }
state.sel = null;
state.note = null;
// What has been read, in each story and in what order (engine/refs.js); `para` is the main story's, kept for the
// checks and for saves from before the files.
let reading = Reading.fromSave(state, lengths);
const posOf = (x) => reading.pos(x);
const seen = (x) => x != null && reading.seen(x);
/** Compare two references by the order of reading (what is unread after what is read). */
const byRead = (a, b) => { const x = posOf(a), y = posOf(b); return x === y ? 0 : x < y ? -1 : 1; };
const syncReading = () => { state.para = reading.readTo(MAIN); state.log = [...reading.log]; };
syncReading();
const delivered = (id) => id === MAIN || (fileById.has(id) && (fileById.get(id).delivered == null || seen(fileById.get(id).delivered)));
if (!delivered(state.story)) state.story = MAIN;
/** A paragraph's reference as the player sees it: "¶3" in the main story, "Rudd ¶2" in a file. */
const paraTag = (x) => { const p = parseRef(x); if (!p) return '¶?'; return p.story === MAIN ? `¶${p.n}` : `${fileById.get(p.story)?.short ?? p.story} ¶${p.n}`; };
const paraSpan = (x) => `<span class="para" data-ref="${esc(refKey(x) ?? '')}">${esc(paraTag(x))}</span>`;
if (!Array.isArray(state.held)) state.held = [];
const freshRoom = () => ({ ways: {}, got: [], route: [] });
if (!Array.isArray(state.links)) state.links = [];
state.room = { ...freshRoom(), ...(state.room ?? {}) };
const save = () => { try { localStorage.setItem(STORE, JSON.stringify({ para: state.para, log: state.log, story: state.story, threshold: state.threshold, showBelow: state.showBelow, trust: state.trust, marks: state.marks, reasoning: state.reasoning, room: state.room, links: state.links, qOrder: state.qOrder, history: state.history, view: state.view, depth: state.depth, qOpen: state.qOpen, cardsOpen: state.cardsOpen, hintWait: state.hintWait, gate: state.gate, layout: state.layout, panels: state.panels, theme: state.theme, onlyMoves: state.onlyMoves, held: state.held })); } catch { /* not saved */ } };
// Every change of trust or of a mark can be undone: the state before it is kept (the last 50).
const remember = () => { state.history = [...state.history, JSON.stringify({ trust: state.trust, marks: state.marks, reasoning: state.reasoning, held: state.held, room: state.room, links: state.links })].slice(-50); };
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
const nameOf = (id) => (id === '?' ? 'someone' : id === HYPOTHESIS ? 'your hypothesis' : id === REASONING ? 'your reasoning' : id === READER ? 'you' : (entityById.has(id) ? names().nameAt(id, reading.count) : null) ?? narratorName(id) ?? id);
const ent = (id) => (id === HYPOTHESIS || id === REASONING ? `<span class="hyp-name">${nameOf(id)}</span>` : id && entityById.has(id) ? `<a class="ent" data-ent="${esc(id)}">${esc(nameOf(id))}</a>` : esc(id === '?' ? 'Someone' : id ? nameOf(id) : ''));
/** An entity at the head of a line: its name capitalised (the reader's hypothesis: "Your hypothesis"). */
const entHead = (id) => ent(id).replace(/>([a-z])/, (m, c) => `>${c.toUpperCase()}`).replace(/^([a-z])/, (m, c) => c.toUpperCase());
// A value: an entity id becomes its name; a text that starts with one ("silver_blaze (in his keeping)") too.
const val = (v) => list(v).map((x) => {
    if (x == null) return '<span class="muted">unknown</span>';
    const s = String(x);
    if (entityById.has(s)) return ent(s);
    const m = s.match(/^([a-z][a-z0-9_]*)([ ,(].*)$/);
    if (m && m[1].includes('_') && entityById.has(m[1])) return ent(m[1]) + esc(m[2]);
    return esc(s);
}).join(', ');
// A time point's label as the story has dated it by the paragraph read to (engine/shown.js); before that "a time
// not yet told" (its day and hour too are the story's to tell).
const timeLabel = (id) => {
    const t = timeById.get(id);
    return t ? esc(timeLabelAt(t, reading.count, posOf)) : esc(id);
};
/** A question's label as the story has asked it by the paragraph read to (engine/shown.js). */
const qLabel = (q) => questionLabelAt(q, reading.count, posOf);
const qVisible = (q) => q && (seen(q.raised) || seen(q.answer_given_at));
// The player's questions: raised (or answered) so far; a question about provenance only if the story raises it.
const qListed = (q) => !q.hidden && qVisible(q) && (q.kind !== 'provenance' || seen(q.raised));
const listedQuestions = () => data.questions.filter(qListed).sort((a, b) => byRead(a.raised ?? a.answer_given_at, b.raised ?? b.answer_given_at));
// When each entity is first met: the earliest paragraph a fact naming it is given at.
const kindOf = entityKinds(data);
const metAt = new Map();   // entity → every paragraph a fact naming it is given at
for (const f of data.facts) {
    const g = givenAt(f);
    if (g == null) continue;
    for (const id of [f.of, f.to, ...list(f.value)]) if (typeof id === 'string' && entityById.has(id)) metAt.set(id, [...(metAt.get(id) ?? []), g]);
}
/** Where an entity is first on the timeline, by what has been read first (null: no fact names it). */
const firstMet = (id) => reading.earliest(metAt.get(id) ?? []);
// Met: first named in a story, or first on the timeline, whichever was read first (an entity of the world model alone
// has no mention, and is met where a fact first names it).
const firstSeen = (id) => reading.earliest([...storyIds.map((s) => { const n = namedBy.get(s).firstAt.get(id); return n == null ? null : (s === MAIN ? n : `${s}:${n}`); }), firstMet(id)]);
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
    const listed = q.possibilities.filter((p) => seen(p.available));
    const out = listed.filter((p) => p.via !== 'indirect' || !isKind(p.value)).map((p) => ({ value: p.value, proposed: p.via !== 'indirect', group: OTHER_IDEAS }));
    if (!kinds.length) return out;
    const met = data.entities.filter((e) => isKind(e.id) && e.id !== q.entry?.of && !out.some((o) => o.value === e.id)
        && (seen(firstMet(e.id)) || listed.some((p) => p.value === e.id)));
    met.sort((a, b) => nameOf(a.id).localeCompare(nameOf(b.id)));
    return [...out, ...met.map((e) => ({ value: e.id, proposed: false, group: KIND_GROUP[e.kind] }))];
}
const possShown = (q, pick) => qListed(q) && questionOptions(q).some((o) => o.value === pick);
const shownPossibilities = questionOptions;
const markOf = (q, pick) => state.marks[q.id]?.[pick];
const givenAway = (q) => q.answer != null && seen(q.answer_given_at);
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
    if (f.attr === 'opening') { const by = foundBy(f, roomKnown, room.openings); return `A way between ${ent(f.sides[0])} and ${ent(f.sides[1])}${by ? `: ${ent(by)}` : ', not yet found'}`; }
    if (f.attr === 'route') return `A route: ${f.value.map(ent).join(' → ')}`;
    const E = f.of === '?' ? 'Someone' : ent(f.of);
    // Told early in brief (`given_at`): until its own paragraph, only the brief words that told it.
    if (f.given_quote && seen(f.given_at) && !seen(f.para)) return `${E}: <span class="said">“${esc(f.given_quote)}”</span>`;
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
        case 'closed_to': return `${E} closed to ${esc(SIZE_WORD[f.value] ?? f.value)}${d}`;
        case 'passes': return `${E} lets ${esc(SIZE_WORD[f.value] ?? f.value)} through${d}`;
        case 'passed': return f.between ? `${E} crossed from ${ent(f.between[0])} to ${ent(f.between[1])}${d}` : `${E} crossed into ${v}${d}`;   // what a claim asserts may not say from where
        case 'attached': return `${E} fastened to ${v}${d}`;
        case 'reaches': return `${E} reaches ${v}${d}`;
        case 'near': return `${E} beside ${v}${d}`;
        case 'fixed': return `${E} fixed to ${v}${d}`;
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
            const accts = list(f.value).map((a) => esc(accountById.has(a) ? questionLabelAt(accountById.get(a), reading.count, posOf) : a)).join(', ');
            return `${E} tells ${ent(f.to)} (${esc(f.how)}${f.partial ? ', in part' : ''}): ${accts}`;
        }
        default: return f.of === 'weather' ? `The weather: ${v}` : `${E}: ${v}${d}`;
    }
}
const SIZE_WORD = { person: 'a person', small: 'anything small', air: 'even air' };
const TIME_ATTRS = new Set(['weekday', 'hour', 'time']);
const isTimeEvent = (f) => TIME_ATTRS.has(f.attr) || ['calendar', 'clock', 'weather'].includes(f.of);

// --- What is known, and how far it is trusted.
// Only the chains told so far: a chain through a telling the story has not reached yet (the same account told again
// later, by a letter, to someone else) is not shown, and does not hold the fact up. Where a fact's every chain passes
// through a later telling (a telling's paragraph after the first thing it carries), the chains stand as they are.
const toldChains = (chains) => {
    const told = chains.filter((c) => c.links.every((l) => { if (!l.telling) return true; const g = givenAt(factById.get(l.telling)); return g == null || seen(g); }));
    return told.length ? told : chains;
};
const claimChains = (id) => toldChains(prov.claimChains(id));
const chainsOf = (f) => (f.attr === 'tells' ? [] : toldChains(prov.factChains(f.id)));
/** A fact's level: a telling to a narrator, who witnesses it, as far as that narration is trusted; any other telling as the story reports it (uncertain, and no more than the narration). */
function levelOfFact(f) {
    if (f.hyp) return markLevel(f.hyp.q, f.hyp.pick);
    if (f.reasoned) {
        // The reader's reasoning: as trusted as its weakest premise, and no more than the player trusts it.
        const ls = f.reasoned.premises.map((id) => { const p = factOf(id); return p ? levelOfFact(p) : null; });
        if (ls.some((l) => l == null)) return null;
        const cap = state.trust.people[REASONING];
        return Math.min(...ls, cap ?? LEVELS.length - 1);
    }
    if (f.attr === 'tells') return narratorIds.has(f.to) ? narrationLevel(f.to) : Math.min(DEFAULT_LEVEL, Math.max(...data.narrators.map((n) => narrationLevel(n.id))));
    return levelOf(chainsOf(f), state.trust);
}
/** The chains of an assertion: a claim's own assertions travel as the claim does, with the claimant's word ahead. */
const chainsOfAssertion = (x) => (x.mark ? [x.from ? hypothesisChain(...x.from.slice(4).split('=')) : hypothesisChain(x.q, x.pick)] : x.claim && x.claim === x.fact ? claimChains(x.fact) : chainsOf(factOf(x.fact)));
/** How far the player trusts a narrator's narration (by default the case's trust, certain unless it says otherwise). */
const narrationLevel = (id) => { const n = data.narrators.find((x) => x.id === id); return n ? state.trust.links[linkKey(narrationLink(n))] ?? narrationLink(n).base : DEFAULT_LEVEL; };
/** Told by the paragraph read to, and modelled (a chain reaches the reader, or a telling). */
const visible = (f) => seen(givenAt(f)) && levelOfFact(f) != null;
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
        if (x.claim && x.claim === x.fact) return levelOf(claimChains(x.claim), state.trust) >= state.threshold;
        return accepted(f);
    })];
}

/**
 * What the circled answers need of where their agent was: a circle on a question whose entry is a typed action is
 * that one's act, and an act that needs its agent at a door or at a place puts them there at some moment of its
 * window. Set against where the timeline has them (`alibis`).
 */
function presenceNeeds(accepted) {
    const out = [];
    for (const mark of accepted) {
        if (mark.mark !== 'circled') continue;
        const f = hypAction(mark.id);
        if (!f || !(f.time?.from && f.time?.to)) continue;
        const { entries = [] } = pointImplications(f, nameOf, { ...placeCtx, order: data.order });
        for (const r of entries) {
            if (r.role !== 'requires' || !(r.at || r.place)) continue;
            const places = r.at ? (placeCtx.joins?.[r.at] ?? []) : [r.place];
            if (places.length) out.push({ mark, of: f.of, places, time: f.time, same: placeCtx.same, label: `it needs ${nameOf(f.of)} at ${nameOf(r.at ?? r.place)}` });
        }
    }
    return out;
}

// --- Rendering.
const levelName = (l) => (l == null ? 'unmodelled' : LEVELS[l]);
const dot = (l) => `<span class="lvl lvl-${levelName(l)}" title="${levelName(l)}"></span>`;
const anchorOf = (t) => t.at ?? t.from ?? t.after ?? t.before ?? t.to;
/** A side of a contradiction's time, in words: "at Thursday, nine o'clock", "from … until …" (empty if it has none). */
function sideTime(t) {
    if (!t) return '';
    const w = t.at ? `at ${timeLabel(t.at)}` : t.from && t.to ? `from ${timeLabel(t.from)} until ${timeLabel(t.to)}` : t.from ? `from ${timeLabel(t.from)}`
        : t.after && t.before ? `between ${timeLabel(t.after)} and ${timeLabel(t.before)}` : t.before ? `before ${timeLabel(t.before)}` : t.after ? `after ${timeLabel(t.after)}` : t.to ? `until ${timeLabel(t.to)}` : '';
    return w ? ` <span class="side-time small">${w}</span>` : '';
}
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
    const lvl = levelOf(claimChains(f.id), state.trust);
    const may = f.modal ? ' <span class="small">(may be)</span>' : '';
    const li = items.map((x) => (x.q
        ? `<li>${dot(lvl)}${esc(qLabel(qById.get(x.q)))} ${x.neg ? '<b>Not</b> ' : ''}${pickText(qById.get(x.q), x.pick)}${may}</li>`
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
    return `<${tag} class="${cls}" data-fact="${esc(f.id)}"${f.reasoned ? ' title="Your reasoning"' : ''}>${dot(lvl)}<span class="ph">${phrase(f)}${whenNote(f.time ?? {})}</span>${canReason(f) ? ` ${REASON_MARK}` : ''} ${paraSpan(givenAt(f))}${linkingQ ? ` <button type="button" class="link-row${isLinked(f.id, linkingQ) ? ' on' : ''}" data-link-entry="${esc(f.id)}" data-link-q="${esc(linkingQ)}">${isLinked(f.id, linkingQ) ? 'linked ✓' : '+ relevant'}</button>` : ''}${assertsHtml(f)}</${tag}>`;
}

/** A circled possibility as an entry of the world model: the question's entry with the possibility filled in. */
function hypPhrase(q, pick) {
    const e = q.entry ?? {};
    if (pick === 'something else') return `${esc(qLabel(q))} <b>Something else</b>`;
    if (e.of === '?') return `${pickText(q, pick)}: ${esc(e.value ?? qLabel(q))}`;
    if (e.value == null && ['location', 'identity', 'intends', 'contents', 'carrying', 'owner'].includes(e.attr)) return phrase({ of: e.of, attr: e.attr, value: pick });
    return `${esc(qLabel(q))} <b>${pickText(q, pick)}</b>`;
}
/** A question at its place on the timeline, with its circled possibilities as entries under it. */
function questionRows(q, clashing, tag = 'li') {
    const sel = state.sel === `q:${q.id}` ? ' sel' : '';
    const crossed = shownPossibilities(q).filter((p) => markOf(q, p.value) === 'crossed').map((p) => pickText(q, p.value));
    const head = `<${tag} class="question${sel}${clashing.has(`q:${q.id}`) ? ' clash' : ''}" data-q="${esc(q.id)}"><span class="q-mark">?</span> ${esc(qLabel(q))} ${paraSpan(q.raised ?? q.answer_given_at)}${crossed.length ? ` <span class="small muted">crossed out: <s>${crossed.join('</s>, <s>')}</s></span>` : ''}${givenAway(q) ? ` <span class="small">answered ${paraTag(q.answer_given_at)}: <b>${answerText(q)}</b></span>` : ''}</${tag}>`;
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
        fs.sort((a, b) => byRead(givenAt(a), givenAt(b)));
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
        fs.sort((a, b) => byRead(givenAt(a), givenAt(b)));
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
    const via = m ? ` (implied by your answer to “${esc(qById.has(m[1]) ? qLabel(qById.get(m[1])) : m[1])}”: ${pickText(qById.get(m[1]), m[2])})` : '';
    return `${x.neg ? 'You crossed out' : 'Your hypothesis'}: ${pickText(qById.get(x.q), x.pick)}${via}`;
};
function clashSide(x) {
    if (x.mark) return `<a class="link" data-q="${esc(x.q)}">${markText(x)}</a>${x.needs ? ` <span class="small muted">(${esc(x.needs)})</span>` : ''}`;
    const f = factOf(x.fact);
    if (x.kind === 'pick') {
        const q = qById.get(x.q);
        const who = x.claim ? `${ent(f.of)} ${f.attr === 'believes' ? 'believes' : 'says'}: ` : wordOf(f);
        return `<a class="link" data-fact="${esc(f.id)}">${who}${x.neg ? 'not ' : ''}${pickText(q, x.pick)}</a> ${paraSpan(givenAt(f))}`;
    }
    return `<a class="link" data-fact="${esc(f.id)}">${statePhrase(x, f)}</a>${sideTime(x.time ?? f.time)} ${paraSpan(givenAt(f))}`;
}
/** A state on one side of a contradiction: the fact, or what a claim asserts, with whose word it is. */
const statePhrase = (x, f) => (x.claim && x.claim === x.fact ? `${ent(f.of)} ${f.attr === 'believes' ? 'believes' : 'says'}: ${phrase({ of: x.of, attr: x.attr, value: x.value, neg: x.neg, time: x.time, id: '' })}` : `${wordOf(f)}${phrase(f)}`);
/** Whose word a fact is, ahead of it on a side of a contradiction: the origins of its chains, unless it is a narrator's own. */
function wordOf(f) {
    if (f.reasoned || f.hyp || CLAIM_ATTRS.has(f.attr)) return '';
    // With one narrator, their own needs no name; with several, it does (the porter's statement against the Inspector's).
    const who = [...new Set(chainsOf(f).map((c) => c.origin))].filter((o) => o && o !== '?' && (!narratorIds.has(o) || data.narrators.length > 1));
    return who.length ? `${who.map((o) => `${ent(o)}’s`).join(' and ')} word: ` : '';
}
function clashTitle(c) {
    // One event told twice, at two times (facts with the same `event`).
    if (c.event) return 'One event, at two times?';
    if (c.a.kind === 'pick') return esc(qById.has(c.a.q) ? qLabel(qById.get(c.a.q)) : c.a.q);
    // What the contradiction is about: the state's own subject (what a claim asserts, not the claim's speaker).
    const f = c.a.mark || !c.a.attr ? factOf(c.a.fact) : c.a;
    return `${ent(f.of)}: ${f.attr === 'location' ? 'in two places at once?' : STATES[f.attr] ? 'two states at once?' : 'two identities?'}`;
}

const clashKey = (c) => `clash:${c.a.id}|${c.b.id}${c.via ? `|${c.via.id}` : ''}`;
let current = [];

// --- The layout: three columns side by side, or panels with tabs (two, or one; a phone always one). The page's parts
// (index.html) are moved where the layout puts them, the rest parked; each is drawn by render() wherever it is.
const PARTS = [['story', 'Story'], ['timeline', 'Timeline'], ['questions', 'Questions'], ['clashes', 'Contradictions'], ['cards', 'Cards'], ['detail', 'Detail']];
if (room) {
    PARTS.splice(2, 0, ['room', 'Room']);
    const el = document.createElement('section');
    el.className = 'part room-part'; el.dataset.part = 'room'; el.setAttribute('aria-label', 'The room'); el.innerHTML = '<div id="room"></div>';
    document.getElementById('parked').appendChild(el);
}
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
        for (const id of [...(room ? ['room'] : []), 'clashes', 'questions', 'cards', 'timeline']) put(partEl(id), three.children[1]);
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

// --- The room (world/room.json; engine/arrangement.js).
let roomNote = null;      // why the page last refused a mark on the room panel, shown at its next drawing
let roomKnown = [];       // what the panel reasons from at the last drawing
const roomTime = () => (room.sealed?.time ? { at: room.sealed.time } : undefined);
// A state dated only by its start goes on until told otherwise: it holds at any moment not known to be before it.
const roomCtx = { at: (ft, t) => { if (ft.from && !ft.to) return !data.order.lt(t, ft.from); const c = coverOf(ft); return !c || overlaps(data.order, c, coverOf({ at: t })); } };
const paraOf = (id) => givenAt(factById.get(id)) ?? 0;
/** What the player's room moves put on the timeline. */
function roomEntries(told) {
    const stamp = (e) => ({ ...e, time: roomTime(), given_at: reading.latest(e.reasoned.premises.map(paraOf)) ?? 0 });
    const got = state.room.got.map((id) => told.find((f) => f.id === id)).filter(Boolean).map((f) => stamp(pointPassage(f, [], room.openings).entry));
    const r = checkRoute(state.room.route, [...told, ...got], room.openings);
    return [...got, ...(r.ok ? [stamp(r.entry)] : [])];
}
/** The room panel's view of the timeline. A mark or a link that no longer holds is simply not drawn. */
function roomView(told) {
    const entries = reasoned.filter((f) => f.attr === 'opening');
    const known = [...told, ...entries];
    roomKnown = known;
    const rows = waysIn(room.sealed, known, room.openings, roomCtx);
    const marks = Object.fromEntries(Object.entries(state.room.ways).filter(([k, m]) => { const [row, size] = k.split('|'); return checkWayMark(rows, row, size, m).ok; }));
    const shownRows = rows.map((r) => ({ ...r, evidence: Object.keys(marks).some((k) => k.startsWith(`${r.id}|`)) ? [...new Set(Object.entries(r.cells).flatMap(([, c]) => c.by).map((f) => [f.detail, f.para != null ? paraTag(f.para) : null].filter(Boolean).join(', ')))].filter(Boolean).join('; ') : '' }));
    const gotOffers = known.filter((f) => f.attr === 'passed' && !state.room.got.includes(f.id) && !foundBy({ sides: f.between, passes: f.passes }, known, room.openings));
    // The route as far as it still holds, and the links on from its end.
    const links = linksOf(known, room.openings);
    let nodes = state.room.route;
    let r = checkRoute(nodes, known, room.openings);
    if (!r.ok && r.failAt != null) { nodes = nodes.slice(0, r.failAt + 1); r = checkRoute(nodes, known, room.openings); }
    const end = nodes.at(-1);
    const isPlace = (id) => entityById.get(id)?.kind === 'place';
    const next = end ? [...new Set(links.flatMap((l) => (l.a === end ? [l.b] : l.b === end ? [l.a] : [])))].filter((n) => !nodes.includes(n))
        : [...new Set(links.flatMap((l) => [l.a, l.b]))].filter(isPlace);
    next.sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
    return {
        sealed: room.sealed, note: roomNote, rows: shownRows, marks, gotOffers,
        route: { nodes, next, steady: r.steady ?? [] },
    };
}
const roomChange = (fn) => { remember(); state.room = fn(state.room); save(); render(); };

// --- Observations (world/observations.json; engine/observations.js): an entry linked to an open question.
let linkingQ = null;      // the question "Link observations…" is working on (not saved)
let observed = { filled: [], notes: [] };
// The player's order of the Questions list and its dividing line. Only what the player has moved is kept: a question not
// yet placed comes just above the line, so that one newly raised is always offered and disturbs nothing.
const LINE = '|';
function arranged() {
    const listed = new Map(listedQuestions().map((q) => [q.id, q]));
    const { above = [], below = [] } = state.qOrder ?? {};
    const placed = new Set([...above, ...below]);
    const of = (ids) => ids.filter((id) => listed.has(id)).map((id) => listed.get(id));
    return { above: [...of(above), ...[...listed.values()].filter((q) => !placed.has(q.id))], below: of(below) };
}
const rowOrder = () => { const { above, below } = arranged(); return [...above.map((q) => q.id), LINE, ...below.map((q) => q.id)]; };
/** A new order of the list as shown; what is not listed just now (`LINE` marks the division) keeps its side. */
function setOrder(row, focus = null) {
    const cut = row.indexOf(LINE), shown = new Set(row);
    const { above = [], below = [] } = state.qOrder ?? {};
    state.qOrder = { above: [...row.slice(0, cut), ...above.filter((id) => !shown.has(id))], below: [...row.slice(cut + 1), ...below.filter((id) => !shown.has(id))] };
    save(); render();
    if (focus) document.querySelector(`#q-box [data-q-row="${CSS.escape(focus)}"] .q-grip`)?.focus();
}
const isLinked = (entry, q) => state.links.some((l) => l.entry === entry && l.q === q);
function toggleLink(entry, q) {
    remember();
    state.links = isLinked(entry, q) ? state.links.filter((l) => !(l.entry === entry && l.q === q)) : [...state.links, { entry, q }];
    save(); render();
}
let linkAllFor = null;   // the event whose "Relevant to…" shows the questions below the line as well
/** "Relevant to…" in an event's detail: the open questions above the player's line, so that the list points at none. */
function linkHtml(f) {
    if (!observations) return '';
    const { above, below } = arranged();
    const up = above.filter((q) => !givenAway(q)), down = below.filter((q) => !givenAway(q));
    if (!up.length && !down.length) return '';
    const all = linkAllFor === f.id, extra = down.filter((q) => all || isLinked(f.id, q.id)), qs = [...up, ...extra];
    const more = down.length - extra.length;
    const shows = observed.filled.filter((x) => x.entries.includes(f) || x.entries.some((e) => e.id === f.id));
    return `<h3>Relevant to…</h3>${qs.map((q) => `<button type="button" class="link-q${isLinked(f.id, q.id) ? ' on' : ''}" data-link-entry="${esc(f.id)}" data-link-q="${esc(q.id)}">${esc(qLabel(q))}${isLinked(f.id, q.id) ? ' ✓' : ''}</button>`).join('')}${more ? `<button type="button" class="link-more" data-link-more="${esc(f.id)}">Show the others (${more})</button>` : ''}${shows.map((x) => `<p class="small">Shows: <b>${esc(x.says)}</b>.</p>`).join('')}`;
}
/** What the player has shown about a question: its observations, their sources, and any notes. */
function descriptionHtml(q) {
    if (!observations) return '';
    const mine = observed.filled.filter((x) => x.obs.q === q.id);
    const notes = observed.notes.filter((l) => l.q === q.id).map((l) => factOf(l.entry)).filter(Boolean);
    const from = (x) => x.entries.map((e) => paraTag(givenAt(e))).join(', ');
    const items = mine.map((x) => `<li>${esc(x.says)}${list(x.obs.against).length ? ` <span class="small muted">against: ${list(x.obs.against).map(esc).join(', ')}</span>` : ''} <span class="para">${esc(from(x))}</span></li>`).join('');
    const d = givenAway(q) ? described(observations, q.id, observed.filled) : null;
    const verdict = d?.any ? `<p class="small">${d.done ? 'Your description had everything it needed.' : `Your description lacked: ${d.missing.map(esc).join('; ')}.`}</p>` : '';
    const noteHtml_ = notes.length ? `<div class="small muted">Your notes: ${notes.map((e) => phrase(e)).join('; ')}</div>` : '';
    const start = !givenAway(q) ? `<button type="button" class="link-start${linkingQ === q.id ? ' on' : ''}" data-linking="${esc(q.id)}">${linkingQ === q.id ? 'Linking…' : 'Link observations…'}</button>` : '';
    return `<div class="desc">${items ? `<div class="small muted">What you have shown about it</div><ul class="desc-list">${items}</ul>` : ''}${noteHtml_}${verdict}${start}</div>`;
}
const linkingBar = () => (linkingQ && qById.has(linkingQ) ? `<div class="linking-bar"><span>Linking to: <b>${esc(qLabel(qById.get(linkingQ)))}</b></span><button type="button" data-linking-done>Done</button></div>` : '');

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
    reasoned = reasonedEntries(state.reasoning, (id) => factById.get(id) ?? hypIntention(id) ?? hypAction(id) ?? presupposed(id), data.order, nameOf, givenAt, { ...placeCtx, entries: told, lapsed: lapses, held, latest: (xs) => reading.latest(xs) });
    if (room) reasoned = [...reasoned, ...roomEntries(told)];
    reasonedById = new Map(reasoned.map((f) => [f.id, f]));
    // An aim still circled but not yet told (read back) is not a lapse: the link returns on reading on.
    lapsed = lapses.filter((l) => !(l.gone && /^(hyp|pre):/.test(l.gone) && !hypShown(l.gone)));
    // Announced: a move that held at the last drawing and no longer does (not one read back past and read on to again).
    const keys = new Set(lapsed.map((l) => moveKey(l.move)));
    lapseNews = heldKeys ? [...lapseNews.filter((l) => keys.has(moveKey(l.move))), ...lapsed.filter((l) => heldKeys.has(moveKey(l.move)))] : [];
    heldKeys = new Set(held.map(moveKey));
    // A link to the route stays with the route as it grows or is taken back (its entry is named after its nodes).
    const routeNow = reasoned.find((f) => f.attr === 'route');
    if (routeNow) for (const l of state.links) if (l.entry.startsWith('r:r:') && l.entry !== routeNow.id) l.entry = routeNow.id;
    // A telling can be linked like any entry: that it was said stands, whatever becomes of what it carried.
    if (observations) observed = fill(observations, state.links, [...onTimeline(), ...data.facts.filter((f) => f.attr === 'tells' && visible(f) && accepted(f))], state.marks, { doubted });
    syncQuestions();
    const qList = document.querySelector('#q-box ol');
    const qScroll = qList?.scrollTop ?? 0;
    // The reading controls work on the story shown in the Story panel (the main story, or a file).
    const sid = state.story, at = reading.readTo(sid);
    document.getElementById('para').value = at;
    document.getElementById('para').max = lastOf(sid);
    document.getElementById('next').disabled = at >= lastOf(sid);
    document.getElementById('para').min = at;
    document.getElementById('show-below').checked = state.showBelow;
    const th = document.getElementById('threshold');
    th.innerHTML = LEVELS.slice(0, -1).map((l, i) => `<option value="${i}"${i === state.threshold ? ' selected' : ''}>${l}</option>`).join('');
    document.getElementById('narrator-trust').innerHTML = data.narrators.map((n) => `<label title="How far you trust what ${esc(n.name ?? 'the narrator')} tells you: everything in the story comes through this narration">Trust in ${esc(n.name ?? 'the narrator')} as narrator
          <select class="narration-trust" data-key="${esc(linkKey(narrationLink(n)))}" data-base="${narrationLink(n).base}">${LEVELS.map((l, i) => `<option value="${i}"${i === narrationLevel(n.id) ? ' selected' : ''}>${l}</option>`).join('')}</select></label>`).join('');

    // The story so far, the newest paragraph last and in view.
    const st = document.getElementById('story');
    st.innerHTML = storyTabsHtml() + (at ? stories.get(sid).slice(1, at + 1).map((p, i) => `<p class="sp${i + 1 === at && reading.log.at(-1) === `${sid}:${at}` ? ' now' : ''}" data-sp="${esc(`${sid}:${i + 1}`)}">${paraSpan(sid === MAIN ? i + 1 : `${sid}:${i + 1}`)} ${paraHtml(sid, i + 1)}</p>`).join('')
        : `<p class="muted small">${esc(fileById.get(sid)?.title ?? '')}: not read yet. <b>Read on ▶</b> reads it.</p>`);
    // Only a new paragraph scrolls the story to its end: a click elsewhere leaves it where the player put it.
    const shownKey = `${sid}:${at}`;
    if (shownPara !== shownKey && visibleEl(st)) { shownPara = shownKey; st.lastElementChild?.scrollIntoView({ block: 'nearest' }); }

    const acceptedNow = acceptedAssertions();
    const clashes = [...contradictions(data, acceptedNow), ...alibis(data, acceptedNow, presenceNeeds(acceptedNow))];
    const clashing = new Set(clashes.flatMap((c) => [c.a, c.b, c.via].filter(Boolean)).flatMap((x) => (x.mark ? [x.id, `q:${x.q}`] : [x.fact])));
    current = clashes;
    document.getElementById('undo').disabled = !state.history.length;
    document.getElementById('clashes').innerHTML = clashes.length
        ? `<details class="clash-box" open><summary>${clashes.length} contradiction${clashes.length > 1 ? 's' : ''} among what is on the timeline</summary><ol>${clashes.map((c) => `<li class="${state.sel === clashKey(c) ? 'sel' : ''}"><b>${clashTitle(c)}</b> <a class="link trace" data-clash="${esc(clashKey(c))}">trace</a><br>${clashSide(c.a)}<br>against ${clashSide(c.b)}${c.via ? `<br>with ${clashSide(c.via)}` : ''}</li>`).join('')}</ol><p class="small muted">Trace a contradiction to see both sides' chains, then lower your trust in a link of one of them.</p></details>`
        : '';
    const strains = activeStrains();
    document.getElementById('clashes').innerHTML += strainsHtml(strains);
    document.getElementById('questions').innerHTML = questionsPanel(clashing);
    const cards = cardsPanel();
    document.getElementById('cards').innerHTML = cards.html;
    if (room) { document.getElementById('room').innerHTML = roomHtml(roomView(told), { esc, ent, phrase, nameOf }); roomNote = null; }
    const ol = document.querySelector('#q-box ol');
    if (ol) ol.scrollTop = qScroll;
    document.getElementById('view').value = state.view;
    document.getElementById('only-moves').value = state.onlyMoves ? 'moves' : 'all';
    document.getElementById('depth').value = String(state.depth);
    document.getElementById('depth-label').hidden = state.view !== 'place';
    document.querySelector('.world-main').classList.toggle('wide', state.view !== 'list');
    document.getElementById('timeline').innerHTML = linkingBar() + (state.view === 'list' ? eventList(movesOnly, clashing, movesOnlyQ) : eventGrid(clashing));
    if (state.view !== 'list' && visibleEl(document.getElementById('timeline'))) packGrid();
    renderTabs({ cards: cards.count, questions: listedQuestions().length, clashes: clashes.length + strains.filter((s) => !state.held.includes(s.id)).length });
    renderLapseNews();
    renderGate();
    renderAnswers();
    renderDetail(clashing);
}

function linkStep(l, body, title, resolving) {
    const key = linkKey(l);
    const mark = resolving?.links.includes(key) ? ' resolving' : '';
    // A link with a level of its own to start from (a doubtable narrator's own statement: as the narration) offers up to it.
    const base = l.base ?? DEFAULT_LEVEL;
    const level = state.trust.links[key] ?? base;
    const opts = LEVELS.slice(0, Math.max(LEVELS.length - 1, base + 1)).map((n, i) => `<option value="${i}"${i === level ? ' selected' : ''}>${n}</option>`).join('');
    return `<span class="link-step${mark}"${mark ? ' title="Distrusting this link alone takes this side off the timeline"' : ''}>${body} <select class="link-trust" data-key="${esc(key)}" data-base="${base}" title="${title}">${opts}</select>${dropChip(resolving?.drop?.links.get(key))}</span>`;
}
/**
 * A chain's links, but its statement's own link, which is drawn once above the chains (stmtHtml), and the narration
 * link at its end, the frame of the whole story (its trust is in Settings): a chain is drawn up to the narrator.
 */
function chainHtml(c, resolving = null) {
    const steps = c.links.filter((l) => !l.stmt && !l.narrator);
    const links = steps.map((l) => linkStep(l, `→ <span class="how">${esc(l.how)}${l.uncertain ? '?' : ''}</span> → ${ent(l.to)}`, 'How far you trust this link', resolving)).join(' ');
    const own = !steps.length && c.links.some((l) => l.narrator) ? ` <span class="muted">(${esc(narratorName(c.origin) ?? nameOf(c.origin))}’s own)</span>` : '';
    return `<li>${dot(levelOf([c], state.trust))}${entHead(c.origin ?? '?')}${steps.length ? ' ' + links : own}</li>`;
}
/** The statement's own link: how far the player trusts this one claim or fact, apart from the rest that came the same way. */
function stmtHtml(chains, resolving = null) {
    const own = [...new Map(chains.flatMap((c) => c.links.filter((l) => l.stmt)).map((l) => [l.stmt, l])).values()];
    return own.map((l) => `<p class="small stmt-line">${linkStep(l, 'This statement itself:', 'How far you trust this one statement, apart from the rest that came the same way', resolving)}</p>`).join('');
}
function peopleHtml(chains, resolving = null) {
    const people = [...new Set(chains.flatMap((c) => c.links.filter((l) => !l.narrator).map((l) => l.from)))].filter((p) => p && p !== '?' && !narratorIds.has(p));
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
    for (const k of new Set(chains.flatMap((c) => c.links.filter((l) => !l.narrator).map(linkKey)))) links.set(k, count({ ...state.trust, links: { ...state.trust.links, [k]: 0 } }));
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
      ${stmtHtml(chains, r)}<ul class="chains">${chains.map((c) => chainHtml(c, r)).join('')}</ul>${peopleHtml(chains, r)}</div>`;
    }
    const f = factOf(x.fact);
    if (f.reasoned) {
        return `<div class="side"><h3>${label}</h3><p><a class="link" data-fact="${esc(f.id)}">${phrase(f)}</a>${sideTime(x.time ?? f.time)}</p>
      <p class="small">From your reasoning. Trusted: <b>${levelName(levelOfFact(f))}</b>, as its weakest premise. Lower your trust in a premise, or withdraw it.</p>
      <ul class="events">${f.reasoned.premises.map((id) => factOf(id)).filter(Boolean).map((p) => eventRow(p, new Set())).join('')}</ul></div>`;
    }
    const what = x.kind === 'pick'
        ? `${x.claim ? `${ent(f.of)} ${f.attr === 'believes' ? 'believes' : 'says'}: ` : wordOf(f)}${x.neg ? 'not ' : ''}${pickText(qById.get(x.q), x.pick)}`
        : statePhrase(x, f);
    return `<div class="side"><h3>${label}</h3><p><a class="link" data-fact="${esc(f.id)}">${what}</a>${x.kind === 'pick' ? '' : sideTime(x.time ?? f.time)}</p>
      <p class="quote">“${esc(f.given_quote ?? f.quote)}” ${paraSpan(givenAt(f))}</p>
      <p class="small">Trusted: <b>${levelName(levelOf(chains, state.trust))}</b>${r.links.length || r.people.length ? '; <span class="resolving">marked</span>: distrusting it alone takes this side off the timeline' : '; no single link takes it off: it has independent chains'}.</p>
      ${stmtHtml(chains, r)}<ul class="chains">${chains.map((c) => chainHtml(c, r)).join('')}</ul>${peopleHtml(chains, r)}</div>`;
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
/**
 * A statement the player no longer believes, for a lie as evidence (an observation from `{doubted: id}`): a telling
 * whose false facts told so far are all off the timeline, or a claim whose false assertions are.
 */
function doubted(id) {
    const f = factById.get(id);
    if (!f) return false;
    if (CLAIM_ATTRS.has(f.attr)) return allAssertions.some((x) => x.claim === id && x.truth === false) && levelOf(claimChains(id), state.trust) < state.threshold;
    if (f.attr !== 'tells') return false;
    const told = new Set(list(f.value));
    const lies = data.accounts.filter((a) => told.has(a.id) || [...prov.ancestors(a.id)].some((p) => told.has(p)))
        .flatMap((a) => list(a.facts)).map((x) => factById.get(x)).filter((x) => x && x.truth === false && seen(givenAt(x)));
    return lies.length > 0 && lies.every((x) => !accepted(x));
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
    if (p) { const q = qById.get(p[1]); return !!q && seen(q.raised); }
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
        if (/^pre:/.test(l.gone)) return `It came from your answer to “${esc(qOfHyp(l.gone) ? qLabel(qOfHyp(l.gone)) : '')}”, which presupposes it: no answer is circled there now.`;
        const m = /^hyp:(.+)=(.+)$/.exec(l.gone);
        const q = m && qById.get(m[1]);
        return q ? `You no longer have “${esc(entityById.has(m[2]) ? nameOf(m[2]) : m[2])}” circled for “${esc(qLabel(q))}”.` : 'What it was reasoned from is no longer there.';
    }
    if (l.ruledOut) {
        const q = baseQuestions.find((x) => x.entry?.of === l.ruledOut.item && x.entry?.attr === 'contents');
        const kinds = l.ruledOut.kinds.map((k) => KIND_WORD[k] ?? k).join(' or ');
        return `It would only work if ${val(l.ruledOut.item)} were ${kinds}${q ? `, and your marks on “${esc(qLabel(q))}” rule that out` : ', and that is ruled out'}.`;
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
        if (r.fits) return `It served a need of your hypothesis, ${phrase(r.need)}, which came from “${esc(p.value)}” on “${esc(qLabel(q))}”: that is no longer circled.`;
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
        if (!compared.has(key)) return `<li><button type="button" class="move" data-compare="${esc(key)}">Compare</button> ${phrase(x)} ${paraSpan(givenAt(x))}</li>`;
        const r = comparePlans(plan, { id: x.id, ...x.plan }, on, nameOf, { ...placeCtx, order: data.order, entries: on });
        return `<li>${phrase(x)} ${paraSpan(givenAt(x))}
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
    const items = xs.map((x) => `<li>${accountChecked.has(key(x)) ? '' : `<button type="button" class="move" data-account="${esc(key(x))}">Check</button> `}${stepText(x)} ${paraSpan(givenAt(x))}${accountChecked.has(key(x)) ? ` ${answer(x)}` : ''}</li>`).join('');
    return `<h3>Does it account for this?</h3><p class="small">What else ${ent(plan.agent)} did or wanted, on the timeline: does it serve the plan?</p><ul class="moves">${items}</ul>`;
}
function movesHtml(f) {
    const q = f.reasoned?.move === 'a' && f.of === '?' ? (questionOfChange(f) ?? qById.get(`who:${f.id}`)) : null;
    const who = q ? `<h3>Who did it? <span class="small muted">(your hypothesis)</span></h3>
      <p class="small">${q.own ? 'Your own question' : 'The question'}: <a class="link" data-q="${esc(q.id)}">${esc(qLabel(q))}</a></p>${chipsHtml(q)}${candidatesHtml(q)}` : '';
    return `${changeMoveHtml(f)}${implicationsHtml(f)}${who}${purposeHtml(f)}${lapsedHtml(f)}${planHtml(f)}`;
}
function reasonedDetail(f) {
    const how = f.reasoned.move === 'g' ? 'Something crossed between two places, so there is a way between them.'
        : f.reasoned.move === 'r' ? 'Each link of the route is on the timeline.'
        : f.reasoned.move === 'a' ? 'Two states of one thing differ, so something changed it between them.'
        : f.reasoned.move === 'c' ? 'What it brings about meets the goal of an intention, or a need of a step toward it.'
        : f.reasoned.role === 'requires' ? 'What an action needs just before it.' : 'What an action does.';
    const premises = f.reasoned.premises.map((id) => factOf(id)).filter(Boolean);
    const cap = { origin: REASONING, links: [{ from: REASONING, to: READER, how: 'reasoning' }] };
    return `<h2>${phrase(f)}</h2>
      <p class="small">When: ${timeLabel(anchorOf(f.time ?? {}))}${whenNote(f.time ?? {})}. From <span class="hyp-name">your reasoning</span>: ${how}
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
// --- The story's tabs: the main story and each file delivered so far, with how far each is read.
function storyTabsHtml() {
    if (!files.length) return '';
    const tab = (id, title) => {
        const at = reading.readTo(id), last = lastOf(id);
        return `<button type="button" class="story-tab${state.story === id ? ' on' : ''}${!at ? ' unread' : ''}" data-story="${esc(id)}" title="${at ? `Read to ¶${at} of ${last}` : 'Not read yet'}">${esc(title)} <span class="small muted">${at}/${last}</span></button>`;
    };
    const shown = files.filter((f) => delivered(f.id));
    const waiting = files.length - shown.length;
    return `<div class="story-tabs" role="tablist">${tab(MAIN, 'The story')}${shown.map((f) => tab(f.id, f.title)).join('')}</div>${waiting ? `<p class="small muted story-waiting">${waiting === 1 ? 'One more paper' : `${waiting} more papers`} may come as the story goes on.</p>` : ''}`;
}
// --- The story's names, and the Cards.
/** A paragraph of the story: its text, its names linked to their cards, its _italics_ as such. */
function paraHtml(sid, i) {
    const p = stories.get(sid)[i];
    const links = namedBy.get(sid).spans[i].filter((x) => x.kind === 'entity' && entityById.has(x.ids[0])).sort((a, b) => a.start - b.start);
    const italic = [];
    for (const m of p.matchAll(/_([^_]+)_/g)) italic.push([m.index, m.index + m[0].length]);
    const cuts = new Set([0, p.length, ...links.flatMap((x) => [x.start, x.end]), ...italic.flat()]);
    const at = [...cuts].sort((a, b) => a - b);
    let out = '';
    for (let k = 0; k + 1 < at.length; k++) {
        const [a, b] = [at[k], at[k + 1]];
        let seg = esc(p.slice(a, b).replace(/_/g, ''));
        if (!seg) continue;
        if (italic.some(([x, y]) => a >= x && b <= y)) seg = `<em>${seg}</em>`;
        const link = links.find((x) => a >= x.start && b <= x.end);
        if (link) seg = `<a class="ent" data-ent="${esc(link.ids[0])}">${seg}</a>`;
        out += seg;
    }
    return out;
}
const CARD_GROUPS = [['People', ['person']], ['Animals', ['animal']], ['Places', ['place']], ['Things', ['object', 'document', 'race']], ['Groups', ['group']]];
/** The people, animals, places, things and groups met so far, by kind, in the order met: each opens its card. */
function cardsPanel() {
    const met = data.entities.filter((e) => seen(firstSeen(e.id)));
    let count = 0;
    const groups = CARD_GROUPS.map(([name, kinds]) => {
        const xs = met.filter((e) => kinds.includes(e.kind)).sort((a, b) => byRead(firstSeen(a.id), firstSeen(b.id)));
        count += xs.length;
        return xs.length ? `<h3>${name} <span class="small muted">(${xs.length})</span></h3><ul class="cards-list">${xs.map((e) => `<li class="${state.sel === e.id ? 'sel' : ''}">${ent(e.id)} ${paraSpan(firstSeen(e.id))}</li>`).join('')}</ul>` : '';
    }).join('');
    if (!count) return { html: '', count };
    return { count, html: `<details class="cards-box" id="cards-box"${state.cardsOpen || layoutNow() !== 'three' ? ' open' : ''}><summary>Cards (${count})</summary>${groups}<p class="small muted">Everyone and everything met so far, in the order met. A name opens its card: its own timeline, the questions about it, and where the story mentions it.</p></details>` };
}
/** The sentence of a paragraph around a span, the span itself in bold. */
function sentenceAt(sid, i, span) {
    const p = stories.get(sid)[i];
    const before = p.slice(0, span.start), after = p.slice(span.end);
    const start = Math.max(0, ...[...before.matchAll(/[.!?][’”"]?\s/g)].map((m) => m.index + m[0].length));
    const stop = after.search(/[.!?][’”"]?(\s|$)/);
    const tail = stop < 0 ? after : after.slice(0, stop + 1);
    const clean = (t) => esc(t.replace(/_/g, ''));
    return `${start > 0 ? '… ' : ''}${clean(before.slice(start))}<b>${clean(p.slice(span.start, span.end))}</b>${clean(tail)}${stop >= 0 && span.end + stop + 1 < p.length ? ' …' : ''}`;
}
/** An entity's card: its own timeline, the questions about it, and where the story has named it so far. */
function entityDetail(id, clashing) {
    const qs = listedQuestions().filter((q) => q.entry?.of === id);
    const spots = [];
    for (const sid of storyIds) for (let i = 1; i <= reading.readTo(sid); i++) for (const x of namedBy.get(sid).spans[i]) if (x.kind === 'entity' && x.ids[0] === id) spots.push([sid, i, x]);
    const refOf = (sid, i) => (sid === MAIN ? i : `${sid}:${i}`);
    spots.sort((a, b) => byRead(refOf(a[0], a[1]), refOf(b[0], b[1])));
    const said = spots.map(([sid, i, x]) => `<li>${sentenceAt(sid, i, x)} ${paraSpan(refOf(sid, i))}</li>`).join('');
    return `<h2>${esc(nameOf(id))}</h2>
      ${qs.length ? `<h3>Questions about it</h3><ul class="card-qs">${qs.map((q) => `<li><a class="link" data-q="${esc(q.id)}">${esc(qLabel(q))}</a> ${paraSpan(q.raised ?? q.answer_given_at)}</li>`).join('')}</ul>` : ''}
      ${spots.length ? `<details class="mentions" id="mentions-box"${state.mentionsOpen ? ' open' : ''}><summary>Where the story mentions it (${spots.length})</summary><ul class="said">${said}</ul></details>` : ''}
      <h3>Its timeline</h3>${eventList((f) => f.of === id, clashing, (q) => q.entry?.of === id)}`;
}

function questionsPanel(clashing) {
    const { above, below } = arranged();
    const qs = [...above, ...below];
    if (!qs.length) return '';
    const item = (q, i) => `<li value="${i + 1}" data-q-row="${esc(q.id)}" class="${state.sel === `q:${q.id}` ? 'sel' : ''}${clashing.has(`q:${q.id}`) ? ' clash' : ''}"><span class="q-grip" role="button" tabindex="0" aria-label="Move this question: drag it, or use the up and down arrow keys" title="Drag to move (or the arrow keys)">≡</span><button type="button" class="q-top" data-q-top="${esc(q.id)}" aria-label="Move to the top" title="To the top">↑</button> <a class="link" data-q="${esc(q.id)}">${esc(qLabel(q))}</a> ${paraSpan(q.raised ?? q.answer_given_at)}${qAnchor(q) ? '' : ' <span class="small muted" title="Its entry has no place in time: it is only here">(no time)</span>'}
      ${chipsHtml(q)}${descriptionHtml(q)}${givenAway(q) ? `<div class="small">Answered at ${paraTag(q.answer_given_at)}: <b>${answerText(q)}</b></div>` : ''}</li>`;
    const line = observations ? `<li class="q-line" data-q-row="${LINE}"><span class="q-grip" role="button" tabindex="0" aria-label="Move the dividing line: drag it, or use the up and down arrow keys" title="Drag to move (or the arrow keys)">≡</span> Questions above this line are offered under “Relevant to…”. Drag it up to shorten that list.</li>` : '';
    const items = above.map(item).join('') + line + below.map((q, i) => item(q, above.length + i)).join('');
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
const activeStrains = () => strainList.filter((s) => seen(s.available) && (strainSideIsMark(s.a) || strainSideIsMark(s.b)) && strainSideOn(s.a) && strainSideOn(s.b));
function strainSideHtml(x, inKey = false) {
    if (inKey && typeof x !== 'string') { const q = qById.get(x.q); return `<b>${pickText(q, x.pick)}</b> for “${esc(qLabel(q))}”`; }
    if (typeof x === 'string') { const f = factById.get(x); return f ? `<a class="link" data-fact="${esc(f.id)}">${phrase(f)}</a> ${paraSpan(givenAt(f))}` : esc(x); }
    const q = qById.get(x.q);
    return `your circle on “<a class="link" data-q="${esc(q.id)}">${esc(qLabel(q))}</a>”: <b>${pickText(q, x.pick)}</b>`;
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
    const ss = strainList.filter((s) => s.key === q.id && seen(s.available));
    if (!givenAway(q) || !ss.length) return '';
    return `<h3>What a careful reader would have noticed</h3><ul class="strains-key small">${ss.map((s) => `<li><b>${esc(s.why)}</b> ${strainSideHtml(s.a, true)} / ${strainSideHtml(s.b, true)}</li>`).join('')}</ul>`;
}
function questionDetail(q, clashing) {
    const marked = shownPossibilities(q).filter((p) => markOf(q, p.value));
    const chains = marked.map((p) => hypothesisChain(q.id, p.value));
    const markLi = marked.map((p) => `<li>${markOf(q, p.value) === 'circled' ? 'Circled' : 'Crossed out'}: ${pickText(q, p.value)}${clashing.has(hypothesisKey(q.id, p.value)) ? ' <span class="bad small">in a contradiction</span>' : ''}<ul class="chains">${chainHtml(hypothesisChain(q.id, p.value))}</ul></li>`).join('');
    return `<h2><span class="q-mark">?</span> ${esc(qLabel(q))}</h2>
      ${q.own ? `<p class="small">Raised by your reasoning: <a class="link" data-fact="${esc(q.change)}">${phrase(reasonedById.get(q.change) ?? {})}</a></p>` : `<p class="quote">“${esc(q.quote ?? '')}” ${paraSpan(q.raised ?? q.answer_given_at)}</p>`}
      ${qAnchor(q) ? `<p class="small">When: ${timeLabel(qAnchor(q))}${whenNote(typeof q.entry.time === 'string' ? {} : q.entry.time)}.</p>` : ''}
      ${chipsHtml(q)}${descriptionHtml(q)}
      ${givenAway(q) ? `<p class="small">Answered at ${paraTag(q.answer_given_at)}: <b>${answerText(q)}</b><br><span class="quote">“${esc(q.answer_given_quote ?? '')}”</span></p>${keyStrainsHtml(q)}` : ''}
      ${marked.length ? `<h3>Your marks, your hypothesis</h3><ul class="marks">${markLi}</ul>${peopleHtml(chains)}` : '<p class="small muted">No marks yet: every possibility is uncertain.</p>'}${candidatesHtml(q)}${actionMovesHtml(q)}${aimPlansHtml(q)}`;
}

function renderDetail(clashing) {
    const el = document.getElementById('detail');
    const sel = state.sel;
    if (sel?.startsWith('clash:')) {
        const open = current.find((c) => clashKey(c) === sel);
        const [a, b, via] = sel.slice(6).split('|').map((id) => assertionById.get(id));
        const c = open ?? { a, b, via };
        el.innerHTML = `<h2>${clashTitle(c)}</h2>
          <p class="small ${open ? 'bad' : 'good'}">${open ? 'Both sides are on the timeline: they cannot both hold.' : 'Resolved: one side is no longer on the timeline.'}</p>
          ${sideHtml(c.a, 'One side')}${sideHtml(c.b, 'Against')}${c.via ? sideHtml(c.via, 'With') : ''}`;
        return;
    }
    if (sel && reasonedById.has(sel)) {
        el.innerHTML = noteHtml() + reasonedDetail(reasonedById.get(sel), clashing) + linkHtml(reasonedById.get(sel));
        return;
    }
    if (sel && factById.has(sel)) {
        const f = factById.get(sel);
        const chains = chainsOf(f);
        const content = CLAIM_ATTRS.has(f.attr) && list(f.asserts).length ? claimChains(f.id) : [];
        el.innerHTML = `<h2>${phrase(f)}</h2>
          <p class="quote">“${esc(f.given_quote ?? f.quote)}” ${paraSpan(givenAt(f))}</p>
          <p class="small">When: ${timeLabel(anchorOf(f.time ?? {}))}${whenNote(f.time ?? {})}. Trusted: <b>${levelName(levelOfFact(f))}</b>.</p>
          ${f.attr === 'tells' ? '<p class="small muted">A telling: how an account passed from one person to another.</p>'
            : `<h3>How it reaches you</h3>${stmtHtml(chains)}<ul class="chains">${chains.map((c) => chainHtml(c)).join('')}</ul>`}
          ${content.length ? `<h3>What it asserts reaches you</h3>${stmtHtml(content)}<ul class="chains">${content.map((c) => chainHtml(c)).join('')}</ul>${assertsHtml(f)}` : ''}
          ${peopleHtml([...chains, ...content])}${movesHtml(f)}${linkHtml(f)}`;
        el.insertAdjacentHTML('afterbegin', noteHtml());
        return;
    }
    if (sel?.startsWith('q:') && qById.has(sel.slice(2)) && qListed(qById.get(sel.slice(2)))) {
        el.innerHTML = noteHtml() + questionDetail(qById.get(sel.slice(2)), clashing);
        return;
    }
    if (sel && entityById.has(sel)) {
        el.innerHTML = entityDetail(sel, clashing);
        return;
    }
    el.innerHTML = '<p class="muted">Click an event for where it comes from, or a name for its own timeline.</p>';
}

// --- Events.
/**
 * The gate: before the story gives away the answer to a question a reader could have reached earlier (raised, not
 * latent, inferable before it is given), the player commits: exactly one possibility circled. Any answer passes, so
 * nobody is stuck. Reading stops before the first paragraph whose give-aways are not committed. Reading only goes forward: the
 * story so far stays on the page to scroll back through.
 */
// Inferable before it is given: at an earlier paragraph of the main story, or in a file (a file never gives an answer away).
const earlierRef = (a, b) => refList(a).length > 0 && refList(a).every((r) => { const x = parseRef(r), y = parseRef(b); return !!x && !!y && y.story === MAIN && (x.story !== MAIN || x.n < y.n); });
const GATED = data.questions.filter((q) => q.answer != null && !q.latent && q.raised != null && q.answer_inferable_at != null && earlierRef(q.answer_inferable_at, q.answer_given_at));
/** `fn` as things stood with the main story read to ¶p (the files as read now, up to what was read before it). */
const atPara = (p, fn) => {
    const was = reading;
    const r = new Reading(was.log.filter((k) => { const x = parseRef(k); return x.story !== MAIN || x.n <= p; }), lengths);
    r.readOn(MAIN, p);
    reading = r; syncReading();
    try { return fn(); } finally { reading = was; syncReading(); }
};
const circledCount = (q) => shownPossibilities(q).filter((o) => markOf(q, o.value) === 'circled').length;
/** The gated questions given away at ¶p and not committed to just before it. */
// The gate before a paragraph that gives an answer away. A question with required evidence (essential observations)
// lets the story on only with that evidence linked and a right answer circled (Settings: or with any one answer, as
// every other question does). `gateState`: 'pick' (not one circle), 'evidence', 'wrong', or null (met).
const strictGate = () => state.gate !== 'any';
const evidenceOf = (q) => (observations ? described(observations, q.id, observed.filled) : { any: false });
function gateState(q) {
    const picks = shownPossibilities(q).filter((o) => markOf(q, o.value) === 'circled');
    if (circledCount(q) !== 1) return 'pick';
    const d = evidenceOf(q);
    if (!strictGate() || !d.any) return null;
    if (!d.done) return 'evidence';
    return picks.length === 1 && isRight(q, picks[0].value) ? null : 'wrong';
}
const gateAt = (p) => atPara(p - 1, () => GATED.filter((q) => q.answer_given_at === p && qListed(q) && gateState(q) !== null));
let gateHidden = null;    // the gate's key while its notice is hidden
let answerNews = [];      // the answers just given: {q, mark}
const setPara = (n) => {
    const from = state.para, want = Math.max(from, Math.min(LAST, n | 0));
    let to = want;
    for (let p = from + 1; p <= want; p++) if (gateAt(p).length) { to = p - 1; gateHidden = null; flashGate = true; break; }
    // The answers given on the way, with how the player's marks fare.
    if (to > from) answerNews = GATED.filter((q) => q.answer_given_at > from && q.answer_given_at <= to).map((q) => ({ q, picks: atPara(q.answer_given_at - 1, () => shownPossibilities(q).filter((o) => markOf(q, o.value) === 'circled').map((o) => o.value)) }));
    else answerNews = [];
    reading.readOn(MAIN, to);
    syncReading();
    save(); render();
};
/** Read on in a file to its paragraph n (a file has no gate: it never gives an answer away). */
const readFile = (id, n) => {
    if (!delivered(id)) return;
    reading.readOn(id, Math.max(reading.readTo(id), Math.min(lastOf(id), n | 0)));
    answerNews = [];
    syncReading();
    save(); render();
};
/** Read on in the story shown in the Story panel. */
const readShown = (n) => (state.story === MAIN ? setPara(n) : readFile(state.story, n));
let flashGate = false;
function renderGate() {
    const el = document.getElementById('gate-news');
    const qs = gateAt(state.para + 1);
    const key = qs.map((q) => q.id).join('|');
    el.hidden = !qs.length || gateHidden === key;
    document.getElementById('next').title = state.story !== MAIN ? `Read the next paragraph of ${fileById.get(state.story)?.title ?? 'this paper'}` : qs.length ? `Before ¶${state.para + 1}: commit to an answer first` : 'Read the next paragraph';
    if (!qs.length) return;
    const count = (q) => {
        const n = circledCount(q), d = evidenceOf(q), s = gateState(q);
        if (s === 'pick') return n === 0 ? 'nothing circled yet' : `${n} circled`;
        if (s === 'evidence') { const all = observations.filter((o) => o.q === q.id && o.essential).length; return `its evidence is not all linked yet: ${all - d.missing.length} of ${all}`; }
        return 'the evidence is linked, and it does not lead to the answer you circled';
    };
    const strict = strictGate() && qs.some((q) => evidenceOf(q).any), loose = qs.some((q) => !strictGate() || !evidenceOf(q).any);
    const rule = !strict ? `Commit first: circle exactly one answer${qs.length === 1 ? '' : ' for each'}. Any answer will do; the key shows at ¶${state.para + 1}.`
        : `The story goes on once you have shown the answer: link the evidence for it (“Link observations…”) and circle the one answer the evidence leaves${loose ? '. A question with no evidence to link takes any one answer' : ''}.`;
    el.innerHTML = `<p><b>Before ¶${state.para + 1}</b>, the story gives away the answer to ${qs.length === 1 ? 'this question' : `these ${qs.length} questions`}. ${rule}</p>
      <ul>${qs.map((q) => `<li><a class="link" data-q="${esc(q.id)}">${esc(qLabel(q))}</a> <span class="small muted">(${count(q)})</span></li>`).join('')}</ul>
      <p>${AUTOPLAY === null ? '<button type="button" class="quiet" data-hint>Hint</button> ' : ''}<button type="button" class="quiet" data-gate-hide>Hide</button></p>`;
    if (flashGate) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); flashGate = false; }
}
function renderAnswers() {
    const el = document.getElementById('answer-news');
    el.hidden = !answerNews.length;
    if (!answerNews.length) return;
    const line = ({ q, picks }) => {
        const right = picks.length === 1 && isRight(q, picks[0]);
        const yours = picks.length ? picks.map((v) => pickText(q, v)).join(', ') : 'nothing';
        return `<li><a class="link" data-q="${esc(q.id)}">${esc(qLabel(q))}</a>: <b>${answerText(q)}</b> <span class="small ${right ? 'good' : 'bad'}">(you circled ${yours}${right ? ': right' : ''})</span></li>`;
    };
    el.innerHTML = `<p><b>The story has answered:</b></p><ul>${answerNews.map(line).join('')}</ul><p><button type="button" class="quiet" data-answers-close>Dismiss</button></p>`;
}
document.getElementById('next').addEventListener('click', () => {
    if (state.story !== MAIN) { readFile(state.story, reading.readTo(state.story) + 1); return; }
    if (gateAt(state.para + 1).length) { gateHidden = null; flashGate = true; render(); return; }
    setPara(state.para + 1);
});
document.getElementById('para').addEventListener('change', (e) => readShown(Number(e.target.value)));
document.getElementById('threshold').addEventListener('change', (e) => { state.threshold = Number(e.target.value); save(); render(); });
document.getElementById('only-moves').addEventListener('change', (e) => { state.onlyMoves = e.target.value === 'moves'; save(); render(); });
document.getElementById('view').addEventListener('change', (e) => { state.view = e.target.value; save(); render(); });
document.getElementById('depth').addEventListener('change', (e) => { state.depth = Number(e.target.value); save(); render(); });
document.getElementById('show-below').addEventListener('change', (e) => { state.showBelow = e.target.checked; save(); render(); });
document.getElementById('reset').addEventListener('click', () => {
    if (!confirm('Put every link and person back to uncertain (and each narrator to the story\'s default)?')) return;
    changeTrust((tr) => { tr.links = {}; tr.people = {}; });
});
// Moving a question or the line: by its grip with mouse or finger (the row follows the pointer; the list scrolls near its
// edges), or with the arrow keys. Nothing is kept until it is let go; a redrawing meanwhile abandons the move.
const scrollerOf = (el) => { for (let x = el; x; x = x.parentElement) { const o = getComputedStyle(x).overflowY; if ((o === 'auto' || o === 'scroll') && x.scrollHeight > x.clientHeight + 1) return x; } return null; };
document.addEventListener('pointerdown', (e) => {
    const grip = e.target.closest?.('#q-box .q-grip');
    if (!grip || e.button) return;
    e.preventDefault();
    const li = grip.closest('li'), ol = li.parentElement, before = [...ol.children].map((x) => x.dataset.qRow).join('\n');
    li.classList.add('dragging');
    let y = e.clientY;
    const place = () => {
        const next = [...ol.children].filter((x) => x !== li).find((x) => { const r = x.getBoundingClientRect(); return y < r.top + r.height / 2; });
        if (next !== li.nextElementSibling && (next ?? null) !== li) ol.insertBefore(li, next ?? null);
    };
    const box = scrollerOf(ol), edges = box?.getBoundingClientRect() ?? { top: 0, bottom: window.innerHeight };
    const scrolling = setInterval(() => {
        const by = y < edges.top + 40 ? -14 : y > edges.bottom - 40 ? 14 : 0;
        if (by && li.isConnected) { (box ?? window).scrollBy(0, by); place(); }
    }, 30);
    const move = (ev) => { y = ev.clientY; if (li.isConnected) place(); };
    const end = (ev) => {
        clearInterval(scrolling);
        document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end);
        if (!li.isConnected) return;
        li.classList.remove('dragging');
        const row = [...ol.children].map((x) => x.dataset.qRow);
        if (ev.type === 'pointercancel') { render(); return; }
        if (row.join('\n') === before) return;
        setOrder(row.includes(LINE) ? row : [...row, LINE]);
    };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
});
document.addEventListener('keydown', (e) => {
    const grip = e.target.closest?.('#q-box .q-grip');
    if (!grip || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const id = grip.closest('li').dataset.qRow, row = rowOrder(), i = row.indexOf(id), j = i + (e.key === 'ArrowUp' ? -1 : 1);
    if (i < 0 || j < 0 || j >= row.length || (!observations && row[j] === LINE)) return;
    [row[i], row[j]] = [row[j], row[i]];
    setOrder(row, id);
});

// Start over: the saved timeline (and the autoplay's) cleared; what is the page's, not the reading's, is kept.
document.getElementById('start-over').addEventListener('click', () => {
    if (!confirm('Start over from the first paragraph? Your trust, marks and reasoning on this device are cleared (layout, theme and the hint wait are kept). This cannot be undone.')) return;
    try {
        const keep = Object.fromEntries(['layout', 'panels', 'theme', 'hintWait', 'gate'].filter((k) => state[k] != null).map((k) => [k, state[k]]));
        localStorage.setItem(PLAYER_STORE, JSON.stringify(keep));
        localStorage.removeItem(AUTOPLAY_STORE);
    } catch { /* nothing saved to clear */ }
    location.reload();
});
document.addEventListener('toggle', (e) => {
    if (e.target.id === 'q-box') { state.qOpen = e.target.open; save(); }
    if (e.target.id === 'cards-box') { state.cardsOpen = e.target.open; save(); }
    if (e.target.id === 'mentions-box') state.mentionsOpen = e.target.open;   // for this visit only
}, true);
document.getElementById('undo').addEventListener('click', () => {
    if (!state.history.length) return;
    const h = JSON.parse(state.history.at(-1));
    if (h.trust) { state.trust = h.trust; state.marks = h.marks ?? {}; state.reasoning = h.reasoning ?? []; state.held = h.held ?? []; state.room = h.room ?? freshRoom(); state.links = h.links ?? []; } else state.trust = h;
    state.history = state.history.slice(0, -1);
    save(); render();
});
document.getElementById('layout').addEventListener('change', (e) => { state.layout = e.target.value; backs = []; save(); render(); });
document.getElementById('theme').addEventListener('change', (e) => { state.theme = e.target.value; save(); render(); });
// The settings menu closes on a click outside it.
document.addEventListener('click', (e) => { const st = document.getElementById('settings'); if (st.open && !e.target.closest('#settings')) st.open = false; });
document.addEventListener('click', (e) => {
    if (observations) {
        const li = e.target.closest('[data-link-entry]');
        if (li) { toggleLink(li.dataset.linkEntry, li.dataset.linkQ); return; }
        const lm = e.target.closest('[data-link-more]');
        if (lm) { linkAllFor = lm.dataset.linkMore; render(); return; }
        const st = e.target.closest('[data-linking]');
        if (st) { linkingQ = linkingQ === st.dataset.linking ? null : st.dataset.linking; if (linkingQ) reveal('timeline', panelFrom(e)); render(); return; }
        if (e.target.closest('[data-linking-done]')) { linkingQ = null; render(); return; }
    }
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
        if (f.reasoned.move === 'g' || f.reasoned.move === 'r') {
            roomChange((x) => (f.reasoned.move === 'g' ? { ...x, got: x.got.filter((id) => id !== f.reasoned.premises[0]) } : { ...x, route: [] }));
            return;
        }
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
    if (room) {
        const wa = e.target.closest('[data-way]');
        if (wa) {
            const [row, size, mark] = wa.dataset.way.split('|');
            const r = checkWayMark(waysIn(room.sealed, roomKnown, room.openings, roomCtx), row, size, mark);
            if (r.why) { roomNote = r.why; render(); return; }
            roomChange((x) => ({ ...x, ways: { ...x.ways, [`${row}|${size}`]: mark } }));
            return;
        }
        const wc = e.target.closest('[data-way-clear]');
        if (wc) { roomChange((x) => { const ways = { ...x.ways }; delete ways[wc.dataset.wayClear]; return { ...x, ways }; }); return; }
        const go = e.target.closest('[data-got]');
        if (go) { roomChange((x) => ({ ...x, got: [...x.got, go.dataset.got] })); return; }
        const ra = e.target.closest('[data-route-add]');
        if (ra) { roomChange((x) => ({ ...x, route: [...x.route, ra.dataset.routeAdd] })); return; }
        if (e.target.closest('[data-route-back]')) { roomChange((x) => ({ ...x, route: x.route.slice(0, -1) })); return; }
    }
    const qt = e.target.closest('[data-q-top]');
    if (qt) { setOrder([qt.dataset.qTop, ...rowOrder().filter((id) => id !== qt.dataset.qTop)]); return; }
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
    const tab = e.target.closest('[data-story]');
    if (tab) { state.story = tab.dataset.story; save(); render(); return; }
    const pa = e.target.closest('.para');
    if (pa && !e.target.closest('#story')) {
        // A paragraph number scrolls the story to that paragraph (in its own story's tab).
        const ref = parseRef(pa.dataset.ref ?? pa.textContent.match(/\d+/)?.[0]);
        if (!ref) return;
        if (delivered(ref.story)) state.story = ref.story;
        save();
        reveal('story', panelFrom(e));
        render();
        const p = document.querySelector(`#story p[data-sp="${CSS.escape(`${ref.story}:${ref.n}`)}"]`);
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
        const v = Number(e.target.value), k = e.target.dataset.key, base = Number(e.target.dataset.base ?? DEFAULT_LEVEL);
        changeTrust((tr) => { if (v === base) delete tr.links[k]; else tr.links[k] = v; });
    } else if (e.target.matches('.narration-trust')) {
        const v = Number(e.target.value), k = e.target.dataset.key, base = Number(e.target.dataset.base);
        changeTrust((tr) => { if (v === base) delete tr.links[k]; else tr.links[k] = v; });
    } else if (e.target.matches('.person-trust')) {
        const p = e.target.dataset.person, v = e.target.value;
        changeTrust((tr) => { if (v === '') delete tr.people[p]; else tr.people[p] = Number(v); });
    }
});
render();
// Hints (ui/world-hints.js): what they need of the page, the page's own functions.
// The pipeline's route check (scripts/route-check.mjs): every link "What is this for?" the page would offer now and
// the engine accepts, made one after another until nothing new fits (a link made can make another fit: a need of a
// step already linked), and the intentions "What would this need?" is offered on. It changes the reasoning: for a
// check's own page, never a player's. `ids`: hypothesis or fact ids whose links that do not fit are reported with the
// engine's reason (`misses`), for the fix of a missing route.
window.__routes = (ids = []) => {
    const made = [];
    const hyps = () => baseQuestions.filter(qListed).flatMap((q) => [presupposed(`pre:${q.id}`), ...q.possibilities.flatMap((p) => [hypAction(hypothesisKey(q.id, p.value)), hypIntention(hypothesisKey(q.id, p.value))])]).filter(Boolean);
    const sources = () => [...onTimeline(), ...hyps()].filter((f) => (list(f.act).length || f.goal) && f.of !== '?' && !f.reasoned && !(f.hyp && qById.get(f.hyp.q)?.end));
    for (let round = 0; round < 12; round++) {
        let added = false;
        for (const x of sources()) for (const t of intentionsOf(x.of, x.id)) {
            if (state.reasoning.some((m) => m.move === 'c' && m.of === x.id && m.for === t.id)) continue;
            const linked = linkedTo(t.id).map((l) => factOf(l.reasoned.premises[0])).filter((y) => y && list(y.act).length);
            const r = checkFit(x, t, linked, nameOf, { ...placeCtx, order: data.order, entries: onTimeline() });
            if (r.fits) { state.reasoning = [...state.reasoning, { move: 'c', of: x.id, for: t.id }]; made.push({ of: x.id, for: t.id, need: r.need ? phrase(r.need).replace(/<[^>]+>/g, '') : null }); added = true; }
        }
        if (!added) break;
        render();
    }
    const plans = sources().filter((f) => f.goal || f.plan).filter((f) => planOf(f)).map((f) => f.id);
    const misses = [];
    const want = new Set(ids);
    if (want.size) for (const x of sources()) for (const t of intentionsOf(x.of, x.id)) {
        if (!want.has(x.id) && !want.has(t.id)) continue;
        if (state.reasoning.some((m) => m.move === 'c' && m.of === x.id && m.for === t.id)) continue;
        const linked = linkedTo(t.id).map((l) => factOf(l.reasoned.premises[0])).filter((y) => y && list(y.act).length);
        const r = checkFit(x, t, linked, nameOf, { ...placeCtx, order: data.order, entries: onTimeline() });
        misses.push({ of: x.id, for: t.id, ofText: (list(x.act).length ? stepText(x) : phrase(x)).replace(/<[^>]+>/g, ''), forText: stepText(t).replace(/<[^>]+>/g, ''), why: r.why });
    }
    const present = [...new Set(ids)].map((id) => ({ id, on: !!sources().find((f) => f.id === id) }));
    // Stage 2: "It changed" on two typed states (the pairs the page offers), "What stopped it?" on a plan's intended
    // step (the known actions that stop it), "Compare" between two plans of one agent. None changes the reasoning.
    const on = onTimeline();
    const typed = on.filter((f) => isTypedState(f) && !f.reasoned);
    const changes = [];
    for (let i = 0; i < typed.length; i++) for (let j = i + 1; j < typed.length; j++) {
        const [x, y] = [typed[i], typed[j]];
        if (x.of !== y.of || x.attr !== y.attr || x.value === y.value) continue;
        const r = pointChange(data.order, x, y, on, nameOf);
        if (r.why) continue;
        changes.push({ a: x.id, b: y.id, text: (r.entry.aimChange ? r.entry.value : changeText(r.entry)).replace(/<[^>]+>/g, ''), q: questionOfChange(r.entry)?.id ?? null, aim: r.entry.aimChange ? r.entry.of : null });
    }
    const stopsFound = [], compares = [], accounts = [];
    for (const f of [...new Set([...sources().filter((g) => g.goal || g.plan), ...on.filter((g) => g.plan)])]) {
        const plan = planOf(f);
        if (!plan) continue;
        const r = checkPlan(plan, on, nameOf, { ...placeCtx, order: data.order, entries: on });
        const step = r.steps.map((x) => x.step).find((x) => x.intended);
        if (step) {
            const own = new Set(r.steps.map((x) => x.step.id));
            for (const x of knownActions().filter((y) => !own.has(y.id) && !(plan.steps ?? []).some((z) => z.id === y.id))) {
                const st = stops(x, step, nameOf, { ...placeCtx, order: data.order });
                if (st.stops) stopsFound.push({ on: f.id, by: x.id, key: `${f.id}|${x.id}`, text: `${stepText(x)} stops ${stepText(step)}`.replace(/<[^>]+>/g, '') });
            }
        }
        for (const x of on.filter((y) => y.id !== f.id && y.plan && placeCtx.same(y.plan.agent, plan.agent))) {
            const c = comparePlans(plan, { id: x.id, ...x.plan }, on, nameOf, { ...placeCtx, order: data.order, entries: on });
            compares.push({ on: f.id, with: x.id, key: `${f.id}|${x.id}`, open: [c.a.open.length, c.b.open.length], only: [c.a.only.length, c.b.only.length] });
        }
        // "Does it account for this?": the agent's other actions and intentions on the timeline (as accountHtml offers
        // them), each with its answer: a "no" (the plan leaves it unexplained) is as much the reader's point as a yes.
        const own = new Set(plan.steps.map((x) => x.id).filter(Boolean));
        for (const x of on.filter((y) => y.id !== f.id && !own.has(y.id) && !y.plan && (list(y.act).length || y.goal) && !y.reasoned && placeCtx.same(y.of, plan.agent))) {
            const r = accountsFor(plan, x, nameOf, { ...placeCtx, order: data.order });
            accounts.push({ on: f.id, of: x.id, key: `${f.id}|${x.id}`, fits: r.fits === true ? 'yes' : r.fits === 'if' ? 'only if' : 'no', text: stepText(x).replace(/<[^>]+>/g, '') });
        }
    }
    return { para: state.para, links: made, plans, misses, present, changes, stops: stopsFound, compares, accounts };
};
const hintApi = {
    para: () => state.para, last: LAST, wait: () => state.hintWait,
    // The files: how far each is read, whether it has come, and its title; and whether references are all read.
    files: () => files.map((f) => ({ id: f.id, title: f.title, delivered: delivered(f.id), read: reading.readTo(f.id), last: lastOf(f.id) })),
    seenAll: (at) => reading.seenAll(at), readTo: (id) => reading.readTo(id),
    // The gate holds the reader here: reading on is not possible yet.
    gateHolds: () => state.para < LAST && gateAt(state.para + 1).length > 0,
    question: (id) => (qById.has(id) ? { ...qById.get(id), label: qLabel(qById.get(id)) } : undefined), qListed: (id) => qListed(qById.get(id)), isRight: (id, pick) => isRight(qById.get(id), pick),
    name: (id) => (entityById.has(id) ? nameOf(id) : null),
    // A link of a chain in words: a telling as the timeline says it, a speech as who said it to whom.
    linkName: (key) => {
        const f = factById.get(key);
        if (f) return `“${phrase(f).replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim()}”`;
        const m = key.match(/^(said|member):([^>]+)>(.+)$/);
        return m ? (m[1] === 'said' ? `what ${nameOf(m[2])} says to ${nameOf(m[3])}` : `${nameOf(m[2])} as one of ${nameOf(m[3])}`) : key;
    },
    // What distrusting a link or a person keeps off the timeline now (told so far, and on it again with that distrust
    // lifted): `{n, harmless}`, harmless when all of it is false. A distrust that takes off only what is false is a
    // valid choice, whichever link of the false chain it is.
    distrustEffect: ({ link, person }, lifted = true) => {
        const other = structuredClone(state.trust);
        if (lifted) { if (link) delete other.links[link]; else delete other.people[person]; }
        else if (link) other.links[link] = 0; else other.people[person] = 0;
        const a = lifted ? state.trust : other, b = lifted ? other : state.trust;   // a: with the distrust, b: without
        const hit = [];
        for (const f of data.facts) {
            if (f.attr === 'tells' || !seen(givenAt(f))) continue;
            const cs = chainsOf(f);
            if (cs.length && levelOf(cs, a) < state.threshold && levelOf(cs, b) >= state.threshold) hit.push(f.truth === false);
            if (CLAIM_ATTRS.has(f.attr) && list(f.asserts).length) {
                const cc = claimChains(f.id);
                if (levelOf(cc, a) < state.threshold && levelOf(cc, b) >= state.threshold) hit.push(...allAssertions.filter((x) => x.claim === f.id).map((x) => x.truth === false));
            }
        }
        return { n: hit.length, harmless: hit.every(Boolean) };
    },
    // A statement is false when its fact is, or (a claim) when anything it asserts is.
    statementFalse: (id) => { const f = factById.get(id); return !!f && (CLAIM_ATTRS.has(f.attr) ? allAssertions.some((x) => x.claim === id && x.truth === false) : f.truth === false); },
    setTrust: ({ link, person }, level) => changeTrust((tr) => { if (link) { if (level === DEFAULT_LEVEL) delete tr.links[link]; else tr.links[link] = level; } else delete tr.people[person]; }),
    view: () => ({ sel: state.sel, panels: [...state.panels], backs: [...backs], note: state.note }),
    restore: (v) => { state.sel = v.sel; state.panels = v.panels; backs = v.backs; state.note = v.note; save(); render(); },
};
document.getElementById('hint-wait').value = String(state.hintWait);
document.getElementById('hint-wait').addEventListener('change', (e) => { state.hintWait = Number(e.target.value); save(); });
document.getElementById('gate-rule').value = strictGate() ? 'strict' : 'any';
document.getElementById('gate-rule').addEventListener('change', (e) => { state.gate = e.target.value; save(); render(); });
if (AUTOPLAY === null) import('./world-hints.js').then((m) => m.makeHints({ store: STORE, api: hintApi }));
else document.getElementById('hint').hidden = true;
if (AUTOPLAY !== null) { save(); import('./world-autoplay.js').then((m) => m.start({ store: STORE, fast: AUTOPLAY === 'fast' })); }
document.getElementById('autoplay-open')?.addEventListener('click', () => {
    if (confirm('Watch a careful reader fill in the timeline, from the first paragraph to the last? Your own timeline is kept aside and comes back when you stop.')) location.href = pageUrl('autoplay');
});
