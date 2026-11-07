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

1. (name) England
2. (name) Holmes and Watson's rooms
3. (name) The favourite for the Wessex Cup
4. (name) The trainer
5. (name) Holmes and Watson's news agent
6. (name) Fresh editions of every paper
7. (name) Holmes's pipe
8. (name) The newspapers
9. (time) Before the story
10. (time) When the favourite vanished and its trainer was murdered
11. (time) The day before, while Holmes brooded
12. (account) What the newspapers report
13. (question) What has become of the favourite?
14. (possibility) What has become of the favourite? — stolen and hidden somewhere
15. (possibility) What has become of the favourite? — strayed loose on the moor
16. (possibility) What has become of the favourite? — dead, the body not yet found
17. (question) Who took the favourite?
18. (possibility) Who took the favourite? — someone with money riding against the favourite
19. (possibility) Who took the favourite? — a rival stable
20. (question) Who murdered the trainer?
21. (possibility) Who murdered the trainer? — someone with a private grudge against the trainer
22. (question) How are the trainer's murder and the favourite's disappearance connected?
23. (possibility) How are the trainer's murder and the favourite's disappearance connected? — one person took the horse and killed the trainer who got in the way
24. (possibility) How are the trainer's murder and the favourite's disappearance connected? — the two are separate, or linked only by chance
25. (question) Why was the favourite made away with?
26. (possibility) Why was the favourite made away with? — to stop it running in the Wessex Cup

Judge every label.
