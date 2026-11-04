#!/usr/bin/env node
// Provenance in the world model (world/), derived: how each fact reached Watson, through the accounts that hold it
// (world/accounts.json) and the `tells` facts that pass an account, or a bundle containing it, from one holder to
// the next. A link whose telling has `truth: null` (told by the story as possible, never settled), is `partial`
// (it carried some of the account, the story does not say which) or whose sender is "?" is uncertain; its question (kind provenance) says what else it could have been.
//
//   node scripts/world-provenance.js cases/silver-blaze            every fact's chains
//   node scripts/world-provenance.js cases/silver-blaze --accounts each account's chains and who holds it when

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

/** Load the pilot and derive: accounts by id, the accounts holding each fact, and the chains of each account. */
export function provenance(dir) {
    const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, 'world', f), 'utf8'));
    const accounts = read('accounts.json').accounts;
    const facts = read('facts.json').facts;
    const byId = new Map(accounts.map((a) => [a.id, a]));
    const tellings = facts.filter((f) => f.attr === 'tells');

    // The bundles an account is a part of, directly or through other bundles.
    const parentsOf = new Map(accounts.map((a) => [a.id, []]));
    for (const a of accounts) for (const p of list(a.parts)) parentsOf.get(p)?.push(a.id);
    const ancestors = (id, seen = new Set()) => {
        for (const p of parentsOf.get(id) ?? []) if (!seen.has(p)) { seen.add(p); ancestors(p, seen); }
        return seen;
    };

    // A member holds what its groups hold (a fact on a group holds for its members): Gregory, of the police.
    const groupsOf = new Map();
    for (const f of facts) if (f.attr === 'member_of') for (const g of list(f.value)) groupsOf.set(f.of, [...(groupsOf.get(f.of) ?? []), g]);
    const selves = (h) => [h, ...new Set(groupsOf.get(h) ?? [])];

    // Chains carrying account `id` to `holder`: each a list of links from the origin onwards.
    const memo = new Map();
    const chains = (id, holder, visiting = new Set()) => {
        const key = `${id}>${holder}`;
        if (memo.has(key)) return memo.get(key);
        const a = byId.get(id);
        if (a.origin === holder) return [[]];
        if (selves(holder).includes(a.origin)) return [[{ from: a.origin, to: holder, how: 'member', uncertain: false }]];
        if (visiting.has(holder)) return [];
        visiting.add(holder);
        const carriers = new Set([id, ...ancestors(id)]);
        const out = [];
        for (const t of tellings) {
            if (!selves(holder).includes(t.to) || !list(t.value).some((v) => carriers.has(v))) continue;
            if (t.to !== holder) out.push(...chains(id, t.to, visiting).map((c) => [...c, { from: t.to, to: holder, how: 'member', uncertain: false }]));
            if (t.to !== holder) continue;
            const link = { from: t.of, to: holder, how: t.how, telling: t.id, uncertain: t.of === '?' || t.truth === null || !!t.partial, q: t.q };
            if (t.of === '?') out.push([{ from: a.origin ?? '?', to: '?', how: 'unknown', gap: true, uncertain: true, q: t.q }, link]);
            else for (const c of chains(id, t.of, visiting)) out.push([...c, link]);
        }
        // An account with no named origin starts, unknown, with the first holder no telling reaches.
        if (!out.length && a.origin == null) out.push([{ from: '?', to: holder, how: 'unknown', gap: true, uncertain: true }]);
        visiting.delete(holder);
        if (!visiting.size) memo.set(key, out);
        return out;
    };

    const holdersOf = new Map(facts.map((f) => [f.id, []]));
    for (const a of accounts) for (const f of list(a.facts)) holdersOf.get(f)?.push(a.id);
    const factChains = (fid) => holdersOf.get(fid).flatMap((aid) => chains(aid, 'watson').map((links) => ({ account: aid, origin: byId.get(aid).origin, links })));
    return { accounts, byId, facts, tellings, ancestors, chains, holdersOf, factChains };
}

export const showChain = (c) => [c.origin ?? '?', ...c.links.map((l) => `${l.uncertain ? '?' : ''}${l.how}→ ${l.to}`)].join(' ');

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const dir = process.argv[2];
    if (!dir) { console.error('usage: world-provenance.js <case dir> [--accounts]'); process.exit(2); }
    const p = provenance(dir);
    if (process.argv.includes('--accounts')) {
        for (const a of p.accounts) {
            console.log(`\n${a.id}: ${a.label} (origin ${a.origin ?? '?'}, ${a.how})`);
            for (const links of p.chains(a.id, 'watson')) console.log(`  ${showChain({ origin: a.origin, links })}`);
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
