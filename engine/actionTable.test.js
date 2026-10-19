// The action table (docs/review-closing.md, Round 168): the annotation's player on Hard reaches the Hard maximum, and
// cases/silver-blaze/action-table.json is what `npm run action-table` writes from the case as it is now.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadCase } from './loadCase.js';
import { actionTable } from './actionTable.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);
const { table, never } = actionTable(model);

test('the annotation\'s player on Hard reaches the maximum: every family full but the two deductions no player can make', () => {
    for (const [f, a] of Object.entries(table.families)) {
        if (f === 'deduction') assert.deepEqual([a.scored, a.possible], [45, 47]);
        else assert.equal(a.scored, a.possible, f);
    }
    const missed = table.thoughts.flatMap((t) => t.scores.filter((s) => s.family === 'deduction' && !s.scored).map(() => t.id));
    assert.deepEqual(missed.sort(), ['t127.4', 't36.2'], 'the square toes (told at Holmes\'s ¶146) and Hunter\'s blindness (its fact at ¶218)');
    assert.deepEqual(never.sort(), ['t212.1', 't214.1'], 'only the records of Holmes naming the horse, which is proved, not dealt');
});

test('action-table.json is up to date (npm run action-table)', () => {
    const file = JSON.parse(fs.readFileSync(new URL('../cases/silver-blaze/action-table.json', import.meta.url), 'utf8'));
    assert.deepEqual(file.families, table.families);
    assert.equal(file.thoughts.length, table.thoughts.length);
    for (let i = 0; i < table.thoughts.length; i++) assert.deepEqual(file.thoughts[i], JSON.parse(JSON.stringify(table.thoughts[i])), table.thoughts[i].id);
});
