// The case a page check plays (CASE=<dir>, a directory under the site root with story.txt and world/; default
// cases/silver-blaze), as the page addresses it (ui/world-case.js: `?case=`, and its saves' names).
import path from 'node:path';
export const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const DEFAULT = 'cases/silver-blaze';
export const CASE = (process.env.CASE ?? DEFAULT).replace(/\/+$/, '');
export const IS_DEFAULT = CASE === DEFAULT;
export const WORLD = path.join(ROOT, CASE, 'world');
const key = IS_DEFAULT ? 'silver-blaze' : CASE.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const STORE = `${key}-world-v1`;
export const AUTOPLAY_STORE = `${key}-world-autoplay`;
/** The page's address for this case on server `base`, with more parameters (`autoplay=fast`). */
export const pageUrl = (base, extra = '') => { const q = [IS_DEFAULT ? '' : `case=${encodeURIComponent(CASE)}`, extra].filter(Boolean).join('&'); return q ? `${base}?${q}` : base; };
