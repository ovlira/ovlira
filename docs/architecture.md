# Architecture

Ovlira is a pair of local npm packages: `@ovlira/cli` provides retrieval, recipe generation, and validation; `@ovlira/elements` provides the runtime web components and default theme. There is no server, database, auth, or MCP layer. The executable remains `ovlira` so agent instructions and project workflows stay short.

The catalogue is a designer-to-agent handoff boundary. Human designers own the visual and behavioural contracts of components, recipes, and the default theme. Coding agents retrieve those contracts progressively, then own domain adaptation, state wiring, application logic, and deterministic repair. Ovlira does not ask a model to design or restyle its base components.

```text
packages/elements    published Lit runtime implementations and theme assets
src/catalogue        compact component and recipe descriptors
src/recipes           canonical recipe fixtures and shared layout
src/cli               deterministic CLI and static validator
examples/frameworks   portability snippets
```

The registry is bundled JSON. `search` scores deterministic ID, title, tag, category, and description matches and supports bounded filters. `inspect` returns one descriptor or one focused section. `metadata` validates the catalogue contract and exposes a normalized ID/tag/category index.

`add` resolves a descriptor. For a component it returns the stable tag/import contract without changing the application. For a recipe it writes a local composition module with explicit imports from `@ovlira/elements`, a local theme override, and a manifest entry. It never copies component implementations or generates a shared registration barrel.

Custom Elements Manifest is generated as runtime API metadata. Ovlira sidecar metadata owns design intent, composition rules, required states, and examples.

The generated app is intentionally ordinary Vite + TypeScript. Components register themselves when imported and use Shadow DOM; the host app owns page composition and global token styles. New projects receive `@ovlira/elements` as a dependency and a user-owned `src/styles/ovlira-theme.css` override. Explicit component subpath imports let the bundler tree-shake unused elements; the full `register-all.js` entry is opt-in. Add preserves the theme and application files on subsequent runs and never overwrites a non-generated local file unless `--force` is explicit.
