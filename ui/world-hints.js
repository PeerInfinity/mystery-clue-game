// Hints for Watson's timeline: on request, the next thing a careful reader would do, from wherever the player is
// (the user's rulings, 2026-11-05). Each press of Hint goes a rung further on the same thing: where to look, the
// reasoning (the path's `why`), the move itself with Do it (made through the page, ui/world-moves.js). After a press
// the button waits (Settings: the wait between hints, 30 seconds by default, or none).
//
// What a hint is about, in this order:
//  (a) a mark on a question the path settles, wrong by now: a wrong answer circled, a right one crossed out (only once
//      the path has its reason: its crossing, or its right circle, at or before the paragraph read to);
//  (b) a distrust the path does not make: a link or a person set to distrusted, other than a false statement's own;
//  (c) the next move of the path not made, that the page allows now (tried and taken back, engine and page alike),
//      those for the soonest answer given away first; a circle or a crossing counts as done once the question has a
//      right answer circled (any right one: the light as well as the noise);
//  (d) nothing: read on.
// A move is offered from its `hint_at` (or `at`): never before the page can support it.

import { $, esc, LEVELS, Failed, makeMover, allowedNow, made, onOf, VIEWS } from './world-moves.js';

import { CASE } from './world-case.js';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * `api` (ui/world.js): para(), last, question(id), qListed(id), isRight(id, pick), statementFalse(id), name(id),
 * setTrust({link | person}, level), view() and restore(view), wait() (seconds between hints).
 */
export async function makeHints({ store, api }) {
    const box = $('#hint-news'), button = $('#hint');
    // A case with no true path (world/path.json is optional) has no hints and no autoplay: their buttons go.
    const path = await fetch(`${CASE}/world/path.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (!path) { for (const id of ['#hint', '#autoplay-open']) { const el = $(id); if (el) el.hidden = true; } return; }
    const moves = path.moves.map((m, i) => ({ ...m, i }));
    const h = { key: null, rung: 0, target: null, until: 0, timer: null };
    const saved = () => { try { return JSON.parse(localStorage.getItem(store) ?? '{}'); } catch { return {}; } };

    // The path's right circle on a question (not tried and crossed out), and its crossing of a pick.
    const crossOf = (q, pick) => moves.find((m) => m.do === 'cross' && m.q === q && m.pick === pick);
    const rightOf = (q) => moves.find((m) => m.do === 'circle' && m.q === q && !crossOf(q, m.pick));
    const tried = (m) => m.do === 'circle' && !!crossOf(m.q, m.pick);
    const from = (m) => m.hint_at ?? m.at;
    const rightCircled = (q, save) => Object.entries(save.marks?.[q] ?? {}).some(([p, v]) => v === 'circled' && api.isRight(q, p));
    const distrustedByPath = (key, P) => moves.some((m) => m.do === 'trust' && (m.link === key || m.person === key) && m.at <= P);

    function target() {
        const save = saved(), P = save.para ?? 1;
        // (a) a wrong mark on a question the path settles; only one on an answer the page lists now (reading back
        // can leave a mark on an answer not yet offered, which cannot be clicked).
        const view = api.view();
        const listed = (q, pick) => { try { return allowedNow({ do: 'cross', q, pick }, store); } finally { api.restore(view); } };
        for (const q of [...new Set(moves.filter((m) => m.q).map((m) => m.q))]) {
            if (!api.qListed(q)) continue;
            const right = rightOf(q);
            for (const [pick, v] of Object.entries(save.marks?.[q] ?? {})) {
                if (!(v === 'circled' && !api.isRight(q, pick)) && !(v === 'crossed' && api.isRight(q, pick))) continue;
                if (!listed(q, pick)) continue;
                if (v === 'circled' && !api.isRight(q, pick)) {
                    const cross = crossOf(q, pick);
                    if (cross && cross.at <= P) return { kind: 'unmark', q, pick, why: cross.why, fix: { do: 'cross', q, pick } };
                    if (right && from(right) <= P) return { kind: 'unmark', q, pick, why: right.why, fix: { do: 'clear', q, pick } };
                }
                if (v === 'crossed' && api.isRight(q, pick) && right && from(right) <= P) return { kind: 'uncross', q, pick, why: right.why, fix: { do: 'circle', q, pick } };
            }
        }
        // (b) a distrust the path does not make.
        for (const [key, level] of Object.entries(save.trust?.links ?? {})) {
            if (level !== LEVELS.distrusted || distrustedByPath(key, P)) continue;
            if (key.startsWith('stmt:') && api.statementFalse(key.slice(5))) continue;
            if (key.startsWith('hyp:')) continue;   // a mark's own link: the marks are (a)'s
            return { kind: 'trust', link: key };
        }
        for (const [person, level] of Object.entries(save.trust?.people ?? {})) if (level === LEVELS.distrusted) return { kind: 'trust', person };
        // (c) the next move of the path that the page allows now.
        const deadline = (m) => Math.min(...(m.for_q ?? []).map((q) => api.question(q)?.answer_given_at).filter((g) => g > P), Infinity);
        const open = moves.filter((m) => !VIEWS.has(m.do) && from(m) <= P && !tried(m) && !made(m, save)
            && !((m.do === 'circle' || m.do === 'cross') && rightCircled(m.q, save)))
            .sort((a, b) => deadline(a) - deadline(b) || a.i - b.i);
        if (open.length) {
            try { for (const m of open) if (allowedNow(m, store)) return { kind: 'move', m }; } finally { api.restore(view); }
        }
        return { kind: P >= api.last ? 'done' : 'read' };
    }

    // ---------- the words ----------
    const entry = (id) => {
        if (!id) return '';
        if (/^(hyp|pre):/.test(id)) {
            const [q, pick] = id.slice(4).split('=');
            return pick ? `your answer “${pickName(q, pick)}” to “${api.question(q)?.label}”` : `what your answer to “${api.question(q)?.label}” takes for granted`;
        }
        return `“${($(`#timeline [data-fact="${esc(id)}"]`)?.textContent ?? id).replace(/\s+/g, ' ').replace(/\s*⚙?\s*¶\d+\s*$/, '').trim()}”`;
    };
    const pickName = (q, pick) => api.name(pick) ?? pick;
    const qName = (q) => `“${api.question(q)?.label ?? q}”`;
    function rungs(t) {
        switch (t.kind) {
            case 'read': return [t.why ?? 'Nothing more to do for now: read on.'];
            case 'done': return ['The story is over, and nothing is left to do.'];
            case 'unmark': return [`Look again at ${qName(t.q)}.`, t.why, t.fix.do === 'cross' ? `Cross out “${pickName(t.q, t.pick)}”.` : `Take your circle off “${pickName(t.q, t.pick)}”.`];
            case 'uncross': return [`Look again at ${qName(t.q)}.`, t.why, `Circle “${pickName(t.q, t.pick)}”.`];
            case 'trust': return [t.link ? `Look at your trust in ${t.link.startsWith('stmt:') ? entry(t.link.slice(5)) : api.linkName(t.link)}.` : `Look at your trust in ${api.name(t.person)}.`,
                'Distrusting it takes away more than what is false: some of what came that way is true, and the timeline needs it.',
                'Set it back to uncertain.'];
            case 'move': {
                const m = t.m;
                const where = m.do === 'circle' || m.do === 'cross' ? `Look at ${qName(m.q)}.`
                    : m.do === 'hold' ? 'Look at the likely clashes.'
                    : m.do === 'way' || m.do === 'got' ? 'Look at the ways in.'
                    : m.do === 'route' ? 'Look at the route.'
                    : m.do === 'link' && m.entry === 'route' ? 'Look at your route.'
                    : `Look at ${entry(onOf(m))}.`;
                const what = m.do === 'circle' ? `Circle “${pickName(m.q, m.pick)}”.`
                    : m.do === 'cross' ? `Cross out “${pickName(m.q, m.pick)}”.`
                    : m.do === 'trust' ? 'Distrust this statement itself (its own trust, above its chains).'
                    : m.do === 'a' ? `Point out that it changed: against ${entry(m.b)}.`
                    : m.do === 'b' ? 'Point out what it needs and what it does.'
                    : m.do === 'c' ? `Ask “What is this for?”: for ${entry(m.for)}.`
                    : m.do === 'hold' ? 'You hold both: set it aside.'
                    : m.do === 'way' ? `Mark ${api.name(m.way.split('|')[0]) ?? m.way.split('|')[0]} ${m.mark} to ${m.way.split('|')[1] === 'person' ? 'a person' : 'something small'}.`
                    : m.do === 'got' ? `Point out that something got through: ${entry(m.of)}.`
                    : m.do === 'route' ? `Add ${api.name(m.node) ?? m.node} to the route.`
                    : m.do === 'link' ? `Point it out under “Relevant to…”: ${qName(m.q)}.` : 'Make the move.';
                return [where, m.why, what];
            }
            default: return [];
        }
    }

    // ---------- the notice and the button ----------
    function draw() {
        if (!h.target) { box.hidden = true; return; }
        const rs = rungs(h.target);
        const shown = rs.slice(0, h.rung);
        const last = h.rung >= rs.length;
        const canDo = last && h.target.kind !== 'done';
        box.hidden = false;
        box.innerHTML = `<p><b>Hint</b></p><ol class="hint-rungs">${shown.map((r) => `<li>${r.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</li>`).join('')}</ol>
          <p>${!last ? '<button type="button" class="quiet" data-hint-more>More</button> ' : ''}${canDo ? '<button type="button" data-hint-do>Do it</button> ' : ''}<button type="button" class="quiet" data-hint-close>Close</button></p>`;
        if (!last) box.querySelector('[data-hint-more]').disabled = Date.now() < h.until;
    }
    function tick() {
        const left = Math.ceil((h.until - Date.now()) / 1000);
        button.disabled = left > 0;
        button.textContent = left > 0 ? `Hint (${left})` : 'Hint';
        const more = box.querySelector('[data-hint-more]');
        if (more) more.disabled = left > 0;
        if (left <= 0) { clearInterval(h.timer); h.timer = null; }
    }
    function press() {
        if (Date.now() < h.until) return;
        const t = target();
        const key = JSON.stringify(t.m ? { kind: t.kind, i: t.m.i } : t);
        if (key === h.key && !box.hidden) h.rung = Math.min(rungs(t).length, h.rung + 1);
        else { h.key = key; h.rung = 1; }
        h.target = t;
        // Reading on is no step to hold back: a hint to read on shows whole, and starts no wait.
        if (t.kind === 'read' || t.kind === 'done') h.rung = rungs(t).length;
        else if (api.wait() > 0) { h.until = Date.now() + api.wait() * 1000; if (!h.timer) h.timer = setInterval(tick, 250); tick(); }
        draw();
    }
    async function doIt({ fast = false } = {}) {
        const t = h.target;
        if (!t) return;
        box.querySelector('[data-hint-do]')?.setAttribute('disabled', '');
        const cursor = document.createElement('div');
        cursor.className = 'autoplay-cursor';
        cursor.innerHTML = '<svg viewBox="0 0 16 22" width="16" height="22" aria-hidden="true"><path d="M1 1 L1 17 L5 13 L8 20 L11 19 L8 12 L14 12 Z" /></svg>';
        if (!fast) document.body.append(cursor);
        const mover = makeMover({ store, fast, factor: () => (fast ? 0 : 2), cursor: fast ? null : cursor });
        try {
            if (t.kind === 'read') await mover.press('#next');
            else if (t.kind === 'trust') api.setTrust(t.link ? { link: t.link } : { person: t.person }, LEVELS.uncertain);
            else if (t.kind === 'move') await mover.play(t.m);
            else if (t.fix.do === 'clear') {
                // Circled → crossed → uncertain: crossed out, then one click more takes the mark off.
                await mover.play({ do: 'cross', q: t.q, pick: t.pick });
                await mover.press(`#q-box [data-mark-q="${esc(t.q)}"][data-mark-pick="${esc(t.pick)}"]`);
                if (saved().marks?.[t.q]?.[t.pick]) throw new Failed('the mark did not come off');
            } else await mover.play({ do: t.fix.do, q: t.q, pick: t.pick });
            h.target = null; h.key = null;
            box.hidden = true;
        } catch (e) {
            box.insertAdjacentHTML('beforeend', `<p class="small bad">It could not be done: ${e instanceof Failed ? e.message : String(e)}.</p>`);
        } finally {
            if (!fast) { await sleep(400); cursor.remove(); }
        }
    }
    button.addEventListener('click', press);
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-hint-more], [data-hint]')) press();
        else if (e.target.closest('[data-hint-do]')) doIt();
        else if (e.target.closest('[data-hint-close]')) { box.hidden = true; h.key = null; }
    });
    // For the check (scripts/world-hints-check.mjs): the hint now, as words, without pressing.
    window.__hint = { target: () => { const t = target(); return { kind: t.kind, i: t.m?.i ?? null, rungs: rungs(t) }; }, press, doIt, state: () => ({ rung: h.rung, kind: h.target?.kind ?? null, until: h.until }) };
    return { press, doIt };
}
