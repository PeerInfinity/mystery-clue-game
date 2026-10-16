// Load a case directory into a model. Works in node (fs) and in the browser (fetch).
import { mergeCase, buildModel } from './caseModel.js';
import { Story } from './story.js';

export async function loadCase(base, read = defaultRead) {
    const main = await read(`${base}/case.json`);
    const parts = {};
    for (const p of main.parts ?? []) parts[p] = await read(`${base}/${p}`);
    const data = mergeCase(main, parts);
    if (main.mentions_file) {
        const m = await read(`${base}/${main.mentions_file}`);
        data.mentions = { entities: m.entities, windows: m.windows };
    }
    if (main.thoughts_file) data.thoughts = (await read(`${base}/${main.thoughts_file}`)).thoughts;
    const model = buildModel(data);
    const text = await read(`${base}/${main.case.source.text_file}`, 'text');
    model.story = new Story(text, data);
    return model;
}

async function defaultRead(url, as = 'json') {
    if (typeof window === 'undefined') {
        const fs = await import('node:fs');
        const body = fs.readFileSync(url, 'utf8');
        return as === 'json' ? JSON.parse(body) : body;
    }
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    return as === 'json' ? res.json() : res.text();
}
