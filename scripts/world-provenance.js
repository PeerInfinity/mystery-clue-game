#!/usr/bin/env node
// Provenance in the world model (world/), derived by engine/world.js: how each fact reached the reader: through the
// accounts that hold it (world/accounts.json) and the `tells` facts that pass an account, or a bundle containing
// it, from one holder to the next. A link whose telling has `truth: null` (told by the story as possible, never
// settled), is `partial` (it carried some of the account, the story does not say which) or whose sender is "?" is
// uncertain; its question (kind provenance) says what else it could have been. Every chain ends with a narrator's
// `narrates` link to the reader (world/case.json `narrators`).
//
//   node scripts/world-provenance.js cases/miniatures/rent-box            every fact's chains
//   node scripts/world-provenance.js cases/miniatures/rent-box --accounts each account's chains and who holds it when

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { provenance as derive, showChain } from '../engine/world.js';

export { showChain };
const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

/** Load a case's world model: the files in <case>/world/. */
export function loadWorld(dir) {
    const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const w = read('world/entities.json');
    return {
        entities: w.entities,
        moves: w.moves ?? [],
        joins: w.joins ?? {},
        times: read('world/times.json').times,
        facts: read('world/facts.json').facts,
        accounts: read('world/accounts.json').accounts,
        questions: read('world/questions.json').questions,
        narrators: read('world/case.json').narrators,
    };
}

export const provenance = (dir) => derive(loadWorld(dir));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const dir = process.argv[2];
    if (!dir) { console.error('usage: world-provenance.js <case dir> [--accounts]'); process.exit(2); }
    const p = provenance(dir);
    if (process.argv.includes('--accounts')) {
        for (const a of p.accounts) {
            console.log(`\n${a.id}: ${a.label} (origin ${a.origin ?? '?'}, ${a.how})`);
            for (const n of p.narrators) for (const links of p.chains(a.id, n.id)) console.log(`  ${showChain({ origin: a.origin, links })} narrates→ reader`);
            const held = p.tellings.filter((t) => [a.id, ...p.ancestors(a.id)].some((x) => list(t.value).includes(x)));
            for (const t of held) console.log(`  held by ${t.to} from ${t.time.at ?? t.time.after ?? t.time.from}${t.truth === null || t.of === '?' || t.partial ? ' (uncertain)' : ''}`);
        }
    } else {
        for (const f of p.facts) {
            if (f.attr === 'tells') continue;
            const cs = p.factChains(f.id);
            console.log(`${f.id}${cs.length ? '' : ' — no chain (the reader infers it)'}`);
            for (const c of cs) console.log(`  [${c.account}] ${showChain(c)}`);
        }
    }
}
