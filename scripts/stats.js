// The game's statistics: cases/<case>/stats.md, from the case and its two action
// tables and the hints' data (engine/stats.js). npm run stats [case dir]. Rerun when the case or the tables change (a test checks it).
import fs from 'node:fs';
import path from 'node:path';
import { loadCase } from '../engine/loadCase.js';
import { statsMarkdown } from '../engine/stats.js';

const dir = process.argv[2] ?? path.join(path.dirname(new URL(import.meta.url).pathname), '../cases/silver-blaze');
const model = await loadCase(dir);
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
fs.writeFileSync(path.join(dir, 'stats.md'), statsMarkdown(model, { reader: read('action-table.json'), minimal: read('action-table-minimal.json'), hints: read('hints.json') }));
console.log(`wrote ${path.join(dir, 'stats.md')}`);
