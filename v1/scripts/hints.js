// The hints' data: cases/<case>/hints.json, from the case and its two action tables
// (engine/hintData.js). npm run hints [case dir], about a minute. Rerun when the case or the tables change (a test checks it).
import fs from 'node:fs';
import path from 'node:path';
import { loadCase } from '../engine/loadCase.js';
import { hintData, hintJson } from '../engine/hintData.js';

const dir = process.argv[2] ?? path.join(path.dirname(new URL(import.meta.url).pathname), '../cases/silver-blaze');
const model = await loadCase(dir);
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const data = hintData(model, read('action-table.json'), read('action-table-minimal.json'));
fs.writeFileSync(path.join(dir, 'hints.json'), hintJson(data));
console.log(`wrote ${path.join(dir, 'hints.json')}: ${data.rows.length} rows, ${data.moves.length} moves`);
