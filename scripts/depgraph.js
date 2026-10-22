// The player's actions as an Archipelago-CC DepGraph (docs/depgraph.md): cases/<case>/depgraph-max.json, the maximum
// score's playthrough (the minimal one) between the stretches of the story (engine/depgraph.js). npm run depgraph [case
// dir], about a minute. Rerun when the case, the tables or hints.json change (a test checks it).
import fs from 'node:fs';
import path from 'node:path';
import { loadCase } from '../engine/loadCase.js';
import { MAX, maxData, depgraph, depgraphJson, checkGraph } from '../engine/depgraph.js';

const dir = process.argv[2] ?? path.join(path.dirname(new URL(import.meta.url).pathname), '../cases/silver-blaze');
const model = await loadCase(dir);
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const data = maxData(model, read('action-table.json'), read('action-table-minimal.json'), read('hints.json'));
const g = depgraph(model, data, MAX);
const { sinks } = checkGraph(g);
fs.writeFileSync(path.join(dir, 'depgraph-max.json'), depgraphJson(g));
const n = Object.keys(g.nodes).length;
console.log(`wrote ${path.join(dir, 'depgraph-max.json')}: ${n} nodes (${Object.keys(g.nodes).filter((k) => k.startsWith('story.')).length} stretches), ${Object.values(g.nodes).reduce((k, x) => k + x.depends_on.length, 0)} edges; the sink ${sinks.join(' ')}`);
