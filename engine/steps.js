// Holmes's steps, from the annotated reading (Round 57; route.json retired). A thought that names an inference is a
// step whose conclusion is that inference's formula; it gates the reading (the 'wait' pace) when the inference is
// Holmes's own and not implicit and the thought has a Holmes paragraph that states it, at the first such paragraph.
// A thought that carries a conclusion of Holmes's that no single inference gives (`concludes`: a formula or a
// slot ruled out, the cards it rests on, the line where Holmes says it) is a step made by proving that conclusion,
// gating the paragraph of its line. Each step has the shape route.json had, so the story and the game read it so.

export function stepsFromThoughts(data) {
    const byId = new Map((data.constraints ?? []).map((k) => [k.id, k]));
    // The clues and rules an inference rests on, down its chain.
    const leaves = (id, seen = new Set()) => {
        const k = byId.get(id);
        if (!k) return [id];
        if (seen.has(id)) return [];
        seen.add(id);
        return k.premises.flatMap((p) => leaves(p, seen));
    };
    const steps = [];
    for (const t of data.thoughts ?? []) {
        if (t.concludes) {
            const { premises, source, ...concludes } = t.concludes;
            steps.push({ id: t.id, reasoner: 'holmes', premises, concludes, source });
            continue;
        }
        const k = byId.get(t.inference);
        // A false inference (the reader's one culprit, Round 111) is verified as its reasoner's reasoning, not as a
        // step of the case's route.
        if (!k || k.truth === false) continue;
        const paras = t.holmes && !t.holmes.never ? t.holmes.paras ?? [] : [];
        const gates = k.by === 'holmes' && !k.implicit && paras.length > 0;
        steps.push({ id: t.id, reasoner: gates ? 'holmes' : k.by, premises: [...new Set(leaves(k.id))], concludes: { formula: k.formula }, inference: k.id, ...(paras.length && { at: Math.min(...paras) }) });
    }
    return steps;
}
