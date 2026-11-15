// Translates a story's logic (structure.json with `papers`) into Archipelago logic, in the rules.json format of the
// Archipelago-CC repository (its world generator turns such a file into an APWorld):
//   node scripts/export-rules.mjs <case dir> [out file]      (default out: <case dir>/rules.json)
// Papers are the items; a question solved (right answer, evidence linked) is a location check; the goal question is an
// event holding Victory. A question's rule is a fixed list of papers: its own and those of every question it requires,
// since right or wrong does not enter the logic (docs/archipelago-plan.md, "The logic"). Location names are neutral
// ("Question 07"): they are visible to the whole multiworld, and a question's wording can give things away; the real
// ids are in the slot data (`world[1].slot_data.mystery`). Papers are named by their titles, which name only a source.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const PLAYER = '1';
const TRUE = { rule: 'True_' };

// Every set of papers that opens a question: one per choice of alternative in its own `needs` and in those of the
// questions it requires, the paper that raises each included.
export function paperSets(s) {
    const frame = new Set(s.frame.map((f) => f.id));
    const clues = new Map(s.clues.map((c) => [c.id, c]));
    const questions = new Map(s.questions.map((q) => [q.id, q]));
    const memo = new Map();
    const sets = (id, trail = []) => {
        if (memo.has(id)) return memo.get(id);
        if (trail.includes(id)) throw new Error(`a loop of requires: ${[...trail, id].join(' -> ')}`);
        const q = questions.get(id);
        if (!q) throw new Error(`no question ${id}`);
        let out = q.needs.map((set) => {
            const own = new Set(q.raised === 'main' ? [] : [q.raised]);
            for (const c of set) {
                if (frame.has(c)) continue;
                if (!clues.has(c)) throw new Error(`${id}: no clue ${c}`);
                own.add(clues.get(c).paper);
            }
            return own;
        });
        for (const r of q.requires ?? []) {
            const theirs = sets(r, [...trail, id]);
            out = out.flatMap((a) => theirs.map((b) => new Set([...a, ...b])));
        }
        // An alternative that contains another is never the one needed.
        out = out.filter((a, i) => !out.some((b, j) => j !== i && b.size <= a.size && [...b].every((p) => a.has(p)) && (b.size < a.size || j < i)));
        memo.set(id, out);
        return out;
    };
    return new Map(s.questions.map((q) => [q.id, sets(q.id)]));
}

export function exportRules(s, version = null) {
    const title = new Map(s.papers.map((p) => [p.id, p.title]));
    if (new Set(title.values()).size !== title.size) throw new Error('two papers share a title');
    const start = new Set(s.delivery?.start ?? []);
    const sets = paperSets(s);
    const names = (set) => s.papers.filter((p) => set.has(p.id) && !start.has(p.id)).map((p) => p.title);
    const hasAll = (set) => { const n = names(set); return n.length === 0 ? TRUE : n.length === 1 ? { rule: 'Has', args: { item_name: n[0] } } : { rule: 'HasAll', args: { item_names: n } }; };
    const rule = (id) => { const alts = sets.get(id).map(hasAll); return alts.some((r) => r === TRUE) ? TRUE : alts.length === 1 ? alts[0] : { rule: 'Or', children: alts }; };

    // The game's name is its identity on a server and becomes a file name (no colon: Windows cannot check one out).
    const ap = s.archipelago;
    if (!ap?.game_name || /[:\\/*?"<>|]/.test(ap.game_name)) throw new Error('archipelago.game_name is missing or cannot be a file name');
    const game = ap.game_name, directory = ap.game_directory;
    // Ids are pinned in the structure (`ap`) and never change: a room's save and the page's map are by id.
    const ids = [...s.papers.map((p) => ['item', p.id, p.ap]), ['item', 'nothing', ap.nothing_id], ['item', 'victory', ap.victory_id], ...s.questions.map((q) => ['location', q.id, q.ap])];
    for (const [kind, id, n] of ids) {
        if (!Number.isInteger(n)) throw new Error(`${id}: no pinned Archipelago id`);
        if (ids.some(([k, other, m]) => k === kind && other !== id && m === n)) throw new Error(`${id}: its Archipelago id ${n} is used twice`);
    }
    const NOTHING = 'Nothing new', VICTORY = 'Victory';
    const others = s.questions.filter((q) => q.id !== s.goal);
    const earned = s.papers.filter((p) => !start.has(p.id));
    if (earned.length > others.length) throw new Error(`${earned.length} papers to earn and only ${others.length} questions besides the goal`);
    const label = new Map(others.map((q) => [q.id, `Question ${String(q.ap - 999).padStart(2, '0')}`]));
    label.set(s.goal, 'The case solved');

    const items = {};
    s.papers.forEach((p) => { items[p.title] = { name: p.title, id: p.ap, groups: ['Everything', 'Papers'], classification: 'progression', type: null, max_count: 1 }; });
    items[NOTHING] = { name: NOTHING, id: ap.nothing_id, groups: ['Everything'], classification: 'filler', type: null, max_count: others.length - earned.length };
    items[VICTORY] = { name: VICTORY, id: null, groups: ['Event'], classification: 'progression', event: true, type: 'Event', max_count: 1 };

    const locations = others.map((q) => ({ name: label.get(q.id), id: q.ap, access_rule: rule(q.id) }));
    locations.push({ name: label.get(s.goal), id: null, access_rule: rule(s.goal), item: { name: VICTORY, player: 1, advancement: true, type: 'Event' }, locked: true, event: true });

    const counts = Object.fromEntries(earned.map((p) => [p.title, 1]));
    if (others.length > earned.length) counts[NOTHING] = others.length - earned.length;
    counts[VICTORY] = 1;

    return {
        schema_version: 3,
        game_name: game,
        game_directory: directory,
        archipelago_version: '0.6.7',
        generation_seed: 0,
        player_names: { [PLAYER]: 'Player1' },
        regions: { [PLAYER]: {
            Menu: { name: 'Menu', exits: [{ name: 'The case opens', connected_region: 'The case', access_rule: TRUE }], locations: [] },
            'The case': { name: 'The case', exits: [], locations },
        } },
        start_regions: { [PLAYER]: { default: ['Menu'], available: [] } },
        items: { [PLAYER]: items },
        item_groups: { [PLAYER]: ['Everything', 'Papers'] },
        itempool_counts: { [PLAYER]: counts },
        progression_mapping: { [PLAYER]: {} },
        starting_items: { [PLAYER]: s.papers.filter((p) => start.has(p.id)).map((p) => p.title) },
        // slot_data.mystery: what the neutral names stand for, and which version of the case this is, for the page's side
        // of the bridge. The world generator carries it into the slot's data and into an exported preset.
        world: { [PLAYER]: { game, world_class_name: 'MysteryWorld', options: {}, world_directory: directory, option_definitions: {},
            slot_data: { mystery: { story: s.story, version, goal: s.goal, locations: Object.fromEntries([...label].map(([q, name]) => [name, q])), items: Object.fromEntries(s.papers.map((p) => [p.title, p.id])) } } } },
        exporter: {},
        game_info: { [PLAYER]: { completion_condition: { type: 'item_check', item: VICTORY } } },
        helpers: {},
    };
}

// The structure and its version: a hash of the file, so that the page can refuse a slot made from another version.
export function readStructure(file) {
    const text = fs.readFileSync(file, 'utf8');
    return [JSON.parse(text), crypto.createHash('sha256').update(text).digest('hex').slice(0, 12)];
}

// One section to a line where that keeps the file readable: a location, an item.
export function format(doc) {
    const line = (v) => JSON.stringify(v);
    const p = PLAYER, r = doc.regions[p];
    const out = [];
    out.push('{');
    for (const k of ['schema_version', 'game_name', 'game_directory', 'archipelago_version', 'generation_seed', 'player_names']) out.push(`  ${line(k)}: ${line(doc[k])},`);
    out.push(`  "regions": {"${p}": {`);
    const regionNames = Object.keys(r);
    regionNames.forEach((name, i) => {
        out.push(`    ${line(name)}: {"name": ${line(name)}, "exits": ${line(r[name].exits)}, "locations": [`);
        r[name].locations.forEach((l, j) => out.push(`      ${line(l)}${j < r[name].locations.length - 1 ? ',' : ''}`));
        out.push(`    ]}${i < regionNames.length - 1 ? ',' : ''}`);
    });
    out.push('  }},');
    out.push(`  "start_regions": ${line(doc.start_regions)},`);
    out.push(`  "items": {"${p}": {`);
    const itemNames = Object.keys(doc.items[p]);
    itemNames.forEach((name, i) => out.push(`    ${line(name)}: ${line(doc.items[p][name])}${i < itemNames.length - 1 ? ',' : ''}`));
    out.push('  }},');
    const rest = ['item_groups', 'itempool_counts', 'progression_mapping', 'starting_items', 'world', 'exporter', 'game_info', 'helpers'];
    rest.forEach((k, i) => out.push(`  ${line(k)}: ${line(doc[k])}${i < rest.length - 1 ? ',' : ''}`));
    out.push('}');
    return out.join('\n') + '\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const dir = process.argv[2];
    if (!dir) { console.error('usage: node scripts/export-rules.mjs <case dir> [out file]'); process.exit(2); }
    const out = process.argv[3] ?? `${dir}/rules.json`;
    const doc = exportRules(...readStructure(`${dir}/structure.json`));
    fs.writeFileSync(out, format(doc));
    const locs = doc.regions[PLAYER]['The case'].locations;
    console.log(`${out}: ${locs.length} locations (1 the goal), ${Object.keys(doc.items[PLAYER]).length} items, ${doc.starting_items[PLAYER].length} papers at the start`);
}
