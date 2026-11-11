These six statements have no trust control on the page, so I've removed the moves that tried to distrust them. Path lines carry no `id`, so each removal names the move by `do`, `on` and `link` instead. If the checker only matches on `id`, these six lines will need re-keying.

```jsonl
{"file":"path","do":"trust","on":"f.holmes_improbable","link":"stmt:f.holmes_improbable","delete":true}
{"file":"path","do":"trust","on":"f.gregory_theory","link":"stmt:f.gregory_theory","delete":true}
{"file":"path","do":"trust","on":"f.watson_incomprehensible","link":"stmt:f.watson_incomprehensible","delete":true}
{"file":"path","do":"trust","on":"f.ross_poor_opinion","link":"stmt:f.ross_poor_opinion","delete":true}
{"file":"path","do":"trust","on":"f.ross_believes_accused","link":"stmt:f.ross_believes_accused","delete":true}
{"file":"path","do":"trust","on":"f.holmes_paper_theories","link":"stmt:f.holmes_paper_theories","delete":true}
```