// The autoplay: the game played on Hard from the first paragraph to the last
// through the page, as the annotated reader plays it, with the reader's thoughts written into the story as notes.
//
// Its script is the action table (cases/silver-blaze/action-table.json, engine/actionTable.js): each move's UI steps
// made with the page's own events (a click on the element, a value set and its change dispatched, the words of a
// note selected and the pointer let go), each checked in the save as scripts/ui-run.mjs checks it. Its notes are each
// thought's `typed` form, or its prose as it stands, and the words it `reads` highlighted (thoughts.json). Loaded by
// ui/app.js only on `?autoplay`, in a save of its own; `?autoplay=fast` (the check, scripts/autoplay-check.mjs) plays
// with no pauses and the notes at once.
//
// Two playthroughs, chosen on the strip before it starts or by the address:
// the annotated reader's (`?autoplay`) and the fewest moves (`?autoplay=minimal`, its check `?autoplay=minimal-fast`):
// cases/silver-blaze/action-table-minimal.json, no notes, the moves gathered at a few paragraphs, read to by the
// farthest of Next paragraph, Next scene and Next deduction, and each card reached the shortest way (left where it is
// shown, a link on the card in view, the story's words, else its list). It counts its clicks.

const CASE = 'cases/silver-blaze';
const SPEEDS = [['0.25', '¼×'], ['0.5', '½×'], ['1', '1×'], ['2', '2×'], ['4', '4×'], ['at_once', 'notes at once']];
const PLAYTHROUGHS = [['reader', 'The careful reader', '?autoplay', 'action-table.json', 'every move of the annotated reading, its thoughts written in as notes'], ['minimal', 'The fewest moves', '?autoplay=minimal', 'action-table-minimal.json', 'only the moves the best score needs, no notes']];
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

export async function start({ store, fast, playthrough = 'reader', story, valueName, toast }) {
    const minimal = playthrough === 'minimal';
    const [table, thoughts] = await Promise.all([
        fetch(`${CASE}/${PLAYTHROUGHS.find((x) => x[0] === playthrough)[3]}`).then((r) => r.json()),
        fetch(`${CASE}/thoughts.json`).then((r) => r.json()),
    ]);
    const s = { speed: fast ? 'at_once' : 1, paused: false, stepping: false, skipTo: null, stopped: false, para: 0, failed: null, done: false, notes: 0, moves: 0, had: 0, clicks: {} };
    // Every click, choice and answer typed, by kind (the minimal playthrough's statistics, its closing line).
    const tally = (kind) => { s.clicks[kind] = (s.clicks[kind] ?? 0) + 1; };
    const clickCount = () => Object.values(s.clicks).reduce((a, b) => a + b, 0);
    const factor = () => (fast ? 0 : s.skipTo !== null ? 0 : s.speed === 'at_once' ? 4 : s.speed);
    const wait = async (ms) => { const f = factor(); if (f) await sleep(ms / f); await gate(); };
    const gate = async () => { while (s.paused && !s.stopped) await sleep(150); if (s.stopped) throw new Stopped(); };

    // ---------- the strip and the cursor ----------
    const strip = document.createElement('div');
    strip.className = 'autoplay-strip';
    strip.innerHTML = `<span class="ap-title">Autoplay</span> <span id="ap-para" class="small"></span> <span id="ap-caption" class="ap-caption"></span>
        <span class="ap-tools"><select id="ap-play" aria-label="Playthrough" title="${PLAYTHROUGHS.find((x) => x[0] === playthrough)[4]}">${PLAYTHROUGHS.map(([v, l, , , what]) => `<option value="${v}" title="${what}"${v === playthrough ? ' selected' : ''}>${l}</option>`).join('')}</select>
        <button id="ap-pause" class="quiet">Pause</button>
        <button id="ap-step" class="quiet" title="Make the next move, then pause">Step</button>
        <select id="ap-speed" aria-label="Speed">${SPEEDS.filter(([v]) => !(minimal && v === 'at_once')).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
        <button id="ap-skip" class="quiet" title="Make this paragraph's moves without pausing"><span class="long">Skip to the next paragraph</span><span class="short">Skip ¶</span></button>
        <button id="ap-stop" class="quiet">Stop</button></span>`;
    document.body.append(strip);
    document.body.classList.add('autoplaying');
    const cursor = makeCursor();
    if (!fast) document.body.append(cursor);
    $('#ap-speed').value = String(s.speed);
    $('#ap-speed').addEventListener('change', (e) => { s.speed = e.target.value === 'at_once' ? 'at_once' : Number(e.target.value); });
    // The playthrough is chosen before it starts (a fresh page on the other script); fixed once Resume or Step is pressed.
    $('#ap-play').addEventListener('change', (e) => { location.search = PLAYTHROUGHS.find((x) => x[0] === e.target.value)[2]; });
    // Once started, the menu gives way to the playthrough's name beside the title.
    const started = () => { if (!$('#ap-play')) return; $('#ap-play').remove(); $('.ap-title').textContent = `Autoplay · ${PLAYTHROUGHS.find((x) => x[0] === playthrough)[1].toLowerCase()}`; };
    const setPaused = (on, why = 'Paused: the page is yours to look round; resume to go on.') => {
        s.paused = on;
        $('#ap-pause').textContent = on ? 'Resume' : 'Pause';
        if (on) $('#ap-caption').textContent = why;
        else caption(s.lastCaption ?? '');
    };
    $('#ap-pause').addEventListener('click', () => { s.stepping = false; started(); setPaused(!s.paused); });
    // One step: the next move, note or paragraph read, then paused again (pressed while playing: pause
    // after the one under way).
    $('#ap-step').addEventListener('click', () => { s.stepping = true; started(); if (s.paused) setPaused(false); });
    const stepped = () => { if (s.stepping) { s.stepping = false; setPaused(true, `${s.lastCaption} · paused`); } };
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
    const status = () => ({ playthrough, para: s.para, moves: s.moves, had: s.had, notes: s.notes, clicks: { ...s.clicks }, failed: s.failed, done: s.done, stopped: s.stopped });
    window.__autoplay = status();

    const P = makePlayer({ store, fast, shortest: minimal, valueName, cursor, factor, gate, tally, atOnce: () => s.speed === 'at_once' });
    const { idle, saved, glide, ring, click, choose, showStory, type, step, took } = P;

    async function move(m) {
        if (took(m) && m.op !== 'theory') { s.had++; return; } // made already (one click collects all its words carry)
        caption((CAPTIONS[m.op] ?? (() => 'Making a move'))(m));
        // A connection left from before is cleared (the minimal playthrough: only when a build needs it, and has one).
        if (!minimal || (m.op === 'build' && $('.building .chip'))) await click('[data-build-clear]');
        let why = null;
        for (const u of m.ui) {
            const r = await step(u);
            if (r !== true) { why = r; if (m.op !== 'theory') break; }
        }
        if (!took(m)) throw new Failed(`The autoplay stopped at paragraph ${m.at}: ${$('#ap-caption').textContent.toLowerCase()} did not take (${why ?? 'the save does not show it'}). This is a defect to fix.`);
        s.moves++;
        stepped();
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
        stepped();
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
    if (!minimal) for (const r of rows) {
        const at = Math.max(r.para, ...r.moves.map((m) => m.at));
        (notesAt.get(at) ?? notesAt.set(at, []).get(at)).push(byId.get(r.id));
    }
    const last = story.paragraphs.length - 1;
    // The reading button that goes farthest without passing `to` (the paragraph to read next): the buttons say how
    // many paragraphs each reads.
    const farthest = (to) => {
        const read = saved().read ?? 1;
        const by = (sel) => Number($(sel)?.textContent.match(/\((\d+) ¶\)/)?.[1] ?? 0);
        return [['#read-deduction', by('#read-deduction')], ['#read-scene', by('#read-scene')]].filter(([sel, n]) => n > 1 && read + n <= to && !$(sel).disabled).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '#read';
    };
    try {
        caption('Starting a fresh game on Hard');
        await idle();
        document.querySelector('.settings').open = true;
        await choose('#difficulty', 'hard');
        document.querySelector('.settings').open = false;
        await showStory();
        // Paused at the start: nothing moves until Resume (or Step) is pressed.
        if (!fast) { setPaused(true, 'Ready: choose what to watch, then Resume to play, or Step for one move at a time.'); await gate(); }
        else started();
        // The minimal playthrough reads from one paragraph with moves to the next; the reader, paragraph by paragraph.
        const stops = minimal ? [...movesAt.keys()].sort((a, b) => a - b) : Array.from({ length: last }, (_, i) => i + 1);
        for (const p of stops) {
            s.para = p;
            if (s.skipTo !== null && p >= s.skipTo) s.skipTo = null;
            $('#ap-para').textContent = `¶${p} of ${last}`;
            while ((saved().read ?? 1) <= p) {
                caption('Reading on');
                if (!(await click(minimal ? farthest(p + 1) : '#read'))) throw new Failed(`The autoplay could not read on at paragraph ${p}.`);
                stepped();
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
        ending(`The story is over. ${s.moves} moves, ${minimal ? `${clickCount()} clicks` : `${s.notes} notes`}. The record is open.`);
    } catch (e) {
        if (e instanceof Stopped) return;
        s.failed = e.message;
        console.error(e);
        toast(e.message);
        ending(e.message);
    }
}
/**
 * The page player: moves made through the page with its own events, a cursor shown going to each element,
 * each move's `ui` steps as the action table gives them and `took` checking the save; used by the autoplay and by a
 * hint's Do it. `shortest`: a card reached the shortest way (the minimal playthrough's).
 */
export function makePlayer({ store, fast = false, shortest = false, valueName, cursor = null, factor = () => 1, gate = async () => {}, tally = () => {}, atOnce = () => false }) {
    const minimal = shortest;
    async function glide(x, y) {
        if (fast) return;
        const f = factor();
        const ms = f ? 1000 / f : 0; // a second at 1×
        cursor.style.transition = ms ? `transform ${ms}ms ease-in-out` : 'none';
        cursor.style.transform = `translate(${x}px, ${y}px)`;
        if (ms) await sleep(ms + 30);
    }
    const ring = () => { if (fast) return; cursor.classList.remove('click'); void cursor.offsetWidth; cursor.classList.add('click'); };
    async function pointAt(el) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        const r = el.getBoundingClientRect();
        await glide(r.left + Math.min(r.width / 2, 40), r.top + r.height / 2);
    }

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
    async function click(sel, el = $(sel), kind = null) {
        if (!el) return false;
        await pointAt(el);
        ring();
        tally(kind ?? (el.matches('.tab') ? 'tab' : el.matches('#read, #read-scene, #read-deduction') ? 'read' : el.closest('[data-card], #pop .item') ? 'open' : 'button'));
        el.click();
        await idle();
        return true;
    }
    async function choose(sel, value) {
        const e = $(sel);
        if (!e) return false;
        await pointAt(e);
        tally('menu');
        e.value = value;
        e.dispatchEvent(new Event('change', { bubbles: true }));
        await idle();
        return e.value === value;
    }
    const chooseTab = async (t) => $(`${LEFT} .tab.on`)?.dataset.tab === t || click(`${LEFT} .tab[data-tab="${t}"]`);
    const showStory = async () => !!$('#story') || chooseTab('story');
    // The panel showing the card, if one does (-1 if none).
    const cardPanel = () => Number(document.querySelector('.panel:has(.tab.on[data-tab="card"])')?.dataset.panel ?? -1);
    const held = () => new Set((saved().collected ?? []).map((x) => (Array.isArray(x) ? x[0] : x)));
    // The shortest way to a card (the minimal playthrough): shown already; a link on the card in view; words of the
    // story shown that carry it and nothing not held (a click there opens); else null (its list).
    async function openShortest(id) {
        const at = cardPanel();
        if (at >= 0 && saved().selected === id) return true;
        if (at >= 0) {
            const link = $(`#panel-${at} .link[data-card="${id}"]`);
            if (link) return click(null, link, 'open');
        }
        if ($(`${LEFT} .tab.on`)?.dataset.tab === 'story' || $('#story')) {
            const have = held();
            // Only words whose cards are all held: a click on words with a card not held would collect it.
            const words = [...document.querySelectorAll('#story .m')].filter((e) => { const ids = e.dataset.ids.split(' '); return ids.includes(id) && ids.every((x) => have.has(x) || /^[wq]\./.test(x)); });
            const one = words.find((e) => e.dataset.ids.split(' ').length === 1);
            if (one) return click(null, one, 'open');
            if (words[0] && (await click(null, words[0], 'open'))) {
                const item = $(`#pop:not([hidden]) .item[data-card="${id}"]`);
                if (item) return click(null, item, 'open');
            }
        }
        return null;
    }
    async function openCard(id, tab) {
        if (minimal) { const r = await openShortest(id); if (r !== null) return r; }
        for (const t of [...new Set([tab, 'cards', 'inferences', 'background', 'questions'])]) {
            await chooseTab(t);
            if (await click(`#panel-0 [data-card="${id}"]`)) return true;
        }
        await chooseTab('cards');
        document.querySelectorAll('#panel-0 details.set-aside').forEach((d) => { d.open = true; });
        return click(`#panel-0 [data-card="${id}"]`);
    }
    // A field's value, or a note written in the line, the caret kept after the last letter typed.
    const put = (box, text) => {
        if (!box.isContentEditable) { box.value = text; return; }
        box.textContent = text;
        const r = document.createRange(); r.selectNodeContents(box); r.collapse(false); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    };
    async function type(box, text) {
        await pointAt(box);
        if (!box.isContentEditable) tally('typed');
        box.focus();
        let sofar = '';
        for (const ch of text) {
            if (factor() && !atOnce()) {
                put(box, (sofar += ch));
                box.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep((1000 / 12 / factor()) * (0.6 + Math.random() * 0.8));
            }
        }
        put(box, text);
        box.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // One UI step of the table (the runner's steps, scripts/ui-run.mjs).
    async function step(u) {
        await gate();
        if (u.story !== undefined) {
            await showStory();
            const all = [...document.querySelectorAll(`#story p[data-p="${u.story}"] .m`)];
            const el = all.find((e) => e.dataset.ids.split(' ').includes(u.span) && e.textContent === u.words) ?? all.find((e) => e.dataset.ids.split(' ').includes(u.span));
            return (el && click(null, el, 'words')) || `no words for the card in ¶${u.story}`;
        }
        if (u.open) return (await openCard(u.open, u.tab)) || `cannot open ${u.open}`;
        if (u.tab) return (await chooseTab(u.tab)) || `no tab ${u.tab}`;
        if (u.open_details) { document.querySelectorAll(u.open_details).forEach((d) => { d.open = true; }); return true; }
        if (u.select_text) {
            const v = [...($(u.select_text)?.options ?? [])].find((o) => o.text === u.text)?.value ?? null;
            return v ? ((await choose(u.select_text, v)) || `cannot choose ${u.text}`) : `no option “${u.text}”`;
        }
        // What a conclusion is about is asked only with that option on (Hard); the table is played on Hard, a hint's moves on any.
        if (u.select === '#build-kind' && !$(u.select)) return true;
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
        if (u.click) {
            // An answer among the slot's others: off Hard every answer is listed, and those past the first few are folded.
            const ans = u.click.match(/^\.chip\[data-slot="([^"]+)"\]/);
            if (ans && !$(u.click)) for (const x of [ans[1], `${ans[1]}|ruled`]) if (!$(u.click) && $(`[data-expand="${x}"]`)) await click(`[data-expand="${x}"]`);
            return (await click(u.click)) || `nothing to click: ${u.click}`;
        }
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
    return { idle, saved, glide, ring, pointAt, click, choose, chooseTab, showStory, openCard, type, step, took };
}

/** The autoplay's cursor, an arrow with a ring when it clicks. */
export function makeCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'autoplay-cursor';
    cursor.innerHTML = '<svg viewBox="0 0 16 22" width="16" height="22" aria-hidden="true"><path d="M1 1 L1 17 L5 13 L8 20 L11 19 L8 12 L14 12 Z" /></svg>';
    return cursor;
}

/**
 * A hint's Do it: `moves` (hints.json's) made through the page on the player's own game, the cursor
 * shown (`fast`: none, no pauses; the check), a card reached the shortest way. A move made already is passed over.
 * → {ok} or {ok: false, move, why}
 */
export async function playMoves(moves, { store, valueName, speed = 2, fast = false, later = () => false }) {
    const cursor = makeCursor();
    if (!fast) document.body.append(cursor);
    const P = makePlayer({ store, fast, shortest: true, valueName, cursor, factor: () => (fast ? 0 : speed) });
    try {
        for (const m of moves) {
            // A drop made already for a reason that did not hold then (it scores only from a reason that holds) is
            // taken back and made again, checked against what the player holds now.
            const same = (d) => JSON.stringify(d.target) === JSON.stringify(m.target);
            const unheld = m.op === 'drop' && (P.saved().drops ?? []).some((d) => same(d) && d.held === null);
            if (P.took(m) && m.op !== 'theory' && !unheld) continue;
            if (await later(m)) continue; // not yet (a drop whose reason would not hold now)
            if (m.op === 'build' && $('.building .chip')) await P.click('[data-build-clear]');
            let why = null;
            const ui = unheld ? m.ui.flatMap((u) => (u.click?.startsWith('[data-drop-open=') ? [{ click: u.click.replace('data-drop-open', 'data-undrop') }, u] : [u])) : m.ui;
            for (const u of ui) {
                const r = await P.step(u);
                if (r !== true) { why = r; if (m.op !== 'theory') break; }
            }
            if (!P.took(m)) return { ok: false, move: m, why: why ?? 'the save does not show it' };
            if (m.op === 'drop' && (P.saved().drops ?? []).some((d) => same(d) && d.held === null)) return { ok: false, move: m, why: 'its reason does not hold yet' };
        }
        return { ok: true };
    } finally {
        cursor.remove();
    }
}

class Stopped extends Error {}
class Failed extends Error {}
