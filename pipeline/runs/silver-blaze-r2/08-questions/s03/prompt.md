<!-- system -->
You are one step of a pipeline that turns a detective story into structured data for a reading game. You see only
what this message gives you. Use only the text given, read as a first-time reader would read it: if you recognise
the story, do not use what you remember of it, its characters' secrets or its ending. Follow the format exactly.
Put your output in one or more ```jsonl fenced blocks, one JSON object per line; anything outside the blocks is
ignored, so keep remarks short.


<!-- user -->
# Step: questions, one scene

# The world model: the format the pipeline writes

This is the format a case for the timeline is written in, as the pipeline's steps are told it. It is sent to the
model in every step that writes data, so it names no real case: its examples come from an invented story, *The
Miller's Purse* (below). The full reference, with the engine's behaviour, is `docs/case-format.md` (which has spoilers
for the cases it was shaped on, and is never sent).

## The invented example

*The Miller's Purse*, narrated in the first person by Dr. Hale. ¶1: Hale and his friend Ashdown are at breakfast in
Ashdown's rooms on a Tuesday. ¶3: a telegram from the miller, Joseph Crane, asks for help: his purse, with forty
pounds in it, was taken from the mill-house in the night. ¶5–9: at the mill, Crane tells them that he locked the
purse in his desk at ten; his daughter Ruth says she heard the yard gate creak at about midnight; the carter, Dobbs,
says he slept in the stable loft and heard nothing. The village constable, Pryor, has arrested a pedlar seen on the
road. ¶12: Ashdown finds flour on the desk's lock. ¶20: Ashdown explains that Dobbs took the purse, with the key
he had copied, and that the pedlar never came near the mill.

## A case

A case is a directory with the story and the world model:

```
story.txt              the text, paragraphs separated by blank lines; ¶0 is the title
world/case.json        the header
world/entities.json    every person, group, animal, place, object, document, topic and state
world/mentions.json    how the story names each entity
world/times.json       time points and their partial order
world/facts.json       the facts
world/accounts.json    the accounts facts travel in
world/questions.json   the questions, their possibilities and answers
```

Paragraphs are numbered from 0, in the order the text gives them (¶0 the title). Every `para` is that number.
Every `quote` is copied exactly from that paragraph (a clause or a few words, not the whole paragraph); straight and
curly quotes and dashes count as the same. Each file is one JSON object per line.

**Ids.** Entities: short snake case (`crane`, `mill_house`, `desk`, `the_pedlar`). Time points: `t.` and a
short name (`t.tue_breakfast`, `t.mon_night`). Facts: `f.` and a short name (`f.purse_in_desk`). Accounts: `acct.`
and the source (`acct.ruth`). Questions: `q.` and a short name (`q.who_took`).

**Nothing runs ahead of the story.** A name, label or text that the page shows at a paragraph must not tell more
than the story has told by then. An unknown person is named by how the story first presents them (`the_pedlar`,
"The pedlar on the road"), never by who they turn out to be; an identity is a fact (`identity`) or a question, at its
own paragraph. A question's label asks what the story has made a reader wonder; it never hints at the answer.

## case.json

```json
{"id": "millers_purse", "title": "The Miller's Purse", "author": "…", "story": "../story.txt",
 "narrators": [{"id": "hale", "name": "Hale", "kind": "first-person", "trust": "certain"}],
 "subtitle": "Hale's timeline", "source": {"…": "…"}}
```

`narrators`: who tells the story to the reader. A first-person narrator is an entity of the story; an impersonal
third-person narrator is the id `narrator` (`kind: third-person`), which is no entity.

## entities.json

`{"id", "kind", "name", "within"?, "source"?, "summary"?}`, with `moves` (entities that travel: a cart, a train) and
`joins` (a door's two sides, inside first) beside the list. `name` is the fullest name the story gives the entity
(`"Joseph Crane"`): the page shows, at each paragraph, only a name or phrase the story has used by then (from
mentions.json), so the name may be one the story gives later. A description for someone the story never names
(`"The pedlar on the road"`) must hold from the first mention. Optional `names: [{"from", "name"}]` sets which
name the page shows from which paragraph, where the automatic choice would be wrong:

```json
{"moves": ["cart"], "joins": {"yard_gate": ["yard", "lane"]}, "entities": [
  {"id": "crane", "kind": "person", "name": "Joseph Crane"},
  {"id": "mill_house", "kind": "place", "name": "The mill-house", "within": "mill"},
  {"id": "desk", "kind": "object", "name": "Crane's desk", "within": "mill_house"},
  {"id": "the_pedlar", "kind": "person", "name": "The pedlar on the road"},
  {"id": "constabulary", "kind": "group", "name": "The village constabulary"},
  {"id": "calendar", "kind": "state", "name": "The day of the week"},
  {"id": "clock", "kind": "state", "name": "The time of day"}
]}
```

Kinds: `person`, `group`, `animal`, `place`, `object`, `document`, `topic` (the subject of a general rule: milling,
locks), `state` (`calendar`, `clock`, `weather`: their facts give the weekday, the hour, the weather). `within` folds a
place or a part into another (the desk within the mill-house within the mill). Who is in a group is each member's
`member_of` fact. A name is what the story calls it, as plainly as possible.

## mentions.json

`{"entities": {id: [phrase, …]}}`. A phrase is a string matched exactly, on word boundaries, the longest winning
where two overlap; or `{"text", "paras": [from, to]}` to limit it to some paragraphs (inclusive), where the same words
name someone else elsewhere ("the old man" is Crane in ¶5–9 only). Every name and description the story uses for an
entity, as it appears in the text (`"Crane"`, `"Joseph Crane"`, `"the miller"`). An entity with no phrase carries a
`source` quote in entities.json instead.

## times.json

`{"id", "label", "day"?, "clock"?, "after"?, "para"?, "quote"?, "note"?}`: a point in the story's time.

```json
{"id": "t.before", "label": "Before the story"},
{"id": "t.mon_ten", "label": "Monday, ten o'clock", "after": "t.before", "para": 6, "quote": "I locked it in the desk at ten"},
{"id": "t.mon_midnight", "label": "Monday, about midnight", "after": "t.mon_ten", "para": 7, "quote": "about midnight"},
{"id": "t.tue_breakfast", "label": "Tuesday, at breakfast", "after": "t.mon_midnight", "para": 1, "quote": "at breakfast"}
```

The `label` shows from the time point's `para`, so it must say only what the story has told by then: "One
morning, at breakfast" at ¶1, not "Tuesday, at breakfast" when the day is told at ¶5. Where a later paragraph
tells more, give the label in steps: `"labels": [{"from": 1, "label": "One morning, at breakfast"}, {"from": 5,
"label": "Tuesday, at breakfast"}]`. A label never names a place or person the story has not yet given for it.

`after` (one id or a list) is the partial order: a point is certainly later than every point it is after. Order
only what the text orders. Two points not ordered by `after` may be either way. A thing that moves needs a point of
its own for each move (the cart in the lane, then at the gate): one point for two places would put it in both at
once. `day` and `clock` are labels only; the weekday and the hour are facts on `calendar` and `clock`.

## facts.json

One fact each: `{"id", "of", "attr", "value", "detail"?, "neg"?, "to"?, "time", "para", "quote", …}`.

- `attr` is one of: `location` (where it is at that time), `lives_at` (where it lives or is kept), `member_of`,
  `carrying`, `wearing`, `action` (something done: "locked the purse in the desk"), `says`, `observes`, `knows`,
  `believes`, `intends`, `condition`, `contents`, `role`, `reputed`, `rule` (a general rule, on a topic), `position`,
  `owner`, `identity`, `name`, `weekday`, `hour`, `speed`, `time`, `tells`.
- `value` is an entity id where there is one, otherwise short text. A `location` value is always a place or thing id
  (or null when unknown), with the rest in `detail` ("at the window"), so that places can be compared. `neg: true`
  denies the fact ("not at the mill"; the desk empty).
- `time` is `{"at": t}`, `{"from": t, "to": t}` (an open end means until further notice) or `{"after": t,
  "before": t}` (somewhere between).
- `para` and `quote`: the paragraph that tells it and the words that do. One fact per thing told; a sentence that
  tells three things is three facts.
- `basis`: `stated` (the default), `implied` (the text presupposes it: Crane owns the purse he calls "my purse"), or
  `inferable` (it follows from facts told so far: `from`, a list of fact ids, and `inferable_at`, the paragraph).
- `truth`: `true` (the default), `false` (the answer key says otherwise) or `null` (the story never settles it).

```json
{"id": "f.purse_in_desk", "of": "purse", "attr": "location", "value": "desk", "time": {"from": "t.mon_ten"}, "para": 6, "quote": "I locked it in the desk at ten"},
{"id": "f.crane_locks", "of": "crane", "attr": "action", "value": "locks the purse in his desk", "time": {"at": "t.mon_ten"}, "para": 6, "quote": "I locked it in the desk at ten"},
{"id": "f.cal_tue", "of": "calendar", "attr": "weekday", "value": "Tuesday", "time": {"at": "t.tue_breakfast"}, "para": 1, "quote": "on the Tuesday morning"}
```

**Speech and belief.** What someone says is a `says` fact, what someone holds a `believes` fact (true: the saying or
the belief happened). What it asserts is in `asserts`: a list of states `{of, attr, value, time?, neg?}` or of
question picks `{q, pick, neg?}` (once the questions exist). `modal: "possible"` marks a claim of what may or could
be. A fact that is the content of a claim, told as a fact of its own, carries `claim` (the says or believes fact id);
a fact that is what someone said in the narrator's hearing, with no says fact of its own, carries `word` (the
speaker).

```json
{"id": "f.ruth_says_gate", "of": "ruth", "attr": "says", "value": "she heard the yard gate creak", "to": "ashdown", "time": {"at": "t.tue_mill"}, "para": 7, "quote": "I heard the yard gate creak", "asserts": [{"of": "yard_gate", "attr": "action", "value": "creaks", "time": {"at": "t.mon_midnight"}}]},
{"id": "f.pryor_believes", "of": "pryor", "attr": "believes", "value": "the pedlar took the purse", "time": {"at": "t.tue_mill"}, "para": 9, "quote": "the pedlar's our man"}
```

**Tellings.** A `tells` fact passes accounts from one person to another: `of` the teller, `value` an account id or a
list, `to` the hearer, `how` (told, statement, sworn statement, report, newspaper, telegram, analysis, letter),
`partial: true` when only part of it was passed, `of: "?"` when the teller is unknown.

```json
{"id": "f.crane_tells", "of": "crane", "attr": "tells", "value": "acct.crane", "to": "hale", "how": "told", "time": {"at": "t.tue_mill"}, "para": 6, "quote": "Crane told us"}
```

**A whole chain.** Every account must reach a narrator through tellings, one `tells` fact per step, even where the
story only implies a step (`basis: "implied"`, with the words that imply it). Suppose ¶4 is the newspaper report
Ashdown reads out to Hale: Ruth told the constable what she heard, the constable reported to the paper, the paper
printed it, and Ashdown read it to Hale. That is four tellings:

```json
{"id": "f.ruth_tells_pryor", "of": "ruth", "attr": "tells", "value": "acct.ruth", "to": "pryor", "how": "statement", "basis": "implied", "time": {"after": "t.mon_midnight", "before": "t.tue_breakfast"}, "para": 4, "quote": "the miller's daughter told the constable"},
{"id": "f.pryor_tells_paper", "of": "pryor", "attr": "tells", "value": "acct.police", "to": "the_paper", "how": "report", "basis": "implied", "time": {"before": "t.tue_breakfast"}, "para": 4, "quote": "the constable's report"},
{"id": "f.paper_tells_ashdown", "of": "the_paper", "attr": "tells", "value": "acct.paper", "to": "ashdown", "how": "newspaper", "time": {"at": "t.tue_breakfast"}, "para": 4, "quote": "Ashdown read from the paper"},
{"id": "f.ashdown_tells_hale", "of": "ashdown", "attr": "tells", "value": "acct.paper", "to": "hale", "how": "told", "time": {"at": "t.tue_breakfast"}, "para": 4, "quote": "Ashdown read from the paper"}
```

with `acct.police` a bundle whose `parts` include `acct.ruth`, and `acct.paper` a bundle whose `parts` include
`acct.police`. A witness who sees something has an `observes` fact (its `value` the fact ids seen), in that
witness's own account.

**What is easy to leave out.** Who belongs to a group (`member_of`, one fact per member: the two lads among the
searchers); where people and animals live or are kept (`lives_at`, implied where the text takes it for granted);
the tellings the story implies (each witness's account reaching the police); what someone sees (`observes`) and
knows (`knows`) when it matters to what they do.

## accounts.json

What one source tells, as a bundle of facts: `{"id", "label", "origin", "how", "facts"?, "parts"?}`. The
`label` names only the source ("Ruth's account", "What the constable holds"), never what is in it: the page shows
it with the first telling that passes it, which may come before its contents are told; give `labels` steps where
even the source is not yet named there. `origin` is who
first had it (null when not said); `how` how they had it (saw, did, said, examination, analysis, inference, own,
report; `bundle` for an account made of other accounts, `parts`). Every narrator has an account of what they see and
hear themselves (`acct.hale`, origin `hale`, how `saw`). A fact may be in several accounts (two witnesses of one
scene). Every fact the story tells is in an account that a chain of tellings carries to a narrator, with these
exceptions: a `says` or `believes` fact heard by the narrator is in the narrator's account; a fact with `claim` or
`word` is in no account (it reaches the reader through the speaker).

```json
{"id": "acct.hale", "label": "What Hale sees and hears himself", "origin": "hale", "how": "saw", "facts": ["f.cal_tue", "f.ruth_says_gate", "f.pryor_believes"]},
{"id": "acct.crane", "label": "Crane's account of the night", "origin": "crane", "how": "did", "facts": ["f.purse_in_desk", "f.crane_locks"]}
```

What a character tells the narrator in direct speech is a `says` fact in the narrator's account (with its
`asserts`) when the saying itself matters, or the facts of a told account (a telling to the narrator, the facts in
the teller's account) when it is a report of events. Never file in the narrator's own account a fact the narrator
only heard about: that would make it read as seen.

## questions.json

An uncertain entry: `{"id", "label", "entry", "raised", "quote", "possibilities", "answer", "kind"?, "note"?}`.

- `label`: the question as a reader would ask it ("Who took the purse?"), in the words the story has used by
  `raised`; `labels` steps where it is raised before a name in it is told ("Who killed the miller?", then "Who
  killed Joseph Crane?").
- `entry`: the fact it leaves open, `{of, attr, time}`, with `of: "?"` when the question is who.
- `raised`: the paragraph where the story opens the question, with `quote` there (null when the story never
  doubts it: a latent question).
- `possibilities`: `{value, available, via, from?, reasoning?, quote?, out?, by?}`. `value` an entity id or short
  text. `available`: from which paragraph it is a possibility. `via: direct` (someone in the story puts it
  forward; a `quote` there), `indirect` (it follows from what has been told: `from` a fact, or `reasoning`, a
  careful reader's step `{para, text}`), or `always` (exactly one per question: `"something else"`, available
  from `raised`). `out`/`by`: the paragraph and the fact that rule it out, if the story does.
- `answer`: the true possibility (null if the story never settles it); `also_right`: others just as true.
- The answer's dates: `answer_given_at` and `answer_given_quote`, where the story gives it away, and
  `answer_inferable_at`, the earliest paragraph a careful reader can reach it (null: only the give-away), with
  `answer_from` (a fact) or `answer_reasoning` (`{para, text}`).
- `kind: "provenance"`: a question about how something was passed on (who sent the telegram), kept off the
  player's list unless the story raises it.

```json
{"id": "q.who_took", "label": "Who took the purse?", "entry": {"of": "?", "attr": "action", "time": {"after": "t.mon_ten", "before": "t.tue_breakfast"}}, "raised": 3, "quote": "taken from the mill-house in the night", "possibilities": [
  {"value": "something else", "available": 3, "via": "always"},
  {"value": "the_pedlar", "available": 9, "via": "direct", "quote": "the pedlar's our man"},
  {"value": "dobbs", "available": 8, "via": "indirect", "reasoning": {"para": 8, "text": "Dobbs slept by the yard and says he heard nothing, though Ruth heard the gate from the house."}}],
 "answer": "dobbs", "answer_given_at": 20, "answer_given_quote": "Dobbs took the purse", "answer_inferable_at": 12, "answer_reasoning": {"para": 12, "text": "Flour on the lock: whoever opened the desk came from the mill floor, and only Dobbs works there at night."}}
```

A fact that answers or bears on a question carries `q` and `pick` (a stated answer); a claim's `asserts` may hold
picks (`{"q": "q.who_took", "pick": "the_pedlar"}`: the constable's belief).

## The two dates of a fact

`given_at` is where the story states the fact (default: `para`); it is earlier, with `given_quote`, when an earlier
line already says it in brief (until `para`, the page shows only those brief words). `inferable_at` is the earliest paragraph a careful reader can reach the fact from what
came before, with `from` (facts) or `reasoning` (`{para, text}`, a step in words), and `strength: "likely"` when it
would be held but does not strictly follow. These are written once the whole story is in, by the step that sees it.

## Typed actions (optional, for doors and keys)

A fact may be a typed action: `act` (`lock`, `unlock`, `open`, `close`, `go_through`, `lead_out`, `give`, `ask`,
`drug`, `strike`, `hide`) and `thing` (what it acts on), its agent the fact's `of`. A door's state is `attr: "door"`,
`value` one of `open`, `shut`, `locked`. Write these only where the text makes them matter.

## strains.json (likely clashes)

Two entries that can both hold but sit badly together, which a careful reader would notice: `{"id", "a", "b",
"why", "available", "key", "from"?}`. Each side is a fact id or a question's possibility `{"q", "pick"}`; `why` says
in plain words why they sit badly ("A man who has lost his way would not know the yard's night arrangements");
`available`, the paragraph from which both sides are told (no earlier than either); `key`, the question at whose
give-away the clash is listed as what a careful reader would have noticed. The page shows a clash only when one side
is the player's own circle and the other is on the timeline, so a side is usually a wrong possibility the player
might circle, and the other a fact that tells against it.

```json
{"id": "s.pedlar_gate", "a": {"q": "q.who_took", "pick": "the_pedlar"}, "b": "f.dobbs_heard_nothing", "why": "A stranger at the gate would have woken the dog in the yard, and Dobbs sleeps over it.", "available": 9, "key": "q.who_took"}
```

## path.json (the true path)

The moves a careful reader makes through the page, in order, to the end of the story: `{"at", "do", …, "why",
"for_q"}`. The page stops before a paragraph that gives an answer away until each question it answers has exactly
one circle, so the path circles every answered question's answer before its give-away.

- `{"do": "circle", "q", "pick"}`: circle a possibility (the reader's hypothesis). A wrong turn the reader would
  take is a circle of a wrong possibility, then `{"do": "cross", "q", "pick"}` once the story rules it out.
- `{"do": "trust", "on": <fact id>, "link": "stmt:<fact id>", "level": "distrusted"}`: distrust one statement
  (a lie, a mistaken belief, a false report). By the end of the story nothing may contradict: every false
  statement the reader has on the timeline must be distrusted.
- `at`: the paragraph of the move; `why`: the reader's reason, in plain words, as the reader would say it then;
  `for_q`: the questions the move serves.


## Your task

Write the questions that scene s03 (Met at Tavistock and the drive with the Inspector, ¶47–¶68) raises, and the possibilities it
opens, for questions new and old. You have the story up to the end of this scene and the data so far; you have not
read further, and nobody knows the answers yet.

- A question is what the story makes a careful reader wonder about the events of the case: who did it, where
  something or someone is or was, what something was for, why someone acted, whether a statement is true. Not about
  the detective's or the narrator's behaviour (what he whispered, why he asks for a photograph, why he leaves): those
  are what a reader notices, and the questions they point to are about the events (what the photograph would
  show is a question about the person in it). Take the reader's QUESTION and HYPOTHESIS
  notes as a guide; add the questions the story itself asks.
- A new question: `{"file": "questions", "id", "label", "entry", "raised", "quote", "possibilities"}` with
  `"answer": null`. Its possibilities: exactly one `{"value": "something else", "available": <raised>, "via":
  "always"}`, and each answer someone in the story puts forward (`via: direct`, `quote` in its `available`
  paragraph) or a careful reader would consider (`via: indirect`, with `from`, a fact told no later, or
  `reasoning`, `{para, text}`). A possibility's `value` is an entity id where it is one.
- A possibility for a question so far: `{"file": "possibility", "q", "value", "available", "via", …}`; a
  possibility the scene rules out: the same line with `out` (paragraph) and `by` (the fact).
- Facts that bear on a question: `{"file": "patch", "id": <fact id>, "set": {"q", "pick"}}` for a fact that states
  an answer, or `{"file": "patch", "id": <claim fact id>, "set": {"asserts": [...]}}` to give a says or believes
  fact the picks it asserts (`{"q", "pick", "neg"?}`, beside the states it already asserts: give the whole list).
- A telling whose teller the story does not give (`of: "?"`), or that the story leaves uncertain, needs a question
  of `kind: "provenance"` (who sent the reply; whether the papers had it from the police or the witnesses), and the
  telling a patch with its `q`.
- A question's label must not hint at its answer, and nothing may run ahead of the story.

## Entities

moves: ["train","landau"]
joins: {"stable_door":["stables","kings_pyland"]}
{"id":"watson","kind":"person","name":"Watson"}
{"id":"holmes","kind":"person","name":"Sherlock Holmes"}
{"id":"calendar","kind":"state","name":"The day of the week"}
{"id":"clock","kind":"state","name":"The time of day"}
{"id":"england","kind":"place","name":"England"}
{"id":"holmes_rooms","kind":"place","name":"Holmes and Watson's rooms","within":"england","source":"my companion had rambled about the room"}
{"id":"dartmoor","kind":"place","name":"Dartmoor","within":"devonshire"}
{"id":"kings_pyland","kind":"place","name":"King's Pyland","within":"dartmoor"}
{"id":"paddington","kind":"place","name":"Paddington","within":"england"}
{"id":"reading","kind":"place","name":"Reading","within":"england"}
{"id":"exeter","kind":"place","name":"Exeter","within":"england"}
{"id":"train","kind":"object","name":"The train from Paddington"}
{"id":"carriage","kind":"place","name":"A first-class carriage","within":"train"}
{"id":"silver_blaze","kind":"animal","name":"Silver Blaze"}
{"id":"straker","kind":"person","name":"John Straker"}
{"id":"ross","kind":"person","name":"Colonel Ross"}
{"id":"gregory","kind":"person","name":"Inspector Gregory"}
{"id":"simpson","kind":"person","name":"Fitzroy Simpson"}
{"id":"wessex_cup","kind":"topic","name":"The Wessex Cup"}
{"id":"news_agent","kind":"person","name":"Holmes and Watson's news agent"}
{"id":"fresh_editions","kind":"document","name":"Fresh editions of every paper"}
{"id":"bundle_of_papers","kind":"document","name":"The bundle of fresh papers from Paddington"}
{"id":"the_telegraph","kind":"document","name":"The Telegraph"}
{"id":"the_chronicle","kind":"document","name":"The Chronicle"}
{"id":"ross_telegram","kind":"document","name":"Colonel Ross's telegram"}
{"id":"gregory_telegram","kind":"document","name":"Inspector Gregory's telegram"}
{"id":"field_glass","kind":"object","name":"Watson's field-glass"}
{"id":"holmes_pipe","kind":"object","name":"Holmes's pipe"}
{"id":"cigar_case","kind":"object","name":"Holmes's cigar-case"}
{"id":"holmes_watch","kind":"object","name":"Holmes's watch"}
{"id":"travelling_cap","kind":"object","name":"Holmes's ear-flapped travelling-cap"}
{"id":"telegraph_posts","kind":"object","name":"The telegraph posts upon the line"}
{"id":"quarter_mile_posts","kind":"object","name":"The quarter-mile posts"}
{"id":"weather","kind":"state","name":"The weather","source":"she could hear the rain pattering against the window"}
{"id":"isonomy","kind":"animal","name":"Isonomy"}
{"id":"racing_public","kind":"group","name":"The racing public"}
{"id":"stables","kind":"place","name":"The King's Pyland training-stables","within":"kings_pyland"}
{"id":"stall","kind":"place","name":"The favourite's stall","within":"stables"}
{"id":"harness_room","kind":"place","name":"The harness-room","within":"stables"}
{"id":"loft","kind":"place","name":"The chaff-cutting loft above the harness-room","within":"stables"}
{"id":"stable_door","kind":"object","name":"The stable door"}
{"id":"stable_window","kind":"object","name":"The stable window where the meals are handed in","within":"stables"}
{"id":"small_table","kind":"object","name":"The small table in the stable","within":"stables"}
{"id":"water_tap","kind":"object","name":"The water-tap in the stables","within":"stables"}
{"id":"kings_pyland_stable","kind":"group","name":"The King's Pyland establishment"}
{"id":"stable_lads","kind":"group","name":"The three stable lads"}
{"id":"two_lads","kind":"group","name":"The two lads who slept in the loft"}
{"id":"hunter","kind":"person","name":"Ned Hunter"}
{"id":"kings_pyland_horses","kind":"group","name":"The four horses at King's Pyland"}
{"id":"bayard","kind":"animal","name":"Bayard"}
{"id":"straker_villa","kind":"place","name":"Straker's small villa","within":"kings_pyland"}
{"id":"kitchen","kind":"place","name":"The kitchen of the trainer's house","within":"straker_villa"}
{"id":"path","kind":"place","name":"The path across the moor to the stables","within":"kings_pyland"}
{"id":"knoll","kind":"place","name":"The knoll near the house","within":"kings_pyland"}
{"id":"mrs_straker","kind":"person","name":"Mrs. Straker"}
{"id":"edith_baxter","kind":"person","name":"Edith Baxter"}
{"id":"two_women","kind":"group","name":"The two women"}
{"id":"villas","kind":"place","name":"The small cluster of villas to the north","within":"dartmoor"}
{"id":"simpson_villa","kind":"place","name":"Simpson's villa","within":"villas","source":"he inhabited one of those villas"}
{"id":"tavistock_contractor","kind":"person","name":"A Tavistock contractor"}
{"id":"tavistock","kind":"place","name":"Tavistock","within":"dartmoor"}
{"id":"mapleton","kind":"place","name":"Mapleton","within":"dartmoor"}
{"id":"backwater","kind":"person","name":"Lord Backwater"}
{"id":"silas_brown","kind":"person","name":"Silas Brown"}
{"id":"desborough","kind":"animal","name":"Desborough"}
{"id":"gypsies","kind":"group","name":"The gypsies of Dartmoor"}
{"id":"the_stranger","kind":"person","name":"The stranger who stopped the maid near the stables"}
{"id":"stranger_suit","kind":"object","name":"The stranger's grey suit of tweeds"}
{"id":"stranger_cap","kind":"object","name":"The stranger's cloth cap"}
{"id":"stranger_gaiters","kind":"object","name":"The stranger's gaiters"}
{"id":"stranger_stick","kind":"object","name":"The stranger's heavy stick with a knob"}
{"id":"paper_packet","kind":"object","name":"The folded piece of white paper"}
{"id":"lantern","kind":"object","name":"The maid's lantern"}
{"id":"hunter_supper","kind":"object","name":"Hunter's supper of curried mutton"}
{"id":"house_supper","kind":"object","name":"The curried mutton eaten at the house"}
{"id":"opium","kind":"object","name":"Powdered opium"}
{"id":"dog","kind":"animal","name":"The stable dog"}
{"id":"straker_coat","kind":"object","name":"Straker's large mackintosh"}
{"id":"furze_bush","kind":"object","name":"The furze-bush"}
{"id":"hollow","kind":"place","name":"The bowl-shaped depression in the moor","within":"dartmoor"}
{"id":"heavy_weapon","kind":"object","name":"The heavy weapon that struck Straker"}
{"id":"sharp_instrument","kind":"object","name":"The sharp instrument that cut Straker's thigh"}
{"id":"straker_knife","kind":"object","name":"Straker's small knife"}
{"id":"cravat","kind":"object","name":"The red and black silk cravat"}
{"id":"bridle","kind":"object","name":"Silver Blaze's bridle"}
{"id":"duplicate_key","kind":"object","name":"A duplicate key to the stable door"}
{"id":"special_wire","kind":"document","name":"Holmes's special wire to Dartmoor"}
{"id":"police","kind":"group","name":"The police"}
{"id":"betting_book","kind":"document","name":"Simpson's betting-book"}
{"id":"simpson_stick","kind":"object","name":"Simpson's Penang-lawyer weighted with lead"}
{"id":"london","kind":"place","name":"London","within":"england"}
{"id":"sporting_clubs","kind":"place","name":"The sporting clubs of London","within":"london"}
{"id":"watson_cigar","kind":"object","name":"Watson's cigar"}
{"id":"devonshire","kind":"place","name":"Devonshire","within":"england"}
{"id":"tavistock_station","kind":"place","name":"Tavistock station","within":"tavistock"}
{"id":"landau","kind":"object","name":"The open carriage, a comfortable landau"}
{"id":"ross_frock_coat","kind":"object","name":"Colonel Ross's frock-coat"}
{"id":"ross_gaiters","kind":"object","name":"Colonel Ross's gaiters","source":"in a frock-coat and gaiters"}
{"id":"ross_eye_glass","kind":"object","name":"Colonel Ross's eye-glass"}
{"id":"ross_hat","kind":"object","name":"Colonel Ross's hat"}
{"id":"detective_service","kind":"group","name":"The English detective service"}
{"id":"ten_pound_note","kind":"object","name":"The ten-pound note found in Simpson's purse"}
{"id":"simpson_purse","kind":"object","name":"Simpson's purse"}
{"id":"pits_mines","kind":"place","name":"The pits and old mines upon the moor","within":"dartmoor"}
{"id":"gypsy_party","kind":"group","name":"The party of gypsies encamped near the spot of the murder"}
{"id":"gypsy_camp","kind":"place","name":"The gypsies' camp within a mile of the murder","within":"dartmoor","source":"encamped on Monday night within a mile of the spot where the murder took place"}
{"id":"tavistock_stables","kind":"place","name":"The stables and out-houses in and around Tavistock","within":"dartmoor","source":"every stable and out-house in Tavistock"}
{"id":"the_press","kind":"group","name":"The newspapers","source":"the embellishments of theorists and reporters"}

## Facts so far

{"id":"f.breakfast","of":"watson","attr":"action","value":"sits down to breakfast with Holmes","time":{"at":"t.thu_breakfast"},"para":1,"quote":"as we sat down together to our breakfast one morning"}
{"id":"f.watson_rooms_breakfast","of":"watson","attr":"location","value":"holmes_rooms","detail":"at breakfast","basis":"implied","time":{"at":"t.thu_breakfast"},"para":1,"quote":"as we sat down together to our breakfast one morning"}
{"id":"f.holmes_rooms_breakfast","of":"holmes","attr":"location","value":"holmes_rooms","detail":"at breakfast","basis":"implied","time":{"at":"t.thu_breakfast"},"para":1,"quote":"as we sat down together to our breakfast one morning"}
{"id":"f.holmes_must_go","of":"holmes","attr":"intends","value":"to go","time":{"at":"t.thu_breakfast"},"para":1,"quote":"I am afraid, Watson, that I shall have to go"}
{"id":"f.holmes_intends_kp","of":"holmes","attr":"intends","value":"to go to King's Pyland on Dartmoor","time":{"at":"t.thu_breakfast"},"para":3,"quote":"To Dartmoor; to King’s Pyland."}
{"id":"f.case_talked_of","of":"england","attr":"condition","value":"the extraordinary case is the one topic of conversation throughout the country","time":{"at":"t.thu_breakfast"},"para":4,"quote":"which was the one topic of conversation through the length and breadth of England"}
{"id":"f.holmes_rooms_wed","of":"holmes","attr":"location","value":"holmes_rooms","time":{"at":"t.wed"},"para":4,"quote":"For a whole day my companion had rambled about the room"}
{"id":"f.holmes_rambles","of":"holmes","attr":"action","value":"rambles about the room, chin on chest and brows knitted","time":{"at":"t.wed"},"para":4,"quote":"rambled about the room with his chin upon his chest and his brows knitted"}
{"id":"f.holmes_pipe","of":"holmes","attr":"action","value":"charges and recharges his pipe with the strongest black tobacco","time":{"at":"t.wed"},"para":4,"quote":"charging and recharging his pipe with the strongest black tobacco"}
{"id":"f.holmes_carries_pipe","of":"holmes","attr":"carrying","value":"holmes_pipe","basis":"implied","time":{"at":"t.wed"},"para":4,"quote":"charging and recharging his pipe"}
{"id":"f.holmes_deaf","of":"holmes","attr":"condition","value":"deaf to Watson's questions and remarks","time":{"at":"t.wed"},"para":4,"quote":"absolutely deaf to any of my questions or remarks"}
{"id":"f.agent_sends_papers","of":"news_agent","attr":"action","value":"sends up fresh editions of every paper","time":{"at":"t.wed"},"para":4,"quote":"Fresh editions of every paper had been sent up by our news agent"}
{"id":"f.holmes_tosses_papers","of":"holmes","attr":"action","value":"glances over the fresh editions and tosses them into a corner","time":{"at":"t.wed"},"para":4,"quote":"only to be glanced over and tossed down into a corner"}
{"id":"f.papers_in_corner","of":"fresh_editions","attr":"location","value":"holmes_rooms","detail":"tossed down into a corner","time":{"from":"t.wed"},"para":4,"quote":"tossed down into a corner"}
{"id":"f.watson_knows_brooding","of":"watson","attr":"knows","value":"Holmes is brooding over the disappearance of the favourite and the murder of its trainer","time":{"at":"t.wed"},"para":4,"quote":"I knew perfectly well what it was over which he was brooding"}
{"id":"f.horse_favourite","of":"silver_blaze","attr":"role","value":"favourite for the Wessex Cup","time":{"at":"t.crime"},"para":4,"quote":"the favourite for the Wessex Cup"}
{"id":"f.horse_vanishes","of":"silver_blaze","attr":"action","value":"disappears","time":{"at":"t.crime"},"para":4,"quote":"the singular disappearance of the favourite for the Wessex Cup"}
{"id":"f.straker_trainer","of":"straker","attr":"role","value":"trainer of the favourite","time":{"at":"t.crime"},"para":4,"quote":"the tragic murder of its trainer"}
{"id":"f.straker_murdered","of":"straker","attr":"condition","value":"murdered","time":{"from":"t.crime"},"para":4,"quote":"the tragic murder of its trainer"}
{"id":"f.watson_expected","of":"watson","attr":"believes","value":"Holmes would set out for the scene; he had expected and hoped for it","time":{"at":"t.thu_breakfast"},"para":4,"quote":"it was only what I had both expected and hoped for"}
{"id":"f.watson_offers","of":"watson","attr":"intends","value":"to go down with Holmes","time":{"at":"t.thu_breakfast"},"para":5,"quote":"I should be most happy to go down with you"}
{"id":"f.holmes_welcomes","of":"holmes","attr":"says","value":"Watson would do him a great favour by coming","to":"watson","time":{"at":"t.thu_breakfast"},"para":6,"quote":"you would confer a great favour upon me by coming"}
{"id":"f.holmes_unique","of":"holmes","attr":"believes","value":"points about the case promise to make it absolutely unique","time":{"at":"t.thu_breakfast"},"para":6,"quote":"there are points about the case which promise to make it an absolutely unique one"}
{"id":"f.holmes_intends_train","of":"holmes","attr":"intends","value":"to catch their train at Paddington","time":{"at":"t.thu_breakfast"},"para":6,"quote":"just time to catch our train at Paddington"}
{"id":"f.holmes_intends_explain","of":"holmes","attr":"intends","value":"to go further into the matter on the journey","time":{"at":"t.thu_breakfast"},"para":6,"quote":"I will go further into the matter upon our journey"}
{"id":"f.holmes_asks_glass","of":"holmes","attr":"action","act":"ask","thing":"field_glass","value":"asks Watson to bring his field-glass","to":"watson","time":{"at":"t.thu_breakfast"},"para":6,"quote":"You would oblige me by bringing with you your very excellent field-glass"}
{"id":"f.glass_owner","of":"field_glass","attr":"owner","value":"watson","basis":"implied","time":{"at":"t.thu_breakfast"},"para":6,"quote":"your very excellent field-glass"}
{"id":"f.holmes_paddington","of":"holmes","attr":"location","value":"paddington","basis":"implied","time":{"at":"t.paddington"},"para":7,"quote":"which he had procured at Paddington"}
{"id":"f.watson_paddington","of":"watson","attr":"location","value":"paddington","basis":"implied","time":{"at":"t.paddington"},"para":7,"quote":"which he had procured at Paddington"}
{"id":"f.holmes_procures","of":"holmes","attr":"action","value":"procures a bundle of fresh papers","time":{"at":"t.paddington"},"para":7,"quote":"the bundle of fresh papers which he had procured at Paddington"}
{"id":"f.watson_carriage","of":"watson","attr":"location","value":"carriage","detail":"in the corner","time":{"from":"t.train_out","to":"t.train_beyond_reading"},"para":7,"quote":"I found myself in the corner of a first-class carriage"}
{"id":"f.holmes_carriage","of":"holmes","attr":"location","value":"carriage","basis":"implied","time":{"from":"t.train_out","to":"t.train_beyond_reading"},"para":7,"quote":"while Sherlock Holmes"}
{"id":"f.train_to_exeter","of":"train","attr":"action","value":"flies along en route for Exeter","time":{"from":"t.train_out","to":"t.train_beyond_reading"},"para":7,"quote":"flying along en route for Exeter"}
{"id":"f.holmes_cap","of":"holmes","attr":"wearing","value":"travelling_cap","time":{"from":"t.train_out"},"para":7,"quote":"his sharp, eager face framed in his ear-flapped travelling-cap"}
{"id":"f.holmes_reads_papers","of":"holmes","attr":"action","value":"dips rapidly into the bundle of fresh papers","time":{"at":"t.train_out"},"para":7,"quote":"dipped rapidly into the bundle of fresh papers"}
{"id":"f.holmes_carries_papers","of":"holmes","attr":"carrying","value":"bundle_of_papers","time":{"from":"t.paddington","to":"t.train_beyond_reading"},"para":7,"quote":"the bundle of fresh papers which he had procured at Paddington"}
{"id":"f.train_reading","of":"train","attr":"location","value":"reading","detail":"passing","basis":"implied","time":{"at":"t.train_reading"},"para":7,"quote":"We had left Reading far behind us"}
{"id":"f.papers_under_seat","of":"bundle_of_papers","attr":"location","value":"carriage","detail":"under the seat","time":{"from":"t.train_beyond_reading"},"para":7,"quote":"he thrust the last one of them under the seat"}
{"id":"f.holmes_offers_cigars","of":"holmes","attr":"action","act":"give","thing":"cigar_case","value":"offers Watson his cigar-case","to":"watson","time":{"at":"t.train_beyond_reading"},"para":7,"quote":"offered me his cigar-case"}
{"id":"f.holmes_window","of":"holmes","attr":"action","value":"looks out of the window and glances at his watch","time":{"at":"t.train_beyond_reading"},"para":8,"quote":"looking out the window and glancing at his watch"}
{"id":"f.holmes_has_watch","of":"holmes","attr":"carrying","value":"holmes_watch","basis":"implied","time":{"at":"t.train_beyond_reading"},"para":8,"quote":"glancing at his watch"}
{"id":"f.holmes_says_speed","of":"holmes","attr":"says","value":"the train's rate is fifty-three and a half miles an hour","to":"watson","time":{"at":"t.train_beyond_reading"},"para":8,"quote":"Our rate at present is fifty-three and a half miles an hour","asserts":[{"of":"train","attr":"speed","value":"fifty-three and a half miles an hour","time":{"at":"t.train_beyond_reading"}}]}
{"id":"f.watson_no_posts","of":"watson","attr":"says","value":"he has not observed the quarter-mile posts","to":"holmes","time":{"at":"t.train_beyond_reading"},"para":9,"quote":"I have not observed the quarter-mile posts"}
{"id":"f.holmes_no_posts","of":"holmes","attr":"says","value":"he has not observed them either, but reckoned from the telegraph posts","to":"watson","time":{"at":"t.train_beyond_reading"},"para":10,"quote":"Nor have I."}
{"id":"f.posts_sixty_yards","of":"telegraph_posts","attr":"condition","value":"sixty yards apart","word":"holmes","time":{"at":"t.train_beyond_reading"},"para":10,"quote":"the telegraph posts upon this line are sixty yards apart"}
{"id":"f.holmes_asks_matter","of":"holmes","attr":"action","act":"ask","value":"asks whether Watson has looked into the murder of John Straker and the disappearance of Silver Blaze","to":"watson","time":{"at":"t.train_beyond_reading"},"para":10,"quote":"I presume that you have looked into this matter of the murder of John Straker and the disappearance of Silver Blaze?"}
{"id":"f.horse_name","of":"silver_blaze","attr":"name","value":"Silver Blaze","time":{"at":"t.train_beyond_reading"},"para":10,"quote":"the disappearance of Silver Blaze"}
{"id":"f.straker_name","of":"straker","attr":"name","value":"John Straker","time":{"at":"t.train_beyond_reading"},"para":10,"quote":"the murder of John Straker"}
{"id":"f.watson_read_papers","of":"watson","attr":"action","value":"has read what the Telegraph and the Chronicle say of the case","time":{"at":"t.watson_reads_papers"},"para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say"}
{"id":"f.holmes_method","of":"holmes","attr":"believes","value":"the case calls for sifting details rather than acquiring fresh evidence: the facts must be detached from the embellishments of theorists and reporters","time":{"at":"t.train_beyond_reading"},"para":12,"quote":"the art of the reasoner should be used rather for the sifting of details than for the acquiring of fresh evidence"}
{"id":"f.holmes_surmise","of":"holmes","attr":"says","value":"the case is beset by a plethora of surmise, conjecture and hypothesis","to":"watson","time":{"at":"t.train_beyond_reading"},"para":12,"quote":"we are suffering from a plethora of surmise, conjecture, and hypothesis"}
{"id":"f.cal_tue","of":"calendar","attr":"weekday","value":"Tuesday","time":{"at":"t.tue_evening"},"para":12,"quote":"On Tuesday evening"}
{"id":"f.ross_sends","of":"ross","attr":"action","value":"telegraphs Holmes inviting his co-operation","to":"holmes","time":{"at":"t.tue_evening"},"para":12,"quote":"I received telegrams from both Colonel Ross"}
{"id":"f.gregory_sends","of":"gregory","attr":"action","value":"telegraphs Holmes inviting his co-operation","to":"holmes","time":{"at":"t.tue_evening"},"para":12,"quote":"and from Inspector Gregory, who is looking after the case, inviting my co-operation"}
{"id":"f.holmes_receives","of":"holmes","attr":"action","value":"receives telegrams from Colonel Ross and Inspector Gregory","time":{"at":"t.tue_evening"},"para":12,"quote":"On Tuesday evening I received telegrams"}
{"id":"f.ross_owner","of":"silver_blaze","attr":"owner","value":"ross","time":{"at":"t.tue_evening"},"para":12,"quote":"Colonel Ross, the owner of the horse"}
{"id":"f.gregory_role","of":"gregory","attr":"role","value":"police inspector looking after the case","time":{"from":"t.tue_evening"},"para":12,"quote":"Inspector Gregory, who is looking after the case"}
{"id":"f.cal_thu","of":"calendar","attr":"weekday","value":"Thursday","time":{"at":"t.train_beyond_reading"},"para":13,"quote":"And this is Thursday morning."}
{"id":"f.watson_asks_why","of":"watson","attr":"action","act":"ask","value":"asks why Holmes did not go down the day before","to":"holmes","time":{"at":"t.train_beyond_reading"},"para":13,"quote":"Why didn’t you go down yesterday?"}
{"id":"f.holmes_blunder","of":"holmes","attr":"says","value":"he made a blunder","to":"watson","time":{"at":"t.train_beyond_reading"},"para":14,"quote":"Because I made a blunder"}
{"id":"f.holmes_believed_found","of":"holmes","attr":"believes","value":"the most remarkable horse in England could not long remain concealed in the sparsely inhabited north of Dartmoor","time":{"from":"t.tue_evening","to":"t.thu_breakfast"},"para":14,"quote":"I could not believe it possible that the most remarkable horse in England could long remain concealed","asserts":[{"of":"silver_blaze","attr":"condition","value":"found","time":{"before":"t.thu_breakfast"}}]}
{"id":"f.horse_remarkable","of":"silver_blaze","attr":"reputed","value":"the most remarkable horse in England","time":{"at":"t.crime"},"para":14,"quote":"the most remarkable horse in England"}
{"id":"f.dartmoor_sparse","of":"dartmoor","attr":"condition","value":"the north of Dartmoor is sparsely inhabited","time":{"at":"t.crime"},"para":14,"quote":"so sparsely inhabited a place as the north of Dartmoor"}
{"id":"f.holmes_expected_abductor","of":"holmes","attr":"believes","value":"the horse would be found, and its abductor would prove to be Straker's murderer","time":{"at":"t.wed"},"para":14,"quote":"From hour to hour yesterday I expected to hear that he had been found, and that his abductor was the murderer of John Straker","asserts":[{"q":"q.who_killed","pick":"the one who took the horse"},{"q":"q.who_took","pick":"the murderer of the trainer"},{"q":"q.connection","pick":"one person took the horse and killed the trainer who got in the way"}]}
{"id":"f.simpson_arrested","of":"simpson","attr":"condition","value":"arrested","time":{"from":"t.simpson_arrest"},"para":14,"quote":"the arrest of young Fitzroy Simpson"}
{"id":"f.simpson_young","of":"simpson","attr":"condition","value":"young","time":{"at":"t.simpson_arrest"},"para":14,"quote":"young Fitzroy Simpson"}
{"id":"f.horse_not_found","of":"silver_blaze","attr":"condition","value":"found","neg":true,"time":{"from":"t.crime","to":"t.thu_breakfast"},"para":14,"quote":"beyond the arrest of young Fitzroy Simpson nothing had been done"}
{"id":"f.holmes_decides","of":"holmes","attr":"intends","value":"to take action himself","time":{"at":"t.thu_breakfast"},"para":14,"quote":"I felt that it was time for me to take action"}
{"id":"f.holmes_not_wasted","of":"holmes","attr":"believes","value":"the day of waiting was not wasted","time":{"at":"t.train_beyond_reading"},"para":14,"quote":"Yet in some ways I feel that yesterday has not been wasted."}
{"id":"f.watson_asks_theory","of":"watson","attr":"action","act":"ask","value":"asks whether Holmes has formed a theory","to":"holmes","time":{"at":"t.train_beyond_reading"},"para":15,"quote":"You have formed a theory, then?"}
{"id":"f.holmes_grip","of":"holmes","attr":"says","value":"he has at least got a grip of the essential facts of the case","to":"watson","time":{"at":"t.train_beyond_reading"},"para":16,"quote":"At least I have got a grip of the essential facts of the case"}
{"id":"f.holmes_will_enumerate","of":"holmes","attr":"intends","value":"to enumerate the facts of the case to Watson","time":{"at":"t.train_beyond_reading"},"para":16,"quote":"I shall enumerate them to you"}
{"id":"f.press_to_watson","of":"the_telegraph","attr":"tells","value":"acct.press","to":"watson","how":"newspaper","partial":true,"time":{"at":"t.watson_reads_papers"},"para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say"}
{"id":"f.chronicle_to_watson","of":"the_chronicle","attr":"tells","value":"acct.press","to":"watson","how":"newspaper","partial":true,"time":{"at":"t.watson_reads_papers"},"para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say"}
{"id":"f.papers_to_holmes","of":"fresh_editions","attr":"tells","value":"acct.press","to":"holmes","how":"newspaper","basis":"implied","time":{"at":"t.wed"},"para":4,"quote":"Fresh editions of every paper had been sent up by our news agent, only to be glanced over"}
{"id":"f.ross_tells_holmes","of":"ross","attr":"tells","value":"acct.ross","to":"holmes","how":"telegram","time":{"at":"t.tue_evening"},"para":12,"quote":"I received telegrams from both Colonel Ross"}
{"id":"f.gregory_tells_holmes","of":"gregory","attr":"tells","value":"acct.gregory","to":"holmes","how":"telegram","time":{"at":"t.tue_evening"},"para":12,"quote":"and from Inspector Gregory"}
{"id":"f.holmes_tells_watson","of":"holmes","attr":"tells","value":["acct.holmes","acct.ross","acct.gregory","acct.press"],"to":"watson","how":"told","partial":true,"time":{"at":"t.train_beyond_reading"},"para":12,"quote":"On Tuesday evening I received telegrams"}
{"id":"f.watson_lies_back","of":"watson","attr":"action","value":"lies back against the cushions, puffing at his cigar","time":{"at":"t.train_beyond_reading"},"para":17,"quote":"I lay back against the cushions, puffing at my cigar"}
{"id":"f.watson_smokes","of":"watson","attr":"carrying","value":"watson_cigar","basis":"implied","time":{"at":"t.train_beyond_reading"},"para":17,"quote":"puffing at my cigar"}
{"id":"f.holmes_counts","of":"holmes","attr":"action","value":"leans forward, checking off the points with his forefinger on the palm of his left hand","time":{"at":"t.train_beyond_reading"},"para":17,"quote":"with his long, thin forefinger checking off the points upon the palm of his left hand"}
{"id":"f.holmes_tells_sketch","of":"holmes","attr":"tells","value":["acct.press","acct.police","acct.holmes"],"to":"watson","how":"told","time":{"at":"t.train_beyond_reading"},"para":17,"quote":"gave me a sketch of the events which had led to our journey"}
{"id":"f.horse_stock","of":"silver_blaze","attr":"condition","value":"of the Isonomy stock","time":{"from":"t.before"},"para":18,"quote":"is from the Isonomy stock"}
{"id":"f.isonomy_famous","of":"isonomy","attr":"reputed","value":"Silver Blaze's famous ancestor","time":{"at":"t.before"},"para":18,"quote":"his famous ancestor"}
{"id":"f.horse_record","of":"silver_blaze","attr":"reputed","value":"holds as brilliant a record as his famous ancestor","time":{"at":"t.crime"},"para":18,"quote":"holds as brilliant a record as his famous ancestor"}
{"id":"f.horse_fifth_year","of":"silver_blaze","attr":"condition","value":"in his fifth year","time":{"at":"t.train_beyond_reading"},"para":18,"quote":"He is now in his fifth year"}
{"id":"f.horse_prizes","of":"silver_blaze","attr":"action","value":"has brought in turn each of the prizes of the turf to Colonel Ross","time":{"after":"t.before","before":"t.crime"},"para":18,"quote":"has brought in turn each of the prizes of the turf to Colonel Ross"}
{"id":"f.horse_odds","of":"silver_blaze","attr":"condition","value":"first favourite for the Wessex Cup, the betting three to one on him","time":{"from":"t.before","to":"t.crime"},"para":18,"quote":"the betting being three to one on him"}
{"id":"f.horse_public_favourite","of":"silver_blaze","attr":"reputed","value":"a prime favourite with the racing public, who has never yet disappointed them","time":{"from":"t.before"},"para":18,"quote":"has always, however, been a prime favourite with the racing public"}
{"id":"f.public_bets","of":"racing_public","attr":"action","value":"lays enormous sums of money upon Silver Blaze","time":{"before":"t.crime"},"para":18,"quote":"enormous sums of money have been laid upon him"}
{"id":"f.holmes_says_interest","of":"holmes","attr":"says","value":"many people had the strongest interest in keeping Silver Blaze from the race","to":"watson","time":{"at":"t.train_beyond_reading"},"para":18,"quote":"there were many people who had the strongest interest in preventing Silver Blaze from being there","asserts":[{"of":"silver_blaze","attr":"condition","value":"many people have the strongest interest in preventing him from running","time":{"at":"t.crime"}}]}
{"id":"f.race_time","of":"wessex_cup","attr":"time","value":"next Tuesday","time":{"at":"t.race"},"para":18,"quote":"at the fall of the flag next Tuesday"}
{"id":"f.cal_race","of":"calendar","attr":"weekday","value":"Tuesday","time":{"at":"t.race"},"para":18,"quote":"next Tuesday"}
{"id":"f.kp_aware","of":"kings_pyland_stable","attr":"knows","value":"many people had an interest in stopping the favourite","time":{"before":"t.crime"},"para":19,"quote":"The fact was, of course, appreciated at King's Pyland"}
{"id":"f.stables_owner","of":"stables","attr":"owner","value":"ross","time":{"from":"t.before"},"para":19,"quote":"where the Colonel's training-stable is situated"}
{"id":"f.precautions","of":"kings_pyland_stable","attr":"action","value":"takes every precaution to guard the favourite","time":{"before":"t.crime"},"para":19,"quote":"Every precaution was taken to guard the favourite."}
{"id":"f.straker_jockey","of":"straker","attr":"role","value":"retired jockey who rode in Colonel Ross's colours","time":{"at":"t.straker_years"},"para":19,"quote":"is a retired jockey who rode in Colonel Ross's colours"}
{"id":"f.straker_heavy","of":"straker","attr":"condition","value":"became too heavy for the weighing-chair","time":{"at":"t.straker_years"},"para":19,"quote":"before he became too heavy for the weighing-chair"}
{"id":"f.straker_served","of":"straker","attr":"action","value":"serves the Colonel five years as jockey and seven as trainer","time":{"at":"t.straker_years"},"para":19,"quote":"He has served the Colonel for five years as jockey and for seven as trainer"}
{"id":"f.straker_honest","of":"straker","attr":"reputed","value":"a zealous and honest servant","time":{"at":"t.straker_years"},"para":19,"quote":"has always shown himself to be a zealous and honest servant"}
{"id":"f.lads_under_straker","of":"stable_lads","attr":"role","value":"the three lads under Straker","time":{"from":"t.before"},"para":19,"quote":"Under him were three lads"}
{"id":"f.establishment_small","of":"kings_pyland_stable","attr":"condition","value":"a small establishment with only four horses","time":{"at":"t.crime"},"para":19,"quote":"for the establishment was a small one, containing only four horses in all"}
{"id":"f.horses_kept","of":"kings_pyland_horses","attr":"lives_at","value":"stables","basis":"implied","time":{"from":"t.before"},"para":19,"quote":"containing only four horses in all"}
{"id":"f.blaze_member","of":"silver_blaze","attr":"member_of","value":"kings_pyland_horses","basis":"implied","time":{"from":"t.before"},"para":19,"quote":"Every precaution was taken to guard the favourite."}
{"id":"f.lads_routine","of":"stable_lads","attr":"action","value":"one sits up each night in the stable while the other two sleep in the loft","time":{"from":"t.before"},"para":19,"quote":"One of these lads sat up each night in the stable, while the others slept in the loft"}
{"id":"f.lads_characters","of":"stable_lads","attr":"reputed","value":"excellent characters","time":{"at":"t.crime"},"para":19,"quote":"All three bore excellent characters."}
{"id":"f.straker_married","of":"straker","attr":"condition","value":"married","time":{"at":"t.crime"},"para":19,"quote":"who is a married man"}
{"id":"f.straker_lives","of":"straker","attr":"lives_at","value":"straker_villa","time":{"from":"t.before"},"para":19,"quote":"lived in a small villa about two hundred yards from the stables"}
{"id":"f.villa_position","of":"straker_villa","attr":"position","value":"about two hundred yards from the stables","time":{"from":"t.before"},"para":19,"quote":"a small villa about two hundred yards from the stables"}
{"id":"f.straker_childless","of":"straker","attr":"condition","value":"has no children","time":{"at":"t.crime"},"para":19,"quote":"He has no children"}
{"id":"f.straker_keeps_maid","of":"straker","attr":"condition","value":"keeps one maid-servant","time":{"at":"t.crime"},"para":19,"quote":"keeps one maid-servant"}
{"id":"f.straker_comfortable","of":"straker","attr":"condition","value":"comfortably off","time":{"at":"t.crime"},"para":19,"quote":"is comfortably off"}
{"id":"f.country_lonely","of":"kings_pyland","attr":"condition","value":"the country round is very lonely","time":{"at":"t.crime"},"para":19,"quote":"The country round is very lonely"}
{"id":"f.villas_north","of":"villas","attr":"position","value":"about half a mile to the north of King's Pyland","time":{"from":"t.before"},"para":19,"quote":"about half a mile to the north there is a small cluster of villas"}
{"id":"f.villas_built","of":"tavistock_contractor","attr":"action","value":"builds the villas for invalids and others who wish to enjoy the Dartmoor air","time":{"at":"t.before"},"para":19,"quote":"which have been built by a Tavistock contractor for the use of invalids"}
{"id":"f.tavistock_west","of":"tavistock","attr":"position","value":"two miles to the west","time":{"from":"t.before"},"para":19,"quote":"Tavistock itself lies two miles to the west"}
{"id":"f.mapleton_position","of":"mapleton","attr":"position","value":"across the moor, about two miles distant","time":{"from":"t.before"},"para":19,"quote":"across the moor, also about two miles distant"}
{"id":"f.mapleton_larger","of":"mapleton","attr":"condition","value":"a larger training establishment","time":{"at":"t.crime"},"para":19,"quote":"is the larger training establishment of Mapleton"}
{"id":"f.mapleton_owner","of":"mapleton","attr":"owner","value":"backwater","time":{"at":"t.crime"},"para":19,"quote":"which belongs to Lord Backwater"}
{"id":"f.brown_manages","of":"silas_brown","attr":"role","value":"manager of the Mapleton establishment","time":{"at":"t.crime"},"para":19,"quote":"is managed by Silas Brown"}
{"id":"f.moor_wild","of":"dartmoor","attr":"condition","value":"in every other direction the moor is a complete wilderness","time":{"at":"t.crime"},"para":19,"quote":"In every other direction the moor is a complete wilderness"}
{"id":"f.gypsies_moor","of":"gypsies","attr":"lives_at","value":"dartmoor","detail":"a few roaming gypsies","time":{"at":"t.crime"},"para":19,"quote":"inhabited only by a few roaming gypsies"}
{"id":"f.cal_monday","of":"calendar","attr":"weekday","value":"Monday","time":{"at":"t.mon_evening"},"para":19,"quote":"last Monday night when the catastrophe occurred"}
{"id":"f.horses_exercised","of":"kings_pyland_horses","attr":"action","value":"exercised and watered as usual","time":{"at":"t.mon_evening"},"para":20,"quote":"the horses had been exercised and watered as usual"}
{"id":"f.stables_locked","of":"stable_door","attr":"door","value":"locked","time":{"from":"t.mon_nine"},"para":20,"quote":"the stables were locked up at nine o'clock"}
{"id":"f.clock_nine","of":"clock","attr":"hour","value":"nine o'clock","time":{"at":"t.mon_nine"},"para":20,"quote":"at nine o'clock"}
{"id":"f.lads_to_house","of":"two_lads","attr":"action","value":"walk up to the trainer's house and have supper in the kitchen","time":{"at":"t.mon_nine"},"para":20,"quote":"Two of the lads walked up to the trainer's house, where they had supper in the kitchen"}
{"id":"f.lads_kitchen","of":"two_lads","attr":"location","value":"kitchen","time":{"from":"t.mon_nine","to":"t.mon_lads_return"},"para":20,"quote":"where they had supper in the kitchen"}
{"id":"f.two_lads_member","of":"two_lads","attr":"member_of","value":"stable_lads","basis":"implied","time":{"from":"t.before"},"para":20,"quote":"Two of the lads"}
{"id":"f.hunter_member","of":"hunter","attr":"member_of","value":"stable_lads","time":{"from":"t.before"},"para":20,"quote":"the third, Ned Hunter"}
{"id":"f.hunter_name","of":"hunter","attr":"name","value":"Ned Hunter","time":{"at":"t.mon_nine"},"para":20,"quote":"Ned Hunter"}
{"id":"f.hunter_guard","of":"hunter","attr":"action","value":"remains on guard in the stables","time":{"from":"t.mon_nine"},"para":20,"quote":"remained on guard"}
{"id":"f.hunter_stables","of":"hunter","attr":"location","value":"stables","time":{"from":"t.mon_nine","to":"t.mon_hunter_out"},"para":20,"quote":"remained on guard"}
{"id":"f.edith_name","of":"edith_baxter","attr":"name","value":"Edith Baxter","time":{"at":"t.mon_maid_path"},"para":20,"quote":"the maid, Edith Baxter"}
{"id":"f.edith_role","of":"edith_baxter","attr":"role","value":"the Strakers' maid-servant","time":{"at":"t.mon_maid_path"},"para":20,"quote":"the maid, Edith Baxter"}
{"id":"f.edith_lives","of":"edith_baxter","attr":"lives_at","value":"straker_villa","basis":"implied","time":{"from":"t.before"},"para":20,"quote":"the maid, Edith Baxter"}
{"id":"f.edith_carries_supper","of":"edith_baxter","attr":"action","value":"carries Hunter's supper down to the stables","time":{"at":"t.mon_maid_path"},"para":20,"quote":"carried down to the stables his supper"}
{"id":"f.edith_has_supper","of":"edith_baxter","attr":"carrying","value":"hunter_supper","time":{"at":"t.mon_maid_path"},"para":20,"quote":"carried down to the stables his supper"}
{"id":"f.supper_contents","of":"hunter_supper","attr":"contents","value":"a dish of curried mutton","time":{"at":"t.mon_maid_path"},"para":20,"quote":"which consisted of a dish of curried mutton"}
{"id":"f.clock_after_nine","of":"clock","attr":"hour","value":"a few minutes after nine","time":{"at":"t.mon_maid_path"},"para":20,"quote":"At a few minutes after nine"}
{"id":"f.edith_no_liquid","of":"edith_baxter","attr":"carrying","value":"liquid","neg":true,"time":{"at":"t.mon_maid_path"},"para":20,"quote":"She took no liquid"}
{"id":"f.tap_in_stables","of":"water_tap","attr":"location","value":"stables","time":{"from":"t.before"},"para":20,"quote":"there was a water-tap in the stables"}
{"id":"f.drink_rule","of":"stable_lads","attr":"rule","value":"the lad on duty drinks nothing but water from the stable tap","time":{"from":"t.before"},"para":20,"quote":"it was the rule that the lad on duty should drink nothing else"}
{"id":"f.edith_lantern","of":"edith_baxter","attr":"carrying","value":"lantern","time":{"at":"t.mon_maid_path"},"para":20,"quote":"The maid carried a lantern with her"}
{"id":"f.night_dark","of":"path","attr":"condition","value":"very dark","time":{"at":"t.mon_maid_path"},"para":20,"quote":"as it was very dark"}
{"id":"f.path_open_moor","of":"path","attr":"condition","value":"runs across the open moor","time":{"from":"t.before"},"para":20,"quote":"the path ran across the open moor"}
{"id":"f.edith_on_path","of":"edith_baxter","attr":"location","value":"path","detail":"within thirty yards of the stables","time":{"at":"t.mon_maid_path"},"para":21,"quote":"Edith Baxter was within thirty yards of the stables"}
{"id":"f.stranger_appears","of":"the_stranger","attr":"action","value":"appears out of the darkness and calls to the maid to stop","time":{"at":"t.mon_maid_path"},"para":21,"quote":"a man appeared out of the darkness and called to her to stop"}
{"id":"f.stranger_on_path","of":"the_stranger","attr":"location","value":"path","detail":"within thirty yards of the stables","basis":"implied","time":{"at":"t.mon_maid_path"},"para":21,"quote":"a man appeared out of the darkness"}
{"id":"f.stranger_bearing","of":"the_stranger","attr":"condition","value":"of gentlemanly bearing","time":{"at":"t.mon_maid_path"},"para":21,"quote":"a person of gentlemanly bearing"}
{"id":"f.stranger_suit","of":"the_stranger","attr":"wearing","value":"stranger_suit","time":{"at":"t.mon_maid_path"},"para":21,"quote":"dressed in a grey suit of tweeds"}
{"id":"f.stranger_capw","of":"the_stranger","attr":"wearing","value":"stranger_cap","time":{"at":"t.mon_maid_path"},"para":21,"quote":"with a cloth cap"}
{"id":"f.stranger_gaitersw","of":"the_stranger","attr":"wearing","value":"stranger_gaiters","time":{"at":"t.mon_maid_path"},"para":21,"quote":"He wore gaiters"}
{"id":"f.stranger_has_stick","of":"the_stranger","attr":"carrying","value":"stranger_stick","time":{"at":"t.mon_maid_path"},"para":21,"quote":"carried a heavy stick with a knob to it"}
{"id":"f.stranger_pale","of":"the_stranger","attr":"condition","value":"extremely pale","time":{"at":"t.mon_maid_path"},"para":21,"quote":"the extreme pallor of his face"}
{"id":"f.stranger_nervous","of":"the_stranger","attr":"condition","value":"nervous in manner","time":{"at":"t.mon_maid_path"},"para":21,"quote":"the nervousness of his manner"}
{"id":"f.edith_age_guess","of":"edith_baxter","attr":"believes","value":"the stranger is rather over thirty than under","time":{"at":"t.mon_maid_path"},"para":21,"quote":"His age, she thought, would be rather over thirty than under it.","asserts":[{"of":"the_stranger","attr":"condition","value":"rather over thirty","time":{"at":"t.mon_maid_path"}}]}
{"id":"f.edith_sees_stranger","of":"edith_baxter","attr":"observes","value":["f.stranger_bearing","f.stranger_suit","f.stranger_capw","f.stranger_gaitersw","f.stranger_has_stick","f.stranger_pale","f.stranger_nervous"],"time":{"at":"t.mon_maid_path"},"para":21,"quote":"she saw that he was a person of gentlemanly bearing"}
{"id":"f.stranger_asks_where","of":"the_stranger","attr":"action","act":"ask","value":"asks the maid where he is","to":"edith_baxter","time":{"at":"t.mon_maid_path"},"para":22,"quote":"Can you tell me where I am?"}
{"id":"f.stranger_says_lost","of":"the_stranger","attr":"says","value":"he had almost made up his mind to sleep on the moor when he saw her lantern","to":"edith_baxter","time":{"at":"t.mon_maid_path"},"para":22,"quote":"I had almost made up my mind to sleep on the moor, when I saw the light of your lantern","asserts":[{"of":"the_stranger","attr":"condition","value":"lost on the moor","time":{"at":"t.mon_maid_path"}},{"q":"q.stranger_lost","pick":"lost on the moor, as he says"}]}
{"id":"f.edith_says_close","of":"edith_baxter","attr":"says","value":"he is close to the King's Pyland training-stables","to":"the_stranger","time":{"at":"t.mon_maid_path"},"para":23,"quote":"You are close to the King's Pyland training-stables","asserts":[{"of":"the_stranger","attr":"location","value":"path","detail":"close to the King's Pyland stables","time":{"at":"t.mon_maid_path"}}]}
{"id":"f.stranger_luck","of":"the_stranger","attr":"says","value":"it is a stroke of luck","to":"edith_baxter","time":{"at":"t.mon_maid_path"},"para":24,"quote":"Oh, indeed! What a stroke of luck!"}
{"id":"f.stranger_knows_routine","of":"the_stranger","attr":"says","value":"he understands a stable-boy sleeps there alone every night","to":"edith_baxter","time":{"at":"t.mon_maid_path"},"para":24,"quote":"I understand that a stable-boy sleeps there alone every night.","asserts":[{"of":"stable_lads","attr":"action","value":"one lad sleeps alone in the stable every night"}]}
{"id":"f.stranger_guess_supper","of":"the_stranger","attr":"says","value":"perhaps she is carrying the boy's supper","to":"edith_baxter","modal":"possible","time":{"at":"t.mon_maid_path"},"para":24,"quote":"Perhaps that is his supper which you are carrying to him.","asserts":[{"of":"edith_baxter","attr":"carrying","value":"hunter_supper","time":{"at":"t.mon_maid_path"}}]}
{"id":"f.stranger_bribe_dress","of":"the_stranger","attr":"says","value":"she would not be too proud to earn the price of a new dress","to":"edith_baxter","time":{"at":"t.mon_maid_path"},"para":24,"quote":"you would not be too proud to earn the price of a new dress"}
{"id":"f.stranger_takes_paper","of":"the_stranger","attr":"action","value":"takes a folded piece of white paper out of his waistcoat pocket","time":{"at":"t.mon_maid_path"},"para":24,"quote":"He took a piece of white paper folded up out of his waistcoat pocket."}
{"id":"f.stranger_carries_paper","of":"the_stranger","attr":"carrying","value":"paper_packet","time":{"at":"t.mon_maid_path"},"para":24,"quote":"He took a piece of white paper folded up out of his waistcoat pocket."}
{"id":"f.stranger_asks_give","of":"the_stranger","attr":"says","value":"she should see that the boy has the paper to-night, and she shall have the prettiest frock money can buy","to":"edith_baxter","time":{"at":"t.mon_maid_path"},"para":24,"quote":"See that the boy has this to-night, and you shall have the prettiest frock that money can buy.","asserts":[{"of":"the_stranger","attr":"intends","value":"that the stable-boy should have the paper that night","time":{"at":"t.mon_maid_path"}}]}
{"id":"f.edith_frightened","of":"edith_baxter","attr":"condition","value":"frightened by the earnestness of his manner","time":{"at":"t.mon_maid_path"},"para":25,"quote":"She was frightened by the earnestness of his manner"}
{"id":"f.edith_runs","of":"edith_baxter","attr":"action","value":"runs past him to the window through which she hands in the meals","time":{"at":"t.mon_window"},"para":25,"quote":"ran past him to the window through which she was accustomed to hand the meals"}
{"id":"f.edith_at_window","of":"edith_baxter","attr":"location","value":"stable_window","detail":"outside","time":{"at":"t.mon_window"},"para":25,"quote":"ran past him to the window"}
{"id":"f.window_open","of":"stable_window","attr":"condition","value":"already open","time":{"at":"t.mon_window"},"para":25,"quote":"It was already opened"}
{"id":"f.hunter_at_table","of":"hunter","attr":"location","value":"small_table","detail":"seated inside","time":{"at":"t.mon_window"},"para":25,"quote":"Hunter was seated at the small table inside"}
{"id":"f.edith_begins_tell","of":"edith_baxter","attr":"tells","value":"acct.edith","to":"hunter","how":"told","partial":true,"time":{"at":"t.mon_window"},"para":25,"quote":"She had begun to tell him of what had happened"}
{"id":"f.stranger_returns","of":"the_stranger","attr":"location","value":"stable_window","detail":"outside","time":{"at":"t.mon_window"},"para":25,"quote":"when the stranger came up again"}
{"id":"f.stranger_greets","of":"the_stranger","attr":"says","value":"good evening; he wanted a word with Hunter","to":"hunter","time":{"at":"t.mon_window"},"para":26,"quote":"I wanted to have a word with you."}
{"id":"f.stranger_looks_through","of":"the_stranger","attr":"action","value":"looks through the window","time":{"at":"t.mon_window"},"para":26,"quote":"looking through the window"}
{"id":"f.stranger_packet_hand","of":"the_stranger","attr":"carrying","value":"paper_packet","detail":"a corner protruding from his closed hand","time":{"at":"t.mon_window"},"para":26,"quote":"the corner of the little paper packet protruding from his closed hand"}
{"id":"f.edith_sees_packet","of":"edith_baxter","attr":"observes","value":["f.stranger_packet_hand"],"time":{"at":"t.mon_window"},"para":26,"quote":"she noticed the corner of the little paper packet protruding from his closed hand"}
{"id":"f.edith_swears","of":"edith_baxter","attr":"tells","value":"acct.edith","to":"police","how":"sworn statement","time":{"at":"t.statements"},"para":26,"quote":"The girl has sworn"}
{"id":"f.hunter_asks_business","of":"hunter","attr":"action","act":"ask","value":"asks what business the stranger has there","to":"the_stranger","time":{"at":"t.mon_window"},"para":27,"quote":"What business have you here?"}
{"id":"f.stranger_offers_pocket","of":"the_stranger","attr":"says","value":"it is business that may put something into Hunter's pocket","to":"hunter","time":{"at":"t.mon_window"},"para":28,"quote":"It's business that may put something into your pocket"}
{"id":"f.stranger_two_horses","of":"the_stranger","attr":"says","value":"the stable has two horses in for the Wessex Cup, Silver Blaze and Bayard","to":"hunter","time":{"at":"t.mon_window"},"para":28,"quote":"You've two horses in for the Wessex Cup—Silver Blaze and Bayard.","asserts":[{"of":"bayard","attr":"role","value":"entered for the Wessex Cup"},{"of":"silver_blaze","attr":"role","value":"entered for the Wessex Cup"}]}
{"id":"f.bayard_entered","of":"bayard","attr":"role","value":"entered for the Wessex Cup","claim":"f.stranger_two_horses","time":{"at":"t.mon_window"},"para":28,"quote":"You've two horses in for the Wessex Cup—Silver Blaze and Bayard."}
{"id":"f.bayard_member","of":"bayard","attr":"member_of","value":"kings_pyland_horses","basis":"implied","claim":"f.stranger_two_horses","time":{"at":"t.mon_window"},"para":28,"quote":"You've two horses in for the Wessex Cup"}
{"id":"f.stranger_asks_tip","of":"the_stranger","attr":"says","value":"asks Hunter for the straight tip, and he won't be a loser","to":"hunter","time":{"at":"t.mon_window"},"para":28,"quote":"Let me have the straight tip and you won't be a loser."}
{"id":"f.stranger_asks_bayard","of":"the_stranger","attr":"action","act":"ask","value":"asks whether at the weights Bayard could give Silver Blaze a hundred yards in five furlongs, and whether the stable has put its money on him","to":"hunter","time":{"at":"t.mon_window"},"para":28,"quote":"Is it a fact that at the weights Bayard could give the other a hundred yards in five furlongs"}
{"id":"f.hunter_touts","of":"hunter","attr":"says","value":"the stranger is one of those damned touts, and he'll show him how they serve them in King's Pyland","to":"the_stranger","time":{"at":"t.mon_window"},"para":29,"quote":"So, you're one of those damned touts!","asserts":[{"of":"the_stranger","attr":"role","value":"racing tout","time":{"at":"t.mon_window"}}]}
{"id":"f.hunter_runs_dog","of":"hunter","attr":"action","value":"springs up and rushes across the stable to unloose the dog","time":{"at":"t.mon_window"},"para":29,"quote":"He sprang up and rushed across the stable to unloose the dog."}
{"id":"f.dog_kept","of":"dog","attr":"lives_at","value":"stables","basis":"implied","time":{"from":"t.before"},"para":29,"quote":"rushed across the stable to unloose the dog"}
{"id":"f.edith_flees","of":"edith_baxter","attr":"action","value":"flees away to the house","time":{"at":"t.mon_window"},"para":29,"quote":"The girl fled away to the house"}
{"id":"f.stranger_leaning","of":"the_stranger","attr":"position","value":"leaning through the window","time":{"at":"t.mon_window"},"para":29,"quote":"the stranger was leaning through the window"}
{"id":"f.edith_looks_back","of":"edith_baxter","attr":"observes","value":["f.stranger_leaning"],"time":{"at":"t.mon_window"},"para":29,"quote":"as she ran she looked back and saw that the stranger was leaning through the window"}
{"id":"f.hunter_out_dog","of":"hunter","attr":"action","value":"rushes out with the hound","time":{"at":"t.mon_hunter_out"},"para":29,"quote":"when Hunter rushed out with the hound"}
{"id":"f.stranger_gone","of":"the_stranger","attr":"location","value":"stable_window","neg":true,"detail":"gone","time":{"at":"t.mon_hunter_out"},"para":29,"quote":"he was gone"}
{"id":"f.hunter_searches","of":"hunter","attr":"action","value":"runs all round the buildings","time":{"at":"t.mon_hunter_out"},"para":29,"quote":"though he ran all round the buildings"}
{"id":"f.no_trace","of":"hunter","attr":"observes","value":"any trace of the stranger","neg":true,"time":{"at":"t.mon_hunter_out"},"para":29,"quote":"he failed to find any trace of him"}
{"id":"f.watson_asks_door","of":"watson","attr":"action","act":"ask","value":"asks whether the stable-boy left the door unlocked when he ran out with the dog","to":"holmes","time":{"at":"t.train_beyond_reading"},"para":30,"quote":"Did the stable-boy, when he ran out with the dog, leave the door unlocked behind him?"}
{"id":"f.holmes_praises","of":"holmes","attr":"says","value":"Watson's question is excellent","to":"watson","time":{"at":"t.train_beyond_reading"},"para":31,"quote":"Excellent, Watson, excellent!"}
{"id":"f.holmes_door_important","of":"holmes","attr":"believes","value":"the point of the door is of great importance","time":{"at":"t.wed"},"para":31,"quote":"The importance of the point struck me so forcibly"}
{"id":"f.holmes_sent_wire","of":"holmes","attr":"action","value":"sends a special wire to Dartmoor to clear up the matter of the door","time":{"at":"t.wed"},"para":31,"quote":"I sent a special wire to Dartmoor yesterday to clear the matter up"}
{"id":"f.wire_reply","of":"?","attr":"tells","value":"acct.hunter","to":"holmes","how":"telegram","partial":true,"basis":"implied","time":{"at":"t.wed"},"para":31,"quote":"to clear the matter up. The boy locked the door before he left it.","q":"q.wire_reply"}
{"id":"f.hunter_locks","of":"hunter","attr":"action","act":"lock","thing":"stable_door","value":"locks the door before leaving it","time":{"at":"t.mon_hunter_out"},"para":31,"quote":"The boy locked the door before he left it."}
{"id":"f.door_locked_after","of":"stable_door","attr":"door","value":"locked","basis":"implied","time":{"from":"t.mon_hunter_out"},"para":31,"quote":"The boy locked the door before he left it."}
{"id":"f.window_small","of":"stable_window","attr":"condition","value":"not large enough for a man to get through","time":{"from":"t.before"},"para":31,"quote":"The window, I may add, was not large enough for a man to get through."}
{"id":"f.hunter_waits","of":"hunter","attr":"action","value":"waits until his fellow-grooms have returned","time":{"at":"t.mon_lads_return"},"para":32,"quote":"Hunter waited until his fellow-grooms had returned"}
{"id":"f.lads_back","of":"two_lads","attr":"location","value":"stables","basis":"implied","time":{"at":"t.mon_lads_return"},"para":32,"quote":"until his fellow-grooms had returned"}
{"id":"f.hunter_tells_straker","of":"hunter","attr":"tells","value":"acct.hunter","to":"straker","how":"told","partial":true,"time":{"at":"t.mon_straker_told"},"para":32,"quote":"he sent a message to the trainer and told him what had occurred"}
{"id":"f.straker_excited","of":"straker","attr":"condition","value":"excited at hearing the account","time":{"at":"t.mon_straker_told"},"para":32,"quote":"Straker was excited at hearing the account"}
{"id":"f.straker_missed_significance","of":"straker","attr":"knows","value":"the true significance of Hunter's account","neg":true,"time":{"at":"t.mon_straker_told"},"para":32,"quote":"although he does not seem to have quite realized its true significance"}
{"id":"f.straker_uneasy","of":"straker","attr":"condition","value":"vaguely uneasy","time":{"from":"t.mon_straker_told","to":"t.straker_leaves"},"para":32,"quote":"It left him, however, vaguely uneasy"}
{"id":"f.mrs_straker_role","of":"mrs_straker","attr":"role","value":"John Straker's wife","basis":"implied","time":{"at":"t.straker_leaves"},"para":32,"quote":"Mrs. Straker, waking at one in the morning"}
{"id":"f.mrs_straker_lives","of":"mrs_straker","attr":"lives_at","value":"straker_villa","basis":"implied","time":{"from":"t.before"},"para":32,"quote":"Mrs. Straker, waking at one in the morning"}
{"id":"f.mrs_straker_wakes","of":"mrs_straker","attr":"action","value":"wakes at one in the morning","time":{"at":"t.straker_leaves"},"para":32,"quote":"Mrs. Straker, waking at one in the morning"}
{"id":"f.clock_one","of":"clock","attr":"hour","value":"one in the morning","time":{"at":"t.straker_leaves"},"para":32,"quote":"at one in the morning"}
{"id":"f.mrs_straker_villa","of":"mrs_straker","attr":"location","value":"straker_villa","basis":"implied","time":{"at":"t.straker_leaves"},"para":32,"quote":"found that he was dressing"}
{"id":"f.straker_villa_one","of":"straker","attr":"location","value":"straker_villa","basis":"implied","time":{"at":"t.straker_leaves"},"para":32,"quote":"found that he was dressing"}
{"id":"f.straker_dressing","of":"straker","attr":"action","value":"dresses","time":{"at":"t.straker_leaves"},"para":32,"quote":"found that he was dressing"}
{"id":"f.mrs_straker_asks","of":"mrs_straker","attr":"action","act":"ask","value":"asks her husband what he is doing","to":"straker","time":{"at":"t.straker_leaves"},"para":32,"quote":"In reply to her inquiries"}
{"id":"f.straker_says_anxious","of":"straker","attr":"says","value":"he cannot sleep for anxiety about the horses, and means to walk down to the stables to see that all is well","to":"mrs_straker","time":{"at":"t.straker_leaves"},"para":32,"quote":"he said that he could not sleep on account of his anxiety about the horses","asserts":[{"of":"straker","attr":"condition","value":"cannot sleep for anxiety about the horses","time":{"at":"t.straker_leaves"}},{"of":"straker","attr":"intends","value":"to walk down to the stables to see that all is well","time":{"at":"t.straker_leaves"}},{"q":"q.straker_reason","pick":"to see that all was well with the horses"}]}
{"id":"f.mrs_straker_begs","of":"mrs_straker","attr":"action","value":"begs him to remain at home","to":"straker","time":{"at":"t.straker_leaves"},"para":32,"quote":"She begged him to remain at home"}
{"id":"f.rain","of":"weather","attr":"condition","value":"rain pattering against the window","time":{"at":"t.straker_leaves"},"para":32,"quote":"she could hear the rain pattering against the window"}
{"id":"f.mrs_straker_hears_rain","of":"mrs_straker","attr":"observes","value":["f.rain"],"time":{"at":"t.straker_leaves"},"para":32,"quote":"she could hear the rain pattering against the window"}
{"id":"f.straker_mackintosh","of":"straker","attr":"wearing","value":"straker_coat","time":{"from":"t.straker_leaves"},"para":32,"quote":"he pulled on his large mackintosh"}
{"id":"f.straker_leaves_house","of":"straker","attr":"action","value":"leaves the house","time":{"at":"t.straker_leaves"},"para":32,"quote":"and left the house"}
{"id":"f.mrs_straker_wakes_seven","of":"mrs_straker","attr":"action","value":"wakes at seven in the morning","time":{"at":"t.morning_seven"},"para":33,"quote":"Mrs. Straker awoke at seven in the morning"}
{"id":"f.clock_seven","of":"clock","attr":"hour","value":"seven in the morning","time":{"at":"t.morning_seven"},"para":33,"quote":"at seven in the morning"}
{"id":"f.straker_not_returned","of":"straker","attr":"location","value":"straker_villa","neg":true,"time":{"at":"t.morning_seven"},"para":33,"quote":"her husband had not yet returned"}
{"id":"f.mrs_straker_dresses","of":"mrs_straker","attr":"action","value":"dresses herself hastily","time":{"at":"t.morning_seven"},"para":33,"quote":"She dressed herself hastily"}
{"id":"f.mrs_straker_calls_maid","of":"mrs_straker","attr":"action","value":"calls the maid","to":"edith_baxter","time":{"at":"t.morning_seven"},"para":33,"quote":"called the maid"}
{"id":"f.mrs_straker_sets_off","of":"mrs_straker","attr":"action","value":"sets off for the stables with the maid","time":{"at":"t.morning_seven"},"para":33,"quote":"set off for the stables"}
{"id":"f.mrs_at_stables","of":"mrs_straker","attr":"location","value":"stables","basis":"implied","time":{"at":"t.morning_seven"},"para":33,"quote":"The door was open; inside"}
{"id":"f.edith_at_stables","of":"edith_baxter","attr":"location","value":"stables","basis":"implied","time":{"at":"t.morning_seven"},"para":33,"quote":"called the maid, and set off for the stables"}
{"id":"f.door_open","of":"stable_door","attr":"door","value":"open","time":{"at":"t.morning_seven"},"para":33,"quote":"The door was open"}
{"id":"f.hunter_stupor","of":"hunter","attr":"condition","value":"sunk in a state of absolute stupor","time":{"at":"t.morning_seven"},"para":33,"quote":"Hunter was sunk in a state of absolute stupor"}
{"id":"f.hunter_on_chair","of":"hunter","attr":"location","value":"stables","detail":"huddled together upon a chair","time":{"at":"t.morning_seven"},"para":33,"quote":"huddled together upon a chair"}
{"id":"f.stall_empty","of":"silver_blaze","attr":"location","value":"stall","neg":true,"time":{"at":"t.morning_seven"},"para":33,"quote":"the favourite's stall was empty"}
{"id":"f.horse_stall_kept","of":"silver_blaze","attr":"lives_at","value":"stall","basis":"implied","time":{"from":"t.before"},"para":33,"quote":"the favourite's stall"}
{"id":"f.no_straker","of":"straker","attr":"location","value":"stables","neg":true,"time":{"at":"t.morning_seven"},"para":33,"quote":"there were no signs of his trainer"}
{"id":"f.mrs_straker_observes","of":"mrs_straker","attr":"observes","value":["f.door_open","f.hunter_stupor","f.hunter_on_chair","f.stall_empty","f.no_straker"],"time":{"at":"t.morning_seven"},"para":33,"quote":"The door was open; inside, huddled together upon a chair"}
{"id":"f.lads_loft","of":"two_lads","attr":"location","value":"loft","basis":"implied","time":{"from":"t.mon_lads_return","to":"t.morning_seven"},"para":34,"quote":"The two lads who slept in the chaff-cutting loft above the harness-room"}
{"id":"f.loft_above","of":"loft","attr":"position","value":"above the harness-room","time":{"from":"t.before"},"para":34,"quote":"the chaff-cutting loft above the harness-room"}
{"id":"f.lads_aroused","of":"two_lads","attr":"action","value":"are quickly aroused","time":{"at":"t.morning_seven"},"para":34,"quote":"were quickly aroused"}
{"id":"f.lads_heard_nothing","of":"two_lads","attr":"observes","value":"anything during the night","neg":true,"time":{"from":"t.mon_lads_return","to":"t.morning_seven"},"para":34,"quote":"They had heard nothing during the night"}
{"id":"f.lads_sound_sleepers","of":"two_lads","attr":"condition","value":"both sound sleepers","time":{"from":"t.before"},"para":34,"quote":"for they are both sound sleepers"}
{"id":"f.hunter_drugged","of":"hunter","attr":"condition","value":"under the influence of some powerful drug","time":{"at":"t.morning_seven"},"para":34,"quote":"Hunter was obviously under the influence of some powerful drug"}
{"id":"f.hunter_no_sense","of":"hunter","attr":"condition","value":"no sense can be got out of him","time":{"at":"t.morning_seven"},"para":34,"quote":"as no sense could be got out of him"}
{"id":"f.hunter_left","of":"hunter","attr":"condition","value":"left to sleep it off","time":{"from":"t.morning_seven","to":"t.hunter_recovers"},"para":34,"quote":"he was left to sleep it off"}
{"id":"f.edith_member","of":"edith_baxter","attr":"member_of","value":"two_women","basis":"implied","time":{"at":"t.morning_search"},"para":34,"quote":"the two women"}
{"id":"f.mrs_member","of":"mrs_straker","attr":"member_of","value":"two_women","basis":"implied","time":{"at":"t.morning_search"},"para":34,"quote":"the two women"}
{"id":"f.lads_search","of":"two_lads","attr":"action","value":"run out in search of the trainer and the horse","time":{"at":"t.morning_search"},"para":34,"quote":"the two lads and the two women ran out in search of the absentees"}
{"id":"f.women_search","of":"two_women","attr":"action","value":"run out in search of the trainer and the horse","time":{"at":"t.morning_search"},"para":34,"quote":"the two lads and the two women ran out in search of the absentees"}
{"id":"f.lads_hope","of":"two_lads","attr":"believes","value":"the trainer may have taken out the horse for early exercise","modal":"possible","time":{"at":"t.morning_search"},"para":34,"quote":"They still had hopes that the trainer had for some reason taken out the horse for early exercise","asserts":[{"of":"straker","attr":"action","value":"takes out the horse for early exercise","time":{"before":"t.morning_seven"}},{"q":"q.who_took","pick":"straker"}]}
{"id":"f.women_hope","of":"two_women","attr":"believes","value":"the trainer may have taken out the horse for early exercise","modal":"possible","time":{"at":"t.morning_search"},"para":34,"quote":"They still had hopes that the trainer had for some reason taken out the horse for early exercise","asserts":[{"of":"straker","attr":"action","value":"takes out the horse for early exercise","time":{"before":"t.morning_seven"}},{"q":"q.who_took","pick":"straker"}]}
{"id":"f.lads_knoll","of":"two_lads","attr":"location","value":"knoll","time":{"at":"t.morning_search"},"para":34,"quote":"on ascending the knoll near the house"}
{"id":"f.women_knoll","of":"two_women","attr":"location","value":"knoll","time":{"at":"t.morning_search"},"para":34,"quote":"on ascending the knoll near the house"}
{"id":"f.knoll_position","of":"knoll","attr":"position","value":"near the house","time":{"from":"t.before"},"para":34,"quote":"the knoll near the house"}
{"id":"f.knoll_view","of":"knoll","attr":"condition","value":"all the neighbouring moors are visible from it","time":{"from":"t.before"},"para":34,"quote":"from which all the neighbouring moors were visible"}
{"id":"f.no_sign_horse","of":"two_women","attr":"observes","value":"any sign of the missing favourite","neg":true,"time":{"at":"t.morning_search"},"para":34,"quote":"they not only could see no signs of the missing favourite"}
{"id":"f.tragedy_seen","of":"two_women","attr":"observes","value":["f.coat_on_bush"],"time":{"at":"t.morning_search"},"para":34,"quote":"they perceived something which warned them that they were in the presence of a tragedy"}
{"id":"f.coat_on_bush","of":"straker_coat","attr":"location","value":"furze_bush","detail":"flapping","time":{"at":"t.morning_search"},"para":35,"quote":"John Straker's overcoat was flapping from a furze-bush"}
{"id":"f.bush_position","of":"furze_bush","attr":"position","value":"about a quarter of a mile from the stables","time":{"at":"t.morning_search"},"para":35,"quote":"About a quarter of a mile from the stables"}
{"id":"f.hollow_position","of":"hollow","attr":"position","value":"immediately beyond the furze-bush","time":{"from":"t.before"},"para":35,"quote":"Immediately beyond there was a bowl-shaped depression in the moor"}
{"id":"f.body_hollow","of":"straker","attr":"location","value":"hollow","detail":"at the bottom","time":{"at":"t.morning_search"},"para":35,"quote":"at the bottom of this was found the dead body of the unfortunate trainer"}
{"id":"f.straker_dead","of":"straker","attr":"condition","value":"dead","time":{"at":"t.morning_search"},"para":35,"quote":"the dead body of the unfortunate trainer"}
{"id":"f.head_shattered","of":"straker","attr":"condition","value":"head shattered by a savage blow from some heavy weapon","time":{"at":"t.morning_search"},"para":35,"quote":"His head had been shattered by a savage blow from some heavy weapon"}
{"id":"f.thigh_cut","of":"straker","attr":"condition","value":"a long, clean cut on the thigh from some very sharp instrument","time":{"at":"t.morning_search"},"para":35,"quote":"he was wounded on the thigh, where there was a long, clean cut, inflicted evidently by some very sharp instrument"}
{"id":"f.straker_defended","of":"straker","attr":"action","value":"defends himself vigorously against his assailants","time":{"at":"t.crime"},"para":35,"quote":"Straker had defended himself vigorously against his assailants"}
{"id":"f.knife_right","of":"straker","attr":"carrying","value":"straker_knife","detail":"in his right hand","time":{"at":"t.morning_search"},"para":35,"quote":"in his right hand he held a small knife"}
{"id":"f.knife_bloody","of":"straker_knife","attr":"condition","value":"clotted with blood up to the handle","time":{"at":"t.morning_search"},"para":35,"quote":"which was clotted with blood up to the handle"}
{"id":"f.cravat_left","of":"straker","attr":"carrying","value":"cravat","detail":"clasped in his left hand","time":{"at":"t.morning_search"},"para":35,"quote":"in his left he clasped a red and black silk cravat"}
{"id":"f.edith_recognises","of":"edith_baxter","attr":"says","value":"the cravat is the one the stranger wore the evening before","time":{"after":"t.morning_search","before":"t.wed"},"para":35,"quote":"which was recognised by the maid as having been worn on the preceding evening by the stranger","asserts":[{"of":"the_stranger","attr":"wearing","value":"cravat","time":{"at":"t.mon_maid_path"}}]}
{"id":"f.stranger_cravat","of":"the_stranger","attr":"wearing","value":"cravat","claim":"f.edith_recognises","time":{"at":"t.mon_maid_path"},"para":35,"quote":"as having been worn on the preceding evening by the stranger who had visited the stables"}
{"id":"f.hunter_recovers","of":"hunter","attr":"action","value":"recovers from his stupor","time":{"at":"t.hunter_recovers"},"para":36,"quote":"Hunter, on recovering from his stupor"}
{"id":"f.hunter_cravat","of":"hunter","attr":"says","value":"the cravat belongs to the stranger","time":{"after":"t.hunter_recovers","before":"t.wed"},"para":36,"quote":"was also quite positive as to the ownership of the cravat","asserts":[{"of":"cravat","attr":"owner","value":"the_stranger"}]}
{"id":"f.hunter_believes_drugged","of":"hunter","attr":"believes","value":"the stranger drugged his curried mutton while standing at the window, and so deprived the stables of their watchman","time":{"after":"t.hunter_recovers","before":"t.wed"},"para":36,"quote":"He was equally certain that the same stranger had, while standing at the window, drugged his curried mutton","asserts":[{"of":"the_stranger","attr":"action","value":"drugs Hunter's curried mutton","time":{"at":"t.mon_window"}},{"q":"q.who_drugged","pick":"the_stranger"}]}
{"id":"f.hunter_tells_police","of":"hunter","attr":"tells","value":"acct.hunter","to":"police","how":"statement","basis":"implied","time":{"at":"t.statements"},"para":36,"quote":"Hunter, on recovering from his stupor, was also quite positive"}
{"id":"f.mud_proofs","of":"hollow","attr":"condition","value":"abundant proofs in the mud at the bottom that the horse was there","time":{"at":"t.morning_search"},"para":37,"quote":"there were abundant proofs in the mud which lay at the bottom of the fatal hollow"}
{"id":"f.horse_in_hollow","of":"silver_blaze","attr":"location","value":"hollow","time":{"at":"t.crime"},"para":37,"quote":"he had been there at the time of the struggle"}
{"id":"f.horse_disappeared","of":"silver_blaze","attr":"location","value":null,"detail":"disappeared","time":{"from":"t.morning_search"},"para":37,"quote":"from that morning he has disappeared"}
{"id":"f.reward_offered","of":"silver_blaze","attr":"condition","value":"a large reward has been offered for him","time":{"from":"t.reward"},"para":37,"quote":"a large reward has been offered"}
{"id":"f.gypsies_alert","of":"gypsies","attr":"condition","value":"on the alert for the horse","time":{"from":"t.reward"},"para":37,"quote":"all the gypsies of Dartmoor are on the alert"}
{"id":"f.no_news","of":"silver_blaze","attr":"condition","value":"no news has come of him","time":{"from":"t.morning_search","to":"t.train_beyond_reading"},"para":37,"quote":"no news has come of him"}
{"id":"f.supper_opium","of":"hunter_supper","attr":"contents","value":"opium","detail":"an appreciable quantity of powdered opium in the remains","time":{"at":"t.analysis"},"para":37,"quote":"an analysis has shown that the remains of his supper left by the stable-lad contain an appreciable quantity of powdered opium"}
{"id":"f.analysis_tells","of":"?","attr":"tells","value":"acct.analysis","to":"police","how":"analysis","time":{"after":"t.analysis","before":"t.wed"},"para":37,"quote":"an analysis has shown","q":"q.analysis_by"}
{"id":"f.house_same_dish","of":"house_supper","attr":"contents","value":"the same dish of curried mutton","time":{"after":"t.mon_nine","before":"t.mon_lads_return"},"para":37,"quote":"the people at the house partook of the same dish on the same night"}
{"id":"f.house_no_effect","of":"house_supper","attr":"condition","value":"eaten at the house without any ill effect","time":{"after":"t.mon_nine","before":"t.mon_lads_return"},"para":37,"quote":"without any ill effect"}
{"id":"f.holmes_main_facts","of":"holmes","attr":"says","value":"those are the main facts of the case, stripped of all surmise","to":"watson","time":{"at":"t.train_beyond_reading"},"para":38,"quote":"Those are the main facts of the case, stripped of all surmise"}
{"id":"f.holmes_will_recap","of":"holmes","attr":"intends","value":"to recapitulate what the police have done","time":{"at":"t.train_beyond_reading"},"para":38,"quote":"I shall now recapitulate what the police have done in the matter."}
{"id":"f.holmes_gregory_competent","of":"holmes","attr":"says","value":"Gregory is an extremely competent officer","to":"watson","time":{"at":"t.train_beyond_reading"},"para":39,"quote":"is an extremely competent officer"}
{"id":"f.holmes_gregory_imagination","of":"holmes","attr":"says","value":"Gregory lacks imagination, without which he cannot rise to great heights","to":"watson","time":{"at":"t.train_beyond_reading"},"para":39,"quote":"Were he but gifted with imagination he might rise to great heights in his profession."}
{"id":"f.gregory_member","of":"gregory","attr":"member_of","value":"police","basis":"implied","time":{"from":"t.before"},"para":39,"quote":"Inspector Gregory, to whom the case has been committed"}
{"id":"f.gregory_arrives","of":"gregory","attr":"action","value":"arrives at King's Pyland","time":{"at":"t.gregory_arrives"},"para":39,"quote":"On his arrival"}
{"id":"f.gregory_arrests","of":"gregory","attr":"action","value":"finds and arrests Fitzroy Simpson","time":{"at":"t.simpson_arrest"},"para":39,"quote":"he promptly found and arrested the man upon whom suspicion naturally rested"}
{"id":"f.suspicion_simpson","of":"simpson","attr":"condition","value":"the man upon whom suspicion naturally rested","time":{"at":"t.simpson_arrest"},"para":39,"quote":"the man upon whom suspicion naturally rested"}
{"id":"f.simpson_lives","of":"simpson","attr":"lives_at","value":"simpson_villa","time":{"from":"t.simpson_comes_down"},"para":39,"quote":"he inhabited one of those villas which I have mentioned"}
{"id":"f.simpson_name","of":"simpson","attr":"name","value":"Fitzroy Simpson","time":{"at":"t.simpson_arrest"},"para":39,"quote":"His name, it appears, was Fitzroy Simpson."}
{"id":"f.simpson_birth","of":"simpson","attr":"condition","value":"of excellent birth and education","time":{"from":"t.before"},"para":39,"quote":"He was a man of excellent birth and education"}
{"id":"f.simpson_squandered","of":"simpson","attr":"action","value":"squanders a fortune upon the turf","time":{"after":"t.before","before":"t.crime"},"para":39,"quote":"who had squandered a fortune upon the turf"}
{"id":"f.simpson_bookmaker","of":"simpson","attr":"role","value":"a quiet and genteel bookmaker in the sporting clubs of London","time":{"at":"t.crime"},"para":39,"quote":"lived now by doing a little quiet and genteel book-making in the sporting clubs of London"}
{"id":"f.betting_book_owner","of":"betting_book","attr":"owner","value":"simpson","basis":"implied","time":{"at":"t.simpson_arrest"},"para":39,"quote":"his betting-book"}
{"id":"f.betting_examined","of":"police","attr":"action","value":"examines Simpson's betting-book","time":{"after":"t.simpson_arrest","before":"t.wed"},"para":39,"quote":"An examination of his betting-book"}
{"id":"f.book_contents","of":"betting_book","attr":"contents","value":"bets of five thousand pounds against the favourite","time":{"at":"t.simpson_arrest"},"para":39,"quote":"bets to the amount of five thousand pounds had been registered by him against the favourite"}
{"id":"f.simpson_bets","of":"simpson","attr":"action","value":"registers bets of five thousand pounds against the favourite","time":{"at":"t.simpson_bets"},"para":39,"quote":"bets to the amount of five thousand pounds had been registered by him against the favourite"}
{"id":"f.simpson_statement","of":"simpson","attr":"tells","value":"acct.simpson","to":"gregory","how":"statement","time":{"at":"t.simpson_arrest"},"para":40,"quote":"On being arrested he volunteered the statement"}
{"id":"f.simpson_came_info","of":"simpson","attr":"says","value":"he came down to Dartmoor hoping to get information about the King's Pyland horses and about Desborough","to":"gregory","time":{"at":"t.simpson_arrest"},"para":40,"quote":"he had come down to Dartmoor in the hope of getting some information about the King's Pyland horses","asserts":[{"of":"simpson","attr":"intends","value":"to get information about the King's Pyland horses and Desborough","time":{"at":"t.simpson_comes_down"}}]}
{"id":"f.simpson_came","of":"simpson","attr":"location","value":"dartmoor","time":{"from":"t.simpson_comes_down"},"para":40,"quote":"he had come down to Dartmoor"}
{"id":"f.desborough_second","of":"desborough","attr":"role","value":"second favourite for the Wessex Cup","time":{"at":"t.crime"},"para":40,"quote":"Desborough, the second favourite"}
{"id":"f.desborough_brown","of":"desborough","attr":"lives_at","value":"mapleton","time":{"at":"t.crime"},"para":40,"quote":"which was in charge of Silas Brown at the Mapleton stables"}
{"id":"f.brown_charge","of":"silas_brown","attr":"role","value":"in charge of Desborough","time":{"at":"t.crime"},"para":40,"quote":"which was in charge of Silas Brown"}
{"id":"f.simpson_admits","of":"simpson","attr":"says","value":"he does not deny that he acted as described the evening before","to":"gregory","time":{"at":"t.simpson_arrest"},"para":40,"quote":"He did not attempt to deny that he had acted as described upon the evening before","asserts":[{"of":"the_stranger","attr":"identity","value":"simpson"},{"q":"q.stranger_who","pick":"simpson"}]}
{"id":"f.stranger_is_simpson","of":"the_stranger","attr":"identity","value":"simpson","time":{"from":"t.before"},"para":40,"quote":"He did not attempt to deny that he had acted as described upon the evening before","q":"q.stranger_who","pick":"simpson"}
{"id":"f.simpson_no_designs","of":"simpson","attr":"says","value":"he had no sinister designs and simply wished to obtain first-hand information","to":"gregory","time":{"at":"t.simpson_arrest"},"para":40,"quote":"declared that he had no sinister designs, and had simply wished to obtain first-hand information","asserts":[{"of":"simpson","attr":"intends","value":"simply to obtain first-hand information","time":{"at":"t.mon_window"}},{"q":"q.simpson_intent","pick":"only to get first-hand information"}]}
{"id":"f.cravat_confronted","of":"police","attr":"action","value":"confront Simpson with his cravat","to":"simpson","time":{"at":"t.simpson_arrest"},"para":40,"quote":"When confronted with his cravat"}
{"id":"f.cravat_owner","of":"cravat","attr":"owner","value":"simpson","time":{"at":"t.simpson_arrest"},"para":40,"quote":"When confronted with his cravat"}
{"id":"f.simpson_pale","of":"simpson","attr":"condition","value":"turns very pale","time":{"at":"t.simpson_arrest"},"para":40,"quote":"he turned very pale"}
{"id":"f.simpson_cannot_account","of":"simpson","attr":"says","value":"he cannot account for the cravat's presence in the murdered man's hand","to":"gregory","time":{"at":"t.simpson_arrest"},"para":40,"quote":"was utterly unable to account for its presence in the hand of the murdered man"}
{"id":"f.simpson_wet","of":"simpson","attr":"condition","value":"his clothing wet","time":{"at":"t.simpson_arrest"},"para":40,"quote":"His wet clothing"}
{"id":"f.simpson_out_storm","of":"simpson","attr":"location","value":"dartmoor","detail":"out in the storm","time":{"after":"t.mon_hunter_out","before":"t.morning_seven"},"para":40,"quote":"showed that he had been out in the storm of the night before"}
{"id":"f.storm","of":"weather","attr":"condition","value":"a storm","time":{"at":"t.crime"},"para":40,"quote":"the storm of the night before"}
{"id":"f.stick_owner","of":"simpson_stick","attr":"owner","value":"simpson","time":{"at":"t.simpson_arrest"},"para":40,"quote":"his stick"}
{"id":"f.stick_kind","of":"simpson_stick","attr":"condition","value":"a Penang-lawyer weighted with lead","time":{"at":"t.simpson_arrest"},"para":40,"quote":"which was a Penang-lawyer weighted with lead"}
{"id":"f.stick_could","of":"simpson_stick","attr":"condition","value":"just such a weapon as might, by repeated blows, have inflicted the trainer's injuries","time":{"at":"t.simpson_arrest"},"para":40,"quote":"was just such a weapon as might, by repeated blows, have inflicted the terrible injuries"}
{"id":"f.straker_succumbed","of":"straker","attr":"condition","value":"died of terrible injuries","time":{"at":"t.crime"},"para":40,"quote":"the terrible injuries to which the trainer had succumbed"}
{"id":"f.simpson_no_wound","of":"simpson","attr":"condition","value":"wounded","neg":true,"time":{"at":"t.simpson_arrest"},"para":41,"quote":"there was no wound upon his person"}
{"id":"f.knife_owner","of":"straker_knife","attr":"owner","value":"straker","basis":"implied","time":{"at":"t.crime"},"para":41,"quote":"the state of Straker's knife"}
{"id":"f.holmes_mark","of":"holmes","attr":"says","value":"the state of Straker's knife shows one at least of his assailants must bear his mark","to":"watson","time":{"at":"t.train_beyond_reading"},"para":41,"quote":"the state of Straker's knife would show that one at least of his assailants must bear his mark upon him","asserts":[{"of":"?","attr":"condition","value":"an assailant of Straker wounded by his knife","time":{"from":"t.crime"}},{"q":"q.knife_blood","pick":"an assailant's"}]}
{"id":"f.holmes_asks_light","of":"holmes","attr":"action","act":"ask","value":"asks Watson for any light he can give","to":"watson","time":{"at":"t.train_beyond_reading"},"para":41,"quote":"if you can give me any light I shall be infinitely obliged to you"}
{"id":"f.watson_listened","of":"watson","attr":"action","value":"listens with the greatest interest to Holmes's statement","time":{"at":"t.train_beyond_reading"},"para":42,"quote":"I had listened with the greatest interest"}
{"id":"f.watson_familiar","of":"watson","attr":"knows","value":"most of the facts Holmes laid out","time":{"at":"t.train_beyond_reading"},"para":42,"quote":"most of the facts were familiar to me"}
{"id":"f.watson_not_appreciated","of":"watson","attr":"knows","value":"the relative importance of the facts and their connection to each other","neg":true,"time":{"at":"t.watson_reads_papers"},"para":42,"quote":"I had not sufficiently appreciated their relative importance, nor their connection to each other"}
{"id":"f.watson_self_wound","of":"watson","attr":"says","value":"the cut on Straker may have been made by his own knife in the convulsions that follow a brain injury","to":"holmes","modal":"possible","time":{"at":"t.train_beyond_reading"},"para":43,"quote":"the incised wound upon Straker may have been caused by his own knife in the convulsive struggles which follow any brain injury","asserts":[{"of":"straker","attr":"action","value":"cuts his own thigh with his knife in convulsions after the blow","time":{"at":"t.crime"}},{"q":"q.thigh_cut","pick":"his own knife, in convulsions after the blow"},{"q":"q.knife_blood","pick":"Straker's own"}]}
{"id":"f.holmes_probable","of":"holmes","attr":"says","value":"Watson's suggestion is more than possible; it is probable","to":"watson","time":{"at":"t.train_beyond_reading"},"para":44,"quote":"It is more than possible; it is probable","asserts":[{"of":"straker","attr":"action","value":"cuts his own thigh with his knife in convulsions after the blow","time":{"at":"t.crime"}},{"q":"q.thigh_cut","pick":"his own knife, in convulsions after the blow"},{"q":"q.knife_blood","pick":"Straker's own"}]}
{"id":"f.holmes_point_gone","of":"holmes","attr":"says","value":"in that case one of the main points in favour of the accused disappears","to":"watson","time":{"at":"t.train_beyond_reading"},"para":44,"quote":"In that case one of the main points in favour of the accused disappears."}
{"id":"f.watson_fails","of":"watson","attr":"says","value":"he still fails to understand what the theory of the police can be","to":"holmes","time":{"at":"t.train_beyond_reading"},"para":45,"quote":"even now I fail to understand what the theory of the police can be"}
{"id":"f.holmes_objections","of":"holmes","attr":"says","value":"whatever theory is stated has very grave objections","to":"watson","time":{"at":"t.train_beyond_reading"},"para":46,"quote":"I am afraid that whatever theory we state has very grave objections to it"}
{"id":"f.holmes_police_theory","of":"holmes","attr":"says","value":"the police imagine that Simpson drugged the lad, opened the stable door with a duplicate key, bridled and led out the horse, killed the trainer who met him on the moor, and hid the horse or lost it","to":"watson","modal":"possible","time":{"at":"t.train_beyond_reading"},"para":46,"quote":"The police imagine, I take it, that this Fitzroy Simpson, having drugged the lad","asserts":[{"of":"simpson","attr":"action","value":"drugs the stable-lad","time":{"at":"t.mon_window"}},{"of":"simpson","attr":"carrying","value":"duplicate_key","time":{"at":"t.horse_taken"}},{"of":"simpson","attr":"action","value":"opens the stable door and takes out the horse, meaning to kidnap him","time":{"at":"t.horse_taken"}},{"of":"simpson","attr":"action","value":"puts the bridle on the horse","time":{"at":"t.horse_taken"}},{"of":"stable_door","attr":"door","value":"open","time":{"from":"t.horse_taken"}},{"of":"simpson","attr":"action","value":"leads the horse away over the moor and is met or overtaken by the trainer","time":{"at":"t.crime"}},{"of":"simpson","attr":"action","value":"beats out the trainer's brains with his heavy stick, unhurt by the knife","time":{"at":"t.crime"}},{"of":"simpson","attr":"action","value":"leads the horse to a secret hiding-place, or the horse bolts and wanders on the moor","time":{"after":"t.crime"}},{"q":"q.who_took","pick":"simpson"},{"q":"q.who_killed","pick":"simpson"},{"q":"q.who_opened","pick":"simpson"},{"q":"q.who_drugged","pick":"the_stranger"},{"q":"q.connection","pick":"one person took the horse and killed the trainer who got in the way"},{"q":"q.simpson_intent","pick":"to drug the lad and take the horse"}]}
{"id":"f.police_theory","of":"police","attr":"believes","value":"Simpson drugged the lad, opened the door with a duplicate key, led out the bridled horse, killed the trainer and hid or lost the horse","claim":"f.holmes_police_theory","time":{"at":"t.train_beyond_reading"},"para":46,"quote":"That is the case as it appears to the police"}
{"id":"f.bridle_missing","of":"bridle","attr":"location","value":null,"detail":"missing","time":{"from":"t.morning_seven"},"para":46,"quote":"His bridle is missing"}
{"id":"f.holmes_improbable","of":"holmes","attr":"believes","value":"the police case is improbable, but all other explanations are more improbable still","time":{"at":"t.train_beyond_reading"},"para":46,"quote":"improbable as it is, all other explanations are more improbable still"}
{"id":"f.holmes_test","of":"holmes","attr":"intends","value":"to test the matter quickly once on the spot","time":{"at":"t.train_beyond_reading"},"para":46,"quote":"I shall very quickly test the matter when I am once upon the spot"}
{"id":"f.holmes_stuck","of":"holmes","attr":"believes","value":"they cannot get much further until he is on the spot","time":{"at":"t.train_beyond_reading"},"para":46,"quote":"I cannot really see how we can get much further than our present position"}
{"id":"f.mrs_tells_police","of":"mrs_straker","attr":"tells","value":"acct.mrs_straker","to":"police","how":"statement","basis":"implied","time":{"at":"t.statements"},"para":32,"quote":"Mrs. Straker, waking at one in the morning"}
{"id":"f.lads_tell_police","of":"two_lads","attr":"tells","value":"acct.lads","to":"police","how":"statement","basis":"implied","time":{"at":"t.statements"},"para":34,"quote":"They had heard nothing during the night"}
{"id":"f.searchers_tell_police","of":"two_women","attr":"tells","value":"acct.searchers","to":"police","how":"statement","basis":"implied","time":{"at":"t.statements"},"para":35,"quote":"at the bottom of this was found the dead body of the unfortunate trainer"}
{"id":"f.police_tells_press","of":"police","attr":"tells","value":"acct.police","to":"the_press","how":"report","basis":"implied","time":{"after":"t.statements","before":"t.wed"},"para":38,"quote":"what the police have done in the matter"}
{"id":"f.press_to_editions","of":"the_press","attr":"tells","value":"acct.press","to":"fresh_editions","how":"newspaper","basis":"implied","time":{"after":"t.statements","before":"t.wed"},"para":4,"quote":"Fresh editions of every paper had been sent up by our news agent"}
{"id":"f.press_to_telegraph","of":"the_press","attr":"tells","value":"acct.press","to":"the_telegraph","how":"newspaper","basis":"implied","time":{"after":"t.crime","before":"t.watson_reads_papers"},"para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say"}
{"id":"f.press_to_chronicle","of":"the_press","attr":"tells","value":"acct.press","to":"the_chronicle","how":"newspaper","basis":"implied","time":{"after":"t.crime","before":"t.watson_reads_papers"},"para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say"}
{"id":"f.police_to_holmes","of":"police","attr":"tells","value":"acct.police","to":"holmes","how":"telegram","basis":"implied","time":{"after":"t.statements","before":"t.thu_breakfast"},"para":31,"quote":"I sent a special wire to Dartmoor yesterday to clear the matter up"}
{"id":"f.gregory_reports_simpson","of":"gregory","attr":"tells","value":"acct.simpson","to":"police","how":"report","basis":"implied","time":{"after":"t.simpson_arrest","before":"t.thu_breakfast"},"para":40,"quote":"On being arrested he volunteered the statement"}
{"id":"f.clock_evening_tav","of":"clock","attr":"hour","value":"evening","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"It was evening before we reached the little town of Tavistock"}
{"id":"f.watson_tav_station","of":"watson","attr":"location","value":"tavistock_station","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"Two gentlemen were awaiting us in the station"}
{"id":"f.holmes_tav_station","of":"holmes","attr":"location","value":"tavistock_station","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"Two gentlemen were awaiting us in the station"}
{"id":"f.tavistock_small","of":"tavistock","attr":"condition","value":"a little town","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"the little town of Tavistock"}
{"id":"f.tavistock_middle","of":"tavistock","attr":"position","value":"like the boss of a shield, in the middle of the huge circle of Dartmoor","time":{"from":"t.before"},"para":47,"quote":"which lies, like the boss of a shield, in the middle of the huge circle of Dartmoor"}
{"id":"f.ross_tav_station","of":"ross","attr":"location","value":"tavistock_station","detail":"awaiting them","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"Two gentlemen were awaiting us in the station"}
{"id":"f.gregory_tav_station","of":"gregory","attr":"location","value":"tavistock_station","detail":"awaiting them","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"Two gentlemen were awaiting us in the station"}
{"id":"f.gregory_looks","of":"gregory","attr":"condition","value":"a tall, fair man with lion-like hair and beard and curiously penetrating light blue eyes","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"a tall, fair man with lion-like hair and beard and curiously penetrating light blue eyes"}
{"id":"f.ross_looks","of":"ross","attr":"condition","value":"a small, alert person, very neat and dapper, with trim little side-whiskers","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"a small, alert person, very neat and dapper"}
{"id":"f.ross_frock","of":"ross","attr":"wearing","value":"ross_frock_coat","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"in a frock-coat and gaiters"}
{"id":"f.ross_gaiters_w","of":"ross","attr":"wearing","value":"ross_gaiters","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"in a frock-coat and gaiters"}
{"id":"f.ross_glass_w","of":"ross","attr":"wearing","value":"ross_eye_glass","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"with trim little side-whiskers and an eye-glass"}
{"id":"f.ross_sportsman","of":"ross","attr":"reputed","value":"the well-known sportsman","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"The latter was Colonel Ross, the well-known sportsman"}
{"id":"f.gregory_rising","of":"gregory","attr":"reputed","value":"rapidly making his name in the English detective service","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"a man who was rapidly making his name in the English detective service"}
{"id":"f.gregory_detective_member","of":"gregory","attr":"member_of","value":"detective_service","time":{"from":"t.before"},"para":47,"quote":"rapidly making his name in the English detective service"}
{"id":"f.watson_sees_pair","of":"watson","attr":"observes","value":["f.gregory_looks","f.ross_looks","f.ross_frock","f.ross_gaiters_w","f.ross_glass_w"],"time":{"at":"t.tavistock_arrival"},"para":47,"quote":"Two gentlemen were awaiting us in the station"}
{"id":"f.ross_delighted","of":"ross","attr":"says","value":"he is delighted Holmes has come down","to":"holmes","time":{"at":"t.tavistock_arrival"},"para":48,"quote":"I am delighted that you have come down, Mr. Holmes"}
{"id":"f.ross_inspector_done_all","of":"ross","attr":"says","value":"the Inspector has done all that could possibly be suggested","to":"holmes","time":{"at":"t.tavistock_arrival"},"para":48,"quote":"The Inspector here has done all that could possibly be suggested","asserts":[{"of":"gregory","attr":"action","value":"has done all that could possibly be suggested","time":{"before":"t.tavistock_arrival"}}]}
{"id":"f.ross_intends_avenge","of":"ross","attr":"intends","value":"to leave no stone unturned to avenge Straker and recover his horse","time":{"at":"t.tavistock_arrival"},"para":48,"quote":"I wish to leave no stone unturned in trying to avenge poor Straker and in recovering my horse"}
{"id":"f.holmes_asks_developments","of":"holmes","attr":"action","act":"ask","value":"asks whether there have been any fresh developments","to":"gregory","time":{"at":"t.tavistock_arrival"},"para":49,"quote":"Have there been any fresh developments?"}
{"id":"f.gregory_little_progress","of":"gregory","attr":"says","value":"the police have made very little progress","to":"holmes","time":{"at":"t.tavistock_arrival"},"para":50,"quote":"I am sorry to say that we have made very little progress"}
{"id":"f.landau_outside","of":"landau","attr":"location","value":"tavistock_station","detail":"outside","time":{"at":"t.tavistock_arrival"},"para":50,"quote":"We have an open carriage outside"}
{"id":"f.gregory_intends_drive","of":"gregory","attr":"intends","value":"to see the place before the light fails and talk the case over on the drive","time":{"at":"t.tavistock_arrival"},"para":50,"quote":"we might talk it over as we drive"}
{"id":"f.watson_landau","of":"watson","attr":"location","value":"landau","time":{"from":"t.landau_drive"},"para":51,"quote":"A minute later we were all seated in a comfortable landau"}
{"id":"f.holmes_landau","of":"holmes","attr":"location","value":"landau","time":{"from":"t.landau_drive"},"para":51,"quote":"A minute later we were all seated in a comfortable landau"}
{"id":"f.ross_landau","of":"ross","attr":"location","value":"landau","time":{"from":"t.landau_drive"},"para":51,"quote":"A minute later we were all seated in a comfortable landau"}
{"id":"f.gregory_landau","of":"gregory","attr":"location","value":"landau","time":{"from":"t.landau_drive"},"para":51,"quote":"A minute later we were all seated in a comfortable landau"}
{"id":"f.landau_through_town","of":"landau","attr":"location","value":"tavistock","detail":"rattling through the town","time":{"at":"t.landau_drive"},"para":51,"quote":"were rattling through the quaint old Devonshire city"}
{"id":"f.gregory_pours_out","of":"gregory","attr":"action","value":"is full of his case and pours out a stream of remarks","time":{"at":"t.landau_drive"},"para":51,"quote":"Inspector Gregory was full of his case, and poured out a stream of remarks"}
{"id":"f.holmes_interjects","of":"holmes","attr":"action","value":"throws in an occasional question or interjection","time":{"at":"t.landau_drive"},"para":51,"quote":"while Holmes threw in an occasional question or interjection"}
{"id":"f.ross_leans_back","of":"ross","attr":"position","value":"leaning back with his arms folded and his hat tilted over his eyes","time":{"at":"t.landau_drive"},"para":51,"quote":"Colonel Ross leaned back with his arms folded and his hat tilted over his eyes"}
{"id":"f.ross_hat_w","of":"ross","attr":"wearing","value":"ross_hat","time":{"at":"t.landau_drive"},"para":51,"quote":"his hat tilted over his eyes"}
{"id":"f.watson_listens_drive","of":"watson","attr":"action","value":"listens with interest to the dialogue of the two detectives","time":{"at":"t.landau_drive"},"para":51,"quote":"I listened with interest to the dialogue of the two detectives"}
{"id":"f.gregory_theory","of":"gregory","attr":"believes","value":"a theory of the case almost exactly what Holmes foretold in the train","time":{"at":"t.landau_drive"},"para":51,"quote":"Gregory was formulating his theory, which was almost exactly what Holmes had foretold in the train"}
{"id":"f.gregory_net","of":"gregory","attr":"says","value":"the net is drawn pretty close round Fitzroy Simpson","to":"holmes","time":{"at":"t.landau_drive"},"para":52,"quote":"The net is drawn pretty close round Fitzroy Simpson"}
{"id":"f.gregory_believes_simpson","of":"gregory","attr":"believes","value":"Simpson is the man","time":{"at":"t.landau_drive"},"para":52,"quote":"I believe myself that he is our man","asserts":[{"of":"simpson","attr":"action","value":"kills Straker and takes the horse","time":{"at":"t.crime"}}]}
{"id":"f.gregory_circumstantial","of":"gregory","attr":"says","value":"the evidence is purely circumstantial and some new development may upset it","to":"holmes","time":{"at":"t.landau_drive"},"para":52,"quote":"I recognise that the evidence is purely circumstantial, and that some new development may upset it"}
{"id":"f.holmes_asks_knife","of":"holmes","attr":"action","act":"ask","value":"asks about Straker's knife","to":"gregory","time":{"at":"t.landau_drive"},"para":53,"quote":"How about Straker’s knife?"}
{"id":"f.gregory_self_wound","of":"gregory","attr":"says","value":"the police have concluded that Straker wounded himself in his fall","to":"holmes","time":{"at":"t.landau_drive"},"para":54,"quote":"We have quite come to the conclusion that he wounded himself in his fall.","asserts":[{"of":"straker","attr":"action","value":"wounds himself with his own knife in his fall","time":{"at":"t.crime"}}]}
{"id":"f.police_self_wound","of":"police","attr":"believes","value":"Straker wounded himself in his fall","claim":"f.gregory_self_wound","time":{"at":"t.landau_drive"},"para":54,"quote":"We have quite come to the conclusion that he wounded himself in his fall."}
{"id":"f.holmes_watson_suggested","of":"holmes","attr":"says","value":"Watson made that suggestion to him on the way down","to":"gregory","time":{"at":"t.landau_drive"},"para":55,"quote":"My friend Dr. Watson made that suggestion to me as we came down."}
{"id":"f.holmes_tells_against","of":"holmes","attr":"says","value":"if so, it would tell against Simpson","to":"gregory","time":{"at":"t.landau_drive"},"para":55,"quote":"If so, it would tell against this man Simpson."}
{"id":"f.gregory_no_knife","of":"gregory","attr":"says","value":"Simpson has neither a knife nor any sign of a wound","to":"holmes","time":{"at":"t.landau_drive"},"para":56,"quote":"He has neither a knife nor any sign of a wound.","asserts":[{"of":"simpson","attr":"carrying","value":"a knife","neg":true,"time":{"at":"t.simpson_arrest"}},{"of":"simpson","attr":"condition","value":"wounded","neg":true,"time":{"at":"t.simpson_arrest"}}]}
{"id":"f.gregory_case_strong","of":"gregory","attr":"says","value":"the evidence is very strong: Simpson had a great interest in the favourite's disappearance, lies under suspicion of poisoning the stable-boy, was out in the storm, was armed with a heavy stick, and his cravat was in the dead man's hand","to":"holmes","time":{"at":"t.landau_drive"},"para":56,"quote":"He had a great interest in the disappearance of the favourite.","asserts":[{"of":"simpson","attr":"condition","value":"has a great interest in the favourite's disappearance","time":{"at":"t.crime"}},{"of":"simpson","attr":"action","value":"poisons the stable-boy","time":{"at":"t.mon_window"}},{"of":"simpson","attr":"carrying","value":"simpson_stick","time":{"at":"t.crime"}},{"of":"cravat","attr":"location","value":"hollow","detail":"in the dead man's hand","time":{"at":"t.morning_search"}}]}
{"id":"f.simpson_suspected_poison","of":"simpson","attr":"condition","value":"under suspicion of having poisoned the stable-boy","word":"gregory","time":{"at":"t.landau_drive"},"para":56,"quote":"He lies under suspicion of having poisoned the stable-boy"}
{"id":"f.gregory_jury","of":"gregory","attr":"believes","value":"there is enough to go before a jury","time":{"at":"t.landau_drive"},"para":56,"quote":"I really think we have enough to go before a jury."}
{"id":"f.holmes_shakes_head","of":"holmes","attr":"action","value":"shakes his head","time":{"at":"t.landau_drive"},"para":57,"quote":"Holmes shook his head."}
{"id":"f.holmes_counsel","of":"holmes","attr":"says","value":"a clever counsel would tear the case all to rags","to":"gregory","time":{"at":"t.landau_drive"},"para":57,"quote":"A clever counsel would tear it all to rags"}
{"id":"f.holmes_why_out","of":"holmes","attr":"action","act":"ask","value":"asks why Simpson should take the horse out of the stable, when he could injure it there","to":"gregory","time":{"at":"t.landau_drive"},"para":57,"quote":"Why should he take the horse out of the stable? If he wished to injure it why could he not do it there?"}
{"id":"f.holmes_asks_key","of":"holmes","attr":"action","act":"ask","value":"asks whether a duplicate key has been found in Simpson's possession","to":"gregory","time":{"at":"t.landau_drive"},"para":57,"quote":"Has a duplicate key been found in his possession?"}
{"id":"f.holmes_asks_chemist","of":"holmes","attr":"action","act":"ask","value":"asks what chemist sold Simpson the powdered opium","to":"gregory","time":{"at":"t.landau_drive"},"para":57,"quote":"What chemist sold him the powdered opium?"}
{"id":"f.holmes_asks_hide","of":"holmes","attr":"action","act":"ask","value":"asks where Simpson, a stranger to the district, could hide such a horse","to":"gregory","time":{"at":"t.landau_drive"},"para":57,"quote":"where could he, a stranger to the district, hide a horse, and such a horse as this?"}
{"id":"f.holmes_asks_paper","of":"holmes","attr":"action","act":"ask","value":"asks Simpson's own explanation of the paper he wished the maid to give the stable-boy","to":"gregory","time":{"at":"t.landau_drive"},"para":57,"quote":"What is his own explanation as to the paper which he wished the maid to give to the stable-boy?"}
{"id":"f.simpson_says_note","of":"simpson","attr":"says","value":"the paper was a ten-pound note","to":"gregory","time":{"after":"t.simpson_arrest","before":"t.landau_drive"},"para":58,"quote":"He says that it was a ten-pound note.","asserts":[{"of":"paper_packet","attr":"identity","value":"ten_pound_note"}]}
{"id":"f.note_in_purse","of":"ten_pound_note","attr":"location","value":"simpson_purse","time":{"at":"t.simpson_arrest"},"para":58,"quote":"One was found in his purse."}
{"id":"f.purse_owner","of":"simpson_purse","attr":"owner","value":"simpson","basis":"implied","time":{"at":"t.simpson_arrest"},"para":58,"quote":"One was found in his purse."}
{"id":"f.gregory_not_formidable","of":"gregory","attr":"says","value":"Holmes's other difficulties are not so formidable as they seem","to":"holmes","time":{"at":"t.landau_drive"},"para":58,"quote":"your other difficulties are not so formidable as they seem"}
{"id":"f.gregory_not_stranger","of":"gregory","attr":"says","value":"Simpson is not a stranger to the district","to":"holmes","time":{"at":"t.landau_drive"},"para":58,"quote":"He is not a stranger to the district.","asserts":[{"of":"simpson","attr":"knows","value":"the district","time":{"at":"t.crime"}}]}
{"id":"f.simpson_lodged","of":"simpson","attr":"location","value":"tavistock","detail":"lodging, twice, in the summer","time":{"at":"t.simpson_summers"},"para":58,"quote":"He has twice lodged at Tavistock in the summer."}
{"id":"f.gregory_opium_london","of":"gregory","attr":"says","value":"the opium was probably brought from London","to":"holmes","modal":"possible","time":{"at":"t.landau_drive"},"para":58,"quote":"The opium was probably brought from London.","asserts":[{"of":"opium","attr":"location","value":"london","time":{"before":"t.mon_window"}}]}
{"id":"f.gregory_key_hurled","of":"gregory","attr":"says","value":"the key, having served its purpose, would be hurled away","to":"holmes","modal":"possible","time":{"at":"t.landau_drive"},"para":58,"quote":"The key, having served its purpose, would be hurled away.","asserts":[{"of":"simpson","attr":"action","value":"throws away the duplicate key","time":{"after":"t.horse_taken"}}]}
{"id":"f.gregory_pits","of":"gregory","attr":"says","value":"the horse may be at the bottom of one of the pits or old mines upon the moor","to":"holmes","modal":"possible","time":{"at":"t.landau_drive"},"para":58,"quote":"The horse may be at the bottom of one of the pits or old mines upon the moor.","asserts":[{"of":"silver_blaze","attr":"location","value":"pits_mines","detail":"at the bottom","time":{"at":"t.landau_drive"}}]}
{"id":"f.holmes_asks_cravat","of":"holmes","attr":"action","act":"ask","value":"asks what Simpson says about the cravat","to":"gregory","time":{"at":"t.landau_drive"},"para":59,"quote":"What does he say about the cravat?"}
{"id":"f.simpson_cravat_his","of":"simpson","attr":"says","value":"the cravat is his","to":"gregory","time":{"at":"t.simpson_arrest"},"para":60,"quote":"He acknowledges that it is his","asserts":[{"of":"cravat","attr":"owner","value":"simpson"}]}
{"id":"f.simpson_says_lost","of":"simpson","attr":"says","value":"he had lost the cravat","to":"gregory","time":{"at":"t.simpson_arrest"},"para":60,"quote":"declares that he had lost it","asserts":[{"of":"cravat","attr":"location","value":null,"detail":"lost by Simpson","time":{"from":"t.simpson_lost_cravat"}}]}
{"id":"f.gregory_new_element","of":"gregory","attr":"says","value":"a new element has been introduced which may account for Simpson leading the horse from the stable","to":"holmes","time":{"at":"t.landau_drive"},"para":60,"quote":"a new element has been introduced into the case which may account for his leading the horse from the stable"}
{"id":"f.holmes_pricks_ears","of":"holmes","attr":"action","value":"pricks up his ears","time":{"at":"t.landau_drive"},"para":61,"quote":"Holmes pricked up his ears."}
{"id":"f.traces_found","of":"police","attr":"action","value":"find traces of a gypsy encampment","time":{"at":"t.gypsy_traces_found"},"para":62,"quote":"We have found traces which show that a party of gypsies encamped on Monday night"}
{"id":"f.gypsies_encamped","of":"gypsy_party","attr":"location","value":"gypsy_camp","detail":"encamped","time":{"at":"t.crime"},"para":62,"quote":"a party of gypsies encamped on Monday night within a mile of the spot where the murder took place"}
{"id":"f.camp_position","of":"gypsy_camp","attr":"position","value":"within a mile of the spot where the murder took place","time":{"at":"t.crime"},"para":62,"quote":"within a mile of the spot where the murder took place"}
{"id":"f.gypsy_party_member","of":"gypsy_party","attr":"member_of","value":"gypsies","basis":"implied","time":{"at":"t.crime"},"para":62,"quote":"a party of gypsies"}
{"id":"f.gypsies_left","of":"gypsy_party","attr":"location","value":"gypsy_camp","neg":true,"detail":"gone","time":{"at":"t.gypsies_gone"},"para":62,"quote":"On Tuesday they were gone."}
{"id":"f.cal_tue_gypsies","of":"calendar","attr":"weekday","value":"Tuesday","time":{"at":"t.gypsies_gone"},"para":62,"quote":"On Tuesday they were gone."}
{"id":"f.gregory_gypsy_theory","of":"gregory","attr":"says","value":"if Simpson had an understanding with the gypsies, he may have been leading the horse to them when overtaken, and they may have him now","to":"holmes","modal":"possible","time":{"at":"t.landau_drive"},"para":62,"quote":"presuming that there was some understanding between Simpson and these gypsies, might he not have been leading the horse to them when he was overtaken, and may they not have him now?","asserts":[{"of":"simpson","attr":"action","value":"leads the horse to the gypsies by arrangement with them","time":{"at":"t.crime"}},{"of":"gypsy_party","attr":"carrying","value":"silver_blaze","time":{"at":"t.landau_drive"}}]}
{"id":"f.holmes_possible","of":"holmes","attr":"says","value":"it is certainly possible","to":"gregory","modal":"possible","time":{"at":"t.landau_drive"},"para":63,"quote":"It is certainly possible."}
{"id":"f.moor_scoured","of":"police","attr":"action","value":"scour the moor for the gypsies","time":{"at":"t.landau_drive"},"para":64,"quote":"The moor is being scoured for these gypsies."}
{"id":"f.gregory_searched_stables","of":"gregory","attr":"action","value":"examines every stable and out-house in Tavistock and for ten miles round","time":{"at":"t.gregory_stables"},"para":64,"quote":"I have also examined every stable and out-house in Tavistock, and for a radius of ten miles."}
{"id":"f.stables_no_horse","of":"silver_blaze","attr":"location","value":"tavistock_stables","neg":true,"basis":"implied","time":{"at":"t.gregory_stables"},"para":64,"quote":"I have also examined every stable and out-house in Tavistock, and for a radius of ten miles."}
{"id":"f.holmes_asks_mapleton","of":"holmes","attr":"action","act":"ask","value":"asks about the other training-stable close by","to":"gregory","time":{"at":"t.landau_drive"},"para":65,"quote":"There is another training-stable quite close, I understand?"}
{"id":"f.gregory_not_neglect","of":"gregory","attr":"says","value":"Mapleton is a factor that must certainly not be neglected","to":"holmes","time":{"at":"t.landau_drive"},"para":66,"quote":"that is a factor which we must certainly not neglect"}
{"id":"f.desborough_second_betting","of":"desborough","attr":"condition","value":"second in the betting","time":{"at":"t.crime"},"para":66,"quote":"As Desborough, their horse, was second in the betting"}
{"id":"f.gregory_mapleton_interest","of":"gregory","attr":"says","value":"the Mapleton people had an interest in the favourite's disappearance","to":"holmes","time":{"at":"t.landau_drive"},"para":66,"quote":"they had an interest in the disappearance of the favourite","asserts":[{"of":"mapleton","attr":"condition","value":"has an interest in the disappearance of the favourite","time":{"at":"t.crime"}}]}
{"id":"f.brown_large_bets","of":"silas_brown","attr":"action","value":"has large bets upon the Wessex Cup","time":{"at":"t.brown_bets"},"para":66,"quote":"Silas Brown, the trainer, is known to have had large bets upon the event"}
{"id":"f.brown_trainer","of":"silas_brown","attr":"role","value":"trainer at Mapleton","time":{"at":"t.crime"},"para":66,"quote":"Silas Brown, the trainer"}
{"id":"f.brown_no_friend","of":"silas_brown","attr":"condition","value":"no friend to Straker","time":{"before":"t.crime"},"para":66,"quote":"he was no friend to poor Straker"}
{"id":"f.mapleton_examined","of":"police","attr":"action","value":"examine the Mapleton stables","time":{"at":"t.gregory_mapleton"},"para":66,"quote":"We have, however, examined the stables"}
{"id":"f.gregory_nothing_brown","of":"gregory","attr":"says","value":"there is nothing to connect Silas Brown with the affair","to":"holmes","time":{"at":"t.landau_drive"},"para":66,"quote":"there is nothing to connect him with the affair"}
{"id":"f.holmes_asks_link","of":"holmes","attr":"action","act":"ask","value":"asks whether anything connects Simpson with the interests of the Mapleton stables","to":"gregory","time":{"at":"t.landau_drive"},"para":67,"quote":"And nothing to connect this man Simpson with the interests of the Mapleton stables?"}
{"id":"f.gregory_no_link","of":"gregory","attr":"says","value":"nothing at all connects Simpson with the Mapleton stables","to":"holmes","time":{"at":"t.landau_drive"},"para":68,"quote":"Nothing at all.","asserts":[{"of":"simpson","attr":"member_of","value":"mapleton","neg":true}]}
{"id":"f.gregory_tells_drive","of":"gregory","attr":"tells","value":"acct.gregory_drive","to":"watson","how":"told","time":{"at":"t.landau_drive"},"para":51,"quote":"Inspector Gregory was full of his case, and poured out a stream of remarks"}
{"id":"f.gregory_tells_simpson","of":"gregory","attr":"tells","value":"acct.simpson","to":"watson","how":"told","partial":true,"time":{"at":"t.landau_drive"},"para":58,"quote":"He says that it was a ten-pound note."}

## Questions so far

{"id":"q.horse_where","label":"What has become of the favourite?","labels":[{"from":4,"label":"What has become of the favourite?"},{"from":10,"label":"What has become of Silver Blaze?"}],"entry":{"of":"silver_blaze","attr":"location","time":{"from":"t.crime"}},"raised":4,"quote":"the singular disappearance of the favourite for the Wessex Cup","possibilities":[{"value":"something else","available":4,"via":"always"},{"value":"stolen and hidden somewhere","available":4,"via":"indirect","reasoning":{"para":4,"text":"A favourite for a great race that disappears is most likely taken by someone and kept out of sight."}},{"value":"strayed loose on the moor","available":4,"via":"indirect","reasoning":{"para":4,"text":"A horse may simply have got loose and wandered off in whatever happened that night."}},{"value":"dead, the body not yet found","available":4,"via":"indirect","reasoning":{"para":4,"text":"Where the trainer was killed, the horse too may have been killed or maimed and the body not yet found."}},{"value":"taken a long way off","available":14,"via":"indirect","reasoning":{"para":14,"text":"The most remarkable horse in England has not turned up on the thinly settled north of Dartmoor, so it may have been taken far away quickly."}},{"value":"at Mapleton","available":19,"via":"indirect","reasoning":{"para":19,"text":"A larger training stable lies two miles across the moor. A horse could stand there among other horses without being noticed."}},{"value":"with the gypsies","available":19,"via":"indirect","from":"f.gypsies_moor"}],"answer":null}
{"id":"q.who_took","label":"Who took the favourite?","labels":[{"from":4,"label":"Who took the favourite?"},{"from":10,"label":"Who took Silver Blaze?"}],"entry":{"of":"?","attr":"action","time":{"at":"t.crime"}},"raised":4,"quote":"the singular disappearance of the favourite for the Wessex Cup","possibilities":[{"value":"something else","available":4,"via":"always"},{"value":"the murderer of the trainer","available":14,"via":"direct","quote":"his abductor was the murderer of John Straker"},{"value":"simpson","available":14,"via":"indirect","from":"f.simpson_arrested"},{"value":"someone with money riding against the favourite","available":4,"via":"indirect","reasoning":{"para":4,"text":"Whoever stands to lose if the favourite wins the Wessex Cup has a reason to stop it running."}},{"value":"a rival stable","available":4,"via":"indirect","reasoning":{"para":4,"text":"A rival owner would gain if the favourite could not run in the Wessex Cup."}},{"value":"straker","available":34,"via":"direct","quote":"the trainer had for some reason taken out the horse for early exercise"},{"value":"gypsies","available":19,"via":"indirect","reasoning":{"para":19,"text":"The only people on the open moor are a few roaming gypsies."}},{"value":"silas_brown","available":40,"via":"indirect","from":"f.desborough_brown"}],"answer":null}
{"id":"q.who_killed","label":"Who murdered the trainer?","labels":[{"from":4,"label":"Who murdered the trainer?"},{"from":10,"label":"Who murdered John Straker?"}],"entry":{"of":"?","attr":"action","time":{"at":"t.crime"}},"raised":4,"quote":"the tragic murder of its trainer","possibilities":[{"value":"something else","available":4,"via":"always"},{"value":"the one who took the horse","available":14,"via":"direct","quote":"his abductor was the murderer of John Straker"},{"value":"simpson","available":14,"via":"indirect","from":"f.simpson_arrested"},{"value":"someone with a private grudge against the trainer","available":4,"via":"indirect","reasoning":{"para":4,"text":"The murder may have its own motive, a grudge against the trainer himself, apart from the horse."}}],"answer":null}
{"id":"q.connection","label":"How are the trainer's murder and the favourite's disappearance connected?","labels":[{"from":4,"label":"How are the trainer's murder and the favourite's disappearance connected?"},{"from":10,"label":"How are the murder of John Straker and the disappearance of Silver Blaze connected?"}],"entry":{"of":"straker","attr":"action","time":{"at":"t.crime"}},"raised":4,"quote":"the singular disappearance of the favourite for the Wessex Cup, and the tragic murder of its trainer","possibilities":[{"value":"something else","available":4,"via":"always"},{"value":"one person took the horse and killed the trainer who got in the way","available":4,"via":"indirect","reasoning":{"para":4,"text":"The two events come together: a thief after the horse may have killed the trainer who stood in his way."}},{"value":"the two are separate, or linked only by chance","available":4,"via":"indirect","reasoning":{"para":4,"text":"Nothing yet told says the same hand did both."}},{"value":"the trainer was himself mixed up in what happened to the horse","available":4,"via":"indirect","reasoning":{"para":4,"text":"The trainer was the man closest to the horse; he may have had a part in its going."}}],"answer":null}
{"id":"q.why_taken","label":"Why was the favourite made away with?","labels":[{"from":4,"label":"Why was the favourite made away with?"},{"from":10,"label":"Why was Silver Blaze made away with?"}],"entry":{"of":"?","attr":"intends","time":{"at":"t.crime"}},"raised":4,"quote":"the favourite for the Wessex Cup","possibilities":[{"value":"something else","available":4,"via":"always"},{"value":"to stop it running in the Wessex Cup","available":4,"via":"indirect","from":"f.horse_favourite"},{"value":"to sell it or hold it for ransom","available":14,"via":"indirect","from":"f.horse_remarkable"}],"answer":null}
{"id":"q.stranger_who","label":"Who was the stranger at the stable window?","entry":{"of":"the_stranger","attr":"identity","time":{"at":"t.mon_maid_path"}},"raised":21,"quote":"a man appeared out of the darkness and called to her to stop","possibilities":[{"value":"something else","available":21,"via":"always"},{"value":"simpson","available":39,"via":"indirect","reasoning":{"para":39,"text":"The police arrested Fitzroy Simpson as the natural suspect. He is a gentleman bookmaker lodging in the villas half a mile off, and that fits a gentlemanly stranger asking about the horses."}},{"value":"someone sent by a rival stable","available":28,"via":"indirect","reasoning":{"para":28,"text":"He wants the stable's inside knowledge of its two Cup runners, which a rival stable would value."}}],"answer":null}
{"id":"q.stranger_lost","label":"Was the stranger really lost on the moor?","entry":{"of":"the_stranger","attr":"condition","time":{"at":"t.mon_maid_path"}},"raised":24,"quote":"I understand that a stable-boy sleeps there alone every night.","possibilities":[{"value":"something else","available":24,"via":"always"},{"value":"lost on the moor, as he says","available":24,"via":"direct","quote":"What a stroke of luck!"},{"value":"he came to the stables on purpose","available":24,"via":"indirect","from":"f.stranger_knows_routine"}],"answer":null}
{"id":"q.paper_packet","label":"What was in the stranger's folded paper?","entry":{"of":"paper_packet","attr":"contents","time":{"at":"t.mon_maid_path"}},"raised":24,"quote":"He took a piece of white paper folded up out of his waistcoat pocket.","possibilities":[{"value":"something else","available":24,"via":"always"},{"value":"a drug for the boy's supper","available":24,"via":"indirect","reasoning":{"para":24,"text":"He asks the maid to see that the boy has it tonight, while she is carrying the boy's supper."}},{"value":"money for the boy","available":24,"via":"indirect","reasoning":{"para":24,"text":"He is buying favours, and a folded paper could hold banknotes for the lad."}},{"value":"a note for the boy","available":24,"via":"indirect","reasoning":{"para":24,"text":"A folded paper meant for the boy may simply be a message to him."}}],"answer":null}
{"id":"q.who_drugged","label":"Who drugged Ned Hunter?","entry":{"of":"?","attr":"action","time":{"after":"t.mon_nine","before":"t.morning_seven"}},"raised":34,"quote":"Hunter was obviously under the influence of some powerful drug","possibilities":[{"value":"something else","available":34,"via":"always"},{"value":"the_stranger","available":36,"via":"direct","quote":"the same stranger had, while standing at the window, drugged his curried mutton"},{"value":"someone at the trainer's house","available":37,"via":"indirect","reasoning":{"para":37,"text":"The household ate the same dish unharmed, so the opium went into Hunter's portion only, perhaps after it was set apart in the kitchen."}},{"value":"edith_baxter","available":37,"via":"indirect","reasoning":{"para":37,"text":"The maid carried the dish alone across the moor, and only Hunter's portion was drugged."}},{"value":"hunter","available":37,"via":"indirect","reasoning":{"para":37,"text":"Only his own supper held opium. The lad could have dosed himself to have an excuse."}}],"answer":null}
{"id":"q.who_opened","label":"Who opened the stable door in the night?","entry":{"of":"?","attr":"action","time":{"after":"t.mon_hunter_out","before":"t.morning_seven"}},"raised":33,"quote":"The door was open","possibilities":[{"value":"something else","available":33,"via":"always"},{"value":"straker","available":33,"via":"indirect","reasoning":{"para":33,"text":"The door was locked after the stranger left and was open by seven. The trainer would have a key, and he set out for the stables at one."}},{"value":"hunter","available":33,"via":"indirect","reasoning":{"para":33,"text":"The lad was inside with the key, and he may have opened it before the drug took hold."}},{"value":"simpson","available":46,"via":"direct","quote":"having in some way obtained a duplicate key, opened the stable door"}],"answer":null}
{"id":"q.dog_silent","label":"Did the stable dog give the alarm in the night?","entry":{"of":"dog","attr":"action","time":{"after":"t.mon_lads_return","before":"t.morning_seven"}},"raised":34,"quote":"They had heard nothing during the night","possibilities":[{"value":"something else","available":34,"via":"always"},{"value":"the dog made no noise","available":34,"via":"indirect","from":"f.lads_heard_nothing"},{"value":"the dog barked, but the lads slept through it","available":34,"via":"indirect","from":"f.lads_sound_sleepers"},{"value":"the dog had been shut away or silenced","available":34,"via":"indirect","reasoning":{"para":34,"text":"Someone took the horse out past a guard dog. The dog may have been dealt with first, as the watchman was."}}],"answer":null}
{"id":"q.straker_reason","label":"Why did Straker go out to the stables at one in the morning?","entry":{"of":"straker","attr":"intends","time":{"at":"t.straker_leaves"}},"raised":32,"quote":"It left him, however, vaguely uneasy","possibilities":[{"value":"something else","available":32,"via":"always"},{"value":"to see that all was well with the horses","available":32,"via":"direct","quote":"he intended to walk down to the stables to see that all was well"},{"value":"to watch for the stranger's return","available":32,"via":"indirect","reasoning":{"para":32,"text":"He had just heard of the tout at the window. He may have gone out expecting the man to come back."}},{"value":"a purpose of his own that he kept from his wife","available":35,"via":"indirect","reasoning":{"para":35,"text":"He was found a quarter-mile out on the moor with his coat off and a knife in his hand, not at the stables."}}],"answer":null}
{"id":"q.coat_on_bush","label":"How did Straker's overcoat come to be on the furze-bush?","entry":{"of":"straker_coat","attr":"location","time":{"after":"t.straker_leaves","before":"t.morning_search"}},"raised":35,"quote":"John Straker’s overcoat was flapping from a furze-bush","possibilities":[{"value":"something else","available":35,"via":"always"},{"value":"torn off in the struggle","available":35,"via":"indirect","from":"f.straker_defended"},{"value":"he threw it off to fight","available":35,"via":"indirect","from":"f.straker_defended"},{"value":"he took it off for some task","available":35,"via":"indirect","reasoning":{"para":35,"text":"On a night of rain a man keeps his coat on, unless he means to do something it would hamper."}},{"value":"someone else put it there","available":35,"via":"indirect","reasoning":{"para":35,"text":"The coat hangs neatly apart from the body, as if placed there."}}],"answer":null}
{"id":"q.knife","label":"Why did Straker have the small knife with him?","entry":{"of":"straker","attr":"carrying","time":{"at":"t.crime"}},"raised":35,"quote":"in his right hand he held a small knife","possibilities":[{"value":"something else","available":35,"via":"always"},{"value":"to defend himself","available":35,"via":"direct","quote":"Straker had defended himself vigorously against his assailants"},{"value":"for some task he meant to do","available":35,"via":"indirect","reasoning":{"para":35,"text":"He went out to check on the horses, yet he had a small, very sharp knife in his hand."}}],"answer":null}
{"id":"q.thigh_cut","label":"What made the cut on Straker's thigh?","entry":{"of":"?","attr":"action","time":{"at":"t.crime"}},"raised":35,"quote":"there was a long, clean cut, inflicted evidently by some very sharp instrument","possibilities":[{"value":"something else","available":35,"via":"always"},{"value":"an assailant's blade","available":35,"via":"indirect","from":"f.thigh_cut"},{"value":"his own knife, in convulsions after the blow","available":43,"via":"direct","quote":"may have been caused by his own knife in the convulsive struggles"}],"answer":null}
{"id":"q.knife_blood","label":"Whose blood is on Straker's knife?","entry":{"of":"straker_knife","attr":"condition","time":{"at":"t.crime"}},"raised":41,"quote":"one at least of his assailants must bear his mark upon him","possibilities":[{"value":"something else","available":41,"via":"always"},{"value":"an assailant's","available":41,"via":"direct","quote":"one at least of his assailants must bear his mark upon him"},{"value":"Straker's own","available":43,"via":"direct","quote":"caused by his own knife"}],"answer":null}
{"id":"q.cravat","label":"How did the stranger's cravat come to be in the dead man's hand?","entry":{"of":"cravat","attr":"location","time":{"at":"t.crime"}},"raised":40,"quote":"was utterly unable to account for its presence in the hand of the murdered man","possibilities":[{"value":"something else","available":40,"via":"always"},{"value":"Straker tore it from his attacker in the fight","available":40,"via":"indirect","from":"f.cravat_left"},{"value":"Simpson lost it and someone else had it","available":40,"via":"indirect","reasoning":{"para":40,"text":"Simpson admits the visit but cannot explain the cravat. He may have dropped it, and someone else took it up."}},{"value":"it was put there to throw suspicion on Simpson","available":40,"via":"indirect","reasoning":{"para":40,"text":"A cravat clutched in a dead man's hand points straight at its owner, which is what someone wishing to blame him would want."}}],"answer":null}
{"id":"q.simpson_intent","label":"Did Simpson come only to get information?","entry":{"of":"simpson","attr":"intends","time":{"at":"t.mon_window"}},"raised":40,"quote":"declared that he had no sinister designs","possibilities":[{"value":"something else","available":40,"via":"always"},{"value":"only to get first-hand information","available":40,"via":"direct","quote":"had simply wished to obtain first-hand information"},{"value":"to put the favourite out of the race","available":40,"via":"indirect","from":"f.simpson_bets"},{"value":"to drug the lad and take the horse","available":46,"via":"direct","quote":"having drugged the lad"}],"answer":null}
{"id":"q.wire_reply","kind":"provenance","label":"Who answered Holmes's wire about the door?","entry":{"of":"?","attr":"tells","time":{"at":"t.wed"}},"raised":31,"quote":"I sent a special wire to Dartmoor yesterday to clear the matter up","possibilities":[{"value":"something else","available":31,"via":"always"},{"value":"gregory","available":31,"via":"indirect","reasoning":{"para":31,"text":"Inspector Gregory has the case and had already wired Holmes."}},{"value":"ross","available":31,"via":"indirect","reasoning":{"para":31,"text":"Colonel Ross, the owner, had also wired Holmes."}}],"answer":null}
{"id":"q.analysis_by","kind":"provenance","label":"Who made the analysis of Hunter's supper?","entry":{"of":"?","attr":"tells","time":{"after":"t.analysis","before":"t.wed"}},"raised":37,"quote":"an analysis has shown","possibilities":[{"value":"something else","available":37,"via":"always"},{"value":"an analyst working for the police","available":37,"via":"indirect","reasoning":{"para":37,"text":"Analysing the remains of a meal in a murder case is work done for the police."}}],"answer":null}

## The reader's notes so far (the annotated reading)

{"bk":"bk.favourite_motive","text":"When a horse is favourite for a big race, people who have bet against it, or who stand to lose if it wins, have a reason to stop it running.","exceptions":"The owner or backers of the favourite normally want it to run.","reader":"all"}
{"bk":"bk.horse_conspicuous","text":"A famous racehorse is large, valuable and recognisable, and it is hard to hide or move unseen in open, thinly settled country.","exceptions":"It can be hidden if it is disguised, kept in a building, or killed.","reader":"all"}
{"bk":"bk.genre_detective_signals","text":"In detective stories, what the detective asks for, looks at, or finds odd usually matters later.","reader":"all"}
{"bk":"bk.period_gypsies","text":"Readers of the period readily suspected roaming gypsies of horse-stealing.","exceptions":"It is a prejudice of the time, not evidence, and a large reward puts the same people on the side of finding the horse.","reader":"period"}
{"bk":"bk.drug_taste","text":"A drug mixed into food is easier to give unnoticed in a strongly flavoured dish than in a plain one, because most drugs have a taste or smell of their own.","exceptions":"Tasteless drugs; a very small dose; a careless or very hungry eater.","reader":"specialist"}
{"bk":"bk.keyholder","text":"The master of a stable or house normally keeps a key to it.","exceptions":"Keys may be held only by the servant on duty, or kept at a separate office.","reader":"all"}
{"bk":"bk.guard_dog","text":"A guard dog kept in a building gives the alarm when strangers come at night.","exceptions":"It is drugged, removed, or out of earshot, or it knows the visitor.","reader":"all"}
{"bk":"bk.self_wound","text":"A man struck hard on the head can thrash about convulsively and may hurt himself with anything he is holding.","reader":"specialist"}
{"bk":"bk.lost_item","text":"Something lost out of doors can be picked up and carried off by anyone who comes across it, so where it turns up later does not prove where its owner went.","exceptions":"It was lost only moments before, or in a place nobody else could reach.","reader":"all"}
{"bk":"bk.search_by_description","text":"Searchers look for what they have been told to look for, so a search finds a thing only if it still looks the way it was described.","exceptions":"Searchers who know the object closely, or who check it in ways that do not depend on appearance.","reader":"all"}
{"bk":"bk.tout_bribe","text":"Racing touts commonly paid stable-lads money for inside information on how the horses were running.","reader":"period"}
{"id":"t4.1","para":4,"tag":"RECORD","profile":"typical","from":[],"reads":"the singular disappearance of the favourite for the Wessex Cup, and the tragic murder of its trainer","text":"Two events: the favourite for the Wessex Cup has vanished, and its trainer has been murdered."}
{"id":"t4.2","para":4,"tag":"QUESTION","confidence":"fair","profile":"typical","from":["t4.1"],"text":"How are the disappearance and the murder connected?","options":["A thief came for the horse and killed the trainer who got in the way","The two are separate, or only linked by coincidence","The trainer was mixed up in what happened to the horse"]}
{"id":"t4.3","para":4,"tag":"HYPOTHESIS","confidence":"weak","profile":"typical","from":["t4.1"],"text":"What does 'disappearance' mean for the horse?","options":["Stolen and hidden","Strayed loose in the confusion","Killed or maimed and the body not yet found"]}
{"id":"t4.4","para":4,"tag":"QUESTION","subtype":"motive","confidence":"fair","profile":"typical","from":["t4.1","bk.favourite_motive"],"text":"Who gains if the favourite does not run? Bookmakers, people who bet against it, rival owners. Who would want the trainer dead?","options":["Someone with money riding against the favourite","A rival stable","Someone with a private grudge against the trainer"]}
{"id":"t6.1","para":6,"tag":"GENRE","subtype":"watch-detective","confidence":"weak","profile":"careful","from":["bk.genre_detective_signals"],"reads":"You would oblige me by bringing with you your very excellent field-glass.","text":"Holmes wants a field-glass before he has seen the ground. He expects to look at something at a distance: open moor, a racecourse, figures far off. Keep it in mind."}
{"id":"t6.2","para":6,"tag":"GENRE","confidence":"weak","profile":"typical","from":[],"reads":"there are points about the case which promise to make it an absolutely unique one","text":"Holmes already sees particular 'points', apparently from the newspaper reports alone. The clues may be in the facts he is about to list."}
{"id":"t8.1","para":8,"tag":"SET ASIDE","profile":"typical","from":[],"reads":"Our rate at present is fifty-three and a half miles an hour.","text":"The speed calculation from the telegraph posts shows off Holmes's method. It has no bearing on the case."}
{"id":"t10.1","para":10,"tag":"RECORD","profile":"typical","from":["t4.1"],"reads":"this matter of the murder of John Straker and the disappearance of Silver Blaze","text":"Names: the trainer is John Straker, and the horse is Silver Blaze."}
{"id":"t12.1","para":12,"tag":"GENRE","confidence":"fair","profile":"careful","from":[],"reads":"the art of the reasoner should be used rather for the sifting of details than for the acquiring of fresh evidence","text":"Holmes says the answer lies in the facts already known, once they are cleared of journalists' theorising. So the reader should treat his coming summary as the evidence to sift, and distrust press 'conjecture'."}
{"id":"t12.2","para":12,"tag":"RECORD","profile":"typical","from":[],"reads":"I received telegrams from both Colonel Ross, the owner of the horse, and from Inspector Gregory, who is looking after the case, inviting my co-operation","text":"Colonel Ross owns the horse, and Inspector Gregory leads the police case. Both called Holmes in on Tuesday evening."}
{"id":"t13.1","para":13,"tag":"INFER","confidence":"strong","profile":"careful","from":["t12.2"],"reads":"And this is Thursday morning.","text":"The telegrams came Tuesday evening, so the crime happened no later than Tuesday, probably Monday night or Tuesday. Two days have now passed."}
{"id":"t14.1","para":14,"tag":"DEFAULT","confidence":"fair","profile":"typical","from":["t4.3","bk.horse_conspicuous"],"reads":"I could not believe it possible that the most remarkable horse in England could long remain concealed, especially in so sparsely inhabited a place as the north of Dartmoor","text":"Holmes reasoned as anyone would: a famous horse on an empty moor gets found quickly."}
{"id":"t14.2","para":14,"tag":"DROP","confidence":"fair","profile":"typical","from":["t4.3","t13.1","t14.1"],"relations":[{"type":"drops","target":"t4.3"}],"text":"The horse cannot have simply strayed. A loose favourite on a thinly peopled moor would have turned up within two days. Someone is keeping it out of sight, or it is dead."}
{"id":"t14.3","para":14,"tag":"QUESTION","confidence":"fair","profile":"careful","from":["t14.1","t14.2","bk.horse_conspicuous"],"text":"How can so conspicuous a horse stay unfound? Turn it around: what would make the usual rule fail here?","options":["Shut in a building nearby","Changed in appearance so that nobody recognises it","Taken a long way off very quickly","Dead, and the body hidden"]}
{"id":"t14.4","para":14,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"fair","profile":"typical","from":["t4.2","t14.1"],"reads":"I expected to hear that he had been found, and that his abductor was the murderer of John Straker","text":"Working theory, Holmes's own until now: one person took the horse and killed Straker."}
{"id":"t14.5","para":14,"tag":"RECORD","profile":"typical","from":[],"reads":"beyond the arrest of young Fitzroy Simpson nothing had been done","text":"The police have arrested a young man, Fitzroy Simpson."}
{"id":"t14.6","para":14,"tag":"HYPOTHESIS","confidence":"weak","profile":"typical","from":["t14.5","t14.4"],"text":"Simpson is the abductor and murderer.","options":["Simpson did both","Simpson did one or the other","Simpson is innocent and was arrested on suspicion"]}
{"id":"t14.7","para":14,"tag":"WEIGH","confidence":"weak","profile":"careful","from":["t14.5","t14.6"],"relations":[{"type":"strains","target":"t14.6"}],"text":"Holmes treats the arrest as 'nothing having been done'. To him an arrest does not settle the case, especially with the horse still missing. If Simpson knew where the horse was, one might expect it to have been found by now."}
{"id":"t14.8","para":14,"tag":"GENRE","subtype":"watch-detective","confidence":"weak","profile":"careful","from":[],"reads":"Yet in some ways I feel that yesterday has not been wasted.","text":"The fact that the horse was not found is itself information to Holmes. Its continued absence is a clue to how it is being hidden."}
{"id":"t16.1","para":16,"tag":"RESIDUE","confidence":"fair","profile":"careful","from":["t4.2","t4.4","t14.3","t14.4","t14.6","t6.1"],"text":"Open at the end of the scene: how the murder and the disappearance connect; where an unfindable famous horse can be; who profits if the favourite does not run; whether Simpson is more than a convenient arrest; and what Holmes means to look at with the field-glass. The details have not been given yet. Holmes's list of facts comes next and should be read closely."}
{"id":"t16.2","para":16,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"typical","from":["t14.4","t14.2","t4.4"],"text":"Leading picture so far: someone with an interest against the favourite stole or harmed Silver Blaze, killed Straker in the process, and has hidden the horse well. Simpson is the police's candidate. It is held loosely, because Holmes's own version of it has already failed once."}
{"id":"t18.1","para":18,"tag":"RECORD","profile":"typical","from":["t4.1"],"reads":"the betting being three to one on him","text":"Silver Blaze is heavily odds-on for the Wessex Cup."}
{"id":"t18.2","para":18,"tag":"RECORD","profile":"typical","from":[],"reads":"preventing Silver Blaze from being there at the fall of the flag next Tuesday","text":"The race is next Tuesday, about five days off. Whoever has the horse needs to keep it out of sight only until then."}
{"id":"t18.3","para":18,"tag":"INFER","subtype":"motive","confidence":"strong","profile":"typical","from":["t18.1","bk.favourite_motive"],"reads":"so that even at those odds enormous sums of money have been laid upon him","text":"Huge sums are bet on him, so the bookmakers who took those bets stand to lose heavily if he wins. Layers against the favourite are the obvious class of suspect."}
{"id":"t19.1","para":19,"tag":"RECORD","profile":"typical","from":["t10.1"],"reads":"has always shown himself to be a zealous and honest servant","text":"Straker is a former jockey with twelve years' good service to the Colonel. His character is reported as excellent."}
{"id":"t19.2","para":19,"tag":"RECORD","profile":"typical","from":[],"reads":"One of these lads sat up each night in the stable, while the others slept in the loft","text":"Routine: one lad sits up in the stable each night and the other two sleep in the loft above."}
{"id":"t19.3","para":19,"tag":"RECORD","profile":"typical","from":[],"reads":"lived in a small villa about two hundred yards from the stables","text":"Map: Straker's house is 200 yards from the stables and a cluster of villas lies half a mile north. Tavistock is two miles west, and Mapleton is two miles across the moor. Everything else is empty moor."}
{"id":"t19.4","para":19,"tag":"HYPOTHESIS","subtype":"opportunity","confidence":"weak","profile":"careful","from":["t19.3","t14.3"],"reads":"the larger training establishment of Mapleton, which belongs to Lord Backwater, and is managed by Silas Brown","text":"A rival training stable two miles off is one place where a horse could stand unnoticed among other horses, under cover. It answers the 'shut in a building' option of t14.3.","options":["Mapleton is hiding the horse","Mapleton is mere geography"]}
{"id":"t19.5","para":19,"tag":"DEFAULT","subtype":"period","confidence":"weak","profile":"typical","from":["bk.period_gypsies","t14.3"],"reads":"inhabited only by a few roaming gypsies","text":"A reader of the time would think at once of the gypsies as horse-thieves. That is a candidate the story itself puts on the map."}
{"id":"t20.1","para":20,"tag":"RECORD","profile":"typical","from":[],"reads":"the stables were locked up at nine o’clock","text":"The stables were locked at nine. Ned Hunter stayed inside on guard, and the other two lads went up to the house for supper."}
{"id":"t20.2","para":20,"tag":"RECORD","profile":"typical","from":[],"reads":"which consisted of a dish of curried mutton","text":"Edith Baxter, the maid, carried Hunter's supper down to the stables. It was curried mutton."}
{"id":"t20.3","para":20,"tag":"NOTICE","confidence":"weak","profile":"careful","from":["t20.2"],"reads":"it was the rule that the lad on duty should drink nothing else","text":"The duty lad drinks only tap water. So if anyone wanted to dose him, the food is the only channel. The menu is told in unusual detail."}
{"id":"t21.1","para":21,"tag":"RECORD","profile":"typical","from":[],"reads":"carried a heavy stick with a knob to it","text":"The stranger is gentlemanly, wears a grey tweed suit and cloth cap with gaiters, and carries a heavy knobbed stick. He is pale and nervous, and a little over thirty."}
{"id":"t24.1","para":24,"tag":"WEIGH","confidence":"fair","profile":"typical","from":["t19.2"],"reads":"I understand that a stable-boy sleeps there alone every night.","text":"He claimed to be lost (¶22), yet he knows the stable routine. The 'lost' story is a pretext, and he came to this stable on purpose."}
{"id":"t24.2","para":24,"tag":"HYPOTHESIS","confidence":"fair","profile":"typical","from":["t24.1"],"reads":"He took a piece of white paper folded up out of his waistcoat pocket.","text":"What is in the folded paper?","options":["A drug for the boy's supper","A note or bribe-offer for the boy","Money"]}
{"id":"t25.1","para":25,"tag":"RECORD","profile":"typical","from":[],"reads":"It was already opened, and Hunter was seated at the small table inside.","text":"Meals are handed in through a window that was already open, with Hunter at a table just inside."}
{"id":"t26.1","para":26,"tag":"WEIGH","confidence":"weak","profile":"careful","from":["t24.2"],"reads":"The girl has sworn that as he spoke she noticed the corner of the little paper packet protruding from his closed hand.","text":"This is sworn, but it comes from a frightened girl by lantern light, and it fits what everyone later came to believe. It shows the packet was still in his hand. It does not show what was done with it."}
{"id":"t28.1","para":28,"tag":"RECORD","profile":"typical","from":[],"reads":"You’ve two horses in for the Wessex Cup—Silver Blaze and Bayard.","text":"King's Pyland has two runners. The stranger asks whether the stable secretly prefers Bayard. That is a tout's question."}
{"id":"t29.1","para":29,"tag":"RECORD","profile":"typical","from":[],"reads":"rushed across the stable to unloose the dog","text":"There is a guard dog kept in the stable."}
{"id":"t29.2","para":29,"tag":"INFER","subtype":"opportunity","confidence":"fair","profile":"typical","from":["t25.1","t26.1"],"reads":"as she ran she looked back and saw that the stranger was leaning through the window","text":"While Hunter crossed the stable for the dog, the stranger was alone at the open window with the supper on the table inside. He had the chance to put something in it."}
{"id":"t30.1","para":30,"tag":"HYPOTHESIS","subtype":"opportunity","confidence":"weak","profile":"typical","from":["t29.1","t20.1"],"reads":"Did the stable-boy, when he ran out with the dog, leave the door unlocked behind him?","text":"Watson's idea: the stranger doubled back and slipped in, or someone else did, while Hunter was out with the dog and the door stood open."}
{"id":"t31.1","para":31,"tag":"DROP","confidence":"strong","profile":"typical","from":["t30.1"],"reads":"The boy locked the door before he left it.","relations":[{"type":"drops","target":"t30.1"}],"text":"The door was locked and the window is too small for a man to get through. The stranger did not get in that evening."}
{"id":"t31.2","para":31,"tag":"GENRE","subtype":"watch-detective","confidence":"fair","profile":"careful","from":["t31.1","bk.genre_detective_signals"],"text":"Holmes wired specially about the door. Access to the stable is a key point for him: whoever took the horse later had to get through a locked door."}
{"id":"t32.1","para":32,"tag":"RECORD","profile":"typical","from":[],"reads":"he pulled on his large mackintosh and left the house","text":"Straker went out at about 1 a.m. in the rain to check the stables, wearing a large mackintosh."}
{"id":"t32.2","para":32,"tag":"AGENT","confidence":"weak","profile":"careful","from":["t32.1"],"reads":"although he does not seem to have quite realized its true significance","text":"He is said not to have grasped the significance, yet he was uneasy enough to go out alone at one in the rain without waking the lads. Mrs Straker reports only the reason he gave her."}
{"id":"t33.1","para":33,"tag":"RECORD","profile":"typical","from":[],"reads":"Hunter was sunk in a state of absolute stupor","text":"At 7 a.m.: the stable door is open, Hunter is stupefied, the stall is empty and Straker is missing."}
{"id":"t33.2","para":33,"tag":"QUESTION","subtype":"opportunity","confidence":"strong","profile":"typical","from":["t31.1","t33.1","bk.keyholder"],"reads":"The door was open","text":"Locked at nine and open at seven: who opened it?","options":["Someone with a duplicate or stolen key","Straker, who would have a key as master of the stable","Hunter, before the drug took hold"]}
{"id":"t34.1","para":34,"tag":"RECORD","profile":"typical","from":[],"reads":"They had heard nothing during the night, for they are both sound sleepers.","text":"The lads in the loft heard nothing."}
{"id":"t34.2","para":34,"tag":"ABSENCE","confidence":"weak","profile":"careful","from":["t29.1","t34.1","bk.guard_dog"],"text":"A guard dog is kept in the stable, yet nothing woke the lads overhead. Did the dog make no noise while the horse was taken? The account does not say.","hindsight":"A first-time reader must connect the dog of ¶29 with the silence of ¶34. They are five paragraphs apart and the dog is never mentioned again."}
{"id":"t35.1","para":35,"tag":"RECORD","profile":"typical","from":[],"reads":"John Straker’s overcoat was flapping from a furze-bush","text":"Straker's coat was hanging on a furze-bush a quarter-mile from the stables. His body lay in a hollow just beyond."}
{"id":"t35.2","para":35,"tag":"AGENT","confidence":"fair","profile":"careful","from":["t32.1","t35.1"],"text":"It was a rainy night, yet his coat is off and hung on a bush. Why would he take it off?","options":["It was torn off in the struggle","He threw it aside to fight","He took it off for some task","Someone else put it there"]}
{"id":"t35.3","para":35,"tag":"RECORD","profile":"typical","from":[],"reads":"there was a long, clean cut, inflicted evidently by some very sharp instrument","text":"Wounds: his head was smashed by a heavy weapon, and he has a long clean cut on the thigh from a very sharp blade."}
{"id":"t35.4","para":35,"tag":"RECORD","profile":"typical","from":[],"reads":"in his right hand he held a small knife, which was clotted with blood up to the handle","text":"Straker held a small, bloodied knife in his right hand."}
{"id":"t35.5","para":35,"tag":"NOTICE","confidence":"weak","profile":"careful","from":["t35.4","t32.1"],"text":"Straker went out to check on horses carrying a knife. What kind of knife, and why did he have it? It is described only as 'small'."}
{"id":"t35.6","para":35,"tag":"RECORD","profile":"typical","from":["t21.1"],"reads":"in his left he clasped a red and black silk cravat","text":"In his left hand was a cravat that the maid identifies as the stranger's."}
{"id":"t36.1","para":36,"tag":"WEIGH","confidence":"strong","profile":"careful","from":["t29.2","t26.1"],"reads":"He was equally certain that the same stranger had, while standing at the window, drugged his curried mutton","text":"Hunter did not see the drugging. He concluded it. He was across the stable fetching the dog. It is a reasonable guess, but it is not observation."}
{"id":"t37.1","para":37,"tag":"RECORD","profile":"typical","from":[],"reads":"there were abundant proofs in the mud which lay at the bottom of the fatal hollow that he had been there at the time of the struggle","text":"The horse was in the hollow where Straker died, at the time of the struggle."}
{"id":"t37.2","para":37,"tag":"TEST","confidence":"weak","profile":"careful","from":["t19.5","t14.2"],"reads":"all the gypsies of Dartmoor are on the alert","relations":[{"type":"strains","target":"t19.5"}],"text":"With a large reward and the gypsies themselves searching, a gypsy theft looks less likely. So does a horse that is merely loose. The horse is hidden well, or in a place nobody searches."}
{"id":"t37.3","para":37,"tag":"RECORD","profile":"typical","from":["t20.2"],"reads":"contain an appreciable quantity of powdered opium","text":"Hunter's leftover curry contains powdered opium."}
{"id":"t37.4","para":37,"tag":"INFER","subtype":"opportunity","confidence":"strong","profile":"typical","from":["t37.3"],"reads":"the people at the house partook of the same dish on the same night without any ill effect","text":"The household ate the same dish unharmed, so the opium went into Hunter's portion only. It was added after his share was set apart: in the kitchen, on the path, at the window, or by Hunter himself."}
{"id":"t37.5","para":37,"tag":"DROP","confidence":"fair","profile":"typical","from":["t37.3","t33.2"],"relations":[{"type":"strains","target":"t33.2"}],"text":"The analysis confirms that Hunter really was drugged. That makes him an unlikely accomplice who opened the door."}
{"id":"t37.6","para":37,"tag":"PHYSICAL","confidence":"weak","profile":"expert","from":["t37.3","t20.2","bk.drug_taste"],"text":"Powdered opium has a taste of its own, and a curry would hide it. A stranger who met the maid by chance on the path could not have known the supper would be curry. Would a plain dish have given the drug away?","hindsight":"A first-time reader needs to know that opium has a noticeable taste, and to ask whether the poisoner chose the dish or was merely lucky. Few readers make this step unprompted."}
{"id":"t39.1","para":39,"tag":"GENRE","confidence":"fair","profile":"typical","from":["t12.1"],"reads":"Were he but gifted with imagination he might rise to great heights in his profession.","text":"Holmes calls Gregory competent but unimaginative. The 'natural' suspect the police chose may be the wrong one."}
{"id":"t39.2","para":39,"tag":"RECORD","profile":"typical","from":["t14.5","t19.3"],"reads":"he inhabited one of those villas which I have mentioned","text":"Simpson was lodging in the villas half a mile north and was found there easily."}
{"id":"t39.3","para":39,"tag":"INFER","subtype":"motive","confidence":"strong","profile":"typical","from":["t18.3","t39.2"],"reads":"bets to the amount of five thousand pounds had been registered by him against the favourite","text":"Simpson is a ruined gentleman who now makes a book, and he stands to lose £5,000 if Silver Blaze wins. He has a strong motive."}
{"id":"t40.1","para":40,"tag":"IDENTIFY","subtype":"merge","confidence":"strong","profile":"typical","from":["t21.1","t39.2"],"reads":"He did not attempt to deny that he had acted as described upon the evening before","text":"The stranger at the window is Simpson. He admits it."}
{"id":"t40.2","para":40,"tag":"RECORD","profile":"typical","from":["t19.3"],"reads":"Desborough, the second favourite, which was in charge of Silas Brown at the Mapleton stables","text":"Mapleton, two miles off and run by Silas Brown, has Desborough, the second favourite."}
{"id":"t40.3","para":40,"tag":"HYPOTHESIS","subtype":"motive","confidence":"weak","profile":"typical","from":["t40.2","t19.4","bk.favourite_motive"],"text":"Mapleton gains directly if Silver Blaze is out of the race. Silas Brown has both motive and a nearby stable to hide a horse in.","options":["Mapleton people took the horse","Mapleton is only a rival, not involved"]}
{"id":"t40.4","para":40,"tag":"WEIGH","confidence":"weak","profile":"careful","from":["t35.6","t40.1"],"reads":"he turned very pale, and was utterly unable to account for its presence in the hand of the murdered man","text":"Simpson does not deny the cravat is his. Turning pale fits guilt, and it also fits a man who sees he is in serious trouble. He did not deny being at the stable either, so where did he lose the cravat?"}
{"id":"t40.5","para":40,"tag":"RECORD","profile":"typical","from":["t21.1","t35.3"],"reads":"his stick, which was a Penang-lawyer weighted with lead","text":"Simpson's clothes were wet from the night's storm. His knobbed stick is lead-weighted and could have caused the head wound."}
{"id":"t41.1","para":41,"tag":"INFER","confidence":"fair","profile":"typical","from":["t35.4","t35.3"],"reads":"there was no wound upon his person","text":"Simpson is unwounded, though Straker's knife is bloody to the handle. Whose blood is on it? Either another assailant is wounded, or the blood came from somewhere else."}
{"id":"t41.2","para":41,"tag":"NOTICE","confidence":"weak","profile":"careful","from":["t41.1"],"reads":"one at least of his assailants must bear his mark upon him","text":"The account speaks of 'assailants', plural. It is unclear whether that is evidence or reporters' framing. Nothing shown so far requires more than one."}
{"id":"t43.1","para":43,"tag":"HYPOTHESIS","confidence":"fair","profile":"typical","from":["t41.1","t35.3","bk.self_wound"],"reads":"the incised wound upon Straker may have been caused by his own knife in the convulsive struggles which follow any brain injury","text":"Watson's idea: Straker cut his own thigh in convulsions after the blow. The blood on the knife would then be his own."}
{"id":"t44.1","para":44,"tag":"REVISE","confidence":"fair","profile":"typical","from":["t43.1","t41.1"],"reads":"It is more than possible; it is probable","relations":[{"type":"undercuts","target":"t41.1"}],"text":"If the cut is self-inflicted, Simpson's lack of a wound proves nothing, and the case against him gets stronger."}
{"id":"t46.1","para":46,"tag":"RECORD","profile":"typical","from":[],"reads":"His bridle is missing, so that Simpson must have put this on.","text":"The horse's bridle is missing. Someone led him out bridled."}
{"id":"t46.2","para":46,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"typical","from":["t29.2","t39.3","t40.5","t46.1"],"reads":"having in some way obtained a duplicate key","text":"Police theory: Simpson drugged Hunter, used a duplicate key, bridled and led off the horse, met Straker, killed him with the stick, and then either hid the horse or lost it when it bolted."}
{"id":"t46.3","para":46,"tag":"RESIDUE","confidence":"fair","profile":"careful","from":["t46.2","t33.2","t14.2","t35.2","t24.2","t37.6"],"reads":"I am afraid that whatever theory we state has very grave objections to it","relations":[{"type":"strains","target":"t46.2"}],"text":"The police theory leaves gaps. Where did Simpson get a duplicate key? Why would a man betting against the horse lead it away rather than just harm it in the stall? Where is it now, with Simpson under arrest? The 'bolted' branch conflicts with t14.2, since a loose horse would have been found. It does not explain Straker's coat on the bush, or why Simpson stayed at his lodging to be arrested."}
{"id":"t46.4","para":46,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"careful","from":["t33.2","t32.1","t37.1","t35.2","t35.5","bk.keyholder"],"text":"Another reading of the same facts: Straker himself opened the stable and took the horse out. He had a key, went out alone at one, died beside the horse, had his coat off and a knife in hand. If so, why, and who killed him?","options":["Straker took the horse out for an innocent reason and met the thief","Straker was himself acting against the horse","Straker followed someone who had taken it"],"hindsight":"A first-time reader must set aside Straker's reported good character and the account's framing of him as victim. They must then join the locked door, his key and his solitary night walk."}
{"id":"t46.5","para":46,"tag":"RESIDUE","confidence":"fair","profile":"careful","from":["t46.3","t40.3","t34.2","t6.1","t36.1"],"text":"Open at the scene's end: who opened the locked door, and where the horse is hidden. Whether the stranger really drugged the curry or Hunter only assumed it, and how a passer-by could rely on a dish that hides opium. Why the coat was off, what the knife was for, and whether the dog was silent. What part Mapleton and Silas Brown play. What Holmes wants the field-glass for. Simpson remains the police's suspect, and the theory is admitted to be improbable."}
{"id":"t47.1","para":47,"tag":"RECORD","profile":"typical","from":["t12.2"],"reads":"The latter was Colonel Ross, the well-known sportsman; the other, Inspector Gregory","text":"Ross and Gregory meet Holmes and Watson at Tavistock station. Gregory is the tall, fair man and Ross is the small, dapper one with an eye-glass."}
{"id":"t48.1","para":48,"tag":"RECORD","profile":"typical","from":["t47.1"],"reads":"I wish to leave no stone unturned in trying to avenge poor Straker and in recovering my horse","text":"Ross wants Straker avenged and the horse recovered. As owner of the favourite, he is someone who wants it to run."}
{"id":"t50.1","para":50,"tag":"RECORD","profile":"typical","from":[],"reads":"I am sorry to say that we have made very little progress","text":"Nothing new since Holmes's summary. The horse is still missing."}
{"id":"t51.1","para":51,"tag":"NOTICE","confidence":"weak","profile":"typical","from":["t48.1"],"reads":"Colonel Ross leaned back with his arms folded and his hat tilted over his eyes","text":"The owner takes no part in the talk about his own horse. He may doubt the detectives, or he may simply be a cold man. It is probably manner rather than clue."}
{"id":"t52.1","para":52,"tag":"RECORD","profile":"typical","from":["t46.2"],"reads":"I recognise that the evidence is purely circumstantial","text":"Gregory is sure Simpson is the man, and he admits the case is circumstantial. His theory matches the one Holmes predicted (t46.2)."}
{"id":"t54.1","para":54,"tag":"RECORD","profile":"typical","from":["t43.1"],"reads":"We have quite come to the conclusion that he wounded himself in his fall.","relations":[{"type":"supports","target":"t43.1"}],"text":"The police independently reached Watson's idea that the cut on Straker's thigh came from his own knife."}
{"id":"t56.1","para":56,"tag":"WEIGH","confidence":"fair","profile":"careful","from":["t36.1","t26.1"],"reads":"He lies under suspicion of having poisoned the stable-boy","text":"Even Gregory puts this only as 'suspicion'. It rests on Hunter's conclusion, not on anyone seeing it done: the maid saw a packet in his hand and then saw him lean through the window."}
{"id":"t57.1","para":57,"tag":"QUESTION","subtype":"turn-around","confidence":"fair","profile":"careful","from":["t46.3","t39.3"],"reads":"Why should he take the horse out of the stable? If he wished to injure it why could he not do it there?","text":"Holmes's objection, turned around: who would need the horse out on the open moor rather than in the stall? Someone who had to do something to it that could not be done inside, or someone who meant to take it away.","options":["A thief meaning to hide or sell it","Someone who needed it out of the stable for a reason not yet known","Someone leading it to a confederate"]}
{"id":"t57.2","para":57,"tag":"GENRE","subtype":"watch-detective","confidence":"fair","profile":"careful","from":["t37.6","bk.genre_detective_signals"],"reads":"What chemist sold him the powdered opium?","text":"Holmes asks where the opium came from. He treats it as something that can be traced. The opium links to the curry question (t37.6)."}
{"id":"t57.3","para":57,"tag":"QUESTION","confidence":"fair","profile":"typical","from":["t24.2"],"reads":"What is his own explanation as to the paper which he wished the maid to give to the stable-boy?","text":"The folded paper is still unexplained. Holmes wants Simpson's account of it."}
{"id":"t58.1","para":58,"tag":"RECORD","profile":"typical","from":["t24.2"],"reads":"He says that it was a ten-pound note. One was found in his purse.","text":"Simpson says the paper was a ten-pound note, and one was found in his purse."}
{"id":"t58.2","para":58,"tag":"TEST","confidence":"fair","profile":"careful","from":["t58.1","t24.2","t28.1","bk.tout_bribe"],"relations":[{"type":"strains","target":"t46.2"},{"type":"strains","target":"t36.1"}],"text":"A ten-pound note is exactly what a tout would offer a lad for a tip, and the note was still in his purse. That fits 'bribe for information' better than 'drug'. If the packet was money, the only evidence that he drugged the curry gets weaker. Hunter's belief in t36.1 was only a conclusion."}
{"id":"t58.3","para":58,"tag":"WEIGH","confidence":"fair","profile":"careful","from":["t57.1","t57.2"],"reads":"The opium was probably brought from London. The key, having served its purpose, would be hurled away.","text":"Gregory answers Holmes's points with guesses ('probably', 'would be', 'may be'), not with findings. No chemist, no key and no horse have been found. He has not answered the question of why the horse was taken out at all."}
{"id":"t58.4","para":58,"tag":"RECORD","profile":"typical","from":["t46.3"],"reads":"He has twice lodged at Tavistock in the summer.","relations":[{"type":"undercuts","target":"t46.3"}],"text":"Simpson has stayed in the district before. That weakens the 'stranger with nowhere to hide a horse' objection, though only a little."}
{"id":"t58.5","para":58,"tag":"HYPOTHESIS","confidence":"weak","profile":"typical","from":["t14.3","t58.3"],"reads":"The horse may be at the bottom of one of the pits or old mines upon the moor.","relations":[{"type":"strains","target":"t57.1"}],"text":"Gregory's fallback: the horse is dead in a mine-shaft. That would explain why it has not been found. But a man who wanted it dead could have done it in the stall, so it does not answer why it was led out.","options":["The horse is dead in a pit","The horse is alive and hidden"]}
{"id":"t60.1","para":60,"tag":"RECORD","profile":"typical","from":["t40.4"],"reads":"He acknowledges that it is his, and declares that he had lost it.","text":"Simpson admits the cravat is his and says he lost it."}
{"id":"t60.2","para":60,"tag":"HYPOTHESIS","confidence":"weak","profile":"careful","from":["t60.1","t35.6","t29.2","bk.lost_item"],"text":"If he lost it that evening near the stable, someone else could have had it. Its presence in Straker's hand would then not place Simpson at the hollow.","options":["Simpson lies, and Straker tore it from him in the fight","It was lost near the stable or on the moor, and Straker or someone else picked it up","Someone used it deliberately to point at Simpson"]}
{"id":"t62.1","para":62,"tag":"RECORD","profile":"typical","from":[],"reads":"a party of gypsies encamped on Monday night within a mile of the spot where the murder took place. On Tuesday they were gone.","text":"Gypsies camped within a mile on the night of the murder and had left by Tuesday."}
{"id":"t62.2","para":62,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"typical","from":["t62.1","t19.5","t46.2","bk.period_gypsies"],"reads":"might he not have been leading the horse to them when he was overtaken, and may they not have him now?","text":"Gregory's new theory: Simpson led the horse out to hand it to the gypsies, who have it now. That would explain both why it was taken out and where it went.","options":["Gypsies have the horse with Simpson's connivance","Gypsies took it on their own","The gypsies are unconnected"]}
{"id":"t62.3","para":62,"tag":"WEIGH","confidence":"weak","profile":"careful","from":["t62.1","t37.2","bk.period_gypsies"],"relations":[{"type":"strains","target":"t62.2"}],"text":"Their leaving proves little. A camp near a murder, with gypsies the first to be suspected, has every reason to move on. Nothing yet links them to Simpson or to the horse, and the reward argues against their hiding it."}
{"id":"t63.1","para":63,"tag":"GENRE","subtype":"watch-detective","confidence":"weak","profile":"careful","from":["t62.2"],"reads":"It is certainly possible.","text":"Holmes 'pricked up his ears' at the new element and then answers flatly. The gypsy theory does not seem to engage him."}
{"id":"t64.1","para":64,"tag":"TEST","confidence":"weak","profile":"careful","from":["t14.3","t19.4","bk.search_by_description","bk.horse_conspicuous"],"reads":"I have also examined every stable and out-house in Tavistock, and for a radius of ten miles.","relations":[{"type":"strains","target":"t19.4"}],"text":"Every stable within ten miles has been searched. That counts against 'shut in a building nearby', unless the searchers were looking for a horse that no longer looks like Silver Blaze. The disguise option in t14.3 survives a search of this kind."}
{"id":"t65.1","para":65,"tag":"GENRE","subtype":"watch-detective","confidence":"fair","profile":"careful","from":["t40.3","t19.4","bk.genre_detective_signals"],"reads":"There is another training-stable quite close, I understand?","text":"Holmes brings up Mapleton himself, straight after the stable search. A stable two miles off is on his mind."}
{"id":"t66.1","para":66,"tag":"RECORD","profile":"typical","from":["t40.2","t40.3"],"reads":"Silas Brown, the trainer, is known to have had large bets upon the event, and he was no friend to poor Straker.","relations":[{"type":"supports","target":"t40.3"}],"text":"Silas Brown has large bets on the race and was on bad terms with Straker. He has motive against both the horse and the man."}
{"id":"t66.2","para":66,"tag":"WEIGH","confidence":"weak","profile":"careful","from":["t66.1","t64.1","bk.search_by_description"],"reads":"We have, however, examined the stables, and there is nothing to connect him with the affair.","text":"'Examined' and found nothing: but the police were looking for Silver Blaze as described, in a yard full of horses. The negative result is only as good as the search.","hindsight":"A first-time reader must apply the disguise option of t14.3 to Mapleton in particular, rather than accept the police's negative result."}
{"id":"t67.1","para":67,"tag":"GENRE","subtype":"watch-detective","confidence":"weak","profile":"careful","from":["t65.1","t39.3","t66.1"],"reads":"And nothing to connect this man Simpson with the interests of the Mapleton stables?","text":"Holmes checks whether the police's suspect and the rival stable are linked. He is considering more than one hand in the affair, or a different hand altogether."}
{"id":"t68.1","para":68,"tag":"INFER","confidence":"fair","profile":"careful","from":["t67.1"],"reads":"Nothing at all.","text":"The two motive-holders, Simpson and Brown, are not known to be connected. If both are involved, it is through some link not yet found. If only one is, the other's motive is a coincidence of the betting."}
{"id":"t68.2","para":68,"tag":"RESIDUE","confidence":"fair","profile":"careful","from":["t57.1","t58.2","t58.3","t60.2","t62.3","t64.1","t66.2","t46.4","t34.2","t6.1"],"text":"Open at the end of the drive: why the horse was led out rather than harmed in the stall. Whether Simpson drugged anything, now that the paper may have been a ten-pound note. Where the opium was bought, and how a passer-by could count on a dish that hides it. Who opened the locked door, since no duplicate key has been found and Straker had his own. How the cravat reached Straker's hand. Whether the gypsies matter. Whether the searches, Mapleton's included, would recognise the horse if it had been altered. Also still open: Straker's coat and knife, the dog's silence, and the field-glass."}
{"id":"t68.3","para":68,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"typical","from":["t46.2","t62.2","t40.3","t46.4","t58.5"],"text":"Standing pictures: (a) the police's, Simpson alone or with gypsies, with the horse hidden or dead in a pit; (b) Mapleton, where Silas Brown has the motive and a yard to hide a horse in, though nothing ties him to the night; (c) Straker himself took the horse out, and someone else killed him. None explains everything yet. (a) is the official theory and the weakest on why the horse left the stall.","options":["Simpson, with or without gypsies","Mapleton and Silas Brown","Straker's own errand, and an unknown killer"]}

## The story so far (this scene is ¶47–¶68)

¶0 I. Silver Blaze

¶1 I am afraid, Watson, that I shall have to go,” said Holmes, as we sat down together to our breakfast one morning.

¶2 “Go! Where to?”

¶3 “To Dartmoor; to King’s Pyland.”

¶4 I was not surprised. Indeed, my only wonder was that he had not already been mixed up in this extraordinary case, which was the one topic of conversation through the length and breadth of England. For a whole day my companion had rambled about the room with his chin upon his chest and his brows knitted, charging and recharging his pipe with the strongest black tobacco, and absolutely deaf to any of my questions or remarks. Fresh editions of every paper had been sent up by our news agent, only to be glanced over and tossed down into a corner. Yet, silent as he was, I knew perfectly well what it was over which he was brooding. There was but one problem before the public which could challenge his powers of analysis, and that was the singular disappearance of the favourite for the Wessex Cup, and the tragic murder of its trainer. When, therefore, he suddenly announced his intention of setting out for the scene of the drama it was only what I had both expected and hoped for.

¶5 “I should be most happy to go down with you if I should not be in the way,” said I.

¶6 “My dear Watson, you would confer a great favour upon me by coming. And I think that your time will not be misspent, for there are points about the case which promise to make it an absolutely unique one. We have, I think, just time to catch our train at Paddington, and I will go further into the matter upon our journey. You would oblige me by bringing with you your very excellent field-glass.”

¶7 And so it happened that an hour or so later I found myself in the corner of a first-class carriage flying along en route for Exeter, while Sherlock Holmes, with his sharp, eager face framed in his ear-flapped travelling-cap, dipped rapidly into the bundle of fresh papers which he had procured at Paddington. We had left Reading far behind us before he thrust the last one of them under the seat, and offered me his cigar-case.

¶8 “We are going well,” said he, looking out the window and glancing at his watch. “Our rate at present is fifty-three and a half miles an hour.”

¶9 “I have not observed the quarter-mile posts,” said I.

¶10 “Nor have I. But the telegraph posts upon this line are sixty yards apart, and the calculation is a simple one. I presume that you have looked into this matter of the murder of John Straker and the disappearance of Silver Blaze?”

¶11 “I have seen what the _Telegraph_ and the _Chronicle_ have to say.”

¶12 “It is one of those cases where the art of the reasoner should be used rather for the sifting of details than for the acquiring of fresh evidence. The tragedy has been so uncommon, so complete and of such personal importance to so many people, that we are suffering from a plethora of surmise, conjecture, and hypothesis. The difficulty is to detach the framework of fact—of absolute undeniable fact—from the embellishments of theorists and reporters. Then, having established ourselves upon this sound basis, it is our duty to see what inferences may be drawn and what are the special points upon which the whole mystery turns. On Tuesday evening I received telegrams from both Colonel Ross, the owner of the horse, and from Inspector Gregory, who is looking after the case, inviting my co-operation.”

¶13 “Tuesday evening!” I exclaimed. “And this is Thursday morning. Why didn’t you go down yesterday?”

¶14 “Because I made a blunder, my dear Watson—which is, I am afraid, a more common occurrence than any one would think who only knew me through your memoirs. The fact is that I could not believe it possible that the most remarkable horse in England could long remain concealed, especially in so sparsely inhabited a place as the north of Dartmoor. From hour to hour yesterday I expected to hear that he had been found, and that his abductor was the murderer of John Straker. When, however, another morning had come, and I found that beyond the arrest of young Fitzroy Simpson nothing had been done, I felt that it was time for me to take action. Yet in some ways I feel that yesterday has not been wasted.”

¶15 “You have formed a theory, then?”

¶16 “At least I have got a grip of the essential facts of the case. I shall enumerate them to you, for nothing clears up a case so much as stating it to another person, and I can hardly expect your co-operation if I do not show you the position from which we start.”

¶17 I lay back against the cushions, puffing at my cigar, while Holmes, leaning forward, with his long, thin forefinger checking off the points upon the palm of his left hand, gave me a sketch of the events which had led to our journey.

¶18 “Silver Blaze,” said he, “is from the Isonomy stock, and holds as brilliant a record as his famous ancestor. He is now in his fifth year, and has brought in turn each of the prizes of the turf to Colonel Ross, his fortunate owner. Up to the time of the catastrophe he was the first favourite for the Wessex Cup, the betting being three to one on him. He has always, however, been a prime favourite with the racing public, and has never yet disappointed them, so that even at those odds enormous sums of money have been laid upon him. It is obvious, therefore, that there were many people who had the strongest interest in preventing Silver Blaze from being there at the fall of the flag next Tuesday.

¶19 “The fact was, of course, appreciated at King’s Pyland, where the Colonel’s training-stable is situated. Every precaution was taken to guard the favourite. The trainer, John Straker, is a retired jockey who rode in Colonel Ross’s colours before he became too heavy for the weighing-chair. He has served the Colonel for five years as jockey and for seven as trainer, and has always shown himself to be a zealous and honest servant. Under him were three lads; for the establishment was a small one, containing only four horses in all. One of these lads sat up each night in the stable, while the others slept in the loft. All three bore excellent characters. John Straker, who is a married man, lived in a small villa about two hundred yards from the stables. He has no children, keeps one maid-servant, and is comfortably off. The country round is very lonely, but about half a mile to the north there is a small cluster of villas which have been built by a Tavistock contractor for the use of invalids and others who may wish to enjoy the pure Dartmoor air. Tavistock itself lies two miles to the west, while across the moor, also about two miles distant, is the larger training establishment of Mapleton, which belongs to Lord Backwater, and is managed by Silas Brown. In every other direction the moor is a complete wilderness, inhabited only by a few roaming gypsies. Such was the general situation last Monday night when the catastrophe occurred.

¶20 “On that evening the horses had been exercised and watered as usual, and the stables were locked up at nine o’clock. Two of the lads walked up to the trainer’s house, where they had supper in the kitchen, while the third, Ned Hunter, remained on guard. At a few minutes after nine the maid, Edith Baxter, carried down to the stables his supper, which consisted of a dish of curried mutton. She took no liquid, as there was a water-tap in the stables, and it was the rule that the lad on duty should drink nothing else. The maid carried a lantern with her, as it was very dark and the path ran across the open moor.

¶21 “Edith Baxter was within thirty yards of the stables, when a man appeared out of the darkness and called to her to stop. As he stepped into the circle of yellow light thrown by the lantern she saw that he was a person of gentlemanly bearing, dressed in a grey suit of tweeds, with a cloth cap. He wore gaiters, and carried a heavy stick with a knob to it. She was most impressed, however, by the extreme pallor of his face and by the nervousness of his manner. His age, she thought, would be rather over thirty than under it.

¶22 “‘Can you tell me where I am?’ he asked. ‘I had almost made up my mind to sleep on the moor, when I saw the light of your lantern.’

¶23 “‘You are close to the King’s Pyland training-stables,’ said she.

¶24 “‘Oh, indeed! What a stroke of luck!’ he cried. ‘I understand that a stable-boy sleeps there alone every night. Perhaps that is his supper which you are carrying to him. Now I am sure that you would not be too proud to earn the price of a new dress, would you?’ He took a piece of white paper folded up out of his waistcoat pocket. ‘See that the boy has this to-night, and you shall have the prettiest frock that money can buy.’

¶25 “She was frightened by the earnestness of his manner, and ran past him to the window through which she was accustomed to hand the meals. It was already opened, and Hunter was seated at the small table inside. She had begun to tell him of what had happened, when the stranger came up again.

¶26 “‘Good-evening,’ said he, looking through the window. ‘I wanted to have a word with you.’ The girl has sworn that as he spoke she noticed the corner of the little paper packet protruding from his closed hand.

¶27 “‘What business have you here?’ asked the lad.

¶28 “‘It’s business that may put something into your pocket,’ said the other. ‘You’ve two horses in for the Wessex Cup—Silver Blaze and Bayard. Let me have the straight tip and you won’t be a loser. Is it a fact that at the weights Bayard could give the other a hundred yards in five furlongs, and that the stable have put their money on him?’

¶29 “‘So, you’re one of those damned touts!’ cried the lad. ‘I’ll show you how we serve them in King’s Pyland.’ He sprang up and rushed across the stable to unloose the dog. The girl fled away to the house, but as she ran she looked back and saw that the stranger was leaning through the window. A minute later, however, when Hunter rushed out with the hound he was gone, and though he ran all round the buildings he failed to find any trace of him.”

¶30 “One moment,” I asked. “Did the stable-boy, when he ran out with the dog, leave the door unlocked behind him?”

¶31 “Excellent, Watson, excellent!” murmured my companion. “The importance of the point struck me so forcibly that I sent a special wire to Dartmoor yesterday to clear the matter up. The boy locked the door before he left it. The window, I may add, was not large enough for a man to get through.

¶32 “Hunter waited until his fellow-grooms had returned, when he sent a message to the trainer and told him what had occurred. Straker was excited at hearing the account, although he does not seem to have quite realized its true significance. It left him, however, vaguely uneasy, and Mrs. Straker, waking at one in the morning, found that he was dressing. In reply to her inquiries, he said that he could not sleep on account of his anxiety about the horses, and that he intended to walk down to the stables to see that all was well. She begged him to remain at home, as she could hear the rain pattering against the window, but in spite of her entreaties he pulled on his large mackintosh and left the house.

¶33 “Mrs. Straker awoke at seven in the morning, to find that her husband had not yet returned. She dressed herself hastily, called the maid, and set off for the stables. The door was open; inside, huddled together upon a chair, Hunter was sunk in a state of absolute stupor, the favourite’s stall was empty, and there were no signs of his trainer.

¶34 “The two lads who slept in the chaff-cutting loft above the harness-room were quickly aroused. They had heard nothing during the night, for they are both sound sleepers. Hunter was obviously under the influence of some powerful drug, and as no sense could be got out of him, he was left to sleep it off while the two lads and the two women ran out in search of the absentees. They still had hopes that the trainer had for some reason taken out the horse for early exercise, but on ascending the knoll near the house, from which all the neighbouring moors were visible, they not only could see no signs of the missing favourite, but they perceived something which warned them that they were in the presence of a tragedy.

¶35 “About a quarter of a mile from the stables John Straker’s overcoat was flapping from a furze-bush. Immediately beyond there was a bowl-shaped depression in the moor, and at the bottom of this was found the dead body of the unfortunate trainer. His head had been shattered by a savage blow from some heavy weapon, and he was wounded on the thigh, where there was a long, clean cut, inflicted evidently by some very sharp instrument. It was clear, however, that Straker had defended himself vigorously against his assailants, for in his right hand he held a small knife, which was clotted with blood up to the handle, while in his left he clasped a red and black silk cravat, which was recognised by the maid as having been worn on the preceding evening by the stranger who had visited the stables.

¶36 “Hunter, on recovering from his stupor, was also quite positive as to the ownership of the cravat. He was equally certain that the same stranger had, while standing at the window, drugged his curried mutton, and so deprived the stables of their watchman.

¶37 “As to the missing horse, there were abundant proofs in the mud which lay at the bottom of the fatal hollow that he had been there at the time of the struggle. But from that morning he has disappeared, and although a large reward has been offered, and all the gypsies of Dartmoor are on the alert, no news has come of him. Finally, an analysis has shown that the remains of his supper left by the stable-lad contain an appreciable quantity of powdered opium, while the people at the house partook of the same dish on the same night without any ill effect.

¶38 “Those are the main facts of the case, stripped of all surmise, and stated as baldly as possible. I shall now recapitulate what the police have done in the matter.

¶39 “Inspector Gregory, to whom the case has been committed, is an extremely competent officer. Were he but gifted with imagination he might rise to great heights in his profession. On his arrival he promptly found and arrested the man upon whom suspicion naturally rested. There was little difficulty in finding him, for he inhabited one of those villas which I have mentioned. His name, it appears, was Fitzroy Simpson. He was a man of excellent birth and education, who had squandered a fortune upon the turf, and who lived now by doing a little quiet and genteel book-making in the sporting clubs of London. An examination of his betting-book shows that bets to the amount of five thousand pounds had been registered by him against the favourite.

¶40 “On being arrested he volunteered the statement that he had come down to Dartmoor in the hope of getting some information about the King’s Pyland horses, and also about Desborough, the second favourite, which was in charge of Silas Brown at the Mapleton stables. He did not attempt to deny that he had acted as described upon the evening before, but declared that he had no sinister designs, and had simply wished to obtain first-hand information. When confronted with his cravat, he turned very pale, and was utterly unable to account for its presence in the hand of the murdered man. His wet clothing showed that he had been out in the storm of the night before, and his stick, which was a Penang-lawyer weighted with lead, was just such a weapon as might, by repeated blows, have inflicted the terrible injuries to which the trainer had succumbed.

¶41 “On the other hand, there was no wound upon his person, while the state of Straker’s knife would show that one at least of his assailants must bear his mark upon him. There you have it all in a nutshell, Watson, and if you can give me any light I shall be infinitely obliged to you.”

¶42 I had listened with the greatest interest to the statement which Holmes, with characteristic clearness, had laid before me. Though most of the facts were familiar to me, I had not sufficiently appreciated their relative importance, nor their connection to each other.

¶43 “Is it not possible,” I suggested, “that the incised wound upon Straker may have been caused by his own knife in the convulsive struggles which follow any brain injury?”

¶44 “It is more than possible; it is probable,” said Holmes. “In that case one of the main points in favour of the accused disappears.”

¶45 “And yet,” said I, “even now I fail to understand what the theory of the police can be.”

¶46 “I am afraid that whatever theory we state has very grave objections to it,” returned my companion. “The police imagine, I take it, that this Fitzroy Simpson, having drugged the lad, and having in some way obtained a duplicate key, opened the stable door and took out the horse, with the intention, apparently, of kidnapping him altogether. His bridle is missing, so that Simpson must have put this on. Then, having left the door open behind him, he was leading the horse away over the moor, when he was either met or overtaken by the trainer. A row naturally ensued. Simpson beat out the trainer’s brains with his heavy stick without receiving any injury from the small knife which Straker used in self-defence, and then the thief either led the horse on to some secret hiding-place, or else it may have bolted during the struggle, and be now wandering out on the moors. That is the case as it appears to the police, and improbable as it is, all other explanations are more improbable still. However, I shall very quickly test the matter when I am once upon the spot, and until then I cannot really see how we can get much further than our present position.”

¶47 It was evening before we reached the little town of Tavistock, which lies, like the boss of a shield, in the middle of the huge circle of Dartmoor. Two gentlemen were awaiting us in the station—the one a tall, fair man with lion-like hair and beard and curiously penetrating light blue eyes; the other a small, alert person, very neat and dapper, in a frock-coat and gaiters, with trim little side-whiskers and an eye-glass. The latter was Colonel Ross, the well-known sportsman; the other, Inspector Gregory, a man who was rapidly making his name in the English detective service.

¶48 “I am delighted that you have come down, Mr. Holmes,” said the Colonel. “The Inspector here has done all that could possibly be suggested, but I wish to leave no stone unturned in trying to avenge poor Straker and in recovering my horse.”

¶49 “Have there been any fresh developments?” asked Holmes.

¶50 “I am sorry to say that we have made very little progress,” said the Inspector. “We have an open carriage outside, and as you would no doubt like to see the place before the light fails, we might talk it over as we drive.”

¶51 A minute later we were all seated in a comfortable landau, and were rattling through the quaint old Devonshire city. Inspector Gregory was full of his case, and poured out a stream of remarks, while Holmes threw in an occasional question or interjection. Colonel Ross leaned back with his arms folded and his hat tilted over his eyes, while I listened with interest to the dialogue of the two detectives. Gregory was formulating his theory, which was almost exactly what Holmes had foretold in the train.

¶52 “The net is drawn pretty close round Fitzroy Simpson,” he remarked, “and I believe myself that he is our man. At the same time I recognise that the evidence is purely circumstantial, and that some new development may upset it.”

¶53 “How about Straker’s knife?”

¶54 “We have quite come to the conclusion that he wounded himself in his fall.”

¶55 “My friend Dr. Watson made that suggestion to me as we came down. If so, it would tell against this man Simpson.”

¶56 “Undoubtedly. He has neither a knife nor any sign of a wound. The evidence against him is certainly very strong. He had a great interest in the disappearance of the favourite. He lies under suspicion of having poisoned the stable-boy, he was undoubtedly out in the storm, he was armed with a heavy stick, and his cravat was found in the dead man’s hand. I really think we have enough to go before a jury.”

¶57 Holmes shook his head. “A clever counsel would tear it all to rags,” said he. “Why should he take the horse out of the stable? If he wished to injure it why could he not do it there? Has a duplicate key been found in his possession? What chemist sold him the powdered opium? Above all, where could he, a stranger to the district, hide a horse, and such a horse as this? What is his own explanation as to the paper which he wished the maid to give to the stable-boy?”

¶58 “He says that it was a ten-pound note. One was found in his purse. But your other difficulties are not so formidable as they seem. He is not a stranger to the district. He has twice lodged at Tavistock in the summer. The opium was probably brought from London. The key, having served its purpose, would be hurled away. The horse may be at the bottom of one of the pits or old mines upon the moor.”

¶59 “What does he say about the cravat?”

¶60 “He acknowledges that it is his, and declares that he had lost it. But a new element has been introduced into the case which may account for his leading the horse from the stable.”

¶61 Holmes pricked up his ears.

¶62 “We have found traces which show that a party of gypsies encamped on Monday night within a mile of the spot where the murder took place. On Tuesday they were gone. Now, presuming that there was some understanding between Simpson and these gypsies, might he not have been leading the horse to them when he was overtaken, and may they not have him now?”

¶63 “It is certainly possible.”

¶64 “The moor is being scoured for these gypsies. I have also examined every stable and out-house in Tavistock, and for a radius of ten miles.”

¶65 “There is another training-stable quite close, I understand?”

¶66 “Yes, and that is a factor which we must certainly not neglect. As Desborough, their horse, was second in the betting, they had an interest in the disappearance of the favourite. Silas Brown, the trainer, is known to have had large bets upon the event, and he was no friend to poor Straker. We have, however, examined the stables, and there is nothing to connect him with the affair.”

¶67 “And nothing to connect this man Simpson with the interests of the Mapleton stables?”

¶68 “Nothing at all.”

