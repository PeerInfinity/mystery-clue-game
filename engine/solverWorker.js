// The solver's Web Worker: holds a Problem like the page's own and answers the calls too slow for the page
// (engine/remoteProblem.js), reporting progress as it goes. Messages:
//   {type: 'init', version, payload: {domains, timeOrder, constraints}}    (re)build the problem
//   {type: 'solve', id, method, args}  →  {type: 'progress', id, done, total, what}…, then {type: 'result', id, result}
//                                         or {type: 'error', id, error}

import { Problem, OverBudget } from './solver.js';
import { OVER } from './remoteProblem.js';

/** The message handler, apart from the worker global so that it can be tested in node. */
export function createHandler(post, { every = 100 } = {}) {
    let problem = null;
    return (m) => {
        if (m.type === 'init') { problem = new Problem(m.payload); return; }
        if (m.type !== 'solve') return;
        let last = 0;
        problem.onProgress = (done, total, what) => {
            const now = Date.now();
            if (now - last < every) return;
            last = now;
            post({ type: 'progress', id: m.id, done, total, what });
        };
        // A request with a budget (Game.concludeFrom) gives up past it, and says so.
        problem.deadline = m.budget ? Date.now() + m.budget : null;
        try {
            post({ type: 'result', id: m.id, result: problem[m.method](...m.args) });
        } catch (err) {
            if (err instanceof OverBudget) post({ type: 'result', id: m.id, result: { [OVER]: true } });
            else post({ type: 'error', id: m.id, error: String(err?.stack ?? err) });
        } finally {
            problem.onProgress = null;
            problem.deadline = null;
        }
    };
}

if (typeof self !== 'undefined' && typeof self.postMessage === 'function' && typeof window === 'undefined') {
    const handle = createHandler((msg) => self.postMessage(msg));
    self.onmessage = (e) => handle(e.data);
}
