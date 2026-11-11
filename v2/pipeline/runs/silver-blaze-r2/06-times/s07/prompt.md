<!-- system -->
You are one step of a pipeline that turns a detective story into structured data for a reading game. You see only
what this message gives you. Use only the text given, read as a first-time reader would read it: if you recognise
the story, do not use what you remember of it, its characters' secrets or its ending. Follow the format exactly.
Put your output in one or more ```jsonl fenced blocks, one JSON object per line; anything outside the blocks is
ignored, so keep remarks short.


<!-- user -->
# Step: time points, one scene

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

Add the time points that scene s07 (Walking back, Holmes announces his return to London; the sheep and the dog, ¶144–¶182) needs: every point at which
something the scene tells happens, or is said to have happened (the story's present, the night of the crime as a
witness tells it, years before), ordered by `after` as far as the text orders them. Lines
`{"file": "times", "id", "label", "after"?, "para"?, "quote"?, "note"?}`; a point needs `para` and `quote` where
the text dates it. Give a thing that moves a point per move. A label says only what the story has told by its `para` (no day, hour, place or name not yet given there); give
`labels` steps where a later paragraph tells more, as a correction line for a point so far. Use the points so far
where they fit; a later
correction of a point so far is a line with its id and the fields that change. You have the story up to the end of
this scene; you have not read further.

## Entities

watson: Watson
holmes: Sherlock Holmes
calendar: The day of the week
clock: The time of day
england: England
holmes_rooms: Holmes and Watson's rooms
dartmoor: Dartmoor
kings_pyland: King's Pyland
paddington: Paddington
reading: Reading
exeter: Exeter
train: The train from Paddington
carriage: A first-class carriage
silver_blaze: Silver Blaze
straker: John Straker
ross: Colonel Ross
gregory: Inspector Gregory
simpson: Fitzroy Simpson
wessex_cup: The Wessex Cup
news_agent: Holmes and Watson's news agent
fresh_editions: Fresh editions of every paper
bundle_of_papers: The bundle of fresh papers from Paddington
the_telegraph: The Telegraph
the_chronicle: The Chronicle
ross_telegram: Colonel Ross's telegram
gregory_telegram: Inspector Gregory's telegram
field_glass: Watson's field-glass
holmes_pipe: Holmes's pipe
cigar_case: Holmes's cigar-case
holmes_watch: Holmes's watch
travelling_cap: Holmes's ear-flapped travelling-cap
telegraph_posts: The telegraph posts upon the line
quarter_mile_posts: The quarter-mile posts
weather: The weather
isonomy: Isonomy
racing_public: The racing public
stables: The King's Pyland training-stables
stall: The favourite's stall
harness_room: The harness-room
loft: The chaff-cutting loft above the harness-room
stable_door: The stable door
stable_window: The stable window where the meals are handed in
small_table: The small table in the stable
water_tap: The water-tap in the stables
kings_pyland_stable: The King's Pyland establishment
stable_lads: The three stable lads
two_lads: The two lads who slept in the loft
hunter: Ned Hunter
kings_pyland_horses: The four horses at King's Pyland
bayard: Bayard
straker_villa: Straker's small villa
kitchen: The kitchen of the trainer's house
path: The path across the moor to the stables
knoll: The knoll near the house
mrs_straker: Mrs. Straker
edith_baxter: Edith Baxter
two_women: The two women
villas: The small cluster of villas to the north
simpson_villa: Simpson's villa
tavistock_contractor: A Tavistock contractor
tavistock: Tavistock
mapleton: Mapleton
backwater: Lord Backwater
silas_brown: Silas Brown
desborough: Desborough
gypsies: The gypsies of Dartmoor
the_stranger: The stranger who stopped the maid near the stables
stranger_suit: The stranger's grey suit of tweeds
stranger_cap: The stranger's cloth cap
stranger_gaiters: The stranger's gaiters
stranger_stick: The stranger's heavy stick with a knob
paper_packet: The folded piece of white paper
lantern: The maid's lantern
hunter_supper: Hunter's supper of curried mutton
house_supper: The curried mutton eaten at the house
opium: Powdered opium
dog: The stable dog
straker_coat: Straker's large mackintosh
furze_bush: The furze-bush
hollow: The bowl-shaped depression in the moor
heavy_weapon: The heavy weapon that struck Straker
sharp_instrument: The sharp instrument that cut Straker's thigh
straker_knife: Straker's small knife
cravat: The red and black silk cravat
bridle: Silver Blaze's bridle
duplicate_key: A duplicate key to the stable door
special_wire: Holmes's special wire to Dartmoor
police: The police
betting_book: Simpson's betting-book
simpson_stick: Simpson's Penang-lawyer weighted with lead
london: London
sporting_clubs: The sporting clubs of London
watson_cigar: Watson's cigar
devonshire: Devonshire
tavistock_station: Tavistock station
landau: The open carriage, a comfortable landau
ross_frock_coat: Colonel Ross's frock-coat
ross_gaiters: Colonel Ross's gaiters
ross_eye_glass: Colonel Ross's eye-glass
ross_hat: Colonel Ross's hat
detective_service: The English detective service
ten_pound_note: The ten-pound note found in Simpson's purse
simpson_purse: Simpson's purse
pits_mines: The pits and old mines upon the moor
gypsy_party: The party of gypsies encamped near the spot of the murder
gypsy_camp: The gypsies' camp within a mile of the murder
tavistock_stables: The stables and out-houses in and around Tavistock
driver: The driver of the landau
road: The road by Straker's villa
paddock: The paddock by Straker's villa
upstairs_room: The room upstairs where Straker lies
sitting_room: The sitting-room of Straker's villa
passage: The passage of Straker's villa
straker_bedroom: The room Straker left that night
dressing_table: The dressing-table
central_table: The central table in the sitting-room
tin_box: The square tin box
vestas: A box of vestas
tallow_candle: Two inches of tallow candle
straker_pipe: An A.D.P. briar-root pipe
tobacco_pouch: A pouch of seal-skin
cavendish: Half an ounce of long-cut Cavendish
straker_watch: A silver watch with a gold chain
sovereigns: Five sovereigns in gold
pencil_case: An aluminium pencil-case
pocket_papers: The papers in Straker's pockets
weiss_co: Weiss & Co., London
cork_disk: The disk of cork that guarded the knife's tip
hay_accounts: Three receipted hay-dealers' accounts
ross_letter: A letter of instructions from Colonel Ross
milliner_account: The milliner's account made out to William Derbyshire
lesurier: Madame Lesurier
bond_street: Bond Street
derbyshire: William Derbyshire
madam_derbyshire: Madam Derbyshire
account_costume: The costume on the milliner's account
plymouth: Plymouth
garden_party: A garden-party in Plymouth
dove_dress: A costume of dove-coloured silk with ostrich-feather trimming
matting: The piece of matting laid at the side of the hollow
gregory_bag: The Inspector's bag
straker_boot: One of the boots which Straker wore
simpson_shoe: One of Fitzroy Simpson's shoes
horseshoe: A cast horseshoe of Silver Blaze
wax_vesta: A wax vesta half burned, found in the mud of the hollow
ross_watch: Colonel Ross's watch
cup_entries: The entries for the Wessex Cup
the_public: The public
long_hollow: The long hollow towards Mapleton
horse_track: The track of a horse in the soft earth
man_track: The man's track beside the horse's, near Mapleton
return_track: The same tracks coming back in the opposite direction
mapleton_paving: The asphalt paving up to the Mapleton gates
mapleton_gates: The gates of the Mapleton stables
brown_parlour: Silas Brown's parlour
dawson: Dawson
hunting_crop: Silas Brown's hunting-crop
half_crown: Holmes's half-crown
brown_charge: What Silas Brown promises shall be there
night_train: The night train to London
brown_boots: Silas Brown's boots
ross_jockey: Colonel Ross's jockey
straker_photo: A photograph of John Straker
photo_envelope: The Inspector's envelope
sheep_lad: The stable-lad who looks after the sheep
sheep: The sheep in the paddock
lame_sheep: The three lame sheep

## Time points so far

{"id":"t.before","label":"Before the story"}
{"id":"t.crime","label":"When the favourite vanished and its trainer was murdered","labels":[{"from":4,"label":"When the favourite vanished and its trainer was murdered"},{"from":10,"label":"When Silver Blaze vanished and John Straker was murdered"}],"after":["t.straker_leaves","t.horse_taken"],"para":4,"quote":"the singular disappearance of the favourite for the Wessex Cup, and the tragic murder of its trainer","note":"The struggle in the hollow on Monday night (¶19, ¶35–37), after Straker left the house at one and before seven in the morning."}
{"id":"t.tue_evening","label":"Tuesday evening","after":"t.crime","para":12,"quote":"On Tuesday evening I received telegrams"}
{"id":"t.wed","label":"The day before, while Holmes brooded","labels":[{"from":4,"label":"The day before, while Holmes brooded"},{"from":13,"label":"Wednesday, while Holmes brooded"}],"after":"t.tue_evening","para":4,"quote":"For a whole day my companion had rambled about the room","note":"Holmes's 'yesterday' (¶14), between Tuesday evening and Thursday morning (¶13). The fresh editions are sent up during this day."}
{"id":"t.watson_reads_papers","label":"When Watson read the Telegraph and the Chronicle","after":"t.crime","para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say","note":"Before the journey; not otherwise dated."}
{"id":"t.simpson_arrest","label":"When Fitzroy Simpson was arrested","after":"t.gregory_arrives","para":14,"quote":"beyond the arrest of young Fitzroy Simpson nothing had been done","note":"Gregory arrests him on his arrival (¶39); Simpson's statement and the cravat put to him (¶40). Known to Holmes by Thursday morning."}
{"id":"t.thu_breakfast","label":"One morning, at breakfast","labels":[{"from":1,"label":"One morning, at breakfast"},{"from":13,"label":"Thursday morning, at breakfast"}],"after":["t.wed","t.simpson_arrest","t.watson_reads_papers"],"para":1,"quote":"as we sat down together to our breakfast one morning"}
{"id":"t.paddington","label":"Thursday morning, at Paddington","after":"t.thu_breakfast","para":7,"quote":"which he had procured at Paddington"}
{"id":"t.train_out","label":"Thursday morning, in the train from Paddington","after":"t.paddington","para":7,"quote":"an hour or so later I found myself in the corner of a first-class carriage","note":"Holmes reads the papers, before Reading."}
{"id":"t.train_reading","label":"Thursday morning, the train passing Reading","after":"t.train_out","para":7,"quote":"We had left Reading far behind us"}
{"id":"t.train_beyond_reading","label":"Thursday morning, in the train well past Reading","after":"t.train_reading","para":7,"quote":"We had left Reading far behind us before he thrust the last one of them under the seat","note":"The cigar-case, the speed reckoning (¶8–10) and Holmes's talk of the case (¶10–16)."}
{"id":"t.straker_years","label":"Years before, while Straker served Colonel Ross as jockey and then as trainer","after":"t.before","para":19,"quote":"He has served the Colonel for five years as jockey and for seven as trainer","note":"Twelve years of service up to now; Simpson's squandering of his fortune upon the turf (¶39) is also in this long past, undated."}
{"id":"t.simpson_bets","label":"When Fitzroy Simpson registered his bets against the favourite","after":"t.before","para":39,"quote":"bets to the amount of five thousand pounds had been registered by him against the favourite","note":"Before the catastrophe; not otherwise dated."}
{"id":"t.simpson_comes_down","label":"When Fitzroy Simpson came down to Dartmoor","after":"t.before","para":40,"quote":"he had come down to Dartmoor in the hope of getting some information","note":"Before Monday evening, when he met the maid; not otherwise dated."}
{"id":"t.mon_evening","label":"Monday evening, before nine","after":["t.straker_years","t.simpson_bets"],"para":20,"quote":"On that evening the horses had been exercised and watered as usual","note":"¶19 names the night: 'last Monday night when the catastrophe occurred'."}
{"id":"t.mon_nine","label":"Monday evening, nine o'clock","after":"t.mon_evening","para":20,"quote":"the stables were locked up at nine o'clock","note":"Two lads walk up to the trainer's house for supper in the kitchen; Hunter stays on guard."}
{"id":"t.mon_maid_path","label":"Monday evening, a few minutes after nine, the maid on the path","after":["t.mon_nine","t.simpson_comes_down"],"para":20,"quote":"At a few minutes after nine the maid, Edith Baxter, carried down to the stables his supper","note":"The stranger stops her within thirty yards of the stables (¶21–24)."}
{"id":"t.mon_window","label":"Monday evening, the maid and the stranger at the stable window","after":"t.mon_maid_path","para":25,"quote":"ran past him to the window through which she was accustomed to hand the meals","note":"The stranger speaks with Hunter through the window (¶26–29); Hunter goes for the dog; the maid flees to the house."}
{"id":"t.mon_hunter_out","label":"Monday evening, a minute later, Hunter runs out with the dog","after":"t.mon_window","para":29,"quote":"A minute later, however, when Hunter rushed out with the hound he was gone","note":"Hunter locks the door before he leaves it (¶31) and searches round the buildings."}
{"id":"t.mon_lads_return","label":"Monday night, when the other lads returned","after":"t.mon_hunter_out","para":32,"quote":"Hunter waited until his fellow-grooms had returned, when he sent a message to the trainer"}
{"id":"t.mon_straker_told","label":"Monday night, when Straker heard Hunter's message","after":"t.mon_lads_return","para":32,"quote":"Straker was excited at hearing the account"}
{"id":"t.straker_leaves","label":"Monday night, one in the morning, Straker leaves the house","after":"t.mon_straker_told","para":32,"quote":"Mrs. Straker, waking at one in the morning, found that he was dressing","note":"Rain pattering against the window; he pulls on his mackintosh and walks out towards the stables."}
{"id":"t.horse_taken","label":"When the favourite was taken from his stall","after":"t.mon_nine","para":33,"quote":"the favourite’s stall was empty","note":"Not dated by the text; before the struggle in the hollow, where the horse was (¶37). The police hold that Simpson took him out (¶46)."}
{"id":"t.morning_seven","label":"The next morning, at seven","after":"t.crime","para":33,"quote":"Mrs. Straker awoke at seven in the morning","note":"She finds her husband not returned and goes with the maid to the stables: the door open, Hunter stupefied, the stall empty."}
{"id":"t.morning_search","label":"The next morning, the search from the knoll and the finding of the body","after":"t.morning_seven","para":34,"quote":"on ascending the knoll near the house","note":"The lads roused, the search, the coat on the furze-bush and the body in the hollow (¶34–35)."}
{"id":"t.hunter_recovers","label":"When Hunter recovered from his stupor","after":"t.morning_search","para":36,"quote":"Hunter, on recovering from his stupor"}
{"id":"t.analysis","label":"When the remains of the stable-lad's supper were analysed","after":"t.morning_search","para":37,"quote":"an analysis has shown that the remains of his supper"}
{"id":"t.reward","label":"When a reward was offered for the missing horse","after":"t.morning_search","para":37,"quote":"although a large reward has been offered"}
{"id":"t.gregory_arrives","label":"When Inspector Gregory arrived","after":"t.morning_search","para":39,"quote":"On his arrival he promptly found and arrested the man"}
{"id":"t.race","label":"Next Tuesday, at the fall of the flag","after":"t.train_beyond_reading","para":18,"quote":"at the fall of the flag next Tuesday","note":"The Wessex Cup."}
{"id":"t.gregory_stables","label":"When Inspector Gregory examined the stables and out-houses round Tavistock","after":"t.gregory_arrives","para":64,"quote":"I have also examined every stable and out-house in Tavistock, and for a radius of ten miles","note":"Before Holmes and Watson arrive; not otherwise dated."}
{"id":"t.gregory_mapleton","label":"When Inspector Gregory examined the Mapleton stables","after":"t.gregory_arrives","para":66,"quote":"We have, however, examined the stables, and there is nothing to connect him with the affair","note":"Before Holmes and Watson arrive; not ordered against the other searches."}
{"id":"t.gypsies_gone","label":"Tuesday, when the gypsies were gone","after":"t.crime","para":62,"quote":"On Tuesday they were gone","note":"The gypsies were encamped on Monday night within a mile of the spot of the murder (¶62)."}
{"id":"t.gypsy_traces_found","label":"When the traces of the gypsies' camp were found","after":["t.gregory_arrives","t.gypsies_gone"],"para":62,"quote":"We have found traces which show that a party of gypsies encamped on Monday night","note":"Before Holmes and Watson arrive."}
{"id":"t.simpson_summers","label":"Two summers when Fitzroy Simpson lodged at Tavistock","after":"t.before","para":58,"quote":"He has twice lodged at Tavistock in the summer","note":"Before the story; two stays, not otherwise dated."}
{"id":"t.brown_bets","label":"When Silas Brown laid his bets upon the Wessex Cup","after":"t.before","para":66,"quote":"Silas Brown, the trainer, is known to have had large bets upon the event","note":"Before the race; not otherwise dated."}
{"id":"t.simpson_lost_cravat","label":"When Fitzroy Simpson says he lost his cravat","after":"t.before","para":60,"quote":"declares that he had lost it","note":"Simpson's claim only; the maid says the stranger wore it on Monday evening (¶35)."}
{"id":"t.tavistock_arrival","label":"Thursday evening, at Tavistock station","after":["t.train_beyond_reading","t.gregory_stables","t.gregory_mapleton","t.gypsy_traces_found"],"para":47,"quote":"It was evening before we reached the little town of Tavistock","note":"Colonel Ross and Inspector Gregory meet them in the station (¶47–50)."}
{"id":"t.landau_drive","label":"Thursday evening, driving in the landau through Tavistock","after":"t.tavistock_arrival","para":51,"quote":"A minute later we were all seated in a comfortable landau, and were rattling through the quaint old Devonshire city","note":"Gregory's talk of the case with Holmes (¶51–68); the moor is being scoured for the gypsies at this time (¶64)."}
{"id":"t.villa_arrival","label":"Thursday evening, the landau pulls up at a red-brick villa","labels":[{"from":69,"label":"Thursday evening, the landau pulls up at a red-brick villa"},{"from":72,"label":"Thursday evening, the landau pulls up at Straker's villa"}],"after":["t.landau_drive","t.body_brought_back","t.mrs_straker_tells"],"para":69,"quote":"A few minutes later our driver pulled up at a neat little red-brick villa","note":"Holmes sits on in the carriage, absorbed, until Watson touches his arm (¶69–70). The talk with Gregory and the Colonel at the door follows (¶71–77)."}
{"id":"t.sitting_room","label":"Thursday evening, Straker's pocket things laid out in the sitting-room","after":"t.villa_arrival","para":78,"quote":"We all filed into the front room and sat round the central table","note":"Gregory opens the tin box. The knife, the papers and the milliner's account are examined (¶78–85)."}
{"id":"t.passage_mrs_straker","label":"Thursday evening, Mrs. Straker in the passage","after":"t.sitting_room","para":86,"quote":"As we emerged from the sitting-room a woman, who had been waiting in the passage","note":"Holmes asks about the garden-party at Plymouth (¶86–92)."}
{"id":"t.inquest","label":"The next day, the inquest","after":"t.villa_arrival","para":73,"quote":"The inquest is to-morrow"}
{"id":"t.body_brought_back","label":"When Straker's body was brought back to his house","after":"t.morning_search","para":73,"quote":"Yes; he lies upstairs","note":"Holmes's 'Straker was brought back here, I presume?' (¶72). Not otherwise dated. The things from his pockets go into Gregory's tin box at some time after the body was found."}
{"id":"t.mrs_straker_tells","label":"When Mrs. Straker told the Inspector of the knife and of Derbyshire","after":"t.morning_search","para":82,"quote":"His wife tells us that the knife had lain upon the dressing-table","note":"Also told in ¶84: 'Mrs. Straker tells us that Derbyshire was a friend of her husband's'. This was before Holmes arrived; it is not otherwise dated."}
{"id":"t.derbyshire_letters","label":"The times when letters for William Derbyshire were addressed to Straker's house","after":"t.before","para":84,"quote":"occasionally his letters were addressed here","note":"This is what Mrs. Straker says. It is undated and in the past."}
{"id":"t.milliner_account","label":"When Madame Lesurier made out the account to William Derbyshire","after":"t.before","para":84,"quote":"a milliner’s account for thirty-seven pounds fifteen made out by Madame Lesurier, of Bond Street, to William Derbyshire","note":"The text does not date it. The account was in Straker's pocket at his death, so it comes before the crime, but the text does not order it against that point."}
{"id":"t.plymouth_party","label":"Some little time ago, a garden-party in Plymouth","after":"t.before","para":89,"quote":"Surely I met you in Plymouth at a garden-party some little time ago","note":"This is Holmes's claim, and Mrs. Straker denies it (¶90). The dove-coloured silk costume belongs to this claim (¶91–92)."}
{"id":"t.walk_to_hollow","label":"Thursday evening, the short walk across the moor to the hollow","after":"t.passage_mrs_straker","para":93,"quote":"A short walk across the moor took us to the hollow in which the body had been found","note":"Holmes follows the Inspector outside from Straker's house."}
{"id":"t.at_hollow","label":"Thursday evening, at the hollow where the body was found","after":"t.walk_to_hollow","para":93,"quote":"At the brink of it was the furze-bush upon which the coat had been hung","note":"Talk of the wind, the coat and the matting. Holmes studies the mud, finds the vesta and compares the boots (¶94–108). The Colonel looks at his watch and asks about the entries (¶110–112)."}
{"id":"t.coat_laid","label":"When the overcoat was laid across the furze-bush","after":"t.straker_leaves","para":97,"quote":"Yes, it was laid across the bush","note":"This is on the night of the crime, when there was no wind but very heavy rain (¶94–95). It comes before the coat was seen from the knoll (¶35), but the text does not order it against the struggle."}
{"id":"t.vesta_dropped","label":"When the half-burned wax vesta came into the mud of the hollow","after":"t.before","para":102,"quote":"It was a wax vesta half burned","note":"The text does not date it. It was buried in the mud and overlooked until Holmes looked for it."}
{"id":"t.shoe_cast","label":"When Silver Blaze cast the horseshoe in the Inspector's bag","after":"t.before","para":101,"quote":"a cast horseshoe of Silver Blaze","note":"The text does not date it."}
{"id":"t.ground_trampled","label":"Since Monday night, the feet trampling the ground at the hollow","after":"t.morning_search","para":98,"quote":"No doubt many feet have been here since Monday night","note":"This is when the matting was laid at the side and stood upon (¶99). It comes before Holmes arrives at the hollow."}
{"id":"t.gregory_examines_ground","label":"When the Inspector examined the ground a hundred yards round the hollow","after":"t.gregory_arrives","para":108,"quote":"I have examined the ground very carefully for a hundred yards in each direction","note":"This was before Holmes arrived. The boot, the shoe and the horseshoe went into the Inspector's bag at some time before this scene (¶101)."}
{"id":"t.holmes_moor_walk","label":"Thursday evening, before dark, Holmes's walk over the moor","after":"t.at_hollow","para":109,"quote":"I should like to take a little walk over the moor before it grows dark","note":"Holmes and Watson walk slowly across the moor as the sun sinks behind the Mapleton stables. Holmes reasons out where the horse has gone (¶113–116)."}
{"id":"t.ross_back_to_house","label":"Thursday evening, the Colonel and the Inspector back at Straker's house","after":"t.at_hollow","para":112,"quote":"You will find us at poor Straker's house when you have finished your walk","note":"The Colonel asks the Inspector to come back with him (¶110)."}
{"id":"t.drive_to_tavistock","label":"Thursday evening, the drive together into Tavistock","after":["t.holmes_moor_walk","t.ross_back_to_house","t.set_off_pyland"],"para":112,"quote":"we can drive together into Tavistock","note":"This is planned. It comes after Holmes's walk."}
{"id":"t.next_day_ground","label":"The next day, when Holmes means to know his ground","after":"t.holmes_moor_walk","para":109,"quote":"that I may know my ground to-morrow","note":"This is the same day as the inquest (¶73), but the text does not order the two."}
{"id":"t.long_hollow_tracks","label":"Thursday evening, at the long hollow towards Mapleton","after":"t.holmes_moor_walk","para":117,"quote":"a few more minutes brought us to the hollow in question","note":"Holmes finds the horse's track and fits the horseshoe to it."}
{"id":"t.near_mapleton_tracks","label":"Thursday evening, picking up the tracks again close to Mapleton","after":"t.long_hollow_tracks","para":119,"quote":"only to pick them up once more quite close to Mapleton","note":"They cross the marshy bottom and the dry turf, and lose the tracks for half a mile. Here a man's track appears beside the horse's."}
{"id":"t.follow_toward_pyland","label":"Thursday evening, following the double track towards King's Pyland","after":"t.near_mapleton_tracks","para":122,"quote":"we both followed along after it","note":"Watson sees the same tracks coming back in the opposite direction."}
{"id":"t.follow_return_track","label":"Thursday evening, following the return track","after":"t.follow_toward_pyland","para":123,"quote":"Let us follow the return track"}
{"id":"t.mapleton_gates","label":"Thursday evening, at the gates of the Mapleton stables","after":"t.follow_return_track","para":124,"quote":"It ended at the paving of asphalt which led up to the gates of the Mapleton stables","note":"The groom runs out. Silas Brown comes out and Holmes whispers to him (¶124–135)."}
{"id":"t.brown_parlour","label":"Thursday evening, Holmes and Silas Brown in the parlour","after":"t.mapleton_gates","para":136,"quote":"Now, Mr. Brown, I am quite at your disposal","note":"About twenty minutes (¶137). Watson waits outside."}
{"id":"t.brown_reappears","label":"Thursday evening, at dusk, Holmes and Silas Brown reappear","after":"t.brown_parlour","para":137,"quote":"It was twenty minutes, and the reds had all faded into greys before Holmes and the trainer reappeared","note":"Brown promises Holmes his instructions will be done (¶138–143)."}
{"id":"t.set_off_pyland","label":"Thursday evening, setting off for King's Pyland","after":"t.brown_reappears","para":143,"quote":"we set off for King’s Pyland"}
{"id":"t.tomorrow_five","label":"Five o'clock the next morning, when Holmes speaks of calling on Silas Brown","after":"t.mapleton_gates","para":126,"quote":"if I were to call at five o’clock to-morrow morning","note":"Holmes puts this to the groom as a question. The text does not order it against the inquest or Holmes's study of his ground."}
{"id":"t.holmes_writes_brown","label":"The next day, when Silas Brown shall hear from Holmes","after":"t.brown_reappears","para":143,"quote":"you shall hear from me to-morrow","note":"Holmes also says 'I shall write to you about it' (¶141)."}
{"id":"t.brown_promise_kept","label":"When what Silas Brown promises shall be there","after":"t.brown_reappears","para":140,"quote":"It shall be there","note":"This is promised and not dated. The text does not say what it is or where."}
{"id":"t.horse_track_made","label":"When the horse's track was made in the long hollow","after":"t.before","para":117,"quote":"The track of a horse was plainly outlined in the soft earth","note":"The text does not date it. Holmes supposes the horse crossed there after the tragedy, when the hollow 'must have been very wet on Monday night' (¶116). The horseshoe fits the print."}
{"id":"t.man_beside_horse","label":"When a man's track came beside the horse's near Mapleton","after":"t.horse_track_made","para":119,"quote":"A man’s track was visible beside the horse’s","note":"The horse was alone before this point along the trail (¶120–121)."}
{"id":"t.tracks_toward_pyland","label":"When the double track turned off towards King's Pyland","after":"t.man_beside_horse","para":122,"quote":"The double track turned sharp off and took the direction of King’s Pyland"}
{"id":"t.tracks_back","label":"When the same tracks came back to the Mapleton gates","after":"t.tracks_toward_pyland","para":122,"quote":"the same tracks coming back again in the opposite direction","note":"The return track ends at the asphalt paving to the Mapleton gates (¶124)."}

## The story so far (this scene is ¶144–¶182)

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

