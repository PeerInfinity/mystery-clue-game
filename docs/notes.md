# The player's notes on the story

Status: **for Robert** (2026-10-19, Round 175). Piece 2 of `docs/kickoff-layout.md` (first set out as piece 3 of
`docs/kickoff-closing-review.md`): the player writes their own notes against the story text, visually distinct from
it. Robert has not decided the look, so five looks are mocked up below inside the built layout (`docs/layout.md`,
Rounds 171–174) for him to choose by sight. Nothing is built until he agrees.

## The player's process

A careful reader of a detective story keeps a paper beside the book: a word against a line ("A blow, singular."), a
question in the margin, a small chain of reasoning under a paragraph. The annotated reading (`docs/reading-annotated.md`)
is exactly such a paper, written by one careful reader. The game already lets the player make every *move* of that
paper (Rounds 157–168: the action table, 396 moves through the UI), but not keep the *words*: a thought like "The opium
went in after the lad's portion was separated from the household's" is either built as an inference (when the case has
it) or lost.

Notes are that paper. They also carry piece 3: the autoplay types each thought's prose as a note at the thought's
paragraph (`docs/kickoff-layout.md`), so the look must hold a lot of text in some paragraphs.

## What exists, measured

- **The annotation as notes** (`thoughts.json`): 296 thoughts at 106 paragraphs. 206 carry prose (28,000 characters;
  median 84, the longest 994). 142 quote the words they read (`reads`, the thought's span; 55 quote more than one
  clause); 85 of those have no prose (RECORD thoughts: the span alone). The densest paragraphs: ¶92, 15 thoughts and
  2,600 characters; ¶37, 16 and 2,000; ¶34, 8 and 1,500; ¶35, 10 and 700.
- **Spans in the page:** a paragraph is `#story p[data-p]`; its text is drawn as segments, some marked (`.m`, the words
  a card is collected by on Hard). A selection inside one paragraph is a character range of that paragraph's text, which
  is fixed (`story.txt`), so a note can be anchored by paragraph and offsets and survive any redraw. The re-read and the
  notice machinery already speak of paragraphs and passages, not of spans.
- **The save** (`mystery-clue-game:silver-blaze:v2`) holds the game (`game.save()`); the layout is apart (Round 174).

## The mock-ups

Made in headless Chrome on the built page (Hard, read to ¶37, the default two columns and a 390 px phone): four notes,
three on spans and one on a paragraph, injected by a scratch script (the session's `notes/mock.mjs`), nothing in the
repository changed. The hand is Caveat (a handwriting face, SIL Open Font License; served with the page if chosen), in
a blue ink; the spans the notes speak of are underlined in the same ink.

| | Look | Desktop | Phone | For | Against |
|---|---|---|---|---|---|
| **A** | **In the margin**: the story column narrows, each note in the hand beside its line | `notes-A-desktop.png` | `notes-A-phone.png` (no margin: falls under the paragraph) | The look of a book read with a pencil; the text undisturbed | Half the panel's width for the margin at 700 px; a crowded paragraph (¶37, ¶92) runs its notes far below their lines; on a phone it must become (B) |
| **B** | **Between paragraphs**: a pale card under the paragraph, its quote in small italic, the note in the hand, "edit · delete" | `notes-B-desktop.png` | `notes-B-phone.png` | Every note and its span are read together; any length fits; the same on a phone | The story is pushed apart; with the autoplay's 16 notes at ¶37 the paragraph is a page away from the next |
| **C** | **A highlighted span, the note on click**: a marker-pen highlight with a small ✎; the note opens over the text | `notes-C-desktop.png` | `notes-C-phone.png` | The text stays continuous; many notes cost nothing until opened | The notes are hidden: re-reading one's own paper means clicking each; the autoplay's typing would be seen only in an open note |
| **D** | **Pencilled into the line**: the note inline after its span, in the hand, between ‹ › | `notes-D-desktop.png` | `notes-D-phone.png` | Closest to writing in the book; note and words never apart | The story's sentences are broken by the notes; long notes make the text hard to read |
| **E** | **A Notes tab beside the story**: numbered markers in the text, the notes listed in the other panel by paragraph | `notes-E-desktop.png` | `notes-E-phone.png` (the markers only; the list is a tab away) | Uses the layout just built; the story unchanged but for small numbers; the list doubles as the player's whole paper | Note and text are in two places; in one column (and on a phone) only one is in view |

Combinations are possible: E's tab as the list of all notes with any of A–D in the story; C's highlight on the span with
B's card under the paragraph.

## Questions, alternatives, recommendations

### N1. The look

The five above. **Recommended: B with E's list** (cards between paragraphs, the span underlined in the note's ink, and
a Notes tab listing every note, each a link to its place). B is the only look that holds the densest paragraphs and works
the same on a phone; E's list is the player's paper whole, and costs one tab. Robert chooses by sight.

### N2. What a note is attached to

- **(a) A span or a paragraph (recommended):** select words in one paragraph and "Note…", or "Note on this paragraph"
  with nothing selected. Stored as `{para, from, to}` (offsets in the paragraph's text) or `{para}`. A selection across
  paragraphs is refused ("one paragraph at a time"), or (listed) cut to the first.
- **(b) Paragraphs only:** simpler, but 142 of the annotation's thoughts quote their clause, and the autoplay would lose
  that.
- **(c) Also to cards:** a note on a card, shown on the card. Listed: the notes are about the story's words; a card has
  its own quotes.

How to start a note: on Hard a click on the words collects (Round 157's rule), so selecting must not collect: a click
collects, a drag selects; a small "Note…" button appears by a selection, and "Note on this paragraph" on a paragraph's
hover (on a phone, by a long press, or a "Note" button in the bar for the latest paragraph).

### N3. Saved where

- **(a) With the game (recommended):** in the game's save, as the player's paper on this reading; "Start over" asks, as
  it does for the rest, and clears them. A re-read keeps them.
- **(b) Apart, like the layout:** notes that outlive "Start over". Listed: a second reading of a mystery is a different
  paper.

### N4. Edited and deleted

Each note has "edit" and "delete" (B and E show them; A, C and D on the note's click). Edited in place, in a plain text
box in the hand; saved on "Done" or leaving the box; a delete asks nothing but can be undone from a toast ("Note
deleted · undo"). No formatting; line breaks kept.

### N5. Do notes ever feed the game

**Recommended: never.** They are the player's paper: not read, matched, scored or counted; nothing in the record, the
hints or the questions looks at them. (The player's own questions, `docs/questions.md`, are the place where words become
moves.) Listed only: a "make this a question" button on a note that opens the card's "Ask your own question" with
nothing filled in.

### N6. The reading layer

A note is the player's own text: it cannot run ahead of the story, and is never checked. Fixed words around it ("Note…",
"edit", "delete", "Your notes") are labels. The autoplay's notes are the annotator's, which is piece 3's question:
134 of the 206 prose thoughts carry no hindsight mark, id or paragraph reference; the other 72 need a typed form (decided
in the autoplay paper).

### N7. Shown on every difficulty

Yes: notes are the player's, not the game's help. On Hard the underlining of a span must not read as a collected card
(those are a dotted green line): the note's ink is blue and solid.

## For Robert

1. **N1, the look:** which of A–E (or which combination), by the screenshots? Recommended B with E's list.
2. **N2:** a note on a span or a paragraph; a drag selects, a click still collects on Hard?
3. **N3–N4:** saved with the game, cleared by "Start over"; edit and delete on each note, undo from a toast?
4. **N5–N7:** notes never feed the game; never checked by the leak checks (the autoplay's text decided in its paper);
   on every difficulty?
