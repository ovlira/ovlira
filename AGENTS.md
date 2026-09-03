# Ovlira agent guidance

`DESIGN.md`, `ui.html`, and the approved screenshot baselines are the visual authority. Do not choose or revise palette, typography, radius, density, motion, or component styling. Implement composition, content, data, behavior, accessibility, and responsive structure. If a render differs from the authority, report the defect; do not invent a replacement style.

1. Search before inventing a component: `npm run ovlira -- search "..." --json`.
2. Inspect before using it: `npm run ovlira -- inspect <id> --json`.
3. Prefer a recipe for a complete screen.
4. Use the project-owned `src/styles/ovlira-theme.css` and exported `--ov-*` tokens instead of arbitrary values.
5. Include the recipe's required loading, empty, error, or success states.
6. Render at the required viewports and inspect the result.
7. Run `npm run ovlira -- check --json` before finishing a generated project. In this repository, run `npm run release:check`.
8. Avoid bypassing the catalogue with arbitrary CSS unless the component contract cannot express the need.
