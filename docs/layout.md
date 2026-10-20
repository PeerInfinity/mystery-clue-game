# The layout: tabs at the top of both panels, the story as a tab, one or two columns

Status: **BUILT** (Rounds 171–174, its four steps); **AGREED** (Robert, 2026-10-19, Round 170: every recommendation of
Q1–Q7 and the order of work), piece 2 of
`docs/kickoff-closing-review.md`. To be built from `docs/kickoff-layout.md`. Builds on `docs/ui.md` (the UI as built,
Rounds 144–148), `docs/questions.md` (Rounds 152–155), the closing review (`docs/review-closing.md`, Rounds 157–168,
which played the whole game through the page) and Robert's wishes: both panels get their tab selector at the top; the
story becomes one of the selectable tabs; a toggle between one column and two.

## The player's process

The player does three things with the page, and the layout serves each:
- **Reads.** The story is the spine: a paragraph at a time, with "Next paragraph" and its notes (the record's news at
  Holmes's paragraphs, "Holmes is a step ahead", the story's prompts). On Hard, reading is also collecting: the
  player clicks the words of the story.
- **Works a card.** Opens a card from the story or a list, and makes a move on it: infer, notice, doubt, ask, set aside.
  The closing review's 396 moves open a card 380 times (a build opens each card it connects) and click the story 151
  times.
- **Compares.** The story beside a card; a card beside the timeline or the theories; two lists side by side. Today
  only "the story beside one tool" is possible.

## What exists

Screenshots (headless Chrome, an Easy builder at ¶120; in the session's scratchpad, `shots/`):
- **Desktop (1400 × 900):** two fixed columns. Left: the story, with the reading bar under it ("Next paragraph",
  "Next scene", "Next deduction", "Re-read…", "120 of 231 paragraphs" and the notes). Right: eight tab buttons (Card,
  Cards, Questions, Inferences, Theories, Checks, Timeline, Background) that wrap onto two rows, then the tab. *Your
  record against Holmes* is a ninth view, opened by its links, with no tab button.
- **Phone (390 wide):** one long page, 5,584 px tall at ¶120: the story's last paragraphs in a box, the reading bar,
  then the eight tab buttons (three rows) and the whole tab below. Reaching a card's moves means scrolling past the
  story; reading on means scrolling back up.

In the code (`ui/app.js`, `index.html`, `ui/style.css`): one `ui.tab` and one `#tool`; the story is drawn into
`#story` by `renderStory`, the bar into `#reader` by `renderReader`; `openCard` sets `ui.tab = 'card'`; the grid is
`.layout` (two columns), stacked by a media query below 700 px. Every link in the page (`data-card`, `data-slot-open`,
`data-tab-open`, `data-record-open`) assumes the one tool panel.

## Questions, alternatives, recommendations

### Q1. What each panel may show

The tabs: **Story**, Card, Cards, Questions, Inferences, Theories, Checks, Timeline, Background, and Your record (made
a tab like the others).

- **(a) Any tab in either panel, each tab in one panel at a time (recommended).** Both panels carry the same selector.
  Choosing a tab that the other panel shows swaps the two panels' tabs, so nothing is ever shown twice and nothing
  disappears. Story on the right, the Timeline on the left: allowed.
- **(b) A tab may be in both panels.** Two Card tabs would show two cards side by side, which a comparing player would
  like; but two views of one list (two Questions tabs) are noise, and every move would have to redraw both. Listed:
  if wanted later, as "pin this card" (a second Card tab for one card).
- **(c) Fixed sides:** the story and the timeline left, the tools right, with a selector on each. Simpler, but it is
  not what Robert asked (the story as one tab among others).

### Q2. The reading bar when the story is not shown

The bar holds "Next paragraph", "Next scene", "Next deduction", "Re-read…", the count, and the notes (the record's
news, "Holmes is a step ahead", the story's prompts, a re-read's question).

- **(a) A page-level reading bar (recommended):** a strip under the header, the full width, always shown, whatever the
  panels hold. Reading on with the story hidden still reads on; the bar's notes stay where they are today (in the bar),
  and a short line says what the new paragraph brought ("¶121 read · 3 new cards"). The story tab then holds the text
  alone, scrolled to the latest paragraph when shown.
- **(b) The bar inside the Story tab only:** to read on, the player shows the story. Simple, but in one column the
  player must leave a card to read on, and the record's notes would be missed.
- **(c) Both:** the full bar with the story, a small "Next paragraph" button in the header otherwise. Two places for
  one thing; listed.

On **Hard**, collecting is clicking the story's words: the story must be shown to collect, whatever the bar does. With
(a), the bar's "new" line says "¶121 read: open the story to collect".

### Q3. Where a card opens

Today every link opens the Card tab in the one tool panel.

- **(a) In the other panel (recommended, two columns):** a link opens the Card tab in the panel the click did not come
  from, so the story (or list) the player clicked in stays in view: the story left and a card right, as today, but
  also Cards left and a card right, or a card left and the Timeline right. A link inside the Card tab opens in place
  (moving from card to card), with a "back" link to the card before.
- **(b) Always in a fixed panel (the right):** predictable, but a player with the story on the right loses it.

In **one column**, a card opens in the one panel, in place of what was shown, with "back" (to the story or the list it
came from). Holmes's interest, the record and the re-read prompts follow the same rule.

### Q4. One column or two

- **A toggle in the header**, beside Settings: "Two columns" / "One column". One column is one panel the full width, its
  selector at the top. Two columns are today's split, both with selectors.
- **Below 700 px (phones):** always one column, the toggle hidden. The page no longer stacks the story above the tools:
  one panel at a time, the selector at the top, and the reading bar (Q2 a) fixed at the bottom of the screen, where the
  thumb is. This replaces today's 5,584 px page.
- **The split:** half and half, as today. A draggable divider is listed, not recommended now.

### Q5. The selector's look

Ten tabs do not fit one row at half of 1400 px; today eight wrap onto two rows. Recommended: one row per panel that
scrolls sideways when it overflows (with the counts kept: "Cards (402 new)", "Questions (11 clashes)"), the tab shown
underlined; the story's tab is "Story" with the paragraph count ("Story ¶120"). The record's tab is "Record" with
"Ahead of Holmes: N" (the header keeps its link too).

### Q6. What is remembered

The columns, and the tab of each panel, per viewer in `localStorage` under a key of its own
(`mystery-clue-game:layout:v1`), not in the game's save: the layout is the viewer's, the game is the case's. "Start
over" keeps the layout. A save made before the layout opens as today (story left, Card right, two columns).

### Q7. The default

Two columns, Story left and Card right: today's page, with the selectors added and the bar moved up. A player who never
touches the selectors sees what they see now.

## The cases as tests

| Case | Setting | Expected |
|---|---|---|
| Default | a new viewer, desktop | Story left, Card right, two columns, bar under the header |
| Swap | choose Story in the right panel | the left panel takes the right's tab (Card); nothing shown twice |
| Read on, story hidden | Cards left, Card right, "Next paragraph" | the story reads on; the bar says "¶121 read · N new cards"; the record's note as today |
| Card from a list | Cards left, click a card | it opens in the right panel; the list stays |
| Card from a card | a link in the Card tab | it opens in place; "back" returns |
| One column | toggle | one panel; a card opened from the story replaces it, "back" returns to the story at the same place |
| Phone | 390 px | one column, no toggle; the bar at the bottom; no page taller than the screen but the panel's own scroll |
| Hard | the story hidden, read on | "open the story to collect" |
| Remembered | reload | the same columns and tabs; the game unchanged |
| The action table | the whole game through the UI on Hard (`ui-run`) | 396 moves, none failed, 70 ahead of Holmes, in the default layout and in one column |
| Unchanged | all | the logs, the reports, the gate listing; no card text |

## Order of work (if agreed)

1. **Panels:** two panels drawing any tab (`ui.panels = [{tab}, {tab}]`), the selector on both, the swap, the record as
   a tab, the story as a tab; links routed by Q3. The bar stays with the story for this step. Checked in headless
   Chrome; the action table played through the UI (its runner learns the panels).
2. **The reading bar** at page level (Q2), with the new line.
3. **One column** and the phone layout (Q4), the selector's look (Q5).
4. **Remembered** (Q6).

Each step one commit with a Round entry, gated on `npm test`; screenshots of each step for Robert; the logs and reports
diffed (nothing should move: UI only).

## For Robert

1. **Q1:** any tab in either panel, swapping rather than showing a tab twice? (A "pin this card" second Card listed.)
2. **Q2:** the reading bar at page level, under the header, always shown?
3. **Q3:** a card opens in the other panel (two columns), in place with "back" (one column)?
4. **Q4:** the toggle in the header; phones always one column, with the bar at the bottom?
5. **Q5–Q7:** one scrolling row of tabs per panel; the layout remembered per viewer apart from the save; today's page as
   the default?
6. **The order of work** above?

## Agreed (Robert, Round 170)

Every recommendation as written: any tab (Story and Record among them) in either panel, choosing a tab the other panel
shows swaps them (Q1 a; a "pin this card" second Card tab listed); the reading bar at page level, under the header,
always shown, with the line saying what a paragraph brought and, on Hard, "open the story to collect" (Q2 a); a card
opens in the other panel with two columns, in place with "back" in one column (Q3 a); the toggle in the header, phones
always one column with the bar at the bottom (Q4); one sideways-scrolling row of tabs per panel with their counts (Q5);
the layout remembered per viewer under `mystery-clue-game:layout:v1`, apart from the save, "Start over" keeping it (Q6);
today's page as the default (Q7); the order of work.
