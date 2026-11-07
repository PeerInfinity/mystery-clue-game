The two remaining errors come from one stray line at the end of the questions. It is a possibility for `q.vesta` with no `id`, so the checks read it as a question with no label and no "something else". The line below files it as a possibility of `q.vesta`, which should replace the stray entry. If the stray line still remains after this, it will need removing by hand, because a delete needs an `id` and it has none.

```jsonl
{"file":"possibility","q":"q.vesta","value":"someone there before or after that night, unconnected with the crime","available":102,"via":"indirect","reasoning":{"para":102,"text":"A spent match on the open moor may have been dropped by anyone passing, at any time."},"out":224,"by":"f.ross_blind"}
```