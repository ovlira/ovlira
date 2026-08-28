# Changelog

## 0.2.1 — CLI entrypoint fix

- Fixed `npx @ovlira/cli` and installed `ovlira` invocations by moving the executable to a dedicated entrypoint that works through npm's `.bin` symlink.

## 0.2.0 — initial public prototype

- Added ten Lit custom elements, design tokens, six recipes, and framework portability examples.
- Added deterministic catalogue search, focused inspection, source copying, and static validation.
- Added safe/idempotent `add` behavior with conflict detection and generated imports.
- Added offline and live Codex workflow evaluations with token and latency reports.
- Prepared the scoped npm distribution package as `@ovlira/cli`; the executable remains `ovlira`.
