This corrects the `f.holmes_believed_found` patch. It now uses the original assert, that the horse was found before Thursday, marked `truth: false`; `f.horse_not_found` contradicts it.

```jsonl
{"file":"patch","id":"f.holmes_believed_found","set":{"truth":false,"asserts":[{"of":"silver_blaze","attr":"condition","value":"found","time":{"before":"t.thu_breakfast"},"truth":false}]}}
```