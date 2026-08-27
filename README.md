# Ovlira 0.2

Ovlira is a local, agent-first UI prototyping and design-system toolkit for Codex and Claude Code. It gives coding agents a small catalogue of real Lit components, page recipes, design tokens, and static guardrails without sending an entire design system into context.

The prototype is CLI-first, deterministic, and local. It is not Figma, a visual editor, a hosted service, a backend, or an MCP server.

## Why it exists

Agents are good at composing interfaces but often spend context inventing controls, miss accessible labels, or create inconsistent states. Ovlira makes the useful path short:

```text
search → inspect → add → compose → check
```

## Install and run

Requirements: Node.js 20.19+ and npm.

```bash
npm install
npm test
npm run build
npm run manifest
```

To install the published CLI:

```bash
npm install -g @ovlira/cli
ovlira --version
```

The npm package is scoped to the `ovlira` organization, but the executable remains `ovlira`. To use the CLI from this checkout after building:

```bash
npm install -g .
ovlira search "settings page" --json
```

Or call `node dist/cli/index.js` directly while developing this repository.

## Agent workflow

```bash
ovlira search "settings page" --json
ovlira inspect page.settings --json
ovlira init ./workspace-ui
ovlira add page.settings --cwd ./workspace-ui
cd workspace-ui
npm install
npm run build
ovlira check --json
```

`search` returns at most eight compact results. `inspect` returns one full descriptor. `add` copies only the recipe's component source, token CSS, and a runnable example into the project. The generated project is ordinary Vite + TypeScript and can be changed locally.

For a catalogue overview, use `ovlira list` or `ovlira list --json`.

## Catalogue

The initial catalogue contains:

- Components: `ov-button`, `ov-input`, `ov-select`, `ov-badge`, `ov-card`, `ov-alert`, `ov-page-header`, `ov-empty-state`, `ov-data-table`, and `ov-application-shell`.
- Recipes: `page.settings`, `page.search`, `page.crud-table`, `page.detail`, `state.empty`, and `shell.application`.

Component descriptors keep runtime API metadata separate from Ovlira guidance. For example:

```bash
ovlira inspect ov-input --json
ovlira inspect page.settings --json
```

Runtime API metadata is generated to [`custom-elements.json`](./custom-elements.json) with Custom Elements Manifest. Ovlira-specific use/avoid rules, required states, composition constraints, and examples live in [`src/catalogue`](./src/catalogue).

Use `ovlira metadata --json` to validate the catalogue contract and inspect the normalized ID/tag/category index. Use `inspect --section api|guidance|example` to retrieve only the part an agent needs.

## Tokens

Tokens are understandable JSON plus CSS custom properties:

```bash
ovlira tokens --format json
ovlira tokens --format css
```

The generated app imports `src/styles/ovlira-tokens.css`. Use `--ov-*` values rather than arbitrary colors, spacing, or typography literals.

## Validation

`ovlira check` reports human-readable diagnostics by default and versioned JSON with `--json`. The first validator catches:

- unknown `ov-*` tags;
- missing required labels, titles, and table captions;
- metadata-defined invalid nesting;
- missing recipe loading, empty, error, or success markers;
- multiple primary buttons in a marked task region;
- detectable unapproved literal colors;
- basic heading hierarchy problems.

Diagnostics include a stable rule ID, severity, file and line where practical, and a suggested fix. It is intentionally a source-level check: it does not prove visual quality, runtime state transitions, browser behavior, or every accessibility concern.

The v0.2 validator also understands obvious TypeScript/JavaScript DOM property assignments and checks more token literal categories. `ovlira add` is idempotent, writes `src/ovlira.generated.ts`, supports `--entry`, and preserves local edits unless `--force` is used.

## Live Codex evaluations

The repository includes an opt-in evaluator that asks Codex for a compact `search → inspect → add` plan, executes that plan against a temporary project, and runs the real Ovlira checker. It cannot execute arbitrary generated shell commands or modify this repository.

```bash
npm run eval:codex:offline
npm run eval:codex -- --scenario settings-recipe --json --report reports/settings.json
npm run benchmark:codex -- --runs 3 --report reports/baseline.json
```

See [`docs/ai-evals.md`](./docs/ai-evals.md) for the scenario contract, safety boundary, token fields, and benchmark interpretation.

## Releases

The repository publishes one package, [`@ovlira/cli`](https://www.npmjs.com/package/@ovlira/cli), with the `ovlira` executable. Run the release checks before publishing:

```bash
npm run release:check
```

The first public scoped publish uses `npm publish --access public`. Later releases are intended to come from a GitHub Release through the provenance workflow in [`.github/workflows/publish.yml`](./.github/workflows/publish.yml). See [`docs/releasing.md`](./docs/releasing.md) for the npm organization and trusted-publisher setup.

## Framework portability

The component layer is standard custom elements, so Lit and plain HTML consume it directly. Minimal React, Vue, and Angular examples are in [`examples/frameworks`](./examples/frameworks). The portability boundary is honest: string attributes are simple, while arrays and objects should be assigned as DOM properties; Vue needs custom-element compiler configuration; Angular needs `CUSTOM_ELEMENTS_SCHEMA`; React may need a ref/effect bridge for non-string props and dashed events.

## Repository map

```text
src/components    Lit implementations and TypeScript types
src/catalogue     compact component/recipe descriptors
src/tokens        token JSON and CSS export
src/cli           CLI, local registry, and validator
docs              decisions, spikes, architecture, workflow, metadata, validation, roadmap
examples          component/recipe snippets and framework portability examples
tests              unit, CLI, vertical-slice, and valid/invalid fixtures
```

## Current limitations

This first pass has no visual editor, canvas manipulation, drag-and-drop, change tracking, collaboration, hosted service, authentication, backend, MCP server, semantic/vector search, or automatic Lit-to-React/Vue/Angular conversion. The validator uses conservative static checks. A future version can add AST and browser-backed checks without changing the local CLI workflow.
