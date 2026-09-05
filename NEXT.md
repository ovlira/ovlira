# Next work after the package refactor

The central design decision is now implemented: install Ovlira locally, keep runtime elements in `@ovlira/elements`, and let `@ovlira/cli` generate only application composition.

The next work should prove usefulness with agents rather than add more infrastructure:

See [the 0.4 evidence checklist](docs/release-0.4.md) for the fixed adaptation tasks, acceptance rules, and pending visual approval. Fresh-install smoke coverage and registered-path preservation are now implemented; actual domain adaptation remains unproven.

1. Run the fixed Codex scenarios against fresh package-mode projects. Measure recipe selection, direct-import correctness, build/check success, and whether agents edit component source.
2. Improve recipe seams where agents struggle: domain copy, data properties, action handlers, routing, and state transitions.
3. Add a small upgrade/drift command only after repeated-use tests show a real need. It should report package and manifest versions before proposing changes; it must not silently rewrite local composition or themes.
4. Keep growing the catalogue only when an agent benchmark demonstrates a generic missing building block.
5. Revisit framework adapters only when direct custom-element consumption produces measured friction; wrappers are not the default architecture.

The canonical local workflow is:

```bash
npm run ovlira -- search "settings page" --json
npm run ovlira -- inspect page.settings --section guidance --json
npm run ovlira -- init ./workspace-ui
npm run ovlira -- add page.settings --cwd ./workspace-ui
cd workspace-ui
npm install
npm run build
npm run ovlira -- check --json
```
