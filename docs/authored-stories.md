# Authored stories, case files and a pluggable spine

**Spoilers:** this page gives numbers from the data of "Silver Blaze" and "The Speckled Band", and names one question of
the second.

**Status (2026-11-10): a direction set in discussion with the user. Nothing here is built.** It changes parts of
`docs/archipelago-plan.md` and `docs/interconnected-world.md`; what it supersedes is listed below and noted at the top
of each.

## The direction

- **The two existing cases are experiments.** Silver Blaze and The Speckled Band were for bootstrapping the engine and
  the data format. The plan is new stories written for this system, not adaptations of existing ones. Existing stories
  may still give ideas.
- **A clue's origin does not matter.** Information appears in the case files, and the system does not depend on where
  it came from: the player's own story, another player's story, or another game.
- **The spine need not be linear prose.** Prose read a paragraph at a time was the simplest option. The eventual aim is
  a procedurally generated world as the spine, possibly combining several of Archipelago-CC's substrates, with the
  player finding the clues by exploring it. The existing substrates may not fit; new ones, or new features on existing
  ones, may come later.
- **Themes and characters from libraries.** Archipelago-CC's concept library and art library are to be extended so that
  a substrate can load a set of content that changes its theme or introduces specific characters. That work is planned
  in Archipelago-CC, not here.
- **Time loops.** Archipelago-CC's Loops system could make time loops in the narrative convenient.

## The case file as the unit

A case file is one authored clue: a statement, a report, a letter, an observation. It carries its own chain of who says
it and how they know, so trust, provenance and contradictions work as they do now. Where it was found is not part of it.

This makes three things one mechanism: randomising a single story, sharing clues between two stories, and playing in a
multiworld with other games. It also removes the hardest problem in `docs/interconnected-world.md`, a clue arriving
ahead of the prose, because the prose no longer carries clues.

**A case does not know its spine.** A case is its files, its questions and what each question needs. The spine delivers
files and shows questions, and is pluggable: linear prose, a shuffled delivery, later a substrate.

**The rule this puts on a prose spine.** The fixed prose holds only what is always available: the protagonist's own
observations and the questions. Everything that can be randomised is a file. Prose after a gate may assume the answers
solved before it, but not which evidence proved them.

**The mystery as a layer.** With a substrate as the spine, the substrate's locations hold the clues, and the mystery
layer says only what each question needs. Solving a question can open something in the world, as a gate opens the next
part of the prose. This is a change from a standalone world whose locations are the questions; which of the two, or
both, is open.

**The shared world becomes optional.** Common entities and a common order of time are needed only for contradictions
that cross stories.

## What is already known to change

Measured on the two cases, at commit `2bdf036`:

- **The pipeline runs the wrong way round.** It extracts data from prose, at about $150 a story. For an authored story
  the data comes first and the prose is written from it. The checks keep their value (the validator, the leak check,
  the path check, the page checks). The extraction steps become an audit: a blind reading of the finished prose,
  compared with the authored data, shows whether the prose says what the data says.
- **Required evidence is authored for every question.** The Speckled Band's 103 observations hold 6 essentials, all on
  one question (what came through the ventilator). Under the plan's rule every other gated question would need no items.
- **The item is an authored clue, not an account.** The Speckled Band's 1,500 facts divide into 964 in Watson's own
  account, 342 in the lady's and 131 in the other fourteen together.
- **Answers follow from the evidence.** 26 of Silver Blaze's 27 gated answers are marked `likely`. An authored story
  can be held to a stricter rule: the required evidence rules out every other listed answer.
- **Give-aways can go.** Reading stops at a give-away because the detective reveals the answer there. An authored story
  need not reveal anything: the next part opens when the question is solved.
- **Far fewer facts.** The sorting steps (6b, 9d) exist to cut noise out of extracted data. An author writes what
  matters, and the false trails on purpose.

Still needed as planned: "any of these" between facts, hints that make links, namespaced ids.

## What this supersedes

- In `docs/archipelago-plan.md`: accounts as the default item, reading stopping at each give-away, the story panel's
  marks for a missing account, and the work listed for Silver Blaze (its `observations.json`, the audit of
  `also_right`). The structure format and its validator, the answer rule ("solved"), the logic's shape and the bridge
  stand.
- In `docs/interconnected-world.md`: partial understanding by blanking and "arrival as a way of knowing something" are
  no longer needed for a clue to be safe, since a file is complete in itself. The shared case files, the two kinds of
  connection and "How a story is written" stand.

## Experiments, in order

1. **Mechanic miniatures.** One tiny invented case per mechanic, like the `sealed-room` fixture, each with just enough
   content to show that mechanic: a lying link in a chain, a contradiction, an alibi by the order of events, a room and
   a route, linking with "any of these", one reasoning move. Written logic first, so they also try the authoring process
   at small scale. They can serve later as engine fixtures and as a tutorial. The first ones are written by a Claude
   session; blind tests come once the basic structure works.
2. **Is a miniature fun?** The user plays them, and a blind model tries to solve each from the page alone. Every
   mechanic was shaped on two Holmes stories and none has been tried on authored material.
3. **One miniature as case files, delivered in a shuffled order** that respects the logic. No Archipelago is needed.
   It tests whether a spine with files reads well, and what waiting for a missing file is like.
4. **The structure format, its world and the validator** (`docs/archipelago-plan.md`), which can run alongside, with
   the miniatures' structures as its first inputs.
5. **A story of 20 to 30 questions**, for real randomisation.
6. **Two stories** sharing a pool of files.
7. **A substrate as the spine**, once the concept library can say what content a substrate has to work with.

## What the game needs from the concept library

- A case names its people, places and objects as concepts, so that the same logic can be given another theme.
- A concept can be used both in a file's text and as something a substrate can place and draw.
