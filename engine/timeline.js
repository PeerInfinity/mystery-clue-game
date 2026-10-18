// The timeline (world model, step 3; docs/world-model.md): where each followed thing was in each time window, as
// far as the player knows it and as they pencil it in, in two layouts over the same marks.
//
//   by place: rows are the time windows the story has reached (and the parts the player has split them into),
//             columns are places (plus "elsewhere" and "unknown"); a cell holds whoever and whatever is there then,
//             and the events that happen there.
//   by thing: rows are the things the player follows, columns the time windows; a cell holds the place (and what
//             the player's clues say of the thing's holder and condition).
//
// What it shows is either GIVEN (a held clue, or a proof of the player's, settles the declared state) or the
// player's PENCIL (a free mark: several marks in one cell are several hypotheses held at once; a struck mark stays
// visible, crossed out). Nothing here checks a pencil mark: placement is free (checking at commit comes later).
// The board (followed things, pencil marks, splits, events placed in the parts of a window) is the player's, kept
// in the save as `board`.
//
// Splits: the player splits a window, or a part of one, at an event they hold: two parts, before it and after it,
// with the event on the boundary. What was in the window stays there until the player moves it into a part.
// The parts carry the same ids as the case's own (`<window>.before.<event>`), so a state the case declares there
// (and a held clue gives) shows once the player has made that split.

import { knowsName } from './caseModel.js';

export const UNKNOWN = 'unknown';
export const ELSEWHERE = 'elsewhere';

export function emptyBoard() {
    return { followed: [], unfollowed: [], pencil: [], splits: [], placed: [] };
}

const short = (e) => e.replace(/^e\./, '');
export const partId = (parent, dir, event) => `${parent}.${dir}.${short(event)}`;

/** The times to show, in order: each window the story has reached, then its parts (before, the event, after). */
export function times(game) {
    const out = [];
    const splits = game.board.splits;
    const walk = (id, label, depth, root) => {
        out.push({ id, label, depth, root, kind: depth ? 'part' : 'window' });
        const sp = splits.find((s) => s.time === id);
        if (!sp) return;
        const name = game.nameOf(sp.by);
        walk(partId(id, 'before', sp.by), `Before: ${name}`, depth + 1, root);
        out.push({ id: `${id}@${short(sp.by)}`, label: name, depth: depth + 1, root, kind: 'boundary', event: sp.by, of: id });
        walk(partId(id, 'after', sp.by), `After: ${name}`, depth + 1, root);
    };
    for (const w of game.model.windows) if (game.reached(w.id)) walk(w.id, w.label, 0, w.id);
    return out;
}

/** The things the player follows: those a held clue places (unless dropped), and those they chose. */
export function followed(game, layer = MINE) {
    const out = new Set();
    for (const m of theoryMarks(game, layer)) if (game.knows(m.thing)) out.add(m.thing);
    for (const t of game.model.stateTracks.values()) {
        if (t.name !== 'at' || !game.knows(t.of) || game.board.unfollowed.includes(t.of)) continue;
        if (t.times.some((w) => given(game, t.of, 'at', w) !== null)) out.add(t.of);
    }
    for (const id of game.board.followed) if (game.knows(id)) out.add(id);
    return [...out];
}

/** Has the player split a window into this part? */
export function partExists(game, id) {
    return game.board.splits.some((s) => id === partId(s.time, 'before', s.by) || id === partId(s.time, 'after', s.by));
}

/** The settled value of a declared state, if the player's clues (or proofs) give it; else null. */
export function given(game, thing, name, time) {
    const slot = `st.${thing}.${name}.${time.replace(/^w\./, '')}`;
    if (!game.model.slots.has(slot)) return null;
    const w = game.model.slots.get(slot);
    if (!game.reached(w.root) || w.splitBy.some((e) => !game.knows(e))) return null;
    if (w.root !== time && !partExists(game, time)) return null; // a part of a window shows once the player makes it
    return game.settled(slot);
}

// LAYERS (step 4): a layer is one night on the board. MINE is the player's own; every theory the player has met
// (the story's, and their own) is a layer too: its pencil marks are its own, and its answers place their agents
// and patients where and when the events they answer happened (`theoryMarks`).
export const MINE = 'mine';
const layerOf = (p) => p.layer ?? MINE;
/** A pencil mark's aspect: 'at' (where), 'held' (who has it), or a condition's id. */
export const aspectOf = (p) => p.aspect ?? 'at';

/**
 * The player's pencil marks for a thing at a time in a layer, in one aspect: [{value, struck, status}], then (where
 * it is) the theory's own marks. `status` (markStatus): proven, ruled out, or excluded by the clues (greying).
 */
export function pencilAt(game, thing, time, layer = MINE, aspect = 'at') {
    const own = game.board.pencil.filter((p) => p.thing === thing && p.time === time && layerOf(p) === layer && aspectOf(p) === aspect)
        .map((p) => ({ value: p.value, struck: !!p.struck, status: layer === MINE ? markStatus(game, thing, time, p.value, aspect) : null }));
    if (aspect !== 'at') return own;
    const theirs = theoryMarks(game, layer).filter((m) => m.thing === thing && m.time === time && !own.some((o) => o.value === m.value)).map((m) => ({ value: m.value, struck: false, theory: true }));
    return [...own, ...theirs];
}

/**
 * Where a theory's answers put people and things: for an event whose agent or patient it names, at the event's
 * place and time (its own answers, else what the player's clues settle), at times the story has reached. A state
 * it names directly counts too.
 */
export function theoryMarks(game, layer) {
    if (layer === MINE) return [];
    const theory = game.visibleTheories().find((t) => t.id === layer);
    if (!theory) return [];
    const a = theory.assignment ?? {};
    const value = (slot) => a[slot] ?? (game.model.slots.has(slot) ? game.settled(slot) : null);
    const out = [];
    for (const [slot, v] of Object.entries(a)) {
        const st = game.model.slots.get(slot);
        if (st?.track && st.state === 'at') { if (game.reached(st.root)) out.push({ thing: st.on, time: st.window, value: v }); continue; }
        const m = slot.match(/^(e\.[a-z0-9_]+)\.(agent|patient)$/);
        if (!m || !game.model.cards.has(v)) continue;
        const place = value(`${m[1]}.place`);
        const time = value(`${m[1]}.time`);
        if (place && time && game.reached(time)) out.push({ thing: v, time, value: place });
    }
    return out;
}

/** The time an event is shown at: the deepest part the player placed it in, else its settled window, else null. */
export function eventTime(game, event) {
    const placed = game.board.placed.find((p) => p.event === event);
    if (placed) return placed.time;
    const slot = `${event}.time`;
    return game.model.slots.has(slot) ? game.settled(slot) : null;
}

/** Fold a place into the columns: itself if a column, else the nearest column containing it, else elsewhere. */
function folder(game, columns) {
    const within = new Map(game.model.data.entities.filter((e) => e.within).map((e) => [e.id, e.within]));
    return (p) => {
        for (let q = p, seen = 0; q && seen < 20; q = within.get(q), seen++) if (columns.includes(q)) return q;
        return ELSEWHERE;
    };
}

/** The place columns: the places of the case's place sets the player has met, then elsewhere and unknown. */
export function columns(game, layer = MINE) {
    const sets = game.model.data.state_places ?? [];
    const out = [];
    for (const s of sets) for (const p of s.places) if (game.knows(p) && !out.includes(p)) out.push(p);
    // A place marked outside the sets gets a column only when no column contains it.
    const fold = folder(game, [...out]);
    for (const p of [...game.board.pencil.filter((x) => aspectOf(x) === 'at').map((x) => x.value), ...theoryMarks(game, layer).map((m) => m.value)]) if (!out.includes(p) && p !== ELSEWHERE && p !== UNKNOWN && game.model.cards.has(p) && fold(p) === ELSEWHERE) out.push(p);
    return [...out, ELSEWHERE, UNKNOWN];
}

/** By thing: rows of followed things, a cell per time with what is given and pencilled. */
export function byThing(game, layer = MINE) {
    const ts = times(game).filter((t) => t.kind !== 'boundary');
    const rows = followed(game, layer).map((thing) => ({
        thing,
        cells: ts.map((t) => ({
            time: t.id,
            at: given(game, thing, 'at', t.id),
            held: given(game, thing, 'held', t.id),
            conditions: conditionsAt(game, thing, t.id, layer),
            pencil: pencilAt(game, thing, t.id, layer),
            heldPencil: pencilAt(game, thing, t.id, layer, 'held'),
            aims: given(game, thing, 'aims', t.id),
            aimsPencil: pencilAt(game, thing, t.id, layer, 'aims'),
        })),
    }));
    return { times: ts, rows };
}

/** By place: a row per time, a cell per place column with the things and events there. */
export function byPlace(game, layer = MINE) {
    const cols = columns(game, layer);
    const fold = folder(game, cols.filter((c) => c !== ELSEWHERE && c !== UNKNOWN));
    const ts = times(game);
    const things = followed(game, layer);
    const events = [...game.unlocked.keys()].filter((id) => game.model.cards.get(id)?.section === 'events');
    const rows = ts.map((t) => {
        const cells = new Map(cols.map((c) => [c, { things: [], events: [] }]));
        if (t.kind === 'boundary') {
            const place = game.model.slots.has(`${t.event}.place`) ? game.settled(`${t.event}.place`) : null;
            cells.get(place ? fold(place) : UNKNOWN).events.push(t.event);
            return { time: t, cells };
        }
        for (const thing of things) {
            const g = given(game, thing, 'at', t.id);
            const marks = pencilAt(game, thing, t.id, layer);
            if (g !== null) cells.get(cols.includes(g) ? g : fold(g)).things.push({ thing, given: true });
            for (const m of marks) if (m.value !== g) cells.get(cols.includes(m.value) ? m.value : fold(m.value)).things.push({ thing, pencil: true, struck: m.struck, status: m.status, theory: !!m.theory, value: m.value });
            if (g === null && !marks.some((m) => !m.struck)) cells.get(UNKNOWN).things.push({ thing });
        }
        for (const e of events) {
            if (eventTime(game, e) !== t.id) continue;
            // A splitting event sits on its boundary row, not in the window it splits.
            if (game.board.splits.some((s) => s.by === e && s.time === t.id)) continue;
            const place = game.model.slots.has(`${e}.place`) ? game.settled(`${e}.place`) : null;
            cells.get(place ? fold(place) : UNKNOWN).events.push(e);
        }
        return { time: t, cells };
    });
    return { columns: cols, rows };
}

/**
 * Does a layer fit what the player holds and trusts? Its theory's answers are fixed, and each of its declared
 * states the player has pencilled must take one of the places pencilled there (not struck). Pencil marks at times
 * or for things the case has no state for cannot be checked: they are counted, not judged.
 * Returns {fits, conflict (constraint ids, when it does not fit), fixed, checked, unchecked}, and for a theory's layer its
 * `cost` (Game.scenarioCost: what that night must disbelieve).
 */
export function checkLayer(game, layer = MINE) {
    const theory = layer === MINE ? null : game.visibleTheories().find((t) => t.id === layer);
    const fixed = { ...(theory?.assignment ?? {}) };
    const extra = [];
    const groups = new Map();
    for (const p of game.board.pencil) {
        if (layerOf(p) !== layer || p.struck) continue;
        const key = `${p.thing}|${p.time}|${aspectOf(p)}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(p.value);
    }
    let checked = 0;
    let unchecked = 0;
    for (const [key, values] of groups) {
        const [thing, time, aspect] = key.split('|');
        const slot = `st.${thing}.${aspect}.${time.replace(/^w\./, '')}`;
        const track = game.model.stateTracks.get(`${aspect}|${thing}`);
        if (!game.model.slots.has(slot) || !track) { unchecked += values.length; continue; }
        const allowed = [...new Set(values.flatMap((v) => track.overlaps(v)))];
        extra.push(allowed.length === 1 ? { eq: [slot, allowed[0]] } : { in: [slot, allowed] });
        checked += values.length;
    }
    // As "Could it fit?" does: against what the player trusts, the claims caught in a clash set aside.
    const active = game.workingConstraints();
    // A theory's night is weighed as a scenario (docs/hypotheses.md, Q2): what it must disbelieve, not only whether.
    const cost = theory ? { cost: game.scenarioCost(theory, { extra }) } : {};
    if (game.model.problem.consistent(active, fixed, { extra }).ok) return { fits: true, conflict: null, fixed, checked, unchecked, ...cost };
    return { fits: false, conflict: game.model.problem.explainConflict(active, fixed, { extra }) ?? [], fixed, checked, unchecked, ...cost };
}

/**
 * One card's own timeline, read off the same board: for a thing (person, animal, group, object), where it was at
 * each time and what it did or had done to it; for a place, who and what was there and what happened there; for an
 * event, when and where it happened. Only times the story has reached, and only times with something to show.
 * Returns {kind: 'thing'|'place'|'event'|null, lines: [{time, label, depth, ...}], undated: [event ids]}.
 */
export function cardTimeline(game, id, layer = MINE) {
    const card = game.model.cards.get(id);
    const kind = card?.section === 'events' ? 'event' : card?.kind === 'place' ? 'place' : BOARD_KINDS.includes(card?.kind) ? 'thing' : null;
    if (!kind) return { kind: null, lines: [], undated: [] };
    const ts = times(game).filter((t) => t.kind !== 'boundary');
    const events = [...game.unlocked.keys()].filter((e) => game.model.cards.get(e)?.section === 'events');
    const settledOf = (slot) => (game.model.slots.has(slot) ? game.settled(slot) : null);
    if (kind === 'event') {
        const at = eventTime(game, id);
        const place = settledOf(`${id}.place`);
        const split = at ? game.board.splits.find((s) => s.time === at && s.by !== id) : null;
        const t = ts.find((x) => x.id === at);
        return { kind, lines: at ? [{ time: at, label: t?.label ?? null, depth: t?.depth ?? 0, place, split: split?.by ?? null, placed: game.board.placed.some((p) => p.event === id) }] : [], undated: [], place };
    }
    const lines = [];
    const undated = [];
    if (kind === 'thing') {
        const roles = (e) => ['agent', 'patient', 'recipient'].filter((r) => settledOf(`${e}.${r}`) === id);
        const mine = events.filter((e) => roles(e).length);
        for (const t of ts) {
            const line = {
                time: t.id, label: t.label, depth: t.depth,
                at: given(game, id, 'at', t.id),
                held: given(game, id, 'held', t.id),
                conditions: conditionsAt(game, id, t.id, layer),
                pencil: pencilAt(game, id, t.id, layer),
                heldPencil: pencilAt(game, id, t.id, layer, 'held'),
                aims: given(game, id, 'aims', t.id),
                aimsPencil: pencilAt(game, id, t.id, layer, 'aims'),
                events: mine.filter((e) => eventTime(game, e) === t.id && !game.board.splits.some((s) => s.by === e && s.time === t.id)).map((e) => ({ event: e, roles: roles(e) })),
            };
            if (line.at !== null || line.held !== null || line.aims !== null || line.conditions.length || line.pencil.length || line.heldPencil.length || line.aimsPencil.length || line.events.length) lines.push(line);
        }
        for (const e of mine) if (!eventTime(game, e)) undated.push(e);
        return { kind, lines, undated };
    }
    // A place: whoever the board puts there or somewhere inside it, and the events done there.
    const within = new Map(game.model.data.entities.filter((e) => e.within).map((e) => [e.id, e.within]));
    const inside = (p) => { for (let q = p, n = 0; q && n < 20; q = within.get(q), n++) if (q === id) return true; return false; };
    const things = new Set([...followed(game, layer), ...game.board.pencil.filter((p) => layerOf(p) === layer && aspectOf(p) === 'at' && inside(p.value)).map((p) => p.thing)]);
    for (const t of ts) {
        const here = [];
        for (const thing of things) {
            const g = given(game, thing, 'at', t.id);
            if (g !== null && inside(g)) here.push({ thing, given: true, value: g });
            for (const m of pencilAt(game, thing, t.id, layer)) if (inside(m.value) && m.value !== g) here.push({ thing, pencil: !m.theory, theory: !!m.theory, struck: m.struck, status: m.status, value: m.value });
        }
        const evs = events.filter((e) => eventTime(game, e) === t.id && inside(settledOf(`${e}.place`)) && !game.board.splits.some((s) => s.by === e && s.time === t.id));
        if (here.length || evs.length) lines.push({ time: t.id, label: t.label, depth: t.depth, things: here, events: evs });
    }
    for (const e of events) if (!eventTime(game, e) && inside(settledOf(`${e}.place`))) undated.push(e);
    return { kind, lines, undated };
}

/** The kinds of card the board follows (a place is a column, an event sits in a cell). */
export const BOARD_KINDS = ['person', 'animal', 'group', 'object'];

/** A thing's conditions at a time: what the clues give, and the player's pencil marks, per condition. */
function conditionsAt(game, thing, time, layer) {
    const conds = (game.model.data.state_conditions ?? []).map((c) => ({ id: c.id, kind: 'condition', label: c.id }));
    // Knowledge, per proposition (step 5): did the thing know it then?
    const known = (game.model.data.propositions ?? []).map((p) => ({ id: knowsName(p.id), kind: 'knowledge', label: p.text, proposition: p.id }));
    return [...conds, ...known].map((c) => ({ ...c, value: given(game, thing, c.id, time), pencil: pencilAt(game, thing, time, layer, c.id) }))
        .filter((c) => c.value !== null || c.pencil.length);
}

/** The declared state a mark speaks of, and the value of its domain the mark's value stands for: {slot, value} or null. */
export function stateOf(game, thing, time, aspect, value) {
    const slot = `st.${thing}.${aspect}.${time.replace(/^w\./, '')}`;
    const track = game.model.stateTracks.get(`${aspect}|${thing}`);
    if (!game.model.slots.has(slot) || !track) return null;
    const v = track.overlaps(value)[0];
    return v === undefined ? null : { slot, value: v };
}

/**
 * Where a mark of the player's stands: 'proven' (they proved that state), 'ruled' (they ruled it out with a proof),
 * 'excluded' (with greying on, their clues rule it out), or null.
 */
export function markStatus(game, thing, time, value, aspect = 'at') {
    const st = stateOf(game, thing, time, aspect, value);
    if (!st) return null;
    if (game.provenValue(st.slot) === st.value) return 'proven';
    if (game.isStruckWithProof(st.slot, st.value)) return 'ruled';
    if (game.helps('greying') && game.settled(st.slot) === null && !game.plausible(st.slot, st.value).plausible) return 'excluded';
    return null;
}
