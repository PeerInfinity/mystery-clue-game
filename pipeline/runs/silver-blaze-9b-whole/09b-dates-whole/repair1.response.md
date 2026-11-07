Fixes for the flagged problems:

- **Questions:** the right answers for `q.why_taken` and `q.thigh_cut` now become available at the paragraphs where they can be inferred (¶175 and ¶54).
- **Checker reading of asserts:** three `believes` facts get asserts the checker can test, or have the false mark dropped.
- **`q.horse_runs` clash:** Ross's intent to scratch the horse no longer carries a pick.
- **Holmes in two places:** his stepping out of the carriage now comes after he stays in it.

```jsonl
{"file":"patch","id":"q.why_taken","set":{"possibilities":[{"value":"something else","available":4,"via":"always"},{"value":"to stop it running in the Wessex Cup","available":4,"via":"indirect","from":"f.horse_favourite"},{"value":"to sell it or hold it for ransom","available":14,"via":"indirect","from":"f.horse_remarkable"},{"value":"nobody meant to carry him off: he was led out to be harmed and got loose","available":175,"via":"indirect","reasoning":{"para":175,"text":"Straker carried a cataract knife for fine cuts, struck a light in the hollow, and the paddock sheep have gone lame as if from practice. The horse's track left the hollow alone. He was led out to be lamed and ran off loose afterwards."}}]}}
{"file":"patch","id":"q.thigh_cut","set":{"possibilities":[{"value":"something else","available":35,"via":"always"},{"value":"an assailant's blade","available":35,"via":"indirect","from":"f.thigh_cut","out":226,"by":"f.knife_gashes"},{"value":"his own knife, in convulsions after the blow","available":43,"via":"direct","quote":"may have been caused by his own knife in the convulsive struggles"},{"value":"his own knife, as he fell","available":54,"via":"direct","quote":"We have quite come to the conclusion that he wounded himself in his fall."}]}}
{"file":"patch","id":"f.gregory_self_wound","set":{"asserts":[{"of":"straker","attr":"action","value":"wounds himself with his own knife in his fall","time":{"at":"t.crime"}},{"q":"q.thigh_cut","pick":"his own knife, as he fell"},{"q":"q.knife_blood","pick":"Straker's own"}]}}
{"file":"patch","id":"f.holmes_believed_found","set":{"truth":false,"asserts":[{"of":"silver_blaze","attr":"condition","value":"found","time":{"at":"t.wed"},"truth":false}]}}
{"file":"patch","id":"f.brown_thinks_watched","set":{"truth":true,"asserts":[{"of":"holmes","attr":"observes","value":"Brown's actions that morning","time":{"at":"t.brown_finds_horse"}}]}}
{"file":"patch","id":"f.holmes_conviction_simpson","set":{"truth":false,"asserts":[{"q":"q.who_killed","pick":"simpson","truth":false},{"q":"q.who_took","pick":"simpson","truth":false}]}}
{"file":"patch","id":"f.ross_considers_scratch","set":{"q":null,"pick":null}}
{"file":"patch","id":"f.holmes_out_villa","set":{"time":{"after":"t.villa_arrival","before":"t.sitting_room"}}}
```