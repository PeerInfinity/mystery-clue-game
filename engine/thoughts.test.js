import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadCase } from './loadCase.js';
import { checkThoughts } from './thoughts.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);
const data = JSON.parse(fs.readFileSync(new URL('../cases/silver-blaze/thoughts.json', import.meta.url), 'utf8'));
const markdown = fs.readFileSync(new URL('../docs/reading-annotated.md', import.meta.url), 'utf8');

test('the annotated reading is well-formed, mirrors the annotation and maps to real cards', () => {
    const r = checkThoughts(data, model, { markdown });
    assert.deepEqual(r.errors, []);
});

test('the checker catches a premise from the future, a quote ahead of its thought, and an unknown card', () => {
    const bad = structuredClone(data);
    const t = bad.thoughts.find((x) => x.id === 't4.2');
    t.from = [...t.from, 't37.6'];
    bad.thoughts.find((x) => x.id === 't20.1').reads.push('the immense significance of the curried mutton');
    bad.thoughts.find((x) => x.id === 't35.4').maps = ['c.no_such_claim'];
    const r = checkThoughts(bad, model);
    assert.ok(r.errors.some((e) => e.startsWith('t4.2: cites t37.6, which comes later')));
    assert.ok(r.errors.some((e) => e.startsWith('t20.1: reads ¶216')));
    assert.ok(r.errors.some((e) => e === 't35.4: maps to unknown c.no_such_claim'));
});
