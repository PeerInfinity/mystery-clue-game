The stray `q.vesta` line in questions.json has no `id`, so the validator reads it as a question with no label and no "something else". The fix is to delete that line. The `q.vesta` question itself already holds this possibility, with my earlier fix (out at ¶224, by `f.ross_blind`). I have keyed the delete by `q` and `value`, since the line has no `id`.

```jsonl
{"file":"questions","q":"q.vesta","value":"someone there before or after that night, unconnected with the crime","delete":true}
```