# Spike 007: runtime DOM contract

## Question

What is the smallest useful runtime validation surface before Ovlira adds a browser runner?

## Experiment

Implemented `validateRuntimeDocument(root, options)` as a pure DOM adapter contract and exercised it with jsdom. The contract checks accessible names for native controls and Ovlira form hosts, heading order, required recipe state markers, one-primary-action regions, and an injected set of registered custom-element tags.

## Result

The checks can use stable Ovlira rule IDs without knowing how an app was built. Shadow DOM internals remain intentionally outside this first contract; Ovlira components expose their label and state intent on the host, while a future browser adapter can add shadow-root inspection where needed.

## Decision

Keep runtime rules pure and dependency-free in `src/validator/runtime.ts`. Do not add Playwright or start a browser from `ovlira check` yet.

## Consequence for Ovlira

The next browser integration can render a local Vite app, collect the document and registered tags, then feed them into the same rule vocabulary. The current CLI remains fast, offline, and deterministic; runtime tests prove the contract without claiming to prove browser behavior.
