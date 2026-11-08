# Mystery clue game

**[Play it in your browser](https://peerinfinity.github.io/mystery-clue-game/)** ·
[How to play](https://peerinfinity.github.io/mystery-clue-game/guide.html)

**Watson's timeline**: you read a fair-play detective story as Dr Watson, and keep an ordered list of what happened,
who was where, who did what, and when. What Watson sees himself is certain; everything else reached him through a
chain of people (a witness, the police, the papers, Holmes), and you choose how far to trust each link. The page
lists the contradictions among what you accept. The story raises questions as it goes; you circle the answer you
believe and cross out the ones you have ruled out, and before the story gives an answer away you commit to one.

The first and only case is Arthur Conan Doyle's "Silver Blaze" (1892, public domain).

## Status: a working foundation

The whole story is modelled: every event, where each one came from and through whom, and the questions it raises.
Nothing on the page runs ahead of the paragraph you have read. It can be played to the end, with hints from wherever
you are, and a careful reader's playthrough can be watched. It is a foundation more than a finished game: the
directions it might grow in are collected in [`docs/ideas.md`](docs/ideas.md) (which contains spoilers).

## What is in it

- **The timeline**, as a list or as a grid by place or by source, filled in as you read.
- **Trust** per link of each chain and per statement, and a cap per person; what you trust decides what is on the
  timeline.
- **Contradictions**, found automatically among what you accept, each traced to both sides' chains, and **likely
  clashes**, two things that can both hold but sit badly together.
- **Questions** to answer by circling and crossing out, and a gate before each answer the story gives away.
- **Reasoning moves**: point out a change, what an action needs and does, what it is for, and what a plan would
  need, each checked against the timeline.
- **Cards** for everyone and everything met so far; every name in the story is a link.
- **Hints** on request, in three steps from where to look to making the move for you.
- **An autoplay**: a careful reader fills in the whole timeline through the page.
- **Three layouts** (three columns, or panels with tabs, two or one), a light and a dark theme.

## The earlier game

Watson's timeline grew out of an earlier game on the same story,
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
node scripts/serve.js            # http://localhost:8321/ (the earlier game: http://localhost:8321/v1/)
npm test                         # engine tests and full case validation (under a second)
```

No build step and no runtime dependencies (`npm install` fetches only the schema checker the tests use).

## Documentation

- [`docs/technical.md`](docs/technical.md): how it is built, the commands, the checks. No spoilers.
- [`docs/case-format.md`](docs/case-format.md): the case format and the engine behaviour it drives. Spoilers.
- [`docs/reading-annotated.md`](docs/reading-annotated.md): a careful reader's thoughts through the whole story,
  the specification the moves were built from. Spoilers.
- [`docs/logic-audit.md`](docs/logic-audit.md): for each answer the gate asks for, which links of the reader's
  reasoning the page supports. Spoilers.
- [`docs/ideas.md`](docs/ideas.md): where the project stands, why the earlier game fell short, ideas not built,
  known limitations. Spoilers.
