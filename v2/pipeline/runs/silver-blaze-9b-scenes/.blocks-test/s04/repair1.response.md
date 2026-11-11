The two facts placed Holmes in the carriage and at the villa door at the same moment, `t.villa_arrival`. This patch keeps him in the landau at that point and moves his stepping out to after it, before the sitting-room scene.

```jsonl
{"file":"patch","id":"f.holmes_out_villa","set":{"time":{"after":"t.villa_arrival","before":"t.sitting_room"}}}
```