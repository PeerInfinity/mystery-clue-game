import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { exportRules, exportCase, format, paperSets, logicPaperSets, worldLogic } from './export-rules.mjs';
import { fill, rng, play } from '../engine/delivery.js';

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
        test(`case ${dir}: rules.json is the export of the case`, () => {
            assert.equal(fs.readFileSync(new URL(`../${dir}/rules.json`, import.meta.url), 'utf8'), format(exportCase(dir)), 'run node scripts/export-rules.mjs ' + dir);
        });
        test(`case ${dir}: every location's rule names the papers its question needs, and no paper held from the start`, () => {
            // The case's own logic where its implications are written (any one of the ways to an answer), else the structure's.
            const logic = worldLogic(dir);
            const doc = exportRules(s, null, logic), sets = logic ? logicPaperSets(logic) : paperSets(s), start = new Set(s.delivery.start), title = new Map(s.papers.map((p) => [p.id, p.title]));
            const named = (r) => (r.rule === 'True_' ? [] : r.rule === 'Has' ? [r.args.item_name] : r.args.item_names).slice().sort();
            const alternatives = (r) => (r.rule === 'Or' ? r.children.map(named) : [named(r)]).map((x) => x.join('|')).sort();
            for (const l of [...doc.regions['1']['The case'].locations]) {
                const q = doc.world['1'].slot_data.mystery.locations[l.name];
                const lists = sets.get(q).map((set) => [...set].filter((p) => !start.has(p)).map((p) => title.get(p)).sort());
                // Without the papers held from the start, a way that contains another is left out; one that asks for
                // nothing makes the whole rule true.
                const want = lists.filter((a, i) => !lists.some((b, j) => j !== i && b.length <= a.length && b.every((n) => a.includes(n)) && (b.length < a.length || j < i))).map((x) => x.join('|')).sort();
                assert.deepEqual(alternatives(l.access_rule), want.includes('') ? [''] : want, q);
            }
            if (logic) {
                assert.equal(doc.world['1'].slot_data.mystery.answers, 'evidence');
                // The logic of the ways fills and plays to the end, seed after seed.
                for (let seed = 1; seed <= 200; seed++) { const { place } = fill(logic, rng(seed)); assert.ok(place && play(logic, place).done, `seed ${seed}`); }
            }
            const pool = doc.itempool_counts['1'];
            assert.equal(Object.entries(pool).filter(([n]) => n !== 'Victory').reduce((a, [, n]) => a + n, 0), doc.regions['1']['The case'].locations.filter((l) => l.id !== null).length, 'one pool item to a location');
            assert.deepEqual(doc.starting_items['1'].sort(), [...start].map((p) => title.get(p)).sort());
        });
    }
}
