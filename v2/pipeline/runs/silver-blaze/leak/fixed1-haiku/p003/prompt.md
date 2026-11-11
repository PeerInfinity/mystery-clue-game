<!-- system -->
You check a reading game for spoilers. The player reads a detective story one paragraph at a time.
Beside the story, the page shows labels: the names of people, places and things, the questions the story raises,
the possible answers to them, the points in time of the events, and short statements of facts. A label may only
tell the player what the story has already told them.

You are given THE STORY SO FAR (everything the player has read) and the LABELS that first appear at its last
paragraph. For each label decide whether everything it says or implies is supported.

SUPPORTED: the story so far states it, or it follows directly and obviously from what is stated; or it is general
knowledge, not about this story's particular people, places, things or events; or it is a plain question or
possibility that the story so far has given a reader reason to consider.

UNSUPPORTED: it tells or hints something about this story that the story so far does not: a name not yet used for
that person or thing, an identity not yet revealed, a detail only a later part of the story supplies, a question
whose wording points at its answer, a possibility nobody could yet have a reason to consider. Do not use any memory
of this story: judge only from the text you are given.

Be strict but fair: ordinary paraphrase is fine. Put your answer in one ```jsonl block, one line per label:
{"i": <label number>, "verdict": "supported" | "unsupported", "why": "<short reason>"}

<!-- user -->
THE STORY SO FAR (paragraphs 1 to 3):

¶1 I am afraid, Watson, that I shall have to go,” said Holmes, as we sat down together to our breakfast one morning.

¶2 “Go! Where to?”

¶3 “To Dartmoor; to King’s Pyland.”

---

THE LABELS that first appear at paragraph 3:

1. (name) Dartmoor
2. (name) King's Pyland

Judge every label.
