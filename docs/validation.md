# Validation

The first validator is a static source check. It scans project source files while ignoring `node_modules`, generated `dist`, and copied Ovlira component implementations. TypeScript/JavaScript files also receive a small AST pass so obvious DOM property assignments such as `field.label = 'Name'` are understood.

Rules currently implemented:

- `project.not-initialized` — missing `.ovlira.json`.
- `component.unknown` — unknown `ov-*` tags.
- `component.required-prop` — missing required `label`, `title`, or `caption` markers.
- `composition.disallowed-child` — metadata-defined invalid nesting.
- `recipe.required-state` — missing recipe state markers.
- `actions.one-primary` — more than one primary button in a marked region.
- `tokens.unapproved-literal` — detectable literal colors, spacing, radius, and type values outside the token export.
- `a11y.heading-start` and `a11y.heading-jump` — basic heading order issues.

Diagnostics include a severity, stable rule ID, file, line where practical, and a suggested fix. The checks do not prove visual quality, contrast in every rendered state, keyboard behavior across browsers, or dynamic state transitions hidden behind arbitrary JavaScript.
