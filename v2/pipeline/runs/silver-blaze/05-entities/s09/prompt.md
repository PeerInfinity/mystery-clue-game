<!-- system -->
You are one step of a pipeline that turns a detective story into structured data for a reading game. You see only
what this message gives you. Use only the text given, read as a first-time reader would read it: if you recognise
the story, do not use what you remember of it, its characters' secrets or its ending. Follow the format exactly.
Put your output in one or more ```jsonl fenced blocks, one JSON object per line; anything outside the blocks is
ignored, so keep remarks short.


<!-- user -->
# Step: entities and mentions, one scene

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

List the entities that scene s09 (Holmes explains on the train back to London, ¶215–¶231) brings in or names anew, and every
phrase by which the story names each, as far as the story has gone. You have the story up to the end of this scene
and the entities found so far; you have not read further.

- A new entity: `{"file": "entities", "id", "kind", "name", "within"?}`. Name an unknown person by how the story
  presents them so far. Include every person, group, animal, place, object and document the facts of the story so
  far would need: who is where, who has what, what is done to what. Places nest with `within` (a room within a house
  within an estate). In the first scene, also the state entities `calendar`, `clock` and, if the weather matters,
  `weather`. The narrators ([{"id":"watson","name":"Watson","kind":"first-person"}]) are entities too.
- A new phrase for an entity, new or old: `{"file": "mentions", "id", "phrases": [...]}`: each phrase exactly as it
  appears in the text (a name, a title, a description: "the trainer", "my companion"). Limit a phrase to paragraphs
  `{"text", "paras": [from, to]}` where the same words name something else elsewhere in the story so far. An
  entity with no phrase in the text gets `"source": "<a quote from the paragraph that brings it in>"` on its entity
  line.
- Something that travels and holds people (a carriage, a train): `{"file": "moves", "id"}`. A door between two
  places: `{"file": "joins", "door", "sides": [inside, outside]}`.
- To correct an entity already listed (a better name, a `within`): `{"file": "entities", "id", …the fields that change}`.

## The narrators

[{"id":"watson","name":"Watson","kind":"first-person"}]

## Entities so far

moves: ["train","landau","night_train","drag"]
joins: {"stable_door":["stables","moor"]}
{"id":"watson","kind":"person","name":"Watson"}
{"id":"holmes","kind":"person","name":"Sherlock Holmes"}
{"id":"rooms","kind":"place","name":"Holmes and Watson's room"}
{"id":"news_agent","kind":"person","name":"Their news agent"}
{"id":"england","kind":"place","name":"England"}
{"id":"dartmoor","kind":"place","name":"Dartmoor","within":"devonshire"}
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
{"id":"devonshire","kind":"place","name":"Devonshire","within":"england"}
{"id":"brown_boots","kind":"object","name":"Silas Brown's boots"}
{"id":"night_train","kind":"object","name":"The night train to London"}
{"id":"ross_jockey","kind":"person","name":"Colonel Ross's jockey"}
{"id":"straker_photo","kind":"document","name":"The photograph of John Straker"}
{"id":"envelope","kind":"object","name":"The Inspector's envelope"}
{"id":"sheep_lad","kind":"person","name":"The stable-lad who tends the sheep"}
{"id":"sheep","kind":"group","name":"The sheep in the paddock"}
{"id":"landau_door","kind":"object","name":"The landau's door","within":"landau"}
{"id":"winchester","kind":"place","name":"Winchester","within":"england"}
{"id":"winchester_station","kind":"place","name":"Winchester station","within":"winchester"}
{"id":"drag","kind":"object","name":"Colonel Ross's drag"}
{"id":"course","kind":"place","name":"The racecourse beyond Winchester","within":"winchester"}
{"id":"grand_stand","kind":"place","name":"The grand stand","within":"course"}
{"id":"enclosure","kind":"place","name":"The enclosure near the grand stand","within":"course"}
{"id":"weighing_enclosure","kind":"place","name":"The weighing enclosure","within":"course"}
{"id":"straight","kind":"place","name":"The straight of the course","within":"course"}
{"id":"winning_post","kind":"object","name":"The winning post","within":"course"}
{"id":"race_card","kind":"document","name":"The race card"}
{"id":"the_ring","kind":"group","name":"The betting ring"}
{"id":"cup_runners","kind":"group","name":"The six horses in the Wessex Cup"}
{"id":"heath_newton","kind":"person","name":"Mr. Heath Newton"}
{"id":"the_negro","kind":"animal","name":"The Negro"}
{"id":"wardlaw","kind":"person","name":"Colonel Wardlaw"}
{"id":"pugilist","kind":"animal","name":"Pugilist"}
{"id":"balmoral","kind":"person","name":"The Duke of Balmoral"}
{"id":"iris","kind":"animal","name":"Iris"}
{"id":"singleford","kind":"person","name":"Lord Singleford"}
{"id":"rasper","kind":"animal","name":"Rasper"}
{"id":"ross_colours","kind":"object","name":"Colonel Ross's black and red colours"}
{"id":"mapleton_colours","kind":"object","name":"The yellow colours of the Mapleton stable"}
{"id":"the_bay_horse","kind":"animal","name":"The bay horse in Colonel Ross's colours"}
{"id":"spirits_of_wine","kind":"object","name":"Spirits of wine"}

## Mentions so far

"watson": ["Watson","Dr. Watson","My friend Dr. Watson","My dear fellow",{"text":"My friend","paras":[158,158]}]
"holmes": ["Holmes","Sherlock Holmes","my companion","Mr. Holmes","my friend","our London consultant"]
"rooms": ["the room"]
"news_agent": ["our news agent"]
"england": ["England"]
"dartmoor": ["Dartmoor","the north of Dartmoor","the huge circle of Dartmoor"]
"kings_pyland": ["King’s Pyland","King's Pyland"]
"paddington": ["Paddington"]
"reading": ["Reading"]
"exeter": ["Exeter"]
"railway_line": ["this line"]
"telegraph_posts": ["the telegraph posts"]
"train": ["our train"]
"carriage": ["a first-class carriage"]
"carriage_seat": ["the seat"]
"carriage_window": ["the window"]
"silver_blaze": ["Silver Blaze","the favourite for the Wessex Cup","the horse","the most remarkable horse in England","the favourite","the missing favourite","the missing horse","the first favourite for the Wessex Cup","my horse","such a horse as this","our horse’s name","our horse","a strange horse","Colonel Ross’s Silver Blaze","the same old Silver Blaze",{"text":"The real murderer","paras":[212,212]}]
"wessex_cup": ["the Wessex Cup","the Cup",{"text":"the race","paras":[146,146]},"the race for the Wessex Cup","Wessex Plate",{"text":"my race","paras":[201,201]}]
"straker": ["John Straker","its trainer","Straker","The trainer","the trainer","the unfortunate trainer","his trainer","her husband","the murdered man","poor Straker","the dead man’s hand","the dead man","Mr. John Straker"]
"ross": ["Colonel Ross","the owner of the horse","the Colonel","his fortunate owner","Colonel Ross’s","a small, alert person","Colonel Ross, the well-known sportsman","The latter","The Colonel",{"text":"the owner","paras":[198,198]}]
"gregory": ["Inspector Gregory","a tall, fair man with lion-like hair and beard","the Inspector","The Inspector here","Gregory","The Inspector"]
"simpson": ["Fitzroy Simpson","young Fitzroy Simpson","Simpson","this Fitzroy Simpson","the accused","this man Simpson","our man"]
"pipe": ["his pipe"]
"newspapers": ["Fresh editions of every paper","the bundle of fresh papers"]
"telegraph_paper": ["_Telegraph_"]
"chronicle_paper": ["_Chronicle_"]
"field_glass": ["your very excellent field-glass","my field-glass"]
"travelling_cap": ["his ear-flapped travelling-cap"]
"cigar_case": ["his cigar-case"]
"holmes_watch": ["his watch"]
"memoirs": ["your memoirs"]
"cushions": ["the cushions"]
"watson_cigar": ["my cigar"]
"isonomy": ["Isonomy","his famous ancestor"]
"racing_public": ["the racing public",{"text":"the public","paras":[110,110]}]
"turf": ["the turf"]
"stables": ["the stables","the stable","the King’s Pyland training-stables","the Colonel’s training-stable","the buildings","a long grey-tiled out-building"]
"stable_door": ["the stable door",{"text":"the door","paras":[30,33]},{"text":"The door","paras":[33,33]}]
"stable_window": [{"text":"the window","paras":[25,31]},{"text":"The window","paras":[31,31]}]
"stable_table": ["the small table"]
"water_tap": ["a water-tap"]
"favourite_stall": ["the favourite’s stall"]
"harness_room": ["the harness-room"]
"stable_loft": ["the loft","the chaff-cutting loft"]
"stable_lads": ["three lads","All three"]
"hunter": ["Ned Hunter","Hunter","the lad","the stable-boy","a stable-boy","the stable-lad","the lad on duty","the boy","their watchman","the third"]
"other_lads": ["Two of the lads","the two lads","his fellow-grooms","the others"]
"kp_horses": ["four horses","the horses"]
"bayard": ["Bayard","our other one"]
"dog": ["the dog","the hound"]
"straker_villa": ["a small villa","the trainer’s house",{"text":"the house","paras":[29,37]},"a neat little red-brick villa with overhanging eaves","poor Straker’s house"]
"kitchen": ["the kitchen"]
"mrs_straker": ["Mrs. Straker","His wife",{"text":"a woman","paras":[86,86]},"the lady"]
"baxter": ["Edith Baxter","the maid","The maid","one maid-servant","The girl"]
"moor": ["the moor","the open moor","the moors","the neighbouring moors","the long, sloping plain","This part of the moor"]
"path": ["the path"]
"villas": ["a small cluster of villas","those villas"]
"tavistock_contractor": ["a Tavistock contractor"]
"tavistock": ["Tavistock","the little town of Tavistock","the quaint old Devonshire city"]
"mapleton": ["Mapleton","the Mapleton stables","the larger training establishment of Mapleton","another training-stable","a cluster of houses away to the westward","the stables of Mapleton",{"text":"his stables","paras":[147,147]}]
"backwater": ["Lord Backwater"]
"silas_brown": ["Silas Brown",{"text":"the trainer","paras":[66,66]},"Mr. Silas Brown","your master","Mr. Brown","a fierce-looking elderly man",{"text":"the trainer","paras":[132,137]},{"text":"the trainer’s ear","paras":[132,132]},{"text":"the other","paras":[139,143]},"Master Silas Brown","an old horse-faker like him",{"text":"a faker","paras":[204,204]}]
"desborough": ["Desborough","the second favourite","their horse","Lord Backwater’s Desborough",{"text":"its rival","paras":[200,200]}]
"gypsies": ["a few roaming gypsies","all the gypsies of Dartmoor"]
"lantern": ["a lantern","the lantern","your lantern"]
"curried_mutton": ["a dish of curried mutton","his curried mutton","his supper","the remains of his supper"]
"opium": ["powdered opium","the powdered opium","The opium"]
"the_stranger": ["the stranger","a man appeared","the same stranger","the other"]
"tweed_suit": ["a grey suit of tweeds"]
"cloth_cap": ["a cloth cap"]
"gaiters": ["gaiters"]
"stranger_stick": ["a heavy stick with a knob to it"]
"paper_packet": ["a piece of white paper folded up","the little paper packet","the paper which he wished the maid to give to the stable-boy"]
"holmes_wire": ["a special wire"]
"straker_coat": ["his large mackintosh","John Straker’s overcoat","the coat","the overcoat"]
"knoll": ["the knoll"]
"furze_bush": ["a furze-bush","the furze-bush","the bush"]
"hollow": ["a bowl-shaped depression in the moor","the fatal hollow","the spot where the murder took place","the scene of the crime","the hollow in which the body had been found","the hollow"]
"straker_knife": ["a small knife","Straker’s knife","his own knife","the small knife","an ivory-handled knife with a very delicate, inflexible blade","a very singular knife","this knife","a cataract knife",{"text":"the knife","paras":[82,82]}]
"cravat": ["a red and black silk cravat","the cravat","his cravat"]
"police": ["the police","The police"]
"london": ["London",{"text":"town","paras":[158,158]}]
"betting_book": ["his betting-book"]
"simpson_stick": ["a Penang-lawyer weighted with lead","his heavy stick",{"text":"a heavy stick","paras":[56,56]}]
"duplicate_key": ["a duplicate key","The key"]
"bridle": ["His bridle"]
"tavistock_station": ["the station"]
"landau": ["an open carriage","a comfortable landau",{"text":"the carriage","paras":[69,69]},{"text":"the carriage","paras":[169,169]}]
"detective_service": ["the English detective service"]
"ross_frock_coat": ["a frock-coat"]
"ross_gaiters": [{"text":"gaiters","paras":[47,47]}]
"ross_eyeglass": ["an eye-glass"]
"ross_hat": ["his hat"]
"ten_pound_note": ["a ten-pound note"]
"simpson_purse": ["his purse"]
"the_chemist": ["What chemist"]
"moor_pits": ["one of the pits or old mines upon the moor"]
"gypsy_party": ["a party of gypsies","these gypsies",{"text":"gypsies","paras":[114,114]}]
"driver": ["our driver","coachman"]
"road": ["the road"]
"paddock": ["a paddock","the paddock"]
"sitting_room": ["the sitting-room","the front room",{"text":"the parlour","paras":[157,157]},{"text":"the room","paras":[164,167]}]
"passage": ["the passage"]
"straker_bedroom": [{"text":"the room","paras":[82,82]}]
"dressing_table": ["the dressing-table"]
"central_table": ["the central table"]
"tin_box": ["a square tin box"]
"vestas": ["a box of vestas"]
"candle": ["two inches of tallow candle"]
"briar_pipe": ["an A.D.P. briar-root pipe"]
"tobacco_pouch": ["a pouch of seal-skin with half an ounce of long-cut Cavendish"]
"silver_watch": ["a silver watch with a gold chain"]
"sovereigns": ["five sovereigns in gold"]
"pencil_case": ["an aluminium pencil-case"]
"pocket_papers": ["a few papers","these papers"]
"hay_accounts": ["receipted hay-dealers’ accounts"]
"ross_letter": ["a letter of instructions from Colonel Ross"]
"milliner_account": ["a milliner’s account","the account"]
"billed_costume": ["a single costume"]
"cork_disk": ["a disk of cork"]
"weiss_co": ["Weiss & Co."]
"lesurier": ["Madame Lesurier"]
"bond_street": ["Bond Street"]
"derbyshire": ["William Derbyshire","Derbyshire"]
"madam_derbyshire": ["Madam Derbyshire"]
"plymouth": ["Plymouth"]
"dove_dress": ["a costume of dove-coloured silk with ostrich-feather trimming","such a dress"]
"matting": ["A piece of matting","the matting"]
"inspector_bag": ["this bag","the bag"]
"straker_boot": ["one of the boots which Straker wore"]
"simpson_shoe": ["one of Fitzroy Simpson’s shoes"]
"horseshoe": ["a cast horseshoe of Silver Blaze","this horseshoe","the shoe which he took from his pocket"]
"wax_vesta": ["a wax vesta half burned","a little chip of wood"]
"hollow_mud": ["the trampled mud","the mud which lay at the bottom of the fatal hollow"]
"hollow_rim": ["the rim of the hollow","the brink of it"]
"ross_watch": [{"text":"his watch","paras":[110,110]}]
"cup_entries": ["the entries for the Cup"]
"wet_hollow": ["a long hollow over yonder","the hollow in question","the marshy bottom"]
"horse_tracks": ["The track of a horse","the impression","the tracks","the horse’s","The double track","the trail","the same tracks","the return track"]
"man_tracks": ["A man’s track",{"text":"the impressions","paras":[146,146]}]
"asphalt_paving": ["the paving of asphalt"]
"mapleton_gates": ["the gates of the Mapleton stables","the gate"]
"dawson": ["Dawson","a groom"]
"hunting_crop": ["a hunting-crop","the hunting-crop"]
"half_crown": ["the half-crown","your money"]
"brown_parlour": ["your parlour"]
"devonshire": ["Devonshire"]
"brown_boots": ["his own boots"]
"night_train": ["the night train","the night-express"]
"ross_jockey": ["your jockey"]
"straker_photo": ["a photograph of Mr. John Straker"]
"envelope": ["an envelope"]
"sheep_lad": ["one of the stable-lads",{"text":"the lad","paras":[169,169]}]
"sheep": ["a few sheep","the sheep"]
"landau_door": [{"text":"the door","paras":[169,169]}]
"winchester": ["Winchester",{"text":"the town","paras":[183,183]}]
"winchester_station": [{"text":"the station","paras":[183,183]}]
"drag": ["his drag","the drag","our drag"]
"course": ["the course"]
"grand_stand": ["the grand stand"]
"enclosure": ["the enclosure"]
"weighing_enclosure": ["the weighing enclosure"]
"straight": ["the straight","the curve"]
"winning_post": ["the post"]
"race_card": ["the card"]
"the_ring": ["the ring"]
"cup_runners": ["The six horses","All six","the field","Only five"]
"heath_newton": ["Mr. Heath Newton"]
"the_negro": ["The Negro"]
"wardlaw": ["Colonel Wardlaw"]
"pugilist": ["Pugilist"]
"balmoral": ["Duke of Balmoral"]
"iris": ["Iris","the Duke of Balmoral’s Iris"]
"singleford": ["Lord Singleford"]
"rasper": ["Rasper"]
"ross_colours": ["My colours","the well-known black and red of the Colonel","black cap, red jacket"]
"mapleton_colours": ["the yellow of the Mapleton stable","yellow cap and sleeves"]
"the_bay_horse": ["a powerful bay horse","That beast","the Colonel’s horse","the thoroughbred"]
"spirits_of_wine": ["spirits of wine"]

## The story so far (this scene is ¶215–¶231)

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

¶144 “A more perfect compound of the bully, coward, and sneak than Master Silas Brown I have seldom met with,” remarked Holmes as we trudged along together.

¶145 “He has the horse, then?”

¶146 “He tried to bluster out of it, but I described to him so exactly what his actions had been upon that morning that he is convinced that I was watching him. Of course you observed the peculiarly square toes in the impressions, and that his own boots exactly corresponded to them. Again, of course no subordinate would have dared to do such a thing. I described to him how, when according to his custom he was the first down, he perceived a strange horse wandering over the moor. How he went out to it, and his astonishment at recognising, from the white forehead which has given the favourite its name, that chance had put in his power the only horse which could beat the one upon which he had put his money. Then I described how his first impulse had been to lead him back to King’s Pyland, and how the devil had shown him how he could hide the horse until the race was over, and how he had led it back and concealed it at Mapleton. When I told him every detail he gave it up and thought only of saving his own skin.”

¶147 “But his stables had been searched?”

¶148 “Oh, an old horse-faker like him has many a dodge.”

¶149 “But are you not afraid to leave the horse in his power now, since he has every interest in injuring it?”

¶150 “My dear fellow, he will guard it as the apple of his eye. He knows that his only hope of mercy is to produce it safe.”

¶151 “Colonel Ross did not impress me as a man who would be likely to show much mercy in any case.”

¶152 “The matter does not rest with Colonel Ross. I follow my own methods, and tell as much or as little as I choose. That is the advantage of being unofficial. I don’t know whether you observed it, Watson, but the Colonel’s manner has been just a trifle cavalier to me. I am inclined now to have a little amusement at his expense. Say nothing to him about the horse.”

¶153 “Certainly not without your permission.”

¶154 “And of course this is all quite a minor point compared to the question of who killed John Straker.”

¶155 “And you will devote yourself to that?”

¶156 “On the contrary, we both go back to London by the night train.”

¶157 I was thunderstruck by my friend’s words. We had only been a few hours in Devonshire, and that he should give up an investigation which he had begun so brilliantly was quite incomprehensible to me. Not a word more could I draw from him until we were back at the trainer’s house. The Colonel and the Inspector were awaiting us in the parlour.

¶158 “My friend and I return to town by the night-express,” said Holmes. “We have had a charming little breath of your beautiful Dartmoor air.”

¶159 The Inspector opened his eyes, and the Colonel’s lip curled in a sneer.

¶160 “So you despair of arresting the murderer of poor Straker,” said he.

¶161 Holmes shrugged his shoulders. “There are certainly grave difficulties in the way,” said he. “I have every hope, however, that your horse will start upon Tuesday, and I beg that you will have your jockey in readiness. Might I ask for a photograph of Mr. John Straker?”

¶162 The Inspector took one from an envelope and handed it to him.

¶163 “My dear Gregory, you anticipate all my wants. If I might ask you to wait here for an instant, I have a question which I should like to put to the maid.”

¶164 “I must say that I am rather disappointed in our London consultant,” said Colonel Ross, bluntly, as my friend left the room. “I do not see that we are any further than when he came.”

¶165 “At least you have his assurance that your horse will run,” said I.

¶166 “Yes, I have his assurance,” said the Colonel, with a shrug of his shoulders. “I should prefer to have the horse.”

¶167 I was about to make some reply in defence of my friend when he entered the room again.

¶168 “Now, gentlemen,” said he, “I am quite ready for Tavistock.”

¶169 As we stepped into the carriage one of the stable-lads held the door open for us. A sudden idea seemed to occur to Holmes, for he leaned forward and touched the lad upon the sleeve.

¶170 “You have a few sheep in the paddock,” he said. “Who attends to them?”

¶171 “I do, sir.”

¶172 “Have you noticed anything amiss with them of late?”

¶173 “Well, sir, not of much account; but three of them have gone lame, sir.”

¶174 I could see that Holmes was extremely pleased, for he chuckled and rubbed his hands together.

¶175 “A long shot, Watson; a very long shot,” said he, pinching my arm. “Gregory, let me recommend to your attention this singular epidemic among the sheep. Drive on, coachman!”

¶176 Colonel Ross still wore an expression which showed the poor opinion which he had formed of my companion’s ability, but I saw by the Inspector’s face that his attention had been keenly aroused.

¶177 “You consider that to be important?” he asked.

¶178 “Exceedingly so.”

¶179 “Is there any point to which you would wish to draw my attention?”

¶180 “To the curious incident of the dog in the night-time.”

¶181 “The dog did nothing in the night-time.”

¶182 “That was the curious incident,” remarked Sherlock Holmes.

¶183 Four days later Holmes and I were again in the train, bound for Winchester to see the race for the Wessex Cup. Colonel Ross met us by appointment outside the station, and we drove in his drag to the course beyond the town. His face was grave, and his manner was cold in the extreme.

¶184 “I have seen nothing of my horse,” said he.

¶185 “I suppose that you would know him when you saw him?” asked Holmes.

¶186 The Colonel was very angry. “I have been on the turf for twenty years, and never was asked such a question as that before,” said he. “A child would know Silver Blaze, with his white forehead and his mottled off-foreleg.”

¶187 “How is the betting?”

¶188 “Well, that is the curious part of it. You could have got fifteen to one yesterday, but the price has become shorter and shorter, until you can hardly get three to one now.”

¶189 “Hum!” said Holmes. “Somebody knows something, that is clear.”

¶190 As the drag drew up in the enclosure near the grand stand I glanced at the card to see the entries. It ran:—

¶191 Wessex Plate. 50 sovs each h ft with 1000 sovs added for four and five year olds. Second, £300. Third, £200. New course (one mile and five furlongs). 1. Mr. Heath Newton’s The Negro (red cap, cinnamon jacket). 2. Colonel Wardlaw’s Pugilist (pink cap, blue and black jacket). 3. Lord Backwater’s Desborough (yellow cap and sleeves). 4. Colonel Ross’s Silver Blaze (black cap, red jacket). 5. Duke of Balmoral’s Iris (yellow and black stripes). 6. Lord Singleford’s Rasper (purple cap, black sleeves).

¶192 “We scratched our other one, and put all hopes on your word,” said the Colonel. “Why, what is that? Silver Blaze favourite?”

¶193 “Five to four against Silver Blaze!” roared the ring. “Five to four against Silver Blaze! Five to fifteen against Desborough! Five to four on the field!”

¶194 “There are the numbers up,” I cried. “They are all six there.”

¶195 “All six there? Then my horse is running,” cried the Colonel in great agitation. “But I don’t see him. My colours have not passed.”

¶196 “Only five have passed. This must be he.”

¶197 As I spoke a powerful bay horse swept out from the weighing enclosure and cantered past us, bearing on its back the well-known black and red of the Colonel.

¶198 “That’s not my horse,” cried the owner. “That beast has not a white hair upon its body. What is this that you have done, Mr. Holmes?”

¶199 “Well, well, let us see how he gets on,” said my friend, imperturbably. For a few minutes he gazed through my field-glass. “Capital! An excellent start!” he cried suddenly. “There they are, coming round the curve!”

¶200 From our drag we had a superb view as they came up the straight. The six horses were so close together that a carpet could have covered them, but half way up the yellow of the Mapleton stable showed to the front. Before they reached us, however, Desborough’s bolt was shot, and the Colonel’s horse, coming away with a rush, passed the post a good six lengths before its rival, the Duke of Balmoral’s Iris making a bad third.

¶201 “It’s my race, anyhow,” gasped the Colonel, passing his hand over his eyes. “I confess that I can make neither head nor tail of it. Don’t you think that you have kept up your mystery long enough, Mr. Holmes?”

¶202 “Certainly, Colonel, you shall know everything. Let us all go round and have a look at the horse together. Here he is,” he continued, as we made our way into the weighing enclosure, where only owners and their friends find admittance. “You have only to wash his face and his leg in spirits of wine, and you will find that he is the same old Silver Blaze as ever.”

¶203 “You take my breath away!”

¶204 “I found him in the hands of a faker, and took the liberty of running him just as he was sent over.”

¶205 “My dear sir, you have done wonders. The horse looks very fit and well. It never went better in its life. I owe you a thousand apologies for having doubted your ability. You have done me a great service by recovering my horse. You would do me a greater still if you could lay your hands on the murderer of John Straker.”

¶206 “I have done so,” said Holmes quietly.

¶207 The Colonel and I stared at him in amazement. “You have got him! Where is he, then?”

¶208 “He is here.”

¶209 “Here! Where?”

¶210 “In my company at the present moment.”

¶211 The Colonel flushed angrily. “I quite recognise that I am under obligations to you, Mr. Holmes,” said he, “but I must regard what you have just said as either a very bad joke or an insult.”

¶212 Sherlock Holmes laughed. “I assure you that I have not associated you with the crime, Colonel,” said he. “The real murderer is standing immediately behind you.” He stepped past and laid his hand upon the glossy neck of the thoroughbred.

¶213 “The horse!” cried both the Colonel and myself.

¶214 “Yes, the horse. And it may lessen his guilt if I say that it was done in self-defence, and that John Straker was a man who was entirely unworthy of your confidence. But there goes the bell, and as I stand to win a little on this next race, I shall defer a lengthy explanation until a more fitting time.”

¶215 We had the corner of a Pullman car to ourselves that evening as we whirled back to London, and I fancy that the journey was a short one to Colonel Ross as well as to myself, as we listened to our companion’s narrative of the events which had occurred at the Dartmoor training-stables upon the Monday night, and the means by which he had unravelled them.

¶216 “I confess,” said he, “that any theories which I had formed from the newspaper reports were entirely erroneous. And yet there were indications there, had they not been overlaid by other details which concealed their true import. I went to Devonshire with the conviction that Fitzroy Simpson was the true culprit, although, of course, I saw that the evidence against him was by no means complete. It was while I was in the carriage, just as we reached the trainer’s house, that the immense significance of the curried mutton occurred to me. You may remember that I was distrait, and remained sitting after you had all alighted. I was marvelling in my own mind how I could possibly have overlooked so obvious a clue.”

¶217 “I confess,” said the Colonel, “that even now I cannot see how it helps us.”

¶218 “It was the first link in my chain of reasoning. Powdered opium is by no means tasteless. The flavour is not disagreeable, but it is perceptible. Were it mixed with any ordinary dish the eater would undoubtedly detect it, and would probably eat no more. A curry was exactly the medium which would disguise this taste. By no possible supposition could this stranger, Fitzroy Simpson, have caused curry to be served in the trainer’s family that night, and it is surely too monstrous a coincidence to suppose that he happened to come along with powdered opium upon the very night when a dish happened to be served which would disguise the flavour. That is unthinkable. Therefore Simpson becomes eliminated from the case, and our attention centres upon Straker and his wife, the only two people who could have chosen curried mutton for supper that night. The opium was added after the dish was set aside for the stable-boy, for the others had the same for supper with no ill effects. Which of them, then, had access to that dish without the maid seeing them?

¶219 “Before deciding that question I had grasped the significance of the silence of the dog, for one true inference invariably suggests others. The Simpson incident had shown me that a dog was kept in the stables, and yet, though some one had been in and had fetched out a horse, he had not barked enough to arouse the two lads in the loft. Obviously the midnight visitor was some one whom the dog knew well.

¶220 “I was already convinced, or almost convinced, that John Straker went down to the stables in the dead of the night and took out Silver Blaze. For what purpose? For a dishonest one, obviously, or why should he drug his own stable-boy? And yet I was at a loss to know why. There have been cases before now where trainers have made sure of great sums of money by laying against their own horses, through agents, and then preventing them from winning by fraud. Sometimes it is a pulling jockey. Sometimes it is some surer and subtler means. What was it here? I hoped that the contents of his pockets might help me to form a conclusion.

¶221 “And they did so. You cannot have forgotten the singular knife which was found in the dead man’s hand, a knife which certainly no sane man would choose for a weapon. It was, as Dr. Watson told us, a form of knife which is used for the most delicate operations known in surgery. And it was to be used for a delicate operation that night. You must know, with your wide experience of turf matters, Colonel Ross, that it is possible to make a slight nick upon the tendons of a horse’s ham, and to do it subcutaneously, so as to leave absolutely no trace. A horse so treated would develop a slight lameness, which would be put down to a strain in exercise or a touch of rheumatism, but never to foul play.”

¶222 “Villain! Scoundrel!” cried the Colonel.

¶223 “We have here the explanation of why John Straker wished to take the horse out on to the moor. So spirited a creature would have certainly roused the soundest of sleepers when it felt the prick of the knife. It was absolutely necessary to do it in the open air.”

¶224 “I have been blind!” cried the Colonel. “Of course that was why he needed the candle, and struck the match.”

¶225 “Undoubtedly. But in examining his belongings I was fortunate enough to discover not only the method of the crime, but even its motives. As a man of the world, Colonel, you know that men do not carry other people’s bills about in their pockets. We have most of us quite enough to do to settle our own. I at once concluded that Straker was leading a double life, and keeping a second establishment. The nature of the bill showed that there was a lady in the case, and one who had expensive tastes. Liberal as you are with your servants, one can hardly expect that they can buy twenty-guinea walking dresses for their ladies. I questioned Mrs. Straker as to the dress without her knowing it, and having satisfied myself that it had never reached her, I made a note of the milliner’s address, and felt that by calling there with Straker’s photograph I could easily dispose of the mythical Derbyshire.

¶226 “From that time on all was plain. Straker had led out the horse to a hollow where his light would be invisible. Simpson in his flight had dropped his cravat, and Straker had picked it up—with some idea, perhaps, that he might use it in securing the horse’s leg. Once in the hollow, he had got behind the horse and had struck a light; but the creature frightened at the sudden glare, and with the strange instinct of animals feeling that some mischief was intended, had lashed out, and the steel shoe had struck Straker full on the forehead. He had already, in spite of the rain, taken off his overcoat in order to do his delicate task, and so, as he fell, his knife gashed his thigh. Do I make it clear?”

¶227 “Wonderful!” cried the Colonel. “Wonderful! You might have been there!”

¶228 “My final shot was, I confess a very long one. It struck me that so astute a man as Straker would not undertake this delicate tendon-nicking without a little practice. What could he practice on? My eyes fell upon the sheep, and I asked a question which, rather to my surprise, showed that my surmise was correct.

¶229 “When I returned to London I called upon the milliner, who had recognised Straker as an excellent customer of the name of Derbyshire, who had a very dashing wife, with a strong partiality for expensive dresses. I have no doubt that this woman had plunged him over head and ears in debt, and so led him into this miserable plot.”

¶230 “You have explained all but one thing,” cried the Colonel. “Where was the horse?”

¶231 “Ah, it bolted, and was cared for by one of your neighbours. We must have an amnesty in that direction, I think. This is Clapham Junction, if I am not mistaken, and we shall be in Victoria in less than ten minutes. If you care to smoke a cigar in our rooms, Colonel, I shall be happy to give you any other details which might interest you.”

