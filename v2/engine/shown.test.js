import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shownNames, timeLabelAt, questionLabelAt, questionSteps, asName, UNTOLD_TIME } from './shown.js';

const paras = ['I. The Purse', 'The miller came to us at breakfast.', 'Joseph Crane had lost his purse.', 'A man on the road was taken.', 'Ruth heard the gate.'];
const entities = [
    { id: 'crane', kind: 'person', name: 'Joseph Crane' }, { id: 'purse', kind: 'object', name: 'The Purse' },
    { id: 'pedlar', kind: 'person', name: 'The pedlar on the road' }, { id: 'ruth', kind: 'person', name: 'Ruth Crane', names: [{ from: 4, name: 'Ruth' }] },
    { id: 'mill', kind: 'place', name: 'The mill' },
];
const mentions = { crane: ['the miller', 'Joseph Crane'], purse: ['his purse'], pedlar: ['a man on the road'], ruth: ['Ruth'] };

test('a name shows only once the story has used it; before that the first phrase it used', () => {
    const n = shownNames(entities, mentions, paras);
    assert.equal(n.nameAt('crane', 1), 'The miller', 'the phrase first, as a name');
    assert.equal(n.nameAt('crane', 2), 'Joseph Crane');
    assert.equal(n.nameAt('purse', 2), 'The Purse', 'the title (¶0) does not count, but ¶2 uses the word');
    assert.equal(n.nameAt('pedlar', 3), 'The pedlar on the road', 'a description the text never uses holds from the first mention');
    assert.equal(n.nameAt('ruth', 3), 'someone', 'before any step: a word for its kind');
    assert.equal(n.nameAt('ruth', 4), 'Ruth', 'the case\'s own steps');
    assert.equal(asName('its trainer'), 'The trainer');
});

test('a time label and a question label by paragraph', () => {
    assert.equal(timeLabelAt({ id: 't', label: 'Monday night', para: 3 }, 2), UNTOLD_TIME);
    assert.equal(timeLabelAt({ id: 't', label: 'Monday night', para: 3 }, 3), 'Monday night');
    const t = { id: 't', label: 'x', labels: [{ from: 1, label: 'One morning' }, { from: 5, label: 'Tuesday morning' }] };
    assert.equal(timeLabelAt(t, 0), UNTOLD_TIME);
    assert.equal(timeLabelAt(t, 2), 'One morning');
    assert.equal(timeLabelAt(t, 9), 'Tuesday morning');
    const q = { label: 'Who killed Joseph Crane?', labels: [{ from: 1, label: 'Who killed the miller?' }, { from: 2, label: 'Who killed Joseph Crane?' }] };
    assert.equal(questionLabelAt(q, 1), 'Who killed the miller?');
    assert.equal(questionLabelAt(q, 3), 'Who killed Joseph Crane?');
    assert.deepEqual(questionSteps(q, 1).map((s) => s[1]), ['Who killed the miller?', 'Who killed Joseph Crane?']);
});
