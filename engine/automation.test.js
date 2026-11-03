// Incremental mode's automation (engine/automation.js): alone, with only the feedback the game gives, it reaches the
// Hard maximum; its counts add up; the player's marks set its order; a paused category leaves its wait open.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadCase } from './loadCase.js';
import { Game, INCREMENTAL, CONCLUSION_KINDS } from './game.js';
import { Automation, CATEGORIES } from './automation.js';

const dir = new URL('../cases/silver-blaze/', import.meta.url);
const model = await loadCase(dir.pathname);
const read = (f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8'));
const hints = read('hints.json');
const waits = read('incremental.json');
const scored = (g) => Object.values(g.record().families).reduce((a, f) => a + f.scored, 0);
const fresh = () => new Game(model, { pace: INCREMENTAL, waits: waits.waits });
const run = (a, budget = 2000) => { for (;;) { const s = a.step(budget); if (s.end || s.idle) return s; } };

function checkCounts(c) {
    assert.deepEqual(Object.keys(c), CATEGORIES);
    for (const [cat, x] of Object.entries(c)) {
        const sum = x.terms.reduce((a, t) => a + t.factors.reduce((p, f) => p * f.n, 1), 0);
        assert.equal(x.total, sum, `${cat}: the total is the sum of the terms' products`);
        assert.ok(x.ruledOut >= 0 && x.ruledOut <= x.total, `${cat}: ruled out within the total`);
        assert.ok(x.checked >= 0 && x.found >= 0 && x.stale >= 0, cat);
    }
}

test('the automation alone, with only the feedback the game gives, reaches the maximum', () => {
    const g = fresh();
    const a = new Automation(g, { seed: 1 });
    const s = run(a);
    assert.equal(s.idle, 'end');
    assert.ok(g.finished());
    assert.equal(scored(g), hints.rows.length);
    const c = a.counts();
    checkCounts(c);
    // Every family the waits name was searched, and found what it needed.
    for (const cat of ['collect', 'ask', 'build', 'lead', 'raise', 'check', 'absence', 'drop']) assert.ok(c[cat].found > 0, cat);
    assert.equal(c.answers.checked, 0, 'the answers route is not searched');
});

test('the player\'s marks set the order: circled, important, the rest, set aside', () => {
    const g = fresh();
    const a = new Automation(g, { seed: 2, running: ['collect', 'ask'] });
    const s = run(a);
    assert.ok(s.idle, 'with only collect and ask running, the first wait stays open');
    const held = [...g.unlocked.keys()].filter((x) => ['entities', 'events'].includes(model.cards.get(x)?.section));
    const slot = g.visibleSlots().find((sl) => sl.domain.some((v) => g.offered(sl.id, v) && model.cards.has(v) && v !== sl.on));
    const value = slot.domain.find((v) => g.offered(slot.id, v) && model.cards.has(v) && v !== slot.on);
    g.circle(slot.id, value);
    const aside = held.find((x) => x !== slot.on && x !== value);
    const odd = held.find((x) => ![slot.on, value, aside].includes(x));
    g.setAside(aside);
    g.markImportant(odd);
    const order = a.order(held);
    assert.deepEqual(new Set(order.slice(0, 2)), new Set([slot.on, value]));
    assert.equal(order[2], odd);
    assert.equal(order.at(-1), aside);
    // Answers: circled first, crossed out last; as drop targets, the other way round.
    const vals = slot.domain.filter((v) => g.offered(slot.id, v));
    assert.equal(a.orderValues(slot.id, vals)[0], value);
    assert.equal(a.orderTargets(vals.map((v) => ({ slot: slot.id, value: v }))).at(-1).value, value);
    checkCounts(a.counts());
});

test('a paused category leaves its wait open; resumed, the search meets it', () => {
    const g = fresh();
    const a = new Automation(g, { seed: 3, running: ['collect', 'ask', 'build', 'raise', 'check', 'absence', 'drop'] });
    let s;
    // Run until a notice wait (a lead to investigate) is open with nothing else to search.
    for (;;) { s = run(a); if (s.idle === 'paused') break; assert.ok(!s.end, 'some wait is a notice'); }
    assert.ok(a.open.some((w) => w.row?.endsWith('|notice')));
    const at = g.read;
    a.setRunning('lead', true);
    a.step(5000);
    assert.ok(g.read > at || !a.open.some((w) => w.row?.endsWith('|notice')), 'the lead search lifts its wait');
});

test('a check is planned before it is made; the queue starts with it; a save carries the counts and the negatives', () => {
    const g = fresh();
    const a = new Automation(g, { seed: 4 });
    a.step(300);
    const next = a.next();
    assert.ok(next?.label, 'a check is planned');
    assert.equal(a.next(), next, 'planning again plans the same check');
    const q = a.queue();
    assert.equal(q[0], next);
    const before = a.n;
    const entry = a.execute();
    assert.equal(entry.label, next.label);
    assert.equal(a.n, before + 1);
    assert.equal(a.log.at(-1), entry);
    // Saved and restored: the counts and the negatives come back; the same game goes on searching.
    const saved = JSON.parse(JSON.stringify(a.save()));
    const b = new Automation(g, { seed: 4, state: saved });
    const ca = a.counts(), cb = b.counts();
    for (const cat of CATEGORIES) {
        assert.equal(cb[cat].checked, ca[cat].checked, cat);
        assert.equal(cb[cat].ruledOut, ca[cat].ruledOut, cat);
    }
    assert.ok(b.next());
});

test('what is left with each card: pairs not tried, larger sets only where a set with it was onto something', () => {
    const g = fresh();
    const a = new Automation(g, { seed: 1 });
    while (a.n < 4000) { const s = a.step(500); if (s.end || s.idle) break; }
    const pc = a.perCard();
    const live = (k) => a.neg.build.has(k) && !a.stale.build.has(k);
    const withBuild = [...pc].filter(([, o]) => o.build);
    assert.ok(withBuild.length > 0);
    for (const [x, o] of pc) {
        // A card ruled out on its own: no pair with it is onto anything, so nothing is left to build with it.
        if (live(x)) assert.equal(o.build, undefined, x);
    }
    const free = withBuild.map(([x]) => x);
    for (const [x, o] of withBuild.slice(0, 40)) {
        const tried = free.filter((y) => y !== x).filter((y) => { const k = [x, y].sort().join('|'); return a.onto.has(k) || live(k); }).length;
        assert.equal(o.build.pairs, free.length - 1 - tried, `${x}: the pairs not tried`);
        const ontoBig = [...a.onto].some((k) => k.split('|').length >= 2 && k.split('|').includes(x));
        if (!ontoBig) assert.equal(o.build.larger, 0, `${x}: no larger sets until a set with it is onto something`);
    }
    assert.ok(a.onto.size > 0, 'some sets were onto something');
    const b = new Automation(g, { seed: 1, state: JSON.parse(JSON.stringify(a.save())) });
    assert.deepEqual([...b.onto].sort(), [...a.onto].sort(), 'the onto sets are saved');
});

test('builds go by "onto something": every card on its own first, a pair only of cards each onto something alone', () => {
    const g = fresh();
    const a = new Automation(g, { seed: 2 });
    const alone = new Map();    // card name → its answer alone ('yes' | 'no'), the last given
    let pairs = 0;
    while (a.n < 6000) {
        const c = a.next();
        if (!c) break;
        const e = a.execute();
        const m = e.cat === 'build' && e.label.match(/^connect (.+): onto something\?$/);
        if (!m) continue;
        const cards = m[1].split(' + ');
        if (cards.length === 1) { alone.set(cards[0], e.out); continue; }
        pairs++;
        for (const x of cards) assert.equal(alone.get(x), 'yes', `${e.label}: ${x} was tried alone first, and was onto something`);
    }
    assert.ok(pairs > 0, 'some larger sets were tried');
});

test('the log keeps every find and the last 100 other checks; the save keeps the same', () => {
    const g = fresh();
    const a = new Automation(g, { seed: 1 });
    let finds = 0;
    const rest = [];
    while (a.n < 3000) {
        if (!a.next()) break;
        const e = a.execute();
        if (e.out === 'found') finds++; else rest.push(e.n);
    }
    assert.ok(finds > 0, 'something was found');
    assert.equal(a.log.filter((e) => e.out === 'found').length, finds, 'every find kept');
    const others = a.log.filter((e) => e.out !== 'found');
    assert.equal(others.length, 100, 'the last 100 others');
    assert.deepEqual(others.map((e) => e.n), rest.slice(-100), 'the newest 100 of the others');
    assert.ok(a.log.every((e, i) => i === 0 || e.n > a.log[i - 1].n), 'in order');
    const b = new Automation(g, { seed: 1, state: JSON.parse(JSON.stringify(a.save())) });
    assert.deepEqual(b.log, a.log);
});

test('a reload keeps what was asked about, and what the asks recalled (Hard collects its cards)', () => {
    const g = fresh();
    const a = new Automation(g, { seed: 2 });
    a.step(1500);
    assert.ok(g.asked.length > 5, `asked about ${g.asked.length} cards`);
    const h = fresh();
    h.load(JSON.parse(JSON.stringify(g.save())));
    assert.deepEqual(h.asked.map(([id]) => id).sort(), g.asked.map(([id]) => id).sort(), 'the asks come back');
    assert.deepEqual([...h.unlocked.keys()].sort(), [...g.unlocked.keys()].sort(), 'the same cards held, the facts the asks recalled among them');
});

test('the plan is what follows: every check it lists is made in its order while every answer is "no"', () => {
    const g = fresh();
    const a = new Automation(g, { seed: 3 });
    let preds = [], hit = 0, lines = 0;
    for (let i = 0; i < 2500 && a.next(); i++) {
        const pl = a.plan(11);
        assert.equal(pl.list[0], a.next(), 'the plan starts with the check planned');
        if (pl.lines.some((l) => l.cat === 'build' && l.stage && l.more > 0)) lines++;
        const e = a.execute();
        preds = preds.filter((p) => {
            const want = p.list.shift();
            if (!want) return false;
            if (p.excused) return false;
            // A complete set's "yes" puts its kinds first (not foreseen: the answer says the set is complete).
            if (e.cat === 'build' && / as /.test(e.label) && !/ as /.test(want.label)) return false;
            assert.equal(`${want.cat}: ${want.label}`, `${e.cat}: ${e.label}`, `check #${e.n}`);
            hit++;
            // A build's "yes" leaves its level's list as it was; a "yes" elsewhere or a find may change what follows.
            if (e.out === 'found' || (e.out === 'yes' && (e.cat !== 'build' || / as /.test(e.label)))) p.excused = true;
            return true;
        });
        preds.push({ list: pl.list.slice(1), excused: e.out === 'found' || (e.out === 'yes' && (e.cat !== 'build' || / as /.test(e.label))) });
    }
    assert.ok(hit > 10000, `${hit} checks foretold`);
    assert.ok(lines > 100, 'the builds say how many more of their level are planned');
    // The builds counted by the size of their sets add up to the builds counted.
    const sizes = a.counts().build.sizes;
    assert.equal(sizes.reduce((n, z) => n + z.checked, 0), a.stats.build.checked);
    assert.ok(a.log.filter((e) => e.cat === 'build').every((e) => e.size >= 1), 'a build in the log says the size of its set');
});

test('builds unchecked count what the search would still try: the plan of the level under way, the sizes beyond not known', () => {
    const g = fresh();
    const a = new Automation(g, { seed: 1 });
    const kinds = Object.keys(CONCLUSION_KINDS).length;
    let seen = 0;
    for (let i = 0; i < 3000 && a.next(); i++) {
        const c = a.next();
        if (c.cat === 'build' && !/ as /.test(c.label) && i % 7 === 0) {
            const pl = a.plan(1e6);
            const planned = pl.list.filter((x) => x.cat === 'build').length + (pl.lines.find((l) => l.cat === 'build')?.more ?? 0);
            const sizes = a.counts().build.sizes;
            const z = sizes[c.size - 1];
            assert.equal(z.left / kinds, planned, `sets of ${c.size} at check ${a.n + 1}`);
            assert.ok(sizes.slice(c.size).every((y) => y.left === null), 'the sizes beyond are not known yet');
            assert.ok(sizes.slice(0, c.size - 1).every((y) => y.left === 0), 'the sizes below are all answered');
            seen++;
        }
        a.execute();
    }
    assert.ok(seen > 50, `${seen} builds compared`);
});
