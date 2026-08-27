# 005 — v0.2 contracts and safe integration

## Question

What should become reliable before Ovlira grows its catalogue?

## Experiment

Added a metadata contract report, a normalized registry index, a TypeScript AST pass for obvious DOM property assignment, safe file writes, explicit entry selection, and repeated-add tests.

## Result

The original flow was useful for clean projects but could overwrite local component edits and could not express focused agent queries.

## Decision

Treat metadata, generated files, and JSON output as explicit contracts. Preserve local edits by default; make replacement opt-in with `--force`.

## Consequence for Ovlira

Agents can use Ovlira repeatedly inside an evolving project without losing local work or requesting more catalogue context than needed.
