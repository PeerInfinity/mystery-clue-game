# Silver Blaze, read slowly: an annotated attempt to solve it ahead of Holmes

Status: PILOT, ¶0–¶92 (from Baker Street through the villa, stopping before the hollow). Written 2026-10-15.
The rest of the story waits until the granularity and the tags below are agreed.

## What this is

A record of the thoughts a careful reader has while reading the story and trying to make each deduction
before Holmes announces it. Each thought is tied to the paragraph that makes it possible. Using it as a spec,
we can (1) design player actions that match those thoughts, and (2) check the case format against every line
(covered, partial, missing) instead of only against Holmes's route.

The annotation is written without reference to the case files (`claims.json`, `knowledge.json`, ...). That is
deliberate: it should describe the reader, not the format we already have.

### The honesty problem

I am not a first-time reader: I know how the story ends. So this is a disciplined reconstruction, not a
transcript. The rules I followed:

- A thought may use only what the text has disclosed up to its paragraph, plus background knowledge a reader of
  1892 or today plausibly has. The background is always named.
- Every thought carries a **confidence** a reader could justify at that point: *weak* (a flag, an itch),
  *fair* (a live hypothesis worth acting on), *strong* (would bet on it).
- Where my knowledge of the ending probably makes a thought easier than it would be on a first reading, it
  carries **⚠ hindsight** and a note on what a first-time reader would need in order to have it.
- Wrong turns are recorded and labelled as wrong turns, because a real reader makes them and the game has to
  give them somewhere to go.
- Where Holmes later states the same step, the thought points to the paragraph (`→ ¶218`), so this reading can
  be lined up with his route.

A real think-aloud reading by someone who doesn't know the story would be the best check on this
reconstruction.

### Paragraph numbers

`¶N` is the 0-based paragraph index used by `engine/story.js` (story.txt split on blank lines), the same
numbering as the reveal and foreshadow logs. Scene ids are those of `case.json`.

### Kinds of thought

| Tag | What the reader is doing |
|---|---|
| RECORD | Putting a fact into the picture of Monday night. Recorded only when it shapes what follows. |
| NOTICE | Flagging a detail that a normal version of this story wouldn't contain, or a thing that is missing. |
| QUESTION | Naming a blank. |
| HYPOTHESIS | Proposing one or more candidate explanations, held open. |
| INFER | A step that is as good as certain given its premises. |
| DEFAULT | A step through background knowledge that usually holds but has exceptions; the default and its exceptions are named. |
| WEIGH | Treating testimony as speech: who says it, did they see it or conclude it, could they know, would they lie. |
| TEST | Checking new information against a live hypothesis: supports, strains or refutes it. |
| RESIDUE | What a theory leaves unexplained. |
| PREDICT | What a hypothesis says we will find later. |
| GENRE | Reading the narrator's or Holmes's behaviour as a signal (the contract of the detective story). |
| WRONG TURN | A hypothesis the reader takes up and later drops, with the reason. |
| REVISE | An earlier item changes meaning. |

At the end of each scene, a **State of mind** block gives the reader's picture of the night: the timeline with
its gaps, the open questions, and the live hypotheses with what each one leaves unexplained.

---

## s01 Breakfast at Baker Street (¶1–¶7)

**¶4** "the singular disappearance of the favourite for the Wessex Cup, and the tragic murder of its trainer"
- RECORD: Two events: a horse gone and a trainer dead. *strong*
- DEFAULT: One incident, one culprit: whoever took the horse killed the trainer. (Default: two crimes at the same
  place and time share a cause. Exception: one event caused the other without a second human agent, or two
  agents acted independently.) *fair*. The reader holds this assumption without noticing it; it has to be
  broken later.

**¶6** "points about the case which promise to make it an absolutely unique one" / "your very excellent field-glass"
- GENRE: Holmes calls the case unique, so the obvious explanation is likely to be wrong. *weak*
- GENRE / PREDICT: An object asked for by name will be used later. Something will be watched from a distance.
  *weak*. (It is: the race, ¶199. It carries no inference: this is a flag that pays off only as scenery, and the
  game shouldn't reward it.)

### State of mind after s01
Only the headline is known. Background expectation: a valuable horse has been stolen by someone who killed the
trainer while doing it.

---

## s02 The train: the facts of the case (¶8–¶46)

**¶12** "the art of the reasoner should be used rather for the sifting of details than for the acquiring of fresh evidence"
- GENRE: The solution is in facts that are already public. Whatever Holmes is about to list is enough, so the
  recital deserves a careful reading. *fair* (Holmes later confirms "there were indications there", ¶216.)
- GENRE: "detach the framework of fact ... from the embellishments": some of what follows will be inference
  passed off as fact. Each item is to be sorted into *seen* or *concluded*. *fair*

**¶14** "I could not believe it possible that the most remarkable horse in England could long remain concealed ... I expected ... that his abductor was the murderer"
- NOTICE: The horse has been missing since Tuesday morning in thinly populated country and hasn't turned up.
  *strong*
- QUESTION: Where can a famous horse be hidden for days?
- HYPOTHESIS: (a) dead (in a pit or mine); (b) taken far away; (c) hidden in plain sight among other horses, at
  a stable, by someone who can keep a horse; (d) loose on the moor. Option (d) strains: a loose horse would have been seen. (c) needs a stable nearby.
  *fair* for (c) as the most interesting candidate.
- NOTICE: Holmes names "his abductor was the murderer" as part of a blunder. The two-crimes-one-culprit default
  (¶4) has just been flagged as an assumption. *weak*

**¶18** "many people who had the strongest interest in preventing Silver Blaze from being there at the fall of the flag"
- RECORD: Motive class: anyone who profits if the favourite doesn't run or doesn't win: people who bet against
  him, bookmakers, rival stables. *strong*
- INFER: That aim doesn't require taking the horse. Injuring, laming or hiding him until Tuesday would do.
  *fair*. This becomes a question once we learn the horse was led out (¶37): why move him at all? (→ Holmes ¶57.)

**¶19** The stable, the people and the map
- RECORD: Straker: former jockey, twelve years with the Colonel, "zealous and honest", married, no children, one
  maid, "comfortably off", lives in a villa 200 yards from the stables. Three lads with good characters, one on
  watch each night and two sleeping in the loft. Four horses. Invalid villas half a mile north, Tavistock two
  miles west, **Mapleton** (Lord Backwater, run by **Silas Brown**) two miles across the moor, gypsies.
- WEIGH: "zealous and honest" and "excellent characters" are reputation reported by the employer side, not
  observation. They weigh a little against suspecting these people, and no more. *weak*
- INFER: There are only two stables in reach: King's Pyland and Mapleton. Combined with ¶14(c), Mapleton is
  the one place nearby where a horse could be hidden among horses. *fair*
- ⚠ hindsight (low): "comfortably off" reads as a baseline that a later money detail can break. A first-time
  reader would probably register it only as setting.

**¶20** "his supper, which consisted of a dish of curried mutton. She took no liquid, as there was a water-tap ... it was the rule that the lad on duty should drink nothing else"
- RECORD: Stables locked at nine. Two lads eat in the trainer's kitchen; Ned Hunter stays on guard. The maid,
  Edith Baxter, carries his supper down with a lantern; it is very dark.
- NOTICE: The narrator names the dish. *weak* now; it becomes strong at ¶37.
- NOTICE: The no-liquid rule is spelled out in detail. The story is ruling out drink as a vehicle. *fair*
- INFER: If the lad is drugged later, the drug was in the food (the tap water is fixed and shared). *fair*
- QUESTION: Who handles the dish between the kitchen and the lad: whoever dishes it up, the maid on the walk,
  anyone at the window?

**¶21** The stranger: "gentlemanly bearing ... grey suit of tweeds ... a heavy stick with a knob ... extreme pallor ... nervousness"
- RECORD: Description of the stranger. The heavy stick is a possible weapon. *fair*
- NOTICE: No cravat in the description. (Small; it matters when the maid identifies a cravat at ¶35. Her later
  recognition is of something she didn't mention here.) *weak*

**¶22–¶24** "Can you tell me where I am? ... I understand that a stable-boy sleeps there alone every night ... See that the boy has this to-night"
- WEIGH: He claims to be lost, but knows the night arrangements of the stable. The "lost" story is a cover: he
  came on purpose. *strong*
- HYPOTHESIS: What is in the folded white paper? (a) a drug (folded paper is the classic powder wrapper);
  (b) money, a bribe; (c) a message. Most readers jump to (a). *fair* for (a), *fair* for (b).
- NOTICE: He asks the maid openly to pass the paper. A poisoner would hardly announce himself to a witness
  and offer her a dress. That favours (b). *weak*
- RECORD: The bribe offered to the maid is "the price of a new dress". (A dress returns at ¶84 and ¶91. The
  echo is an accident of the text; nothing follows from it, and the game shouldn't treat it as a clue.)

**¶25–¶26** "ran past him to the window ... It was already opened ... the corner of the little paper packet protruding from his closed hand"
- QUESTION: Where was the dish during this scene: in the maid's hands, on the sill, or already on Hunter's
  table? The text doesn't say. That is the window of opportunity on which the police theory depends.
- WEIGH: The maid "has sworn" that the packet was still in his closed hand at the window. Sworn and specific,
  so it is good evidence that he hadn't given the paper to anyone yet. *fair*

**¶28** "You've two horses in for the Wessex Cup—Silver Blaze and Bayard ... Is it a fact that ... the stable have put their money on him?"
- RECORD: King's Pyland has a second entry, Bayard.
- WEIGH: His questions fit a tout after information. *fair*
- HYPOTHESIS (seed): His question puts a pattern on the table: *people inside the stable betting against their
  own favourite*. If anyone at King's Pyland has money on another horse, they gain if Silver Blaze doesn't win.
  *weak*. The Bayard version is a wrong turn (Bayard is scratched and plays no part, ¶192), but the general
  pattern is the true motive (→ ¶220).
- ⚠ hindsight (medium): A first-time reader reads this line as colour from a tout. To use it, the reader has to
  know that a stable can lay against its own horse, which a racing-literate reader of 1892 would know.

**¶29** "rushed across the stable to unloose the dog ... the stranger was leaning through the window ... though he ran all round the buildings he failed to find any trace of him"
- RECORD: **The stable has a dog**, a hound that is set on intruders. *strong*. This is the fact the dog
  inference later rests on, and it arrives inside an action scene, which makes it easy to miss.
- INFER: While Hunter crossed the stable to the dog, the stranger was leaning in through the window with nobody
  watching him. If the dish was on the table, he had a few seconds of opportunity. *fair*
- DEFAULT: A guard dog barks at strangers and at anything unusual at night. (Exceptions: it knows the visitor;
  it is drugged, shut away or asleep.) *strong*
- PREDICT: If anyone came to the stable in the night, the dog should have made itself heard. *fair*

**¶30–¶31** "The boy locked the door before he left it. The window ... was not large enough for a man to get through."
- GENRE: Holmes praises the question and has had it checked by wire. Access to the stable matters. *fair*
- INFER: The stranger couldn't get in during the scene: the door was locked and the window too small. Whoever
  later got the horse out used a key or was let in. *strong*
- QUESTION: Who has a key? Hunter (on guard), the trainer (certainly), anyone with a copy.

**¶32** "Straker was excited ... vaguely uneasy ... Mrs. Straker, waking at one in the morning, found that he was dressing ... anxiety about the horses ... the rain pattering against the window ... pulled on his large mackintosh"
- RECORD: Timeline: about 9 the stranger; later the lads return and the message goes to Straker; **1 a.m.
  Straker goes out in heavy rain**, saying he means to check the horses.
- WEIGH: The only source is Mrs. Straker reporting what he said. She is probably honest, but the reason is his,
  not hers. *fair*
- NOTICE: "does not seem to have quite realized its true significance" is the narrator's (or Holmes's) gloss, not
  an observation. It frames Straker as slow to worry, yet four hours later he is worried enough to go out in the
  rain. *weak*

**¶33** "The door was open ... Hunter was sunk in a state of absolute stupor, the favourite's stall was empty, and there were no signs of his trainer."
- RECORD: 7 a.m.: door open, Hunter stupefied, horse gone, trainer gone.
- INFER: The door was opened from outside with a key, or from inside before Hunter went under. *strong* (¶31)

**¶34** "They had heard nothing during the night, for they are both sound sleepers ... They still had hopes that the trainer had for some reason taken out the horse for early exercise"
- NOTICE (an absence): **Nobody mentions the dog.** The stable had a dog that went for a stranger at nine
  (¶29). Someone came in the night and took out a horse, and the dog did nothing anyone heard. *fair* for a
  careful reader; most first-time readers miss it. This is the hardest notice in the story because nothing in
  the text points at the gap.
- WEIGH: "both sound sleepers" is the text's own defeater: the dog might have barked unheard. Being in the
  loft over the harness-room, the lads are close enough that loud barking would be hard to sleep through.
  The defeater weakens the inference without killing it. *fair*
- HYPOTHESIS: Why was the dog quiet? (a) drugged too: nothing says so, and only the lad's supper was analysed
  (¶37); (b) barked, and the sleepers slept: possible; (c) **the visitor was someone the dog knew**. *fair*
  for (c). (→ Holmes ¶219.)
- INFER: Straker went out at one, by his own account to the stables. Either he never got there, or he got there
  and **raised no alarm**: he didn't wake the lads in the loft above the harness-room about a drugged guard and an empty stall. A
  trainer who found that would wake the loft. *fair*
- GENRE: The household's first thought is that **the trainer took the horse out himself**. The story voices the
  true scenario in an innocent form and then buries it under the tragedy. *weak* (⚠ hindsight, medium: on a first
  reading this is just the household's hope.)

**¶35** "overcoat was flapping from a furze-bush ... His head had been shattered by a savage blow from some heavy weapon ... a long, clean cut ... very sharp instrument ... It was clear, however, that Straker had defended himself vigorously against his assailants ... a small knife, clotted with blood up to the handle ... a red and black silk cravat ... recognised by the maid"
- RECORD: Body in a hollow a quarter mile from the stables. Head: **a** savage blow (singular) from something
  heavy. Thigh: a clean cut from something very sharp. Small bloody knife in the right hand, the stranger's
  cravat in the left. The coat is on a bush at the rim.
- WEIGH: "It was clear ... defended himself vigorously against his assailants" is an inference written as fact,
  and it includes a plural, "assailants", that nothing observed supports. Re-file it as the police reading.
  *strong* (this is the "embellishment" ¶12 warned about).
- HYPOTHESIS: Whose blood is on the knife? (a) an assailant's; (b) Straker's own, from the thigh. The thigh cut
  is "clean" from "a very sharp instrument", and he is holding a very sharp instrument. (b) is *fair*.
- NOTICE: **The coat is off.** He set out in a mackintosh in heavy rain, and a quarter mile on the coat is on a
  bush. Torn off in a fight and blown there, or taken off? Men take off coats to work, not to stand in the
  rain. *weak* (wind not yet known; it strengthens at ¶94–¶96).
- HYPOTHESIS: The cravat in his hand: (a) torn from the assailant in the fight (police); (b) planted on the
  body; (c) Straker had it for some reason of his own. *weak* for each; (a) is the default.
- ⚠ HYPOTHESIS: The horse was in the hollow (¶37), and a single crushing blow to the head is what a horse's hoof
  does. (Background: horses kick, and a shod hoof can kill.) *weak*. Hindsight high: a first-time reader is
  primed for a human killer and rarely considers the horse before ¶212.

**¶36** "He was equally certain that the same stranger had, while standing at the window, drugged his curried mutton"
- WEIGH: Hunter **could not have seen** the drugging. If he had, he wouldn't have eaten the food. His "certainty"
  is a conclusion: the stranger was at the window, and later I was drugged. It comes from a man just out of an
  opium stupor. Downgrade it to "Hunter believes". *strong*
- WEIGH: The cravat identification, from the maid and from Hunter, is observation, two witnesses agreeing.
  Keep it as a fact: the cravat belongs to the stranger. *strong*

**¶37** "abundant proofs in the mud ... that he had been there at the time of the struggle ... powdered opium ... the people at the house partook of the same dish on the same night without any ill effect"
- RECORD: The horse was in the hollow. The drug was powdered opium, in the lad's portion only.
- INFER: The opium went in **after the lad's portion was separated from the household dish**: in the kitchen
  after dishing up, on the walk, or at the window. *strong* (→ Holmes ¶218, last sentences.)
- INFER: The horse was led out of a locked stable to the hollow: by a person with a key, and the bridle went
  with it (the bridle is mentioned at ¶46). *strong*
- REVISE: The curry (¶20) now matters. Background: powdered opium has a taste, and a curry is the dish that
  would hide it. So either the drugger was lucky in the menu, or **the drugger knew or chose the menu**.
  DEFAULT: a coincidence of exactly the right dish on exactly the right night is not to be believed when an
  explanation by intention is available. (Exception: the drugger had a tasteless method, or would have used
  another vehicle on another night.) *fair*, strong for a reader who knows opium is perceptible.
  (→ Holmes ¶218, "too monstrous a coincidence".)
- INFER from that: The stranger came with his packet already made up and couldn't have known what was for
  supper. The drugger is **of the household**: whoever chose or knew the menu and could get at the lad's portion.
  *fair*
- HYPOTHESIS: Who in the household? Straker, Mrs. Straker, the maid (who presumably cooks, and certainly carried
  the dish the whole way). The maid had the most opportunity. *fair* for "one of the three".
- WRONG TURN (available): **The maid did it**, bribed by the stranger, or on her own account. She held the dish
  from kitchen to window, and her account of the encounter is mostly her own testimony. What weighs against
  it: Hunter confirms the stranger's presence and manner; she ran from him; and the drugging is only half the
  night's work. Someone with a key took out the horse four hours later, and a maid leading a racehorse across the
  moor at one in the morning is a strained picture. The game should let a player hold this and drop it. (Holmes
  silently narrows to "Straker and his wife", ¶218, but leaves the opportunity question open.)
- NOTICE: The horse has been missing for days despite a large reward and every gypsy on the alert. This
  strengthens ¶14(c), that he is hidden among horses. *fair*

**¶38** "Those are the main facts of the case, stripped of all surmise"
- GENRE: They aren't stripped of surmise. Hunter's certainty (¶36) and the "assailants" (¶35) are both in the
  recital. The reader has just practised telling the two apart. (The game could make this sorting an explicit
  task.) *fair*

**¶39** "Inspector Gregory ... Were he but gifted with imagination ... the man upon whom suspicion naturally rested ... Fitzroy Simpson ... bets to the amount of five thousand pounds ... against the favourite"
- RECORD: Simpson is a ruined gentleman, a bookmaker, lodging in one of the invalid villas, with £5,000 laid
  against the favourite. Strong motive.
- GENRE: The detective without imagination arrests the obvious man in the first act. The obvious suspect is
  probably not the answer. *fair*

**¶40** "about Desborough, the second favourite, which was in charge of Silas Brown at the Mapleton stables ... When confronted with his cravat, he turned very pale ... His wet clothing ... his stick ... a Penang-lawyer weighted with lead ... by repeated blows"
- RECORD: Mapleton has the second favourite, Desborough. **Mapleton gains if Silver Blaze doesn't run.**
- INFER: Mapleton is now strong on three counts: motive (Desborough), the capacity to hide a horse among
  horses (¶14(c)), and nearness (two miles, ¶19). *fair* for "the horse is at, or was taken to, Mapleton".
  (→ Holmes ¶116, by a different route: horse instinct.)
- NOTICE: "by repeated blows" against ¶35's "a savage blow". The police theory about the weapon doesn't fit the
  wound as reported. *weak*. This kind of small mismatch is exactly what a careful reader collects.
- WEIGH: Wet clothing says he was out in the rain. He admits being on the moor that evening, and it says
  nothing about where he was at one a.m. Weak evidence. *fair*
- WEIGH: He goes pale and can't explain the cravat. That fits guilt, and it equally fits a man frightened to learn
  that something of his was found in a dead man's hand. Neutral. *fair*

**¶41** "there was no wound upon his person, while the state of Straker's knife would show that one at least of his assailants must bear his mark"
- TEST: Simpson has no wound. Either the knife's blood isn't Simpson's (so there was another assailant), or
  it is Straker's own. Since there is no second assailant in the evidence, ¶35(b) gains: **the blood is
  Straker's**. *fair*

**¶43–¶44** Watson: "caused by his own knife in the convulsive struggles"; Holmes: "It is more than possible; it is probable"
- TEST: The self-inflicted cut is accepted. Watson's *mechanism* (convulsions after the head blow) is one
  option; another is that he cut himself while using the knife. Keep the conclusion (his own knife, his own
  thigh) and leave the mechanism open. *fair*

**¶46** The police theory: "having drugged the lad, and having in some way obtained a duplicate key ... His bridle is missing ... met or overtaken by the trainer ... beat out the trainer's brains ... without receiving any injury ... either led the horse on to some secret hiding-place, or else it may have bolted"
- RECORD: The bridle is missing, so the horse was bridled and led by someone who knew how. *fair*
- RESIDUE, the police theory doesn't explain:
  1. the curry: a stranger lucky enough to come on the one night when the dish hid the drug (¶37);
  2. the dog's silence while a stranger took out the horse (¶34);
  3. a duplicate key nobody has found (¶31);
  4. why take the horse out at all if the aim was to stop him running (¶18);
  5. how a stranger hides the most famous horse in England (¶14);
  6. why the trainer, finding the horse gone and the lad drugged, chased after him alone without waking the
     lads or loosing the dog (¶34);
  7. one blow versus "repeated blows"; no wound on Simpson (¶40–¶41);
  8. the coat off in the rain (¶35).
  A theory with eight unexplained items is in trouble before anything contradicts it. *strong* that the
  police theory is wrong somewhere. Holmes himself calls it "improbable".
- HYPOTHESIS, the rival available now: **Straker himself took the horse out.** For it: he went out at one
  (¶32); he had a key (¶31); the dog knew him (¶34); his household served the curry (¶37); he raised no alarm
  (¶34); the coat was taken off for some job (¶35); the household's own first guess (¶34). Against it:
  reputation (¶19); no motive in evidence; and he is the one who died. *weak to fair*.
  ⚠ hindsight (high): Every premise is on the page, but holding the victim as the instigator is a big jump for a
  first-time reader. The game should make this jump possible without forcing it, which probably means letting the
  residue list push the player towards it.
- QUESTION, if Straker: why? The ¶28 seed (insiders betting against the favourite) is the only hint of a motive
  so far.
- QUESTION, if Straker: then who or what killed him? Simpson met on the moor? Someone else? The horse
  (¶35 ⚠)?

### State of mind after s02

**The night, as far as it is fixed:**

| Time | What | Source |
|---|---|---|
| 9:00 | stables locked; lads to the kitchen; Hunter on guard | Holmes's recital |
| just after 9 | the maid carries curried mutton down; the stranger stops her, offers the paper; at the window; the dog; he vanishes | maid, Hunter |
| ? | the opium goes into the lad's portion | inferred, after dishing up |
| later | lads return; message to Straker | Hunter |
| 1:00 | Straker dresses and goes out in heavy rain, in his mackintosh | Mrs. Straker |
| ? | the stable door is opened with a key; the horse is bridled and led out; the dog makes no sound anyone hears | inferred |
| ? | horse and Straker in the hollow a quarter mile off; Straker takes, or loses, his coat; one blow to the head; the thigh cut | inferred |
| ? | the horse leaves the hollow | — |
| 7:00 | door open, Hunter stupefied, stall empty | Mrs. Straker, lads |

**Open questions:** who drugged the lad; who opened the door; why the horse was taken out instead of injured
in the stall; what killed Straker; why the coat is off; why the dog was silent; where the horse is now.

**Live hypotheses:**
- *Police:* Simpson did all of it. Residue: eight items (¶46).
- *Mapleton:* someone from Mapleton took or now holds the horse. Explains the hiding; nothing yet on the night.
- *Inside:* someone of the household drugged the lad; Straker most likely took the horse. Explains the curry,
  the dog, the key and the missing alarm; lacks a motive.
- *Accident:* the horse killed Straker. Explains the single blow and the absence of a human killer; lacks any
  account of why they were in the hollow.

---

## s03 Tavistock and the drive with Gregory (¶47–¶69)

**¶52, ¶56** Gregory: "the evidence is purely circumstantial ... He has neither a knife nor any sign of a wound ... He lies under suspicion of having poisoned the stable-boy"
- WEIGH: Gregory's list is the police theory's evidence. Each item is one already weighed: motive (real),
  "under suspicion" of the poisoning (that is Hunter's conclusion, ¶36), out in the storm (weak, ¶40), heavy
  stick (fits weapon, not wound count), cravat (real, but how it got there is open). *fair*

**¶54** "We have quite come to the conclusion that he wounded himself in his fall."
- TEST: The police accept the thigh cut is self-inflicted. That removes the one piece of physical evidence
  that implied an assailant was hurt. *fair*

**¶57** Holmes: "Why should he take the horse out of the stable? If he wished to injure it why could he not do it there? Has a duplicate key been found ...? What chemist sold him the powdered opium? ... where could he, a stranger to the district, hide a horse ...? What is his own explanation as to the paper ...?"
- GENRE / TEST: Holmes's objections are items 3, 4 and 5 of the reader's residue list (¶46), plus the paper.
  A reader who built the list can check it against his. *strong*
- NOTICE: "If he wished to **injure** it". Holmes puts injuring the horse on the table as a natural aim.
  *weak* as a pointer.
- QUESTION, turned around: if whoever took the horse out *needed* to do it away from the stable, what was the
  reason? Something that couldn't be done within earshot of the loft, or needed light that would be seen.
  *weak*, and it waits for the knife (¶79) and the candle (¶78).

**¶58** "He says that it was a ten-pound note. One was found in his purse ... He has twice lodged at Tavistock ... The opium was probably brought from London. The key ... would be hurled away. The horse may be at the bottom of one of the pits"
- TEST: The paper was a ten-pound note, and a note was found on him. This supports ¶22(b), a bribe, over (a), the
  drug. The packet-equals-opium link, the strongest tie between Simpson and the drugging, weakens. *fair*
- WEIGH: Gregory answers each objection with a new assumption: he knows the district, opium from London, key
  thrown away, horse in a pit. None is evidence; each is a patch. A theory held up by patches is losing.
  *fair*

**¶60** "He acknowledges that it is his, and declares that he had lost it."
- WEIGH: Simpson says he lost the cravat. It can't be checked. If it's true, he most likely lost it on the moor
  that evening, near the stables, during his flight from the dog (¶29), and anyone who passed that way later
  could have picked it up. *fair* as a possibility.
- HYPOTHESIS: Who would pass the stables after nine and pick up a cravat? Someone walking to the stables, for
  instance a man going down at one in the morning. If Straker picked it up: why keep it? To lay it on the
  stranger later; or because it was useful as a strap or tie. *weak*. (→ Holmes ¶226 offers the second.)

**¶62** "a party of gypsies encamped on Monday night within a mile of the spot ... On Tuesday they were gone"
- WEIGH / DEFAULT: The period default is that wandering people clear out when there's trouble with the police,
  so their leaving is what one would expect either way and points at nothing. It is evidence that "fits" the
  police theory only because of when it happened. *fair*. (→ Holmes ¶114. This is a default the game should
  give in period terms and not endorse.)
- WRONG TURN (available): the gypsies took the horse. What weighs against it: they couldn't sell a horse that
  everyone knows; it would bring the police down on them; it explains nothing about the curry or the dog.

**¶64** "I have also examined every stable and out-house in Tavistock, and for a radius of ten miles."
- TEST: That apparently refutes ¶14(c), the horse hidden among horses within ten miles.
- HYPOTHESIS, to save (c): A search finds a horse only if the searchers *recognise* him. The horse is
  identified by sight, and his name says how: a *blaze* is a white mark down a horse's face. (Background:
  horse terminology.) A horse whose blaze has been dyed out is, to a searcher, one more bay in a stable full
  of bays. *weak to fair*, depending on whether the reader knows what a blaze is.
  ⚠ hindsight (medium): the disguise is confirmed only at ¶198.

**¶66** "Silas Brown, the trainer, is known to have had large bets upon the event, and he was no friend to poor Straker. We have, however, examined the stables, and there is nothing to connect him"
- RECORD: Brown has motive (large bets, Desborough second favourite) and is on bad terms with Straker.
- TEST: Mapleton was searched (see ¶64 on why that settles less than it seems). The Mapleton hypothesis
  survives, weakened. *fair*
- WRONG TURN (available): Silas Brown arranged the whole night, the drugging and the abduction, through
  Simpson or someone else. What weighs against it: ¶68, and the curry and dog arguments, which point inside
  King's Pyland, not to Mapleton.

**¶67–¶68** "And nothing to connect this man Simpson with the interests of the Mapleton stables?" "Nothing at all."
- GENRE: Holmes checks for a Simpson and Mapleton conspiracy and finds none. The reader can split the case:
  whoever *holds* the horse (maybe Mapleton) and whoever *took* him out (not necessarily the same) may be
  different people. *fair*
- REVISE: The default from ¶4 (one culprit for everything) is now openly in doubt. Taking the horse,
  killing the trainer and hiding the horse may be three separate stories.

**¶69–¶70** Holmes, "entirely absorbed in his own thoughts ... I was day-dreaming ... his hand was upon a clue, though I could not imagine where he had found it"
- GENRE: Holmes has the key insight **here, in the carriage**. Nothing new has reached him since the train
  except Gregory's answers. So the clue is in what the reader also has. This is the story's prompt to stop and
  re-read the facts. *strong*. (Holmes later says it was the curry, ¶216.)
- A reader who has already done ¶37 has the satisfaction of having been there first. A reader who hasn't should
  go back over the recital with this question: which fact would make a man jump?

### State of mind after s03

The police theory is losing on three fronts: Gregory has to patch it, the paper was money, and Simpson's
account of the cravat is unverified but coherent. The case looks like **three separate questions**: who led the
horse out (inside, probably Straker), what killed Straker (open, possibly the horse), and where the horse is
(possibly Mapleton, possibly disguised). The missing piece is a **motive for Straker**.

---

## s04 Straker's villa: the pockets and Mrs. Straker (¶70–¶92)

**¶72–¶75** "Straker was brought back here, I presume?" ... "He has been in your service some years, Colonel Ross?" "I have always found him an excellent servant."
- GENRE: Right after his insight, Holmes asks the dead man's employer about **the dead man's character**. If
  his insight implicated Straker, this is the question he would ask. *fair*. Watching what the detective
  checks is a legitimate reader technique, and an action the game could offer ("what is Holmes looking at?").

**¶78** "a box of vestas, two inches of tallow candle, an A.D.P. briar-root pipe, a pouch ... a silver watch ... five sovereigns in gold, an aluminium pencil-case, a few papers, and an ivory-handled knife with a very delicate, inflexible blade marked Weiss & Co., London"
- INFER: Five sovereigns and a gold-chained watch are still on the body. **Not a robbery**, and whoever was with
  him didn't search him. *strong*
- NOTICE: **A candle** as well as matches. Matches go with the pipe; a candle is for close work in the dark.
  He went out on a night walk with no lantern and with a candle. *weak to fair*
- PREDICT: If he lit the candle or a match in the hollow, there may be a spent match there. *weak*.
  (→ ¶102: Holmes finds the vesta "because I was looking for it".)

**¶79–¶81** "This is a very singular knife ... It is what we call a cataract knife ... A very delicate blade devised for very delicate work. A strange thing for a man to carry with him upon a rough expedition, especially as it would not shut in his pocket."
- NOTICE: A horse-trainer carrying a **surgeon's eye-knife**, on a night when he expected trouble. *strong*.
  This is the loudest clue in the story, and the story says so through Holmes.
- HYPOTHESIS: Why carry it? (a) the nearest weapon (Gregory, ¶82); (b) **to operate on something**, delicately,
  that night. The only patient within a quarter mile is the horse. *fair* for (b), strong once tied to ¶57
  ("injure it") and to the candle.
- DEFAULT: A man arming himself against intruders picks a stick, a poker or a gun, not a blade that won't fold
  and is made for precision. (Exception: panic.) *fair*
- ⚠ The specific operation, nicking a tendon under the skin to cause a lameness that leaves no trace (¶221), is
  specialist veterinary and racing knowledge. A reader doesn't need it: "he meant to injure the horse
  invisibly" is enough to carry the chain. The game should accept that general form.

**¶82** "The tip was guarded by a disk of cork which we found beside his body ... the knife had lain upon the dressing-table, and that he had picked it up as he left the room. It was a poor weapon, but perhaps the best that he could lay his hands on"
- WEIGH: Mrs. Straker's report (that the knife was on the dressing-table and he picked it up as he left) is
  observation and honest. So **he took it deliberately when he set out**. Gregory's "best he could lay his hands
  on" is an inference, and a weak one: a man of the house could lay his hands on much better. *fair*
- INFER: The cork guard was found by the body, so the blade was unsheathed in the hollow. Fits both readings
  (defending himself, or about to use it). Neutral. *fair*
- NOTICE: Why does a trainer keep a cataract knife on his dressing-table in the first place? *weak*

**¶84** "a milliner's account for thirty-seven pounds fifteen made out by Madame Lesurier, of Bond Street, to William Derbyshire. Mrs. Straker tells us that Derbyshire was a friend of her husband's and that occasionally his letters were addressed here."
- NOTICE: A dead man carrying **someone else's bill**. *strong*
- DEFAULT: People don't carry others' bills about; they have enough of their own. (Exception: settling it for
  a friend, a commission.) *fair*. (→ Holmes ¶225, the same default stated as worldly wisdom.)
- HYPOTHESIS: (a) Derbyshire is a friend, as Mrs. Straker says; (b) **Derbyshire is Straker**, under another name.
- WEIGH: Mrs. Straker passes on what her husband told her: honest, but second-hand. And "his letters were
  addressed here" is exactly how an alias gets its post. Her support for (a) is also support for (b). *fair*
  for (b).
- INFER (if b): A Bond Street milliner, £37 15s on one account, for a man described as "comfortably off" (¶19).
  There is a **lady** with expensive tastes who is not, or not openly, his wife. A second household costs
  money, and that is a motive. *fair*
- REVISE: ¶28's seed and the motive gap at ¶46 close: a man who needs money, who controls the favourite, can
  bet against him (through others) and make sure he loses. Background: a trainer laying against his own horse is
  a known turf fraud (→ Holmes ¶220). *fair*

**¶85** "Madam Derbyshire had somewhat expensive tastes ... Twenty-two guineas is rather heavy for a single costume."
- GENRE: Holmes reads the bill line by line, and the reader learns that one item is a costume of 22 guineas.
  The reader isn't shown the items. *weak*
- NOTICE: Holmes says *Madam* Derbyshire. He is reading the bill as a woman's clothes billed to a man.

**¶89–¶92** "Surely I met you in Plymouth at a garden-party ... You wore a costume of dove-coloured silk with ostrich-feather trimming." "I never had such a dress, sir." "Ah, that quite settles it."
- INFER: The dress Holmes describes must come from the bill (he has just read it, ¶85). He is testing whether
  the costume on Derbyshire's bill reached Mrs. Straker. *fair*. The reader has to supply that link: the text
  doesn't say the bill lists dove-coloured silk. (→ Holmes ¶225 confirms.) Fair-play note: the reader is shown
  the test and its result, not the evidence it was tested against.
- TEST: She never had it. Then the costume went to someone else. If Derbyshire is Straker (¶84 b), there is
  another woman. "That quite settles it": Holmes says the hypothesis is confirmed. *fair to strong*.
- WEIGH: Mrs. Straker denies the dress honestly, which is why the trick works: she doesn't know what is being
  asked.
- PREDICT: The milliner would recognise Straker's photograph as Derbyshire. *fair*. (→ Holmes asks for the
  photograph at ¶161; the result is at ¶229.)

### State of mind after s04: the checkpoint before the hollow

A reader who has made the steps above can now tell **the inside story** of Monday night with every link either
evidenced or a named default:

1. Straker, living a double life as Derbyshire with an expensive lady, needs money (¶84–¶92).
2. He arranges to profit from his own favourite losing (background: laying against one's own horse; ¶28 seed).
3. He plans to lame the horse invisibly with a cataract knife (¶79–¶82), out of earshot of the loft, so on the
   moor (¶57 turned round).
4. The household serves curried mutton; he puts opium in the lad's portion, where the curry hides it (¶20, ¶37).
5. At one he takes the knife and a candle, goes down, opens the door with his key; the dog knows him and is
   silent (¶29, ¶31, ¶34, ¶78).
6. On the way, or at the stable, he picks up the cravat Simpson lost in his flight (¶60; why he kept it is open).
7. He leads the horse to the hollow, out of sight of the house, takes off his coat to work (¶35), and lights a
   match or the candle (¶78).
8. Something kills him with one blow to the head; in falling he cuts his own thigh (¶35, ¶41–¶44). The best
   candidate for "something" is the horse (⚠): no human killer is needed, there was no robbery (¶78), and the
   horse was there (¶37).
9. The horse runs off; the likeliest place a loose horse or a man who found him would take him is the nearest
   stable, King's Pyland or Mapleton; not King's Pyland, so Mapleton, where a searcher could miss him if his
   blaze were hidden (¶14, ¶19, ¶40, ¶64, ¶66).

**Predictions a reader can make here, before Holmes checks them:**
- a spent match in the hollow (¶78 → ¶102);
- the coat laid on the bush, not blown there, if the night was still (¶35 → ¶94–¶96);
- the horse's tracks leading towards Mapleton (¶40, ¶66 → ¶116–¶119);
- the milliner recognising Straker's photograph (¶92 → ¶161, ¶229);
- Holmes advising that the horse stay entered, if the reader thinks Holmes has guessed he'll be found (→ ¶111);
- that Straker practised the operation on something first (→ ¶228, the sheep). This one is reachable only by
  asking "would a careful man do this cold?", and almost no first-time reader asks it. ⚠ hindsight (high).

**What remains uncertain at the checkpoint:** what killed Straker (horse or a second person); why he carried
the cravat; who has the horse now; whether the drugger was Straker or his wife (the curry argument names the
household; the dog and key arguments name the person who came at one).

**Difficulty, honestly estimated.** A typical first-time reader reaches step 1 to 2 (Derbyshire is Straker)
and step 4 (curry) only partly, and steps 5 and 8 almost never. A careful reader who plays it as a puzzle
reaches 1 to 7. Step 8 (the horse as killer) and the sheep are the two places where the story outruns nearly
everyone, and the game should treat them as expert-level, not as gates.

---

## Notes for the next pass (not yet a gap analysis)

Observations from writing the pilot that bear on the format and the game. To be turned into a proper gap
analysis once the whole story is annotated.

- **Most of the work is weighing and noticing, not deducing.** Of the strong moments above, the INFER steps are
  short and few. The decisive moves are NOTICE (the curry, the knife, the bill, the dog's absence), WEIGH
  (Hunter's "certainty", "assailants", Mrs. Straker's second-hand Derbyshire), and RESIDUE (the eight-item
  list at ¶46).
- **Testimony needs a grain finer than the claim.** Several "facts" are a mixture: ¶35 contains an observation
  (the body, the knife, the cravat) and an inference ("defended himself against his assailants") in one
  sentence. ¶36 holds an observation (the cravat) and a conclusion (the drugging) from the same witness.
- **Hypotheses are held in sets.** At ¶22 the paper is drug or money or message; at ¶34 the dog is drugged or
  slept-through or knew the visitor. The reader keeps the set open and lets later facts (¶58, ¶37) prune it.
- **The reader's theories are scenarios, and they split.** By ¶68 the one-culprit default breaks into three
  separate stories (who took the horse, what killed Straker, where the horse is). The reader carries a
  timeline with blanks (the table after s02) and fills blanks; the game's board could be that table.
- **Holmes's behaviour is evidence.** ¶69–¶70 (his insight in the carriage) and ¶74 (his question about
  Straker's character) are things a reader legitimately uses. Whether the game should model "what is the
  detective looking at" as an action is a design decision.
- **Some flags pay off only as scenery** (the field-glass, the dress echo at ¶24). A player who flags them
  shouldn't be penalised, but nothing should follow from them.
- **Wrong turns worth supporting:** the maid as drugger (¶37), the gypsies (¶62), Silas Brown as the
  organiser (¶66), the paper as opium (¶22). Each has a specific later fact that weakens it.
- **Earliest moment versus Holmes's moment.** The curry argument is possible at ¶37; Holmes has it at ¶69.
  Mapleton as the horse's place is possible at ¶40; Holmes reaches it at ¶116 by another route (horse instinct
  rather than motive and capacity). Two valid routes to the same conclusion, at different times.
