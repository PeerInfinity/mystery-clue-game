# Step: observations and the arrangement of a place, with the whole story

{{spec}}

## Your task

The game has a list of observations (the timeline, its facts) and a list of open questions. The reader points out that
an entry is relevant to a specific question; the game then fills in what that entry shows. Now that the story is
complete, write what the game fills in.

**Observations.** For a question, each thing some fact shows about its answer, one line each:

`{"file": "observations", "id": "o.<name>", "q": <question id>, "from": [<entry>, …], "says": <short text>, "essential"?: true, "against"?: [<possibility>, …], "if"?: {"q": <question id>, "pick": <possibility>}}`

- `from`: the facts the observation rests on, by id: all of them must be linked for it to fill in. Use more than one
  only where the point needs them together. An entry may instead be `{"route_through": [<thing id>, …]}`: a route the
  reader builds through those things (see below).
- `says`: what it shows about the answer, in plain words and as far as possible the story's own. **It must be
  something the story states or that plainly follows.** Do not embroider: no property that is your own gloss on a word.
- It must not run ahead of the story: the reader can link it as soon as its facts are told, so its wording may
  say nothing the story has not told by the latest of them.
- `against`: possibilities of that question this tells against.
- `if`: where what it shows depends on how a clue is read, and that reading is an open question: only with that answer
  circled.
- Write observations for the questions that matter to the case and that a reader can work on: not for every question.

**A question answered by a description.** Where the story names the answer only at the end, and a careful reader could
not name it but could say what it must be like, the answer is a description built from the observations:

- mark the observations that identify it `"essential": true` (those without which the description would fit something
  quite different); leave the others unmarked: they add to it;
- add "something else" to the question's `also_right`: `{"file": "patch", "id": <question id>, "set": {"also_right": ["something else"]}}`;
- do not add possibilities the story does not mention. Add one only with its paragraph and the story's words.

**The arrangement of a place,** only if the case turns on how a closed place can be reached:

`{"file": "sealed", "place": <place id>, "surfaces"?: [<thing id>, …], "time"?: <time id>, "question"?: <one short question, naming what the story has told by the first way in>}`

`{"file": "openings", "id": <thing id>, "kind": <door, window, chimney, vent, …>, "sides": [<place id>, <place id>]}`

Openings are the ways between two places, each with its own entity. Use only entities and facts that exist; if the facts
do not have the `closed_to`, `passes`, `attached`, `reaches`, `near`, `fixed` or `passed` you need, add them:
`{"file": "facts", "id", "of", "attr", "value", "time", "para", "quote"}` and, in the same output, the narrator's or
witness's account they travel in, `{"file": "account_add", "id": <account id>, "facts": [<fact id>]}`.

Every way in (each opening of the place and each surface) needs a `closed_to` or `passes` fact holding at the sealed
time: a `condition` such as "solid" marks nothing in the table. A state that lasts is dated `{"from": <time>}`, not `at`
the moment someone examined it. A way a route runs through needs a `passes` fact for what could get through it, not
only air, where the story says so.

Invented example, from a story of a stolen purse in a locked office, answered at the end by naming a trained jackdaw:

```jsonl
{"file": "sealed", "place": "office", "surfaces": ["office_walls"], "time": "t.mon_night", "question": "How could anything have reached the desk?"}
{"file": "openings", "id": "skylight", "kind": "window", "sides": ["office", "roof"]}
{"file": "observations", "id": "o.size", "q": "q.who_took", "from": ["f.skylight_gap"], "says": "small enough for the gap in the skylight", "essential": true}
{"file": "observations", "id": "o.flies", "q": "q.who_took", "from": [{"route_through": ["roof", "skylight"]}], "says": "came in from the roof"}
{"file": "observations", "id": "o.shiny", "q": "q.who_took", "from": ["f.only_coins_gone"], "says": "took only what glittered", "essential": true, "against": ["the carter"], "if": {"q": "q.note_means", "pick": "a magpie's habit"}}
{"file": "patch", "id": "q.who_took", "set": {"also_right": ["something else"]}}
```

If the case does not turn on the arrangement of a place, write no `sealed` or `openings` lines.

## All facts

{{facts}}

## Questions (with their answers)

{{questions}}

## The annotated reading

{{reading}}

## The story

{{story}}
