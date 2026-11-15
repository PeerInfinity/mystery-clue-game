// The seeds a case with papers earned by solving questions is checked on (docs/authored-stories.md, decision 6):
// over many seeds, the placement (engine/delivery.js) and the order of solving the path check draws from each seed,
// and of these the narrowest (fewest questions open to choose from, summed over the steps), the widest, and an
// ordinary one (the median). --write puts them into the case's world/path.json as `seeds`, which
// scripts/page-checks.mjs runs.
//   node scripts/delivery-seeds.mjs <case dir> [seeds, default 500] [--write]
import fs from 'node:fs';
import path from 'node:path';
import { caseLogic, deliveryMode, placement, choices, rng } from '../engine/delivery.js';

const dir = process.argv[2];
if (!dir) { console.error('usage: node scripts/delivery-seeds.mjs <case dir> [seeds] [--write]'); process.exit(2); }
const n = Number(process.argv.find((a, i) => i > 2 && /^\d+$/.test(a)) ?? 500);
const R = (f) => JSON.parse(fs.readFileSync(path.join(dir, 'world', f), 'utf8'));
const header = R('case.json');
if (deliveryMode(header) !== 'earned') { console.error(`${dir}: its papers are not earned by solving questions`); process.exit(1); }
const logic = caseLogic({ questions: R('questions.json').questions, observations: R('observations.json').observations, facts: R('facts.json').facts, files: header.files, delivery: header.delivery });
const runs = [];
for (let seed = 1; seed <= n; seed++) {
    const place = placement(logic, seed);
    if (!place) continue;
    // The same order as scripts/path-check.mjs draws.
    const c = choices(logic, place, rng(seed ^ 0x5bd1e995));
    runs.push({ seed, width: c.counts.reduce((a, b) => a + b, 0), counts: c.counts, order: c.order });
}
const sorted = [...runs].sort((a, b) => a.width - b.width || a.seed - b.seed);
const pick = { narrow: sorted[0], wide: sorted.find((r) => r.width === sorted.at(-1).width), ordinary: sorted[Math.floor(sorted.length / 2)] };
for (const [k, r] of Object.entries(pick)) console.log(`${k.padEnd(9)} seed ${String(r.seed).padStart(4)}: open to choose from ${r.counts.join(' ')}; ${r.order.join(', ')}`);
const seeds = [...new Set(Object.values(pick).map((r) => r.seed))];
if (process.argv.includes('--write')) {
    const file = path.join(dir, 'world', 'path.json');
    const lines = fs.readFileSync(file, 'utf8').split('\n').filter((l) => !/^\s*"seeds":/.test(l));
    const at = lines.findIndex((l) => /^\s*"description":/.test(l));
    lines.splice(at + 1, 0, `  "seeds": ${JSON.stringify(seeds)},`);
    fs.writeFileSync(file, lines.join('\n'));
    console.log(`${file}: seeds ${seeds.join(', ')}`);
}
