// The game's statistics: cases/silver-blaze/stats.md is what `npm run stats` writes
// from the case, its two action tables and the hints' data as they are now.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadCase } from './loadCase.js';
import { statsMarkdown } from './stats.js';

const dir = new URL('../cases/silver-blaze/', import.meta.url);
const model = await loadCase(dir.pathname);
const read = (f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8'));

test('stats.md is up to date (npm run stats)', () => {
    const want = statsMarkdown(model, { reader: read('action-table.json'), minimal: read('action-table-minimal.json'), hints: read('hints.json') });
    assert.equal(fs.readFileSync(new URL('stats.md', dir), 'utf8'), want);
});
