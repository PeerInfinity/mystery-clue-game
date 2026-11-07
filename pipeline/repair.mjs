// The repair rounds of a step (run.mjs), shared with the prompt rebuild (prompts.mjs) so that both make a repair's
// prompt the same way.
import { template, jsonLines } from './lib.mjs';

export const MAX_REPAIRS = 3;
/** A line's key: its file and id (a possibility by question and value, a door by itself, a card by its bk, a move by what it does). */
export const keyOf = (x) => `${x.file ?? ''}|${x.bk ?? (x.file === 'possibility' ? `${x.q}=${x.value}` : x.file === 'joins' ? x.door : x.file === 'path' ? `${x.do}:${x.q ?? x.on ?? ''}=${x.pick ?? x.link ?? ''}` : x.id)}`;
/** Earlier lines with a repair's lines merged in: a line with the same key replaces, `delete: true` removes, the rest are added. */
export function mergeLines(prev, fix) {
    const out = new Map(prev.map((x) => [keyOf(x), x]));
    for (const x of fix) { if (x.delete) out.delete(keyOf(x)); else out.set(keyOf(x), x); }
    return [...out.values()];
}
/**
 * The data steps (4 onward) ask a repair for only the lines that change, merged by key (asked for everything
 * again, a model shortens a long output and loses lines); the small steps for the whole output again.
 */
export const patching = (step) => step.n >= 4;
/** A repair's prompt: the task first (so that it shares its prefix, and the cache, with the call it repairs). */
export function repairPrompt(step, { task, items, text, errors }) {
    const p = patching(step);
    const previous = p ? '```jsonl\n' + items.map((x) => JSON.stringify(x)).join('\n') + '\n```' : text;
    return template(p ? 'repair-patch' : 'repair', { errors: errors.slice(0, 80).map((e) => `- ${e}`).join('\n'), previous, task });
}
/** The items after a repair's response. */
export function afterRepair(step, ctx, scene, items, text) {
    const got = jsonLines(text);
    let out = patching(step) ? mergeLines(items, got.items) : got.items;
    if (step.normalize) out = step.normalize(ctx, scene, out);
    return { items: out, bad: got.bad };
}
