# Component visual review

This is the baseline workflow for the shipped component catalogue. It complements the recipe and authored-reference matrix in [`../visual-review.md`](../visual-review.md); it does not replace that approval record or authorize an agent to revise component styling. The current matrix was approved on 2026-08-31 and is included in `npm run release:check`.

## Review surface

The suite opens the real rendered preview in the marketing catalogue. The component list comes directly from `src/catalogue/components.json`, so a newly catalogued component automatically receives:

- a focused light/default capture at 1440 × 900;
- a focused dark/default capture at 1440 × 900;
- a focused light/default capture at 375 × 812; and
- additional light/wide captures for supported `loading`, `disabled`, `error`, and `open` properties.

Component-specific scenarios cover selected tabs, pagination, workflow steps, and tree items; expanded accordion and tree states; and a populated file upload. Open overlays use a viewport capture because their rendered surface deliberately escapes the preview element's bounds.

The same candidate suite captures the complete expanded catalogue in light and dark at wide, tablet, and narrow widths, plus its wide master/detail layout. These images replace no approved marketing screenshot while review is pending.

## Candidate workflow

Generate or refresh candidate evidence with:

```bash
npm run test:component-visual:update
```

Re-run the candidate matrix without changing images with:

```bash
npm run test:component-visual
```

These commands use `playwright.component-visual.config.ts`. The focused suite has its own configuration and runs from `npm run release:check` after the main browser matrix. A passing comparison proves only that the checked-in images match the reviewed implementation; it does not approve a changed image.

The update command also regenerates `component-visual-manifest.json`. Each image is recorded with a SHA-256 digest. Existing Pass decisions survive regeneration only while every associated image is byte-for-byte unchanged; a changed or newly added image resets the affected decision to Pending and makes the release manifest fail its consistency test.

## Approval boundary

A human designer reviews the candidates against `DESIGN.md`, `ui.html`, and the component contract. Record **Pass**, **Revise**, or **Block** for each component. Only after every included component passes may the reviewed change run `npm run component-visual:approve`, which records the source, date, image digests, and Pass decisions in the visual manifest.

When a candidate fails, report the component, theme, viewport, state, and smallest concrete defect. Do not refresh the image to hide a mismatch, and do not invent replacement palette, typography, radius, density, motion, or component styling.
