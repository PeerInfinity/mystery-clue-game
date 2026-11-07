<!-- system -->
You are one step of a pipeline that turns a detective story into structured data for a reading game. You see only
what this message gives you. Use only the text given, read as a first-time reader would read it: if you recognise
the story, do not use what you remember of it, its characters' secrets or its ending. Follow the format exactly.
Put your output in one or more ```jsonl fenced blocks, one JSON object per line; anything outside the blocks is
ignored, so keep remarks short.


<!-- user -->
# Step: facts and accounts, one scene

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


## Your task

Write the facts that scene s01 (Breakfast at Baker Street and the train to Dartmoor, ¶1–¶16) tells, and the accounts they travel
in. You have the story up to the end of this scene and the data so far; you have not read further.

- Every fact the scene's paragraphs tell, one per thing told, each with its paragraph and the exact words: where
  everyone and everything is and when, who has or wears what, what is done, what is said (a `says` fact, with what
  it `asserts`), what someone believes, knows or intends, conditions, roles, owners, names, the weekday and the hour
  (on `calendar`, `clock`). A long speech that reports events is a telling of an account (the speaker's), whose
  facts are the events; the speech itself is a `says` fact only where the saying matters (a claim that may be
  false, a theory, an accusation).
- Lines: `{"file": "facts", …}`; a new account `{"file": "accounts", "id", "label", "origin", "how", "facts"}`;
  facts added to an account so far `{"file": "account_add", "id", "facts": [...]}`.
- Provenance: what the narrator sees and hears goes in the narrator's own account (acct.watson); what
  someone tells the narrator goes in that someone's account, with a `tells` fact to the narrator; what reached
  them from someone else goes in the first source's account, carried by a `tells` fact at each step. Never file in
  the narrator's own account a fact the narrator only heard about.
- Leave `truth` out (everything is true by default): the answer key comes at the end of the story. Leave out
  `inferable` facts and the two dates (`given_at`, `inferable_at`): a later step adds them. No `q` or `pick` yet.
- If a fact needs an entity or a time point not listed, add it: `{"file": "entities", …}`, `{"file": "times", …}`.
- A fact so far that this scene corrects: `{"file": "facts", "id", …the fields that change}`.

## The narrators

[{"id":"watson","name":"Watson","kind":"first-person"}]

## Entities

moves: ["train"]
{"id":"watson","kind":"person","name":"Watson"}
{"id":"holmes","kind":"person","name":"Sherlock Holmes"}
{"id":"calendar","kind":"state","name":"The day of the week"}
{"id":"clock","kind":"state","name":"The time of day"}
{"id":"england","kind":"place","name":"England"}
{"id":"holmes_rooms","kind":"place","name":"Holmes and Watson's rooms","within":"england","source":"my companion had rambled about the room"}
{"id":"dartmoor","kind":"place","name":"Dartmoor","within":"england"}
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

## Time points

{"id":"t.before","label":"Before the story"}
{"id":"t.crime","label":"When the favourite vanished and its trainer was murdered","labels":[{"from":4,"label":"When the favourite vanished and its trainer was murdered"},{"from":10,"label":"When Silver Blaze vanished and John Straker was murdered"}],"after":"t.before","para":4,"quote":"the singular disappearance of the favourite for the Wessex Cup, and the tragic murder of its trainer","note":"Not yet dated in the text; it comes before the telegrams that invite Holmes into the case."}
{"id":"t.tue_evening","label":"Tuesday evening","after":"t.crime","para":12,"quote":"On Tuesday evening I received telegrams"}
{"id":"t.wed","label":"The day before, while Holmes brooded","labels":[{"from":4,"label":"The day before, while Holmes brooded"},{"from":13,"label":"Wednesday, while Holmes brooded"}],"after":"t.tue_evening","para":4,"quote":"For a whole day my companion had rambled about the room","note":"Holmes's 'yesterday' (¶14), between Tuesday evening and Thursday morning (¶13). The fresh editions are sent up during this day."}
{"id":"t.watson_reads_papers","label":"When Watson read the Telegraph and the Chronicle","after":"t.crime","para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say","note":"Before the journey; not otherwise dated."}
{"id":"t.simpson_arrest","label":"When Fitzroy Simpson was arrested","after":"t.crime","para":14,"quote":"beyond the arrest of young Fitzroy Simpson nothing had been done","note":"Known to Holmes by Thursday morning."}
{"id":"t.thu_breakfast","label":"One morning, at breakfast","labels":[{"from":1,"label":"One morning, at breakfast"},{"from":13,"label":"Thursday morning, at breakfast"}],"after":["t.wed","t.simpson_arrest","t.watson_reads_papers"],"para":1,"quote":"as we sat down together to our breakfast one morning"}
{"id":"t.paddington","label":"Thursday morning, at Paddington","after":"t.thu_breakfast","para":7,"quote":"which he had procured at Paddington"}
{"id":"t.train_out","label":"Thursday morning, in the train from Paddington","after":"t.paddington","para":7,"quote":"an hour or so later I found myself in the corner of a first-class carriage","note":"Holmes reads the papers, before Reading."}
{"id":"t.train_reading","label":"Thursday morning, the train passing Reading","after":"t.train_out","para":7,"quote":"We had left Reading far behind us"}
{"id":"t.train_beyond_reading","label":"Thursday morning, in the train well past Reading","after":"t.train_reading","para":7,"quote":"We had left Reading far behind us before he thrust the last one of them under the seat","note":"The cigar-case, the speed reckoning (¶8–10) and Holmes's talk of the case (¶10–16)."}

## Accounts so far

(none yet)

## Facts so far

(none yet)

## The reader's notes on this scene (the annotated reading)

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

## The story so far (this scene is ¶1–¶16)

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

