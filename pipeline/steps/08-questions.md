# Step: questions, one scene

{{spec}}

## Your task

Write the questions that scene {{scene_id}} ({{scene_title}}, ¶{{from}}–¶{{to}}) raises, and the possibilities it
opens, for questions new and old. You have the story up to the end of this scene and the data so far; you have not
read further, and nobody knows the answers yet.

- A question is what the story makes a careful reader wonder about the events of the case: who did it, where
  something or someone is or was, what something was for, why someone acted, whether a statement is true. Not about
  the detective's or the narrator's behaviour (what he whispered, why he asks for a photograph, why he leaves): those
  are what a reader notices, and the questions they point to are about the events (what the photograph would
  show is a question about the person in it). Take the reader's QUESTION and HYPOTHESIS
  notes as a guide; add the questions the story itself asks.
- A new question: `{"file": "questions", "id", "label", "entry", "raised", "quote", "possibilities"}` with
  `"answer": null`. Its possibilities: exactly one `{"value": "something else", "available": <raised>, "via":
  "always"}`, and each answer someone in the story puts forward (`via: direct`, `quote` in its `available`
  paragraph) or a careful reader would consider (`via: indirect`, with `from`, a fact told no later, or
  `reasoning`, `{para, text}`). A possibility's `value` is an entity id where it is one.
- A possibility for a question so far: `{"file": "possibility", "q", "value", "available", "via", …}`; a
  possibility the scene rules out: the same line with `out` (paragraph) and `by` (the fact).
- Facts that bear on a question: `{"file": "patch", "id": <fact id>, "set": {"q", "pick"}}` for a fact that states
  an answer, or `{"file": "patch", "id": <claim fact id>, "set": {"asserts": [...]}}` to give a says or believes
  fact the picks it asserts (`{"q", "pick", "neg"?}`, beside the states it already asserts: give the whole list).
- A telling whose teller the story does not give (`of: "?"`), or that the story leaves uncertain, needs a question
  of `kind: "provenance"` (who sent the reply; whether the papers had it from the police or the witnesses), and the
  telling a patch with its `q`.
- A question's label must not hint at its answer, and nothing may run ahead of the story.

## Entities

{{entities}}

## Facts so far

{{facts}}

## Questions so far

{{questions}}

## The reader's notes so far (the annotated reading)

{{reading}}

## The story so far (this scene is ¶{{from}}–¶{{to}})

{{story}}
