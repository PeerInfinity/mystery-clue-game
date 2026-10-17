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
import { mergeCase, buildModel, activeConstraints, checkStep, verifyInference, seqPairs } from '../engine/caseModel.js';
import { evaluate, literalsOf, render, slotsOf } from '../engine/logic.js';
import Ajv2020 from 'ajv/dist/2020.js';
import { Story } from '../engine/story.js';
import { Game } from '../engine/game.js';

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
if (main.thoughts_file) data.thoughts = readJson(main.thoughts_file).thoughts; // Holmes's steps (Round 57); checked by validate-thoughts
const raw = structuredClone(data); // the model grounds some formulas in place (route conclusions): check the schema on the file's own
delete raw.thoughts;
const model = buildModel(data);
const errors = [...model.errors];
{
    const schema = JSON.parse(fs.readFileSync(new URL('../schema/case.schema.json', import.meta.url), 'utf8'));
    const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
    if (!validate(raw)) {
        for (const e of validate.errors.slice(0, 40)) errors.push(`schema: ${e.instancePath || '/'} ${e.message}`);
    }
}
const warnings = [];
const lateQuotes = []; // cards that appear before the line they are first quoted from (their quote waits to be read)
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
// A model that did not build (a schema that cannot ground, say) has no solver: report why and stop here.
if (errors.length) finish();

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
for (const e of data.entities ?? []) for (const t of e.traits ?? []) checkQuotes(`${e.id} trait ${t.id}`, t.source);
for (const g of data.glosses ?? []) if (g.after) checkQuotes(g.id, [g.after]);
for (const r of data.rules ?? []) if (r.relevant_from) checkQuotes(r.id, [r.relevant_from]);
// Every time window says where the story first reaches it: before that it is not offered as an answer.
for (const w of model.windows) { if (!w.reveal) err(`${w.id}: no 'reveal' quote`); else checkQuotes(w.id, [w.reveal]); }
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
// A trait shows with the card, or with its quote if that comes later: the quote must lie within one paragraph.
for (const e of data.entities ?? []) for (const t of e.traits ?? []) if (!storyIndex.find(t.source[0])) err(`${e.id}: trait ${t.id} quote not within one paragraph: "${t.source[0].slice(0, 50)}"`);

// No clue may give an event a time the story has not reached yet (its label would show early).
{
    const reader = new Game({ ...model, story: storyIndex }, { background: 'relevant' });
    while (!reader.finished()) reader.advance();
    const win = new Map(model.windows.map((w) => [w.id, w]));
    for (const [slot, gs] of reader.givers) {
        for (const g of gs) {
            const w = win.get(g.value);
            const at = reader.unlocked.get(g.claim)?.para;
            const shown = w?.reveal ? storyIndex.find(w.reveal)?.para : undefined;
            if (w && at !== undefined && shown !== undefined && at < shown) err(`${g.claim} gives ${slot} = ${w.id} at paragraph ${at}, but that time is only revealed at ${shown}`);
        }
    }
}

// Glossary notes explain a word the story uses: none may show on a card before the story uses its term. The term
// is found in the text (each part of "Owner, trainer, jockey" counts; a long word also by its first five letters,
// so "lame" finds "lameness"); a gloss with an `after` quote is dated by that quote instead, which is how a term the
// story words differently is placed ("Betting against a horse" → "registered by him against the favourite").
{
    const norm = (t) => t.toLowerCase().replace(/[’‘]/g, "'");
    const paras = storyIndex.paragraphs.map((p) => norm(p.display));
    const STOP = new Set(['a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'with', 'and', 'or', 'his', 'its']);
    const termAt = (term) => {
        let best = Infinity;
        for (const part of term.replace(/[()'‘’]/g, ' ').split(/,|…|\band\b/)) {
            const words = norm(part).split(/[^a-z0-9-]+/).filter((w) => w && !STOP.has(w));
            if (!words.length) continue;
            const phrase = words.join(' ');
            const head = words.find((w) => w.length >= 3) ?? words[0];
            const re = head.length > 5 ? new RegExp(`\\b${head.slice(0, 5)}`) : new RegExp(`\\b${head}\\b`);
            for (let p = 1; p < paras.length && p < best; p++) if (paras[p].includes(phrase) || re.test(paras[p])) best = p;
        }
        return best;
    };
    for (const g of data.glosses ?? []) {
        const after = g.after ? storyIndex.find(g.after)?.para : null;
        const at = after ?? termAt(g.term);
        if (at === Infinity) { err(`${g.id}: the story never uses "${g.term}" — give it an 'after' quote where the thing it explains is used`); continue; }
        for (const c of g.attaches_to ?? []) {
            if (model.cards.get(c)?.section === 'rules') continue; // shown with its fact, by the Background setting
            const first = storyIndex.firstAt.get(c);
            if (first === undefined) continue;
            const shows = Math.max(first, after ?? -1);
            if (shows < at) err(`${g.id}: shows on ${c} at paragraph ${shows}, but the story first uses "${g.term}" at ${at} — add an 'after' quote`);
        }
    }
}

// Names and labels: everything a card is called must come from a line the reader has read. The first must be
// read by the time the card appears (reading the story through, Easy); later ones come in story order.
{
    model.story = storyIndex;
    const reader = new Game(model);
    while (!reader.finished()) reader.advance();
    for (const [sec, key, field] of [['entities', 'names', 'name'], ['events', 'labels', 'label']]) {
        for (const c of data[sec] ?? []) {
            const list = c[key] ?? [];
            if (!list.length) { err(`${c.id}: no ${key}`); continue; }
            const appears = reader.unlocked.get(c.id)?.para;
            let last = -1;
            list.forEach((n, i) => {
                if (n.editorial) {
                    if (c.kind !== 'topic') err(`${c.id}: only a topic card may have an editorial ${field}`);
                    return;
                }
                checkQuotes(c.id, n.source);
                const hit = storyIndex.find(n.source[0]);
                if (!hit) return;
                if (i === 0 && appears !== undefined && hit.para > appears) err(`${c.id}: its first ${field} "${n[field]}" rests on paragraph ${hit.para}, but the card appears at ${appears}`);
                // A card spoken of by an early clue but quoted only from a later line (an implied event, say) shows
                // its quote only once that line is read; list these, so an earlier quote can be given where one exists.
                if (i === 0 && appears !== undefined) {
                    const firstAt = storyIndex.firstAt.get(c.id);
                    if (firstAt !== undefined && firstAt > appears) lateQuotes.push({ id: c.id, appears, firstAt });
                }
                if (hit.para < last) err(`${c.id}: ${key} out of story order at "${n[field]}"`);
                last = Math.max(last, hit.para);
            });
        }
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
// Format 0.3: relations, propositions, rule schemas and the rule applications inferences list.
for (const r of data.relations ?? []) for (const row of [...(r.answers ?? []), ...(r.open ?? [])]) {
    const args = r.answers?.includes(row) ? row.slice(0, -1) : row;
    if (!model.relations.get(r.id)?.slotId(args)) err(`relation ${r.id}: (${args.join(', ')}) is outside its arguments`);
}
for (const p of data.propositions ?? []) if (p.means && !model.cards.get(p.id)?.means) err(`${p.id}: its meaning did not ground`);
for (const r of data.rules ?? []) {
    if (!r.schema) continue;
    for (const [v, spec] of Object.entries(r.schema.vars ?? {})) if (!model.env.cards(spec).length) err(`${r.id}: ?${v} ranges over nothing`);
    for (const c of Object.values(r.schema.vars ?? {}).flatMap((spec) => spec.only ?? [])) if (!has(c)) err(`${r.id}: only → unknown ${c}`);
}
// States (the world model): a track names a card and its aspect; a place set lists places; a track is declared
// once per thing and aspect (the model refuses a second); every declared answer is quoted through a claim's own
// line or derived by an inference (its formula or a rule application it lists).
const stateRows = [];
{
    const placeIds = new Set((data.entities ?? []).filter((e) => e.kind === 'place').map((e) => e.id));
    for (const ps of data.state_places ?? []) for (const p of ps.places) if (!placeIds.has(p)) err(`place set ${ps.id}: ${p} is not a place`);
    for (const sp of data.state_splits ?? []) if (!has(sp.by)) err(`split of ${sp.window}: unknown event ${sp.by}`);
    const trackIds = new Set();
    for (const t of data.states ?? []) {
        if (trackIds.has(t.id)) err(`${t.id}: declared twice`);
        trackIds.add(t.id);
        if (!has(t.of)) err(`${t.id}: of → unknown ${t.of}`);
        const name = t.aspect === 'location' ? 'at' : t.aspect === 'possession' ? 'held' : t.aspect === 'intention' ? 'aims' : t.aspect === 'knowledge' ? `knows_${String(t.knows).replace(/^p\./, '')}` : t.aspect === 'belief' ? `believes_${String(t.believes).replace(/^[pc]\./, '')}` : t.condition;
        if (t.id !== `st.${t.of}.${name}`) err(`${t.id}: a track's id is st.<thing>.<at|held|aims|knows_<proposition>|believes_<proposition or claim>|condition>, here st.${t.of}.${name}`);
        if (t.aspect === 'knowledge' && !(data.propositions ?? []).some((x) => x.id === t.knows)) err(`${t.id}: knows ${t.knows}, which is not a proposition`);
        if (t.aspect === 'intention' && !(data.state_aims ?? []).length) err(`${t.id}: an intention track needs the case's state_aims`);
        for (const a of t.aspect === 'intention' ? Object.values(t.windows ?? {}) : []) if (a !== null && !(data.state_aims ?? []).some((x) => x.id === a)) err(`${t.id}: ${a} is not one of the state_aims`);
        if (t.aspect === 'location' && !t.places) err(`${t.id}: a location track needs its places`);
    }
    // JSON keeps the last of two equal keys: look for a window declared twice in the file's own lines.
    const statesFile = (main.parts ?? []).find((p) => (parts[p].states ?? []).length);
    if (statesFile) for (const line of fs.readFileSync(path.join(dir, statesFile), 'utf8').split('\n')) {
        const ws = [...line.matchAll(/"(w\.[a-z0-9_.]+)":/g)].map((m) => m[1]);
        if (new Set(ws).size !== ws.length) err(`${statesFile}: a window declared twice in ${line.slice(0, 60)}`);
    }
    const filledBy = new Map();
    const note = (slot, by) => { if (!filledBy.has(slot)) filledBy.set(slot, []); filledBy.get(slot).push(by); };
    for (const c of data.claims ?? []) { const f = model.cards.get(c.id)?.asserts; if (f) for (const x of slotsOf(f)) note(x, c.id); }
    for (const k of model.constraints.values()) if (!k.from_claim || k.inference) for (const x of slotsOf(k.formula)) note(x, k.inference ?? k.id);
    for (const s of model.slots.values()) {
        if (!s.track || s.latent) continue; // a statement's belief, unless the case declares it, is latent (workstream 4)
        const by = [...new Set(filledBy.get(s.id) ?? [])];
        if (s.answer !== null && !by.length) err(`state ${s.id}: answered ${s.answer} but no claim states it and no inference derives it`);
        stateRows.push({ slot: s, by });
    }
}
// Absences the player files (`files` on a `via: absence` attestation, Round 83): what was expected (a default rule),
// when it did not happen (windows), and who or what would have registered it (a clue that is no absence itself).
for (const c of data.claims ?? []) for (const a of c.attested ?? []) {
    if (!a.files) continue;
    const f = a.files;
    if (a.via !== 'absence') err(`${c.id}: only an absence is filed (files on a ${a.via} attestation)`);
    if (model.cards.get(f.expectation)?.section !== 'rules') err(`${c.id}: files against ${f.expectation}, which is not a rule`);
    for (const w of f.windows ?? []) if (!windowIds.has(w)) err(`${c.id}: files in unknown window ${w}`);
    const witness = (data.claims ?? []).find((x) => x.id === f.witness);
    if (!witness) err(`${c.id}: its witness ${f.witness} is not a claim`);
    else if ((witness.attested ?? []).every((x) => x.via === 'absence')) err(`${c.id}: its witness ${f.witness} is itself an absence`);
    if (c.derived) err(`${c.id}: a derived claim is proven, not filed`);
}

// Orders within a window (`seq`, Round 73): only a claim states one, quoted through its own line; two different timed
// events, in their true order where the claim is true.
const seqRows = [];
{
    const eventById = new Map((data.events ?? []).map((e) => [e.id, e]));
    for (const c of data.claims ?? []) for (const [a, b] of seqPairs(c.asserts)) {
        const [ea, eb] = [eventById.get(a), eventById.get(b)];
        if (!ea || !eb) { err(`${c.id}: seq names ${ea ? b : a}, which is not an event`); continue; }
        if (a === b) err(`${c.id}: seq puts ${a} before itself`);
        if (!ea.facets?.time || !eb.facets?.time) err(`${c.id}: seq of ${a} and ${b}: both need a time`);
        if (!(c.attested ?? []).some((x) => x.source?.length)) err(`${c.id}: states an order (${a}, ${b}) with no quoted line`);
        if (c.derived) err(`${c.id}: a derived claim (a conclusion to prove) states no order; seq is for what a clue tells`);
        if (c.truth !== false && !(ea.fabula_order < eb.fabula_order)) err(`${c.id}: seq puts ${a} before ${b}, against the fabula order`);
        seqRows.push({ slot: `ord.${a.slice(2)}.${b.slice(2)}`, a, b, by: c.id });
    }
    for (const sec of ['rules', 'constraints', 'propositions']) for (const x of data[sec] ?? []) {
        if (seqPairs([x.formula, x.schema, x.means]).length) err(`${x.id}: seq is for claims (an order the story tells), not ${sec}`);
    }
}
// Traits: every trait a rule or relation ranges over is carried by some card; a card names each trait once.
{
    const carried = new Set((data.entities ?? []).flatMap((e) => (e.traits ?? []).map((t) => t.id)));
    const specs = [
        ...(data.rules ?? []).flatMap((r) => Object.entries(r.schema?.vars ?? {}).map(([v, spec]) => [`${r.id} ?${v}`, spec])),
        ...(data.relations ?? []).flatMap((r) => [...(r.args ?? []), ...(r.values ? [r.values] : [])].map((spec, i) => [`relation ${r.id} argument ${i}`, spec])),
    ];
    for (const [where, spec] of specs) if (spec.trait && !carried.has(spec.trait)) err(`${where}: no card carries the trait ${spec.trait}`);
    for (const e of data.entities ?? []) {
        const ids = (e.traits ?? []).map((t) => t.id);
        if (new Set(ids).size !== ids.length) err(`${e.id}: a trait listed twice`);
    }
}
for (const k of data.constraints ?? []) {
    for (const use of k.rules ?? []) {
        const rule = model.cards.get(use.rule);
        if (!rule || rule.section !== 'rules') { err(`${k.id}: applies ${use.rule}, which is not a background fact`); continue; }
        if (!rule.schema && !rule.formula) err(`${k.id}: applies ${use.rule}, which carries no formula`);
        for (const c of Object.values(use.bind ?? {})) if (!has(c) && !windowIds.has(c)) err(`${k.id}: binds unknown card ${c}`);
    }
}
// Question wording names cards only through {card} placeholders, filled with what the story calls them so far.
for (const [owner, text] of [...(data.questions ?? []).map((q) => [q.id, q.text]), ...(data.slots ?? []).map((sl) => [sl.id, sl.prompt])]) {
    for (const [, id] of text.matchAll(/\{([^}]+)\}/g)) if (!model.cards.has(id)) err(`${owner}: {${id}} is not a card`);
}

// ---------- slots ----------
for (const s of model.slots.values()) {
    if (!s.domain.length) err(`slot ${s.id}: empty domain`);
    if (s.answer !== null && s.answer !== undefined && !s.domain.includes(s.answer)) err(`slot ${s.id}: answer ${s.answer} not in its domain`);
    if (Array.isArray(s.undetermined)) for (const v of s.undetermined) if (!s.domain.includes(v)) err(`slot ${s.id}: undetermined value ${v} not in its domain`);
}
for (const k of model.constraints.values()) {
    for (const [slot, value] of literalsOf(k.formula)) {
        if (slot?.startsWith('rel.') && !model.slots.has(slot)) { err(`${k.id}: lookup names unknown slot ${slot}`); continue; }
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
// A relation slot the story leaves open (whose establishment is never given…) needs only a second possible value;
// every other slot gets its whole candidate list, all in one batch.
const quickOpen = (s) => s.facet === 'relation' && s.undetermined === true;
const witness = model.problem.consistent(evidenceIds).witness ?? new Map();
const batch = model.problem.allCandidates(evidenceIds, [...model.slots.values()].filter((s) => !s.latent && !quickOpen(s)).map((s) => s.id));
const twoValues = (s) => {
    const v0 = witness.get(s.id) ?? s.domain[0];
    const other = model.problem.consistent(evidenceIds, {}, { extra: [{ ne: [s.id, v0] }] });
    return other.ok ? [v0, other.witness.get(s.id)] : [v0];
};
for (const s of model.slots.values()) {
    if (s.latent) continue;
    const cands = quickOpen(s) ? twoValues(s) : batch.get(s.id) ?? s.domain;
    let status;
    if (s.facet === 'order') {
        // The order of two events in one window: settled where the story or the world model fixes it, else open.
        status = cands.length > 1 ? 'open' : `settled: ${cands[0]}`;
    } else if (quickOpen(s)) {
        status = cands.length > 1 ? 'open' : `DETERMINED as ${cands[0]} though recorded open`;
        if (cands.length <= 1) warn(`slot ${s.id}: recorded as open but the evidence fixes it to ${cands[0]}`);
    } else if (Array.isArray(s.undetermined)) {
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

// ---------- inferences: verified (the engine derives the formula from the premises) or asserted ----------
const inferenceRows = [];
for (const k of data.constraints ?? []) {
    const v = model.verified.get(k.id) ?? verifyInference(model, k);
    if (v.status === 'error') err(`inference ${k.id}: ${v.error}`);
    if (v.status === 'vacuous') err(`inference ${k.id}: its premises cannot all hold`);
    if (v.status === 'verified' && k.asserted) warn(`inference ${k.id} is marked asserted but the engine verifies it`);
    inferenceRows.push({ k, ...v });
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
        for (const x of r.thoughts ?? []) if (!steps.has(x)) err(`${a.id}: needs reasoning step ${x}, not made before it`);
        for (const x of r.items ?? []) if (!items.has(x)) err(`${a.id}: needs item ${x}, not held before it`);
        const y = a.yields ?? {};
        for (const x of y.cards ?? []) known.add(x);
        for (const x of y.items ?? []) items.add(x);
        for (const x of y.thoughts ?? []) {
            const step = routeById.get(x);
            if (!step) { err(`${a.id}: yields unknown step ${x}`); continue; }
            const missing = step.premises.filter((p) => !known.has(p));
            if (missing.length) err(`${a.id}: yields step ${x} before its premises are known (${missing.join(', ')})`);
            steps.add(x);
        }
        done.add(a.id);
    }
    for (const c of data.claims) if (!c.derived && !known.has(c.id)) unyielded.cards.push(c.id);
    for (const r of data.route ?? []) if (r.reasoner === 'holmes' && !steps.has(r.id)) unyielded.steps.push(r.id);
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
    out(`- slots: ${[...model.slots.values()].filter((s) => !s.latent).length}; constraints: ${allIds.length} (${count('constraints')} reasoning, the rest from claims); plus the player's other reading of each claim (${[...model.slots.values()].filter((s) => s.latent && !s.track).length} latent truth slots, ${[...model.slots.values()].filter((s) => s.latent && s.track).length} latent belief slots)`);
    out(`- quotes: ${nQuotes}, all found in the story`);
    out(`- relations: ${count('relations')} (${[...model.slots.values()].filter((s) => s.facet === 'relation').length} slots); propositions: ${count('propositions')}`);
    out(`- states: ${count('states')} tracks, ${stateRows.length} declared states (${stateRows.filter((r) => r.slot.answer === null).length} left open)`);
    out(`- inferences: ${inferenceRows.filter((r) => r.status === 'verified').length} verified by the engine from their premises, ${inferenceRows.filter((r) => r.status === 'asserted').length} asserted (format 0.3 migration in progress)`);
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
    out('## Inferences');
    out();
    out('Verified: the engine derives the formula from the claim premises (trusted), the rule applications listed and any');
    out('premise propositions or inferences. Asserted: it stands on the author\'s word until its rules carry formulas.');
    out();
    out('| Inference | Rules applied | Status |');
    out('|---|---|---|');
    for (const r of inferenceRows) {
        out(`| \`${r.k.id}\` | ${(r.k.rules ?? []).map((u) => `${u.rule}(${Object.entries(u.bind ?? {}).map(([v, c]) => `${v}=${c}`).join(', ')})`).join('; ') || '—'} | ${r.status}${r.status === 'asserted' && r.k.asserted ? `: ${r.k.asserted}` : ''} |`);
    }
    out();
    if (lateQuotes.length) {
        out('## Quoted later than they appear');
        out('');
        out('Cards an early clue speaks of, quoted only from a later line: the card shows its quote once that line is read.');
        out('An earlier quote, where the story has one, would let the card carry its words from the start.');
        out('');
        out('| Card | Appears at ¶ | First quoted at ¶ |');
        out('|---|---|---|');
        for (const q of lateQuotes) out(`| \`${q.id}\` | ${q.appears} | ${q.firstAt} |`);
        out('');
    }
    out('## Derived claims');
    out();
    for (const r of derivedRows) out(`- \`${r.claim.id}\` ${r.ok ? '✓' : '✗'} — ${r.claim.text} *(via ${r.used.join(', ')})*`);
    out();
    out("## Holmes's steps (from the thoughts)");
    out();
    out('| Step | Premises | Conclusion | Checked |');
    out('|---|---|---|---|');
    for (const r of routeRows) {
        const c = r.step.concludes;
        const what = c ? (c.claim ?? (c.slot ? `${c.slot} ≠ ${c.value}` : render(c.formula))) : '—';
        out(`| \`${r.step.id}\` | ${r.step.premises.join(', ')} | ${what} | ${r.ok === null ? 'not checkable' : r.ok ? '✓' : '✗'} |`);
    }
    out();
    if (stateRows.length) {
        out('## States');
        out();
        out('Declared states (the world model), by track: each answer is quoted through a claim or derived by an inference.');
        out();
        out('| State | Window | Answer | Given by | Status |');
        out('|---|---|---|---|---|');
        for (const r of stateRows) {
            const status = slotRows.find((x) => x.slot.id === r.slot.id)?.status ?? '';
            out(`| \`${r.slot.track}\` | ${r.slot.window} | ${r.slot.answer ?? '—'} | ${r.by.join(', ') || '—'} | ${status} |`);
        }
        out();
    }
    {
        // The orders within a window: those a claim states (seq), and the order questions of the case's splits that
        // these or the states settle.
        const rows = slotRows.filter((r) => r.slot.facet === 'order' && (seqRows.some((x) => x.slot === r.slot.id) || r.status.startsWith('settled')));
        if (rows.length) {
            out('## Orders within a window');
            out();
            out('Stated by a claim (`seq`), or a split\'s order question the case settles.');
            out();
            out('| Order | Answer | Stated by | Status |');
            out('|---|---|---|---|');
            for (const r of rows) out(`| \`${r.slot.id}\` | ${r.slot.answer} | ${seqRows.filter((x) => x.slot === r.slot.id).map((x) => x.by).join(', ') || '—'} | ${r.status} |`);
            out();
        }
    }
    {
        // Absences the player files (Round 83): never dealt by mention.
        const rows = (data.claims ?? []).flatMap((c) => (c.attested ?? []).filter((a) => a.files).map((a) => ({ c, a })));
        if (rows.length) {
            out('## Absences the player files');
            out();
            out('Never dealt by mention: filed from the expectation, a time and the witness, or dealt at a later attestation of the claim\'s own.');
            out();
            out('| Claim | Line | Expectation | Times | Witness | Otherwise dealt at |');
            out('|---|---|---|---|---|---|');
            for (const { c, a } of rows) {
                const later = storyIndex.firstAt.get(c.id);
                out(`| \`${c.id}\` | ¶${storyIndex.absenceAt.get(c.id)} | ${a.files.expectation} | ${a.files.windows.join(', ')} | ${a.files.witness} | ${later === undefined ? 'never (filed only)' : `¶${later}`} |`);
            }
            out();
        }
    }
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
        out("Holmes's steps no action yields: " + (unyielded.steps.map((c) => `\`${c}\``).join(', ') || '—'));
        out();
    }
    out('## Inconsistencies in the text');
    out();
    for (const x of data.inconsistencies ?? []) out(`- **${x.id}** — ${x.summary}`);
    out();
    fs.writeFileSync(path.join(dir, 'report.md'), lines.join('\n'));
    if (!quiet) console.log(`wrote ${path.join(dir, 'report.md')}`);
}
