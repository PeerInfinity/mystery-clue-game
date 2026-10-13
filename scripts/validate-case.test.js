import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

for (const dir of fs.readdirSync(new URL('../cases/', import.meta.url))) {
    test(`case ${dir} validates`, () => {
        const out = execFileSync('node', ['scripts/validate-case.js', `cases/${dir}`, '--quiet'], { encoding: 'utf8' });
        assert.match(out, /^0 error\(s\), 0 warning\(s\)$/m);
    });
}
