The five flagged lines had a `thing` role without an `act`. None of these actions is part of the typed reasoning, so I removed `thing` and left them as plain actions. The action each one acts on is still named in its `value`.

```jsonl
{"file":"facts","id":"f.holmes_closes_shutters","of":"holmes","attr":"action","value":"noiselessly closes the shutters","time":{"at":"t.shutters_closed"},"para":226,"quote":"My companion noiselessly closed the shutters"}
{"file":"facts","id":"f.holmes_lashes","of":"holmes","attr":"action","value":"lashes furiously with his cane at the bell-pull","item":"holmes_cane","time":{"at":"t.holmes_lashes"},"para":236,"quote":"lashed furiously with his cane at the bell-pull"}
{"file":"facts","id":"f.holmes_gazes_vent","of":"holmes","attr":"action","value":"gazes up at the ventilator","time":{"at":"t.holmes_gazes"},"para":238,"quote":"was gazing up at the ventilator"}
{"file":"facts","id":"f.holmes_strikes_door","of":"holmes","attr":"action","value":"strikes twice at the chamber door","time":{"at":"t.holmes_knocks"},"para":241,"quote":"Twice he struck at the chamber door"}
{"file":"facts","id":"f.holmes_closes_safe","of":"holmes","attr":"action","value":"closes the safe upon the reptile","time":{"at":"t.safe_closed"},"para":246,"quote":"which he closed upon it"}
```