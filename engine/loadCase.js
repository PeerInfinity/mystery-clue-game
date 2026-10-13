// Load a case directory into a model. Works in node (fs) and in the browser (fetch).
import { mergeCase, buildModel } from './caseModel.js';

export async function loadCase(base, read = defaultRead) {
    const main = await read(`${base}/case.json`);
    const parts = {};
    for (const p of main.parts ?? []) parts[p] = await read(`${base}/${p}`);
    return buildModel(mergeCase(main, parts));
}

async function defaultRead(url) {
    if (typeof window === 'undefined') {
        const fs = await import('node:fs');
        return JSON.parse(fs.readFileSync(url, 'utf8'));
    }
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    return res.json();
}
