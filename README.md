# Mystery clue game

**[Play it in your browser](https://peerinfinity.github.io/mystery-clue-game/)** ·
[How to play](https://peerinfinity.github.io/mystery-clue-game/guide.html)

A deduction game built on a fair-play detective story. You read the story a paragraph at a time; the people,
places, things, events and clues it mentions become cards; every card raises questions (who did it, where,
when, whose is it, is it true?) with candidate answers, like pencil marks in sudoku. You rule answers out and draw
conclusions, citing the cards that justify them, and the game checks your reasons. Your record is kept against
the detective's: a step counts when you make it before he does.

The first and only case is Arthur Conan Doyle's "Silver Blaze" (1892, public domain).

## Status: an unfinished experiment

The aim was to analyse the reasoning Sherlock Holmes uses to solve the case and turn it into game mechanics, so
that solving the case would feel like solving a sudoku: any sufficient set of reasons accepted, not just the
detective's.

The modelling works. The whole case is in the game, it checks every step, and it never shows a clue before the
story tells it. A player can beat Holmes to almost every one of his deductions.

As a game, it falls short. It runs into the old adventure-game problem: even a player who has worked out the
solution must then guess how to express it in the game's moves, and ends up trying combinations of cards until
one is accepted. The size of the game (hundreds of cards and questions) makes that worse, and the play is not
much like sudoku. Turning it into multiple choice would remove the guessing but make it too easy.

Directions that might still make it playable, such as an incremental game about automating the search, or an
[Archipelago](https://archipelago.gg/) randomizer integration in which clues arrive as items, are collected in
[`docs/ideas.md`](docs/ideas.md) (which contains spoilers).

## What is in it

- **Four difficulties** (Trivial, Easy, Medium, Hard) and a custom mix, and a pace that can wait for you at each
  of the detective's deductions.
- **Theories, checks and your own questions**: weigh the possible stories of the crime, seal a prediction before
  the detective acts, ask the questions a reader asks.
- **The record**: how many of the detective's steps you made first, shown as the story reaches each one.
- **Hints** on request, in four steps from a nudge to making the move for you.
- **Notes and highlights** written into the story.
- **An autoplay** that plays the whole case to the maximum score.

See the [user guide](https://peerinfinity.github.io/mystery-clue-game/guide.html) for how to play.

## Run it locally

```
node scripts/serve.js            # http://localhost:8321/
npm test                         # engine tests and full case validation (about 7–8 minutes)
```

No build step and no runtime dependencies (`npm install` fetches only the schema checker the tests use).

## Documentation

- [`docs/technical.md`](docs/technical.md): how it is built, the commands, the checks. No spoilers.
- [`docs/case-format.md`](docs/case-format.md): the case format and the engine behaviour it drives. Spoilers.
- [`docs/reading-annotated.md`](docs/reading-annotated.md): a careful reader's thoughts through the whole story,
  the specification the game's moves were built from. Spoilers.
- [`docs/ideas.md`](docs/ideas.md): why the game falls short, ideas not built, known limitations. Spoilers.
