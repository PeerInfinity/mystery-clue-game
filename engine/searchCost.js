// Incremental mode, step 2: what a blind search costs. A player who automates everything plays incremental mode
// (engine/incremental.js's waits) on the page's rules, with only the feedback the game already gives: at each wait it
// collects every span read and asks about every card, then searches each open wait's family in a random order until
// the wait is met, and counts the checks.
//   build      grown card by card with "onto something" (propose): every set tried is one check; a complete set
//              tries the conclusion's kinds (Hard). Run.
//   notice     each held card marked odd, kept only if a wait lifts (the wait as its check). Run.
//   raise      each exception open against a held card, withdrawn unless a wait lifts. Run.
//   check      sealed checks: the space (verb × field × field × expectation, × the answers for a check that expects
//              one) and the plans in it that make the row; expected checks (N + 1) / (t + 1). Counted.
//   absence    fact × time × statement, and the combinations that file the row's absence. Counted.
//   drop       target × reason: the targets the page offers (theories, and every answer the story has shown),
//              the reasons tried on the true target with dropCheck; expected (T·R + 1) / (holding + 1). Counted.
//   answers    the other route to a deduction that rules one answer out: the answer pairs, one of which (if provable
//              now) makes it; expected (A + 1) / 2. Counted, never taken (the run builds).
// With `onto` (the default), absences, sealed checks and drops are searched too, part by part with incremental mode's
// feedback (Game.absenceOnto, sealOnto, dropOnto), the expectation, the answer and the reason tried whole; without it
// they are counted only. A wait no search meets is made with the minimal playthrough's moves (hints.json), so the game
// goes on, and reported. → {stops: [...], rows: [...], extra: {...}}
import { Game, INCREMENTAL, CHECK_TEMPLATES, CONCLUSION_KINDS, DROP_REASONS } from './game.js';
import { madeRows } from './hints.js';
import { closure } from './incremental.js';
import * as TL from './timeline.js';

const POOL = ['entities', 'events', 'claims', 'rules', 'inferences', 'propositions'];

function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = (xs, r) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function searchCost(model, hints, waits, make, { seed = 1, onto = true } = {}) {
    const r = rng(seed);
    const T0 = Date.now();
    const g = new Game(model, { pace: INCREMENTAL, waits: waits.waits });
    const bySeq = new Map(hints.moves.map((m) => [m.seq, m]));
    const rowOf = new Map(hints.rows.map((x) => [`${x.thought}|${x.family}`, x]));
    const thoughts = new Map(model.data.thoughts.map((t) => [t.id, t]));
    const sec = (id) => model.cards.get(id)?.section;
    const held = () => [...g.unlocked.keys()].filter((x) => !g.hidden.has(x));
    const made = (key) => madeRows(g).has(key);
    const out = { stops: [], rows: [], extra: { builtNotNeeded: new Set(), fallback: [], unreachable: [] } };
    const needed = new Set(hints.moves.filter((m) => m.op === 'build').map((m) => m.inference));
    // Negatives of the build search, kept across stops ("stale" once a new card completes a recipe they are part of).
    const negative = new Map();
    let complete = new Set();
    const forceRow = (key) => {
        for (const s of [...closure(bySeq, rowOf.get(key).makes)].sort((a, b) => a - b)) make(g, model, bySeq.get(s));
    };

    // ---- the build search: grow a set while it is "onto something"; a complete one tries the kinds ----
    function buildSearch(goal) {
        let checks = 0;
        if (goal()) return { checks, ok: true };
        let pool = shuffle(held().filter((x) => POOL.includes(sec(x))), r);
        const tried = new Set();
        let builtAny = false;
        const probe = (S, kind = null) => { checks++; return g.propose(S, kind); };
        // The goal is checked only when something was built (a check of the rows made runs the solver).
        let done = false;
        const grow = (S) => {
            for (const x of pool) {
                if (done) return;
                if (S.includes(x)) continue;
                const T = [...S, x];
                const k = [...T].sort().join('|');
                if (tried.has(k) || negative.has(k)) continue;
                tried.add(k);
                const res = probe(T);
                if (res.needsKind || res.wrongKind) {
                    for (const kind of shuffle(Object.keys(CONCLUSION_KINDS), r)) {
                        const b = probe(T, kind);
                        for (const id of b.built) if (!needed.has(id)) out.extra.builtNotNeeded.add(id);
                        if (b.built.length) { builtAny = true; if (goal()) done = true; break; }
                    }
                    if (done) return;
                }
                if (res.onto) grow(T); else if (!res.needsKind && !res.wrongKind) negative.set(k, T);
            }
        };
        // A built inference is a card too: search again with it while the last pass built something.
        for (let pass = true; pass && !done;) {
            builtAny = false;
            grow([]);
            pass = builtAny;
            if (pass) { pool = shuffle(held().filter((x) => POOL.includes(sec(x))), r); tried.clear(); }
        }
        return { checks, ok: done };
    }
    /** Inferences whose connections are all in hand now: negatives that are part of one are stale. */
    function staleNow() {
        const now = new Set(g.inferences.filter((k) => !k.implicit && !g.knows(k.id) && k.premises.every((x) => g.knows(x))).map((k) => k.id));
        const fresh = [...now].filter((id) => !complete.has(id));
        complete = now;
        let stale = 0;
        for (const id of fresh) {
            const ps = new Set(g.inferenceById.get(id).premises);
            for (const [k, T] of negative) if (T.every((x) => ps.has(x))) { negative.delete(k); stale++; }
        }
        return stale;
    }

    while (!g.finished()) {
        if (g.advance().ok) continue;
        const stop = { para: g.read, collect: 0, ask: 0, stale: 0 };
        // Collect every span read, ask about every card: lookups.
        for (let q = 1; q < g.read; q++) for (const s of g.story.spans[q]) {
            const ids = s.ids.filter((x) => model.cards.has(x));
            if (ids.some((x) => !g.knows(x) && !g.hidden.has(x))) { g.collect(q, ids); stop.collect++; }
        }
        for (let grew = true; grew;) { grew = false; for (const id of held()) if (g.canAsk(id) && !g.hasAsked(id)) { g.ask(id); stop.ask++; grew = true; } }
        stop.stale = staleNow();
        // The spaces at this stop.
        const cards = held();
        const slots = g.visibleSlots();
        const answers = slots.reduce((a, s) => a + s.domain.filter((v) => g.offered(s.id, v)).length, 0);
        const sealHeld = cards.filter((x) => ['entities', 'claims'].includes(sec(x)));
        const people = sealHeld.filter((x) => model.cards.get(x).kind === 'person');
        const fieldList = (f) => (f === 'person' || f === 'to' ? people : sealHeld);
        const sealSpace = Object.values(CHECK_TEMPLATES).reduce((a, t) => a + fieldList(t.fields[0]).length * fieldList(t.fields[1]).length * (t.outcomes.length + 1), 0);
        const times = TL.times(g).filter((t) => t.kind !== 'boundary');
        const absenceSpace = cards.filter((x) => sec(x) === 'rules').length * times.length * cards.filter((x) => sec(x) === 'claims').length;
        const theories = g.visibleTheories();
        // The page offers a drop on every answer the story has shown, a settled question's others folded.
        const dropTargets = theories.length + answers;
        const dropReasons = 2 * theories.length + 1 + cards.length;
        Object.assign(stop, { cards: cards.length, answers, sealSpace, absenceSpace, dropTargets, dropReasons });
        out.stops.push(stop);
        if (process.env.SC_LOG) console.error(`¶${g.read} ${((Date.now() - T0) / 1000).toFixed(1)}s`);

        const open = g.blockers();
        const order = (w) => (w.keep ? 0 : ['deduction', 'notice', 'raise', 'check', 'absence', 'drop'].indexOf(w.row.split('|')[1]) + 1);
        for (const w of [...open].sort((a, b) => order(a) - order(b))) {
            if (w.keep) {
                if (w.keep.inferences.every((id) => g.knows(id)) || w.rows.every(made)) continue;
                const { checks, ok } = buildSearch(() => w.keep.inferences.every((id) => g.knows(id)) || w.rows.every(made));
                out.rows.push({ para: g.read, wait: `keep ${w.keep.inferences.join(',')}`, family: 'build', checks, ok });
                continue;
            }
            const [thought, family] = w.row.split('|');
            const row = { para: g.read, wait: w.row, family };
            if (made(w.row)) { out.rows.push({ ...row, already: true }); continue; }
            if (family === 'deduction') {
                const c = g.routeById.get(thought)?.concludes;
                if (c?.slot) {
                    const ok = g.checkElimination(c.slot, c.value).ok;
                    row.answers = { space: answers, provable: ok, expected: ok ? (answers + 1) / 2 : null, page: g.slotVisible(c.slot) && g.offered(c.slot, c.value) && g.settled(c.slot) === null };
                }
                Object.assign(row, buildSearch(() => made(w.row)));
            } else if (family === 'notice') {
                let checks = 0;
                // A mark already made stays (taking it back would undo an earlier row).
                for (const x of shuffle(cards.filter((c) => !g.noticed.has(c)), r)) {
                    checks++;
                    if (g.notice(x).lifts > 0) break;
                    g.unnotice(x);
                }
                Object.assign(row, { checks, ok: made(w.row) });
            } else if (family === 'raise') {
                let checks = 0;
                const all = shuffle(cards.flatMap((id) => g.exceptionsOf(id).map((x) => [id, x.n, x.id])).filter(([id, n, x]) => !g.raised.has(`${id}#${n}:${x}`)), r);
                for (const [id, n, x] of all) {
                    checks++;
                    const res = g.raise(id, n, x);
                    if (made(w.row)) break;
                    if (res.ok) g.withdraw(id, n, x);
                }
                Object.assign(row, { space: all.length, checks, ok: made(w.row) });
            } else if (family === 'check') {
                const t = thoughts.get(thought);
                let sol = 0;
                for (const want of t.checks ?? []) {
                    const ck = model.data.checks.find((x) => x.id === want.check);
                    for (const p of ck.plans) {
                        const fs = CHECK_TEMPLATES[p.verb].fields.map((f) => (p[f] ? fieldList(f).filter((x) => p[f].includes(x)).length : fieldList(f).length));
                        sol += fs[0] * fs[1] * (want.expect === undefined ? CHECK_TEMPLATES[p.verb].outcomes.length + 1 : 1);
                    }
                }
                const answer = (t.checks ?? []).some((x) => x.answer);
                const space = sealSpace * (answer ? answers : 1);
                Object.assign(row, { space, solutions: sol, expected: (space + 1) / (sol + 1), answer });
                if (onto) {
                    // Each part apart: the verb, then each field's cards; their positives together; then the
                    // expectation (and, for a check that expects an answer, the answer) tried whole, the wait as check.
                    let checks = 0;
                    const tryPart = (verb, fields) => { checks++; return g.sealOnto(verb, fields); };
                    // A seal is kept only if it makes this row: one kept for another row could hedge this one (a check
                    // sealed expecting both results scores nothing); that row is searched in its own turn.
                    const sealOnce = (verb, fields, opts) => { checks++; const res = g.seal(verb, fields, opts); if (made(w.row)) return true; if (res.ok) g.unseal(res.id); return false; };
                    search: for (const verb of shuffle(Object.keys(CHECK_TEMPLATES), r)) {
                        if (!tryPart(verb, {})) continue;
                        const [f1, f2] = CHECK_TEMPLATES[verb].fields;
                        const p1 = shuffle(fieldList(f1), r).filter((c) => tryPart(verb, { [f1]: c }));
                        const p2 = shuffle(fieldList(f2), r).filter((c) => tryPart(verb, { [f2]: c }));
                        for (const c1 of p1) for (const c2 of p2) {
                            const fields = { [f1]: c1, [f2]: c2 };
                            if (!tryPart(verb, fields)) continue;
                            // No expectation first: it never hedges another seal of the same check.
                            const expects = [null, ...shuffle(CHECK_TEMPLATES[verb].outcomes, r)];
                            for (const expect of expects) if (sealOnce(verb, fields, { expect })) break search;
                            if (answer) for (const expect of CHECK_TEMPLATES[verb].outcomes) for (const sl of shuffle(slots, r)) for (const v of sl.domain.filter((x) => g.offered(sl.id, x))) if (sealOnce(verb, fields, { expect, answer: { eq: [sl.id, v] } })) break search;
                        }
                    }
                    row.checks = checks;
                }
                if (!made(w.row)) { row.forced = true; forceRow(w.row); }
                row.ok = made(w.row);
            } else if (family === 'absence') {
                const t = thoughts.get(thought);
                let sol = 0;
                for (const a of g.absenceById().values()) {
                    if (!(t.maps ?? []).includes(a.id) || !g.knows(a.expectation) || !g.knows(a.witness) || a.para >= g.read) continue;
                    sol += times.filter((x) => a.windows.includes(x.root)).length;
                }
                Object.assign(row, { space: absenceSpace, solutions: sol, expected: (absenceSpace + 1) / (sol + 1) });
                if (onto) {
                    // Each part apart (fact, statement, time), then their positives together, filed.
                    let checks = 0;
                    const part = (list, key) => shuffle(list, r).filter((x) => { checks++; return g.absenceOnto({ [key]: x }); });
                    const fs = part(cards.filter((x) => sec(x) === 'rules'), 'expectation');
                    const ws = part(cards.filter((x) => sec(x) === 'claims'), 'witness');
                    const ts = part(times.map((x) => x.id), 'time');
                    search: for (const f of fs) for (const x of ws) for (const t of ts) { checks++; g.fileAbsence(f, t, x); if (made(w.row)) break search; }
                    row.checks = checks;
                }
                if (!made(w.row)) { row.forced = true; forceRow(w.row); }
                row.ok = made(w.row);
            } else if (family === 'drop') {
                const target = thoughts.get(thought).dropped;
                const tgt = target.theory ? { theory: target.theory } : { slot: target.slot, value: target.value };
                const offered = target.theory ? theories.some((x) => x.id === target.theory)
                    : g.slotVisible(target.slot) && g.offered(target.slot, target.value);
                let holding = 0;
                const reasons = [...theories.flatMap((x) => [['out-explained', x.id], ['more-hands', x.id]]), ['cost'], ...cards.map((c) => ['card', null, c])];
                if (offered || g.scenarioOf(tgt)) {
                    for (const [reason, rival, cite] of reasons) {
                        g.drop(tgt, reason, { rival, cites: cite ? [cite] : [] });
                        if (g.dropCheck(tgt)?.ok) holding++;
                        g.undrop(tgt);
                    }
                }
                Object.assign(row, { targets: dropTargets, reasons: reasons.length, offered, holding, expected: offered && holding ? (dropTargets * reasons.length + 1) / (holding + 1) : null });
                if (!offered) out.extra.unreachable.push({ para: g.read, row: w.row, why: g.settled(target.slot ?? '') !== null ? `the question is settled (${g.settled(target.slot)})` : 'not offered' });
                if (onto && offered) {
                    // The target alone first ("is this a wrong turn?"), then its reasons tried whole (dropCheck, a solver
                    // check each, counted apart).
                    let checks = 0;
                    let solver = 0;
                    const targets = shuffle([...theories.map((x) => ({ theory: x.id })), ...slots.flatMap((sl) => sl.domain.filter((v) => g.offered(sl.id, v)).map((v) => ({ slot: sl.id, value: v })))], r);
                    search: for (const tg of targets) {
                        checks++;
                        if (!g.dropOnto(tg)) continue;
                        for (const [reason, rival, cite] of shuffle(reasons, r)) {
                            checks++; solver++;
                            g.drop(tg, reason, { rival, cites: cite ? [cite] : [] });
                            if (made(w.row)) break search;
                            g.undrop(tg);
                        }
                    }
                    Object.assign(row, { checks, solver });
                }
                if (!made(w.row)) { row.forced = true; forceRow(w.row); }
                row.ok = made(w.row);
            }
            out.rows.push(row);
        }
        // What no search met: made with the minimal playthrough's moves, and reported.
        for (const w of g.blockers()) {
            out.extra.fallback.push({ para: g.read, wait: w.row ?? `keep ${w.keep.inferences.join(',')}` });
            if (w.row) forceRow(w.row);
            else for (const k of w.rows) if (!made(k)) forceRow(k);
        }
        if (g.blockers().length) { out.stuck = { para: g.read, open: g.blockers() }; break; }
    }
    const rec = g.record();
    out.score = Object.values(rec.families).reduce((a, f) => a + f.scored, 0);
    const want = new Set(hints.rows.map((x) => `${x.thought}|${x.family}`));
    out.lost = rec.rows.filter((x) => want.has(`${x.thought}|${x.family}`) && !x.scores).map((x) => ({ row: `${x.thought}|${x.family}`, deadline: x.deadline, at: x.at, why: x.why ?? null }));
    out.extra.builtNotNeeded = [...out.extra.builtNotNeeded];
    out.extra.clashes = g.clashes().length;
    return out;
}
