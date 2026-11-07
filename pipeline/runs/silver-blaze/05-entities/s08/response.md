```jsonl
{"file": "entities", "id": "winchester", "kind": "place", "name": "Winchester", "within": "england"}
{"file": "entities", "id": "winchester_station", "kind": "place", "name": "Winchester station", "within": "winchester"}
{"file": "entities", "id": "drag", "kind": "object", "name": "Colonel Ross's drag"}
{"file": "moves", "id": "drag"}
{"file": "entities", "id": "course", "kind": "place", "name": "The racecourse beyond Winchester", "within": "winchester"}
{"file": "entities", "id": "grand_stand", "kind": "place", "name": "The grand stand", "within": "course"}
{"file": "entities", "id": "enclosure", "kind": "place", "name": "The enclosure near the grand stand", "within": "course"}
{"file": "entities", "id": "weighing_enclosure", "kind": "place", "name": "The weighing enclosure", "within": "course"}
{"file": "entities", "id": "straight", "kind": "place", "name": "The straight of the course", "within": "course"}
{"file": "entities", "id": "winning_post", "kind": "object", "name": "The winning post", "within": "course"}
{"file": "entities", "id": "race_card", "kind": "document", "name": "The race card"}
{"file": "entities", "id": "the_ring", "kind": "group", "name": "The betting ring"}
{"file": "entities", "id": "cup_runners", "kind": "group", "name": "The six horses in the Wessex Cup"}
{"file": "entities", "id": "heath_newton", "kind": "person", "name": "Mr. Heath Newton"}
{"file": "entities", "id": "the_negro", "kind": "animal", "name": "The Negro"}
{"file": "entities", "id": "wardlaw", "kind": "person", "name": "Colonel Wardlaw"}
{"file": "entities", "id": "pugilist", "kind": "animal", "name": "Pugilist"}
{"file": "entities", "id": "balmoral", "kind": "person", "name": "The Duke of Balmoral"}
{"file": "entities", "id": "iris", "kind": "animal", "name": "Iris"}
{"file": "entities", "id": "singleford", "kind": "person", "name": "Lord Singleford"}
{"file": "entities", "id": "rasper", "kind": "animal", "name": "Rasper"}
{"file": "entities", "id": "ross_colours", "kind": "object", "name": "Colonel Ross's black and red colours"}
{"file": "entities", "id": "mapleton_colours", "kind": "object", "name": "The yellow colours of the Mapleton stable"}
{"file": "entities", "id": "the_bay_horse", "kind": "animal", "name": "The bay horse in Colonel Ross's colours"}
{"file": "entities", "id": "spirits_of_wine", "kind": "object", "name": "Spirits of wine"}
{"file": "mentions", "id": "winchester", "phrases": ["Winchester", {"text": "the town", "paras": [183, 183]}]}
{"file": "mentions", "id": "winchester_station", "phrases": [{"text": "the station", "paras": [183, 183]}]}
{"file": "mentions", "id": "drag", "phrases": ["his drag", "the drag", "our drag"]}
{"file": "mentions", "id": "course", "phrases": ["the course"]}
{"file": "mentions", "id": "grand_stand", "phrases": ["the grand stand"]}
{"file": "mentions", "id": "enclosure", "phrases": ["the enclosure"]}
{"file": "mentions", "id": "weighing_enclosure", "phrases": ["the weighing enclosure"]}
{"file": "mentions", "id": "straight", "phrases": ["the straight", "the curve"]}
{"file": "mentions", "id": "winning_post", "phrases": ["the post"]}
{"file": "mentions", "id": "race_card", "phrases": ["the card"]}
{"file": "mentions", "id": "the_ring", "phrases": ["the ring"]}
{"file": "mentions", "id": "cup_runners", "phrases": ["The six horses", "All six", "the field", "Only five"]}
{"file": "mentions", "id": "heath_newton", "phrases": ["Mr. Heath Newton"]}
{"file": "mentions", "id": "the_negro", "phrases": ["The Negro"]}
{"file": "mentions", "id": "wardlaw", "phrases": ["Colonel Wardlaw"]}
{"file": "mentions", "id": "pugilist", "phrases": ["Pugilist"]}
{"file": "mentions", "id": "balmoral", "phrases": ["Duke of Balmoral"]}
{"file": "mentions", "id": "iris", "phrases": ["Iris", "the Duke of Balmoral’s Iris"]}
{"file": "mentions", "id": "singleford", "phrases": ["Lord Singleford"]}
{"file": "mentions", "id": "rasper", "phrases": ["Rasper"]}
{"file": "mentions", "id": "ross_colours", "phrases": ["My colours", "the well-known black and red of the Colonel", "black cap, red jacket"]}
{"file": "mentions", "id": "mapleton_colours", "phrases": ["the yellow of the Mapleton stable", "yellow cap and sleeves"]}
{"file": "mentions", "id": "the_bay_horse", "phrases": ["a powerful bay horse", "That beast", "the Colonel’s horse", "the thoroughbred"]}
{"file": "mentions", "id": "spirits_of_wine", "phrases": ["spirits of wine"]}
{"file": "mentions", "id": "wessex_cup", "phrases": ["the race for the Wessex Cup", "Wessex Plate", {"text": "my race", "paras": [201, 201]}]}
{"file": "mentions", "id": "silver_blaze", "phrases": ["Colonel Ross’s Silver Blaze", "the same old Silver Blaze", {"text": "The real murderer", "paras": [212, 212]}]}
{"file": "mentions", "id": "desborough", "phrases": ["Lord Backwater’s Desborough", {"text": "its rival", "paras": [200, 200]}]}
{"file": "mentions", "id": "bayard", "phrases": ["our other one"]}
{"file": "mentions", "id": "ross", "phrases": [{"text": "the owner", "paras": [198, 198]}]}
{"file": "mentions", "id": "field_glass", "phrases": ["my field-glass"]}
{"file": "mentions", "id": "silas_brown", "phrases": [{"text": "a faker", "paras": [204, 204]}]}
```

`tavistock_station` currently matches "the station" in every paragraph. It should be limited to `paras [47, 47]` so that ¶183 goes to `winchester_station`.

`the_bay_horse` is kept as its own entity until ¶202 says who it is. That identity should be written as a fact.