# v2: the two Sherlock Holmes cases, as they stood on 2026-11-11

Watson's timeline with its two full cases, "Silver Blaze" and "The Adventure of the Speckled Band", kept as they were
when the project turned to stories written for it (`../docs/authored-stories.md`). Like `../v1/`, this directory has
its own copy of everything it uses (the page, `ui/`, `engine/`, the checks in `scripts/`, the new-story pipeline in
`pipeline/`) and nothing is owed to it from the main tree: the engine and the page there change for the new stories
and are not tested against these two cases. Whether to bring the cases forward to a later engine is undecided.

- Play: `node scripts/serve.js` at the repository root, then http://localhost:8321/v2/ (Silver Blaze) and
  http://localhost:8321/v2/?case=cases/speckled-band. Saves are shared with the addresses the cases had before.
- Tests: `npm run v2:test`. Page checks (about 45 minutes, the two cases side by side): `npm run v2:page-checks`;
  one case: `cd v2 && CASE=cases/speckled-band node scripts/page-checks.mjs`.
- Docs as of the freeze: `docs/case-format.md`, `docs/technical.md` (paths in them are relative to this directory),
  `docs/logic-audit.md`, `docs/reading-annotated.md`; the pipeline: `pipeline/README.md`.
- State at the freeze: every page check passed on both cases with the main tree's engine of that day (the gate that
  asks for evidence, tellings as evidence, alibis, the chains told so far).
