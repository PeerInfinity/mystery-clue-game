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
| `cases/miniatures/sailors-knot` | Means: tying the bundle is an action type of the case's own that needs its agent at the house and knowing a seaman's knot; circled, the sailor's place is an alibi contradiction, the parlourmaid's knowledge is against her, the groom's both met. | 7 paragraphs, 19 facts, 2 accounts, 1 telling, 1 question, 6 observations (4 essential), 7 moves |
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
36 (the path check's test for moves made too early, off for cases with files); and from E and F, findings 53, 55
and 56. All decided 2026-11-14 (below, before "Means").

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

The design review of the first versions (2026-11-14). The user agreed every recommendation and left the order open:

- Finding 36: the path check's test for moves made too early now runs for cases with files too. A circle is early
  when what the data needs (each story read to, a paper's delivery counted) is no more than its `at` and less
  somewhere; a reasoning move is tried before each paragraph read toward its `at`. Shown to catch both kinds on a
  doctored path of The Watchman's Clock (the reasoning move only in the order that opens the card first, which the
  page checks run).
- Findings 55 and 56: every need of a circled act can now clash. A need of any other state is a contradiction with
  an accepted state that denies it while it holds (Ellen circled: "Ellen: knows the carrick bend, and not?"), and a
  need a contradiction sets against the timeline (an alibi among them) says so in the question's list of needs
  ("against: the timeline has Tom Pike at the Bell (a contradiction)") instead of "nothing on the timeline says so".
- Finding 46 (knowledge passed on by tellings): left as it is; facts written by hand served in C. Taken up again if
  the long story needs it.
- Finding 35 (a case whose papers come early): folded into the story of 20 to 30 questions, not a miniature of its own.
- Finding 53 (the gap's premises follow the record on the timeline): kept as built.

Means (step 5, outline F; 2026-11-11):

54. **The Sailor's Knot** needs an action type of its own (`tie_bundle`: knowing the knot, and being at Fernleigh,
    from nine until half past ten) and one small engine change, the rule of finding 51 carried over to needs: a need
    of any other state (`requirementStatus`) is now *against* an entry that denies it, where before it said "nothing
    on the timeline says so". Circled, the parlourmaid's need reads "the timeline has Ellen does not know the carrick
    bend"; the sailor's place gives the alibi contradiction; the groom's two needs are met (checked on the page).
55. **A knowledge need that fails raises no contradiction**, only "against" in the question's detail: alibis come
    from place needs alone. Whether every need of a circled act should be an assertion that can clash (her "knows"
    against her "does not know") is for the design review; the gate does not need it here, since the observation
    against her is essential.
56. **Two wordings for one alibi.** Circling the sailor lists the contradiction "in two places at once?", while the
    question's own needs say "nothing on the timeline says so (it has Tom Pike at the Bell)". Both are right (a
    place elsewhere at one moment does not by itself deny the need), but side by side they read oddly. For the
    review.

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
   readings of one clue, absence as evidence, means (ideas 3, 4, 6, 7, 8). Done 2026-11-11 (findings 41 to 56:
   The Will in the Bible, The Loose Board, The Telegram Signed M., The Watchman's Clock, The Sailor's Knot).
6. Blind solvers on the miniatures (experiment 2); it costs money and needs the user's go-ahead. Done 2026-11-14
   (findings 57 to 74): Haiku solved 14 of the 15 cases, Sonnet The Stable Clock.
7. A story of 20 to 30 questions. Design agreed 2026-11-14, to be built in a new session (Fable, at the user's
   choice): papers are earned by solving questions, in an order drawn at random for each playthrough within what the
   logic allows (a local simulation of the Archipelago plan: locations are solved questions, items are papers; a
   seed to replay; the page checks over several seeds); a short main story of the narrator's own observations and
   the questions, and some twenty papers; some twenty small questions, each one of the mechanics the miniatures
   show, a few larger ones that need them, and one final question; the premise a fire at the customs house of a
   small harbour town (a ledger, a ship's log, the tide table, the night watch). Order: the logic first
   (`structure.json`), shown to the user before anything else; then the delivery mechanism, its design laid out
   first; then the prose and data; then a blind run. It takes in finding 35 and, if needed, finding 46.

### The long story's logic (step 7.1, 2026-11-14; awaiting the user's review)

`cases/custom-house-fire/structure.json` is the logic of the story of step 7, written before anything else: the truth
in eight sentences, 14 frame entries (the narrator's own observations), 24 papers carrying 41 clues, and 25 questions
in three layers (17 small, 7 that need others solved first, the goal). `node scripts/structure-check.mjs <dir> [seeds]`
checks it: references, something against every listed wrong answer, every paper needed, no loop, every question
reachable, and a forward fill of the papers on the questions for each seed, played to the end. The format gained
`papers`, a clue's `paper`, a question's `requires` (the layers) and `raised` (the main story, or the paper whose
reading raises the question), and `delivery.start`.

75. **One paper to a question cannot work.** With 24 papers on 24 questions no placement at all can be played: the
    question solved last holds a paper, and every paper is needed by some question. There must be fewer papers to
    earn than questions, so some solutions give nothing (or a filler), or papers are in hand from the start. The
    structure starts with four (the Board's letter, the Collector's statement, the two printed tables) and earns
    twenty on 24 questions.
76. **The order is narrower than hoped.** Over 5,000 seeds every placement drawn plays to the end, but a player has on
    average two questions to choose from (three at the start), and on ten of the 25 steps only one. Wider play needs
    more papers at the start, fewer papers per question, or fewer `requires`.

The user's rulings on the logic (2026-11-14): good for a first full-size case; questions that give nothing are
acceptable; raising questions inside papers is acceptable and worth testing now; a story need not use every mechanic.
Next: the case's logic as Archipelago logic, in the rules.json format of the Archipelago-CC repository.

77. **The logic as Archipelago rules** (`node scripts/export-rules.mjs <dir>` writes `<dir>/rules.json`; `npm test`
    keeps it in step with `structure.json`). Papers are items (progression), each question besides the goal a location,
    the goal an event location holding Victory, the papers in hand from the start `starting_items`, and "Nothing new" a
    filler for the questions that give nothing. A location's rule is a flat list of papers (`Has`, `HasAll`, `Or`
    between alternatives): its own, the paper that raises it, and those of every question it requires. Locations have
    neutral names ("Question 07"), since the multiworld sees them; the `mystery` section, which is not part of the
    format, maps them back to question and paper ids. Archipelago-CC's world generator accepts the file (`--validate`,
    one warning that counts item names against locations) and writes a world package from it. Not yet done: a seed
    generated from that world, and whether `mystery` survives into slot data.

78. **An Archipelago-CC session built the world and reported** (2026-11-14; its branch `mystery-world`, not merged).
    Measured there: 10 one-player and 5 two-player seeds generate, the spoiler test passes on all ten, and the web
    client against a real server checks every location. The validator's warning counts item names, not the pool,
    and does not matter. The export changed to match its report: the name map moved to `world[1].slot_data.mystery`
    (a plain slot-data key that an exported preset keeps; at the top level it reached the slot only by accident),
    with the case's version (a hash of `structure.json`) so the page can refuse another version's slot; item and
    location ids are pinned in `structure.json` (`ap`, and the `archipelago` block) and must never change or be
    reused; the game's name has no colon (it becomes a file name); the file now passes that repository's schema.
    The goal stays an event in the file; the world is built there with `--victory-location`, which makes the last
    question an ordinary check (location 1024, item 26) so that the server sees the goal. The bridge it recommends:
    one host module there, and four messages with the page (`mystery:questionSolved`, `mystery:requestState`,
    `mystery:state` with the papers held and the questions already checked, `mystery:refused`); the page deals only
    in its own ids. Not built: there is no page side yet.

### The delivery mechanism: the design agreed (step 7.2, 2026-11-14; built the same day)

Laid out to the user as six decisions with alternatives; the user agreed every recommendation, details to be
adjusted later if wanted.

1. **Solved, at any moment.** The gate's judgement (`gateState` in `ui/world.js`: exactly one answer circled, every
   essential observation filled, the circled answer right) is consulted after every move for every question the
   player can see, not only at a give-away. The moment it holds the question is solved for good: its marks lock,
   Undo does not take it back, distrusting its evidence afterwards does not reopen it. With the evidence complete a
   wrong circle says "not this answer" and nothing more (no growing wait: no difficulty is added until everything
   else works). The clicks stay as they are (crossing out still passes through circling). No commit button.
2. **A solved question is evidence.** A question that `requires` others (the layers) has, among its essential
   observations, "question X is solved"; it fills by itself when X is solved, with no link for the player to make,
   and the larger question lists what it rests on and which of those are not solved yet. Not chosen: the player
   linking the solved question; hiding a question until what it waits for is solved; enforcing nothing.
3. **Papers arrive by one rule with a source behind it.** The page asks "has this paper come?" (`delivered`). Playing
   alone: a placement of papers on questions drawn from a seed by the forward fill of `scripts/structure-check.mjs`
   (one shared module); solving a question delivers the paper placed on it. The seed is drawn for a new game, kept
   in the save, shown in Settings, and can be given in the address to replay. Connected to an Archipelago (later,
   once the long story has prose): the same rule answered by the bridge's `mystery:state` (finding 78); the code is
   shaped for it now. The page derives the logic for the fill from the case's own data (each question's essential
   observations, the paper each rests on, where it is raised, what it waits for), and a test holds that equal to
   `structure.json`; the page does not read `structure.json` or `rules.json`.
4. **What the player sees.** On solving, a notice where papers are announced today: "Solved. It brought: <paper>"
   with a button to open it, or "Solved. It brought nothing new." The question carries a solved mark and what it
   brought. A short list of the papers says how each came (held from the start, or brought by which question). Not
   shown: how many papers are still out, or which questions hold them.
5. **The main story in one part.** All of it is readable from the start except its last paragraph, which waits for
   the goal question, by the gate as it is today. The questions raised in the main story are visible early; the rest
   appear as their papers are read.
6. **The checks.** The true path is written per question (the moves that solve it), not as one fixed order; the path
   check plays a seed by repeatedly solving any question that is open and expects each paper to arrive as placed.
   The page checks run three seeds a case, chosen once by script: the narrowest order found, the widest, an ordinary
   one. Hints and autoplay only suggest moves for a question that is open now. A tiny invented fixture case (three
   questions, three papers) carries the mechanism until the long story has prose and data.

The build is handed to an Opus session (the kickoff: `.cache/delivery-build-kickoff.md`, not committed).

**Built** (2026-11-14), in five commits, on the invented fixture `scripts/fixtures/vestry-cup` (The Vestry Cup: five
paragraphs, three papers, three questions and the goal); the long story still has logic only. The format and the
commands are in `docs/case-format.md` ("Papers earned by solving questions", "Solved") and `docs/technical.md`;
`guide.html` has "Solved questions" and earned papers. The fifteen miniatures play as before (every page check).

79. **Locking a solved question's marks would refuse the miniatures' own paths.** The Rent Box Papers links the
    evidence, circles the Captain, then crosses out Mr. Fenn; with "its marks lock" the crossing is refused, since the
    question is already solved. Built instead: on solving, the story's other proposals cross themselves out, the
    circle can never change, and a click on another answer only crosses it out or clears it.
80. **Solving judges strictly whatever the gate's setting.** With Settings' "commit to any answer", the gate's own
    test would make any single circle a solve and so earn papers for nothing. Solving always asks for the evidence
    and the right answer; the setting decides only whether the main story's gate opens.
81. **Three questions and three papers could not show the mechanism.** With two questions besides the goal to place
    papers on, the fill has almost one placement: no question that brings nothing, no choice of order, no question
    raised by an earned paper. The fixture has three questions and the goal, one paper held from the start and two
    earned: four placements, a question raised in an earned paper (the note from the Grange), a goal that rests on the
    three others solved. The fill's own measure (`structure-check.mjs`): 2.5 of the 4 steps have one question open.
82. **The logic derived from the case's data matched structure.json at the first try** on the fixture: a question's
    papers are those its essential observations' facts are told in and the paper that raises it, and "question X is
    solved" observations give `requires`. Not yet known for the long story, whose clues have no facts yet; the test
    will say.
83. **Surely read first, across stories, for an earned paper:** only the same story, no later (and the main story's
    ¶1, where the page opens), since no main-story paragraph delivers it. The fixture needed no more: where a move
    needs two stories its `at` lists both.
84. **Trying a move to see if the page allows it could solve a question for good.** The hints and the path check
    make a move and take it back with Undo to learn whether the page takes it; a tried link that completed the
    evidence solved the question, and Undo does not take a solve back. Found by the hint check's new assertion (every
    hint is about an open question): a hint for the key question after it was solved with one link of two. Nothing is
    judged while a move is only tried (`window.__trying`). The same holds for any check or helper that probes by
    making and undoing a move.
85. **The order a seed gives is narrow on so small a case**: over 500 seeds the narrowest order has one question to
    choose from at three of four steps, the widest at two. The page checks play seeds 1, 2 and 495
    (`scripts/delivery-seeds.mjs`); on the long story the same script will pick from its wider spread (finding 76).

Not built, as agreed: the bridge to an Archipelago (the page's `source` object, `held` and `brought`, is what its
`mystery:state` will answer), any growing wait after a wrong answer, and the long story's prose and data, which is
the next step and the user's to start.

### The long story's prose and data (step 7.3, 2026-11-14)

**The Fire at the Custom House** (`cases/custom-house-fire/`, played at `?case=cases/custom-house-fire`): a main story
of 22 paragraphs and 24 papers (about 2,600 words), 68 entities, 43 time points, 127 facts in 24 accounts, 25
questions, 99 observations (all but one essential) and a true path of 110 moves. Four papers are held from the
start; twenty are earned on 24 questions. Written from `structure.json`, prose first, then the data by a one-off
script that found each fact's paragraph from its quote; the data files are the source from here on.

86. **It validated, and its derived logic matched the structure, almost at once.** The validator's first run found one
    kind of error (the shape of an answer's reasoning); the logic the page derives from the data equalled
    `structure.json` at the first try, and the six contradictions the validator lists are the six designed (the two
    bell times, Prout's claim against the landlord and against the potboy, the ledger's berth against the log's
    Cardiff, the baker's naming against the doctor, and the confession against the baker). The true path, the autoplay
    in every layout and the hints play to the end on the three seeds (`CASE=cases/custom-house-fire npm run page-checks`,
    over ten minutes); the first run failed only on finding 88.
87. **Every answer has to be given away in the last paragraph.** The format requires each answered question to be
    given away at a main-story paragraph, and in an earned case every paragraph but the last can be read from the
    start. So the last paragraph is a summing-up that states all 25 answers, each in quotable words. A question that
    is not the goal could do without a give-away (it is judged when solved); that would be a format change.
    The user's rulings (2026-11-15): a question that is not the goal may have no give-away; the ending may be
    several paragraphs; and a give-away may come as a paper of its own. Built as: only the goal is given away in
    the main story; the ending is the main story from `delivery.ending` on (here four paragraphs, a short
    confession), held until the goal alone is solved, so side questions can be left open and solved afterwards;
    and a **reply** is a file fixed to its question that comes when the question is solved (ten here, where
    somebody in the story would naturally answer: the fire office, the locksmith, telegrams from three ports). A
    reply is not placed and is no Archipelago item, carries no entries, and says no more than its question's
    answer. A give-away in an ordinary earned paper was rejected: it could come before its question is solved,
    and a question given away is no longer judged, so its check would be lost.
88. **"Something is missing here" is offered for hours not yet read.** The watch book has one entry to a paragraph, so
    with the book half read every later hour is "missing", and the path check called the true path's move late. The
    move carried `late` with that reason. A record in one paragraph (The Watchman's Clock) never showed it. The
    user's ruling (2026-11-15): the move waits. The page offers a gap only once every paper that holds an entry of
    the record is read to its end, and says so on the rule and the entries meanwhile; `late` is gone from the path.
89. **Time points shared between papers** have one home paragraph and `labels` listing every paper that tells the
    time, so the label shows whichever is read first. A time told relative to a contested event ("some minutes
    before the bell") is left unordered against the two clock times, or the timeline's order would give away which
    clock is right; the bell itself is a time point of its own, and the two clock times are two facts of one `event`.
90. **A false entry cannot be the evidence of the small question about it.** Distrusted, it leaves the timeline, so
    "Was the Marigold at Saltmere on 3 September?" rests on the ship's log alone and the ledger enters only as the
    paper that raises the question. The ledger's telling as a lie (`doubted`) needs all three entries disbelieved, so
    it is required only by the larger question that joins them. What a true reading of a false document shows (the
    entry names a berth) is the narrator's own fact, beside the false one.
91. **Yes and no are both offered outright.** An answer that is `indirect` sits behind "More", which for a yes-or-no
    question would point at it; both are `direct`, quoting the question's own words.
    The Archipelago-CC session rebuilt the world from this export on 2026-11-15 (its commit `4720ea7a03` on
    `mystery-world`, not merged: only the version changed, to `dd0448338832`).
92. **Looked at by eye (2026-11-15), and three things fixed.** With 34 tabs (24 papers, ten replies) the tab list,
    which sticks to the top of the story column, was taller than the column and hid the text of every paper: it now
    keeps to a third of the window's height and scrolls. An act's topic (`about`) was shown as its raw id
    ("for lamp_errand"): it is now the topic's name. And an act's label is followed by its thing with no word
    between, so the three acts of the case's own are relabelled to read on into it ("putting initials to" the
    three passes). Seen and left: a question's time window that begins and ends on one day reads "3 September
    until 3 September, eleven at night"; "circle an aim, or read on" is still offered when the story is read to its
    end; a reply not opened leaves its "A paper has come" note under the story, so ten can stack there.
    A check plays the ending with questions open (`GOAL_FIRST=1` on the true-path check, in `npm run
    page-checks` for a case with earned papers): the ending shut while the goal is open, read once it is solved,
    and the questions left solved after it. In this case the goal rests on all 24 other questions, so nothing is
    ever left open; the fixture's question about the curate was made a side question (its observation under the
    cup no longer essential, no give-away) so that the check has something to play.
    The needs and alibis the page shows for the three acts of the case's own (signing a
    pass at the Custom House, sending word of the lamp, firing the house) read rightly. The fire's need of a key is stated by
    observations and not as a typed need (finding 22: a key is a key by its wording and its time).
93. **The first blind run of the long story (Haiku, 2026-11-16): stuck at the held ending, no question solved.**
    The solver now runs in parts (`MAX` turns a go, `RESUME`, `STATUS`), ends itself after 200 turns with nothing
    new read and no question solved, and may send a `report` of a fault with any move (it sent none). In 261 turns
    ($0.71) Haiku read the story to the held ending and the four papers in hand by turn 61, circled two small
    answers rightly without finishing their evidence, and then spent 200 turns linking some thirty entries to the
    goal, whose notice said "its evidence is not all linked yet: 1 of 14". Most of the fourteen are in papers that
    had not come, the notice did not say that the goal rests on other questions, and the question's own list named
    most of those as "a question not raised yet". Its notes called the small questions "solved" when the page
    counted none. Three changes, at the user's word (to be looked at again when difficulty is discussed):
    while the ending is held and the goal cannot be solved from what the reader has, the notice says that it rests
    on other questions or lacks evidence not on the page yet, says to solve the smaller questions first, and lists
    the open questions whose evidence is all on the page now, in place of the count; every unsolved question with
    evidence to link says "Not solved yet", with its circle and how much of its evidence is in place, or that some
    of it is not on the page yet; and the guide and the solver's instructions say to solve the smaller questions
    first. The list of what can be solved now is a help the page did not give before: it tells the reader which
    questions the papers in hand suffice for. Seen and left: a click on a question already linked (✓) unlinks
    it, and the solver did that several times by mistake.
94. **The second Haiku run (2026-11-16), after those changes: 12 of 25 questions solved, then stuck.** It stopped at
    the $3 the user set, at turn 667, two turns short of the 200-turn stuck rule. Four questions were solved in the
    first hundred turns, ten by turn 300, the twelfth at turn 469; it read 94 paragraphs (the story to the held
    ending, and the papers its questions brought). The last 200 turns went on one question, where Crouch was
    between one o'clock and the bell, with the right answer circled and one of its two pieces of evidence linked.
    The missing piece is the plainest in the story (the pier-head lamp is a quarter of an hour from the watch-box,
    ¶3); the solver decided instead that Crouch's statement had to be disbelieved, opened the entry of the telling
    again and again, and sent the run's one report: that the telling shows "Trusted: certain" and offers no way to
    distrust it. The page says of a link that fills nothing only that it is "kept as a note"; nothing says what
    kind of thing is still missing. Its notes had two solved answers the wrong way round by turn 300, and called a
    question solved that the page did not. The cost of a turn rose with the page: $0.19 for the first hundred
    turns, $0.55 for the sixth. The user's ideas for what comes next, not built: a link that provides required
    evidence cannot be unlinked (the solver unlinked by mistake some fifteen times), and at some point a mode like
    the earlier game's incremental one, which tries every option for the player.

### On whether a miniature is any fun (experiment 2, before the user has played)

Each is about two minutes: read five to eight paragraphs, then make every move at the last paragraph before the end,
when the deciding clue arrives. More than half the moves are links (7 of 11, and 5 of 10). In the first, the reader can
do nothing useful between meeting the contradiction and finding the paper except distrust a side on a guess.

### The first blind solver (experiment 2, 2026-11-14)

The user asked for one blind run with Haiku first. `scripts/blind-solve.mjs` plays a case through the real page: each
turn the model gets the guide, its last twelve actions, its own running notes, the page as text and a numbered list
of the controls a player may use (not the hints, the autoplay or Settings), and answers with one action as JSON. One
`claude -p` call a turn, from an empty directory with no tools (the pattern of the archived pipeline). Records go to
`.cache/blind/` (not committed).

The Watchman's Clock, Claude Haiku 5.5: **both answers right, through the gate, in 71 turns, for $0.10.**

57. **The new move was found unaided.** At turn 31, from a punch's detail, it pressed "Something is missing here: at
    Tuesday, three o'clock" ("Ward's missing round would put him away from the station"), and linked the gap to "Who
    took the bale?". It never distrusted the statement because of the contradiction; it set the statement's rounds to
    distrusted at turn 57, by its own reading.
58. **The gate's count was the wall.** From turn 33 to 64 it sat at "its evidence is not all linked yet: 2 of 3"
    without knowing which piece was missing. It was the gate's state on the latch at half past three, linked to
    "When" long before but not to "Who" (the observation "the gate was opened with a key between half past two and
    half past three"). The same entry needed twice, for two questions, read to it as already done. Thirty turns of
    a two-minute case went there, five of them pressing "Hint".
59. **Linking everything works.** It ended with 18 links to "Who" and "When", against 5 essential observations; the
    extra links cost nothing and were kept as notes. A player who links every entry to every question passes the
    gate without the reasoning the gate means to require. Whether a link should be able to be wrong (a note that
    shows nothing, counted against the player, or a limit) is for the user.
60. **Two circles at once on "When"** ("something else" and the right answer) held the gate until it noticed "(2
    circled)" in the gate notice.
61. **Harness defects found and fixed after the run:** a "Hint" button inside the gate notice was offered (the hint
    text itself shows in a panel the solver never saw, so nothing leaked, but turns were wasted), and "nothing
    changed" was reported for clicks that changed only the view (More), as it compared the save and the detail alone.

The user's rulings on these (2026-11-14): the page says that one event can be evidence for more than one question
(the gate notice, while a question's evidence is incomplete, and the guide's section on observations); links stay as
they are, with no cost for a link that shows nothing, since no difficulty is to be added until everything else works.

62. **Three runs more after that change, with the harness fixed** (Haiku, The Watchman's Clock, 2026-11-14). All three
    reached the end with both answers right and found "Something is missing here" unaided (turns 28, 38 and 37).

    | Run | Turns | Turns with "not all linked yet" | Links | Cost |
    |---|---|---|---|---|
    | 1 (before) | 71 | 53 | 18 | $0.10 |
    | 2 | 36 | 8 | 8 | $0.22 |
    | 3 | 57 | 14 | 16 | $0.07 |
    | 4 | 65 | 20 | 12 | $0.09 |

    The wait at "2 of 3" fell from 53 turns to 8 to 20. Run 4 still met the old wall briefly: the latch at half
    past three, linked to "When", found for "Who" at turn 48 after trying the rule and the statement. No hint
    was pressed. Most of what remains is circling and linking around the gate, and the order of the work (reading
    the card, opening entries one by one). Run 2's higher cost is not explained by its length; the record keeps only
    each run's total.
63. **Sonnet** (Claude Sonnet 5.5, The Watchman's Clock, 2026-11-14). A first run was stopped at turn 22 with $3.73
    spent: two turns had each written some 128,000 hidden output tokens ($1.63 and $1.74) before a short, normal
    reply, against $0.01 to $0.03 for the rest. The harness now caps each call's output and stops a run at a budget.
    The second run: **both answers right, 45 turns, $0.91**, no costly turn. It found "Something is missing here" at
    turn 8 (Haiku: 28 to 38) and spent 5 turns at "not all linked yet" (Haiku: 8 to 53); it made 9 links, each of
    the essential ones and few others, linking the latch and the gap to both questions of its own accord. On 12
    turns it wrote a tool call as text (`<invoke name="click">…`, often repeated) instead of the JSON asked for, and
    those turns were lost; the harness now takes the first action from that form and tells the model it has no
    tools. The runaway turns of the first run may have been the same pattern repeating.
    A third run with those fixes: **both answers right, 28 turns, $0.65**, every turn taken. The gap move at turn
    10; never at "not all linked yet" (it linked the evidence before reading to the gate); 7 links. It still wrote
    the call as text on 12 turns despite the instruction, and the harness took each one.

**Haiku on the other fourteen cases** (one run each, 2026-11-14, $1.74 in all, at most 150 turns). Seven reached the
end with every answer right: The Cellar Door (31 turns), Dinner at Larch House (29), The Grey Cloak (36), The Last
Ferry (47), The Loose Board (34), The Night Porter's Statement (25), The Sailor's Knot (33). The other seven ran out
of turns at the gate, six of them with the right answers already circled; what each still lacked:

64. **Papers never opened** (The Telegram Signed M., The Will in the Bible, The Rent Box Papers): the telegram and
    the will at 0 of 3, Mr. Fenn's statement and the narrator's afternoon at 0 of 2. It read the main story with
    "Read on" to the gate and never chose a paper's tab, so the evidence on them never reached the timeline. (On
    The Watchman's Clock it did find the card, late.) In The Rent Box Papers it circled the wrong man, for want of
    them.
65. **A lie as evidence needs the statement disbelieved** (The Lamp-Keeper's Word, The Rent Box): the statements were
    linked, but not distrusted, so the observation from `{doubted}` never filled. In The Rent Box it set the
    statement's own trust only at the last turn, and to trusted.
66. **Half of a two-entry observation** (The Stable Clock): the stable clock's being slow was linked, the gardener's
    taking his time from it was not; nothing on the page says a link is half of something.
67. **The room's route** (The Ring on the Bench): never built; but the harness showed the model the room panel's
    buttons without its text (the panel was not among the parts it read). Fixed; the run is to be repeated.

The user's rulings (2026-11-14): papers are announced (a note under the main story for each paper that has come and
is not read to its end, with a button to open it; and the gate's notice lists them); the guide says that a statement
you no longer believe can be evidence, distrusted and linked; and for finding 66 the user wants some way to report
that something is still missing, its form to be discussed. Chosen the same day from four ideas: each link says what
it did, in the entry's detail ("Shows: …", "Part of something not yet complete", or "Kept as a note"), and the
question's summary lists what is begun; and the gate's notice counts what is begun ("2 of 3, and 1 more begun",
added at the user's wish once the first two were in). Naming what is missing (a hint written for each observation)
is left out.

**Haiku again on the seven held at the gate** (one run each, 2026-11-14, after papers were announced, the guide said a
disbelieved statement is evidence, the solver saw the room panel, and begun observations were reported; $1.08 in
all). Three more solved, every answer right: The Lamp-Keeper's Word (71 turns), The Telegram Signed M. (53), The Will
in the Bible (90). Four ran out of turns at the gate, each with the right answers circled except The Ring on the Bench:

68. **The papers were read.** In The Rent Box Papers every paper was read to its end (0 of 2 before, for two of
    them), and the telegram and the will were read and solved.
69. **A lie in two parts** (The Rent Box, The Rent Box Papers). The captain's statement carries two things that are
    not so (Fenn crossing the yard, the back door open). Both runs linked the statement and distrusted the back door
    alone; the observation from `{doubted}` fills only when every false part is off the timeline, so it stayed a
    note, at "1 of 2", for some ninety turns. Nothing says the statement is half disbelieved.
70. **Begun, and not finished** (The Stable Clock). The gate said "3 of 4, and 1 more begun"; it never linked the
    gardener's looking at the stable clock, the other half, though it opened that entry early and distrusted it.
71. **The route still not built** (The Ring on the Bench), with the room panel now in view: it marked every way in,
    many times over, and never added a step to the route. It circled "something else".

The user's rulings (2026-11-14): for finding 69, a statement linked and only partly disbelieved counts as begun ("part
of something not yet complete"; `ctx.partlyDoubted` in `fill`), checked on The Rent Box: one false part distrusted,
begun; both, filled. Finding 70 is to be tried with Sonnet. For finding 71 the user tries the room panel, and a look
at it found: the route section is a heading and two buttons, with nothing saying what a route is for or that the
finished route is an entry to link to the question; and in three columns the gate's notice floats over the
Questions panel and hides part of it.

72. **Sonnet on The Stable Clock** (2026-11-14): **both answers right, 30 turns, $0.95.** It read the new report as
    meant: "The stable-clock link is still part of an incomplete observation, so I'm opening Bowker's glance at the
    stable clock" (turn 19), and linked it. Nine links, against five essential observations.

The user's rulings on the room panel (2026-11-14): the route section now says what a route is for ("How could it have
come? Build a way, one step at a time, from where it could start to where it had to reach; then link the finished
route to the question"), and so does the guide; and in three columns the notices keep to the right-hand column. The
room check's drag of the questions' line now scrolls it into view first (the longer room panel had pushed it below
the window).

73. **What Sonnet did that Haiku did not, on The Stable Clock.** The gardener's statement has a true part (he looked
    at the stable clock as the shot came) and a false one (the shot at a quarter to nine). Both Haiku runs opened the
    true part and distrusted "this one statement" there (its own trust), taking off the timeline the very entry the
    case needs; the begun report could not help, since the half to link was gone. Sonnet distrusted the false part
    alone. The user's rulings: next to each trust control not at distrusted, an event's detail now says what
    distrusting it would take off the timeline ("Distrusting it takes off the timeline: Bowker: looks out at the
    stable clock…"); and what falls below the threshold stays in view, faded, by default (Settings' "Show the rest,
    faded", now on), so a hasty distrust can be seen and undone. The blind solver could not reach Settings, so it had
    never seen distrusted entries at all.

74. **Haiku once more on the four still held** (2026-11-14). The Rent Box (146 turns, $0.24; 81 of them showing its
    half-disbelieved statement as begun), The Rent Box Papers (128, $0.16) and The Ring on the Bench (85, $0.10; it
    built the route from the yard by the pane and the cord to the bench) were solved, every answer right; these
    loaded the page before finding 73's changes. The Stable Clock, after them, ran out of turns at "3 of 4": it again
    distrusted the gardener's true half at turn 9 (the new line said what that would take away), but the entry
    stayed in view, faded, and at turn 84 it trusted it again and completed that observation. What it never did was
    the fourth: the gardener honest and wrong, which needs his "quarter to nine" disbelieved while the statement is
    linked; with nothing of it disbelieved the link is a plain note. So fourteen of the fifteen cases have now been
    solved by Haiku, and The Stable Clock by Sonnet.

## What the game needs from the concept library

- A case names its people, places and objects as concepts, so that the same logic can be given another theme.
- A concept can be used both in a file's text and as something a substrate can place and draw.
