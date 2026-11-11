<!-- system -->
You are one step of a pipeline that turns a detective story into structured data for a reading game. You see only
what this message gives you. Use only the text given, read as a first-time reader would read it: if you recognise
the story, do not use what you remember of it, its characters' secrets or its ending. Follow the format exactly.
Put your output in one or more ```jsonl fenced blocks, one JSON object per line; anything outside the blocks is
ignored, so keep remarks short.


<!-- user -->
# Step: the annotated reading, one scene

# The annotated reading: a reader's notes, paragraph by paragraph

A reading guide for a detective story: the annotations a careful first-time reader would write in the margin while
trying to make each deduction before the detective announces it. Each annotation is tied to the earliest paragraph
that makes it possible. It describes the story's puzzle as a reader meets it, not any data format.

## Fair play

The story may be a well-known one. The annotations are a first-time reader's, so:

- An annotation may use only what the text has disclosed up to its paragraph, plus background knowledge, which is
  always named as a card (below).
- Every annotation carries a **confidence** a reader could justify at that point: *weak* (a flag, an itch), *fair* (a
  live hypothesis worth acting on), *strong* (would bet on it).
- Where knowing the ending would probably make an annotation easier than it is on a first reading, mark it with a
  `hindsight` note saying what a first-time reader would need in order to make it. Do not leave such an annotation
  out: mark it.
- Record the wrong turns a first-time reader would take: a HYPOTHESIS the reader takes up, then a DROP that cites
  the reason. A reading with no wrong turns is not honest.
- Leave out any annotation that only someone who knows the ending would make.

## An annotation

One JSON object per line:

```json
{"id": "t7.2", "para": 7, "tag": "NOTICE", "confidence": "weak", "profile": "careful", "from": ["t6.1"], "reads": "I heard the yard gate creak", "text": "Ruth heard the gate from the house; Dobbs, nearer, says he heard nothing."}
```

| Field | Meaning |
|---|---|
| `id` | `t<para>.<n>`, n counting from 1 within the paragraph. |
| `para` | The annotation's earliest date: the first paragraph at which every premise is available. |
| `tag` | The kind of move (table below); `subtype` where useful. |
| `confidence` | `weak`, `fair`, `strong` (not for RECORD, SET ASIDE). |
| `profile` | `typical` (a first-time reader paying normal attention), `careful` (a reader playing it as a puzzle), `expert` (needs specialist knowledge, or a leap almost nobody makes). |
| `from` | The premises: annotation ids and background cards (`bk.*`), all needed. Earlier or same paragraph only. |
| `reads` | When the annotation reads the text: the clause it reads, copied exactly from its paragraph. |
| `text` | The note itself, as written in the margin at this paragraph. It cites nothing later. |
| `relations` | Optional: `[{"type", "target"}]`, type one of `supports`, `strains` (makes the target less likely), `refutes`, `undercuts` (attacks the step from the target's premises to its conclusion), `revises`, `drops`. |
| `options` | For a QUESTION or HYPOTHESIS: the candidate answers the reader holds open, as a list of short texts. |
| `hindsight` | Optional: the note on what a first-time reader would need (see Honesty). |

## Tags

| Tag | Subtypes | What the reader is doing |
|---|---|---|
| RECORD | | Putting a fact from the text into the picture of what happened. One fact per record, quoted at clause level. Record what matters for the puzzle, not every sentence. |
| NOTICE | calculate | Flagging a detail that an ordinary version of this story would not contain. `calculate`: the oddity shows only after arithmetic on stated figures. |
| ABSENCE | | Expecting something the text does not report. |
| QUESTION | opportunity, motive, turn-around | Naming a blank. `turn-around`: inverting a question to make it productive. |
| HYPOTHESIS | opportunity, motive, scenario | Proposing candidate explanations, held open. `scenario`: a whole story of the events. |
| INFER | opportunity | A step as good as certain given its premises. |
| DEFAULT | period | A step through background knowledge that usually holds, with named exceptions. `period`: a belief of the story's time, presented in its terms without endorsing it. |
| AGENT | | Reasoning about what a person in that position would do or would have done. |
| PHYSICAL | | Reasoning about what could physically happen. |
| IDENTIFY | merge, split | Two names or descriptions are one thing, or one thing is really two. |
| WEIGH | | Treating testimony as speech: saw versus concluded, could they know, would they lie. |
| SOURCE | | Tracing a "fact" back along its chain of reporting. |
| TEST | | Checking new information against a live hypothesis. |
| RESIDUE | | Listing what a theory leaves unexplained. |
| PREDICT | | Saying what a hypothesis implies we will find. |
| TEST PLAN | | Choosing a check that would tell two hypotheses apart. |
| GENRE | re-read, watch-detective | Reading the narrator's or the detective's behaviour as a signal. `re-read`: going back to earlier text with a new question. `watch-detective`: inferring from what the detective looks at. |
| SET ASIDE | | Marking a detail as scenery. |
| DROP | | Abandoning a hypothesis, citing why. |
| REVISE | | An earlier item changes meaning. |

## Background cards

General knowledge a reader brings: `{"bk": "bk.<name>", "text", "exceptions"?, "reader"?}`, one per line, written
the first time an annotation uses one. `reader` says who has it: `all`, `period` (a reader of the story's time), or
`specialist`. A card states a general rule, never the case's answer ("A guard dog barks at strangers at night"; not
"the dog knew the thief").

The invented example, *The Miller's Purse* (spec.md), might give at ¶8: `{"bk": "bk.sound_carries", "text": "A
creaking gate is heard first by whoever sleeps nearest it.", "reader": "all"}` and an annotation
`{"id": "t8.1", "para": 8, "tag": "WEIGH", "confidence": "fair", "profile": "careful", "from": ["t7.1", "bk.sound_carries"], "reads": "I heard nothing", "text": "Dobbs sleeps over the yard. Either the gate did not creak, or he is not telling the truth, or he was not in the loft."}`.


## Your task

Write the reading guide's annotations for scene s01 (Breakfast at Baker Street and the train to Dartmoor), ¶1–¶16, paragraph by
paragraph. The story is given up to the end of this scene, with the annotations so far; the rest of the story is not
given. Continue the guide: new annotations for this scene's paragraphs only, ids continuing the numbering, `from`
citing earlier annotations and cards where they are premises; each uses only the paragraphs up to its own.
Background cards already introduced are listed; add new ones as lines `{"bk": ...}` when an annotation first needs
them. At the end of the scene, add a summary annotation or two where useful (what is open, what is suspected),
dated to the scene's last paragraph.

## Background cards so far

(none yet)

## The annotations so far

(none yet)

## The story so far (this scene is ¶1–¶16)

¶0 I. Silver Blaze

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

¶13 “Tuesday evening!” I exclaimed. “And this is Thursday morning. Why didn’t you go down yesterday?”

¶14 “Because I made a blunder, my dear Watson—which is, I am afraid, a more common occurrence than any one would think who only knew me through your memoirs. The fact is that I could not believe it possible that the most remarkable horse in England could long remain concealed, especially in so sparsely inhabited a place as the north of Dartmoor. From hour to hour yesterday I expected to hear that he had been found, and that his abductor was the murderer of John Straker. When, however, another morning had come, and I found that beyond the arrest of young Fitzroy Simpson nothing had been done, I felt that it was time for me to take action. Yet in some ways I feel that yesterday has not been wasted.”

¶15 “You have formed a theory, then?”

¶16 “At least I have got a grip of the essential facts of the case. I shall enumerate them to you, for nothing clears up a case so much as stating it to another person, and I can hardly expect your co-operation if I do not show you the position from which we start.”

