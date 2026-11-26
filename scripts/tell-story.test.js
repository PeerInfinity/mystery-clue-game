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
    // Told by the templates (not a model's prose): nothing in the story or its scenes but what an entry, a deed, a
    // question, a witness's "told me", a time or the day's own sentences account for.
    if (fs.existsSync(path.join(base, name, 'world', 'prose.json'))) continue;
    test(`${name}: every sentence of the story and its scenes is an entry's, a deed's or a question's`, () => {
        const world = (f) => JSON.parse(fs.readFileSync(path.join(base, name, 'world', f), 'utf8'));
        const header = world('case.json');
        const quotes = [...world('facts.json').facts.map((f) => f.quote), ...world('questions.json').questions.map((q) => q.quote)].filter(Boolean);
        const labels = world('times.json').times.map((t) => t.label);
        let text = [header.story, ...(header.files ?? []).map((f) => f.text)].map((f) => fs.readFileSync(path.join(base, name, 'world', f), 'utf8').split('\n').slice(1).join('\n')).join('\n');
        for (const q of [...quotes, ...labels].sort((a, b) => b.length - a.length)) text = text.split(q).join('');
        text = text.replace(/I have \w+ \w+ today, and more to do than they will hold\. When they are spent I wake again on this same morning, with the day before me as it was\. What I have learned I keep\./g, '');
        // Where the voice changes (several narrators), and where a witness saw a thing from.
        for (const n of header.narrators) text = text.split(`${n.name}'s ${n.account ?? 'account'}.`).join('');
        text = text.replace(/I saw this from [^.]+\./g, '');
        // What is left: the words that open a time, the one deed's sentence for each question, and punctuation.
        const left = text.replace(/\b(On|At|From|Between|until|and)\b/g, '').replace(/[.,:"\s]/g, '');
        assert.ok(left.length < 120 * world('questions.json').questions.length, `text no entry accounts for: ${left}`);
    });
}
