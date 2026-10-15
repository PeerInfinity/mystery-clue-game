// The annotated reading as data (cases/<case>/thoughts.json, mirrored from docs/reading-annotated.md): a careful
// reader's thoughts through the story, each with its earliest paragraph, its premises, its relations to earlier
// thoughts, the clauses it reads, Holmes's paragraph, and `maps` to the case cards that hold it.
//
// checkThoughts() returns errors (the data is wrong) and a report: how far the case's cards cover the thoughts,
// and where the game deals a mapped card later than the reader could have it.
//
// Short chains (docs/short-chains.md): each deduction-type thought names one authored inference (`inference`, a
// `k.*` id in constraints.json) whose premises are its cited thoughts' cards. The checker reports, as warnings,
// the thoughts with no inference yet, premises that do not agree with what the thought cites, an inference named
// by two thoughts, inferences no thought names that are not marked `implicit`, and the thoughts whose inference
// the game cannot have dealt by the thought's own paragraph (the earliest date).

import { Game, BG_RELEVANT } from './game.js';

export const TAGS = ['RECORD', 'NOTICE', 'ABSENCE', 'QUESTION', 'HYPOTHESIS', 'INFER', 'DEFAULT', 'AGENT', 'PHYSICAL',
    'IDENTIFY', 'WEIGH', 'SOURCE', 'TEST', 'RESIDUE', 'PREDICT', 'TEST PLAN', 'GENRE', 'SET ASIDE', 'DROP', 'REVISE'];
export const SUBTYPES = {
    NOTICE: ['calculate'], QUESTION: ['opportunity', 'motive', 'turn-around'], HYPOTHESIS: ['opportunity', 'motive', 'scenario'],
    DEFAULT: ['period'], IDENTIFY: ['merge', 'split'], GENRE: ['re-read', 'watch-holmes'], INFER: ['opportunity'],
};
export const RELATIONS = ['supports', 'strains', 'refutes', 'undercuts', 'revises', 'drops', 'answers', 'strained_by'];
const CONFIDENCE = ['weak', 'weak to fair', 'fair', 'fair to strong', 'strong'];
const PROFILES = ['typical', 'careful', 'expert'];
const READERS = /^(yes|likely|partial|rare|period|specialist|racing public|racing-literate|needs the text's gloss)/;
// Moves that need no confidence: a fact read, a question asked, a detail set aside, a passage re-read.
const NO_CONFIDENCE = (t) => ['RECORD', 'QUESTION', 'SET ASIDE'].includes(t.tag) || t.subtype === 're-read';
// The deduction-type tags: each such thought becomes one authored inference (short chains, Q1).
export const DEDUCTION = ['INFER', 'DEFAULT', 'AGENT', 'PHYSICAL', 'IDENTIFY'];

/**
 * @param data   the parsed thoughts.json
 * @param model  a loaded case model (with .story)
 * @param opts   { markdown: text of docs/reading-annotated.md (checked to mirror the data), dates: true to compare
 *               each RECORD's paragraph with where the game deals its cards, and each deduction's paragraph with
 *               where the game has dealt every premise of its inference (reads the story through once),
 *               implicitRequired: true to make an inference that no thought names and is not `implicit` an error }
 */
export function checkThoughts(data, model, { markdown = null, dates = false, implicitRequired = false } = {}) {
    const errors = [];
    const err = (m) => errors.push(m);
    const story = model.story;
    const thoughts = data.thoughts ?? [];
    const background = data.background ?? [];
    const byId = new Map();
    for (const t of thoughts) {
        if (byId.has(t.id)) err(`${t.id}: duplicate id`);
        byId.set(t.id, t);
    }
    const bkIds = new Set();
    for (const b of background) {
        if (!/^bk\.\w+$/.test(b.id)) err(`${b.id}: a background card's id is bk.<name>`);
        if (bkIds.has(b.id)) err(`${b.id}: duplicate id`);
        bkIds.add(b.id);
        for (const r of ['reader_1892', 'reader_modern']) if (!READERS.test(b[r] ?? '')) err(`${b.id}: ${r} "${b[r]}" is not a known availability`);
    }

    // Case cards a thought may map to.
    const d = model.data;
    const inferenceById = new Map((d.constraints ?? []).map((k) => [k.id, k]));
    const caseIds = new Set([...model.cards.keys(), ...(d.actions ?? []).map((a) => a.id), ...(d.route ?? []).map((s) => s.id), ...model.slots.keys(), ...(d.theories ?? []).map((x) => x.id)]);
    for (const b of background) for (const m of b.maps ?? []) if (!caseIds.has(m)) err(`${b.id}: maps to unknown ${m}`);

    // Scenes: each starts at its first quote's paragraph.
    const sceneStart = new Map((d.scenes ?? []).map((sc) => [sc.id.slice(0, 3), story.find(sc.source?.[0] ?? '')?.para]));
    const scenesInOrder = [...sceneStart].filter(([, p]) => p !== undefined).sort((a, b) => a[1] - b[1]);
    const sceneOf = (para) => scenesInOrder.filter(([, p]) => p <= para).pop()?.[0] ?? null;

    const last = story.paragraphs.length - 1;
    const paraOfQuote = (q) => {
        const parts = q.split(/ \.\.\. ?|\.\.\. /).map((x) => x.replace(/^\.\.\.\s*|\s*\.\.\.$/g, '').replace(/\.\.\.\?$/, '').trim()).filter((x) => x.length > 2);
        let at = -1;
        for (const part of parts) {
            const hit = story.find(part, 0);
            if (!hit) return null;
            at = Math.max(at, hit.para);
        }
        return at;
    };

    for (const t of thoughts) {
        const m = t.id.match(/^t(\d+)\.(\d+)$/);
        if (!m) { err(`${t.id}: a thought's id is t<paragraph>.<n>`); continue; }
        if (+m[1] !== t.para) err(`${t.id}: para ${t.para} differs from its id`);
        if (t.para < 0 || t.para > last) err(`${t.id}: paragraph ${t.para} is outside the story`);
        const sc = sceneOf(t.para);
        if (t.scene && sc && t.scene !== sc) err(`${t.id}: filed under ${t.scene}, but ¶${t.para} is in ${sc}`);
        if (!TAGS.includes(t.tag)) err(`${t.id}: unknown tag ${t.tag}`);
        if (t.also && !TAGS.includes(t.also)) err(`${t.id}: unknown tag ${t.also}`);
        if (t.then_tag && !TAGS.includes(t.then_tag)) err(`${t.id}: unknown tag ${t.then_tag}`);
        if (t.subtype && !(SUBTYPES[t.tag] ?? []).includes(t.subtype)) err(`${t.id}: ${t.tag} has no subtype ${t.subtype}`);
        if (t.confidence ? !CONFIDENCE.includes(t.confidence) : !NO_CONFIDENCE(t)) err(`${t.id}: confidence ${t.confidence ?? 'missing'}`);
        if (!PROFILES.includes(t.profile)) err(`${t.id}: profile ${t.profile ?? 'missing'}`);
        // Premises and relation targets exist and are no later than the thought.
        const earlier = (id, what) => {
            if (id.startsWith('bk.')) { if (!bkIds.has(id)) err(`${t.id}: ${what} unknown ${id}`); return; }
            const o = byId.get(id);
            if (!o) err(`${t.id}: ${what} unknown ${id}`);
            else if (o.para > t.para) err(`${t.id}: ${what} ${id}, which comes later (¶${o.para})`);
        };
        for (const p of t.from ?? []) earlier(p, 'cites');
        for (const r of t.relations ?? []) {
            if (!RELATIONS.includes(r.type)) err(`${t.id}: unknown relation ${r.type}`);
            earlier(r.target, r.type);
            const target = byId.get(r.target);
            if (r.member && target && !`${target.text ?? ''} ${(target.reads ?? []).join(' ')}`.toLowerCase().includes(r.member.toLowerCase())) {
                err(`${t.id}: ${r.type} ${r.target} (${r.member}), but ${r.target} names no such candidate`);
            }
        }
        // Quotes are found, and none lies ahead of the thought.
        for (const q of t.reads ?? []) {
            const p = paraOfQuote(q);
            if (p === null) err(`${t.id}: quote not found: "${q.slice(0, 70)}"`);
            else if (p > t.para) err(`${t.id}: reads ¶${p}, after its own paragraph`);
        }
        if (t.holmes && !t.holmes.never) for (const p of t.holmes.paras ?? []) if (p < 0 || p > last) err(`${t.id}: Holmes paragraph ${p} is outside the story`);
        for (const x of t.maps ?? []) if (!caseIds.has(x)) err(`${t.id}: maps to unknown ${x}`);
        if (t.inference !== undefined) {
            if (!DEDUCTION.includes(t.tag)) err(`${t.id}: a ${t.tag} thought names no inference (only ${DEDUCTION.join(', ')} do)`);
            else if (!inferenceById.has(t.inference)) err(`${t.id}: inference ${t.inference} is not in constraints.json`);
        }
    }

    // The Markdown mirror: the same ids with the same tags.
    if (markdown !== null) {
        const md = new Map([...markdown.matchAll(/^- `(t\d+\.\d+)` \*\*([A-Z ]+)/gm)].map((x) => [x[1], x[2]]));
        for (const [id, tag] of md) {
            if (!byId.has(id)) err(`${id}: in the annotation but not in thoughts.json`);
            else if (byId.get(id).tag !== tag) err(`${id}: tagged ${tag} in the annotation, ${byId.get(id).tag} in thoughts.json`);
        }
        for (const id of byId.keys()) if (!md.has(id)) err(`${id}: in thoughts.json but not in the annotation`);
    }

    // Coverage: how many thoughts of each tag a case card holds.
    const coverage = TAGS.map((tag) => {
        const of = thoughts.filter((t) => t.tag === tag);
        return { tag, count: of.length, mapped: of.filter((t) => (t.maps ?? []).length).length };
    }).filter((c) => c.count);

    // Dates: where the game (reading through, cards dealt as mentioned) deals a RECORD's cards.
    const dateGaps = [];
    if (dates) {
        const reader = new Game(model);
        while (!reader.finished()) reader.advance();
        for (const t of thoughts.filter((x) => x.tag === 'RECORD')) {
            for (const id of t.maps ?? []) {
                const at = reader.unlocked.get(id)?.para;
                if (at === undefined) continue; // rules arrive by the background setting; actions are the story's
                if (at > t.para) dateGaps.push({ thought: t.id, card: id, reader: t.para, game: at });
            }
        }
    }
    const chains = checkChains(thoughts, background, inferenceById, byId, dates ? model : null);
    for (const k of chains.unnamed) if (implicitRequired) err(`${k}: no thought names this inference, and it is not marked implicit`);
    for (const x of chains.implicitNamed) err(`${x.inference}: marked implicit, but ${x.thought} names it`);
    return { errors, coverage, dateGaps, chains, unmappedBackground: background.filter((b) => !(b.maps ?? []).length).map((b) => b.id) };
}

// The short chains: each deduction-type thought against its inference.
function checkChains(thoughts, background, inferenceById, byId, model) {
    const deductions = thoughts.filter((t) => DEDUCTION.includes(t.tag));
    const bkById = new Map(background.map((b) => [b.id, b]));
    // The case cards a cited item stands for: a thought's inference and the cards it maps to; a background card's rules.
    const cardsOf = (id) => {
        if (id.startsWith('bk.')) return new Set(bkById.get(id)?.maps ?? []);
        const o = byId.get(id);
        return new Set([...(o?.inference ? [o.inference] : []), ...(o?.maps ?? [])]);
    };

    // Where the game, read through with background facts arriving where relevant, has dealt each card. An
    // inference is available once all its premises are (whether or not a character states it then).
    let avail = null;
    if (model) {
        const reader = new Game(model, { background: BG_RELEVANT });
        while (!reader.finished()) reader.advance();
        const memo = new Map();
        avail = (id, seen = new Set()) => {
            if (memo.has(id)) return memo.get(id);
            const k = inferenceById.get(id);
            let at;
            if (k && !seen.has(id)) {
                seen.add(id);
                at = Math.max(-1, ...k.premises.map((p) => avail(p, seen)));
            } else at = reader.unlocked.get(id)?.para ?? Infinity;
            memo.set(id, at);
            return at;
        };
    }

    const rows = [];
    const namedBy = new Map();
    for (const t of deductions) {
        const row = { thought: t.id, tag: t.tag, para: t.para, inference: t.inference ?? null, uncited: [], unmatched: [], dealt: null };
        rows.push(row);
        const k = inferenceById.get(t.inference);
        if (!k) continue;
        if (!namedBy.has(k.id)) namedBy.set(k.id, []);
        namedBy.get(k.id).push(t.id);
        const premises = new Set(k.premises);
        const covered = new Set();
        for (const p of t.from ?? []) {
            const hit = [...cardsOf(p)].filter((c) => premises.has(c));
            if (hit.length) hit.forEach((c) => covered.add(c));
            else row.uncited.push(p);
        }
        row.unmatched = k.premises.filter((p) => !covered.has(p));
        if (avail) row.dealt = avail(k.id);
    }
    const shared = [...namedBy].filter(([, ts]) => ts.length > 1).map(([inference, ts]) => ({ inference, thoughts: ts }));
    const implicit = [...inferenceById.values()].filter((k) => k.implicit).map((k) => k.id);
    const implicitNamed = [...namedBy].filter(([id]) => inferenceById.get(id).implicit).map(([inference, ts]) => ({ inference, thought: ts[0] }));
    // A character's wrong reasoning (`truth: false`, the police's four) is not a reader's step: it becomes a
    // candidate defeated by undercut, strain and drop in workstream 3 (Round 33), so it needs no thought here.
    const wrong = [...inferenceById.values()].filter((k) => k.truth === false && !namedBy.has(k.id)).map((k) => k.id);
    const unnamed = [...inferenceById.values()].filter((k) => !k.implicit && k.truth !== false && !namedBy.has(k.id)).map((k) => k.id);
    return { rows, shared, implicit, implicitNamed, unnamed, wrong };
}
