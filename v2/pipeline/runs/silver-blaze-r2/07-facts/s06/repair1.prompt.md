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

- f.long_hollow_wet: asserts and modal belong on a says or believes fact

## Your previous output

```jsonl
{"file":"entities","id":"horses_topic","kind":"topic","name":"Horses","source":"The horse is a very gregarious creature."}
{"file":"entities","id":"the_man_near_mapleton","kind":"person","name":"The man whose track joined the horse's near Mapleton","source":"A man’s track was visible beside the horse’s."}
{"file":"facts","id":"f.ross_turns_back","of":"ross","attr":"action","value":"turns back with the Inspector","time":{"at":"t.holmes_moor_walk"},"para":113,"quote":"He turned back with the Inspector"}
{"file":"facts","id":"f.gregory_turns_back","of":"gregory","attr":"action","value":"turns back with the Colonel","time":{"at":"t.holmes_moor_walk"},"para":113,"quote":"He turned back with the Inspector"}
{"file":"facts","id":"f.watson_moor_walk","of":"watson","attr":"location","value":"dartmoor","detail":"walking slowly across the moor with Holmes","time":{"at":"t.holmes_moor_walk"},"para":113,"quote":"while Holmes and I walked slowly across the moor"}
{"file":"facts","id":"f.holmes_moor_walk","of":"holmes","attr":"location","value":"dartmoor","detail":"walking slowly across the moor with Watson","time":{"at":"t.holmes_moor_walk"},"para":113,"quote":"while Holmes and I walked slowly across the moor"}
{"file":"facts","id":"f.clock_sunset","of":"clock","attr":"hour","value":"evening, the sun beginning to sink behind the stables of Mapleton","time":{"at":"t.holmes_moor_walk"},"para":113,"quote":"The sun was beginning to sink behind the stables of Mapleton"}
{"file":"facts","id":"f.plain_gold","of":"dartmoor","attr":"condition","value":"the long sloping plain tinged with gold and ruddy browns in the evening light","time":{"at":"t.holmes_moor_walk"},"para":113,"quote":"the long, sloping plain in front of us was tinged with gold"}
{"file":"facts","id":"f.holmes_deep_thought","of":"holmes","attr":"condition","value":"sunk in the deepest thought","time":{"at":"t.holmes_moor_walk"},"para":113,"quote":"who was sunk in the deepest thought"}
{"file":"facts","id":"f.holmes_leave_murder","of":"holmes","attr":"says","value":"they may leave the question of who killed Straker for the moment and confine themselves to finding out what has become of the horse","to":"watson","time":{"at":"t.holmes_moor_walk"},"para":114,"quote":"We may leave the question of who killed John Straker for the instant, and confine ourselves to finding out what has become of the horse."}
{"file":"facts","id":"f.holmes_intends_horse","of":"holmes","attr":"intends","value":"to find out what has become of the horse","time":{"at":"t.holmes_moor_walk"},"para":114,"quote":"confine ourselves to finding out what has become of the horse"}
{"file":"facts","id":"f.holmes_supposing_broke","of":"holmes","attr":"says","value":"supposing the horse broke away during or after the tragedy, the question is where he could have gone","to":"watson","modal":"possible","time":{"at":"t.holmes_moor_walk"},"para":114,"quote":"supposing that he broke away during or after the tragedy, where could he have gone to?","asserts":[{"of":"silver_blaze","attr":"action","value":"breaks away during or after the tragedy","time":{"at":"t.crime"}}]}
{"file":"facts","id":"f.holmes_gregarious","of":"holmes","attr":"says","value":"the horse is gregarious; left to himself he would return to King's Pyland or go over to Mapleton","to":"watson","time":{"at":"t.holmes_moor_walk"},"para":114,"quote":"If left to himself his instincts would have been either to return to King’s Pyland or go over to Mapleton.","asserts":[{"of":"horses_topic","attr":"rule","value":"a horse is a very gregarious creature"},{"of":"silver_blaze","attr":"intends","value":"to return to King's Pyland or go over to Mapleton","modal":"possible","time":{"after":"t.crime"}}]}
{"file":"facts","id":"f.rule_gregarious","of":"horses_topic","attr":"rule","value":"the horse is a very gregarious creature","word":"holmes","time":{"at":"t.holmes_moor_walk"},"para":114,"quote":"The horse is a very gregarious creature."}
{"file":"facts","id":"f.holmes_not_wild","of":"holmes","attr":"says","value":"the horse would not run wild on the moor; he would surely have been seen by now","to":"watson","time":{"at":"t.holmes_moor_walk"},"para":114,"quote":"Why should he run wild upon the moor? He would surely have been seen by now.","asserts":[{"of":"silver_blaze","attr":"location","value":"dartmoor","detail":"running wild on the open moor","neg":true,"time":{"at":"t.holmes_moor_walk"}}]}
{"file":"facts","id":"f.holmes_not_gypsies","of":"holmes","attr":"says","value":"gypsies would not kidnap him: they clear out at any trouble, could not sell such a horse, and would run a great risk for nothing","to":"watson","time":{"at":"t.holmes_moor_walk"},"para":114,"quote":"They would run a great risk and gain nothing by taking him.","asserts":[{"of":"gypsy_party","attr":"carrying","value":"silver_blaze","neg":true,"time":{"at":"t.holmes_moor_walk"}}]}
{"file":"facts","id":"f.gypsies_clear_out","of":"gypsies","attr":"rule","value":"they always clear out when they hear of trouble, not wishing to be pestered by the police","word":"holmes","time":{"from":"t.before"},"para":114,"quote":"These people always clear out when they hear of trouble, for they do not wish to be pestered by the police."}
{"file":"facts","id":"f.gypsies_cannot_sell","of":"gypsies","attr":"condition","value":"could not hope to sell such a horse","word":"holmes","time":{"at":"t.holmes_moor_walk"},"para":114,"quote":"They could not hope to sell such a horse."}
{"file":"facts","id":"f.watson_asks_where","of":"watson","attr":"action","act":"ask","value":"asks where the horse is, then","to":"holmes","time":{"at":"t.holmes_moor_walk"},"para":115,"quote":"Where is he, then?"}
{"file":"facts","id":"f.holmes_at_mapleton","of":"holmes","attr":"says","value":"the horse must have gone to King's Pyland or Mapleton; he is not at King's Pyland, therefore he is at Mapleton, as a working hypothesis","to":"watson","modal":"possible","time":{"at":"t.holmes_moor_walk"},"para":116,"quote":"He is not at King’s Pyland. Therefore he is at Mapleton.","asserts":[{"of":"silver_blaze","attr":"location","value":"kings_pyland","neg":true,"time":{"at":"t.holmes_moor_walk"}},{"of":"silver_blaze","attr":"location","value":"mapleton","time":{"at":"t.holmes_moor_walk"}}]}
{"file":"facts","id":"f.holmes_working_hyp","of":"holmes","attr":"intends","value":"to take the horse being at Mapleton as a working hypothesis and see what it leads to","time":{"at":"t.holmes_moor_walk"},"para":116,"quote":"Let us take that as a working hypothesis and see what it leads us to."}
{"file":"facts","id":"f.moor_hard_dry","of":"dartmoor","attr":"condition","value":"this part of the moor is very hard and dry","word":"holmes","time":{"at":"t.holmes_moor_walk"},"para":116,"quote":"This part of the moor, as the Inspector remarked, is very hard and dry."}
{"file":"facts","id":"f.long_hollow_position","of":"long_hollow","attr":"position","value":"over yonder, where the moor falls away towards Mapleton","word":"holmes","time":{"from":"t.before"},"para":116,"quote":"But it falls away towards Mapleton, and you can see from here that there is a long hollow over yonder"}
{"file":"facts","id":"f.long_hollow_wet","of":"long_hollow","attr":"condition","value":"very wet on Monday night","word":"holmes","modal":"possible","time":{"at":"t.crime"},"para":116,"quote":"which must have been very wet on Monday night"}
{"file":"facts","id":"f.holmes_look_tracks","of":"holmes","attr":"says","value":"if the supposition is right the horse must have crossed the long hollow, and that is where to look for his tracks","to":"watson","modal":"possible","time":{"at":"t.holmes_moor_walk"},"para":116,"quote":"If our supposition is correct, then the horse must have crossed that, and there is the point where we should look for his tracks.","asserts":[{"of":"silver_blaze","attr":"location","value":"long_hollow","detail":"crossing it","time":{"at":"t.horse_track_made"}}]}
{"file":"facts","id":"f.holmes_intends_tracks","of":"holmes","attr":"intends","value":"to look for the horse's tracks in the long hollow","time":{"at":"t.holmes_moor_walk"},"para":116,"quote":"there is the point where we should look for his tracks"}
{"file":"facts","id":"f.walk_briskly","of":"watson","attr":"action","value":"walks briskly with Holmes to the long hollow","time":{"from":"t.holmes_moor_walk","to":"t.long_hollow_tracks"},"para":117,"quote":"We had been walking briskly during this conversation"}
{"file":"facts","id":"f.watson_long_hollow","of":"watson","attr":"location","value":"long_hollow","detail":"on the bank to the right","time":{"at":"t.long_hollow_tracks"},"para":117,"quote":"At Holmes’ request I walked down the bank to the right"}
{"file":"facts","id":"f.holmes_long_hollow","of":"holmes","attr":"location","value":"long_hollow","detail":"on the bank to the left","time":{"at":"t.long_hollow_tracks"},"para":117,"quote":"and he to the left"}
{"file":"facts","id":"f.holmes_asks_split","of":"holmes","attr":"action","act":"ask","value":"asks Watson to walk down the bank to the right while he takes the left","to":"watson","time":{"at":"t.long_hollow_tracks"},"para":117,"quote":"At Holmes’ request I walked down the bank to the right, and he to the left"}
{"file":"facts","id":"f.holmes_shouts","of":"holmes","attr":"action","value":"gives a shout and waves his hand to Watson","to":"watson","time":{"at":"t.long_hollow_tracks"},"para":117,"quote":"I heard him give a shout, and saw him waving his hand to me"}
{"file":"facts","id":"f.horse_track_outlined","of":"horse_track","attr":"condition","value":"plainly outlined in the soft earth","time":{"at":"t.long_hollow_tracks"},"para":117,"quote":"The track of a horse was plainly outlined in the soft earth in front of him"}
{"file":"facts","id":"f.holmes_takes_shoe","of":"holmes","attr":"action","value":"takes the horseshoe from his pocket and fits it to the print","time":{"at":"t.long_hollow_tracks"},"para":117,"quote":"the shoe which he took from his pocket exactly fitted the impression"}
{"file":"facts","id":"f.shoe_fits_track","of":"horseshoe","attr":"condition","value":"exactly fits the impression in the long hollow","time":{"at":"t.long_hollow_tracks"},"para":117,"quote":"the shoe which he took from his pocket exactly fitted the impression"}
{"file":"facts","id":"f.watson_sees_track","of":"watson","attr":"observes","value":["f.horse_track_outlined","f.shoe_fits_track"],"time":{"at":"t.long_hollow_tracks"},"para":117,"quote":"The track of a horse was plainly outlined in the soft earth"}
{"file":"facts","id":"f.holmes_imagination","of":"holmes","attr":"says","value":"see the value of imagination, the one quality Gregory lacks: they imagined what might have happened, acted on it, and are justified","to":"watson","time":{"at":"t.long_hollow_tracks"},"para":118,"quote":"We imagined what might have happened, acted upon the supposition, and find ourselves justified.","asserts":[{"of":"gregory","attr":"condition","value":"lacks imagination"}]}
{"file":"facts","id":"f.holmes_proceed","of":"holmes","attr":"intends","value":"to proceed along the track","time":{"at":"t.long_hollow_tracks"},"para":118,"quote":"Let us proceed."}
{"file":"facts","id":"f.cross_marsh","of":"watson","attr":"action","value":"crosses the marshy bottom with Holmes and passes over a quarter of a mile of dry, hard turf","time":{"after":"t.long_hollow_tracks","before":"t.near_mapleton_tracks"},"para":119,"quote":"We crossed the marshy bottom and passed over a quarter of a mile of dry, hard turf."}
{"file":"facts","id":"f.tracks_again","of":"watson","attr":"observes","value":"the horse's tracks again where the ground slopes","time":{"after":"t.long_hollow_tracks","before":"t.near_mapleton_tracks"},"para":119,"quote":"Again the ground sloped, and again we came on the tracks."}
{"file":"facts","id":"f.tracks_lost","of":"watson","attr":"action","value":"loses the tracks with Holmes for half a mile, then picks them up quite close to Mapleton","time":{"at":"t.near_mapleton_tracks"},"para":119,"quote":"Then we lost them for half a mile, but only to pick them up once more quite close to Mapleton."}
{"file":"facts","id":"f.watson_near_mapleton","of":"watson","attr":"location","value":"dartmoor","detail":"quite close to Mapleton","time":{"at":"t.near_mapleton_tracks"},"para":119,"quote":"quite close to Mapleton"}
{"file":"facts","id":"f.holmes_near_mapleton","of":"holmes","attr":"location","value":"dartmoor","detail":"quite close to Mapleton","time":{"at":"t.near_mapleton_tracks"},"para":119,"quote":"quite close to Mapleton"}
{"file":"facts","id":"f.holmes_sees_first","of":"holmes","attr":"observes","value":["f.man_track_beside"],"time":{"at":"t.near_mapleton_tracks"},"para":119,"quote":"It was Holmes who saw them first"}
{"file":"facts","id":"f.holmes_triumph","of":"holmes","attr":"condition","value":"stands pointing with a look of triumph","time":{"at":"t.near_mapleton_tracks"},"para":119,"quote":"he stood pointing with a look of triumph upon his face"}
{"file":"facts","id":"f.man_track_beside","of":"man_track","attr":"position","value":"beside the horse's track","time":{"at":"t.near_mapleton_tracks"},"para":119,"quote":"A man’s track was visible beside the horse’s."}
{"file":"facts","id":"f.man_beside_horse","of":"the_man_near_mapleton","attr":"position","value":"walking beside the horse near Mapleton","basis":"implied","time":{"at":"t.man_beside_horse"},"para":119,"quote":"A man’s track was visible beside the horse’s."}
{"file":"facts","id":"f.watson_sees_man_track","of":"watson","attr":"observes","value":["f.man_track_beside"],"time":{"at":"t.near_mapleton_tracks"},"para":119,"quote":"A man’s track was visible beside the horse’s."}
{"file":"facts","id":"f.watson_alone_before","of":"watson","attr":"says","value":"the horse was alone before","to":"holmes","time":{"at":"t.near_mapleton_tracks"},"para":120,"quote":"The horse was alone before","asserts":[{"of":"silver_blaze","attr":"condition","value":"alone, with no man beside him","time":{"from":"t.horse_track_made","to":"t.man_beside_horse"}}]}
{"file":"facts","id":"f.holmes_quite_so","of":"holmes","attr":"says","value":"quite so: the horse was alone before","to":"watson","time":{"at":"t.near_mapleton_tracks"},"para":121,"quote":"Quite so. It was alone before.","asserts":[{"of":"silver_blaze","attr":"condition","value":"alone, with no man beside him","time":{"from":"t.horse_track_made","to":"t.man_beside_horse"}}]}
{"file":"facts","id":"f.holmes_hullo_track","of":"holmes","attr":"says","value":"Hullo, what is this?","to":"watson","time":{"at":"t.near_mapleton_tracks"},"para":121,"quote":"Hullo, what is this?"}
{"file":"facts","id":"f.double_track_pyland","of":"man_track","attr":"condition","value":"the double track turns sharp off in the direction of King's Pyland","time":{"at":"t.follow_toward_pyland"},"para":122,"quote":"The double track turned sharp off and took the direction of King’s Pyland."}
{"file":"facts","id":"f.man_toward_pyland","of":"the_man_near_mapleton","attr":"action","value":"goes with the horse in the direction of King's Pyland","basis":"implied","time":{"at":"t.tracks_toward_pyland"},"para":122,"quote":"The double track turned sharp off and took the direction of King’s Pyland."}
{"file":"facts","id":"f.holmes_whistles","of":"holmes","attr":"action","value":"whistles","time":{"at":"t.follow_toward_pyland"},"para":122,"quote":"Holmes whistled"}
{"file":"facts","id":"f.follow_double","of":"watson","attr":"action","value":"follows the double track with Holmes","time":{"at":"t.follow_toward_pyland"},"para":122,"quote":"we both followed along after it"}
{"file":"facts","id":"f.holmes_eyes_trail","of":"holmes","attr":"action","value":"keeps his eyes on the trail","time":{"at":"t.follow_toward_pyland"},"para":122,"quote":"His eyes were on the trail"}
{"file":"facts","id":"f.return_track_seen","of":"return_track","attr":"condition","value":"the same tracks coming back again in the opposite direction","time":{"at":"t.follow_toward_pyland"},"para":122,"quote":"the same tracks coming back again in the opposite direction"}
{"file":"facts","id":"f.man_comes_back","of":"the_man_near_mapleton","attr":"action","value":"comes back with the horse in the opposite direction","basis":"implied","time":{"at":"t.tracks_back"},"para":122,"quote":"the same tracks coming back again in the opposite direction"}
{"file":"facts","id":"f.watson_sees_return","of":"watson","attr":"observes","value":["f.return_track_seen"],"time":{"at":"t.follow_toward_pyland"},"para":122,"quote":"I happened to look a little to one side, and saw to my surprise"}
{"file":"facts","id":"f.watson_surprised","of":"watson","attr":"condition","value":"surprised","time":{"at":"t.follow_toward_pyland"},"para":122,"quote":"saw to my surprise"}
{"file":"facts","id":"f.watson_points_out","of":"watson","attr":"action","value":"points out the return track to Holmes","to":"holmes","time":{"at":"t.follow_toward_pyland"},"para":123,"quote":"when I pointed it out"}
{"file":"facts","id":"f.holmes_one_for_you","of":"holmes","attr":"says","value":"one for Watson: he has saved them a long walk that would have brought them back on their own traces","to":"watson","time":{"at":"t.follow_toward_pyland"},"para":123,"quote":"You have saved us a long walk, which would have brought us back on our own traces."}
{"file":"facts","id":"f.holmes_follow_return","of":"holmes","attr":"intends","value":"to follow the return track","time":{"at":"t.follow_return_track"},"para":123,"quote":"Let us follow the return track."}
{"file":"facts","id":"f.not_far","of":"watson","attr":"action","value":"follows the return track a short way with Holmes","time":{"at":"t.follow_return_track"},"para":124,"quote":"We had not to go far."}
{"file":"facts","id":"f.return_ends_paving","of":"return_track","attr":"position","value":"ends at the asphalt paving leading up to the gates of the Mapleton stables","time":{"at":"t.mapleton_gates"},"para":124,"quote":"It ended at the paving of asphalt which led up to the gates of the Mapleton stables."}
{"file":"facts","id":"f.watson_mapleton_paving","of":"watson","attr":"location","value":"mapleton_paving","time":{"at":"t.mapleton_gates"},"para":124,"quote":"As we approached"}
{"file":"facts","id":"f.holmes_mapleton_paving","of":"holmes","attr":"location","value":"mapleton_paving","time":{"at":"t.mapleton_gates"},"para":124,"quote":"As we approached"}
{"file":"facts","id":"f.dawson_runs_out","of":"dawson","attr":"action","value":"runs out from the gates","time":{"at":"t.mapleton_gates"},"para":124,"quote":"a groom ran out from them"}
{"file":"facts","id":"f.dawson_paving","of":"dawson","attr":"location","value":"mapleton_paving","time":{"at":"t.mapleton_gates"},"para":124,"quote":"a groom ran out from them"}
{"file":"facts","id":"f.dawson_role","of":"dawson","attr":"role","value":"a groom at the Mapleton stables","time":{"at":"t.mapleton_gates"},"para":124,"quote":"a groom ran out from them"}
{"file":"facts","id":"f.dawson_no_loiterers","of":"dawson","attr":"says","value":"they don't want any loiterers about there","to":"holmes","time":{"at":"t.mapleton_gates"},"para":125,"quote":"We don’t want any loiterers about here"}
{"file":"facts","id":"f.holmes_finger_pocket","of":"holmes","attr":"position","value":"with his finger and thumb in his waistcoat pocket","time":{"at":"t.mapleton_gates"},"para":126,"quote":"with his finger and thumb in his waistcoat pocket"}
{"file":"facts","id":"f.holmes_asks_five","of":"holmes","attr":"action","act":"ask","value":"asks whether he would be too early to see Silas Brown if he called at five o'clock to-morrow morning","to":"dawson","time":{"at":"t.mapleton_gates"},"para":126,"quote":"Should I be too early to see your master, Mr. Silas Brown, if I were to call at five o’clock to-morrow morning?"}
{"file":"facts","id":"f.brown_dawson_master","of":"silas_brown","attr":"role","value":"the groom's master","time":{"at":"t.mapleton_gates"},"para":126,"quote":"your master, Mr. Silas Brown"}
{"file":"facts","id":"f.dawson_first_stirring","of":"dawson","attr":"says","value":"if anyone is about Brown will be, for he is always the first stirring","to":"holmes","time":{"at":"t.mapleton_gates"},"para":127,"quote":"if any one is about he will be, for he is always the first stirring","asserts":[{"of":"silas_brown","attr":"condition","value":"always the first stirring in the morning"}]}
{"file":"facts","id":"f.brown_first_up","of":"silas_brown","attr":"condition","value":"always the first stirring in the morning","word":"dawson","time":{"from":"t.before"},"para":127,"quote":"he is always the first stirring"}
{"file":"facts","id":"f.dawson_here_he_is","of":"dawson","attr":"says","value":"here is Brown to answer Holmes's questions himself","to":"holmes","time":{"at":"t.mapleton_gates"},"para":127,"quote":"But here he is, sir, to answer your questions for himself."}
{"file":"facts","id":"f.holmes_offers_coin","of":"holmes","attr":"action","act":"give","thing":"half_crown","value":"offers the groom a half-crown","to":"dawson","basis":"implied","time":{"at":"t.mapleton_gates"},"para":127,"quote":"it is as much as my place is worth to let him see me touch your money"}
{"file":"facts","id":"f.dawson_refuses_money","of":"dawson","attr":"says","value":"it is as much as his place is worth to let Brown see him touch Holmes's money; afterwards, if he likes","to":"holmes","time":{"at":"t.mapleton_gates"},"para":127,"quote":"it is as much as my place is worth to let him see me touch your money. Afterwards, if you like."}
{"file":"facts","id":"f.half_crown_owner","of":"half_crown","attr":"owner","value":"holmes","basis":"implied","time":{"at":"t.mapleton_gates"},"para":128,"quote":"the half-crown which he had drawn from his pocket"}
{"file":"facts","id":"f.holmes_replaces_coin","of":"holmes","attr":"action","value":"puts back the half-crown he had drawn from his pocket","time":{"at":"t.mapleton_gates"},"para":128,"quote":"As Sherlock Holmes replaced the half-crown which he had drawn from his pocket"}
{"file":"facts","id":"f.brown_strides_out","of":"silas_brown","attr":"action","value":"strides out from the gate","time":{"at":"t.mapleton_gates"},"para":128,"quote":"a fierce-looking elderly man strode out from the gate"}
{"file":"facts","id":"f.brown_paving","of":"silas_brown","attr":"location","value":"mapleton_paving","time":{"at":"t.mapleton_gates"},"para":128,"quote":"strode out from the gate"}
{"file":"facts","id":"f.brown_looks","of":"silas_brown","attr":"condition","value":"a fierce-looking elderly man","time":{"at":"t.mapleton_gates"},"para":128,"quote":"a fierce-looking elderly man"}
{"file":"facts","id":"f.brown_crop","of":"silas_brown","attr":"carrying","value":"hunting_crop","detail":"swinging in his hand","time":{"from":"t.mapleton_gates","to":"t.brown_reappears"},"para":128,"quote":"with a hunting-crop swinging in his hand"}
{"file":"facts","id":"f.watson_sees_brown","of":"watson","attr":"observes","value":["f.brown_strides_out","f.brown_looks","f.brown_crop"],"time":{"at":"t.mapleton_gates"},"para":128,"quote":"a fierce-looking elderly man strode out from the gate"}
{"file":"facts","id":"f.dawson_name","of":"dawson","attr":"name","value":"Dawson","time":{"at":"t.mapleton_gates"},"para":129,"quote":"What’s this, Dawson!"}
{"file":"facts","id":"f.brown_scolds_dawson","of":"silas_brown","attr":"says","value":"no gossiping; Dawson is to go about his business","to":"dawson","time":{"at":"t.mapleton_gates"},"para":129,"quote":"No gossiping! Go about your business!"}
{"file":"facts","id":"f.brown_asks_want","of":"silas_brown","attr":"action","act":"ask","value":"asks what the devil Holmes wants there","to":"holmes","time":{"at":"t.mapleton_gates"},"para":129,"quote":"And you, what the devil do you want here?"}
{"file":"facts","id":"f.holmes_ten_minutes","of":"holmes","attr":"says","value":"he wants ten minutes' talk with Brown","to":"silas_brown","time":{"at":"t.mapleton_gates"},"para":130,"quote":"Ten minutes’ talk with you, my good sir"}
{"file":"facts","id":"f.brown_no_time","of":"silas_brown","attr":"says","value":"he has no time for every gadabout; they want no strangers there","to":"holmes","time":{"at":"t.mapleton_gates"},"para":131,"quote":"I’ve no time to talk to every gadabout. We want no strangers here."}
{"file":"facts","id":"f.brown_dog_threat","of":"silas_brown","attr":"says","value":"Holmes is to be off, or he may find a dog at his heels","to":"holmes","time":{"at":"t.mapleton_gates"},"para":131,"quote":"Be off, or you may find a dog at your heels."}
{"file":"facts","id":"f.holmes_whispers","of":"holmes","attr":"action","value":"leans forward and whispers something in the trainer's ear","to":"silas_brown","time":{"at":"t.mapleton_gates"},"para":132,"quote":"Holmes leaned forward and whispered something in the trainer’s ear."}
{"file":"facts","id":"f.brown_starts","of":"silas_brown","attr":"condition","value":"starts violently and flushes to the temples","time":{"at":"t.mapleton_gates"},"para":132,"quote":"He started violently and flushed to the temples."}
{"file":"facts","id":"f.watson_sees_start","of":"watson","attr":"observes","value":["f.holmes_whispers","f.brown_starts"],"time":{"at":"t.mapleton_gates"},"para":132,"quote":"He started violently and flushed to the temples."}
{"file":"facts","id":"f.brown_lie","of":"silas_brown","attr":"says","value":"what Holmes whispered is an infernal lie","to":"holmes","time":{"at":"t.mapleton_gates"},"para":133,"quote":"an infernal lie"}
{"file":"facts","id":"f.holmes_public_or_parlour","of":"holmes","attr":"action","act":"ask","value":"asks whether they shall argue it in public or talk it over in Brown's parlour","to":"silas_brown","time":{"at":"t.mapleton_gates"},"para":134,"quote":"Shall we argue about it here in public or talk it over in your parlour?"}
{"file":"facts","id":"f.brown_come_in","of":"silas_brown","attr":"says","value":"Holmes may come in if he wishes","to":"holmes","time":{"at":"t.mapleton_gates"},"para":135,"quote":"Oh, come in if you wish to."}
{"file":"facts","id":"f.holmes_smiles","of":"holmes","attr":"action","value":"smiles","time":{"at":"t.mapleton_gates"},"para":136,"quote":"Holmes smiled."}
{"file":"facts","id":"f.holmes_few_minutes","of":"holmes","attr":"says","value":"he will not keep Watson more than a few minutes","to":"watson","time":{"at":"t.mapleton_gates"},"para":136,"quote":"I shall not keep you more than a few minutes, Watson"}
{"file":"facts","id":"f.holmes_disposal","of":"holmes","attr":"says","value":"he is quite at Brown's disposal","to":"silas_brown","time":{"at":"t.mapleton_gates"},"para":136,"quote":"Now, Mr. Brown, I am quite at your disposal."}
{"file":"facts","id":"f.holmes_parlour","of":"holmes","attr":"location","value":"brown_parlour","basis":"implied","time":{"at":"t.brown_parlour"},"para":136,"quote":"Now, Mr. Brown, I am quite at your disposal."}
{"file":"facts","id":"f.brown_parlour_loc","of":"silas_brown","attr":"location","value":"brown_parlour","basis":"implied","time":{"at":"t.brown_parlour"},"para":136,"quote":"Now, Mr. Brown, I am quite at your disposal."}
{"file":"facts","id":"f.watson_waits","of":"watson","attr":"location","value":"mapleton_paving","detail":"waiting outside","basis":"implied","time":{"at":"t.brown_parlour"},"para":137,"quote":"before Holmes and the trainer reappeared"}
{"file":"facts","id":"f.twenty_minutes","of":"holmes","attr":"time","value":"twenty minutes with Brown in the parlour","time":{"from":"t.brown_parlour","to":"t.brown_reappears"},"para":137,"quote":"It was twenty minutes"}
{"file":"facts","id":"f.clock_dusk","of":"clock","attr":"hour","value":"dusk: the reds all faded into greys","time":{"at":"t.brown_reappears"},"para":137,"quote":"the reds had all faded into greys"}
{"file":"facts","id":"f.holmes_reappears","of":"holmes","attr":"location","value":"mapleton_paving","time":{"at":"t.brown_reappears"},"para":137,"quote":"before Holmes and the trainer reappeared"}
{"file":"facts","id":"f.brown_reappears_loc","of":"silas_brown","attr":"location","value":"mapleton_paving","time":{"at":"t.brown_reappears"},"para":137,"quote":"before Holmes and the trainer reappeared"}
{"file":"facts","id":"f.brown_changed","of":"silas_brown","attr":"condition","value":"greatly changed in that short time","time":{"at":"t.brown_reappears"},"para":137,"quote":"Never have I seen such a change as had been brought about in Silas Brown in that short time."}
{"file":"facts","id":"f.brown_ashy","of":"silas_brown","attr":"condition","value":"face ashy pale","time":{"at":"t.brown_reappears"},"para":137,"quote":"His face was ashy pale"}
{"file":"facts","id":"f.brown_sweat","of":"silas_brown","attr":"condition","value":"beads of perspiration upon his brow","time":{"at":"t.brown_reappears"},"para":137,"quote":"beads of perspiration shone upon his brow"}
{"file":"facts","id":"f.brown_shaking","of":"silas_brown","attr":"condition","value":"hands shaking until the hunting-crop wags like a branch in the wind","time":{"at":"t.brown_reappears"},"para":137,"quote":"his hands shook until the hunting-crop wagged like a branch in the wind"}
{"file":"facts","id":"f.brown_manner_gone","of":"silas_brown","attr":"condition","value":"his bullying, overbearing manner all gone","time":{"at":"t.brown_reappears"},"para":137,"quote":"His bullying, overbearing manner was all gone too"}
{"file":"facts","id":"f.brown_cringes","of":"silas_brown","attr":"position","value":"cringing along at Holmes's side like a dog with its master","time":{"at":"t.brown_reappears"},"para":137,"quote":"he cringed along at my companion’s side like a dog with its master"}
{"file":"facts","id":"f.watson_sees_change","of":"watson","attr":"observes","value":["f.brown_changed","f.brown_ashy","f.brown_sweat","f.brown_shaking","f.brown_manner_gone","f.brown_cringes"],"time":{"at":"t.brown_reappears"},"para":137,"quote":"Never have I seen such a change"}
{"file":"facts","id":"f.brown_instructions","of":"silas_brown","attr":"says","value":"Holmes's instructions will be done, all of it","to":"holmes","time":{"at":"t.brown_reappears"},"para":138,"quote":"Your instructions will be done. It shall all be done","asserts":[{"of":"silas_brown","attr":"intends","value":"to carry out Holmes's instructions","time":{"at":"t.brown_reappears"}}]}
{"file":"facts","id":"f.holmes_gave_instructions","of":"holmes","attr":"action","value":"gives Silas Brown instructions","to":"silas_brown","word":"silas_brown","basis":"implied","time":{"at":"t.brown_parlour"},"para":138,"quote":"Your instructions will be done."}
{"file":"facts","id":"f.holmes_no_mistake","of":"holmes","attr":"says","value":"there must be no mistake","to":"silas_brown","time":{"at":"t.brown_reappears"},"para":139,"quote":"There must be no mistake"}
{"file":"facts","id":"f.holmes_menace","of":"holmes","attr":"condition","value":"menace in his eyes","time":{"at":"t.brown_reappears"},"para":139,"quote":"the menace in his eyes"}
{"file":"facts","id":"f.brown_winces","of":"silas_brown","attr":"action","value":"winces as he reads the menace in Holmes's eyes","time":{"at":"t.brown_reappears"},"para":139,"quote":"The other winced as he read the menace in his eyes."}
{"file":"facts","id":"f.brown_reads_menace","of":"silas_brown","attr":"observes","value":["f.holmes_menace"],"time":{"at":"t.brown_reappears"},"para":139,"quote":"as he read the menace in his eyes"}
{"file":"facts","id":"f.brown_no_mistake","of":"silas_brown","attr":"says","value":"there shall be no mistake","to":"holmes","time":{"at":"t.brown_reappears"},"para":140,"quote":"Oh no, there shall be no mistake."}
{"file":"facts","id":"f.brown_it_there","of":"silas_brown","attr":"says","value":"it shall be there","to":"holmes","time":{"at":"t.brown_reappears"},"para":140,"quote":"It shall be there.","asserts":[{"of":"brown_charge","attr":"location","value":null,"detail":"there, as Holmes instructed","time":{"at":"t.brown_promise_kept"}},{"of":"silas_brown","attr":"intends","value":"that it shall be there","time":{"at":"t.brown_reappears"}}]}
{"file":"facts","id":"f.brown_asks_change","of":"silas_brown","attr":"action","act":"ask","value":"asks whether he should change it first or not","to":"holmes","time":{"at":"t.brown_reappears"},"para":140,"quote":"Should I change it first or not?"}
{"file":"facts","id":"f.holmes_laughs","of":"holmes","attr":"action","value":"thinks a little and then bursts out laughing","time":{"at":"t.brown_reappears"},"para":141,"quote":"Holmes thought a little and then burst out laughing."}
{"file":"facts","id":"f.holmes_dont_change","of":"holmes","attr":"says","value":"no, Brown is not to change it; Holmes will write to him about it","to":"silas_brown","time":{"at":"t.brown_reappears"},"para":141,"quote":"“No, don’t,” said he; “I shall write to you about it."}
{"file":"facts","id":"f.holmes_intends_write","of":"holmes","attr":"intends","value":"to write to Brown about whether to change it","time":{"at":"t.brown_reappears"},"para":141,"quote":"I shall write to you about it."}
{"file":"facts","id":"f.holmes_no_tricks","of":"holmes","attr":"says","value":"no tricks, or else (a threat left unfinished)","to":"silas_brown","time":{"at":"t.brown_reappears"},"para":141,"quote":"No tricks, now, or—"}
{"file":"facts","id":"f.brown_trust_me","of":"silas_brown","attr":"says","value":"Holmes can trust him","to":"holmes","time":{"at":"t.brown_reappears"},"para":142,"quote":"Oh, you can trust me, you can trust me!"}
{"file":"facts","id":"f.holmes_think_can","of":"holmes","attr":"says","value":"he thinks he can trust Brown","to":"silas_brown","time":{"at":"t.brown_reappears"},"para":143,"quote":"Yes, I think I can."}
{"file":"facts","id":"f.holmes_hear_tomorrow","of":"holmes","attr":"says","value":"Brown shall hear from him to-morrow","to":"silas_brown","time":{"at":"t.brown_reappears"},"para":143,"quote":"you shall hear from me to-morrow","asserts":[{"of":"holmes","attr":"intends","value":"to send word to Brown","time":{"at":"t.holmes_writes_brown"}}]}
{"file":"facts","id":"f.holmes_intends_tomorrow","of":"holmes","attr":"intends","value":"to send word to Brown to-morrow","time":{"at":"t.brown_reappears"},"para":143,"quote":"you shall hear from me to-morrow"}
{"file":"facts","id":"f.brown_holds_hand","of":"silas_brown","attr":"action","value":"holds out a trembling hand to Holmes","to":"holmes","time":{"at":"t.brown_reappears"},"para":143,"quote":"the trembling hand which the other held out to him"}
{"file":"facts","id":"f.holmes_turns_heel","of":"holmes","attr":"action","value":"turns on his heel, disregarding Brown's hand","time":{"at":"t.brown_reappears"},"para":143,"quote":"He turned upon his heel, disregarding the trembling hand"}
{"file":"facts","id":"f.watson_sets_off","of":"watson","attr":"action","value":"sets off with Holmes for King's Pyland","time":{"at":"t.set_off_pyland"},"para":143,"quote":"we set off for King’s Pyland"}
{"file":"facts","id":"f.holmes_sets_off","of":"holmes","attr":"action","value":"sets off with Watson for King's Pyland","time":{"at":"t.set_off_pyland"},"para":143,"quote":"we set off for King’s Pyland"}
{"file":"account_add","id":"acct.watson","facts":["f.ross_turns_back","f.gregory_turns_back","f.watson_moor_walk","f.holmes_moor_walk","f.clock_sunset","f.plain_gold","f.holmes_deep_thought","f.holmes_leave_murder","f.holmes_intends_horse","f.holmes_supposing_broke","f.holmes_gregarious","f.holmes_not_wild","f.holmes_not_gypsies","f.watson_asks_where","f.holmes_at_mapleton","f.holmes_working_hyp","f.holmes_look_tracks","f.holmes_intends_tracks","f.walk_briskly","f.watson_long_hollow","f.holmes_long_hollow","f.holmes_asks_split","f.holmes_shouts","f.horse_track_outlined","f.holmes_takes_shoe","f.shoe_fits_track","f.watson_sees_track","f.holmes_imagination","f.holmes_proceed","f.cross_marsh","f.tracks_again","f.tracks_lost","f.watson_near_mapleton","f.holmes_near_mapleton","f.holmes_sees_first","f.holmes_triumph","f.man_track_beside","f.man_beside_horse","f.watson_sees_man_track","f.watson_alone_before","f.holmes_quite_so","f.holmes_hullo_track","f.double_track_pyland","f.man_toward_pyland","f.holmes_whistles","f.follow_double","f.holmes_eyes_trail","f.return_track_seen","f.man_comes_back","f.watson_sees_return","f.watson_surprised","f.watson_points_out","f.holmes_one_for_you","f.holmes_follow_return","f.not_far","f.return_ends_paving","f.watson_mapleton_paving","f.holmes_mapleton_paving","f.dawson_runs_out","f.dawson_paving","f.dawson_role","f.dawson_no_loiterers","f.holmes_finger_pocket","f.holmes_asks_five","f.brown_dawson_master","f.dawson_first_stirring","f.dawson_here_he_is","f.holmes_offers_coin","f.dawson_refuses_money","f.half_crown_owner","f.holmes_replaces_coin","f.brown_strides_out","f.brown_paving","f.brown_looks","f.brown_crop","f.watson_sees_brown","f.dawson_name","f.brown_scolds_dawson","f.brown_asks_want","f.holmes_ten_minutes","f.brown_no_time","f.brown_dog_threat","f.holmes_whispers","f.brown_starts","f.watson_sees_start","f.brown_lie","f.holmes_public_or_parlour","f.brown_come_in","f.holmes_smiles","f.holmes_few_minutes","f.holmes_disposal","f.holmes_parlour","f.brown_parlour_loc","f.watson_waits","f.twenty_minutes","f.clock_dusk","f.holmes_reappears","f.brown_reappears_loc","f.brown_changed","f.brown_ashy","f.brown_sweat","f.brown_shaking","f.brown_manner_gone","f.brown_cringes","f.watson_sees_change","f.brown_instructions","f.holmes_no_mistake","f.holmes_menace","f.brown_winces","f.brown_reads_menace","f.brown_no_mistake","f.brown_it_there","f.brown_asks_change","f.holmes_laughs","f.holmes_dont_change","f.holmes_intends_write","f.holmes_no_tricks","f.brown_trust_me","f.holmes_think_can","f.holmes_hear_tomorrow","f.holmes_intends_tomorrow","f.brown_holds_hand","f.holmes_turns_heel","f.watson_sets_off","f.holmes_sets_off"]}
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
`joins` (a door's two sides, inside first) beside the list. `name` is the fullest name the story gives the entity
(`"Joseph Crane"`): the page shows, at each paragraph, only a name or phrase the story has used by then (from
mentions.json), so the name may be one the story gives later. A description for someone the story never names
(`"The pedlar on the road"`) must hold from the first mention. Optional `names: [{"from", "name"}]` sets which
name the page shows from which paragraph, where the automatic choice would be wrong:

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

The `label` shows from the time point's `para`, so it must say only what the story has told by then: "One
morning, at breakfast" at ¶1, not "Tuesday, at breakfast" when the day is told at ¶5. Where a later paragraph
tells more, give the label in steps: `"labels": [{"from": 1, "label": "One morning, at breakfast"}, {"from": 5,
"label": "Tuesday, at breakfast"}]`. A label never names a place or person the story has not yet given for it.

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

**A whole chain.** Every account must reach a narrator through tellings, one `tells` fact per step, even where the
story only implies a step (`basis: "implied"`, with the words that imply it). Suppose ¶4 is the newspaper report
Ashdown reads out to Hale: Ruth told the constable what she heard, the constable reported to the paper, the paper
printed it, and Ashdown read it to Hale. That is four tellings:

```json
{"id": "f.ruth_tells_pryor", "of": "ruth", "attr": "tells", "value": "acct.ruth", "to": "pryor", "how": "statement", "basis": "implied", "time": {"after": "t.mon_midnight", "before": "t.tue_breakfast"}, "para": 4, "quote": "the miller's daughter told the constable"},
{"id": "f.pryor_tells_paper", "of": "pryor", "attr": "tells", "value": "acct.police", "to": "the_paper", "how": "report", "basis": "implied", "time": {"before": "t.tue_breakfast"}, "para": 4, "quote": "the constable's report"},
{"id": "f.paper_tells_ashdown", "of": "the_paper", "attr": "tells", "value": "acct.paper", "to": "ashdown", "how": "newspaper", "time": {"at": "t.tue_breakfast"}, "para": 4, "quote": "Ashdown read from the paper"},
{"id": "f.ashdown_tells_hale", "of": "ashdown", "attr": "tells", "value": "acct.paper", "to": "hale", "how": "told", "time": {"at": "t.tue_breakfast"}, "para": 4, "quote": "Ashdown read from the paper"}
```

with `acct.police` a bundle whose `parts` include `acct.ruth`, and `acct.paper` a bundle whose `parts` include
`acct.police`. A witness who sees something has an `observes` fact (its `value` the fact ids seen), in that
witness's own account.

**What is easy to leave out.** Who belongs to a group (`member_of`, one fact per member: the two lads among the
searchers); where people and animals live or are kept (`lives_at`, implied where the text takes it for granted);
the tellings the story implies (each witness's account reaching the police); what someone sees (`observes`) and
knows (`knows`) when it matters to what they do.

## accounts.json

What one source tells, as a bundle of facts: `{"id", "label", "origin", "how", "facts"?, "parts"?}`. The
`label` names only the source ("Ruth's account", "What the constable holds"), never what is in it: the page shows
it with the first telling that passes it, which may come before its contents are told; give `labels` steps where
even the source is not yet named there. `origin` is who
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

- `label`: the question as a reader would ask it ("Who took the purse?"), in the words the story has used by
  `raised`; `labels` steps where it is raised before a name in it is told ("Who killed the miller?", then "Who
  killed Joseph Crane?").
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
line already says it in brief (until `para`, the page shows only those brief words). `inferable_at` is the earliest paragraph a careful reader can reach the fact from what
came before, with `from` (facts) or `reasoning` (`{para, text}`, a step in words), and `strength: "likely"` when it
would be held but does not strictly follow. These are written once the whole story is in, by the step that sees it.

## Typed actions (optional, for doors and keys)

A fact may be a typed action: `act` (`lock`, `unlock`, `open`, `close`, `go_through`, `lead_out`, `give`, `ask`,
`drug`, `strike`, `hide`) and `thing` (what it acts on), its agent the fact's `of`. A door's state is `attr: "door"`,
`value` one of `open`, `shut`, `locked`. Write these only where the text makes them matter.

## strains.json (likely clashes)

Two entries that can both hold but sit badly together, which a careful reader would notice: `{"id", "a", "b",
"why", "available", "key", "from"?}`. Each side is a fact id or a question's possibility `{"q", "pick"}`; `why` says
in plain words why they sit badly ("A man who has lost his way would not know the yard's night arrangements");
`available`, the paragraph from which both sides are told (no earlier than either); `key`, the question at whose
give-away the clash is listed as what a careful reader would have noticed. The page shows a clash only when one side
is the player's own circle and the other is on the timeline, so a side is usually a wrong possibility the player
might circle, and the other a fact that tells against it.

```json
{"id": "s.pedlar_gate", "a": {"q": "q.who_took", "pick": "the_pedlar"}, "b": "f.dobbs_heard_nothing", "why": "A stranger at the gate would have woken the dog in the yard, and Dobbs sleeps over it.", "available": 9, "key": "q.who_took"}
```

## path.json (the true path)

The moves a careful reader makes through the page, in order, to the end of the story: `{"at", "do", …, "why",
"for_q"}`. The page stops before a paragraph that gives an answer away until each question it answers has exactly
one circle, so the path circles every answered question's answer before its give-away.

- `{"do": "circle", "q", "pick"}`: circle a possibility (the reader's hypothesis). A wrong turn the reader would
  take is a circle of a wrong possibility, then `{"do": "cross", "q", "pick"}` once the story rules it out.
- `{"do": "trust", "on": <fact id>, "link": "stmt:<fact id>", "level": "distrusted"}`: distrust one statement
  (a lie, a mistaken belief, a false report). By the end of the story nothing may contradict: every false
  statement the reader has on the timeline must be distrusted.
- `at`: the paragraph of the move; `why`: the reader's reason, in plain words, as the reader would say it then;
  `for_q`: the questions the move serves.


## Your task

Write the facts that scene s06 (Following tracks across the moor to Mapleton and a talk with Silas Brown, ¶113–¶143) tells, and the accounts they travel
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
joins: {"stable_door":["stables","kings_pyland"],"mapleton_gates":["mapleton","mapleton_paving"]}
{"id":"watson","kind":"person","name":"Watson"}
{"id":"holmes","kind":"person","name":"Sherlock Holmes"}
{"id":"calendar","kind":"state","name":"The day of the week"}
{"id":"clock","kind":"state","name":"The time of day"}
{"id":"england","kind":"place","name":"England"}
{"id":"holmes_rooms","kind":"place","name":"Holmes and Watson's rooms","within":"england","source":"my companion had rambled about the room"}
{"id":"dartmoor","kind":"place","name":"Dartmoor","within":"devonshire"}
{"id":"kings_pyland","kind":"place","name":"King's Pyland","within":"dartmoor"}
{"id":"paddington","kind":"place","name":"Paddington","within":"england"}
{"id":"reading","kind":"place","name":"Reading","within":"england"}
{"id":"exeter","kind":"place","name":"Exeter","within":"england"}
{"id":"train","kind":"object","name":"The train from Paddington"}
{"id":"carriage","kind":"place","name":"A first-class carriage","within":"train"}
{"id":"silver_blaze","kind":"animal","name":"Silver Blaze"}
{"id":"straker","kind":"person","name":"John Straker"}
{"id":"ross","kind":"person","name":"Colonel Ross"}
{"id":"gregory","kind":"person","name":"Inspector Gregory"}
{"id":"simpson","kind":"person","name":"Fitzroy Simpson"}
{"id":"wessex_cup","kind":"topic","name":"The Wessex Cup"}
{"id":"news_agent","kind":"person","name":"Holmes and Watson's news agent"}
{"id":"fresh_editions","kind":"document","name":"Fresh editions of every paper"}
{"id":"bundle_of_papers","kind":"document","name":"The bundle of fresh papers from Paddington"}
{"id":"the_telegraph","kind":"document","name":"The Telegraph"}
{"id":"the_chronicle","kind":"document","name":"The Chronicle"}
{"id":"ross_telegram","kind":"document","name":"Colonel Ross's telegram"}
{"id":"gregory_telegram","kind":"document","name":"Inspector Gregory's telegram"}
{"id":"field_glass","kind":"object","name":"Watson's field-glass"}
{"id":"holmes_pipe","kind":"object","name":"Holmes's pipe"}
{"id":"cigar_case","kind":"object","name":"Holmes's cigar-case"}
{"id":"holmes_watch","kind":"object","name":"Holmes's watch"}
{"id":"travelling_cap","kind":"object","name":"Holmes's ear-flapped travelling-cap"}
{"id":"telegraph_posts","kind":"object","name":"The telegraph posts upon the line"}
{"id":"quarter_mile_posts","kind":"object","name":"The quarter-mile posts"}
{"id":"weather","kind":"state","name":"The weather","source":"she could hear the rain pattering against the window"}
{"id":"isonomy","kind":"animal","name":"Isonomy"}
{"id":"racing_public","kind":"group","name":"The racing public"}
{"id":"stables","kind":"place","name":"The King's Pyland training-stables","within":"kings_pyland"}
{"id":"stall","kind":"place","name":"The favourite's stall","within":"stables"}
{"id":"harness_room","kind":"place","name":"The harness-room","within":"stables"}
{"id":"loft","kind":"place","name":"The chaff-cutting loft above the harness-room","within":"stables"}
{"id":"stable_door","kind":"object","name":"The stable door"}
{"id":"stable_window","kind":"object","name":"The stable window where the meals are handed in","within":"stables"}
{"id":"small_table","kind":"object","name":"The small table in the stable","within":"stables"}
{"id":"water_tap","kind":"object","name":"The water-tap in the stables","within":"stables"}
{"id":"kings_pyland_stable","kind":"group","name":"The King's Pyland establishment"}
{"id":"stable_lads","kind":"group","name":"The three stable lads"}
{"id":"two_lads","kind":"group","name":"The two lads who slept in the loft"}
{"id":"hunter","kind":"person","name":"Ned Hunter"}
{"id":"kings_pyland_horses","kind":"group","name":"The four horses at King's Pyland"}
{"id":"bayard","kind":"animal","name":"Bayard"}
{"id":"straker_villa","kind":"place","name":"Straker's small villa","within":"kings_pyland"}
{"id":"kitchen","kind":"place","name":"The kitchen of the trainer's house","within":"straker_villa"}
{"id":"path","kind":"place","name":"The path across the moor to the stables","within":"kings_pyland"}
{"id":"knoll","kind":"place","name":"The knoll near the house","within":"kings_pyland"}
{"id":"mrs_straker","kind":"person","name":"Mrs. Straker"}
{"id":"edith_baxter","kind":"person","name":"Edith Baxter"}
{"id":"two_women","kind":"group","name":"The two women"}
{"id":"villas","kind":"place","name":"The small cluster of villas to the north","within":"dartmoor"}
{"id":"simpson_villa","kind":"place","name":"Simpson's villa","within":"villas","source":"he inhabited one of those villas"}
{"id":"tavistock_contractor","kind":"person","name":"A Tavistock contractor"}
{"id":"tavistock","kind":"place","name":"Tavistock","within":"dartmoor"}
{"id":"mapleton","kind":"place","name":"Mapleton","within":"dartmoor"}
{"id":"backwater","kind":"person","name":"Lord Backwater"}
{"id":"silas_brown","kind":"person","name":"Silas Brown"}
{"id":"desborough","kind":"animal","name":"Desborough"}
{"id":"gypsies","kind":"group","name":"The gypsies of Dartmoor"}
{"id":"the_stranger","kind":"person","name":"The stranger who stopped the maid near the stables"}
{"id":"stranger_suit","kind":"object","name":"The stranger's grey suit of tweeds"}
{"id":"stranger_cap","kind":"object","name":"The stranger's cloth cap"}
{"id":"stranger_gaiters","kind":"object","name":"The stranger's gaiters"}
{"id":"stranger_stick","kind":"object","name":"The stranger's heavy stick with a knob"}
{"id":"paper_packet","kind":"object","name":"The folded piece of white paper"}
{"id":"lantern","kind":"object","name":"The maid's lantern"}
{"id":"hunter_supper","kind":"object","name":"Hunter's supper of curried mutton"}
{"id":"house_supper","kind":"object","name":"The curried mutton eaten at the house"}
{"id":"opium","kind":"object","name":"Powdered opium"}
{"id":"dog","kind":"animal","name":"The stable dog"}
{"id":"straker_coat","kind":"object","name":"Straker's large mackintosh"}
{"id":"furze_bush","kind":"object","name":"The furze-bush"}
{"id":"hollow","kind":"place","name":"The bowl-shaped depression in the moor","within":"dartmoor"}
{"id":"heavy_weapon","kind":"object","name":"The heavy weapon that struck Straker"}
{"id":"sharp_instrument","kind":"object","name":"The sharp instrument that cut Straker's thigh"}
{"id":"straker_knife","kind":"object","name":"Straker's small knife"}
{"id":"cravat","kind":"object","name":"The red and black silk cravat"}
{"id":"bridle","kind":"object","name":"Silver Blaze's bridle"}
{"id":"duplicate_key","kind":"object","name":"A duplicate key to the stable door"}
{"id":"special_wire","kind":"document","name":"Holmes's special wire to Dartmoor"}
{"id":"police","kind":"group","name":"The police"}
{"id":"betting_book","kind":"document","name":"Simpson's betting-book"}
{"id":"simpson_stick","kind":"object","name":"Simpson's Penang-lawyer weighted with lead"}
{"id":"london","kind":"place","name":"London","within":"england"}
{"id":"sporting_clubs","kind":"place","name":"The sporting clubs of London","within":"london"}
{"id":"watson_cigar","kind":"object","name":"Watson's cigar"}
{"id":"devonshire","kind":"place","name":"Devonshire","within":"england"}
{"id":"tavistock_station","kind":"place","name":"Tavistock station","within":"tavistock"}
{"id":"landau","kind":"object","name":"The open carriage, a comfortable landau"}
{"id":"ross_frock_coat","kind":"object","name":"Colonel Ross's frock-coat"}
{"id":"ross_gaiters","kind":"object","name":"Colonel Ross's gaiters","source":"in a frock-coat and gaiters"}
{"id":"ross_eye_glass","kind":"object","name":"Colonel Ross's eye-glass"}
{"id":"ross_hat","kind":"object","name":"Colonel Ross's hat"}
{"id":"detective_service","kind":"group","name":"The English detective service"}
{"id":"ten_pound_note","kind":"object","name":"The ten-pound note found in Simpson's purse"}
{"id":"simpson_purse","kind":"object","name":"Simpson's purse"}
{"id":"pits_mines","kind":"place","name":"The pits and old mines upon the moor","within":"dartmoor"}
{"id":"gypsy_party","kind":"group","name":"The party of gypsies encamped near the spot of the murder"}
{"id":"gypsy_camp","kind":"place","name":"The gypsies' camp within a mile of the murder","within":"dartmoor","source":"encamped on Monday night within a mile of the spot where the murder took place"}
{"id":"tavistock_stables","kind":"place","name":"The stables and out-houses in and around Tavistock","within":"dartmoor","source":"every stable and out-house in Tavistock"}
{"id":"driver","kind":"person","name":"The driver of the landau"}
{"id":"road","kind":"place","name":"The road by Straker's villa","within":"kings_pyland"}
{"id":"paddock","kind":"place","name":"The paddock by Straker's villa","within":"kings_pyland"}
{"id":"upstairs_room","kind":"place","name":"The room upstairs where Straker lies","within":"straker_villa","source":"he lies upstairs"}
{"id":"sitting_room","kind":"place","name":"The sitting-room of Straker's villa","within":"straker_villa"}
{"id":"passage","kind":"place","name":"The passage of Straker's villa","within":"straker_villa"}
{"id":"straker_bedroom","kind":"place","name":"The room Straker left that night","within":"straker_villa"}
{"id":"dressing_table","kind":"object","name":"The dressing-table","within":"straker_bedroom"}
{"id":"central_table","kind":"object","name":"The central table in the sitting-room","within":"sitting_room"}
{"id":"tin_box","kind":"object","name":"The square tin box","within":"sitting_room"}
{"id":"vestas","kind":"object","name":"A box of vestas"}
{"id":"tallow_candle","kind":"object","name":"Two inches of tallow candle"}
{"id":"straker_pipe","kind":"object","name":"An A.D.P. briar-root pipe"}
{"id":"tobacco_pouch","kind":"object","name":"A pouch of seal-skin"}
{"id":"cavendish","kind":"object","name":"Half an ounce of long-cut Cavendish"}
{"id":"straker_watch","kind":"object","name":"A silver watch with a gold chain"}
{"id":"sovereigns","kind":"object","name":"Five sovereigns in gold"}
{"id":"pencil_case","kind":"object","name":"An aluminium pencil-case"}
{"id":"pocket_papers","kind":"document","name":"The papers in Straker's pockets"}
{"id":"weiss_co","kind":"group","name":"Weiss & Co., London"}
{"id":"cork_disk","kind":"object","name":"The disk of cork that guarded the knife's tip"}
{"id":"hay_accounts","kind":"document","name":"Three receipted hay-dealers' accounts"}
{"id":"ross_letter","kind":"document","name":"A letter of instructions from Colonel Ross"}
{"id":"milliner_account","kind":"document","name":"The milliner's account made out to William Derbyshire"}
{"id":"lesurier","kind":"person","name":"Madame Lesurier"}
{"id":"bond_street","kind":"place","name":"Bond Street","within":"london"}
{"id":"derbyshire","kind":"person","name":"William Derbyshire"}
{"id":"madam_derbyshire","kind":"person","name":"Madam Derbyshire"}
{"id":"account_costume","kind":"object","name":"The costume on the milliner's account","source":"Twenty-two guineas is rather heavy for a single costume"}
{"id":"plymouth","kind":"place","name":"Plymouth","within":"devonshire"}
{"id":"garden_party","kind":"place","name":"A garden-party in Plymouth","within":"plymouth"}
{"id":"dove_dress","kind":"object","name":"A costume of dove-coloured silk with ostrich-feather trimming"}
{"id":"matting","kind":"object","name":"The piece of matting laid at the side of the hollow","within":"hollow"}
{"id":"gregory_bag","kind":"object","name":"The Inspector's bag"}
{"id":"straker_boot","kind":"object","name":"One of the boots which Straker wore"}
{"id":"simpson_shoe","kind":"object","name":"One of Fitzroy Simpson's shoes"}
{"id":"horseshoe","kind":"object","name":"A cast horseshoe of Silver Blaze"}
{"id":"wax_vesta","kind":"object","name":"A wax vesta half burned, found in the mud of the hollow"}
{"id":"ross_watch","kind":"object","name":"Colonel Ross's watch"}
{"id":"cup_entries","kind":"document","name":"The entries for the Wessex Cup"}
{"id":"the_public","kind":"group","name":"The public"}
{"id":"long_hollow","kind":"place","name":"The long hollow towards Mapleton","within":"dartmoor"}
{"id":"horse_track","kind":"object","name":"The track of a horse in the soft earth","within":"long_hollow"}
{"id":"man_track","kind":"object","name":"The man's track beside the horse's, near Mapleton","within":"dartmoor"}
{"id":"return_track","kind":"object","name":"The same tracks coming back in the opposite direction","within":"dartmoor"}
{"id":"mapleton_paving","kind":"place","name":"The asphalt paving up to the Mapleton gates","within":"mapleton"}
{"id":"mapleton_gates","kind":"object","name":"The gates of the Mapleton stables","within":"mapleton"}
{"id":"brown_parlour","kind":"place","name":"Silas Brown's parlour","within":"mapleton"}
{"id":"dawson","kind":"person","name":"Dawson"}
{"id":"hunting_crop","kind":"object","name":"Silas Brown's hunting-crop"}
{"id":"half_crown","kind":"object","name":"Holmes's half-crown"}
{"id":"brown_charge","kind":"object","name":"What Silas Brown promises shall be there","source":"It shall be there. Should I change it first or not?"}
{"id":"the_press","kind":"group","name":"The newspapers","source":"the embellishments of theorists and reporters"}
{"id":"out_building","kind":"place","name":"The long grey-tiled out-building across the paddock","within":"kings_pyland"}
{"id":"tavistock_steeples","kind":"object","name":"The steeples of Tavistock","within":"tavistock"}
{"id":"front_door_villa","kind":"place","name":"Outside Straker's villa","within":"kings_pyland","source":"We all sprang out with the exception of Holmes"}

## Time points

{"id":"t.before","label":"Before the story"}
{"id":"t.crime","label":"When the favourite vanished and its trainer was murdered","labels":[{"from":4,"label":"When the favourite vanished and its trainer was murdered"},{"from":10,"label":"When Silver Blaze vanished and John Straker was murdered"}],"after":["t.straker_leaves","t.horse_taken"],"para":4,"quote":"the singular disappearance of the favourite for the Wessex Cup, and the tragic murder of its trainer","note":"The struggle in the hollow on Monday night (¶19, ¶35–37), after Straker left the house at one and before seven in the morning."}
{"id":"t.tue_evening","label":"Tuesday evening","after":"t.crime","para":12,"quote":"On Tuesday evening I received telegrams"}
{"id":"t.wed","label":"The day before, while Holmes brooded","labels":[{"from":4,"label":"The day before, while Holmes brooded"},{"from":13,"label":"Wednesday, while Holmes brooded"}],"after":"t.tue_evening","para":4,"quote":"For a whole day my companion had rambled about the room","note":"Holmes's 'yesterday' (¶14), between Tuesday evening and Thursday morning (¶13). The fresh editions are sent up during this day."}
{"id":"t.watson_reads_papers","label":"When Watson read the Telegraph and the Chronicle","after":"t.crime","para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say","note":"Before the journey; not otherwise dated."}
{"id":"t.simpson_arrest","label":"When Fitzroy Simpson was arrested","after":"t.gregory_arrives","para":14,"quote":"beyond the arrest of young Fitzroy Simpson nothing had been done","note":"Gregory arrests him on his arrival (¶39); Simpson's statement and the cravat put to him (¶40). Known to Holmes by Thursday morning."}
{"id":"t.thu_breakfast","label":"One morning, at breakfast","labels":[{"from":1,"label":"One morning, at breakfast"},{"from":13,"label":"Thursday morning, at breakfast"}],"after":["t.wed","t.simpson_arrest","t.watson_reads_papers","t.statements"],"para":1,"quote":"as we sat down together to our breakfast one morning"}
{"id":"t.paddington","label":"Thursday morning, at Paddington","after":"t.thu_breakfast","para":7,"quote":"which he had procured at Paddington"}
{"id":"t.train_out","label":"Thursday morning, in the train from Paddington","after":"t.paddington","para":7,"quote":"an hour or so later I found myself in the corner of a first-class carriage","note":"Holmes reads the papers, before Reading."}
{"id":"t.train_reading","label":"Thursday morning, the train passing Reading","after":"t.train_out","para":7,"quote":"We had left Reading far behind us"}
{"id":"t.train_beyond_reading","label":"Thursday morning, in the train well past Reading","after":"t.train_reading","para":7,"quote":"We had left Reading far behind us before he thrust the last one of them under the seat","note":"The cigar-case, the speed reckoning (¶8–10) and Holmes's talk of the case (¶10–16)."}
{"id":"t.straker_years","label":"Years before, while Straker served Colonel Ross as jockey and then as trainer","after":"t.before","para":19,"quote":"He has served the Colonel for five years as jockey and for seven as trainer","note":"Twelve years of service up to now; Simpson's squandering of his fortune upon the turf (¶39) is also in this long past, undated."}
{"id":"t.simpson_bets","label":"When Fitzroy Simpson registered his bets against the favourite","after":"t.before","para":39,"quote":"bets to the amount of five thousand pounds had been registered by him against the favourite","note":"Before the catastrophe; not otherwise dated."}
{"id":"t.simpson_comes_down","label":"When Fitzroy Simpson came down to Dartmoor","after":"t.before","para":40,"quote":"he had come down to Dartmoor in the hope of getting some information","note":"Before Monday evening, when he met the maid; not otherwise dated."}
{"id":"t.mon_evening","label":"Monday evening, before nine","after":["t.straker_years","t.simpson_bets"],"para":20,"quote":"On that evening the horses had been exercised and watered as usual","note":"¶19 names the night: 'last Monday night when the catastrophe occurred'."}
{"id":"t.mon_nine","label":"Monday evening, nine o'clock","after":"t.mon_evening","para":20,"quote":"the stables were locked up at nine o'clock","note":"Two lads walk up to the trainer's house for supper in the kitchen; Hunter stays on guard."}
{"id":"t.mon_maid_path","label":"Monday evening, a few minutes after nine, the maid on the path","after":["t.mon_nine","t.simpson_comes_down"],"para":20,"quote":"At a few minutes after nine the maid, Edith Baxter, carried down to the stables his supper","note":"The stranger stops her within thirty yards of the stables (¶21–24)."}
{"id":"t.mon_window","label":"Monday evening, the maid and the stranger at the stable window","after":"t.mon_maid_path","para":25,"quote":"ran past him to the window through which she was accustomed to hand the meals","note":"The stranger speaks with Hunter through the window (¶26–29); Hunter goes for the dog; the maid flees to the house."}
{"id":"t.mon_hunter_out","label":"Monday evening, a minute later, Hunter runs out with the dog","after":"t.mon_window","para":29,"quote":"A minute later, however, when Hunter rushed out with the hound he was gone","note":"Hunter locks the door before he leaves it (¶31) and searches round the buildings."}
{"id":"t.mon_lads_return","label":"Monday night, when the other lads returned","after":"t.mon_hunter_out","para":32,"quote":"Hunter waited until his fellow-grooms had returned, when he sent a message to the trainer"}
{"id":"t.mon_straker_told","label":"Monday night, when Straker heard Hunter's message","after":"t.mon_lads_return","para":32,"quote":"Straker was excited at hearing the account"}
{"id":"t.straker_leaves","label":"Monday night, one in the morning, Straker leaves the house","after":"t.mon_straker_told","para":32,"quote":"Mrs. Straker, waking at one in the morning, found that he was dressing","note":"Rain pattering against the window; he pulls on his mackintosh and walks out towards the stables."}
{"id":"t.horse_taken","label":"When the favourite was taken from his stall","after":"t.mon_nine","para":33,"quote":"the favourite’s stall was empty","note":"Not dated by the text; before the struggle in the hollow, where the horse was (¶37). The police hold that Simpson took him out (¶46)."}
{"id":"t.morning_seven","label":"The next morning, at seven","after":"t.crime","para":33,"quote":"Mrs. Straker awoke at seven in the morning","note":"She finds her husband not returned and goes with the maid to the stables: the door open, Hunter stupefied, the stall empty."}
{"id":"t.morning_search","label":"The next morning, the search from the knoll and the finding of the body","after":"t.morning_seven","para":34,"quote":"on ascending the knoll near the house","note":"The lads roused, the search, the coat on the furze-bush and the body in the hollow (¶34–35)."}
{"id":"t.hunter_recovers","label":"When Hunter recovered from his stupor","after":"t.morning_search","para":36,"quote":"Hunter, on recovering from his stupor"}
{"id":"t.analysis","label":"When the remains of the stable-lad's supper were analysed","after":"t.morning_search","para":37,"quote":"an analysis has shown that the remains of his supper"}
{"id":"t.reward","label":"When a reward was offered for the missing horse","after":"t.morning_search","para":37,"quote":"although a large reward has been offered"}
{"id":"t.gregory_arrives","label":"When Inspector Gregory arrived","after":"t.morning_search","para":39,"quote":"On his arrival he promptly found and arrested the man"}
{"id":"t.race","label":"Next Tuesday, at the fall of the flag","after":"t.train_beyond_reading","para":18,"quote":"at the fall of the flag next Tuesday","note":"The Wessex Cup."}
{"id":"t.gregory_stables","label":"When Inspector Gregory examined the stables and out-houses round Tavistock","after":"t.gregory_arrives","para":64,"quote":"I have also examined every stable and out-house in Tavistock, and for a radius of ten miles","note":"Before Holmes and Watson arrive; not otherwise dated."}
{"id":"t.gregory_mapleton","label":"When Inspector Gregory examined the Mapleton stables","after":"t.gregory_arrives","para":66,"quote":"We have, however, examined the stables, and there is nothing to connect him with the affair","note":"Before Holmes and Watson arrive; not ordered against the other searches."}
{"id":"t.gypsies_gone","label":"Tuesday, when the gypsies were gone","after":"t.crime","para":62,"quote":"On Tuesday they were gone","note":"The gypsies were encamped on Monday night within a mile of the spot of the murder (¶62)."}
{"id":"t.gypsy_traces_found","label":"When the traces of the gypsies' camp were found","after":["t.gregory_arrives","t.gypsies_gone"],"para":62,"quote":"We have found traces which show that a party of gypsies encamped on Monday night","note":"Before Holmes and Watson arrive."}
{"id":"t.simpson_summers","label":"Two summers when Fitzroy Simpson lodged at Tavistock","after":"t.before","para":58,"quote":"He has twice lodged at Tavistock in the summer","note":"Before the story; two stays, not otherwise dated."}
{"id":"t.brown_bets","label":"When Silas Brown laid his bets upon the Wessex Cup","after":"t.before","para":66,"quote":"Silas Brown, the trainer, is known to have had large bets upon the event","note":"Before the race; not otherwise dated."}
{"id":"t.simpson_lost_cravat","label":"When Fitzroy Simpson says he lost his cravat","after":"t.before","para":60,"quote":"declares that he had lost it","note":"Simpson's claim only; the maid says the stranger wore it on Monday evening (¶35)."}
{"id":"t.tavistock_arrival","label":"Thursday evening, at Tavistock station","after":["t.train_beyond_reading","t.gregory_stables","t.gregory_mapleton","t.gypsy_traces_found"],"para":47,"quote":"It was evening before we reached the little town of Tavistock","note":"Colonel Ross and Inspector Gregory meet them in the station (¶47–50)."}
{"id":"t.landau_drive","label":"Thursday evening, driving in the landau through Tavistock","after":"t.tavistock_arrival","para":51,"quote":"A minute later we were all seated in a comfortable landau, and were rattling through the quaint old Devonshire city","note":"Gregory's talk of the case with Holmes (¶51–68); the moor is being scoured for the gypsies at this time (¶64)."}
{"id":"t.villa_arrival","label":"Thursday evening, the landau pulls up at a red-brick villa","labels":[{"from":69,"label":"Thursday evening, the landau pulls up at a red-brick villa"},{"from":72,"label":"Thursday evening, the landau pulls up at Straker's villa"}],"after":["t.landau_drive","t.body_brought_back","t.mrs_straker_tells"],"para":69,"quote":"A few minutes later our driver pulled up at a neat little red-brick villa","note":"Holmes sits on in the carriage, absorbed, until Watson touches his arm (¶69–70). The talk with Gregory and the Colonel at the door follows (¶71–77)."}
{"id":"t.sitting_room","label":"Thursday evening, Straker's pocket things laid out in the sitting-room","after":"t.villa_arrival","para":78,"quote":"We all filed into the front room and sat round the central table","note":"Gregory opens the tin box. The knife, the papers and the milliner's account are examined (¶78–85)."}
{"id":"t.passage_mrs_straker","label":"Thursday evening, Mrs. Straker in the passage","after":"t.sitting_room","para":86,"quote":"As we emerged from the sitting-room a woman, who had been waiting in the passage","note":"Holmes asks about the garden-party at Plymouth (¶86–92)."}
{"id":"t.inquest","label":"The next day, the inquest","after":"t.villa_arrival","para":73,"quote":"The inquest is to-morrow"}
{"id":"t.body_brought_back","label":"When Straker's body was brought back to his house","after":"t.morning_search","para":73,"quote":"Yes; he lies upstairs","note":"Holmes's 'Straker was brought back here, I presume?' (¶72). Not otherwise dated. The things from his pockets go into Gregory's tin box at some time after the body was found."}
{"id":"t.mrs_straker_tells","label":"When Mrs. Straker told the Inspector of the knife and of Derbyshire","after":"t.morning_search","para":82,"quote":"His wife tells us that the knife had lain upon the dressing-table","note":"Also told in ¶84: 'Mrs. Straker tells us that Derbyshire was a friend of her husband's'. This was before Holmes arrived; it is not otherwise dated."}
{"id":"t.derbyshire_letters","label":"The times when letters for William Derbyshire were addressed to Straker's house","after":"t.before","para":84,"quote":"occasionally his letters were addressed here","note":"This is what Mrs. Straker says. It is undated and in the past."}
{"id":"t.milliner_account","label":"When Madame Lesurier made out the account to William Derbyshire","after":"t.before","para":84,"quote":"a milliner’s account for thirty-seven pounds fifteen made out by Madame Lesurier, of Bond Street, to William Derbyshire","note":"The text does not date it. The account was in Straker's pocket at his death, so it comes before the crime, but the text does not order it against that point."}
{"id":"t.plymouth_party","label":"Some little time ago, a garden-party in Plymouth","after":"t.before","para":89,"quote":"Surely I met you in Plymouth at a garden-party some little time ago","note":"This is Holmes's claim, and Mrs. Straker denies it (¶90). The dove-coloured silk costume belongs to this claim (¶91–92)."}
{"id":"t.walk_to_hollow","label":"Thursday evening, the short walk across the moor to the hollow","after":"t.passage_mrs_straker","para":93,"quote":"A short walk across the moor took us to the hollow in which the body had been found","note":"Holmes follows the Inspector outside from Straker's house."}
{"id":"t.at_hollow","label":"Thursday evening, at the hollow where the body was found","after":"t.walk_to_hollow","para":93,"quote":"At the brink of it was the furze-bush upon which the coat had been hung","note":"Talk of the wind, the coat and the matting. Holmes studies the mud, finds the vesta and compares the boots (¶94–108). The Colonel looks at his watch and asks about the entries (¶110–112)."}
{"id":"t.coat_laid","label":"When the overcoat was laid across the furze-bush","after":"t.straker_leaves","para":97,"quote":"Yes, it was laid across the bush","note":"This is on the night of the crime, when there was no wind but very heavy rain (¶94–95). It comes before the coat was seen from the knoll (¶35), but the text does not order it against the struggle."}
{"id":"t.vesta_dropped","label":"When the half-burned wax vesta came into the mud of the hollow","after":"t.before","para":102,"quote":"It was a wax vesta half burned","note":"The text does not date it. It was buried in the mud and overlooked until Holmes looked for it."}
{"id":"t.shoe_cast","label":"When Silver Blaze cast the horseshoe in the Inspector's bag","after":"t.before","para":101,"quote":"a cast horseshoe of Silver Blaze","note":"The text does not date it."}
{"id":"t.ground_trampled","label":"Since Monday night, the feet trampling the ground at the hollow","after":"t.morning_search","para":98,"quote":"No doubt many feet have been here since Monday night","note":"This is when the matting was laid at the side and stood upon (¶99). It comes before Holmes arrives at the hollow."}
{"id":"t.gregory_examines_ground","label":"When the Inspector examined the ground a hundred yards round the hollow","after":"t.gregory_arrives","para":108,"quote":"I have examined the ground very carefully for a hundred yards in each direction","note":"This was before Holmes arrived. The boot, the shoe and the horseshoe went into the Inspector's bag at some time before this scene (¶101)."}
{"id":"t.holmes_moor_walk","label":"Thursday evening, before dark, Holmes's walk over the moor","after":"t.at_hollow","para":109,"quote":"I should like to take a little walk over the moor before it grows dark","note":"Holmes and Watson walk slowly across the moor as the sun sinks behind the Mapleton stables. Holmes reasons out where the horse has gone (¶113–116)."}
{"id":"t.ross_back_to_house","label":"Thursday evening, the Colonel and the Inspector back at Straker's house","after":"t.at_hollow","para":112,"quote":"You will find us at poor Straker's house when you have finished your walk","note":"The Colonel asks the Inspector to come back with him (¶110)."}
{"id":"t.drive_to_tavistock","label":"Thursday evening, the drive together into Tavistock","after":["t.holmes_moor_walk","t.ross_back_to_house","t.set_off_pyland"],"para":112,"quote":"we can drive together into Tavistock","note":"This is planned. It comes after Holmes's walk."}
{"id":"t.next_day_ground","label":"The next day, when Holmes means to know his ground","after":"t.holmes_moor_walk","para":109,"quote":"that I may know my ground to-morrow","note":"This is the same day as the inquest (¶73), but the text does not order the two."}
{"id":"t.long_hollow_tracks","label":"Thursday evening, at the long hollow towards Mapleton","after":"t.holmes_moor_walk","para":117,"quote":"a few more minutes brought us to the hollow in question","note":"Holmes finds the horse's track and fits the horseshoe to it."}
{"id":"t.near_mapleton_tracks","label":"Thursday evening, picking up the tracks again close to Mapleton","after":"t.long_hollow_tracks","para":119,"quote":"only to pick them up once more quite close to Mapleton","note":"They cross the marshy bottom and the dry turf, and lose the tracks for half a mile. Here a man's track appears beside the horse's."}
{"id":"t.follow_toward_pyland","label":"Thursday evening, following the double track towards King's Pyland","after":"t.near_mapleton_tracks","para":122,"quote":"we both followed along after it","note":"Watson sees the same tracks coming back in the opposite direction."}
{"id":"t.follow_return_track","label":"Thursday evening, following the return track","after":"t.follow_toward_pyland","para":123,"quote":"Let us follow the return track"}
{"id":"t.mapleton_gates","label":"Thursday evening, at the gates of the Mapleton stables","after":"t.follow_return_track","para":124,"quote":"It ended at the paving of asphalt which led up to the gates of the Mapleton stables","note":"The groom runs out. Silas Brown comes out and Holmes whispers to him (¶124–135)."}
{"id":"t.brown_parlour","label":"Thursday evening, Holmes and Silas Brown in the parlour","after":"t.mapleton_gates","para":136,"quote":"Now, Mr. Brown, I am quite at your disposal","note":"About twenty minutes (¶137). Watson waits outside."}
{"id":"t.brown_reappears","label":"Thursday evening, at dusk, Holmes and Silas Brown reappear","after":"t.brown_parlour","para":137,"quote":"It was twenty minutes, and the reds had all faded into greys before Holmes and the trainer reappeared","note":"Brown promises Holmes his instructions will be done (¶138–143)."}
{"id":"t.set_off_pyland","label":"Thursday evening, setting off for King's Pyland","after":"t.brown_reappears","para":143,"quote":"we set off for King’s Pyland"}
{"id":"t.tomorrow_five","label":"Five o'clock the next morning, when Holmes speaks of calling on Silas Brown","after":"t.mapleton_gates","para":126,"quote":"if I were to call at five o’clock to-morrow morning","note":"Holmes puts this to the groom as a question. The text does not order it against the inquest or Holmes's study of his ground."}
{"id":"t.holmes_writes_brown","label":"The next day, when Silas Brown shall hear from Holmes","after":"t.brown_reappears","para":143,"quote":"you shall hear from me to-morrow","note":"Holmes also says 'I shall write to you about it' (¶141)."}
{"id":"t.brown_promise_kept","label":"When what Silas Brown promises shall be there","after":"t.brown_reappears","para":140,"quote":"It shall be there","note":"This is promised and not dated. The text does not say what it is or where."}
{"id":"t.horse_track_made","label":"When the horse's track was made in the long hollow","after":"t.before","para":117,"quote":"The track of a horse was plainly outlined in the soft earth","note":"The text does not date it. Holmes supposes the horse crossed there after the tragedy, when the hollow 'must have been very wet on Monday night' (¶116). The horseshoe fits the print."}
{"id":"t.man_beside_horse","label":"When a man's track came beside the horse's near Mapleton","after":"t.horse_track_made","para":119,"quote":"A man’s track was visible beside the horse’s","note":"The horse was alone before this point along the trail (¶120–121)."}
{"id":"t.tracks_toward_pyland","label":"When the double track turned off towards King's Pyland","after":"t.man_beside_horse","para":122,"quote":"The double track turned sharp off and took the direction of King’s Pyland"}
{"id":"t.tracks_back","label":"When the same tracks came back to the Mapleton gates","after":"t.tracks_toward_pyland","para":122,"quote":"the same tracks coming back again in the opposite direction","note":"The return track ends at the asphalt paving to the Mapleton gates (¶124)."}
{"id":"t.statements","label":"When the witnesses' statements were taken","after":["t.morning_search","t.hunter_recovers"],"para":26,"quote":"The girl has sworn","note":"The sworn and other statements to the police; not otherwise dated."}

## Accounts so far

{"id":"acct.watson","label":"What Watson sees and hears himself","origin":"watson","how":"saw","facts":["f.breakfast","f.watson_rooms_breakfast","f.holmes_rooms_breakfast","f.holmes_must_go","f.holmes_intends_kp","f.case_talked_of","f.holmes_rooms_wed","f.holmes_rambles","f.holmes_pipe","f.holmes_carries_pipe","f.holmes_deaf","f.agent_sends_papers","f.holmes_tosses_papers","f.papers_in_corner","f.watson_knows_brooding","f.watson_expected","f.watson_offers","f.holmes_welcomes","f.holmes_unique","f.holmes_intends_train","f.holmes_intends_explain","f.holmes_asks_glass","f.glass_owner","f.holmes_paddington","f.watson_paddington","f.holmes_procures","f.watson_carriage","f.holmes_carriage","f.train_to_exeter","f.holmes_cap","f.holmes_reads_papers","f.holmes_carries_papers","f.train_reading","f.papers_under_seat","f.holmes_offers_cigars","f.holmes_window","f.holmes_has_watch","f.holmes_says_speed","f.watson_no_posts","f.holmes_no_posts","f.holmes_asks_matter","f.watson_read_papers","f.holmes_method","f.holmes_surmise","f.cal_thu","f.watson_asks_why","f.holmes_blunder","f.holmes_not_wasted","f.watson_asks_theory","f.holmes_grip","f.holmes_will_enumerate","f.press_to_watson","f.chronicle_to_watson","f.holmes_tells_watson","f.watson_lies_back","f.watson_smokes","f.holmes_counts","f.holmes_tells_sketch","f.holmes_says_interest","f.watson_asks_door","f.holmes_praises","f.holmes_main_facts","f.holmes_will_recap","f.holmes_gregory_competent","f.holmes_gregory_imagination","f.holmes_mark","f.holmes_asks_light","f.watson_listened","f.watson_familiar","f.watson_not_appreciated","f.watson_self_wound","f.holmes_probable","f.holmes_point_gone","f.watson_fails","f.holmes_objections","f.holmes_police_theory","f.holmes_improbable","f.holmes_test","f.holmes_stuck","f.clock_evening_tav","f.watson_tav_station","f.holmes_tav_station","f.tavistock_small","f.tavistock_middle","f.ross_tav_station","f.gregory_tav_station","f.gregory_looks","f.ross_looks","f.ross_frock","f.ross_gaiters_w","f.ross_glass_w","f.ross_sportsman","f.gregory_rising","f.gregory_detective_member","f.watson_sees_pair","f.ross_delighted","f.ross_inspector_done_all","f.ross_intends_avenge","f.holmes_asks_developments","f.gregory_little_progress","f.landau_outside","f.gregory_intends_drive","f.watson_landau","f.holmes_landau","f.ross_landau","f.gregory_landau","f.landau_through_town","f.gregory_pours_out","f.holmes_interjects","f.ross_leans_back","f.ross_hat_w","f.watson_listens_drive","f.gregory_theory","f.gregory_net","f.gregory_believes_simpson","f.gregory_circumstantial","f.holmes_asks_knife","f.gregory_self_wound","f.holmes_watson_suggested","f.holmes_tells_against","f.gregory_no_knife","f.gregory_case_strong","f.gregory_jury","f.holmes_shakes_head","f.holmes_counsel","f.holmes_why_out","f.holmes_asks_key","f.holmes_asks_chemist","f.holmes_asks_hide","f.holmes_asks_paper","f.gregory_not_formidable","f.gregory_not_stranger","f.gregory_opium_london","f.gregory_key_hurled","f.gregory_pits","f.holmes_asks_cravat","f.gregory_new_element","f.holmes_pricks_ears","f.gregory_gypsy_theory","f.holmes_possible","f.holmes_asks_mapleton","f.gregory_not_neglect","f.gregory_mapleton_interest","f.gregory_nothing_brown","f.holmes_asks_link","f.gregory_no_link","f.gregory_tells_drive","f.gregory_tells_simpson","f.holmes_leans_back_carriage","f.talk_ceases","f.driver_pulls_up","f.landau_at_villa","f.villa_red_brick","f.villa_by_road","f.outbuilding_position","f.moor_ferns","f.steeples_visible","f.mapleton_visible","f.watson_springs_out","f.gregory_springs_out","f.ross_springs_out","f.holmes_stays_landau","f.holmes_absorbed","f.watson_touches_arm","f.holmes_starts_out","f.holmes_out_villa","f.ross_surprised","f.holmes_daydreaming","f.holmes_gleam","f.watson_sees_gleam","f.watson_believes_clue","f.watson_no_idea_clue","f.gregory_offers_scene","f.holmes_intends_stay","f.holmes_asks_brought_back","f.holmes_asks_service","f.ross_excellent_servant","f.holmes_asks_inventory","f.gregory_has_things","f.holmes_glad_see","f.watson_sitting_room","f.holmes_sitting_room","f.gregory_sitting_room","f.ross_sitting_room","f.gregory_unlocks_box","f.things_on_table","f.watson_sees_things","f.pouch_contents","f.knife_described","f.knife_marked","f.knife_maker","f.holmes_examines_knife","f.holmes_singular_knife","f.knife_stained","f.holmes_same_knife","f.holmes_asks_watson_knife","f.watson_cataract","f.holmes_thought_so","f.holmes_strange_carry","f.gregory_poor_weapon","f.holmes_very_possible","f.holmes_asks_papers","f.holmes_glances_account","f.holmes_madam_tastes","f.holmes_22_guineas","f.holmes_nothing_more","f.holmes_intends_scene","f.party_emerge","f.holmes_passage","f.gregory_passage","f.mrs_waiting_passage","f.mrs_hand_sleeve","f.mrs_haggard","f.watson_sees_mrs","f.mrs_asks_found","f.gregory_not_found","f.mrs_straker_named","f.holmes_plymouth","f.mrs_mistaken","f.holmes_sworn","f.holmes_dove_dress","f.mrs_never_dress","f.mrs_tells_gregory","f.mrs_tells_gregory_derbyshire","f.gregory_tells_house","f.holmes_settles","f.holmes_apologises","f.party_walk","f.watson_hollow","f.holmes_hollow","f.gregory_hollow","f.ross_hollow","f.bush_at_brink","f.watson_sees_bush","f.holmes_no_wind","f.gregory_no_wind","f.holmes_coat_placed","f.gregory_coat_laid","f.holmes_interest","f.holmes_trampled","f.gregory_matting","f.holmes_excellent","f.gregory_bag_says","f.gregory_has_bag","f.holmes_surpass","f.holmes_takes_bag","f.holmes_carries_bag","f.holmes_descends","f.holmes_moves_matting","f.matting_central","f.holmes_studies_mud","f.holmes_whats_this","f.holmes_finds_vesta","f.vesta_in_mud","f.vesta_half_burned","f.vesta_muddy","f.watson_sees_vesta","f.gregory_overlooked","f.gregory_annoyed","f.holmes_invisible","f.holmes_looking","f.gregory_asks_expected","f.holmes_not_unlikely","f.holmes_compares","f.holmes_rim","f.holmes_crawls","f.gregory_no_tracks","f.holmes_rises","f.holmes_impertinence","f.holmes_intends_walk","f.clock_before_dark","f.holmes_horseshoe_luck","f.holmes_has_horseshoe","f.ross_impatient","f.ross_glances_watch","f.ross_has_watch","f.ross_asks_inspector","f.ross_considers_scratch","f.horse_entered","f.holmes_let_stand","f.ross_bows","f.ross_glad_opinion","f.ross_find_us","f.ross_intends_house","f.ross_intends_drive","f.gregory_tells_hollow"]}
{"id":"acct.press","label":"What the newspapers report","origin":null,"how":"report","facts":["f.horse_favourite","f.horse_vanishes","f.straker_trainer","f.straker_murdered","f.horse_name","f.straker_name","f.horse_remarkable","f.dartmoor_sparse","f.simpson_arrested","f.simpson_young","f.horse_not_found","f.horse_stock","f.isonomy_famous","f.horse_record","f.horse_fifth_year","f.horse_prizes","f.horse_odds","f.horse_public_favourite","f.public_bets","f.race_time","f.cal_race","f.kp_aware","f.stables_owner","f.precautions","f.straker_jockey","f.straker_heavy","f.straker_served","f.straker_honest","f.lads_under_straker","f.establishment_small","f.horses_kept","f.blaze_member","f.lads_routine","f.lads_characters","f.straker_married","f.straker_lives","f.villa_position","f.straker_childless","f.straker_keeps_maid","f.straker_comfortable","f.country_lonely","f.villas_north","f.villas_built","f.tavistock_west","f.mapleton_position","f.mapleton_larger","f.mapleton_owner","f.brown_manages","f.moor_wild","f.gypsies_moor","f.cal_monday","f.desborough_second","f.desborough_brown","f.brown_charge","f.police_tells_press"]}
{"id":"acct.ross","label":"Colonel Ross's telegram","origin":"ross","how":"own","facts":["f.ross_sends","f.ross_owner"]}
{"id":"acct.gregory","label":"Inspector Gregory's telegram","origin":"gregory","how":"own","facts":["f.gregory_sends","f.gregory_role"]}
{"id":"acct.holmes","label":"Holmes's account of his own doings","origin":"holmes","how":"did","facts":["f.cal_tue","f.holmes_receives","f.holmes_believed_found","f.holmes_expected_abductor","f.holmes_decides","f.papers_to_holmes","f.ross_tells_holmes","f.gregory_tells_holmes","f.holmes_door_important","f.holmes_sent_wire","f.wire_reply"]}
{"id":"acct.edith","label":"Edith Baxter's sworn account","origin":"edith_baxter","how":"saw","facts":["f.edith_name","f.edith_role","f.edith_lives","f.edith_carries_supper","f.edith_has_supper","f.supper_contents","f.clock_after_nine","f.edith_no_liquid","f.edith_lantern","f.night_dark","f.path_open_moor","f.edith_on_path","f.stranger_appears","f.stranger_on_path","f.stranger_bearing","f.stranger_suit","f.stranger_capw","f.stranger_gaitersw","f.stranger_has_stick","f.stranger_pale","f.stranger_nervous","f.edith_age_guess","f.edith_sees_stranger","f.stranger_asks_where","f.stranger_says_lost","f.edith_says_close","f.stranger_luck","f.stranger_knows_routine","f.stranger_guess_supper","f.stranger_bribe_dress","f.stranger_takes_paper","f.stranger_carries_paper","f.stranger_asks_give","f.edith_frightened","f.edith_runs","f.edith_at_window","f.window_open","f.hunter_at_table","f.edith_begins_tell","f.stranger_returns","f.stranger_greets","f.stranger_looks_through","f.stranger_packet_hand","f.edith_sees_packet","f.hunter_asks_business","f.stranger_offers_pocket","f.stranger_two_horses","f.stranger_asks_tip","f.stranger_asks_bayard","f.hunter_touts","f.hunter_runs_dog","f.edith_flees","f.stranger_leaning","f.edith_looks_back","f.edith_recognises"]}
{"id":"acct.hunter","label":"Ned Hunter's account","origin":"hunter","how":"saw","facts":["f.horses_exercised","f.stables_locked","f.clock_nine","f.lads_to_house","f.lads_kitchen","f.two_lads_member","f.hunter_member","f.hunter_name","f.hunter_guard","f.hunter_stables","f.tap_in_stables","f.drink_rule","f.hunter_at_table","f.window_open","f.stranger_returns","f.stranger_greets","f.stranger_looks_through","f.hunter_asks_business","f.stranger_offers_pocket","f.stranger_two_horses","f.stranger_asks_tip","f.stranger_asks_bayard","f.hunter_touts","f.hunter_runs_dog","f.dog_kept","f.hunter_out_dog","f.stranger_gone","f.hunter_searches","f.no_trace","f.hunter_locks","f.door_locked_after","f.hunter_waits","f.lads_back","f.hunter_tells_straker","f.hunter_recovers","f.hunter_cravat","f.hunter_believes_drugged","f.window_small"]}
{"id":"acct.mrs_straker","label":"Mrs. Straker's account","origin":"mrs_straker","how":"saw","facts":["f.straker_excited","f.straker_missed_significance","f.straker_uneasy","f.mrs_straker_role","f.mrs_straker_lives","f.mrs_straker_wakes","f.clock_one","f.mrs_straker_villa","f.straker_villa_one","f.straker_dressing","f.mrs_straker_asks","f.straker_says_anxious","f.mrs_straker_begs","f.rain","f.mrs_straker_hears_rain","f.straker_mackintosh","f.straker_leaves_house","f.mrs_straker_wakes_seven","f.clock_seven","f.straker_not_returned","f.mrs_straker_dresses","f.mrs_straker_calls_maid","f.mrs_straker_sets_off","f.mrs_at_stables","f.edith_at_stables","f.door_open","f.hunter_stupor","f.hunter_on_chair","f.stall_empty","f.horse_stall_kept","f.no_straker","f.mrs_straker_observes"]}
{"id":"acct.lads","label":"The two lads' account","origin":"two_lads","how":"saw","facts":["f.lads_loft","f.loft_above","f.lads_aroused","f.lads_heard_nothing","f.lads_sound_sleepers"]}
{"id":"acct.searchers","label":"What the searchers found","origin":"two_women","how":"saw","facts":["f.hunter_drugged","f.hunter_no_sense","f.hunter_left","f.edith_member","f.mrs_member","f.lads_search","f.women_search","f.lads_hope","f.women_hope","f.lads_knoll","f.women_knoll","f.knoll_position","f.knoll_view","f.no_sign_horse","f.tragedy_seen","f.coat_on_bush","f.bush_position","f.hollow_position","f.body_hollow","f.straker_dead"]}
{"id":"acct.analysis","label":"The analysis of the supper","origin":null,"how":"analysis","facts":["f.supper_opium"]}
{"id":"acct.simpson","label":"Fitzroy Simpson's statement","origin":"simpson","how":"said","facts":["f.simpson_came_info","f.simpson_came","f.simpson_admits","f.stranger_is_simpson","f.simpson_no_designs","f.simpson_cannot_account","f.simpson_says_note","f.simpson_cravat_his","f.simpson_says_lost"]}
{"id":"acct.police","label":"What the police hold","origin":"police","how":"bundle","parts":["acct.edith","acct.hunter","acct.mrs_straker","acct.lads","acct.searchers","acct.analysis","acct.simpson"],"facts":["f.window_small","f.head_shattered","f.thigh_cut","f.straker_defended","f.knife_right","f.knife_bloody","f.cravat_left","f.mud_proofs","f.horse_in_hollow","f.horse_disappeared","f.reward_offered","f.gypsies_alert","f.no_news","f.house_same_dish","f.house_no_effect","f.gregory_member","f.gregory_arrives","f.gregory_arrests","f.suspicion_simpson","f.simpson_lives","f.simpson_name","f.simpson_birth","f.simpson_squandered","f.simpson_bookmaker","f.betting_book_owner","f.betting_examined","f.book_contents","f.simpson_bets","f.cravat_confronted","f.cravat_owner","f.simpson_pale","f.simpson_wet","f.simpson_out_storm","f.storm","f.stick_owner","f.stick_kind","f.stick_could","f.straker_succumbed","f.simpson_no_wound","f.knife_owner","f.bridle_missing","f.edith_swears","f.hunter_tells_police","f.mrs_tells_police","f.lads_tell_police","f.searchers_tell_police","f.analysis_tells","f.simpson_statement","f.gregory_reports_simpson"]}
{"id":"acct.gregory_drive","label":"What Inspector Gregory reports on the drive","origin":"gregory","how":"report","facts":["f.note_in_purse","f.purse_owner","f.simpson_lodged","f.traces_found","f.gypsies_encamped","f.camp_position","f.gypsy_party_member","f.gypsies_left","f.cal_tue_gypsies","f.moor_scoured","f.gregory_searched_stables","f.stables_no_horse","f.desborough_second_betting","f.brown_large_bets","f.brown_trainer","f.brown_no_friend","f.mapleton_examined"]}
{"id":"acct.gregory_house","label":"What Inspector Gregory reports at the house","origin":"gregory","how":"report","facts":["f.straker_brought_back","f.straker_upstairs","f.inquest_tomorrow","f.box_location","f.straker_had_vestas","f.straker_had_candle","f.straker_had_pipe","f.straker_had_pouch","f.straker_had_watch","f.straker_had_sovereigns","f.straker_had_pencil","f.straker_had_papers","f.straker_had_account","f.cork_guarded","f.cork_beside_body","f.police_find_cork","f.papers_hay","f.papers_ross_letter","f.ross_wrote_letter","f.papers_milliner","f.account_sum","f.lesurier_makes_account","f.lesurier_bond_street","f.lesurier_milliner","f.account_to_derbyshire","f.derbyshire_name"]}
{"id":"acct.mrs_straker_inspector","label":"What Mrs. Straker told the Inspector","origin":"mrs_straker","how":"said","facts":["f.knife_on_table","f.straker_picks_knife","f.straker_carries_knife_leaving","f.straker_in_bedroom","f.derbyshire_friend","f.derbyshire_letters"]}
{"id":"acct.gregory_hollow","label":"What Inspector Gregory reports at the hollow","origin":"gregory","how":"report","facts":["f.no_wind","f.heavy_rain","f.coat_laid","f.coat_laid_loc","f.matting_laid","f.police_stood_matting","f.bag_boot","f.bag_shoe","f.bag_horseshoe","f.boot_owner","f.straker_wore_boots","f.shoe_owner","f.horseshoe_owner","f.shoe_cast","f.gregory_missed_vesta","f.gregory_examined_ground"]}

## Facts so far

{"id":"f.breakfast","of":"watson","attr":"action","value":"sits down to breakfast with Holmes","time":{"at":"t.thu_breakfast"},"para":1,"quote":"as we sat down together to our breakfast one morning"}
{"id":"f.watson_rooms_breakfast","of":"watson","attr":"location","value":"holmes_rooms","detail":"at breakfast","basis":"implied","time":{"at":"t.thu_breakfast"},"para":1,"quote":"as we sat down together to our breakfast one morning"}
{"id":"f.holmes_rooms_breakfast","of":"holmes","attr":"location","value":"holmes_rooms","detail":"at breakfast","basis":"implied","time":{"at":"t.thu_breakfast"},"para":1,"quote":"as we sat down together to our breakfast one morning"}
{"id":"f.holmes_must_go","of":"holmes","attr":"intends","value":"to go","time":{"at":"t.thu_breakfast"},"para":1,"quote":"I am afraid, Watson, that I shall have to go"}
{"id":"f.holmes_intends_kp","of":"holmes","attr":"intends","value":"to go to King's Pyland on Dartmoor","time":{"at":"t.thu_breakfast"},"para":3,"quote":"To Dartmoor; to King’s Pyland."}
{"id":"f.case_talked_of","of":"england","attr":"condition","value":"the extraordinary case is the one topic of conversation throughout the country","time":{"at":"t.thu_breakfast"},"para":4,"quote":"which was the one topic of conversation through the length and breadth of England"}
{"id":"f.holmes_rooms_wed","of":"holmes","attr":"location","value":"holmes_rooms","time":{"at":"t.wed"},"para":4,"quote":"For a whole day my companion had rambled about the room"}
{"id":"f.holmes_rambles","of":"holmes","attr":"action","value":"rambles about the room, chin on chest and brows knitted","time":{"at":"t.wed"},"para":4,"quote":"rambled about the room with his chin upon his chest and his brows knitted"}
{"id":"f.holmes_pipe","of":"holmes","attr":"action","value":"charges and recharges his pipe with the strongest black tobacco","time":{"at":"t.wed"},"para":4,"quote":"charging and recharging his pipe with the strongest black tobacco"}
{"id":"f.holmes_carries_pipe","of":"holmes","attr":"carrying","value":"holmes_pipe","basis":"implied","time":{"at":"t.wed"},"para":4,"quote":"charging and recharging his pipe"}
{"id":"f.holmes_deaf","of":"holmes","attr":"condition","value":"deaf to Watson's questions and remarks","time":{"at":"t.wed"},"para":4,"quote":"absolutely deaf to any of my questions or remarks"}
{"id":"f.agent_sends_papers","of":"news_agent","attr":"action","value":"sends up fresh editions of every paper","time":{"at":"t.wed"},"para":4,"quote":"Fresh editions of every paper had been sent up by our news agent"}
{"id":"f.holmes_tosses_papers","of":"holmes","attr":"action","value":"glances over the fresh editions and tosses them into a corner","time":{"at":"t.wed"},"para":4,"quote":"only to be glanced over and tossed down into a corner"}
{"id":"f.papers_in_corner","of":"fresh_editions","attr":"location","value":"holmes_rooms","detail":"tossed down into a corner","time":{"from":"t.wed"},"para":4,"quote":"tossed down into a corner"}
{"id":"f.watson_knows_brooding","of":"watson","attr":"knows","value":"Holmes is brooding over the disappearance of the favourite and the murder of its trainer","time":{"at":"t.wed"},"para":4,"quote":"I knew perfectly well what it was over which he was brooding"}
{"id":"f.horse_favourite","of":"silver_blaze","attr":"role","value":"favourite for the Wessex Cup","time":{"at":"t.crime"},"para":4,"quote":"the favourite for the Wessex Cup"}
{"id":"f.horse_vanishes","of":"silver_blaze","attr":"action","value":"disappears","time":{"at":"t.crime"},"para":4,"quote":"the singular disappearance of the favourite for the Wessex Cup"}
{"id":"f.straker_trainer","of":"straker","attr":"role","value":"trainer of the favourite","time":{"at":"t.crime"},"para":4,"quote":"the tragic murder of its trainer"}
{"id":"f.straker_murdered","of":"straker","attr":"condition","value":"murdered","time":{"from":"t.crime"},"para":4,"quote":"the tragic murder of its trainer"}
{"id":"f.watson_expected","of":"watson","attr":"believes","value":"Holmes would set out for the scene; he had expected and hoped for it","time":{"at":"t.thu_breakfast"},"para":4,"quote":"it was only what I had both expected and hoped for"}
{"id":"f.watson_offers","of":"watson","attr":"intends","value":"to go down with Holmes","time":{"at":"t.thu_breakfast"},"para":5,"quote":"I should be most happy to go down with you"}
{"id":"f.holmes_welcomes","of":"holmes","attr":"says","value":"Watson would do him a great favour by coming","to":"watson","time":{"at":"t.thu_breakfast"},"para":6,"quote":"you would confer a great favour upon me by coming"}
{"id":"f.holmes_unique","of":"holmes","attr":"believes","value":"points about the case promise to make it absolutely unique","time":{"at":"t.thu_breakfast"},"para":6,"quote":"there are points about the case which promise to make it an absolutely unique one"}
{"id":"f.holmes_intends_train","of":"holmes","attr":"intends","value":"to catch their train at Paddington","time":{"at":"t.thu_breakfast"},"para":6,"quote":"just time to catch our train at Paddington"}
{"id":"f.holmes_intends_explain","of":"holmes","attr":"intends","value":"to go further into the matter on the journey","time":{"at":"t.thu_breakfast"},"para":6,"quote":"I will go further into the matter upon our journey"}
{"id":"f.holmes_asks_glass","of":"holmes","attr":"action","act":"ask","thing":"field_glass","value":"asks Watson to bring his field-glass","to":"watson","time":{"at":"t.thu_breakfast"},"para":6,"quote":"You would oblige me by bringing with you your very excellent field-glass"}
{"id":"f.glass_owner","of":"field_glass","attr":"owner","value":"watson","basis":"implied","time":{"at":"t.thu_breakfast"},"para":6,"quote":"your very excellent field-glass"}
{"id":"f.holmes_paddington","of":"holmes","attr":"location","value":"paddington","basis":"implied","time":{"at":"t.paddington"},"para":7,"quote":"which he had procured at Paddington"}
{"id":"f.watson_paddington","of":"watson","attr":"location","value":"paddington","basis":"implied","time":{"at":"t.paddington"},"para":7,"quote":"which he had procured at Paddington"}
{"id":"f.holmes_procures","of":"holmes","attr":"action","value":"procures a bundle of fresh papers","time":{"at":"t.paddington"},"para":7,"quote":"the bundle of fresh papers which he had procured at Paddington"}
{"id":"f.watson_carriage","of":"watson","attr":"location","value":"carriage","detail":"in the corner","time":{"from":"t.train_out","to":"t.train_beyond_reading"},"para":7,"quote":"I found myself in the corner of a first-class carriage"}
{"id":"f.holmes_carriage","of":"holmes","attr":"location","value":"carriage","basis":"implied","time":{"from":"t.train_out","to":"t.train_beyond_reading"},"para":7,"quote":"while Sherlock Holmes"}
{"id":"f.train_to_exeter","of":"train","attr":"action","value":"flies along en route for Exeter","time":{"from":"t.train_out","to":"t.train_beyond_reading"},"para":7,"quote":"flying along en route for Exeter"}
{"id":"f.holmes_cap","of":"holmes","attr":"wearing","value":"travelling_cap","time":{"from":"t.train_out"},"para":7,"quote":"his sharp, eager face framed in his ear-flapped travelling-cap"}
{"id":"f.holmes_reads_papers","of":"holmes","attr":"action","value":"dips rapidly into the bundle of fresh papers","time":{"at":"t.train_out"},"para":7,"quote":"dipped rapidly into the bundle of fresh papers"}
{"id":"f.holmes_carries_papers","of":"holmes","attr":"carrying","value":"bundle_of_papers","time":{"from":"t.paddington","to":"t.train_beyond_reading"},"para":7,"quote":"the bundle of fresh papers which he had procured at Paddington"}
{"id":"f.train_reading","of":"train","attr":"location","value":"reading","detail":"passing","basis":"implied","time":{"at":"t.train_reading"},"para":7,"quote":"We had left Reading far behind us"}
{"id":"f.papers_under_seat","of":"bundle_of_papers","attr":"location","value":"carriage","detail":"under the seat","time":{"from":"t.train_beyond_reading"},"para":7,"quote":"he thrust the last one of them under the seat"}
{"id":"f.holmes_offers_cigars","of":"holmes","attr":"action","act":"give","thing":"cigar_case","value":"offers Watson his cigar-case","to":"watson","time":{"at":"t.train_beyond_reading"},"para":7,"quote":"offered me his cigar-case"}
{"id":"f.holmes_window","of":"holmes","attr":"action","value":"looks out of the window and glances at his watch","time":{"at":"t.train_beyond_reading"},"para":8,"quote":"looking out the window and glancing at his watch"}
{"id":"f.holmes_has_watch","of":"holmes","attr":"carrying","value":"holmes_watch","basis":"implied","time":{"at":"t.train_beyond_reading"},"para":8,"quote":"glancing at his watch"}
{"id":"f.holmes_says_speed","of":"holmes","attr":"says","value":"the train's rate is fifty-three and a half miles an hour","to":"watson","time":{"at":"t.train_beyond_reading"},"para":8,"quote":"Our rate at present is fifty-three and a half miles an hour","asserts":[{"of":"train","attr":"speed","value":"fifty-three and a half miles an hour","time":{"at":"t.train_beyond_reading"}}]}
{"id":"f.watson_no_posts","of":"watson","attr":"says","value":"he has not observed the quarter-mile posts","to":"holmes","time":{"at":"t.train_beyond_reading"},"para":9,"quote":"I have not observed the quarter-mile posts"}
{"id":"f.holmes_no_posts","of":"holmes","attr":"says","value":"he has not observed them either, but reckoned from the telegraph posts","to":"watson","time":{"at":"t.train_beyond_reading"},"para":10,"quote":"Nor have I."}
{"id":"f.posts_sixty_yards","of":"telegraph_posts","attr":"condition","value":"sixty yards apart","word":"holmes","time":{"at":"t.train_beyond_reading"},"para":10,"quote":"the telegraph posts upon this line are sixty yards apart"}
{"id":"f.holmes_asks_matter","of":"holmes","attr":"action","act":"ask","value":"asks whether Watson has looked into the murder of John Straker and the disappearance of Silver Blaze","to":"watson","time":{"at":"t.train_beyond_reading"},"para":10,"quote":"I presume that you have looked into this matter of the murder of John Straker and the disappearance of Silver Blaze?"}
{"id":"f.horse_name","of":"silver_blaze","attr":"name","value":"Silver Blaze","time":{"at":"t.train_beyond_reading"},"para":10,"quote":"the disappearance of Silver Blaze"}
{"id":"f.straker_name","of":"straker","attr":"name","value":"John Straker","time":{"at":"t.train_beyond_reading"},"para":10,"quote":"the murder of John Straker"}
{"id":"f.watson_read_papers","of":"watson","attr":"action","value":"has read what the Telegraph and the Chronicle say of the case","time":{"at":"t.watson_reads_papers"},"para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say"}
{"id":"f.holmes_method","of":"holmes","attr":"believes","value":"the case calls for sifting details rather than acquiring fresh evidence: the facts must be detached from the embellishments of theorists and reporters","time":{"at":"t.train_beyond_reading"},"para":12,"quote":"the art of the reasoner should be used rather for the sifting of details than for the acquiring of fresh evidence"}
{"id":"f.holmes_surmise","of":"holmes","attr":"says","value":"the case is beset by a plethora of surmise, conjecture and hypothesis","to":"watson","time":{"at":"t.train_beyond_reading"},"para":12,"quote":"we are suffering from a plethora of surmise, conjecture, and hypothesis"}
{"id":"f.cal_tue","of":"calendar","attr":"weekday","value":"Tuesday","time":{"at":"t.tue_evening"},"para":12,"quote":"On Tuesday evening"}
{"id":"f.ross_sends","of":"ross","attr":"action","value":"telegraphs Holmes inviting his co-operation","to":"holmes","time":{"at":"t.tue_evening"},"para":12,"quote":"I received telegrams from both Colonel Ross"}
{"id":"f.gregory_sends","of":"gregory","attr":"action","value":"telegraphs Holmes inviting his co-operation","to":"holmes","time":{"at":"t.tue_evening"},"para":12,"quote":"and from Inspector Gregory, who is looking after the case, inviting my co-operation"}
{"id":"f.holmes_receives","of":"holmes","attr":"action","value":"receives telegrams from Colonel Ross and Inspector Gregory","time":{"at":"t.tue_evening"},"para":12,"quote":"On Tuesday evening I received telegrams"}
{"id":"f.ross_owner","of":"silver_blaze","attr":"owner","value":"ross","time":{"at":"t.tue_evening"},"para":12,"quote":"Colonel Ross, the owner of the horse"}
{"id":"f.gregory_role","of":"gregory","attr":"role","value":"police inspector looking after the case","time":{"from":"t.tue_evening"},"para":12,"quote":"Inspector Gregory, who is looking after the case"}
{"id":"f.cal_thu","of":"calendar","attr":"weekday","value":"Thursday","time":{"at":"t.train_beyond_reading"},"para":13,"quote":"And this is Thursday morning."}
{"id":"f.watson_asks_why","of":"watson","attr":"action","act":"ask","value":"asks why Holmes did not go down the day before","to":"holmes","time":{"at":"t.train_beyond_reading"},"para":13,"quote":"Why didn’t you go down yesterday?"}
{"id":"f.holmes_blunder","of":"holmes","attr":"says","value":"he made a blunder","to":"watson","time":{"at":"t.train_beyond_reading"},"para":14,"quote":"Because I made a blunder"}
{"id":"f.holmes_believed_found","of":"holmes","attr":"believes","value":"the most remarkable horse in England could not long remain concealed in the sparsely inhabited north of Dartmoor","time":{"from":"t.tue_evening","to":"t.thu_breakfast"},"para":14,"quote":"I could not believe it possible that the most remarkable horse in England could long remain concealed","asserts":[{"of":"silver_blaze","attr":"condition","value":"found","time":{"before":"t.thu_breakfast"}}]}
{"id":"f.horse_remarkable","of":"silver_blaze","attr":"reputed","value":"the most remarkable horse in England","time":{"at":"t.crime"},"para":14,"quote":"the most remarkable horse in England"}
{"id":"f.dartmoor_sparse","of":"dartmoor","attr":"condition","value":"the north of Dartmoor is sparsely inhabited","time":{"at":"t.crime"},"para":14,"quote":"so sparsely inhabited a place as the north of Dartmoor"}
{"id":"f.holmes_expected_abductor","of":"holmes","attr":"believes","value":"the horse would be found, and its abductor would prove to be Straker's murderer","time":{"at":"t.wed"},"para":14,"quote":"From hour to hour yesterday I expected to hear that he had been found, and that his abductor was the murderer of John Straker"}
{"id":"f.simpson_arrested","of":"simpson","attr":"condition","value":"arrested","time":{"from":"t.simpson_arrest"},"para":14,"quote":"the arrest of young Fitzroy Simpson"}
{"id":"f.simpson_young","of":"simpson","attr":"condition","value":"young","time":{"at":"t.simpson_arrest"},"para":14,"quote":"young Fitzroy Simpson"}
{"id":"f.horse_not_found","of":"silver_blaze","attr":"condition","value":"found","neg":true,"time":{"from":"t.crime","to":"t.thu_breakfast"},"para":14,"quote":"beyond the arrest of young Fitzroy Simpson nothing had been done"}
{"id":"f.holmes_decides","of":"holmes","attr":"intends","value":"to take action himself","time":{"at":"t.thu_breakfast"},"para":14,"quote":"I felt that it was time for me to take action"}
{"id":"f.holmes_not_wasted","of":"holmes","attr":"believes","value":"the day of waiting was not wasted","time":{"at":"t.train_beyond_reading"},"para":14,"quote":"Yet in some ways I feel that yesterday has not been wasted."}
{"id":"f.watson_asks_theory","of":"watson","attr":"action","act":"ask","value":"asks whether Holmes has formed a theory","to":"holmes","time":{"at":"t.train_beyond_reading"},"para":15,"quote":"You have formed a theory, then?"}
{"id":"f.holmes_grip","of":"holmes","attr":"says","value":"he has at least got a grip of the essential facts of the case","to":"watson","time":{"at":"t.train_beyond_reading"},"para":16,"quote":"At least I have got a grip of the essential facts of the case"}
{"id":"f.holmes_will_enumerate","of":"holmes","attr":"intends","value":"to enumerate the facts of the case to Watson","time":{"at":"t.train_beyond_reading"},"para":16,"quote":"I shall enumerate them to you"}
{"id":"f.press_to_watson","of":"the_telegraph","attr":"tells","value":"acct.press","to":"watson","how":"newspaper","partial":true,"time":{"at":"t.watson_reads_papers"},"para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say"}
{"id":"f.chronicle_to_watson","of":"the_chronicle","attr":"tells","value":"acct.press","to":"watson","how":"newspaper","partial":true,"time":{"at":"t.watson_reads_papers"},"para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say"}
{"id":"f.papers_to_holmes","of":"fresh_editions","attr":"tells","value":"acct.press","to":"holmes","how":"newspaper","basis":"implied","time":{"at":"t.wed"},"para":4,"quote":"Fresh editions of every paper had been sent up by our news agent, only to be glanced over"}
{"id":"f.ross_tells_holmes","of":"ross","attr":"tells","value":"acct.ross","to":"holmes","how":"telegram","time":{"at":"t.tue_evening"},"para":12,"quote":"I received telegrams from both Colonel Ross"}
{"id":"f.gregory_tells_holmes","of":"gregory","attr":"tells","value":"acct.gregory","to":"holmes","how":"telegram","time":{"at":"t.tue_evening"},"para":12,"quote":"and from Inspector Gregory"}
{"id":"f.holmes_tells_watson","of":"holmes","attr":"tells","value":["acct.holmes","acct.ross","acct.gregory","acct.press"],"to":"watson","how":"told","partial":true,"time":{"at":"t.train_beyond_reading"},"para":12,"quote":"On Tuesday evening I received telegrams"}
{"id":"f.watson_lies_back","of":"watson","attr":"action","value":"lies back against the cushions, puffing at his cigar","time":{"at":"t.train_beyond_reading"},"para":17,"quote":"I lay back against the cushions, puffing at my cigar"}
{"id":"f.watson_smokes","of":"watson","attr":"carrying","value":"watson_cigar","basis":"implied","time":{"at":"t.train_beyond_reading"},"para":17,"quote":"puffing at my cigar"}
{"id":"f.holmes_counts","of":"holmes","attr":"action","value":"leans forward, checking off the points with his forefinger on the palm of his left hand","time":{"at":"t.train_beyond_reading"},"para":17,"quote":"with his long, thin forefinger checking off the points upon the palm of his left hand"}
{"id":"f.holmes_tells_sketch","of":"holmes","attr":"tells","value":["acct.press","acct.police","acct.holmes"],"to":"watson","how":"told","time":{"at":"t.train_beyond_reading"},"para":17,"quote":"gave me a sketch of the events which had led to our journey"}
{"id":"f.horse_stock","of":"silver_blaze","attr":"condition","value":"of the Isonomy stock","time":{"from":"t.before"},"para":18,"quote":"is from the Isonomy stock"}
{"id":"f.isonomy_famous","of":"isonomy","attr":"reputed","value":"Silver Blaze's famous ancestor","time":{"at":"t.before"},"para":18,"quote":"his famous ancestor"}
{"id":"f.horse_record","of":"silver_blaze","attr":"reputed","value":"holds as brilliant a record as his famous ancestor","time":{"at":"t.crime"},"para":18,"quote":"holds as brilliant a record as his famous ancestor"}
{"id":"f.horse_fifth_year","of":"silver_blaze","attr":"condition","value":"in his fifth year","time":{"at":"t.train_beyond_reading"},"para":18,"quote":"He is now in his fifth year"}
{"id":"f.horse_prizes","of":"silver_blaze","attr":"action","value":"has brought in turn each of the prizes of the turf to Colonel Ross","time":{"after":"t.before","before":"t.crime"},"para":18,"quote":"has brought in turn each of the prizes of the turf to Colonel Ross"}
{"id":"f.horse_odds","of":"silver_blaze","attr":"condition","value":"first favourite for the Wessex Cup, the betting three to one on him","time":{"from":"t.before","to":"t.crime"},"para":18,"quote":"the betting being three to one on him"}
{"id":"f.horse_public_favourite","of":"silver_blaze","attr":"reputed","value":"a prime favourite with the racing public, who has never yet disappointed them","time":{"from":"t.before"},"para":18,"quote":"has always, however, been a prime favourite with the racing public"}
{"id":"f.public_bets","of":"racing_public","attr":"action","value":"lays enormous sums of money upon Silver Blaze","time":{"before":"t.crime"},"para":18,"quote":"enormous sums of money have been laid upon him"}
{"id":"f.holmes_says_interest","of":"holmes","attr":"says","value":"many people had the strongest interest in keeping Silver Blaze from the race","to":"watson","time":{"at":"t.train_beyond_reading"},"para":18,"quote":"there were many people who had the strongest interest in preventing Silver Blaze from being there","asserts":[{"of":"silver_blaze","attr":"condition","value":"many people have the strongest interest in preventing him from running","time":{"at":"t.crime"}}]}
{"id":"f.race_time","of":"wessex_cup","attr":"time","value":"next Tuesday","time":{"at":"t.race"},"para":18,"quote":"at the fall of the flag next Tuesday"}
{"id":"f.cal_race","of":"calendar","attr":"weekday","value":"Tuesday","time":{"at":"t.race"},"para":18,"quote":"next Tuesday"}
{"id":"f.kp_aware","of":"kings_pyland_stable","attr":"knows","value":"many people had an interest in stopping the favourite","time":{"before":"t.crime"},"para":19,"quote":"The fact was, of course, appreciated at King's Pyland"}
{"id":"f.stables_owner","of":"stables","attr":"owner","value":"ross","time":{"from":"t.before"},"para":19,"quote":"where the Colonel's training-stable is situated"}
{"id":"f.precautions","of":"kings_pyland_stable","attr":"action","value":"takes every precaution to guard the favourite","time":{"before":"t.crime"},"para":19,"quote":"Every precaution was taken to guard the favourite."}
{"id":"f.straker_jockey","of":"straker","attr":"role","value":"retired jockey who rode in Colonel Ross's colours","time":{"at":"t.straker_years"},"para":19,"quote":"is a retired jockey who rode in Colonel Ross's colours"}
{"id":"f.straker_heavy","of":"straker","attr":"condition","value":"became too heavy for the weighing-chair","time":{"at":"t.straker_years"},"para":19,"quote":"before he became too heavy for the weighing-chair"}
{"id":"f.straker_served","of":"straker","attr":"action","value":"serves the Colonel five years as jockey and seven as trainer","time":{"at":"t.straker_years"},"para":19,"quote":"He has served the Colonel for five years as jockey and for seven as trainer"}
{"id":"f.straker_honest","of":"straker","attr":"reputed","value":"a zealous and honest servant","time":{"at":"t.straker_years"},"para":19,"quote":"has always shown himself to be a zealous and honest servant"}
{"id":"f.lads_under_straker","of":"stable_lads","attr":"role","value":"the three lads under Straker","time":{"from":"t.before"},"para":19,"quote":"Under him were three lads"}
{"id":"f.establishment_small","of":"kings_pyland_stable","attr":"condition","value":"a small establishment with only four horses","time":{"at":"t.crime"},"para":19,"quote":"for the establishment was a small one, containing only four horses in all"}
{"id":"f.horses_kept","of":"kings_pyland_horses","attr":"lives_at","value":"stables","basis":"implied","time":{"from":"t.before"},"para":19,"quote":"containing only four horses in all"}
{"id":"f.blaze_member","of":"silver_blaze","attr":"member_of","value":"kings_pyland_horses","basis":"implied","time":{"from":"t.before"},"para":19,"quote":"Every precaution was taken to guard the favourite."}
{"id":"f.lads_routine","of":"stable_lads","attr":"action","value":"one sits up each night in the stable while the other two sleep in the loft","time":{"from":"t.before"},"para":19,"quote":"One of these lads sat up each night in the stable, while the others slept in the loft"}
{"id":"f.lads_characters","of":"stable_lads","attr":"reputed","value":"excellent characters","time":{"at":"t.crime"},"para":19,"quote":"All three bore excellent characters."}
{"id":"f.straker_married","of":"straker","attr":"condition","value":"married","time":{"at":"t.crime"},"para":19,"quote":"who is a married man"}
{"id":"f.straker_lives","of":"straker","attr":"lives_at","value":"straker_villa","time":{"from":"t.before"},"para":19,"quote":"lived in a small villa about two hundred yards from the stables"}
{"id":"f.villa_position","of":"straker_villa","attr":"position","value":"about two hundred yards from the stables","time":{"from":"t.before"},"para":19,"quote":"a small villa about two hundred yards from the stables"}
{"id":"f.straker_childless","of":"straker","attr":"condition","value":"has no children","time":{"at":"t.crime"},"para":19,"quote":"He has no children"}
{"id":"f.straker_keeps_maid","of":"straker","attr":"condition","value":"keeps one maid-servant","time":{"at":"t.crime"},"para":19,"quote":"keeps one maid-servant"}
{"id":"f.straker_comfortable","of":"straker","attr":"condition","value":"comfortably off","time":{"at":"t.crime"},"para":19,"quote":"is comfortably off"}
{"id":"f.country_lonely","of":"kings_pyland","attr":"condition","value":"the country round is very lonely","time":{"at":"t.crime"},"para":19,"quote":"The country round is very lonely"}
{"id":"f.villas_north","of":"villas","attr":"position","value":"about half a mile to the north of King's Pyland","time":{"from":"t.before"},"para":19,"quote":"about half a mile to the north there is a small cluster of villas"}
{"id":"f.villas_built","of":"tavistock_contractor","attr":"action","value":"builds the villas for invalids and others who wish to enjoy the Dartmoor air","time":{"at":"t.before"},"para":19,"quote":"which have been built by a Tavistock contractor for the use of invalids"}
{"id":"f.tavistock_west","of":"tavistock","attr":"position","value":"two miles to the west","time":{"from":"t.before"},"para":19,"quote":"Tavistock itself lies two miles to the west"}
{"id":"f.mapleton_position","of":"mapleton","attr":"position","value":"across the moor, about two miles distant","time":{"from":"t.before"},"para":19,"quote":"across the moor, also about two miles distant"}
{"id":"f.mapleton_larger","of":"mapleton","attr":"condition","value":"a larger training establishment","time":{"at":"t.crime"},"para":19,"quote":"is the larger training establishment of Mapleton"}
{"id":"f.mapleton_owner","of":"mapleton","attr":"owner","value":"backwater","time":{"at":"t.crime"},"para":19,"quote":"which belongs to Lord Backwater"}
{"id":"f.brown_manages","of":"silas_brown","attr":"role","value":"manager of the Mapleton establishment","time":{"at":"t.crime"},"para":19,"quote":"is managed by Silas Brown"}
{"id":"f.moor_wild","of":"dartmoor","attr":"condition","value":"in every other direction the moor is a complete wilderness","time":{"at":"t.crime"},"para":19,"quote":"In every other direction the moor is a complete wilderness"}
{"id":"f.gypsies_moor","of":"gypsies","attr":"lives_at","value":"dartmoor","detail":"a few roaming gypsies","time":{"at":"t.crime"},"para":19,"quote":"inhabited only by a few roaming gypsies"}
{"id":"f.cal_monday","of":"calendar","attr":"weekday","value":"Monday","time":{"at":"t.mon_evening"},"para":19,"quote":"last Monday night when the catastrophe occurred"}
{"id":"f.horses_exercised","of":"kings_pyland_horses","attr":"action","value":"exercised and watered as usual","time":{"at":"t.mon_evening"},"para":20,"quote":"the horses had been exercised and watered as usual"}
{"id":"f.stables_locked","of":"stable_door","attr":"door","value":"locked","time":{"from":"t.mon_nine"},"para":20,"quote":"the stables were locked up at nine o'clock"}
{"id":"f.clock_nine","of":"clock","attr":"hour","value":"nine o'clock","time":{"at":"t.mon_nine"},"para":20,"quote":"at nine o'clock"}
{"id":"f.lads_to_house","of":"two_lads","attr":"action","value":"walk up to the trainer's house and have supper in the kitchen","time":{"at":"t.mon_nine"},"para":20,"quote":"Two of the lads walked up to the trainer's house, where they had supper in the kitchen"}
{"id":"f.lads_kitchen","of":"two_lads","attr":"location","value":"kitchen","time":{"from":"t.mon_nine","to":"t.mon_lads_return"},"para":20,"quote":"where they had supper in the kitchen"}
{"id":"f.two_lads_member","of":"two_lads","attr":"member_of","value":"stable_lads","basis":"implied","time":{"from":"t.before"},"para":20,"quote":"Two of the lads"}
{"id":"f.hunter_member","of":"hunter","attr":"member_of","value":"stable_lads","time":{"from":"t.before"},"para":20,"quote":"the third, Ned Hunter"}
{"id":"f.hunter_name","of":"hunter","attr":"name","value":"Ned Hunter","time":{"at":"t.mon_nine"},"para":20,"quote":"Ned Hunter"}
{"id":"f.hunter_guard","of":"hunter","attr":"action","value":"remains on guard in the stables","time":{"from":"t.mon_nine"},"para":20,"quote":"remained on guard"}
{"id":"f.hunter_stables","of":"hunter","attr":"location","value":"stables","time":{"from":"t.mon_nine","to":"t.mon_hunter_out"},"para":20,"quote":"remained on guard"}
{"id":"f.edith_name","of":"edith_baxter","attr":"name","value":"Edith Baxter","time":{"at":"t.mon_maid_path"},"para":20,"quote":"the maid, Edith Baxter"}
{"id":"f.edith_role","of":"edith_baxter","attr":"role","value":"the Strakers' maid-servant","time":{"at":"t.mon_maid_path"},"para":20,"quote":"the maid, Edith Baxter"}
{"id":"f.edith_lives","of":"edith_baxter","attr":"lives_at","value":"straker_villa","basis":"implied","time":{"from":"t.before"},"para":20,"quote":"the maid, Edith Baxter"}
{"id":"f.edith_carries_supper","of":"edith_baxter","attr":"action","value":"carries Hunter's supper down to the stables","time":{"at":"t.mon_maid_path"},"para":20,"quote":"carried down to the stables his supper"}
{"id":"f.edith_has_supper","of":"edith_baxter","attr":"carrying","value":"hunter_supper","time":{"at":"t.mon_maid_path"},"para":20,"quote":"carried down to the stables his supper"}
{"id":"f.supper_contents","of":"hunter_supper","attr":"contents","value":"a dish of curried mutton","time":{"at":"t.mon_maid_path"},"para":20,"quote":"which consisted of a dish of curried mutton"}
{"id":"f.clock_after_nine","of":"clock","attr":"hour","value":"a few minutes after nine","time":{"at":"t.mon_maid_path"},"para":20,"quote":"At a few minutes after nine"}
{"id":"f.edith_no_liquid","of":"edith_baxter","attr":"carrying","value":"liquid","neg":true,"time":{"at":"t.mon_maid_path"},"para":20,"quote":"She took no liquid"}
{"id":"f.tap_in_stables","of":"water_tap","attr":"location","value":"stables","time":{"from":"t.before"},"para":20,"quote":"there was a water-tap in the stables"}
{"id":"f.drink_rule","of":"stable_lads","attr":"rule","value":"the lad on duty drinks nothing but water from the stable tap","time":{"from":"t.before"},"para":20,"quote":"it was the rule that the lad on duty should drink nothing else"}
{"id":"f.edith_lantern","of":"edith_baxter","attr":"carrying","value":"lantern","time":{"at":"t.mon_maid_path"},"para":20,"quote":"The maid carried a lantern with her"}
{"id":"f.night_dark","of":"path","attr":"condition","value":"very dark","time":{"at":"t.mon_maid_path"},"para":20,"quote":"as it was very dark"}
{"id":"f.path_open_moor","of":"path","attr":"condition","value":"runs across the open moor","time":{"from":"t.before"},"para":20,"quote":"the path ran across the open moor"}
{"id":"f.edith_on_path","of":"edith_baxter","attr":"location","value":"path","detail":"within thirty yards of the stables","time":{"at":"t.mon_maid_path"},"para":21,"quote":"Edith Baxter was within thirty yards of the stables"}
{"id":"f.stranger_appears","of":"the_stranger","attr":"action","value":"appears out of the darkness and calls to the maid to stop","time":{"at":"t.mon_maid_path"},"para":21,"quote":"a man appeared out of the darkness and called to her to stop"}
{"id":"f.stranger_on_path","of":"the_stranger","attr":"location","value":"path","detail":"within thirty yards of the stables","basis":"implied","time":{"at":"t.mon_maid_path"},"para":21,"quote":"a man appeared out of the darkness"}
{"id":"f.stranger_bearing","of":"the_stranger","attr":"condition","value":"of gentlemanly bearing","time":{"at":"t.mon_maid_path"},"para":21,"quote":"a person of gentlemanly bearing"}
{"id":"f.stranger_suit","of":"the_stranger","attr":"wearing","value":"stranger_suit","time":{"at":"t.mon_maid_path"},"para":21,"quote":"dressed in a grey suit of tweeds"}
{"id":"f.stranger_capw","of":"the_stranger","attr":"wearing","value":"stranger_cap","time":{"at":"t.mon_maid_path"},"para":21,"quote":"with a cloth cap"}
{"id":"f.stranger_gaitersw","of":"the_stranger","attr":"wearing","value":"stranger_gaiters","time":{"at":"t.mon_maid_path"},"para":21,"quote":"He wore gaiters"}
{"id":"f.stranger_has_stick","of":"the_stranger","attr":"carrying","value":"stranger_stick","time":{"at":"t.mon_maid_path"},"para":21,"quote":"carried a heavy stick with a knob to it"}
{"id":"f.stranger_pale","of":"the_stranger","attr":"condition","value":"extremely pale","time":{"at":"t.mon_maid_path"},"para":21,"quote":"the extreme pallor of his face"}
{"id":"f.stranger_nervous","of":"the_stranger","attr":"condition","value":"nervous in manner","time":{"at":"t.mon_maid_path"},"para":21,"quote":"the nervousness of his manner"}
{"id":"f.edith_age_guess","of":"edith_baxter","attr":"believes","value":"the stranger is rather over thirty than under","time":{"at":"t.mon_maid_path"},"para":21,"quote":"His age, she thought, would be rather over thirty than under it.","asserts":[{"of":"the_stranger","attr":"condition","value":"rather over thirty","time":{"at":"t.mon_maid_path"}}]}
{"id":"f.edith_sees_stranger","of":"edith_baxter","attr":"observes","value":["f.stranger_bearing","f.stranger_suit","f.stranger_capw","f.stranger_gaitersw","f.stranger_has_stick","f.stranger_pale","f.stranger_nervous"],"time":{"at":"t.mon_maid_path"},"para":21,"quote":"she saw that he was a person of gentlemanly bearing"}
{"id":"f.stranger_asks_where","of":"the_stranger","attr":"action","act":"ask","value":"asks the maid where he is","to":"edith_baxter","time":{"at":"t.mon_maid_path"},"para":22,"quote":"Can you tell me where I am?"}
{"id":"f.stranger_says_lost","of":"the_stranger","attr":"says","value":"he had almost made up his mind to sleep on the moor when he saw her lantern","to":"edith_baxter","time":{"at":"t.mon_maid_path"},"para":22,"quote":"I had almost made up my mind to sleep on the moor, when I saw the light of your lantern","asserts":[{"of":"the_stranger","attr":"condition","value":"lost on the moor","time":{"at":"t.mon_maid_path"}}]}
{"id":"f.edith_says_close","of":"edith_baxter","attr":"says","value":"he is close to the King's Pyland training-stables","to":"the_stranger","time":{"at":"t.mon_maid_path"},"para":23,"quote":"You are close to the King's Pyland training-stables","asserts":[{"of":"the_stranger","attr":"location","value":"path","detail":"close to the King's Pyland stables","time":{"at":"t.mon_maid_path"}}]}
{"id":"f.stranger_luck","of":"the_stranger","attr":"says","value":"it is a stroke of luck","to":"edith_baxter","time":{"at":"t.mon_maid_path"},"para":24,"quote":"Oh, indeed! What a stroke of luck!"}
{"id":"f.stranger_knows_routine","of":"the_stranger","attr":"says","value":"he understands a stable-boy sleeps there alone every night","to":"edith_baxter","time":{"at":"t.mon_maid_path"},"para":24,"quote":"I understand that a stable-boy sleeps there alone every night.","asserts":[{"of":"stable_lads","attr":"action","value":"one lad sleeps alone in the stable every night"}]}
{"id":"f.stranger_guess_supper","of":"the_stranger","attr":"says","value":"perhaps she is carrying the boy's supper","to":"edith_baxter","modal":"possible","time":{"at":"t.mon_maid_path"},"para":24,"quote":"Perhaps that is his supper which you are carrying to him.","asserts":[{"of":"edith_baxter","attr":"carrying","value":"hunter_supper","time":{"at":"t.mon_maid_path"}}]}
{"id":"f.stranger_bribe_dress","of":"the_stranger","attr":"says","value":"she would not be too proud to earn the price of a new dress","to":"edith_baxter","time":{"at":"t.mon_maid_path"},"para":24,"quote":"you would not be too proud to earn the price of a new dress"}
{"id":"f.stranger_takes_paper","of":"the_stranger","attr":"action","value":"takes a folded piece of white paper out of his waistcoat pocket","time":{"at":"t.mon_maid_path"},"para":24,"quote":"He took a piece of white paper folded up out of his waistcoat pocket."}
{"id":"f.stranger_carries_paper","of":"the_stranger","attr":"carrying","value":"paper_packet","time":{"at":"t.mon_maid_path"},"para":24,"quote":"He took a piece of white paper folded up out of his waistcoat pocket."}
{"id":"f.stranger_asks_give","of":"the_stranger","attr":"says","value":"she should see that the boy has the paper to-night, and she shall have the prettiest frock money can buy","to":"edith_baxter","time":{"at":"t.mon_maid_path"},"para":24,"quote":"See that the boy has this to-night, and you shall have the prettiest frock that money can buy.","asserts":[{"of":"the_stranger","attr":"intends","value":"that the stable-boy should have the paper that night","time":{"at":"t.mon_maid_path"}}]}
{"id":"f.edith_frightened","of":"edith_baxter","attr":"condition","value":"frightened by the earnestness of his manner","time":{"at":"t.mon_maid_path"},"para":25,"quote":"She was frightened by the earnestness of his manner"}
{"id":"f.edith_runs","of":"edith_baxter","attr":"action","value":"runs past him to the window through which she hands in the meals","time":{"at":"t.mon_window"},"para":25,"quote":"ran past him to the window through which she was accustomed to hand the meals"}
{"id":"f.edith_at_window","of":"edith_baxter","attr":"location","value":"stable_window","detail":"outside","time":{"at":"t.mon_window"},"para":25,"quote":"ran past him to the window"}
{"id":"f.window_open","of":"stable_window","attr":"condition","value":"already open","time":{"at":"t.mon_window"},"para":25,"quote":"It was already opened"}
{"id":"f.hunter_at_table","of":"hunter","attr":"location","value":"small_table","detail":"seated inside","time":{"at":"t.mon_window"},"para":25,"quote":"Hunter was seated at the small table inside"}
{"id":"f.edith_begins_tell","of":"edith_baxter","attr":"tells","value":"acct.edith","to":"hunter","how":"told","partial":true,"time":{"at":"t.mon_window"},"para":25,"quote":"She had begun to tell him of what had happened"}
{"id":"f.stranger_returns","of":"the_stranger","attr":"location","value":"stable_window","detail":"outside","time":{"at":"t.mon_window"},"para":25,"quote":"when the stranger came up again"}
{"id":"f.stranger_greets","of":"the_stranger","attr":"says","value":"good evening; he wanted a word with Hunter","to":"hunter","time":{"at":"t.mon_window"},"para":26,"quote":"I wanted to have a word with you."}
{"id":"f.stranger_looks_through","of":"the_stranger","attr":"action","value":"looks through the window","time":{"at":"t.mon_window"},"para":26,"quote":"looking through the window"}
{"id":"f.stranger_packet_hand","of":"the_stranger","attr":"carrying","value":"paper_packet","detail":"a corner protruding from his closed hand","time":{"at":"t.mon_window"},"para":26,"quote":"the corner of the little paper packet protruding from his closed hand"}
{"id":"f.edith_sees_packet","of":"edith_baxter","attr":"observes","value":["f.stranger_packet_hand"],"time":{"at":"t.mon_window"},"para":26,"quote":"she noticed the corner of the little paper packet protruding from his closed hand"}
{"id":"f.edith_swears","of":"edith_baxter","attr":"tells","value":"acct.edith","to":"police","how":"sworn statement","time":{"at":"t.statements"},"para":26,"quote":"The girl has sworn"}
{"id":"f.hunter_asks_business","of":"hunter","attr":"action","act":"ask","value":"asks what business the stranger has there","to":"the_stranger","time":{"at":"t.mon_window"},"para":27,"quote":"What business have you here?"}
{"id":"f.stranger_offers_pocket","of":"the_stranger","attr":"says","value":"it is business that may put something into Hunter's pocket","to":"hunter","time":{"at":"t.mon_window"},"para":28,"quote":"It's business that may put something into your pocket"}
{"id":"f.stranger_two_horses","of":"the_stranger","attr":"says","value":"the stable has two horses in for the Wessex Cup, Silver Blaze and Bayard","to":"hunter","time":{"at":"t.mon_window"},"para":28,"quote":"You've two horses in for the Wessex Cup—Silver Blaze and Bayard.","asserts":[{"of":"bayard","attr":"role","value":"entered for the Wessex Cup"},{"of":"silver_blaze","attr":"role","value":"entered for the Wessex Cup"}]}
{"id":"f.bayard_entered","of":"bayard","attr":"role","value":"entered for the Wessex Cup","claim":"f.stranger_two_horses","time":{"at":"t.mon_window"},"para":28,"quote":"You've two horses in for the Wessex Cup—Silver Blaze and Bayard."}
{"id":"f.bayard_member","of":"bayard","attr":"member_of","value":"kings_pyland_horses","basis":"implied","claim":"f.stranger_two_horses","time":{"at":"t.mon_window"},"para":28,"quote":"You've two horses in for the Wessex Cup"}
{"id":"f.stranger_asks_tip","of":"the_stranger","attr":"says","value":"asks Hunter for the straight tip, and he won't be a loser","to":"hunter","time":{"at":"t.mon_window"},"para":28,"quote":"Let me have the straight tip and you won't be a loser."}
{"id":"f.stranger_asks_bayard","of":"the_stranger","attr":"action","act":"ask","value":"asks whether at the weights Bayard could give Silver Blaze a hundred yards in five furlongs, and whether the stable has put its money on him","to":"hunter","time":{"at":"t.mon_window"},"para":28,"quote":"Is it a fact that at the weights Bayard could give the other a hundred yards in five furlongs"}
{"id":"f.hunter_touts","of":"hunter","attr":"says","value":"the stranger is one of those damned touts, and he'll show him how they serve them in King's Pyland","to":"the_stranger","time":{"at":"t.mon_window"},"para":29,"quote":"So, you're one of those damned touts!","asserts":[{"of":"the_stranger","attr":"role","value":"racing tout","time":{"at":"t.mon_window"}}]}
{"id":"f.hunter_runs_dog","of":"hunter","attr":"action","value":"springs up and rushes across the stable to unloose the dog","time":{"at":"t.mon_window"},"para":29,"quote":"He sprang up and rushed across the stable to unloose the dog."}
{"id":"f.dog_kept","of":"dog","attr":"lives_at","value":"stables","basis":"implied","time":{"from":"t.before"},"para":29,"quote":"rushed across the stable to unloose the dog"}
{"id":"f.edith_flees","of":"edith_baxter","attr":"action","value":"flees away to the house","time":{"at":"t.mon_window"},"para":29,"quote":"The girl fled away to the house"}
{"id":"f.stranger_leaning","of":"the_stranger","attr":"position","value":"leaning through the window","time":{"at":"t.mon_window"},"para":29,"quote":"the stranger was leaning through the window"}
{"id":"f.edith_looks_back","of":"edith_baxter","attr":"observes","value":["f.stranger_leaning"],"time":{"at":"t.mon_window"},"para":29,"quote":"as she ran she looked back and saw that the stranger was leaning through the window"}
{"id":"f.hunter_out_dog","of":"hunter","attr":"action","value":"rushes out with the hound","time":{"at":"t.mon_hunter_out"},"para":29,"quote":"when Hunter rushed out with the hound"}
{"id":"f.stranger_gone","of":"the_stranger","attr":"location","value":"stable_window","neg":true,"detail":"gone","time":{"at":"t.mon_hunter_out"},"para":29,"quote":"he was gone"}
{"id":"f.hunter_searches","of":"hunter","attr":"action","value":"runs all round the buildings","time":{"at":"t.mon_hunter_out"},"para":29,"quote":"though he ran all round the buildings"}
{"id":"f.no_trace","of":"hunter","attr":"observes","value":"any trace of the stranger","neg":true,"time":{"at":"t.mon_hunter_out"},"para":29,"quote":"he failed to find any trace of him"}
{"id":"f.watson_asks_door","of":"watson","attr":"action","act":"ask","value":"asks whether the stable-boy left the door unlocked when he ran out with the dog","to":"holmes","time":{"at":"t.train_beyond_reading"},"para":30,"quote":"Did the stable-boy, when he ran out with the dog, leave the door unlocked behind him?"}
{"id":"f.holmes_praises","of":"holmes","attr":"says","value":"Watson's question is excellent","to":"watson","time":{"at":"t.train_beyond_reading"},"para":31,"quote":"Excellent, Watson, excellent!"}
{"id":"f.holmes_door_important","of":"holmes","attr":"believes","value":"the point of the door is of great importance","time":{"at":"t.wed"},"para":31,"quote":"The importance of the point struck me so forcibly"}
{"id":"f.holmes_sent_wire","of":"holmes","attr":"action","value":"sends a special wire to Dartmoor to clear up the matter of the door","time":{"at":"t.wed"},"para":31,"quote":"I sent a special wire to Dartmoor yesterday to clear the matter up"}
{"id":"f.wire_reply","of":"?","attr":"tells","value":"acct.hunter","to":"holmes","how":"telegram","partial":true,"basis":"implied","time":{"at":"t.wed"},"para":31,"quote":"to clear the matter up. The boy locked the door before he left it."}
{"id":"f.hunter_locks","of":"hunter","attr":"action","act":"lock","thing":"stable_door","value":"locks the door before leaving it","time":{"at":"t.mon_hunter_out"},"para":31,"quote":"The boy locked the door before he left it."}
{"id":"f.door_locked_after","of":"stable_door","attr":"door","value":"locked","basis":"implied","time":{"from":"t.mon_hunter_out"},"para":31,"quote":"The boy locked the door before he left it."}
{"id":"f.window_small","of":"stable_window","attr":"condition","value":"not large enough for a man to get through","time":{"from":"t.before"},"para":31,"quote":"The window, I may add, was not large enough for a man to get through."}
{"id":"f.hunter_waits","of":"hunter","attr":"action","value":"waits until his fellow-grooms have returned","time":{"at":"t.mon_lads_return"},"para":32,"quote":"Hunter waited until his fellow-grooms had returned"}
{"id":"f.lads_back","of":"two_lads","attr":"location","value":"stables","basis":"implied","time":{"at":"t.mon_lads_return"},"para":32,"quote":"until his fellow-grooms had returned"}
{"id":"f.hunter_tells_straker","of":"hunter","attr":"tells","value":"acct.hunter","to":"straker","how":"told","partial":true,"time":{"at":"t.mon_straker_told"},"para":32,"quote":"he sent a message to the trainer and told him what had occurred"}
{"id":"f.straker_excited","of":"straker","attr":"condition","value":"excited at hearing the account","time":{"at":"t.mon_straker_told"},"para":32,"quote":"Straker was excited at hearing the account"}
{"id":"f.straker_missed_significance","of":"straker","attr":"knows","value":"the true significance of Hunter's account","neg":true,"time":{"at":"t.mon_straker_told"},"para":32,"quote":"although he does not seem to have quite realized its true significance"}
{"id":"f.straker_uneasy","of":"straker","attr":"condition","value":"vaguely uneasy","time":{"from":"t.mon_straker_told","to":"t.straker_leaves"},"para":32,"quote":"It left him, however, vaguely uneasy"}
{"id":"f.mrs_straker_role","of":"mrs_straker","attr":"role","value":"John Straker's wife","basis":"implied","time":{"at":"t.straker_leaves"},"para":32,"quote":"Mrs. Straker, waking at one in the morning"}
{"id":"f.mrs_straker_lives","of":"mrs_straker","attr":"lives_at","value":"straker_villa","basis":"implied","time":{"from":"t.before"},"para":32,"quote":"Mrs. Straker, waking at one in the morning"}
{"id":"f.mrs_straker_wakes","of":"mrs_straker","attr":"action","value":"wakes at one in the morning","time":{"at":"t.straker_leaves"},"para":32,"quote":"Mrs. Straker, waking at one in the morning"}
{"id":"f.clock_one","of":"clock","attr":"hour","value":"one in the morning","time":{"at":"t.straker_leaves"},"para":32,"quote":"at one in the morning"}
{"id":"f.mrs_straker_villa","of":"mrs_straker","attr":"location","value":"straker_villa","basis":"implied","time":{"at":"t.straker_leaves"},"para":32,"quote":"found that he was dressing"}
{"id":"f.straker_villa_one","of":"straker","attr":"location","value":"straker_villa","basis":"implied","time":{"at":"t.straker_leaves"},"para":32,"quote":"found that he was dressing"}
{"id":"f.straker_dressing","of":"straker","attr":"action","value":"dresses","time":{"at":"t.straker_leaves"},"para":32,"quote":"found that he was dressing"}
{"id":"f.mrs_straker_asks","of":"mrs_straker","attr":"action","act":"ask","value":"asks her husband what he is doing","to":"straker","time":{"at":"t.straker_leaves"},"para":32,"quote":"In reply to her inquiries"}
{"id":"f.straker_says_anxious","of":"straker","attr":"says","value":"he cannot sleep for anxiety about the horses, and means to walk down to the stables to see that all is well","to":"mrs_straker","time":{"at":"t.straker_leaves"},"para":32,"quote":"he said that he could not sleep on account of his anxiety about the horses","asserts":[{"of":"straker","attr":"condition","value":"cannot sleep for anxiety about the horses","time":{"at":"t.straker_leaves"}},{"of":"straker","attr":"intends","value":"to walk down to the stables to see that all is well","time":{"at":"t.straker_leaves"}}]}
{"id":"f.mrs_straker_begs","of":"mrs_straker","attr":"action","value":"begs him to remain at home","to":"straker","time":{"at":"t.straker_leaves"},"para":32,"quote":"She begged him to remain at home"}
{"id":"f.rain","of":"weather","attr":"condition","value":"rain pattering against the window","time":{"at":"t.straker_leaves"},"para":32,"quote":"she could hear the rain pattering against the window"}
{"id":"f.mrs_straker_hears_rain","of":"mrs_straker","attr":"observes","value":["f.rain"],"time":{"at":"t.straker_leaves"},"para":32,"quote":"she could hear the rain pattering against the window"}
{"id":"f.straker_mackintosh","of":"straker","attr":"wearing","value":"straker_coat","time":{"from":"t.straker_leaves"},"para":32,"quote":"he pulled on his large mackintosh"}
{"id":"f.straker_leaves_house","of":"straker","attr":"action","value":"leaves the house","time":{"at":"t.straker_leaves"},"para":32,"quote":"and left the house"}
{"id":"f.mrs_straker_wakes_seven","of":"mrs_straker","attr":"action","value":"wakes at seven in the morning","time":{"at":"t.morning_seven"},"para":33,"quote":"Mrs. Straker awoke at seven in the morning"}
{"id":"f.clock_seven","of":"clock","attr":"hour","value":"seven in the morning","time":{"at":"t.morning_seven"},"para":33,"quote":"at seven in the morning"}
{"id":"f.straker_not_returned","of":"straker","attr":"location","value":"straker_villa","neg":true,"time":{"at":"t.morning_seven"},"para":33,"quote":"her husband had not yet returned"}
{"id":"f.mrs_straker_dresses","of":"mrs_straker","attr":"action","value":"dresses herself hastily","time":{"at":"t.morning_seven"},"para":33,"quote":"She dressed herself hastily"}
{"id":"f.mrs_straker_calls_maid","of":"mrs_straker","attr":"action","value":"calls the maid","to":"edith_baxter","time":{"at":"t.morning_seven"},"para":33,"quote":"called the maid"}
{"id":"f.mrs_straker_sets_off","of":"mrs_straker","attr":"action","value":"sets off for the stables with the maid","time":{"at":"t.morning_seven"},"para":33,"quote":"set off for the stables"}
{"id":"f.mrs_at_stables","of":"mrs_straker","attr":"location","value":"stables","basis":"implied","time":{"at":"t.morning_seven"},"para":33,"quote":"The door was open; inside"}
{"id":"f.edith_at_stables","of":"edith_baxter","attr":"location","value":"stables","basis":"implied","time":{"at":"t.morning_seven"},"para":33,"quote":"called the maid, and set off for the stables"}
{"id":"f.door_open","of":"stable_door","attr":"door","value":"open","time":{"at":"t.morning_seven"},"para":33,"quote":"The door was open"}
{"id":"f.hunter_stupor","of":"hunter","attr":"condition","value":"sunk in a state of absolute stupor","time":{"at":"t.morning_seven"},"para":33,"quote":"Hunter was sunk in a state of absolute stupor"}
{"id":"f.hunter_on_chair","of":"hunter","attr":"location","value":"stables","detail":"huddled together upon a chair","time":{"at":"t.morning_seven"},"para":33,"quote":"huddled together upon a chair"}
{"id":"f.stall_empty","of":"silver_blaze","attr":"location","value":"stall","neg":true,"time":{"at":"t.morning_seven"},"para":33,"quote":"the favourite's stall was empty"}
{"id":"f.horse_stall_kept","of":"silver_blaze","attr":"lives_at","value":"stall","basis":"implied","time":{"from":"t.before"},"para":33,"quote":"the favourite's stall"}
{"id":"f.no_straker","of":"straker","attr":"location","value":"stables","neg":true,"time":{"at":"t.morning_seven"},"para":33,"quote":"there were no signs of his trainer"}
{"id":"f.mrs_straker_observes","of":"mrs_straker","attr":"observes","value":["f.door_open","f.hunter_stupor","f.hunter_on_chair","f.stall_empty","f.no_straker"],"time":{"at":"t.morning_seven"},"para":33,"quote":"The door was open; inside, huddled together upon a chair"}
{"id":"f.lads_loft","of":"two_lads","attr":"location","value":"loft","basis":"implied","time":{"from":"t.mon_lads_return","to":"t.morning_seven"},"para":34,"quote":"The two lads who slept in the chaff-cutting loft above the harness-room"}
{"id":"f.loft_above","of":"loft","attr":"position","value":"above the harness-room","time":{"from":"t.before"},"para":34,"quote":"the chaff-cutting loft above the harness-room"}
{"id":"f.lads_aroused","of":"two_lads","attr":"action","value":"are quickly aroused","time":{"at":"t.morning_seven"},"para":34,"quote":"were quickly aroused"}
{"id":"f.lads_heard_nothing","of":"two_lads","attr":"observes","value":"anything during the night","neg":true,"time":{"from":"t.mon_lads_return","to":"t.morning_seven"},"para":34,"quote":"They had heard nothing during the night"}
{"id":"f.lads_sound_sleepers","of":"two_lads","attr":"condition","value":"both sound sleepers","time":{"from":"t.before"},"para":34,"quote":"for they are both sound sleepers"}
{"id":"f.hunter_drugged","of":"hunter","attr":"condition","value":"under the influence of some powerful drug","time":{"at":"t.morning_seven"},"para":34,"quote":"Hunter was obviously under the influence of some powerful drug"}
{"id":"f.hunter_no_sense","of":"hunter","attr":"condition","value":"no sense can be got out of him","time":{"at":"t.morning_seven"},"para":34,"quote":"as no sense could be got out of him"}
{"id":"f.hunter_left","of":"hunter","attr":"condition","value":"left to sleep it off","time":{"from":"t.morning_seven","to":"t.hunter_recovers"},"para":34,"quote":"he was left to sleep it off"}
{"id":"f.edith_member","of":"edith_baxter","attr":"member_of","value":"two_women","basis":"implied","time":{"at":"t.morning_search"},"para":34,"quote":"the two women"}
{"id":"f.mrs_member","of":"mrs_straker","attr":"member_of","value":"two_women","basis":"implied","time":{"at":"t.morning_search"},"para":34,"quote":"the two women"}
{"id":"f.lads_search","of":"two_lads","attr":"action","value":"run out in search of the trainer and the horse","time":{"at":"t.morning_search"},"para":34,"quote":"the two lads and the two women ran out in search of the absentees"}
{"id":"f.women_search","of":"two_women","attr":"action","value":"run out in search of the trainer and the horse","time":{"at":"t.morning_search"},"para":34,"quote":"the two lads and the two women ran out in search of the absentees"}
{"id":"f.lads_hope","of":"two_lads","attr":"believes","value":"the trainer may have taken out the horse for early exercise","modal":"possible","time":{"at":"t.morning_search"},"para":34,"quote":"They still had hopes that the trainer had for some reason taken out the horse for early exercise","asserts":[{"of":"straker","attr":"action","value":"takes out the horse for early exercise","time":{"before":"t.morning_seven"}}]}
{"id":"f.women_hope","of":"two_women","attr":"believes","value":"the trainer may have taken out the horse for early exercise","modal":"possible","time":{"at":"t.morning_search"},"para":34,"quote":"They still had hopes that the trainer had for some reason taken out the horse for early exercise","asserts":[{"of":"straker","attr":"action","value":"takes out the horse for early exercise","time":{"before":"t.morning_seven"}}]}
{"id":"f.lads_knoll","of":"two_lads","attr":"location","value":"knoll","time":{"at":"t.morning_search"},"para":34,"quote":"on ascending the knoll near the house"}
{"id":"f.women_knoll","of":"two_women","attr":"location","value":"knoll","time":{"at":"t.morning_search"},"para":34,"quote":"on ascending the knoll near the house"}
{"id":"f.knoll_position","of":"knoll","attr":"position","value":"near the house","time":{"from":"t.before"},"para":34,"quote":"the knoll near the house"}
{"id":"f.knoll_view","of":"knoll","attr":"condition","value":"all the neighbouring moors are visible from it","time":{"from":"t.before"},"para":34,"quote":"from which all the neighbouring moors were visible"}
{"id":"f.no_sign_horse","of":"two_women","attr":"observes","value":"any sign of the missing favourite","neg":true,"time":{"at":"t.morning_search"},"para":34,"quote":"they not only could see no signs of the missing favourite"}
{"id":"f.tragedy_seen","of":"two_women","attr":"observes","value":["f.coat_on_bush"],"time":{"at":"t.morning_search"},"para":34,"quote":"they perceived something which warned them that they were in the presence of a tragedy"}
{"id":"f.coat_on_bush","of":"straker_coat","attr":"location","value":"furze_bush","detail":"flapping","time":{"at":"t.morning_search"},"para":35,"quote":"John Straker's overcoat was flapping from a furze-bush"}
{"id":"f.bush_position","of":"furze_bush","attr":"position","value":"about a quarter of a mile from the stables","time":{"at":"t.morning_search"},"para":35,"quote":"About a quarter of a mile from the stables"}
{"id":"f.hollow_position","of":"hollow","attr":"position","value":"immediately beyond the furze-bush","time":{"from":"t.before"},"para":35,"quote":"Immediately beyond there was a bowl-shaped depression in the moor"}
{"id":"f.body_hollow","of":"straker","attr":"location","value":"hollow","detail":"at the bottom","time":{"at":"t.morning_search"},"para":35,"quote":"at the bottom of this was found the dead body of the unfortunate trainer"}
{"id":"f.straker_dead","of":"straker","attr":"condition","value":"dead","time":{"at":"t.morning_search"},"para":35,"quote":"the dead body of the unfortunate trainer"}
{"id":"f.head_shattered","of":"straker","attr":"condition","value":"head shattered by a savage blow from some heavy weapon","time":{"at":"t.morning_search"},"para":35,"quote":"His head had been shattered by a savage blow from some heavy weapon"}
{"id":"f.thigh_cut","of":"straker","attr":"condition","value":"a long, clean cut on the thigh from some very sharp instrument","time":{"at":"t.morning_search"},"para":35,"quote":"he was wounded on the thigh, where there was a long, clean cut, inflicted evidently by some very sharp instrument"}
{"id":"f.straker_defended","of":"straker","attr":"action","value":"defends himself vigorously against his assailants","time":{"at":"t.crime"},"para":35,"quote":"Straker had defended himself vigorously against his assailants"}
{"id":"f.knife_right","of":"straker","attr":"carrying","value":"straker_knife","detail":"in his right hand","time":{"at":"t.morning_search"},"para":35,"quote":"in his right hand he held a small knife"}
{"id":"f.knife_bloody","of":"straker_knife","attr":"condition","value":"clotted with blood up to the handle","time":{"at":"t.morning_search"},"para":35,"quote":"which was clotted with blood up to the handle"}
{"id":"f.cravat_left","of":"straker","attr":"carrying","value":"cravat","detail":"clasped in his left hand","time":{"at":"t.morning_search"},"para":35,"quote":"in his left he clasped a red and black silk cravat"}
{"id":"f.edith_recognises","of":"edith_baxter","attr":"says","value":"the cravat is the one the stranger wore the evening before","time":{"after":"t.morning_search","before":"t.wed"},"para":35,"quote":"which was recognised by the maid as having been worn on the preceding evening by the stranger","asserts":[{"of":"the_stranger","attr":"wearing","value":"cravat","time":{"at":"t.mon_maid_path"}}]}
{"id":"f.stranger_cravat","of":"the_stranger","attr":"wearing","value":"cravat","claim":"f.edith_recognises","time":{"at":"t.mon_maid_path"},"para":35,"quote":"as having been worn on the preceding evening by the stranger who had visited the stables"}
{"id":"f.hunter_recovers","of":"hunter","attr":"action","value":"recovers from his stupor","time":{"at":"t.hunter_recovers"},"para":36,"quote":"Hunter, on recovering from his stupor"}
{"id":"f.hunter_cravat","of":"hunter","attr":"says","value":"the cravat belongs to the stranger","time":{"after":"t.hunter_recovers","before":"t.wed"},"para":36,"quote":"was also quite positive as to the ownership of the cravat","asserts":[{"of":"cravat","attr":"owner","value":"the_stranger"}]}
{"id":"f.hunter_believes_drugged","of":"hunter","attr":"believes","value":"the stranger drugged his curried mutton while standing at the window, and so deprived the stables of their watchman","time":{"after":"t.hunter_recovers","before":"t.wed"},"para":36,"quote":"He was equally certain that the same stranger had, while standing at the window, drugged his curried mutton","asserts":[{"of":"the_stranger","attr":"action","value":"drugs Hunter's curried mutton","time":{"at":"t.mon_window"}}]}
{"id":"f.hunter_tells_police","of":"hunter","attr":"tells","value":"acct.hunter","to":"police","how":"statement","basis":"implied","time":{"at":"t.statements"},"para":36,"quote":"Hunter, on recovering from his stupor, was also quite positive"}
{"id":"f.mud_proofs","of":"hollow","attr":"condition","value":"abundant proofs in the mud at the bottom that the horse was there","time":{"at":"t.morning_search"},"para":37,"quote":"there were abundant proofs in the mud which lay at the bottom of the fatal hollow"}
{"id":"f.horse_in_hollow","of":"silver_blaze","attr":"location","value":"hollow","time":{"at":"t.crime"},"para":37,"quote":"he had been there at the time of the struggle"}
{"id":"f.horse_disappeared","of":"silver_blaze","attr":"location","value":null,"detail":"disappeared","time":{"from":"t.morning_search"},"para":37,"quote":"from that morning he has disappeared"}
{"id":"f.reward_offered","of":"silver_blaze","attr":"condition","value":"a large reward has been offered for him","time":{"from":"t.reward"},"para":37,"quote":"a large reward has been offered"}
{"id":"f.gypsies_alert","of":"gypsies","attr":"condition","value":"on the alert for the horse","time":{"from":"t.reward"},"para":37,"quote":"all the gypsies of Dartmoor are on the alert"}
{"id":"f.no_news","of":"silver_blaze","attr":"condition","value":"no news has come of him","time":{"from":"t.morning_search","to":"t.train_beyond_reading"},"para":37,"quote":"no news has come of him"}
{"id":"f.supper_opium","of":"hunter_supper","attr":"contents","value":"opium","detail":"an appreciable quantity of powdered opium in the remains","time":{"at":"t.analysis"},"para":37,"quote":"an analysis has shown that the remains of his supper left by the stable-lad contain an appreciable quantity of powdered opium"}
{"id":"f.analysis_tells","of":"?","attr":"tells","value":"acct.analysis","to":"police","how":"analysis","time":{"after":"t.analysis","before":"t.wed"},"para":37,"quote":"an analysis has shown"}
{"id":"f.house_same_dish","of":"house_supper","attr":"contents","value":"the same dish of curried mutton","time":{"after":"t.mon_nine","before":"t.mon_lads_return"},"para":37,"quote":"the people at the house partook of the same dish on the same night"}
{"id":"f.house_no_effect","of":"house_supper","attr":"condition","value":"eaten at the house without any ill effect","time":{"after":"t.mon_nine","before":"t.mon_lads_return"},"para":37,"quote":"without any ill effect"}
{"id":"f.holmes_main_facts","of":"holmes","attr":"says","value":"those are the main facts of the case, stripped of all surmise","to":"watson","time":{"at":"t.train_beyond_reading"},"para":38,"quote":"Those are the main facts of the case, stripped of all surmise"}
{"id":"f.holmes_will_recap","of":"holmes","attr":"intends","value":"to recapitulate what the police have done","time":{"at":"t.train_beyond_reading"},"para":38,"quote":"I shall now recapitulate what the police have done in the matter."}
{"id":"f.holmes_gregory_competent","of":"holmes","attr":"says","value":"Gregory is an extremely competent officer","to":"watson","time":{"at":"t.train_beyond_reading"},"para":39,"quote":"is an extremely competent officer"}
{"id":"f.holmes_gregory_imagination","of":"holmes","attr":"says","value":"Gregory lacks imagination, without which he cannot rise to great heights","to":"watson","time":{"at":"t.train_beyond_reading"},"para":39,"quote":"Were he but gifted with imagination he might rise to great heights in his profession."}
{"id":"f.gregory_member","of":"gregory","attr":"member_of","value":"police","basis":"implied","time":{"from":"t.before"},"para":39,"quote":"Inspector Gregory, to whom the case has been committed"}
{"id":"f.gregory_arrives","of":"gregory","attr":"action","value":"arrives at King's Pyland","time":{"at":"t.gregory_arrives"},"para":39,"quote":"On his arrival"}
{"id":"f.gregory_arrests","of":"gregory","attr":"action","value":"finds and arrests Fitzroy Simpson","time":{"at":"t.simpson_arrest"},"para":39,"quote":"he promptly found and arrested the man upon whom suspicion naturally rested"}
{"id":"f.suspicion_simpson","of":"simpson","attr":"condition","value":"the man upon whom suspicion naturally rested","time":{"at":"t.simpson_arrest"},"para":39,"quote":"the man upon whom suspicion naturally rested"}
{"id":"f.simpson_lives","of":"simpson","attr":"lives_at","value":"simpson_villa","time":{"from":"t.simpson_comes_down"},"para":39,"quote":"he inhabited one of those villas which I have mentioned"}
{"id":"f.simpson_name","of":"simpson","attr":"name","value":"Fitzroy Simpson","time":{"at":"t.simpson_arrest"},"para":39,"quote":"His name, it appears, was Fitzroy Simpson."}
{"id":"f.simpson_birth","of":"simpson","attr":"condition","value":"of excellent birth and education","time":{"from":"t.before"},"para":39,"quote":"He was a man of excellent birth and education"}
{"id":"f.simpson_squandered","of":"simpson","attr":"action","value":"squanders a fortune upon the turf","time":{"after":"t.before","before":"t.crime"},"para":39,"quote":"who had squandered a fortune upon the turf"}
{"id":"f.simpson_bookmaker","of":"simpson","attr":"role","value":"a quiet and genteel bookmaker in the sporting clubs of London","time":{"at":"t.crime"},"para":39,"quote":"lived now by doing a little quiet and genteel book-making in the sporting clubs of London"}
{"id":"f.betting_book_owner","of":"betting_book","attr":"owner","value":"simpson","basis":"implied","time":{"at":"t.simpson_arrest"},"para":39,"quote":"his betting-book"}
{"id":"f.betting_examined","of":"police","attr":"action","value":"examines Simpson's betting-book","time":{"after":"t.simpson_arrest","before":"t.wed"},"para":39,"quote":"An examination of his betting-book"}
{"id":"f.book_contents","of":"betting_book","attr":"contents","value":"bets of five thousand pounds against the favourite","time":{"at":"t.simpson_arrest"},"para":39,"quote":"bets to the amount of five thousand pounds had been registered by him against the favourite"}
{"id":"f.simpson_bets","of":"simpson","attr":"action","value":"registers bets of five thousand pounds against the favourite","time":{"at":"t.simpson_bets"},"para":39,"quote":"bets to the amount of five thousand pounds had been registered by him against the favourite"}
{"id":"f.simpson_statement","of":"simpson","attr":"tells","value":"acct.simpson","to":"gregory","how":"statement","time":{"at":"t.simpson_arrest"},"para":40,"quote":"On being arrested he volunteered the statement"}
{"id":"f.simpson_came_info","of":"simpson","attr":"says","value":"he came down to Dartmoor hoping to get information about the King's Pyland horses and about Desborough","to":"gregory","time":{"at":"t.simpson_arrest"},"para":40,"quote":"he had come down to Dartmoor in the hope of getting some information about the King's Pyland horses","asserts":[{"of":"simpson","attr":"intends","value":"to get information about the King's Pyland horses and Desborough","time":{"at":"t.simpson_comes_down"}}]}
{"id":"f.simpson_came","of":"simpson","attr":"location","value":"dartmoor","time":{"from":"t.simpson_comes_down"},"para":40,"quote":"he had come down to Dartmoor"}
{"id":"f.desborough_second","of":"desborough","attr":"role","value":"second favourite for the Wessex Cup","time":{"at":"t.crime"},"para":40,"quote":"Desborough, the second favourite"}
{"id":"f.desborough_brown","of":"desborough","attr":"lives_at","value":"mapleton","time":{"at":"t.crime"},"para":40,"quote":"which was in charge of Silas Brown at the Mapleton stables"}
{"id":"f.brown_charge","of":"silas_brown","attr":"role","value":"in charge of Desborough","time":{"at":"t.crime"},"para":40,"quote":"which was in charge of Silas Brown"}
{"id":"f.simpson_admits","of":"simpson","attr":"says","value":"he does not deny that he acted as described the evening before","to":"gregory","time":{"at":"t.simpson_arrest"},"para":40,"quote":"He did not attempt to deny that he had acted as described upon the evening before","asserts":[{"of":"the_stranger","attr":"identity","value":"simpson"}]}
{"id":"f.stranger_is_simpson","of":"the_stranger","attr":"identity","value":"simpson","time":{"from":"t.before"},"para":40,"quote":"He did not attempt to deny that he had acted as described upon the evening before"}
{"id":"f.simpson_no_designs","of":"simpson","attr":"says","value":"he had no sinister designs and simply wished to obtain first-hand information","to":"gregory","time":{"at":"t.simpson_arrest"},"para":40,"quote":"declared that he had no sinister designs, and had simply wished to obtain first-hand information","asserts":[{"of":"simpson","attr":"intends","value":"simply to obtain first-hand information","time":{"at":"t.mon_window"}}]}
{"id":"f.cravat_confronted","of":"police","attr":"action","value":"confront Simpson with his cravat","to":"simpson","time":{"at":"t.simpson_arrest"},"para":40,"quote":"When confronted with his cravat"}
{"id":"f.cravat_owner","of":"cravat","attr":"owner","value":"simpson","time":{"at":"t.simpson_arrest"},"para":40,"quote":"When confronted with his cravat"}
{"id":"f.simpson_pale","of":"simpson","attr":"condition","value":"turns very pale","time":{"at":"t.simpson_arrest"},"para":40,"quote":"he turned very pale"}
{"id":"f.simpson_cannot_account","of":"simpson","attr":"says","value":"he cannot account for the cravat's presence in the murdered man's hand","to":"gregory","time":{"at":"t.simpson_arrest"},"para":40,"quote":"was utterly unable to account for its presence in the hand of the murdered man"}
{"id":"f.simpson_wet","of":"simpson","attr":"condition","value":"his clothing wet","time":{"at":"t.simpson_arrest"},"para":40,"quote":"His wet clothing"}
{"id":"f.simpson_out_storm","of":"simpson","attr":"location","value":"dartmoor","detail":"out in the storm","time":{"after":"t.mon_hunter_out","before":"t.morning_seven"},"para":40,"quote":"showed that he had been out in the storm of the night before"}
{"id":"f.storm","of":"weather","attr":"condition","value":"a storm","time":{"at":"t.crime"},"para":40,"quote":"the storm of the night before"}
{"id":"f.stick_owner","of":"simpson_stick","attr":"owner","value":"simpson","time":{"at":"t.simpson_arrest"},"para":40,"quote":"his stick"}
{"id":"f.stick_kind","of":"simpson_stick","attr":"condition","value":"a Penang-lawyer weighted with lead","time":{"at":"t.simpson_arrest"},"para":40,"quote":"which was a Penang-lawyer weighted with lead"}
{"id":"f.stick_could","of":"simpson_stick","attr":"condition","value":"just such a weapon as might, by repeated blows, have inflicted the trainer's injuries","time":{"at":"t.simpson_arrest"},"para":40,"quote":"was just such a weapon as might, by repeated blows, have inflicted the terrible injuries"}
{"id":"f.straker_succumbed","of":"straker","attr":"condition","value":"died of terrible injuries","time":{"at":"t.crime"},"para":40,"quote":"the terrible injuries to which the trainer had succumbed"}
{"id":"f.simpson_no_wound","of":"simpson","attr":"condition","value":"wounded","neg":true,"time":{"at":"t.simpson_arrest"},"para":41,"quote":"there was no wound upon his person"}
{"id":"f.knife_owner","of":"straker_knife","attr":"owner","value":"straker","basis":"implied","time":{"at":"t.crime"},"para":41,"quote":"the state of Straker's knife"}
{"id":"f.holmes_mark","of":"holmes","attr":"says","value":"the state of Straker's knife shows one at least of his assailants must bear his mark","to":"watson","time":{"at":"t.train_beyond_reading"},"para":41,"quote":"the state of Straker's knife would show that one at least of his assailants must bear his mark upon him","asserts":[{"of":"?","attr":"condition","value":"an assailant of Straker wounded by his knife","time":{"from":"t.crime"}}]}
{"id":"f.holmes_asks_light","of":"holmes","attr":"action","act":"ask","value":"asks Watson for any light he can give","to":"watson","time":{"at":"t.train_beyond_reading"},"para":41,"quote":"if you can give me any light I shall be infinitely obliged to you"}
{"id":"f.watson_listened","of":"watson","attr":"action","value":"listens with the greatest interest to Holmes's statement","time":{"at":"t.train_beyond_reading"},"para":42,"quote":"I had listened with the greatest interest"}
{"id":"f.watson_familiar","of":"watson","attr":"knows","value":"most of the facts Holmes laid out","time":{"at":"t.train_beyond_reading"},"para":42,"quote":"most of the facts were familiar to me"}
{"id":"f.watson_not_appreciated","of":"watson","attr":"knows","value":"the relative importance of the facts and their connection to each other","neg":true,"time":{"at":"t.watson_reads_papers"},"para":42,"quote":"I had not sufficiently appreciated their relative importance, nor their connection to each other"}
{"id":"f.watson_self_wound","of":"watson","attr":"says","value":"the cut on Straker may have been made by his own knife in the convulsions that follow a brain injury","to":"holmes","modal":"possible","time":{"at":"t.train_beyond_reading"},"para":43,"quote":"the incised wound upon Straker may have been caused by his own knife in the convulsive struggles which follow any brain injury","asserts":[{"of":"straker","attr":"action","value":"cuts his own thigh with his knife in convulsions after the blow","time":{"at":"t.crime"}}]}
{"id":"f.holmes_probable","of":"holmes","attr":"says","value":"Watson's suggestion is more than possible; it is probable","to":"watson","time":{"at":"t.train_beyond_reading"},"para":44,"quote":"It is more than possible; it is probable","asserts":[{"of":"straker","attr":"action","value":"cuts his own thigh with his knife in convulsions after the blow","time":{"at":"t.crime"}}]}
{"id":"f.holmes_point_gone","of":"holmes","attr":"says","value":"in that case one of the main points in favour of the accused disappears","to":"watson","time":{"at":"t.train_beyond_reading"},"para":44,"quote":"In that case one of the main points in favour of the accused disappears."}
{"id":"f.watson_fails","of":"watson","attr":"says","value":"he still fails to understand what the theory of the police can be","to":"holmes","time":{"at":"t.train_beyond_reading"},"para":45,"quote":"even now I fail to understand what the theory of the police can be"}
{"id":"f.holmes_objections","of":"holmes","attr":"says","value":"whatever theory is stated has very grave objections","to":"watson","time":{"at":"t.train_beyond_reading"},"para":46,"quote":"I am afraid that whatever theory we state has very grave objections to it"}
{"id":"f.holmes_police_theory","of":"holmes","attr":"says","value":"the police imagine that Simpson drugged the lad, opened the stable door with a duplicate key, bridled and led out the horse, killed the trainer who met him on the moor, and hid the horse or lost it","to":"watson","modal":"possible","time":{"at":"t.train_beyond_reading"},"para":46,"quote":"The police imagine, I take it, that this Fitzroy Simpson, having drugged the lad","asserts":[{"of":"simpson","attr":"action","value":"drugs the stable-lad","time":{"at":"t.mon_window"}},{"of":"simpson","attr":"carrying","value":"duplicate_key","time":{"at":"t.horse_taken"}},{"of":"simpson","attr":"action","value":"opens the stable door and takes out the horse, meaning to kidnap him","time":{"at":"t.horse_taken"}},{"of":"simpson","attr":"action","value":"puts the bridle on the horse","time":{"at":"t.horse_taken"}},{"of":"stable_door","attr":"door","value":"open","time":{"from":"t.horse_taken"}},{"of":"simpson","attr":"action","value":"leads the horse away over the moor and is met or overtaken by the trainer","time":{"at":"t.crime"}},{"of":"simpson","attr":"action","value":"beats out the trainer's brains with his heavy stick, unhurt by the knife","time":{"at":"t.crime"}},{"of":"simpson","attr":"action","value":"leads the horse to a secret hiding-place, or the horse bolts and wanders on the moor","time":{"after":"t.crime"}}]}
{"id":"f.police_theory","of":"police","attr":"believes","value":"Simpson drugged the lad, opened the door with a duplicate key, led out the bridled horse, killed the trainer and hid or lost the horse","claim":"f.holmes_police_theory","time":{"at":"t.train_beyond_reading"},"para":46,"quote":"That is the case as it appears to the police"}
{"id":"f.bridle_missing","of":"bridle","attr":"location","value":null,"detail":"missing","time":{"from":"t.morning_seven"},"para":46,"quote":"His bridle is missing"}
{"id":"f.holmes_improbable","of":"holmes","attr":"believes","value":"the police case is improbable, but all other explanations are more improbable still","time":{"at":"t.train_beyond_reading"},"para":46,"quote":"improbable as it is, all other explanations are more improbable still"}
{"id":"f.holmes_test","of":"holmes","attr":"intends","value":"to test the matter quickly once on the spot","time":{"at":"t.train_beyond_reading"},"para":46,"quote":"I shall very quickly test the matter when I am once upon the spot"}
{"id":"f.holmes_stuck","of":"holmes","attr":"believes","value":"they cannot get much further until he is on the spot","time":{"at":"t.train_beyond_reading"},"para":46,"quote":"I cannot really see how we can get much further than our present position"}
{"id":"f.mrs_tells_police","of":"mrs_straker","attr":"tells","value":"acct.mrs_straker","to":"police","how":"statement","basis":"implied","time":{"at":"t.statements"},"para":32,"quote":"Mrs. Straker, waking at one in the morning"}
{"id":"f.lads_tell_police","of":"two_lads","attr":"tells","value":"acct.lads","to":"police","how":"statement","basis":"implied","time":{"at":"t.statements"},"para":34,"quote":"They had heard nothing during the night"}
{"id":"f.searchers_tell_police","of":"two_women","attr":"tells","value":"acct.searchers","to":"police","how":"statement","basis":"implied","time":{"at":"t.statements"},"para":35,"quote":"at the bottom of this was found the dead body of the unfortunate trainer"}
{"id":"f.police_tells_press","of":"police","attr":"tells","value":"acct.police","to":"the_press","how":"report","basis":"implied","time":{"after":"t.statements","before":"t.wed"},"para":38,"quote":"what the police have done in the matter"}
{"id":"f.press_to_editions","of":"the_press","attr":"tells","value":"acct.press","to":"fresh_editions","how":"newspaper","basis":"implied","time":{"after":"t.statements","before":"t.wed"},"para":4,"quote":"Fresh editions of every paper had been sent up by our news agent"}
{"id":"f.press_to_telegraph","of":"the_press","attr":"tells","value":"acct.press","to":"the_telegraph","how":"newspaper","basis":"implied","time":{"after":"t.crime","before":"t.watson_reads_papers"},"para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say"}
{"id":"f.press_to_chronicle","of":"the_press","attr":"tells","value":"acct.press","to":"the_chronicle","how":"newspaper","basis":"implied","time":{"after":"t.crime","before":"t.watson_reads_papers"},"para":11,"quote":"I have seen what the _Telegraph_ and the _Chronicle_ have to say"}
{"id":"f.police_to_holmes","of":"police","attr":"tells","value":"acct.police","to":"holmes","how":"telegram","basis":"implied","time":{"after":"t.statements","before":"t.thu_breakfast"},"para":31,"quote":"I sent a special wire to Dartmoor yesterday to clear the matter up"}
{"id":"f.gregory_reports_simpson","of":"gregory","attr":"tells","value":"acct.simpson","to":"police","how":"report","basis":"implied","time":{"after":"t.simpson_arrest","before":"t.thu_breakfast"},"para":40,"quote":"On being arrested he volunteered the statement"}
{"id":"f.clock_evening_tav","of":"clock","attr":"hour","value":"evening","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"It was evening before we reached the little town of Tavistock"}
{"id":"f.watson_tav_station","of":"watson","attr":"location","value":"tavistock_station","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"Two gentlemen were awaiting us in the station"}
{"id":"f.holmes_tav_station","of":"holmes","attr":"location","value":"tavistock_station","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"Two gentlemen were awaiting us in the station"}
{"id":"f.tavistock_small","of":"tavistock","attr":"condition","value":"a little town","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"the little town of Tavistock"}
{"id":"f.tavistock_middle","of":"tavistock","attr":"position","value":"like the boss of a shield, in the middle of the huge circle of Dartmoor","time":{"from":"t.before"},"para":47,"quote":"which lies, like the boss of a shield, in the middle of the huge circle of Dartmoor"}
{"id":"f.ross_tav_station","of":"ross","attr":"location","value":"tavistock_station","detail":"awaiting them","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"Two gentlemen were awaiting us in the station"}
{"id":"f.gregory_tav_station","of":"gregory","attr":"location","value":"tavistock_station","detail":"awaiting them","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"Two gentlemen were awaiting us in the station"}
{"id":"f.gregory_looks","of":"gregory","attr":"condition","value":"a tall, fair man with lion-like hair and beard and curiously penetrating light blue eyes","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"a tall, fair man with lion-like hair and beard and curiously penetrating light blue eyes"}
{"id":"f.ross_looks","of":"ross","attr":"condition","value":"a small, alert person, very neat and dapper, with trim little side-whiskers","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"a small, alert person, very neat and dapper"}
{"id":"f.ross_frock","of":"ross","attr":"wearing","value":"ross_frock_coat","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"in a frock-coat and gaiters"}
{"id":"f.ross_gaiters_w","of":"ross","attr":"wearing","value":"ross_gaiters","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"in a frock-coat and gaiters"}
{"id":"f.ross_glass_w","of":"ross","attr":"wearing","value":"ross_eye_glass","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"with trim little side-whiskers and an eye-glass"}
{"id":"f.ross_sportsman","of":"ross","attr":"reputed","value":"the well-known sportsman","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"The latter was Colonel Ross, the well-known sportsman"}
{"id":"f.gregory_rising","of":"gregory","attr":"reputed","value":"rapidly making his name in the English detective service","time":{"at":"t.tavistock_arrival"},"para":47,"quote":"a man who was rapidly making his name in the English detective service"}
{"id":"f.gregory_detective_member","of":"gregory","attr":"member_of","value":"detective_service","time":{"from":"t.before"},"para":47,"quote":"rapidly making his name in the English detective service"}
{"id":"f.watson_sees_pair","of":"watson","attr":"observes","value":["f.gregory_looks","f.ross_looks","f.ross_frock","f.ross_gaiters_w","f.ross_glass_w"],"time":{"at":"t.tavistock_arrival"},"para":47,"quote":"Two gentlemen were awaiting us in the station"}
{"id":"f.ross_delighted","of":"ross","attr":"says","value":"he is delighted Holmes has come down","to":"holmes","time":{"at":"t.tavistock_arrival"},"para":48,"quote":"I am delighted that you have come down, Mr. Holmes"}
{"id":"f.ross_inspector_done_all","of":"ross","attr":"says","value":"the Inspector has done all that could possibly be suggested","to":"holmes","time":{"at":"t.tavistock_arrival"},"para":48,"quote":"The Inspector here has done all that could possibly be suggested","asserts":[{"of":"gregory","attr":"action","value":"has done all that could possibly be suggested","time":{"before":"t.tavistock_arrival"}}]}
{"id":"f.ross_intends_avenge","of":"ross","attr":"intends","value":"to leave no stone unturned to avenge Straker and recover his horse","time":{"at":"t.tavistock_arrival"},"para":48,"quote":"I wish to leave no stone unturned in trying to avenge poor Straker and in recovering my horse"}
{"id":"f.holmes_asks_developments","of":"holmes","attr":"action","act":"ask","value":"asks whether there have been any fresh developments","to":"gregory","time":{"at":"t.tavistock_arrival"},"para":49,"quote":"Have there been any fresh developments?"}
{"id":"f.gregory_little_progress","of":"gregory","attr":"says","value":"the police have made very little progress","to":"holmes","time":{"at":"t.tavistock_arrival"},"para":50,"quote":"I am sorry to say that we have made very little progress"}
{"id":"f.landau_outside","of":"landau","attr":"location","value":"tavistock_station","detail":"outside","time":{"at":"t.tavistock_arrival"},"para":50,"quote":"We have an open carriage outside"}
{"id":"f.gregory_intends_drive","of":"gregory","attr":"intends","value":"to see the place before the light fails and talk the case over on the drive","time":{"at":"t.tavistock_arrival"},"para":50,"quote":"we might talk it over as we drive"}
{"id":"f.watson_landau","of":"watson","attr":"location","value":"landau","time":{"from":"t.landau_drive"},"para":51,"quote":"A minute later we were all seated in a comfortable landau"}
{"id":"f.holmes_landau","of":"holmes","attr":"location","value":"landau","time":{"from":"t.landau_drive"},"para":51,"quote":"A minute later we were all seated in a comfortable landau"}
{"id":"f.ross_landau","of":"ross","attr":"location","value":"landau","time":{"from":"t.landau_drive"},"para":51,"quote":"A minute later we were all seated in a comfortable landau"}
{"id":"f.gregory_landau","of":"gregory","attr":"location","value":"landau","time":{"from":"t.landau_drive"},"para":51,"quote":"A minute later we were all seated in a comfortable landau"}
{"id":"f.landau_through_town","of":"landau","attr":"location","value":"tavistock","detail":"rattling through the town","time":{"at":"t.landau_drive"},"para":51,"quote":"were rattling through the quaint old Devonshire city"}
{"id":"f.gregory_pours_out","of":"gregory","attr":"action","value":"is full of his case and pours out a stream of remarks","time":{"at":"t.landau_drive"},"para":51,"quote":"Inspector Gregory was full of his case, and poured out a stream of remarks"}
{"id":"f.holmes_interjects","of":"holmes","attr":"action","value":"throws in an occasional question or interjection","time":{"at":"t.landau_drive"},"para":51,"quote":"while Holmes threw in an occasional question or interjection"}
{"id":"f.ross_leans_back","of":"ross","attr":"position","value":"leaning back with his arms folded and his hat tilted over his eyes","time":{"at":"t.landau_drive"},"para":51,"quote":"Colonel Ross leaned back with his arms folded and his hat tilted over his eyes"}
{"id":"f.ross_hat_w","of":"ross","attr":"wearing","value":"ross_hat","time":{"at":"t.landau_drive"},"para":51,"quote":"his hat tilted over his eyes"}
{"id":"f.watson_listens_drive","of":"watson","attr":"action","value":"listens with interest to the dialogue of the two detectives","time":{"at":"t.landau_drive"},"para":51,"quote":"I listened with interest to the dialogue of the two detectives"}
{"id":"f.gregory_theory","of":"gregory","attr":"believes","value":"a theory of the case almost exactly what Holmes foretold in the train","time":{"at":"t.landau_drive"},"para":51,"quote":"Gregory was formulating his theory, which was almost exactly what Holmes had foretold in the train"}
{"id":"f.gregory_net","of":"gregory","attr":"says","value":"the net is drawn pretty close round Fitzroy Simpson","to":"holmes","time":{"at":"t.landau_drive"},"para":52,"quote":"The net is drawn pretty close round Fitzroy Simpson"}
{"id":"f.gregory_believes_simpson","of":"gregory","attr":"believes","value":"Simpson is the man","time":{"at":"t.landau_drive"},"para":52,"quote":"I believe myself that he is our man","asserts":[{"of":"simpson","attr":"action","value":"kills Straker and takes the horse","time":{"at":"t.crime"}}]}
{"id":"f.gregory_circumstantial","of":"gregory","attr":"says","value":"the evidence is purely circumstantial and some new development may upset it","to":"holmes","time":{"at":"t.landau_drive"},"para":52,"quote":"I recognise that the evidence is purely circumstantial, and that some new development may upset it"}
{"id":"f.holmes_asks_knife","of":"holmes","attr":"action","act":"ask","value":"asks about Straker's knife","to":"gregory","time":{"at":"t.landau_drive"},"para":53,"quote":"How about Straker’s knife?"}
{"id":"f.gregory_self_wound","of":"gregory","attr":"says","value":"the police have concluded that Straker wounded himself in his fall","to":"holmes","time":{"at":"t.landau_drive"},"para":54,"quote":"We have quite come to the conclusion that he wounded himself in his fall.","asserts":[{"of":"straker","attr":"action","value":"wounds himself with his own knife in his fall","time":{"at":"t.crime"}}]}
{"id":"f.police_self_wound","of":"police","attr":"believes","value":"Straker wounded himself in his fall","claim":"f.gregory_self_wound","time":{"at":"t.landau_drive"},"para":54,"quote":"We have quite come to the conclusion that he wounded himself in his fall."}
{"id":"f.holmes_watson_suggested","of":"holmes","attr":"says","value":"Watson made that suggestion to him on the way down","to":"gregory","time":{"at":"t.landau_drive"},"para":55,"quote":"My friend Dr. Watson made that suggestion to me as we came down."}
{"id":"f.holmes_tells_against","of":"holmes","attr":"says","value":"if so, it would tell against Simpson","to":"gregory","time":{"at":"t.landau_drive"},"para":55,"quote":"If so, it would tell against this man Simpson."}
{"id":"f.gregory_no_knife","of":"gregory","attr":"says","value":"Simpson has neither a knife nor any sign of a wound","to":"holmes","time":{"at":"t.landau_drive"},"para":56,"quote":"He has neither a knife nor any sign of a wound.","asserts":[{"of":"simpson","attr":"carrying","value":"a knife","neg":true,"time":{"at":"t.simpson_arrest"}},{"of":"simpson","attr":"condition","value":"wounded","neg":true,"time":{"at":"t.simpson_arrest"}}]}
{"id":"f.gregory_case_strong","of":"gregory","attr":"says","value":"the evidence is very strong: Simpson had a great interest in the favourite's disappearance, lies under suspicion of poisoning the stable-boy, was out in the storm, was armed with a heavy stick, and his cravat was in the dead man's hand","to":"holmes","time":{"at":"t.landau_drive"},"para":56,"quote":"He had a great interest in the disappearance of the favourite.","asserts":[{"of":"simpson","attr":"condition","value":"has a great interest in the favourite's disappearance","time":{"at":"t.crime"}},{"of":"simpson","attr":"action","value":"poisons the stable-boy","time":{"at":"t.mon_window"}},{"of":"simpson","attr":"carrying","value":"simpson_stick","time":{"at":"t.crime"}},{"of":"cravat","attr":"location","value":"hollow","detail":"in the dead man's hand","time":{"at":"t.morning_search"}}]}
{"id":"f.simpson_suspected_poison","of":"simpson","attr":"condition","value":"under suspicion of having poisoned the stable-boy","word":"gregory","time":{"at":"t.landau_drive"},"para":56,"quote":"He lies under suspicion of having poisoned the stable-boy"}
{"id":"f.gregory_jury","of":"gregory","attr":"believes","value":"there is enough to go before a jury","time":{"at":"t.landau_drive"},"para":56,"quote":"I really think we have enough to go before a jury."}
{"id":"f.holmes_shakes_head","of":"holmes","attr":"action","value":"shakes his head","time":{"at":"t.landau_drive"},"para":57,"quote":"Holmes shook his head."}
{"id":"f.holmes_counsel","of":"holmes","attr":"says","value":"a clever counsel would tear the case all to rags","to":"gregory","time":{"at":"t.landau_drive"},"para":57,"quote":"A clever counsel would tear it all to rags"}
{"id":"f.holmes_why_out","of":"holmes","attr":"action","act":"ask","value":"asks why Simpson should take the horse out of the stable, when he could injure it there","to":"gregory","time":{"at":"t.landau_drive"},"para":57,"quote":"Why should he take the horse out of the stable? If he wished to injure it why could he not do it there?"}
{"id":"f.holmes_asks_key","of":"holmes","attr":"action","act":"ask","value":"asks whether a duplicate key has been found in Simpson's possession","to":"gregory","time":{"at":"t.landau_drive"},"para":57,"quote":"Has a duplicate key been found in his possession?"}
{"id":"f.holmes_asks_chemist","of":"holmes","attr":"action","act":"ask","value":"asks what chemist sold Simpson the powdered opium","to":"gregory","time":{"at":"t.landau_drive"},"para":57,"quote":"What chemist sold him the powdered opium?"}
{"id":"f.holmes_asks_hide","of":"holmes","attr":"action","act":"ask","value":"asks where Simpson, a stranger to the district, could hide such a horse","to":"gregory","time":{"at":"t.landau_drive"},"para":57,"quote":"where could he, a stranger to the district, hide a horse, and such a horse as this?"}
{"id":"f.holmes_asks_paper","of":"holmes","attr":"action","act":"ask","value":"asks Simpson's own explanation of the paper he wished the maid to give the stable-boy","to":"gregory","time":{"at":"t.landau_drive"},"para":57,"quote":"What is his own explanation as to the paper which he wished the maid to give to the stable-boy?"}
{"id":"f.simpson_says_note","of":"simpson","attr":"says","value":"the paper was a ten-pound note","to":"gregory","time":{"after":"t.simpson_arrest","before":"t.landau_drive"},"para":58,"quote":"He says that it was a ten-pound note.","asserts":[{"of":"paper_packet","attr":"identity","value":"ten_pound_note"}]}
{"id":"f.note_in_purse","of":"ten_pound_note","attr":"location","value":"simpson_purse","time":{"at":"t.simpson_arrest"},"para":58,"quote":"One was found in his purse."}
{"id":"f.purse_owner","of":"simpson_purse","attr":"owner","value":"simpson","basis":"implied","time":{"at":"t.simpson_arrest"},"para":58,"quote":"One was found in his purse."}
{"id":"f.gregory_not_formidable","of":"gregory","attr":"says","value":"Holmes's other difficulties are not so formidable as they seem","to":"holmes","time":{"at":"t.landau_drive"},"para":58,"quote":"your other difficulties are not so formidable as they seem"}
{"id":"f.gregory_not_stranger","of":"gregory","attr":"says","value":"Simpson is not a stranger to the district","to":"holmes","time":{"at":"t.landau_drive"},"para":58,"quote":"He is not a stranger to the district.","asserts":[{"of":"simpson","attr":"knows","value":"the district","time":{"at":"t.crime"}}]}
{"id":"f.simpson_lodged","of":"simpson","attr":"location","value":"tavistock","detail":"lodging, twice, in the summer","time":{"at":"t.simpson_summers"},"para":58,"quote":"He has twice lodged at Tavistock in the summer."}
{"id":"f.gregory_opium_london","of":"gregory","attr":"says","value":"the opium was probably brought from London","to":"holmes","modal":"possible","time":{"at":"t.landau_drive"},"para":58,"quote":"The opium was probably brought from London.","asserts":[{"of":"opium","attr":"location","value":"london","time":{"before":"t.mon_window"}}]}
{"id":"f.gregory_key_hurled","of":"gregory","attr":"says","value":"the key, having served its purpose, would be hurled away","to":"holmes","modal":"possible","time":{"at":"t.landau_drive"},"para":58,"quote":"The key, having served its purpose, would be hurled away.","asserts":[{"of":"simpson","attr":"action","value":"throws away the duplicate key","time":{"after":"t.horse_taken"}}]}
{"id":"f.gregory_pits","of":"gregory","attr":"says","value":"the horse may be at the bottom of one of the pits or old mines upon the moor","to":"holmes","modal":"possible","time":{"at":"t.landau_drive"},"para":58,"quote":"The horse may be at the bottom of one of the pits or old mines upon the moor.","asserts":[{"of":"silver_blaze","attr":"location","value":"pits_mines","detail":"at the bottom","time":{"at":"t.landau_drive"}}]}
{"id":"f.holmes_asks_cravat","of":"holmes","attr":"action","act":"ask","value":"asks what Simpson says about the cravat","to":"gregory","time":{"at":"t.landau_drive"},"para":59,"quote":"What does he say about the cravat?"}
{"id":"f.simpson_cravat_his","of":"simpson","attr":"says","value":"the cravat is his","to":"gregory","time":{"at":"t.simpson_arrest"},"para":60,"quote":"He acknowledges that it is his","asserts":[{"of":"cravat","attr":"owner","value":"simpson"}]}
{"id":"f.simpson_says_lost","of":"simpson","attr":"says","value":"he had lost the cravat","to":"gregory","time":{"at":"t.simpson_arrest"},"para":60,"quote":"declares that he had lost it","asserts":[{"of":"cravat","attr":"location","value":null,"detail":"lost by Simpson","time":{"from":"t.simpson_lost_cravat"}}]}
{"id":"f.gregory_new_element","of":"gregory","attr":"says","value":"a new element has been introduced which may account for Simpson leading the horse from the stable","to":"holmes","time":{"at":"t.landau_drive"},"para":60,"quote":"a new element has been introduced into the case which may account for his leading the horse from the stable"}
{"id":"f.holmes_pricks_ears","of":"holmes","attr":"action","value":"pricks up his ears","time":{"at":"t.landau_drive"},"para":61,"quote":"Holmes pricked up his ears."}
{"id":"f.traces_found","of":"police","attr":"action","value":"find traces of a gypsy encampment","time":{"at":"t.gypsy_traces_found"},"para":62,"quote":"We have found traces which show that a party of gypsies encamped on Monday night"}
{"id":"f.gypsies_encamped","of":"gypsy_party","attr":"location","value":"gypsy_camp","detail":"encamped","time":{"at":"t.crime"},"para":62,"quote":"a party of gypsies encamped on Monday night within a mile of the spot where the murder took place"}
{"id":"f.camp_position","of":"gypsy_camp","attr":"position","value":"within a mile of the spot where the murder took place","time":{"at":"t.crime"},"para":62,"quote":"within a mile of the spot where the murder took place"}
{"id":"f.gypsy_party_member","of":"gypsy_party","attr":"member_of","value":"gypsies","basis":"implied","time":{"at":"t.crime"},"para":62,"quote":"a party of gypsies"}
{"id":"f.gypsies_left","of":"gypsy_party","attr":"location","value":"gypsy_camp","neg":true,"detail":"gone","time":{"at":"t.gypsies_gone"},"para":62,"quote":"On Tuesday they were gone."}
{"id":"f.cal_tue_gypsies","of":"calendar","attr":"weekday","value":"Tuesday","time":{"at":"t.gypsies_gone"},"para":62,"quote":"On Tuesday they were gone."}
{"id":"f.gregory_gypsy_theory","of":"gregory","attr":"says","value":"if Simpson had an understanding with the gypsies, he may have been leading the horse to them when overtaken, and they may have him now","to":"holmes","modal":"possible","time":{"at":"t.landau_drive"},"para":62,"quote":"presuming that there was some understanding between Simpson and these gypsies, might he not have been leading the horse to them when he was overtaken, and may they not have him now?","asserts":[{"of":"simpson","attr":"action","value":"leads the horse to the gypsies by arrangement with them","time":{"at":"t.crime"}},{"of":"gypsy_party","attr":"carrying","value":"silver_blaze","time":{"at":"t.landau_drive"}}]}
{"id":"f.holmes_possible","of":"holmes","attr":"says","value":"it is certainly possible","to":"gregory","modal":"possible","time":{"at":"t.landau_drive"},"para":63,"quote":"It is certainly possible."}
{"id":"f.moor_scoured","of":"police","attr":"action","value":"scour the moor for the gypsies","time":{"at":"t.landau_drive"},"para":64,"quote":"The moor is being scoured for these gypsies."}
{"id":"f.gregory_searched_stables","of":"gregory","attr":"action","value":"examines every stable and out-house in Tavistock and for ten miles round","time":{"at":"t.gregory_stables"},"para":64,"quote":"I have also examined every stable and out-house in Tavistock, and for a radius of ten miles."}
{"id":"f.stables_no_horse","of":"silver_blaze","attr":"location","value":"tavistock_stables","neg":true,"basis":"implied","time":{"at":"t.gregory_stables"},"para":64,"quote":"I have also examined every stable and out-house in Tavistock, and for a radius of ten miles."}
{"id":"f.holmes_asks_mapleton","of":"holmes","attr":"action","act":"ask","value":"asks about the other training-stable close by","to":"gregory","time":{"at":"t.landau_drive"},"para":65,"quote":"There is another training-stable quite close, I understand?"}
{"id":"f.gregory_not_neglect","of":"gregory","attr":"says","value":"Mapleton is a factor that must certainly not be neglected","to":"holmes","time":{"at":"t.landau_drive"},"para":66,"quote":"that is a factor which we must certainly not neglect"}
{"id":"f.desborough_second_betting","of":"desborough","attr":"condition","value":"second in the betting","time":{"at":"t.crime"},"para":66,"quote":"As Desborough, their horse, was second in the betting"}
{"id":"f.gregory_mapleton_interest","of":"gregory","attr":"says","value":"the Mapleton people had an interest in the favourite's disappearance","to":"holmes","time":{"at":"t.landau_drive"},"para":66,"quote":"they had an interest in the disappearance of the favourite","asserts":[{"of":"mapleton","attr":"condition","value":"has an interest in the disappearance of the favourite","time":{"at":"t.crime"}}]}
{"id":"f.brown_large_bets","of":"silas_brown","attr":"action","value":"has large bets upon the Wessex Cup","time":{"at":"t.brown_bets"},"para":66,"quote":"Silas Brown, the trainer, is known to have had large bets upon the event"}
{"id":"f.brown_trainer","of":"silas_brown","attr":"role","value":"trainer at Mapleton","time":{"at":"t.crime"},"para":66,"quote":"Silas Brown, the trainer"}
{"id":"f.brown_no_friend","of":"silas_brown","attr":"condition","value":"no friend to Straker","time":{"before":"t.crime"},"para":66,"quote":"he was no friend to poor Straker"}
{"id":"f.mapleton_examined","of":"police","attr":"action","value":"examine the Mapleton stables","time":{"at":"t.gregory_mapleton"},"para":66,"quote":"We have, however, examined the stables"}
{"id":"f.gregory_nothing_brown","of":"gregory","attr":"says","value":"there is nothing to connect Silas Brown with the affair","to":"holmes","time":{"at":"t.landau_drive"},"para":66,"quote":"there is nothing to connect him with the affair"}
{"id":"f.holmes_asks_link","of":"holmes","attr":"action","act":"ask","value":"asks whether anything connects Simpson with the interests of the Mapleton stables","to":"gregory","time":{"at":"t.landau_drive"},"para":67,"quote":"And nothing to connect this man Simpson with the interests of the Mapleton stables?"}
{"id":"f.gregory_no_link","of":"gregory","attr":"says","value":"nothing at all connects Simpson with the Mapleton stables","to":"holmes","time":{"at":"t.landau_drive"},"para":68,"quote":"Nothing at all.","asserts":[{"of":"simpson","attr":"member_of","value":"mapleton","neg":true}]}
{"id":"f.gregory_tells_drive","of":"gregory","attr":"tells","value":"acct.gregory_drive","to":"watson","how":"told","time":{"at":"t.landau_drive"},"para":51,"quote":"Inspector Gregory was full of his case, and poured out a stream of remarks"}
{"id":"f.gregory_tells_simpson","of":"gregory","attr":"tells","value":"acct.simpson","to":"watson","how":"told","partial":true,"time":{"at":"t.landau_drive"},"para":58,"quote":"He says that it was a ten-pound note."}
{"id":"f.holmes_leans_back_carriage","of":"holmes","attr":"position","value":"leaning back in the carriage","time":{"at":"t.landau_drive"},"para":69,"quote":"Holmes leaned back in the carriage, and the conversation ceased."}
{"id":"f.talk_ceases","of":"gregory","attr":"action","value":"stops talking: the conversation ceases","time":{"at":"t.landau_drive"},"para":69,"quote":"the conversation ceased"}
{"id":"f.driver_pulls_up","of":"driver","attr":"action","value":"pulls up at a neat little red-brick villa with overhanging eaves","time":{"at":"t.villa_arrival"},"para":69,"quote":"our driver pulled up at a neat little red-brick villa with overhanging eaves"}
{"id":"f.landau_at_villa","of":"landau","attr":"location","value":"road","detail":"pulled up at the villa","time":{"at":"t.villa_arrival"},"para":69,"quote":"our driver pulled up at a neat little red-brick villa"}
{"id":"f.villa_red_brick","of":"straker_villa","attr":"condition","value":"a neat little red-brick villa with overhanging eaves","time":{"at":"t.villa_arrival"},"para":69,"quote":"a neat little red-brick villa with overhanging eaves"}
{"id":"f.villa_by_road","of":"straker_villa","attr":"position","value":"by the road","time":{"from":"t.before"},"para":69,"quote":"which stood by the road"}
{"id":"f.outbuilding_position","of":"out_building","attr":"position","value":"some distance off, across a paddock from the villa","time":{"from":"t.before"},"para":69,"quote":"Some distance off, across a paddock, lay a long grey-tiled out-building"}
{"id":"f.moor_ferns","of":"dartmoor","attr":"condition","value":"low curves of moor, bronze-coloured from the fading ferns, stretching to the sky-line","time":{"at":"t.villa_arrival"},"para":69,"quote":"the low curves of the moor, bronze-coloured from the fading ferns, stretched away to the sky-line"}
{"id":"f.steeples_visible","of":"tavistock_steeples","attr":"position","value":"on the sky-line, visible from the villa","time":{"at":"t.villa_arrival"},"para":69,"quote":"broken only by the steeples of Tavistock"}
{"id":"f.mapleton_visible","of":"mapleton","attr":"position","value":"a cluster of houses away to the westward, visible from the villa","time":{"from":"t.before"},"para":69,"quote":"by a cluster of houses away to the westward which marked the Mapleton stables"}
{"id":"f.watson_springs_out","of":"watson","attr":"location","value":"front_door_villa","time":{"at":"t.villa_arrival"},"para":69,"quote":"We all sprang out with the exception of Holmes"}
{"id":"f.gregory_springs_out","of":"gregory","attr":"location","value":"front_door_villa","time":{"at":"t.villa_arrival"},"para":69,"quote":"We all sprang out with the exception of Holmes"}
{"id":"f.ross_springs_out","of":"ross","attr":"location","value":"front_door_villa","time":{"at":"t.villa_arrival"},"para":69,"quote":"We all sprang out with the exception of Holmes"}
{"id":"f.holmes_stays_landau","of":"holmes","attr":"location","value":"landau","detail":"staying in the carriage","time":{"at":"t.villa_arrival"},"para":69,"quote":"who continued to lean back with his eyes fixed upon the sky in front of him"}
{"id":"f.holmes_absorbed","of":"holmes","attr":"condition","value":"entirely absorbed in his own thoughts","time":{"at":"t.villa_arrival"},"para":69,"quote":"entirely absorbed in his own thoughts"}
{"id":"f.watson_touches_arm","of":"watson","attr":"action","value":"touches Holmes's arm","to":"holmes","time":{"at":"t.villa_arrival"},"para":69,"quote":"It was only when I touched his arm"}
{"id":"f.holmes_starts_out","of":"holmes","attr":"action","value":"rouses himself with a violent start and steps out of the carriage","time":{"at":"t.villa_arrival"},"para":69,"quote":"he roused himself with a violent start and stepped out of the carriage"}
{"id":"f.holmes_out_villa","of":"holmes","attr":"location","value":"front_door_villa","time":{"at":"t.villa_arrival"},"para":69,"quote":"stepped out of the carriage"}
{"id":"f.ross_surprised","of":"ross","attr":"action","value":"looks at Holmes in some surprise","time":{"at":"t.villa_arrival"},"para":70,"quote":"who had looked at him in some surprise"}
{"id":"f.holmes_daydreaming","of":"holmes","attr":"says","value":"he was day-dreaming","to":"ross","time":{"at":"t.villa_arrival"},"para":70,"quote":"Excuse me,” said he, turning to Colonel Ross, who had looked at him in some surprise. “I was day-dreaming."}
{"id":"f.holmes_gleam","of":"holmes","attr":"condition","value":"a gleam in his eyes and a suppressed excitement in his manner","time":{"at":"t.villa_arrival"},"para":70,"quote":"There was a gleam in his eyes and a suppressed excitement in his manner"}
{"id":"f.watson_sees_gleam","of":"watson","attr":"observes","value":["f.holmes_gleam"],"time":{"at":"t.villa_arrival"},"para":70,"quote":"There was a gleam in his eyes and a suppressed excitement in his manner which convinced me"}
{"id":"f.watson_believes_clue","of":"watson","attr":"believes","value":"Holmes has his hand upon a clue","time":{"at":"t.villa_arrival"},"para":70,"quote":"that his hand was upon a clue","asserts":[{"of":"holmes","attr":"knows","value":"a clue to the case","time":{"at":"t.villa_arrival"}}]}
{"id":"f.watson_no_idea_clue","of":"watson","attr":"knows","value":"where Holmes found the clue","neg":true,"time":{"at":"t.villa_arrival"},"para":70,"quote":"though I could not imagine where he had found it"}
{"id":"f.gregory_offers_scene","of":"gregory","attr":"action","act":"ask","value":"asks whether Holmes would prefer to go on at once to the scene of the crime","to":"holmes","time":{"at":"t.villa_arrival"},"para":71,"quote":"Perhaps you would prefer at once to go on to the scene of the crime, Mr. Holmes?"}
{"id":"f.holmes_intends_stay","of":"holmes","attr":"intends","value":"to stay at the house a little and go into one or two questions of detail","time":{"at":"t.villa_arrival"},"para":72,"quote":"I think that I should prefer to stay here a little and go into one or two questions of detail."}
{"id":"f.holmes_asks_brought_back","of":"holmes","attr":"action","act":"ask","value":"asks whether Straker was brought back here","to":"gregory","time":{"at":"t.villa_arrival"},"para":72,"quote":"Straker was brought back here, I presume?"}
{"id":"f.straker_brought_back","of":"straker","attr":"location","value":"straker_villa","detail":"his body brought back","time":{"from":"t.body_brought_back"},"para":73,"quote":"Yes; he lies upstairs."}
{"id":"f.straker_upstairs","of":"straker","attr":"location","value":"upstairs_room","detail":"his body lies there","time":{"at":"t.villa_arrival"},"para":73,"quote":"he lies upstairs"}
{"id":"f.inquest_tomorrow","of":"straker","attr":"condition","value":"an inquest is to be held on him to-morrow","time":{"at":"t.inquest"},"para":73,"quote":"The inquest is to-morrow."}
{"id":"f.holmes_asks_service","of":"holmes","attr":"action","act":"ask","value":"asks whether Straker has been in Ross's service some years","to":"ross","time":{"at":"t.villa_arrival"},"para":74,"quote":"He has been in your service some years, Colonel Ross?"}
{"id":"f.ross_excellent_servant","of":"ross","attr":"says","value":"he has always found Straker an excellent servant","to":"holmes","time":{"at":"t.villa_arrival"},"para":75,"quote":"I have always found him an excellent servant.","asserts":[{"of":"straker","attr":"reputed","value":"an excellent servant","time":{"at":"t.straker_years"}}]}
{"id":"f.holmes_asks_inventory","of":"holmes","attr":"action","act":"ask","value":"asks whether the Inspector made an inventory of what Straker had in his pockets at his death","to":"gregory","time":{"at":"t.villa_arrival"},"para":76,"quote":"I presume that you made an inventory of what he had in his pockets at the time of his death, Inspector?"}
{"id":"f.gregory_has_things","of":"gregory","attr":"says","value":"he has the things themselves in the sitting-room","to":"holmes","time":{"at":"t.villa_arrival"},"para":77,"quote":"I have the things themselves in the sitting-room, if you would care to see them."}
{"id":"f.holmes_glad_see","of":"holmes","attr":"intends","value":"to see the things from Straker's pockets","time":{"at":"t.villa_arrival"},"para":78,"quote":"I should be very glad."}
{"id":"f.watson_sitting_room","of":"watson","attr":"location","value":"sitting_room","detail":"round the central table","time":{"at":"t.sitting_room"},"para":78,"quote":"We all filed into the front room and sat round the central table"}
{"id":"f.holmes_sitting_room","of":"holmes","attr":"location","value":"sitting_room","detail":"round the central table","time":{"at":"t.sitting_room"},"para":78,"quote":"We all filed into the front room and sat round the central table"}
{"id":"f.gregory_sitting_room","of":"gregory","attr":"location","value":"sitting_room","detail":"round the central table","time":{"at":"t.sitting_room"},"para":78,"quote":"We all filed into the front room and sat round the central table"}
{"id":"f.ross_sitting_room","of":"ross","attr":"location","value":"sitting_room","detail":"round the central table","time":{"at":"t.sitting_room"},"para":78,"quote":"We all filed into the front room and sat round the central table"}
{"id":"f.gregory_unlocks_box","of":"gregory","attr":"action","act":"unlock","thing":"tin_box","value":"unlocks a square tin box and lays a small heap of things on the table","time":{"at":"t.sitting_room"},"para":78,"quote":"the Inspector unlocked a square tin box and laid a small heap of things before us"}
{"id":"f.box_location","of":"tin_box","attr":"location","value":"sitting_room","time":{"from":"t.body_brought_back","to":"t.sitting_room"},"para":78,"quote":"the Inspector unlocked a square tin box"}
{"id":"f.things_on_table","of":"tin_box","attr":"contents","value":"vestas, a candle-end, a briar pipe, a pouch of Cavendish, a silver watch and chain, five sovereigns, a pencil-case, a few papers and an ivory-handled knife","time":{"at":"t.sitting_room"},"para":78,"quote":"There was a box of vestas, two inches of tallow candle, an A.D.P. briar-root pipe"}
{"id":"f.watson_sees_things","of":"watson","attr":"observes","value":["f.things_on_table","f.knife_described","f.knife_marked","f.knife_stained"],"time":{"at":"t.sitting_room"},"para":78,"quote":"laid a small heap of things before us"}
{"id":"f.straker_had_vestas","of":"straker","attr":"carrying","value":"vestas","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"There was a box of vestas"}
{"id":"f.straker_had_candle","of":"straker","attr":"carrying","value":"tallow_candle","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"two inches of tallow candle"}
{"id":"f.straker_had_pipe","of":"straker","attr":"carrying","value":"straker_pipe","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"an A.D.P. briar-root pipe"}
{"id":"f.straker_had_pouch","of":"straker","attr":"carrying","value":"tobacco_pouch","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"a pouch of seal-skin with half an ounce of long-cut Cavendish"}
{"id":"f.pouch_contents","of":"tobacco_pouch","attr":"contents","value":"cavendish","detail":"half an ounce of long-cut Cavendish","time":{"at":"t.sitting_room"},"para":78,"quote":"a pouch of seal-skin with half an ounce of long-cut Cavendish"}
{"id":"f.straker_had_watch","of":"straker","attr":"carrying","value":"straker_watch","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"a silver watch with a gold chain"}
{"id":"f.straker_had_sovereigns","of":"straker","attr":"carrying","value":"sovereigns","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"five sovereigns in gold"}
{"id":"f.straker_had_pencil","of":"straker","attr":"carrying","value":"pencil_case","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"an aluminium pencil-case"}
{"id":"f.straker_had_papers","of":"straker","attr":"carrying","value":"pocket_papers","basis":"implied","time":{"at":"t.crime"},"para":78,"quote":"a few papers"}
{"id":"f.knife_described","of":"straker_knife","attr":"condition","value":"ivory-handled, with a very delicate, inflexible blade","time":{"at":"t.sitting_room"},"para":78,"quote":"an ivory-handled knife with a very delicate, inflexible blade"}
{"id":"f.knife_marked","of":"straker_knife","attr":"condition","value":"marked Weiss & Co., London","time":{"at":"t.sitting_room"},"para":78,"quote":"marked Weiss & Co., London"}
{"id":"f.knife_maker","of":"weiss_co","attr":"action","value":"made the knife","basis":"implied","time":{"at":"t.before"},"para":78,"quote":"marked Weiss & Co., London"}
{"id":"f.holmes_examines_knife","of":"holmes","attr":"action","value":"lifts the knife and examines it minutely","time":{"at":"t.sitting_room"},"para":79,"quote":"lifting it up and examining it minutely"}
{"id":"f.holmes_singular_knife","of":"holmes","attr":"says","value":"this is a very singular knife","to":"watson","time":{"at":"t.sitting_room"},"para":79,"quote":"This is a very singular knife"}
{"id":"f.knife_stained","of":"straker_knife","attr":"condition","value":"blood-stained","time":{"at":"t.sitting_room"},"para":79,"quote":"as I see blood-stains upon it"}
{"id":"f.holmes_same_knife","of":"holmes","attr":"says","value":"the knife, being blood-stained, is the one found in the dead man's grasp","to":"gregory","time":{"at":"t.sitting_room"},"para":79,"quote":"I presume, as I see blood-stains upon it, that it is the one which was found in the dead man’s grasp","asserts":[{"of":"straker","attr":"carrying","value":"straker_knife","detail":"in his grasp","time":{"at":"t.morning_search"}}]}
{"id":"f.holmes_asks_watson_knife","of":"holmes","attr":"action","act":"ask","thing":"straker_knife","value":"asks Watson whether the knife is in his line","to":"watson","time":{"at":"t.sitting_room"},"para":79,"quote":"Watson, this knife is surely in your line?"}
{"id":"f.watson_cataract","of":"watson","attr":"says","value":"it is what doctors call a cataract knife","to":"holmes","time":{"at":"t.sitting_room"},"para":80,"quote":"It is what we call a cataract knife","asserts":[{"of":"straker_knife","attr":"identity","value":"a cataract knife"}]}
{"id":"f.holmes_thought_so","of":"holmes","attr":"says","value":"he thought so: a very delicate blade devised for very delicate work","to":"watson","time":{"at":"t.sitting_room"},"para":81,"quote":"I thought so. A very delicate blade devised for very delicate work."}
{"id":"f.holmes_strange_carry","of":"holmes","attr":"says","value":"it is a strange thing for a man to carry on a rough expedition, especially as it would not shut in his pocket","to":"watson","time":{"at":"t.sitting_room"},"para":81,"quote":"A strange thing for a man to carry with him upon a rough expedition, especially as it would not shut in his pocket.","asserts":[{"of":"straker_knife","attr":"condition","value":"would not shut in a pocket"}]}
{"id":"f.knife_no_shut","of":"straker_knife","attr":"condition","value":"would not shut in a pocket","word":"holmes","time":{"at":"t.sitting_room"},"para":81,"quote":"it would not shut in his pocket"}
{"id":"f.cork_guarded","of":"cork_disk","attr":"action","value":"guarded the tip of the knife","time":{"before":"t.crime"},"para":82,"quote":"The tip was guarded by a disk of cork"}
{"id":"f.cork_beside_body","of":"cork_disk","attr":"location","value":"hollow","detail":"beside Straker's body","time":{"at":"t.morning_search"},"para":82,"quote":"which we found beside his body"}
{"id":"f.police_find_cork","of":"police","attr":"action","value":"find the disk of cork beside the body","time":{"after":"t.morning_search","before":"t.sitting_room"},"para":82,"quote":"which we found beside his body"}
{"id":"f.knife_on_table","of":"straker_knife","attr":"location","value":"dressing_table","time":{"before":"t.straker_leaves"},"para":82,"quote":"the knife had lain upon the dressing-table"}
{"id":"f.straker_picks_knife","of":"straker","attr":"action","value":"picks up the knife from the dressing-table as he leaves the room","time":{"at":"t.straker_leaves"},"para":82,"quote":"he had picked it up as he left the room"}
{"id":"f.straker_carries_knife_leaving","of":"straker","attr":"carrying","value":"straker_knife","basis":"implied","time":{"from":"t.straker_leaves"},"para":82,"quote":"he had picked it up as he left the room"}
{"id":"f.straker_in_bedroom","of":"straker","attr":"location","value":"straker_bedroom","time":{"at":"t.straker_leaves"},"para":82,"quote":"as he left the room"}
{"id":"f.mrs_tells_gregory","of":"mrs_straker","attr":"tells","value":"acct.mrs_straker_inspector","to":"gregory","how":"told","time":{"at":"t.mrs_straker_tells"},"para":82,"quote":"His wife tells us"}
{"id":"f.gregory_poor_weapon","of":"gregory","attr":"says","value":"the knife was a poor weapon, but perhaps the best Straker could lay hands on at the moment","to":"holmes","modal":"possible","time":{"at":"t.sitting_room"},"para":82,"quote":"It was a poor weapon, but perhaps the best that he could lay his hands on at the moment.","asserts":[{"of":"straker","attr":"intends","value":"to use the knife as a weapon to defend himself","time":{"at":"t.straker_leaves"}}]}
{"id":"f.holmes_very_possible","of":"holmes","attr":"says","value":"it is very possible","to":"gregory","modal":"possible","time":{"at":"t.sitting_room"},"para":83,"quote":"Very possible."}
{"id":"f.holmes_asks_papers","of":"holmes","attr":"action","act":"ask","thing":"pocket_papers","value":"asks about the papers","to":"gregory","time":{"at":"t.sitting_room"},"para":83,"quote":"How about these papers?"}
{"id":"f.papers_hay","of":"pocket_papers","attr":"contents","value":"hay_accounts","detail":"three receipted hay-dealers' accounts","time":{"at":"t.sitting_room"},"para":84,"quote":"Three of them are receipted hay-dealers’ accounts."}
{"id":"f.papers_ross_letter","of":"pocket_papers","attr":"contents","value":"ross_letter","time":{"at":"t.sitting_room"},"para":84,"quote":"One of them is a letter of instructions from Colonel Ross."}
{"id":"f.ross_wrote_letter","of":"ross","attr":"action","value":"writes Straker a letter of instructions","basis":"implied","time":{"before":"t.crime"},"para":84,"quote":"a letter of instructions from Colonel Ross"}
{"id":"f.papers_milliner","of":"pocket_papers","attr":"contents","value":"milliner_account","time":{"at":"t.sitting_room"},"para":84,"quote":"This other is a milliner’s account"}
{"id":"f.account_sum","of":"milliner_account","attr":"contents","value":"a milliner's bill for thirty-seven pounds fifteen","time":{"at":"t.sitting_room"},"para":84,"quote":"a milliner’s account for thirty-seven pounds fifteen"}
{"id":"f.lesurier_makes_account","of":"lesurier","attr":"action","value":"makes out the account to William Derbyshire","time":{"at":"t.milliner_account"},"para":84,"quote":"made out by Madame Lesurier, of Bond Street, to William Derbyshire"}
{"id":"f.lesurier_bond_street","of":"lesurier","attr":"lives_at","value":"bond_street","detail":"her business","time":{"at":"t.milliner_account"},"para":84,"quote":"Madame Lesurier, of Bond Street"}
{"id":"f.lesurier_milliner","of":"lesurier","attr":"role","value":"milliner","basis":"implied","time":{"at":"t.milliner_account"},"para":84,"quote":"a milliner’s account for thirty-seven pounds fifteen made out by Madame Lesurier"}
{"id":"f.account_to_derbyshire","of":"milliner_account","attr":"owner","value":"derbyshire","detail":"made out to him","time":{"at":"t.milliner_account"},"para":84,"quote":"to William Derbyshire"}
{"id":"f.derbyshire_name","of":"derbyshire","attr":"name","value":"William Derbyshire","time":{"at":"t.milliner_account"},"para":84,"quote":"William Derbyshire"}
{"id":"f.straker_had_account","of":"straker","attr":"carrying","value":"milliner_account","basis":"implied","time":{"at":"t.crime"},"para":84,"quote":"This other is a milliner’s account"}
{"id":"f.derbyshire_friend","of":"derbyshire","attr":"role","value":"a friend of Straker's","time":{"at":"t.derbyshire_letters"},"para":84,"quote":"Derbyshire was a friend of her husband’s"}
{"id":"f.derbyshire_letters","of":"derbyshire","attr":"condition","value":"his letters occasionally addressed to Straker's house","time":{"at":"t.derbyshire_letters"},"para":84,"quote":"occasionally his letters were addressed here"}
{"id":"f.mrs_tells_gregory_derbyshire","of":"mrs_straker","attr":"tells","value":"acct.mrs_straker_inspector","to":"gregory","how":"told","time":{"at":"t.mrs_straker_tells"},"para":84,"quote":"Mrs. Straker tells us that Derbyshire was a friend of her husband’s"}
{"id":"f.gregory_tells_house","of":"gregory","attr":"tells","value":["acct.gregory_house","acct.mrs_straker_inspector"],"to":"watson","how":"told","time":{"at":"t.sitting_room"},"para":82,"quote":"The tip was guarded by a disk of cork which we found beside his body"}
{"id":"f.holmes_glances_account","of":"holmes","attr":"action","value":"glances down the milliner's account","time":{"at":"t.sitting_room"},"para":85,"quote":"glancing down the account"}
{"id":"f.holmes_madam_tastes","of":"holmes","attr":"says","value":"Madam Derbyshire had somewhat expensive tastes","to":"gregory","time":{"at":"t.sitting_room"},"para":85,"quote":"Madam Derbyshire had somewhat expensive tastes","asserts":[{"of":"madam_derbyshire","attr":"condition","value":"has somewhat expensive tastes","time":{"at":"t.milliner_account"}}]}
{"id":"f.holmes_22_guineas","of":"holmes","attr":"says","value":"twenty-two guineas is rather heavy for a single costume","to":"gregory","time":{"at":"t.sitting_room"},"para":85,"quote":"Twenty-two guineas is rather heavy for a single costume."}
{"id":"f.costume_price","of":"account_costume","attr":"condition","value":"priced at twenty-two guineas on the account","word":"holmes","time":{"at":"t.milliner_account"},"para":85,"quote":"Twenty-two guineas is rather heavy for a single costume."}
{"id":"f.holmes_nothing_more","of":"holmes","attr":"says","value":"there appears to be nothing more to learn, and they may now go down to the scene of the crime","to":"gregory","time":{"at":"t.sitting_room"},"para":85,"quote":"However there appears to be nothing more to learn, and we may now go down to the scene of the crime."}
{"id":"f.holmes_intends_scene","of":"holmes","attr":"intends","value":"to go down to the scene of the crime","time":{"at":"t.sitting_room"},"para":85,"quote":"we may now go down to the scene of the crime"}
{"id":"f.party_emerge","of":"watson","attr":"location","value":"passage","detail":"emerging from the sitting-room","time":{"at":"t.passage_mrs_straker"},"para":86,"quote":"As we emerged from the sitting-room"}
{"id":"f.holmes_passage","of":"holmes","attr":"location","value":"passage","time":{"at":"t.passage_mrs_straker"},"para":86,"quote":"As we emerged from the sitting-room"}
{"id":"f.gregory_passage","of":"gregory","attr":"location","value":"passage","time":{"at":"t.passage_mrs_straker"},"para":86,"quote":"As we emerged from the sitting-room"}
{"id":"f.mrs_waiting_passage","of":"mrs_straker","attr":"location","value":"passage","detail":"waiting","time":{"from":"t.sitting_room","to":"t.passage_mrs_straker"},"para":86,"quote":"a woman, who had been waiting in the passage"}
{"id":"f.mrs_hand_sleeve","of":"mrs_straker","attr":"action","value":"steps forward and lays her hand upon the Inspector's sleeve","to":"gregory","time":{"at":"t.passage_mrs_straker"},"para":86,"quote":"took a step forward and laid her hand upon the Inspector’s sleeve"}
{"id":"f.mrs_haggard","of":"mrs_straker","attr":"condition","value":"face haggard, thin and eager, stamped with the print of a recent horror","time":{"at":"t.passage_mrs_straker"},"para":86,"quote":"Her face was haggard and thin and eager, stamped with the print of a recent horror."}
{"id":"f.watson_sees_mrs","of":"watson","attr":"observes","value":["f.mrs_hand_sleeve","f.mrs_haggard"],"time":{"at":"t.passage_mrs_straker"},"para":86,"quote":"Her face was haggard and thin and eager"}
{"id":"f.mrs_asks_found","of":"mrs_straker","attr":"action","act":"ask","value":"asks, panting, whether they have got them, whether they have found them","to":"gregory","time":{"at":"t.passage_mrs_straker"},"para":87,"quote":"Have you got them? Have you found them?"}
{"id":"f.gregory_not_found","of":"gregory","attr":"says","value":"they have not found them, but Mr. Holmes has come from London to help and they will do all that is possible","to":"mrs_straker","time":{"at":"t.passage_mrs_straker"},"para":88,"quote":"No, Mrs. Straker. But Mr. Holmes here has come from London to help us"}
{"id":"f.mrs_straker_named","of":"mrs_straker","attr":"name","value":"Mrs. Straker","time":{"at":"t.passage_mrs_straker"},"para":88,"quote":"No, Mrs. Straker."}
{"id":"f.holmes_plymouth","of":"holmes","attr":"says","value":"surely he met Mrs. Straker at a garden-party in Plymouth some little time ago","to":"mrs_straker","time":{"at":"t.passage_mrs_straker"},"para":89,"quote":"Surely I met you in Plymouth at a garden-party some little time ago, Mrs. Straker?","asserts":[{"of":"mrs_straker","attr":"location","value":"garden_party","time":{"at":"t.plymouth_party"}},{"of":"holmes","attr":"location","value":"garden_party","time":{"at":"t.plymouth_party"}}]}
{"id":"f.mrs_mistaken","of":"mrs_straker","attr":"says","value":"Holmes is mistaken","to":"holmes","time":{"at":"t.passage_mrs_straker"},"para":90,"quote":"No, sir; you are mistaken.","asserts":[{"of":"mrs_straker","attr":"location","value":"garden_party","neg":true,"time":{"at":"t.plymouth_party"}}]}
{"id":"f.holmes_sworn","of":"holmes","attr":"says","value":"he could have sworn to it","to":"mrs_straker","time":{"at":"t.passage_mrs_straker"},"para":91,"quote":"Dear me! Why, I could have sworn to it."}
{"id":"f.holmes_dove_dress","of":"holmes","attr":"says","value":"she wore a costume of dove-coloured silk with ostrich-feather trimming","to":"mrs_straker","time":{"at":"t.passage_mrs_straker"},"para":91,"quote":"You wore a costume of dove-coloured silk with ostrich-feather trimming.","asserts":[{"of":"mrs_straker","attr":"wearing","value":"dove_dress","time":{"at":"t.plymouth_party"}}]}
{"id":"f.mrs_never_dress","of":"mrs_straker","attr":"says","value":"she never had such a dress","to":"holmes","time":{"at":"t.passage_mrs_straker"},"para":92,"quote":"I never had such a dress, sir","asserts":[{"of":"dove_dress","attr":"owner","value":"mrs_straker","neg":true}]}
{"id":"f.holmes_settles","of":"holmes","attr":"says","value":"that quite settles it","to":"mrs_straker","time":{"at":"t.passage_mrs_straker"},"para":93,"quote":"Ah, that quite settles it"}
{"id":"f.holmes_apologises","of":"holmes","attr":"action","value":"apologises and follows the Inspector outside","time":{"at":"t.passage_mrs_straker"},"para":93,"quote":"with an apology he followed the Inspector outside"}
{"id":"f.party_walk","of":"watson","attr":"action","value":"walks a short way across the moor with the others to the hollow where the body was found","time":{"at":"t.walk_to_hollow"},"para":93,"quote":"A short walk across the moor took us to the hollow in which the body had been found"}
{"id":"f.watson_hollow","of":"watson","attr":"location","value":"hollow","time":{"from":"t.at_hollow"},"para":93,"quote":"A short walk across the moor took us to the hollow"}
{"id":"f.holmes_hollow","of":"holmes","attr":"location","value":"hollow","time":{"at":"t.at_hollow"},"para":93,"quote":"A short walk across the moor took us to the hollow"}
{"id":"f.gregory_hollow","of":"gregory","attr":"location","value":"hollow","time":{"at":"t.at_hollow"},"para":93,"quote":"A short walk across the moor took us to the hollow"}
{"id":"f.ross_hollow","of":"ross","attr":"location","value":"hollow","basis":"implied","time":{"at":"t.at_hollow"},"para":110,"quote":"Colonel Ross, who had shown some signs of impatience at my companion’s quiet and systematic method of work"}
{"id":"f.bush_at_brink","of":"furze_bush","attr":"position","value":"at the brink of the hollow","time":{"from":"t.before"},"para":93,"quote":"At the brink of it was the furze-bush upon which the coat had been hung"}
{"id":"f.watson_sees_bush","of":"watson","attr":"observes","value":["f.bush_at_brink"],"time":{"at":"t.at_hollow"},"para":93,"quote":"At the brink of it was the furze-bush"}
{"id":"f.holmes_no_wind","of":"holmes","attr":"says","value":"he understands there was no wind that night","to":"gregory","time":{"at":"t.at_hollow"},"para":94,"quote":"There was no wind that night, I understand","asserts":[{"of":"weather","attr":"condition","value":"wind","neg":true,"time":{"at":"t.crime"}}]}
{"id":"f.gregory_no_wind","of":"gregory","attr":"says","value":"there was no wind, but very heavy rain","to":"holmes","time":{"at":"t.at_hollow"},"para":95,"quote":"None; but very heavy rain.","asserts":[{"of":"weather","attr":"condition","value":"wind","neg":true,"time":{"at":"t.crime"}},{"of":"weather","attr":"condition","value":"very heavy rain","time":{"at":"t.crime"}}]}
{"id":"f.no_wind","of":"weather","attr":"condition","value":"wind","neg":true,"time":{"at":"t.crime"},"para":95,"quote":"None; but very heavy rain."}
{"id":"f.heavy_rain","of":"weather","attr":"condition","value":"very heavy rain","time":{"at":"t.crime"},"para":95,"quote":"but very heavy rain"}
{"id":"f.holmes_coat_placed","of":"holmes","attr":"says","value":"then the overcoat was not blown against the furze-bush but placed there","to":"gregory","time":{"at":"t.at_hollow"},"para":96,"quote":"In that case the overcoat was not blown against the furze-bush, but placed there.","asserts":[{"of":"?","attr":"action","value":"places the overcoat on the furze-bush","time":{"at":"t.coat_laid"}}]}
{"id":"f.gregory_coat_laid","of":"gregory","attr":"says","value":"the coat was laid across the bush","to":"holmes","time":{"at":"t.at_hollow"},"para":97,"quote":"Yes, it was laid across the bush."}
{"id":"f.coat_laid","of":"?","attr":"action","value":"lays the overcoat across the furze-bush","time":{"at":"t.coat_laid"},"para":97,"quote":"it was laid across the bush"}
{"id":"f.coat_laid_loc","of":"straker_coat","attr":"location","value":"furze_bush","detail":"laid across it","time":{"from":"t.coat_laid"},"para":97,"quote":"it was laid across the bush"}
{"id":"f.holmes_interest","of":"holmes","attr":"says","value":"Gregory fills him with interest","to":"gregory","time":{"at":"t.at_hollow"},"para":98,"quote":"You fill me with interest"}
{"id":"f.holmes_trampled","of":"holmes","attr":"says","value":"the ground has been trampled up a good deal; no doubt many feet have been there since Monday night","to":"gregory","time":{"at":"t.at_hollow"},"para":98,"quote":"I perceive that the ground has been trampled up a good deal","asserts":[{"of":"hollow","attr":"condition","value":"trampled by many feet","time":{"at":"t.ground_trampled"}}]}
{"id":"f.hollow_trampled","of":"hollow","attr":"condition","value":"the ground trampled up a good deal","word":"holmes","time":{"at":"t.at_hollow"},"para":98,"quote":"the ground has been trampled up a good deal"}
{"id":"f.gregory_matting","of":"gregory","attr":"says","value":"a piece of matting has been laid at the side and they have all stood upon it","to":"holmes","time":{"at":"t.at_hollow"},"para":99,"quote":"A piece of matting has been laid here at the side, and we have all stood upon that."}
{"id":"f.matting_laid","of":"matting","attr":"location","value":"hollow","detail":"laid at the side","time":{"from":"t.ground_trampled","to":"t.at_hollow"},"para":99,"quote":"A piece of matting has been laid here at the side"}
{"id":"f.police_stood_matting","of":"police","attr":"action","value":"all stand upon the matting at the side of the hollow","time":{"at":"t.ground_trampled"},"para":99,"quote":"we have all stood upon that"}
{"id":"f.holmes_excellent","of":"holmes","attr":"says","value":"excellent","to":"gregory","time":{"at":"t.at_hollow"},"para":100,"quote":"Excellent."}
{"id":"f.gregory_bag_says","of":"gregory","attr":"says","value":"in his bag he has one of Straker's boots, one of Fitzroy Simpson's shoes and a cast horseshoe of Silver Blaze","to":"holmes","time":{"at":"t.at_hollow"},"para":101,"quote":"In this bag I have one of the boots which Straker wore"}
{"id":"f.gregory_has_bag","of":"gregory","attr":"carrying","value":"gregory_bag","time":{"at":"t.at_hollow"},"para":101,"quote":"In this bag I have"}
{"id":"f.bag_boot","of":"gregory_bag","attr":"contents","value":"straker_boot","time":{"from":"t.gregory_examines_ground","to":"t.at_hollow"},"para":101,"quote":"one of the boots which Straker wore"}
{"id":"f.bag_shoe","of":"gregory_bag","attr":"contents","value":"simpson_shoe","time":{"from":"t.gregory_examines_ground","to":"t.at_hollow"},"para":101,"quote":"one of Fitzroy Simpson’s shoes"}
{"id":"f.bag_horseshoe","of":"gregory_bag","attr":"contents","value":"horseshoe","time":{"from":"t.gregory_examines_ground","to":"t.at_hollow"},"para":101,"quote":"a cast horseshoe of Silver Blaze"}
{"id":"f.boot_owner","of":"straker_boot","attr":"owner","value":"straker","basis":"implied","time":{"at":"t.crime"},"para":101,"quote":"one of the boots which Straker wore"}
{"id":"f.straker_wore_boots","of":"straker","attr":"wearing","value":"straker_boot","basis":"implied","time":{"at":"t.crime"},"para":101,"quote":"one of the boots which Straker wore"}
{"id":"f.shoe_owner","of":"simpson_shoe","attr":"owner","value":"simpson","time":{"at":"t.at_hollow"},"para":101,"quote":"one of Fitzroy Simpson’s shoes"}
{"id":"f.horseshoe_owner","of":"horseshoe","attr":"owner","value":"silver_blaze","time":{"at":"t.shoe_cast"},"para":101,"quote":"a cast horseshoe of Silver Blaze"}
{"id":"f.shoe_cast","of":"silver_blaze","attr":"action","value":"casts a horseshoe","basis":"implied","time":{"at":"t.shoe_cast"},"para":101,"quote":"a cast horseshoe of Silver Blaze"}
{"id":"f.holmes_surpass","of":"holmes","attr":"says","value":"the Inspector surpasses himself","to":"gregory","time":{"at":"t.at_hollow"},"para":102,"quote":"My dear Inspector, you surpass yourself!"}
{"id":"f.holmes_takes_bag","of":"holmes","attr":"action","act":"give","thing":"gregory_bag","value":"takes the bag from the Inspector","time":{"at":"t.at_hollow"},"para":102,"quote":"Holmes took the bag"}
{"id":"f.holmes_carries_bag","of":"holmes","attr":"carrying","value":"gregory_bag","time":{"from":"t.at_hollow"},"para":102,"quote":"Holmes took the bag"}
{"id":"f.holmes_descends","of":"holmes","attr":"location","value":"hollow","detail":"down in the hollow","time":{"at":"t.at_hollow"},"para":102,"quote":"descending into the hollow"}
{"id":"f.holmes_moves_matting","of":"holmes","attr":"action","value":"pushes the matting into a more central position","time":{"at":"t.at_hollow"},"para":102,"quote":"he pushed the matting into a more central position"}
{"id":"f.matting_central","of":"matting","attr":"location","value":"hollow","detail":"in a more central position","time":{"from":"t.at_hollow"},"para":102,"quote":"he pushed the matting into a more central position"}
{"id":"f.holmes_studies_mud","of":"holmes","attr":"action","value":"lies on his face, chin on his hands, and makes a careful study of the trampled mud","time":{"at":"t.at_hollow"},"para":102,"quote":"stretching himself upon his face and leaning his chin upon his hands, he made a careful study of the trampled mud"}
{"id":"f.holmes_whats_this","of":"holmes","attr":"says","value":"Hullo! What's this?","time":{"at":"t.at_hollow"},"para":102,"quote":"“Hullo!” said he, suddenly. “What’s this?”"}
{"id":"f.holmes_finds_vesta","of":"holmes","attr":"action","value":"finds a half-burned wax vesta in the mud","time":{"at":"t.at_hollow"},"para":102,"quote":"It was a wax vesta half burned"}
{"id":"f.vesta_in_mud","of":"wax_vesta","attr":"location","value":"hollow","detail":"in the trampled mud","time":{"from":"t.vesta_dropped","to":"t.at_hollow"},"para":102,"quote":"It was a wax vesta half burned, which was so coated with mud"}
{"id":"f.vesta_half_burned","of":"wax_vesta","attr":"condition","value":"half burned","time":{"at":"t.at_hollow"},"para":102,"quote":"a wax vesta half burned"}
{"id":"f.vesta_muddy","of":"wax_vesta","attr":"condition","value":"so coated with mud it looked at first like a little chip of wood","time":{"at":"t.at_hollow"},"para":102,"quote":"so coated with mud that it looked at first like a little chip of wood"}
{"id":"f.watson_sees_vesta","of":"watson","attr":"observes","value":["f.holmes_finds_vesta","f.vesta_half_burned","f.vesta_muddy"],"time":{"at":"t.at_hollow"},"para":102,"quote":"it looked at first like a little chip of wood"}
{"id":"f.gregory_overlooked","of":"gregory","attr":"says","value":"he cannot think how he came to overlook it","to":"holmes","time":{"at":"t.at_hollow"},"para":103,"quote":"I cannot think how I came to overlook it"}
{"id":"f.gregory_missed_vesta","of":"gregory","attr":"observes","value":["f.vesta_in_mud"],"neg":true,"basis":"implied","time":{"at":"t.gregory_examines_ground"},"para":103,"quote":"I cannot think how I came to overlook it"}
{"id":"f.gregory_annoyed","of":"gregory","attr":"condition","value":"annoyed","time":{"at":"t.at_hollow"},"para":103,"quote":"with an expression of annoyance"}
{"id":"f.holmes_invisible","of":"holmes","attr":"says","value":"the vesta was invisible, buried in the mud; he saw it only because he was looking for it","to":"gregory","time":{"at":"t.at_hollow"},"para":104,"quote":"It was invisible, buried in the mud. I only saw it because I was looking for it."}
{"id":"f.vesta_buried","of":"wax_vesta","attr":"condition","value":"invisible, buried in the mud","word":"holmes","time":{"from":"t.vesta_dropped","to":"t.at_hollow"},"para":104,"quote":"It was invisible, buried in the mud."}
{"id":"f.holmes_looking","of":"holmes","attr":"intends","value":"to look for a burnt vesta in the hollow","time":{"at":"t.at_hollow"},"para":104,"quote":"I only saw it because I was looking for it."}
{"id":"f.gregory_asks_expected","of":"gregory","attr":"action","act":"ask","value":"asks whether Holmes expected to find it","to":"holmes","time":{"at":"t.at_hollow"},"para":105,"quote":"What! You expected to find it?"}
{"id":"f.holmes_not_unlikely","of":"holmes","attr":"believes","value":"it was not unlikely that a vesta would be found in the hollow","modal":"possible","time":{"at":"t.at_hollow"},"para":106,"quote":"I thought it not unlikely.","asserts":[{"of":"wax_vesta","attr":"location","value":"hollow","time":{"at":"t.at_hollow"}}]}
{"id":"f.holmes_compares","of":"holmes","attr":"action","value":"takes the boots from the bag and compares the impressions of each with marks on the ground","time":{"at":"t.at_hollow"},"para":107,"quote":"He took the boots from the bag, and compared the impressions of each of them with marks upon the ground."}
{"id":"f.holmes_rim","of":"holmes","attr":"location","value":"hollow","detail":"on the rim, among the ferns and bushes","time":{"at":"t.at_hollow"},"para":107,"quote":"he clambered up to the rim of the hollow"}
{"id":"f.holmes_crawls","of":"holmes","attr":"action","value":"clambers up to the rim of the hollow and crawls about among the ferns and bushes","time":{"at":"t.at_hollow"},"para":107,"quote":"crawled about among the ferns and bushes"}
{"id":"f.gregory_no_tracks","of":"gregory","attr":"says","value":"there are no more tracks; he examined the ground very carefully for a hundred yards in each direction","to":"holmes","time":{"at":"t.at_hollow"},"para":108,"quote":"I am afraid that there are no more tracks","asserts":[{"of":"hollow","attr":"condition","value":"no more tracks for a hundred yards in each direction","time":{"at":"t.gregory_examines_ground"}}]}
{"id":"f.gregory_examined_ground","of":"gregory","attr":"action","value":"examines the ground very carefully for a hundred yards in each direction","time":{"at":"t.gregory_examines_ground"},"para":108,"quote":"I have examined the ground very carefully for a hundred yards in each direction."}
{"id":"f.holmes_rises","of":"holmes","attr":"action","value":"rises","time":{"at":"t.at_hollow"},"para":109,"quote":"said Holmes, rising"}
{"id":"f.holmes_impertinence","of":"holmes","attr":"says","value":"he would not have the impertinence to search again after what the Inspector says","to":"gregory","time":{"at":"t.at_hollow"},"para":109,"quote":"I should not have the impertinence to do it again after what you say."}
{"id":"f.holmes_intends_walk","of":"holmes","attr":"intends","value":"to take a little walk over the moor before dark, to know his ground to-morrow","time":{"at":"t.at_hollow"},"para":109,"quote":"I should like to take a little walk over the moor before it grows dark, that I may know my ground to-morrow"}
{"id":"f.clock_before_dark","of":"clock","attr":"hour","value":"evening, before dark","time":{"at":"t.at_hollow"},"para":109,"quote":"before it grows dark"}
{"id":"f.holmes_horseshoe_luck","of":"holmes","attr":"says","value":"he will put the horseshoe into his pocket for luck","to":"gregory","time":{"at":"t.at_hollow"},"para":109,"quote":"I think that I shall put this horseshoe into my pocket for luck"}
{"id":"f.holmes_has_horseshoe","of":"holmes","attr":"carrying","value":"horseshoe","detail":"in his pocket","basis":"implied","time":{"from":"t.at_hollow"},"para":109,"quote":"I shall put this horseshoe into my pocket"}
{"id":"f.ross_impatient","of":"ross","attr":"condition","value":"showing some signs of impatience at Holmes's quiet and systematic method","time":{"at":"t.at_hollow"},"para":110,"quote":"who had shown some signs of impatience at my companion’s quiet and systematic method of work"}
{"id":"f.ross_glances_watch","of":"ross","attr":"action","value":"glances at his watch","time":{"at":"t.at_hollow"},"para":110,"quote":"glanced at his watch"}
{"id":"f.ross_has_watch","of":"ross","attr":"carrying","value":"ross_watch","basis":"implied","time":{"at":"t.at_hollow"},"para":110,"quote":"glanced at his watch"}
{"id":"f.ross_asks_inspector","of":"ross","attr":"says","value":"he wishes the Inspector would come back with him, for advice on several points, especially whether they owe it to the public to remove the horse's name from the entries for the Cup","to":"gregory","time":{"at":"t.at_hollow"},"para":110,"quote":"I wish you would come back with me, Inspector"}
{"id":"f.ross_considers_scratch","of":"ross","attr":"intends","value":"to seek the Inspector's advice on whether they owe it to the public to remove his horse's name from the entries for the Cup","time":{"at":"t.at_hollow"},"para":110,"quote":"whether we do not owe it to the public to remove our horse’s name from the entries for the Cup"}
{"id":"f.horse_entered","of":"cup_entries","attr":"contents","value":"silver_blaze","basis":"implied","time":{"at":"t.at_hollow"},"para":110,"quote":"to remove our horse’s name from the entries for the Cup"}
{"id":"f.holmes_let_stand","of":"holmes","attr":"says","value":"certainly not: he should let the name stand","to":"ross","time":{"at":"t.at_hollow"},"para":111,"quote":"“Certainly not,” cried Holmes, with decision. “I should let the name stand.”"}
{"id":"f.ross_bows","of":"ross","attr":"action","value":"bows","time":{"at":"t.at_hollow"},"para":112,"quote":"The Colonel bowed."}
{"id":"f.ross_glad_opinion","of":"ross","attr":"says","value":"he is very glad to have had Holmes's opinion","to":"holmes","time":{"at":"t.at_hollow"},"para":112,"quote":"I am very glad to have had your opinion, sir"}
{"id":"f.ross_find_us","of":"ross","attr":"says","value":"they will be at Straker's house when Holmes has finished his walk, and they can drive together into Tavistock","to":"holmes","time":{"at":"t.at_hollow"},"para":112,"quote":"You will find us at poor Straker’s house when you have finished your walk"}
{"id":"f.ross_intends_house","of":"ross","attr":"intends","value":"to go back to Straker's house with the Inspector","time":{"at":"t.at_hollow"},"para":112,"quote":"You will find us at poor Straker’s house"}
{"id":"f.ross_intends_drive","of":"ross","attr":"intends","value":"to drive together into Tavistock after Holmes's walk","time":{"at":"t.at_hollow"},"para":112,"quote":"we can drive together into Tavistock"}
{"id":"f.gregory_tells_hollow","of":"gregory","attr":"tells","value":"acct.gregory_hollow","to":"watson","how":"told","time":{"at":"t.at_hollow"},"para":95,"quote":"None; but very heavy rain."}

## The reader's notes on this scene (the annotated reading)

{"id":"t114.1","para":114,"tag":"GENRE","subtype":"watch-detective","confidence":"fair","profile":"typical","from":["t112.2"],"reads":"We may leave the question of who killed John Straker for the instant","text":"Holmes separates the two problems and works on the horse first. He thinks the horse's fate can be settled without knowing who the killer is, so he may believe they are less tightly linked than the police assume (t4.2)."}
{"id":"t114.2","para":114,"tag":"DEFAULT","confidence":"fair","profile":"typical","from":["bk.horse_herd","t37.1","t112.3"],"reads":"The horse is a very gregarious creature.","text":"A horse that broke loose in the hollow would make for horses: home to King's Pyland or over to Mapleton. It would not run wild, and on the open moor it would have been seen by now."}
{"id":"t114.3","para":114,"tag":"DROP","confidence":"fair","profile":"typical","from":["t62.2","t62.3","t37.2","t114.2"],"reads":"They could not hope to sell such a horse.","relations":[{"type":"drops","target":"t62.2"}],"text":"Drop the gypsy theory. They move off whenever there is trouble, they could not sell so famous a horse, and the reward makes theft pointless for them. Their leaving on Tuesday is explained without any guilt."}
{"id":"t114.4","para":114,"tag":"DROP","confidence":"fair","profile":"typical","from":["t114.2","t14.2","t111.2"],"reads":"Why should he run wild upon the moor? He would surely have been seen by now.","relations":[{"type":"drops","target":"t46.2"}],"text":"The 'bolted and wandering on the moor' branch of the police theory goes too. It already conflicted with t14.2."}
{"id":"t116.1","para":116,"tag":"WEIGH","confidence":"fair","profile":"careful","from":["t114.2","t66.2","t111.2"],"reads":"He is not at King’s Pyland. Therefore he is at Mapleton.","text":"The argument is only as good as its premise that the horse went off loose to one stable or the other. Holmes calls it a 'working hypothesis'. If the horse is at Mapleton, the police search there (t66.2) failed to recognise him, and that points back to the altered-appearance option of t14.3."}
{"id":"t116.2","para":116,"tag":"PHYSICAL","confidence":"fair","profile":"typical","from":["t108.1","bk.hoofprints"],"reads":"This part of the moor, as the Inspector remarked, is very hard and dry.","relations":[{"type":"supports","target":"t108.1"}],"text":"This answers t108.1. Near the hollow the ground is hard and takes no prints, so Gregory's empty hundred yards proves nothing. Prints should show again in the wet low ground towards Mapleton."}
{"id":"t117.1","para":117,"tag":"TEST","confidence":"strong","profile":"typical","from":["t116.1","t116.2","t109.2"],"reads":"the shoe which he took from his pocket exactly fitted the impression","relations":[{"type":"supports","target":"t116.1"},{"type":"supports","target":"t111.1"}],"text":"Silver Blaze's own shoe matches a fresh track in the wet hollow on the line to Mapleton. The horse left the scene alive, heading that way. The pocketed horseshoe of t109.2 was for exactly this."}
{"id":"t118.1","para":118,"tag":"GENRE","confidence":"weak","profile":"typical","from":["t39.1"],"reads":"It is the one quality which Gregory lacks.","text":"This repeats Holmes's verdict on Gregory (t39.1). The police searched by rule and missed what a guess about the horse's behaviour found. Their other negative results (stables, Mapleton) are also open to doubt."}
{"id":"t119.1","para":119,"tag":"RECORD","profile":"typical","from":["t117.1"],"reads":"A man’s track was visible beside the horse’s.","text":"Close to Mapleton a man's footprints join the horse's track."}
{"id":"t120.1","para":120,"tag":"INFER","confidence":"strong","profile":"typical","from":["t117.1","t119.1"],"reads":"The horse was alone before","relations":[{"type":"strains","target":"t46.2"}],"text":"The horse crossed the moor from the hollow on its own. Nobody led it away from the scene of the murder. A man met it only near Mapleton. Whoever was with Straker in the hollow did not take the horse, and that is a blow to the police picture of Simpson leading it off."}
{"id":"t120.2","para":120,"tag":"HYPOTHESIS","confidence":"fair","profile":"typical","from":["t119.1","t120.1","t40.3","t66.1"],"text":"Who is the man who caught the horse near Mapleton?","options":["Someone from Mapleton, perhaps Silas Brown","Straker's killer, who followed the horse","Simpson"]}
{"id":"t122.1","para":122,"tag":"HYPOTHESIS","confidence":"weak","profile":"typical","from":["t120.2"],"reads":"The double track turned sharp off and took the direction of King’s Pyland.","text":"The man first led the horse towards King's Pyland. That looks like an honest finder taking a stray back to its stable.","options":["An honest finder returning the horse","A man who set out to return it and then changed his mind"]}
{"id":"t122.2","para":122,"tag":"AGENT","confidence":"fair","profile":"careful","from":["t122.1","bk.favourite_motive","t66.1"],"reads":"saw to my surprise the same tracks coming back again in the opposite direction","relations":[{"type":"strains","target":"t122.1"}],"text":"He turned back with the horse. A man who sets out to return a stray and then reverses has changed his mind, most likely because he saw what he could gain by keeping the favourite out of the race."}
{"id":"t124.1","para":124,"tag":"INFER","confidence":"strong","profile":"typical","from":["t122.2","t116.1"],"reads":"It ended at the paving of asphalt which led up to the gates of the Mapleton stables.","relations":[{"type":"drops","target":"t122.1"},{"type":"supports","target":"t40.3"}],"text":"The track goes in at Mapleton's gates. The horse was taken into the rival stable and kept, not returned. Drop the 'honest finder' reading."}
{"id":"t124.2","para":124,"tag":"REVISE","confidence":"fair","profile":"careful","from":["t124.1","t66.2","t64.1","t14.3","bk.search_by_description"],"relations":[{"type":"revises","target":"t66.2"}],"text":"The police 'examined' Mapleton and found nothing, yet the horse went in there. Either it was hidden from the searchers or it stood among the other horses unrecognised. The disguise option of t14.3 now looks strong.","hindsight":"A first-time reader must hold onto the doubt about searching by description from t64.1 and t66.2, and not assume the horse was moved out again after the police visit."}
{"id":"t126.1","para":126,"tag":"GENRE","subtype":"watch-detective","confidence":"weak","profile":"careful","from":["t124.1","bk.genre_detective_signals"],"reads":"if I were to call at five o’clock to-morrow morning","text":"Holmes asks a pointed question about who is up at dawn. A stray that reached Mapleton early on Tuesday would be met by whoever was stirring first."}
{"id":"t127.1","para":127,"tag":"INFER","confidence":"fair","profile":"careful","from":["t126.1","t119.1","t120.2"],"reads":"he is always the first stirring","relations":[{"type":"supports","target":"t120.2"}],"text":"Silas Brown is always the first one up. So he is the likeliest man to have met the loose horse at dawn and led it about. He fits the man's track in t119.1."}
{"id":"t131.1","para":131,"tag":"SET ASIDE","profile":"typical","from":[],"reads":"Be off, or you may find a dog at your heels.","text":"Brown's bluster and his threat of a dog are manner. They also show how Mapleton keeps strangers away."}
{"id":"t132.1","para":132,"tag":"WEIGH","confidence":"fair","profile":"typical","from":["t127.1","t124.1"],"reads":"He started violently and flushed to the temples.","text":"Holmes whispered a specific charge, most likely an account of the tracks and of Brown taking the horse in. Brown's violent start and his denial ('a lie') show it hit home. His agreeing to talk in private gives more away than the denial does."}
{"id":"t137.1","para":137,"tag":"INFER","confidence":"strong","profile":"typical","from":["t132.1"],"reads":"he cringed along at my companion’s side like a dog with its master","text":"After twenty minutes Brown is broken and obedient. Holmes's charge was true, and Brown has the horse, or knows where it is, and has given in."}
{"id":"t140.1","para":140,"tag":"INFER","confidence":"fair","profile":"typical","from":["t137.1","t111.1","t18.2"],"reads":"It shall be there.","relations":[{"type":"supports","target":"t111.1"}],"text":"'It' is very probably Silver Blaze, and 'there' probably the racecourse on Tuesday. This explains why Holmes told Ross to let the name stand: he expected the horse to be alive and available."}
{"id":"t140.2","para":140,"tag":"INFER","confidence":"fair","profile":"careful","from":["t140.1","t124.2","t14.3"],"reads":"Should I change it first or not?","relations":[{"type":"supports","target":"t124.2"}],"text":"Brown asks whether to 'change' the horse first. That suggests its appearance has been altered, or can be put back, which is how it stood in the yard unrecognised by the police search.","options":["Restore the horse's original appearance","Alter it in some way before handing it over"]}
{"id":"t141.1","para":141,"tag":"GENRE","subtype":"watch-detective","confidence":"fair","profile":"careful","from":["t140.2","t110.1","t112.1"],"reads":"I shall write to you about it.","text":"Holmes laughs at the question and tells Brown not to change it yet. He is not recovering the horse openly or telling the police. It looks as if he means to stage its return in his own way, perhaps with the slighted Colonel Ross in mind."}
{"id":"t143.1","para":143,"tag":"AGENT","confidence":"weak","profile":"careful","from":["t141.1","t137.1"],"reads":"disregarding the trembling hand which the other held out to him","text":"Holmes refuses Brown's hand. He holds him in contempt and keeps him under threat ('No tricks'). He is not treating him as Straker's murderer, which fits t120.1: Brown only took in a horse that came to him alone."}
{"id":"t143.2","para":143,"tag":"RESIDUE","confidence":"fair","profile":"careful","from":["t120.1","t114.1","t112.2","t92.2","t82.3","t60.2","t34.2","t33.2","t70.2","t6.1"],"text":"Open at the end of the scene: the horse seems settled, alive at Mapleton and perhaps altered. The murder is untouched. Who struck Straker in the hollow, since the horse left alone and nobody led it? The rest is carried over: whether Straker was working against the horse (knife, candle, match, laid coat), whether Derbyshire is Straker, how the cravat got into his hand, who drugged the curry and how a passer-by could rely on it, the dog's silence, the opened door, the clue Holmes had in the carriage, and the field-glass."}
{"id":"t143.3","para":143,"tag":"HYPOTHESIS","subtype":"scenario","confidence":"weak","profile":"careful","from":["t112.3","t120.1","t124.1","t127.1","t140.2","t114.3"],"relations":[{"type":"supports","target":"t46.4"},{"type":"strains","target":"t46.2"}],"text":"Standing pictures. The horse: it got loose from the hollow, wandered towards Mapleton, and Silas Brown took it in at dawn, nearly returned it, then kept and probably disguised it. Brown is a profiteer, not the killer. The gypsies are out. The murder: picture (c) still leads, with Straker leading the horse out to do it some delicate harm and being struck down. The police's Simpson theory has lost the 'led the horse away' step. The killer is unknown in every picture.","options":["Straker's own scheme, with an unknown killer","Simpson killed Straker but never had the horse","Someone not yet named"]}

## The story so far (this scene is ¶113–¶143)

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

¶93 “Ah, that quite settles it,” said Holmes. And with an apology he followed the Inspector outside. A short walk across the moor took us to the hollow in which the body had been found. At the brink of it was the furze-bush upon which the coat had been hung.

¶94 “There was no wind that night, I understand,” said Holmes.

¶95 “None; but very heavy rain.”

¶96 “In that case the overcoat was not blown against the furze-bush, but placed there.”

¶97 “Yes, it was laid across the bush.”

¶98 “You fill me with interest, I perceive that the ground has been trampled up a good deal. No doubt many feet have been here since Monday night.”

¶99 “A piece of matting has been laid here at the side, and we have all stood upon that.”

¶100 “Excellent.”

¶101 “In this bag I have one of the boots which Straker wore, one of Fitzroy Simpson’s shoes, and a cast horseshoe of Silver Blaze.”

¶102 “My dear Inspector, you surpass yourself!” Holmes took the bag, and, descending into the hollow, he pushed the matting into a more central position. Then stretching himself upon his face and leaning his chin upon his hands, he made a careful study of the trampled mud in front of him. “Hullo!” said he, suddenly. “What’s this?” It was a wax vesta half burned, which was so coated with mud that it looked at first like a little chip of wood.

¶103 “I cannot think how I came to overlook it,” said the Inspector, with an expression of annoyance.

¶104 “It was invisible, buried in the mud. I only saw it because I was looking for it.”

¶105 “What! You expected to find it?”

¶106 “I thought it not unlikely.”

¶107 He took the boots from the bag, and compared the impressions of each of them with marks upon the ground. Then he clambered up to the rim of the hollow, and crawled about among the ferns and bushes.

¶108 “I am afraid that there are no more tracks,” said the Inspector. “I have examined the ground very carefully for a hundred yards in each direction.”

¶109 “Indeed!” said Holmes, rising. “I should not have the impertinence to do it again after what you say. But I should like to take a little walk over the moor before it grows dark, that I may know my ground to-morrow, and I think that I shall put this horseshoe into my pocket for luck.”

¶110 Colonel Ross, who had shown some signs of impatience at my companion’s quiet and systematic method of work, glanced at his watch. “I wish you would come back with me, Inspector,” said he. “There are several points on which I should like your advice, and especially as to whether we do not owe it to the public to remove our horse’s name from the entries for the Cup.”

¶111 “Certainly not,” cried Holmes, with decision. “I should let the name stand.”

¶112 The Colonel bowed. “I am very glad to have had your opinion, sir,” said he. “You will find us at poor Straker’s house when you have finished your walk, and we can drive together into Tavistock.”

¶113 He turned back with the Inspector, while Holmes and I walked slowly across the moor. The sun was beginning to sink behind the stables of Mapleton, and the long, sloping plain in front of us was tinged with gold, deepening into rich, ruddy browns where the faded ferns and brambles caught the evening light. But the glories of the landscape were all wasted upon my companion, who was sunk in the deepest thought.

¶114 “It’s this way, Watson,” said he at last. “We may leave the question of who killed John Straker for the instant, and confine ourselves to finding out what has become of the horse. Now, supposing that he broke away during or after the tragedy, where could he have gone to? The horse is a very gregarious creature. If left to himself his instincts would have been either to return to King’s Pyland or go over to Mapleton. Why should he run wild upon the moor? He would surely have been seen by now. And why should gypsies kidnap him? These people always clear out when they hear of trouble, for they do not wish to be pestered by the police. They could not hope to sell such a horse. They would run a great risk and gain nothing by taking him. Surely that is clear.”

¶115 “Where is he, then?”

¶116 “I have already said that he must have gone to King’s Pyland or to Mapleton. He is not at King’s Pyland. Therefore he is at Mapleton. Let us take that as a working hypothesis and see what it leads us to. This part of the moor, as the Inspector remarked, is very hard and dry. But it falls away towards Mapleton, and you can see from here that there is a long hollow over yonder, which must have been very wet on Monday night. If our supposition is correct, then the horse must have crossed that, and there is the point where we should look for his tracks.”

¶117 We had been walking briskly during this conversation, and a few more minutes brought us to the hollow in question. At Holmes’ request I walked down the bank to the right, and he to the left, but I had not taken fifty paces before I heard him give a shout, and saw him waving his hand to me. The track of a horse was plainly outlined in the soft earth in front of him, and the shoe which he took from his pocket exactly fitted the impression.

¶118 “See the value of imagination,” said Holmes. “It is the one quality which Gregory lacks. We imagined what might have happened, acted upon the supposition, and find ourselves justified. Let us proceed.”

¶119 We crossed the marshy bottom and passed over a quarter of a mile of dry, hard turf. Again the ground sloped, and again we came on the tracks. Then we lost them for half a mile, but only to pick them up once more quite close to Mapleton. It was Holmes who saw them first, and he stood pointing with a look of triumph upon his face. A man’s track was visible beside the horse’s.

¶120 “The horse was alone before,” I cried.

¶121 “Quite so. It was alone before. Hullo, what is this?”

¶122 The double track turned sharp off and took the direction of King’s Pyland. Holmes whistled, and we both followed along after it. His eyes were on the trail, but I happened to look a little to one side, and saw to my surprise the same tracks coming back again in the opposite direction.

¶123 “One for you, Watson,” said Holmes, when I pointed it out. “You have saved us a long walk, which would have brought us back on our own traces. Let us follow the return track.”

¶124 We had not to go far. It ended at the paving of asphalt which led up to the gates of the Mapleton stables. As we approached, a groom ran out from them.

¶125 “We don’t want any loiterers about here,” said he.

¶126 “I only wished to ask a question,” said Holmes, with his finger and thumb in his waistcoat pocket. “Should I be too early to see your master, Mr. Silas Brown, if I were to call at five o’clock to-morrow morning?”

¶127 “Bless you, sir, if any one is about he will be, for he is always the first stirring. But here he is, sir, to answer your questions for himself. No, sir, no; it is as much as my place is worth to let him see me touch your money. Afterwards, if you like.”

¶128 As Sherlock Holmes replaced the half-crown which he had drawn from his pocket, a fierce-looking elderly man strode out from the gate with a hunting-crop swinging in his hand.

¶129 “What’s this, Dawson!” he cried. “No gossiping! Go about your business! And you, what the devil do you want here?”

¶130 “Ten minutes’ talk with you, my good sir,” said Holmes in the sweetest of voices.

¶131 “I’ve no time to talk to every gadabout. We want no strangers here. Be off, or you may find a dog at your heels.”

¶132 Holmes leaned forward and whispered something in the trainer’s ear. He started violently and flushed to the temples.

¶133 “It’s a lie!” he shouted, “an infernal lie!”

¶134 “Very good. Shall we argue about it here in public or talk it over in your parlour?”

¶135 “Oh, come in if you wish to.”

¶136 Holmes smiled. “I shall not keep you more than a few minutes, Watson,” said he. “Now, Mr. Brown, I am quite at your disposal.”

¶137 It was twenty minutes, and the reds had all faded into greys before Holmes and the trainer reappeared. Never have I seen such a change as had been brought about in Silas Brown in that short time. His face was ashy pale, beads of perspiration shone upon his brow, and his hands shook until the hunting-crop wagged like a branch in the wind. His bullying, overbearing manner was all gone too, and he cringed along at my companion’s side like a dog with its master.

¶138 “Your instructions will be done. It shall all be done,” said he.

¶139 “There must be no mistake,” said Holmes, looking round at him. The other winced as he read the menace in his eyes.

¶140 “Oh no, there shall be no mistake. It shall be there. Should I change it first or not?”

¶141 Holmes thought a little and then burst out laughing. “No, don’t,” said he; “I shall write to you about it. No tricks, now, or—”

¶142 “Oh, you can trust me, you can trust me!”

¶143 “Yes, I think I can. Well, you shall hear from me to-morrow.” He turned upon his heel, disregarding the trembling hand which the other held out to him, and we set off for King’s Pyland.


