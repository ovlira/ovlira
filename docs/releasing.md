# Releasing Ovlira

Ovlira ships as two public npm packages:

```text
packages:   @ovlira/cli, @ovlira/elements
executable:  ovlira
repository: ovlira/ovlira
```

The CLI depends on the elements package. Publish `@ovlira/elements` before `@ovlira/cli` for each version.

## Before the first publish

From a clean checkout:

```bash
npm ci
npm run release:check
npm run pack:check
npm run package:smoke
```

Review both tarballs. The CLI should contain its compiled catalogue, validator, and executable; the elements package should contain built components, theme assets, types, and its Custom Elements Manifest. Neither should contain `node_modules`, coverage, reports, repository sources, or local credentials.

`npm run package:smoke` installs both candidate tarballs with npm into a fresh temporary app, without repository dependency symlinks. It exercises the local `npm run ovlira --` interface through search, inspection, initialization, recipe generation, and validation, builds the app, then repeats build/check after `npm ci`. Candidate tarballs replace unpublished version ranges; third-party dependencies come from the configured npm registry. The check therefore requires registry access and uses an isolated temporary cache. PR CI runs it on both supported Node versions.

The initial scoped package must be made public explicitly:

```bash
npm whoami
npm publish --workspace @ovlira/elements --access public
npm publish --access public
```

Publishing a version is irreversible in the npm registry, so the package name, version, tarball, and access level should be checked before this command.

Do not create a GitHub Release for a version after manually publishing that same version: the release workflow would try to publish it again. Push the matching Git tag if desired, then use the GitHub Release workflow for the next version.

## GitHub releases

For releases after the initial `0.2.0` package, prepare the intended semantic version on a release branch:

```bash
npm version <version> --workspaces --include-workspace-root --no-git-tag-version
npm pkg set 'dependencies.@ovlira/elements=<version>'
npm install --package-lock-only
npm run release:check
```

Replace `<version>` with the same intended version in both commands. Review both package versions, the CLI's elements dependency, and lockfile together. Merge the release branch after CI passes, then create and publish a GitHub Release for the matching tag, such as `v0.4.0`. The publish workflow checks that the tag version exactly matches both packages and the CLI's pinned elements dependency before publishing.

Before relying on the workflow, configure an npm trusted publisher for both packages:

- Provider: GitHub Actions
- Organization: `ovlira`
- Repository: `ovlira`
- Workflow filename: `publish.yml`
- Allowed action: npm publish

The workflow grants only `contents: read` and `id-token: write`, runs the package release checks, and publishes through npm trusted publishing. Browser/screenshot checks remain in the macOS CI job because their approved baselines are platform-specific. It does not store an npm token in GitHub. See the [npm trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/) for the current npm configuration screens and requirements.

The workflow uses Node 24 and the latest npm 11.x. `scripts/publish-packages.mjs` packs candidates in dependency order, compares existing registry integrity, and skips only an identical already-published package. A mismatched artifact aborts; npm never reuses a name/version pair. This permits resuming a partially completed release without blind republishing. Use the manual `Run workflow` action with the existing release tag when resuming.

For a new package name, npm requires the package to exist before configuring a trusted publisher. First publication may therefore require an authenticated maintainer and 2FA. After publishing the exact reviewed elements tarball, configure its GitHub publisher for `ovlira/ovlira`, `publish.yml`, then run the GitHub release workflow. The integrity check will verify and skip that identical elements artifact before publishing the CLI. Do not claim GitHub provenance for a locally bootstrapped artifact; subsequent OIDC publications receive provenance. See [npm trust prerequisites](https://docs.npmjs.com/cli/v11/commands/npm-trust/).

## Marketing deployment

The root `build` now builds the package workspaces and the Astro marketing site into `reports/marketing-dist`, the directory configured by `wrangler.jsonc`. This is required because Workers Builds starts from a clean checkout. Configure the Worker with `npm run build` as its build command and `npm run deploy` as its deploy command; the latter rebuilds defensively and runs `npx wrangler deploy`. A local validation is `npm run build && npx wrangler deploy --dry-run`.

## CI

Pull requests and pushes to `main` run:

```text
npm ci
npm test
npm run manifest
npm run eval:codex:offline
npm run eval:specs
npm run eval:specs:vitest
npm pack --dry-run
```

The macOS browser job separately runs the interaction, accessibility, responsive, recipe/reference screenshot, and catalogue component screenshot gates.

The live Codex evaluator remains opt-in and is not part of release CI.
