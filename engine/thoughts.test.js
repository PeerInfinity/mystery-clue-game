import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadCase } from './loadCase.js';
import { checkThoughts } from './thoughts.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);
const data = JSON.parse(fs.readFileSync(new URL('../cases/silver-blaze/thoughts.json', import.meta.url), 'utf8'));
const markdown = fs.readFileSync(new URL('../docs/reading-annotated.md', import.meta.url), 'utf8');

test('the annotated reading is well-formed, mirrors the annotation and maps to real cards', () => {
    const r = checkThoughts(data, model, { markdown, implicitRequired: true });
    assert.deepEqual(r.errors, []);
});

test('a deduction with no inference says why, and only a deduction with none may', () => {
    const bad = structuredClone(data);
    delete bad.thoughts.find((x) => x.id === 't68.3').no_inference;
    bad.thoughts.find((x) => x.id === 't20.1').no_inference = 'world-model';
    bad.thoughts.find((x) => x.id === 't37.8').no_inference = 'action';
    bad.thoughts.find((x) => x.id === 't4.2').no_inference = 'later';
    const r = checkThoughts(bad, model, { implicitRequired: true });
    assert.ok(r.errors.includes('t68.3: a IDENTIFY thought names no inference and gives no no_inference reason'));
    assert.ok(r.errors.some((e) => e.startsWith('t20.1: a RECORD thought needs no no_inference')));
    assert.ok(r.errors.includes('t37.8: names an inference and gives no_inference'));
    assert.ok(r.errors.some((e) => e.startsWith('t4.2: no_inference is one of')));
    assert.ok(!checkThoughts(bad, model).errors.some((e) => e.startsWith('t68.3')), 'a warning only until implicitRequired');
});

test('the checker catches a premise from the future, a quote ahead of its thought, and an unknown card', () => {
    const bad = structuredClone(data);
    const t = bad.thoughts.find((x) => x.id === 't4.2');
    t.from = [...t.from, 't37.6'];
    bad.thoughts.find((x) => x.id === 't20.1').reads.push('the immense significance of the curried mutton');
    bad.thoughts.find((x) => x.id === 't35.4').maps = ['c.no_such_claim'];
    const r = checkThoughts(bad, model);
    assert.ok(r.errors.some((e) => e.startsWith('t4.2: cites t37.6, which comes later')));
    assert.ok(r.errors.some((e) => e.startsWith('t20.1: reads ¶216')));
    assert.ok(r.errors.some((e) => e === 't35.4: maps to unknown c.no_such_claim'));
});

test('short chains: an inference on a non-deduction or unknown, implicit yet named, premises and dates checked', () => {
    const bad = structuredClone(data);
    bad.thoughts.find((x) => x.id === 't35.4').inference = 'k.coat_placed';
    bad.thoughts.find((x) => x.id === 't37.8').inference = 'k.no_such_inference';
    const t29 = bad.thoughts.find((x) => x.id === 't29.3');
    t29.from = t29.from.filter((x) => x !== 't28.2');
    const r = checkThoughts(bad, model);
    assert.ok(r.errors.some((e) => e.startsWith('t35.4: a RECORD thought names no inference')));
    assert.ok(r.errors.includes('t37.8: inference k.no_such_inference is not in constraints.json'));

    const named = Object.create(model);
    named.data = { ...model.data, constraints: model.data.constraints.map((k) => (k.id === 'k.coat_placed' ? { ...k, implicit: true } : k.id === 'k.found_before_seven' ? { ...k, implicit: undefined } : k)) };
    const r2 = checkThoughts(data, named, { implicitRequired: true });
    assert.ok(r2.errors.includes('k.coat_placed: marked implicit, but t95.2 names it'));
    assert.ok(r2.errors.some((e) => e === 'k.found_before_seven: no thought names this inference, and it is not marked implicit'));
    assert.ok(!r2.errors.some((e) => e.startsWith('k.police_stick_killed')), "a character's wrong reasoning needs no thought");

    const row = (res, id) => res.chains.rows.find((x) => x.thought === id);
    assert.deepEqual(row(r, 't29.3').unheld, ['t25.1'], 'a question no card holds yet');
    assert.deepEqual(row(r, 't29.3').unmatched, ['c.stranger_asked_for_tip']);
    const late = structuredClone(data);
    Object.assign(late.thoughts.find((x) => x.id === 't92.14'), { inference: 'k.practice_first', no_inference: undefined });
    assert.equal(row(checkThoughts(late, model, { dates: true }), 't92.14').dealt, 228, 'the practice inference speaks of the practice on the sheep, dealt at ¶228');
    const dated = checkThoughts(data, model, { dates: true });
    assert.equal(row(dated, 't29.3').dealt, 36, 'its conclusion speaks of the drugging, whose card comes at ¶36');
});

test('short chains: a rule the inference applies is its warrant; a miss can be explained', () => {
    const r = checkThoughts(data, model);
    const row = r.chains.rows.find((x) => x.thought === 't37.4');
    assert.ok(row.warrant.includes('r.same_dish_safe') && !row.unmatched.includes('r.same_dish_safe'));
    const bad = structuredClone(data);
    bad.thoughts.find((x) => x.id === 't20.3').date_note = 'a RECORD has no inference';
    assert.ok(checkThoughts(bad, model).errors.includes("t20.3: date_note explains the date of a thought's inference"));
});

test('short chains: a weighed statement counts as cited, used or set aside; so does one a rule application binds (Round 97)', () => {
    const row = (id) => checkThoughts(data, model).chains.rows.find((x) => x.thought === id);
    assert.deepEqual(row('t84.6').uncited, [], "Mrs. Straker's 'friend', weighed (t84.5), is what the merge sets aside");
    assert.deepEqual(row('t92.4').uncited, [], 'her honest denial, weighed (t92.3), is what the dress test uses');
    assert.ok(!row('t92.4').unmatched.includes('c.wife_never_had_dress'));
    assert.deepEqual(row('t135.1').uncited, [], "Brown's denial is bound in the lie's rule application");
    const bad = structuredClone(data);
    bad.thoughts.find((x) => x.id === 't84.6').from.push('t36.2'); // Hunter's charge, weighed: nothing to do with Derbyshire
    assert.deepEqual(checkThoughts(bad, model).chains.rows.find((x) => x.thought === 't84.6').uncited, ['t36.2']);
});

test('readers lack the rules of the background cards they do not hold (docs/reader-layer.md, Q1)', async () => {
    const { lackingRules } = await import('./readers.js');
    const lacks = (reader) => [...lackingRules(data.background, reader).keys()].sort();
    assert.deepEqual(lacks('racing'), ['r.tendon_nick']);
    assert.deepEqual(lacks('1892'), ['r.disguise_washes_off', 'r.laying_against', 'r.markings_identify_horse', 'r.searched_and_not_found', 'r.tendon_nick']);
    // "Partial" is lacking for a modern reader: opium's taste, the kick, the loose horse; and the milliner's prices.
    for (const r of ['r.opium_taste', 'r.curry_masks', 'r.startled_horse_kicks', 'r.horse_gregarious', 'r.servant_wages']) assert.ok(lacks('modern').includes(r), r);
    assert.ok(!lacks('modern').includes('r.gypsies_avoid_trouble'), 'period, presented not endorsed: held');
    assert.equal(lackingRules(data.background, 'nobody').size, 0);
});

test('a set-aside names a card the reader holds, and a hypothesis\'s candidates are answers to its question (Round 167)', async () => {
    const { checkThoughts } = await import('./thoughts.js');
    const data = JSON.parse(fs.readFileSync(new URL('../cases/silver-blaze/thoughts.json', import.meta.url)));
    assert.equal(data.thoughts.filter((t) => t.aside).length, 5);
    assert.ok(data.thoughts.filter((t) => t.candidates).length >= 10);
    const bad = structuredClone(data);
    const at = (id) => bad.thoughts.find((t) => t.id === id);
    at('t6.2').aside = 'r.opium_taste';
    at('t24.3').candidates = { slot: 'paper_packet.contents', values: ['arsenic'] };
    at('t4.1').aside = 'field_glass';
    const { errors } = checkThoughts(bad, model);
    for (const e of ['t6.2: sets aside r.opium_taste', 't24.3: arsenic is no answer', 't4.1: only a SET ASIDE thought']) assert.ok(errors.some((x) => x.startsWith(e)), e);
});

test('the annotation mirrors the data field by field, and the prose cites only thoughts that exist (Round 183)', () => {
    const bad = structuredClone(data);
    const t = (id) => bad.thoughts.find((x) => x.id === id);
    t('t37.4').text += ' And more.';
    t('t78.2').from = ['t78.1'];
    t('t34.2').holmes = { ...t('t34.2').holmes, paras: [180, 182] };
    t('t24.4').relations = [{ type: 'supports', target: 't24.3', member: 'money' }];
    t('t135.1').reads = ['Oh, come in'];
    t('t20.5').confidence = 'strong';
    t('t46.5').text = t('t46.5').text.replace('t28.3', 't28.9');
    const r = checkThoughts(bad, model, { markdown });
    for (const e of [
        "t37.4: its prose differs from the annotation's",
        't78.2: cites t78.1, t35.2 in the annotation, t78.1 in thoughts.json',
        't34.2: Holmes {"paras":[180,182,219],"range":true} in the annotation, {"paras":[180,182],"range":true} in thoughts.json',
        't24.4: relations strains t24.3 (drug); supports t24.3 (money) in the annotation, supports t24.3 (money) in thoughts.json',
        't135.1: reads other words in the annotation',
        't20.5: confidence fair in the annotation, strong in thoughts.json',
        't46.5: its prose cites t28.9, which does not exist',
    ]) assert.ok(r.errors.includes(e), e);
});
