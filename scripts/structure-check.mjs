// Checks a story's logic before anything is built from it (docs/authored-stories.md, step 7):
//   node scripts/structure-check.mjs <case dir> [seeds]
// A structure with `papers` (items earned by solving questions). It checks the references, that every listed wrong
// answer has what rules it out, that every paper and clue is used, that every question can be reached, and then
// places the papers at random on the questions for many seeds, as an Archipelago fill would, and plays each placement.
import fs from 'node:fs';

const dir = process.argv[2] ?? 'cases/custom-house-fire';
const seeds = Number(process.argv[3] ?? 2000);
const s = JSON.parse(fs.readFileSync(`${dir}/structure.json`, 'utf8'));
const errors = [];
const err = (m) => errors.push(m);

const frame = new Set(s.frame.map((f) => f.id));
const clues = new Map(s.clues.map((c) => [c.id, c]));
const papers = new Map(s.papers.map((p) => [p.id, p]));
const questions = new Map(s.questions.map((q) => [q.id, q]));
const start = new Set(s.delivery?.start ?? []);

for (const p of s.papers) for (const c of p.clues) if (clues.get(c)?.paper !== p.id) err(`${p.id}: clue ${c} does not name this paper`);
for (const c of s.clues) if (!papers.get(c.paper)?.clues.includes(c.id)) err(`${c.id}: not listed in paper ${c.paper}`);
if (!questions.has(s.goal)) err(`no goal question ${s.goal}`);

// The papers a question needs: those of its clues (the first set of `needs` that is cheapest is not chosen: every set
// is kept as an alternative), and the paper that raises it.
const paperSets = new Map();
const used = new Set();
for (const q of s.questions) {
    for (const o of q.others) if (!q.rules_out?.[o]) err(`${q.id}: nothing rules out "${o}"`);
    for (const o of Object.keys(q.rules_out ?? {})) if (!q.others.includes(o)) err(`${q.id}: rules out "${o}", which is not listed`);
    for (const r of q.requires ?? []) if (!questions.has(r)) err(`${q.id}: requires ${r}, which does not exist`);
    if (q.raised !== 'main' && !papers.has(q.raised)) err(`${q.id}: raised in ${q.raised}, which is no paper`);
    // What rules an answer out may name only clues the question needs, frame entries, or questions it requires (in any depth).
    const deep = new Set();
    const walk = (id) => { for (const r of questions.get(id)?.requires ?? []) if (!deep.has(r)) { deep.add(r); walk(r); } };
    walk(q.id);
    const own = new Set(q.needs.flat());
    for (const text of [...Object.values(q.rules_out ?? {}), ...Object.values(q.points_to ?? {})]) {
        for (const ref of text.match(/\b(?:c|fr|q)\.[a-z0-9_]+/g) ?? []) {
            if (ref.startsWith('q.') ? !deep.has(ref) : !own.has(ref)) err(`${q.id}: its reasoning names ${ref}, which it neither needs nor requires`);
        }
    }
    paperSets.set(q.id, q.needs.map((set) => {
        const out = new Set(q.raised === 'main' ? [] : [q.raised]);
        for (const id of set) {
            if (frame.has(id)) { used.add(id); continue; }
            if (!clues.has(id)) { err(`${q.id}: no clue ${id}`); continue; }
            used.add(id);
            out.add(clues.get(id).paper);
        }
        return out;
    }));
}
for (const c of s.clues) if (!used.has(c.id)) console.log(`note: clue ${c.id} (${c.paper}) is needed by no question`);
for (const f of s.frame) if (!used.has(f.id)) console.log(`note: frame entry ${f.id} is needed by no question`);
const neededPapers = new Set([...paperSets.values()].flat().flatMap((x) => [...x]));
for (const p of s.papers) if (!neededPapers.has(p.id)) err(`paper ${p.id} is needed by no question`);

// The layers must not loop.
const order = [];
{
    const state = new Map();
    const visit = (id, trail) => {
        if (state.get(id) === 'done') return;
        if (state.get(id) === 'open') { err(`a loop of requires: ${[...trail, id].join(' -> ')}`); return; }
        state.set(id, 'open');
        for (const r of questions.get(id).requires ?? []) if (questions.has(r)) visit(r, [...trail, id]);
        state.set(id, 'done');
        order.push(id);
    };
    for (const q of s.questions) visit(q.id, []);
}

const open = (q, held, solved) => !solved.has(q.id) && (q.requires ?? []).every((r) => solved.has(r)) && paperSets.get(q.id).some((set) => [...set].every((p) => held.has(p)));
const locations = s.questions.filter((q) => q.id !== s.goal).map((q) => q.id);
const earned = s.papers.map((p) => p.id).filter((p) => !start.has(p));
if (earned.length > locations.length) err(`${earned.length} papers to earn and only ${locations.length} questions besides the goal`);

// With every paper held, every question is reachable.
{
    const held = new Set(papers.keys()), solved = new Set();
    for (let more = true; more;) { more = false; for (const q of s.questions) if (open(q, held, solved)) { solved.add(q.id); more = true; } }
    for (const q of s.questions) if (!solved.has(q.id)) err(`${q.id} cannot be reached even with every paper`);
}

if (errors.length) { for (const e of errors) console.log(`error: ${e}`); console.log(`${errors.length} error(s)`); process.exit(1); }

// What each question needs in all (its own papers and those of what it requires).
const all = new Map();
for (const id of order) {
    const q = questions.get(id);
    const set = new Set(paperSets.get(id)[0]);
    for (const r of q.requires ?? []) for (const p of all.get(r)) set.add(p);
    all.set(id, set);
}

// A seeded placement of papers on questions; a question with no paper gives nothing.
const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (list, rand) => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Playing a placement: the player solves every open question (a round), and takes the papers they hold.
const play = (place) => {
    const held = new Set(start), solved = new Set(), widths = [];
    for (;;) {
        const now = s.questions.filter((q) => open(q, held, solved));
        if (!now.length) break;
        widths.push(now.length);
        for (const q of now) { solved.add(q.id); if (place.get(q.id)) held.add(place.get(q.id)); }
    }
    return { done: solved.size === s.questions.length, widths, solved };
};
// The slowest player: one question at a time, how many are open to choose from at each step.
const choices = (place, rand) => {
    const held = new Set(start), solved = new Set(), counts = [];
    for (;;) {
        const now = s.questions.filter((q) => open(q, held, solved));
        if (!now.length) break;
        counts.push(now.length);
        const q = now[Math.floor(rand() * now.length)];
        solved.add(q.id);
        if (place.get(q.id)) held.add(place.get(q.id));
    }
    return counts;
};
// The fill, as Archipelago does it going forward: among the questions that can be reached with the papers placed so
// far and that hold nothing yet, one is drawn, and a paper not yet placed is put on it; when every reachable question
// is taken and papers remain, the draw has failed and is made again (counted). Questions left over give nothing.
const fill = (rand) => {
    const place = new Map(), left = shuffle(earned, rand);
    while (left.length) {
        const free = [...play(place).solved].filter((id) => id !== s.goal && !place.has(id));
        if (!free.length) return null;
        place.set(free[Math.floor(rand() * free.length)], left.pop());
    }
    return place;
};
let good = 0, redraws = 0;
const rounds = [], narrow = [], firstOrders = new Set(), stepCounts = [], empty = new Map(locations.map((l) => [l, 0]));
for (let seed = 1; seed <= seeds; seed++) {
    const rand = rng(seed);
    let place = null;
    for (let tries = 0; !place && tries < 1000; tries++) { place = fill(rand); if (!place) redraws++; }
    if (!place) continue;
    const r = play(place);
    if (!r.done) continue;
    good++;
    rounds.push(r.widths.length);
    const c = choices(place, rand);
    stepCounts.push(c);
    narrow.push(c.filter((n) => n === 1).length);
    for (const l of locations) if (!place.has(l)) empty.set(l, empty.get(l) + 1);
    firstOrders.add(['q.set', 'q.aim', 'q.oil'].map((l) => place.get(l) ?? '-').sort().join(','));
}
const mean = (a) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
console.log(`${s.questions.length} questions (${locations.length} besides the goal), ${s.papers.length} papers (${start.size} at the start), ${s.clues.length} clues in papers, ${s.frame.length} frame entries`);
console.log(`layers: ${[1, 2, 3].map((l) => `${s.questions.filter((q) => q.layer === l).length} of layer ${l}`).join(', ')}`);
console.log('\nwhat each question needs in all (papers, counting what it requires):');
for (const q of s.questions) console.log(`  ${q.id.padEnd(11)} ${String(all.get(q.id).size).padStart(2)}  own: ${[...paperSets.get(q.id)[0]].join(', ') || '(the main story alone)'}${q.requires ? `  after: ${q.requires.join(', ')}` : ''}`);
console.log('\nhow many questions need each paper (directly):');
for (const p of s.papers) console.log(`  ${p.id.padEnd(15)} ${s.questions.filter((q) => paperSets.get(q.id)[0].has(p.id)).map((q) => q.id).join(', ')}`);
console.log(`\nplacements drawn and played to the end: ${good} of ${seeds} seeds (${redraws} draws thrown away on the way, ${(redraws / seeds).toFixed(2)} a seed)`);
if (good) {
    console.log(`  rounds of "solve everything open": ${Math.min(...rounds)} to ${Math.max(...rounds)}, mean ${mean(rounds)}`);
    console.log(`  one question at a time, steps where only one question was open: ${Math.min(...narrow)} to ${Math.max(...narrow)}, mean ${mean(narrow)} of ${s.questions.length}`);
    const at = (i) => mean(stepCounts.map((c) => c[i] ?? 0));
    console.log(`  questions open to choose from, by step: ${Array.from({ length: s.questions.length }, (_, i) => at(i)).join(' ')}`);
    console.log(`  different sets of papers earned by the three opening questions: ${firstOrders.size}`);
    console.log(`  how often each question gives nothing: ${locations.filter((l) => empty.get(l)).map((l) => `${l} ${Math.round(100 * empty.get(l) / good)}%`).join(', ')}`);
}
