Two fixes. Holmes's belief now asserts the horse would be found, which `f.horse_not_found` contradicts. His Paddington stop now falls before the carriage interval.

```jsonl
{"file":"patch","id":"f.holmes_believed_not_concealed","set":{"truth":false,"asserts":[{"of":"silver_blaze","attr":"condition","value":"found","time":{"at":"t.thu_breakfast"},"truth":false}]}}
{"file":"patch","id":"f.holmes_at_paddington","set":{"time":{"after":"t.thu_breakfast","before":"t.thu_paddington"}}}
```