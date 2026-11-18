// A case's implications as the page has them: world/implications.json, and the rules that come from the typed
// forms of the answers themselves (engine/implications.js `withTable`). Sets the case's actions.
import fs from 'node:fs';
import path from 'node:path';
import { loadWorld } from './world-provenance.js';
import { setCaseActions } from '../engine/actions.js';
import { timeOrder, places } from '../engine/world.js';
import { withTable } from '../engine/implications.js';

/** The world with its time order and places, as the engine's checks want it. */
export function loadCaseWorld(dir) {
    const w = loadWorld(dir);
    return { ...w, order: timeOrder(w.times), places: places(w) };
}
export function caseRules(dir) {
    const R = (f) => JSON.parse(fs.readFileSync(path.join(dir, 'world', f), 'utf8'));
    const has = (f) => fs.existsSync(path.join(dir, 'world', f));
    if (!has('implications.json')) return [];
    setCaseActions(has('actions.json') ? R('actions.json') : {});
    return withTable(R('implications.json').implications, loadCaseWorld(dir), has('observations.json') ? R('observations.json').observations : []);
}
