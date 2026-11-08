```jsonl
{"file": "joins", "door": "stable_door", "sides": ["stables", "path"]}
{"file": "actions", "id": "nick_tendon", "label": "nicking the leg tendons of", "requires": [{"of": "$agent", "carrying": "$item"}, {"of": "$agent", "attr": "lit", "value": "a light"}], "effects": [{"of": "$thing", "attr": "condition", "value": "lame"}]}
{"file": "ramifies", "if": {"attr": "condition", "value": "lame"}, "then": {"attr": "condition", "value": "beaten in the Wessex Cup"}}
{"file": "patch", "id": "f.hunter_guard", "set": {"guards": "stables"}}
{"file": "patch", "id": "f.straker_takes_horse", "set": {"via": "stable_door", "time": {"at": "t.horse_taken"}}}
{"file": "patch", "id": "f.straker_drugs_hunter", "set": {"act": "drug", "to": "hunter"}}
{"file": "patch", "id": "f.horse_lashes_out", "set": {"to": "straker", "where": "hollow"}}
{"file": "patch", "id": "f.straker_strikes_light", "set": {"act": "strike_light"}}
{"file": "patch", "id": "f.inf_straker_struck_light", "set": {"act": "strike_light"}}
{"file": "patch", "id": "f.straker_picks_cravat", "set": {"act": "take", "item": "cravat"}}
{"file": "patch", "id": "f.straker_practises", "set": {"act": "nick_tendon", "thing": "lame_sheep", "item": "straker_knife"}}
{"file": "patch", "id": "f.inf_sheep_by_household", "set": {"act": "nick_tendon", "thing": "lame_sheep", "item": "straker_knife"}}
{"file": "patch", "id": "f.brown_conceals", "set": {"where": "mapleton"}}
{"file": "patch", "id": "f.stranger_asks_bayard", "set": {"about": "silver_blaze"}}
{"file": "patch", "id": "f.straker_intends_nick", "set": {"goal": {"of": "silver_blaze", "attr": "condition", "value": "lame"}}}
{"file": "patch", "id": "f.straker_intends_operation", "set": {"goal": {"of": "silver_blaze", "attr": "condition", "value": "lame"}}}
{"file": "patch", "id": "f.straker_dishonest", "set": {"goal": {"of": "silver_blaze", "attr": "condition", "value": "lame"}}}
{"file": "patch", "id": "f.brown_intends_hide", "set": {"goal": {"of": "silver_blaze", "attr": "condition", "value": "kept out of the Wessex Cup"}}}
{"file": "patch", "id": "f.straker_wished_out", "set": {"goal": {"of": "silver_blaze", "attr": "condition", "value": "lame"}}}
{"file": "patch", "id": "f.holmes_police_theory", "set": {"plan": {"agent": "simpson", "goal": {"of": "silver_blaze", "attr": "held_by", "value": "simpson"}, "steps": [{"act": "drug", "to": "hunter", "item": "opium", "time": {"at": "t.mon_window"}}, {"act": "keep_key", "thing": "stable_door", "time": {"before": "t.horse_taken"}}, {"act": ["unlock", "open"], "thing": "stable_door", "time": {"at": "t.horse_taken"}}, {"act": "lead_out", "thing": "silver_blaze", "via": "stable_door", "time": {"at": "t.horse_taken"}}, {"act": "strike", "to": "straker", "item": "simpson_stick", "where": "hollow", "time": {"at": "t.crime"}}, {"act": "hide", "thing": "silver_blaze", "time": {"after": "t.crime"}}]}}}
{"file": "patch", "id": "f.gregory_gypsy_theory", "set": {"plan": {"agent": "simpson", "goal": {"of": "silver_blaze", "attr": "held_by", "value": "gypsy_party"}, "steps": [{"act": "lead_out", "thing": "silver_blaze", "via": "stable_door", "time": {"at": "t.horse_taken"}}, {"act": "give", "to": "gypsy_party", "item": "silver_blaze", "time": {"at": "t.crime"}}]}}}
{"file": "patch", "id": "q.who_took", "set": {"entry": {"of": "?", "attr": "action", "act": "lead_out", "thing": "silver_blaze", "via": "stable_door", "time": {"at": "t.horse_taken"}}}}
{"file": "patch", "id": "q.who_opened", "set": {"entry": {"of": "?", "attr": "action", "act": ["unlock", "open"], "thing": "stable_door", "time": {"after": "t.mon_hunter_out", "before": "t.morning_seven"}}}}
{"file": "patch", "id": "q.who_drugged", "set": {"entry": {"of": "?", "attr": "action", "act": "drug", "to": "hunter", "time": {"after": "t.mon_nine", "before": "t.morning_seven"}}}}
{"file": "patch", "id": "q.who_killed", "set": {"entry": {"of": "?", "attr": "action", "act": "strike", "to": "straker", "where": "hollow", "time": {"at": "t.crime"}}}}
{"file": "patch", "id": "q.who_lamed_sheep", "set": {"entry": {"of": "?", "attr": "action", "act": "nick_tendon", "thing": "lame_sheep", "time": {"before": "t.carriage_sheep"}}}}
{"file": "patch", "id": "q.vesta", "set": {"entry": {"of": "?", "attr": "action", "act": "strike_light", "time": {"at": "t.vesta_dropped"}}}}
{"file": "patch", "id": "q.why_led_out", "set": {"presupposes": {"act": "lead_out", "thing": "silver_blaze", "via": "stable_door"}}}
{"file": "patch", "id": "q.cravat_why", "set": {"presupposes": {"act": "take", "item": "cravat"}}}
{"file": "patch", "id": "q.simpson_intent", "set": {"end": true}}
{"file": "possibility", "q": "q.why_led_out", "value": "to carry him off and hide him", "goal": {"of": "silver_blaze", "attr": "held_by", "value": "simpson"}, "step": {"act": "hide", "thing": "silver_blaze", "time": {"after": "t.horse_taken"}}}
{"file": "possibility", "q": "q.why_led_out", "value": "to hand him over to the gypsies", "goal": {"of": "silver_blaze", "attr": "held_by", "value": "gypsy_party"}, "step": {"act": "give", "to": "gypsy_party", "item": "silver_blaze", "time": {"at": "t.crime"}}}
{"file": "possibility", "q": "q.why_led_out", "value": "to do something to him that could not be done in the stall", "goal": {"of": "silver_blaze", "attr": "condition", "value": "lame"}, "step": {"act": "nick_tendon", "thing": "silver_blaze", "item": "straker_knife", "time": {"at": "t.crime"}}, "need": {"act": "nick_tendon", "rule": {"of": "$agent", "away": "stables"}}}
{"file": "possibility", "q": "q.why_taken", "value": "to stop it running in the Wessex Cup", "goal": {"of": "silver_blaze", "attr": "condition", "value": "kept out of the Wessex Cup"}}
{"file": "possibility", "q": "q.why_taken", "value": "to sell it or hold it for ransom", "goal": {"of": "silver_blaze", "attr": "held_by", "value": "?"}, "step": {"act": "hide", "thing": "silver_blaze", "time": {"after": "t.crime"}}}
{"file": "possibility", "q": "q.why_taken", "value": "nobody meant to carry him off: he was led out to be harmed and got loose", "goal": {"of": "silver_blaze", "attr": "condition", "value": "lame"}, "step": {"act": "nick_tendon", "thing": "silver_blaze", "item": "straker_knife", "time": {"at": "t.crime"}}}
{"file": "possibility", "q": "q.straker_reason", "value": "to see that all was well with the horses", "goal": {"of": "kings_pyland_horses", "attr": "condition", "value": "safe"}}
{"file": "possibility", "q": "q.straker_reason", "value": "to watch for the stranger's return", "goal": {"of": "silver_blaze", "attr": "condition", "value": "safe"}}
{"file": "possibility", "q": "q.straker_reason", "value": "to do something to the horse himself", "goal": {"of": "silver_blaze", "attr": "condition", "value": "lame"}, "step": {"act": "nick_tendon", "thing": "silver_blaze", "item": "straker_knife", "time": {"at": "t.crime"}}, "need": {"act": "nick_tendon", "rule": {"of": "$agent", "away": "stables"}}}
{"file": "possibility", "q": "q.knife", "value": "to defend himself", "goal": {"of": "straker", "attr": "condition", "value": "safe"}}
{"file": "possibility", "q": "q.knife", "value": "to make some fine cut on the horse", "goal": {"of": "silver_blaze", "attr": "condition", "value": "lame"}, "step": {"act": "nick_tendon", "thing": "silver_blaze", "item": "straker_knife", "time": {"at": "t.crime"}}}
{"file": "possibility", "q": "q.candle", "value": "to have a small light somewhere out on the moor", "goal": {"of": "straker", "attr": "lit", "value": "a light"}, "step": {"act": "strike_light", "time": {"at": "t.vesta_dropped"}}}
{"file": "possibility", "q": "q.cravat_why", "value": "to use it in securing the horse's leg", "goal": {"of": "silver_blaze", "attr": "condition", "value": "leg secured"}}
{"file": "possibility", "q": "q.cravat_why", "value": "to leave it where it would throw suspicion on the tout", "goal": {"of": "simpson", "attr": "condition", "value": "suspected"}}
{"file": "possibility", "q": "q.simpson_intent", "value": "only to get first-hand information", "goal": {"of": "simpson", "attr": "knows", "value": "inside information on the King's Pyland horses"}, "step": {"act": "ask", "to": "hunter", "about": "silver_blaze", "time": {"at": "t.mon_window"}}}
{"file": "possibility", "q": "q.simpson_intent", "value": "to put the favourite out of the race", "goal": {"of": "silver_blaze", "attr": "condition", "value": "kept out of the Wessex Cup"}}
{"file": "possibility", "q": "q.simpson_intent", "value": "to drug the lad and take the horse", "goal": {"of": "silver_blaze", "attr": "held_by", "value": "simpson"}, "step": {"act": "lead_out", "thing": "silver_blaze", "via": "stable_door", "time": {"at": "t.horse_taken"}}}
{"file": "possibility", "q": "q.turned_back", "value": "he meant to return the horse, then decided to keep it", "goal": {"of": "silver_blaze", "attr": "condition", "value": "kept out of the Wessex Cup"}, "step": {"act": "hide", "thing": "silver_blaze", "where": "mapleton", "time": {"at": "t.brown_conceals_horse"}}}
```