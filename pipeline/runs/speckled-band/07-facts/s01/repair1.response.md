The four missing time points are given again unchanged. The three untyped actions lose their `thing` role, since the story's reasoning doesn't run through them.

```jsonl
{"file":"times","id":"t.writing","label":"When the narrator writes","labels":[{"from":1,"label":"When the narrator writes"},{"from":3,"label":"When Watson writes"}],"after":["t.pledged_lady_dies","t.roylott_death","t.wake"],"para":1,"quote":"On glancing over my notes"}
{"file":"times","id":"t.hudson_knocked_up","label":"That morning, before a quarter-past seven: Mrs. Hudson is knocked up","after":"t.lady_arrives","para":3,"quote":"Mrs. Hudson has been knocked up"}
{"file":"times","id":"t.veil_raised","label":"That morning: the lady raises her veil","after":"t.changes_seat","para":11,"quote":"She raised her veil as she spoke"}
{"file":"times","id":"t.farintosh_case","label":"Some time before: Holmes helps Mrs. Farintosh","after":"t.before","para":17,"quote":"whom you helped in the hour of her sore need"}
{"file":"facts","id":"f.hudson_lights_fire","of":"mrs_hudson","attr":"action","value":"lights the fire in the sitting-room","word":"holmes","time":{"after":"t.hudson_knocked_up","before":"t.enter"},"para":8,"quote":"Mrs. Hudson has had the good sense to light the fire"}
{"file":"facts","id":"f.lady_raises_veil","of":"the_lady_in_black","attr":"action","value":"raises her veil","time":{"at":"t.veil_raised"},"para":11,"quote":"She raised her veil as she spoke"}
{"file":"facts","id":"f.holmes_unlocks","of":"holmes","attr":"action","value":"turns to his desk and unlocks it","time":{"at":"t.holmes_consults"},"para":18,"quote":"Holmes turned to his desk and, unlocking it"}
```