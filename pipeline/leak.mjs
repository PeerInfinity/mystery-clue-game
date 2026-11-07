#!/usr/bin/env node
// Step 12, the leak check: every label the timeline shows, judged by a blind model that sees only the story up to
// the paragraph where the label first shows. One call per paragraph that shows something new.
//
//   node pipeline/leak.mjs <case dir> <out dir> [--model opus|haiku] [--concurrency 4] [--only 12,40] [--dry]
//   node pipeline/leak.mjs --compare <out dir A> <out dir B>
//
// Labels: entity names (where the story first names the entity, or a fact shown names it), question labels (where
// the question is raised), possibilities that are text (where they become available), time-point labels and
// account labels (where the first fact at that time, or in that account, shows), and a fact shown before the
// paragraph that tells it in full (`given_at`). Each call is recorded (prompt, response, cost) in <out dir>/pNNN/;
// a call already recorded is not made again, so an interrupted run resumes.
import fs from 'node:fs';
import path from 'node:path';
import { paragraphs, numbered, call, jsonLines, list, readJson } from './lib.mjs';
import { Story } from '../engine/story.js';

const args = process.argv.slice(2);
const opt = (k, d = null) => { const i = args.indexOf(`--${k}`); return i < 0 ? d : args[i + 1]; };

const SYSTEM = `You check a reading game for spoilers. The player reads a detective story one paragraph at a time.
Beside the story, the page shows labels: the names of people, places and things, the questions the story raises,
the possible answers to them, the points in time of the events, and short statements of facts. A label may only
tell the player what the story has already told them.

You are given THE STORY SO FAR (everything the player has read) and the LABELS that first appear at its last
paragraph. For each label decide whether everything it says or implies is supported.

SUPPORTED: the story so far states it, or it follows directly and obviously from what is stated; or it is general
knowledge, not about this story's particular people, places, things or events; or it is a plain question or
possibility that the story so far has given a reader reason to consider.

UNSUPPORTED: it tells or hints something about this story that the story so far does not: a name not yet used for
that person or thing, an identity not yet revealed, a detail only a later part of the story supplies, a question
whose wording points at its answer, a possibility nobody could yet have a reason to consider. Do not use any memory
of this story: judge only from the text you are given.

Be strict but fair: ordinary paraphrase is fine. Put your answer in one \`\`\`jsonl block, one line per label:
{"i": <label number>, "verdict": "supported" | "unsupported", "why": "<short reason>"}`;

const ent = (d, id) => d.byId.get(id)?.name ?? id;
const timesOf = (t) => (t ? [t.at, t.from, t.to, t.after, t.before].filter(Boolean) : []);

/** The labels of a case and the paragraph each first shows at. */
export function labels(dir) {
    const r = (f) => readJson(path.join(dir, 'world', f), {});
    const header = r('case.json');
    const text = fs.readFileSync(path.join(dir, 'world', header.story), 'utf8');
    const entities = r('entities.json').entities ?? [];
    const d = { byId: new Map(entities.map((e) => [e.id, e])) };
    const facts = r('facts.json').facts ?? [], questions = r('questions.json').questions ?? [], times = r('times.json').times ?? [], accounts = r('accounts.json').accounts ?? [];
    const named = new Story(text, { mentions: { entities: r('mentions.json').entities ?? {} }, entities });
    const given = (f) => f.given_at ?? ((f.basis ?? 'stated') === 'inferable' ? null : f.para);
    const out = [];
    const at = new Map();
    const firstFact = new Map();
    for (const f of facts) {
        const g = given(f);
        if (g == null) continue;
        for (const id of [f.of, f.to, ...list(f.value)]) if (typeof id === 'string' && d.byId.has(id) && !(firstFact.get(id) <= g)) firstFact.set(id, g);
        for (const t of timesOf(f.time)) if (!(at.get(`t:${t}`) <= g)) at.set(`t:${t}`, g);
        if (f.given_at != null && f.given_at < f.para) out.push({ para: f.given_at, kind: 'fact', text: `${ent(d, f.of)}: ${f.attr} ${typeof f.value === 'string' && d.byId.has(f.value) ? ent(d, f.value) : JSON.stringify(f.value)}${f.detail ? ` (${f.detail})` : ''}`, id: f.id });
    }
    for (const a of accounts) { const ps = list(a.facts).map((id) => facts.find((f) => f.id === id)).filter(Boolean).map(given).filter((x) => x != null); if (ps.length && a.label) out.push({ para: Math.min(...ps), kind: 'account', text: a.label, id: a.id }); }
    for (const e of entities) {
        if (e.kind === 'state') continue;
        const p = Math.min(named.firstAt.get(e.id) ?? Infinity, firstFact.get(e.id) ?? Infinity);
        if (Number.isFinite(p)) out.push({ para: Math.max(p, 1), kind: 'name', text: e.name, id: e.id });
    }
    for (const t of times) { const p = at.get(`t:${t.id}`); if (p != null) out.push({ para: Math.max(p, 1), kind: 'time', text: t.label, id: t.id }); }
    for (const q of questions) {
        if (q.kind === 'provenance') continue;
        const p = q.raised ?? q.answer_given_at;
        if (p == null) continue;
        out.push({ para: p, kind: 'question', text: q.label, id: q.id });
        for (const o of list(q.possibilities)) if (o.via !== 'always' && !d.byId.has(o.value) && o.available != null) out.push({ para: Math.max(o.available, p), kind: 'possibility', text: `${q.label} — ${o.value}`, id: `${q.id}=${o.value}` });
    }
    return { text, items: out.sort((a, b) => a.para - b.para) };
}

async function run(dir, outDir) {
    const model = opt('model', 'haiku');
    const conc = Number(opt('concurrency', 4));
    const only = opt('only')?.split(',').map(Number);
    const { text, items } = labels(dir);
    const paras = paragraphs(text);
    const byPara = new Map();
    for (const x of items) byPara.set(x.para, [...(byPara.get(x.para) ?? []), x]);
    const jobs = [...byPara.entries()].filter(([p]) => !only || only.includes(p));
    console.log(`${items.length} labels at ${byPara.size} paragraphs; model ${model}`);
    let next = 0;
    const work = async () => {
        while (next < jobs.length) {
            const [p, xs] = jobs[next++];
            const d = path.join(outDir, `p${String(p).padStart(3, '0')}`);
            if (fs.existsSync(path.join(d, 'items.json'))) continue;
            const prompt = `THE STORY SO FAR (paragraphs 1 to ${p}):\n\n${numbered(paras, 1, p)}\n\n---\n\nTHE LABELS that first appear at paragraph ${p}:\n\n${xs.map((x, i) => `${i + 1}. (${x.kind}) ${x.text}`).join('\n')}\n\nJudge every label.`;
            const res = await call({ dir: d, prompt, system: SYSTEM, model, dry: args.includes('--dry') });
            if (!res) continue;
            const got = jsonLines(res.text).items;
            const verdicts = xs.map((x, i) => ({ ...x, ...(got.find((g) => g.i === i + 1) ?? { verdict: 'missing' }) }));
            fs.writeFileSync(path.join(d, 'items.json'), JSON.stringify(verdicts, null, 0).replace(/\},\{/g, '},\n{') + '\n');
            const bad = verdicts.filter((v) => v.verdict !== 'supported');
            console.log(`¶${p}: ${xs.length} label(s), ${bad.length} flagged${bad.length ? ': ' + bad.map((b) => b.id).join(', ') : ''}`);
        }
    };
    await Promise.all(Array.from({ length: conc }, work));
    report(outDir);
}

function verdictsOf(outDir) {
    return fs.readdirSync(outDir).filter((d) => /^p\d+$/.test(d)).flatMap((d) => readJson(path.join(outDir, d, 'items.json'), []));
}
function costIn(outDir) {
    let usd = 0, n = 0;
    for (const d of fs.readdirSync(outDir).filter((x) => /^p\d+$/.test(x))) { const m = readJson(path.join(outDir, d, 'meta.json')); if (m) { usd += m.cost_usd ?? 0; n++; } }
    return { usd: Math.round(usd * 100) / 100, n };
}
function report(outDir) {
    const v = verdictsOf(outDir);
    const bad = v.filter((x) => x.verdict !== 'supported');
    const c = costIn(outDir);
    const L = [`# Leak check: ${path.basename(outDir)}`, '', `${v.length} labels, ${bad.length} flagged; ${c.n} calls, $${c.usd}.`, '', ...bad.map((x) => `- ¶${x.para} ${x.kind} \`${x.id}\`: ${x.text} — ${x.verdict}: ${x.why ?? ''}`)];
    fs.writeFileSync(path.join(outDir, 'report.md'), L.join('\n') + '\n');
    console.log(L.slice(2, 3).join('\n'));
}
function compare(a, b) {
    const A = new Map(verdictsOf(a).map((x) => [`${x.kind}|${x.id}`, x])), B = new Map(verdictsOf(b).map((x) => [`${x.kind}|${x.id}`, x]));
    const keys = [...new Set([...A.keys(), ...B.keys()])];
    const flag = (x) => x && x.verdict !== 'supported';
    const both = keys.filter((k) => flag(A.get(k)) && flag(B.get(k))), onlyA = keys.filter((k) => flag(A.get(k)) && !flag(B.get(k))), onlyB = keys.filter((k) => !flag(A.get(k)) && flag(B.get(k)));
    const ca = costIn(a), cb = costIn(b);
    const name = (d) => path.basename(d);
    const row = (k) => { const x = A.get(k) ?? B.get(k); return `- ¶${x.para} ${x.kind} \`${x.id}\`: ${x.text}\n  - ${name(a)}: ${A.get(k)?.verdict ?? '–'}: ${A.get(k)?.why ?? ''}\n  - ${name(b)}: ${B.get(k)?.verdict ?? '–'}: ${B.get(k)?.why ?? ''}`; };
    const L = [`# Leak check compared: ${name(a)} and ${name(b)}`, '', `${keys.length} labels. Flagged by both ${both.length}, only by ${name(a)} ${onlyA.length}, only by ${name(b)} ${onlyB.length}. Cost: ${name(a)} $${ca.usd} (${ca.n} calls), ${name(b)} $${cb.usd} (${cb.n} calls).`, '', '## Flagged by both', '', ...both.map(row), '', `## Only by ${name(a)}`, '', ...onlyA.map(row), '', `## Only by ${name(b)}`, '', ...onlyB.map(row)];
    const out = path.join(path.dirname(a), `compare-${name(a)}-${name(b)}.md`);
    fs.writeFileSync(out, L.join('\n') + '\n');
    console.log(L[2] + `\n→ ${out}`);
}

if (args[0] === '--compare') compare(args[1], args[2]);
else if (args[0] === '--count') { const { items } = labels(args[1]); console.log(items.length, new Set(items.map((x) => x.para)).size, items.reduce((m, x) => ((m[x.kind] = (m[x.kind] ?? 0) + 1), m), {})); }
else if (args.length >= 2) await run(args[0], args[1]);
else console.error('usage: leak.mjs <case dir> <out dir> [--model m] | --compare <a> <b> | --count <case dir>');
