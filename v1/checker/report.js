#!/usr/bin/env node
// Turns a --all checker run into a report: every flagged piece in story order, with the facts the checker found
// unsupported and how many of the answers flagged it.
//   node checker/report.js [.cache/checker-all-haiku.json] > .cache/checker-report.md
import fs from 'node:fs';

const file = process.argv[2] ?? '.cache/checker-all-haiku.json';
const results = JSON.parse(fs.readFileSync(file, 'utf8'));
const flagged = results.filter((r) => r.votes?.includes('leak')).sort((a, b) => a.item.para - b.item.para || a.item.id.localeCompare(b.item.id));
const errors = results.filter((r) => r.votes?.every((v) => v === 'error'));
const cost = results.reduce((a, r) => a + (r.cost ?? 0), 0);
const byKind = {};
for (const r of results) {
    const k = (byKind[r.item.kind] ??= { all: 0, flagged: 0 });
    k.all++;
    if (r.votes?.includes('leak')) k.flagged++;
}
const out = [];
out.push(`# Card checker report`, '', `${results.length} pieces; ${flagged.length} flagged (${flagged.filter((r) => r.votes.every((v) => v === 'leak')).length} by every answer); ${errors.length} unanswered. Cost of this run: $${cost.toFixed(2)}.`, '');
out.push('| kind | pieces | flagged |', '|---|---|---|');
for (const [k, v] of Object.entries(byKind)) out.push(`| ${k} | ${v.all} | ${v.flagged} |`);
out.push('');
for (const r of flagged) {
    out.push(`## ¶${r.item.para} · \`${r.item.id}\` · ${r.item.kind} · ${r.votes.filter((v) => v === 'leak').length}/${r.votes.length}`, '', `> ${r.item.text}`, '');
    for (const f of r.answer?.facts ?? []) if (!f.supported) out.push(`- **${f.fact}** — ${f.evidence}`);
    out.push('');
}
if (errors.length) out.push('## Unanswered', '', ...errors.map((r) => `- \`${r.item.id}\`: ${r.error}`));
console.log(out.join('\n'));
