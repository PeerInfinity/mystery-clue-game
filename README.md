# Mystery clue game

**Play in your browser:** [the start page](https://peerinfinity.github.io/mystery-clue-game/) · [How to play](https://peerinfinity.github.io/mystery-clue-game/guide.html)

You read a short detective story a paragraph at a time and keep an ordered list of what happened: who was where, who
did what, and when. What the narrator sees is certain; everything else reached the narrator through a chain of people,
and you choose how far to trust each link. The page lists the contradictions among what you accept. The story raises
questions as it goes; before it gives an answer away you show it, by linking the evidence and circling the answer the
evidence leaves.

**Short cases**, each an invented story of a few paragraphs, about two minutes long, built around one move of the game:
[The Lamp-Keeper's Word](https://peerinfinity.github.io/mystery-clue-game/?case=cases/miniatures/lamp-keepers-word) (one witness's word reaches you by two people) ·
[The Rent Box](https://peerinfinity.github.io/mystery-clue-game/?case=cases/miniatures/rent-box) (two lodgers' statements that cannot both be true) ·
[The Rent Box Papers](https://peerinfinity.github.io/mystery-clue-game/?case=cases/miniatures/rent-box-papers) (the same case, its clues as papers you read in any order) ·
[The Last Ferry](https://peerinfinity.github.io/mystery-clue-game/?case=cases/miniatures/last-ferry) (what happened in what order) ·
[The Stable Clock](https://peerinfinity.github.io/mystery-clue-game/?case=cases/miniatures/stable-clock) (one shot, two honest witnesses, two times) ·
[The Ring on the Bench](https://peerinfinity.github.io/mystery-clue-game/?case=cases/miniatures/ring-on-the-bench) (a locked room, and the ways into it) ·
[The Loose Board](https://peerinfinity.github.io/mystery-clue-game/?case=cases/miniatures/loose-board) (who could have known where it was hidden?) ·
[The Cellar Door](https://peerinfinity.github.io/mystery-clue-game/?case=cases/miniatures/cellar-door) (what an act needed, and who had it) ·
[The Dinner at Larch House](https://peerinfinity.github.io/mystery-clue-game/?case=cases/miniatures/dinner-at-larch-house) (one evening, told by two people) ·
[The Will in the Bible](https://peerinfinity.github.io/mystery-clue-game/?case=cases/miniatures/will-in-the-bible) (a paper that says more than it could have known) ·
[The Telegram Signed M.](https://peerinfinity.github.io/mystery-clue-game/?case=cases/miniatures/telegram-signed-m) (one clue that reads two ways) ·
[The Sailor's Knot](https://peerinfinity.github.io/mystery-clue-game/?case=cases/miniatures/sailors-knot) (who could have tied it) ·
[The Watchman's Clock](https://peerinfinity.github.io/mystery-clue-game/?case=cases/miniatures/watchmans-clock) (what is missing from a record) ·
[The Grey Cloak](https://peerinfinity.github.io/mystery-clue-game/?case=cases/miniatures/grey-cloak) (an honest witness who is wrong) ·
[The Night Porter's Statement](https://peerinfinity.github.io/mystery-clue-game/?case=cases/miniatures/night-porters-statement) (a storyteller you cannot wholly
believe)

They are the first of the project's present direction, stories written for this system
([`docs/authored-stories.md`](docs/authored-stories.md), which contains spoilers).

**Two full cases**, both by Arthur Conan Doyle (1892, public domain), which the page was built on. You read them as Dr
Watson. They are experiments, kept in [`v2/`](v2/README.md) as they stood on 2026-11-11, with their own copy of the
page, so the page can change for the new stories without disturbing them:

- [**Silver Blaze**](https://peerinfinity.github.io/mystery-clue-game/v2/), the case the game was built on, refined over many rounds of review.
- [**The Adventure of the Speckled Band**](https://peerinfinity.github.io/mystery-clue-game/v2/?case=cases/speckled-band), the first story set up by the new-story
  pipeline ([`v2/pipeline/README.md`](v2/pipeline/README.md)): a first version, not reviewed by hand, so it may have
  rough edges, such as a label that says more than the story has told.

## Status: experimental, a working foundation

Each story is modelled whole: every event, where each one came from and through whom, and the questions it raises.
Nothing on the page runs ahead of the paragraph you have read. It can be played to the end, with hints from wherever
you are, and a careful reader's playthrough can be watched. It is a foundation more than a finished game and may
change a great deal: the directions it might grow in are collected in [`docs/authored-stories.md`](docs/authored-stories.md)
and [`docs/ideas.md`](docs/ideas.md) (both contain spoilers).

## What is in it

- **The timeline**, as a list or as a grid by place or by source, filled in as you read.
- **Trust** per link of each chain and per statement, and a cap per person; what you trust decides what is on the
  timeline.
- **Contradictions**, found automatically among what you accept, each traced to both sides' chains, and **likely
  clashes**, two things that can both hold but sit badly together.
- **Questions** to answer by circling and crossing out, and a gate before each answer the story gives away.
- **Rooms and observations** (in a story that needs them): mark the ways into a room, build a route through it,
  and point out which entries bear on an open question; the page fills in what each shows.
- **Reasoning moves**: point out a change, what an action needs and does, what it is for, and what a plan would
  need, each checked against the timeline.
- **Cards** for everyone and everything met so far; every name in the story is a link.
- **Hints** on request, in three steps from where to look to making the move for you.
- **An autoplay**: a careful reader fills in the whole timeline through the page.
- **Three layouts** (three columns, or panels with tabs, two or one), a light and a dark theme.

## The earlier game

The page grew out of an earlier game on Silver Blaze,
**[kept at `v1/`](https://peerinfinity.github.io/mystery-clue-game/v1/)** with
[its own guide](https://peerinfinity.github.io/mystery-clue-game/v1/guide.html). Its people, places, things and
clues become cards; every card raises questions with candidate answers, like pencil marks in sudoku; you rule
answers out and build inferences, citing the cards that justify them, against Holmes's record. It was an experiment
in turning Holmes's reasoning into game mechanics, and it showed the limits of that approach: even a player who has
worked out the solution must then guess how to express it in the game's moves (the old adventure-game problem), and
the size of the case makes that worse. It has four difficulties, theories and checks, notes, hints and an autoplay
of its own. It may be removed later.

## Run it locally

```
node scripts/serve.js            # http://localhost:8321/ (the full cases: /v2/; the earlier game: /v1/)
npm test                         # engine tests and the validation of every short case (under a second)
npm run page-checks-all          # every short case played through the real page (about two minutes)
```

No build step and no runtime dependencies (`npm install` fetches only the schema checker the tests use).

## Documentation

- [`docs/technical.md`](docs/technical.md): how it is built, the commands, the checks. No spoilers.
- [`docs/case-format.md`](docs/case-format.md): the case format and the engine behaviour it drives. Spoilers.
- [`docs/authored-stories.md`](docs/authored-stories.md): the present direction, what each short case showed, and the
  mechanics to add. Spoilers.
- [`v2/docs/reading-annotated.md`](v2/docs/reading-annotated.md): a careful reader's thoughts through the whole of
  Silver Blaze, the specification the moves were built from. Spoilers.
- [`v2/docs/logic-audit.md`](v2/docs/logic-audit.md): for each answer the gate asks for in Silver Blaze, which links
  of the reader's reasoning the page supports. Spoilers.
- [`docs/ideas.md`](docs/ideas.md): where the project stands, why the earlier game fell short, ideas not built,
  known limitations. Spoilers.
