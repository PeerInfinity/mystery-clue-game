The three `by` references were not found as facts, so each possibility below now points to one of the inferable facts I added. Each is ruled out at ¶226, where that fact is given.

```jsonl
{"file":"questions","q":"q.coat_on_bush","value":"someone else put it there","available":35,"via":"indirect","reasoning":{"para":35,"text":"The coat hangs neatly apart from the body, as if placed there."},"out":226,"by":"f.inf_straker_coat_off"}
{"file":"questions","q":"q.vesta","value":"the man who struck Straker down","available":102,"via":"indirect","reasoning":{"para":102,"text":"Someone else was in the hollow that night with Straker and the horse. A man who meant harm in the dark might strike a light too."},"out":226,"by":"f.inf_straker_struck_light"}
{"file":"questions","q":"q.vesta","value":"someone there before or after that night, unconnected with the crime","available":102,"via":"indirect","reasoning":{"para":102,"text":"A spent match on the open moor may have been dropped by anyone passing, at any time."},"out":226,"by":"f.inf_straker_struck_light"}
```