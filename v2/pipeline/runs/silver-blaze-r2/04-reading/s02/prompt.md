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

Write the reading guide's annotations for scene s02 (On the train, Holmes lays out the facts of the case), ¶17–¶46, paragraph by
paragraph. The story is given up to the end of this scene, with the annotations so far; the rest of the story is not
given. Continue the guide: new annotations for this scene's paragraphs only, ids continuing the numbering, `from`
citing earlier annotations and cards where they are premises; each uses only the paragraphs up to its own.
Background cards already introduced are listed; add new ones as lines `{"bk": ...}` when an annotation first needs
them. At the end of the scene, add a summary annotation or two where useful (what is open, what is suspected),
dated to the scene's last paragraph.

## Background cards so far

{"bk":"bk.favourite_motive","text":"When a horse is favourite for a big race, people who have bet against it, or who stand to lose if it wins, have a reason to stop it running.","exceptions":"The owner or backers of the favourite normally want it to run.","reader":"all"}
{"bk":"bk.horse_conspicuous","text":"A famous racehorse is large, valuable and recognisable, and it is hard to hide or move unseen in open, thinly settled country.","exceptions":"It can be hidden if it is disguised, kept in a building, or killed.","reader":"all"}
{"bk":"bk.genre_detective_signals","text":"In detective stories, what the detective asks for, looks at, or finds odd usually matters later.","reader":"all"}

## The annotations so far

{"id":"t4.1","para":4,"tag":"RECORD","profile":"typical","from":[],"reads":"the singular disappearance of the favourite for the Wessex Cup, and the tragic murder of its trainer","text":"Two events: the favourite for the Wessex Cup has vanished, and its trainer has been murdered."}
{"id":"t4.2","para":4,"tag":"QUESTION","confidence":"fair","profile":"typical","from":["t4.1"],"text":"How are the disappearance and the murder connected?","options":["A thief came for the horse and killed the trainer who got in the way","The two are separate, or only linked by coincidence","The trainer was mixed up in what happened to the horse"]}
{"id":"t4.3","para":4,"tag":"HYPOTHESIS","confidence":"weak","profile":"typical","from":["t4.1"],"text":"What does 'disappearance' mean for the horse?","options":["Stolen and hidden","Strayed loose in the confusion","Killed or maimed and the body not yet found"]}
{"id":"t4.4","para":4,"tag":"QUESTION","subtype":"motive","confidence":"fair","profile":"typical","from":["t4.1","bk.favourite_motive"],"text":"Who gains if the favourite does not run? Bookmakers, people who bet against it, rival owners. Who would want the trainer dead?","options":["Someone with money riding against the favourite","A rival stable","Someone with a private grudge against the trainer"]}
{"id":"t6.1","para":6,"tag":"GENRE","subtype":"watch-detective","confidence":"weak","profile":"careful","from":["bk.genre_detective_signals"],"reads":"You would oblige me by bringing with you your very excellent field-glass.","text":"Holmes wants a field-glass before he has seen the ground. He expects to look at something at a distance: open moor, a racecourse, figures far off. Keep it in mind."}
{"id":"t6.2","para":6,"tag":"GENRE","confidence":"weak","profile":"typical","from":[],"reads":"there are points about the case which promise to make it an absolutely unique one","text":"Holmes already sees particular 'points', apparently from the newspaper reports alone. The clues may be in the facts he is about to list."}
{"id":"t8.1","para":8,"tag":"SET ASIDE","profile":"typical","from":[],"reads":"Our rate at present is fifty-three and a half miles an hour.","text":"The speed calculation from the telegraph posts shows off Holmes's method. It has no bearing on the case."}
{"id":"t10.1","para":10,"tag":"RECORD","profile":"typical","from":["t4.1"],"reads":"this matter of the murder of John Straker and the disappearance of Silver Blaze","text":"Names: the trainer is John Straker, and the horse is Silver Blaze."}
{"id":"t12.1","para":12,"tag":"GENRE","confidence":"fair","profile":"careful","from":[],"reads":"the art of the reasoner should be used rather for the sifting of details than for the acquiring of fresh evidence","text":"Holmes says the answer lies in the facts already known, once they are cleared of journalists' theorising. So the reader should treat his coming summary as the evidence to sift, and distrust press 'conjecture'."}
{"id":"t12.2","para":12,"tag":"RECORD","profile":"typical","from":[],"reads":"I received telegrams from both Colonel Ross, the owner of the horse, and from Inspector Gregory, who is looking after the case, inviting my co-operation","text":"Colonel Ross owns the horse, and Inspector Gregory leads the police case. Both called Holmes in on Tuesday evening."}
{"id":"t13.1","para":13,"tag":"INFER","confidence":"strong","profile":"careful","from":["t12.2"],"reads":"And this is Thursday morning.","text":"The telegrams came Tuesday evening, so the crime happened no later than Tuesday, probably Monday night or Tuesday. Two days have now passed."}
{"id":"t14.1","para":14,"tag":"DEFAULT","confidence":"fair","profile":"typical","from":["t4.3","bk.horse_conspicuous"],"reads":"I could not believe it possible that the most remarkable horse in England could long remain concealed, especially in so sparsely inhabited a place as the north of Dartmoor","text":"Holmes reasoned as anyone would: a famous horse on an empty moor gets found quickly."}
{"id":"t14.2","para":14,"tag":"DROP","confidence":"fair","profile":"typical","from":["t4.3","t13.1","t14.1"],"relations":[{"type":"drops","target":"t4.3"}],"text":"The horse cannot have simply strayed. A loose favourite on a thinly peopled moor would have turned up within two days. Someone is keeping it out of sight, or it is dead."}
{"id":"t14.3","para":14,"tag":"QUESTION","confidence":"fair","profile":"careful","from":["t14.1","t14.2","bk.horse_conspicuous"],"text":"How can so conspicuous a horse stay unfound? Turn it around: what would make the usual rule fail here?","options":["Shut in a building nearby","Changed in appearance so that nobody recognises it","Taken a long way off very quickly","Dead, and the body hidden"]}
{"id":"t14.4","para":14,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"fair","profile":"typical","from":["t4.2","t14.1"],"reads":"I expected to hear that he had been found, and that his abductor was the murderer of John Straker","text":"Working theory, Holmes's own until now: one person took the horse and killed Straker."}
{"id":"t14.5","para":14,"tag":"RECORD","profile":"typical","from":[],"reads":"beyond the arrest of young Fitzroy Simpson nothing had been done","text":"The police have arrested a young man, Fitzroy Simpson."}
{"id":"t14.6","para":14,"tag":"HYPOTHESIS","confidence":"weak","profile":"typical","from":["t14.5","t14.4"],"text":"Simpson is the abductor and murderer.","options":["Simpson did both","Simpson did one or the other","Simpson is innocent and was arrested on suspicion"]}
{"id":"t14.7","para":14,"tag":"WEIGH","confidence":"weak","profile":"careful","from":["t14.5","t14.6"],"relations":[{"type":"strains","target":"t14.6"}],"text":"Holmes treats the arrest as 'nothing having been done'. To him an arrest does not settle the case, especially with the horse still missing. If Simpson knew where the horse was, one might expect it to have been found by now."}
{"id":"t14.8","para":14,"tag":"GENRE","subtype":"watch-detective","confidence":"weak","profile":"careful","from":[],"reads":"Yet in some ways I feel that yesterday has not been wasted.","text":"The fact that the horse was not found is itself information to Holmes. Its continued absence is a clue to how it is being hidden."}
{"id":"t16.1","para":16,"tag":"RESIDUE","confidence":"fair","profile":"careful","from":["t4.2","t4.4","t14.3","t14.4","t14.6","t6.1"],"text":"Open at the end of the scene: how the murder and the disappearance connect; where an unfindable famous horse can be; who profits if the favourite does not run; whether Simpson is more than a convenient arrest; and what Holmes means to look at with the field-glass. The details have not been given yet. Holmes's list of facts comes next and should be read closely."}
{"id":"t16.2","para":16,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"typical","from":["t14.4","t14.2","t4.4"],"text":"Leading picture so far: someone with an interest against the favourite stole or harmed Silver Blaze, killed Straker in the process, and has hidden the horse well. Simpson is the police's candidate. It is held loosely, because Holmes's own version of it has already failed once."}

## The story so far (this scene is ¶17–¶46)

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

¶17 I lay back against the cushions, puffing at my cigar, while Holmes, leaning forward, with his long, thin forefinger checking off the points upon the palm of his left hand, gave me a sketch of the events which had led to our journey.

¶18 “Silver Blaze,” said he, “is from the Isonomy stock, and holds as brilliant a record as his famous ancestor. He is now in his fifth year, and has brought in turn each of the prizes of the turf to Colonel Ross, his fortunate owner. Up to the time of the catastrophe he was the first favourite for the Wessex Cup, the betting being three to one on him. He has always, however, been a prime favourite with the racing public, and has never yet disappointed them, so that even at those odds enormous sums of money have been laid upon him. It is obvious, therefore, that there were many people who had the strongest interest in preventing Silver Blaze from being there at the fall of the flag next Tuesday.

¶19 “The fact was, of course, appreciated at King’s Pyland, where the Colonel’s training-stable is situated. Every precaution was taken to guard the favourite. The trainer, John Straker, is a retired jockey who rode in Colonel Ross’s colours before he became too heavy for the weighing-chair. He has served the Colonel for five years as jockey and for seven as trainer, and has always shown himself to be a zealous and honest servant. Under him were three lads; for the establishment was a small one, containing only four horses in all. One of these lads sat up each night in the stable, while the others slept in the loft. All three bore excellent characters. John Straker, who is a married man, lived in a small villa about two hundred yards from the stables. He has no children, keeps one maid-servant, and is comfortably off. The country round is very lonely, but about half a mile to the north there is a small cluster of villas which have been built by a Tavistock contractor for the use of invalids and others who may wish to enjoy the pure Dartmoor air. Tavistock itself lies two miles to the west, while across the moor, also about two miles distant, is the larger training establishment of Mapleton, which belongs to Lord Backwater, and is managed by Silas Brown. In every other direction the moor is a complete wilderness, inhabited only by a few roaming gypsies. Such was the general situation last Monday night when the catastrophe occurred.

¶20 “On that evening the horses had been exercised and watered as usual, and the stables were locked up at nine o’clock. Two of the lads walked up to the trainer’s house, where they had supper in the kitchen, while the third, Ned Hunter, remained on guard. At a few minutes after nine the maid, Edith Baxter, carried down to the stables his supper, which consisted of a dish of curried mutton. She took no liquid, as there was a water-tap in the stables, and it was the rule that the lad on duty should drink nothing else. The maid carried a lantern with her, as it was very dark and the path ran across the open moor.

¶21 “Edith Baxter was within thirty yards of the stables, when a man appeared out of the darkness and called to her to stop. As he stepped into the circle of yellow light thrown by the lantern she saw that he was a person of gentlemanly bearing, dressed in a grey suit of tweeds, with a cloth cap. He wore gaiters, and carried a heavy stick with a knob to it. She was most impressed, however, by the extreme pallor of his face and by the nervousness of his manner. His age, she thought, would be rather over thirty than under it.

¶22 “‘Can you tell me where I am?’ he asked. ‘I had almost made up my mind to sleep on the moor, when I saw the light of your lantern.’

¶23 “‘You are close to the King’s Pyland training-stables,’ said she.

¶24 “‘Oh, indeed! What a stroke of luck!’ he cried. ‘I understand that a stable-boy sleeps there alone every night. Perhaps that is his supper which you are carrying to him. Now I am sure that you would not be too proud to earn the price of a new dress, would you?’ He took a piece of white paper folded up out of his waistcoat pocket. ‘See that the boy has this to-night, and you shall have the prettiest frock that money can buy.’

¶25 “She was frightened by the earnestness of his manner, and ran past him to the window through which she was accustomed to hand the meals. It was already opened, and Hunter was seated at the small table inside. She had begun to tell him of what had happened, when the stranger came up again.

¶26 “‘Good-evening,’ said he, looking through the window. ‘I wanted to have a word with you.’ The girl has sworn that as he spoke she noticed the corner of the little paper packet protruding from his closed hand.

¶27 “‘What business have you here?’ asked the lad.

¶28 “‘It’s business that may put something into your pocket,’ said the other. ‘You’ve two horses in for the Wessex Cup—Silver Blaze and Bayard. Let me have the straight tip and you won’t be a loser. Is it a fact that at the weights Bayard could give the other a hundred yards in five furlongs, and that the stable have put their money on him?’

¶29 “‘So, you’re one of those damned touts!’ cried the lad. ‘I’ll show you how we serve them in King’s Pyland.’ He sprang up and rushed across the stable to unloose the dog. The girl fled away to the house, but as she ran she looked back and saw that the stranger was leaning through the window. A minute later, however, when Hunter rushed out with the hound he was gone, and though he ran all round the buildings he failed to find any trace of him.”

¶30 “One moment,” I asked. “Did the stable-boy, when he ran out with the dog, leave the door unlocked behind him?”

¶31 “Excellent, Watson, excellent!” murmured my companion. “The importance of the point struck me so forcibly that I sent a special wire to Dartmoor yesterday to clear the matter up. The boy locked the door before he left it. The window, I may add, was not large enough for a man to get through.

¶32 “Hunter waited until his fellow-grooms had returned, when he sent a message to the trainer and told him what had occurred. Straker was excited at hearing the account, although he does not seem to have quite realized its true significance. It left him, however, vaguely uneasy, and Mrs. Straker, waking at one in the morning, found that he was dressing. In reply to her inquiries, he said that he could not sleep on account of his anxiety about the horses, and that he intended to walk down to the stables to see that all was well. She begged him to remain at home, as she could hear the rain pattering against the window, but in spite of her entreaties he pulled on his large mackintosh and left the house.

¶33 “Mrs. Straker awoke at seven in the morning, to find that her husband had not yet returned. She dressed herself hastily, called the maid, and set off for the stables. The door was open; inside, huddled together upon a chair, Hunter was sunk in a state of absolute stupor, the favourite’s stall was empty, and there were no signs of his trainer.

¶34 “The two lads who slept in the chaff-cutting loft above the harness-room were quickly aroused. They had heard nothing during the night, for they are both sound sleepers. Hunter was obviously under the influence of some powerful drug, and as no sense could be got out of him, he was left to sleep it off while the two lads and the two women ran out in search of the absentees. They still had hopes that the trainer had for some reason taken out the horse for early exercise, but on ascending the knoll near the house, from which all the neighbouring moors were visible, they not only could see no signs of the missing favourite, but they perceived something which warned them that they were in the presence of a tragedy.

¶35 “About a quarter of a mile from the stables John Straker’s overcoat was flapping from a furze-bush. Immediately beyond there was a bowl-shaped depression in the moor, and at the bottom of this was found the dead body of the unfortunate trainer. His head had been shattered by a savage blow from some heavy weapon, and he was wounded on the thigh, where there was a long, clean cut, inflicted evidently by some very sharp instrument. It was clear, however, that Straker had defended himself vigorously against his assailants, for in his right hand he held a small knife, which was clotted with blood up to the handle, while in his left he clasped a red and black silk cravat, which was recognised by the maid as having been worn on the preceding evening by the stranger who had visited the stables.

¶36 “Hunter, on recovering from his stupor, was also quite positive as to the ownership of the cravat. He was equally certain that the same stranger had, while standing at the window, drugged his curried mutton, and so deprived the stables of their watchman.

¶37 “As to the missing horse, there were abundant proofs in the mud which lay at the bottom of the fatal hollow that he had been there at the time of the struggle. But from that morning he has disappeared, and although a large reward has been offered, and all the gypsies of Dartmoor are on the alert, no news has come of him. Finally, an analysis has shown that the remains of his supper left by the stable-lad contain an appreciable quantity of powdered opium, while the people at the house partook of the same dish on the same night without any ill effect.

¶38 “Those are the main facts of the case, stripped of all surmise, and stated as baldly as possible. I shall now recapitulate what the police have done in the matter.

¶39 “Inspector Gregory, to whom the case has been committed, is an extremely competent officer. Were he but gifted with imagination he might rise to great heights in his profession. On his arrival he promptly found and arrested the man upon whom suspicion naturally rested. There was little difficulty in finding him, for he inhabited one of those villas which I have mentioned. His name, it appears, was Fitzroy Simpson. He was a man of excellent birth and education, who had squandered a fortune upon the turf, and who lived now by doing a little quiet and genteel book-making in the sporting clubs of London. An examination of his betting-book shows that bets to the amount of five thousand pounds had been registered by him against the favourite.

¶40 “On being arrested he volunteered the statement that he had come down to Dartmoor in the hope of getting some information about the King’s Pyland horses, and also about Desborough, the second favourite, which was in charge of Silas Brown at the Mapleton stables. He did not attempt to deny that he had acted as described upon the evening before, but declared that he had no sinister designs, and had simply wished to obtain first-hand information. When confronted with his cravat, he turned very pale, and was utterly unable to account for its presence in the hand of the murdered man. His wet clothing showed that he had been out in the storm of the night before, and his stick, which was a Penang-lawyer weighted with lead, was just such a weapon as might, by repeated blows, have inflicted the terrible injuries to which the trainer had succumbed.

¶41 “On the other hand, there was no wound upon his person, while the state of Straker’s knife would show that one at least of his assailants must bear his mark upon him. There you have it all in a nutshell, Watson, and if you can give me any light I shall be infinitely obliged to you.”

¶42 I had listened with the greatest interest to the statement which Holmes, with characteristic clearness, had laid before me. Though most of the facts were familiar to me, I had not sufficiently appreciated their relative importance, nor their connection to each other.

¶43 “Is it not possible,” I suggested, “that the incised wound upon Straker may have been caused by his own knife in the convulsive struggles which follow any brain injury?”

¶44 “It is more than possible; it is probable,” said Holmes. “In that case one of the main points in favour of the accused disappears.”

¶45 “And yet,” said I, “even now I fail to understand what the theory of the police can be.”

¶46 “I am afraid that whatever theory we state has very grave objections to it,” returned my companion. “The police imagine, I take it, that this Fitzroy Simpson, having drugged the lad, and having in some way obtained a duplicate key, opened the stable door and took out the horse, with the intention, apparently, of kidnapping him altogether. His bridle is missing, so that Simpson must have put this on. Then, having left the door open behind him, he was leading the horse away over the moor, when he was either met or overtaken by the trainer. A row naturally ensued. Simpson beat out the trainer’s brains with his heavy stick without receiving any injury from the small knife which Straker used in self-defence, and then the thief either led the horse on to some secret hiding-place, or else it may have bolted during the struggle, and be now wandering out on the moors. That is the case as it appears to the police, and improbable as it is, all other explanations are more improbable still. However, I shall very quickly test the matter when I am once upon the spot, and until then I cannot really see how we can get much further than our present position.”

