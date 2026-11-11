Four patches: two make the true answer available as early as the story allows, and two give back the default truth to beliefs that were really held. One more removes a pick that was wrongly attached to Ross's intention.

- **`q.why_taken`**: the true possibility is now available from ¶175, where the inference already stands.
- **`q.thigh_cut`**: "his own knife, as he fell" is now available from ¶54, where Gregory says it directly.
- **`f.holmes_believed_found` and `f.brown_thinks_watched`**: both beliefs were really held, so I removed `truth: false` from the facts. Their contents stay false through the `truth` on what they assert.
- **`f.ross_considers_scratch`**: I removed its `q` and `pick`. Ross only means to ask advice about scratching the horse; he does not assert that it will not run. This clears all four `q.horse_runs` clashes.

```jsonl
{"file": "possibility", "q": "q.why_taken", "value": "nobody meant to carry him off: he was led out to be harmed and got loose", "available": 175, "via": "indirect", "reasoning": {"para": 175, "text": "Straker carried a cataract knife for fine cuts and struck a light in the hollow, and the paddock sheep have gone lame as if from practice. The horse may have been led out to be lamed, not carried off, and then run off loose."}}
{"file": "possibility", "q": "q.thigh_cut", "value": "his own knife, as he fell", "available": 54, "via": "direct", "quote": "he wounded himself in his fall"}
{"file": "patch", "id": "f.holmes_believed_found", "set": {}, "unset": ["truth"]}
{"file": "patch", "id": "f.brown_thinks_watched", "set": {}, "unset": ["truth"]}
{"file": "patch", "id": "f.ross_considers_scratch", "set": {}, "unset": ["q", "pick"]}
```