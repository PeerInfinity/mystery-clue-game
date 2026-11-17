import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { caseLogic, structureLogic, deliveryMode } from '../engine/delivery.js';

// Every case: cases/<case>/, the mechanic miniatures, cases/miniatures/<case>/ (docs/authored-stories.md), and the
// invented fixtures of the checks, scripts/fixtures/<case>/.
const cases = [];
for (const base of ['cases', 'cases/miniatures', 'scripts/fixtures']) {
    const at = new URL(`../${base}/`, import.meta.url);
    if (!fs.existsSync(at)) continue;
    for (const dir of fs.readdirSync(at)) if (fs.existsSync(new URL(`${dir}/world/facts.json`, at))) cases.push(`${base}/${dir}`);
}
for (const dir of cases) {
    test(`case ${dir}: the world model validates`, () => {
        const out = execFileSync('node', ['scripts/validate-world.js', dir, '--quiet'], { encoding: 'utf8' });
        assert.match(out, /^0 error\(s\)$/m);
    });
    // A miniature's logic, written before its prose (structure.json): every clue a question needs exists, every fact
    // a clue names is in the world model, and every essential observation rests on facts of the clues its question needs.
    const file = new URL(`../${dir}/structure.json`, import.meta.url);
    if (!fs.existsSync(file)) continue;
    test(`case ${dir}: the structure agrees with the world model`, () => {
        const read = (f) => JSON.parse(fs.readFileSync(new URL(`../${dir}/${f}`, import.meta.url), 'utf8'));
        const s = read('structure.json');
        const facts = new Set(read('world/facts.json').facts.map((f) => f.id));
        const questions = new Set(read('world/questions.json').questions.map((q) => q.id));
        const clues = new Map(s.clues.map((c) => [c.id, c]));
        for (const x of [...s.clues, ...(s.frame ?? [])]) for (const id of [...x.facts, ...(x.chain ?? [])]) assert.ok(facts.has(id), `${x.id}: no fact ${id}`);
        const observations = read('world/observations.json').observations;
        for (const q of s.questions) {
            assert.ok(questions.has(q.id), `no question ${q.id}`);
            const frame = new Map((s.frame ?? []).map((f) => [f.id, f]));
            for (const set of q.needs) for (const id of set) assert.ok(clues.has(id) || frame.has(id), `${q.id}: no clue ${id}`);
            const needed = new Set(q.needs.flat().flatMap((id) => { const c = clues.get(id) ?? frame.get(id); return [...c.facts, ...(c.chain ?? [])]; }));
            for (const o of observations.filter((x) => x.q === q.id && x.essential)) for (const f of o.from.flatMap((x) => x.any ?? [x.doubted ?? x]).filter((x) => typeof x === 'string')) assert.ok(needed.has(f), `${o.id}: ${f} is in no clue ${q.id} needs`);
        }
    });
    // Papers earned by solving questions: the logic the page derives from the world model (engine/delivery.js) is the
    // logic the story was written from.
    const header = JSON.parse(fs.readFileSync(new URL(`../${dir}/world/case.json`, import.meta.url), 'utf8'));
    if (deliveryMode(header) !== 'earned') continue;
    test(`case ${dir}: the logic derived from the world model is structure.json's`, () => {
        const read = (f) => JSON.parse(fs.readFileSync(new URL(`../${dir}/${f}`, import.meta.url), 'utf8'));
        const mine = caseLogic({ questions: read('world/questions.json').questions, observations: read('world/observations.json').observations, facts: read('world/facts.json').facts, files: header.files, delivery: header.delivery });
        const theirs = structureLogic(read('structure.json'));
        const norm = (l) => ({ start: [...l.start].sort(), earned: [...l.earned].sort(), goal: l.goal, questions: Object.fromEntries(l.questions.map((q) => [q.id, { sets: q.sets.map((x) => [...x].sort()), requires: [...q.requires].sort() }])) });
        assert.deepEqual(norm(mine), norm(theirs));
    });
}
