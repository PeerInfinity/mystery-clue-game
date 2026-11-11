The three possibilities below now point their `by` at facts that settle the question they belong to. I couldn't tell from the problem list why the earlier `by` facts were rejected. All three exist, and two of them carry a pick on the same question. So I've guessed at the cause, and the coat fix in particular may not pass.

- **Who struck the match** (`q.vesta`): both ruled-out options are now ruled out at ¶226 by `f.straker_strikes_light`, which picks `straker` for this question.
- **The coat on the bush** (`q.coat_on_bush`): "someone else put it there" is now ruled out at ¶226 by `f.inf_straker_coat_off`, the inferable fact I added. That fact is reachable at ¶97 but is only stated outright at ¶226.

```jsonl
{"file":"questions","q":"q.vesta","value":"the man who struck Straker down","available":102,"via":"indirect","reasoning":{"para":102,"text":"Someone else was in the hollow that night with Straker and the horse. A man who meant harm in the dark might strike a light too."},"out":226,"by":"f.straker_strikes_light"}
{"file":"questions","q":"q.vesta","value":"someone there before or after that night, unconnected with the crime","available":102,"via":"indirect","reasoning":{"para":102,"text":"A spent match on the open moor may have been dropped by anyone passing, at any time."},"out":226,"by":"f.straker_strikes_light"}
{"file":"questions","q":"q.coat_on_bush","value":"someone else put it there","available":35,"via":"indirect","reasoning":{"para":35,"text":"The coat hangs neatly apart from the body, as if placed there."},"out":226,"by":"f.inf_straker_coat_off"}
```