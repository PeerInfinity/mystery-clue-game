import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRef, refKey, Reading, MAIN } from './refs.js';

test('a reference: a bare number is the main story, "story:n" a sub-story', () => {
    assert.deepEqual(parseRef(3), { story: MAIN, n: 3 });
    assert.deepEqual(parseRef('3'), { story: MAIN, n: 3 });
    assert.deepEqual(parseRef('rudd:2'), { story: 'rudd', n: 2 });
    assert.equal(parseRef('rudd'), null);
    assert.equal(refKey(4), 'main:4');
});

test('the reading: per story, in the order read', () => {
    const r = Reading.fromSave({ para: 2 });
    assert.deepEqual(r.log, ['main:1', 'main:2']);
    r.readOn('rudd', 2);
    r.readOn(MAIN, 3);
    assert.equal(r.readTo('rudd'), 2);
    assert.equal(r.readTo('fenn'), 0);
    assert.ok(r.seen('rudd:1') && r.seen(3) && !r.seen(4) && !r.seen('fenn:1'));
    assert.ok(r.seen(0) && r.seen('fenn:0'), 'a title, or "always", is read');
    assert.ok(r.pos('rudd:2') < r.pos(3), 'the order of reading, not of the story');
    assert.equal(r.latest([1, 'rudd:2']), 'rudd:2');
    assert.equal(r.latest([1, 'fenn:1']), null);
    assert.ok(r.seenAll([1, 'rudd:1']) && !r.seenAll([1, 'fenn:1']));
    assert.deepEqual(r.before(3).log, ['main:1', 'main:2', 'rudd:1', 'rudd:2']);
    assert.deepEqual(Reading.fromSave({ log: r.log, para: 1 }).log, r.log, 'a log wins over an earlier para');
    assert.equal(Reading.fromSave({ log: r.log, para: 5 }).readTo(MAIN), 5, 'a later para reads the main story on');
});

test('with the stories\' lengths, what is unread has a place after what is read', () => {
    const r = new Reading(['main:1', 'rudd:1'], { main: 3, rudd: 2 });
    assert.deepEqual(r.full().keys, ['main:1', 'rudd:1', 'main:2', 'main:3', 'rudd:2']);
    assert.equal(r.pos('rudd:2'), 5);
    assert.ok(!r.seen('rudd:2') && r.seen('rudd:1'));
    r.readOn('rudd', 2);
    assert.equal(r.pos('rudd:2'), 3);
});
