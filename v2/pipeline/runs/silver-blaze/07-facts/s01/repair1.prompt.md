<!-- system -->
You are one step of a pipeline that turns a detective story into structured data for a reading game. You see only
what this message gives you. Use only the text given, read as a first-time reader would read it: if you recognise
the story, do not use what you remember of it, its characters' secrets or its ending. Follow the format exactly.
Put your output in one or more ```jsonl fenced blocks, one JSON object per line; anything outside the blocks is
ignored, so keep remarks short.


<!-- user -->
# Repair

Your output for the task below did not pass the checks. Here is the task, your output, and the problems found. Give
the whole output again, corrected (all of it, not only the changed lines), in the same format.

## The problems

- f.papers_tell_watson: a telling from "?" needs its question (q)

## Your previous output

```jsonl
{"file": "facts", "id": "f.holmes_loc_breakfast", "of": "holmes", "attr": "location", "value": "rooms", "detail": "at breakfast", "time": {"at": "t.thu_breakfast"}, "para": 1, "quote": "as we sat down together to our breakfast one morning"}
{"file": "facts", "id": "f.watson_loc_breakfast", "of": "watson", "attr": "location", "value": "rooms", "detail": "at breakfast", "time": {"at": "t.thu_breakfast"}, "para": 1, "quote": "as we sat down together to our breakfast one morning"}
{"file": "facts", "id": "f.clock_morning", "of": "clock", "attr": "hour", "value": "morning", "time": {"at": "t.thu_breakfast"}, "para": 1, "quote": "our breakfast one morning"}
{"file": "facts", "id": "f.holmes_says_must_go", "of": "holmes", "attr": "says", "value": "he shall have to go", "to": "watson", "time": {"at": "t.thu_breakfast"}, "para": 1, "quote": "I am afraid, Watson, that I shall have to go", "asserts": [{"of": "holmes", "attr": "intends", "value": "to go away on the case"}]}
{"file": "facts", "id": "f.holmes_intends_dartmoor", "of": "holmes", "attr": "intends", "value": "to go to King's Pyland, on Dartmoor", "time": {"at": "t.thu_breakfast"}, "para": 3, "quote": "To Dartmoor; to King’s Pyland."}
{"file": "facts", "id": "f.case_talk_of_england", "of": "england", "attr": "condition", "value": "the extraordinary case is the one topic of conversation throughout England", "time": {"at": "t.thu_breakfast"}, "para": 4, "quote": "which was the one topic of conversation through the length and breadth of England"}
{"file": "facts", "id": "f.holmes_loc_wed", "of": "holmes", "attr": "location", "value": "rooms", "detail": "rambling about the room", "time": {"at": "t.wed"}, "para": 4, "quote": "For a whole day my companion had rambled about the room"}
{"file": "facts", "id": "f.holmes_broods", "of": "holmes", "attr": "action", "value": "rambles about the room with his chin on his chest and brows knitted, deaf to Watson's questions", "time": {"at": "t.wed"}, "para": 4, "quote": "with his chin upon his chest and his brows knitted"}
{"file": "facts", "id": "f.holmes_pipe", "of": "holmes", "attr": "carrying", "value": "pipe", "detail": "charging and recharging it with the strongest black tobacco", "time": {"at": "t.wed"}, "para": 4, "quote": "charging and recharging his pipe with the strongest black tobacco"}
{"file": "facts", "id": "f.holmes_deaf", "of": "holmes", "attr": "condition", "value": "deaf to any of Watson's questions or remarks", "time": {"at": "t.wed"}, "para": 4, "quote": "absolutely deaf to any of my questions or remarks"}
{"file": "facts", "id": "f.news_agent_sends", "of": "news_agent", "attr": "action", "value": "sends up fresh editions of every paper", "time": {"at": "t.wed"}, "para": 4, "quote": "Fresh editions of every paper had been sent up by our news agent"}
{"file": "facts", "id": "f.holmes_tosses_papers", "of": "holmes", "attr": "action", "value": "glances over the papers and tosses them into a corner", "time": {"at": "t.wed"}, "para": 4, "quote": "only to be glanced over and tossed down into a corner"}
{"file": "facts", "id": "f.papers_in_corner", "of": "newspapers", "attr": "location", "value": "rooms", "detail": "tossed into a corner", "time": {"from": "t.wed"}, "para": 4, "quote": "tossed down into a corner"}
{"file": "facts", "id": "f.watson_knows_brooding", "of": "watson", "attr": "knows", "value": "Holmes is brooding over the disappearance of the Wessex Cup favourite and the murder of its trainer", "time": {"at": "t.wed"}, "para": 4, "quote": "I knew perfectly well what it was over which he was brooding"}
{"file": "facts", "id": "f.horse_favourite", "of": "silver_blaze", "attr": "role", "value": "favourite for the Wessex Cup", "time": {"at": "t.crime"}, "para": 4, "quote": "the favourite for the Wessex Cup"}
{"file": "facts", "id": "f.horse_disappears", "of": "silver_blaze", "attr": "condition", "value": "disappeared", "time": {"from": "t.crime"}, "para": 4, "quote": "the singular disappearance of the favourite for the Wessex Cup"}
{"file": "facts", "id": "f.straker_trainer", "of": "straker", "attr": "role", "value": "trainer of the favourite for the Wessex Cup", "time": {"at": "t.crime"}, "para": 4, "quote": "the tragic murder of its trainer"}
{"file": "facts", "id": "f.straker_murdered", "of": "straker", "attr": "condition", "value": "murdered", "time": {"from": "t.crime"}, "para": 4, "quote": "the tragic murder of its trainer"}
{"file": "facts", "id": "f.holmes_announces", "of": "holmes", "attr": "intends", "value": "to set out for the scene of the drama", "time": {"at": "t.thu_breakfast"}, "para": 4, "quote": "he suddenly announced his intention of setting out for the scene of the drama"}
{"file": "facts", "id": "f.watson_expected", "of": "watson", "attr": "believes", "value": "Holmes would take up the case; Watson expected and hoped for it", "time": {"at": "t.thu_breakfast"}, "para": 4, "quote": "it was only what I had both expected and hoped for"}
{"file": "facts", "id": "f.watson_offers", "of": "watson", "attr": "says", "value": "he would be happy to go down with Holmes", "to": "holmes", "time": {"at": "t.thu_breakfast"}, "para": 5, "quote": "I should be most happy to go down with you if I should not be in the way"}
{"file": "facts", "id": "f.holmes_says_unique", "of": "holmes", "attr": "says", "value": "there are points about the case which promise to make it unique", "to": "watson", "time": {"at": "t.thu_breakfast"}, "para": 6, "quote": "there are points about the case which promise to make it an absolutely unique one", "asserts": [{"of": "holmes", "attr": "believes", "value": "points of the case make it unique"}]}
{"file": "facts", "id": "f.holmes_intends_train", "of": "holmes", "attr": "intends", "value": "to catch the train at Paddington and explain the matter on the journey", "time": {"at": "t.thu_breakfast"}, "para": 6, "quote": "We have, I think, just time to catch our train at Paddington, and I will go further into the matter upon our journey"}
{"file": "facts", "id": "f.holmes_asks_glass", "of": "holmes", "attr": "action", "act": "ask", "thing": "field_glass", "value": "asks Watson to bring his field-glass", "time": {"at": "t.thu_breakfast"}, "para": 6, "quote": "You would oblige me by bringing with you your very excellent field-glass."}
{"file": "facts", "id": "f.watson_owns_glass", "of": "field_glass", "attr": "owner", "value": "watson", "basis": "implied", "time": {"at": "t.thu_breakfast"}, "para": 6, "quote": "your very excellent field-glass"}
{"file": "facts", "id": "f.holmes_at_paddington", "of": "holmes", "attr": "location", "value": "paddington", "time": {"at": "t.thu_paddington"}, "para": 7, "quote": "which he had procured at Paddington"}
{"file": "facts", "id": "f.holmes_buys_papers", "of": "holmes", "attr": "action", "value": "procures a bundle of fresh papers", "time": {"at": "t.thu_paddington"}, "para": 7, "quote": "the bundle of fresh papers which he had procured at Paddington"}
{"file": "facts", "id": "f.watson_in_carriage", "of": "watson", "attr": "location", "value": "carriage", "detail": "in the corner", "time": {"from": "t.thu_paddington", "to": "t.thu_on_line"}, "para": 7, "quote": "I found myself in the corner of a first-class carriage"}
{"file": "facts", "id": "f.holmes_in_carriage", "of": "holmes", "attr": "location", "value": "carriage", "time": {"from": "t.thu_paddington", "to": "t.thu_on_line"}, "para": 7, "quote": "while Sherlock Holmes, with his sharp, eager face"}
{"file": "facts", "id": "f.train_on_line", "of": "train", "attr": "location", "value": "railway_line", "detail": "flying along en route for Exeter", "time": {"from": "t.thu_paddington", "to": "t.thu_on_line"}, "para": 7, "quote": "flying along en route for Exeter"}
{"file": "facts", "id": "f.train_to_exeter", "of": "train", "attr": "intends", "value": "bound for Exeter", "time": {"from": "t.thu_paddington"}, "para": 7, "quote": "en route for Exeter"}
{"file": "facts", "id": "f.holmes_cap", "of": "holmes", "attr": "wearing", "value": "travelling_cap", "detail": "ear-flapped", "time": {"from": "t.thu_paddington", "to": "t.thu_past_reading"}, "para": 7, "quote": "framed in his ear-flapped travelling-cap"}
{"file": "facts", "id": "f.holmes_reads_papers", "of": "holmes", "attr": "action", "value": "dips rapidly into the fresh papers", "time": {"from": "t.thu_paddington", "to": "t.thu_past_reading"}, "para": 7, "quote": "dipped rapidly into the bundle of fresh papers"}
{"file": "facts", "id": "f.train_past_reading", "of": "train", "attr": "location", "value": "reading", "detail": "passed through, now far behind", "time": {"after": "t.thu_paddington", "before": "t.thu_past_reading"}, "para": 7, "quote": "We had left Reading far behind us"}
{"file": "facts", "id": "f.papers_under_seat", "of": "newspapers", "attr": "location", "value": "carriage_seat", "detail": "thrust under the seat", "time": {"from": "t.thu_past_reading"}, "para": 7, "quote": "he thrust the last one of them under the seat"}
{"file": "facts", "id": "f.holmes_offers_cigars", "of": "holmes", "attr": "action", "act": "give", "thing": "cigar_case", "value": "offers Watson his cigar-case", "time": {"at": "t.thu_past_reading"}, "para": 7, "quote": "offered me his cigar-case"}
{"file": "facts", "id": "f.holmes_looks_window", "of": "holmes", "attr": "action", "value": "looks out the window and glances at his watch", "time": {"at": "t.thu_on_line"}, "para": 8, "quote": "looking out the window and glancing at his watch"}
{"file": "facts", "id": "f.holmes_owns_watch", "of": "holmes_watch", "attr": "owner", "value": "holmes", "basis": "implied", "time": {"at": "t.thu_on_line"}, "para": 8, "quote": "glancing at his watch"}
{"file": "facts", "id": "f.holmes_says_speed", "of": "holmes", "attr": "says", "value": "the train is going at fifty-three and a half miles an hour", "to": "watson", "time": {"at": "t.thu_on_line"}, "para": 8, "quote": "Our rate at present is fifty-three and a half miles an hour.", "asserts": [{"of": "train", "attr": "speed", "value": "fifty-three and a half miles an hour", "time": {"at": "t.thu_on_line"}}]}
{"file": "facts", "id": "f.watson_says_posts", "of": "watson", "attr": "says", "value": "he has not observed the quarter-mile posts", "to": "holmes", "time": {"at": "t.thu_on_line"}, "para": 9, "quote": "I have not observed the quarter-mile posts"}
{"file": "facts", "id": "f.holmes_says_telegraph_posts", "of": "holmes", "attr": "says", "value": "he has not observed the quarter-mile posts either, but the telegraph posts on this line are sixty yards apart", "to": "watson", "time": {"at": "t.thu_on_line"}, "para": 10, "quote": "the telegraph posts upon this line are sixty yards apart", "asserts": [{"of": "telegraph_posts", "attr": "condition", "value": "sixty yards apart"}]}
{"file": "facts", "id": "f.holmes_asks_case", "of": "holmes", "attr": "action", "act": "ask", "value": "asks Watson whether he has looked into the murder of John Straker and the disappearance of Silver Blaze", "time": {"at": "t.thu_on_line"}, "para": 10, "quote": "I presume that you have looked into this matter"}
{"file": "facts", "id": "f.name_straker", "of": "straker", "attr": "name", "value": "John Straker", "time": {"at": "t.crime"}, "para": 10, "quote": "the murder of John Straker"}
{"file": "facts", "id": "f.name_silver_blaze", "of": "silver_blaze", "attr": "name", "value": "Silver Blaze", "time": {"at": "t.crime"}, "para": 10, "quote": "the disappearance of Silver Blaze"}
{"file": "facts", "id": "f.watson_read_papers", "of": "watson", "attr": "action", "value": "has read what the Telegraph and the Chronicle say on the case", "time": {"at": "t.watson_reads"}, "para": 11, "quote": "I have seen what the _Telegraph_ and the _Chronicle_ have to say"}
{"file": "facts", "id": "f.papers_tell_watson", "of": "?", "attr": "tells", "value": "acct.press", "to": "watson", "how": "newspaper", "time": {"at": "t.watson_reads"}, "para": 11, "quote": "what the _Telegraph_ and the _Chronicle_ have to say"}
{"file": "facts", "id": "f.holmes_says_method", "of": "holmes", "attr": "says", "value": "the case calls for sifting details rather than acquiring fresh evidence, and the facts must be detached from the theorising of reporters", "to": "watson", "time": {"at": "t.thu_on_line"}, "para": 12, "quote": "the art of the reasoner should be used rather for the sifting of details than for the acquiring of fresh evidence", "asserts": [{"of": "holmes", "attr": "believes", "value": "the answer lies in sifting the known facts"}]}
{"file": "facts", "id": "f.holmes_says_surmise", "of": "holmes", "attr": "believes", "value": "the case is overlaid by a plethora of surmise, conjecture and hypothesis from theorists and reporters", "time": {"at": "t.thu_on_line"}, "para": 12, "quote": "we are suffering from a plethora of surmise, conjecture, and hypothesis"}
{"file": "facts", "id": "f.cal_tue", "of": "calendar", "attr": "weekday", "value": "Tuesday", "time": {"at": "t.tue_evening"}, "para": 12, "quote": "On Tuesday evening"}
{"file": "facts", "id": "f.clock_tue_evening", "of": "clock", "attr": "hour", "value": "evening", "time": {"at": "t.tue_evening"}, "para": 12, "quote": "On Tuesday evening"}
{"file": "facts", "id": "f.holmes_gets_telegrams", "of": "holmes", "attr": "action", "value": "receives telegrams from Colonel Ross and Inspector Gregory inviting his co-operation", "time": {"at": "t.tue_evening"}, "para": 12, "quote": "On Tuesday evening I received telegrams from both Colonel Ross"}
{"file": "facts", "id": "f.ross_telegraphs", "of": "ross", "attr": "action", "value": "telegraphs Holmes inviting his co-operation", "time": {"at": "t.tue_evening"}, "para": 12, "quote": "telegrams from both Colonel Ross, the owner of the horse"}
{"file": "facts", "id": "f.gregory_telegraphs", "of": "gregory", "attr": "action", "value": "telegraphs Holmes inviting his co-operation", "time": {"at": "t.tue_evening"}, "para": 12, "quote": "and from Inspector Gregory, who is looking after the case, inviting my co-operation"}
{"file": "facts", "id": "f.ross_owner", "of": "silver_blaze", "attr": "owner", "value": "ross", "time": {"at": "t.tue_evening"}, "para": 12, "quote": "Colonel Ross, the owner of the horse"}
{"file": "facts", "id": "f.gregory_role", "of": "gregory", "attr": "role", "value": "police inspector looking after the case", "time": {"at": "t.tue_evening"}, "para": 12, "quote": "Inspector Gregory, who is looking after the case"}
{"file": "facts", "id": "f.holmes_tells_telegrams", "of": "holmes", "attr": "tells", "value": "acct.holmes", "to": "watson", "how": "told", "time": {"at": "t.thu_on_line"}, "para": 12, "quote": "On Tuesday evening I received telegrams"}
{"file": "facts", "id": "f.cal_thu", "of": "calendar", "attr": "weekday", "value": "Thursday", "time": {"from": "t.thu_breakfast", "to": "t.thu_on_line"}, "para": 13, "quote": "And this is Thursday morning."}
{"file": "facts", "id": "f.cal_wed", "of": "calendar", "attr": "weekday", "value": "Wednesday", "basis": "implied", "time": {"at": "t.wed"}, "para": 13, "quote": "Why didn’t you go down yesterday?"}
{"file": "facts", "id": "f.watson_asks_why", "of": "watson", "attr": "action", "act": "ask", "value": "asks Holmes why he did not go down yesterday", "time": {"at": "t.thu_on_line"}, "para": 13, "quote": "Why didn’t you go down yesterday?"}
{"file": "facts", "id": "f.holmes_says_blunder", "of": "holmes", "attr": "says", "value": "he made a blunder in not going down on Wednesday", "to": "watson", "time": {"at": "t.thu_on_line"}, "para": 14, "quote": "Because I made a blunder, my dear Watson"}
{"file": "facts", "id": "f.watson_memoirs", "of": "memoirs", "attr": "owner", "value": "watson", "basis": "implied", "time": {"at": "t.thu_on_line"}, "para": 14, "quote": "who only knew me through your memoirs"}
{"file": "facts", "id": "f.horse_reputed", "of": "silver_blaze", "attr": "reputed", "value": "the most remarkable horse in England", "time": {"at": "t.wed"}, "para": 14, "quote": "the most remarkable horse in England"}
{"file": "facts", "id": "f.north_dartmoor_sparse", "of": "dartmoor", "attr": "condition", "value": "the north of Dartmoor is sparsely inhabited", "time": {"at": "t.wed"}, "para": 14, "quote": "so sparsely inhabited a place as the north of Dartmoor"}
{"file": "facts", "id": "f.holmes_believed_not_concealed", "of": "holmes", "attr": "believes", "value": "the horse could not long remain concealed on the moor", "time": {"at": "t.wed"}, "para": 14, "quote": "I could not believe it possible that the most remarkable horse in England could long remain concealed", "asserts": [{"of": "silver_blaze", "attr": "condition", "value": "concealed", "neg": true, "time": {"at": "t.wed"}}]}
{"file": "facts", "id": "f.holmes_expected_found", "of": "holmes", "attr": "believes", "value": "the horse would soon be found, and its abductor would be Straker's murderer", "time": {"at": "t.wed"}, "para": 14, "quote": "I expected to hear that he had been found, and that his abductor was the murderer of John Straker"}
{"file": "facts", "id": "f.horse_not_found", "of": "silver_blaze", "attr": "condition", "value": "found", "neg": true, "time": {"at": "t.thu_breakfast"}, "para": 14, "quote": "When, however, another morning had come"}
{"file": "facts", "id": "f.simpson_arrested", "of": "simpson", "attr": "condition", "value": "arrested", "time": {"from": "t.simpson_arrest"}, "para": 14, "quote": "the arrest of young Fitzroy Simpson"}
{"file": "facts", "id": "f.simpson_young", "of": "simpson", "attr": "condition", "value": "young", "time": {"at": "t.simpson_arrest"}, "para": 14, "quote": "young Fitzroy Simpson"}
{"file": "facts", "id": "f.nothing_else_done", "of": "constabulary", "attr": "action", "value": "nothing done beyond the arrest of Simpson", "time": {"at": "t.thu_breakfast"}, "para": 14, "quote": "beyond the arrest of young Fitzroy Simpson nothing had been done"}
{"file": "facts", "id": "f.holmes_decides_act", "of": "holmes", "attr": "intends", "value": "to take action on the case", "time": {"at": "t.thu_breakfast"}, "para": 14, "quote": "I felt that it was time for me to take action"}
{"file": "facts", "id": "f.holmes_says_not_wasted", "of": "holmes", "attr": "says", "value": "in some ways Wednesday has not been wasted", "to": "watson", "time": {"at": "t.thu_on_line"}, "para": 14, "quote": "Yet in some ways I feel that yesterday has not been wasted."}
{"file": "facts", "id": "f.holmes_tells_wait", "of": "holmes", "attr": "tells", "value": "acct.holmes", "to": "watson", "how": "told", "time": {"at": "t.thu_on_line"}, "para": 14, "quote": "I found that beyond the arrest of young Fitzroy Simpson nothing had been done"}
{"file": "facts", "id": "f.watson_asks_theory", "of": "watson", "attr": "action", "act": "ask", "value": "asks whether Holmes has formed a theory", "time": {"at": "t.thu_on_line"}, "para": 15, "quote": "You have formed a theory, then?"}
{"file": "facts", "id": "f.holmes_says_grip", "of": "holmes", "attr": "says", "value": "he has a grip of the essential facts of the case", "to": "watson", "time": {"at": "t.thu_on_line"}, "para": 16, "quote": "At least I have got a grip of the essential facts of the case."}
{"file": "facts", "id": "f.holmes_intends_enumerate", "of": "holmes", "attr": "intends", "value": "to enumerate the facts of the case to Watson", "time": {"at": "t.thu_on_line"}, "para": 16, "quote": "I shall enumerate them to you"}
{"file": "entities", "id": "constabulary", "kind": "group", "name": "The police on the case", "source": "beyond the arrest of young Fitzroy Simpson nothing had been done"}
```

```jsonl
{"file": "accounts", "id": "acct.watson", "label": "What Watson sees and hears himself", "origin": "watson", "how": "saw", "facts": ["f.holmes_loc_breakfast", "f.watson_loc_breakfast", "f.clock_morning", "f.holmes_says_must_go", "f.holmes_intends_dartmoor", "f.case_talk_of_england", "f.holmes_loc_wed", "f.holmes_broods", "f.holmes_pipe", "f.holmes_deaf", "f.news_agent_sends", "f.holmes_tosses_papers", "f.papers_in_corner", "f.watson_knows_brooding", "f.holmes_announces", "f.watson_expected", "f.watson_offers", "f.holmes_says_unique", "f.holmes_intends_train", "f.holmes_asks_glass", "f.watson_owns_glass", "f.holmes_buys_papers", "f.holmes_at_paddington", "f.watson_in_carriage", "f.holmes_in_carriage", "f.train_on_line", "f.train_to_exeter", "f.holmes_cap", "f.holmes_reads_papers", "f.train_past_reading", "f.papers_under_seat", "f.holmes_offers_cigars", "f.holmes_looks_window", "f.holmes_owns_watch", "f.holmes_says_speed", "f.watson_says_posts", "f.holmes_says_telegraph_posts", "f.holmes_asks_case", "f.watson_read_papers", "f.papers_tell_watson", "f.holmes_says_method", "f.holmes_says_surmise", "f.holmes_tells_telegrams", "f.cal_thu", "f.cal_wed", "f.watson_asks_why", "f.holmes_says_blunder", "f.watson_memoirs", "f.holmes_believed_not_concealed", "f.holmes_expected_found", "f.holmes_decides_act", "f.holmes_says_not_wasted", "f.holmes_tells_wait", "f.watson_asks_theory", "f.holmes_says_grip", "f.holmes_intends_enumerate"]}
{"file": "accounts", "id": "acct.press", "label": "What the newspapers report of the case", "origin": null, "how": "report", "facts": ["f.horse_favourite", "f.horse_disappears", "f.straker_trainer", "f.straker_murdered", "f.name_straker", "f.name_silver_blaze"]}
{"file": "accounts", "id": "acct.holmes", "label": "Holmes's account of the telegrams and his day of waiting", "origin": "holmes", "how": "own", "facts": ["f.cal_tue", "f.clock_tue_evening", "f.holmes_gets_telegrams", "f.ross_telegraphs", "f.gregory_telegraphs", "f.ross_owner", "f.gregory_role", "f.horse_reputed", "f.north_dartmoor_sparse", "f.horse_not_found", "f.simpson_arrested", "f.simpson_young", "f.nothing_else_done"]}
```

## The task

# Step: facts and accounts, one scene

# The world model: the format the pipeline writes

This is the format a case for the timeline is written in, as the pipeline's steps are told it. It is sent to the
model in every step that writes data, so it names no real case: its examples come from an invented story, *The
Miller's Purse* (below). The full reference, with the engine's behaviour, is `docs/case-format.md` (which has spoilers
for the cases it was shaped on, and is never sent).

## The invented example

*The Miller's Purse*, narrated in the first person by Dr. Hale. ¶1: Hale and his friend Ashdown are at breakfast in
Ashdown's rooms on a Tuesday. ¶3: a telegram from the miller, Joseph Crane, asks for help: his purse, with forty
pounds in it, was taken from the mill-house in the night. ¶5–9: at the mill, Crane tells them that he locked the
purse in his desk at ten; his daughter Ruth says she heard the yard gate creak at about midnight; the carter, Dobbs,
says he slept in the stable loft and heard nothing. The village constable, Pryor, has arrested a pedlar seen on the
road. ¶12: Ashdown finds flour on the desk's lock. ¶20: Ashdown explains that Dobbs took the purse, with the key
he had copied, and that the pedlar never came near the mill.

## A case

A case is a directory with the story and the world model:

```
story.txt              the text, paragraphs separated by blank lines; ¶0 is the title
world/case.json        the header
world/entities.json    every person, group, animal, place, object, document, topic and state
world/mentions.json    how the story names each entity
world/times.json       time points and their partial order
world/facts.json       the facts
world/accounts.json    the accounts facts travel in
world/questions.json   the questions, their possibilities and answers
```

Paragraphs are numbered from 0, in the order the text gives them (¶0 the title). Every `para` is that number.
Every `quote` is copied exactly from that paragraph (a clause or a few words, not the whole paragraph); straight and
curly quotes and dashes count as the same. Each file is one JSON object per line.

**Ids.** Entities: short snake case (`crane`, `mill_house`, `desk`, `the_pedlar`). Time points: `t.` and a
short name (`t.tue_breakfast`, `t.mon_night`). Facts: `f.` and a short name (`f.purse_in_desk`). Accounts: `acct.`
and the source (`acct.ruth`). Questions: `q.` and a short name (`q.who_took`).

**Nothing runs ahead of the story.** A name, label or text that the page shows at a paragraph must not tell more
than the story has told by then. An unknown person is named by how the story first presents them (`the_pedlar`,
"The pedlar on the road"), never by who they turn out to be; an identity is a fact (`identity`) or a question, at its
own paragraph. A question's label asks what the story has made a reader wonder; it never hints at the answer.

## case.json

```json
{"id": "millers_purse", "title": "The Miller's Purse", "author": "…", "story": "../story.txt",
 "narrators": [{"id": "hale", "name": "Hale", "kind": "first-person", "trust": "certain"}],
 "subtitle": "Hale's timeline", "source": {"…": "…"}}
```

`narrators`: who tells the story to the reader. A first-person narrator is an entity of the story; an impersonal
third-person narrator is the id `narrator` (`kind: third-person`), which is no entity.

## entities.json

`{"id", "kind", "name", "within"?, "source"?, "summary"?}`, with `moves` (entities that travel: a cart, a train) and
`joins` (a door's two sides, inside first) beside the list:

```json
{"moves": ["cart"], "joins": {"yard_gate": ["yard", "lane"]}, "entities": [
  {"id": "crane", "kind": "person", "name": "Joseph Crane"},
  {"id": "mill_house", "kind": "place", "name": "The mill-house", "within": "mill"},
  {"id": "desk", "kind": "object", "name": "Crane's desk", "within": "mill_house"},
  {"id": "the_pedlar", "kind": "person", "name": "The pedlar on the road"},
  {"id": "constabulary", "kind": "group", "name": "The village constabulary"},
  {"id": "calendar", "kind": "state", "name": "The day of the week"},
  {"id": "clock", "kind": "state", "name": "The time of day"}
]}
```

Kinds: `person`, `group`, `animal`, `place`, `object`, `document`, `topic` (the subject of a general rule: milling,
locks), `state` (`calendar`, `clock`, `weather`: their facts give the weekday, the hour, the weather). `within` folds a
place or a part into another (the desk within the mill-house within the mill). Who is in a group is each member's
`member_of` fact. A name is what the story calls it, as plainly as possible.

## mentions.json

`{"entities": {id: [phrase, …]}}`. A phrase is a string matched exactly, on word boundaries, the longest winning
where two overlap; or `{"text", "paras": [from, to]}` to limit it to some paragraphs (inclusive), where the same words
name someone else elsewhere ("the old man" is Crane in ¶5–9 only). Every name and description the story uses for an
entity, as it appears in the text (`"Crane"`, `"Joseph Crane"`, `"the miller"`). An entity with no phrase carries a
`source` quote in entities.json instead.

## times.json

`{"id", "label", "day"?, "clock"?, "after"?, "para"?, "quote"?, "note"?}`: a point in the story's time.

```json
{"id": "t.before", "label": "Before the story"},
{"id": "t.mon_ten", "label": "Monday, ten o'clock", "after": "t.before", "para": 6, "quote": "I locked it in the desk at ten"},
{"id": "t.mon_midnight", "label": "Monday, about midnight", "after": "t.mon_ten", "para": 7, "quote": "about midnight"},
{"id": "t.tue_breakfast", "label": "Tuesday, at breakfast", "after": "t.mon_midnight", "para": 1, "quote": "at breakfast"}
```

`after` (one id or a list) is the partial order: a point is certainly later than every point it is after. Order
only what the text orders. Two points not ordered by `after` may be either way. A thing that moves needs a point of
its own for each move (the cart in the lane, then at the gate): one point for two places would put it in both at
once. `day` and `clock` are labels only; the weekday and the hour are facts on `calendar` and `clock`.

## facts.json

One fact each: `{"id", "of", "attr", "value", "detail"?, "neg"?, "to"?, "time", "para", "quote", …}`.

- `attr` is one of: `location` (where it is at that time), `lives_at` (where it lives or is kept), `member_of`,
  `carrying`, `wearing`, `action` (something done: "locked the purse in the desk"), `says`, `observes`, `knows`,
  `believes`, `intends`, `condition`, `contents`, `role`, `reputed`, `rule` (a general rule, on a topic), `position`,
  `owner`, `identity`, `name`, `weekday`, `hour`, `speed`, `time`, `tells`.
- `value` is an entity id where there is one, otherwise short text. A `location` value is always a place or thing id
  (or null when unknown), with the rest in `detail` ("at the window"), so that places can be compared. `neg: true`
  denies the fact ("not at the mill"; the desk empty).
- `time` is `{"at": t}`, `{"from": t, "to": t}` (an open end means until further notice) or `{"after": t,
  "before": t}` (somewhere between).
- `para` and `quote`: the paragraph that tells it and the words that do. One fact per thing told; a sentence that
  tells three things is three facts.
- `basis`: `stated` (the default), `implied` (the text presupposes it: Crane owns the purse he calls "my purse"), or
  `inferable` (it follows from facts told so far: `from`, a list of fact ids, and `inferable_at`, the paragraph).
- `truth`: `true` (the default), `false` (the answer key says otherwise) or `null` (the story never settles it).

```json
{"id": "f.purse_in_desk", "of": "purse", "attr": "location", "value": "desk", "time": {"from": "t.mon_ten"}, "para": 6, "quote": "I locked it in the desk at ten"},
{"id": "f.crane_locks", "of": "crane", "attr": "action", "value": "locks the purse in his desk", "time": {"at": "t.mon_ten"}, "para": 6, "quote": "I locked it in the desk at ten"},
{"id": "f.cal_tue", "of": "calendar", "attr": "weekday", "value": "Tuesday", "time": {"at": "t.tue_breakfast"}, "para": 1, "quote": "on the Tuesday morning"}
```

**Speech and belief.** What someone says is a `says` fact, what someone holds a `believes` fact (true: the saying or
the belief happened). What it asserts is in `asserts`: a list of states `{of, attr, value, time?, neg?}` or of
question picks `{q, pick, neg?}` (once the questions exist). `modal: "possible"` marks a claim of what may or could
be. A fact that is the content of a claim, told as a fact of its own, carries `claim` (the says or believes fact id);
a fact that is what someone said in the narrator's hearing, with no says fact of its own, carries `word` (the
speaker).

```json
{"id": "f.ruth_says_gate", "of": "ruth", "attr": "says", "value": "she heard the yard gate creak", "to": "ashdown", "time": {"at": "t.tue_mill"}, "para": 7, "quote": "I heard the yard gate creak", "asserts": [{"of": "yard_gate", "attr": "action", "value": "creaks", "time": {"at": "t.mon_midnight"}}]},
{"id": "f.pryor_believes", "of": "pryor", "attr": "believes", "value": "the pedlar took the purse", "time": {"at": "t.tue_mill"}, "para": 9, "quote": "the pedlar's our man"}
```

**Tellings.** A `tells` fact passes accounts from one person to another: `of` the teller, `value` an account id or a
list, `to` the hearer, `how` (told, statement, sworn statement, report, newspaper, telegram, analysis, letter),
`partial: true` when only part of it was passed, `of: "?"` when the teller is unknown.

```json
{"id": "f.crane_tells", "of": "crane", "attr": "tells", "value": "acct.crane", "to": "hale", "how": "told", "time": {"at": "t.tue_mill"}, "para": 6, "quote": "Crane told us"}
```

## accounts.json

What one source tells, as a bundle of facts: `{"id", "label", "origin", "how", "facts"?, "parts"?}`. `origin` is who
first had it (null when not said); `how` how they had it (saw, did, said, examination, analysis, inference, own,
report; `bundle` for an account made of other accounts, `parts`). Every narrator has an account of what they see and
hear themselves (`acct.hale`, origin `hale`, how `saw`). A fact may be in several accounts (two witnesses of one
scene). Every fact the story tells is in an account that a chain of tellings carries to a narrator, with these
exceptions: a `says` or `believes` fact heard by the narrator is in the narrator's account; a fact with `claim` or
`word` is in no account (it reaches the reader through the speaker).

```json
{"id": "acct.hale", "label": "What Hale sees and hears himself", "origin": "hale", "how": "saw", "facts": ["f.cal_tue", "f.ruth_says_gate", "f.pryor_believes"]},
{"id": "acct.crane", "label": "Crane's account of the night", "origin": "crane", "how": "did", "facts": ["f.purse_in_desk", "f.crane_locks"]}
```

What a character tells the narrator in direct speech is a `says` fact in the narrator's account (with its
`asserts`) when the saying itself matters, or the facts of a told account (a telling to the narrator, the facts in
the teller's account) when it is a report of events. Never file in the narrator's own account a fact the narrator
only heard about: that would make it read as seen.

## questions.json

An uncertain entry: `{"id", "label", "entry", "raised", "quote", "possibilities", "answer", "kind"?, "note"?}`.

- `label`: the question as a reader would ask it ("Who took the purse?").
- `entry`: the fact it leaves open, `{of, attr, time}`, with `of: "?"` when the question is who.
- `raised`: the paragraph where the story opens the question, with `quote` there (null when the story never
  doubts it: a latent question).
- `possibilities`: `{value, available, via, from?, reasoning?, quote?, out?, by?}`. `value` an entity id or short
  text. `available`: from which paragraph it is a possibility. `via: direct` (someone in the story puts it
  forward; a `quote` there), `indirect` (it follows from what has been told: `from` a fact, or `reasoning`, a
  careful reader's step `{para, text}`), or `always` (exactly one per question: `"something else"`, available
  from `raised`). `out`/`by`: the paragraph and the fact that rule it out, if the story does.
- `answer`: the true possibility (null if the story never settles it); `also_right`: others just as true.
- The answer's dates: `answer_given_at` and `answer_given_quote`, where the story gives it away, and
  `answer_inferable_at`, the earliest paragraph a careful reader can reach it (null: only the give-away), with
  `answer_from` (a fact) or `answer_reasoning` (`{para, text}`).
- `kind: "provenance"`: a question about how something was passed on (who sent the telegram), kept off the
  player's list unless the story raises it.

```json
{"id": "q.who_took", "label": "Who took the purse?", "entry": {"of": "?", "attr": "action", "time": {"after": "t.mon_ten", "before": "t.tue_breakfast"}}, "raised": 3, "quote": "taken from the mill-house in the night", "possibilities": [
  {"value": "something else", "available": 3, "via": "always"},
  {"value": "the_pedlar", "available": 9, "via": "direct", "quote": "the pedlar's our man"},
  {"value": "dobbs", "available": 8, "via": "indirect", "reasoning": {"para": 8, "text": "Dobbs slept by the yard and says he heard nothing, though Ruth heard the gate from the house."}}],
 "answer": "dobbs", "answer_given_at": 20, "answer_given_quote": "Dobbs took the purse", "answer_inferable_at": 12, "answer_reasoning": {"para": 12, "text": "Flour on the lock: whoever opened the desk came from the mill floor, and only Dobbs works there at night."}}
```

A fact that answers or bears on a question carries `q` and `pick` (a stated answer); a claim's `asserts` may hold
picks (`{"q": "q.who_took", "pick": "the_pedlar"}`: the constable's belief).

## The two dates of a fact

`given_at` is where the story states the fact (default: `para`); it is earlier, with `given_quote`, when an earlier
line already says it in brief. `inferable_at` is the earliest paragraph a careful reader can reach the fact from what
came before, with `from` (facts) or `reasoning` (`{para, text}`, a step in words), and `strength: "likely"` when it
would be held but does not strictly follow. These are written once the whole story is in, by the step that sees it.

## Typed actions (optional, for doors and keys)

A fact may be a typed action: `act` (`lock`, `unlock`, `open`, `close`, `go_through`, `lead_out`, `give`, `ask`,
`drug`, `strike`, `hide`) and `thing` (what it acts on), its agent the fact's `of`. A door's state is `attr: "door"`,
`value` one of `open`, `shut`, `locked`. Write these only where the text makes them matter.


## Your task

Write the facts that scene s01 (Breakfast at Baker Street and the train to Dartmoor, ¶1–¶16) tells, and the accounts they travel
in. You have the story up to the end of this scene and the data so far; you have not read further.

- Every fact the scene's paragraphs tell, one per thing told, each with its paragraph and the exact words: where
  everyone and everything is and when, who has or wears what, what is done, what is said (a `says` fact, with what
  it `asserts`), what someone believes, knows or intends, conditions, roles, owners, names, the weekday and the hour
  (on `calendar`, `clock`). A long speech that reports events is a telling of an account (the speaker's), whose
  facts are the events; the speech itself is a `says` fact only where the saying matters (a claim that may be
  false, a theory, an accusation).
- Lines: `{"file": "facts", …}`; a new account `{"file": "accounts", "id", "label", "origin", "how", "facts"}`;
  facts added to an account so far `{"file": "account_add", "id", "facts": [...]}`.
- Provenance: what the narrator sees and hears goes in the narrator's own account (acct.watson); what
  someone tells the narrator goes in that someone's account, with a `tells` fact to the narrator; what reached
  them from someone else goes in the first source's account, carried by a `tells` fact at each step. Never file in
  the narrator's own account a fact the narrator only heard about.
- Leave `truth` out (everything is true by default): the answer key comes at the end of the story. Leave out
  `inferable` facts and the two dates (`given_at`, `inferable_at`): a later step adds them. No `q` or `pick` yet.
- If a fact needs an entity or a time point not listed, add it: `{"file": "entities", …}`, `{"file": "times", …}`.
- A fact so far that this scene corrects: `{"file": "facts", "id", …the fields that change}`.

## The narrators

[{"id":"watson","name":"Watson","kind":"first-person"}]

## Entities

moves: ["train"]
{"id":"watson","kind":"person","name":"Watson"}
{"id":"holmes","kind":"person","name":"Sherlock Holmes"}
{"id":"rooms","kind":"place","name":"Holmes and Watson's room"}
{"id":"news_agent","kind":"person","name":"Their news agent"}
{"id":"england","kind":"place","name":"England"}
{"id":"dartmoor","kind":"place","name":"Dartmoor","within":"england"}
{"id":"kings_pyland","kind":"place","name":"King's Pyland","within":"dartmoor"}
{"id":"paddington","kind":"place","name":"Paddington station","within":"england"}
{"id":"reading","kind":"place","name":"Reading","within":"england"}
{"id":"exeter","kind":"place","name":"Exeter","within":"england"}
{"id":"railway_line","kind":"place","name":"The railway line to Exeter","within":"england"}
{"id":"telegraph_posts","kind":"object","name":"The telegraph posts along the line","within":"railway_line"}
{"id":"train","kind":"object","name":"The train from Paddington"}
{"id":"carriage","kind":"place","name":"The first-class carriage","within":"train"}
{"id":"carriage_seat","kind":"object","name":"The seat of the carriage","within":"carriage"}
{"id":"carriage_window","kind":"object","name":"The carriage window","within":"carriage"}
{"id":"silver_blaze","kind":"animal","name":"Silver Blaze"}
{"id":"wessex_cup","kind":"topic","name":"The Wessex Cup"}
{"id":"straker","kind":"person","name":"John Straker"}
{"id":"ross","kind":"person","name":"Colonel Ross"}
{"id":"gregory","kind":"person","name":"Inspector Gregory"}
{"id":"simpson","kind":"person","name":"Fitzroy Simpson"}
{"id":"pipe","kind":"object","name":"Holmes's pipe"}
{"id":"newspapers","kind":"document","name":"The day's newspapers"}
{"id":"telegraph_paper","kind":"document","name":"The Telegraph"}
{"id":"chronicle_paper","kind":"document","name":"The Chronicle"}
{"id":"field_glass","kind":"object","name":"Watson's field-glass"}
{"id":"travelling_cap","kind":"object","name":"Holmes's travelling-cap"}
{"id":"cigar_case","kind":"object","name":"Holmes's cigar-case"}
{"id":"holmes_watch","kind":"object","name":"Holmes's watch"}
{"id":"ross_telegram","kind":"document","name":"Colonel Ross's telegram to Holmes","source":"I received telegrams from both Colonel Ross, the owner of the horse"}
{"id":"gregory_telegram","kind":"document","name":"Inspector Gregory's telegram to Holmes","source":"and from Inspector Gregory, who is looking after the case, inviting my co-operation"}
{"id":"memoirs","kind":"document","name":"Watson's memoirs"}
{"id":"calendar","kind":"state","name":"The day of the week"}
{"id":"clock","kind":"state","name":"The time of day"}

## Time points

{"id":"t.before","label":"Before the story"}
{"id":"t.crime","label":"The disappearance of Silver Blaze and the murder of John Straker","after":"t.before","para":4,"quote":"the singular disappearance of the favourite for the Wessex Cup, and the tragic murder of its trainer","note":"Undated so far; before the telegrams of Tuesday evening, which ask Holmes to help with the case."}
{"id":"t.tue_evening","label":"Tuesday evening: telegrams from Ross and Gregory","day":"Tuesday","clock":"evening","after":"t.crime","para":12,"quote":"On Tuesday evening I received telegrams"}
{"id":"t.wed","label":"Wednesday: Holmes broods and waits for news","day":"Wednesday","after":"t.tue_evening","para":14,"quote":"From hour to hour yesterday I expected to hear that he had been found","note":"Also the 'whole day' of ¶4, when Holmes paces the room and the papers are sent up."}
{"id":"t.simpson_arrest","label":"The arrest of Fitzroy Simpson","after":"t.crime","para":14,"quote":"beyond the arrest of young Fitzroy Simpson nothing had been done","note":"Known to Holmes by Thursday morning; not otherwise dated."}
{"id":"t.watson_reads","label":"Watson reads the Telegraph and the Chronicle on the case","after":"t.crime","para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say","note":"Some time before the train journey; not otherwise dated."}
{"id":"t.thu_breakfast","label":"Thursday morning, at breakfast in Baker Street","day":"Thursday","clock":"morning","after":["t.wed","t.simpson_arrest"],"para":1,"quote":"as we sat down together to our breakfast one morning","note":"The day is given in ¶13: 'this is Thursday morning'."}
{"id":"t.thu_paddington","label":"Thursday, leaving Paddington by train","day":"Thursday","after":"t.thu_breakfast","para":7,"quote":"the bundle of fresh papers which he had procured at Paddington"}
{"id":"t.thu_past_reading","label":"Thursday, on the train, Reading far behind","day":"Thursday","after":"t.thu_paddington","para":7,"quote":"We had left Reading far behind us"}
{"id":"t.thu_on_line","label":"Thursday, on the train beyond Reading: Holmes times the train and states the case","day":"Thursday","after":["t.thu_past_reading","t.watson_reads"],"para":8,"quote":"Our rate at present is fifty-three and a half miles an hour"}

## Accounts so far

(none yet)

## Facts so far

(none yet)

## The reader's notes on this scene (the annotated reading)

{"id":"t4.1","para":4,"tag":"RECORD","profile":"typical","from":[],"reads":"the singular disappearance of the favourite for the Wessex Cup, and the tragic murder of its trainer","text":"Two events: the favourite for the Wessex Cup has vanished, and its trainer has been murdered."}
{"id":"t4.2","para":4,"tag":"QUESTION","confidence":"fair","profile":"typical","from":["t4.1"],"text":"How are the disappearance and the murder connected?","options":["A thief came for the horse and killed the trainer who got in the way","The two are separate, or only linked by coincidence","The trainer was mixed up in what happened to the horse"]}
{"id":"t4.3","para":4,"tag":"HYPOTHESIS","confidence":"weak","profile":"typical","from":["t4.1"],"text":"What does 'disappearance' mean for the horse?","options":["Stolen and hidden","Strayed loose in the confusion","Killed or maimed and the body not yet found"]}
{"id":"t4.4","para":4,"tag":"QUESTION","subtype":"motive","confidence":"fair","profile":"typical","from":["t4.1","bk.favourite_motive"],"text":"Who gains if the favourite does not run? Bookmakers, people who bet against it, rival owners. Who would want the trainer dead?","options":["Someone with money riding against the favourite","A rival stable","Someone with a private grudge against the trainer"]}
{"id":"t6.1","para":6,"tag":"GENRE","subtype":"watch-detective","confidence":"weak","profile":"careful","from":["bk.genre_detective_signals"],"reads":"You would oblige me by bringing with you your very excellent field-glass.","text":"Holmes wants a field-glass before he has seen the ground. He expects to look at something at a distance: open moor, a racecourse, figures far off. Keep it in mind."}
{"id":"t6.2","para":6,"tag":"GENRE","confidence":"weak","profile":"typical","from":[],"reads":"there are points about the case which promise to make it an absolutely unique one","text":"Holmes already sees particular 'points', apparently from the newspaper reports alone. The clues may be in the facts he is about to list."}
{"id":"t8.1","para":8,"tag":"SET ASIDE","profile":"typical","from":[],"reads":"Our rate at present is fifty-three and a half miles an hour.","text":"The speed calculation from the telegraph posts shows off Holmes's method. It has no bearing on the case."}
{"id":"t10.1","para":10,"tag":"RECORD","profile":"typical","from":["t4.1"],"reads":"this matter of the murder of John Straker and the disappearance of Silver Blaze","text":"Names: the trainer is John Straker, and the horse is Silver Blaze."}
{"id":"t12.1","para":12,"tag":"GENRE","confidence":"fair","profile":"careful","from":[],"reads":"the art of the reasoner should be used rather for the sifting of details than for the acquiring of fresh evidence","text":"Holmes says the answer lies in the facts already known, once they are cleared of journalists' theorising. So the reader should treat his coming summary as the evidence to sift, and distrust press 'conjecture'."}
{"id":"t12.2","para":12,"tag":"RECORD","profile":"typical","from":[],"reads":"I received telegrams from both Colonel Ross, the owner of the horse, and from Inspector Gregory, who is looking after the case, inviting my co-operation","text":"Colonel Ross owns the horse, and Inspector Gregory leads the police case. Both called Holmes in on Tuesday evening."}
{"id":"t13.1","para":13,"tag":"INFER","confidence":"strong","profile":"careful","from":["t12.2"],"reads":"And this is Thursday morning.","text":"The telegrams came Tuesday evening, so the crime happened no later than Tuesday, probably Monday night or Tuesday. Two days have now passed."}
{"id":"t14.1","para":14,"tag":"DEFAULT","confidence":"fair","profile":"typical","from":["t4.3","bk.horse_conspicuous"],"reads":"I could not believe it possible that the most remarkable horse in England could long remain concealed, especially in so sparsely inhabited a place as the north of Dartmoor","text":"Holmes reasoned as anyone would: a famous horse on an empty moor gets found quickly."}
{"id":"t14.2","para":14,"tag":"DROP","confidence":"fair","profile":"typical","from":["t4.3","t13.1","t14.1"],"relations":[{"type":"drops","target":"t4.3"}],"text":"The horse cannot have simply strayed. A loose favourite on a thinly peopled moor would have turned up within two days. Someone is keeping it out of sight, or it is dead."}
{"id":"t14.3","para":14,"tag":"QUESTION","confidence":"fair","profile":"careful","from":["t14.1","t14.2","bk.horse_conspicuous"],"text":"How can so conspicuous a horse stay unfound? Turn it around: what would make the usual rule fail here?","options":["Shut in a building nearby","Changed in appearance so that nobody recognises it","Taken a long way off very quickly","Dead, and the body hidden"]}
{"id":"t14.4","para":14,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"fair","profile":"typical","from":["t4.2","t14.1"],"reads":"I expected to hear that he had been found, and that his abductor was the murderer of John Straker","text":"Working theory, Holmes's own until now: one person took the horse and killed Straker."}
{"id":"t14.5","para":14,"tag":"RECORD","profile":"typical","from":[],"reads":"beyond the arrest of young Fitzroy Simpson nothing had been done","text":"The police have arrested a young man, Fitzroy Simpson."}
{"id":"t14.6","para":14,"tag":"HYPOTHESIS","confidence":"weak","profile":"typical","from":["t14.5","t14.4"],"text":"Simpson is the abductor and murderer.","options":["Simpson did both","Simpson did one or the other","Simpson is innocent and was arrested on suspicion"]}
{"id":"t14.7","para":14,"tag":"WEIGH","confidence":"weak","profile":"careful","from":["t14.5","t14.6"],"relations":[{"type":"strains","target":"t14.6"}],"text":"Holmes treats the arrest as 'nothing having been done'. To him an arrest does not settle the case, especially with the horse still missing. If Simpson knew where the horse was, one might expect it to have been found by now."}
{"id":"t14.8","para":14,"tag":"GENRE","subtype":"watch-detective","confidence":"weak","profile":"careful","from":[],"reads":"Yet in some ways I feel that yesterday has not been wasted.","text":"The fact that the horse was not found is itself information to Holmes. Its continued absence is a clue to how it is being hidden."}
{"id":"t16.1","para":16,"tag":"RESIDUE","confidence":"fair","profile":"careful","from":["t4.2","t4.4","t14.3","t14.4","t14.6","t6.1"],"text":"Open at the end of the scene: how the murder and the disappearance connect; where an unfindable famous horse can be; who profits if the favourite does not run; whether Simpson is more than a convenient arrest; and what Holmes means to look at with the field-glass. The details have not been given yet. Holmes's list of facts comes next and should be read closely."}
{"id":"t16.2","para":16,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"typical","from":["t14.4","t14.2","t4.4"],"text":"Leading picture so far: someone with an interest against the favourite stole or harmed Silver Blaze, killed Straker in the process, and has hidden the horse well. Simpson is the police's candidate. It is held loosely, because Holmes's own version of it has already failed once."}

## The story so far (this scene is ¶1–¶16)

¶0 I. Silver Blaze

¶1 I am afraid, Watson, that I shall have to go,” said Holmes, as we sat down together to our breakfast one morning.

¶2 “Go! Where to?”

¶3 “To Dartmoor; to King’s Pyland.”

¶4 I was not surprised. Indeed, my only wonder was that he had not already been mixed up in this extraordinary case, which was the one topic of conversation through the length and breadth of England. For a whole day my companion had rambled about the room with his chin upon his chest and his brows knitted, charging and recharging his pipe with the strongest black tobacco, and absolutely deaf to any of my questions or remarks. Fresh editions of every paper had been sent up by our news agent, only to be glanced over and tossed down into a corner. Yet, silent as he was, I knew perfectly well what it was over which he was brooding. There was but one problem before the public which could challenge his powers of analysis, and that was the singular disappearance of the favourite for the Wessex Cup, and the tragic murder of its trainer. When, therefore, he suddenly announced his intention of setting out for the scene of the drama it was only what I had both expected and hoped for.

¶5 “I should be most happy to go down with you if I should not be in the way,” said I.

¶6 “My dear Watson, you would confer a great favour upon me by coming. And I think that your time will not be misspent, for there are points about the case which promise to make it an absolutely unique one. We have, I think, just time to catch our train at Paddington, and I will go further into the matter upon our journey. You would oblige me by bringing with you your very excellent field-glass.”

¶7 And so it happened that an hour or so later I found myself in the corner of a first-class carriage flying along en route for Exeter, while Sherlock Holmes, with his sharp, eager face framed in his ear-flapped travelling-cap, dipped rapidly into the bundle of fresh papers which he had procured at Paddington. We had left Reading far behind us before he thrust the last one of them under the seat, and offered me his cigar-case.

¶8 “We are going well,” said he, looking out the window and glancing at his watch. “Our rate at present is fifty-three and a half miles an hour.”

¶9 “I have not observed the quarter-mile posts,” said I.

¶10 “Nor have I. But the telegraph posts upon this line are sixty yards apart, and the calculation is a simple one. I presume that you have looked into this matter of the murder of John Straker and the disappearance of Silver Blaze?”

¶11 “I have seen what the _Telegraph_ and the _Chronicle_ have to say.”

¶12 “It is one of those cases where the art of the reasoner should be used rather for the sifting of details than for the acquiring of fresh evidence. The tragedy has been so uncommon, so complete and of such personal importance to so many people, that we are suffering from a plethora of surmise, conjecture, and hypothesis. The difficulty is to detach the framework of fact—of absolute undeniable fact—from the embellishments of theorists and reporters. Then, having established ourselves upon this sound basis, it is our duty to see what inferences may be drawn and what are the special points upon which the whole mystery turns. On Tuesday evening I received telegrams from both Colonel Ross, the owner of the horse, and from Inspector Gregory, who is looking after the case, inviting my co-operation.”

¶13 “Tuesday evening!” I exclaimed. “And this is Thursday morning. Why didn’t you go down yesterday?”

¶14 “Because I made a blunder, my dear Watson—which is, I am afraid, a more common occurrence than any one would think who only knew me through your memoirs. The fact is that I could not believe it possible that the most remarkable horse in England could long remain concealed, especially in so sparsely inhabited a place as the north of Dartmoor. From hour to hour yesterday I expected to hear that he had been found, and that his abductor was the murderer of John Straker. When, however, another morning had come, and I found that beyond the arrest of young Fitzroy Simpson nothing had been done, I felt that it was time for me to take action. Yet in some ways I feel that yesterday has not been wasted.”

¶15 “You have formed a theory, then?”

¶16 “At least I have got a grip of the essential facts of the case. I shall enumerate them to you, for nothing clears up a case so much as stating it to another person, and I can hardly expect your co-operation if I do not show you the position from which we start.”


