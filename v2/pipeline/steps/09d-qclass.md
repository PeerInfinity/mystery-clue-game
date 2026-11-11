# Step: sorting the questions, with the whole story

## Your task

The whole story is below, with the questions an earlier step wrote while reading it forward, and their answers. The game
lists them for a reader to work on, and too many of them bury what matters. Now that the story is complete, sort every
question into one of three classes. Give one line for each question, in the order listed:

`{"file": "qclass", "id": <question id>, "class": "case" | "ask" | "side", "why": <a few words>}`

- `case`: the solution of the mystery, or the reasoning that reaches it, turns on this question: who did it, how, with
  what, where, when, why, and what each odd detail really was.
- `ask`: the solution does not turn on it, but a careful reader working on the mystery would reasonably ask it: a false
  trail or a suspicion, whether a witness can be believed, what someone knew or wanted, what is about to happen.
- `side`: a matter of no consequence to what happened. Invented examples: "Why does the inspector wear his hat indoors?",
  "Who told the narrator what the neighbours said?", "What will the newspapers make of it?", "Did the curate enjoy his
  dinner?", a question about what happens to the people after the case is over, or about how the narrator came to know
  a thing when nothing hangs on it.

Rules:

- **When in doubt between `ask` and `side`, choose `ask`.** A `side` question is taken away from the reader.
- A question the story never answers is not `side` for that reason alone; one that a reader would worry at stays.
- A question about a false trail is `ask` at least: the wrong ideas are part of the case.
- Do not let the class depend on how dramatic the question sounds.

Every question listed gets exactly one line. Add none, change none.

## The questions

{{questions}}

## The whole story

{{story}}
