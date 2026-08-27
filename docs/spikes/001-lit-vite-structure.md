# Spike 001 — Small Lit + Vite structure

## Question

What is the smallest sensible Lit + Vite project structure for reusable custom elements?

## Experiment

Created a generated app with `index.html`, `src/main.ts`, `src/styles.css`, `src/components/ovlira/*.ts`, a token CSS file, `vite.config.ts`, and a strict `tsconfig.json`. Built it with Vite after `ovlira init` and `ovlira add page.settings`.

## Result

Vite does not need a Lit-specific plugin for this prototype. Each element can be imported for side-effect registration, while the app entry composes native HTML and custom elements.

## Decision

Use one `src/components/ovlira` folder, manual `customElements.define`, and ordinary Vite TypeScript resolution.

## Consequence for Ovlira

The copied example stays understandable to a coding agent and can be built with the normal `vite` and `tsc` commands.

References: [Lit components](https://lit.dev/docs/components/overview/), [adding Lit to an existing project](https://lit.dev/docs/v2/tools/adding-lit/), [Vite getting started](https://vite.dev/guide/).
