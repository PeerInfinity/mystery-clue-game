// The case a page check plays (CASE=<dir>, a directory under the site root with story.txt and world/; default
// cases/miniatures/rent-box), as the page addresses it (ui/world-case.js: `?case=`, and its saves' names).
import path from 'node:path';
/** The headless Chrome a check drives: its debugging port (CDP_PORT, default 9333), so checks can run side by side, each on its own. */
export const CDP = `http://127.0.0.1:${process.env.CDP_PORT ?? 9333}`;
export const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const DEFAULT = 'cases/miniatures/rent-box';
export const CASE = (process.env.CASE ?? DEFAULT).replace(/\/+$/, '');
export const WORLD = path.join(ROOT, CASE, 'world');
const key = CASE.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
// BRIDGE=1: the page as it is played in an Archipelago, against the stand-in host of ui/bridge.js (`?bridge=stub`),
// whose game is named after the seed; the save is that game's.
export const BRIDGE = !!process.env.BRIDGE;
export const STORE = BRIDGE ? `${key}-world-ap-${process.env.OFFLINE ? "offline-" : ""}stub-${Number(process.env.SEED ?? 1)}` : `${key}-world-v2`;
export const AUTOPLAY_STORE = `${key}-world-autoplay-v2`;
/** The page's address for this case on server `base`, with more parameters (`autoplay=fast`). */
// The page marks the answers from the evidence by default (since 2026-11-19); a check that does not say plays with
// the answers marked by hand, as its moves were written (ANSWERS=evidence: with the default).
export const pageUrl = (base, extra = '') => { const q = [`case=${encodeURIComponent(CASE)}`, extra, /(^|&)answers=/.test(extra) ? '' : `answers=${process.env.ANSWERS || 'hand'}`].filter(Boolean).join('&'); return q ? `${base}?${q}` : base; };
