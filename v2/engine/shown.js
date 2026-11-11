// What the timeline may show of a name or a time point at a paragraph, so that no label runs ahead of the story.
// Shared by the page (ui/world.js) and the leak check (pipeline/leak.mjs), so that the check judges what the page
// shows. Pure.
//
// A name: an entity's `names` (`[{from, name}]`, the name it goes by from each paragraph), if the case gives them;
// otherwise its `name` from the first paragraph whose text uses it, and before that the first phrase the story has
// used for it (mentions.json), as a name ("its trainer" → "The trainer"); a name the text never uses verbatim (a
// description: "The stranger at the stable") from the first mention. Before the story has named it at all, a word
// for its kind ("someone", "a place").
// A time point: its `labels` (`[{from, label}]`), if given; otherwise its `label` from its `para`. Before that,
// "a time not yet told". A question or an account: its `labels` in the same way, the first from where it shows.
import { normalize } from './story.js';

const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const KIND_WORD = { person: 'someone', animal: 'an animal', group: 'some people', place: 'a place', document: 'a paper', topic: 'a subject', state: 'the time' };
export const UNTOLD_TIME = 'a time not yet told';
const lower = (s) => normalize(String(s)).toLowerCase();
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** "its trainer" → "The trainer"; "Mrs. Straker" stays. */
export const asName = (phrase) => {
    const s = String(phrase).replace(/\s+/g, ' ').trim().replace(/^(my|his|her|its|their|our|your)\s+/i, 'the ');
    return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * `entities`, `mentions` (`{id: [phrase | {text, paras}]}`), `paras` (the story's paragraphs). Returns
 * `{ nameAt(id, para), steps(id) }`: the name shown at a paragraph, and the entity's [from, name] steps.
 */
export function shownNames(entities, mentions, paras) {
    const low = paras.map(lower);
    const first = (text, from = 1, to = paras.length - 1) => {   // from ¶1: the title (¶0) names the story, not who is in it
        const t = lower(text).replace(/^the /, '');
        if (!t) return null;
        const re = new RegExp(`(^|[^a-z0-9])${escRe(t)}([^a-z0-9]|$)`);
        for (let i = Math.max(1, from); i <= Math.min(to, low.length - 1); i++) if (re.test(low[i])) return i;
        return null;
    };
    const byId = new Map(entities.map((e) => [e.id, e]));
    const memo = new Map();
    const steps = (id) => {
        if (memo.has(id)) return memo.get(id);
        const e = byId.get(id);
        let out = [];
        if (!e) out = [];
        else if (e.names?.length) out = e.names.map((n) => [n.from, n.name]).sort((a, b) => a[0] - b[0]);
        else {
            const own = first(e.name);
            const seen = list(mentions[id]).map((p) => (typeof p === 'string' ? [first(p), p] : [first(p.text, p.paras?.[0], p.paras?.[1]), p.text])).filter(([at]) => at != null).sort((a, b) => a[0] - b[0]);
            // A name the text never uses verbatim is a description written for the first mention ("The stranger at
            // the stable"): it holds from there. A name the text uses holds from where it does, the first phrase before.
            if (own == null) out = [[seen.length ? seen[0][0] : 0, e.name]];
            else if (!seen.length || own <= seen[0][0]) out = [[own, e.name]];
            else out = [[seen[0][0], asName(seen[0][1])], [own, e.name]];
        }
        memo.set(id, out);
        return out;
    };
    const nameAt = (id, para = Infinity) => {
        const e = byId.get(id);
        if (!e) return null;
        const s = steps(id).filter(([from]) => from <= para);
        return s.length ? s.at(-1)[1] : KIND_WORD[e.kind] ?? 'something';
    };
    return { nameAt, steps };
}

/** A question's (or an account's) label at a paragraph: its `labels` (`[{from, label}]`), the latest begun, else its `label`. */
export function questionLabelAt(q, para = Infinity) {
    const s = (q.labels ?? []).filter((l) => l.from <= para).sort((a, b) => a.from - b.from);
    return s.length ? s.at(-1).label : q.labels?.length ? [...q.labels].sort((a, b) => a.from - b.from)[0].label : q.label;
}
/** A question's [from, label] steps, from where it is raised (`from`). */
export const questionSteps = (q, from) => (q.labels?.length ? q.labels.map((l) => [Math.max(l.from, from), l.label]).sort((a, b) => a[0] - b[0]) : [[from, q.label]]);
/** A time point's [from, label] steps. */
export const timeSteps = (t) => (t.labels?.length ? t.labels.map((l) => [l.from, l.label]).sort((a, b) => a[0] - b[0]) : [[t.para ?? 0, t.label]]);
/** A time point's label at a paragraph (UNTOLD_TIME before the story dates it). */
export function timeLabelAt(t, para = Infinity) {
    const s = timeSteps(t).filter(([from]) => from <= para);
    return s.length ? s.at(-1)[1] : UNTOLD_TIME;
}
