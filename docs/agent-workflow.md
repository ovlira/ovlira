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

Agents should search before inventing a component, prefer recipes for complete screens, use approved tokens, include required states, and run `ovlira check` before finishing.
