// A case with visits as a substrate needs it (scripts/export-visits.mjs): every such case's visits.json is the export of the case now.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './case-env.mjs';
import { exportVisits, format } from './export-visits.mjs';

const base = path.join(ROOT, 'cases', 'miniatures');
for (const name of fs.readdirSync(base)) {
    const header = JSON.parse(fs.readFileSync(path.join(base, name, 'world', 'case.json'), 'utf8'));
    if (!(header.files ?? []).some((f) => f.visit)) continue;
    test(`${name}: visits.json is the export of the case`, () => {
        assert.equal(fs.readFileSync(path.join(base, name, 'visits.json'), 'utf8'), format(exportVisits(path.join(base, name))), `run node scripts/export-visits.mjs cases/miniatures/${name}`);
    });
    test(`${name}: the goal's papers are visits' papers, and what a visit waits for exists`, () => {
        const d = exportVisits(path.join(base, name)), ids = new Set(d.visits.map((v) => v.id));
        assert.ok(d.goal.papers.length > 0 && d.goal.papers.flat().every((p) => ids.has(p)));
        for (const v of d.visits) assert.ok([...v.after.flat(), ...v.needs.read].every((x) => ids.has(x)), v.id);
        assert.ok(d.visits.every((v) => v.cost <= d.day));
    });
}
