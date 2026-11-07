#!/usr/bin/env node
// The pipeline's driver: one step of the process in pipeline/README.md, for one case.
//
//   node pipeline/run.mjs <case> <step> [--model opus] [--scene s03] [--from s03] [--dry]
//
// Each model call runs blind (lib.mjs `call`) and is recorded in runs/<case>/NN-<step>/[<scene>/]; what a call
// returns, once checked (up to three repair rounds), is kept as its items.json. The run's assembled case
// (runs/<case>/case/) is rebuilt from every step's items after each step (assemble.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { CASES, PIPE, ROOT, runDir, caseDir, paragraphs, numbered, call, jsonLines, template, SPEC, readJson, costOf, list } from './lib.mjs';
import { assemble, itemsOf, scenesOf, forScene } from './assemble.mjs';
import { STEPS } from './steps.mjs';

const args = process.argv.slice(2);
const opt = (k, d = null) => { const i = args.indexOf(`--${k}`); return i < 0 ? d : args[i + 1]; };
const [name, stepArg] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!name || !stepArg || !CASES[name]) { console.error('usage: run.mjs <case> <step> [--model m] [--scene id] [--from id] [--dry]'); process.exit(2); }
const step = STEPS.find((s) => String(s.n) === stepArg || s.name === stepArg || s.dir?.startsWith(stepArg));
if (!step) { console.error(`no step ${stepArg}`); process.exit(2); }
const dry = args.includes('--dry');
const model = opt('model', step.model ?? 'opus');
const stepDir = path.join(runDir(name), step.dir ?? `${String(step.n).padStart(2, '0')}-${step.name}`);
const MAX_REPAIRS = 3;
/** A line's key: its file and id (a possibility by question and value, a door by itself, a card by its bk). */
const keyOf = (x) => `${x.file ?? ''}|${x.bk ?? (x.file === 'possibility' ? `${x.q}=${x.value}` : x.file === 'joins' ? x.door : x.id)}`;
/** Earlier lines with a repair's lines merged in: a line with the same key replaces, `delete: true` removes, the rest are added. */
function mergeLines(prev, fix) {
    const out = new Map(prev.map((x) => [keyOf(x), x]));
    for (const x of fix) { if (x.delete) out.delete(keyOf(x)); else out.set(keyOf(x), x); }
    return [...out.values()];
}

const ctx = { name, conf: CASES[name], model, dry, stepDir };
fs.mkdirSync(stepDir, { recursive: true });

// The calls of this step: one, or one per scene (from --from, or only --scene).
let units = step.perScene ? scenesOf(name) : [null];
if (opt('scene')) units = units.filter((s) => s?.id === opt('scene'));
if (opt('from')) units = units.slice(units.findIndex((s) => s?.id === opt('from')));

for (const scene of units) {
    const dir = scene ? path.join(stepDir, scene.id) : stepDir;
    if (step.script) { step.script(ctx); continue; }
    const task = step.prompt(ctx, scene);
    let res = await call({ dir, prompt: task, system: template('system', {}), model, dry });
    if (dry) { console.log(`${dir}: prompt written (${task.length} chars)`); continue; }
    let { items, bad } = jsonLines(res.text);
    let errors = [...bad.map((b) => `not a JSON object: ${b.slice(0, 120)}`), ...step.check(ctx, scene, items)];
    // A repair: the whole output again (the small steps), or only the lines that change, merged by key (the data
    // steps, whose outputs are long: asked for everything again, a model shortens it and loses lines).
    const patching = step.n >= 4;
    for (let round = 1; errors.length && round <= MAX_REPAIRS; round++) {
        console.log(`${scene?.id ?? step.name}: ${errors.length} problem(s), repair ${round}`);
        fs.writeFileSync(path.join(dir, `repair${round}.errors.txt`), errors.join('\n') + '\n');
        const previous = patching ? items.map((x) => JSON.stringify(x)).join('\n') : res.text;
        const prompt = template(patching ? 'repair-patch' : 'repair', { errors: errors.slice(0, 80).map((e) => `- ${e}`).join('\n'), previous: patching ? '```jsonl\n' + previous + '\n```' : previous, task });
        res = await call({ dir, prompt, system: template('system', {}), model, tag: `repair${round}` });
        const got = jsonLines(res.text);
        items = patching ? mergeLines(items, got.items) : got.items;
        bad = got.bad;
        errors = [...bad.map((b) => `not a JSON object: ${b.slice(0, 120)}`), ...step.check(ctx, scene, items)];
    }
    if (errors.length) fs.writeFileSync(path.join(dir, 'errors.txt'), errors.join('\n') + '\n');
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
