// The page's half of the bridge to an Archipelago (docs/archipelago-plan.md, "The Archipelago side"; docs/case-format.md,
// "Played in an Archipelago"). The page sits in a frame of the Archipelago-CC web client (`?iframeId=<id>`), or in a
// window that client opened (`?windowId=<id>`), and talks
// to it by that client's adapter protocol (its frontend/modules/shared/communicationProtocol.js): window messages
// `{type, clientId, iframeId, windowId, timestamp, data}`. Over it go four events of the host's event bus:
//   page → host   mystery:requestState   {story, version}
//   page → host   mystery:questionSolved {story, questionId}
//   host → page   mystery:state          {story, version, game, connected, papers, solved, loop?}   (the whole sets, every time)
//   host → page   mystery:refused        {reason, story, version}   (the slot's; reason: no-mystery-world, other-story, other-version)
// The page deals only in its own ids (papers, questions); the host turns them into items and locations.
// Nothing here touches the document: `win` is the page's window and `target` the host's, so a test can pass its own.

/** The host's reasons for refusing, in the player's words. */
const REASONS = { 'no-mystery-world': 'the game loaded there is not a mystery case', 'other-story': 'the slot is for another case', 'other-version': 'the slot was made from another version of this case' };
const message = (type, id, data) => ({ type, clientId: id, iframeId: id, windowId: id, timestamp: Date.now(), data });

/**
 * Connect to the host. `onState(state)` and `onRefused(reason)` are called for each event that names this story.
 * Returns `{solved(questionId), request()}`. The handshake is repeated until the host answers, a heartbeat goes
 * every half minute after, and a host that says the page is no longer registered is greeted again.
 */
export function connect({ win, target, id, mode = 'iframe', origin = '*', story, version, onState, onRefused, retry = 1000, beat = 30000 }) {
    let ready = false;
    const post = (type, data) => target.postMessage(message(type, id, data), origin);
    const publish = (eventName, eventData) => post('PUBLISH_EVENT_BUS', { eventName, eventData });
    const request = () => publish('mystery:requestState', { story, version });
    win.addEventListener('message', (e) => {
        const m = e.data;
        if (!m || typeof m !== 'object' || (m.clientId ?? m.iframeId ?? m.windowId) !== id) return;
        if (m.type === 'ADAPTER_READY' && !ready) {
            ready = true;
            for (const eventName of ['mystery:state', 'mystery:refused']) post('SUBSCRIBE_EVENT_BUS', { eventName });
            post('IFRAME_APP_READY', { timestamp: Date.now() });
            request();
        } else if (m.type === 'CONNECTION_ERROR' && JSON.stringify(m.data ?? '').includes('NOT_REGISTERED')) {
            ready = false;   // dropped by the host (no heartbeat reached it for a minute): the handshake again, and a fresh state
        } else if (m.type === 'EVENT_BUS_MESSAGE') {
            const { eventName, eventData } = m.data ?? {};
            // A refusal names the slot's story, which may be another: it is for this page all the same.
            if (eventName === 'mystery:refused') onRefused(REASONS[eventData?.reason] ?? eventData?.reason ?? 'refused');
            else if (eventName === 'mystery:state' && (eventData?.story == null || eventData.story === story)) onState(eventData ?? {});
        }
    });
    // Framed, or opened as a window of its own by the web client's window adapter (`?windowId=`): the same but for the first word.
    const hello = () => post(mode === 'window' ? 'WINDOW_READY' : 'IFRAME_READY', { clientId: id, iframeId: id, windowId: id, version: '1.0.0', capabilities: [mode === 'window' ? 'window-base' : 'iframe-base'] });
    hello();
    win.setInterval(() => { if (!ready) hello(); }, retry);
    // The host drops a client it has not heard from for a minute (its adapter's `checkHeartbeats`).
    win.setInterval(() => { if (ready) post('HEARTBEAT', { timestamp: Date.now() }); }, beat);
    return { solved: (questionId) => publish('mystery:questionSolved', { story, questionId }), request };
}

/**
 * What to do with a state from the host: the papers now held (never fewer than before: an item is not taken back),
 * and the solved questions to send again because the host does not list them (a check made while not connected).
 */
export function reconcile(heldBefore, solvedHere, state) {
    const held = [...new Set([...heldBefore, ...(state.papers ?? [])])];
    const fresh = held.filter((p) => !heldBefore.includes(p));
    const resend = state.connected ? solvedHere.filter((q) => !(state.solved ?? []).includes(q)) : [];
    return { held, fresh, resend };
}

/**
 * A host for the checks, in the page's own window (`?bridge=stub`): it answers the handshake and the two events as
 * the real one would, with the papers placed on the questions by `brings` (question id → paper id or null) and those
 * in hand from the start. `game` names the save. `target`: the page's window, when the host is the window that frames
 * it (scripts/fixtures/bridge-host.html).
 */
export function stubHost({ win, target = win, id, story, version, game, start, brings, onMessage = null }) {
    const solved = new Set(), given = [];
    let loop = 1;
    const post = (type, data) => (typeof target === 'function' ? target() : target).postMessage(message(type, id, data), '*');
    const state = () => post('EVENT_BUS_MESSAGE', { eventName: 'mystery:state', eventData: { story, version, game, connected: true, papers: [...start, ...[...solved].map(brings).filter(Boolean), ...given], solved: [...solved], loop } });
    win.addEventListener('message', (e) => {
        const m = e.data;
        if (!m || m.clientId !== id) return;
        onMessage?.(m);
        if (m.type === 'IFRAME_READY' || m.type === 'WINDOW_READY') post('ADAPTER_READY', {});
        if (m.type !== 'PUBLISH_EVENT_BUS') return;
        const { eventName, eventData } = m.data;
        if (eventData.story !== story || eventData.version != null && eventData.version !== version) return post('EVENT_BUS_MESSAGE', { eventName: 'mystery:refused', eventData: { story: eventData.story, reason: 'another story or version' } });
        if (eventName === 'mystery:questionSolved') solved.add(eventData.questionId);
        state();
    });
    // For a case with visits, whose day is played in the host: a paper found there, and the loop it is in.
    return { solved: () => [...solved], give: (paper) => { if (!given.includes(paper)) given.push(paper); state(); }, loop: (n) => { loop = n; state(); } };
}
