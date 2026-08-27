# 001 — Keep the first prototype in one package

## Question

Does a monorepo materially improve the first vertical slice?

## Experiment

Mapped the requested flow onto one TypeScript package: Lit sources, JSON catalogue, CLI, copied project files, and Vitest tests.

## Result

There are no independent release units yet. A second package would add workspace and build configuration without improving the agent workflow.

## Decision

Use one npm package named `@ovlira/cli`, with the executable named `ovlira`, clear source directories, and a straightforward future split point.

## Consequence for Ovlira

The CLI can be installed and tested as one artifact. Components can move to a package later without changing stable IDs or copied source paths.
