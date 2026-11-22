// The timeline (index.html; for Silver Blaze, "Watson's timeline"): the world model shown as it is, an ordered list of
// events, filled in as the story is read. Every fact reaches the reader through a narrator (what a first-person
// narrator observes is certain by default); the rest comes through a chain of tellings, each link trusted as far as
// the player says (engine/world.js). The player is the reader: the marks and moves are the reader's own. Facts trusted as likely or confirmed count; what is uncertain is shown in grey and counts for nothing; the
// contradictions among them are listed. Nothing shown runs ahead of the paragraph read to.

import { READER, narrationLink, provenance, timeOrder, assertions, contradictions, agreements, independent, alibis, places, givenAt, LEVELS, DEFAULT_LEVEL, RULED_OUT, UNLIKELY, UNCERTAIN, LIKELY_LEVEL, CONFIRMED, counts, linkKey, levelOf, hopLevel, resolvingLinks, CLAIM_ATTRS, markAssertions, hypothesisChain, hypothesisKey, HYPOTHESIS, DERIVED, EVERY, typedAct, answerKinds, entityKinds, isRight } from '../engine/world.js';
import { coverOf, overlaps } from '../engine/world.js';
import { Story } from '../engine/story.js';
import { MAIN, Reading, parseRef, refKey, refList } from '../engine/refs.js';
import { shownNames, timeLabelAt, questionLabelAt } from '../engine/shown.js';
import { ACTIONS, setCaseActions, STATES, OPEN_STATES, REASONING, pointChange, pointImplications, requirementStatus, reasonedEntries, agentNeeds, actNeeds, checkFit, checkPlan, accountsFor, comparePlans, impliedSteps, stops, meets, orderSteps, pointGap, gapsOf } from '../engine/actions.js';

import { waysIn, checkWayMark, pointPassage, foundBy, linksOf, checkRoute } from '../engine/arrangement.js';
import { fill, described, onPage, bears, waits } from '../engine/observations.js';
import { derive, verdict, ways, premiseIds, derivedAssertions, impliedStates, strength, supportIds, withTable, suspectGrid, LIKELY } from '../engine/implications.js';
import { caseLogic, deliveryMode, endingOf, placement, newSeed, isOpen } from '../engine/delivery.js';
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
// What the statements shown imply when put together (world/implications.json; engine/implications.js): optional,
// an experiment. Used when Settings has the answers marked from the evidence.
const writtenRules = await get(`${W}/implications.json`).then((x) => x.implications ?? []).catch(() => []);
let implications = writtenRules;   // with the rules from the answers' typed forms, once the world is read (below)
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
if (writtenRules.length && observations) implications = withTable(writtenRules, data, observations);
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
    if (!p?.goal || q.entry?.attr !== 'intends' || (!anyMark && markOf(q, p.value) !== 'circled') || !possShown(q, p.value)) return null;
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
const state = { para: 1, log: null, story: MAIN, hideOut: false, greyClash: 'on', trust: { links: {}, people: {} }, marks: {}, reasoning: [], history: [], view: 'list', depth: 2, sel: null, qOpen: true, cardsOpen: false, hintWait: 30, note: null, layout: 'three', panels: ['story', 'timeline'], theme: 'system', onlyMoves: false, held: [], room: null, links: [], qOrder: null, solved: {}, tried: {}, linkRule: 'checked', leftList: 'on', leftOpen: false, answerRule: 'evidence' };
if (AUTOPLAY === null) try { Object.assign(state, JSON.parse(localStorage.getItem(STORE) ?? '{}')); } catch { /* a fresh start */ }
// Saves from before the reader model (2026-11-06) capped Watson's hypothesis and reasoning under other ids.
for (const [was, now] of [['watsons_hypothesis', HYPOTHESIS], ['watsons_reasoning', REASONING]]) if (state.trust?.people?.[was] != null) { state.trust.people[now] ??= state.trust.people[was]; delete state.trust.people[was]; }
else try { const own = JSON.parse(localStorage.getItem(PLAYER_STORE) ?? '{}'); for (const k of ['layout', 'panels', 'theme']) if (own[k] != null) state[k] = own[k]; } catch { /* the defaults */ }
state.sel = null;
state.note = null;
if (!state.solved || typeof state.solved !== 'object') state.solved = {};
if (!state.tried || typeof state.tried !== 'object') state.tried = {};
// What has been read, in each story and in what order (engine/refs.js); `para` is the main story's, kept for the
// checks and for saves from before the files.
let reading = Reading.fromSave(state, lengths);
const posOf = (x) => reading.pos(x);
const seen = (x) => x != null && reading.seen(x);
/** Compare two references by the order of reading (what is unread after what is read). */
const byRead = (a, b) => { const x = posOf(a), y = posOf(b); return x === y ? 0 : x < y ? -1 : 1; };
const syncReading = () => { state.para = reading.readTo(MAIN); state.log = [...reading.log]; };
syncReading();
// --- Delivery (docs/authored-stories.md, "The delivery mechanism"): whether a paper has come. By default a file comes
// at its `delivered` paragraph of the main story (or from the start). With `delivery.mode: earned` (case.json) a paper
// comes by a source: held from the start, or brought by solving the question it is placed on. Playing alone, the
// placement is drawn from a seed by the fill of engine/delivery.js, from the logic of the case's own data; the seed is
// kept in the save, shown in Settings, and can be given in the address (`?seed=`) to replay. Connected to an
// Archipelago (later), the same two questions are the bridge's to answer (its `mystery:state`: the papers held, the
// questions checked), and `source` is replaced by one that asks it.
const EARNED = deliveryMode(header) === 'earned';
const seedParam = Number(new URLSearchParams(location.search).get('seed')) || null;
if (EARNED) {
    const progress = (state.log?.length ?? 0) > 1 || state.links.length || Object.keys(state.marks).length;
    if (seedParam && state.seed && seedParam !== state.seed && progress && AUTOPLAY === null && !confirm(`Start a new game with seed ${seedParam}? Your timeline on this device is cleared.`)) { /* keep the game in hand */ }
    else if (seedParam && seedParam !== state.seed) {
        const keep = Object.fromEntries(['layout', 'panels', 'theme', 'hintWait', 'gate', 'linkRule', 'leftList', 'answerRule', 'hideOut', 'greyClash'].filter((k) => state[k] != null).map((k) => [k, state[k]]));
        for (const k of Object.keys(state)) if (!(k in keep)) delete state[k];
        Object.assign(state, { para: 1, log: null, story: MAIN, hideOut: false, greyClash: 'on', trust: { links: {}, people: {} }, marks: {}, reasoning: [], history: [], view: 'list', depth: 2, sel: null, qOpen: true, cardsOpen: false, hintWait: 30, note: null, layout: 'three', panels: ['story', 'timeline'], theme: 'system', onlyMoves: false, held: [], room: null, links: [], qOrder: null, solved: {}, tried: {} }, keep, { seed: seedParam });
        reading = Reading.fromSave(state, lengths);
        syncReading();
    }
    if (!state.seed) state.seed = newSeed();
}
const logic = EARNED ? caseLogic({ questions: questions.questions, observations: observations ?? [], facts: data.facts, files, delivery: header.delivery }) : null;
const place = EARNED ? placement(logic, state.seed) ?? new Map() : new Map();
const source = {
    /** The papers held now. */
    held: () => new Set([...(logic?.start ?? []), ...Object.keys(state.solved).map((q) => place.get(q)).filter(Boolean)]),
    /** The paper a solved question brought (null: nothing new). */
    brought: (q) => (state.solved[q] ? place.get(q) ?? null : null),
};
// A reply (a file with `reply: <question>`) comes when its question is solved, whatever brings the papers.
const replyOf = new Map(files.filter((f) => f.reply != null).map((f) => [f.reply, f]));
const delivered = (id) => id === MAIN || (fileById.has(id) && (fileById.get(id).reply != null ? !!state.solved?.[fileById.get(id).reply] : EARNED ? source.held().has(id) : fileById.get(id).delivered == null || seen(fileById.get(id).delivered)));
/** Can this question be solved now (earned papers): not solved, its papers come, what it rests on solved. Otherwise always. */
const openNow = (id) => { const lq = logic?.questions.find((x) => x.id === id); return !lq || isOpen(lq, source.held(), new Set(Object.keys(state.solved))); };
// For the autoplay and the checks: the delivery as the page has it.
// While a move is only being tried (and will be taken back), nothing is solved: `window.__trying(true)` … `(false)`.
window.__trying = (on) => { trying = !!on; };
window.__delivery = { earned: EARNED, seed: state.seed ?? null, open: openNow, held: () => [...source.held()], solved: () => Object.keys(state.solved) };
/** How a paper came: held from the start, or brought by solving a question (its id). */
const cameBy = (id) => (fileById.get(id)?.reply != null ? fileById.get(id).reply : logic?.start.includes(id) ? 'start' : Object.keys(state.solved).find((q) => source.brought(q) === id) ?? null);
if (!delivered(state.story)) state.story = MAIN;
/** A paragraph's reference as the player sees it: "¶3" in the main story, "Rudd ¶2" in a file. */
const paraTag = (x) => { const p = parseRef(x); if (!p) return '¶?'; return p.story === MAIN ? `¶${p.n}` : `${fileById.get(p.story)?.short ?? p.story} ¶${p.n}`; };
const paraSpan = (x) => `<span class="para" data-ref="${esc(refKey(x) ?? '')}">${esc(paraTag(x))}</span>`;
if (!Array.isArray(state.held)) state.held = [];
const freshRoom = () => ({ ways: {}, got: [], route: [] });
if (!Array.isArray(state.links)) state.links = [];
state.room = { ...freshRoom(), ...(state.room ?? {}) };
const save = () => { try { localStorage.setItem(STORE, JSON.stringify({ para: state.para, log: state.log, story: state.story, hideOut: state.hideOut, greyClash: state.greyClash, trust: state.trust, marks: state.marks, reasoning: state.reasoning, room: state.room, links: state.links, qOrder: state.qOrder, history: state.history, view: state.view, depth: state.depth, qOpen: state.qOpen, cardsOpen: state.cardsOpen, sourcesOpen: state.sourcesOpen, hintWait: state.hintWait, gate: state.gate, layout: state.layout, panels: state.panels, theme: state.theme, onlyMoves: state.onlyMoves, held: state.held, solved: state.solved, seed: state.seed, tried: state.tried, linkRule: state.linkRule, leftList: state.leftList, leftOpen: state.leftOpen, answerRule: answerParam ?? state.answerRule })); } catch { /* not saved */ } };
// `?answers=evidence` (or `hand`) sets how answers are marked, for the checks and the blind solver.
// Not saved: the address says it for this visit only.
let answerParam = null;
{ const a = new URLSearchParams(location.search).get('answers'); if (a === 'evidence' || a === 'hand') { answerParam = state.answerRule; state.answerRule = a; } }
// Every change of trust or of a mark can be undone: the state before it is kept (the last 50).
const remember = () => { state.history = [...state.history, JSON.stringify({ trust: state.trust, marks: state.marks, reasoning: state.reasoning, held: state.held, room: state.room, links: state.links })].slice(-50); };
const changeTrust = (fn) => { remember(); fn(state.trust); save(); render(); };
const MARK_NEXT = { undefined: 'circled', circled: 'crossed', crossed: undefined };
function cycleMark(qid, pick) {
    if (autoQ(qid)) { state.note = 'The answers to this question are marked from the evidence you link: one is crossed out when what you have shown rules it out, and circled when it follows.'; render(); return; }
    // A solved question keeps its circle; another of its answers only goes between crossed out and uncertain.
    const sv = state.solved[qid];
    if (sv && pick === sv.pick) return;
    remember();
    const m = { ...(state.marks[qid] ?? {}) };
    const next = sv ? (m[pick] === 'crossed' ? undefined : 'crossed') : MARK_NEXT[m[pick]];
    if (next) m[pick] = next; else delete m[pick];
    state.marks = { ...state.marks, [qid]: m };
    save(); render();
}

// --- Words.
const nameOf = (id) => (id === '?' ? 'someone' : id === EVERY ? 'everyone' : id === HYPOTHESIS ? 'your hypothesis' : id === REASONING ? 'your reasoning' : id === READER ? 'you' : (entityById.has(id) ? names().nameAt(id, reading.count) : null) ?? narratorName(id) ?? id);
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
const isSolved = (id) => !!state.solved[id];
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
    const roles = [x.thing && ent(x.thing), x.to && `${x.act === 'give' ? 'to ' : ''}${ent(x.to)}`, x.item && (list(x.act).includes('take') ? val(x.item) : list(x.act).includes('cut_self') ? `by ${val(x.item)}` : `with ${val(x.item)}`), x.about && (entityById.has(x.about) ? `(${esc(nameOf(x.about))})` : `for ${esc(x.about)}`), x.via && `through ${ent(x.via)}`].filter(Boolean).join(' ');
    const note = x.intended ? ' <span class="small muted">(intended)</span>' : x.hyp ? ' <span class="small muted">(your hypothesis)</span>' : '';
    return `${x.of === '?' ? 'Someone' : ent(x.of)}: ${list(x.act).map((t) => ACTIONS[t].label).join(' and ')} ${roles}${note}`;
}
/** A fact as a short sentence. */
function phrase(f) {
    if (f.attr === 'opening') { const by = foundBy(f, roomKnown, room.openings); return `A way between ${ent(f.sides[0])} and ${ent(f.sides[1])}${by ? `: ${ent(by)}` : ', not yet found'}`; }
    if (f.attr === 'route') return `A route: ${f.value.map(ent).join(' → ')}`;
    // A statement about everyone: "Nobody but … at the house" for the denial, "Everyone but …" otherwise.
    if (f.of === EVERY && !f.who) return phrase({ ...f, neg: false, who: `${f.neg ? 'Nobody' : 'Everyone'}${list(f.but).length ? ` but ${list(f.but).map(ent).join(f.neg ? ' or ' : ' and ')}` : ''}` });
    const E = f.who ?? (f.of === '?' ? 'Someone' : ent(f.of));
    // Told early in brief (`given_at`): until its own paragraph, only the brief words that told it.
    if (f.given_quote && seen(f.given_at) && !seen(f.para)) return `${E}: <span class="said">“${esc(f.given_quote)}”</span>`;
    if (f.reasoned && f.attr === 'action' && f.act) return `${E}: ${f.neg ? '<b>not</b> ' : ''}${list(f.act).map((t) => ACTIONS[t].label).join(' and ')} ${ent(f.thing ?? f.item ?? f.where)}`;
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
        case 'knows': return `${E} ${f.neg ? '<b>does not</b> know' : 'knows'} ${v}`;
        case 'lit': return `${E} has ${v}${f.hyp === true ? ' <span class="small muted">(your hypothesis)</span>' : ''}`;
        case 'intends': return f.aimChange ? `${E} changes his mind: making for ${ent(f.aimChange.from)}, then for ${ent(f.aimChange.to)}` : `${E} means ${v}`;
        case 'observes': {
            const seen = list(f.value).map((x) => factById.get(x)).filter((o) => o && visible(o));
            return seen.length ? `${E} sees: ${seen.map(phrase).join('; ')}` : `${E} notices something`;
        }
        case 'contents': return `${E} ${f.neg ? 'does <b>not</b> hold' : 'holds'} ${v}${d}`;
        case 'reputed': return `${E}, by repute: ${v}`;
        case 'rule': return `${E}, as a rule: ${v}`;
        case 'weekday': return `It is ${v}`;
        case 'hour': return `${v}`;
        case 'tells': {
            const accts = list(f.value).map((a) => esc(accountById.has(a) ? questionLabelAt(accountById.get(a), reading.count, posOf) : a)).join(', ');
            return `${E} tells ${ent(f.to)} (${esc(f.how)}${f.partial ? ', in part' : ''}): ${accts}`;
        }
        default: return f.of === 'weather' ? `The weather: ${v}` : `${E}: ${f.neg ? '<b>no</b> ' : ''}${v}${d}`;
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
/** A fact's level: a telling as far as the narration is trusted (to a narrator, who witnesses it: that narrator's; any other: the best narration's). That it was said stands; what it says is trusted apart. */
function levelOfFact(f) {
    if (f.hyp) return markLevel(f.hyp.q, f.hyp.pick);
    if (f.reasoned) {
        // The reader's reasoning: as trusted as its weakest premise, and no more than the player trusts it.
        const ls = f.reasoned.premises.map((id) => { const p = factOf(id); return p ? levelOfFact(p) : null; });
        if (ls.some((l) => l == null)) return null;
        const cap = state.trust.people[REASONING];
        return Math.min(...ls, cap ?? CONFIRMED);
    }
    if (f.attr === 'tells') return narratorIds.has(f.to) ? narrationLevel(f.to) : Math.max(...data.narrators.map((n) => narrationLevel(n.id)));
    return levelOf(chainsOf(f), state.trust);
}
/** The chains of an assertion: a claim's own assertions travel as the claim does, with the claimant's word ahead. */
const chainsOfAssertion = (x) => (x.mark ? [x.from ? hypothesisChain(...x.from.slice(4).split('=')) : hypothesisChain(x.q, x.pick)] : x.claim && x.claim === x.fact ? claimChains(x.fact) : chainsOf(factOf(x.fact)));
/** How far the player trusts a narrator's narration (by default the case's trust, certain unless it says otherwise). */
const narrationLevel = (id) => { const n = data.narrators.find((x) => x.id === id); return n ? state.trust.links[linkKey(narrationLink(n))] ?? narrationLink(n).base : DEFAULT_LEVEL; };
/** Told by the paragraph read to, and modelled (a chain reaches the reader, or a telling). */
const visible = (f) => seen(givenAt(f)) && levelOfFact(f) != null;
/** Counts as evidence: trusted as likely or confirmed. */
const accepted = (f) => counts(levelOfFact(f));
/** Drawn: everything told, but what is ruled out when the setting hides it. */
const drawn = (f) => !(state.hideOut && levelOfFact(f) === RULED_OUT);

/**
 * The assertions told so far and held at `floor` or above, with the player's marks and what follows: those that
 * count (likely or confirmed), or with what is still uncertain too, for the grey clashes. `sideLevel`: each one's
 * level by its id, what is only likely by its rule (`likely`) at likely at most.
 */
let sideLevel = new Map();
function acceptedAssertions(floor = LIKELY_LEVEL) {
    const lv = new Map();
    const keep = (x, l) => { if (l == null || l < floor) return false; lv.set(x.id, x.likely ? Math.min(l, LIKELY_LEVEL) : l); return true; };
    // An implied answer is as trusted as the circle that implies it.
    const lvlOf = (x) => { const m = x.from && /^hyp:(.+)=(.+)$/.exec(x.from); return m ? markLevel(m[1], m[2]) : markLevel(x.q, x.pick); };
    // What follows from the evidence stands in place of the marks the page made from it, resting on its premises.
    const follows = followsAssertions().filter((x) => keep(x, derivedLevel(x)));
    const got = new Set(follows.map((x) => x.id));
    const marks = markAssertions(data, state.marks, possShown).filter((x) => !got.has(x.id) && keep(x, lvlOf(x)));
    const mine = reasoned.filter((f) => visible(f))
        .map((f) => ({ id: f.id, fact: f.id, kind: 'state', of: f.of, attr: f.attr, value: f.value, neg: !!f.neg, time: f.time, truth: null, para: f.given_at, ...(f.event ? { event: f.event } : {}), ...(f.of === EVERY ? { every: f.every, but: f.but } : {}), ...typedAct(f), ...(f.likely ? { likely: true } : {}) }))
        .filter((x) => keep(x, levelOfFact(reasonedById.get(x.id))));
    const told = allAssertions.filter((x) => {
        const f = factById.get(x.fact);
        return visible(f) && keep(x, x.claim && x.claim === x.fact ? levelOf(claimChains(x.claim), state.trust) : levelOfFact(f));
    });
    sideLevel = lv;
    return [...follows, ...marks, ...mine, ...told];
}
/** A clash is as strong as its weakest side: a contradiction (all confirmed), unlikely together (a side likely), or undecided (a side uncertain). */
const clashLevel = (c) => Math.min(...[c.a, c.b, c.via].filter(Boolean).map((x) => sideLevel.get(x.id) ?? CONFIRMED));

/**
 * What the circled answers need of where their agent was: a circle on a question whose entry is a typed action is
 * that one's act, and an act that needs its agent at a door or at a place puts them there at some moment of its
 * window. Set against where the timeline has them (`alibis`).
 */
function presenceNeeds(accepted) {
    const out = [];
    for (const mark of accepted) {
        if (mark.mark !== 'circled') continue;
        // Where its agent must be, any other state it needs (knowing a knot), and what it leaves behind.
        out.push(...actNeeds(mark, hypAction(mark.id), { ...placeCtx, order: data.order }, nameOf, (r) => phrase(r).replace(/<[^>]+>/g, '')));
    }
    return out;
}

// --- Rendering.
const levelName = (l) => (l == null ? 'unmodelled' : LEVELS[l]);
const levelCls = (l) => levelName(l).replace(' ', '-');
const dot = (l) => `<span class="lvl lvl-${levelCls(l)}" title="${levelName(l)}"></span>`;
/** What the player does to reach a level, in the words of the controls. */
const LEVEL_VERB = ['Distrust as ruled out', 'Distrust as unlikely', 'Leave as uncertain', 'Trust as likely', 'Trust as confirmed'];
/**
 * Confirmed is earned, not set (the user's ruling of 2026-11-21): what a narrator saw is confirmed from the start; a
 * statement becomes so when a question solved rested on it, or when the player takes the offer where two independent
 * sources agree. Those statements are kept (`trust.earned`), so that one lowered since can be put back; no other
 * control offers the level.
 */
const earned = (k) => (state.trust.earned ?? []).includes(k);
const earn = (tr, k) => { tr.earned = [...new Set([...(tr.earned ?? []), k])]; };
const mayConfirm = (k, base = null) => (base != null && Number(base) === CONFIRMED) || earned(k);
/** A trust control's choices, the highest first (`top`: confirmed among them); `unset`: the words for "not set" (a link with a level to start from has none). */
const levelOpts = (cur, unset = null, top = false) => `${unset == null ? '' : `<option value=""${cur == null ? ' selected' : ''}>${esc(unset)}</option>`}${[4, 3, 2, 1, 0].filter((i) => i !== CONFIRMED || top || cur === CONFIRMED).map((i) => `<option value="${i}"${cur === i ? ' selected' : ''}>${LEVELS[i]}</option>`).join('')}`;
/** A statement's own trust key, if it has one (what a narrator saw has none: it is as the narration). */
const stmtKeyOf = (f) => { const l = (CLAIM_ATTRS.has(f.attr) && list(f.asserts).length ? claimChains(f.id) : chainsOf(f)).flatMap((c) => c.links).find((x) => x.stmt); return l ? linkKey(l) : null; };
/** Buttons that set one statement's own level, where it has one. */
const quickTrust = (f, levels) => { const k = f && !f.reasoned && !f.hyp ? stmtKeyOf(f) : null; return k ? levels.filter((i) => i !== CONFIRMED || earned(k)).map((i) => `<button type="button" class="quiet small" data-set-trust="${esc(k)}" data-level="${i}">${LEVEL_VERB[i]}</button>`).join(' ') : ''; };
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
const canReason = (f) => ((STATES[f.attr] || OPEN_STATES.has(f.attr)) && f.value != null && !f.neg) || (list(f.act).length > 0 && !f.neg) || !!f.goal || !!f.plan || !!f.series;
const REASON_MARK = '<span class="can-reason" title="You can reason from this: open it for the moves (what it needs, what changed, what it is for, what a plan would need, what is missing)">⚙</span>';
function eventRow(f, clashing, tag = 'li') {
    const lvl = levelOfFact(f);
    const cls = ['event', `t-${levelCls(lvl)}`, linkingQ && (isLinked(f.id, linkingQ) || isTried(f.id, linkingQ)) ? 'link-done' : '', f.reasoned ? 'reasoned' : '', isTimeEvent(f) ? 'time-event' : '', clashing.has(f.id) ? 'clash' : '', state.sel === f.id ? 'sel' : ''].filter(Boolean).join(' ');
    return `<${tag} class="${cls}" data-fact="${esc(f.id)}"${f.reasoned ? ' title="Your reasoning"' : ''}>${dot(lvl)}<span class="ph">${phrase(f)}${whenNote(f.time ?? {})}${f.likely ? ' <span class="small muted">(likely)</span>' : ''}</span>${canReason(f) ? ` ${REASON_MARK}` : ''} ${paraSpan(givenAt(f))}${linkingQ ? ` ${linkButton('link-row', f.id, linkingQ, '+ relevant', 'linked ✓', 'tried ✗')}` : ''}${assertsHtml(f)}</${tag}>`;
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
/**
 * While linking: on the timeline's line of a question that the question being linked to rests on, and on its circled
 * answer, what that question is to it: evidence already, by being solved, or evidence once it is solved. A circled
 * answer looks like an entry and cannot be linked; this says why there is nothing to link.
 */
const restTag = (q) => {
    if (!linkingQ || !observations || !observations.some((o) => o.q === linkingQ && o.from.some((f) => f?.solved === q.id))) return '';
    return ` <span class="rest-tag${isSolved(q.id) ? ' on' : ''}" data-rests="${esc(q.id)}" title="The question you are linking to rests on this one: nothing to link here">${isSolved(q.id) ? 'counted ✓ (solved)' : 'counts once this question is solved'}</span>`;
};
function questionRows(q, clashing, tag = 'li') {
    const sel = state.sel === `q:${q.id}` ? ' sel' : '';
    const crossed = shownPossibilities(q).filter((p) => markOf(q, p.value) === 'crossed').map((p) => pickText(q, p.value));
    const head = `<${tag} class="question${sel}${clashing.has(`q:${q.id}`) ? ' clash' : ''}" data-q="${esc(q.id)}"><span class="q-mark">?</span> ${esc(qLabel(q))} ${paraSpan(q.raised ?? q.answer_given_at)}${crossed.length ? ` <span class="small muted">crossed out: <s>${crossed.join('</s>, <s>')}</s></span>` : ''}${givenAway(q) ? ` <span class="small">answered ${paraTag(q.answer_given_at)}: <b>${answerText(q)}</b></span>` : ''}${restTag(q)}</${tag}>`;
    const circles = shownPossibilities(q).filter((p) => markOf(q, p.value) === 'circled').map((p) => {
        const lvl = markLevel(q, p.value);
        if (lvl === RULED_OUT && state.hideOut) return '';
        const cls = ['event', 'hyp', `t-${levelCls(lvl)}`, clashing.has(hypothesisKey(q.id, p.value)) ? 'clash' : '', givenAway(q) ? (isRight(q, p.value) ? 'right' : 'wrong') : ''].filter(Boolean).join(' ');
        const pp = q.possibilities.find((x) => x.value === p.value);
        const can = pp?.goal || pp?.need || q.presupposes || hypAction(hypothesisKey(q.id, p.value));
        return `<${tag} class="${cls}" data-q="${esc(q.id)}" title="Your hypothesis">${dot(lvl)}<span class="ph">${hypPhrase(q, p.value)}</span>${can ? ` ${REASON_MARK}` : ''}${restTag(q)}</${tag}>`;
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
    const shown = allFacts().filter((f) => visible(f) && filter(f) && drawn(f));
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
    const shown = allFacts().filter((f) => visible(f) && movesOnly(f) && drawn(f));
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
/** A typed answer on one side: what the circle asserts, or what the cross denies. */
const typedMarkText = (x) => `${x.denied ? 'You crossed out' : 'Your hypothesis'}: ${phrase({ of: x.of, attr: x.attr, value: x.value, neg: x.denied ? !x.neg : x.neg, id: '' })}`;
function clashSide(x) {
    if (x.by === DERIVED) return `<a class="link" data-q="${esc(x.q)}">${followText(x)}</a>${x.kind === 'state' ? sideTime(x.time) : ''}${x.needs ? ` <span class="small muted">(${esc(x.needs)})</span>` : ''}`;
    if (x.mark) return `<a class="link" data-q="${esc(x.q)}">${x.kind === 'state' ? typedMarkText(x) + sideTime(x.time) : markText(x)}</a>${x.needs ? ` <span class="small muted">(${esc(x.needs)})</span>` : ''}`;
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
    const f = !c.a.attr ? factOf(c.a.fact) : c.a;
    return `${ent(f.of)}: ${f.attr === 'location' ? 'in two places at once?' : STATES[f.attr] ? 'two states at once?' : f.attr === 'identity' ? 'two identities?' : `${f.attr === 'knows' ? 'knows ' : ''}${entityById.has(f.value) ? nameOf(f.value) : esc(f.value)}, and not?`}`;
}

const clashKey = (c) => `clash:${c.a.id}|${c.b.id}${c.via ? `|${c.via.id}` : ''}`;
let current = [];      // the contradictions open (all sides confirmed)
let currentAll = [];   // with those unlikely together and those undecided, for the trace

// --- The layout: three columns side by side, or panels with tabs (two, or one; a phone always one). The page's parts
// (index.html) are moved where the layout puts them, the rest parked; each is drawn by render() wherever it is.
const PARTS = [['story', 'Story'], ['timeline', 'Timeline'], ['questions', 'Questions'], ['clashes', 'Contradictions'], ['sources', 'Sources'], ['cards', 'Cards'], ['detail', 'Detail']];
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
        for (const id of [...(room ? ['room'] : []), 'clashes', 'questions', 'sources', 'cards', 'timeline']) put(partEl(id), three.children[1]);
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
let observed = { filled: [], partial: [], notes: [] };
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
// Checked links (Settings, the default): a link is judged as it is made. One that is evidence for its question (alone
// or with something else: engine `bears`) is kept and cannot be taken back; any other is refused, and the pair is
// marked as tried for good (`state.tried`: {question: [entries]}; Undo does not clear it). A route is not marked: it
// is the player's own, and changes as it is built. Off: every link is kept, as evidence or as a note, and can be removed.
const checkedLinks = () => state.linkRule !== 'free';
// A statement that is evidence once disbelieved (`{doubted: telling}`) is evidence through what it carries too: a
// link to any fact it told (false or true: to keep only the false would say which is the lie) is kept, and waits.
const carriedBy = (t) => {
    const f = factById.get(t);
    if (!f || f.attr !== 'tells') return [];
    const told = new Set(list(f.value));
    return data.accounts.filter((a) => told.has(a.id) || [...prov.ancestors(a.id)].some((p) => told.has(p))).flatMap((a) => list(a.facts));
};
/**
 * A statement's detail: that it was said is certain, and what it says is trusted apart from that, on each entry it
 * carried. Those entries are listed, each opening its own detail, where its trust is set (a blind solver looked for
 * the way to doubt a statement on the statement, found "Trusted: certain" and no control, and reported a dead end
 * thirteen times). On every statement alike, so it says nothing of which is a lie.
 */
function toldHtml(f) {
    const told = carriedBy(f.id).map((id) => factById.get(id)).filter((x) => x && visible(x));
    return `<p class="small muted">A telling: how an account passed from one person to another.</p>
      <p class="small told-note">That this was said stands. What it says is trusted separately: set all of it here, or open an entry and set that one.</p>
      <p class="small stmt-line">${linkStep({ from: f.of, to: f.to, how: f.how, telling: f.id }, 'Everything it says:', 'How far you trust everything this telling carried: setting it sets all of it', null)} <a class="link" data-src="${esc(f.of)}">${esc(nameOf(f.of))} as a source</a></p>
      ${told.length ? `<h3>What it says</h3><ul class="events told-list">${told.map((x) => eventRow(x, new Set())).join('')}</ul>` : ''}`;
}
// --- Implications (the experiment): what the statements shown imply together, and the answers marked from that.
let derivedNow = [];      // the implications that hold, as the page stands
let derivedSeen = null;   // their ids at the last drawing, to say what is new
const autoQ = (qid) => state.answerRule === 'evidence' && implications.some((i) => i.q === qid);
const shownStatement = (id) => observed.filled.some((x) => x.obs.id === id);
/** What the statements shown say of a question's answers (an answer not yet offered is not concluded). */
function verdictOf(q) {
    const values = shownPossibilities(q).map((o) => o.value);
    const v = verdict(q.id, values, derivedNow);
    return values.includes(v.concluded) ? v : { ...v, concluded: null, by: null, ruled: new Set(derivedNow.filter((i) => i.q === q.id).flatMap((i) => i.rules_out ?? []).filter((x) => values.includes(x))) };
}
// A lie as evidence is linked by its telling, or by any statement the telling carried that the player has linked and
// holds unlikely or ruled out: to rule out what was said and link it is the natural move (a blind run of 2026-11-21
// spent 17 turns before it linked the telling instead). Whether the telling counts is still `doubted`: all its lies off.
const lieLinks = () => state.links.flatMap((l) => { const e = factById.get(l.entry); return !e || e.attr === 'tells' || levelOfFact(e) > UNLIKELY ? [] : viaStatement(l.entry, l.q).flatMap((o) => o.from.filter((f) => f?.doubted && carriedBy(f.doubted).includes(l.entry)).map((f) => ({ entry: f.doubted, q: l.q }))); });
const fillNow = () => fill(observations, [...state.links, ...lieLinks()], [...onTimeline(), ...data.facts.filter((f) => f.attr === 'tells' && visible(f) && accepted(f))], state.marks, { doubted, partlyDoubted, solved: isSolved });
/**
 * After the links are read: the implications that hold, and (answers from the evidence) the marks they give each
 * question that has implications: its concluded answer circled, the answers ruled out crossed out, the rest left.
 * A mark can complete a reading another observation waits for, so the links are read again until nothing changes.
 * A solved question keeps its marks. A premise distrusted since takes its implications back with it.
 */
function follow() {
    if (!observations) return;
    let changed = false;
    for (let n = 0; n < 8; n++) {
        derivedNow = implications.length ? derive(implications, shownStatement, isSolved) : [];
        if (state.answerRule !== 'evidence') break;
        let again = false;
        for (const q of data.questions) {
            if (!autoQ(q.id) || isSolved(q.id) || !qListed(q)) continue;
            const v = verdictOf(q), now = state.marks[q.id] ?? {};
            const marks = Object.fromEntries(shownPossibilities(q).map((o) => [o.value, o.value === v.concluded ? 'circled' : v.ruled.has(o.value) ? 'crossed' : null]).filter(([, m]) => m));
            if (Object.keys(marks).length === Object.keys(now).length && Object.keys(marks).every((k) => now[k] === marks[k])) continue;
            state.marks = { ...state.marks, [q.id]: marks };
            again = changed = true;
        }
        if (!again) break;
        observed = fillNow();
    }
    if (trying) return;
    if (changed) save();
    if (state.answerRule === 'evidence' && derivedSeen) {
        const fresh = derivedNow.filter((i) => !derivedSeen.has(i.id));
        if (fresh.length && !state.note) state.note = `It follows: ${fresh.map((i) => i.says).join('; and: ')}.`;
    }
    derivedSeen = new Set(derivedNow.map((i) => i.id));
}
// What follows, in the contradiction tracking (engine/implications.js `derivedAssertions`): the answers the evidence
// gives and rules out, the states those are, and the statements an implication denies by name, each trusted as its
// weakest premise; and an implication's typed statements (`asserts`) as entries of the timeline, from the reader's
// reasoning. Only with the answers marked from the evidence.
const holdsNow = (id) => shownStatement(id) || derivedNow.some((d) => d.id === id);
/** The timeline entries under a statement or an implication: what it rests on, through other implications. */
function groundsOf(id, trail = []) {
    const i = derivedNow.find((d) => d.id === id);
    if (!i) return (observed.filled.find((x) => x.obs.id === id)?.entries ?? []).filter((e) => !e.solved).map((e) => e.id);
    if (trail.includes(id)) return [];
    return [...new Set(premiseIds(i, holdsNow).filter((p) => !p.startsWith('solved:')).flatMap((p) => groundsOf(p, [...trail, id])))];
}
// One that says what the timeline already says in the same words (a witness's entry, a move of the player's, or
// another implication's) is left out: the same statement twice would be two rows, and two contradictions for one.
function impliedEntries() {
    const said = (x) => JSON.stringify([x.of, x.attr, x.value, !!x.neg, Object.entries(x.time ?? {}).sort()]);
    const have = new Set(onTimeline().map(said));
    const out = [];
    for (const x of impliedStates(derivedNow.filter((i) => autoQ(i.q)))) {
        if (have.has(said(x))) continue;
        have.add(said(x));
        const premises = groundsOf(x.imp);
        out.push({ ...x, ...(sureNow(x.imp) ? {} : { likely: true }), reasoned: { move: 'i', premises, imp: x.imp }, given_at: reading.latest(premises.map((id) => givenAt(factOf(id)) ?? 0)) ?? 0 });
    }
    return out;
}
const followsAssertions = () => (state.answerRule === 'evidence' && derivedNow.length
    ? derivedAssertions(data, derivedNow.filter((i) => autoQ(i.q) && qById.has(i.q) && qListed(qById.get(i.q))), (q) => shownPossibilities(q).map((o) => o.value), { states: false, shown: shownStatement, level: statementLevel }) : []);
/** The answers the evidence marks only as likely (a step on every way to them is likely): their marks' keys. */
let likelyMarks = new Set();
/**
 * How far the statement under an observation is trusted: its weakest entry; a statement that is evidence by being
 * disbelieved (`{doubted}`) as far as it is disbelieved (ruled out: confirmed; unlikely: likely).
 */
function statementLevel(id) {
    const o = observed.filled.find((y) => y.obs.id === id);
    if (!o) return null;
    const lied = new Set(o.obs.from.filter((f) => f?.doubted).map((f) => f.doubted));
    const ls = o.entries.filter((e) => !e.solved).map((e) => (lied.has(e.id) ? doubtLevel(e.id) : levelOfFact(e)));
    return ls.some((l) => l == null) ? null : Math.min(CONFIRMED, ...ls);
}
/** How strong what follows is: as its weakest rule and premise, by the best way to it, and no more than the player trusts their own reasoning. */
function derivedLevel(x) {
    const l = strength(x.derived, derivedNow, statementLevel);
    return l == null ? -1 : Math.min(l, state.trust.people[REASONING] ?? CONFIRMED);
}
const sureNow = (support) => strength(support, derivedNow, statementLevel) === CONFIRMED;
const followText = (x) => (x.kind === 'pick' ? `${x.neg ? 'The evidence rules out' : 'It follows from the evidence'}: ${pickText(qById.get(x.q), x.pick)}`
    : x.kind === 'state' ? `${x.denied ? 'The evidence rules out' : 'It follows from the evidence'}: ${phrase({ of: x.of, attr: x.attr, value: x.value, neg: x.denied ? !x.neg : x.neg, id: '' })}`
    : `From the evidence: ${esc(derivedNow.find((d) => d.id === x.imp)?.says ?? '')}`);
/** Under a question: what follows from what is shown, each implication over the statements it came from. */
function followsHtml(q) {
    if (!autoQ(q.id)) return '';
    const mine = derivedNow.filter((i) => i.q === q.id);
    if (!mine.length) return '';
    const used = new Set(mine.flatMap((i) => premiseIds(i, (id) => shownStatement(id) || derivedNow.some((d) => d.id === id))));
    const tree = (i) => {
        const kids = premiseIds(i, (id) => shownStatement(id) || derivedNow.some((d) => d.id === id)).map((id) => {
            const d = derivedNow.find((x) => x.id === id);
            if (d) return tree(d);
            if (id.startsWith('solved:')) { const o = qById.get(id.slice(7)); return `<li class="premise">${esc(o ? qLabel(o) : id)} <span class="good">solved</span></li>`; }
            return `<li class="premise">${esc(observed.filled.find((x) => x.obs.id === id)?.says ?? id)}</li>`;
        });
        const iq = qById.get(i.q);
        const sure = sureNow(i.id);
        const out = i.concludes != null ? ` <b class="good">${sure ? 'So' : 'So, likely'}: ${pickText(iq, i.concludes)}.</b>` : list(i.rules_out).length ? ` <span class="small muted">${sure ? 'Rules out' : 'Makes unlikely'}: ${list(i.rules_out).map((v) => pickText(iq, v)).join(', ')}.</span>` : sure ? '' : ' <span class="small muted">(likely)</span>';
        // How far it is trusted, as on the timeline: its weakest premise (the dot's colour).
        const lvl = derivedLevel({ derived: i.id });
        return `<li class="follows" data-follows="${esc(i.id)}">${dot(lvl < 0 ? null : lvl)}<span class="arrow">⇒</span> ${esc(i.says)}.${out}<ul>${kids.join('')}</ul></li>`;
    };
    return `<div class="small muted">What follows from it</div><ul class="follows-list">${mine.filter((i) => !used.has(i.id)).map(tree).join('')}</ul>${restsOnHtml(q)}`;
}
/**
 * What a question's answer rests on, by what is linked (docs/authored-stories.md, finding 113): every way to it that
 * holds now (`ways`, over the implications that hold), each with the sources of its statements: a narrator's own
 * observation, a person's word, a statement that is evidence by being ruled out, another question's answer. Said
 * only of what is linked: one way, and on whom it hangs; or several, and whether two of them share no source
 * (corroborated) or all pass through one person. It never says whether another way exists.
 */
const holdingWays = (q, pick) => ways(derivedNow, q.id, shownPossibilities(q).map((o) => o.value), [pick]).filter((s) => s.every((id) => (id.startsWith('solved:') ? isSolved(id.slice(7)) : shownStatement(id))));
function waySources(set, trail = []) {
    const out = { own: new Set(), people: new Set(), lies: new Set(), solved: new Set(), keys: new Set() };
    // Another question's answer: what it rests on in its turn counts for what two ways share (not for the wording).
    const under = (qid) => {
        out.solved.add(qid); out.keys.add(`q:${qid}`);
        const o = qById.get(qid), pick = state.solved[qid]?.pick;
        if (!o || pick == null || trail.includes(qid)) return;
        for (const w of holdingWays(o, pick)) for (const k of waySources(w, [...trail, qid]).keys) out.keys.add(k);
    };
    const entry = (e, lied) => {
        if (!e) return;
        if (e.solved) { under(e.solved); return; }
        if (e.reasoned) { for (const p of e.reasoned.premises ?? []) entry(factOf(p), false); return; }
        if (lied) { out.lies.add(e.id); out.keys.add(`lie:${e.id}`); return; }
        const ps = cameFrom(e);
        if (!ps.length) { for (const c of chainsOf(e)) if (c.origin) out.own.add(c.origin); return; }
        for (const p of ps) { out.people.add(p); out.keys.add(`p:${p}`); }
        for (const l of contentChains(e).flatMap((c) => c.links)) if (!l.narrator && !l.stmt && l.how !== 'member') out.keys.add(`l:${linkKey(l)}`);
    };
    for (const id of set) {
        if (id.startsWith('solved:')) { under(id.slice(7)); continue; }
        const x = observed.filled.find((y) => y.obs.id === id);
        const lied = new Set((x?.obs.from ?? []).filter((f) => f?.doubted).map((f) => f.doubted));
        for (const e of x?.entries ?? []) entry(e, lied.has(e.id));
    }
    return out;
}
function restsOnHtml(q) {
    const v = verdictOf(q);
    if (v.concluded == null) return '';
    const all = holdingWays(q, v.concluded).map((w) => waySources(w));
    if (!all.length) return '';
    const word = (p) => `the word of ${esc(nameOf(p))}`;
    const rec = (ps) => ps.map((p) => [p, recordOf(p)]).filter(([, r]) => r.out || r.against).map(([p, r]) => ` <span class="muted">(Of what came from ${esc(nameOf(p))}: ${recordText({ ...r, confirmed: 0 })}.)</span>`).join('');
    let text;
    if (all.length === 1) {
        const w = all[0], ps = [...w.people];
        const labels = [...[...w.own].map((o) => `what ${esc(narratorName(o) ?? nameOf(o))} saw and heard`), ...ps.map(word), ...(w.lies.size ? [`${w.lies.size === 1 ? 'a statement' : `${w.lies.size} statements`} you do not believe`] : []), ...[...w.solved].map((id) => `the answer to “${esc(qById.has(id) ? qLabel(qById.get(id)) : id)}”`)];
        text = (ps.length === 1 && labels.length === 1 ? `It hangs on ${word(ps[0])} alone.` : `It rests on: ${labels.join('; ')}.`) + rec(ps);
    } else {
        const apart = all.some((a, i) => all.slice(i + 1).some((b) => ![...a.keys].some((k) => b.keys.has(k))));
        const common = [...all[0].people].filter((p) => all.every((w) => w.people.has(p)));
        text = `It follows ${all.length} ways.${apart ? ' Two of them share no source: it is corroborated.' : common.length ? ` Every one of them passes through ${common.map(word).join(' and ')}.${rec(common)}` : ''}`;
    }
    return `<div class="small rests-on" data-rests="${all.length}">By what you have linked: ${text}</div>`;
}
const viaStatement = (entry, q) => observations.filter((o) => o.q === q && o.from.some((f) => f?.doubted && carriedBy(f.doubted).includes(entry)));
// An entry the grid of means, opportunity and motive would read for the question (alone, or beside the others it is
// read with) is evidence for it too: nothing is written for that, the typed act and the typed entry say it.
const gridWho = (q) => shownPossibilities(q).map((o) => o.value).filter((v) => ['person', 'animal'].includes(entityById.get(v)?.kind));
const gridSeen = new Map();
function gridBears(entry, qid) {
    const q = qById.get(qid), f = factById.get(entry);
    if (!q?.entry?.act && !q?.possibilities?.some((p) => p.action)) return false;
    if (!f || f.attr === 'tells') return false;
    const who = gridWho(q);
    if (who.length < 2) return false;
    const key = `${qid}|${who.join(',')}`, cells = (rows) => new Set((rows ?? []).flatMap((r) => [...r.opportunity, ...r.means, ...r.motive].flatMap((c) => c.facts)));
    if (!gridSeen.has(key)) gridSeen.set(key, { all: cells(suspectGrid(data, q, who, data.facts.map((x) => x.id), nameOf, placeCtx)), one: new Map() });
    const m = gridSeen.get(key);
    if (m.all.has(entry)) return true;
    if (!m.one.has(entry)) m.one.set(entry, cells(suspectGrid(data, q, who, [entry], nameOf, placeCtx)).has(entry));
    return m.one.get(entry);
}
const bearsOn = (entry, q) => { const e = factOf(entry); return !!e && (bears(observations, q, e) || viaStatement(entry, q).length > 0 || gridBears(entry, q)); };
/** A kept link that still waits: something it is evidence for is not shown yet. */
// Evidence the player's own trust keeps from counting: an entry some observation of `q` not yet shown comes from
// (itself, or as one of several alike), linked or not, that is below the timeline's level. Said outright, since
// "something else is needed" sent a blind solver looking for another entry for two hundred turns.
const untrusted = (e, q) => !!e && !e.reasoned && !accepted(e) && observations.some((o) => o.q === q && !observed.filled.some((x) => x.obs === o) && o.from.some((f) => (typeof f === 'string' ? f === e.id : !!f.any?.includes(e.id))));
const UNTRUSTED = 'It is evidence for this, but it does not count yet: it shows nothing until you trust it as likely.';
/** Why a link did not trust an entry by itself: another statement of its source is ruled out. */
const recordWhy = (e) => { const ps = isStatement(e) && levelOfFact(e) === UNCERTAIN ? shownFalse(e) : []; return ps.length ? ` Something else that came from ${ps.map((p) => esc(nameOf(p))).join(' and ')} is ruled out, so a link does not trust this one by itself.` : ''; };
const waitsOn = (e, q) => waits(observations, q, e, observed.filled) || viaStatement(e.id, q).some((o) => !observed.filled.some((x) => x.obs === o));
const isTried = (entry, q) => checkedLinks() && (state.tried[q] ?? []).includes(entry);
const markTried = (entry, q) => { if (!entry.startsWith('r:r:') && !(state.tried[q] ?? []).includes(entry)) state.tried = { ...state.tried, [q]: [...(state.tried[q] ?? []), entry] }; };
/** Links from before the rule, or from a game played with it off: one that is no evidence becomes a tried mark. */
function sweepLinks() {
    if (!observations || !checkedLinks()) return;
    // A tried mark on what is evidence after all (the case's data or the rule changed since it was made) is dropped.
    const wrong = Object.entries(state.tried).filter(([q, es]) => qById.has(q) && es.some((id) => bearsOn(id, q)));
    if (wrong.length) { state.tried = { ...state.tried, ...Object.fromEntries(wrong.map(([q, es]) => [q, es.filter((id) => !bearsOn(id, q))])) }; save(); }
    const gone = state.links.filter((l) => qById.has(l.q) && !l.entry.startsWith('r:r:') && factOf(l.entry) && !bearsOn(l.entry, l.q));
    if (!gone.length) return;
    for (const l of gone) markTried(l.entry, l.q);
    state.links = state.links.filter((l) => !gone.includes(l));
    save();
}
/** Set one statement's own level where it now stands at `from` (a fact with a statement link of its own). Returns whether it did. */
function trustByUse(f, level, from) {
    if (!f || f.attr === 'tells' || levelOfFact(f) !== from) return false;
    const own = chainsOf(f).flatMap((c) => c.links).find((l) => l.stmt);
    if (!own) return false;
    state.trust = { ...state.trust, links: { ...state.trust.links, [linkKey(own)]: level } };
    if (level === CONFIRMED) earn(state.trust, linkKey(own));
    return true;
}
/**
 * A question solved confirms what its answer rested on: the entries its observations shown came from (and what a
 * piece of reasoning among them was drawn from) that were held likely are confirmed. Not a statement that was
 * evidence by being disbelieved, and nothing false. Returns how many it confirmed.
 */
function confirmBy(qid) {
    let n = 0;
    const done = new Set();
    const one = (e) => {
        if (!e || e.solved || done.has(e.id)) return;
        done.add(e.id);
        if (e.reasoned) { for (const p of e.reasoned.premises ?? []) one(factOf(p)); return; }
        if (e.truth !== false && trustByUse(e, CONFIRMED, LIKELY_LEVEL)) n++;
    };
    for (const x of observed.filled) if (x.obs.q === qid) { const lied = new Set(x.obs.from.filter((f) => f?.doubted).map((f) => f.doubted)); for (const e of x.entries) if (!lied.has(e.id)) one(e); }
    return n;
}
let linkOnlyNew = false;  // linking: show only the entries not yet linked or tried for the question (not saved)
function toggleLink(entry, q) {
    if (checkedLinks()) {
        if (isLinked(entry, q)) { if (bearsOn(entry, q)) { state.note = 'This link is evidence for the question: it stays.'; render(); return; } }
        else if (isTried(entry, q)) { state.note = `Already tried: it shows nothing about “${qLabel(qById.get(q))}”.`; render(); return; }
        else if (!bearsOn(entry, q)) { if (trying) return; markTried(entry, q); state.note = `Tried: it shows nothing about “${qLabel(qById.get(q))}”.${factById.get(entry)?.attr === 'tells' ? ' This entry is only that it was said. What was said are entries of their own, and each can be linked.' : ''}`; save(); render(); return; }
    }
    remember();
    // To cite a statement is to hold it likely: a link that is kept trusts an entry still uncertain as likely, by its
    // own setting (not one the player has distrusted, and not a speech, whose content is trusted apart).
    // Not where something else from the same source is ruled out: that one the player trusts, or not, by hand.
    if (!isLinked(entry, q) && !(factById.has(entry) && shownFalse(factById.get(entry)).length)) trustByUse(factById.get(entry), LIKELY_LEVEL, UNCERTAIN);
    state.links = isLinked(entry, q) ? state.links.filter((l) => !(l.entry === entry && l.q === q)) : [...state.links, { entry, q }];
    save(); render();
}
/** A link's button: to link; linked (with checked links it stays, so the button is off); or tried and refused. */
const linkButton = (cls, entry, q, add, on, tried) => {
    const linked = isLinked(entry, q), t = !linked && isTried(entry, q), fixed = checkedLinks() && (t || (linked && bearsOn(entry, q)));
    return `<button type="button" class="${cls}${linked ? ' on' : ''}${t ? ' tried' : ''}" data-link-entry="${esc(entry)}" data-link-q="${esc(q)}"${fixed ? ` disabled title="${t ? 'Already tried: it shows nothing about this question' : 'Evidence for the question: it stays'}"` : ''}>${linked ? on : t ? tried : add}</button>`;
};
let linkAllFor = null;   // the event whose "Relevant to…" shows the questions below the line as well
/** "Relevant to…" in an event's detail: the open questions above the player's line, so that the list points at none. */
function linkHtml(f) {
    if (!observations) return '';
    const { above, below } = arranged();
    const up = above.filter((q) => !givenAway(q)), down = below.filter((q) => !givenAway(q));
    if (!up.length && !down.length) return '';
    const all = linkAllFor === f.id, extra = down.filter((q) => all || isLinked(f.id, q.id)), qs = [...up, ...extra];
    const more = down.length - extra.length;
    // What each of its links does: shows something, is part of something not yet complete, or is kept as a note.
    const has = (x) => x.entries.some((e) => e.id === f.id);
    const said = [...state.links.filter((l) => l.entry === f.id && qById.has(l.q)).map((l) => {
        const q = qById.get(l.q), name = `<span class="muted">(${esc(qLabel(q))})</span>`;
        const shows = observed.filled.filter((x) => x.obs.q === q.id && has(x));
        if (shows.length) return shows.map((x) => `<p class="small">Shows: <b>${esc(x.says)}</b>. ${name}</p>`).join('');
        if (observed.partial.some((x) => x.obs.q === q.id && has(x))) return `<p class="small">Part of something not yet complete: with something else, linked too, it would show more. ${name}</p>`;
        if (untrusted(f, q.id)) return `<p class="small untrusted-note">${UNTRUSTED}${recordWhy(f)} ${quickTrust(f, [LIKELY_LEVEL])} ${name}</p>`;
        if (checkedLinks() && bearsOn(f.id, q.id)) return waitsOn(f, q.id) ? `<p class="small">Part of something not yet complete: it is evidence for this, and as the timeline stands something else is still needed before it shows it. ${name}</p>`
            : `<p class="small muted">Part of what you have shown about this. ${name}</p>`;
        return `<p class="small muted">Kept as a note: as the timeline stands, it shows nothing about this on its own. ${name}</p>`;
    })].join('');
    return `<h3>Relevant to…</h3>${qs.map((q) => linkButton('link-q', f.id, q.id, esc(qLabel(q)), `${esc(qLabel(q))} ✓`, `${esc(qLabel(q))} ✗ tried`)).join('')}${more ? `<button type="button" class="link-more" data-link-more="${esc(f.id)}">Show the others (${more})</button>` : ''}${said}`;
}
/** What the player has shown about a question: its observations, their sources, and any notes. */
function descriptionHtml(q) {
    if (!observations) return '';
    const mine = observed.filled.filter((x) => x.obs.q === q.id);
    const noted = observed.notes.filter((l) => l.q === q.id).map((l) => factOf(l.entry)).filter(Boolean);
    // With checked links a link that fills nothing yet is still evidence: it waits for something else.
    // (one whose evidence is all shown by now, a premise of a move since made, is listed no longer).
    const kept = checkedLinks() ? noted.filter((e) => bearsOn(e.id, q.id)) : [], notes = noted.filter((e) => !kept.includes(e));
    const waiting = kept.filter((e) => waitsOn(e, q.id));
    const from = (x) => x.entries.map((e) => (e.solved ? 'solved' : paraTag(givenAt(e)))).join(', ');
    const begun = [...observed.partial.filter((x) => x.obs.q === q.id).map((x) => x.entries), ...waiting.filter((e) => !observed.partial.some((x) => x.obs.q === q.id && x.entries.includes(e))).map((e) => [e])]
        .map((es) => `<li class="muted">Part of something not yet complete: ${es.map((e) => `${phrase(e)} ${paraSpan(givenAt(e))}`).join('; ')}</li>`).join('');
    const off = state.links.filter((l) => l.q === q.id).map((l) => factOf(l.entry)).filter((e) => untrusted(e, q.id))
        .map((e) => `<li class="muted untrusted-note">Linked, but it does not count until you trust it as likely: ${phrase(e)} ${paraSpan(givenAt(e))}${recordWhy(e)} ${quickTrust(e, [LIKELY_LEVEL])}</li>`).join('');
    const items = mine.map((x) => `<li>${esc(x.says)}${list(x.obs.against).length && !autoQ(q.id) ? ` <span class="small muted">against: ${list(x.obs.against).map((v) => esc(entityById.has(v) ? nameOf(v) : v)).join(', ')}</span>` : ''} <span class="para">${esc(from(x))}</span></li>`).join('');
    const d = givenAway(q) ? described(observations, q.id, observed.filled) : null;
    const verdict = d?.any ? `<p class="small">${d.done ? 'Your description had everything it needed.' : `Your description lacked: ${d.missing.map(esc).join('; ')}.`}</p>` : '';
    const noteHtml_ = notes.length ? `<div class="small muted">Your notes: ${notes.map((e) => phrase(e)).join('; ')}</div>` : '';
    // A larger question lists the questions it rests on, and which of them are not solved yet (one not yet raised is
    // not named).
    const rests = [...new Set(observations.filter((o) => o.q === q.id && o.essential).flatMap((o) => o.from.filter((e) => e.solved).map((e) => e.solved)))].map((id) => qById.get(id)).filter(Boolean);
    const restsHtml = rests.length && !isSolved(q.id) ? `<div class="small rests-on">It rests on ${rests.length === 1 ? 'another question' : `${rests.length} other questions`}: <ul>${rests.map((r) => `<li>${qListed(r) ? `<a class="link" data-q="${esc(r.id)}">${esc(qLabel(r))}</a>` : 'a question not raised yet'}${isSolved(r.id) ? ' <span class="good">solved</span>' : ' <span class="muted">not solved yet</span>'}</li>`).join('')}</ul></div>` : '';
    const status = isSolved(q.id) ? `<p class="small good solved-note">Solved.${EARNED ? ` <span class="muted">${broughtHtml(q.id, false)}</span>` : ''}</p>` : judgement(q) === 'wrong' ? '<p class="small bad not-this">Not this answer.</p>'
        : !givenAway(q) && evidenceOf(q).any ? `<p class="small muted unsolved-note">Not solved yet: ${unsolvedWhy(q)}.</p>` : '';
    // Starting and ending are two controls in two places: the button here starts, Done at the top of the timeline
    // ends (one button for both let a press after a press undo itself: a blind solver did that 117 times running).
    const start = !givenAway(q) ? `${linkingQ === q.id ? '<span class="small link-start on">Linking: go down the timeline. <b>Done linking</b> is at its top.</span>' : `<button type="button" class="link-start" data-linking="${esc(q.id)}">Link observations…</button>`}${checkedLinks() ? ` <span class="small muted untried-count" data-untried="${esc(q.id)}"></span>` : ''}` : '';
    return `<div class="desc">${status}${restsHtml}${items || begun || off ? `<div class="small muted">What you have shown about it</div><ul class="desc-list">${items}${begun}${off}</ul>` : ''}${followsHtml(q)}${gridHtml(q)}${noteHtml_}${verdict}${start}</div>`;
}
/**
 * Means, opportunity and motive (finding 116): under a "who" question whose answer is a typed act, each suspect
 * against what the act needs of the one who did it, by the action table (engine `suspectGrid`), as far as what the
 * player has linked to the question and trusts says. The frame is the same for every such question and a need is
 * named only once something linked meets it or is against it, so the grid says nothing the player has not shown.
 * It decides nothing: the answers are marked by what follows from the evidence.
 */
function gridHtml(q) {
    if (givenAway(q)) return '';
    const who = gridWho(q);
    if (who.length < 2) return '';
    const shown = state.links.filter((l) => l.q === q.id).map((l) => factById.get(l.entry)).filter((f) => f && accepted(f)).map((f) => f.id);
    const rows = suspectGrid(data, q, who, shown, nameOf, placeCtx);
    if (!rows) return '';
    const item = (c) => `<div class="grid-${c.status}">${c.status === 'met' ? '✓' : '✗ against:'} ${c.says ? `${esc(c.says)}<br>` : c.req.id ? `${phrase(c.req)}<br>` : ''}<span class="muted">${c.facts.map((id) => { const f = factById.get(id); return `${dot(levelOfFact(f))}${phrase(f)} ${paraSpan(givenAt(f))}`; }).join('; ')}</span></div>`;
    const cell = (cs) => `<td>${cs.length ? cs.map(item).join('') : '<span class="muted">nothing shown</span>'}</td>`;
    return `<table class="suspect-grid small" data-grid="${esc(q.id)}"><thead><tr><th></th><th title="Could they have been where it was done, when it was done?">Opportunity</th><th title="Had they what it takes: a key, a thing, a skill?">Means</th><th title="Do they gain or lose by it, or want what it brings?">Motive</th></tr></thead><tbody>${rows.map((r) => `<tr><th>${ent(r.pick)}</th>${cell(r.opportunity)}${cell(r.means)}${cell(r.motive)}</tr>`).join('')}</tbody></table>`;
}
const linkingBar = () => (linkingQ && qById.has(linkingQ) ? `<div class="linking-bar"><span>Linking to: <b>${esc(qLabel(qById.get(linkingQ)))}</b></span>${checkedLinks() ? `<label class="link-only-new" title="Hide the entries already linked to this question or tried for it"><input type="checkbox" data-link-only-new${linkOnlyNew ? ' checked' : ''}> only what is not tried yet</label>` : ''}<button type="button" data-linking-done>Done linking</button></div>` : '');

let shownPara = null;
/** After a drawing: how many of the timeline's entries are neither linked to each open question nor tried for it. */
function untriedCounts() {
    document.body.classList.toggle('link-only-new', !!linkingQ && linkOnlyNew && checkedLinks());
    const spans = [...document.querySelectorAll('[data-untried], [data-untried-n]')];
    if (!spans.length) return;
    const ids = [...new Set([...document.querySelectorAll('#timeline [data-fact]')].map((e) => e.dataset.fact))];
    let total = 0;
    for (const s of spans) {
        const q = s.dataset.untried ?? s.dataset.untriedN, left = ids.filter((id) => !isLinked(id, q) && !isTried(id, q)).length;
        if (s.dataset.untriedN != null) { total += left; s.textContent = `${left} of ${ids.length} entries`; }
        else s.textContent = `not tried yet: ${left} of ${ids.length} entries`;
    }
    const t = document.querySelector('[data-untried-total]');
    if (t) t.textContent = String(total);
}
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
    reasoned = reasonedEntries(state.reasoning, (id) => factById.get(id) ?? hypIntention(id) ?? hypAction(id) ?? presupposed(id), data.order, nameOf, givenAt, { ...placeCtx, entries: told, record: [...told, ...data.facts.filter((f) => f.series && typeof f.series === 'string' && visible(f) && levelOfFact(f) === UNCERTAIN)], lapsed: lapses, held, latest: (xs) => reading.latest(xs) });
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
    sweepLinks();
    if (observations) { observed = fillNow(); follow(); }
    if (state.answerRule === 'evidence' && derivedNow.length) { reasoned = [...reasoned, ...impliedEntries()]; reasonedById = new Map(reasoned.map((f) => [f.id, f])); }
    likelyMarks = new Set(followsAssertions().filter((x) => x.kind === 'pick' && x.likely).map((x) => x.id));
    syncQuestions();
    judge();
    const qList = document.querySelector('#q-box ol');
    const qScroll = qList?.scrollTop ?? 0;
    // The reading controls work on the story shown in the Story panel (the main story, or a file).
    const sid = state.story, at = reading.readTo(sid);
    document.getElementById('para').value = at;
    document.getElementById('para').max = lastOf(sid);
    document.getElementById('next').disabled = at >= lastOf(sid);
    document.getElementById('para').min = at;
    document.getElementById('hide-out').checked = !!state.hideOut;
    document.getElementById('grey-clash').value = state.greyClash === 'off' ? 'off' : 'on';
    document.getElementById('narrator-trust').innerHTML = data.narrators.map((n) => `<label title="How far you trust what ${esc(n.name ?? 'the narrator')} tells you: everything in the story comes through this narration">Trust in ${esc(n.name ?? 'the narrator')} as narrator
          <select class="narration-trust" data-key="${esc(linkKey(narrationLink(n)))}" data-base="${narrationLink(n).base}">${levelOpts(narrationLevel(n.id), null, true)}</select></label>`).join('');

    // The story so far, the newest paragraph last and in view.
    const st = document.getElementById('story');
    st.innerHTML = storyTabsHtml() + (at ? stories.get(sid).slice(1, at + 1).map((p, i) => `<p class="sp${i + 1 === at && reading.log.at(-1) === `${sid}:${at}` ? ' now' : ''}" data-sp="${esc(`${sid}:${i + 1}`)}">${paraSpan(sid === MAIN ? i + 1 : `${sid}:${i + 1}`)} ${paraHtml(sid, i + 1)}</p>`).join('')
        : `<p class="muted small">${esc(fileById.get(sid)?.title ?? '')}: this paper is open, and nothing of it is read yet. <button type="button" class="read-first" data-read-first>Read its first paragraph ▶</button> <span class="muted">(<b>Read on ▶</b>, above, does the same.)</span></p>`) + paperNotes();
    // Only a new paragraph scrolls the story to its end: a click elsewhere leaves it where the player put it.
    const shownKey = `${sid}:${at}`;
    if (shownPara !== shownKey && visibleEl(st)) { shownPara = shownKey; st.lastElementChild?.scrollIntoView({ block: 'nearest' }); }

    // What counts, and (a setting) what is still uncertain too: a clash is as strong as its weakest side.
    const acceptedNow = acceptedAssertions(state.greyClash === 'off' ? LIKELY_LEVEL : UNCERTAIN);
    const allClashes = [...contradictions(data, acceptedNow), ...alibis(data, acceptedNow, presenceNeeds(acceptedNow))];
    // What is only likely contradicts nothing: where it cannot stand with an entry, the two sit badly together.
    // One side alone short of confirmed, against what is confirmed: that side cannot be so (`against`). With two
    // sides short of it, the weaker decides: unlikely together, or undecided.
    const weak = (c) => [c.a, c.b, c.via].filter((x) => x && (sideLevel.get(x.id) ?? CONFIRMED) < CONFIRMED);
    const clashes = allClashes.filter((c) => clashLevel(c) >= CONFIRMED), against = allClashes.filter((c) => weak(c).length === 1);
    const soft = allClashes.filter((c) => weak(c).length > 1 && clashLevel(c) === LIKELY_LEVEL), grey = allClashes.filter((c) => weak(c).length > 1 && clashLevel(c) < LIKELY_LEVEL);
    const clashing = new Set(clashes.flatMap((c) => [c.a, c.b, c.via].filter(Boolean)).flatMap((x) => (x.mark || x.by === DERIVED ? [x.id, `q:${x.q}`] : [x.fact])));
    current = clashes;
    currentAll = allClashes;
    againstNow = new Set(against.map((c) => weak(c)[0]).filter((x) => !x.mark && x.by !== DERIVED).map((x) => x.fact));
    document.getElementById('undo').disabled = !state.history.length;
    // Each side with its level where it is not confirmed: the weaker side is the one to look at.
    const side = (x) => { const l = sideLevel.get(x.id) ?? CONFIRMED, rec = l < CONFIRMED && !x.mark && x.by !== DERIVED ? recordNote(factOf(x.fact)) : ''; return `${clashSide(x)}${l < CONFIRMED ? ` <span class="side-lvl small">(${levelName(l)}${rec ? `; ${rec}` : ''})</span>` : ''}`; };
    const item = (c, joins) => `<li class="${state.sel === clashKey(c) ? 'sel' : ''}"><b>${clashTitle(c)}</b> <a class="link trace" data-clash="${esc(clashKey(c))}">trace</a><br>${side(c.a)}<br>${joins[0]} ${side(c.b)}${c.via ? `<br>${joins[1]} ${side(c.via)}` : ''}</li>`;
    document.getElementById('clashes').innerHTML = clashes.length
        ? `<details class="clash-box" open><summary>${clashes.length} contradiction${clashes.length > 1 ? 's' : ''} among what is confirmed</summary><ol>${clashes.map((c) => item(c, ['against', 'with'])).join('')}</ol><p class="small muted">Trace a contradiction to see both sides' chains, then lower your trust in one of them.</p></details>`
        : '';
    // The one side that cannot stand, with a button to rule it out where it is a statement with a level of its own.
    const ruleOut = (c) => { const x = weak(c)[0], f = x.by === DERIVED || x.mark ? null : factOf(x.fact); const b = f ? quickTrust(f, [RULED_OUT]) : ''; return b ? `<br>${b}` : x.mark ? '<br><span class="small muted">Your own answer: change the circle.</span>' : ''; };
    document.getElementById('clashes').innerHTML += against.length ? `<details class="clash-box against-box" open><summary>${against.length} cannot be so: against what is confirmed</summary>
      <p class="small muted">The other side is confirmed, so the side marked cannot stand as it is.</p><ol>${against.map((c) => item(c, ['against', 'with']).replace(/<\/li>$/, `${ruleOut(c)}</li>`)).join('')}</ol></details>` : '';
    const strains = activeStrains();
    document.getElementById('clashes').innerHTML += strainsHtml(strains) + (soft.length ? `<details class="strain-box soft-box" open><summary>${soft.length} unlikely together</summary>
      <p class="small muted">Not a contradiction: neither side is confirmed. The level of each is marked.</p><ol>${soft.map((c) => item(c, ['with', 'and'])).join('')}</ol></details>` : '')
      + (grey.length ? `<details class="undecided-box" open><summary>${grey.length} cannot both be so: undecided</summary>
      <p class="small muted">One side at least is still uncertain, so nothing follows yet. Decide what you trust.</p><ol>${grey.map((c) => item(c, ['against', 'with'])).join('')}</ol></details>` : '');
    // Agreement: two statements told that say the same thing at a shared moment, from sources that share nothing.
    // Listed where one that is short of confirmed is borne out whole by the other; it can be confirmed where the other
    // side is confirmed, or both are likely (an offer: two can agree and both be wrong).
    const wide = state.greyClash === 'off' ? acceptedAssertions(UNCERTAIN) : acceptedNow;
    const lvl = (x) => sideLevel.get(x.id) ?? CONFIRMED;
    const agree = agreements(data, wide).filter((g) => ((lvl(g.a) < CONFIRMED && g.whole.a) || (lvl(g.b) < CONFIRMED && g.whole.b)) && independent(chainsOfAssertion(g.a), chainsOfAssertion(g.b)));
    const offer = (x, o, whole) => (whole && lvl(x) < CONFIRMED && (lvl(o) === CONFIRMED || (lvl(x) === LIKELY_LEVEL && lvl(o) === LIKELY_LEVEL)) ? agreeButton(factOf(x.fact)) : '');
    const agreeButton = (f) => { const k = f ? stmtKeyOf(f) : null; return k ? `<button type="button" class="quiet small" data-agree="${esc(k)}">Trust as confirmed</button>` : ''; };
    const agreeItem = (g) => { const b = [offer(g.a, g.b, g.whole.a), offer(g.b, g.a, g.whole.b)].filter(Boolean); return `<li>${side(g.a)} ${offer(g.a, g.b, g.whole.a)}<br>and ${side(g.b)} ${offer(g.b, g.a, g.whole.b)}${b.length ? '' : `<br><span class="small muted">${!counts(lvl(g.a)) || !counts(lvl(g.b)) ? 'One of them at least does not count yet.' : 'Trust both as likely, or one as confirmed, and the other can be confirmed.'}</span>`}</li>`; };
    document.getElementById('clashes').innerHTML += agree.length ? `<details class="agree-box" open><summary>${agree.length} agree: two sources that share nothing say the same</summary>
      <p class="small muted">The opposite of a contradiction, and one of the two ways a statement becomes confirmed (the other: a question solved that rested on it). Where one is confirmed, or both are likely, you can confirm what the other bears out. Two can agree and both be wrong.</p><ol>${agree.map(agreeItem).join('')}</ol></details>` : '';
    document.getElementById('sources').innerHTML = sourcesPanel();
    document.getElementById('questions').innerHTML = leftHtml() + questionsPanel(clashing);
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
    untriedCounts();
    if (state.view !== 'list' && visibleEl(document.getElementById('timeline'))) packGrid();
    renderTabs({ cards: cards.count, questions: listedQuestions().length, clashes: clashes.length + against.length + strains.filter((s) => !state.held.includes(s.id)).length });
    renderLapseNews();
    renderGate();
    renderAnswers();
    renderSolved();
    renderDetail(clashing);
}

/** What ruling a link out would stop from counting now. */
function takenOff(key) {
    const trust = { ...state.trust, links: { ...state.trust.links, [key]: RULED_OUT } };
    return data.facts.filter((f) => f.attr !== 'tells' && visible(f) && accepted(f) && !counts(levelOf(chainsOf(f), trust)));
}
/** Next to a trust control: what ruling it out would take away, so that a true part is not lost unawares. */
function takesHtml(key, level) {
    if (level != null && level <= UNLIKELY) return '';
    const fs = takenOff(key);
    if (!fs.length) return '';
    const shown = fs.slice(0, 3).map((f) => phrase(f).replace(/<[^>]+>/g, '')).map(esc).join('; ');
    return ` <span class="takes small muted">Ruling it out stops these counting: ${shown}${fs.length > 3 ? `; and ${fs.length - 3} more` : ''}.</span>`;
}
/**
 * One link's trust control. A link with a level to start from (a narration, a doubtable narrator's own statement, a
 * mark) offers the five levels; any other also "not set": a statement is then as what it came by, and a telling or
 * a speech as its person, or uncertain.
 */
function linkStep(l, body, title, resolving) {
    const key = linkKey(l);
    const mark = resolving?.links.includes(key) ? ' resolving' : '';
    const own = state.trust.links[key];
    const cur = own ?? l.base ?? null;
    const unset = l.base != null ? null : l.stmt ? 'not set: as it came' : `not set: as ${nameOf(l.from)}`;
    return `<span class="link-step${mark}"${mark ? ' title="Ruling this out alone stops this side counting"' : ''}>${body} <select class="link-trust" data-key="${esc(key)}"${l.base != null ? ` data-base="${l.base}"` : ''} title="${title}">${levelOpts(cur, unset, mayConfirm(key, l.base))}</select>${dropChip(resolving?.drop?.links.get(key))}${resolving ? '' : takesHtml(key, cur)}</span>`;
}
/**
 * A chain's links, but its statement's own link, which is drawn once above the chains (stmtHtml), and the narration
 * link at its end, the frame of the whole story (its trust is in Settings): a chain is drawn up to the narrator.
 */
function chainHtml(c, resolving = null) {
    const steps = c.links.filter((l) => !l.stmt && !l.narrator);
    const links = steps.map((l) => linkStep(l, `→ <span class="how">${esc(l.how)}${l.uncertain ? '?' : ''}</span> → ${ent(l.to)}`, 'How far you trust everything that came by this link', resolving)).join(' ');
    const own = !steps.length && c.links.some((l) => l.narrator) ? ` <span class="muted">(${esc(narratorName(c.origin) ?? nameOf(c.origin))}’s own)</span>` : '';
    return `<li>${dot(levelOf([c], state.trust))}${entHead(c.origin ?? '?')}${steps.length ? ' ' + links : own}</li>`;
}
/** The statement's own link: how far the player trusts this one claim or fact, apart from the rest that came the same way. */
function stmtHtml(chains, resolving = null) {
    const own = [...new Map(chains.flatMap((c) => c.links.filter((l) => l.stmt)).map((l) => [l.stmt, l])).values()];
    return own.map((l) => `<p class="small stmt-line">${linkStep(l, 'This statement itself:', 'How far you trust this one statement, whatever it came by', resolving)}</p>`).join('');
}
/** The people a chain comes from: a person's level is that of everything they said that has no level of its own; setting it sets all of it. */
function peopleHtml(chains, resolving = null) {
    const people = [...new Set(chains.flatMap((c) => c.links.filter((l) => !l.narrator).map((l) => l.from)))].filter((p) => p && p !== '?' && !narratorIds.has(p));
    if (!people.length) return '';
    return `<h3>People</h3><ul class="people">${people.map((p) => {
        const mark = resolving?.people.includes(p) ? ' class="resolving" title="Ruling this person out alone stops this side counting"' : '';
        return `<li${mark}>${personStep(p)}${dropChip(resolving?.drop?.people.get(p))}</li>`;
    }).join('')}</ul>`;
}
const personStep = (p) => `${p === REASONING || p === HYPOTHESIS ? ent(p) : `<a class="link" data-src="${esc(p)}">${esc(nameOf(p))}</a>`}: <select class="person-trust" data-person="${esc(p)}" title="How far you trust everything this one says: setting it sets all of it">${levelOpts(state.trust.people[p] ?? null, p === REASONING ? 'no limit' : p === HYPOTHESIS ? 'not set: likely' : 'not set: uncertain', p === REASONING)}</select>`;

/** How many events that count now would stop counting with a link (or a person) ruled out. */
function dropCounts(chains) {
    const on = data.facts.filter((f) => f.attr !== 'tells' && visible(f) && accepted(f));
    const count = (trust) => on.filter((f) => !counts(levelOf(chainsOf(f), trust))).length;
    const links = new Map(), people = new Map();
    for (const k of new Set(chains.flatMap((c) => c.links.filter((l) => !l.narrator).map(linkKey)))) links.set(k, count({ ...state.trust, links: { ...state.trust.links, [k]: 0 } }));
    for (const p of new Set(chains.flatMap((c) => c.links.map((l) => l.from)))) people.set(p, count({ ...state.trust, people: { ...state.trust.people, [p]: 0 } }));
    return { links, people };
}
const dropChip = (n) => (!n ? '' : ` <span class="drop" title="Ruling it out stops ${n} event${n === 1 ? '' : 's'} counting">−${n}</span>`);

// --- Sources: who told what. A person, the links their words came by (a paper or a statement they gave, their
// words to someone), and under each link the entries it carried. Setting a person's level sets everything of theirs
// to it; setting a link's sets every entry it carried (what was set apart below is taken back, and can be set again).
const sourceTree = (() => {
    const people = new Map();   // person → Map(link key → {link, facts: Set(fact id)})
    const stmts = new Map();    // person → Set(statement keys of what starts with them)
    const add = (chains, fid) => {
        for (const c of chains) for (const l of c.links) {
            if (l.narrator || !l.from || l.from === '?' || l.how === 'member') continue;
            if (l.stmt) { stmts.set(l.from, (stmts.get(l.from) ?? new Set()).add(linkKey(l))); continue; }
            if (!people.has(l.from)) people.set(l.from, new Map());
            const m = people.get(l.from), k = linkKey(l);
            if (!m.has(k)) m.set(k, { link: l, facts: new Set() });
            m.get(k).facts.add(fid);
        }
    };
    for (const f of data.facts) {
        if (f.attr === 'tells') continue;
        add(prov.factChains(f.id), f.id);
        if (CLAIM_ATTRS.has(f.attr) && list(f.asserts).length) add(prov.claimChains(f.id), f.id);
    }
    return { people, stmts };
})();
/** A person's links that have carried something told so far. */
const sourceLinks = (p) => [...(sourceTree.people.get(p)?.values() ?? [])].filter((x) => [...x.facts].some((id) => visible(factById.get(id)))).map((x) => x.link);
/** The entries a link carried (all of them: for what a setting reaches). */
const statementsUnder = (key) => { for (const m of sourceTree.people.values()) if (m.has(key)) return [...m.get(key).facts]; return []; };
// --- A witness's record (docs/authored-stories.md, finding 112): of the statements that start with one source, how
// many are confirmed and how many stand alone against what is confirmed (an open clash); and how many of those that
// came from them the player has ruled out. It is shown where it matters and sets nothing; its one effect is that a
// link to something else from a source with a statement ruled out no longer trusts it by itself (`toggleLink`).
const stmtOwner = new Map([...sourceTree.stmts.entries()].flatMap(([p, ks]) => [...ks].map((k) => [k, p])));
const contentChains = (f) => (CLAIM_ATTRS.has(f.attr) && list(f.asserts).length ? claimChains(f.id) : chainsOf(f));
const isStatement = (f) => !!f && !f.reasoned && !f.hyp && f.attr !== 'tells';
/** The people an entry came from: whose statement it is, and whoever passed it on (not a narrator's narration). */
const cameFrom = (f) => (isStatement(f) ? [...new Set(contentChains(f).flatMap((c) => c.links.filter((l) => !l.narrator && l.how !== 'member').map((l) => l.from)))].filter((p) => p && p !== '?') : []);
/**
 * Whom a statement ruled out is laid to: the one whose statement it is, where the statement itself is ruled out;
 * else whoever's paper, telling or word it came by is (a word altered on the way is the carrier's, not the speaker's).
 */
function laidTo(f) {
    const out = new Set();
    for (const c of contentChains(f)) {
        const own = c.links.find((l) => l.stmt), set = own ? state.trust.links[linkKey(own)] : null;
        if (set === RULED_OUT) out.add(own.from);
        else if (set == null) for (const l of c.links) if (!l.narrator && !l.stmt && l.how !== 'member' && hopLevel(l, state.trust) === RULED_OUT) out.add(l.from);
    }
    return out;
}
const stmtLevel = (f) => (CLAIM_ATTRS.has(f.attr) && list(f.asserts).length ? levelOf(claimChains(f.id), state.trust) : levelOfFact(f));
let againstNow = new Set();   // the statements that stand alone against what is confirmed, at the last drawing
/** A source's record, without one statement (`except`: the one it is shown beside). */
function recordOf(p, except = null) {
    const own = [...(sourceTree.stmts.get(p) ?? [])].map((k) => factById.get(k.slice(5))).filter((f) => f && f.id !== except && visible(f));
    const out = data.facts.filter((f) => isStatement(f) && f.id !== except && visible(f) && stmtLevel(f) === RULED_OUT && laidTo(f).has(p)).length;
    return { n: own.length, out, confirmed: own.filter((f) => stmtLevel(f) === CONFIRMED).length, against: own.filter((f) => stmtLevel(f) !== RULED_OUT && againstNow.has(f.id)).length };
}
const recordText = (r) => [r.out ? `${r.out} ruled out` : '', r.against ? `${r.against} against what is confirmed` : '', r.confirmed ? `${r.confirmed} confirmed` : ''].filter(Boolean).join(', ');
/** Beside one statement: what the records of those it came from say of the rest, or nothing. */
const recordNote = (f) => cameFrom(f).map((p) => [p, recordText(recordOf(p, f.id))]).filter(([, t]) => t).map(([p, t]) => `of what else came from ${esc(nameOf(p))}: ${t}`).join('; ');
/** The sources an entry came from that have something else ruled out: a link does not trust it by itself. */
const shownFalse = (f) => cameFrom(f).filter((p) => recordOf(p, f.id).out > 0);
/** A source's record as a line, for its own page and its card. */
function recordLine(p) {
    const r = recordOf(p), t = recordText(r);
    if (!r.n && !r.out) return '';
    return `<p class="small record-line">Record so far${r.n ? `, of ${r.n} statement${r.n === 1 ? '' : 's'} of their own` : ''}: ${t || 'nothing confirmed and nothing ruled out'}.${r.out ? ' <span class="muted">With something ruled out, a link to anything else that came from them does not trust it by itself.</span>' : ''}</p>`;
}
/** Set a link's level (null: not set). A link that carries statements sets them all: their own settings are taken back. */
function setLink(tr, key, level) {
    if (level == null) delete tr.links[key]; else tr.links[key] = level;
    for (const id of statementsUnder(key)) delete tr.links[`stmt:${id}`];
}
/** Set a person's level (null: not set): everything they said is at it, so the settings of their links and statements are taken back. */
function setPerson(tr, p, level) {
    if (level == null) delete tr.people[p]; else tr.people[p] = level;
    for (const k of sourceTree.people.get(p)?.keys() ?? []) { delete tr.links[k]; for (const id of statementsUnder(k)) delete tr.links[`stmt:${id}`]; }
    for (const k of sourceTree.stmts.get(p) ?? []) delete tr.links[k];
}
/** A link in words: a telling as the timeline says it (a paper by its title), a speech as who said it to whom. */
function linkName(key) {
    const f = factById.get(key);
    if (f) {
        const file = fileById.get(parseRef(refList(f.para)[0] ?? '')?.story);
        return file ? `“${file.title}”` : `“${phrase(f).replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim()}”`;
    }
    const m = key.match(/^(said|member):([^>]+)>(.+)$/);
    return m ? (m[1] === 'said' ? `what ${nameOf(m[2])} says to ${nameOf(m[3])}` : `${nameOf(m[2])} as one of ${nameOf(m[3])}`) : key;
}
/** The levels of what a source carried, counted: "3 likely, 2 uncertain". */
function levelCounts(ids) {
    const fs = ids.map((id) => factById.get(id)).filter((f) => f && visible(f));
    const by = [4, 3, 2, 1, 0].map((l) => [l, fs.filter((f) => levelOfFact(f) === l).length]).filter(([, k]) => k);
    return by.map(([l, k]) => `${k} ${LEVELS[l]}`).join(', ');
}
/** The top of the list: each narrator, and each person whose words have reached the reader, with their level. */
function sourcesPanel() {
    const people = [...sourceTree.people.keys()].filter((p) => sourceLinks(p).length);
    if (!people.length) return '';
    const narr = data.narrators.map((n) => `<li>${dot(narrationLevel(n.id))}${esc(n.name ?? 'The narrator')} <span class="small muted">as narrator: what they saw themselves</span> <select class="narration-trust" data-key="${esc(linkKey(narrationLink(n)))}" data-base="${narrationLink(n).base}">${levelOpts(narrationLevel(n.id), null, true)}</select></li>`).join('');
    const rows = people.map((p) => {
        const ids = [...new Set(sourceLinks(p).flatMap((l) => statementsUnder(linkKey(l))))];
        return `<li class="${state.sel === `src:${p}` ? 'sel' : ''}">${personStep(p)} <span class="small muted">${levelCounts(ids)}${recordOf(p).against ? `; ${recordOf(p).against} against what is confirmed` : ''}</span></li>`;
    }).join('');
    return `<details class="cards-box sources-box" id="sources-box"${state.sourcesOpen || layoutNow() !== 'three' ? ' open' : ''}><summary>Sources (${people.length})</summary><ul class="sources-list">${narr}${rows}</ul>
      <p class="small muted">Who told you what, and how far you trust each. Setting a level here sets everything that one said; a name opens what they said, one layer down.</p></details>`;
}
/** A source opened: a person's links, each with its level; or one link (`link:<key>`), the entries it carried. */
function sourceDetail(id) {
    const entries = (key) => { const fs = statementsUnder(key).map((x) => factById.get(x)).filter((f) => f && visible(f)).sort((a, b) => byRead(givenAt(a), givenAt(b))); return `<ul class="events source-entries">${fs.map((f) => { const k = stmtKeyOf(f); return eventRow(f, new Set()).replace(/<\/li>$/, `${k ? ` <select class="link-trust" data-key="${esc(k)}" title="How far you trust this one statement">${levelOpts(state.trust.links[k] ?? null, 'not set: as it came', earned(k))}</select>` : ''}</li>`); }).join('')}</ul>`; };
    if (id.startsWith('link:')) {
        const key = id.slice(5), from = [...sourceTree.people.entries()].find(([, m]) => m.has(key));
        if (!from) return '<p class="muted">Nothing here.</p>';
        const l = from[1].get(key).link;
        return `<h2>${esc(linkName(key))}</h2><p class="small"><a class="link" data-src="${esc(from[0])}">← ${esc(nameOf(from[0]))}</a></p>
          <p class="small stmt-line">${linkStep(l, 'Everything it says:', 'How far you trust everything that came this way: setting it sets all of it', null)}</p>
          <h3>What it says</h3>${entries(key)}`;
    }
    const links = sourceLinks(id);
    if (!links.length) return `<h2>${esc(nameOf(id))}</h2><p class="muted">Nothing of theirs has reached you yet.</p>`;
    return `<h2>${esc(nameOf(id))}, as a source</h2>
      <p class="small">${personStep(id)} <a class="ent" data-ent="${esc(id)}">their card</a></p>
      ${recordLine(id)}
      <p class="small muted">Setting a level sets everything below it. The most specific setting wins: a statement's own, else its paper's or telling's, else the person's, else uncertain.</p>
      <h3>What came from them</h3><ul class="sources-list">${links.map((l) => `<li>${dot(levelOf([{ links: [l] }], state.trust))}<a class="link" data-src="link:${esc(linkKey(l))}">${esc(linkName(linkKey(l)))}</a> <select class="link-trust" data-key="${esc(linkKey(l))}" title="How far you trust everything that came this way">${levelOpts(state.trust.links[linkKey(l)] ?? null, `not set: as ${nameOf(id)}`)}</select> <span class="small muted">${levelCounts(statementsUnder(linkKey(l)))}</span>${links.length === 1 ? entries(linkKey(l)) : ''}</li>`).join('')}</ul>`;
}

function sideHtml(x, label) {
    if (x.by === DERIVED) {
        const ids = supportIds(x.derived).filter((id) => derivedNow.some((d) => d.id === id));
        const under = [...new Set(ids.flatMap((id) => groundsOf(id)))].map((id) => factOf(id)).filter(Boolean);
        return `<div class="side"><h3>${label}</h3><p><a class="link" data-q="${esc(x.q)}">${followText(x)}</a>${x.kind === 'state' ? sideTime(x.time) : ''}</p>
      <p class="small">From the evidence you have linked. Held: <b>${levelName(derivedLevel(x))}</b>, as its weakest step. Lower your trust in a premise, and it goes.</p>
      <ul class="follows-list">${ids.map((id) => `<li class="follows"><span class="arrow">⇒</span> ${esc(derivedNow.find((d) => d.id === id).says)}.</li>`).join('')}</ul>
      <ul class="events">${under.map((p) => eventRow(p, new Set())).join('')}</ul></div>`;
    }
    const chains = chainsOfAssertion(x);
    const r = { ...resolvingLinks(chains, state.trust), drop: dropCounts(chains) };
    if (x.mark) {
        return `<div class="side"><h3>${label}</h3><p><a class="link" data-q="${esc(x.q)}">${x.kind === 'state' ? typedMarkText(x) + sideTime(x.time) : markText(x)}</a></p>
      <p class="small">Trusted: <b>${levelName(levelOf(chains, state.trust))}</b>. Change the mark, or lower your trust in it.</p>
      ${stmtHtml(chains, r)}<ul class="chains">${chains.map((c) => chainHtml(c, r)).join('')}</ul>${peopleHtml(chains, r)}</div>`;
    }
    const f = factOf(x.fact);
    if (f.reasoned) {
        return `<div class="side"><h3>${label}</h3><p><a class="link" data-fact="${esc(f.id)}">${phrase(f)}</a>${sideTime(x.time ?? f.time)}</p>
      <p class="small">From your reasoning. Held: <b>${levelName(levelOfFact(f))}</b>, as its weakest premise. Lower your trust in a premise, or withdraw it.</p>
      <ul class="events">${f.reasoned.premises.map((id) => factOf(id)).filter(Boolean).map((p) => eventRow(p, new Set())).join('')}</ul></div>`;
    }
    const what = x.kind === 'pick'
        ? `${x.claim ? `${ent(f.of)} ${f.attr === 'believes' ? 'believes' : 'says'}: ` : wordOf(f)}${x.neg ? 'not ' : ''}${pickText(qById.get(x.q), x.pick)}`
        : statePhrase(x, f);
    return `<div class="side"><h3>${label}</h3><p><a class="link" data-fact="${esc(f.id)}">${what}</a>${x.kind === 'pick' ? '' : sideTime(x.time ?? f.time)}</p>
      <p class="quote">“${esc(f.given_quote ?? f.quote)}” ${paraSpan(givenAt(f))}</p>
      <p class="small">Trusted: <b>${levelName(levelOf(chains, state.trust))}</b>${!counts(levelOf(chains, state.trust)) ? '' : r.links.length || r.people.length ? '; <span class="resolving">marked</span>: ruling it out alone stops this side counting' : '; no single link stops it counting: it has independent chains'}.</p>
      <p class="small quick-trust">${quickTrust(f, [CONFIRMED, LIKELY_LEVEL, UNLIKELY, RULED_OUT])}</p>
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
 * whose false facts told so far are all held unlikely or ruled out, or a claim whose false assertions are.
 */
function doubtOf(id) {
    const f = factById.get(id);
    if (!f) return 'none';
    if (CLAIM_ATTRS.has(f.attr)) return allAssertions.some((x) => x.claim === id && x.truth === false) && levelOf(claimChains(id), state.trust) <= UNLIKELY ? 'all' : 'none';
    if (f.attr !== 'tells') return 'none';
    const lies = liesOf(f);
    const off = lies.filter((x) => levelOfFact(x) <= UNLIKELY).length;
    return !lies.length || !off ? 'none' : off === lies.length ? 'all' : 'some';
}
/** The false facts a telling carried, told so far. */
function liesOf(f) {
    const told = new Set(list(f.value));
    return data.accounts.filter((a) => told.has(a.id) || [...prov.ancestors(a.id)].some((p) => told.has(p)))
        .flatMap((a) => list(a.facts)).map((x) => factById.get(x)).filter((x) => x && x.truth === false && seen(givenAt(x)));
}
/** How strong a disbelieved statement is as evidence: ruled out, its being false is confirmed; held unlikely, likely. */
function doubtLevel(id) {
    const f = factById.get(id);
    const ls = !f ? [] : CLAIM_ATTRS.has(f.attr) ? [levelOf(claimChains(id), state.trust)] : liesOf(f).map((x) => levelOfFact(x));
    return ls.length && ls.every((l) => l === RULED_OUT) ? CONFIRMED : LIKELY_LEVEL;
}
const doubted = (id) => doubtOf(id) === 'all';
/** A telling some, not all, of whose false facts told so far are off the timeline: a lie half disbelieved. */
const partlyDoubted = (id) => doubtOf(id) === 'some';
/** What counts now: told so far and trusted as likely or confirmed, with the player's own entries. */
const onTimeline = () => allFacts().filter((f) => f.attr !== 'tells' && visible(f) && accepted(f));
/**
 * What a record holds, for its gaps: what counts, and an entry of a series that is still uncertain too. A gap is a
 * time the record has nothing at; an entry not yet trusted is in the record all the same.
 */
const recordNow = () => [...onTimeline(), ...data.facts.filter((f) => f.series && typeof f.series === 'string' && visible(f) && levelOfFact(f) === UNCERTAIN)];
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
/**
 * Move (m) on a rule of a regular series, or on an entry of its record: "Something is missing here", one button for
 * each time the rule names at which the record on the timeline has nothing.
 */
function gapMoveHtml(f) {
    const rule = f.series && typeof f.series === 'object' ? f : typeof f.series === 'string' ? factOf(f.series) : null;
    if (!rule) return '';
    const on = onTimeline();
    if (!on.some((e) => e.id === rule.id)) return '';
    const done = (t) => state.reasoning.some((m) => m.move === 'm' && m.of === rule.id && m.at === t);
    // A gap is a gap only once the record is read through: while a paper that holds entries of it is half read,
    // every hour not yet reached would look missing.
    const unread = [...new Set(data.facts.filter((e) => e.series === rule.id).map((e) => parseRef(givenAt(e))?.story))].filter((sid) => sid && sid !== MAIN && reading.readTo(sid) < lastOf(sid));
    const gaps = unread.length ? [] : gapsOf(rule, recordNow());
    const record = on.filter((e) => e.series === rule.id && !e.neg).sort((a, b) => rankOf(anchorOf(a.time)) - rankOf(anchorOf(b.time)));
    const items = gaps.map((t) => `<li>${done(t) ? `<span class="small muted">pointed out:</span> nothing at ${timeLabel(t)}` : `<button type="button" class="move" data-move-m="${esc(rule.id)}" data-at="${esc(t)}">Something is missing here: at ${timeLabel(t)}</button>`}</li>`).join('');
    const said = record.length ? `on the timeline at ${record.map((e) => timeLabel(anchorOf(e.time))).join('; ')}` : 'nothing on the timeline records it yet';
    return `<h3>A regular series</h3><p class="small">${rule === f ? 'The rule names' : `A rule (${phrase(rule)}) names`} ${list(rule.series.at).length} times; ${said}.</p>${unread.length ? `<p class="small muted">Read ${unread.map((sid) => esc(fileById.get(sid)?.title ?? sid)).join(' and ')} to the end to see whether anything is missing.</p>` : ''}${items ? `<ul class="moves">${items}</ul>` : ''}`;
}
/** Move (b) on a typed action: what it needs just before and does just after, each with what the timeline says. */
function implicationsHtml(f) {
    if (!list(f.act).length || f.neg) return '';
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
        .filter((g) => g && g.id !== except && placeCtx.same(g.of, agent) && counts(markLevel(g.hyp.q, g.hyp.pick)));
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
const moveKey = (m) => [m.move, m.a ?? m.of, m.b ?? m.for ?? m.at ?? ''].join('|');
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
        : m.move === 'a' ? `a change between ${premiseText(m.a)} and ${premiseText(m.b)}`
        : m.move === 'm' ? `something missing at ${timeLabel(m.at)}, by ${premiseText(m.of)}` : `what ${premiseText(m.of)} needs and does`;
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
/**
 * "Left to try" (Settings; the box above the questions): what the reader has not done yet, of each kind that can be
 * counted down. Reading: the story and each paper not read to its end. Reasoning moves: every move the page would
 * offer now on an entry of the timeline and that is not made (the buttons of the entry's own detail, so the list and
 * the detail cannot disagree; a move offered from either of two entries is one move). Links: for each open question,
 * the entries neither linked to it nor tried for it (counted after the timeline is drawn: untriedCounts). Answers:
 * the open questions with no answer circled. Trust is not listed: every statement can always be trusted more or less.
 */
function movesLeft() {
    const out = new Map();
    for (const f of onTimeline()) {
        if (!canReason(f)) continue;
        const html = changeMoveHtml(f) + gapMoveHtml(f) + implicationsHtml(f) + purposeHtml(f);
        for (const m of html.matchAll(/<button type="button" class="move" data-move-([abcm])="([^"]*)"(?: data-(?:with|at|for)="([^"]*)")?>/g)) {
            const [, kind, x, y] = m;
            const key = kind === 'a' ? `a|${[x, y].sort().join('|')}` : `${kind}|${x}|${y ?? ''}`;
            if (out.has(key)) continue;
            const un = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            const a = factOf(un(x)), b = y != null ? factOf(un(y)) : null;
            const at = (e) => `<a class="link" data-fact="${esc(e.id)}">${phrase(e)}</a>`;
            out.set(key, kind === 'a' ? `<b>It changed</b>: ${at(a)} <span class="muted">and</span> ${b ? phrase(b) : ''}`
                : kind === 'm' ? `<b>Something is missing here</b>, at ${timeLabel(un(y))}: ${at(f)}`
                : kind === 'b' ? `<b>What it needs and what it does</b>: ${at(a)}`
                : `<b>For this</b>: ${at(a)}`);
        }
    }
    return [...out.values()];
}
function leftHtml() {
    if (state.leftList === 'off') return '';
    const open = listedQuestions().filter((q) => !isSolved(q.id) && !givenAway(q));
    const papers = [...(state.para < LAST ? [{ id: MAIN, title: 'The story', at: state.para, last: LAST, held: gateAt(state.para + 1).length > 0 }] : []), ...unreadPapers()];
    const moves = movesLeft();
    const unmarked = open.filter((q) => circledCount(q) === 0 && !autoQ(q.id));
    const linkQs = observations && checkedLinks() ? open.filter((q) => observations.some((o) => o.q === q.id)) : [];
    const unsure = data.facts.filter((f) => f.attr !== 'tells' && visible(f) && levelOfFact(f) === UNCERTAIN);
    const n = (k, one, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;
    const part = (title, items, none) => `<h4>${title}</h4>${items.length ? `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>` : `<p class="small muted">${none}</p>`}`;
    return `<details class="q-box left-box" id="left-box"${state.leftOpen ? ' open' : ''}><summary>Left to try: ${n(papers.filter((p) => !p.held).length, 'paper')} to read · ${n(moves.length, 'move')}${linkQs.length ? ' · <span data-untried-total></span> links' : ''} · ${n(unmarked.length, 'answer')}${unsure.length ? ` · ${unsure.length} uncertain` : ''}</summary>
      ${part('Reading', papers.map((p) => `<a class="link" data-story="${esc(p.id)}">${esc(p.title)}</a> <span class="small muted">${p.at} of ${p.last} read${p.held ? '; nothing to read now: it is held until a question is answered (see the notice), and is not counted above' : ''}</span>`), 'Everything you have is read.')}
      ${part('Reasoning moves on offer', moves, 'None on offer that you have not made.')}
      ${linkQs.length ? part('Links not tried yet', linkQs.map((q) => `<a class="link" data-left-linking="${esc(q.id)}" title="Link to this question, showing only what is not tried yet">${esc(qLabel(q))}</a> <span class="small muted" data-untried-n="${esc(q.id)}"></span>`), '') : ''}
      ${part('Questions with no answer circled', unmarked.map((q) => `<a class="link" data-q="${esc(q.id)}">${esc(qLabel(q))}</a>`), 'Every open question has an answer circled.')}
      ${part('Statements still uncertain', unsure.map((f) => `<a class="link" data-fact="${esc(f.id)}">${phrase(f).replace(/<a [^>]*>|<\/a>/g, '')}</a> ${paraSpan(givenAt(f))}`), 'Nothing told so far is left uncertain.')}
      ${unsure.length ? '<p class="small muted">What is uncertain counts for nothing until you trust it; a whole person or paper can be set at once under Sources.</p>' : ''}
    </details>`;
}
function movesHtml(f) {
    const q = f.reasoned?.move === 'a' && f.of === '?' ? (questionOfChange(f) ?? qById.get(`who:${f.id}`)) : null;
    const who = q ? `<h3>Who did it? <span class="small muted">(your hypothesis)</span></h3>
      <p class="small">${q.own ? 'Your own question' : 'The question'}: <a class="link" data-q="${esc(q.id)}">${esc(qLabel(q))}</a></p>${chipsHtml(q)}${candidatesHtml(q)}` : '';
    return `${changeMoveHtml(f)}${gapMoveHtml(f)}${implicationsHtml(f)}${who}${purposeHtml(f)}${lapsedHtml(f)}${planHtml(f)}`;
}
function reasonedDetail(f) {
    const how = f.reasoned.move === 'g' ? 'Something crossed between two places, so there is a way between them.'
        : f.reasoned.move === 'r' ? 'Each link of the route is on the timeline.'
        : f.reasoned.move === 'a' ? 'Two states of one thing differ, so something changed it between them.'
        : f.reasoned.move === 'm' ? 'A rule names this time, and the record has nothing at it: something is missing here.'
        : f.reasoned.move === 'c' ? 'What it brings about meets the goal of an intention, or a need of a step toward it.'
        : f.reasoned.move === 'i' ? `It follows from the evidence you have linked: ${esc(derivedNow.find((d) => d.id === f.reasoned.imp)?.says ?? '')}.`
        : f.reasoned.role === 'requires' ? 'What an action needs just before it.' : 'What an action does.';
    const premises = f.reasoned.premises.map((id) => factOf(id)).filter(Boolean);
    const cap = { origin: REASONING, links: [{ from: REASONING, to: READER, how: 'reasoning' }] };
    return `<h2>${phrase(f)}</h2>
      <p class="small">When: ${timeLabel(anchorOf(f.time ?? {}))}${whenNote(f.time ?? {})}. From <span class="hyp-name">your reasoning</span>: ${how}
        Trusted: <b>${levelName(levelOfFact(f))}</b>, as its weakest premise.</p>
      <h3>From</h3><ul class="events">${premises.map((p) => eventRow(p, new Set())).join('')}</ul>
      ${peopleHtml([cap])}
      ${movesHtml(f)}
      ${f.reasoned.move === 'i' ? `<p class="small muted">It stays while what it follows from is on your timeline and linked${qById.has(derivedNow.find((d) => d.id === f.reasoned.imp)?.q) ? `: <a class="link" data-q="${esc(derivedNow.find((d) => d.id === f.reasoned.imp).q)}">the question</a>` : ''}.</p>` : `<p><button type="button" class="move" data-withdraw="${esc(f.id)}">Withdraw this reasoning</button></p>`}`;
}

// --- Questions: the panel, and one question in the detail.
const AUTO_TITLE = { undefined: 'Open: nothing you have shown settles it', circled: 'It follows from what you have shown', crossed: 'Ruled out by what you have shown' };
const LIKELY_TITLE = { circled: 'Likely, from what you have shown: a step on the way to it is probable, not certain', crossed: 'Unlikely, from what you have shown: not ruled out for certain' };
const MARK_TITLE = { undefined: 'Uncertain: click to circle', circled: 'Circled: click to cross out', crossed: 'Crossed out: click to make uncertain again' };
function chip(q, p) {
    const m = markOf(q, p.value);
    const judged = givenAway(q) && m ? ((m === 'circled') === isRight(q, p.value) ? ' right' : ' wrong') : '';
    const weak = autoQ(q.id) && m && likelyMarks.has(hypothesisKey(q.id, p.value));
    return `<button type="button" class="poss ${m ?? 'open'}${judged}${weak ? ' likely' : ''}" data-mark-q="${esc(q.id)}" data-mark-pick="${esc(p.value)}" title="${weak ? LIKELY_TITLE[m] : (autoQ(q.id) ? AUTO_TITLE : MARK_TITLE)[m]}">${pickText(q, p.value)}${weak ? ' <span class="small">(likely)</span>' : ''}</button>`;
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
/** The papers that have come and are not read to their end: `[{id, title, at, last}]`. */
const unreadPapers = () => files.filter((f) => delivered(f.id) && reading.readTo(f.id) < lastOf(f.id)).map((f) => ({ id: f.id, title: f.title, at: reading.readTo(f.id), last: lastOf(f.id) }));
/** Under the main story: each paper that has come and is not read to its end, with a button to open it. */
function paperNotes() {
    if (state.story !== MAIN) return '';
    return unreadPapers().map((p) => `<p class="paper-note small">${p.at ? 'A paper not read to its end' : 'A paper has come'}: <b>${esc(p.title)}</b> (${p.at} of ${p.last} read). <button type="button" class="quiet" data-story="${esc(p.id)}">Open it</button></p>`).join('');
}
function storyTabsHtml() {
    if (!files.length) return '';
    const tab = (id, title) => {
        const at = reading.readTo(id), last = lastOf(id);
        return `<button type="button" class="story-tab${state.story === id ? ' on' : ''}${!at ? ' unread' : ''}" data-story="${esc(id)}" title="${at ? `Read to ¶${at} of ${last}` : 'Not read yet'}">${esc(title)} <span class="small muted">${at}/${last}</span></button>`;
    };
    const shown = files.filter((f) => delivered(f.id));
    const waiting = files.length - shown.length;
    // Papers earned by solving questions: how each came, and nothing about how many are still out or where they are.
    if (EARNED) {
        const how = (f) => { const by = cameBy(f.id); return by === 'start' ? 'in hand from the start' : by && qById.has(by) ? `${f.reply != null ? 'the reply to' : 'brought by solving'} <a class="link" data-q="${esc(by)}">${esc(qLabel(qById.get(by)))}</a>` : ''; };
        return `<div class="story-tabs" role="tablist">${tab(MAIN, 'The story')}${shown.map((f) => tab(f.id, f.title)).join('')}</div><details class="papers-box small"><summary>The papers (${shown.length})</summary><ul>${shown.map((f) => `<li><b>${esc(f.title)}</b>: ${how(f)}</li>`).join('')}</ul><p class="muted">More papers come as you solve questions.</p></details>`;
    }
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
      ${sourceLinks(id).length ? `<p class="small">As a source: ${personStep(id)}</p>${recordLine(id)}` : ''}
      ${qs.length ? `<h3>Questions about it</h3><ul class="card-qs">${qs.map((q) => `<li><a class="link" data-q="${esc(q.id)}">${esc(qLabel(q))}</a> ${paraSpan(q.raised ?? q.answer_given_at)}</li>`).join('')}</ul>` : ''}
      ${spots.length ? `<details class="mentions" id="mentions-box"${state.mentionsOpen ? ' open' : ''}><summary>Where the story mentions it (${spots.length})</summary><ul class="said">${said}</ul></details>` : ''}
      <h3>Its timeline</h3>${eventList((f) => f.of === id, clashing, (q) => q.entry?.of === id)}`;
}

function questionsPanel(clashing) {
    const { above, below } = arranged();
    const qs = [...above, ...below];
    if (!qs.length) return '';
    const item = (q, i) => `<li value="${i + 1}" data-q-row="${esc(q.id)}" class="${state.sel === `q:${q.id}` ? 'sel' : ''}${clashing.has(`q:${q.id}`) ? ' clash' : ''}"><span class="q-grip" role="button" tabindex="0" aria-label="Move this question: drag it, or use the up and down arrow keys" title="Drag to move (or the arrow keys)">≡</span><button type="button" class="q-top" data-q-top="${esc(q.id)}" aria-label="Move to the top" title="To the top">↑</button> <a class="link" data-q="${esc(q.id)}">${esc(qLabel(q))}</a>${isSolved(q.id) ? ' <span class="solved-mark" title="Solved: the evidence linked and the right answer circled">✓ solved</span>' : ''} ${paraSpan(q.raised ?? q.answer_given_at)}${qAnchor(q) ? '' : ' <span class="small muted" title="Its entry has no place in time: it is only here">(no time)</span>'}
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
        // A need a contradiction already sets against the timeline (an alibi; a knot she cannot tie) says so here too.
        const c = current.find((y) => y.b?.req === req.id);
        if (c) return `<li>${phrase(req)} <span class="bad small">against: the timeline has ${phrase(factOf(c.a.fact) ?? c.a)} (a contradiction)</span></li>`;
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
    return !!q && markOf(q, x.pick) === 'circled' && possShown(q, x.pick) && counts(markLevel(q.id, x.pick));
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
        const open = currentAll.find((c) => clashKey(c) === sel);
        const [a, b, via] = sel.slice(6).split('|').map((id) => assertionById.get(id));
        const c = open ?? { a, b, via };
        // A side that is no assertion any more (what it rested on was distrusted): nothing of it is left to show.
        if (!c.a || !c.b) el.innerHTML = '<h2>A contradiction</h2><p class="small good">Resolved: one side no longer counts.</p>';
        else el.innerHTML = `<h2>${clashTitle(c)}</h2>
          <p class="small ${open ? (clashLevel(c) >= CONFIRMED ? 'bad' : 'muted') : 'good'}">${!open ? 'Resolved: one side no longer counts.' : clashLevel(c) >= CONFIRMED ? 'Both sides are confirmed: they cannot both hold.' : [c.a, c.b, c.via].filter((x) => x && (sideLevel.get(x.id) ?? CONFIRMED) < CONFIRMED).length === 1 ? 'Against what is confirmed: the side that is not confirmed cannot be so.' : clashLevel(c) === LIKELY_LEVEL ? 'Unlikely together: they cannot both hold, and neither is confirmed.' : 'They cannot both be so, and it is undecided: one side at least is still uncertain.'}</p>
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
          <p class="small">When: ${timeLabel(anchorOf(f.time ?? {}))}${whenNote(f.time ?? {})}. Trusted: <b>${levelName(levelOfFact(f))}</b>.${recordNote(f) ? ` <span class="muted">(${recordNote(f).replace(/^o/, 'O')}.)</span>` : ''}</p>
          ${f.attr === 'tells' ? toldHtml(f)
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
    if (sel?.startsWith('src:')) { el.innerHTML = noteHtml() + sourceDetail(sel.slice(4)); return; }
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
// Solved (docs/authored-stories.md, "The delivery mechanism", decision 1): the strict judgement, whatever the gate's
// setting: exactly one answer circled, every essential observation filled, the circled answer right. 'pick',
// 'evidence', 'wrong' (the evidence complete: "not this answer"), or null (it holds).
function judgement(q) {
    // Answers from the evidence: the question is answered when its answer follows from what is shown.
    if (autoQ(q.id)) { const v = verdictOf(q); return v.concluded == null ? 'evidence' : isRight(q, v.concluded) ? null : 'wrong'; }
    const picks = shownPossibilities(q).filter((o) => markOf(q, o.value) === 'circled');
    if (picks.length !== 1) return 'pick';
    const d = evidenceOf(q);
    if (!d.any || !d.done) return 'evidence';
    return isRight(q, picks[0].value) ? null : 'wrong';
}
// Why a question with evidence to link is not solved yet, in words: its circle, and how much of its evidence is in
// place (linked, or a question it rests on solved); with part of the evidence not on the page yet (a paper not come,
// a paragraph not read), that is said in place of the count, which no linking could raise to the full.
const hasFact = (id) => { const f = factById.get(id); return !!f && visible(f); };
const evidenceHere = (q) => { const r = onPage(observations, q.id, hasFact); return r.here === r.all; };
const restsOpen = (q) => [...new Set(observations.filter((o) => o.q === q.id && o.essential).flatMap((o) => o.from.filter((e) => e.solved).map((e) => e.solved)))].filter((id) => !isSolved(id));
/** A question that can be solved from what the reader has now: its evidence on the page, what it rests on solved. */
const workable = (q) => !isSolved(q.id) && !givenAway(q) && evidenceOf(q).any && evidenceHere(q) && !restsOpen(q).length;
function unsolvedWhy(q) {
    if (autoQ(q.id)) {
        const v = verdictOf(q), all = shownPossibilities(q).length;
        const offA = state.links.some((l) => l.q === q.id && untrusted(factOf(l.entry), q.id)) ? '; something you linked does not count until you trust it' : '';
        return `no answer follows yet from what you have linked${v.ruled.size ? `; ${v.ruled.size} of its ${all} answers ruled out` : ''}${offA}`;
    }
    const n = circledCount(q), d = evidenceOf(q);
    const all = observations.filter((o) => o.q === q.id && o.essential).length;
    const circle = n === 0 ? 'no answer circled' : n === 1 ? 'one answer circled' : `${n} answers circled (it takes exactly one)`;
    const evidence = !evidenceHere(q) ? 'some of its evidence is not on the page yet'
        : d.done ? 'all of its evidence is in place'
        : `${all - d.missing.length} of ${all} pieces of its evidence in place${restsOpen(q).length ? ' (a question it rests on counts as one)' : ''}`;
    const off = state.links.some((l) => l.q === q.id && untrusted(factOf(l.entry), q.id)) ? '; something you linked does not count until you trust it' : '';
    return `${circle}; ${evidence}${off}`;
}
let solvedNews = [];      // the questions just solved, until the notice is dismissed
const confirmed = {};     // how many statements each of them confirmed, for the notice
/**
 * After every move, every question the player can see is judged; the moment the judgement holds it is solved for
 * good: its circle is kept (Undo and distrust do not take it back), the story's other proposals are crossed out, and
 * a larger question resting on it fills that evidence by itself (so the judgement runs again until nothing changes).
 */
let trying = false;       // a move only tried and taken back (the hints, the checks): nothing is judged meanwhile
function judge() {
    if (!observations || trying) return;
    let fresh = false;
    for (let more = true; more;) {
        more = false;
        for (const q of data.questions) {
            if (isSolved(q.id) || !qListed(q) || givenAway(q) || judgement(q) !== null) continue;
            const pick = shownPossibilities(q).find((o) => markOf(q, o.value) === 'circled').value;
            const marks = { [pick]: 'circled' };
            for (const o of shownPossibilities(q)) if (o.value !== pick && (o.proposed || markOf(q, o.value))) marks[o.value] = 'crossed';
            state.marks = { ...state.marks, [q.id]: marks };
            state.solved = { ...state.solved, [q.id]: { pick, marks, n: Object.keys(state.solved).length + 1 } };
            solvedNews = [...solvedNews, q.id];
            if (linkingQ === q.id) linkingQ = null;   // a solved question needs no more links: the linking ends, so the next link is not made to it unawares
            confirmed[q.id] = confirmBy(q.id);
            more = fresh = true;
        }
        if (more) { observed = fillNow(); follow(); }
    }
    if (fresh) save();
}
function gateState(q) {
    if (isSolved(q.id)) return null;
    if (autoQ(q.id)) return judgement(q);
    const picks = shownPossibilities(q).filter((o) => markOf(q, o.value) === 'circled');
    if (circledCount(q) !== 1) return 'pick';
    const d = evidenceOf(q);
    if (!strictGate() || !d.any) return null;
    if (!d.done) return 'evidence';
    return picks.length === 1 && isRight(q, picks[0].value) ? null : 'wrong';
}
// The ending (earned papers): the main story from `delivery.ending` on is held until the goal is solved.
const ENDING = EARNED ? endingOf(header, LAST) : null;
const goalQ = EARNED ? data.questions.find((q) => q.id === header.delivery.goal) : null;
const gateAt = (p) => atPara(p - 1, () => {
    const held = GATED.filter((q) => q.answer_given_at === p && qListed(q) && gateState(q) !== null);
    return ENDING != null && p >= ENDING && goalQ && !held.includes(goalQ) && gateState(goalQ) !== null ? [...held, goalQ] : held;
});
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
        // Marked from the evidence: no count of pieces (an answer can follow more than one way, and the count is
        // of the pieces asked for when answers are marked by hand).
        if (autoQ(q.id)) return unsolvedWhy(q);
        const n = circledCount(q), d = evidenceOf(q), s = gateState(q);
        if (s === 'pick') return n === 0 ? 'nothing circled yet' : `${n} circled`;
        if (s === 'evidence') {
            const all = observations.filter((o) => o.q === q.id && o.essential).length;
            // Begun: an essential observation of several entries with some of them linked (not saying which).
            const begun = observed.partial.filter((x) => x.obs.q === q.id && x.obs.essential).length;
            return `its evidence is not all linked yet: ${all - d.missing.length} of ${all}${begun ? `, and ${begun} more begun` : ''}`;
        }
        return 'the evidence is linked, and it does not lead to the answer you circled';
    };
    const strict = strictGate() && qs.some((q) => evidenceOf(q).any), loose = qs.some((q) => !strictGate() || !evidenceOf(q).any);
    const rule = !strict ? `Commit first: circle exactly one answer${qs.length === 1 ? '' : ' for each'}. Any answer will do; the key shows at ¶${state.para + 1}.`
        : qs.every((q) => autoQ(q.id)) ? 'The story goes on once you have shown the answer: link the evidence for it (“Link observations…”) until an answer follows from what you have linked.'
        : `The story goes on once you have shown the answer: link the evidence for it (“Link observations…”) and circle the one answer the evidence leaves${loose ? '. A question with no evidence to link takes any one answer' : ''}.`;
    // The held ending (earned papers), while the goal cannot be solved from what the reader has: the notice says what
    // the ending waits for and which questions can be solved now, not a count of the goal's evidence that no linking
    // could raise (most of it is in papers not come yet).
    const far = EARNED && goalQ && qs.includes(goalQ) && state.para + 1 >= ENDING && !workable(goalQ) && judgement(goalQ) !== 'wrong';
    const rest = far ? qs.filter((q) => q !== goalQ) : qs;
    const qLink = (q) => `<a class="link" data-q="${esc(q.id)}">${esc(qLabel(q))}</a>`;
    const open = far ? listedQuestions().filter((q) => q !== goalQ && !isSolved(q.id) && !givenAway(q) && evidenceOf(q).any) : [];
    const now = open.filter(workable);
    const farHtml = !far ? '' : `<p><b>The ending is held</b> until the case's main question is solved: ${qLink(goalQ)}${/[?!.]$/.test(qLabel(goalQ)) ? '' : '.'} It cannot be solved yet: ${restsOpen(goalQ).length ? 'it rests on other questions that are not solved' : 'some of its evidence is not on the page yet'}. Solve the smaller questions first: each one solved may bring a new paper.</p>
      ${now.length ? `<p class="small">${open.length} question${open.length === 1 ? '' : 's'} raised so far ${open.length === 1 ? 'is' : 'are'} not solved. ${now.length === open.length ? (open.length === 1 ? 'All its evidence is' : 'All their evidence is') : now.length === 1 ? 'This one has all its evidence' : `These ${now.length} have all their evidence`} on the page now:</p><ul class="ending-open">${now.map((q) => `<li>${qLink(q)} <span class="small muted">(${unsolvedWhy(q)})</span></li>`).join('')}</ul>`
        : open.length ? `<p class="small">${open.length} question${open.length === 1 ? '' : 's'} raised so far ${open.length === 1 ? 'is' : 'are'} not solved, and none has all its evidence on the page: read the papers you have to their ends.</p>` : ''}`;
    el.innerHTML = `${rest.length ? `<p><b>Before ¶${state.para + 1}</b>, the story gives away the answer to ${rest.length === 1 ? 'this question' : `these ${rest.length} questions`}. ${rule}</p>
      <ul>${rest.map((q) => `<li>${qLink(q)} <span class="small muted">(${count(q)})</span></li>`).join('')}</ul>` : ''}${farHtml}
      ${unreadPapers().length ? `<p class="small">Papers not read to their end: ${unreadPapers().map((p) => `${esc(p.title)} (${p.at} of ${p.last})`).join('; ')}. Their tabs are in the Story panel.</p>` : ''}
      ${rest.some((q) => gateState(q) === 'evidence') ? '<p class="small">One event can be evidence for more than one question: one you have linked to another question may be needed for this one too.</p>' : ''}
      <p>${AUTOPLAY === null ? '<button type="button" class="quiet" data-hint>Hint</button> ' : ''}<button type="button" class="quiet" data-gate-hide>Hide</button></p>`;
    if (flashGate) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); flashGate = false; }
}
/** What solving a question brought: a paper (with a button to open it), or nothing new. */
function broughtHtml(qid, button = true) {
    if (qid === logic?.goal) return 'The case is solved: the end of the story can be read.';
    const p = source.brought(qid), r = replyOf.get(qid);
    const open = (id) => (button ? ` <button type="button" class="quiet" data-story="${esc(id)}">Open it</button>` : '');
    const stop = button ? '' : '.';
    const reply = r ? `It was answered: <b>${esc(r.title)}</b>${stop}${open(r.id)}` : '';
    const paper = p ? `It brought: <b>${esc(fileById.get(p)?.title ?? p)}</b>${stop}${open(p)}` : EARNED ? 'It brought nothing new.' : '';
    return [reply, paper].filter(Boolean).join(button ? '<br>' : ' ');
}
function renderSolved() {
    const el = document.getElementById('solved-news');
    if (!el) return;
    const qs = solvedNews.map((id) => qById.get(id)).filter(Boolean);
    el.hidden = !qs.length;
    if (!qs.length) return;
    el.innerHTML = `<ul>${qs.map((q) => `<li><b>Solved.</b> <a class="link" data-q="${esc(q.id)}">${esc(qLabel(q))}</a>: ${pickText(q, state.solved[q.id].pick)}${EARNED ? `<br>${broughtHtml(q.id)}` : ''}${confirmed[q.id] ? `<br><span class="small">What it rested on is now confirmed (${confirmed[q.id]} statement${confirmed[q.id] === 1 ? '' : 's'}).</span>` : ''}</li>`).join('')}</ul><p><button type="button" class="quiet" data-solved-close>Dismiss</button></p>`;
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
document.getElementById('grey-clash').addEventListener('change', (e) => { state.greyClash = e.target.value; save(); render(); });
document.getElementById('only-moves').addEventListener('change', (e) => { state.onlyMoves = e.target.value === 'moves'; save(); render(); });
document.getElementById('view').addEventListener('change', (e) => { state.view = e.target.value; save(); render(); });
document.getElementById('depth').addEventListener('change', (e) => { state.depth = Number(e.target.value); save(); render(); });
// An unread paper's own button: the same as Read on (a blind solver took the empty view for a paper that would not open).
document.addEventListener('click', (e) => { if (e.target.closest('[data-read-first]')) document.getElementById('next').click(); });
document.getElementById('hide-out').addEventListener('change', (e) => { state.hideOut = e.target.checked; save(); render(); });
document.getElementById('reset').addEventListener('click', () => {
    if (!confirm('Take back every level of trust you have set (what others say goes back to uncertain, each narrator to the story\'s default)?')) return;
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
        const keep = Object.fromEntries(['layout', 'panels', 'theme', 'hintWait', 'gate', 'linkRule', 'leftList', 'answerRule', 'hideOut', 'greyClash'].filter((k) => state[k] != null).map((k) => [k, state[k]]));
        localStorage.setItem(PLAYER_STORE, JSON.stringify(keep));
        localStorage.removeItem(AUTOPLAY_STORE);
    } catch { /* nothing saved to clear */ }
    location.reload();
});
document.addEventListener('toggle', (e) => {
    if (e.target.id === 'q-box') { state.qOpen = e.target.open; save(); }
    if (e.target.id === 'left-box') { state.leftOpen = e.target.open; save(); }
    if (e.target.id === 'cards-box') { state.cardsOpen = e.target.open; save(); }
    if (e.target.id === 'sources-box') { state.sourcesOpen = e.target.open; save(); }
    if (e.target.id === 'mentions-box') state.mentionsOpen = e.target.open;   // for this visit only
}, true);
document.getElementById('undo').addEventListener('click', () => {
    if (!state.history.length) return;
    const h = JSON.parse(state.history.at(-1));
    if (h.trust) { state.trust = h.trust; state.marks = h.marks ?? {}; state.reasoning = h.reasoning ?? []; state.held = h.held ?? []; state.room = h.room ?? freshRoom(); /* a move only tried (the hints, the checks) is taken back whole */ const fixed = checkedLinks() && !trying ? state.links.filter((l) => bearsOn(l.entry, l.q)) : []; state.links = [...(h.links ?? []), ...fixed.filter((l) => !(h.links ?? []).some((x) => x.entry === l.entry && x.q === l.q))]; } else state.trust = h;
    // Solved is for good: Undo does not take it back, nor the marks it locked.
    for (const [qid, sv] of Object.entries(state.solved)) state.marks = { ...state.marks, [qid]: { ...(state.marks[qid] ?? {}), ...sv.marks } };
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
        const ln = e.target.closest('[data-left-linking]');
        if (ln) { linkingQ = ln.dataset.leftLinking; linkOnlyNew = true; reveal('timeline', panelFrom(e)); render(); return; }
        const st = e.target.closest('[data-linking]');
        if (st) { linkingQ = st.dataset.linking; reveal('timeline', panelFrom(e)); render(); return; }
        if (e.target.closest('[data-linking-done]')) { linkingQ = null; render(); return; }
        if (e.target.closest('[data-link-only-new]')) { linkOnlyNew = e.target.closest('[data-link-only-new]').checked; render(); return; }
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
    const mm = e.target.closest('[data-move-m]');
    if (mm) {
        const r = pointGap(factOf(mm.dataset.moveM), mm.dataset.at, recordNow());
        if (r.why) { state.note = r.why; render(); return; }
        addMove({ move: 'm', of: mm.dataset.moveM, at: mm.dataset.at }, r.entry.id);
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
    if (e.target.closest('[data-solved-close]')) { solvedNews = []; renderSolved(); return; }
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
            : f.reasoned.move === 'm' ? (x) => x.move === 'm' && x.of === f.rule && x.at === f.gap
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
    const st = e.target.closest('[data-set-trust]');
    if (st) { if (Number(st.dataset.level) === CONFIRMED && !earned(st.dataset.setTrust)) return; changeTrust((tr) => setLink(tr, st.dataset.setTrust, Number(st.dataset.level))); return; }
    const ag = e.target.closest('[data-agree]');
    if (ag) { changeTrust((tr) => { earn(tr, ag.dataset.agree); setLink(tr, ag.dataset.agree, CONFIRMED); }); return; }
    const src = e.target.closest('[data-src]');
    if (src) { select(`src:${src.dataset.src}`, e); return; }
    const a = e.target.closest('[data-ent]');
    if (a) { select(a.dataset.ent, e); return; }
    const f = e.target.closest('[data-fact]');
    if (f && !e.target.closest('select')) select(f.dataset.fact, e);
});
document.addEventListener('change', (e) => {
    if (e.target.matches('.link-trust')) {
        const raw = e.target.value, k = e.target.dataset.key, base = e.target.dataset.base;
        if (raw !== '' && Number(raw) === CONFIRMED && !mayConfirm(k, base)) { render(); return; }
        changeTrust((tr) => setLink(tr, k, raw === '' || (base != null && Number(raw) === Number(base)) ? null : Number(raw)));
    } else if (e.target.matches('.narration-trust')) {
        const v = Number(e.target.value), k = e.target.dataset.key, base = Number(e.target.dataset.base);
        changeTrust((tr) => { if (v === base) delete tr.links[k]; else tr.links[k] = v; });
    } else if (e.target.matches('.person-trust')) {
        const p = e.target.dataset.person, v = e.target.value;
        if (v !== '' && Number(v) === CONFIRMED && p !== REASONING) { render(); return; }
        changeTrust((tr) => setPerson(tr, p, v === '' ? null : Number(v)));
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
    levels: LEVELS,
    para: () => state.para, last: LAST, wait: () => state.hintWait,
    // Papers earned by solving questions: a question is open when its papers have come and what it rests on is solved.
    earned: EARNED, open: (id) => !EARNED || openNow(id),
    // The files: how far each is read, whether it has come, and its title; and whether references are all read.
    files: () => files.map((f) => ({ id: f.id, title: f.title, delivered: delivered(f.id), read: reading.readTo(f.id), last: lastOf(f.id) })),
    seenAll: (at) => reading.seenAll(at), readTo: (id) => reading.readTo(id),
    // The gate holds the reader here: reading on is not possible yet.
    gateHolds: () => state.para < LAST && gateAt(state.para + 1).length > 0,
    question: (id) => (qById.has(id) ? { ...qById.get(id), label: qLabel(qById.get(id)) } : undefined), qListed: (id) => qListed(qById.get(id)), isRight: (id, pick) => isRight(qById.get(id), pick),
    name: (id) => (entityById.has(id) ? nameOf(id) : null), timeName: (id) => timeLabel(id).replace(/<[^>]+>/g, ''),
    // A link of a chain in words: a telling as the timeline says it, a speech as who said it to whom.
    linkName: (key) => linkName(key),
    // What distrusting a link or a person lowers now (told so far, and held higher with that distrust lifted):
    // `{n, harmless}`, harmless when all of it is false. A distrust that takes off only what is false is a
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
            if (cs.length && levelOf(cs, a) < levelOf(cs, b)) hit.push(f.truth === false);
            if (CLAIM_ATTRS.has(f.attr) && list(f.asserts).length) {
                const cc = claimChains(f.id);
                if (levelOf(cc, a) < levelOf(cc, b)) hit.push(...allAssertions.filter((x) => x.claim === f.id).map((x) => x.truth === false));
            }
        }
        return { n: hit.length, harmless: hit.every(Boolean) };
    },
    // A statement is false when its fact is, or (a claim) when anything it asserts is.
    statementFalse: (id) => { const f = factById.get(id); return !!f && (CLAIM_ATTRS.has(f.attr) ? allAssertions.some((x) => x.claim === id && x.truth === false) : f.truth === false); },
    setTrust: ({ link, person }, level) => changeTrust((tr) => { if (link) setLink(tr, link, level === DEFAULT_LEVEL ? null : level); else setPerson(tr, person, null); }),
    // A lowering of the path counts as made when every false statement it would lower is held unlikely or ruled out already.
    lowered: ({ link, person }) => { const fs = [...(link ? (link.startsWith('stmt:') ? [link.slice(5)] : statementsUnder(link)) : sourceLinks(person).flatMap((l) => statementsUnder(linkKey(l))))].map((id) => factById.get(id)).filter((f) => f && seen(givenAt(f)) && hintApi.statementFalse(f.id)); return fs.length > 0 && fs.every((f) => (CLAIM_ATTRS.has(f.attr) ? levelOf(claimChains(f.id), state.trust) : levelOfFact(f)) <= UNLIKELY); },
    // A raising of the path counts as made when the entry counts already.
    countsNow: (id) => { const f = factOf(id); return !!f && accepted(f); },
    view: () => ({ sel: state.sel, panels: [...state.panels], backs: [...backs], note: state.note }),
    restore: (v) => { state.sel = v.sel; state.panels = v.panels; backs = v.backs; state.note = v.note; save(); render(); },
};
document.getElementById('hint-wait').value = String(state.hintWait);
document.getElementById('hint-wait').addEventListener('change', (e) => { state.hintWait = Number(e.target.value); save(); });
document.getElementById('gate-rule').value = strictGate() ? 'strict' : 'any';
// The seed of the papers' placement (earned papers only): shown, with the address that replays it.
if (EARNED && document.getElementById('seed-row')) {
    const row = document.getElementById('seed-row');
    row.hidden = false;
    row.innerHTML = `Seed of this game: <b id="seed-value">${state.seed}</b> <a class="settings-link" href="${esc(pageUrl(`seed=${state.seed}`))}" title="The address of this game's placement of the papers: a new game with it plays the same">replay it</a>`;
}
document.getElementById('gate-rule').addEventListener('change', (e) => { state.gate = e.target.value; save(); render(); });
document.getElementById('left-list').value = state.leftList === 'off' ? 'off' : 'on';
document.getElementById('left-list').addEventListener('change', (e) => { state.leftList = e.target.value; save(); render(); });
document.getElementById('link-rule').value = checkedLinks() ? 'checked' : 'free';
document.getElementById('answer-rule').value = state.answerRule === 'hand' ? 'hand' : 'evidence';
document.getElementById('answer-rule').addEventListener('change', (e) => { state.answerRule = e.target.value; answerParam = null; derivedSeen = null; save(); render(); });
document.getElementById('link-rule').addEventListener('change', (e) => { state.linkRule = e.target.value; save(); render(); });
if (AUTOPLAY === null) import('./world-hints.js').then((m) => m.makeHints({ store: STORE, api: hintApi }));
else document.getElementById('hint').hidden = true;
if (AUTOPLAY !== null) { save(); import('./world-autoplay.js').then((m) => m.start({ store: STORE, fast: AUTOPLAY === 'fast' })); }
document.getElementById('autoplay-open')?.addEventListener('click', () => {
    if (confirm('Watch a careful reader fill in the timeline, from the first paragraph to the last? Your own timeline is kept aside and comes back when you stop.')) location.href = pageUrl('autoplay');
});
