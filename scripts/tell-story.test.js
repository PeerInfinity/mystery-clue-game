// A story told from its typed data (scripts/tell-story.mjs): every case that has a telling is what the script writes now.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './case-env.mjs';
import { tell } from './tell-story.mjs';

const base = path.join(ROOT, 'cases', 'miniatures');
for (const name of fs.readdirSync(base)) {
    if (!fs.existsSync(path.join(base, name, 'world', 'telling.json'))) continue;
    test(`${name}: its text and what follows from it are the telling of its data`, () => {
        for (const [file, text] of Object.entries(tell(path.join(base, name)))) assert.equal(fs.readFileSync(file, 'utf8'), text, `run node scripts/tell-story.mjs cases/miniatures/${name}`);
    });
    test(`${name}: every sentence of the story is an entry's, a deed's or a question's`, () => {
        const world = (f) => JSON.parse(fs.readFileSync(path.join(base, name, 'world', f), 'utf8'));
        const quotes = [...world('facts.json').facts.map((f) => f.quote), ...world('questions.json').questions.map((q) => q.quote)];
        let text = fs.readFileSync(path.join(base, name, 'story.txt'), 'utf8').split('\n').slice(1).join('\n');
        for (const q of quotes.sort((a, b) => b.length - a.length)) text = text.split(q).join('');
        // What is left: the times' openings, the one deed's sentence for each question, and punctuation.
        const left = text.replace(/On [A-Z][^,]*(, after dark)?, /g, '').replace(/[.\s]/g, '');
        assert.ok(left.length < 120, `text no entry accounts for: ${left}`);
    });
}
