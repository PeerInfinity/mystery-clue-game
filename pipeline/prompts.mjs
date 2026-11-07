#!/usr/bin/env node
// Rebuild a run's prompts (prompt.md and the repairs' repairN.prompt.md, which are not committed) from what is: the
// steps' templates and code, the earlier steps' items, the recorded responses and the checks' messages
// (repairN.errors.txt). Each rebuilt prompt is checked against the SHA-256 its call recorded (meta.json
// `prompt_sha256`, from 2026-11-07), or else against a prompt.md already there (the first runs committed theirs).
//
//   node pipeline/prompts.mjs <case> [step] [--write]
//
// Without --write it only reports; with it, it writes each rebuilt prompt where none is (prompt.md is gitignored).
// A prompt rebuilt at a later commit can differ from the one sent when the code or an earlier step changed since:
// check out the commit of the run (git log -- pipeline/runs/<case>/<step>) to rebuild it exactly.
import fs from 'node:fs';
import path from 'node:path';
import { CASES, runDir, caseDir, template, jsonLines, readJson, promptRecord, sha256 } from './lib.mjs';
import { scenesOf } from './assemble.mjs';
import { STEPS } from './steps.mjs';
import { MAX_REPAIRS, repairPrompt, afterRepair } from './repair.mjs';
import { leakPrompts, SYSTEM as LEAK_SYSTEM } from './leak.mjs';

const args = process.argv.slice(2);
const [name, only] = args.filter((a) => !a.startsWith('--'));
const write = args.includes('--write');
if (!CASES[name]) { console.error('usage: prompts.mjs <case> [step] [--write]'); process.exit(2); }

const tally = { same: 0, differs: 0, unchecked: 0, written: 0 };
const firstDiff = (a, b) => { const A = a.split('\n'), B = b.split('\n'); const i = A.findIndex((l, k) => l !== B[k]); return i < 0 ? Math.min(A.length, B.length) + 1 : i + 1; };
/** Check one rebuilt prompt against its call's record; write it if asked and none is there. */
function verify(dir, tag, record) {
    const base = tag ? `${tag}.` : '';
    const meta = readJson(path.join(dir, `${base}meta.json`));
    const file = path.join(dir, `${base}prompt.md`);
    const where = `${path.relative(runDir(name), dir) || '.'}/${base}prompt.md`;
    let verdict;
    if (meta?.prompt_sha256) verdict = meta.prompt_sha256 === sha256(record) ? 'same' : 'differs';
    else if (fs.existsSync(file)) { const old = fs.readFileSync(file, 'utf8'); verdict = old === record ? 'same' : 'differs'; if (verdict === 'differs') console.log(`  ${where}: differs from the recorded prompt from line ${firstDiff(old, record)}`); }
    else verdict = 'unchecked';
    tally[verdict]++;
    if (verdict === 'differs' && meta?.prompt_sha256) console.log(`  ${where}: differs from its recorded hash`);
    if (write && !fs.existsSync(file)) { fs.writeFileSync(file, record); tally.written++; }
    return verdict;
}

const system = template('system', {});
for (const step of STEPS.filter((s) => !s.script && (!only || s.name === only || String(s.n) === only))) {
    const stepDir = path.join(runDir(name), step.dir ?? `${String(step.n).padStart(2, '0')}-${step.name}`);
    if (!fs.existsSync(stepDir)) continue;
    const ctx = { name, conf: CASES[name], model: 'opus', dry: true, stepDir };
    const before = { ...tally };
    for (const scene of step.perScene ? scenesOf(name) : [null]) {
        const dir = scene ? path.join(stepDir, scene.id) : stepDir;
        if (!fs.existsSync(path.join(dir, 'meta.json')) && !fs.existsSync(path.join(dir, 'prompt.md'))) continue;
        const task = step.prompt(ctx, scene);
        verify(dir, '', promptRecord(system, task));
        // The repairs, in order: each from the items before it and the messages recorded for it.
        const first = fs.existsSync(path.join(dir, 'response.md')) ? fs.readFileSync(path.join(dir, 'response.md'), 'utf8') : null;
        if (first == null) continue;
        let items = jsonLines(first).items;
        if (step.normalize) items = step.normalize(ctx, scene, items);
        let text = first;
        for (let round = 1; round <= MAX_REPAIRS; round++) {
            const tag = `repair${round}`;
            if (!fs.existsSync(path.join(dir, `${tag}.errors.txt`)) || !fs.existsSync(path.join(dir, `${tag}.response.md`))) break;
            const errors = fs.readFileSync(path.join(dir, `${tag}.errors.txt`), 'utf8').split('\n').filter(Boolean);
            verify(dir, tag, promptRecord(system, repairPrompt(step, { task, items, text, errors })));
            text = fs.readFileSync(path.join(dir, `${tag}.response.md`), 'utf8');
            ({ items } = afterRepair(step, ctx, scene, items, text));
        }
    }
    const d = (k) => tally[k] - before[k];
    console.log(`${path.basename(stepDir)}: ${d('same')} the same, ${d('differs')} different, ${d('unchecked')} with nothing to check against${write ? `; ${d('written')} written` : ''}`);
}
// The leak check's prompts, one per paragraph (runs/<case>/leak/<model>/pNNN), for the run's own case.
if (!only || only === 'leak') {
    const leakDir = path.join(runDir(name), 'leak');
    const prompts = fs.existsSync(path.join(caseDir(name), 'world', 'case.json')) ? leakPrompts(caseDir(name)) : new Map();
    for (const model of fs.existsSync(leakDir) ? fs.readdirSync(leakDir).filter((m) => ['opus', 'haiku'].includes(m)) : []) {
        const before = { ...tally };
        for (const p of fs.readdirSync(path.join(leakDir, model)).filter((x) => /^p\d+$/.test(x))) {
            const prompt = prompts.get(Number(p.slice(1)));
            if (prompt) verify(path.join(leakDir, model, p), '', promptRecord(LEAK_SYSTEM, prompt));
        }
        const d = (k) => tally[k] - before[k];
        console.log(`leak/${model}: ${d('same')} the same, ${d('differs')} different, ${d('unchecked')} with nothing to check against${write ? `; ${d('written')} written` : ''}`);
    }
}
console.log(`in all: ${tally.same} the same, ${tally.differs} different, ${tally.unchecked} unchecked${write ? `, ${tally.written} written` : ''}`);
