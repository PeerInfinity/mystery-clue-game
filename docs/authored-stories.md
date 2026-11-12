# Authored stories, case files and a pluggable spine

**Spoilers:** this page gives numbers from the data of "Silver Blaze" and "The Speckled Band", and names one question of
the second. "What the miniatures showed" gives away both miniatures.

**Status (2026-11-10): a direction set in discussion with the user. Of the experiments below, eight mechanic
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

Experiment 1, begun 2026-11-10. Eight miniatures are written, each an invented story of under 350 words with its world
model, its true path and its logic (`structure.json`, beside the case):

| Miniature | Mechanic | Size |
|---|---|---|
| `cases/miniatures/lamp-keepers-word` | A lying link in a chain: one witness's word reaches the narrator by two carriers, and one of them changed it. | 8 paragraphs, 24 facts, 3 accounts, 4 tellings, 2 questions, 7 observations (4 essential), 11 moves |
| `cases/miniatures/rent-box` | A contradiction among accepted statements, resolved by distrusting one. | 6 paragraphs, 23 facts, 3 accounts, 2 tellings, 2 questions, 7 observations (5 essential), 10 moves |
| `cases/miniatures/rent-box-papers` | The Rent Box with its clues as case files (sub-stories): a main story of five paragraphs, three papers delivered one by one, read in any order. | 5 + 2 + 2 + 2 paragraphs, 23 facts, 3 accounts, 2 tellings, 2 questions, 7 observations (5 essential), 11 moves |

| `cases/miniatures/last-ferry` | An alibi by the order of events: the suspect left before the thing was last seen, and had no way back. Told out of order, by relative times. | 6 paragraphs, 28 facts, 3 accounts, 2 tellings, 2 questions, 9 observations (6 essential), 11 moves |
| `cases/miniatures/stable-clock` | One event at two times: two honest witnesses time one shot by two clocks; the clash is on the timeline at once, the slow clock is found, and an alibi goes with the wrong time. | 7 paragraphs, 17 facts, 3 accounts, 2 tellings, 2 questions, 7 observations (6 essential), 12 moves |
| `cases/miniatures/will-in-the-bible` | A document's own properties: a will read as a paper of its own, whose date and the christening it speaks of are set against the parish register. | 5 + 3 paragraphs (main story, the will), 19 facts, 2 accounts, 1 telling, 2 questions, 9 observations (7 essential), 14 moves |
| `cases/miniatures/loose-board` | Who could have known: a theft that needed its thief to know the hiding-place (an action type of the case's own), told to one person, passed on by her without meaning to. | 6 paragraphs, 16 facts, 2 accounts, 1 telling, 1 question, 5 observations (all essential), 10 moves |
| `cases/miniatures/telegram-signed-m` | Two readings of one clue: a telegram signed M. reads as the wife's or the partner's, and what it shows depends on which is circled, until the alibi picks. | 7 + 3 paragraphs (main story, the telegram), 16 facts, 2 accounts, 1 telling, 2 questions, 7 observations (5 essential), 9 moves |
| `cases/miniatures/watchmans-clock` | Absence as evidence: a watchman's card punched every hour from twelve until five but three; "Something is missing here" puts the reader's own "no round at three" on the timeline, required by the gate and against his statement that he made every round. | 6 + 2 paragraphs (main story, the card), 22 facts, 3 accounts, 2 tellings, 2 questions, 8 observations (5 essential), 11 moves |
| `cases/miniatures/ring-on-the-bench` | A room and a route: every way in closed to a person, something that got through, the way it came, and a route only something small that climbs could take. | 9 paragraphs, 20 facts, 1 account, 1 question, 7 observations (5 essential), 17 moves |
| `cases/miniatures/cellar-door` | One reasoning move: a door locked and then open, so someone opened it between; what that act needed, set against each suspect. | 6 paragraphs, 19 facts, 2 accounts, 1 telling, 1 question, 6 observations (5 essential), 8 moves |
| `cases/miniatures/dinner-at-larch-house` | Two narrators: each certain of their own part of an evening, neither account answering alone. | 6 paragraphs, 16 facts, 2 accounts (one for each narrator), 1 question, 6 observations (4 essential), 6 moves |
| `cases/miniatures/grey-cloak` | A mistaken witness: what she saw is kept, her identification of it set aside, and the mistake is evidence. | 6 paragraphs, 17 facts, 3 accounts, 2 tellings, 1 question, 6 observations (all essential), 12 moves |
| `cases/miniatures/night-porters-statement` | An unreliable narrator: one of his statements is against the other narrator's own knowledge and is set aside; another is kept. | 6 paragraphs, 12 facts, 2 accounts (one for each narrator), 1 question, 4 observations (3 essential), 6 moves |

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

### The fifth and sixth of the list (2026-11-11): a room and a route, one reasoning move

Miniature 4 of the proposed list (linking observations, the answer accepted only on the evidence) was not written as
a case of its own: since the gate changed, every miniature is that. Neither of these two needed a change to the
engine or the page.

17. **The sealed-room fixture is not the published miniature.** The kickoff said to reuse it. Its mechanic and its
    data's shape are reused whole (`world/room.json`, the same facts of `closed_to`, `passed`, `passes`, `attached`,
    `near`, `reaches`, `fixed`), but its plot (something small comes through a grating and down a chain to a man) is
    the plot of The Speckled Band, and published beside that story it would give it away. The Ring on the Bench is
    a different story on the same mechanic; the fixture stays as the page checks' fixture.
18. **The room's moves are not evidence.** The marks on the ways-in table and "Something got through" are played on
    the true path, but nothing requires them: the gate looks only at observations, and an observation comes from
    facts or from the route. "No person could get in" is two essential observations from the door's and the
    window's facts, which repeat what the table already shows. The route is the one move of the room that an
    observation can require (`route_through`).
19. **Every clue of a room is the narrator's own look at it** (finding 5 again): a room cannot be delivered as case
    files unless a file can be "what the window is like".
20. **The alibi can be mechanical, and miniature 3's finding 13 has an answer.** In The Cellar Door the question's
    entry is a typed action (`act: [unlock, open]` of the door, over a `{from, to}` window). Circling a suspect
    makes it that one's act, and the question's detail lists what the act needed with what the timeline says of
    each: for the false suspect "has a key to the cellar door: nothing on the timeline says so" and "at the cellar
    door: the timeline has Ned Sharp at the loft over the stable"; for the right one, all three met. No move is
    needed for it, and nothing had to be built. Three limits: it shows only in the question's detail, not as a
    contradiction on the timeline; a need that is against the timeline is told only over a `{from, to}` window
    (over `{after, before}` it is "nothing says so"); and the generic action table knows doors, keys, giving,
    drugging, striking, hiding and little else, so "took the cup from the shelf" (miniature 3) would need an
    action type of its own in `world/actions.json`, or a generic `take` that needs its taker at the place.
21. **A reasoning move is not evidence either.** "It changed" (the door locked, then open: someone unlocked and
    opened it between) is on the true path and puts the act on the timeline, but the gate cannot ask for it, and
    the needs the page shows under a circled suspect are a view, not something the player links. The essential
    observations say the same thing again in words ("there are two keys, and Ned has neither"). So in both of
    these miniatures the mechanic's own moves are optional, and what passes the gate is linking.
22. **A key is a key by its wording.** A `carrying` fact meets "has a key to the door" if it has `key: <door>`, a
    field the format does not document, or if its value is text containing the word "key"; an entity id such as
    `jem_key` does not count. It must also start at the same time point as the question's window. The first try
    read "Jem Tully has something" until the key's phrase in `mentions.json` was moved to the paragraph that first
    tells of it.

23. **Two defects the room miniature found, both fixed 2026-11-11.** A link to the route was lost when the route
    grew: the route's entry is named after its nodes, so a route linked at two nodes and then extended kept a link
    to an entry that no longer existed, and its observation never filled. The link now stays with the route. And the
    hints said "read on" at a gate that would not open (every move of the path made, the evidence still short), on
    which the hints check looped without end, as it could not have before the gate asked for evidence. The hint now
    points at the gate's notice, and the check fails when "read on" does not move the reader. The cause in the data
    was a path whose room moves had no `for_q`, so the hints played them after the links; the path has it now.

## Mechanics to add, each with a miniature to show it

Proposed 2026-11-11 while the fifth and sixth miniatures were in their checks; the user: "I'll want to implement all
of these eventually." None is built and no order is ruled. The first group comes out of the findings above. The
session's suggestion for where to start: 2 (it closes the most visible gap in what has been played) and 5 (every
false statement so far is a deliberate lie, and the sincere mistake is the commoner device in detective fiction).

Close to what exists:

1. **The order of two events as something that can be doubted.** The order now lives in `times.json` (finding 14).
   "A happened before B" becomes an entry with a source, so it can be linked, distrusted and contradicted.
   *Miniature:* two witnesses saw the same two things (a shot, a carriage leaving) and give them in opposite orders;
   one stood where the sound arrives late.
2. **An alibi as a contradiction on the timeline.** The Cellar Door shows an act's needs only in the question's
   detail (finding 20). "Your answer needs Ned at the cellar door" goes on the timeline as part of the hypothesis,
   and clashes with "Ned in the loft" like any two places. *Miniature:* The Last Ferry, with an action of taking
   that needs its taker at the place.
3. **A document as a clue with properties of its own:** a date, a hand, where it was found, what it could not have
   known when written. *Miniature:* a will dated in March names a grandchild born in June.
4. **Who could have known?** The format has `knows`. A question answered by tracing who was told what: the culprit
   used something only three people had been told. *Miniature:* a burglar went straight to the one loose
   floorboard.

New, but small:

5. **A mistaken witness, not a lying one.** The statement is sincere and an inference in it is wrong: a coat was
   seen, not a face. The player keeps the observation and rejects the conclusion. *Miniature:* "I saw the doctor
   leave at nine" becomes "I saw the doctor's cloak leave at nine".
6. **Two readings of one clue.** Observations can already depend on another answer (`if`). A clue means one thing
   under one hypothesis and another under the other, and a later fact picks. *Miniature:* a telegram, "COME AT ONCE
   NOT SAFE".
7. **Absence as evidence.** Something that should be on the timeline and is not; needs the general negative the
   format lacks (finding 7). *Miniature:* a watchman's clock punched every hour but three.
8. **Means: what an act needed besides presence.** The action needs grow beyond keys and doors: strength, a skill,
   a tool, height. *Miniature:* the bundle is tied with a sailor's knot, and one of three suspects cannot tie it.

Larger:

9. **Two narrators.** The format allows more than one and no case uses it. The same evening told twice, each
   certain of their own part. *Miniature:* a husband's and a wife's accounts of a dinner; the theft is in the gap.
10. **A clue found only by asking.** The reader chooses which witnesses to question and reads only those
    paragraphs: the first step toward the pluggable spine, and the largest change to the page. *Miniature:* three
    neighbours, and time to question two.

Rulings and one more idea, 2026-11-11:

- **Idea 2, the alibi: ruled.** A circled answer to a question whose entry is a typed action puts that act's need
  of presence on the timeline with the circle, as part of the hypothesis, so it clashes with an entry that has the
  suspect elsewhere ("in two places at once?"), resolved by taking the circle off or distrusting the alibi's source.
  It counts only when the timeline has the suspect elsewhere for the whole of the act's window, not when it merely
  fails to place them at the scene. Taking a thing needs its taker at the place (the generic action table).
- **Idea 9, two narrators: a narrator's own statements must be doubtable** where a story has an unreliable
  narrator; a story without one works as now (a narrator's own observations certain, with no statement link).
  **Built 2026-11-11** (`alibis`, `engine/world.js`; `docs/case-format.md`, "Alibis"). The Cellar Door needed no
  change of data: circling the ostler raises "Ned Sharp: in two places at once? the carrier's man's word: Ned Sharp
  at the loft over the stable, against your hypothesis: Ned Sharp (it needs Ned Sharp at the cellar door)". The
  Last Ferry's question became a typed taking of the cup at the vestry; circling the carter raises two, one for
  each location of his alibi (on the ferry until eight, on the far bank after), so distrusting either piece lifts
  it. Two things to know. The window of the taking is the author's: it starts when the lamp is lit, which is the
  answer to the miniature's other question, so the alibi holds even for a player who has not accepted the
  lamplighter's sighting; until ¶3 the page shows that start as "a time not yet told". And an alibi's last
  location has to be given an end ("on the far bank until Monday morning"), which the ferryman did not say in so
  many words: it rests on there being no boat back.
- **Doubtable narrators: built 2026-11-11** as an option (`doubtable: true` on a narrator). The Dinner at Larch
  House has two reliable narrators who do not disagree; The Night Porter's Statement uses the option (below).

What the two-narrator, mistaken-witness and unreliable-narrator miniatures showed (2026-11-11):

24. **Two reliable narrators need nothing new.** Each fact has its chain through its own narrator, the grid by
    source has a column for each, and nothing in the format says which narrator a paragraph belongs to: the prose
    says it ("Clara Marlow's account."). With more than one narrator a side of a contradiction now names whose own
    word it is.
25. **A sincere mistake is expressible as it stands** (idea 5): the witness's account holds what she saw of "the
    figure at the side door" (an entity of its own) and her identification of it (`identity`, false), each with its
    statement link, so the one is kept and the other set aside; her telling, doubted, is evidence (`doubted`). The
    prose has to give the two apart ("I saw a figure… It was Dr. Mott… I knew him by his cloak").
26. **An identification does not carry whereabouts.** "The figure was Dr. Mott" and "the figure was at the side
    door at nine" do not put Dr. Mott at the side door, so his being three miles off raises no contradiction with
    her identification. The clash comes only from the player's own circle on "who was it?" against her pick.
    Contradictions compare one entity's states; an accepted identity could join two entities' locations.
27. **A doubtable narrator's false statement cannot be evidence.** A witness's lie leaves its telling on the
    timeline, which can be linked (`doubted`). A narrator's own statement has no telling: distrusted, it is gone,
    and nothing remains to link. The Night Porter's Statement's essentials therefore say nothing of his lie; the
    gate can be passed with it still believed, and the contradiction it makes left open.
28. **Marking one narrator doubtable shows on the page**: only his statements have "This statement itself". Here
    that is natural (his part is a statement written for the other); in a story where the reader should not know
    which narrator to doubt, every narrator would need the mark.

The two engine changes of 2026-11-11 (step 2 of the provisional order below):

29. **An identity now carries whereabouts** (finding 26 answered). An accepted identity, the story's or the player's
    circle on a question whose entry is one, joins the locations of the two it names: "the figure was Dr. Mott"
    against "Dr. Mott at the Squire's bedside" is a contradiction with three sides, the doctor's location, the
    identity and the figure's location (`via`), any of which lifts it when distrusted. In The Grey Cloak it appears
    at ¶3, the moment the alibi is read, and the true path's distrust of Mrs. Lunn's identification resolves it; no
    data changed. A circled wrong suspect of the same question now meets the same contradiction.
30. **An observation can come from the entry a move reveals**: `{reasoned: "changed", premises: [two states]}` (the
    entry of "It changed") or `{reasoned: "got_through", premises: [a crossing]}`. The Cellar Door now requires its
    move: "locked at ten and open at six: someone unlocked and opened it in the night" is essential, and the true
    path links the act "It changed" puts on the timeline. The hints find the move and the link without help.
31. **The Ring on the Bench cannot require "Something got through" as it stands.** The move is offered only while
    no way in that accounts for the crossing has been told: once the open pane is read (¶6), it is refused, so a
    reader who reads on past ¶5 without it could never fill an observation that needs it, and the gate would never
    open. The move is about a way nobody has found; once the way is found, the pane is the evidence. The choices
    were: leave it optional; offer the move after the way is found too; or let an observation accept either of two
    entries, the move's or the pane's. **Ruled by the user 2026-11-11: left optional.**

Case files as sub-stories, built on a new version of The Rent Box (experiment 3; 2026-11-11). The user's rulings on
the design laid out before it: a new case beside the original rather than a change to it; delivery built now, each
file delivered where the main story first mentions it; the rest as proposed (a reference `"rudd:2"` where a number
goes, the reading controls on the tab shown, a move's `at` a list).

32. **The Rent Box Papers.** A main story of five paragraphs (the box empty; "I went up to the Captain … I wrote it
    down"; "Mr. Fenn knocked at four … I wrote down what he told me too"; "I read the two over, and saw that one of my
    lodgers was telling me a thing that was not so. So I wrote down my own afternoon"; the give-away) and three
    papers of two paragraphs each, delivered at ¶2, ¶3 and ¶4. The facts, accounts and observations are the
    original's, only their paragraphs moved; the gate before ¶5 needs evidence from all three papers, so it makes the
    reader open them with no rule of its own. The original's "Fenn could not have been in Cable Street and in my
    yard" is gone: it joined two papers, and the page shows that contradiction by itself.
33. **The order of reading is the order paragraphs were read**, not the order papers were opened (a refinement of
    the agreed rule, with the same effect where a paper is read through at once): the save keeps the log of
    paragraphs read, and how far each story is read follows from it. It decides which mention of a name counts as
    first and how entries of one time point are sorted. It is never shown.
34. **What the code needed** (`engine/refs.js`): every comparison of paragraph numbers in the page, the names and
    labels (`engine/shown.js`), the reasoning entries (`engine/actions.js`), the validator and the checks goes through
    the reading or through "surely read first" (the validator: the same story and no later, or a main-story paragraph
    no later than the other's file is delivered). A case without files reads exactly as before. The true path plays
    in all twelve orders of reading the three papers (each with the main story first and last) and with each paper
    read whole; the autoplay and the hints (which now say which paper to read on in) reach the end.
35. **In this case the order of reading changes little.** The second question is raised, and the last paper
    delivered, at ¶4, so every move waits for ¶4 and all the reading of papers happens there. A case whose papers
    come early, with questions that can be settled one paper at a time, would test the orders harder.
36. **Two limits.** The path check's test that no reasoning move is possible before its paragraph runs only for a
    case without files (it compares single numbers). And a mention's `paras` range in `mentions.json` means little
    across stories; none of the miniatures needs one.
37. **Delivery is one rule among possible ones.** The page asks only whether a file has come (`delivered`: here, a
    paragraph of the main story read); delivery from outside (an Archipelago item, a clue found by asking) can answer
    the same question another way without touching the rest.
- **11. Doubting the author** (the user's idea, with the note that it may not be worth building): a way for the
  player to say that the story or its data is wrong, like a bug report. It would need somewhere for the reports to
  go, and the user does not want to set that up.

One event, two times (step 4 of the provisional order; outline A, 2026-11-11):

38. **"Happens once" is one field.** Facts that tell the same happening share an `event` id; two of them accepted at
    times that certainly do not meet are a contradiction ("One event, at two times?"), with no question tied to it.
    Without it the housemaid's "nine" and the gardener's "a quarter to nine" were two shots, and nothing clashed
    unless the facts asserted picks of a question, which would have made the question carry the clash instead of the
    timeline.
39. **The Stable Clock** (outline A as drafted; names and prose settled here): the clash appears at ¶4, when the
    gardener speaks and before anyone is accused; the hall clock set by the church (¶5) and the stable clock a
    quarter of an hour slow (¶6) settle it. The gardener is honest: his statement of the time is distrusted by its
    own statement link and linked as evidence (`doubted`), while what else he said (he looked at the stable clock)
    stays, as Mrs. Lunn's sighting did in The Grey Cloak. The second question (was Mr. Royle still in the library?)
    follows from the first, through the hall clock both times are told by.
40. **The two sides read alike.** On the timeline and in the contradiction both are "Someone: fires a shot …", told
    apart only by their time headings and their detail ("as the hall clock struck nine", "at a quarter to nine by
    the stable clock"). **The user's ruling: show the time directly.** Every side of a contradiction, in the list and
    in its trace, now ends with its time ("at Thursday, nine o'clock", "from … until …").

A document's own properties (step 5, outline B; 2026-11-11):

41. **The Will in the Bible** needs nothing new. The will is a paper of its own (a file, delivered at ¶2, where the
    nephew brings it), and its properties are facts of the document as an entity: its date, its bequest, the
    christening it speaks of, the hand it is in. "It speaks of a christening four months after its own date" is the
    timeline's order made visible by observations (`o.christened`, `o.dead`), as the outline expected: nothing on the
    timeline clashes, because a will that names a christening is no state of the christening.
42. **A clue the prose has to make airtight.** The outline's "it names a great-nephew born after its date" is not
    proof (a will can name a child expected); "whom I held at the font" is, since the christening is in the register.
    The testatrix is the answer the paper itself offers (her hand, her signature, her name), ruled out by her death
    before the christening; the housekeeper by her loss under the new will and her absence from the house.
43. **A check that assumed too much.** The hints check's run with mistakes distrusts a telling and expects the hints
    to undo it; here the only telling carries only what is false (the nephew's "found in the Bible"), so distrusting
    it is harmless and the hints rightly leave it. The check now picks a telling that carries something true.

Who could have known? (step 5, outline C; 2026-11-11):

44. **The Loose Board** needs an action type of its own and no engine change: `take_hidden` (`world/actions.json`)
    needs its taker to know the hiding-place (`{of: $agent, attr: knows, value: $about}`) and to be at the shop
    (`place: $where`). The question's entry is that act over the hour the shop was shut, so circling a suspect makes
    it that one's act, and the question's detail lists the needs: Dick "knows the hiding-place: nothing on the
    timeline says so"; Mr. Voss and Jane, met. The need to be at the shop does the rest: circling Dick (on his round
    at Hilltop) or Jane (beside the narrator at the funeral) is at once a contradiction, by the alibi rule.
45. **One page defect found and fixed:** a circled answer made into "that one's act" kept the entry's `thing`, `to`,
    `item`, `via` and `where`, but dropped `about`, so the need read "Dick knows" with nothing after it. Any question
    whose act has an `about` (asking about something, too) had the same gap.
46. **Knowledge passed on is not read from the tellings.** The outline hoped to read "who knows the hiding-place"
    from the provenance the other way: whoever is told an account knows what it carries. As built, the lodger's
    knowing is a fact of the sister's statement (implied: he was at the table when she read the letter out), and the
    narrator's letter to her sister is an action and a fact that she knows. Provenance runs toward the narrator, and
    a telling outward (the letter, the reading aloud) is no part of it. Deriving `knows` from tellings would be an
    engine change, for the user to decide on.
47. **The outline missed a suspect.** The sister knew, so she had to be ruled out: she was beside the narrator the
    whole hour. A chance thief ("something else") is ruled out by an observation against it: nothing else was
    touched.

The order of the remaining work (the user, 2026-11-11, asked whether to fix issues as they come or finish the first
versions first): defects are fixed as they are found; design changes are gathered and decided together once the
outlines have first versions, except where a story cannot be written without one (outline E's new move). Open for
that review so far: finding 46 (knowledge passed on by tellings), finding 35 (a case whose papers come early), finding
36 (the path check's test for moves made too early, off for cases with files).

Two readings of one clue (step 5, outline D; 2026-11-11):

48. **The Telegram Signed M.** needs nothing new. The telegram is a paper (delivered at ¶2, where the doctor copies
    it out); the same link of its words to "Who was waiting at the mill?" shows "read as Mrs. Holt's, … a meeting she
    meant to keep" or "read as Mr. Grove's, … he meant to keep", by which sender is circled (two observations with
    `if`), and only the second is essential. Sending a telegram is an action type of the case's own that needs its
    sender at the Leeds office, so circling Mrs. Holt is at once a contradiction with the fête she was at in the
    narrator's sight.
49. **A third reading the prose had to close.** Whose hand the telegram is in would have been another way to read
    it; the paper's own last line says the form is in the post office clerk's hand.

Absence as evidence (step 5, outline E; 2026-11-11). The user agreed the design before it was built: the story tells
the rule, the record points back to it, one button per gap, the reader's own entry as trusted as the least of what
it rests on, required by its rule and time, and a denial that clashes with what it denies.

50. **"Something is missing here"** (move m, `pointGap` in `engine/actions.js`). A rule carries `series: {attr,
    value, at: [times]}`; the record's entries carry `series: <rule>`. On the rule or a punch, the page offers one
    button per time the record on the timeline lacks; the entry it gives is the series' state denied at that time
    ("Abel Ward: no round made"), resting on the rule and on every entry of the record then on the timeline, so it
    is as trusted as the least of them, and it lapses if the record leaves the timeline or comes to have that time.
    An observation names it by `{reasoned: "missing", of: rule, at: time}`. The gate of "Who took the bale?" holds
    until that entry is linked (checked on the page: two of three essential observations, then all three).
51. **A denial against what it denies, for any attribute.** Until now only locations, typed states and identities
    clashed with their denials; now the same entity, attribute and value, asserted and denied at times that meet,
    is a contradiction ("Abel Ward: round made, and not?"). The watchman's statement ("every round, from twelve
    until five") meets the reader's own gap at once, so the lie shows up by itself; the path distrusts it.
52. **The outline's publican could not stay.** He put the watchman in his back room from a little before three until
    nearly four: an alibi for the very hour the gate was opened, which leaves no one to have taken the bale (the
    carter is in splints). The story drops him. An outline written in one pass needs its timeline checked as the
    structure is written, and the structure-first method caught it.
53. **The record as premises changes with the timeline.** Because the gap rests on whatever of the record is on the
    timeline, distrusting one punch makes another gap available (no round at two, if the two o'clock punch is
    doubted) instead of taking the first away; distrusting the whole card takes it away. That reads right, but it
    means the entry's premises are not fixed when the move is made, unlike the other moves; observations name it by
    rule and time for that reason.

- **The two Holmes cases are archived at `v2/`** (the user's proposal, 2026-11-11): Silver Blaze and The Speckled
  Band, the pipeline and the documents about them, with their own copy of the page, the engine and the checks, as
  they stood that day (every page check passing with the day's engine). The reason: every change for the short
  cases had to be re-checked against them, some forty minutes a run, and they are experiments the direction has
  moved on from. Whether to bring them forward to a later engine is to be decided later. The bare address is now a
  start page listing the short cases (`start.html`), and the two cases' old addresses go on to `v2/`. The page
  checks of all the short cases together take about two minutes (`npm run page-checks-all`).

## Rulings on the open findings, and case files as sub-stories (2026-11-11)

The user, asked which of the findings need a decision before the work is handed on:

- **Moves that the gate does not require are not a problem** (findings 18, 21): it is probably better that only
  some of the possible moves are necessary. One way to make a move necessary where an author wants it: a timeline
  entry that the move reveals is needed as evidence (an observation from the entry of "It changed", of "Something
  got through", as the route's already can be).
- **A contradiction that can be left open is not a problem** (finding 6 and the ruling under finding 10): it may be
  good that some contradictions do not touch the case's main questions, and there are already ways to make one
  matter (a `doubted` observation, an alibi).
- **A narrator's false statement that cannot be evidence is not a problem** (finding 27).
- **The order between two events as something to link and doubt** (finding 14, idea 1): wanted.
- **Case files become timeline entries by being read.** A case file is a side-story, or sub-story: the
  protagonist reads the file, with whatever is known of where it came from and any thoughts of the protagonist's
  about it. So a file has paragraphs of its own for its entries to cite, and the index of paragraphs has to take in
  the readings of files. This answers findings 4, 5 and 19 for the direction: what the narrator saw of a room, or
  where a paper was found, can be a file like any other, since a file is prose with a source.
- **The order of the work: no preference yet.** It may be decided provisionally or left open.

**The two-index design, ruled by the user 2026-11-11.** Every paragraph has two indexes: the story it belongs to
(the main story, or a sub-story), and its number within that story. Both are kept all the way through: in the data
(a fact's place, where a question is raised, where an answer becomes available), in the saves, and in what the
player sees ("the Captain's statement, ¶2"). An earlier sketch of this session's, numbering the whole afresh for each
playthrough by splicing a file in where the reader stood, is dropped: its numbers would have meant different things
in different playthroughs.

- **Read-to is per story.** The page keeps how far the reader has read in each story, and an entry is on the
  timeline when its paragraph is at or before that point in its own story. It does not depend on the order in which
  the sub-stories were opened, and a file can be read in part and returned to.
- **A reading order where one is needed** (which mention of a person comes first, how entries told at the same
  time are sorted): the order in which the sub-stories were opened, never shown as a number. (Agreed.)
- **Give-aways and gates are in the main story only**, at first: a file is evidence, and never ends the case.
  (Agreed.)
- The cost is broad and mechanical: every comparison of one paragraph number in the engine, the page, the
  validator and the checks becomes a lookup by story and number.

- **Nothing may assume when a file appears** (the user): an Archipelago item can arrive at any time, so a file
  cannot be tied to a paragraph of the main story that introduces it. The main story can say that papers will come;
  it cannot say which have.
- **Sub-stories are chosen by tabs in the Story panel** (the user), and the reader can switch tabs at any time; a
  file need not be finished once opened.

What else follows from sub-stories, as this session sees it (not ruled):

- The gate already asks for evidence, so it makes the reader open the files a question needs without a new rule:
  the story waits until the needed entries are on the timeline and linked. `structure.json`'s `needs` says which
  files those are, and would at last be read by something.
- A file's prose cannot depend on what was read before it. The protagonist's thoughts in a file are about that
  file alone ("the hand is hers"), never about how it bears on another ("so the Captain lied").
- The same mechanism serves "a clue found only by asking" (idea 10: the reader chooses which file to open and may
  not have time for all) and delivery by an Archipelago.
- A true path's move names what must have been read for it, by story and paragraph ("after the Captain's statement
  ¶2 and the main story ¶3"), which holds in any order of reading; the checks have to try more than one order.

**The order of events in doubt** (finding 14, idea 1). The user: two accounts that give different times for the same
event are already handled, by an entry on the timeline for each account, each of them doubtable; no new kind of
entry for "A before B" is wanted. This session agrees for nearly every case, and it covers The Last Ferry: the
ferryman's "we were in mid-river when the lamp was lit" is his fact that the carter was on the ferry at the time
point of the lamp, and distrusting him takes it off. Two things remain outside it. The engine does not know that
two entries are one event told twice, so "the shot at a quarter to nine" and "the shot at nine" raise no
contradiction by themselves (an action has no single value to clash on); marking an event as happening once, so
that two times for it clash, would be the small addition. And where a time point stands in `times.json` stays as it
is when its source is distrusted, which is harmless while its entries are gone.

## Outlines for the miniatures not yet written (2026-11-11)

Drafted by this session at the user's request, logic first: the question, the clues as units, what rules each
other answer out, and what the format needs. Names and prose are the next session's to settle. Each is six to
eight paragraphs, like the others.

**A. One event, two times (idea 1): "The Stable Clock".** A shot is heard at the Hall. The housemaid heard it as
the hall clock struck nine. The gardener, at the lodge, heard it at a quarter to nine by the stable clock. A guest
left the library, where he had sat with the narrator, at ten to nine.
- Questions: "When was the shot fired?" (a quarter to nine; nine) and "Was the guest still in the library when it
  was fired?" (yes; no). The second follows from the first.
- Clues: the housemaid's statement; the gardener's statement; the narrator's own evening in the library (the guest
  there until ten to nine by the hall clock, which the narrator set that morning by the church); the narrator's
  look at the stable clock next day (a quarter of an hour slow).
- Rules out a quarter to nine: the stable clock was slow, so the gardener's quarter to nine was nine. He is honest,
  and what he says is wrong as stated. So the guest has no alibi.
- Needs: two entries for one event at two times, each doubtable (expressible now); the small addition above, so
  that the two clash without the player's circle; nothing for "this clock is slow" beyond an observation.

**B. A document's own properties (idea 3): "The Will in the Bible".** A will found in the family Bible leaves all
to a nephew and is dated the third of March. It names "my great-nephew Thomas". The testatrix died on the second
of May. Thomas was born on the fourteenth of June.
- Questions: "Was the will written on the day it is dated?" (yes; no) and "Who wrote it?" (the testatrix; the
  nephew; the housekeeper, who gains by the earlier will).
- Clues: the will itself (its date, its bequest, the name in it), a file; the parish register, read by the narrator
  (the death, the birth); the earlier will at the solicitor's (the housekeeper gains); who had the Bible after May
  (the nephew, as executor).
- Rules out "as dated" and the testatrix: it names a child born after its date and after her death. Rules out the
  housekeeper: the new will takes her legacy away, and she did not hold the Bible.
- Needs: a document as an entity with facts of its own (dated, names, found where). The clash "it names someone not
  yet born" is the timeline's order made visible, and is not automatic: a thing mentioned before it exists has no
  form. An observation carries it.

**C. Who could have known? (idea 4): "The Loose Board".** A shopkeeper hides her cash-box under a loose board. A
thief goes straight to it and disturbs nothing else. She told one person, her sister, in a letter.
- Question: "Who took the cash-box?" (the errand boy, who was in and out of the shop all week; the sister's lodger).
- Clues: the state of the shop (nothing else touched: the thief knew the place); the shopkeeper's letter to her
  sister (the only telling of it); the sister's statement (she read the letter aloud at her breakfast table, the
  lodger there); the delivery book (the errand boy out on his round that hour, signed for at three houses).
- Rules out the errand boy: he was never told and was elsewhere. Rules out a chance thief: nothing else was touched.
- Needs: the hiding-place as an account passed on by tellings, which is the provenance the format already has,
  read the other way: who holds the account. A taking that needs its taker to know the place (an action type with a
  need of `knows`), so that a circled suspect shows "knows the hiding-place: nothing on the timeline says so".

**D. Two readings of one clue (idea 6): "The Telegram Signed M."** A mill-owner went to his mill at night and was
struck down there. In his pocket is a telegram, handed in at Leeds at four that afternoon: "Come to the mill at
ten. M." His wife is Mary; his partner is Martin.
- Questions: "Who sent the telegram?" (Mary; Martin) and "Who was waiting at the mill?" (the same two).
- Clues: the telegram (a file: its words, its office, its hour); the narrator's own afternoon (Mary opened the
  church fête at three and gave the prizes at five, in the village); the partner's clerk (Martin took the two
  o'clock train to Leeds); the mill's night book (one key drawn that evening, the partner's).
- The telegram reads two ways until a third fact picks: with Mary circled it puts her in Leeds at four, against the
  fête; with Martin circled it agrees with the train. An observation with `if` for each reading.
- Rules out Mary: she was in the village at four, in the narrator's sight.
- Needs: `if` on observations (exists), and the alibi (exists) if sending the telegram is a typed act that needs its
  sender at the office.

**E. Absence as evidence (idea 7): "The Watchman's Clock".** A warehouse's night watchman carries a tell-tale
clock and must punch it at a station each hour. A bale of silk is gone in the morning. The card is punched at
twelve, one, two, four and five.
- Questions: "When was the bale taken?" (before two; between two and four; after four) and "Who took it?" (the
  watchman; the carter, who has a yard key).
- Clues: the card (a file); the watchman's statement (he made every round and saw nothing); the constable on the
  beat (he tried the yard gate at half past two and found it fast, and at half past three found it on the latch);
  the publican (the watchman drank in his back room from a little before three until nearly four); the carter's
  wife and lodger (the carter at home in bed with a broken ankle that week).
- Rules out the carter: his ankle. Rules out the other hours: the gate, and the rounds that were made. The
  watchman's statement is false in one thing, the round at three.
- Needs: a move for a gap in a regular series ("something is missing here": punches at twelve, one, two, four and
  five, and none at three), which puts "no round at three" on the timeline as the reader's own entry. That entry
  is then evidence, the user's way of making a move necessary. The general negative of finding 7 is not needed
  for this one: the absence is inferred from a series, not stated.

**F. Means (idea 8): "The Sailor's Knot".** The stolen plate is found in the shrubbery, bundled in a tablecloth and
tied with a knot that only a seaman ties. Three people were in the house.
- Question: "Who tied the bundle?" (a sailor home on leave, the cook's brother; the groom; the parlourmaid).
- Clues: the bundle (the knot, drawn and named by the narrator, who served at sea); the landlord of the inn (the
  sailor sat in his taproom from seven until closing); the groom's discharge book, found in his box (four years in
  the fishing fleet as a boy); the parlourmaid, asked to tie up a parcel in front of the narrator (a granny knot).
- Rules out the sailor: elsewhere all evening (the alibi). Rules out the parlourmaid: she cannot tie it.
- Needs: an action type of the case's own (`world/actions.json`: tying the bundle needs its agent at the place and
  knowing the knot), so that a circled suspect shows each need against the timeline. No engine change is expected:
  a need that is any other state is met by an entry saying so.

A provisional order, this session's suggestion (the user has not ruled):

1. The guide speaks of "the narrator", not Watson (the user wants this). Done 2026-11-11.
2. Two contained engine changes: an identification carries whereabouts (finding 26); an observation can come from
   an entry a move reveals. Done 2026-11-11 (findings 29 to 31).
3. Sub-stories, on one existing miniature first (The Rent Box: the two statements and the narrator's afternoon as
   three files and a short spine). This is experiment 3 of the list above and the largest piece. Done 2026-11-11 (findings 32 to 37), as a new case, The Rent Box Papers.
4. The order of two events as an entry that can be doubted, with its miniature (idea 1). Done 2026-11-11 as "one event, two times" (the user's ruling under finding 14: each telling an entry of its own; the small addition is `event`), findings 38 to 40, The Stable Clock.
5. The remaining mechanics, each with its miniature: a document's own properties, who could have known, two
   readings of one clue, absence as evidence, means (ideas 3, 4, 6, 7, 8). B to E done 2026-11-11 (findings 41 to
   53: The Will in the Bible, The Loose Board, The Telegram Signed M., The Watchman's Clock).
6. Blind solvers on the miniatures (experiment 2); it costs money and needs the user's go-ahead.
7. A story of 20 to 30 questions.

### On whether a miniature is any fun (experiment 2, before the user has played)

Each is about two minutes: read five to eight paragraphs, then make every move at the last paragraph before the end,
when the deciding clue arrives. More than half the moves are links (7 of 11, and 5 of 10). In the first, the reader can
do nothing useful between meeting the contradiction and finding the paper except distrust a side on a guess.

## What the game needs from the concept library

- A case names its people, places and objects as concepts, so that the same logic can be given another theme.
- A concept can be used both in a file's text and as something a substrate can place and draw.
