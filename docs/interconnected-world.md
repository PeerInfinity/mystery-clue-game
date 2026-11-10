# An interconnected world of stories

**Status (2026-11-08): an idea under discussion with the user. Nothing here is built or tested, and several questions
are open.** It builds on the plan for connecting the existing game to Archipelago, `docs/archipelago-plan.md`, and
depends on it for the structure format and its validator ("The structure format and its validator" there).

**Partly superseded (2026-11-10)** by `docs/authored-stories.md`: a clue is a case file complete in itself, whose origin
does not matter, so blanking and "arrival as a way of knowing something" are no longer needed for a clue to be safe.

## The idea

The game is not only for existing stories. The aim is new stories set in one interconnected world. Each story has its
own protagonist, with a central mystery of their own to solve. Along the way each protagonist comes across clues to
the mysteries the other players are trying to solve. The players share one set of case files, which is how a clue
found in one story reaches the player who needs it.

## How the game's model fits

- **Your clues being found by someone else is what Archipelago does.** One player answers a question, and another
  receives evidence.
- **Provenance can carry it.** An item becomes a telling: one protagonist's account reaching another. It arrives as
  hearsay, starts uncertain, and can be distrusted, so a clue from another story may be mistaken or a lie. The trust
  and contradiction systems apply as they are.
- **Each player's goal is their central mystery.**
- **Contradictions can cross stories.** With shared people and time points, the engine can catch one witness's claim
  clashing with something another protagonist saw.

## How stories connect

Archipelago scatters items at random, and that has to go on working in a multiworld with other games. There are two
kinds of connection:

1. **Random.** Any clue anywhere. It needs nothing beyond the existing plan, but the connection has no meaning in the
   story.
2. **Authored.** A clue for one story is deliberately placed at a location in another. When the other story is not in
   the seed, the clue goes in the normal pool, so a story still works alone.

In both, the location is the one the existing plan defines: solving one of your own questions. The finder does not have
to understand a clue meant for someone else, though a partial understanding would sometimes be nice. Understanding is
therefore presentation only, and the logic never depends on it.

**A possible later addition: recognised clues.** One protagonist's story holds something that means nothing to them, and
the player links it to one of another player's open questions, the existing "Relevant to…" move extended across
stories. That link would be a location check, which gives the finder a real deduction and adds locations, easing the
limit on items. It is not needed for the idea to work, and it brings a constraint of its own (see Constraints).

## The shared case files

The players share one set of case files. Receiving an item adds a file to the set, whichever player's story or
whichever other game it was found in. No protagonist has to explain how it arrived, and a story's fixed prose never has
to mention it.

**Partial understanding (proposed, not decided).** A file could show what the reader already knows and blank out the
rest: "*the clerk* paid an unknown man at an unknown place." With shared people and places, how much of a file makes
sense would grow with how far the reader has got and whether it touches their own story. The same mechanism keeps a
clue that arrives early from running ahead of the story, and it needs little extra writing per clue.

**Sorting (later).** Mechanics for going through the files to find what bears on the current player's mystery may come
later. These fit the existing structure: receiving the item puts the file in the set, and finding it and linking it to
a question is the linking step that the plan already has. Other players' files would act as natural distractors. The
hints would have to point at the right file, because a player who holds a file but cannot find it would stall anyone
waiting on them. This extends the plan's rule that the hints must learn linking.

**Open:** whether stories are meant to be replayed from another seat. Someone who later plays another protagonist's
story will already have seen its clues, partly blanked out at best.

## How a story is written

The logic comes first, and is checked before the story is written.

1. An author, human or LLM, writes the rough logical structure, in a format that converts to Archipelago logic.
2. A script runs it through Archipelago's multiworld generator, to check that the logic is valid.
3. The author adjusts it and retests as necessary.
4. Once the logic is valid, the author fills in the rest of the details of the stories.
5. The finished stories are exported and checked again (below).

Archipelago tracks the dependencies and will not generate an unsolvable multiworld, so the generator is the check on
ordering and on deadlocks between stories, while they are still cheap to change. Its settings and what they must be
are in `docs/archipelago-plan.md`. For a group of stories, it matters above all that authored connections are real
placements: with random placement, "this story needs that clue" is not a dependency at all, and almost anything passes.
Every combination of stories meant to be playable together needs its own run.

### What a pass does not prove

- **That the clue supports the deduction.** The generator knows the player holds a clue, not whether it points to the
  answer. That needs a separate blind check, like the pipeline's leak check: can a reader given only those clues reach
  the answer?
- **That the finished story still matches the structure.** Filling in details can change what a question really needs.
  The finished case is exported, run through the generator again and compared with the structure it started from.
- **That it is fun.** The playthrough's spheres show how many questions are open at each stage, which is feedback on
  pacing for the author. The judgement is still the author's.

## What it needs beyond the existing plan

- **A shared world layer:** common entities, a common order of time and shared facts. A case deliberately stands alone
  today, so this is the largest change to the structure.
- **Arrival as a way of knowing something.** A fact appears today when its paragraph is read. A clue from another story
  appears when it arrives, but must not run ahead of the story it arrives in, so names may have to stay hidden until
  the reader reaches the right paragraph (see "Partial understanding" above).
- **The clue reaches the reader, not the protagonist.** A story's prose is fixed and cannot mention a clue that arrives
  at an unknown moment. It goes into the shared case files, which fits, since every chain already ends at the reader.
- **An authoring process.** The pipeline analyses existing text; this is the reverse, a world first and then stories,
  with fair play across all of them. This is likely the hardest part: the quality of the mysteries is what the whole
  thing depends on.

## Constraints

- **Only if recognised clues are added: a link cannot depend on how far another player has read.** Archipelago's logic
  knows items, not another player's position in their story. A player would have to be able to see another's questions
  whatever that player has read, so those labels would have to be safe to show.
- **Waiting on a slow reader.** Hints cannot help when what you need is in someone else's unread story.

## What to do now

Very little has to change in the existing plan. Two choices keep this possible:

- Keep the ids of a case namespaced, so that facts from different stories cannot collide.
- Model evidence items as tellings from the start, not as a special case.

## A first test

When the linking mechanic has settled: two tiny invented cases, like the `sealed-room` fixture, sharing one clue. That
exercises the shared layer, arrival in the shared case files and linking a received clue without a real story having to
be written.
