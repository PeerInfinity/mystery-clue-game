#!/usr/bin/env node
// Validate a case directory and write its report.
//
//   node scripts/validate-case.js cases/silver-blaze [--quiet]
//
// Checks: unique ids and resolving references; every quote found in the story; slot answers in their
// domains; the true solution satisfies every constraint; with all evidence (derived claims excluded) every
// determined slot has exactly its answer left (uniqueness), and every undetermined slot really is open;
// every derived claim and route step follows from its premises; theories fit the clues their holders had
// and fail on the full set. Writes <case>/report.md.

import fs from 'node:fs';
import path from 'node:path';
import { mergeCase, buildModel, activeConstraints, checkStep } from '../engine/caseModel.js';
import { evaluate, literalsOf, render } from '../engine/logic.js';
import Ajv2020 from 'ajv/dist/2020.js';
import { Story } from '../engine/story.js';

const dir = process.argv[2];
const quiet = process.argv.includes('--quiet');
if (!dir) {
    console.error('usage: validate-case.js <case dir>');
    process.exit(2);
}

const readJson = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const main = readJson('case.json');
const parts = Object.fromEntries((main.parts ?? []).map((p) => [p, readJson(p)]));
const data = mergeCase(main, parts);
if (main.mentions_file) {
    const m = readJson(main.mentions_file);
    data.mentions = { entities: m.entities, windows: m.windows };
}
const model = buildModel(data);
const errors = [...model.errors];
{
    const schema = JSON.parse(fs.readFileSync(new URL('../schema/case.schema.json', import.meta.url), 'utf8'));
    const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
    if (!validate(data)) {
        for (const e of validate.errors.slice(0, 40)) errors.push(`schema: ${e.instancePath || '/'} ${e.message}`);
    }
}
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// ---------- quotes ----------
const normalize = (s) => s
    .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/—/g, '--').replace(/_/g, '')
    .replace(/\s+/g, ' ').trim();
const storyRaw = fs.readFileSync(path.join(dir, data.case.source.text_file), 'utf8');
const storyLines = storyRaw.split('\n');
const story = normalize(storyRaw);
// Map from a normalized offset back to a line: normalize each line and track cumulative offsets.
const lineStarts = [];
{
    let acc = '';
    for (const line of storyLines) {
        const n = normalize(line);
        if (!n) continue;
        lineStarts.push([acc.length + (acc ? 1 : 0), storyLines.indexOf(line) + 1]);
        acc = acc ? `${acc} ${n}` : n;
    }
}
const lineOf = (offset) => {
    let best = 1;
    for (const [start, line] of lineStarts) {
        if (start > offset) break;
        best = line;
    }
    return best;
};
let nQuotes = 0;
const quoteLines = new Map();
const checkQuotes = (owner, quotes) => {
    if (!quotes) return;
    if (!Array.isArray(quotes)) return err(`${owner}: source must be an array`);
    for (const q of quotes) {
        nQuotes++;
        const at = story.indexOf(normalize(q));
        if (at < 0) err(`${owner}: quote not found in story: "${q.slice(0, 60)}"`);
        else quoteLines.set(`${owner}|${q}`, lineOf(at));
    }
};
for (const s of data.scenes) checkQuotes(s.id, s.source);
for (const q of data.questions ?? []) checkQuotes(q.id, [q.raised]);
for (const x of data.inconsistencies ?? []) checkQuotes(x.id, x.source);
for (const sec of ['entities', 'events', 'rules', 'constraints', 'actions', 'route']) {
    for (const item of data[sec] ?? []) checkQuotes(item.id, item.source);
}
for (const e of data.entities ?? []) for (const n of e.notes ?? []) checkQuotes(e.id, n.source);
for (const g of data.glosses ?? []) if (g.after) checkQuotes(g.id, [g.after]);
for (const c of data.claims ?? []) for (const a of c.attested ?? []) checkQuotes(c.id, a.source);

// ---------- the story index: mentions, quotes per paragraph, gates ----------
const storyIndex = new Story(storyRaw, data);
for (const p of storyIndex.problems) err(`story: ${p}`);
for (const id of Object.keys(data.mentions?.entities ?? {})) if (!model.cards.has(id)) err(`mentions: unknown entity ${id}`);
for (const id of Object.keys(data.mentions?.windows ?? {})) if (!model.windows.some((w) => w.id === id)) err(`mentions: unknown window ${id}`);
for (const r of data.rules ?? []) {
    if (!(r.attaches_to ?? []).length) err(`${r.id}: a rule must sit on at least one card (attaches_to)`);
    for (const e of r.attaches_to ?? []) if (!model.cards.has(e)) err(`${r.id}: attaches_to unknown ${e}`);
}
for (const q of data.questions ?? []) if (!storyIndex.anchors.questions.has(q.id)) err(`${q.id}: 'raised' quote not found`);
// A note is something learned AFTER the first mention: its quote must be found, and not before the mention.
for (const e of data.entities ?? []) {
    const first = storyIndex.firstAt.get(e.id);
    for (const n of e.notes ?? []) {
        const hit = storyIndex.find(n.source[0]);
        if (!hit) err(`${e.id}: note quote not within one paragraph: "${n.source[0].slice(0, 50)}"`);
        else if (hit.para < first) err(`${e.id}: note at paragraph ${hit.para} comes before the first mention (${first})`);
    }
}

// ---------- references ----------
const ID = /^[a-z][a-z0-9_.]*$/;
const sceneIds = new Set(data.scenes.map((s) => s.id));
const windowIds = new Set(model.windows.map((w) => w.id));
const has = (id) => model.cards.has(id);
for (const id of model.cards.keys()) if (!ID.test(id)) err(`bad id ${id}`);
for (const e of data.entities) {
    if (e.within && !has(e.within)) err(`${e.id}: within → unknown ${e.within}`);
    if (e.first_mentioned && !sceneIds.has(e.first_mentioned)) err(`${e.id}: unknown scene ${e.first_mentioned}`);
}
for (const s of data.scenes) {
    if (!windowIds.has(s.time)) err(`${s.id}: unknown window ${s.time}`);
    if (!has(s.place)) err(`${s.id}: unknown place ${s.place}`);
}
for (const e of data.events) if (e.told_in && !sceneIds.has(e.told_in)) err(`${e.id}: unknown scene ${e.told_in}`);
for (const c of data.claims) {
    for (const a of c.about ?? []) if (!has(a)) err(`${c.id}: about → unknown ${a}`);
    for (const a of c.attested ?? []) {
        if (a.by && !has(a.by)) err(`${c.id}: attested by unknown ${a.by}`);
        if (a.to && !has(a.to)) err(`${c.id}: attested to unknown ${a.to}`);
        if (!sceneIds.has(a.scene)) err(`${c.id}: unknown scene ${a.scene}`);
    }
    if (c.truth === false && c.asserts && !c.truth_slot) err(`${c.id}: a false claim that asserts something needs a truth slot`);
}
for (const r of data.rules ?? []) if (r.stated_in && !sceneIds.has(r.stated_in)) err(`${r.id}: unknown scene ${r.stated_in}`);
for (const g of data.glosses ?? []) for (const a of g.attaches_to ?? []) if (!has(a)) err(`${g.id}: attaches_to unknown ${a}`);
for (const q of data.questions ?? []) if (!model.slots.has(q.slot)) err(`${q.id}: unknown slot ${q.slot}`);

// ---------- slots ----------
for (const s of model.slots.values()) {
    if (!s.domain.length) err(`slot ${s.id}: empty domain`);
    if (s.answer !== null && s.answer !== undefined && !s.domain.includes(s.answer)) err(`slot ${s.id}: answer ${s.answer} not in its domain`);
    if (Array.isArray(s.undetermined)) for (const v of s.undetermined) if (!s.domain.includes(v)) err(`slot ${s.id}: undetermined value ${v} not in its domain`);
}
for (const k of model.constraints.values()) {
    for (const [slot, value] of literalsOf(k.formula)) {
        if (slot === null) { if (!windowIds.has(value)) err(`${k.id}: unknown window ${value}`); continue; }
        const s = model.slots.get(slot);
        if (s && !s.domain.includes(value)) err(`${k.id}: ${slot} is compared with ${value}, which is not in its domain`);
    }
}

if (errors.length || !model.problem) finish();

// ---------- the solution satisfies every constraint ----------
const truth = new Map();
for (const s of model.slots.values()) if (!s.latent && s.answer !== null && s.answer !== undefined) truth.set(s.id, s.answer);
// Variant constraints and latent slots are the player's other reading of a claim (see caseModel): not the case's.
for (const k of model.constraints.values()) {
    if (k.variant) continue;
    if (evaluate(k.formula, truth, model.timeOrder) === false) err(`the true solution violates ${k.id}: ${k.label}`);
}
const allIds = [...model.constraints.keys()].filter((id) => !model.constraints.get(id).variant);
const evidenceIds = allIds.filter((id) => !model.constraints.get(id).derived);
// Undetermined slots: the solution must still extend to them.
const fullCheck = model.problem.consistent(allIds, Object.fromEntries(truth));
if (!fullCheck.ok) err('no full solution extends the given answers under all constraints');

if (errors.length) finish();

// ---------- uniqueness ----------
const slotRows = [];
for (const s of model.slots.values()) {
    if (s.latent) continue;
    const cands = model.problem.candidates(evidenceIds, s.id);
    let status;
    if (Array.isArray(s.undetermined)) {
        const want = [...s.undetermined].sort().join(',');
        status = [...cands].sort().join(',') === want ? 'open as recorded' : `OPEN SET DIFFERS (left: ${cands.join(', ')})`;
        if (!status.startsWith('open as')) warn(`slot ${s.id}: recorded as one of [${s.undetermined}] but the evidence leaves [${cands}]`);
    } else if (s.undetermined) {
        status = cands.length > 1 ? `open (${cands.length} left)` : `DETERMINED as ${cands[0]} though recorded open`;
        if (cands.length <= 1) warn(`slot ${s.id}: recorded as open but the evidence fixes it to ${cands[0]}`);
    } else if (cands.length === 1 && cands[0] === s.answer) {
        status = 'unique';
    } else {
        status = `NOT UNIQUE (${cands.length} left${cands.length <= 6 ? `: ${cands.join(', ')}` : ''})`;
        err(`slot ${s.id}: answer ${s.answer} is not forced by the evidence; ${cands.length} values left${cands.length <= 6 ? ` (${cands.join(', ')})` : ''}`);
    }
    slotRows.push({ slot: s, cands, status });
}

// ---------- derived claims ----------
const derivedRows = [];
for (const c of data.claims) {
    if (!c.derived || !c.asserts) continue;
    const res = checkStep(model, [...model.cards.keys()].filter((id) => {
        const k = model.cards.get(id);
        return !(k.section === 'claims' && k.derived);
    }), { formula: c.asserts });
    if (!res.ok) err(`derived claim ${c.id} does not follow from the evidence`);
    derivedRows.push({ claim: c, ok: res.ok, used: res.used ?? [] });
}

// ---------- fair play: what the reader can settle by the challenge scene ----------
const challenge = model.sceneOrder.get(data.case.challenge_scene);
const firstScene = (c) => Math.min(...(c.attested ?? []).map((a) => model.sceneOrder.get(a.scene)));
const knownBy = (sceneIdx) => {
    const known = new Set();
    for (const c of data.claims) if (!c.derived && firstScene(c) <= sceneIdx) known.add(c.id);
    for (const r of data.rules ?? []) known.add(r.id);
    return known;
};
const fairRows = [];
{
    const known = knownBy(challenge);
    const knownNoLateRules = new Set([...known].filter((id) => {
        const r = model.cards.get(id);
        return r.section !== 'rules' || model.sceneOrder.get(r.stated_in) <= challenge;
    }));
    const act = activeConstraints(model, known);
    const actStrict = activeConstraints(model, knownNoLateRules);
    for (const q of data.questions) {
        fairRows.push({
            q,
            withRules: model.problem.candidates(act, q.slot),
            strict: model.problem.candidates(actStrict, q.slot),
        });
    }
}

// ---------- theories ----------
const theoryRows = [];
for (const t of data.theories ?? []) {
    for (const [slot, v] of Object.entries(t.assignment)) {
        if (!model.slots.has(slot)) err(`theory ${t.id}: unknown slot ${slot}`);
        else if (!model.slots.get(slot).domain.includes(v)) err(`theory ${t.id}: ${v} not in the domain of ${slot}`);
    }
    if (errors.length) continue;
    const known = new Set([...(t.holder_knows ?? [])]);
    if (t.holder_knows_by_scene) for (const id of knownBy(model.sceneOrder.get(t.holder_knows_by_scene))) known.add(id);
    for (const ex of t.holder_lacks ?? []) known.delete(ex);
    const theirs = activeConstraints(model, known).filter((id) => !model.constraints.get(id).derived);
    const fitsTheirs = model.problem.consistent(theirs, t.assignment).ok;
    if (!fitsTheirs) err(`theory ${t.id} does not even fit what its holders knew: ${model.problem.explainConflict(theirs, t.assignment)}`);
    const conflict = model.problem.explainConflict(evidenceIds, t.assignment);
    if (t.false !== false && !conflict) err(`theory ${t.id} survives all the evidence`);
    theoryRows.push({ t, fitsTheirs, conflict });
}

// ---------- route (Holmes's steps) ----------
const routeRows = [];
for (const step of data.route ?? []) {
    for (const p of step.premises) if (!has(p)) err(`route ${step.id}: unknown premise ${p}`);
    let res = { ok: null };
    if (step.concludes) {
        const claim = step.concludes.slot ? step.concludes : { formula: step.concludes.formula ?? model.cards.get(step.concludes.claim)?.asserts };
        if (!claim.slot && !claim.formula) { err(`route ${step.id}: nothing to check`); continue; }
        res = checkStep(model, step.premises, claim);
        if (!res.ok) err(`route ${step.id}: premises do not yield its conclusion`);
    }
    routeRows.push({ step, ...res });
}

// ---------- actions ----------
const actionIds = new Set((data.actions ?? []).map((a) => a.id));
for (const a of data.actions ?? []) {
    for (const x of a.requires?.actions ?? []) if (!actionIds.has(x)) err(`${a.id}: requires unknown action ${x}`);
    for (const x of [...(a.requires?.cards ?? []), ...(a.yields?.cards ?? [])]) if (!has(x)) err(`${a.id}: unknown card ${x}`);
    for (const x of [...(a.requires?.items ?? []), ...(a.yields?.items ?? [])]) if (!has(x)) err(`${a.id}: unknown item ${x}`);
    if (a.time && !windowIds.has(a.time)) err(`${a.id}: unknown window ${a.time}`);
    for (const s of [a.during_scene, a.narrated_in]) if (s && !sceneIds.has(s)) err(`${a.id}: unknown scene ${s}`);
}

// Playability: walking the actions in order, every requirement is met by what came before, and every
// reasoning step an action yields has its premises in hand by then. Rules count as known from the start.
const routeById = new Map((data.route ?? []).map((r) => [r.id, r]));
const unyielded = { cards: [], steps: [] };
{
    const known = new Set((data.rules ?? []).map((r) => r.id));
    const items = new Set(data.case.starting_items ?? []);
    const steps = new Set();
    const done = new Set();
    for (const a of [...(data.actions ?? [])].sort((x, y) => x.order - y.order)) {
        const r = a.requires ?? {};
        for (const x of r.actions ?? []) if (!done.has(x)) err(`${a.id}: needs action ${x}, not done before it`);
        for (const x of r.cards ?? []) if (!known.has(x)) err(`${a.id}: needs card ${x}, not known before it`);
        for (const x of r.steps ?? []) if (!steps.has(x)) err(`${a.id}: needs reasoning step ${x}, not made before it`);
        for (const x of r.items ?? []) if (!items.has(x)) err(`${a.id}: needs item ${x}, not held before it`);
        const y = a.yields ?? {};
        for (const x of y.cards ?? []) known.add(x);
        for (const x of y.items ?? []) items.add(x);
        for (const x of y.steps ?? []) {
            const step = routeById.get(x);
            if (!step) { err(`${a.id}: yields unknown step ${x}`); continue; }
            const missing = step.premises.filter((p) => !known.has(p));
            if (missing.length) err(`${a.id}: yields step ${x} before its premises are known (${missing.join(', ')})`);
            steps.add(x);
        }
        done.add(a.id);
    }
    for (const c of data.claims) if (!c.derived && !known.has(c.id)) unyielded.cards.push(c.id);
    for (const r of data.route ?? []) if (!steps.has(r.id)) unyielded.steps.push(r.id);
}

writeReport();
finish();

function finish() {
    for (const w of warnings) console.log(`warning: ${w}`);
    for (const e of errors) console.log(`ERROR: ${e}`);
    console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
    process.exit(errors.length ? 1 : 0);
}

function writeReport() {
    const name = (id) => model.cards.get(id)?.name ?? model.cards.get(id)?.label ?? id;
    const lines = [];
    const out = (s = '') => lines.push(s);
    const count = (sec) => (data[sec] ?? []).length;
    out(`# ${data.case.title} — case report`);
    out();
    out('Generated by `scripts/validate-case.js`. Do not edit by hand.');
    out();
    out('## Counts');
    out();
    const byKind = {};
    for (const e of data.entities) byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
    out(`- cards: ${model.cards.size} — entities ${count('entities')} (${Object.entries(byKind).map(([k, v]) => `${v} ${k}`).join(', ')}), events ${count('events')}, claims ${count('claims')} (${data.claims.filter((c) => c.derived).length} derived), rules ${count('rules')}, glosses ${count('glosses')}`);
    out(`- slots: ${[...model.slots.values()].filter((s) => !s.latent).length}; constraints: ${allIds.length} (${count('constraints')} reasoning, the rest from claims); plus the player's other reading of each claim (${[...model.slots.values()].filter((s) => s.latent).length} latent truth slots)`);
    out(`- quotes: ${nQuotes}, all found in the story`);
    const unique = slotRows.filter((r) => r.status === 'unique').length;
    const open = slotRows.filter((r) => r.slot.undetermined).length;
    out(`- uniqueness: ${unique} slots forced by the evidence, ${open} recorded as left open by the story`);
    out();
    out('## Questions');
    out();
    out('Candidates left for each case question. "By the challenge" uses every clue the reader has by the');
    out(`challenge scene (${data.case.challenge_scene}) plus every rule; "strict" also drops rules the story only`);
    out('states after it.');
    out();
    out('| Question | Answer | All evidence | By the challenge | Strict |');
    out('|---|---|---|---|---|');
    for (const r of fairRows) {
        const s = model.slots.get(r.q.slot);
        const all = slotRows.find((x) => x.slot.id === r.q.slot).cands;
        const fmt = (c) => (c.length <= 4 ? c.join(', ') : `${c.length} left`);
        out(`| ${r.q.text} | ${s.answer ?? `one of ${s.undetermined}`} | ${fmt(all)} | ${fmt(r.withRules)} | ${fmt(r.strict)} |`);
    }
    out();
    out('## Theories');
    out();
    for (const r of theoryRows) {
        out(`### ${r.t.label}`);
        out();
        out(`Held by ${r.t.held_by.map(name).join(', ')}. Fits what they knew: ${r.fitsTheirs ? 'yes' : 'NO'}.`);
        out();
        out(r.conflict ? 'Broken by (a minimal set):' : 'Not broken by the evidence.');
        out();
        for (const id of r.conflict ?? []) {
            const k = model.constraints.get(id);
            out(`- \`${id}\` — ${k.label} *(rests on ${k.premises.join(', ')})*`);
        }
        out();
    }
    out('## Derived claims');
    out();
    for (const r of derivedRows) out(`- \`${r.claim.id}\` ${r.ok ? '✓' : '✗'} — ${r.claim.text} *(via ${r.used.join(', ')})*`);
    out();
    out("## Holmes's route");
    out();
    out('| Step | Premises | Conclusion | Checked |');
    out('|---|---|---|---|');
    for (const r of routeRows) {
        const c = r.step.concludes;
        const what = c ? (c.claim ?? (c.slot ? `${c.slot} ≠ ${c.value}` : render(c.formula))) : '—';
        out(`| \`${r.step.id}\` | ${r.step.premises.join(', ')} | ${what} | ${r.ok === null ? 'not checkable' : r.ok ? '✓' : '✗'} |`);
    }
    out();
    out('## Slots');
    out();
    out('| Slot | Answer | Status |');
    out('|---|---|---|');
    for (const r of slotRows) {
        out(`| \`${r.slot.id}\` | ${r.slot.answer ?? (Array.isArray(r.slot.undetermined) ? `one of ${r.slot.undetermined.join(', ')}` : '—')} | ${r.status} |`);
    }
    out();
    out('## Fabula');
    out();
    out('| # | Event | Time | Told in |');
    out('|---|---|---|---|');
    for (const e of [...data.events].sort((a, b) => a.fabula_order - b.fabula_order)) {
        const t = e.facets?.time;
        const label = (w) => model.windows.find((x) => x.id === w)?.label ?? w;
        out(`| ${e.fabula_order} | ${e.label}${e.implied ? ' *(implied)*' : ''} | ${t ? (Array.isArray(t) ? t.map(label).join(' / ') : label(t)) : '—'} | ${e.told_in ?? ''} |`);
    }
    out();
    if ((data.actions ?? []).length) {
        out('## Investigation');
        out();
        out('| # | Actor | Action | Happens | Told |');
        out('|---|---|---|---|---|');
        for (const a of [...data.actions].sort((x, y) => x.order - y.order)) {
            out(`| ${a.order} | ${name(a.actor)} | ${a.label} | ${a.during_scene ?? '(offstage)'} | ${a.narrated_in ?? ''} |`);
        }
        out();
    }
    if (unyielded.cards.length || unyielded.steps.length) {
        out('Claims no protagonist action yields (the reader is told them, Holmes never collects them):');
        out(unyielded.cards.map((c) => `\`${c}\``).join(', ') || '—');
        out();
        out('Route steps no action yields: ' + (unyielded.steps.map((c) => `\`${c}\``).join(', ') || '—'));
        out();
    }
    out('## Inconsistencies in the text');
    out();
    for (const x of data.inconsistencies ?? []) out(`- **${x.id}** — ${x.summary}`);
    out();
    fs.writeFileSync(path.join(dir, 'report.md'), lines.join('\n'));
    if (!quiet) console.log(`wrote ${path.join(dir, 'report.md')}`);
}
