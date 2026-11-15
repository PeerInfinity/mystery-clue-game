// Papers earned by solving questions (docs/authored-stories.md, "The delivery mechanism"): the logic of a case as
// papers and questions, a seeded placement of the papers on the questions drawn as an Archipelago fill draws it, and
// a placement played forward. One module for the page (ui/world.js) and the check scripts (scripts/structure-check.mjs,
// scripts/path-check.mjs), so that a seed places the same papers everywhere.
//
// The logic: `{questions: [{id, sets, requires}], start, earned, goal}`. A question's `sets` are alternative lists of
// papers, one of which must all have come (its own evidence and the paper that raises it); `requires` the questions
// that must be solved first. `start` the papers held from the start, `earned` those placed on questions, `goal` the
// question that holds nothing (the end). A placement is a Map from a question to the paper it brings; a question
// with none brings nothing.

import { MAIN, parseRef } from './refs.js';

/** A small seeded generator (mulberry32): the same seed gives the same numbers in node and in the browser. */
export function rng(seed) {
    let s = seed | 0;
    return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function shuffle(list, rand) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}

/** Can question q be solved now: not solved yet, what it requires solved, and one of its sets of papers held. */
export const isOpen = (q, held, solved) => !solved.has(q.id) && (q.requires ?? []).every((r) => solved.has(r)) && q.sets.some((set) => [...set].every((p) => held.has(p)));

/** The papers held once these questions are solved under a placement. */
export const heldAfter = (logic, place, solved) => new Set([...logic.start, ...[...solved].map((q) => place.get(q)).filter(Boolean)]);

/** A placement played by a player who solves everything open, round by round: whether all is solved, the widths of the rounds. */
export function play(logic, place) {
    const held = new Set(logic.start), solved = new Set(), widths = [];
    for (;;) {
        const now = logic.questions.filter((q) => isOpen(q, held, solved));
        if (!now.length) break;
        widths.push(now.length);
        for (const q of now) { solved.add(q.id); if (place.get(q.id)) held.add(place.get(q.id)); }
    }
    return { done: solved.size === logic.questions.length, widths, solved };
}

/** One question at a time, chosen by `pick(open)` (default: drawn by `rand`): how many were open to choose from at each step, and the order. */
export function choices(logic, place, rand, pick = null) {
    const held = new Set(logic.start), solved = new Set(), counts = [], order = [];
    for (;;) {
        const now = logic.questions.filter((q) => isOpen(q, held, solved));
        if (!now.length) break;
        counts.push(now.length);
        const q = pick ? pick(now) : now[Math.floor(rand() * now.length)];
        solved.add(q.id); order.push(q.id);
        if (place.get(q.id)) held.add(place.get(q.id));
    }
    return { counts, order, done: solved.size === logic.questions.length };
}

/**
 * The fill, as Archipelago does it going forward: among the questions that can be reached with the papers placed so
 * far and that hold nothing yet, one is drawn, and a paper not yet placed is put on it; when every reachable question
 * is taken and papers remain, the draw has failed (null) and is made again. Questions left over give nothing.
 */
export function fillOnce(logic, rand) {
    const place = new Map(), left = shuffle(logic.earned, rand);
    while (left.length) {
        const free = [...play(logic, place).solved].filter((id) => id !== logic.goal && !place.has(id));
        if (!free.length) return null;
        place.set(free[Math.floor(rand() * free.length)], left.pop());
    }
    return place;
}

/** A placement drawn with `rand`, redrawn until one plays to the end (at most `tries`): `{place, redraws}`, place null if none. */
export function fill(logic, rand, tries = 1000) {
    let redraws = 0;
    for (let i = 0; i < tries; i++) {
        const place = fillOnce(logic, rand);
        if (place && play(logic, place).done) return { place, redraws };
        redraws++;
    }
    return { place: null, redraws };
}

/** The placement of a seed: what the page and the checks use. */
export const placement = (logic, seed) => fill(logic, rng(seed)).place;

/** A new seed for a new game. */
export const newSeed = () => 1 + Math.floor(Math.random() * 0x7ffffffe);

// --- The logic of a case. The page and the validator derive it from the world model; the check that it is the logic
// the story was written from compares it with structure.json (structureLogic), which the page never reads.
/** Where the main story's ending begins (earned papers): its paragraphs from there are held until the goal is solved. Default: the last. */
export const endingOf = (header, last) => header?.delivery?.ending ?? last;

/** The delivery a case's header asks for: `paragraph` (a file comes at its main-story paragraph, or from the start) or `earned`. */
export const deliveryMode = (header) => header?.delivery?.mode ?? 'paragraph';

/**
 * A case's logic from its own data: for each question with essential observations, the papers they rest on (where
 * each fact of theirs is told, a premise's for a fact only inferred), the paper that raises the question, and the
 * questions its "question X is solved" observations name (`requires`). `world`: {questions, observations, facts,
 * files, delivery} as the case's files hold them.
 */
export function caseLogic({ questions, observations, facts, files, delivery }) {
    const factById = new Map(facts.map((f) => [f.id, f]));
    // A reply (a file with `reply`: it comes when its question is solved) is no paper of the logic: nothing rests on it.
    const papers = files.filter((f) => !f.reply);
    const fileIds = new Set(papers.map((f) => f.id));
    const paperOf = (ref) => { const r = ref == null ? null : parseRef(ref); return r && r.story !== MAIN && fileIds.has(r.story) ? r.story : null; };
    const givenAt = (f) => f.given_at ?? ((f.basis ?? 'stated') === 'inferable' ? null : f.para);
    const factPapers = (id, seen = new Set()) => {
        const f = factById.get(id);
        if (!f || seen.has(id)) return [];
        seen.add(id);
        const at = givenAt(f);
        return at != null ? [paperOf(at)].filter(Boolean) : (f.from ?? []).flatMap((x) => factPapers(x, seen));
    };
    const out = [];
    for (const q of questions) {
        const mine = (observations ?? []).filter((o) => o.q === q.id && o.essential);
        if (!mine.length) continue;
        const own = new Set([paperOf(q.raised)].filter(Boolean)), requires = [];
        for (const o of mine) for (const e of o.from) {
            if (typeof e === 'string') factPapers(e).forEach((p) => own.add(p));
            else if (e.solved) { if (!requires.includes(e.solved)) requires.push(e.solved); }
            else if (e.doubted) factPapers(e.doubted).forEach((p) => own.add(p));
            else if (e.reasoned === 'missing') factPapers(e.of).forEach((p) => own.add(p));
            else if (e.reasoned) (e.premises ?? []).forEach((x) => factPapers(x).forEach((p) => own.add(p)));
        }
        out.push({ id: q.id, sets: [[...own].sort()], requires });
    }
    const start = delivery?.start ?? [];
    return { questions: out, start, earned: papers.map((f) => f.id).filter((id) => !start.includes(id)), goal: delivery?.goal ?? null };
}

/** The same logic from structure.json: a question's sets are its `needs`, each the papers of its clues and the paper that raises it. */
export function structureLogic(s) {
    const clues = new Map((s.clues ?? []).map((c) => [c.id, c]));
    const questions = s.questions.map((q) => ({
        id: q.id,
        sets: q.needs.map((set) => [...new Set([...(q.raised && q.raised !== 'main' ? [q.raised] : []), ...set.map((c) => clues.get(c)?.paper).filter(Boolean)])].sort()),
        requires: q.requires ?? [],
    }));
    const start = s.delivery?.start ?? [];
    return { questions, start, earned: s.papers.map((p) => p.id).filter((id) => !start.includes(id)), goal: s.goal };
}
