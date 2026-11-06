// Incremental mode's waits: cases/<case>/incremental.json, from the case and hints.json (engine/incremental.js).
// npm run incremental [case dir], a few seconds. Rerun after npm run hints (a test checks it).
import fs from 'node:fs';
import path from 'node:path';
import { loadCase } from '../engine/loadCase.js';
import { incrementalWaits, incrementalJson } from '../engine/incremental.js';

const dir = process.argv[2] ?? path.join(path.dirname(new URL(import.meta.url).pathname), '../cases/silver-blaze');
const model = await loadCase(dir);
const data = incrementalWaits(model, JSON.parse(fs.readFileSync(path.join(dir, 'hints.json'), 'utf8')));
fs.writeFileSync(path.join(dir, 'incremental.json'), incrementalJson(data));
const rows = data.waits.filter((w) => w.row).length;
console.log(`wrote ${path.join(dir, 'incremental.json')}: ${rows} rows, ${data.waits.length - rows} keeps, at ${new Set(data.waits.map((w) => w.para)).size} paragraphs`);
