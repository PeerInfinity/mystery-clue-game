<!-- system -->
You are one step of a pipeline that turns a detective story into structured data for a reading game. You see only
what this message gives you. Use only the text given, read as a first-time reader would read it: if you recognise
the story, do not use what you remember of it, its characters' secrets or its ending. Follow the format exactly.
Put your output in one or more ```jsonl fenced blocks, one JSON object per line; anything outside the blocks is
ignored, so keep remarks short.


<!-- user -->
# Repair

Your output for the task below did not pass the checks. Here is the task, your output, and the problems found.
Give only the lines that fix the problems, in the same format:

- a corrected line replaces your earlier line with the same `file` and `id` (for a possibility, the same `q` and
  `value`; for a card, the same `bk`): give the whole corrected line;
- a new line is added;
- `{"file": <file>, "id": <id>, "delete": true}` removes one of your earlier lines.

Everything you do not mention stays as it was. Do not repeat lines that need no change.

## The problems

- f.knife_on_dressing_table: no chain reaches the reader from acct.mrs_straker_knife
- f.straker_picks_knife: no chain reaches the reader from acct.mrs_straker_knife
- f.straker_carries_knife_out: no chain reaches the reader from acct.mrs_straker_knife

## Your previous output

```jsonl
{"file":"entities","id":"out_building","kind":"place","name":"The long grey-tiled out-building across the paddock","within":"kings_pyland"}
{"file":"times","id":"t.thu_holmes_alights","label":"Thursday evening: Holmes steps out of the landau at the villa; talk outside before going in","day":"Thursday","clock":"evening","after":"t.thu_villa","para":69,"quote":"he roused himself with a violent start and stepped out of the carriage"}
{"file":"times","id":"t.thu_sitting_room","label":"Thursday evening: in the sitting-room, the Inspector lays out Straker's things","day":"Thursday","clock":"evening","after":["t.thu_villa","t.thu_holmes_alights","t.inventory","t.mrs_straker_tells_police","t.milliner_account_made"],"para":78,"quote":"We all filed into the front room and sat round the central table"}
{"file":"facts","id":"f.holmes_leans_back_drive","of":"holmes","attr":"action","value":"leans back in the carriage; the conversation ceases","time":{"at":"t.thu_landau"},"para":69,"quote":"Holmes leaned back in the carriage, and the conversation ceased."}
{"file":"facts","id":"f.driver_pulls_up","of":"driver","attr":"action","value":"pulls up at Straker's villa","time":{"at":"t.thu_villa"},"para":69,"quote":"our driver pulled up at a neat little red-brick villa"}
{"file":"facts","id":"f.landau_at_villa","of":"landau","attr":"location","value":"road","detail":"pulled up at Straker's villa","time":{"from":"t.thu_villa"},"para":69,"quote":"pulled up at a neat little red-brick villa with overhanging eaves which stood by the road"}
{"file":"facts","id":"f.villa_look","of":"straker_villa","attr":"condition","value":"a neat little red-brick villa with overhanging eaves","time":{"at":"t.thu_villa"},"para":69,"quote":"a neat little red-brick villa with overhanging eaves"}
{"file":"facts","id":"f.villa_by_road","of":"straker_villa","attr":"position","value":"stands by the road","time":{"at":"t.thu_villa"},"para":69,"quote":"which stood by the road"}
{"file":"facts","id":"f.outbuilding_position","of":"out_building","attr":"position","value":"some distance off from the villa, across a paddock","time":{"at":"t.thu_villa"},"para":69,"quote":"Some distance off, across a paddock, lay a long grey-tiled out-building."}
{"file":"facts","id":"f.outbuilding_look","of":"out_building","attr":"condition","value":"long and grey-tiled","time":{"at":"t.thu_villa"},"para":69,"quote":"a long grey-tiled out-building"}
{"file":"facts","id":"f.moor_bronze","of":"moor","attr":"condition","value":"low curves, bronze-coloured from the fading ferns, stretching to the sky-line","time":{"at":"t.thu_villa"},"para":69,"quote":"the low curves of the moor, bronze-coloured from the fading ferns"}
{"file":"facts","id":"f.tavistock_steeples_visible","of":"tavistock","attr":"position","value":"its steeples visible on the sky-line from the villa","time":{"at":"t.thu_villa"},"para":69,"quote":"broken only by the steeples of Tavistock"}
{"file":"facts","id":"f.mapleton_visible","of":"mapleton","attr":"position","value":"a cluster of houses away to the westward, visible from the villa","time":{"at":"t.thu_villa"},"para":69,"quote":"a cluster of houses away to the westward which marked the Mapleton stables"}
{"file":"facts","id":"f.watson_springs_out","of":"watson","attr":"location","value":"road","detail":"out of the carriage by the villa","time":{"from":"t.thu_villa","to":"t.thu_holmes_alights"},"para":69,"quote":"We all sprang out with the exception of Holmes"}
{"file":"facts","id":"f.gregory_springs_out","of":"gregory","attr":"location","value":"road","detail":"out of the carriage by the villa","time":{"from":"t.thu_villa","to":"t.thu_holmes_alights"},"para":69,"quote":"We all sprang out with the exception of Holmes"}
{"file":"facts","id":"f.ross_springs_out","of":"ross","attr":"location","value":"road","detail":"out of the carriage by the villa","time":{"from":"t.thu_villa","to":"t.thu_holmes_alights"},"para":69,"quote":"We all sprang out with the exception of Holmes"}
{"file":"facts","id":"f.holmes_stays_landau","of":"holmes","attr":"location","value":"landau","detail":"still leaning back","time":{"from":"t.thu_villa","to":"t.thu_holmes_alights"},"para":69,"quote":"with the exception of Holmes, who continued to lean back"}
{"file":"facts","id":"f.holmes_absorbed","of":"holmes","attr":"condition","value":"eyes fixed on the sky in front of him, entirely absorbed in his own thoughts","time":{"from":"t.thu_villa","to":"t.thu_holmes_alights"},"para":69,"quote":"with his eyes fixed upon the sky in front of him, entirely absorbed in his own thoughts"}
{"file":"facts","id":"f.watson_touches_arm","of":"watson","attr":"action","value":"touches Holmes's arm","time":{"at":"t.thu_holmes_alights"},"para":69,"quote":"It was only when I touched his arm"}
{"file":"facts","id":"f.holmes_steps_out","of":"holmes","attr":"action","value":"rouses himself with a violent start and steps out of the carriage","time":{"at":"t.thu_holmes_alights"},"para":69,"quote":"he roused himself with a violent start and stepped out of the carriage"}
{"file":"facts","id":"f.holmes_out_villa","of":"holmes","attr":"location","value":"road","detail":"out of the carriage by the villa","time":{"from":"t.thu_holmes_alights"},"para":69,"quote":"stepped out of the carriage"}
{"file":"facts","id":"f.ross_surprised","of":"ross","attr":"action","value":"looks at Holmes in some surprise","time":{"at":"t.thu_holmes_alights"},"para":70,"quote":"who had looked at him in some surprise"}
{"file":"facts","id":"f.holmes_says_daydreaming","of":"holmes","attr":"says","value":"excuse me; he was day-dreaming","to":"ross","time":{"at":"t.thu_holmes_alights"},"para":70,"quote":"I was day-dreaming.","asserts":[{"of":"holmes","attr":"action","value":"was day-dreaming"}]}
{"file":"facts","id":"f.holmes_gleam","of":"holmes","attr":"condition","value":"a gleam in his eyes and a suppressed excitement in his manner","time":{"at":"t.thu_holmes_alights"},"para":70,"quote":"There was a gleam in his eyes and a suppressed excitement in his manner"}
{"file":"facts","id":"f.watson_believes_clue","of":"watson","attr":"believes","value":"Holmes has his hand upon a clue, though Watson cannot imagine where he found it","time":{"at":"t.thu_holmes_alights"},"para":70,"quote":"that his hand was upon a clue, though I could not imagine where he had found it","asserts":[{"of":"holmes","attr":"knows","value":"a clue to the case"}]}
{"file":"facts","id":"f.gregory_offers_scene","of":"gregory","attr":"action","act":"ask","value":"asks whether Holmes would prefer to go on at once to the scene of the crime","time":{"at":"t.thu_holmes_alights"},"para":71,"quote":"Perhaps you would prefer at once to go on to the scene of the crime, Mr. Holmes?"}
{"file":"facts","id":"f.holmes_intends_stay","of":"holmes","attr":"intends","value":"to stay at the villa a little and go into one or two questions of detail","time":{"at":"t.thu_holmes_alights"},"para":72,"quote":"I think that I should prefer to stay here a little and go into one or two questions of detail."}
{"file":"facts","id":"f.holmes_asks_brought_back","of":"holmes","attr":"action","act":"ask","value":"asks whether Straker was brought back to the villa","time":{"at":"t.thu_holmes_alights"},"para":72,"quote":"Straker was brought back here, I presume?"}
{"file":"facts","id":"f.straker_brought_back","of":"straker","attr":"location","value":"straker_villa","detail":"his body brought back","time":{"from":"t.straker_brought_back"},"para":73,"quote":"Yes; he lies upstairs."}
{"file":"facts","id":"f.body_upstairs","of":"straker","attr":"location","value":"upstairs_room","detail":"his body lies there","time":{"at":"t.thu_holmes_alights"},"para":73,"quote":"he lies upstairs"}
{"file":"facts","id":"f.inquest_tomorrow","of":"straker","attr":"condition","value":"the inquest on him is to be held to-morrow","time":{"at":"t.inquest"},"para":73,"quote":"The inquest is to-morrow."}
{"file":"facts","id":"f.cal_inquest_fri","of":"calendar","attr":"weekday","value":"Friday","basis":"implied","time":{"at":"t.inquest"},"para":73,"quote":"The inquest is to-morrow."}
{"file":"facts","id":"f.holmes_asks_service","of":"holmes","attr":"action","act":"ask","value":"asks Colonel Ross whether Straker has been in his service some years","time":{"at":"t.thu_holmes_alights"},"para":74,"quote":"He has been in your service some years, Colonel Ross?"}
{"file":"facts","id":"f.ross_says_servant","of":"ross","attr":"says","value":"he has always found Straker an excellent servant","to":"holmes","time":{"at":"t.thu_holmes_alights"},"para":75,"quote":"I have always found him an excellent servant.","asserts":[{"of":"straker","attr":"reputed","value":"an excellent servant to Colonel Ross"}]}
{"file":"facts","id":"f.holmes_asks_inventory","of":"holmes","attr":"action","act":"ask","value":"asks whether the Inspector made an inventory of what Straker had in his pockets at the time of his death","time":{"at":"t.thu_holmes_alights"},"para":76,"quote":"I presume that you made an inventory of what he had in his pockets at the time of his death, Inspector?"}
{"file":"facts","id":"f.gregory_keeps_things","of":"gregory","attr":"action","value":"keeps the things from Straker's pockets in a tin box in the sitting-room","time":{"at":"t.inventory"},"para":77,"quote":"I have the things themselves in the sitting-room"}
{"file":"facts","id":"f.box_in_sitting_room","of":"tin_box","attr":"location","value":"sitting_room","time":{"from":"t.inventory","to":"t.thu_sitting_room"},"para":77,"quote":"I have the things themselves in the sitting-room"}
{"file":"facts","id":"f.straker_had_vestas","of":"straker","attr":"carrying","value":"vestas","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"There was a box of vestas"}
{"file":"facts","id":"f.straker_had_candle","of":"straker","attr":"carrying","value":"candle","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"two inches of tallow candle"}
{"file":"facts","id":"f.straker_had_pipe","of":"straker","attr":"carrying","value":"briar_pipe","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"an A.D.P. briar-root pipe"}
{"file":"facts","id":"f.straker_had_pouch","of":"straker","attr":"carrying","value":"tobacco_pouch","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"a pouch of seal-skin with half an ounce of long-cut Cavendish"}
{"file":"facts","id":"f.straker_had_watch","of":"straker","attr":"carrying","value":"silver_watch","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"a silver watch with a gold chain"}
{"file":"facts","id":"f.straker_had_sovereigns","of":"straker","attr":"carrying","value":"sovereigns","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"five sovereigns in gold"}
{"file":"facts","id":"f.straker_had_pencil","of":"straker","attr":"carrying","value":"pencil_case","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"an aluminium pencil-case"}
{"file":"facts","id":"f.straker_had_papers","of":"straker","attr":"carrying","value":"pocket_papers","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"a few papers"}
{"file":"facts","id":"f.watson_in_sitting_room","of":"watson","attr":"location","value":"central_table","detail":"seated round it","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"We all filed into the front room and sat round the central table"}
{"file":"facts","id":"f.holmes_in_sitting_room","of":"holmes","attr":"location","value":"central_table","detail":"seated round it","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"We all filed into the front room and sat round the central table"}
{"file":"facts","id":"f.gregory_in_sitting_room","of":"gregory","attr":"location","value":"central_table","detail":"seated round it","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"We all filed into the front room and sat round the central table"}
{"file":"facts","id":"f.ross_in_sitting_room","of":"ross","attr":"location","value":"central_table","detail":"seated round it","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"We all filed into the front room and sat round the central table"}
{"file":"facts","id":"f.gregory_unlocks_box","of":"gregory","attr":"action","act":"unlock","thing":"tin_box","value":"unlocks the square tin box","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"the Inspector unlocked a square tin box"}
{"file":"facts","id":"f.gregory_lays_out","of":"gregory","attr":"action","value":"lays a small heap of things before them","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"laid a small heap of things before us"}
{"file":"facts","id":"f.vestas_on_table","of":"vestas","attr":"location","value":"central_table","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"There was a box of vestas"}
{"file":"facts","id":"f.candle_on_table","of":"candle","attr":"location","value":"central_table","detail":"two inches of tallow candle","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"two inches of tallow candle"}
{"file":"facts","id":"f.pipe_on_table","of":"briar_pipe","attr":"location","value":"central_table","detail":"an A.D.P. briar-root pipe","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"an A.D.P. briar-root pipe"}
{"file":"facts","id":"f.pouch_on_table","of":"tobacco_pouch","attr":"location","value":"central_table","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"a pouch of seal-skin"}
{"file":"facts","id":"f.pouch_contents","of":"tobacco_pouch","attr":"contents","value":"half an ounce of long-cut Cavendish","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"with half an ounce of long-cut Cavendish"}
{"file":"facts","id":"f.watch_on_table","of":"silver_watch","attr":"location","value":"central_table","detail":"with a gold chain","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"a silver watch with a gold chain"}
{"file":"facts","id":"f.sovereigns_on_table","of":"sovereigns","attr":"location","value":"central_table","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"five sovereigns in gold"}
{"file":"facts","id":"f.pencil_on_table","of":"pencil_case","attr":"location","value":"central_table","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"an aluminium pencil-case"}
{"file":"facts","id":"f.papers_on_table","of":"pocket_papers","attr":"location","value":"central_table","detail":"a few papers","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"a few papers"}
{"file":"facts","id":"f.knife_on_table","of":"straker_knife","attr":"location","value":"central_table","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"an ivory-handled knife"}
{"file":"facts","id":"f.knife_look","of":"straker_knife","attr":"condition","value":"ivory-handled, with a very delicate, inflexible blade","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"an ivory-handled knife with a very delicate, inflexible blade"}
{"file":"facts","id":"f.knife_maker","of":"straker_knife","attr":"condition","value":"marked Weiss & Co., London","time":{"at":"t.thu_sitting_room"},"para":78,"quote":"marked Weiss & Co., London"}
{"file":"facts","id":"f.holmes_says_singular_knife","of":"holmes","attr":"says","value":"this is a very singular knife","to":"watson","time":{"at":"t.thu_sitting_room"},"para":79,"quote":"This is a very singular knife,"}
{"file":"facts","id":"f.holmes_examines_knife","of":"holmes","attr":"action","value":"lifts up the knife and examines it minutely","time":{"at":"t.thu_sitting_room"},"para":79,"quote":"lifting it up and examining it minutely"}
{"file":"facts","id":"f.holmes_sees_blood","of":"holmes","attr":"observes","value":"blood-stains on the knife","time":{"at":"t.thu_sitting_room"},"para":79,"quote":"as I see blood-stains upon it"}
{"file":"facts","id":"f.holmes_presumes_grasp","of":"holmes","attr":"says","value":"he presumes from the blood-stains that this is the knife found in the dead man's grasp","to":"watson","time":{"at":"t.thu_sitting_room"},"para":79,"quote":"that it is the one which was found in the dead man’s grasp","asserts":[{"of":"straker","attr":"carrying","value":"straker_knife","time":{"at":"t.tue_hollow"}}]}
{"file":"facts","id":"f.holmes_asks_watson_knife","of":"holmes","attr":"action","act":"ask","thing":"straker_knife","value":"asks Watson whether the knife is in his line","time":{"at":"t.thu_sitting_room"},"para":79,"quote":"Watson, this knife is surely in your line?"}
{"file":"facts","id":"f.watson_says_cataract","of":"watson","attr":"says","value":"it is what doctors call a cataract knife","to":"holmes","time":{"at":"t.thu_sitting_room"},"para":80,"quote":"It is what we call a cataract knife","asserts":[{"of":"straker_knife","attr":"condition","value":"a cataract knife"}]}
{"file":"facts","id":"f.holmes_says_delicate","of":"holmes","attr":"says","value":"he thought so; a very delicate blade for very delicate work, strange to carry on a rough expedition, as it would not shut in the pocket","to":"watson","time":{"at":"t.thu_sitting_room"},"para":81,"quote":"A strange thing for a man to carry with him upon a rough expedition, especially as it would not shut in his pocket.","asserts":[{"of":"straker_knife","attr":"condition","value":"a very delicate blade devised for very delicate work"},{"of":"straker_knife","attr":"condition","value":"would not shut in a pocket"}]}
{"file":"facts","id":"f.cork_guarded_tip","of":"cork_disk","attr":"role","value":"guarded the tip of the knife","time":{"after":"t.before","before":"t.crime"},"para":82,"quote":"The tip was guarded by a disk of cork"}
{"file":"facts","id":"f.cork_beside_body","of":"cork_disk","attr":"location","value":"hollow","detail":"beside Straker's body","time":{"at":"t.tue_hollow"},"para":82,"quote":"which we found beside his body"}
{"file":"facts","id":"f.police_find_cork","of":"police","attr":"action","value":"find the disk of cork beside the body","time":{"at":"t.tue_hollow"},"para":82,"quote":"which we found beside his body"}
{"file":"facts","id":"f.knife_on_dressing_table","of":"straker_knife","attr":"location","value":"dressing_table","time":{"after":"t.before","before":"t.straker_takes_knife"},"para":82,"quote":"the knife had lain upon the dressing-table"}
{"file":"facts","id":"f.straker_picks_knife","of":"straker","attr":"action","value":"picks up the knife from the dressing-table as he leaves the room","time":{"at":"t.straker_takes_knife"},"para":82,"quote":"he had picked it up as he left the room"}
{"file":"facts","id":"f.straker_carries_knife_out","of":"straker","attr":"carrying","value":"straker_knife","time":{"from":"t.straker_takes_knife"},"para":82,"quote":"he had picked it up as he left the room"}
{"file":"facts","id":"f.mrs_straker_tells_knife","of":"mrs_straker","attr":"tells","value":"acct.mrs_straker_knife","to":"police","how":"told","time":{"at":"t.mrs_straker_tells_police"},"para":82,"quote":"His wife tells us that the knife had lain upon the dressing-table"}
{"file":"facts","id":"f.gregory_tells_knife","of":"gregory","attr":"tells","value":"acct.mrs_straker_knife","to":"watson","how":"told","time":{"at":"t.thu_sitting_room"},"para":82,"quote":"His wife tells us"}
{"file":"facts","id":"f.gregory_tells_knife_holmes","of":"gregory","attr":"tells","value":"acct.mrs_straker_knife","to":"holmes","how":"told","time":{"at":"t.thu_sitting_room"},"para":82,"quote":"His wife tells us"}
{"file":"facts","id":"f.gregory_says_poor_weapon","of":"gregory","attr":"says","value":"it was a poor weapon, but perhaps the best Straker could lay his hands on at the moment","to":"holmes","time":{"at":"t.thu_sitting_room"},"para":82,"quote":"It was a poor weapon, but perhaps the best that he could lay his hands on at the moment.","asserts":[{"of":"straker","attr":"intends","value":"to use the knife as a weapon of defence","modal":"possible","time":{"at":"t.straker_takes_knife"}}]}
{"file":"facts","id":"f.holmes_says_very_possible","of":"holmes","attr":"says","value":"very possible","to":"gregory","time":{"at":"t.thu_sitting_room"},"para":83,"quote":"Very possible."}
{"file":"facts","id":"f.holmes_asks_papers","of":"holmes","attr":"action","act":"ask","thing":"pocket_papers","value":"asks about the papers","time":{"at":"t.thu_sitting_room"},"para":83,"quote":"How about these papers?"}
{"file":"facts","id":"f.papers_hay","of":"pocket_papers","attr":"contents","value":"hay_accounts","detail":"three receipted hay-dealers' accounts","time":{"at":"t.thu_sitting_room"},"para":84,"quote":"Three of them are receipted hay-dealers’ accounts."}
{"file":"facts","id":"f.papers_ross_letter","of":"pocket_papers","attr":"contents","value":"ross_letter","time":{"at":"t.thu_sitting_room"},"para":84,"quote":"One of them is a letter of instructions from Colonel Ross."}
{"file":"facts","id":"f.ross_wrote_letter","of":"ross","attr":"action","value":"writes Straker a letter of instructions","basis":"implied","time":{"after":"t.before","before":"t.crime"},"para":84,"quote":"a letter of instructions from Colonel Ross"}
{"file":"facts","id":"f.papers_milliner","of":"pocket_papers","attr":"contents","value":"milliner_account","time":{"at":"t.thu_sitting_room"},"para":84,"quote":"This other is a milliner’s account"}
{"file":"facts","id":"f.milliner_amount","of":"milliner_account","attr":"condition","value":"for thirty-seven pounds fifteen","time":{"at":"t.thu_sitting_room"},"para":84,"quote":"a milliner’s account for thirty-seven pounds fifteen"}
{"file":"facts","id":"f.lesurier_makes_account","of":"lesurier","attr":"action","value":"makes out the milliner's account to William Derbyshire","time":{"at":"t.milliner_account_made"},"para":84,"quote":"made out by Madame Lesurier, of Bond Street, to William Derbyshire"}
{"file":"facts","id":"f.lesurier_role","of":"lesurier","attr":"role","value":"milliner","basis":"implied","time":{"at":"t.milliner_account_made"},"para":84,"quote":"a milliner’s account for thirty-seven pounds fifteen made out by Madame Lesurier"}
{"file":"facts","id":"f.lesurier_bond_street","of":"lesurier","attr":"lives_at","value":"bond_street","detail":"her business","time":{"at":"t.milliner_account_made"},"para":84,"quote":"Madame Lesurier, of Bond Street"}
{"file":"facts","id":"f.account_to_derbyshire","of":"milliner_account","attr":"role","value":"made out to William Derbyshire","time":{"at":"t.milliner_account_made"},"para":84,"quote":"to William Derbyshire"}
{"file":"facts","id":"f.mrs_straker_says_derbyshire","of":"mrs_straker","attr":"says","value":"Derbyshire was a friend of her husband's, and occasionally his letters were addressed to their house","to":"police","time":{"at":"t.mrs_straker_tells_police"},"para":84,"quote":"Mrs. Straker tells us that Derbyshire was a friend of her husband’s and that occasionally his letters were addressed here.","asserts":[{"of":"derbyshire","attr":"role","value":"a friend of John Straker"},{"of":"derbyshire","attr":"action","value":"has letters addressed to Straker's house","time":{"at":"t.derbyshire_letters"}}]}
{"file":"facts","id":"f.holmes_glances_account","of":"holmes","attr":"action","value":"glances down the milliner's account","time":{"at":"t.thu_sitting_room"},"para":85,"quote":"glancing down the account"}
{"file":"facts","id":"f.holmes_says_expensive","of":"holmes","attr":"says","value":"Madam Derbyshire had somewhat expensive tastes; twenty-two guineas is rather heavy for a single costume","to":"gregory","time":{"at":"t.thu_sitting_room"},"para":85,"quote":"Madam Derbyshire had somewhat expensive tastes,","asserts":[{"of":"madam_derbyshire","attr":"condition","value":"has expensive tastes in dress"},{"of":"milliner_account","attr":"contents","value":"billed_costume","detail":"a single costume at twenty-two guineas"}]}
{"file":"facts","id":"f.costume_price","of":"billed_costume","attr":"condition","value":"billed at twenty-two guineas","word":"holmes","time":{"at":"t.milliner_account_made"},"para":85,"quote":"Twenty-two guineas is rather heavy for a single costume."}
{"file":"facts","id":"f.holmes_says_nothing_more","of":"holmes","attr":"says","value":"there appears to be nothing more to learn; they may now go down to the scene of the crime","to":"gregory","time":{"at":"t.thu_sitting_room"},"para":85,"quote":"However there appears to be nothing more to learn, and we may now go down to the scene of the crime."}
{"file":"facts","id":"f.holmes_intends_scene","of":"holmes","attr":"intends","value":"to go down to the scene of the crime","time":{"at":"t.thu_sitting_room"},"para":85,"quote":"we may now go down to the scene of the crime"}
{"file":"facts","id":"f.watson_in_passage","of":"watson","attr":"location","value":"passage","time":{"at":"t.thu_passage"},"para":86,"quote":"As we emerged from the sitting-room"}
{"file":"facts","id":"f.holmes_in_passage","of":"holmes","attr":"location","value":"passage","time":{"at":"t.thu_passage"},"para":86,"quote":"As we emerged from the sitting-room"}
{"file":"facts","id":"f.gregory_in_passage","of":"gregory","attr":"location","value":"passage","time":{"at":"t.thu_passage"},"para":86,"quote":"As we emerged from the sitting-room"}
{"file":"facts","id":"f.mrs_straker_in_passage","of":"mrs_straker","attr":"location","value":"passage","detail":"waiting","time":{"from":"t.thu_sitting_room","to":"t.thu_passage"},"para":86,"quote":"a woman, who had been waiting in the passage"}
{"file":"facts","id":"f.mrs_straker_sleeve","of":"mrs_straker","attr":"action","value":"takes a step forward and lays her hand on the Inspector's sleeve","time":{"at":"t.thu_passage"},"para":86,"quote":"took a step forward and laid her hand upon the Inspector’s sleeve"}
{"file":"facts","id":"f.mrs_straker_face","of":"mrs_straker","attr":"condition","value":"face haggard, thin and eager, stamped with the print of a recent horror","time":{"at":"t.thu_passage"},"para":86,"quote":"Her face was haggard and thin and eager, stamped with the print of a recent horror."}
{"file":"facts","id":"f.mrs_straker_asks_found","of":"mrs_straker","attr":"says","value":"pants: have they got them, have they found them?","to":"gregory","time":{"at":"t.thu_passage"},"para":87,"quote":"Have you got them? Have you found them?"}
{"file":"facts","id":"f.gregory_says_not_found","of":"gregory","attr":"says","value":"no; but Mr. Holmes has come from London to help, and they will do all that is possible","to":"mrs_straker","time":{"at":"t.thu_passage"},"para":88,"quote":"No, Mrs. Straker. But Mr. Holmes here has come from London to help us","asserts":[{"of":"police","attr":"action","value":"have found those she asks after","neg":true,"time":{"at":"t.thu_passage"}},{"of":"holmes","attr":"intends","value":"to help the police"}]}
{"file":"facts","id":"f.holmes_says_plymouth","of":"holmes","attr":"says","value":"surely he met Mrs. Straker at a garden-party in Plymouth some little time ago","to":"mrs_straker","time":{"at":"t.thu_passage"},"para":89,"quote":"Surely I met you in Plymouth at a garden-party some little time ago, Mrs. Straker?","asserts":[{"of":"mrs_straker","attr":"location","value":"plymouth","detail":"at a garden-party","time":{"at":"t.plymouth_party"}},{"of":"holmes","attr":"location","value":"plymouth","detail":"at a garden-party","time":{"at":"t.plymouth_party"}}]}
{"file":"facts","id":"f.mrs_straker_says_mistaken","of":"mrs_straker","attr":"says","value":"no, he is mistaken","to":"holmes","time":{"at":"t.thu_passage"},"para":90,"quote":"No, sir; you are mistaken.","asserts":[{"of":"mrs_straker","attr":"location","value":"plymouth","detail":"at the garden-party","neg":true,"time":{"at":"t.plymouth_party"}}]}
{"file":"facts","id":"f.holmes_says_dove_dress","of":"holmes","attr":"says","value":"he could have sworn to it; she wore a costume of dove-coloured silk with ostrich-feather trimming","to":"mrs_straker","time":{"at":"t.thu_passage"},"para":91,"quote":"You wore a costume of dove-coloured silk with ostrich-feather trimming.","asserts":[{"of":"mrs_straker","attr":"wearing","value":"dove_dress","time":{"at":"t.plymouth_party"}}]}
{"file":"facts","id":"f.mrs_straker_no_dress","of":"mrs_straker","attr":"says","value":"she never had such a dress","to":"holmes","time":{"at":"t.thu_passage"},"para":92,"quote":"I never had such a dress, sir,","asserts":[{"of":"dove_dress","attr":"owner","value":"mrs_straker","neg":true}]}
{"file":"facts","id":"f.gregory_tells_villa_holmes","of":"gregory","attr":"tells","value":"acct.gregory_villa","to":"holmes","how":"told","time":{"from":"t.thu_holmes_alights","to":"t.thu_sitting_room"},"para":73,"quote":"Yes; he lies upstairs."}
{"file":"facts","id":"f.gregory_tells_villa_watson","of":"gregory","attr":"tells","value":"acct.gregory_villa","to":"watson","how":"told","time":{"from":"t.thu_holmes_alights","to":"t.thu_sitting_room"},"para":73,"quote":"Yes; he lies upstairs."}
{"file":"accounts","id":"acct.gregory_villa","label":"Inspector Gregory at the villa: the body, the inquest, the things in Straker's pockets and the cork","origin":"gregory","how":"report","facts":["f.straker_brought_back","f.body_upstairs","f.inquest_tomorrow","f.cal_inquest_fri","f.gregory_keeps_things","f.box_in_sitting_room","f.straker_had_vestas","f.straker_had_candle","f.straker_had_pipe","f.straker_had_pouch","f.straker_had_watch","f.straker_had_sovereigns","f.straker_had_pencil","f.straker_had_papers","f.cork_guarded_tip","f.cork_beside_body","f.police_find_cork","f.papers_hay","f.papers_ross_letter","f.ross_wrote_letter","f.papers_milliner","f.milliner_amount","f.lesurier_makes_account","f.lesurier_role","f.lesurier_bond_street","f.account_to_derbyshire","f.mrs_straker_says_derbyshire","f.mrs_straker_tells_knife"]}
{"file":"accounts","id":"acct.mrs_straker_knife","label":"Mrs. Straker's account to the police of the knife on the dressing-table","origin":"mrs_straker","how":"saw","facts":["f.knife_on_dressing_table","f.straker_picks_knife","f.straker_carries_knife_out"]}
{"file":"account_add","id":"acct.watson","facts":["f.holmes_leans_back_drive","f.driver_pulls_up","f.landau_at_villa","f.villa_look","f.villa_by_road","f.outbuilding_position","f.outbuilding_look","f.moor_bronze","f.tavistock_steeples_visible","f.mapleton_visible","f.watson_springs_out","f.gregory_springs_out","f.ross_springs_out","f.holmes_stays_landau","f.holmes_absorbed","f.watson_touches_arm","f.holmes_steps_out","f.holmes_out_villa","f.ross_surprised","f.holmes_says_daydreaming","f.holmes_gleam","f.watson_believes_clue","f.gregory_offers_scene","f.holmes_intends_stay","f.holmes_asks_brought_back","f.holmes_asks_service","f.ross_says_servant","f.holmes_asks_inventory","f.watson_in_sitting_room","f.holmes_in_sitting_room","f.gregory_in_sitting_room","f.ross_in_sitting_room","f.gregory_unlocks_box","f.gregory_lays_out","f.vestas_on_table","f.candle_on_table","f.pipe_on_table","f.pouch_on_table","f.pouch_contents","f.watch_on_table","f.sovereigns_on_table","f.pencil_on_table","f.papers_on_table","f.knife_on_table","f.knife_look","f.knife_maker","f.holmes_says_singular_knife","f.holmes_examines_knife","f.holmes_sees_blood","f.holmes_presumes_grasp","f.holmes_asks_watson_knife","f.watson_says_cataract","f.holmes_says_delicate","f.gregory_tells_knife","f.gregory_tells_knife_holmes","f.gregory_says_poor_weapon","f.holmes_says_very_possible","f.holmes_asks_papers","f.holmes_glances_account","f.holmes_says_expensive","f.holmes_says_nothing_more","f.holmes_intends_scene","f.watson_in_passage","f.holmes_in_passage","f.gregory_in_passage","f.mrs_straker_in_passage","f.mrs_straker_sleeve","f.mrs_straker_face","f.mrs_straker_asks_found","f.gregory_says_not_found","f.holmes_says_plymouth","f.mrs_straker_says_mistaken","f.holmes_says_dove_dress","f.mrs_straker_no_dress","f.gregory_tells_villa_holmes","f.gregory_tells_villa_watson"]}
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

Write the facts that scene s04 (At the trainer's house: the dead man's pockets and Mrs. Straker, ¶69–¶92) tells, and the accounts they travel
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

moves: ["train","landau"]
joins: {"stable_door":["stables","moor"]}
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
{"id":"weather","kind":"state","name":"The weather"}
{"id":"cushions","kind":"object","name":"The carriage cushions","within":"carriage"}
{"id":"watson_cigar","kind":"object","name":"Watson's cigar"}
{"id":"isonomy","kind":"animal","name":"Isonomy"}
{"id":"racing_public","kind":"group","name":"The racing public"}
{"id":"turf","kind":"topic","name":"The turf"}
{"id":"stables","kind":"place","name":"The King's Pyland stables","within":"kings_pyland"}
{"id":"stable_door","kind":"object","name":"The stable door","within":"stables"}
{"id":"stable_window","kind":"object","name":"The stable window where meals are handed in","within":"stables"}
{"id":"stable_table","kind":"object","name":"The small table in the stable","within":"stables"}
{"id":"water_tap","kind":"object","name":"The water-tap in the stables","within":"stables"}
{"id":"favourite_stall","kind":"place","name":"Silver Blaze's stall","within":"stables"}
{"id":"harness_room","kind":"place","name":"The harness-room","within":"stables"}
{"id":"stable_loft","kind":"place","name":"The chaff-cutting loft","within":"stables"}
{"id":"stable_lads","kind":"group","name":"The three stable lads"}
{"id":"hunter","kind":"person","name":"Ned Hunter"}
{"id":"other_lads","kind":"group","name":"The two other lads"}
{"id":"kp_horses","kind":"group","name":"The four King's Pyland horses"}
{"id":"bayard","kind":"animal","name":"Bayard"}
{"id":"dog","kind":"animal","name":"The stable dog"}
{"id":"straker_villa","kind":"place","name":"Straker's villa","within":"kings_pyland"}
{"id":"kitchen","kind":"place","name":"The kitchen of Straker's house","within":"straker_villa"}
{"id":"mrs_straker","kind":"person","name":"Mrs. Straker"}
{"id":"baxter","kind":"person","name":"Edith Baxter"}
{"id":"moor","kind":"place","name":"The moor","within":"dartmoor"}
{"id":"path","kind":"place","name":"The path across the moor to the stables","within":"moor"}
{"id":"villas","kind":"place","name":"The cluster of villas to the north","within":"dartmoor"}
{"id":"tavistock_contractor","kind":"person","name":"A Tavistock contractor"}
{"id":"tavistock","kind":"place","name":"Tavistock","within":"dartmoor"}
{"id":"mapleton","kind":"place","name":"The Mapleton stables","within":"dartmoor"}
{"id":"backwater","kind":"person","name":"Lord Backwater"}
{"id":"silas_brown","kind":"person","name":"Silas Brown"}
{"id":"desborough","kind":"animal","name":"Desborough"}
{"id":"gypsies","kind":"group","name":"The gypsies of Dartmoor"}
{"id":"lantern","kind":"object","name":"The maid's lantern"}
{"id":"curried_mutton","kind":"object","name":"Hunter's supper of curried mutton"}
{"id":"opium","kind":"object","name":"Powdered opium"}
{"id":"the_stranger","kind":"person","name":"The stranger at the stables"}
{"id":"tweed_suit","kind":"object","name":"The stranger's grey tweed suit"}
{"id":"cloth_cap","kind":"object","name":"The stranger's cloth cap"}
{"id":"gaiters","kind":"object","name":"The stranger's gaiters"}
{"id":"stranger_stick","kind":"object","name":"The stranger's heavy stick"}
{"id":"paper_packet","kind":"object","name":"The folded white paper packet"}
{"id":"holmes_wire","kind":"document","name":"Holmes's special wire to Dartmoor"}
{"id":"straker_coat","kind":"object","name":"Straker's mackintosh overcoat"}
{"id":"knoll","kind":"place","name":"The knoll near the house","within":"moor"}
{"id":"furze_bush","kind":"object","name":"The furze-bush","within":"moor"}
{"id":"hollow","kind":"place","name":"The hollow where Straker was found","within":"moor"}
{"id":"straker_knife","kind":"object","name":"Straker's small knife"}
{"id":"cravat","kind":"object","name":"The red and black silk cravat"}
{"id":"police","kind":"group","name":"The police"}
{"id":"london","kind":"place","name":"London","within":"england"}
{"id":"betting_book","kind":"document","name":"Simpson's betting-book"}
{"id":"simpson_stick","kind":"object","name":"Simpson's Penang-lawyer"}
{"id":"duplicate_key","kind":"object","name":"A duplicate key to the stable"}
{"id":"bridle","kind":"object","name":"Silver Blaze's bridle"}
{"id":"tavistock_station","kind":"place","name":"Tavistock station","within":"tavistock"}
{"id":"landau","kind":"object","name":"The landau"}
{"id":"detective_service","kind":"group","name":"The English detective service"}
{"id":"ross_frock_coat","kind":"object","name":"Colonel Ross's frock-coat"}
{"id":"ross_gaiters","kind":"object","name":"Colonel Ross's gaiters"}
{"id":"ross_eyeglass","kind":"object","name":"Colonel Ross's eye-glass"}
{"id":"ross_hat","kind":"object","name":"Colonel Ross's hat"}
{"id":"ten_pound_note","kind":"object","name":"The ten-pound note in Simpson's purse"}
{"id":"simpson_purse","kind":"object","name":"Simpson's purse"}
{"id":"the_chemist","kind":"person","name":"The chemist who sold the opium"}
{"id":"moor_pits","kind":"place","name":"The pits and old mines upon the moor","within":"moor"}
{"id":"gypsy_party","kind":"group","name":"The party of gypsies camped near the spot"}
{"id":"gypsy_camp","kind":"place","name":"The gypsies' camp within a mile of the murder","within":"moor","source":"a party of gypsies encamped on Monday night within a mile of the spot where the murder took place"}
{"id":"tavistock_outhouses","kind":"place","name":"The stables and out-houses in and around Tavistock","within":"dartmoor","source":"I have also examined every stable and out-house in Tavistock, and for a radius of ten miles."}
{"id":"driver","kind":"person","name":"The landau's driver"}
{"id":"road","kind":"place","name":"The road by Straker's villa","within":"kings_pyland"}
{"id":"paddock","kind":"place","name":"The paddock between the villa and the out-building","within":"kings_pyland"}
{"id":"upstairs_room","kind":"place","name":"The upstairs room where Straker's body lies","within":"straker_villa","source":"Yes; he lies upstairs."}
{"id":"sitting_room","kind":"place","name":"The sitting-room of Straker's villa","within":"straker_villa"}
{"id":"passage","kind":"place","name":"The passage of Straker's villa","within":"straker_villa"}
{"id":"straker_bedroom","kind":"place","name":"The Strakers' bedroom","within":"straker_villa"}
{"id":"dressing_table","kind":"object","name":"The dressing-table","within":"straker_bedroom"}
{"id":"central_table","kind":"object","name":"The central table in the sitting-room","within":"sitting_room"}
{"id":"tin_box","kind":"object","name":"The Inspector's square tin box","within":"sitting_room"}
{"id":"vestas","kind":"object","name":"Straker's box of vestas"}
{"id":"candle","kind":"object","name":"Straker's two inches of tallow candle"}
{"id":"briar_pipe","kind":"object","name":"Straker's briar-root pipe"}
{"id":"tobacco_pouch","kind":"object","name":"Straker's seal-skin tobacco pouch"}
{"id":"silver_watch","kind":"object","name":"Straker's silver watch"}
{"id":"sovereigns","kind":"object","name":"Five sovereigns in gold"}
{"id":"pencil_case","kind":"object","name":"Straker's aluminium pencil-case"}
{"id":"pocket_papers","kind":"document","name":"The papers in Straker's pockets"}
{"id":"hay_accounts","kind":"document","name":"The receipted hay-dealers' accounts"}
{"id":"ross_letter","kind":"document","name":"Colonel Ross's letter of instructions"}
{"id":"milliner_account","kind":"document","name":"The milliner's account made out to William Derbyshire"}
{"id":"billed_costume","kind":"object","name":"The costume on the milliner's account","source":"Twenty-two guineas is rather heavy for a single costume."}
{"id":"cork_disk","kind":"object","name":"The disk of cork guarding the knife's tip"}
{"id":"weiss_co","kind":"group","name":"Weiss & Co., London"}
{"id":"lesurier","kind":"person","name":"Madame Lesurier"}
{"id":"bond_street","kind":"place","name":"Bond Street","within":"london"}
{"id":"derbyshire","kind":"person","name":"William Derbyshire"}
{"id":"madam_derbyshire","kind":"person","name":"Madam Derbyshire"}
{"id":"plymouth","kind":"place","name":"Plymouth","within":"england"}
{"id":"dove_dress","kind":"object","name":"The dove-coloured silk costume Holmes describes"}
{"id":"constabulary","kind":"group","name":"The police on the case","source":"beyond the arrest of young Fitzroy Simpson nothing had been done"}
{"id":"household","kind":"group","name":"The people at Straker's house","source":"the people at the house partook of the same dish on the same night"}
{"id":"search_party","kind":"group","name":"The two lads and the two women who search the moor","source":"the two lads and the two women ran out in search of the absentees"}

## Time points

{"id":"t.before","label":"Before the story"}
{"id":"t.crime","label":"The disappearance of Silver Blaze and the murder of John Straker","after":["t.before","t.straker_leaves","t.horse_leaves_stall"],"para":37,"quote":"he had been there at the time of the struggle","note":"The struggle in the hollow: after Straker left the house, before the body was found on Tuesday morning; the horse was there."}
{"id":"t.tue_evening","label":"Tuesday evening: telegrams from Ross and Gregory","day":"Tuesday","clock":"evening","after":"t.crime","para":12,"quote":"On Tuesday evening I received telegrams"}
{"id":"t.wed","label":"Wednesday: Holmes broods and waits for news","day":"Wednesday","after":"t.tue_evening","para":14,"quote":"From hour to hour yesterday I expected to hear that he had been found","note":"Also the 'whole day' of ¶4, when Holmes paces the room and the papers are sent up; and the day Holmes sends his special wire to Dartmoor (¶31)."}
{"id":"t.simpson_arrest","label":"The arrest of Fitzroy Simpson","after":["t.crime","t.gregory_arrives","t.simpson_bets","t.night_storm"],"para":39,"quote":"promptly found and arrested the man upon whom suspicion naturally rested","note":"The day after the stranger's visit ('the evening before', ¶40), so Tuesday; Simpson's statement is made then.","day":"Tuesday"}
{"id":"t.watson_reads","label":"Watson reads the Telegraph and the Chronicle on the case","after":"t.crime","para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say","note":"Some time before the train journey; not otherwise dated."}
{"id":"t.thu_breakfast","label":"Thursday morning, at breakfast in Baker Street","day":"Thursday","clock":"morning","after":["t.wed","t.simpson_arrest"],"para":1,"quote":"as we sat down together to our breakfast one morning","note":"The day is given in ¶13: 'this is Thursday morning'."}
{"id":"t.thu_paddington","label":"Thursday, leaving Paddington by train","day":"Thursday","after":"t.thu_breakfast","para":7,"quote":"the bundle of fresh papers which he had procured at Paddington"}
{"id":"t.thu_past_reading","label":"Thursday, on the train, Reading far behind","day":"Thursday","after":"t.thu_paddington","para":7,"quote":"We had left Reading far behind us"}
{"id":"t.thu_on_line","label":"Thursday, on the train beyond Reading: Holmes times the train and states the case","day":"Thursday","after":["t.thu_past_reading","t.watson_reads"],"para":8,"quote":"Our rate at present is fifty-three and a half miles an hour"}
{"id":"t.straker_jockey","label":"Straker begins riding as Colonel Ross's jockey (about twelve years before)","after":"t.before","para":19,"quote":"He has served the Colonel for five years as jockey and for seven as trainer","note":"Five years as jockey, then seven as trainer, up to the present."}
{"id":"t.straker_trainer","label":"Straker becomes the Colonel's trainer (about seven years before)","after":"t.straker_jockey","para":19,"quote":"for seven as trainer"}
{"id":"t.silver_blaze_foaled","label":"Silver Blaze is foaled (some four years before)","after":"t.before","para":18,"quote":"He is now in his fifth year"}
{"id":"t.villas_built","label":"The villas to the north are built by a Tavistock contractor","after":"t.before","para":19,"quote":"which have been built by a Tavistock contractor"}
{"id":"t.simpson_squanders","label":"Fitzroy Simpson squanders his fortune on the turf","after":"t.before","para":39,"quote":"who had squandered a fortune upon the turf"}
{"id":"t.simpson_bets","label":"Simpson registers bets against the favourite","after":"t.before","para":39,"quote":"bets to the amount of five thousand pounds had been registered by him against the favourite"}
{"id":"t.simpson_arrives","label":"Simpson comes down to Dartmoor for information","after":"t.simpson_squanders","para":40,"quote":"he had come down to Dartmoor in the hope of getting some information"}
{"id":"t.mon_stables_locked","label":"Monday, nine o'clock: the stables are locked up","day":"Monday","clock":"nine","after":["t.before","t.straker_trainer","t.silver_blaze_foaled","t.villas_built"],"para":20,"quote":"the stables were locked up at nine o'clock","note":"After the horses were exercised and watered that evening."}
{"id":"t.mon_lads_supper","label":"Monday evening: two lads at supper in Straker's kitchen","day":"Monday","clock":"evening","after":"t.mon_stables_locked","para":20,"quote":"Two of the lads walked up to the trainer's house, where they had supper in the kitchen","note":"The people at the house eat the same dish as Hunter (¶37)."}
{"id":"t.mon_maid_sets_out","label":"Monday, a few minutes after nine: Edith Baxter carries the supper down","day":"Monday","clock":"a few minutes after nine","after":"t.mon_stables_locked","para":20,"quote":"At a few minutes after nine the maid, Edith Baxter, carried down to the stables his supper"}
{"id":"t.mon_stranger_meets","label":"Monday night: the stranger stops the maid thirty yards from the stables","day":"Monday","clock":"after nine","after":["t.mon_maid_sets_out","t.simpson_arrives"],"para":21,"quote":"Edith Baxter was within thirty yards of the stables, when a man appeared out of the darkness"}
{"id":"t.mon_maid_at_window","label":"Monday night: the maid reaches the stable window","day":"Monday","clock":"after nine","after":"t.mon_stranger_meets","para":25,"quote":"ran past him to the window through which she was accustomed to hand the meals"}
{"id":"t.mon_stranger_at_window","label":"Monday night: the stranger comes up to the window and speaks to Hunter","day":"Monday","clock":"after nine","after":"t.mon_maid_at_window","para":25,"quote":"She had begun to tell him of what had happened, when the stranger came up again"}
{"id":"t.mon_hunter_for_dog","label":"Monday night: Hunter runs for the dog; the maid flees, the stranger leans through the window","day":"Monday","clock":"after nine","after":"t.mon_stranger_at_window","para":29,"quote":"He sprang up and rushed across the stable to unloose the dog"}
{"id":"t.mon_hunter_runs_out","label":"Monday night, a minute later: Hunter locks the door and runs out with the dog; the stranger is gone","day":"Monday","clock":"after nine","after":"t.mon_hunter_for_dog","para":29,"quote":"A minute later, however, when Hunter rushed out with the hound he was gone"}
{"id":"t.mon_maid_home","label":"Monday night: the maid back at the house","day":"Monday","clock":"after nine","after":"t.mon_hunter_for_dog","para":29,"quote":"The girl fled away to the house"}
{"id":"t.hunter_eats_supper","label":"Monday night: Hunter eats his curried mutton","day":"Monday","after":"t.mon_maid_at_window","para":37,"quote":"the remains of his supper left by the stable-lad","note":"Not ordered against the stranger's visit or Hunter's message."}
{"id":"t.mon_lads_return","label":"Monday night: the other lads return; Hunter sends a message to Straker","day":"Monday","after":["t.mon_hunter_runs_out","t.mon_lads_supper"],"para":32,"quote":"Hunter waited until his fellow-grooms had returned, when he sent a message to the trainer"}
{"id":"t.night_storm","label":"Monday night: the storm","day":"Monday night","after":"t.mon_stables_locked","para":40,"quote":"he had been out in the storm of the night before","note":"Rain heard at one in the morning (¶32); not otherwise bounded."}
{"id":"t.tue_one_am","label":"Tuesday, one in the morning: Mrs. Straker finds her husband dressing","day":"Tuesday","clock":"one in the morning","after":"t.mon_lads_return","para":32,"quote":"Mrs. Straker, waking at one in the morning, found that he was dressing"}
{"id":"t.straker_leaves","label":"Tuesday, after one: Straker leaves the house in his mackintosh","day":"Tuesday","clock":"after one","after":"t.tue_one_am","para":32,"quote":"he pulled on his large mackintosh and left the house"}
{"id":"t.horse_leaves_stall","label":"Monday–Tuesday night: Silver Blaze is taken from his stall","after":"t.mon_hunter_runs_out","para":33,"quote":"the favourite's stall was empty","note":"Hunter locked the door when he ran out (¶31); the door was found open at seven. The police theory (¶46) puts Simpson here."}
{"id":"t.tue_seven","label":"Tuesday, seven in the morning: Mrs. Straker wakes; her husband is not back","day":"Tuesday","clock":"seven","after":"t.straker_leaves","para":33,"quote":"Mrs. Straker awoke at seven in the morning"}
{"id":"t.tue_at_stables","label":"Tuesday morning: Mrs. Straker and the maid at the stables; door open, Hunter drugged, stall empty","day":"Tuesday","clock":"morning","after":["t.tue_seven","t.horse_leaves_stall","t.hunter_eats_supper"],"para":33,"quote":"set off for the stables. The door was open"}
{"id":"t.tue_knoll","label":"Tuesday morning: the search party on the knoll","day":"Tuesday","clock":"morning","after":"t.tue_at_stables","para":34,"quote":"on ascending the knoll near the house"}
{"id":"t.tue_hollow","label":"Tuesday morning: the overcoat on the furze-bush and Straker's body in the hollow","day":"Tuesday","clock":"morning","after":["t.tue_knoll","t.crime"],"para":35,"quote":"at the bottom of this was found the dead body of the unfortunate trainer"}
{"id":"t.hunter_recovers","label":"Hunter recovers from his stupor","after":"t.tue_at_stables","para":36,"quote":"Hunter, on recovering from his stupor"}
{"id":"t.analysis","label":"The analysis of Hunter's supper","after":"t.tue_at_stables","para":37,"quote":"an analysis has shown"}
{"id":"t.reward","label":"A large reward is offered for the horse","after":"t.tue_hollow","para":37,"quote":"although a large reward has been offered"}
{"id":"t.gregory_arrives","label":"Inspector Gregory arrives on the case","after":"t.tue_hollow","para":39,"quote":"On his arrival he promptly found and arrested the man"}
{"id":"t.race","label":"Next Tuesday: the Wessex Cup is run","day":"Tuesday","after":"t.thu_on_line","para":18,"quote":"at the fall of the flag next Tuesday"}
{"id":"t.thu_tavistock","label":"Thursday evening: arrival at Tavistock station, met by Colonel Ross and Inspector Gregory","day":"Thursday","clock":"evening","after":["t.thu_on_line","t.gregory_searches","t.mapleton_examined","t.gypsies_gone"],"para":47,"quote":"It was evening before we reached the little town of Tavistock"}
{"id":"t.thu_landau","label":"Thursday evening, a minute later: the drive in the landau through Tavistock and out towards King's Pyland","day":"Thursday","clock":"evening","after":"t.thu_tavistock","para":51,"quote":"A minute later we were all seated in a comfortable landau","note":"The talk of ¶51–68 happens during this drive, before the light fails."}
{"id":"t.simpson_lodged","label":"Simpson twice lodges at Tavistock in the summer","after":"t.before","para":58,"quote":"He has twice lodged at Tavistock in the summer","note":"Earlier summers; not ordered against his coming down this time."}
{"id":"t.opium_bought","label":"The powdered opium is obtained (Gregory guesses in London)","after":"t.before","para":58,"quote":"The opium was probably brought from London","note":"Gregory's guess; it would come before the opium reached Hunter's supper, but the story does not fix when or by whom."}
{"id":"t.key_thrown","label":"The duplicate key is thrown away (Gregory's guess)","after":"t.horse_leaves_stall","para":58,"quote":"The key, having served its purpose, would be hurled away","note":"Part of the police theory; the story has not shown that any such key exists."}
{"id":"t.cravat_lost","label":"Simpson loses his cravat (his own claim)","after":"t.before","para":60,"quote":"declares that he had lost it","note":"Simpson's claim. The maid saw the stranger wearing it on Monday evening (¶35), but the story does not say when he says he lost it."}
{"id":"t.gypsies_camp","label":"Monday night: a party of gypsies camped within a mile of the spot of the murder","day":"Monday","clock":"night","after":"t.before","para":62,"quote":"a party of gypsies encamped on Monday night within a mile of the spot"}
{"id":"t.gypsies_gone","label":"Tuesday: the gypsies are gone","day":"Tuesday","after":"t.gypsies_camp","para":62,"quote":"On Tuesday they were gone"}
{"id":"t.gregory_searches","label":"Gregory examines every stable and out-house in and around Tavistock","after":"t.gregory_arrives","para":64,"quote":"I have also examined every stable and out-house in Tavistock"}
{"id":"t.mapleton_examined","label":"The police examine the Mapleton stables","after":"t.gregory_arrives","para":66,"quote":"We have, however, examined the stables"}
{"id":"t.brown_bets","label":"Silas Brown places large bets on the Wessex Cup","after":"t.before","para":66,"quote":"is known to have had large bets upon the event"}
{"id":"t.straker_takes_knife","label":"Monday–Tuesday night: Straker picks up the knife from the dressing-table as he leaves the room (his wife's account)","day":"Tuesday","clock":"after one","after":"t.tue_one_am","para":82,"quote":"he had picked it up as he left the room","note":"Just before he leaves the house (t.straker_leaves); the text does not order it more finely."}
{"id":"t.straker_brought_back","label":"Straker's body is brought back to his villa","after":"t.tue_hollow","para":72,"quote":"Straker was brought back here, I presume?"}
{"id":"t.inventory","label":"The Inspector takes the things in Straker's pockets and puts them in a tin box","after":"t.tue_hollow","para":77,"quote":"I have the things themselves in the sitting-room"}
{"id":"t.mrs_straker_tells_police","label":"Mrs. Straker tells the police about the knife and about Derbyshire","after":"t.tue_hollow","para":82,"quote":"His wife tells us that the knife had lain upon the dressing-table"}
{"id":"t.derbyshire_letters","label":"Letters for William Derbyshire are now and then addressed to Straker's house (Mrs. Straker's account)","after":"t.before","para":84,"quote":"occasionally his letters were addressed here"}
{"id":"t.milliner_account_made","label":"Madame Lesurier makes out the milliner's account to William Derbyshire","after":"t.before","para":84,"quote":"made out by Madame Lesurier, of Bond Street, to William Derbyshire","note":"Before Straker's death, since the account was in his pockets; the story gives no closer date."}
{"id":"t.plymouth_party","label":"A garden-party at Plymouth \"some little time ago\" (Holmes's claim; Mrs. Straker denies it)","after":"t.before","para":89,"quote":"Surely I met you in Plymouth at a garden-party some little time ago","note":"Holmes's claim; Mrs. Straker says he is mistaken."}
{"id":"t.thu_villa","label":"Thursday evening, a few minutes later: the landau pulls up at Straker's villa","day":"Thursday","clock":"evening","after":["t.thu_landau","t.straker_brought_back"],"para":69,"quote":"A few minutes later our driver pulled up at a neat little red-brick villa"}
{"id":"t.thu_sitting_room","label":"Thursday evening: in the sitting-room, the Inspector lays out Straker's things","day":"Thursday","clock":"evening","after":["t.thu_villa","t.inventory","t.mrs_straker_tells_police","t.milliner_account_made"],"para":78,"quote":"We all filed into the front room and sat round the central table"}
{"id":"t.thu_passage","label":"Thursday evening: Mrs. Straker meets them in the passage as they leave the sitting-room","day":"Thursday","clock":"evening","after":["t.thu_sitting_room","t.plymouth_party"],"para":86,"quote":"As we emerged from the sitting-room a woman, who had been waiting in the passage"}
{"id":"t.inquest","label":"Friday: the inquest on Straker","day":"Friday","after":"t.thu_villa","para":73,"quote":"The inquest is to-morrow."}
{"id":"t.baxter_sworn","label":"Edith Baxter makes her sworn statement","after":"t.tue_hollow","para":26,"quote":"The girl has sworn"}
{"id":"t.wire_reply","label":"The answer to Holmes's special wire reaches him","after":"t.wed","para":31,"quote":"to clear the matter up"}
{"id":"t.traces_found","label":"The police find traces of the gypsies' camp","after":["t.gypsies_gone","t.gregory_arrives"],"para":62,"quote":"We have found traces which show that a party of gypsies encamped","note":"Before the drive of Thursday evening; not otherwise dated."}
{"id":"t.note_found","label":"A ten-pound note is found in Simpson's purse","after":"t.simpson_arrest","para":58,"quote":"One was found in his purse.","note":"Before the drive of Thursday evening."}

## Accounts so far

{"id":"acct.watson","label":"What Watson sees and hears himself","origin":"watson","how":"saw","facts":["f.holmes_loc_breakfast","f.watson_loc_breakfast","f.clock_morning","f.holmes_says_must_go","f.holmes_intends_dartmoor","f.case_talk_of_england","f.holmes_loc_wed","f.holmes_broods","f.holmes_pipe","f.holmes_deaf","f.news_agent_sends","f.holmes_tosses_papers","f.papers_in_corner","f.watson_knows_brooding","f.holmes_announces","f.watson_expected","f.watson_offers","f.holmes_says_unique","f.holmes_intends_train","f.holmes_asks_glass","f.watson_owns_glass","f.holmes_buys_papers","f.holmes_at_paddington","f.watson_in_carriage","f.holmes_in_carriage","f.train_on_line","f.train_to_exeter","f.holmes_cap","f.holmes_reads_papers","f.train_past_reading","f.papers_under_seat","f.holmes_offers_cigars","f.holmes_looks_window","f.holmes_owns_watch","f.holmes_says_speed","f.watson_says_posts","f.holmes_says_telegraph_posts","f.holmes_asks_case","f.watson_read_papers","f.telegraph_tells_watson","f.chronicle_tells_watson","f.holmes_says_method","f.holmes_says_surmise","f.holmes_tells_telegrams","f.cal_thu","f.cal_wed","f.watson_asks_why","f.holmes_says_blunder","f.watson_memoirs","f.holmes_believed_not_concealed","f.holmes_expected_found","f.holmes_decides_act","f.holmes_says_not_wasted","f.holmes_tells_wait","f.watson_asks_theory","f.holmes_says_grip","f.holmes_intends_enumerate","f.watson_lies_back","f.watson_cigar","f.holmes_checks_points","f.holmes_tells_case","f.newspapers_tell_holmes","f.holmes_says_interest","f.watson_asks_door","f.holmes_praises","f.holmes_believes_door_point","f.holmes_tells_wire","f.holmes_says_main_facts","f.holmes_says_gregory","f.holmes_says_marked","f.holmes_asks_light","f.watson_listens","f.watson_knew_facts","f.watson_not_appreciated","f.watson_suggests_cut","f.holmes_says_probable","f.holmes_says_point_gone","f.watson_says_fail","f.holmes_says_objections","f.holmes_says_police_theory","f.holmes_says_improbable","f.holmes_intends_test","f.watson_at_tavistock","f.holmes_at_tavistock","f.clock_thu_evening","f.tavistock_centre","f.gregory_at_station","f.ross_at_station","f.gregory_looks","f.ross_looks","f.ross_frock","f.ross_wears_gaiters","f.ross_wears_eyeglass","f.ross_sportsman","f.gregory_name_making","f.gregory_member_service","f.ross_says_delighted","f.ross_intends_avenge","f.holmes_asks_developments","f.gregory_says_little_progress","f.landau_outside","f.gregory_intends_drive","f.watson_in_landau","f.holmes_in_landau","f.gregory_in_landau","f.ross_in_landau","f.landau_through_town","f.gregory_pours_out","f.holmes_interjects","f.ross_leans_back","f.ross_hat_on","f.watson_listens_drive","f.gregory_theory_foretold","f.gregory_says_net","f.gregory_believes_simpson","f.gregory_says_circumstantial","f.holmes_asks_knife","f.gregory_says_self_wound","f.holmes_says_watson_suggested","f.gregory_says_no_knife","f.gregory_says_evidence","f.holmes_shakes_head","f.holmes_says_counsel","f.holmes_asks_why_out","f.holmes_asks_key","f.holmes_asks_chemist","f.holmes_asks_hide","f.holmes_asks_paper","f.gregory_says_not_formidable","f.gregory_says_opium_london","f.gregory_says_key_thrown","f.gregory_says_pits","f.holmes_asks_cravat","f.gregory_says_new_element","f.holmes_pricks_ears","f.gregory_says_gypsy_theory","f.holmes_says_possible","f.holmes_asks_other_stable","f.gregory_says_mapleton_interest","f.gregory_says_nothing_brown","f.holmes_asks_simpson_mapleton","f.gregory_says_no_link","f.gregory_tells_holmes","f.gregory_tells_watson"]}
{"id":"acct.press","label":"What the newspapers report of the case","origin":null,"how":"report","facts":["f.horse_favourite","f.horse_disappears","f.straker_trainer","f.straker_murdered","f.name_straker","f.name_silver_blaze"]}
{"id":"acct.holmes","label":"Holmes's account of the telegrams and his day of waiting","origin":"holmes","how":"own","facts":["f.cal_tue","f.clock_tue_evening","f.holmes_gets_telegrams","f.ross_telegraphs","f.gregory_telegraphs","f.ross_owner","f.gregory_role","f.horse_reputed","f.north_dartmoor_sparse","f.horse_not_found","f.simpson_arrested","f.simpson_young","f.nothing_else_done","f.holmes_sends_wire","f.wire_reply_tells"]}
{"id":"acct.case_reports","label":"The reported facts of the case: the horse, the stable and the moor","origin":null,"how":"report","facts":["f.sb_isonomy","f.sb_record","f.sb_age","f.sb_prizes","f.sb_odds","f.sb_public_favourite","f.sb_money_laid","f.race_tuesday","f.cal_race_tue","f.ross_stables","f.precautions","f.straker_retired_jockey","f.straker_too_heavy","f.straker_jockey_years","f.straker_trainer_years","f.straker_reputed","f.lads_under_straker","f.stables_four_horses","f.sb_member","f.lads_routine","f.lads_reputed","f.straker_married","f.straker_lives_villa","f.straker_no_children","f.straker_keeps_maid","f.straker_comfortable","f.country_lonely","f.villas_position","f.villas_built","f.villas_purpose","f.tavistock_position","f.mapleton_position","f.mapleton_owner","f.brown_manages","f.moor_wilderness","f.gypsies_on_moor","f.cal_mon","f.horses_exercised","f.stables_locked","f.clock_nine","f.lads_walk_to_house","f.lads_in_kitchen","f.hunter_member","f.name_hunter","f.hunter_on_guard","f.hunter_in_stables","f.window_small","f.straker_not_realise","f.straker_dead","f.straker_defended","f.horse_in_hollow","f.horse_gone_since","f.reward","f.gypsies_alert","f.household_ate","f.desborough_second","f.desborough_mapleton","f.bridle_missing"]}
{"id":"acct.baxter","label":"Edith Baxter's sworn account of the stranger","origin":"baxter","how":"saw","facts":["f.name_baxter","f.baxter_role","f.baxter_carries_supper","f.baxter_carrying_supper","f.clock_after_nine","f.supper_dish","f.baxter_no_liquid","f.tap_in_stables","f.rule_tap","f.baxter_lantern","f.weather_dark","f.path_open_moor","f.baxter_near_stables","f.stranger_appears","f.stranger_on_path","f.stranger_gentlemanly","f.stranger_tweed","f.stranger_cap","f.stranger_gaiters","f.stranger_stick","f.stranger_pallor","f.stranger_nervous","f.baxter_thinks_age","f.stranger_asks_where","f.baxter_says_kp","f.stranger_says_boy","f.stranger_takes_packet","f.stranger_carrying_packet","f.stranger_offers_dress","f.baxter_frightened","f.baxter_runs_window","f.baxter_at_window","f.window_meals","f.window_open","f.hunter_at_table","f.baxter_begins_tell","f.stranger_at_window","f.stranger_says_word","f.baxter_sees_packet","f.hunter_asks_business","f.stranger_asks_tip","f.hunter_says_tout","f.hunter_rushes_dog","f.baxter_flees","f.baxter_home","f.baxter_sees_leaning","f.stranger_leaning","f.baxter_recognises"]}
{"id":"acct.hunter","label":"Ned Hunter's account of the night","origin":"hunter","how":"saw","facts":["f.hunter_at_table","f.window_open","f.stranger_at_window","f.stranger_says_word","f.hunter_asks_business","f.stranger_asks_tip","f.hunter_says_tout","f.hunter_rushes_dog","f.dog_in_stable","f.hunter_rushes_out","f.hunter_outside","f.dog_outside","f.stranger_gone","f.hunter_no_trace","f.hunter_locks_door","f.door_locked_after","f.hunter_waits","f.lads_back","f.hunter_tells_straker","f.hunter_recovers","f.hunter_cravat","f.hunter_believes_drugged"]}
{"id":"acct.mrs_straker","label":"Mrs. Straker's account of her husband's going out and the morning","origin":"mrs_straker","how":"saw","facts":["f.straker_excited","f.straker_uneasy","f.mrs_straker_wakes_one","f.clock_one","f.straker_dressing","f.straker_at_villa_one","f.mrs_straker_at_villa","f.straker_says_anxiety","f.mrs_straker_begs","f.rain_one","f.straker_mackintosh","f.straker_leaves","f.mrs_straker_wakes_seven","f.clock_seven","f.straker_not_returned","f.mrs_straker_wife","f.mrs_straker_sets_off","f.mrs_straker_at_stables","f.baxter_at_stables","f.door_open","f.hunter_on_chair","f.hunter_stupor","f.stall_empty","f.no_sign_straker"]}
{"id":"acct.lads","label":"The two sleeping lads' account","origin":"other_lads","how":"said","facts":["f.lads_in_loft","f.loft_above","f.lads_aroused","f.lads_heard_nothing","f.lads_sound_sleepers"]}
{"id":"acct.search","label":"The search party's account: Hunter drugged, the coat and the body","origin":"search_party","how":"saw","facts":["f.hunter_drugged","f.hunter_left_sleep","f.party_mrs_straker","f.party_baxter","f.party_lads","f.party_searches","f.party_hopes","f.party_on_knoll","f.knoll_view","f.party_no_horse","f.party_sees_tragedy","f.coat_on_bush","f.bush_distance","f.hollow_beyond","f.body_in_hollow","f.head_shattered","f.thigh_cut","f.straker_knife","f.knife_blood","f.straker_cravat"]}
{"id":"acct.analysis","label":"The analysis of Hunter's supper","origin":null,"how":"analysis","facts":["f.hunter_ate","f.analysis_opium"]}
{"id":"acct.police","label":"What the police have done: the arrest of Fitzroy Simpson","origin":"gregory","how":"report","facts":["f.gregory_arrives","f.gregory_arrests","f.simpson_lives_villa","f.name_simpson","f.simpson_birth","f.simpson_squandered","f.simpson_bookmaker","f.police_examine_book","f.book_owner","f.book_contents","f.simpson_bets_against","f.simpson_says_came","f.simpson_admits","f.stranger_identity","f.simpson_says_no_designs","f.gregory_confronts","f.cravat_owner","f.simpson_pale","f.simpson_wet","f.simpson_out_storm","f.storm","f.simpson_stick_owner","f.stick_lead","f.stick_weapon","f.simpson_unwounded","f.baxter_swears"]}
{"id":"acct.holmes_case","label":"Holmes's statement of the case on the train","origin":"holmes","how":"bundle","parts":["acct.case_reports","acct.baxter","acct.hunter","acct.mrs_straker","acct.lads","acct.search","acct.analysis","acct.police"]}
{"id":"acct.gregory","label":"Inspector Gregory's report on the drive: Simpson's answers, the gypsies and the searches","origin":"gregory","how":"report","facts":["f.simpson_no_knife","f.simpson_says_note","f.note_in_purse","f.purse_owner","f.simpson_lodged","f.simpson_owns_cravat_says","f.simpson_says_lost","f.police_find_traces","f.gypsies_at_camp","f.camp_distance","f.cal_gypsies_mon","f.gypsies_left","f.cal_gypsies_tue","f.moor_scoured","f.gregory_examines_outhouses","f.horse_not_in_outhouses","f.desborough_second_betting","f.brown_trainer","f.brown_bets","f.brown_no_friend","f.police_examine_mapleton"]}

## Facts so far

{"id":"f.holmes_loc_breakfast","of":"holmes","attr":"location","value":"rooms","detail":"at breakfast","time":{"at":"t.thu_breakfast"},"para":1,"quote":"as we sat down together to our breakfast one morning"}
{"id":"f.watson_loc_breakfast","of":"watson","attr":"location","value":"rooms","detail":"at breakfast","time":{"at":"t.thu_breakfast"},"para":1,"quote":"as we sat down together to our breakfast one morning"}
{"id":"f.clock_morning","of":"clock","attr":"hour","value":"morning","time":{"at":"t.thu_breakfast"},"para":1,"quote":"our breakfast one morning"}
{"id":"f.holmes_says_must_go","of":"holmes","attr":"says","value":"he shall have to go","to":"watson","time":{"at":"t.thu_breakfast"},"para":1,"quote":"I am afraid, Watson, that I shall have to go","asserts":[{"of":"holmes","attr":"intends","value":"to go away on the case"}]}
{"id":"f.holmes_intends_dartmoor","of":"holmes","attr":"intends","value":"to go to King's Pyland, on Dartmoor","time":{"at":"t.thu_breakfast"},"para":3,"quote":"To Dartmoor; to King’s Pyland."}
{"id":"f.case_talk_of_england","of":"england","attr":"condition","value":"the extraordinary case is the one topic of conversation throughout England","time":{"at":"t.thu_breakfast"},"para":4,"quote":"which was the one topic of conversation through the length and breadth of England"}
{"id":"f.holmes_loc_wed","of":"holmes","attr":"location","value":"rooms","detail":"rambling about the room","time":{"at":"t.wed"},"para":4,"quote":"For a whole day my companion had rambled about the room"}
{"id":"f.holmes_broods","of":"holmes","attr":"action","value":"rambles about the room with his chin on his chest and brows knitted, deaf to Watson's questions","time":{"at":"t.wed"},"para":4,"quote":"with his chin upon his chest and his brows knitted"}
{"id":"f.holmes_pipe","of":"holmes","attr":"carrying","value":"pipe","detail":"charging and recharging it with the strongest black tobacco","time":{"at":"t.wed"},"para":4,"quote":"charging and recharging his pipe with the strongest black tobacco"}
{"id":"f.holmes_deaf","of":"holmes","attr":"condition","value":"deaf to any of Watson's questions or remarks","time":{"at":"t.wed"},"para":4,"quote":"absolutely deaf to any of my questions or remarks"}
{"id":"f.news_agent_sends","of":"news_agent","attr":"action","value":"sends up fresh editions of every paper","time":{"at":"t.wed"},"para":4,"quote":"Fresh editions of every paper had been sent up by our news agent"}
{"id":"f.holmes_tosses_papers","of":"holmes","attr":"action","value":"glances over the papers and tosses them into a corner","time":{"at":"t.wed"},"para":4,"quote":"only to be glanced over and tossed down into a corner"}
{"id":"f.papers_in_corner","of":"newspapers","attr":"location","value":"rooms","detail":"tossed into a corner","time":{"from":"t.wed"},"para":4,"quote":"tossed down into a corner"}
{"id":"f.watson_knows_brooding","of":"watson","attr":"knows","value":"Holmes is brooding over the disappearance of the Wessex Cup favourite and the murder of its trainer","time":{"at":"t.wed"},"para":4,"quote":"I knew perfectly well what it was over which he was brooding"}
{"id":"f.horse_favourite","of":"silver_blaze","attr":"role","value":"favourite for the Wessex Cup","time":{"at":"t.crime"},"para":4,"quote":"the favourite for the Wessex Cup"}
{"id":"f.horse_disappears","of":"silver_blaze","attr":"condition","value":"disappeared","time":{"from":"t.crime"},"para":4,"quote":"the singular disappearance of the favourite for the Wessex Cup"}
{"id":"f.straker_trainer","of":"straker","attr":"role","value":"trainer of the favourite for the Wessex Cup","time":{"at":"t.crime"},"para":4,"quote":"the tragic murder of its trainer"}
{"id":"f.straker_murdered","of":"straker","attr":"condition","value":"murdered","time":{"from":"t.crime"},"para":4,"quote":"the tragic murder of its trainer"}
{"id":"f.holmes_announces","of":"holmes","attr":"intends","value":"to set out for the scene of the drama","time":{"at":"t.thu_breakfast"},"para":4,"quote":"he suddenly announced his intention of setting out for the scene of the drama"}
{"id":"f.watson_expected","of":"watson","attr":"believes","value":"Holmes would take up the case; Watson expected and hoped for it","time":{"at":"t.thu_breakfast"},"para":4,"quote":"it was only what I had both expected and hoped for"}
{"id":"f.watson_offers","of":"watson","attr":"says","value":"he would be happy to go down with Holmes","to":"holmes","time":{"at":"t.thu_breakfast"},"para":5,"quote":"I should be most happy to go down with you if I should not be in the way"}
{"id":"f.holmes_says_unique","of":"holmes","attr":"says","value":"there are points about the case which promise to make it unique","to":"watson","time":{"at":"t.thu_breakfast"},"para":6,"quote":"there are points about the case which promise to make it an absolutely unique one","asserts":[{"of":"holmes","attr":"believes","value":"points of the case make it unique"}]}
{"id":"f.holmes_intends_train","of":"holmes","attr":"intends","value":"to catch the train at Paddington and explain the matter on the journey","time":{"at":"t.thu_breakfast"},"para":6,"quote":"We have, I think, just time to catch our train at Paddington, and I will go further into the matter upon our journey"}
{"id":"f.holmes_asks_glass","of":"holmes","attr":"action","act":"ask","thing":"field_glass","value":"asks Watson to bring his field-glass","time":{"at":"t.thu_breakfast"},"para":6,"quote":"You would oblige me by bringing with you your very excellent field-glass."}
{"id":"f.watson_owns_glass","of":"field_glass","attr":"owner","value":"watson","basis":"implied","time":{"at":"t.thu_breakfast"},"para":6,"quote":"your very excellent field-glass"}
{"id":"f.holmes_at_paddington","of":"holmes","attr":"location","value":"paddington","time":{"at":"t.thu_paddington"},"para":7,"quote":"which he had procured at Paddington"}
{"id":"f.holmes_buys_papers","of":"holmes","attr":"action","value":"procures a bundle of fresh papers","time":{"at":"t.thu_paddington"},"para":7,"quote":"the bundle of fresh papers which he had procured at Paddington"}
{"id":"f.watson_in_carriage","of":"watson","attr":"location","value":"carriage","detail":"in the corner","time":{"from":"t.thu_paddington","to":"t.thu_on_line"},"para":7,"quote":"I found myself in the corner of a first-class carriage"}
{"id":"f.holmes_in_carriage","of":"holmes","attr":"location","value":"carriage","time":{"from":"t.thu_paddington","to":"t.thu_on_line"},"para":7,"quote":"while Sherlock Holmes, with his sharp, eager face"}
{"id":"f.train_on_line","of":"train","attr":"location","value":"railway_line","detail":"flying along en route for Exeter","time":{"from":"t.thu_paddington","to":"t.thu_on_line"},"para":7,"quote":"flying along en route for Exeter"}
{"id":"f.train_to_exeter","of":"train","attr":"intends","value":"bound for Exeter","time":{"from":"t.thu_paddington"},"para":7,"quote":"en route for Exeter"}
{"id":"f.holmes_cap","of":"holmes","attr":"wearing","value":"travelling_cap","detail":"ear-flapped","time":{"from":"t.thu_paddington","to":"t.thu_past_reading"},"para":7,"quote":"framed in his ear-flapped travelling-cap"}
{"id":"f.holmes_reads_papers","of":"holmes","attr":"action","value":"dips rapidly into the fresh papers","time":{"from":"t.thu_paddington","to":"t.thu_past_reading"},"para":7,"quote":"dipped rapidly into the bundle of fresh papers"}
{"id":"f.train_past_reading","of":"train","attr":"location","value":"reading","detail":"passed through, now far behind","time":{"after":"t.thu_paddington","before":"t.thu_past_reading"},"para":7,"quote":"We had left Reading far behind us"}
{"id":"f.papers_under_seat","of":"newspapers","attr":"location","value":"carriage_seat","detail":"thrust under the seat","time":{"from":"t.thu_past_reading"},"para":7,"quote":"he thrust the last one of them under the seat"}
{"id":"f.holmes_offers_cigars","of":"holmes","attr":"action","act":"give","thing":"cigar_case","value":"offers Watson his cigar-case","time":{"at":"t.thu_past_reading"},"para":7,"quote":"offered me his cigar-case"}
{"id":"f.holmes_looks_window","of":"holmes","attr":"action","value":"looks out the window and glances at his watch","time":{"at":"t.thu_on_line"},"para":8,"quote":"looking out the window and glancing at his watch"}
{"id":"f.holmes_owns_watch","of":"holmes_watch","attr":"owner","value":"holmes","basis":"implied","time":{"at":"t.thu_on_line"},"para":8,"quote":"glancing at his watch"}
{"id":"f.holmes_says_speed","of":"holmes","attr":"says","value":"the train is going at fifty-three and a half miles an hour","to":"watson","time":{"at":"t.thu_on_line"},"para":8,"quote":"Our rate at present is fifty-three and a half miles an hour.","asserts":[{"of":"train","attr":"speed","value":"fifty-three and a half miles an hour","time":{"at":"t.thu_on_line"}}]}
{"id":"f.watson_says_posts","of":"watson","attr":"says","value":"he has not observed the quarter-mile posts","to":"holmes","time":{"at":"t.thu_on_line"},"para":9,"quote":"I have not observed the quarter-mile posts"}
{"id":"f.holmes_says_telegraph_posts","of":"holmes","attr":"says","value":"he has not observed the quarter-mile posts either, but the telegraph posts on this line are sixty yards apart","to":"watson","time":{"at":"t.thu_on_line"},"para":10,"quote":"the telegraph posts upon this line are sixty yards apart","asserts":[{"of":"telegraph_posts","attr":"condition","value":"sixty yards apart"}]}
{"id":"f.holmes_asks_case","of":"holmes","attr":"action","act":"ask","value":"asks Watson whether he has looked into the murder of John Straker and the disappearance of Silver Blaze","time":{"at":"t.thu_on_line"},"para":10,"quote":"I presume that you have looked into this matter"}
{"id":"f.name_straker","of":"straker","attr":"name","value":"John Straker","time":{"at":"t.crime"},"para":10,"quote":"the murder of John Straker"}
{"id":"f.name_silver_blaze","of":"silver_blaze","attr":"name","value":"Silver Blaze","time":{"at":"t.crime"},"para":10,"quote":"the disappearance of Silver Blaze"}
{"id":"f.watson_read_papers","of":"watson","attr":"action","value":"has read what the Telegraph and the Chronicle say on the case","time":{"at":"t.watson_reads"},"para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say"}
{"id":"f.telegraph_tells_watson","of":"telegraph_paper","attr":"tells","value":"acct.press","to":"watson","how":"newspaper","time":{"at":"t.watson_reads"},"para":11,"quote":"what the _Telegraph_"}
{"id":"f.chronicle_tells_watson","of":"chronicle_paper","attr":"tells","value":"acct.press","to":"watson","how":"newspaper","time":{"at":"t.watson_reads"},"para":11,"quote":"the _Chronicle_ have to say"}
{"id":"f.holmes_says_method","of":"holmes","attr":"says","value":"the case calls for sifting details rather than acquiring fresh evidence, and the facts must be detached from the theorising of reporters","to":"watson","time":{"at":"t.thu_on_line"},"para":12,"quote":"the art of the reasoner should be used rather for the sifting of details than for the acquiring of fresh evidence","asserts":[{"of":"holmes","attr":"believes","value":"the answer lies in sifting the known facts"}]}
{"id":"f.holmes_says_surmise","of":"holmes","attr":"believes","value":"the case is overlaid by a plethora of surmise, conjecture and hypothesis from theorists and reporters","time":{"at":"t.thu_on_line"},"para":12,"quote":"we are suffering from a plethora of surmise, conjecture, and hypothesis"}
{"id":"f.cal_tue","of":"calendar","attr":"weekday","value":"Tuesday","time":{"at":"t.tue_evening"},"para":12,"quote":"On Tuesday evening"}
{"id":"f.clock_tue_evening","of":"clock","attr":"hour","value":"evening","time":{"at":"t.tue_evening"},"para":12,"quote":"On Tuesday evening"}
{"id":"f.holmes_gets_telegrams","of":"holmes","attr":"action","value":"receives telegrams from Colonel Ross and Inspector Gregory inviting his co-operation","time":{"at":"t.tue_evening"},"para":12,"quote":"On Tuesday evening I received telegrams from both Colonel Ross"}
{"id":"f.ross_telegraphs","of":"ross","attr":"action","value":"telegraphs Holmes inviting his co-operation","time":{"at":"t.tue_evening"},"para":12,"quote":"telegrams from both Colonel Ross, the owner of the horse"}
{"id":"f.gregory_telegraphs","of":"gregory","attr":"action","value":"telegraphs Holmes inviting his co-operation","time":{"at":"t.tue_evening"},"para":12,"quote":"and from Inspector Gregory, who is looking after the case, inviting my co-operation"}
{"id":"f.ross_owner","of":"silver_blaze","attr":"owner","value":"ross","time":{"at":"t.tue_evening"},"para":12,"quote":"Colonel Ross, the owner of the horse"}
{"id":"f.gregory_role","of":"gregory","attr":"role","value":"police inspector looking after the case","time":{"at":"t.tue_evening"},"para":12,"quote":"Inspector Gregory, who is looking after the case"}
{"id":"f.holmes_tells_telegrams","of":"holmes","attr":"tells","value":"acct.holmes","to":"watson","how":"told","time":{"at":"t.thu_on_line"},"para":12,"quote":"On Tuesday evening I received telegrams"}
{"id":"f.cal_thu","of":"calendar","attr":"weekday","value":"Thursday","time":{"from":"t.thu_breakfast","to":"t.thu_on_line"},"para":13,"quote":"And this is Thursday morning."}
{"id":"f.cal_wed","of":"calendar","attr":"weekday","value":"Wednesday","basis":"implied","time":{"at":"t.wed"},"para":13,"quote":"Why didn’t you go down yesterday?"}
{"id":"f.watson_asks_why","of":"watson","attr":"action","act":"ask","value":"asks Holmes why he did not go down yesterday","time":{"at":"t.thu_on_line"},"para":13,"quote":"Why didn’t you go down yesterday?"}
{"id":"f.holmes_says_blunder","of":"holmes","attr":"says","value":"he made a blunder in not going down on Wednesday","to":"watson","time":{"at":"t.thu_on_line"},"para":14,"quote":"Because I made a blunder, my dear Watson"}
{"id":"f.watson_memoirs","of":"memoirs","attr":"owner","value":"watson","basis":"implied","time":{"at":"t.thu_on_line"},"para":14,"quote":"who only knew me through your memoirs"}
{"id":"f.horse_reputed","of":"silver_blaze","attr":"reputed","value":"the most remarkable horse in England","time":{"at":"t.wed"},"para":14,"quote":"the most remarkable horse in England"}
{"id":"f.north_dartmoor_sparse","of":"dartmoor","attr":"condition","value":"the north of Dartmoor is sparsely inhabited","time":{"at":"t.wed"},"para":14,"quote":"so sparsely inhabited a place as the north of Dartmoor"}
{"id":"f.holmes_believed_not_concealed","of":"holmes","attr":"believes","value":"the horse could not long remain concealed on the moor","time":{"at":"t.wed"},"para":14,"quote":"I could not believe it possible that the most remarkable horse in England could long remain concealed","asserts":[{"of":"silver_blaze","attr":"condition","value":"concealed","neg":true,"time":{"at":"t.wed"}}]}
{"id":"f.holmes_expected_found","of":"holmes","attr":"believes","value":"the horse would soon be found, and its abductor would be Straker's murderer","time":{"at":"t.wed"},"para":14,"quote":"I expected to hear that he had been found, and that his abductor was the murderer of John Straker"}
{"id":"f.horse_not_found","of":"silver_blaze","attr":"condition","value":"found","neg":true,"time":{"at":"t.thu_breakfast"},"para":14,"quote":"When, however, another morning had come"}
{"id":"f.simpson_arrested","of":"simpson","attr":"condition","value":"arrested","time":{"from":"t.simpson_arrest"},"para":14,"quote":"the arrest of young Fitzroy Simpson"}
{"id":"f.simpson_young","of":"simpson","attr":"condition","value":"young","time":{"at":"t.simpson_arrest"},"para":14,"quote":"young Fitzroy Simpson"}
{"id":"f.nothing_else_done","of":"constabulary","attr":"action","value":"nothing done beyond the arrest of Simpson","time":{"at":"t.thu_breakfast"},"para":14,"quote":"beyond the arrest of young Fitzroy Simpson nothing had been done"}
{"id":"f.holmes_decides_act","of":"holmes","attr":"intends","value":"to take action on the case","time":{"at":"t.thu_breakfast"},"para":14,"quote":"I felt that it was time for me to take action"}
{"id":"f.holmes_says_not_wasted","of":"holmes","attr":"says","value":"in some ways Wednesday has not been wasted","to":"watson","time":{"at":"t.thu_on_line"},"para":14,"quote":"Yet in some ways I feel that yesterday has not been wasted."}
{"id":"f.holmes_tells_wait","of":"holmes","attr":"tells","value":"acct.holmes","to":"watson","how":"told","time":{"at":"t.thu_on_line"},"para":14,"quote":"I found that beyond the arrest of young Fitzroy Simpson nothing had been done"}
{"id":"f.watson_asks_theory","of":"watson","attr":"action","act":"ask","value":"asks whether Holmes has formed a theory","time":{"at":"t.thu_on_line"},"para":15,"quote":"You have formed a theory, then?"}
{"id":"f.holmes_says_grip","of":"holmes","attr":"says","value":"he has a grip of the essential facts of the case","to":"watson","time":{"at":"t.thu_on_line"},"para":16,"quote":"At least I have got a grip of the essential facts of the case."}
{"id":"f.holmes_intends_enumerate","of":"holmes","attr":"intends","value":"to enumerate the facts of the case to Watson","time":{"at":"t.thu_on_line"},"para":16,"quote":"I shall enumerate them to you"}
{"id":"f.watson_lies_back","of":"watson","attr":"action","value":"lies back against the cushions, puffing at his cigar","time":{"at":"t.thu_on_line"},"para":17,"quote":"I lay back against the cushions, puffing at my cigar"}
{"id":"f.watson_cigar","of":"watson","attr":"carrying","value":"watson_cigar","time":{"at":"t.thu_on_line"},"para":17,"quote":"puffing at my cigar"}
{"id":"f.holmes_checks_points","of":"holmes","attr":"action","value":"leans forward and checks off the points on the palm of his left hand","time":{"at":"t.thu_on_line"},"para":17,"quote":"with his long, thin forefinger checking off the points upon the palm of his left hand"}
{"id":"f.holmes_tells_case","of":"holmes","attr":"tells","value":"acct.holmes_case","to":"watson","how":"told","time":{"at":"t.thu_on_line"},"para":17,"quote":"gave me a sketch of the events which had led to our journey"}
{"id":"f.newspapers_tell_holmes","of":"newspapers","attr":"tells","value":["acct.case_reports","acct.baxter","acct.hunter","acct.mrs_straker","acct.lads","acct.search","acct.analysis","acct.police"],"to":"holmes","how":"newspaper","time":{"from":"t.wed","to":"t.thu_past_reading"},"para":7,"quote":"dipped rapidly into the bundle of fresh papers"}
{"id":"f.sb_isonomy","of":"silver_blaze","attr":"condition","value":"from the Isonomy stock","time":{"at":"t.thu_on_line"},"para":18,"quote":"is from the Isonomy stock"}
{"id":"f.sb_record","of":"silver_blaze","attr":"reputed","value":"holds as brilliant a record as his famous ancestor","time":{"at":"t.thu_on_line"},"para":18,"quote":"holds as brilliant a record as his famous ancestor"}
{"id":"f.sb_age","of":"silver_blaze","attr":"condition","value":"in his fifth year","time":{"at":"t.thu_on_line"},"para":18,"quote":"He is now in his fifth year"}
{"id":"f.sb_prizes","of":"silver_blaze","attr":"action","value":"has won in turn each of the prizes of the turf for Colonel Ross","time":{"after":"t.silver_blaze_foaled","before":"t.crime"},"para":18,"quote":"has brought in turn each of the prizes of the turf to Colonel Ross"}
{"id":"f.sb_odds","of":"silver_blaze","attr":"condition","value":"first favourite for the Wessex Cup, the betting three to one on him","time":{"after":"t.before","before":"t.crime"},"para":18,"quote":"the betting being three to one on him"}
{"id":"f.sb_public_favourite","of":"silver_blaze","attr":"reputed","value":"a prime favourite with the racing public, who has never disappointed them","time":{"after":"t.before","before":"t.crime"},"para":18,"quote":"has always, however, been a prime favourite with the racing public"}
{"id":"f.sb_money_laid","of":"racing_public","attr":"action","value":"lay enormous sums of money on Silver Blaze","time":{"after":"t.before","before":"t.crime"},"para":18,"quote":"enormous sums of money have been laid upon him"}
{"id":"f.holmes_says_interest","of":"holmes","attr":"says","value":"many people had the strongest interest in keeping Silver Blaze out of the race next Tuesday","to":"watson","time":{"at":"t.thu_on_line"},"para":18,"quote":"there were many people who had the strongest interest in preventing Silver Blaze from being there at the fall of the flag next Tuesday","asserts":[{"of":"silver_blaze","attr":"condition","value":"many people have an interest in preventing him from running"}]}
{"id":"f.race_tuesday","of":"wessex_cup","attr":"time","value":"run next Tuesday","time":{"at":"t.race"},"para":18,"quote":"at the fall of the flag next Tuesday"}
{"id":"f.cal_race_tue","of":"calendar","attr":"weekday","value":"Tuesday","time":{"at":"t.race"},"para":18,"quote":"next Tuesday"}
{"id":"f.ross_stables","of":"stables","attr":"owner","value":"ross","time":{"from":"t.before"},"para":19,"quote":"where the Colonel’s training-stable is situated"}
{"id":"f.precautions","of":"stables","attr":"condition","value":"every precaution taken to guard the favourite","time":{"after":"t.before","before":"t.crime"},"para":19,"quote":"Every precaution was taken to guard the favourite."}
{"id":"f.straker_retired_jockey","of":"straker","attr":"role","value":"retired jockey who rode in Colonel Ross's colours","time":{"at":"t.crime"},"para":19,"quote":"is a retired jockey who rode in Colonel Ross’s colours"}
{"id":"f.straker_too_heavy","of":"straker","attr":"condition","value":"became too heavy for the weighing-chair","time":{"at":"t.straker_trainer"},"para":19,"quote":"before he became too heavy for the weighing-chair"}
{"id":"f.straker_jockey_years","of":"straker","attr":"role","value":"Colonel Ross's jockey","time":{"from":"t.straker_jockey","to":"t.straker_trainer"},"para":19,"quote":"He has served the Colonel for five years as jockey"}
{"id":"f.straker_trainer_years","of":"straker","attr":"role","value":"Colonel Ross's trainer","time":{"from":"t.straker_trainer","to":"t.crime"},"para":19,"quote":"for seven as trainer"}
{"id":"f.straker_reputed","of":"straker","attr":"reputed","value":"a zealous and honest servant","time":{"from":"t.straker_jockey","to":"t.crime"},"para":19,"quote":"has always shown himself to be a zealous and honest servant"}
{"id":"f.lads_under_straker","of":"stable_lads","attr":"role","value":"the three lads under Straker","time":{"at":"t.crime"},"para":19,"quote":"Under him were three lads"}
{"id":"f.stables_four_horses","of":"stables","attr":"contents","value":"kp_horses","detail":"only four horses in all; a small establishment","time":{"at":"t.mon_stables_locked"},"para":19,"quote":"the establishment was a small one, containing only four horses in all"}
{"id":"f.sb_member","of":"silver_blaze","attr":"member_of","value":"kp_horses","basis":"implied","time":{"at":"t.mon_stables_locked"},"para":19,"quote":"containing only four horses in all"}
{"id":"f.lads_routine","of":"stable_lads","attr":"condition","value":"one sits up each night in the stable while the others sleep in the loft","time":{"after":"t.before","before":"t.crime"},"para":19,"quote":"One of these lads sat up each night in the stable, while the others slept in the loft"}
{"id":"f.lads_reputed","of":"stable_lads","attr":"reputed","value":"excellent characters","time":{"at":"t.crime"},"para":19,"quote":"All three bore excellent characters."}
{"id":"f.straker_married","of":"straker","attr":"condition","value":"married","time":{"at":"t.crime"},"para":19,"quote":"John Straker, who is a married man"}
{"id":"f.straker_lives_villa","of":"straker","attr":"lives_at","value":"straker_villa","detail":"a small villa about two hundred yards from the stables","time":{"at":"t.crime"},"para":19,"quote":"lived in a small villa about two hundred yards from the stables"}
{"id":"f.straker_no_children","of":"straker","attr":"condition","value":"has no children","time":{"at":"t.crime"},"para":19,"quote":"He has no children"}
{"id":"f.straker_keeps_maid","of":"straker","attr":"condition","value":"keeps one maid-servant","time":{"at":"t.crime"},"para":19,"quote":"keeps one maid-servant"}
{"id":"f.straker_comfortable","of":"straker","attr":"condition","value":"comfortably off","time":{"at":"t.crime"},"para":19,"quote":"is comfortably off"}
{"id":"f.country_lonely","of":"moor","attr":"condition","value":"the country round is very lonely","time":{"at":"t.crime"},"para":19,"quote":"The country round is very lonely"}
{"id":"f.villas_position","of":"villas","attr":"position","value":"about half a mile north of the stables","time":{"at":"t.crime"},"para":19,"quote":"about half a mile to the north there is a small cluster of villas"}
{"id":"f.villas_built","of":"tavistock_contractor","attr":"action","value":"builds the villas","time":{"at":"t.villas_built"},"para":19,"quote":"which have been built by a Tavistock contractor"}
{"id":"f.villas_purpose","of":"villas","attr":"role","value":"for invalids and others who wish to enjoy the Dartmoor air","time":{"at":"t.crime"},"para":19,"quote":"for the use of invalids and others who may wish to enjoy the pure Dartmoor air"}
{"id":"f.tavistock_position","of":"tavistock","attr":"position","value":"two miles to the west","time":{"at":"t.crime"},"para":19,"quote":"Tavistock itself lies two miles to the west"}
{"id":"f.mapleton_position","of":"mapleton","attr":"position","value":"across the moor, about two miles distant; a larger training establishment","time":{"at":"t.crime"},"para":19,"quote":"also about two miles distant, is the larger training establishment of Mapleton"}
{"id":"f.mapleton_owner","of":"mapleton","attr":"owner","value":"backwater","time":{"at":"t.crime"},"para":19,"quote":"which belongs to Lord Backwater"}
{"id":"f.brown_manages","of":"silas_brown","attr":"role","value":"manager of the Mapleton stables","time":{"at":"t.crime"},"para":19,"quote":"is managed by Silas Brown"}
{"id":"f.moor_wilderness","of":"moor","attr":"condition","value":"a complete wilderness in every other direction","time":{"at":"t.crime"},"para":19,"quote":"In every other direction the moor is a complete wilderness"}
{"id":"f.gypsies_on_moor","of":"gypsies","attr":"location","value":"moor","detail":"a few, roaming","time":{"at":"t.crime"},"para":19,"quote":"inhabited only by a few roaming gypsies"}
{"id":"f.cal_mon","of":"calendar","attr":"weekday","value":"Monday","time":{"at":"t.mon_stables_locked"},"para":19,"quote":"last Monday night when the catastrophe occurred"}
{"id":"f.horses_exercised","of":"kp_horses","attr":"action","value":"exercised and watered as usual","time":{"after":"t.before","before":"t.mon_stables_locked"},"para":20,"quote":"the horses had been exercised and watered as usual"}
{"id":"f.stables_locked","of":"stable_door","attr":"door","value":"locked","time":{"at":"t.mon_stables_locked"},"para":20,"quote":"the stables were locked up at nine o’clock"}
{"id":"f.clock_nine","of":"clock","attr":"hour","value":"nine o'clock","time":{"at":"t.mon_stables_locked"},"para":20,"quote":"at nine o’clock"}
{"id":"f.lads_walk_to_house","of":"other_lads","attr":"action","value":"walk up to the trainer's house","time":{"at":"t.mon_lads_supper"},"para":20,"quote":"Two of the lads walked up to the trainer’s house"}
{"id":"f.lads_in_kitchen","of":"other_lads","attr":"location","value":"kitchen","detail":"at supper","time":{"at":"t.mon_lads_supper"},"para":20,"quote":"where they had supper in the kitchen"}
{"id":"f.hunter_member","of":"hunter","attr":"member_of","value":"stable_lads","time":{"at":"t.mon_stables_locked"},"para":20,"quote":"while the third, Ned Hunter"}
{"id":"f.name_hunter","of":"hunter","attr":"name","value":"Ned Hunter","time":{"at":"t.mon_stables_locked"},"para":20,"quote":"Ned Hunter"}
{"id":"f.hunter_on_guard","of":"hunter","attr":"role","value":"on guard in the stable that night","time":{"from":"t.mon_stables_locked","to":"t.tue_at_stables"},"para":20,"quote":"remained on guard"}
{"id":"f.hunter_in_stables","of":"hunter","attr":"location","value":"stables","detail":"on guard","time":{"from":"t.mon_stables_locked","to":"t.mon_hunter_for_dog"},"para":20,"quote":"remained on guard"}
{"id":"f.name_baxter","of":"baxter","attr":"name","value":"Edith Baxter","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"the maid, Edith Baxter"}
{"id":"f.baxter_role","of":"baxter","attr":"role","value":"the Strakers' maid","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"the maid, Edith Baxter"}
{"id":"f.baxter_carries_supper","of":"baxter","attr":"action","value":"carries Hunter's supper down to the stables","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"carried down to the stables his supper"}
{"id":"f.baxter_carrying_supper","of":"baxter","attr":"carrying","value":"curried_mutton","time":{"from":"t.mon_maid_sets_out","to":"t.mon_maid_at_window"},"para":20,"quote":"carried down to the stables his supper"}
{"id":"f.clock_after_nine","of":"clock","attr":"hour","value":"a few minutes after nine","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"At a few minutes after nine"}
{"id":"f.supper_dish","of":"curried_mutton","attr":"condition","value":"a dish of curried mutton, Hunter's supper","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"which consisted of a dish of curried mutton"}
{"id":"f.baxter_no_liquid","of":"baxter","attr":"carrying","value":"any liquid","neg":true,"time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"She took no liquid"}
{"id":"f.tap_in_stables","of":"water_tap","attr":"location","value":"stables","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"there was a water-tap in the stables"}
{"id":"f.rule_tap","of":"stables","attr":"rule","value":"the lad on duty drinks nothing but water from the tap","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"it was the rule that the lad on duty should drink nothing else"}
{"id":"f.baxter_lantern","of":"baxter","attr":"carrying","value":"lantern","time":{"from":"t.mon_maid_sets_out","to":"t.mon_maid_at_window"},"para":20,"quote":"The maid carried a lantern with her"}
{"id":"f.weather_dark","of":"weather","attr":"condition","value":"very dark","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"it was very dark"}
{"id":"f.path_open_moor","of":"path","attr":"condition","value":"runs across the open moor","time":{"at":"t.mon_maid_sets_out"},"para":20,"quote":"the path ran across the open moor"}
{"id":"f.baxter_near_stables","of":"baxter","attr":"location","value":"path","detail":"within thirty yards of the stables","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"Edith Baxter was within thirty yards of the stables"}
{"id":"f.stranger_appears","of":"the_stranger","attr":"action","value":"appears out of the darkness and calls to her to stop","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"a man appeared out of the darkness and called to her to stop"}
{"id":"f.stranger_on_path","of":"the_stranger","attr":"location","value":"path","detail":"in the lantern light, thirty yards from the stables","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"he stepped into the circle of yellow light thrown by the lantern"}
{"id":"f.stranger_gentlemanly","of":"the_stranger","attr":"condition","value":"of gentlemanly bearing","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"a person of gentlemanly bearing"}
{"id":"f.stranger_tweed","of":"the_stranger","attr":"wearing","value":"tweed_suit","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"dressed in a grey suit of tweeds"}
{"id":"f.stranger_cap","of":"the_stranger","attr":"wearing","value":"cloth_cap","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"with a cloth cap"}
{"id":"f.stranger_gaiters","of":"the_stranger","attr":"wearing","value":"gaiters","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"He wore gaiters"}
{"id":"f.stranger_stick","of":"the_stranger","attr":"carrying","value":"stranger_stick","detail":"heavy, with a knob","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"carried a heavy stick with a knob to it"}
{"id":"f.stranger_pallor","of":"the_stranger","attr":"condition","value":"extremely pale","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"the extreme pallor of his face"}
{"id":"f.stranger_nervous","of":"the_stranger","attr":"condition","value":"nervous in manner","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"the nervousness of his manner"}
{"id":"f.baxter_thinks_age","of":"baxter","attr":"believes","value":"the stranger is rather over thirty","time":{"at":"t.mon_stranger_meets"},"para":21,"quote":"His age, she thought, would be rather over thirty than under it","asserts":[{"of":"the_stranger","attr":"condition","value":"rather over thirty years old"}]}
{"id":"f.stranger_asks_where","of":"the_stranger","attr":"says","value":"asks where he is; he had almost made up his mind to sleep on the moor when he saw her lantern","to":"baxter","time":{"at":"t.mon_stranger_meets"},"para":22,"quote":"Can you tell me where I am?","asserts":[{"of":"the_stranger","attr":"knows","value":"where he is","neg":true,"time":{"at":"t.mon_stranger_meets"}}]}
{"id":"f.baxter_says_kp","of":"baxter","attr":"says","value":"he is close to the King's Pyland training-stables","to":"the_stranger","time":{"at":"t.mon_stranger_meets"},"para":23,"quote":"You are close to the King’s Pyland training-stables"}
{"id":"f.stranger_says_boy","of":"the_stranger","attr":"says","value":"he understands a stable-boy sleeps there alone every night, and guesses she carries his supper","to":"baxter","time":{"at":"t.mon_stranger_meets"},"para":24,"quote":"I understand that a stable-boy sleeps there alone every night.","asserts":[{"of":"the_stranger","attr":"knows","value":"a stable-boy sleeps alone in the stable every night"}]}
{"id":"f.stranger_takes_packet","of":"the_stranger","attr":"action","value":"takes a folded piece of white paper out of his waistcoat pocket","time":{"at":"t.mon_stranger_meets"},"para":24,"quote":"He took a piece of white paper folded up out of his waistcoat pocket."}
{"id":"f.stranger_carrying_packet","of":"the_stranger","attr":"carrying","value":"paper_packet","time":{"from":"t.mon_stranger_meets"},"para":24,"quote":"He took a piece of white paper folded up out of his waistcoat pocket."}
{"id":"f.stranger_offers_dress","of":"the_stranger","attr":"says","value":"offers her the prettiest frock money can buy if she sees that the boy has the paper tonight","to":"baxter","time":{"at":"t.mon_stranger_meets"},"para":24,"quote":"See that the boy has this to-night, and you shall have the prettiest frock that money can buy.","asserts":[{"of":"the_stranger","attr":"intends","value":"that the stable-boy should have the paper tonight"}]}
{"id":"f.baxter_frightened","of":"baxter","attr":"condition","value":"frightened by the earnestness of his manner","time":{"at":"t.mon_stranger_meets"},"para":25,"quote":"She was frightened by the earnestness of his manner"}
{"id":"f.baxter_runs_window","of":"baxter","attr":"action","value":"runs past him to the window where she hands in the meals","time":{"at":"t.mon_maid_at_window"},"para":25,"quote":"ran past him to the window through which she was accustomed to hand the meals"}
{"id":"f.baxter_at_window","of":"baxter","attr":"location","value":"stable_window","detail":"outside","time":{"from":"t.mon_maid_at_window","to":"t.mon_hunter_for_dog"},"para":25,"quote":"ran past him to the window"}
{"id":"f.window_meals","of":"stable_window","attr":"role","value":"the window through which meals are handed in","time":{"at":"t.mon_maid_at_window"},"para":25,"quote":"through which she was accustomed to hand the meals"}
{"id":"f.window_open","of":"stable_window","attr":"condition","value":"already open","time":{"at":"t.mon_maid_at_window"},"para":25,"quote":"It was already opened"}
{"id":"f.hunter_at_table","of":"hunter","attr":"location","value":"stable_table","detail":"seated, inside","time":{"from":"t.mon_maid_at_window","to":"t.mon_hunter_for_dog"},"para":25,"quote":"Hunter was seated at the small table inside"}
{"id":"f.baxter_begins_tell","of":"baxter","attr":"action","value":"begins to tell Hunter what has happened","time":{"at":"t.mon_maid_at_window"},"para":25,"quote":"She had begun to tell him of what had happened"}
{"id":"f.stranger_at_window","of":"the_stranger","attr":"location","value":"stable_window","detail":"looking through it","time":{"from":"t.mon_stranger_at_window","to":"t.mon_hunter_for_dog"},"para":25,"quote":"when the stranger came up again"}
{"id":"f.stranger_says_word","of":"the_stranger","attr":"says","value":"good evening; he wants a word with Hunter","to":"hunter","time":{"at":"t.mon_stranger_at_window"},"para":26,"quote":"I wanted to have a word with you."}
{"id":"f.baxter_sees_packet","of":"baxter","attr":"observes","value":"the corner of the paper packet protruding from the stranger's closed hand","time":{"at":"t.mon_stranger_at_window"},"para":26,"quote":"she noticed the corner of the little paper packet protruding from his closed hand"}
{"id":"f.baxter_swears","of":"baxter","attr":"tells","value":"acct.baxter","to":"police","how":"sworn statement","time":{"at":"t.baxter_sworn"},"para":26,"quote":"The girl has sworn"}
{"id":"f.hunter_asks_business","of":"hunter","attr":"says","value":"asks what business the stranger has there","to":"the_stranger","time":{"at":"t.mon_stranger_at_window"},"para":27,"quote":"What business have you here?"}
{"id":"f.stranger_asks_tip","of":"the_stranger","attr":"says","value":"business that may put something in Hunter's pocket; asks for the straight tip, whether Bayard could beat Silver Blaze and the stable has its money on Bayard","to":"hunter","time":{"at":"t.mon_stranger_at_window"},"para":28,"quote":"Is it a fact that at the weights Bayard could give the other a hundred yards in five furlongs","asserts":[{"of":"bayard","attr":"member_of","value":"kp_horses"},{"of":"bayard","attr":"role","value":"King's Pyland entry for the Wessex Cup"},{"of":"silver_blaze","attr":"role","value":"King's Pyland entry for the Wessex Cup"},{"of":"bayard","attr":"condition","value":"could give Silver Blaze a hundred yards in five furlongs at the weights","modal":"possible"}]}
{"id":"f.hunter_says_tout","of":"hunter","attr":"says","value":"the stranger is one of those damned touts; he'll show him how they serve them","to":"the_stranger","time":{"at":"t.mon_stranger_at_window"},"para":29,"quote":"So, you’re one of those damned touts!","asserts":[{"of":"the_stranger","attr":"role","value":"a racing tout"}]}
{"id":"f.hunter_rushes_dog","of":"hunter","attr":"action","value":"springs up and rushes across the stable to unloose the dog","time":{"at":"t.mon_hunter_for_dog"},"para":29,"quote":"He sprang up and rushed across the stable to unloose the dog"}
{"id":"f.dog_in_stable","of":"dog","attr":"lives_at","value":"stables","basis":"implied","time":{"at":"t.mon_hunter_for_dog"},"para":29,"quote":"rushed across the stable to unloose the dog"}
{"id":"f.baxter_flees","of":"baxter","attr":"action","value":"flees to the house","time":{"at":"t.mon_hunter_for_dog"},"para":29,"quote":"The girl fled away to the house"}
{"id":"f.baxter_home","of":"baxter","attr":"location","value":"straker_villa","time":{"at":"t.mon_maid_home"},"para":29,"quote":"The girl fled away to the house"}
{"id":"f.baxter_sees_leaning","of":"baxter","attr":"observes","value":"the stranger leaning through the window","time":{"at":"t.mon_hunter_for_dog"},"para":29,"quote":"as she ran she looked back and saw that the stranger was leaning through the window"}
{"id":"f.stranger_leaning","of":"the_stranger","attr":"location","value":"stable_window","detail":"leaning through the window","time":{"at":"t.mon_hunter_for_dog"},"para":29,"quote":"the stranger was leaning through the window"}
{"id":"f.hunter_rushes_out","of":"hunter","attr":"action","value":"rushes out with the hound a minute later","time":{"at":"t.mon_hunter_runs_out"},"para":29,"quote":"A minute later, however, when Hunter rushed out with the hound"}
{"id":"f.hunter_outside","of":"hunter","attr":"location","value":"moor","detail":"running all round the buildings, with the dog","time":{"at":"t.mon_hunter_runs_out"},"para":29,"quote":"he ran all round the buildings"}
{"id":"f.dog_outside","of":"dog","attr":"location","value":"moor","detail":"out round the buildings with Hunter","time":{"at":"t.mon_hunter_runs_out"},"para":29,"quote":"when Hunter rushed out with the hound"}
{"id":"f.stranger_gone","of":"the_stranger","attr":"location","value":"stable_window","neg":true,"detail":"gone","time":{"at":"t.mon_hunter_runs_out"},"para":29,"quote":"he was gone"}
{"id":"f.hunter_no_trace","of":"hunter","attr":"observes","value":"no trace of the stranger round the buildings","time":{"at":"t.mon_hunter_runs_out"},"para":29,"quote":"he failed to find any trace of him"}
{"id":"f.watson_asks_door","of":"watson","attr":"action","act":"ask","thing":"stable_door","value":"asks whether the stable-boy left the door unlocked when he ran out with the dog","time":{"at":"t.thu_on_line"},"para":30,"quote":"Did the stable-boy, when he ran out with the dog, leave the door unlocked behind him?"}
{"id":"f.holmes_praises","of":"holmes","attr":"says","value":"Watson's question is excellent","to":"watson","time":{"at":"t.thu_on_line"},"para":31,"quote":"Excellent, Watson, excellent!"}
{"id":"f.holmes_believes_door_point","of":"holmes","attr":"believes","value":"whether the door was left unlocked is an important point","time":{"at":"t.wed"},"para":31,"quote":"The importance of the point struck me so forcibly"}
{"id":"f.holmes_sends_wire","of":"holmes","attr":"action","value":"sends a special wire to Dartmoor to clear up the point of the door","time":{"at":"t.wed"},"para":31,"quote":"I sent a special wire to Dartmoor yesterday to clear the matter up"}
{"id":"f.wire_reply_tells","of":"?","attr":"tells","value":"acct.hunter","partial":true,"to":"holmes","how":"telegram","time":{"at":"t.wire_reply"},"para":31,"quote":"to clear the matter up"}
{"id":"f.holmes_tells_wire","of":"holmes","attr":"tells","value":"acct.holmes","to":"watson","how":"told","time":{"at":"t.thu_on_line"},"para":31,"quote":"I sent a special wire to Dartmoor yesterday"}
{"id":"f.hunter_locks_door","of":"hunter","attr":"action","act":"lock","thing":"stable_door","value":"locks the door before leaving the stable","time":{"at":"t.mon_hunter_runs_out"},"para":31,"quote":"The boy locked the door before he left it."}
{"id":"f.door_locked_after","of":"stable_door","attr":"door","value":"locked","time":{"from":"t.mon_hunter_runs_out"},"para":31,"quote":"The boy locked the door before he left it."}
{"id":"f.window_small","of":"stable_window","attr":"condition","value":"not large enough for a man to get through","time":{"at":"t.mon_hunter_for_dog"},"para":31,"quote":"The window, I may add, was not large enough for a man to get through."}
{"id":"f.hunter_waits","of":"hunter","attr":"action","value":"waits until the other grooms return","time":{"after":"t.mon_hunter_runs_out","before":"t.mon_lads_return"},"para":32,"quote":"Hunter waited until his fellow-grooms had returned"}
{"id":"f.lads_back","of":"other_lads","attr":"location","value":"stables","time":{"at":"t.mon_lads_return"},"para":32,"quote":"his fellow-grooms had returned"}
{"id":"f.hunter_tells_straker","of":"hunter","attr":"tells","value":"acct.hunter","partial":true,"to":"straker","how":"told","time":{"at":"t.mon_lads_return"},"para":32,"quote":"he sent a message to the trainer and told him what had occurred"}
{"id":"f.straker_excited","of":"straker","attr":"condition","value":"excited at hearing the account","time":{"after":"t.mon_lads_return","before":"t.tue_one_am"},"para":32,"quote":"Straker was excited at hearing the account"}
{"id":"f.straker_not_realise","of":"straker","attr":"knows","value":"the true significance of the account","neg":true,"time":{"after":"t.mon_lads_return","before":"t.tue_one_am"},"para":32,"quote":"he does not seem to have quite realized its true significance"}
{"id":"f.straker_uneasy","of":"straker","attr":"condition","value":"vaguely uneasy","time":{"after":"t.mon_lads_return","before":"t.straker_leaves"},"para":32,"quote":"It left him, however, vaguely uneasy"}
{"id":"f.mrs_straker_wakes_one","of":"mrs_straker","attr":"action","value":"wakes and finds her husband dressing","time":{"at":"t.tue_one_am"},"para":32,"quote":"Mrs. Straker, waking at one in the morning, found that he was dressing"}
{"id":"f.clock_one","of":"clock","attr":"hour","value":"one in the morning","time":{"at":"t.tue_one_am"},"para":32,"quote":"at one in the morning"}
{"id":"f.straker_dressing","of":"straker","attr":"action","value":"dressing","time":{"at":"t.tue_one_am"},"para":32,"quote":"found that he was dressing"}
{"id":"f.straker_at_villa_one","of":"straker","attr":"location","value":"straker_villa","basis":"implied","time":{"from":"t.tue_one_am","to":"t.straker_leaves"},"para":32,"quote":"found that he was dressing"}
{"id":"f.mrs_straker_at_villa","of":"mrs_straker","attr":"location","value":"straker_villa","basis":"implied","time":{"from":"t.tue_one_am","to":"t.tue_seven"},"para":32,"quote":"Mrs. Straker, waking at one in the morning"}
{"id":"f.straker_says_anxiety","of":"straker","attr":"says","value":"he cannot sleep for anxiety about the horses and will walk down to the stables to see all is well","to":"mrs_straker","time":{"at":"t.tue_one_am"},"para":32,"quote":"he said that he could not sleep on account of his anxiety about the horses","asserts":[{"of":"straker","attr":"condition","value":"cannot sleep for anxiety about the horses"},{"of":"straker","attr":"intends","value":"to walk down to the stables to see that all is well"}]}
{"id":"f.mrs_straker_begs","of":"mrs_straker","attr":"says","value":"begs him to remain at home","to":"straker","time":{"at":"t.tue_one_am"},"para":32,"quote":"She begged him to remain at home"}
{"id":"f.rain_one","of":"weather","attr":"condition","value":"raining","time":{"at":"t.tue_one_am"},"para":32,"quote":"she could hear the rain pattering against the window"}
{"id":"f.straker_mackintosh","of":"straker","attr":"wearing","value":"straker_coat","time":{"from":"t.straker_leaves"},"para":32,"quote":"he pulled on his large mackintosh"}
{"id":"f.straker_leaves","of":"straker","attr":"action","value":"leaves the house in spite of her entreaties","time":{"at":"t.straker_leaves"},"para":32,"quote":"in spite of her entreaties he pulled on his large mackintosh and left the house"}
{"id":"f.mrs_straker_wakes_seven","of":"mrs_straker","attr":"action","value":"wakes at seven","time":{"at":"t.tue_seven"},"para":33,"quote":"Mrs. Straker awoke at seven in the morning"}
{"id":"f.clock_seven","of":"clock","attr":"hour","value":"seven in the morning","time":{"at":"t.tue_seven"},"para":33,"quote":"at seven in the morning"}
{"id":"f.straker_not_returned","of":"straker","attr":"location","value":"straker_villa","neg":true,"detail":"not yet returned","time":{"at":"t.tue_seven"},"para":33,"quote":"her husband had not yet returned"}
{"id":"f.mrs_straker_wife","of":"mrs_straker","attr":"role","value":"Straker's wife","basis":"implied","time":{"at":"t.tue_seven"},"para":33,"quote":"her husband"}
{"id":"f.mrs_straker_sets_off","of":"mrs_straker","attr":"action","value":"dresses hastily, calls the maid and sets off for the stables","time":{"after":"t.tue_seven","before":"t.tue_at_stables"},"para":33,"quote":"She dressed herself hastily, called the maid, and set off for the stables."}
{"id":"f.mrs_straker_at_stables","of":"mrs_straker","attr":"location","value":"stables","time":{"at":"t.tue_at_stables"},"para":33,"quote":"set off for the stables"}
{"id":"f.baxter_at_stables","of":"baxter","attr":"location","value":"stables","time":{"at":"t.tue_at_stables"},"para":33,"quote":"called the maid, and set off for the stables"}
{"id":"f.door_open","of":"stable_door","attr":"door","value":"open","time":{"at":"t.tue_at_stables"},"para":33,"quote":"The door was open"}
{"id":"f.hunter_on_chair","of":"hunter","attr":"location","value":"stables","detail":"huddled on a chair","time":{"at":"t.tue_at_stables"},"para":33,"quote":"inside, huddled together upon a chair"}
{"id":"f.hunter_stupor","of":"hunter","attr":"condition","value":"in a state of absolute stupor","time":{"from":"t.tue_at_stables","to":"t.hunter_recovers"},"para":33,"quote":"Hunter was sunk in a state of absolute stupor"}
{"id":"f.stall_empty","of":"silver_blaze","attr":"location","value":"favourite_stall","neg":true,"time":{"at":"t.tue_at_stables"},"para":33,"quote":"the favourite’s stall was empty"}
{"id":"f.no_sign_straker","of":"straker","attr":"location","value":"stables","neg":true,"time":{"at":"t.tue_at_stables"},"para":33,"quote":"there were no signs of his trainer"}
{"id":"f.lads_in_loft","of":"other_lads","attr":"location","value":"stable_loft","detail":"asleep","time":{"from":"t.mon_lads_return","to":"t.tue_at_stables"},"para":34,"quote":"The two lads who slept in the chaff-cutting loft above the harness-room"}
{"id":"f.loft_above","of":"stable_loft","attr":"position","value":"above the harness-room","time":{"at":"t.tue_at_stables"},"para":34,"quote":"the chaff-cutting loft above the harness-room"}
{"id":"f.lads_aroused","of":"other_lads","attr":"action","value":"are quickly aroused","time":{"at":"t.tue_at_stables"},"para":34,"quote":"were quickly aroused"}
{"id":"f.lads_heard_nothing","of":"other_lads","attr":"says","value":"they heard nothing during the night","time":{"at":"t.tue_at_stables"},"para":34,"quote":"They had heard nothing during the night","asserts":[{"of":"other_lads","attr":"observes","value":"any sound in the night","neg":true,"time":{"from":"t.mon_lads_return","to":"t.tue_at_stables"}}]}
{"id":"f.lads_sound_sleepers","of":"other_lads","attr":"condition","value":"both sound sleepers","time":{"at":"t.tue_at_stables"},"para":34,"quote":"for they are both sound sleepers"}
{"id":"f.hunter_drugged","of":"hunter","attr":"condition","value":"under the influence of some powerful drug; no sense to be got out of him","time":{"at":"t.tue_at_stables"},"para":34,"quote":"Hunter was obviously under the influence of some powerful drug"}
{"id":"f.hunter_left_sleep","of":"hunter","attr":"condition","value":"left to sleep it off","time":{"from":"t.tue_at_stables","to":"t.hunter_recovers"},"para":34,"quote":"he was left to sleep it off"}
{"id":"f.party_mrs_straker","of":"mrs_straker","attr":"member_of","value":"search_party","time":{"from":"t.tue_at_stables","to":"t.tue_hollow"},"para":34,"quote":"the two lads and the two women"}
{"id":"f.party_baxter","of":"baxter","attr":"member_of","value":"search_party","time":{"from":"t.tue_at_stables","to":"t.tue_hollow"},"para":34,"quote":"the two lads and the two women"}
{"id":"f.party_lads","of":"other_lads","attr":"member_of","value":"search_party","time":{"from":"t.tue_at_stables","to":"t.tue_hollow"},"para":34,"quote":"the two lads and the two women"}
{"id":"f.party_searches","of":"search_party","attr":"action","value":"run out in search of Straker and the horse","time":{"after":"t.tue_at_stables","before":"t.tue_knoll"},"para":34,"quote":"ran out in search of the absentees"}
{"id":"f.party_hopes","of":"search_party","attr":"believes","value":"the trainer may have taken the horse out for early exercise","modal":"possible","time":{"after":"t.tue_at_stables","before":"t.tue_knoll"},"para":34,"quote":"They still had hopes that the trainer had for some reason taken out the horse for early exercise","asserts":[{"of":"straker","attr":"action","value":"took the horse out for early exercise","modal":"possible"}]}
{"id":"f.party_on_knoll","of":"search_party","attr":"location","value":"knoll","time":{"at":"t.tue_knoll"},"para":34,"quote":"on ascending the knoll near the house"}
{"id":"f.knoll_view","of":"knoll","attr":"condition","value":"all the neighbouring moors are visible from it","time":{"at":"t.tue_knoll"},"para":34,"quote":"from which all the neighbouring moors were visible"}
{"id":"f.party_no_horse","of":"search_party","attr":"observes","value":"any sign of the missing favourite","neg":true,"time":{"at":"t.tue_knoll"},"para":34,"quote":"they not only could see no signs of the missing favourite"}
{"id":"f.party_sees_tragedy","of":"search_party","attr":"observes","value":"something that warns them of a tragedy","time":{"at":"t.tue_knoll"},"para":34,"quote":"they perceived something which warned them that they were in the presence of a tragedy"}
{"id":"f.coat_on_bush","of":"straker_coat","attr":"location","value":"furze_bush","detail":"flapping from it","time":{"at":"t.tue_hollow"},"para":35,"quote":"John Straker’s overcoat was flapping from a furze-bush"}
{"id":"f.bush_distance","of":"furze_bush","attr":"position","value":"about a quarter of a mile from the stables","time":{"at":"t.tue_hollow"},"para":35,"quote":"About a quarter of a mile from the stables"}
{"id":"f.hollow_beyond","of":"hollow","attr":"position","value":"a bowl-shaped depression immediately beyond the furze-bush","time":{"at":"t.tue_hollow"},"para":35,"quote":"Immediately beyond there was a bowl-shaped depression in the moor"}
{"id":"f.body_in_hollow","of":"straker","attr":"location","value":"hollow","detail":"dead, at the bottom","time":{"at":"t.tue_hollow"},"para":35,"quote":"at the bottom of this was found the dead body of the unfortunate trainer"}
{"id":"f.straker_dead","of":"straker","attr":"condition","value":"dead","time":{"from":"t.crime"},"para":35,"quote":"the dead body of the unfortunate trainer"}
{"id":"f.head_shattered","of":"straker","attr":"condition","value":"head shattered by a savage blow from some heavy weapon","time":{"at":"t.tue_hollow"},"para":35,"quote":"His head had been shattered by a savage blow from some heavy weapon"}
{"id":"f.thigh_cut","of":"straker","attr":"condition","value":"a long clean cut on the thigh from some very sharp instrument","time":{"at":"t.tue_hollow"},"para":35,"quote":"he was wounded on the thigh, where there was a long, clean cut"}
{"id":"f.straker_defended","of":"straker","attr":"action","value":"defended himself vigorously against his assailants","time":{"at":"t.crime"},"para":35,"quote":"Straker had defended himself vigorously against his assailants"}
{"id":"f.straker_knife","of":"straker","attr":"carrying","value":"straker_knife","detail":"held in his right hand","time":{"at":"t.tue_hollow"},"para":35,"quote":"in his right hand he held a small knife"}
{"id":"f.knife_blood","of":"straker_knife","attr":"condition","value":"clotted with blood up to the handle","time":{"at":"t.tue_hollow"},"para":35,"quote":"which was clotted with blood up to the handle"}
{"id":"f.straker_cravat","of":"straker","attr":"carrying","value":"cravat","detail":"clasped in his left hand","time":{"at":"t.tue_hollow"},"para":35,"quote":"in his left he clasped a red and black silk cravat"}
{"id":"f.baxter_recognises","of":"baxter","attr":"says","value":"the cravat was worn the evening before by the stranger who visited the stables","time":{"after":"t.tue_hollow","before":"t.thu_on_line"},"para":35,"quote":"which was recognised by the maid as having been worn on the preceding evening by the stranger","asserts":[{"of":"the_stranger","attr":"wearing","value":"cravat","time":{"at":"t.mon_stranger_meets"}}]}
{"id":"f.hunter_recovers","of":"hunter","attr":"condition","value":"recovered from his stupor","time":{"at":"t.hunter_recovers"},"para":36,"quote":"Hunter, on recovering from his stupor"}
{"id":"f.hunter_cravat","of":"hunter","attr":"says","value":"he is quite positive the cravat is the stranger's","time":{"after":"t.hunter_recovers","before":"t.thu_on_line"},"para":36,"quote":"was also quite positive as to the ownership of the cravat","asserts":[{"of":"cravat","attr":"owner","value":"the_stranger"}]}
{"id":"f.hunter_believes_drugged","of":"hunter","attr":"believes","value":"the stranger drugged his curried mutton while standing at the window","time":{"after":"t.hunter_recovers","before":"t.thu_on_line"},"para":36,"quote":"He was equally certain that the same stranger had, while standing at the window, drugged his curried mutton","asserts":[{"of":"the_stranger","attr":"action","act":"drug","thing":"curried_mutton","value":"drugs Hunter's curried mutton at the window","time":{"at":"t.mon_hunter_for_dog"}}]}
{"id":"f.horse_in_hollow","of":"silver_blaze","attr":"location","value":"hollow","detail":"abundant proofs in the mud","time":{"at":"t.crime"},"para":37,"quote":"there were abundant proofs in the mud which lay at the bottom of the fatal hollow that he had been there at the time of the struggle"}
{"id":"f.horse_gone_since","of":"silver_blaze","attr":"condition","value":"disappeared; no news of him","time":{"from":"t.tue_hollow","to":"t.thu_on_line"},"para":37,"quote":"from that morning he has disappeared"}
{"id":"f.reward","of":"silver_blaze","attr":"condition","value":"a large reward offered for him","time":{"from":"t.reward"},"para":37,"quote":"although a large reward has been offered"}
{"id":"f.gypsies_alert","of":"gypsies","attr":"action","value":"are on the alert for the horse","time":{"from":"t.reward","to":"t.thu_on_line"},"para":37,"quote":"all the gypsies of Dartmoor are on the alert"}
{"id":"f.hunter_ate","of":"hunter","attr":"action","value":"eats part of his supper and leaves the remains","basis":"implied","time":{"at":"t.hunter_eats_supper"},"para":37,"quote":"the remains of his supper left by the stable-lad"}
{"id":"f.analysis_opium","of":"curried_mutton","attr":"contents","value":"opium","detail":"an appreciable quantity of powdered opium in the remains","time":{"at":"t.analysis"},"para":37,"quote":"contain an appreciable quantity of powdered opium"}
{"id":"f.household_ate","of":"household","attr":"action","value":"eat the same dish the same night without ill effect","time":{"at":"t.mon_lads_supper"},"para":37,"quote":"the people at the house partook of the same dish on the same night without any ill effect"}
{"id":"f.holmes_says_main_facts","of":"holmes","attr":"says","value":"those are the main facts, stripped of all surmise; he will now recapitulate what the police have done","to":"watson","time":{"at":"t.thu_on_line"},"para":38,"quote":"Those are the main facts of the case, stripped of all surmise"}
{"id":"f.holmes_says_gregory","of":"holmes","attr":"says","value":"Gregory is an extremely competent officer who lacks imagination","to":"watson","time":{"at":"t.thu_on_line"},"para":39,"quote":"Were he but gifted with imagination he might rise to great heights in his profession.","asserts":[{"of":"gregory","attr":"reputed","value":"extremely competent but without imagination"}]}
{"id":"f.gregory_arrives","of":"gregory","attr":"location","value":"kings_pyland","basis":"implied","time":{"at":"t.gregory_arrives"},"para":39,"quote":"On his arrival"}
{"id":"f.gregory_arrests","of":"gregory","attr":"action","value":"promptly finds and arrests the man upon whom suspicion naturally rested","time":{"at":"t.simpson_arrest"},"para":39,"quote":"he promptly found and arrested the man upon whom suspicion naturally rested"}
{"id":"f.simpson_lives_villa","of":"simpson","attr":"lives_at","value":"villas","time":{"from":"t.simpson_arrives","to":"t.simpson_arrest"},"para":39,"quote":"he inhabited one of those villas which I have mentioned"}
{"id":"f.name_simpson","of":"simpson","attr":"name","value":"Fitzroy Simpson","time":{"at":"t.simpson_arrest"},"para":39,"quote":"His name, it appears, was Fitzroy Simpson."}
{"id":"f.simpson_birth","of":"simpson","attr":"condition","value":"of excellent birth and education","time":{"at":"t.simpson_arrest"},"para":39,"quote":"He was a man of excellent birth and education"}
{"id":"f.simpson_squandered","of":"simpson","attr":"action","value":"squanders a fortune on the turf","time":{"at":"t.simpson_squanders"},"para":39,"quote":"who had squandered a fortune upon the turf"}
{"id":"f.simpson_bookmaker","of":"simpson","attr":"role","value":"a quiet and genteel bookmaker in the sporting clubs of London","time":{"after":"t.simpson_squanders","before":"t.simpson_arrest"},"para":39,"quote":"lived now by doing a little quiet and genteel book-making in the sporting clubs of London"}
{"id":"f.police_examine_book","of":"gregory","attr":"action","value":"examines Simpson's betting-book","time":{"after":"t.simpson_arrest","before":"t.thu_on_line"},"para":39,"quote":"An examination of his betting-book"}
{"id":"f.book_owner","of":"betting_book","attr":"owner","value":"simpson","basis":"implied","time":{"at":"t.simpson_arrest"},"para":39,"quote":"his betting-book"}
{"id":"f.book_contents","of":"betting_book","attr":"contents","value":"bets of five thousand pounds against the favourite","time":{"from":"t.simpson_bets"},"para":39,"quote":"bets to the amount of five thousand pounds had been registered by him against the favourite"}
{"id":"f.simpson_bets_against","of":"simpson","attr":"action","value":"registers bets of five thousand pounds against the favourite","time":{"at":"t.simpson_bets"},"para":39,"quote":"bets to the amount of five thousand pounds had been registered by him against the favourite"}
{"id":"f.simpson_says_came","of":"simpson","attr":"says","value":"he came down to Dartmoor hoping for information about the King's Pyland horses and Desborough","to":"gregory","time":{"at":"t.simpson_arrest"},"para":40,"quote":"On being arrested he volunteered the statement that he had come down to Dartmoor in the hope of getting some information","asserts":[{"of":"simpson","attr":"intends","value":"to get information about the King's Pyland horses and Desborough","time":{"at":"t.simpson_arrives"}}]}
{"id":"f.desborough_second","of":"desborough","attr":"role","value":"second favourite for the Wessex Cup","time":{"at":"t.crime"},"para":40,"quote":"Desborough, the second favourite"}
{"id":"f.desborough_mapleton","of":"desborough","attr":"lives_at","value":"mapleton","detail":"in charge of Silas Brown","time":{"at":"t.crime"},"para":40,"quote":"which was in charge of Silas Brown at the Mapleton stables"}
{"id":"f.simpson_admits","of":"simpson","attr":"says","value":"does not deny having acted as described the evening before","to":"gregory","time":{"at":"t.simpson_arrest"},"para":40,"quote":"He did not attempt to deny that he had acted as described upon the evening before"}
{"id":"f.stranger_identity","of":"the_stranger","attr":"identity","value":"simpson","time":{"at":"t.mon_stranger_meets"},"para":40,"quote":"He did not attempt to deny that he had acted as described upon the evening before"}
{"id":"f.simpson_says_no_designs","of":"simpson","attr":"says","value":"he had no sinister designs and simply wished first-hand information","to":"gregory","time":{"at":"t.simpson_arrest"},"para":40,"quote":"declared that he had no sinister designs, and had simply wished to obtain first-hand information","asserts":[{"of":"simpson","attr":"intends","value":"only to obtain first-hand information","time":{"at":"t.mon_stranger_meets"}}]}
{"id":"f.gregory_confronts","of":"gregory","attr":"action","value":"confronts Simpson with his cravat","time":{"at":"t.simpson_arrest"},"para":40,"quote":"When confronted with his cravat"}
{"id":"f.cravat_owner","of":"cravat","attr":"owner","value":"simpson","time":{"at":"t.simpson_arrest"},"para":40,"quote":"When confronted with his cravat"}
{"id":"f.simpson_pale","of":"simpson","attr":"condition","value":"turns very pale; utterly unable to account for the cravat in the dead man's hand","time":{"at":"t.simpson_arrest"},"para":40,"quote":"he turned very pale, and was utterly unable to account for its presence in the hand of the murdered man"}
{"id":"f.simpson_wet","of":"simpson","attr":"condition","value":"clothing wet","time":{"at":"t.simpson_arrest"},"para":40,"quote":"His wet clothing"}
{"id":"f.simpson_out_storm","of":"simpson","attr":"location","value":null,"detail":"out of doors in the storm","time":{"at":"t.night_storm"},"para":40,"quote":"he had been out in the storm of the night before"}
{"id":"f.storm","of":"weather","attr":"condition","value":"storm","time":{"at":"t.night_storm"},"para":40,"quote":"the storm of the night before"}
{"id":"f.simpson_stick_owner","of":"simpson_stick","attr":"owner","value":"simpson","time":{"at":"t.simpson_arrest"},"para":40,"quote":"his stick, which was a Penang-lawyer weighted with lead"}
{"id":"f.stick_lead","of":"simpson_stick","attr":"condition","value":"a Penang-lawyer weighted with lead","time":{"at":"t.simpson_arrest"},"para":40,"quote":"a Penang-lawyer weighted with lead"}
{"id":"f.stick_weapon","of":"simpson_stick","attr":"condition","value":"just such a weapon as might, by repeated blows, have inflicted Straker's injuries","time":{"at":"t.simpson_arrest"},"para":40,"quote":"was just such a weapon as might, by repeated blows, have inflicted the terrible injuries"}
{"id":"f.simpson_unwounded","of":"simpson","attr":"condition","value":"wounded","neg":true,"time":{"at":"t.simpson_arrest"},"para":41,"quote":"there was no wound upon his person"}
{"id":"f.holmes_says_marked","of":"holmes","attr":"says","value":"the state of Straker's knife shows that one at least of his assailants must bear his mark","to":"watson","time":{"at":"t.thu_on_line"},"para":41,"quote":"the state of Straker’s knife would show that one at least of his assailants must bear his mark upon him","asserts":[{"of":"straker","attr":"action","value":"wounded one of his assailants with his knife","time":{"at":"t.crime"}}]}
{"id":"f.holmes_asks_light","of":"holmes","attr":"action","act":"ask","value":"asks Watson for any light on the case","time":{"at":"t.thu_on_line"},"para":41,"quote":"if you can give me any light I shall be infinitely obliged to you"}
{"id":"f.watson_listens","of":"watson","attr":"action","value":"listens with the greatest interest to Holmes's statement","time":{"at":"t.thu_on_line"},"para":42,"quote":"I had listened with the greatest interest to the statement"}
{"id":"f.watson_knew_facts","of":"watson","attr":"knows","value":"most of the facts of the case","time":{"at":"t.thu_on_line"},"para":42,"quote":"Though most of the facts were familiar to me"}
{"id":"f.watson_not_appreciated","of":"watson","attr":"knows","value":"the relative importance of the facts and their connection","neg":true,"time":{"at":"t.watson_reads"},"para":42,"quote":"I had not sufficiently appreciated their relative importance, nor their connection to each other"}
{"id":"f.watson_suggests_cut","of":"watson","attr":"says","value":"the cut on Straker's thigh may have been made by his own knife in the convulsions after the blow to his head","to":"holmes","time":{"at":"t.thu_on_line"},"para":43,"quote":"the incised wound upon Straker may have been caused by his own knife in the convulsive struggles which follow any brain injury","asserts":[{"of":"straker","attr":"action","value":"cut his own thigh with his knife in convulsions after the blow","modal":"possible","time":{"at":"t.crime"}}]}
{"id":"f.holmes_says_probable","of":"holmes","attr":"says","value":"it is more than possible, it is probable","to":"watson","time":{"at":"t.thu_on_line"},"para":44,"quote":"It is more than possible; it is probable","asserts":[{"of":"straker","attr":"action","value":"cut his own thigh with his knife in convulsions after the blow","modal":"possible","time":{"at":"t.crime"}}]}
{"id":"f.holmes_says_point_gone","of":"holmes","attr":"says","value":"in that case one of the main points in favour of the accused disappears","to":"watson","time":{"at":"t.thu_on_line"},"para":44,"quote":"In that case one of the main points in favour of the accused disappears."}
{"id":"f.watson_says_fail","of":"watson","attr":"says","value":"he still fails to understand what the police theory can be","to":"holmes","time":{"at":"t.thu_on_line"},"para":45,"quote":"even now I fail to understand what the theory of the police can be"}
{"id":"f.holmes_says_objections","of":"holmes","attr":"says","value":"whatever theory they state has very grave objections","to":"watson","time":{"at":"t.thu_on_line"},"para":46,"quote":"I am afraid that whatever theory we state has very grave objections to it"}
{"id":"f.holmes_says_police_theory","of":"holmes","attr":"says","value":"the police imagine that Simpson drugged the lad, used a duplicate key, took out the horse bridled, killed Straker with his stick when met, and then hid the horse or lost it","to":"watson","time":{"at":"t.thu_on_line"},"para":46,"quote":"The police imagine, I take it, that this Fitzroy Simpson, having drugged the lad"}
{"id":"f.police_theory","of":"police","attr":"believes","value":"Simpson drugged Hunter, opened the stable with a duplicate key, led off the bridled horse, beat Straker to death, and hid the horse or let it bolt","claim":"f.holmes_says_police_theory","time":{"at":"t.thu_on_line"},"para":46,"quote":"That is the case as it appears to the police","asserts":[{"of":"simpson","attr":"action","act":"drug","thing":"curried_mutton","value":"drugs the lad","time":{"at":"t.mon_hunter_for_dog"}},{"of":"simpson","attr":"carrying","value":"duplicate_key","time":{"at":"t.horse_leaves_stall"}},{"of":"simpson","attr":"action","act":"open","thing":"stable_door","value":"opens the stable door and leaves it open","time":{"at":"t.horse_leaves_stall"}},{"of":"simpson","attr":"action","act":"lead_out","thing":"silver_blaze","value":"bridles the horse and leads him away over the moor, meaning to kidnap him","time":{"at":"t.horse_leaves_stall"}},{"of":"simpson","attr":"action","act":"strike","thing":"straker","value":"beats out the trainer's brains with his heavy stick, unhurt by the knife","time":{"at":"t.crime"}},{"of":"silver_blaze","attr":"location","value":null,"detail":"led to a secret hiding-place, or bolted and wandering on the moors","modal":"possible","time":{"at":"t.thu_on_line"}}]}
{"id":"f.bridle_missing","of":"bridle","attr":"condition","value":"missing","time":{"from":"t.tue_at_stables"},"para":46,"quote":"His bridle is missing"}
{"id":"f.holmes_says_improbable","of":"holmes","attr":"says","value":"the police case is improbable, but all other explanations are more improbable still","to":"watson","time":{"at":"t.thu_on_line"},"para":46,"quote":"improbable as it is, all other explanations are more improbable still"}
{"id":"f.holmes_intends_test","of":"holmes","attr":"intends","value":"to test the matter quickly once on the spot","time":{"at":"t.thu_on_line"},"para":46,"quote":"I shall very quickly test the matter when I am once upon the spot"}
{"id":"f.reports_reach_press","of":"?","attr":"tells","value":["acct.baxter","acct.mrs_straker","acct.lads","acct.search"],"to":"newspapers","how":"report","time":{"after":"t.tue_hollow","before":"t.wed"},"para":12,"quote":"the embellishments of theorists and reporters"}
{"id":"f.police_reach_press","of":"gregory","attr":"tells","value":"acct.police","to":"newspapers","how":"report","time":{"after":"t.simpson_arrest","before":"t.thu_paddington"},"para":38,"quote":"I shall now recapitulate what the police have done in the matter."}
{"id":"f.watson_at_tavistock","of":"watson","attr":"location","value":"tavistock_station","time":{"at":"t.thu_tavistock"},"para":47,"quote":"It was evening before we reached the little town of Tavistock"}
{"id":"f.holmes_at_tavistock","of":"holmes","attr":"location","value":"tavistock_station","time":{"at":"t.thu_tavistock"},"para":47,"quote":"It was evening before we reached the little town of Tavistock"}
{"id":"f.clock_thu_evening","of":"clock","attr":"hour","value":"evening","time":{"at":"t.thu_tavistock"},"para":47,"quote":"It was evening before we reached"}
{"id":"f.tavistock_centre","of":"tavistock","attr":"position","value":"a little town in the middle of the huge circle of Dartmoor, like the boss of a shield","time":{"at":"t.thu_tavistock"},"para":47,"quote":"which lies, like the boss of a shield, in the middle of the huge circle of Dartmoor"}
{"id":"f.gregory_at_station","of":"gregory","attr":"location","value":"tavistock_station","detail":"awaiting them","time":{"at":"t.thu_tavistock"},"para":47,"quote":"Two gentlemen were awaiting us in the station"}
{"id":"f.ross_at_station","of":"ross","attr":"location","value":"tavistock_station","detail":"awaiting them","time":{"at":"t.thu_tavistock"},"para":47,"quote":"Two gentlemen were awaiting us in the station"}
{"id":"f.gregory_looks","of":"gregory","attr":"condition","value":"a tall, fair man with lion-like hair and beard and curiously penetrating light blue eyes","time":{"at":"t.thu_tavistock"},"para":47,"quote":"a tall, fair man with lion-like hair and beard and curiously penetrating light blue eyes"}
{"id":"f.ross_looks","of":"ross","attr":"condition","value":"a small, alert person, very neat and dapper, with trim little side-whiskers","time":{"at":"t.thu_tavistock"},"para":47,"quote":"a small, alert person, very neat and dapper"}
{"id":"f.ross_frock","of":"ross","attr":"wearing","value":"ross_frock_coat","time":{"at":"t.thu_tavistock"},"para":47,"quote":"in a frock-coat and gaiters"}
{"id":"f.ross_wears_gaiters","of":"ross","attr":"wearing","value":"ross_gaiters","time":{"at":"t.thu_tavistock"},"para":47,"quote":"in a frock-coat and gaiters"}
{"id":"f.ross_wears_eyeglass","of":"ross","attr":"wearing","value":"ross_eyeglass","time":{"at":"t.thu_tavistock"},"para":47,"quote":"and an eye-glass"}
{"id":"f.ross_sportsman","of":"ross","attr":"reputed","value":"the well-known sportsman","time":{"at":"t.thu_tavistock"},"para":47,"quote":"The latter was Colonel Ross, the well-known sportsman"}
{"id":"f.gregory_name_making","of":"gregory","attr":"reputed","value":"rapidly making his name in the English detective service","time":{"at":"t.thu_tavistock"},"para":47,"quote":"a man who was rapidly making his name in the English detective service"}
{"id":"f.gregory_member_service","of":"gregory","attr":"member_of","value":"detective_service","time":{"at":"t.thu_tavistock"},"para":47,"quote":"the English detective service"}
{"id":"f.ross_says_delighted","of":"ross","attr":"says","value":"he is delighted Holmes has come; the Inspector has done all that could be suggested","to":"holmes","time":{"at":"t.thu_tavistock"},"para":48,"quote":"The Inspector here has done all that could possibly be suggested","asserts":[{"of":"gregory","attr":"action","value":"has done all that could possibly be suggested"}]}
{"id":"f.ross_intends_avenge","of":"ross","attr":"intends","value":"to leave no stone unturned to avenge Straker and recover his horse","time":{"at":"t.thu_tavistock"},"para":48,"quote":"I wish to leave no stone unturned in trying to avenge poor Straker and in recovering my horse"}
{"id":"f.holmes_asks_developments","of":"holmes","attr":"action","act":"ask","value":"asks whether there have been any fresh developments","time":{"at":"t.thu_tavistock"},"para":49,"quote":"Have there been any fresh developments?"}
{"id":"f.gregory_says_little_progress","of":"gregory","attr":"says","value":"the police have made very little progress","to":"holmes","time":{"at":"t.thu_tavistock"},"para":50,"quote":"I am sorry to say that we have made very little progress"}
{"id":"f.landau_outside","of":"landau","attr":"location","value":"tavistock_station","detail":"an open carriage outside","time":{"at":"t.thu_tavistock"},"para":50,"quote":"We have an open carriage outside"}
{"id":"f.gregory_intends_drive","of":"gregory","attr":"intends","value":"to show them the place before the light fails and talk it over on the drive","time":{"at":"t.thu_tavistock"},"para":50,"quote":"we might talk it over as we drive"}
{"id":"f.watson_in_landau","of":"watson","attr":"location","value":"landau","time":{"from":"t.thu_landau"},"para":51,"quote":"A minute later we were all seated in a comfortable landau"}
{"id":"f.holmes_in_landau","of":"holmes","attr":"location","value":"landau","time":{"from":"t.thu_landau"},"para":51,"quote":"we were all seated in a comfortable landau"}
{"id":"f.gregory_in_landau","of":"gregory","attr":"location","value":"landau","time":{"from":"t.thu_landau"},"para":51,"quote":"we were all seated in a comfortable landau"}
{"id":"f.ross_in_landau","of":"ross","attr":"location","value":"landau","time":{"from":"t.thu_landau"},"para":51,"quote":"we were all seated in a comfortable landau"}
{"id":"f.landau_through_town","of":"landau","attr":"location","value":"tavistock","detail":"rattling through the old Devonshire city","time":{"at":"t.thu_landau"},"para":51,"quote":"were rattling through the quaint old Devonshire city"}
{"id":"f.gregory_pours_out","of":"gregory","attr":"action","value":"is full of his case and pours out a stream of remarks","time":{"at":"t.thu_landau"},"para":51,"quote":"Inspector Gregory was full of his case, and poured out a stream of remarks"}
{"id":"f.holmes_interjects","of":"holmes","attr":"action","value":"throws in an occasional question or interjection","time":{"at":"t.thu_landau"},"para":51,"quote":"while Holmes threw in an occasional question or interjection"}
{"id":"f.ross_leans_back","of":"ross","attr":"action","value":"leans back with his arms folded and his hat tilted over his eyes","time":{"at":"t.thu_landau"},"para":51,"quote":"Colonel Ross leaned back with his arms folded and his hat tilted over his eyes"}
{"id":"f.ross_hat_on","of":"ross","attr":"wearing","value":"ross_hat","detail":"tilted over his eyes","time":{"at":"t.thu_landau"},"para":51,"quote":"his hat tilted over his eyes"}
{"id":"f.watson_listens_drive","of":"watson","attr":"action","value":"listens with interest to the dialogue of the two detectives","time":{"at":"t.thu_landau"},"para":51,"quote":"I listened with interest to the dialogue of the two detectives"}
{"id":"f.gregory_theory_foretold","of":"watson","attr":"observes","value":"Gregory's theory is almost exactly what Holmes foretold in the train","time":{"at":"t.thu_landau"},"para":51,"quote":"Gregory was formulating his theory, which was almost exactly what Holmes had foretold in the train"}
{"id":"f.gregory_says_net","of":"gregory","attr":"says","value":"the net is drawn close round Fitzroy Simpson; he believes Simpson is the man","to":"holmes","time":{"at":"t.thu_landau"},"para":52,"quote":"The net is drawn pretty close round Fitzroy Simpson","asserts":[{"of":"simpson","attr":"action","act":"strike","thing":"straker","value":"kills Straker","time":{"at":"t.crime"}},{"of":"simpson","attr":"action","act":"lead_out","thing":"silver_blaze","value":"takes the horse from the stable","time":{"at":"t.horse_leaves_stall"}}]}
{"id":"f.gregory_believes_simpson","of":"gregory","attr":"believes","value":"Simpson is the man","time":{"at":"t.thu_landau"},"para":52,"quote":"I believe myself that he is our man"}
{"id":"f.gregory_says_circumstantial","of":"gregory","attr":"says","value":"the evidence is purely circumstantial and some new development may upset it","to":"holmes","time":{"at":"t.thu_landau"},"para":52,"quote":"I recognise that the evidence is purely circumstantial"}
{"id":"f.holmes_asks_knife","of":"holmes","attr":"action","act":"ask","thing":"straker_knife","value":"asks about Straker's knife","time":{"at":"t.thu_landau"},"para":53,"quote":"How about Straker’s knife?"}
{"id":"f.gregory_says_self_wound","of":"gregory","attr":"says","value":"the police have concluded Straker wounded himself in his fall","to":"holmes","time":{"at":"t.thu_landau"},"para":54,"quote":"We have quite come to the conclusion that he wounded himself in his fall.","asserts":[{"of":"straker","attr":"action","value":"wounds his own thigh with his knife in his fall","time":{"at":"t.crime"}}]}
{"id":"f.police_believe_self_wound","of":"police","attr":"believes","value":"Straker wounded himself with his own knife in his fall","claim":"f.gregory_says_self_wound","time":{"at":"t.thu_landau"},"para":54,"quote":"We have quite come to the conclusion"}
{"id":"f.holmes_says_watson_suggested","of":"holmes","attr":"says","value":"Watson made the same suggestion on the way down; if so it tells against Simpson","to":"gregory","time":{"at":"t.thu_landau"},"para":55,"quote":"My friend Dr. Watson made that suggestion to me as we came down."}
{"id":"f.gregory_says_no_knife","of":"gregory","attr":"says","value":"Simpson has neither a knife nor any sign of a wound","to":"holmes","time":{"at":"t.thu_landau"},"para":56,"quote":"He has neither a knife nor any sign of a wound."}
{"id":"f.simpson_no_knife","of":"simpson","attr":"carrying","value":"a knife","neg":true,"time":{"at":"t.simpson_arrest"},"para":56,"quote":"He has neither a knife"}
{"id":"f.gregory_says_evidence","of":"gregory","attr":"says","value":"the evidence is very strong: motive, suspicion of poisoning the lad, out in the storm, armed with a heavy stick, his cravat in the dead man's hand; enough for a jury","to":"holmes","time":{"at":"t.thu_landau"},"para":56,"quote":"I really think we have enough to go before a jury.","asserts":[{"of":"simpson","attr":"condition","value":"had a great interest in the disappearance of the favourite"},{"of":"simpson","attr":"action","act":"drug","thing":"curried_mutton","value":"poisons the stable-boy","modal":"possible","time":{"at":"t.mon_hunter_for_dog"}},{"of":"simpson","attr":"carrying","value":"simpson_stick","time":{"at":"t.crime"}}]}
{"id":"f.holmes_shakes_head","of":"holmes","attr":"action","value":"shakes his head","time":{"at":"t.thu_landau"},"para":57,"quote":"Holmes shook his head."}
{"id":"f.holmes_says_counsel","of":"holmes","attr":"says","value":"a clever counsel would tear the case to rags","to":"gregory","time":{"at":"t.thu_landau"},"para":57,"quote":"A clever counsel would tear it all to rags"}
{"id":"f.holmes_asks_why_out","of":"holmes","attr":"action","act":"ask","value":"asks why Simpson would take the horse out of the stable instead of injuring it there","time":{"at":"t.thu_landau"},"para":57,"quote":"Why should he take the horse out of the stable? If he wished to injure it why could he not do it there?"}
{"id":"f.holmes_asks_key","of":"holmes","attr":"action","act":"ask","thing":"duplicate_key","value":"asks whether a duplicate key has been found on Simpson","time":{"at":"t.thu_landau"},"para":57,"quote":"Has a duplicate key been found in his possession?"}
{"id":"f.holmes_asks_chemist","of":"holmes","attr":"action","act":"ask","thing":"opium","value":"asks what chemist sold Simpson the powdered opium","time":{"at":"t.thu_landau"},"para":57,"quote":"What chemist sold him the powdered opium?"}
{"id":"f.holmes_asks_hide","of":"holmes","attr":"action","act":"ask","value":"asks where Simpson, a stranger to the district, could hide such a horse","time":{"at":"t.thu_landau"},"para":57,"quote":"where could he, a stranger to the district, hide a horse, and such a horse as this?"}
{"id":"f.holmes_asks_paper","of":"holmes","attr":"action","act":"ask","thing":"paper_packet","value":"asks Simpson's explanation of the paper he wished the maid to give the stable-boy","time":{"at":"t.thu_landau"},"para":57,"quote":"What is his own explanation as to the paper which he wished the maid to give to the stable-boy?"}
{"id":"f.simpson_says_note","of":"simpson","attr":"says","value":"the paper was a ten-pound note","to":"gregory","time":{"after":"t.simpson_arrest","before":"t.thu_landau"},"para":58,"quote":"He says that it was a ten-pound note.","asserts":[{"of":"paper_packet","attr":"identity","value":"ten_pound_note"}]}
{"id":"f.note_in_purse","of":"ten_pound_note","attr":"location","value":"simpson_purse","time":{"at":"t.note_found"},"para":58,"quote":"One was found in his purse."}
{"id":"f.purse_owner","of":"simpson_purse","attr":"owner","value":"simpson","basis":"implied","time":{"at":"t.note_found"},"para":58,"quote":"his purse"}
{"id":"f.gregory_says_not_formidable","of":"gregory","attr":"says","value":"Holmes's other difficulties are not so formidable; Simpson is no stranger to the district","to":"holmes","time":{"at":"t.thu_landau"},"para":58,"quote":"But your other difficulties are not so formidable as they seem. He is not a stranger to the district."}
{"id":"f.simpson_lodged","of":"simpson","attr":"lives_at","value":"tavistock","detail":"lodged there twice in the summer","time":{"at":"t.simpson_lodged"},"para":58,"quote":"He has twice lodged at Tavistock in the summer."}
{"id":"f.gregory_says_opium_london","of":"gregory","attr":"says","value":"the opium was probably brought from London","to":"holmes","time":{"at":"t.thu_landau"},"para":58,"quote":"The opium was probably brought from London.","asserts":[{"of":"opium","attr":"location","value":"london","modal":"possible","time":{"at":"t.opium_bought"}}]}
{"id":"f.gregory_says_key_thrown","of":"gregory","attr":"says","value":"the key, having served its purpose, would be hurled away","to":"holmes","time":{"at":"t.thu_landau"},"para":58,"quote":"The key, having served its purpose, would be hurled away.","asserts":[{"of":"simpson","attr":"action","thing":"duplicate_key","value":"throws the duplicate key away","modal":"possible","time":{"at":"t.key_thrown"}}]}
{"id":"f.gregory_says_pits","of":"gregory","attr":"says","value":"the horse may be at the bottom of one of the pits or old mines on the moor","to":"holmes","time":{"at":"t.thu_landau"},"para":58,"quote":"The horse may be at the bottom of one of the pits or old mines upon the moor.","asserts":[{"of":"silver_blaze","attr":"location","value":"moor_pits","modal":"possible","time":{"at":"t.thu_landau"}}]}
{"id":"f.holmes_asks_cravat","of":"holmes","attr":"action","act":"ask","thing":"cravat","value":"asks what Simpson says about the cravat","time":{"at":"t.thu_landau"},"para":59,"quote":"What does he say about the cravat?"}
{"id":"f.simpson_owns_cravat_says","of":"simpson","attr":"says","value":"the cravat is his","to":"gregory","time":{"after":"t.simpson_arrest","before":"t.thu_landau"},"para":60,"quote":"He acknowledges that it is his","asserts":[{"of":"cravat","attr":"owner","value":"simpson"}]}
{"id":"f.simpson_says_lost","of":"simpson","attr":"says","value":"he had lost the cravat","to":"gregory","time":{"after":"t.simpson_arrest","before":"t.thu_landau"},"para":60,"quote":"declares that he had lost it","asserts":[{"of":"simpson","attr":"carrying","value":"cravat","neg":true,"time":{"from":"t.cravat_lost"}}]}
{"id":"f.gregory_says_new_element","of":"gregory","attr":"says","value":"a new element may account for Simpson leading the horse from the stable","to":"holmes","time":{"at":"t.thu_landau"},"para":60,"quote":"But a new element has been introduced into the case which may account for his leading the horse from the stable."}
{"id":"f.holmes_pricks_ears","of":"holmes","attr":"action","value":"pricks up his ears","time":{"at":"t.thu_landau"},"para":61,"quote":"Holmes pricked up his ears."}
{"id":"f.police_find_traces","of":"police","attr":"action","value":"find traces of a gypsy encampment","time":{"at":"t.traces_found"},"para":62,"quote":"We have found traces which show that a party of gypsies encamped"}
{"id":"f.gypsies_at_camp","of":"gypsy_party","attr":"location","value":"gypsy_camp","time":{"at":"t.gypsies_camp"},"para":62,"quote":"a party of gypsies encamped on Monday night within a mile of the spot where the murder took place"}
{"id":"f.camp_distance","of":"gypsy_camp","attr":"position","value":"within a mile of the spot where the murder took place","time":{"at":"t.gypsies_camp"},"para":62,"quote":"within a mile of the spot where the murder took place"}
{"id":"f.cal_gypsies_mon","of":"calendar","attr":"weekday","value":"Monday","time":{"at":"t.gypsies_camp"},"para":62,"quote":"on Monday night"}
{"id":"f.gypsies_left","of":"gypsy_party","attr":"location","value":"gypsy_camp","neg":true,"detail":"gone","time":{"at":"t.gypsies_gone"},"para":62,"quote":"On Tuesday they were gone."}
{"id":"f.cal_gypsies_tue","of":"calendar","attr":"weekday","value":"Tuesday","time":{"at":"t.gypsies_gone"},"para":62,"quote":"On Tuesday they were gone."}
{"id":"f.gregory_says_gypsy_theory","of":"gregory","attr":"says","value":"if Simpson had an understanding with the gypsies, he may have been leading the horse to them when overtaken, and they may have him now","to":"holmes","time":{"at":"t.thu_landau"},"para":62,"quote":"might he not have been leading the horse to them when he was overtaken, and may they not have him now?","asserts":[{"of":"simpson","attr":"intends","value":"to deliver the horse to the gypsies","modal":"possible","time":{"at":"t.crime"}},{"of":"silver_blaze","attr":"location","value":null,"detail":"with the gypsies","modal":"possible","time":{"at":"t.thu_landau"}}]}
{"id":"f.holmes_says_possible","of":"holmes","attr":"says","value":"it is certainly possible","to":"gregory","time":{"at":"t.thu_landau"},"para":63,"quote":"It is certainly possible."}
{"id":"f.moor_scoured","of":"police","attr":"action","value":"scour the moor for the gypsies","time":{"at":"t.thu_landau"},"para":64,"quote":"The moor is being scoured for these gypsies."}
{"id":"f.gregory_examines_outhouses","of":"gregory","attr":"action","value":"examines every stable and out-house in Tavistock and for a radius of ten miles","time":{"at":"t.gregory_searches"},"para":64,"quote":"I have also examined every stable and out-house in Tavistock, and for a radius of ten miles."}
{"id":"f.horse_not_in_outhouses","of":"silver_blaze","attr":"location","value":"tavistock_outhouses","neg":true,"basis":"implied","time":{"at":"t.gregory_searches"},"para":64,"quote":"I have also examined every stable and out-house in Tavistock"}
{"id":"f.holmes_asks_other_stable","of":"holmes","attr":"action","act":"ask","thing":"mapleton","value":"asks about the other training-stable close by","time":{"at":"t.thu_landau"},"para":65,"quote":"There is another training-stable quite close, I understand?"}
{"id":"f.gregory_says_mapleton_interest","of":"gregory","attr":"says","value":"Mapleton is a factor not to be neglected: with Desborough second in the betting, they had an interest in the favourite's disappearance","to":"holmes","time":{"at":"t.thu_landau"},"para":66,"quote":"As Desborough, their horse, was second in the betting, they had an interest in the disappearance of the favourite.","asserts":[{"of":"mapleton","attr":"condition","value":"had an interest in the disappearance of the favourite"}]}
{"id":"f.desborough_second_betting","of":"desborough","attr":"condition","value":"second in the betting","time":{"at":"t.crime"},"para":66,"quote":"As Desborough, their horse, was second in the betting"}
{"id":"f.brown_trainer","of":"silas_brown","attr":"role","value":"trainer at Mapleton","time":{"at":"t.crime"},"para":66,"quote":"Silas Brown, the trainer"}
{"id":"f.brown_bets","of":"silas_brown","attr":"action","value":"places large bets on the Wessex Cup","time":{"at":"t.brown_bets"},"para":66,"quote":"is known to have had large bets upon the event"}
{"id":"f.brown_no_friend","of":"silas_brown","attr":"condition","value":"no friend to Straker","time":{"after":"t.before","before":"t.crime"},"para":66,"quote":"he was no friend to poor Straker"}
{"id":"f.police_examine_mapleton","of":"police","attr":"action","value":"examine the Mapleton stables","time":{"at":"t.mapleton_examined"},"para":66,"quote":"We have, however, examined the stables"}
{"id":"f.gregory_says_nothing_brown","of":"gregory","attr":"says","value":"there is nothing to connect Silas Brown with the affair","to":"holmes","time":{"at":"t.thu_landau"},"para":66,"quote":"there is nothing to connect him with the affair","asserts":[{"of":"silas_brown","attr":"condition","value":"connected with the affair","neg":true}]}
{"id":"f.holmes_asks_simpson_mapleton","of":"holmes","attr":"action","act":"ask","value":"asks whether anything connects Simpson with the interests of the Mapleton stables","time":{"at":"t.thu_landau"},"para":67,"quote":"And nothing to connect this man Simpson with the interests of the Mapleton stables?"}
{"id":"f.gregory_says_no_link","of":"gregory","attr":"says","value":"nothing at all connects Simpson with Mapleton","to":"holmes","time":{"at":"t.thu_landau"},"para":68,"quote":"Nothing at all.","asserts":[{"of":"simpson","attr":"condition","value":"connected with the interests of the Mapleton stables","neg":true}]}
{"id":"f.gregory_tells_holmes","of":"gregory","attr":"tells","value":"acct.gregory","to":"holmes","how":"told","time":{"at":"t.thu_landau"},"para":51,"quote":"Inspector Gregory was full of his case, and poured out a stream of remarks"}
{"id":"f.gregory_tells_watson","of":"gregory","attr":"tells","value":"acct.gregory","to":"watson","how":"told","time":{"at":"t.thu_landau"},"para":51,"quote":"I listened with interest to the dialogue of the two detectives"}

## The reader's notes on this scene (the annotated reading)

{"id":"t69.1","para":69,"tag":"RECORD","profile":"typical","from":["t19.3"],"reads":"by a cluster of houses away to the westward which marked the Mapleton stables","text":"From Straker's villa, the stable out-building lies across a paddock and Mapleton can be seen on the skyline. The rival stable is in plain view across open moor."}
{"id":"t70.1","para":70,"tag":"GENRE","subtype":"watch-detective","confidence":"fair","profile":"typical","from":["bk.genre_detective_signals","t68.2"],"reads":"his hand was upon a clue, though I could not imagine where he had found it","text":"Holmes has his clue during the drive, before he has seen any physical evidence. So it comes from facts already told: Holmes's summary or Gregory's talk in the carriage. The reader has the same material and should re-read it."}
{"id":"t70.2","para":70,"tag":"GENRE","subtype":"re-read","confidence":"weak","profile":"careful","from":["t70.1","t68.2"],"text":"Which fact set him off? The last topics were the gypsies, the stable searches, Mapleton, and the lack of any link to Simpson. Earlier ones were the curry and the opium, the dog, and the locked door. Nothing yet tells which.","options":["Something in Gregory's conversation (gypsies, Mapleton, the searches)","A point from the original facts (curry, opium, dog, door)","The view of the moor and Mapleton itself"]}
{"id":"t74.1","para":74,"tag":"GENRE","subtype":"watch-detective","confidence":"weak","profile":"careful","from":["t19.1","t46.4"],"reads":"He has been in your service some years, Colonel Ross?","text":"Holmes's first questions at the house are about Straker himself: his body and his record of service. He is not asking about Simpson. The victim's character seems to be in question."}
{"id":"t75.1","para":75,"tag":"WEIGH","confidence":"weak","profile":"careful","from":["t74.1","t19.1"],"reads":"I have always found him an excellent servant.","text":"Ross can only vouch for what he saw at work. It is the same testimony as ¶19 and adds nothing about Straker's private life."}
{"id":"t78.1","para":78,"tag":"RECORD","profile":"typical","from":[],"reads":"There was a box of vestas, two inches of tallow candle","text":"Straker's pockets: matches, a candle stub, pipe and tobacco, watch, five sovereigns, a pencil-case, some papers, and an ivory-handled knife by Weiss & Co., London."}
{"id":"t78.2","para":78,"tag":"NOTICE","confidence":"weak","profile":"careful","from":["t78.1","t32.1","bk.light_outdoors"],"reads":"two inches of tallow candle","text":"A candle and matches, on a rainy night walk to a stable where the lad on duty would have a light. Did he expect to need a small light somewhere else, out on the moor? It may only be habit: he also carries a pipe, and the matches would serve that.","options":["He meant to need a light out of doors","Ordinary pocket contents of a pipe-smoker"]}
{"id":"t80.1","para":80,"tag":"RECORD","profile":"typical","from":["t35.4","bk.cataract_knife"],"reads":"It is what we call a cataract knife","text":"The bloodied knife from Straker's hand is a surgeon's cataract knife."}
{"id":"t81.1","para":81,"tag":"REVISE","confidence":"fair","profile":"careful","from":["t35.5","t80.1","bk.cataract_knife"],"reads":"A strange thing for a man to carry with him upon a rough expedition, especially as it would not shut in his pocket","relations":[{"type":"revises","target":"t35.5"}],"text":"The 'small knife' is a delicate surgical blade that cannot be folded. It is useless as a weapon and awkward to carry. Why would a trainer own it, and why take it out at one in the morning?"}
{"id":"t82.1","para":82,"tag":"HYPOTHESIS","confidence":"weak","profile":"typical","from":["t81.1"],"reads":"It was a poor weapon, but perhaps the best that he could lay his hands on at the moment.","text":"Gregory's and Mrs Straker's account: uneasy about touts, Straker grabbed the nearest blade from the dressing-table to defend himself.","options":["A hasty choice of weapon","He took it for some purpose he had in mind"]}
{"id":"t82.2","para":82,"tag":"WEIGH","confidence":"fair","profile":"careful","from":["t82.1","t81.1"],"reads":"The tip was guarded by a disk of cork which we found beside his body","relations":[{"type":"strains","target":"t82.1"}],"text":"A man snatching up a weapon in a hurry does not fit a cork over its tip. And a man in a sudden fight does not stop to take the cork off. The cork lying by the body suggests he had uncovered the blade on purpose, with time to spare. That fits use for a task better than self-defence. The dressing-table detail comes from the wife, who reports what she saw, not why he took it."}
{"id":"t82.3","para":82,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"careful","from":["t81.1","t82.2","t78.2","t35.2","t57.1","t46.4"],"text":"Put these together: a blade for a fine cut, a candle for a small light, the coat taken off, and the horse led out to a hollow rather than harmed in its stall. Was Straker meaning to do some delicate cutting to the horse himself, out of sight of the stable? It is only a pattern, and it is far from proved.","options":["Straker meant to injure the horse in some subtle way","Straker carried the knife for defence after all","The knife belongs to some other part of his private life"],"relations":[{"type":"supports","target":"t46.4"}],"hindsight":"A first-time reader must join four details spread across the story: the coat, the candle, the cork, and Holmes's question of why the horse was taken out. They must then imagine the trainer as the one who meant to harm the horse, against everything said of his character."}
{"id":"t84.1","para":84,"tag":"RECORD","profile":"typical","from":[],"reads":"a milliner’s account for thirty-seven pounds fifteen made out by Madame Lesurier, of Bond Street, to William Derbyshire","text":"In Straker's pocket is a Bond Street milliner's bill for £37 15s, made out to a William Derbyshire."}
{"id":"t84.2","para":84,"tag":"WEIGH","confidence":"fair","profile":"careful","from":["t84.1","bk.alias_mail"],"reads":"Derbyshire was a friend of her husband’s and that occasionally his letters were addressed here","text":"This is Mrs Straker's explanation, and it is what her husband told her. Letters for a 'friend' coming to Straker's own house, and a bill for that friend in Straker's own pocket, raise the question of whether 'William Derbyshire' is Straker himself.","options":["Derbyshire is a real friend","Derbyshire is Straker under another name"]}
{"id":"t85.1","para":85,"tag":"NOTICE","subtype":"calculate","confidence":"fair","profile":"careful","from":["t84.1","t19.3"],"reads":"Twenty-two guineas is rather heavy for a single costume.","text":"One dress at 22 guineas (£23 2s) makes up most of a £37 bill. That is a huge sum next to a trainer's wages. Straker is described as 'comfortably off' (¶19), yet these clothes belong to a much richer world."}
{"id":"t85.2","para":85,"tag":"GENRE","subtype":"watch-detective","confidence":"fair","profile":"careful","from":["t85.1","bk.genre_detective_signals"],"reads":"However there appears to be nothing more to learn","text":"Holmes reads the bill closely, item by item, then says there is 'nothing more to learn'. He also says 'Madam Derbyshire', supposing a woman behind the name. The offhand dismissal is itself a signal."}
{"id":"t87.1","para":87,"tag":"SET ASIDE","profile":"typical","from":[],"reads":"Have you got them? Have you found them?","text":"Mrs Straker's grief and her 'them' (the killers, or the horse as well) reflect the general belief in several attackers. It is no evidence of who they were."}
{"id":"t89.1","para":89,"tag":"GENRE","subtype":"watch-detective","confidence":"fair","profile":"careful","from":["t85.2","bk.detective_feint"],"reads":"Surely I met you in Plymouth at a garden-party some little time ago, Mrs. Straker?","text":"Holmes has just come down from London. A claimed meeting at a Plymouth garden-party, straight after he studied a dress bill, looks like a feint rather than a real memory."}
{"id":"t91.1","para":91,"tag":"INFER","confidence":"fair","profile":"careful","from":["t89.1","t84.1"],"reads":"You wore a costume of dove-coloured silk with ostrich-feather trimming.","text":"He describes an expensive costume, very likely the one on the bill. The question is really: does Mrs Straker own the dresses Straker was paying for?"}
{"id":"t92.1","para":92,"tag":"TEST","confidence":"fair","profile":"careful","from":["t91.1","t84.2","bk.second_household"],"reads":"I never had such a dress, sir","relations":[{"type":"strains","target":"t84.2"}],"text":"She has never had such a dress. So the costly clothes on the bill in her husband's pocket went to some other woman. This is a test of whether she owns them, not proof of the alias, but the innocent 'friend' story is now harder to keep. Possible reading: Straker, as 'William Derbyshire', was paying for a second woman and needed more money than his wages.","options":["The friend is real and Straker only carried the bill","Straker kept a woman under the name Derbyshire","Mrs Straker is lying about the dress"]}
{"id":"t92.2","para":92,"tag":"IDENTIFY","subtype":"merge","confidence":"weak","profile":"careful","from":["t92.1","t84.2","bk.alias_mail"],"text":"Working identification: William Derbyshire = John Straker. Holmes's questions seem to point this way, but no handwriting, address or witness has yet confirmed it.","hindsight":"A first-time reader must link the bill, the 'friend' whose letters come to the house, and Holmes's garden-party feint. They must take the feint as a test rather than a social slip."}
{"id":"t92.3","para":92,"tag":"HYPOTHESIS","subtype":"motive","confidence":"weak","profile":"careful","from":["t92.1","t92.2","bk.favourite_motive","t82.3"],"relations":[{"type":"supports","target":"t46.4"}],"text":"If Straker led a costly double life, he had a reason to want money from the race. He could get it by betting against his own favourite and making sure it lost. That would supply the missing motive for picture (c) in t68.3. The case against Simpson does not require any of this."}
{"id":"t92.4","para":92,"tag":"RESIDUE","confidence":"fair","profile":"careful","from":["t70.2","t82.3","t92.3","t68.2","t66.2","t34.2","t6.1","t60.2"],"text":"Open at the end of the scene: what clue struck Holmes in the carriage. Why Straker carried a cork-guarded cataract knife and a candle, and took the cork off. Whether Derbyshire is Straker and who wears the dresses. If Straker was working against the horse, who killed him and where the horse is now. Still carried over: the cravat in his hand, the curry and the opium, the dog's silence, the locked door, Mapleton, and the field-glass."}
{"id":"t92.5","para":92,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"careful","from":["t68.3","t82.3","t92.3","t62.2","t66.1"],"text":"Standing pictures after the house: (a) the police's, Simpson alone or with the gypsies. It is now further strained because the knife looks like a tool rather than a weapon. (b) Mapleton and Silas Brown, with the motive but nothing to tie them to the night. (c) Straker, in debt through a second household, took the horse out himself to injure it quietly, and met his death in the hollow. (c) has gained the most in this scene, but it does not yet say who struck the blow.","options":["Simpson, with or without gypsies","Mapleton and Silas Brown","Straker's own scheme, with the killer unknown"]}

## The story so far (this scene is ¶69–¶92)

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

¶17 I lay back against the cushions, puffing at my cigar, while Holmes, leaning forward, with his long, thin forefinger checking off the points upon the palm of his left hand, gave me a sketch of the events which had led to our journey.

¶18 “Silver Blaze,” said he, “is from the Isonomy stock, and holds as brilliant a record as his famous ancestor. He is now in his fifth year, and has brought in turn each of the prizes of the turf to Colonel Ross, his fortunate owner. Up to the time of the catastrophe he was the first favourite for the Wessex Cup, the betting being three to one on him. He has always, however, been a prime favourite with the racing public, and has never yet disappointed them, so that even at those odds enormous sums of money have been laid upon him. It is obvious, therefore, that there were many people who had the strongest interest in preventing Silver Blaze from being there at the fall of the flag next Tuesday.

¶19 “The fact was, of course, appreciated at King’s Pyland, where the Colonel’s training-stable is situated. Every precaution was taken to guard the favourite. The trainer, John Straker, is a retired jockey who rode in Colonel Ross’s colours before he became too heavy for the weighing-chair. He has served the Colonel for five years as jockey and for seven as trainer, and has always shown himself to be a zealous and honest servant. Under him were three lads; for the establishment was a small one, containing only four horses in all. One of these lads sat up each night in the stable, while the others slept in the loft. All three bore excellent characters. John Straker, who is a married man, lived in a small villa about two hundred yards from the stables. He has no children, keeps one maid-servant, and is comfortably off. The country round is very lonely, but about half a mile to the north there is a small cluster of villas which have been built by a Tavistock contractor for the use of invalids and others who may wish to enjoy the pure Dartmoor air. Tavistock itself lies two miles to the west, while across the moor, also about two miles distant, is the larger training establishment of Mapleton, which belongs to Lord Backwater, and is managed by Silas Brown. In every other direction the moor is a complete wilderness, inhabited only by a few roaming gypsies. Such was the general situation last Monday night when the catastrophe occurred.

¶20 “On that evening the horses had been exercised and watered as usual, and the stables were locked up at nine o’clock. Two of the lads walked up to the trainer’s house, where they had supper in the kitchen, while the third, Ned Hunter, remained on guard. At a few minutes after nine the maid, Edith Baxter, carried down to the stables his supper, which consisted of a dish of curried mutton. She took no liquid, as there was a water-tap in the stables, and it was the rule that the lad on duty should drink nothing else. The maid carried a lantern with her, as it was very dark and the path ran across the open moor.

¶21 “Edith Baxter was within thirty yards of the stables, when a man appeared out of the darkness and called to her to stop. As he stepped into the circle of yellow light thrown by the lantern she saw that he was a person of gentlemanly bearing, dressed in a grey suit of tweeds, with a cloth cap. He wore gaiters, and carried a heavy stick with a knob to it. She was most impressed, however, by the extreme pallor of his face and by the nervousness of his manner. His age, she thought, would be rather over thirty than under it.

¶22 “‘Can you tell me where I am?’ he asked. ‘I had almost made up my mind to sleep on the moor, when I saw the light of your lantern.’

¶23 “‘You are close to the King’s Pyland training-stables,’ said she.

¶24 “‘Oh, indeed! What a stroke of luck!’ he cried. ‘I understand that a stable-boy sleeps there alone every night. Perhaps that is his supper which you are carrying to him. Now I am sure that you would not be too proud to earn the price of a new dress, would you?’ He took a piece of white paper folded up out of his waistcoat pocket. ‘See that the boy has this to-night, and you shall have the prettiest frock that money can buy.’

¶25 “She was frightened by the earnestness of his manner, and ran past him to the window through which she was accustomed to hand the meals. It was already opened, and Hunter was seated at the small table inside. She had begun to tell him of what had happened, when the stranger came up again.

¶26 “‘Good-evening,’ said he, looking through the window. ‘I wanted to have a word with you.’ The girl has sworn that as he spoke she noticed the corner of the little paper packet protruding from his closed hand.

¶27 “‘What business have you here?’ asked the lad.

¶28 “‘It’s business that may put something into your pocket,’ said the other. ‘You’ve two horses in for the Wessex Cup—Silver Blaze and Bayard. Let me have the straight tip and you won’t be a loser. Is it a fact that at the weights Bayard could give the other a hundred yards in five furlongs, and that the stable have put their money on him?’

¶29 “‘So, you’re one of those damned touts!’ cried the lad. ‘I’ll show you how we serve them in King’s Pyland.’ He sprang up and rushed across the stable to unloose the dog. The girl fled away to the house, but as she ran she looked back and saw that the stranger was leaning through the window. A minute later, however, when Hunter rushed out with the hound he was gone, and though he ran all round the buildings he failed to find any trace of him.”

¶30 “One moment,” I asked. “Did the stable-boy, when he ran out with the dog, leave the door unlocked behind him?”

¶31 “Excellent, Watson, excellent!” murmured my companion. “The importance of the point struck me so forcibly that I sent a special wire to Dartmoor yesterday to clear the matter up. The boy locked the door before he left it. The window, I may add, was not large enough for a man to get through.

¶32 “Hunter waited until his fellow-grooms had returned, when he sent a message to the trainer and told him what had occurred. Straker was excited at hearing the account, although he does not seem to have quite realized its true significance. It left him, however, vaguely uneasy, and Mrs. Straker, waking at one in the morning, found that he was dressing. In reply to her inquiries, he said that he could not sleep on account of his anxiety about the horses, and that he intended to walk down to the stables to see that all was well. She begged him to remain at home, as she could hear the rain pattering against the window, but in spite of her entreaties he pulled on his large mackintosh and left the house.

¶33 “Mrs. Straker awoke at seven in the morning, to find that her husband had not yet returned. She dressed herself hastily, called the maid, and set off for the stables. The door was open; inside, huddled together upon a chair, Hunter was sunk in a state of absolute stupor, the favourite’s stall was empty, and there were no signs of his trainer.

¶34 “The two lads who slept in the chaff-cutting loft above the harness-room were quickly aroused. They had heard nothing during the night, for they are both sound sleepers. Hunter was obviously under the influence of some powerful drug, and as no sense could be got out of him, he was left to sleep it off while the two lads and the two women ran out in search of the absentees. They still had hopes that the trainer had for some reason taken out the horse for early exercise, but on ascending the knoll near the house, from which all the neighbouring moors were visible, they not only could see no signs of the missing favourite, but they perceived something which warned them that they were in the presence of a tragedy.

¶35 “About a quarter of a mile from the stables John Straker’s overcoat was flapping from a furze-bush. Immediately beyond there was a bowl-shaped depression in the moor, and at the bottom of this was found the dead body of the unfortunate trainer. His head had been shattered by a savage blow from some heavy weapon, and he was wounded on the thigh, where there was a long, clean cut, inflicted evidently by some very sharp instrument. It was clear, however, that Straker had defended himself vigorously against his assailants, for in his right hand he held a small knife, which was clotted with blood up to the handle, while in his left he clasped a red and black silk cravat, which was recognised by the maid as having been worn on the preceding evening by the stranger who had visited the stables.

¶36 “Hunter, on recovering from his stupor, was also quite positive as to the ownership of the cravat. He was equally certain that the same stranger had, while standing at the window, drugged his curried mutton, and so deprived the stables of their watchman.

¶37 “As to the missing horse, there were abundant proofs in the mud which lay at the bottom of the fatal hollow that he had been there at the time of the struggle. But from that morning he has disappeared, and although a large reward has been offered, and all the gypsies of Dartmoor are on the alert, no news has come of him. Finally, an analysis has shown that the remains of his supper left by the stable-lad contain an appreciable quantity of powdered opium, while the people at the house partook of the same dish on the same night without any ill effect.

¶38 “Those are the main facts of the case, stripped of all surmise, and stated as baldly as possible. I shall now recapitulate what the police have done in the matter.

¶39 “Inspector Gregory, to whom the case has been committed, is an extremely competent officer. Were he but gifted with imagination he might rise to great heights in his profession. On his arrival he promptly found and arrested the man upon whom suspicion naturally rested. There was little difficulty in finding him, for he inhabited one of those villas which I have mentioned. His name, it appears, was Fitzroy Simpson. He was a man of excellent birth and education, who had squandered a fortune upon the turf, and who lived now by doing a little quiet and genteel book-making in the sporting clubs of London. An examination of his betting-book shows that bets to the amount of five thousand pounds had been registered by him against the favourite.

¶40 “On being arrested he volunteered the statement that he had come down to Dartmoor in the hope of getting some information about the King’s Pyland horses, and also about Desborough, the second favourite, which was in charge of Silas Brown at the Mapleton stables. He did not attempt to deny that he had acted as described upon the evening before, but declared that he had no sinister designs, and had simply wished to obtain first-hand information. When confronted with his cravat, he turned very pale, and was utterly unable to account for its presence in the hand of the murdered man. His wet clothing showed that he had been out in the storm of the night before, and his stick, which was a Penang-lawyer weighted with lead, was just such a weapon as might, by repeated blows, have inflicted the terrible injuries to which the trainer had succumbed.

¶41 “On the other hand, there was no wound upon his person, while the state of Straker’s knife would show that one at least of his assailants must bear his mark upon him. There you have it all in a nutshell, Watson, and if you can give me any light I shall be infinitely obliged to you.”

¶42 I had listened with the greatest interest to the statement which Holmes, with characteristic clearness, had laid before me. Though most of the facts were familiar to me, I had not sufficiently appreciated their relative importance, nor their connection to each other.

¶43 “Is it not possible,” I suggested, “that the incised wound upon Straker may have been caused by his own knife in the convulsive struggles which follow any brain injury?”

¶44 “It is more than possible; it is probable,” said Holmes. “In that case one of the main points in favour of the accused disappears.”

¶45 “And yet,” said I, “even now I fail to understand what the theory of the police can be.”

¶46 “I am afraid that whatever theory we state has very grave objections to it,” returned my companion. “The police imagine, I take it, that this Fitzroy Simpson, having drugged the lad, and having in some way obtained a duplicate key, opened the stable door and took out the horse, with the intention, apparently, of kidnapping him altogether. His bridle is missing, so that Simpson must have put this on. Then, having left the door open behind him, he was leading the horse away over the moor, when he was either met or overtaken by the trainer. A row naturally ensued. Simpson beat out the trainer’s brains with his heavy stick without receiving any injury from the small knife which Straker used in self-defence, and then the thief either led the horse on to some secret hiding-place, or else it may have bolted during the struggle, and be now wandering out on the moors. That is the case as it appears to the police, and improbable as it is, all other explanations are more improbable still. However, I shall very quickly test the matter when I am once upon the spot, and until then I cannot really see how we can get much further than our present position.”

¶47 It was evening before we reached the little town of Tavistock, which lies, like the boss of a shield, in the middle of the huge circle of Dartmoor. Two gentlemen were awaiting us in the station—the one a tall, fair man with lion-like hair and beard and curiously penetrating light blue eyes; the other a small, alert person, very neat and dapper, in a frock-coat and gaiters, with trim little side-whiskers and an eye-glass. The latter was Colonel Ross, the well-known sportsman; the other, Inspector Gregory, a man who was rapidly making his name in the English detective service.

¶48 “I am delighted that you have come down, Mr. Holmes,” said the Colonel. “The Inspector here has done all that could possibly be suggested, but I wish to leave no stone unturned in trying to avenge poor Straker and in recovering my horse.”

¶49 “Have there been any fresh developments?” asked Holmes.

¶50 “I am sorry to say that we have made very little progress,” said the Inspector. “We have an open carriage outside, and as you would no doubt like to see the place before the light fails, we might talk it over as we drive.”

¶51 A minute later we were all seated in a comfortable landau, and were rattling through the quaint old Devonshire city. Inspector Gregory was full of his case, and poured out a stream of remarks, while Holmes threw in an occasional question or interjection. Colonel Ross leaned back with his arms folded and his hat tilted over his eyes, while I listened with interest to the dialogue of the two detectives. Gregory was formulating his theory, which was almost exactly what Holmes had foretold in the train.

¶52 “The net is drawn pretty close round Fitzroy Simpson,” he remarked, “and I believe myself that he is our man. At the same time I recognise that the evidence is purely circumstantial, and that some new development may upset it.”

¶53 “How about Straker’s knife?”

¶54 “We have quite come to the conclusion that he wounded himself in his fall.”

¶55 “My friend Dr. Watson made that suggestion to me as we came down. If so, it would tell against this man Simpson.”

¶56 “Undoubtedly. He has neither a knife nor any sign of a wound. The evidence against him is certainly very strong. He had a great interest in the disappearance of the favourite. He lies under suspicion of having poisoned the stable-boy, he was undoubtedly out in the storm, he was armed with a heavy stick, and his cravat was found in the dead man’s hand. I really think we have enough to go before a jury.”

¶57 Holmes shook his head. “A clever counsel would tear it all to rags,” said he. “Why should he take the horse out of the stable? If he wished to injure it why could he not do it there? Has a duplicate key been found in his possession? What chemist sold him the powdered opium? Above all, where could he, a stranger to the district, hide a horse, and such a horse as this? What is his own explanation as to the paper which he wished the maid to give to the stable-boy?”

¶58 “He says that it was a ten-pound note. One was found in his purse. But your other difficulties are not so formidable as they seem. He is not a stranger to the district. He has twice lodged at Tavistock in the summer. The opium was probably brought from London. The key, having served its purpose, would be hurled away. The horse may be at the bottom of one of the pits or old mines upon the moor.”

¶59 “What does he say about the cravat?”

¶60 “He acknowledges that it is his, and declares that he had lost it. But a new element has been introduced into the case which may account for his leading the horse from the stable.”

¶61 Holmes pricked up his ears.

¶62 “We have found traces which show that a party of gypsies encamped on Monday night within a mile of the spot where the murder took place. On Tuesday they were gone. Now, presuming that there was some understanding between Simpson and these gypsies, might he not have been leading the horse to them when he was overtaken, and may they not have him now?”

¶63 “It is certainly possible.”

¶64 “The moor is being scoured for these gypsies. I have also examined every stable and out-house in Tavistock, and for a radius of ten miles.”

¶65 “There is another training-stable quite close, I understand?”

¶66 “Yes, and that is a factor which we must certainly not neglect. As Desborough, their horse, was second in the betting, they had an interest in the disappearance of the favourite. Silas Brown, the trainer, is known to have had large bets upon the event, and he was no friend to poor Straker. We have, however, examined the stables, and there is nothing to connect him with the affair.”

¶67 “And nothing to connect this man Simpson with the interests of the Mapleton stables?”

¶68 “Nothing at all.”

¶69 Holmes leaned back in the carriage, and the conversation ceased. A few minutes later our driver pulled up at a neat little red-brick villa with overhanging eaves which stood by the road. Some distance off, across a paddock, lay a long grey-tiled out-building. In every other direction the low curves of the moor, bronze-coloured from the fading ferns, stretched away to the sky-line, broken only by the steeples of Tavistock, and by a cluster of houses away to the westward which marked the Mapleton stables. We all sprang out with the exception of Holmes, who continued to lean back with his eyes fixed upon the sky in front of him, entirely absorbed in his own thoughts. It was only when I touched his arm that he roused himself with a violent start and stepped out of the carriage.

¶70 “Excuse me,” said he, turning to Colonel Ross, who had looked at him in some surprise. “I was day-dreaming.” There was a gleam in his eyes and a suppressed excitement in his manner which convinced me, used as I was to his ways, that his hand was upon a clue, though I could not imagine where he had found it.

¶71 “Perhaps you would prefer at once to go on to the scene of the crime, Mr. Holmes?” said Gregory.

¶72 “I think that I should prefer to stay here a little and go into one or two questions of detail. Straker was brought back here, I presume?”

¶73 “Yes; he lies upstairs. The inquest is to-morrow.”

¶74 “He has been in your service some years, Colonel Ross?”

¶75 “I have always found him an excellent servant.”

¶76 “I presume that you made an inventory of what he had in his pockets at the time of his death, Inspector?”

¶77 “I have the things themselves in the sitting-room, if you would care to see them.”

¶78 “I should be very glad.” We all filed into the front room and sat round the central table while the Inspector unlocked a square tin box and laid a small heap of things before us. There was a box of vestas, two inches of tallow candle, an A.D.P. briar-root pipe, a pouch of seal-skin with half an ounce of long-cut Cavendish, a silver watch with a gold chain, five sovereigns in gold, an aluminium pencil-case, a few papers, and an ivory-handled knife with a very delicate, inflexible blade marked Weiss & Co., London.

¶79 “This is a very singular knife,” said Holmes, lifting it up and examining it minutely. “I presume, as I see blood-stains upon it, that it is the one which was found in the dead man’s grasp. Watson, this knife is surely in your line?”

¶80 “It is what we call a cataract knife,” said I.

¶81 “I thought so. A very delicate blade devised for very delicate work. A strange thing for a man to carry with him upon a rough expedition, especially as it would not shut in his pocket.”

¶82 “The tip was guarded by a disk of cork which we found beside his body,” said the Inspector. “His wife tells us that the knife had lain upon the dressing-table, and that he had picked it up as he left the room. It was a poor weapon, but perhaps the best that he could lay his hands on at the moment.”

¶83 “Very possible. How about these papers?”

¶84 “Three of them are receipted hay-dealers’ accounts. One of them is a letter of instructions from Colonel Ross. This other is a milliner’s account for thirty-seven pounds fifteen made out by Madame Lesurier, of Bond Street, to William Derbyshire. Mrs. Straker tells us that Derbyshire was a friend of her husband’s and that occasionally his letters were addressed here.”

¶85 “Madam Derbyshire had somewhat expensive tastes,” remarked Holmes, glancing down the account. “Twenty-two guineas is rather heavy for a single costume. However there appears to be nothing more to learn, and we may now go down to the scene of the crime.”

¶86 As we emerged from the sitting-room a woman, who had been waiting in the passage, took a step forward and laid her hand upon the Inspector’s sleeve. Her face was haggard and thin and eager, stamped with the print of a recent horror.

¶87 “Have you got them? Have you found them?” she panted.

¶88 “No, Mrs. Straker. But Mr. Holmes here has come from London to help us, and we shall do all that is possible.”

¶89 “Surely I met you in Plymouth at a garden-party some little time ago, Mrs. Straker?” said Holmes.

¶90 “No, sir; you are mistaken.”

¶91 “Dear me! Why, I could have sworn to it. You wore a costume of dove-coloured silk with ostrich-feather trimming.”

¶92 “I never had such a dress, sir,” answered the lady.


