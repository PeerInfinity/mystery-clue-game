// Turns a case (case.json + its parts, already parsed) into the game model: cards, slots, constraints, and a
// solver Problem over them.
//
// Cards: entities, events, claims, rules, glosses, and inferences (every one has a unique id across the case).
// INFERENCES (constraints.json): reasoning written into the case, each resting on premise cards (clues and
//   background facts), with a formula. An inference is a card too: the player builds it (or hears a character
//   state it), holds it, and can doubt it, like a clue. Some are false (`truth: false`): a character's wrong
//   reasoning. Two readings decide when one counts: the case's own (validator, route checks), where it holds once
//   its premises are in hand; and a player's (Game, outside Trivial), where it holds while its card is held.
// Slots: one per event facet, per entity facet, per claim truth, plus the explicitly declared slots.
// Constraints: one per claim that asserts something (premise: the claim itself), plus the authored reasoning
//   constraints (premises: the claims and rules they rest on).
//
// TRUST: every claim has two readings. TRUSTED: what it says holds. DOUBTED: what it says holds exactly when its
// truth slot is 'true'. The case's own reading (what the validator checks) doubts the claims marked `truth_slot`
// and trusts the rest; a player trusts every claim until they mark it suspect. The reading the case does not use
// is a VARIANT constraint, and the truth slot of a claim the case trusts is LATENT: both exist only for the
// player's view, and the validator skips them.

import { Problem } from './solver.js';
import { slotsOf, literalsOf } from './logic.js';

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

    // ---- constraints ----
    const constraints = new Map();
    const addConstraint = (k) => {
        if (constraints.has(k.id)) errors.push(`duplicate constraint ${k.id}`);
        constraints.set(k.id, k);
    };
    const claimForms = new Map();   // claim id -> {trusted, doubted} constraint ids
    for (const c of data.claims ?? []) {
        if (!c.asserts) continue;
        const doubted = {
            and: [
                { implies: [{ eq: [`${c.id}.truth`, 'true'] }, c.asserts] },
                { implies: [{ eq: [`${c.id}.truth`, 'false'] }, { not: c.asserts }] },
            ],
        };
        const base = { label: c.text, premises: [c.id], from_claim: c.id, derived: !!c.derived };
        // A derived claim's constraint is what the player earns by proving it; it is never part of the
        // evidence the uniqueness check runs on.
        addConstraint({ ...base, id: `k.${c.id}`, formula: c.truth_slot ? doubted : c.asserts });
        if (c.derived) continue;
        if (c.truth_slot) {
            addConstraint({ ...base, id: `k.${c.id}#trusted`, formula: c.asserts, variant: true });
            claimForms.set(c.id, { trusted: `k.${c.id}#trusted`, doubted: `k.${c.id}` });
        } else {
            addConstraint({ ...base, id: `k.${c.id}#doubted`, formula: doubted, variant: true });
            claimForms.set(c.id, { trusted: `k.${c.id}`, doubted: `k.${c.id}#doubted` });
        }
    }
    for (const k of data.constraints ?? []) {
        // Trusted: the formula holds. Doubted: it holds exactly when the inference's truth slot is 'true'. The
        // case reads a false inference doubted (so its truth slot comes out 'false'), a true one trusted.
        const doubted = {
            and: [
                { implies: [{ eq: [`${k.id}.truth`, 'true'] }, k.formula] },
                { implies: [{ eq: [`${k.id}.truth`, 'false'] }, { not: k.formula }] },
            ],
        };
        const base = { label: k.label, by: k.by, premises: k.premises, from_claim: k.id, inference: k.id };
        if (k.truth === false) {
            addConstraint({ ...base, id: k.id, formula: doubted });
            addConstraint({ ...base, id: `${k.id}#trusted`, formula: k.formula, variant: true });
            claimForms.set(k.id, { trusted: `${k.id}#trusted`, doubted: k.id });
        } else {
            addConstraint({ ...base, id: k.id, formula: k.formula });
            addConstraint({ ...base, id: `${k.id}#doubted`, formula: doubted, variant: true });
            claimForms.set(k.id, { trusted: k.id, doubted: `${k.id}#doubted` });
        }
    }

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

    const model = { data, cards, slots, constraints, claimForms, problem, timeOrder, sceneOrder, windows, scenes, errors };
    model.relevant = relevantCards(model);
    return model;
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
    const owner = (s) => { const o = slots.get(s)?.on; if (o) rel.add(o); };
    const formula = (f) => {
        for (const s of slotsOf(f)) owner(s);
        for (const [, v] of literalsOf(f)) if (cards.has(v)) rel.add(v);
    };
    for (const k of model.constraints.values()) {
        k.premises.forEach((p) => rel.add(p));
        if (k.inference) rel.add(k.inference);
        formula(k.formula);
    }
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
 * Constraint ids whose premises are all in `known` (a Set of card ids).
 * With `doubted` (a Set of claim and inference ids) this is a PLAYER's view: every claim and inference is
 * trusted unless it is in `doubted`. Without it, the case's own reading.
 * `heldInferences`: an inference counts while its own card is in `known` (a player who builds inferences),
 * instead of once its premises are (the case's reading, and Trivial).
 */
export function activeConstraints(model, known, doubted = null, { heldInferences = false } = {}) {
    const out = [];
    for (const k of model.constraints.values()) {
        if (k.variant) continue;
        if (heldInferences && k.inference ? !known.has(k.inference) : !k.premises.every((p) => known.has(p))) continue;
        const forms = doubted && k.from_claim ? model.claimForms.get(k.from_claim) : null;
        out.push(forms ? (doubted.has(k.from_claim) ? forms.doubted : forms.trusted) : k.id);
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
 * Returns {ok, used} where `used` is a minimal set of constraints that does it.
 */
export function checkStep(model, cited, claim, doubted = null) {
    const active = activeConstraints(model, new Set(cited), doubted);
    // Cited clues that cannot all be true prove anything at all: say so instead. (One of them must be false.)
    const clash = model.problem.explainConflict(active);
    if (clash) return { ok: false, contradiction: clash };
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
