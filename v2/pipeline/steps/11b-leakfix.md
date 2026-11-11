# Step: fix the labels that run ahead of the story

{{spec}}

## The story

{{story}}

## Your task

A blind check, which saw only the story up to the paragraph where each label below first shows, found that these
labels say more than the story has told by then. Fix each with the smallest change that keeps the page truthful
at every paragraph:

- a time point's label: `labels` steps (`{"file": "patch", "id": <time id>, "set": {"labels": [{"from", "label"},
  …]}}`), each label saying only what the story has told by its `from`;
- an entity's name: a plainer `name` (a description that holds at the first mention), or `names` steps;
- a question's label: `labels` steps, or a plainer `label`;
- an account's label: a plainer `label` naming only the source, or `labels` steps;
- a possibility: if nobody could yet have a reason to consider it, a later `available` (where the story first
  gives a reason), as `{"file": "possibility", "q", "value", "available"}`; otherwise, if the check is wrong, leave
  it (say so outside the block).

Patches are `{"file": "patch", "id", "set": {...}}`. Say nothing that the story tells later.

## The flagged labels (paragraph, kind, id, label, the checker's reason)

{{flagged}}

## The data lines they come from

{{lines}}
