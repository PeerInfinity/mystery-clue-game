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
export function followed(game) {
    const out = new Set();
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

/** The player's pencil marks for a thing at a time: [{value, struck}]. */
export function pencilAt(game, thing, time) {
    return game.board.pencil.filter((p) => p.thing === thing && p.time === time).map((p) => ({ value: p.value, struck: !!p.struck }));
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
export function columns(game) {
    const sets = game.model.data.state_places ?? [];
    const out = [];
    for (const s of sets) for (const p of s.places) if (game.knows(p) && !out.includes(p)) out.push(p);
    for (const p of game.board.pencil.map((x) => x.value)) if (!out.includes(p) && p !== ELSEWHERE && p !== UNKNOWN && game.model.cards.has(p)) out.push(p);
    return [...out, ELSEWHERE, UNKNOWN];
}

/** By thing: rows of followed things, a cell per time with what is given and pencilled. */
export function byThing(game) {
    const ts = times(game).filter((t) => t.kind !== 'boundary');
    const rows = followed(game).map((thing) => ({
        thing,
        cells: ts.map((t) => ({
            time: t.id,
            at: given(game, thing, 'at', t.id),
            held: given(game, thing, 'held', t.id),
            conditions: (game.model.data.state_conditions ?? []).map((c) => ({ id: c.id, value: given(game, thing, c.id, t.id) })).filter((c) => c.value !== null),
            pencil: pencilAt(game, thing, t.id),
        })),
    }));
    return { times: ts, rows };
}

/** By place: a row per time, a cell per place column with the things and events there. */
export function byPlace(game) {
    const cols = columns(game);
    const fold = folder(game, cols.filter((c) => c !== ELSEWHERE && c !== UNKNOWN));
    const ts = times(game);
    const things = followed(game);
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
            const marks = pencilAt(game, thing, t.id);
            if (g !== null) cells.get(cols.includes(g) ? g : fold(g)).things.push({ thing, given: true });
            for (const m of marks) if (m.value !== g) cells.get(cols.includes(m.value) ? m.value : fold(m.value)).things.push({ thing, pencil: true, struck: m.struck });
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
