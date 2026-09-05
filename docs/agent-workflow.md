# Agent workflow

Use the smallest context path:

```text
search → inspect → add → compose → check
```

Example:

```bash
npm run ovlira -- search "settings page" --json
npm run ovlira -- inspect page.settings --json
npm run ovlira -- metadata --json
npm run ovlira -- init ./workspace-ui
npm run ovlira -- add page.settings --cwd ./workspace-ui
cd workspace-ui
npm install
npm run build
npm run ovlira -- check --json
```

Search gives stable IDs and short descriptions. Inspect gives one component or recipe contract. Adding a component returns its package import; adding a recipe writes local composition code with direct `@ovlira/elements/*` imports. Check reports stable rules, locations, and suggested fixes. Keep the CLI local to the application so the CLI and runtime package versions are explicit and reproducible.

Use `--kind`, `--category`, `--tag`, and `--limit` to keep search context bounded. Use `inspect --section api|guidance|example` when the full descriptor is unnecessary; recipe guidance includes content regions, required states, and supported data/action/navigation seams. Add is idempotent and preserves locally edited files; pass `--entry src/app.ts` to target an explicit entry or `--force` only to replace generated files deliberately.

## Visual execution contract

[`DESIGN.md`](../DESIGN.md), [`ui.html`](../ui.html), and approved Playwright baselines are the visual authority. The agent role is deliberately narrower:

```text
Use the supplied design system and reference fixtures as the visual authority.
Do not choose or revise palette, typography, radius, density, motion, or component styling.
Implement composition, content, data, behavior, accessibility, and responsive structure.
Render the result at the required viewports.
If it differs visually, report the defect and do not invent a replacement style.
```

For repository work, use `npm run test:browser` for functional, accessibility, touch-target, and overflow checks, then `npm run test:visual` for the approved screenshot regression set. Only `npm run test:visual:update` intentionally changes baselines, and that change requires human visual approval. Generated projects still finish with `npm run ovlira -- check --json`.
