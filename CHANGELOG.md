# Changelog

## Unreleased

## 0.3.0 — complete theme and catalogue foundation

- Added the approved warm-paper contrasting theme, wired it into the recipe and authored-reference harnesses, and digest-bound its approved evidence across all fixtures, states, and required viewports.
- Added a catalogue-driven component visual-review matrix with focused light, dark, narrow, and public-state captures for all shipped components. The approved images are digest-bound in the manifest and included in the release gate.
- Added `ov-date-input`, `ov-stepper`, and `ov-drawer` with native date, workflow, and side-panel semantics, examples, CLI starters, and marketing previews. Visual baselines are approved.
- Added `ov-number-input`, `ov-popover`, and `ov-tree` for bounded numeric entry, contextual surfaces, and nested resource navigation, with catalogue contracts, examples, CLI starters, and marketing previews. Visual baselines are approved.

- Added `ov-accordion`, `ov-slider`, and `ov-file-upload` with native disclosure, range, and file-picker semantics, examples, CLI starters, and marketing previews. Visual baselines are approved.

- Added `ov-tooltip`, `ov-avatar`, and `ov-breadcrumbs` with property-backed APIs, accessible interaction and identity semantics, examples, CLI starters, and marketing previews. Visual baselines are approved.

- Added `ov-tabs`, `ov-toast`, `ov-progress`, and `ov-skeleton` with property-backed APIs, native interaction semantics, examples, CLI starters, and marketing previews. Visual baselines are approved.

- Added `ov-spinner`, `ov-menu`, `ov-pagination`, and `ov-combobox` with property-backed APIs, native interaction semantics, examples, CLI starters, and marketing previews. Visual baselines are approved.

- Added `ov-textarea`, a token-aware labelled multiline field with native form semantics, help/error messaging, and input events.
- Added `ov-checkbox`, a labelled native boolean field with checked, required, disabled, and help/error states.
- Added `ov-radio-group`, a labelled native single-choice field with property-assigned options, required, disabled, and help/error states.
- Added `ov-toggle`, a compact native switch for immediate boolean settings with checked, disabled, and help/error states.
- Added `ov-dialog`, a native dialog with explicit open/modal semantics, accessible heading and description, dismissible behavior, and action/body slots.
- Made recipe adaptation explicit: focused guidance now returns content regions and supported data, action, and navigation extension points, and generated starters preserve those seams in their markup.
- Removed the unsupported `package-manager-cache` publish-workflow input.

## 0.2.2 — project safety and release hardening

- Hardened `add` with conflict preflight so failed operations do not partially update a project manifest or generated files.
- Added deterministic errors for unknown and invalid CLI options.
- Scoped heading diagnostics to each source entry and added generated-project build coverage for every recipe.
- Centralized the CLI and evaluator version lookup from `package.json`.
- Added a user-owned `src/styles/ovlira-theme.css` to newly generated projects.
- Preserved customized theme files across repeated `add` operations and recognized the v0.2 `ovlira-tokens.css` filename.
- Replaced generic recipe placeholders with complete, state-switchable starter screens for all shipped recipes.
- Documented the designer-to-agent boundary and replaced the evaluation-led roadmap with bounded v0.3, v0.4, and v1 milestones.
- Added deterministic CI checks for the v0.3 Ovlira response budgets, covering search, focused/full inspect, and the normal discovery workflow.
- Added a focused human visual review protocol for approving all six recipe starters across widths, states, keyboard access, and a contrasting theme.
- Added one consolidated Vite behavior-review app with recipe navigation, state controls, and baseline local interactions; per-recipe review apps are no longer required.
- Added the same baseline action seams to generated recipe starters, including search filtering, collection creation, detail editing, empty-state completion, and shell navigation.

## 0.2.1 — CLI entrypoint fix

- Fixed `npx @ovlira/cli` and installed `ovlira` invocations by moving the executable to a dedicated entrypoint that works through npm's `.bin` symlink.

## 0.2.0 — initial public prototype

- Added ten Lit custom elements, design tokens, six recipes, and framework portability examples.
- Added deterministic catalogue search, focused inspection, source copying, and static validation.
- Added safe/idempotent `add` behavior with conflict detection and generated imports.
- Added offline and live Codex workflow evaluations with token and latency reports.
- Prepared the scoped npm distribution package as `@ovlira/cli`; the executable remains `ovlira`.
