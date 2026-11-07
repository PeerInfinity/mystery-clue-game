Two fixes:
- **Unreached accounts.** One new telling from an unknown teller to the newspapers carries the four accounts into the existing chain: newspapers to Holmes to Watson.
- **`f.stick_weapon`.** The line is rewritten without `modal`.

```jsonl
{"file":"facts","id":"f.reports_reach_press","of":"?","attr":"tells","value":["acct.baxter","acct.mrs_straker","acct.lads","acct.search"],"to":"newspapers","how":"report","time":{"after":"t.tue_hollow","before":"t.wed"},"para":12,"quote":"the embellishments of theorists and reporters"}
{"file":"facts","id":"f.stick_weapon","of":"simpson_stick","attr":"condition","value":"just such a weapon as might, by repeated blows, have inflicted Straker's injuries","time":{"at":"t.simpson_arrest"},"para":40,"quote":"was just such a weapon as might, by repeated blows, have inflicted the terrible injuries"}
```