Two questions are left as `noroute` and seven get typed data. Ids I add (`practise_nick`, `nick_tendon`) are the case's own action types and are given whole. The `patch` and `possibility` lines assume the engine merges the fields given into the existing entry.

- **`q.turned_back`:** the reader gets this from the reversal of the tracks, a change of course, not from a purpose link.
- **`q.who_killed`:** the blow was the horse's self-defence, which serves no aim.
- **The stable-door chain (`q.who_took`, `q.who_drugged`, `q.who_opened`):** it needs the door's two sides. The reason to work away from the stable applies to the horse as well as to Straker, since the horse's cries would wake the loft (¶223).
- **`q.who_lamed_sheep`:** it needs the practice rule the story states at ¶228.

```jsonl
{"file":"noroute","q":"q.turned_back","why":"The reader reaches it by a change of course, not a purpose link. The double track first heads towards King's Pyland (¶122), then turns back and ends at Mapleton's gates (¶124). A man who set out to return a stray and then reversed into the rival stable changed his mind and kept it."}
{"file":"noroute","q":"q.who_killed","why":"The horse's blow served no aim, so no purpose link can reach it. The reader gets there from what is told: the horse was in the hollow at the struggle (¶37) and left it alone (¶120). Straker was there with an uncorked cataract knife and a struck light (¶82, ¶102), and the sheep were lamed (¶173). A frightened horse's shod hoof is the 'heavy weapon' (¶35)."}
{"file":"joins","joins":{"stable_door":["stables","dartmoor"]}}
{"file":"possibility","q":"q.straker_reason","value":"to do something to the horse himself","need":[{"act":"nick_tendon","rule":{"of":"$agent","away":"stables"}},{"act":"nick_tendon","rule":{"of":"$thing","away":"stables"}}]}
{"file":"possibility","q":"q.why_led_out","value":"to do something to him that could not be done in the stall","need":[{"act":"nick_tendon","rule":{"of":"$agent","away":"stables"}},{"act":"nick_tendon","rule":{"of":"$thing","away":"stables"}}]}
{"file":"patch","id":"q.why_led_out","presupposes":{"act":"lead_out","thing":"silver_blaze","via":"stable_door"}}
{"file":"patch","id":"q.why_taken","presupposes":{"act":"lead_out","thing":"silver_blaze","via":"stable_door"}}
{"file":"possibility","q":"q.why_taken","value":"nobody meant to carry him off: he was led out to be harmed and got loose","need":[{"act":"nick_tendon","rule":{"of":"$thing","away":"stables"}}]}
{"file":"possibility","q":"q.simpson_intent","value":"only to get first-hand information","goal":{"of":"simpson","attr":"knows","value":"silver_blaze"}}
{"file":"actions","id":"practise_nick","label":"practising tendon-nicking on","requires":[{"of":"$agent","carrying":"$item"}],"effects":[{"of":"$thing","attr":"condition","value":"lame"},{"of":"$agent","attr":"practised","value":"tendon-nicking"}]}
{"file":"actions","id":"nick_tendon","label":"nicking the leg tendons of","requires":[{"of":"$agent","carrying":"$item"},{"of":"$agent","attr":"lit","value":"a light"},{"of":"$agent","attr":"practised","value":"tendon-nicking"}],"effects":[{"of":"$thing","attr":"condition","value":"lame"}]}
{"file":"patch","id":"f.straker_practises","act":"practise_nick"}
{"file":"patch","id":"f.inf_sheep_by_household","act":"practise_nick"}
{"file":"patch","id":"q.who_lamed_sheep","entry":{"of":"?","attr":"action","act":"practise_nick","thing":"lame_sheep","time":{"before":"t.carriage_sheep"}}}
```