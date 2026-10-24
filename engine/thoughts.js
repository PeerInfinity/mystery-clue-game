// The annotated reading as data (cases/<case>/thoughts.json, mirrored from docs/reading-annotated.md): a careful
// reader's thoughts through the story, each with its earliest paragraph, its premises, its relations to earlier
// thoughts, the clauses it reads, Holmes's paragraph, and `maps` to the case cards that hold it.
//
// checkThoughts() returns errors (the data is wrong) and a report: how far the case's cards cover the thoughts,
// and where the game deals a mapped card later than the reader could have it.
//
// Short chains: each deduction-type thought names one authored inference (`inference`, a
// `k.*` id in constraints.json) whose premises are its cited thoughts' cards. The checker reports, as warnings,
// the thoughts with no inference yet, premises that do not agree with what the thought cites, an inference named
// by two thoughts, inferences no thought names that are not marked `implicit`, and the thoughts whose inference
// the game cannot have dealt by the thought's own paragraph (the earliest date). A rule the inference applies is
// the step's warrant and need not be cited; a premise that is an implicit inference is bookkeeping and
// need not be either. A thought may explain an accepted earliest-date miss in `date_note`. A deduction that can
// have no inference says why in `no_inference` (the older `workstream-3` and `workstream-6` reasons are
// retired, their thoughts all held): `action` (a prediction played as an action), `world-model` (it needs a slot the case lacks yet), `absence` (it rests on an absence the player files), `doubt` (the move doubts an inference rather than drawing one: `t68.3`).

import { Game, BG_RELEVANT, DROP_REASONS, DOUBT_REASONS, CHECK_TEMPLATES, QUESTION_TEMPLATES } from './game.js';
import { READER_MARKS } from './readers.js';

const theoryIds = (model) => new Set((model?.data.theories ?? []).map((x) => x.id));
import { slotsOf } from './logic.js';

export const TAGS = ['RECORD', 'NOTICE', 'ABSENCE', 'QUESTION', 'HYPOTHESIS', 'INFER', 'DEFAULT', 'AGENT', 'PHYSICAL',
    'IDENTIFY', 'WEIGH', 'SOURCE', 'TEST', 'RESIDUE', 'PREDICT', 'TEST PLAN', 'GENRE', 'SET ASIDE', 'DROP', 'REVISE'];
export const SUBTYPES = {
    NOTICE: ['calculate'], QUESTION: ['opportunity', 'motive', 'turn-around'], HYPOTHESIS: ['opportunity', 'motive', 'scenario'],
    DEFAULT: ['period'], IDENTIFY: ['merge', 'split'], GENRE: ['re-read', 'watch-holmes'], INFER: ['opportunity'],
};
export const RELATIONS = ['supports', 'strains', 'refutes', 'undercuts', 'revises', 'drops', 'answers', 'strained_by'];
const CONFIDENCE = ['weak', 'weak to fair', 'fair', 'fair to strong', 'strong'];
const PROFILES = ['typical', 'careful', 'expert'];
// Moves that need no confidence: a fact read, a question asked, a detail set aside, a passage re-read.
const NO_CONFIDENCE = (t) => ['RECORD', 'QUESTION', 'SET ASIDE'].includes(t.tag) || t.subtype === 're-read';
// The deduction-type tags: each such thought becomes one authored inference (short chains, Q1).
export const DEDUCTION = ['INFER', 'DEFAULT', 'AGENT', 'PHYSICAL', 'IDENTIFY'];
// A TEST that concludes something (the costume went to another woman) may name its inference too.
const CAN_NAME = [...DEDUCTION, 'TEST', 'WEIGH', 'SOURCE', 'DROP']; // WEIGH and SOURCE: a belief weighed; DROP: a candidate dropped, "not X"
export const NO_INFERENCE = ['action', 'world-model', 'absence', 'doubt'];

/**
 * @param data   the parsed thoughts.json
 * @param model  a loaded case model (with .story)
 * @param opts   { markdown: text of docs/reading-annotated.md (checked to mirror the data), dates: true to compare
 *               each RECORD's paragraph with where the game deals its cards, and each deduction's paragraph with
 *               where the game has dealt every premise of its inference (reads the story through once),
 *               implicitRequired: true to make an error of an inference that no thought names and is not
 *               `implicit`, and of a deduction that names no inference and gives no `no_inference` reason }
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
        for (const r of ['reader_1892', 'reader_modern']) if (!READER_MARKS.test(b[r] ?? '')) err(`${b.id}: ${r} "${b[r]}" is not a known availability`);
    }

    // Case cards a thought may map to.
    const d = model.data;
    const inferenceById = new Map((d.constraints ?? []).map((k) => [k.id, k]));
    const caseIds = new Set([...model.cards.keys(), ...(d.actions ?? []).map((a) => a.id), ...(d.route ?? []).map((s) => s.id), ...model.slots.keys(), ...(d.theories ?? []).map((x) => x.id), ...(d.puzzles ?? []).map((x) => x.id), ...(d.readings ?? []).map((x) => x.id), ...(d.checks ?? []).map((x) => x.id)]);
    const checkById = new Map((d.checks ?? []).map((c) => [c.id, c]));
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
        // The passage a re-read points back to: read already, within the story.
        if (t.passage && !(t.tag === 'GENRE' && t.subtype === 're-read')) err(`${t.id}: only a GENRE·re-read thought names a passage`);
        if (t.passage && !(Array.isArray(t.passage) && t.passage.length === 2 && t.passage[0] >= 1 && t.passage[0] <= t.passage[1] && t.passage[1] < t.para)) err(`${t.id}: passage ${JSON.stringify(t.passage)} is not paragraphs already read`);
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
        // The cards whose marking as odd counts for a notable detail.
        if (t.notices && t.tag !== 'NOTICE') err(`${t.id}: only a NOTICE thought lists the cards it notices`);
        // An event card too: the odd thing may be that something happened at all (the horse taken, not lamed in his stall).
        for (const x of t.notices ?? []) if (!['claims', 'entities', 'events'].includes(model?.cards.get(x)?.section ?? (caseIds.has(x) ? 'claims' : null))) err(`${t.id}: notices ${x}, which is not a clue, entity or event card`);
        // The card a SET ASIDE thought puts aside, and the answers a hypothesis proposes on a question: the
        // reader's moves the action table makes.
        if (t.aside !== undefined && t.tag !== 'SET ASIDE') err(`${t.id}: only a SET ASIDE thought names a card to set aside`);
        if (t.aside !== undefined && model && !['entities', 'events', 'claims'].includes(model.cards.get(t.aside)?.section)) err(`${t.id}: sets aside ${t.aside}, which is not an entity, event or clue card`);
        if (t.candidates !== undefined && t.tag !== 'HYPOTHESIS') err(`${t.id}: only a HYPOTHESIS thought proposes candidates`);
        if (t.candidates !== undefined && model) {
            const s = model.slots.get(t.candidates.slot);
            if (!s) err(`${t.id}: candidates on ${t.candidates.slot}, which is no question of the case`);
            else for (const v of t.candidates.values ?? []) if (!s.domain.includes(v)) err(`${t.id}: ${v} is no answer to ${t.candidates.slot}`);
            if (!(t.candidates.values ?? []).length) err(`${t.id}: candidates name no answer`);
        }
        // The question a QUESTION thought poses, as a template over cards.
        if (t.asks && t.tag !== 'QUESTION') err(`${t.id}: only a QUESTION thought poses a question`);
        if (t.asks) {
            const tpl = QUESTION_TEMPLATES[t.asks.template];
            if (!tpl) err(`${t.id}: asks with unknown template ${t.asks.template}`);
            else if ((t.asks.cards ?? []).length !== tpl.cards.length) err(`${t.id}: ${t.asks.template} takes ${tpl.cards.length} card(s)`);
            else if (model) t.asks.cards.forEach((x, i) => {
                const c = model.cards.get(x);
                if (!c || !(tpl.cards[i].includes('events') ? c.section === 'events' : c.section === 'entities' && tpl.cards[i].includes(c.kind))) err(`${t.id}: asks about ${x}, which is not of the kinds ${t.asks.template} takes`);
            });
        }
        // The exceptions whose raising counts for a thought: a named exception of a rule
        // that one of the target inference's applications applies.
        for (const x of t.raises ?? []) {
            const k = inferenceById.get(x.target);
            if (!k) { err(`${t.id}: raises an exception against ${x.target}, which is not in constraints.json`); continue; }
            const rules = new Map((model?.data.rules ?? []).map((r) => [r.id, r]));
            if (!(k.rules ?? []).some((u) => (rules.get(u.rule)?.unless ?? []).some((e) => e?.id === x.exception))) err(`${t.id}: ${x.exception} is not a named exception of a rule ${x.target} applies`);
        }
        // What a drop drops in the game: a story theory, a candidate (slot = value), or, by a
        // doubt, an inference; with its reason, the cards it cites, and, where Holmes never takes it up, the paragraph by
        // which the story makes it untenable (the deadline it scores against).
        if (t.dropped) {
            const d = t.dropped;
            if (d.theory && !theoryIds(model).has(d.theory)) err(`${t.id}: drops unknown theory ${d.theory}`);
            if (d.slot && !model?.slots.get(d.slot)?.domain.includes(d.value)) err(`${t.id}: drops ${d.slot} = ${d.value}, not a candidate there`);
            if (d.inference && !inferenceById.has(d.inference)) err(`${t.id}: drops inference ${d.inference}, which is not in constraints.json`);
            if (!d.theory && !d.slot && !d.inference) err(`${t.id}: dropped names no theory, candidate or inference`);
            if (!(d.inference ? DOUBT_REASONS : DROP_REASONS).includes(d.reason)) err(`${t.id}: drop reason ${d.reason} unknown`);
            for (const c of d.cites ?? []) if (!caseIds.has(c)) err(`${t.id}: drop cites unknown ${c}`);
            if (d.deadline !== undefined && !(d.deadline > t.para)) err(`${t.id}: drop deadline ¶${d.deadline} is not after the thought`);
        }
        // The checks a PREDICT or TEST PLAN thought plans: the check, and what it expects of
        // the result (one of the template's outcomes) and, with that, the answer the result would assert.
        if (t.checks && ![t.tag, t.then_tag].some((x) => ['PREDICT', 'TEST PLAN', 'HYPOTHESIS'].includes(x))) err(`${t.id}: only a PREDICT, TEST PLAN or HYPOTHESIS thought plans a check`);
        for (const x of t.checks ?? []) {
            const ck = checkById.get(x.check);
            if (!ck) { err(`${t.id}: plans unknown check ${x.check}`); continue; }
            if (t.para > ck.at) err(`${t.id}: plans ${x.check} after Holmes makes it (¶${ck.at})`);
            if (x.expect !== undefined && !ck.plans.some((p) => CHECK_TEMPLATES[p.verb].outcomes.includes(x.expect))) err(`${t.id}: expects ${x.expect}, not an outcome of ${x.check}`);
            if (x.answer && x.expect === undefined) err(`${t.id}: an expected answer goes with an expected outcome`);
            for (const sl of x.answer ? slotsOf(x.answer) : []) if (!model?.slots.has(sl)) err(`${t.id}: expects an answer over unknown slot ${sl}`);
        }
        if (t.inference !== undefined) {
            if (!CAN_NAME.includes(t.tag)) err(`${t.id}: a ${t.tag} thought names no inference (only ${CAN_NAME.join(', ')} do)`);
            else if (!inferenceById.has(t.inference)) err(`${t.id}: inference ${t.inference} is not in constraints.json`);
        }
        if (t.date_note !== undefined && (typeof t.date_note !== 'string' || !t.inference)) err(`${t.id}: date_note explains the date of a thought's inference`);
        if (t.no_inference !== undefined) {
            if (!NO_INFERENCE.includes(t.no_inference)) err(`${t.id}: no_inference is one of ${NO_INFERENCE.join(', ')}`);
            else if (!DEDUCTION.includes(t.tag)) err(`${t.id}: a ${t.tag} thought needs no no_inference (only ${DEDUCTION.join(', ')} name inferences)`);
            else if (t.inference !== undefined) err(`${t.id}: names an inference and gives no_inference`);
        } else if (implicitRequired && DEDUCTION.includes(t.tag) && t.inference === undefined) err(`${t.id}: a ${t.tag} thought names no inference and gives no no_inference reason`);
    }

    // The ids a thought's prose and remark cite: each one a thought or a background card that exists. The
    // prose is the reader's note at its paragraph, so a thought or paragraph it cites lies no later; looking ahead is
    // the annotator's, in the remark.
    for (const t of thoughts) {
        for (const id of [...citedIds(t.text), ...citedIds(t.remark)]) if (!byId.has(id) && !bkIds.has(id)) err(`${t.id}: its prose cites ${id}, which does not exist`);
        for (const id of citedIds(t.text)) if (byId.get(id)?.para > t.para) err(`${t.id}: its prose cites ${id}, which comes later (¶${byId.get(id).para}); a remark may`);
        for (const x of (t.text ?? '').matchAll(/¶(\d+)/g)) if (+x[1] > t.para) err(`${t.id}: its prose cites ¶${x[1]}, after its own paragraph; a remark may`);
        if (t.remark !== undefined && !(typeof t.remark === 'string' && t.remark.trim())) err(`${t.id}: a remark is some text`);
        // What the autoplay types as the reader's note: the typed form, or else the
        // prose as it stands; either way no ⚠, backtick, ¶, thought or card id, or set in braces, which are the
        // annotation's notation and would run ahead of the story or mean nothing on the page.
        if (t.typed !== undefined && !(typeof t.typed === 'string' && t.typed.trim() && t.text)) err(`${t.id}: a typed note is some text, for a thought with prose`);
        const typed = t.typed ?? t.text;
        if (typed) for (const [what, re] of TYPED_REFUSES) if (re.test(typed)) err(`${t.id}: ${t.typed !== undefined ? 'its typed note' : 'its prose, typed as it stands,'} has ${what}${t.typed !== undefined ? '' : '; give it a typed form'}`);
        // A hindsight mark (⚠) is the annotator's: in the remark, with the level the data records.
        if ((t.text ?? '').includes('⚠')) err(`${t.id}: a ⚠ belongs in the remark, not the reader's note`);
        const mark = t.hindsight === undefined ? null : t.hindsight === 'noted' ? '⚠ fair play' : `⚠ ${t.hindsight}`;
        if (mark ? !(t.remark ?? '').includes(mark) : (t.remark ?? '').includes('⚠')) err(`${t.id}: hindsight ${t.hindsight ?? 'none'}, but its remark ${mark ? `has no "${mark}"` : 'carries a ⚠'}`);
    }

    // The Markdown mirror: the same thoughts, field by field (bold and line breaks aside).
    if (markdown !== null) {
        const md = parseAnnotation(markdown);
        for (const [id, e] of md) {
            const t = byId.get(id);
            if (!t) { err(`${id}: in the annotation but not in thoughts.json`); continue; }
            for (const x of mirrorDiffs(t, e)) err(`${id}: ${x}`);
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
        const reader = readThrough(new Game(model, { background: BG_RELEVANT })); // background facts where relevant, so absences can be filed
        for (const t of thoughts.filter((x) => x.tag === 'RECORD')) {
            for (const id of t.maps ?? []) {
                const at = reader.unlocked.get(id)?.para;
                if (at === undefined) continue; // rules arrive by the background setting; actions are the story's
                if (at > t.para) dateGaps.push({ thought: t.id, card: id, reader: t.para, game: at });
            }
        }
        // A notable detail must be in the player's hand by the thought's paragraph, or it could not be noticed there.
        for (const t of thoughts.filter((x) => x.notices)) for (const id of t.notices) {
            const at = reader.unlocked.get(id)?.para;
            if (at === undefined || at > t.para) err(`${t.id}: notices ${id}, which the game deals ${at === undefined ? 'never' : `at ¶${at}`}, after ¶${t.para}`);
        }
        // A card can be set aside only once the player holds it.
        for (const t of thoughts.filter((x) => x.aside)) {
            const at = reader.unlocked.get(t.aside)?.para;
            if (at === undefined || at > t.para) err(`${t.id}: sets aside ${t.aside}, which the game deals ${at === undefined ? 'never' : `at ¶${at}`}, after ¶${t.para}`);
        }
        // A question can be posed only about cards the player holds by the thought's paragraph.
        for (const t of thoughts.filter((x) => x.asks)) for (const id of t.asks.cards ?? []) {
            const at = reader.unlocked.get(id)?.para;
            if (at === undefined || at > t.para) err(`${t.id}: asks about ${id}, which the game deals ${at === undefined ? 'never' : `at ¶${at}`}, after ¶${t.para}`);
        }
    }
    const claimById = new Map((d.claims ?? []).map((c) => [c.id, c]));
    const chains = checkChains(thoughts, background, inferenceById, byId, dates ? model : null, claimById);
    for (const k of chains.unnamed) if (implicitRequired) err(`${k}: no thought names this inference, and it is not marked implicit`);
    for (const x of chains.implicitNamed) err(`${x.inference}: marked implicit, but ${x.thought} names it`);
    return { errors, coverage, dateGaps, chains, unmappedBackground: background.filter((b) => !(b.maps ?? []).length).map((b) => b.id) };
}

// What a note the autoplay types may not hold.
export const TYPED_REFUSES = [['a ⚠', /⚠/], ['a backtick', /`/], ['a ¶', /¶/], ['a thought or card id', /\b(t\d+\.\d+|(bk|[ckreqa]|pz|rd|ck)\.[a-z_]{2,})\b/], ['a set in braces', /[{}]/]];

// The ids a piece of prose cites: thoughts (t<¶>.<n>) and background cards (bk.<name>).
export const citedIds = (text) => [...(text ?? '').matchAll(/\b(t\d+\.\d+|bk\.[a-z_]+)\b/g)].map((x) => x[1]);

/**
 * docs/reading-annotated.md's thoughts, by id: each entry's header (tag, subtype, confidence, profile, premises,
 * relations, Holmes's paragraphs), its `reads` and its prose, as the data would hold them.
 *
 *   - `t35.6` **WEIGH** · *strong* · careful · from `t12.2` · Holmes ¶226 (contradicts)
 *     reads "It was clear, …"; "…"
 *     The prose, over as many lines as it takes.
 */
export function parseAnnotation(markdown) {
    const out = new Map();
    let cur = null;
    for (const line of markdown.split('\n')) {
        const m = line.match(/^- `(t\d+\.\d+)` \*\*([A-Z ]+?)(?:·([a-z-]+))?\*\*(.*)$/);
        if (m) {
            cur = { id: m[1], tag: m[2], subtype: m[3] ?? null, ...parseHeader(m[4]), reads: null, prose: [], note: null };
            out.set(cur.id, cur);
            continue;
        }
        if (!cur || !/^ {2,}\S/.test(line)) { cur = null; continue; }
        const s = line.trim();
        if (cur.reads === null && !cur.prose.length && cur.note === null && s.startsWith('reads "')) cur.reads = [...s.matchAll(/"([^"]*)"/g)].map((x) => x[1]);
        else if (s.startsWith('*Note:* ')) cur.note = [s.slice(8)];
        else (cur.note ?? cur.prose).push(s);
    }
    for (const e of out.values()) {
        e.text = e.prose.join(' ');
        e.remark = e.note?.join(' ') ?? null;
    }
    return out;
}

function parseHeader(h) {
    const parts = h.split(' · ').map((x) => x.trim());
    const ids = (s) => [...s.matchAll(/`([^`]+)`/g)].map((x) => x[1]);
    const e = { confidence: null, profile: null, from: [], relations: [], holmes: undefined };
    for (const p of parts) {
        let m;
        if ((m = p.match(/^\*([a-z ]+)\*$/))) e.confidence = m[1];
        else if (PROFILES.includes(p)) e.profile = p;
        else if (p.startsWith('from ')) e.from = ids(p);
        else if ((m = p.match(/^Holmes (.*)$/))) e.holmes = m[1].trim() === '—' ? 'never' : { paras: [...m[1].replace(/\([^)]*\)/g, '').matchAll(/¶(\d+)/g)].map((x) => +x[1]), range: /¶\d+–¶\d+/.test(m[1]) };
        else for (const r of p.split(/; |, (?=(?:supports|strains|refutes|undercuts|revises|drops|answers|strained by) )/)) {
            const rm = r.match(/^(supports|strains|refutes|undercuts|revises|drops|answers|strained by) (.*)$/);
            if (rm) for (const x of ids(rm[2])) {
                const [, target, member] = x.match(/^(\S+)(?: \((.*)\))?$/);
                e.relations.push({ type: rm[1].replace(' ', '_'), target, ...(member && { member }) });
            }
        }
    }
    return e;
}

// How a thought's data differs from its entry in the annotation.
function mirrorDiffs(t, e) {
    const out = [];
    const prose = (s) => (s ?? '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    if (e.tag !== t.tag) out.push(`tagged ${e.tag} in the annotation, ${t.tag} in thoughts.json`);
    if (e.subtype !== (t.subtype ?? null)) out.push(`subtype ${e.subtype} in the annotation, ${t.subtype ?? null} in thoughts.json`);
    if (e.confidence !== (t.confidence ?? null)) out.push(`confidence ${e.confidence} in the annotation, ${t.confidence ?? null} in thoughts.json`);
    if (e.profile !== t.profile) out.push(`profile ${e.profile} in the annotation, ${t.profile} in thoughts.json`);
    if (!same([...e.from].sort(), [...(t.from ?? [])].sort())) out.push(`cites ${e.from.join(', ') || 'nothing'} in the annotation, ${(t.from ?? []).join(', ') || 'nothing'} in thoughts.json`);
    const rel = (rs) => rs.map((r) => `${r.type} ${r.target}${r.member ? ` (${r.member})` : ''}`).sort();
    if (!same(rel(e.relations), rel(t.relations ?? []))) out.push(`relations ${rel(e.relations).join('; ') || 'none'} in the annotation, ${rel(t.relations ?? []).join('; ') || 'none'} in thoughts.json`);
    const holmes = (h) => (h === undefined || h === null ? null : h === 'never' || h.never ? 'never' : { paras: h.paras ?? [], range: !!h.range });
    if (!same(holmes(e.holmes), holmes(t.holmes))) out.push(`Holmes ${JSON.stringify(holmes(e.holmes))} in the annotation, ${JSON.stringify(holmes(t.holmes))} in thoughts.json`);
    if (!same(e.reads, t.reads ?? null)) out.push('reads other words in the annotation');
    if (prose(e.text) !== prose(t.text)) out.push('its prose differs from the annotation\'s');
    if (prose(e.remark) !== prose(t.remark)) out.push('its remark differs from the annotation\'s note');
    return out;
}

// The short chains: each deduction-type thought against its inference.
function checkChains(thoughts, background, inferenceById, byId, model, claimById = new Map()) {
    const deductions = thoughts.filter((t) => DEDUCTION.includes(t.tag) || (CAN_NAME.includes(t.tag) && t.inference));
    const bkById = new Map(background.map((b) => [b.id, b]));
    // The case cards a cited item stands for: a thought's inference and the cards it maps to; a background card's rules.
    // A cited WEIGH or SOURCE thought whose inference is a belief about a statement stands for that statement
    // (the statements its rule applications bind): the step weighed it before using it or setting it aside.
    const weighed = (id) => {
        const o = byId.get(id);
        if (!o || !['WEIGH', 'SOURCE'].includes(o.tag)) return [];
        return (inferenceById.get(o.inference)?.rules ?? []).flatMap((u) => Object.values(u.bind ?? {})).filter((x) => claimById.has(x));
    };
    const cardsOf = (id) => {
        if (id.startsWith('bk.')) return new Set(bkById.get(id)?.maps ?? []);
        const o = byId.get(id);
        return new Set([...(o?.inference ? [o.inference] : []), ...(o?.maps ?? [])]);
    };

    // Where the game, read through with background facts arriving where relevant, has dealt each card. An
    // inference is available once all its premises are (whether or not a character states it then), and once the
    // story has dealt the event and proposition cards its conclusion speaks of (before that the player has no
    // question to answer, and a card stating it would deal them early) and the entities whose questions it speaks
    // of (a card naming one would introduce it early).
    let avail = null;
    let askable = null;
    if (model) {
        const reader = readThrough(new Game(model, { background: BG_RELEVANT }));
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
        askable = (k) => Math.max(-1, ...[...slotsOf(k.formula)].map((x) => model.slots.get(x)?.on)
            .filter((o) => ['events', 'propositions', 'entities'].includes(model.cards.get(o)?.section))
            .map((o) => reader.unlocked.get(o)?.para ?? Infinity));
    }

    const rows = [];
    const namedBy = new Map();
    for (const t of deductions) {
        const row = { thought: t.id, tag: t.tag, para: t.para, inference: t.inference ?? null, uncited: [], unheld: [], unmatched: [], warrant: [], bookkeeping: [], dealt: null, note: t.date_note ?? null, none: t.no_inference ?? null };
        rows.push(row);
        const k = inferenceById.get(t.inference);
        if (!k) continue;
        if (!namedBy.has(k.id)) namedBy.set(k.id, []);
        namedBy.get(k.id).push(t.id);
        const premises = new Set(k.premises);
        const covered = new Set();
        // The questions the step answers: its formula's, and its premise inferences' (a cited HYPOTHESIS or
        // QUESTION stands for the question it poses).
        const asked = new Set([k, ...k.premises.map((p) => inferenceById.get(p)).filter(Boolean)].flatMap((x) => [...slotsOf(x.formula)]));
        // Statements the inference binds in its rule applications: it weighs them without resting on them (a denial
        // that, trusted, would contradict the deed).
        const bound = new Set((k.rules ?? []).flatMap((u) => Object.values(u.bind ?? {})));
        const conclusionSlots = new Set(slotsOf(k.formula));
        for (const p of t.from ?? []) {
            const cards = cardsOf(p);
            const hit = [...cards].filter((c) => premises.has(c));
            if (!hit.length && [...cards].some((c) => asked.has(c) || bound.has(c))) continue;
            if (!hit.length) {
                // A weighed statement the step uses (trusted, as weighed) or must set aside (it speaks of the conclusion).
                const used = weighed(p).filter((x) => premises.has(x));
                if (used.length) { used.forEach((c) => covered.add(c)); continue; }
                if (weighed(p).some((x) => [...slotsOf(claimById.get(x).asserts ?? { and: [] })].some((sl) => conclusionSlots.has(sl)))) continue;
            }
            if (hit.length) hit.forEach((c) => covered.add(c));
            else if (cards.size) row.uncited.push(p);
            else row.unheld.push(p); // a thought no card holds yet (a NOTICE, a WEIGH): later workstreams
        }
        // A deduction that itself reads a clause (its own `reads`) holds the claims it maps to.
        for (const c of t.maps ?? []) if (premises.has(c) && !inferenceById.has(c)) covered.add(c);
        const warrants = new Set((k.rules ?? []).map((u) => u.rule));
        for (const p of k.premises.filter((x) => !covered.has(x))) {
            if (warrants.has(p)) row.warrant.push(p);
            else if (inferenceById.get(p)?.implicit) row.bookkeeping.push(p);
            else row.unmatched.push(p);
        }
        if (avail) row.dealt = Math.max(avail(k.id), askable(k));
    }
    const shared = [...namedBy].filter(([, ts]) => ts.length > 1).map(([inference, ts]) => ({ inference, thoughts: ts }));
    const implicit = [...inferenceById.values()].filter((k) => k.implicit).map((k) => k.id);
    const implicitNamed = [...namedBy].filter(([id]) => inferenceById.get(id).implicit).map(([inference, ts]) => ({ inference, thought: ts[0] }));
    // A character's wrong reasoning (`truth: false`, the police's four) is not a reader's step: it becomes a
    // candidate defeated by undercut, strain and drop, so it needs no thought here.
    const wrong = [...inferenceById.values()].filter((k) => k.truth === false && !namedBy.has(k.id)).map((k) => k.id);
    const unnamed = [...inferenceById.values()].filter((k) => !k.implicit && k.truth !== false && !namedBy.has(k.id)).map((k) => k.id);
    return { rows, shared, implicit, implicitNamed, unnamed, wrong };
}

/** Read a game through to the end, filing each absence as soon as it can be filed (a careful reader). */
function readThrough(game) {
    const fileAll = () => { for (const a of game.fileableAbsences()) game.fileAbsence(a.expectation, a.windows[0], a.witness); };
    fileAll();
    while (!game.finished()) { game.advance(); fileAll(); }
    return game;
}
