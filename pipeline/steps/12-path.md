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
- `why`: the reader's reason at that paragraph, in plain words, using nothing told later.
