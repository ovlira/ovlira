# Designer contribution checklist

Use this checklist before a component, recipe, theme, or intentional visual change enters the catalogue. A coding agent may prepare implementation and evidence, but a human designer owns the visual contract and approval decision.

## Reference package

- The change has an authored reference fixture and concise rationale.
- Anatomy, hierarchy, content regions, variants, and supported states are explicit.
- Wide (1440 × 900), tablet (768 × 1024), and narrow (375 × 812) behavior is shown.
- Light and dark schemes are reviewed; a separate contrasting theme is supplied when the release criterion requires it.
- Palette, typography, radius, density, motion, and component styling decisions are expressed through the theme or component contract—not fixture overrides.

## Product behavior

- The primary task and action boundary are unambiguous.
- Loading, empty, error, success, disabled, focus, and validation states are supplied where applicable.
- Keyboard order, focus visibility, accessible names, announcements, and target sizes are specified.
- Long content, wrapping, table overflow, and narrow navigation behavior are intentional.

## Catalogue handoff

- Semantic `--ov-*` tokens cover brand-level decisions; structural CSS stays with the authored component or recipe.
- Public properties, events, slots, parts, constraints, and examples match the implementation.
- Recipe dependencies list only components used by the canonical fixture.
- The reference manifest records the source files, viewport matrix, schemes, and approval state.

## Evidence and approval

- `npm run release:check` passes.
- Candidate screenshots were generated with `npm run test:visual:update` and visually reviewed rather than automatically accepted.
- The review record marks each fixture Pass, Revise, or Block and links any defects.
- An approved baseline update and its `reference-manifest.json` status change are reviewed together.
- Any intentional visual change is human-approved; an agent has not redesigned around a failing baseline.
