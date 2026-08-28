# Changelog

## Unreleased

- Added a user-owned `src/styles/ovlira-theme.css` to newly generated projects.
- Preserved customized theme files across repeated `add` operations and recognized the v0.2 `ovlira-tokens.css` filename.
- Replaced generic recipe placeholders with complete, state-switchable starter screens for all shipped recipes.
- Documented the designer-to-agent boundary and replaced the evaluation-led roadmap with bounded v0.3, v0.4, and v1 milestones.

## 0.2.1 — CLI entrypoint fix

- Fixed `npx @ovlira/cli` and installed `ovlira` invocations by moving the executable to a dedicated entrypoint that works through npm's `.bin` symlink.

## 0.2.0 — initial public prototype

- Added ten Lit custom elements, design tokens, six recipes, and framework portability examples.
- Added deterministic catalogue search, focused inspection, source copying, and static validation.
- Added safe/idempotent `add` behavior with conflict detection and generated imports.
- Added offline and live Codex workflow evaluations with token and latency reports.
- Prepared the scoped npm distribution package as `@ovlira/cli`; the executable remains `ovlira`.
