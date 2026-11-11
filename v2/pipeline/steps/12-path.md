# Step: the true path, with the whole story

{{spec}}

## All facts

{{facts}}

## Questions (with their answers)

{{questions}}

## Likely clashes

{{strains}}

## The annotated reading

{{reading}}

## The story

{{story}}

## The questions to circle, and the earliest paragraph the page allows

{{circles}}

## The statements the answer key makes false (each, distrusted somewhere, or it contradicts at the end)

{{false_statements}}

## The reasoning moves the page accepts ("What is this for?"), and the intentions a plan check is offered on

{{candidates}}

Plan checks are offered on: {{plans}}

Changes the page lets the reader point out ("It changed"):

{{changes}}

"What stopped it?" checks that find a stop, comparisons of two plans, and "Does it account for this?" checks (with
the page's answer):

{{stops}}

## The room and the observations

{{room_moves}}

## Your task

Write the true path (path.json in the format above): lines `{"file": "path", "do", …, "at", "why", "for_q"}`.

- Circle each question's answer (or one of its `also_right`), no earlier than the paragraph given above for it and
  before its give-away; a script sets each answer's `at` to that earliest paragraph.
- Take the wrong turns the annotated reading takes (its DROP annotations): circle the wrong possibility where the
  reader holds it, cross it where the reader drops it.
- Distrust each false statement above where a careful reader would stop believing it (no later than the end of
  the story; often where the story shows it false), with `on` and `link` as in the format.
- The reader's reasoning: of the links above, those a careful reader would make, as `{"file": "path", "do": "c",
  "of", "for", "at", "why", "for_q"}` (no earlier than the circles they need, which come first in the path), and
  where the reader would ask what a plan needs, `{"file": "path", "do": "plan", "of": <intention>, "on":
  "q:<its question>", "at", "why", "for_q"}`. A script moves a reasoning move the page allows earlier to that
  paragraph.
- Of the changes, stops, comparisons and account checks above, those the reasoning makes: `{"file": "path", "do": "a", "a", "b",
  "at", "why", "for_q"}`, `{"file": "path", "do": "stop", "on", "key", "at", "why", "for_q"}`, `{"file": "path",
  "do": "compare" (or "account"), "on", "key", "at", "why", "for_q"}`, as written there (a stop and a comparison open their plan
  themselves).
- If there is a sealed place above: the reader's work on it, as lines with `"file": "path"` and `at`, `why`, `for_q`:
  `{"do": "way", "way": "<row>|person", "mark": "closed"}` (or `|small`, or `"open"`) for what the facts told so far support
  in the table of ways in; `{"do": "got", "of": <a "passed" fact>}` where something crossed by a way nobody has named;
  `{"do": "route", "node": <place or thing>}`, one line for each link of a route, in order, from its first node.
- For every observation marked essential above: `{"do": "link", "entry": <fact id, or "route" for the route the reader has
  built>, "q": <its question>, "at", "why", "for_q"}` for each thing it rests on, and the circle its `if` asks for. Link other
  observations only where the annotated reading turns on them. A script dates each link at the latest of the entry and the
  question.
- `why`: the reader's reason at that paragraph, in plain words, using nothing told later.
