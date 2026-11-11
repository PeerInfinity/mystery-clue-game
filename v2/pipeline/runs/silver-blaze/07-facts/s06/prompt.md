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

Write the facts that scene s06 (Following tracks across the moor to Mapleton and a talk with Silas Brown, ¶113–¶143) tells, and the accounts they travel
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

moves: ["train","landau"]
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
{"id":"tavistock_station","kind":"place","name":"Tavistock station","within":"tavistock"}
{"id":"landau","kind":"object","name":"The landau"}
{"id":"detective_service","kind":"group","name":"The English detective service"}
{"id":"ross_frock_coat","kind":"object","name":"Colonel Ross's frock-coat"}
{"id":"ross_gaiters","kind":"object","name":"Colonel Ross's gaiters"}
{"id":"ross_eyeglass","kind":"object","name":"Colonel Ross's eye-glass"}
{"id":"ross_hat","kind":"object","name":"Colonel Ross's hat"}
{"id":"ten_pound_note","kind":"object","name":"The ten-pound note in Simpson's purse"}
{"id":"simpson_purse","kind":"object","name":"Simpson's purse"}
{"id":"the_chemist","kind":"person","name":"The chemist who sold the opium"}
{"id":"moor_pits","kind":"place","name":"The pits and old mines upon the moor","within":"moor"}
{"id":"gypsy_party","kind":"group","name":"The party of gypsies camped near the spot"}
{"id":"gypsy_camp","kind":"place","name":"The gypsies' camp within a mile of the murder","within":"moor","source":"a party of gypsies encamped on Monday night within a mile of the spot where the murder took place"}
{"id":"tavistock_outhouses","kind":"place","name":"The stables and out-houses in and around Tavistock","within":"dartmoor","source":"I have also examined every stable and out-house in Tavistock, and for a radius of ten miles."}
{"id":"driver","kind":"person","name":"The landau's driver"}
{"id":"road","kind":"place","name":"The road by Straker's villa","within":"kings_pyland"}
{"id":"paddock","kind":"place","name":"The paddock between the villa and the out-building","within":"kings_pyland"}
{"id":"upstairs_room","kind":"place","name":"The upstairs room where Straker's body lies","within":"straker_villa","source":"Yes; he lies upstairs."}
{"id":"sitting_room","kind":"place","name":"The sitting-room of Straker's villa","within":"straker_villa"}
{"id":"passage","kind":"place","name":"The passage of Straker's villa","within":"straker_villa"}
{"id":"straker_bedroom","kind":"place","name":"The Strakers' bedroom","within":"straker_villa"}
{"id":"dressing_table","kind":"object","name":"The dressing-table","within":"straker_bedroom"}
{"id":"central_table","kind":"object","name":"The central table in the sitting-room","within":"sitting_room"}
{"id":"tin_box","kind":"object","name":"The Inspector's square tin box","within":"sitting_room"}
{"id":"vestas","kind":"object","name":"Straker's box of vestas"}
{"id":"candle","kind":"object","name":"Straker's two inches of tallow candle"}
{"id":"briar_pipe","kind":"object","name":"Straker's briar-root pipe"}
{"id":"tobacco_pouch","kind":"object","name":"Straker's seal-skin tobacco pouch"}
{"id":"silver_watch","kind":"object","name":"Straker's silver watch"}
{"id":"sovereigns","kind":"object","name":"Five sovereigns in gold"}
{"id":"pencil_case","kind":"object","name":"Straker's aluminium pencil-case"}
{"id":"pocket_papers","kind":"document","name":"The papers in Straker's pockets"}
{"id":"hay_accounts","kind":"document","name":"The receipted hay-dealers' accounts"}
{"id":"ross_letter","kind":"document","name":"Colonel Ross's letter of instructions"}
{"id":"milliner_account","kind":"document","name":"The milliner's account made out to William Derbyshire"}
{"id":"billed_costume","kind":"object","name":"The costume on the milliner's account","source":"Twenty-two guineas is rather heavy for a single costume."}
{"id":"cork_disk","kind":"object","name":"The disk of cork guarding the knife's tip"}
{"id":"weiss_co","kind":"group","name":"Weiss & Co., London"}
{"id":"lesurier","kind":"person","name":"Madame Lesurier"}
{"id":"bond_street","kind":"place","name":"Bond Street","within":"london"}
{"id":"derbyshire","kind":"person","name":"William Derbyshire"}
{"id":"madam_derbyshire","kind":"person","name":"Madam Derbyshire"}
{"id":"plymouth","kind":"place","name":"Plymouth","within":"england"}
{"id":"dove_dress","kind":"object","name":"The dove-coloured silk costume Holmes describes"}
{"id":"matting","kind":"object","name":"The piece of matting at the side of the hollow","within":"hollow"}
{"id":"inspector_bag","kind":"object","name":"The Inspector's bag"}
{"id":"straker_boot","kind":"object","name":"One of Straker's boots"}
{"id":"simpson_shoe","kind":"object","name":"One of Fitzroy Simpson's shoes"}
{"id":"horseshoe","kind":"object","name":"A cast horseshoe of Silver Blaze"}
{"id":"wax_vesta","kind":"object","name":"The half-burned wax vesta in the mud","within":"hollow"}
{"id":"hollow_mud","kind":"object","name":"The trampled mud of the hollow","within":"hollow"}
{"id":"hollow_rim","kind":"place","name":"The rim of the hollow","within":"moor"}
{"id":"ross_watch","kind":"object","name":"Colonel Ross's watch"}
{"id":"cup_entries","kind":"document","name":"The entries for the Wessex Cup"}
{"id":"wet_hollow","kind":"place","name":"The long hollow towards Mapleton","within":"moor"}
{"id":"horse_tracks","kind":"object","name":"The horse's tracks across the moor","within":"moor"}
{"id":"man_tracks","kind":"object","name":"The man's track beside the horse's","within":"moor"}
{"id":"asphalt_paving","kind":"place","name":"The asphalt paving up to the Mapleton gates","within":"mapleton"}
{"id":"mapleton_gates","kind":"object","name":"The gates of the Mapleton stables","within":"mapleton"}
{"id":"dawson","kind":"person","name":"Dawson, the Mapleton groom"}
{"id":"hunting_crop","kind":"object","name":"Silas Brown's hunting-crop"}
{"id":"half_crown","kind":"object","name":"Holmes's half-crown"}
{"id":"brown_parlour","kind":"place","name":"Silas Brown's parlour","within":"mapleton"}
{"id":"constabulary","kind":"group","name":"The police on the case","source":"beyond the arrest of young Fitzroy Simpson nothing had been done"}
{"id":"household","kind":"group","name":"The people at Straker's house","source":"the people at the house partook of the same dish on the same night"}
{"id":"search_party","kind":"group","name":"The two lads and the two women who search the moor","source":"the two lads and the two women ran out in search of the absentees"}
{"id":"out_building","kind":"place","name":"The long grey-tiled out-building across the paddock","within":"kings_pyland"}

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
{"id":"t.tue_hollow","label":"Tuesday morning: the overcoat on the furze-bush and Straker's body in the hollow","day":"Tuesday","clock":"morning","after":["t.tue_knoll","t.crime","t.coat_placed"],"para":35,"quote":"at the bottom of this was found the dead body of the unfortunate trainer"}
{"id":"t.hunter_recovers","label":"Hunter recovers from his stupor","after":"t.tue_at_stables","para":36,"quote":"Hunter, on recovering from his stupor"}
{"id":"t.analysis","label":"The analysis of Hunter's supper","after":"t.tue_at_stables","para":37,"quote":"an analysis has shown"}
{"id":"t.reward","label":"A large reward is offered for the horse","after":"t.tue_hollow","para":37,"quote":"although a large reward has been offered"}
{"id":"t.gregory_arrives","label":"Inspector Gregory arrives on the case","after":"t.tue_hollow","para":39,"quote":"On his arrival he promptly found and arrested the man"}
{"id":"t.race","label":"Next Tuesday: the Wessex Cup is run","day":"Tuesday","after":"t.thu_on_line","para":18,"quote":"at the fall of the flag next Tuesday"}
{"id":"t.thu_tavistock","label":"Thursday evening: arrival at Tavistock station, met by Colonel Ross and Inspector Gregory","day":"Thursday","clock":"evening","after":["t.thu_on_line","t.gregory_searches","t.mapleton_examined","t.gypsies_gone"],"para":47,"quote":"It was evening before we reached the little town of Tavistock"}
{"id":"t.thu_landau","label":"Thursday evening, a minute later: the drive in the landau through Tavistock and out towards King's Pyland","day":"Thursday","clock":"evening","after":"t.thu_tavistock","para":51,"quote":"A minute later we were all seated in a comfortable landau","note":"The talk of ¶51–68 happens during this drive, before the light fails."}
{"id":"t.simpson_lodged","label":"Simpson twice lodges at Tavistock in the summer","after":"t.before","para":58,"quote":"He has twice lodged at Tavistock in the summer","note":"Earlier summers; not ordered against his coming down this time."}
{"id":"t.opium_bought","label":"The powdered opium is obtained (Gregory guesses in London)","after":"t.before","para":58,"quote":"The opium was probably brought from London","note":"Gregory's guess; it would come before the opium reached Hunter's supper, but the story does not fix when or by whom."}
{"id":"t.key_thrown","label":"The duplicate key is thrown away (Gregory's guess)","after":"t.horse_leaves_stall","para":58,"quote":"The key, having served its purpose, would be hurled away","note":"Part of the police theory; the story has not shown that any such key exists."}
{"id":"t.cravat_lost","label":"Simpson loses his cravat (his own claim)","after":"t.before","para":60,"quote":"declares that he had lost it","note":"Simpson's claim. The maid saw the stranger wearing it on Monday evening (¶35), but the story does not say when he says he lost it."}
{"id":"t.gypsies_camp","label":"Monday night: a party of gypsies camped within a mile of the spot of the murder","day":"Monday","clock":"night","after":"t.before","para":62,"quote":"a party of gypsies encamped on Monday night within a mile of the spot"}
{"id":"t.gypsies_gone","label":"Tuesday: the gypsies are gone","day":"Tuesday","after":"t.gypsies_camp","para":62,"quote":"On Tuesday they were gone"}
{"id":"t.gregory_searches","label":"Gregory examines every stable and out-house in and around Tavistock","after":"t.gregory_arrives","para":64,"quote":"I have also examined every stable and out-house in Tavistock"}
{"id":"t.mapleton_examined","label":"The police examine the Mapleton stables","after":"t.gregory_arrives","para":66,"quote":"We have, however, examined the stables"}
{"id":"t.brown_bets","label":"Silas Brown places large bets on the Wessex Cup","after":"t.before","para":66,"quote":"is known to have had large bets upon the event"}
{"id":"t.straker_takes_knife","label":"Monday–Tuesday night: Straker picks up the knife from the dressing-table as he leaves the room (his wife's account)","day":"Tuesday","clock":"after one","after":"t.tue_one_am","para":82,"quote":"he had picked it up as he left the room","note":"Just before he leaves the house (t.straker_leaves); the text does not order it more finely."}
{"id":"t.straker_brought_back","label":"Straker's body is brought back to his villa","after":"t.tue_hollow","para":72,"quote":"Straker was brought back here, I presume?"}
{"id":"t.inventory","label":"The Inspector takes the things in Straker's pockets and puts them in a tin box","after":"t.tue_hollow","para":77,"quote":"I have the things themselves in the sitting-room"}
{"id":"t.mrs_straker_tells_police","label":"Mrs. Straker tells the police about the knife and about Derbyshire","after":"t.tue_hollow","para":82,"quote":"His wife tells us that the knife had lain upon the dressing-table"}
{"id":"t.derbyshire_letters","label":"Letters for William Derbyshire are now and then addressed to Straker's house (Mrs. Straker's account)","after":"t.before","para":84,"quote":"occasionally his letters were addressed here"}
{"id":"t.milliner_account_made","label":"Madame Lesurier makes out the milliner's account to William Derbyshire","after":"t.before","para":84,"quote":"made out by Madame Lesurier, of Bond Street, to William Derbyshire","note":"Before Straker's death, since the account was in his pockets; the story gives no closer date."}
{"id":"t.plymouth_party","label":"A garden-party at Plymouth \"some little time ago\" (Holmes's claim; Mrs. Straker denies it)","after":"t.before","para":89,"quote":"Surely I met you in Plymouth at a garden-party some little time ago","note":"Holmes's claim; Mrs. Straker says he is mistaken."}
{"id":"t.thu_villa","label":"Thursday evening, a few minutes later: the landau pulls up at Straker's villa","day":"Thursday","clock":"evening","after":["t.thu_landau","t.straker_brought_back"],"para":69,"quote":"A few minutes later our driver pulled up at a neat little red-brick villa"}
{"id":"t.thu_sitting_room","label":"Thursday evening: in the sitting-room, the Inspector lays out Straker's things","day":"Thursday","clock":"evening","after":["t.thu_villa","t.thu_holmes_alights","t.inventory","t.mrs_straker_tells_police","t.milliner_account_made"],"para":78,"quote":"We all filed into the front room and sat round the central table"}
{"id":"t.thu_passage","label":"Thursday evening: Mrs. Straker meets them in the passage as they leave the sitting-room","day":"Thursday","clock":"evening","after":["t.thu_sitting_room","t.plymouth_party"],"para":86,"quote":"As we emerged from the sitting-room a woman, who had been waiting in the passage"}
{"id":"t.inquest","label":"Friday: the inquest on Straker","day":"Friday","after":"t.thu_villa","para":73,"quote":"The inquest is to-morrow."}
{"id":"t.coat_placed","label":"Monday–Tuesday night: the overcoat is laid across the furze-bush","after":["t.straker_leaves","t.night_storm"],"para":97,"quote":"it was laid across the bush","note":"There was no wind that night, so the coat was placed there, not blown (¶96). The text does not say by whom or whether it was before or after the struggle."}
{"id":"t.vesta_dropped","label":"A wax vesta, half burned, comes to lie in the mud of the hollow","after":"t.before","para":102,"quote":"It was a wax vesta half burned","note":"The story does not say when or by whom. Holmes expected to find it. It lay buried in the mud before Thursday's search."}
{"id":"t.horseshoe_cast","label":"Silver Blaze casts the horseshoe the Inspector now holds","after":"t.silver_blaze_foaled","para":101,"quote":"a cast horseshoe of Silver Blaze","note":"Not dated."}
{"id":"t.cup_entries","label":"Silver Blaze is entered for the Wessex Cup","after":"t.before","para":110,"quote":"remove our horse's name from the entries for the Cup","note":"Not dated; before the race."}
{"id":"t.ground_trampled","label":"Many feet trample the hollow since Monday night; the matting is laid at the side","after":"t.tue_hollow","para":98,"quote":"many feet have been here since Monday night","note":"The matting (¶99) is laid at some time after the body was found and before Thursday."}
{"id":"t.items_bagged","label":"The Inspector bags Straker's boot, Simpson's shoe and the cast horseshoe","after":["t.tue_hollow","t.gregory_arrives"],"para":101,"quote":"In this bag I have one of the boots which Straker wore","note":"Not dated more finely."}
{"id":"t.gregory_examines_ground","label":"Gregory examines the ground for a hundred yards in each direction","after":["t.tue_hollow","t.gregory_arrives"],"para":108,"quote":"I have examined the ground very carefully for a hundred yards in each direction"}
{"id":"t.thu_at_hollow","label":"Thursday evening: after a short walk across the moor, the party at the brink of the hollow by the furze-bush","day":"Thursday","clock":"evening","after":["t.thu_passage","t.ground_trampled"],"para":93,"quote":"A short walk across the moor took us to the hollow in which the body had been found"}
{"id":"t.thu_in_hollow","label":"Thursday evening: Holmes descends into the hollow, studies the mud and finds the vesta","day":"Thursday","clock":"evening","after":["t.thu_at_hollow","t.items_bagged","t.vesta_dropped","t.horseshoe_cast"],"para":102,"quote":"descending into the hollow, he pushed the matting into a more central position"}
{"id":"t.thu_on_rim","label":"Thursday evening: Holmes compares the boots with the marks, then climbs to the rim and searches the ferns","day":"Thursday","clock":"evening","after":"t.thu_in_hollow","para":107,"quote":"Then he clambered up to the rim of the hollow"}
{"id":"t.thu_holmes_walk","label":"Thursday evening, at sunset: Holmes and Watson walk slowly across the moor from the hollow","day":"Thursday","clock":"evening","after":["t.thu_on_rim","t.cup_entries"],"para":113,"quote":"Holmes and I walked slowly across the moor","note":"The walk planned in ¶109, now told. The sun is beginning to sink behind the Mapleton stables."}
{"id":"t.thu_ross_returns","label":"Thursday evening: Colonel Ross and the Inspector turn back towards Straker's house","day":"Thursday","clock":"evening","after":"t.thu_on_rim","para":113,"quote":"He turned back with the Inspector"}
{"id":"t.thu_drive_tavistock","label":"Thursday evening: the drive together into Tavistock (planned)","day":"Thursday","clock":"evening","after":["t.thu_set_off_kp","t.thu_ross_returns"],"para":112,"quote":"we can drive together into Tavistock"}
{"id":"t.fri_ground","label":"Friday: Holmes's work on the ground (planned)","day":"Friday","after":"t.thu_holmes_walk","para":109,"quote":"that I may know my ground to-morrow"}
{"id":"t.thu_wet_hollow","label":"Thursday evening, a few minutes later: at the long hollow towards Mapleton, Holmes finds the horse's track","day":"Thursday","clock":"evening","after":"t.thu_holmes_walk","para":117,"quote":"a few more minutes brought us to the hollow in question"}
{"id":"t.thu_near_mapleton","label":"Thursday evening: across dry turf, the tracks are picked up again close to Mapleton, with a man's track beside the horse's","day":"Thursday","clock":"evening","after":"t.thu_wet_hollow","para":119,"quote":"only to pick them up once more quite close to Mapleton"}
{"id":"t.thu_follow_double","label":"Thursday evening: they follow the double track towards King's Pyland; Watson sees the tracks coming back","day":"Thursday","clock":"evening","after":"t.thu_near_mapleton","para":122,"quote":"we both followed along after it"}
{"id":"t.thu_return_track","label":"Thursday evening: they follow the return track to the asphalt paving before the Mapleton gates","day":"Thursday","clock":"evening","after":"t.thu_follow_double","para":124,"quote":"It ended at the paving of asphalt which led up to the gates of the Mapleton stables"}
{"id":"t.thu_mapleton_gates","label":"Thursday evening: at the Mapleton gates, the groom Dawson runs out, then Silas Brown strides out","day":"Thursday","clock":"evening","after":"t.thu_return_track","para":124,"quote":"As we approached, a groom ran out from them"}
{"id":"t.thu_brown_parlour","label":"Thursday evening: Holmes goes in with Silas Brown to his parlour for twenty minutes; Watson waits","day":"Thursday","clock":"evening","after":"t.thu_mapleton_gates","para":136,"quote":"Now, Mr. Brown, I am quite at your disposal."}
{"id":"t.thu_brown_reappears","label":"Thursday evening, twenty minutes later, at dusk: Holmes and Brown reappear; Brown promises to follow instructions","day":"Thursday","clock":"dusk","after":"t.thu_brown_parlour","para":137,"quote":"It was twenty minutes, and the reds had all faded into greys before Holmes and the trainer reappeared"}
{"id":"t.thu_set_off_kp","label":"Thursday evening: Holmes and Watson set off from Mapleton for King's Pyland","day":"Thursday","clock":"evening","after":"t.thu_brown_reappears","para":143,"quote":"we set off for King's Pyland"}
{"id":"t.horse_alone_hollow","label":"Monday–Tuesday night (Holmes's reading): the horse, alone, crosses the wet hollow towards Mapleton","after":"t.horse_leaves_stall","para":117,"quote":"The track of a horse was plainly outlined in the soft earth","note":"Holmes supposes that the horse broke away during or after the tragedy (¶114). The hollow 'must have been very wet on Monday night' (¶116). The text does not date the tracks more finely."}
{"id":"t.man_with_horse","label":"A man's track joins the horse's close to Mapleton; the two turn towards King's Pyland","after":"t.horse_alone_hollow","para":119,"quote":"A man's track was visible beside the horse's","note":"The tracks show the horse alone before this point (¶120–121)."}
{"id":"t.man_horse_back","label":"The man and the horse come back again, ending at the asphalt before the Mapleton gates","after":"t.man_with_horse","para":122,"quote":"the same tracks coming back again in the opposite direction"}
{"id":"t.fri_five_am","label":"Friday, five in the morning: a call on Silas Brown (Holmes's question to the groom)","day":"Friday","clock":"five in the morning","after":"t.thu_set_off_kp","para":126,"quote":"if I were to call at five o'clock to-morrow morning","note":"Holmes puts it as a hypothetical question; the story does not say that he will call."}
{"id":"t.brown_carries_out","label":"Brown carries out Holmes's instructions (\"It shall be there\") (promised)","after":"t.thu_brown_reappears","para":140,"quote":"It shall be there.","note":"Brown's promise; what he will do, and when, is not told."}
{"id":"t.fri_holmes_writes","label":"Friday: Brown is to hear from Holmes (promised)","day":"Friday","after":"t.thu_brown_reappears","para":143,"quote":"you shall hear from me to-morrow","note":"Holmes also says in ¶141 that he will write to Brown."}
{"id":"t.baxter_sworn","label":"Edith Baxter makes her sworn statement","after":"t.tue_hollow","para":26,"quote":"The girl has sworn"}
{"id":"t.wire_reply","label":"The answer to Holmes's special wire reaches him","after":"t.wed","para":31,"quote":"to clear the matter up"}
{"id":"t.traces_found","label":"The police find traces of the gypsies' camp","after":["t.gypsies_gone","t.gregory_arrives"],"para":62,"quote":"We have found traces which show that a party of gypsies encamped","note":"Before the drive of Thursday evening; not otherwise dated."}
{"id":"t.note_found","label":"A ten-pound note is found in Simpson's purse","after":"t.simpson_arrest","para":58,"quote":"One was found in his purse.","note":"Before the drive of Thursday evening."}
{"id":"t.thu_holmes_alights","label":"Thursday evening: Holmes steps out of the landau at the villa; talk outside before going in","day":"Thursday","clock":"evening","after":"t.thu_villa","para":69,"quote":"he roused himself with a violent start and stepped out of the carriage"}

## Accounts so far

{"id":"acct.watson","label":"What Watson sees and hears himself","origin":"watson","how":"saw","facts":["f.holmes_loc_breakfast","f.watson_loc_breakfast","f.clock_morning","f.holmes_says_must_go","f.holmes_intends_dartmoor","f.case_talk_of_england","f.holmes_loc_wed","f.holmes_broods","f.holmes_pipe","f.holmes_deaf","f.news_agent_sends","f.holmes_tosses_papers","f.papers_in_corner","f.watson_knows_brooding","f.holmes_announces","f.watson_expected","f.watson_offers","f.holmes_says_unique","f.holmes_intends_train","f.holmes_asks_glass","f.watson_owns_glass","f.holmes_buys_papers","f.holmes_at_paddington","f.watson_in_carriage","f.holmes_in_carriage","f.train_on_line","f.train_to_exeter","f.holmes_cap","f.holmes_reads_papers","f.train_past_reading","f.papers_under_seat","f.holmes_offers_cigars","f.holmes_looks_window","f.holmes_owns_watch","f.holmes_says_speed","f.watson_says_posts","f.holmes_says_telegraph_posts","f.holmes_asks_case","f.watson_read_papers","f.telegraph_tells_watson","f.chronicle_tells_watson","f.holmes_says_method","f.holmes_says_surmise","f.holmes_tells_telegrams","f.cal_thu","f.cal_wed","f.watson_asks_why","f.holmes_says_blunder","f.watson_memoirs","f.holmes_believed_not_concealed","f.holmes_expected_found","f.holmes_decides_act","f.holmes_says_not_wasted","f.holmes_tells_wait","f.watson_asks_theory","f.holmes_says_grip","f.holmes_intends_enumerate","f.watson_lies_back","f.watson_cigar","f.holmes_checks_points","f.holmes_tells_case","f.newspapers_tell_holmes","f.holmes_says_interest","f.watson_asks_door","f.holmes_praises","f.holmes_believes_door_point","f.holmes_tells_wire","f.holmes_says_main_facts","f.holmes_says_gregory","f.holmes_says_marked","f.holmes_asks_light","f.watson_listens","f.watson_knew_facts","f.watson_not_appreciated","f.watson_suggests_cut","f.holmes_says_probable","f.holmes_says_point_gone","f.watson_says_fail","f.holmes_says_objections","f.holmes_says_police_theory","f.holmes_says_improbable","f.holmes_intends_test","f.watson_at_tavistock","f.holmes_at_tavistock","f.clock_thu_evening","f.tavistock_centre","f.gregory_at_station","f.ross_at_station","f.gregory_looks","f.ross_looks","f.ross_frock","f.ross_wears_gaiters","f.ross_wears_eyeglass","f.ross_sportsman","f.gregory_name_making","f.gregory_member_service","f.ross_says_delighted","f.ross_intends_avenge","f.holmes_asks_developments","f.gregory_says_little_progress","f.landau_outside","f.gregory_intends_drive","f.watson_in_landau","f.holmes_in_landau","f.gregory_in_landau","f.ross_in_landau","f.landau_through_town","f.gregory_pours_out","f.holmes_interjects","f.ross_leans_back","f.ross_hat_on","f.watson_listens_drive","f.gregory_theory_foretold","f.gregory_says_net","f.gregory_believes_simpson","f.gregory_says_circumstantial","f.holmes_asks_knife","f.gregory_says_self_wound","f.holmes_says_watson_suggested","f.gregory_says_no_knife","f.gregory_says_evidence","f.holmes_shakes_head","f.holmes_says_counsel","f.holmes_asks_why_out","f.holmes_asks_key","f.holmes_asks_chemist","f.holmes_asks_hide","f.holmes_asks_paper","f.gregory_says_not_formidable","f.gregory_says_opium_london","f.gregory_says_key_thrown","f.gregory_says_pits","f.holmes_asks_cravat","f.gregory_says_new_element","f.holmes_pricks_ears","f.gregory_says_gypsy_theory","f.holmes_says_possible","f.holmes_asks_other_stable","f.gregory_says_mapleton_interest","f.gregory_says_nothing_brown","f.holmes_asks_simpson_mapleton","f.gregory_says_no_link","f.gregory_tells_holmes","f.gregory_tells_watson","f.holmes_leans_back_drive","f.driver_pulls_up","f.landau_at_villa","f.villa_look","f.villa_by_road","f.outbuilding_position","f.outbuilding_look","f.moor_bronze","f.tavistock_steeples_visible","f.mapleton_visible","f.watson_springs_out","f.gregory_springs_out","f.ross_springs_out","f.holmes_stays_landau","f.holmes_absorbed","f.watson_touches_arm","f.holmes_steps_out","f.holmes_out_villa","f.ross_surprised","f.holmes_says_daydreaming","f.holmes_gleam","f.watson_believes_clue","f.gregory_offers_scene","f.holmes_intends_stay","f.holmes_asks_brought_back","f.holmes_asks_service","f.ross_says_servant","f.holmes_asks_inventory","f.watson_in_sitting_room","f.holmes_in_sitting_room","f.gregory_in_sitting_room","f.ross_in_sitting_room","f.gregory_unlocks_box","f.gregory_lays_out","f.vestas_on_table","f.candle_on_table","f.pipe_on_table","f.pouch_on_table","f.pouch_contents","f.watch_on_table","f.sovereigns_on_table","f.pencil_on_table","f.papers_on_table","f.knife_on_table","f.knife_look","f.knife_maker","f.holmes_says_singular_knife","f.holmes_examines_knife","f.holmes_sees_blood","f.holmes_presumes_grasp","f.holmes_asks_watson_knife","f.watson_says_cataract","f.holmes_says_delicate","f.gregory_tells_knife","f.gregory_tells_knife_holmes","f.gregory_says_poor_weapon","f.holmes_says_very_possible","f.holmes_asks_papers","f.holmes_glances_account","f.holmes_says_expensive","f.holmes_says_nothing_more","f.holmes_intends_scene","f.watson_in_passage","f.holmes_in_passage","f.gregory_in_passage","f.mrs_straker_in_passage","f.mrs_straker_sleeve","f.mrs_straker_face","f.mrs_straker_asks_found","f.gregory_says_not_found","f.holmes_says_plymouth","f.mrs_straker_says_mistaken","f.holmes_says_dove_dress","f.mrs_straker_no_dress","f.gregory_tells_villa_holmes","f.gregory_tells_villa_watson","f.holmes_says_settles","f.holmes_follows_out","f.walk_to_hollow","f.watson_at_hollow","f.holmes_at_hollow","f.gregory_at_hollow","f.ross_at_hollow","f.bush_at_brink","f.holmes_says_no_wind","f.holmes_says_coat_placed","f.holmes_says_interest_ground","f.holmes_sees_trampled","f.mud_trampled","f.holmes_says_excellent","f.gregory_carries_bag","f.holmes_says_surpass","f.holmes_takes_bag","f.holmes_carries_bag","f.holmes_descends","f.holmes_moves_matting","f.matting_central","f.holmes_studies_mud","f.holmes_says_whats_this","f.holmes_finds_vesta","f.vesta_in_mud","f.vesta_look","f.gregory_says_overlooked","f.gregory_annoyed","f.holmes_says_invisible","f.holmes_looking_vesta","f.gregory_asks_expected","f.holmes_says_not_unlikely","f.holmes_expected_vesta","f.holmes_compares_boots","f.holmes_on_rim","f.holmes_crawls","f.gregory_says_no_tracks","f.holmes_rises","f.holmes_says_no_impertinence","f.holmes_says_walk","f.holmes_intends_walk","f.clock_not_dark","f.holmes_pockets_horseshoe","f.ross_impatient","f.ross_glances_watch","f.ross_owns_watch","f.ross_asks_gregory","f.ross_considers_scratch","f.sb_entered","f.holmes_says_let_stand","f.ross_bows","f.ross_says_glad","f.ross_intends_return","f.ross_intends_drive","f.gregory_tells_hollow_holmes","f.gregory_tells_hollow_watson"]}
{"id":"acct.press","label":"What the newspapers report of the case","origin":null,"how":"report","facts":["f.horse_favourite","f.horse_disappears","f.straker_trainer","f.straker_murdered","f.name_straker","f.name_silver_blaze"]}
{"id":"acct.holmes","label":"Holmes's account of the telegrams and his day of waiting","origin":"holmes","how":"own","facts":["f.cal_tue","f.clock_tue_evening","f.holmes_gets_telegrams","f.ross_telegraphs","f.gregory_telegraphs","f.ross_owner","f.gregory_role","f.horse_reputed","f.north_dartmoor_sparse","f.horse_not_found","f.simpson_arrested","f.simpson_young","f.nothing_else_done","f.holmes_sends_wire","f.wire_reply_tells"]}
{"id":"acct.case_reports","label":"The reported facts of the case: the horse, the stable and the moor","origin":null,"how":"report","facts":["f.sb_isonomy","f.sb_record","f.sb_age","f.sb_prizes","f.sb_odds","f.sb_public_favourite","f.sb_money_laid","f.race_tuesday","f.cal_race_tue","f.ross_stables","f.precautions","f.straker_retired_jockey","f.straker_too_heavy","f.straker_jockey_years","f.straker_trainer_years","f.straker_reputed","f.lads_under_straker","f.stables_four_horses","f.sb_member","f.lads_routine","f.lads_reputed","f.straker_married","f.straker_lives_villa","f.straker_no_children","f.straker_keeps_maid","f.straker_comfortable","f.country_lonely","f.villas_position","f.villas_built","f.villas_purpose","f.tavistock_position","f.mapleton_position","f.mapleton_owner","f.brown_manages","f.moor_wilderness","f.gypsies_on_moor","f.cal_mon","f.horses_exercised","f.stables_locked","f.clock_nine","f.lads_walk_to_house","f.lads_in_kitchen","f.hunter_member","f.name_hunter","f.hunter_on_guard","f.hunter_in_stables","f.window_small","f.straker_not_realise","f.straker_dead","f.straker_defended","f.horse_in_hollow","f.horse_gone_since","f.reward","f.gypsies_alert","f.household_ate","f.desborough_second","f.desborough_mapleton","f.bridle_missing"]}
{"id":"acct.baxter","label":"Edith Baxter's sworn account of the stranger","origin":"baxter","how":"saw","facts":["f.name_baxter","f.baxter_role","f.baxter_carries_supper","f.baxter_carrying_supper","f.clock_after_nine","f.supper_dish","f.baxter_no_liquid","f.tap_in_stables","f.rule_tap","f.baxter_lantern","f.weather_dark","f.path_open_moor","f.baxter_near_stables","f.stranger_appears","f.stranger_on_path","f.stranger_gentlemanly","f.stranger_tweed","f.stranger_cap","f.stranger_gaiters","f.stranger_stick","f.stranger_pallor","f.stranger_nervous","f.baxter_thinks_age","f.stranger_asks_where","f.baxter_says_kp","f.stranger_says_boy","f.stranger_takes_packet","f.stranger_carrying_packet","f.stranger_offers_dress","f.baxter_frightened","f.baxter_runs_window","f.baxter_at_window","f.window_meals","f.window_open","f.hunter_at_table","f.baxter_begins_tell","f.stranger_at_window","f.stranger_says_word","f.baxter_sees_packet","f.hunter_asks_business","f.stranger_asks_tip","f.hunter_says_tout","f.hunter_rushes_dog","f.baxter_flees","f.baxter_home","f.baxter_sees_leaning","f.stranger_leaning","f.baxter_recognises"]}
{"id":"acct.hunter","label":"Ned Hunter's account of the night","origin":"hunter","how":"saw","facts":["f.hunter_at_table","f.window_open","f.stranger_at_window","f.stranger_says_word","f.hunter_asks_business","f.stranger_asks_tip","f.hunter_says_tout","f.hunter_rushes_dog","f.dog_in_stable","f.hunter_rushes_out","f.hunter_outside","f.dog_outside","f.stranger_gone","f.hunter_no_trace","f.hunter_locks_door","f.door_locked_after","f.hunter_waits","f.lads_back","f.hunter_tells_straker","f.hunter_recovers","f.hunter_cravat","f.hunter_believes_drugged"]}
{"id":"acct.mrs_straker","label":"Mrs. Straker's account of her husband's going out and the morning","origin":"mrs_straker","how":"saw","facts":["f.straker_excited","f.straker_uneasy","f.mrs_straker_wakes_one","f.clock_one","f.straker_dressing","f.straker_at_villa_one","f.mrs_straker_at_villa","f.straker_says_anxiety","f.mrs_straker_begs","f.rain_one","f.straker_mackintosh","f.straker_leaves","f.mrs_straker_wakes_seven","f.clock_seven","f.straker_not_returned","f.mrs_straker_wife","f.mrs_straker_sets_off","f.mrs_straker_at_stables","f.baxter_at_stables","f.door_open","f.hunter_on_chair","f.hunter_stupor","f.stall_empty","f.no_sign_straker"]}
{"id":"acct.lads","label":"The two sleeping lads' account","origin":"other_lads","how":"said","facts":["f.lads_in_loft","f.loft_above","f.lads_aroused","f.lads_heard_nothing","f.lads_sound_sleepers"]}
{"id":"acct.search","label":"The search party's account: Hunter drugged, the coat and the body","origin":"search_party","how":"saw","facts":["f.hunter_drugged","f.hunter_left_sleep","f.party_mrs_straker","f.party_baxter","f.party_lads","f.party_searches","f.party_hopes","f.party_on_knoll","f.knoll_view","f.party_no_horse","f.party_sees_tragedy","f.coat_on_bush","f.bush_distance","f.hollow_beyond","f.body_in_hollow","f.head_shattered","f.thigh_cut","f.straker_knife","f.knife_blood","f.straker_cravat"]}
{"id":"acct.analysis","label":"The analysis of Hunter's supper","origin":null,"how":"analysis","facts":["f.hunter_ate","f.analysis_opium"]}
{"id":"acct.police","label":"What the police have done: the arrest of Fitzroy Simpson","origin":"gregory","how":"report","facts":["f.gregory_arrives","f.gregory_arrests","f.simpson_lives_villa","f.name_simpson","f.simpson_birth","f.simpson_squandered","f.simpson_bookmaker","f.police_examine_book","f.book_owner","f.book_contents","f.simpson_bets_against","f.simpson_says_came","f.simpson_admits","f.stranger_identity","f.simpson_says_no_designs","f.gregory_confronts","f.cravat_owner","f.simpson_pale","f.simpson_wet","f.simpson_out_storm","f.storm","f.simpson_stick_owner","f.stick_lead","f.stick_weapon","f.simpson_unwounded","f.baxter_swears"]}
{"id":"acct.holmes_case","label":"Holmes's statement of the case on the train","origin":"holmes","how":"bundle","parts":["acct.case_reports","acct.baxter","acct.hunter","acct.mrs_straker","acct.lads","acct.search","acct.analysis","acct.police"]}
{"id":"acct.gregory","label":"Inspector Gregory's report on the drive: Simpson's answers, the gypsies and the searches","origin":"gregory","how":"report","facts":["f.simpson_no_knife","f.simpson_says_note","f.note_in_purse","f.purse_owner","f.simpson_lodged","f.simpson_owns_cravat_says","f.simpson_says_lost","f.police_find_traces","f.gypsies_at_camp","f.camp_distance","f.cal_gypsies_mon","f.gypsies_left","f.cal_gypsies_tue","f.moor_scoured","f.gregory_examines_outhouses","f.horse_not_in_outhouses","f.desborough_second_betting","f.brown_trainer","f.brown_bets","f.brown_no_friend","f.police_examine_mapleton"]}
{"id":"acct.gregory_villa","label":"Inspector Gregory at the villa: the body, the inquest, the things in Straker's pockets and the cork","origin":"gregory","how":"report","facts":["f.straker_brought_back","f.body_upstairs","f.inquest_tomorrow","f.cal_inquest_fri","f.gregory_keeps_things","f.box_in_sitting_room","f.straker_had_vestas","f.straker_had_candle","f.straker_had_pipe","f.straker_had_pouch","f.straker_had_watch","f.straker_had_sovereigns","f.straker_had_pencil","f.straker_had_papers","f.cork_guarded_tip","f.cork_beside_body","f.police_find_cork","f.papers_hay","f.papers_ross_letter","f.ross_wrote_letter","f.papers_milliner","f.milliner_amount","f.lesurier_makes_account","f.lesurier_role","f.lesurier_bond_street","f.account_to_derbyshire","f.mrs_straker_says_derbyshire","f.mrs_straker_tells_knife"]}
{"id":"acct.mrs_straker_knife","label":"Mrs. Straker's account to the police of the knife on the dressing-table","origin":"mrs_straker","how":"saw","facts":["f.knife_on_dressing_table","f.straker_picks_knife","f.straker_carries_knife_out"]}
{"id":"acct.gregory_hollow","label":"Inspector Gregory at the hollow: the weather that night, the coat, the matting, the bag and his search","origin":"gregory","how":"report","facts":["f.no_wind","f.heavy_rain","f.coat_laid","f.matting_laid","f.police_on_matting","f.bag_boot","f.bag_shoe","f.bag_horseshoe","f.boot_straker","f.shoe_simpson","f.horseshoe_sb","f.sb_casts_shoe","f.gregory_bags_items","f.gregory_examined_ground"]}

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
{"id":"f.watson_lies_back","of":"watson","attr":"action","value":"lies back against the cushions, puffing at his cigar","time":{"at":"t.thu_on_line"},"para":17,"quote":"I lay back against the cushions, puffing at my cigar"}
{"id":"f.watson_cigar","of":"watson","attr":"carrying","value":"watson_cigar","time":{"at":"t.thu_on_line"},"para":17,"quote":"puffing at my cigar"}
{"id":"f.holmes_checks_points","of":"holmes","attr":"action","value":"leans forward and checks off the points on the palm of his left hand","time":{"at":"t.thu_on_line"},"para":17,"quote":"with his long, thin forefinger checking off the points upon the palm of his left hand"}
{"id":"f.holmes_tells_case","of":"holmes","attr":"tells","value":"acct.holmes_case","to":"watson","how":"told","time":{"at":"t.thu_on_line"},"para":17,"quote":"gave me a sketch of the events which had led to our journey"}
{"id":"f.newspapers_tell_holmes","of":"newspapers","attr":"tells","value":["acct.case_reports","acct.baxter","acct.hunter","acct.mrs_straker","acct.lads","acct.search","acct.analysis","acct.police"],"to":"holmes","how":"newspaper","time":{"from":"t.wed","to":"t.thu_past_reading"},"para":7,"quote":"dipped rapidly into the bundle of fresh papers"}
{"id":"f.sb_isonomy","of":"silver_blaze","attr":"condition","value":"from the Isonomy stock","time":{"at":"t.thu_on_line"},"para":18,"quote":"is from the Isonomy stock"}
{"id":"f.sb_record","of":"silver_blaze","attr":"reputed","value":"holds as brilliant a record as his famous ancestor","time":{"at":"t.thu_on_line"},"para":18,"quote":"holds as brilliant a record as his famous ancestor"}
{"id":"f.sb_age","of":"silver_blaze","attr":"condition","value":"in his fifth year","time":{"at":"t.thu_on_line"},"para":18,"quote":"He is now in his fifth year"}
{"id":"f.sb_prizes","of":"silver_blaze","attr":"action","value":"has won in turn each of the prizes of the turf for Colonel Ross","time":{"after":"t.silver_blaze_foaled","before":"t.crime"},"para":18,"quote":"has brought in turn each of the prizes of the turf to Colonel Ross"}
{"id":"f.sb_odds","of":"silver_blaze","attr":"condition","value":"first favourite for the Wessex Cup, the betting three to one on him","time":{"after":"t.before","before":"t.crime"},"para":18,"quote":"the betting being three to one on him"}
{"id":"f.sb_public_favourite","of":"silver_blaze","attr":"reputed","value":"a prime favourite with the racing public, who has never disappointed them","time":{"after":"t.before","before":"t.crime"},"para":18,"quote":"has always, however, been a prime favourite with the racing public"}
{"id":"f.sb_money_laid","of":"racing_public","attr":"action","value":"lay enormous sums of money on Silver Blaze","time":{"after":"t.before","before":"t.crime"},"para":18,"quote":"enormous sums of money have been laid upon him"}
{"id":"f.holmes_says_interest","of":"holmes","attr":"says","value":"many people had the strongest interest in keeping Silver Blaze out of the race next Tuesday","to":"watson","time":{"at":"t.thu_on_line"},"para":18,"quote":"there were many people who had the strongest interest in preventing Silver Blaze from being there at the fall of the flag next Tuesday","asserts":[{"of":"silver_blaze","attr":"condition","value":"many people have an interest in preventing him from running"}]}
{"id":"f.race_tuesday","of":"wessex_cup","attr":"time","value":"run next Tuesday","time":{"at":"t.race"},"para":18,"quote":"at the fall of the flag next Tuesday"}
{"id":"f.cal_race_tue","of":"calendar","attr":"weekday","value":"Tuesday","time":{"at":"t.race"},"para":18,"quote":"next Tuesday"}
{"id":"f.ross_stables","of":"stables","attr":"owner","value":"ross","time":{"from":"t.before"},"para":19,"quote":"where the Colonel’s training-stable is situated"}
{"id":"f.precautions","of":"stables","attr":"condition","value":"every precaution taken to guard the favourite","time":{"after":"t.before","before":"t.crime"},"para":19,"quote":"Every precaution was taken to guard the favourite."}
{"id":"f.straker_retired_jockey","of":"straker","attr":"role","value":"retired jockey who rode in Colonel Ross's colours","time":{"at":"t.crime"},"para":19,"quote":"is a retired jockey who rode in Colonel Ross’s colours"}
{"id":"f.straker_too_heavy","of":"straker","attr":"condition","value":"became too heavy for the weighing-chair","time":{"at":"t.straker_trainer"},"para":19,"quote":"before he became too heavy for the weighing-chair"}
{"id":"f.straker_jockey_years","of":"straker","attr":"role","value":"Colonel Ross's jockey","time":{"from":"t.straker_jockey","to":"t.straker_trainer"},"para":19,"quote":"He has served the Colonel for five years as jockey"}
{"id":"f.straker_trainer_years","of":"straker","attr":"role","value":"Colonel Ross's trainer","time":{"from":"t.straker_trainer","to":"t.crime"},"para":19,"quote":"for seven as trainer"}
{"id":"f.straker_reputed","of":"straker","attr":"reputed","value":"a zealous and honest servant","time":{"from":"t.straker_jockey","to":"t.crime"},"para":19,"quote":"has always shown himself to be a zealous and honest servant"}
{"id":"f.lads_under_straker","of":"stable_lads","attr":"role","value":"the three lads under Straker","time":{"at":"t.crime"},"para":19,"quote":"Under him were three lads"}
{"id":"f.stables_four_horses","of":"stables","attr":"contents","value":"kp_horses","detail":"only four horses in all; a small establishment","time":{"at":"t.mon_stables_locked"},"para":19,"quote":"the establishment was a small one, containing only four horses in all"}
{"id":"f.sb_member","of":"silver_blaze","attr":"member_of","value":"kp_horses","basis":"implied","time":{"at":"t.mon_stables_locked"},"para":19,"quote":"containing only four horses in all"}
{"id":"f.lads_routine","of":"stable_lads","attr":"condition","value":"one sits up each night in the stable while the others sleep in the loft","time":{"after":"t.before","before":"t.crime"},"para":19,"quote":"One of these lads sat up each night in the stable, while the others slept in the loft"}
{"id":"f.lads_reputed","of":"stable_lads","attr":"reputed","value":"excellent characters","time":{"at":"t.crime"},"para":19,"quote":"All three bore excellent characters."}
{"id":"f.straker_married","of":"straker","attr":"condition","value":"married","time":{"at":"t.crime"},"para":19,"quote":"John Straker, who is a married man"}
{"id":"f.straker_lives_villa","of":"straker","attr":"lives_at","value":"straker_villa","detail":"a small villa about two hundred yards from the stables","time":{"at":"t.crime"},"para":19,"quote":"lived in a small villa about two hundred yards from the stables"}
{"id":"f.straker_no_children","of":"straker","attr":"condition","value":"has no children","time":{"at":"t.crime"},"para":19,"quote":"He has no children"}
{"id":"f.straker_keeps_maid","of":"straker","attr":"condition","value":"keeps one maid-servant","time":{"at":"t.crime"},"para":19,"quote":"keeps one maid-servant"}
{"id":"f.straker_comfortable","of":"straker","attr":"condition","value":"comfortably off","time":{"at":"t.crime"},"para":19,"quote":"is comfortably off"}
{"id":"f.country_lonely","of":"moor","attr":"condition","value":"the country round is very lonely","time":{"at":"t.crime"},"para":19,"quote":"The country round is very lonely"}
{"id":"f.villas_position","of":"villas","attr":"position","value":"about half a mile north of the stables","time":{"at":"t.crime"},"para":19,"quote":"about half a mile to the north there is a small cluster of villas"}
{"id":"f.villas_built","of":"tavistock_contractor","attr":"action","value":"builds the villas","time":{"at":"t.villas_built"},"para":19,"quote":"which have been built by a Tavistock contractor"}
{"id":"f.villas_purpose","of":"villas","attr":"role","value":"for invalids and others who wish to enjoy the Dartmoor air","time":{"at":"t.crime"},"para":19,"quote":"for the use of invalids and others who may wish to enjoy the pure Dartmoor air"}
{"id":"f.tavistock_position","of":"tavistock","attr":"position","value":"two miles to the west","time":{"at":"t.crime"},"para":19,"quote":"Tavistock itself lies two miles to the west"}
{"id":"f.mapleton_position","of":"mapleton","attr":"position","value":"across the moor, about two miles distant; a larger training establishment","time":{"at":"t.crime"},"para":19,"quote":"also about two miles distant, is the larger training establishment of Mapleton"}
{"id":"f.mapleton_owner","of":"mapleton","attr":"owner","value":"backwater","time":{"at":"t.crime"},"para":19,"quote":"which belongs to Lord Backwater"}
{"id":"f.brown_manages","of":"silas_brown","attr":"role","value":"manager of the Mapleton stables","time":{"at":"t.crime"},"para":19,"quote":"is managed by Silas Brown"}
{"id":"f.moor_wilderness","of":"moor","attr":"condition","value":"a complete wilderness in every other direction","time":{"at":"t.crime"},"para":19,"quote":"In every other direction the moor is a complete wilderness"}
{"id":"f.gypsies_on_moor","of":"gypsies","attr":"location","value":"moor","detail":"a few, roaming","time":{"at":"t.crime"},"para":19,"quote":"inhabited only by a few roaming gypsies"}
{"id":"f.cal_mon","of":"calendar","attr":"weekday","value":"Monday","time":{"at":"t.mon_stables_locked"},"para":19,"quote":"last Monday night when the catastrophe occurred"}
{"id":"f.horses_exercised","of":"kp_horses","attr":"action","value":"exercised and watered as usual","time":{"after":"t.before","before":"t.mon_stables_locked"},"para":20,"quote":"the horses had been exercised and watered as usual"}
{"id":"f.stables_locked","of":"stable_door","attr":"door","value":"locked","time":{"at":"t.mon_stables_locked"},"para":20,"quote":"the stables were locked up at nine o’clock"}
{"id":"f.clock_nine","of":"clock","attr":"hour","value":"nine o'clock","time":{"at":"t.mon_stables_locked"},"para":20,"quote":"at nine o’clock"}
{"id":"f.lads_walk_to_house","of":"other_lads","attr":"action","value":"walk up to the trainer's house","time":{"at":"t.mon_lads_supper"},"para":20,"quote":"Two of the lads walked up to the trainer’s house"}
{"id":"f.lads_in_kitchen","of":"other_lads","attr":"location","value":"kitchen","detail":"at supper","time":{"at":"t.mon_lads_supper"},"para":20,"quote":"where they had supper in the kitchen"}
{"id":"f.hunter_member","of":"hunter","attr":"member_of","value":"stable_lads","time":{"at":"t.mon_stables_locked"},"para":20,"quote":"while the third, Ned Hunter"}
{"id":"f.name_hunter","of":"hunter","attr":"name","value":"Ned Hunter","time":{"at":"t.mon_stables_locked"},"para":20,"quote":"Ned Hunter"}
{"id":"f.hunter_on_guard","of":"hunter","attr":"role","value":"on guard in the stable that night","time":{"from":"t.mon_stables_locked","to":"t.tue_at_stables"},"para":20,"quote":"remained on guard"}
{"id":"f.hunter_in_stables","of":"hunter","attr":"location","value":"stables","detail":"on guard","time":{"from":"t.mon_stables_locked","to":"t.mon_hunter_for_dog"},"para":20,"quote":"remained on guard"}
{"id":"f.name_baxter","of":"baxter","attr":"name","value":"Edith Baxter","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"the maid, Edith Baxter"}
{"id":"f.baxter_role","of":"baxter","attr":"role","value":"the Strakers' maid","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"the maid, Edith Baxter"}
{"id":"f.baxter_carries_supper","of":"baxter","attr":"action","value":"carries Hunter's supper down to the stables","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"carried down to the stables his supper"}
{"id":"f.baxter_carrying_supper","of":"baxter","attr":"carrying","value":"curried_mutton","time":{"from":"t.mon_maid_sets_out","to":"t.mon_maid_at_window"},"para":20,"quote":"carried down to the stables his supper"}
{"id":"f.clock_after_nine","of":"clock","attr":"hour","value":"a few minutes after nine","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"At a few minutes after nine"}
{"id":"f.supper_dish","of":"curried_mutton","attr":"condition","value":"a dish of curried mutton, Hunter's supper","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"which consisted of a dish of curried mutton"}
{"id":"f.baxter_no_liquid","of":"baxter","attr":"carrying","value":"any liquid","neg":true,"time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"She took no liquid"}
{"id":"f.tap_in_stables","of":"water_tap","attr":"location","value":"stables","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"there was a water-tap in the stables"}
{"id":"f.rule_tap","of":"stables","attr":"rule","value":"the lad on duty drinks nothing but water from the tap","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"it was the rule that the lad on duty should drink nothing else"}
{"id":"f.baxter_lantern","of":"baxter","attr":"carrying","value":"lantern","time":{"from":"t.mon_maid_sets_out","to":"t.mon_maid_at_window"},"para":20,"quote":"The maid carried a lantern with her"}
{"id":"f.weather_dark","of":"weather","attr":"condition","value":"very dark","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"it was very dark"}
{"id":"f.path_open_moor","of":"path","attr":"condition","value":"runs across the open moor","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"the path ran across the open moor"}
{"id":"f.baxter_near_stables","of":"baxter","attr":"location","value":"path","detail":"within thirty yards of the stables","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"Edith Baxter was within thirty yards of the stables"}
{"id":"f.stranger_appears","of":"the_stranger","attr":"action","value":"appears out of the darkness and calls to her to stop","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"a man appeared out of the darkness and called to her to stop"}
{"id":"f.stranger_on_path","of":"the_stranger","attr":"location","value":"path","detail":"in the lantern light, thirty yards from the stables","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"he stepped into the circle of yellow light thrown by the lantern"}
{"id":"f.stranger_gentlemanly","of":"the_stranger","attr":"condition","value":"of gentlemanly bearing","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"a person of gentlemanly bearing"}
{"id":"f.stranger_tweed","of":"the_stranger","attr":"wearing","value":"tweed_suit","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"dressed in a grey suit of tweeds"}
{"id":"f.stranger_cap","of":"the_stranger","attr":"wearing","value":"cloth_cap","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"with a cloth cap"}
{"id":"f.stranger_gaiters","of":"the_stranger","attr":"wearing","value":"gaiters","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"He wore gaiters"}
{"id":"f.stranger_stick","of":"the_stranger","attr":"carrying","value":"stranger_stick","detail":"heavy, with a knob","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"carried a heavy stick with a knob to it"}
{"id":"f.stranger_pallor","of":"the_stranger","attr":"condition","value":"extremely pale","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"the extreme pallor of his face"}
{"id":"f.stranger_nervous","of":"the_stranger","attr":"condition","value":"nervous in manner","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"the nervousness of his manner"}
{"id":"f.baxter_thinks_age","of":"baxter","attr":"believes","value":"the stranger is rather over thirty","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"His age, she thought, would be rather over thirty than under it","asserts":[{"of":"the_stranger","attr":"condition","value":"rather over thirty years old"}]}
{"id":"f.stranger_asks_where","of":"the_stranger","attr":"says","value":"asks where he is; he had almost made up his mind to sleep on the moor when he saw her lantern","to":"baxter","time":{"at":"t.mon_stranger_meets"},"para":22,"quote":"Can you tell me where I am?","asserts":[{"of":"the_stranger","attr":"knows","value":"where he is","neg":true,"time":{"at":"t.mon_stranger_meets"}}]}
{"id":"f.baxter_says_kp","of":"baxter","attr":"says","value":"he is close to the King's Pyland training-stables","to":"the_stranger","time":{"at":"t.mon_stranger_meets"},"para":23,"quote":"You are close to the King’s Pyland training-stables"}
{"id":"f.stranger_says_boy","of":"the_stranger","attr":"says","value":"he understands a stable-boy sleeps there alone every night, and guesses she carries his supper","to":"baxter","time":{"at":"t.mon_stranger_meets"},"para":24,"quote":"I understand that a stable-boy sleeps there alone every night.","asserts":[{"of":"the_stranger","attr":"knows","value":"a stable-boy sleeps alone in the stable every night"}]}
{"id":"f.stranger_takes_packet","of":"the_stranger","attr":"action","value":"takes a folded piece of white paper out of his waistcoat pocket","time":{"at":"t.mon_stranger_meets"},"para":24,"quote":"He took a piece of white paper folded up out of his waistcoat pocket."}
{"id":"f.stranger_carrying_packet","of":"the_stranger","attr":"carrying","value":"paper_packet","time":{"from":"t.mon_stranger_meets"},"para":24,"quote":"He took a piece of white paper folded up out of his waistcoat pocket."}
{"id":"f.stranger_offers_dress","of":"the_stranger","attr":"says","value":"offers her the prettiest frock money can buy if she sees that the boy has the paper tonight","to":"baxter","time":{"at":"t.mon_stranger_meets"},"para":24,"quote":"See that the boy has this to-night, and you shall have the prettiest frock that money can buy.","asserts":[{"of":"the_stranger","attr":"intends","value":"that the stable-boy should have the paper tonight"}]}
{"id":"f.baxter_frightened","of":"baxter","attr":"condition","value":"frightened by the earnestness of his manner","time":{"at":"t.mon_stranger_meets"},"para":25,"quote":"She was frightened by the earnestness of his manner"}
{"id":"f.baxter_runs_window","of":"baxter","attr":"action","value":"runs past him to the window where she hands in the meals","time":{"at":"t.mon_maid_at_window"},"para":25,"quote":"ran past him to the window through which she was accustomed to hand the meals"}
{"id":"f.baxter_at_window","of":"baxter","attr":"location","value":"stable_window","detail":"outside","time":{"from":"t.mon_maid_at_window","to":"t.mon_hunter_for_dog"},"para":25,"quote":"ran past him to the window"}
{"id":"f.window_meals","of":"stable_window","attr":"role","value":"the window through which meals are handed in","time":{"at":"t.mon_maid_at_window"},"para":25,"quote":"through which she was accustomed to hand the meals"}
{"id":"f.window_open","of":"stable_window","attr":"condition","value":"already open","time":{"at":"t.mon_maid_at_window"},"para":25,"quote":"It was already opened"}
{"id":"f.hunter_at_table","of":"hunter","attr":"location","value":"stable_table","detail":"seated, inside","time":{"from":"t.mon_maid_at_window","to":"t.mon_hunter_for_dog"},"para":25,"quote":"Hunter was seated at the small table inside"}
{"id":"f.baxter_begins_tell","of":"baxter","attr":"action","value":"begins to tell Hunter what has happened","time":{"at":"t.mon_maid_at_window"},"para":25,"quote":"She had begun to tell him of what had happened"}
{"id":"f.stranger_at_window","of":"the_stranger","attr":"location","value":"stable_window","detail":"looking through it","time":{"from":"t.mon_stranger_at_window","to":"t.mon_hunter_for_dog"},"para":25,"quote":"when the stranger came up again"}
{"id":"f.stranger_says_word","of":"the_stranger","attr":"says","value":"good evening; he wants a word with Hunter","to":"hunter","time":{"at":"t.mon_stranger_at_window"},"para":26,"quote":"I wanted to have a word with you."}
{"id":"f.baxter_sees_packet","of":"baxter","attr":"observes","value":"the corner of the paper packet protruding from the stranger's closed hand","time":{"at":"t.mon_stranger_at_window"},"para":26,"quote":"she noticed the corner of the little paper packet protruding from his closed hand"}
{"id":"f.baxter_swears","of":"baxter","attr":"tells","value":"acct.baxter","to":"police","how":"sworn statement","time":{"at":"t.baxter_sworn"},"para":26,"quote":"The girl has sworn"}
{"id":"f.hunter_asks_business","of":"hunter","attr":"says","value":"asks what business the stranger has there","to":"the_stranger","time":{"at":"t.mon_stranger_at_window"},"para":27,"quote":"What business have you here?"}
{"id":"f.stranger_asks_tip","of":"the_stranger","attr":"says","value":"business that may put something in Hunter's pocket; asks for the straight tip, whether Bayard could beat Silver Blaze and the stable has its money on Bayard","to":"hunter","time":{"at":"t.mon_stranger_at_window"},"para":28,"quote":"Is it a fact that at the weights Bayard could give the other a hundred yards in five furlongs","asserts":[{"of":"bayard","attr":"member_of","value":"kp_horses"},{"of":"bayard","attr":"role","value":"King's Pyland entry for the Wessex Cup"},{"of":"silver_blaze","attr":"role","value":"King's Pyland entry for the Wessex Cup"},{"of":"bayard","attr":"condition","value":"could give Silver Blaze a hundred yards in five furlongs at the weights","modal":"possible"}]}
{"id":"f.hunter_says_tout","of":"hunter","attr":"says","value":"the stranger is one of those damned touts; he'll show him how they serve them","to":"the_stranger","time":{"at":"t.mon_stranger_at_window"},"para":29,"quote":"So, you’re one of those damned touts!","asserts":[{"of":"the_stranger","attr":"role","value":"a racing tout"}]}
{"id":"f.hunter_rushes_dog","of":"hunter","attr":"action","value":"springs up and rushes across the stable to unloose the dog","time":{"at":"t.mon_hunter_for_dog"},"para":29,"quote":"He sprang up and rushed across the stable to unloose the dog"}
{"id":"f.dog_in_stable","of":"dog","attr":"lives_at","value":"stables","basis":"implied","time":{"at":"t.mon_hunter_for_dog"},"para":29,"quote":"rushed across the stable to unloose the dog"}
{"id":"f.baxter_flees","of":"baxter","attr":"action","value":"flees to the house","time":{"at":"t.mon_hunter_for_dog"},"para":29,"quote":"The girl fled away to the house"}
{"id":"f.baxter_home","of":"baxter","attr":"location","value":"straker_villa","time":{"at":"t.mon_maid_home"},"para":29,"quote":"The girl fled away to the house"}
{"id":"f.baxter_sees_leaning","of":"baxter","attr":"observes","value":"the stranger leaning through the window","time":{"at":"t.mon_hunter_for_dog"},"para":29,"quote":"as she ran she looked back and saw that the stranger was leaning through the window"}
{"id":"f.stranger_leaning","of":"the_stranger","attr":"location","value":"stable_window","detail":"leaning through the window","time":{"at":"t.mon_hunter_for_dog"},"para":29,"quote":"the stranger was leaning through the window"}
{"id":"f.hunter_rushes_out","of":"hunter","attr":"action","value":"rushes out with the hound a minute later","time":{"at":"t.mon_hunter_runs_out"},"para":29,"quote":"A minute later, however, when Hunter rushed out with the hound"}
{"id":"f.hunter_outside","of":"hunter","attr":"location","value":"moor","detail":"running all round the buildings, with the dog","time":{"at":"t.mon_hunter_runs_out"},"para":29,"quote":"he ran all round the buildings"}
{"id":"f.dog_outside","of":"dog","attr":"location","value":"moor","detail":"out round the buildings with Hunter","time":{"at":"t.mon_hunter_runs_out"},"para":29,"quote":"when Hunter rushed out with the hound"}
{"id":"f.stranger_gone","of":"the_stranger","attr":"location","value":"stable_window","neg":true,"detail":"gone","time":{"at":"t.mon_hunter_runs_out"},"para":29,"quote":"he was gone"}
{"id":"f.hunter_no_trace","of":"hunter","attr":"observes","value":"no trace of the stranger round the buildings","time":{"at":"t.mon_hunter_runs_out"},"para":29,"quote":"he failed to find any trace of him"}
{"id":"f.watson_asks_door","of":"watson","attr":"action","act":"ask","thing":"stable_door","value":"asks whether the stable-boy left the door unlocked when he ran out with the dog","time":{"at":"t.thu_on_line"},"para":30,"quote":"Did the stable-boy, when he ran out with the dog, leave the door unlocked behind him?"}
{"id":"f.holmes_praises","of":"holmes","attr":"says","value":"Watson's question is excellent","to":"watson","time":{"at":"t.thu_on_line"},"para":31,"quote":"Excellent, Watson, excellent!"}
{"id":"f.holmes_believes_door_point","of":"holmes","attr":"believes","value":"whether the door was left unlocked is an important point","time":{"at":"t.wed"},"para":31,"quote":"The importance of the point struck me so forcibly"}
{"id":"f.holmes_sends_wire","of":"holmes","attr":"action","value":"sends a special wire to Dartmoor to clear up the point of the door","time":{"at":"t.wed"},"para":31,"quote":"I sent a special wire to Dartmoor yesterday to clear the matter up"}
{"id":"f.wire_reply_tells","of":"?","attr":"tells","value":"acct.hunter","partial":true,"to":"holmes","how":"telegram","time":{"at":"t.wire_reply"},"para":31,"quote":"to clear the matter up"}
{"id":"f.holmes_tells_wire","of":"holmes","attr":"tells","value":"acct.holmes","to":"watson","how":"told","time":{"at":"t.thu_on_line"},"para":31,"quote":"I sent a special wire to Dartmoor yesterday"}
{"id":"f.hunter_locks_door","of":"hunter","attr":"action","act":"lock","thing":"stable_door","value":"locks the door before leaving the stable","time":{"at":"t.mon_hunter_runs_out"},"para":31,"quote":"The boy locked the door before he left it."}
{"id":"f.door_locked_after","of":"stable_door","attr":"door","value":"locked","time":{"from":"t.mon_hunter_runs_out"},"para":31,"quote":"The boy locked the door before he left it."}
{"id":"f.window_small","of":"stable_window","attr":"condition","value":"not large enough for a man to get through","time":{"at":"t.mon_hunter_for_dog"},"para":31,"quote":"The window, I may add, was not large enough for a man to get through."}
{"id":"f.hunter_waits","of":"hunter","attr":"action","value":"waits until the other grooms return","time":{"after":"t.mon_hunter_runs_out","before":"t.mon_lads_return"},"para":32,"quote":"Hunter waited until his fellow-grooms had returned"}
{"id":"f.lads_back","of":"other_lads","attr":"location","value":"stables","time":{"at":"t.mon_lads_return"},"para":32,"quote":"his fellow-grooms had returned"}
{"id":"f.hunter_tells_straker","of":"hunter","attr":"tells","value":"acct.hunter","partial":true,"to":"straker","how":"told","time":{"at":"t.mon_lads_return"},"para":32,"quote":"he sent a message to the trainer and told him what had occurred"}
{"id":"f.straker_excited","of":"straker","attr":"condition","value":"excited at hearing the account","time":{"after":"t.mon_lads_return","before":"t.tue_one_am"},"para":32,"quote":"Straker was excited at hearing the account"}
{"id":"f.straker_not_realise","of":"straker","attr":"knows","value":"the true significance of the account","neg":true,"time":{"after":"t.mon_lads_return","before":"t.tue_one_am"},"para":32,"quote":"he does not seem to have quite realized its true significance"}
{"id":"f.straker_uneasy","of":"straker","attr":"condition","value":"vaguely uneasy","time":{"after":"t.mon_lads_return","before":"t.straker_leaves"},"para":32,"quote":"It left him, however, vaguely uneasy"}
{"id":"f.mrs_straker_wakes_one","of":"mrs_straker","attr":"action","value":"wakes and finds her husband dressing","time":{"at":"t.tue_one_am"},"para":32,"quote":"Mrs. Straker, waking at one in the morning, found that he was dressing"}
{"id":"f.clock_one","of":"clock","attr":"hour","value":"one in the morning","time":{"at":"t.tue_one_am"},"para":32,"quote":"at one in the morning"}
{"id":"f.straker_dressing","of":"straker","attr":"action","value":"dressing","time":{"at":"t.tue_one_am"},"para":32,"quote":"found that he was dressing"}
{"id":"f.straker_at_villa_one","of":"straker","attr":"location","value":"straker_villa","basis":"implied","time":{"from":"t.tue_one_am","to":"t.straker_leaves"},"para":32,"quote":"found that he was dressing"}
{"id":"f.mrs_straker_at_villa","of":"mrs_straker","attr":"location","value":"straker_villa","basis":"implied","time":{"from":"t.tue_one_am","to":"t.tue_seven"},"para":32,"quote":"Mrs. Straker, waking at one in the morning"}
{"id":"f.straker_says_anxiety","of":"straker","attr":"says","value":"he cannot sleep for anxiety about the horses and will walk down to the stables to see all is well","to":"mrs_straker","time":{"at":"t.tue_one_am"},"para":32,"quote":"he said that he could not sleep on account of his anxiety about the horses","asserts":[{"of":"straker","attr":"condition","value":"cannot sleep for anxiety about the horses"},{"of":"straker","attr":"intends","value":"to walk down to the stables to see that all is well"}]}
{"id":"f.mrs_straker_begs","of":"mrs_straker","attr":"says","value":"begs him to remain at home","to":"straker","time":{"at":"t.tue_one_am"},"para":32,"quote":"She begged him to remain at home"}
{"id":"f.rain_one","of":"weather","attr":"condition","value":"raining","time":{"at":"t.tue_one_am"},"para":32,"quote":"she could hear the rain pattering against the window"}
{"id":"f.straker_mackintosh","of":"straker","attr":"wearing","value":"straker_coat","time":{"from":"t.straker_leaves"},"para":32,"quote":"he pulled on his large mackintosh"}
{"id":"f.straker_leaves","of":"straker","attr":"action","value":"leaves the house in spite of her entreaties","time":{"at":"t.straker_leaves"},"para":32,"quote":"in spite of her entreaties he pulled on his large mackintosh and left the house"}
{"id":"f.mrs_straker_wakes_seven","of":"mrs_straker","attr":"action","value":"wakes at seven","time":{"at":"t.tue_seven"},"para":33,"quote":"Mrs. Straker awoke at seven in the morning"}
{"id":"f.clock_seven","of":"clock","attr":"hour","value":"seven in the morning","time":{"at":"t.tue_seven"},"para":33,"quote":"at seven in the morning"}
{"id":"f.straker_not_returned","of":"straker","attr":"location","value":"straker_villa","neg":true,"detail":"not yet returned","time":{"at":"t.tue_seven"},"para":33,"quote":"her husband had not yet returned"}
{"id":"f.mrs_straker_wife","of":"mrs_straker","attr":"role","value":"Straker's wife","basis":"implied","time":{"at":"t.tue_seven"},"para":33,"quote":"her husband"}
{"id":"f.mrs_straker_sets_off","of":"mrs_straker","attr":"action","value":"dresses hastily, calls the maid and sets off for the stables","time":{"after":"t.tue_seven","before":"t.tue_at_stables"},"para":33,"quote":"She dressed herself hastily, called the maid, and set off for the stables."}
{"id":"f.mrs_straker_at_stables","of":"mrs_straker","attr":"location","value":"stables","time":{"at":"t.tue_at_stables"},"para":33,"quote":"set off for the stables"}
{"id":"f.baxter_at_stables","of":"baxter","attr":"location","value":"stables","time":{"at":"t.tue_at_stables"},"para":33,"quote":"called the maid, and set off for the stables"}
{"id":"f.door_open","of":"stable_door","attr":"door","value":"open","time":{"at":"t.tue_at_stables"},"para":33,"quote":"The door was open"}
{"id":"f.hunter_on_chair","of":"hunter","attr":"location","value":"stables","detail":"huddled on a chair","time":{"at":"t.tue_at_stables"},"para":33,"quote":"inside, huddled together upon a chair"}
{"id":"f.hunter_stupor","of":"hunter","attr":"condition","value":"in a state of absolute stupor","time":{"from":"t.tue_at_stables","to":"t.hunter_recovers"},"para":33,"quote":"Hunter was sunk in a state of absolute stupor"}
{"id":"f.stall_empty","of":"silver_blaze","attr":"location","value":"favourite_stall","neg":true,"time":{"at":"t.tue_at_stables"},"para":33,"quote":"the favourite’s stall was empty"}
{"id":"f.no_sign_straker","of":"straker","attr":"location","value":"stables","neg":true,"time":{"at":"t.tue_at_stables"},"para":33,"quote":"there were no signs of his trainer"}
{"id":"f.lads_in_loft","of":"other_lads","attr":"location","value":"stable_loft","detail":"asleep","time":{"from":"t.mon_lads_return","to":"t.tue_at_stables"},"para":34,"quote":"The two lads who slept in the chaff-cutting loft above the harness-room"}
{"id":"f.loft_above","of":"stable_loft","attr":"position","value":"above the harness-room","time":{"at":"t.tue_at_stables"},"para":34,"quote":"the chaff-cutting loft above the harness-room"}
{"id":"f.lads_aroused","of":"other_lads","attr":"action","value":"are quickly aroused","time":{"at":"t.tue_at_stables"},"para":34,"quote":"were quickly aroused"}
{"id":"f.lads_heard_nothing","of":"other_lads","attr":"says","value":"they heard nothing during the night","time":{"at":"t.tue_at_stables"},"para":34,"quote":"They had heard nothing during the night","asserts":[{"of":"other_lads","attr":"observes","value":"any sound in the night","neg":true,"time":{"from":"t.mon_lads_return","to":"t.tue_at_stables"}}]}
{"id":"f.lads_sound_sleepers","of":"other_lads","attr":"condition","value":"both sound sleepers","time":{"at":"t.tue_at_stables"},"para":34,"quote":"for they are both sound sleepers"}
{"id":"f.hunter_drugged","of":"hunter","attr":"condition","value":"under the influence of some powerful drug; no sense to be got out of him","time":{"at":"t.tue_at_stables"},"para":34,"quote":"Hunter was obviously under the influence of some powerful drug"}
{"id":"f.hunter_left_sleep","of":"hunter","attr":"condition","value":"left to sleep it off","time":{"from":"t.tue_at_stables","to":"t.hunter_recovers"},"para":34,"quote":"he was left to sleep it off"}
{"id":"f.party_mrs_straker","of":"mrs_straker","attr":"member_of","value":"search_party","time":{"from":"t.tue_at_stables","to":"t.tue_hollow"},"para":34,"quote":"the two lads and the two women"}
{"id":"f.party_baxter","of":"baxter","attr":"member_of","value":"search_party","time":{"from":"t.tue_at_stables","to":"t.tue_hollow"},"para":34,"quote":"the two lads and the two women"}
{"id":"f.party_lads","of":"other_lads","attr":"member_of","value":"search_party","time":{"from":"t.tue_at_stables","to":"t.tue_hollow"},"para":34,"quote":"the two lads and the two women"}
{"id":"f.party_searches","of":"search_party","attr":"action","value":"run out in search of Straker and the horse","time":{"after":"t.tue_at_stables","before":"t.tue_knoll"},"para":34,"quote":"ran out in search of the absentees"}
{"id":"f.party_hopes","of":"search_party","attr":"believes","value":"the trainer may have taken the horse out for early exercise","modal":"possible","time":{"after":"t.tue_at_stables","before":"t.tue_knoll"},"para":34,"quote":"They still had hopes that the trainer had for some reason taken out the horse for early exercise","asserts":[{"of":"straker","attr":"action","value":"took the horse out for early exercise","modal":"possible"}]}
{"id":"f.party_on_knoll","of":"search_party","attr":"location","value":"knoll","time":{"at":"t.tue_knoll"},"para":34,"quote":"on ascending the knoll near the house"}
{"id":"f.knoll_view","of":"knoll","attr":"condition","value":"all the neighbouring moors are visible from it","time":{"at":"t.tue_knoll"},"para":34,"quote":"from which all the neighbouring moors were visible"}
{"id":"f.party_no_horse","of":"search_party","attr":"observes","value":"any sign of the missing favourite","neg":true,"time":{"at":"t.tue_knoll"},"para":34,"quote":"they not only could see no signs of the missing favourite"}
{"id":"f.party_sees_tragedy","of":"search_party","attr":"observes","value":"something that warns them of a tragedy","time":{"at":"t.tue_knoll"},"para":34,"quote":"they perceived something which warned them that they were in the presence of a tragedy"}
{"id":"f.coat_on_bush","of":"straker_coat","attr":"location","value":"furze_bush","detail":"flapping from it","time":{"at":"t.tue_hollow"},"para":35,"quote":"John Straker’s overcoat was flapping from a furze-bush"}
{"id":"f.bush_distance","of":"furze_bush","attr":"position","value":"about a quarter of a mile from the stables","time":{"at":"t.tue_hollow"},"para":35,"quote":"About a quarter of a mile from the stables"}
{"id":"f.hollow_beyond","of":"hollow","attr":"position","value":"a bowl-shaped depression immediately beyond the furze-bush","time":{"at":"t.tue_hollow"},"para":35,"quote":"Immediately beyond there was a bowl-shaped depression in the moor"}
{"id":"f.body_in_hollow","of":"straker","attr":"location","value":"hollow","detail":"dead, at the bottom","time":{"at":"t.tue_hollow"},"para":35,"quote":"at the bottom of this was found the dead body of the unfortunate trainer"}
{"id":"f.straker_dead","of":"straker","attr":"condition","value":"dead","time":{"from":"t.crime"},"para":35,"quote":"the dead body of the unfortunate trainer"}
{"id":"f.head_shattered","of":"straker","attr":"condition","value":"head shattered by a savage blow from some heavy weapon","time":{"at":"t.tue_hollow"},"para":35,"quote":"His head had been shattered by a savage blow from some heavy weapon"}
{"id":"f.thigh_cut","of":"straker","attr":"condition","value":"a long clean cut on the thigh from some very sharp instrument","time":{"at":"t.tue_hollow"},"para":35,"quote":"he was wounded on the thigh, where there was a long, clean cut"}
{"id":"f.straker_defended","of":"straker","attr":"action","value":"defended himself vigorously against his assailants","time":{"at":"t.crime"},"para":35,"quote":"Straker had defended himself vigorously against his assailants"}
{"id":"f.straker_knife","of":"straker","attr":"carrying","value":"straker_knife","detail":"held in his right hand","time":{"at":"t.tue_hollow"},"para":35,"quote":"in his right hand he held a small knife"}
{"id":"f.knife_blood","of":"straker_knife","attr":"condition","value":"clotted with blood up to the handle","time":{"at":"t.tue_hollow"},"para":35,"quote":"which was clotted with blood up to the handle"}
{"id":"f.straker_cravat","of":"straker","attr":"carrying","value":"cravat","detail":"clasped in his left hand","time":{"at":"t.tue_hollow"},"para":35,"quote":"in his left he clasped a red and black silk cravat"}
{"id":"f.baxter_recognises","of":"baxter","attr":"says","value":"the cravat was worn the evening before by the stranger who visited the stables","time":{"after":"t.tue_hollow","before":"t.thu_on_line"},"para":35,"quote":"which was recognised by the maid as having been worn on the preceding evening by the stranger","asserts":[{"of":"the_stranger","attr":"wearing","value":"cravat","time":{"at":"t.mon_stranger_meets"}}]}
{"id":"f.hunter_recovers","of":"hunter","attr":"condition","value":"recovered from his stupor","time":{"at":"t.hunter_recovers"},"para":36,"quote":"Hunter, on recovering from his stupor"}
{"id":"f.hunter_cravat","of":"hunter","attr":"says","value":"he is quite positive the cravat is the stranger's","time":{"after":"t.hunter_recovers","before":"t.thu_on_line"},"para":36,"quote":"was also quite positive as to the ownership of the cravat","asserts":[{"of":"cravat","attr":"owner","value":"the_stranger"}]}
{"id":"f.hunter_believes_drugged","of":"hunter","attr":"believes","value":"the stranger drugged his curried mutton while standing at the window","time":{"after":"t.hunter_recovers","before":"t.thu_on_line"},"para":36,"quote":"He was equally certain that the same stranger had, while standing at the window, drugged his curried mutton","asserts":[{"of":"the_stranger","attr":"action","act":"drug","thing":"curried_mutton","value":"drugs Hunter's curried mutton at the window","time":{"at":"t.mon_hunter_for_dog"}}]}
{"id":"f.horse_in_hollow","of":"silver_blaze","attr":"location","value":"hollow","detail":"abundant proofs in the mud","time":{"at":"t.crime"},"para":37,"quote":"there were abundant proofs in the mud which lay at the bottom of the fatal hollow that he had been there at the time of the struggle"}
{"id":"f.horse_gone_since","of":"silver_blaze","attr":"condition","value":"disappeared; no news of him","time":{"from":"t.tue_hollow","to":"t.thu_on_line"},"para":37,"quote":"from that morning he has disappeared"}
{"id":"f.reward","of":"silver_blaze","attr":"condition","value":"a large reward offered for him","time":{"from":"t.reward"},"para":37,"quote":"although a large reward has been offered"}
{"id":"f.gypsies_alert","of":"gypsies","attr":"action","value":"are on the alert for the horse","time":{"from":"t.reward","to":"t.thu_on_line"},"para":37,"quote":"all the gypsies of Dartmoor are on the alert"}
{"id":"f.hunter_ate","of":"hunter","attr":"action","value":"eats part of his supper and leaves the remains","basis":"implied","time":{"at":"t.hunter_eats_supper"},"para":37,"quote":"the remains of his supper left by the stable-lad"}
{"id":"f.analysis_opium","of":"curried_mutton","attr":"contents","value":"opium","detail":"an appreciable quantity of powdered opium in the remains","time":{"at":"t.analysis"},"para":37,"quote":"contain an appreciable quantity of powdered opium"}
{"id":"f.household_ate","of":"household","attr":"action","value":"eat the same dish the same night without ill effect","time":{"at":"t.mon_lads_supper"},"para":37,"quote":"the people at the house partook of the same dish on the same night without any ill effect"}
{"id":"f.holmes_says_main_facts","of":"holmes","attr":"says","value":"those are the main facts, stripped of all surmise; he will now recapitulate what the police have done","to":"watson","time":{"at":"t.thu_on_line"},"para":38,"quote":"Those are the main facts of the case, stripped of all surmise"}
{"id":"f.holmes_says_gregory","of":"holmes","attr":"says","value":"Gregory is an extremely competent officer who lacks imagination","to":"watson","time":{"at":"t.thu_on_line"},"para":39,"quote":"Were he but gifted with imagination he might rise to great heights in his profession.","asserts":[{"of":"gregory","attr":"reputed","value":"extremely competent but without imagination"}]}
{"id":"f.gregory_arrives","of":"gregory","attr":"location","value":"kings_pyland","basis":"implied","time":{"at":"t.gregory_arrives"},"para":39,"quote":"On his arrival"}
{"id":"f.gregory_arrests","of":"gregory","attr":"action","value":"promptly finds and arrests the man upon whom suspicion naturally rested","time":{"at":"t.simpson_arrest"},"para":39,"quote":"he promptly found and arrested the man upon whom suspicion naturally rested"}
{"id":"f.simpson_lives_villa","of":"simpson","attr":"lives_at","value":"villas","time":{"from":"t.simpson_arrives","to":"t.simpson_arrest"},"para":39,"quote":"he inhabited one of those villas which I have mentioned"}
{"id":"f.name_simpson","of":"simpson","attr":"name","value":"Fitzroy Simpson","time":{"at":"t.simpson_arrest"},"para":39,"quote":"His name, it appears, was Fitzroy Simpson."}
{"id":"f.simpson_birth","of":"simpson","attr":"condition","value":"of excellent birth and education","time":{"at":"t.simpson_arrest"},"para":39,"quote":"He was a man of excellent birth and education"}
{"id":"f.simpson_squandered","of":"simpson","attr":"action","value":"squanders a fortune on the turf","time":{"at":"t.simpson_squanders"},"para":39,"quote":"who had squandered a fortune upon the turf"}
{"id":"f.simpson_bookmaker","of":"simpson","attr":"role","value":"a quiet and genteel bookmaker in the sporting clubs of London","time":{"after":"t.simpson_squanders","before":"t.simpson_arrest"},"para":39,"quote":"lived now by doing a little quiet and genteel book-making in the sporting clubs of London"}
{"id":"f.police_examine_book","of":"gregory","attr":"action","value":"examines Simpson's betting-book","time":{"after":"t.simpson_arrest","before":"t.thu_on_line"},"para":39,"quote":"An examination of his betting-book"}
{"id":"f.book_owner","of":"betting_book","attr":"owner","value":"simpson","basis":"implied","time":{"at":"t.simpson_arrest"},"para":39,"quote":"his betting-book"}
{"id":"f.book_contents","of":"betting_book","attr":"contents","value":"bets of five thousand pounds against the favourite","time":{"from":"t.simpson_bets"},"para":39,"quote":"bets to the amount of five thousand pounds had been registered by him against the favourite"}
{"id":"f.simpson_bets_against","of":"simpson","attr":"action","value":"registers bets of five thousand pounds against the favourite","time":{"at":"t.simpson_bets"},"para":39,"quote":"bets to the amount of five thousand pounds had been registered by him against the favourite"}
{"id":"f.simpson_says_came","of":"simpson","attr":"says","value":"he came down to Dartmoor hoping for information about the King's Pyland horses and Desborough","to":"gregory","time":{"at":"t.simpson_arrest"},"para":40,"quote":"On being arrested he volunteered the statement that he had come down to Dartmoor in the hope of getting some information","asserts":[{"of":"simpson","attr":"intends","value":"to get information about the King's Pyland horses and Desborough","time":{"at":"t.simpson_arrives"}}]}
{"id":"f.desborough_second","of":"desborough","attr":"role","value":"second favourite for the Wessex Cup","time":{"at":"t.crime"},"para":40,"quote":"Desborough, the second favourite"}
{"id":"f.desborough_mapleton","of":"desborough","attr":"lives_at","value":"mapleton","detail":"in charge of Silas Brown","time":{"at":"t.crime"},"para":40,"quote":"which was in charge of Silas Brown at the Mapleton stables"}
{"id":"f.simpson_admits","of":"simpson","attr":"says","value":"does not deny having acted as described the evening before","to":"gregory","time":{"at":"t.simpson_arrest"},"para":40,"quote":"He did not attempt to deny that he had acted as described upon the evening before"}
{"id":"f.stranger_identity","of":"the_stranger","attr":"identity","value":"simpson","time":{"at":"t.mon_stranger_meets"},"para":40,"quote":"He did not attempt to deny that he had acted as described upon the evening before"}
{"id":"f.simpson_says_no_designs","of":"simpson","attr":"says","value":"he had no sinister designs and simply wished first-hand information","to":"gregory","time":{"at":"t.simpson_arrest"},"para":40,"quote":"declared that he had no sinister designs, and had simply wished to obtain first-hand information","asserts":[{"of":"simpson","attr":"intends","value":"only to obtain first-hand information","time":{"at":"t.mon_stranger_meets"}}]}
{"id":"f.gregory_confronts","of":"gregory","attr":"action","value":"confronts Simpson with his cravat","time":{"at":"t.simpson_arrest"},"para":40,"quote":"When confronted with his cravat"}
{"id":"f.cravat_owner","of":"cravat","attr":"owner","value":"simpson","time":{"at":"t.simpson_arrest"},"para":40,"quote":"When confronted with his cravat"}
{"id":"f.simpson_pale","of":"simpson","attr":"condition","value":"turns very pale; utterly unable to account for the cravat in the dead man's hand","time":{"at":"t.simpson_arrest"},"para":40,"quote":"he turned very pale, and was utterly unable to account for its presence in the hand of the murdered man"}
{"id":"f.simpson_wet","of":"simpson","attr":"condition","value":"clothing wet","time":{"at":"t.simpson_arrest"},"para":40,"quote":"His wet clothing"}
{"id":"f.simpson_out_storm","of":"simpson","attr":"location","value":null,"detail":"out of doors in the storm","time":{"at":"t.night_storm"},"para":40,"quote":"he had been out in the storm of the night before"}
{"id":"f.storm","of":"weather","attr":"condition","value":"storm","time":{"at":"t.night_storm"},"para":40,"quote":"the storm of the night before"}
{"id":"f.simpson_stick_owner","of":"simpson_stick","attr":"owner","value":"simpson","time":{"at":"t.simpson_arrest"},"para":40,"quote":"his stick, which was a Penang-lawyer weighted with lead"}
{"id":"f.stick_lead","of":"simpson_stick","attr":"condition","value":"a Penang-lawyer weighted with lead","time":{"at":"t.simpson_arrest"},"para":40,"quote":"a Penang-lawyer weighted with lead"}
{"id":"f.stick_weapon","of":"simpson_stick","attr":"condition","value":"just such a weapon as might, by repeated blows, have inflicted Straker's injuries","time":{"at":"t.simpson_arrest"},"para":40,"quote":"was just such a weapon as might, by repeated blows, have inflicted the terrible injuries"}
{"id":"f.simpson_unwounded","of":"simpson","attr":"condition","value":"wounded","neg":true,"time":{"at":"t.simpson_arrest"},"para":41,"quote":"there was no wound upon his person"}
{"id":"f.holmes_says_marked","of":"holmes","attr":"says","value":"the state of Straker's knife shows that one at least of his assailants must bear his mark","to":"watson","time":{"at":"t.thu_on_line"},"para":41,"quote":"the state of Straker’s knife would show that one at least of his assailants must bear his mark upon him","asserts":[{"of":"straker","attr":"action","value":"wounded one of his assailants with his knife","time":{"at":"t.crime"}}]}
{"id":"f.holmes_asks_light","of":"holmes","attr":"action","act":"ask","value":"asks Watson for any light on the case","time":{"at":"t.thu_on_line"},"para":41,"quote":"if you can give me any light I shall be infinitely obliged to you"}
{"id":"f.watson_listens","of":"watson","attr":"action","value":"listens with the greatest interest to Holmes's statement","time":{"at":"t.thu_on_line"},"para":42,"quote":"I had listened with the greatest interest to the statement"}
{"id":"f.watson_knew_facts","of":"watson","attr":"knows","value":"most of the facts of the case","time":{"at":"t.thu_on_line"},"para":42,"quote":"Though most of the facts were familiar to me"}
{"id":"f.watson_not_appreciated","of":"watson","attr":"knows","value":"the relative importance of the facts and their connection","neg":true,"time":{"at":"t.watson_reads"},"para":42,"quote":"I had not sufficiently appreciated their relative importance, nor their connection to each other"}
{"id":"f.watson_suggests_cut","of":"watson","attr":"says","value":"the cut on Straker's thigh may have been made by his own knife in the convulsions after the blow to his head","to":"holmes","time":{"at":"t.thu_on_line"},"para":43,"quote":"the incised wound upon Straker may have been caused by his own knife in the convulsive struggles which follow any brain injury","asserts":[{"of":"straker","attr":"action","value":"cut his own thigh with his knife in convulsions after the blow","modal":"possible","time":{"at":"t.crime"}}]}
{"id":"f.holmes_says_probable","of":"holmes","attr":"says","value":"it is more than possible, it is probable","to":"watson","time":{"at":"t.thu_on_line"},"para":44,"quote":"It is more than possible; it is probable","asserts":[{"of":"straker","attr":"action","value":"cut his own thigh with his knife in convulsions after the blow","modal":"possible","time":{"at":"t.crime"}}]}
{"id":"f.holmes_says_point_gone","of":"holmes","attr":"says","value":"in that case one of the main points in favour of the accused disappears","to":"watson","time":{"at":"t.thu_on_line"},"para":44,"quote":"In that case one of the main points in favour of the accused disappears."}
{"id":"f.watson_says_fail","of":"watson","attr":"says","value":"he still fails to understand what the police theory can be","to":"holmes","time":{"at":"t.thu_on_line"},"para":45,"quote":"even now I fail to understand what the theory of the police can be"}
{"id":"f.holmes_says_objections","of":"holmes","attr":"says","value":"whatever theory they state has very grave objections","to":"watson","time":{"at":"t.thu_on_line"},"para":46,"quote":"I am afraid that whatever theory we state has very grave objections to it"}
{"id":"f.holmes_says_police_theory","of":"holmes","attr":"says","value":"the police imagine that Simpson drugged the lad, used a duplicate key, took out the horse bridled, killed Straker with his stick when met, and then hid the horse or lost it","to":"watson","time":{"at":"t.thu_on_line"},"para":46,"quote":"The police imagine, I take it, that this Fitzroy Simpson, having drugged the lad"}
{"id":"f.police_theory","of":"police","attr":"believes","value":"Simpson drugged Hunter, opened the stable with a duplicate key, led off the bridled horse, beat Straker to death, and hid the horse or let it bolt","claim":"f.holmes_says_police_theory","time":{"at":"t.thu_on_line"},"para":46,"quote":"That is the case as it appears to the police","asserts":[{"of":"simpson","attr":"action","act":"drug","thing":"curried_mutton","value":"drugs the lad","time":{"at":"t.mon_hunter_for_dog"}},{"of":"simpson","attr":"carrying","value":"duplicate_key","time":{"at":"t.horse_leaves_stall"}},{"of":"simpson","attr":"action","act":"open","thing":"stable_door","value":"opens the stable door and leaves it open","time":{"at":"t.horse_leaves_stall"}},{"of":"simpson","attr":"action","act":"lead_out","thing":"silver_blaze","value":"bridles the horse and leads him away over the moor, meaning to kidnap him","time":{"at":"t.horse_leaves_stall"}},{"of":"simpson","attr":"action","act":"strike","thing":"straker","value":"beats out the trainer's brains with his heavy stick, unhurt by the knife","time":{"at":"t.crime"}},{"of":"silver_blaze","attr":"location","value":null,"detail":"led to a secret hiding-place, or bolted and wandering on the moors","modal":"possible","time":{"at":"t.thu_on_line"}}]}
{"id":"f.bridle_missing","of":"bridle","attr":"condition","value":"missing","time":{"from":"t.tue_at_stables"},"para":46,"quote":"His bridle is missing"}
{"id":"f.holmes_says_improbable","of":"holmes","attr":"says","value":"the police case is improbable, but all other explanations are more improbable still","to":"watson","time":{"at":"t.thu_on_line"},"para":46,"quote":"improbable as it is, all other explanations are more improbable still"}
{"id":"f.holmes_intends_test","of":"holmes","attr":"intends","value":"to test the matter quickly once on the spot","time":{"at":"t.thu_on_line"},"para":46,"quote":"I shall very quickly test the matter when I am once upon the spot"}
{"id":"f.reports_reach_press","of":"?","attr":"tells","value":["acct.baxter","acct.mrs_straker","acct.lads","acct.search"],"to":"newspapers","how":"report","time":{"after":"t.tue_hollow","before":"t.wed"},"para":12,"quote":"the embellishments of theorists and reporters"}
{"id":"f.police_reach_press","of":"gregory","attr":"tells","value":"acct.police","to":"newspapers","how":"report","time":{"after":"t.simpson_arrest","before":"t.thu_paddington"},"para":38,"quote":"I shall now recapitulate what the police have done in the matter."}
{"id":"f.watson_at_tavistock","of":"watson","attr":"location","value":"tavistock_station","time":{"at":"t.thu_tavistock"},"para":47,"quote":"It was evening before we reached the little town of Tavistock"}
{"id":"f.holmes_at_tavistock","of":"holmes","attr":"location","value":"tavistock_station","time":{"at":"t.thu_tavistock"},"para":47,"quote":"It was evening before we reached the little town of Tavistock"}
{"id":"f.clock_thu_evening","of":"clock","attr":"hour","value":"evening","time":{"at":"t.thu_tavistock"},"para":47,"quote":"It was evening before we reached"}
{"id":"f.tavistock_centre","of":"tavistock","attr":"position","value":"a little town in the middle of the huge circle of Dartmoor, like the boss of a shield","time":{"at":"t.thu_tavistock"},"para":47,"quote":"which lies, like the boss of a shield, in the middle of the huge circle of Dartmoor"}
{"id":"f.gregory_at_station","of":"gregory","attr":"location","value":"tavistock_station","detail":"awaiting them","time":{"at":"t.thu_tavistock"},"para":47,"quote":"Two gentlemen were awaiting us in the station"}
{"id":"f.ross_at_station","of":"ross","attr":"location","value":"tavistock_station","detail":"awaiting them","time":{"at":"t.thu_tavistock"},"para":47,"quote":"Two gentlemen were awaiting us in the station"}
{"id":"f.gregory_looks","of":"gregory","attr":"condition","value":"a tall, fair man with lion-like hair and beard and curiously penetrating light blue eyes","time":{"at":"t.thu_tavistock"},"para":47,"quote":"a tall, fair man with lion-like hair and beard and curiously penetrating light blue eyes"}
{"id":"f.ross_looks","of":"ross","attr":"condition","value":"a small, alert person, very neat and dapper, with trim little side-whiskers","time":{"at":"t.thu_tavistock"},"para":47,"quote":"a small, alert person, very neat and dapper"}
{"id":"f.ross_frock","of":"ross","attr":"wearing","value":"ross_frock_coat","time":{"at":"t.thu_tavistock"},"para":47,"quote":"in a frock-coat and gaiters"}
{"id":"f.ross_wears_gaiters","of":"ross","attr":"wearing","value":"ross_gaiters","time":{"at":"t.thu_tavistock"},"para":47,"quote":"in a frock-coat and gaiters"}
{"id":"f.ross_wears_eyeglass","of":"ross","attr":"wearing","value":"ross_eyeglass","time":{"at":"t.thu_tavistock"},"para":47,"quote":"and an eye-glass"}
{"id":"f.ross_sportsman","of":"ross","attr":"reputed","value":"the well-known sportsman","time":{"at":"t.thu_tavistock"},"para":47,"quote":"The latter was Colonel Ross, the well-known sportsman"}
{"id":"f.gregory_name_making","of":"gregory","attr":"reputed","value":"rapidly making his name in the English detective service","time":{"at":"t.thu_tavistock"},"para":47,"quote":"a man who was rapidly making his name in the English detective service"}
{"id":"f.gregory_member_service","of":"gregory","attr":"member_of","value":"detective_service","time":{"at":"t.thu_tavistock"},"para":47,"quote":"the English detective service"}
{"id":"f.ross_says_delighted","of":"ross","attr":"says","value":"he is delighted Holmes has come; the Inspector has done all that could be suggested","to":"holmes","time":{"at":"t.thu_tavistock"},"para":48,"quote":"The Inspector here has done all that could possibly be suggested","asserts":[{"of":"gregory","attr":"action","value":"has done all that could possibly be suggested"}]}
{"id":"f.ross_intends_avenge","of":"ross","attr":"intends","value":"to leave no stone unturned to avenge Straker and recover his horse","time":{"at":"t.thu_tavistock"},"para":48,"quote":"I wish to leave no stone unturned in trying to avenge poor Straker and in recovering my horse"}
{"id":"f.holmes_asks_developments","of":"holmes","attr":"action","act":"ask","value":"asks whether there have been any fresh developments","time":{"at":"t.thu_tavistock"},"para":49,"quote":"Have there been any fresh developments?"}
{"id":"f.gregory_says_little_progress","of":"gregory","attr":"says","value":"the police have made very little progress","to":"holmes","time":{"at":"t.thu_tavistock"},"para":50,"quote":"I am sorry to say that we have made very little progress"}
{"id":"f.landau_outside","of":"landau","attr":"location","value":"tavistock_station","detail":"an open carriage outside","time":{"at":"t.thu_tavistock"},"para":50,"quote":"We have an open carriage outside"}
{"id":"f.gregory_intends_drive","of":"gregory","attr":"intends","value":"to show them the place before the light fails and talk it over on the drive","time":{"at":"t.thu_tavistock"},"para":50,"quote":"we might talk it over as we drive"}
{"id":"f.watson_in_landau","of":"watson","attr":"location","value":"landau","time":{"from":"t.thu_landau"},"para":51,"quote":"A minute later we were all seated in a comfortable landau"}
{"id":"f.holmes_in_landau","of":"holmes","attr":"location","value":"landau","time":{"from":"t.thu_landau"},"para":51,"quote":"we were all seated in a comfortable landau"}
{"id":"f.gregory_in_landau","of":"gregory","attr":"location","value":"landau","time":{"from":"t.thu_landau"},"para":51,"quote":"we were all seated in a comfortable landau"}
{"id":"f.ross_in_landau","of":"ross","attr":"location","value":"landau","time":{"from":"t.thu_landau"},"para":51,"quote":"we were all seated in a comfortable landau"}
{"id":"f.landau_through_town","of":"landau","attr":"location","value":"tavistock","detail":"rattling through the old Devonshire city","time":{"at":"t.thu_landau"},"para":51,"quote":"were rattling through the quaint old Devonshire city"}
{"id":"f.gregory_pours_out","of":"gregory","attr":"action","value":"is full of his case and pours out a stream of remarks","time":{"at":"t.thu_landau"},"para":51,"quote":"Inspector Gregory was full of his case, and poured out a stream of remarks"}
{"id":"f.holmes_interjects","of":"holmes","attr":"action","value":"throws in an occasional question or interjection","time":{"at":"t.thu_landau"},"para":51,"quote":"while Holmes threw in an occasional question or interjection"}
{"id":"f.ross_leans_back","of":"ross","attr":"action","value":"leans back with his arms folded and his hat tilted over his eyes","time":{"at":"t.thu_landau"},"para":51,"quote":"Colonel Ross leaned back with his arms folded and his hat tilted over his eyes"}
{"id":"f.ross_hat_on","of":"ross","attr":"wearing","value":"ross_hat","detail":"tilted over his eyes","time":{"at":"t.thu_landau"},"para":51,"quote":"his hat tilted over his eyes"}
{"id":"f.watson_listens_drive","of":"watson","attr":"action","value":"listens with interest to the dialogue of the two detectives","time":{"at":"t.thu_landau"},"para":51,"quote":"I listened with interest to the dialogue of the two detectives"}
{"id":"f.gregory_theory_foretold","of":"watson","attr":"observes","value":"Gregory's theory is almost exactly what Holmes foretold in the train","time":{"at":"t.thu_landau"},"para":51,"quote":"Gregory was formulating his theory, which was almost exactly what Holmes had foretold in the train"}
{"id":"f.gregory_says_net","of":"gregory","attr":"says","value":"the net is drawn close round Fitzroy Simpson; he believes Simpson is the man","to":"holmes","time":{"at":"t.thu_landau"},"para":52,"quote":"The net is drawn pretty close round Fitzroy Simpson","asserts":[{"of":"simpson","attr":"action","act":"strike","thing":"straker","value":"kills Straker","time":{"at":"t.crime"}},{"of":"simpson","attr":"action","act":"lead_out","thing":"silver_blaze","value":"takes the horse from the stable","time":{"at":"t.horse_leaves_stall"}}]}
{"id":"f.gregory_believes_simpson","of":"gregory","attr":"believes","value":"Simpson is the man","time":{"at":"t.thu_landau"},"para":52,"quote":"I believe myself that he is our man"}
{"id":"f.gregory_says_circumstantial","of":"gregory","attr":"says","value":"the evidence is purely circumstantial and some new development may upset it","to":"holmes","time":{"at":"t.thu_landau"},"para":52,"quote":"I recognise that the evidence is purely circumstantial"}
{"id":"f.holmes_asks_knife","of":"holmes","attr":"action","act":"ask","thing":"straker_knife","value":"asks about Straker's knife","time":{"at":"t.thu_landau"},"para":53,"quote":"How about Straker’s knife?"}
{"id":"f.gregory_says_self_wound","of":"gregory","attr":"says","value":"the police have concluded Straker wounded himself in his fall","to":"holmes","time":{"at":"t.thu_landau"},"para":54,"quote":"We have quite come to the conclusion that he wounded himself in his fall.","asserts":[{"of":"straker","attr":"action","value":"wounds his own thigh with his knife in his fall","time":{"at":"t.crime"}}]}
{"id":"f.police_believe_self_wound","of":"police","attr":"believes","value":"Straker wounded himself with his own knife in his fall","claim":"f.gregory_says_self_wound","time":{"at":"t.thu_landau"},"para":54,"quote":"We have quite come to the conclusion"}
{"id":"f.holmes_says_watson_suggested","of":"holmes","attr":"says","value":"Watson made the same suggestion on the way down; if so it tells against Simpson","to":"gregory","time":{"at":"t.thu_landau"},"para":55,"quote":"My friend Dr. Watson made that suggestion to me as we came down."}
{"id":"f.gregory_says_no_knife","of":"gregory","attr":"says","value":"Simpson has neither a knife nor any sign of a wound","to":"holmes","time":{"at":"t.thu_landau"},"para":56,"quote":"He has neither a knife nor any sign of a wound."}
{"id":"f.simpson_no_knife","of":"simpson","attr":"carrying","value":"a knife","neg":true,"time":{"at":"t.simpson_arrest"},"para":56,"quote":"He has neither a knife"}
{"id":"f.gregory_says_evidence","of":"gregory","attr":"says","value":"the evidence is very strong: motive, suspicion of poisoning the lad, out in the storm, armed with a heavy stick, his cravat in the dead man's hand; enough for a jury","to":"holmes","time":{"at":"t.thu_landau"},"para":56,"quote":"I really think we have enough to go before a jury.","asserts":[{"of":"simpson","attr":"condition","value":"had a great interest in the disappearance of the favourite"},{"of":"simpson","attr":"action","act":"drug","thing":"curried_mutton","value":"poisons the stable-boy","modal":"possible","time":{"at":"t.mon_hunter_for_dog"}},{"of":"simpson","attr":"carrying","value":"simpson_stick","time":{"at":"t.crime"}}]}
{"id":"f.holmes_shakes_head","of":"holmes","attr":"action","value":"shakes his head","time":{"at":"t.thu_landau"},"para":57,"quote":"Holmes shook his head."}
{"id":"f.holmes_says_counsel","of":"holmes","attr":"says","value":"a clever counsel would tear the case to rags","to":"gregory","time":{"at":"t.thu_landau"},"para":57,"quote":"A clever counsel would tear it all to rags"}
{"id":"f.holmes_asks_why_out","of":"holmes","attr":"action","act":"ask","value":"asks why Simpson would take the horse out of the stable instead of injuring it there","time":{"at":"t.thu_landau"},"para":57,"quote":"Why should he take the horse out of the stable? If he wished to injure it why could he not do it there?"}
{"id":"f.holmes_asks_key","of":"holmes","attr":"action","act":"ask","thing":"duplicate_key","value":"asks whether a duplicate key has been found on Simpson","time":{"at":"t.thu_landau"},"para":57,"quote":"Has a duplicate key been found in his possession?"}
{"id":"f.holmes_asks_chemist","of":"holmes","attr":"action","act":"ask","thing":"opium","value":"asks what chemist sold Simpson the powdered opium","time":{"at":"t.thu_landau"},"para":57,"quote":"What chemist sold him the powdered opium?"}
{"id":"f.holmes_asks_hide","of":"holmes","attr":"action","act":"ask","value":"asks where Simpson, a stranger to the district, could hide such a horse","time":{"at":"t.thu_landau"},"para":57,"quote":"where could he, a stranger to the district, hide a horse, and such a horse as this?"}
{"id":"f.holmes_asks_paper","of":"holmes","attr":"action","act":"ask","thing":"paper_packet","value":"asks Simpson's explanation of the paper he wished the maid to give the stable-boy","time":{"at":"t.thu_landau"},"para":57,"quote":"What is his own explanation as to the paper which he wished the maid to give to the stable-boy?"}
{"id":"f.simpson_says_note","of":"simpson","attr":"says","value":"the paper was a ten-pound note","to":"gregory","time":{"after":"t.simpson_arrest","before":"t.thu_landau"},"para":58,"quote":"He says that it was a ten-pound note.","asserts":[{"of":"paper_packet","attr":"identity","value":"ten_pound_note"}]}
{"id":"f.note_in_purse","of":"ten_pound_note","attr":"location","value":"simpson_purse","time":{"at":"t.note_found"},"para":58,"quote":"One was found in his purse."}
{"id":"f.purse_owner","of":"simpson_purse","attr":"owner","value":"simpson","basis":"implied","time":{"at":"t.note_found"},"para":58,"quote":"his purse"}
{"id":"f.gregory_says_not_formidable","of":"gregory","attr":"says","value":"Holmes's other difficulties are not so formidable; Simpson is no stranger to the district","to":"holmes","time":{"at":"t.thu_landau"},"para":58,"quote":"But your other difficulties are not so formidable as they seem. He is not a stranger to the district."}
{"id":"f.simpson_lodged","of":"simpson","attr":"lives_at","value":"tavistock","detail":"lodged there twice in the summer","time":{"at":"t.simpson_lodged"},"para":58,"quote":"He has twice lodged at Tavistock in the summer."}
{"id":"f.gregory_says_opium_london","of":"gregory","attr":"says","value":"the opium was probably brought from London","to":"holmes","time":{"at":"t.thu_landau"},"para":58,"quote":"The opium was probably brought from London.","asserts":[{"of":"opium","attr":"location","value":"london","modal":"possible","time":{"at":"t.opium_bought"}}]}
{"id":"f.gregory_says_key_thrown","of":"gregory","attr":"says","value":"the key, having served its purpose, would be hurled away","to":"holmes","time":{"at":"t.thu_landau"},"para":58,"quote":"The key, having served its purpose, would be hurled away.","asserts":[{"of":"simpson","attr":"action","thing":"duplicate_key","value":"throws the duplicate key away","modal":"possible","time":{"at":"t.key_thrown"}}]}
{"id":"f.gregory_says_pits","of":"gregory","attr":"says","value":"the horse may be at the bottom of one of the pits or old mines on the moor","to":"holmes","time":{"at":"t.thu_landau"},"para":58,"quote":"The horse may be at the bottom of one of the pits or old mines upon the moor.","asserts":[{"of":"silver_blaze","attr":"location","value":"moor_pits","modal":"possible","time":{"at":"t.thu_landau"}}]}
{"id":"f.holmes_asks_cravat","of":"holmes","attr":"action","act":"ask","thing":"cravat","value":"asks what Simpson says about the cravat","time":{"at":"t.thu_landau"},"para":59,"quote":"What does he say about the cravat?"}
{"id":"f.simpson_owns_cravat_says","of":"simpson","attr":"says","value":"the cravat is his","to":"gregory","time":{"after":"t.simpson_arrest","before":"t.thu_landau"},"para":60,"quote":"He acknowledges that it is his","asserts":[{"of":"cravat","attr":"owner","value":"simpson"}]}
{"id":"f.simpson_says_lost","of":"simpson","attr":"says","value":"he had lost the cravat","to":"gregory","time":{"after":"t.simpson_arrest","before":"t.thu_landau"},"para":60,"quote":"declares that he had lost it","asserts":[{"of":"simpson","attr":"carrying","value":"cravat","neg":true,"time":{"from":"t.cravat_lost"}}]}
{"id":"f.gregory_says_new_element","of":"gregory","attr":"says","value":"a new element may account for Simpson leading the horse from the stable","to":"holmes","time":{"at":"t.thu_landau"},"para":60,"quote":"But a new element has been introduced into the case which may account for his leading the horse from the stable."}
{"id":"f.holmes_pricks_ears","of":"holmes","attr":"action","value":"pricks up his ears","time":{"at":"t.thu_landau"},"para":61,"quote":"Holmes pricked up his ears."}
{"id":"f.police_find_traces","of":"police","attr":"action","value":"find traces of a gypsy encampment","time":{"at":"t.traces_found"},"para":62,"quote":"We have found traces which show that a party of gypsies encamped"}
{"id":"f.gypsies_at_camp","of":"gypsy_party","attr":"location","value":"gypsy_camp","time":{"at":"t.gypsies_camp"},"para":62,"quote":"a party of gypsies encamped on Monday night within a mile of the spot where the murder took place"}
{"id":"f.camp_distance","of":"gypsy_camp","attr":"position","value":"within a mile of the spot where the murder took place","time":{"at":"t.gypsies_camp"},"para":62,"quote":"within a mile of the spot where the murder took place"}
{"id":"f.cal_gypsies_mon","of":"calendar","attr":"weekday","value":"Monday","time":{"at":"t.gypsies_camp"},"para":62,"quote":"on Monday night"}
{"id":"f.gypsies_left","of":"gypsy_party","attr":"location","value":"gypsy_camp","neg":true,"detail":"gone","time":{"at":"t.gypsies_gone"},"para":62,"quote":"On Tuesday they were gone."}
{"id":"f.cal_gypsies_tue","of":"calendar","attr":"weekday","value":"Tuesday","time":{"at":"t.gypsies_gone"},"para":62,"quote":"On Tuesday they were gone."}
{"id":"f.gregory_says_gypsy_theory","of":"gregory","attr":"says","value":"if Simpson had an understanding with the gypsies, he may have been leading the horse to them when overtaken, and they may have him now","to":"holmes","time":{"at":"t.thu_landau"},"para":62,"quote":"might he not have been leading the horse to them when he was overtaken, and may they not have him now?","asserts":[{"of":"simpson","attr":"intends","value":"to deliver the horse to the gypsies","modal":"possible","time":{"at":"t.crime"}},{"of":"silver_blaze","attr":"location","value":null,"detail":"with the gypsies","modal":"possible","time":{"at":"t.thu_landau"}}]}
{"id":"f.holmes_says_possible","of":"holmes","attr":"says","value":"it is certainly possible","to":"gregory","time":{"at":"t.thu_landau"},"para":63,"quote":"It is certainly possible."}
{"id":"f.moor_scoured","of":"police","attr":"action","value":"scour the moor for the gypsies","time":{"at":"t.thu_landau"},"para":64,"quote":"The moor is being scoured for these gypsies."}
{"id":"f.gregory_examines_outhouses","of":"gregory","attr":"action","value":"examines every stable and out-house in Tavistock and for a radius of ten miles","time":{"at":"t.gregory_searches"},"para":64,"quote":"I have also examined every stable and out-house in Tavistock, and for a radius of ten miles."}
{"id":"f.horse_not_in_outhouses","of":"silver_blaze","attr":"location","value":"tavistock_outhouses","neg":true,"basis":"implied","time":{"at":"t.gregory_searches"},"para":64,"quote":"I have also examined every stable and out-house in Tavistock"}
{"id":"f.holmes_asks_other_stable","of":"holmes","attr":"action","act":"ask","thing":"mapleton","value":"asks about the other training-stable close by","time":{"at":"t.thu_landau"},"para":65,"quote":"There is another training-stable quite close, I understand?"}
{"id":"f.gregory_says_mapleton_interest","of":"gregory","attr":"says","value":"Mapleton is a factor not to be neglected: with Desborough second in the betting, they had an interest in the favourite's disappearance","to":"holmes","time":{"at":"t.thu_landau"},"para":66,"quote":"As Desborough, their horse, was second in the betting, they had an interest in the disappearance of the favourite.","asserts":[{"of":"mapleton","attr":"condition","value":"had an interest in the disappearance of the favourite"}]}
{"id":"f.desborough_second_betting","of":"desborough","attr":"condition","value":"second in the betting","time":{"at":"t.crime"},"para":66,"quote":"As Desborough, their horse, was second in the betting"}
{"id":"f.brown_trainer","of":"silas_brown","attr":"role","value":"trainer at Mapleton","time":{"at":"t.crime"},"para":66,"quote":"Silas Brown, the trainer"}
{"id":"f.brown_bets","of":"silas_brown","attr":"action","value":"places large bets on the Wessex Cup","time":{"at":"t.brown_bets"},"para":66,"quote":"is known to have had large bets upon the event"}
{"id":"f.brown_no_friend","of":"silas_brown","attr":"condition","value":"no friend to Straker","time":{"after":"t.before","before":"t.crime"},"para":66,"quote":"he was no friend to poor Straker"}
{"id":"f.police_examine_mapleton","of":"police","attr":"action","value":"examine the Mapleton stables","time":{"at":"t.mapleton_examined"},"para":66,"quote":"We have, however, examined the stables"}
{"id":"f.gregory_says_nothing_brown","of":"gregory","attr":"says","value":"there is nothing to connect Silas Brown with the affair","to":"holmes","time":{"at":"t.thu_landau"},"para":66,"quote":"there is nothing to connect him with the affair","asserts":[{"of":"silas_brown","attr":"condition","value":"connected with the affair","neg":true}]}
{"id":"f.holmes_asks_simpson_mapleton","of":"holmes","attr":"action","act":"ask","value":"asks whether anything connects Simpson with the interests of the Mapleton stables","time":{"at":"t.thu_landau"},"para":67,"quote":"And nothing to connect this man Simpson with the interests of the Mapleton stables?"}
{"id":"f.gregory_says_no_link","of":"gregory","attr":"says","value":"nothing at all connects Simpson with Mapleton","to":"holmes","time":{"at":"t.thu_landau"},"para":68,"quote":"Nothing at all.","asserts":[{"of":"simpson","attr":"condition","value":"connected with the interests of the Mapleton stables","neg":true}]}
{"id":"f.gregory_tells_holmes","of":"gregory","attr":"tells","value":"acct.gregory","to":"holmes","how":"told","time":{"at":"t.thu_landau"},"para":51,"quote":"Inspector Gregory was full of his case, and poured out a stream of remarks"}
{"id":"f.gregory_tells_watson","of":"gregory","attr":"tells","value":"acct.gregory","to":"watson","how":"told","time":{"at":"t.thu_landau"},"para":51,"quote":"I listened with interest to the dialogue of the two detectives"}
{"id":"f.holmes_leans_back_drive","of":"holmes","attr":"action","value":"leans back in the carriage; the conversation ceases","time":{"at":"t.thu_landau"},"para":69,"quote":"Holmes leaned back in the carriage, and the conversation ceased."}
{"id":"f.driver_pulls_up","of":"driver","attr":"action","value":"pulls up at Straker's villa","time":{"at":"t.thu_villa"},"para":69,"quote":"our driver pulled up at a neat little red-brick villa"}
{"id":"f.landau_at_villa","of":"landau","attr":"location","value":"road","detail":"pulled up at Straker's villa","time":{"from":"t.thu_villa"},"para":69,"quote":"pulled up at a neat little red-brick villa with overhanging eaves which stood by the road"}
{"id":"f.villa_look","of":"straker_villa","attr":"condition","value":"a neat little red-brick villa with overhanging eaves","time":{"at":"t.thu_villa"},"para":69,"quote":"a neat little red-brick villa with overhanging eaves"}
{"id":"f.villa_by_road","of":"straker_villa","attr":"position","value":"stands by the road","time":{"at":"t.thu_villa"},"para":69,"quote":"which stood by the road"}
{"id":"f.outbuilding_position","of":"out_building","attr":"position","value":"some distance off from the villa, across a paddock","time":{"at":"t.thu_villa"},"para":69,"quote":"Some distance off, across a paddock, lay a long grey-tiled out-building."}
{"id":"f.outbuilding_look","of":"out_building","attr":"condition","value":"long and grey-tiled","time":{"at":"t.thu_villa"},"para":69,"quote":"a long grey-tiled out-building"}
{"id":"f.moor_bronze","of":"moor","attr":"condition","value":"low curves, bronze-coloured from the fading ferns, stretching to the sky-line","time":{"at":"t.thu_villa"},"para":69,"quote":"the low curves of the moor, bronze-coloured from the fading ferns"}
{"id":"f.tavistock_steeples_visible","of":"tavistock","attr":"position","value":"its steeples visible on the sky-line from the villa","time":{"at":"t.thu_villa"},"para":69,"quote":"broken only by the steeples of Tavistock"}
{"id":"f.mapleton_visible","of":"mapleton","attr":"position","value":"a cluster of houses away to the westward, visible from the villa","time":{"at":"t.thu_villa"},"para":69,"quote":"a cluster of houses away to the westward which marked the Mapleton stables"}
{"id":"f.watson_springs_out","of":"watson","attr":"location","value":"road","detail":"out of the carriage by the villa","time":{"from":"t.thu_villa","to":"t.thu_holmes_alights"},"para":69,"quote":"We all sprang out with the exception of Holmes"}
{"id":"f.gregory_springs_out","of":"gregory","attr":"location","value":"road","detail":"out of the carriage by the villa","time":{"from":"t.thu_villa","to":"t.thu_holmes_alights"},"para":69,"quote":"We all sprang out with the exception of Holmes"}
{"id":"f.ross_springs_out","of":"ross","attr":"location","value":"road","detail":"out of the carriage by the villa","time":{"from":"t.thu_villa","to":"t.thu_holmes_alights"},"para":69,"quote":"We all sprang out with the exception of Holmes"}
{"id":"f.holmes_stays_landau","of":"holmes","attr":"location","value":"landau","detail":"still leaning back","time":{"from":"t.thu_villa","to":"t.thu_holmes_alights"},"para":69,"quote":"with the exception of Holmes, who continued to lean back"}
{"id":"f.holmes_absorbed","of":"holmes","attr":"condition","value":"eyes fixed on the sky in front of him, entirely absorbed in his own thoughts","time":{"from":"t.thu_villa","to":"t.thu_holmes_alights"},"para":69,"quote":"with his eyes fixed upon the sky in front of him, entirely absorbed in his own thoughts"}
{"id":"f.watson_touches_arm","of":"watson","attr":"action","value":"touches Holmes's arm","time":{"at":"t.thu_holmes_alights"},"para":69,"quote":"It was only when I touched his arm"}
{"id":"f.holmes_steps_out","of":"holmes","attr":"action","value":"rouses himself with a violent start and steps out of the carriage","time":{"at":"t.thu_holmes_alights"},"para":69,"quote":"he roused himself with a violent start and stepped out of the carriage"}
{"id":"f.holmes_out_villa","of":"holmes","attr":"location","value":"road","detail":"out of the carriage by the villa","time":{"from":"t.thu_holmes_alights"},"para":69,"quote":"stepped out of the carriage"}
{"id":"f.ross_surprised","of":"ross","attr":"action","value":"looks at Holmes in some surprise","time":{"at":"t.thu_holmes_alights"},"para":70,"quote":"who had looked at him in some surprise"}
{"id":"f.holmes_says_daydreaming","of":"holmes","attr":"says","value":"excuse me; he was day-dreaming","to":"ross","time":{"at":"t.thu_holmes_alights"},"para":70,"quote":"I was day-dreaming.","asserts":[{"of":"holmes","attr":"action","value":"was day-dreaming"}]}
{"id":"f.holmes_gleam","of":"holmes","attr":"condition","value":"a gleam in his eyes and a suppressed excitement in his manner","time":{"at":"t.thu_holmes_alights"},"para":70,"quote":"There was a gleam in his eyes and a suppressed excitement in his manner"}
{"id":"f.watson_believes_clue","of":"watson","attr":"believes","value":"Holmes has his hand upon a clue, though Watson cannot imagine where he found it","time":{"at":"t.thu_holmes_alights"},"para":70,"quote":"that his hand was upon a clue, though I could not imagine where he had found it","asserts":[{"of":"holmes","attr":"knows","value":"a clue to the case"}]}
{"id":"f.gregory_offers_scene","of":"gregory","attr":"action","act":"ask","value":"asks whether Holmes would prefer to go on at once to the scene of the crime","time":{"at":"t.thu_holmes_alights"},"para":71,"quote":"Perhaps you would prefer at once to go on to the scene of the crime, Mr. Holmes?"}
{"id":"f.holmes_intends_stay","of":"holmes","attr":"intends","value":"to stay at the villa a little and go into one or two questions of detail","time":{"at":"t.thu_holmes_alights"},"para":72,"quote":"I think that I should prefer to stay here a little and go into one or two questions of detail."}
{"id":"f.holmes_asks_brought_back","of":"holmes","attr":"action","act":"ask","value":"asks whether Straker was brought back to the villa","time":{"at":"t.thu_holmes_alights"},"para":72,"quote":"Straker was brought back here, I presume?"}
{"id":"f.straker_brought_back","of":"straker","attr":"location","value":"straker_villa","detail":"his body brought back","time":{"from":"t.straker_brought_back"},"para":73,"quote":"Yes; he lies upstairs."}
{"id":"f.body_upstairs","of":"straker","attr":"location","value":"upstairs_room","detail":"his body lies there","time":{"at":"t.thu_holmes_alights"},"para":73,"quote":"he lies upstairs"}
{"id":"f.inquest_tomorrow","of":"straker","attr":"condition","value":"the inquest on him is to be held to-morrow","time":{"at":"t.inquest"},"para":73,"quote":"The inquest is to-morrow."}
{"id":"f.cal_inquest_fri","of":"calendar","attr":"weekday","value":"Friday","basis":"implied","time":{"at":"t.inquest"},"para":73,"quote":"The inquest is to-morrow."}
{"id":"f.holmes_asks_service","of":"holmes","attr":"action","act":"ask","value":"asks Colonel Ross whether Straker has been in his service some years","time":{"at":"t.thu_holmes_alights"},"para":74,"quote":"He has been in your service some years, Colonel Ross?"}
{"id":"f.ross_says_servant","of":"ross","attr":"says","value":"he has always found Straker an excellent servant","to":"holmes","time":{"at":"t.thu_holmes_alights"},"para":75,"quote":"I have always found him an excellent servant.","asserts":[{"of":"straker","attr":"reputed","value":"an excellent servant to Colonel Ross"}]}
{"id":"f.holmes_asks_inventory","of":"holmes","attr":"action","act":"ask","value":"asks whether the Inspector made an inventory of what Straker had in his pockets at the time of his death","time":{"at":"t.thu_holmes_alights"},"para":76,"quote":"I presume that you made an inventory of what he had in his pockets at the time of his death, Inspector?"}
{"id":"f.gregory_keeps_things","of":"gregory","attr":"action","value":"keeps the things from Straker's pockets in a tin box in the sitting-room","time":{"at":"t.inventory"},"para":77,"quote":"I have the things themselves in the sitting-room"}
{"id":"f.box_in_sitting_room","of":"tin_box","attr":"location","value":"sitting_room","time":{"from":"t.inventory","to":"t.thu_sitting_room"},"para":77,"quote":"I have the things themselves in the sitting-room"}
{"id":"f.straker_had_vestas","of":"straker","attr":"carrying","value":"vestas","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"There was a box of vestas"}
{"id":"f.straker_had_candle","of":"straker","attr":"carrying","value":"candle","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"two inches of tallow candle"}
{"id":"f.straker_had_pipe","of":"straker","attr":"carrying","value":"briar_pipe","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"an A.D.P. briar-root pipe"}
{"id":"f.straker_had_pouch","of":"straker","attr":"carrying","value":"tobacco_pouch","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"a pouch of seal-skin with half an ounce of long-cut Cavendish"}
{"id":"f.straker_had_watch","of":"straker","attr":"carrying","value":"silver_watch","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"a silver watch with a gold chain"}
{"id":"f.straker_had_sovereigns","of":"straker","attr":"carrying","value":"sovereigns","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"five sovereigns in gold"}
{"id":"f.straker_had_pencil","of":"straker","attr":"carrying","value":"pencil_case","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"an aluminium pencil-case"}
{"id":"f.straker_had_papers","of":"straker","attr":"carrying","value":"pocket_papers","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"a few papers"}
{"id":"f.watson_in_sitting_room","of":"watson","attr":"location","value":"central_table","detail":"seated round it","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"We all filed into the front room and sat round the central table"}
{"id":"f.holmes_in_sitting_room","of":"holmes","attr":"location","value":"central_table","detail":"seated round it","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"We all filed into the front room and sat round the central table"}
{"id":"f.gregory_in_sitting_room","of":"gregory","attr":"location","value":"central_table","detail":"seated round it","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"We all filed into the front room and sat round the central table"}
{"id":"f.ross_in_sitting_room","of":"ross","attr":"location","value":"central_table","detail":"seated round it","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"We all filed into the front room and sat round the central table"}
{"id":"f.gregory_unlocks_box","of":"gregory","attr":"action","act":"unlock","thing":"tin_box","value":"unlocks the square tin box","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"the Inspector unlocked a square tin box"}
{"id":"f.gregory_lays_out","of":"gregory","attr":"action","value":"lays a small heap of things before them","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"laid a small heap of things before us"}
{"id":"f.vestas_on_table","of":"vestas","attr":"location","value":"central_table","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"There was a box of vestas"}
{"id":"f.candle_on_table","of":"candle","attr":"location","value":"central_table","detail":"two inches of tallow candle","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"two inches of tallow candle"}
{"id":"f.pipe_on_table","of":"briar_pipe","attr":"location","value":"central_table","detail":"an A.D.P. briar-root pipe","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"an A.D.P. briar-root pipe"}
{"id":"f.pouch_on_table","of":"tobacco_pouch","attr":"location","value":"central_table","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"a pouch of seal-skin"}
{"id":"f.pouch_contents","of":"tobacco_pouch","attr":"contents","value":"half an ounce of long-cut Cavendish","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"with half an ounce of long-cut Cavendish"}
{"id":"f.watch_on_table","of":"silver_watch","attr":"location","value":"central_table","detail":"with a gold chain","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"a silver watch with a gold chain"}
{"id":"f.sovereigns_on_table","of":"sovereigns","attr":"location","value":"central_table","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"five sovereigns in gold"}
{"id":"f.pencil_on_table","of":"pencil_case","attr":"location","value":"central_table","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"an aluminium pencil-case"}
{"id":"f.papers_on_table","of":"pocket_papers","attr":"location","value":"central_table","detail":"a few papers","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"a few papers"}
{"id":"f.knife_on_table","of":"straker_knife","attr":"location","value":"central_table","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"an ivory-handled knife"}
{"id":"f.knife_look","of":"straker_knife","attr":"condition","value":"ivory-handled, with a very delicate, inflexible blade","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"an ivory-handled knife with a very delicate, inflexible blade"}
{"id":"f.knife_maker","of":"straker_knife","attr":"condition","value":"marked Weiss & Co., London","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"marked Weiss & Co., London"}
{"id":"f.holmes_says_singular_knife","of":"holmes","attr":"says","value":"this is a very singular knife","to":"watson","time":{"at":"t.thu_sitting_room"},"para":79,"quote":"This is a very singular knife,"}
{"id":"f.holmes_examines_knife","of":"holmes","attr":"action","value":"lifts up the knife and examines it minutely","time":{"at":"t.thu_sitting_room"},"para":79,"quote":"lifting it up and examining it minutely"}
{"id":"f.holmes_sees_blood","of":"holmes","attr":"observes","value":"blood-stains on the knife","time":{"at":"t.thu_sitting_room"},"para":79,"quote":"as I see blood-stains upon it"}
{"id":"f.holmes_presumes_grasp","of":"holmes","attr":"says","value":"he presumes from the blood-stains that this is the knife found in the dead man's grasp","to":"watson","time":{"at":"t.thu_sitting_room"},"para":79,"quote":"that it is the one which was found in the dead man’s grasp","asserts":[{"of":"straker","attr":"carrying","value":"straker_knife","time":{"at":"t.tue_hollow"}}]}
{"id":"f.holmes_asks_watson_knife","of":"holmes","attr":"action","act":"ask","thing":"straker_knife","value":"asks Watson whether the knife is in his line","time":{"at":"t.thu_sitting_room"},"para":79,"quote":"Watson, this knife is surely in your line?"}
{"id":"f.watson_says_cataract","of":"watson","attr":"says","value":"it is what doctors call a cataract knife","to":"holmes","time":{"at":"t.thu_sitting_room"},"para":80,"quote":"It is what we call a cataract knife","asserts":[{"of":"straker_knife","attr":"condition","value":"a cataract knife"}]}
{"id":"f.holmes_says_delicate","of":"holmes","attr":"says","value":"he thought so; a very delicate blade for very delicate work, strange to carry on a rough expedition, as it would not shut in the pocket","to":"watson","time":{"at":"t.thu_sitting_room"},"para":81,"quote":"A strange thing for a man to carry with him upon a rough expedition, especially as it would not shut in his pocket.","asserts":[{"of":"straker_knife","attr":"condition","value":"a very delicate blade devised for very delicate work"},{"of":"straker_knife","attr":"condition","value":"would not shut in a pocket"}]}
{"id":"f.cork_guarded_tip","of":"cork_disk","attr":"role","value":"guarded the tip of the knife","time":{"after":"t.before","before":"t.crime"},"para":82,"quote":"The tip was guarded by a disk of cork"}
{"id":"f.cork_beside_body","of":"cork_disk","attr":"location","value":"hollow","detail":"beside Straker's body","time":{"at":"t.tue_hollow"},"para":82,"quote":"which we found beside his body"}
{"id":"f.police_find_cork","of":"police","attr":"action","value":"find the disk of cork beside the body","time":{"at":"t.tue_hollow"},"para":82,"quote":"which we found beside his body"}
{"id":"f.knife_on_dressing_table","of":"straker_knife","attr":"location","value":"dressing_table","time":{"after":"t.before","before":"t.straker_takes_knife"},"para":82,"quote":"the knife had lain upon the dressing-table"}
{"id":"f.straker_picks_knife","of":"straker","attr":"action","value":"picks up the knife from the dressing-table as he leaves the room","time":{"at":"t.straker_takes_knife"},"para":82,"quote":"he had picked it up as he left the room"}
{"id":"f.straker_carries_knife_out","of":"straker","attr":"carrying","value":"straker_knife","time":{"from":"t.straker_takes_knife"},"para":82,"quote":"he had picked it up as he left the room"}
{"id":"f.mrs_straker_tells_knife","of":"mrs_straker","attr":"tells","value":"acct.mrs_straker_knife","to":"gregory","how":"told","time":{"at":"t.mrs_straker_tells_police"},"para":82,"quote":"His wife tells us that the knife had lain upon the dressing-table"}
{"id":"f.gregory_tells_knife","of":"gregory","attr":"tells","value":"acct.mrs_straker_knife","to":"watson","how":"told","time":{"at":"t.thu_sitting_room"},"para":82,"quote":"His wife tells us"}
{"id":"f.gregory_tells_knife_holmes","of":"gregory","attr":"tells","value":"acct.mrs_straker_knife","to":"holmes","how":"told","time":{"at":"t.thu_sitting_room"},"para":82,"quote":"His wife tells us"}
{"id":"f.gregory_says_poor_weapon","of":"gregory","attr":"says","value":"it was a poor weapon, but perhaps the best Straker could lay his hands on at the moment","to":"holmes","time":{"at":"t.thu_sitting_room"},"para":82,"quote":"It was a poor weapon, but perhaps the best that he could lay his hands on at the moment.","asserts":[{"of":"straker","attr":"intends","value":"to use the knife as a weapon of defence","modal":"possible","time":{"at":"t.straker_takes_knife"}}]}
{"id":"f.holmes_says_very_possible","of":"holmes","attr":"says","value":"very possible","to":"gregory","time":{"at":"t.thu_sitting_room"},"para":83,"quote":"Very possible."}
{"id":"f.holmes_asks_papers","of":"holmes","attr":"action","act":"ask","thing":"pocket_papers","value":"asks about the papers","time":{"at":"t.thu_sitting_room"},"para":83,"quote":"How about these papers?"}
{"id":"f.papers_hay","of":"pocket_papers","attr":"contents","value":"hay_accounts","detail":"three receipted hay-dealers' accounts","time":{"at":"t.thu_sitting_room"},"para":84,"quote":"Three of them are receipted hay-dealers’ accounts."}
{"id":"f.papers_ross_letter","of":"pocket_papers","attr":"contents","value":"ross_letter","time":{"at":"t.thu_sitting_room"},"para":84,"quote":"One of them is a letter of instructions from Colonel Ross."}
{"id":"f.ross_wrote_letter","of":"ross","attr":"action","value":"writes Straker a letter of instructions","basis":"implied","time":{"after":"t.before","before":"t.crime"},"para":84,"quote":"a letter of instructions from Colonel Ross"}
{"id":"f.papers_milliner","of":"pocket_papers","attr":"contents","value":"milliner_account","time":{"at":"t.thu_sitting_room"},"para":84,"quote":"This other is a milliner’s account"}
{"id":"f.milliner_amount","of":"milliner_account","attr":"condition","value":"for thirty-seven pounds fifteen","time":{"at":"t.thu_sitting_room"},"para":84,"quote":"a milliner’s account for thirty-seven pounds fifteen"}
{"id":"f.lesurier_makes_account","of":"lesurier","attr":"action","value":"makes out the milliner's account to William Derbyshire","time":{"at":"t.milliner_account_made"},"para":84,"quote":"made out by Madame Lesurier, of Bond Street, to William Derbyshire"}
{"id":"f.lesurier_role","of":"lesurier","attr":"role","value":"milliner","basis":"implied","time":{"at":"t.milliner_account_made"},"para":84,"quote":"a milliner’s account for thirty-seven pounds fifteen made out by Madame Lesurier"}
{"id":"f.lesurier_bond_street","of":"lesurier","attr":"lives_at","value":"bond_street","detail":"her business","time":{"at":"t.milliner_account_made"},"para":84,"quote":"Madame Lesurier, of Bond Street"}
{"id":"f.account_to_derbyshire","of":"milliner_account","attr":"role","value":"made out to William Derbyshire","time":{"at":"t.milliner_account_made"},"para":84,"quote":"to William Derbyshire"}
{"id":"f.mrs_straker_says_derbyshire","of":"mrs_straker","attr":"says","value":"Derbyshire was a friend of her husband's, and occasionally his letters were addressed to their house","to":"police","time":{"at":"t.mrs_straker_tells_police"},"para":84,"quote":"Mrs. Straker tells us that Derbyshire was a friend of her husband’s and that occasionally his letters were addressed here.","asserts":[{"of":"derbyshire","attr":"role","value":"a friend of John Straker"},{"of":"derbyshire","attr":"action","value":"has letters addressed to Straker's house","time":{"at":"t.derbyshire_letters"}}]}
{"id":"f.holmes_glances_account","of":"holmes","attr":"action","value":"glances down the milliner's account","time":{"at":"t.thu_sitting_room"},"para":85,"quote":"glancing down the account"}
{"id":"f.holmes_says_expensive","of":"holmes","attr":"says","value":"Madam Derbyshire had somewhat expensive tastes; twenty-two guineas is rather heavy for a single costume","to":"gregory","time":{"at":"t.thu_sitting_room"},"para":85,"quote":"Madam Derbyshire had somewhat expensive tastes,","asserts":[{"of":"madam_derbyshire","attr":"condition","value":"has expensive tastes in dress"},{"of":"milliner_account","attr":"contents","value":"billed_costume","detail":"a single costume at twenty-two guineas"}]}
{"id":"f.costume_price","of":"billed_costume","attr":"condition","value":"billed at twenty-two guineas","word":"holmes","time":{"at":"t.milliner_account_made"},"para":85,"quote":"Twenty-two guineas is rather heavy for a single costume."}
{"id":"f.holmes_says_nothing_more","of":"holmes","attr":"says","value":"there appears to be nothing more to learn; they may now go down to the scene of the crime","to":"gregory","time":{"at":"t.thu_sitting_room"},"para":85,"quote":"However there appears to be nothing more to learn, and we may now go down to the scene of the crime."}
{"id":"f.holmes_intends_scene","of":"holmes","attr":"intends","value":"to go down to the scene of the crime","time":{"at":"t.thu_sitting_room"},"para":85,"quote":"we may now go down to the scene of the crime"}
{"id":"f.watson_in_passage","of":"watson","attr":"location","value":"passage","time":{"at":"t.thu_passage"},"para":86,"quote":"As we emerged from the sitting-room"}
{"id":"f.holmes_in_passage","of":"holmes","attr":"location","value":"passage","time":{"at":"t.thu_passage"},"para":86,"quote":"As we emerged from the sitting-room"}
{"id":"f.gregory_in_passage","of":"gregory","attr":"location","value":"passage","time":{"at":"t.thu_passage"},"para":86,"quote":"As we emerged from the sitting-room"}
{"id":"f.mrs_straker_in_passage","of":"mrs_straker","attr":"location","value":"passage","detail":"waiting","time":{"from":"t.thu_sitting_room","to":"t.thu_passage"},"para":86,"quote":"a woman, who had been waiting in the passage"}
{"id":"f.mrs_straker_sleeve","of":"mrs_straker","attr":"action","value":"takes a step forward and lays her hand on the Inspector's sleeve","time":{"at":"t.thu_passage"},"para":86,"quote":"took a step forward and laid her hand upon the Inspector’s sleeve"}
{"id":"f.mrs_straker_face","of":"mrs_straker","attr":"condition","value":"face haggard, thin and eager, stamped with the print of a recent horror","time":{"at":"t.thu_passage"},"para":86,"quote":"Her face was haggard and thin and eager, stamped with the print of a recent horror."}
{"id":"f.mrs_straker_asks_found","of":"mrs_straker","attr":"says","value":"pants: have they got them, have they found them?","to":"gregory","time":{"at":"t.thu_passage"},"para":87,"quote":"Have you got them? Have you found them?"}
{"id":"f.gregory_says_not_found","of":"gregory","attr":"says","value":"no; but Mr. Holmes has come from London to help, and they will do all that is possible","to":"mrs_straker","time":{"at":"t.thu_passage"},"para":88,"quote":"No, Mrs. Straker. But Mr. Holmes here has come from London to help us","asserts":[{"of":"police","attr":"action","value":"have found those she asks after","neg":true,"time":{"at":"t.thu_passage"}},{"of":"holmes","attr":"intends","value":"to help the police"}]}
{"id":"f.holmes_says_plymouth","of":"holmes","attr":"says","value":"surely he met Mrs. Straker at a garden-party in Plymouth some little time ago","to":"mrs_straker","time":{"at":"t.thu_passage"},"para":89,"quote":"Surely I met you in Plymouth at a garden-party some little time ago, Mrs. Straker?","asserts":[{"of":"mrs_straker","attr":"location","value":"plymouth","detail":"at a garden-party","time":{"at":"t.plymouth_party"}},{"of":"holmes","attr":"location","value":"plymouth","detail":"at a garden-party","time":{"at":"t.plymouth_party"}}]}
{"id":"f.mrs_straker_says_mistaken","of":"mrs_straker","attr":"says","value":"no, he is mistaken","to":"holmes","time":{"at":"t.thu_passage"},"para":90,"quote":"No, sir; you are mistaken.","asserts":[{"of":"mrs_straker","attr":"location","value":"plymouth","detail":"at the garden-party","neg":true,"time":{"at":"t.plymouth_party"}}]}
{"id":"f.holmes_says_dove_dress","of":"holmes","attr":"says","value":"he could have sworn to it; she wore a costume of dove-coloured silk with ostrich-feather trimming","to":"mrs_straker","time":{"at":"t.thu_passage"},"para":91,"quote":"You wore a costume of dove-coloured silk with ostrich-feather trimming.","asserts":[{"of":"mrs_straker","attr":"wearing","value":"dove_dress","time":{"at":"t.plymouth_party"}}]}
{"id":"f.mrs_straker_no_dress","of":"mrs_straker","attr":"says","value":"she never had such a dress","to":"holmes","time":{"at":"t.thu_passage"},"para":92,"quote":"I never had such a dress, sir,","asserts":[{"of":"dove_dress","attr":"owner","value":"mrs_straker","neg":true}]}
{"id":"f.gregory_tells_villa_holmes","of":"gregory","attr":"tells","value":"acct.gregory_villa","to":"holmes","how":"told","time":{"from":"t.thu_holmes_alights","to":"t.thu_sitting_room"},"para":73,"quote":"Yes; he lies upstairs."}
{"id":"f.gregory_tells_villa_watson","of":"gregory","attr":"tells","value":"acct.gregory_villa","to":"watson","how":"told","time":{"from":"t.thu_holmes_alights","to":"t.thu_sitting_room"},"para":73,"quote":"Yes; he lies upstairs."}
{"id":"f.holmes_says_settles","of":"holmes","attr":"says","value":"that quite settles it","to":"mrs_straker","time":{"at":"t.thu_passage"},"para":93,"quote":"Ah, that quite settles it"}
{"id":"f.holmes_follows_out","of":"holmes","attr":"action","value":"apologises and follows the Inspector outside","time":{"at":"t.thu_passage"},"para":93,"quote":"with an apology he followed the Inspector outside"}
{"id":"f.walk_to_hollow","of":"watson","attr":"action","value":"walks a short way across the moor with the others to the hollow where the body was found","time":{"after":"t.thu_passage","before":"t.thu_at_hollow"},"para":93,"quote":"A short walk across the moor took us to the hollow in which the body had been found"}
{"id":"f.watson_at_hollow","of":"watson","attr":"location","value":"hollow","detail":"at the brink","time":{"from":"t.thu_at_hollow","to":"t.thu_on_rim"},"para":93,"quote":"took us to the hollow in which the body had been found"}
{"id":"f.holmes_at_hollow","of":"holmes","attr":"location","value":"hollow","detail":"at the brink","time":{"at":"t.thu_at_hollow"},"para":93,"quote":"took us to the hollow in which the body had been found"}
{"id":"f.gregory_at_hollow","of":"gregory","attr":"location","value":"hollow","detail":"at the brink","time":{"from":"t.thu_at_hollow","to":"t.thu_on_rim"},"para":93,"quote":"he followed the Inspector outside"}
{"id":"f.ross_at_hollow","of":"ross","attr":"location","value":"hollow","detail":"at the brink","basis":"implied","time":{"from":"t.thu_at_hollow","to":"t.thu_on_rim"},"para":93,"quote":"A short walk across the moor took us to the hollow"}
{"id":"f.bush_at_brink","of":"furze_bush","attr":"position","value":"at the brink of the hollow","time":{"at":"t.thu_at_hollow"},"para":93,"quote":"At the brink of it was the furze-bush upon which the coat had been hung."}
{"id":"f.holmes_says_no_wind","of":"holmes","attr":"says","value":"he understands there was no wind that night","to":"gregory","time":{"at":"t.thu_at_hollow"},"para":94,"quote":"There was no wind that night, I understand","asserts":[{"of":"weather","attr":"condition","value":"windy","neg":true,"time":{"at":"t.night_storm"}}]}
{"id":"f.no_wind","of":"weather","attr":"condition","value":"windy","neg":true,"time":{"at":"t.night_storm"},"para":95,"quote":"None"}
{"id":"f.heavy_rain","of":"weather","attr":"condition","value":"very heavy rain","time":{"at":"t.night_storm"},"para":95,"quote":"None; but very heavy rain."}
{"id":"f.holmes_says_coat_placed","of":"holmes","attr":"says","value":"then the overcoat was not blown against the furze-bush but placed there","to":"gregory","time":{"at":"t.thu_at_hollow"},"para":96,"quote":"In that case the overcoat was not blown against the furze-bush, but placed there.","asserts":[{"of":"straker_coat","attr":"location","value":"furze_bush","detail":"placed there, not blown","time":{"at":"t.coat_placed"}}]}
{"id":"f.coat_laid","of":"straker_coat","attr":"location","value":"furze_bush","detail":"laid across the bush","time":{"from":"t.coat_placed","to":"t.tue_hollow"},"para":97,"quote":"Yes, it was laid across the bush."}
{"id":"f.holmes_says_interest_ground","of":"holmes","attr":"says","value":"the ground has been trampled up a good deal; no doubt many feet have been here since Monday night","to":"gregory","time":{"at":"t.thu_at_hollow"},"para":98,"quote":"No doubt many feet have been here since Monday night.","asserts":[{"of":"hollow_mud","attr":"condition","value":"trampled by many feet","time":{"at":"t.ground_trampled"}}]}
{"id":"f.holmes_sees_trampled","of":"holmes","attr":"observes","value":"the ground has been trampled up a good deal","time":{"at":"t.thu_at_hollow"},"para":98,"quote":"I perceive that the ground has been trampled up a good deal"}
{"id":"f.mud_trampled","of":"hollow_mud","attr":"condition","value":"trampled up a good deal","time":{"at":"t.thu_at_hollow"},"para":98,"quote":"the ground has been trampled up a good deal"}
{"id":"f.matting_laid","of":"matting","attr":"location","value":"hollow","detail":"laid at the side","time":{"from":"t.ground_trampled","to":"t.thu_in_hollow"},"para":99,"quote":"A piece of matting has been laid here at the side"}
{"id":"f.police_on_matting","of":"police","attr":"action","value":"all stood upon the matting","time":{"at":"t.ground_trampled"},"para":99,"quote":"we have all stood upon that"}
{"id":"f.holmes_says_excellent","of":"holmes","attr":"says","value":"excellent","to":"gregory","time":{"at":"t.thu_at_hollow"},"para":100,"quote":"Excellent."}
{"id":"f.gregory_carries_bag","of":"gregory","attr":"carrying","value":"inspector_bag","time":{"from":"t.thu_at_hollow","to":"t.thu_in_hollow"},"para":101,"quote":"In this bag I have"}
{"id":"f.bag_boot","of":"inspector_bag","attr":"contents","value":"straker_boot","time":{"from":"t.items_bagged","to":"t.thu_on_rim"},"para":101,"quote":"one of the boots which Straker wore"}
{"id":"f.bag_shoe","of":"inspector_bag","attr":"contents","value":"simpson_shoe","time":{"from":"t.items_bagged","to":"t.thu_on_rim"},"para":101,"quote":"one of Fitzroy Simpson’s shoes"}
{"id":"f.bag_horseshoe","of":"inspector_bag","attr":"contents","value":"horseshoe","time":{"from":"t.items_bagged","to":"t.thu_on_rim"},"para":101,"quote":"a cast horseshoe of Silver Blaze"}
{"id":"f.boot_straker","of":"straker_boot","attr":"owner","value":"straker","detail":"one of the boots he wore","time":{"at":"t.crime"},"para":101,"quote":"one of the boots which Straker wore"}
{"id":"f.shoe_simpson","of":"simpson_shoe","attr":"owner","value":"simpson","time":{"at":"t.items_bagged"},"para":101,"quote":"one of Fitzroy Simpson’s shoes"}
{"id":"f.horseshoe_sb","of":"horseshoe","attr":"owner","value":"silver_blaze","detail":"a shoe he cast","time":{"at":"t.horseshoe_cast"},"para":101,"quote":"a cast horseshoe of Silver Blaze"}
{"id":"f.sb_casts_shoe","of":"silver_blaze","attr":"action","value":"casts a horseshoe","basis":"implied","time":{"at":"t.horseshoe_cast"},"para":101,"quote":"a cast horseshoe of Silver Blaze"}
{"id":"f.gregory_bags_items","of":"gregory","attr":"action","value":"puts Straker's boot, Simpson's shoe and the cast horseshoe in his bag","basis":"implied","time":{"at":"t.items_bagged"},"para":101,"quote":"In this bag I have one of the boots which Straker wore"}
{"id":"f.holmes_says_surpass","of":"holmes","attr":"says","value":"the Inspector surpasses himself","to":"gregory","time":{"at":"t.thu_at_hollow"},"para":102,"quote":"My dear Inspector, you surpass yourself!"}
{"id":"f.holmes_takes_bag","of":"holmes","attr":"action","act":"give","thing":"inspector_bag","value":"takes the bag from the Inspector","time":{"at":"t.thu_at_hollow"},"para":102,"quote":"Holmes took the bag"}
{"id":"f.holmes_carries_bag","of":"holmes","attr":"carrying","value":"inspector_bag","time":{"from":"t.thu_in_hollow","to":"t.thu_on_rim"},"para":102,"quote":"Holmes took the bag"}
{"id":"f.holmes_descends","of":"holmes","attr":"location","value":"hollow","detail":"at the bottom, lying on his face on the matting","time":{"at":"t.thu_in_hollow"},"para":102,"quote":"descending into the hollow"}
{"id":"f.holmes_moves_matting","of":"holmes","attr":"action","value":"pushes the matting into a more central position","time":{"at":"t.thu_in_hollow"},"para":102,"quote":"he pushed the matting into a more central position"}
{"id":"f.matting_central","of":"matting","attr":"location","value":"hollow","detail":"in a more central position","time":{"from":"t.thu_in_hollow"},"para":102,"quote":"he pushed the matting into a more central position"}
{"id":"f.holmes_studies_mud","of":"holmes","attr":"action","value":"stretches on his face, chin on his hands, and studies the trampled mud","time":{"at":"t.thu_in_hollow"},"para":102,"quote":"he made a careful study of the trampled mud in front of him"}
{"id":"f.holmes_says_whats_this","of":"holmes","attr":"says","value":"Hullo! What's this?","time":{"at":"t.thu_in_hollow"},"para":102,"quote":"“Hullo!” said he, suddenly. “What’s this?”"}
{"id":"f.holmes_finds_vesta","of":"holmes","attr":"observes","value":"a half-burned wax vesta in the mud","time":{"at":"t.thu_in_hollow"},"para":102,"quote":"It was a wax vesta half burned"}
{"id":"f.vesta_in_mud","of":"wax_vesta","attr":"location","value":"hollow_mud","detail":"buried","time":{"from":"t.vesta_dropped","to":"t.thu_in_hollow"},"para":102,"quote":"It was a wax vesta half burned"}
{"id":"f.vesta_look","of":"wax_vesta","attr":"condition","value":"half burned, so coated with mud that it looked at first like a little chip of wood","time":{"at":"t.thu_in_hollow"},"para":102,"quote":"which was so coated with mud that it looked at first like a little chip of wood"}
{"id":"f.gregory_says_overlooked","of":"gregory","attr":"says","value":"he cannot think how he came to overlook it","to":"holmes","time":{"at":"t.thu_in_hollow"},"para":103,"quote":"I cannot think how I came to overlook it"}
{"id":"f.gregory_annoyed","of":"gregory","attr":"condition","value":"annoyed","time":{"at":"t.thu_in_hollow"},"para":103,"quote":"with an expression of annoyance"}
{"id":"f.holmes_says_invisible","of":"holmes","attr":"says","value":"it was invisible, buried in the mud; he only saw it because he was looking for it","to":"gregory","time":{"at":"t.thu_in_hollow"},"para":104,"quote":"It was invisible, buried in the mud. I only saw it because I was looking for it.","asserts":[{"of":"wax_vesta","attr":"condition","value":"invisible, buried in the mud"}]}
{"id":"f.holmes_looking_vesta","of":"holmes","attr":"intends","value":"to look for a burnt match in the hollow","time":{"at":"t.thu_in_hollow"},"para":104,"quote":"I only saw it because I was looking for it."}
{"id":"f.gregory_asks_expected","of":"gregory","attr":"action","act":"ask","thing":"wax_vesta","value":"asks whether Holmes expected to find it","time":{"at":"t.thu_in_hollow"},"para":105,"quote":"What! You expected to find it?"}
{"id":"f.holmes_says_not_unlikely","of":"holmes","attr":"says","value":"he thought it not unlikely","to":"gregory","time":{"at":"t.thu_in_hollow"},"para":106,"quote":"I thought it not unlikely."}
{"id":"f.holmes_expected_vesta","of":"holmes","attr":"believes","value":"a burnt match would likely be found in the hollow","time":{"before":"t.thu_in_hollow","after":"t.thu_passage"},"para":106,"quote":"I thought it not unlikely."}
{"id":"f.holmes_compares_boots","of":"holmes","attr":"action","value":"takes the boots from the bag and compares the impressions of each with marks on the ground","time":{"after":"t.thu_in_hollow","before":"t.thu_on_rim"},"para":107,"quote":"He took the boots from the bag, and compared the impressions of each of them with marks upon the ground."}
{"id":"f.holmes_on_rim","of":"holmes","attr":"location","value":"hollow_rim","detail":"crawling among the ferns and bushes","time":{"at":"t.thu_on_rim"},"para":107,"quote":"Then he clambered up to the rim of the hollow"}
{"id":"f.holmes_crawls","of":"holmes","attr":"action","value":"crawls about among the ferns and bushes on the rim","time":{"at":"t.thu_on_rim"},"para":107,"quote":"crawled about among the ferns and bushes"}
{"id":"f.gregory_says_no_tracks","of":"gregory","attr":"says","value":"there are no more tracks; he examined the ground carefully for a hundred yards in each direction","to":"holmes","time":{"at":"t.thu_on_rim"},"para":108,"quote":"I am afraid that there are no more tracks","asserts":[{"of":"moor","attr":"condition","value":"no more tracks within a hundred yards of the hollow"}]}
{"id":"f.gregory_examined_ground","of":"gregory","attr":"action","value":"examines the ground very carefully for a hundred yards in each direction","time":{"at":"t.gregory_examines_ground"},"para":108,"quote":"I have examined the ground very carefully for a hundred yards in each direction."}
{"id":"f.holmes_rises","of":"holmes","attr":"action","value":"rises","time":{"at":"t.thu_on_rim"},"para":109,"quote":"said Holmes, rising"}
{"id":"f.holmes_says_no_impertinence","of":"holmes","attr":"says","value":"he would not have the impertinence to examine it again after what the Inspector says","to":"gregory","time":{"at":"t.thu_on_rim"},"para":109,"quote":"I should not have the impertinence to do it again after what you say."}
{"id":"f.holmes_says_walk","of":"holmes","attr":"says","value":"he would like a little walk over the moor before dark to know his ground to-morrow, and will pocket the horseshoe for luck","to":"gregory","time":{"at":"t.thu_on_rim"},"para":109,"quote":"But I should like to take a little walk over the moor before it grows dark, that I may know my ground to-morrow"}
{"id":"f.holmes_intends_walk","of":"holmes","attr":"intends","value":"to take a little walk over the moor before dark, to know his ground to-morrow","time":{"at":"t.thu_on_rim"},"para":109,"quote":"I should like to take a little walk over the moor before it grows dark"}
{"id":"f.clock_not_dark","of":"clock","attr":"hour","value":"evening, not yet dark","time":{"at":"t.thu_on_rim"},"para":109,"quote":"before it grows dark"}
{"id":"f.holmes_pockets_horseshoe","of":"holmes","attr":"carrying","value":"horseshoe","detail":"in his pocket, \"for luck\"","time":{"from":"t.thu_on_rim"},"para":109,"quote":"I think that I shall put this horseshoe into my pocket for luck"}
{"id":"f.ross_impatient","of":"ross","attr":"condition","value":"showing signs of impatience at Holmes's quiet and systematic method","time":{"from":"t.thu_at_hollow","to":"t.thu_on_rim"},"para":110,"quote":"who had shown some signs of impatience at my companion’s quiet and systematic method of work"}
{"id":"f.ross_glances_watch","of":"ross","attr":"action","value":"glances at his watch","time":{"at":"t.thu_on_rim"},"para":110,"quote":"glanced at his watch"}
{"id":"f.ross_owns_watch","of":"ross_watch","attr":"owner","value":"ross","basis":"implied","time":{"at":"t.thu_on_rim"},"para":110,"quote":"glanced at his watch"}
{"id":"f.ross_asks_gregory","of":"ross","attr":"says","value":"asks the Inspector to come back with him; he wants his advice on several points, especially whether to remove the horse's name from the entries for the Cup","to":"gregory","time":{"at":"t.thu_on_rim"},"para":110,"quote":"I wish you would come back with me, Inspector"}
{"id":"f.ross_considers_scratch","of":"ross","attr":"intends","value":"to consider whether they owe it to the public to remove Silver Blaze from the entries for the Cup","time":{"at":"t.thu_on_rim"},"para":110,"quote":"whether we do not owe it to the public to remove our horse’s name from the entries for the Cup"}
{"id":"f.sb_entered","of":"cup_entries","attr":"contents","value":"silver_blaze","basis":"implied","time":{"from":"t.cup_entries"},"para":110,"quote":"remove our horse’s name from the entries for the Cup"}
{"id":"f.holmes_says_let_stand","of":"holmes","attr":"says","value":"certainly not; he would let the name stand","to":"ross","time":{"at":"t.thu_on_rim"},"para":111,"quote":"“Certainly not,” cried Holmes, with decision. “I should let the name stand.”"}
{"id":"f.ross_bows","of":"ross","attr":"action","value":"bows","time":{"at":"t.thu_on_rim"},"para":112,"quote":"The Colonel bowed."}
{"id":"f.ross_says_glad","of":"ross","attr":"says","value":"he is very glad to have had Holmes's opinion; they will be at Straker's house when Holmes has finished his walk, and they can drive together into Tavistock","to":"holmes","time":{"at":"t.thu_on_rim"},"para":112,"quote":"I am very glad to have had your opinion, sir"}
{"id":"f.ross_intends_return","of":"ross","attr":"intends","value":"to go back with the Inspector to Straker's house and wait there","time":{"at":"t.thu_ross_returns"},"para":112,"quote":"You will find us at poor Straker’s house when you have finished your walk"}
{"id":"f.ross_intends_drive","of":"ross","attr":"intends","value":"to drive together into Tavistock after Holmes's walk","time":{"at":"t.thu_drive_tavistock"},"para":112,"quote":"we can drive together into Tavistock"}
{"id":"f.gregory_tells_hollow_holmes","of":"gregory","attr":"tells","value":"acct.gregory_hollow","to":"holmes","how":"told","time":{"from":"t.thu_at_hollow","to":"t.thu_on_rim"},"para":95,"quote":"None; but very heavy rain."}
{"id":"f.gregory_tells_hollow_watson","of":"gregory","attr":"tells","value":"acct.gregory_hollow","to":"watson","how":"told","time":{"from":"t.thu_at_hollow","to":"t.thu_on_rim"},"para":95,"quote":"None; but very heavy rain."}

## The reader's notes on this scene (the annotated reading)

{"id":"t114.1","para":114,"tag":"GENRE","subtype":"watch-detective","confidence":"fair","profile":"typical","from":["t112.2"],"reads":"We may leave the question of who killed John Straker for the instant","text":"Holmes separates the two problems and works on the horse first. He thinks the horse's fate can be settled without knowing who the killer is, so he may believe they are less tightly linked than the police assume (t4.2)."}
{"id":"t114.2","para":114,"tag":"DEFAULT","confidence":"fair","profile":"typical","from":["bk.horse_herd","t37.1","t112.3"],"reads":"The horse is a very gregarious creature.","text":"A horse that broke loose in the hollow would make for horses: home to King's Pyland or over to Mapleton. It would not run wild, and on the open moor it would have been seen by now."}
{"id":"t114.3","para":114,"tag":"DROP","confidence":"fair","profile":"typical","from":["t62.2","t62.3","t37.2","t114.2"],"reads":"They could not hope to sell such a horse.","relations":[{"type":"drops","target":"t62.2"}],"text":"Drop the gypsy theory. They move off whenever there is trouble, they could not sell so famous a horse, and the reward makes theft pointless for them. Their leaving on Tuesday is explained without any guilt."}
{"id":"t114.4","para":114,"tag":"DROP","confidence":"fair","profile":"typical","from":["t114.2","t14.2","t111.2"],"reads":"Why should he run wild upon the moor? He would surely have been seen by now.","relations":[{"type":"drops","target":"t46.2"}],"text":"The 'bolted and wandering on the moor' branch of the police theory goes too. It already conflicted with t14.2."}
{"id":"t116.1","para":116,"tag":"WEIGH","confidence":"fair","profile":"careful","from":["t114.2","t66.2","t111.2"],"reads":"He is not at King’s Pyland. Therefore he is at Mapleton.","text":"The argument is only as good as its premise that the horse went off loose to one stable or the other. Holmes calls it a 'working hypothesis'. If the horse is at Mapleton, the police search there (t66.2) failed to recognise him, and that points back to the altered-appearance option of t14.3."}
{"id":"t116.2","para":116,"tag":"PHYSICAL","confidence":"fair","profile":"typical","from":["t108.1","bk.hoofprints"],"reads":"This part of the moor, as the Inspector remarked, is very hard and dry.","relations":[{"type":"supports","target":"t108.1"}],"text":"This answers t108.1. Near the hollow the ground is hard and takes no prints, so Gregory's empty hundred yards proves nothing. Prints should show again in the wet low ground towards Mapleton."}
{"id":"t117.1","para":117,"tag":"TEST","confidence":"strong","profile":"typical","from":["t116.1","t116.2","t109.2"],"reads":"the shoe which he took from his pocket exactly fitted the impression","relations":[{"type":"supports","target":"t116.1"},{"type":"supports","target":"t111.1"}],"text":"Silver Blaze's own shoe matches a fresh track in the wet hollow on the line to Mapleton. The horse left the scene alive, heading that way. The pocketed horseshoe of t109.2 was for exactly this."}
{"id":"t118.1","para":118,"tag":"GENRE","confidence":"weak","profile":"typical","from":["t39.1"],"reads":"It is the one quality which Gregory lacks.","text":"This repeats Holmes's verdict on Gregory (t39.1). The police searched by rule and missed what a guess about the horse's behaviour found. Their other negative results (stables, Mapleton) are also open to doubt."}
{"id":"t119.1","para":119,"tag":"RECORD","profile":"typical","from":["t117.1"],"reads":"A man’s track was visible beside the horse’s.","text":"Close to Mapleton a man's footprints join the horse's track."}
{"id":"t120.1","para":120,"tag":"INFER","confidence":"strong","profile":"typical","from":["t117.1","t119.1"],"reads":"The horse was alone before","relations":[{"type":"strains","target":"t46.2"}],"text":"The horse crossed the moor from the hollow on its own. Nobody led it away from the scene of the murder. A man met it only near Mapleton. Whoever was with Straker in the hollow did not take the horse, and that is a blow to the police picture of Simpson leading it off."}
{"id":"t120.2","para":120,"tag":"HYPOTHESIS","confidence":"fair","profile":"typical","from":["t119.1","t120.1","t40.3","t66.1"],"text":"Who is the man who caught the horse near Mapleton?","options":["Someone from Mapleton, perhaps Silas Brown","Straker's killer, who followed the horse","Simpson"]}
{"id":"t122.1","para":122,"tag":"HYPOTHESIS","confidence":"weak","profile":"typical","from":["t120.2"],"reads":"The double track turned sharp off and took the direction of King’s Pyland.","text":"The man first led the horse towards King's Pyland. That looks like an honest finder taking a stray back to its stable.","options":["An honest finder returning the horse","A man who set out to return it and then changed his mind"]}
{"id":"t122.2","para":122,"tag":"AGENT","confidence":"fair","profile":"careful","from":["t122.1","bk.favourite_motive","t66.1"],"reads":"saw to my surprise the same tracks coming back again in the opposite direction","relations":[{"type":"strains","target":"t122.1"}],"text":"He turned back with the horse. A man who sets out to return a stray and then reverses has changed his mind, most likely because he saw what he could gain by keeping the favourite out of the race."}
{"id":"t124.1","para":124,"tag":"INFER","confidence":"strong","profile":"typical","from":["t122.2","t116.1"],"reads":"It ended at the paving of asphalt which led up to the gates of the Mapleton stables.","relations":[{"type":"drops","target":"t122.1"},{"type":"supports","target":"t40.3"}],"text":"The track goes in at Mapleton's gates. The horse was taken into the rival stable and kept, not returned. Drop the 'honest finder' reading."}
{"id":"t124.2","para":124,"tag":"REVISE","confidence":"fair","profile":"careful","from":["t124.1","t66.2","t64.1","t14.3","bk.search_by_description"],"relations":[{"type":"revises","target":"t66.2"}],"text":"The police 'examined' Mapleton and found nothing, yet the horse went in there. Either it was hidden from the searchers or it stood among the other horses unrecognised. The disguise option of t14.3 now looks strong.","hindsight":"A first-time reader must hold onto the doubt about searching by description from t64.1 and t66.2, and not assume the horse was moved out again after the police visit."}
{"id":"t126.1","para":126,"tag":"GENRE","subtype":"watch-detective","confidence":"weak","profile":"careful","from":["t124.1","bk.genre_detective_signals"],"reads":"if I were to call at five o’clock to-morrow morning","text":"Holmes asks a pointed question about who is up at dawn. A stray that reached Mapleton early on Tuesday would be met by whoever was stirring first."}
{"id":"t127.1","para":127,"tag":"INFER","confidence":"fair","profile":"careful","from":["t126.1","t119.1","t120.2"],"reads":"he is always the first stirring","relations":[{"type":"supports","target":"t120.2"}],"text":"Silas Brown is always the first one up. So he is the likeliest man to have met the loose horse at dawn and led it about. He fits the man's track in t119.1."}
{"id":"t131.1","para":131,"tag":"SET ASIDE","profile":"typical","from":[],"reads":"Be off, or you may find a dog at your heels.","text":"Brown's bluster and his threat of a dog are manner. They also show how Mapleton keeps strangers away."}
{"id":"t132.1","para":132,"tag":"WEIGH","confidence":"fair","profile":"typical","from":["t127.1","t124.1"],"reads":"He started violently and flushed to the temples.","text":"Holmes whispered a specific charge, most likely an account of the tracks and of Brown taking the horse in. Brown's violent start and his denial ('a lie') show it hit home. His agreeing to talk in private gives more away than the denial does."}
{"id":"t137.1","para":137,"tag":"INFER","confidence":"strong","profile":"typical","from":["t132.1"],"reads":"he cringed along at my companion’s side like a dog with its master","text":"After twenty minutes Brown is broken and obedient. Holmes's charge was true, and Brown has the horse, or knows where it is, and has given in."}
{"id":"t140.1","para":140,"tag":"INFER","confidence":"fair","profile":"typical","from":["t137.1","t111.1","t18.2"],"reads":"It shall be there.","relations":[{"type":"supports","target":"t111.1"}],"text":"'It' is very probably Silver Blaze, and 'there' probably the racecourse on Tuesday. This explains why Holmes told Ross to let the name stand: he expected the horse to be alive and available."}
{"id":"t140.2","para":140,"tag":"INFER","confidence":"fair","profile":"careful","from":["t140.1","t124.2","t14.3"],"reads":"Should I change it first or not?","relations":[{"type":"supports","target":"t124.2"}],"text":"Brown asks whether to 'change' the horse first. That suggests its appearance has been altered, or can be put back, which is how it stood in the yard unrecognised by the police search.","options":["Restore the horse's original appearance","Alter it in some way before handing it over"]}
{"id":"t141.1","para":141,"tag":"GENRE","subtype":"watch-detective","confidence":"fair","profile":"careful","from":["t140.2","t110.1","t112.1"],"reads":"I shall write to you about it.","text":"Holmes laughs at the question and tells Brown not to change it yet. He is not recovering the horse openly or telling the police. It looks as if he means to stage its return in his own way, perhaps with the slighted Colonel Ross in mind."}
{"id":"t143.1","para":143,"tag":"AGENT","confidence":"weak","profile":"careful","from":["t141.1","t137.1"],"reads":"disregarding the trembling hand which the other held out to him","text":"Holmes refuses Brown's hand. He holds him in contempt and keeps him under threat ('No tricks'). He is not treating him as Straker's murderer, which fits t120.1: Brown only took in a horse that came to him alone."}
{"id":"t143.2","para":143,"tag":"RESIDUE","confidence":"fair","profile":"careful","from":["t120.1","t114.1","t112.2","t92.2","t82.3","t60.2","t34.2","t33.2","t70.2","t6.1"],"text":"Open at the end of the scene: the horse seems settled, alive at Mapleton and perhaps altered. The murder is untouched. Who struck Straker in the hollow, since the horse left alone and nobody led it? The rest is carried over: whether Straker was working against the horse (knife, candle, match, laid coat), whether Derbyshire is Straker, how the cravat got into his hand, who drugged the curry and how a passer-by could rely on it, the dog's silence, the opened door, the clue Holmes had in the carriage, and the field-glass."}
{"id":"t143.3","para":143,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"careful","from":["t112.3","t120.1","t124.1","t127.1","t140.2","t114.3"],"relations":[{"type":"supports","target":"t46.4"},{"type":"strains","target":"t46.2"}],"text":"Standing pictures. The horse: it got loose from the hollow, wandered towards Mapleton, and Silas Brown took it in at dawn, nearly returned it, then kept and probably disguised it. Brown is a profiteer, not the killer. The gypsies are out. The murder: picture (c) still leads, with Straker leading the horse out to do it some delicate harm and being struck down. The police's Simpson theory has lost the 'led the horse away' step. The killer is unknown in every picture.","options":["Straker's own scheme, with an unknown killer","Simpson killed Straker but never had the horse","Someone not yet named"]}

## The story so far (this scene is ¶113–¶143)

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

¶69 Holmes leaned back in the carriage, and the conversation ceased. A few minutes later our driver pulled up at a neat little red-brick villa with overhanging eaves which stood by the road. Some distance off, across a paddock, lay a long grey-tiled out-building. In every other direction the low curves of the moor, bronze-coloured from the fading ferns, stretched away to the sky-line, broken only by the steeples of Tavistock, and by a cluster of houses away to the westward which marked the Mapleton stables. We all sprang out with the exception of Holmes, who continued to lean back with his eyes fixed upon the sky in front of him, entirely absorbed in his own thoughts. It was only when I touched his arm that he roused himself with a violent start and stepped out of the carriage.

¶70 “Excuse me,” said he, turning to Colonel Ross, who had looked at him in some surprise. “I was day-dreaming.” There was a gleam in his eyes and a suppressed excitement in his manner which convinced me, used as I was to his ways, that his hand was upon a clue, though I could not imagine where he had found it.

¶71 “Perhaps you would prefer at once to go on to the scene of the crime, Mr. Holmes?” said Gregory.

¶72 “I think that I should prefer to stay here a little and go into one or two questions of detail. Straker was brought back here, I presume?”

¶73 “Yes; he lies upstairs. The inquest is to-morrow.”

¶74 “He has been in your service some years, Colonel Ross?”

¶75 “I have always found him an excellent servant.”

¶76 “I presume that you made an inventory of what he had in his pockets at the time of his death, Inspector?”

¶77 “I have the things themselves in the sitting-room, if you would care to see them.”

¶78 “I should be very glad.” We all filed into the front room and sat round the central table while the Inspector unlocked a square tin box and laid a small heap of things before us. There was a box of vestas, two inches of tallow candle, an A.D.P. briar-root pipe, a pouch of seal-skin with half an ounce of long-cut Cavendish, a silver watch with a gold chain, five sovereigns in gold, an aluminium pencil-case, a few papers, and an ivory-handled knife with a very delicate, inflexible blade marked Weiss & Co., London.

¶79 “This is a very singular knife,” said Holmes, lifting it up and examining it minutely. “I presume, as I see blood-stains upon it, that it is the one which was found in the dead man’s grasp. Watson, this knife is surely in your line?”

¶80 “It is what we call a cataract knife,” said I.

¶81 “I thought so. A very delicate blade devised for very delicate work. A strange thing for a man to carry with him upon a rough expedition, especially as it would not shut in his pocket.”

¶82 “The tip was guarded by a disk of cork which we found beside his body,” said the Inspector. “His wife tells us that the knife had lain upon the dressing-table, and that he had picked it up as he left the room. It was a poor weapon, but perhaps the best that he could lay his hands on at the moment.”

¶83 “Very possible. How about these papers?”

¶84 “Three of them are receipted hay-dealers’ accounts. One of them is a letter of instructions from Colonel Ross. This other is a milliner’s account for thirty-seven pounds fifteen made out by Madame Lesurier, of Bond Street, to William Derbyshire. Mrs. Straker tells us that Derbyshire was a friend of her husband’s and that occasionally his letters were addressed here.”

¶85 “Madam Derbyshire had somewhat expensive tastes,” remarked Holmes, glancing down the account. “Twenty-two guineas is rather heavy for a single costume. However there appears to be nothing more to learn, and we may now go down to the scene of the crime.”

¶86 As we emerged from the sitting-room a woman, who had been waiting in the passage, took a step forward and laid her hand upon the Inspector’s sleeve. Her face was haggard and thin and eager, stamped with the print of a recent horror.

¶87 “Have you got them? Have you found them?” she panted.

¶88 “No, Mrs. Straker. But Mr. Holmes here has come from London to help us, and we shall do all that is possible.”

¶89 “Surely I met you in Plymouth at a garden-party some little time ago, Mrs. Straker?” said Holmes.

¶90 “No, sir; you are mistaken.”

¶91 “Dear me! Why, I could have sworn to it. You wore a costume of dove-coloured silk with ostrich-feather trimming.”

¶92 “I never had such a dress, sir,” answered the lady.

¶93 “Ah, that quite settles it,” said Holmes. And with an apology he followed the Inspector outside. A short walk across the moor took us to the hollow in which the body had been found. At the brink of it was the furze-bush upon which the coat had been hung.

¶94 “There was no wind that night, I understand,” said Holmes.

¶95 “None; but very heavy rain.”

¶96 “In that case the overcoat was not blown against the furze-bush, but placed there.”

¶97 “Yes, it was laid across the bush.”

¶98 “You fill me with interest, I perceive that the ground has been trampled up a good deal. No doubt many feet have been here since Monday night.”

¶99 “A piece of matting has been laid here at the side, and we have all stood upon that.”

¶100 “Excellent.”

¶101 “In this bag I have one of the boots which Straker wore, one of Fitzroy Simpson’s shoes, and a cast horseshoe of Silver Blaze.”

¶102 “My dear Inspector, you surpass yourself!” Holmes took the bag, and, descending into the hollow, he pushed the matting into a more central position. Then stretching himself upon his face and leaning his chin upon his hands, he made a careful study of the trampled mud in front of him. “Hullo!” said he, suddenly. “What’s this?” It was a wax vesta half burned, which was so coated with mud that it looked at first like a little chip of wood.

¶103 “I cannot think how I came to overlook it,” said the Inspector, with an expression of annoyance.

¶104 “It was invisible, buried in the mud. I only saw it because I was looking for it.”

¶105 “What! You expected to find it?”

¶106 “I thought it not unlikely.”

¶107 He took the boots from the bag, and compared the impressions of each of them with marks upon the ground. Then he clambered up to the rim of the hollow, and crawled about among the ferns and bushes.

¶108 “I am afraid that there are no more tracks,” said the Inspector. “I have examined the ground very carefully for a hundred yards in each direction.”

¶109 “Indeed!” said Holmes, rising. “I should not have the impertinence to do it again after what you say. But I should like to take a little walk over the moor before it grows dark, that I may know my ground to-morrow, and I think that I shall put this horseshoe into my pocket for luck.”

¶110 Colonel Ross, who had shown some signs of impatience at my companion’s quiet and systematic method of work, glanced at his watch. “I wish you would come back with me, Inspector,” said he. “There are several points on which I should like your advice, and especially as to whether we do not owe it to the public to remove our horse’s name from the entries for the Cup.”

¶111 “Certainly not,” cried Holmes, with decision. “I should let the name stand.”

¶112 The Colonel bowed. “I am very glad to have had your opinion, sir,” said he. “You will find us at poor Straker’s house when you have finished your walk, and we can drive together into Tavistock.”

¶113 He turned back with the Inspector, while Holmes and I walked slowly across the moor. The sun was beginning to sink behind the stables of Mapleton, and the long, sloping plain in front of us was tinged with gold, deepening into rich, ruddy browns where the faded ferns and brambles caught the evening light. But the glories of the landscape were all wasted upon my companion, who was sunk in the deepest thought.

¶114 “It’s this way, Watson,” said he at last. “We may leave the question of who killed John Straker for the instant, and confine ourselves to finding out what has become of the horse. Now, supposing that he broke away during or after the tragedy, where could he have gone to? The horse is a very gregarious creature. If left to himself his instincts would have been either to return to King’s Pyland or go over to Mapleton. Why should he run wild upon the moor? He would surely have been seen by now. And why should gypsies kidnap him? These people always clear out when they hear of trouble, for they do not wish to be pestered by the police. They could not hope to sell such a horse. They would run a great risk and gain nothing by taking him. Surely that is clear.”

¶115 “Where is he, then?”

¶116 “I have already said that he must have gone to King’s Pyland or to Mapleton. He is not at King’s Pyland. Therefore he is at Mapleton. Let us take that as a working hypothesis and see what it leads us to. This part of the moor, as the Inspector remarked, is very hard and dry. But it falls away towards Mapleton, and you can see from here that there is a long hollow over yonder, which must have been very wet on Monday night. If our supposition is correct, then the horse must have crossed that, and there is the point where we should look for his tracks.”

¶117 We had been walking briskly during this conversation, and a few more minutes brought us to the hollow in question. At Holmes’ request I walked down the bank to the right, and he to the left, but I had not taken fifty paces before I heard him give a shout, and saw him waving his hand to me. The track of a horse was plainly outlined in the soft earth in front of him, and the shoe which he took from his pocket exactly fitted the impression.

¶118 “See the value of imagination,” said Holmes. “It is the one quality which Gregory lacks. We imagined what might have happened, acted upon the supposition, and find ourselves justified. Let us proceed.”

¶119 We crossed the marshy bottom and passed over a quarter of a mile of dry, hard turf. Again the ground sloped, and again we came on the tracks. Then we lost them for half a mile, but only to pick them up once more quite close to Mapleton. It was Holmes who saw them first, and he stood pointing with a look of triumph upon his face. A man’s track was visible beside the horse’s.

¶120 “The horse was alone before,” I cried.

¶121 “Quite so. It was alone before. Hullo, what is this?”

¶122 The double track turned sharp off and took the direction of King’s Pyland. Holmes whistled, and we both followed along after it. His eyes were on the trail, but I happened to look a little to one side, and saw to my surprise the same tracks coming back again in the opposite direction.

¶123 “One for you, Watson,” said Holmes, when I pointed it out. “You have saved us a long walk, which would have brought us back on our own traces. Let us follow the return track.”

¶124 We had not to go far. It ended at the paving of asphalt which led up to the gates of the Mapleton stables. As we approached, a groom ran out from them.

¶125 “We don’t want any loiterers about here,” said he.

¶126 “I only wished to ask a question,” said Holmes, with his finger and thumb in his waistcoat pocket. “Should I be too early to see your master, Mr. Silas Brown, if I were to call at five o’clock to-morrow morning?”

¶127 “Bless you, sir, if any one is about he will be, for he is always the first stirring. But here he is, sir, to answer your questions for himself. No, sir, no; it is as much as my place is worth to let him see me touch your money. Afterwards, if you like.”

¶128 As Sherlock Holmes replaced the half-crown which he had drawn from his pocket, a fierce-looking elderly man strode out from the gate with a hunting-crop swinging in his hand.

¶129 “What’s this, Dawson!” he cried. “No gossiping! Go about your business! And you, what the devil do you want here?”

¶130 “Ten minutes’ talk with you, my good sir,” said Holmes in the sweetest of voices.

¶131 “I’ve no time to talk to every gadabout. We want no strangers here. Be off, or you may find a dog at your heels.”

¶132 Holmes leaned forward and whispered something in the trainer’s ear. He started violently and flushed to the temples.

¶133 “It’s a lie!” he shouted, “an infernal lie!”

¶134 “Very good. Shall we argue about it here in public or talk it over in your parlour?”

¶135 “Oh, come in if you wish to.”

¶136 Holmes smiled. “I shall not keep you more than a few minutes, Watson,” said he. “Now, Mr. Brown, I am quite at your disposal.”

¶137 It was twenty minutes, and the reds had all faded into greys before Holmes and the trainer reappeared. Never have I seen such a change as had been brought about in Silas Brown in that short time. His face was ashy pale, beads of perspiration shone upon his brow, and his hands shook until the hunting-crop wagged like a branch in the wind. His bullying, overbearing manner was all gone too, and he cringed along at my companion’s side like a dog with its master.

¶138 “Your instructions will be done. It shall all be done,” said he.

¶139 “There must be no mistake,” said Holmes, looking round at him. The other winced as he read the menace in his eyes.

¶140 “Oh no, there shall be no mistake. It shall be there. Should I change it first or not?”

¶141 Holmes thought a little and then burst out laughing. “No, don’t,” said he; “I shall write to you about it. No tricks, now, or—”

¶142 “Oh, you can trust me, you can trust me!”

¶143 “Yes, I think I can. Well, you shall hear from me to-morrow.” He turned upon his heel, disregarding the trembling hand which the other held out to him, and we set off for King’s Pyland.

