# 006 — Publish elements, generate compositions

## Question

Should a coding agent install individual components into an app with `init → add component`, or should Ovlira provide a runtime package and let the agent compose screens locally?

## Decision

Publish two packages:

- `@ovlira/elements` contains the human-authored Lit components, default theme, tokens, types, and an explicit `register-all.js` convenience entry.
- `@ovlira/cli` contains catalogue retrieval, recipe generation, and validation.

`ovlira add component.*` is an import-contract lookup. `ovlira add page.*` or `state.*` generates a local recipe module with direct component subpath imports and a local theme override. Projects use a v2 `.ovlira.json` manifest that records recipe IDs and generated paths.

The documented local invocation is `npm run ovlira -- <command>`. A project owns its composition and behavior; the package owns the approved component implementation.

## Why

The old source-copy design duplicated the design system into every prototype, made upgrades ambiguous, produced a generated registration barrel, and made “add one component” a surprisingly destructive operation. It optimized for source visibility at the cost of dependency hygiene and build behavior.

Explicit subpath imports give agents a small stable contract while allowing normal bundlers to remove unused components. Recipes remain local because page composition, domain data, actions, routing, and state are application work. A full registration entry remains available for demos and migration, but is not the generated default.

## Consequences

- This is intentionally breaking before public adoption: v0.2 copied projects are not silently migrated.
- New applications need both the CLI and elements package, normally as local npm dependencies.
- The CLI must keep package exports, generated imports, and manifest validation aligned.
- Theme customization remains local and token-based; component source is not the customization surface.
- Release CI must verify and publish both packages in dependency order.
