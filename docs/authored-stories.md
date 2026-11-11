# Authored stories, case files and a pluggable spine

**Spoilers:** this page gives numbers from the data of "Silver Blaze" and "The Speckled Band", and names one question of
the second. "What the miniatures showed" gives away both miniatures.

**Status (2026-11-10): a direction set in discussion with the user. Of the experiments below, the first three mechanic
miniatures are written (`cases/miniatures/`); nothing else is built.** It changes parts of
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

## What the miniatures showed

Experiment 1, begun 2026-11-10. Three miniatures are written, each an invented story of under 350 words with its world
model, its true path and its logic (`structure.json`, beside the case):

| Miniature | Mechanic | Size |
|---|---|---|
| `cases/miniatures/lamp-keepers-word` | A lying link in a chain: one witness's word reaches the narrator by two carriers, and one of them changed it. | 8 paragraphs, 24 facts, 3 accounts, 4 tellings, 2 questions, 7 observations (4 essential), 11 moves |
| `cases/miniatures/rent-box` | A contradiction among accepted statements, resolved by distrusting one. | 6 paragraphs, 23 facts, 3 accounts, 2 tellings, 2 questions, 7 observations (5 essential), 10 moves |

| `cases/miniatures/last-ferry` | An alibi by the order of events: the suspect left before the thing was last seen, and had no way back. Told out of order, by relative times. | 6 paragraphs, 28 facts, 3 accounts, 2 tellings, 2 questions, 9 observations (6 essential), 11 moves |

Played at `?case=cases/miniatures/<name>`. `npm test` validates them and checks each `structure.json` against its
world model.

**The user's reaction (2026-11-10), after playing both:** "This is basically what I had in mind for the miniatures."
Ruled: they stay in `cases/miniatures/`, are published (`scripts/build-site.js` collects them) and are linked from the
README, since new players are likely to want to start with them; the issues found in these two are to be fixed before
any more are written. The two page defects (8 and 12 below) were fixed the same day; the rest are design questions,
still open.

**What worked with no change to the engine or the page.** Both were written by hand in the existing format, validated
and played their true path at the first attempt, and pass every check (`npm test`, the validator, the path check, the
autoplay in each layout and on a phone, the hints from a fresh page, from mistakes and from below the line, and
`CASE=<dir> npm run page-checks`). The page shows what each mechanic needs: two chains from one witness with different
carriers, each link with its own trust; a cap on the shared witness taking both sides off; one statement link taking
off everything a claim asserts.

**How they were written.** The logic first: the questions, the clues, which clues each question needs and what rules
out each other answer. Then the prose, one clue to a paragraph, then the data. The structure file was written down
after the data passed, from the logic already fixed, so it has not yet been tried as an input that something reads.
Its shape is the sketch in `docs/archipelago-plan.md` with four additions that authoring needed: `frame` (what the
narrator's prose always carries), a clue's `source` and `says`, the `facts` that realise it, and `rules_out` on a
question (which clue removes which other answer).

### What the format, the engine or the page could not express

1. **Where a chain went wrong is not data.** Provenance is the chain as claimed. For the carrier's false version to
   show a chain through the witness, the data has to say that the witness passed that version on: an account whose
   origin is the witness, and a telling from the witness that never happened as recorded. Writing the truth (the
   carrier as origin) would show the answer on the page. So nothing checks which link the player distrusts: the
   statement, either telling, the carrier, or the true side all clear the contradiction alike. "Who changed it" had to
   be an ordinary question with observations.
2. **A false statement, once distrusted, cannot be evidence of the lie.** It leaves the timeline, and an observation
   empties when an entry of it leaves. A telling cannot be linked at all. So the carrier's telling is in the data three
   times: the telling, the false fact it carried, and the speech as an event the narrator heard (`says`), which is the
   one that stays and can be linked.
   **Fixed 2026-11-10, ruled by the user:** a telling can be linked to a question like any entry. No reason against it
   was on record; tellings had been treated as plumbing. That it was said stands whatever becomes of what it carried
   (a telling the narrator witnessed is as certain as the narration), so it stays as evidence after its link is
   distrusted. The duplicate speech entry is gone from the first miniature, and both miniatures' "it was X who said
   it" observations rest on the telling. A telling the narrator did not witness is linkable too, as an uncertain
   entry; it still cannot be doubted on its own.
3. **The hints take a distrust that is not on the true path for a mistake**, and advise setting it back, although in
   the first miniature several are equally right. Tried on the page: with the telling from the witness to the carrier
   distrusted in place of the path's choice, the hint is "Set it back to uncertain".
   **Fixed 2026-11-10, ruled by the user (any valid option is accepted):** a distrust that keeps only false things
   off the timeline is no mistake, whichever link or person it is, and a distrust of the path counts as made once it
   would take nothing more off. Distrusting the true side is still called a mistake.
4. **Where a clue was found can be the evidence.** The paper proves what the carrier was given because it lay in her
   basket. A case file is meant to be complete without where it was found. The structure keeps this as a clue of its
   own (`c.paper_found`), which is the narrator's observation and tied to the spine.
5. **Strict evidence came out as the narrator's own.** Every link from anyone else starts uncertain and can never be
   certain, so evidence that rules an answer out, and does not merely make it unlikely, was each time something the
   narrator saw or read: the paper, the doors. In the second miniature four of the six clues are the narrator's own
   afternoon, which the rule for a prose spine would make fixed prose and not files, leaving only the two statements
   to deliver. Either the answer rule accepts trusted evidence, or the strict clues are documents and things, or most
   of a strict case is not randomisable.
6. **Reasoning by contradiction is not in the required evidence.** "Which lodger told a thing that was not so" needs
   both statements and the door; its one essential observation is the door, because the statements take part through
   the automatic contradiction and not through a link. The structure's `needs` and the world model's essentials
   therefore differ for that question, and an export of essentials alone would miss two clues. The page also does not
   tie the two together: the question can be answered with the false statement still trusted.
   **Fixed 2026-11-10, ruled by the user (a lie is evidence):** an observation can come from `{doubted: <telling or
   claim>}`: the statement linked to the question, and no longer believed (what it carried that is false is off the
   timeline). Both miniatures' "who said it" observations are now of this kind and essential, so with the new gate the
   question cannot be passed with the lie still trusted. Still true: a `needs` clue that acts only by contradicting
   (the other lodger's statement) is in no essential observation.
7. **Elimination is prose.** "Nobody came in, one lodger was out, so only the other could reach the box" is four
   essential observations whose `says` carry the argument. The engine checks none of it. A general negative has no
   form: "the back door did not open" is written as a typed state (`door: shut` over the two hours) so that it clashes
   with a claim that it was open; "nobody came in" could not be written at all. Only a location can be denied, and a
   fact cannot deny a question's possibility.
8. **What a claim asserts about another time is shown in the wrong place** (a page defect). With `asserts` on a
   speech, the contradiction is headed by the speaker and reads "Captain Rudd: two identities?" where it is Mr. Fenn in
   two places (`clashTitle` in `ui/world.js` takes the speech's subject and attribute), each side shows the whole
   speech, and the asserted states sit under the speech at three o'clock, so nothing appears on the timeline at half
   past two. Writing the content as facts of their own (`claim`) would place and head them rightly, but each then has
   its own statement link, and one lie would take two distrusts.
   **Fixed 2026-11-10, in part:** the contradiction is now headed by what the claim asserts ("Mr. Fenn: in two places
   at once?") and each side reads "Captain Rudd says: Mr. Fenn at the yard".
   **Ruled by the user 2026-11-10, and the miniature rewritten:** a statement is on the timeline when it is made,
   what it asserts is on the timeline when it is said to have happened, and the asserted facts are grouped in an
   account that can be doubted as a group or one by one. The format already had this, and the note above ("one lie
   would take two distrusts") was wrong: each lodger's statement is now an account of his own (`acct.rudd_saw`,
   origin the lodger) with a telling to the narrator. The telling is the row at three o'clock, the two facts are rows
   at half past two, the telling's link takes off both, and each fact's own statement link takes off one. No engine
   or page change was needed. What was lost, and then fixed the same day: a telling could not be linked to a
   question (finding 2), and a side of the contradiction did not name whose word it is; it now reads "Captain Rudd's
   word: Mr. Fenn at the yard", for any fact that reached the narrator from someone else.
9. **The prose has to carry more than the frame.** A question needs a quote where it is raised and each proposed
   answer a quote where it becomes available, so the narrator states the contradiction and names the candidates. An
   answer is judged only where the story gives it away, so each miniature ends on a confession, although an authored
   story was meant not to need one.
10. **The gate still takes any answer** ("Any answer will do"), and the essentials are reported only after the
    give-away. This is the planned answer rule (`docs/archipelago-plan.md`, "Solving a question"); both miniatures now
    have the data to try it on.
    **Changed 2026-11-10, ruled by the user:** by default the story goes on past a give-away only when a question
    that has essential observations has them all filled and a right answer circled. The notice counts the evidence
    linked and judges the answer only once all of it is, so circling each answer in turn tells nothing until the
    evidence is shown. A question with no essential observations takes any one answer, as before: Silver Blaze has
    no observations, and The Speckled Band has essentials on one gated question of 49. Settings, "To read past an
    answer", keeps the old rule ("commit to any answer"); whether that setting stays is undecided.

    The user also wanted contradictions resolved before the story moves on. Measured on the true paths, a
    contradiction is open when the reader goes to the next paragraph 11 times in Silver Blaze, 56 in The Speckled
    Band, 3 in the first miniature and 2 in the second (the lodgers contradict each other at ¶3, and the door that
    settles it is told at ¶5). **Ruled by the user:** not every paragraph. A contradiction has to be resolved only
    where it is tied to the question being answered, which is what a `{doubted: …}` essential observation does: the
    question cannot be passed while the lie stands. Where a case has no such data (both Holmes cases), contradictions
    work as before.

    On most moves falling at the end, the user: not a problem; if it becomes one, stories can be set up with more
    parts that require moves.
11. **The order of telling is part of the puzzle.** In the second miniature the narrator knew about her doors from
    the start, and the contradiction between the lodgers stands open for two paragraphs only because she tells it
    late. If a protagonist's own observations are always available, that order is lost.

12. **A chain shows a telling the story has not told yet** (a leak in the page). The first miniature was first
    designed with the paper as a third chain for the true version: a telling by letter from the witness to the
    narrator, told at ¶7. On a trial copy the detail of that fact at ¶4 already lists "Marta Quill → letter → Hale".
    Chains are derived from every telling in the data, whatever paragraph tells it. The miniature avoids it (what the
    paper says is the narrator's own observation, a fact of its own), so the same event cannot gain a chain as the
    story goes on.
    **Fixed 2026-11-10:** the page keeps only the chains whose tellings the story has told by the paragraph read to
    (`toldChains` in `ui/world.js`), for display and for trust alike, so a later telling no longer holds a fact up
    before it is told. The Holmes cases had it: in The Speckled Band 400 facts listed tellings of later paragraphs
    (one account told in many pieces), in Silver Blaze 12. Where every chain of a fact runs through a telling dated
    after the fact (60 facts of Silver Blaze: a recital's telling is dated at ¶17 and carries facts from ¶12), the
    chains are kept as they are.

Smaller things: a "who" question offers the narrator herself and the constable under "More"; `how` on a telling has no
word for a note or a slate ("statement" was used); a typed door state brings the reasoning mark and the move "It
changed" onto entries where the miniature has no use for them.

### The third miniature (2026-11-11): an alibi by the order of events

Written after the fixes above, and it needed no change to the engine or the page. What it showed:

13. **The timeline shows the order; nothing reasons from it.** The page does what the mechanic needs for the eye: the
    events are told out of order (nine o'clock in ¶1, the lighting of the lamp in ¶3, the ferry's casting off in ¶4),
    and at ¶4 the casting off takes its place above the lamp, with the suspect "at the ferry until eight o'clock"
    across the moment the cup was last seen. But the alibi itself is observation text. A circled culprit asserts
    nothing about where he was, so "Bell took it" and "Bell was in mid-river" raise no contradiction, and the
    question's entry (an action by someone, between two points) is not compared with anyone's whereabouts. Silver
    Blaze has a form for this (a typed action with `where`, so a circled striker must be at the place of the deed);
    it was not tried here, to keep to one mechanic, and it reports "nothing on the timeline says so", not an alibi.
14. **The order between two events is not an entry.** That the ferry cast off before the lamp was lit is one
    sentence of the ferryman's ("We were in mid-river when I saw the gate lamp kindled") and lives in `times.json` as
    `after`. It cannot be linked as evidence or distrusted: the player links the suspect's stay on the ferry, whose
    detail repeats the sentence. If the ferryman were lying about the order, distrusting his telling would take his
    facts off but leave the time points in the order he gave.
15. **A question can ask about order**, with answers that are not entities ("before the lamp was lit", "after").
    It gave the miniature moves at ¶3, two paragraphs before the rest, so not every move falls at the end.
16. **Witnesses' evidence passes the new gate while merely uncertain.** The lamplighter's and the ferryman's facts
    are essential and never more than uncertain (finding 5); the gate asks only that they are on the timeline and
    linked. A player who distrusts the ferryman cannot pass, and is not told why beyond the count of evidence.

### On whether a miniature is any fun (experiment 2, before the user has played)

Each is about two minutes: read five to eight paragraphs, then make every move at the last paragraph before the end,
when the deciding clue arrives. More than half the moves are links (7 of 11, and 5 of 10). In the first, the reader can
do nothing useful between meeting the contradiction and finding the paper except distrust a side on a guess.

## What the game needs from the concept library

- A case names its people, places and objects as concepts, so that the same logic can be given another theme.
- A concept can be used both in a file's text and as something a substrate can place and draw.
