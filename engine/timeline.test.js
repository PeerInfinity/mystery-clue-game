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
