// Belief over statements (workstream 4, docs/testimony-belief.md): a statement's speaker believes it or not; a doubt
// says how (mistaken: believed and false; lying: not believed); what the story tells for certain (`said`) holds
// whatever the player makes of the content.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, MEDIUM, TRIVIAL } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);
const paraOf = (q) => model.story.find(q).para;

test('Hunter was certain: mistaken fits, lying clashes with what the story tells', () => {
    const game = new Game(model, { difficulty: MEDIUM });
    while (game.read <= paraOf('He was equally certain that')) game.advance();
    const id = 'c.hunter_blames_stranger';
    assert.ok(game.knows(id));
    assert.deepEqual(game.doubtKinds(id), ['mistaken', 'lying']);
    assert.equal(game.doubtKinds('c.knife_delicate').length, 0, 'an observation has no speaker\'s belief to doubt');
    const b = model.claimForms.get(id).belief;
    assert.equal(b, 'st.ned_hunter.believes_hunter_blames_stranger.thu_journey');
    assert.ok(game.checkConclusion({ eq: [b, 'true'] }).ok, 'the story says he was certain');
    assert.ok(game.suspect(id, 'mistaken'));
    assert.ok(game.checkConclusion({ eq: [`${id}.truth`, 'false'] }).ok, 'mistaken: what he said is false');
    assert.ok(!game.clashes().some((c) => c.ids.includes(`k.${id}#mistaken`)), 'mistaken clashes with nothing');
    game.suspect(id, 'lying');
    assert.ok(game.clashes().some((c) => c.ids.includes(`k.${id}#lying`)), 'lying: against "he was certain"');
    game.unsuspect(id);
    assert.equal(game.doubtKind.has(id), false);
});

test('a statement the case says nothing about: its belief is latent, and a doubt can say it was a lie', () => {
    const game = new Game(model, { difficulty: MEDIUM });
    const id = 'c.simpson_lost_cravat';
    while (!game.knows(id)) game.advance();
    const b = model.claimForms.get(id).belief;
    assert.ok(b && model.slots.get(b).latent, b);
    assert.equal(game.checkConclusion({ eq: [b, 'false'] }).ok, false);
    game.suspect(id, 'lying');
    assert.ok(game.checkConclusion({ eq: [b, 'false'] }).ok);
    const again = new Game(model);
    again.load(game.save());
    assert.equal(again.doubtKind.get(id), 'lying', 'saved and restored');
    assert.equal(game.suspect(id, 'wrong'), false);
});

test('Brown lied, Mrs. Straker and the Colonel believed what they said: the answer key', () => {
    const solved = new Game(model, { difficulty: TRIVIAL, autoPace: 'logic' });
    while (!solved.finished()) solved.advance();
    assert.equal(solved.settled('st.silas_brown.believes_brown_denies.thu_dusk'), 'false');
    assert.equal(solved.settled('st.mrs_straker.believes_derbyshire_a_friend.thu_evening'), 'true');
    assert.equal(solved.settled('st.colonel_ross.believes_ross_not_my_horse.race_day'), 'true');
    const game = new Game(model, { difficulty: MEDIUM, options: { background: 'relevant' } });
    while (!game.knows('k.brown_broke')) { game.advance(); if (game.finished()) break; }
    if (!game.knows('k.brown_broke')) assert.deepEqual(game.propose(game.connectSet('k.brown_broke')).built, ['k.brown_broke']);
    assert.deepEqual(game.propose(game.connectSet('k.brown_lied')).built, ['k.brown_lied']);
});
