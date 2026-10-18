// The story text as the game reads it: paragraphs, and where in them every card, question, action, reasoning
// step and time expression sits.
//
// Matching works on a normalised copy of each paragraph (curly quotes → straight, dashes → '--', underscores
// dropped, whitespace collapsed) with a map back to the displayed text, so spans can be drawn on the original.

export function normalizeWithMap(text) {
    let norm = '';
    const map = [];
    for (let i = 0; i < text.length; i++) {
        let c = text[i];
        if (c === '’' || c === '‘') c = "'";
        else if (c === '“' || c === '”') c = '"';
        else if (c === '—') { norm += '--'; map.push(i, i); continue; }
        else if (c === '_') continue;
        else if (/\s/.test(c)) { if (norm.endsWith(' ') || norm === '') continue; c = ' '; }
        norm += c;
        map.push(i);
    }
    return { norm, map };
}

export const normalize = (s) => normalizeWithMap(s).norm.trim();

const isWord = (c) => !!c && /[A-Za-z0-9]/.test(c);

export class Story {
    /**
     * @param {string} raw story.txt
     * @param {object} data the merged case (with data.mentions)
     */
    constructor(raw, data) {
        this.paragraphs = raw.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean)
            .map((display, index) => ({ index, display, ...normalizeWithMap(display) }));
        this.spans = this.paragraphs.map(() => []);   // per paragraph: {start, end, ids: [], kind}
        this.problems = [];
        this.firstAt = new Map();                      // card / question / window id → first paragraph
        this.anchors = { actions: new Map(), steps: new Map(), questions: new Map() };
        this.#index(data);
    }

    /** Find a quote: {para, start, end} in display coordinates, or null. `from` = first paragraph to search. */
    find(quote, from = 1, to = this.paragraphs.length - 1) {
        const q = normalize(quote);
        for (let i = from; i <= to; i++) {
            const p = this.paragraphs[i];
            const at = p.norm.indexOf(q);
            if (at >= 0) return { para: i, start: p.map[at], end: p.map[at + q.length - 1] + 1 };
        }
        return null;
    }

    /** All whole-word occurrences of a phrase in paragraphs [from, to]. */
    findAll(phrase, from = 0, to = this.paragraphs.length - 1) {
        const q = normalize(phrase);
        const out = [];
        for (let i = from; i <= to; i++) {
            const p = this.paragraphs[i];
            let at = p.norm.indexOf(q);
            while (at >= 0) {
                if (!isWord(p.norm[at - 1]) && !isWord(p.norm[at + q.length])) {
                    out.push({ para: i, start: p.map[at], end: p.map[at + q.length - 1] + 1, len: q.length });
                }
                at = p.norm.indexOf(q, at + 1);
            }
        }
        return out;
    }

    #seen(id, para) {
        if (!this.firstAt.has(id) || this.firstAt.get(id) > para) this.firstAt.set(id, para);
    }

    #quoteSpan(id, quote, kind) {
        const hit = this.find(quote);
        if (!hit) { this.problems.push(`${id}: quote not within one paragraph: "${quote.slice(0, 50)}"`); return null; }
        this.spans[hit.para].push({ start: hit.start, end: hit.end, ids: [id], kind });
        this.#seen(id, hit.para);
        return hit;
    }

    #index(data) {
        // Entity mentions: longest wins where they overlap.
        const hits = [];
        const mentionSpecs = [
            ...Object.entries(data.mentions?.entities ?? {}).map(([id, phrases]) => [id, phrases, 'entity']),
            ...Object.entries(data.mentions?.windows ?? {}).map(([id, phrases]) => [id, phrases, 'window']),
        ];
        for (const [id, phrases, kind] of mentionSpecs) {
            for (const ph of phrases) {
                const spec = typeof ph === 'string' ? { text: ph } : ph;
                // Paragraph 0 is the title: it names the story, it does not introduce anyone.
                const [from, to] = spec.paras ?? [1, this.paragraphs.length - 1];
                const found = this.findAll(spec.text, from, to);
                if (!found.length) this.problems.push(`${id}: mention "${spec.text.replace(/\s+/g, ' ')}" not found`);
                for (const f of found) hits.push({ ...f, id, kind });
            }
        }
        hits.sort((a, b) => a.para - b.para || a.start - b.start || b.len - a.len);
        const taken = this.paragraphs.map(() => []);
        for (const h of hits) {
            const clash = taken[h.para].find((t) => h.start < t.end && t.start < h.end);
            if (clash) {
                if (clash.len >= h.len) continue;
                taken[h.para].splice(taken[h.para].indexOf(clash), 1);
            }
            taken[h.para].push(h);
        }
        for (const list of taken) {
            for (const h of list) {
                this.spans[h.para].push({ start: h.start, end: h.end, ids: [h.id], kind: h.kind });
                this.#seen(h.id, h.para);
            }
        }
        // Entities never mentioned by phrase appear with their own quote.
        for (const e of data.entities ?? []) {
            if (!this.firstAt.has(e.id)) for (const q of e.source ?? []) this.#quoteSpan(e.id, q, 'entity');
        }
        // Claims: every attestation quote is a span; the claim appears at the earliest. An absence the player files
        // (`via: absence` with `files`, Round 83) is no span: its line is where it can first be filed (`absenceAt`).
        this.absenceAt = new Map();
        for (const c of data.claims ?? []) {
            // A part of a statement (`part_of`, workstream 4) comes only when the player splits the statement.
            if (c.derived || c.part_of) continue;
            for (const a of c.attested ?? []) {
                if (a.via === 'absence' && a.files) {
                    const at = Math.max(...(a.source ?? []).map((q) => this.find(q)?.para ?? Infinity));
                    if (Number.isFinite(at)) this.absenceAt.set(c.id, Math.min(at, this.absenceAt.get(c.id) ?? Infinity));
                    else this.problems.push(`${c.id}: an absence line is not found`);
                    continue;
                }
                for (const q of a.source ?? []) this.#quoteSpan(c.id, q, 'claim');
            }
        }
        // Events told directly have their quote; implied ones also appear through claims (see Game).
        for (const e of data.events ?? []) for (const q of e.source ?? []) this.#quoteSpan(e.id, q, 'event');
        // A proposition with lines of its own is raised there (workstream 3: what Hunter saw, the gypsies' habit).
        for (const p of data.propositions ?? []) for (const q of p.source ?? []) this.#quoteSpan(p.id, q, 'proposition');
        for (const q of data.questions ?? []) {
            const hit = this.#quoteSpan(q.id, q.raised, 'question');
            if (hit) this.anchors.questions.set(q.id, hit.para);
        }
        for (const a of data.actions ?? []) {
            const hit = a.source?.length ? this.find(a.source[0]) : null;
            if (!hit) this.problems.push(`${a.id}: action has no locatable quote`);
            else this.anchors.actions.set(a.id, hit.para);
        }
        for (const r of data.route ?? []) {
            // A step from a thought's inference is told at its Holmes paragraph; one Holmes concludes, at his line.
            const hit = r.at !== undefined ? { para: r.at } : r.source?.length ? this.find(r.source[0]) : null;
            if (hit) this.anchors.steps.set(r.id, hit.para);
        }
        for (const list of this.spans) list.sort((a, b) => a.start - b.start || b.end - a.end);
    }

    /** The sentence of paragraph `para` that contains [start, end): what the story said at that mention. */
    sentenceAround(para, start, end = start) {
        const text = this.paragraphs[para].display;
        // A sentence ends at . ! or ? (optionally followed by closing quotes) and a space; abbreviations such as
        // "Mr." or "Dr." do not end one.
        const ends = [];
        for (const m of text.matchAll(/[.!?][”’"')]*\s+/g)) {
            const before = text.slice(Math.max(0, m.index - 4), m.index + 1);
            if (/\b(Mr|Mrs|Dr|St|Co)\.$/.test(before)) continue;
            ends.push(m.index + m[0].length);
        }
        const from = [0, ...ends].filter((x) => x <= start).pop();
        const to = ends.find((x) => x >= end) ?? text.length;
        return text.slice(from, to).trim();
    }

    /** The sentence where a card is first mentioned, or null. */
    firstSentence(id) {
        const para = this.firstAt.get(id);
        const span = para === undefined ? null : this.spans[para].find((s) => s.ids.includes(id));
        return span ? { para, text: this.sentenceAround(para, span.start, span.end) } : null;
    }

    /** Split a paragraph into segments, each with the ids of every span covering it. */
    segments(para) {
        const p = this.paragraphs[para];
        const cuts = new Set([0, p.display.length]);
        for (const s of this.spans[para]) { cuts.add(s.start); cuts.add(s.end); }
        const xs = [...cuts].sort((a, b) => a - b);
        const out = [];
        for (let i = 0; i + 1 < xs.length; i++) {
            const [a, b] = [xs[i], xs[i + 1]];
            const over = this.spans[para].filter((s) => s.start <= a && b <= s.end);
            out.push({ start: a, end: b, text: p.display.slice(a, b), ids: [...new Set(over.flatMap((s) => s.ids))], kinds: [...new Set(over.map((s) => s.kind))] });
        }
        return out;
    }

    /**
     * Gates for the 'wait' pace: paragraph → the reasoning steps a reader must have made before reading it.
     * A step gates the paragraph where Holmes acts on it or announces it — but never before its last premise
     * has been told: if the evidence first appears in the very paragraph that states the conclusion, the gate
     * moves to the paragraph after it.
     */
    #gates(data) {
        // A background fact counts as told where the story first touches its subject (its `relevant_from`), and
        // never before one of its cards is mentioned: the latest point any background setting makes it available.
        return this.gatesFor(data, (r) => Math.max(
            Math.min(...(r.attaches_to ?? []).map((e) => this.firstAt.get(e) ?? Infinity)),
            r.relevant_from ? this.find(r.relevant_from)?.para ?? Infinity : -1,
        ), this.problems);
    }

    /**
     * The gates with each background fact told where `ruleAt(rule)` says (for a reader who lacks some: Game). Not
     * kept. A step with a premise never told gates nothing; with `problems`, it is reported there.
     */
    gatesFor(data, ruleAt, problems = null) {
        const rules = new Map((data.rules ?? []).map((r) => [r.id, r]));
        const premiseAt = (step) => Math.max(-1, ...step.premises.map((p) => (rules.has(p) ? ruleAt(rules.get(p)) : this.firstAt.get(p) ?? Infinity)));
        const route = new Map((data.route ?? []).map((r) => [r.id, r]));
        const gates = new Map();
        const add = (para, stepId) => {
            const at = Math.max(para, premiseAt(route.get(stepId)) + 1);
            if (!Number.isFinite(at)) { problems?.push(`${stepId}: a premise is never told`); return; }
            if (!gates.has(at)) gates.set(at, new Set());
            gates.get(at).add(stepId);
        };
        for (const a of data.actions ?? []) {
            const at = this.anchors.actions.get(a.id);
            if (at !== undefined) for (const s of a.requires?.thoughts ?? []) add(at, s);
        }
        for (const r of data.route ?? []) {
            const at = this.anchors.steps.get(r.id);
            // Only deductions that settle or rule out one answer gate the reading, and Holmes's own inferences.
            const sharp = r.concludes.slot || r.concludes.formula?.eq || r.inference;
            if (r.reasoner === 'holmes' && at !== undefined && sharp) add(at, r.id);
        }
        return gates;
    }

    /** The reasoning steps a reader must have made before reading paragraph `para` (for the 'wait' pace). */
    stepsBefore(para, data) {
        if (!this.gates) this.gates = this.#gates(data);
        return [...(this.gates.get(para) ?? [])];
    }
}
