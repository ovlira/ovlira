# Roadmap

## Mission

Ovlira helps coding agents produce well-designed, consistent, local UI prototypes with as little model context as practical.

The product is a compact catalogue of human-designed components and screen recipes, a global theme contract, a deterministic retrieval workflow, and checks that keep generated prototypes inside those contracts. It is not an AI designer. It should remove visual invention from the agent's workload, then let the agent work autonomously on composition, content, data, state, interaction, and application code.

The shortest useful workflow remains:

```text
search → inspect → add → adapt → check
```

## Division of responsibility

Human designers own the decisions that require taste:

- the default visual language;
- component anatomy, states, responsive behaviour, and interaction details;
- recipe composition and hierarchy;
- semantic theme tokens and their default values; and
- visual acceptance of every catalogue addition.

Coding agents own the work that can be derived from those decisions:

- choosing and retrieving the smallest suitable recipe or component;
- adapting domain copy, data, routes, and actions;
- wiring loading, empty, error, success, and interactive states;
- implementing application logic and local integrations;
- applying a project theme through the global configuration surface; and
- building, checking, and repairing the prototype without redesigning base components.

This boundary is a product constraint. Ovlira should make the approved path easier than asking an agent to invent or perfect UI.

Agents must not choose or revise palette, typography, radius, density, motion, or other front-end visual direction. When a fixture fails visual review, the agent records the defect and continues with behavior, accessibility, composition, validation, and release work until a designer supplies an approved visual contract.

## What counts as an Ovlira prototype

A successful prototype is ordinary local frontend source that:

- starts from an approved recipe when one fits;
- uses only the components needed for the task;
- can change its font, colours, radius, and related brand decisions from one global theme surface;
- contains real, switchable states required by the selected recipe;
- can be adapted across domains without a domain-specific component fork;
- passes `ovlira check`; and
- remains understandable and editable after Ovlira has finished.

Ovlira does not need to generate production backends, solve deployment, or provide a visual editor for this definition to be useful.

## Current position: v0.2

The initial release proves the technical vertical slice:

- one local npm package with no server or model dependency;
- twenty-nine Lit components and six domain-neutral recipes;
- bounded catalogue search and focused inspection;
- source copying with conflict protection and explicit local ownership;
- global CSS custom properties for the initial palette and typography;
- static and runtime-facing validation contracts; and
- offline and opt-in live evaluations with token reporting.

The important gaps are product gaps rather than missing infrastructure:

- the default theme contract and authored reference are now explicit, but the separate designer-supplied contrasting theme is still outstanding;
- the twenty-nine components now consume the semantic theme surface, while intentional structural CSS remains component-owned;
- the six canonical recipe fixtures now share markup between generation and review and have deterministic interaction, accessibility, responsive, and screenshot checks;
- the consolidated review app covers all six fixtures and generated starters expose the same baseline action seams;
- the designer contribution checklist and visual approval mechanism exist, but the current candidate baselines still need human sign-off; and
- token usage is reported by evaluations, and deterministic CLI response budgets are now enforced in CI; provider token accounting remains a separate measurement.

The existing generated-spec and runtime-validation work remains useful test infrastructure. Expanding it is not the product priority until these gaps are closed.

## Now: v0.3 — make the existing promise real

No further net catalogue growth is planned for this phase. Improve the twenty-nine components and six recipes already shipped.

### 1. Establish the theme contract

- Generate one clearly named, user-owned theme file for semantic colour, typography, radius, elevation, and density decisions.
- Keep resets and structural global styles separate from theme values and recipe-specific layout.
- Make every catalogue component consume the documented semantic theme surface for brand-level decisions.
- Remove or promote visual literals that prevent a global restyle; keep purely structural implementation details inside the human-authored component.
- Have a designer provide the default theme and one deliberately contrasting reference theme; the agent only wires the token contract and verifies that it applies globally.
- Prove that changing font, palette, radius, and density requires no component-source edits.
- Preserve the user's theme when components or recipes are added again.

### 2. Finish the existing recipes

- Give every current recipe a complete runnable starting screen rather than a generic placeholder.
- Define the content regions, actions, data seams, and state seams an agent is expected to adapt.
- Implement baseline local interactions: settings can save and acknowledge changes, search filters the sample results, collection recipes can create a record, detail can edit its identity, and shell navigation changes the active screen context.
- Keep loading, empty, error, and success examples switchable for review while making the success path observable through an action.
- Keep recipes domain-neutral: settings, search, CRUD, detail, empty state, and application shell should work for many products through copy and data changes.
- Review every recipe at narrow, medium, and wide widths with a human designer.

### 3. Consolidate visual review

- Maintain one Vite review app for all six recipes instead of one app per fixture.
- Let reviewers switch recipes and required states without rebuilding or changing directories; apply a contrasting theme only from a designer-supplied artifact.
- Keep the review app as harness infrastructure; do not let it become a second design system or a replacement for generated starter output.
- Build the review app in the release check so visual-review infrastructure cannot silently drift from the catalogue.

### 4. Encode the designer-to-agent handoff

- Add a small contribution checklist covering anatomy, variants, states, accessibility, responsive behaviour, tokens, metadata, examples, and visual approval.
- Require a human-approved reference fixture before a component or recipe enters the catalogue.
- Keep agent-facing descriptors about usage and composition, not visual brainstorming.
- Treat the source implementation as the approved design; expose deliberate customization through theme tokens, properties, slots, and parts.

### 5. Turn token efficiency into a release gate

- Measure only Ovlira-provided context separately from the coding agent's system prompt and tool overhead.
- Keep search results bounded and make focused inspection the documented default.
- Add regression tests for serialized search, inspect, add, and check response sizes.
- Use these initial v0.3 budgets:
  - default search response: at most 700 output tokens;
  - focused inspect response: at most 500 output tokens;
  - full inspect response: at most 900 output tokens; and
  - a normal `search → focused inspect → add → check` path: at most 1,500 Ovlira output tokens.
- Revise a budget only with a measured task-success improvement, not because metadata was convenient to add.

CI enforces these limits with the deterministic UTF-8 estimate documented in [`docs/ai-evals.md`](./ai-evals.md). It measures only serialized Ovlira command output, so model/provider usage and setup work cannot be mistaken for product response size.

### v0.3 exit criteria

- All six recipe fixtures are human-approved at three representative widths, following the [human visual review protocol](./visual-review.md).
- A designer-supplied contrasting theme changes the full visual character of all fixtures without component edits.
- Every recipe has baseline observable interactions, real switchable required states, and passes `ovlira check`.
- The single review app builds in CI and covers all six fixtures without per-recipe Vite projects.
- The workflow token budgets pass in CI.
- With project dependencies present, a fresh `init → add recipe → build → check` run succeeds without Ovlira invoking a model or network service.

## Next: v0.4 — prove bounded agent autonomy

Use the completed catalogue to prove that agents can build different prototypes without falling back to visual invention.

### 1. Make adaptation explicit

- Return the selected recipe's content regions, state obligations, and supported extension points through focused inspection.
- Give generated recipes obvious seams for domain data, copy, actions, and navigation.
- Make validation distinguish a real state implementation from a marker added only to silence the checker where this can be done deterministically.
- Keep repair guidance concise and tied to stable rule IDs.

### 2. Benchmark the real workflow

- Maintain a small, fixed scenario suite spanning different domains while reusing the same recipes.
- Score recipe selection, Ovlira-provided tokens, successful build/check, required-state completion, and component-source edits.
- Require at least 90% success across the fixed suite before v1; failures should improve a recipe, descriptor, or rule rather than grow the prompt.
- Treat edits to base component CSS as a failed default path unless the task explicitly requires a new design.

### 3. Make repeated use safe

- Preserve project theme, content, logic, and intentional local changes across repeated `add` operations.
- Report catalogue/version drift without silently overwriting project files.
- Document a small, explicit upgrade path for prototypes that want newer approved sources.

### v0.4 exit criteria

- The fixed autonomy suite meets the success target and v0.3 token budgets.
- The same recipe is demonstrably reusable in at least three unrelated domains through content and data adaptation alone.
- Re-running Ovlira in an adapted prototype does not lose theme or application work.
- The agent completes the benchmark without being asked to improve the catalogue's visual design.

## Then: v1.0 — freeze a small, dependable catalogue

Catalogue growth begins only after v0.4 evidence shows a missing building block repeatedly blocks otherwise valid prototypes.

- Stabilize a v1 core catalogue of twenty interaction components and ten recipes; keep the already-shipped composition and page-building helpers compatible as supporting entries.
- Prefer completing a current recipe over adding a new category.
- Add no domain-specific packs; domain range should come from composition, copy, data, and theming.
- Stabilize the theme, descriptor, manifest, and diagnostic schemas with documented compatibility rules.
- Publish one clear end-to-end guide for Codex, Claude Code, and other shell-capable coding agents without introducing agent-specific runtime dependencies.
- Release v1 only when every included item has human visual approval and every recipe meets the same theme, state, responsive, token, and autonomy gates.

### Admission gate for a new catalogue item

Every proposed component or recipe must satisfy all of these conditions:

1. It is required by at least two accepted benchmark scenarios or has blocked three reviewed prototypes.
2. Existing catalogue items cannot express the need without an accessibility or interaction compromise.
3. A human designer supplies or approves the complete visual and behavioural contract.
4. Its metadata fits the established token budgets.
5. It fits the v1 core target or replaces a less useful item; supporting composition entries remain compatible with the recipes that use them.

## Work that is maintained but not expanded on the critical path

- live Codex evaluation transport;
- structured generated-test specifications;
- the pure runtime DOM validation adapter;
- framework portability examples; and
- release automation.

These should remain reliable. They move back onto the active roadmap only when they are the smallest way to satisfy a theme, quality, token, or autonomy exit criterion.

## Intentionally outside the roadmap

- an AI model inside Ovlira;
- autonomous visual design or component styling by coding agents;
- a Figma replacement, canvas, drag-and-drop editor, or screenshot-to-code system;
- hosted accounts, collaboration, authentication, backend generation, or deployment;
- an MCP server or semantic/vector search without measured evidence that the local CLI cannot meet the token budget;
- unrestricted model-authored code or test execution;
- automatic framework conversion or a package per framework;
- an open-ended component marketplace; and
- domain-specific design systems.

Requests in this list require an explicit change to Ovlira's mission, not merely another roadmap item.

## Roadmap decision rule

Work enters the roadmap only when it directly improves at least one of four outcomes: fewer Ovlira-provided tokens, higher human-approved visual quality, more consistent prototypes, or greater agent autonomy inside the approved contracts. It must preserve the other three or make the trade-off measurable and explicit.
