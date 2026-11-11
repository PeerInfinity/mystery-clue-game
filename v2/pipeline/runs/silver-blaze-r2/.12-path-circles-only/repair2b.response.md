Two fixes:

- **Moore's paper theories:** the distrust for `f.holmes_paper_theories` moves to ¶217, the paragraph after Holmes calls those theories wrong, since no trust control existed for it at ¶216.
- **The thigh cut:** the right answer for `q.thigh_cut` only becomes available at ¶226, which is also where it is given away. So the reader circles Watson's convulsion idea at ¶44, then crosses it at ¶226 and circles the true answer.

```jsonl
{"file":"path","do":"trust","on":"f.holmes_paper_theories","link":"stmt:f.holmes_paper_theories","level":"distrusted","at":217,"why":"Holmes has just said the theories he formed from the papers were entirely erroneous.","for_q":[]}
{"file":"path","do":"circle","q":"q.thigh_cut","pick":"his own knife, in convulsions after the blow","at":44,"why":"Simpson has no wound and Holmes thinks it probable that Straker cut himself with his own knife in the convulsions after the blow.","for_q":["q.thigh_cut"]}
{"file":"path","do":"cross","q":"q.thigh_cut","pick":"his own knife, in convulsions after the blow","at":226,"why":"The knife gashed his thigh as he fell from the kick, not in convulsions afterwards.","for_q":["q.thigh_cut"]}
{"file":"path","do":"circle","q":"q.thigh_cut","pick":"his own knife, as he fell","at":226,"why":"Kicked on the forehead with the knife in his hand, Straker gashed his own thigh as he fell.","for_q":["q.thigh_cut"]}
```