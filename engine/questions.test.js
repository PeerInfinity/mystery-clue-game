// The player's own questions (docs/questions.md): a template over held cards, matched quietly to a slot and alike
// whether it matches or not, joining the story's question only once the story (or the player's own inference) raises it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, EASY, TRIVIAL, QUESTION_TEMPLATES } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);

function build(game, id) {
    for (const p of game.inferenceById.get(id)?.premises ?? []) if (game.inferenceById.has(p) && !game.knows(p)) build(game, p);
    return game.propose(game.connectSet(id));
}
const buildAll = (g) => { for (let i = 0; i < 3; i++) { const b = g.buildable(); if (!b.length) break; for (const id of b) build(g, id); } };
const easy = () => new Game(model, { difficulty: EASY, options: { background: 'relevant' } });
const readTo = (g, p) => { while (g.read <= p) g.advance(); }; // ¶p read

test('a matched and an unmatched question look alike until the story raises the matched one', () => {
    const g = easy();
    readTo(g, 31);
    const where = g.pose('where-is', ['silver_blaze']);
    const key = g.pose('who-had', ['stable_key']);
    assert.ok(where.ok && key.ok);
    const [a, b] = g.posedQuestions();
    assert.equal(a.text, 'Where is Silver Blaze?');
    assert.equal(b.text, "Who had the stable door's lock?");
    assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort());
    assert.equal(a.joined, null);
    assert.equal(b.joined, null);
    assert.ok(!JSON.stringify(g.save().posed).includes('hidden_at'), 'the save carries no match either');
    assert.equal(g.slotVisible('silver_blaze.hidden_at'), false, 'posing opens nothing');
});

test('the join: at the paragraph the story raises the question, with the player\'s candidates as circles', () => {
    const g = easy();
    readTo(g, 14);
    const { id } = g.pose('where-is', ['silver_blaze']);
    assert.ok(g.poseCandidate(id, 'kings_pyland'));
    assert.equal(g.poseCandidate(id, 'e.opium_added'), false, 'only a held card');
    readTo(g, 36);
    assert.equal(g.posedQuestions()[0].joined, null);
    assert.equal(g.record().questions.length, 0, 'nothing recorded before the raise');
    readTo(g, 37);
    assert.deepEqual(g.posedQuestions()[0].joined, { slot: 'silver_blaze.hidden_at', para: 37 });
    assert.ok(g.isCircled('silver_blaze.hidden_at', 'kings_pyland'), 'the candidate carried over');
    assert.deepEqual(g.record().questions, [{ id, slot: 'silver_blaze.hidden_at', at: 14, deadline: 37, lead: 23 }]);
    assert.equal(g.record().ahead, easy().record().ahead, 'never counted');
});

test('a question raised by the player\'s own inference joins where they made it', () => {
    const g = easy();
    readTo(g, 14);
    g.pose('where-is', ['silver_blaze']);
    while (g.read <= 19) { g.advance(); buildAll(g); }
    assert.equal(g.posedQuestions()[0].joined?.para, 19, 'k.at_a_stable_in_reach built at ¶19');
});

test('the long lead: Straker\'s motive stays the player\'s note until the story raises it, its answers unseen', () => {
    const g = easy();
    readTo(g, 46);
    const { id } = g.pose('why-person', ['straker']);
    readTo(g, 150);
    const q = g.posedQuestions().find((x) => x.id === id);
    assert.equal(q.joined, null);
    assert.equal(g.slotVisible('straker.motive'), false);
    assert.ok(!/debt|household/i.test(JSON.stringify(q)));
    readTo(g, 214);
    assert.equal(g.posedQuestions().find((x) => x.id === id).joined?.para, 214);
});

test('a question already open joins at once and is not recorded; posing twice gives the same question', () => {
    const g = easy();
    readTo(g, 46);
    const r = g.pose('event-who', ['e.fatal_blow']);
    assert.deepEqual(g.posedQuestions()[0].joined, { slot: 'e.fatal_blow.agent', para: 46 });
    assert.deepEqual(g.pose('event-who', ['e.fatal_blow']), { ok: true, id: r.id, again: true });
    assert.equal(g.record().questions.length, 0);
});

test('refused: a card not held, the wrong kind, an unknown template, Trivial', () => {
    const g = easy();
    readTo(g, 20);
    assert.equal(g.pose('event-who', ['e.opium_added']).ok, false, 'the drugging is not yet told');
    assert.equal(g.pose('where-is', ['e.edith_carries_supper']).ok, false, 'an event is not a thing');
    assert.equal(g.pose('no-such', ['straker']).ok, false);
    assert.equal(g.pose('how-left', ['silver_blaze']).ok, false, 'two cards');
    const t = new Game(model, { difficulty: TRIVIAL });
    readTo(t, 20);
    assert.equal(t.pose('where-is', ['silver_blaze']).ok, false);
});

test('proposing answers (Hard\'s way): the join proposes the player\'s candidates', () => {
    const g = new Game(model, { difficulty: EASY, options: { background: 'relevant', answers: 'propose' } });
    readTo(g, 14);
    const { id } = g.pose('where-is', ['silver_blaze']);
    g.poseCandidate(id, 'kings_pyland');
    readTo(g, 37);
    assert.deepEqual(g.pencil('silver_blaze.hidden_at'), ['kings_pyland']);
    const h = new Game(model, { difficulty: EASY });
    h.load(g.save());
    assert.deepEqual(h.posedQuestions(), g.posedQuestions());
    assert.deepEqual(h.pencil('silver_blaze.hidden_at'), ['kings_pyland']);
});

test('saved and loaded on Easy, before and after the join', () => {
    const g = easy();
    readTo(g, 20);
    const a = g.pose('where-is', ['silver_blaze']).id;
    g.poseCandidate(a, 'kings_pyland');
    g.pose('reach', ['curried_mutton']);
    const h = easy();
    h.load(g.save());
    assert.deepEqual(h.posedQuestions(), g.posedQuestions());
    readTo(h, 37);
    const k = easy();
    k.load(h.save());
    assert.deepEqual(k.posedQuestions(), h.posedQuestions());
    assert.equal(k.record().questions[0].lead, 17);
    assert.ok(k.unpose(a));
    assert.equal(k.posedQuestions().length, 1);
    assert.ok(k.isCircled('silver_blaze.hidden_at', 'kings_pyland'), 'the marks stay');
});

test('asking everything moves no score family', () => {
    const g = easy();
    const plain = easy();
    readTo(g, 46);
    readTo(plain, 46);
    let n = 0;
    const held = [...g.known()].filter((id) => ['entities', 'events'].includes(model.cards.get(id).section));
    for (const t of Object.keys(QUESTION_TEMPLATES)) {
        const kinds = QUESTION_TEMPLATES[t].cards;
        if (kinds.length !== 1) continue;
        for (const id of held) if (g.pose(t, [id]).ok) n++;
    }
    assert.ok(n > 100, `${n} questions posed`);
    readTo(g, 231);
    readTo(plain, 231);
    const [a, b] = [g.record(), plain.record()];
    assert.deepEqual(a.families, b.families);
    assert.equal(a.ahead, b.ahead);
    assert.ok(a.questions.length > 0);
});

test('a re-read can carry the player\'s own question', () => {
    const g = easy();
    readTo(g, 46);
    const { id } = g.pose('why-person', ['straker']);
    assert.deepEqual(g.reread(20, 30, id), { from: 20, to: 30, question: id, para: 46 });
    assert.equal(g.reread(20, 30, 'pq.99'), null);
});
