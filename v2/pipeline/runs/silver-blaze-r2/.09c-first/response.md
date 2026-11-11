Fixes below.

- **Stray possibility line.** The last line of `questions.json` is a possibility of `q.vesta`, not a question, which causes both "undefined" errors. I've re-filed it as a possibility patch; the stray line should then be dropped from `questions.json`.
- **The two beliefs.** Each belief did happen, so its own `truth` comes off. The asserted content stays marked false.
- **Ross's scratch.** Ross does mean to ask about scratching the horse, but that is not the pick "withdrawn", so `q` and `pick` come off.

```jsonl
{"file": "possibility", "q": "q.vesta", "value": "someone there before or after that night, unconnected with the crime", "available": 102, "via": "indirect", "reasoning": {"para": 102, "text": "A spent match on the open moor may have been dropped by anyone passing, at any time."}, "out": 224, "by": "f.ross_blind"}
{"file": "patch", "id": "f.holmes_believed_found", "set": {}, "unset": ["truth"]}
{"file": "patch", "id": "f.brown_thinks_watched", "set": {}, "unset": ["truth"]}
{"file": "patch", "id": "f.ross_considers_scratch", "set": {}, "unset": ["q", "pick"]}
```