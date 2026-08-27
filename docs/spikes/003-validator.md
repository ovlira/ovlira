# Spike 003 — Small validator

## Question

What is the smallest useful validator architecture?

## Experiment

Implemented a filesystem walker plus deterministic source checks: known tags, required props, disallowed nesting, recipe state markers, one primary action per marked region, literal color allow-listing, and basic heading order.

## Result

These checks catch common agent mistakes without needing a browser or a full HTML/TypeScript compiler. Regex-based checks are intentionally scoped to obvious source-level patterns.

## Decision

Keep the validator static and conservative. Emit stable rule IDs and explain what the check cannot prove.

## Consequence for Ovlira

`ovlira check` is useful in local CI and before handoff, while visual review, runtime state transitions, and complex template semantics remain outside v0.1.
