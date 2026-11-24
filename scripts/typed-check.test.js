// The measure of what follows from the typed data alone (scripts/typed-check.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { ROOT } from './case-env.mjs';
import { typedCheck } from './typed-check.mjs';

test('The Prize Marrow: both wrong answers ruled out by the typed wants, the answer following once the list is closed', () => {
    const [r] = typedCheck(path.join(ROOT, 'cases/miniatures/prize-marrow'));
    assert.deepEqual(r.ruled.sort(), ['martha', 'pask']);
    assert.deepEqual(r.left, []);
    assert.equal(r.concluded, null);
    assert.equal(r.closed, 'elimination');
    assert.deepEqual(r.writtenConclude, ['i.who_abel']);
});

test('The Will in the Bible: the date question follows with no written rule', () => {
    const rows = typedCheck(path.join(ROOT, 'cases/miniatures/will-in-the-bible'));
    assert.ok(rows.some((r) => r.concluded && !r.writtenConclude.length));
});
