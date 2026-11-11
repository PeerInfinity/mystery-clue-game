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
THE STORY SO FAR (paragraphs 1 to 12):

¶1 I am afraid, Watson, that I shall have to go,” said Holmes, as we sat down together to our breakfast one morning.

¶2 “Go! Where to?”

¶3 “To Dartmoor; to King’s Pyland.”

¶4 I was not surprised. Indeed, my only wonder was that he had not already been mixed up in this extraordinary case, which was the one topic of conversation through the length and breadth of England. For a whole day my companion had rambled about the room with his chin upon his chest and his brows knitted, charging and recharging his pipe with the strongest black tobacco, and absolutely deaf to any of my questions or remarks. Fresh editions of every paper had been sent up by our news agent, only to be glanced over and tossed down into a corner. Yet, silent as he was, I knew perfectly well what it was over which he was brooding. There was but one problem before the public which could challenge his powers of analysis, and that was the singular disappearance of the favourite for the Wessex Cup, and the tragic murder of its trainer. When, therefore, he suddenly announced his intention of setting out for the scene of the drama it was only what I had both expected and hoped for.

¶5 “I should be most happy to go down with you if I should not be in the way,” said I.

¶6 “My dear Watson, you would confer a great favour upon me by coming. And I think that your time will not be misspent, for there are points about the case which promise to make it an absolutely unique one. We have, I think, just time to catch our train at Paddington, and I will go further into the matter upon our journey. You would oblige me by bringing with you your very excellent field-glass.”

¶7 And so it happened that an hour or so later I found myself in the corner of a first-class carriage flying along en route for Exeter, while Sherlock Holmes, with his sharp, eager face framed in his ear-flapped travelling-cap, dipped rapidly into the bundle of fresh papers which he had procured at Paddington. We had left Reading far behind us before he thrust the last one of them under the seat, and offered me his cigar-case.

¶8 “We are going well,” said he, looking out the window and glancing at his watch. “Our rate at present is fifty-three and a half miles an hour.”

¶9 “I have not observed the quarter-mile posts,” said I.

¶10 “Nor have I. But the telegraph posts upon this line are sixty yards apart, and the calculation is a simple one. I presume that you have looked into this matter of the murder of John Straker and the disappearance of Silver Blaze?”

¶11 “I have seen what the _Telegraph_ and the _Chronicle_ have to say.”

¶12 “It is one of those cases where the art of the reasoner should be used rather for the sifting of details than for the acquiring of fresh evidence. The tragedy has been so uncommon, so complete and of such personal importance to so many people, that we are suffering from a plethora of surmise, conjecture, and hypothesis. The difficulty is to detach the framework of fact—of absolute undeniable fact—from the embellishments of theorists and reporters. Then, having established ourselves upon this sound basis, it is our duty to see what inferences may be drawn and what are the special points upon which the whole mystery turns. On Tuesday evening I received telegrams from both Colonel Ross, the owner of the horse, and from Inspector Gregory, who is looking after the case, inviting my co-operation.”

---

THE LABELS that first appear at paragraph 12:

1. (account) Holmes's own part
2. (name) Colonel Ross
3. (name) Inspector Gregory
4. (name) The telegrams
5. (time) Tuesday evening: the telegrams

Judge every label.
