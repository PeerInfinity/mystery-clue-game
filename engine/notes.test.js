// The player's notes on the story (docs/notes.md): written at a point of a paragraph read, the words they speak of
// highlighted if marked, or a highlight alone; saved with the game, cleared by a reset, and read by nothing else.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, EASY, HARD } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);
const readTo = (g, p) => { while (g.read <= p) g.advance(); }; // ¶p read
const text37 = () => model.story.paragraphs[37].display;
const span = (para, words) => { const t = model.story.paragraphs[para].display; const from = t.indexOf(words); return { from, to: from + words.length }; };

test('a note at a point, a note on marked words, a highlight alone', () => {
    const g = new Game(model, { difficulty: HARD });
    readTo(g, 37);
    const opium = span(37, 'an appreciable quantity of powdered opium');
    const a = g.addNote({ para: 37, ...opium, text: 'The opium went in after the portions were separated.' });
    const b = g.addNote({ para: 37, at: text37().indexOf('Finally,') + 'Finally,'.length, text: 'So the horse was there.' });
    const c = g.addNote({ para: 35, ...span(35, 'a savage blow from some heavy weapon') });
    assert.ok(a.ok && b.ok && c.ok);
    const [n35, nAt, nOpium] = g.allNotes();
    assert.equal(n35.id, c.id);
    assert.equal(n35.text, '', 'a highlight with no words written');
    assert.equal(nOpium.at, opium.to, 'a note on marked words is written after them');
    assert.equal(nAt.from, null);
    assert.ok(nAt.at < nOpium.at, 'in the story\'s order');
});

test('only paragraphs read, words within them, and something written or marked', () => {
    const g = new Game(model, { difficulty: EASY });
    readTo(g, 20);
    assert.equal(g.addNote({ para: 21, text: 'ahead' }).ok, false, 'not a paragraph not yet read');
    assert.equal(g.addNote({ para: 0, text: 'the title' }).ok, false);
    assert.equal(g.addNote({ para: 20, text: '   ' }).ok, false, 'nothing written, nothing marked');
    assert.equal(g.addNote({ para: 20, from: 5, to: 5 }).ok, false);
    assert.equal(g.addNote({ para: 20, from: 0, to: 1e6 }).ok, false);
    assert.equal(g.addNote({ para: 20, at: -1, text: 'x' }).ok, false);
    const end = g.addNote({ para: 20, text: 'At the end.' });
    assert.ok(end.ok);
    assert.equal(g.allNotes()[0].at, model.story.paragraphs[20].display.length, 'with no point, at the paragraph\'s end');
});

test('edited, deleted and put back; a highlight emptied stays, a bare note emptied goes', () => {
    const g = new Game(model, { difficulty: EASY });
    readTo(g, 37);
    const a = g.addNote({ para: 37, ...span(37, 'powdered opium'), text: 'first' });
    const b = g.addNote({ para: 36, text: 'bare' });
    assert.ok(g.editNote(a.id, '  second  ').ok);
    assert.equal(g.allNotes().find((n) => n.id === a.id).text, 'second');
    assert.ok(g.editNote(a.id, '').ok);
    assert.equal(g.allNotes().find((n) => n.id === a.id).text, '', 'the highlight stays');
    assert.equal(g.editNote(b.id, '').deleted, true);
    assert.equal(g.allNotes().length, 1);
    const gone = g.deleteNote(a.id);
    assert.equal(g.allNotes().length, 0);
    assert.ok(g.addNote(gone, gone.id).ok, 'undo puts it back with its id');
    assert.deepEqual(g.allNotes(), [gone]);
    assert.equal(g.addNote(gone, gone.id).ok, false, 'not twice');
});

test('saved with the game and reloaded; a reset clears them', () => {
    const g = new Game(model, { difficulty: HARD });
    readTo(g, 37);
    g.addNote({ para: 37, ...span(37, 'powdered opium'), text: 'A note.' });
    g.addNote({ para: 33, ...span(33, 'the favourite') });
    const state = JSON.parse(JSON.stringify(g.save()));
    const back = new Game(model, { state });
    assert.deepEqual(back.allNotes(), g.allNotes());
    back.reset();
    assert.deepEqual(back.allNotes(), []);
});

test('notes feed nothing: the record, the hints and the next save but its notes are the same with or without them', () => {
    const plain = new Game(model, { difficulty: EASY });
    const noted = new Game(model, { difficulty: EASY });
    for (const g of [plain, noted]) readTo(g, 40);
    noted.addNote({ para: 37, ...span(37, 'powdered opium'), text: 'The curry hides it: the drugger knew the menu.' });
    noted.addNote({ para: 39, text: 'Simpson is the police\'s man.' });
    for (const g of [plain, noted]) readTo(g, 60);
    assert.deepEqual(noted.record(), plain.record());
    assert.deepEqual(noted.buildable(), plain.buildable());
    const { notes, ...rest } = noted.save();
    const { notes: none, ...restPlain } = plain.save();
    assert.equal(notes.length, 2);
    assert.deepEqual(none, []);
    assert.deepEqual(rest, restPlain);
});
