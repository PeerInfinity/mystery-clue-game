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

## Typed data: what the reader's reasoning moves work on

The page lets the reader point out what an action or an intention is *for* ("What is this for?") and what a plan
*would need* ("What would this need?"); the engine checks each against the rules of an action table. These moves
work on typed data, written only where the story's reasoning runs through it.

**Typed actions.** A fact of an action the reasoning needs carries `act` (an action type, or a list for several in
a row: `["unlock", "open"]`) and its roles: `thing` (what it acts on), `to` (the one it is done to), `item` (what is
given, used or carried), `about` (what is asked), `via` (the door gone through), `where` (the place of the deed). Its
agent is the fact's `of`. A door (or a lid, a gate: anything that opens, shuts and locks) has states `{"attr":
"door", "value": "open" | "shut" | "locked"}`, and its two sides in entities.json `joins` (`{"desk": ["desk_inside",
"mill_house"]}`, inside first). Someone keeping watch over a place carries `"guards": <place>` on the fact of their
role.

```json
{"id": "f.crane_locks", "of": "crane", "attr": "action", "act": "lock", "thing": "desk", "value": "locks the purse in his desk", "time": {"at": "t.mon_ten"}, "para": 6, "quote": "I locked it in the desk at ten"},
{"id": "f.desk_locked", "of": "desk", "attr": "door", "value": "locked", "time": {"from": "t.mon_ten"}, "para": 6, "quote": "I locked it in the desk"},
{"id": "f.dobbs_role", "of": "dobbs", "attr": "role", "value": "sleeps in the stable loft over the yard", "guards": "yard", "time": {"from": "t.before"}, "para": 8, "quote": "he slept in the stable loft"}
```

**The action table.** Each type gives what it requires just before and what it effects just after, in rules naming
roles (`$agent`, `$thing`, `$to`, `$item`, `$about`, `$via`, `$where`): `{of, state, value, neg?}` a door's state;
`{of, attr, value, neg?}` any other state; `{of, key: role}` carrying a key to it; `{of, carrying: role}`; `{of, at:
door}` at one of its sides; `{of, through: door}` (an effect) on its other side; `{of, place: role}` at that place;
`{guard: door}` every guard of the place inside the door unable to act; `{of, charge: role}` in charge there; a rule
with `unless: role` is left out when the action has that role. The generic types are listed with your task. A type
the story needs that is not there is the case's own: `{"file": "actions", "id", "label", "requires", "effects"}`
(`label` as the page says it: "copying a key to"). Prefer the generic types; add one of the case's own only where
the story's reasoning needs what no generic type gives. What a goal's state brings with it (a horse injured before
its race loses it) is `{"file": "ramifies", "if": {"attr", "value"}, "then": {"attr", "value"}}`.

```json
{"file": "actions", "id": "copy_key", "label": "copying a key to", "requires": [{"of": "$agent", "carrying": "$item"}], "effects": [{"of": "$agent", "key": "$thing"}]}
```

**Intentions.** An intention is a goal (a state: `"goal": {"of", "attr", "value"}`) and, through the moves, a plan.
A fact of what someone means to do carries its `goal`; so does each possibility of a question about why someone
acted (`entry.attr: "intends"`) that names an aim. Such a possibility may carry `step`, the last action the aim
implies (`{"act", "thing"?, "item"?, …, "time"}`: to take the purse implies taking it), which the reader's links lead
to. A possibility that is a reason why something was done in a certain way may carry `need`: `{"act", "rule"}` (or a
list), a rule the answer adds to that action type's needs when circled (to do it where nobody hears: `{"act":
"take", "rule": {"of": "$agent", "away": "mill_house"}}`). A question whose answer is the end of the chain (a motive)
carries `"end": true`. A possibility may carry `rests_on` (states it takes for granted) or `implies` (`{"q", "pick"}`:
circled, it asserts that answer of another question too).

**Who did it, and why it was done.** A question about who did an action carries the action in its entry (`{"of":
"?", "attr": "action", "act", "thing", …}`): a circled who-answer is then that one doing it, which the moves can link
like any action. A question about why an action was done that the story tells (`entry.attr: "intends"`) carries
`presupposes`, the action (`{"act", "item"?}`): with an answer circled, the action is the reader's to link.

**Plans.** A claim that tells how something was done carries `plan`: `{"agent", "goal", "steps": [{"act", …,
"time"}]}` (the constable's theory: the pedlar came over the wall, opened the desk and took the purse), so that the
reader can ask what it would need. A plan the story only proposes, as a supposition ("if he wanted the purse, why
not take it on Monday?"), is a claim with a `plan` and no `asserts`: the reader can compare it with another plan of
the same agent ("Compare").

**Changes and what stopped a plan.** A state that changes is written as two states with their times, so the reader
can point out the change ("It changed"): a door (`door`: open, shut, locked) or where someone is making for
(`{"attr": "heading", "value": <place>}`, from tracks or a sighting; two headings of one walker give a change of his
aim). An action whose effect leaves someone unable to act (`condition`: `struck down`, `drugged`, `dead`; the
generic `strike` and `drug` have it) can stop an aim's implied last step: a who-question with such an action as its
entry (who struck the blow) lets the reader check whether a circled answer stopped the plan ("What stopped it?").

```json
{"id": "f.tracks_to_mill", "of": "the_pedlar", "attr": "heading", "value": "mill_house", "time": {"at": "t.mon_dusk"}, "para": 30, "quote": "his tracks led toward the mill"},
{"id": "q.who_felled", "label": "Who knocked the pedlar down?", "entry": {"of": "?", "attr": "action", "act": "strike", "to": "the_pedlar", "where": "yard", "time": {"at": "t.mon_midnight"}}, …}
```

```json
{"id": "q.who_took", "label": "Who took the purse?", "entry": {"of": "?", "attr": "action", "act": ["unlock", "take"], "thing": "desk", "item": "purse", "time": {"after": "t.mon_ten", "before": "t.tue_breakfast"}}, …},
{"q": "q.why_dobbs", "value": "to have money for the fair", "goal": {"of": "dobbs", "attr": "condition", "value": "in funds"}, "step": {"act": "take", "item": "purse", "time": {"after": "t.mon_ten", "before": "t.tue_breakfast"}}},
{"id": "f.pryor_believes", "of": "pryor", "attr": "believes", "plan": {"agent": "the_pedlar", "goal": {"of": "purse", "attr": "held_by", "value": "the_pedlar"}, "steps": [{"act": "go_through", "thing": "yard_gate", "time": {"at": "t.mon_midnight"}}, {"act": ["unlock", "open"], "thing": "desk", "time": {"at": "t.mon_midnight"}}, {"act": "take", "item": "purse", "time": {"at": "t.mon_midnight"}}]}, …}
```

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
- `{"do": "c", "of", "for"}`: "What is this for?": the action or intention `of` serves the intention `for` (a fact
  id, or a circled answer `hyp:<question>=<pick>`, or `pre:<question>` for the action a why-question presupposes).
  `{"do": "plan", "of", "on"}`: "What would this need?", opened on an intention.
- `{"do": "a", "a", "b"}`: "It changed": two states of one thing differ (a door shut, then open; a walker making for
  one place, then another), so something changed it between them. `{"do": "stop", "on", "key": "<intention>|<action>"}`:
  "What stopped it?", on an intention whose plan's last step was never done: that action left its agent unable to
  act. `{"do": "compare", "on", "key": "<plan>|<other plan>"}`: two plans of one agent compared. `on` opens what the
  move is made on: a fact id, or `q:<question>` for a circled answer.
- `at`: the paragraph of the move; `why`: the reader's reason, in plain words, as the reader would say it then;
  `for_q`: the questions the move serves.
