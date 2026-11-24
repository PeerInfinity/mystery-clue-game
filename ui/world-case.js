// Which case the timeline shows: `?case=<dir>` (a directory with story.txt and world/, relative to the site root).
// With none, index.html has already sent the reader to the start page (start.html). Its saves are named after it.
export const CASE = (new URLSearchParams(location.search).get('case') ?? '').replace(/\/+$/, '');
const key = CASE.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const PLAYER_STORE = `${key}-world-v2`;
export const AUTOPLAY_STORE = `${key}-world-autoplay-v2`;
// In an Archipelago (ui/bridge.js): the id the framing web client gave the page, and the save of one game (one slot of one multiworld).
export const BRIDGE_ID = new URLSearchParams(location.search).get('iframeId');
export const bridgeStore = (game) => `${key}-world-ap-${String(game).replace(/[^A-Za-z0-9]+/g, '-')}`;
/** The page's own address for this case: `./`, with `?case=` kept when it is not the default; `extra` more parameters. */
export const pageUrl = (extra = '') => { const q = [`case=${encodeURIComponent(CASE)}`, extra].filter(Boolean).join('&'); return `./?${q}`; };
