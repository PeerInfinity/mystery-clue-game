The check flagged `q.paper_packet` when my new fact `f.packet_was_note` linked to it with `q` and `pick`. I have removed that link from the fact; everything else in the line is unchanged.

```jsonl
{"file":"facts","id":"f.packet_was_note","of":"paper_packet","attr":"contents","value":"a ten-pound note offered to the stable-boy","time":{"at":"t.mon_maid_path"},"para":58,"quote":"He says that it was a ten-pound note. One was found in his purse.","basis":"inferable","from":["f.simpson_says_note","f.note_in_purse","f.stranger_asks_tip"],"inferable_at":58,"reasoning":[{"para":58,"text":"A ten-pound note is exactly what a tout would offer a lad for a tip, and one was still in Simpson's purse. That fits a bribe for information better than a drug."}],"strength":"likely"}
```