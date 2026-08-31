# Validation

The first validator is a static source check. It scans project source files while ignoring `node_modules`, generated `dist`, copied Ovlira component implementations, and the user-owned `src/styles/ovlira-theme.css` (or legacy `ovlira-tokens.css`) theme file. TypeScript/JavaScript files also receive a small AST pass so obvious DOM property assignments such as `field.label = 'Name'` are understood.

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

## Runtime contract

`src/validator/runtime.ts` contains the first runtime-facing rule layer. A host integration can pass a rendered `Document` to `validateRuntimeDocument` and receive the same diagnostic shape for:

- missing accessible names on native controls and `ov-input`/`ov-textarea`/`ov-checkbox`/`ov-radio-group`/`ov-toggle`/`ov-select`/`ov-combobox` hosts;
- rendered heading starts and jumps;
- missing required state markers;
- multiple primary actions in a marked region; and
- Ovlira custom elements that were not registered by the app.

This is an adapter contract, not a browser runner. jsdom tests exercise it today. `ovlira check` remains source-based until a local browser/Vite adapter can be added without making the default command slow or network-dependent. It cannot currently prove contrast, keyboard interaction, shadow-root behavior in every browser, or dynamic transitions.
