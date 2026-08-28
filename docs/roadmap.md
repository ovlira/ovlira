# Roadmap

## v0.2 delivered

- Versioned metadata contract with runtime validation and a normalized registry index.
- Idempotent `add` with conflict protection, `--force`, `--entry`, and a generated import barrel.
- Bounded search filters and focused inspect sections with structured JSON errors.
- AST-aware recognition of obvious DOM property assignments.
- Additional token literal checks and fixture coverage.

## Living roadmap: Codex-generated tests

The next evaluation layer should let Codex discover gaps in Ovlira and author regression tests for agent behaviour. The safe boundary is important: Codex proposes a bounded test, while Ovlira validates and executes it. Generated work must not be allowed to run arbitrary shell commands, access the network, modify production code, or silently change the repository.

### Current: bounded workflow evaluations

- Codex returns a schema-constrained `search → inspect → add` plan.
- Ovlira executes the plan in a temporary project and runs `ovlira check`.
- Reports include pass/fail, schema success, CLI/model, profile hash, latency, cached input, uncached input, output, reasoning, and total tokens.
- Offline replay keeps the executor and assertions testable without Codex or network access.

### Current: structured test specifications

- `src/evals/test-spec.schema.json` defines a flat, versioned, provider-friendly contract.
- `src/evals/spec-runner.ts` validates specs and executes only approved assertion types through the real CLI.
- `npm run eval:specs` runs the checked-in specs offline.
- `npm run eval:specs:vitest` renders disposable files under `reports/generated-tests/` and executes them with Vitest.

### Next: Codex-authored specifications

Ask Codex for a compact test specification rather than unrestricted TypeScript:

```json
{
  "version": 1,
  "id": "recipe.empty-state-selection",
  "kind": "workflow",
  "prompt": "Choose a pattern for an empty records page",
  "setup": { "search": "empty collection with create action" },
  "assertions": [
    { "type": "search.contains", "id": "state.empty" },
    { "type": "inspect.kind", "id": "state.empty", "kind": "recipe" },
    { "type": "check.exit", "expected": 0 }
  ]
}
```

The specification becomes a small intermediate representation with a versioned schema. Ovlira owns the assertion vocabulary and executes it through the existing CLI, which keeps results deterministic and makes generated tests easy to reject or revise. The next implementation step is to add a Codex call that returns this schema, reusing the existing token and latency reporting, while keeping offline replay as the default CI path.

### Following: Vitest generation

Render validated specifications into disposable files such as:

```text
reports/generated-tests/<run-id>/empty-state-selection.test.ts
```

The current renderer imports only approved Ovlira and Vitest helpers, then runs the generated file with `vitest run`. Extend it to cover required states, token rules, and token-budget assertions. Generated files should be kept for inspection only when `--keep` or `--report` is requested.

### Later: adversarial tests and promotion

- Ask Codex for negative cases: missing labels, duplicate primary actions, missing recipe states, unknown IDs, disallowed nesting, and unapproved token literals.
- Require each negative test to declare an expected stable rule ID, for example `actions.one-primary`.
- Run generated tests in an isolated temporary project with no package installation or network access.
- Add an explicit promotion command that copies only passing, schema-valid tests into `tests/generated/`.
- Never promote or modify repository code automatically.

### Benchmark questions

- Which catalogue descriptions lead agents to the intended recipe or component?
- Does focused metadata reduce uncached input tokens?
- Which prompts produce reliable plans and schema-valid tests?
- Do metadata or validator changes improve agent success without increasing context cost?

See [`docs/ai-evals.md`](./ai-evals.md) for the current evaluator and the proposed generated-test workflow.

## Next

- Add a local browser/Vite adapter that feeds rendered documents into the runtime DOM contract in [`docs/spikes/007-runtime-dom-contract.md`](./spikes/007-runtime-dom-contract.md).
- Parse HTML/JSX/Vue templates with ASTs for fewer false positives.
- Add fixture-level recipe state contracts and component versioning.

## Later

- Optional local registry overrides and project-specific approved patterns.
- More recipes for navigation, onboarding, and responsive data workflows.
- Better framework type helpers generated from CEM.

## Intentionally not built

Ovlira v0.1 has no visual editor, canvas, drag-and-drop, collaboration, hosted service, backend, authentication, MCP server, change tracking, semantic/vector search, or automatic Lit-to-React/Vue/Angular conversion.
