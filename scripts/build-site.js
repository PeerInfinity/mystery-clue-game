// Collects the files the live game loads into _site/, for GitHub Pages: the page, its stylesheet, the modules
// it imports (followed from ui/app.js), and each case's runtime files. Nothing else is published — not the docs,
// the tests, the reports or the reference material.
//   node scripts/build-site.js [outDir=_site]
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(root, process.argv[2] ?? '_site');
const files = new Set(['index.html']);

// Stylesheets and scripts the page names.
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const [, ref] of html.matchAll(/(?:href|src)="([^"#?:]+)"/g)) files.add(path.normalize(ref));

// ES modules, followed through their relative imports.
const todo = [...files].filter((f) => f.endsWith('.js'));
while (todo.length) {
    const f = todo.pop();
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    for (const [, ref] of src.matchAll(/(?:import|export)\b[^'"]*?from\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
        const dep = path.normalize(path.join(path.dirname(f), ref));
        if (!files.has(dep)) { files.add(dep); todo.push(dep); }
    }
}

// Cases: what loadCase reads.
for (const dir of fs.readdirSync(path.join(root, 'cases'))) {
    const base = path.join('cases', dir);
    const main = JSON.parse(fs.readFileSync(path.join(root, base, 'case.json'), 'utf8'));
    for (const f of ['case.json', ...(main.parts ?? []), main.mentions_file, main.case?.source?.text_file].filter(Boolean)) files.add(path.join(base, f));
}

fs.rmSync(out, { recursive: true, force: true });
for (const f of [...files].sort()) {
    fs.mkdirSync(path.dirname(path.join(out, f)), { recursive: true });
    fs.copyFileSync(path.join(root, f), path.join(out, f));
}
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log(`${files.size} files → ${path.relative(root, out)}/\n${[...files].sort().map((f) => `  ${f}`).join('\n')}`);
