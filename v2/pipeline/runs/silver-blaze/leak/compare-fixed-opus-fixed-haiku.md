# Leak check compared: fixed-opus and fixed-haiku

359 labels. Flagged by both 8, only by fixed-opus 1, only by fixed-haiku 9. Cost: fixed-opus $8.57 (102 calls), fixed-haiku $0.07 (82 calls).

## Flagged by both

- ¶4 account `acct.search`: The searchers' account
  - fixed-opus: unsupported: No searchers or account from searchers has been mentioned yet.
  - fixed-haiku: unsupported: Implies searchers who gave an account, but no searchers are mentioned so far.
- ¶4 account `acct.police_findings`: What the police found
  - fixed-opus: unsupported: The police and any findings of theirs have not been mentioned yet.
  - fixed-haiku: unsupported: Implies police findings, but the police are not mentioned so far.
- ¶4 question `q.who_killed`: Who struck the blow that killed Straker?
  - fixed-opus: unsupported: The trainer has not yet been named Straker, and no blow has been described.
  - fixed-haiku: unsupported: The name Straker has not been given in the story so far, and the question assumes a blow was struck, which the story has not said.
- ¶14 possibility `q.horse_where=dead, in a pit or mine`: Where is Silver Blaze? — dead, in a pit or mine
  - fixed-opus: unsupported: Nothing so far mentions pits or mines, or suggests the horse may be dead; this detail is not yet given.
  - fixed-haiku: unsupported: Nothing so far suggests the horse is dead or hidden in a pit or mine; the text only implies it is concealed or taken by an abductor.
- ¶46 possibility `q.straker_aim=to injure the horse`: Why did Straker go out at one in the morning? — to injure the horse
  - fixed-opus: unsupported: The story says Straker went out from anxiety to check the horses; nothing so far suggests he meant to harm Silver Blaze.
  - fixed-haiku: unsupported: The story gives Straker's reason as anxiety about the horses and a wish to see that all was well (¶32). Nothing suggests he meant to injure the horse, so this answer points to a theory the story has not raised.
- ¶57 possibility `q.why_out=to do something that would be heard in the stable`: Why take the horse out of the stable? — to do something that would be heard in the stable
  - fixed-opus: unsupported: Nothing so far suggests the horse was taken out to avoid noise being heard in the stable; this points at a later explanation.
  - fixed-haiku: unsupported: Nothing so far suggests the horse was moved to avoid being heard from the stable; the story only says the lads heard nothing, and no noise-related concern has been raised.
- ¶57 possibility `q.why_out=to do something by a light that would be seen from the stable`: Why take the horse out of the stable? — to do something by a light that would be seen from the stable
  - fixed-opus: unsupported: Nothing so far raises the idea of needing a light that would be seen from the stable; this hints at a later revelation.
  - fixed-haiku: unsupported: The story mentions the lantern and the window but never raises the idea that the horse was moved to avoid being seen from the stable by light, so a reader has no reason yet to consider it.
- ¶73 account `acct.villa_police`: The police's part shown and told in the sitting-room
  - fixed-opus: unsupported: No sitting-room has been mentioned, and the police have not yet shown or told anything there. This anticipates a later scene.
  - fixed-haiku: unsupported: The story so far never mentions a sitting-room or any scene in which the police's part is shown. The police's actions are only recapitulated by Holmes in conversation and in the carriage.

## Only by fixed-opus

- ¶173 possibility `q.sheep_lame=someone practised on them`: What lamed the sheep? — someone practised on them
  - fixed-opus: unsupported: Nothing so far suggests anyone practised anything on the sheep; the label points at a solution the story has not yet revealed.
  - fixed-haiku: –: 

## Only by fixed-haiku

- ¶1 time `t.before`: Before the story, undated
  - fixed-opus: supported: A generic, undated time slot for earlier events; it reveals nothing specific.
  - fixed-haiku: unsupported: The story so far gives no hint of earlier events; this label points to a prior time the text has not yet raised.
- ¶24 possibility `q.paper_contents=money (a bribe for the boy)`: What was in the stranger's paper? — money (a bribe for the boy)
  - fixed-opus: supported: A bribe is a reasonable guess, since the man is plainly offering inducements and banknotes are paper.
  - fixed-haiku: unsupported: The story never says what the paper contains, and it does not say the paper is a bribe; money is only mentioned as the promised payment for the maid's dress. The label presents money and a bribe as established facts.
- ¶33 possibility `q.horse_out_by=nobody`: Who led Silver Blaze out of the stable? — nobody
  - fixed-opus: supported: The door was found open, so the horse could have wandered out by itself; a reader has reason to consider this.
  - fixed-haiku: unsupported: The story gives no hint that the horse could have left unled. The empty stall, the open door and the missing trainer all point toward a person, so the 'nobody' possibility is not one the reader has reason to consider yet.
- ¶37 possibility `q.weapon=a hoof`: What made the blow to Straker's head? — a hoof
  - fixed-opus: supported: The horse was present at the struggle and the head wound was from a heavy blow, so a kick is a plausible possibility.
  - fixed-haiku: unsupported: The story says Straker fought off his 'assailants' (plural) and that the blow came from 'some heavy weapon'. Nothing suggests the horse struck the blow, so a hoof is a possibility the story gives no reason to consider.
- ¶41 possibility `q.struggle_with_man=no`: Did Straker fight a man in the hollow? — no
  - fixed-opus: supported: The suspect's lack of any wound conflicts with the bloodied knife, giving a reader reason to doubt there was a fight with a man.
  - fixed-haiku: unsupported: The story has already stated that Straker defended himself vigorously against his assailants, so 'no' contradicts the text rather than being a possibility the story has left open.
- ¶85 name `mrs_derbyshire`: 'Madam Derbyshire'
  - fixed-opus: supported: Holmes himself uses the name 'Madam Derbyshire' in this paragraph.
  - fixed-haiku: unsupported: The story names the bill's addressee as William Derbyshire, a man, and never calls anyone 'Madam Derbyshire'. The label gives a female identity the story has not established.
- ¶85 question `q.madam_derbyshire`: Who is the Madam Derbyshire of the bill?
  - fixed-opus: supported: The bill is made out to William Derbyshire, and Holmes's remark about 'Madam Derbyshire' invites the question of who she is.
  - fixed-haiku: unsupported: The question's wording presupposes a woman called 'Madam Derbyshire' as the bill's subject, which contradicts the story's 'William Derbyshire'. A neutral question would be about who William Derbyshire is.
- ¶85 possibility `q.madam_derbyshire=another woman`: Who is the Madam Derbyshire of the bill? — another woman
  - fixed-opus: supported: A plain possibility: by Mrs. Straker's account, the bill concerns a friend's household, so the costume's wearer would be some woman other than Mrs. Straker.
  - fixed-haiku: unsupported: The story gives no reason to consider that the Derbyshire of the bill is a woman distinct from others. The only basis is Holmes's 'Madam' slip, and the bill names a man.
- ¶131 name `mapleton_dog`: A dog at Mapleton
  - fixed-opus: supported: Silas Brown threatens that 'you may find a dog at your heels,' which implies a dog at Mapleton.
  - fixed-haiku: unsupported: The story so far mentions a dog only at King's Pyland (Hunter unleashes it). Brown's 'you may find a dog at your heels' is a figure of speech, not a stated dog at Mapleton.
