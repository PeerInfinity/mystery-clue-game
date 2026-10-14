// Player state and the game's questions, on top of a case model (caseModel.js + story.js).
//
// Reading: the story advances one paragraph at a time. Holmes's actions happen as the text reaches them. With
//   the 'wait' pace, a paragraph where Holmes acts on (or announces) a deduction cannot be read until the
//   player has made that deduction.
// Collecting: in Trivial and Easy, every card mentioned in a paragraph is collected as it is read. In Hard,
//   a card is collected only when the player clicks the text that mentions it.
// Connecting: every visible slot has candidates.
//   Trivial: the whole domain, the values the collected clues already rule out are greyed; cross-outs may be
//     plain pencil marks.
//   Easy: the whole domain, nothing greyed; every cross-out needs cited evidence the game accepts.
//   Hard: the player proposes candidates first (only their type is checked); cross-outs need evidence.
// Background facts (rule cards) sit on the entity cards they belong to and arrive with them.

import { activeConstraints, checkStep, trustedClaim } from './caseModel.js';
import { evaluate } from './logic.js';

// Difficulty. TRIVIAL: the game works out what the held clues allow and settles questions itself; the player
// reads and watches. EASY: every answer is listed and the ones the player's clues rule out are greyed; plain
// pencil cross-outs. MEDIUM: every answer listed; each cross-out needs cited evidence. HARD: cards are collected
// by clicking the text, and the player proposes the answers.
export const TRIVIAL = 'trivial';
export const EASY = 'easy';
export const MEDIUM = 'medium';
export const HARD = 'hard';
export const DIFFICULTIES = [TRIVIAL, EASY, MEDIUM, HARD];
// Trivial's pace: settle each answer when Holmes reaches it in the story, or as soon as the held clues allow.
export const AUTO_HOLMES = 'holmes';
export const AUTO_LOGIC = 'logic';
export const FREE = 'free';
export const WAIT = 'wait';
// When background facts become available: all at once, where the story first touches each one's subject, or
// when the player asks about a card they hold.
export const BG_START = 'start';
export const BG_RELEVANT = 'relevant';
export const BG_ASK = 'ask';
export const BACKGROUND_DEFAULTS = { trivial: BG_RELEVANT, easy: BG_RELEVANT, medium: BG_ASK, hard: BG_ASK };
// Saves made before Medium existed: their 'trivial' is today's Easy, their 'easy' today's Medium.
const OLD_DIFFICULTY = { trivial: EASY, easy: MEDIUM, hard: HARD };

export class Game {
    constructor(model, { difficulty = MEDIUM, pace = FREE, background = null, autoPace = AUTO_HOLMES, state = null } = {}) {
        this.model = model;
        this.story = model.story;
        this.difficulty = difficulty;
        this.pace = pace;
        this.background = background ?? BACKGROUND_DEFAULTS[difficulty];
        this.autoPace = autoPace;
        this.actions = [...(model.data.actions ?? [])].sort((a, b) => a.order - b.order);
        this.actionById = new Map(this.actions.map((a) => [a.id, a]));
        this.routeById = new Map((model.data.route ?? []).map((r) => [r.id, r]));
        // GIVENS (sudoku's printed digits): a clue that states a slot's value outright fills that slot as soon as
        // the clue is held, while the player trusts it. Never a case question: those the player must prove. Every
        // claim is treated alike here (whether the case knows it to be false must not show).
        const caseQuestions = new Set((model.data.questions ?? []).map((q) => q.slot));
        this.givers = new Map();
        for (const c of model.data.claims ?? []) {
            if (c.derived || !c.asserts) continue;
            for (const f of c.asserts.and ?? [c.asserts]) {
                if (!f.eq || caseQuestions.has(f.eq[0])) continue;
                const [slot, value] = f.eq;
                if (!this.givers.has(slot)) this.givers.set(slot, []);
                this.givers.get(slot).push({ claim: c.id, value });
            }
        }
        this.rulesOn = new Map();
        for (const r of model.data.rules ?? []) {
            for (const e of r.attaches_to ?? []) {
                if (!this.rulesOn.has(e)) this.rulesOn.set(e, []);
                this.rulesOn.get(e).push(r.id);
            }
        }
        // A clue brings the (often unseen) events it speaks of: that is where the open questions live.
        this.claimEvents = new Map();
        for (const c of model.data.claims ?? []) {
            const k = model.constraints.get(`k.${c.id}`);
            if (!k) continue;
            this.claimEvents.set(c.id, [...slotsIn(k.formula)].map((s) => model.slots.get(s)?.on).filter((o) => model.cards.get(o)?.section === 'events'));
        }
        // Trivial at Holmes's pace: what the narrator states outright (any slot, case questions too, never a
        // statement the case knows may be false), and where the story tells each of Holmes's deductions.
        this.statedBy = new Map();
        for (const c of model.data.claims ?? []) {
            if (c.derived || c.truth_slot || !c.asserts) continue;
            for (const f of c.asserts.and ?? [c.asserts]) {
                if (!f.eq) continue;
                if (!this.statedBy.has(f.eq[0])) this.statedBy.set(f.eq[0], []);
                this.statedBy.get(f.eq[0]).push({ claim: c.id, value: f.eq[1] });
            }
        }
        // Scenes start where their first quote is.
        this.sceneStarts = (model.data.scenes ?? []).map((sc) => this.story.find(sc.source?.[0] ?? '')?.para).filter((p) => p !== undefined).sort((a, b) => a - b);
        // Where each background fact becomes relevant: its `relevant_from` line, never before one of its cards.
        this.ruleAt = new Map();
        for (const r of model.data.rules ?? []) {
            const held = Math.min(...(r.attaches_to ?? []).map((e) => this.story.firstAt.get(e) ?? Infinity));
            this.ruleAt.set(r.id, Math.max(held, r.relevant_from ? this.#paraOf(r.relevant_from) : -1));
        }
        this.story.stepsBefore(0, model.data); // builds the gate map
        this.reset();
        if (state) this.load(state);
    }

    reset() {
        this.read = 1;                  // paragraphs [0, read) have been read; paragraph 0 is the title
        this.seq = 0;                   // discovery counter (the investigation axis)
        this.unlocked = new Map();      // card id → {para, at}
        this.items = new Set(this.model.data.case.starting_items ?? []);
        this.done = [];                 // Holmes's actions the text has reached
        this.told = [];                 // reasoning steps the story revealed before the player made them
        this.marks = new Map();         // slot id → {listed: Set|null, struck: Map value → {cited, used}|{}, proven}
        this.theories = [];
        this.lastSeen = new Map();      // card id → {read, seq} when the player last looked at it
        this.suspected = new Set();     // claim ids the player doubts
        this.asked = [];                // [card id, paragraph] the player asked about (background 'ask')
        if (this.background === BG_START) for (const r of this.model.data.rules ?? []) this.#unlock(r.id, 0);
        this.#process(0);
    }

    // ---------- persistence ----------
    save() {
        return {
            difficulty: this.difficulty,
            pace: this.pace,
            read: this.read,
            collected: this.difficulty === HARD ? [...this.unlocked].map(([id, u]) => [id, u.para]) : null,
            marks: [...this.marks].map(([slot, m]) => [slot, { listed: m.listed ? [...m.listed] : null, struck: [...m.struck], proven: m.proven }]),
            theories: this.theories,
            lastSeen: [...this.lastSeen],
            suspected: [...this.suspected],
            background: this.background,
            autoPace: this.autoPace,
            asked: this.asked,
            version: 3,
        };
    }

    load(state) {
        if (state.difficulty && !state.version) state = { ...state, difficulty: OLD_DIFFICULTY[state.difficulty] ?? state.difficulty };
        this.difficulty = state.difficulty ?? this.difficulty;
        this.pace = state.pace ?? this.pace;
        this.background = state.background ?? BACKGROUND_DEFAULTS[this.difficulty];
        this.autoPace = state.autoPace ?? this.autoPace;
        this.reset();
        const target = Math.min(state.read ?? 1, this.story.paragraphs.length);
        const asked = [...(state.asked ?? [])].sort((a, b) => a[1] - b[1]);
        while (this.read < target) {
            this.#readNext();
            while (asked.length && asked[0][1] < this.read) this.ask(asked.shift()[0]);
        }
        if (this.difficulty === HARD) for (const [id, para] of state.collected ?? []) this.#unlock(id, para);
        for (const [slot, m] of state.marks ?? []) {
            if (!this.model.slots.has(slot)) continue;
            this.marks.set(slot, { listed: m.listed ? new Set(m.listed) : null, struck: new Map(m.struck), proven: m.proven });
        }
        this.theories = state.theories ?? [];
        this.lastSeen = new Map(state.lastSeen ?? []);
        this.suspected = new Set((state.suspected ?? []).filter((id) => this.model.claimForms.has(id)));
    }

    // ---------- doubt ----------
    /** Any claim the player holds can be doubted. Its question "Is it true?" opens, and it stops counting as fact. */
    canSuspect(id) { return this.knows(id) && this.model.claimForms.has(id); }
    suspect(id) { if (this.canSuspect(id)) this.suspected.add(id); }
    unsuspect(id) { this.suspected.delete(id); }
    isSuspected(id) { return this.suspected.has(id); }

    /** The doubted claims a proof's constraints trusted: the proof no longer stands. */
    lapsedBy(used) {
        return (used ?? []).map((k) => trustedClaim(this.model, k)).filter((c) => c && this.suspected.has(c));
    }

    /** The claims a proof takes on trust (those someone in the story told, rather than the narrator). */
    restsOn(used) {
        return (used ?? []).map((k) => trustedClaim(this.model, k)).filter((c) => c && (this.model.cards.get(c).attested ?? []).some((a) => ['testimony', 'admission', 'report', 'inference'].includes(a.via)));
    }

    // ---------- reading ----------
    finished() { return this.read >= this.story.paragraphs.length; }

    /** Reasoning steps the next paragraph waits for, not yet made. */
    blockers() {
        if (this.finished()) return [];
        return this.story.stepsBefore(this.read, this.model.data).filter((s) => !this.stepMade(s));
    }

    /** The action the next paragraph shows Holmes doing, if any (labels the read-on button). */
    nextAction() {
        return this.actions.find((a) => this.story.anchors.actions.get(a.id) === this.read) ?? null;
    }

    advance() {
        if (this.finished()) return { ok: false, end: true };
        const blocking = this.blockers();
        if (blocking.length && this.pace === WAIT) return { ok: false, needs: blocking };
        this.told.push(...blocking);
        const before = new Set(this.unlocked.keys());
        this.#readNext();
        return { ok: true, para: this.read - 1, newCards: [...this.unlocked.keys()].filter((k) => !before.has(k)) };
    }

    /** The first paragraph of the next scene, or the end. */
    nextSceneAt() {
        return this.sceneStarts.find((p) => p > this.read) ?? this.story.paragraphs.length;
    }

    /** Read on until paragraph `target` is the next to read (stopping early where the story waits). */
    readTo(target) {
        const newCards = [];
        let read = 0;
        while (this.read < target) {
            const res = this.advance();
            if (!res.ok) return { read, newCards, stopped: res };
            read++;
            newCards.push(...res.newCards);
        }
        return { read, newCards };
    }

    readToNextScene() { return this.readTo(this.nextSceneAt()); }

    /** The paragraph just before Holmes's next deduction (where the story would wait for it), or the end. */
    nextDeductionAt() {
        const ahead = [...(this.story.gates?.keys() ?? [])].filter((p) => p > this.read).sort((a, b) => a - b);
        return ahead[0] ?? this.story.paragraphs.length;
    }

    /**
     * Read on to just before Holmes's next deduction, so the player can try it first. Stops early where the
     * story waits (the 'wait' pace). Returns how many paragraphs were read and the cards they brought.
     */
    readToNextDeduction() { return this.readTo(this.nextDeductionAt()); }

    #readNext() {
        const p = this.read;
        this.read++;
        this.#process(p);
    }

    #process(p) {
        if (this.background === BG_RELEVANT) for (const [r, at] of this.ruleAt) if (at === p) this.#unlock(r, p);
        // Asked about already: the card recalls each further fact as the story reaches its subject.
        if (this.background === BG_ASK) {
            for (const [card] of this.asked) for (const r of this.rulesOn.get(card) ?? []) if (this.ruleAt.get(r) === p) this.#unlock(r, p);
        }
        for (const a of this.actions) {
            if (this.story.anchors.actions.get(a.id) !== p) continue;
            this.done.push(a.id);
            for (const i of a.yields?.items ?? []) this.items.add(i);
        }
        if (this.difficulty !== HARD) for (const s of this.story.spans[p]) for (const id of s.ids) this.#unlock(id, p);
        // The story is about to wait on a deduction: the card that holds its question is dealt now.
        for (const id of this.story.gates?.get(p + 1) ?? []) {
            const c = this.routeById.get(id).concludes;
            this.#unlock(this.model.slots.get(c.slot ?? c.formula.eq[0])?.on, p);
        }
    }

    /** Hard mode: the player clicked text in paragraph `para` covering these ids. Returns the newly collected. */
    collect(para, ids) {
        if (para >= this.read) return [];
        const before = new Set(this.unlocked.keys());
        for (const id of ids) this.#unlock(id, para);
        return [...this.unlocked.keys()].filter((k) => !before.has(k));
    }

    #unlock(id, para) {
        const c = this.model.cards.get(id);
        if (!c || this.unlocked.has(id)) return;
        this.unlocked.set(id, { para, at: this.seq++ });
        if (c.section === 'claims') for (const e of this.claimEvents.get(id) ?? []) this.#unlock(e, para);
    }

    // ---------- background ----------
    /** Can the player ask what they know about this card? (Background 'ask': any card they hold.) */
    canAsk(id) {
        const c = this.model.cards.get(id);
        return this.background === BG_ASK && this.knows(id) && (c.section === 'entities' || c.section === 'events');
    }

    hasAsked(id) { return this.asked.some(([x]) => x === id); }

    /**
     * "What do I know about this?" Recalls the background facts about the card whose subject the story has
     * reached (as 'relevant' would show them); from then on the card goes on recalling the rest as the story
     * reaches them, without asking again. Returns the newly recalled.
     */
    ask(id) {
        if (!this.canAsk(id)) return [];
        if (!this.hasAsked(id)) this.asked.push([id, this.read - 1]);
        const got = (this.rulesOn.get(id) ?? []).filter((r) => !this.knows(r) && this.ruleAt.get(r) < this.read);
        for (const r of got) this.#unlock(r, this.read - 1);
        return got;
    }

    knows(cardId) { return this.unlocked.has(cardId); }
    known() { return new Set(this.unlocked.keys()); }

    questionRaised(qid) {
        const p = this.story.anchors.questions.get(qid);
        return p !== undefined && p < this.read;
    }

    /** A reasoning step counts as made once the player has proved its conclusion. */
    stepMade(stepId) {
        const step = this.routeById.get(stepId);
        if (!step) return false;
        const c = step.concludes;
        if (c.slot) {
            if (this.isStruckWithProof(c.slot, c.value)) return true;
            const v = this.settled(c.slot);
            return v !== null && v !== c.value;
        }
        const f = c.formula ?? this.model.cards.get(c.claim)?.asserts;
        return this.#entailedBySettled(f);
    }

    // ---------- what is known about a card, and when it was learned ----------
    #paraOf(quote) {
        if (!this.paraCache) this.paraCache = new Map();
        if (!this.paraCache.has(quote)) this.paraCache.set(quote, this.story.find(quote)?.para ?? Infinity);
        return this.paraCache.get(quote);
    }

    /** Glosses on a card: with its first mention, or once the reader reaches the gloss's `after` quote. */
    #glossesOn(id, first) {
        const out = [];
        for (const g of this.model.data.glosses ?? []) {
            if (!g.attaches_to.includes(id)) continue;
            const para = g.after ? Math.max(first, this.#paraOf(g.after)) : first;
            if (para < this.read) out.push({ key: g.id, para, kind: 'background', term: g.term, text: g.text, editorial: true });
        }
        return out;
    }

    /**
     * Everything the player has learned about a card, as dated pieces, oldest first:
     * {key, para, kind: 'intro'|'background'|'note'|'clue', text, ...where it came from}.
     * The first mention brings the intro and the background; every later piece is only the new information,
     * with the paragraph and the witness or document it came from.
     */
    info(id) {
        const c = this.model.cards.get(id);
        if (!c || !this.knows(id)) return [];
        const first = this.story.firstAt.get(id) ?? this.unlocked.get(id).para;
        const out = [];
        // What the story said where it first mentions the card: never more than the story has told.
        const said = this.story.firstSentence(id);
        if (said) out.push({ key: 'mention', para: first, kind: 'mention', text: said.text });
        // Later names (and, for events, later descriptions), each from the line of the story that gives it.
        (c.names ?? c.labels ?? []).forEach((n, i) => {
            if (i === 0 || n.editorial) return;
            const para = Math.max(first, this.#paraOf(n.source[0]));
            const hit = this.story.find(n.source[0]);
            const quote = hit ? this.story.sentenceAround(hit.para, hit.start, hit.end) : n.source[0];
            if (para < this.read) out.push({ key: `name${i}`, para, kind: 'name', text: n.name ?? n.label, quote, event: c.section === 'events' });
        });
        if (c.section === 'entities') {
            out.push(...this.#glossesOn(id, first));
            for (const r of this.rulesOn.get(id) ?? []) {
                if (this.knows(r)) out.push({ key: r, para: Math.max(first, this.unlocked.get(r).para), kind: 'background', text: this.model.cards.get(r).text, card: r });
            }
            (c.notes ?? []).forEach((n, i) => {
                const para = Math.max(first, this.#paraOf(n.source[0]));
                if (para < this.read) out.push({ key: `note${i}`, para, kind: 'note', text: n.text, quote: n.source[0] });
            });
        }
        if (c.section !== 'entities') out.push(...this.#glossesOn(id, first));
        for (const k of this.model.data.claims ?? []) {
            if (k.derived || !this.knows(k.id) || k.id === id) continue;
            const relevant = (k.about ?? []).includes(id) || (this.claimEvents.get(k.id) ?? []).includes(id);
            if (!relevant) continue;
            k.attested.forEach((a, i) => {
                const para = this.#paraOf(a.source[0]);
                if (para < this.read) out.push({ key: `${k.id}#${i}`, para, kind: 'clue', claim: k.id, text: k.text, via: a.via, by: a.by, to: a.to, quote: a.source[0], at: this.unlocked.get(k.id).at });
            });
        }
        if (c.section === 'claims') {
            c.attested.forEach((a, i) => {
                const para = this.#paraOf(a.source[0]);
                if (para < this.read) out.push({ key: `att${i}`, para, kind: 'attestation', via: a.via, by: a.by, to: a.to, quote: a.source[0] });
            });
        }
        return out.sort((a, b) => a.para - b.para);
    }

    /**
     * The name a card goes by now: the latest of its `names` (entities) or `labels` (events) whose line of the
     * story has been read. Never the case's own `name`/`label`, which may know more than the reader does.
     */
    nameOf(id) {
        const c = this.model.cards.get(id);
        if (!c) return id;
        if (c.section === 'claims' || c.section === 'rules') return c.text;
        if (c.section === 'glosses') return c.term;
        const list = c.names ?? c.labels ?? [];
        let cur = list[0];
        for (const n of list) if (n.editorial || this.#paraOf(n.source[0]) < this.read) cur = n;
        return cur ? cur.name ?? cur.label : id;
    }

    /**
     * Fill a question's {card} placeholders with what the story calls each card so far ("Who killed {straker}?"
     * reads "Who killed the trainer?" until the story names him). A leading article is lower-cased mid-sentence.
     */
    phrase(template) {
        return template.replace(/\{([a-z0-9_.]+)\}/g, (m, id, at) => {
            const name = this.nameOf(id);
            return at > 0 ? name.replace(/^(The|A|An) /, (a) => a.toLowerCase()) : name;
        });
    }

    questionText(q) { return this.phrase(q.text); }
    promptOf(slotId) { return this.phrase(this.model.slots.get(slotId).prompt); }

    /** Has this piece arrived since the player last looked at the card? */
    isNew(id, item) {
        const seen = this.lastSeen.get(id);
        if (!seen) return true;
        if (item.para >= seen.read) return true;
        return item.at !== undefined && item.at >= seen.seq;
    }

    hasNew(id) {
        return !this.lastSeen.has(id) || this.info(id).some((it) => this.isNew(id, it));
    }

    markSeen(id) {
        this.lastSeen.set(id, { read: this.read, seq: this.seq });
    }

    // ---------- slots ----------
    /**
     * A question shows only once the story has raised it: it belongs to an event the player holds, asks who a
     * placeholder really is, asks whether a held statement is true, is spoken of by a held clue, is a case
     * question the story has raised, or Holmes has reached the point where he settles it.
     */
    slotVisible(slotId) {
        const s = this.model.slots.get(slotId);
        if (!s || !this.knows(s.on)) return false;
        const owner = this.model.cards.get(s.on);
        // An event's own facets (who, what, where, when) show with it; a question declared on it (why was it done?)
        // waits, like any other, until the story raises it.
        const declared = this.declaredSlots ?? (this.declaredSlots = new Set((this.model.data.slots ?? []).map((x) => x.id)));
        if ((owner.section === 'events' && !declared.has(slotId)) || (owner.section === 'claims' && s.facet !== 'truth') || s.facet === 'identity') return true;
        if (!this.slotRaisers) {
            this.slotRaisers = new Map();
            const add = (slot, test) => {
                if (!this.slotRaisers.has(slot)) this.slotRaisers.set(slot, []);
                this.slotRaisers.get(slot).push(test);
            };
            // A held clue raises what it speaks of, except what it simply fills in (that shows once it is doubted:
            // "he is an honest servant" asks nothing until the player wonders whether he was).
            for (const c of this.model.data.claims ?? []) {
                if (c.derived || !c.asserts) continue;
                add(`${c.id}.truth`, () => this.suspected.has(c.id));
                const fills = new Set((c.asserts.and ?? [c.asserts]).filter((f) => f.eq).map((f) => f.eq[0]));
                for (const x of slotsIn(c.asserts)) add(x, fills.has(x) ? () => this.knows(c.id) && this.suspected.has(c.id) : () => this.knows(c.id));
            }
            for (const q of this.model.data.questions ?? []) add(q.slot, () => this.questionRaised(q.id));
            for (const [para, steps] of this.story.gates ?? new Map()) {
                for (const id of steps) {
                    const c = this.routeById.get(id).concludes;
                    add(c.slot ?? c.formula?.eq?.[0], () => para <= this.read);
                }
            }
        }
        return (this.slotRaisers.get(slotId) ?? []).some((t) => t());
    }

    visibleSlots() { return [...this.model.slots.values()].filter((s) => this.slotVisible(s.id)); }
    slotsOn(cardId) { return [...this.model.slots.values()].filter((s) => s.on === cardId && this.slotVisible(s.id)); }

    /** A listed answer must be something the story has already put in front of the player. */
    offered(slot, v) {
        const s = this.model.slots.get(slot);
        // A time window is an answer only once the story has reached it (its `reveal` line): its very label can
        // describe what happened ("after 1 a.m. — the blow").
        const w = this.windowById?.get(v) ?? (this.windowById = new Map(this.model.windows.map((x) => [x.id, x]))).get(v);
        if (w?.reveal && this.#paraOf(w.reveal) >= this.read) return false;
        if (s.reveal?.[v]) {
            if (!this.revealCache) this.revealCache = new Map();
            const key = `${slot}|${v}`;
            if (!this.revealCache.has(key)) this.revealCache.set(key, this.story.find(s.reveal[v])?.para ?? Infinity);
            if (this.revealCache.get(key) >= this.read) return false;
        }
        return v === s.on || !this.model.cards.has(v) || this.knows(v);
    }

    #mark(slot) {
        if (!this.marks.has(slot)) this.marks.set(slot, { listed: this.difficulty === HARD ? new Set() : null, struck: new Map(), proven: null });
        return this.marks.get(slot);
    }

    /** The values the player is still considering for a slot. */
    pencil(slot) {
        const m = this.marks.get(slot);
        if (this.provenValue(slot) !== null) return [this.provenValue(slot)];
        if (this.difficulty === TRIVIAL) return this.trivialValues(slot).filter((v) => this.offered(slot, v));
        const g = this.given(slot);
        if (g) return [g.value];
        const s = this.model.slots.get(slot);
        const base = m?.listed ? [...m.listed] : this.difficulty === HARD ? [] : s.domain;
        // Never list a card the story has not shown the player yet: that would give it away.
        return base.filter((v) => (!m?.struck.has(v) || this.strikeLapsed(slot, v)) && this.offered(slot, v));
    }

    /** Hard mode: propose a candidate. Refused when it is the wrong kind of thing for the slot. */
    addCandidate(slot, value) {
        if (!this.shapeFits(slot, value)) return { ok: false, why: 'shape' };
        if (!this.offered(slot, value)) return { ok: false, why: 'unknown' };
        const m = this.#mark(slot);
        if (!m.listed) m.listed = new Set();
        m.listed.add(value);
        return { ok: true };
    }

    removeCandidate(slot, value) {
        this.marks.get(slot)?.listed?.delete(value);
    }

    /** Cross a value out. Outside Trivial, it must come with cited evidence the game accepts. */
    strike(slot, value, cited = null) {
        const m = this.#mark(slot);
        if (!cited || !cited.length) {
            if (!this.assisted()) return { ok: false, reason: 'cite the evidence that rules it out' };
            m.struck.set(value, {});
            return { ok: true, proof: false };
        }
        const res = this.checkElimination(slot, value, cited);
        if (res.ok) m.struck.set(value, { cited, used: res.used });
        return { ...res, proof: res.ok };
    }

    unstrike(slot, value) { this.marks.get(slot)?.struck.delete(value); }
    isStruckWithProof(slot, value) {
        const st = this.marks.get(slot)?.struck.get(value);
        return !!st?.cited && !this.lapsedBy(st.used).length;
    }
    /** Struck with a proof that rested on a claim the player has since doubted. */
    strikeLapsed(slot, value) {
        const st = this.marks.get(slot)?.struck.get(value);
        return !!st?.cited && this.lapsedBy(st.used).length > 0;
    }
    provenValue(slot) {
        const p = this.marks.get(slot)?.proven;
        return p && !this.lapsedBy(p.used).length ? p.value : null;
    }
    proofLapsed(slot) {
        const p = this.marks.get(slot)?.proven;
        return !!p && this.lapsedBy(p.used).length > 0;
    }

    /** Prove a value outright: the cited cards must leave nothing else possible. */
    prove(slot, value, cited) {
        const res = this.checkConclusion({ eq: [slot, value] }, cited);
        if (res.ok) this.#mark(slot).proven = { value, cited, used: res.used };
        return res;
    }

    unprove(slot) {
        const m = this.marks.get(slot);
        if (m) m.proven = null;
    }

    /** Trusted claims that fill this slot with something other than what the player proved. */
    givenClash(slot) {
        const v = this.provenValue(slot);
        if (v === null) return [];
        return (this.givers.get(slot) ?? []).filter((g) => this.knows(g.claim) && !this.suspected.has(g.claim) && g.value !== v).map((g) => g.claim);
    }

    /** The held clue that hands this slot its value, if any. */
    given(slot) {
        return (this.givers.get(slot) ?? []).find((g) => this.knows(g.claim) && !this.suspected.has(g.claim)) ?? null;
    }

    /** Settled = given by a clue, proven, or every other value struck with a proof. */
    settled(slot) {
        // A proof outranks a given: when they disagree, the player is shown the clash (givenClash).
        if (this.provenValue(slot) !== null) return this.provenValue(slot);
        if (this.difficulty === TRIVIAL) {
            const left = this.trivialValues(slot);
            return left.length === 1 ? left[0] : null;
        }
        const g = this.given(slot);
        if (g) return g.value;
        const s = this.model.slots.get(slot);
        const left = s.domain.filter((v) => !this.isStruckWithProof(slot, v));
        return left.length === 1 ? left[0] : null;
    }

    // ---------- checking ----------
    #citable(cited) {
        const bad = cited.filter((c) => !this.knows(c));
        return bad.length ? { ok: false, reason: `not yet found: ${bad.join(', ')}` } : null;
    }

    checkElimination(slot, value, cited) {
        return this.#citable(cited) ?? checkStep(this.model, cited, { slot, value }, this.suspected);
    }

    checkConclusion(formula, cited) {
        return this.#citable(cited) ?? checkStep(this.model, cited, { formula }, this.suspected);
    }

    shapeFits(slot, value) { return this.model.slots.get(slot).domain.includes(value); }

    /** Could `value` fill `slot`? Trivial checks the held clues; Easy and Hard only the type. */
    plausible(slot, value) {
        if (!this.shapeFits(slot, value)) return { plausible: false, why: 'shape' };
        if (!this.assisted()) return { plausible: true, why: 'shape only' };
        const active = this.activeConstraints();
        if (this.model.problem.consistent(active, { [slot]: value }, { focus: true }).ok) return { plausible: true };
        return { plausible: false, why: 'clues', conflict: this.model.problem.explainConflict(active, { [slot]: value }) };
    }

    /** Trivial and Easy: the game helps (lists what the clues allow, or does it outright). */
    assisted() { return this.difficulty === TRIVIAL || this.difficulty === EASY; }

    /**
     * Trivial: every value the held clues allow, read the way the case reads them (a statement the case knows to
     * be false is not taken at its word), so nothing misleads. Cached until the player holds more.
     */
    autoValues(slot) {
        const key = this.unlocked.size;
        if (this.autoKey !== key) {
            // Everything at once: one pass per group of linked questions is far cheaper than one per question.
            this.autoKey = key;
            const active = activeConstraints(this.model, this.known()).filter((id) => !this.model.constraints.get(id).derived);
            this.autoCache = this.model.problem.allCandidates(active, [...this.model.slots.keys()]);
        }
        return this.autoCache.get(slot) ?? this.model.slots.get(slot).domain;
    }

    /** Trivial: what is still possible, at the chosen pace. */
    trivialValues(slot) {
        if (this.autoPace === AUTO_LOGIC) return this.autoValues(slot);
        return this.slotDomain(slot).filter((v) => !this.holmesReasons(slot, v).length);
    }

    slotDomain(slot) { return this.model.slots.get(slot).domain; }

    /** A deduction counts as made once the story has told it. */
    stepTold(stepId) {
        const at = this.story.anchors.steps.get(stepId) ?? [...(this.story.gates ?? [])].find(([, ids]) => ids.has(stepId))?.[0];
        return at !== undefined && at < this.read;
    }

    /**
     * Trivial at Holmes's pace: what rules `value` out so far — a held statement of the narrator's that gives the
     * slot another value ({claim}), or a deduction of Holmes's the story has told that excludes it ({step}).
     */
    holmesReasons(slot, value) {
        const out = [];
        for (const g of this.statedBy.get(slot) ?? []) if (this.knows(g.claim) && g.value !== value) out.push({ claim: g.claim });
        for (const step of this.model.data.route ?? []) {
            const c = step.concludes;
            if (!this.stepTold(step.id)) continue;
            if (c.slot === slot && c.value === value) out.push({ step: step.id });
            else if (c.formula && evaluate(c.formula, new Map([[slot, value]]), this.model.timeOrder) === false) out.push({ step: step.id });
        }
        return out;
    }

    /**
     * Trivial: why a value is ruled out. At Holmes's pace: the statements and told deductions that exclude it; as
     * soon as the clues allow: the fewest held clues that exclude it (the case's reading). Returns [{text}].
     */
    whyNot(slot, value) {
        if (this.autoPace === AUTO_HOLMES) {
            return this.holmesReasons(slot, value).map((r) => (r.claim
                ? { text: `The story says: ${this.model.cards.get(r.claim).text}` }
                : { text: `Holmes: “${(this.routeById.get(r.step).source?.[0] ?? '').replace(/\s+/g, ' ')}”` }));
        }
        const active = activeConstraints(this.model, this.known()).filter((id) => !this.model.constraints.get(id).derived);
        return (this.model.problem.explainConflict(active, { [slot]: value }) ?? []).map((k) => ({ text: this.model.constraints.get(k).label }));
    }

    /** Easy's automatic list: every value the held clues still allow (as the player reads them). */
    openValues(slot) {
        return this.model.problem.candidates(this.activeConstraints(), slot);
    }

    activeConstraints() {
        return activeConstraints(this.model, this.known(), this.suspected).filter((id) => !this.model.constraints.get(id).derived);
    }

    /** Clues the player trusts that cannot all be true (a minimal set), or null. Trivial shows it. */
    contradiction() {
        return this.model.problem.explainConflict(this.activeConstraints());
    }

    #entailedBySettled(formula) {
        if (!formula) return false;
        const fixed = {};
        for (const s of this.model.slots.keys()) {
            if (!this.marks.has(s) && !this.givers.has(s)) continue;
            const v = this.settled(s);
            if (v !== null) fixed[s] = v;
        }
        return !this.model.problem.consistent([], fixed, { extra: [{ not: formula }] }).ok;
    }

    // ---------- theories ----------
    addTheory(label, assignment = {}) {
        const id = `t.player_${Date.now().toString(36)}`;
        this.theories.push({ id, label, assignment });
        return id;
    }

    checkTheory(theory) {
        const conflict = this.model.problem.explainConflict(this.activeConstraints(), theory.assignment);
        return { fits: !conflict, conflict };
    }

    // ---------- the three time axes ----------
    /** Fabula: events the player holds, with their time if settled. */
    fabula() {
        return (this.model.data.events ?? []).filter((e) => this.knows(e.id)).map((e) => {
            const slot = `${e.id}.time`;
            const has = this.model.slots.has(slot);
            return { event: e, slot: has ? slot : null, settled: has ? this.settled(slot) : null, pencil: has ? this.pencil(slot) : [] };
        });
    }

    /** Investigation: cards in the order the player collected them, with the paragraph they came from. */
    investigation() {
        return [...this.unlocked].sort((a, b) => a[1].at - b[1].at).map(([id, u]) => ({ id, ...u }));
    }

    /** Disclosure: the paragraph where the story first mentions a card. */
    disclosure(cardId) {
        const c = this.model.cards.get(cardId);
        if (c?.section === 'rules') return this.ruleAt.get(cardId);
        return this.story.firstAt.get(cardId) ?? null;
    }
}

function slotsIn(f, out = new Set()) {
    for (const [op, a] of Object.entries(f)) {
        if (['eq', 'ne', 'in', 'nin'].includes(op)) out.add(a[0]);
        else if (['same', 'diff'].includes(op)) { out.add(a[0]); out.add(a[1]); }
        else if (['before', 'not_after'].includes(op)) for (const x of a) { if (typeof x === 'string') out.add(x); }
        else if (op === 'and' || op === 'or') for (const g of a) slotsIn(g, out);
        else if (op === 'not') slotsIn(a, out);
        else if (op === 'implies') { slotsIn(a[0], out); slotsIn(a[1], out); }
    }
    return out;
}
