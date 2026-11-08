// The run's data, rebuilt from every step's items (runs/<case>/NN-<step>/[<scene>/]items.json), in step order and,
// within a step, scene order. Each item of steps 5–9 names where it goes (`file`):
//   entities, mentions {id, phrases}, moves {id}, joins {door, sides}, times, facts, accounts,
//   account_add {id, facts}, questions, possibility {q, …}, patch {id, set?, unset?}, strains, path (a move),
//   actions (a case's own action type), ramifies.
// `collect(name, {step, scene})` gives the data as a step working on that scene may see it: everything from earlier
// steps up to that scene, and from the same step's earlier scenes (nothing from later in the story).
import fs from 'node:fs';
import path from 'node:path';
import { CASES, runDir, caseDir, writeLines, writeAtomic, readJson, list, paragraphs } from './lib.mjs';

const stepDirs = (name) => (fs.existsSync(runDir(name)) ? fs.readdirSync(runDir(name)).filter((d) => /^\d\d[a-z]?-/.test(d)).sort() : []);
export const scenesOf = (name) => readJson(path.join(caseDir(name), 'scenes.json'), { scenes: [] }).scenes;

/** Every step's items in order, each tagged with its step number and scene index (`_n`, `_s`). */
export function itemsOf(name) {
    const scenes = scenesOf(name);
    const out = [];
    for (const d of stepDirs(name)) {
        const m = d.match(/^(\d\d)([a-z]?)-/);
        const n = Number(m[1]) + (m[2] ? (m[2].charCodeAt(0) - 96) / 10 : 0);
        const base = path.join(runDir(name), d);
        const one = path.join(base, 'items.json');
        if (fs.existsSync(one)) for (const x of readJson(one)) out.push({ ...x, _n: n, _s: -1 });
        scenes.forEach((s, i) => {
            const f = path.join(base, s.id, 'items.json');
            if (fs.existsSync(f)) for (const x of readJson(f)) out.push({ ...x, _n: n, _s: i });
        });
    }
    return out;
}

const strip = (x) => Object.fromEntries(Object.entries(x).filter(([k]) => !k.startsWith('_') && k !== 'file'));

/**
 * The data as seen from step `step` working on scene index `scene` (default: everything), plus `extra` items (a
 * call's new output, not yet accepted) at the end. `own: false`: none of the step's own output (the data as the
 * step found it).
 */
export function collect(name, { step = Infinity, scene = Infinity, extra = [], own = true } = {}) {
    // The same step's own output only from its earlier scenes: a step run once (scene -1) never sees its own last
    // output, which a rerun or a recheck replaces.
    const all = [...itemsOf(name).filter((x) => x._n < step ? x._s <= scene : own && x._n === step && x._s >= 0 && x._s < scene), ...extra.map((x) => ({ ...x, _n: step, _s: scene }))];
    const d = { entities: [], mentions: {}, moves: [], joins: {}, times: [], facts: [], accounts: [], questions: [], strains: [], path: [], actions: [], ramifies: [], thoughts: [], cards: [], header: null, scenes: [], sealed: null, openings: {}, observations: [] };
    const byId = (arr, x) => { const i = arr.findIndex((y) => y.id === x.id); if (i >= 0) arr[i] = { ...arr[i], ...x }; else arr.push(x); };
    const classes = new Map();   // step 6b's sorting of the time points
    const revived = new Set();   // points a later step wrote again: it needs them, so they stay
    for (const x of all) {
        if (x._n === 2) { d.header = strip(x); continue; }
        if (x._n === 3) { d.scenes.push(strip(x)); continue; }
        if (x._n === 4) { if (x.bk) d.cards.push(strip(x)); else d.thoughts.push(strip(x)); continue; }
        const y = strip(x);
        switch (x.file) {
            case 'entities': byId(d.entities, y); break;
            case 'mentions': d.mentions[y.id] = [...new Set([...(d.mentions[y.id] ?? []).map(JSON.stringify), ...list(y.phrases).map(JSON.stringify)])].map((s) => JSON.parse(s)); break;
            case 'moves': if (!d.moves.includes(y.id)) d.moves.push(y.id); break;
            case 'joins': d.joins[y.door] = y.sides; break;
            case 'times': byId(d.times, y); if (x._n > 6.2) revived.add(y.id); break;
            case 'facts': byId(d.facts, y); break;
            case 'accounts': byId(d.accounts, y); break;
            case 'account_add': { const a = d.accounts.find((z) => z.id === y.id); if (a) a.facts = [...new Set([...(a.facts ?? []), ...list(y.facts)])]; break; }
            case 'questions': if (y.id) byId(d.questions, y); break;   // a line with no id is no question (a model's slip)
            case 'strains': byId(d.strains, y); break;
            case 'path': d.path.push(y); break;
            case 'actions': byId(d.actions, y); break;
            case 'ramifies': d.ramifies.push(y); break;
            case 'timeclass': classes.set(y.id, y.class); break;
            case 'sealed': d.sealed = y; break;
            case 'openings': { const { id, ...o } = y; d.openings[id] = o; break; }
            case 'observations': byId(d.observations, y); break;
            case 'noroute': break;   // the route step's reasons: kept in its items, not in the case
            case 'possibility': { const q = d.questions.find((z) => z.id === y.q); if (q) { const { q: _, ...p } = y; const ps = q.possibilities ?? (q.possibilities = []); const i = ps.findIndex((o) => o.value === p.value); if (i >= 0) ps[i] = { ...ps[i], ...p }; else ps.push(p); } break; }
            case 'patch': {
                const t = [d.facts, d.questions, d.times, d.entities, d.accounts, d.strains].map((xs) => xs.find((z) => z.id === y.id)).find(Boolean);
                if (t) { Object.assign(t, y.set ?? {}); for (const k of list(y.unset)) delete t[k]; }
                break;
            }
            default: break;
        }
    }
    filterTimes(d, classes, revived);
    return d;
}

/**
 * Step 6b: the points classed `business` leave the timeline (kept in `d.timesFiltered`). What was after one of them is
 * after what it was after, so the order the text gave survives. The other classes are not copied onto the points: the
 * data must not say which moments the solution depends on.
 */
function filterTimes(d, classes, revived = new Set()) {
    const gone = new Map(d.times.filter((t) => classes.get(t.id) === 'business' && !revived.has(t.id)).map((t) => [t.id, t]));
    if (!gone.size) return;
    const resolve = (id, seen = new Set()) => {
        if (!gone.has(id)) return [id];
        if (seen.has(id)) return [];
        seen.add(id);
        return list(gone.get(id).after).flatMap((a) => resolve(a, seen));
    };
    d.timesFiltered = [...gone.values()];
    d.times = d.times.filter((t) => !gone.has(t.id)).map((t) => {
        const after = [...new Set(list(t.after).flatMap((a) => resolve(a)))];
        const { after: _, ...rest } = t;
        return after.length ? { ...rest, after: after.length === 1 ? after[0] : after } : rest;
    });
}

/** Write the run's case: story.txt (step 1), world/*.json, and the pipeline's own scenes.json and reading.json. */
export function assemble(name) {
    const out = caseDir(name);
    const d = collect(name);
    if (d.scenes.length) writeLines(path.join(out, 'scenes.json'), 'scenes', d.scenes);
    if (d.thoughts.length) { writeLines(path.join(out, 'reading.json'), 'thoughts', d.thoughts, { cards: d.cards }); }
    if (d.timesFiltered?.length) writeLines(path.join(out, 'times-filtered.json'), 'times', d.timesFiltered);
    if (d.header) writeWorld(name, d, out);
    return d;
}

/** The world files of data `d` in `out`/world/ (story.txt beside it: the run's own, copied if `out` is elsewhere). */
export function writeWorld(name, d, out) {
    const conf = CASES[name];
    fs.mkdirSync(path.join(out, 'world'), { recursive: true });
    if (out !== caseDir(name)) fs.copyFileSync(path.join(caseDir(name), 'story.txt'), path.join(out, 'story.txt'));
    const story = fs.readFileSync(path.join(out, 'story.txt'), 'utf8');
    writeAtomic(path.join(out, 'world', 'case.json'), JSON.stringify({ id: name.replace(/-/g, '_'), title: conf.title, author: conf.author, story: '../story.txt', narrators: d.header.narrators, subtitle: d.header.subtitle, source: { ...conf.source_info, word_count: story.split(/\s+/).filter(Boolean).length } }, null, 2) + '\n');
    writeLines(path.join(out, 'world', 'entities.json'), 'entities', d.entities, { moves: d.moves, joins: d.joins });
    writeAtomic(path.join(out, 'world', 'mentions.json'), '{\n  "entities": {\n' + Object.entries(d.mentions).map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n') + '\n  }\n}\n');
    writeLines(path.join(out, 'world', 'times.json'), 'times', d.times);
    writeLines(path.join(out, 'world', 'facts.json'), 'facts', d.facts);
    writeLines(path.join(out, 'world', 'accounts.json'), 'accounts', d.accounts);
    writeLines(path.join(out, 'world', 'questions.json'), 'questions', d.questions);
    if (d.sealed) writeAtomic(path.join(out, 'world', 'room.json'), JSON.stringify({ sealed: d.sealed, openings: d.openings }, null, 1) + '\n');
    if (d.observations.length) writeLines(path.join(out, 'world', 'observations.json'), 'observations', d.observations);
    if (d.strains.length) writeLines(path.join(out, 'world', 'strains.json'), 'strains', d.strains);
    if (d.path.length) writeLines(path.join(out, 'world', 'path.json'), 'moves', d.path);
    if (d.actions.length || d.ramifies.length) writeLines(path.join(out, 'world', 'actions.json'), 'actions', d.actions, { ramifies: d.ramifies });
    return d;
}

/** The paragraphs of the run's story, and the scene at index `i` with the story up to its end. */
export function forScene(name, i) {
    const paras = paragraphs(fs.readFileSync(path.join(caseDir(name), 'story.txt'), 'utf8'));
    const scene = scenesOf(name)[i];
    return { paras, scene };
}

// node pipeline/assemble.mjs <case>: rebuild a run's case (runs/<case>/case/) from its steps' items.
import { fileURLToPath } from 'node:url';
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const name = process.argv[2];
    if (!CASES[name]) { console.error('usage: assemble.mjs <case>'); process.exit(2); }
    const d = assemble(name);
    console.log(`${caseDir(name)}: ${d.entities.length} entities, ${d.times.length} times, ${d.facts.length} facts, ${d.questions.length} questions, ${d.strains.length} strains, ${d.path.length} moves`);
}
