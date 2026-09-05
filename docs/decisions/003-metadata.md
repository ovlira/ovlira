# 003 — CEM plus Ovlira sidecar

## Question

Can Custom Elements Manifest be the complete agent-facing metadata format?

## Experiment

Added JSDoc-friendly Lit APIs and a CEM analyzer configuration, then compared the runtime API shape with the extra usage constraints required by recipes and validation.

## Result

CEM is a useful base for tags, properties, slots, events, parts, and CSS properties. It does not express Ovlira-specific intent, forbidden composition, required states, or approved recipes cleanly.

## Decision

Generate `packages/elements/custom-elements.json` for runtime API metadata and supplement it with compact Ovlira descriptors in `src/catalogue/*.json`.

## Consequence for Ovlira

Agents can retrieve a small descriptor first and consult CEM or source only when they need implementation-level API detail.
