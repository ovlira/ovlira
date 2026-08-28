# Ovlira agent guidance

1. Search before inventing a component: `ovlira search "..." --json`.
2. Inspect before using it: `ovlira inspect <id> --json`.
3. Prefer a recipe for a complete screen.
4. Use the project-owned `src/styles/ovlira-theme.css` and exported `--ov-*` tokens instead of arbitrary values.
5. Include the recipe's required loading, empty, error, or success states.
6. Run `ovlira check --json` before finishing.
7. Avoid bypassing the catalogue with arbitrary CSS unless the component contract cannot express the need.
