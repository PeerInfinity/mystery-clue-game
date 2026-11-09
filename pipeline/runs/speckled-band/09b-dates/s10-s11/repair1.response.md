The lantern fact loses its untyped `thing` role. Both sleepers' locations rest only on Watson's "They say", so I've marked them as unsettled.

```jsonl
{"file":"facts","id":"f.inf_roylott_lights_lantern","of":"grimesby_roylott","attr":"action","value":"lights the dark-lantern in his room","where":"roylott_room","time":{"at":"t.lantern_gleam"},"para":236,"quote":"Someone in the next room had lit a dark-lantern.","basis":"inferable","from":["f.lantern_lit_next","f.holmes_he_would_see","f.roylott_room_owner"],"inferable_at":236,"strength":"likely","given_at":242,"given_quote":"On the table stood a dark-lantern with the shutter half open","q":"q.who_lantern","pick":"grimesby_roylott"}
{"file":"patch","id":"f.sleepers_village","set":{"truth":null}}
{"file":"patch","id":"f.sleepers_parsonage","set":{"truth":null}}
```