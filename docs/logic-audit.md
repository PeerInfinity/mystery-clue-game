# Logic audit: how much of each answer's reasoning Watson's timeline supports

*2026-11-05. Spoilers throughout (like `case-format.md`). Measured on the data and code as of commit `d96df5b`
(likely clashes built). Nothing was changed for it.*

The aim, the user's: every gated answer of Watson's timeline (`world.html`) should be reachable by the player's own
reasoning before distracting data is added. This audit follows, for each gated question, the chain a careful reader
uses (`answer_from` and its `from` chain in `cases/silver-blaze/thoughts.json` / `docs/reading-annotated.md`, plus
the question's possibilities and their `from`/`out`/`by`), and marks each link against what the page has now.

## Progress

- **Step 1 built (2026-11-05):** `also_right` (any valid answer is accepted: q.why_out's light, q.motive's bets) and
  the six likely clashes and the ¶39 assertion below. With them stranger_identity is told at ¶39; paper_contents,
  weapon (the stick), derbyshire and bay have a likely clash against their wrong answer; straker_aim has one against
  "to see that all was well" from ¶34; who_killed one against Simpson from ¶41. The table below is the measurement
  before any of it.
- **Step 2 built (2026-11-05):** the drugging typed, the guard need (Hunter on watch), the dog's need from "did not
  bark", one culprit in "What is this for?", and four likely clashes (barking unheard, the opium at the window or on
  the path, exercise against Straker's drugging). who_drugged, horse_out_by and dog_barked now have a route from ¶46
  (the drugging serves Straker's plan; the dog knows him and not Simpson); drug_where has its wrong answers strained;
  straker_aim's ¶46 link is a likely clash. door_opened_by waits for step 3 (the key).
- **Step 3 built (2026-11-05):** "Who had a key to the stable door?" (raised ¶57; Straker, Hunter also right), a
  circled holder meeting the key need; plan steps ordered by need at equal times. door_opened_by has its route from
  ¶57. The gate now holds 27 questions.

## Summary

The gate holds **26 questions** (`GATED` in `ui/world.js`: an answer, raised, not latent, `answer_inferable_at` before
`answer_given_at`). The two answered questions outside it are Straker's honesty (latent) and how the cravat came into
his hand (no earlier reach).

| Status | Count | Questions |
|---|---|---|
| **Supported** by reasoning | 8 | stranger_aim, why_out, straker_aim (from ¶57), coat (from ¶95–97), thigh_cut, struggle_with_man (from ¶97), why_knife, why_light |
| **Supported** only by being told early | 3 | madam_derbyshire (¶92), horse_changed (¶140), sheep_lame (¶175) |
| **Partial** | 7 | paper_contents, stranger_identity, who_drugged, door_opened_by, horse_out_by, who_killed, horse_where |
| **Missing** | 8 | drug_where, dog_barked, weapon, derbyshire, track_man, track_man_aim, bay, motive |

Against the previous session's rough estimate:

- **Better than guessed:** horse_changed is told at the paragraph that raises it (Brown's "Should I change it
  first?", ¶140, asserts it); sheep_lame two paragraphs after it is raised (Holmes's "long shot", ¶175); the "not
  modelled" verdict on both was about the careful reader's early reach (¶64, ¶92), which comes before either question
  is raised and so does not matter to the gate. struggle_with_man is supported from ¶97 by a strain, not just partial.
- **Worse than guessed:** paper_contents is only partial (the lapse rules out a drug, but nothing separates money from
  a message); who_killed and weapon are not supported by "What stopped it?" (a circled Simpson stops the injuring
  just as well as the horse), and weapon has nothing at all in play (its one strain, the police's repeated blows
  against a single blow, sits between two story facts, so it shows only at the give-away). drug_where is missing,
  not partial: nothing on the page bears on it except Hunter's false belief.
- **The largest single gap is one cluster, not absence alone:** the night at the stable (who drugged the supper, where,
  who opened the door, who led the horse out, the dog). Five questions hang on four links the page lacks: the guard
  drugged *so that* the horse could be taken (one culprit), who holds a key, the dog that knew the visitor, and the
  alarm Straker never raised. Absence is two of the four.

Reading the counts: 11 of 26 have a route now, but six of the eleven (straker_aim, coat, struggle_with_man and the
three told ones) only from a paragraph well after `answer_inferable_at`; for the gate that is enough (the player can
commit on a route before the give-away), for the careful reader's early reach it is not.

## How each link was marked

- **Supported:** a move (a)–(d), "does it account for this?", "compare plans", "What stopped it?", a typed rule or
  need, a certain contradiction with a claim the player can trust, or a likely clash shown in play (one side the
  player's circle), gives the reader's step or rules out its rivals.
- **Partial:** the page checks the answer for consistency (it fits, nothing contradicts it) but gives no route that
  favours it over a rival that fits as well.
- **Missing:** nothing on the page bears on the link.
- **Told:** a claim asserting the answer reaches the timeline before the give-away (`asserts` on a `says`/`believes`
  fact). A wrong circle then meets a certain contradiction, as long as the player trusts the speaker. Listed in the
  table because it moves the real gap: from `answer_inferable_at` up to that paragraph the reasoning is what the player
  needs; after it, trust is.

Only facts with a `given_at` (or stated facts) reach the timeline: an inferable fact with no `given_at` never does
(`givenAt` in `engine/world.js`), so the horse's route by its tracks (¶117–122) is not on the page at all, and the
inferable facts given late (the opium added after the dish was set apart, ¶218; Straker's opening the door, ¶220; the
horse into Mapleton, ¶146) are on it only from their give-away.

## The table

Give-away ¶ is `answer_given_at`; reach ¶ is `answer_inferable_at`.

| Question | Answer | Reach ¶ | Give-away ¶ | Status | What supports it | What is missing |
|---|---|---|---|---|---|---|
| stranger_aim: What did the stranger want? | information to bet on | 28 | 218 | Supported | (c): asking for the tip serves "to know the tip", not "the way" or the other aims; strain s.lost_knows (¶24); told ¶28–29 (his own question, Hunter's "tout") | — |
| paper_contents: What was in the paper? | money (a bribe) | 24 | 58 | Partial | (c) lapse: a drug takes the paper's link off ("a poisoner would not ask a witness") | money vs a message: both make the boy willing in `give`; nothing reads "you won't be a loser" (a reward) as money |
| stranger_identity: Who was the stranger? | Simpson | 39 | 40 | Partial | the police's suspect is the menu's direct possibility (¶39); told ¶40 (the give-away itself) | ¶39 → ¶40 is one step of the story's own ("the man upon whom suspicion naturally rested" arrested): `f.police_suspect` asserts nothing, so nothing checks a circle at ¶39 |
| who_drugged: Who drugged the supper? | Straker | 46 | 220 | Partial | strain s.stranger_menu (¶37): the stranger could not have known the dish | within the household nothing narrows it (Straker, Mrs Straker, the lads, Edith): the drugging is not a typed action, so it links to no plan (one culprit, t37.16), and the key, the dog and the alarm (t46.4) are absent |
| drug_where: Where was the opium put in? | at the house, after the portion was set apart | 37 | 218 | Missing | — (Hunter's false belief asserts the window) | the portion drugged and the dish not (a contents change after the split, t37.3) is not typed; where the drugging was is not tied to who did it |
| dog_barked: Did the dog bark? | did not bark | 34 | 181 | Missing | — | a guard dog barks at a stranger (bk.guard_dog, t29.4); the lads heard nothing (t34.2); the visitor known to the dog (t34.4): no expectation, absence or reaction |
| door_opened_by: Who opened the door? | Straker | 46 | 220 | Partial | (a) gives the night's unlocking and opening, recognised as the entry; each circled candidate's needs (at the door, a key): "nothing says" for Straker and for Simpson alike; the police plan's unmet key (d) | who holds a key (t31.4: Hunter, the trainer, a copy); the dog knew him; no alarm; Straker at the stable at one (his going out is not a typed location) |
| horse_out_by: Who led the horse out? | Straker | 46 | 220 | Partial | "nobody" crossed by strain s.bridled; Straker's plan fits (with why_out, the knife, the light); the police plan has unmet needs (opium, key, hiding-place) and compares badly with "injure it there" | nothing favours Straker over Simpson except unmet needs on the police side; Straker's own side has the same unmet door; one culprit, the dog and the alarm as for door_opened_by |
| why_out: Why take the horse out? | to do something that would be heard | 57 | 223 | Supported | circling it adds the need "away from the stable" to injuring, so leading out serves the aim; the lapse says so when uncircled | noise vs light: both fit equally (and both are in the truth: the match is struck); only the key separates them |
| straker_aim: Why did Straker go out at one? | to injure the horse | 46 | 221 | Supported from ¶57 | told ¶57 (Holmes's objections name injuring); the aim's intended last step, (d), "What stopped it?" | ¶46 link (t46.7): drugging the guard serves no honest aim; "for exercise" accounts for no drugging. Needs the drugging typed (see who_drugged) |
| coat: How did the coat come to the bush? | Straker took it off himself | 35 | 226 | Supported from ¶95–97 | strains s.coat_wind (¶95), s.coat_fight (¶97); told ¶96 (Holmes: "placed") | why he took it off (work) is not linked to the plan; ¶35's weak reach has nothing |
| who_killed: Who struck the blow? | Silver Blaze | 37 | 212 | Partial | "What stopped it?": the horse's kick (circled) stops the injuring; the horse in the hollow at the time is on the timeline (¶37) | a circled Simpson stops it too. Missing: a striker must be where the struck man is (horse: met; Simpson: nothing says); a single blow, not repeated (s.blows, key only); no fight with a man, so not Simpson; s.police_coat key only |
| weapon: What made the blow? | a hoof | 37 | 226 | Missing | — | not tied to who_killed (the weapon is the striker's item); s.blows (single blow vs the police's repeated blows) has both sides as facts, so it never shows in play |
| thigh_cut: What made the cut? | Straker's own knife | 43 | 226 | Supported | told ¶44 (Holmes: "probable"); the answer-action's needs (carrying the knife, struck down) met by his taking it and the kick | — |
| struggle_with_man: Did Straker fight a man? | no | 44 | 226 | Supported from ¶97 | strain s.struggle_coat (¶97) | ¶41–44 link: a knife clotted with blood and a suspect without a wound; the blood his own (the thigh cut) |
| horse_where: Where is Silver Blaze? | Mapleton | 40 | 146 | Partial | strains s.horse_moor, s.horse_gypsies (¶114); told ¶116 (Holmes: Mapleton) | ¶40 link (t40.4: Mapleton gains, can hide a horse among horses, two miles off); "dead in a pit", "taken far away", "a secret hiding-place" have nothing against them; the tracks to the Mapleton gates (¶124) are not readable |
| why_knife: What was the knife for? | delicate work | 81 | 221 | Supported | strains s.knife_weapon, s.knife_taken (¶82); told ¶81; circling adds carrying the knife to injuring, so the taking links | — |
| derbyshire: Who is William Derbyshire? | Straker | 84 | 229 | Missing | — | men don't carry other people's bills (t84.9); "his letters were addressed here" fits an alias as well (t84.5) |
| madam_derbyshire: Who is Madam Derbyshire? | another woman | 92 | 229 | Supported (told) | told ¶92: Mrs Straker's "I never had such a dress" contradicts a circle on her | that the dress Holmes names is the bill's (t92.2) is the reader's step, but the claim does the work |
| why_light: Why was a match struck? | to light the candle | 102 | 224 | Supported | presupposes the struck light; the candle answer adds a light to injuring, so the light links; the pipe links nothing | the need comes from the answer itself, so the support is "it makes the plan hang together", not evidence against the pipe |
| track_man: Whose track is beside the horse's? | Silas Brown | 127 | 146 | Missing | — (Brown's lie at ¶133 asserts "something else") | first up, master of the yard, large bets (t127.4); no groom would dare hide a favourite on his own account (t127.3) |
| track_man_aim: What did he mean to do? | lead it home, then hide it | 122 | 146 | Missing | — | the track turns toward King's Pyland and comes back (t122.3): a change of direction as a change of intention |
| horse_changed: Were his looks changed? | yes | 64 | 202 | Supported (told) | raised and told at ¶140 (Brown's "Should I change it first?"); Holmes's "faker" ¶148 | the blaze dyed out (t64.3) is the early reach, before the question is raised: not needed for the gate |
| sheep_lame: What lamed the sheep? | someone practised on them | 92 | 228 | Supported (told) | told ¶175 (Holmes's "long shot"), two ¶ after it is raised | a careful man practises a delicate operation first (t92.14): before the sheep appear, not needed for the gate |
| bay: What is the bay in Ross's colours? | Silver Blaze | 197 | 202 | Missing | — (Ross's "not mine" asserts the rival, false) | Ross had two horses in (¶28) and scratched the other (¶192): only Silver Blaze can carry his colours; the changed looks (¶140) explain the bay coat |
| motive: What drove Straker to it? | debts of a second household | 92 | 229 | Missing | — | the bill's £37 and 22-guinea dress for a trainer's means (t84.7), another woman (¶92), so a second household and its debts (t92.15); laying against his own horse (t28.3, t84.8) is the means, not exclusive |

## The chains, link by link

Only the links that matter for the status are listed; a link already on the timeline as a stated fact is not.

**stranger_aim** (¶22–28). Lost man knows the night arrangements → cover story (t24.2): *supported* (s.lost_knows).
Asks for the straight tip → wants information to bet on: *supported* (move (c), `checkFit`). The paper as a bribe for
the tip: *supported* along the chain, on the condition of the paper's kind.

**paper_contents** (¶24). "See that the boy has this to-night … prettiest frock" → a bribe to the maid, the paper for
the boy: *supported* as a plan link. Not a drug (a poisoner does not ask a witness to pass the poison): *supported*
(lapse). Money, not a note: *missing*. The `give` rule makes a message as persuasive as money; "you won't be a loser"
(¶28) promises gain.

**stranger_identity** (¶39). The police's suspect → the man Edith saw: *missing* as a check (`f.police_suspect` has no
`asserts`), *partial* because Simpson is the only named possibility. One paragraph of gate.

**The night at the stable** (who_drugged, drug_where, door_opened_by, horse_out_by, dog_barked; t46.4 is their
common root: "Straker himself took the horse out. He went out at one, had a key, was known to the dog, belonged to
the household that served the curry, raised no alarm, and took his coat off for some job").

| Link | Thought | Status | Now |
|---|---|---|---|
| The drugger chose or knew the dish; the stranger came with his paper ready made | t37.7, t37.8 | Supported | s.stranger_menu (¶37), crosses the stranger only |
| The opium went in after the portion was set apart | t37.3 | Missing | inferable fact `f.dish_drugged_after_parting`, on the timeline only at ¶218 |
| The guard was drugged so the horse could be taken: whoever drugged him took the horse (one culprit) | t37.16, bk.one_culprit | Missing | the drugging is no typed action; no action needs the guard out of the way |
| The door was opened with a key; who has one: Hunter, the trainer, a copy | t31.3, t31.4, t33.2 | Partial | (a) and (b) give the key need; nothing can meet it for anyone |
| A guard dog barks at strangers; nobody heard it; so the visitor was someone it knew | t29.4, t34.2, t34.4 | Missing | the dog is placed and tied (¶29), nothing more |
| Straker went to the stables and raised no alarm about a drugged guard and an empty stall | t34.5, t34.8 | Missing | "to see that all was well" has nothing against it |
| Straker took off his coat for some job | t35.8 | Supported from ¶95–97 | the coat strains; not linked to the job |
| Drugging a guard is for no honest purpose; not for exercise | t46.7 | Missing | "Does it account for this?" would do it, if the drugging were an action |
| Where the drugging was follows from who did it | t37.8 → household | Missing | the drug_where question stands alone |
| The bridle on: not loose by itself | (q.horse_out_by out at ¶46) | Supported | s.bridled |
| The police plan's unmet needs (opium, key, hiding-place) and the shorter "injure it there" | ¶57 | Supported | (d), compare plans |

**why_out** (¶57). Turned round: what needed doing away from the stable (t57.3): *supported* by the ruling (the reason
from a why-question; circling it makes leading out serve injuring). Noise rather than light: *missing*, but the two are
not really rivals (both are true of the night).

**straker_aim**. ¶46 link (t46.7): *missing*. ¶57 Holmes names injuring: *told*. The aim's last step, its needs, and
what stopped it: *supported*.

**coat**. No wind (¶95) and laid (¶97): *supported* (strains). Taken off for work (t35.8 → ¶226): *partial* (nothing
links it to the plan; not needed for the answer).

**who_killed / weapon / struggle_with_man.**

| Link | Thought | Status | Now |
|---|---|---|---|
| The horse was in the hollow at the time of the struggle | t37.1 | Supported | `f.horse_in_hollow` on the timeline from ¶37 |
| One crushing blow, with the horse present: the horse | t37.13 | Partial | "What stopped it?" accepts the horse, and Simpson as well |
| "Repeated blows" against "a savage blow" | t40.5 | Missing in play | s.blows, both sides facts: key only |
| A knife clotted with blood, and no wound on Simpson | ¶35, ¶41 | Missing | — |
| The cut on the thigh from his own knife (so the blood is his) | t43, ¶44 | Supported | told, answer-action |
| A man in a fight does not lay his coat across a bush | t97.2 | Supported | s.struggle_coat (¶97); s.police_coat key only |
| A striker is where the struck man is | — | Missing | `strike` needs only carrying the item |
| The weapon is the striker's item | — | Missing | q.weapon has no typed entry |

**thigh_cut**, **why_knife**, **why_light**: every link *supported* (see the table).

**horse_where.** Who gains (t18.2, t40.3): *missing*. Hidden among horses, at a stable in reach (t14.3, t19.5):
*missing*. A famous horse loose would be seen; gypsies flee (¶114): *supported* (strains). Mapleton (¶116): *told*. The
track into Mapleton (¶117–124): *missing* (the tracks' meaning is inferable, never on the timeline before ¶146).

**track_man, track_man_aim.** Leading toward King's Pyland, then back (t122.3): *missing*. The man had authority at
Mapleton, was first up, bet on the race (t127.3, t127.4): *missing*.

**horse_changed, bay.** Brown's "change it first?" (¶140): *told*. Bayard scratched, so the bay in Ross's colours is
his other horse (¶192, ¶197): *missing*.

**derbyshire, madam_derbyshire, motive.** The bill is his own (t84.9): *missing*. The alias's post (t84.5): *missing*.
Mrs Straker never had the dress (¶92): *told*. A second household's debts (t84.7, t92.15): *missing*. Laying against his
own horse (t28.3, t84.8): *missing*.

## The missing links by kind of logic

Each with a sketch of how it could fit what exists; moves and questions first, new engine rules last (the standing
preference).

### 1. A guard and what gets past it (the night at the stable)

*Links:* one culprit (t37.16), the drugging for no honest aim (t46.7), the dog that knew the visitor (t34.4), where the
drugging was. *Questions:* who_drugged, drug_where, door_opened_by, horse_out_by, dog_barked, and straker_aim at ¶46.

*Sketch:* type the drugging. q.who_drugged's entry becomes a `drug` action (`to: ned_hunter`, `item: opium`), so a
circled answer is an action of the hypothesis, as q.horse_out_by's is. Then a guarded place: the stable has guards
(Hunter on watch, ¶20; the dog, ¶29), and an action on what they guard (`lead_out`, `injure` in place, `open` the
door) needs each guard *unable to act* (`DISABLED`, already there for "What stopped it?") or *not alarmed*. With that,
move (c) links the drugging to whichever plan leads the horse out (t37.16 without an authored rule), and "Does it
account for this?" on an "exercise" aim says the drugging is unexplained (t46.7). The dog is a guard that is "not
alarmed" by someone it knows: what it knows comes from the question the player circles (q.dog_barked's "did not bark",
or a new "Whom would the dog let pass?"), the user's pattern of a need from a circle, so nothing on the timeline says
who matters before the player does. Where the drugging was (drug_where) could be the `at` of the drug action: the
drugger at the portion while it was apart from the dish, which the household answers meet and the stranger's does
not.

*Alternatives to discuss:* (i) the guard rule as above, generic (any guarded thing); (ii) only data: strains for each
pair (Simpson leading out vs the lads hearing nothing; "to see that all was well" vs no alarm); (iii) a why-question,
"Why drug the stable-boy?", whose answers ("so the horse could be taken unseen") add the need, as q.why_out does.

### 2. Who holds a key (and other default holdings)

*Link:* t31.4. *Questions:* door_opened_by, horse_out_by.

*Sketch:* a question from the story's own doubt, "Who has a key to the stable?" (Hunter, the trainer, someone with a
copy: Gregory's duplicate key is in the story at ¶58), raised at ¶33 when the door is found open, the player's own
"something else" possible. A circled holder meets the `key` need as the player's hypothesis, as `need` on q.why_out
adds a rule. The police plan's unmet key then turns on the player's own answer, not on missing data.

### 3. Absence: what should have happened and did not

*Links:* the dog (t29.4, t34.2), the alarm (t34.5, t34.8). *Questions:* dog_barked, and the Straker cluster.

*Sketch:* most of it is reached through kind 1 (the dog as a guard). The alarm is different: it is a reaction of an
honest agent who finds the guard drugged and the stall empty. Options: (i) a likely clash in data (`{q.straker_aim,
"to see that all was well"}` against the lads sleeping till seven: "A man who went to see all was well, and found the
stall empty and the guard drugged, would have raised the alarm"), cheap and within the ruling ("otherwise data");
(ii) an expected effect on the aim: an aim's goal implies what its agent does on finding it unmet, too general for
now. (i) is recommended.

### 4. Presence and the instrument of an action

*Links:* a striker at the struck man's place; the weapon as the striker's item; a cut assailant. *Questions:*
who_killed, weapon, struggle_with_man (earlier).

*Sketch:* add `{of: '$agent', at: '$to'}`-style presence to `strike` (the striker where the struck one is, at that
time): the horse in the hollow is met, Simpson "nothing says", the same display the door's candidates have. Tie
q.weapon to q.who_killed: the weapon is the `item` of the strike, so a circled weapon the circled striker could not
carry (a stick for the horse, a hoof for Simpson) lapses or contradicts. Re-side s.blows onto `{q.weapon, "Simpson's
Penang-lawyer"}` against the single savage blow, so it shows in play (data only). A strain for the bloodied knife and
the unwounded suspect (`{q.who_killed, simpson}` against `f.simpson_unhurt`, from ¶41) is data only too.

### 5. Traces

*Links:* the horse's tracks into Mapleton, the turn toward King's Pyland and back, the man's track. *Questions:*
horse_where (from ¶124), track_man_aim, track_man.

*Sketch:* a move "what made this?" on a trace fact (tracks, mud proofs, the half-burned vesta) giving the event that
left it, as move (a) gives a change: the track near Mapleton at dawn gives the horse there then, with the man beside
it; the double track turning and coming back gives a heading that changed, and two headings of one intention give a
change of aim (move (a) on an intention). The inferable facts already in the data (`f.horse_wet_hollow`,
`f.horse_near_mapleton`, `f.man_with_horse`, `f.man_turns_back`, `f.horse_into_mapleton`) would become the move's
results, entries of Watson's reasoning. Who the man was (t127.3, authority at Mapleton) is a judgement of role: a
question ("Who at Mapleton could hide a stolen favourite?") or a strain against Dawson ("a groom would not dare") fits
better than a rule.

### 6. Identity by elimination over a set, and aliases

*Links:* the bay (Ross's two entries, one scratched), William Derbyshire (the bill is his own), Madam Derbyshire
(told). *Questions:* bay, derbyshire.

*Sketch:* bay: the bay carries Ross's colours, so it is one of Ross's entries (¶28: Silver Blaze and Bayard); Bayard was
scratched (¶192): a set elimination, which would be a new small rule (an identity from an exhaustive list), or a
likely clash in data (`{q.bay, "another horse in Ross's colours"}` against `f.bayard_scratched`: "Ross had two horses
in, and scratched the other"). Derbyshire: the default "men don't carry other people's bills" with its exception
("settling it for a friend") is a likely clash in its nature (`{q.derbyshire, "a friend of Straker's"}` against the
bill in Straker's pocket), weakened by t84.5. Data seems the right home for both: they are judgements, not mechanics.

### 7. Motive: goals that serve goals

*Links:* t84.7, t92.15, t28.3, t84.8. *Question:* motive (and the latent straker_honest).

*Sketch:* the "in order to" chain of goals the rulings already name: injured → does not win → bets against him won →
money → debts paid. Move (c) between intentions (an aim serving a motive) needs only that a goal can bring about
another (like `CARRY_RAMIFIES`: a horse injured does not win; a horse that does not win pays a layer). The motive's two
answers are not exclusive (the note on q.motive): the debts are the motive, laying against the horse the means; the
gate may want either accepted, or the question split. Needs kind 6 (the second household) first. The rulings left
"the goal and its motive as a move" for "later, only if the logic needs it": the motive question is where it does.

### 8. Small data gaps

- stranger_identity: `f.police_suspect` could assert `{q.stranger_identity, simpson}` (the police's suspicion is
  that the stranger is Simpson), making ¶39 a told link; or the question's `answer_inferable_at` moves to ¶40, which
  takes it out of the gate.
- paper_contents: money vs a message. A message does not make a boy willing the way money does; `give`'s `willing`
  effect could hold for `money` only, leaving a message to need something else (or a strain against "you won't be a
  loser"). Discuss: the "message" answer exists so that the lapse leaves two kinds open.
- why_out: noise and light both fit; the key says noise. Accept both, or keep the key and let the give-away judge.

## Proposed order of work

Sizes in steps of the size built so far (one step ≈ one of the recent "Watson's timeline" commits with its tests and
play).

1. **Small data and strains** (½–1 step). Re-side s.blows; strains for the bloodied knife vs Simpson unhurt, "see that
   all was well" vs no alarm, Derbyshire as a friend vs the bill, the bay vs Bayard scratched; the ¶39 assertion;
   decide paper money vs message and noise vs light. Moves weapon, derbyshire, bay, stranger_identity to at least
   partial, cheaply, and none of it needs the engine. It leans on data rather than moves, so each pair is worth a
   word with the user first.
2. **The night at the stable: the drugging typed and the guard need** (1½–2 steps). Kind 1 with kind 3's dog. The
   largest gain: who_drugged, drug_where, door_opened_by, horse_out_by, dog_barked, and straker_aim at ¶46 (six
   questions, all partial or missing now). Discuss the three alternatives first.
3. **Who holds a key** (½ step). Kind 2, a question with a `need`, as q.why_out. Completes the door.
4. **Presence and the instrument** (1 step). Kind 4: `strike` needs presence, q.weapon tied to q.who_killed.
   Settles who_killed and weapon by route, not by strain alone.
5. **Traces** (1½–2 steps). Kind 5: "what made this?" on tracks; the change of heading as a change of aim. Gives
   horse_where its ¶124 route and track_man_aim; track_man by a question or strain.
6. **Motive** (1–1½ steps). Kind 7, after step 1's Derbyshire. Goals serving goals.

About six to eight steps in all, close to the previous guess, but shaped differently: one big cluster (steps 2–3)
rather than absence on its own, and a cheap first step that moves four questions. Counting a strain as a route: after
step 4 about 22 of 26 (19–20 by moves alone); after step 5 about 25; the motive with step 6. Derbyshire, the bay and
the man by the tracks stay on strains unless a set rule or a role rule is built.

Then distracting data (flagged), as agreed.

## Notes for the discussion

- **Strains vs moves.** Steps 1 and parts of 5–6 put reasoning in data (strains). The ruling allows it where moves
  cannot catch it; derbyshire and the bay are judgements by nature, the alarm nearly so. The night at the stable is
  where a move clearly can.
- **The gate's pile-up** (¶212–229) is unchanged by any of this; what changes is whether the player arrives there with
  reasons. Fifteen of the 26 give-aways are at ¶220 or later; nine of those have a supported or told route already, and
  six do not: who_drugged, door_opened_by, horse_out_by (partial), weapon, derbyshire, motive (missing).
- **Told answers** (madam_derbyshire, horse_changed, sheep_lame, and the ¶57/¶81/¶96/¶116 claims) depend on the player
  trusting Holmes, Brown or Mrs Straker. That is as the story has it; distracting data will not touch them.
