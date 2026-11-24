// The page's half of the bridge to an Archipelago (ui/bridge.js), against its own stand-in host, in one made-up window.
import test from 'node:test';
import assert from 'node:assert/strict';
import { connect, reconcile, stubHost } from './bridge.js';

/** A window that delivers a message to its listeners on a later turn, as a browser does. */
function fakeWindow() {
    const listeners = [], log = [];
    return {
        log,
        addEventListener: (type, fn) => listeners.push(fn),
        postMessage: (data) => { log.push(data); queueMicrotask(() => listeners.forEach((fn) => fn({ data }))); },
        timers: [], setInterval(fn, ms) { this.timers.push({ fn, ms }); return this.timers.length; }, clearInterval: () => {},
    };
}
const settle = () => new Promise((r) => setTimeout(r, 5));

test('the handshake, the state, a solve and its paper', async () => {
    const win = fakeWindow(), states = [];
    stubHost({ win, id: 'mystery', story: 's', version: 'v1', game: 'g', start: ['a'], brings: (q) => ({ q1: 'b' })[q] ?? null });
    const link = connect({ win, target: win, id: 'mystery', story: 's', version: 'v1', onState: (s) => states.push(s), onRefused: (r) => assert.fail(r) });
    await settle();
    assert.deepEqual(states.at(-1), { story: 's', version: 'v1', game: 'g', connected: true, papers: ['a'], solved: [] });
    assert.deepEqual(win.log.filter((m) => m.type === 'SUBSCRIBE_EVENT_BUS').map((m) => m.data.eventName), ['mystery:state', 'mystery:refused']);
    assert.ok(win.log.some((m) => m.type === 'IFRAME_APP_READY'));
    // Every message has the shape the web client's adapter accepts.
    for (const m of win.log) assert.ok(m.type && m.clientId === 'mystery' && m.iframeId === 'mystery' && typeof m.timestamp === 'number');
    link.solved('q1');
    await settle();
    assert.deepEqual(states.at(-1).papers, ['a', 'b']);
    assert.deepEqual(states.at(-1).solved, ['q1']);
    link.solved('q2');
    await settle();
    assert.deepEqual(states.at(-1).papers, ['a', 'b']);
});

test('opened as a window: the first word is WINDOW_READY', async () => {
    const win = fakeWindow(), states = [];
    stubHost({ win, id: 'w1', story: 's', version: 'v1', game: 'g', start: ['a'], brings: () => null });
    connect({ win, target: win, id: 'w1', mode: 'window', story: 's', version: 'v1', onState: (s) => states.push(s), onRefused: (r) => assert.fail(r) });
    await settle();
    assert.equal(win.log[0].type, 'WINDOW_READY');
    assert.equal(states.length, 1);
});

test('a heartbeat once connected, and the handshake again when the host has dropped the page', async () => {
    const win = fakeWindow(), states = [];
    stubHost({ win, id: 'mystery', story: 's', version: 'v1', game: 'g', start: [], brings: () => null });
    connect({ win, target: win, id: 'mystery', story: 's', version: 'v1', onState: (s) => states.push(s), onRefused: () => {} });
    await settle();
    const [again, beat] = win.timers;
    assert.equal(beat.ms, 30000);
    beat.fn();
    assert.equal(win.log.at(-1).type, 'HEARTBEAT');
    again.fn();
    assert.equal(win.log.filter((m) => m.type === 'IFRAME_READY').length, 1, 'no greeting while connected');
    win.postMessage({ type: 'CONNECTION_ERROR', clientId: 'mystery', timestamp: 1, data: { errorType: 'NOT_REGISTERED' } });
    await settle();
    again.fn();
    await settle();
    assert.equal(win.log.filter((m) => m.type === 'IFRAME_READY').length, 2);
    assert.equal(states.length, 2, 'a fresh state after the second handshake');
});

test('another version is refused', async () => {
    const win = fakeWindow(), refused = [];
    stubHost({ win, id: 'mystery', story: 's', version: 'v2', game: 'g', start: [], brings: () => null });
    connect({ win, target: win, id: 'mystery', story: 's', version: 'v1', onState: () => assert.fail('a state'), onRefused: (r) => refused.push(r) });
    await settle();
    assert.equal(refused.length, 1);
});

test('messages for another frame or another story are not taken', async () => {
    const win = fakeWindow(), states = [];
    connect({ win, target: { postMessage() {} }, id: 'mystery', story: 's', version: 'v1', onState: (s) => states.push(s), onRefused: () => {} });
    const msg = (id, story) => ({ type: 'EVENT_BUS_MESSAGE', clientId: id, timestamp: 1, data: { eventName: 'mystery:state', eventData: { story, connected: true, papers: [], solved: [] } } });
    win.postMessage(msg('other', 's')); win.postMessage(msg('mystery', 't')); win.postMessage(msg('mystery', 's'));
    await settle();
    assert.equal(states.length, 1);
});

test("a refusal that names the slot's story, another one, is still taken", async () => {
    const win = fakeWindow(), refused = [];
    connect({ win, target: { postMessage() {} }, id: 'mystery', story: 's', version: 'v1', onState: () => {}, onRefused: (r) => refused.push(r) });
    win.postMessage({ type: 'EVENT_BUS_MESSAGE', clientId: 'mystery', timestamp: 1, data: { eventName: 'mystery:refused', eventData: { reason: 'other-story', story: 't', version: 'v9' } } });
    await settle();
    assert.deepEqual(refused, ['the slot is for another case']);
});

test('reconcile: papers are never taken back, and what the host lacks is sent again once connected', () => {
    assert.deepEqual(reconcile(['a', 'b'], ['q1', 'q2'], { connected: true, papers: ['a', 'c'], solved: ['q1'] }), { held: ['a', 'b', 'c'], fresh: ['c'], resend: ['q2'] });
    assert.deepEqual(reconcile(['a'], ['q1'], { connected: false, papers: [], solved: [] }), { held: ['a'], fresh: [], resend: [] });
});
