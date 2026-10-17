// The timeline (world model, step 3): what the player's clues place, their pencil marks, and splits, in both layouts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, MEDIUM } from './game.js';
import { UNKNOWN } from './timeline.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);
const paraOf = (q) => model.story.find(q).para;

test('the timeline shows what held clues place, by thing and by place, and only times the story has reached', () => {
    const game = new Game(model, { difficulty: MEDIUM });
    while (game.read <= paraOf('found that he was dressing') - 1) game.advance();
    assert.ok(!game.timelineTimes().some((t) => t.id === 'w.tue_0700'), 'seven o\'clock is not reached yet');
    while (game.read <= paraOf('Mrs. Straker awoke at seven')) game.advance();
    const things = game.followedThings();
    for (const t of ['straker', 'mrs_straker']) assert.ok(things.includes(t), `${t} is placed by a held clue`);
    assert.ok(!things.includes('silver_blaze'), 'nobody is followed that no clue places');
    const bt = game.timeline('thing');
    const wife = bt.rows.find((r) => r.thing === 'mrs_straker');
    assert.equal(wife.cells.find((c) => c.time === 'w.tue_0100').at, 'straker_villa');
    const bp = game.timeline('place');
    const one = bp.rows.find((r) => r.time.id === 'w.tue_0100');
    const villa = one.cells.get('straker_villa');
    assert.deepEqual(villa.things.filter((x) => x.given).map((x) => x.thing).sort(), ['mrs_straker', 'straker']);
    assert.ok(villa.events.includes('e.straker_dresses'), 'the bedroom folds into the villa');
    // Seven o'clock: she is not placed there (the part before her waking is not on the board yet).
    const seven = bp.rows.find((r) => r.time.id === 'w.tue_0700');
    assert.ok(seven.cells.get(UNKNOWN).things.some((x) => x.thing === 'mrs_straker'));
});

test('pencil marks, splits and events moved into a part; the board is saved', () => {
    const game = new Game(model, { difficulty: MEDIUM });
    while (game.read <= paraOf('the favourite’s stall was empty') + 1) game.advance();
    // A pencil mark is free: two of them are two hypotheses; a struck one stays, crossed out.
    assert.ok(game.pencilPlace('silver_blaze', 'w.tue_0100', 'stable'));
    assert.ok(game.pencilPlace('silver_blaze', 'w.tue_0100', 'elsewhere'));
    assert.ok(game.pencilPlace('silver_blaze', 'w.tue_0100', 'elsewhere', { struck: true }));
    assert.ok(!game.pencilPlace('silver_blaze', 'w.race_day', 'stable'), 'not a time the story has reached');
    assert.ok(game.followedThings().includes('silver_blaze'), 'pencilling a thing follows it');
    const row = game.timeline('place').rows.find((r) => r.time.id === 'w.tue_0100');
    assert.ok(row.cells.get('stable').things.some((x) => x.thing === 'silver_blaze' && x.pencil && !x.struck));
    assert.ok(row.cells.get('elsewhere').things.some((x) => x.thing === 'silver_blaze' && x.struck));
    // Split seven o'clock at Mrs. Straker's waking: two parts and the event between; what she was before it shows.
    const parts = game.splitTime('w.tue_0700', 'e.wife_wakes');
    assert.deepEqual(parts, ['w.tue_0700.before.wife_wakes', 'w.tue_0700.after.wife_wakes']);
    const ts = game.timelineTimes().map((t) => t.id);
    assert.deepEqual(ts.slice(ts.indexOf('w.tue_0700'), ts.indexOf('w.tue_0700') + 4), ['w.tue_0700', 'w.tue_0700.before.wife_wakes', 'w.tue_0700@wife_wakes', 'w.tue_0700.after.wife_wakes']);
    const wife = game.timeline('thing').rows.find((r) => r.thing === 'mrs_straker');
    assert.equal(wife.cells.find((c) => c.time === 'w.tue_0700.before.wife_wakes').at, 'straker_villa');
    assert.equal(wife.cells.find((c) => c.time === 'w.tue_0700').at, null, 'she moved within seven o\'clock');
    // The finding of the stable stays in seven o'clock until moved into a part.
    const at = (t) => game.timeline('place').rows.find((r) => r.time.id === t);
    const has = (t, e) => [...at(t).cells.values()].some((c) => c.events.includes(e));
    assert.ok(has('w.tue_0700', 'e.stable_found_open') && has('w.tue_0700@wife_wakes', 'e.wife_wakes'));
    assert.ok(game.placeEvent('e.stable_found_open', 'w.tue_0700.after.wife_wakes'));
    assert.ok(has('w.tue_0700.after.wife_wakes', 'e.stable_found_open') && !has('w.tue_0700', 'e.stable_found_open'));
    // Saved and restored.
    const copy = new Game(model, { difficulty: MEDIUM, state: JSON.parse(JSON.stringify(game.save())) });
    assert.deepEqual(copy.board, game.board);
    // Undoing the split takes its parts and what was placed in them.
    game.unsplitTime('w.tue_0700');
    assert.ok(has('w.tue_0700', 'e.stable_found_open'));
    assert.equal(game.board.placed.length, 0);
});

test('layers: a theory\'s night on the board, and whether a layer fits what the player holds', () => {
    const game = new Game(model, { difficulty: MEDIUM });
    while (game.read <= paraOf('The police imagine, I\n      take it')) game.advance();
    const police = game.layers().find((l) => l.id === 't.police');
    assert.ok(police && police.story, 'the police theory is a layer once it is told');
    // The police's answers put Simpson at the stable (its window) while the supper was drugged.
    const row = game.timeline('place', 't.police').rows.find((r) => r.time.id === 'w.mon_2110');
    assert.ok(row.cells.get('stable').things.some((x) => x.thing === 'simpson' && x.theory), 'a theory mark');
    assert.ok(!game.timeline('place').rows.find((r) => r.time.id === 'w.mon_2110').cells.get('stable').things.some((x) => x.thing === 'simpson'), 'not on the player\'s own board');
    // A pencil mark against a held clue does not fit; one the case has no question for is not judged.
    assert.equal(game.checkLayer().fits, true);
    assert.ok(game.pencilPlace('mrs_straker', 'w.tue_0100', 'elsewhere'));
    assert.ok(game.pencilPlace('simpson', 'w.tue_0100', 'stable'));
    const res = game.checkLayer();
    assert.equal(res.fits, false);
    assert.ok(res.conflict.includes('k.c.straker_dressing_at_one'), JSON.stringify(res.conflict));
    assert.equal(res.checked, 1);
    assert.equal(res.unchecked, 1);
    // A second guess in the same cell: one of them may hold, so the layer fits again.
    assert.ok(game.pencilPlace('mrs_straker', 'w.tue_0100', 'straker_villa'));
    assert.equal(game.checkLayer().fits, true);
    // Marks belong to their layer.
    assert.ok(game.pencilPlace('simpson', 'w.tue_0100', 'moor', { layer: 't.police' }) === false || game.knows('moor'));
    assert.equal(game.checkLayer('t.police').checked + game.checkLayer('t.police').unchecked, game.board.pencil.filter((p) => p.layer === 't.police').length);
});

test("a card's own timeline: a thing's places and events, a place's visitors, an event's time; edits show on it", () => {
    const game = new Game(model, { difficulty: MEDIUM });
    while (game.read <= paraOf('Mrs. Straker awoke at seven') + 3) game.advance();
    const straker = game.cardTimeline('straker');
    assert.equal(straker.kind, 'thing');
    const one = straker.lines.find((l) => l.time === 'w.tue_0100');
    assert.equal(one.at, 'straker_villa');
    assert.ok(one.events.some((e) => e.event === 'e.straker_dresses'));
    assert.ok(straker.lines.every((l) => game.timelineTimes().some((t) => t.id === l.time)), 'only times reached');
    // A pencil mark made on the board shows on the card, and the stable's card shows whoever is in its loft.
    assert.ok(!game.cardTimeline('silver_blaze').lines.some((l) => l.time === 'w.tue_0100'));
    game.pencilPlace('silver_blaze', 'w.tue_0100', 'stable');
    assert.deepEqual(game.cardTimeline('silver_blaze').lines.find((l) => l.time === 'w.tue_0100').pencil, [{ value: 'stable', struck: false, status: null }]);
    const stable = game.cardTimeline('stable').lines.find((l) => l.time === 'w.tue_0100');
    assert.ok(stable.things.some((x) => x.thing === 'other_lads' && x.given && x.value === 'loft'), 'the loft lies within the stable');
    assert.ok(stable.things.some((x) => x.thing === 'silver_blaze' && x.pencil));
    const ev = game.cardTimeline('e.straker_dresses');
    assert.equal(ev.kind, 'event');
    assert.equal(ev.lines[0].time, 'w.tue_0100');
    assert.equal(game.cardTimeline('c.hunter_stupor').kind, null, 'a clue has no timeline of its own');
});

test('checked placements: a mark proven becomes a card; ruling one out is checked in Medium, free in Easy; holder and condition marks', () => {
    const game = new Game(model, { difficulty: MEDIUM });
    while (game.read <= paraOf('Mrs. Straker awoke at seven') + 3) game.advance();
    // Proving where he was: the proof is a card the player holds.
    const res = game.proveMark('straker', 'w.tue_0100', 'straker_villa');
    assert.ok(res.ok && res.card);
    assert.ok(game.knows(res.card));
    assert.match(model.cards.get(res.card).text, /^John Straker was at Straker.s villa \(Tuesday, 1 a\.m\.\)$/);
    assert.equal(game.cardTimeline('straker').lines.find((l) => l.time === 'w.tue_0100').pencil[0].status, 'proven');
    assert.equal(game.proveMark('straker', 'w.tue_0100', 'straker_villa').card, res.card, 'proving it again makes no second card');
    // Not yet provable in Medium: where Mrs. Straker was while the horse was taken needs an inference not held.
    assert.equal(game.proveMark('mrs_straker', 'w.tue_stable', 'straker_villa').ok, false);
    assert.equal(game.proveMark('silver_blaze', 'w.tue_0100', 'stable').ok, false, 'no question asks where the horse was at one');
    // Ruling out is checked in Medium: the lads heard nothing all night, so they were not at the stable door.
    game.pencilPlace('other_lads', 'w.tue_stable', 'stable');
    assert.ok(game.ruleOutMark('other_lads', 'w.tue_stable', 'stable').proof);
    const mark = () => game.cardTimeline('other_lads').lines.find((l) => l.time === 'w.tue_stable').pencil[0];
    assert.deepEqual([mark().struck, mark().status], [true, 'ruled']);
    game.pencilPlace('other_lads', 'w.tue_stable', 'stable', { struck: false });
    assert.deepEqual([mark().struck, mark().status], [false, null], 'restoring a mark takes the ruling back');
    assert.equal(game.ruleOutMark('other_lads', 'w.tue_stable', 'loft').ok, false, 'they were in the loft: that cannot be ruled out');
    // Holder and condition marks: kept apart from places, saved, and checked as a layer.
    assert.ok(game.pencilPlace('ned_hunter', 'w.tue_0700', 'false', { aspect: 'stupefied' }));
    assert.ok(game.pencilPlace('overcoat', 'w.tue_0100', 'straker', { aspect: 'held' }) || !game.knows('overcoat'));
    assert.ok(!game.pencilPlace('ned_hunter', 'w.tue_0700', 'stable', { aspect: 'stupefied' }), 'a condition is yes or no');
    const hunter = game.cardTimeline('ned_hunter').lines.find((l) => l.time === 'w.tue_0700');
    assert.deepEqual(hunter.conditions.find((c) => c.id === 'stupefied').pencil.map((m) => m.value), ['false']);
    assert.ok(!hunter.pencil.length, 'a condition mark is no place');
    assert.equal(game.checkLayer().fits, false, 'he was stupefied: the clue says so');
    const copy = new Game(model, { difficulty: MEDIUM, state: JSON.parse(JSON.stringify(game.save())) });
    assert.deepEqual(copy.board, game.board);
    assert.ok(copy.knows(copy.concluded[0].id), 'the proven placement card is restored');
    // Easy: crossing out is free (no proof).
    const easy = new Game(model, { difficulty: 'easy' });
    while (easy.read <= paraOf('Mrs. Straker awoke at seven') + 3) easy.advance();
    easy.pencilPlace('other_lads', 'w.tue_stable', 'loft');
    assert.deepEqual(easy.ruleOutMark('other_lads', 'w.tue_stable', 'loft'), { ok: true, proof: false });
});

test('a cell the case never declared opens when a mark there is committed; one with no single answer is refused; reset closes it', () => {
    const game = new Game(model, { difficulty: MEDIUM });
    while (game.read < 46) game.advance();
    assert.ok(!model.slots.has('st.ned_hunter.at.mon_2110'));
    // Hunter at the stable while the stranger was at the window: he locked the door behind him.
    game.pencilPlace('ned_hunter', 'w.mon_2110', 'stable');
    const res = game.proveMark('ned_hunter', 'w.mon_2110', 'stable');
    assert.ok(res.ok && res.card, JSON.stringify(res));
    assert.ok(model.slots.get('st.ned_hunter.at.mon_2110')?.opened, 'opened, with no answer of its own');
    assert.equal(game.cardTimeline('ned_hunter').lines.find((l) => l.time === 'w.mon_2110').at, 'stable', 'shown as given once proven');
    game.pencilPlace('ned_hunter', 'w.mon_2110', 'straker_villa');
    assert.ok(game.ruleOutMark('ned_hunter', 'w.mon_2110', 'straker_villa').proof, 'the proven card rules the villa out');
    // Edith runs to the window and flees to the house within that time: no single place throughout it.
    game.pencilPlace('edith_baxter', 'w.mon_2110', 'stable');
    const edith = game.proveMark('edith_baxter', 'w.mon_2110', 'stable');
    assert.equal(edith.ok, false);
    assert.match(edith.reason, /no single place throughout this time/);
    assert.ok(!model.slots.has('st.edith_baxter.at.mon_2110'), 'the state opened for it is closed again');
    // Saved and restored with the card that speaks of it; a reset closes it.
    const copy = new Game(model, { difficulty: MEDIUM, state: JSON.parse(JSON.stringify(game.save())) });
    assert.deepEqual(copy.openedStates, ['st.ned_hunter.at.mon_2110']);
    assert.ok(copy.concluded.length === 1 && copy.knows(copy.concluded[0].id));
    copy.reset();
    assert.ok(model.slots.has('st.ned_hunter.at.mon_2110'), 'still held by the first game');
    game.reset();
    assert.ok(!model.slots.has('st.ned_hunter.at.mon_2110'));
    assert.ok(!model.stateTracks.has('at|edith_baxter'));
});
