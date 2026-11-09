// The moves of Watson's timeline made through the page, as a player makes them: a click on the element, a value
// chosen and its change dispatched, the part brought into view by its tab first. Shared by the autoplay
// (ui/world-autoplay.js) and the hints' Do it (ui/world-hints.js); the moves are path.json's (docs/case-format.md).
// scripts/path-check.mjs makes the same moves from outside the page.

export const $ = (sel) => document.querySelector(sel);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const esc = (s) => String(s).replace(/["\\]/g, '\\$&');
export const LEVELS = { distrusted: 0, uncertain: 1, trusted: 2 };
export class Stopped extends Error {}
export class Failed extends Error {}
export const VIEWS = new Set(['plan', 'stop', 'compare', 'account']);
export const REASONING = new Set(['a', 'b', 'c']);
export const ROOM_MOVES = new Set(['way', 'got', 'route', 'link']);
/** `entry: "route"` in a link move: the route the player has built, whatever its id. */
const ROUTE_ENTRY = 'r:r:';

/** What a move works on, opened in the detail first: its `on`, or its own `a`/`of` for a move or a plan. */
export const onOf = (m) => m.on ?? (m.do === 'link' ? m.entry : ['a', 'b', 'c', 'plan'].includes(m.do) ? (m.a ?? m.of) : null);
/** The control that makes a move, once what it works on is open. */
export function controlOf(m) {
    switch (m.do) {
        case 'circle': case 'cross': return `#q-box [data-mark-q="${esc(m.q)}"][data-mark-pick="${esc(m.pick)}"]`;
        case 'trust': return m.link ? `#detail .link-trust[data-key="${esc(m.link)}"]` : `#detail .person-trust[data-person="${esc(m.person)}"]`;
        case 'a': return `#detail [data-move-a="${esc(m.a)}"][data-with="${esc(m.b)}"]`;
        case 'b': return `#detail [data-move-b="${esc(m.of)}"]`;
        case 'c': return `#detail [data-move-c="${esc(m.of)}"][data-for="${esc(m.for)}"]`;
        case 'plan': return `#detail [data-move-d="${esc(m.of)}"]`;
        case 'stop': case 'compare': case 'account': return `#detail [data-${m.do}="${esc(m.key)}"]`;
        case 'hold': return `[data-hold="${esc(m.strain)}"]`;
        case 'way': return `[data-way="${esc(`${m.way}|${m.mark}`)}"]`;
        case 'got': return `[data-got="${esc(m.of)}"]`;
        case 'route': return `[data-route-add="${esc(m.node)}"]`;
        case 'link': return `#detail [data-link-entry${m.entry === 'route' ? `^="${ROUTE_ENTRY}"` : `="${esc(m.entry)}"`}][data-link-q="${esc(m.q)}"]`;
        default: return null;
    }
}
/** The selector that opens `on` in the detail: a question, or a fact on the timeline. */
export function openerOf(on) {
    if (/^(hyp|pre):/.test(on)) on = `q:${on.slice(4).split('=')[0]}`;
    if (on.startsWith('q:')) return [`#q-box a.link[data-q="${esc(on.slice(2))}"]`];
    if (on === 'route') return [`#timeline [data-fact^="${ROUTE_ENTRY}"] .ph`, `#timeline [data-fact^="${ROUTE_ENTRY}"]`];
    return [`#timeline [data-fact="${esc(on)}"] .ph`, `#timeline [data-fact="${esc(on)}"]`];
}
export const savedOf = (store) => { try { return JSON.parse(localStorage.getItem(store) ?? '{}'); } catch { return {}; } };
const sameMove = (x, m) => x.move === m.do && (m.do === 'a' ? ((x.a === m.a && x.b === m.b) || (x.a === m.b && x.b === m.a)) : m.do === 'b' ? x.of === m.of : x.of === m.of && x.for === m.for);
/** Has the save got this move's effect? (Views have none.) */
export function made(m, save) {
    if (m.do === 'circle' || m.do === 'cross') return save.marks?.[m.q]?.[m.pick] === (m.do === 'circle' ? 'circled' : 'crossed');
    if (m.do === 'trust') return m.link ? (save.trust?.links?.[m.link] ?? LEVELS.uncertain) === LEVELS[m.level] : (save.trust?.people?.[m.person] ?? null) === LEVELS[m.level];
    if (REASONING.has(m.do)) return (save.reasoning ?? []).some((x) => sameMove(x, m));
    if (m.do === 'hold') return (save.held ?? []).includes(m.strain);
    if (m.do === 'way') return save.room?.ways?.[m.way] === m.mark;
    if (m.do === 'got') return (save.room?.got ?? []).includes(m.of);
    if (m.do === 'route') return (save.room?.route ?? []).includes(m.node);
    if (m.do === 'link') return (save.links ?? []).some((l) => l.q === m.q && (m.entry === 'route' ? l.entry.startsWith(ROUTE_ENTRY) : l.entry === m.entry));
    return false;
}

/**
 * A mover: `fast` (no cursor, no pauses), `factor()` the speed (0: none), `gate()` awaited before each step (pause,
 * stop), `cursor` the element to glide.
 */
export function makeMover({ store, fast = false, factor = () => 0, gate = async () => {}, cursor = null }) {
    const saved = () => savedOf(store);
    const shown = (el) => !!el && el.offsetParent !== null;
    const tabbed = () => document.body.classList.contains('tabbed');
    const twoCols = () => tabbed() && !$('#tabbed').classList.contains('one');
    async function glide(el) {
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        if (!cursor || !factor()) return;
        const r = el.getBoundingClientRect();
        const ms = 1000 / factor();
        cursor.style.transition = `transform ${ms}ms ease-in-out`;
        cursor.style.transform = `translate(${r.left + Math.min(r.width / 2, 40)}px, ${r.top + r.height / 2}px)`;
        await sleep(ms + 30);
        cursor.classList.remove('click'); void cursor.offsetWidth; cursor.classList.add('click');
    }
    /** Bring a part into view, as a player would: its tab, in the panel that does not hold the detail. */
    async function showPart(el) {
        if (shown(el) || !tabbed()) return;
        const part = el.closest('.part')?.dataset.part;
        if (!part) return;
        await press(`#tabbed .panel[data-panel="${twoCols() && part === 'detail' ? 1 : 0}"] [data-tab="${part}"]`);
    }
    // Every drawing replaces the page's parts, so an element is always looked up afresh by its selector.
    async function press(sel) {
        await gate();
        let el = $(sel);
        if (!el) return false;
        if (!shown(el)) { await showPart(el); el = $(sel); }
        if (!shown(el)) return false;
        await glide(el);
        el.click();
        await sleep(fast ? 0 : 60);
        return true;
    }
    async function choose(sel, value) {
        await gate();
        let el = $(sel);
        if (!el) return false;
        if (!shown(el)) { await showPart(el); el = $(sel); }
        await glide(el);
        el.value = String(value);
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }
    async function openOn(on) {
        for (const sel of openerOf(on)) if (await press(sel)) return true;
        return false;
    }
    /** Make a move; throws Failed when the page does not take it. */
    async function play(m) {
        const on = onOf(m);
        if (on && !(await openOn(on))) throw new Failed(`cannot open ${on}`);
        const before = saved(), sel = controlOf(m);
        switch (m.do) {
            case 'circle': case 'cross': {
                // An answer behind "More" shows by itself only while marked: on the way from crossed out to circled it
                // goes back behind "More" when uncertain, so More is opened again where needed.
                for (let i = 0; i < 3 && !made(m, saved()); i++) {
                    if (!$(sel)) await press(`#q-box [data-more-q="${esc(m.q)}"]`);
                    if (!(await press(sel))) break;
                }
                if (!made(m, saved())) throw new Failed('the mark did not take');
                break;
            }
            case 'trust':
                if (!(await choose(sel, LEVELS[m.level]))) throw new Failed('no trust control');
                break;
            case 'a': case 'b': case 'c':
                if (!(await press(sel)) || (saved().reasoning?.length ?? 0) !== (before.reasoning?.length ?? 0) + 1) throw new Failed('the move did not take');
                break;
            case 'plan':
                if (!$(sel)) throw new Failed('no "What would this need?"');
                if ($(sel).innerText !== 'Hide') await press(sel);
                break;
            case 'stop': case 'compare': case 'account': {
                const d = `#detail [data-move-d="${esc(m.key.split('|')[0])}"]`;
                if (!$(sel) && $(d) && $(d).innerText !== 'Hide') await press(d);
                if (!(await press(sel))) throw new Failed('the check is not offered');
                break;
            }
            case 'hold':
                if (!(await press(sel))) throw new Failed('the likely clash is not shown');
                break;
            case 'link':
                if (!$(sel)) await press('#detail [data-link-more]');   // a question the player has put below the line
                // falls through
            case 'way': case 'got': case 'route':
                if (!(await press(sel)) || !made(m, saved())) throw new Failed('the page did not take it');
                break;
            default: throw new Failed(`unknown move ${m.do}`);
        }
    }
    return { saved, shown, showPart, press, choose, openOn, play };
}

/**
 * Would the page take move m now? Answered at once, without a paint between (every call here is synchronous): what
 * it works on is opened, a mark or a trust is always possible once its control is there, a reasoning move is made and
 * undone. The caller puts the view back (the detail, the tabs) afterwards.
 */
export function allowedNow(m, store) {
    const on = onOf(m);
    if (on && !openerOf(on).some((sel) => { const el = $(sel); if (el) el.click(); return !!el; })) return false;
    if (m.do === 'circle' || m.do === 'cross') {
        if ($(controlOf(m))) return true;
        const more = $(`#q-box [data-more-q="${esc(m.q)}"]`);
        if (!more) return false;
        more.click();
        const ok = !!$(controlOf(m));
        $(`#q-box [data-more-q="${esc(m.q)}"]`)?.click();   // folded again
        return ok;
    }
    if (m.do === 'trust' || m.do === 'hold') return !!$(controlOf(m));
    if (REASONING.has(m.do)) {
        const el = $(controlOf(m));
        if (!el) return false;
        const n = savedOf(store).reasoning?.length ?? 0;
        el.click();
        const took = (savedOf(store).reasoning?.length ?? 0) === n + 1;
        if (took) $('#undo').click();
        return took;
    }
    if (ROOM_MOVES.has(m.do)) {
        if (m.do === 'link' && !$(controlOf(m))) $('#detail [data-link-more]')?.click();
        const el = $(controlOf(m));
        if (!el) return false;
        const state = () => { const s = savedOf(store); return JSON.stringify([s.room, s.links]); };
        const before = state();
        el.click();
        const took = state() !== before;
        if (took) $('#undo').click();
        return took;
    }
    return false;
}
