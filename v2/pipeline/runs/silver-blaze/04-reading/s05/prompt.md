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

Write the reading guide's annotations for scene s05 (Examining the hollow where the body was found), ¶93–¶112, paragraph by
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
{"bk":"bk.period_gypsies","text":"Readers of the period readily suspected roaming gypsies of horse-stealing.","exceptions":"It is a prejudice of the time, not evidence, and a large reward puts the same people on the side of finding the horse.","reader":"period"}
{"bk":"bk.drug_taste","text":"A drug mixed into food is easier to give unnoticed in a strongly flavoured dish than in a plain one, because most drugs have a taste or smell of their own.","exceptions":"Tasteless drugs; a very small dose; a careless or very hungry eater.","reader":"specialist"}
{"bk":"bk.keyholder","text":"The master of a stable or house normally keeps a key to it.","exceptions":"Keys may be held only by the servant on duty, or kept at a separate office.","reader":"all"}
{"bk":"bk.guard_dog","text":"A guard dog kept in a building gives the alarm when strangers come at night.","exceptions":"It is drugged, removed, or out of earshot, or it knows the visitor.","reader":"all"}
{"bk":"bk.self_wound","text":"A man struck hard on the head can thrash about convulsively and may hurt himself with anything he is holding.","reader":"specialist"}
{"bk":"bk.lost_item","text":"Something lost out of doors can be picked up and carried off by anyone who comes across it, so where it turns up later does not prove where its owner went.","exceptions":"It was lost only moments before, or in a place nobody else could reach.","reader":"all"}
{"bk":"bk.search_by_description","text":"Searchers look for what they have been told to look for, so a search finds a thing only if it still looks the way it was described.","exceptions":"Searchers who know the object closely, or who check it in ways that do not depend on appearance.","reader":"all"}
{"bk":"bk.tout_bribe","text":"Racing touts commonly paid stable-lads money for inside information on how the horses were running.","reader":"period"}
{"bk":"bk.cataract_knife","text":"A cataract knife is an eye-surgeon's instrument: a very thin, rigid, extremely sharp blade made for tiny, precise cuts, not for fighting.","reader":"specialist"}
{"bk":"bk.alias_mail","text":"When a man has letters for a 'friend' sent to his own house, the friend may be the man himself under another name.","exceptions":"A genuine friend who has no fixed address, or who has a real reason to receive post elsewhere.","reader":"all"}
{"bk":"bk.second_household","text":"A man secretly paying for costly women's clothes, under a name not his own, is often keeping a woman his wife does not know about, and such a life needs more money than his wages.","exceptions":"Gifts to a relative; a debt he is settling for someone else.","reader":"period"}
{"bk":"bk.light_outdoors","text":"Someone who carries a candle and matches at night means to need a small light somewhere, usually out of the wind and away from other lamps.","exceptions":"He carries them by habit, or to light a pipe.","reader":"all"}
{"bk":"bk.detective_feint","text":"A detective may make a false remark on purpose so that the answer reveals something the person would not volunteer.","reader":"all"}

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
{"id":"t18.1","para":18,"tag":"RECORD","profile":"typical","from":["t4.1"],"reads":"the betting being three to one on him","text":"Silver Blaze is heavily odds-on for the Wessex Cup."}
{"id":"t18.2","para":18,"tag":"RECORD","profile":"typical","from":[],"reads":"preventing Silver Blaze from being there at the fall of the flag next Tuesday","text":"The race is next Tuesday, about five days off. Whoever has the horse needs to keep it out of sight only until then."}
{"id":"t18.3","para":18,"tag":"INFER","subtype":"motive","confidence":"strong","profile":"typical","from":["t18.1","bk.favourite_motive"],"reads":"so that even at those odds enormous sums of money have been laid upon him","text":"Huge sums are bet on him, so the bookmakers who took those bets stand to lose heavily if he wins. Layers against the favourite are the obvious class of suspect."}
{"id":"t19.1","para":19,"tag":"RECORD","profile":"typical","from":["t10.1"],"reads":"has always shown himself to be a zealous and honest servant","text":"Straker is a former jockey with twelve years' good service to the Colonel. His character is reported as excellent."}
{"id":"t19.2","para":19,"tag":"RECORD","profile":"typical","from":[],"reads":"One of these lads sat up each night in the stable, while the others slept in the loft","text":"Routine: one lad sits up in the stable each night and the other two sleep in the loft above."}
{"id":"t19.3","para":19,"tag":"RECORD","profile":"typical","from":[],"reads":"lived in a small villa about two hundred yards from the stables","text":"Map: Straker's house is 200 yards from the stables and a cluster of villas lies half a mile north. Tavistock is two miles west, and Mapleton is two miles across the moor. Everything else is empty moor."}
{"id":"t19.4","para":19,"tag":"HYPOTHESIS","subtype":"opportunity","confidence":"weak","profile":"careful","from":["t19.3","t14.3"],"reads":"the larger training establishment of Mapleton, which belongs to Lord Backwater, and is managed by Silas Brown","text":"A rival training stable two miles off is one place where a horse could stand unnoticed among other horses, under cover. It answers the 'shut in a building' option of t14.3.","options":["Mapleton is hiding the horse","Mapleton is mere geography"]}
{"id":"t19.5","para":19,"tag":"DEFAULT","subtype":"period","confidence":"weak","profile":"typical","from":["bk.period_gypsies","t14.3"],"reads":"inhabited only by a few roaming gypsies","text":"A reader of the time would think at once of the gypsies as horse-thieves. That is a candidate the story itself puts on the map."}
{"id":"t20.1","para":20,"tag":"RECORD","profile":"typical","from":[],"reads":"the stables were locked up at nine o’clock","text":"The stables were locked at nine. Ned Hunter stayed inside on guard, and the other two lads went up to the house for supper."}
{"id":"t20.2","para":20,"tag":"RECORD","profile":"typical","from":[],"reads":"which consisted of a dish of curried mutton","text":"Edith Baxter, the maid, carried Hunter's supper down to the stables. It was curried mutton."}
{"id":"t20.3","para":20,"tag":"NOTICE","confidence":"weak","profile":"careful","from":["t20.2"],"reads":"it was the rule that the lad on duty should drink nothing else","text":"The duty lad drinks only tap water. So if anyone wanted to dose him, the food is the only channel. The menu is told in unusual detail."}
{"id":"t21.1","para":21,"tag":"RECORD","profile":"typical","from":[],"reads":"carried a heavy stick with a knob to it","text":"The stranger is gentlemanly, wears a grey tweed suit and cloth cap with gaiters, and carries a heavy knobbed stick. He is pale and nervous, and a little over thirty."}
{"id":"t24.1","para":24,"tag":"WEIGH","confidence":"fair","profile":"typical","from":["t19.2"],"reads":"I understand that a stable-boy sleeps there alone every night.","text":"He claimed to be lost (¶22), yet he knows the stable routine. The 'lost' story is a pretext, and he came to this stable on purpose."}
{"id":"t24.2","para":24,"tag":"HYPOTHESIS","confidence":"fair","profile":"typical","from":["t24.1"],"reads":"He took a piece of white paper folded up out of his waistcoat pocket.","text":"What is in the folded paper?","options":["A drug for the boy's supper","A note or bribe-offer for the boy","Money"]}
{"id":"t25.1","para":25,"tag":"RECORD","profile":"typical","from":[],"reads":"It was already opened, and Hunter was seated at the small table inside.","text":"Meals are handed in through a window that was already open, with Hunter at a table just inside."}
{"id":"t26.1","para":26,"tag":"WEIGH","confidence":"weak","profile":"careful","from":["t24.2"],"reads":"The girl has sworn that as he spoke she noticed the corner of the little paper packet protruding from his closed hand.","text":"This is sworn, but it comes from a frightened girl by lantern light, and it fits what everyone later came to believe. It shows the packet was still in his hand. It does not show what was done with it."}
{"id":"t28.1","para":28,"tag":"RECORD","profile":"typical","from":[],"reads":"You’ve two horses in for the Wessex Cup—Silver Blaze and Bayard.","text":"King's Pyland has two runners. The stranger asks whether the stable secretly prefers Bayard. That is a tout's question."}
{"id":"t29.1","para":29,"tag":"RECORD","profile":"typical","from":[],"reads":"rushed across the stable to unloose the dog","text":"There is a guard dog kept in the stable."}
{"id":"t29.2","para":29,"tag":"INFER","subtype":"opportunity","confidence":"fair","profile":"typical","from":["t25.1","t26.1"],"reads":"as she ran she looked back and saw that the stranger was leaning through the window","text":"While Hunter crossed the stable for the dog, the stranger was alone at the open window with the supper on the table inside. He had the chance to put something in it."}
{"id":"t30.1","para":30,"tag":"HYPOTHESIS","subtype":"opportunity","confidence":"weak","profile":"typical","from":["t29.1","t20.1"],"reads":"Did the stable-boy, when he ran out with the dog, leave the door unlocked behind him?","text":"Watson's idea: the stranger doubled back and slipped in, or someone else did, while Hunter was out with the dog and the door stood open."}
{"id":"t31.1","para":31,"tag":"DROP","confidence":"strong","profile":"typical","from":["t30.1"],"reads":"The boy locked the door before he left it.","relations":[{"type":"drops","target":"t30.1"}],"text":"The door was locked and the window is too small for a man to get through. The stranger did not get in that evening."}
{"id":"t31.2","para":31,"tag":"GENRE","subtype":"watch-detective","confidence":"fair","profile":"careful","from":["t31.1","bk.genre_detective_signals"],"text":"Holmes wired specially about the door. Access to the stable is a key point for him: whoever took the horse later had to get through a locked door."}
{"id":"t32.1","para":32,"tag":"RECORD","profile":"typical","from":[],"reads":"he pulled on his large mackintosh and left the house","text":"Straker went out at about 1 a.m. in the rain to check the stables, wearing a large mackintosh."}
{"id":"t32.2","para":32,"tag":"AGENT","confidence":"weak","profile":"careful","from":["t32.1"],"reads":"although he does not seem to have quite realized its true significance","text":"He is said not to have grasped the significance, yet he was uneasy enough to go out alone at one in the rain without waking the lads. Mrs Straker reports only the reason he gave her."}
{"id":"t33.1","para":33,"tag":"RECORD","profile":"typical","from":[],"reads":"Hunter was sunk in a state of absolute stupor","text":"At 7 a.m.: the stable door is open, Hunter is stupefied, the stall is empty and Straker is missing."}
{"id":"t33.2","para":33,"tag":"QUESTION","subtype":"opportunity","confidence":"strong","profile":"typical","from":["t31.1","t33.1","bk.keyholder"],"reads":"The door was open","text":"Locked at nine and open at seven: who opened it?","options":["Someone with a duplicate or stolen key","Straker, who would have a key as master of the stable","Hunter, before the drug took hold"]}
{"id":"t34.1","para":34,"tag":"RECORD","profile":"typical","from":[],"reads":"They had heard nothing during the night, for they are both sound sleepers.","text":"The lads in the loft heard nothing."}
{"id":"t34.2","para":34,"tag":"ABSENCE","confidence":"weak","profile":"careful","from":["t29.1","t34.1","bk.guard_dog"],"text":"A guard dog is kept in the stable, yet nothing woke the lads overhead. Did the dog make no noise while the horse was taken? The account does not say.","hindsight":"A first-time reader must connect the dog of ¶29 with the silence of ¶34. They are five paragraphs apart and the dog is never mentioned again."}
{"id":"t35.1","para":35,"tag":"RECORD","profile":"typical","from":[],"reads":"John Straker’s overcoat was flapping from a furze-bush","text":"Straker's coat was hanging on a furze-bush a quarter-mile from the stables. His body lay in a hollow just beyond."}
{"id":"t35.2","para":35,"tag":"AGENT","confidence":"fair","profile":"careful","from":["t32.1","t35.1"],"text":"It was a rainy night, yet his coat is off and hung on a bush. Why would he take it off?","options":["It was torn off in the struggle","He threw it aside to fight","He took it off for some task","Someone else put it there"]}
{"id":"t35.3","para":35,"tag":"RECORD","profile":"typical","from":[],"reads":"there was a long, clean cut, inflicted evidently by some very sharp instrument","text":"Wounds: his head was smashed by a heavy weapon, and he has a long clean cut on the thigh from a very sharp blade."}
{"id":"t35.4","para":35,"tag":"RECORD","profile":"typical","from":[],"reads":"in his right hand he held a small knife, which was clotted with blood up to the handle","text":"Straker held a small, bloodied knife in his right hand."}
{"id":"t35.5","para":35,"tag":"NOTICE","confidence":"weak","profile":"careful","from":["t35.4","t32.1"],"text":"Straker went out to check on horses carrying a knife. What kind of knife, and why did he have it? It is described only as 'small'."}
{"id":"t35.6","para":35,"tag":"RECORD","profile":"typical","from":["t21.1"],"reads":"in his left he clasped a red and black silk cravat","text":"In his left hand was a cravat that the maid identifies as the stranger's."}
{"id":"t36.1","para":36,"tag":"WEIGH","confidence":"strong","profile":"careful","from":["t29.2","t26.1"],"reads":"He was equally certain that the same stranger had, while standing at the window, drugged his curried mutton","text":"Hunter did not see the drugging. He concluded it. He was across the stable fetching the dog. It is a reasonable guess, but it is not observation."}
{"id":"t37.1","para":37,"tag":"RECORD","profile":"typical","from":[],"reads":"there were abundant proofs in the mud which lay at the bottom of the fatal hollow that he had been there at the time of the struggle","text":"The horse was in the hollow where Straker died, at the time of the struggle."}
{"id":"t37.2","para":37,"tag":"TEST","confidence":"weak","profile":"careful","from":["t19.5","t14.2"],"reads":"all the gypsies of Dartmoor are on the alert","relations":[{"type":"strains","target":"t19.5"}],"text":"With a large reward and the gypsies themselves searching, a gypsy theft looks less likely. So does a horse that is merely loose. The horse is hidden well, or in a place nobody searches."}
{"id":"t37.3","para":37,"tag":"RECORD","profile":"typical","from":["t20.2"],"reads":"contain an appreciable quantity of powdered opium","text":"Hunter's leftover curry contains powdered opium."}
{"id":"t37.4","para":37,"tag":"INFER","subtype":"opportunity","confidence":"strong","profile":"typical","from":["t37.3"],"reads":"the people at the house partook of the same dish on the same night without any ill effect","text":"The household ate the same dish unharmed, so the opium went into Hunter's portion only. It was added after his share was set apart: in the kitchen, on the path, at the window, or by Hunter himself."}
{"id":"t37.5","para":37,"tag":"DROP","confidence":"fair","profile":"typical","from":["t37.3","t33.2"],"relations":[{"type":"strains","target":"t33.2"}],"text":"The analysis confirms that Hunter really was drugged. That makes him an unlikely accomplice who opened the door."}
{"id":"t37.6","para":37,"tag":"PHYSICAL","confidence":"weak","profile":"expert","from":["t37.3","t20.2","bk.drug_taste"],"text":"Powdered opium has a taste of its own, and a curry would hide it. A stranger who met the maid by chance on the path could not have known the supper would be curry. Would a plain dish have given the drug away?","hindsight":"A first-time reader needs to know that opium has a noticeable taste, and to ask whether the poisoner chose the dish or was merely lucky. Few readers make this step unprompted."}
{"id":"t39.1","para":39,"tag":"GENRE","confidence":"fair","profile":"typical","from":["t12.1"],"reads":"Were he but gifted with imagination he might rise to great heights in his profession.","text":"Holmes calls Gregory competent but unimaginative. The 'natural' suspect the police chose may be the wrong one."}
{"id":"t39.2","para":39,"tag":"RECORD","profile":"typical","from":["t14.5","t19.3"],"reads":"he inhabited one of those villas which I have mentioned","text":"Simpson was lodging in the villas half a mile north and was found there easily."}
{"id":"t39.3","para":39,"tag":"INFER","subtype":"motive","confidence":"strong","profile":"typical","from":["t18.3","t39.2"],"reads":"bets to the amount of five thousand pounds had been registered by him against the favourite","text":"Simpson is a ruined gentleman who now makes a book, and he stands to lose £5,000 if Silver Blaze wins. He has a strong motive."}
{"id":"t40.1","para":40,"tag":"IDENTIFY","subtype":"merge","confidence":"strong","profile":"typical","from":["t21.1","t39.2"],"reads":"He did not attempt to deny that he had acted as described upon the evening before","text":"The stranger at the window is Simpson. He admits it."}
{"id":"t40.2","para":40,"tag":"RECORD","profile":"typical","from":["t19.3"],"reads":"Desborough, the second favourite, which was in charge of Silas Brown at the Mapleton stables","text":"Mapleton, two miles off and run by Silas Brown, has Desborough, the second favourite."}
{"id":"t40.3","para":40,"tag":"HYPOTHESIS","subtype":"motive","confidence":"weak","profile":"typical","from":["t40.2","t19.4","bk.favourite_motive"],"text":"Mapleton gains directly if Silver Blaze is out of the race. Silas Brown has both motive and a nearby stable to hide a horse in.","options":["Mapleton people took the horse","Mapleton is only a rival, not involved"]}
{"id":"t40.4","para":40,"tag":"WEIGH","confidence":"weak","profile":"careful","from":["t35.6","t40.1"],"reads":"he turned very pale, and was utterly unable to account for its presence in the hand of the murdered man","text":"Simpson does not deny the cravat is his. Turning pale fits guilt, and it also fits a man who sees he is in serious trouble. He did not deny being at the stable either, so where did he lose the cravat?"}
{"id":"t40.5","para":40,"tag":"RECORD","profile":"typical","from":["t21.1","t35.3"],"reads":"his stick, which was a Penang-lawyer weighted with lead","text":"Simpson's clothes were wet from the night's storm. His knobbed stick is lead-weighted and could have caused the head wound."}
{"id":"t41.1","para":41,"tag":"INFER","confidence":"fair","profile":"typical","from":["t35.4","t35.3"],"reads":"there was no wound upon his person","text":"Simpson is unwounded, though Straker's knife is bloody to the handle. Whose blood is on it? Either another assailant is wounded, or the blood came from somewhere else."}
{"id":"t41.2","para":41,"tag":"NOTICE","confidence":"weak","profile":"careful","from":["t41.1"],"reads":"one at least of his assailants must bear his mark upon him","text":"The account speaks of 'assailants', plural. It is unclear whether that is evidence or reporters' framing. Nothing shown so far requires more than one."}
{"id":"t43.1","para":43,"tag":"HYPOTHESIS","confidence":"fair","profile":"typical","from":["t41.1","t35.3","bk.self_wound"],"reads":"the incised wound upon Straker may have been caused by his own knife in the convulsive struggles which follow any brain injury","text":"Watson's idea: Straker cut his own thigh in convulsions after the blow. The blood on the knife would then be his own."}
{"id":"t44.1","para":44,"tag":"REVISE","confidence":"fair","profile":"typical","from":["t43.1","t41.1"],"reads":"It is more than possible; it is probable","relations":[{"type":"undercuts","target":"t41.1"}],"text":"If the cut is self-inflicted, Simpson's lack of a wound proves nothing, and the case against him gets stronger."}
{"id":"t46.1","para":46,"tag":"RECORD","profile":"typical","from":[],"reads":"His bridle is missing, so that Simpson must have put this on.","text":"The horse's bridle is missing. Someone led him out bridled."}
{"id":"t46.2","para":46,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"typical","from":["t29.2","t39.3","t40.5","t46.1"],"reads":"having in some way obtained a duplicate key","text":"Police theory: Simpson drugged Hunter, used a duplicate key, bridled and led off the horse, met Straker, killed him with the stick, and then either hid the horse or lost it when it bolted."}
{"id":"t46.3","para":46,"tag":"RESIDUE","confidence":"fair","profile":"careful","from":["t46.2","t33.2","t14.2","t35.2","t24.2","t37.6"],"reads":"I am afraid that whatever theory we state has very grave objections to it","relations":[{"type":"strains","target":"t46.2"}],"text":"The police theory leaves gaps. Where did Simpson get a duplicate key? Why would a man betting against the horse lead it away rather than just harm it in the stall? Where is it now, with Simpson under arrest? The 'bolted' branch conflicts with t14.2, since a loose horse would have been found. It does not explain Straker's coat on the bush, or why Simpson stayed at his lodging to be arrested."}
{"id":"t46.4","para":46,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"careful","from":["t33.2","t32.1","t37.1","t35.2","t35.5","bk.keyholder"],"text":"Another reading of the same facts: Straker himself opened the stable and took the horse out. He had a key, went out alone at one, died beside the horse, had his coat off and a knife in hand. If so, why, and who killed him?","options":["Straker took the horse out for an innocent reason and met the thief","Straker was himself acting against the horse","Straker followed someone who had taken it"],"hindsight":"A first-time reader must set aside Straker's reported good character and the account's framing of him as victim. They must then join the locked door, his key and his solitary night walk."}
{"id":"t46.5","para":46,"tag":"RESIDUE","confidence":"fair","profile":"careful","from":["t46.3","t40.3","t34.2","t6.1","t36.1"],"text":"Open at the scene's end: who opened the locked door, and where the horse is hidden. Whether the stranger really drugged the curry or Hunter only assumed it, and how a passer-by could rely on a dish that hides opium. Why the coat was off, what the knife was for, and whether the dog was silent. What part Mapleton and Silas Brown play. What Holmes wants the field-glass for. Simpson remains the police's suspect, and the theory is admitted to be improbable."}
{"id":"t47.1","para":47,"tag":"RECORD","profile":"typical","from":["t12.2"],"reads":"The latter was Colonel Ross, the well-known sportsman; the other, Inspector Gregory","text":"Ross and Gregory meet Holmes and Watson at Tavistock station. Gregory is the tall, fair man and Ross is the small, dapper one with an eye-glass."}
{"id":"t48.1","para":48,"tag":"RECORD","profile":"typical","from":["t47.1"],"reads":"I wish to leave no stone unturned in trying to avenge poor Straker and in recovering my horse","text":"Ross wants Straker avenged and the horse recovered. As owner of the favourite, he is someone who wants it to run."}
{"id":"t50.1","para":50,"tag":"RECORD","profile":"typical","from":[],"reads":"I am sorry to say that we have made very little progress","text":"Nothing new since Holmes's summary. The horse is still missing."}
{"id":"t51.1","para":51,"tag":"NOTICE","confidence":"weak","profile":"typical","from":["t48.1"],"reads":"Colonel Ross leaned back with his arms folded and his hat tilted over his eyes","text":"The owner takes no part in the talk about his own horse. He may doubt the detectives, or he may simply be a cold man. It is probably manner rather than clue."}
{"id":"t52.1","para":52,"tag":"RECORD","profile":"typical","from":["t46.2"],"reads":"I recognise that the evidence is purely circumstantial","text":"Gregory is sure Simpson is the man, and he admits the case is circumstantial. His theory matches the one Holmes predicted (t46.2)."}
{"id":"t54.1","para":54,"tag":"RECORD","profile":"typical","from":["t43.1"],"reads":"We have quite come to the conclusion that he wounded himself in his fall.","relations":[{"type":"supports","target":"t43.1"}],"text":"The police independently reached Watson's idea that the cut on Straker's thigh came from his own knife."}
{"id":"t56.1","para":56,"tag":"WEIGH","confidence":"fair","profile":"careful","from":["t36.1","t26.1"],"reads":"He lies under suspicion of having poisoned the stable-boy","text":"Even Gregory puts this only as 'suspicion'. It rests on Hunter's conclusion, not on anyone seeing it done: the maid saw a packet in his hand and then saw him lean through the window."}
{"id":"t57.1","para":57,"tag":"QUESTION","subtype":"turn-around","confidence":"fair","profile":"careful","from":["t46.3","t39.3"],"reads":"Why should he take the horse out of the stable? If he wished to injure it why could he not do it there?","text":"Holmes's objection, turned around: who would need the horse out on the open moor rather than in the stall? Someone who had to do something to it that could not be done inside, or someone who meant to take it away.","options":["A thief meaning to hide or sell it","Someone who needed it out of the stable for a reason not yet known","Someone leading it to a confederate"]}
{"id":"t57.2","para":57,"tag":"GENRE","subtype":"watch-detective","confidence":"fair","profile":"careful","from":["t37.6","bk.genre_detective_signals"],"reads":"What chemist sold him the powdered opium?","text":"Holmes asks where the opium came from. He treats it as something that can be traced. The opium links to the curry question (t37.6)."}
{"id":"t57.3","para":57,"tag":"QUESTION","confidence":"fair","profile":"typical","from":["t24.2"],"reads":"What is his own explanation as to the paper which he wished the maid to give to the stable-boy?","text":"The folded paper is still unexplained. Holmes wants Simpson's account of it."}
{"id":"t58.1","para":58,"tag":"RECORD","profile":"typical","from":["t24.2"],"reads":"He says that it was a ten-pound note. One was found in his purse.","text":"Simpson says the paper was a ten-pound note, and one was found in his purse."}
{"id":"t58.2","para":58,"tag":"TEST","confidence":"fair","profile":"careful","from":["t58.1","t24.2","t28.1","bk.tout_bribe"],"relations":[{"type":"strains","target":"t46.2"},{"type":"strains","target":"t36.1"}],"text":"A ten-pound note is exactly what a tout would offer a lad for a tip, and the note was still in his purse. That fits 'bribe for information' better than 'drug'. If the packet was money, the only evidence that he drugged the curry gets weaker. Hunter's belief in t36.1 was only a conclusion."}
{"id":"t58.3","para":58,"tag":"WEIGH","confidence":"fair","profile":"careful","from":["t57.1","t57.2"],"reads":"The opium was probably brought from London. The key, having served its purpose, would be hurled away.","text":"Gregory answers Holmes's points with guesses ('probably', 'would be', 'may be'), not with findings. No chemist, no key and no horse have been found. He has not answered the question of why the horse was taken out at all."}
{"id":"t58.4","para":58,"tag":"RECORD","profile":"typical","from":["t46.3"],"reads":"He has twice lodged at Tavistock in the summer.","relations":[{"type":"undercuts","target":"t46.3"}],"text":"Simpson has stayed in the district before. That weakens the 'stranger with nowhere to hide a horse' objection, though only a little."}
{"id":"t58.5","para":58,"tag":"HYPOTHESIS","confidence":"weak","profile":"typical","from":["t14.3","t58.3"],"reads":"The horse may be at the bottom of one of the pits or old mines upon the moor.","relations":[{"type":"strains","target":"t57.1"}],"text":"Gregory's fallback: the horse is dead in a mine-shaft. That would explain why it has not been found. But a man who wanted it dead could have done it in the stall, so it does not answer why it was led out.","options":["The horse is dead in a pit","The horse is alive and hidden"]}
{"id":"t60.1","para":60,"tag":"RECORD","profile":"typical","from":["t40.4"],"reads":"He acknowledges that it is his, and declares that he had lost it.","text":"Simpson admits the cravat is his and says he lost it."}
{"id":"t60.2","para":60,"tag":"HYPOTHESIS","confidence":"weak","profile":"careful","from":["t60.1","t35.6","t29.2","bk.lost_item"],"text":"If he lost it that evening near the stable, someone else could have had it. Its presence in Straker's hand would then not place Simpson at the hollow.","options":["Simpson lies, and Straker tore it from him in the fight","It was lost near the stable or on the moor, and Straker or someone else picked it up","Someone used it deliberately to point at Simpson"]}
{"id":"t62.1","para":62,"tag":"RECORD","profile":"typical","from":[],"reads":"a party of gypsies encamped on Monday night within a mile of the spot where the murder took place. On Tuesday they were gone.","text":"Gypsies camped within a mile on the night of the murder and had left by Tuesday."}
{"id":"t62.2","para":62,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"typical","from":["t62.1","t19.5","t46.2","bk.period_gypsies"],"reads":"might he not have been leading the horse to them when he was overtaken, and may they not have him now?","text":"Gregory's new theory: Simpson led the horse out to hand it to the gypsies, who have it now. That would explain both why it was taken out and where it went.","options":["Gypsies have the horse with Simpson's connivance","Gypsies took it on their own","The gypsies are unconnected"]}
{"id":"t62.3","para":62,"tag":"WEIGH","confidence":"weak","profile":"careful","from":["t62.1","t37.2","bk.period_gypsies"],"relations":[{"type":"strains","target":"t62.2"}],"text":"Their leaving proves little. A camp near a murder, with gypsies the first to be suspected, has every reason to move on. Nothing yet links them to Simpson or to the horse, and the reward argues against their hiding it."}
{"id":"t63.1","para":63,"tag":"GENRE","subtype":"watch-detective","confidence":"weak","profile":"careful","from":["t62.2"],"reads":"It is certainly possible.","text":"Holmes 'pricked up his ears' at the new element and then answers flatly. The gypsy theory does not seem to engage him."}
{"id":"t64.1","para":64,"tag":"TEST","confidence":"weak","profile":"careful","from":["t14.3","t19.4","bk.search_by_description","bk.horse_conspicuous"],"reads":"I have also examined every stable and out-house in Tavistock, and for a radius of ten miles.","relations":[{"type":"strains","target":"t19.4"}],"text":"Every stable within ten miles has been searched. That counts against 'shut in a building nearby', unless the searchers were looking for a horse that no longer looks like Silver Blaze. The disguise option in t14.3 survives a search of this kind."}
{"id":"t65.1","para":65,"tag":"GENRE","subtype":"watch-detective","confidence":"fair","profile":"careful","from":["t40.3","t19.4","bk.genre_detective_signals"],"reads":"There is another training-stable quite close, I understand?","text":"Holmes brings up Mapleton himself, straight after the stable search. A stable two miles off is on his mind."}
{"id":"t66.1","para":66,"tag":"RECORD","profile":"typical","from":["t40.2","t40.3"],"reads":"Silas Brown, the trainer, is known to have had large bets upon the event, and he was no friend to poor Straker.","relations":[{"type":"supports","target":"t40.3"}],"text":"Silas Brown has large bets on the race and was on bad terms with Straker. He has motive against both the horse and the man."}
{"id":"t66.2","para":66,"tag":"WEIGH","confidence":"weak","profile":"careful","from":["t66.1","t64.1","bk.search_by_description"],"reads":"We have, however, examined the stables, and there is nothing to connect him with the affair.","text":"'Examined' and found nothing: but the police were looking for Silver Blaze as described, in a yard full of horses. The negative result is only as good as the search.","hindsight":"A first-time reader must apply the disguise option of t14.3 to Mapleton in particular, rather than accept the police's negative result."}
{"id":"t67.1","para":67,"tag":"GENRE","subtype":"watch-detective","confidence":"weak","profile":"careful","from":["t65.1","t39.3","t66.1"],"reads":"And nothing to connect this man Simpson with the interests of the Mapleton stables?","text":"Holmes checks whether the police's suspect and the rival stable are linked. He is considering more than one hand in the affair, or a different hand altogether."}
{"id":"t68.1","para":68,"tag":"INFER","confidence":"fair","profile":"careful","from":["t67.1"],"reads":"Nothing at all.","text":"The two motive-holders, Simpson and Brown, are not known to be connected. If both are involved, it is through some link not yet found. If only one is, the other's motive is a coincidence of the betting."}
{"id":"t68.2","para":68,"tag":"RESIDUE","confidence":"fair","profile":"careful","from":["t57.1","t58.2","t58.3","t60.2","t62.3","t64.1","t66.2","t46.4","t34.2","t6.1"],"text":"Open at the end of the drive: why the horse was led out rather than harmed in the stall. Whether Simpson drugged anything, now that the paper may have been a ten-pound note. Where the opium was bought, and how a passer-by could count on a dish that hides it. Who opened the locked door, since no duplicate key has been found and Straker had his own. How the cravat reached Straker's hand. Whether the gypsies matter. Whether the searches, Mapleton's included, would recognise the horse if it had been altered. Also still open: Straker's coat and knife, the dog's silence, and the field-glass."}
{"id":"t68.3","para":68,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"typical","from":["t46.2","t62.2","t40.3","t46.4","t58.5"],"text":"Standing pictures: (a) the police's, Simpson alone or with gypsies, with the horse hidden or dead in a pit; (b) Mapleton, where Silas Brown has the motive and a yard to hide a horse in, though nothing ties him to the night; (c) Straker himself took the horse out, and someone else killed him. None explains everything yet. (a) is the official theory and the weakest on why the horse left the stall.","options":["Simpson, with or without gypsies","Mapleton and Silas Brown","Straker's own errand, and an unknown killer"]}
{"id":"t69.1","para":69,"tag":"RECORD","profile":"typical","from":["t19.3"],"reads":"by a cluster of houses away to the westward which marked the Mapleton stables","text":"From Straker's villa, the stable out-building lies across a paddock and Mapleton can be seen on the skyline. The rival stable is in plain view across open moor."}
{"id":"t70.1","para":70,"tag":"GENRE","subtype":"watch-detective","confidence":"fair","profile":"typical","from":["bk.genre_detective_signals","t68.2"],"reads":"his hand was upon a clue, though I could not imagine where he had found it","text":"Holmes has his clue during the drive, before he has seen any physical evidence. So it comes from facts already told: Holmes's summary or Gregory's talk in the carriage. The reader has the same material and should re-read it."}
{"id":"t70.2","para":70,"tag":"GENRE","subtype":"re-read","confidence":"weak","profile":"careful","from":["t70.1","t68.2"],"text":"Which fact set him off? The last topics were the gypsies, the stable searches, Mapleton, and the lack of any link to Simpson. Earlier ones were the curry and the opium, the dog, and the locked door. Nothing yet tells which.","options":["Something in Gregory's conversation (gypsies, Mapleton, the searches)","A point from the original facts (curry, opium, dog, door)","The view of the moor and Mapleton itself"]}
{"id":"t74.1","para":74,"tag":"GENRE","subtype":"watch-detective","confidence":"weak","profile":"careful","from":["t19.1","t46.4"],"reads":"He has been in your service some years, Colonel Ross?","text":"Holmes's first questions at the house are about Straker himself: his body and his record of service. He is not asking about Simpson. The victim's character seems to be in question."}
{"id":"t75.1","para":75,"tag":"WEIGH","confidence":"weak","profile":"careful","from":["t74.1","t19.1"],"reads":"I have always found him an excellent servant.","text":"Ross can only vouch for what he saw at work. It is the same testimony as ¶19 and adds nothing about Straker's private life."}
{"id":"t78.1","para":78,"tag":"RECORD","profile":"typical","from":[],"reads":"There was a box of vestas, two inches of tallow candle","text":"Straker's pockets: matches, a candle stub, pipe and tobacco, watch, five sovereigns, a pencil-case, some papers, and an ivory-handled knife by Weiss & Co., London."}
{"id":"t78.2","para":78,"tag":"NOTICE","confidence":"weak","profile":"careful","from":["t78.1","t32.1","bk.light_outdoors"],"reads":"two inches of tallow candle","text":"A candle and matches, on a rainy night walk to a stable where the lad on duty would have a light. Did he expect to need a small light somewhere else, out on the moor? It may only be habit: he also carries a pipe, and the matches would serve that.","options":["He meant to need a light out of doors","Ordinary pocket contents of a pipe-smoker"]}
{"id":"t80.1","para":80,"tag":"RECORD","profile":"typical","from":["t35.4","bk.cataract_knife"],"reads":"It is what we call a cataract knife","text":"The bloodied knife from Straker's hand is a surgeon's cataract knife."}
{"id":"t81.1","para":81,"tag":"REVISE","confidence":"fair","profile":"careful","from":["t35.5","t80.1","bk.cataract_knife"],"reads":"A strange thing for a man to carry with him upon a rough expedition, especially as it would not shut in his pocket","relations":[{"type":"revises","target":"t35.5"}],"text":"The 'small knife' is a delicate surgical blade that cannot be folded. It is useless as a weapon and awkward to carry. Why would a trainer own it, and why take it out at one in the morning?"}
{"id":"t82.1","para":82,"tag":"HYPOTHESIS","confidence":"weak","profile":"typical","from":["t81.1"],"reads":"It was a poor weapon, but perhaps the best that he could lay his hands on at the moment.","text":"Gregory's and Mrs Straker's account: uneasy about touts, Straker grabbed the nearest blade from the dressing-table to defend himself.","options":["A hasty choice of weapon","He took it for some purpose he had in mind"]}
{"id":"t82.2","para":82,"tag":"WEIGH","confidence":"fair","profile":"careful","from":["t82.1","t81.1"],"reads":"The tip was guarded by a disk of cork which we found beside his body","relations":[{"type":"strains","target":"t82.1"}],"text":"A man snatching up a weapon in a hurry does not fit a cork over its tip. And a man in a sudden fight does not stop to take the cork off. The cork lying by the body suggests he had uncovered the blade on purpose, with time to spare. That fits use for a task better than self-defence. The dressing-table detail comes from the wife, who reports what she saw, not why he took it."}
{"id":"t82.3","para":82,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"careful","from":["t81.1","t82.2","t78.2","t35.2","t57.1","t46.4"],"text":"Put these together: a blade for a fine cut, a candle for a small light, the coat taken off, and the horse led out to a hollow rather than harmed in its stall. Was Straker meaning to do some delicate cutting to the horse himself, out of sight of the stable? It is only a pattern, and it is far from proved.","options":["Straker meant to injure the horse in some subtle way","Straker carried the knife for defence after all","The knife belongs to some other part of his private life"],"relations":[{"type":"supports","target":"t46.4"}],"hindsight":"A first-time reader must join four details spread across the story: the coat, the candle, the cork, and Holmes's question of why the horse was taken out. They must then imagine the trainer as the one who meant to harm the horse, against everything said of his character."}
{"id":"t84.1","para":84,"tag":"RECORD","profile":"typical","from":[],"reads":"a milliner’s account for thirty-seven pounds fifteen made out by Madame Lesurier, of Bond Street, to William Derbyshire","text":"In Straker's pocket is a Bond Street milliner's bill for £37 15s, made out to a William Derbyshire."}
{"id":"t84.2","para":84,"tag":"WEIGH","confidence":"fair","profile":"careful","from":["t84.1","bk.alias_mail"],"reads":"Derbyshire was a friend of her husband’s and that occasionally his letters were addressed here","text":"This is Mrs Straker's explanation, and it is what her husband told her. Letters for a 'friend' coming to Straker's own house, and a bill for that friend in Straker's own pocket, raise the question of whether 'William Derbyshire' is Straker himself.","options":["Derbyshire is a real friend","Derbyshire is Straker under another name"]}
{"id":"t85.1","para":85,"tag":"NOTICE","subtype":"calculate","confidence":"fair","profile":"careful","from":["t84.1","t19.3"],"reads":"Twenty-two guineas is rather heavy for a single costume.","text":"One dress at 22 guineas (£23 2s) makes up most of a £37 bill. That is a huge sum next to a trainer's wages. Straker is described as 'comfortably off' (¶19), yet these clothes belong to a much richer world."}
{"id":"t85.2","para":85,"tag":"GENRE","subtype":"watch-detective","confidence":"fair","profile":"careful","from":["t85.1","bk.genre_detective_signals"],"reads":"However there appears to be nothing more to learn","text":"Holmes reads the bill closely, item by item, then says there is 'nothing more to learn'. He also says 'Madam Derbyshire', supposing a woman behind the name. The offhand dismissal is itself a signal."}
{"id":"t87.1","para":87,"tag":"SET ASIDE","profile":"typical","from":[],"reads":"Have you got them? Have you found them?","text":"Mrs Straker's grief and her 'them' (the killers, or the horse as well) reflect the general belief in several attackers. It is no evidence of who they were."}
{"id":"t89.1","para":89,"tag":"GENRE","subtype":"watch-detective","confidence":"fair","profile":"careful","from":["t85.2","bk.detective_feint"],"reads":"Surely I met you in Plymouth at a garden-party some little time ago, Mrs. Straker?","text":"Holmes has just come down from London. A claimed meeting at a Plymouth garden-party, straight after he studied a dress bill, looks like a feint rather than a real memory."}
{"id":"t91.1","para":91,"tag":"INFER","confidence":"fair","profile":"careful","from":["t89.1","t84.1"],"reads":"You wore a costume of dove-coloured silk with ostrich-feather trimming.","text":"He describes an expensive costume, very likely the one on the bill. The question is really: does Mrs Straker own the dresses Straker was paying for?"}
{"id":"t92.1","para":92,"tag":"TEST","confidence":"fair","profile":"careful","from":["t91.1","t84.2","bk.second_household"],"reads":"I never had such a dress, sir","relations":[{"type":"strains","target":"t84.2"}],"text":"She has never had such a dress. So the costly clothes on the bill in her husband's pocket went to some other woman. This is a test of whether she owns them, not proof of the alias, but the innocent 'friend' story is now harder to keep. Possible reading: Straker, as 'William Derbyshire', was paying for a second woman and needed more money than his wages.","options":["The friend is real and Straker only carried the bill","Straker kept a woman under the name Derbyshire","Mrs Straker is lying about the dress"]}
{"id":"t92.2","para":92,"tag":"IDENTIFY","subtype":"merge","confidence":"weak","profile":"careful","from":["t92.1","t84.2","bk.alias_mail"],"text":"Working identification: William Derbyshire = John Straker. Holmes's questions seem to point this way, but no handwriting, address or witness has yet confirmed it.","hindsight":"A first-time reader must link the bill, the 'friend' whose letters come to the house, and Holmes's garden-party feint. They must take the feint as a test rather than a social slip."}
{"id":"t92.3","para":92,"tag":"HYPOTHESIS","subtype":"motive","confidence":"weak","profile":"careful","from":["t92.1","t92.2","bk.favourite_motive","t82.3"],"relations":[{"type":"supports","target":"t46.4"}],"text":"If Straker led a costly double life, he had a reason to want money from the race. He could get it by betting against his own favourite and making sure it lost. That would supply the missing motive for picture (c) in t68.3. The case against Simpson does not require any of this."}
{"id":"t92.4","para":92,"tag":"RESIDUE","confidence":"fair","profile":"careful","from":["t70.2","t82.3","t92.3","t68.2","t66.2","t34.2","t6.1","t60.2"],"text":"Open at the end of the scene: what clue struck Holmes in the carriage. Why Straker carried a cork-guarded cataract knife and a candle, and took the cork off. Whether Derbyshire is Straker and who wears the dresses. If Straker was working against the horse, who killed him and where the horse is now. Still carried over: the cravat in his hand, the curry and the opium, the dog's silence, the locked door, Mapleton, and the field-glass."}
{"id":"t92.5","para":92,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"careful","from":["t68.3","t82.3","t92.3","t62.2","t66.1"],"text":"Standing pictures after the house: (a) the police's, Simpson alone or with the gypsies. It is now further strained because the knife looks like a tool rather than a weapon. (b) Mapleton and Silas Brown, with the motive but nothing to tie them to the night. (c) Straker, in debt through a second household, took the horse out himself to injure it quietly, and met his death in the hollow. (c) has gained the most in this scene, but it does not yet say who struck the blow.","options":["Simpson, with or without gypsies","Mapleton and Silas Brown","Straker's own scheme, with the killer unknown"]}

## The story so far (this scene is ¶93–¶112)

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

¶47 It was evening before we reached the little town of Tavistock, which lies, like the boss of a shield, in the middle of the huge circle of Dartmoor. Two gentlemen were awaiting us in the station—the one a tall, fair man with lion-like hair and beard and curiously penetrating light blue eyes; the other a small, alert person, very neat and dapper, in a frock-coat and gaiters, with trim little side-whiskers and an eye-glass. The latter was Colonel Ross, the well-known sportsman; the other, Inspector Gregory, a man who was rapidly making his name in the English detective service.

¶48 “I am delighted that you have come down, Mr. Holmes,” said the Colonel. “The Inspector here has done all that could possibly be suggested, but I wish to leave no stone unturned in trying to avenge poor Straker and in recovering my horse.”

¶49 “Have there been any fresh developments?” asked Holmes.

¶50 “I am sorry to say that we have made very little progress,” said the Inspector. “We have an open carriage outside, and as you would no doubt like to see the place before the light fails, we might talk it over as we drive.”

¶51 A minute later we were all seated in a comfortable landau, and were rattling through the quaint old Devonshire city. Inspector Gregory was full of his case, and poured out a stream of remarks, while Holmes threw in an occasional question or interjection. Colonel Ross leaned back with his arms folded and his hat tilted over his eyes, while I listened with interest to the dialogue of the two detectives. Gregory was formulating his theory, which was almost exactly what Holmes had foretold in the train.

¶52 “The net is drawn pretty close round Fitzroy Simpson,” he remarked, “and I believe myself that he is our man. At the same time I recognise that the evidence is purely circumstantial, and that some new development may upset it.”

¶53 “How about Straker’s knife?”

¶54 “We have quite come to the conclusion that he wounded himself in his fall.”

¶55 “My friend Dr. Watson made that suggestion to me as we came down. If so, it would tell against this man Simpson.”

¶56 “Undoubtedly. He has neither a knife nor any sign of a wound. The evidence against him is certainly very strong. He had a great interest in the disappearance of the favourite. He lies under suspicion of having poisoned the stable-boy, he was undoubtedly out in the storm, he was armed with a heavy stick, and his cravat was found in the dead man’s hand. I really think we have enough to go before a jury.”

¶57 Holmes shook his head. “A clever counsel would tear it all to rags,” said he. “Why should he take the horse out of the stable? If he wished to injure it why could he not do it there? Has a duplicate key been found in his possession? What chemist sold him the powdered opium? Above all, where could he, a stranger to the district, hide a horse, and such a horse as this? What is his own explanation as to the paper which he wished the maid to give to the stable-boy?”

¶58 “He says that it was a ten-pound note. One was found in his purse. But your other difficulties are not so formidable as they seem. He is not a stranger to the district. He has twice lodged at Tavistock in the summer. The opium was probably brought from London. The key, having served its purpose, would be hurled away. The horse may be at the bottom of one of the pits or old mines upon the moor.”

¶59 “What does he say about the cravat?”

¶60 “He acknowledges that it is his, and declares that he had lost it. But a new element has been introduced into the case which may account for his leading the horse from the stable.”

¶61 Holmes pricked up his ears.

¶62 “We have found traces which show that a party of gypsies encamped on Monday night within a mile of the spot where the murder took place. On Tuesday they were gone. Now, presuming that there was some understanding between Simpson and these gypsies, might he not have been leading the horse to them when he was overtaken, and may they not have him now?”

¶63 “It is certainly possible.”

¶64 “The moor is being scoured for these gypsies. I have also examined every stable and out-house in Tavistock, and for a radius of ten miles.”

¶65 “There is another training-stable quite close, I understand?”

¶66 “Yes, and that is a factor which we must certainly not neglect. As Desborough, their horse, was second in the betting, they had an interest in the disappearance of the favourite. Silas Brown, the trainer, is known to have had large bets upon the event, and he was no friend to poor Straker. We have, however, examined the stables, and there is nothing to connect him with the affair.”

¶67 “And nothing to connect this man Simpson with the interests of the Mapleton stables?”

¶68 “Nothing at all.”

¶69 Holmes leaned back in the carriage, and the conversation ceased. A few minutes later our driver pulled up at a neat little red-brick villa with overhanging eaves which stood by the road. Some distance off, across a paddock, lay a long grey-tiled out-building. In every other direction the low curves of the moor, bronze-coloured from the fading ferns, stretched away to the sky-line, broken only by the steeples of Tavistock, and by a cluster of houses away to the westward which marked the Mapleton stables. We all sprang out with the exception of Holmes, who continued to lean back with his eyes fixed upon the sky in front of him, entirely absorbed in his own thoughts. It was only when I touched his arm that he roused himself with a violent start and stepped out of the carriage.

¶70 “Excuse me,” said he, turning to Colonel Ross, who had looked at him in some surprise. “I was day-dreaming.” There was a gleam in his eyes and a suppressed excitement in his manner which convinced me, used as I was to his ways, that his hand was upon a clue, though I could not imagine where he had found it.

¶71 “Perhaps you would prefer at once to go on to the scene of the crime, Mr. Holmes?” said Gregory.

¶72 “I think that I should prefer to stay here a little and go into one or two questions of detail. Straker was brought back here, I presume?”

¶73 “Yes; he lies upstairs. The inquest is to-morrow.”

¶74 “He has been in your service some years, Colonel Ross?”

¶75 “I have always found him an excellent servant.”

¶76 “I presume that you made an inventory of what he had in his pockets at the time of his death, Inspector?”

¶77 “I have the things themselves in the sitting-room, if you would care to see them.”

¶78 “I should be very glad.” We all filed into the front room and sat round the central table while the Inspector unlocked a square tin box and laid a small heap of things before us. There was a box of vestas, two inches of tallow candle, an A.D.P. briar-root pipe, a pouch of seal-skin with half an ounce of long-cut Cavendish, a silver watch with a gold chain, five sovereigns in gold, an aluminium pencil-case, a few papers, and an ivory-handled knife with a very delicate, inflexible blade marked Weiss & Co., London.

¶79 “This is a very singular knife,” said Holmes, lifting it up and examining it minutely. “I presume, as I see blood-stains upon it, that it is the one which was found in the dead man’s grasp. Watson, this knife is surely in your line?”

¶80 “It is what we call a cataract knife,” said I.

¶81 “I thought so. A very delicate blade devised for very delicate work. A strange thing for a man to carry with him upon a rough expedition, especially as it would not shut in his pocket.”

¶82 “The tip was guarded by a disk of cork which we found beside his body,” said the Inspector. “His wife tells us that the knife had lain upon the dressing-table, and that he had picked it up as he left the room. It was a poor weapon, but perhaps the best that he could lay his hands on at the moment.”

¶83 “Very possible. How about these papers?”

¶84 “Three of them are receipted hay-dealers’ accounts. One of them is a letter of instructions from Colonel Ross. This other is a milliner’s account for thirty-seven pounds fifteen made out by Madame Lesurier, of Bond Street, to William Derbyshire. Mrs. Straker tells us that Derbyshire was a friend of her husband’s and that occasionally his letters were addressed here.”

¶85 “Madam Derbyshire had somewhat expensive tastes,” remarked Holmes, glancing down the account. “Twenty-two guineas is rather heavy for a single costume. However there appears to be nothing more to learn, and we may now go down to the scene of the crime.”

¶86 As we emerged from the sitting-room a woman, who had been waiting in the passage, took a step forward and laid her hand upon the Inspector’s sleeve. Her face was haggard and thin and eager, stamped with the print of a recent horror.

¶87 “Have you got them? Have you found them?” she panted.

¶88 “No, Mrs. Straker. But Mr. Holmes here has come from London to help us, and we shall do all that is possible.”

¶89 “Surely I met you in Plymouth at a garden-party some little time ago, Mrs. Straker?” said Holmes.

¶90 “No, sir; you are mistaken.”

¶91 “Dear me! Why, I could have sworn to it. You wore a costume of dove-coloured silk with ostrich-feather trimming.”

¶92 “I never had such a dress, sir,” answered the lady.

¶93 “Ah, that quite settles it,” said Holmes. And with an apology he followed the Inspector outside. A short walk across the moor took us to the hollow in which the body had been found. At the brink of it was the furze-bush upon which the coat had been hung.

¶94 “There was no wind that night, I understand,” said Holmes.

¶95 “None; but very heavy rain.”

¶96 “In that case the overcoat was not blown against the furze-bush, but placed there.”

¶97 “Yes, it was laid across the bush.”

¶98 “You fill me with interest, I perceive that the ground has been trampled up a good deal. No doubt many feet have been here since Monday night.”

¶99 “A piece of matting has been laid here at the side, and we have all stood upon that.”

¶100 “Excellent.”

¶101 “In this bag I have one of the boots which Straker wore, one of Fitzroy Simpson’s shoes, and a cast horseshoe of Silver Blaze.”

¶102 “My dear Inspector, you surpass yourself!” Holmes took the bag, and, descending into the hollow, he pushed the matting into a more central position. Then stretching himself upon his face and leaning his chin upon his hands, he made a careful study of the trampled mud in front of him. “Hullo!” said he, suddenly. “What’s this?” It was a wax vesta half burned, which was so coated with mud that it looked at first like a little chip of wood.

¶103 “I cannot think how I came to overlook it,” said the Inspector, with an expression of annoyance.

¶104 “It was invisible, buried in the mud. I only saw it because I was looking for it.”

¶105 “What! You expected to find it?”

¶106 “I thought it not unlikely.”

¶107 He took the boots from the bag, and compared the impressions of each of them with marks upon the ground. Then he clambered up to the rim of the hollow, and crawled about among the ferns and bushes.

¶108 “I am afraid that there are no more tracks,” said the Inspector. “I have examined the ground very carefully for a hundred yards in each direction.”

¶109 “Indeed!” said Holmes, rising. “I should not have the impertinence to do it again after what you say. But I should like to take a little walk over the moor before it grows dark, that I may know my ground to-morrow, and I think that I shall put this horseshoe into my pocket for luck.”

¶110 Colonel Ross, who had shown some signs of impatience at my companion’s quiet and systematic method of work, glanced at his watch. “I wish you would come back with me, Inspector,” said he. “There are several points on which I should like your advice, and especially as to whether we do not owe it to the public to remove our horse’s name from the entries for the Cup.”

¶111 “Certainly not,” cried Holmes, with decision. “I should let the name stand.”

¶112 The Colonel bowed. “I am very glad to have had your opinion, sir,” said he. “You will find us at poor Straker’s house when you have finished your walk, and we can drive together into Tavistock.”

