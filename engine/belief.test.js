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

test('splitting a statement: what she saw and what she was told, trusted or doubted apart', () => {
    const game = new Game(model, { difficulty: MEDIUM });
    const id = 'c.derbyshire_a_friend';
    while (!game.knows(id)) game.advance();
    assert.ok(!game.knows('c.derbyshire_friend_said'), 'the parts are not dealt by reading');
    assert.equal(game.splitClaim('c.stall_empty').ok, false, 'a clue with no parts does not come apart');
    const whole = { ne: ['william_derbyshire.identity', 'straker'] };
    assert.ok(game.checkConclusion(whole).ok, 'held whole, it says Derbyshire is not Straker');
    assert.deepEqual(game.splitClaim(id).parts, ['c.derbyshire_letters_came', 'c.derbyshire_friend_said']);
    assert.ok(game.checkConclusion(whole).ok, 'its "friend" part still says so, while trusted');
    assert.ok(game.suspect('c.derbyshire_friend_said', 'mistaken:mrs_straker'));
    assert.equal(game.checkConclusion(whole).ok, false, 'doubted, the part no longer counts, and the whole counts nowhere');
    assert.ok(game.knows(id) && !game.suspected.has(id), 'the statement stays in the hand, not doubted');
    const again = new Game(model);
    again.load(game.save());
    assert.ok(again.splitClaims.has(id) && again.knows('c.derbyshire_letters_came'));
    assert.equal(again.doubtKind.get('c.derbyshire_friend_said'), 'mistaken:mrs_straker');
    assert.equal(again.checkConclusion(whole).ok, false);
});

test('a reporting chain: Straker lied to his wife, and she passed it on in good faith', () => {
    const game = new Game(model, { difficulty: MEDIUM });
    const id = 'c.straker_said_anxious';
    while (!game.knows(id)) game.advance();
    assert.deepEqual(game.chainOf(id), [{ by: 'straker', to: 'mrs_straker' }, { by: 'mrs_straker', to: null }]);
    assert.deepEqual(game.doubtKinds(id).sort(), ['lying:mrs_straker', 'lying:straker', 'mistaken:mrs_straker', 'mistaken:straker']);
    const { straker, mrs_straker } = model.claimForms.get(id).beliefs;
    assert.equal(straker, 'st.straker.believes_straker_said_anxious.tue_0100');
    assert.ok(game.suspect(id, 'lying:straker'));
    assert.ok(game.checkConclusion({ eq: [straker, 'false'] }).ok, 'the lie sits on his link');
    assert.equal(game.checkConclusion({ eq: [mrs_straker, 'false'] }).ok, false, 'hers is not touched');
    assert.equal(game.suspect(id, 'lying'), false, 'along a chain a doubt names whose belief failed');
    assert.equal(game.chainOf('c.straker_defended_himself').map((l) => l.by).join(' → '), 'police → newspapers → holmes');
    // The answer key: he lied about his errand and about Derbyshire; she believed him.
    const solved = new Game(model, { difficulty: TRIVIAL, autoPace: 'logic' });
    while (!solved.finished()) solved.advance();
    assert.equal(solved.settled(straker), 'false');
    assert.equal(solved.settled(mrs_straker), 'true');
    assert.equal(solved.settled('st.straker.believes_derbyshire_friend_said.weeks_before'), 'false');
});

test('a doubt may say why: recorded, saved, and cleared with the doubt', () => {
    const game = new Game(model, { difficulty: MEDIUM });
    const id = 'c.hunter_blames_stranger';
    while (!game.knows(id)) game.advance();
    assert.equal(game.setDoubtReason(id, 'could-not-see'), false, 'only for a clue the player doubts');
    game.suspect(id, 'mistaken');
    assert.ok(game.setDoubtReason(id, 'could-not-see'));
    assert.equal(game.setDoubtReason(id, 'because'), false);
    const again = new Game(model);
    again.load(game.save());
    assert.equal(again.doubtReason.get(id), 'could-not-see');
    again.unsuspect(id);
    assert.equal(again.doubtReason.has(id), false);
});

test("Mrs. Straker's denial at the ruse is honest (t92.3): built from the sincerity default; the answer key", () => {
    const game = new Game(model, { difficulty: MEDIUM, options: { background: 'relevant' } });
    while (!game.knows('c.wife_never_had_dress')) game.advance();
    assert.deepEqual(game.doubtKinds('c.wife_never_had_dress'), ['mistaken', 'lying']);
    assert.deepEqual(game.propose(game.connectSet('k.wife_denies_in_good_faith')).built, ['k.wife_denies_in_good_faith']);
    const solved = new Game(model, { difficulty: TRIVIAL, autoPace: 'logic' });
    while (!solved.finished()) solved.advance();
    assert.equal(solved.settled('st.mrs_straker.believes_wife_never_had_dress.thu_evening'), 'true');
});

test("The stranger's 'Can you tell me where I am?' was a pretence (t24.2, Round 99): his lie is granted, and the clash sets aside only his statement", () => {
    const game = new Game(model, { difficulty: MEDIUM, options: { background: 'relevant' } });
    while (!game.knows('c.stranger_knew_lad_alone')) game.advance();
    assert.ok(game.knows('c.stranger_says_lost'));
    assert.deepEqual(game.doubtKinds('c.stranger_says_lost'), ['mistaken:the_stranger', 'lying:the_stranger', 'mistaken:edith_baxter', 'lying:edith_baxter']);
    assert.deepEqual(game.propose(game.connectSet('k.stranger_came_on_purpose')).built, ['k.stranger_came_on_purpose']);
    assert.ok(game.knows('k.stranger_lied_about_lost'), 'the lie is bookkeeping, granted with its premises');
    const clash = game.clashes();
    assert.equal(clash.length, 1);
    assert.ok(game.workingConstraints().some((k) => model.constraints.get(k).from_claim === 'c.stranger_knew_lad_alone'), 'the true clue the inference rests on is not set aside');
    game.suspect('c.stranger_says_lost', 'lying:the_stranger');
    assert.equal(game.clashes().length, 0);
    const solved = new Game(model, { difficulty: TRIVIAL, autoPace: 'logic' });
    while (!solved.finished()) solved.advance();
    assert.equal(solved.settled('st.the_stranger.believes_stranger_says_lost.mon_2105'), 'false');
});
