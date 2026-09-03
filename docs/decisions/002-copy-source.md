# 002 — `ui add` copied source (superseded)

Status: superseded by [006 — Publish elements, generate compositions](006-package-elements-generate-recipes.md) before public adoption.

## Question

Should `ovlira add` install a package, generate imports, or copy source files?

## Experiment

Ran `init` and `add page.settings` in a clean temporary directory, then inspected the generated files and ran the static validator.

## Result

Copying gives an agent a local, searchable implementation and avoids a network or package-resolution requirement after the CLI is installed. It also makes deliberate local edits possible, including a project-owned theme file.

## Historical decision

Copy the selected component sources, a project-owned theme CSS file, and a runnable entry example into the project. Keep the registry and source templates bundled with the CLI package.

## Consequence for Ovlira

Generated projects own their implementation. Updates are explicit and there is no hidden runtime registry dependency.
