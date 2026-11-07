# Step: truth and dates of the facts of one scene, with the whole story

{{spec}}

## All facts


{{facts}}

## Questions

{{questions}}

## The annotated reading

{{reading}}

## The story

{{story}}

## Your task


The whole story is below, with all its facts and questions (answers included). For the facts told in scene
{{scene_id}} (¶{{from}}–¶{{to}}), listed separately, give what only the whole story settles, as patches
`{"file": "patch", "id": <fact id>, "set": {...}}`, only where something applies:

- `truth`: `false` for a fact the story shows to be untrue (a lie, a mistaken belief's content stated as a fact);
  `null` for one the story never settles. On a `says` or `believes` fact the saying is true; its `asserts` items
  each carry their own `truth` when false (give the whole `asserts` list); a believes fact's `truth` is false
  when something it asserts is false.
- `given_at` and `given_quote`: when an earlier paragraph already states the fact in brief.
- New inferable facts a careful reader could reach in this scene from what had been told by then:
  `{"file": "facts", …, "basis": "inferable", "from": [fact ids], "inferable_at", "reasoning"?: [{"para", "text"}],
  "strength"?: "likely"}`, with `given_at` and `given_quote` where the story later states it. Only steps a careful
  first-time reader would take; knowing the ending makes things look obvious early: be strict.
- `inferable_at` on a stated fact when a reader could have reached it earlier than the story states it, with `from`
  or `reasoning`.
- Candidates for inferable facts: the annotated reading's INFER, DEFAULT, IDENTIFY and HYPOTHESIS annotations in
  this scene (listed below) are a careful reader's steps; where one concludes a fact of the events that a reader
  could hold, add it (its `reasoning` the annotation's words, `strength: "likely"` unless it strictly follows).

## This scene's annotations

{{scene_reading}}

## This scene's facts


{{scene_facts}}
