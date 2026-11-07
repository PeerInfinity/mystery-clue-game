// The pipeline's shared parts: the blind model call and its record, the run's assembled case, the story as
// numbered paragraphs, one-object-per-line JSON. See pipeline/README.md.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const PIPE = path.join(ROOT, 'pipeline');
export const CASES = JSON.parse(fs.readFileSync(path.join(PIPE, 'cases.json'), 'utf8'));
export const runDir = (name) => path.join(PIPE, 'runs', name);
export const caseDir = (name) => path.join(runDir(name), 'case');
export const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

/** The story's paragraphs as engine/story.js splits them (¶0 the title). */
export const paragraphs = (text) => text.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
/** Paragraphs `from`..`to` (inclusive) as "¶N text" lines. */
export const numbered = (paras, from = 0, to = paras.length - 1) => paras.slice(from, to + 1).map((p, i) => `¶${from + i} ${p}`).join('\n\n');

/** Write a file whole or not at all (a temporary file renamed), so a process reading it never sees half of it. */
export function writeAtomic(file, text) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, text);
    fs.renameSync(tmp, file);
}
/** One JSON object per line inside its list: `{description?, …extra, [key]: [...] }`. */
export function writeLines(file, key, items, extra = {}) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const head = Object.entries(extra).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},\n`).join('');
    const body = items.map((x) => `    ${JSON.stringify(x)}`).join(',\n');
    writeAtomic(file, `{\n${head}  ${JSON.stringify(key)}: [\n${body}${items.length ? '\n' : ''}  ]\n}\n`);
}
export const readJson = (file, fallback = null) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback);

/** The JSON lines of a response: every line of its ```jsonl (or ```json) blocks that parses as an object. */
export function jsonLines(text) {
    const out = [], bad = [];
    for (const m of text.matchAll(/```(?:jsonl|json)?\s*\n([\s\S]*?)```/g)) {
        for (const raw of m[1].split('\n')) {
            const line = raw.trim().replace(/,$/, '');
            if (!line || line.startsWith('//')) continue;
            try { const o = JSON.parse(line); if (o && typeof o === 'object' && !Array.isArray(o)) out.push(o); else bad.push(line); } catch { bad.push(line); }
        }
    }
    return { items: out, bad };
}

/**
 * One blind call: `claude -p` from a fresh empty directory, no tools, no settings, memory or MCP servers, its own
 * system prompt. Records prompt.md, response.md and meta.json (model, tokens, cost, time) in `dir`; returns the text.
 * `dry`: write the prompt only.
 */
export async function call({ dir, prompt, system, model = 'opus', dry = false, tag = '' }) {
    fs.mkdirSync(dir, { recursive: true });
    // A dry run writes dry.prompt.md: it must never overwrite the record of a prompt as sent.
    const base = dry ? 'dry.' : tag ? `${tag}.` : '';
    fs.writeFileSync(path.join(dir, `${base}prompt.md`), `<!-- system -->\n${system}\n\n<!-- user -->\n${prompt}\n`);
    if (dry) return null;
    // A fixed empty directory: the working directory is in the model's environment block, so a fresh random one per
    // call would make every prompt's prefix differ and defeat prompt caching. It is never emptied (calls run at once
    // share it); with no tools, a call can neither read nor write it.
    const blind = path.join(os.tmpdir(), 'pipeline-blind');
    fs.mkdirSync(blind, { recursive: true });
    const args = ['-p', '--model', model, '--tools', '', '--strict-mcp-config', '--setting-sources', '', '--no-session-persistence', '--system-prompt', system, '--output-format', 'json'];
    const started = Date.now();
    const out = await new Promise((resolve, reject) => {
        const child = spawn('claude', args, { cwd: blind, stdio: ['pipe', 'pipe', 'pipe'] });
        let so = '', se = '';
        child.stdout.on('data', (d) => { so += d; });
        child.stderr.on('data', (d) => { se += d; });
        child.on('error', reject);
        child.on('close', (code) => (so.trim().startsWith('{') ? resolve(so) : reject(new Error(`claude exited ${code}: ${se.slice(0, 500)} ${so.slice(0, 500)}`))));
        child.stdin.end(prompt);
    });
    const r = JSON.parse(out);
    const text = r.result ?? '';
    fs.writeFileSync(path.join(dir, `${base}response.md`), text);
    const meta = {
        model: Object.keys(r.modelUsage ?? {})[0] ?? model, cost_usd: r.total_cost_usd, duration_s: Math.round((Date.now() - started) / 1000),
        input_tokens: (r.usage?.input_tokens ?? 0) + (r.usage?.cache_creation_input_tokens ?? 0) + (r.usage?.cache_read_input_tokens ?? 0),
        cache_read_tokens: r.usage?.cache_read_input_tokens, cache_write_tokens: r.usage?.cache_creation_input_tokens,
        output_tokens: r.usage?.output_tokens, stop_reason: r.stop_reason, error: r.is_error ? text.slice(0, 400) : undefined, date: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(dir, `${base}meta.json`), JSON.stringify(meta, null, 2) + '\n');
    if (r.is_error) throw new Error(`model error: ${text.slice(0, 300)}`);
    return { text, meta };
}

/** The total cost of a run's records under `dir`. */
export function costOf(dir) {
    let usd = 0, calls = 0;
    const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (f.name.endsWith('meta.json')) { usd += JSON.parse(fs.readFileSync(p, 'utf8')).cost_usd ?? 0; calls++; } } };
    if (fs.existsSync(dir)) walk(dir);
    return { usd: Math.round(usd * 100) / 100, calls };
}

/** A prompt template from pipeline/steps/<name>.md, its {{keys}} filled. */
export function template(name, vars) {
    const t = fs.readFileSync(path.join(PIPE, 'steps', `${name}.md`), 'utf8');
    return t.replace(/\{\{(\w+)\}\}/g, (m, k) => { if (!(k in vars)) throw new Error(`template ${name}: no ${k}`); return vars[k]; });
}
export const SPEC = () => fs.readFileSync(path.join(PIPE, 'spec.md'), 'utf8');
