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
    // Propositions: boolean slots, each on its own card.
    for (const p of data.propositions ?? []) {
        addSlot({
            id: p.id, on: p.id, facet: 'proposition', prompt: p.prompt ?? 'Is it so?', domain: ['true', 'false'],
            answer: p.answer === undefined ? 'true' : p.answer, undetermined: p.answer === null ? true : undefined,
        });
    }

    // ---- grounding environment (schemas, relation terms, quantifiers) ----
    const env = {
        bind: {},
        hasSlot: (id) => slots.has(id),
        domainOf: (id) => slots.get(id)?.domain ?? [],
        relation: (name) => relations.get(name) ?? null,
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
            addConstraint({ id: `${k.id}#rule${i + 1}`, label: `${rule.text} (as applied in: ${k.label})`, by: k.by, premises: [...new Set([...k.premises, ...Object.values(use.bind ?? {})])], inference: k.id, doubt_with: k.id, rule: use.rule, bind: use.bind ?? {}, formula: g });
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

    const model = { data, cards, slots, constraints, claimForms, relations, env, timeOrder, sceneOrder, windows, scenes, errors, problem: null, dynamic: new Map() };
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
    model.problem = new Problem({
        domains: new Map([...model.slots.values()].map((s) => [s.id, s.domain])),
        constraints: [...model.constraints.values()],
        timeOrder: model.timeOrder,
    });
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
        if (!model.cards.has(card) && !model.windows.some((w) => w.id === card)) return { ok: false, error: `${card} is not a card` };
        const allowed = model.env.cards(spec);
        if (!allowed.includes(card)) return { ok: false, error: `?${v} cannot be ${card}: it must be ${describeSpec(spec)}` };
    }
    try {
        const formula = ground(rule.schema.formula, { ...model.env, bind });
        return { ok: true, formula, premises: [ruleId, ...new Set(Object.values(bind))] };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

function describeSpec(spec) {
    const what = spec.only ? `one of ${spec.only.join(', ')}` : spec.placeholder ? `a ${(spec.kinds ?? [spec.kind] ?? ['card']).join(' or ')} not yet identified` : spec.section ? 'an event' : spec.kind || spec.kinds ? `a ${(spec.kinds ?? [spec.kind]).join(' or ')}` : 'a card';
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
export function activeConstraints(model, known, doubted = null, { heldInferences = false } = {}) {
    const out = [];
    // Premises known cover an inference whose premises they cover, and so on up a chain (short chains: an
    // inference may cite another inference, and counts wherever its flat ancestry would).
    if (!heldInferences) known = closeOverInferences(model, known);
    for (const k of model.constraints.values()) {
        if (k.variant) continue;
        if (k.definition) { out.push(k.id); continue; }
        if (heldInferences && k.inference ? !known.has(k.inference) : !k.premises.every((p) => known.has(p))) continue;
        if (k.doubt_with && doubted?.has(k.doubt_with)) continue;
        const forms = doubted && k.from_claim ? model.claimForms.get(k.from_claim) : null;
        out.push(forms ? (doubted.has(k.from_claim) ? forms.doubted : forms.trusted) : k.id);
    }
    return out;
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
