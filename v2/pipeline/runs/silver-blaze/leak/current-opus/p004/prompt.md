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
THE STORY SO FAR (paragraphs 1 to 4):

¶1 I am afraid, Watson, that I shall have to go,” said Holmes, as we sat down together to our breakfast one morning.

¶2 “Go! Where to?”

¶3 “To Dartmoor; to King’s Pyland.”

¶4 I was not surprised. Indeed, my only wonder was that he had not already been mixed up in this extraordinary case, which was the one topic of conversation through the length and breadth of England. For a whole day my companion had rambled about the room with his chin upon his chest and his brows knitted, charging and recharging his pipe with the strongest black tobacco, and absolutely deaf to any of my questions or remarks. Fresh editions of every paper had been sent up by our news agent, only to be glanced over and tossed down into a corner. Yet, silent as he was, I knew perfectly well what it was over which he was brooding. There was but one problem before the public which could challenge his powers of analysis, and that was the singular disappearance of the favourite for the Wessex Cup, and the tragic murder of its trainer. When, therefore, he suddenly announced his intention of setting out for the scene of the drama it was only what I had both expected and hoped for.

---

THE LABELS that first appear at paragraph 4:

1. (fact) Silver Blaze: condition "first favourite for the Wessex Cup, at three to one on"
2. (fact) John Straker: condition "dead"
3. (fact) Silver Blaze: location null (unknown: not found)
4. (account) The horse, the stable, its people and the country round
5. (account) The searchers' account: the lads roused, the knoll, the coat, the body
6. (account) What the police found: the wounds, the hands, the hollow, the hunt for the horse
7. (name) John Straker
8. (name) The news agent
9. (name) The police
10. (name) Silver Blaze
11. (name) Holmes's pipe
12. (name) The newspapers
13. (name) The public
14. (time) Tuesday, between one and seven: in the hollow, at the time of the struggle
15. (time) Tuesday, seven in the morning
16. (time) Tuesday morning, the body found
17. (time) Tuesday, after the finding: the cravat recognised, Hunter recovers
18. (time) Tuesday evening: the telegrams
19. (time) Wednesday, a whole day at Baker Street
20. (time) Thursday, past Reading
21. (question) Who struck the blow that killed Straker?

Judge every label.
