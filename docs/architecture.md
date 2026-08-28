# Architecture

Ovlira is a local npm package (`@ovlira/cli`) with no server, database, auth, or MCP layer. The installed executable remains `ovlira` so agent instructions and project workflows stay short.

The catalogue is a designer-to-agent handoff boundary. Human designers own the visual and behavioural contracts of components, recipes, and the default theme. Coding agents retrieve those contracts progressively, then own domain adaptation, state wiring, application logic, and deterministic repair. Ovlira does not ask a model to design or restyle its base components.

```text
src/components       Lit runtime implementations
src/catalogue        compact component and recipe descriptors
src/tokens           JSON source and CSS custom-property export
src/cli              deterministic CLI and static validator
examples/frameworks   portability snippets
```

The registry is bundled JSON. `search` scores deterministic ID, title, tag, category, and description matches and supports bounded filters. `inspect` returns one descriptor or one focused section. `metadata` validates the catalogue contract and exposes a normalized ID/tag/category index. `add` resolves a descriptor, safely copies matching source files and token CSS, writes an import barrel, and records the result in `.ovlira.json`.

Custom Elements Manifest is generated as runtime API metadata. Ovlira sidecar metadata owns design intent, composition rules, required states, and examples.

The generated app is intentionally ordinary Vite + TypeScript. Components register themselves when imported and use Shadow DOM; the host app owns page composition and global token styles. New projects receive a user-owned `src/styles/ovlira-theme.css` generated from the canonical token export; it is the intended customization surface for fonts, colours, radius, density, and related brand decisions. Add preserves that file on subsequent runs (and recognizes the v0.2 `ovlira-tokens.css` name). Add never overwrites a non-generated local file unless `--force` is explicit.
