# Agent workflow

Use the smallest context path:

```text
search → inspect → add → compose → check
```

Example:

```bash
ovlira search "settings page" --json
ovlira inspect page.settings --json
ovlira metadata --json
ovlira init ./workspace-ui
ovlira add page.settings --cwd ./workspace-ui
cd workspace-ui
npm install
npm run build
ovlira check --json
```

Search gives stable IDs and short descriptions. Inspect gives one component or recipe contract. Add copies only the selected source and its direct catalogue dependencies. Check reports stable rules, locations, and suggested fixes.

Use `--kind`, `--category`, `--tag`, and `--limit` to keep search context bounded. Use `inspect --section api|guidance|example` when the full descriptor is unnecessary. Add is idempotent and preserves locally edited files; pass `--entry src/app.ts` to target an explicit entry or `--force` only to replace generated files deliberately.

## Visual execution contract

[`DESIGN.md`](../DESIGN.md), [`ui.html`](../ui.html), and approved Playwright baselines are the visual authority. The agent role is deliberately narrower:

```text
Use the supplied design system and reference fixtures as the visual authority.
Do not choose or revise palette, typography, radius, density, motion, or component styling.
Implement composition, content, data, behavior, accessibility, and responsive structure.
Render the result at the required viewports.
If it differs visually, report the defect and do not invent a replacement style.
```

For repository work, use `npm run test:browser` for functional, accessibility, touch-target, and overflow checks, then `npm run test:visual` for the approved screenshot regression set. Only `npm run test:visual:update` intentionally changes baselines, and that change requires human visual approval. Generated projects still finish with `ovlira check --json`.
