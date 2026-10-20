# Silver Blaze, read slowly: an annotated attempt to solve it ahead of Holmes

Status: COMPLETE, ¶0–¶231. Written 2026-10-15: the pilot (¶0–¶92) first, then moved to the extended tag set with
ids, premises and two dates, then the rest of the story in the same format. Not yet machine-readable; not yet
compared with the case format (that is the gap analysis, next).

**Data:** the thoughts and background cards are mirrored, one per line, in `cases/silver-blaze/thoughts.json`
(generated once from this document, Round 37), which also maps each thought to the case cards that hold it.
From now on the JSON is the data and this document the prose: change both together; `npm test` checks that the
ids and tags agree, and `npm run validate-thoughts` checks the rest and writes `thoughts-report.md`.

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
  The prose of the thought: the reader's note, as the reader would write it at this paragraph.
  *Note:* The annotator's remark on it, if any (a hindsight note, a later paragraph, what the game should do).
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
| ⚠ | Hindsight risk, with a note (in the remark). |
| *Note:* | The annotator's remark (`remark` in the data), apart from the reader's note: hindsight notes, forward references, scoring, what the game should do, when a thought was added (Round 184). The note itself cites no later thought or paragraph; the remark may. |

### Tags

| Tag | Subtypes | What the reader is doing | Game action it suggests |
|---|---|---|---|
| RECORD | | Putting a fact from the text into the picture of Monday night. One fact per record, quoted at clause level. | Place a card on the timeline and map board. |
| NOTICE | ·calculate | Flagging a detail that a normal version of this story wouldn't contain. `·calculate`: the oddity shows only after arithmetic on stated figures. | Highlight a span and say which expectation it breaks. |
| ABSENCE | | Expecting something the text doesn't report. | File an expectation (set up earlier in the text) as "expected, not reported". |
| QUESTION | ·opportunity ·motive ·turn-around | Naming a blank. `·turn-around`: inverting a question to make it productive. | Pin a "?" card on a blank or a card. |
| HYPOTHESIS | ·opportunity ·motive ·scenario | Proposing a set of candidate explanations, held open. `·scenario`: a whole story of the night. | Put candidates on a blank; sets stay open until pruned. |
| INFER | ·opportunity | A step as good as certain given its premises. | Combine cards; the engine checks the step. |
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
| `bk.practice` | A careful man practises a delicate, unfamiliar operation before doing it for real. | yes | yes |
| `bk.horse_gregarious` | A loose horse makes for its own stable or the nearest other horses. | yes | partial |
| `bk.guilty_denial` | A violent denial of an accusation, followed by giving way, means the accusation struck home. | yes | yes |
| `bk.horse_faker` | A "faker" is a dealer who disguises horses (dyes markings) to pass them off. | racing public | rare |
| `bk.odds` | Odds that shorten sharply mean informed money is coming in. | yes | yes |
| `bk.tendon_nick` | A tendon in a horse's hind leg can be nicked under the skin to cause a lameness that leaves no trace. | specialist | rare |

---

## s01 Breakfast at Baker Street (¶1–¶7)

**¶4**
- `t4.1` **RECORD** · *strong* · typical
  reads "the singular disappearance of the favourite for the Wessex Cup, and the tragic murder of its trainer"
  Two events: a horse gone and a trainer dead.
- `t4.2` **DEFAULT** · *fair* · typical · from `t4.1`, `bk.one_culprit` · Holmes ¶14 (names it as part of a blunder)
  Whoever took the horse killed the trainer.
  *Note:* The reader holds this without noticing it; it has to be broken later (`t68.3`).

**¶6**
- `t6.1` **GENRE** · *weak* · careful · from `bk.genre_obvious`
  reads "points about the case which promise to make it an absolutely unique one"
  Holmes calls the case unique, so the obvious explanation is likely to be wrong.
- `t6.2` **SET ASIDE** · typical
  reads "You would oblige me by bringing with you your very excellent field-glass."
  A field-glass, asked for by name. For watching something far off, presumably; nothing to make of it yet.
  *Note:* It is used only to watch the race (¶199) and carries no inference. A player who instead files it as a
  prediction shouldn't be penalised, and nothing should follow from it.

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
  *Note:* This licenses the WEIGH moves below.

**¶14**
- `t14.1` **RECORD** · *strong* · typical
  reads "I could not believe it possible that the most remarkable horse in England could long remain concealed"; "beyond the arrest of young Fitzroy Simpson nothing had been done"
  The horse has been missing for days, in thinly populated country.
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
- `t18.3` **NOTICE** · *fair* · careful · from `t18.2` · Holmes ¶57
  That aim doesn't need the horse taken: injuring, laming or hiding him until Tuesday would do.
  *Note:* This becomes a question once we learn the horse was led out (`t57.3`).

**¶19**
- `t19.1` **RECORD** · typical
  reads "a retired jockey"; "five years as jockey and for seven as trainer"; "a married man"; "no children, keeps one maid-servant, and is comfortably off"; "a small villa about two hundred yards from the stables"
  Straker.
  *Note:* ⚠ low: "comfortably off" is the baseline `t84.7` breaks; a first-time reader files it as setting.
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
  The narrator names the dish. Weak now.
  *Note:* It becomes strong at `t37.6`.
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
  The description has no cravat.
  *Note:* ⚠ high: only the cravat of ¶35 makes its absence here worth logging; a first-time reader has no reason to
  expect one. The maid later recognises one (`t35.5`) that she didn't describe here. That is small and leads nowhere
  certain, but it is the kind of gap a careful reader logs.

**¶22–¶24**
- `t24.1` **RECORD** · typical
  reads "I had almost made up my mind to sleep on the moor"; "I understand that a stable-boy sleeps there alone every night"; "See that the boy has this to-night, and you shall have the prettiest frock that money can buy"; "a piece of white paper folded up"
- `t24.2` **AGENT** · *strong* · careful · from `t24.1` · Holmes —
  A lost man wouldn't know the stable's night arrangements. The "lost" story is a cover: he came on purpose.
- `t24.3` **HYPOTHESIS** · *fair* · typical · from `t24.1`, `bk.drug_paper`
  What is in the folded paper: {drug, money, message}.
  *Note:* Most readers jump to the drug.
- `t24.4` **WEIGH** · *weak* · careful · from `t24.1` · supports `t24.3 (money)`, strains `t24.3 (drug)`
  A poisoner would hardly ask a witness openly to pass the poison, and offer her a dress for it.
- `t24.5` **SET ASIDE** · careful
  reads "the price of a new dress"
  The new dress is only the colour of the bribe.
  *Note:* A dress returns at ¶84 and ¶91. The echo is an accident of the text and nothing follows from it.

**¶25–¶26**
- `t25.1` **QUESTION·opportunity** · careful · from `t20.7`
  reads "ran past him to the window through which she was accustomed to hand the meals"; "Hunter was seated at the small table inside"
  Where was the dish during this scene: in her hands, on the sill, or on Hunter's table? The text doesn't say.
  Whether he could have reached it depends on the answer.
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
  *Note:* ⚠ medium: a first-time reader takes the line as a tout's colour; using it needs `bk.lay_against`. The
  Bayard-specific version leads nowhere (Bayard is scratched, ¶192); the general pattern is the true motive.

**¶29**
- `t29.1` **RECORD** · *strong* · careful
  reads "He sprang up and rushed across the stable to unloose the dog"; "Hunter rushed out with the hound"
  **The stable has a dog**, set on intruders.
  *Note:* A typical reader passes over it inside the action; the dog inference later rests on it.
- `t29.2` **RECORD** · typical
  reads "as she ran she looked back and saw that the stranger was leaning through the window"; "though he ran all round the buildings he failed to find any trace of him"
- `t29.3` **INFER·opportunity** · *fair* · careful · from `t29.2`, `t28.2`, `t25.1` · Holmes ¶36 (Hunter's version)
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
  reads "Mrs. Straker awoke at seven in the morning, to find that her husband had not yet returned"; "The door was open"; "Hunter was sunk in a state of absolute stupor, the favourite's stall was empty, and there were no signs of his trainer"
- `t33.2` **INFER** · *strong* · careful · from `t33.1`, `t31.1`, `t31.3`
  The door was opened with a key, from outside or from inside before Hunter went under.

**¶34**
- `t34.1` **RECORD** · typical
  reads "They had heard nothing during the night, for they are both sound sleepers"
- `t34.2` **ABSENCE** · *fair* · careful · from `t29.1`, `t29.4`, `t33.2`, `t34.1` · Holmes ¶180–¶182, ¶219
  **Nobody mentions the dog.** Someone came in the night and took out a horse, and the dog did nothing anyone heard.
  *Note:* ⚠ medium: the story's most famous line makes this easy for anyone who knows it. Most first-time readers
  miss this. It is the hardest move in the story, because nothing in the text points at the gap.
- `t34.3` **WEIGH** · *fair* · careful · undercuts `t34.2` · Holmes ¶219
  reads "for they are both sound sleepers"
  This is the text's own defeater: the dog might have barked unheard. But the lads sleep in the loft over the
  harness-room, close enough that loud barking would be hard to sleep through. It weakens `t34.2` without
  defeating it.
- `t34.4` **HYPOTHESIS** · *fair* · careful · from `t34.2` · Holmes ¶219
  Why was the dog quiet: {drugged too; barked unheard; **the visitor was someone the dog knew**}. Nothing says
  the dog was drugged.
  *Note:* Only the lad's supper is analysed, at ¶37 (`t37.3`).
- `t34.5` **AGENT** · *fair* · careful · from `t33.1`, `t34.8`, `bk.alarm` · Holmes —
  Straker went out at one, by his own account to the stables. Either he never got there, or he got there and
  **raised no alarm**: he didn't wake the lads in the loft about a drugged guard and an empty stall.
- `t34.6` **GENRE** · *weak* · expert · Holmes ¶220
  reads "They still had hopes that the trainer had for some reason taken out the horse for early exercise"
  The household's first thought is that the trainer took the horse out himself.
  *Note:* ⚠ medium: on a first reading this is just the household's hope.
- `t34.7` **DEFAULT** · *fair* · careful · from `t34.2`, `t29.1`, `t33.1`, `bk.guard_dog` · supports `t34.4 (knew)` · Holmes ¶219 ("the midnight visitor was some one whom the dog knew well")
  Someone came in and took a horse while the dog was there, and nobody heard it: a guard dog barks at strangers, so
  the visitor was someone the dog knew, one of King's Pyland. Exceptions: the dog was drugged too, or barked unheard
  (`t34.3`).
  *Note:* Added in Round 44: Holmes's step, which a careful reader can take here.
- `t34.8` **ABSENCE** · *fair* · careful · from `t34.1`, `t32.2`, `t33.1`, `bk.alarm` · Holmes —
  Nobody raised the alarm in the night: the lads in the loft slept until Mrs. Straker came at seven, though the
  stall was empty and the guard drugged.
  *Note:* Added in the annotation review, Round 93: the absence `t34.5` rests on, which the annotation had not
  tagged.

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
  **The coat is off.** He set out in a mackintosh in heavy rain; a quarter mile on, the coat is on a bush. It stays
  weak until the wind is known.
  *Note:* The wind is asked about at ¶94–¶96.
- `t35.9` **HYPOTHESIS** · *weak* · careful · from `t35.8`
  {torn off in a fight and blown onto the bush; taken off}.
- `t35.10` **HYPOTHESIS** · *weak* · typical · from `t35.5`
  The cravat in his hand: {torn from the assailant (the police reading); planted on the body; Straker had it for
  some reason of his own}.

**¶36**
- `t36.1` **RECORD** · typical
  reads "Hunter ... was also quite positive as to the ownership of the cravat"; "He was equally certain that the same stranger had, while standing at the window, drugged his curried mutton"
- `t36.2` **WEIGH** · *strong* · careful · from `t36.1` · undercuts `t36.1 (drugged)`, `t29.3` · Holmes ¶218
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
- `t37.4` **INFER** · *strong* · careful · from `t37.3`, `t20.2` · Holmes ¶218
  The opium went in after the lad's portion was separated from the household's: in the kitchen after dishing up,
  on the walk, or at the window.
- `t37.5` **INFER** · *strong* · careful · from `t37.1`, `t33.2` · Holmes ¶220
  The horse was led out of a locked stable to the hollow by someone with a key.
- `t37.6` **REVISE** · *fair* · careful · from `t37.3`, `t20.4`, `bk.opium_taste` · revises `t20.4` · Holmes ¶218
  The curry now matters: it is the dish that hides the taste of opium.
  *Note:* ⚠ low: the story dwells on the dish, but the step needs `bk.opium_taste`, which modern readers may lack.
- `t37.7` **DEFAULT** · *fair* · careful · from `t37.6`, `t37.3`, `t20.2`, `bk.coincidence` · Holmes ¶218 ("too monstrous a coincidence")
  The drugger knew or chose the menu. Exception: the drugger had a method that didn't depend on the dish.
- `t37.8` **INFER** · *fair* · careful · from `t37.7`, `t24.1`, `t19.1` · refutes `t29.3`; strains `t24.3 (drug)` · Holmes ¶218
  The stranger came with his paper already made up and couldn't have known what was for supper. **The drugger
  is of the household.**
- `t37.9` **HYPOTHESIS·opportunity** · *fair* · careful · from `t37.8`, `t20.2`, `t20.7` · Holmes ¶218 (names Straker and his wife)
  Who in the household: {Straker, Mrs. Straker, the maid}? The maid presumably cooks, and certainly carried the
  dish the whole way, so she had the most opportunity.
- `t37.10` **HYPOTHESIS** · *weak* · typical · from `t37.9`, `t24.1`
  The maid drugged it, bribed by the stranger or on her own account.
  *Note:* Dropped at `t92.7`.
- `t37.11` **TEST** · *fair* · careful · from `t36.3`, `t37.5` · strains `t37.10`
  Hunter corroborates the stranger's presence and manner, and she fled from him. And the drugging is only half
  the night: someone with a key took the horse out four hours later, and the maid leading a racehorse across
  the moor at one in the morning is a strained picture.
- `t37.12` **TEST** · *fair* · careful · from `t37.2` · supports `t14.3 (stable)`
  Missing for days despite a large reward and every gypsy on the alert.
- `t37.13` **HYPOTHESIS** (PHYSICAL) · *weak* · expert · from `t35.2`, `t37.1`, `bk.horse_kick` · Holmes ¶212, ¶226
  The horse killed Straker: one crushing blow to the head, with the horse present at the time.
  *Note:* ⚠ high: a first-time reader is primed for a human killer and rarely considers the horse before ¶212.
- `t37.14` **DEFAULT·period** · *fair* · careful · from `t19.1`, `t37.3` · Holmes ¶218 ("the only two people who could have chosen curried mutton")
  In a small household with one maid, the master or the mistress decides what is cooked: Straker or his wife chose
  the curry.
  *Note:* Added in Round 42: Holmes's step, which a careful reader can take here.
- `t37.15` **DEFAULT** · *weak* · careful · from `t37.6`, `t37.3`, `t20.2`, `t19.1` · strains `t37.9 (maid)` · Holmes ¶218 ("our attention centres upon Straker and his wife")
  If the drugger chose the dish rather than merely knew of it, the drugger is one of the two who decide what the
  house eats: Straker or his wife. Exception: the maid knew the menu without choosing it, so she survives through
  `t37.7`'s "knew".
  *Note:* Added in Round 42.
- `t37.16` **INFER** · *strong* · typical · from `t37.3`, `t33.1`, `t20.1`, `t32.1` · Holmes ¶220
  The lad on guard was drugged and by morning the horse was gone: he was drugged so the horse could be taken.
  Whoever drugged him took the horse, after he had eaten and after he sent word of the tout.
  *Note:* Added in Round 53.

**¶38**
- `t38.1` **GENRE** · *fair* · careful · from `t35.6`, `t36.2`
  reads "Those are the main facts of the case, stripped of all surmise"
  They aren't: the "assailants" and Hunter's certainty are both in the recital.
  *Note:* The game could make this sorting an explicit task.

**¶39**
- `t39.1` **RECORD** · typical
  reads "Fitzroy Simpson. He was a man of excellent birth and education, who had squandered a fortune upon the turf"; "he inhabited one of those villas"; "bets to the amount of five thousand pounds had been registered by him against the favourite"
- `t39.2` **HYPOTHESIS·motive** · *strong* · typical · from `t39.1`, `t18.2`
  Simpson has a strong motive.
- `t39.3` **GENRE** · *fair* · careful · from `bk.genre_obvious` · strains `t39.4`
  reads "Were he but gifted with imagination he might rise to great heights"; "the man upon whom suspicion naturally rested"
  The unimaginative detective arrests the obvious man in the first act.
- `t39.4` **HYPOTHESIS·scenario** · *fair* · typical · from `t39.2`, `t35.5`, `t36.1`
  reads "On his arrival he promptly found and arrested the man upon whom suspicion naturally rested"
  The police scenario in outline: Simpson drugged the lad, took the horse and killed the trainer.
  *Note:* Holmes states it in full at ¶46 (`t46.1`).

**¶40**
- `t40.1` **RECORD** · typical
  reads "some information about the King's Pyland horses, and also about Desborough, the second favourite, which was in charge of Silas Brown at the Mapleton stables"
- `t40.2` **RECORD** · typical
  reads "When confronted with his cravat, he turned very pale, and was utterly unable to account for its presence"; "His wet clothing showed that he had been out in the storm"; "a Penang-lawyer weighted with lead, was just such a weapon as might, by repeated blows, have inflicted the terrible injuries"
- `t40.3` **HYPOTHESIS·motive** · *fair* · careful · from `t40.1`, `t18.2`
  Mapleton gains if Silver Blaze doesn't run.
- `t40.4` **INFER** · *fair* · careful · from `t40.3`, `t19.5`, `t14.3`, `t37.2` · Holmes ¶116 (by another route: horse instinct)
  The horse is at, or was taken to, Mapleton: it has a motive, the means to hide a horse among horses, and it
  is two miles away.
- `t40.5` **NOTICE** · *weak* · expert · from `t35.2`, `t40.2` · strains `t39.4`
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
- `t41.2` **TEST** · *fair* · careful · from `t41.1`, `t35.4`, `t35.3`, `t35.2` · supports `t35.7 (Straker's own)`
  Simpson has no wound, and there is no second assailant in the evidence, so the blood is probably Straker's.

**¶43–¶44**
- `t44.1` **RECORD** · typical
  reads "that the incised wound upon Straker may have been caused by his own knife in the convulsive struggles which follow any brain injury"; "It is more than possible; it is probable"
- `t44.2` **TEST** · *fair* · careful · from `t44.1`, `t41.2`, `t35.4`, `t35.3`, `t35.2` · supports `t35.7 (Straker's own)` · Holmes ¶226 (the second mechanism)
  His own knife, his own thigh. Watson's mechanism (convulsions after the blow) is one option; the other is that
  he cut himself while using the knife. Keep the conclusion and leave the mechanism open.

**¶46**
- `t46.1` **HYPOTHESIS·scenario** (the police theory) · *weak* · typical · from `t39.4`
  reads "this Fitzroy Simpson, having drugged the lad, and having in some way obtained a duplicate key, opened the stable door and took out the horse"; "His bridle is missing"; "he was either met or overtaken by the trainer"; "beat out the trainer's brains with his heavy stick"; "either led the horse on to some secret hiding-place, or else it may have bolted"
- `t46.2` **INFER** · *fair* · careful · from `t33.1`
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
  household that served the curry, raised no alarm, and took his coat off for some job. Against: his reputation, no
  motive in evidence, and he is the one who died.
  *Note:* ⚠ high: every premise is on the page, but holding the victim as the instigator is a big jump for a
  first-time reader. The residue list (`t46.3`) is what pushes towards it.
- `t46.5` **QUESTION·motive** · careful · from `t46.4`
  If Straker, why? Only `t28.3` hints at a motive so far.
- `t46.6` **QUESTION** · careful · from `t46.4`
  If Straker, what killed him: {Simpson met on the moor, someone else, the horse (`t37.13`)}?
- `t46.7` **INFER** · *fair* · careful · from `t37.3`, `t33.1`, `t20.1`, `t32.1`, `t37.16` · Holmes ¶220
  If Straker drugged his own lad, it was for no honest purpose: nobody drugs a guard to take a horse out for
  exercise. Straker would be a dishonest man, and the horse went out for some harm.
  *Note:* Added in Round 55.

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
  Holmes's objections are items 3, 4 and 5 of the residue list (`t46.3`), plus the paper.
  *Note:* A reader who built the list can check it against his.
- `t57.2` **NOTICE** · *weak* · careful
  reads "If he wished to injure it why could he not do it there?"
  Holmes puts injuring the horse on the table as a natural aim.
- `t57.3` **QUESTION·turn-around** · *weak* · expert · from `t18.3`, `t57.2` · Holmes ¶223
  Turned round: what needed doing **away from** the stable? Something that couldn't be done within earshot of the
  loft, or that needed light that would be seen.
  *Note:* It waits for the knife (`t80.2`) and the candle (`t78.3`).

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
  *Note:* ⚠ low: "a strap or tie" is close to Holmes's own guess (¶226).
- `t60.4` **INFER** · *strong* · careful · from `t60.1`, `t35.5`, `t32.2`, `t35.2` · Holmes ¶226
  The cravat is Simpson's, and it was in Straker's dead hand. Simpson parted with it before it came into Straker's
  hand, and Straker had it only after he left home at one and before he died.
  *Note:* Added in Round 54.

**¶62**
- `t62.1` **RECORD** · typical
  reads "a party of gypsies encamped on Monday night within a mile of the spot where the murder took place. On Tuesday they were gone."
- `t62.2` **HYPOTHESIS** · *weak* · typical · from `t62.1`, `t37.2`
  The gypsies have the horse. (Gregory's version adds Simpson leading the horse to them.)
- `t62.3` **DEFAULT·period** · *fair* · careful · from `t62.1`, `bk.gypsies` · undercuts `t62.2` · Holmes ¶114
  Under the period belief their leaving is to be expected either way, so it points at nothing. It fits the police
  theory only by its timing.
- `t62.4` **DROP** · *fair* · careful · from `t62.1`, `t62.3`, `bk.gypsies`, `bk.famous_horse`, `t46.3` · drops `t62.2` · Holmes ¶114
  They couldn't sell a horse everyone knows, taking him would bring the police down on them, and the theory
  explains nothing about the curry or the dog.

**¶64**
- `t64.1` **RECORD** · typical
  reads "I have also examined every stable and out-house in Tavistock, and for a radius of ten miles"
- `t64.2` **TEST** · *fair* · typical · from `t64.1` · strains `t14.3 (stable)`, `t40.4`
- `t64.3` **HYPOTHESIS** (PHYSICAL) · *weak* · expert · from `bk.blaze`, `bk.famous_horse`, `t64.1` · undercuts `t64.2` · Holmes ¶198, ¶202
  A search finds a horse only if the searchers recognise him, and his name says how they would: a blaze. A horse
  with the blaze dyed out is one more bay among bays.
  *Note:* ⚠ medium: the reader needs `bk.blaze`, and the disguise isn't confirmed until ¶198.

**¶66**
- `t66.1` **RECORD** · typical
  reads "As Desborough, their horse, was second in the betting"; "Silas Brown, the trainer, is known to have had large bets upon the event, and he was no friend to poor Straker. We have, however, examined the stables"
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

### State of mind after s03

The police theory is losing (`t58.3`, `t58.4`, `t56.1`). The night has split into three stories (`t68.3`): who
took the horse out (inside, probably Straker, `t46.4`), what killed Straker (`t46.6`), and where the horse is
(Mapleton, perhaps disguised, `t40.4`, `t64.3`). The missing piece is **a motive for Straker** (`t46.5`).

---

## s04 Straker's villa: the pockets and Mrs. Straker (¶70–¶92)

**¶69–¶70**
- `t70.1` **GENRE·watch-holmes** · *strong* · careful · Holmes ¶216
  reads "There was a gleam in his eyes and a suppressed excitement in his manner which convinced me ... that his hand was upon a clue, though I could not imagine where he had found it"
  Holmes has had the key insight in the carriage. Nothing new has reached him except Gregory's answers, so the
  clue is among facts the reader also has.
- `t70.2` **GENRE·re-read** · careful · from `t70.1`
  Go back over the recital with one question: which fact would make a man start?
  *Note:* For a reader who missed `t37.6`, this is the prompt; a reader who already has it can confirm being there
  first.

**¶72–¶75**
- `t75.1` **GENRE·watch-holmes** · *fair* · careful · from `t70.1`, `t46.4`
  reads "He has been in your service some years, Colonel Ross?" "I have always found him an excellent servant."
  Right after his insight, Holmes asks the dead man's employer about **the dead man's character**. That is the
  question he would ask if the insight implicated Straker.

**¶78**
- `t78.1` **RECORD** · *strong* · typical
  reads "a box of vestas, two inches of tallow candle, an A.D.P. briar-root pipe, a pouch of seal-skin ... a silver watch with a gold chain, five sovereigns in gold, an aluminium pencil-case, a few papers, and an ivory-handled knife with a very delicate, inflexible blade"
- `t78.2` **INFER** · *strong* · typical · from `t78.1`, `t35.2`
  Five sovereigns and a gold-chained watch are still on the body. Not a robbery, and nobody searched him.
- `t78.3` **NOTICE** · *fair* · careful · from `t78.1` · Holmes ¶224 (the Colonel)
  **A candle** as well as matches. Matches go with the pipe; a candle is for close work in the dark.
- `t78.4` **ABSENCE** · *weak* · expert · from `t78.1`, `t32.2`
  No lantern. He set out on a dark night to inspect the stables and took a candle stub, not a lantern.
- `t78.5` **PREDICT** · *weak* · careful · from `t78.3`, `t37.1` · Holmes ¶102–¶106
  If he lit a match in the hollow, a spent one may be in the mud there.

**¶79–¶81**
- `t80.1` **RECORD** · *strong* · typical
  reads "It is what we call a cataract knife"
- `t80.2` **NOTICE** · *strong* · typical · from `t80.1`, `t32.1` · Holmes ¶81, ¶221
  A horse-trainer carrying **a surgeon's eye-knife** on a night when he expected trouble.
  *Note:* This is the loudest clue in the story, and the story says so through Holmes. Dated ¶80 in Round 160: the
  cataract knife is named there, a paragraph before Holmes calls it strange.
- `t81.1` **RECORD** · *strong* · typical
  reads "A very delicate blade devised for very delicate work"; "it would not shut in his pocket"
- `t81.3` **HYPOTHESIS** · *fair* · careful · from `t80.2`, `t57.2`, `t78.3`
  Why carry it: {the nearest weapon; **to operate on something that night**}? The only possible patient within
  a quarter mile is the horse.
- `t81.4` **AGENT** · *fair* · careful · from `t80.1`, `t81.1`, `t35.4`, `bk.weapon_choice` · strains `t81.3 (weapon)` · Holmes ¶221 ("no sane man would choose for a weapon")
  A man arming himself takes a stick or a poker.
- `t81.5` **INFER** · *fair* · careful · from `t81.3`, `t81.4`, `t57.3` · Holmes ¶221, ¶223
  He meant to **injure the horse, delicately, away from the stable**: away from the loft's hearing, by candle.
  *Note:* The specific operation (nicking a tendon under the skin, ¶221) is specialist knowledge. The general form
  is enough to carry the chain, and the game should accept it. The game holds it as a conditional: if Straker took
  the horse out (`t46.4`).

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
- `t84.6` **IDENTIFY·merge** · *fair* · careful · from `t84.9`, `t84.4`, `t84.5` · Holmes ¶225
  Derbyshire = Straker, provisionally.
- `t84.7` **NOTICE·calculate** · *fair* · careful · from `t84.1`, `t84.6`, `t19.1`, `bk.milliner_prices` · Holmes ¶225, ¶229
  £37 15s at a Bond Street milliner, for a man "comfortably off" on a trainer's means. There is a **lady** with
  expensive tastes who is not, or not openly, his wife: a second household, and money pressure.
- `t84.8` **REVISE** · *fair* · careful · from `t84.7`, `t28.3`, `bk.lay_against` · revises `t28.3`; answers `t46.5` · Holmes ¶220
  The motive: a man who needs money, and who controls the favourite, bets against him through others and makes
  sure he loses.
- `t84.9` **DEFAULT** · *fair* · careful · from `t84.1`, `t84.3`, `bk.bills` · Holmes ¶225 ("men do not carry other people's bills about in their pockets")
  Men don't carry other people's bills: the account in Straker's pocket was his own, whatever name it bears.
  Exception: settling it for a friend (`t84.4`).
  *Note:* Added in Round 46: Holmes's step, which `t84.3` notices and `t84.6` uses.

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
  reads "You wore a costume of dove-coloured silk with ostrich-feather trimming."; "I never had such a dress, sir"
- `t92.2` **INFER** · *fair* · careful · from `t84.1`, `t85.1`, `t85.2`, `t92.1` · Holmes ¶225
  The dress Holmes describes must come from the bill: he is running `t85.3`.
  *Note:* The reader has to supply this link. Fair-play note: the reader is shown the test and its result, not the
  item it tests.
- `t92.3` **WEIGH** · *fair* · careful · from `t92.1`
  Her denial is honest; she doesn't know what is being asked, which is why the trick works.
- `t92.4` **TEST** · *fair* · careful · from `t92.2`, `t92.3`, `t92.1`, `t85.1` · supports `t84.7`; refutes `t85.3 (a)` · Holmes ¶93, ¶225
  She never had it, so the costume went to another woman.
  *Note:* Holmes says as much at once, ¶93.
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
     horse (`t37.13`): no robbery (`t78.2`), no human killer needed, and the horse was there.
  9. The horse bolts. The nearest stable he could reach without being seen is Mapleton, where a searcher could
     miss him if the blaze were hidden (`t40.4`, `t64.3`).
- `t92.7` **DROP** · *fair* · careful · from `t92.6`, `t37.11` · drops `t37.10` · Holmes —
  The maid as drugger: the inside story explains the drugging and the night visit with one person, while the
  maid version needs two, and she has no motive beyond a bribe she ran away from.
- `t92.8` **QUESTION** · careful · from `t92.6`
  Who drugged the dish: Straker or his wife? The curry argument names the household; the dog and key arguments name
  the person who came at one. The default of `t37.16` (whoever drugged the guard took the horse) answers Straker;
  its exception, an accomplice, leaves his wife.
  *Note:* Holmes leaves the access question open (¶218).
- `t92.15` **INFER** · *fair* · careful · from `t92.4`, `t84.1`, `t85.1`, `bk.milliner_prices`, `bk.lay_against` · Holmes ¶225
  The costume went to another woman, and a trainer's household does not run to twenty-guinea dresses: if Derbyshire
  is Straker, Straker is keeping a second household, and its debts are his motive.
  *Note:* Added in Round 55.

**Predictions a reader can make here, before Holmes checks them:**
- `t92.9` **PREDICT** · *weak* · careful · from `t78.5` · Holmes ¶102–¶106
  A spent match in the hollow.
- `t92.10` **PREDICT** · *fair* · careful · from `t35.8`, `t35.9`, `t92.6` · Holmes ¶94–¶96
  The coat was laid on the bush, which will show if the night was still.
- `t92.11` **PREDICT** · *fair* · careful · from `t40.4` · Holmes ¶116–¶119
  The horse's tracks lead towards Mapleton.
- `t92.12` **PREDICT** · *fair* · careful · from `t92.5` · Holmes ¶229
  The milliner recognises Straker's photograph.
- `t92.13` **PREDICT** · *weak* · expert · from `t40.4`, `t92.6` · Holmes ¶111, ¶161
  The horse will be found in time to run, so Holmes will want him kept entered.
- `t92.14` **AGENT** → **PREDICT** · *weak* · expert · from `t81.5`, `bk.practice` · Holmes ¶170–¶175, ¶228
  A careful man doesn't attempt a delicate operation cold, so Straker practised on something first.
  *Note:* ⚠ high: reachable only by asking "would he do this cold?", and almost no first-time reader asks it.

**What remains uncertain:** what killed Straker (`t46.6`); why he carried the cravat (`t60.3`); who has the horse
(`t40.4`); who drugged the dish (`t92.8`).

**Difficulty, by profile.** A *typical* reader reaches the motive for Simpson, the knife as odd (`t80.2`) and
perhaps Derbyshire, and holds the police theory with doubts. A *careful* reader reaches the inside story through
step 7. Step 8 (the horse as killer, `t37.13`), the disguise (`t64.3`) and the practice (`t92.14`) are *expert*
moves: the game should treat them as bonuses, not as gates.

---

## s05 The hollow (¶93–¶113)

From here on, Holmes acts and the reader checks. The reader's moves are mostly TEST (a prediction scored, a
scenario confirmed or strained) and GENRE·watch-holmes (reading what Holmes looks for). The reader can still get
ahead by predicting what each action will find.

**¶93**
- `t93.1` **RECORD** · typical
  reads "A short walk across the moor took us to the hollow in which the body had been found. At the brink of it was the furze-bush upon which the coat had been hung."
- `t93.2` **GENRE** · *weak* · expert · from `t93.1` · supports `t92.10`
  The narrator says "hung", where ¶35 said "flapping". Watson writes with hindsight, so the narration may already
  carry the answer.
  *Note:* The answer comes at ¶96.

**¶94–¶97**
- `t95.1` **RECORD** · *strong* · typical
  reads "There was no wind that night, I understand," "None; but very heavy rain."
- `t95.2` **PHYSICAL** · *strong* · typical · from `t95.1`, `t35.1`, `t32.2` · refutes `t35.9 (blown)`; supports `t92.10` · Holmes ¶96
  With no wind, the coat wasn't blown onto the bush: it was put there.
  *Note:* A reader who made `t92.10` scores it here. Dated ¶95 in Round 160: Gregory's answer, its last premise, is
  there.
- `t97.1` **RECORD** · typical
  reads "Yes, it was laid across the bush."
- `t97.2` **AGENT** · *fair* · careful · from `t95.2`, `t97.1`, `t35.2`, `bk.coat_work` · strains `t35.6`, `t46.1`; supports `t92.6` · Holmes ¶226
  A man in a desperate fight doesn't lay his coat across a bush. Straker took it off himself, before whatever
  happened, to do something that needed his arms free.

**¶98–¶100**
- `t99.1` **RECORD** · typical
  reads "the ground has been trampled up a good deal"; "A piece of matting has been laid here at the side, and we have all stood upon that"
- `t100.1` **NOTICE** (PHYSICAL) · *weak* · careful · from `t99.1`
  The surface has been trampled by searchers, so whatever evidence survives is under the mud or under the
  matting.

**¶101**
- `t101.1` **RECORD** · typical
  reads "one of the boots which Straker wore, one of Fitzroy Simpson's shoes, and a cast horseshoe of Silver Blaze"
- `t101.2` **TEST PLAN** · *fair* · careful · from `t101.1`, `t46.1`, `t92.6` · Holmes ¶107
  Compare the footwear with the prints in the hollow. If Simpson's shoe isn't there, the police theory loses its
  meeting in the hollow. Keep the horseshoe for the horse's track.

**¶102–¶106**
- `t102.1` **RECORD** · *strong* · typical
  reads "It was a wax vesta half burned, which was so coated with mud that it looked at first like a little chip of wood"
- `t102.2` **TEST** · *strong* · careful · from `t102.1`, `t78.1`, `t35.2` · supports `t78.5`, `t92.9`, `t92.6` · Holmes ¶224
  A light was struck in the hollow, as predicted. Step 7 of the inside story holds.
- `t102.3` **HYPOTHESIS** · *fair* · careful · from `t102.1`, `t78.1`, `t78.3`
  Why strike a match in the hollow at one in the morning: {to light his pipe; to light the candle and see to
  work}? The pipe is in his pockets, but so is the candle. Taken with the knife, the candle reading is the
  stronger.
- `t102.4` **PHYSICAL** · *weak* · expert · from `t102.1`, `t37.1`, `t35.2`, `bk.horse_kick` · supports `t37.13` · Holmes ¶226
  A match was struck in the dark beside the horse, and the man there died of one blow to the head. A horse startled
  by a sudden light kicks, and a shod hoof kills: the blow was the horse's.
  *Note:* ⚠ high: as with `t37.13`, the reader is primed for a human killer.
- `t106.1` **GENRE·watch-holmes** · *fair* · careful · from `t102.1` · supports `t92.9`
  reads "I only saw it because I was looking for it." "What! You expected to find it?" "I thought it not unlikely."
  Holmes predicted the match, so he holds the same picture of a light struck in the hollow.

**¶107**
- `t107.1` **RECORD** · typical
  reads "He took the boots from the bag, and compared the impressions of each of them with marks upon the ground. Then he clambered up to the rim of the hollow, and crawled about among the ferns and bushes."
- `t107.2` **ABSENCE** · *fair* · careful · from `t107.1`, `t101.2` · Holmes —
  **The result of the comparison is never reported.**
  *Note:* The reader is shown the test (`t101.2`) but not its outcome. This is a fair-play gap, and the game has to
  choose: withhold it as the story does, or reveal it here.

**¶108**
- `t108.1` **RECORD** · typical
  reads "I am afraid that there are no more tracks ... I have examined the ground very carefully for a hundred yards in each direction."
- `t108.2` **QUESTION** · careful · from `t108.1`, `t37.1`
  The horse was in the hollow and left it. How did he leave no tracks?

**¶109**
- `t109.1` **RECORD** · typical
  reads "I should like to take a little walk over the moor before it grows dark"; "I think that I shall put this horseshoe into my pocket for luck"
- `t109.2` **GENRE·watch-holmes** · *fair* · careful · from `t109.1` · supports `t92.11` · Holmes ¶117
  Holmes pockets the horseshoe, so he means to match a horse's track somewhere else. That is the reader's
  `t92.11`.

**¶110–¶111**
- `t111.1` **RECORD** · typical
  reads "whether we do not owe it to the public to remove our horse's name from the entries"; "Certainly not"; "I should let the name stand."
- `t111.2` **GENRE·watch-holmes** · *fair* · careful · from `t111.1` · supports `t92.13`, `t40.4`; strains `t14.3 (dead)` · Holmes ¶161
  Holmes expects the horse to be alive and back in time to run.
  *Note:* A reader who made `t92.13` scores it here.

### State of mind after s05

The hollow has confirmed two predictions (`t95.2`, `t102.2`) and Holmes's behaviour matches the inside story
(`t106.1`, `t109.2`, `t111.2`). The police theory has nothing new in its favour, and the result that would
test it directly (`t107.2`) is withheld. Open: where the horse went (`t108.2`), what killed Straker (`t46.6`).

---

## s06 Across the moor to Mapleton (¶114–¶143)

**¶114**
- `t114.1` **RECORD** · typical
  reads "The horse is a very gregarious creature. If left to himself his instincts would have been either to return to King's Pyland or go over to Mapleton."
- `t114.2` **DEFAULT** · *fair* · typical · from `t114.1`, `bk.horse_gregarious`, `t37.1` · supports `t40.4` · Holmes ¶114
  A second route to Mapleton: a loose horse makes for the stables he knows or the nearest other horses. The reader's
  route (`t40.4`, motive and the capacity to hide) arrived at ¶40; Holmes's arrives here, by instinct.
  *Note:* Both should be valid in the game.
- `t114.3` **TEST** · *fair* · careful · from `t114.1` · supports `t62.4` · Holmes ¶114
  reads "These people always clear out when they hear of trouble ... They could not hope to sell such a horse."
  Holmes drops the gypsies with the reader's reasons.
  *Note:* A reader who made `t62.4` scores it.

**¶116**
- `t116.1` **RECORD** · typical
  reads "He is not at King's Pyland. Therefore he is at Mapleton."; "This part of the moor ... is very hard and dry. But it falls away towards Mapleton ... a long hollow over yonder, which must have been very wet on Monday night"
- `t116.2` **NOTICE** (PHYSICAL) · *fair* · careful · from `t116.1`, `t108.1` · answers `t108.2`
  The ground near the hollow is hard and dry, so it took no tracks. Tracks survive only where the ground was wet.
- `t116.3` **TEST PLAN** · *fair* · careful · from `t116.2`, `t40.4`, `t101.1` · Holmes ¶116
  Search the wet hollow on the line to Mapleton, with the horseshoe.

**¶117**
- `t117.1` **RECORD** · *strong* · typical
  reads "The track of a horse was plainly outlined in the soft earth in front of him, and the shoe which he took from his pocket exactly fitted the impression"
- `t117.2` **TEST** · *strong* · typical · from `t117.1` · supports `t40.4`, `t92.11`, `t116.3`
  Silver Blaze went towards Mapleton.
- `t118.1` **SET ASIDE** · typical
  reads "See the value of imagination ... It is the one quality which Gregory lacks"
  Holmes on method. It repeats `t39.3` and carries no case content.

**¶119–¶121**
- `t119.1` **RECORD** · *strong* · typical
  reads "Then we lost them for half a mile, but only to pick them up once more quite close to Mapleton"; "A man's track was visible beside the horse's."
- `t120.1` **INFER** · *strong* · typical · from `t117.1`, `t119.1` · strains `t46.1 (led the horse on)`; supports `t92.6` · Holmes ¶231
  reads "The horse was alone before"
  The horse went from the hollow alone; he wasn't led away by whoever was with Straker. He bolted, and the man's
  tracks join him only near Mapleton.
- `t120.2` **WEIGH** · *weak* · careful · from `t120.1` · supports `t37.13`
  Nobody left the hollow with the horse. That fits a death with no human killer present. It is consistent, not
  proof: a human killer could have fled on foot over the hard ground.
- `t120.3` **QUESTION** · typical · from `t119.1`
  Who is the man?

**¶122–¶123**
- `t122.1` **RECORD** · typical
  reads "The double track turned sharp off and took the direction of King's Pyland"
- `t122.2` **RECORD** · typical
  reads "saw to my surprise the same tracks coming back again in the opposite direction"
- `t122.3` **AGENT** · *fair* · careful · from `t122.1`, `t122.2`, `bk.leading_intent` · Holmes ¶146
  The man set out to lead the horse home to King's Pyland, then changed his mind and turned back. He found
  the horse first and made his decision afterwards.

**¶124**
- `t124.1` **RECORD** · *strong* · typical
  reads "It ended at the paving of asphalt which led up to the gates of the Mapleton stables"
- `t124.2` **INFER** · *strong* · typical · from `t124.1`, `t122.2`, `t117.1` · supports `t40.4`, `t64.3` · Holmes ¶146
  The horse was taken into Mapleton. Since Mapleton was searched (`t66.1`), the searchers missed him, and the
  disguise (`t64.3`) or some trick explains how.

**¶126–¶127**
- `t127.1` **RECORD** · typical
  reads "Should I be too early to see your master, Mr. Silas Brown, if I were to call at five o'clock to-morrow morning?" "Bless you, sir, if any one is about he will be, for he is always the first stirring."
- `t127.2` **GENRE·watch-holmes** · *fair* · careful · from `t127.1`
  Holmes asks who is about at dawn. He is testing who could have found a loose horse early on Tuesday morning.
- `t127.3` **AGENT** · *fair* · careful · from `t124.2`, `t127.1`, `t19.3` · Holmes ¶146
  No groom would dare to hide a stolen favourite on his own account. Whoever did it at Mapleton had the authority
  to.
- `t127.4` **HYPOTHESIS** · *fair* · careful · from `t127.1`, `t127.3`, `t124.2`, `t66.1` · answers `t120.3` · Holmes ¶146
  The man was **Silas Brown**: first up, master of the yard, with money on Desborough.
- `t128.1` **SET ASIDE** · typical
  reads "As Sherlock Holmes replaced the half-crown which he had drawn from his pocket"
  A tip offered and refused.
  *Note:* The game uses the half-crown as a starting item.

**¶129–¶136**
- `t133.1` **RECORD** · typical
  reads "Holmes leaned forward and whispered something in the trainer's ear. He started violently and flushed to the temples"; "It's a lie!"; "an infernal lie!"
- `t135.1` **WEIGH** · *fair* · careful · from `t133.1`, `bk.guilty_denial` · supports `t127.4`
  reads "Oh, come in if you wish to."
  A violent denial, followed at once by an invitation into the parlour. Whatever Holmes said hit something true.

**¶137–¶143**
- `t137.1` **RECORD** · typical
  reads "His face was ashy pale ... he cringed along at my companion's side like a dog with its master"
- `t140.1` **RECORD** · *strong* · typical
  reads "Your instructions will be done. It shall all be done"; "Oh no, there shall be no mistake. It shall be there. Should I change it first or not?"
- `t140.2` **INFER** · *strong* · careful · from `t140.1` · supports `t127.4` · Holmes ¶146, ¶204
  Brown has the horse and has agreed to produce it ("it shall be there"), and the obvious place is the race.
- `t141.1` **HYPOTHESIS** · *fair* · careful · from `t140.1`, `t64.3` · supports `t64.3` · Holmes ¶202–¶204
  reads "Should I change it first or not?"; "No, don't"; "I shall write to you about it."
  "Change it": the horse is **not in his own appearance** now, and Brown offers to restore it before the race.
  Holmes laughs and says no.
  *Note:* ⚠ medium: the reader needs `t64.3` already in mind to read "change it" this way.
- `t141.2` **PREDICT** · *fair* · careful · from `t141.1`, `t111.2` · Holmes ¶197–¶202
  Silver Blaze will run disguised, and Holmes intends a surprise.

### State of mind after s06

The horse question is settled for a careful reader: he bolted alone (`t120.1`), Brown found him and took him
into Mapleton (`t124.2`, `t127.4`), he is disguised (`t141.1`), and he will run (`t140.2`). Left: what killed
Straker, and confirmation of the motive.

---

## s07 The walk back (¶144–¶156)

**¶146**
- `t146.1` **RECORD** · *strong* · typical
  reads "Of course you observed the peculiarly square toes in the impressions, and that his own boots exactly corresponded to them"
  Square toes: nothing was said of them when we followed the tracks.
  *Note:* ⚠ fair play: disclosed late. Watson didn't report the square toes when they followed the tracks, so the
  reader couldn't have observed them.
- `t146.2` **TEST** · *strong* · typical · from `t146.1` · supports `t127.4`, `t127.3`, `t122.3`
  reads "no subordinate would have dared to do such a thing"; "according to his custom he was the first down"; "his first impulse had been to lead him back to King's Pyland"
  Holmes's account of Brown's morning matches `t122.3`, `t127.3` and `t127.4` point for point.
- `t146.3` **RECORD** · typical
  reads "from the white forehead which has given the favourite its name"
  The text confirms the meaning of the name (`bk.blaze`).
  *Note:* For a modern reader, this is the first time it is given.

**¶147–¶148**
- `t148.1` **RECORD** · typical
  reads "But his stables had been searched?" "Oh, an old horse-faker like him has many a dodge."
- `t148.2` **INFER** · *fair* · careful · from `t148.1`, `bk.horse_faker`, `t141.1`, `t66.1` · supports `t64.3` · Holmes ¶204
  A "faker" is one who disguises horses: that is how the search missed him.

**¶149–¶150**
- `t150.1` **AGENT** · *fair* · typical
  reads "he will guard it as the apple of his eye. He knows that his only hope of mercy is to produce it safe"
  Brown now has every reason to keep the horse safe.

**¶152**
- `t152.1` **SET ASIDE** · typical
  reads "the Colonel's manner has been just a trifle cavalier to me. I am inclined now to have a little amusement at his expense"
  Character, not case: he means to have some fun with the Colonel.

**¶154–¶156**
- `t156.1` **RECORD** · typical
  reads "this is all quite a minor point compared to the question of who killed John Straker"; "On the contrary, we both go back to London by the night train."
- `t156.2` **GENRE·watch-holmes** · *fair* · careful · from `t156.1` · supports `t37.13` · Holmes ¶206–¶214
  Holmes leaves Dartmoor while calling the murder the main question. He wouldn't leave a murderer at large to be
  caught, so either he already knows and needs nothing more on the spot, or there is no murderer to arrest. Both
  point to the horse.
  *Note:* ⚠ medium: a first-time reader takes this as Holmes being mysterious.

---

## s08 Departure: the photograph, the sheep, the dog (¶157–¶182)

**¶161–¶162**
- `t161.1` **RECORD** · typical
  reads "I have every hope, however, that your horse will start upon Tuesday, and I beg that you will have your jockey in readiness. Might I ask for a photograph of Mr. John Straker?"
- `t161.2` **TEST** · *fair* · careful · from `t161.1` · supports `t92.13`, `t140.2`
  The horse will run, as `t92.13` predicted.
- `t161.3` **GENRE·watch-holmes** · *fair* · careful · from `t161.1` · supports `t92.5`, `t92.12`, `t84.6`
  Holmes asks for Straker's photograph. That fits only one test: showing it at the milliner's.
  *Note:* A reader who made `t92.5` sees Holmes carrying out the same plan.

**¶163**
- `t163.1` **RECORD** · typical
  reads "I have a question which I should like to put to the maid"
- `t163.2` **ABSENCE** · *fair* · careful · from `t163.1` · Holmes —
  The question and its answer are never reported.
- `t163.3` **HYPOTHESIS** · *weak* · careful · from `t163.2`, `t92.8`, `t20.7`
  What did he ask: {who chose the curry that night; who was in the kitchen when the lad's dish was set aside;
  whether Straker came to the kitchen; about the dress}? Each fits a question left open (`t92.8`).
  *Note:* The game could let the player write the question Holmes asked.

**¶170–¶175**
- `t173.1` **RECORD** · *strong* · typical
  reads "You have a few sheep in the paddock"; "Who attends to them?"; "three of them have gone lame, sir"
- `t173.2` **TEST** · *strong* · careful · from `t173.1` · supports `t92.14`, `t81.5` · Holmes ¶228
  The prediction holds (`t92.14`): **lameness** is what the knife was for, and someone practised producing it.
  *Note:* For an expert who made `t92.14`, the prediction is scored. For everyone else it confirms `t81.5`.
- `t175.1` **INFER** · *fair* · careful · from `t173.1`, `t81.5`, `bk.practice` · Holmes ¶228
  reads "A long shot, Watson; a very long shot"; "this singular epidemic among the sheep"
  Holmes expected lame sheep. Sheep don't go lame three at a time without a cause; Straker practised on them.
  *Note:* For a reader who didn't predict it (`t92.14`), the step is made here.

**¶177–¶182**
- `t182.1` **RECORD** · *strong* · typical
  reads "To the curious incident of the dog in the night-time." "The dog did nothing in the night-time." "That was the curious incident,"
- `t182.2` **TEST** · *strong* · careful · from `t182.1` · supports `t34.2`, `t34.4 (knew)`
  The dog that did nothing: the silence noted at ¶34 (`t34.2`).
  *Note:* A reader who made `t34.2` at ¶34 scores it here, 148 paragraphs ahead.
- `t182.3` **GENRE·re-read** · typical · from `t182.1`, `t29.1`
  Go back to ¶29 and ¶34: the dog was there and made no sound; the visitor was someone it knew (`t34.4`).
  *Note:* For everyone else this is the prompt; a reader who made `t34.4` confirms it.

### State of mind after s08

Every part of the inside story has been confirmed by Holmes's actions except the cause of death. The open items
are what killed Straker (`t46.6`) and what Holmes asked the maid (`t163.2`).

---

## s09 The Wessex Cup (¶183–¶214)

**¶186**
- `t186.1` **RECORD** · typical
  reads "A child would know Silver Blaze, with his white forehead and his mottled off-foreleg"
  Two markings, not one. A disguise has to cover both.

**¶188–¶189**
- `t188.1` **RECORD** · typical
  reads "You could have got fifteen to one yesterday, but the price has become shorter and shorter, until you can hardly get three to one now"
- `t188.2` **NOTICE·calculate** · *fair* · careful · from `t188.1`, `bk.odds` · supports `t141.2` · Holmes ¶189
  Odds shortening from 15 to 1 to 3 to 1 means informed money: someone knows the horse will run.
  *Note:* Holmes, ¶214: "stand[s] to win a little". Dated ¶188 in Round 160: the odds are told there; Holmes remarks
  on them at ¶189.

**¶191**
- `t191.1` **RECORD** · typical
  reads "4. Colonel Ross’s Silver Blaze (black cap, red jacket)."

**¶192**
- `t192.1` **RECORD** · typical
  reads "We scratched our other one, and put all hopes on your word"
- `t192.2` **SET ASIDE** · typical · from `t192.1`, `t28.3`
  Bayard is withdrawn. The Bayard-specific reading of the tout's question ends here; its general pattern lived on
  in `t84.8`.

**¶194–¶198**
- `t198.1` **RECORD** · *strong* · typical
  reads "a powerful bay horse swept out from the weighing enclosure ... bearing on its back the well-known black and red of the Colonel"; "That beast has not a white hair upon its body."
- `t198.2` **IDENTIFY·merge** · *strong* · careful · from `t198.1`, `t191.1`, `t192.1`, `t66.1`, `t186.1`, `t141.1`, `t64.3` · supports `t141.2`, `t64.3` · Holmes ¶202
  The bay in Ross's colours is Silver Blaze with his markings hidden.
  *Note:* A reader who made `t64.3` or `t141.1` scores it before Holmes says so.

**¶200–¶204**
- `t200.1` **RECORD** · typical
  reads "the Colonel's horse, coming away with a rush, passed the post a good six lengths before its rival"
- `t202.1` **RECORD** · *strong* · typical
  reads "You have only to wash his face and his leg in spirits of wine, and you will find that he is the same old Silver Blaze as ever."
- `t202.2` **TEST** · *strong* · typical · from `t202.1` · supports `t198.2`, `t64.3`, `t148.2`
- `t204.1` **RECORD** · typical
  reads "I found him in the hands of a faker, and took the liberty of running him just as he was sent over."

**¶205–¶214**
- `t212.1` **RECORD** · *strong* · typical
  reads "The real murderer is standing immediately behind you."; "He stepped past and laid his hand upon the glossy neck of the thoroughbred."
- `t212.2` **TEST** · *strong* · expert · from `t212.1` · supports `t37.13`, `t120.2`, `t156.2`
  The horse killed Straker, as `t37.13` held.
  *Note:* A reader who made `t37.13` scores the hardest step in the story.
- `t212.3` **REVISE** · *strong* · typical · from `t212.1`, `t35.2` · revises `t35.2`, `t35.6`; refutes `t46.1`
  The "savage blow from some heavy weapon" was a hoof, and there were no assailants.
  *Note:* For everyone else: the revision a reader who did not make `t37.13` makes here.
- `t214.1` **RECORD** · *strong* · typical
  reads "it may lessen his guilt if I say that it was done in self-defence, and that John Straker was a man who was entirely unworthy of your confidence"
- `t214.2` **TEST** · *strong* · typical · from `t214.1` · supports `t92.6`, `t81.5`; strains `t19.4`
  "Self-defence": the horse struck back at something being done to him. Straker was the wrongdoer.

---

## s10 The explanation on the train home (¶215–¶231)

Holmes now states his whole route. The reader's moves are TEST (each of Holmes's steps against the reader's
own) and REVISE (the moment the old cards change meaning). This scene also serves as a **fair-play audit**: which
of Holmes's facts the reader had, and which appear here for the first time.

**¶216**
- `t216.1` **RECORD** · typical
  reads "I went to Devonshire with the conviction that Fitzroy Simpson was the true culprit"; "It was while I was in the carriage, just as we reached the trainer's house, that the immense significance of the curried mutton occurred to me"
- `t216.2` **TEST** · *strong* · careful · from `t216.1` · supports `t70.1`, `t12.1`
  Holmes held the police theory until ¶69; the curry (`t37.6`–`t37.8`) was in hand at ¶37, and the story says so.
  *Note:* A reader who made `t37.6`–`t37.8` at ¶37 was ahead of Holmes by 32 paragraphs.

**¶218**
- `t218.1` **RECORD** · *strong* · typical
  reads "Powdered opium is by no means tasteless. The flavour is not disagreeable, but it is perceptible."
  Opium can be tasted: the fact the curry turns on (`t37.6`), stated at last.
  *Note:* ⚠ fair play: `bk.opium_taste` is first stated here. A reader without it couldn't make `t37.6`. The game
  should offer it as a background card early on.
- `t218.2` **TEST** · *strong* · careful · from `t218.1` · supports `t37.6`, `t37.7`, `t37.8`, `t37.4`, `t46.3 (1)`
  reads "it is surely too monstrous a coincidence"; "The opium was added after the dish was set aside for the stable-boy"
- `t218.3` **NOTICE** · *weak* · careful · from `t218.1`, `t37.9`
  reads "Straker and his wife, the only two people who could have chosen curried mutton for supper that night"; "Which of them, then, had access to that dish without the maid seeing them?"
  Holmes excludes the maid without argument, and then leaves his own access question unanswered. `t92.8` is
  answered only by the default of `t37.16`, whose exception (an accomplice) he never rules out.

**¶219**
- `t219.1` **TEST** · *strong* · careful · supports `t34.2`, `t34.3`, `t34.4 (knew)`
  reads "though some one had been in and had fetched out a horse, he had not barked enough to arouse the two lads in the loft. Obviously the midnight visitor was some one whom the dog knew well."
  "Not barked enough to arouse": Holmes handles the sound-sleepers defeater (`t34.3`) the same way the reader
  did.

**¶220**
- `t220.1` **RECORD** · *strong* · typical
  reads "For a dishonest one, obviously, or why should he drug his own stable-boy?"; "trainers have made sure of great sums of money by laying against their own horses, through agents, and then preventing them from winning by fraud"
  Laying against one's own horse (`bk.lay_against`), stated at last.
  *Note:* ⚠ fair play: `bk.lay_against` is first stated here.
- `t220.2` **TEST** · *strong* · careful · from `t220.1` · supports `t46.4`, `t84.8`, `t28.3`
- `t220.3` **NOTICE** · *fair* · careful · from `t220.1`, `t92.8` · answers `t92.8`
  "His own stable-boy": Holmes attributes the drugging to Straker without answering the access question he raised
  at ¶218. The attribution rests on the default of `t37.16` (whoever drugged the guard took the horse), not on
  evidence of who had the dish; its exception, an accomplice, is the open part.

**¶221–¶223**
- `t221.1` **RECORD** · *strong* · typical
  reads "a knife which certainly no sane man would choose for a weapon"; "it is possible to make a slight nick upon the tendons of a horse's ham, and to do it subcutaneously, so as to leave absolutely no trace"
  The nick in the tendon: the operation itself, never needed for the chain (`t81.5`).
  *Note:* ⚠ fair play: `bk.tendon_nick` is first stated here, and it was never needed: the general form (`t81.5`) is
  enough.
- `t221.2` **TEST** · *strong* · careful · from `t221.1` · supports `t81.4`, `t81.5`, `t173.2`
- `t223.1` **TEST** · *fair* · expert · supports `t57.3`
  reads "So spirited a creature would have certainly roused the soundest of sleepers when it felt the prick of the knife. It was absolutely necessary to do it in the open air."
  The turn-around (`t57.3`) had two answers, noise and light. Holmes gives noise.

**¶224**
- `t224.1` **TEST** · *strong* · careful · from `t78.1`, `t102.2` · supports `t78.3`, `t102.2`, `t102.3 (candle)`
  reads "Of course that was why he needed the candle, and struck the match."
  The Colonel, not Holmes, makes this step.
  *Note:* A character in the story performs a reader's move.

**¶225**
- `t225.1` **TEST** · *strong* · careful · supports `t84.3`, `t84.6`, `t84.7`, `t85.3`, `t92.2`, `t92.4`, `t92.5`
  reads "men do not carry other people's bills about in their pockets"; "Straker was leading a double life, and keeping a second establishment"; "I questioned Mrs. Straker as to the dress without her knowing it"; "by calling there with Straker's photograph I could easily dispose of the mythical Derbyshire"
  Every step of the Derbyshire chain matches, including the hidden dress test (`t92.2`).

**¶226**
- `t226.1` **RECORD** · *strong* · typical
  reads "Straker had led out the horse to a hollow where his light would be invisible"; "Simpson in his flight had dropped his cravat, and Straker had picked it up—with some idea, perhaps, that he might use it in securing the horse's leg"; "the creature frightened at the sudden glare ... had lashed out, and the steel shoe had struck Straker full on the forehead"; "He had already, in spite of the rain, taken off his overcoat in order to do his delicate task, and so, as he fell, his knife gashed his thigh."
- `t226.2` **REVISE** · *strong* · typical · from `t226.1` · revises `t35.4`, `t35.5`, `t35.6`, `t35.8`, `t36.1`; supports `t60.3 (strap)`, `t97.2`, `t44.2`, `t37.13`
  The cravat wasn't torn from an assailant; the knife wasn't a weapon; the coat wasn't lost in a struggle; the thigh
  cut came from the knife in his own hand as he fell (the second mechanism of `t44.2`); "assailants" was the horse.
  *Note:* The moment the old cards change meaning.
- `t226.3` **WEIGH** · *fair* · careful · from `t226.1`
  "With some idea, perhaps": even Holmes only guesses at the cravat. `t60.3` stays a hypothesis at the end of the
  story.

**¶228**
- `t228.1` **TEST** · *strong* · careful · supports `t92.14`, `t175.1`
  reads "so astute a man as Straker would not undertake this delicate tendon-nicking without a little practice. What could he practice on? My eyes fell upon the sheep"

**¶229**
- `t229.1` **RECORD** · *strong* · typical
  reads "the milliner, who had recognised Straker as an excellent customer of the name of Derbyshire, who had a very dashing wife, with a strong partiality for expensive dresses"
  An offstage test, reported after the event.
- `t229.2` **TEST** · *strong* · careful · from `t229.1` · supports `t92.12`, `t84.6`, `t84.7`

**¶230–¶231**
- `t231.1` **TEST** · *strong* · typical · supports `t120.1`, `t124.2`, `t127.4`
  reads "Ah, it bolted, and was cared for by one of your neighbours. We must have an amnesty in that direction"

---

## After the story: the audit

### The beat-Holmes windows

Key conclusions, the earliest paragraph at which the reader can reach them, and the paragraph where Holmes (or
the story) states them.

| Conclusion | Reader, earliest | Profile | Holmes | Window |
|---|---|---|---|---|
| The drugger is of the household (curry) | ¶37 `t37.8` | careful | ¶216/¶218 (realised ¶69) | 32–181 ¶ |
| The visitor was known to the dog | ¶34 `t34.4` | careful | ¶182, ¶219 | 148 ¶ |
| Straker took the horse out | ¶46 `t46.4` | expert | ¶220 | 174 ¶ |
| The horse is at Mapleton | ¶40 `t40.4` | careful | ¶116 | 76 ¶ |
| The horse is disguised | ¶64 `t64.3` | expert | ¶202 | 138 ¶ |
| The knife was for the horse | ¶81 `t81.5` | careful | ¶221 | 140 ¶ |
| Derbyshire is Straker, another woman | ¶84–¶92 `t84.6`, `t92.4` | careful | ¶225, ¶229 | 133+ ¶ |
| A match struck in the hollow | ¶78 `t78.5` | careful | ¶102 | 24 ¶ |
| The coat was laid down | ¶35 `t35.8` (weak), ¶92 `t92.10` | careful | ¶96 | 4–61 ¶ |
| The horse killed Straker | ¶37 `t37.13` | expert | ¶212 | 175 ¶ |
| He practised on the sheep | ¶92 `t92.14` | expert | ¶173, ¶228 | 81 ¶ |

### Fair-play gaps: what the reader wasn't given in time

| Item | Where it should be | Where it appears | Consequence for the game |
|---|---|---|---|
| Opium's taste (`bk.opium_taste`) | before ¶37 | ¶218 | offer as a background card |
| Laying against one's own horse (`bk.lay_against`) | before ¶84 | ¶220 | offer as a background card; the tout's question (`t28.3`) is the only hint |
| What a blaze is (`bk.blaze`) | before ¶64 | ¶146 | offer as a background card |
| The tendon nick (`bk.tendon_nick`) | not needed | ¶221 | accept the general form (`t81.5`) |
| The items on the milliner's bill | ¶85 | never (only inferred, `t92.2`) | decide whether the bill card lists the dove-coloured silk |
| The result of the boot comparison | ¶107 | never (`t107.2`) | withhold as the story does, or reveal |
| The square toes of Brown's boots | ¶119 | ¶146 (`t146.1`) | the track card could carry the detail at ¶119 |
| Holmes's question to the maid | ¶163 | never (`t163.2`) | let the player write the question |
| The milliner's recognition | — | ¶229, offstage | a TEST PLAN whose result arrives late |

### Wrong turns supported

The paper as opium (`t24.3` → `t58.3`), the gypsies (`t62.2` → `t62.4`), Silas Brown as organiser (`t66.3` →
`t68.2`), the maid (`t37.10` → `t92.7`), and the police scenario as a whole (`t46.1`, strained throughout,
refuted at `t212.3`). Bayard (`t192.2`) and the field-glass (`t6.2`) end as SET ASIDE.

### Still open when the story ends

Who put the opium in the dish (Holmes asserts Straker, `t220.3`, by the default of `t37.16`; an accomplice is its
exception), why Straker carried the cravat (`t226.3`), what
Holmes asked the maid (`t163.2`), and what the boot comparison showed (`t107.2`). The game shouldn't ask the
player to prove anything the story itself leaves open.

---

## Notes for the next pass (not yet a gap analysis)

Observations from writing the pilot that bear on the format and the game. To be turned into a proper gap
analysis once the whole story is annotated.

- **Most of the work is weighing and noticing, not deducing.** The INFER steps are short and few. The decisive
  moves are NOTICE and ABSENCE (`t37.6`, `t80.2`, `t84.3`, `t34.2`), WEIGH and SOURCE (`t35.6`, `t36.2`,
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
- **The second half is scoring, not solving.** From ¶93 on, most thoughts are TEST: a prediction made earlier is
  confirmed (`t95.2`, `t102.2`, `t117.2`, `t173.2`, `t198.2`, `t212.2`). The game's payoff loop is a prediction
  sealed early and opened when the story reaches it, and the windows table shows how large the windows are.
- **Holmes's actions are tests the player can anticipate.** The horseshoe in his pocket (`t109.2`), "let the name
  stand" (`t111.2`), the photograph (`t161.3`), leaving for London (`t156.2`): each is a TEST PLAN the player could
  have written. Matching Holmes's next action is a natural game action ("what will Holmes do next, and why?").
- **The REVISE moment is one paragraph** (`t226.2`): five old cards change meaning at once. For the reader who
  got there first, the same paragraph is a series of TESTs. The game should present it both ways: as a reveal for
  the player who didn't get there, and as confirmation for the player who did.
- **The story leaves things open, and the fair-play table lists the late facts.** The format needs a way to mark
  a fact as disclosed late or never, and the game needs a policy for each one (withhold, supply as a background
  card, or let the player supply it).
- **Characters make reader moves too** (the Colonel at `t224.1`, Watson at `t44.1`, Watson's "the horse was alone
  before" at `t120.1`). A game could credit the player for making a move before the character who makes it in
  the text.
