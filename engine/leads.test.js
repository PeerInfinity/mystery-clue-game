// Leads (2026-11-03): the scored notice split from the player's mark "important". The game proposes leads (leads.json)
// once their quotes are read and their cards held; the player puts them under investigation or stops; a NOTICE row
// scores if a lead for it is under investigation when the story reaches Holmes's paragraph. The mark scores nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { Game, MEDIUM, TRIVIAL } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);
const medium = () => new Game(model, { difficulty: MEDIUM, options: { background: 'relevant' } });
const readTo = (g, p) => { while (g.read <= p) g.advance(); }; // ¶p read
const row = (g, t) => g.noticeScores().find((r) => r.thought === t);

test('a lead is proposed once its quotes are read and its cards held, and not before', () => {
    const g = medium();
    readTo(g, 83);
    assert.ok(!g.leads().some((l) => l.id === 'lead.bill_name'));
    assert.equal(g.investigate('lead.bill_name').ok, false, 'not before it is proposed');
    readTo(g, 84);
    const ids = g.leads().map((l) => l.id);
    assert.ok(ids.includes('lead.bill_name') && ids.includes('lead.bill_sum'), 'one card, two leads');
    assert.deepEqual(ids, [...ids].sort((a, b) => g.leadById().get(a).at - g.leadById().get(b).at), 'in the order they came');
    for (const l of g.leads()) assert.ok(!('scores' in l) && !('deadline' in l), 'the list never says which leads count');
});

test('investigating scores; the mark "important" does not', () => {
    const g = medium();
    readTo(g, 84);
    for (const c of ['c.milliner_bill', 'c.curry_for_supper', 'c.pocket_inventory']) assert.ok(g.markImportant(c).ok);
    assert.equal(g.noticeScore().scored, 0, 'a personal mark scores nothing');
    for (const id of ['lead.bill_name', 'lead.bill_sum', 'lead.curry', 'lead.candle']) assert.ok(g.investigate(id).ok);
    assert.deepEqual(g.noticeScore(), { investigated: 4, scored: 4, possible: 8, of: 11 });
    assert.ok(g.stopInvestigating('lead.candle'));
    assert.equal(row(g, 't78.3').investigated, null, 'stopped before Holmes: not counted');
    // A lead Holmes has passed cannot be investigated: the horse taken at all (Holmes asks it at ¶57).
    assert.equal(g.investigate('lead.taken').ok, false);
    assert.equal(g.leads().find((l) => l.id === 'lead.taken').state, 'settled');
});

test('settled at Holmes\'s paragraph as it stands: under investigation then, it scores and stays', () => {
    const g = medium();
    readTo(g, 80);
    assert.ok(g.investigate('lead.knife').ok);
    readTo(g, 81); // Holmes's paragraph read
    const knife = g.leads().find((l) => l.id === 'lead.knife');
    assert.deepEqual([knife.state, knife.investigated], ['settled', true]);
    assert.equal(g.stopInvestigating('lead.knife'), false, 'settled: it can no longer be stopped');
    assert.equal(row(g, 't80.2').scores, true);
    assert.equal(knife.answer, null, 'answer pending until the story gives it (¶221)');
    readTo(g, 221);
    assert.match(g.leads().find((l) => l.id === 'lead.knife').answer, /tendons/);
    assert.ok(g.leads().filter((l) => l.state !== 'settled').every((l) => !('answer' in l)), 'no answer on a lead Holmes has not taken up');
    // Saved and loaded: settled and open investigations come back.
    g.investigate('lead.bill_sum');
    const again = medium();
    again.load(JSON.parse(JSON.stringify(g.save())));
    assert.deepEqual(again.leads(), g.leads());
    assert.deepEqual(again.noticeScores(), g.noticeScores());
});

test('a lead not under investigation at Holmes\'s paragraph is settled unscored; Trivial scores nothing', () => {
    const g = medium();
    readTo(g, 81);
    assert.deepEqual([g.leads().find((l) => l.id === 'lead.knife').investigated, row(g, 't80.2').scores], [false, false]);
    const t = new Game(model, { difficulty: TRIVIAL });
    readTo(t, 84);
    t.investigate('lead.bill_name');
    assert.equal(t.noticeScore().scored, 0);
});

test('a cap on leads under investigation at a time: refused at it, nothing dropped; none in incremental mode', async () => {
    const { PRESETS, INCREMENTAL } = await import('./game.js');
    assert.deepEqual([PRESETS.easy.leads, PRESETS.medium.leads, PRESETS.hard.leads], ['16', '12', '8']);
    const g = medium();
    assert.equal(g.leadBudget(), 12);
    g.opts.leads = '2'; // smaller than any preset, to meet the cap with the case's 8 leads
    readTo(g, 84);
    assert.ok(g.investigate('lead.curry').ok && g.investigate('lead.coat').ok);
    const res = g.investigate('lead.candle');
    assert.deepEqual([res.ok, res.full], [false, true]);
    assert.deepEqual([...g.investigating.keys()], ['lead.curry', 'lead.coat'], 'nothing dropped to make room');
    assert.ok(g.investigate('lead.coat').ok, 'one already under investigation is no new one');
    g.stopInvestigating('lead.coat');
    assert.ok(g.investigate('lead.candle').ok);
    // A lead Holmes takes up frees its place.
    const h = medium();
    h.opts.leads = '1';
    readTo(h, 80);
    assert.ok(h.investigate('lead.knife').ok);
    assert.equal(h.investigate('lead.curry').ok, false);
    readTo(h, 81);
    assert.ok(h.investigate('lead.curry').ok, 'the knife, taken up at ¶81, left its place');
    assert.equal(new Game(model, { pace: INCREMENTAL }).leadBudget(), Infinity);
});
