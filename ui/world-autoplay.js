// The autoplay of Watson's timeline: the true path (cases/silver-blaze/world/path.json) played through the page, from
// the first paragraph to the last, as a careful reader plays it. Each move is made with the page's own controls (a
// click on the element, a value chosen and its change dispatched), a cursor gliding to each; the caption says the move
// in plain words and the reader's thought (`why`); what a move shows the reader (`see`) is highlighted for a moment.
// Loaded by ui/world.js only on `?autoplay`, in a save of its own (the player's timeline is kept aside); it plays in
// the viewer's layout, choosing tabs as a player would. `?autoplay=fast` plays with no pauses and no cursor (the check,
// scripts/world-autoplay-check.mjs). The same moves are checked by scripts/path-check.mjs from outside the page.

import { $, sleep, esc, Stopped, Failed, makeMover } from './world-moves.js';

import { CASE, pageUrl } from './world-case.js';
const SPEEDS = [['0.25', '¼×'], ['0.5', '½×'], ['1', '1×'], ['2', '2×'], ['4', '4×']];

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
    $('#ap-stop').addEventListener('click', () => { s.stopped = true; s.paused = false; location.href = pageUrl(); });
    const ending = (text) => {
        $('#ap-caption').textContent = text;
        strip.querySelector('.ap-tools').innerHTML = `<a class="button" href="${pageUrl()}">Back to your timeline</a>`;
        cursor.remove();
        document.body.classList.remove('autoplaying');
        window.__autoplay = status();
    };

    // ---------- moving through the page (ui/world-moves.js) ----------
    const { shown, showPart, press, play: make } = makeMover({ store, fast, factor, gate, cursor: fast ? null : cursor });

    /** Highlight for a moment the smallest part of the page that shows what the move was for. */
    async function seen(pattern) {
        const re = new RegExp(pattern);
        // Looked for in every part, shown or not (in tabs, the contradictions may be in a tab not chosen): textContent,
        // since innerText is empty for what is not drawn. Choosing its tab draws the page afresh: looked up again.
        const find = () => {
            const hits = [...document.querySelectorAll('#detail li, #detail p, #detail td, #clashes li, #lapse-news, .notice p, .rm td, .rm p, .desc-list li')].filter((e) => re.test(e.textContent.replace(/\s+/g, ' ')));
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
            const pick = $(chipSel(m))?.innerText ?? $(`a.ent[data-ent="${esc(m.pick)}"]`)?.innerText ?? m.pick;
            return `${m.do === 'cross' ? 'Crossing out' : isRight(m) ? 'Circling' : 'Trying'} “${pick}” on “${qLabel(m.q)}”`;
        }
        if (m.do === 'trust') return `Distrusting this statement: ${($(`#timeline [data-fact="${esc(m.on)}"]`)?.innerText ?? $('#detail h2')?.innerText ?? m.on).replace(/\s*¶\d+\s*$/, '')}`;
        if (m.do === 'way') { const [row, size] = m.way.split('|'); return `Marking ${$(`[data-way-row="${esc(row)}"] td`)?.innerText ?? row} ${m.mark} to ${size === 'person' ? 'a person' : 'something small'}`; }
        if (m.do === 'got') return 'Something got through';
        if (m.do === 'route') return 'Adding a link to the route';
        if (m.do === 'link') return `Pointing this out as relevant to “${qLabel(m.q)}”`;
        return WORDS[m.do] ?? 'A move';
    }

    async function play(m) {
        caption(`${await words(m)}${m.why ? ` — ${m.why}` : ''}`);
        await make(m);
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
