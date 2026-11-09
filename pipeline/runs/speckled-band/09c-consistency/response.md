All four fixes are below. The first three mark mistaken beliefs as `truth: false`. I also removed the `q.police_view` pick from `f.inquiry_concludes`, because that pick is the correct answer and shouldn't sit in a false claim. The sleepers clash is fixed by making the parsonage fact about what the parsonage holds, so the group is no longer in two places.

```jsonl
{"file":"patch","id":"f.helen_fear_belief","set":{"truth":false}}
{"file":"patch","id":"f.watson_vent_not_unusual","set":{"truth":false}}
{"file":"patch","id":"f.inquiry_concludes","set":{"truth":false,"asserts":[{"of":"grimesby_roylott","attr":"action","value":"indiscreetly plays with a dangerous pet","time":{"at":"t.roylott_bitten"}},{"of":"the_serpent","attr":"role","value":"Dr. Roylott's dangerous pet","time":{"at":"t.roylott_bitten"}},{"q":"q.how_roylott_died","pick":"a strange accident that gossip has made into a crime"}]}}
{"file":"patch","id":"f.sleepers_parsonage","set":{"of":"parsonage","attr":"contents","value":"sleepers in their beds"},"unset":["detail"]}
```