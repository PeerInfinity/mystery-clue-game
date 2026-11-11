#!/usr/bin/env node
// Compare a run's data with the case's current data, by content, not by id (pipeline/README.md, "The comparison").
//
//   node pipeline/compare.mjs <case> [scenes|reading|entities|times|facts|questions|all]
//
// Entities are matched by the phrases that name them (a shared mention), then by name; time points by paragraph
// and words; facts by (of, attr, paragraph) through the entity matching, then by value; questions by the words of
// their labels and their possibilities; the reading's annotations by paragraph (±1) and words. The earlier game's
// scenes and annotated reading (v1/cases/<case>/) stand in for the scenes and the reading. Writes
// runs/<case>/compare/<part>.md and prints a summary.
import fs from 'node:fs';
import path from 'node:path';
import { CASES, ROOT, runDir, caseDir, readJson, list } from './lib.mjs';
import { normalize } from '../engine/story.js';

const [name, part = 'all'] = process.argv.slice(2);
if (!CASES[name]?.target) { console.error('usage: compare.mjs <case with a target> [part]'); process.exit(2); }
const T = path.join(ROOT, CASES[name].target), N = caseDir(name);
const V1 = path.join(ROOT, '..', 'v1', CASES[name].target);
const outDir = path.join(runDir(name), 'compare');
fs.mkdirSync(outDir, { recursive: true });

const STOP = new Set('the a an and or of to in on at by for with from as is was were be been it its his her he she they them their that this which who what when where why how not no but if so do does did has have had into upon there then than all any one two my our your you we i me him us said says'.split(' '));
const words = (s) => new Set(normalize(String(s ?? '')).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
const jacc = (a, b) => { const A = words(a), B = words(b); if (!A.size || !B.size) return 0; let n = 0; for (const x of A) if (B.has(x)) n++; return n / (A.size + B.size - n); };
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '–');
const w = (f) => readJson(f, null);
const world = (dir) => ({
    entities: w(path.join(dir, 'world/entities.json'))?.entities ?? [], mentions: w(path.join(dir, 'world/mentions.json'))?.entities ?? {},
    times: w(path.join(dir, 'world/times.json'))?.times ?? [], facts: w(path.join(dir, 'world/facts.json'))?.facts ?? [],
    accounts: w(path.join(dir, 'world/accounts.json'))?.accounts ?? [], questions: w(path.join(dir, 'world/questions.json'))?.questions ?? [],
});
const old = world(T), neu = world(N);
const report = {};
const write = (key, title, lines) => { fs.writeFileSync(path.join(outDir, `${key}.md`), `# ${title}\n\n${lines.join('\n')}\n`); };

// --- Scenes: the run's scenes against the earlier game's (their paragraphs from the reading's thoughts).
function scenes() {
    const run = w(path.join(N, 'scenes.json'))?.scenes ?? [];
    const th = w(path.join(V1, 'thoughts.json'))?.thoughts ?? [];
    const ranges = new Map();
    for (const t of th) { const r = ranges.get(t.scene) ?? [Infinity, -1]; ranges.set(t.scene, [Math.min(r[0], t.para), Math.max(r[1], t.para)]); }
    const oldStarts = [...ranges.values()].map((r) => r[0]).sort((a, b) => a - b);
    const L = ['| run scene | ¶ | title | nearest earlier-game start |', '|---|---|---|---|'];
    for (const s of run) { const near = oldStarts.reduce((b, x) => (Math.abs(x - s.from) < Math.abs(b - s.from) ? x : b), Infinity); L.push(`| ${s.id} | ${s.from}–${s.to} | ${s.title} | ¶${near} (${near - s.from >= 0 ? '+' : ''}${near - s.from}) |`); }
    L.push('', `Earlier game's scenes (by their annotations' paragraphs): ${[...ranges.entries()].map(([k, r]) => `${k} ¶${r[0]}–${r[1]}`).join(', ')}`);
    write('scenes', 'Scenes', L);
    report.scenes = `${run.length} scenes (earlier game ${ranges.size})`;
}

// --- The reading: each annotation of the earlier game matched to the run's by paragraph (±1) and words.
function reading() {
    const run = w(path.join(N, 'reading.json'))?.thoughts ?? [];
    const th = w(path.join(V1, 'thoughts.json'))?.thoughts ?? [];
    const L = [];
    const best = (t, pool) => pool.filter((x) => Math.abs(x.para - t.para) <= 1).map((x) => ({ x, s: jacc(`${x.text} ${x.reads ?? ''}`, `${t.text} ${t.reads ?? ''}`) })).sort((a, b) => b.s - a.s)[0];
    const matched = th.map((t) => ({ t, m: best(t, run) })).map(({ t, m }) => ({ t, m: m && m.s >= 0.2 ? m : null }));
    const byTag = {};
    for (const { t, m } of matched) { const k = t.tag; byTag[k] = byTag[k] ?? [0, 0]; byTag[k][1]++; if (m) byTag[k][0]++; }
    L.push(`Run: ${run.length} annotations; earlier game: ${th.length}. Matched (¶±1, words ≥ 0.2): ${matched.filter((x) => x.m).length} (${pct(matched.filter((x) => x.m).length, th.length)}).`, '');
    L.push('| tag | earlier | matched | run |', '|---|---|---|---|');
    const runTags = {}; for (const t of run) runTags[t.tag] = (runTags[t.tag] ?? 0) + 1;
    for (const k of [...new Set([...Object.keys(byTag), ...Object.keys(runTags)])].sort()) L.push(`| ${k} | ${byTag[k]?.[1] ?? 0} | ${byTag[k]?.[0] ?? 0} | ${runTags[k] ?? 0} |`);
    L.push('', `Hindsight marks: run ${run.filter((t) => t.hindsight).length}, earlier ${th.filter((t) => t.hindsight && t.hindsight !== 'none').length}. Wrong turns (DROP): run ${run.filter((t) => t.tag === 'DROP').length}, earlier ${th.filter((t) => t.tag === 'DROP').length}.`);
    L.push('', '## The earlier reading\'s annotations with no match (not RECORD or SET ASIDE)', '');
    for (const { t } of matched.filter((x) => !x.m && !['RECORD', 'SET ASIDE'].includes(x.t.tag))) L.push(`- \`${t.id}\` ${t.tag} ¶${t.para}: ${t.text}`);
    write('reading', 'The annotated reading', L);
    report.reading = `${run.length} annotations; ${pct(matched.filter((x) => x.m).length, th.length)} of the earlier ${th.length} matched`;
}

// --- Entities: new → old by a shared phrase (a mention or the name), then by the words of the name.
const phrasesOf = (d, e) => [e.name, ...list(d.mentions[e.id]).map((p) => (typeof p === 'string' ? p : p.text))].map((p) => normalize(String(p)).toLowerCase().replace(/^the /, ''));
let entMap = null;
function entityMap() {
    if (entMap) return entMap;
    entMap = new Map();
    const index = new Map();
    for (const e of old.entities) for (const p of phrasesOf(old, e)) index.set(`${e.kind}|${p}`, [...(index.get(`${e.kind}|${p}`) ?? []), e.id]), index.set(`*|${p}`, [...(index.get(`*|${p}`) ?? []), e.id]);
    for (const e of neu.entities) {
        const votes = new Map();
        for (const p of phrasesOf(neu, e)) for (const id of [...(index.get(`${e.kind}|${p}`) ?? []), ...(index.get(`*|${p}`) ?? [])]) votes.set(id, (votes.get(id) ?? 0) + 1);
        let top = old.entities.find((o) => o.id === e.id && o.kind === e.kind)?.id ?? [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        if (!top) { const c = old.entities.filter((o) => o.kind === e.kind).map((o) => ({ o, s: jacc(o.name, e.name) })).sort((a, b) => b.s - a.s)[0]; if (c && c.s >= 0.5) top = c.o.id; }
        if (top) entMap.set(e.id, top);
    }
    return entMap;
}
function entities() {
    const m = entityMap();
    const hit = new Set(m.values());
    const L = [`Run ${neu.entities.length}, current ${old.entities.length}; run entities matched ${m.size} (${pct(m.size, neu.entities.length)}); current entities found ${hit.size} (${pct(hit.size, old.entities.length)}).`, ''];
    L.push('## Current entities the run lacks', '', ...old.entities.filter((e) => !hit.has(e.id)).map((e) => `- ${e.id} (${e.kind}): ${e.name}`));
    L.push('', '## Run entities with no match', '', ...neu.entities.filter((e) => !m.has(e.id)).map((e) => `- ${e.id} (${e.kind}): ${e.name}`));
    L.push('', '## Matches', '', ...[...m.entries()].map(([a, b]) => `- ${a} → ${b}`));
    write('entities', 'Entities', L);
    report.entities = `run ${neu.entities.length}, current ${old.entities.length}; ${pct(hit.size, old.entities.length)} of the current found`;
}

// --- Time points: by paragraph and quote or label words.
function times() {
    const used = new Set();
    const pairs = [];
    for (const t of neu.times) {
        const c = old.times.filter((o) => !used.has(o.id)).map((o) => ({ o, s: (o.para != null && o.para === t.para ? 0.5 : 0) + jacc(`${o.label} ${o.quote ?? ''}`, `${t.label} ${t.quote ?? ''}`) })).sort((a, b) => b.s - a.s)[0];
        if (c && c.s >= 0.45) { used.add(c.o.id); pairs.push([t, c.o]); }
    }
    const L = [`Run ${neu.times.length}, current ${old.times.length}; matched ${pairs.length}.`, '', '## Current time points the run lacks', '', ...old.times.filter((o) => !used.has(o.id)).map((o) => `- ${o.id}: ${o.label}${o.para != null ? ` (¶${o.para})` : ''}`), '', '## Matches', '', ...pairs.map(([a, b]) => `- ${a.id} "${a.label}" → ${b.id} "${b.label}"`)];
    write('times', 'Time points', L);
    report.times = `run ${neu.times.length}, current ${old.times.length}; ${pct(pairs.length, old.times.length)} of the current matched`;
    return new Map(pairs.map(([a, b]) => [a.id, b.id]));
}

// --- Facts: (of, attr, para ±1) through the entity map, then the value (an entity through the map, or words).
function facts() {
    const m = entityMap();
    const val = (f, d) => (typeof f.value === 'string' && (d === neu ? m.get(f.value) : f.value)) || f.value;
    const used = new Set();
    const pairs = [];
    for (const f of neu.facts) {
        const of = m.get(f.of) ?? f.of;
        const cands = old.facts.filter((o) => !used.has(o.id) && o.attr === f.attr && o.of === of && Math.abs(o.para - f.para) <= 1);
        const c = cands.map((o) => ({ o, s: (JSON.stringify(val(f, neu)) === JSON.stringify(o.value) ? 1 : 0) + jacc(`${o.value} ${o.detail ?? ''} ${o.quote}`, `${f.value} ${f.detail ?? ''} ${f.quote}`) + (o.para === f.para ? 0.2 : 0) })).sort((a, b) => b.s - a.s)[0];
        if (c && c.s >= 0.3) { used.add(c.o.id); pairs.push([f, c.o]); }
    }
    // A second pass: the same paragraph and much the same quote, whatever the shape (another attribute or subject).
    const loose = [];
    for (const f of neu.facts.filter((x) => !pairs.some(([y]) => y === x))) {
        const c = old.facts.filter((o) => !used.has(o.id) && o.para === f.para).map((o) => ({ o, s: jacc(o.quote, f.quote) })).sort((a, b) => b.s - a.s)[0];
        if (c && c.s >= 0.5) { used.add(c.o.id); loose.push([f, c.o]); }
    }
    const byAttr = {};
    for (const o of old.facts) { byAttr[o.attr] = byAttr[o.attr] ?? [0, 0, 0]; byAttr[o.attr][1]++; if (used.has(o.id)) byAttr[o.attr][0]++; }
    for (const f of neu.facts) { byAttr[f.attr] = byAttr[f.attr] ?? [0, 0, 0]; byAttr[f.attr][2]++; }
    const L = [`Run ${neu.facts.length}, current ${old.facts.length}; matched ${pairs.length} by shape (entity, attribute, paragraph): ${pct(pairs.length, old.facts.length)} of the current, ${pct(pairs.length, neu.facts.length)} of the run's; ${loose.length} more by the same quote in another shape: ${pct(pairs.length + loose.length, old.facts.length)} of the current in all.`, '', '| attr | current | matched | run |', '|---|---|---|---|', ...Object.entries(byAttr).sort((a, b) => b[1][1] - a[1][1]).map(([k, [a, b, c]]) => `| ${k} | ${b} | ${a} | ${c} |`)];
    const mp = new Set([...pairs, ...loose].map(([f]) => f.id));
    L.push('', '## Current facts the run lacks', '', ...old.facts.filter((o) => !used.has(o.id)).map((o) => `- ¶${o.para} ${o.id}: ${o.of} ${o.attr} ${JSON.stringify(o.value)} — “${o.quote}”`));
    L.push('', '## Run facts with no match', '', ...neu.facts.filter((f) => !mp.has(f.id)).map((f) => `- ¶${f.para} ${f.id}: ${f.of} ${f.attr} ${JSON.stringify(f.value)} — “${f.quote}”`));
    // Provenance: whose account each matched fact is in.
    const acctOf = (d, id) => d.accounts.filter((a) => list(a.facts).includes(id)).map((a) => a.origin ?? '?');
    let same = 0; for (const [f, o] of pairs) { const a = acctOf(neu, f.id).map((x) => m.get(x) ?? x), b = acctOf(old, o.id); if (a.some((x) => b.includes(x)) || (!a.length && !b.length)) same++; }
    L.splice(1, 0, `Of the matched, ${same} (${pct(same, pairs.length)}) are in an account of the same origin (or in none in both).`);
    write('facts', 'Facts', L);
    L.push('', '## Matched by quote in another shape', '', ...loose.map(([f, o]) => `- ¶${f.para} run ${f.of} ${f.attr} ${JSON.stringify(f.value)} — current ${o.of} ${o.attr} ${JSON.stringify(o.value)}`));
    report.facts = `run ${neu.facts.length}, current ${old.facts.length}; ${pct(pairs.length, old.facts.length)} of the current matched by shape, ${pct(pairs.length + loose.length, old.facts.length)} with the same quote in another shape; same origin ${pct(same, pairs.length)}`;
}

// --- Questions: by label words and shared possibilities.
function questions() {
    const m = entityMap();
    const pv = (q, d) => list(q.possibilities).map((p) => (d === neu ? m.get(p.value) ?? p.value : p.value)).filter((v) => v !== 'something else');
    const used = new Set();
    const pairs = [];
    for (const q of neu.questions) {
        const c = old.questions.filter((o) => !used.has(o.id)).map((o) => { const a = pv(q, neu), b = pv(o, old); const share = a.filter((v) => b.includes(v) || b.some((x) => jacc(x, v) >= 0.5)).length; return { o, s: (o.id === q.id ? 0.5 : 0) + jacc(o.label, q.label) + (share ? 0.2 * share : 0) }; }).sort((a, b) => b.s - a.s)[0];
        if (c && c.s >= 0.35) { used.add(c.o.id); pairs.push([q, c.o]); }
    }
    const ans = pairs.filter(([q, o]) => q.answer != null && (m.get(q.answer) ?? q.answer) === o.answer).length;
    const L = [`Run ${neu.questions.length}, current ${old.questions.length}; matched ${pairs.length}; same answer ${ans}.`, '', '## Current questions the run lacks', '', ...old.questions.filter((o) => !used.has(o.id)).map((o) => `- ${o.id} (raised ¶${o.raised}): ${o.label}`), '', '## Run questions with no match', '', ...neu.questions.filter((q) => !pairs.some(([a]) => a === q)).map((q) => `- ${q.id} (raised ¶${q.raised}): ${q.label}`), '', '## Matches', '', ...pairs.map(([q, o]) => `- “${q.label}” (¶${q.raised}) → “${o.label}” (¶${o.raised}); possibilities ${pv(q, neu).length} / ${pv(o, old).length}${q.answer != null ? `; answer ${q.answer} / ${o.answer}` : ''}`)];
    write('questions', 'Questions', L);
    report.questions = `run ${neu.questions.length}, current ${old.questions.length}; ${pairs.length} matched`;
}

const parts = { scenes, reading, entities, times, facts, questions };
for (const [k, f] of Object.entries(parts)) if (part === 'all' || part === k) f();
for (const [k, v] of Object.entries(report)) console.log(`${k}: ${v}`);
