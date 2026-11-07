The clash came from Holmes being placed both in the landau and at the villa's front door at the same moment, `t.villa_arrival`. The fix moves his stepping out to a point after the arrival and before the sitting-room scene.

```jsonl
{"file":"patch","id":"f.holmes_out_villa","set":{"time":{"after":"t.villa_arrival","before":"t.sitting_room"}}}
{"file":"patch","id":"f.holmes_starts_out","set":{"time":{"after":"t.villa_arrival","before":"t.sitting_room"}}}
```