# Step: sorting the time points, with the whole story

## Your task

The whole story is below, with the time points an earlier step made while reading it forward, one for nearly every
moment. The game shows them to a reader as a timeline, and too many of them bury what matters. Now that the story is
complete, sort every point into one of three classes. Give one line for each point, in the order listed:

`{"file": "timeclass", "id": <time id>, "class": "case" | "lead" | "business", "why": <a few words>}`

- `case`: the solution of the mystery, or the reasoning that reaches it, depends on this moment.
- `lead`: the solution does not depend on it, but a careful reader working out what happened might reasonably use it:
  a false trail or a suspicion, a statement later overturned, when someone was where, what someone could do, knew,
  wanted or had to gain, a preparation, a warning, a change in the situation.
- `business`: a moment of talk or stage business that nothing about what happened turns on. Invented examples: "the
  inspector lights his pipe", "the curate wishes them good morning", "the clerk laughs", "the constable holds the
  door".

Rules:

- **When in doubt between `lead` and `business`, choose `lead`.** A filtered point is lost to the reader; a kept one
  costs only a row.
- **A conversation in which something is told keeps one point.** Where a run of points are the successive lines of
  one conversation, the first or most general of them is `lead` (or `case`), so the telling has a moment to sit at;
  the rest are `business`, unless a line is itself an event (a threat carried out, a thing handed over, a decision
  taken, a person arriving or leaving).
- Do not let the class depend on how vivid or how brief the moment is. A brief moment can be `case`.
- The story's own journeys and arrivals (who went where, and when) are `lead` at least.

Every point listed gets exactly one line. Add no points, change no labels.

## The time points

{{times}}

## The whole story

{{story}}
