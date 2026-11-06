// The autoplay of Watson's timeline: the true path (cases/silver-blaze/world/path.json) played through the page, from
// the first paragraph to the last, as a careful reader plays it. Each move is made with the page's own controls (a
// click on the element, a value chosen and its change dispatched), a cursor gliding to each; the caption says the move
// in plain words and the reader's thought (`why`); what a move shows the reader (`see`) is highlighted for a moment.
// Loaded by ui/world.js only on `?autoplay`, in a save of its own (the player's timeline is kept aside); it plays in
// the viewer's layout, choosing tabs as a player would. `?autoplay=fast` plays with no pauses and no cursor (the check,
// scripts/world-autoplay-check.mjs). The same moves are checked by scripts/path-check.mjs from outside the page.

const CASE = 'cases/silver-blaze';
const SPEEDS = [['0.25', '¼×'], ['0.5', '½×'], ['1', '1×'], ['2', '2×'], ['4', '4×']];
const $ = (sel) => document.querySelector(sel);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/["\\]/g, '\\$&');
const LEVELS = { distrusted: 0, uncertain: 1, trusted: 2 };
class Stopped extends Error {}
class Failed extends Error {}

export async function start({ store, fast = false }) {
    const path = await fetch(`${CASE}/world/path.json`, { cache: 'no-cache' }).then((r) => r.json());
    const moves = path.moves;
    const s = { speed: fast ? 0 : 1, paused: false, stepping: false, stopped: false, failed: null, done: false, moves: 0, lastCaption: '' };
    const factor = () => (fast ? 0 : s.speed);
    const gate = async () => { while (s.paused && !s.stopped) await sleep(150); if (s.stopped) throw new Stopped(); };
    const wait = async (ms) => { const f = factor(); if (f) await sleep(ms / f); await gate(); };
    const saved = () => { try { return JSON.parse(localStorage.getItem(store) ?? '{}'); } catch { return {}; } };
    const status = () => ({ para: saved().para ?? 1, moves: s.moves, failed: s.failed, done: s.done, stopped: s.stopped });
    window.__autoplay = status();

    // ---------- the strip and the cursor ----------
    const strip = document.createElement('div');
    strip.className = 'autoplay-strip';
    strip.innerHTML = `<span class="ap-title">Autoplay · the careful reader</span> <span id="ap-para" class="small"></span> <span id="ap-caption" class="ap-caption"></span>
        <span class="ap-tools"><button id="ap-pause" class="quiet">Pause</button>
        <button id="ap-step" class="quiet" title="Make the next move or read the next paragraph, then pause">Step</button>
        <select id="ap-speed" aria-label="Speed">${SPEEDS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
        <button id="ap-stop" class="quiet" title="Back to your own timeline">Stop</button></span>`;
    document.body.append(strip);
    document.body.classList.add('autoplaying');
    const cursor = document.createElement('div');
    cursor.className = 'autoplay-cursor';
    cursor.innerHTML = '<svg viewBox="0 0 16 22" width="16" height="22" aria-hidden="true"><path d="M1 1 L1 17 L5 13 L8 20 L11 19 L8 12 L14 12 Z" /></svg>';
    if (!fast) document.body.append(cursor);
    $('#ap-speed').value = '1';
    $('#ap-speed').addEventListener('change', (e) => { s.speed = Number(e.target.value); });
    const caption = (text) => { if (!s.paused) s.lastCaption = text; $('#ap-caption').textContent = text; };
    const setPaused = (on, why = 'Paused: the page is yours to look round; resume to go on.') => {
        s.paused = on;
        $('#ap-pause').textContent = on ? 'Resume' : 'Pause';
        $('#ap-caption').textContent = on ? why : s.lastCaption;
    };
    $('#ap-pause').addEventListener('click', () => { s.stepping = false; setPaused(!s.paused); });
    $('#ap-step').addEventListener('click', () => { s.stepping = true; if (s.paused) setPaused(false); });
    const stepped = () => { if (s.stepping) { s.stepping = false; setPaused(true, `${s.lastCaption} · paused`); } };
    $('#ap-stop').addEventListener('click', () => { s.stopped = true; s.paused = false; location.href = 'world.html'; });
    const ending = (text) => {
        $('#ap-caption').textContent = text;
        strip.querySelector('.ap-tools').innerHTML = '<a class="button" href="world.html">Back to your timeline</a>';
        cursor.remove();
        document.body.classList.remove('autoplaying');
        window.__autoplay = status();
    };

    // ---------- moving through the page ----------
    // Every drawing replaces the page's parts, so an element is always looked up afresh by its selector.
    const shown = (el) => !!el && el.offsetParent !== null;
    const tabbed = () => document.body.classList.contains('tabbed');
    const twoCols = () => tabbed() && !$('#tabbed').classList.contains('one');
    async function glide(el) {
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        if (!factor()) return;
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
        const panel = twoCols() && part === 'detail' ? 1 : 0;
        await press(`#tabbed .panel[data-panel="${panel}"] [data-tab="${part}"]`);
    }
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
    /** What a move works on, opened in the detail: a fact on the timeline, or a question. */
    async function openOn(on) {
        if (/^(hyp|pre):/.test(on)) on = `q:${on.slice(4).split('=')[0]}`;
        if (on.startsWith('q:')) return press(`#q-box a.link[data-q="${esc(on.slice(2))}"]`);
        return (await press(`#timeline [data-fact="${esc(on)}"] .ph`)) || press(`#timeline [data-fact="${esc(on)}"]`);
    }
    /** Highlight for a moment the smallest part of the page that shows what the move was for. */
    async function seen(pattern) {
        const re = new RegExp(pattern);
        // Looked for in every part, shown or not (in tabs, the contradictions may be in a tab not chosen): textContent,
        // since innerText is empty for what is not drawn. Choosing its tab draws the page afresh: looked up again.
        const find = () => {
            const hits = [...document.querySelectorAll('#detail li, #detail p, #detail td, #clashes li, #lapse-news, .notice p')].filter((e) => re.test(e.textContent.replace(/\s+/g, ' ')));
            return hits.find((e) => !hits.some((o) => o !== e && e.contains(o))) ?? hits[0];
        };
        let el = find();
        if (!el) return false;
        if (!fast) {
            if (!shown(el)) { await showPart(el); el = find(); }
            el.scrollIntoView({ block: 'center' });
            el.classList.add('ap-seen');
            await wait(2200);
            el.classList.remove('ap-seen');
        }
        return true;
    }
    const qLabel = (q) => $(`#q-box a.link[data-q="${esc(q)}"]`)?.innerText ?? q;
    const chipSel = (m) => `#q-box [data-mark-q="${esc(m.q)}"][data-mark-pick="${esc(m.pick)}"]`;
    const isRight = (m) => m.do === 'circle' && !moves.some((x) => x.do === 'cross' && x.q === m.q && x.pick === m.pick);
    const WORDS = {
        a: 'Pointing out a change', b: 'What it needs and what it does', c: 'What is this for?', plan: 'What would this need?',
        stop: 'What stopped it?', compare: 'Comparing two plans', account: 'Does it account for this?', hold: 'I hold both',
    };
    async function words(m) {
        if (m.do === 'circle' || m.do === 'cross') {
            const pick = $(chipSel(m))?.innerText ?? m.pick;
            return `${m.do === 'cross' ? 'Crossing out' : isRight(m) ? 'Circling' : 'Trying'} “${pick}” on “${qLabel(m.q)}”`;
        }
        if (m.do === 'trust') return `Distrusting this statement: ${$('#detail h2')?.innerText ?? m.on}`;
        return WORDS[m.do] ?? 'A move';
    }

    async function play(m) {
        const on = m.on ?? (['a', 'b', 'c', 'plan'].includes(m.do) ? (m.a ?? m.of) : null);
        if (on && !(await openOn(on))) throw new Failed(`cannot open ${on}`);
        caption(`${await words(m)}${m.why ? ` — ${m.why}` : ''}`);
        const before = saved();
        switch (m.do) {
            case 'circle': case 'cross': {
                if (!$(chipSel(m))) await press(`#q-box [data-more-q="${esc(m.q)}"]`);
                const want = m.do === 'circle' ? 'circled' : 'crossed';
                for (let i = 0; i < 3 && saved().marks?.[m.q]?.[m.pick] !== want; i++) if (!(await press(chipSel(m)))) break;
                if (saved().marks?.[m.q]?.[m.pick] !== want) throw new Failed('the mark did not take');
                break;
            }
            case 'trust': {
                const sel = m.link ? `#detail .link-trust[data-key="${esc(m.link)}"]` : `#detail .person-trust[data-person="${esc(m.person)}"]`;
                if (!(await choose(sel, LEVELS[m.level]))) throw new Failed('no trust control');
                break;
            }
            case 'a': case 'b': case 'c': {
                const sel = m.do === 'a' ? `#detail [data-move-a="${esc(m.a)}"][data-with="${esc(m.b)}"]` : m.do === 'b' ? `#detail [data-move-b="${esc(m.of)}"]` : `#detail [data-move-c="${esc(m.of)}"][data-for="${esc(m.for)}"]`;
                if (!(await press(sel)) || (saved().reasoning?.length ?? 0) !== (before.reasoning?.length ?? 0) + 1) throw new Failed('the move did not take');
                break;
            }
            case 'plan': {
                const sel = `#detail [data-move-d="${esc(m.of)}"]`;
                if (!$(sel)) throw new Failed('no "What would this need?"');
                if ($(sel).innerText !== 'Hide') await press(sel);
                break;
            }
            case 'stop': case 'compare': case 'account': {
                const sel = `#detail [data-${m.do}="${esc(m.key)}"]`, d = `#detail [data-move-d="${esc(m.key.split('|')[0])}"]`;
                if (!$(sel) && $(d) && $(d).innerText !== 'Hide') await press(d);
                if (!(await press(sel))) throw new Failed('the check is not offered');
                break;
            }
            case 'hold':
                if (!(await press(`[data-hold="${esc(m.strain)}"]`))) throw new Failed('the likely clash is not shown');
                break;
            default: throw new Failed(`unknown move ${m.do}`);
        }
        if (m.see && !(await seen(m.see))) throw new Failed(`not on the page: ${m.see}`);
        s.moves++;
        window.__autoplay = status();
        stepped();
        await wait(2200);   // time to read the caption
    }
    async function readTo(p) {
        while ((saved().para ?? 1) < p) {
            const now = saved().para ?? 1;
            caption(`Reading ¶${now + 1}`);
            await press('#next');
            const after = saved().para ?? 1;
            if (after === now) throw new Failed(`the gate held before ¶${now + 1}`);
            $('#ap-para').textContent = `¶${after}`;
            if (!$('#answer-news').hidden) {
                caption('The story gives answers away: each with the circle made for it.');
                await wait(3500);
                await press('[data-answers-close]');
            }
            window.__autoplay = status();
            stepped();
            await wait(1000);
        }
    }

    // ---------- the playthrough ----------
    try {
        // It starts paused (not the check), so the viewer can choose a speed first.
        if (!fast) { setPaused(true, 'A careful reader will read the story and fill in the timeline, move by move. Choose a speed, then press Start.'); $('#ap-pause').textContent = 'Start'; }
        await gate();
        for (const m of moves) {
            await readTo(m.at);
            try { await play(m); } catch (e) { if (e instanceof Failed) throw new Failed(`¶${m.at}, ${await words(m).catch(() => m.do)}: ${e.message}`); throw e; }
        }
        await readTo(Number($('#para').max));
        s.done = true;
        ending(`The end of the story: ${s.moves} moves, every question answered.`);
    } catch (e) {
        if (e instanceof Stopped) return;
        s.failed = e.message;
        ending(`The autoplay stopped: ${e.message}. This is a defect to fix.`);
    }
}
