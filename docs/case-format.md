# Case format: Watson's timeline

**Spoilers:** this page gives away the solution of "Silver Blaze".

What a case for Watson's timeline (`index.html`) consists of, and the world model it holds. The engine is
`engine/world.js` (provenance, the time order, assertions and contradictions) and `engine/actions.js` (typed states
and actions, the player's moves); the validator is `scripts/validate-world.js`. Commands, the source layout and the
tests are in `docs/technical.md`. The earlier game (`v1/`) has its own format, in its own copy of everything:
`v1/docs/case-format.md`.

## A case

A case is a directory `cases/<case>/` with the story and the world model; the page and the validator read nothing
else. Every JSON file is one object per line inside its list.

| File | Required | What |
|---|---|---|
| `story.txt` | yes | The story's text, paragraphs separated by blank lines. Paragraphs are numbered from 0 as `engine/story.js` splits the text (¶0 the title); every `para` in the data is that number, and every `quote` is found in its paragraph (curly quotes and dashes normalised). |
| `world/case.json` | yes | The case header: `{id, title, author, story, narrators, subtitle?, files?, delivery?, source}`. `story` is the story file, relative to `world/` (`../story.txt`); `narrators` who tells the story to the reader (see "The reader and the narrators" below); `subtitle` the page's name beside the title ("Watson's timeline"; default "the timeline"); `source` says where the text comes from (Gutenberg id, collection, first published, word count, public-domain status). |
| `files/<id>.txt` | no | A case file (a sub-story): a paper the narrator reads, its own paragraphs from ¶0 (its title). Listed in `world/case.json` `files`; see "Case files" below. |
| `world/entities.json` | yes | Every entity, with `moves` (what travels) and `joins` (a door's two sides). |
| `world/mentions.json` | yes | How the story names each entity: `{entities: {id: [phrase, …]}}`, a phrase a string or `{text, paras: [from, to]}` to limit it to some paragraphs (inclusive). Matched exactly on word boundaries, the longest winning where two overlap (`engine/story.js`). The story's names are links to their cards; an entity's card appears at its first mention (or at its `source` quote). |
| `world/times.json` | yes | The time points and their partial order. |
| `world/facts.json` | yes | The facts. |
| `world/accounts.json` | yes | The accounts the facts travel in, and who holds them. |
| `world/questions.json` | yes | The questions, their possibilities and answers. |
| `world/strains.json` | no | Likely clashes; without it the page shows none. |
| `world/room.json` | no | The arrangement of a room: openings and a sealed place. Without it the page has no room panel. See "The arrangement of a room". |
| `world/observations.json` | no | What an entry shows about a question once the player links them. Without it the page offers no links. See "Observations". |
| `world/implications.json` | no | An experiment: what the statements shown imply when put together, and which answers that rules out or concludes. Used when Settings has the answers marked from the evidence. |
| `world/actions.json` | no | The case's own action types, `{id, label, requires, effects}` in the action table's rule shape, and `ramifies` (what a goal's state brings with it); the generic ones are the engine's (see "Typed states and actions"). |
| `world/path.json` | no | The true path through the page: needed for the autoplay, the hints and the page checks (`npm run page-checks`; `CASE=<dir> node scripts/path-check.mjs` for another case). |
| `structure.json` | no | Beside `world/`, for an authored story: the logic it was written from, `{story, mechanic, goal, frame, questions: [{id, asks, answer, others, gate, needs, rules_out}], clues: [{id, source, says, facts, chain?, false?, false_trail?}]}` (`docs/authored-stories.md`; the shape sketched in `docs/archipelago-plan.md`). `needs` lists alternative sets of clues. The page does not read it; `npm test` checks that its clues, facts and questions exist and that every essential observation of a question rests on facts of the clues it needs. So far only the miniatures (`cases/miniatures/`) have one. |

**Case files** (sub-stories; since 2026-11-11; the design in `docs/authored-stories.md`, "The two-index design").
`world/case.json` may list `files: [{id, title, short, text, delivered?}]`: a paper the narrator reads, with `text`
its file relative to `world/` (`../files/rudd.txt`), `title` its tab in the Story panel, `short` the label of its
paragraphs ("Rudd ¶2"), and `delivered` the paragraph of the main story at which it comes (absent: from the start).
Every paragraph then has two indexes, its story and its number in it: a reference is a bare number for the main story
(every case without files stays as it was) and `"<file>:<n>"` for a file's paragraph (`engine/refs.js`), wherever the
data names a paragraph (`para`, `given_at`, `raised`, `available`, a time point's `para`, labels' `from`). The reader
reads each story forward on its own, in any order, and a file can be left half read; what is on the timeline is what
has been read, in every story. Where an order among what is read matters (which mention of a name came first, how
entries of one time point are sorted) it is the order in which the paragraphs were read. A file never gives an answer
away: `answer_given_at` is a paragraph of the main story, and the gate stays there. `answer_inferable_at` may be a
list of references, every paragraph the inference needs (`["rudd:2", "self:2"]`); so may a true path move's `at`
(what must have been read before it), and the validator checks that it covers what the move uses. Where the
validator checks that one paragraph comes no later than another, across stories it means "surely read first": the
same story and no later, or a main-story paragraph no later than where the other's file is delivered, or the main
story's ¶1 (the page opens there). A paper earned by solving questions is delivered at no paragraph, so for it only
the same story counts; where more is needed the data lists both references. A file's
prose stands alone: the narrator's thoughts in it are about that paper only, never about how it bears on another.

**Papers earned by solving questions** (since 2026-11-14; the design in `docs/authored-stories.md`, "The delivery
mechanism"). `world/case.json` may have `delivery: {mode, start?, goal?}`. `mode: paragraph` (the default, every
miniature) is the above: a file comes at its `delivered` paragraph. `mode: earned`: a file has no `delivered`; the
papers in `start` are in hand from the start, and each of the others comes when the question it is placed on is
solved. The placement is drawn from a seed (`engine/delivery.js`, the forward fill of an Archipelago generator) on the
case's logic, which the page derives from its own data (`caseLogic`): a question's papers are those its essential
observations' facts are told in (where each is given; an inferred fact's premises'), and the paper that raises it;
what it rests on is the questions its `{solved}` observations name. `goal` is the question that ends the case: it
holds no paper, and it is given away in the main story's ending. The ending is the main story from paragraph
`ending` on (default: the last paragraph); the gate keeps all of it until the goal is solved, and the rest of the
main story can be read from the start. Since 2026-11-15 only the goal must be given away: any other question may
leave out `answer_given_at` and its quote (it is judged when solved, and stays solvable after the ending is read),
and no question is raised in the ending or given away before it. A file with `reply: <question>` is a **reply**: it
comes the moment that question is solved, whatever the placement brings, and tells the answer in someone's voice. A
reply is no paper of the logic: it is not placed, carries no entries (no fact is told in it, no question raised),
and should say no more than its own question's answer; a question has at most one, and the goal has none. The validator requires, in an earned case, an essential
observation on every question with an answer, no loop of solved questions, no more papers to earn than questions
besides the goal, every question reachable with every paper, and a placement that can be drawn; with a
`structure.json` beside it, `npm test` holds the derived logic equal to the structure's (`structureLogic`: a
question's `needs`, each the papers of its clues and the paper that raises it, and its `requires`). The invented
example is `scripts/fixtures/vestry-cup/`.

The world model was first written beside the earlier game's data and pointed into it (`old`, references to the
annotated reading's thoughts, the earlier game's time windows); since 2026-11-06 it stands alone. The page shows
`cases/silver-blaze` by default and any other case by `?case=<dir>` (a directory under the site root:
`?case=pipeline/runs/silver-blaze-r2/case`), with saves of its own (`ui/world-case.js`); without `world/path.json`
it offers no hints and no autoplay.

## The world model as data (`world/`)

The chosen direction (`docs/ideas.md` §2, "Watson fills in the world model"), Watson's timeline, the main page. It
covers the whole story of "Silver Blaze" in `cases/silver-blaze/world/`, shaped first on ¶1–46. `engine/world.js` reads it (provenance,
the time order, assertions and contradictions, below) and `engine/actions.js` the typed states and actions; the page
is `index.html` (`ui/world.js`). `npm run validate-world` checks it and prints its counts. Every file has one object per line.

- **`entities.json`**: every entity of the case, `{id, kind, name, within?, source?, summary?}`: people, groups,
  animals, places, objects, documents, topics (the subject of a general rule: the turf, horses), and three state
  entities: `calendar` (weekday), `clock` (hour) and `weather`. `within` folds a place or part into another (the
  harness-room within the stable). `source`, a quote, places an entity that `mentions.json` has no phrase for. `moves` (a list beside `entities`) names the vehicles
  (the carriage, the landau, the Pullman car, the two trains); a place in it moves, and a thing that is not a place moves
  too (a purse, a person). The grid gives a vehicle a column of its own while its own place is not known.
- **Groups.** A group (`kind: group`) is an entity like any other; who is in it is the `member_of` attribute of each
  member, with its own time, so membership changes like any attribute (the two lads join `searchers` at the stable
  on Tuesday morning and leave it at the finding). A fact on a group holds for every member at that time.
- **`times.json`**: time points `{id, label, day?, clock?, after?, para?, quote?, note?}`. `after` (one id
  or a list) gives a partial order. `day` and `clock` are labels only: the weekday and the hour are facts on
  `calendar` and `clock`, each with its quote.
- **`facts.json`**: one fact each, `{id, of, attr, value, detail?, neg?, to?, time, para, quote, basis?, from?,
  reasoning?, inferable_at?, truth?, q?, pick?, asserts?, modal?, claim?, word?, how?, partial?, given_at?,
  given_quote?, strength?, note?}`.
  - `attr` is one of `location` (where it is at that time), `lives_at` (where it lives or is kept), `member_of`,
    `carrying`, `wearing`, `action`, `says`, `observes`, `knows`, `believes`,
    `intends`, `condition`, `contents`, `role`, `reputed`, `rule`, `position`, `owner`, `identity`, `name`, `weekday`,
    `hour`, `speed`, `time` or `tells`.
  - `value` is an entity id where there is one, otherwise short text. A `location` is always a place or thing id (or
    null when unknown), with the rest in `detail` ("at the bottom", "walking slowly with Holmes"), so that places can
    be compared; `neg: true` denies it ("not at King's Pyland", the stall empty). `observes` takes fact ids: an observation is
    an event, and the root of a provenance chain.
  - `time` is `{at}`, `{from, to}` (an open end means until further notice) or `{after, before}` (somewhere
    between two points).
  - `basis` is `stated` (the default), `implied` (the text presupposes it) or `inferable` (`from` the facts it
    follows from, at `inferable_at`, and `reasoning` for a step of the reader's the facts do not model; see below).
  - **Two dates.** `given_at` is where the story states the fact. It defaults to `para`; it is earlier, with a
    `given_quote`, when an earlier line already says it (Straker's death at ¶4, "the tragic murder of its trainer",
    told in full at ¶35); for an inferable fact it is where it is stated, if ever (past ¶46 too: the opium added
    after the dish was set apart, ¶218), and absent when nothing yet states it. `inferable_at` is the earliest
    paragraph the fact follows from what came before (`from`), each premise dated by its own earliest date. It
    appears on a stated fact only when it is earlier than `given_at` (the lads back in the loft: ¶32 from "his
    fellow-grooms had returned" and the night rule, stated at ¶34). `strength: likely` marks what a careful reader
    would hold but does not strictly follow (the stranger is Simpson at ¶39, from the arrest of the man suspicion
    rested on). Both dates will be revisited once the rest of the story is in.
  - `truth` comes from the answer key: `true` (the default), `false` or `null` (never settled).
  - **Claims.** A `says` or `believes` fact records that it was said, or held (true: the saying happened). What it
    asserts is in `asserts`, a list of picks `{q, pick, neg?}` (a question's possibility, or with `neg` its denial:
    the police's "nothing connects Silas Brown" denies Mapleton) or states `{of, attr, value, time?, neg?, truth?}`.
    One claim may assert several (the police theory: who drugged, opened the door, led the horse out, struck the
    blow, with what). Each assertion is true or false by the answer key. On a `believes` fact, `truth` is the truth
    of what it holds (false exactly when something it asserts is false; the validator checks). `modal: possible`
    marks a claim of what may or could be (the stick could have made the wounds; the horse may be in a pit): shown,
    but it contradicts nothing. A `q` with no `pick` on a claim only says which question it bears on.
  - **A claim's content as a fact.** A fact that is what a claim says is tied to it by `claim` (the fact id: Brown is
    an old horse-faker, from Holmes's words); a fact that is what someone said in Watson's hearing, with no speech
    fact of its own, by `word` (the speaker: Gregory reading out the papers in Straker's pockets). Such a fact is in
    no account: it reaches Watson through the speaker, so it is never Watson's own observation.
  - A `tells` fact passes accounts (`value`, account ids) to `to`, `how` (told, statement, sworn statement,
    report, newspaper, telegram, analysis, letter). `partial`: the story says only part of the account was passed
    (Watson's papers held "most of the facts", ¶42). A telling the story never settles has `truth: null` and the
    question of what else it could have been; an unknown sender is `of: "?"`, with its question.
- **`accounts.json`**: what one source tells, as a bundle of facts `{id, label, origin, how, facts?, parts?}`, so
  that one telling passes many details: Edith's account, Hunter's, Mrs. Straker's, the searchers', the police
  findings, Simpson's statement, the answer to Holmes's wire, Holmes's own part, what Watson sees himself. `origin`
  is who first had it (null when not said), `how` how (saw, did, said, examination, analysis, inference, own,
  report). A `bundle` is made of `parts` (everything the police hold; what the papers print; Holmes's account in
  the train). A fact may be in several accounts: the talk at the window is in both Edith's and Hunter's.
- **Provenance is derived, not written on facts.** `scripts/world-provenance.js` follows the tellings that carry an
  account (or a bundle containing it) from its origin to a narrator, and on to the reader, and gives each fact its
  chains, for example `edith_baxter sworn statement→ police ?report→ newspapers ?newspaper→ holmes told→ watson
  narrates→ reader`, with `?` on uncertain links. A claim's content (by `claim`, or a claim's `asserts`) has the
  claim's chains with one link more at the head, the claimant's word: `straker said→ mrs_straker statement→ police
  …`; a `word` fact the link `gregory said→ watson` (to the narrator in `heard_by`, by default the first) and the
  narration. It also gives who holds each account from when. Every told fact must be in an account that reaches the
  reader; the facts in none are the reader's own inferences.

**The reader and the narrators** (2026-11-06; the options and what was kept for later are in `docs/ideas.md` §3,
"Viewpoint and narration"). Every chain ends at **the reader** (`READER`, not an entity of the story), whom the player
plays. Each narrator in `world/case.json` (`narrators: [{id, name?, kind?, trust?}]`) tells the reader the story by
one **narration link** (`narrates`, keyed `narrates:<id>`), the last link of every chain through that narrator: a
narrator's own observations (an account with the narrator as origin, `how: saw`; Watson's is `acct.watson`) have
only that link; what others told the narrator has the tellings first. `id` is an entity (a first-person narrator,
`kind: first-person`) or `narrator`, the pseudo-entity of an impersonal third-person narrator (`kind: third-person`).
`trust` is the narration's default level, `confirmed` if absent (the fair-play contract); the player may change it in
Settings (*Trust in Watson as narrator*) or under Sources, and it caps every chain through that narrator, the tellings to the narrator
included. A narration link is never listed among the links whose ruling out alone stops a fact counting (`resolvingLinks`),
and a person's level does not apply to it. `name` is the narrator's name in the page's words ("Watson's own"). Several
narrators give a fact one chain through each who has it. A narrator with `doubtable: true` (a story with an unreliable
narrator) has a statement link (`stmt:<fact>`) on each of their own observations as well, starting as trusted as the
narration, so the player can distrust one of them and keep the rest; without it a narrator's own observations can be
doubted only all together, in Settings. The player's marks and moves are the reader's own: *your
hypothesis*, *your reasoning*.
- **`questions.json`**: an uncertain entry `{id, label, entry, raised, quote, possibilities, answer, kind?, latent?,
  settled?, note?}`. `label` is the question as the player reads it ("Who drugged Hunter's supper?"), shown only
  once the story raises the question or gives its answer, so that a latent one (Straker's honesty) is not flagged early. `kind: provenance` marks a question about how something was passed on (who answered
  Holmes's wire; whether the papers had the night from the police or from the witnesses). It is kept in the data
  and off the player's list unless the story itself raises it.
  - `entry` is `{of, attr, time}`, with `of: "?"` for a question about who.
  - A possibility may carry `asserts` (2026-11-18): what the answer says in typed form, `[{of, attr, value, neg?,
    time?, event?}]`, the time the entry's unless given ("yes" to "Was Mr. Prout at the Anchor when the bell
    rang?": his location there at the bell). A circle asserts those states and a cross denies them, by the
    player's hand or from the evidence, where one state says the denial exactly (`answerStates` in
    `engine/world.js`): one state only; at a point, the opposite at that point; over a stretch, "not for the
    whole of it". The validator marks the key (right answers circled, the others crossed out) and fails if that
    contradicts what is true: an answer that is wrong and yet true as a state must not be typed.
  - `raised` is the paragraph where the story opens the question (null while it never doubts the entry: `latent`).
  - Each possibility is `{value, how?, available, via, from?, reasoning?, quote?, out?, by?}`. An answer is listed to the
    player only from its `available` paragraph, the point where the story makes it a possibility. `via: direct`
    means the story names it; `via: indirect` means it follows from what has been told (`from` a fact told no later),
    or from a careful reader's step (`reasoning`, no later). A `quote` in the `available` paragraph serves where
    the facts so far do not reach (answers opened after ¶46). `out`/`by` give the paragraph and the fact that rule
    it out.
  - Every question has exactly one `something else` (`via: always`), available from the paragraph it is raised.
  - `answer` is always one of the possibilities (null where the story never settles it), even when it is
    available only late: what Straker meant at one in the morning is available indirectly at ¶46 and named at ¶57.
  - `also_right`: other possibilities just as true as `answer` (`q.why_out`: the light as well as the noise;
    `q.motive`: laying against his own horse as well as the debts). They are judged right at the give-away, a
    claim or circle of one is true, and they do not contradict the answer or each other (`isRight`, `compatible` in
    `engine/world.js`). Where several answers are valid, the game accepts any of them (the user's ruling).
  - The answer's two dates: `answer_given_at` and `answer_given_quote`, where the story gives it away (often in
    Holmes's explanation, ¶212–229), and `answer_inferable_at`, the earliest paragraph a reader can reach it, with
    `answer_from` (a fact) or `answer_reasoning` (a careful reader's step) and
    `answer_strength: likely`; null when only the give-away brings it (how the cravat came into Straker's hand).

**What the page may show at a paragraph** (`engine/shown.js`, shared with the leak check, `pipeline/leak.mjs`;
2026-11-06, after the first leak check of the timeline found names and labels shown before the story gave them):

- An entity's **name**: its `name` from the first paragraph whose text uses it (from ¶1: the title does not
  count), and before that the first phrase the story used for it (`mentions.json`), as a name ("its trainer" →
  "The trainer"); a name the text never uses verbatim (a description, "The stranger at the stable") from the first
  mention; optional `names: [{from, name}]` to set the steps by hand. Before any, a word for its kind ("someone").
- A time point's **label**: from its `para`; optional `labels: [{from, label}]` where a later paragraph tells more
  ("One morning, at breakfast" at ¶1, "Thursday morning, at breakfast" from ¶13). Before the first, "a time not yet
  told" (no day or hour: those are the story's to tell too).
- A question's or an account's **label**: optional `labels` steps in the same way (`q.who_killed`: "Who killed the
  trainer?" at ¶4, "Who struck the blow that killed Straker?" from ¶35). An account's label shows in the telling
  that passes it, so it names only the source ("Edith Baxter's account"), not its contents.
- A fact told early in brief (`given_at` before `para`, with `given_quote`): until `para`, only those brief words.

The validator checks the shape of `names` and `labels`; whether a label runs ahead is the leak check's to judge
(`pipeline/README.md`, "The leak check").

**Reasoning.** Where a careful reader reaches a fact, a possibility or an answer by a step the facts do not model,
the step is written out: `reasoning` (on a fact, a list) is `{para, text}`, the paragraph a reader could take it and
the step in plain words. The validator checks that it is no later than what it supports. Most of what Holmes's
explanation gives away (¶212–229) is reachable much earlier that way (Straker took the horse out: ¶46 → ¶220). For
"Silver Blaze" these steps are the careful reader's thoughts of the annotated reading (`docs/reading-annotated.md`),
copied in; nothing in the case points into another file. They are not shown on the page.

### Assertions and contradictions (`engine/world.js`)

`assertions(data)` lists everything the data asserts: each fact (a `state`), the `pick` of a fact that is not a
claim, and each item of a claim's `asserts`, with its truth by the answer key and the paragraph that tells it.
`contradictions(data, accepted)` finds the pairs among accepted assertions that cannot both hold, with no
contradiction written by hand:

- **Picks** of one question: two different possibilities, or one possibility asserted and denied. A question's
  possibilities exclude each other, so Hunter's belief that the stranger drugged him contradicts the explanation's
  "why should he drug his own stable-boy?".
- **States** of a single-valued attribute (`location`, `identity`) of one entity at times both certainly cover:
  two places neither within the other, a place and its denial (of it or of a place containing it), two identities.
  A thing that moves is placed through its own location at that time where that is certain (Watson in the carriage,
  the carriage in the train); otherwise it is not compared.
- **Time.** `{at}` covers its point; `{from, to}` from `from` up to, not including, `to`; an open end only its start
  (a state lasts until the next change, and a later different value is a change, not a contradiction); `{after,
  before}` nothing certain. Only the partial order of `after` decides "certainly": unordered points never overlap.
  So a move needs its own time point (the horse near Mapleton at dawn, led into Mapleton after: `t.tue_into_mapleton`).
- **An identity carries whereabouts** (2026-11-11). An accepted identity (a state, or a circled answer of a question
  whose entry is one) joins the locations of the two it names: "the figure was Dr. Mott" against "Dr. Mott at the
  Squire's" is a contradiction with three sides, the one's location, the identity and the other's location (`via`).
- **One event at two times** (2026-11-11). Facts that tell the same happening share an `event` id (`"event":
  "e.shot"`, on two facts or more): it happens once, so two of them whose times certainly do not meet (the shot at a
  quarter to nine and at nine) are a contradiction, with no question needed. Times that may meet, or are not
  ordered, raise nothing.
- **A denial against what it denies** (2026-11-11), for any other attribute: the same entity, attribute and value,
  asserted and denied at times that certainly meet ("he made every round, from twelve until five" against the
  reader's own "no round at three").
- **A denial over a stretch of time** (2026-11-18). A denial with `{from, to}` says "at no moment of it". Beyond
  the times both sides certainly cover, it is set against the same thing asserted at some moment between two
  points (`{after, before}`) when both points lie in the stretch ("not in the house from one until four" against
  "in the house sometime between two and three"). A denial marked `whole` says less, "not so for the whole of it"
  (the denial of an answer that says "there throughout"): it is contradicted only by what holds the stretch from
  end to end, one entry or several (locations within that place; of any other state, the same value: "I made
  every round, from ten until six"), each a side of the contradiction; a moment elsewhere is enough for it to
  stand. Only the denial of an answer is `whole` (a typed answer crossed out, or ruled out by the evidence).
- **A statement about everyone** (2026-11-18). `{of: "*", every: <kind or kinds>, but?: [ids]}` in place of a
  subject: each entity of those kinds but the ones named, so "nobody but Mrs. Orme and the Captain was in the
  house from one until three" is a denial of that location for everyone else, set against any one person's
  entry there. Someone whose identity is in question (the entry of an identity question, or the subject of an
  identity fact) is not counted: they may be one of those named. With nobody excepted it is about the unnamed
  too ("someone went through the door"). So far only in an implication's `asserts`.
- **Typed acts** (2026-11-18). A state with `act` (a fact, what a claim or an implication asserts, an answer's
  typed form) is the same act as another by its types and roles (`thing`, `to`, `item`, `about`, `via`,
  `where`), not by its words. A denial denies every act that has the types and roles it names: "nobody went
  through the front door" denies going through it with a sack; "she did not sail from Saltmere" denies an entry
  that has her take casks aboard and sail. In an `asserts`, a typed act needs no `value`.
- **A statement denied by name** (2026-11-18). An assertion `{kind: 'denial', denies: <an assertion's id>}`
  contradicts that assertion while both are accepted. For what cannot be typed ("so what the ledger says of the
  Marigold is not so"); only an implication makes one (`denies`).
- Claims with `modal: possible` take no part.
- **Alibis** (`alibis` in `engine/world.js`). A circled answer to a question whose `entry` is a typed action (`act`)
  over a `{from, to}` window is that one's act. If the act needs its agent at a door (`at`: either side of it,
  `joins`) or at a place (`place`, from the entry's `where`; `take` needs it, as `strike` does), and accepted
  locations of that one, none of them within a needed place, cover the whole window (one, or several end to end),
  each is a contradiction with the circle: "in two places at once?", the circle's side saying what it needs. An open
  end covers only its start, so an alibi's last location needs a `to`. Failing to place someone at the scene is no
  contradiction; that stays in the question's detail ("nothing on the timeline says so"). A need of any other state
  (2026-11-14: knowing the knot) is a contradiction with an accepted state that denies it and holds in the window
  (begun by its end, not over before its start). Each such contradiction carries the need's id (`req`), and the
  question's list of needs shows that need as against, naming the contradiction.

**The player's marks** (`markAssertions`). Each possibility of a question is uncertain (unmarked), circled or crossed
out; several may be circled. A circle asserts the possibility and a crossing denies it, as picks with `mark` set and
no fact, so they meet the claims' picks in the contradictions above; two circles of one question are an open choice
and are not reported. Each mark comes on its own link from *the reader's hypothesis* (`hypothesisChain`, keyed
`hyp:<question>=<possibility>`, `HYPOTHESIS` = `hypothesis`), which starts at likely (a guess counts as likely, and no
more: its clashes are "unlikely together"); the
hypothesis is a person of its own, so one setting covers every mark. Only marks on questions raised so far and on possibilities available so far count.
A "who" question (one with a person or an animal among its possibilities) may also be answered by any person or
animal, a "where" question (a place among them) by any place, its own subject excepted (`answerKinds`, `isOption`);
the page offers those met so far (named by a fact given so far). The page shows first only what someone in the story
puts forward (`via: direct`) and "something else"; the rest (`via: indirect`, and the people, animals or places, an
indirect possibility among them in its place) sit behind a "More" button, so that no list points at the answer.

**Typed states and actions** (`engine/actions.js`; the case's own types in `world/actions.json`).
The action types are the engine's generic ones (`GENERIC_ACTIONS`: lock, unlock, open, close, go through, lead out,
give, ask, drug, strike, keep a key, take, take out of a locked place (`take_locked`: at the place, with a key to `via`), make (`make`: an `item` made, a forged paper; nothing needed of its agent), strike a light, hide) and the case's own, set by `setCaseActions` from
`world/actions.json` (2026-11-07, the user's ruling: a generic core and each story's own as data). Silver Blaze's own
are injuring (its needs, the stable door open and the guard unable to act, are the story's), laying against, and
being cut as one falls, with the ramification that a horse injured before its race loses it. A case's type that a
second story needs too is a candidate for the generic table. A typed state is an attribute whose values exclude each other
(`STATES`; for now `door`: `open`, `shut`, `locked`): two of them at a time both certainly cover contradict, like two
identities. A fact is a typed action when it has `act` (an action type of the generic table `ACTIONS`: `lock`,
`unlock`, `open`, `close`, `go_through`) and `thing` (what it acts on); its agent is its `of`. The table gives each
type its requirements just before (a state of the thing, `carrying: 'key'`, a key to the thing, or `at`: the agent at
the thing, on one of a door's two sides) and its effects just after (a state of the thing, or `through`: the agent on
the other side of the door from where it was). A door's sides are in `world/entities.json` `joins` (`{door: [inside,
outside]}`; a place within the inside counts as inside, only the outside itself as outside). Where a thing is at a
time (`placeAt`): a location covering it, or the latest one with no end (a place lasts until something moves it).
Only the actions that matter are typed (Hunter going out through the stable door and locking it, Straker's
unlocking and opening it at ¶220, the stranger's asking Hunter for the tip); the validator checks `act`, the roles,
a typed state's value, plans and goals. The rules name their subjects by role: `agent` (the fact's `of`), `thing`,
`to`, `item`, `about`, `via` (the action table: lock, unlock, open, close, go_through, lead_out, give, ask, drug,
strike, hide). Two names of one person count as one once an identity is on the timeline or circled (the stranger
and Simpson); an animal is where it lives unless something moves it; over a night, a place seen only at a point
before it does not count.

**Intentions.** An intention is a goal, a state in the world model's shape (`goal: {of, attr, value}`), and a plan,
typed steps whose effects feed the next step's needs. A fact may carry a goal (the stranger wants the boy to have
the paper); a question's possibilities may (the stranger's aims: to know the tip, to know the way, Hunter drugged,
the horse in his hands), so a circled aim is an intention of the player's hypothesis; a claim may carry a plan
(`plan: {agent, goal, steps}`, each step a typed action with its own time: the police theory is Simpson's). A question's entry may carry `act` and `thing` too, so a
change the player points out can be recognised as its entry (who opened the stable door). Persistence
(`holdsBefore`): a state lasts until something specific changes it; events the story never tells are not invented.
The player's moves, each checked by these rules, give entries with the source *the reader's reasoning* (`REASONING`
= `reasoning`), as trusted as their weakest premise (and no more than the player's cap on that reasoning):
- (a) `pointChange`: two states of one thing on the timeline differ, so something changed it between them: an action
  by "?" (the shortest run of action types, `changePath`: locked to open is unlocking and opening), in the window
  between. Refused when nothing differs, the order is not certain, or a state or a change of the thing lies between.
- (b) `pointImplications`: an action's requirements (time `{to}` the action: holding up to it) and effects (`{from}`
  it); a change from (a) gives only its other needs (the key), its states being its premises. Each requirement is
  shown met, against (persistence gives another value, or, for any other state, an entry denies it) or with nothing on the timeline saying so
  (`requirementStatus`).
- (c) `checkFit`, "what is this for?": an action or an intention serves an intention if something it brings about
  (`productsOf`: an action's effects; an intention's goal, and what that goal brings with it) meets the goal or a
  need of a step already linked to it, so a plan is built one link at a time from the goal back. An effect that
  holds only for some kinds of an item fits on that condition ("if the paper is money or a message"); the kinds
  still open are those of the item's contents question (`kind` on its possibilities) that the player has not
  crossed out, or the circled ones. A link is an entry `{attr: 'purpose', for, serves}` from the reader's reasoning, and
  disappears when it no longer fits (the paper circled as a drug). `reasonedEntries` lists such moves in
  `ctx.lapsed` with why (`ruledOut`: the item's kinds that would make it fit; `gone`: a premise no longer there) and
  the moves that hold in `ctx.held`; the page announces a move that held and no longer does.
- (m) `pointGap`, "something is missing here" (2026-11-11): a rule that something happens at set times carries
  `series: {attr, value, at: [times], of?, detail?}` (the watchman must punch his clock every hour from twelve until
  five), and each entry of its record carries `series: <the rule's id>`, with the rule's `of`, `attr` and `value`, at
  one of its times (the card's punches). On the rule or on a record entry, the page offers the move at each time the
  record on the timeline lacks, once every paper that holds an entry of the record is read to its end (a half-read
  record would show every hour not yet reached as missing); it gives the reader's own entry, the series' state denied at that time (`neg`, `rule`,
  `gap`), resting on the rule and the record as the timeline then holds it (as trusted as the least of them). It
  lapses when the record leaves the timeline or comes to have that time. A move `{move: 'm', of: rule, at: time}`;
  in path.json `{do: "m", of: rule, time}` (`at` there is the paragraph).
- (d) `checkPlan`, "what would this need?": a plan's steps in order, each need met by an earlier step's effect, by
  the timeline, or by nothing (`open`), and whether the steps reach the goal. On a claim's plan (the police theory)
  or on the steps the player has linked to an intention.
- "Does this plan account for this?" (`accountsFor`): as (c), with a plan's own steps as the steps linked to its
  goal: an action or intention outside the plan accounts for nothing unless it brings about the goal or a need of a
  step (the paper, on the police theory).
- "Compare with another plan" (`comparePlans`): two plans of one agent (the police theory and Holmes's supposition
  that Simpson could have injured the horse in the stable, `f.h_injure_there`): each goal and whether it is
  reached, the steps in one and not the other, the needs nothing meets in one and not the other. A plan the story
  proposes, even as a supposition, is data (a claim with a `plan` and no `asserts`).
- Straker's plan: an aim's possibility may carry `step`, the last step it implies (`{act: 'injure', thing:
  'silver_blaze'}`), an intended action of the aim's agent that links can be made to (`impliedSteps`); a plan's
  intended step does not reach its goal (`checkPlan` says `'intended'`). A reason's possibility may carry `need`
  (`{act, rule}`): circled, the rule is added to that action type's needs as the player's hypothesis
  (`ctx.extraNeeds`; `q.why_out`'s noise and light answers add `{of: '$thing', away: 'stable'}` to `injure`). A need
  `away` is met by a place not within that place. A circled who-answer to a question whose entry is a typed action
  (`q.horse_out_by` is `lead_out` of the horse through the stable door) is that one doing it, an action of the
  hypothesis. A rule naming a role the action lacks is left out (injuring with no door named needs no door). A
  `need` may be a list (the light answer: a light, and away from the stable); the knife's "for delicate work" adds
  carrying the knife, the match's "to light the candle" a light (`take`, `strike_light`). A why-question may carry
  `presupposes`, a typed action of its entry's entity (`q.why_light`: Straker striking a light): with any of its
  answers circled, that action is the player's hypothesis (`pre:<question>`), linkable like any other. A possibility
  may carry `action`, the answer as an action of an entity (`q.thigh_cut`'s "Straker's own knife": `cut_self`), a
  hypothesis when circled. "What stopped it?" (`stops`): an action stops an intended step if one of its effects leaves
  the step's agent unable to act (`DISABLED`: struck down, dead, drugged) no later than the step's window ends.
- The night at the stable (the logic audit's step 2). "Who drugged Hunter's supper?" has a typed entry (`drug`, to
  Hunter, the opium, between nine and the lads' return), so a circled answer is a drugging of the hypothesis. A
  guard: a fact with `guards: <place>` (Hunter on watch that night guards the stable, ¶20) makes leading the horse
  out, or injuring it there, need that guard *unable to act* (`DISABLED`: drugged, struck down) unless the guard is the
  agent (`{guard: '$via'}` in the action table, one need per guard on watch). So "What is this for?" links a drugging
  to the plan that leads the horse out (the reader's "he was drugged so the horse could be taken", t37.16, with no rule
  written for it), and the police theory's drugging meets the same need. One culprit: an action serves only its own
  agent's intention (`checkFit`, as the page's own offer already was); an accomplice's drugging still meets the need
  on the timeline (the story's open exception, ¶218). The dog comes in from the player's circle: "did not bark" on
  "Did the dog bark in the night?" adds to leading out the need that the dog knew the agent (`{of, knows: '$agent',
  among: '$via'}`), met when the agent lives at the place the door opens onto (King's Pyland: Straker's villa, the
  lads' loft; not Simpson's villa on the moor). Likely clashes for the rest: barking unheard (the loft is over the
  harness-room), the drug put in at the window (the stranger could not know the dish) or on the path (the maid ran
  from him), exercise against Straker's own drugging.
- Who held a key (the audit's step 3): "Who had a key to the stable door?" (`q.key_holder`, raised by Holmes's
  "Has a duplicate key been found in his possession?", ¶57) has a typed entry, `keep_key` (its effect: carrying a key
  to the door), so a circled holder is a hypothesis action whose effect meets the key need of unlocking: on "Who
  opened the stable door?" (its entry now unlocking and opening, as the police plan and ¶220 have it), and as a step
  of a plan, linked by "What is this for?" through the unlocking. Straker is the key's answer, Hunter also right (he
  locked the door, ¶31). A plan's steps at the same time are ordered by what they need (`orderSteps`: unlocking and
  opening before leading the horse through the door).
- Presence and the instrument (the audit's step 4). A strike needs its striker at the place of the deed (`where` on
  the action: "Who struck the blow?" names the hollow), so a circled horse is met (in the hollow at the time, ¶37) and
  a circled Simpson has "nothing on the timeline says so". A possibility may carry `implies` (`{q, pick}`): circled,
  it asserts that answer of the other question too, as a mark of its own (`mark: 'implied'`, `from` the circle),
  with the circle's trust: the hoof implies the horse struck, the stick Simpson, so a weapon circled against another
  striker meets an ordinary contradiction.
- Goals serving goals (the audit's step 6, the motive; the user's go-ahead for "the goal and its motive as a move,
  only if the logic needs it"). "What is this for?" is offered on a circled aim too, so an aim can serve a motive: an
  intention serves another when what its goal brings with it meets the other's goal or a need of its implied step.
  `GOAL_RAMIFIES` says what a goal's state brings: a horse injured loses the race. "What drove Straker to it?" has
  goals on its answers: laying against his own horse wants the horse to lose; the debts want Straker in funds, through
  an implied step, laying against his horse (`lay_against`: needs the horse to lose, leaves him in funds). A
  possibility may carry `rests_on`, states it takes for granted, shown with what the timeline says ("What it rests
  on": the debts rest on Straker owing an account, met by the milliner's account to William Derbyshire once Derbyshire
  is circled as Straker, and not when he is circled as a friend).
- Tracks (the audit's step 5; the user chose reading tracks by themselves, a change of heading as a change of aim, and
  hiding needing someone in charge, with likely clashes for the rest). A fact with `read_from_track: true` is what a
  track Watson sees himself shows (the horse in the long hollow, ¶117; near Mapleton with a man beside him, ¶119; the
  turn, ¶122; both at the Mapleton gates, ¶124): it is in Watson's own account and told where he sees the track, with
  no move. `heading` (an open state, `OPEN_STATES`: any place) is where someone is making for; move (a) on two headings
  of one walker gives his own change of aim between them (`aimChange`), not an action by "?". `hide` needs its agent in
  charge at the place where it is done (`{charge: '$where'}`, met by a role with `charge`: Silas Brown manages
  Mapleton, ¶19), and a hiding-place to know only when no place is named (`unless: '$where'`). "What did the man with
  the horse mean to do?" has its two answers as aims with the hiding as their last step; leading him home first rests
  on the heading for King's Pyland. Likely clashes: the pit, far away or a secret place against the tracks to the
  Mapleton gates; hiding from the start against the turn toward King's Pyland; the groom against "no groom would dare".
  An aim with an implied last step shows its plan before anything is linked to it.
- Two loose ends tied (2026-11-05). A question with `end: true` (the motive) is what the rest is for: its circled
  answers serve nothing further, so "What is this for?" is not offered on them (it was offered toward the aim, the
  wrong way round). Straker at the stable after one is the content of his own word at ¶32 (`f.straker_to_stables`,
  "he intended to walk down to the stables"), reaching Watson through Mrs Straker's account; being at a door over a
  `{from, to}` window, like an `{after, before}` one, is met by a place reached inside it. His plan's one unmet need
  is now the opium, which the story never accounts for (¶218 leaves it open).
- The true path (`world/path.json`): the moves a careful reader makes on Watson's timeline, in order, each at the
  paragraph `at` where the page first allows it, to the end of the story: `circle` and `cross` (a wrong answer is
  tried, its clash seen with `see`, then crossed out), `trust` (a `link` or `person` set to `level` on the detail of
  `on`; `level` one of `confirmed`, `likely`, `uncertain`, `unlikely`, `ruled out`; the path rules out only false
  statements, and trusts as likely each statement that starts uncertain before the first move other than a link
  that uses it (a link trusts its entry by itself): those
  moves carry `gen: "trust"` and are written by `node scripts/path-trust.mjs`, to be run again when a path
  changes), `a`, `b`, `c` (the moves), `plan` (open
  "What would this need?"), `stop`, `compare`, `account` (a check `key` on an open plan) and `hold` (a likely clash set
  aside). `see`: a pattern the page must show after the move; `for_q`: the gated questions the move serves (so a
  just-in-time path can be derived); `why`: the reader's thought in plain words (the autoplay's caption; hints later);
  `late`: why a move comes after the first paragraph the page allows it (none at present); `hint_at`: the paragraph
  from which a hint may offer the move, when later than `at` (Mapleton, the reader's own reach at ¶40, is hinted only
  from ¶114, where the page supports it: the user's ruling).
  `scripts/path-check.mjs` plays it through the page: Read on to each move's paragraph (the gate met for real), each
  move's control offered and its result in the save, every answer given found right, and at the end no contradiction
  open and no likely clash unheld. It also fails a move found possible earlier than its `at` (unless `late`): before
  each paragraph it tries the next paragraph's reasoning moves (a–c taken and undone; a plan or a check counts once it
  shows its `see`), and it sets each circle of a right answer against the question's earliest paragraph in the data
  (raised, the possibility available, `answer_inferable_at`), and each wrong answer tried against its likely clash's
  `available`. Crossings and trust are judgement and not timed. A move found early is either the path being late
  (move it) or the page running ahead of the story (a leak to fix).
  In a case whose papers are earned, the path is read question by question: each move serves the one question in its
  `for_q`, the order of the list within a question is kept, and the order among questions is the player's (the path
  check draws one from the seed among the questions open; the autoplay takes the first open in the list's order; the
  hints offer only moves of a question open now). `seeds`: the seeds the page checks play (the narrowest order, the
  widest, an ordinary one), chosen once by `node scripts/delivery-seeds.mjs <dir> [n] --write`.
  Four moves for a case with a room or observations: `way` (`way: "<row>|<size>"`, `mark: closed | open`), `got` (`of`: a `passed`
  fact), `route` (`node`, one per link, in order) and `link` (`entry`: a fact id, or `route` for the route built; `q`). The path
  check fails if, at the end of the story, a description lacks an essential observation.
- Likely clashes (`world/strains.json`): pairs that can both hold but sit badly together, each side a fact or a
  question's possibility `{q, pick}`, with `why` (the reasoning in plain words), `available`, `from` (optional: a fact or a question) and `key` (the
  question at whose give-away it is listed). In play a pair shows only when one side is a circle of the player's
  and both sides are on the timeline; all a question's pairs show at its give-away. A pair between two story facts would
  show only at the give-away, so where one side is a reading of a question it is written as that question's
  possibility (the police's repeated blows: the stick on `q.weapon`, against the single blow). The validator checks the sides,
  that `available` is no earlier than both, and the key.
- Who made a change from (a) is the player's hypothesis: the story's question when the change is its entry, otherwise
  a question of the player's own ("Who was unlocking and opening the stable door?", `who: true`, so any person or
  animal met so far may answer it). For each one circled, the page shows what they would have needed (`agentNeeds`:
  at the door, a key) and what the timeline says of it.

**The arrangement of a room** (`world/room.json`, optional; `engine/arrangement.js`, drawn by `ui/world-room.js`). For a
case that turns on how things are arranged (the design: `docs/ideas.md`, "The arrangement of a room, and general
knowledge", and "Observations and open questions"). An invented example is `scripts/fixtures/sealed-room/`.

- `openings`: `{id: {kind, sides: [place, place]}}`, an entity each, of any kind beside doors. A row of the table only once a
  fact about it is on the timeline. `sealed`: `{place, surfaces?, time?, question?, unknown?}` switches the table on.
- Facts: `closed_to` and `passes` take a size, `person`, `small` or `air`. `closed_to: v` stops v and anything larger;
  `passes: v` lets v and anything smaller through. So "barred to a person" says nothing of something small. `passed`
  (`between: [place, place]`, `passes`) is something crossing between two places (the move "Something got through").
  `attached`, `reaches`, `near` and `fixed` have an entity as their value; the first three are the links of a route.
  In the ways-in table a state dated only `from` a time goes on until told otherwise. A `closed_to` for a stretch of time
  (`at`, or `from` and `to`) outweighs a general `passes`: the door that opens onto a corridor says nothing of the night it was
  locked, for any size.
- The player's moves: a mark on a cell of the table, refused unless a fact supports it; "Something got through", an
  entry `attr: opening`; the route, link by link, an entry `attr: route`.

**Implications** (`world/implications.json`, optional; `engine/implications.js`; an experiment since 2026-11-18,
`docs/authored-stories.md` finding 105). An observation is a statement a link shows; an implication is a statement
that follows from others, shown by itself the moment they all are.

- `{id, q, from: [premise], says, rules_out?: [possibility], concludes?: possibility, asserts?, denies?, strength?}`. A premise is the id of an
  observation or of another implication (so they make a tree; of any question), or `{any: [ids]}` for any one of
  several, or `{solved: q}`. Two implications with the same conclusion are two ways to it. `rules_out` crosses those
  answers of `q` out; `concludes` is its answer.
- With Settings "Answers: marked from the evidence" (`?answers=evidence` for one visit), a question that has
  implications is not marked by the player. An answer is crossed out when an implication that holds rules it out,
  and circled when one concludes it or when every other answer is ruled out; the question is solved when its answer
  is concluded. `essential` is not read for such a question, and an observation's `against` is a label only: what
  rules an answer out is an implication, with every premise that takes. A question without implications is played
  as before.
- **What follows, in the contradiction tracking** (2026-11-18; `derivedAssertions` in `engine/implications.js`,
  `docs/authored-stories.md` finding 107). With the answers marked from the evidence, what follows is an assertion
  like any other on the timeline, resting on its premises and not on the reader's hypothesis: it is as strong
  as its weakest step (the better of two ways; "Strength", below), and a contradiction's trace shows the implications and the
  entries under them.
  - An answer that follows is asserted and one ruled out is denied, as a circle and a cross are (so an identity
    that follows carries whereabouts, and a typed act its alibi).
  - Where the question's `entry` gives the answer a typed form and a certain time (`at`, or `from` and `to`), the
    state is asserted too: a place answer of a `location` entry is that location, and one that an implication
    rules out is that location denied (over a stretch: `whole`, above); an identity an implication rules out is
    that identity denied. An answer crossed out only because another is concluded is not denied as a state ("not
    at Saltmere" is not so of what hung in the Custom House, which is in Saltmere). A free-text answer ("it was
    set", "no") has no typed form unless its possibility gives it one (`asserts`, under `questions.json`): then
    the state is asserted with the answer and denied with it, however it was ruled out. Of the long case's 25
    questions, 5 answers are people, 3 places and 17 text.
  - `asserts: [{of, attr, value, neg?, time, event?}]` on an implication (optional): what it says as typed
    statements, in the form of a claim's `asserts` (states only, each with a time; the subject may be everyone,
    `of: "*"`, above). They take part in the
    contradictions, and the page puts each on the timeline as an entry of the reader's reasoning (`reasoned.move:
    'i'`, id `r:i:<implication>:<n>`), unless the timeline already holds the same statement in the same words.
  - `denies: <assertion id>` (or a list) on an implication (optional): a statement that cannot be typed, reasoned
    not to be so: a fact's id, or for a claim the item it asserts (`<fact>#<n>`; that it was said is certain).
  - Nothing here is wired to the statement it contradicts: "no round at one" (`asserts`) meets "I made every
    round" because both are typed. `denies` is the one place a rule names its target.
  - The validator checks the form, and that with everything shown nothing that follows contradicts what the key
    holds true, or itself (a wrong rule shows as a contradiction); it prints the false statements that what
    follows contradicts. `path-check.mjs` with `ANSWERS=evidence LIES=1` plays the true path without its moves of
    trust: every false statement on the timeline that the engine says the evidence contradicts must be in a
    contradiction on the page (run by `page-checks` for a case with the file).
- **Strength** (2026-11-18; `strength` in `engine/implications.js`; findings 110 and 111). An implication is certain unless
  it carries `strength: "likely"`: a step that is probable and not forced (initials that are surely the clerk's;
  no other train, so he did not come back). What follows is as strong as its weakest step by the best way to it,
  on the scale of trust: a step is a rule (certain, or likely) or a premise, as far as the statement under it is
  trusted (confirmed or likely; a statement that is evidence by being disbelieved, `{doubted}`, is confirmed
  evidence when it is ruled out and likely evidence when it is held unlikely). So what follows is
  certain only if some way to it is confirmed throughout, rules and statements. An answer marked only as likely is still circled or crossed
  out, and still solves its question; the page shows it dashed, in amber, with "(likely)", and says "So, likely"
  and "Makes unlikely" in the tree. What is only likely contradicts nothing: where it cannot stand with an entry
  the pair is listed as "unlikely together", beside the likely clashes, and not among the
  contradictions. Each implication in the tree has the dot of how strong it is.
- **An aim nothing was done toward** (2026-11-18). A possibility's `goal` (`{of, attr, value, neg?}`: the state
  wanted, as in the Holmes cases) is read by the table's rules: where an entry at or after the deed denies that
  state, the observation it comes from makes that answer unlikely (a table rule with `strength: "likely"`): had
  the money been the aim, the chest would not be whole with the money in it. Likely only, since an aim can
  fail; and never against the right answer. A circled aim goes on the timeline as an intention only for a
  question whose entry is one (`attr: "intends"`).
- **An aim judged by what its holder believed** (2026-11-22; finding 119). The rule above holds for a right
  answer too, and for any answer is set aside (`unless` on the rule), once the doer is taken to have believed
  the thing aimed at (`goal.of`) was where the deed was done. The motive question names its deed
  (`entry.deed: <the who-question>`, whose typed entry gives the place: `thing`, `where`). The belief is another
  question's right answer in typed form, `believes: {by: {answer: <the deed's question>}, of, attr: "location",
  value, neg?}` on the possibility (the rule is set aside when that question is solved), or a `believes` entry
  of someone who could be the doer, asserting the same, under an observation of its own on the motive question.
  A written rule may carry `unless: [premise]` too (observation ids and `{solved}` only).
- **Yes or no** (2026-11-22; finding 120). In a question whose answers are "yes" and "no", type one of them
  (`asserts`); the other is its denial and is not written. "Could X have been there?" types "no" (X not there
  through the stretch); a "when" answer is typed by the state the deed leaves at a time between.
- **A paper that speaks of what was not yet so** (2026-11-22; finding 120). On an entry of the paper: `dated:
  <time>` (the date it bears) and `speaks_of: {of, attr?, value?}` (what it speaks of as so). The entry spoken of
  is an action (it happened then) or a state with `begins: true` (not so before). An answer that has the paper
  made at its date, `asserts: [{of: <paper>, attr: "made", value, time: {at: <the date>}}]`, is ruled out by
  the table when the three are linked to the question and the date is before that time (`t.dated.<n>`).
  In a yes-or-no question a certain rule-out of the typed answer concludes the other, unless a written rule
  concludes it already.
- **Who holds a key** (2026-11-23; finding 121). "It has two keys, X's and Y's" is an absence about everyone
  else: `of: "*"`, `every: "person"`, `but: [the holders]`, `attr: "carrying"`, `value`, `key: <the door>`, `neg:
  true`. Under a "who" question whose act needs a key (`unlock`, `lock`, `take_locked` with `via`), the table
  makes unlikely an answer the entry denies the key (`t.key.<n>`, likely: a key can be borrowed).
  A role of a question's typed entry may wait on another question's answer: `"via": {"thing": <door>, "if":
  {"q": <question>, "pick": <answer>}}`. It is there once that question is solved so, and a table rule that
  rests on it has `{solved: <question>}` among its premises.
- **Could not have done it** (2026-11-23; finding 121). `cannot: [<act>]` on an entry of a person: the kinds
  of deed (acts of the table) they could not have done. Under a "who" question whose act is one of them, the
  suspect table marks means against, and the table rules that answer out (`t.cannot.<n>`).
- **A time read by a clock** (2026-11-22; finding 119). `"time": {"at": <point>, "by": <the clock>}`: the time as
  read. It is taken as the true time unless an entry of that clock that counts says how it was off,
  `"off": [{"reads": <point>, "when": <point>}]` (it read the first when the time was the second): then the
  reading is restated as the true time in contradictions, agreements and alibis (`byClocks`). Only a reading
  with a pair is restated; the author writes the pairs the story's readings need. Such an entry is true as told
  (no `truth: false`): its witness read the clock rightly.
- **An absence a witness states** (2026-11-22; finding 118). "Nobody else crossed the hall" is a fact `of: "*"`
  with `every: <kind>` and `but: [those excepted]`, usually `neg: true` (a location, or `carrying` with `key` for
  a record such as "one key drawn that evening"). It is read as a statement about each of them: in
  contradictions, and in the grid below. `seen_from: <a location entry>` on it (or on any entry that is a watch,
  "the door did not open once") names where its witness was: it is trusted no further than that entry.
  Under a "who" question whose act needs its agent at a place, such statements shown narrow when it could have
  been done (`deedTimes`): a stretch is closed when a statement about every person denies the place, a place it
  lies in, or the far side of its one door (`joins` in `entities.json`), and each person it excepts is denied the
  place for that stretch too. The page names the stretches closed and left, and the grid's Opportunity is judged
  against what is left. Nothing is written for it. As a rule (`t.when.<n>`, likely): an answer whose agent was
  elsewhere through all that is left is ruled out, from the observations of the closing entries and of the alibi
  (each of those entries must be what some observation of the question comes from).
- **Means, opportunity and motive** (2026-11-21; `suspectGrid` in `engine/implications.js`; finding 116). Under a
  "who" question whose `entry` is a typed act, the page sets each person who may be the answer against what the
  act needs of its agent (the action table's `requires` with `of: "$agent"`): a place or a door is opportunity,
  anything else (a key: a `carrying` fact with `key: <door>`, or a typed act of the suspect's that leaves them with one, `keep_key`; a thing carried; a state such as `knows`) is means,
  and a motive is gain or loss, or a goal held. Gain or loss (2026-11-21, finding 117) is read from the thing the
  act makes or handles (`item`, `thing`): an entry of that thing with `gives: [{to, what}]` is a motive for `to`
  (`what` an entity or a few words; `all: true` when it gives everything); `takes: [{from, what}]` is one against
  `from`; and `revokes: <thing>` makes one against whoever that other thing's `gives` named, unless the new thing
  gives them the same (both entries must be shown). A goal held is a fact of the suspect's with `goal` that one
  of the act's `effects` meets, for a story that states a want outright. A tie (finding 117) is `tie: {to, kind:
  "for" | "against"}` on an entry of the suspect's, read against `helps: <person>` or `harms: <person>` on the
  act (on the question's entry, or on a possibility's own `action` where the act differs by suspect): for and
  helps, or against and harms, is a motive; the other way about is one against. An entry the grid would read
  counts as evidence for the question, so its link stays under checked links without an observation. A threat
  removed is `threat: {to, by}` on any entry (`to` a person, or `{answer: <question>}`: whoever that question's
  answer is, once solved; `by` the thing that threatens) read against `removes: <thing>` on the act (or `{thing,
  if: {q, pick}}`: only once that question is solved so). Only entries linked
  to the question and trusted count, and a need is named only when one of them meets it or is against it. Nothing
  is written for it: type the act (`act`, its roles and a `{from, to}` window on the question's entry; the case's
  own act in `world/actions.json` if the generic ones do not say what it needs) and the statements it reads.
- **The rules nobody writes** (2026-11-18; `tableRules`, `withTable` in `engine/implications.js`; finding 109).
  Where an answer has a typed form and what one observation comes from contradicts it, linking that observation
  rules the answer out, as an implication `{id: "t.<observation>.<n>", q, from: [observation], rules_out: [answer],
  table: true}` made when the case is read (by the page, the validator and the checks alike:
  `scripts/case-rules.mjs`). An answer's typed form is its possibility's `asserts`; its act, the possibility's own
  `action` (`{of, act, thing, ..., time: {from, to}}`, `of: "?"` for someone unnamed: "by forcing the door") or the
  question's typed entry with the answer as its agent, with what the action table says it needs and leaves
  (`actNeeds` in `engine/actions.js`: the agent at a place, any other state needed, and an effect, which an entry
  at or after the act's window may deny: forcing leaves a mark, and "no mark" is against it); and an identity.
  Only true entries make such a rule, only observations that come from entries, and never against a right
  answer. A rule written by hand for the same observation and answer is kept in its place (its words are
  better). The validator lists them. Only cases with `world/implications.json` have them.
- The validator checks every reference, that no wrong answer is concluded and no right one ruled out, and that each
  question with implications is answered when everything is shown; it lists the observations an answer follows
  without. `path-check.mjs` with `ANSWERS=evidence` plays the true path in that mode: a circle of the path on such a
  question is not clicked and must be there from the path's links (run by `page-checks` for a case with the file).
  `random-links-check.mjs` is a player who only tries things in that mode: it reads what can be read, links every
  entry to every question in a shuffled order (`SHUFFLE`), makes the reasoning moves offered, and when stuck
  disbelieves each statement in turn and believes it again. After every entry the page's marks are compared with
  what the engine says follows from the links; at the end every question must be solved and the story read out.
- `ways(implications, q, values, right)` flattens a question's implications into every smallest set of statements
  its answer follows from (observation ids, and `solved:<q>`). The validator prints them for each question (not with
  `--quiet`), with what stands out: an observation in no way to the answer, one that feeds no implication, an answer
  concluded from one implication alone (a step the story may not state), a named wrong answer that nothing rules
  out, and a way that needs less than `answer_inferable_at` names (or none that fits it). An answer with no way on
  the page before the story gives it away is an error.
- The delivery logic (`caseLogic` with `implications`) gives such a question `ways`: `[{papers, requires}]`, a way's
  papers and the questions it rests on, in place of one list of papers and one of questions. The page does not pass
  the implications: it places papers by every essential observation, which is safe for both ways of playing. The
  Archipelago export does (`scripts/export-rules.mjs`, for a case with the file): a location's rule is any one of
  the ways, each with the papers of the questions it rests on, and the slot data says `answers: "evidence"`, since
  a rule that asks for less than every piece is true only when the page marks the answers from the evidence.

**Observations** (`world/observations.json`, optional; `engine/observations.js`; the design: `docs/ideas.md`). The general
mechanic for any question. The player points out that a timeline entry is relevant to an open question; an observation the
data holds for that pair is then filled in, keeping its logic (entries, their chains, its question).

- `{id, q, from: [entry], says, essential?, against?, if?}`. An entry in `from` is a fact's id (a telling's too: that it was said stays on the timeline when what it carried is distrusted), or `{any: [facts]}` for any one of several facts that show the same thing equally (three passes alike: the link of any of them fills it, each is evidence under checked links, and the papers of all are asked of the delivery; a premise of a `reasoned` entry can be `{any: [facts]}` likewise), or `{doubted: <a telling or a claim>}` for a lie as evidence (the statement linked, and what it carried that is false off the timeline), or
  `{route_through: [things]}` for a route the player built through them, or `{reasoned: "changed", premises: [two states]}`
  (the entry of "It changed" on those two, in either order) or `{reasoned: "got_through", premises: [a crossing]}` (the
  entry of "Something got through"), or `{reasoned: "missing", of: rule, at: time}` (the entry of "Something is missing
  here", named by its rule and time: what else it rests on is the record as the timeline holds it), so that an author can make a move necessary by requiring the entry it reveals, or `{solved: <question>}`: that question solved, which
  fills by itself with no link to make (a larger question resting on smaller ones; the page lists them under it, and
  which are not solved yet). It is filled when every entry is on the timeline
  and linked to `q`, and goes if one leaves. An observation from several entries with some of them linked is
  *begun* (`partial` from `fill`, 2026-11-14): the page says of each such link that it is part of something not yet
  complete, and lists it under the question, without naming what is missing. A statement linked for `{doubted}` and only partly disbelieved (some of its false parts off the timeline, not all) is begun too. A link that does neither stays as the
  player's note, and says so.
- `if: {q, pick}`: filled only with that answer of another question circled. A clue the story reads more than one way is an
  ordinary question with those readings as its possibilities, and what follows from each reading depends on it through `if`.
- `essential`: needed for the description to count as a solution, and required by the gate: the story goes on past the question's give-away only with every essential observation filled and a right answer circled (Settings can put back the old rule, any one answer; a question with no essential observation takes any one answer). The rest add to it. `against`: possibilities it tells against.
- **Solved** (2026-11-14): the moment a question the player can see, not yet given away, has every essential
  observation filled and exactly one answer circled, a right one, it is solved for good, whatever the gate's setting
  (the page's `judge`, after every drawing). Its circle is kept (Undo and distrust do not take it back), the story's
  other proposals are crossed out, and a click on another answer only crosses it out or clears it; with the evidence
  complete and a wrong answer circled the question says "Not this answer." A solved question passes the gate. Saved as
  `solved: {question: {pick, marks, n}}`; while a move is only tried and taken back (the hints, the path check),
  nothing is judged.
- A question answered by a description (the story names the thing only at the end) has "something else" in `also_right`.

The engine also has "What else of this kind?" and the fit check (`whatElse`, `fits`, `checkCrossing`), tested but not used by
the page: the fallback if a description proves not to be enough.

**Trust** (`chainLevel`, `hopLevel`, `levelOf`, `counts`; the user's rulings of 2026-11-18, `docs/authored-stories.md`
finding 111). Five levels, lowest first, on one scale with the strength of what follows: *ruled out*, *unlikely*,
*uncertain*, *likely*, *confirmed*.

| Level | On the timeline | As evidence | If it clashes |
|---|---|---|---|
| confirmed | normal text, solid dot | counts; conclusions can be certain | a contradiction |
| likely | normal text, hollow dashed dot | counts; conclusions at most likely | "unlikely together" |
| uncertain (the default) | grey, no dot | does not count | a grey clash, "cannot both be so: undecided" (a setting, on by default) |
| unlikely | grey, dashed strikethrough | as a lie (`{doubted}`): likely evidence | nothing |
| ruled out | grey, solid strikethrough | as a lie: certain evidence | nothing |

A narration link starts at its narrator's trust (confirmed by default), so a narrator's own observation is confirmed; a
mark of the reader's own starts at likely; every other link starts uncertain. A link is keyed by its telling, or for a speech by speaker and hearer (all of Holmes's words
to Watson are one link), or for a member by member and group (`linkKey`). Every chain that reaches a narrator through
someone also starts with the **statement's own link** (`stmt:<id>`, the user's choice, 2026-11-05): a relayed fact's
own, what a claim asserts by the claim's, a fact of a claim's content (`claim`) by that fact's. A says or believes fact is itself an event (the speech, the belief) and has none: its
statement link is on what it asserts. The page draws it once, above the chains, as "This statement itself".

**The most specific setting wins.** A chain's level is its statement's own level if that is set; else the weakest of
the links it came by (hearsay is as good as its weaker hop), a link's level being its own setting, else the level set
for the person it comes from, else uncertain (a member's link to their group limits nothing); and never more than
the narration it came through. A fact is as trusted as its best chain; a fact with no chain (the
reader's own inference) is not modelled and not shown. Setting a person's level sets everything they said to it,
and setting a link's (a paper, a telling) everything it carried: the page takes back the settings below (`setPerson`,
`setLink` in `ui/world.js`), which can then be set apart again ("take Dr. Hume at his word, but rule out this one
sentence"). The **Sources** part of the page lists each narrator and each person whose words have arrived, with
their level; a name opens what came from them one layer down (their papers and tellings, then the statements of each).
The page sets no level against the player's word, but two things the player does set one (the user's rulings of
2026-11-19): a link that is kept trusts its entry as likely, if it was still uncertain (`trustByUse`: to cite a
statement is to hold it likely); and a question solved confirms what its answer rested on, the entries of its
observations shown that were held likely (`confirmBy`; not a lie that was evidence, and nothing false), which the
notice counts. A clash is as strong as its sides: all confirmed, a contradiction; one side alone short of
confirmed, "cannot be so: against what is confirmed", with a button to rule that statement out; two sides short of
it, "unlikely together" or, with one still uncertain, "undecided". Each side not confirmed has its level beside
it, and the trace has buttons to trust or distrust each statement.
**A source's record** (2026-11-19; `recordOf`, `laidTo`, `shownFalse` in `ui/world.js`; finding 112). Of the
statements that start with one source: how many are confirmed, and how many stand alone against what is confirmed
(the one weak side of an open clash); and how many of the statements that came from them are ruled out. A statement
ruled out is laid to the one whose statement it is where its own setting rules it out, and else to whoever's paper,
telling or word, ruled out, it came by (a word altered on the way is the carrier's). The record is a line on the
source's page and card, and a note beside a statement not confirmed in its detail and on a side of a clash ("of what
else came from Mrs. Lunn: 1 ruled out, 2 confirmed"). It sets no level. Its one effect: a kept link does not trust
by itself an entry that came from a source with something else ruled out; the link waits, with the button, and says
why. `scripts/path-trust.mjs` writes the move of trust a true path then needs before such a link.
**What an answer rests on, and agreement** (2026-11-19; finding 113). With the answers marked from the evidence,
under a question whose answer follows the page says what it rests on by what is linked (`restsOnHtml`, `waySources`
in `ui/world.js`): the ways to it that hold now (`ways` over the implications that hold, every member shown or
solved), each with its sources (a narrator's own observation, a person's word, a statement that is evidence by
being disbelieved, another question's answer). One way: "It rests on: …", or "It hangs on the word of X alone",
with X's record where something is ruled out or against what is confirmed. Several: "It follows N ways", and
"two of them share no source: it is corroborated" (no person, paper or telling, lie or question in common, a solved
question counting with everything its own answer rests on) or "every one of them passes through the word of X". It
never says whether another way exists. `agreements(data, accepted)` in `engine/world.js` is the mirror of
`contradictions` for two told states: the same `of`, `attr`, `value` (and typed act), asserted or denied alike, at
times that certainly share a moment, with `whole.a` when all `a` covers lies inside what `b` covers (`b` bears `a`
out). `independent(chainsA, chainsB)`: no person and no paper, telling or word in common (a narration is shared by
all, so a narrator's own observation is independent of everyone). The page lists a pair, under the clashes, where
the two are independent and one short of confirmed is borne out whole; beside that one it offers "Trust as
confirmed" where the other is confirmed or both are likely.
**Confirmed is earned** (the user's ruling of 2026-11-21; finding 115): no trust control offers it for what someone
says. A statement becomes confirmed when a question solved rested on it (`confirmBy`) or when the player takes the
agreement offer; its key is then kept in `trust.earned`, so that it can be lowered and put back (and "Reset
trust" keeps it). A narrator's own link, and a doubtable narrator's statement, start at confirmed and can be set
back to it; the limit on the reader's own reasoning offers it too (it is "no limit"). A path's move
`{do: "trust", level: "confirmed"}` is played by pressing the offer (`#clashes [data-agree]`), unless a question
solved since has confirmed the statement already.
A statement confirmed by the offer is remembered with what bore it out (`trust.agreed`: its key → `{fact, by}`),
and is held likely again once that other statement is held unlikely or ruled out, unless a solved question rests
on it. Settings' "Confirm what two independent sources agree on" (`autoAgree`, off by default) takes each offer
as it appears (finding 122).
A telling is shown as an event, as trusted as the narration (that it was said stands; what it says is trusted apart).
`resolvingLinks` gives the links and people whose ruling out alone would stop a fact counting
(those every chain of it passes through): the page marks them when it traces a clash. "Something is missing here"
reads a record with its uncertain entries too: an entry not yet trusted is in the record all the same, though the
gap pointed out is only as trusted as the record.

The validator requires the true story to be consistent (no contradiction among the assertions the answer key holds
true: every one it found was a data error) and prints the contradictions a reader who trusts every source meets, by
the paragraph that completes them: 41 for the whole story, the first at ¶28 (the stranger "lost" against his asking
for the straight tip), most at Holmes's explanation (¶212–229), since player inferences are not modelled.
