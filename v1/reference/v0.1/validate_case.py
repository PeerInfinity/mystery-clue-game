"""Validate a mystery case file and write a human-readable report next to it.

Checks, beyond the JSON Schema:
  * every id is unique and every reference resolves to the right collection
  * every source quote occurs in the story text (whitespace / quote-style normalised)
  * mechanics.json connection rules: which node kinds may fill which premise role,
    what may be a conclusion, which kinds a relation may join
  * the inference graph is acyclic; every reasoning node is some inference's conclusion
  * fabula order agrees with the day numbers
  * the investigation is playable in `order`: each action's required nodes, actions and
    items were acquired by that actor's side by an earlier action
  * each node's discovery actions really yield it

Writes <case>.report.md: timelines, the investigation, a fair-play audit per question,
and Mermaid diagrams of the clue graph and the action graph.

Usage (from the experiment root):
  ../../../.venv/bin/python -I scripts/validate_case.py cases/silver-blaze.json
Exit 1 when any check fails.
"""
import bisect, json, re, sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
case_path = Path(sys.argv[1]).resolve()
case = json.loads(case_path.read_text(encoding="utf-8"))
schema = json.loads((ROOT / "schema/mystery-case.schema.json").read_text(encoding="utf-8"))
mech = json.loads((ROOT / "schema/mechanics.json").read_text(encoding="utf-8"))

errors, warnings = [], []
err = errors.append
warn = warnings.append

# ---------------------------------------------------------------- JSON Schema
try:
    import jsonschema
    v = jsonschema.Draft202012Validator(schema)
    for e in sorted(v.iter_errors(case), key=lambda e: list(e.path)):
        err(f"schema: {'/'.join(map(str, e.path))}: {e.message}")
except ImportError:
    warn("jsonschema not installed: schema check skipped (use the repo .venv)")

# ---------------------------------------------------------------- id tables
C = case["case"]
tables = {
    "entity": {e["id"]: e for e in case["entities"]},
    "scene": {s["id"]: s for s in case["scenes"]},
    "event": {e["id"]: e for e in case["events"]},
    "node": {n["id"]: n for n in case["nodes"]},
    "inference": {i["id"]: i for i in case["inferences"]},
    "action": {a["id"]: a for a in case["actions"]},
    "question": {q["id"]: q for q in case["questions"]},
}
seen = defaultdict(list)
for kind, t in tables.items():
    for k in t:
        seen[k].append(kind)
for k, kinds in seen.items():
    if len(kinds) > 1:
        err(f"id {k!r} used by {kinds}")
for kind, coll in [("entity", "entities"), ("scene", "scenes"), ("event", "events"), ("node", "nodes"),
                   ("inference", "inferences"), ("action", "actions"), ("question", "questions")]:
    if len(tables[kind]) != len(case[coll]):
        err(f"duplicate id inside {coll}")

def ref(kind, value, where):
    if value is None:
        return
    if value not in tables[kind]:
        err(f"{where}: unknown {kind} {value!r}")

E, S, EV, N, A = "entity", "scene", "event", "node", "action"
for p in C["protagonists"]: ref(E, p, "case.protagonists")
ref(E, C.get("narrator"), "case.narrator")
ref(S, C.get("challenge_scene"), "case.challenge_scene")
for it in C.get("starting_items", []): ref(E, it, "case.starting_items")
for e in case["entities"]:
    ref(E, e.get("located_at"), f"entity {e['id']}.located_at")
for s in case["scenes"]:
    ref(E, s["location"], f"scene {s['id']}.location")
for e in case["events"]:
    w = f"event {e['id']}"
    for p in e["participants"]: ref(E, p, w)
    ref(E, e.get("location"), w); ref(S, e.get("first_told_in"), w); ref(S, e.get("truth_revealed_in"), w)
for n in case["nodes"]:
    w = f"node {n['id']}"
    for x in n.get("about_events", []): ref(EV, x, w)
    for x in n.get("entities", []): ref(E, x, w)
    t = n.get("testimony")
    if t: ref(E, t["speaker"], w); ref(E, t.get("reported_by"), w)
    if n["kind"] == "testimony" and not t: err(f"{w}: testimony without a speaker")
    d = n.get("discovery", {})
    ref(A, d.get("first_by_action"), w); ref(A, d.get("protagonists_by_action"), w)
    ref(S, n["reader_learns_in"], w); ref(S, n.get("significance_explained_in"), w)
for i in case["inferences"]:
    w = f"inference {i['id']}"
    ref(N, i["conclusion"], w); ref(E, i.get("reasoner"), w); ref(S, i.get("explained_in"), w)
    for p in i["premises"]: ref(N, p["node"], w)
for r in case.get("relations", []):
    ref(N, r["from"], f"relation {r['type']}"); ref(N, r["to"], f"relation {r['type']}")
for a in case["actions"]:
    w = f"action {a['id']}"
    ref(E, a["actor"], w); ref(E, a.get("location"), w); ref(E, a.get("target"), w)
    for x in a.get("with", []): ref(E, x, w)
    ref(S, a.get("during_scene"), w); ref(S, a.get("narrated_in"), w)
    rq, yl = a["requires"], a["yields"]
    for x in rq.get("nodes", []): ref(N, x, w)
    for x in rq.get("actions", []): ref(A, x, w)
    for x in rq.get("items", []) + rq.get("access", []): ref(E, x, w)
    for x in yl.get("nodes", []): ref(N, x, w)
    for x in yl.get("items", []): ref(E, x, w)
    for x in yl.get("events", []): ref(EV, x, w)
for q in case["questions"]:
    for x in q["answered_by"]: ref(N, x, f"question {q['id']}")
    for f in q.get("false_answers", []):
        ref(N, f.get("node"), f"question {q['id']}")
        for h in f.get("held_by", []): ref(E, h, f"question {q['id']}")

# ---------------------------------------------------------------- quotes
def norm(s):
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"').replace("—", "--").replace("_", "")
    return re.sub(r"\s+", " ", s)

story_lines = (ROOT / C["source"]["text_file"]).read_text(encoding="utf-8").splitlines()
starts, parts, pos = [], [], 0
for line in story_lines:
    t = norm(line.strip()) + " "
    starts.append(pos); parts.append(t); pos += len(t)
story = "".join(parts)
quote_lines = {}

n_quotes = 0

def check_quotes(owner, quotes):
    global n_quotes
    for q in quotes or []:
        n_quotes += 1
        nq = norm(q).strip()
        k = story.find(nq)
        if k < 0:
            err(f"{owner}: quote not in story: {q!r}")
        else:
            quote_lines.setdefault(owner, bisect.bisect_right(starts, k))

def walk(owner, obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "source" and isinstance(v, list):
                check_quotes(owner, v)
            else:
                walk(owner, v)
    elif isinstance(obj, list):
        for x in obj:
            walk(owner, x)

for coll in ["entities", "scenes", "events", "nodes", "inferences", "actions", "relations", "inconsistencies"]:
    for x in case.get(coll, []):
        walk(x.get("id") or f"{coll}:{x.get('type', x.get('summary', '')[:30])}", x)
walk("time_model", case["time_model"])

# ---------------------------------------------------------------- mechanics
group = {k: v["group"] for k, v in mech["node_kinds"].items()}
concluded = defaultdict(list)
for i in case["inferences"]:
    cn = N_ = tables[N].get(i["conclusion"])
    if not cn:
        continue
    concluded[cn["id"]].append(i["id"])
    if cn["kind"] not in mech["conclusion_kinds"]:
        err(f"inference {i['id']}: conclusion {cn['id']} is a {cn['kind']} node; only {mech['conclusion_kinds']} may be concluded")
    for p in i["premises"]:
        pn = tables[N].get(p["node"])
        if pn and pn["kind"] not in mech["premise_roles"][p["role"]]["kinds"]:
            err(f"inference {i['id']}: a {pn['kind']} node ({pn['id']}) cannot fill role {p['role']!r}")
    if i["pattern"] == "prediction_confirmed" and not any(p["role"] == "assumption" for p in i["premises"]):
        warn(f"inference {i['id']}: prediction_confirmed without an assumption premise")
    if i["pattern"] == "identification" and sum(p["role"] == "fact" for p in i["premises"]) < 2:
        warn(f"inference {i['id']}: identification with fewer than two facts")
for n in case["nodes"]:
    if n["kind"] == "inference" and n["id"] not in concluded:
        err(f"node {n['id']}: an inference node that no inference concludes")
    if n["kind"] == "hypothesis" and n["id"] not in concluded:
        warn(f"node {n['id']}: hypothesis with no inference behind it (stated bare)")
for r in case.get("relations", []):
    rule = mech["relation_types"][r["type"]]
    f, t = tables[N].get(r["from"]), tables[N].get(r["to"])
    if f and group[f["kind"]] not in rule["from"]:
        err(f"relation {r['type']} {r['from']}->{r['to']}: a {f['kind']} node cannot be its source")
    if t:
        ok = t["kind"] in rule["to"] or group[t["kind"]] in rule["to"]
        if not ok:
            err(f"relation {r['type']} {r['from']}->{r['to']}: a {t['kind']} node cannot be its target")

# acyclic inference graph
deps = defaultdict(set)
for i in case["inferences"]:
    for p in i["premises"]:
        deps[i["conclusion"]].add(p["node"])
state = {}
def visit(x, stack):
    if state.get(x) == 1:
        err(f"inference cycle: {' -> '.join(stack + [x])}"); return
    if state.get(x) == 2:
        return
    state[x] = 1
    for d in deps[x]:
        visit(d, stack + [x])
    state[x] = 2
for x in list(deps):
    visit(x, [])

# ---------------------------------------------------------------- timelines
evs = sorted(case["events"], key=lambda e: e["fabula_order"])
if len({e["fabula_order"] for e in evs}) != len(evs):
    err("events: fabula_order values are not unique")
last = None
for e in evs:
    d = e["when"].get("day")
    if d is None:
        if last is not None and e["when"]["precision"] == "before_story":
            err(f"event {e['id']}: before_story but ordered after a dated event")
        continue
    if last is not None and d < last:
        err(f"event {e['id']}: day {d} is before the previous event's day {last} in fabula order")
    last = d

scene_order = {s["id"]: s["order"] for s in case["scenes"]}
acts = sorted(case["actions"], key=lambda a: a["order"])
if len({a["order"] for a in acts}) != len(acts):
    err("actions: order values are not unique")
protag = set(C["protagonists"])
start_known = {n["id"] for n in case["nodes"] if n.get("discovery", {}).get("known_to_protagonists_from_start")}
known = {"protagonists": set(start_known), "world": set(start_known)}
items = {"protagonists": set(C.get("starting_items", [])), "world": set()}
done = set()
yielded_by = defaultdict(set)
for a in acts:
    side = "protagonists" if a["actor"] in protag else "world"
    for x in a["requires"].get("actions", []):
        if x not in done:
            err(f"action {a['id']} (order {a['order']}): requires action {x} which has not happened yet")
    for x in a["requires"].get("nodes", []):
        pool = known[side] if side == "protagonists" else known["world"] | known["protagonists"]
        if x not in pool:
            err(f"action {a['id']} (order {a['order']}): requires node {x}, not yet known to the {side}")
    for x in a["requires"].get("items", []):
        if x not in items[side]:
            err(f"action {a['id']}: requires item {x}, not held by the {side}")
    # an action that yields an inference must already hold its premises (or yield them itself)
    gained = set(a["yields"].get("nodes", []))
    pool = known[side] | gained
    for x in a["yields"].get("nodes", []):
        for inf_id in concluded.get(x, []):
            missing = [p["node"] for p in tables["inference"][inf_id]["premises"] if p["node"] not in pool]
            if missing:
                err(f"action {a['id']}: yields {x} but its premises {missing} are not yet known")
    for x in gained:
        yielded_by[x].add(a["id"])
        known[side].add(x); known["world"].add(x)
    items[side].update(a["yields"].get("items", []))
    done.add(a["id"])
    if a.get("during_scene") and a.get("narrated_in") and scene_order[a["narrated_in"]] < scene_order[a["during_scene"]]:
        err(f"action {a['id']}: narrated before the scene it happens in")
for n in case["nodes"]:
    d = n.get("discovery", {})
    for key in ("first_by_action", "protagonists_by_action"):
        if d.get(key) and n["id"] not in yielded_by or (d.get(key) and d[key] not in yielded_by[n["id"]]):
            err(f"node {n['id']}: discovery.{key} = {d.get(key)} but that action does not yield it")
    if not d.get("known_to_protagonists_from_start") and n["id"] not in known["protagonists"]:
        warn(f"node {n['id']}: the protagonists never acquire it")

# ---------------------------------------------------------------- report
def closure(node_ids):
    out, todo = set(), list(node_ids)
    while todo:
        x = todo.pop()
        if x in out:
            continue
        out.add(x)
        todo.extend(deps.get(x, ()))
    return out

def when_str(w):
    d = w.get("day")
    if d is None:
        return w["precision"].replace("_", " ")
    days = {x["day"]: x.get("weekday", "") for x in case["time_model"]["days"]}
    s = f"day {d}" + (f" {days[d][:3]}" if d in days else "")
    if w.get("latest_day") is not None:
        s += f"–{w['latest_day']}"
    if w.get("clock"):
        s += f" {w['clock']}" + ("~" if w["precision"] == "approximate" else "")
    return s

sname = {s["id"]: f"S{s['order']}" for s in case["scenes"]}
ch_order = scene_order.get(C.get("challenge_scene"), 10**9)
L = []
L.append(f"# {C['title']} -- extraction report\n")
L.append(f"Generated by `scripts/validate_case.py` from `{case_path.relative_to(ROOT)}`. Do not edit by hand.\n")
L.append(f"**Checks:** {'PASS' if not errors else f'{len(errors)} ERROR(S)'} · {len(warnings)} warning(s)\n")
cnt = defaultdict(int)
for n in case["nodes"]:
    cnt[n["kind"]] += 1
L.append("| entities | scenes | events | nodes | inferences | relations | actions | questions | quotes checked |")
L.append("|---|---|---|---|---|---|---|---|---|")
L.append(f"| {len(case['entities'])} | {len(case['scenes'])} | {len(case['events'])} | {len(case['nodes'])} | {len(case['inferences'])} | {len(case.get('relations', []))} | {len(case['actions'])} | {len(case['questions'])} | {n_quotes} |\n")
L.append("Node kinds: " + ", ".join(f"{k} {v}" for k, v in sorted(cnt.items())) + "\n")
if errors:
    L.append("## Errors\n"); L += [f"- {e}" for e in errors]; L.append("")
if warnings:
    L.append("## Warnings\n"); L += [f"- {w}" for w in warnings]; L.append("")

L.append("## Scenes (reader order)\n")
L.append("| # | scene | when | where | line |"); L.append("|---|---|---|---|---|")
for s in sorted(case["scenes"], key=lambda s: s["order"]):
    mark = " ← challenge point" if s["id"] == C.get("challenge_scene") else ""
    L.append(f"| S{s['order']} | {s['title']}{mark} | {when_str(s['when'])} | {tables[E][s['location']]['name']} | {quote_lines.get(s['id'], '')} |")
L.append("")

L.append("## Fabula -- what really happened, in order\n")
L.append("| # | when | event | basis | reader told | truth shown | line |"); L.append("|---|---|---|---|---|---|---|")
for e in evs:
    L.append(f"| {e['fabula_order']} | {when_str(e['when'])} | {e['summary']} | {e['basis']} | {sname.get(e.get('first_told_in'), '')} | {sname.get(e.get('truth_revealed_in'), '')} | {quote_lines.get(e['id'], '')} |")
L.append("")

L.append("## Investigation -- who did what, in order\n")
L.append("Happens = the scene it takes place in; Told = where the reader learns of it. A gap is Holmes keeping his reasoning back.\n")
L.append("| # | when | actor | verb | action | happens | told | yields |"); L.append("|---|---|---|---|---|---|---|---|")
for a in acts:
    y = ", ".join(a["yields"].get("nodes", []) + [f"item:{i}" for i in a["yields"].get("items", [])])
    if a["yields"].get("unknown"):
        y += " **(unknown)**"
    gap = " ⟵" if a.get("during_scene") and a.get("narrated_in") and a["during_scene"] != a["narrated_in"] else ""
    L.append(f"| {a['order']} | {when_str(a['when'])} | {a['actor']} | {a['verb']} | {a['summary']}{' *(offstage)*' if a.get('offstage') else ''} | {sname.get(a.get('during_scene'), '')} | {sname.get(a.get('narrated_in'), '')}{gap} | {y} |")
L.append("")

L.append("## Clues -- discovery and disclosure\n")
L.append("| node | kind | relevance | truth | protagonists get it | reader meets it | meaning explained | line |"); L.append("|---|---|---|---|---|---|---|---|")
for n in case["nodes"]:
    d = n.get("discovery", {})
    got = "from start" if d.get("known_to_protagonists_from_start") else (d.get("protagonists_by_action") or "")
    L.append(f"| `{n['id']}` {n.get('label', '')} | {n['kind']} | {n['relevance']} | {n['truth']} | {got} | {sname[n['reader_learns_in']]} | {sname.get(n.get('significance_explained_in'), '')} | {quote_lines.get(n['id'], '')} |")
L.append("")

L.append(f"## Fair play -- could a reader solve it by the challenge point ({sname.get(C.get('challenge_scene'), '?')})?\n")
L.append("For each question: every node its answer rests on (the premises, recursively). Evidence and rules the reader first meets after the challenge point are listed -- those are what a solving reader was not given. Reasoning nodes are left out: working them out is the reader's job.\n")
for q in case["questions"]:
    cl = closure(q["answered_by"])
    late = [x for x in sorted(cl) if group[tables[N][x]["kind"]] != "reasoning" and scene_order[tables[N][x]["reader_learns_in"]] > ch_order]
    base = [x for x in cl if group[tables[N][x]["kind"]] != "reasoning"]
    verdict = "fair" if not late else f"{len(late)} of {len(base)} needed clues withheld"
    L.append(f"- **{q['text']}** -- {q['answer']} → *{verdict}*" + ("".join(f"\n  - `{x}` ({tables[N][x]['kind']}, reader meets it in {sname[tables[N][x]['reader_learns_in']]})" for x in late)))
L.append("")

def mid(x):
    return re.sub(r"[^A-Za-z0-9_]", "_", x)
style = {"evidence": "ev", "knowledge": "bg", "reasoning": "rs"}
L.append("## Clue graph\n")
L.append("Rectangles = evidence, rounded = background rules, hexagons = conclusions, dashed = hypotheses. Each small circle is one inference step (its premises are its 'ports'). Red edges = refutes/contradicts; dotted = misleads.\n")
L.append("```mermaid\nflowchart LR")
L.append("  classDef ev fill:#e8f0fe,stroke:#4a6fa5;\n  classDef bg fill:#f3f3f3,stroke:#999;\n  classDef rs fill:#e6f4ea,stroke:#3a7d44;\n  classDef hyp fill:#fff4e5,stroke:#c77700,stroke-dasharray:4 3;\n  classDef bad fill:#fdecea,stroke:#b3261e,stroke-dasharray:4 3;\n  classDef step fill:#fff,stroke:#666;")
for n in case["nodes"]:
    if n["relevance"] == "flavour":
        continue
    lab = (n.get("label") or n["id"]).replace('"', "'")
    g = group[n["kind"]]
    if n["kind"] == "hypothesis":
        L.append(f'  {mid(n["id"])}["{lab}"]:::{"bad" if n["truth"] == "false" else "hyp"}')
    elif g == "reasoning":
        L.append(f'  {mid(n["id"])}{{{{"{lab}"}}}}:::rs')
    elif g == "knowledge":
        L.append(f'  {mid(n["id"])}("{lab}"):::bg')
    else:
        L.append(f'  {mid(n["id"])}["{lab}"]:::ev')
for i in case["inferences"]:
    if tables[N][i["conclusion"]]["relevance"] == "flavour":
        continue
    L.append(f'  {mid(i["id"])}((" ")):::step')
    for p in i["premises"]:
        L.append(f'  {mid(p["node"])} --> {mid(i["id"])}')
    L.append(f'  {mid(i["id"])} --> {mid(i["conclusion"])}')
k = 0
lines_red = []
for r in case.get("relations", []):
    if tables[N][r["from"]]["relevance"] == "flavour" or tables[N][r["to"]]["relevance"] == "flavour":
        continue
    arrow = {"misleads_toward": "-.->", "refutes": "--x", "contradicts": "--x"}.get(r["type"], "-->")
    L.append(f'  {mid(r["from"])} {arrow}|{r["type"]}| {mid(r["to"])}')
L.append("```\n")

L.append("## Action graph\n")
L.append("Protagonist actions only. An arrow A → B means B needs something A produced (a clue, a conclusion, an item, or A itself).\n")
L.append("```mermaid\nflowchart TD")
prod = {}
for a in acts:
    for x in a["yields"].get("nodes", []) + a["yields"].get("items", []):
        prod.setdefault(x, a["id"])
pa = [a for a in acts if a["actor"] in protag]
for a in pa:
    L.append(f'  {mid(a["id"])}["{a["order"]}. {a["verb"]}: {a["summary"][:48].replace(chr(34), chr(39))}…"]')
pids = {a["id"] for a in pa}
for a in pa:
    srcs = set()
    for x in a["requires"].get("nodes", []) + a["requires"].get("items", []):
        if prod.get(x) in pids:
            srcs.add(prod[x])
    for x in a["requires"].get("actions", []):
        if x in pids:
            srcs.add(x)
    for s_ in sorted(srcs, key=lambda s_: tables[A][s_]["order"]):
        L.append(f'  {mid(s_)} --> {mid(a["id"])}')
L.append("```\n")

if case.get("inconsistencies"):
    L.append("## Inconsistencies in the text\n")
    for x in case["inconsistencies"]:
        L.append(f"- {x['summary']}" + (f" *Used:* {x['resolution_used']}" if x.get("resolution_used") else ""))
    L.append("")

out = case_path.with_suffix(".report.md")
out.write_text("\n".join(L) + "\n", encoding="utf-8")
for w in warnings:
    print("warning:", w)
for e in errors:
    print("ERROR:", e)
print(f"{len(errors)} error(s), {len(warnings)} warning(s); report: {out.relative_to(ROOT)}")
sys.exit(1 if errors else 0)
