// Player state and the game's questions, on top of a case model (caseModel.js + story.js).
//
// Reading: the story advances one paragraph at a time. Holmes's actions happen as the text reaches them. With
//   the 'wait' pace, a paragraph where Holmes acts on (or announces) a deduction cannot be read until the
//   player holds the inferences that deduction needs.
// Collecting: in Trivial, Easy and Medium, every card mentioned in a paragraph is collected as it is read. In
//   Hard, a card is collected only when the player clicks the text that mentions it.
// Inferences: reasoning that connects clues. The player builds them from cards (propose), hears characters
//   state them (Holmes's where the story tells his step), or, in Trivial, is given them. Held inferences count
//   like trusted clues until doubted.
// Connecting: every visible slot has candidates.
//   Trivial: the game settles questions itself.
//   Easy: every answer listed, the ones the held clues and inferences rule out greyed; plain pencil cross-outs.
//   Medium: every answer listed; a cross-out is checked against everything held and trusted.
//   Hard: the player proposes candidates first (only their type is checked); cross-outs are checked.
// Background facts (rule cards) sit on the entity cards they belong to and arrive with them.
// Scoring: Holmes's steps are the annotated reading's thoughts (engine/steps.js); one the player makes by their own
//   reasoning before the paragraph where Holmes states it scores (thoughtScores, score).

import { activeConstraints, trustedClaim, instantiateRule, addDynamic, removeDynamic, openState, closeState, openSplit, closeSplit, knowsName } from './caseModel.js';
import { evaluate, render, slotsOf } from './logic.js';
import * as TL from './timeline.js';

/** Holmes's steps' needs (Game.stepNeeds), per problem. */
const STEP_NEEDS = new WeakMap();

// Difficulty is a set of OPTIONS; the four difficulties are presets of them, and any other mix is CUSTOM.
// TRIVIAL: the game works out what the held clues allow and settles questions itself; the player reads and
// watches. EASY: every answer is listed and the ones the player's clues rule out are greyed; plain pencil
// cross-outs. MEDIUM: every answer listed; a cross-out must follow from what the player holds. HARD: cards are
// collected by clicking the text, the player proposes the answers, and names what each inference is about.
export const TRIVIAL = 'trivial';
export const EASY = 'easy';
export const MEDIUM = 'medium';
export const HARD = 'hard';
export const CUSTOM = 'custom';
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
// Building an inference: are its background premises connected like its clues, or only needed in hand?
export const INF_IMPLICIT = 'implicit';
export const INF_CONNECT = 'connect';
// The difficulty options, each with its values (the first is the easiest).
//   solver      who works out the answers: the game (Trivial) or the player
//   cards       dealt as the story mentions them, or collected by clicking the words
//   answers     every possible answer listed, or the player proposes them
//   crossOut    pencil: anything can be crossed out; checked: only what the player's clues rule out
//   greying     grey the answers the player's clues rule out, and offer "Could it fit?" (and theory checks)
//   clashes     list the clashes among the player's clues on the Questions tab
//   hints       count the inferences left to build, and name where a waiting deduction starts
//   kind        building an inference: the player names what its conclusion is about
//   connect     building an inference: background facts needed in hand, or connected like clues
//   background  when background facts arrive (BG_*)
//   irrelevant  how many of the cards the solution has no use for are shown at all
export const OPTIONS = {
    solver: ['game', 'player'],
    cards: ['dealt', 'collect'],
    answers: ['listed', 'propose'],
    crossOut: ['pencil', 'checked'],
    greying: ['on', 'off'],
    clashes: ['on', 'off'],
    hints: ['on', 'off'],
    kind: ['off', 'on'],
    connect: [INF_IMPLICIT, INF_CONNECT],
    background: [BG_START, BG_RELEVANT, BG_ASK],
    irrelevant: ['none', 'few', 'half', 'most', 'all'],
};
// The options that only mean something while the player works out the answers.
export const PLAYER_OPTIONS = ['answers', 'crossOut', 'greying', 'clashes', 'hints', 'kind', 'connect'];
const IRRELEVANT_SHARE = { none: 0, few: 0.25, half: 0.5, most: 0.75, all: 1 };
export const PRESETS = {
    trivial: { solver: 'game', cards: 'dealt', answers: 'listed', crossOut: 'pencil', greying: 'on', clashes: 'on', hints: 'on', kind: 'off', connect: INF_IMPLICIT, background: BG_RELEVANT, irrelevant: 'all' },
    easy: { solver: 'player', cards: 'dealt', answers: 'listed', crossOut: 'pencil', greying: 'on', clashes: 'on', hints: 'on', kind: 'off', connect: INF_IMPLICIT, background: BG_RELEVANT, irrelevant: 'all' },
    medium: { solver: 'player', cards: 'dealt', answers: 'listed', crossOut: 'checked', greying: 'off', clashes: 'off', hints: 'off', kind: 'off', connect: INF_IMPLICIT, background: BG_ASK, irrelevant: 'all' },
    hard: { solver: 'player', cards: 'collect', answers: 'propose', crossOut: 'checked', greying: 'off', clashes: 'off', hints: 'off', kind: 'on', connect: INF_CONNECT, background: BG_ASK, irrelevant: 'all' },
};
/** The preset these options match, or CUSTOM. With the game solving, the player's options do not count. */
export function presetOf(opts) {
    const applies = (k) => opts.solver === 'player' || !PLAYER_OPTIONS.includes(k);
    return DIFFICULTIES.find((d) => Object.keys(OPTIONS).every((k) => !applies(k) || PRESETS[d][k] === opts[k])) ?? CUSTOM;
}
/** Options from a preset, with any given ones laid over it (unknown keys and values dropped). */
export function optionsFrom(difficulty, over = {}) {
    const out = { ...PRESETS[DIFFICULTIES.includes(difficulty) ? difficulty : MEDIUM] };
    for (const [k, v] of Object.entries(over ?? {})) if (OPTIONS[k]?.includes(v)) out[k] = v;
    return out;
}
// What an inference is about, by the facets its conclusion speaks of (Hard asks the player to name it).
export const CONCLUSION_KINDS = { who: 'Who', when: 'When', where: 'Where', what: 'What or with what', why: 'Why', whether: 'Whether it is so' };
const KIND_OF_FACET = {
    agent: 'who', patient: 'who', recipient: 'who', identity: 'who', owner: 'who',
    time: 'when', place: 'where', whereabouts: 'where', object: 'what', instrument: 'what', contents: 'what',
    purpose: 'why', motive: 'why', truth: 'whether', state: 'whether', character: 'whether',
};
// Saves made before Medium existed: their 'trivial' is today's Easy, their 'easy' today's Medium.
const OLD_DIFFICULTY = { trivial: EASY, easy: MEDIUM, hard: HARD };

export class Game {
    constructor(model, { difficulty = MEDIUM, options = null, pace = FREE, background = null, autoPace = AUTO_HOLMES, connect = null, state = null } = {}) {
        this.model = model;
        this.story = model.story;
        this.opts = optionsFrom(difficulty, { ...options, ...(background && { background }), ...(connect && { connect }) });
        this.pace = pace;
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
            const asserts = model.cards.get(c.id)?.asserts;
            if (c.derived || !asserts) continue;
            for (const f of asserts.and ?? [asserts]) {
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
            this.claimEvents.set(c.id, this.#spokenOf(k.formula));
        }
        // Trivial at Holmes's pace: what the narrator states outright (any slot, case questions too, never a
        // statement the case knows may be false), and where the story tells each of Holmes's deductions.
        this.statedBy = new Map();
        for (const c of model.data.claims ?? []) {
            const asserts = model.cards.get(c.id)?.asserts;
            if (c.derived || c.truth_slot || !asserts) continue;
            for (const f of asserts.and ?? [asserts]) {
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
        // ---- inferences ----
        this.inferences = model.data.constraints ?? [];
        this.inferenceById = new Map(this.inferences.map((k) => [k.id, k]));
        this.inferencesUsing = new Map();
        for (const k of this.inferences) for (const p of k.premises) {
            if (!this.inferencesUsing.has(p)) this.inferencesUsing.set(p, []);
            this.inferencesUsing.get(p).push(k.id);
        }
        // Where a character states an inference (its `stated` quotes): it arrives there by itself.
        this.statedAt = new Map();
        const stateAt = (para, id, by) => {
            if (para === Infinity || para === undefined) return;
            if (!this.statedAt.has(para)) this.statedAt.set(para, []);
            this.statedAt.get(para).push({ id, by });
        };
        for (const k of this.inferences) for (const st of k.stated ?? []) stateAt(this.#paraOf(st.source[0]), k.id, st.by);
        // Holmes's steps: the inferences each one needs (a fewest set, among those resting on the step's own
        // premises), stated by Holmes where the story tells the step, and what 'wait' waits for.
        // They depend on the case's constraints alone, so they are kept with the problem they were found on (set
        // once complete: a check handed to the solver's worker comes back here to fill it).
        this.stepNeeds = STEP_NEEDS.get(model.problem);
        if (!this.stepNeeds) {
            this.stepNeeds = new Map((model.data.route ?? []).map((step) => [step.id, this.#inferencesFor(step)]));
            STEP_NEEDS.set(model.problem, this.stepNeeds);
        }
        for (const step of model.data.route ?? []) {
            const needs = this.stepNeeds.get(step.id);
            // Only Holmes's own steps are his to state (a thought's inference by Watson or Gregory is not).
            if (step.reasoner !== 'holmes') continue;
            const at = [...(this.story.gates ?? [])].find(([, ids]) => ids.has(step.id))?.[0] ?? this.story.anchors.steps.get(step.id);
            for (const id of needs ?? []) stateAt(at, id, 'holmes');
        }
        for (const k of this.inferences) this.claimEvents.set(k.id, this.#spokenOf(model.cards.get(k.id).formula));
        // An inference the game grants by itself waits for the story to deal the events it speaks of, so that it
        // never deals them early, and the entities it speaks of, so that it never names one the player has not
        // met: those cards are watched too.
        this.inferenceWaits = new Map(this.inferences.map((k) => [k.id, this.#spokenOf(model.cards.get(k.id).formula, true)]));
        for (const k of this.inferences) for (const e of this.inferenceWaits.get(k.id)) {
            if (!this.inferencesUsing.has(e)) this.inferencesUsing.set(e, []);
            if (!this.inferencesUsing.get(e).includes(k.id)) this.inferencesUsing.get(e).push(k.id);
        }
        this.dynamicIds = [];
        this.reset();
        if (state) this.load(state);
    }

    /** The preset the options match, or CUSTOM. */
    get difficulty() { return presetOf(this.opts); }
    get background() { return this.opts.background; }
    get connect() { return this.opts.connect; }
    /** The game works out the answers (Trivial). */
    autoSolves() { return this.opts.solver === 'game'; }
    collecting() { return this.opts.cards === 'collect'; }
    proposing() { return this.opts.answers === 'propose' && !this.autoSolves(); }
    /** Player's option `k` is 'on' (always off while the game solves). */
    helps(k) { return !this.autoSolves() && this.opts[k] === 'on'; }

    /** Left out of this game: a card the solution has no use for, beyond the share the player asked to see. */
    isHidden(id) { return this.hidden.has(id); }
    #hideIrrelevant() {
        const share = IRRELEVANT_SHARE[this.opts.irrelevant] ?? 1;
        this.hidden = new Set();
        if (share >= 1 || !this.model.relevant) return;
        for (const id of this.model.cards.keys()) {
            if (this.model.relevant.has(id) || this.model.cards.get(id).section === 'inferences') continue;
            // The same cards every time (a hash of the id), and a larger share keeps every card a smaller one did.
            let h = 2166136261;
            for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
            if ((h >>> 0) / 4294967296 >= share) this.hidden.add(id);
        }
    }

    reset() {
        this.#hideIrrelevant();
        this.read = 1;                  // paragraphs [0, read) have been read; paragraph 0 is the title
        this.seq = 0;                   // discovery counter (the investigation axis)
        this.unlocked = new Map();      // card id → {para, at}
        this.items = new Set(this.model.data.case.starting_items ?? []);
        this.done = [];                 // Holmes's actions the text has reached
        this.told = [];                 // reasoning steps the story revealed before the player made them
        this.marks = new Map();         // slot id → {listed: Set|null, struck: Map value → {cited, used}|{}, proven, circled: Set}
        this.theories = [];
        this.lastSeen = new Map();      // card id → {read, seq} when the player last looked at it
        this.suspected = new Set();     // claim ids the player doubts
        this.asked = [];                // [card id, paragraph] the player asked about (background 'ask')
        this.clashLog = [];             // every clash met (constraint ids), to show the ones a doubt resolved
        this.clashCache = null;
        this.inferenceHow = new Map();  // inference id → {how: 'built'|'stated'|'auto'|'implicit'|'applied'|'concluded', by?}
        // The player's own cards: applied rules and concluded inferences (format 0.3). Each is a card in the model.
        for (const id of this.dynamicIds ?? []) removeDynamic(this.model, id);
        this.dynamicIds = [];
        // The states the player opened go with their cards.
        for (const slot of this.openedStates ?? []) closeState(this.model, slot);
        this.openedStates = [];
        for (const [w, by] of [...(this.openedSplits ?? [])].reverse()) closeSplit(this.model, w, by);
        this.openedSplits = [];
        this.applied = [];              // [{id, rule, bind, para}]
        this.concluded = [];            // [{id, cited, formula, label, para}]
        // Scoring (Round 58): Holmes's step (a thought) id → the last paragraph read when the player first made it
        // by their own reasoning; checked before each paragraph and on request, after a move of the player's.
        this.madeAt = new Map();
        this.moved = false;
        this.board = TL.emptyBoard(); // the timeline: followed things, pencil marks, splits, events placed (timeline.js)
        if (this.background === BG_START) for (const r of this.model.data.rules ?? []) this.#unlock(r.id, 0);
        this.#process(0);
    }

    // ---------- persistence ----------
    save() {
        return {
            difficulty: this.difficulty,
            options: { ...this.opts },
            pace: this.pace,
            read: this.read,
            collected: this.collecting() ? [...this.unlocked].map(([id, u]) => [id, u.para]) : null,
            marks: [...this.marks].map(([slot, m]) => [slot, { listed: m.listed ? [...m.listed] : null, struck: [...m.struck], proven: m.proven, circled: [...m.circled] }]),
            theories: this.theories,
            lastSeen: [...this.lastSeen],
            suspected: [...this.suspected],
            autoPace: this.autoPace,
            asked: this.asked,
            clashLog: this.clashLog,
            built: [...this.inferenceHow].filter(([, h]) => h.how === 'built').map(([id]) => [id, this.unlocked.get(id).para]),
            applied: this.applied.map((a) => [a.id, a.rule, a.bind, a.para]),
            concluded: this.concluded.map((c) => [c.id, c.cited, c.formula, c.label, c.para]),
            made: [...this.#noteMade()],
            board: this.board,
            openedSplits: this.openedSplits,
            opened: this.openedStates.map((slot) => { const o = this.model.opened.find((x) => x.slot === slot); return [o.thing, o.name, o.window]; }),
            version: 7,
        };
    }

    load(state) {
        const board = state.board ? structuredClone(state.board) : null;
        if (state.difficulty && !state.version) state = { ...state, difficulty: OLD_DIFFICULTY[state.difficulty] ?? state.difficulty };
        // Saves before options (version < 4): a difficulty, with background and connect kept beside it.
        if (state.options) this.opts = optionsFrom(MEDIUM, state.options);
        else if (state.difficulty) this.opts = optionsFrom(state.difficulty, { background: state.background, connect: state.connect });
        this.pace = state.pace ?? this.pace;
        this.autoPace = state.autoPace ?? this.autoPace;
        this.reset();
        const target = Math.min(state.read ?? 1, this.story.paragraphs.length);
        const asked = [...(state.asked ?? [])].sort((a, b) => a[1] - b[1]);
        while (this.read < target) {
            this.#readNext();
            while (asked.length && asked[0][1] < this.read) this.ask(asked.shift()[0]);
        }
        if (this.collecting()) for (const [id, para] of state.collected ?? []) this.#unlock(id, para);
        for (const [id, para] of state.built ?? []) {
            if (!this.inferenceById.has(id) || this.knows(id)) continue;
            this.#unlock(id, para);
            this.inferenceHow.set(id, { how: 'built' });
        }
        // The splits and states the player opened, before the cards and marks that speak of them.
        for (const [w, by] of state.openedSplits ?? []) {
            try { openSplit(this.model, w, by); this.openedSplits.push([w, by]); } catch (e) { console.warn(`could not reopen the split of ${w} at ${by}: ${e.message}`); }
        }
        for (const [thing, name, w] of state.opened ?? []) {
            try { this.openedStates.push(openState(this.model, thing, name, w)); } catch (e) { console.warn(`could not reopen ${thing} ${name} ${w}: ${e.message}`); }
        }
        // The player's own cards, in the order they were made (applied rules may be cited by conclusions).
        const made = [
            ...(state.applied ?? []).map(([id, rule, bind, para]) => ({ kind: 'applied', id, rule, bind, para })),
            ...(state.concluded ?? []).map(([id, cited, formula, label, para]) => ({ kind: 'concluded', id, cited, formula, label, para })),
        ].sort((a, b) => a.para - b.para || a.id.localeCompare(b.id, undefined, { numeric: true }));
        const renamed = new Map();
        for (const m of made) {
            const id = this.model.cards.has(m.id) ? null : m.id;
            const res = m.kind === 'applied'
                ? this.applyRule(m.rule, m.bind, { id, para: m.para })
                : this.conclude(m.cited.map((c) => renamed.get(c) ?? c), m.formula, { id, label: m.label, para: m.para });
            if (!res.ok) console.warn(`could not restore ${m.id}: ${res.error ?? res.reason ?? 'refused'}`);
            else if (res.id !== m.id) renamed.set(m.id, res.id);
        }
        for (const [slot, m] of state.marks ?? []) {
            if (!this.model.slots.has(slot)) continue;
            this.marks.set(slot, { listed: m.listed ? new Set(m.listed) : null, struck: new Map(m.struck), proven: m.proven, circled: new Set(m.circled ?? []) });
        }
        this.theories = state.theories ?? [];
        this.lastSeen = new Map(state.lastSeen ?? []);
        this.suspected = new Set((state.suspected ?? []).filter((id) => this.model.claimForms.has(id)));
        this.clashLog = (state.clashLog ?? []).filter((ids) => ids.every((id) => this.model.constraints.has(id)));
        this.clashCache = null;
        // Where the player made each step, as saved (an older save is scored from here on).
        if (state.made) {
            this.madeAt = new Map(state.made.filter(([id]) => this.routeById.has(id)));
            this.moved = false;
        }
        if (board) this.board = { ...TL.emptyBoard(), ...board };
    }

    // ---------- the timeline (world model; engine/timeline.js) ----------
    /** Has the story reached this time window (its `reveal` line)? */
    reached(windowId) {
        const w = (this.windowById ?? (this.windowById = new Map(this.model.windows.map((x) => [x.id, x])))).get(windowId);
        return !!w && (!w.reveal || this.#paraOf(w.reveal) < this.read);
    }

    /** The timeline in one layout ('place' or 'thing'): see engine/timeline.js. */
    timeline(layout = 'place', layer = TL.MINE) { return layout === 'thing' ? TL.byThing(this, layer) : TL.byPlace(this, layer); }
    timelineTimes() { return TL.times(this); }
    /**
     * The propositions the player may pencil knowledge of: those whose card they hold, or that a knowledge
     * question they can see asks about (so no proposition's words show before the story gives them).
     */
    knowablePropositions() {
        return (this.model.data.propositions ?? []).map((p) => p.id).filter((p) => this.knows(p)
            || [...this.model.slots.values()].some((s) => s.track && s.state === knowsName(p) && this.slotVisible(s.id)));
    }

    /** One card's own timeline (engine/timeline.js, cardTimeline). */
    cardTimeline(id, layer = TL.MINE) { return TL.cardTimeline(this, id, layer); }
    followedThings(layer = TL.MINE) { return TL.followed(this, layer); }
    /** The layers of the board: the player's own, then each theory they have met (step 4). */
    layers() { return [{ id: TL.MINE, label: 'Your own board' }, ...this.visibleTheories().map((t) => ({ id: t.id, label: t.label, story: !!t.story }))]; }
    /** Does this layer's night fit what the player holds and trusts? (engine/timeline.js, checkLayer) */
    checkLayer(layer = TL.MINE) { return TL.checkLayer(this, layer); }

    /**
     * The theories the player has met: the story's, once their line is read and every card their answers sit on is
     * held, and the player's own.
     */
    visibleTheories() {
        const told = (this.model.data.theories ?? []).filter((t) => {
            const at = t.source?.length ? this.story.find(t.source[0]) : null;
            return at && at.para < this.read && Object.keys(t.assignment).every((s) => this.knows(this.model.slots.get(s).on));
        });
        return [...told.map((t) => ({ ...t, story: true })), ...this.theories];
    }

    /** Follow a card the player holds on the timeline (a row by thing; its marks by place); or stop following it. */
    follow(id) {
        if (!this.knows(id)) return false;
        this.board.unfollowed = this.board.unfollowed.filter((x) => x !== id);
        if (!this.board.followed.includes(id)) this.board.followed.push(id);
        return true;
    }
    unfollow(id) {
        this.board.followed = this.board.followed.filter((x) => x !== id);
        if (!this.board.unfollowed.includes(id)) this.board.unfollowed.push(id);
    }

    #shownTime(time) { return this.timelineTimes().some((t) => t.id === time && t.kind !== 'boundary'); }

    /**
     * Pencil a place for a thing at a time (a free mark: several are several hypotheses); `struck` crosses it out,
     * and the mark stays visible. Only places the player has met, 'elsewhere', at times shown on the board.
     * `aspect` 'held' pencils who has it (a person, animal or group the player holds, or a place where it lies);
     * a condition's id pencils whether it is so ('true' or 'false').
     */
    pencilPlace(thing, time, value, { struck = false, layer = TL.MINE, aspect = 'at' } = {}) {
        if (!this.knows(thing) || !this.#shownTime(time)) return false;
        const kind = this.model.cards.get(value)?.kind;
        if (aspect === 'at' && value !== TL.ELSEWHERE && !(this.knows(value) && kind === 'place')) return false;
        if (aspect === 'held' && value !== TL.ELSEWHERE && !(this.knows(value) && [...TL.BOARD_KINDS.filter((k) => k !== 'object'), 'place'].includes(kind))) return false;
        if (aspect === 'aims' && !(this.model.data.state_aims ?? []).some((a) => a.id === value)) return false;
        const yesNo = [...(this.model.data.state_conditions ?? []).map((c) => c.id), ...this.knowablePropositions().map(knowsName)];
        if (aspect !== 'at' && aspect !== 'held' && aspect !== 'aims' && !(yesNo.includes(aspect) && ['true', 'false'].includes(value))) return false;
        if (layer !== TL.MINE && !this.visibleTheories().some((t) => t.id === layer)) return false;
        const same = (p) => p.thing === thing && p.time === time && p.value === value && (p.layer ?? TL.MINE) === layer && TL.aspectOf(p) === aspect;
        this.board.pencil = this.board.pencil.filter((p) => !same(p));
        this.board.pencil.push({ thing, time, value, ...(struck ? { struck: true } : {}), ...(layer !== TL.MINE ? { layer } : {}), ...(aspect !== 'at' ? { aspect } : {}) });
        // Restoring a mark the player ruled out takes the ruling back too.
        const st = !struck && layer === TL.MINE ? TL.stateOf(this, thing, time, aspect, value) : null;
        if (st && this.marks.get(st.slot)?.struck.has(st.value)) this.unstrike(st.slot, st.value);
        if (!this.followedThings(layer).includes(thing)) this.follow(thing);
        return true;
    }
    erasePlace(thing, time, value, layer = TL.MINE, aspect = 'at') {
        this.board.pencil = this.board.pencil.filter((p) => !(p.thing === thing && p.time === time && p.value === value && (p.layer ?? TL.MINE) === layer && TL.aspectOf(p) === aspect));
    }

    /**
     * Commit a mark (step B): prove that the thing was there (had that holder, was in that condition) then. What the
     * player holds and trusts must leave nothing else possible, as for proving any answer; a proven state becomes a
     * card of the player's, citable like an inference. Returns {ok, card} or the check's refusal.
     */
    proveMark(thing, time, value, aspect = 'at') {
        const st = this.#stateFor(thing, time, aspect, value);
        if (st.reason) return { ok: false, reason: st.reason, ...(st.clash ? { clash: st.clash } : {}) };
        const res = this.prove(st.slot, st.value);
        if (!res.ok) return res.reason ? { ...res, reason: 'what you hold and trust does not settle it yet' } : res;
        this.pencilPlace(thing, time, value, { aspect });
        const formula = { eq: [st.slot, st.value] };
        const had = this.concluded.find((c) => JSON.stringify(c.formula) === JSON.stringify(formula) && this.knows(c.id));
        if (had) return { ok: true, card: had.id, used: res.used };
        const cited = [...new Set(res.used.map((k) => this.model.constraints.get(k)).filter((k) => k && !k.definition && !k.world).flatMap((k) => (k.inference ? [k.inference] : k.premises)))].filter((x) => this.knows(x));
        const made = this.conclude(cited, formula, { label: this.stateText(thing, time, aspect, st.value) });
        return made.ok ? { ok: true, card: made.id, used: res.used } : { ok: true, card: null, used: res.used, cardRefused: made.reason ?? made.error ?? 'refused' };
    }

    /** Rule a mark out: as a cross-out of that answer (checked or in pencil, as the options say); the mark is struck. */
    ruleOutMark(thing, time, value, aspect = 'at') {
        const st = this.#stateFor(thing, time, aspect, value);
        if (st.reason) return { ok: false, reason: st.reason, ...(st.clash ? { clash: st.clash } : {}) };
        const res = this.strike(st.slot, st.value);
        if (res.ok) this.pencilPlace(thing, time, value, { aspect, struck: true });
        return res;
    }

    /**
     * The state a mark speaks of ({slot, value}), opening it if the case never declared it (openState: checked
     * against the rules only, with no answer of its own). {reason} where it cannot be opened.
     */
    #stateFor(thing, time, aspect, value) {
        let st = TL.stateOf(this, thing, time, aspect, value);
        // Another game on the same model opened it: hold it too, so it stays while this game's cards speak of it.
        if (st && this.model.opened.some((o) => o.slot === st.slot) && !this.openedStates.includes(st.slot)) this.openedStates.push(openState(this.model, thing, aspect, time));
        let opened = null;
        if (!st) {
            if (!this.knows(thing) || !this.#shownTime(time)) return { reason: 'that is not on your board' };
            if (!this.#ensurePart(time)) return { reason: 'that time cannot be checked' };
            try { opened = openState(this.model, thing, aspect, time); } catch (e) { return { reason: e.message }; }
            this.openedStates.push(opened);
            // The case's ties are unchanged (the opened window has its own), so the clashes found still stand: the
            // cache is checked again, not thrown away.
            if (this.clashCache) this.clashCache = { ...this.clashCache, key: null };
            st = TL.stateOf(this, thing, time, aspect, value);
        }
        // A cell means its whole time: if what the player trusts, with the world's ties, cannot give the thing one
        // answer there (it moves within that time, say), nothing about the cell can be proven. Say why, and close a
        // state opened for it.
        const slot = st?.slot ?? opened;
        const active = this.#withTies(this.workingConstraints(), [slot]);
        if (!this.model.problem.consistent(active).ok) {
            const clash = this.model.problem.explainConflict(active) ?? [];
            if (opened) {
                closeState(this.model, opened);
                this.openedStates = this.openedStates.filter((x) => x !== opened);
            }
            const who = this.nameOf(thing);
            return { reason: `${who} has no single ${aspect === 'at' ? 'place' : aspect === 'held' ? 'holder' : 'answer'} throughout this time: what you trust ${aspect === 'at' ? `puts ${who} in more than one place then` : 'gives more than one'}. Split the time at an event to place ${who} before or after it.`, clash };
        }
        return st ?? { reason: 'that is not one of the answers here' };
    }

    /**
     * Make sure the model has this time: a window, a part the case splits, or a part of the player's own split
     * (opened, with its parents, with openSplit). False if it is none of these.
     */
    #ensurePart(time) {
        if (this.model.windows.some((w) => w.id === time) || this.model.subwindows.has(time)) {
            const sw = this.model.subwindows.get(time);
            // Opened by another game on the same model: hold it too.
            if (sw?.opened && !this.openedSplits.some(([w, by]) => w === sw.parent && by === sw.by)) { openSplit(this.model, sw.parent, sw.by); this.openedSplits.push([sw.parent, sw.by]); }
            return true;
        }
        const sp = this.board.splits.find((x) => time === TL.partId(x.time, 'before', x.by) || time === TL.partId(x.time, 'after', x.by));
        if (!sp || !this.#ensurePart(sp.time)) return false;
        try { openSplit(this.model, sp.time, sp.by); } catch { return false; }
        this.openedSplits.push([sp.time, sp.by]);
        if (this.clashCache) this.clashCache = { ...this.clashCache, key: null };
        return true;
    }

    /**
     * Commit an event's place in a split window: prove it happened before (or after) the event that splits it, and
     * so on up the parts (`part` is where it is placed). The order questions are the case's or, for the player's
     * own split, opened for it. A proven order becomes a card, as a proven state does.
     */
    proveOrder(event, part) {
        if (!this.knows(event) || !this.#shownTime(part)) return { ok: false, reason: 'that is not on your board' };
        if (!this.#ensurePart(part)) return { ok: false, reason: 'that time cannot be checked' };
        const sw = this.model.subwindows.get(part);
        if (!sw) return { ok: false, reason: 'that is a whole window, not a part of one' };
        const conds = sw.path.filter(([, by]) => by !== event).map(([dir, by]) => [`ord.${event.slice(2)}.${by.slice(2)}`, dir, by]);
        if (conds.some(([slot]) => !this.model.slots.has(slot))) return { ok: false, reason: 'a clue you hold puts it in another window' };
        // As for a state: what is trusted must be consistent, or nothing can be proven of it.
        const working = this.workingConstraints();
        if (!this.model.problem.consistent(working).ok) return { ok: false, reason: 'some of the clues you trust clash: one of them must be false', clash: this.model.problem.explainConflict(working) ?? [] };
        const formula = conds.length === 1 ? { eq: [conds[0][0], conds[0][1]] } : { and: conds.map(([slot, dir]) => ({ eq: [slot, dir] })) };
        const res = this.checkConclusion(formula);
        if (!res.ok) return res.reason ? { ...res, reason: 'what you hold and trust does not settle it yet' } : res;
        for (const [slot, dir] of conds) this.#mark(slot).proven = { value: dir, cited: true, used: res.used };
        this.placeEvent(event, part);
        const had = this.concluded.find((c) => JSON.stringify(c.formula) === JSON.stringify(formula) && this.knows(c.id));
        if (had) return { ok: true, card: had.id, used: res.used };
        const name = (e) => `“${this.nameOf(e)}”`;
        const label = `${name(event)} happened ${conds.map(([, dir, by]) => `${dir} ${name(by)}`).join(', and ')}`;
        const cited = [...new Set(res.used.map((k) => this.model.constraints.get(k)).filter((k) => k && !k.definition && !k.world).flatMap((k) => (k.inference ? [k.inference] : k.premises)))].filter((x) => this.knows(x));
        const made = this.conclude(cited, formula, { label });
        return made.ok ? { ok: true, card: made.id, used: res.used } : { ok: true, card: null, used: res.used, cardRefused: made.reason ?? made.error ?? 'refused' };
    }

    /** A state in words: "John Straker was at Straker's villa (Tuesday, 1 a.m.)". */
    stateText(thing, time, aspect, value) {
        const label = this.timelineTimes().find((t) => t.id === time)?.label ?? this.model.windows.find((w) => w.id === time)?.label ?? time;
        const who = this.nameOf(thing);
        const what = value === TL.ELSEWHERE ? 'somewhere else' : this.nameOf(value).replace(/^(The|A|An) /, (a) => a.toLowerCase());
        if (aspect === 'at') return `${who} was ${value === TL.ELSEWHERE ? 'somewhere else' : `at ${what}`} (${label})`;
        if (aspect === 'held') return this.model.cards.get(value)?.kind === 'place' ? `${who} lay at ${what} (${label})` : `${what} had ${who} (${label})`;
        const prop = (this.model.data.propositions ?? []).find((p) => knowsName(p.id) === aspect);
        if (prop) return `${who} ${value === 'true' ? 'knew' : 'did not know'} this: “${prop.text}” (${label})`;
        if (aspect === 'aims') return `${who} was trying ${((this.model.data.state_aims ?? []).find((a) => a.id === value)?.label ?? value).replace(/^To /, 'to ')} (${label})`;
        const cond = (this.model.data.state_conditions ?? []).find((c) => c.id === aspect);
        return `${who} was ${value === 'true' ? '' : 'not '}${cond?.id ?? aspect} (${label})`;
    }

    /**
     * Split a time shown on the board at an event the player holds, into the part before it and the part after.
     * The window, and what is in it, stays. Returns the two parts' ids, or null.
     */
    splitTime(time, event) {
        if (!this.knows(event) || this.model.cards.get(event)?.section !== 'events') return null;
        if (!this.#shownTime(time) || this.board.splits.some((s) => s.time === time || s.by === event)) return null;
        this.board.splits.push({ time, by: event });
        return [TL.partId(time, 'before', event), TL.partId(time, 'after', event)];
    }
    /** Undo a split: its parts (and any splits inside them) go, and what was placed or pencilled there with them. */
    unsplitTime(time) {
        const sp = this.board.splits.find((s) => s.time === time);
        if (!sp) return;
        const gone = (id) => id.startsWith(`${TL.partId(time, 'before', sp.by)}`) || id.startsWith(`${TL.partId(time, 'after', sp.by)}`);
        this.board.splits = this.board.splits.filter((s) => s !== sp && !gone(s.time));
        this.board.pencil = this.board.pencil.filter((p) => !gone(p.time));
        this.board.placed = this.board.placed.filter((p) => !gone(p.time));
    }
    /** Move an event the player holds into a part of the window it is in (or back out, with null). */
    placeEvent(event, time) {
        this.board.placed = this.board.placed.filter((p) => p.event !== event);
        if (time === null) return true;
        if (!this.knows(event) || !this.#shownTime(time)) return false;
        this.board.placed.push({ event, time });
        return true;
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
        this.#noteMade();
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
        if (!this.collecting()) for (const s of this.story.spans[p]) for (const id of s.ids) this.#unlock(id, p);
        // Inferences a character states here (Holmes's where the story tells his step) arrive by themselves.
        for (const { id, by } of this.statedAt.get(p) ?? []) {
            if (this.knows(id)) continue;
            this.#unlock(id, p);
            this.inferenceHow.set(id, { how: 'stated', by });
        }
        // The story is about to wait on a deduction: the card that holds its question is dealt now.
        for (const id of this.story.gates?.get(p + 1) ?? []) {
            const c = this.routeById.get(id).concludes;
            const slot = c.slot ?? c.formula.eq?.[0];
            if (slot) this.#unlock(this.model.slots.get(slot)?.on, p);
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
        if (!c || this.unlocked.has(id) || this.hidden.has(id)) return;
        this.unlocked.set(id, { para, at: this.seq++ });
        if (['claims', 'inferences', 'applied'].includes(c.section)) for (const e of this.claimEvents.get(id) ?? []) this.#unlock(e, para);
        // Trivial: an inference comes as soon as its premises are held (the game does the reasoning). An implicit
        // inference (a step no reader notices making) comes so at every level, shown as following from them.
        for (const k of this.inferencesUsing.get(id) ?? []) {
            const inf = this.inferenceById.get(k);
            if (!this.autoSolves() && !inf.implicit) continue;
            if (this.knows(k) || !inf.premises.every((x) => this.unlocked.has(x))) continue;
            if (!this.inferenceWaits.get(k).every((e) => this.unlocked.has(e))) continue;
            this.#unlock(k, para);
            this.inferenceHow.set(k, { how: inf.implicit ? 'implicit' : 'auto' });
        }
    }

    // ---------- inferences ----------
    /** The inferences the player holds (built, stated to them, or in Trivial worked out for them). */
    heldInferences() { return [...this.inferences.filter((k) => this.knows(k.id)).map((k) => k.id), ...this.concluded.map((c) => c.id).filter((id) => this.knows(id))]; }
    /** The applied rules the player holds. */
    heldApplied() { return this.applied.map((a) => a.id).filter((id) => this.knows(id)); }
    howHeld(id) { return this.inferenceHow.get(id) ?? null; }

    /** What the player must connect to build an inference: its premises, or (background implicit) its clues. */
    connectSet(id) {
        const ps = this.inferenceById.get(id).premises;
        if (this.connect === INF_CONNECT) return ps;
        const clues = ps.filter((x) => this.model.cards.get(x)?.section !== 'rules');
        return clues.length ? clues : ps;
    }

    /** What an inference's conclusion is about (CONCLUSION_KINDS keys). */
    conclusionKinds(id) {
        const out = new Set();
        const walk = (f) => {
            if (f.implies) return walk(f.implies[1]);
            if (f.and) return f.and.forEach(walk);
            for (const x of slotsIn(f)) {
                const sl = this.model.slots.get(x);
                out.add(KIND_OF_FACET[sl.facet] ?? (sl.domain.length === 2 && sl.domain.includes('true') ? 'whether' : 'what'));
            }
            return null;
        };
        walk(this.inferenceById.get(id).formula);
        return [...out];
    }

    /**
     * Inferences the player could build now and has not: everything they must connect is in hand. (Outside
     * Trivial. Background implicit: a background premise not yet known still blocks it.)
     */
    buildable() {
        if (this.autoSolves()) return [];
        return this.inferences.filter((k) => !k.implicit && !this.knows(k.id) && k.premises.every((x) => this.knows(x))).map((k) => k.id);
    }

    /**
     * Propose an inference from the connected cards (`cards`, held). Builds every inference the connection
     * completes; otherwise says whether it is onto something. Hard: `kind` (CONCLUSION_KINDS) names what the
     * conclusion is about, and must match. Only inferences whose connections are all in hand count, so nothing
     * the player has not met is hinted at.
     * Returns {built: [ids], onto: bool, more: n (fewest further connections), lacking: bool (complete, but a
     *   background fact it needs is not known yet), wrongKind: bool, needsKind: bool}.
     */
    propose(cards, kind = null) {
        this.moved = true;
        const S = new Set(cards.filter((x) => this.knows(x)));
        const out = { built: [], onto: false, more: 0, lacking: false, wrongKind: false, needsKind: false };
        if (!S.size || this.autoSolves()) return out;
        let more = Infinity;
        for (const k of this.inferences) {
            if (this.knows(k.id)) continue;
            const need = this.connectSet(k.id);
            if (![...S].every((x) => k.premises.includes(x)) || !need.every((x) => this.knows(x))) continue;
            const missing = need.filter((x) => !S.has(x));
            if (missing.length) { more = Math.min(more, missing.length); continue; }
            if (!k.premises.every((x) => this.knows(x))) { out.lacking = true; continue; }
            if (this.opts.kind === 'on') {
                if (!kind) { out.needsKind = true; continue; }
                if (!this.conclusionKinds(k.id).includes(kind)) { out.wrongKind = true; continue; }
            }
            this.#unlock(k.id, this.read - 1);
            this.inferenceHow.set(k.id, { how: 'built' });
            out.built.push(k.id);
        }
        if (more < Infinity) { out.onto = true; out.more = more; }
        this.clashCache = null;
        return out;
    }

    /** The fewest inferences (among those resting on its premises) that give a route step its conclusion. */
    #inferencesFor(step) {
        if (step.inference) return [step.inference]; // a thought's own inference is its step
        const c = step.concludes;
        const formula = c.formula ?? (c.claim ? this.model.cards.get(c.claim)?.asserts : null);
        if (!c.slot && !formula) return null;
        // The step's premises cover an inference whose premises they cover, and up a chain (activeConstraints).
        const known = new Set(step.premises);
        const ids = activeConstraints(this.model, known);
        const fixed = c.slot ? { [c.slot]: c.value } : {};
        const extra = formula ? [{ not: formula }] : [];
        // Inferences last, so the fewest of them are kept.
        const ordered = [...ids.filter((x) => !this.model.constraints.get(x).inference), ...ids.filter((x) => this.model.constraints.get(x).inference)];
        const used = this.model.problem.explainConflict(ordered, fixed, { extra });
        if (!used) return null;
        return [...new Set(used.map((x) => this.model.constraints.get(x).inference).filter(Boolean))];
    }

    /** The inferences Holmes's step needs, or null when it needs none (or cannot be checked). */
    stepInferences(stepId) {
        const needs = this.stepNeeds.get(stepId);
        return needs?.length ? needs : null;
    }

    // ---------- the player's own reasoning (format 0.3) ----------
    /** The event and proposition cards a formula speaks of (dealt along with whatever states the formula); with
     *  `entities`, the entities whose questions it speaks of as well. */
    #spokenOf(formula, entities = false) {
        const sections = entities ? ['events', 'propositions', 'entities'] : ['events', 'propositions'];
        // A state of knowledge speaks of its proposition too: the clue that tells what someone knew deals it.
        const of = (s) => { const sl = this.model.slots.get(s); const t = sl?.track && this.model.stateTracks.get(`${sl.state}|${sl.on}`); return t?.aspect === 'knowledge' ? [sl.on, t.knows] : [sl?.on]; };
        return [...new Set([...slotsOf(formula)].flatMap(of))].filter((o) => sections.includes(this.model.cards.get(o)?.section));
    }

    /** Background facts the player holds that can be applied (they carry a schema or a formula). */
    applicableRules() {
        return (this.model.data.rules ?? []).filter((r) => this.knows(r.id) && (r.schema || r.formula)).map((r) => r.id);
    }

    /** A rule's variables and what each may bind to among the cards the player holds. */
    ruleBindings(ruleId) {
        const rule = this.model.cards.get(ruleId);
        if (!rule?.schema) return {};
        const out = {};
        for (const [v, spec] of Object.entries(rule.schema.vars ?? {})) out[v] = this.model.env.cards(spec).filter((id) => this.knows(id) && !this.hidden.has(id));
        return out;
    }

    /**
     * Apply a background fact to cards: hold its grounded formula as a card the player can cite and doubt.
     * Returns {ok, id, formula, existing?} or {ok: false, error}. The same application twice returns the first.
     */
    applyRule(ruleId, bind = {}, { id = null, para = null } = {}) {
        this.moved = true;
        if (this.autoSolves()) return { ok: false, error: 'the game is working the answers out itself' };
        if (!this.knows(ruleId)) return { ok: false, error: 'you do not hold that fact yet' };
        for (const card of Object.values(bind)) if (!this.knows(card) && !this.model.windows.some((w) => w.id === card)) return { ok: false, error: `you have not met ${card} yet` };
        const key = `${ruleId}|${JSON.stringify(Object.entries(bind).sort())}`;
        const existing = this.applied.find((a) => a.key === key);
        if (existing) return { ok: true, id: existing.id, formula: this.model.cards.get(existing.id).formula, existing: true };
        const res = instantiateRule(this.model, ruleId, bind);
        if (!res.ok) return res;
        const rule = this.model.cards.get(ruleId);
        const cardId = id ?? `a.${ruleId.slice(2)}_${(this.model.dynamicSeq = (this.model.dynamicSeq ?? 0) + 1)}`;
        const bound = Object.entries(bind).map(([v, c]) => `${v} = ${this.nameOf(c)}`).join(', ');
        const label = `${rule.text}${bound ? ` (applied: ${bound})` : ''}`;
        try {
            addDynamic(this.model, { id: cardId, section: 'applied', label, rule: ruleId, bind, premises: res.premises, formula: res.formula, by: 'player' });
        } catch (e) { return { ok: false, error: e.message }; }
        this.dynamicIds.push(cardId);
        this.claimEvents.set(cardId, this.#spokenOf(res.formula));
        const at = para ?? this.read - 1;
        this.applied.push({ id: cardId, key, rule: ruleId, bind, para: at });
        this.#unlock(cardId, at);
        this.inferenceHow.set(cardId, { how: 'applied' });
        // A new card only adds to what is trusted: the clashes found still clash, and are checked again first.
        if (this.clashCache) this.clashCache = { ...this.clashCache, key: null };
        return { ok: true, id: cardId, formula: res.formula };
    }

    /** Take back an applied rule or a concluded inference (and what rested on it lapses with it). */
    retract(id) {
        if (!this.dynamicIds.includes(id)) return false;
        removeDynamic(this.model, id);
        this.dynamicIds = this.dynamicIds.filter((x) => x !== id);
        this.applied = this.applied.filter((a) => a.id !== id);
        this.concluded = this.concluded.filter((c) => c.id !== id);
        this.unlocked.delete(id);
        this.inferenceHow.delete(id);
        this.suspected.delete(id);
        this.clashCache = null;
        return true;
    }

    /**
     * Draw a conclusion from cited cards. `formula` is a ground formula (a slot's value, a set of values, a
     * proposition…); the cited cards (clues, background facts, applied rules, propositions, inferences), read as
     * the player trusts them, must entail it. On success the conclusion becomes an inference card the player
     * holds (and can cite and doubt), resting on the cited cards that were needed.
     * Returns {ok, id, used, premises, matches: authored inferences this conclusion covers} or
     *   {ok: false, reason} / {ok: false, contradiction: [constraint ids]} / {ok: false, error}.
     */
    conclude(cited, formula, { id = null, label = null, para = null } = {}) {
        this.moved = true;
        if (this.autoSolves()) return { ok: false, error: 'the game is working the answers out itself' };
        const S = [...new Set(cited)].filter((x) => this.knows(x));
        if (!S.length) return { ok: false, error: 'cite at least one card you hold' };
        try { for (const s of slotsOf(formula)) if (!this.model.slots.has(s)) throw new Error(`unknown question ${s}`); } catch (e) { return { ok: false, error: e.message }; }
        for (const [slot, v] of literalsIn(formula)) if (slot && !this.model.slots.get(slot).domain.includes(v)) return { ok: false, error: `${v} is no answer to ${slot}` };
        const known = new Set(S);
        // Everything the cited cards switch on, in the player's reading; the player's own cards count when cited.
        const active = this.#withTies(activeConstraints(this.model, known, this.suspected, { heldInferences: true }).filter((kid) => {
            const k = this.model.constraints.get(kid);
            return k.definition || !k.inference || known.has(k.inference);
        }), slotsOf(formula));
        const clash = this.model.problem.explainConflict(active);
        if (clash) return { ok: false, contradiction: clash };
        if (this.model.problem.consistent(active, {}, { extra: [{ not: formula }] }).ok) return { ok: false, reason: 'the cards you cite do not settle that' };
        const used = this.model.problem.explainConflict(active, {}, { extra: [{ not: formula }] }) ?? [];
        const premises = [...new Set(used.map((kid) => this.model.constraints.get(kid)).filter((k) => !k.definition).flatMap((k) => k.inference ? [k.inference] : k.premises))];
        const cardId = id ?? `k.player_${(this.model.dynamicSeq = (this.model.dynamicSeq ?? 0) + 1)}`;
        const text = label ?? this.readingOf(formula);
        try {
            addDynamic(this.model, { id: cardId, section: 'inferences', label: text, premises: premises.length ? premises : S, formula, by: 'player', pattern: 'player' });
        } catch (e) { return { ok: false, error: e.message }; }
        this.dynamicIds.push(cardId);
        this.claimEvents.set(cardId, this.#spokenOf(formula));
        const at = para ?? this.read - 1;
        this.concluded.push({ id: cardId, cited: S, formula, label: text, para: at });
        this.#unlock(cardId, at);
        this.inferenceHow.set(cardId, { how: 'concluded' });
        // A new card only adds to what is trusted: the clashes found still clash, and are checked again first.
        if (this.clashCache) this.clashCache = { ...this.clashCache, key: null };
        return { ok: true, id: cardId, used, premises, matches: this.conclusionMatches(formula) };
    }

    /** Authored inferences, not yet held, whose formula this conclusion alone entails. */
    conclusionMatches(formula) {
        return this.inferences.filter((k) => !this.knows(k.id) && k.truth !== false
            && !this.model.problem.consistent([], {}, { extra: [formula, { not: this.model.cards.get(k.id).formula }] }).ok).map((k) => k.id);
    }

    /** A plain rendering of a formula, naming cards as the player knows them (the UI may replace this). */
    readingOf(formula) {
        return render(formula, (slot) => {
            const s = this.model.slots.get(slot);
            return s ? `${this.nameOf(s.on)} · ${this.phrase(s.prompt)}` : slot;
        });
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

    // ---------- scoring (Round 58) ----------
    /** Where Holmes states a step: its thought's Holmes paragraph, or the line of a conclusion he draws. */
    holmesAt(stepId) { return this.story.anchors.steps.get(stepId) ?? null; }

    /** Record the steps the player has newly made by their own reasoning, at the last paragraph read. */
    #noteMade() {
        if (this.moved) {
            // Cleared only once every step is checked: a check handed to the solver's worker comes back here.
            for (const id of this.routeById.keys()) if (!this.madeAt.has(id) && this.#madeByPlayer(id)) this.madeAt.set(id, this.read - 1);
            this.moved = false;
        }
        return this.madeAt;
    }

    /**
     * Holmes's steps (the thoughts) the player can beat him to: each with Holmes's paragraph, the paragraph by
     * which the player made it by their own reasoning (null if not yet), and whether that was before Holmes's
     * paragraph (it scores). Inferences stated, granted or worked out by the game do not count; nor anything in Trivial.
     */
    thoughtScores() {
        const made = this.#noteMade();
        return [...this.routeById.keys()].map((id) => ({ thought: id, holmes: this.holmesAt(id), made: made.get(id) ?? null }))
            .filter((r) => r.holmes !== null).map((r) => ({ ...r, scores: r.made !== null && r.made < r.holmes }));
    }

    /** The score: thoughts made before Holmes's paragraph, out of those he states. */
    score() {
        const rows = this.thoughtScores();
        return { scored: rows.filter((r) => r.scores).length, made: rows.filter((r) => r.made !== null).length, possible: rows.length };
    }

    /** Made by the player's own reasoning: built inferences, their own conclusions and applied rules, their proofs. */
    #madeByPlayer(stepId) {
        if (this.autoSolves()) return false;
        const step = this.routeById.get(stepId);
        const own = (id) => this.knows(id) && !this.suspected.has(id) && ['built', 'concluded', 'applied'].includes(this.inferenceHow.get(id)?.how);
        const needs = this.stepInferences(stepId);
        if (needs && needs.every(own)) return true;
        const c = step.concludes;
        if (c.slot && this.isStruckWithProof(c.slot, c.value)) return true;
        const f = c.slot ? { ne: [c.slot, c.value] } : c.formula;
        if (!f) return false;
        if ([...this.heldInferences(), ...this.heldApplied()].some((id) => own(id) && this.#covers(this.model.cards.get(id).formula, f))) return true;
        // The player's proofs: values proven, or left alone by proven cross-outs (a clue's given value is not theirs).
        const fixed = {};
        for (const [s, m] of this.marks) {
            const v = this.provenValue(s) ?? (() => {
                const left = this.model.slots.get(s).domain.filter((x) => !this.hidden.has(x) && !this.isStruckWithProof(s, x));
                return m.struck.size && left.length === 1 ? left[0] : null;
            })();
            if (v !== null) fixed[s] = v;
        }
        return Object.keys(fixed).length > 0 && !this.model.problem.consistent([], fixed, { extra: [{ not: f }] }).ok;
    }

    /** A reasoning step counts as made once the player has proved its conclusion. */
    stepMade(stepId) {
        const step = this.routeById.get(stepId);
        if (!step) return false;
        // Holmes's step is made once the player holds the inferences it needs (trusting them), or whatever they
        // hold and trust yields its conclusion by any route.
        const needs = this.stepInferences(stepId);
        if (needs && !this.autoSolves() && needs.every((id) => this.knows(id) && !this.suspected.has(id))) return true;
        const c = step.concludes;
        if (c.slot) {
            if (this.isStruckWithProof(c.slot, c.value)) return true;
            const v = this.settled(c.slot);
            if (v !== null && v !== c.value) return true;
        }
        const f = c.slot ? { ne: [c.slot, c.value] } : c.formula ?? this.model.cards.get(c.claim)?.asserts;
        if (!f) return false;
        if (this.#entailedBySettled(f)) return true;
        // A conclusion the player stated (or heard stated) that covers Holmes's: checked formula against formula,
        // which is cheap; the whole-hand entailment is what conclude() does when the player commits to it.
        if (this.autoSolves()) return false;
        return [...this.heldInferences(), ...this.heldApplied()].some((id) => !this.suspected.has(id) && this.#covers(this.model.cards.get(id).formula, f));
    }

    /** Does formula `a` alone entail formula `b`? (A small search over the slots the two mention.) */
    #covers(a, b) {
        if (!a || !b) return false;
        return !this.model.problem.consistent([], {}, { extra: [a, { not: b }] }).ok;
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
        // (A card spoken of by an early clue may be quoted only from a later line: that line waits to be read.)
        const said = this.story.firstSentence(id);
        if (said && said.para < this.read) out.push({ key: 'mention', para: said.para, kind: 'mention', text: said.text });
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
            // Traits: plain properties a rule may range over, shown like a gloss, with the line that gives them.
            for (const t of c.traits ?? []) {
                const para = Math.max(first, this.#paraOf(t.source[0]));
                if (para < this.read) out.push({ key: `trait.${t.id}`, para, kind: 'background', term: t.term, text: t.text, trait: t.id, quote: t.source[0] });
            }
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
        if (['claims', 'rules', 'propositions', 'applied', 'inferences'].includes(c.section)) return c.text;
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
        // A state's question names its time window, whose label may describe what happened then: not before the
        // story reaches that window (as for a window offered as an answer).
        if (s.track) {
            const w = (this.windowById ?? (this.windowById = new Map(this.model.windows.map((x) => [x.id, x])))).get(s.root);
            if (w?.reveal && this.#paraOf(w.reveal) >= this.read) return false;
            if (s.splitBy.some((e) => !this.knows(e))) return false; // a part of a window names the events that split it
        }
        // An order question (before or after a splitting event) waits to be raised, like a declared one.
        if ((owner.section === 'events' && !declared.has(slotId) && s.facet !== 'relation' && s.facet !== 'order') || (owner.section === 'claims' && s.facet !== 'truth') || s.facet === 'identity') return true;
        if (!this.slotRaisers) {
            this.slotRaisers = new Map();
            const add = (slot, test) => {
                if (!this.slotRaisers.has(slot)) this.slotRaisers.set(slot, []);
                this.slotRaisers.get(slot).push(test);
            };
            // A held clue raises what it speaks of, except what it simply fills in (that shows once it is doubted:
            // "he is an honest servant" asks nothing until the player wonders whether he was).
            for (const c of this.model.data.claims ?? []) {
                const asserts = this.model.cards.get(c.id)?.asserts;
                if (c.derived || !asserts) continue;
                add(`${c.id}.truth`, () => this.suspected.has(c.id));
                const conjuncts = (f) => (f.and ? f.and.flatMap(conjuncts) : [f]);
                const fills = new Set(conjuncts(asserts).filter((f) => f.eq).map((f) => f.eq[0]));
                for (const x of slotsIn(asserts)) add(x, fills.has(x) ? () => this.knows(c.id) && this.suspected.has(c.id) : () => this.knows(c.id));
            }
            // A held inference raises what it speaks of, as a clue does; its "Does it hold?" once doubted.
            for (const k of this.inferences) {
                add(`${k.id}.truth`, () => this.suspected.has(k.id));
                for (const x of slotsIn(this.model.cards.get(k.id).formula)) add(x, () => this.knows(k.id));
            }
            for (const q of this.model.data.questions ?? []) add(q.slot, () => this.questionRaised(q.id));
            for (const [para, steps] of this.story.gates ?? new Map()) {
                for (const id of steps) {
                    const c = this.routeById.get(id).concludes;
                    const slot = c.slot ?? c.formula?.eq?.[0];
                    if (slot) add(slot, () => para <= this.read);
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

    /** Could the story still bring answers to this question that are not on offer yet (a time, a person)? */
    moreToCome(slot) {
        return this.model.slots.get(slot).domain.some((v) => !this.offered(slot, v) && !this.hidden.has(v));
    }

    #mark(slot) {
        if (!this.marks.has(slot)) this.marks.set(slot, { listed: this.proposing() ? new Set() : null, struck: new Map(), proven: null, circled: new Set() });
        return this.marks.get(slot);
    }

    /** The values the player is still considering for a slot. */
    pencil(slot) {
        const m = this.marks.get(slot);
        if (this.provenValue(slot) !== null) return [this.provenValue(slot)];
        if (this.autoSolves()) return this.trivialValues(slot).filter((v) => this.offered(slot, v));
        const g = this.given(slot);
        if (g) return [g.value];
        const s = this.model.slots.get(slot);
        const base = m?.listed ? [...m.listed] : this.proposing() ? [] : s.domain;
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

    /**
     * Cross a value out. Pencil (Easy): a plain mark. Checked (Medium and Hard): only if what the player holds and trusts
     * (clues and inferences, with any clash set aside) rules it out; the proof records what it rests on, and
     * lapses if the player later doubts one of those.
     */
    strike(slot, value) {
        this.moved = true;
        const m = this.#mark(slot);
        if (this.opts.crossOut === 'pencil') {
            m.struck.set(value, {});
            return { ok: true, proof: false };
        }
        const res = this.checkElimination(slot, value);
        if (res.ok) m.struck.set(value, { cited: true, used: res.used });
        return { ...res, proof: res.ok };
    }

    unstrike(slot, value) { this.marks.get(slot)?.struck.delete(value); }

    /** Circle a value: the player's own pick among the answers. A mark only; it proves and rules out nothing. */
    circle(slot, value) { this.#mark(slot).circled.add(value); }
    uncircle(slot, value) { this.marks.get(slot)?.circled.delete(value); }
    isCircled(slot, value) { return !!this.marks.get(slot)?.circled.has(value); }
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

    /** Prove a value outright: what the player holds and trusts must leave nothing else possible. */
    prove(slot, value) {
        this.moved = true;
        const res = this.checkConclusion({ eq: [slot, value] });
        if (res.ok) this.#mark(slot).proven = { value, cited: true, used: res.used };
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
        if (this.autoSolves()) {
            const left = this.trivialValues(slot);
            return left.length === 1 ? left[0] : null;
        }
        const g = this.given(slot);
        if (g) return g.value;
        const s = this.model.slots.get(slot);
        // A card left out of the game is no answer the player has to rule out.
        const left = s.domain.filter((v) => !this.hidden.has(v) && !this.isStruckWithProof(slot, v));
        return left.length === 1 ? left[0] : null;
    }

    // ---------- checking ----------
    /** Does everything the player holds and trusts rule `value` out of `slot`? {ok, used} or {ok: false, reason}. */
    checkElimination(slot, value) {
        return this.#checkAgainstAll({ [slot]: value }, []);
    }

    /** Does everything the player holds and trusts make `formula` hold? */
    checkConclusion(formula) {
        return this.#checkAgainstAll({}, [{ not: formula }]);
    }

    /**
     * The world's ties for the things whose states these slots are (a check about a state needs them, though no card
     * the player holds speaks of that thing's states), added to `active`.
     */
    #withTies(active, slots) {
        const things = new Set([...slots].map((s) => this.model.slots.get(s)).filter((sl) => sl?.track).map((sl) => sl.on));
        if (!things.size) return active;
        const have = new Set(active);
        return [...active, ...[...this.model.constraints.values()].filter((k) => k.world && things.has(k.thing) && !have.has(k.id)).map((k) => k.id)];
    }

    #checkAgainstAll(fixed, extra) {
        const active = this.#withTies(this.workingConstraints(), [...Object.keys(fixed), ...extra.flatMap((f) => [...slotsOf(f)])]);
        // Only the questions tied to the answer or the formula need searching: what is held is consistent already.
        if (this.model.problem.consistent(active, fixed, { extra, focus: true }).ok) return { ok: false, reason: 'nothing you hold and trust rules it out yet' };
        return { ok: true, used: this.model.problem.explainConflict(active, fixed, { extra }) };
    }

    shapeFits(slot, value) { return this.model.slots.get(slot).domain.includes(value); }

    /** Could `value` fill `slot`? Trivial checks the held clues; Easy and Hard only the type. */
    plausible(slot, value) {
        if (!this.shapeFits(slot, value)) return { plausible: false, why: 'shape' };
        if (!this.assisted()) return { plausible: true, why: 'shape only' };
        // Judged against what the player trusts, setting aside the claims caught in a clash: a clash elsewhere
        // says nothing about this answer.
        const active = this.#withTies(this.workingConstraints(), [slot]);
        const aside = this.clashes().length;
        if (this.model.problem.consistent(active, { [slot]: value }, { focus: true }).ok) return { plausible: true, aside };
        return { plausible: false, why: 'clues', aside, conflict: this.model.problem.explainConflict(active, { [slot]: value }) };
    }

    /** The game checks answers against the clues for the player (Trivial outright; greying on). */
    assisted() { return this.autoSolves() || this.helps('greying'); }

    /**
     * Trivial: every value the held clues allow, read the way the case reads them (a statement the case knows to
     * be false is not taken at its word), so nothing misleads. Cached until the player holds more.
     */
    autoValues(slot) {
        const key = this.unlocked.size;
        if (this.autoKey !== key) {
            // Everything at once: one pass per group of linked questions is far cheaper than one per question.
            const active = activeConstraints(this.model, this.known()).filter((id) => !this.model.constraints.get(id).derived);
            this.autoCache = this.model.problem.allCandidates(active, [...this.model.slots.keys()]);
            this.autoKey = key; // after: a check handed to the solver's worker comes back here to fill it
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
                : this.routeById.get(r.step).source ? { text: `Holmes: “${this.routeById.get(r.step).source[0].replace(/\s+/g, ' ')}”` }
                    : { text: `Holmes: ${this.model.constraints.get(this.routeById.get(r.step).inference)?.label ?? ''}` }));
        }
        const active = activeConstraints(this.model, this.known()).filter((id) => !this.model.constraints.get(id).derived);
        return (this.model.problem.explainConflict(active, { [slot]: value }) ?? []).map((k) => ({ text: this.model.constraints.get(k).label }));
    }

    /**
     * Easy's automatic list: every value the held clues still allow (as the player reads them), setting aside the
     * claims caught in a clash; otherwise one clash anywhere would leave nothing open anywhere.
     */
    openValues(slot) {
        return this.model.problem.candidates(this.workingConstraints(), slot);
    }

    /**
     * The clashes among what the player trusts: minimal sets of active clues that cannot all hold, found one at a
     * time, each set aside (its claims read as doubted) before looking for the next. Claims are tried last, so a
     * clash rests on as few claims as it can. Cached, and incremental: a clash whose clues are all still active
     * still clashes, so only new ones are searched for. Each: {ids, claims}.
     */
    clashes() {
        const active = this.activeConstraints();
        const key = active.join('|');
        if (this.clashCache?.key === key) return this.clashCache.list;
        // Doubtable: a trusted clue or inference. A clash sets aside what weighs least, by where it came from (never
        // by whether it is true): a story's clue first, then an inference someone else stated, and last one the
        // player built or Holmes drew.
        const isClaim = (id) => !!trustedClaim(this.model, id);
        const weight = (id) => {
            const inf = this.model.constraints.get(id).inference;
            if (!inf) return 0;
            const how = this.inferenceHow.get(inf);
            return how?.how === 'stated' && how.by !== 'holmes' ? 1 : 2;
        };
        const list = [];
        let set = [...active];
        const setAside = (c) => {
            const doubtable = c.ids.filter(isClaim);
            const least = Math.min(...doubtable.map(weight));
            const drop = new Set(doubtable.length ? doubtable.filter((id) => weight(id) === least) : c.ids);
            set = set.filter((id) => !drop.has(id));
            for (const claim of c.claims) {
                if (!drop.has(this.model.claimForms.get(claim)?.trusted)) continue;
                const doubted = this.model.claimForms.get(claim)?.doubted;
                if (doubted && !set.includes(doubted)) set.push(doubted);
            }
        };
        for (const c of this.clashCache?.list ?? []) {
            if (c.ids.every((id) => set.includes(id))) { list.push(c); setAside(c); }
        }
        while (!this.model.problem.consistent(set).ok) {
            const byWeight = (w) => set.filter((id) => isClaim(id) && weight(id) === w);
            const ids = this.model.problem.explainConflict([...set.filter((id) => !isClaim(id)), ...byWeight(2), ...byWeight(1), ...byWeight(0)]);
            const c = { ids, claims: [...new Set(ids.map((id) => trustedClaim(this.model, id)).filter(Boolean))] };
            list.push(c);
            setAside(c);
            const k = ids.join('|');
            if (!this.clashLog.some((x) => x.join('|') === k)) this.clashLog.push(ids);
        }
        this.clashCache = { key, list, working: set };
        return list;
    }

    /** What the player trusts, with the claims caught in a clash set aside (read as doubted). */
    workingConstraints() {
        this.clashes();
        return this.clashCache.working;
    }

    /**
     * Clashes the player has met that no longer stand because they doubted one of its claims: {ids, claims,
     * doubted}. (A clash whose clue the player has not reached again, after a reload of an earlier point, is left out.)
     */
    resolvedClashes() {
        const current = new Set(this.clashes().map((c) => c.ids.join('|')));
        const out = [];
        for (const ids of this.clashLog) {
            if (current.has(ids.join('|'))) continue;
            const claims = [...new Set(ids.map((id) => this.model.constraints.get(id)?.from_claim).filter(Boolean))];
            const doubted = claims.filter((c) => this.suspected.has(c));
            if (doubted.length) out.push({ ids, claims, doubted });
        }
        return out;
    }

    /** A clash replayed as a chain of steps (see Problem.steps), optionally starting from an assumed answer. */
    chain(ids, fixed = {}) {
        return this.model.problem.steps(ids, fixed);
    }

    activeConstraints() {
        return activeConstraints(this.model, this.known(), this.suspected, { heldInferences: !this.autoSolves() }).filter((id) => !this.model.constraints.get(id).derived);
    }

    /** Clues the player trusts that cannot all be true (a minimal set), or null. Trivial shows it. */
    contradiction() {
        return this.clashes()[0]?.ids ?? null;
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

function literalsIn(f, out = []) {
    for (const [op, a] of Object.entries(f)) {
        if (['eq', 'ne'].includes(op)) out.push([a[0], a[1]]);
        else if (['in', 'nin'].includes(op)) for (const v of a[1]) out.push([a[0], v]);
        else if (op === 'and' || op === 'or') for (const g of a) literalsIn(g, out);
        else if (op === 'not') literalsIn(a, out);
        else if (op === 'implies') { literalsIn(a[0], out); literalsIn(a[1], out); }
    }
    return out;
}

/**
 * The questions a formula speaks of. A lookup ("the visitor's establishment is King's Pyland") speaks of its key,
 * the visitor, not of every person's establishment it might select.
 */
function slotsIn(f, out = new Set()) {
    if (!f || typeof f !== 'object') return out;
    const lookup = f.index ?? f.nindex;
    if (lookup) { out.add(lookup[0]); return out; }
    if (f.and || f.or) for (const g of f.and ?? f.or) slotsIn(g, out);
    else if (f.implies) { slotsIn(f.implies[0], out); slotsIn(f.implies[1], out); }
    else if (f.not) slotsIn(f.not, out);
    else slotsOf(f, out);
    return out;
}
