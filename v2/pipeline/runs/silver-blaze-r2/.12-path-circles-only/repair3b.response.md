Two fixes:

- **Distrust of Holmes's newspaper theories.** I moved it from ¶217 to ¶216. ¶216 is where Holmes calls those theories wrong, and the same paragraph already carries a distrust that passed.
- **The thigh cut.** I deleted the wrong-turn circle of "his own knife, in convulsions after the blow" at ¶44, and the cross of it at ¶226. That leaves "his own knife, as he fell" as the only circle when ¶226 gives the answer away.

The deletion lines name each path move by `do`, `q` and `pick`, because path moves have no `id`. That way of identifying them is my assumption about the format.

```jsonl
{"file":"path","do":"trust","on":"f.holmes_paper_theories","link":"stmt:f.holmes_paper_theories","level":"distrusted","at":216,"why":"Holmes says the theories he formed from the newspaper reports were entirely erroneous.","for_q":[]}
{"file":"path","do":"circle","q":"q.thigh_cut","pick":"his own knife, in convulsions after the blow","delete":true}
{"file":"path","do":"cross","q":"q.thigh_cut","pick":"his own knife, in convulsions after the blow","delete":true}
```