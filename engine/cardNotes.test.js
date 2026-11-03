// The player's own words and marks on a card (2026-11-02, replacing the question form and the "because" of a notice):
// a free note per card, never read by the game; the two marks, important (noticed) and unimportant (set aside),
// exclude each other.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, EASY } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);
const easy = () => new Game(model, { difficulty: EASY, options: { background: 'relevant' } });
const readTo = (g, p) => { while (g.read <= p) g.advance(); }; // ¶p read

test('a note on a card: written, rewritten, removed, saved; only on a card held; the score untouched', () => {
    const g = easy();
    assert.equal(g.setCardNote('silver_blaze', 'Where is he?').ok, false, 'not before the card is held');
    readTo(g, 14);
    const before = JSON.stringify(g.record());
    assert.ok(g.setCardNote('silver_blaze', '  Where is he?  ').ok);
    assert.equal(g.cardNote('silver_blaze'), 'Where is he?');
    const para = g.cardNotes.get('silver_blaze').para;
    readTo(g, 20);
    g.setCardNote('silver_blaze', 'Where is he?\nWho took him?');
    assert.equal(g.cardNotes.get('silver_blaze').para, para, 'a note keeps the paragraph it was first written at');
    assert.equal(JSON.stringify(g.record()), before, 'the game never reads a note');
    const again = new Game(model, { difficulty: EASY });
    again.load(g.save());
    assert.deepEqual(again.allCardNotes(), g.allCardNotes());
    assert.ok(g.setCardNote('silver_blaze', '   ').deleted, 'no words: the note goes');
    assert.equal(g.cardNote('silver_blaze'), '');
});

test('important and unimportant exclude each other', () => {
    const g = easy();
    readTo(g, 20);
    assert.ok(g.notice('c.curry_for_supper').ok);
    assert.ok(g.setAside('c.curry_for_supper'));
    assert.deepEqual([g.noticed.has('c.curry_for_supper'), g.isSetAside('c.curry_for_supper')], [false, true]);
    assert.ok(g.notice('c.curry_for_supper').ok);
    assert.deepEqual([g.noticed.has('c.curry_for_supper'), g.isSetAside('c.curry_for_supper')], [true, false]);
});

