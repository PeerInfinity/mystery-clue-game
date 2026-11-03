// Incremental mode's page: the Search tab and the search's clock. The automation (engine/automation.js) plans a check,
// the page shows it with a bar that fills over the time a check takes (Settings: "Time per check"), then makes it.
// The tab shows what the story waits for, the check under way and the next of each category, the counts per
// category with the numbers they are made of, and a log of the checks made. The player steers with the marks the
// game has (circles, cross-outs, important, unimportant) and pauses or resumes each category.
import { Automation, CATEGORIES, SEARCHED, waitCategory } from '../engine/automation.js';
import { INCREMENTAL } from '../engine/game.js';
import * as TL from '../engine/timeline.js';

export const CATEGORY_WORDS = {
    collect: ['Collect', 'click every span of the story read'],
    ask: ['Ask what I know', 'every person, thing and event held'],
    build: ['Build inferences', 'connect cards while “onto something”'],
    notice: ['Mark as important', 'each card held, kept if the story stops waiting'],
    raise: ['Raise an exception', 'each exception open against a card held'],
    check: ['Seal a check', 'each check, part by part, then what to expect'],
    absence: ['File an absence', 'what should have happened, when, who would have noticed'],
    drop: ['Drop a wrong turn', 'each hypothesis shown, then each reason'],
    answers: ['Answers', 'the other route to a deduction; not searched'],
};
const WAIT_WORDS = {
    deduction: 'a deduction Holmes is about to make',
    notice: 'a detail Holmes is about to point to',
    raise: 'a step Holmes is about to take apart',
    check: 'a check Holmes is about to make',
    absence: 'something that did not happen, which Holmes is about to point to',
    drop: 'a wrong turn the story is about to leave behind',
};
const OUT_WORDS = { yes: 'yes', no: 'no', found: 'found' };
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
/** A count as a person reads it: grouped digits up to a million, then a × 10ⁿ. */
export function num(n) {
    if (n < 1e6) return Math.round(n).toLocaleString('en');
    const [m, e] = n.toExponential(2).split('e');
    return `${m} × 10${String(Number(e)).replace(/./g, (c) => SUP[c])}`;
}

/**
 * The search, given the page's helpers: {$, esc, game: () => Game, model: () => model, names: {card, slot, value},
 * quiet(fn) (a piece of work that may wait on the solver, without the busy veil), changed() (save, draw everything),
 * draw() (draw the search's own pieces), delay() (milliseconds a check takes), store (localStorage key)}.
 */
export function makeSearch(ctx) {
    const { esc } = ctx;
    // floors: the grow-only heights (and widths) of the tab's pieces, see floors() below.
    const S = { a: null, playing: false, timer: null, startedAt: 0, busy: false, onlyFound: false, saveCountdown: 0, floors: new Map(), chars: new Map(), floorRead: 0 };

    function load() {
        try { return JSON.parse(localStorage.getItem(ctx.store) ?? 'null'); } catch { return null; }
    }
    function save() {
        if (!S.a) return;
        try { localStorage.setItem(ctx.store, JSON.stringify({ playing: S.playing, automation: S.a.save() })); } catch { /* full, or private mode */ }
    }
    function clear() { try { localStorage.removeItem(ctx.store); } catch { /* private mode */ } }

    /** Start (or stop) with the game: an automation for an incremental game, kept with what was saved. */
    function attach(fresh = false) {
        stop();
        const g = ctx.game();
        if (g.pace !== INCREMENTAL) { S.a = null; return; }
        if (fresh) clear();
        const saved = load();
        const time = (id) => TL.times(g).find((t) => t.id === id)?.label ?? id;
        S.floors.clear(); S.chars.clear();
        S.a = new Automation(g, { autoRead: false, names: { ...ctx.names, time }, state: saved?.automation ?? null });
        S.playing = saved?.playing ?? true;
        kick();
    }
    function stop() { clearTimeout(S.timer); S.timer = null; }

    /** The game changed (a move of the player's, a paragraph read): plan again, and go on if playing. */
    function kick() {
        if (!S.a) return;
        if (S.timer || S.busy) return;
        if (S.playing) S.timer = setTimeout(tick, 0);
    }
    /** Plan the next check and wait the time it takes; then make it. */
    async function tick() {
        S.timer = null;
        if (!S.a || !S.playing || S.busy) return;
        let c = null;
        await ctx.quiet(() => { c = S.a.next(); });
        // Paused, or another tick started, while the plan waited on the solver.
        if (!S.playing || S.timer || S.busy) return;
        if (!c) { ctx.draw(); return; }
        const ms = ctx.delay();
        S.startedAt = Date.now();
        S.timer = setTimeout(make, ms);
        ctx.draw();
    }
    async function make() {
        S.timer = null;
        if (!S.a || !S.playing) return;
        S.busy = true;
        let changedAny = false;
        try {
            const ms = ctx.delay();
            const t0 = Date.now();
            // At no wait, as many checks as fit in a moment, then the page is drawn.
            do {
                const read = ctx.game().read;
                let e = null;
                await ctx.quiet(() => { e = S.a.execute(); });
                if (!e) break;
                // What the whole page shows changed: a find, a card collected or asked about, a paragraph read.
                if (e.out === 'found' || ['collect', 'ask'].includes(e.cat) || ctx.game().read !== read) changedAny = true;
                if (ms > 0) break;
                await ctx.quiet(() => S.a.next());
            } while (Date.now() - t0 < 40 && S.a.current && S.playing);
            // The next check planned before the page is drawn: the tab never shows "nothing under way" in between.
            if (S.playing) await ctx.quiet(() => S.a.next());
        } finally { S.busy = false; }
        if (--S.saveCountdown <= 0 || changedAny) { save(); S.saveCountdown = 20; }
        if (changedAny) ctx.changed(); else ctx.draw();
        kick();
    }

    function play(on) {
        S.playing = on;
        if (!on) stop();
        save();
        ctx.draw();
        kick();
    }

    // ---------- drawing ----------
    /** The bar of the check under way: it goes on from where it was when the page is drawn again. */
    function bar(cls = '') {
        const ms = ctx.delay();
        if (!S.a?.current || !S.playing || !S.timer) return `<div class="search-bar ${cls}"><div class="search-fill idle"></div></div>`;
        const gone = Math.min(ms, Date.now() - S.startedAt);
        return `<div class="search-bar ${cls}"><div class="search-fill run" style="animation-duration:${Math.max(ms, 1)}ms;animation-delay:-${gone}ms"></div></div>`;
    }
    function waitsHtml() {
        const open = S.a.open;
        if (!open.length) return '';
        const words = open.map((w) => (w.keep ? 'an inference to build before the story states it' : WAIT_WORDS[w.row.split('|')[1]]));
        const counts = new Map();
        for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
        return [...counts].map(([w, n]) => (n > 1 ? `${n} × ${w}` : w)).join('; ');
    }
    function idleWords() {
        switch (S.a.idle()) {
            case 'end': return 'The story is over.';
            case 'reading': return 'The story is not waiting: read on (or let the search read on by itself).';
            case 'paused': return `The story waits for a category that is paused: ${[...new Set(S.a.open.map(waitCategory).filter((c) => !S.a.running.has(c)))].map((c) => CATEGORY_WORDS[c][0]).join(', ')}.`;
            case 'stuck': return 'Everything that can be tried with what you hold has been tried. Collect or build more, or change your marks.';
            default: return '';
        }
    }
    /** The reading bar's line: what the story waits for and the check under way. */
    function readerHtml() {
        if (!S.a) return '';
        if (!S.a.open.length && !S.a.current) return '';
        const now = S.a.current;
        return `<div class="note block search-note">The story waits for ${esc(waitsHtml() || 'nothing')}.${now ? ` <span class="link" data-tab-open="search">Searching</span>: ${esc(now.label)}` : ` <span class="link" data-tab-open="search">${esc(idleWords())}</span>`}${now ? bar('in-reader') : ''}</div>`;
    }
    function tabLabel() { return S.a ? `Search (${num(S.a.n)})` : 'Search'; }

    function tool() {
        if (!S.a) return '<h3 class="section">The search</h3><p class="small muted">The search runs in incremental mode only (Settings: Pace).</p>';
        const a = S.a;
        const sec = ctx.delay() / 1000;
        let h = '<h3 class="section">The search</h3>';
        h += `<div class="search-controls"><button data-search-play="${S.playing ? '0' : '1'}">${S.playing ? '⏸ Pause' : '▶ Search'}</button>
<label class="small"><input type="checkbox" data-search-autoread ${a.autoRead ? 'checked' : ''}> Read on by itself</label>
<span class="small muted">${num(a.n)} checks · one every ${sec} s (Settings)</span></div>`;
        // Every piece is drawn even when empty, and keeps the largest size it has had (floors()): the page does not jump.
        h += `<div class="small search-waits" data-floor="waits">${a.open.length ? `Before ¶${ctx.game().read}, the story waits for ${esc(waitsHtml())}.` : ''}</div>`;
        h += `<div class="search-now" data-floor="now">${a.current
            ? `<div class="small"><b>${S.playing ? 'Now' : 'Next'}:</b> <span class="cat-tag">${esc(CATEGORY_WORDS[a.current.cat][0])}</span> ${esc(a.current.label)}</div>${bar()}`
            : `<p class="small muted">${esc(idleWords())}</p>`}</div>`;
        // The checks to come while nothing is found (automation.queue()).
        let queue = [];
        try { queue = a.queue(); } catch { queue = a.current ? [a.current] : []; }
        h += '<h4 class="sub">Next up</h4><div data-floor="queue">';
        if (queue.length > 1) {
            h += '<ol class="search-queue small">';
            for (const c of queue.slice(1)) h += `<li><span class="cat-tag">${esc(CATEGORY_WORDS[c.cat][0])}</span> ${esc(c.label)}</li>`;
            h += '</ol>';
        }
        h += `<p class="small muted">${queue.length > 1
            ? 'In the order they will be made while nothing is found: every collect, then every ask, then the next check of each category the story waits for, in turn. A find changes what comes after it.'
            : queue.length ? 'What comes after this check depends on what it finds.' : ''}</p></div>`;
        // The counts.
        let counts = null;
        try { counts = a.counts(); } catch { /* waiting on the solver: the last drawn stand */ }
        counts = counts ?? S.lastCounts;
        S.lastCounts = counts;
        if (counts) {
            h += `<h4 class="sub">What there is to try</h4><div class="search-table-wrap" data-floor="table"><table class="search-table small"><thead><tr><th></th><th>Category</th><th>In all</th><th>Checked</th><th>Found</th><th>Ruled out</th><th>Stale</th></tr></thead><tbody>`;
            for (const cat of CATEGORIES) {
                const x = counts[cat];
                const searched = SEARCHED.includes(cat);
                const waiting = a.families.has(cat);
                const pct = x.total ? x.ruledOut / x.total : 0;
                const terms = x.terms.filter((t) => x.terms.length === 1 || t.factors.every((f) => f.n > 0)).map((t) => (x.terms.length > 1 ? `${esc(t.label)}: ` : '') + t.factors.map((f) => `${num(f.n)} ${esc(f.label)}`).join(' × ')).join(' + ');
                h += `<tr class="${waiting ? 'waiting' : ''}"><td>${searched ? `<input type="checkbox" data-search-run="${cat}" ${a.running.has(cat) ? 'checked' : ''} title="Search this category">` : ''}</td>
<td title="${esc(CATEGORY_WORDS[cat][1])}">${esc(CATEGORY_WORDS[cat][0])}${waiting ? ' <span class="small muted">· waited for</span>' : ''}</td>
<td>${wide(`${cat}:total`, x.total)}</td><td>${wide(`${cat}:checked`, x.checked)}</td><td>${wide(`${cat}:found`, x.found)}</td>
<td>${wide(`${cat}:ruledOut`, x.ruledOut)}<div class="search-bar thin"><div class="search-fill" style="width:${(100 * pct).toFixed(1)}%"></div></div></td><td>${wide(`${cat}:stale`, x.stale)}</td></tr>
<tr class="terms"><td></td><td colspan="6" class="muted">${terms} ${x.terms.length > 1 || x.terms[0]?.factors.length > 1 ? `= ${num(x.total)}` : ''}</td></tr>`;
            }
            h += '</tbody></table></div><p class="small muted">In all: what could be tried with what you hold now, the numbers it is made of beneath. Ruled out: known not to make anything now. Stale: a “no” that something new may have turned into a “yes”, to be checked again.</p>';
        }
        // The log, newest first.
        const log = a.log.filter((e) => !S.onlyFound || e.out === 'found').slice(-150).reverse();
        h += `<h4 class="sub">What has been tried</h4><label class="small"><input type="checkbox" data-search-onlyfound ${S.onlyFound ? 'checked' : ''}> Only what was found</label><ol class="search-log small" data-floor="log">`;
        for (const e of log) h += `<li data-n="${e.n}" class="out-${e.out}"><span class="muted">#${num(e.n)} ¶${e.para}</span> <span class="cat-tag">${esc(CATEGORY_WORDS[e.cat][0])}</span> ${esc(e.label)} → <b>${OUT_WORDS[e.out]}</b>${e.what ? `: ${esc(e.what)}` : ''}</li>`;
        h += `</ol>${log.length ? '' : '<p class="small muted">Nothing yet.</p>'}`;
        return h;
    }

    // ---------- a page that does not jump ----------
    // Two kinds of floor, as in the Prestige Tree loader. (1) Each piece of the tab marked data-floor keeps the largest
    // height it has had: a piece may grow, never shrink back, so what is below it stays where it is. (2) Each number in
    // the table sits in its own box whose width in characters only grows (wide()), with tabular figures: a number that
    // gets longer does not move its column back and forth. The floors are the page's, not the save's: they start again
    // when the story moves on (the page is laid out afresh then anyway), and a piece whose width changed (the window,
    // the layout) is measured afresh. (Measured column widths were tried and fed back on themselves: a table spreads
    // its spare width over the columns, and the floor kept the spread.)
    function fresh() {
        const read = ctx.game().read;
        if (S.floorRead !== read) { S.floors.clear(); S.chars.clear(); S.floorRead = read; }
    }
    function wide(key, n) {
        fresh();
        const t = num(n);
        const ch = Math.max(t.length, S.chars.get(key) ?? 0);
        S.chars.set(key, ch);
        return `<span class="num" style="min-width:${ch}ch">${t}</span>`;
    }
    function floors(root) {
        fresh();
        const els = [...root.querySelectorAll('[data-floor]')];
        if (root.matches('[data-floor]')) els.unshift(root);
        for (const el of els) {
            const key = el.dataset.floor;
            const along = el.offsetWidth;   // a floor holds at one width
            if (!along) continue;           // not laid out (a hidden tab)
            const f = S.floors.get(key);
            const keep = f && f.along === along ? f.px : 0;
            el.style.minHeight = keep ? `${keep}px` : '';
            S.floors.set(key, { along, px: Math.max(el.offsetHeight, keep) });   // the whole box (border-box, style.css)
        }
    }
    /** Before the tab is drawn again: where the log was scrolled to, as the entry at its top. */
    function hold(body) {
        const log = body?.querySelector('.search-log');
        if (!log || log.scrollTop <= 0) return null;
        const li = [...log.children].find((x) => x.offsetTop + x.offsetHeight > log.scrollTop);
        return { top: log.scrollTop, n: li?.dataset.n, d: li ? li.offsetTop - log.scrollTop : 0 };
    }
    /** After: the floors, and the log scrolled back to the same entry (new entries come in above it, out of view). */
    function fit(body, held) {
        if (!body) return;
        floors(body);
        const log = body.querySelector('.search-log');
        if (!log || !held) return;
        const li = held.n && log.querySelector(`li[data-n="${held.n}"]`);
        log.scrollTop = li ? li.offsetTop - held.d : held.top;
    }
    /** The tab drawn again in place: the panel's scroll, the log's and the floors kept. */
    function paint(body) {
        const held = hold(body);
        const top = body.scrollTop;
        body.innerHTML = tool();
        fit(body, held);
        body.scrollTop = top;
    }

    // ---------- the player's clicks ----------
    function onClick(e) {
        const play = e.target.closest('[data-search-play]');
        if (play) { if (S.a) S.a.restart(); playOn(play.dataset.searchPlay === '1'); return true; }
        return false;
    }
    function playOn(on) { play(on); }
    function onChange(e) {
        if (!S.a) return false;
        if (e.target.dataset.searchRun) { S.a.setRunning(e.target.dataset.searchRun, e.target.checked); save(); ctx.draw(); kick(); return true; }
        if ('searchAutoread' in e.target.dataset) { S.a.autoRead = e.target.checked; S.a.current = null; save(); ctx.draw(); kick(); return true; }
        if ('searchOnlyfound' in e.target.dataset) { S.onlyFound = e.target.checked; ctx.draw(); return true; }
        return false;
    }
    /** The player moved: the marks may have changed the order, the hand the space. */
    function moved() {
        if (!S.a || S.busy) return;
        S.a.restart();
        stop();
        kick();
    }

    /** Per card held, what the search still has to try with it (Automation.perCard); null while the solver is busy. */
    function perCard() { try { return S.a?.perCard() ?? null; } catch { return null; } }

    return { attach, clear, tool, paint, perCard, hold, fit, floors, readerHtml, tabLabel, onClick, onChange, moved, save, active: () => !!S.a, get automation() { return S.a; } };
}
