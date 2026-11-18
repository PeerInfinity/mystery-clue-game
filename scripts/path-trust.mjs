// The moves of trust a true path needs since what a witness says starts as uncertain and counts for nothing
// (docs/authored-stories.md, finding 111): before the first move that uses an entry which starts uncertain, a move
// that trusts that one statement as likely (`{do: 'trust', on, link: 'stmt:<id>', level: 'likely', gen: 'trust'}`),
// as a careful reader would: nothing speaks against it yet. Written into world/path.json line by line (one move per
// line stays so); the moves it wrote before are taken out first, so it can be run again after a path changes. The
// old level names of a path's own moves are renamed (distrusted: ruled out).
//   node scripts/path-trust.mjs <case dir>...        (no argument: every short case, the long case, the fixtures)
import fs from 'node:fs';
import path from 'node:path';
import { provenance, loadWorld } from './world-provenance.js';
import { levelOf, linkKey, UNCERTAIN } from '../engine/world.js';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const all = () => [...fs.readdirSync(path.join(ROOT, 'cases/miniatures')).map((d) => `cases/miniatures/${d}`), 'cases/custom-house-fire', ...fs.readdirSync(path.join(ROOT, 'scripts/fixtures')).map((d) => `scripts/fixtures/${d}`)];
const WHY = 'Nothing speaks against it so far: I take it as likely, and see what follows.';
const RENAME = { distrusted: 'ruled out', trusted: 'likely', certain: 'confirmed' };

for (const dir of process.argv.length > 2 ? process.argv.slice(2) : all()) {
    const file = path.join(ROOT, dir, 'world/path.json');
    if (!fs.existsSync(file)) continue;
    const prov = provenance(path.join(ROOT, dir)), world = loadWorld(path.join(ROOT, dir));
    const byId = new Map(world.facts.map((f) => [f.id, f]));
    // Papers earned by solving questions: the questions are solved in any order the seed gives, each by its own
    // moves, so an entry used for two questions is trusted in the moves of each (the second time changes nothing).
    const earned = JSON.parse(fs.readFileSync(path.join(ROOT, dir, 'world/case.json'), 'utf8')).delivery?.mode === 'earned';
    const lowered = new Set();   // what the path itself lowers: never raised first
    const raised = new Set();
    const out = [];
    let added = 0;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const parse = (line) => { try { const m = JSON.parse(line.trim().replace(/,$/, '')); return m && typeof m === 'object' && m.do ? m : null; } catch { return null; } };
    for (const m of lines.map(parse)) if (m?.do === 'trust' && m.gen !== 'trust' && m.on) lowered.add(m.on);
    for (const line of lines) {
        const m = parse(line);
        if (!m) { out.push(line); continue; }
        if (m.gen === 'trust') continue;
        if (m.do === 'trust') { out.push(RENAME[m.level] ? line.replace(`"level": "${m.level}"`, `"level": "${RENAME[m.level]}"`) : line); continue; }
        const indent = line.match(/^\s*/)[0];
        const put = (o) => { added++; out.push(`${indent}${JSON.stringify(o).replace(/":/g, '": ').replace(/,"/g, ', "')},`); };
        const head = { at: m.at, ...(m.hint_at != null ? { hint_at: m.hint_at } : {}), do: 'trust' }, tail = { level: 'likely', gen: 'trust', ...(m.for_q ? { for_q: m.for_q } : {}) };
        // "Something is missing here" reads a whole record (the entries of the rule's series): the paper they came
        // in is trusted at once, by the telling that carried it, where it carried nothing false.
        if (m.do === 'm' && byId.get(m.of)) {
            const record = world.facts.filter((f) => f.series === m.of && levelOf(prov.factChains(f.id)) === UNCERTAIN);
            const tellings = [...new Set(record.flatMap((f) => prov.factChains(f.id).flatMap((c) => c.links.filter((l) => l.telling).map((l) => l.telling))))];
            const key = earned ? `${tellings[0]}|${m.for_q?.[0]}` : tellings[0];
            if (record.length && tellings.length === 1 && !raised.has(key)) {
                const carried = world.facts.filter((f) => f.attr !== 'tells' && prov.factChains(f.id).some((c) => c.links.some((l) => l.telling === tellings[0])));
                if (carried.some((f) => f.truth === false)) console.log(`${dir}: the record of ${m.of} came with something false: its entries are not raised`);
                else { raised.add(key); for (const f of carried) raised.add(earned ? `${f.id}|${m.for_q?.[0]}` : f.id); put({ ...head, on: record[0].id, link: tellings[0], ...tail, why: 'The record is kept in the ordinary way, and nothing speaks against it so far: I take the whole of it as likely.' }); }
            }
        }
        for (const k of ['entry', 'on', 'a', 'b', 'of', 'for']) {
            const id = m[k], f = typeof id === 'string' ? byId.get(id) : null;
            const key = earned ? `${id}|${m.for_q?.[0]}` : id;
            if (!f || f.attr === 'tells' || raised.has(key) || lowered.has(id) || f.truth === false) continue;
            const chains = prov.factChains(id);
            if (levelOf(chains) !== UNCERTAIN) continue;
            const own = chains.flatMap((c) => c.links).find((l) => l.stmt);
            if (!own) { console.log(`${dir}: ${id} starts uncertain and has no statement link of its own: not raised`); continue; }
            raised.add(key);
            put({ ...head, on: id, link: linkKey(own), ...tail, why: WHY });
        }
        out.push(line);
    }
    fs.writeFileSync(file, out.join('\n'));
    console.log(`${dir}: ${added} statement(s) trusted as likely`);
}
