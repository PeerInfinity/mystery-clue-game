Corrected patch lines, each now in the `{"file": "patch", "id", "set": {...}}` form:

```jsonl
{"file":"patch","id":"q.why_led_out","set":{"presupposes":{"act":"lead_out","thing":"silver_blaze","via":"stable_door"}}}
{"file":"patch","id":"q.why_taken","set":{"presupposes":{"act":"lead_out","thing":"silver_blaze","via":"stable_door"}}}
{"file":"patch","id":"f.straker_practises","set":{"act":"practise_nick"}}
{"file":"patch","id":"f.inf_sheep_by_household","set":{"act":"practise_nick"}}
{"file":"patch","id":"q.who_lamed_sheep","set":{"entry":{"of":"?","attr":"action","act":"practise_nick","thing":"lame_sheep","time":{"before":"t.carriage_sheep"}}}}
```