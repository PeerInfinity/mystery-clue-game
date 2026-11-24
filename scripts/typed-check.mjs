// What follows from the typed data alone (docs/authored-stories.md, finding 132): each case's answered questions with
// the written rules (world/implications.json) taken away, leaving the rules the engine makes from the typed forms
// (engine/implications.js `tableRules`). Every observation is taken as shown and every other question as solved.
// For each question: whether its answer is concluded, which wrong answers are ruled out and which are not, what
// would follow if the list of answers were closed ("something else" ruled out), and the written rules that carry it
// today. It changes nothing and fails nothing: it is a measure.
//   node scripts/typed-check.mjs [<dir>...]     default: every case under cases/;   -v: every question, not only totals per case
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './case-env.mjs';
import { loadCaseWorld } from './case-rules.mjs';
import { setCaseActions } from '../engine/actions.js';
import { isRight } from '../engine/world.js';
import { tableRules, derive, verdict, LIKELY } from '../engine/implications.js';

/** One case: a row for each answered question. */
export function typedCheck(dir) {
    const R = (f) => JSON.parse(fs.readFileSync(path.join(dir, 'world', f), 'utf8'));
    const has = (f) => fs.existsSync(path.join(dir, 'world', f));
    setCaseActions(has('actions.json') ? R('actions.json') : {});
    const data = loadCaseWorld(dir);
    const observations = has('observations.json') ? R('observations.json').observations : [];
    const written = has('implications.json') ? R('implications.json').implications : [];
    const typed = tableRules(data, observations);
    const obsIds = new Set(observations.map((o) => o.id));
    const got = derive(typed, (id) => obsIds.has(id), () => true);
    return data.questions.filter((q) => q.answer != null).map((q) => {
        const values = q.possibilities.map((p) => p.value);
        const open = q.possibilities.filter((p) => p.via === 'always').map((p) => p.value);   // "something else"
        const v = verdict(q.id, values, got);
        const ruledBy = (x) => got.filter((i) => i.q === q.id && (i.rules_out ?? []).includes(x));
        const wrong = values.filter((x) => !isRight(q, x) && !open.includes(x));
        const ruled = wrong.filter((x) => ruledBy(x).length), left = wrong.filter((x) => !ruledBy(x).length);
        const closed = verdict(q.id, values.filter((x) => !open.includes(x)), got);
        const mine = written.filter((i) => i.q === q.id);
        return {
            q: q.id, label: q.label, typedEntry: !!(q.entry && (q.entry.act || q.entry.attr)), answers: values.length,
            concluded: v.concluded != null && isRight(q, v.concluded) ? v.by : null,
            closed: closed.concluded != null && isRight(q, closed.concluded) ? closed.by : null,
            ruled, likelyOnly: ruled.filter((x) => ruledBy(x).every((i) => i.strength === LIKELY)), left,
            writtenConclude: mine.filter((i) => i.concludes != null).map((i) => i.id), writtenRuleOut: mine.filter((i) => i.rules_out && i.concludes == null).map((i) => i.id),
        };
    });
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
    const args = process.argv.slice(2), verbose = args.includes('-v');
    const mini = path.join(ROOT, 'cases', 'miniatures');
    const dirs = args.filter((a) => a !== '-v').length ? args.filter((a) => a !== '-v') : [...fs.readdirSync(path.join(ROOT, 'cases')).filter((d) => d !== 'miniatures').map((d) => path.join('cases', d)), ...fs.readdirSync(mini).map((d) => path.join('cases', 'miniatures', d))];
    const total = { q: 0, concluded: 0, closed: 0, wrong: 0, ruled: 0, wc: 0, wr: 0 };
    console.log('case                        questions  answer follows  …if the list is closed  wrong answers ruled out  written rules (conclude, rule out)');
    for (const dir of dirs) {
        const rows = typedCheck(path.resolve(ROOT, dir));
        const n = (f) => rows.filter(f).length, sum = (f) => rows.reduce((a, r) => a + f(r), 0);
        const t = { q: rows.length, concluded: n((r) => r.concluded), closed: n((r) => r.closed), wrong: sum((r) => r.ruled.length + r.left.length), ruled: sum((r) => r.ruled.length), wc: sum((r) => r.writtenConclude.length), wr: sum((r) => r.writtenRuleOut.length) };
        for (const k of Object.keys(total)) total[k] += t[k];
        console.log(`${path.basename(dir).padEnd(28)}${String(t.q).padStart(5)}${String(t.concluded).padStart(14)}${String(t.closed).padStart(20)}${`${t.ruled} of ${t.wrong}`.padStart(24)}${`${t.wc}, ${t.wr}`.padStart(20)}`);
        if (verbose) for (const r of rows) console.log(`    ${r.q}: ${r.concluded ? `follows (${r.concluded})` : r.closed ? `follows once the list is closed (${r.closed})` : 'does not follow'}${r.left.length ? `; not ruled out: ${r.left.join(', ')}` : ''}${r.likelyOnly.length ? `; ruled out as likely only: ${r.likelyOnly.join(', ')}` : ''}${r.writtenConclude.length + r.writtenRuleOut.length ? `; written: ${[...r.writtenConclude, ...r.writtenRuleOut].join(', ')}` : ''}`);
    }
    console.log(`${'all'.padEnd(28)}${String(total.q).padStart(5)}${String(total.concluded).padStart(14)}${String(total.closed).padStart(20)}${`${total.ruled} of ${total.wrong}`.padStart(24)}${`${total.wc}, ${total.wr}`.padStart(20)}`);
}
