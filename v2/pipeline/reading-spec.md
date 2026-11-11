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
