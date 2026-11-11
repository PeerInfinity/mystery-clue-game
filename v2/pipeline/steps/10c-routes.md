{{spec}}

## All facts

{{facts}}

## Questions (with their answers)

{{questions}}

## The case's own action types

{{case_actions}}

## The annotated reading

{{reading}}

## The story

{{story}}

## Your task

The page's reasoning moves were tried on this case (the real page, `scripts/route-check.mjs`): just before each
question's answer is given away, with the right answers circled that a careful reader could have circled by then,
every "What is this for?" link the engine accepts was made, again and again until nothing new fitted. The questions
below are of the kind those moves can reach (an aim, who did an action, why an action was done), and no link reached
their answer. For each, the engine's reasons why the links tried did not fit are given.

For each question, either:

- add the typed data a careful reader's reasoning actually uses, so that the link fits: a need the action requires
  (a rule in a case's own action type, or `need` on a reason the reader circles), the action's roles on a fact or
  a question's entry, a goal, an implied step, a guard; as `{"file": "patch", …}`, `{"file": "possibility", …}`,
  `{"file": "actions", …}` (a case's own type, corrected: give it whole), `{"file": "joins", …}`; or
- if the story's reasoning reaches this answer some other way (by what is told, or by a change, a clash or what
  stopped someone, which other moves handle), say so: `{"file": "noroute", "q": <question id>, "why": "<how the
  reader reaches it>"}`.

Never add data only to make a link fit: each rule must be one the story gives a reason for.

## The generic action types

{{generic_actions}}

## The questions with no route, and why the links tried did not fit

{{report}}
