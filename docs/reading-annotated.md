# Silver Blaze, read slowly: an annotated attempt to solve it ahead of Holmes

Status: PILOT, ¶0–¶92 (from Baker Street through the villa, stopping before the hollow). Written 2026-10-15;
moved to the extended tag set with ids, premises and two dates the same day. The rest of the story follows
once this format is agreed.

## What this is

A record of the thoughts a careful reader has while reading the story and trying to make each deduction before
Holmes announces it. Each thought is tied to the earliest paragraph that makes it possible. The document has two
uses: as a spec for player actions (the game should let a player perform every thought here), and as a yardstick
for the case format (every thought is covered, partial or missing).

The annotation is written without reference to the case files (`claims.json`, `knowledge.json`, ...). That is
deliberate: it should describe the reader, not the format we already have.

### The honesty problem

I am not a first-time reader: I know how the story ends. So this is a disciplined reconstruction, not a
transcript. The rules I followed:

- A thought may use only what the text has disclosed up to its paragraph, plus background knowledge, which is
  always named as a card (below).
- Every thought carries a **confidence** a reader could justify at that point: *weak* (a flag, an itch), *fair*
  (a live hypothesis worth acting on), *strong* (would bet on it).
- Where my knowledge of the ending probably makes a thought easier than it would be on a first reading, it
  carries **⚠** and a note on what a first-time reader would need in order to have it.
- Wrong turns are recorded: a HYPOTHESIS the reader takes up, then a DROP that cites the reason.

A real think-aloud reading by someone who doesn't know the story would be the best check on this
reconstruction.

## Notation

### Paragraphs and spans

`¶N` is the 0-based paragraph index used by `engine/story.js` (story.txt split on blank lines), the same
numbering as the reveal and foreshadow logs. Scene ids are those of `case.json`. A thought that reads the text
quotes the clause it reads (`reads "..."`). That quote, not the whole paragraph, is the thought's span.

### A thought

```
- `t35.6` **WEIGH** · *strong* · careful · from `t12.2` · Holmes ¶226 (contradicts)
  reads "It was clear, however, that Straker had defended himself vigorously against his assailants"
  The prose of the thought.
```

| Field | Meaning |
|---|---|
| id | `t<¶>.<n>`. The paragraph in the id is the thought's **earliest date**: the first paragraph at which every premise is available. Checkpoint thoughts at the end of a scene use the scene's last paragraph. |
| tag | The kind of move (table below), with a subtype after a dot where useful (`HYPOTHESIS·motive`). |
| confidence | *weak*, *fair*, *strong*. |
| profile | Who makes this move: **typical** (a first-time reader paying normal attention), **careful** (a reader playing it as a puzzle), **expert** (needs specialist knowledge, or a leap almost nobody makes). That makes three hint tiers and a difficulty setting. |
| `from` | The premises: thought ids and background cards (`bk.*`). All of them are needed. |
| relations | `supports`, `strains` (makes the target less likely), `refutes`, `undercuts` (attacks the link from the target's premises to its conclusion, not the conclusion itself), `revises` (changes what an earlier item means), `drops` (abandons a hypothesis). A target may name a member of a set: `t24.3 (drug)`. |
| Holmes date | `Holmes ¶N`: where Holmes (or the story) states or confirms the same step; `(contradicts)` where it overturns it; `Holmes —` where he never states it. The gap between the earliest date and Holmes's date is the window in which the reader can beat Holmes. RECORDs have no Holmes date. |
| ⚠ | Hindsight risk, with a note. |

### Tags

| Tag | Subtypes | What the reader is doing | Game action it suggests |
|---|---|---|---|
| RECORD | | Putting a fact from the text into the picture of Monday night. One fact per record, quoted at clause level. | Place a card on the timeline and map board. |
| NOTICE | ·calculate | Flagging a detail that a normal version of this story wouldn't contain. `·calculate`: the oddity shows only after arithmetic on stated figures. | Highlight a span and say which expectation it breaks. |
| ABSENCE | | Expecting something the text doesn't report. | File an expectation (set up earlier in the text) as "expected, not reported". |
| QUESTION | ·opportunity ·motive ·turn-around | Naming a blank. `·turn-around`: inverting a question to make it productive. | Pin a "?" card on a blank or a card. |
| HYPOTHESIS | ·opportunity ·motive ·scenario | Proposing a set of candidate explanations, held open. `·scenario`: a whole story of the night. | Put candidates on a blank; sets stay open until pruned. |
| INFER | | A step as good as certain given its premises. | Combine cards; the engine checks the step. |
| DEFAULT | ·period | A step through background knowledge that usually holds, with named exceptions. `·period`: a belief of 1892 that the game presents in period terms without endorsing it. | Combine cards under a rule card whose exceptions can later be played against it. |
| AGENT | | Reasoning about what a person in that position would do or would have done. | As DEFAULT, with a rule about people. |
| PHYSICAL | | Reasoning about what could physically happen. | As DEFAULT, with a rule about the world. |
| IDENTIFY | ·merge ·split | Two names or descriptions are one thing, or one thing is really two. | Merge two entity or event cards, or split one. |
| WEIGH | | Treating testimony as speech: saw versus concluded, could they know, would they lie. | Split a testimony card into its observed and concluded parts; set credibility. |
| SOURCE | | Tracing a "fact" back along its chain of reporting. | Show and annotate a card's chain of reporting (who heard it from whom). |
| TEST | | Checking new information against a live hypothesis. | Drag a fact onto a hypothesis: supports, strains or refutes. |
| RESIDUE | | Listing what a theory leaves unexplained. | Each scenario has a tray of unexplained items; the player argues items out of it. |
| PREDICT | | Saying what a hypothesis implies we'll find. | Seal a prediction; scored when the story reveals it. |
| TEST PLAN | | Choosing a check that would tell two hypotheses apart. | Name the check; scored when Holmes runs it, or when the story answers it. |
| GENRE | ·re-read ·watch-holmes | Reading the narrator's or Holmes's behaviour as a signal. `·re-read`: going back to earlier text with a new question. `·watch-holmes`: inferring from what the detective looks at. | A "this matters" card; a re-read action; a card saying Holmes is interested in X (worth less than reasoning from the evidence). |
| SET ASIDE | | Marking a detail as scenery. | Costs nothing; clears the board. |
| DROP | | Abandoning a hypothesis, citing why. (This is where wrong turns end; the game never calls them wrong turns.) | Retract a candidate with a reason card. |
| REVISE | | An earlier item changes meaning. | Re-tag a card's interpretation. |

### Background knowledge cards

| Card | Content | 1892 reader | Modern reader |
|---|---|---|---|
| `bk.one_culprit` | Two crimes at the same place and time share a cause and a culprit. Exceptions: one caused the other; two agents acted independently. | yes | yes |
| `bk.genre_obvious` | In a detective story the obvious suspect arrested in the first act is usually not the answer, and the unimaginative policeman is usually wrong. | yes | yes |
| `bk.genre_named_detail` | A detail the narrator spells out without need tends to matter. | yes | yes |
| `bk.famous_horse` | A famous racehorse is recognised on sight; a loose one on open country is soon seen. | yes | yes |
| `bk.drug_paper` | Powders, drugs among them, come folded in paper. | yes | yes |
| `bk.guard_dog` | A guard dog barks at strangers and at the unusual at night, not at people it knows. | yes | yes |
| `bk.alarm` | Someone who discovers a theft and a drugged guard raises the alarm. | yes | yes |
| `bk.opium_taste` | Powdered opium has a perceptible taste; a strongly spiced dish would hide it. | likely | partial |
| `bk.coincidence` | An exactly-right coincidence is not to be believed when an explanation by intention is available. | yes | yes |
| `bk.coat_work` | Men take a coat off to work, not to stand in the rain. | yes | yes |
| `bk.horse_kick` | A frightened horse kicks out behind; a shod hoof can kill a man with one blow. | yes | partial |
| `bk.blaze` | A *blaze* is a white mark down a horse's face; markings can be dyed out. | racing public | rare |
| `bk.lay_against` | An owner or trainer can bet against his own horse through agents and then stop it winning. | racing-literate | rare |
| `bk.weapon_choice` | A man arming himself against intruders takes a stick, a poker or a gun, not a precision blade that won't fold. | yes | yes |
| `bk.bills` | People don't carry other people's bills; they have enough of their own. | yes | yes |
| `bk.alias_post` | A man living under another name needs an address where that name's post can reach him. | yes | yes |
| `bk.milliner_prices` | A Bond Street milliner's costume of twenty-odd guineas is far beyond what a trainer's household spends on dress. | yes | needs the text's gloss (¶225) |
| `bk.gypsies` | Period belief: travellers clear out when there is trouble, to avoid the police, and couldn't sell a famous horse. | period | period (presented, not endorsed) |

---

## s01 Breakfast at Baker Street (¶1–¶7)

**¶4**
- `t4.1` **RECORD** · *strong* · typical
  reads "the singular disappearance of the favourite for the Wessex Cup, and the tragic murder of its trainer"
  Two events: a horse gone and a trainer dead.
- `t4.2` **DEFAULT** · *fair* · typical · from `t4.1`, `bk.one_culprit` · Holmes ¶14 (names it as part of a blunder)
  Whoever took the horse killed the trainer. The reader holds this without noticing it; it has to be broken
  later (`t68.3`).

**¶6**
- `t6.1` **GENRE** · *weak* · careful · from `bk.genre_obvious`
  reads "points about the case which promise to make it an absolutely unique one"
  Holmes calls the case unique, so the obvious explanation is likely to be wrong.
- `t6.2` **SET ASIDE** · typical
  reads "You would oblige me by bringing with you your very excellent field-glass."
  An object asked for by name, so a reader might expect it to matter. It is used only to watch the race (¶199)
  and carries no inference. A player who instead files it as a prediction shouldn't be penalised, and nothing
  should follow from it.

### State of mind after s01
Only the headline: a valuable horse stolen by someone who killed the trainer while doing it (`t4.2`).

---

## s02 The train: the facts of the case (¶8–¶46)

**¶10**
- `t10.1` **SET ASIDE** · typical
  reads "the telegraph posts upon this line are sixty yards apart, and the calculation is a simple one"
  Holmes's speed calculation shows his method and carries no case content.

**¶12**
- `t12.1` **GENRE** · *fair* · careful · Holmes ¶216
  reads "the art of the reasoner should be used rather for the sifting of details than for the acquiring of fresh evidence"
  The solution is in facts that are already public, so the recital that follows deserves a careful reading.
- `t12.2` **GENRE** · *fair* · careful
  reads "to detach the framework of fact—of absolute undeniable fact—from the embellishments of theorists and reporters"
  Some of what follows will be inference presented as fact; each item is to be sorted into seen or concluded.
  This licenses the WEIGH moves below.

**¶14**
- `t14.1` **RECORD** · *strong* · typical
  reads "I could not believe it possible that the most remarkable horse in England could long remain concealed"; "beyond the arrest of young Fitzroy Simpson nothing had been done"
  The horse has been missing since Tuesday morning in thinly populated country.
- `t14.2` **QUESTION** · typical · from `t14.1`
  Where can a famous horse be hidden for days?
- `t14.3` **HYPOTHESIS** · *fair* · careful · from `t14.2`, `bk.famous_horse`
  {dead, in a pit or mine; taken far away; **hidden among horses, at a stable**; loose on the moor}.
  `bk.famous_horse` strains "loose": he would have been seen. "At a stable" is the live candidate.
- `t14.4` **GENRE** · *weak* · careful · strains `t4.2`
  reads "his abductor was the murderer of John Straker"
  Holmes names the one-culprit assumption as part of his blunder.

**¶18**
- `t18.1` **RECORD** · *strong* · typical
  reads "he was the first favourite for the Wessex Cup"; "enormous sums of money have been laid upon him"
- `t18.2` **HYPOTHESIS·motive** · *strong* · typical · from `t18.1`
  reads "there were many people who had the strongest interest in preventing Silver Blaze from being there at the fall of the flag"
  Who gains if he doesn't run or win: {people who bet against him, bookmakers, rival stables}.
- `t18.3` **INFER** · *fair* · careful · from `t18.2` · Holmes ¶57
  That aim doesn't need the horse taken: injuring, laming or hiding him until Tuesday would do. This becomes a
  question once we learn the horse was led out (`t57.3`).

**¶19**
- `t19.1` **RECORD** · typical
  reads "a retired jockey"; "five years as jockey and for seven as trainer"; "a married man"; "no children, keeps one maid-servant, and is comfortably off"; "a small villa about two hundred yards from the stables"
  Straker. (⚠ low: "comfortably off" is the baseline `t84.7` breaks; a first-time reader files it as setting.)
- `t19.2` **RECORD** · typical
  reads "three lads"; "only four horses in all"; "One of these lads sat up each night in the stable, while the others slept in the loft"
- `t19.3` **RECORD** · typical
  reads "half a mile to the north there is a small cluster of villas"; "Tavistock itself lies two miles to the west"; "about two miles distant, is the larger training establishment of Mapleton ... managed by Silas Brown"; "a few roaming gypsies"
  The map.
- `t19.4` **WEIGH** · *weak* · careful
  reads "has always shown himself to be a zealous and honest servant"; "All three bore excellent characters"
  Reputation reported from the employer's side, not observation. It counts a little against suspecting these
  people, and no more.
- `t19.5` **INFER** · *fair* · careful · from `t19.3`, `t14.3` · supports `t14.3 (stable)` · Holmes ¶116
  Only two stables are in reach: King's Pyland and Mapleton. If the horse is hidden among horses nearby, it is at
  Mapleton.

**¶20**
- `t20.1` **RECORD** · *strong* · typical
  reads "the stables were locked up at nine o'clock"; "Two of the lads walked up to the trainer's house, where they had supper in the kitchen, while the third, Ned Hunter, remained on guard"
- `t20.2` **RECORD** · *strong* · typical
  reads "the maid, Edith Baxter, carried down to the stables his supper, which consisted of a dish of curried mutton"; "it was very dark"
- `t20.3` **RECORD** · typical
  reads "She took no liquid, as there was a water-tap in the stables, and it was the rule that the lad on duty should drink nothing else"
- `t20.4` **NOTICE** · *weak* · careful · from `t20.2`, `bk.genre_named_detail` · Holmes ¶216
  The narrator names the dish. Weak now; it becomes strong at `t37.6`.
- `t20.5` **NOTICE** · *fair* · careful · from `t20.3`, `bk.genre_named_detail`
  The no-liquid rule is spelled out in detail: the story is ruling out drink as a vehicle.
- `t20.6` **INFER** · *fair* · careful · from `t20.3`, `t20.5`
  If the lad is drugged, the drug was in the food.
- `t20.7` **QUESTION·opportunity** · careful · from `t20.2`
  Who handles the dish between the kitchen and the lad?

**¶21**
- `t21.1` **RECORD** · typical
  reads "a person of gentlemanly bearing, dressed in a grey suit of tweeds, with a cloth cap"; "carried a heavy stick with a knob to it"; "the extreme pallor of his face and ... the nervousness of his manner"
- `t21.2` **ABSENCE** · *weak* · expert · Holmes —
  The description has no cravat. The maid later recognises one (`t35.5`) that she didn't describe here. That is
  small and leads nowhere certain, but it is the kind of gap a careful reader logs.

**¶22–¶24**
- `t24.1` **RECORD** · typical
  reads "I had almost made up my mind to sleep on the moor"; "I understand that a stable-boy sleeps there alone every night"; "See that the boy has this to-night, and you shall have the prettiest frock that money can buy"; "a piece of white paper folded up"
- `t24.2` **AGENT** · *strong* · careful · from `t24.1` · Holmes —
  A lost man wouldn't know the stable's night arrangements. The "lost" story is a cover: he came on purpose.
- `t24.3` **HYPOTHESIS** · *fair* · typical · from `t24.1`, `bk.drug_paper`
  What is in the folded paper: {drug, money, message}. Most readers jump to the drug.
- `t24.4` **AGENT** · *weak* · careful · from `t24.1` · supports `t24.3 (money)`, strains `t24.3 (drug)`
  A poisoner would hardly ask a witness openly to pass the poison, and offer her a dress for it.
- `t24.5` **SET ASIDE** · careful
  reads "the price of a new dress"
  A dress returns at ¶84 and ¶91. The echo is an accident of the text and nothing follows from it.

**¶25–¶26**
- `t25.1` **QUESTION·opportunity** · careful · from `t20.7`
  reads "ran past him to the window through which she was accustomed to hand the meals"; "Hunter was seated at the small table inside"
  Where was the dish during this scene: in her hands, on the sill, or on Hunter's table? The text doesn't
  say. The police theory depends on the answer.
- `t26.1` **WEIGH** · *fair* · careful
  reads "The girl has sworn that as he spoke she noticed the corner of the little paper packet protruding from his closed hand"
  Sworn and specific: good evidence that he hadn't yet given the paper to anyone.

**¶28**
- `t28.1` **RECORD** · typical
  reads "You've two horses in for the Wessex Cup—Silver Blaze and Bayard"
- `t28.2` **WEIGH** · *fair* · typical · supports `t24.2`
  reads "Let me have the straight tip and you won't be a loser"
  His questions are those of a tout after information.
- `t28.3` **HYPOTHESIS·motive** · *weak* · expert · from `t28.1`, `bk.lay_against` · Holmes ¶220 (the general pattern)
  reads "Is it a fact that ... the stable have put their money on him?"
  His question puts a pattern on the table: people inside the stable betting against their own favourite.
  ⚠ medium: a first-time reader takes the line as a tout's colour; using it needs `bk.lay_against`. The
  Bayard-specific version leads nowhere (Bayard is scratched, ¶192); the general pattern is the true motive.

**¶29**
- `t29.1` **RECORD** · *strong* · careful
  reads "He sprang up and rushed across the stable to unloose the dog"; "Hunter rushed out with the hound"
  **The stable has a dog**, set on intruders. A typical reader passes over it inside the action; the dog
  inference later rests on it.
- `t29.2` **RECORD** · typical
  reads "as she ran she looked back and saw that the stranger was leaning through the window"; "though he ran all round the buildings he failed to find any trace of him"
- `t29.3` **INFER·opportunity** · *fair* · careful · from `t29.2`, `t25.1` · Holmes ¶36 (Hunter's version)
  While Hunter crossed the stable to the dog, the stranger was leaning in through the window with nobody
  watching him. If the dish was on the table, he had a few seconds of opportunity.
- `t29.4` **PREDICT** · *fair* · careful · from `t29.1`, `bk.guard_dog` · Holmes ¶219
  If anyone came to the stable in the night, the dog should have made itself heard.

**¶30–¶31**
- `t31.1` **RECORD** · *strong* · typical
  reads "The boy locked the door before he left it. The window ... was not large enough for a man to get through."
- `t31.2` **GENRE·watch-holmes** · *fair* · careful
  reads "The importance of the point struck me so forcibly that I sent a special wire"
  Access to the stable matters.
- `t31.3` **INFER** · *strong* · careful · from `t31.1` · Holmes ¶57
  The stranger couldn't get in during the scene. Whoever later took the horse used a key or was let in.
- `t31.4` **QUESTION·opportunity** · careful · from `t31.3`
  Who has a key: {Hunter, the trainer, anyone with a copy}?

**¶32**
- `t32.1` **RECORD** · typical
  reads "he sent a message to the trainer"; "Straker was excited at hearing the account"; "It left him, however, vaguely uneasy"
- `t32.2` **RECORD** · *strong* · typical
  reads "Mrs. Straker, waking at one in the morning, found that he was dressing"; "he intended to walk down to the stables to see that all was well"; "she could hear the rain pattering against the window"; "he pulled on his large mackintosh and left the house"
- `t32.3` **SOURCE** · *fair* · careful · from `t32.2`
  Chain of reporting: Straker's words → Mrs. Straker → police → papers → Holmes. What she saw (dressing at one,
  going out) is her own observation; the reason is Straker's statement, which she passes on in good faith.
- `t32.4` **WEIGH** · *weak* · expert · from `t32.1`
  reads "he does not seem to have quite realized its true significance"
  That is a gloss, not an observation. It frames Straker as slow to worry, yet four hours later he is worried
  enough to go out in the rain.

**¶33**
- `t33.1` **RECORD** · *strong* · typical
  reads "The door was open"; "Hunter was sunk in a state of absolute stupor, the favourite's stall was empty, and there were no signs of his trainer"
- `t33.2` **INFER** · *strong* · careful · from `t33.1`, `t31.1`
  The door was opened with a key, from outside or from inside before Hunter went under.

**¶34**
- `t34.1` **RECORD** · typical
  reads "They had heard nothing during the night, for they are both sound sleepers"
- `t34.2` **ABSENCE** · *fair* · careful · from `t29.1`, `t29.4`, `t33.2`, `t34.1` · Holmes ¶180–¶182, ¶219
  **Nobody mentions the dog.** Someone came in the night and took out a horse, and the dog did nothing anyone
  heard. Most first-time readers miss this. It is the hardest move in the story, because nothing in the text
  points at the gap.
- `t34.3` **WEIGH** · *fair* · careful · undercuts `t34.2`
  reads "for they are both sound sleepers"
  This is the text's own defeater: the dog might have barked unheard. But the lads sleep in the loft over the
  harness-room, close enough that loud barking would be hard to sleep through. It weakens `t34.2` without
  defeating it.
- `t34.4` **HYPOTHESIS** · *fair* · careful · from `t34.2` · Holmes ¶219
  Why was the dog quiet: {drugged too; barked unheard; **the visitor was someone the dog knew**}. Nothing says
  the dog was drugged (only the lad's supper was analysed, `t37.3`).
- `t34.5` **AGENT** · *fair* · careful · from `t32.2`, `t33.1`, `t34.1`, `bk.alarm` · Holmes —
  Straker went out at one, by his own account to the stables. Either he never got there, or he got there and
  **raised no alarm**: he didn't wake the lads in the loft about a drugged guard and an empty stall.
- `t34.6` **GENRE** · *weak* · expert · Holmes ¶220
  reads "They still had hopes that the trainer had for some reason taken out the horse for early exercise"
  The household's first thought is that the trainer took the horse out himself. ⚠ medium: on a first reading
  this is just the household's hope.

**¶35**
- `t35.1` **RECORD** · typical
  reads "About a quarter of a mile from the stables John Straker's overcoat was flapping from a furze-bush"
- `t35.2` **RECORD** · *strong* · typical
  reads "the dead body of the unfortunate trainer. His head had been shattered by a savage blow from some heavy weapon"
  **A** blow, singular.
- `t35.3` **RECORD** · typical
  reads "he was wounded on the thigh, where there was a long, clean cut, inflicted evidently by some very sharp instrument"
- `t35.4` **RECORD** · typical
  reads "in his right hand he held a small knife, which was clotted with blood up to the handle"
- `t35.5` **RECORD** · *strong* · typical
  reads "in his left he clasped a red and black silk cravat, which was recognised by the maid as having been worn on the preceding evening by the stranger"
- `t35.6` **WEIGH** · *strong* · careful · from `t12.2` · Holmes ¶226 (contradicts)
  reads "It was clear, however, that Straker had defended himself vigorously against his assailants"
  An inference written as fact, including a plural ("assailants") that nothing observed supports. Re-file it as
  the police reading. This is the "embellishment" `t12.2` warned about.
- `t35.7` **HYPOTHESIS** · *fair* · careful · from `t35.3`, `t35.4`
  Whose blood is on the knife: {an assailant's, **Straker's own**}? The thigh cut is "clean" from "a very sharp
  instrument", and he is holding one.
- `t35.8` **NOTICE** · *weak* · careful · from `t32.2`, `t35.1`, `bk.coat_work` · Holmes ¶226
  **The coat is off.** He set out in a mackintosh in heavy rain; a quarter mile on, the coat is on a bush. It
  stays weak until the wind is known (¶94–¶96).
- `t35.9` **HYPOTHESIS** · *weak* · careful · from `t35.8`
  {torn off in a fight and blown onto the bush; taken off}.
- `t35.10` **HYPOTHESIS** · *weak* · typical · from `t35.5`
  The cravat in his hand: {torn from the assailant (the police reading); planted on the body; Straker had it for
  some reason of his own}.

**¶36**
- `t36.1` **RECORD** · typical
  reads "Hunter ... was also quite positive as to the ownership of the cravat"; "He was equally certain that the same stranger had, while standing at the window, drugged his curried mutton"
- `t36.2` **WEIGH** · *strong* · careful · from `t36.1` · undercuts `t36.1 (drugging)`, `t29.3` · Holmes ¶218
  Hunter couldn't have **seen** the drugging: had he seen it, he wouldn't have eaten the food. His certainty is a
  conclusion (the stranger was at the window, and later I was drugged) from a man just out of an opium stupor.
  Downgrade it to "Hunter believes".
- `t36.3` **WEIGH** · *strong* · careful · from `t36.1`, `t35.5` · supports `t35.5`
  The cravat identification is observation, and two witnesses agree. Keep it as fact: it is the stranger's.

**¶37**
- `t37.1` **RECORD** · *strong* · typical
  reads "there were abundant proofs in the mud which lay at the bottom of the fatal hollow that he had been there at the time of the struggle"
- `t37.2` **RECORD** · typical
  reads "although a large reward has been offered, and all the gypsies of Dartmoor are on the alert, no news has come of him"
- `t37.3` **RECORD** · *strong* · typical
  reads "the remains of his supper left by the stable-lad contain an appreciable quantity of powdered opium, while the people at the house partook of the same dish on the same night without any ill effect"
- `t37.4` **INFER** · *strong* · careful · from `t37.3` · Holmes ¶218
  The opium went in after the lad's portion was separated from the household's: in the kitchen after dishing up,
  on the walk, or at the window.
- `t37.5` **INFER** · *strong* · careful · from `t37.1`, `t33.1`, `t31.3` · Holmes ¶220
  The horse was led out of a locked stable to the hollow by someone with a key.
- `t37.6` **REVISE** · *fair* · careful · from `t37.3`, `t20.4`, `bk.opium_taste` · revises `t20.4` · Holmes ¶218
  The curry now matters: it is the dish that hides the taste of opium. ⚠ low: the story dwells on the dish,
  but the step needs `bk.opium_taste`, which modern readers may lack.
- `t37.7` **DEFAULT** · *fair* · careful · from `t37.6`, `bk.coincidence` · Holmes ¶218 ("too monstrous a coincidence")
  The drugger knew or chose the menu. Exception: the drugger had a method that didn't depend on the dish.
- `t37.8` **INFER** · *fair* · careful · from `t37.7`, `t24.1`, `t26.1` · refutes `t29.3`; strains `t24.3 (drug)` · Holmes ¶218
  The stranger came with his paper already made up and couldn't have known what was for supper. **The drugger
  is of the household.**
- `t37.9` **HYPOTHESIS·opportunity** · *fair* · careful · from `t37.8`, `t20.2`, `t20.7` · Holmes ¶218 (names Straker and his wife)
  Who in the household: {Straker, Mrs. Straker, the maid}? The maid presumably cooks, and certainly carried the
  dish the whole way, so she had the most opportunity.
- `t37.10` **HYPOTHESIS** · *weak* · typical · from `t37.9`, `t24.1`
  The maid drugged it, bribed by the stranger or on her own account. (Dropped at `t92.7`.)
- `t37.11` **TEST** · *fair* · careful · from `t36.3`, `t37.5` · strains `t37.10`
  Hunter corroborates the stranger's presence and manner, and she fled from him. And the drugging is only half
  the night: someone with a key took the horse out four hours later, and the maid leading a racehorse across
  the moor at one in the morning is a strained picture.
- `t37.12` **TEST** · *fair* · careful · from `t37.2` · supports `t14.3 (stable)`
  Missing for days despite a large reward and every gypsy on the alert.
- `t37.13` **HYPOTHESIS** (PHYSICAL) · *weak* · expert · from `t35.2`, `t37.1`, `bk.horse_kick` · Holmes ¶212, ¶226
  The horse killed Straker: one crushing blow to the head, with the horse present at the time. ⚠ high: a
  first-time reader is primed for a human killer and rarely considers the horse before ¶212.

**¶38**
- `t38.1` **GENRE** · *fair* · careful · from `t35.6`, `t36.2`
  reads "Those are the main facts of the case, stripped of all surmise"
  They aren't: the "assailants" and Hunter's certainty are both in the recital. The game could make this
  sorting an explicit task.

**¶39**
- `t39.1` **RECORD** · typical
  reads "Fitzroy Simpson. He was a man of excellent birth and education, who had squandered a fortune upon the turf"; "he inhabited one of those villas"; "bets to the amount of five thousand pounds had been registered by him against the favourite"
- `t39.2` **HYPOTHESIS·motive** · *strong* · typical · from `t39.1`, `t18.2`
  Simpson has a strong motive.
- `t39.3` **GENRE** · *fair* · careful · from `bk.genre_obvious` · strains `t46.1`
  reads "Were he but gifted with imagination he might rise to great heights"; "the man upon whom suspicion naturally rested"
  The unimaginative detective arrests the obvious man in the first act.

**¶40**
- `t40.1` **RECORD** · typical
  reads "some information about the King's Pyland horses, and also about Desborough, the second favourite, which was in charge of Silas Brown at the Mapleton stables"
- `t40.2` **RECORD** · typical
  reads "When confronted with his cravat, he turned very pale, and was utterly unable to account for its presence"; "His wet clothing showed that he had been out in the storm"; "a Penang-lawyer weighted with lead, was just such a weapon as might, by repeated blows, have inflicted the terrible injuries"
- `t40.3` **HYPOTHESIS·motive** · *fair* · careful · from `t40.1`, `t18.2`
  Mapleton gains if Silver Blaze doesn't run.
- `t40.4` **INFER** · *fair* · careful · from `t40.3`, `t19.5`, `t14.3` · Holmes ¶116 (by another route: horse instinct)
  The horse is at, or was taken to, Mapleton: it has a motive, the means to hide a horse among horses, and it
  is two miles away.
- `t40.5` **NOTICE** · *weak* · expert · from `t35.2`, `t40.2` · strains `t46.1`
  "By repeated blows" against "a savage blow": the police account of the weapon doesn't fit the wound as
  reported.
- `t40.6` **WEIGH** · *fair* · careful · from `t40.2`, `t24.1`
  Wet clothing says he was out in the rain, which he admits for the evening. It says nothing about one a.m.
- `t40.7` **WEIGH** · *fair* · careful · from `t40.2`
  He goes pale and can't explain the cravat. That fits guilt, and it equally fits a man frightened to learn that
  something of his was found in a dead man's hand. Neutral.

**¶41**
- `t41.1` **RECORD** · *strong* · typical
  reads "there was no wound upon his person"
- `t41.2` **TEST** · *fair* · careful · from `t41.1`, `t35.7` · supports `t35.7 (Straker's own)`
  Simpson has no wound, and there is no second assailant in the evidence, so the blood is probably Straker's.

**¶43–¶44**
- `t44.1` **RECORD** · typical
  reads "that the incised wound upon Straker may have been caused by his own knife in the convulsive struggles which follow any brain injury"; "It is more than possible; it is probable"
- `t44.2` **TEST** · *fair* · careful · from `t44.1`, `t41.2` · supports `t35.7 (Straker's own)` · Holmes ¶226 (the second mechanism)
  His own knife, his own thigh. Watson's mechanism (convulsions after the blow) is one option; the other is that
  he cut himself while using the knife. Keep the conclusion and leave the mechanism open.

**¶46**
- `t46.1` **HYPOTHESIS·scenario** (the police theory) · typical
  reads "this Fitzroy Simpson, having drugged the lad, and having in some way obtained a duplicate key, opened the stable door and took out the horse"; "His bridle is missing"; "he was either met or overtaken by the trainer"; "beat out the trainer's brains with his heavy stick"; "either led the horse on to some secret hiding-place, or else it may have bolted"
- `t46.2` **INFER** · *fair* · careful · from `t46.1`
  reads "His bridle is missing"
  The horse was bridled and led by someone who knew how.
- `t46.3` **RESIDUE** · *strong* · careful · strains `t46.1` · Holmes ¶46 ("improbable"), ¶57 (part)
  The police theory leaves unexplained:
  1. the curry: a stranger lucky in the menu (`t37.7`, `t37.8`);
  2. the dog's silence while a stranger took the horse (`t34.2`, `t34.4`);
  3. a duplicate key nobody has found (`t31.3`);
  4. why take the horse out at all (`t18.3`);
  5. how a stranger hides the most famous horse in England (`t14.3`, `t37.12`);
  6. the trainer pursuing alone without waking the loft or loosing the dog (`t34.5`);
  7. one blow against "repeated blows", and no wound on Simpson (`t40.5`, `t41.1`);
  8. the coat off in the rain (`t35.8`).
- `t46.4` **HYPOTHESIS·scenario** · *weak* · expert · from `t32.2`, `t31.4`, `t34.4`, `t34.5`, `t37.8`, `t35.8`, `t34.6` · strained by `t19.4` · Holmes ¶220
  **Straker himself took the horse out.** He went out at one, had a key, was known to the dog, belonged to the
  household that served the curry, raised no alarm, and took his coat off for some job. Against: his reputation,
  no motive in evidence, and he is the one who died. ⚠ high: every premise is on the page, but holding the
  victim as the instigator is a big jump for a first-time reader. The residue list (`t46.3`) is what pushes
  towards it.
- `t46.5` **QUESTION·motive** · careful · from `t46.4`
  If Straker, why? Only `t28.3` hints at a motive so far.
- `t46.6` **QUESTION** · careful · from `t46.4`
  If Straker, what killed him: {Simpson met on the moor, someone else, the horse (`t37.13`)}?

### State of mind after s02

**The night, as far as it is fixed:**

| Time | What | Thoughts |
|---|---|---|
| 9:00 | stables locked; lads to the kitchen; Hunter on guard | `t20.1` |
| just after 9 | curried mutton carried down; the stranger, the paper, the window, the dog; he vanishes | `t20.2`, `t24.1`, `t29.1`, `t29.2` |
| ? | opium into the lad's portion, after dishing up | `t37.4` |
| later | lads return; message to Straker | `t32.1` |
| 1:00 | Straker goes out in heavy rain, in his mackintosh | `t32.2` |
| ? | door opened with a key; horse bridled and led out; the dog unheard | `t33.2`, `t37.5`, `t46.2`, `t34.2` |
| ? | horse and Straker in the hollow; coat off; one blow; thigh cut | `t37.1`, `t35.1`–`t35.3` |
| ? | horse leaves the hollow | — |
| 7:00 | door open, Hunter stupefied, stall empty | `t33.1` |

**Open questions:** who drugged the lad (`t37.9`); who opened the door (`t31.4`); why the horse was taken out
(`t18.3`); what killed Straker (`t46.6`); why the coat is off (`t35.9`); why the dog was silent (`t34.4`); where
the horse is (`t14.3`).

**Live scenarios:**
- *Police* (`t46.1`): residue of eight (`t46.3`).
- *Mapleton* (`t40.4`): explains the hiding; says nothing about the night.
- *Inside* (`t46.4`): explains the curry, the dog, the key and the missing alarm; lacks a motive (`t46.5`).
- *Accident* (`t37.13`): explains the single blow and the absence of a human killer; doesn't explain why they
  were in the hollow.

---

## s03 Tavistock and the drive with Gregory (¶47–¶69)

**¶52–¶56**
- `t52.1` **RECORD** · typical
  reads "the evidence is purely circumstantial"
- `t54.1` **TEST** · *fair* · careful · from `t44.2` · supports `t35.7 (Straker's own)`
  reads "We have quite come to the conclusion that he wounded himself in his fall"
  The police accept the cut was self-inflicted. That removes the one piece of physical evidence that an
  assailant was hurt.
- `t56.1` **WEIGH** · *fair* · careful · from `t39.2`, `t36.2`, `t40.6`, `t40.5`, `t36.3`, `t35.10`
  reads "He had a great interest in the disappearance of the favourite. He lies under suspicion of having poisoned the stable-boy, he was undoubtedly out in the storm, he was armed with a heavy stick, and his cravat was found in the dead man's hand"
  Gregory's case, item by item: the motive is real; the poisoning is Hunter's conclusion; "out in the storm"
  doesn't fix the hour; the stick fits a weapon but not one blow; the cravat is real, but how it got there is
  open.

**¶57**
- `t57.1` **TEST** · *strong* · careful · supports `t46.3`
  reads "Why should he take the horse out of the stable? ... Has a duplicate key been found ...? ... where could he, a stranger to the district, hide a horse ...? What is his own explanation as to the paper"
  Holmes's objections are items 3, 4 and 5 of the reader's list, plus the paper. A reader who built the list can
  check it against his.
- `t57.2` **NOTICE** · *weak* · careful
  reads "If he wished to injure it why could he not do it there?"
  Holmes puts injuring the horse on the table as a natural aim.
- `t57.3` **QUESTION·turn-around** · *weak* · expert · from `t18.3`, `t57.2` · Holmes ¶223
  Turned round: what needed doing **away from** the stable? Something that couldn't be done within earshot of the
  loft, or that needed light that would be seen. It waits for the knife (`t81.2`) and the candle (`t78.3`).

**¶58**
- `t58.1` **RECORD** · typical
  reads "He says that it was a ten-pound note. One was found in his purse."
- `t58.2` **RECORD** · typical
  reads "He has twice lodged at Tavistock in the summer. The opium was probably brought from London. The key, having served its purpose, would be hurled away. The horse may be at the bottom of one of the pits"
- `t58.3` **DROP** · *fair* · careful · from `t58.1`, `t24.4`, `t26.1` · drops `t24.3 (drug)`, supports `t24.3 (money)` · Holmes —
  The paper was money. The packet-equals-opium link, the strongest tie between Simpson and the drugging, goes.
- `t58.4` **WEIGH** · *fair* · careful · from `t58.2` · strains `t46.1`
  Gregory meets each objection with a new assumption, not with evidence. A theory held up by patches is losing.

**¶60**
- `t60.1` **RECORD** · typical
  reads "He acknowledges that it is his, and declares that he had lost it."
- `t60.2` **WEIGH** · *fair* · careful · from `t60.1`, `t29.2`
  Unverifiable. If it is true, he most likely lost it on the moor that evening near the stables, running from
  the dog.
- `t60.3` **HYPOTHESIS** · *weak* · careful · from `t60.2`, `t32.2`, `t35.10` · Holmes ¶226 (the second)
  Someone passing the stables later picked it up, for instance a man going down at one in the morning. If it was
  Straker, why keep it: {to lay it on the stranger later, as a strap or tie}?

**¶62**
- `t62.1` **RECORD** · typical
  reads "a party of gypsies encamped on Monday night within a mile of the spot where the murder took place. On Tuesday they were gone."
- `t62.2` **HYPOTHESIS** · *weak* · typical · from `t62.1`, `t37.2`
  The gypsies have the horse. (Gregory's version adds Simpson leading the horse to them.)
- `t62.3` **DEFAULT·period** · *fair* · careful · from `t62.1`, `bk.gypsies` · undercuts `t62.2` · Holmes ¶114
  Under the period belief their leaving is to be expected either way, so it points at nothing. It fits the police
  theory only by its timing.
- `t62.4` **DROP** · *fair* · careful · from `t62.3`, `bk.gypsies`, `bk.famous_horse`, `t46.3` · drops `t62.2` · Holmes ¶114
  They couldn't sell a horse everyone knows, taking him would bring the police down on them, and the theory
  explains nothing about the curry or the dog.

**¶64**
- `t64.1` **RECORD** · typical
  reads "I have also examined every stable and out-house in Tavistock, and for a radius of ten miles"
- `t64.2` **TEST** · *fair* · typical · from `t64.1` · strains `t14.3 (stable)`, `t40.4`
- `t64.3` **HYPOTHESIS** (PHYSICAL) · *weak* · expert · from `bk.blaze`, `bk.famous_horse`, `t64.1` · undercuts `t64.2` · Holmes ¶198, ¶202
  A search finds a horse only if the searchers recognise him, and his name says how they would: a blaze. A
  horse with the blaze dyed out is one more bay among bays. ⚠ medium: the reader needs `bk.blaze`, and the
  disguise isn't confirmed until ¶198.

**¶66**
- `t66.1` **RECORD** · typical
  reads "Silas Brown, the trainer, is known to have had large bets upon the event, and he was no friend to poor Straker. We have, however, examined the stables"
- `t66.2` **TEST** · *fair* · careful · from `t66.1`, `t64.3` · supports `t40.4`
  Brown adds motive. The search of his stables counts against `t40.4` only as far as `t64.3` lets it.
- `t66.3` **HYPOTHESIS·scenario** · *weak* · typical · from `t66.1`, `t40.3`
  Silas Brown organised the night: the drugging and the abduction, through Simpson or someone else.

**¶67–¶68**
- `t68.1` **RECORD** · typical
  reads "And nothing to connect this man Simpson with the interests of the Mapleton stables?" "Nothing at all."
- `t68.2` **DROP** · *fair* · careful · from `t68.1`, `t37.8`, `t34.4` · drops `t66.3` · Holmes —
  Nothing connects Simpson to Mapleton, and the curry and dog arguments point inside King's Pyland, not to
  Mapleton.
- `t68.3` **IDENTIFY·split** · *fair* · careful · from `t14.4`, `t37.8`, `t40.4`, `t68.1` · revises `t4.2`
  The one-culprit default breaks. The night is **three stories**: who took the horse out (inside), what killed
  Straker (open), who has the horse now (perhaps Mapleton). They may involve different people.

**¶69–¶70**
- `t70.1` **GENRE·watch-holmes** · *strong* · careful · Holmes ¶216
  reads "There was a gleam in his eyes and a suppressed excitement in his manner which convinced me ... that his hand was upon a clue, though I could not imagine where he had found it"
  Holmes has had the key insight in the carriage. Nothing new has reached him except Gregory's answers, so the
  clue is among facts the reader also has.
- `t70.2` **GENRE·re-read** · careful · from `t70.1`
  Go back over the recital with one question: which fact would make a man start? For a reader who missed
  `t37.6`, this is the prompt; a reader who already has it can confirm being there first.

### State of mind after s03

The police theory is losing (`t58.3`, `t58.4`, `t56.1`). The night has split into three stories (`t68.3`): who
took the horse out (inside, probably Straker, `t46.4`), what killed Straker (`t46.6`), and where the horse is
(Mapleton, perhaps disguised, `t40.4`, `t64.3`). The missing piece is **a motive for Straker** (`t46.5`).

---

## s04 Straker's villa: the pockets and Mrs. Straker (¶70–¶92)

**¶72–¶75**
- `t75.1` **GENRE·watch-holmes** · *fair* · careful · from `t70.1`, `t46.4`
  reads "He has been in your service some years, Colonel Ross?" "I have always found him an excellent servant."
  Right after his insight, Holmes asks the dead man's employer about **the dead man's character**. That is the
  question he would ask if the insight implicated Straker.

**¶78**
- `t78.1` **RECORD** · *strong* · typical
  reads "a box of vestas, two inches of tallow candle, an A.D.P. briar-root pipe, a pouch of seal-skin ... a silver watch with a gold chain, five sovereigns in gold, an aluminium pencil-case, a few papers, and an ivory-handled knife with a very delicate, inflexible blade"
- `t78.2` **INFER** · *strong* · typical · from `t78.1`
  Five sovereigns and a gold-chained watch are still on the body. Not a robbery, and nobody searched him.
- `t78.3` **NOTICE** · *fair* · careful · from `t78.1` · Holmes ¶224 (the Colonel)
  **A candle** as well as matches. Matches go with the pipe; a candle is for close work in the dark.
- `t78.4` **ABSENCE** · *weak* · expert · from `t78.1`, `t32.2`
  No lantern. He set out on a dark night to inspect the stables and took a candle stub, not a lantern.
- `t78.5` **PREDICT** · *weak* · careful · from `t78.3`, `t37.1` · Holmes ¶102–¶106
  If he lit a match in the hollow, a spent one may be in the mud there.

**¶79–¶81**
- `t81.1` **RECORD** · *strong* · typical
  reads "It is what we call a cataract knife"; "A very delicate blade devised for very delicate work"; "it would not shut in his pocket"
- `t81.2` **NOTICE** · *strong* · typical · from `t81.1`, `t32.1` · Holmes ¶81, ¶221
  A horse-trainer carrying **a surgeon's eye-knife** on a night when he expected trouble. This is the loudest
  clue in the story, and the story says so through Holmes.
- `t81.3` **HYPOTHESIS** · *fair* · careful · from `t81.2`, `t57.2`, `t78.3`
  Why carry it: {the nearest weapon; **to operate on something that night**}? The only possible patient within
  a quarter mile is the horse.
- `t81.4` **AGENT** · *fair* · careful · from `t81.1`, `bk.weapon_choice` · strains `t81.3 (weapon)` · Holmes ¶221 ("no sane man would choose for a weapon")
  A man arming himself takes a stick or a poker.
- `t81.5` **INFER** · *fair* · careful · from `t81.3`, `t81.4`, `t57.3`, `t46.4` · Holmes ¶221, ¶223
  He meant to **injure the horse, delicately, away from the stable**: away from the loft's hearing, by candle.
  The specific operation (nicking a tendon under the skin, ¶221) is specialist knowledge. The general form is
  enough to carry the chain, and the game should accept it.

**¶82**
- `t82.1` **RECORD** · typical
  reads "The tip was guarded by a disk of cork which we found beside his body"; "His wife tells us that the knife had lain upon the dressing-table, and that he had picked it up as he left the room"; "It was a poor weapon, but perhaps the best that he could lay his hands on"
- `t82.2` **WEIGH** · *fair* · careful · from `t82.1` · strains `t81.3 (weapon)`
  Mrs. Straker's report is honest observation: **he took the knife deliberately** as he set out. Gregory's "best
  he could lay his hands on" is an inference, and a weak one: a man in his own house could lay his hands on much
  better.
- `t82.3` **INFER** · *fair* · careful · from `t82.1`
  The guard was by the body, so the blade was unsheathed in the hollow. That fits both readings.
- `t82.4` **NOTICE** · *weak* · expert · from `t82.1`
  Why does a trainer keep a cataract knife on his dressing-table at all?

**¶84**
- `t84.1` **RECORD** · *strong* · typical
  reads "Three of them are receipted hay-dealers' accounts. One of them is a letter of instructions from Colonel Ross. This other is a milliner's account for thirty-seven pounds fifteen made out by Madame Lesurier, of Bond Street, to William Derbyshire"
- `t84.2` **RECORD** · typical
  reads "Mrs. Straker tells us that Derbyshire was a friend of her husband's and that occasionally his letters were addressed here"
- `t84.3` **NOTICE** · *strong* · careful · from `t84.1`, `bk.bills` · Holmes ¶225
  A dead man carrying **someone else's bill**. Exception: settling it for a friend.
- `t84.4` **HYPOTHESIS** · *fair* · careful · from `t84.3`, `t84.2`
  {Derbyshire is a friend, as Mrs. Straker says; **Derbyshire is Straker**, under another name}.
- `t84.5` **SOURCE** · *fair* · careful · from `t84.2`, `bk.alias_post` · supports `t84.4 (Straker)`
  Mrs. Straker passes on what her husband told her: honest, but second-hand. "His letters were addressed here" is
  just how an alias gets its post, so her evidence for "friend" fits "alias" equally well.
- `t84.6` **IDENTIFY·merge** · *fair* · careful · from `t84.3`, `t84.4`, `t84.5` · Holmes ¶225
  Derbyshire = Straker, provisionally.
- `t84.7` **NOTICE·calculate** · *fair* · careful · from `t84.1`, `t84.6`, `t19.1`, `bk.milliner_prices` · Holmes ¶225, ¶229
  £37 15s at a Bond Street milliner, for a man "comfortably off" on a trainer's means. There is a **lady** with
  expensive tastes who is not, or not openly, his wife: a second household, and money pressure.
- `t84.8` **REVISE** · *fair* · careful · from `t84.7`, `t28.3`, `bk.lay_against` · revises `t28.3`; answers `t46.5` · Holmes ¶220
  The motive: a man who needs money, and who controls the favourite, bets against him through others and makes
  sure he loses.

**¶85**
- `t85.1` **RECORD** · typical
  reads "Madam Derbyshire had somewhat expensive tastes"; "Twenty-two guineas is rather heavy for a single costume"
- `t85.2` **GENRE·watch-holmes** · *weak* · careful · from `t85.1`
  Holmes reads the bill line by line. The reader isn't shown the items, only that one is a costume of 22 guineas.
- `t85.3` **TEST PLAN** · *fair* · expert · from `t84.6`, `t85.1` · Holmes ¶89–¶92
  If Derbyshire is Straker, there are two versions: (a) Straker dresses **his wife** extravagantly under another
  name, and (b) there is **another woman**. Ask whether Mrs. Straker ever received that costume. "Friend"
  predicts no as well, so the test doesn't separate friend from alias; it separates (a) from (b).

**¶89–¶92**
- `t92.1` **RECORD** · typical
  reads "You wore a costume of dove-coloured silk with ostrich-feather trimming." "I never had such a dress, sir," answered the lady. "Ah, that quite settles it,"
- `t92.2` **INFER** · *fair* · careful · from `t85.1`, `t92.1` · Holmes ¶225
  The dress Holmes describes must come from the bill: he is running `t85.3`. The reader has to supply this link.
  Fair-play note: the reader is shown the test and its result, not the item it tests.
- `t92.3` **WEIGH** · *fair* · careful · from `t92.1`
  Her denial is honest; she doesn't know what is being asked, which is why the trick works.
- `t92.4` **TEST** · *fair* · careful · from `t92.2`, `t92.3` · supports `t84.7`; refutes `t85.3 (a)` · Holmes ¶225
  She never had it, so the costume went to another woman. "That quite settles it."
- `t92.5` **TEST PLAN** · *fair* · careful · from `t84.6` · Holmes ¶161, ¶225, ¶229
  Show Straker's photograph at Madame Lesurier's: the milliner will recognise him as Derbyshire.

### State of mind after s04: the checkpoint before the hollow

- `t92.6` **HYPOTHESIS·scenario** · *fair* · careful · from `t84.8`, `t81.5`, `t37.8`, `t46.4`, `t34.4`, `t60.3`, `t35.8`, `t78.3`, `t44.2`, `t37.13`, `t40.4`, `t64.3` · supports `t46.4`; answers `t46.5` · Holmes ¶216–¶231
  **The inside story** of Monday night, every link either evidenced or a named default:
  1. Straker, living a double life as Derbyshire with an expensive lady, needs money (`t84.6`–`t84.8`, `t92.4`).
  2. He means to profit from his own favourite losing (`t84.8`).
  3. He plans to lame the horse invisibly with the cataract knife, out on the moor, away from the loft
     (`t81.5`).
  4. The household serves curried mutton; opium goes into the lad's portion, where the curry hides it (`t37.6`–`t37.8`).
  5. At one he takes the knife and a candle, opens the door with his key; the dog knows him and keeps quiet
     (`t32.2`, `t31.4`, `t34.4`, `t78.3`).
  6. He picks up the cravat Simpson lost (`t60.3`; why he kept it stays open).
  7. He leads the horse to the hollow, out of sight of the house, takes his coat off to work (`t35.8`), and strikes
     a light (`t78.3`).
  8. One blow kills him; falling, he cuts his own thigh (`t35.2`, `t44.2`). The best candidate for the blow is the
     horse (`t37.13` ⚠): no robbery (`t78.2`), no human killer needed, and the horse was there.
  9. The horse bolts. The nearest stable he could reach without being seen is Mapleton, where a searcher could
     miss him if the blaze were hidden (`t40.4`, `t64.3`).
- `t92.7` **DROP** · *fair* · careful · from `t92.6`, `t37.11` · drops `t37.10` · Holmes —
  The maid as drugger: the inside story explains the drugging and the night visit with one person, while the
  maid version needs two, and she has no motive beyond a bribe she ran away from.
- `t92.8` **QUESTION** · careful · from `t92.6`
  Who drugged the dish: Straker or his wife? The curry argument names the household; the dog and key arguments
  name the person who came at one. Holmes leaves the access question open (¶218).

**Predictions a reader can make here, before Holmes checks them:**
- `t92.9` **PREDICT** · *weak* · careful · from `t78.5` · Holmes ¶102–¶106: a spent match in the hollow.
- `t92.10` **PREDICT** · *fair* · careful · from `t35.8`, `t35.9`, `t92.6` · Holmes ¶94–¶96: the coat was laid on
  the bush, which will show if the night was still.
- `t92.11` **PREDICT** · *fair* · careful · from `t40.4` · Holmes ¶116–¶119: the horse's tracks lead towards
  Mapleton.
- `t92.12` **PREDICT** · *fair* · careful · from `t92.5` · Holmes ¶229: the milliner recognises Straker's photograph.
- `t92.13` **PREDICT** · *weak* · expert · from `t40.4`, `t92.6` · Holmes ¶111, ¶161: the horse will be found in
  time to run, so Holmes will want him kept entered.
- `t92.14` **AGENT** → **PREDICT** · *weak* · expert · from `t81.5` · Holmes ¶170–¶175, ¶228: a careful man doesn't
  attempt a delicate operation cold, so Straker practised on something first. ⚠ high: reachable only by asking
  "would he do this cold?", and almost no first-time reader asks it.

**What remains uncertain:** what killed Straker (`t46.6`); why he carried the cravat (`t60.3`); who has the horse
(`t40.4`); who drugged the dish (`t92.8`).

**Difficulty, by profile.** A *typical* reader reaches the motive for Simpson, the knife as odd (`t81.2`) and
perhaps Derbyshire, and holds the police theory with doubts. A *careful* reader reaches the inside story through
step 7. Step 8 (the horse as killer, `t37.13`), the disguise (`t64.3`) and the practice (`t92.14`) are *expert*
moves: the game should treat them as bonuses, not as gates.

---

## Notes for the next pass (not yet a gap analysis)

Observations from writing the pilot that bear on the format and the game. To be turned into a proper gap
analysis once the whole story is annotated.

- **Most of the work is weighing and noticing, not deducing.** The INFER steps are short and few. The decisive
  moves are NOTICE and ABSENCE (`t37.6`, `t81.2`, `t84.3`, `t34.2`), WEIGH and SOURCE (`t35.6`, `t36.2`,
  `t84.5`), and RESIDUE (`t46.3`).
- **Testimony needs a grain finer than the claim.** `t35.6` is one clause of a paragraph whose other clauses are
  observations; `t36.1` holds an observation and a conclusion from the same witness. Clause-level spans are
  needed for WEIGH to work.
- **Hypotheses are held in sets, and sets are pruned member by member** (`t24.3` loses "drug" at `t58.3`;
  `t85.3 (a)` falls at `t92.4`). Relations need to address a set member.
- **The reader's theories are scenarios, and they split** (`t68.3`). The timeline table after s02 is the board
  the reader is actually using.
- **Undercut is not refute.** "Sound sleepers" (`t34.3`) attacks the step from "nobody mentions the dog" to "the
  dog was silent"; it doesn't make the dog bark. Gregory's patches (`t58.4`) strain a theory without refuting
  it. The engine needs both kinds of attack.
- **Holmes's behaviour is evidence** (`t31.2`, `t70.1`, `t75.1`, `t85.2`). Whether the game should credit it
  less than reasoning from the evidence is a design decision.
- **Some flags pay off only as scenery** (`t6.2`, `t10.1`, `t24.5`). SET ASIDE gives them somewhere to go.
- **Wrong turns supported so far:** the paper as opium (`t24.3` → `t58.3`), the gypsies (`t62.2` → `t62.4`),
  Silas Brown as organiser (`t66.3` → `t68.2`), the maid (`t37.10` → `t92.7`). Each one is dropped by citing a
  specific thought.
- **Earliest versus Holmes's date.** The curry is possible at ¶37 and Holmes has it at ¶69; Mapleton at ¶40
  (motive and capacity) and Holmes at ¶116 (horse instinct). Two routes to one conclusion at different times:
  the format has to allow alternative premises for the same conclusion.
- **Background cards carry the difficulty.** `bk.opium_taste`, `bk.blaze`, `bk.lay_against` and
  `bk.horse_kick` are where modern readers fall short. Offering them as optional cards would be a natural hint
  system.
