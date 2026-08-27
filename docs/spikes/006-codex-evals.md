# Spike 006: live Codex evaluations

## Question

Can Codex test Ovlira's agent workflow in a token-efficient way while keeping reports reproducible and generated actions safe?

## Experiment

Inspected the installed `codex-cli 0.145.0` and compared non-interactive `codex exec --json` output with a compact configuration profile. The live profile used an ephemeral read-only workspace, an output schema, no project documents, and disabled skills, memories, apps, shell, browser, and other unrelated features. The response stream exposed `item.completed` agent text and `turn.completed` token usage.

The first smoke call used roughly 15k input tokens. The compact profile measured roughly 9k on the same tiny response in this environment. The exact value is environment/model dependent, so reports record uncached and cached input separately.

## Result

Direct `codex exec` provides a stable enough JSONL and output-schema interface for the first harness. The App Server profile is promising for future batched runs, but the current prototype favors the simpler installed CLI path and keeps the transport behind one runner boundary.

## Decision

Add a separate `src/evals/runner.ts` with three bounded scenarios. Codex returns only `search`, `inspect`, and `add` operations. Ovlira executes those operations in a temporary project, validates the generated plan against the scenario oracle, and finishes with `check`.

## Consequence for Ovlira

The project now has a repeatable offline eval for CI and an opt-in live eval/benchmark for measuring agent behavior, latency, schema reliability, and token usage. It can evolve toward App Server batching or browser-backed checks without making the normal CLI depend on a model or network.
