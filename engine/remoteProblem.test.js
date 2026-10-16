// The solver at arm's length: a slow call goes to the worker (here its handler, behind a stand-in for the Worker),
// the answer comes back with progress, is cached, and the call is tried again; the game's moves survive the retry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from './loadCase.js';
import { rebuildProblem, activeConstraints } from './caseModel.js';
import { RemoteProblem, NeedSolve, settle, workerClient } from './remoteProblem.js';
import { createHandler } from './solverWorker.js';
import { Game, MEDIUM } from './game.js';

const model = await loadCase(new URL('../cases/silver-blaze', import.meta.url).pathname);

/** A Worker stand-in: messages cross asynchronously and are cloned, as postMessage does. */
function fakeWorker() {
    const w = { onmessage: null };
    const handle = createHandler((msg) => setImmediate(() => w.onmessage({ data: structuredClone(msg) })), { every: 0 });
    w.postMessage = (msg) => { const copy = structuredClone(msg); setImmediate(() => handle(copy)); };
    return w;
}

test('a slow solver call goes to the worker, with progress, and the retry finds the answer', async () => {
    const client = workerClient(fakeWorker());
    model.wrapProblem = (local, args) => { client.init(args); return new RemoteProblem(local, client, 0); };
    try {
        rebuildProblem(model);
        const p = model.problem;
        assert.ok(p instanceof RemoteProblem);
        const ids = activeConstraints(model, new Set(model.cards.keys())).filter((id) => !model.constraints.get(id).derived);
        const slots = ['e.horse_led_out.agent', 'e.opium_added.agent', 'st.mrs_straker.at.tue_stable', 'ord.horse_led_out.wife_wakes'];
        assert.throws(() => p.allCandidates(ids, slots), NeedSolve);
        const progress = [];
        let busy = 0;
        const got = await settle(() => p.allCandidates(ids, slots), () => model.problem, { onBusy: () => busy++, onProgress: (d, t, w) => progress.push([d, t, w]) });
        assert.equal(busy, 1);
        assert.ok(progress.length > 0 && progress.every(([d, t]) => d <= t), 'progress comes as done of total');
        assert.deepEqual(got.get('e.horse_led_out.agent'), ['straker']);
        assert.deepEqual(got, p.local.allCandidates(ids, slots), 'the same answer as on the spot');
        assert.equal(p.allCandidates(ids, slots), got, 'cached: no second trip');
        // A game driven through settle: reading, a checked cross-out and the clashes all get through.
        const game = await settle(() => new Game(model, { difficulty: MEDIUM }), () => model.problem);
        while (game.read < 60) await settle(() => game.advance(), () => model.problem);
        assert.equal(game.read, 60, 'a retried advance reads each paragraph once');
        const res = await settle(() => game.strike('e.horse_led_out.agent', 'other_lads'), () => model.problem);
        assert.ok(res.ok, JSON.stringify(res));
        assert.ok(Array.isArray(await settle(() => game.clashes(), () => model.problem)));
    } finally {
        model.wrapProblem = null;
        rebuildProblem(model);
    }
});
