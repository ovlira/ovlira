# Codex evaluations

Ovlira includes a small live evaluator for testing the agent-facing workflow against the real local CLI. It is intentionally separate from `npm test`: ordinary tests stay offline and deterministic, while live evaluations spend Codex time only when explicitly requested.

## What it tests

Each scenario gives Codex a user request and only the compact results of an initial deterministic search. Codex returns a JSON plan with this shape:

```text
search → inspect → add
```

The runner validates the plan, initializes a temporary project, executes the plan through Ovlira's CLI implementation, runs `ovlira check`, and records the result. Generated plans cannot execute arbitrary shell commands or mutate the repository. Temporary projects are removed unless `--keep` is passed.

Scenarios currently cover:

- choosing the settings recipe for a complete screen;
- choosing the input component for a focused field;
- choosing the empty-state recipe for an empty collection.

Scenario contracts live in [`src/evals/scenarios.json`](../src/evals/scenarios.json). The Codex response contract lives in [`src/evals/codex-plan.schema.json`](../src/evals/codex-plan.schema.json).

## Commands

```bash
# Exercise the executor and assertions without a Codex call.
npm run eval:codex:offline

# Run every scenario once with Codex.
npm run eval:codex

# Run one scenario and emit a machine-readable report.
npm run eval:codex -- --scenario settings-recipe --json --report reports/settings.json

# Repeat every scenario for a small benchmark.
npm run benchmark:codex -- --runs 3 --report reports/baseline.json
```

The live mode uses `codex exec` with an ephemeral read-only workspace, a strict output schema, no project documents, no skills/memories/apps, and no shell or browser tools. The profile hash is recorded in every report so later comparisons can distinguish prompt/config changes from model changes.

The runner records Codex CLI version, model, profile hash, latency, schema success, total input, cached input, uncached input, output, reasoning, and total tokens. Cached input is reported separately; it is not treated as proof that the prompt became smaller.

If authentication is available from an isolated Codex home, pass `--codex-home PATH`. Otherwise the runner preserves the normal Codex authentication location while suppressing unrelated context with `--ignore-user-config` and the compact profile flags.

## Living plan: generated Vitest

The current runner asks Codex for a bounded plan. The next layer can ask Codex to author regression tests for agent behaviour, while keeping execution deterministic and safe.

### 1. Generate a structured test specification

The first format should be a versioned intermediate representation, not unrestricted model-written TypeScript:

```json
{
  "version": 1,
  "id": "recipe.empty-state-selection",
  "kind": "workflow",
  "setup": { "search": "empty collection with create action" },
  "assertions": [
    { "type": "search.contains", "id": "state.empty" },
    { "type": "inspect.kind", "id": "state.empty", "kind": "recipe" },
    { "type": "check.exit", "expected": 0 }
  ]
}
```

Ovlira would validate the schema, restrict the assertion vocabulary, execute the setup using the real CLI, and score the assertions. This gives Codex a useful authoring role without allowing generated shell commands, network requests, arbitrary imports, or repository edits.

### 2. Render disposable Vitest files

Validated specifications can be rendered to `reports/generated-tests/<run-id>/` and run with `vitest run`. The renderer should initially support search/inspect/add workflows, expected diagnostics, required recipe states, token rules, and token-budget assertions. It should import only approved Ovlira and Vitest helpers.

### 3. Add adversarial coverage

Codex can generate negative cases for missing labels, duplicate primary actions, missing loading/empty/error states, unknown IDs, invalid nesting, and unapproved token literals. Each negative case must declare the stable diagnostic rule it expects, such as `actions.one-primary`.

### 4. Promote intentionally

Generated tests should run in temporary projects and remain disposable by default. A future promotion command may copy only passing, schema-valid tests into `tests/generated/`; it must never modify production code or silently change the repository.

This plan is tracked as a living roadmap in [`docs/roadmap.md`](./roadmap.md). The existing offline evaluator is the first implementation step; raw model-authored Vitest remains intentionally deferred until the structured specification and safety checks exist.

## Boundaries

This is an evaluation harness, not an autonomous code-modification loop. Codex authors a bounded plan; Ovlira executes and scores it. The first pass does not ask Codex to write arbitrary files, run package installation, or make repository changes. Browser-backed accessibility and visual checks remain separate future work.
