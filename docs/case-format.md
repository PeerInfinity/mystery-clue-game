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
| `world/case.json` | yes | The case header: `{id, title, author, story, narrators, subtitle?, source}`. `story` is the story file, relative to `world/` (`../story.txt`); `narrators` who tells the story to the reader (see "The reader and the narrators" below); `subtitle` the page's name beside the title ("Watson's timeline"; default "the timeline"); `source` says where the text comes from (Gutenberg id, collection, first published, word count, public-domain status). |
| `world/entities.json` | yes | Every entity, with `moves` (what travels) and `joins` (a door's two sides). |
| `world/mentions.json` | yes | How the story names each entity: `{entities: {id: [phrase, …]}}`, a phrase a string or `{text, paras: [from, to]}` to limit it to some paragraphs (inclusive). Matched exactly on word boundaries, the longest winning where two overlap (`engine/story.js`). The story's names are links to their cards; an entity's card appears at its first mention (or at its `source` quote). |
| `world/times.json` | yes | The time points and their partial order. |
| `world/facts.json` | yes | The facts. |
| `world/accounts.json` | yes | The accounts the facts travel in, and who holds them. |
| `world/questions.json` | yes | The questions, their possibilities and answers. |
| `world/strains.json` | no | Likely clashes; without it the page shows none. |
| `world/room.json` | no | The arrangement of a room: openings and a sealed place. Without it the page has no room panel. See "The arrangement of a room". |
| `world/observations.json` | no | What an entry shows about a question once the player links them. Without it the page offers no links. See "Observations". |
| `world/actions.json` | no | The case's own action types, `{id, label, requires, effects}` in the action table's rule shape, and `ramifies` (what a goal's state brings with it); the generic ones are the engine's (see "Typed states and actions"). |
| `world/path.json` | no | The true path through the page: needed for the autoplay, the hints and the page checks (`npm run page-checks`; `CASE=<dir> node scripts/path-check.mjs` for another case). |
| `structure.json` | no | Beside `world/`, for an authored story: the logic it was written from, `{story, mechanic, goal, frame, questions: [{id, asks, answer, others, gate, needs, rules_out}], clues: [{id, source, says, facts, chain?, false?, false_trail?}]}` (`docs/authored-stories.md`; the shape sketched in `docs/archipelago-plan.md`). `needs` lists alternative sets of clues. The page does not read it; `npm test` checks that its clues, facts and questions exist and that every essential observation of a question rests on facts of the clues it needs. So far only the miniatures (`cases/miniatures/`) have one. |

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
`trust` is the narration's default level, `certain` if absent (the fair-play contract); the player may change it in
Settings (*Trust in Watson as narrator*), and it caps every chain through that narrator, the tellings to the narrator
included. A narration link is never listed among the links whose distrust alone takes a fact off (`resolvingLinks`),
and a person's cap does not apply to it. `name` is the narrator's name in the page's words ("Watson's own"). Several
narrators give a fact one chain through each who has it. The player's marks and moves are the reader's own: *your
hypothesis*, *your reasoning*.
- **`questions.json`**: an uncertain entry `{id, label, entry, raised, quote, possibilities, answer, kind?, latent?,
  settled?, note?}`. `label` is the question as the player reads it ("Who drugged Hunter's supper?"), shown only
  once the story raises the question or gives its answer, so that a latent one (Straker's honesty) is not flagged early. `kind: provenance` marks a question about how something was passed on (who answered
  Holmes's wire; whether the papers had the night from the police or from the witnesses). It is kept in the data
  and off the player's list unless the story itself raises it.
  - `entry` is `{of, attr, time}`, with `of: "?"` for a question about who.
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
- Claims with `modal: possible` take no part.

**The player's marks** (`markAssertions`). Each possibility of a question is uncertain (unmarked), circled or crossed
out; several may be circled. A circle asserts the possibility and a crossing denies it, as picks with `mark` set and
no fact, so they meet the claims' picks in the contradictions above; two circles of one question are an open choice
and are not reported. Each mark comes on its own link from *the reader's hypothesis* (`hypothesisChain`, keyed
`hyp:<question>=<possibility>`, `HYPOTHESIS` = `hypothesis`), which starts uncertain like any other link; the
hypothesis is a person of its own, so one cap covers every mark. Only marks on questions raised so far and on possibilities available so far count.
A "who" question (one with a person or an animal among its possibilities) may also be answered by any person or
animal, a "where" question (a place among them) by any place, its own subject excepted (`answerKinds`, `isOption`);
the page offers those met so far (named by a fact given so far). The page shows first only what someone in the story
puts forward (`via: direct`) and "something else"; the rest (`via: indirect`, and the people, animals or places, an
indirect possibility among them in its place) sit behind a "More" button, so that no list points at the answer.

**Typed states and actions** (`engine/actions.js`; the case's own types in `world/actions.json`).
The action types are the engine's generic ones (`GENERIC_ACTIONS`: lock, unlock, open, close, go through, lead out,
give, ask, drug, strike, keep a key, take, strike a light, hide) and the case's own, set by `setCaseActions` from
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
  shown met, against (persistence gives another value) or with nothing on the timeline saying so
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
  `on`; the path distrusts only false statements, by their statement link), `a`, `b`, `c` (the moves), `plan` (open
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

**Observations** (`world/observations.json`, optional; `engine/observations.js`; the design: `docs/ideas.md`). The general
mechanic for any question. The player points out that a timeline entry is relevant to an open question; an observation the
data holds for that pair is then filled in, keeping its logic (entries, their chains, its question).

- `{id, q, from: [entry], says, essential?, against?, if?}`. An entry in `from` is a fact's id (a telling's too: that it was said stays on the timeline when what it carried is distrusted), or `{doubted: <a telling or a claim>}` for a lie as evidence (the statement linked, and what it carried that is false off the timeline), or
  `{route_through: [things]}` for a route the player built through them. It is filled when every entry is on the timeline
  and linked to `q`, and goes if one leaves. A link that fills nothing stays as the player's note.
- `if: {q, pick}`: filled only with that answer of another question circled. A clue the story reads more than one way is an
  ordinary question with those readings as its possibilities, and what follows from each reading depends on it through `if`.
- `essential`: needed for the description to count as a solution, and required by the gate: the story goes on past the question's give-away only with every essential observation filled and a right answer circled (Settings can put back the old rule, any one answer; a question with no essential observation takes any one answer). The rest add to it. `against`: possibilities it tells against.
- A question answered by a description (the story names the thing only at the end) has "something else" in `also_right`.

The engine also has "What else of this kind?" and the fit check (`whatElse`, `fits`, `checkCrossing`), tested but not used by
the page: the fallback if a description proves not to be enough.

**Trust** (`chainLevel`, `levelOf`). The levels, lowest first: *distrusted*, *uncertain*, *trusted*, *certain*. A
narration link starts at its narrator's trust (certain by default), so a narrator's own observation is certain; every
other link starts uncertain, and the player may set it lower or higher (never certain). A link is keyed by its telling, or for a speech by speaker and hearer (all of Holmes's words
to Watson are one link), or for a member by member and group (`linkKey`). Every chain that reaches a narrator through
someone also starts with the **statement's own link** (`stmt:<id>`, the user's choice, 2026-11-05): a relayed fact's
own, what a claim asserts by the claim's, a fact of a claim's content (`claim`) by that fact's. Distrusting it takes off
that one statement and nothing else that came along the same links: the stranger's "lost" without his wish that the boy
gets the paper, Straker's "to see that all was well" without his walk to the stables, Gregory's theories without what
he found in Straker's pockets. A says or believes fact is itself an event (the speech, the belief) and has none: its
statement link is on what it asserts. The page draws it once, above the chains, as "This statement itself". A person's level, when set, caps every link
from that person. A chain is as strong as its weakest link, a fact as its best chain; a fact with no chain (the
reader's own inference) is not modelled and not shown. A telling is shown as an event: as trusted as the narration when it is to a
narrator (who witnesses it), uncertain otherwise (and no more than the narration). `resolvingLinks` gives the links and people whose distrust alone would take a fact below the
threshold (those every chain of it passes through): the page marks them when it traces a contradiction.

The validator requires the true story to be consistent (no contradiction among the assertions the answer key holds
true: every one it found was a data error) and prints the contradictions a reader who trusts every source meets, by
the paragraph that completes them: 41 for the whole story, the first at ¶28 (the stranger "lost" against his asking
for the straight tip), most at Holmes's explanation (¶212–229), since player inferences are not modelled.
