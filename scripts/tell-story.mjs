// A case's story written from its typed data (engine/tell.js; docs/authored-stories.md, finding 137):
//   node scripts/tell-story.mjs <dir>        writes; --check: writes nothing, exits 1 if anything would change
// The case's world/telling.json says only the order: `{title, paragraphs: [[item, ...], ...]}`, an item a fact's id,
// `{deed: <question>}` (the deed the question asks about, its doer unknown) or `{raise: <question>}` (its label, as
// a question). From it and the typed entries this writes the story's text, and into the data what follows from
// the text: each fact's `para` and `quote` (and a `says` entry's `value`), each time's `para` and `quote` (where it
// is first told), each question's `raised`, `quote`, its answers' `available` and `quote` (where the answer is
// first named) and its give-away, what each observation says (its entries' sentences), and world/mentions.json.
// With world/prose.json (scripts/prose-story.mjs) the text and the quotes are that prose's, and the rest as above. Files are rewritten one object a line, as they are kept.
import fs from 'node:fs';
import path from 'node:path';
import { teller } from '../engine/tell.js';

const J = JSON.stringify;
/** A data file as it is kept: one object a line under its one key. */
const lines = (key, rows) => `{\n  ${J(key)}: [\n${rows.map((r) => `    ${J(r).replace(/^\{/, '{').replace(/","/g, '", "').replace(/":/g, '": ').replace(/,"/g, ', "')}`).join(',\n')}\n  ]\n}\n`;

export function tell(dir, opts = {}) {
    const W = path.join(dir, 'world'), R = (f) => JSON.parse(fs.readFileSync(path.join(W, f), 'utf8'));
    const header = R('case.json'), telling = R('telling.json');
    const entities = R('entities.json').entities, times = R('times.json').times, facts = R('facts.json').facts, questions = R('questions.json').questions;
    const actions = fs.existsSync(path.join(W, 'actions.json')) ? R('actions.json').actions : [];
    const byId = (xs) => new Map(xs.map((x) => [x.id, x]));
    const E = byId(entities), T = byId(times), F = byId(facts), Q = byId(questions), A = byId(actions);
    const t = teller({ narrator: header.narrators[0].id, name: (id) => E.get(id)?.name ?? id, time: (id) => T.get(id).label, act: (id) => A.get(id), question: (id) => Q.get(id) });
    for (const x of times) { delete x.para; delete x.quote; }
    const paras = [], dry = [];   // `dry`: each paragraph's items as the templates tell them, for a writer (scripts/prose-story.mjs)
    telling.paragraphs.forEach((items, i) => {
        const n = i + 1, out = [], told = [];
        dry.push(told);
        let last = null, full = '';
        const at = (time, body) => {
            const key = time?.at ?? null, pre = key && key !== last ? t.prefix(time) : '';
            if (key && key !== last) { const tp = T.get(key); if (tp.para == null) { tp.para = n; tp.quote = pre.replace(/, $/, ''); } }
            last = key ?? last;
            out.push(`${pre ? pre + body : t.cap(body)}${body.endsWith('"') ? '' : '.'}`);
            full = `${t.prefix(time) ? t.prefix(time) + body : t.cap(body)}${body.endsWith('"') ? '' : '.'}`;   // with its time said, whatever came before it   // a sentence that ends in someone's words has its stop inside them
        };
        for (const item of items) {
            if (typeof item === 'string') {
                const f = F.get(item);
                if (!f) throw new Error(`telling: no fact ${item}`);
                const s = t.sentence(f);
                if (f.attr === 'says') f.value = t.said(f);
                f.para = n; f.quote = s;
                at(f.time, s);
                told.push({ key: f.id, text: out.at(-1), full });
            } else if (item.deed) { const q = Q.get(item.deed); q.deed_quote = t.deed(q); at(q.entry.time, q.deed_quote); told.push({ key: `deed:${q.id}`, text: out.at(-1), full }); }
            else if (item.raise) { const q = Q.get(item.raise); q.raised = n; q.quote = q.label; out.push(q.label); told.push({ key: `raise:${q.id}`, text: q.label, full: q.label }); }
        }
        paras.push(out.join(' '));
    });
    // Prose written from the telling (world/prose.json, by scripts/prose-story.mjs: a model's, kept as it was given):
    // its paragraphs are the story's, and each entry's quote is the words of the prose that state it. The sentences
    // of the templates stay as what the observations say. Every quote must be in its paragraph.
    const prosePath = path.join(W, 'prose.json'), prose = !opts.dry && fs.existsSync(prosePath) ? JSON.parse(fs.readFileSync(prosePath, 'utf8')) : null;
    const drySentence = new Map(facts.map((f) => [f.id, f.quote]));
    if (prose) {
        if (prose.paragraphs.length !== paras.length) throw new Error('prose.json: not the telling\'s paragraphs');
        prose.paragraphs.forEach((p, i) => {
            paras[i] = p.text;
            for (const { key } of dry[i]) {
                const quote = p.quotes?.[key];
                if (!quote || !p.text.includes(quote)) throw new Error(`prose.json ¶${i + 1}: no quote of ${key} in its paragraph`);
                if (key.startsWith('raise:')) Q.get(key.slice(6)).quote = quote;
                else if (!key.startsWith('deed:')) F.get(key).quote = quote;
            }
        });
        for (const x of times) { delete x.para; delete x.quote; }
        for (const [id, quote] of Object.entries(prose.times ?? {})) { const n = prose.paragraphs.findIndex((p) => p.text.includes(quote)) + 1; if (!n || !T.has(id)) throw new Error(`prose.json: time ${id}: "${quote}" is in no paragraph`); Object.assign(T.get(id), { para: n, quote }); }
    }
    // An answer is available where the story first names it, by the entry that does; the give-away is the entry that asserts it.
    for (const q of questions) {
        for (const p of q.possibilities) {
            if (p.via === 'always') { p.available = q.raised; continue; }
            const f = facts.filter((x) => x.of === p.value && x.para >= q.raised).sort((a, b) => a.para - b.para)[0] ?? facts.filter((x) => x.of === p.value).sort((a, b) => a.para - b.para)[0];
            if (f) { p.available = Math.max(f.para, q.raised); p.quote = f.para >= q.raised ? f.quote : undefined; if (p.quote === undefined) { delete p.quote; p.from = f.id; } else delete p.from; }
        }
        const give = facts.find((f) => [f.asserts ?? []].flat().some((x) => x.q === q.id && x.pick === q.answer));
        if (give) { q.answer_given_at = give.para; q.answer_given_quote = give.quote; }
        delete q.deed_quote;
    }
    // What an observation says is what its entries say (one that comes from a move, a doubt or another question keeps its own words).
    const observations = fs.existsSync(path.join(W, 'observations.json')) ? R('observations.json').observations : null;
    for (const o of observations ?? []) if (o.from.every((x) => typeof x === 'string' && F.has(x))) o.says = o.from.map((x) => { const f = F.get(x); return `${t.prefix(f.time).replace(/^On /, 'on ')}${drySentence.get(x)}`.replace(/\."$/, '"'); }).join('; ');
    // A form of a name the prose used counts as a mention only if it has a word of the name itself: "Abel", "Mrs. Crouch",
    // "Abel's shed"; not "it", "his shed" or "my marrow", which are whoever is being spoken of.
    const named = (e, m) => !/^(my|his|her|its|their|our|your)\b/i.test(m) && m.split(/[^A-Za-z]+/).some((w) => /^[A-Z]/.test(w) && w.length > 2 && e.name.split(/[^A-Za-z]+/).includes(w));
    const files = {
        [path.join(dir, header.story.replace(/^\.\.\//, ''))]: `${telling.title}\n\n${paras.join('\n\n')}\n`,
        [path.join(W, 'facts.json')]: lines('facts', facts),
        [path.join(W, 'times.json')]: lines('times', times),
        [path.join(W, 'questions.json')]: lines('questions', questions),
        ...(observations ? { [path.join(W, 'observations.json')]: lines('observations', observations) } : {}),
        [path.join(W, 'mentions.json')]: `{\n "entities": {\n${entities.map((e) => `  ${J(e.id)}: ${J([...new Set([e.name, ...(prose?.mentions?.[e.id] ?? []).filter((m) => named(e, m))])]).replace(/","/g, '", "')}`).join(',\n')}\n }\n}\n`,
    };
    if (opts.dry) return { dry, title: telling.title, style: telling.style ?? null, entities, times, narrator: header.narrators[0] };
    return files;
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
    const check = process.argv.includes('--check'), dir = process.argv.slice(2).find((a) => !a.startsWith('--'));
    let changed = 0;
    for (const [file, text] of Object.entries(tell(dir))) {
        if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === text) continue;
        changed++;
        if (check) console.log(`would change: ${file}`); else { fs.writeFileSync(file, text); console.log(`written: ${file}`); }
    }
    if (!changed) console.log('nothing to change');
    process.exit(check && changed ? 1 : 0);
}
