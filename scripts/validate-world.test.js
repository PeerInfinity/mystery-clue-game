import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

for (const dir of fs.readdirSync(new URL('../cases/', import.meta.url))) {
    if (!fs.existsSync(new URL(`../cases/${dir}/world/facts.json`, import.meta.url))) continue;
    test(`case ${dir}: the world model validates`, () => {
        const out = execFileSync('node', ['scripts/validate-world.js', `cases/${dir}`, '--quiet'], { encoding: 'utf8' });
        assert.match(out, /^0 error\(s\)$/m);
    });
}
