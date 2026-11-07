// Which case the timeline shows: `?case=<dir>` (a directory with story.txt and world/, relative to the site root),
// by default cases/silver-blaze. Its saves are named after it, Silver Blaze's keeping their old names.
const DEFAULT = 'cases/silver-blaze';
export const CASE = (new URLSearchParams(location.search).get('case') ?? DEFAULT).replace(/\/+$/, '');
const key = CASE === DEFAULT ? 'silver-blaze' : CASE.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const PLAYER_STORE = `${key}-world-v1`;
export const AUTOPLAY_STORE = `${key}-world-autoplay`;
/** The page's own address for this case: `./`, with `?case=` kept when it is not the default; `extra` more parameters. */
export const pageUrl = (extra = '') => { const q = [CASE === DEFAULT ? '' : `case=${encodeURIComponent(CASE)}`, extra].filter(Boolean).join('&'); return q ? `./?${q}` : './'; };
