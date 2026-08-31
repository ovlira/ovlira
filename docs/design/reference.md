# Designer reference contract

[`DESIGN.md`](../../DESIGN.md) defines the visual rules and [`ui.html`](../../ui.html) is the first executable reference. Together they are the visual authority for the v0.3 theme, components, recipes, and review harness. The reference is not a mandate to ship Vue or a catalogue browser; generated Ovlira projects remain framework-independent.

The executable reference uses only local development dependencies. Start it from the repository root with:

```bash
npm run reference:design
```

Review light and dark schemes plus the approved contrasting theme at 1440 × 900, 768 × 1024, and 375 × 812. The exact matrix and approval state live in [`reference-manifest.json`](./reference-manifest.json). Dark mode remains part of the default theme; the deliberately contrasting designer-supplied theme and its handoff are documented separately in [contrasting-theme handoff](./contrasting-theme.md).

Agents may repair semantics, behavior, responsive defects, and accessibility failures. Changes to palette, typography, radius, density, motion, or component styling require human approval and a corresponding reference/baseline update.
