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
| `cases/miniatures/garden-room` | A room with two doors, each watched by a different witness for a different stretch: neither watch closes any of the time alone, and the two together leave what neither covers (finding 124). | 5 paragraphs, 18 facts, 2 accounts, 1 telling, 1 question, 7 observations (4 essential), 6 moves |
| `cases/miniatures/prize-marrow` | A stated want: something spoiled, three who could have done it, what each said outright they wanted, and a deed that brought about what only one of them wanted; the one who gained by it had said he would not have it so (finding 125). | 6 paragraphs, 14 facts, 1 account, 1 question, 6 observations (4 essential), 7 moves |
| `cases/miniatures/prize-marrow-typed` | A story told from its data: The Prize Marrow with its text, quotes and observation sentences made by a script from its typed entries (finding 137). | 6 paragraphs, 13 facts, 1 account, 1 question, 6 observations (2 essential), 7 moves |
| `cases/miniatures/prize-marrow-prose` | Prose written by a model from the typed entries and audited against them (finding 138): the same logic a third time. | 6 paragraphs, 13 facts, 1 account, 1 question, 6 observations (2 essential), 7 moves |
| `cases/miniatures/grey-cloak-typed` | The Grey Cloak told from its data: who someone was, what was worn, two descriptions compared as typed heights (finding 148). | 6 paragraphs, 19 facts, 3 accounts, 2 tellings, 1 question, 6 observations (all essential), 14 moves |
| `cases/miniatures/ring-on-the-bench-typed` | The Ring on the Bench told from its data: the arrangement of a room, a route's observation, a thing that knows nothing named by its keeper (finding 150). | 9 paragraphs, 25 facts, 1 account, 1 question, 7 observations (5 essential), 17 moves |
| `cases/miniatures/dinner-at-larch-house-typed` | The Dinner at Larch House told from its data: two narrators, each "I" in their own account; what was seen from where (finding 151). | 6 paragraphs, 21 facts, 2 accounts, 1 question, 7 observations (4 essential), 6 moves |
| `cases/miniatures/night-porters-statement-typed` | The Night Porter's Statement told from its data: a narrator who may be doubted, his statement in his own voice (finding 152). | 6 paragraphs, 12 facts, 2 accounts, 1 question, 4 observations (3 essential), 6 moves |
| `cases/miniatures/will-in-the-bible-typed` | The Will in the Bible told from its data: a paper's date, what it gives and revokes, what it speaks of (finding 145). | 5 + 3 paragraphs, 19 facts, 2 accounts, 1 telling, 2 questions, 9 observations (7 essential), 15 moves |
| `cases/miniatures/stable-clock-typed` | The Stable Clock told from its data: times read by a clock, a doer unknown, yes or no confessed (finding 144). | 7 paragraphs, 20 facts, 3 accounts, 2 tellings, 2 questions, 7 observations (6 essential), 10 moves |
| `cases/miniatures/last-ferry-typed` | The Last Ferry told from its data: a statement about everyone, times that are events, a question of two worded answers (finding 142). | 6 paragraphs, 24 facts, 3 accounts, 2 tellings, 2 questions, 9 observations (6 essential), 11 moves |
| `cases/miniatures/same-monday-typed` | The Same Monday told from its data: the story and its five scenes made by a script, witnesses' accounts as their speech (finding 139). | 3 + 2 + 2 + 2 + 1 + 1 paragraphs, 22 facts, 5 accounts, 4 tellings, 1 question, 7 observations (4 essential), 15 moves |
| `cases/miniatures/same-monday` | Visits in the present: five places to go, a day of three hours, and the same morning beginning again with everything learned kept (finding 134). | 3 + 2 + 2 + 2 + 1 + 1 paragraphs (main story, five visits), 19 facts, 5 accounts, 4 tellings, 1 question, 7 observations (4 essential), 15 moves |
| `cases/miniatures/grey-cloak` | A mistaken witness: what she saw is kept, her identification of it set aside, and the mistake is evidence. | 6 paragraphs, 17 facts, 3 accounts, 2 tellings, 1 question, 6 observations (all essential), 12 moves |
| `cases/miniatures/night-porters-statement` | An unreliable narrator: one of his statements is against the other narrator's own knowledge and is set aside; another is kept. | 6 paragraphs, 12 facts, 2 accounts (one for each narrator), 1 question, 4 observations (3 essential), 6 moves |
| `cases/miniatures/wages-bag` | A witness's record and two sources that agree (findings 112 to 114): a first tale against the narrator's own observation; a second with one statement that is needed and one against another witness's word, nothing confirmed deciding it; a third witness who shares nothing with the second and agrees. | 6 paragraphs, 26 facts, 5 accounts, 4 tellings, 2 questions, 8 observations (4 essential), 4 implications, 17 moves |

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
95. **Checked links (2026-11-16), the first idea taken from the earlier game's incremental mode.** The user's
    rulings: a link that is evidence cannot be unlinked; a link that is not is refused, and the pair of entry and
    question is marked as tried for good; somewhere the page lists what has not been tried; no automation yet;
    and all of it is a setting from the start (Settings, "Links": checked, the default, or all kept as before),
    on every case, since such things will become difficulty settings. That trying every entry on every question
    now solves every linking step is intended. Built so: a link is evidence when its entry is one some
    observation of the question comes from, whatever else that observation waits for (engine `bears`), so a lie
    linked while still believed, a link that waits for a reading circled, and a link to an entry not yet trusted
    onto the timeline are kept and shown as "part of something not yet complete", the wording of evidence from
    two entries (the cost, accepted: it tells the reader that a statement is evidence in a way not yet found).
    Tried marks and evidence links survive Undo, as solved questions do. Links as the reader's own notes are
    gone with the rule on; a note from a game played with it off becomes a tried mark. A route is not marked as
    tried (it is the reader's own and changes as it is built). The list of what is not tried is the timeline
    itself in linking mode ("tried ✗" on a row, and "only what is not tried yet" to hide what is done), with a
    count under each open question, so it needs no panel in any layout. Trust is left as it is: the user's
    ruling is that contradictions are its feedback. Circles too: "Not this answer" already marks a tried
    answer once the evidence is in. The reasoning moves and the room need nothing: the page offers only a move
    that holds and refuses a mark nothing supports.
96. **"Left to try" (2026-11-16): one place that counts every kind of move not yet made.** The user's idea, with
    the question of where it goes in three columns: a box above the questions (so it is in the same place in
    every layout), one line of counts when shut, lists when open. Reading: the story and each paper not read to
    its end. Reasoning moves: every move the page would take now and that is not made, taken from the buttons
    of each entry's own detail so the two cannot disagree (a move offered from either of two entries is one
    move); the room's moves are not in it. Links: for each open question the entries neither linked nor tried,
    as counts (the list is the timeline in linking mode, which a click opens). Answers: the open questions with
    nothing circled. Trust is left out: it never counts down. A setting, on by default. Counting the moves for
    every entry at each drawing costs a few milliseconds on the long case (a redraw of some 20 ms with a
    hundred entries on the timeline). It came from the third Haiku run, stuck on a question whose last piece of
    evidence was "It changed" from one pair of entries when it had made the move from another.
97. **The third Haiku run (checked links; 2026-11-16): 8 of 25 questions in 600 turns ($2.26), stopped 24 turns
    short of the stuck rule.** Not a clean comparison with the second run (12 of 25): each drew its own seed, so
    the papers came in another order. Wasted moves fell while it worked (4 in a hundred turns at best), and its
    notes listed what it had tried. It stuck for 176 turns on how the fire-setter came in, three of four pieces
    in place: the fourth is "It changed" between the door found fast at twelve and the bolt drawn back, and it
    had made the move from the door locked at six and the bolt drawn back, whose entry was refused. Two things
    followed. A fault of the build: an entry of the reader's own reasoning was never marked as tried (the
    exemption meant for routes took every reasoned entry), so the same refused link could be tried without end;
    mended. And a ruling of the user's: a premise of a reasoning move that an observation comes from is evidence
    that waits, like a lie not yet disbelieved, so linking the bolt drawn back is kept and shown as "part of
    something not yet complete" where it was refused as showing nothing; once the move is made and its entry
    linked, the premise's link is listed no longer. Not changed: the observation takes the move from one pair of
    entries only (an observation cannot say "this move or that one").
98. **The fourth Haiku run (2026-11-16), on the second run's seed with all of the above: 13 of 25 questions,
    stuck after 646 turns ($2.72).** The same papers in the same order as the second run (12 of 25, $3.00 at 667
    turns). It passed both earlier sticking points: how the fire-setter came in (it went down the watch book's
    "door fast" entries, two refused and marked, the third kept) and where Crouch was. It stuck on who let the
    brandy out of bond, three of four pieces in place, sure that the fourth was an entry of its own reasoning
    when it is the cart's entry in the gate-keeper's book for the same night as the pass it had linked. In its
    last 146 turns it pressed "Link observations…" and "Linking…" 117 times: one button that turns the linking
    on and off, so that every press changes the page and nothing tells the solver it is going nowhere. It had
    tried six entries for that question of about a hundred, and never went down what was left: the tried marks
    help a solver that works through a list, and Haiku does not unless its own idea of the answer runs out.
    A fault of the harness, mended after the run: "Left to try" was shut, and its heading was not among the
    controls the solver is given, so it saw the line of counts and could not open the lists. The switch "only
    what is not tried yet" was among its controls throughout, and it never pressed it.
    After it, at the user's word: starting and ending the linking are two controls in two places ("Link
    observations…" under the question starts; "Done", in the bar that now stays at the top of the timeline, ends),
    so a press after a press no longer undoes itself. The linking mode is kept and not removed: every run made
    more of its links from an entry's "Relevant to…" list than from the timeline's rows (71 to 21, 69 to 56, 44
    to 19; the first run 16 to 28), but the mode is where the list of what is not tried lives.
    And the solver's memory, which is the harness's and not the page's: it is given its last thirty actions (it
    had twelve), each with the thought it had for it, and a count of any action repeated four times or more
    among them. A reader remembers what they have just tried, and why; the solver did not.
99. **A claim stands for its statement (2026-11-16), from the fifth Haiku run's report.** Whether Mr. Prout was at
    the Anchor takes his statement, disbelieved, as evidence (`{doubted: the telling}`). The solver linked the
    false claim in it, which was refused and marked as tried; then it distrusted the claim, rightly, and
    reported that the tried mark still barred it. The user's ruling: when a statement is evidence for a
    question once disbelieved, a link to any fact that statement told is kept and waits ("part of something not
    yet complete"), as a premise of a move is; any fact, the true ones too, since to keep only the false would
    say which is the lie. The statement itself is still the entry that fills the evidence.
    The same run's second report ("the page says one paper remains unread, but every paper tab shows x/x")
    found two faults. Of the page: "Left to try" counted the story as a paper to read while the gate held it;
    a held story is now listed as held and not counted. Of the harness: the "Solved" notice (what solving a
    question brought, with the button that opens the paper) was not in the text the solver is given, in any
    run so far, so it saw "Open it" buttons with nothing said about them; it is given the notice now.
100. **The fifth Haiku run (2026-11-16; the same seed, the longer memory): 13 of 25 questions, $3.00 at 581
    turns.** Level with the fourth run's total, and dearer by the turn (the thirty actions with their
    thoughts: $0.27 for the first hundred turns where the fourth paid $0.12). What the memory changed: moves
    that did nothing fell to between 3 and 14 in a hundred (the fourth run's first hundred had 39), it named
    its own loops ("opened three times without being read, so I'll stop clicking its tab"), and it never
    pressed one control for a hundred turns. It sent the two reports of finding 99. Its last 141 turns went
    on who let the brandy out of bond again, now by trying entries: 23 refused and marked for that question,
    the pass of the same night found and kept at the last turn, the cart's entry in the gate-keeper's book
    still to find. So with checked links a weak solver does get on by trial, slowly: some six turns a try at
    its pace, with about a hundred entries a question.
    Its notes spoke of entries "not reachable by control number": its own circled answers, which the timeline
    shows as lines like any entry ("Mr. Prout: signing the pass of 3 September"), and which it wanted to link
    as the missing evidence for who let the brandy out. That evidence was in place already: the larger question
    rests on the smaller, and "question solved" had filled by itself. Two changes at the user's word. The
    harness lists the timeline's question lines and circled answers among the controls (a reader can click
    them; the solver could not). And the page, while linking, marks the line of each question the linked
    question rests on, and of its circled answer: "counted ✓ (solved)" or "counts once this question is solved".

101. **The sixth Haiku run (2026-11-17; the same seed, a $6 limit): 13 of 25 questions, stuck for 200 turns at
    turn 605, $3.20. The wall was the case's, not the solver's.** "Who let the brandy out of bond?" stood at 3 of
    4. The piece missing was the gate book's entry of the cart going up Mill Lane on 24 September. The gate book
    has three such entries (3 and 24 September, 8 October), word for word alike on the timeline, and the
    observation named only the second. The solver linked the first, the page refused it and marked it tried, and
    it concluded, reasonably, that the Mill Lane entries do not bear on the question. The same fault had cost it
    about a hundred turns on "Where did Marsh's cart take the casks?", which named only the first entry (it tried
    the other two first). With free links this was a nuisance; with checked links a refusal says "this shows
    nothing", which was false. At the user's word an entry of an observation can be `{any: [facts]}`: any one of
    them fills it and each is evidence (a checked link of any is kept). In this case the three cart entries are
    alike for both questions, and the three passes for the brandy question; the pass of 3 September stays the
    only one for the initials, where its date is the point. Of the last changes: the notes show the solver
    knowing which questions were solved and guessing that a piece might rest on an unsolved question; it opened
    "Left to try" twice, early, for the papers, and not while stuck; it sent no reports.
    A sweep of all eighteen cases for entries worded alike of which an observation named one (the same subject,
    attribute, value and detail) found one more: the watch book's "door tried, fast" at ten, eleven and twelve,
    of which the way-in question took only twelve, as a link and as the premise of "It changed". At the user's
    word any of the three serves for both (a premise of a move can be `{any: [facts]}` too), and the two lines
    say "on its round" for "at twelve". The other hits differ in their detail, and the detail is the point (two
    clocks, two tellers, two times). The sweep does not find entries worded differently that show the same thing.
102. **The seventh Haiku run (2026-11-17; the same seed, after finding 101's changes): 11 of 25 questions, stuck
    for 200 turns at turn 762, $3.86. Two walls, neither the entries alike (the Mill Lane entries were taken).**
    The first, turns 90 to 144 and a report: a paper opened at "0 of 5" shows no text until "Read on" is
    pressed, and the solver took the empty view for a paper that would not open. The second, the last 200 turns:
    "Where did Marsh's cart take the casks?" stood at 2 of 3 with all three entries linked. The solver had
    distrusted the line of Mr. Garrick's note that says where the casks went (reading the note as a guilty
    man's); distrusted, it is off the timeline and shows nothing, and the page said only "Part of something not
    yet complete: something else is still needed", which the solver read as "find another entry". Trust was
    left without feedback of its own when checked links were built (contradictions were to be the feedback);
    this is the first run it cost much. Both changed at the user's word. The unread paper's view has its own
    button, "Read its first paragraph ▶" (the line there had named Read on already: a line was not enough).
    And a linked entry that is evidence for the question but below the timeline's level says so, in its detail,
    in the question's list ("Linked, but you do not trust it enough for it to count") and in "Not solved yet".
    This says that the statement matters, which a kept link says already, and not whether it is true. (Entries
    of distrusted statements are shown faded by default already: "Show the rest, faded".)
103. **The eighth Haiku run (2026-11-18; the same seed, after finding 102's changes): 10 of 25 questions, stuck
    for 200 turns at turn 539, $2.63. No report; no paper taken for shut; nothing distrusted that was needed.**
    Two questions stood one piece short, each piece a plain entry never linked ("all three in one hand" for the
    initials; "the berths lie inside the quay gate" for the cart). The solver named the first as the entry to
    link six times, and each time clicked the entry's own line, which opens its detail. Of its last 199 turns
    132 opened a timeline entry and 22 tried a link. In the page as text each entry's line ends "+ relevant";
    in the numbered controls the entry's line and its button are two items, and the button's says only
    "+ relevant", with no entry. A reader sees the button beside its entry; the solver must count. A fault of
    the harness, changed at the user's word: a button on an entry's line is listed with its entry ("+ relevant ←
    for the entry: …"), and a checkbox, listed until now with no words at all, with its label and whether it is on. It used "Left to try" while stuck for the first time (for the one
    move on offer). One page error, at turn 449: a contradiction open in the detail, one side distrusted, and
    the side no longer an assertion to draw; fixed (the detail says "Resolved" and shows no sides).
104. **The ninth Haiku run (2026-11-18; the same seed, the link buttons named; the limit raised to $12 on the
    way): 15 of 25 questions, the furthest yet, stuck for 200 turns at turn 869, $4.75.** With its buttons named
    the solver linked what it meant to. It began by trying every entry against one question at paragraph 8 (a
    hundred turns for one question solved), then read on. The cart question's third piece, the one that rules
    out the other answer (the berths lie inside the quay gate), it found by trying entries one after another,
    with a report on the way that nothing on the page said what kind of piece was wanting; that opened the
    cart, Crouch, the brandy and the entry's date. The wall, and thirteen reports: "What are the three Marigold
    entries?" at 6 of 9. One piece is the ledger's statement as a lie. A statement's detail says "Trusted:
    certain" (that it was said) and has no trust control: what it says is doubted on each entry it carried, and
    nothing on the statement says so or leads there. Reproduced: with the statement linked and its three
    entries distrusted the page counts 7 of 9, so the question can be done; the way to it is not shown. The
    same dead end at Mr. Prout's statement. Changed at the user's word: a statement's detail says that its being
    said is certain and what it says is trusted separately, and lists the entries it carried, each opening its
    own detail (on every statement alike, so it says nothing of which is a lie).
105. **Implications: an experiment the user asked for (2026-11-18).** The ninth run's report on the cart question
    was fair: a question is solved when every observation its author marked `essential` is linked and one answer
    circled, and nothing reads what the observations imply. Measured on the long case: 98 essential pieces over
    25 questions; 48 labelled as against a named wrong answer, 26 "another question is solved", 24 neither; of 61
    wrong answers 26 are ruled out by nothing ("something else" everywhere, and Mr. Pell for the brandy). The
    user's rulings: statements that say what other statements imply together, shown automatically as soon as
    their premises are linked, in a tree; the answers circled and crossed out by the page from them, the
    player's own circling removed for now ("the priority is accurately tracking the logic, and removing the
    circling mechanic means that we rely entirely on the logic, which means it gets tested"); an answer accepted
    when an implication concludes it or every other is ruled out; a piece the answer does without is kept as
    support; an implication goes when a premise is distrusted, a solved question stays solved. Built as a setting
    ("Answers: marked from the evidence", off by default; `docs/case-format.md`, Implications), with the rules
    written first for The Rent Box and for the cart, the initials and the brandy of the long case. One decision
    of the building: an observation's `against` is not read, since the piece seldom rules the answer out alone
    ("the berths lie inside the quay gate" does so only with "the cart went out by the town gate").
    What writing those rules showed. The Rent Box, who emptied it: "Mr. Fenn was outside" was required and is
    not needed; "there was nobody else in the house" was not required and is (its link was added to the true
    path). The cart: the berths piece only rules out the other answer. The brandy: "read as Mr. Prout's" restates
    the rest. The initials: the evidence rules out Mr. Pell, and the step to Mr. Prout rests on what no entry
    says, that nobody else at the Custom House has those initials (written as a rule, and listed as a gap).
    Lost with the player's circles, for those questions: "Not this answer", a guess on the timeline as a
    hypothesis, and the hints' circle steps (a hint that says to circle is done already).
106. **The rules for all 25 questions of the long case, the ways to each answer, and the export from them
    (2026-11-18; the user's order: the rules first, then the tests, then the delivery logic and the export).**
    68 implications. `ways` lists every smallest set of statements an answer follows from; the validator prints
    them with what stands out, and the export's rule for a location is any one of them. The true path plays to
    the end with every answer marked from the evidence, on the three seeds. What the rules show of the story:
    - 16 of the 25 answers follow from fewer statements than were asked for; the largest drops: the man in the
      cloak 11 to 6, the three entries 9 to 2 (by the carts: each night's casks went to the cellar, so no export
      was made), who set the fire 14 to 4.
    - Pieces asked for twice under two names: the brig at Cardiff and the tide of the 24th are each both "that
      question is solved" and a link of the same entry for the three entries; the berth's date likewise; the
      bell's time for the half hour. The door found fast was both a link and the premise of "It changed".
    - Steps no entry states: J.P. not Mr. Pell's, so Mr. Prout's (nobody else of those initials); the entries
      false because the casks went to a cellar (that the three passes are the three entries' casks); that Mr.
      Garrick could not have come back by road (the fifty-eight miles are in the story and are no evidence for
      the question); that a key was used by its keeper.
    - A statement's lie as evidence (Crouch's rounds, Mr. Prout at the table, the baker's Collector, the ledger)
      is in no way to any answer: the answer shows the lie, not the lie the answer. So the wall of the ninth run
      is not on the path of the logic at all.
    - **The short proof.** Who set the fire follows from four statements without the rest of the case: the
      fire-setter came in with a key (the door question solved), there are two keys, Mr. Prout's by his own word
      never left his pocket, and Mr. Pell was at Cliff House with the doctor. In papers: the night watch book and
      Mr. Prout's statement, of the 21 to earn. The other way (the reason, the boy sent, the man in the cloak)
      takes most of the case. Whether the short proof should stand is the story's question, for the user.
    - Judgements made in writing them, to be looked at: two witnesses for Mr. Prout's absence, not one; either
      the doctor's sitting or the foot for Mr. Pell; any one false entry rules out "true exports".
    - The short proof stays for now, at the user's word; alternatives are for later.
    A player who only tries things (`scripts/random-links-check.mjs`): everything read, every entry linked to
    every question in a shuffled order, the moves offered made, and when stuck each statement disbelieved in
    turn and believed again; after every entry the page's marks against the engine's reading of the links. The
    long case: 25 of 25 solved and the story read out, 1,977 links, six minutes, the page and the engine never
    apart. The Rent Box: finished only once the player could disbelieve a statement, since "which lodger told a
    thing that was not so" has the lie itself as a premise (the one place a lie is on the way to an answer).
107. **What follows, in the contradiction tracking (2026-11-18).** The user asked whether the statements of the
    evidence use the format the contradiction tracking does. They did not: a contradiction is found among typed
    assertions (who or what, an attribute, a value, a time, with chains and trust), and an observation or an
    implication is a sentence with `rules_out` and `concludes`. The plan was to make each implication's outcome
    an assertion from the question's typed `entry`, with nothing new to write. What checking that showed first:
    - The outcomes were in the tracking already, by the back door: the page wrote each verdict as a circle or a
      cross, and marks are assertions. But they rested on "your hypothesis", not on their premises.
    - A ruled-out answer met almost nothing. Every answer of every question of the long case was tried, asserted
      and denied, against every statement: a denied wrong answer met one statement in the case (the baker's "It
      was the Collector"), and a place answer was never set against where the timeline has the thing.
    - A question's `entry` types what the question is about, not its answer. Of the 25 answers, 5 are people, 3
      places and 17 free text ("it was set", "no", "half an hour"); 20 of the 25 entries are timed "sometime
      between", which the engine compares with nothing.
    - The lies are not reached by answers. Of the case's 7 false statements, 5 clashed with true entries already
      and the other 3 (Crouch's rounds, two entries of the ledger) are contradicted by what a rule says on the
      way ("no round at one", "she could not have sailed"), which is no answer. 16 of the 68 rules are such
      statements.
    The user's rulings: do the small first step all the same (it may matter more in other stories); a typed
    field on an implication; a statement that cannot be typed may be denied by its id; a denial over a stretch of
    time by accurate logic, no shortcut; in general, move as much of the free text as can be moved to typed
    statements; and, later, a form for "nobody came into the house after one".
    Built (`docs/case-format.md`, "Implications" and the list of contradictions):
    - What follows is an assertion resting on its premises, trusted as its weakest (the better of two ways), and
      a contradiction's trace shows the rules and the entries under them. A place answer with a certain time is
      that location; one a rule rules out is that location denied; an identity a rule rules out is denied.
    - `asserts` on an implication: typed statements, each on the timeline as an entry of the reader's reasoning
      (left out when the timeline says the same already). `denies`: a statement by its id.
    - Time. A denial over a stretch means "at no moment of it", and now also meets the same thing asserted "at
      some moment between" two points inside the stretch. The denial of an answer over a stretch means less,
      "not so for the whole of it", and is met only by locations that hold the stretch end to end.
    - The validator: with everything shown, nothing that follows may contradict what is true; and it lists the
      false statements that what follows contradicts. A page check plays the true path without its moves of
      trust and asks that each such lie on the timeline be in a contradiction.
    In the long case 12 rules now carry a typed field (10 `asserts`, 2 `denies`), 6 of them new entries on the
    timeline; with everything linked and every lie still believed, all 7 false statements are in a contradiction
    with what follows. The Rent Box has none to write: its one intermediate statement is "nobody came into the
    house or left it after one".
    What the page check caught: an answer crossed out only because another was concluded had been denied as a
    state, and "the cloak was not at Saltmere" is false of a cloak that hung in the Custom House, which is in
    Saltmere. Only an answer a rule itself rules out is denied as a state.
    Then, the same day, the two things left open, both asked for by the user:
    - **A statement about everyone.** `{of: "*", every: 'person', but: [...]}` as the subject of a typed
      statement: one about each of them, set against any one person's entry. Someone whose identity is in
      question is not counted, since they may be one of those named. In The Rent Box, "the Captain was inside the
      whole time, and there was nobody else in the house" is now "nobody but Mrs. Orme or the Captain at the
      house from one until three", on the timeline. What is typed is who was in the house, not that nobody came
      in: coming in is an act, and "nobody did it" of a typed act has no form yet.
    - **An answer's typed form.** A possibility may carry `asserts`. A circle asserts it and a cross denies it,
      by hand or from the evidence, where one state says the denial exactly. In the long case: "yes" to the
      rounds (every round from ten until six), to Mr. Prout at the table, to the brig at Saltmere on the third,
      and the two times of the bell. Concluding "no" now denies "every round, from ten until six" as "not for the
      whole of it", which is exactly what Crouch's own statement contradicts. Three rules' `asserts` said the
      same as the answer and were taken out (the long case: 7 rules with `asserts`, 2 with `denies`).
    - The validator marks the key and fails if that contradicts what is true, in every case, with rules or not.
108. **Typed acts in the contradictions, and rules for every short case (2026-11-18; the user's four requests
    after finding 107).**
    - **"Nobody did it."** A typed act is the same act as another by its types and roles, and a denial denies
      every act that has what it names. With the subject "everyone" this is "nobody went through the front door
      from one until four", which meets any one person's going through it, and with nobody excepted someone
      unnamed too. The Rent Box: "nobody came into the house or left it after one" is now two such entries, one
      a door.
    - **The export as a typed act.** The long case has two actions of its own, taking aboard for export and
      sailing from a place; the ledger's entries of 24 September and 8 October are typed with them, and the two
      rules that denied them by id now deny the act ("she did not sail from Saltmere at noon"; "she took no
      casks aboard"). No rule of any case uses `denies` now; the form stays for what cannot be typed.
    - **Rules for the other 14 short cases**: 50 rules, every case's true path played with the answers marked
      from the evidence. What writing them showed, as in finding 105: three answers rest on a piece that was not
      asked for, and its link was added to the true path (Larch House: that George and the maid never left the
      dining-room; the watchman's clock: that only Ward and Tanner have keys; the Rent Box with papers: that
      nobody else lives in the house). The other way round, pieces asked for by hand that no way to the answer
      uses: Ned in the loft (the cellar door; he has no key either), Finch in the lock-up (the night porter: the
      keys alone conclude it), the stable clock being slow (the housemaid and the hall clock conclude it), and
      the two pieces against Mrs. Grice (the will). Judgements made, to be looked at: Jem from having a key and lying at the door, with
      the other key's keeper unnamed; the last ferry's "the vicar's key was in his own pocket" is the narrator's
      word in no entry; Mr. Voss as "the one other who learned of it".
    - **Typed answers and statements in the short cases**: the two times of the shot and "yes, in the library"
      (the stable clock), who waited at the mill (the telegram), and Finch not in the bank (the night porter).
      Where a question's answers are places or an identity the first step of finding 107 types them unasked
      (the lamp-keeper's word, the grey cloak).
109. **Plans and motives: what the Holmes cases set up, and its first use here (2026-11-18).** The user asked
    whether the typing of plans and motivations begun in the Holmes cases would fit. It does, as vocabulary: an
    aim is a typed state someone wants (`goal`), an act has needs and effects from a table, a plan is steps whose
    effects feed the next step's needs, a motive question is the end the rest serves. The engine for it is still
    in the main tree; only the new cases did not use it. But it was built for moves the player makes ("what is
    this for?"), and the direction now is the page tracking the logic by itself, so two things were missing: an
    act's needs and effects did not reach the contradictions (only "was elsewhere" and "does not know how" did),
    and a goal is only a state to bring about. The plan agreed: needs and effects into the tracking first, on
    the long case's door; then goals for the motive questions, with "preventing" as the first new shape.
    Built, the first part:
    - An answer can be an act by someone unnamed (a possibility's `action` with `of: "?"`): "by forcing the
      door" is someone forcing the street door between midnight and the bell.
    - What an act leaves behind is asked of the timeline too: an entry at or after the act that denies it is a
      contradiction with the answer (forcing leaves a mark; the door has none).
    - **The rules nobody writes.** Where what one linked observation comes from contradicts an answer's typed
      form, the page rules that answer out, with no rule in the file. The long case: the three rule-outs of the
      door question (not forced, not by a window, not left unlocked) and "no theft to hide" are gone from the
      file and come from the typed forms (two new actions, forcing and breaking in; the door's mark and the
      windows' bars as denied conditions; the chest's contents typed). Eight more rule-outs came that nobody
      had written: Mr. Pell, Mr. Garrick and Captain Venn for the fire by their alibis, Mr. Pell for the pass
      signed while he was in London, and the wrong answers of the typed yes-or-no questions. In the short
      cases: Ned in the loft, Ellen's granny knot, Mrs. Holt at the fête.
    - Not done: "an accident of the stove". The stove "cold, raked out and shut" the next noon does not, by
      strict logic, deny a stove alight in the night; the story's own inference is that a stove raked out and
      shut was put out on purpose. That rule stays written.
    What the page should do with a motive was put to the user, since a motive contradicts nothing: "the chest
    was left locked, so the fire was not for the money" is an aim nothing was done toward, which is likely, not
    certain. The user chose likely rule-outs, weaker than a contradiction (finding 110).
110. **Evidence weaker than a contradiction (2026-11-18).** The user's ruling: an aim not carried out is ruled out
    as unlikely; and, asked for more that could be done with weaker evidence, agreed to seven things, to be built
    in this order as far as possible.
    Built:
    - **1. A strength on every rule.** `strength: "likely"` on an implication; what follows is as strong as its
      weakest step by the best way to it. A likely answer still solves its question (the default put to the
      user), shown dashed and "(likely)". What is only likely makes no contradiction: "unlikely together, by
      the evidence". In the long case the four steps no entry states (finding 106) are marked likely: J.P. not
      Mr. Pell's, so Mr. Prout's; the entries false because the casks went to a cellar; Mr. Garrick with no
      train back; a key used by its keeper (two rules). The effect: the initials and Mr. Garrick's absence are
      likely answers; the entries stay certain, by the other way (two exports that could not have been made);
      and who set the fire stays certain by the long way, while the short proof of finding 106 is now only a
      likely way to it.
    - **The aims of the fire.** The three answers of "What was the fire meant to destroy?" carry a `goal`, the
      bond store's state is typed, and the two hand-written rule-outs (not the money, not the brandy) are gone:
      the table makes those answers unlikely from the chest and the vault. The right answer is still concluded
      for certain from the heap at the press. "Preventing" (the fire as a goal against the Board's audit) is not
      typed: nothing the page does would use it yet.
    - **2. Trust beside each conclusion**, as far as it could go without a ruling: each statement in a
      question's tree has the dot of how far it is trusted, its weakest premise. (Whether a conclusion is only
      likely when it rests on what is not confirmed was left to the user here; it was settled the same day by
      the five trust levels below and by finding 115: an uncertain statement counts for nothing, a link trusts
      as likely, a conclusion is as strong as its weakest step, and confirmed is earned.)
    Agreed and not built, each to be discussed before building:
    - 3. Means, opportunity and motive as a grid: each suspect against what the act needs, met, against, or
      nothing says so, from the action table; in place of hand-written likely clashes.
    - 4. Absence as evidence: a typed watcher (who, where, when), so that "not seen" is "likely not there".
    - 5. Defaults that can be defeated: "a clock is right unless shown wrong", "a stove raked out and shut was
      put out on purpose" (the stove rule of finding 109), "an aim was attempted" defeated by what its holder
      believed (the ledger he thought was in the press).
    - 6. More than one way to an answer: corroborated, or hanging on one statement.
    - 7. A witness's record: one statement shown false, and the page suggests doubting the rest.
    Still open:
    - Sentences still: the answers of 12 questions of the long case ("it was set", "to destroy the bond ledger")
      and most of the short cases' "when" answers; the values of `condition` facts; untyped `action` facts.
      Each needs a decision of vocabulary (what a motive is, in typed form), which is the user's.
    - A statement about everyone only in an implication's `asserts`, not yet in a witness's own entry ("nobody
      passed me").
111. **Five levels of trust: the user's rulings (2026-11-18; built the same day, below).** Asked whether
    more levels of trust would make sense, on one scale with likely and certain. The rulings:
    - Five levels: confirmed, likely, uncertain, unlikely, ruled out ("trust as likely", "trust as confirmed",
      "distrust as unlikely", "distrust as ruled out").
    - Uncertain is the default; an uncertain entry is shown greyed and does not count for the logic. The
      narrator's own observations start as confirmed.
    - Confirmed counts and can give a certain conclusion; likely counts and gives at most a likely one; a
      statement held unlikely counts, as false, for likely evidence, and one ruled out for certain evidence. A
      conclusion is as strong as the weakest of its rules and its premises.
    - Clashes: a contradiction among what is confirmed; "unlikely together" where a side is only likely; and,
      where a side is still uncertain, a grey "cannot both be so: undecided", which is a difficulty setting, on
      by default for now. (Without it nothing would clash until both sides were trusted, and resolving a clash
      is the main loop of the game.)
    - A whole paper or a whole person can be raised at once.
    - The list of what is left to try shows the statements still uncertain.
    - On the timeline the levels are told apart by more than colour: dashed for likely either way, solid for
      settled; a dashed line through an unlikely entry and a solid one through one ruled out.
    - Saved games need not be kept.
    This settles the question left open in finding 110 (trust feeding strength).
    Built (`docs/case-format.md`, "Trust"). What reading the code showed first, and the user's rulings on it:
    - Until now "uncertain" counted (the timeline's threshold was uncertain), so the real change is that a
      witness's word counts for nothing until it is trusted. In the long case 62 of 104 entries start uncertain
      and 43 of the true path's 76 links go to one; five of the short cases have none.
    - Trust was set per link and a statement had two (its own and the telling's), a person only a cap. Ruled:
      the most specific setting wins (the statement's own, else its paper's or telling's, else the person's, else
      uncertain; hearsay as its weaker hop). Setting a person, or a paper, sets everything under it to that level
      (the settings below are taken back and can be set apart again). A list of the sources at the top level with
      their levels, each opening one layer down (the Sources part).
    - A link to an uncertain entry is kept and waits, with a button to trust it as likely. Confirmed is free to
      set until corroboration (item 6 of finding 110) is built. The page sets no level itself; a clash names its
      weaker side. A hand-made circle counts as likely. "Its being false counts" only where a case has a
      lie-as-evidence piece (`{doubted}`): the page does not assert the denial of every statement ruled out.
    - "Disbelieved" had meant "below the threshold", which every uncertain statement now is: it is now "held
      unlikely or ruled out", and a lie is likely evidence when unlikely and certain evidence when ruled out.
    - `certain` (rule strength) and `supportLevel` (trust) walked the same tree: one `strength` now. A clash is
      as strong as its weakest side, which folds in the "likely" answers of finding 110.
    - The true paths: `scripts/path-trust.mjs` writes a move that trusts a statement as likely before the first
      move that uses it (62 moves over 10 cases; where papers are earned, once in each question's moves), and
      the whole paper at once before "Something is missing here", which reads a whole record. The seven moves
      that distrusted a lie now rule it out. The threshold setting is gone ("Hide what is ruled out" in its
      place), and a setting lists or hides the grey clashes.
    - What the checks caught: a gap in a record was offered at every hour while the book's entries were
      uncertain (a record now counts its uncertain entries); with papers earned an entry used for two questions
      must be trusted in the moves of each; the hint against a wrong distrust looked for what it took off the
      timeline, which is now nothing (it looks for what it lowers).
    - **After the user played the Rent Box (2026-11-19).** Two things stood out: most answers resting on a
      witness read "(likely)", and a lie against the narrator's own observation was listed as "undecided". A
      third, hidden by that case: a trust move before every link (43 in the long case). The user agreed to:
      - *A link trusts.* A link that is kept trusts its entry as likely, if it was still uncertain. Uncertain
        now means "not used yet". The generated moves of the true paths fell from 62 to 2 (the long case's
        watch book, trusted whole before "Something is missing here").
      - *Against what is confirmed.* A clash with one side alone short of confirmed is its own kind, "cannot
        be so: against what is confirmed", with a button to rule that statement out. "Unlikely together" and
        "undecided" are for two sides short of confirmed. This departs from finding 110 in one thing: a
        likely answer against a confirmed entry is now listed here, not as "unlikely together".
      - *Solving confirms.* A question solved confirms the statements its answer rested on that were held
        likely, so trust grows as the case is solved and later answers can be certain.
      So the loop: link (likely), a clash with what is confirmed (rule out), solved (confirmed).
      Not built, agreed as a good fourth: the author setting where a source starts (a tide table likely or
      confirmed, a person's word uncertain); it needs a pass over the long case's sources. Corroboration (item
      6) may still offer "confirmed" before a question is solved.

112. **A witness's record (item 7 of finding 110; 2026-11-19, built the same day).** What the cases hold, measured
    first: 12 sources with a false statement; for 7 of them a true statement of the same source is essential
    evidence (Crouch 3 of 13; Lunn 2 of 4); some of the false ones are mistakes, not lies (a figure taken for the
    wrong man). So "one false, doubt the rest" as a one-click "hold the rest unlikely" was put to the user as either
    empty (what is uncertain already counts for nothing) or a trap (it takes away evidence the answer needs, and
    with a forged ledger it makes the other entries count as lies with no work). A reader uses a record at two
    moments: two accounts disagree and nothing confirmed decides; an answer hangs on one person's word. The user
    agreed to the recommendation, and to work in the "marked from the evidence" mode:
    - *The record as a line*, both ways: so many confirmed, so many against what is confirmed, so many ruled out.
      On the source's page and card. It says "ruled out", never "lied".
    - *A note where it matters*: beside a statement not confirmed, in its detail and on a side of a clash.
    - *A link no longer trusts by itself* what came from a source with something else ruled out: the one effect.
      The page still sets no level against the player's word; it withholds a raise.
    - *Shown false* is the player's own ruling out (and for the line, an open clash against what is confirmed).
      Only a ruling out stops the link trusting, so the effect is the player's own doing and a path can be
      checked without playing the page.
    - No one-click button.
    What building showed: in "The Lamp-Keeper's Word" the false statement is the keeper's own word as another
    brought it, so by its origin the record blamed the honest one. A statement ruled out is therefore laid to
    whoever's link is ruled out: its own source where the statement itself is, the carrier where the telling is
    (the path rules out the telling). The true paths needed 5 moves of trust more (3 in the long case, one each in
    "The Grey Cloak" and "The Watchman's Clock"): a true statement of a source linked after another of theirs was
    ruled out.

113. **More than one way to an answer, and agreement (item 6 of finding 110; 2026-11-19, built the same day).**
    Measured first: every question of the 15 short cases has one way to its answer; in the long case 5 of 25 have
    more, and only one has ways through different people. Two sources saying the same thing of the same moment:
    one pair in all the cases (Lobb and Bales, the empty chair when the bell rang). So "corroborated" alone would
    be a feature for one question. Agreed with the user, for the "marked from the evidence" mode:
    - *What an answer rests on*, under every question that has its answer, by what is linked: its sources; "hangs
      on the word of X alone" where it all comes through one person, with X's record (finding 112); several ways,
      and whether two share no source (corroborated) or all pass through one person. It applies to every
      question, and never says whether another way exists.
    - *Agreement* as the mirror of a contradiction, listed under the clashes, with an offer to confirm where one
      side is confirmed or both are likely. Not automatic: two can agree and both be wrong.
    - *Independent*: no person and no paper or telling in common; a narrator's own observation is independent of
      everyone.
    - *Confirmed stays free to set by hand*: with one agreeing pair, earning it by agreement would starve the
      player.
    What building showed:
    - "Who set fire to the Custom House?" follows three ways, one of them only through other questions' answers,
      which shared no source with the rest by name and was called corroborated. A solved question now counts with
      everything its own answer rests on; the three ways then share sources, and the line says only "3 ways". The
      one corroborated answer is the three ledger entries (the gate-keeper, the Commissioners, Captain Venn).
    - A statement over a stretch agrees with a sighting at one moment of it: in "The Watchman's Clock" the false
      "I made every round" agreed with each of the five punches the narrator saw. A pair is therefore listed only
      where the one short of confirmed is borne out whole (its time inside the other's), and only that one is
      offered: a sighting at noon does not confirm "from six till noon".
    - Not done: what follows from the evidence agreeing with a witness's statement (an answer the evidence gives
      that a witness also states) is corroboration too, and is not listed. Authors could write for agreement: a
      second witness to the same moment is now something the page uses.

114. **The Wages Bag: a miniature for the record and for agreement (2026-11-19).** Two blind Haiku runs first, with
    the answers marked from the evidence (The Grey Cloak: 22 turns, $0.04; The Watchman's Clock: 58 turns, $0.10;
    all answers right), showed that no existing case makes a player rule a statement out before the same source
    is needed again: both were solved with the false statement left uncertain, so the held-back link never
    happened. In The Watchman's Clock Haiku spent some 30 turns linking the same entries with the story at ¶2 of
    6, where the evidence it wanted was not yet told, and got out by reading on. The user then made "marked from
    the evidence" the default (a check's address says `answers=hand` unless told otherwise).
    The case, agreed as an outline first: the carter's first tale (at the forge) is against the narrator's own
    look into the forge and is ruled out; his second holds an admission that is needed (he had the key and went
    in) and a charge (the foreman in the counting-room at half past eight) against the cook's word (the foreman in
    her kitchen from eight till nine); the curate, a paragraph later, saw the foreman at the kitchen table at half
    past eight. The user's rulings: the curate comes after the clash; the caught-out witness is wrong again here
    (a case where he is right the second time is kept for later); plain story, no papers.
    What writing it showed:
    - **A rule from one witness's word ends the clash by itself.** Written first as "the cook says so, so he was
      in the kitchen", the answer followed from one link as likely, the question was solved, solving confirmed
      the cook, and the carter's charge stood "against what is confirmed": nothing was weighed. An implication can
      only conclude a right answer, so a false statement never makes a rival conclusion. The clash matters only
      if the rule asks for it: here the answer follows from the cook's word with the carter's charge disbelieved
      (the record's way: a judgement, and likely at most unless it is ruled out) or from the cook's and the
      curate's together. For an author: where two statements disagree, no rule should conclude from one of them
      alone.
    - **A suspect's own alibi would count as an independent source.** The foreman saying where he was would
      "agree" with the cook, sharing no person or paper with her. He is given no statement in this case.
      Independence by chains knows nothing of interest; not solved.
    - On the page at ¶4: "cannot both be so: undecided", with "(uncertain; of what else came from Job Tarrant: 1
      ruled out)" beside the charge. The link to his admission waits for the player's trust. At the end the first
      question "follows 2 ways. Every one of them passes through the word of Mrs. Dabney", and the second rests on
      the word of Job Tarrant with "2 ruled out" beside it: the answer does hang on a liar's admission, as written.
    **Haiku on it, blind (2026-11-20): both answers right, 40 turns, $0.09.**
    - It read to ¶5 before doing anything, so it never stood at the clash with only the record to go on: putting
      the curate a paragraph later orders the story, not the play (reading is held only at a give-away).
    - The first tale: ruled out with the button under "cannot be so: against what is confirmed" (turn 4).
    - The held-back link: it linked the carter's admission, read that it waits, and pressed "Trust as likely" on
      the next turn (21, 22). No trouble.
    - The agreement offer was never seen. It set the curate to likely and then to confirmed by hand, with the
      cook's statement not yet linked, and ruled out the carter's charge from "against what is confirmed". With
      confirmed free to set by hand, the offer is a convenience.
    - Twenty turns (6 to 28) went on the first question: it had linked the cook's telling ("Mrs. Dabney tells
      …"), which shows nothing, and not the statement under it; and the gate's "0 of 1" (the count for answers
      marked by hand) told it one piece was wanted when either of two pairs is.

115. **Confirmed is earned; the gate and a telling say more (the user's rulings of 2026-11-21, after finding 114).**
    - *Confirmed is earned only.* Haiku confirmed the curate by hand and never met the agreement offer. Now no
      control offers "confirmed" for what someone says: it comes from the narrator's own observation, from a
      question solved, or from the offer where two independent sources agree. A statement that has earned it can
      be lowered and put back. This reverses "confirmed stays free to set by hand" of finding 113. Known cost:
      in the older cases only one pair of statements agrees, so there confirmed comes almost only by solving.
    - *The gate, with the answers marked from the evidence*, says what the question says ("no answer follows yet
      from what you have linked", how many answers are ruled out), not "0 of 1": the count was of the pieces asked
      for when answers are marked by hand, and an answer can follow more than one way.
    - *A telling that shows nothing* says so as before, and adds that it is only that it was said: what was said
      are entries of their own. A description of the page, the same for every telling.
    - Left as it is: the story does not hold at an undecided clash.
    - *The Wages Bag played blind again by Haiku (2026-11-21, after these changes):* 44 turns, $0.11, both
      answers right. It read four paragraphs, linked the curate and the cook, and "where" was solved by the two
      together in 8 turns. The agreement offer stood on the page for those turns ("1 agree: two sources that
      share nothing say the same") and was not taken: linking both solves the question, and the solving confirms
      them, so the offer is never the shorter road here. It ruled out the carter's forge by the clash button. Then
      27 turns went on "who". Two causes, both the page's. (a) After "where" was solved the linking stayed on it,
      so its next links (the carter's key among them) went to the solved question, each answered "Tried: it shows
      nothing about this question" without the question's name; it switched the linking to "who" only at turn 29.
      (b) The carter's key statement, held back by his record, stayed uncertain until turn 32, when it set
      everything the carter says to likely, and then that statement too. Not changed yet: both are for the user
      to rule on.
    - *Built on the user's ruling (2026-11-21):* the linking ends by itself when its question is solved (the user
      preferred leaving link mode to moving it to the next question), and the tried note names the question. For
      (b) the question already lists such a link as "Linked, but it does not count until you trust it as likely";
      the run missed it only because the link had gone to the other question.
    - *A third run after that:* 57 turns, $0.12, both answers right, by the other road: it began linking after
      one paragraph, ruled out the forge at turn 1, and solved "where" by the cook and the carter's charge
      disbelieved. The linking no longer strayed. What cost it some 17 turns: it ruled out the carter's "Mr. Wicks
      at the counting-room" and linked that statement, which is kept and waits, but the lie counts as evidence
      only when the telling itself is linked (the observation is from `{doubted: telling}`), and the question did
      not list the waiting link at all. It linked the telling at turn 40 and the question was solved. Smaller:
      "Left to try: 1 paper to read" was read as a paper blocking the story, when it was the story itself.
      Not changed yet.
    - *A lie linked by what was said (the user's ruling, 2026-11-21).* A statement the player holds unlikely or
      ruled out, linked to a question, now counts as its telling for a lie as evidence (`lieLinks` in
      `ui/world.js`): to rule out what was said and link it is the natural move. Whether the lie counts is as
      before: every false statement of the telling off the timeline.
116. **Means, opportunity and motive as a grid (item 3 of finding 110; the user's rulings of 2026-11-21).**
    - *What was found first.* No case has hand-written likely clashes any more, so there was nothing of that kind
      to replace. Of some 20 "who" questions, 7 have a typed act. Motive is typed nowhere in the short cases. And
      with the answers marked from the evidence nobody circles a suspect by hand, so the old "if it was X, they
      would have needed..." list never shows.
    - *The rulings.* A view of what the player has shown, deciding nothing (the answers still come from what
      follows). And: as much as possible typed data, as little as possible hand-written; go on with the typing of
      plans and motives. So no author tags were added: an untyped question has no grid until its act is typed.
    - *Built* (`suspectGrid` in `engine/implications.js`, `gridHtml` in `ui/world.js`). Under a "who" question
      whose entry is a typed act: a row for each person who may be the answer, and the columns Opportunity, Means,
      Motive, the same for every case. The act's needs are the action table's, with the suspect as its agent.
      A cell fills only from entries linked to the question and trusted: opportunity met by whereabouts at the
      place within the window, against by whereabouts elsewhere that cover the whole window (as an alibi);
      means met by a key or a thing carried, or another state the act needs; motive met by a goal the suspect
      holds (a linked fact of theirs with `goal`) that something the act brings about meets. A need is named
      only once something linked meets it or is against it, so the grid names nothing the player has not shown.
    - *The Wages Bag typed for it.* The question's entry is the case's own act `take_locked` (at the place, with
      a key to the door) over eight till nine; the carter's "took the key, went in" is two typed statements
      (carrying the key; at the counting-room) where it was one sentence. The table now makes its own rule: the
      cook's word alone rules Mr. Wicks out, as far as she is trusted (likely). The certain way is as before
      (the cook borne out, by the curate or by the charge disbelieved).
    - *More questions typed (2026-11-21, the user's go-ahead: the remaining "who" questions before motives).*
      "Taking out of a locked place" (`take_locked`: at the place, with a key to the door) went into the generic
      table, since three stories need it: The Wages Bag, The Night Porter's Statement (the keys on his belt are a
      key to the strongroom door) and The Watchman's Clock (the bale out by the yard gate). Both Rent Box cases
      and Dinner at Larch House are a plain `take`. Each entry now has a `{from, to}` window. What is carried
      counts as kept through the window unless it has an end. With every true entry shown the grids read as the
      stories argue: the porter has opportunity and means and the clerk an alibi; the Captain was in the house;
      Tanner has a key (his ankle, a condition, is not a typed need). Dinner at Larch House stays empty: its
      argument is who crossed a watched hall, not who was where. No new rule came from the table. Still untyped:
      who waited at the mill (The Telegram), who changed the word (The Lamp-Keeper's Word), who or what took the
      ring, who let the brandy out of bond, who wrote the will; the two "who was the figure" questions are
      identities, not acts.
    - *Not yet (as of that day's first batch).* Motive had the mechanism and no data; see finding 117. The other
      "who" questions are typed one case at a time.
117. **A motive is gain or loss (the user's ruling of 2026-11-21).** The recommendation of finding 116 was a
    motive as a goal the suspect holds. Read against the stories it fits badly: they almost never say what a
    person wanted, they say who gains and who loses. The user agreed to gain or loss as the main typed form,
    with the held goal kept for a story that states a want or a fear outright, and to build it on The Will in
    the Bible first.
    - *The typed form.* On an entry of a thing: `gives: [{to, what}]`, `takes: [{from, what}]`, `revokes: <thing>`.
      Where a question's typed act makes or handles that thing, the grid's Motive column reads: ✓ "gains …" for
      whom it gives to; ✗ "loses …" for whom it takes from, or for whom a revoked thing gave something the new
      one does not. The loss by revoking is worked out from the two entries, not written, and needs both shown.
    - *The Will in the Bible.* "Who wrote the will" is the typed act `make` (generic: making a thing; it needs
      nothing of its agent, so the Opportunity and Means columns stay empty here: the keys and the Bible are the
      story's argument about a will that was, in truth, never in the Bible). The old will `gives` the house to
      Mrs. Grice and the rest to the church; the new one `gives` all to Mr. Pym and `revokes` the old. With both
      linked: Mr. Pym ✓ gains all she had; Mrs. Grice ✗ loses Ashcombe House.
    - *A hand-written observation corrected by it.* "The earlier will gives Mrs. Grice the house; this one takes
      it from her" rested on the old will alone. It now rests on both wills, and the true path links the new
      will's bequest to the question (one move more).
    - *The Telegram Signed M. (the same day).* "Who was waiting at the mill" is the case's own act `wait_inside`
      (at the mill, with a key to it). The night book's entry is the typed act `keep_key` (drawing a key leaves
      one with it), and the grid now counts such an act of the suspect's as the means, as it counts a `carrying`
      entry with `key`. Mr. Grove: means ✓. "The only key drawn" is not typed, so nothing is against Mrs. Holt.
    - *A tie, the third form (the user's ruling, the same day).* The Lamp-Keeper's Word gives each suspect a
      reason that is neither gain nor loss: Pike came to blows with Wren; Elsie is to marry him. Typed: `tie: {to,
      kind: "for" | "against"}` on an entry of the suspect's, and `helps` or `harms` on the act. For a person the
      act helps, or against one it harms, is a motive (✓); the other way about is one against (✗). In this story
      the act differs by suspect, so each possibility carries its own `action`: Pike's change would have put Wren
      on the quay (`harms`), Elsie's put him at the chapel (`helps`). Both therefore read ✓, as the story says:
      "each of the two had a reason". (The proposal put to the user had said Pike ✗; that was wrong, for his
      change would have been the other way.) The Ring on the Bench gets no grid, by the same ruling: its argument
      is a way into a room, which the room view carries.
    - *What the grid reads is evidence (built with the tie; not put to the user first).* With checked links a link
      stays only if the entry bears on the question, which until now meant a hand-written observation. The two
      reasons in The Lamp-Keeper's Word have none, so their links would have been refused and the Motive column
      could never fill. An entry the grid would read for the question (alone, or with every other entry shown)
      now bears on it too (`gridBears` in `ui/world.js`). It shows nothing and decides nothing beyond its cell.
      The alternative, an observation written per motive, is the hand-written way the user ruled against.
    - *Two blind runs with the grid (Haiku, 2026-11-22).* The Lamp-Keeper's Word: both answers right in 22
      turns ($0.038); the solver never linked either reason, so the Motive column stayed empty. The Will in the
      Bible: both right in 63 turns ($0.108); it linked the bequest late, giving "bears on motive" as its reason,
      and the page showed "✓ gains all she had" for Mr. Pym. Neither run was misled by the grid or by the rule
      that what the grid reads is evidence; neither needed the grid to solve the case.
    - *The Custom-House Fire.* "Who let the brandy out of bond" is not typed: its argument is two solved
      questions, and its act is the signing of the passes, which is typed already. The fire's motive (to destroy
      a ledger that would expose the fire-setter) is a fourth shape, a threat removed; it is asked as a question
      of its own ("Why was the Custom House burned?"), and whether to type it is put to the user.
    - *A threat removed, the fourth form (the user's ruling of 2026-11-22: add it if it is of use elsewhere).* No
      other case here has it, but silencing a witness or destroying a record is a staple of the genre, so it was
      built. `threat: {to, by}` on any entry: a thing (`by`) threatens a person (`to`), who may be `{answer:
      <question>}`: whoever that question's answer is, once the player has solved it. `removes: <thing>` on the
      act, or `{thing, if: {q, pick}}` where what the act was for is itself a question. The grid takes the solved
      answers for this (`ctx.solved`); nothing else in it reads a solved question. In The Custom-House Fire the
      Board's letter (the Surveyor to examine the bond ledger) is a threat to whoever let the brandy out of bond,
      and the fire removes the ledger once "why was it burned" is solved so: with both solved and the letter
      linked, Mr. Prout reads "✓ threatened by the bond ledger, which it would remove". Before that the cell is
      empty, so the column says nothing ahead of the player's own answers.
    - *Survey.* No other short case states a gain or a loss, so the will is the only data. The column decides
      nothing: a motive against is not a rule-out, as agreed for the grid.

118. **Absence as evidence (item 4 of finding 110; the user's rulings of 2026-11-22).** What the reader does with
    "nobody else crossed the hall": a watcher is placed; the watcher says who was not there; that is a statement
    about each person; the deed's time narrows to when nobody watched; only then does opportunity decide.
    - *Rulings.* (1) Absence is only what the witness says: the explicit "nobody but X" is typed as a statement
      about everyone in the witness's own account, as trusted as the witness. A typed watcher from whose silence
      the page would assume the rest was not built: it makes silence into a denial the story may not mean, and
      every case found states the absence outright. A complete record is typed the same way. (2) The statement
      rests on where its witness was. (3) The page narrowing the deed's time itself is the second step, to be
      shown on Dinner at Larch House before going further. (4) Order: Larch House, The Telegram, The Rent Box.
    - *Built, steps 1 and 2.* A fact may be `of: "*"` with `every` and `but`, as an implication's `asserts`
      already could (the engine read them; the validator now allows them). `seen_from: <entry>` names the entry
      that puts the witness where it could be seen from: the statement is trusted no further than that entry,
      and the page says so under it.
      - Dinner at Larch House: "nobody else crossed the hall" is everyone but Captain Voss, not in the hall, from
        the soup to the joint, seen from the landing.
      - The Telegram Signed M.: the night book's line is now two entries, Mr. Grove drawing his key and "nobody
        but Mr. Grove: a key of the mill" (the record as complete). The grid reads the second under Means: ✗ for
        Mrs. Holt. The hand-written observation rests on both, one link more on the true path.
      - The Rent Box (both): "the back door did not open once" rests on Ada Orme in the kitchen; "no servant" is
        everyone but the three, not living at the house. Its statements about everyone inside the rules ("nobody
        came in or went out") are the reader's conclusions from the doors, not a witness's words, and stay there.
    - *Step 3, when it could have been done (the same day; `deedTimes` in `engine/implications.js`).* The act
      needs its agent at a place; for a stretch of the window the entries shown say nobody was: a statement about
      everyone, of the place, of a place it lies in, or of the far side of its one door (`joins`), with each
      person it excepts denied the place for the whole stretch too. The page says so above the grid ("Not from
      the soup until the joint (…). Left: after the joint, until the guests gone") and judges Opportunity
      against what is left: elsewhere through all of it is against; away from where one otherwise was, at a
      moment of it, is a chance ("away from the dining-room when it could have been done"). By the user's
      ruling it is a view and decides nothing: the hand-written rules still solve the case.
    - *Two soft spots it showed in Dinner at Larch House, and the prose changed for them (the user's ruling).*
      George listed who left the table and never said nobody else did, so nothing put Captain Voss in the
      dining-room after the joint: the rule had assumed the list complete. And the notes went into the drawer at
      the gong, with the table vouched for only from the soup. George now puts the notes away as the soup comes
      in, and says "Nobody else left the table, and neither of our guests went out a second time" (two entries:
      Miss Pym in the dining-room before the dessert, Captain Voss after the fish). The study door joins the
      study and the hall; the two goings-out are typed as "not at the dining-room"; Clara's "he did not go near
      the study door" holds for the whole of her watch. Seen on the page at ¶5 of the true path: the line as
      above, Miss Pym ✓, George and the maid ✗, Captain Voss nothing shown (the path does not link his entry).

    - *The narrowing as a rule (the user's ruling, the same day).* Where the true entries close part of an act's
      window and an answer's agent was elsewhere through all that is left, the table rules that answer out, as
      likely only (it rests on what witnesses did not see): `t.when.<n>`, from the observations of the entries
      that close the stretch and of the alibi. Each of those entries must be what some observation comes from;
      an observation was written for Captain Voss not going out again. In Dinner at Larch House this replaces
      two of the three hand-written rules (Voss ruled out; "the notes were taken from the joint onward"). The
      third, the conclusion, stays written, now as likely: with "something else" always among the answers
      nothing is concluded by elimination. The answer now follows at ¶4, where Clara's "nobody else crossed the
      hall" is read, not ¶5: that nobody watched afterwards is no longer needed, only that nobody is said to
      have. The true path ends at ¶4 with four links.
    - *Left.* A place with more than one door (no case needs it).

119. **Defaults that can be defeated (item 5 of finding 110; the user's rulings of 2026-11-22).** The plan's three
    examples are three shapes, none typed before: a clock is right unless shown wrong; a state found later was so
    before (the stove "cold, raked out and shut"); an aim was attempted, unless its holder believed otherwise (the
    ledger that was not in the press). Put to the user: one general rule form "X, unless Y" (the rules stay
    written); three typed forms; or typed where a second case would use it. The user chose the last: clocks first,
    then aims by belief, the stove left as the one written rule until a second story needs it.
    - *A clock is right unless shown wrong* (built on The Stable Clock). A time says which clock it was read by
      (`time.by`); a clock's entry says how it was off as pairs (`off: [{reads, when}]`: it read this when the
      time was that), since the stories' times are named points the page cannot add a quarter of an hour to.
      Until the clock's entry counts, the reading is taken as the true time, so the gardener's quarter to nine
      clashes with the housemaid's nine, as before. Once it counts, the reading is restated (`byClocks`, in
      contradictions, agreements and alibis): the clash goes and the two witnesses agree. Doubt the clock's
      entry and the clash is back.
    - *What it replaced.* The gardener's entry is no longer flagged false (he read his clock rightly), the
      "ruled out" trust move and the telling linked as an honest mistake are gone from the true path, and two
      written rules are gone: "a quarter to nine" is ruled out by the table, from the reading and the slow clock
      linked together. The conclusion stays written.
    - *Left.* The entry stays on the timeline at the time as read; its detail says what the time was. The pair
      for Thursday evening is the author's (the story shows the clock slow on Friday morning: that it was slow
      the evening before is the second default, not built). The grid and the narrowing do not restate readings.
      "The hall clock was set right that morning" confirms the default and changes nothing in the logic.

    - *An aim judged by belief* (built on The Custom-House Fire). Put to the user: the aim names the question
      that defeats it, or a typed belief entry. The user asked whether the question could serve as the typed
      belief, and that was built: the answers of "did the fire-setter know the ledger was out of the house?"
      are typed as what the doer believed (the ledger in the press, or not), the motive answer has its aim
      (the ledger burnt), a new entry from the story's "unburnt" denies it, and the motive question names its
      deed. Linked to the motive question, the unburnt ledger makes "to destroy the bond ledger" unlikely,
      until the knowledge question is solved: then the rule is set aside. Rules gained `unless` for this.
      Before, the page kept the rule off the right answer by reading the key. The true path does not change
      (the knowledge question is solved at ¶15, the motive question raised at ¶20).
    - *Left of it.* The belief is not put on the timeline as a statement of the doer; it acts only through
      the rule. A witness's `believes` entry defeats the rule the same way, and no case has one yet. The
      threat on that case still names the motive answer (`removes … if`), which the aim could now replace.

120. **The answers still sentences, surveyed (2026-11-22).** Of 50 questions 33 were fully typed and 17 not: four
    yes-or-no questions with only "yes" typed; four "could X have been there?"; two "when"; two "was it written
    when it says?"; five of a kind each (set or accident, where the oil came from, how long gone, what the
    entries are, spite). The user chose the first four kinds, with no new vocabulary, and the five left as
    sentences until a second story needs the same form.
    - *Yes or no.* An untyped "yes" or "no" beside its typed opposite is that opposite's denial
      (`answerStates`); nobody writes it. A circled "no" is now a statement on the page (Mr. Prout not at the
      Anchor when the bell rang, against what he told).
    - *Could X have been there?* "No" is typed as X not there through the stretch. The four hand-written rules
      of the long case that asserted exactly that no longer do: the concluded answer says it.
    - *When.* By the state the deed leaves: the cup not in the vestry when the lamp was lit, or in it (The Last
      Ferry, where the table now rules out "before the lamp was lit" from the cup seen on its shelf); the bale
      in the yard until five, or until half past two and gone by half past three (The Watchman's Clock, where
      nothing follows by itself: that the gate found on the latch means the bale went then stays written).
    - *Was it written when it says?* Both cases (the ledger entry that names a berth opened later, the will
      that speaks of a christening four months after its date) are one shape, a paper that speaks of what was
      not yet so. A new form, agreed by the user: the paper's entry gives its date (`dated`), an entry of it
      says what it speaks of (`speaks_of`), and that thing happened (an action) or began (`begins`) later; the
      answer "yes" has the paper made at its date (`attr: "made"`). The table rules "yes" out from those
      entries linked (`t.dated`). Both written rules are gone.
    - *Yes or no, concluded.* Ruling "yes" out did not conclude "no", since nothing is concluded by elimination
      while "something else" is an answer. In a yes-or-no question where one answer is the other's denial, a
      certain rule-out of one now concludes the other. Where a written rule concludes the answer the table
      does not conclude it on less: the long case asks for the landlord and the potboy both before Mr. Prout
      is taken not to have been at the Anchor, and one of them alone would have done it.

121. **Untyped condition and action entries, surveyed (2026-11-23).** Of 66 action entries 8 were typed, of 69
    condition entries 11; most of the rest are the story's furniture and do no logical work. Those a written
    rule rests on fall into a few shapes. Agreed with the user: the four that existing forms cover now, and
    "could not have done it" (a foot, an ankle, a voice, a height) after a design discussion.
    - *"It has two keys: X's and Y's"* is a statement about everyone else: no key (`of: "*"`, `but` the
      holders, `carrying`, `key`, `neg`). A new table rule (`t.key`) rules out an answer whose deed needs a key
      that such a true entry denies it, from the suspect table's means. The Cellar Door: the written rule-out
      of Ned is gone. The Last Ferry: the taking is now out of a locked place (`take_locked`), and the table
      rules out Bell. The Grey Cloak: typed, and nothing follows (all three answers hold a key).
      The long case's deed needs a key only once the door question is answered "by the street door with a
      key": a role of a question's typed entry may wait on another question's answer (`{thing, if: {q,
      pick}}`, agreed by the user), and the rule then has that question as a premise. The written rule no
      longer rules out the watch, Mr. Garrick and Captain Venn: the table does, and as certain, where the
      written rule was likely and asked for Mr. Prout's word about his own key as well.
    - *Clocks in the long case.* Mrs. Rowe's quarter past one is read by the church clock, typed as half an
      hour slow; her entry is no longer flagged false, and two written rules and three path moves are gone.
    - *"The thing is gone"* is the thing not at the place (cup, bale, ring, cash-box). Nothing follows from it
      by itself yet. Two more ("forced, and the takings gone"; "found open, and four hundred pounds gone") say
      two things at once and name no thing that is an entity; left.
    - *"Told to nobody but X": not typed.* It looked like an absence about knowing, and is not: in The Loose
      Board the lodger knows the hiding-place though he was never told, and that gap is the story. What is
      stated is about the telling; "so nobody else knows" is a default the reader makes, and here a wrong one.

    - *"Could not have done it."* Put to the user: the entry names the kind of deed it prevents; or deeds name
      what they need of a body and people have or lack it; or leave them written. The user chose the first,
      with Kitty's height left written (a comparison of two descriptions, not an inability). On reading the
      cases only one fits: Tanner's ankle (`cannot: ["take_locked"]`; the suspect table's means reads it, and
      the table rules him out, `t.cannot`; the written rule is gone). Marta's voice has no rule resting on it.
      Mr. Pell's foot prevents no deed: it keeps him where he was, and answers "could he have been on the
      quay?", which would need "who cannot walk stays where he was last placed", a rule with one user. Left.

122. **Agreement taken for the player, and withdrawn (the user's rulings of 2026-11-23).** Asked whether an
    answer should be only likely where it rests on what is uncertain, the user said yes; that was built already
    (the five trust levels; finding 115: confirmed is earned, by a question solved or by the offer where two
    independent sources agree). Asked whether the page should take that offer itself, the answer put to the
    user and agreed: as a setting, off by default. An agreement is evidence and not proof, and deciding which
    side of a clash gives way is the game; but the page already confirms what a solved question rested on, so
    the setting is no new kind of thing.
    - Settings, "Confirm what two independent sources agree on": the page takes each offer as it appears, and
      says so in a note.
    - A statement confirmed by an agreement remembers what bore it out (`trust.agreed`). When that other
      statement is later held unlikely or ruled out, it is held likely again, with a note, unless a question
      solved rests on it. This holds whether the offer was taken by hand or by the setting.
    - What testing in the browser caught: the offer's button must not carry `data-fact` (the page's own click
      on an entry takes it first).

123. **Open points ruled, and two small items (2026-11-23).** Put to the user with a recommendation each, and
    agreed:
    - *A key denied makes an answer unlikely, not ruled out for certain* (all cases; `t.key` is `likely`):
      "there are two keys" says who holds them, not who used one. The Telegram Signed M turns on that.
    - Left as they stand: "Was Mr. Prout at the Anchor?" asks for the landlord and the potboy both; Dinner at
      Larch House is solved at ¶4, as likely; the typed belief acts through its rule and is not on the
      timeline.
    - *The suspect table's rows.* It had a row for everyone a "who" question could be answered with, the
      narrator and the witnesses among them. Now: the answers the story names, those the player has marked,
      and anyone else of whom an entry shown says something.
    - *"Left to try"* counted the story as a paper, and a blind solver read "1 paper to read" as a paper
      blocking the story (finding 117). The story is now named apart: "the story to read on · 1 paper to read".
    - Left for a story that needs them: the "stated want" motive (a form with no case), and a place with more
      than one door.

124. **A room with two doors: The Garden Room (2026-11-23).** The user asked for one or two new miniatures for
    the two forms that waited for a story, and chose one each, this one first (it needs the engine). A watch
    goes from a room with a passage door and a terrace door; the narrator had the first in sight from four
    until eight, the gardener the second from four until dusk; the lure walks past the terrace door for an hour
    while it is watched, and sits with the narrator once it is not.
    - *The narrowing by doors* (`deedTimes`). Each way into the place (`joins`) is closed for a stretch by its
      door seen shut or locked throughout, and every way at once by everyone denied the place; a stretch is
      closed when every way is. Everyone denied the far side of a door still closes a place with that one
      door only (a far side that people sit in says nothing of the door). So neither witness's watch closes
      anything alone, and the two together close four until dusk.
    - *"The door did not open", not "nobody went in".* With people sitting in the passage and walking on the
      terrace, an absence about the place would be false; what each witness vouches for is the door, the form
      The Rent Box has for a watched door.
    - The answer is concluded by one written rule, as likely; the table rules the lure out
      (`t.when`, from the two doors and his place after dusk).

125. **A stated want: The Prize Marrow (2026-11-23).** The second of the two miniatures, for the held goal (a
    motive stated outright, `goal` on an entry of the suspect), a form built with the suspect table and used
    on no case until now. A prize marrow is slashed the night before the show; the shed has no lock and three
    were there alone, so opportunity decides nothing; each of the three has told the narrator that week what
    they want.
    - *Three wants, not one*: a single stated want in a short story would read as a hint; one each reads as
      description.
    - *What the deed did* is typed as the act's effect (the case's own act, `spoil`: the thing kept off the
      show bench), and the owner's want is that very state: the table shows his motive from his own words.
    - *The lure is typed too*: the rival gains the cup (`gives` on the marrow's entry), so the table shows a
      second motive, and does not choose. He had said he would not have the cup that way.
    - *What it showed of the form.* A motive contradicts nothing, so the page concludes nothing from it: the
      conclusion is two written steps, likely. The miniature puts the want in the table and removes no
      written reasoning. A want the deed denies (the rival's fair win, the wife's cup for her husband) has no
      typed form; it is the reader's step. Put to the user, who agreed to add it: a want says what it
      needs (`goal.needs`: states), and where the deed brings about the opposite the suspect table marks motive
      against ("it undid what they said they wanted") and the table makes that answer unlikely (`t.want`).
      The written step that set the rival and the wife aside is gone; the rival's row shows both his gain and
      the want it undid.

126. **The autoplay stopped on a cross the evidence does not make (2026-11-23, found by the user).** Playing The
    Prize Marrow as first published, the autoplay stopped at "Crossing out George Pask: the mark did not take".
    With the answers marked from the evidence, the page's default, a mark is the page's to make, and nothing
    then ruled him out. The checks had not caught it because they ran the autoplay only with the answers
    marked by hand. Run the default way on every case, The Loose Board stopped too, at a cross of "something
    else", and had done since the default changed (2026-11-19).
    - The autoplay passes over a cross the evidence does not make (it is the reader's own judgement, which
      that mode has no place for); a circle that does not follow still stops it, as a defect of the case.
    - `page-checks` now plays the autoplay with the answers marked from the evidence too, for every case with
      implications.

127. **The autoplay closes the floating notices (2026-11-24, the user's remark).** Watching the autoplay, the
    notices at the bottom right ("Solved", a link that no longer fits, answers given away) stayed up and covered
    much of the page; only two were closed, and one of those only where papers are earned. Now after every move
    and every paragraph read each one showing is said in the autoplay's caption for a moment and then closed.
    The gate's notice is hidden too, unsaid: it says the story waits for an answer, which the autoplay is about
    to give.
    - *The strip under the header* (the user's design, the same day). It floated over the foot of the page.
      The user thought of the header and saw the cost: a caption of changing length would shift everything
      under it. So: a strip of the page's width under the header, in view as the header is; a row of the
      controls and the caption on a row of its own, one line cut short by default. A click on the caption
      goes between one line and all of it, and the choice is kept on the device (the user's ruling: a toggle,
      not a passing look). The opening line and a stop are shown whole whichever is chosen. The panels that
      stay in view start below it (`--ap`, `--head`, measured). The same at a phone's width, where it had sat
      above the header.

128. **No step without the cursor (2026-11-24, the user's remark).** With the answers marked from the evidence, a
    circle or a cross of the path is not a click: the page made the mark when the link before it was made, or
    (a cross that is the reader's own judgement) leaves the answer open. The autoplay said "Crossing out…" and
    nothing moved; in The Prize Marrow that was three steps of seven. Now it goes to the answer and marks it
    for a moment without pressing it, and the caption says what happened: "The page has crossed out … : it
    follows from what is linked", or "… stays open: the page crosses out only what the links rule out", each
    with the path's reason.

129. **Blind runs of the two new miniatures (Haiku, 2026-11-24).** Both solved, both circles right.
    - *The Prize Marrow: 15 turns, $0.018.* Read to ¶5, linked the owner's want first ("Abel's own words…"),
      then the wife's and the rival's, saw the page cross those two out, linked what the slashing did, and was
      done. Nothing went wrong, and nothing was hard: the answer was read off the three statements as soon as
      they were all in view. The form works; the miniature is the easiest of the set.
    - *The Garden Room: 39 turns, $0.073, of which 28 stuck.* Two things.
      It had the right answer circled at turn 8, before reading the gardener's paragraph: from ¶3 alone
      ("Philip was not seen again; Mr. Farrant was with me") it set Mr. Farrant aside by the passage door and
      never weighed the terrace door. The lure arrives a paragraph after the reader has made up their mind,
      so it lures nobody.
      Then it could not get the question solved. It linked "the terrace door is shut", was told the link does
      not count until trusted, trusted the statement, then trusted Dunn as a whole, and still nothing
      followed, for twenty turns, until it happened to link "Dunn at the terrace": the observation needs both
      entries linked (finding 124), and nothing on the page says which other entry is wanted. The cost of the
      two links was put to the user as a question when the case was written; this is the answer.
    - *Mended (agreed with the user).* A link trusts its entry as likely, and now also the entry that entry
      rests on (`seen_from`), in every case: one link is enough for a witness's watch, and distrusting where
      the witness was still lowers what they saw from there. The Garden Room's observation of the terrace door
      is from the one entry again. And the story is reordered: the gardener speaks (¶3) before the narrator
      says where the two men were after dusk (¶4), so that the reader meets Mr. Farrant at the terrace door
      before anything points at Philip.
      A second blind run after both: 11 turns, $0.017, never stuck. It read the gardener first, tried to link
      "Dunn at the terrace" by itself (refused: it shows nothing alone), read on, and linked the four entries.
      One run of one model: it shows the obstacle is gone, and little about whether a person is lured.

130. **The next direction, planned with a session in Archipelago-CC (2026-11-24).** The user put three projects: a
    story whose logic is all typed data; choices the player character makes in the present; the rest of the
    Archipelago integration. A second session read Archipelago-CC (`origin/main` `a5f7c6caf4`; it ran nothing) and
    the two exchanged findings.
    - *What was measured here.* 52 answered questions in the 20 cases have 112 written rules, 54 of which conclude
      an answer; 2 questions are concluded with no written rule; 223 observation sentences are written. The main
      obstacle to "the answer follows from the typed data alone" is that "something else" is always an answer, so
      nothing concludes by elimination. Condition values are free strings matched by equality.
    - *The Prize Marrow from its typed entries alone, on paper.* The page's `phrase` already words a typed entry,
      so a story by templates keeps the logic whole and loses the `detail`s and the voice. Dry, and playable.
    - *What Archipelago-CC has.* The world on `mystery-world`, not merged, built from the export of 2026-11-15.
      Pack concepts hold a kind, a name, a look and whole-sentence slots: no affordances, no grammar, no relations.
      Action Nodes is built: a node is one action with a time cost, minimum requirements, results, a limit per
      loop and alternative sets of nodes to be cleared first; the pool is the loop's time. A requirement can only
      be a minimum, so "only before six" cannot be said. Its core is plain JavaScript with no DOM. Loops is
      general, and that app's own machinery.
    - *The user's rulings.* The Archipelago integration first. The simplest version of each project first, then
      towards the complex ones. The concept library is to be extended with whatever the game needs, with entries
      for the stories that are integrated. Action Nodes is to be extended so that time is the resource, with
      actions available only in given ranges of time. At least one new case for the new mechanics. Agreed as
      recommended: a typed "nobody but these" may let the page conclude by elimination; present-time choices begin
      as visits on a budget of time, shown in the story panel, each bringing a paper; a reset keeps everything
      learned, and it counts as evidence; the present does not react to the hour or to choices in the first
      version. The order after the integration: a checker that says which answers follow with the written rules
      taken away, present-time choices on a new miniature, then a typed miniature or prose by a model.
131. **The page's half of the bridge (2026-11-24).** Built as `docs/case-format.md`, "Played in an Archipelago",
    describes. Measured: The Custom-House Fire's true path plays to the end against the stand-in host
    (`BRIDGE=1 ANSWERS=evidence CASE=cases/custom-house-fire node scripts/path-check.mjs`: 112 moves, the host
    with all 25 solved questions checked, 68 seconds), and across two windows the page takes its papers from the
    framing host and stops at a host of another version.
    - *Two keys added to `mystery:state`*, agreed with the other session: `game` and `version`. Without `game` a
      save would be carried from one multiworld into the next and send its solved questions as checks at once.
    - *The same generated game hosted twice* has the same `game` (the seed's name identifies a generation, not a
      room). The only sign is a host that lists nothing solved while the save does: the page asks.
    - *A small client of its own*, not a copy of the web client's adapter: some ninety lines, with no dependency
      on the other repository, and tested against the message shape that adapter accepts.
    - *The round trip with the real host (the same day, reported by the Archipelago-CC session; its branch
      `mystery-world`, tip `577ae2af55`, not merged).* The world was rebuilt from the export at version
      `d3081189acf2`, and the host module written (`frontend/modules/mysteryArchipelago/`). With a real
      Archipelago server, the web client and this page served from another origin: the page asked for the state,
      was answered `connected: true` with `game` `<seed name>:<team>:<slot>`, held the four papers of the start
      and one a stand-in page had earned in the same room, and kept its save under that game. The web client's
      frame panel adds `iframeId` and `hostOrigin` itself, so a player's address needs only `?case=`. Not seen
      there: a solve made through this page's own controls (that is checked here, against the stand-in host).
    - *Landed (2026-11-25, reported by that session):* the world at version `afed4c87068e`, the host module
      (off by default) and a "Mystery Game" panel that frames this repository's Pages site are on
      Archipelago-CC's main. From here on a push that moves a case's version makes the published page refuse the
      committed world until it is rebuilt and landed there again: tell that side before such a push.
    - *Left:* a frontend submodule in place of the Pages address (the user's wish, for later), and the window
      adapter tried against the real one. Left here: hints that cannot stall a multiworld are as
      they were (the hint check plays alone).

132. **What follows from the typed data alone, measured (2026-11-24).** `node scripts/typed-check.mjs [-v] [<dir>...]`
    takes each case's written rules away and leaves the rules the engine makes from the typed forms, with every
    observation shown and every other question taken as solved. It changes nothing and fails nothing.

    | | Questions | The answer follows | …if the list of answers is closed | Wrong answers ruled out | Written rules (conclude, rule out) |
    |---|---|---|---|---|---|
    | The Custom-House Fire | 25 | 3 | 8 | 15 of 36 | 27, 16 |
    | The 18 miniatures | 27 | 1 | 15 | 18 of 33 | 27, 19 |
    | All | 52 | 4 | 23 | 33 of 69 | 54, 35 |

    - *Read as (before finding 133):* 4 answers follow today with nothing written; 19 more would follow by elimination if "something
      else" could be ruled out, which is what a typed "nobody but these" is for. That column is an upper bound: it
      assumes every such case states that its list is complete. Half the wrong answers (36 of 69) still need a
      written rule.
    - *Where nothing typed bears at all:* The Grey Cloak, The Lamp-Keeper's Word, both Rent Box cases and The Ring
      on the Bench (a comparison of descriptions, a changed word, a lie as evidence, a route). In the long case 17
      of 25 questions do not follow even with the list closed; `-v` names, for each, the answers not ruled out and
      the written rules that carry it. That list is the work list for typing.
    - *What it does not measure:* the observations are still written (the typed rules start from an observation's
      entries), and so are the prose and the quotes.

133. **The list of answers closed by "nobody but these" (the user's ruling of 2026-11-24).** Put to the user: from
    the forms that exist (a statement about everyone that denies the deed to all but people among the answers), or
    a mark on the question naming the entry that says its list is complete. The user chose the first, as likely
    only, with the second kept back for a question the first cannot reach.
    - *Built* (`t.closed` in `tableRules`): a true statement about everyone that denies what the deed needs of
      its doer (a key, or its place through the whole window) to all but people who are among the answers rules
      "something else" out, from the observation of that entry.
    - *It reaches two questions today.* The Telegram Signed M. ("who was waiting at the mill": the night book's
      "nobody but Mr. Grove: a key") and The Custom-House Fire's goal (the two keys, once the door question is
      answered "with a key"). Both now follow by elimination with the written rules taken away: 6 of 52, from 4.
      The other 17 that would follow with a closed list state no such thing in a typed form yet.
    - *It changed the long case's Archipelago logic, and the version did not show it.* The goal can now be
      reached without "What Mr. Prout told me". The version was a hash of `structure.json` and
      `implications.json`, and neither had changed: a rule made by the engine from typed forms is in neither. The
      version now covers the exported logic too, and the page reads it from the case's `rules.json` (now
      `afed4c87068e`), which a test keeps the export. The world in Archipelago-CC has to be rebuilt from it.
    - *The heartbeat* (reported by the other session, measured there): the web client drops a framed page it has
      not heard from for a minute, so a solve after the first minute and a half would not have reached the server.
      The page now sends one every half minute, and greets the host again if told it is no longer registered.
    - *The window adapter* (the user: try it beside the frame): with `?windowId=` the page talks to its opener.
      Not yet run against the real one.
    - *Checked:* The Telegram Signed M., every page check; the long case's true path alone and against the
      stand-in host.

134. **Visits in the present, and a day that begins again: The Same Monday (2026-11-24).** The first version of
    choices the player character makes, as ruled (finding 130) and with the user's three further rulings: a time
    loop stated plainly in the story; a visit may wait on something known from any day; a miniature of five visits,
    a day that fits three hours of them, one pair in order, one question.
    - *Built* (`docs/case-format.md`, "Visits in the present"; `guide.html`, "Visits, and a day that begins
      again"). A visit is a file that comes by going there. The day's box is under the main story. Ending the day
      keeps everything; an entry of an earlier day is marked "day N" and its detail names the visit. Not grey: on
      this page grey already means uncertain, so the mark is a small tag and a muted phrase.
    - *The case* (`cases/miniatures/same-monday`): a chart gone from a locked office; the office (1 hour), the inn
      (1), the watchman (2, after the inn the same day), the pilot (1, once the office is read), the chandler's (1,
      once the pilot is read): six hours of visits in a day of three, so two days at least. The first day's
      natural road (office, pilot, chandler's) ends on one man's word against another's; the second day's (inn,
      watchman) settles it with what the first day found.
    - *What the typed data did unasked:* the Captain's stay at Marlow rules him out (an alibi through the window),
      the pilot's "I was without it" makes him unlikely (a key denied), the clerk's "in my bed" clashes with the
      watchman, and the pilot and the watchman are two sources that agree. One concluding rule is written.
    - *Checks.* The true path has `visit` and `day` moves; the path check, the autoplay in every layout, the hints
      and the player who only tries things all play it to the end (`CASE=cases/miniatures/same-monday npm run
      page-checks`). The trying player makes each visit once, makes first what another waits for, and ends the
      day when nothing fits (three days, by its order). Where files come by visits the page checks no longer try
      every order of reading them (720 for five files): the order is the path's.
    - *Seen by eye and mended:* "has" for a key denied to one person now reads "is without"; the line "one more
      paper may come as the story goes on" no longer counts visits.
    - *Not in this version, as ruled:* the present does not react to the hour or to what was done; no windows of
      time; nothing in an Archipelago (a visit's file is not an earned paper). Not yet done: a blind run, and the
      user's own play.

135. **A blind run of The Same Monday (Haiku, 2026-11-25): solved, 112 turns, $0.22.** Two days, by the road the
    case was written for: the office, the pilot and the chandler's on the first; the inn and the watchman on the
    second. The answer right; the pilot crossed out by his key, the Captain by Marlow.
    - *The mechanism was understood.* It made its first visit at turn 1, read each scene, ended the first day
      itself once nothing fitted ("Wake again on the same morning"), and on the second day went to the inn, which
      it had not seen. It never took the day's end for a loss.
    - *Some 60 of the 112 turns were stalls of one kind: it did not go back to the day.* After reading the office
      (turns 9 to 29) it re-opened the same paper and the suspects' cards with two hours of the day unspent; after
      the inn (turns 58 to 99) it did the same with the watchman on offer. On about half of those turns the day's
      box was not in its view at all: it is drawn under the main story only, and the solver was on a paper's tab.
      On the rest it was in view and passed over: nothing on the page says that a visit is waiting, as it says
      of an unread paper. Put to the user.
    - *A false lead of its own:* the clerk's "from seven" left "six to seven" unaccounted for, and it looked for
      that hour for forty turns. Nothing in the case speaks of it; the watchman's eight o'clock ended it.
    - *Noise:* a "who" question offers everyone met, so the landlady, the watchman and the narrator stood as open
      answers until the end.
    - *Mended at once (wording only):* a key denied reads "is without a key" (it read "has not a key"); the
      chandler's is named in the scene there, so the clerk's "in my bed" is not "at a place"; the first paragraph
      names the harbour office in full (the timeline had "The office").
    - It asked for the Hint, which a blind solver is not given.
    - *Mended on the user's ruling (2026-11-25):* the day's box is under whatever is being read, the story or a
      paper; and "Left to try" and the gate's notice name the visits not made yet.
    - *A second run after that (Haiku, the same day): solved, 49 turns, $0.09, never stalled.* It went from
      scene to scene without returning to the story's tab (office, inn, pilot on the first day), ended the day
      when "the last visit is unaffordable", and named "the unmade visits" in its own notes. It took another
      road than the first run (the inn on the first day) and needed three days' worth of visits for it. One
      oddity: with the watchman needing two hours and one left, it pressed "End the day" three times running,
      so the watchman was woken on day five; a day ended with nothing done is not remarked on by the page.
      One run each: it shows the stall is gone, and little more.

136. **The user's rulings on time in Action Nodes (2026-11-25; given in Archipelago-CC and relayed here by its
    sessions, so at second hand).** The design is `NewDocs/plans/actionnodes-time-design.md` in that repository.
    - A window counts from the time spent this loop; arriving early waits, and the wait costs time; the start
      decides whether an action is in its window. An item may lengthen the day, not start it earlier.
    - Knowledge that gates an action across loops (this page's `needs: {read, solved}`) goes into the first slice
      built there.
    - The first timed world there is The Same Monday.
    - An entry of an earlier loop carries a "loop N" or "day N" tag, as this page has it; grey stays "uncertain".
    - History, in the user's words: "just a list of which things have been done in at least one previous loop",
      then, as a next step, for each completed action the actions of the loop where it was first completed, and
      "a way to indicate, on the action node, whether it has been completed before". This page has the last
      ("done before, on day N") and keeps every day's visits in the save.
    - Nothing beyond windows yet for a present that reacts.
    - *The first timed preset (ruled there 2026-11-25, and to this session the same day):* The Same Monday under
      its own name, with its people, places and paper titles; each visit made a check, the five scenes the
      items, shuffled across the five visits; the goal the question, which needs the office, the inn and the
      watchman. "Shuffled now, setting later": a choice between that and each visit keeping its own scene is a
      later slice. This page does not yet connect visits to an Archipelago.

137. **A story told from its typed data: The Prize Marrow again (2026-11-25).** The simplest version of "all text
    derived from typed data", as the user asked: a script and templates, no model.
    - *Built.* `engine/tell.js` gives one sentence for a typed entry by its form (a role, a state, a place, a
      thing carried, a typed act, a stated want with what it needs, a gain, a confession, a deed with its doer
      unknown); `scripts/tell-story.mjs <dir>` writes the story from `world/telling.json`, which says only the
      order, and writes back what follows from the text (`docs/case-format.md`, "A story told from its data").
      The case is `cases/miniatures/prize-marrow-typed`, a copy of The Prize Marrow with the same logic.
    - *How it reads.* "On Friday, after dark, somebody spoiled Abel Crouch's marrow at Abel Crouch's shed. On
      Saturday, Abel Crouch's marrow was kept off the show bench; by that George Pask gained the cup." And a want:
      "On Friday morning, Abel Crouch said to me: 'I want my marrow to be kept off the show bench.'" Dry, exact,
      and playable: it validates, and the true path, the autoplay, the hints and the player who only tries
      things play it to the end. 190 words against 270.
    - *What is no longer written by hand there:* the story's text, every quote, each `says` entry's value, what
      each observation says, where each time, question and answer is first told, the give-away, and the list of
      names. A test holds all of it to the script, and another that the story has no sentence that is not an
      entry's, a deed's or a question's.
    - *What still is:* the order of telling; the names and the time labels; each state's value as a phrase that
      reads after "was" ("kept off the show bench", "the cup's winner three years running"), which the engine
      still matches as a string; the question's label; the past form of the case's act; the one concluding
      rule's sentence; the true path's reasons (`why`); and `structure.json`.
    - *What was lost against the written story:* everything in `detail` ("alone there for a time", which is the
      story's reason that opportunity decides nothing), the voice ("I would not give a button for the cup any
      other way"), the slashing itself (the deed is "spoiled", the case's typed act), and why Abel wanted it
      ("his is the bigger this year"). None of it is logic the page checks; some of it is what makes the answer
      feel earned.
    - *The one piece of grammar:* in a speaker's own words what is theirs by name is "my". Everything else names
      each thing in full every time, with no pronouns: the concept library has no such slots either (finding 130).
    - *A blind run (Haiku, 2026-11-25): solved, 20 turns, $0.027, the answer right, never stuck.* Against 15
      turns and $0.018 for the written story. It read to the fifth paragraph, linked the rival's want and the
      wife's first ("it bears on who gains"), saw the page cross them out, then linked the rest, the owner's want
      and what the deed did among them, and was done. The generated sentences were read without trouble; its
      notes restate them correctly. What differed: it linked nearly every entry (9 links, against 4), where the
      written story's solver linked the three wants and the deed. The telling gives each entry the same weight,
      so nothing marks which bear on the question. One run each.
    - *Not done:* prose by a model from the same data (the next version up); a telling for a case
      with papers, tellings or false statements, whose forms the templates do not have yet.

138. **Prose by a model from the typed data, and audited: The Prize Marrow a third time (2026-11-25).** The next
    version up from finding 137, as the user asked. The case is `cases/miniatures/prize-marrow-prose`.
    - *The process* (`scripts/prose-story.mjs`). The writer (Sonnet) is given only the templates' sentences,
      paragraph by paragraph, each with its key and its time, and one line of style; it returns each paragraph as
      prose and, for each entry, the words of its prose that state it. The script holds it to what a script can
      check: every entry quoted, every quote in its paragraph word for word, every time told, the same
      paragraphs, no paragraph copied from the notes, no name in full more than twice in a paragraph. Then two
      readers audit it: one reads the prose alone and lists what it states; the other sets that list against the
      typed sentences and reports what is missing, changed or added, an addition as colour or as fact.
    - *What it wrote* (194 words; the templates' text has 190, the hand-written story 270): "Abel Crouch's marrow
      had won the cup three years running. After dark on the Friday, somebody spoiled it at his shed." "On Friday
      morning Abel said to me, and plainly, 'I want my marrow to be kept off the show bench.'" Pronouns, short
      names, the days as a villager says them. The audit: 19 statements read, all 15 meant stated, none changed,
      nothing added. The case validates and passes every page check.
    - *The instructions mattered more than the model.* The first prompt was a list of rules, and the writer gave
      the notes back word for word, twice; told only not to copy, it changed a word a sentence. What worked was
      saying what it is free to do (pronouns, short names, joining and ordering, the narrator's voice, a
      speaker's own manner), with one example pair from another story, beside what it may not.
    - *The audit was tried on a spoiled copy:* one statement taken out and "with a pruning-knife in his belt"
      put in. It reported that statement missing and that addition as a fact, and nothing else.
    - *What the prose still is not:* the hand-written story. It carries exactly the typed entries, so it has no
      "alone there for a time", no "his is the bigger this year", no button. The voice is one "and plainly". A
      model may add only what tells nothing, and in so short a story almost everything tells something. A richer
      story needs richer typed data (reasons, manner, what was seen), not a freer writer.
    - *Names on the page.* The writer lists the forms of each name it used; "it", "his shed" and "my marrow" came
      back as forms too, and would have marked every "it" as the marrow. Only a form with a word of the entity's
      own name is kept.
    - *Cost:* about $0.06 a run of the writer and the audit; $0.32 in all with the failed prompts and the spoiled
      copy. One writer, one case.
    - *Not done:* a blind run of this version; a second writer or model to compare; the observations' sentences
      are still the templates' (they are card text, and stay exact).

139. **A larger case told from its data: The Same Monday (2026-11-25).** The test the user agreed to: does the
    typed route hold beyond the easiest case? The Same Monday has what The Prize Marrow lacked: five scenes that
    come by visits, four witnesses, a false statement, two sources that agree, stretches of time, a deed with a
    key. The case is `cases/miniatures/same-monday-typed`, the same logic and the same true path.
    - *What the templates gained* (`engine/tell.js`, `scripts/tell-story.mjs`). A telling for each file. What a
      witness's account holds is told as that witness's speech, in the first person ("Amos Trew told me: 'At four
      o'clock on Sunday, I lent the second key of the office door to Silas Finch.'"), and the `tells` entry is
      the telling. A stretch of time ("From … until …"; for a deed "Between … and …"), and the word a time's
      label follows (`prep`). Belonging, lodging, a typed act done to someone, the past forms of the engine's
      own acts. The day and its beginning again, from `delivery.day`. An answer first named by an entry's value
      or by whom a thing is done to.
    - *It held.* 352 words in the story and five scenes, against 464 written by hand. The case validates; the
      true path, the autoplay, the hints and the trying player play it through two days; the engine derives the
      same two rule-outs (the alibi, the key denied).
    - *What typing it forced, and each is a gain.* The two keys became things with owners ("the first key of
      the office door belonged to Captain Dunmore"), so the pilot lends and the clerk is seen with "the second
      key", where the written story had "the pilot's key", a phrase. The Captain locking the door became his
      act. The watchman's being the watchman became an entry. The clerk's confession became a `says` that
      asserts the answer.
    - *What was lost:* the coach's horn, the brass tally by which the watchman knows the key, the lead-line the
      key was lent for, "in my bed over the shop", the sea-chest and the Marlow shipowner. The tally is the one
      that is logic of a kind: it is why the watchman's word about the key can be believed.
    - *Still written by hand in this case:* the order of telling; the names and the time labels with their
      `prep`; three state phrases ("locked, with its lock not forced", "fitted with two keys and no more", "lit
      within"); the question's label; the sentence of the one observation that comes from a lie disbelieved,
      and of the two written rules; the true path's reasons; the visits' labels; `structure.json`.
    - *What the templates still cannot tell:* a statement about everyone ("nobody but"), a clock that is wrong,
      a paper's own properties, a reasoning move's entry, a room. Each is a form some other miniature uses.
    - Not done: a blind run; prose by a model for a case with files (`prose-story.mjs` writes the main story
      only).
    - *What a witness knew it by, typed (the same day).* The brass tally was the one loss that was logic. A
      statement may now name the entry of what its witness knew the thing by (`known_by`), as an absence names
      where its witness was (`seen_from`): it is trusted no further than that entry, a link to a question
      trusts both, and the detail says "Rests on what its witness knew it by". In the typed Same Monday the
      narrator finds at the office that "the second key of the office door was marked with a brass tally", and
      the watchman's sighting rests on it: "Silas Finch had the second key of the office door. I knew it by
      this: the second key of the office door was marked with a brass tally." Put to the user as the first of
      three next steps and not objected to; the richer form (the witness describes a key with a tally, and
      which key that is stays the reader's step) is not built.
    - *A check that failed once and not again:* The Garden Room's hints check ("the same hint three times
      over" at ¶4) in one run of three side by side with other checks, with and without this change. Unexplained.

140. **Visits in an Archipelago: the page's half (2026-11-25; the user: this is now the priority).**
    - *Where the day is played.* In the multiworld's client, in the Action Nodes world built there for The Same
      Monday (each visit a check, the five scenes the items, shuffled). This page is the case's other half: the
      story, the papers held, the timeline and the question. That is "a case does not know its spine": the
      substrate is the spine.
    - *Built here.* Framed, a case with visits takes its scenes from the host's `papers`, makes no visits and
      shows a line in place of the day's box; the host's `loop` is its day; the question solved is sent as for
      the long case. `scripts/export-visits.mjs` writes `visits.json` for a case with visits (the day, the
      visits, the papers, what the goal's answer needs by the case's own logic, a version): the page reads its
      name and version there, and it is the file the other side can build its graph from.
    - *Checked.* Both versions of The Same Monday play their true paths against the stand-in host, which gives
      each scene as its visit would find it and counts the days, and ends with the question checked; the page
      checks now play every earned case and every case with visits once this way.
    - *What the other side has and lacks* (its session's answers, the same day). The preset exists
      (`action_nodes_same_monday`): the five papers as items under their titles, the five visits as checks, the
      goal an ordinary location named by the question, its rule the office, the inn and the watchman. It carries
      no `slot_data.mystery` (the Action Nodes compiler writes no slot data), so the bridge module there cannot
      serve it yet; the goal is reached there by performing its node, not by a check from this page; and the
      loop number exists in its runtime but is not sent. All three are a follow-up slice there. Until then the
      pair is not playable together.

141. **The pipeline's run records moved to a repository of their own (2026-11-25; the user's decision, given in
    Archipelago-CC and confirmed here).** Archipelago-CC is to take this repository's `main` as a submodule, and
    its Pages deploy uploads a submodule whole: `v2/pipeline/runs` was 6,464 tracked files that nothing in the
    main tree reads. They are now at `PeerInfinity/mystery-clue-game-pipeline-runs` (public, one commit, a README
    saying what they are); here the folder is ignored, and cloning the archive into it makes the archived
    pipeline usable again. No history was rewritten. No case and no version changed.
    - *Also ruled there, for later (relayed):* the mystery becomes a substrate of its own, one case one region
      to begin with; reading a case is free from a menu at any time, answering only in that region; what
      depends on time is Action Nodes' to handle; the page will need a read-only mode. Nothing of it is asked
      yet.

142. **The missing forms, one miniature at a time: The Last Ferry told from its data (2026-11-25).** The first
    of the forms finding 139 listed as untold. The case is `cases/miniatures/last-ferry-typed`, the same logic,
    the same true path, two questions.
    - *What the templates gained.* A statement about everyone ("Nobody but me and Amos Dunn had a key of the
      vestry door"). A time that is an event and not a clock time (`clause`: "When the gate lamp was lit, the
      christening cup was at the vestry"; "From when the ferry cast off on Sunday until eight o'clock on Sunday,
      Silas Bell was at the ferry"). A question whose answers are no entities, offered in its own words ("Was the
      christening cup taken before the gate lamp was lit, or after the gate lamp was lit?"), and a confession of
      such an answer ("It was after the gate lamp was lit."). A deed told without its time, where the time is
      the other question.
    - *It held:* 286 words against 328; it validates, and the true path, the autoplay, the hints and the trying
      player play it through. The engine derives what it derived for the written case.
    - *What typing it showed about this case.* That the ferry was in mid-river when the lamp was lit was a
      sentence of the boatman's; the typed case says it twice, as the stretch he was aboard and as where he was
      at that moment, and the order of the two events is otherwise only the order of the time points. "Went out
      at the lych-gate with a sack over his shoulder" became a place and a thing carried. The quarrel over the
      pew rents, the spectacles, the coke in the boiler-house and the pawning went: none of them typed, none of
      them logic the page checks; the quarrel is the suspect's motive and would be a `tie`.
    - *What the checker says of it* (`typed-check.mjs -v`): both answers would follow by elimination if their
      lists were closed, and neither is. "When" has "something else" beside its two answers though they are
      each other's denial. "Who" has a "nobody but" that excepts the narrator, who is no listed answer, so
      `t.closed` does not take it (finding 133). Both are candidates for the next typing step, and both are
      rulings for the user: whether a question of two answers that deny each other needs "something else", and
      whether a narrator excepted by "nobody but" counts as accounted for.
    - *Still untold:* a clock that is wrong, a paper's own properties, a reasoning move's entry, a room, two
      narrators.

143. **Two more answers that follow by themselves (the user's rulings of 2026-11-25, on the two points of
    finding 142).**
    - *A question of two answers that deny each other.* Where a question has two answers besides "something
      else" and their typed forms are one state and its denial, a certain rule-out of one concludes the other,
      as it already did for yes and no (finding 120). The Last Ferry's "before or after the lamp was lit?" now
      follows from the lamplighter's seeing the cup, with no written rule.
    - *A narrator excepted by "nobody but".* A statement about everyone that excepts the narrator still closes
      the list of answers (finding 133): the one telling the story is taken as accounted for. Likely only, as
      that rule is. The Last Ferry's and The Cellar Door's "who" now follow by elimination.
    - *Measured* (`typed-check.mjs`): 11 of 58 answers follow with the written rules taken away (6 of 52 before
      the six new cases and these two rules); 29 would with every list closed; 43 of 79 wrong answers are ruled
      out by the typed forms. The long case is untouched: its export, and so its version, did not change.
    - *Checked:* every page check on the 23 miniatures.

144. **A wrong clock told from its data: The Stable Clock (2026-11-25).** The second of the missing forms. The
    case is `cases/miniatures/stable-clock-typed`, the same logic and true path, two questions.
    - *What the templates gained.* A time read by a clock ("At a quarter to nine on Thursday by the stable
      clock, somebody fired a shot through the window of Sir Giles's study"). A doer unknown inside a witness's
      account. An answer that is the time of an event, offered where a witness tells the event at that time.
      "Yes" and "no", offered in the question's words, and confessed as the state the answer stands for ("At
      nine o'clock on Thursday, I was not at the library.").
    - *It held:* 255 words against 266; it validated at the first try, and the true path, the autoplay, the
      hints and the trying player play it through. The clock's being slow still restates the gardener's reading
      as the page did for the written case, and the checker gives the two cases the same result.
    - *What typing it showed.* The shot, the leaving, the counting and the looking became acts of the case's
      own, each with a past form: four words an author supplies ("fired a shot through the window of", "left",
      "counted the strokes of", "looked at"). The witnesses' own whereabouts had been entered at the true time
      of the shot, which in the gardener's mouth would have contradicted his quarter to nine: he is now "at the
      lodge from Thursday evening", and looks at the clock at the time he read by it. The data had been right
      for the engine and wrong as speech; the telling found it.
    - *What was lost:* the game of chess, the letter to write, the bullet above the chair where Sir Giles sits
      (the story's reason to care), the watch carried across the yard on Friday, the garden door and the
      revolver. And one piece of logic: the story shows the stable clock slow on Friday morning by a watch set
      by the hall clock; the typed case only says it was slow. That it was slow the evening before is the
      reader's step in both (finding 119).
    - *Still untold:* a paper's own properties, a reasoning move's entry, a room, two narrators.

145. **A paper's own properties told from its data: The Will in the Bible (2026-11-25).** The third of the
    missing forms. The case is `cases/miniatures/will-in-the-bible-typed`: a main story and one paper, the will,
    which the narrator reads; the same logic and true path, two questions.
    - *What the templates gained.* A paper's date, what it revokes, what it gives to whom, and what it speaks of
      ("In August, the later will gave a silver watch to Thomas Pym and spoke of Thomas Pym as christened"). An
      act with nothing it is done to ("died"). A thing something is in (`prep: "in"`: "in the family Bible"). A
      "no" confessed where the "yes" is a paper made at its date ("On the third of March, the later will was not
      made").
    - *It held:* 272 words in the story and the will, against 288; it validated at the first try and the true
      path, the autoplay, the hints and the trying player play it through. The rule that a paper speaks of what
      was not yet so on its date still fires from the typed entries, and the checker gives the two cases the
      same result.
    - *What typing it showed.* The will as a paper is no longer the will's words: the written case quotes it
      ("whom I held at the font"), and the reader infers that it speaks of a christening; the typed case states
      what it speaks of. That inference was the pleasure of the case, and the typed telling gives it away in the
      telling. A paper told from its data needs its own words kept as a quotation beside the typed reading, or
      the reading left for the reader to make.
    - *What was lost besides:* the font, the mother's silver watch as hers, "in her hand as near as he could make
      it", wanting to keep the house in the family (the motive in his own words; the gain is typed), and the
      signature.
    - *Still untold:* a reasoning move's entry, a room, two narrators.

146. **A move for what words speak of: "This speaks of…" (the user's idea and rulings, 2026-11-25).** Finding 145
    showed the typed will giving away its own inference. Asked whether a new player move for following such an
    implication made sense, the answer put to the user was yes, and more generally than this case: the same
    shape, "this description refers to that thing", is a paper speaking of an event (the will; the long case's
    ledger entry that names a berth opened later), a witness describing a thing (the key with a brass tally),
    and two descriptions compared (The Grey Cloak). The user agreed to try it on the typed Will in the Bible, a
    wrong pick simply refused, the reading required for the answer, and the move counted in "Left to try".
    - *Built.* An entry may give its own words (`words`) beside what they speak of (`speaks_of`). The telling
      gives the words ("…gave a silver watch to Thomas Pym, in these words: 'To my great-nephew Thomas, whom I
      held at the font, I leave my mother's silver watch.'") and no longer says what they speak of. The entry's
      detail shows the words and offers "This speaks of…" beside every other entry of the timeline; the right
      one gives the reader's own entry ("the later will, in its own words, speaks of: Thomas Pym was
      christened"), a wrong one the note "Its words do not speak of that". The observation and the rule for a
      paper dated before what it speaks of rest on that reading (`docs/case-format.md`).
    - *In "Left to try"* it is one move ("This speaks of…: the entry"), whichever of the entries it turns out to
      be, and it goes once made.
    - *Checked.* The true path has the move (`s`); the path check, the autoplay in every layout, the hints and
      the player who only tries things (who tries each entry in turn) play the case to the end.
    - *A blind run (Haiku, the same day): solved, 76 turns, $0.135, both answers right.* The move was made once,
      at turn 28, and the first pick was the right one: its note reads "Its words ('whom I held at the font')
      refer to" the christening. It came to it because the linked bequest was reported as part of something not
      yet complete, opened the entry, read the words and chose. So here the move was found by reading and not by
      trying. The date question was solved at once after it; the other forty-odd turns went on "who", as in
      the written case's runs (the housekeeper's and the testatrix's rule-outs are written rules over several
      links). One run.
    - *All the miniatures* pass every page check after the change (25 cases).
    - *Not done:* the long case's ledger entry (it would move that case's logic and version); the two other
      uses (a thing known by a mark, two descriptions compared).

147. **The same move for a thing known by a mark: the brass tally (2026-11-25; agreed by the user as the next use
    of finding 146).** In the typed Same Monday the watchman had said outright that the clerk held "the second
    key of the office door", and how he knew it (`known_by`, finding 139). Now he says what he saw: "Silas Finch
    had a key marked with a brass tally." Which key that is, is the reader's step: at the office the narrator
    finds that the second key is so marked, and "This speaks of…" on the watchman's entry, pointed at that
    entry, gives the reader's own "Silas Finch had the second key of the office door". The question needs it.
    - *What the move gained.* An entry may have `reads_as`, the typed state its reading gives, beside
      `speaks_of`; it need not have `words` (a generated sentence is its own words). The reader's entry is then
      that state, marked as reasoning, and not a bare "speaks of".
    - *What it showed at once:* the reading rested on a witness's word, which is uncertain until trusted, so the
      linked reading did not count and the answer did not follow. A link of a reading now trusts what it was
      read from as likely, as a link of a plain entry trusts that entry (finding 129).
    - *The case is better for it.* The two days now depend on each other in the logic as well as in the plot:
      the office (day one, by the natural road) holds the mark, the watchman (day two) the sighting, and
      neither is evidence against the clerk without the other. `known_by` stays in the format with no case
      using it.
    - *Checked:* the true path (with the move), the autoplay, the hints, the trying player and the stand-in
      Archipelago host, on the typed Same Monday; every page check on the typed Will in the Bible again.
    - *Left of the shape:* two descriptions compared (The Grey Cloak), and the long case's ledger entry.

148. **Two descriptions compared: The Grey Cloak (2026-11-25).** Proposed to the user as the third use of the
    "This speaks of…" move, and built otherwise, since on reading the case the step is not "this description
    refers to that thing" but "this description does not fit that person": the figure was tall and the housemaid
    is short. That is a contradiction under a hypothesis of who the figure was, which the engine already had for
    whereabouts ("if the figure was Dr. Mott, he was in two places").
    - *Built.* A typed state for height (`stature`: tall, short), and an identity now carries a typed state as
      it carries whereabouts, with the same three sides (the other's state, the identity, the first one's
      state). A state told only from when it began lasts. The reader's part is what it was: link the two
      entries, and the page rules the answer out. No move was added.
    - *The Grey Cloak told from its data* (`cases/miniatures/grey-cloak-typed`): 249 words against 219 (the one told case longer than its original: every name in full); it
      validates and the true path, the autoplay, the hints and the trying player play it through. The templates
      gained who someone was, what someone wore, and a confession of identity ("I was the figure at the side
      door."). The witness's mistake uses `known_by`, which now has a case: "The figure at the side door was Dr.
      Mott. I knew it by this: the figure at the side door wore the long grey cloak of Dr. Mott."
    - *What follows by itself now.* The doctor is ruled out by being elsewhere (in the typed case the
      observation rests on the figure's whereabouts and his together, where the written case's rested on his
      alone) and the housemaid by her height. Before, nothing typed bore on this case's answer at all. The
      height was typed in the written case too. Over all cases (`typed-check.mjs`): 12 of 63 answers follow with
      the written rules taken away, 48 of 86 wrong answers are ruled out by the typed forms.
    - *What still does not follow:* the answer. "Nobody but Dr. Mott, Mr. Pell and Kitty had a key of the side
      door" would close the list, but the question asks who the figure was, not who did a deed that needed a
      key, so the rule that closes a list (finding 133) does not see it. Coming out at a locked side door as a
      typed act of the figure's would be the way.
    - *What was lost in the telling:* "it was dark", "hardly five feet tall", the cloak "well clear of the
      ground", the rain, and the dispenser's reason ("the whole lane knew it for the doctor's").
    - *Checked:* every page check on the 26 miniatures; the long case's export unchanged.

149. **The Grey Cloak's last step: the list closed for a question of who someone was (2026-11-26; the user asked
    for it first).** Finding 148 left the answer to a written rule, because "nobody but Dr. Mott, Mr. Pell and
    Kitty had a key of the side door" closes a list only for a deed that needs the key, and the question asks
    who the figure was.
    - *Built.* The figure's coming out is a typed act of the case's own that needs a key to the door it came
      out by ("The figure at the side door came out by the side door of the surgery"). For a question of
      identity the rule that closes a list (`t.closed`) now takes a typed act of the one in question: whoever
      the figure was did it, so a true "nobody but these" about its key rules "something else" out, as likely,
      from the observations of the act and of the statement.
    - *The typed Grey Cloak now follows whole:* the doctor by where he was, the housemaid by her height,
      "something else" by the keys, and Mr. Pell by elimination, with the written rules taken away. Over all
      cases: 13 of 63.
    - *The true path* gained the link of the figure's coming out, and a trust move for it: the witness's naming
      of the doctor is ruled out, so nothing else of hers is trusted by its link alone
      (`scripts/path-trust.mjs` wrote the move).
    - Not done in the written Grey Cloak, where the coming out is a detail of the figure's whereabouts and not
      an entry.
    - *Checked:* every page check on the typed case; `npm test`; the long case's export unchanged.

150. **A room and a route told from its data: The Ring on the Bench (2026-11-26).** The first of the three forms
    the user asked to have worked through (a room, two narrators, a reasoning move's entry). The case is
    `cases/miniatures/ring-on-the-bench-typed`: the same logic, the same true path of 17 moves, the room panel,
    "Something got through" and the route as they were.
    - *What the templates gained.* The room's forms, in the words the page already uses for them: "the door of
      the workroom was closed to a person and to anything small", "the ventilating pane let anything small
      through", "a draught crossed from the yard to the workroom", "the cord of the blind was fastened to the
      roller of the blind", "was beside", "reached", "was fixed to". A plural thing ("the walls … were"). A thing
      something is on (`prep: "on"`). What someone knows as an entry ("Tom Pike knew that the customer's ring was
      on the bench"). A doer named by another, where the doer cannot speak ("Signor Belli said to me: 'It was my
      monkey who took the customer's ring from the workroom.'"). And the one sentence of the reader's own entry:
      the observation of a route is now made from what the route's things say ("whatever came by this route was
      small enough for the ventilating pane and able to travel by the cord of the blind"), where "able to climb
      down a cord" was written.
    - *It held:* it validated at the first try, and the true path, the autoplay in every layout, the hints, the
      trying player and the room check play it through. 276 words against 211: the second told case longer than
      its original, every thing named in full each time ("the customer's ring" seven times).
    - *What typing forced or found.* "Keeps a monkey, and lets it run in the yard after dark" had been entered
      as the organ-grinder carrying the monkey, with the rest in `detail`: it is now where the monkey was that
      night, which is what the answer rests on. "On the bench" was a detail of the ring's being in the workroom:
      the bench is now where the ring was, and the route ends at it. The pane said only that something small
      passes, and the table left a person "unsaid" there: it is now also closed to a person ("no wider than my
      hand"), so the room is sealed to a person by its data and not by the reader's good will. "Closed to
      something small" reads oddly alone, and the template says what the engine means by it: a person too. The
      taking became a typed act of the question, which the confession needed.
    - *What was lost:* the bars a hand's breadth apart and the brick (why each way is closed: "closed to a
      person" is the conclusion, not the sight), the blind that hid the pane, the heap of filings as hers, the
      two shirt-studs, the apologies. The first is the loss that matters: a room told from its data states its
      ways in as already judged, where the written story shows bars and lets the reader judge. It is the will's
      loss over again (finding 145), and "This speaks of…" does not mend it: the step is from a look to a size.
    - *Still written by hand:* the order of telling; the names and time labels; three phrases ("my apprentice",
      "in a heap", "scattered"); the question's label and the room panel's question; the sentences of the two
      written rules; the true path's reasons; `structure.json`.
    - *What the checker says* (`typed-check.mjs -v`): nothing typed bears on the answer, in either version (0 of
      1, Tom not ruled out). The engine reads the ways-in table for the panel only. Put to the user: a typed rule
      that a deed in a place whose every way in is closed to a person rules every person out; and, further, that
      a candidate's typed traits against a route's requirements conclude the answer.
      Over all cases now: 13 of 64 answers follow, 48 of 87 wrong answers are ruled out.
    - *Still untold:* two narrators, a reasoning move's entry.

151. **Two narrators told from their data: The Dinner at Larch House (2026-11-26).** The second of the three
    forms. The case is `cases/miniatures/dinner-at-larch-house-typed`: the same logic, the same true path of 6
    moves.
    - *Who is "I" is not written.* An entry is told in the voice of the narrator whose account holds it, and a
      line says whose account begins where the voice changes ("Clara Marlow's account."). So the telling still
      says only the order, and the accounts, which the trust in each narrator already rests on, decide the voice.
      The alternative, a narrator marked on each paragraph of the telling, would have been one more thing kept by
      hand and one more thing that could disagree with the accounts.
    - *What the templates gained besides.* Where a thing was seen from (`seen_from`): "Nobody but Captain Voss
      was in the hall. I saw this from the nursery landing." What is the listener's by name is "your" ("It was I
      who took your notes from the study", said to George Marlow), as what is the speaker's is "my".
    - *It held:* it validated at the first try, and the true path, the autoplay, the hints and the trying player
      play it through. 354 words against 301: the courses of the dinner are times that are events, and a stretch
      between two of them is long each time it is said ("From when the soup was served on Thursday until the
      joint was carried in").
    - *What typing forced or found.* "Nobody else left the table" was prose only, and it is what makes the two
      guests the answers: it is now a statement about everyone ("Everyone but Clara Marlow, Captain Voss and Miss
      Pym was in the dining-room", seen from the table). The notes are in the drawer and the drawer in the
      study, where the notes had been "in the study" with the drawer a detail. The letter that gave the answer
      away is Miss Pym's saying it, and the notes coming back a typed act.
    - *What was lost:* the cigar-case and the coachman (each guest's reason for going out), the overcoat on the
      hall stand, the baby, and that the landing looks down on the hall and on the study door. The last is logic
      of a kind: it is why what Clara saw from there can be believed, and the typed case only says she saw it
      from there.
    - *Still written by hand:* the order; the names and time labels; three phrases ("the master of Larch House",
      "the maid", "watched by nobody"); the question's label; the one written rule's sentence; the true path's
      reasons; `structure.json`.
    - *What the checker says:* as for the written case, Captain Voss is ruled out by the typed forms and the
      answer would follow if the list were closed. The new statement about everyone does not close it: the rule
      (finding 133) takes "nobody but these had the key" or "nobody but these was there", and this says the
      reverse, that everyone but these was elsewhere through the whole window. Put to the user.
    - *Still untold:* The Night Porter's Statement (a narrator who may be doubted), a reasoning move's entry.

152. **A narrator who may be doubted, told from his data: The Night Porter's Statement (2026-11-26).** The other
    case of two narrators, and it needed nothing new of the templates but a word: a narrator may name what his
    part is called (`account` in `case.json`: "Inspector Reeve's note.", "Josiah Kemp's statement."). The case is
    `cases/miniatures/night-porters-statement-typed`, the same logic and true path.
    - *It held:* it validated at the first try, the false statement is still one the reader may rule out by
      itself, and the true path, the autoplay, the hints and the trying player play it through. 219 words against
      211.
    - *The lie reads as flatly as the truth,* which suits it: "At one o'clock on Friday morning, Tobias Finch
      was at Bly's Bank", in the porter's voice, and two paragraphs on, in the Inspector's, "From Wednesday until
      seven o'clock on Friday morning, Tobias Finch was in the lock-up at Cross Street."
    - *What typing forced or found.* Mr. Bly's handing over the keys became his act. The clerk's being held
      since Wednesday and his being locked in from ten were two entries: they are one stretch now. The strongroom
      "found open, and four hundred pounds gone" is a state and a whereabouts denied. The answer was given away
      by where the money was found, which asserts nothing typed: the porter now owns to it as well.
    - *What was lost:* "they never left my belt" (he "had" them), the step outside and the lamp, the clerk
      looking in at the window and running, "I think it right to say so" (the voice of a man laying blame), the
      Inspector turning the key himself, the lock-up book, the coals.
    - *Still written by hand:* the order; names and time labels; four phrases (the two roles, "open", "opened
      with its key, and not forced"); the question's label; the two written rules' sentences; the true path's
      reasons; `structure.json`.
    - *What the checker says:* the clerk is ruled out by the typed forms; the answer would follow with the list
      closed. Nothing in the story says nobody else had the keys. What it does say is typed already: the deed
      needs the key of the strongroom door, and the porter held it through the whole window. A rule from that
      ("who held the key throughout, if it left nobody's hands") would be likely only. Put to the user.
    - *Still untold of the list:* a reasoning move's entry (The Watchman's Clock, The Cellar Door).

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
