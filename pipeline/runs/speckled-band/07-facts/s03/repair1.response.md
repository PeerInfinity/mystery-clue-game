Two of the four lines get an `act` from the types the format shows (`lock`, `open`). The other two aren't typed actions the reasoning needs, so they lose their `thing` role instead.

```jsonl
{"file":"facts","id":"f.julia_closes_helens","of":"julia","attr":"action","value":"closes Helen's door","time":{"at":"t.julia_closes_door"},"para":44,"quote":"closed my door"}
{"file":"facts","id":"f.julia_locks_door","of":"julia","attr":"action","act":"lock","value":"locks her door with her key","thing":"julia_door","item":"julia_key","basis":"implied","time":{"at":"t.julia_locks"},"para":44,"quote":"I heard her key turn in the lock"}
{"file":"facts","id":"f.helen_opens_door","of":"the_lady_in_black","attr":"action","act":"open","value":"opens her door","thing":"helen_door","time":{"at":"t.helen_opens_door"},"para":50,"quote":"As I opened my door"}
{"file":"facts","id":"f.helen_stares","of":"the_lady_in_black","attr":"action","value":"stares at Julia's door, horror-stricken","time":{"at":"t.julia_door_opens"},"para":50,"quote":"I stared at it horror-stricken"}
```