#!/usr/bin/env node
// Validate the world-model pilot (<case>/world/: entities.json, times.json, facts.json, questions.json) and print
// its counts.
//
//   node scripts/validate-world.js cases/silver-blaze [--quiet]
//
// Checks: ids unique; every `of`, entity-valued value (a location's, or any id with an underscore), `src` link and `covers` names an entity (the case's or the
// world's own); every time reference names a time point and `after` has no cycle; every quote is found in its
// paragraph; a stated or implied fact has a quote; an inferable fact names facts that exist and are told no later
// than its `inferable_at`; an `observes` value names facts; `q`/`pick` name a question and one of its
// possibilities; `old` names a claim, event, slot or question of the old game; a question's `from`/`by` name facts
// (or a reader's thought, "thought t<id>") told no later than the possibility is available (or a `quote` in that
// paragraph names it); every question has exactly one "something else", available from where it is raised; the
// answer is one of the possibilities (or null); a `member_of` value is a group.

import fs from 'node:fs';
import path from 'node:path';
import { normalize } from '../engine/story.js';

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

const errors = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const timeIds = new Set(times.map((t) => t.id));
const factById = new Map(facts.map((f) => [f.id, f]));
const qById = new Map(questions.map((q) => [q.id, q]));

const seen = new Set();
for (const x of [...times, ...facts, ...questions]) {
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
    for (const k of ['at', 'from', 'to', 'after', 'before']) if (f.time?.[k] && !timeIds.has(f.time[k])) err(f.id, `time.${k}: no time ${f.time[k]}`);
    if (!f.time || !Object.keys(f.time).length) err(f.id, 'no time');
    const basis = f.basis ?? 'stated';
    if (!BASES.has(basis)) err(f.id, `basis ${basis}`);
    if (f.quote) quoteIn(f.id, f.quote, f.para);
    else if (basis !== 'inferable') err(f.id, 'a stated or implied fact needs a quote');
    if (basis === 'inferable') {
        if (!list(f.from).length) err(f.id, 'inferable without from');
        if (!Number.isInteger(f.inferable_at)) err(f.id, 'inferable without inferable_at');
        for (const p of list(f.from)) {
            const pf = factById.get(p);
            if (!pf) err(f.id, `from: no fact ${p}`);
            else if (pf.para > f.inferable_at) err(f.id, `from: ${p} is told at ¶${pf.para}, after inferable_at ¶${f.inferable_at}`);
        }
    } else if (f.from) err(f.id, `from on a ${basis} fact`);
    if (f.attr === 'observes') for (const v of list(f.value)) if (!factById.has(v) && /^f\./.test(v)) err(f.id, `observes: no fact ${v}`);
    if ('truth' in f && ![true, false, null].includes(f.truth)) err(f.id, `truth ${f.truth}`);
    const src = list(f.src);
    if (!src.length) err(f.id, 'no src');
    else if (src[0] !== 'watson' && src[0] !== 'holmes') err(f.id, `src starts with ${src[0]}`);
    for (const s of src) if (s !== '…' && !entities.has(s)) err(f.id, `src: no entity ${s}`);
    for (const o of list(f.old)) if (!oldIds.has(o)) err(f.id, `old: no ${o}`);
    if (f.q) {
        const q = qById.get(f.q);
        if (!q) err(f.id, `q: no question ${f.q}`);
        else if (f.pick && !q.possibilities.some((p) => p.value === f.pick)) err(f.id, `pick: ${f.q} has no possibility "${f.pick}"`);
    } else if (f.pick) err(f.id, 'pick without q');
}

// Questions.
const VIAS = new Set(['direct', 'indirect', 'always']);
const refOk = (r) => factById.has(r) || (/^thought /.test(r) && thoughts.has(r.slice(8)));
for (const q of questions) {
    if (q.entry?.of && q.entry.of !== '?' && !entities.has(q.entry.of)) err(q.id, `entry.of: no entity ${q.entry.of}`);
    for (const t of [q.entry?.time, q.entry?.time?.from, q.entry?.time?.to]) if (typeof t === 'string' && t.startsWith('t.') && !timeIds.has(t)) err(q.id, `entry.time: no time ${t}`);
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
        if (p.via !== 'always') {
            if (!Number.isInteger(p.available)) err(q.id, `${p.value}: no available paragraph`);
            if (!p.from && !p.quote) err(q.id, `${p.value}: needs from (a fact or thought) or a quote`);
        }
        if (p.from && !refOk(p.from)) err(q.id, `${p.value}: from: no fact or thought ${p.from}`);
        if (p.from && factById.has(p.from) && factById.get(p.from).para > p.available) err(q.id, `${p.value}: available ¶${p.available} before its fact ${p.from} (¶${factById.get(p.from).para})`);
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
    if (q.old && !oldIds.has(q.old)) err(q.id, `old: no ${q.old}`);
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
    show('Facts by first source link after Watson', count(facts, (f) => list(f.src).slice(0, 2).join(' < ')));
    show('Facts by provenance depth (… = links still to fill)', count(facts, (f) => (list(f.src).includes('…') ? 'has gaps' : 'complete')));
}
console.log(`${errors.length} error(s)`);
process.exit(errors.length ? 1 : 0);
