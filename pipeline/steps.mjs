// The pipeline's steps (pipeline/README.md): for each, its prompt (from pipeline/steps/NN-*.md), its checks and,
// for a script step, the script. A step that works per scene sees only the story up to its scene's end and the data
// collected up to that scene (assemble.mjs `collect`).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, PIPE, caseDir, paragraphs, numbered, template, SPEC, list, readJson, writeLines } from './lib.mjs';
import os from 'node:os';
import { collect, scenesOf, writeWorld } from './assemble.mjs';
import { normalize } from '../engine/story.js';
import { GENERIC_ACTIONS } from '../engine/actions.js';
import { provenance, CLAIM_ATTRS } from '../engine/world.js';

const storyOf = (name) => paragraphs(fs.readFileSync(path.join(caseDir(name), 'story.txt'), 'utf8'));
const inPara = (paras, para, quote) => Number.isInteger(para) && paras[para] != null && typeof quote === 'string' && normalize(paras[para]).includes(normalize(quote));
const sceneIndex = (name, scene) => (Number.isInteger(scene.index) ? scene.index : scenesOf(name).findIndex((s) => s.id === scene.id));
// The data a per-scene step may see, and its parts as prompt text.
const seen = (ctx, step, scene) => collect(ctx.name, { step, scene: scene ? sceneIndex(ctx.name, scene) : Infinity });
const narratorsText = (d) => JSON.stringify(d.header?.narrators ?? []);
const mentionsText = (d) => (Object.keys(d.mentions).length ? Object.entries(d.mentions).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join('\n') : '(none yet)');
const entitiesText = (d) => [d.moves.length ? `moves: ${JSON.stringify(d.moves)}` : '', Object.keys(d.joins).length ? `joins: ${JSON.stringify(d.joins)}` : '', lines(d.entities)].filter(Boolean).join('\n');
const sceneThoughts = (d, scene) => d.thoughts.filter((t) => t.para >= scene.from && t.para <= scene.to);
const readingText = (d, upTo = Infinity) => lines([...d.cards, ...d.thoughts.filter((t) => t.para <= upTo)]);
const common = (ctx, d, scene) => ({ spec: SPEC(), scene_id: scene?.id ?? '', scene_title: scene?.title ?? '', from: scene?.from ?? '', to: scene?.to ?? '', narrators: narratorsText(d), entities: entitiesText(d), mentions: mentionsText(d), times: lines(d.times), accounts: lines(d.accounts), facts: lines(d.facts), questions: lines(d.questions) });

/**
 * The validator (scripts/validate-world.js) on the data seen so far plus a call's new items, in a trial case of its
 * own; only the messages about the ids the call wrote (or `also` names), and not those `ignore` matches.
 */
function validated(ctx, step, scene, items, { ignore = [], also = [] } = {}) {
    const d = collect(ctx.name, { step, scene: scene ? sceneIndex(ctx.name, scene) : Infinity, extra: items });
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-check-'));
    writeWorld(ctx.name, d, tmp);
    let out;
    try { out = execFileSync('node', [path.join(ROOT, 'scripts/validate-world.js'), tmp, '--quiet'], { encoding: 'utf8' }); } catch (e) { out = `${e.stdout ?? ''}\n${e.stderr ?? e.message}`; }
    fs.rmSync(tmp, { recursive: true, force: true });
    const mine = new Set([...items.flatMap((x) => [x.id, x.q, x.door]).filter(Boolean), ...also]);
    const msgs = out.split('\n').filter((l) => l.trim() && !/^\d+ error\(s\)/.test(l));
    if (/Error|at file:/.test(out) && !msgs.some((l) => /^\S+: /.test(l))) return [`the validator failed: ${out.slice(0, 400)}`];
    return msgs.filter((l) => {
        const head = l.split(': ')[0];
        return (head === 'undefined' || [...mine].some((id) => head.split(/[ /]+/).includes(id))) && !ignore.some((re) => re.test(l));
    });
}
// What a later step settles: the answer key (step 9) and the questions (step 8: an unknown teller's question).
/**
 * Step 9b's shared part: the spec and the whole case as step 9b found it, the same for every scene. Compact (a
 * prompt is mostly its facts): every fact by what it says, when it is told and how it is reasoned (COMPACT_KEEP;
 * the scene's own facts come in full in the scene's part), and the reading without the annotations that only
 * restate the text (RECORD, SET ASIDE).
 */
const COMPACT_KEEP = new Set(['id', 'of', 'attr', 'value', 'to', 'neg', 'para', 'basis', 'truth', 'claim', 'word', 'given_at', 'inferable_at', 'q', 'pick', 'modal']);
const compactFact = (f) => Object.fromEntries(Object.entries(f).filter(([k]) => COMPACT_KEEP.has(k)));
function datesShared(ctx) {
    const base = collect(ctx.name, { step: 9.2, own: false });
    const reading = { ...base, thoughts: base.thoughts.filter((t) => !['RECORD', 'SET ASIDE'].includes(t.tag)) };
    return template('09b-shared', { ...common(ctx, base, null), facts: lines(base.facts.map(compactFact)), reading: readingText(reading), story: numbered(storyOf(ctx.name)) });
}
/** Every message of the validator on the whole case (with `items` added). */
function allProblems(ctx, step, items) {
    const d = collect(ctx.name, { step, extra: items });
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-check-'));
    writeWorld(ctx.name, d, tmp);
    let out;
    try { out = execFileSync('node', [path.join(ROOT, 'scripts/validate-world.js'), tmp, '--quiet'], { encoding: 'utf8' }); } catch (e) { out = `${e.stdout ?? ''}\n${e.stderr ?? e.message}`; }
    fs.rmSync(tmp, { recursive: true, force: true });
    return out.split('\n').filter((l) => l.trim() && !/^\d+ error\(s\)/.test(l));
}
// A label's capitalised words (a day, a place, a name) that the story has not used by `para`: a label running
// ahead of the story, caught without a model. Sentence words and the words of questions are not names.
const NOT_NAMES = new Set('The A An Who What Why Where When How Which Whose Did Does Do Was Were Is Are Has Had Have Will Would Could Should Can Before After Some His Her Its Their In On At Of From To By With That This These Those Into Upon For And Or But Not No Yes Mr Mrs Dr Miss One Two Three First Second Last Next Earlier Later Then Now Once About Around Early Late Morning Evening Night Day Week Story Time Someone Something Nobody Nothing Everyone'.split(' '));
// A word the story has used in any case counts as given ("Race day" once a race is told); once the story has given
// one weekday, the others follow by counting.
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function aheadWords(paras, text, para) {
    const seenText = normalize(paras.slice(1, para + 1).join(' '));
    const has = (w) => new RegExp(`\\b${w}\\b`, 'i').test(seenText);
    const anyDay = WEEKDAYS.some(has);
    const words = String(text).match(/\b[A-Z][a-z]+\b/g) ?? [];
    return [...new Set(words.filter((w) => !NOT_NAMES.has(w) && !has(w) && !(WEEKDAYS.includes(w) && anyDay)))];
}
const labelSteps = (x, from) => (x.labels?.length ? x.labels.map((l) => [l.from, l.label]) : [[from, x.label]]);
function aheadErrors(paras, x, from, what) {
    if (from == null) return [];
    return labelSteps(x, from).flatMap(([at, label]) => { const w = aheadWords(paras, label, Math.max(at, from)); return w.length ? [`${x.id}: the ${what} "${label}" names ${w.join(', ')}, which the story has not given by ¶${Math.max(at, from)}: give it in steps (labels)`] : []; });
}
const LATER = [/true assertions contradict/, /answer/, /truth/, /needs its question/];

const lines = (xs) => (xs.length ? xs.map((x) => JSON.stringify(x)).join('\n') : '(none yet)');
const TAGS = new Set(['RECORD', 'NOTICE', 'ABSENCE', 'QUESTION', 'HYPOTHESIS', 'INFER', 'DEFAULT', 'AGENT', 'PHYSICAL', 'IDENTIFY', 'WEIGH', 'SOURCE', 'TEST', 'RESIDUE', 'PREDICT', 'TEST PLAN', 'GENRE', 'SET ASIDE', 'DROP', 'REVISE']);

export const STEPS = [
    {
        n: 1, name: 'text', script(ctx) {
            const src = fs.readFileSync(path.join(ROOT, ctx.conf.source), 'utf8');
            const paras = paragraphs(src);
            fs.mkdirSync(caseDir(ctx.name), { recursive: true });
            fs.writeFileSync(path.join(caseDir(ctx.name), 'story.txt'), src);
            const report = [`source: ${ctx.conf.source}`, `paragraphs: ${paras.length} (¶0 to ¶${paras.length - 1})`, `¶0: ${paras[0]}`, `¶1: ${paras[1].slice(0, 120)}…`, `last: ${paras.at(-1).slice(0, 120)}…`, `words: ${src.split(/\s+/).filter(Boolean).length}`];
            fs.writeFileSync(path.join(ctx.stepDir, 'report.txt'), report.join('\n') + '\n');
            console.log(report.join('\n'));
        },
    },
    {
        n: 2, name: 'header',
        prompt: (ctx) => template('02-header', { opening: numbered(storyOf(ctx.name), 0, 12) }),
        check: (ctx, s, items) => {
            const h = items[0];
            if (items.length !== 1) return [`expected one line, got ${items.length}`];
            if (!Array.isArray(h.narrators) || !h.narrators.length) return ['no narrators'];
            return h.narrators.flatMap((n) => (!n.id || !/^[a-z_]+$/.test(n.id) ? [`narrator id ${n.id}`] : !['first-person', 'third-person'].includes(n.kind) ? [`narrator kind ${n.kind}`] : []));
        },
    },
    {
        n: 3, name: 'scenes',
        prompt: (ctx) => template('03-scenes', { story: numbered(storyOf(ctx.name)) }),
        check: (ctx, s, items) => {
            const paras = storyOf(ctx.name);
            const errs = [];
            let next = 1;
            items.forEach((x, i) => {
                if (!/^s\d\d$/.test(x.id ?? '')) errs.push(`scene ${i}: id ${x.id} (s01, s02, …)`);
                if (x.from !== next) errs.push(`${x.id}: starts at ¶${x.from}, expected ¶${next}`);
                if (!(x.to >= x.from)) errs.push(`${x.id}: ends at ¶${x.to}, before it starts`);
                next = x.to + 1;
            });
            if (next !== paras.length) errs.push(`the scenes end at ¶${next - 1}; the story's last paragraph is ¶${paras.length - 1}`);
            return errs;
        },
    },
    {
        n: 4, name: 'reading', perScene: true,
        prompt: (ctx, scene) => {
            const i = sceneIndex(ctx.name, scene);
            const d = collect(ctx.name, { step: 4, scene: i });
            return template('04-reading', {
                reading_spec: fs.readFileSync(path.join(PIPE, 'reading-spec.md'), 'utf8'), scene_id: scene.id, scene_title: scene.title, from: scene.from, to: scene.to,
                cards: lines(d.cards), reading: lines(d.thoughts), story: numbered(storyOf(ctx.name), 0, scene.to),
            });
        },
        check: (ctx, scene, items) => {
            const paras = storyOf(ctx.name);
            const d = collect(ctx.name, { step: 4, scene: sceneIndex(ctx.name, scene) });
            const known = new Set([...d.thoughts.map((t) => t.id), ...d.cards.map((c) => c.bk)]);
            const errs = [];
            for (const x of items) if (x.bk) { if (!/^bk\.[a-z0-9_]+$/.test(x.bk) || !x.text) errs.push(`card ${x.bk}: needs bk.<name> and text`); known.add(x.bk); }
            const ids = new Set();
            for (const t of items.filter((x) => !x.bk)) {
                const at = `${t.id ?? '?'}`;
                if (!/^t\d+\.\d+$/.test(t.id ?? '')) errs.push(`${at}: id is t<para>.<n>`);
                else if (Number(t.id.slice(1).split('.')[0]) !== t.para) errs.push(`${at}: its id's paragraph is not its para ${t.para}`);
                if (ids.has(t.id) || d.thoughts.some((o) => o.id === t.id)) errs.push(`${at}: duplicate id`);
                ids.add(t.id);
                if (!(t.para >= scene.from && t.para <= scene.to)) errs.push(`${at}: para ${t.para} is outside this scene (¶${scene.from}–¶${scene.to})`);
                if (!TAGS.has(t.tag)) errs.push(`${at}: tag ${t.tag}`);
                if (!['typical', 'careful', 'expert'].includes(t.profile)) errs.push(`${at}: profile ${t.profile}`);
                if (!['RECORD', 'SET ASIDE'].includes(t.tag) && !['weak', 'fair', 'strong'].includes(t.confidence)) errs.push(`${at}: confidence ${t.confidence}`);
                if (!t.text) errs.push(`${at}: no text`);
                if (t.reads != null && !inPara(paras, t.para, t.reads)) errs.push(`${at}: reads "${String(t.reads).slice(0, 60)}" is not in ¶${t.para}`);
                for (const f of list(t.from)) if (!known.has(f) && !ids.has(f)) errs.push(`${at}: from ${f}: no earlier thought or card`);
                for (const r of list(t.relations)) if (!known.has(r.target) && !ids.has(r.target)) errs.push(`${at}: relation to ${r.target}: no such thought`);
            }
            return errs;
        },
    },
    {
        n: 5, name: 'entities', perScene: true,
        prompt: (ctx, scene) => { const d = seen(ctx, 5, scene); return template('05-entities', { ...common(ctx, d, scene), story: numbered(storyOf(ctx.name), 0, scene.to) }); },
        check: (ctx, scene, items) => {
            const paras = storyOf(ctx.name).map(normalize);
            const d = collect(ctx.name, { step: 5, scene: sceneIndex(ctx.name, scene), extra: items });
            const ids = new Set(d.entities.map((e) => e.id));
            const errs = [];
            const found = (text, from = 0, to = scene.to) => { const t = normalize(text); const re = new RegExp(`(^|[^A-Za-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z0-9]|$)`); return paras.slice(from, Math.min(to, scene.to) + 1).some((p) => re.test(p)); };
            for (const x of items) {
                if (!['entities', 'mentions', 'moves', 'joins'].includes(x.file)) errs.push(`${x.id ?? '?'}: file ${x.file}`);
                if (x.file === 'entities') {
                    if (!/^[a-z][a-z0-9_]*$/.test(x.id ?? '')) errs.push(`${x.id}: an id is snake case`);
                    if (x.within && !ids.has(x.within)) errs.push(`${x.id}: within ${x.within}: no such entity`);
                    if (x.source && !found(x.source)) errs.push(`${x.id}: source "${x.source.slice(0, 50)}" is not in the story so far`);
                }
                if (x.file === 'mentions') {
                    if (!ids.has(x.id)) errs.push(`mentions for ${x.id}: no such entity`);
                    for (const p of list(x.phrases)) {
                        const text = typeof p === 'string' ? p : p.text;
                        if (typeof p !== 'string' && !(Array.isArray(p.paras) && p.paras.length === 2)) errs.push(`${x.id}: phrase "${text}": paras is [from, to]`);
                        else if (!found(text, typeof p === 'string' ? 0 : p.paras[0], typeof p === 'string' ? scene.to : p.paras[1])) errs.push(`${x.id}: phrase "${text}" is not in the story so far${typeof p === 'string' ? '' : ` (¶${p.paras[0]}–¶${p.paras[1]})`}`);
                    }
                }
                if (x.file === 'moves' && !ids.has(x.id)) errs.push(`moves: no entity ${x.id}`);
                if (x.file === 'joins' && (!ids.has(x.door) || !list(x.sides).every((y) => ids.has(y)))) errs.push(`joins ${x.door}: the door and its sides must be entities`);
            }
            for (const e of d.entities) if (e.within && !ids.has(e.within)) errs.push(`${e.id}: within ${e.within}: no such entity`);
            for (const e of items.filter((x) => x.file === 'entities' && !d.mentions[x.id]?.length && !x.source && !d.entities.find((y) => y.id === x.id)?.source && x.kind !== 'state')) errs.push(`${e.id}: no phrase in mentions and no source quote`);
            if (sceneIndex(ctx.name, scene) === 0) for (const n of d.header?.narrators ?? []) if (n.id !== 'narrator' && !ids.has(n.id)) errs.push(`the narrator ${n.id} is not an entity`);
            return errs;
        },
    },
    {
        n: 6, name: 'times', perScene: true,
        prompt: (ctx, scene) => { const d = seen(ctx, 6, scene); return template('06-times', { ...common(ctx, d, scene), entities: d.entities.map((e) => `${e.id}: ${e.name}`).join('\n'), story: numbered(storyOf(ctx.name), 0, scene.to) }); },
        check: (ctx, scene, items) => {
            const paras = storyOf(ctx.name);
            const d = collect(ctx.name, { step: 6, scene: sceneIndex(ctx.name, scene), extra: items });
            const ids = new Set(d.times.map((t) => t.id));
            const errs = [];
            for (const x of items) {
                if (x.file !== 'times') { errs.push(`${x.id}: file ${x.file}`); continue; }
                if (!/^t\.[a-z0-9_]+$/.test(x.id ?? '')) errs.push(`${x.id}: a time id is t.<name>`);
                for (const a of list(x.after)) if (!ids.has(a)) errs.push(`${x.id}: after ${a}: no such time`);
                if (x.quote != null && !inPara(paras, x.para, x.quote)) errs.push(`${x.id}: quote "${String(x.quote).slice(0, 50)}" is not in ¶${x.para}`);
                if (x.para > scene.to) errs.push(`${x.id}: para ${x.para} is beyond this scene`);
                const t = d.times.find((y) => y.id === x.id);
                if (t?.label) errs.push(...aheadErrors(paras, t, t.para ?? scene.from, 'label'));
            }
            // No cycle in `after`.
            const after = new Map(d.times.map((t) => [t.id, list(t.after)]));
            const state = new Map();
            const visit = (id) => { if (state.get(id) === 1) return true; if (state.get(id) === 2) return false; state.set(id, 1); const c = (after.get(id) ?? []).some(visit); state.set(id, 2); return c; };
            for (const t of d.times) if (visit(t.id)) { errs.push(`${t.id}: its after order has a cycle`); break; }
            return errs;
        },
    },
    {
        n: 7, name: 'facts', perScene: true,
        prompt: (ctx, scene) => {
            const d = seen(ctx, 7, scene);
            const n = d.header?.narrators?.[0];
            return template('07-facts', { ...common(ctx, d, scene), narrator_account: n ? `acct.${n.id}` : 'acct.narrator', reading: lines(sceneThoughts(d, scene)), story: numbered(storyOf(ctx.name), 0, scene.to) });
        },
        check: (ctx, scene, items) => {
            const bad = items.filter((x) => !['facts', 'accounts', 'account_add', 'entities', 'times', 'mentions'].includes(x.file)).map((x) => `${x.id ?? '?'}: file ${x.file}`);
            const beyond = items.filter((x) => x.file === 'facts' && x.para > scene.to).map((x) => `${x.id}: para ${x.para} is beyond this scene`);
            return [...bad, ...beyond, ...validated(ctx, 7, scene, items, { ignore: LATER })];
        },
    },
    {
        n: 8, name: 'questions', perScene: true,
        prompt: (ctx, scene) => { const d = seen(ctx, 8, scene); return template('08-questions', { ...common(ctx, d, scene), reading: readingText(d, scene.to), story: numbered(storyOf(ctx.name), 0, scene.to) }); },
        check: (ctx, scene, items) => {
            const bad = items.filter((x) => !['questions', 'possibility', 'patch'].includes(x.file)).map((x) => `${x.id ?? '?'}: file ${x.file}`);
            const early = items.filter((x) => x.file === 'questions' && x.answer != null).map((x) => `${x.id}: no answers yet (answer null)`);
            const paras = storyOf(ctx.name);
            for (const x of items.filter((y) => y.file === 'questions' && y.label)) early.push(...aheadErrors(paras, x, x.raised, 'label'));
            return [...bad, ...early, ...validated(ctx, 8, scene, items, { ignore: [/true assertions contradict/, /an answer needs/, /answer_/] })];
        },
    },
    {
        n: 9.1, name: 'answers', dir: '09a-answers',
        prompt: (ctx) => { const d = seen(ctx, 9.1, null); return template('09a-answers', { ...common(ctx, d, null), reading: readingText(d), story: numbered(storyOf(ctx.name)) }); },
        check: (ctx, scene, items) => {
            const d = seen(ctx, 9.1, null);
            const missing = d.questions.filter((q) => !items.some((x) => x.file === 'patch' && x.id === q.id)).map((q) => `${q.id}: no answer patch`);
            const kinds = items.filter((x) => !['patch', 'possibility'].includes(x.file)).map((x) => `${JSON.stringify(x).slice(0, 80)}: a line here is a patch or a possibility`);
            return [...missing, ...kinds, ...validated(ctx, 9.1, null, items, { ignore: [/true assertions contradict/], also: d.questions.map((q) => q.id) })];
        },
    },
    {
        n: 9.2, name: 'dates', dir: '09b-dates', perScene: true, group: 3,   // three scenes a call (README, "Step 9b's cost")
        // The shared part (the data as step 9b found it, compact: datesShared) and then the scene's own task, with
        // its facts in full. A scene does not see the patches of the scenes before it; 9c reconciles.
        prompt: (ctx, scene) => {
            const base = collect(ctx.name, { step: 9.2, own: false });
            const SCENE_TAGS = new Set(['INFER', 'DEFAULT', 'IDENTIFY', 'HYPOTHESIS']);
            return datesShared(ctx) + '\n\n' + template('09b-scene', { scene_id: scene.id, from: scene.from, to: scene.to, scene_facts: lines(base.facts.filter((f) => f.para >= scene.from && f.para <= scene.to)), scene_reading: lines(sceneThoughts(base, scene).filter((t) => SCENE_TAGS.has(t.tag))) });
        },
        check: (ctx, scene, items) => {
            const all = collect(ctx.name, { step: 9.2 });
            const mineIds = all.facts.filter((f) => f.para >= scene.from && f.para <= scene.to).map((f) => f.id);
            const kinds = items.filter((x) => !['patch', 'facts', 'possibility'].includes(x.file)).map((x) => `${JSON.stringify(x).slice(0, 80)}: a line here is a patch, a fact or a possibility`);
            return [...kinds, ...validated(ctx, 9.2, scene, items, { also: mineIds })];
        },
    },
    {
        // Step 9b in one call for the whole story (an experiment, 2026-11-07): the per-scene prompt's shared part and
        // its task, for every scene's facts at once.
        n: 9.2, name: 'dates-whole', dir: '09b-dates-whole',
        prompt: (ctx) => {
            const all = collect(ctx.name, { step: 9.2, own: false });
            const SCENE_TAGS = new Set(['INFER', 'DEFAULT', 'IDENTIFY', 'HYPOTHESIS']);
            const task = template('09b-scene', { scene_id: 'all', from: 1, to: storyOf(ctx.name).length - 1, scene_facts: '(all the facts above)', scene_reading: '(below)' });
            return datesShared(ctx) + '\n\n' + task + '\n\n' + template('09b-dates-whole', { shared: '', candidates: lines(all.thoughts.filter((t) => SCENE_TAGS.has(t.tag))) }).trim();
        },
        check: (ctx, scene, items) => {
            const kinds = items.filter((x) => !['patch', 'facts', 'possibility'].includes(x.file)).map((x) => `${JSON.stringify(x).slice(0, 80)}: a line here is a patch, a fact or a possibility`);
            return [...kinds, ...allProblems(ctx, 9.2, items)];
        },
    },
    {
        n: 9.3, name: 'consistency', dir: '09c-consistency',
        prompt: (ctx) => {
            const d = seen(ctx, 9.3, null);
            return template('09c-consistency', { ...common(ctx, d, null), story: numbered(storyOf(ctx.name)), problems: allProblems(ctx, 9.3, []).map((e) => `- ${e}`).join('\n') || '(none)' });
        },
        check: (ctx, scene, items) => [...items.filter((x) => !['patch', 'facts', 'possibility'].includes(x.file)).map((x) => `${JSON.stringify(x).slice(0, 80)}: a line here is a patch, a fact or a possibility`), ...allProblems(ctx, 9.3, items)],
    },
    {
        n: 10, name: 'strains',
        prompt: (ctx) => { const d = seen(ctx, 10, null); return template('10-strains', { ...common(ctx, d, null), reading: readingText(d), story: numbered(storyOf(ctx.name)) }); },
        check: (ctx, scene, items) => [...items.filter((x) => x.file !== 'strains').map((x) => `${x.id ?? '?'}: file ${x.file}`), ...validated(ctx, 10, null, items)],
    },
    {
        n: 12, name: 'path',
        prompt: (ctx) => {
            const d = seen(ctx, 12, null);
            const circles = gatedOf(d).map((q) => `${q.id} "${q.label}": ${[q.answer, ...(q.also_right ?? [])].map((v) => `${JSON.stringify(v)} from ¶${earliestCircle(q, v)}`).join(', or ')}; given away at ¶${q.answer_given_at} (circle one before it)`).join('\n') || '(none)';
            // The links "What is this for?" the real page accepts (the route check), each with the first paragraph
            // it was found at, and the intentions a plan check is offered on: the reasoning moves' candidates.
            const routes = routeReport(ctx, 12, []);
            const seenLink = new Map();
            for (const g of routes) for (const l of g.links) { const k = `${l.of}|${l.for}`; if (!seenLink.has(k)) seenLink.set(k, { ...l, at: g.at }); }
            const plans = [...new Set(routes.filter((g) => g.plan).map((g) => g.q))];
            const candidates = [...seenLink.values()].map((l) => `{"do": "c", "of": ${JSON.stringify(l.of)}, "for": ${JSON.stringify(l.for)}} (found at ¶${l.at}; it meets: ${l.need ?? 'the goal'})`).join('\n') || '(none)';
            // Stage 2: the changes, stops and comparisons the page offered at any gated question, each once.
            const J = JSON.stringify, first = (xs) => { const m = new Map(); for (const [k, v] of xs) if (!m.has(k)) m.set(k, v); return [...m.values()]; };
            const onOf = (id) => (/^(hyp|pre):/.test(id) ? `q:${id.slice(4).split('=')[0]}` : id);
            const changes = first(routes.flatMap((g) => (g.allChanges ?? []).map((c) => [`${c.a}|${c.b}`, `{"do": "a", "a": ${J(c.a)}, "b": ${J(c.b)}} (found at ¶${g.at}: ${c.text})`]))).join('\n') || '(none)';
            const stops = first(routes.flatMap((g) => [...(g.allStops ?? []).map((x) => [`s|${x.key}`, `{"do": "stop", "on": ${J(onOf(x.on))}, "key": ${J(x.key)}} (found at ¶${g.at}: ${x.text})`]), ...(g.compares ?? []).map((x) => [`c|${x.key}`, `{"do": "compare", "on": ${J(onOf(x.on))}, "key": ${J(x.key)}} (found at ¶${g.at}; unmet needs ${x.open[0]} against ${x.open[1]}, steps only in each ${x.only[0]} and ${x.only[1]})`]), ...(g.accounts ?? []).map((x) => [`a|${x.key}`, `{"do": "account", "on": ${J(onOf(x.on))}, "key": ${J(x.key)}} (found at ¶${g.at}: does the plan account for ${x.text}? ${x.fits})`])])).join('\n') || '(none)';
            return template('12-path', { ...common(ctx, d, null), strains: lines(d.strains), reading: readingText(d), story: numbered(storyOf(ctx.name)), circles, false_statements: falseOf(d).map((f) => `${f.id} (¶${f.given_at ?? f.para}): ${f.of} ${f.attr} ${JSON.stringify(f.value)}`).join('\n') || '(none)', candidates, plans: plans.join(', ') || '(none)', changes, stops });
        },
        // A right answer's circle at the earliest paragraph the data allows (scripts/path-check.mjs's earliest
        // check); every move in paragraph order, the order given kept within a paragraph.
        normalize: (ctx, scene, items) => {
            const d = seen(ctx, 12, null);
            const qs = new Map(d.questions.map((q) => [q.id, q]));
            const out = items.map((m, i) => {
                const q = qs.get(m.q);
                if (m.do === 'circle' && q && isRightPick(q, m.pick) && Number.isInteger(earliestCircle(q, m.pick))) return { ...m, at: earliestCircle(q, m.pick), _i: i };
                return { ...m, _i: i };
            });
            // A link "What is this for?": at the latest of what it rests on (the circles of the answers it names, the
            // first circle on a question whose action it presupposes, the paragraph that tells a fact), where the
            // page first allows it, unless the model put it later still for a reason of its own (then path-check
            // finds it early and moves it).
            const facts = new Map(d.facts.map((f) => [f.id, f]));
            const restsAt = (id) => {
                const h = /^hyp:(.+?)=(.+)$/.exec(id); if (h) return out.find((x) => x.do === 'circle' && x.q === h[1] && x.pick === h[2])?.at ?? null;
                const pre = /^pre:(.+)$/.exec(id); if (pre) return Math.min(...out.filter((x) => x.do === 'circle' && x.q === pre[1]).map((x) => x.at)) || null;
                const f = facts.get(id); return f ? f.given_at ?? f.para : null;
            };
            // A change, at the later of its two states; a stop or a comparison, at the latest of its two sides.
            const sides = (m) => (m.do === 'c' ? [m.of, m.for] : m.do === 'a' ? [m.a, m.b] : ['stop', 'compare', 'account'].includes(m.do) ? String(m.key ?? '').split('|') : null);
            for (const m of out) { const ss = sides(m); if (!ss) continue; const ats = ss.map(restsAt); if (ats.length === 2 && ats.every((x) => Number.isInteger(x) && Number.isFinite(x))) m.at = Math.max(...ats); }
            // Within a paragraph: the marks and trust first, then the changes and links that rest on them, then the
            // plan checks, then the checks made on a plan.
            const rank = (m) => (['c', 'a'].includes(m.do) ? 1 : m.do === 'plan' ? 2 : ['stop', 'compare', 'account'].includes(m.do) ? 3 : 0);
            return out.sort((a, b) => (a.at - b.at) || (rank(a) - rank(b)) || (a._i - b._i)).map(({ _i, ...m }) => m);
        },
        check: (ctx, scene, items) => {
            const bad = items.filter((x) => x.file !== 'path' || !['circle', 'cross', 'trust', 'c', 'plan', 'a', 'stop', 'compare', 'account'].includes(x.do) || !Number.isInteger(x.at)).map((x) => `${JSON.stringify(x).slice(0, 100)}: a move is circle, cross, trust, c, plan, a, stop, compare or account, with its at`);
            if (bad.length) return bad;
            // An answer with no moves (a call stopped partway) is a failure of its own, not a page to play.
            if (!items.some((x) => x.do === 'circle')) return ['no path was written: write the whole path, every move, in one jsonl block'];
            return playPath(ctx, items);
        },
    },
    {
        // The typed data the reasoning moves need (spec.md, "Typed data"), for the whole story in one call.
        n: 10.2, name: 'typed', dir: '10b-typed',
        prompt: (ctx) => {
            const d = seen(ctx, 10.2, null);
            return template('10b-typed', { ...common(ctx, d, null), reading: readingText(d), story: numbered(storyOf(ctx.name)), generic_actions: genericActionsText() });
        },
        check: (ctx, scene, items) => {
            const kinds = items.filter((x) => !['patch', 'possibility', 'joins', 'actions', 'ramifies'].includes(x.file)).map((x) => `${JSON.stringify(x).slice(0, 80)}: a line here is a patch, a possibility, joins, actions or ramifies`);
            return [...kinds, ...patchShape(items), ...allProblems(ctx, 10.2, items)];
        },
    },
    {
        // The route check (scripts/route-check.mjs on the real page) and its fix: every gated question the moves
        // "What is this for?" and "What would this need?" could reach gets a route, or a reason why the story reaches
        // it another way (a noroute line, kept in the step's items).
        n: 10.3, name: 'routes', dir: '10c-routes',
        prompt: (ctx) => {
            const d = seen(ctx, 10.3, null);
            const missing = routeReport(ctx, 10.3, []).filter((g) => routable(g) && !hasRoute(g));
            const report = missing.map((g) => `${g.q} "${g.label}" (answer ${JSON.stringify(g.answer)}; tried at ¶${g.at}; entry ${JSON.stringify(g.entry)})\n` + (g.misses.length ? g.misses.slice(0, 8).map((m) => `  - ${m.ofText} → for: ${m.forText}: ${m.why}`).join('\n') : `  - no link was tried: ${g.present.map((x) => `${x.id} ${x.on ? 'is' : 'is not'} on the timeline`).join('; ')}`)).join('\n\n') || '(none)';
            return template('10c-routes', { ...common(ctx, d, null), reading: readingText(d), story: numbered(storyOf(ctx.name)), case_actions: lines(d.actions), generic_actions: genericActionsText(), report });
        },
        check: (ctx, scene, items) => {
            const kinds = [...items.filter((x) => !['patch', 'possibility', 'joins', 'actions', 'ramifies', 'noroute'].includes(x.file)).map((x) => `${JSON.stringify(x).slice(0, 80)}: a line here is a patch, a possibility, joins, actions, ramifies or noroute`), ...patchShape(items)];
            const problems = allProblems(ctx, 10.3, items);
            if (kinds.length || problems.length) return [...kinds, ...problems];
            const excused = new Set(items.filter((x) => x.file === 'noroute' && x.why).map((x) => x.q));
            return routeReport(ctx, 10.3, items).filter((g) => routable(g) && !hasRoute(g) && !excused.has(g.q)).map((g) => `${g.q}: still no route (${g.misses[0]?.why ?? 'no link tried'}); add the data, or a noroute line with how the reader reaches it`);
        },
    },
    {
        n: 11, name: 'leak', script(ctx) {
            // The leak check with Opus (the judge) and Haiku (for the comparison): pipeline/leak.mjs.
            for (const m of ['opus', 'haiku']) execFileSync('node', [path.join(PIPE, 'leak.mjs'), path.relative(ROOT, caseDir(ctx.name)), path.relative(ROOT, path.join(PIPE, 'runs', ctx.name, 'leak', m)), '--model', m, '--concurrency', '4'], { cwd: ROOT, stdio: 'inherit' });
            execFileSync('node', [path.join(PIPE, 'leak.mjs'), '--compare', path.join(PIPE, 'runs', ctx.name, 'leak', 'opus'), path.join(PIPE, 'runs', ctx.name, 'leak', 'haiku')], { cwd: ROOT, stdio: 'inherit' });
        },
    },
    {
        n: 11.2, name: 'leakfix', dir: '11b-leakfix',
        prompt: (ctx) => {
            const d = seen(ctx, ctx.step ?? 11.2, null);
            const flagged = leakFlags(ctx);
            const ids = new Set(flagged.map((x) => x.id.split('#')[0].split('=')[0]));
            const dataLines = [...d.times, ...d.entities, ...d.questions, ...d.accounts].filter((x) => ids.has(x.id));
            return template('11b-leakfix', { spec: SPEC(), story: numbered(storyOf(ctx.name)), flagged: flagged.map((x) => `¶${x.para} ${x.kind} ${x.id}: ${x.text} — ${x.why ?? ''}`).join('\n') || '(none)', lines: lines(dataLines) });
        },
        check: (ctx, scene, items) => {
            const paras = storyOf(ctx.name);
            const d = collect(ctx.name, { step: ctx.step ?? 11.2, extra: items });
            const touched = new Set(items.map((x) => x.id ?? x.q));
            const ahead = [...d.times.filter((t) => touched.has(t.id)).flatMap((t) => aheadErrors(paras, t, t.para ?? 1, 'label')), ...d.questions.filter((q) => touched.has(q.id)).flatMap((q) => aheadErrors(paras, q, q.raised, 'label'))];
            const kinds = items.filter((x) => !['patch', 'possibility'].includes(x.file)).map((x) => `${JSON.stringify(x).slice(0, 80)}: a line here is a patch or a possibility`);
            return [...kinds, ...ahead, ...allProblems(ctx, ctx.step ?? 11.2, items)];
        },
    },
];
// A second round of the leak fix, after the leak check has run again (each round sees the rounds before it).
{ const f = STEPS.find((x) => x.name === 'leakfix'); STEPS.push({ ...f, n: 11.3, name: 'leakfix2', dir: '11c-leakfix', prompt: (ctx) => f.prompt({ ...ctx, step: 11.3 }), check: (ctx, scene, items) => f.check({ ...ctx, step: 11.3 }, scene, items) }); }

const genericActionsText = () => Object.entries(GENERIC_ACTIONS).map(([id, a]) => JSON.stringify({ id, ...a })).join('\n');
/** A patch names what it changes by `id`, and what it sets. */
const patchShape = (items) => items.filter((x) => x.file === 'patch' && (!x.id || !x.set)).map((x) => `${JSON.stringify(x).slice(0, 100)}: a patch is {"file": "patch", "id", "set": {...}}`);
/** A gated question the moves "What is this for?" and plan checks could reach: an aim, who did an action, why an action was done. */
const routable = (g) => g.entry?.attr === 'intends' || (g.entry?.of === '?' && g.entry?.act) || g.presupposes;
/** The route check (scripts/route-check.mjs) on a trial case: the case so far with `items`; its report per gated question. */
/** A gated question has a route: a link, a change or a stop that names its answer. */
const hasRoute = (g) => g.links.length + (g.changes?.length ?? 0) + (g.stops?.length ?? 0) > 0;
function routeReport(ctx, step, items) {
    const d = collect(ctx.name, { step, extra: items });
    const trial = path.join(ROOT, 'pipeline', 'runs', ctx.name, 'trial');
    fs.rmSync(trial, { recursive: true, force: true });
    writeWorld(ctx.name, d, trial);
    const json = path.join(os.tmpdir(), `routes-${process.pid}.json`);
    let out;
    try { out = execFileSync('node', [path.join(ROOT, 'scripts/route-check.mjs'), '--json', json], { encoding: 'utf8', env: { ...process.env, CASE: path.relative(ROOT, trial) }, timeout: 900000 }); } catch (e) { out = `${e.stdout ?? ''}`; }
    fs.writeFileSync(path.join(ctx.stepDir, 'route-check.txt'), out);
    const qs = new Map(d.questions.map((q) => [q.id, q]));
    const r = readJson(json, { gated: [] });
    return r.gated.map((g) => ({ ...g, presupposes: qs.get(g.q)?.presupposes }));
}

/** The labels the Opus leak check flagged (runs/<case>/leak/opus). */
function leakFlags(ctx) {
    const dir = path.join(PIPE, 'runs', ctx.name, 'leak', 'opus');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((x) => /^p\d+$/.test(x)).flatMap((x) => readJson(path.join(dir, x, 'items.json'), [])).filter((v) => v.verdict !== 'supported');
}

// The gated questions (the page's commitment gate, ui/world.js GATED) and the earliest paragraph each may be circled.
const gatedOf = (d) => d.questions.filter((q) => q.answer != null && !q.latent && q.raised != null && q.answer_inferable_at != null && q.answer_inferable_at < q.answer_given_at);
const isRightPick = (q, pick) => pick === q.answer || (q.also_right ?? []).includes(pick);
// The earliest paragraph a right pick may be circled (scripts/path-check.mjs's earliest check): raised, the pick
// available, the answer inferable. `pick` defaults to the earliest available of the answer and its also-rights.
const earliestCircle = (q, pick = null) => {
    const right = (q.possibilities ?? []).filter((p) => (pick == null ? isRightPick(q, p.value) : p.value === pick));
    const avail = right.length ? Math.min(...right.map((p) => p.available ?? Infinity)) : Infinity;
    return Math.max(q.raised ?? 0, avail, q.answer_inferable_at ?? 0);
};
// What the answer key makes false: facts with truth false, and claims that assert something false; only those the
// page has a trust control for (a statement's own link on one of its chains: not a narrator's own observation, not a
// claim that asserts nothing), since a trust move on any other cannot be made.
function falseOf(d) {
    const prov = provenance({ ...d, narrators: d.header?.narrators ?? [] });
    const distrustable = (f) => (CLAIM_ATTRS.has(f.attr) ? prov.claimChains(f.id) : prov.factChains(f.id)).some((c) => c.links.some((l) => l.stmt));
    return d.facts.filter((f) => (f.truth === false || list(f.asserts).some((a) => a.truth === false || (a.q && (() => { const q = d.questions.find((x) => x.id === a.q); return q?.answer != null && (isRightPick(q, a.pick) === !!a.neg); })()))) && distrustable(f));
}

/** Play a trial path through the real page (scripts/path-check.mjs, CASE=<trial case>); its failures as messages. */
function playPath(ctx, items) {
    // A move the page allows earlier than its paragraph (the check's FAIL EARLY ¶at → ¶earliest): moved there by
    // script, not by the model, and the path played again (up to eight times: the check finds the earliest among the
    // paragraphs the path stops at, so a move may come down in several steps).
    for (let round = 0; round < 8; round++) {
        const fails = playOnce(ctx, items);
        const early = fails.map((l) => /^FAIL EARLY ¶(\d+) → ¶(\d+) (.*?)(?: \((?:the answer is inferable there|its likely clash \S+ shows there|the page allows it)\))?$/.exec(l)).filter(Boolean);
        if (!early.length || early.length !== fails.filter((l) => l.startsWith('FAIL EARLY')).length) return fails;
        let moved = 0;
        for (const [, from, to, label] of early) {
            const m = items.find((x) => x.at === Number(from) && moveLabel(x) === label.trim());
            if (m) { m.at = Number(to); moved++; }
        }
        if (!moved) return fails;
        items.sort((a, b) => a.at - b.at);
        if (fails.length === early.length) { const again = playOnce(ctx, items); if (!again.length) return again; }
    }
    return playOnce(ctx, items);
}
/** A move as scripts/path-check.mjs names it in its messages. */
const moveLabel = (m) => `${m.do} ${m.q ?? m.of ?? m.a ?? m.key ?? ''}${m.pick ? ' = ' + m.pick : ''}${m.for ? ' → ' + m.for : ''}${m.b ? ' ~ ' + m.b : ''}`;
function playOnce(ctx, items) {
    const d = collect(ctx.name, { step: 12, extra: items });
    const trial = path.join(ROOT, 'pipeline', 'runs', ctx.name, 'trial');
    fs.rmSync(trial, { recursive: true, force: true });
    writeWorld(ctx.name, d, trial);
    let out;
    try { out = execFileSync('node', [path.join(ROOT, 'scripts/path-check.mjs')], { encoding: 'utf8', env: { ...process.env, CASE: path.relative(ROOT, trial) }, timeout: 900000 }); } catch (e) { out = `${e.stdout ?? ''}\n${e.stderr ?? e.message}`; }
    fs.writeFileSync(path.join(ctx.stepDir, 'path-check.txt'), out);
    const fails = out.split('\n').filter((l) => /^FAIL|Error|^\s+at /.test(l)).slice(0, 80);
    return fails;
}
