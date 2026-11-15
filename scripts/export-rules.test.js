import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { exportRules, format, paperSets } from './export-rules.mjs';

// Every story whose structure has papers (items earned by solving questions): its logic passes the structure check,
// and the Archipelago rules beside it are what the export gives now.
for (const base of ['cases', 'cases/miniatures']) {
    for (const name of fs.readdirSync(new URL(`../${base}/`, import.meta.url))) {
        const dir = `${base}/${name}`;
        const file = new URL(`../${dir}/structure.json`, import.meta.url);
        if (!fs.existsSync(file)) continue;
        const s = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (!s.papers) continue;
        test(`case ${dir}: the structure check passes`, () => {
            const out = execFileSync('node', ['scripts/structure-check.mjs', dir, '200'], { encoding: 'utf8' });
            assert.match(out, /played to the end: 200 of 200 seeds/);
        });
        test(`case ${dir}: rules.json is the export of structure.json`, () => {
            assert.equal(fs.readFileSync(new URL(`../${dir}/rules.json`, import.meta.url), 'utf8'), format(exportRules(s)), 'run node scripts/export-rules.mjs ' + dir);
        });
        test(`case ${dir}: every location's rule names the papers its question needs, and no paper held from the start`, () => {
            const doc = exportRules(s), sets = paperSets(s), start = new Set(s.delivery.start), title = new Map(s.papers.map((p) => [p.id, p.title]));
            const named = (r) => r.rule === 'True_' ? [] : r.rule === 'Has' ? [r.args.item_name] : r.args.item_names;
            for (const l of doc.regions['1']['The case'].locations) {
                const q = doc.mystery['1'].locations[l.name];
                assert.equal(sets.get(q).length, 1, `${q}: one set expected in this story`);
                assert.deepEqual(named(l.access_rule).sort(), [...sets.get(q)[0]].filter((p) => !start.has(p)).map((p) => title.get(p)).sort(), q);
            }
            assert.deepEqual(doc.starting_items['1'].sort(), [...start].map((p) => title.get(p)).sort());
        });
    }
}
