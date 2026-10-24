// The action table: the annotation's player on Hard, each thought's moves made at its
// paragraph (retried each paragraph until they hold) and logged as the engine calls they are and as the UI makes them
// (the tab, the card opened, the buttons and the fields). It is the autoplay's script, and its game reaches the Hard
// maximum (engine/actionTable.test.js). Moves come from what thoughts.json says each thought holds (maps, inference,
// notices, raises, checks, dropped, asks, aside, candidates; a GENRE·re-read thought's `passage` makes no move since the
// Re-read button went); a few are the script's own rules, marked below.
//   actionTable(model) → { table: {difficulty, families, ahead, thoughts: [{id, para, tag, profile, holmes, moves, same,
//   scores, done}]}, game, never: [thought ids whose move never held] }
import { Game } from './game.js';

export function actionTable(model) {
    const T = model.data.thoughts;
    const checks = new Map(model.data.checks.map((c) => [c.id, c]));
    const g = new Game(model, { difficulty: 'hard' });
    const story = g.story;
    const sec = (id) => model.cards.get(id)?.section;
    const spansOf = new Map();
    for (let i = 0; i < story.paragraphs.length; i++) for (const s of story.segments(i)) for (const id of s.ids) if (model.cards.has(id)) { if (!spansOf.has(id)) spansOf.set(id, []); spansOf.get(id).push({ p: i, text: s.text, ids: s.ids.filter((x) => model.cards.has(x)) }); }
    const ruleOwners = new Map();
    for (const [c, rs] of g.rulesOn) for (const r of rs) { if (!ruleOwners.has(r)) ruleOwners.set(r, []); ruleOwners.get(r).push(c); }
    // The card a SET ASIDE thought sets aside and a hypothesis's candidates are data (thoughts.json).
    const ASIDE = Object.fromEntries(T.filter((t) => t.aside).map((t) => [t.id, t.aside]));
    // The script's own rules, what the annotation's data does not say:
    // a statement split, or an inference doubted with its reason (t35.6, t68.3);
    const DOUBTS = { 't35.6': { split: 'c.straker_defended_himself', reason: 'inference-as-fact' }, 't68.3': { card: 'k.one_culprit', reason: 'two-stories' } };
    // The scenario thoughts the player writes as theories (t92.6: the fixture of engine/hypotheses.test.js).
    const THEORIES = { 't92.6': { label: 'The inside story', assignment: { 'e.opium_added.agent': 'straker', 'e.opium_added.place': 'straker_villa', 'e.horse_led_out.agent': 'straker', 'e.horse_led_out.purpose': 'injure', 'e.fatal_blow.agent': 'silver_blaze', 'e.knife_taken.purpose': 'operation', 'e.coat_off.purpose': 'work', 'william_derbyshire.identity': 'straker', 'straker.honest': 'false', 'silver_blaze.hidden_at': 'mapleton', 'silver_blaze.disguised': 'true', 'e.fatal_blow.instrument': 'steel_shoe', 'e.light_struck.purpose': 'work' } } };
    const CANDIDATES = Object.fromEntries(T.filter((t) => t.candidates).map((t) => [t.id, [t.candidates.slot, t.candidates.values]]));
    // Weighing a story's residue on the Theories tab (Hard weighs on request).
    const WEIGHS = { 't46.3': 't.police' };
    // A check whose plan leaves a field to the player: what the annotation's thought would put there.
    const CHECK_FILL = { 't163.3': { about: 'curried_mutton' } };
    const mapped = new Set(T.flatMap((t) => [...(t.maps ?? []), ...(t.inference ? [t.inference] : []), ...(t.notices ?? [])]));
    let cur = null; // the thought whose moves are being made
    const rows = new Map(T.map((t) => [t.id, { id: t.id, para: t.para, tag: t.tag + (t.subtype ? `·${t.subtype}` : ''), profile: t.profile, holmes: t.holmes?.paras?.[0] ?? null, moves: [], done: null, pending: [] }]));
    let seq = 0;
    const log = (op, args, ui, ok = true) => { if (ok) rows.get(cur).moves.push({ seq: seq++, at: g.read - 1, op, ...args, ui }); return ok; };
    const tabOf = (id) => (sec(id) === 'rules' ? 'background' : sec(id) === 'inferences' ? 'inferences' : 'cards');
    const openUi = (id) => ({ open: id, tab: tabOf(id) });

    function acquire(id) {
        if (g.knows(id)) return true;
        const s = sec(id);
        if (s === 'rules') {
            for (const c of ruleOwners.get(id) ?? []) {
                if (!g.knows(c) && sec(c) !== 'rules') acquire(c);
                if (!g.knows(c) || !g.canAsk(c)) continue;
                if (g.hasAsked(c)) { if (g.knows(id)) return true; continue; }
                const got = g.ask(c);
                log('ask', { card: c, got }, [openUi(c), { click: `[data-ask="${c}"]` }]);
                if (g.knows(id)) return true;
            }
            return false;
        }
        if (s === 'inferences') return build(id);
        const sp = (spansOf.get(id) ?? []).find((x) => x.p < g.read);
        if (!sp) return false;
        // A click on the words collects every card they carry, as the UI does (onStoryClick).
        const got = g.collect(sp.p, sp.ids);
        const ok = log('collect', { card: id, from: sp.p, words: sp.text, got }, [{ story: sp.p, span: id, words: sp.text }], g.knows(id));
        // The script's rule: a careful Hard player asks what they know about each card they collect.
        for (const c of got) if (g.canAsk(c) && !g.hasAsked(c)) { const learnt = g.ask(c); log('ask', { card: c, got: learnt }, [openUi(c), { click: `[data-ask="${c}"]` }]); }
        return ok;
    }
    function build(id) {
        if (g.knows(id)) return true;
        const inf = g.inferenceById.get(id);
        if (inf.implicit) return false;
        for (const p of inf.premises) if (!g.knows(p)) acquire(p);
        if (!inf.premises.every((p) => g.knows(p))) return false;
        const cards = g.connectSet(id);
        const kind = g.conclusionKinds(id)[0];
        const r = g.propose(cards, kind);
        return log('build', { inference: id, cards, about: kind }, [...cards.flatMap((c, i) => [openUi(c), { click: `button[data-infer="${c}"]` }, ...(i === 0 ? [{ select: '#build-kind', value: kind }] : [])]), { expect: `built ${id}` }], g.knows(id));
    }
    const done = new Map(); // move key → the thought that made it
    const once = (key, fn) => {
        if (done.has(key)) { const r = rows.get(cur); if (done.get(key) !== cur && !(r.same ??= []).some((x) => x.key === key)) r.same.push({ key, by: done.get(key) }); return true; }
        const ok = fn(); if (ok) done.set(key, cur); return ok;
    };
    function moves(t) {
        let all = true;
        const step = (key, fn) => { all = once(key, fn) && all; };
        for (const m of t.maps ?? []) if (['claims', 'events', 'entities'].includes(sec(m))) step(`a:${m}`, () => acquire(m));
        for (const m of t.maps ?? []) if (model.slots.has(m)) step(`a:${model.slots.get(m).on}`, () => acquire(model.slots.get(m).on));
        for (const m of [...(t.maps ?? []), ...(t.dropped?.theory ? [t.dropped.theory] : [])]) {
            const th = (model.data.theories ?? []).find((x) => x.id === m);
            if (th) for (const s of Object.keys(th.assignment)) step(`a:${model.slots.get(s).on}`, () => acquire(model.slots.get(s).on));
        }
        if (CANDIDATES[t.id]) {
            const [slot, values] = CANDIDATES[t.id];
            step(`a:${model.slots.get(slot).on}`, () => acquire(model.slots.get(slot).on));
            for (const v of values) step(`cand:${slot}=${v}`, () => {
                if (g.settled(slot) !== null) return true; // settled by the story or the player: nothing left to propose
                if (model.cards.has(v) && !g.knows(v)) acquire(v); // an answer that is a card is one the player holds
                if (!g.slotVisible(slot) || !g.offered(slot, v)) return false;
                if (g.pencil(slot).includes(v)) return true;
                const r = g.addCandidate(slot, v);
                return log('candidate', { slot, value: v }, [openUi(model.slots.get(slot).on), { propose: slot, value: v }], r.ok);
            });
        }
        if (WEIGHS[t.id]) step(`w:${t.id}`, () => g.visibleTheories().some((x) => x.id === WEIGHS[t.id]) && log('weigh', { theory: WEIGHS[t.id], residue: g.residue(g.visibleTheories().find((x) => x.id === WEIGHS[t.id])).residue }, [{ tab: 'theories' }, { click: `[data-weigh="${WEIGHS[t.id]}"]` }]));
        if (t.inference) step(`i:${t.inference}`, () => build(t.inference));
        if (!['TEST', 'RECORD', 'REVISE'].includes(t.tag)) for (const m of t.maps ?? []) if (sec(m) === 'inferences' && !g.inferenceById.get(m)?.implicit) step(`i:${m}`, () => build(m));
        for (const c of t.notices ?? []) step(`n:${c}`, () => {
            if (!acquire(c)) return false;
            const because = (t.maps ?? []).find((m) => sec(m) === 'rules' && (acquire(m) || g.knows(m))) ?? null;
            return log('notice', { card: c, because }, [openUi(c), ...(because ? [{ select: '#notice-because', value: because }] : []), { click: `[data-notice="${c}"]` }], g.notice(c, because).ok !== false);
        });
        for (const r of t.raises ?? []) step(`r:${r.target}:${r.exception}`, () => {
            if (!acquire(r.target)) return false;
            const x = g.exceptionsOf(r.target).find((e) => e.id === r.exception);
            if (!x) return false;
            const res = g.raise(r.target, x.n, x.id);
            return log('raise', { target: r.target, exception: x.id, n: x.n, status: res.status ?? null }, [openUi(r.target), { click: `[data-raise="${r.target}|${x.n}|${x.id}"]` }], res.ok !== false);
        });
        for (const w of t.checks ?? []) step(`c:${t.id}:${w.check}`, () => {
            for (const plan of checks.get(w.check).plans) {
                const { verb, ...fields } = plan;
                const fill = { ...Object.fromEntries(Object.entries(fields).map(([f, ids]) => [f, ids.find((id) => g.knows(id)) ?? ids.find((id) => acquire(id))])), ...(CHECK_FILL[t.id] ?? {}) };
                for (const v of Object.values(fill)) if (v) acquire(v);
                if (Object.values(fill).some((v) => !v || !g.knows(v))) continue;
                const ordered = Object.fromEntries((verb ? Object.keys(fill) : []).map((f) => [f, fill[f]]));
                const res = g.seal(verb, ordered, { expect: w.expect ?? null, answer: w.answer ?? null });
                if (res.ok) return log('seal', { check: w.check, verb, fields: ordered, expect: w.expect ?? null, answer: w.answer ?? null }, [{ tab: 'checks' }, { select: '#plan-verb', value: verb }, ...Object.values(ordered).map((v, i) => ({ select: `#plan-${i}`, value: v })), ...(w.expect ? [{ select: '#plan-expect', value: w.expect }] : []), ...(w.answer ? [{ select: '#plan-slot', value: w.answer.eq[0] }, { select: '#plan-value', value: w.answer.eq[1] }] : []), { click: '[data-plan-seal]' }]);
            }
            return false;
        });
        if (t.tag === 'ABSENCE') for (const m of t.maps ?? []) if (g.absenceById().has(m)) step(`f:${m}`, () => {
            const a = g.absenceById().get(m);
            acquire(a.expectation); acquire(a.witness);
            const w = a.windows.find((x) => g.reached(x));
            if (!w) return false;
            return log('file', { absence: m, expectation: a.expectation, time: w, witness: a.witness }, [openUi(a.witness), { open_details: '.absence-on-card' }, { select: '#ab-exp', value: a.expectation }, { select: '#ab-time', value: w }, { click: '[data-absence-file]' }], g.fileAbsence(a.expectation, w, a.witness).ok);
        });
        if (t.asks) step(`q:${t.id}`, () => {
            if (!t.asks.cards.every((c) => acquire(c))) return false;
            const res = g.pose(t.asks.template, t.asks.cards);
            return log('pose', { template: t.asks.template, cards: t.asks.cards }, [openUi(t.asks.cards[0]), { select: '#pose-template', value: t.asks.template }, ...(t.asks.cards[1] ? [{ select: '#pose-second', value: t.asks.cards[1] }] : []), { click: `[data-pose="${t.asks.cards[0]}"]` }], res.ok !== false);
        });
        if (ASIDE[t.id]) step(`sa:${t.id}`, () => acquire(ASIDE[t.id]) && log('setAside', { card: ASIDE[t.id] }, [openUi(ASIDE[t.id]), { click: `[data-setaside="${ASIDE[t.id]}"]` }], g.setAside(ASIDE[t.id]) !== false));
        if (DOUBTS[t.id]) step(`dbt:${t.id}`, () => {
            const d = DOUBTS[t.id];
            if (d.split) {
                if (!acquire(d.split)) return false;
                const res = g.splitClaim(d.split);
                if (!res.ok) return false;
                log('split', { card: d.split, parts: res.parts }, [openUi(d.split), { click: `[data-split-claim="${d.split}"]` }]);
                // The parts are filed as the police's inferences (they cannot be doubted): the split is the move.
                return true;
            }
            if (!acquire(d.card)) return false;
            if (!g.suspect(d.card)) return false;
            g.setDoubtReason(d.card, d.reason);
            return log('doubt', { card: d.card, reason: d.reason }, [openUi(d.card), { click: `[data-suspect="${d.card}"]` }, { select: '#doubt-reason', value: d.reason }]);
        });
        if (THEORIES[t.id]) step(`th:${t.id}`, () => {
            const th = THEORIES[t.id];
            for (const s of Object.keys(th.assignment)) acquire(model.slots.get(s).on);
            // Only what a player can add in the UI at this paragraph: a raised question, an answer on offer, not given by a clue.
            const can = Object.fromEntries(Object.entries(th.assignment).filter(([s, v]) => g.slotVisible(s) && g.offered(s, v) && !g.given(s)));
            rows.get(cur).left = Object.keys(th.assignment).filter((s) => !(s in can));
            th.assignment = can;
            const id = g.addTheory(th.label, { ...can });
            THEORIES[t.id].id = id;
            return log('theory', { label: th.label, assignment: th.assignment }, [{ tab: 'theories' }, { fill: '#theory-name', value: th.label }, { click: '[data-new-theory]' }, ...Object.entries(th.assignment).flatMap(([s, v]) => [openUi(model.slots.get(s).on), { propose: s, value: v }, { click: `.chip[data-slot="${s}"][data-val="${v}"]` }, { click: '[data-op="theory"]' }])], !!id);
        });
        if (t.dropped && !t.dropped.inference) step(`d:${t.id}`, () => {
            const d = t.dropped;
            for (const c of d.cites ?? []) acquire(c);
            const target = d.theory ? { theory: d.theory } : { slot: d.slot, value: d.value };
            if (!(d.theory ? g.visibleTheories().some((x) => x.id === d.theory) : g.slotVisible(d.slot))) return false;
            const rival = ['more-hands', 'out-explained'].includes(d.reason) ? THEORIES['t92.6'].id ?? null : null;
            if (!(d.cites ?? []).every((c) => g.knows(c))) return false;
            if (d.slot && g.proposing() && !g.marks.get(d.slot)?.listed?.has(d.value)) {
                const r = g.addCandidate(d.slot, d.value);
                log('candidate', { slot: d.slot, value: d.value }, [openUi(model.slots.get(d.slot).on), { propose: d.slot, value: d.value }], r.ok);
            }
            const res = g.drop(target, d.reason, { cites: d.cites ?? [], rival });
            // A candidate's chip is on its question's own card; a theory's drop is on the Theories tab, the cited card open.
            const cite = d.cites?.[0];
            return log('drop', { target, reason: d.reason, cites: d.cites ?? [], rival: rival ? g.theories.find((x) => x.id === rival)?.label ?? null : null }, [...(d.theory ? [...(cite ? [openUi(cite)] : []), { tab: 'theories' }] : [openUi(model.slots.get(d.slot).on)]), d.theory ? { click: `[data-drop-open="t|${d.theory}"]` } : { click: `.chip[data-slot="${d.slot}"][data-val="${d.value}"]` }, ...(d.theory ? [] : [{ click: `[data-drop-open="c|${d.slot}|${d.value}"]` }]), { select: '#drop-reason', value: d.reason }, ...(rival ? [{ select_text: '#drop-rival', text: g.theories.find((x) => x.id === rival)?.label }] : []), ...(cite ? [{ select: '#drop-cite', value: cite }] : []), { click: '[data-drop-go]' }], res.ok);
        });
        return all;
    }
    const pendingT = [];
    while (!g.finished()) {
        g.advance();
        const p = g.read - 1;
        for (const t of T.filter((x) => x.para === p)) pendingT.push(t);
        // Passes over the paragraph until nothing more moves: a thought may need what a later one of the same paragraph makes.
        for (let more = true; more;) {
            more = false;
            for (const t of [...pendingT]) { cur = t.id; if (moves(t)) { pendingT.splice(pendingT.indexOf(t), 1); rows.get(t.id).done = p; more = true; } }
        }
        g.clashes();
    }
    for (const t of pendingT) rows.get(t.id).done = null;
    const rec = g.record();
    for (const r of rows.values()) {
        r.scores = rec.rows.filter((x) => x.thought === r.id).map((s) => ({ family: s.family, deadline: s.deadline, at: s.at, scored: s.scores, lead: s.lead }));
        // Cards the moves needed that no thought maps (background asked for, the cards a click also carries).
        r.extra = r.moves.filter((m) => m.card && !mapped.has(m.card) && ['collect', 'ask'].includes(m.op)).map((m) => m.card);
    }
    for (const r of rows.values()) delete r.pending;
    return { table: { difficulty: 'hard', families: rec.families, ahead: rec.ahead, thoughts: [...rows.values()] }, game: g, never: pendingT.map((t) => t.id) };
}
