// The solver at arm's length (the browser): a call that the page can answer at once is answered on the spot; one
// that runs past a short time budget is handed to a Web Worker, which works on it while the page shows progress.
//
// The game's code stays synchronous. A slow call throws NeedSolve, carrying its request; whoever drove the game
// (a click, a render) catches it with `settle`, waits for the worker's answer, which is then cached, and tries again.
// The retry finds the answer in the cache. Every move of the game asks the solver BEFORE it changes anything (or
// changes only what it would change again the same way), so a retried move does the same thing once.
//
// Request and answer are plain data: method name, its arguments (constraint ids, fixed values, formulas), and the
// result (Maps and arrays survive the structured clone). The worker holds a Problem built from the same slots and
// constraints, sent whenever the model rebuilds its own (a player's new inference), tagged with a version.

import { OverBudget } from './solver.js';

/** A solver call too slow to answer on the spot: hand `request` to the worker, then try again. */
export class NeedSolve extends Error {
    constructor(request) {
        super(`the solver needs time for ${request.method}`);
        this.request = request;
    }
}

const SLOW = ['consistent', 'candidates', 'allCandidates', 'countSolutions', 'explainConflict'];

export class RemoteProblem {
    /**
     * @param {import('./solver.js').Problem} local the same problem, for the quick calls
     * @param {{version:number, solve:(request)=>Promise<any>}} client the worker's side
     * @param {number} budget milliseconds a call may take here before it is handed over
     */
    constructor(local, client, budget = 60) {
        this.local = local;
        this.client = client;
        this.budget = budget;
        this.answers = new Map();
        for (const m of SLOW) this[m] = (...args) => this.#call(m, args);
        // Quick and local only: replaying a clash step by step, and whatever else the game reads off the problem.
        this.steps = (...args) => local.steps(...args);
        this.domains = local.domains;
        this.constraints = local.constraints;
        this.timeOrder = local.timeOrder;
    }

    #call(method, args) {
        const key = `${method}|${JSON.stringify(args, (k, v) => (v instanceof Set ? [...v] : v))}`;
        if (this.answers.has(key)) return this.answers.get(key);
        this.local.deadline = Date.now() + this.budget;
        try {
            const res = this.local[method](...args);
            this.answers.set(key, res);
            return res;
        } catch (e) {
            if (!(e instanceof OverBudget)) throw e;
            throw new NeedSolve({ key, method, args, version: this.client.version });
        } finally {
            this.local.deadline = null;
        }
    }

    /** Fetch an answer from the worker and keep it. A request already on its way is shared, not sent again. */
    async fetch(request, onProgress = null) {
        this.inflight ??= new Map();
        if (!this.inflight.has(request.key)) {
            this.inflight.set(request.key, this.client.solve(request, onProgress).then((res) => {
                this.answers.set(request.key, res);
                return res;
            }).finally(() => this.inflight.delete(request.key)));
        }
        return this.inflight.get(request.key);
    }
}

/**
 * Run `fn` (a click's work, a render) until it gets through: each NeedSolve is answered by the worker, with
 * `onProgress(done, total, what)` while it works, and `fn` runs again. `problem()` is the model's current problem.
 */
export async function settle(fn, problem, { onBusy = () => {}, onProgress = null, onIdle = () => {} } = {}) {
    let busy = false;
    try {
        for (;;) {
            try {
                return fn();
            } catch (e) {
                if (!(e instanceof NeedSolve)) throw e;
                const p = problem();
                if (!(p instanceof RemoteProblem)) throw e;
                if (!busy) { busy = true; onBusy(e.request); }
                await p.fetch(e.request, onProgress);
            }
        }
    } finally {
        if (busy) onIdle();
    }
}

/**
 * The page's side of the worker (engine/solverWorker.js): `init` sends the problem's slots and constraints (each
 * rebuild bumps the version), `solve` sends one request and resolves with its answer, passing progress on.
 */
export function workerClient(worker) {
    let next = 0;
    const pending = new Map();
    worker.onmessage = (e) => {
        const m = e.data;
        const p = pending.get(m.id);
        if (!p) return;
        if (m.type === 'progress') { p.onProgress?.(m.done, m.total, m.what); return; }
        pending.delete(m.id);
        if (m.type === 'result') p.resolve(m.result); else p.reject(new Error(m.error));
    };
    return {
        version: 0,
        init({ domains, constraints, timeOrder }) {
            this.version++;
            worker.postMessage({ type: 'init', version: this.version, payload: { domains, timeOrder, constraints: constraints.map((c) => ({ id: c.id, formula: c.formula, world: !!c.world })) } });
        },
        solve(request, onProgress) {
            return new Promise((resolve, reject) => {
                const id = ++next;
                pending.set(id, { resolve, reject, onProgress });
                worker.postMessage({ type: 'solve', id, method: request.method, args: request.args });
            });
        },
    };
}
