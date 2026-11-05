#!/usr/bin/env node
// Validate the world model as data (<case>/world/: entities, times, facts, accounts, questions) and print its counts.
//
//   node scripts/validate-world.js cases/silver-blaze [--quiet]
//
// Checks: ids unique; every `of`, `to` and entity-valued value (a location's or lives_at's, or any id with an
// underscore) names an entity (the case's or the world's own); every time reference names a time point and `after`
// has no cycle; every quote is found in its paragraph; a stated or implied fact has a quote; an inferable fact names
// facts that exist and are told no later than its `inferable_at`; an `observes` value names facts; `q`/`pick` name
// a question and one of its possibilities; `old` names a claim, event, slot or question of the old game; a
// `member_of` value is a group. Provenance: a `tells` fact passes accounts that exist; accounts' parts and facts
// exist and no bundle contains itself; every told fact is in an account and a chain of tellings carries it to
// Watson (scripts/world-provenance.js). Questions: `from`/`by` name facts (or a reader's thought, "thought t<id>")
// told no later than the possibility is available (or a `quote` in that paragraph names it); exactly one
// "something else", available from where the question is raised; the answer is one of the possibilities (or null).
// Dates: `given_at` (with `given_quote` in that paragraph) and `inferable_at` (with `from`, each premise inferable
// no later) agree, the inferable date no later than the given one; an answer has its give-away (paragraph and quote)
// and its earliest inferable paragraph (null: only the give-away), its `answer_from` no later.

import fs from 'node:fs';
import path from 'node:path';
import { normalize } from '../engine/story.js';
import { provenance, loadWorld } from './world-provenance.js';
import { assertions, contradictions, CLAIM_ATTRS } from '../engine/world.js';
import { ACTIONS, STATES } from '../engine/actions.js';

const dir = process.argv[2];
const quiet = process.argv.includes('--quiet');
if (!dir) { console.error('usage: validate-world.js <case dir> [--quiet]'); process.exit(2); }
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));

const caseData = read('case.json');
const story = fs.readFileSync(path.join(dir, caseData.case.source.text_file), 'utf8')
    .split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean).map(normalize);
const allEntities = [...read('entities.json').entities, ...read('world/entities.json').entities];
const entities = new Set(allEntities.map((e) => e.id));
const groups = new Set(allEntities.filter((e) => e.kind === 'group').map((e) => e.id));
const oldIds = new Set([
    ...read('claims.json').claims.map((c) => c.id), ...read('events.json').events.map((e) => e.id),
    ...read('slots.json').slots.map((s) => s.id), ...caseData.questions.map((q) => q.id),
]);
for (const e of read('events.json').events) for (const f of Object.keys(e.facets ?? {})) oldIds.add(`${e.id}.${f}`);
for (const e of read('entities.json').entities) for (const f of Object.keys(e.facets ?? {})) oldIds.add(`${e.id}.${f}`);
const thoughts = new Set((read('thoughts.json').thoughts ?? []).map((t) => t.id));
const times = read('world/times.json').times;
const facts = read('world/facts.json').facts;
const questions = read('world/questions.json').questions;
const accounts = read('world/accounts.json').accounts;
const accountIds = new Set(accounts.map((a) => a.id));
const prov = provenance(dir);
const world = loadWorld(dir);
const STRENGTHS = new Set(['certain', 'likely']);
// A fact is given where the story states it: `given_at`, else its own paragraph (an inferable fact: only by given_at).
const givenAt = (f) => f.given_at ?? ((f.basis ?? 'stated') === 'inferable' ? null : f.para);
const earliest = (f) => f.inferable_at ?? givenAt(f);
const TELL_HOWS = new Set(['told', 'overheard', 'statement', 'sworn statement', 'report', 'newspaper', 'telegram', 'analysis', 'letter']);
const ACCOUNT_HOWS = new Set(['saw', 'did', 'said', 'examination', 'analysis', 'inference', 'own', 'report', 'bundle']);

const errors = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const timeIds = new Set(times.map((t) => t.id));
const factById = new Map(facts.map((f) => [f.id, f]));
const qById = new Map(questions.map((q) => [q.id, q]));

const seen = new Set();
for (const x of [...times, ...facts, ...questions, ...accounts]) {
    if (seen.has(x.id)) err(x.id, 'duplicate id');
    seen.add(x.id);
}
const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const quoteIn = (id, quote, para) => {
    if (!Number.isInteger(para) || !story[para]) return err(id, `no paragraph ${para}`);
    if (!story[para].includes(normalize(quote))) err(id, `quote not in ¶${para}: "${quote.slice(0, 60)}"`);
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
    if (basis === 'inferable' && !list(f.from).length) err(f.id, 'inferable without from');
    if ((list(f.from).length > 0) !== Number.isInteger(f.inferable_at)) err(f.id, 'from and inferable_at go together');
    for (const p of list(f.from)) {
        if (p.startsWith('thought ')) {
            if (!thoughts.has(p.slice(8))) err(f.id, `from: no ${p}`);
            else if (Number(p.slice(9).split('.')[0]) > f.inferable_at) err(f.id, `from: ${p} is after inferable_at ¶${f.inferable_at}`);
            continue;
        }
        const pf = factById.get(p);
        if (!pf) err(f.id, `from: no fact ${p}`);
        else if (earliest(pf) > f.inferable_at) err(f.id, `from: ${p} is not inferable before ¶${earliest(pf)}, after inferable_at ¶${f.inferable_at}`);
    }
    const given = givenAt(f);
    if (Number.isInteger(f.inferable_at) && given != null && f.inferable_at > given) err(f.id, `inferable_at ¶${f.inferable_at} after given ¶${given}`);
    if (basis !== 'inferable' && Number.isInteger(f.inferable_at) && f.inferable_at === given) err(f.id, 'inferable_at no earlier than given: drop it');
    if (f.strength && !STRENGTHS.has(f.strength)) err(f.id, `strength ${f.strength}`);
    if (f.attr === 'observes') for (const v of list(f.value)) if (!factById.has(v) && /^f\./.test(v)) err(f.id, `observes: no fact ${v}`);
    if ('truth' in f && ![true, false, null].includes(f.truth)) err(f.id, `truth ${f.truth}`);
    if (f.attr === 'tells') {
        for (const v of list(f.value)) if (!accountIds.has(v)) err(f.id, `tells: no account ${v}`);
        if (!f.to) err(f.id, 'tells without to');
        if (!TELL_HOWS.has(f.how)) err(f.id, `tells: how ${f.how}`);
        if (f.of === '?' && !f.q) err(f.id, 'a telling from "?" needs its question (q)');
    }
    // What a claim asserts, and the facts that are a claim's content (`claim`) or a person's word in Watson's hearing (`word`).
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
        else if (c.para > (f.given_at ?? f.para)) err(f.id, `claim: ${f.claim} is told after it (¶${c.para})`);
    }
    if (f.word && !entities.has(f.word)) err(f.id, `word: no entity ${f.word}`);
    if (f.claim && f.word) err(f.id, 'claim or word, not both');
    if ('neg' in f && f.neg !== true) err(f.id, 'neg is true or absent');
    if (f.attr === 'location' && f.value != null && typeof f.value === 'string' && !entities.has(f.value)) err(f.id, `location: no entity ${f.value} (put the rest in detail)`);
    for (const o of list(f.old)) if (!oldIds.has(o)) err(f.id, `old: no ${o}`);
    if (f.q) {
        const q = qById.get(f.q);
        if (!q) err(f.id, `q: no question ${f.q}`);
        else if (f.pick && !q.possibilities.some((p) => p.value === f.pick)) err(f.id, `pick: ${f.q} has no possibility "${f.pick}"`);
    } else if (f.pick) err(f.id, 'pick without q');
}

// Accounts: parts and facts exist, no bundle contains itself, every told fact reaches Watson.
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
    if ((f.claim || f.word) && held.length) err(f.id, `a claim's content or a word heard reaches Watson through its speaker, in no account (${held.join(', ')})`);
    if (f.claim || f.word) continue;
    if (!held.length && (f.basis ?? 'stated') !== 'inferable') err(f.id, 'a told fact in no account');
    if (held.length && !prov.factChains(f.id).length) err(f.id, `no chain reaches Watson from ${held.join(', ')}`);
}

// Questions.
const VIAS = new Set(['direct', 'indirect', 'always']);
const refOk = (r) => factById.has(r) || (/^thought /.test(r) && thoughts.has(r.slice(8)));
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
        for (const n of list(p.need)) if (!ACTIONS[n.act] || !n.rule?.of || (n.rule.away != null && !entities.has(n.rule.away)) || (n.rule.carrying != null && !n.rule.carrying.startsWith('$') && !entities.has(n.rule.carrying))) err(q.id, `${p.value}: need is {act, rule}, or a list of them`);
        if (p.via !== 'always') {
            if (!Number.isInteger(p.available)) err(q.id, `${p.value}: no available paragraph`);
            if (!p.from && !p.quote) err(q.id, `${p.value}: needs from (a fact or thought) or a quote`);
        }
        if (p.from && !refOk(p.from)) err(q.id, `${p.value}: from: no fact or thought ${p.from}`);
        if (p.from && factById.has(p.from) && earliest(factById.get(p.from)) > p.available) err(q.id, `${p.value}: available ¶${p.available} before its fact ${p.from} (¶${earliest(factById.get(p.from))})`);
        if (p.from?.startsWith('thought ') && Number(p.from.slice(9).split('.')[0]) > p.available) err(q.id, `${p.value}: available ¶${p.available} before its ${p.from}`);
        if (p.quote) quoteIn(`${q.id} ${p.value}`, p.quote, p.available);
        if (p.by && !factById.has(p.by)) err(q.id, `${p.value}: by: no fact ${p.by}`);
        if (p.out != null && p.out < p.available) err(q.id, `${p.value}: out ¶${p.out} before available ¶${p.available}`);
        if (p.by && factById.has(p.by) && factById.get(p.by).para > p.out) err(q.id, `${p.value}: out ¶${p.out} before its fact ${p.by}`);
    }
    if (q.answer != null) {
        const p = ps.find((x) => x.value === q.answer);
        if (!p) err(q.id, `answer "${q.answer}" is not a possibility`);
        else if (p.out != null) err(q.id, `the answer is ruled out at ¶${p.out}`);
    }
    if (q.answer != null) {
        if (!Number.isInteger(q.answer_given_at) || !q.answer_given_quote) err(q.id, 'an answer needs answer_given_at and its quote');
        else quoteIn(`${q.id} answer given`, q.answer_given_quote, q.answer_given_at);
        if (!('answer_inferable_at' in q)) err(q.id, 'an answer needs answer_inferable_at (null: only the give-away)');
        const ia = q.answer_inferable_at;
        if (ia != null) {
            if (ia > q.answer_given_at) err(q.id, `answer inferable ¶${ia} after given ¶${q.answer_given_at}`);
            if (!q.answer_from || !refOk(q.answer_from)) err(q.id, `answer_from: no fact or thought ${q.answer_from}`);
            else if (factById.has(q.answer_from) && earliest(factById.get(q.answer_from)) > ia) err(q.id, `answer_from ${q.answer_from} is later than ¶${ia}`);
            else if (q.answer_from.startsWith('thought ') && Number(q.answer_from.slice(9).split('.')[0]) > ia) err(q.id, `answer_from ${q.answer_from} is later than ¶${ia}`);
        }
        if (q.answer_strength && !STRENGTHS.has(q.answer_strength)) err(q.id, `answer_strength ${q.answer_strength}`);
    }
    if (q.old && !oldIds.has(q.old)) err(q.id, `old: no ${q.old}`);
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
    const ahead = facts.filter((f) => Number.isInteger(f.inferable_at) && givenAt(f) != null && f.inferable_at < givenAt(f));
    console.log(`\nFacts inferable before the story states them (${ahead.length})\n` + ahead.map((f) => `  ¶${f.inferable_at} → ¶${givenAt(f)}  ${f.id}${f.strength === 'likely' ? ' (likely)' : ''}`).join('\n'));
    const early = facts.filter((f) => f.given_at != null && f.given_at < f.para);
    console.log(`\nFacts given before the paragraph that tells them in full (${early.length})\n` + early.map((f) => `  ¶${f.given_at} (told ¶${f.para})  ${f.id}`).join('\n'));
    const never = facts.filter((f) => givenAt(f) == null);
    console.log(`\nFacts never stated by ¶46, only inferable (${never.length}): ${never.map((f) => f.id).join(', ')}`);
    console.log('\nAnswers: inferable → given\n' + questions.filter((q) => q.answer != null).map((q) => `  ${q.answer_inferable_at == null ? '  —' : `¶${q.answer_inferable_at}`.padStart(4)} → ¶${String(q.answer_given_at).padEnd(4)} ${q.id} = ${q.answer}${q.answer_strength === 'likely' ? ' (likely)' : ''}`).join('\n'));
    const met = contradictions(world, asserted).sort((p, q) => Math.max(p.a.para, p.b.para) - Math.max(q.a.para, q.b.para));
    const tag = (x) => `${x.id}${x.truth === false ? ' (false)' : x.truth == null ? ' (?)' : ''} ¶${x.para}`;
    console.log(`\nContradictions a reader trusting every source meets (${met.length}), by the paragraph that completes them\n` + met.map((c) => `  ¶${Math.max(c.a.para, c.b.para)}  ${c.why}: ${tag(c.a)} / ${tag(c.b)}`).join('\n'));
    show('Facts by origin', count(told, (f) => [...new Set(prov.factChains(f.id).map((c) => c.origin ?? '?'))].join(' + ') || '(reader)'));
}
console.log(`${errors.length} error(s)`);
process.exit(errors.length ? 1 : 0);
