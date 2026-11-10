```jsonl
{"file":"patch","id":"watson_notes","set":{"names":[{"from":1,"name":"The narrator's notes of the cases"},{"from":3,"name":"Watson's notes of the cases"}]}}
{"file":"possibility","q":"q.how_roylott_died","value":"he was himself the wrongdoer and died as a result of it","available":24}
{"file":"patch","id":"watson_bedroom","set":{"names":[{"from":2,"name":"The narrator's bedroom"},{"from":3,"name":"Watson's bedroom"}]}}
{"file":"patch","id":"t.holmes_reads","set":{"labels":[{"from":14,"label":"That morning: Holmes reads the lady's journey from her ticket"},{"from":16,"label":"That morning: Holmes reads the lady's journey from her ticket and jacket"}]}}
{"file":"patch","id":"t.holmes_asks_details","set":{"labels":[{"from":31,"label":"That morning: Holmes half opens his eyes"},{"from":32,"label":"That morning: Holmes opens his eyes and asks for details"}]}}
{"file":"patch","id":"q.who_whistled","set":{"labels":[{"from":36,"label":"Who was whistling in the dead of the night?"},{"from":40,"label":"Who made the low whistle in the night?"}]}}
{"file":"patch","id":"t.holmes_deep","set":{"labels":[{"from":65,"label":"That morning: Holmes shakes his head"},{"from":66,"label":"That morning: Holmes shakes his head and asks Helen to go on"}]}}
{"file":"patch","id":"corridor_windows","set":{"names":[{"from":137,"name":"The corridor's windows, if it has any"},{"from":138,"name":"The small windows of the corridor"}]}}
{"file":"patch","id":"t.snake_driven","set":{"labels":[{"from":250,"label":"That night: Holmes's lashing drives the creature back through the ventilator"},{"from":251,"label":"That night: Holmes's blows drive the creature back through the ventilator, its temper roused"}]}}
```

I moved the "wrongdoer" possibility to ¶24, where the butler's killing first gives a reason. Its `reasoning` still cites ¶1 and should be rewritten if that field can be edited.

Four possibilities are left unchanged because the check is wrong on them:
- **`q.why_bell_rope`, way down to the bed (¶151):** ¶142 puts the tassel on the pillow, and ¶151 fastens the rope just above the opening, so the route can be seen from the text.
- **`q.what_came_through`, venomous snake (¶167):** the Indian animals, the convulsions, the "speckled band", the small opening and the saucer of milk are all told by ¶167.
- **`q.roylott_day`, near Stoke Moran (¶195):** the drive past the inn shows only when he came through the gate, and he has already shown he follows people.
- **`q.how_snake_worked`, milk or vibration (¶248):** Holmes offers the training only as "probably", and the possibility tells nothing the story reveals later. No later paragraph would be a better date for it.