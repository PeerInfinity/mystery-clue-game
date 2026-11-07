# Step: entities and mentions, one scene

{{spec}}

## Your task

List the entities that scene {{scene_id}} ({{scene_title}}, ¶{{from}}–¶{{to}}) brings in or names anew, and every
phrase by which the story names each, as far as the story has gone. You have the story up to the end of this scene
and the entities found so far; you have not read further.

- A new entity: `{"file": "entities", "id", "kind", "name", "within"?}`. Name an unknown person by how the story
  presents them so far. Include every person, group, animal, place, object and document the facts of the story so
  far would need: who is where, who has what, what is done to what. Places nest with `within` (a room within a house
  within an estate). In the first scene, also the state entities `calendar`, `clock` and, if the weather matters,
  `weather`. The narrators ({{narrators}}) are entities too.
- A new phrase for an entity, new or old: `{"file": "mentions", "id", "phrases": [...]}`: each phrase exactly as it
  appears in the text (a name, a title, a description: "the trainer", "my companion"). Limit a phrase to paragraphs
  `{"text", "paras": [from, to]}` where the same words name something else elsewhere in the story so far. An
  entity with no phrase in the text gets `"source": "<a quote from the paragraph that brings it in>"` on its entity
  line.
- Something that travels and holds people (a carriage, a train): `{"file": "moves", "id"}`. A door between two
  places: `{"file": "joins", "door", "sides": [inside, outside]}`.
- To correct an entity already listed (a better name, a `within`): `{"file": "entities", "id", …the fields that change}`.

## The narrators

{{narrators}}

## Entities so far

{{entities}}

## Mentions so far

{{mentions}}

## The story so far (this scene is ¶{{from}}–¶{{to}})

{{story}}
