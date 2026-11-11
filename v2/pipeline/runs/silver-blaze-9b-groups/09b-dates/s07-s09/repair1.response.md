Both facts now keep the default `truth` (the belief happened). Their single `asserts` item stays marked `truth: false`.

```jsonl
{"file":"patch","id":"f.brown_thinks_watched","set":{"asserts":[{"of":"holmes","attr":"observes","value":"Brown's actions that morning","time":{"at":"t.brown_finds_horse"},"truth":false}]}}
{"file":"patch","id":"f.holmes_conviction_simpson","set":{"asserts":[{"of":"simpson","attr":"action","value":"kills Straker and takes the horse","time":{"at":"t.crime"},"truth":false}]}}
```