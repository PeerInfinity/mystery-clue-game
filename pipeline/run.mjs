#!/usr/bin/env node
// The pipeline's driver: one step of the process in pipeline/README.md, for one case.
//
//   node pipeline/run.mjs <case> <step> [--model opus] [--scene s03] [--from s03] [--dry] [--recheck]
//
// Each model call runs blind (lib.mjs `call`) and is recorded in runs/<case>/NN-<step>/[<scene>/]; what a call
// returns, once checked (up to three repair rounds), is kept as its items.json. The run's assembled case
// (runs/<case>/case/) is rebuilt from every step's items after each step (assemble.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { CASES, PIPE, ROOT, runDir, caseDir, paragraphs, numbered, call, jsonLines, template, SPEC, readJson, costOf, list } from './lib.mjs';
import { assemble, itemsOf, scenesOf, forScene } from './assemble.mjs';
import { STEPS } from './steps.mjs';
import { MAX_REPAIRS, repairPrompt, afterRepair } from './repair.mjs';

const args = process.argv.slice(2);
const opt = (k, d = null) => { const i = args.indexOf(`--${k}`); return i < 0 ? d : args[i + 1]; };
const [name, stepArg] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!name || !stepArg || !CASES[name]) { console.error('usage: run.mjs <case> <step> [--model m] [--scene id] [--from id] [--dry]'); process.exit(2); }
const step = STEPS.find((s) => String(s.n) === stepArg || s.name === stepArg || s.dir?.startsWith(stepArg));
if (!step) { console.error(`no step ${stepArg}`); process.exit(2); }
const dry = args.includes('--dry');
const model = opt('model', step.model ?? 'opus');
const stepDir = path.join(runDir(name), step.dir ?? `${String(step.n).padStart(2, '0')}-${step.name}`);
// --recheck rewrites a step's recorded output if its check now fails: refuse it on a step that later steps have
// built on (they may have fixed what the check finds, and their record would no longer follow from this one).
if (args.includes('--recheck')) {
    const later = STEPS.filter((s) => s.n > step.n && !s.script).map((s) => path.join(runDir(name), s.dir ?? `${String(s.n).padStart(2, '0')}-${s.name}`)).filter((d) => fs.existsSync(d) && fs.readdirSync(d, { recursive: true }).some((f) => String(f).endsWith('items.json')));
    if (later.length) { console.error(`--recheck: later steps have output (${later.map((d) => path.basename(d)).join(', ')}); recheck only the last step run`); process.exit(2); }
}
const ctx = { name, conf: CASES[name], model, dry, stepDir };
fs.mkdirSync(stepDir, { recursive: true });

// The calls of this step: one, or one per scene (from --from, or only --scene).
let units = step.perScene ? scenesOf(name).map((s, index) => ({ ...s, index })) : [null];
// A step may take scenes in groups (step.group, or --group n): one call for several scenes, its own part their facts.
const group = Number(opt('group', step.group ?? 1));
if (step.perScene && group > 1) {
    const g = [];
    for (let i = 0; i < units.length; i += group) { const xs = units.slice(i, i + group); g.push({ id: xs.length > 1 ? `${xs[0].id}-${xs.at(-1).id}` : xs[0].id, title: xs.map((x) => x.title).join('; '), from: xs[0].from, to: xs.at(-1).to, index: xs.at(-1).index, scenes: xs.map((x) => x.id) }); }
    units = g;
}
if (opt('scene')) units = units.filter((s) => s?.id === opt('scene'));
if (opt('from')) units = units.slice(units.findIndex((s) => s?.id === opt('from')));

for (const scene of units) {
    const dir = scene ? path.join(stepDir, scene.id) : stepDir;
    if (step.script) { step.script(ctx); continue; }
    const task = step.prompt(ctx, scene);
    // --recheck: check the output already recorded again (after a fix to the checks), repairing only if it fails.
    const recheck = args.includes('--recheck') && fs.existsSync(path.join(dir, 'items.json'));
    let res = recheck ? { text: '```jsonl\n' + JSON.parse(fs.readFileSync(path.join(dir, 'items.json'), 'utf8')).map((x) => JSON.stringify(x)).join('\n') + '\n```' } : await call({ dir, prompt: task, system: template('system', {}), model, dry });
    if (dry) { console.log(`${dir}: prompt written (${[].concat(task).join('').length} chars)`); continue; }
    let { items, bad } = jsonLines(res.text);
    if (step.normalize) items = step.normalize(ctx, scene, items);
    let errors = [...bad.map((b) => `not a JSON object: ${b.slice(0, 120)}`), ...step.check(ctx, scene, items)];
    // Repairs (repair.mjs): the whole output again (the small steps), or only the lines that change (the data steps).
    for (let round = 1; errors.length && round <= MAX_REPAIRS; round++) {
        console.log(`${scene?.id ?? step.name}: ${errors.length} problem(s), repair ${round}`);
        fs.writeFileSync(path.join(dir, `repair${round}.errors.txt`), errors.join('\n') + '\n');
        const prompt = repairPrompt(step, { task, items, text: res.text, errors });
        // A rerun or a recheck keeps the earlier records: the first unused tag (repair1, repair1b, repair1c, …).
        let tag = `repair${round}`;
        for (let k = 1; fs.existsSync(path.join(dir, `${tag}.meta.json`)); k++) tag = `repair${round}${String.fromCharCode(97 + k)}`;
        res = await call({ dir, prompt, system: template('system', {}), model, tag });
        ({ items, bad } = afterRepair(step, ctx, scene, items, res.text));
        errors = [...bad.map((b) => `not a JSON object: ${b.slice(0, 120)}`), ...step.check(ctx, scene, items)];
    }
    if (errors.length) fs.writeFileSync(path.join(dir, 'errors.txt'), errors.join('\n') + '\n');
    else fs.rmSync(path.join(dir, 'errors.txt'), { force: true });
    fs.writeFileSync(path.join(dir, 'items.json'), JSON.stringify(items, null, 0).replace(/\},\{/g, '},\n{') + '\n');
    assemble(name);
    const c = costOf(dir);
    console.log(`${scene?.id ?? step.name}: ${items.length} item(s), ${errors.length} problem(s) left; $${c.usd} in ${c.calls} call(s)`);
}
if (!dry) {
    assemble(name);
    const c = costOf(stepDir);
    console.log(`step ${step.n} ${step.name}: $${c.usd} in ${c.calls} call(s); run so far $${costOf(runDir(name)).usd}`);
}
