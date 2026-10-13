// Turns a case (case.json + its parts, already parsed) into the game model: cards, slots, constraints, and a
// solver Problem over them.
//
// Cards: entities, events, claims, rules, glosses (every one has a unique id across the case).
// Slots: one per event facet, per entity facet, per testimony truth, plus the explicitly declared slots.
// Constraints: one per claim that asserts something (premise: the claim itself), plus the authored reasoning
//   constraints (premises: the claims and rules they rest on).

import { Problem } from './solver.js';
import { slotsOf } from './logic.js';

export const CARD_SECTIONS = ['entities', 'events', 'claims', 'rules', 'glosses'];

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
        }
    }
    for (const s of data.slots ?? []) {
        const domain = s.domain.values ? [...s.domain.values] : domainFor(s.domain, s.domain.include_self ? s.on : null);
        for (const extra of s.domain.also ?? []) if (!domain.includes(extra)) domain.push(extra);
        addSlot({
            id: s.id, on: s.on, facet: s.facet ?? 'custom', prompt: s.prompt, domain,
            answer: Array.isArray(s.answer) || s.answer === null ? null : s.answer,
            undetermined: Array.isArray(s.answer) ? s.answer : s.answer === null ? true : undefined,
            labels: s.domain.labels,
            note: s.note,
        });
    }

    // ---- constraints ----
    const constraints = new Map();
    const addConstraint = (k) => {
        if (constraints.has(k.id)) errors.push(`duplicate constraint ${k.id}`);
        constraints.set(k.id, k);
    };
    for (const c of data.claims ?? []) {
        if (!c.asserts) continue;
        const formula = c.truth_slot
            ? {
                and: [
                    { implies: [{ eq: [`${c.id}.truth`, 'true'] }, c.asserts] },
                    { implies: [{ eq: [`${c.id}.truth`, 'false'] }, { not: c.asserts }] },
                ],
            }
            : c.asserts;
        // A derived claim's constraint is what the player earns by proving it; it is never part of the
        // evidence the uniqueness check runs on.
        addConstraint({ id: `k.${c.id}`, label: c.text, premises: [c.id], formula, from_claim: c.id, derived: !!c.derived });
    }
    for (const k of data.constraints ?? []) addConstraint({ ...k });

    for (const k of constraints.values()) {
        for (const s of slotsOf(k.formula)) {
            if (!slots.has(s)) errors.push(`constraint ${k.id} names unknown slot ${s}`);
        }
        for (const p of k.premises) if (!cards.has(p)) errors.push(`constraint ${k.id}: unknown premise ${p}`);
    }

    const problem = errors.length
        ? null
        : new Problem({
            domains: new Map([...slots.values()].map((s) => [s.id, s.domain])),
            constraints: [...constraints.values()],
            timeOrder,
        });

    return { data, cards, slots, constraints, problem, timeOrder, sceneOrder, windows, scenes, errors };
}

/** Constraint ids whose premises are all in `known` (a Set of card ids). */
export function activeConstraints(model, known) {
    const out = [];
    for (const k of model.constraints.values()) if (k.premises.every((p) => known.has(p))) out.push(k.id);
    return out;
}

/**
 * Is an elimination / conclusion justified by the cited cards?
 * `claim` is either {slot, value} (meaning "slot ≠ value") or {formula} (meaning "formula holds").
 * Returns {ok, used} where `used` is a minimal set of constraints that does it.
 */
export function checkStep(model, cited, claim) {
    const active = activeConstraints(model, new Set(cited));
    const fixed = claim.slot ? { [claim.slot]: claim.value } : {};
    const extra = claim.formula ? [{ not: claim.formula }] : [];
    const res = model.problem.consistent(active, fixed, { extra });
    if (res.ok) return { ok: false };
    // Minimise: drop constraints that are not needed.
    let used = active;
    for (const id of [...used]) {
        const without = used.filter((x) => x !== id);
        if (!model.problem.consistent(without, fixed, { extra }).ok) used = without;
    }
    return { ok: true, used };
}
