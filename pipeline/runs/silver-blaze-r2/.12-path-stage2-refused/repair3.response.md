The six failing statements are all beliefs that carry no `asserts`, and the page gives no trust control for those at any paragraph. The fix is to delete those six moves rather than move them to other paragraphs. Since such beliefs assert nothing the engine checks, they presumably cannot contradict anything at the end either.

```jsonl
{"file":"path","do":"trust","on":"f.watson_incomprehensible","link":"stmt:f.watson_incomprehensible","delete":true}
{"file":"path","do":"trust","on":"f.ross_poor_opinion","link":"stmt:f.ross_poor_opinion","delete":true}
{"file":"path","do":"trust","on":"f.ross_believes_accused","link":"stmt:f.ross_believes_accused","delete":true}
{"file":"path","do":"trust","on":"f.holmes_improbable","link":"stmt:f.holmes_improbable","delete":true}
{"file":"path","do":"trust","on":"f.holmes_paper_theories","link":"stmt:f.holmes_paper_theories","delete":true}
{"file":"path","do":"trust","on":"f.gregory_theory","link":"stmt:f.gregory_theory","delete":true}
```