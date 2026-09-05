# Codex evaluations

Ovlira includes a small live evaluator for testing the agent-facing workflow against the real local CLI. It is intentionally separate from `npm test`: ordinary tests stay offline and deterministic, while live evaluations spend Codex time only when explicitly requested.

## What it tests

Each scenario gives Codex a user request and only the compact results of an initial deterministic search. Codex returns a JSON plan with this shape:

```text
search → inspect → add
```

The runner validates the plan, initializes a temporary package-mode project, executes the plan through Ovlira's CLI implementation, runs `npm run ovlira -- check`, builds the generated project with `npm run build`, and records the result. Generated plans cannot execute arbitrary shell commands or mutate the repository. Temporary projects are removed unless `--keep` is passed.

Scenarios currently cover six domains and building-block decisions:

- choosing the settings recipe for a complete screen;
- choosing the input component for a focused field;
- choosing the empty-state recipe for an empty collection;
- choosing the search recipe for a project directory;
- choosing the CRUD-table recipe for a team directory; and
- choosing the detail recipe for a customer support screen.

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

Baseline on 2026-09-01: GPT-5.6 Luna selected the expected target in all six scenarios and passed every `search → inspect → add → check → build` run (6/6, 100%). A two-run repeatability pass also passed all 12 runs. The page-level scenarios included search, CRUD, and detail domains; the empty-state scenario also verified that the recipe was chosen when the primitive ranked first.

The runner records Codex CLI version, model, profile hash, latency, schema success, total input, cached input, uncached input, output, reasoning, and total tokens. Cached input is reported separately; it is not treated as proof that the prompt became smaller.

## Ovlira output budgets

The v0.3 release gate measures the serialized `stdout` emitted by the local CLI, separately from provider-reported Codex usage. It excludes the agent's system prompt, model reasoning, tool calls, and any setup output used only to create a temporary project. The deterministic checks live in [`src/evals/budgets.ts`](../src/evals/budgets.ts) and run as part of `npm test`.

The estimator counts UTF-8 bytes and rounds up at four bytes per estimated token. This is a stable regression proxy for the compact English metadata Ovlira emits; it is not a claim about any model provider's tokenizer. Budgets should change only when a measured task-success improvement justifies the additional context:

- default search: 700 estimated output tokens;
- focused inspect: 500;
- full inspect: 900; and
- a normal `search → focused inspect → add → check` workflow: 1,500 total.

The workflow assertion counts one JSON response from each command. Human visual approval and provider token reports remain separate exit criteria; generated-project build success is part of the evaluator result.

If authentication is available from an isolated Codex home, pass `--codex-home PATH`. Otherwise the runner preserves the normal Codex authentication location while suppressing unrelated context with `--ignore-user-config` and the compact profile flags.

## Structured specs and generated Vitest

The repository now includes a small structured-spec runner. The current checked-in specs are deterministic examples of the format a future Codex authoring step can produce. They run through the real CLI and can render into disposable Vitest files.

```bash
# Run the approved specs in-process.
npm run eval:specs

# Render reports/generated-tests/*.test.ts and execute those files with Vitest.
npm run eval:specs:vitest
```

### 1. Generate a structured test specification

The format is a versioned intermediate representation, not unrestricted model-written TypeScript:

```json
{
  "version": 1,
  "id": "recipe.empty-state-selection",
  "kind": "workflow",
  "prompt": "Choose the approved pattern for an empty records page with a create action.",
  "search": "empty state",
  "targetId": "state.empty",
  "targetKind": "recipe",
  "assertions": [
    { "type": "search.contains", "id": "state.empty", "kind": "", "ruleId": "", "expected": "" },
    { "type": "inspect.kind", "id": "state.empty", "kind": "recipe", "ruleId": "", "expected": "" },
    { "type": "check.exit", "id": "", "kind": "", "ruleId": "", "expected": "0" }
  ]
}
```

The schema is in [`src/evals/test-spec.schema.json`](../src/evals/test-spec.schema.json), and the offline catalogue is in [`src/evals/specs.json`](../src/evals/specs.json). Ovlira validates the shape and assertion semantics, restricts the assertion vocabulary, executes the setup using the real CLI, and scores the assertions. The blank fields on each assertion are deliberate: flat all-required objects are accepted by more structured-output providers and keep the response contract simple. v0.3 currently executes workflow specs; validator-specific setup is a later extension.

### 2. Render disposable Vitest files

Validated specifications render to `reports/generated-tests/` and run with `vitest run`. The renderer imports only Vitest and `runSpecById`; all CLI operations remain owned by Ovlira. The first assertion vocabulary covers catalogue search, inspect, check exit codes, and matching diagnostics. Required states and token-rule assertions can be added without changing the generated-file boundary.

### 3. Add adversarial coverage

Codex can generate negative cases for missing labels, duplicate primary actions, missing loading/empty/error states, unknown IDs, invalid nesting, and unapproved token literals. Each negative case must declare the stable diagnostic rule it expects, such as `actions.one-primary`.

### 4. Promote intentionally

Generated tests should run in temporary projects and remain disposable by default. A future promotion command may copy only passing, schema-valid tests into `tests/generated/`; it must never modify production code or silently change the repository.

This document records the bounded generated-test concept. The product [roadmap](./roadmap.md) keeps that capability in maintenance mode until the theme, recipe-quality, token-budget, and autonomy milestones require more evaluation infrastructure. Raw model-authored Vitest remains intentionally deferred: Codex may propose a structured spec later, but Ovlira must validate it before rendering or executing anything.

## Boundaries

This is an evaluation harness, not an autonomous code-modification loop. Codex authors a bounded plan; Ovlira executes and scores it. The first pass does not ask Codex to write arbitrary files, run package installation, or make repository changes. Browser-backed accessibility and visual checks remain separate future work.
