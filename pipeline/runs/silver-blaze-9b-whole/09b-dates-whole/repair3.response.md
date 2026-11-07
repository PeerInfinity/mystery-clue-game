Restored the original assert, which says the horse would be found before Thursday breakfast. Marked false, it now matches `f.horse_not_found`.

```jsonl
{"file":"patch","id":"f.holmes_believed_found","set":{"truth":false,"asserts":[{"of":"silver_blaze","attr":"condition","value":"found","time":{"before":"t.thu_breakfast"},"truth":false}]}}
```