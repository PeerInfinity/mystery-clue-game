// A case's story written from its typed data (engine/tell.js; docs/authored-stories.md, findings 137 and 139):
//   node scripts/tell-story.mjs <dir>        writes; --check: writes nothing, exits 1 if anything would change
// The case's world/telling.json says only the order: `{title, style?, paragraphs: [[item, ...], ...], files?: {<file
// id>: {title, paragraphs}}}`, an item a fact's id, `{deed: <question>}` (the deed the question asks about, its doer
// unknown), `{raise: <question>}` (its label, as a question), `{implied: <fact>, by: <fact>}` (an entry no sentence
// says, on the timeline by the words of the entry that implies it) or `{day: true}` (the day and its beginning again, from
// `delivery.day`: a case with visits). A fact of an account that is not the narrator's is told as what its witness
// says, in the witness's own first person; the `tells` entry before it is the telling itself. From this and the
// typed entries the script writes the story's text and each file's, and into the data what follows from the text:
// each fact's `para` and `quote` (and a `says` entry's `value`), each time's `para` and `quote` (where it is first
// told), each question's `raised`, `quote`, its answers' `available` and `quote` (where the answer is first named)
// and its give-away, what each observation says (its entries' sentences), and world/mentions.json. Files are
// rewritten one object a line, as they are kept.
// With world/prose.json (scripts/prose-story.mjs) the text and the quotes are that prose's, and the rest as above.
import fs from 'node:fs';
import path from 'node:path';
import { teller, cap, PAST } from '../engine/tell.js';
import { ACTIONS, changePath } from '../engine/actions.js';

const J = JSON.stringify;
const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
/** A data file as it is kept: one object a line under its one key. */
const lines = (key, rows) => `{\n  ${J(key)}: [\n${rows.map((r) => `    ${J(r).replace(/","/g, '", "').replace(/":/g, '": ').replace(/,"/g, ', "')}`).join(',\n')}\n  ]\n}\n`;

export function tell(dir, opts = {}) {
    const W = path.join(dir, 'world'), R = (f) => JSON.parse(fs.readFileSync(path.join(W, f), 'utf8'));
    const header = R('case.json'), telling = R('telling.json');
    const entities = R('entities.json').entities, times = R('times.json').times, facts = R('facts.json').facts, questions = R('questions.json').questions, accounts = R('accounts.json').accounts;
    const actions = fs.existsSync(path.join(W, 'actions.json')) ? R('actions.json').actions : [];
    const byId = (xs) => new Map(xs.map((x) => [x.id, x]));
    const E = byId(entities), T = byId(times), F = byId(facts), Q = byId(questions), A = byId(actions);
    const N = header.narrators[0].id, name = (id) => E.get(id)?.name ?? id;
    const tellerOf = (speaker, listener = null) => teller({ speaker, listener, name, act: (id) => A.get(id), question: (id) => Q.get(id), prefix: (t) => prefix(t), kind: (id) => E.get(id)?.kind, prep: (id) => E.get(id)?.prep, plural: (id) => E.get(id)?.plural, fact: (id) => F.get(id), time: (id) => T.get(id).label, label: (t) => ACTIONS[t]?.label,
        ruled: (x) => facts.some((r) => r.series?.at && r.series.attr === x.attr && (r.series.of ?? r.of) === x.of), deedOf: (t) => questions.find((q) => list(q.entry?.act).includes(t))?.entry });
    const third = tellerOf(null);
    // Several narrators (finding 151): an entry is told in the voice of the narrator whose account holds it, and a
    // line says whose account begins where the voice changes ("Clara Marlow's account."; `account` on a narrator
    // names another word for it, "statement"). Who is "I" is so no part of the telling: it follows from the accounts.
    const NARR = new Map(header.narrators.filter((n) => E.has(n.id)).map((n) => [n.id, n]));
    const originOf = (id) => accounts.find((x) => x.facts.includes(id))?.origin ?? null;
    const speakerOf = (id) => { const o = originOf(id); return o && !NARR.has(o) ? o : null; };
    const heading = (id) => `${name(id)}'s ${NARR.get(id).account ?? 'account'}.`;
    // How a sentence at a time begins: "On Monday, ", "At six o'clock on Sunday, " (`prep` on the time point), a
    // stretch "From … until …, " (a deed: "Between … and …, "); a state that held from before the story has none.
    // A time that is an event (`clause: true`: "the gate lamp was lit") is told "When …", and a stretch from it "From when …".
    const first = times[0]?.id, lab = (id) => T.get(id).label, from = (id) => `${T.get(id).clause ? 'when ' : ''}${lab(id)}`;
    const at = (id) => { const p = T.get(id).prep ?? (T.get(id).clause ? 'When' : 'On'); return p ? `${p} ${lab(id)}` : cap(lab(id)); };
    // A time read by a clock (`time.by`) says so: "At nine o'clock on Thursday by the hall clock, ".
    const prefix = (t, deed = false) => (!t ? '' : t.at ? `${at(t.at)}${t.by ? ` by ${name(t.by)}` : ''}, ` : t.from && t.from !== first && t.to ? (deed ? `Between ${from(t.from)} and ${from(t.to)}, ` : `From ${from(t.from)} until ${lab(t.to)}, `) : t.from && t.from !== first ? `From ${from(t.from)}, ` : '');
    for (const x of times) { delete x.para; delete x.quote; }
    const TOLD = { told: 'told me', letter: 'wrote to me' };   // how a telling was made (`how` on a `tells` entry)
    const sawFrom = (f) => `I saw this from ${name(F.get(f.seen_from).value)}.`;
    const stop = (s) => (s.endsWith('"') ? s : `${s}.`);   // a sentence that ends in someone's words has its stop inside them
    const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
    const units = (n) => `${WORDS[n] ?? n} ${header.delivery?.unit ?? 'hour'}${n === 1 ? '' : 's'}`;
    const drySentence = new Map();   // each fact's sentence as an onlooker would say it, for what an observation says
    const stories = [{ id: 'main', title: telling.title, paragraphs: telling.paragraphs, file: path.join(dir, header.story.replace(/^\.\.\//, '')) },
        ...(header.files ?? []).filter((f) => telling.files?.[f.id]).map((f) => ({ id: f.id, title: telling.files[f.id].title, paragraphs: telling.files[f.id].paragraphs, file: path.join(dir, f.text.replace(/^\.\.\//, '')) }))];
    for (const st of stories) {
        st.paras = []; st.dry = [];
        let cur = null;   // whose voice the story is in
        st.paragraphs.forEach((items, i) => {
            const n = i + 1, ref = st.id === 'main' ? n : `${st.id}:${n}`, out = [], told = [];
            st.dry.push(told);
            let last = null, speech = null, pending = [];
            const timed = (time, deed, lastKey) => {
                const key = time ? J(time) : null, pre = key && key !== lastKey ? prefix(time, deed) : '';
                if (pre) for (const id of [time.at, time.from, time.to].filter((x) => x && x !== first)) { const tp = T.get(id); if (tp.para == null) { tp.para = ref; tp.quote = pre.includes(tp.label) ? tp.label : cap(tp.label); } }   // the label as it stands in the text
                return { key: key ?? lastKey, pre };
            };
            // A word passed on (finding 161): the tellings listed before what is said, outermost first, are speech
            // within speech ('Pike told me: "Marta Quill wrote to me: \'…\'"'), each "me" whoever was told. The last
            // of them must be the telling of whoever's account it is; with none listed, that one "told me".
            const close = () => {
                if (!speech) return;
                const chain = pending.length && pending.at(-1).of === speech.speaker ? pending : [{ of: speech.speaker }];
                const frames = chain.map((t, k) => { const fr = `${name(t.of)} ${TOLD[t.how] ?? 'told me'}`; return k ? fr : cap(fr); });
                const marks = ['"', "'"], body = speech.parts.join(' ');
                out.push(frames.reduceRight((inner, fr, k) => `${fr}: ${marks[k % 2]}${inner}${marks[k % 2]}`, body));
                chain.forEach((t, k) => { if (t.id) t.quote = frames[k]; });
                if (chain === pending) pending = [];
                speech = null;
            };
            const plain = (time, body, key, deed = false) => {
                close();
                const { key: k, pre } = timed(time, deed, last);
                last = k;
                out.push(stop(pre ? pre + body : cap(body)));
                const as = pre ? body : cap(body);   // the words as they stand in the text, for the quote
                told.push({ key, text: out.at(-1), full: stop(prefix(time, deed) ? prefix(time, deed) + body : cap(body)) });
                return as;
            };
            for (const item of items) {
                if (typeof item === 'string') {
                    const f = F.get(item);
                    if (!f) throw new Error(`telling: no fact ${item}`);
                    f.para = ref;
                    const voice = NARR.has(originOf(f.id)) ? originOf(f.id) : cur ?? N;
                    if (NARR.size > 1 && voice !== cur) { close(); out.push(heading(voice)); told.push({ key: `narrator:${voice}`, text: out.at(-1), full: out.at(-1) }); last = null; }
                    cur = voice;
                    if (f.attr === 'tells') { close(); pending.push(f); told.push({ key: f.id, text: cap(`${name(f.of)} ${TOLD[f.how] ?? 'told me'}`), full: `(${name(f.of)} speaks to the narrator here: the statements marked as said by ${name(f.of)} are what is said.)` }); continue; }
                    const who = speakerOf(f.id);
                    drySentence.set(f.id, `${prefix(f.time).replace(/^[A-Z]/, (c) => c.toLowerCase())}${third.sentence(f)}`);
                    if (who) {
                        if (speech?.speaker !== who) { close(); speech = { speaker: who, parts: [], last: null }; }
                        const s = tellerOf(who, cur).sentence(f), { key: k, pre } = timed(f.time, false, speech.last);
                        speech.last = k;
                        speech.parts.push(stop(pre ? pre + s : cap(s)));
                        // What the witness knew it by (`known_by`), said after it, as an onlooker's sentence.
                        if (f.known_by) speech.parts.push(`I knew it by this: ${third.sentence(F.get(f.known_by))}.`);
                        if (f.seen_from) speech.parts.push(sawFrom(f));
                        f.quote = pre ? s : cap(s);
                        told.push({ key: f.id, text: speech.parts.at(-1), full: `${name(who)} told me: "${stop(prefix(f.time) ? prefix(f.time) + s : cap(s))}"` });
                    } else {
                        const s = tellerOf(cur).sentence(f);
                        if (f.attr === 'says') f.value = third.said(f);
                        // What someone knows, where it is an entry (`what`): the page's line is that entry's sentence.
                        if (f.attr === 'rule' && f.series?.at) f.value = third.sentence(f).replace(/^by rule, .*? was (to be )/, '$1');
                        if (f.attr === 'knows' && f.what) f.value = `that ${third.sentence(F.get(f.what))}`;
                        f.quote = plain(f.time, s, f.id);
                        // Where its witness was (`seen_from`), said after it.
                        if (f.seen_from) { out.push(sawFrom(f)); told.at(-1).text += ` ${out.at(-1)}`; told.at(-1).full += ` ${out.at(-1)}`; }
                        // A paper's date is a time told there.
                        if (f.dated && T.get(f.dated).para == null) Object.assign(T.get(f.dated), { para: ref, quote: T.get(f.dated).label });
                    }
                } else if (item.implied) {
                    // What an entry implies and no sentence says (`{implied: <fact>, by: <the entry told>}`: he was at the
                    // table, so he heard): on the timeline where that entry is told, by its words.
                    const f = F.get(item.implied), b = F.get(item.by);
                    if (!f || b?.quote == null) throw new Error(`telling ${ref}: implied ${item.implied} by ${item.by}: the entry it is implied by must be told first`);
                    Object.assign(f, { para: b.para, quote: b.quote });
                    drySentence.set(f.id, `${prefix(f.time).replace(/^[A-Z]/, (c) => c.toLowerCase())}${third.sentence(f)}`);
                } else if (item.deed) { const q = Q.get(item.deed); plain(item.untimed ? null : q.entry.time, tellerOf(cur ?? N).deed(q), `deed:${q.id}`, true); }   // `untimed`: where the deed's time is itself a question
                else if (item.raise) { const q = Q.get(item.raise); close(); q.raised = ref; q.quote = q.label; out.push(q.label); told.push({ key: `raise:${q.id}`, text: q.label, full: q.label }); }
                else if (item.day) { close(); const s = `I have ${units(header.delivery.day)} today, and more to do than they will hold. When they are spent I wake again on this same morning, with the day before me as it was. What I have learned I keep.`; out.push(s); told.push({ key: 'day', text: s, full: s }); }
            }
            close();
            if (pending.length) throw new Error(`telling ${ref}: ${pending[0].id} is a telling with nothing told after it`);
            st.paras.push(out.join(' '));
        });
    }
    const main = stories[0];
    if (opts.dry) return { dry: main.dry, files: Object.fromEntries(stories.slice(1).map((s) => [s.id, { title: s.title, dry: s.dry }])), title: telling.title, style: telling.style ?? null, entities, times, narrator: header.narrators[0] };
    // Prose written from the telling (world/prose.json, by scripts/prose-story.mjs: a model's, kept as it was given):
    // its paragraphs are the story's, and each entry's quote is the words of the prose that state it. The sentences
    // of the templates stay as what the observations say. Every quote must be in its paragraph.
    const prosePath = path.join(W, 'prose.json'), prose = fs.existsSync(prosePath) ? JSON.parse(fs.readFileSync(prosePath, 'utf8')) : null;
    if (prose) {
        for (const st of stories) {
            const written = st.id === 'main' ? prose.paragraphs : prose.files?.[st.id]?.paragraphs;
            if (!written || written.length !== st.paras.length) throw new Error(`prose.json: not the telling's paragraphs (${st.id})`);
            written.forEach((p, i) => {
                st.paras[i] = p.text;
                for (const { key } of st.dry[i]) {
                    if (key === 'day' || key.startsWith('narrator:')) continue;
                    const quote = p.quotes?.[key];
                    if (!quote || !p.text.includes(quote)) throw new Error(`prose.json ${st.id} ¶${i + 1}: no quote of ${key} in its paragraph`);
                    if (key.startsWith('raise:')) Q.get(key.slice(6)).quote = quote;
                    else if (!key.startsWith('deed:')) F.get(key).quote = quote;
                }
            });
        }
        const where = (quote) => { for (const st of stories) { const i = st.paras.findIndex((p) => p.includes(quote)); if (i >= 0) return st.id === 'main' ? i + 1 : `${st.id}:${i + 1}`; } return null; };
        for (const x of times) { delete x.para; delete x.quote; }
        for (const [id, quote] of Object.entries(prose.times ?? {})) { const at = where(quote); if (!at || !T.has(id)) throw new Error(`prose.json: time ${id}: "${quote}" is in no paragraph`); Object.assign(T.get(id), { para: at, quote }); }
    }
    // An answer is available where the story first names it (as an entry's subject, its value or whom it is done
    // to), by the entry that does: in the main story if it names it there, else in the first file that does. The
    // give-away is the entry that asserts the answer.
    const inMain = (f) => typeof f.para === 'number', names = (f, id) => f.of === id || f.value === id || f.to === id || list(f.but).includes(id);
    for (const q of questions) {
        for (const p of q.possibilities) {
            if (p.via === 'always') { p.available = q.raised; continue; }
            // An answer that is no entity and stands in the question's own words ("before the gate lamp was lit") is there when the question is asked.
            if (!E.has(p.value) && q.label.includes(p.value)) { delete p.from; p.available = q.raised; p.quote = p.value; continue; }
            // Yes and no are both offered outright, in the question's own words.
            if (p.value === 'yes' || p.value === 'no') { delete p.from; p.available = q.raised; p.quote = q.quote; continue; }
            // An answer that is a time of an event ("nine o'clock": the shot at that time) is there where an entry tells the event at that time.
            const ev = list(p.asserts).find((x) => x.event && x.time?.at), told = ev && facts.find((f) => f.para != null && f.event === ev.event && f.time?.at === ev.time.at);
            if (told) { delete p.from; p.available = told.para; p.quote = told.quote; continue; }
            const mine = facts.filter((f) => f.para != null && names(f, p.value) && f.attr !== 'tells' && !list(f.asserts).some((x) => x.q));   // not a give-away, this question's or another's
            // (named in the main story only before the question is asked: an answer from when it is asked, before any paper's naming)
            const f = mine.filter((x) => inMain(x) && x.para >= q.raised).sort((a, b) => a.para - b.para)[0] ?? mine.filter((x) => inMain(x))[0] ?? mine[0];
            if (!f) continue;
            delete p.from; delete p.quote;
            if (inMain(f) && f.para < q.raised) { p.available = q.raised; p.from = f.id; } else { p.available = f.para; p.quote = f.quote; }
        }
        const give = facts.find((f) => list(f.asserts).some((x) => x.q === q.id && x.pick === q.answer) && inMain(f));
        if (give) { q.answer_given_at = give.para; q.answer_given_quote = give.quote; }
    }
    // What an observation says is what its entries say (one that comes from a move, a doubt or another question keeps its own words).
    const observations = fs.existsSync(path.join(W, 'observations.json')) ? R('observations.json').observations : null;
    // A reading the reader makes (`{reasoned: "speaks", premises: [the entry with words, what they speak of]}`) says whose words speak of what.
    const saysOf = (x) => (typeof x === 'string' ? (F.get(x)?.words ? drySentence.get(x) : drySentence.get(x)?.replace(/\."$/, '"')) : x?.reasoned === 'speaks' && F.has(x.premises?.[0]) && drySentence.has(x.premises?.[1]) ? (F.get(x.premises[0]).reads_as ? `${prefix(F.get(x.premises[0]).time).replace(/^[A-Z]/, (c) => c.toLowerCase())}${third.sentence({ ...F.get(x.premises[0]).reads_as })}, since ${drySentence.get(x.premises[1])}` : `the words of ${name(F.get(x.premises[0]).of)} speak of this: ${drySentence.get(x.premises[1])}`) : null);
    // A route the reader builds (`{route_through: [things]}`) says what anything that came by it must have been: small
    // enough for a way in it passes (the largest that way lets through), and able to travel by what hangs or reaches.
    const room = fs.existsSync(path.join(W, 'room.json')) ? R('room.json') : null;
    const FIT = { person: (n) => `able to pass ${n}`, small: (n) => `small enough for ${n}`, air: (n) => `no more than air, to pass ${n}` }, SIZES = ['person', 'small', 'air'];
    const routeSays = (nodes) => {
        const parts = nodes.flatMap((n) => {
            const sizes = facts.filter((f) => f.of === n && f.attr === 'passes' && f.para != null).map((f) => f.value).sort((a, b) => SIZES.indexOf(a) - SIZES.indexOf(b));
            if (room?.openings?.[n] && sizes.length) return [FIT[sizes[0]](name(n))];
            return facts.some((f) => f.of === n && (f.attr === 'attached' || f.attr === 'reaches') && f.para != null) ? [`able to travel by ${name(n)}`] : [];
        });
        return parts.length ? `whatever came by this route was ${parts.join(' and ')}` : null;
    };
    // A change the reader points out (`{reasoned: "changed", premises: [two states of one thing]}`) says the two
    // states, the acts that turn the one into the other (the engine's: `changePath`), and what those acts need of
    // whoever did them (a key of the thing, being at it).
    const changeSays = (x) => {
        const [a, b] = x.premises.map((id) => F.get(id));
        if (!a || !b || !drySentence.has(a.id) || !drySentence.has(b.id)) return null;
        const [from, to] = changePath(a.attr, a.value, b.value) ? [a, b] : [b, a], acts = changePath(from.attr, from.value, to.value);
        if (!acts) return null;
        const needs = [...new Set(acts.flatMap((t) => ACTIONS[t].requires).filter((r) => r.of === '$agent').map((r) => (r.key ? `a key of ${name(from.of)}` : r.at ? `being at ${name(from.of)}` : null)).filter(Boolean))];
        return `${drySentence.get(from.id)}; ${drySentence.get(to.id)}: between the two, somebody ${acts.map((t) => PAST[t] ?? A.get(t)?.past).join(' and ')} ${name(from.of)}${needs.length ? `, which needs ${needs.join(' and ')}` : ''}`;
    };
    // A gap the reader points out in a rule's record (`{reasoned: "missing", of: <the rule>, at: <a time>}`) says the
    // rule, and what the record's silence at that time means: the series' state, denied then.
    const gapSays = (x) => {
        const r = F.get(x.of);
        if (!r?.series || !drySentence.has(r.id)) return null;
        const who = r.series.of ?? r.of, when = prefix({ at: x.at }).replace(/^[A-Z]/, (c) => c.toLowerCase()).replace(/, $/, '');
        return `by rule, ${name(who)} was to be ${r.series.value} ${when}; the record has nothing then: ${third.sentence({ of: who, attr: r.series.attr, value: r.series.value, neg: true, time: { at: x.at } })}`;
    };
    const saysAny = (x) => (Array.isArray(x?.route_through) ? routeSays(x.route_through) : x?.reasoned === 'changed' ? changeSays(x) : x?.reasoned === 'missing' ? gapSays(x) : saysOf(x));
    // An observation that holds only under an answer to another question (`if: {q, pick}`) says so first: "taking it
    // that Mr. Martin Grove handed in the telegram …: ".
    const taking = (o) => { const e = o.if && Q.get(o.if.q)?.entry; return e && list(e.act).length && E.has(o.if.pick) ? `taking it that ${third.sentence({ ...e, of: o.if.pick })}: ` : ''; };
    for (const o of observations ?? []) if (o.from.every((x) => saysAny(x) != null)) o.says = taking(o) + o.from.map(saysAny).join('; ');
    // A form of a name the prose used counts as a mention only if it has a word of the name itself: "Abel", "Mrs. Crouch",
    // "Abel's shed"; not "it", "his shed" or "my marrow", which are whoever is being spoken of.
    const named = (e, m) => !/^(my|his|her|its|their|our|your)\b/i.test(m) && m.split(/[^A-Za-z]+/).some((w) => /^[A-Z]/.test(w) && w.length > 2 && e.name.split(/[^A-Za-z]+/).includes(w));
    const files = {
        ...Object.fromEntries(stories.map((st) => [st.file, `${st.title}\n\n${st.paras.join('\n\n')}\n`])),
        [path.join(W, 'facts.json')]: lines('facts', facts),
        [path.join(W, 'times.json')]: lines('times', times),
        [path.join(W, 'questions.json')]: lines('questions', questions),
        ...(observations ? { [path.join(W, 'observations.json')]: lines('observations', observations) } : {}),
        [path.join(W, 'mentions.json')]: `{\n "entities": {\n${entities.map((e) => `  ${J(e.id)}: ${J([...new Set([e.name, ...(prose?.mentions?.[e.id] ?? []).filter((m) => named(e, m))])]).replace(/","/g, '", "')}`).join(',\n')}\n }\n}\n`,
    };
    return files;
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
    const check = process.argv.includes('--check'), dir = process.argv.slice(2).find((a) => !a.startsWith('--'));
    let changed = 0;
    for (const [file, text] of Object.entries(tell(dir))) {
        if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === text) continue;
        changed++;
        if (check) console.log(`would change: ${file}`); else { fs.writeFileSync(file, text); console.log(`written: ${file}`); }
    }
    if (!changed) console.log('nothing to change');
    process.exit(check && changed ? 1 : 0);
}
