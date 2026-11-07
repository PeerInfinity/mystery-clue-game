# Step: scenes

Divide the story into scenes: stretches of continuous action in one setting, or one long telling (a witness's
story, a newspaper account, the detective's explanation). Later steps work through the story one scene at a time,
each seeing the story only up to the end of its scene, so a scene should be small enough to annotate in one go
(usually 10 to 40 paragraphs) and end where a reader would pause.

Output one line per scene, in order, covering every paragraph from ¶1 to the last with no gap or overlap:
`{"id": "s01", "title": "...", "from": 1, "to": 12, "place": "...", "present": ["..."]}`. `title` says where and
what in a few plain words; it must not tell more than the scene itself does.

## The story

{{story}}
