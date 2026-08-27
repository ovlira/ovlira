# Spike 005 — Obvious DOM property bindings

## Question

Can the validator understand required properties assigned in TypeScript/JavaScript instead of only attributes?

## Experiment

Used the TypeScript compiler API to collect `document.createElement('ov-*')` and `document.querySelector('ov-*')` variables, then tracked direct assignments such as `field.label = value`.

## Result

This catches the common property-binding pattern without requiring a full framework parser. It does not attempt to resolve arbitrary aliases, control flow, or framework compiler transforms.

## Decision

Use the AST pass as a narrow supplement to the existing static markup checks. Keep full HTML/JSX/Vue parsing and browser-backed accessibility checks as the next layer.

## Consequence for Ovlira

Property-backed APIs such as `ov-select.options` and required labels can be used naturally in generated TypeScript without immediate false positives.
