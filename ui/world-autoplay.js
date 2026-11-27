// The autoplay of Watson's timeline: the true path (cases/miniatures/rent-box/world/path.json) played through the page, from
// the first paragraph to the last, as a careful reader plays it. Each move is made with the page's own controls (a
// click on the element, a value chosen and its change dispatched), a cursor gliding to each; the caption says the move
// in plain words and the reader's thought (`why`); what a move shows the reader (`see`) is highlighted for a moment.
// Loaded by ui/world.js only on `?autoplay`, in a save of its own (the player's timeline is kept aside); it plays in
// the viewer's layout, choosing tabs as a player would. `?autoplay=fast` plays with no pauses and no cursor (the check,
// scripts/world-autoplay-check.mjs). The same moves are checked by scripts/path-check.mjs from outside the page.
//
// `live` (in an Archipelago, asked for by the host: `mystery:autoSolve`, ui/bridge.js): the same reader in the player's
// own save, with no reload. It makes each move of the path not made yet whose papers are held, in the path's order;
// the visits and the day's end are the host's and are passed over; when what is left waits for a paper it says so
// (`live.report('waiting')`) and goes on by itself at the host's next state; a click by the player stops it.
// It ends when every question is solved (moves of the path may be left: those of a paper the answers did not need).
// `live`: {skipDay, delivered(story id), allSolved(), report(state, extra), states() (how many have come),
// nextState(n) → a promise of one after the nth}. Returns {stop(), running, done (a promise)}.
// `live.question` (with `live.solved(id)`, `live.open(id)`): only that question, by the moves the path makes for it
// (`for_q`); it ends when the question is solved, reads no further, and takes its strip away. A question that lacks a
// paper waits. What it solves on the way: the questions the asked one rests on (`live.rests`), and a question the story is about to answer
// holds the reading until it is answered (the gate; `live.gate()`), and the reader answers it, since reading past it
// is the only way on and would give it away. `instant`: as `fast`, and no strip.

import { $, sleep, esc, Stopped, Failed, makeMover, nextRead, readToOf, made, needsOf, DAY_MOVES } from './world-moves.js';
import { refList } from '../engine/refs.js';

import { CASE, pageUrl } from './world-case.js';
const SPEEDS = [['0.25', '¼×'], ['0.5', '½×'], ['1', '1×'], ['2', '2×'], ['4', '4×']];

export function start(opts) { const h = { stop: () => {}, running: true }; h.done = run(opts, h).finally(() => { h.running = false; }); return h; }
async function run({ store, fast = false, instant = false, live = null }, handle) {
    if (instant) fast = true;
    const target = live?.question ?? null;
    const path = await fetch(`${CASE}/world/path.json`, { cache: 'no-cache' }).then((r) => r.json());
    const moves = path.moves;
    // The case's files (sub-stories), read as each move needs them (world/case.json).
    const files = await fetch(`${CASE}/world/case.json`, { cache: 'no-cache' }).then((r) => r.json()).then((c) => c.files ?? []);
    const title = (id) => files.find((f) => f.id === id)?.title;
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
    // Under the header, the page's width, and in view as the header is (2026-11-24, the user's design): a row of the
    // controls, and the caption on a row of its own, one line cut short or all of it. A click on the caption goes
    // between the two, and the choice is kept on this device. The opening line and a stop are shown whole whichever
    // is chosen (`must`), since they are not to be missed.
    strip.innerHTML = `<div class="ap-row"><span class="ap-title">${live ? 'Solving' : 'Autoplay'} · the careful reader</span> <span id="ap-para" class="small"></span>
        <span class="ap-tools"><button id="ap-pause" class="quiet">Pause</button>
        <button id="ap-step" class="quiet" title="Make the next move or read the next paragraph, then pause">Step</button>
        <select id="ap-speed" aria-label="Speed">${SPEEDS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
        <button id="ap-stop" class="quiet" title="${live ? 'Stop: the timeline is yours again' : 'Back to your own timeline'}">Stop</button></span></div>
        <div id="ap-caption" class="ap-caption" role="button" tabindex="0" aria-expanded="false" title="Click to show all of it, or one line"><span class="ap-mark" aria-hidden="true"></span><span id="ap-text"></span></div>`;
    const head = document.querySelector('header.top');
    if (head) head.after(strip); else document.body.prepend(strip);
    if (instant) strip.hidden = true;
    document.body.classList.add('autoplaying', ...(instant ? [] : ['has-strip']));
    const FULL = 'autoplay-caption-full';
    const isFull = () => { try { return localStorage.getItem(FULL) === '1'; } catch { return false; } };
    const showFull = (on) => { strip.classList.toggle('full', on); $('#ap-caption').setAttribute('aria-expanded', String(on || strip.classList.contains('must'))); };
    showFull(isFull());
    const toggleFull = () => { const on = !strip.classList.contains('full'); try { localStorage.setItem(FULL, on ? '1' : '0'); } catch { /* not kept */ } showFull(on); };
    $('#ap-caption').addEventListener('click', toggleFull);
    $('#ap-caption').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFull(); } });
    const say = (text, must = false) => { $('#ap-text').textContent = text; strip.classList.toggle('must', must); };
    // What stays in view below the strip is told how tall it and the header are (the header only where it sticks).
    function measure() {
        document.body.style.setProperty('--ap', `${strip.offsetHeight}px`);
        document.body.style.setProperty('--head', `${head && getComputedStyle(head).position === 'sticky' ? head.offsetHeight : 0}px`);
    }
    if (typeof ResizeObserver === 'function') { const ro = new ResizeObserver(measure); ro.observe(strip); if (head) ro.observe(head); }
    window.addEventListener('resize', measure);
    measure();
    const cursor = document.createElement('div');
    cursor.className = 'autoplay-cursor';
    cursor.innerHTML = '<svg viewBox="0 0 16 22" width="16" height="22" aria-hidden="true"><path d="M1 1 L1 17 L5 13 L8 20 L11 19 L8 12 L14 12 Z" /></svg>';
    if (!fast) document.body.append(cursor);
    $('#ap-speed').value = '1';
    $('#ap-speed').addEventListener('change', (e) => { s.speed = Number(e.target.value); });
    const caption = (text) => { if (!s.paused) s.lastCaption = text; say(text); };
    const setPaused = (on, why = 'Paused: the page is yours to look round; resume to go on.', must = false) => {
        s.paused = on;
        $('#ap-pause').textContent = on ? 'Resume' : 'Pause';
        say(on ? why : s.lastCaption, on && must);
    };
    $('#ap-pause').addEventListener('click', () => { s.stepping = false; setPaused(!s.paused); });
    $('#ap-step').addEventListener('click', () => { s.stepping = true; if (s.paused) setPaused(false); });
    const stepped = () => { if (s.stepping) { s.stepping = false; setPaused(true, `${s.lastCaption} · paused`); } };
    // Live: a stop takes the strip away and leaves the page as it is; nothing is reloaded. A click of the player's own
    // anywhere else on the page is a stop too (the save is one, and two hands on it are one too many).
    let wake = () => {};
    const stop = () => { s.stopped = true; s.paused = false; wake(); };
    const byPlayer = (e) => { if (e.isTrusted && !strip.contains(e.target)) stop(); };
    const clear = () => {
        document.removeEventListener('click', byPlayer, true);
        window.removeEventListener('resize', measure);
        strip.remove(); cursor.remove();
        document.body.classList.remove('autoplaying', 'has-strip');
        document.body.style.removeProperty('--ap');
    };
    if (live) { document.addEventListener('click', byPlayer, true); handle.stop = stop; }
    $('#ap-stop').addEventListener('click', () => { if (live) return stop(); s.stopped = true; s.paused = false; location.href = pageUrl(); });
    const ending = (text) => {
        say(text, true);
        strip.querySelector('.ap-tools').innerHTML = live ? '<button id="ap-close" class="quiet">Close</button>' : `<a class="button" href="${pageUrl()}">Back to your timeline</a>`;
        $('#ap-close')?.addEventListener('click', clear);
        document.removeEventListener('click', byPlayer, true);
        cursor.remove();
        document.body.classList.remove('autoplaying');
        if (instant || target) clear();   // nobody to read it: the host is told
        window.__autoplay = status();
    };

    // ---------- moving through the page (ui/world-moves.js) ----------
    const { shown, showPart, press, play: make, readOne, byPage } = makeMover({ store, fast, factor, gate, cursor: fast ? null : cursor });

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
        a: 'Pointing out a change', s: 'Pointing out what its words speak of', b: 'What it needs and what it does', c: 'What is this for?', plan: 'What would this need?',
        stop: 'What stopped it?', compare: 'Comparing two plans', account: 'Does it account for this?', hold: 'I hold both',
    };
    async function words(m) {
        if (m.do === 'circle' || m.do === 'cross') {
            const pick = $(chipSel(m))?.innerText ?? $(`a.ent[data-ent="${esc(m.pick)}"]`)?.innerText ?? m.pick;
            return `${m.do === 'cross' ? 'Crossing out' : isRight(m) ? 'Circling' : 'Trying'} “${pick}” on “${qLabel(m.q)}”`;
        }
        if (m.do === 'trust') return `${{ confirmed: 'Trusting as confirmed', likely: 'Trusting as likely', unlikely: 'Distrusting as unlikely', 'ruled out': 'Ruling out' }[m.level] ?? 'Setting the trust of'}: ${($(`#timeline [data-fact="${esc(m.on)}"]`)?.innerText ?? $('#detail h2')?.innerText ?? m.on).replace(/\s*¶\d+\s*$/, '')}`;
        if (m.do === 'way') { const [row, size] = m.way.split('|'); return `Marking ${$(`[data-way-row="${esc(row)}"] td`)?.innerText ?? row} ${m.mark} to ${size === 'person' ? 'a person' : 'something small'}`; }
        if (m.do === 'got') return 'Something got through';
        if (m.do === 'route') return 'Adding a link to the route';
        if (m.do === 'link') return `Pointing this out as relevant to “${qLabel(m.q)}”`;
        if (m.do === 'visit') return `Going: ${files.find((f) => f.id === m.file)?.visit?.label ?? m.file}`;
        if (m.do === 'day') return 'Ending the day: the same morning begins again';
        return WORDS[m.do] ?? 'A move';
    }

    async function play(m) {
        // An answer the page marks from the evidence is not the reader's click: said as what the page has done (or
        // has left open, where the path's cross is the reader's own judgement), and pointed at.
        const how = byPage(m), pick = how ? String($(chipSel(m))?.innerText ?? $(`a.ent[data-ent="${esc(m.pick)}"]`)?.innerText ?? m.pick).replace(/\s*\(likely\)\s*$/, '') : null;
        caption(how === 'made' ? `The page has ${m.do === 'cross' ? 'crossed out' : 'circled'} “${pick}” on “${qLabel(m.q)}”: it follows from what is linked${m.why ? ` — ${m.why}` : ''}`
            : how === 'left' ? `“${pick}” on “${qLabel(m.q)}” stays open: the page crosses out only what the links rule out. The reader's own reason against it${m.why ? ` — ${m.why}` : ''}`
            : `${await words(m)}${m.why ? ` — ${m.why}` : ''}`);
        await make(m);
        if (m.see && !(await seen(m.see))) throw new Failed(`not on the page: ${m.see}`);
        s.moves++;
        window.__autoplay = status();
        stepped();
        await wait(2200);   // time to read the caption
    }
    // The floating notices (bottom right) are not left standing over the page: what each says goes in the caption
    // for a moment, and it is closed (2026-11-24, after the user's remark that they cover a lot of the screen).
    async function clearNotices() {
        // The gate's notice (the story waits for an answer) says what the autoplay is about to do anyway: hidden unsaid.
        if ($('#gate-news') && !$('#gate-news').hidden && $('[data-gate-hide]')) await press('[data-gate-hide]');
        for (const [box, close] of [['#solved-news', '[data-solved-close]'], ['#lapse-news', '[data-lapse-close]'], ['#answer-news', '[data-answers-close]']]) {
            const el = $(box);
            if (!el || el.hidden || !$(close)) continue;
            const text = (el.querySelector('li, p') ?? el).innerText.replace(/\s+/g, ' ').replace(/ Open it$/, '').trim();
            if (text) caption(text.length > 220 ? `${text.slice(0, 217)}…` : text);
            await wait(2500);
            await press(close);
        }
    }
    // Read on, in each story, to what `at` needs (a paragraph, or a list in several stories).
    async function readTo(at) {
        for (let story; (story = nextRead(at, files, readToOf(saved()))) != null;) {
            const now = readToOf(saved())(story);
            const tag = story === 'main' ? `¶${now + 1}` : `“${title(story)}”, ¶${now + 1}`;
            caption(`Reading ${tag}`);
            await readOne(story);
            const after = readToOf(saved())(story);
            if (after === now) throw new Failed(story === 'main' ? `¶${now + 1} could not be read (a question holds the story there, or the page did not take the press)` : `${tag} could not be read`);
            $('#ap-para').textContent = story === 'main' ? `¶${after}` : `${files.find((f) => f.id === story)?.short} ¶${after}`;
            if (!$('#answer-news').hidden) {
                caption('The story gives answers away: each with the circle made for it.');
                await wait(3500);
                await press('[data-answers-close]');
            }
            await clearNotices();
            window.__autoplay = status();
            stepped();
            await wait(1000);
        }
    }

    // ---------- the playthrough ----------
    try {
        // It starts paused (not the check), so the viewer can choose a speed first.
        if (!fast && !live) { setPaused(true, 'A careful reader will read the story and fill in the timeline, move by move. Choose a speed, then press Start.', true); $('#ap-pause').textContent = 'Start'; }
        await gate();
        const one = async (m) => {
            // A statement trusted already for another question's moves is not trusted again.
            if (m.do === 'trust' && made(m, saved())) return;
            await readTo(m.at);
            try { await play(m); } catch (e) { if (e instanceof Failed) throw new Failed(`¶${refList(m.at).join(', ')}, ${await words(m).catch(() => m.do)}: ${e.message}`); throw e; }
            await clearNotices();
        };
        const delivery = window.__delivery;
        if (live) {
            // What is left of the path, in its order, round after round: a move is tried when every paper it is told in
            // is held. One the page will not take yet (it rests on a move still waiting for its paper) is left for the
            // next round. A round that makes nothing: all made is the end; else it waits for a paper, unless a move was
            // refused with nothing before it waiting, which is a fault.
            const played = new Set();
            // (One question asked for: its moves, and those of each question found holding the reading on the way.)
            const wanted = new Set(target ? [target] : []);
            const mine = (m) => !target || !m.for_q || m.for_q.some((q) => wanted.has(q));
            const shutQ = (m) => !!target && !!m.for_q && !m.for_q.some((q) => wanted.has(q) && (live.solved(q) || live.open(q)));
            const todo = () => moves.map((m, i) => ({ m, i })).filter(({ m, i }) => !(live.skipDay && DAY_MOVES.has(m.do)) && mine(m) && !played.has(i) && !made(m, saved()));
            const over = () => (target ? live.solved(target) : live.allSolved());
            const held = (m) => Object.keys(needsOf(m.at, files)).every((id) => live.delivered(id));
            // Said to the host only when it changes: a state that brings nothing is not answered with the same again.
            let said = null;
            const report = (st, extra) => { const r = live.report(st, extra, said === st, [...wanted]); said = st; return r; };
            report('running');
            for (;;) {
                let did = 0, lacking = false, refused = null;
                const n = live.states();
                // One question asked for: the questions it rests on are answered too, and first (`live.rests`: those of
                // the way whose papers are held), and theirs. The host's rule for a question names papers only, with
                // those of what it rests on folded in, so it asks for a question as soon as the papers are held.
                for (let grew = !!target; grew;) { grew = false; for (const q of [...wanted]) if (!live.solved(q)) for (const r of live.rests(q)) if (!wanted.has(r)) { wanted.add(r); grew = true; } }
                // A question is not begun while it cannot be solved (a paper, or one it rests on: `shutQ`).
                for (const { m, i } of todo()) {
                    if (over()) break;
                    if (made(m, saved())) continue;
                    if (!held(m) || shutQ(m)) { lacking = true; continue; }
                    try { if (said !== 'running') report('running'); await one(m); played.add(i); did++; } catch (e) {
                        if (!(e instanceof Failed)) throw e;
                        if (!lacking && !refused) refused = { move: i, why: e.message };
                    }
                }
                if (over()) break;
                // The reading held by a question the story is about to answer: that one is answered too, and first.
                if (target) { const more = live.gate().filter((q) => !wanted.has(q)); if (more.length) { for (const q of more) wanted.add(q); continue; } }
                if (!todo().length && (!target || live.open(target))) { if (!target) break; refused ??= { move: null, why: `every move the path makes for ${target} is made, and it is not solved` }; }
                if (did) continue;
                if (refused) { s.failed = refused.why; ending(`The solving stopped: ${refused.why}.`); report('failed', { failed: refused }); return; }
                const w = report('waiting');
                say(`Waiting for ${w?.papers?.length ? `a paper: ${w.papers.map((id) => title(id) ?? id).join(', ')}` : 'what the Archipelago brings next'}.`, true);
                await new Promise((r) => { wake = r; live.nextState(n).then(r); });
                await gate();
            }
        } else if (delivery?.earned) {
            // Papers earned by solving questions: question by question (each move's `for_q`), the first in the path's
            // order that is open now; what solving it brought is shown a moment.
            const byQ = new Map();
            for (const m of moves) { const q = m.for_q?.[0] ?? null; if (!byQ.has(q)) byQ.set(q, []); byQ.get(q).push(m); }
            const left = new Set(byQ.keys());
            while (left.size) {
                const q = [...left].find((x) => x === null || delivery.open(x));
                if (q === undefined) throw new Failed(`no question left is open (${[...left].join(', ')})`);
                for (const m of byQ.get(q)) await one(m);
                left.delete(q);
                if (!$('#solved-news').hidden) {
                    caption($('#solved-news li')?.innerText.replace(/\s+/g, ' ').replace(/ Open it$/, '') ?? 'Solved.');
                    await wait(3000);
                    await press('[data-solved-close]');
                }
            }
        } else for (const m of moves) await one(m);
        // One question asked for: solved, and that is all.
        if (target) { s.done = true; clear(); window.__autoplay = status(); live.report('done'); return; }
        // The main story to its end: its last paragraph, as its tab shows it.
        if ($('.story-tab[data-story]') && !$('.story-tab[data-story="main"].on')) await press('.story-tab[data-story="main"]');
        await readTo(Number($('#para').max));
        s.done = true;
        ending(`The end of the story: ${s.moves} moves, every question answered.`);
        live?.report('done');
    } catch (e) {
        if (e instanceof Stopped) { if (live) { clear(); window.__autoplay = status(); live.report('stopped'); } return; }
        s.failed = e.message;
        ending(live ? `The solving stopped: ${e.message}.` : `The autoplay stopped: ${e.message}. This is a defect to fix.`);
        live?.report('failed', { failed: { move: null, why: e.message } });
    }
}
