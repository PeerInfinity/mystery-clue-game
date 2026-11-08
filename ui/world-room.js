// The room panel of the timeline (docs/ideas.md, "The arrangement of a room, and general knowledge"): the ways into a
// sealed place, the route the player builds, what came along it, and the candidates general knowledge brings. Only
// drawn for a case with world/room.json. The rules are the engine's (engine/arrangement.js); this file only draws.
import { SIZES, knowledgeKey } from '../engine/arrangement.js';

const SIZE_LABEL = { person: 'A person', small: 'Something small', air: 'Air, a smell' };
const COLUMNS = SIZES.filter((s) => s !== 'air');   // a smell is what shows a way, not a column the reader fills in

/** The whole panel. `v`: the view worked out by the page (ui/world.js `roomView`); `h`: its helpers (`esc`, `ent`). */
export function roomHtml(v, h) {
    const { esc, ent } = h;
    return `<div class="rm"><h2>The room</h2>
${v.note ? `<p class="rm-note" role="status">${esc(v.note)}</p>` : ''}
${v.sealed.question ? `<p class="rm-q">${esc(v.sealed.question)}</p>` : ''}
${waysHtml(v, h)}
${routeHtml(v, h)}
${needsHtml(v, h)}
${candidatesHtml(v, h)}
</div>`;

    function waysHtml() {
        const got = v.gotOffers.map((f) => `<button type="button" class="move" data-got="${esc(f.id)}">Something got through: ${h.phrase(f)}</button>`).join(' ');
        return `<h3>The ways in</h3>
${v.rows.length ? `<table class="rm-table"><thead><tr><th>Way in</th>${COLUMNS.map((s) => `<th>${SIZE_LABEL[s]}</th>`).join('')}<th>From</th></tr></thead><tbody>${v.rows.map(rowHtml).join('')}</tbody></table>` : '<p class="small muted">Nothing yet.</p>'}
${got ? `<p class="rm-moves">${got}</p>` : ''}`;
    }
    function rowHtml(r) {
        const name = r.kind === 'unfound' ? `<i>A way not yet found</i>` : ent(r.id);
        return `<tr data-way-row="${esc(r.id)}"><td>${name}</td>${COLUMNS.map((s) => `<td>${cellHtml(r, s)}</td>`).join('')}<td class="small muted">${r.evidence}</td></tr>`;
    }
    function cellHtml(r, size) {
        const key = `${r.id}|${size}`;
        const mark = v.marks[key];
        if (mark) return `<button type="button" class="way-chip ${mark}" data-way-clear="${esc(key)}" title="Take this mark back">${mark}</button>`;
        return `<span class="way-pick">${['closed', 'open'].map((m) => `<button type="button" data-way="${esc(`${key}|${m}`)}">${m}</button>`).join('')}</span>`;
    }
    function routeHtml() {
        if (!v.route.nodes.length && !v.route.next.length) return '';
        const nodes = v.route.nodes.map((n) => `<span class="rm-node">${ent(n)}</span>`).join('<span class="rm-arrow">→</span>');
        const next = v.route.next.map((n) => `<button type="button" class="rm-add" data-route-add="${esc(n)}">+ ${esc(h.nameOf(n))}</button>`).join(' ');
        return `<h3>A route</h3>
<div class="rm-chain">${nodes}${nodes && next ? '<span class="rm-arrow">→</span>' : ''}${next}</div>
${v.route.nodes.length ? '<p class="rm-moves"><button type="button" class="quiet" data-route-back>Take back the last link</button></p>' : ''}
${v.route.steady.length ? `<p class="small muted">${v.route.steady.map((f) => h.phrase(f)).join('; ')}: the far end stays where it is.</p>` : ''}`;
    }
    function needsHtml() {
        if (!v.reqs.length && !v.asks.length) return '';
        const list = v.reqs.map((r) => `<li>${esc(r.label)}${r.filter === false ? ' <span class="rm-tag">tests no kind</span>' : ''} <span class="rm-tag">${esc(r.source)}</span></li>`).join('');
        const asks = v.asks.map((c) => `<button type="button" class="move" data-ask="${esc(c.id)}">What else of this kind? ${esc(c.label)}</button>`).join(' ');
        return `<h3>${esc(v.sealed.unknown ?? 'What came along it?')}</h3>${list ? `<ul class="rm-reqs">${list}</ul>` : ''}${asks ? `<p class="rm-moves">${asks}</p>` : ''}`;
    }
    function candidatesHtml() {
        return v.asked.map((c) => {
            const key = knowledgeKey(c.id);
            const trust = `<select class="link-trust" data-key="${esc(key)}" title="How far you trust this general knowledge">${v.levels.map((l, i) => `<option value="${i}"${i === c.level ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
            const rows = c.members.map((m) => `<tr><td><button type="button" class="poss ${v.markOf(c, m) ?? 'open'}" data-mark-q="${esc(c.q)}" data-mark-pick="${esc(m.value)}">${esc(m.value)}</button></td><td class="small">${esc(m.text)}</td></tr>`).join('');
            return `<h3>${esc(c.label)} <span class="rm-tag">general knowledge</span> ${trust}</h3>
${c.distrusted ? '<p class="small muted">You do not trust this.</p>' : `<table class="rm-table"><tbody>${rows}</tbody></table>`}`;
        }).join('');
    }
}
