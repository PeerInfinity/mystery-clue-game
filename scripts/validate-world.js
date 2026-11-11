#!/usr/bin/env node
// Validate the world model as data (<case>/world/: the case header, entities, mentions, times, facts, accounts,
// questions, strains) and print its counts. A case is its story text and these files; nothing else is read.
//
//   node scripts/validate-world.js cases/miniatures/rent-box [--quiet]
//
// Checks: ids unique; every `of`, `to` and entity-valued value (a location's or lives_at's, or any id with an
// underscore) names an entity (the case's or the world's own); every time reference names a time point and `after`
// has no cycle; every quote is found in its paragraph; a stated or implied fact has a quote; an inferable fact names
// facts that exist and are told no later than its `inferable_at`; an `observes` value names facts; `q`/`pick` name
// a question and one of its possibilities; a `member_of` value is a group; `reasoning` (a reader's step not
// modelled as facts: {para, text}) is dated no later than what it supports. Provenance: a `tells` fact passes accounts that exist; accounts' parts and facts
// exist and no bundle contains itself; every told fact is in an account and a chain of tellings carries it to a
// narrator, and so to the reader (scripts/world-provenance.js). The case header names the story and its narrators
// (`{id, name?, kind?, trust?}`; an id is an entity, or `narrator` for an impersonal one). Questions: `from` names a fact (or `reasoning` gives the step)
// told no later than the possibility is available (or a `quote` in that paragraph names it); exactly one
// "something else", available from where the question is raised; the answer is one of the possibilities (or null).
// Dates: `given_at` (with `given_quote` in that paragraph) and `inferable_at` (with `from`, each premise inferable
// no later) agree, the inferable date no later than the given one; an answer has its give-away (paragraph and quote)
// and its earliest inferable paragraph (null: only the give-away), its `answer_from` (or `answer_reasoning`) no later.

import fs from 'node:fs';
import path from 'node:path';
import { normalize } from '../engine/story.js';
import { provenance, loadWorld } from './world-provenance.js';
import { assertions, contradictions, CLAIM_ATTRS, LEVELS } from '../engine/world.js';
import { ACTIONS, GENERIC_ACTIONS, STATES, setCaseActions } from '../engine/actions.js';
import { REASONED_MOVES } from '../engine/observations.js';
import { MAIN, parseRef } from '../engine/refs.js';

const dir = process.argv[2];
const quiet = process.argv.includes('--quiet');
if (!dir) { console.error('usage: validate-world.js <case dir> [--quiet]'); process.exit(2); }
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));

const caseData = read('world/case.json');
const paragraphsOf = (file) => fs.readFileSync(path.join(dir, 'world', file), 'utf8')
    .split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean).map(normalize);
const story = paragraphsOf(caseData.story);
// The case files (sub-stories, engine/refs.js): each its own paragraphs, delivered at a paragraph of the main story
// (or from the start). A paragraph's reference is a number (the main story) or "<file>:<n>".
const caseFiles = caseData.files ?? [];
const fileErrors = [];
const stories = new Map([[MAIN, story]]);
for (const f of caseFiles) {
    if (!f.id || f.id === MAIN || !/^[A-Za-z0-9_-]+$/.test(f.id) || stories.has(f.id)) { fileErrors.push(`case.json: file id ${f.id}`); continue; }
    if (!f.title || !f.short) fileErrors.push(`case.json: file ${f.id}: needs a title and a short label`);
    if (f.delivered != null && !(Number.isInteger(f.delivered) && f.delivered >= 1 && f.delivered < story.length)) fileErrors.push(`case.json: file ${f.id}: delivered is a paragraph of the main story`);
    try { stories.set(f.id, paragraphsOf(f.text)); } catch { fileErrors.push(`case.json: file ${f.id}: no text ${f.text}`); }
}
const deliveredAt = (id) => (id === MAIN ? 0 : caseFiles.find((f) => f.id === id)?.delivered ?? 0);
/** A paragraph reference that exists (a number in the main story, or "<file>:<n>"). */
const isRef = (x) => { const r = parseRef(x); return !!r && (typeof x === 'number' || typeof x === 'string') && stories.has(r.story) && r.n >= 0 && r.n < stories.get(r.story).length; };
/** Is `a` surely read whenever `b` is? The same story and no later; or a main-story paragraph no later than b's file is delivered. */
const le = (a, b) => {
    const x = parseRef(a), y = parseRef(b);
    if (!x || !y || x.n <= 0) return true;
    if (x.story === y.story) return x.n <= y.n;
    return x.story === MAIN && x.n <= deliveredAt(y.story);
};
/** `a` may be read after `b` (an error where a must come first). Unknown either way: no. */
const after = (a, b) => a != null && b != null && !le(a, b);
const allEntities = read('world/entities.json').entities;
// The case's own action types (world/actions.json, optional): each `{id, label, requires, effects}`, an id the
// generic table does not have, every rule naming a role or a thing; `ramifies` each `{if, then}` of {attr, value}.
const caseActions = fs.existsSync(path.join(dir, 'world', 'actions.json')) ? read('world/actions.json') : {};
const actionErrors = [];
for (const a of caseActions.actions ?? []) {
    if (!a.id || GENERIC_ACTIONS[a.id]) actionErrors.push(`actions.json: ${a.id}: needs an id the generic table does not have`);
    if (!a.label) actionErrors.push(`actions.json: ${a.id}: no label`);
    for (const r of [...(a.requires ?? []), ...(a.effects ?? [])]) if (!r || typeof r !== 'object' || !(r.of || r.guard)) actionErrors.push(`actions.json: ${a.id}: a rule names its subject (of, or guard): ${JSON.stringify(r)}`);
}
for (const r of caseActions.ramifies ?? []) if (!r.if?.attr || !r.then?.attr) actionErrors.push(`actions.json: ramifies: {if: {attr, value}, then: {attr, value}}: ${JSON.stringify(r)}`);
setCaseActions(caseActions);
// The narrators: each an entity of the case, or `narrator` (an impersonal third-person narrator); trust a level.
const errors0 = [];
const narratorIds = new Set((caseData.narrators ?? []).map((n) => n.id));
if (!narratorIds.size) errors0.push('case.json: no narrators');
for (const n of caseData.narrators ?? []) {
    if (n.id !== 'narrator' && !allEntities.some((e) => e.id === n.id)) errors0.push(`case.json: narrator ${n.id} is no entity`);
    if (n.trust != null && !LEVELS.includes(n.trust)) errors0.push(`case.json: narrator ${n.id}: trust ${n.trust}`);
}
const entities = new Set(allEntities.map((e) => e.id));
const groups = new Set(allEntities.filter((e) => e.kind === 'group').map((e) => e.id));
const times = read('world/times.json').times;
const facts = read('world/facts.json').facts;
const questions = read('world/questions.json').questions;
const accounts = read('world/accounts.json').accounts;
const room = fs.existsSync(path.join(dir, 'world', 'room.json')) ? read('world/room.json') : null;
const observationList = fs.existsSync(path.join(dir, 'world', 'observations.json')) ? read('world/observations.json').observations : [];
// A question answered by a description the player builds: "something else" is right before the story names the thing.
const byDescription = (q) => observationList.some((o) => o.q === q && o.essential);
const accountIds = new Set(accounts.map((a) => a.id));
const prov = provenance(dir);
const world = loadWorld(dir);
const STRENGTHS = new Set(['certain', 'likely']);
// A fact is given where the story states it: `given_at`, else its own paragraph (an inferable fact: only by given_at).
const givenAt = (f) => f.given_at ?? ((f.basis ?? 'stated') === 'inferable' ? null : f.para);
const earliest = (f) => f.inferable_at ?? givenAt(f);
const TELL_HOWS = new Set(['told', 'overheard', 'statement', 'sworn statement', 'report', 'newspaper', 'telegram', 'analysis', 'letter']);
const ACCOUNT_HOWS = new Set(['saw', 'did', 'said', 'examination', 'analysis', 'inference', 'own', 'report', 'bundle']);

const errors = [...errors0, ...actionErrors, ...fileErrors];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const timeIds = new Set(times.map((t) => t.id));
const factById = new Map(facts.map((f) => [f.id, f]));
const qById = new Map(questions.map((q) => [q.id, q]));

// Labels by paragraph (engine/shown.js): `labels` on a time point, a question or an account, `names` on an entity.
for (const x of [...times, ...questions, ...accounts, ...allEntities]) {
    for (const [k, f] of [['labels', 'label'], ['names', 'name']]) {
        if (x[k] == null) continue;
        if (!Array.isArray(x[k]) || !x[k].length || x[k].some((l) => !isRef(l.from) || typeof l[f] !== 'string' || !l[f])) errors0.push(`${x.id}: ${k} is a list of {from, ${f}}`);
    }
}
const seen = new Set();
for (const x of [...times, ...facts, ...questions, ...accounts]) {
    if (seen.has(x.id)) err(x.id, 'duplicate id');
    seen.add(x.id);
}
const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
// A reader's step the facts do not model, in words, with the paragraph a reader could take it: {para, text}.
const reasoningBad = (r, by) => (!isRef(r?.para) || !r.text ? 'is {para, text}' : after(r.para, by) ? `¶${r.para} is after ¶${by}` : null);
const quoteIn = (id, quote, para) => {
    if (!isRef(para) || parseRef(para).n < 1) return err(id, `no paragraph ${para}`);
    const r = parseRef(para);
    if (!stories.get(r.story)[r.n].includes(normalize(quote))) err(id, `quote not in ¶${para}: "${quote.slice(0, 60)}"`);
};

// Times: references and no cycle in `after`.
for (const t of times) {
    for (const a of list(t.after)) if (!timeIds.has(a)) err(t.id, `after: no time ${a}`);
    if (t.quote) quoteIn(t.id, t.quote, t.para);
}
const afterOf = new Map(times.map((t) => [t.id, list(t.after)]));
const reaches = (from, target, seenT = new Set()) => list(afterOf.get(from)).some((a) => a === target || (!seenT.has(a) && seenT.add(a) && reaches(a, target, seenT)));
for (const t of times) if (reaches(t.id, t.id)) err(t.id, 'after: cycle');

// Facts.
const ENTITY_ATTRS = new Set(['location', 'lives_at', 'carrying', 'wearing', 'owner', 'identity']);
const BASES = new Set(['stated', 'implied', 'inferable']);
for (const f of facts) {
    if (f.of !== '?' && !entities.has(f.of)) err(f.id, `of: no entity ${f.of}`);
    if (f.to && !entities.has(f.to)) err(f.id, `to: no entity ${f.to}`);
    if (ENTITY_ATTRS.has(f.attr)) for (const v of list(f.value)) {
        const head = String(v).split(/,| \(/)[0];
        if (/^[a-z][a-z0-9_]*$/.test(head) && (head.includes('_') || f.attr === 'location' || f.attr === 'lives_at') && !entities.has(head)) err(f.id, `value: no entity ${head}`);
    }
    if (f.attr === 'member_of') for (const v of list(f.value)) if (!groups.has(v)) err(f.id, `member_of: ${v} is not a group`);
    // A typed state takes one of its values; a typed action names a known action type and the thing it acts on.
    if (STATES[f.attr] && !STATES[f.attr].includes(f.value)) err(f.id, `${f.attr}: ${f.value} is not one of ${STATES[f.attr].join(', ')}`);
    // A typed action's roles (thing, to, via) are entities; a plan's steps are typed actions; a goal is of an entity.
    const checkAct = (id, x) => {
        if (!list(x.act).length) err(id, 'a step or typed action needs act');
        for (const t of list(x.act)) if (!ACTIONS[t]) err(id, `act: no action type ${t}`);
        for (const r of ['thing', 'to', 'via', 'item']) if (x[r] != null && !entities.has(x[r])) err(id, `${r}: no entity ${x[r]}`);
    };
    if (f.act != null || f.thing != null) checkAct(f.id, f);
    // A heading (where someone is making for, read from a track) and a charge (a place one is in charge at) are places.
    const isPlace = (id) => allEntities.find((e) => e.id === id)?.kind === 'place';
    if (f.attr === 'heading' && !isPlace(f.value)) err(f.id, `heading: ${f.value} is not a place`);
    if (f.charge != null && !isPlace(f.charge)) err(f.id, `charge: ${f.charge} is not a place`);
    // Read from a track a narrator sees: in that narrator's own account, told where it is seen.
    if (f.read_from_track && !accounts.some((x) => narratorIds.has(x.origin) && x.how === 'saw' && x.facts?.includes(f.id))) err(f.id, 'read_from_track: in no narrator\'s own account');
    // A guard (the lad on watch) guards a place behind a door: the place inside it.
    if (f.guards != null && !Object.values(world.joins ?? {}).some((sides) => sides[0] === f.guards)) err(f.id, `guards: ${f.guards} is not the inside of a door (joins)`);
    if (f.plan) {
        if (!entities.has(f.plan.agent)) err(f.id, `plan.agent: no entity ${f.plan.agent}`);
        list(f.plan.steps).forEach((x, i) => checkAct(`${f.id} step ${i}`, x));
        for (const x of list(f.plan.steps)) for (const k of ['after', 'before', 'at']) if (x.time?.[k] && !timeIds.has(x.time[k])) err(f.id, `plan time.${k}: no time ${x.time[k]}`);
    }
    for (const g of [f.goal, f.plan?.goal].filter(Boolean)) if (!entities.has(g.of) || !g.attr || g.value == null) err(f.id, 'a goal is {of: an entity, attr, value}');
    for (const k of ['at', 'from', 'to', 'after', 'before']) if (f.time?.[k] && !timeIds.has(f.time[k])) err(f.id, `time.${k}: no time ${f.time[k]}`);
    if (!f.time || !Object.keys(f.time).length) err(f.id, 'no time');
    const basis = f.basis ?? 'stated';
    if (!BASES.has(basis)) err(f.id, `basis ${basis}`);
    if (f.quote) quoteIn(f.id, f.quote, f.para);
    else if (basis !== 'inferable') err(f.id, 'a stated or implied fact needs a quote');
    // The two dates: given (where the story states it) and inferable (the earliest it follows from what came before).
    if (f.given_quote) quoteIn(`${f.id} given`, f.given_quote, f.given_at);
    else if (f.given_at != null && f.given_at !== f.para) err(f.id, 'given_at without given_quote');
    const premises = list(f.from).length + list(f.reasoning).length;
    if (basis === 'inferable' && !premises) err(f.id, 'inferable without from or reasoning');
    if ((premises > 0) !== isRef(f.inferable_at)) err(f.id, 'from (or reasoning) and inferable_at go together');
    for (const r of list(f.reasoning)) if (reasoningBad(r, f.inferable_at)) err(f.id, `reasoning: ${reasoningBad(r, f.inferable_at)}`);
    for (const p of list(f.from)) {
        const pf = factById.get(p);
        if (!pf) err(f.id, `from: no fact ${p}`);
        else if (after(earliest(pf), f.inferable_at)) err(f.id, `from: ${p} is not inferable before ¶${earliest(pf)}, after inferable_at ¶${f.inferable_at}`);
    }
    const given = givenAt(f);
    if (isRef(f.inferable_at) && given != null && after(f.inferable_at, given)) err(f.id, `inferable_at ¶${f.inferable_at} after given ¶${given}`);
    if (basis !== 'inferable' && isRef(f.inferable_at) && f.inferable_at === given) err(f.id, 'inferable_at no earlier than given: drop it');
    if (f.strength && !STRENGTHS.has(f.strength)) err(f.id, `strength ${f.strength}`);
    if (f.attr === 'observes') for (const v of list(f.value)) if (!factById.has(v) && /^f\./.test(v)) err(f.id, `observes: no fact ${v}`);
    if ('truth' in f && ![true, false, null].includes(f.truth)) err(f.id, `truth ${f.truth}`);
    if (f.attr === 'tells') {
        for (const v of list(f.value)) if (!accountIds.has(v)) err(f.id, `tells: no account ${v}`);
        if (!f.to) err(f.id, 'tells without to');
        if (!TELL_HOWS.has(f.how)) err(f.id, `tells: how ${f.how}`);
        if (f.of === '?' && !f.q) err(f.id, 'a telling from "?" needs its question (q)');
    }
    // What a claim asserts, and the facts that are a claim's content (`claim`) or a person's word in a narrator's hearing (`word`, `heard_by`).
    if (f.asserts != null || f.modal != null) {
        if (!CLAIM_ATTRS.has(f.attr)) err(f.id, 'asserts and modal belong on a says or believes fact');
        if (f.modal != null && f.modal !== 'possible') err(f.id, `modal ${f.modal}`);
        for (const x of list(f.asserts)) {
            if (x.q) {
                const q = qById.get(x.q);
                if (!q) err(f.id, `asserts: no question ${x.q}`);
                else if (!q.possibilities.some((p) => p.value === x.pick)) err(f.id, `asserts: ${x.q} has no possibility "${x.pick}"`);
            } else if (!x.of || !x.attr || !('value' in x)) err(f.id, 'asserts: an item is a pick {q, pick} or a state {of, attr, value}');
        }
    }
    if (CLAIM_ATTRS.has(f.attr) && f.pick != null) err(f.id, 'a claim asserts its picks in asserts, not pick');
    if (f.claim) {
        const c = factById.get(f.claim);
        if (!c || !CLAIM_ATTRS.has(c.attr)) err(f.id, `claim: ${f.claim} is not a says or believes fact`);
        else if (after(c.para, f.given_at ?? f.para)) err(f.id, `claim: ${f.claim} is told after it (¶${c.para})`);
    }
    if (f.word && !entities.has(f.word)) err(f.id, `word: no entity ${f.word}`);
    if (f.heard_by && (!f.word || !narratorIds.has(f.heard_by))) err(f.id, `heard_by: ${f.heard_by} is no narrator, or the fact has no word`);
    if (f.claim && f.word) err(f.id, 'claim or word, not both');
    if ('neg' in f && f.neg !== true) err(f.id, 'neg is true or absent');
    if (f.attr === 'location' && f.value != null && typeof f.value === 'string' && !entities.has(f.value)) err(f.id, `location: no entity ${f.value} (put the rest in detail)`);
    if (f.q) {
        const q = qById.get(f.q);
        if (!q) err(f.id, `q: no question ${f.q}`);
        else if (f.pick && !q.possibilities.some((p) => p.value === f.pick)) err(f.id, `pick: ${f.q} has no possibility "${f.pick}"`);
    } else if (f.pick) err(f.id, 'pick without q');
}

// Accounts: parts and facts exist, no bundle contains itself, every told fact reaches the reader.
for (const a of accounts) {
    if (a.origin != null && !entities.has(a.origin)) err(a.id, `origin: no entity ${a.origin}`);
    if (!ACCOUNT_HOWS.has(a.how)) err(a.id, `how ${a.how}`);
    if ((a.how === 'bundle') !== !!list(a.parts).length) err(a.id, 'a bundle has parts, and only a bundle');
    for (const x of list(a.parts)) if (!accountIds.has(x)) err(a.id, `parts: no account ${x}`);
    for (const x of list(a.facts)) if (!factById.has(x)) err(a.id, `facts: no fact ${x}`);
    if (prov.ancestors(a.id).has(a.id)) err(a.id, 'a bundle contains itself');
}
for (const f of facts) {
    if (f.attr === 'tells') continue;
    const held = prov.holdersOf.get(f.id);
    if ((f.claim || f.word) && held.length) err(f.id, `a claim's content or a word heard reaches the reader through its speaker, in no account (${held.join(', ')})`);
    if (f.claim || f.word) continue;
    if (!held.length && (f.basis ?? 'stated') !== 'inferable') err(f.id, 'a told fact in no account');
    if (held.length && !prov.factChains(f.id).length) err(f.id, `no chain reaches the reader from ${held.join(', ')}`);
}

// Questions.
const VIAS = new Set(['direct', 'indirect', 'always', 'knowledge']);
for (const q of questions) {
    if (q.entry?.of && q.entry.of !== '?' && !entities.has(q.entry.of)) err(q.id, `entry.of: no entity ${q.entry.of}`);
    for (const t of [q.entry?.time, q.entry?.time?.from, q.entry?.time?.to]) if (typeof t === 'string' && t.startsWith('t.') && !timeIds.has(t)) err(q.id, `entry.time: no time ${t}`);
    if (!q.label) err(q.id, 'a question needs its label (shown to the player; no spoiler)');
    if (q.quote) quoteIn(q.id, q.quote, q.raised);
    else if (q.raised != null) err(q.id, 'raised without quote');
    const ps = q.possibilities ?? [];
    const other = ps.filter((p) => p.value === 'something else');
    if (other.length !== 1) err(q.id, 'needs exactly one "something else"');
    else if (other[0].via !== 'always' || other[0].available !== q.raised) err(q.id, '"something else": via always, available at the paragraph the question is raised');
    const values = ps.map((p) => p.value);
    if (new Set(values).size !== values.length) err(q.id, 'a possibility listed twice');
    for (const p of ps) {
        if (!VIAS.has(p.via)) err(q.id, `${p.value}: via ${p.via}`);
        if (p.via === 'always' && p.value !== 'something else') err(q.id, `${p.value}: via always is for "something else"`);
        // An aim's goal and the last step it implies; a reason's need, added to an action type when circled.
        if (p === ps[0] && q.presupposes && (!entities.has(q.entry?.of) || list(q.presupposes.act).some((t) => !ACTIONS[t]) || ['thing', 'to', 'via', 'item'].some((r) => q.presupposes[r] != null && !entities.has(q.presupposes[r])))) err(q.id, 'presupposes: a typed action of the entry\'s entity');
        if (p.goal && (!entities.has(p.goal.of) || !p.goal.attr || p.goal.value == null)) err(q.id, `${p.value}: a goal is {of: an entity, attr, value}`);
        if (p.step && (!list(p.step.act).length || list(p.step.act).some((t) => !ACTIONS[t]) || ['thing', 'to', 'via'].some((r) => p.step[r] != null && !entities.has(p.step[r])))) err(q.id, `${p.value}: step is a typed action`);
        if (p.step && !p.goal) err(q.id, `${p.value}: a step belongs to an aim with a goal`);
        if (p.action && (!entities.has(p.action.of) || !list(p.action.act).length || list(p.action.act).some((t) => !ACTIONS[t]) || ['thing', 'to', 'via', 'item'].some((r) => p.action[r] != null && !entities.has(p.action[r])))) err(q.id, `${p.value}: action is a typed action of an entity`);
        // What an answer rests on: states of an entity (or of the entry's agent), checked against the timeline.
        for (const x of p.rests_on ?? []) if (!x.attr || x.value == null || !(x.of === '$agent' || entities.has(x.of))) err(q.id, `${p.value}: rests_on is a list of {of, attr, value}`);
        // A possibility that implies another question's answer (the hoof: the horse struck the blow).
        if (p.implies && !qById.get(p.implies.q)?.possibilities.some((o) => o.value === p.implies.pick) && !entities.has(p.implies.pick)) err(q.id, `${p.value}: implies no possibility ${p.implies.q} = ${p.implies.pick}`);
        for (const n of list(p.need)) if (!ACTIONS[n.act] || !n.rule?.of || (n.rule.away != null && !entities.has(n.rule.away)) || (n.rule.carrying != null && !n.rule.carrying.startsWith('$') && !entities.has(n.rule.carrying))) err(q.id, `${p.value}: need is {act, rule}, or a list of them`);
        // A possibility general knowledge brings is listed by the player's move, not by a paragraph (world/room.json).
        if (p.via === 'knowledge' && !room?.categories?.some((c) => c.id === p.category && c.q === q.id && c.members.some((m) => m.value === p.value))) err(q.id, `${p.value}: via knowledge needs a category of room.json on this question listing it`);
        if (p.via !== 'always' && p.via !== 'knowledge') {
            if (!isRef(p.available)) err(q.id, `${p.value}: no available paragraph`);
            if (!p.from && !p.reasoning && !p.quote) err(q.id, `${p.value}: needs from (a fact), reasoning or a quote`);
        }
        if (p.from && !factById.has(p.from)) err(q.id, `${p.value}: from: no fact ${p.from}`);
        if (p.reasoning && reasoningBad(p.reasoning, p.available)) err(q.id, `${p.value}: reasoning: ${reasoningBad(p.reasoning, p.available)}`);
        if (p.from && factById.has(p.from) && after(earliest(factById.get(p.from)), p.available)) err(q.id, `${p.value}: available ¶${p.available} before its fact ${p.from} (¶${earliest(factById.get(p.from))})`);
        if (p.quote) quoteIn(`${q.id} ${p.value}`, p.quote, p.available);
        if (p.by && !factById.has(p.by)) err(q.id, `${p.value}: by: no fact ${p.by}`);
        if (p.out != null && after(p.available, p.out)) err(q.id, `${p.value}: out ¶${p.out} before available ¶${p.available}`);
        if (p.by && factById.has(p.by) && after(factById.get(p.by).para, p.out)) err(q.id, `${p.value}: out ¶${p.out} before its fact ${p.by}`);
    }
    if (q.answer != null) {
        const p = ps.find((x) => x.value === q.answer);
        if (!p) err(q.id, `answer "${q.answer}" is not a possibility`);
        else if (p.out != null) err(q.id, `the answer is ruled out at ¶${p.out}`);
    }
    // Other right answers: possibilities just as true as the key's, not ruled out, and only with an answer.
    for (const v of q.also_right ?? []) {
        const p = ps.find((x) => x.value === v);
        if (q.answer == null) err(q.id, 'also_right without an answer');
        if (!p) err(q.id, `also_right "${v}" is not a possibility`);
        else if (p.out != null) err(q.id, `also_right "${v}" is ruled out at ¶${p.out}`);
        if (v === q.answer || (v === 'something else' && !byDescription(q.id))) err(q.id, `also_right "${v}": not the answer, not "something else"`);
    }
    if (q.answer != null) {
        if (!Number.isInteger(q.answer_given_at) || !q.answer_given_quote) err(q.id, 'an answer needs answer_given_at (a paragraph of the main story: a file never gives an answer away) and its quote');
        else quoteIn(`${q.id} answer given`, q.answer_given_quote, q.answer_given_at);
        if (!('answer_inferable_at' in q)) err(q.id, 'an answer needs answer_inferable_at (null: only the give-away)');
        const ia = q.answer_inferable_at;
        if (ia != null) {
            // In a case with files, where it becomes inferable may be a list: every paragraph it needs read.
            const ias = Array.isArray(ia) ? ia : [ia];
            if (!ias.length || ias.some((x) => !isRef(x))) err(q.id, `answer_inferable_at: no paragraph ${ia}`);
            if (ias.some((x) => parseRef(x)?.story === MAIN && after(x, q.answer_given_at))) err(q.id, `answer inferable ¶${ia} after given ¶${q.answer_given_at}`);
            // A reader who can reach the answer at ¶ia (or where the question is raised, if later) must be able to
            // circle it there: the page's gate asks for a circle before the give-away.
            const rights = q.possibilities.filter((p) => p.value === q.answer || (q.also_right ?? []).includes(p.value));
            if (!rights.some((p) => p.available != null && (ias.some((x) => le(p.available, x)) || le(p.available, q.raised ?? 0)))) err(q.id, `answer inferable at ¶${ia} (or where it is raised, ¶${q.raised}), but no right possibility is available by then (${rights.map((p) => `¶${p.available}`).join(', ')})`);
            if (q.answer_reasoning) { if (reasoningBad(q.answer_reasoning, ia)) err(q.id, `answer_reasoning: ${reasoningBad(q.answer_reasoning, ia)}`); }
            else if (!q.answer_from || !factById.has(q.answer_from)) err(q.id, `answer_from: no fact ${q.answer_from} (or give answer_reasoning)`);
            else if (ias.every((x) => after(earliest(factById.get(q.answer_from)), x))) err(q.id, `answer_from ${q.answer_from} is later than ¶${ia}`);
        }
        if (q.answer_strength && !STRENGTHS.has(q.answer_strength)) err(q.id, `answer_strength ${q.answer_strength}`);
    }
}

// Moving places, and the true story is consistent: no contradiction among the assertions the answer key holds true.
for (const m of world.moves) if (!entities.has(m)) err(m, 'moves: no entity');
const asserted = assertions(world);
// A belief's `truth` is the truth of what it holds: false when something it asserts is false, and only then.
for (const f of facts) if (f.attr === 'believes' && !f.modal && list(f.asserts).length) {
    const items = asserted.filter((x) => x.claim === f.id && x.kind === 'pick');
    if (items.some((x) => x.truth == null)) continue;
    const anyFalse = items.some((x) => x.truth === false);
    if (anyFalse !== (f.truth === false)) err(f.id, `truth ${'truth' in f ? f.truth : true}, but what it asserts is ${anyFalse ? 'false' : 'true'}`);
}
for (const c of contradictions(world, asserted.filter((x) => x.truth === true))) err(`${c.a.id} / ${c.b.id}`, `true assertions contradict: ${c.why}`);

// Likely clashes: each side a fact, or a possibility of a question; shown no earlier than both sides can be; a key
// question with an answer; `from` (optional) a fact or a question.
// The arrangement of a room and general knowledge (world/room.json, optional).
if (room) {
    const S = ['person', 'small', 'air'];
    for (const [id, o] of Object.entries(room.openings ?? {})) { if (!entities.has(id)) err('room', `opening ${id}: no entity`); for (const s of o.sides ?? []) if (!entities.has(s)) err('room', `opening ${id}: side ${s}: no entity`); if (o.sides?.length !== 2) err('room', `opening ${id}: needs two sides`); }
    if (room.sealed) { if (!entities.has(room.sealed.place)) err('room', `sealed: no place ${room.sealed.place}`); for (const s of room.sealed.surfaces ?? []) if (!entities.has(s)) err('room', `sealed: no surface ${s}`); if (room.sealed.time && !timeIds.has(room.sealed.time)) err('room', `sealed: no time ${room.sealed.time}`); }
    for (const c of room.categories ?? []) {
        if (!c.label || !qById.has(c.q)) err('room', `category ${c.id}: needs a label and a question`);
        for (const f of list(c.on)) if (!factById.has(f)) err('room', `category ${c.id}: on: no fact ${f}`);
        for (const m of c.members ?? []) { if (!m.value || !m.text || !m.traits) err('room', `category ${c.id}: a member needs value, text and traits`); if (m.traits?.size && !S.includes(m.traits.size)) err('room', `category ${c.id}: ${m.value}: size ${m.traits.size}`); }
        if ((c.members ?? []).length < 3) err('room', `category ${c.id}: distractors: at least three members`);
    }
    for (const r of room.requirements ?? []) { if (!r.label || !r.trait) err('room', `requirement ${r.id}: needs a label and a trait`); for (const f of list(r.from)) if (!factById.has(f)) err('room', `requirement ${r.id}: from: no fact ${f}`); }
}
for (const f of facts) {
    if (f.attr === 'closed_to' || f.attr === 'passes' || f.attr === 'passed') { const v = f.attr === 'passed' ? f.passes : f.value; if (!['person', 'small', 'air'].includes(v)) err(f.id, `${f.attr}: ${v} is not person, small or air`); }
    if (f.attr === 'passed' && !(f.between?.length === 2 && f.between.every((x) => entities.has(x)))) err(f.id, 'passed: between is two entities');
    if (['attached', 'reaches', 'near', 'fixed'].includes(f.attr) && !entities.has(f.value)) err(f.id, `${f.attr}: no entity ${f.value}`);
}
// What an entry shows about a question once linked (world/observations.json, optional).
for (const o of observationList) {
    if (!qById.has(o.q)) err(o.id, `no question ${o.q}`);
    if (!Array.isArray(o.from) || !o.from.length) err(o.id, 'from: a list of entries');
    for (const f of o.from ?? []) if (typeof f === 'string' ? !factById.has(f) : f.doubted ? !(factById.get(f.doubted)?.attr === 'tells' || CLAIM_ATTRS.has(factById.get(f.doubted)?.attr))
        : f.reasoned ? !REASONED_MOVES[f.reasoned] || !Array.isArray(f.premises) || f.premises.length !== (f.reasoned === 'changed' ? 2 : 1) || f.premises.some((x) => !factById.has(x))
        : !Array.isArray(f.route_through) || f.route_through.some((n) => !entities.has(n))) err(o.id, `from: no entry ${JSON.stringify(f)}`);
    if (!o.says) err(o.id, 'no says');
    if (o.if && !qById.get(o.if.q)?.possibilities.some((x) => x.value === o.if.pick)) err(o.id, `if: no possibility ${o.if.q} = ${o.if.pick}`);
    for (const p of list(o.against)) if (!qById.get(o.q)?.possibilities.some((x) => x.value === p)) err(o.id, `against: no possibility ${p}`);
}
const strainsFile = path.join(dir, 'world', 'strains.json');
const strains = fs.existsSync(strainsFile) ? read('world/strains.json').strains : [];
for (const s of strains) {
    const side = (x) => {
        if (typeof x === 'string') { const f = factById.get(x); if (!f) err(s.id, `no fact ${x}`); return f ? earliest(f) : null; }
        const q = qById.get(x?.q), p = q?.possibilities.find((o) => o.value === x?.pick);
        if (!p) err(s.id, `no possibility ${x?.q} = ${x?.pick}`);
        return p?.available ?? q?.raised ?? null;
    };
    const sides = [side(s.a), side(s.b)];
    if (!s.why) err(s.id, 'a strain needs why');
    if (!isRef(s.available) || sides.some((x) => x == null || after(x, s.available))) err(s.id, `available ¶${s.available} before both sides (¶${sides.join(', ¶')})`);
    if (!qById.get(s.key)?.answer) err(s.id, `key: ${s.key} is not a question with an answer`);
    if (s.from && !(factById.has(s.from) || qById.has(String(s.from).split(' ')[0]))) err(s.id, `from: ${s.from}`);
}

// The true path (world/path.json, optional): each move's `at`, a paragraph or (a case with files) a list of them,
// covers what the move uses: the entry it links or works on, the question it marks and the answer it picks.
const pathFile = path.join(dir, 'world', 'path.json');
if (fs.existsSync(pathFile)) {
    const moves = read('world/path.json').moves ?? [];
    moves.forEach((m, i) => {
        const id = `path move ${i + 1} (${m.do})`;
        const at = list(m.at);
        if (!at.length || at.some((x) => !isRef(x))) { err(id, `at: no paragraph ${JSON.stringify(m.at)}`); return; }
        if (!caseFiles.length && Array.isArray(m.at)) err(id, 'at: a list only in a case with files');
        const uses = [];
        const fact = (x) => { const f = factById.get(x); if (f && givenAt(f) != null) uses.push([x, givenAt(f)]); };
        for (const k of ['entry', 'on', 'a', 'b', 'of', 'for']) if (typeof m[k] === 'string') fact(m[k]);
        if (m.do === 'trust' && m.link) fact(m.link);
        const q = qById.get(m.q);
        if (q?.raised != null) uses.push([m.q, q.raised]);
        const p = q?.possibilities.find((o) => o.value === m.pick);
        if (p?.available != null) uses.push([`${m.q} = ${m.pick}`, p.available]);
        for (const [what, ref] of uses) if (!at.some((x) => le(ref, x))) err(id, `at ${JSON.stringify(m.at)} does not cover ${what} (¶${ref})`);
    });
}

for (const e of errors) console.log(e);
if (!quiet) {
    const count = (xs, key) => Object.entries(xs.reduce((m, x) => ((m[key(x)] = (m[key(x)] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
    const show = (title, rows) => console.log(`\n${title}\n` + rows.map(([k, n]) => `  ${String(n).padStart(3)}  ${k}`).join('\n'));
    console.log(`${times.length} times, ${facts.length} facts, ${questions.length} questions`);
    show('Facts by attribute', count(facts, (f) => f.attr));
    show('Facts by entity', count(facts, (f) => f.of));
    show('Facts by basis', count(facts, (f) => f.basis ?? 'stated'));
    show('Facts by truth', count(facts, (f) => String('truth' in f ? f.truth : true)));
    const told = facts.filter((f) => f.attr !== 'tells');
    console.log(`\n${accounts.length} accounts, ${prov.tellings.length} tellings`);
    show('Facts by provenance', count(told, (f) => {
        const cs = prov.factChains(f.id);
        if (!cs.length) return 'none: the reader infers it';
        const sure = cs.filter((c) => !c.links.some((l) => l.uncertain));
        return `${sure.length ? 'a certain chain' : 'only uncertain chains'}, ${cs.length > 1 ? 'several' : 'one'}`;
    }));
    const ahead = facts.filter((f) => isRef(f.inferable_at) && givenAt(f) != null && f.inferable_at !== givenAt(f) && le(f.inferable_at, givenAt(f)));
    console.log(`\nFacts inferable before the story states them (${ahead.length})\n` + ahead.map((f) => `  ¶${f.inferable_at} → ¶${givenAt(f)}  ${f.id}${f.strength === 'likely' ? ' (likely)' : ''}`).join('\n'));
    const early = facts.filter((f) => f.given_at != null && f.given_at !== f.para && le(f.given_at, f.para));
    console.log(`\nFacts given before the paragraph that tells them in full (${early.length})\n` + early.map((f) => `  ¶${f.given_at} (told ¶${f.para})  ${f.id}`).join('\n'));
    const never = facts.filter((f) => givenAt(f) == null);
    console.log(`\nFacts never stated by ¶46, only inferable (${never.length}): ${never.map((f) => f.id).join(', ')}`);
    console.log('\nAnswers: inferable → given\n' + questions.filter((q) => q.answer != null).map((q) => `  ${q.answer_inferable_at == null ? '  —' : `¶${q.answer_inferable_at}`.padStart(4)} → ¶${String(q.answer_given_at).padEnd(4)} ${q.id} = ${q.answer}${q.answer_strength === 'likely' ? ' (likely)' : ''}`).join('\n'));
    const met = contradictions(world, asserted);
    const tag = (x) => `${x.id}${x.truth === false ? ' (false)' : x.truth == null ? ' (?)' : ''} ¶${x.para}`;
    console.log(`\nContradictions a reader trusting every source meets (${met.length})\n` + met.map((c) => `  ${c.why}: ${tag(c.a)} / ${tag(c.b)}${c.via ? ` / ${tag(c.via)}` : ''}`).join('\n'));
    show('Facts by origin', count(told, (f) => [...new Set(prov.factChains(f.id).map((c) => c.origin ?? '?'))].join(' + ') || '(reader)'));
}
console.log(`${errors.length} error(s)`);
process.exit(errors.length ? 1 : 0);
