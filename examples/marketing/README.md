# Ovlira marketing side

This is a small Astro static surface for explaining Ovlira to product and engineering teams. It uses the repository catalogue JSON directly, so its counts, recipes, and component names stay aligned with the CLI.

From the repository root:

```bash
npm run marketing:dev
npm run marketing:build
npm run marketing:preview
```

The site follows the executable [`../../ui.html`](../../ui.html) reference: a quiet application shell with a persistent sidebar, compact page headers, and the same restrained token language. Intro, install, workflow, tokens, and validation are static routes; [`/catalogue/`](http://localhost:4321/catalogue/) owns the interactive catalogue inspection and rendered custom-element previews. Its light/dark switch, bounded search, and inspect detail are demonstrations of Ovlira's architecture rather than a second design system. The visual authority remains [`../../DESIGN.md`](../../DESIGN.md) and [`../../ui.html`](../../ui.html).
