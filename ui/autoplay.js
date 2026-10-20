// The autoplay (docs/autoplay.md, Rounds 180–181): the game played on Hard from the first paragraph to the last
// through the page, as the annotated reader plays it, with the reader's thoughts written into the story as notes.
//
// Its script is the action table (cases/silver-blaze/action-table.json, engine/actionTable.js): each move's UI steps
// made with the page's own events (a click on the element, a value set and its change dispatched, the words of a
// note selected and the pointer let go), each checked in the save as scripts/ui-run.mjs checks it. Its notes are each
// thought's `typed` form, or its prose as it stands, and the words it `reads` highlighted (thoughts.json). Loaded by
// ui/app.js only on `?autoplay`, in a save of its own; `?autoplay=fast` (the check, scripts/autoplay-check.mjs) plays
// with no pauses and the notes at once.

const CASE = 'cases/silver-blaze';
const SPEEDS = { 1: '1×', 2: '2×', 4: '4×', at_once: 'notes at once' };
// What a move is, in plain words (A2): never the thought's id or tag.
const CAPTIONS = {
    collect: (m) => `Collecting: “${(m.words ?? '').trim()}”`,
    ask: () => 'Asking what I know about it',
    build: (m) => `Building an inference${m.cards?.length ? ` from ${m.cards.length} cards` : ''}`,
    notice: () => 'Marking it as odd',
    raise: () => 'Raising an exception to a step',
    seal: () => 'Planning a check',
    file: () => 'Filing what did not happen',
    pose: () => 'Asking my own question',
    reread: () => 'Going back over a passage',
    setAside: () => 'Setting it aside',
    split: () => 'Splitting a statement into what was seen and what was concluded',
    doubt: () => 'Doubting it',
    candidate: () => 'Proposing an answer',
    theory: () => 'Holding a theory',
    drop: () => 'Dropping a wrong turn',
    weigh: () => 'Weighing a theory',
};

const $ = (sel) => document.querySelector(sel);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LEFT = '.panel[data-panel="0"]';

export async function start({ store, fast, story, valueName, toast }) {
    const [table, thoughts] = await Promise.all([
        fetch(`${CASE}/action-table.json`).then((r) => r.json()),
        fetch(`${CASE}/thoughts.json`).then((r) => r.json()),
    ]);
    const s = { speed: fast ? 'at_once' : 1, paused: false, skipTo: null, stopped: false, para: 0, failed: null, done: false, notes: 0, moves: 0 };
    const factor = () => (fast ? 0 : s.skipTo !== null ? 0 : s.speed === 'at_once' ? 4 : s.speed);
    const wait = async (ms) => { const f = factor(); if (f) await sleep(ms / f); await gate(); };
    const gate = async () => { while (s.paused && !s.stopped) await sleep(150); if (s.stopped) throw new Stopped(); };

    // ---------- the strip and the cursor ----------
    const strip = document.createElement('div');
    strip.className = 'autoplay-strip';
    strip.innerHTML = `<span class="ap-title">Autoplay</span> <span id="ap-para" class="small"></span> <span id="ap-caption" class="ap-caption"></span>
        <span class="ap-tools"><button id="ap-pause" class="quiet">Pause</button>
        <select id="ap-speed" aria-label="Speed">${Object.entries(SPEEDS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
        <button id="ap-skip" class="quiet" title="Make this paragraph's moves without pausing"><span class="long">Skip to the next paragraph</span><span class="short">Skip ¶</span></button>
        <button id="ap-stop" class="quiet">Stop</button></span>`;
    document.body.append(strip);
    document.body.classList.add('autoplaying');
    const cursor = document.createElement('div');
    cursor.className = 'autoplay-cursor';
    cursor.innerHTML = '<svg viewBox="0 0 16 22" width="16" height="22" aria-hidden="true"><path d="M1 1 L1 17 L5 13 L8 20 L11 19 L8 12 L14 12 Z" /></svg>';
    if (!fast) document.body.append(cursor);
    $('#ap-speed').value = String(s.speed);
    $('#ap-speed').addEventListener('change', (e) => { s.speed = e.target.value === 'at_once' ? 'at_once' : Number(e.target.value); });
    $('#ap-pause').addEventListener('click', () => { s.paused = !s.paused; $('#ap-pause').textContent = s.paused ? 'Resume' : 'Pause'; caption(s.paused ? 'Paused: the page is yours to look round; resume to go on.' : s.lastCaption); });
    $('#ap-skip').addEventListener('click', () => { s.skipTo = s.para + 1; });
    $('#ap-stop').addEventListener('click', () => { s.stopped = true; s.paused = false; ending('Stopped.'); });
    const caption = (text) => { if (!s.paused) s.lastCaption = text; $('#ap-caption').textContent = text; };
    const ending = (text) => {
        $('#ap-caption').textContent = text;
        $('#ap-para').textContent = '';
        strip.querySelector('.ap-tools').innerHTML = '<a class="button" href="./">Back to your game</a>';
        cursor.remove();
        document.body.classList.remove('autoplaying');
        window.__autoplay = { ...status(), done: true };
    };
    const status = () => ({ para: s.para, moves: s.moves, notes: s.notes, failed: s.failed, done: s.done, stopped: s.stopped });
    window.__autoplay = status();

    let cx = innerWidth / 2;
    let cy = innerHeight / 2;
    async function glide(x, y) {
        if (fast) return;
        const f = factor();
        const ms = f ? 500 / f : 0;
        cursor.style.transition = ms ? `transform ${ms}ms ease-in-out` : 'none';
        cursor.style.transform = `translate(${x}px, ${y}px)`;
        cx = x; cy = y;
        if (ms) await sleep(ms + 30);
    }
    const ring = () => { if (fast) return; cursor.classList.remove('click'); void cursor.offsetWidth; cursor.classList.add('click'); };
    async function pointAt(el) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        const r = el.getBoundingClientRect();
        await glide(r.left + Math.min(r.width / 2, 40), r.top + r.height / 2);
    }

    // ---------- the page ----------
    // Ready: the busy veil down and nothing pending, twice in a row (scripts/cdp.mjs's idle).
    async function idle(max = 600000) {
        const t0 = Date.now();
        let ok = 0;
        while (Date.now() - t0 < max) {
            ok = $('.tabs .tab') && $('#busy').hidden && !$('.tool-body .pending') ? ok + 1 : 0;
            if (ok >= 2) return;
            await sleep(fast ? 40 : 100);
        }
        throw new Error('the page is still busy');
    }
    const saved = () => { try { return JSON.parse(localStorage.getItem(store) ?? 'null')?.game ?? {}; } catch { return {}; } };
    async function click(sel, el = $(sel)) {
        if (!el) return false;
        await pointAt(el);
        ring();
        el.click();
        await idle();
        return true;
    }
    async function choose(sel, value) {
        const e = $(sel);
        if (!e) return false;
        await pointAt(e);
        e.value = value;
        e.dispatchEvent(new Event('change', { bubbles: true }));
        await idle();
        return e.value === value;
    }
    const chooseTab = async (t) => $(`${LEFT} .tab.on`)?.dataset.tab === t || click(`${LEFT} .tab[data-tab="${t}"]`);
    const showStory = async () => !!$('#story') || chooseTab('story');
    async function openCard(id, tab) {
        for (const t of [...new Set([tab, 'cards', 'inferences', 'background', 'questions'])]) {
            await chooseTab(t);
            if (await click(`#panel-0 [data-card="${id}"]`)) return true;
        }
        await chooseTab('cards');
        document.querySelectorAll('#panel-0 details.set-aside').forEach((d) => { d.open = true; });
        return click(`#panel-0 [data-card="${id}"]`);
    }
    async function type(box, text) {
        await pointAt(box);
        box.focus();
        for (const ch of text) {
            if (factor() && s.speed !== 'at_once') {
                box.value += ch;
                box.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep((1000 / 12 / factor()) * (0.6 + Math.random() * 0.8));
            }
        }
        box.value = text;
        box.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // One UI step of the table (the runner's steps, scripts/ui-run.mjs).
    async function step(u) {
        await gate();
        if (u.story !== undefined) {
            await showStory();
            const all = [...document.querySelectorAll(`#story p[data-p="${u.story}"] .m`)];
            const el = all.find((e) => e.dataset.ids.split(' ').includes(u.span) && e.textContent === u.words) ?? all.find((e) => e.dataset.ids.split(' ').includes(u.span));
            return (el && click(null, el)) || `no words for the card in ¶${u.story}`;
        }
        if (u.open) return (await openCard(u.open, u.tab)) || `cannot open ${u.open}`;
        if (u.tab) return (await chooseTab(u.tab)) || `no tab ${u.tab}`;
        if (u.open_details) { document.querySelectorAll(u.open_details).forEach((d) => { d.open = true; }); return true; }
        if (u.select_text) {
            const v = [...($(u.select_text)?.options ?? [])].find((o) => o.text === u.text)?.value ?? null;
            return v ? ((await choose(u.select_text, v)) || `cannot choose ${u.text}`) : `no option “${u.text}”`;
        }
        if (u.select) return (await choose(u.select, u.value)) || `no option ${u.value} in ${u.select}`;
        if (u.fill) {
            const e = $(u.fill);
            if (!e) return `no field ${u.fill}`;
            await type(e, String(u.value));
            return true;
        }
        if (u.propose) {
            const e = $(`.tool-body input[data-add="${u.propose}"]`);
            if (!e) return 'no answer box';
            await type(e, valueName(u.propose, u.value));
            e.dispatchEvent(new Event('change', { bubbles: true }));
            await idle();
            return true;
        }
        if (u.click_if_absent && $(u.click_if_absent)) return true;
        if (u.click) return (await click(u.click)) || `nothing to click: ${u.click}`;
        if (u.expect) return true;
        return `unknown step ${JSON.stringify(u)}`;
    }
    // What the save must show once a move is made (scripts/ui-run.mjs's took).
    function took(m) {
        const g = saved();
        const has = (list, id) => (list ?? []).some((x) => (Array.isArray(x) ? x[0] : x) === id);
        switch (m.op) {
            case 'collect': return has(g.collected, m.card);
            case 'ask': return has(g.asked, m.card);
            case 'build': return has(g.built, m.inference);
            case 'notice': return has(g.noticed, m.card);
            case 'raise': return (g.raised ?? []).some((r) => r[0] === m.target && r[2] === m.exception);
            case 'seal': return (g.seals ?? []).some((x) => x.verb === m.verb && JSON.stringify(x.fields) === JSON.stringify(m.fields) && (x.expect ?? null) === (m.expect ?? null) && JSON.stringify(x.answer ?? null) === JSON.stringify(m.answer ?? null));
            case 'file': return has(g.filed, m.absence);
            case 'pose': return (g.posed ?? []).some((q) => q[1] === m.template && JSON.stringify(q[2]) === JSON.stringify(m.cards));
            case 'reread': return (g.rereads ?? []).some((r) => r.from === m.from && r.to === m.to);
            case 'setAside': return has(g.setAside, m.card);
            case 'split': return has(g.split, m.card);
            case 'doubt': return (g.suspected ?? []).includes(m.card) && (g.doubtReason ?? []).some(([id, r]) => id === m.card && r === m.reason);
            case 'candidate': return (g.marks ?? []).some(([slot, mk]) => slot === m.slot && (mk.listed ?? []).includes(m.value));
            case 'theory': return (g.theories ?? []).some((t) => t.label === m.label && Object.entries(m.assignment).every(([k, v]) => t.assignment?.[k] === v));
            case 'drop': return (g.drops ?? []).some((d) => JSON.stringify(d.target) === JSON.stringify(m.target) && d.reason === m.reason);
            case 'weigh': return true;
            default: return has(g.collected, m.card) || has(g.built, m.card) || has(g.filed, m.card);
        }
    }
    async function move(m) {
        if (took(m) && m.op !== 'theory') return;
        caption((CAPTIONS[m.op] ?? (() => 'Making a move'))(m));
        await click('[data-build-clear]');
        let why = null;
        for (const u of m.ui) {
            const r = await step(u);
            if (r !== true) { why = r; if (m.op !== 'theory') break; }
        }
        if (!took(m)) throw new Failed(`The autoplay stopped at paragraph ${m.at}: ${$('#ap-caption').textContent.toLowerCase()} did not take (${why ?? 'the save does not show it'}). This is a defect to fix.`);
        s.moves++;
        await wait(250);
    }

    // ---------- the notes ----------
    // Where a quote sits: {para, start, end} in the paragraph's fixed text, looked for from the thought's paragraph
    // back (a quote may skip words with "...": from its first part to its last).
    function place(quote, upTo) {
        const parts = quote.split(/ \.\.\. ?|\.\.\. /).map((x) => x.replace(/^\.\.\.\s*|\s*\.\.\.$/g, '').replace(/\.\.\.\?$/, '').trim()).filter((x) => x.length > 2);
        for (let p = upTo; p >= 1; p--) {
            const first = story.find(parts[0], p, p);
            if (!first) continue;
            const last = parts.length > 1 ? story.find(parts.at(-1), p, p) : first;
            if (last && last.end > first.start) return { para: p, start: first.start, end: last.end };
        }
        return null;
    }
    // A DOM point in a paragraph at an offset of its fixed text, skipping the notes written into it.
    function point(p, off) {
        const walk = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest('.n-note, .n-mark, .n-edit') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
        let n;
        let left = off;
        let lastNode = null;
        while ((n = walk.nextNode())) {
            if (left <= n.length) return [n, left];
            left -= n.length;
            lastNode = n;
        }
        return lastNode ? [lastNode, lastNode.length] : null;
    }
    async function setNotesMode(on) {
        if (document.body.classList.contains('notes-mode') !== on) await click('#notes-mode');
    }
    // One note: the words marked (a drag over them) or a point (a click), then the note typed and kept with Enter.
    async function writeNote({ para, from, to, text }) {
        await showStory();
        await setNotesMode(true);
        const p = $(`#story p[data-p="${para}"]`);
        if (!p) return false;
        // A point note is placed by a click just after the paragraph's last letter (its rectangle found from that letter).
        const a = point(p, from ?? Math.max(0, to - 1));
        const b = point(p, to);
        if (!a || !b) return false;
        const range = document.createRange();
        range.setStart(...a);
        range.setEnd(...b);
        // The words (or the last letter) brought to the middle of the story's panel, clear of the strip at the foot.
        let pane = p.parentElement;
        while (pane && !(pane.scrollHeight > pane.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(pane).overflowY))) pane = pane.parentElement;
        const rr = [...range.getClientRects()].at(-1) ?? p.getBoundingClientRect();
        if (pane) { const pr = pane.getBoundingClientRect(); pane.scrollTop += rr.top - (pr.top + pr.height / 2); }
        const r0 = range.getClientRects()[0] ?? p.getBoundingClientRect();
        const r1 = [...range.getClientRects()].at(-1) ?? r0;
        await glide(r0.left, r0.top + r0.height / 2);
        const sel = getSelection();
        sel.removeAllRanges();
        if (from !== null) {
            sel.addRange(range);
            await glide(r1.right, r1.top + r1.height / 2);
        }
        ring();
        const x = from !== null ? r1.right : r1.right - 1;
        // The page finds a point note's place under the pointer: the strip is out of the way for that instant.
        strip.style.visibility = 'hidden';
        p.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: r1.top + r1.height / 2 }));
        strip.style.visibility = '';
        await idle();
        const box = $('#note-text');
        if (!box) return false;
        if (text) { caption('Writing a note'); await type(box, text); }
        box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await idle();
        s.notes++;
        return true;
    }
    // A thought's notes: each clause it reads highlighted, its note after the last (or at its paragraph's end).
    async function notesOf(t) {
        const text = t.typed ?? t.text ?? '';
        const marks = (t.reads ?? []).map((q) => place(q, t.para)).filter(Boolean);
        if (!marks.length && !text) return;
        if (marks.length) caption(text ? 'Marking the words a thought speaks of' : 'Marking the words');
        for (const [i, m] of marks.entries()) {
            const before = (saved().notes ?? []).length;
            await writeNote({ para: m.para, from: m.start, to: m.end, text: i === marks.length - 1 ? text : '' });
            if ((saved().notes ?? []).length === before) console.warn(`autoplay: no note for ${t.id}`);
            await wait(300);
        }
        if (!marks.length) {
            const end = story.paragraphs[t.para].display.length;
            await writeNote({ para: t.para, from: null, to: end, text });
            await wait(300);
        }
    }

    // ---------- the game ----------
    const rows = table.thoughts;
    const byId = new Map(thoughts.thoughts.map((t) => [t.id, t]));
    const movesAt = new Map();
    for (const r of rows) for (const m of r.moves) (movesAt.get(m.at) ?? movesAt.set(m.at, []).get(m.at)).push({ ...m, thought: r.id });
    for (const ms of movesAt.values()) ms.sort((a, b) => a.seq - b.seq);
    // A thought's note is written once its moves are made, at the last move's paragraph, or at its own.
    const notesAt = new Map();
    for (const r of rows) {
        const at = Math.max(r.para, ...r.moves.map((m) => m.at));
        (notesAt.get(at) ?? notesAt.set(at, []).get(at)).push(byId.get(r.id));
    }
    const last = story.paragraphs.length - 1;
    try {
        caption('Starting a fresh game on Hard');
        await idle();
        document.querySelector('.settings').open = true;
        await choose('#difficulty', 'hard');
        document.querySelector('.settings').open = false;
        await showStory();
        for (let p = 1; p <= last; p++) {
            s.para = p;
            if (s.skipTo !== null && p >= s.skipTo) s.skipTo = null;
            $('#ap-para').textContent = `¶${p} of ${last}`;
            while ((saved().read ?? 1) <= p) {
                caption('Reading on');
                if (!(await click('#read'))) throw new Failed(`The autoplay could not read on at paragraph ${p}.`);
            }
            await wait(1000);
            const ms = movesAt.get(p) ?? [];
            if (ms.length) await setNotesMode(false);
            for (const m of ms) await move(m);
            const ns = notesAt.get(p) ?? [];
            for (const t of ns) if (t) await notesOf(t);
            if (ns.length) await setNotesMode(false);
            window.__autoplay = status();
        }
        while ((await click('#read-deduction')) || (await click('#read'))) if (!$('#read')) break;
        caption('The story is over: the record against Holmes');
        await click('[data-record-open]');
        s.done = true;
        ending(`The story is over. ${s.moves} moves, ${s.notes} notes. The record is open.`);
    } catch (e) {
        if (e instanceof Stopped) return;
        s.failed = e.message;
        console.error(e);
        toast(e.message);
        ending(e.message);
    }
}
class Stopped extends Error {}
class Failed extends Error {}
