// Collects the files the live site loads into _site/, for GitHub Pages: the pages (Watson's timeline at the root, with
// its guide and the old address world.html; the first game in v1/, with its guide, the logic viewer and its own copy
// of everything it loads), their
// stylesheets, the modules they import (followed), and each case's runtime files. Nothing else is published — not the docs,
// the tests, the reports or the reference material.
//   node scripts/build-site.js [outDir=_site]
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(root, process.argv[2] ?? '_site');
const PAGES = ['index.html', 'guide.html', 'world.html', 'v1/index.html', 'v1/logic.html', 'v1/guide.html'];
const files = new Set(PAGES);
// Every reference to a page file carries the build's version (?v=<commit>), so a browser that caches files for a
// while (GitHub Pages allows 10 minutes) never pairs a new page with an old stylesheet or module.
const version = (process.env.GITHUB_SHA ?? execSync('git rev-parse HEAD', { cwd: root }).toString()).trim().slice(0, 10);
const stamp = (ref) => `${ref}?v=${version}`;

// Stylesheets, scripts and pages the page names, from its own directory (or its <base>, if it has one); a directory
// (./, v1/) is a page already listed.
for (const page of PAGES) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const from = path.join(path.dirname(page), html.match(/<base href="([^"]+)"/)?.[1] ?? '.');
    for (const [, ref] of html.matchAll(/(?:href|src)="([^"#?:]+)"/g)) if (!ref.endsWith('/')) files.add(path.normalize(path.join(from, ref)));
}

// ES modules, followed through their relative imports, and stylesheets through their url()s (the notes' font).
const todo = [...files].filter((f) => f.endsWith('.js') || f.endsWith('.css'));
while (todo.length) {
    const f = todo.pop();
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    // `import … from './x.js'`, a module loaded when needed: `import('./x.js')`, and a worker's module:
    // `new URL('./x.js', import.meta.url)`; in a stylesheet, `url(fonts/x.woff2)`.
    const refs = f.endsWith('.css')
        ? [...src.matchAll(/url\(\s*['"]?([^'"()#?:]+)['"]?\s*\)/g)]
        : [...src.matchAll(/(?:(?:import|export)\b[^'"]*?from\s*|import\(\s*|new URL\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g)];
    for (const [, ref] of refs) {
        const dep = path.normalize(path.join(path.dirname(f), ref));
        if (!files.has(dep)) { files.add(dep); if (/\.(js|css)$/.test(dep)) todo.push(dep); }
    }
}

// Cases. Watson's timeline's (cases/<case>/, and the mechanic miniatures, cases/miniatures/<case>/): world/*.json and the story its case.json names. The earlier game's
// (v1/cases/<case>/): what loadCase reads, the action tables the autoplay plays (v1/ui/autoplay.js: the reader's and
// the minimal one), the hints' data and incremental mode's waits (without them the page offers no Hint button and no
// incremental pace).
for (const dir of [...fs.readdirSync(path.join(root, 'cases')), ...fs.readdirSync(path.join(root, 'cases', 'miniatures')).map((d) => path.join('miniatures', d))]) {
    const world = path.join('cases', dir, 'world');
    if (!fs.existsSync(path.join(root, world, 'case.json'))) continue;
    const header = JSON.parse(fs.readFileSync(path.join(root, world, 'case.json'), 'utf8'));
    for (const f of fs.readdirSync(path.join(root, world))) if (f.endsWith('.json')) files.add(path.join(world, f));
    files.add(path.normalize(path.join(world, header.story)));
}
for (const dir of fs.readdirSync(path.join(root, 'v1', 'cases'))) {
    const base = path.join('v1', 'cases', dir);
    const main = JSON.parse(fs.readFileSync(path.join(root, base, 'case.json'), 'utf8'));
    for (const f of ['case.json', ...(main.parts ?? []), main.mentions_file, main.thoughts_file, main.case?.source?.text_file].filter(Boolean)) files.add(path.join(base, f));
    for (const f of ['action-table.json', 'action-table-minimal.json', 'hints.json', 'incremental.json']) if (fs.existsSync(path.join(root, base, f))) files.add(path.join(base, f));
}

fs.rmSync(out, { recursive: true, force: true });
for (const f of [...files].sort()) {
    fs.mkdirSync(path.dirname(path.join(out, f)), { recursive: true });
    if (f.endsWith('.html')) {
        const text = fs.readFileSync(path.join(root, f), 'utf8').replace(/((?:href|src)=")([^"#?:]+\.(?:css|js))"/g, (m, a, ref) => `${a}${stamp(ref)}"`);
        fs.writeFileSync(path.join(out, f), text);
    } else if (f.endsWith('.js')) {
        const text = fs.readFileSync(path.join(root, f), 'utf8').replace(/((?:(?:import|export)\b[^'"]*?from\s*|import\(\s*|new URL\(\s*)['"])(\.{1,2}\/[^'"?]+)(['"])/g, (m, a, ref, b) => `${a}${stamp(ref)}${b}`);
        fs.writeFileSync(path.join(out, f), text);
    } else fs.copyFileSync(path.join(root, f), path.join(out, f));
}
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log(`${files.size} files → ${path.relative(root, out)}/ (version ${version})\n${[...files].sort().map((f) => `  ${f}`).join('\n')}`);
