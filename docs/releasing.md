# Releasing Ovlira

Ovlira currently ships as one public npm package:

```text
package:   @ovlira/cli
executable: ovlira
repository: ovlira/ovlira
```

The organization scope gives the npm organization ownership of the package without forcing a premature package split. `@ovlira/core` is reserved as a possible future extraction for stable registry and validation APIs; it is not a second package today.

## Before the first publish

From a clean checkout:

```bash
npm ci
npm run release:check
npm pack --dry-run
```

Review the tarball contents and confirm that it contains `dist`, `src`, the catalogue, metadata, docs, examples, and the Custom Elements Manifest, but not `node_modules`, `coverage`, `reports`, or local credentials.

The initial scoped package must be made public explicitly:

```bash
npm whoami
npm publish --access public
```

Publishing a version is irreversible in the npm registry, so the package name, version, tarball, and access level should be checked before this command.

Do not create a GitHub Release for `v0.2.0` after this manual publish: the release workflow would try to publish the same npm version again. Push the matching Git tag if desired, then use the GitHub Release workflow for the next version.

## GitHub releases

For releases after the initial `0.2.0` package:

```bash
npm version patch
git push origin main --follow-tags
```

Then create and publish a GitHub Release for the matching tag, such as `v0.2.1`. The publish workflow checks that the tag version exactly matches `package.json` before publishing.

Before relying on the workflow, configure an npm trusted publisher for `@ovlira/cli`:

- Provider: GitHub Actions
- Organization: `ovlira`
- Repository: `ovlira`
- Workflow filename: `publish.yml`
- Allowed action: npm publish

The workflow grants only `contents: read` and `id-token: write`, runs the release checks, and publishes with provenance. It does not store an npm token in GitHub. See the [npm trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/) for the current npm configuration screens and requirements.

Trusted publishing requires npm CLI 11.5.1 or later and Node 22.14.0 or later. The workflow uses Node 24 and installs the latest npm 11.x before publishing. If a release run fails after a package has already been published, do not rerun it for the same version; npm never reuses a published name/version pair. For a failed unpublished release, use the workflow's manual `Run workflow` action with the existing tag, such as `v0.2.1`.

## CI

Pull requests and pushes to `main` run:

```text
npm ci
npm test
npm run manifest
npm run eval:codex:offline
npm pack --dry-run
```

The live Codex evaluator remains opt-in and is not part of release CI.
