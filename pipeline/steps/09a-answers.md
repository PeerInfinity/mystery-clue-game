# Step: the answers, with the whole story

{{spec}}

## Your task

The whole story is below, with its questions as the reading forward wrote them (no answers yet), the facts and the
annotated reading. Now that the story is complete, give each question its answer key:

`{"file": "patch", "id": <question id>, "set": {"answer", "also_right"?, "answer_given_at", "answer_given_quote",
"answer_inferable_at", "answer_from"? | "answer_reasoning"?, "answer_strength"?}}`.

- `answer`: one of the question's possibility values (add the possibility if the story's answer is not among them:
  `{"file": "possibility", "q", "value", "available", "via", …}`, available where the story first makes it one),
  or null if the story never settles it. `also_right`: other possibilities just as true.
- `answer_given_at`, `answer_given_quote`: the paragraph and the exact words where the story gives the answer away.
- `answer_inferable_at`: the earliest paragraph at which a careful first-time reader could reach the answer from
  what had been told by then (null: only the give-away brings it), with `answer_from` (the fact it follows from) or
  `answer_reasoning` (`{"para", "text"}`: the step in words, using only what was told by that paragraph), and
  `"answer_strength": "likely"` where a careful reader would hold it but it does not strictly follow. Use the
  annotated reading's thoughts as evidence of what a reader could reach when; do not date an answer earlier than the
  text supports. Knowing the ending makes things look obvious early: be strict.
- A possibility the story rules out: `{"file": "possibility", "q", "value", "out", "by"}` (`by`: the fact).

## Questions

{{questions}}

## Facts

{{facts}}

## The annotated reading

{{reading}}

## The story

{{story}}
