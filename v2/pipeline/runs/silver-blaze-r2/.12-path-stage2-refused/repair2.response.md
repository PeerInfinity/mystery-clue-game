The plan move is moved to ¶117. The six trust moves are removed because the page has no trust control for those facts. The path lines have no `id`, so each delete names its line by `do` and `on`.

```jsonl
{"file":"path","do":"plan","of":"hyp:q.candle=to have a small light somewhere out on the moor","on":"q:q.candle","at":117,"why":"What would a light out on the moor be needed for?","for_q":["q.candle"]}
{"file":"path","do":"trust","on":"f.watson_incomprehensible","delete":true}
{"file":"path","do":"trust","on":"f.ross_poor_opinion","delete":true}
{"file":"path","do":"trust","on":"f.ross_believes_accused","delete":true}
{"file":"path","do":"trust","on":"f.holmes_improbable","delete":true}
{"file":"path","do":"trust","on":"f.holmes_paper_theories","delete":true}
{"file":"path","do":"trust","on":"f.gregory_theory","delete":true}
```