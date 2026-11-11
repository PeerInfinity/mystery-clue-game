import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

// Every case: cases/<case>/ and the mechanic miniatures, cases/miniatures/<case>/ (docs/authored-stories.md).
const cases = [];
for (const base of ['cases', 'cases/miniatures']) {
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
            for (const set of q.needs) for (const id of set) assert.ok(clues.has(id), `${q.id}: no clue ${id}`);
            const needed = new Set(q.needs.flat().flatMap((id) => [...clues.get(id).facts, ...(clues.get(id).chain ?? [])]));
            for (const o of observations.filter((x) => x.q === q.id && x.essential)) for (const f of o.from.map((x) => x.doubted ?? x).filter((x) => typeof x === 'string')) assert.ok(needed.has(f), `${o.id}: ${f} is in no clue ${q.id} needs`);
        }
    });
}
