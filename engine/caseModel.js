// Turns a case (case.json + its parts, already parsed) into the game model: cards, slots, constraints, and a
// solver Problem over them.
//
// Cards: entities, events, claims, rules, glosses, propositions, and inferences (every one has a unique id
// across the case); the player adds applied rules and inferences of their own while playing (addDynamic).
// INFERENCES (constraints.json): reasoning written into the case, each resting on premise cards (clues,
//   background facts, propositions, other inferences), with a formula. Format 0.3: an inference may list the
//   rule applications it uses (`rules: [{rule, bind}]`); verifyInference checks that its premises, so applied,
//   entail its formula. An inference is a card too: the player builds it (or hears a character state it), holds
//   it, and can doubt it, like a clue. Some are false (`truth: false`): a character's wrong reasoning. Two
//   readings decide when one counts: the case's own (validator, route checks), where it holds once its premises
//   are in hand; and a player's (Game, outside Trivial), where it holds while its card is held.
// RULES (knowledge.json): background facts. A rule with a `schema` (a formula with variables, logic.js) or a
//   ground `formula` carries logical content; instantiateRule grounds it against bound cards. A rule without
//   either only switches authored inferences on, as in format 0.2.
// RELATIONS (relations.json): acquainted(animal, person), knew_menu(person)…; every argument tuple is a slot
//   `rel.<name>.<arg>.<arg>`. PROPOSITIONS (propositions.json): intermediate conclusions as boolean slots `p.<name>`,
//   each a card; one with a `means` formula gets a definitional constraint tying it to the world.
// STATES (states.json, the world model): one TRACK per thing and aspect (location `at`, possession `held`, or a
//   named condition), declaring the time windows the case's logic turns on; each is a slot
//   `st.<thing>.<name>.<window>` on the thing's card. Sparse: a window not declared has no slot, and a rule's state
//   term is unconstrained there. Location and possession domains are a place set plus 'elsewhere' (and, for
//   possession, the holders); a place's `within` folds it into the listed place that contains it.
// Slots: one per event facet, per entity facet, per claim truth, per relation tuple, per proposition, plus the
//   explicitly declared slots.
// Constraints: one per claim that asserts something (premise: the claim itself), plus the authored reasoning
//   constraints (premises: the claims and rules they rest on).
//
// TRUST: every claim has two readings. TRUSTED: what it says holds. DOUBTED: what it says holds exactly when its
// truth slot is 'true'. The case's own reading (what the validator checks) doubts the claims marked `truth_slot`
// and trusts the rest; a player trusts every claim until they mark it suspect. The reading the case does not use
// is a VARIANT constraint, and the truth slot of a claim the case trusts is LATENT: both exist only for the
// player's view, and the validator skips them.

import { Problem } from './solver.js';
import { slotsOf, literalsOf, ground, isGround, varsOf, render } from './logic.js';
import { stepsFromThoughts } from './steps.js';

export const CARD_SECTIONS = ['entities', 'events', 'claims', 'rules', 'glosses', 'propositions'];
export const RULE_STRENGTHS = ['hard', 'default', 'heuristic'];

/** Merge case.json with its parts. `parts` maps a part file name to its parsed JSON. */
export function mergeCase(main, parts) {
    const out = { ...main };
    for (const name of main.parts ?? []) {
        const part = parts[name];
        if (!part) throw new Error(`missing case part ${name}`);
        for (const [key, value] of Object.entries(part)) {
            if (key.startsWith('$') || key === 'description') continue;
            if (!Array.isArray(value)) throw new Error(`${name}: section ${key} must be an array`);
            out[key] = [...(out[key] ?? []), ...value];
        }
    }
    return out;
}

// Hypothetical things stay in: a theory may need them (the police's duplicate key).
const EXCLUDED_FROM_DOMAINS = ['placeholder', 'fiction_within_story'];

export function buildModel(data) {
    // Holmes's steps come from the annotated reading (Round 57).
    if (!data.route && data.thoughts) data.route = stepsFromThoughts(data);
    const cards = new Map();
    const errors = [];
    const addCard = (section, item) => {
        if (cards.has(item.id)) errors.push(`duplicate id ${item.id}`);
        cards.set(item.id, { ...item, section });
    };
    for (const section of CARD_SECTIONS) for (const item of data[section] ?? []) addCard(section, item);
    for (const item of data.constraints ?? []) addCard('inferences', { ...item, text: item.label });

    const windows = data.time.windows;
    const timeOrder = new Map(windows.map((w, i) => [w.id, i]));
    const scenes = data.scenes;
    const sceneOrder = new Map(scenes.map((s, i) => [s.id, i]));

    const entities = data.entities ?? [];
    const domainFor = (spec, self) => {
        if (spec.values) return [...spec.values];
        if (spec.time) return windows.map((w) => w.id);
        const out = entities
            .filter((e) => spec.kinds.includes(e.kind))
            .filter((e) => !(e.flags ?? []).some((f) => EXCLUDED_FROM_DOMAINS.includes(f)))
            .map((e) => e.id);
        if (self && !out.includes(self)) out.push(self);
        return out;
    };
    /**
     * The cards a variable, quantifier or relation argument ranges over: {kind|kinds|section|only|trait|also}.
     * `section: 'event'` ranges over event cards; kinds over entities (placeholders and fiction excluded);
     * `only` restricts to a list; `trait` keeps the cards that carry it; `also` adds cards.
     */
    const hasTrait = (id, trait) => (cards.get(id)?.traits ?? []).some((t) => t.id === trait);
    const cardsOf = (spec) => {
        let out;
        if (spec.only) out = [...spec.only];
        else if (spec.placeholder) out = entities.filter((e) => (e.flags ?? []).includes('placeholder') && (!(spec.kind || spec.kinds) || (spec.kinds ?? [spec.kind]).includes(e.kind))).map((e) => e.id); // a card standing for someone not yet identified
        else if (spec.section === 'event' || spec.section === 'events') out = (data.events ?? []).map((e) => e.id);
        else if (spec.kind || spec.kinds) out = domainFor({ kinds: spec.kinds ?? [spec.kind] });
        else if (spec.window) out = [...windows.map((w) => w.id), ...subwindows.keys()];
        else if (spec.condition) out = (data.state_conditions ?? []).map((c) => c.id);
        else if (spec.proposition) out = (data.propositions ?? []).map((x) => x.id);
        else if (spec.statement) out = (data.claims ?? []).filter((c) => statementOf(c, entities)).map((c) => c.id);
        else if (spec.trait) out = entities.filter((e) => !(e.flags ?? []).some((f) => EXCLUDED_FROM_DOMAINS.includes(f))).map((e) => e.id);
        else out = [];
        if (spec.trait) out = out.filter((id) => hasTrait(id, spec.trait));
        for (const x of spec.also ?? []) if (!out.includes(x)) out.push(x);
        return out;
    };

    // ---- slots ----
    const slots = new Map();
    const addSlot = (slot) => {
        if (slots.has(slot.id)) errors.push(`duplicate slot ${slot.id}`);
        slots.set(slot.id, slot);
    };
    const facetSlot = (owner, facet, value) => {
        const type = data.facet_types[facet];
        if (!type) {
            errors.push(`${owner.id}: facet '${facet}' has no facet_types entry (declare it in slots.json instead)`);
            return;
        }
        addSlot({
            id: `${owner.id}.${facet}`,
            on: owner.id,
            facet,
            prompt: type.prompt,
            // An identity is chosen among cards of the placeholder's own kind, or the placeholder itself
            // ("nobody else in the story").
            domain: facet === 'identity' ? domainFor({ kinds: [owner.kind] }, owner.id) : domainFor(type),
            answer: Array.isArray(value) || value === null ? null : value,
            undetermined: Array.isArray(value) ? value : value === null ? true : undefined,
            labels: type.labels,
            reveal: type.reveal,
        });
    };
    for (const e of data.events ?? []) for (const [facet, value] of Object.entries(e.facets ?? {})) facetSlot(e, facet, value);
    for (const e of entities) for (const [facet, value] of Object.entries(e.facets ?? {})) facetSlot(e, facet, value);
    for (const c of data.claims ?? []) {
        if (c.truth_slot) {
            addSlot({
                id: `${c.id}.truth`, on: c.id, facet: 'truth', prompt: 'Is it true?',
                domain: ['true', 'false'],
                answer: c.truth_undetermined ? null : c.truth ? 'true' : 'false',
                undetermined: c.truth_undetermined ? true : undefined,
            });
        } else if (c.asserts && !c.derived) {
            addSlot({ id: `${c.id}.truth`, on: c.id, facet: 'truth', prompt: 'Is it true?', domain: ['true', 'false'], answer: 'true', latent: true });
        }
    }
    // An inference's truth, like a clue's: open in the case's reading when it is false, latent when it is true.
    for (const k of data.constraints ?? []) {
        const isFalse = k.truth === false;
        addSlot({ id: `${k.id}.truth`, on: k.id, facet: 'truth', prompt: 'Does it hold?', domain: ['true', 'false'], answer: isFalse ? 'false' : 'true', ...(isFalse ? {} : { latent: true }) });
    }
    for (const s of data.slots ?? []) {
        const domain = s.domain.values ? [...s.domain.values] : domainFor(s.domain, s.domain.include_self ? s.on : null);
        for (const extra of s.domain.also ?? []) if (!domain.includes(extra)) domain.push(extra);
        addSlot({
            id: s.id, on: s.on, facet: s.facet ?? 'custom', prompt: s.prompt, domain,
            answer: Array.isArray(s.answer) || s.answer === null ? null : s.answer,
            undetermined: Array.isArray(s.answer) ? s.answer : s.answer === null ? true : undefined,
            labels: s.domain.labels,
            reveal: s.domain.reveal,
            note: s.note,
        });
    }
    // Relations: one slot per argument tuple. `on` is the first argument's card (a 0-ary relation has none).
    const relations = new Map();
    for (const r of data.relations ?? []) {
        if (relations.has(r.id)) errors.push(`duplicate relation ${r.id}`);
        const argValues = (r.args ?? []).map(cardsOf);
        for (const [i, vs] of argValues.entries()) {
            for (const v of vs) if (!cards.has(v) && !windows.some((w) => w.id === v)) errors.push(`relation ${r.id}: argument ${i} ranges over unknown ${v}`);
        }
        const values = r.values ? (r.values.values ? [...r.values.values] : domainFor(r.values)) : ['true', 'false'];
        const answers = new Map((r.answers ?? []).map((row) => [row.slice(0, -1).join('.'), row[row.length - 1]]));
        const open = new Set((r.open ?? []).map((row) => row.join('.')));
        const slotId = (args) => (args.every((a, i) => argValues[i].includes(a)) ? `rel.${r.id}${args.length ? `.${args.join('.')}` : ''}` : null);
        let combos = [[]];
        for (const vs of argValues) combos = combos.flatMap((c) => vs.map((v) => [...c, v]));
        for (const args of combos) {
            const key = args.join('.');
            const answer = answers.has(key) ? answers.get(key) : open.has(key) ? null : (r.default_answer ?? null);
            if (answer !== null && !values.includes(answer)) errors.push(`relation ${r.id}: answer ${answer} for (${key}) is not among its values`);
            addSlot({
                id: slotId(args), on: args[0] ?? r.id, facet: 'relation', relation: r.id, args,
                prompt: (r.prompt ?? `${r.id}(${args.map((a) => `{${a}}`).join(', ')})?`).replace(/\{(\d+)\}/g, (m, i) => `{${args[+i]}}`),
                domain: values, answer, undetermined: answer === null ? true : undefined,
                labels: r.labels,
            });
        }
        relations.set(r.id, { ...r, argValues, values, slotId, outside: r.outside ?? 'error' });
    }
    // Splits (the world model): a window, or a part of one, split at an event into the part before it and the part
    // after it (`<parent>.before.<event>`, `<parent>.after.<event>`), each a time a state can be declared at. Which
    // part an event falls in is an ORDER question, `ord.<event>.<splitter>` (before/after), one per event that may
    // share the window; its answer is the events' fabula order, open unless a claim states it.
    const subwindows = new Map();   // id -> {id, parent, root, path: [[dir, event]...], label}
    let makeSplit = null;
    const orderSlot = (a, e) => `ord.${a.replace(/^e\./, '')}.${e.replace(/^e\./, '')}`;
    {
        const events = data.events ?? [];
        const eventById = new Map(events.map((e) => [e.id, e]));
        const statedEarly = new Map();
        for (const c of data.claims ?? []) {
            if (c.truth_slot || c.derived || !c.asserts) continue;
            for (const f of c.asserts.and ?? [c.asserts]) if (f.eq && typeof f.eq[0] === 'string') statedEarly.set(f.eq[0], f.eq[1]);
        }
        const claimed = new Set();
        for (const c of data.claims ?? []) for (const m of JSON.stringify(c.asserts ?? {}).matchAll(/"(ord\.[a-z0-9_.]+)"/g)) claimed.add(m[1]);
        // Two events a claim puts in order within one window (`seq`, Round 73): an order question of their own,
        // `ord.<a>.<b>`, whether or not a split asks it. The world's order ties carry it into the splits' questions.
        const sequenced = [];
        for (const c of data.claims ?? []) for (const [a, b] of seqPairs(c.asserts)) {
            claimed.add(orderSlot(a, b));
            sequenced.push([a, b]);
        }
        // One split: its two parts and an order question for each event that may share the window. `opened`: a
        // split the player made (openSplit), whose order questions have no answer of their own.
        makeSplit = (sp, opened = false) => {
            const made = { parts: [], slots: [] };
            const parent = timeOrder.has(sp.window) ? { id: sp.window, root: sp.window, path: [] } : subwindows.get(sp.window);
            if (!parent) { errors.push(`split: unknown window ${sp.window}`); return made; }
            const by = eventById.get(sp.by);
            if (!by) { errors.push(`split of ${sp.window}: unknown event ${sp.by}`); return made; }
            for (const dir of ['before', 'after']) {
                const id = `${parent.id}.${dir}.${sp.by.replace(/^e\./, '')}`;
                if (subwindows.has(id)) { errors.push(`split ${id} declared twice`); continue; }
                subwindows.set(id, { id, parent: parent.id, root: parent.root, by: sp.by, dir, path: [...parent.path, [dir, sp.by]], ...(opened ? { opened: true } : {}) });
                made.parts.push(id);
            }
            for (const e of events) {
                // An event may fall in the split part unless a clue the case trusts puts it in another window.
                const when = statedEarly.get(`${e.id}.time`);
                if (e.id === sp.by || !e.facets?.time || (when !== undefined && when !== parent.root)) continue;
                const id = orderSlot(e.id, sp.by);
                if (slots.has(id)) continue;
                made.slots.push(id);
                addSlot({
                    id, on: e.id, facet: 'order', prompt: `Did it happen before or after {${sp.by}}?`, domain: ['before', 'after'],
                    answer: opened ? null : (e.fabula_order ?? 0) < (by.fabula_order ?? 0) ? 'before' : 'after',
                    undetermined: !opened && claimed.has(id) ? undefined : true,
                    labels: { before: 'Before', after: 'After' },
                    ...(opened ? { opened: true } : {}),
                });
            }
            return made;
        };
        for (const sp of data.state_splits ?? []) makeSplit(sp);
        for (const [a, b] of sequenced) {
            const id = orderSlot(a, b);
            const [ea, eb] = [eventById.get(a), eventById.get(b)];
            if (!ea || !eb) { errors.push(`seq: unknown event ${ea ? b : a}`); continue; }
            if (slots.has(id)) continue;
            addSlot({
                id, on: a, facet: 'order', prompt: `Did it happen before or after {${b}}?`, domain: ['before', 'after'],
                answer: (ea.fabula_order ?? 0) < (eb.fabula_order ?? 0) ? 'before' : 'after',
                labels: { before: 'Before', after: 'After' },
            });
        }
    }
    const isTime = (id) => timeOrder.has(id) || subwindows.has(id);
    const rootOf = (id) => (timeOrder.has(id) ? id : subwindows.get(id)?.root);
    // States: one track per thing and aspect, one slot per declared window or part of one. A state holds THROUGHOUT
    // its time: a thing that moves within a window has no state there, only in the parts on either side of the move.
    // A listed place stands for itself apart from the listed places inside it; 'elsewhere' is outside them all.
    const stateTracks = new Map();
    let makeTrack = null;
    {
        const sets = new Map((data.state_places ?? []).map((x) => [x.id, x.places]));
        const within = new Map(entities.filter((e) => e.within).map((e) => [e.id, e.within]));
        const up = (p) => { const out = []; for (let q = within.get(p); q && !out.includes(q); q = within.get(q)) out.push(q); return out; };
        const conditions = new Map((data.state_conditions ?? []).map((x) => [x.id, x]));
        // Aims (step 5, intention): what a person is trying to do. One vocabulary with the purposes of acts, so that an
        // act's purpose is its agent's aim at its time (trackTies).
        const aims = (data.state_aims ?? []).map((x) => x.id);
        const aimLabels = Object.fromEntries((data.state_aims ?? []).map((x) => [x.id, x.label]));
        // Knowledge (step 5): does the thing know a proposition? One track per thing and proposition, named
        // knows_<proposition>, true or false in each window.
        const propositions = new Map((data.propositions ?? []).map((x) => [x.id, x]));
        const windowLabel = new Map(windows.map((w) => [w.id, w.label]));
        const timeLabel = (id) => {
            if (timeOrder.has(id)) return windowLabel.get(id);
            const sw = subwindows.get(id);
            return `${timeLabel(sw.parent)}, ${sw.dir} {${sw.by}}`;
        };
        // A track, and its windows (each a slot); `addWindow` serves the player's opened states too (openState).
        makeTrack = (t) => {
            const name = t.aspect === 'location' ? 'at' : t.aspect === 'possession' ? 'held' : t.aspect === 'intention' ? 'aims' : t.aspect === 'knowledge' ? knowsName(t.knows) : t.aspect === 'belief' ? believesName(t.believes) : t.condition;
            if (t.aspect === 'knowledge' && !propositions.has(t.knows)) errors.push(`${t.id}: knows ${t.knows}, which is not a proposition`);
            // Belief (workstream 4): of a proposition, or of a statement's own content (a claim: what the speaker said).
            if (t.aspect === 'belief' && !propositions.has(t.believes) && !(data.claims ?? []).some((c) => c.id === t.believes)) errors.push(`${t.id}: believes ${t.believes}, which is neither a proposition nor a claim`);
            if (t.aspect === 'condition' && !conditions.has(t.condition)) errors.push(`${t.id}: unknown condition ${t.condition}`);
            const places = typeof t.places === 'string' ? sets.get(t.places) : t.places ?? [];
            if (!places) errors.push(`${t.id}: unknown place set ${t.places}`);
            const domain = t.aspect === 'condition' || t.aspect === 'knowledge' || t.aspect === 'belief' ? ['true', 'false'] : t.aspect === 'intention' ? aims
                : [...new Set([...(t.aspect === 'possession' ? domainFor({ kinds: t.holders ?? ['person', 'animal', 'group'] }) : []), ...(places ?? []), 'elsewhere'])];
            // A listed place stands for itself apart from the listed places inside it (the stable apart from its
            // loft): a thing at a place is at the nearest listed place containing it, or 'elsewhere'. `overlaps(v)`:
            // the value a thing at v takes; `inside(v)`: the values a thing NOT at v cannot take.
            const fold = (v) => {
                if (domain.includes(v)) return v;
                if (t.aspect === 'condition' || t.aspect === 'intention' || t.aspect === 'knowledge' || t.aspect === 'belief') return null;
                for (const p of up(v)) if (domain.includes(p)) return p;
                return 'elsewhere';
            };
            const overlaps = (v) => { const f = fold(v); return f === null ? [] : [f]; };
            const inside = (v) => (domain.includes(v) && v !== 'elsewhere' ? [v] : []);
            const key = `${name}|${t.of}`;
            if (stateTracks.has(key)) errors.push(`${t.id}: a second ${name} track for ${t.of}`);
            const slotOfTime = new Map();
            const ask = t.aspect === 'location' ? `Where was {${t.of}}?` : t.aspect === 'possession' ? `Who had {${t.of}}?`
                : t.aspect === 'intention' ? `What was {${t.of}} trying to do?`
                    : t.aspect === 'knowledge' ? `Did {${t.of}} know this: “${propositions.get(t.knows)?.text ?? t.knows}”?`
                        : t.aspect === 'belief' ? `Did {${t.of}} believe this: “${propositions.get(t.believes)?.text ?? cards.get(t.believes)?.text ?? t.believes}”?` : (conditions.get(t.condition)?.prompt ?? `${t.condition}({0})?`).replace('{0}', `{${t.of}}`);
            const times = [];
            const addWindow = (w, answer, extra = {}) => {
                const id = `${t.id}.${w.replace(/^w\./, '')}`;
                slotOfTime.set(w, id);
                times.push(w);
                addSlot({
                    id, on: t.of, facet: 'state', aspect: t.aspect, state: name, track: t.id, window: w, root: rootOf(w),
                    splitBy: subwindows.get(w)?.path.map(([, e]) => e) ?? [],
                    prompt: `${ask} (${timeLabel(w)})`, domain,
                    answer, undetermined: answer === null ? true : undefined,
                    labels: t.aspect === 'condition' ? undefined : t.aspect === 'intention' ? aimLabels : t.aspect === 'knowledge' ? { true: 'Knew it', false: 'Did not know it' } : t.aspect === 'belief' ? { true: 'Believed it', false: 'Did not believe it' } : { elsewhere: 'Somewhere else' },
                    ...(t.latent ? { latent: true } : {}),
                    ...extra,
                });
                return id;
            };
            for (const [w, answer] of Object.entries(t.windows ?? {})) {
                if (!isTime(w)) { errors.push(`${t.id}: unknown window ${w}`); continue; }
                addWindow(w, answer);
            }
            const removeWindow = (w) => {
                slots.delete(slotOfTime.get(w));
                slotOfTime.delete(w);
                times.splice(times.indexOf(w), 1);
            };
            const track = { ...t, name, domain, overlaps, inside, times, slotFor: (w) => slotOfTime.get(w) ?? null, addWindow, removeWindow };
            stateTracks.set(key, track);
            return track;
        };
        for (const t of data.states ?? []) makeTrack(t);
        // Belief over statements (workstream 4, Round 87): whoever testifies or admits something has a belief about
        // what he said, at the time he said it (`said_at`, else his scene's time). Unless the case declares that
        // track, it is latent, like a clue's truth: open, and no part of the uniqueness check.
        // A reporting chain (Round 89) gives each speaker along it a belief of his own, at the time he passed it on.
        for (const c of data.claims ?? []) {
            for (const sp of statementOf(c, entities, data.scenes)?.speakers ?? []) {
                if (stateTracks.has(`${believesName(c.id)}|${sp.by}`) || !sp.at || !isTime(sp.at)) continue;
                makeTrack({ id: `st.${sp.by}.${believesName(c.id)}`, of: sp.by, aspect: 'belief', believes: c.id, windows: { [sp.at]: null }, latent: true });
            }
        }
    }
    // Propositions: boolean slots, each on its own card.
    for (const p of data.propositions ?? []) {
        addSlot({
            id: p.id, on: p.id, facet: 'proposition', prompt: p.prompt ?? 'Is it so?', domain: ['true', 'false'],
            answer: p.answer === undefined ? 'true' : p.answer, undetermined: p.answer === null ? true : undefined,
        });
    }

    const model_isPlace = (id) => entities.some((e) => e.id === id && e.kind === 'place');
    // ---- grounding environment (schemas, relation terms, quantifiers) ----
    const env = {
        bind: {},
        hasSlot: (id) => slots.has(id),
        domainOf: (id) => slots.get(id)?.domain ?? [],
        relation: (name) => relations.get(name) ?? null,
        // A proposition names its knowledge track (a rule's ?fact bound to p.x reads knows_x); a statement names the
        // speaker's belief in it (?stmt bound to c.x reads believes_x).
        state: (name, thing) => stateTracks.get(`${String(name).startsWith('p.') ? knowsName(name) : String(name).startsWith('c.') ? believesName(name) : name}|${thing}`) ?? null,
        isWindow: isTime,
        cards: cardsOf,
    };
    const groundOrError = (owner, f, bind = {}) => {
        try { return ground(f, { ...env, bind }); } catch (e) { errors.push(`${owner}: ${e.message}`); return null; }
    };
    // Claims may use relation terms and `only`: ground them once (the card keeps the ground formula).
    for (const c of data.claims ?? []) {
        if (!c.asserts) continue;
        const g = isGround(c.asserts) ? c.asserts : groundOrError(c.id, c.asserts);
        if (g) cards.get(c.id).asserts = g;
    }
    for (const p of data.propositions ?? []) {
        if (!p.means) continue;
        const g = isGround(p.means) ? p.means : groundOrError(p.id, p.means);
        if (g) cards.get(p.id).means = g;
    }
    for (const r of data.rules ?? []) {
        if (r.strength && !RULE_STRENGTHS.includes(r.strength)) errors.push(`${r.id}: unknown strength ${r.strength}`);
        if (r.schema) {
            const used = varsOf(r.schema.formula);
            for (const v of used) if (!(v in (r.schema.vars ?? {}))) errors.push(`${r.id}: schema uses ?${v}, which its vars do not declare`);
            for (const v of Object.keys(r.schema.vars ?? {})) if (!used.has(v)) errors.push(`${r.id}: schema declares ?${v} but never uses it`);
        }
        if (r.formula && !isGround(r.formula)) {
            const g = groundOrError(r.id, r.formula);
            if (g) cards.get(r.id).formula = g;
        }
    }

    // ---- constraints ----
    const constraints = new Map();
    const addConstraint = (k) => {
        if (constraints.has(k.id)) errors.push(`duplicate constraint ${k.id}`);
        constraints.set(k.id, k);
    };
    const claimForms = new Map();   // claim id -> {trusted, doubted} constraint ids
    for (const c of data.claims ?? []) {
        const asserts = cards.get(c.id).asserts;
        if (!asserts) continue;
        const doubted = {
            and: [
                { implies: [{ eq: [`${c.id}.truth`, 'true'] }, asserts] },
                { implies: [{ eq: [`${c.id}.truth`, 'false'] }, { not: asserts }] },
            ],
        };
        const base = { label: c.text, premises: [c.id], from_claim: c.id, derived: !!c.derived };
        // A derived claim's constraint is what the player earns by proving it; it is never part of the
        // evidence the uniqueness check runs on.
        addConstraint({ ...base, id: `k.${c.id}`, formula: c.truth_slot ? doubted : asserts });
        if (c.derived) continue;
        if (c.truth_slot) {
            addConstraint({ ...base, id: `k.${c.id}#trusted`, formula: asserts, variant: true });
            claimForms.set(c.id, { trusted: `k.${c.id}#trusted`, doubted: `k.${c.id}` });
        } else {
            addConstraint({ ...base, id: `k.${c.id}#doubted`, formula: doubted, variant: true });
            claimForms.set(c.id, { trusted: `k.${c.id}`, doubted: `k.${c.id}#doubted` });
        }
        // A statement doubted in one of two readings (workstream 4): mistaken (the speaker believed it, and it is
        // false) or lying (he did not believe it). Both read his belief at the time he spoke.
        // Along a reporting chain each speaker's belief can be the one that failed: the kinds then name him
        // ('lying:straker', 'mistaken:mrs_straker').
        const speakers = statementOf(c, entities, data.scenes)?.speakers ?? [];
        const forms = claimForms.get(c.id);
        for (const sp of speakers) {
            const track = stateTracks.get(`${believesName(c.id)}|${sp.by}`);
            const b = track?.times.length ? track.slotFor(sp.at && track.slotFor(sp.at) ? sp.at : track.times[0]) : null;
            if (!b) continue;
            const tag = speakers.length > 1 ? `:${sp.by}` : '';
            for (const [kind, v] of [['mistaken', 'true'], ['lying', 'false']]) {
                addConstraint({ ...base, id: `k.${c.id}#${kind}${tag}`, formula: { and: [{ eq: [`${c.id}.truth`, 'false'] }, { not: asserts }, { eq: [b, v] }] }, variant: true });
                forms[`${kind}${tag}`] = `k.${c.id}#${kind}${tag}`;
            }
            (forms.beliefs ??= {})[sp.by] = b;
            if (speakers.length === 1) forms.belief = b;
        }
    }
    // What a clue tells for certain, whatever the player makes of its content (`said`: e.g. that the speaker was
    // certain of it): true whenever the clue is held, doubted or not.
    for (const c of data.claims ?? []) {
        if (!c.said || c.derived) continue;
        const g = isGround(c.said) ? c.said : groundOrError(c.id, c.said);
        if (g) addConstraint({ id: `k.${c.id}#said`, label: c.text, premises: [c.id], said_of: c.id, formula: g });
    }
    // A proposition's meaning: p.x = true exactly when its `means` formula holds. Always active (no premises).
    for (const p of data.propositions ?? []) {
        const means = cards.get(p.id).means;
        if (!means) continue;
        addConstraint({
            id: `k.${p.id}#def`, label: `“${p.text}” means: ${render(means)}`, premises: [], definition: true, from_proposition: p.id,
            formula: { and: [{ implies: [{ eq: [p.id, 'true'] }, means] }, { implies: [{ eq: [p.id, 'false'] }, { not: means }] }] },
        });
    }
    let worldContext = null;
    // The world model's own workings (definitions, always active, no card): whoever does a thing, or has it done to
    // them, is where it is done when it is done; a holder is where the thing held is; a thing held at a place lies
    // there; the events that split a window keep their order. Stated over the declared states only (sparse).
    {
        // A tie between a thing and its events holds wherever the thing's states are in play: once some active card
        // speaks of them (activeConstraints). Ties for things nothing speaks of would only widen every search.
        const world = (id, label, formula, thing = null) => {
            if (formula.true) return;
            addConstraint({ id, label, premises: [], world: true, thing, ...(thing ? {} : { definition: true }), formula });
        };
        const ctx = { data, slots, subwindows, timeOrder, env, stateTracks, orderSlot, isPlace: model_isPlace, stated: statedOutright(data), makeTrack, makeSplit, isTime };
        const inTime = (a, w) => inTimeConds(ctx, a, w);
        for (const t of stateTracks.values()) for (const k of trackTies(ctx, t)) world(k.id, k.label, k.formula, k.thing);
        worldContext = ctx;
        for (const k of orderTies(ctx)) world(k.id, k.label, k.formula);
    }
    for (const k of data.constraints ?? []) {
        if (!isGround(k.formula)) {
            const g = groundOrError(k.id, k.formula);
            if (g) cards.get(k.id).formula = g;
        }
        const formula = cards.get(k.id).formula;
        addInferenceConstraints({ constraints: addConstraint, claimForms }, { ...k, formula });
        // The rule applications it lists are part of its derivation: active with it (the case's reading: once its
        // premises are in hand; a player's: while the inference is held), and set aside when it is doubted.
        (k.rules ?? []).forEach((use, i) => {
            const rule = cards.get(use.rule);
            if (!rule || rule.section !== 'rules' || !(rule.schema || rule.formula)) { errors.push(`${k.id}: applies ${use.rule}, which is not a background fact with a formula`); return; }
            let g;
            try { g = rule.schema ? ground(rule.schema.formula, { ...env, bind: use.bind ?? {} }) : rule.formula; } catch (e) { errors.push(`${k.id}: ${use.rule}: ${e.message}`); return; }
            addConstraint({ id: `${k.id}#rule${i + 1}`, label: `${rule.text} (as applied in: ${k.label})`, by: k.by, premises: [...new Set([...k.premises, ...Object.values(use.bind ?? {}).filter((c) => cards.has(c))])], inference: k.id, doubt_with: k.id, rule: use.rule, bind: use.bind ?? {}, formula: g });
        });
    }

    // A route step's conclusion may use relation terms too: ground it once.
    for (const step of data.route ?? []) {
        const f = step.concludes?.formula;
        if (f && !isGround(f)) {
            const g = groundOrError(step.id, f);
            if (g) step.concludes = { ...step.concludes, formula: g };
        }
    }

    for (const k of constraints.values()) {
        for (const s of slotsOf(k.formula)) {
            if (!slots.has(s)) errors.push(`constraint ${k.id} names unknown slot ${s}`);
        }
        for (const p of k.premises) if (!cards.has(p)) errors.push(`constraint ${k.id}: unknown premise ${p}`);
    }
    for (const k of data.constraints ?? []) {
        for (const use of k.rules ?? []) {
            if (!k.premises.includes(use.rule)) errors.push(`constraint ${k.id}: applies ${use.rule}, which is not among its premises`);
        }
    }

    const model = { data, cards, slots, constraints, claimForms, relations, stateTracks, subwindows, env, timeOrder, sceneOrder, windows, scenes, errors, problem: null, dynamic: new Map(), worldContext, opened: [], openedSplits: [] };
    if (!errors.length) rebuildProblem(model);
    model.relevant = relevantCards(model);
    // Verify every authored inference once (the report shows which are checked, which merely asserted).
    model.verified = new Map();
    if (model.problem) for (const k of data.constraints ?? []) model.verified.set(k.id, verifyInference(model, k));
    return model;
}

/** The trusted and doubted readings of an inference-like card (authored, or a player's), as constraints. */
function addInferenceConstraints(into, k) {
    const add = typeof into.constraints === 'function' ? into.constraints : (c) => into.constraints.set(c.id, c);
    const doubted = {
        and: [
            { implies: [{ eq: [`${k.id}.truth`, 'true'] }, k.formula] },
            { implies: [{ eq: [`${k.id}.truth`, 'false'] }, { not: k.formula }] },
        ],
    };
    const base = { label: k.label, by: k.by, premises: k.premises, from_claim: k.id, inference: k.id, ...(k.applied ? { applied: k.applied } : {}) };
    if (k.truth === false) {
        add({ ...base, id: k.id, formula: doubted });
        add({ ...base, id: `${k.id}#trusted`, formula: k.formula, variant: true });
        into.claimForms.set(k.id, { trusted: `${k.id}#trusted`, doubted: k.id });
    } else {
        add({ ...base, id: k.id, formula: k.formula });
        add({ ...base, id: `${k.id}#doubted`, formula: doubted, variant: true });
        into.claimForms.set(k.id, { trusted: k.id, doubted: `${k.id}#doubted` });
    }
}

/** (Re)build the solver over the model's current slots and constraints. */
export function rebuildProblem(model) {
    const args = {
        domains: new Map([...model.slots.values()].map((s) => [s.id, s.domain])),
        constraints: [...model.constraints.values()],
        timeOrder: model.timeOrder,
    };
    // The page may put the problem at arm's length (engine/remoteProblem.js): its worker gets the same one.
    model.problem = model.wrapProblem ? model.wrapProblem(new Problem(args), args) : new Problem(args);
    return model.problem;
}

/**
 * Ground a rule against bound cards. `bind` maps each schema variable to a card id.
 * Returns {ok, formula, premises} (premises: the rule and the bound cards) or {ok: false, error}.
 * A rule with a ground `formula` and no schema takes no bindings.
 */
export function instantiateRule(model, ruleId, bind = {}) {
    const rule = model.cards.get(ruleId);
    if (!rule || rule.section !== 'rules') return { ok: false, error: `${ruleId} is not a background fact` };
    if (!rule.schema) {
        if (!rule.formula) return { ok: false, error: 'this fact carries no formula to apply' };
        return { ok: true, formula: rule.formula, premises: [ruleId] };
    }
    const vars = rule.schema.vars ?? {};
    for (const v of Object.keys(vars)) if (!(v in bind)) return { ok: false, error: `?${v} is not bound` };
    for (const [v, card] of Object.entries(bind)) {
        const spec = vars[v];
        if (!spec) return { ok: false, error: `the rule has no variable ?${v}` };
        if (!model.cards.has(card) && !model.windows.some((w) => w.id === card) && !model.subwindows.has(card) && !(spec?.condition && model.env.cards(spec).includes(card))) return { ok: false, error: `${card} is not a card` };
        const allowed = model.env.cards(spec);
        if (!allowed.includes(card)) return { ok: false, error: `?${v} cannot be ${card}: it must be ${describeSpec(spec)}` };
    }
    try {
        const formula = ground(rule.schema.formula, { ...model.env, bind });
        return { ok: true, formula, premises: [ruleId, ...new Set(Object.values(bind).filter((c) => model.cards.has(c)))] };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

function describeSpec(spec) {
    const what = spec.window ? 'a time window' : spec.condition ? 'a condition' : spec.proposition ? 'a proposition' : spec.statement ? 'a statement someone made' : spec.only ? `one of ${spec.only.join(', ')}` : spec.placeholder ? `a ${(spec.kinds ?? [spec.kind] ?? ['card']).join(' or ')} not yet identified` : spec.section ? 'an event' : spec.kind || spec.kinds ? `a ${(spec.kinds ?? [spec.kind]).join(' or ')}` : 'a card';
    return spec.trait ? `${what} that is ${spec.trait}` : what;
}

/**
 * Does an authored inference follow from its premises? The claim premises count in their trusted reading, the
 * rule applications it lists are grounded, premise propositions count as true, premise inferences as held.
 * Returns {status: 'verified'|'asserted'|'vacuous'|'error', used?, error?}: asserted = the premises do not
 * entail the formula (it stands on the author's word); vacuous = the premises are already inconsistent.
 */
export function verifyInference(model, k) {
    const active = [];
    const extra = [];
    for (const p of k.premises) {
        const c = model.cards.get(p);
        if (!c) return { status: 'error', error: `unknown premise ${p}` };
        if (c.section === 'claims' && model.claimForms.has(p)) active.push(model.claimForms.get(p).trusted);
        else if (c.section === 'inferences') active.push(model.claimForms.get(p)?.trusted ?? p);
        else if (c.section === 'propositions') extra.push({ eq: [p, 'true'] });
        else if (c.section === 'rules' && c.formula && !c.schema) extra.push(c.formula);
    }
    for (const use of k.rules ?? []) {
        const res = instantiateRule(model, use.rule, use.bind ?? {});
        if (!res.ok) return { status: 'error', error: `${use.rule}: ${res.error}` };
        extra.push(res.formula);
    }
    for (const c of model.constraints.values()) if (c.definition) active.push(c.id);
    const formula = model.cards.get(k.id)?.formula ?? k.formula;
    // The world model's ties, for the things whose states the inference speaks of (its formula, its rule
    // applications): the rest only widen the search, which must refute every combination of them.
    const things = new Set();
    const spoken = [formula, ...extra];
    for (const f of spoken) for (const s of slotsOf(f)) { const sl = model.slots.get(s); if (sl?.track) things.add(sl.on); }
    for (const c of model.constraints.values()) if (c.world && c.thing && things.has(c.thing)) active.push(c.id);
    for (const id of active) if (model.constraints.get(id)?.world === undefined) for (const t of stateThings(model, id)) if (!things.has(t)) { things.add(t); for (const c of model.constraints.values()) if (c.world && c.thing === t) active.push(c.id); }
    if (!model.problem.consistent(active, {}, { extra }).ok) return { status: 'vacuous' };
    if (model.problem.consistent(active, {}, { extra: [...extra, { not: formula }] }).ok) return { status: 'asserted' };
    const used = model.problem.explainConflict(active, {}, { extra: [...extra, { not: formula }] }) ?? [];
    return { status: 'verified', used };
}

/**
 * Add a card the player made: an applied rule ({section: 'applied', rule, bind, formula}) or an inference
 * ({section: 'inferences', premises, formula}). Both get the trusted/doubted readings and a latent truth slot,
 * and count as held inferences (activeConstraints: known.has(id)). Returns the card.
 */
export function addDynamic(model, card) {
    if (model.cards.has(card.id)) throw new Error(`duplicate id ${card.id}`);
    for (const s of slotsOf(card.formula)) if (!model.slots.has(s)) throw new Error(`formula names unknown slot ${s}`);
    const full = { ...card, text: card.label, dynamic: true };
    model.cards.set(card.id, full);
    model.dynamic.set(card.id, full);
    model.slots.set(`${card.id}.truth`, { id: `${card.id}.truth`, on: card.id, facet: 'truth', prompt: 'Does it hold?', domain: ['true', 'false'], answer: 'true', latent: true });
    addInferenceConstraints(model, { id: card.id, label: card.label, by: card.by ?? 'player', premises: card.premises, formula: card.formula, applied: card.section === 'applied' });
    rebuildProblem(model);
    return full;
}

/** Remove a card added with addDynamic. */
export function removeDynamic(model, id) {
    if (!model.dynamic.has(id)) return;
    model.cards.delete(id);
    model.dynamic.delete(id);
    model.slots.delete(`${id}.truth`);
    for (const k of [id, `${id}#doubted`, `${id}#trusted`]) model.constraints.delete(k);
    model.claimForms.delete(id);
    rebuildProblem(model);
}

/**
 * The cards the solution has any use for: every premise and inference, everything a formula (a constraint's, a
 * theory's, a step of Holmes's route) speaks of, the cards that hold the case's questions, whoever told a clue
 * that is used, and the cards a used background fact is recalled from. The rest is colour: the game can leave
 * some of it out (the "Irrelevant cards" option).
 */
export function relevantCards(model) {
    const { data, cards, slots } = model;
    const rel = new Set();
    // A relation slot names its first argument, but ranging over a card does not make it needed: only a value
    // that names it, or a premise or question that sits on it, does.
    const owner = (s) => { const sl = slots.get(s); if (sl?.on && sl.facet !== 'relation') rel.add(sl.on); };
    const formula = (f) => {
        for (const s of slotsOf(f)) owner(s);
        for (const [, v] of literalsOf(f)) if (cards.has(v)) rel.add(v);
    };
    for (const k of model.constraints.values()) {
        if (k.world) continue; // the world model ties every tracked thing to its events: that makes nothing needed
        k.premises.forEach((p) => rel.add(p));
        if (k.inference) rel.add(k.inference);
        formula(k.formula);
    }
    for (const k of data.constraints ?? []) for (const use of k.rules ?? []) for (const c of Object.values(use.bind ?? {})) rel.add(c);
    for (const q of data.questions ?? []) owner(q.slot);
    for (const t of data.theories ?? []) {
        (t.rests_on ?? []).forEach((x) => rel.add(x));
        for (const [s, v] of Object.entries(t.assignment ?? {})) { owner(s); if (cards.has(v)) rel.add(v); }
    }
    for (const r of data.route ?? []) {
        r.premises.forEach((p) => rel.add(p));
        if (r.concludes.formula) formula(r.concludes.formula); else owner(r.concludes.slot);
    }
    for (const id of [...rel]) {
        const c = cards.get(id);
        for (const a of [...(c?.attested ?? []), ...(c?.stated ?? [])]) if (cards.has(a.by)) rel.add(a.by);
        if (c?.section === 'rules') for (const x of c.attaches_to ?? []) if (cards.has(x)) rel.add(x);
    }
    return rel;
}

/**
 * Constraint ids whose premises are all in `known` (a Set of card ids). Definitions are always active.
 * With `doubted` (a Set of claim and inference ids) this is a PLAYER's view: every claim and inference is
 * trusted unless it is in `doubted`. Without it, the case's own reading.
 * `heldInferences`: an inference (or applied rule) counts while its own card is in `known` (a player who
 * builds inferences), instead of once its premises are (the case's reading, and Trivial).
 */
export function activeConstraints(model, known, doubted = null, { heldInferences = false, kinds = null } = {}) {
    const out = [];
    // Premises known cover an inference whose premises they cover, and so on up a chain (short chains: an
    // inference may cite another inference, and counts wherever its flat ancestry would).
    if (!heldInferences) known = closeOverInferences(model, known);
    const ties = [];
    for (const k of model.constraints.values()) {
        if (k.variant) continue;
        if (k.definition) { out.push(k.id); continue; }
        if (k.world) { ties.push(k); continue; }
        if (heldInferences && k.inference ? !known.has(k.inference) : !k.premises.every((p) => known.has(p))) continue;
        if (k.doubt_with && doubted?.has(k.doubt_with)) continue;
        const forms = doubted && k.from_claim ? model.claimForms.get(k.from_claim) : null;
        out.push(forms ? (doubted.has(k.from_claim) ? forms[kinds?.get(k.from_claim)] ?? forms.doubted : forms.trusted) : k.id);
    }
    // The world model's ties, for the things whose states the active cards speak of.
    const things = new Set();
    for (const id of out) for (const t of stateThings(model, id)) things.add(t);
    for (const k of ties) if (things.has(k.thing)) out.push(k.id);
    return out;
}

/** The things whose declared states a constraint's formula speaks of (cached on the constraint). */
export function stateThings(model, id) {
    const k = model.constraints.get(id);
    if (!k) return [];
    if (!k.stateThings) {
        const out = new Set();
        // A belief brings no ties of its own: what someone believed puts him nowhere.
        for (const s of slotsOf(k.formula)) { const sl = model.slots.get(s); if (sl?.track && sl.aspect !== 'belief') out.add(sl.on); }
        k.stateThings = [...out];
    }
    return k.stateThings;
}

/** `known` with every inference added whose premises it holds, repeatedly (a chain closes in a few rounds). */
export function closeOverInferences(model, known) {
    const out = new Set(known);
    const infs = [...model.cards.values()].filter((c) => c.section === 'inferences' && c.premises);
    for (let grew = true; grew;) {
        grew = false;
        for (const k of infs) if (!out.has(k.id) && k.premises.every((p) => out.has(p))) { out.add(k.id); grew = true; }
    }
    return out;
}

/** The claim a constraint trusts, if it is a claim's trusted reading. */
export function trustedClaim(model, kid) {
    const k = model.constraints.get(kid);
    return k?.from_claim && model.claimForms.get(k.from_claim)?.trusted === kid ? k.from_claim : null;
}

/**
 * Is an elimination / conclusion justified by the cited cards?
 * `claim` is either {slot, value} (meaning "slot ≠ value") or {formula} (meaning "formula holds").
 * `cited` may include applied rules and the player's inferences: they count while cited (heldInferences).
 * Returns {ok, used} where `used` is a minimal set of constraints that does it.
 */
export function checkStep(model, cited, claim, doubted = null) {
    const citedSet = new Set(cited);
    const active = activeConstraints(model, citedSet, doubted).filter((id) => {
        const k = model.constraints.get(id);
        return !k.inference || !model.dynamic.has(k.inference) || citedSet.has(k.inference);
    });
    for (const id of citedSet) {
        if (model.dynamic.has(id) && !active.includes(id)) {
            const forms = model.claimForms.get(id);
            active.push(doubted?.has(id) ? forms.doubted : forms.trusted);
        }
    }
    // Cited clues that cannot all be true prove anything at all: say so instead. (One of them must be false.)
    const clash = model.problem.explainConflict(active);
    if (clash) return { ok: false, contradiction: clash };
    const fixed = claim.slot ? { [claim.slot]: claim.value } : {};
    const extra = claim.formula ? [{ not: claim.formula }] : [];
    const res = model.problem.consistent(active, fixed, { extra });
    if (res.ok) return { ok: false };
    const used = model.problem.explainConflict(active, fixed, { extra }) ?? [];
    return { ok: true, used };
}

// ---------- the world model's ties, per track (built with the model, and again for a state the player opens) ----------

/**
 * What the clues state outright (a top-level `eq` of a claim the case trusts): an event a clue gives to someone
 * else, or puts in a window no state is declared for, is not tied to the thing (the ties are many, and the solver
 * pays for each; the pruning holds in the case's reading, and loses only those ties for a player who doubts that
 * very clue).
 */
/** The pairs of events a formula puts in order with `seq` ([[a, b]...], consecutive pairs of each list). */
export function seqPairs(f, out = []) {
    if (!f || typeof f !== 'object') return out;
    if (Array.isArray(f)) { for (const x of f) seqPairs(x, out); return out; }
    if (Array.isArray(f.seq)) for (let i = 1; i < f.seq.length; i++) out.push([f.seq[i - 1], f.seq[i]]);
    else for (const x of Object.values(f)) seqPairs(x, out);
    return out;
}

function statedOutright(data) {
    const stated = new Map();
    for (const c of data.claims ?? []) {
        if (c.truth_slot || c.derived || !c.asserts) continue;
        const top = c.asserts.and ?? [c.asserts];
        for (const f of top) if (f.eq && typeof f.eq[0] === 'string') stated.set(f.eq[0], f.eq[1]);
    }
    return stated;
}

/** The conditions under which event `a` lies in time `w` (its window, and its order against w's splitters), or null. */
function inTimeConds({ timeOrder, subwindows, slots, orderSlot }, a, w) {
    const root = timeOrder.has(w) ? w : subwindows.get(w).root;
    const conds = [{ eq: [`${a}.time`, root] }];
    for (const [dir, e] of subwindows.get(w)?.path ?? []) {
        // The event that splits a window lies in neither part (Robert, Round 70): whoever does it is not tied to its
        // place in the part before or after it (a flight from one place to another would put them in both).
        if (e === a) return null;
        const o = orderSlot(a, e);
        if (!slots.has(o)) return null;
        conds.push({ eq: [o, dir] });
    }
    return conds;
}

/** The ties of one track: [{id, label, formula, thing}] (whoever does or undergoes an event is there; a holder is with the held). */
function trackTies(ctx, t) {
    const { data, slots, subwindows, timeOrder, env, stateTracks, isPlace, stated } = ctx;
    const g = (f) => ground(f, env);
    const out = [];
    const world = (id, label, formula) => { if (!formula.true) out.push({ id, label, formula, thing: t.of }); };
    if (t.name === 'at') {
        for (const e of data.events ?? []) {
            if (!slots.has(`${e.id}.place`) || !slots.has(`${e.id}.time`)) continue;
            const when = stated.get(`${e.id}.time`);
            // A stated place needs only its own branch (the others are ruled out by the same clue).
            const where = stated.get(`${e.id}.place`);
            const there = (time) => g(where !== undefined ? { eq: [{ state: ['at', t.of, time] }, where] } : { same: [{ state: ['at', t.of, time] }, `${e.id}.place`] });
            for (const role of ['agent', 'patient']) {
                if (!slots.get(`${e.id}.${role}`)?.domain.includes(t.of)) continue;
                const who = stated.get(`${e.id}.${role}`);
                if (who !== undefined && who !== t.of) continue;
                // Everything stated (who, when, where): the clues already place the thing; a tie would only
                // join this event to every other the thing takes part in, and widen every search.
                if (who === t.of && when !== undefined && where !== undefined && timeOrder.has(when) && t.times.every((w) => !subwindows.has(w) || subwindows.get(w).root !== when)) continue;
                const parts = [];
                // The windows: one lookup by the event's time over the thing's declared windows.
                if (t.times.some((w) => timeOrder.has(w) && (when === undefined || w === when))) {
                    const then = there(`${e.id}.time`);
                    if (!then.true) parts.push({ implies: [{ eq: [`${e.id}.${role}`, t.of] }, then] });
                }
                // The parts of windows: guarded by the event's window and its order against the splitters.
                for (const w of t.times) {
                    if (timeOrder.has(w)) continue;
                    if (when !== undefined && subwindows.get(w).root !== when) continue;
                    const conds = inTimeConds(ctx, e.id, w);
                    if (!conds) continue;
                    const then = there(w);
                    if (!then.true) parts.push({ implies: [{ and: [{ eq: [`${e.id}.${role}`, t.of] }, ...conds] }, then] });
                }
                if (parts.length) world(`k.world.${t.of}.${e.id.slice(2)}.${role}`, `Whoever ${role === 'agent' ? 'does a thing' : 'has a thing done to them'} is where it is done, when it is done (${t.of}, ${e.id}).`, parts.length === 1 ? parts[0] : { and: parts });
            }
        }
    }
    if (t.name === 'aims') for (const k of aimTies(ctx, t.of, t.times)) world(k.id, k.label, k.formula);
    if (t.aspect === 'knowledge') for (const k of knowledgeTies(ctx, t, t.times)) world(k.id, k.label, k.formula);
    // Knowing implies believing (workstream 4): where the same person has both tracks over one proposition.
    if (t.aspect === 'belief') {
        const kt = stateTracks.get(`${knowsName(t.believes)}|${t.of}`);
        for (const w of t.times) if (kt?.slotFor(w)) world(`k.world.${t.of}.${t.name}.known.${w.slice(2)}`, `What one knows one believes (${t.of}, ${t.believes}).`, { implies: [{ eq: [kt.slotFor(w), 'true'] }, { eq: [t.slotFor(w), 'true'] }] });
    }
    if (t.name === 'held') {
        const place = stateTracks.get(`at|${t.of}`);
        for (const w of t.times) {
            const parts = [];
            for (const h of t.domain) {
                if (h === 'elsewhere') continue;
                const holder = stateTracks.get(`at|${h}`);
                let then = { true: true };
                if (holder?.slotFor(w) && place?.slotFor(w)) then = g({ same: [{ state: ['at', h, w] }, { state: ['at', t.of, w] }] });
                else if (!holder && place?.slotFor(w) && isPlace(h)) then = g({ eq: [{ state: ['at', t.of, w] }, h] });
                if (!then.true) parts.push({ implies: [{ eq: [t.slotFor(w), h] }, then] });
            }
            if (parts.length) world(`k.world.${t.of}.held.${w.slice(2)}`, `Whoever has a thing in hand is where the thing is; a thing left lying is where it lies (${t.of}).`, { and: parts });
        }
    }
    return out;
}

/**
 * The ties of one window the player opened on a thing's track (the case's own ties, built over the declared windows,
 * read it as unconstrained, so these only add to them): whoever does or undergoes an event in that window is where
 * it is done; a holder is with the thing held, there and then. Each tie speaks of the opened thing.
 */
function windowTies(ctx, thing, name, w) {
    const { data, slots, timeOrder, subwindows, env, stateTracks, isPlace, stated } = ctx;
    const g = (f) => ground(f, env);
    const at = (x) => stateTracks.get(`at|${x}`)?.slotFor(w) ?? null;
    const out = [];
    const tie = (id, label, formula) => { if (!formula.true) out.push({ id: `${id}@${w.slice(2)}`, label, formula, thing }); };
    const root = timeOrder.has(w) ? w : subwindows.get(w).root;
    if (name === 'at') {
        for (const e of data.events ?? []) {
            if (!slots.has(`${e.id}.place`) || !slots.has(`${e.id}.time`)) continue;
            const when = stated.get(`${e.id}.time`);
            if (when !== undefined && when !== root) continue;
            const where = stated.get(`${e.id}.place`);
            for (const role of ['agent', 'patient']) {
                if (!slots.get(`${e.id}.${role}`)?.domain.includes(thing)) continue;
                const who = stated.get(`${e.id}.${role}`);
                if (who !== undefined && who !== thing) continue;
                const conds = inTimeConds(ctx, e.id, w);
                if (!conds) continue;
                // Through the state term, so a place folds to the track's (the stable window reads as the stable).
                const st = { state: ['at', thing, w] };
                const then = g(where !== undefined ? { eq: [st, where] } : { same: [st, `${e.id}.place`] });
                tie(`k.world.${thing}.${e.id.slice(2)}.${role}`, `Whoever ${role === 'agent' ? 'does a thing' : 'has a thing done to them'} is where it is done, when it is done (${thing}, ${e.id}).`, { implies: [{ and: [{ eq: [`${e.id}.${role}`, thing] }, ...conds] }, then] });
            }
        }
    }
    if (name === 'aims') for (const k of aimTies(ctx, thing, [w])) tie(k.id, k.label, k.formula);
    const kt = stateTracks.get(`${name}|${thing}`);
    if (kt?.aspect === 'knowledge') for (const k of knowledgeTies(ctx, kt, [w])) tie(k.id, k.label, k.formula);
    // Holders and the held, in this window: the opened thing as either.
    for (const t of stateTracks.values()) {
        if (t.name !== 'held' || !t.slotFor(w)) continue;
        const parts = [];
        for (const h of t.domain) {
            if (h === 'elsewhere' || (t.of !== thing && h !== thing)) continue;
            if (name === 'at' && !(t.of === thing ? at(thing) : at(t.of))) continue;
            let then = { true: true };
            if (at(h) && at(t.of)) then = g({ same: [at(h), at(t.of)] });
            else if (!stateTracks.has(`at|${h}`) && at(t.of) && isPlace(h)) then = g({ eq: [{ state: ['at', t.of, w] }, h] });
            if (!then.true) parts.push({ implies: [{ eq: [t.slotFor(w), h] }, then] });
        }
        if (parts.length) tie(`k.world.${t.of}.held.${thing}`, `Whoever has a thing in hand is where the thing is; a thing left lying is where it lies (${t.of}).`, { and: parts });
    }
    return out;
}

/**
 * Open a state the case never declared (the player commits a mark there): a slot for `thing` in aspect `name`
 * ('at', 'held' or a condition's id) at window `w` (a window, or a part the case splits), on the thing's track (a
 * new track if it has none), with its own ties to the events (windowTies). It has no answer and plays no part in
 * uniqueness. Returns the slot id (the declared one, if there is one).
 */
export function openState(model, thing, name, w) {
    const ctx = model.worldContext;
    const existing = model.stateTracks.get(`${name}|${thing}`);
    if (existing?.slotFor(w)) {
        // Opened already (another game on the same model): one more holder, so it closes when the last lets go.
        const o = model.opened.find((x) => x.slot === existing.slotFor(w));
        if (o) o.holders++;
        return existing.slotFor(w);
    }
    if (!ctx.isTime(w)) throw new Error(`unknown window ${w}`);
    const conditions = (model.data.state_conditions ?? []).map((c) => c.id);
    const aims = (model.data.state_aims ?? []).length ? ['aims'] : [];
    const known = (model.data.propositions ?? []).map((p) => knowsName(p.id));
    if (!['at', 'held', ...aims, ...known, ...conditions].includes(name)) throw new Error(`unknown aspect ${name}`);
    if (!model.cards.has(thing)) throw new Error(`unknown card ${thing}`);
    const aspect = name === 'at' ? 'location' : name === 'held' ? 'possession' : name === 'aims' ? 'intention' : known.includes(name) ? 'knowledge' : 'condition';
    const set = model.data.state_places?.[0]?.id;
    const track = existing ?? ctx.makeTrack({ id: `st.${thing}.${name}`, of: thing, aspect, ...(aspect === 'condition' ? { condition: name } : aspect === 'knowledge' ? { knows: (model.data.propositions ?? []).find((p) => knowsName(p.id) === name).id } : aspect === 'intention' ? {} : { places: set }), windows: {} });
    const slot = track.addWindow(w, null, { opened: true });
    const ties = windowTies(ctx, thing, name, w);
    for (const k of ties) model.constraints.set(k.id, { id: k.id, label: k.label, premises: [], world: true, thing: k.thing, formula: k.formula });
    model.opened.push({ thing, name, window: w, slot, newTrack: !existing, ties: ties.map((k) => k.id), holders: 1 });
    rebuildProblem(model);
    return slot;
}

/** Let go of a state opened with openState; the last to let go closes it (its ties, and its track if it opened one). */
export function closeState(model, slot) {
    const i = model.opened.findIndex((o) => o.slot === slot);
    if (i < 0) return;
    const o = model.opened[i];
    if (--o.holders > 0) return;
    model.opened.splice(i, 1);
    const key = `${o.name}|${o.thing}`;
    const track = model.stateTracks.get(key);
    track.removeWindow(o.window);
    if (o.newTrack && !track.times.length) model.stateTracks.delete(key);
    for (const id of o.ties) model.constraints.delete(id);
    rebuildProblem(model);
}

/**
 * The order of the events that split windows (definitions, always active): a part split off inside another part
 * has its splitting event in that part; two splitters order each other one way only; and order runs through
 * (before F, and F before E, is before E). [{id, label, formula}]
 */
function orderTies(ctx) {
    const { data, slots, subwindows, orderSlot } = ctx;
    const out = [];
    const world = (id, label, formula) => out.push({ id, label, formula });
    for (const sw of subwindows.values()) {
        if (sw.dir !== 'before' || !subwindows.has(sw.parent)) continue;
        const conds = inTimeConds(ctx, sw.by, sw.parent);
        if (conds && conds.length > 1) world(`k.world.split.${sw.parent.slice(2)}.${sw.by.slice(2)}`, `${sw.by} lies within ${sw.parent}.`, { implies: [conds[0], { and: conds.slice(1) }] });
    }
    const splitters = [...new Set([...subwindows.values()].map((sw) => sw.by))];
    for (const e of splitters) for (const f of splitters) {
        if (e >= f || !slots.has(orderSlot(e, f)) || !slots.has(orderSlot(f, e))) continue;
        world(`k.world.order.${e.slice(2)}.${f.slice(2)}`, `${e} and ${f}: one is before the other.`, { and: [
            { implies: [{ eq: [orderSlot(e, f), 'before'] }, { eq: [orderSlot(f, e), 'after'] }] },
            { implies: [{ eq: [orderSlot(e, f), 'after'] }, { eq: [orderSlot(f, e), 'before'] }] },
        ] });
    }
    for (const a of data.events ?? []) for (const e of splitters) for (const f of splitters) {
        if (a.id === e || a.id === f || e === f) continue;
        const [ae, af, fe] = [orderSlot(a.id, e), orderSlot(a.id, f), orderSlot(f, e)];
        if (!slots.has(ae) || !slots.has(af) || !slots.has(fe)) continue;
        const same = { and: [{ same: [`${a.id}.time`, `${e}.time`] }, { same: [`${f}.time`, `${e}.time`] }] };
        world(`k.world.order.${a.id.slice(2)}.${f.slice(2)}.${e.slice(2)}`, `Order runs through (${a.id}, ${f}, ${e}).`, { and: [
            { implies: [{ and: [same, { eq: [af, 'before'] }, { eq: [fe, 'before'] }] }, { eq: [ae, 'before'] }] },
            { implies: [{ and: [same, { eq: [af, 'after'] }, { eq: [fe, 'after'] }] }, { eq: [ae, 'after'] }] },
        ] });
    }
    // The same over every order question, not only the splitters' (Round 73): a pair a claim puts in order (`seq`)
    // reaches the questions of any split of its window, the case's or the player's. `lt(x, y)`: x is before y, read
    // off whichever of the two questions exists.
    const lt = (x, y) => (slots.has(orderSlot(x, y)) ? { eq: [orderSlot(x, y), 'before'] } : slots.has(orderSlot(y, x)) ? { eq: [orderSlot(y, x), 'after'] } : null);
    const made = new Set(out.map((k) => k.id));
    const next = new Map();
    for (const s of slots.values()) {
        if (s.facet !== 'order') continue;
        const [x, y] = [s.on, `e.${s.id.split('.')[2]}`];
        for (const [u, v] of [[x, y], [y, x]]) { if (!next.has(u)) next.set(u, new Set()); next.get(u).add(v); }
        if (x < y && slots.has(orderSlot(y, x)) && !made.has(`k.world.order.${x.slice(2)}.${y.slice(2)}`)) {
            made.add(`k.world.order.${x.slice(2)}.${y.slice(2)}`);
            world(`k.world.order.${x.slice(2)}.${y.slice(2)}`, `${x} and ${y}: one is before the other.`, { and: [
                { implies: [{ eq: [orderSlot(x, y), 'before'] }, { eq: [orderSlot(y, x), 'after'] }] },
                { implies: [{ eq: [orderSlot(x, y), 'after'] }, { eq: [orderSlot(y, x), 'before'] }] },
            ] });
        }
    }
    for (const [m, ends] of next) for (const x of ends) for (const z of ends) {
        if (x >= z || !next.get(x)?.has(z)) continue;
        const [ida, idb] = [`k.world.order.${x.slice(2)}.${m.slice(2)}.${z.slice(2)}`, `k.world.order.${z.slice(2)}.${m.slice(2)}.${x.slice(2)}`];
        if (made.has(ida) || made.has(idb)) continue;
        made.add(ida);
        const same = { and: [{ same: [`${x}.time`, `${m}.time`] }, { same: [`${z}.time`, `${m}.time`] }] };
        world(ida, `Order runs through (${x}, ${m}, ${z}).`, { and: [
            { implies: [{ and: [same, lt(x, m), lt(m, z)] }, lt(x, z)] },
            { implies: [{ and: [same, lt(z, m), lt(m, x)] }, lt(z, x)] },
        ] });
    }
    return out;
}

/**
 * Open a split the player made (they commit something about one of its parts): window `w` (a window or a part)
 * split at event `by` into the part before and the part after, with an order question (no answer) for each event
 * that may share the window, and the order ties these add. Held by count, like opened states. Returns the parts.
 */
export function openSplit(model, w, by) {
    const ctx = model.worldContext;
    const ids = ['before', 'after'].map((dir) => `${w}.${dir}.${by.replace(/^e\./, '')}`);
    if (model.subwindows.has(ids[0])) {
        const o = model.openedSplits.find((x) => x.window === w && x.by === by);
        if (o) o.holders++;
        return ids;
    }
    if (!ctx.isTime(w)) throw new Error(`unknown window ${w}`);
    if (model.cards.get(by)?.section !== 'events') throw new Error(`${by} is not an event`);
    const made = ctx.makeSplit({ window: w, by }, true);
    const ties = orderTies(ctx).filter((k) => !model.constraints.has(k.id));
    for (const k of ties) model.constraints.set(k.id, { id: k.id, label: k.label, premises: [], world: true, definition: true, formula: k.formula });
    model.openedSplits.push({ window: w, by, ...made, ties: ties.map((k) => k.id), holders: 1 });
    rebuildProblem(model);
    return ids;
}

/** Let go of a split opened with openSplit; the last to let go closes it (its parts, order questions and ties). */
export function closeSplit(model, w, by) {
    const i = model.openedSplits.findIndex((x) => x.window === w && x.by === by);
    if (i < 0) return;
    const o = model.openedSplits[i];
    if (--o.holders > 0) return;
    model.openedSplits.splice(i, 1);
    for (const id of o.parts) model.subwindows.delete(id);
    for (const id of o.slots) model.slots.delete(id);
    for (const id of o.ties) model.constraints.delete(id);
    rebuildProblem(model);
}

/**
 * Whoever does an act with a purpose has that purpose as their aim at its time (intention, step 5): for each event
 * with a `purpose` slot that `thing` may be the agent of, and each of these windows (or parts) it may fall in, its
 * purpose values that are aims fix the aim there. [{id, label, formula}]
 */
function aimTies(ctx, thing, windows) {
    const { data, slots, timeOrder, subwindows, stated, stateTracks } = ctx;
    const track = stateTracks.get(`aims|${thing}`);
    const out = [];
    for (const e of data.events ?? []) {
        const purpose = slots.get(`${e.id}.purpose`);
        if (!purpose || !slots.get(`${e.id}.agent`)?.domain.includes(thing) || !slots.has(`${e.id}.time`)) continue;
        const who = stated.get(`${e.id}.agent`);
        if (who !== undefined && who !== thing) continue;
        const when = stated.get(`${e.id}.time`);
        const values = purpose.domain.filter((v) => track.domain.includes(v));
        if (!values.length) continue;
        const parts = [];
        for (const w of windows) {
            const root = timeOrder.has(w) ? w : subwindows.get(w).root;
            if (when !== undefined && when !== root) continue;
            const conds = inTimeConds(ctx, e.id, w);
            if (!conds) continue;
            for (const v of values) parts.push({ implies: [{ and: [{ eq: [`${e.id}.agent`, thing] }, ...conds, { eq: [purpose.id, v] }] }, { eq: [track.slotFor(w), v] }] });
        }
        if (parts.length) out.push({ id: `k.world.${thing}.${e.id.slice(2)}.aim`, label: `Whoever does a thing for a purpose is trying to do that, when he does it (${thing}, ${e.id}).`, formula: parts.length === 1 ? parts[0] : { and: parts } });
    }
    return out;
}

/** The name of the knowledge track of a proposition: p.lad_alone_at_night → knows_lad_alone_at_night. */
export const knowsName = (p) => `knows_${String(p).replace(/^p\./, '')}`;
/** A belief track's name: believes_<proposition or claim, without its prefix>. */
export const believesName = (x) => `believes_${String(x).replace(/^[pc]\./, '')}`;
/** VIAS whose speaker is a person who may believe or not what he says. */
const STATEMENT_VIAS = ['testimony', 'admission'];
/**
 * A statement: a clue someone said (testimony, admission), with its speaker and scene; null otherwise. `speakers`:
 * who said it, in order along its reporting chain (`chain` on the attestation, Round 89), each with when.
 */
export function statementOf(c, entities, scenes = []) {
    if (c.derived || !c.asserts) return null;
    const a = (c.attested ?? []).find((x) => STATEMENT_VIAS.includes(x.via) && x.by);
    if (!a) return null;
    const person = (id) => ['person', 'group'].includes(entities.find((e) => e.id === id)?.kind);
    if (!person(a.by)) return null;
    const at = c.said_at ?? scenes.find((s) => s.id === a.scene)?.time;
    const speakers = [...(a.chain ?? []).filter((l) => person(l.by)).map((l) => ({ by: l.by, at: l.at })), { by: a.by, at }];
    return { by: a.by, scene: a.scene, speakers };
}

/**
 * The two laws of knowledge (built in, Round 72): what one knows one goes on knowing (in every later window of the
 * track), and what one knows is true (the proposition holds). For these windows of track `t`. [{id, label, formula}]
 */
function knowledgeTies(ctx, t, windows) {
    const { timeOrder, subwindows } = ctx;
    const rank = (w) => timeOrder.get(timeOrder.has(w) ? w : subwindows.get(w).root);
    const out = [];
    for (const w of windows) {
        const here = t.slotFor(w);
        out.push({ id: `k.world.${t.of}.${t.name}.true.${w.slice(2)}`, label: `What one knows is true (${t.of}, ${t.knows}).`, formula: { implies: [{ eq: [here, 'true'] }, { eq: [t.knows, 'true'] }] } });
        for (const v of t.times) {
            if (v === w || rank(v) === rank(w)) continue;
            const [a, b] = rank(v) < rank(w) ? [v, w] : [w, v];
            const id = `k.world.${t.of}.${t.name}.kept.${a.slice(2)}.${b.slice(2)}`;
            if (out.some((k) => k.id === id)) continue;
            out.push({ id, label: `What one knows one goes on knowing (${t.of}, ${t.knows}).`, formula: { implies: [{ eq: [t.slotFor(a), 'true'] }, { eq: [t.slotFor(b), 'true'] }] } });
        }
    }
    return out;
}
