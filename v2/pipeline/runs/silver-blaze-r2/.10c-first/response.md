Each question below gets either a data fix or a `noroute`. Four of the fixes depend on details of the action table I couldn't see:

- **Key form.** The `patch` lines use a `target`/`set` form I assumed. Rewrite them if the pipeline expects a different shape.
- **Door-state rule.** I wrote the rule as `{"of": "$via", "state": "door", "value": "open"}`, mirroring the `attr: "door"` facts. The format reference leaves the exact shape unclear.
- **Lead-out effects.** The `away` rule only fits if `lead_out` puts the horse outside the stables. I couldn't check this against the generic action list.
- **Open timeline problem.** For `q.why_taken` and `q.why_led_out` I added the missing `presupposes`. Their right answers are also missing from the timeline, which is a path problem these changes don't fix.
- **Straker's key.** The engine may also need a fact that Straker holds a key to the stable door. The story only implies it, so I did not add one.

```jsonl
{"file":"noroute","q":"q.turned_back","why":"The reader reaches it from a change told by the tracks: the double track heads towards King's Pyland, then comes back the other way and ends at Mapleton's gates (¶122–124). The answer is a change of mind, not a step towards a goal."}
{"file":"noroute","q":"q.who_killed","why":"The horse struck in self-defence, with no aim, so no action can be linked to a purpose. The reader reaches it from the traces: the horse left the hollow alone (¶120), the 'heavy weapon' could be a shod hoof, and Straker was cutting at the horse by match-light. Holmes then gives it away (¶212)."}
{"file":"noroute","q":"q.simpson_intent","why":"The reader reaches it by elimination, not by linking actions to an aim. The folded paper was a ten-pound note still in his purse (¶58). The curry argument rules out his drugging the lad (¶218), and the silent dog rules out his being the night visitor (¶219). What is left is his own stated aim."}
{"file":"possibility","q":"q.straker_reason","value":"to do something to the horse himself","need":[{"act":"nick_tendon","rule":{"of":"$thing","away":"stables"}},{"act":"lead_out","rule":{"guard":"$via"}},{"act":"lead_out","rule":{"of":"$via","state":"door","value":"open"}}],"note":"¶223: a pricked horse would rouse the lads, so the cut had to be done in the open air and the horse had to be led out. ¶220: he drugged his own stable-boy so that the watchman could not act while he took the horse. The door was locked at nine (¶31) and had to be opened."}
{"file":"possibility","q":"q.why_led_out","value":"to do something to him that could not be done in the stall","need":[{"act":"nick_tendon","rule":{"of":"$thing","away":"stables"}}],"note":"¶223: the horse would have roused the soundest sleepers when it felt the knife, so the cut had to be done in the open air."}
{"file":"patch","target":"q.why_led_out","set":{"presupposes":{"act":"lead_out","thing":"silver_blaze","via":"stable_door"}}}
{"file":"patch","target":"q.why_taken","set":{"presupposes":{"act":"lead_out","thing":"silver_blaze","via":"stable_door"}}}
{"file":"actions","id":"practise_nick","label":"practising the tendon-nick on","requires":[{"of":"$agent","carrying":"$item"}],"effects":[{"of":"$thing","attr":"condition","value":"lame"},{"of":"$agent","attr":"skill","value":"practised at tendon-nicking"}]}
{"file":"actions","id":"nick_tendon","label":"nicking the leg tendons of","requires":[{"of":"$agent","carrying":"$item"},{"of":"$agent","attr":"lit","value":"a light"},{"of":"$agent","attr":"skill","value":"practised at tendon-nicking"}],"effects":[{"of":"$thing","attr":"condition","value":"lame"}]}
{"file":"patch","target":"f.straker_practises","set":{"act":"practise_nick"}}
{"file":"patch","target":"f.inf_sheep_by_household","set":{"act":"practise_nick"}}
{"file":"patch","target":"q.who_lamed_sheep","set":{"entry":{"of":"?","attr":"action","act":"practise_nick","thing":"lame_sheep","time":{"before":"t.carriage_sheep"}}}}
```

The practice rule rests on ¶228: Straker "would not undertake this delicate tendon-nicking without a little practice", so practising on the sheep is a need of the real cut.