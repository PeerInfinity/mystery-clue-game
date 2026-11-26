// A case with visits (docs/case-format.md, "Visits in the present") as a substrate needs it: the day, each visit with
// what it takes and waits for, the papers, and what the goal's answer needs, with a version. For Archipelago-CC's
// Action Nodes, where the day is played in a multiworld (docs/authored-stories.md, finding 140).
//   node scripts/export-visits.mjs <dir>      writes <dir>/visits.json;  --check: writes nothing, exits 1 if it would change
// `{story, case, version, unit, day, visits: [{id, label, cost, after, needs, paper: {id, title}}], questions: [{id,
// ways: [{papers, requires}]}], goal: {question, papers: [[paper, ...], ...], ways}}`: `after` alternative sets of visits made earlier the same day; `needs.read` papers
// held (each is some visit's scene) and `needs.solved` questions solved, from any day; `goal.papers` alternative sets
// of papers, one of which the goal's answer needs, by the case's own logic (engine/delivery.js `caseLogic`: the
// papers its essential observations' entries are told in). `questions` has every question the logic covers, each with
// its `ways`: alternative ways to its answer, the papers a way needs held and the questions it `requires` solved
// first; `goal.ways` the goal's, and `goal.papers` is kept for a reader of the earlier shape. The version is a hash of all the rest: the page reads it
// here when it is framed by a multiworld's client, and refuses a slot made from another.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { caseLogic } from '../engine/delivery.js';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
/** A question's ways to its answer, each the papers held and the questions solved first: the logic's own where two ways rest on different questions, else each set of papers with what the question requires. */
const waysOf = (q) => (q.ways ?? q.sets.map((set) => ({ papers: [...set], requires: q.requires ?? [] }))).map((w) => ({ papers: [...w.papers].sort(), requires: [...w.requires].sort() }));
export function exportVisits(dir) {
    const W = path.join(dir, 'world'), R = (f) => JSON.parse(fs.readFileSync(path.join(W, f), 'utf8'));
    const header = R('case.json'), questions = R('questions.json').questions;
    const files = (header.files ?? []).filter((f) => f.visit);
    if (!files.length) throw new Error(`${dir}: no file with a visit`);
    const logic = caseLogic({ questions, observations: R('observations.json').observations, facts: R('facts.json').facts, files: header.files, delivery: header.delivery });
    const goal = questions.find((q) => q.answer != null && Number.isInteger(q.answer_given_at)) ?? questions[0];
    const body = {
        story: JSON.parse(fs.readFileSync(path.join(dir, 'structure.json'), 'utf8')).story,
        case: path.relative(ROOT, path.resolve(dir)).split(path.sep).join('/'),
        unit: header.delivery?.unit ?? 'hour', day: header.delivery.day,
        visits: files.map((f) => ({ id: f.id, label: f.visit.label, cost: f.visit.cost ?? 1, after: f.visit.after ?? [], needs: { read: f.visit.needs?.read ?? [], solved: f.visit.needs?.solved ?? [] }, paper: { id: f.id, title: f.title } })),
        questions: logic.questions.map((q) => ({ id: q.id, ways: waysOf(q) })),
        goal: { question: goal.id, papers: logic.questions.find((q) => q.id === goal.id).sets.map((s) => [...s].sort()), ways: waysOf(logic.questions.find((q) => q.id === goal.id)) },
    };
    const version = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 12);
    const { story, case: c, ...rest } = body;
    return { story, case: c, version, ...rest };
}
/** The file as it is kept: a visit a line. */
export const format = (d) => `{\n  "story": ${JSON.stringify(d.story)}, "case": ${JSON.stringify(d.case)}, "version": ${JSON.stringify(d.version)},\n  "unit": ${JSON.stringify(d.unit)}, "day": ${d.day},\n  "visits": [\n${d.visits.map((v) => `    ${JSON.stringify(v)}`).join(',\n')}\n  ],\n  "questions": [\n${d.questions.map((q) => `    ${JSON.stringify(q)}`).join(',\n')}\n  ],\n  "goal": ${JSON.stringify(d.goal)}\n}\n`;

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
    const check = process.argv.includes('--check'), dir = process.argv.slice(2).find((a) => !a.startsWith('--'));
    const file = path.join(dir, 'visits.json'), text = format(exportVisits(dir));
    const same = fs.existsSync(file) && fs.readFileSync(file, 'utf8') === text;
    if (same) console.log('nothing to change'); else if (check) console.log(`would change: ${file}`); else { fs.writeFileSync(file, text); console.log(`written: ${file}`); }
    process.exit(check && !same ? 1 : 0);
}
