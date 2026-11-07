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
`joins` (a door's two sides, inside first) beside the list:

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

## accounts.json

What one source tells, as a bundle of facts: `{"id", "label", "origin", "how", "facts"?, "parts"?}`. `origin` is who
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

- `label`: the question as a reader would ask it ("Who took the purse?").
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
line already says it in brief. `inferable_at` is the earliest paragraph a careful reader can reach the fact from what
came before, with `from` (facts) or `reasoning` (`{para, text}`, a step in words), and `strength: "likely"` when it
would be held but does not strictly follow. These are written once the whole story is in, by the step that sees it.

## Typed actions (optional, for doors and keys)

A fact may be a typed action: `act` (`lock`, `unlock`, `open`, `close`, `go_through`, `lead_out`, `give`, `ask`,
`drug`, `strike`, `hide`) and `thing` (what it acts on), its agent the fact's `of`. A door's state is `attr: "door"`,
`value` one of `open`, `shut`, `locked`. Write these only where the text makes them matter.


## Your task

Write the facts that scene s02 (On the train, Holmes lays out the facts of the case, ¶17–¶46) tells, and the accounts they travel
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
joins: {"stable_door":["stables","moor"]}
{"id":"watson","kind":"person","name":"Watson"}
{"id":"holmes","kind":"person","name":"Sherlock Holmes"}
{"id":"rooms","kind":"place","name":"Holmes and Watson's room"}
{"id":"news_agent","kind":"person","name":"Their news agent"}
{"id":"england","kind":"place","name":"England"}
{"id":"dartmoor","kind":"place","name":"Dartmoor","within":"england"}
{"id":"kings_pyland","kind":"place","name":"King's Pyland","within":"dartmoor"}
{"id":"paddington","kind":"place","name":"Paddington station","within":"england"}
{"id":"reading","kind":"place","name":"Reading","within":"england"}
{"id":"exeter","kind":"place","name":"Exeter","within":"england"}
{"id":"railway_line","kind":"place","name":"The railway line to Exeter","within":"england"}
{"id":"telegraph_posts","kind":"object","name":"The telegraph posts along the line","within":"railway_line"}
{"id":"train","kind":"object","name":"The train from Paddington"}
{"id":"carriage","kind":"place","name":"The first-class carriage","within":"train"}
{"id":"carriage_seat","kind":"object","name":"The seat of the carriage","within":"carriage"}
{"id":"carriage_window","kind":"object","name":"The carriage window","within":"carriage"}
{"id":"silver_blaze","kind":"animal","name":"Silver Blaze"}
{"id":"wessex_cup","kind":"topic","name":"The Wessex Cup"}
{"id":"straker","kind":"person","name":"John Straker"}
{"id":"ross","kind":"person","name":"Colonel Ross"}
{"id":"gregory","kind":"person","name":"Inspector Gregory"}
{"id":"simpson","kind":"person","name":"Fitzroy Simpson"}
{"id":"pipe","kind":"object","name":"Holmes's pipe"}
{"id":"newspapers","kind":"document","name":"The day's newspapers"}
{"id":"telegraph_paper","kind":"document","name":"The Telegraph"}
{"id":"chronicle_paper","kind":"document","name":"The Chronicle"}
{"id":"field_glass","kind":"object","name":"Watson's field-glass"}
{"id":"travelling_cap","kind":"object","name":"Holmes's travelling-cap"}
{"id":"cigar_case","kind":"object","name":"Holmes's cigar-case"}
{"id":"holmes_watch","kind":"object","name":"Holmes's watch"}
{"id":"ross_telegram","kind":"document","name":"Colonel Ross's telegram to Holmes","source":"I received telegrams from both Colonel Ross, the owner of the horse"}
{"id":"gregory_telegram","kind":"document","name":"Inspector Gregory's telegram to Holmes","source":"and from Inspector Gregory, who is looking after the case, inviting my co-operation"}
{"id":"memoirs","kind":"document","name":"Watson's memoirs"}
{"id":"calendar","kind":"state","name":"The day of the week"}
{"id":"clock","kind":"state","name":"The time of day"}
{"id":"weather","kind":"state","name":"The weather"}
{"id":"cushions","kind":"object","name":"The carriage cushions","within":"carriage"}
{"id":"watson_cigar","kind":"object","name":"Watson's cigar"}
{"id":"isonomy","kind":"animal","name":"Isonomy"}
{"id":"racing_public","kind":"group","name":"The racing public"}
{"id":"turf","kind":"topic","name":"The turf"}
{"id":"stables","kind":"place","name":"The King's Pyland stables","within":"kings_pyland"}
{"id":"stable_door","kind":"object","name":"The stable door","within":"stables"}
{"id":"stable_window","kind":"object","name":"The stable window where meals are handed in","within":"stables"}
{"id":"stable_table","kind":"object","name":"The small table in the stable","within":"stables"}
{"id":"water_tap","kind":"object","name":"The water-tap in the stables","within":"stables"}
{"id":"favourite_stall","kind":"place","name":"Silver Blaze's stall","within":"stables"}
{"id":"harness_room","kind":"place","name":"The harness-room","within":"stables"}
{"id":"stable_loft","kind":"place","name":"The chaff-cutting loft","within":"stables"}
{"id":"stable_lads","kind":"group","name":"The three stable lads"}
{"id":"hunter","kind":"person","name":"Ned Hunter"}
{"id":"other_lads","kind":"group","name":"The two other lads"}
{"id":"kp_horses","kind":"group","name":"The four King's Pyland horses"}
{"id":"bayard","kind":"animal","name":"Bayard"}
{"id":"dog","kind":"animal","name":"The stable dog"}
{"id":"straker_villa","kind":"place","name":"Straker's villa","within":"kings_pyland"}
{"id":"kitchen","kind":"place","name":"The kitchen of Straker's house","within":"straker_villa"}
{"id":"mrs_straker","kind":"person","name":"Mrs. Straker"}
{"id":"baxter","kind":"person","name":"Edith Baxter"}
{"id":"moor","kind":"place","name":"The moor","within":"dartmoor"}
{"id":"path","kind":"place","name":"The path across the moor to the stables","within":"moor"}
{"id":"villas","kind":"place","name":"The cluster of villas to the north","within":"dartmoor"}
{"id":"tavistock_contractor","kind":"person","name":"A Tavistock contractor"}
{"id":"tavistock","kind":"place","name":"Tavistock","within":"dartmoor"}
{"id":"mapleton","kind":"place","name":"The Mapleton stables","within":"dartmoor"}
{"id":"backwater","kind":"person","name":"Lord Backwater"}
{"id":"silas_brown","kind":"person","name":"Silas Brown"}
{"id":"desborough","kind":"animal","name":"Desborough"}
{"id":"gypsies","kind":"group","name":"The gypsies of Dartmoor"}
{"id":"lantern","kind":"object","name":"The maid's lantern"}
{"id":"curried_mutton","kind":"object","name":"Hunter's supper of curried mutton"}
{"id":"opium","kind":"object","name":"Powdered opium"}
{"id":"the_stranger","kind":"person","name":"The stranger at the stables"}
{"id":"tweed_suit","kind":"object","name":"The stranger's grey tweed suit"}
{"id":"cloth_cap","kind":"object","name":"The stranger's cloth cap"}
{"id":"gaiters","kind":"object","name":"The stranger's gaiters"}
{"id":"stranger_stick","kind":"object","name":"The stranger's heavy stick"}
{"id":"paper_packet","kind":"object","name":"The folded white paper packet"}
{"id":"holmes_wire","kind":"document","name":"Holmes's special wire to Dartmoor"}
{"id":"straker_coat","kind":"object","name":"Straker's mackintosh overcoat"}
{"id":"knoll","kind":"place","name":"The knoll near the house","within":"moor"}
{"id":"furze_bush","kind":"object","name":"The furze-bush","within":"moor"}
{"id":"hollow","kind":"place","name":"The hollow where Straker was found","within":"moor"}
{"id":"straker_knife","kind":"object","name":"Straker's small knife"}
{"id":"cravat","kind":"object","name":"The red and black silk cravat"}
{"id":"police","kind":"group","name":"The police"}
{"id":"london","kind":"place","name":"London","within":"england"}
{"id":"betting_book","kind":"document","name":"Simpson's betting-book"}
{"id":"simpson_stick","kind":"object","name":"Simpson's Penang-lawyer"}
{"id":"duplicate_key","kind":"object","name":"A duplicate key to the stable"}
{"id":"bridle","kind":"object","name":"Silver Blaze's bridle"}
{"id":"constabulary","kind":"group","name":"The police on the case","source":"beyond the arrest of young Fitzroy Simpson nothing had been done"}

## Time points

{"id":"t.before","label":"Before the story"}
{"id":"t.crime","label":"The disappearance of Silver Blaze and the murder of John Straker","after":["t.before","t.straker_leaves","t.horse_leaves_stall"],"para":37,"quote":"he had been there at the time of the struggle","note":"The struggle in the hollow: after Straker left the house, before the body was found on Tuesday morning; the horse was there."}
{"id":"t.tue_evening","label":"Tuesday evening: telegrams from Ross and Gregory","day":"Tuesday","clock":"evening","after":"t.crime","para":12,"quote":"On Tuesday evening I received telegrams"}
{"id":"t.wed","label":"Wednesday: Holmes broods and waits for news","day":"Wednesday","after":"t.tue_evening","para":14,"quote":"From hour to hour yesterday I expected to hear that he had been found","note":"Also the 'whole day' of ¶4, when Holmes paces the room and the papers are sent up; and the day Holmes sends his special wire to Dartmoor (¶31)."}
{"id":"t.simpson_arrest","label":"The arrest of Fitzroy Simpson","after":["t.crime","t.gregory_arrives","t.simpson_bets","t.night_storm"],"para":39,"quote":"promptly found and arrested the man upon whom suspicion naturally rested","note":"The day after the stranger's visit ('the evening before', ¶40), so Tuesday; Simpson's statement is made then.","day":"Tuesday"}
{"id":"t.watson_reads","label":"Watson reads the Telegraph and the Chronicle on the case","after":"t.crime","para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say","note":"Some time before the train journey; not otherwise dated."}
{"id":"t.thu_breakfast","label":"Thursday morning, at breakfast in Baker Street","day":"Thursday","clock":"morning","after":["t.wed","t.simpson_arrest"],"para":1,"quote":"as we sat down together to our breakfast one morning","note":"The day is given in ¶13: 'this is Thursday morning'."}
{"id":"t.thu_paddington","label":"Thursday, leaving Paddington by train","day":"Thursday","after":"t.thu_breakfast","para":7,"quote":"the bundle of fresh papers which he had procured at Paddington"}
{"id":"t.thu_past_reading","label":"Thursday, on the train, Reading far behind","day":"Thursday","after":"t.thu_paddington","para":7,"quote":"We had left Reading far behind us"}
{"id":"t.thu_on_line","label":"Thursday, on the train beyond Reading: Holmes times the train and states the case","day":"Thursday","after":["t.thu_past_reading","t.watson_reads"],"para":8,"quote":"Our rate at present is fifty-three and a half miles an hour"}
{"id":"t.straker_jockey","label":"Straker begins riding as Colonel Ross's jockey (about twelve years before)","after":"t.before","para":19,"quote":"He has served the Colonel for five years as jockey and for seven as trainer","note":"Five years as jockey, then seven as trainer, up to the present."}
{"id":"t.straker_trainer","label":"Straker becomes the Colonel's trainer (about seven years before)","after":"t.straker_jockey","para":19,"quote":"for seven as trainer"}
{"id":"t.silver_blaze_foaled","label":"Silver Blaze is foaled (some four years before)","after":"t.before","para":18,"quote":"He is now in his fifth year"}
{"id":"t.villas_built","label":"The villas to the north are built by a Tavistock contractor","after":"t.before","para":19,"quote":"which have been built by a Tavistock contractor"}
{"id":"t.simpson_squanders","label":"Fitzroy Simpson squanders his fortune on the turf","after":"t.before","para":39,"quote":"who had squandered a fortune upon the turf"}
{"id":"t.simpson_bets","label":"Simpson registers bets against the favourite","after":"t.before","para":39,"quote":"bets to the amount of five thousand pounds had been registered by him against the favourite"}
{"id":"t.simpson_arrives","label":"Simpson comes down to Dartmoor for information","after":"t.simpson_squanders","para":40,"quote":"he had come down to Dartmoor in the hope of getting some information"}
{"id":"t.mon_stables_locked","label":"Monday, nine o'clock: the stables are locked up","day":"Monday","clock":"nine","after":["t.before","t.straker_trainer","t.silver_blaze_foaled","t.villas_built"],"para":20,"quote":"the stables were locked up at nine o'clock","note":"After the horses were exercised and watered that evening."}
{"id":"t.mon_lads_supper","label":"Monday evening: two lads at supper in Straker's kitchen","day":"Monday","clock":"evening","after":"t.mon_stables_locked","para":20,"quote":"Two of the lads walked up to the trainer's house, where they had supper in the kitchen","note":"The people at the house eat the same dish as Hunter (¶37)."}
{"id":"t.mon_maid_sets_out","label":"Monday, a few minutes after nine: Edith Baxter carries the supper down","day":"Monday","clock":"a few minutes after nine","after":"t.mon_stables_locked","para":20,"quote":"At a few minutes after nine the maid, Edith Baxter, carried down to the stables his supper"}
{"id":"t.mon_stranger_meets","label":"Monday night: the stranger stops the maid thirty yards from the stables","day":"Monday","clock":"after nine","after":["t.mon_maid_sets_out","t.simpson_arrives"],"para":21,"quote":"Edith Baxter was within thirty yards of the stables, when a man appeared out of the darkness"}
{"id":"t.mon_maid_at_window","label":"Monday night: the maid reaches the stable window","day":"Monday","clock":"after nine","after":"t.mon_stranger_meets","para":25,"quote":"ran past him to the window through which she was accustomed to hand the meals"}
{"id":"t.mon_stranger_at_window","label":"Monday night: the stranger comes up to the window and speaks to Hunter","day":"Monday","clock":"after nine","after":"t.mon_maid_at_window","para":25,"quote":"She had begun to tell him of what had happened, when the stranger came up again"}
{"id":"t.mon_hunter_for_dog","label":"Monday night: Hunter runs for the dog; the maid flees, the stranger leans through the window","day":"Monday","clock":"after nine","after":"t.mon_stranger_at_window","para":29,"quote":"He sprang up and rushed across the stable to unloose the dog"}
{"id":"t.mon_hunter_runs_out","label":"Monday night, a minute later: Hunter locks the door and runs out with the dog; the stranger is gone","day":"Monday","clock":"after nine","after":"t.mon_hunter_for_dog","para":29,"quote":"A minute later, however, when Hunter rushed out with the hound he was gone"}
{"id":"t.mon_maid_home","label":"Monday night: the maid back at the house","day":"Monday","clock":"after nine","after":"t.mon_hunter_for_dog","para":29,"quote":"The girl fled away to the house"}
{"id":"t.hunter_eats_supper","label":"Monday night: Hunter eats his curried mutton","day":"Monday","after":"t.mon_maid_at_window","para":37,"quote":"the remains of his supper left by the stable-lad","note":"Not ordered against the stranger's visit or Hunter's message."}
{"id":"t.mon_lads_return","label":"Monday night: the other lads return; Hunter sends a message to Straker","day":"Monday","after":["t.mon_hunter_runs_out","t.mon_lads_supper"],"para":32,"quote":"Hunter waited until his fellow-grooms had returned, when he sent a message to the trainer"}
{"id":"t.night_storm","label":"Monday night: the storm","day":"Monday night","after":"t.mon_stables_locked","para":40,"quote":"he had been out in the storm of the night before","note":"Rain heard at one in the morning (¶32); not otherwise bounded."}
{"id":"t.tue_one_am","label":"Tuesday, one in the morning: Mrs. Straker finds her husband dressing","day":"Tuesday","clock":"one in the morning","after":"t.mon_lads_return","para":32,"quote":"Mrs. Straker, waking at one in the morning, found that he was dressing"}
{"id":"t.straker_leaves","label":"Tuesday, after one: Straker leaves the house in his mackintosh","day":"Tuesday","clock":"after one","after":"t.tue_one_am","para":32,"quote":"he pulled on his large mackintosh and left the house"}
{"id":"t.horse_leaves_stall","label":"Monday–Tuesday night: Silver Blaze is taken from his stall","after":"t.mon_hunter_runs_out","para":33,"quote":"the favourite's stall was empty","note":"Hunter locked the door when he ran out (¶31); the door was found open at seven. The police theory (¶46) puts Simpson here."}
{"id":"t.tue_seven","label":"Tuesday, seven in the morning: Mrs. Straker wakes; her husband is not back","day":"Tuesday","clock":"seven","after":"t.straker_leaves","para":33,"quote":"Mrs. Straker awoke at seven in the morning"}
{"id":"t.tue_at_stables","label":"Tuesday morning: Mrs. Straker and the maid at the stables; door open, Hunter drugged, stall empty","day":"Tuesday","clock":"morning","after":["t.tue_seven","t.horse_leaves_stall","t.hunter_eats_supper"],"para":33,"quote":"set off for the stables. The door was open"}
{"id":"t.tue_knoll","label":"Tuesday morning: the search party on the knoll","day":"Tuesday","clock":"morning","after":"t.tue_at_stables","para":34,"quote":"on ascending the knoll near the house"}
{"id":"t.tue_hollow","label":"Tuesday morning: the overcoat on the furze-bush and Straker's body in the hollow","day":"Tuesday","clock":"morning","after":["t.tue_knoll","t.crime"],"para":35,"quote":"at the bottom of this was found the dead body of the unfortunate trainer"}
{"id":"t.hunter_recovers","label":"Hunter recovers from his stupor","after":"t.tue_at_stables","para":36,"quote":"Hunter, on recovering from his stupor"}
{"id":"t.analysis","label":"The analysis of Hunter's supper","after":"t.tue_at_stables","para":37,"quote":"an analysis has shown"}
{"id":"t.reward","label":"A large reward is offered for the horse","after":"t.tue_hollow","para":37,"quote":"although a large reward has been offered"}
{"id":"t.gregory_arrives","label":"Inspector Gregory arrives on the case","after":"t.tue_hollow","para":39,"quote":"On his arrival he promptly found and arrested the man"}
{"id":"t.race","label":"Next Tuesday: the Wessex Cup is run","day":"Tuesday","after":"t.thu_on_line","para":18,"quote":"at the fall of the flag next Tuesday"}

## Accounts so far

{"id":"acct.watson","label":"What Watson sees and hears himself","origin":"watson","how":"saw","facts":["f.holmes_loc_breakfast","f.watson_loc_breakfast","f.clock_morning","f.holmes_says_must_go","f.holmes_intends_dartmoor","f.case_talk_of_england","f.holmes_loc_wed","f.holmes_broods","f.holmes_pipe","f.holmes_deaf","f.news_agent_sends","f.holmes_tosses_papers","f.papers_in_corner","f.watson_knows_brooding","f.holmes_announces","f.watson_expected","f.watson_offers","f.holmes_says_unique","f.holmes_intends_train","f.holmes_asks_glass","f.watson_owns_glass","f.holmes_buys_papers","f.holmes_at_paddington","f.watson_in_carriage","f.holmes_in_carriage","f.train_on_line","f.train_to_exeter","f.holmes_cap","f.holmes_reads_papers","f.train_past_reading","f.papers_under_seat","f.holmes_offers_cigars","f.holmes_looks_window","f.holmes_owns_watch","f.holmes_says_speed","f.watson_says_posts","f.holmes_says_telegraph_posts","f.holmes_asks_case","f.watson_read_papers","f.telegraph_tells_watson","f.chronicle_tells_watson","f.holmes_says_method","f.holmes_says_surmise","f.holmes_tells_telegrams","f.cal_thu","f.cal_wed","f.watson_asks_why","f.holmes_says_blunder","f.watson_memoirs","f.holmes_believed_not_concealed","f.holmes_expected_found","f.holmes_decides_act","f.holmes_says_not_wasted","f.holmes_tells_wait","f.watson_asks_theory","f.holmes_says_grip","f.holmes_intends_enumerate"]}
{"id":"acct.press","label":"What the newspapers report of the case","origin":null,"how":"report","facts":["f.horse_favourite","f.horse_disappears","f.straker_trainer","f.straker_murdered","f.name_straker","f.name_silver_blaze"]}
{"id":"acct.holmes","label":"Holmes's account of the telegrams and his day of waiting","origin":"holmes","how":"own","facts":["f.cal_tue","f.clock_tue_evening","f.holmes_gets_telegrams","f.ross_telegraphs","f.gregory_telegraphs","f.ross_owner","f.gregory_role","f.horse_reputed","f.north_dartmoor_sparse","f.horse_not_found","f.simpson_arrested","f.simpson_young","f.nothing_else_done"]}

## Facts so far

{"id":"f.holmes_loc_breakfast","of":"holmes","attr":"location","value":"rooms","detail":"at breakfast","time":{"at":"t.thu_breakfast"},"para":1,"quote":"as we sat down together to our breakfast one morning"}
{"id":"f.watson_loc_breakfast","of":"watson","attr":"location","value":"rooms","detail":"at breakfast","time":{"at":"t.thu_breakfast"},"para":1,"quote":"as we sat down together to our breakfast one morning"}
{"id":"f.clock_morning","of":"clock","attr":"hour","value":"morning","time":{"at":"t.thu_breakfast"},"para":1,"quote":"our breakfast one morning"}
{"id":"f.holmes_says_must_go","of":"holmes","attr":"says","value":"he shall have to go","to":"watson","time":{"at":"t.thu_breakfast"},"para":1,"quote":"I am afraid, Watson, that I shall have to go","asserts":[{"of":"holmes","attr":"intends","value":"to go away on the case"}]}
{"id":"f.holmes_intends_dartmoor","of":"holmes","attr":"intends","value":"to go to King's Pyland, on Dartmoor","time":{"at":"t.thu_breakfast"},"para":3,"quote":"To Dartmoor; to King’s Pyland."}
{"id":"f.case_talk_of_england","of":"england","attr":"condition","value":"the extraordinary case is the one topic of conversation throughout England","time":{"at":"t.thu_breakfast"},"para":4,"quote":"which was the one topic of conversation through the length and breadth of England"}
{"id":"f.holmes_loc_wed","of":"holmes","attr":"location","value":"rooms","detail":"rambling about the room","time":{"at":"t.wed"},"para":4,"quote":"For a whole day my companion had rambled about the room"}
{"id":"f.holmes_broods","of":"holmes","attr":"action","value":"rambles about the room with his chin on his chest and brows knitted, deaf to Watson's questions","time":{"at":"t.wed"},"para":4,"quote":"with his chin upon his chest and his brows knitted"}
{"id":"f.holmes_pipe","of":"holmes","attr":"carrying","value":"pipe","detail":"charging and recharging it with the strongest black tobacco","time":{"at":"t.wed"},"para":4,"quote":"charging and recharging his pipe with the strongest black tobacco"}
{"id":"f.holmes_deaf","of":"holmes","attr":"condition","value":"deaf to any of Watson's questions or remarks","time":{"at":"t.wed"},"para":4,"quote":"absolutely deaf to any of my questions or remarks"}
{"id":"f.news_agent_sends","of":"news_agent","attr":"action","value":"sends up fresh editions of every paper","time":{"at":"t.wed"},"para":4,"quote":"Fresh editions of every paper had been sent up by our news agent"}
{"id":"f.holmes_tosses_papers","of":"holmes","attr":"action","value":"glances over the papers and tosses them into a corner","time":{"at":"t.wed"},"para":4,"quote":"only to be glanced over and tossed down into a corner"}
{"id":"f.papers_in_corner","of":"newspapers","attr":"location","value":"rooms","detail":"tossed into a corner","time":{"from":"t.wed"},"para":4,"quote":"tossed down into a corner"}
{"id":"f.watson_knows_brooding","of":"watson","attr":"knows","value":"Holmes is brooding over the disappearance of the Wessex Cup favourite and the murder of its trainer","time":{"at":"t.wed"},"para":4,"quote":"I knew perfectly well what it was over which he was brooding"}
{"id":"f.horse_favourite","of":"silver_blaze","attr":"role","value":"favourite for the Wessex Cup","time":{"at":"t.crime"},"para":4,"quote":"the favourite for the Wessex Cup"}
{"id":"f.horse_disappears","of":"silver_blaze","attr":"condition","value":"disappeared","time":{"from":"t.crime"},"para":4,"quote":"the singular disappearance of the favourite for the Wessex Cup"}
{"id":"f.straker_trainer","of":"straker","attr":"role","value":"trainer of the favourite for the Wessex Cup","time":{"at":"t.crime"},"para":4,"quote":"the tragic murder of its trainer"}
{"id":"f.straker_murdered","of":"straker","attr":"condition","value":"murdered","time":{"from":"t.crime"},"para":4,"quote":"the tragic murder of its trainer"}
{"id":"f.holmes_announces","of":"holmes","attr":"intends","value":"to set out for the scene of the drama","time":{"at":"t.thu_breakfast"},"para":4,"quote":"he suddenly announced his intention of setting out for the scene of the drama"}
{"id":"f.watson_expected","of":"watson","attr":"believes","value":"Holmes would take up the case; Watson expected and hoped for it","time":{"at":"t.thu_breakfast"},"para":4,"quote":"it was only what I had both expected and hoped for"}
{"id":"f.watson_offers","of":"watson","attr":"says","value":"he would be happy to go down with Holmes","to":"holmes","time":{"at":"t.thu_breakfast"},"para":5,"quote":"I should be most happy to go down with you if I should not be in the way"}
{"id":"f.holmes_says_unique","of":"holmes","attr":"says","value":"there are points about the case which promise to make it unique","to":"watson","time":{"at":"t.thu_breakfast"},"para":6,"quote":"there are points about the case which promise to make it an absolutely unique one","asserts":[{"of":"holmes","attr":"believes","value":"points of the case make it unique"}]}
{"id":"f.holmes_intends_train","of":"holmes","attr":"intends","value":"to catch the train at Paddington and explain the matter on the journey","time":{"at":"t.thu_breakfast"},"para":6,"quote":"We have, I think, just time to catch our train at Paddington, and I will go further into the matter upon our journey"}
{"id":"f.holmes_asks_glass","of":"holmes","attr":"action","act":"ask","thing":"field_glass","value":"asks Watson to bring his field-glass","time":{"at":"t.thu_breakfast"},"para":6,"quote":"You would oblige me by bringing with you your very excellent field-glass."}
{"id":"f.watson_owns_glass","of":"field_glass","attr":"owner","value":"watson","basis":"implied","time":{"at":"t.thu_breakfast"},"para":6,"quote":"your very excellent field-glass"}
{"id":"f.holmes_at_paddington","of":"holmes","attr":"location","value":"paddington","time":{"at":"t.thu_paddington"},"para":7,"quote":"which he had procured at Paddington"}
{"id":"f.holmes_buys_papers","of":"holmes","attr":"action","value":"procures a bundle of fresh papers","time":{"at":"t.thu_paddington"},"para":7,"quote":"the bundle of fresh papers which he had procured at Paddington"}
{"id":"f.watson_in_carriage","of":"watson","attr":"location","value":"carriage","detail":"in the corner","time":{"from":"t.thu_paddington","to":"t.thu_on_line"},"para":7,"quote":"I found myself in the corner of a first-class carriage"}
{"id":"f.holmes_in_carriage","of":"holmes","attr":"location","value":"carriage","time":{"from":"t.thu_paddington","to":"t.thu_on_line"},"para":7,"quote":"while Sherlock Holmes, with his sharp, eager face"}
{"id":"f.train_on_line","of":"train","attr":"location","value":"railway_line","detail":"flying along en route for Exeter","time":{"from":"t.thu_paddington","to":"t.thu_on_line"},"para":7,"quote":"flying along en route for Exeter"}
{"id":"f.train_to_exeter","of":"train","attr":"intends","value":"bound for Exeter","time":{"from":"t.thu_paddington"},"para":7,"quote":"en route for Exeter"}
{"id":"f.holmes_cap","of":"holmes","attr":"wearing","value":"travelling_cap","detail":"ear-flapped","time":{"from":"t.thu_paddington","to":"t.thu_past_reading"},"para":7,"quote":"framed in his ear-flapped travelling-cap"}
{"id":"f.holmes_reads_papers","of":"holmes","attr":"action","value":"dips rapidly into the fresh papers","time":{"from":"t.thu_paddington","to":"t.thu_past_reading"},"para":7,"quote":"dipped rapidly into the bundle of fresh papers"}
{"id":"f.train_past_reading","of":"train","attr":"location","value":"reading","detail":"passed through, now far behind","time":{"after":"t.thu_paddington","before":"t.thu_past_reading"},"para":7,"quote":"We had left Reading far behind us"}
{"id":"f.papers_under_seat","of":"newspapers","attr":"location","value":"carriage_seat","detail":"thrust under the seat","time":{"from":"t.thu_past_reading"},"para":7,"quote":"he thrust the last one of them under the seat"}
{"id":"f.holmes_offers_cigars","of":"holmes","attr":"action","act":"give","thing":"cigar_case","value":"offers Watson his cigar-case","time":{"at":"t.thu_past_reading"},"para":7,"quote":"offered me his cigar-case"}
{"id":"f.holmes_looks_window","of":"holmes","attr":"action","value":"looks out the window and glances at his watch","time":{"at":"t.thu_on_line"},"para":8,"quote":"looking out the window and glancing at his watch"}
{"id":"f.holmes_owns_watch","of":"holmes_watch","attr":"owner","value":"holmes","basis":"implied","time":{"at":"t.thu_on_line"},"para":8,"quote":"glancing at his watch"}
{"id":"f.holmes_says_speed","of":"holmes","attr":"says","value":"the train is going at fifty-three and a half miles an hour","to":"watson","time":{"at":"t.thu_on_line"},"para":8,"quote":"Our rate at present is fifty-three and a half miles an hour.","asserts":[{"of":"train","attr":"speed","value":"fifty-three and a half miles an hour","time":{"at":"t.thu_on_line"}}]}
{"id":"f.watson_says_posts","of":"watson","attr":"says","value":"he has not observed the quarter-mile posts","to":"holmes","time":{"at":"t.thu_on_line"},"para":9,"quote":"I have not observed the quarter-mile posts"}
{"id":"f.holmes_says_telegraph_posts","of":"holmes","attr":"says","value":"he has not observed the quarter-mile posts either, but the telegraph posts on this line are sixty yards apart","to":"watson","time":{"at":"t.thu_on_line"},"para":10,"quote":"the telegraph posts upon this line are sixty yards apart","asserts":[{"of":"telegraph_posts","attr":"condition","value":"sixty yards apart"}]}
{"id":"f.holmes_asks_case","of":"holmes","attr":"action","act":"ask","value":"asks Watson whether he has looked into the murder of John Straker and the disappearance of Silver Blaze","time":{"at":"t.thu_on_line"},"para":10,"quote":"I presume that you have looked into this matter"}
{"id":"f.name_straker","of":"straker","attr":"name","value":"John Straker","time":{"at":"t.crime"},"para":10,"quote":"the murder of John Straker"}
{"id":"f.name_silver_blaze","of":"silver_blaze","attr":"name","value":"Silver Blaze","time":{"at":"t.crime"},"para":10,"quote":"the disappearance of Silver Blaze"}
{"id":"f.watson_read_papers","of":"watson","attr":"action","value":"has read what the Telegraph and the Chronicle say on the case","time":{"at":"t.watson_reads"},"para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say"}
{"id":"f.telegraph_tells_watson","of":"telegraph_paper","attr":"tells","value":"acct.press","to":"watson","how":"newspaper","time":{"at":"t.watson_reads"},"para":11,"quote":"what the _Telegraph_"}
{"id":"f.chronicle_tells_watson","of":"chronicle_paper","attr":"tells","value":"acct.press","to":"watson","how":"newspaper","time":{"at":"t.watson_reads"},"para":11,"quote":"the _Chronicle_ have to say"}
{"id":"f.holmes_says_method","of":"holmes","attr":"says","value":"the case calls for sifting details rather than acquiring fresh evidence, and the facts must be detached from the theorising of reporters","to":"watson","time":{"at":"t.thu_on_line"},"para":12,"quote":"the art of the reasoner should be used rather for the sifting of details than for the acquiring of fresh evidence","asserts":[{"of":"holmes","attr":"believes","value":"the answer lies in sifting the known facts"}]}
{"id":"f.holmes_says_surmise","of":"holmes","attr":"believes","value":"the case is overlaid by a plethora of surmise, conjecture and hypothesis from theorists and reporters","time":{"at":"t.thu_on_line"},"para":12,"quote":"we are suffering from a plethora of surmise, conjecture, and hypothesis"}
{"id":"f.cal_tue","of":"calendar","attr":"weekday","value":"Tuesday","time":{"at":"t.tue_evening"},"para":12,"quote":"On Tuesday evening"}
{"id":"f.clock_tue_evening","of":"clock","attr":"hour","value":"evening","time":{"at":"t.tue_evening"},"para":12,"quote":"On Tuesday evening"}
{"id":"f.holmes_gets_telegrams","of":"holmes","attr":"action","value":"receives telegrams from Colonel Ross and Inspector Gregory inviting his co-operation","time":{"at":"t.tue_evening"},"para":12,"quote":"On Tuesday evening I received telegrams from both Colonel Ross"}
{"id":"f.ross_telegraphs","of":"ross","attr":"action","value":"telegraphs Holmes inviting his co-operation","time":{"at":"t.tue_evening"},"para":12,"quote":"telegrams from both Colonel Ross, the owner of the horse"}
{"id":"f.gregory_telegraphs","of":"gregory","attr":"action","value":"telegraphs Holmes inviting his co-operation","time":{"at":"t.tue_evening"},"para":12,"quote":"and from Inspector Gregory, who is looking after the case, inviting my co-operation"}
{"id":"f.ross_owner","of":"silver_blaze","attr":"owner","value":"ross","time":{"at":"t.tue_evening"},"para":12,"quote":"Colonel Ross, the owner of the horse"}
{"id":"f.gregory_role","of":"gregory","attr":"role","value":"police inspector looking after the case","time":{"at":"t.tue_evening"},"para":12,"quote":"Inspector Gregory, who is looking after the case"}
{"id":"f.holmes_tells_telegrams","of":"holmes","attr":"tells","value":"acct.holmes","to":"watson","how":"told","time":{"at":"t.thu_on_line"},"para":12,"quote":"On Tuesday evening I received telegrams"}
{"id":"f.cal_thu","of":"calendar","attr":"weekday","value":"Thursday","time":{"from":"t.thu_breakfast","to":"t.thu_on_line"},"para":13,"quote":"And this is Thursday morning."}
{"id":"f.cal_wed","of":"calendar","attr":"weekday","value":"Wednesday","basis":"implied","time":{"at":"t.wed"},"para":13,"quote":"Why didn’t you go down yesterday?"}
{"id":"f.watson_asks_why","of":"watson","attr":"action","act":"ask","value":"asks Holmes why he did not go down yesterday","time":{"at":"t.thu_on_line"},"para":13,"quote":"Why didn’t you go down yesterday?"}
{"id":"f.holmes_says_blunder","of":"holmes","attr":"says","value":"he made a blunder in not going down on Wednesday","to":"watson","time":{"at":"t.thu_on_line"},"para":14,"quote":"Because I made a blunder, my dear Watson"}
{"id":"f.watson_memoirs","of":"memoirs","attr":"owner","value":"watson","basis":"implied","time":{"at":"t.thu_on_line"},"para":14,"quote":"who only knew me through your memoirs"}
{"id":"f.horse_reputed","of":"silver_blaze","attr":"reputed","value":"the most remarkable horse in England","time":{"at":"t.wed"},"para":14,"quote":"the most remarkable horse in England"}
{"id":"f.north_dartmoor_sparse","of":"dartmoor","attr":"condition","value":"the north of Dartmoor is sparsely inhabited","time":{"at":"t.wed"},"para":14,"quote":"so sparsely inhabited a place as the north of Dartmoor"}
{"id":"f.holmes_believed_not_concealed","of":"holmes","attr":"believes","value":"the horse could not long remain concealed on the moor","time":{"at":"t.wed"},"para":14,"quote":"I could not believe it possible that the most remarkable horse in England could long remain concealed","asserts":[{"of":"silver_blaze","attr":"condition","value":"concealed","neg":true,"time":{"at":"t.wed"}}]}
{"id":"f.holmes_expected_found","of":"holmes","attr":"believes","value":"the horse would soon be found, and its abductor would be Straker's murderer","time":{"at":"t.wed"},"para":14,"quote":"I expected to hear that he had been found, and that his abductor was the murderer of John Straker"}
{"id":"f.horse_not_found","of":"silver_blaze","attr":"condition","value":"found","neg":true,"time":{"at":"t.thu_breakfast"},"para":14,"quote":"When, however, another morning had come"}
{"id":"f.simpson_arrested","of":"simpson","attr":"condition","value":"arrested","time":{"from":"t.simpson_arrest"},"para":14,"quote":"the arrest of young Fitzroy Simpson"}
{"id":"f.simpson_young","of":"simpson","attr":"condition","value":"young","time":{"at":"t.simpson_arrest"},"para":14,"quote":"young Fitzroy Simpson"}
{"id":"f.nothing_else_done","of":"constabulary","attr":"action","value":"nothing done beyond the arrest of Simpson","time":{"at":"t.thu_breakfast"},"para":14,"quote":"beyond the arrest of young Fitzroy Simpson nothing had been done"}
{"id":"f.holmes_decides_act","of":"holmes","attr":"intends","value":"to take action on the case","time":{"at":"t.thu_breakfast"},"para":14,"quote":"I felt that it was time for me to take action"}
{"id":"f.holmes_says_not_wasted","of":"holmes","attr":"says","value":"in some ways Wednesday has not been wasted","to":"watson","time":{"at":"t.thu_on_line"},"para":14,"quote":"Yet in some ways I feel that yesterday has not been wasted."}
{"id":"f.holmes_tells_wait","of":"holmes","attr":"tells","value":"acct.holmes","to":"watson","how":"told","time":{"at":"t.thu_on_line"},"para":14,"quote":"I found that beyond the arrest of young Fitzroy Simpson nothing had been done"}
{"id":"f.watson_asks_theory","of":"watson","attr":"action","act":"ask","value":"asks whether Holmes has formed a theory","time":{"at":"t.thu_on_line"},"para":15,"quote":"You have formed a theory, then?"}
{"id":"f.holmes_says_grip","of":"holmes","attr":"says","value":"he has a grip of the essential facts of the case","to":"watson","time":{"at":"t.thu_on_line"},"para":16,"quote":"At least I have got a grip of the essential facts of the case."}
{"id":"f.holmes_intends_enumerate","of":"holmes","attr":"intends","value":"to enumerate the facts of the case to Watson","time":{"at":"t.thu_on_line"},"para":16,"quote":"I shall enumerate them to you"}

## The reader's notes on this scene (the annotated reading)

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

## The story so far (this scene is ¶17–¶46)

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

