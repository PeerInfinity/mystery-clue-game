{{spec}}

## All facts

{{facts}}

## Questions (with their answers)

{{questions}}

## The annotated reading

{{reading}}

## The story

{{story}}

## Your task

Write the typed data the reader's reasoning moves need (see "Typed data" in the format above), for the whole story.
Go through the reasoning a careful reader does in the annotated reading, and the answers of the questions: wherever
the reasoning runs "this was done in order to that", "that would have needed this", or "who did it, and why", give
the data the moves need to check it:

- the actions that matter, typed (`act` and their roles) by patches to their facts; doors and their states, their
  `joins`; whoever keeps watch, `guards`;
- the goals of the intentions told (facts) and of the aims a question about why someone acted puts forward
  (possibilities), and an aim's implied last step (`step`);
- `need` on a reason that adds a need to an action; `end` on a question of motive; `presupposes` on a question
  about why an action told was done; the action in the entry of a question about who did it; `plan` on a claim
  that tells how something was done, or one the story proposes only as a supposition (no `asserts`);
- states that change where the reasoning notices the change (a door's, a walker's `heading`), and actions whose
  effect leaves someone unable to act where the reasoning asks what stopped a plan;
- the case's own action types where no generic one fits, and what a goal's state brings with it (`ramifies`).

Write only what the story's reasoning uses; leave the rest untyped. A who-answer, an aim and a reason must stay
true to what the story says: never type something to make a wrong answer fit.

Lines: `{"file": "patch", "id": <fact or question id>, "set": {...}}` (a question's whole `entry`, or `presupposes`,
`end`); `{"file": "possibility", "q", "value", "goal"?, "step"?, "need"?, "implies"?, "rests_on"?}` (the
possibility's other fields stay as they are); `{"file": "joins", "door", "sides": [inside, outside]}`; `{"file":
"actions", "id", "label", "requires", "effects"}`; `{"file": "ramifies", "if", "then"}`.

## The generic action types

{{generic_actions}}
