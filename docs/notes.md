# The player's notes on the story

Status: **BUILT** (Rounds 177–179); **AGREED** (Robert, 2026-10-19, Rounds 175–176). Piece 2 of
`docs/kickoff-layout.md` (first set out as piece 3 of `docs/kickoff-closing-review.md`): the player writes their own
notes against the story text, visually distinct from it. First paper Round 175 (five looks, A–E); Robert chose **D and
E** (notes written into the story's line, anywhere in the text, the words a note speaks of highlighted; and a Notes
tab), then the controls (N8 a: a notes mode in the header) and the settings menu (N9, with more settings than first
listed: the highlight's style and light or dark). The agreed answers are in the "Agreed" section at the end.

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

### The second round: D + E, and the controls

Made the same way (the session's `notes2/mock.mjs`), Hard at ¶37: the agreed look with four notes (three on highlighted
words, one written mid-sentence after "Finally," with nothing highlighted), the Notes tab on the right, and the header
as Robert sketched it ("Settings" for the drop-down, Start over inside it, a notes toggle in its place). Then one
screenshot per way of making a note (N8).

| Shot | What it shows |
|---|---|
| `ctl-look-desktop.png`, `ctl-look-phone.png` | The look: highlights in a marker yellow, each note in the hand between ‹ › where it was written, the Notes tab listing them by paragraph with "on “…”" or "after “…”", edit and delete |
| `ctl-mode-desktop.png`, `ctl-mode-phone.png` | (a) Robert's idea: "✎ Notes: on" in the header where Start over was; the story's cursor is a text cursor; a click opened a note at that point ("Did he see it, or work it out?"), a drag would first highlight |
| `ctl-settings-desktop.png` | The drop-down renamed "Settings · Hard", Start over at its foot |
| `ctl-select-desktop.png`, `ctl-select-phone.png` | (b) No mode: select words and a small bar offers "Highlight" and "Note" |
| `ctl-strip-desktop.png` | (c) A strip at the top of the Story tab: "Highlight", "Note", the count of notes |
| `ctl-menu-desktop.png` | (d) A right-click (a long press on a phone) on the words: "Note on …", "Highlight only", "Note here, without highlighting", "Collect the card" |
| `ctl-bar-desktop.png` | (e) A "✎ Note" button in the reading bar: a note at the end of the latest paragraph |

## Questions, alternatives, recommendations

### N1. The look — agreed: D + E

Notes are written into the story's line, at the point the player chose, in the hand and the note's ink between ‹ ›; the
words a note speaks of (if any) are highlighted in a marker yellow. A **Notes** tab (an eleventh tab, "Notes (N)") lists
every note by paragraph, each with its place ("on “…”" or "after “…”"), "edit" and "delete", and a click on a note
shows it in the story (the layout's rule: in the other panel, or in place in one column).

### N2. What a note is attached to — agreed: a point anywhere, the words it speaks of if the player marks them

A note is written at a point in a paragraph's text (`{para, at}`, an offset in the paragraph's fixed text, so it
survives any redraw), and may highlight the words it speaks of (`{from, to}` in the same paragraph). When words are
highlighted the note is written after them unless placed elsewhere. One paragraph at a time: a selection across two is
cut to the first. A highlight without a note is allowed (a marker on the words, nothing written); listed in N8.

### N3. Saved where — agreed: with the game

In the game's save, as the player's paper on this reading; "Start over" asks, as it does for the rest, and clears them.
A re-read keeps them.

### N4. Edited and deleted — agreed

A click on a note in the story (or "edit" in the Notes tab) opens it in place, in a plain text box in the hand; kept on
Enter or on leaving the box, Esc cancels. "delete" removes it, with "Note deleted · undo" in a toast. No formatting.

### N5. Do notes ever feed the game — agreed: never

They are the player's paper: not read, matched, scored or counted; nothing in the record, the hints or the questions
looks at them.

### N6. The reading layer

A note is the player's own text: it cannot run ahead of the story, and is never checked. Fixed words around it ("Note…",
"edit", "delete", "Your notes") are labels. The autoplay's notes are the annotator's, which is piece 3's question:
134 of the 206 prose thoughts carry no hindsight mark, id or paragraph reference; the other 72 need a typed form (decided
in the autoplay paper).

### N7. Shown on every difficulty — agreed

Notes are the player's, not the game's help. On Hard a collected card's words are a dotted green line; a highlight is a
yellow marker and a note blue ink, so neither reads as a card.

### N8. The controls: how a note is made (open)

The constraint: on Hard a click on the story's words collects the card they carry (Round 157), and on the other
difficulties it opens the card; making a note must not take that click away.

- **(a) A notes mode, toggled in the header (Robert's idea; `ctl-mode-*`).** "✎ Notes" where Start over was; on, it reads
  "✎ Notes: on" in the note's ink and the story's cursor becomes a text cursor. In the mode a click on the story opens a
  note at that point; a drag over words highlights them and opens a note after them; a click on a note edits it.
  Collecting and opening cards wait until the mode is off. *For:* one clear switch, no clash with Hard's clicks, the same
  on a phone (a tap places, a drag highlights); easy for the autoplay to show (it turns the mode on, places, types).
  *Against:* a mode can be forgotten (the pill and the cursor say so); the header is shared by both panels, while notes
  only concern the story (with the story hidden the toggle could open it).
- **(b) No mode: a selection offers "Highlight" and "Note" (`ctl-select-*`).** Drag over words (a long press on a phone)
  and a small dark bar appears by them. *For:* nothing to switch, the usual gesture of reading apps. *Against:* a note at a
  point with nothing highlighted needs a word selected first (the note then goes after it); on a phone the bar competes
  with the phone's own copy menu.
- **(c) A strip at the top of the Story tab (`ctl-strip-desktop.png`).** "Highlight" and "Note" act on the selection, or
  "Note" then a click places it. *For:* the tools live with the story, in whichever panel it is. *Against:* one more row
  above the text, on a phone too.
- **(d) A right-click or long-press menu (`ctl-menu-desktop.png`).** *For:* no visible chrome. *Against:* hidden (a
  player may never find it); a long press on a phone is also the phone's own selection gesture.
- **(e) "✎ Note" in the reading bar (`ctl-bar-desktop.png`).** A note at the end of the latest paragraph, to be moved.
  *For:* always in reach, even with the story hidden. *Against:* "anywhere in the text" needs a second step.

Combinations: (a) with (b)'s bar inside the mode (select words, then choose Highlight or Note); (a) with (e) (the
bar's button turns the mode on). **Recommended: (a)**, as Robert sketched, with one refinement: turning it on with the
story hidden brings the story into view (the layout's rule for a link).

### N9. The settings menu (open)

Robert's idea: the drop-down is named **Settings** (today its summary reads "Hard · Free pace · Background when
asked"; on a phone, "Hard"), and "Start over" moves inside it, at its foot under a line, still asking before it clears.
Recommended as sketched (`ctl-settings-desktop.png`): "⚙ Settings · Hard" on a desktop, "⚙ Settings" on a phone.
Settings that could join it:
- **The columns** ("Two columns" / "One column", today a toggle in the header): moved in as "Layout", freeing the
  header; recommended, since it is set once and rarely changed.
- **Notes in the story:** shown, or only in the Notes tab (a clean text for re-reading); listed.
- **The note's hand:** the handwriting face or the page's own; listed.
- **Later, the autoplay** (piece 3): its speed and whether it types; the autoplay paper decides.

## Agreed (Robert, Rounds 175–176)

- **N1:** D + E: notes in the line where the player put them, in the hand, between ‹ ›; the words a note speaks of
  highlighted; a Notes tab listing every note, with its place, "edit" and "delete".
- **N2:** a note at any point of a paragraph's text, with the words it speaks of highlighted if the player marks them;
  **a highlight without a note** is allowed (a marker on the words, listed in the Notes tab as a highlight).
- **N3–N5, N7:** saved with the game, cleared by "Start over"; edited in place, deleted with undo; never feeding the
  game; on every difficulty.
- **N8: (a), a notes mode**, toggled in the header where Start over was: on, a click on the story opens a note at that
  point, a drag highlights the words and opens a note after them (left empty, the highlight stays alone), a click on a
  note edits it; collecting and opening cards wait until it is off. Turning it on with the story hidden brings the story
  into view.
- **N9, the Settings menu:** the drop-down is "⚙ Settings" ("⚙ Settings · Hard" on a desktop); "Start over" moves inside
  it, at its foot; and it gains the viewer's settings:
  - **Layout:** two columns or one (the header's toggle moves in; hidden on a phone, which is always one column);
  - **Theme:** as the system, light or dark;
  - **Notes in the story:** shown, or only in the Notes tab;
  - **The notes' hand:** handwriting, or the page's own face;
  - **Highlights:** a yellow marker (the default), or a blue underline (Robert liked it; drawn solid and thick, under
    the line, in the note's ink, apart from the story's own marks: an entity's thin underline and an event's dotted one
    on Easy, a collected card's dotted green on Hard), or a pale blue wash;
  - later, the autoplay's speed and typing (piece 3, its own paper).
  These are the viewer's, like the layout: kept with it in `mystery-clue-game:layout:v1`, apart from the game's save,
  and kept by "Start over". The game's settings (difficulty, pace, the options) stay as they are, under their own
  heading.

## Order of work

1. **The Settings menu:** renamed; Start over inside; the columns toggle moved in as "Layout"; "Theme" (system, light,
   dark). No notes yet. Checked in headless Chrome (both themes, desktop and phone) and by the action table through the
   UI (its runner presses Start over and the columns toggle where they now are).
2. **Notes in the game:** `Game` keeps notes (`{id, para, at, from, to, text}`) and highlights, saved and reloaded with
   the game, cleared by a reset, never read by anything else; node tests (`engine/notes.test.js`).
3. **Notes in the page:** the notes mode, placing, highlighting, editing and deleting in the story; the Notes tab; the
   three notes settings (shown, hand, highlight style); the hand served with the page (Caveat, SIL Open Font
   License, in `ui/fonts/`). Checked in headless Chrome by a script that makes, edits and deletes notes through the page,
   and by the action table through the UI (notes mode off: nothing changes).

Each step one commit with a Round entry, gated on `npm test`; screenshots for Robert; the logs, reports and gate
listing diffed (nothing should move).
