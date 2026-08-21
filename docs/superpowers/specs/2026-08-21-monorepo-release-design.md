# Monorepo package release workflow

Date: 2026-08-21
Scope: all publishable packages under `packages/*`
Status: approved in conversation; waiting for spec review before implementation plan

## Problem

The repository currently has a release workflow dedicated to
`@yugasun/dsh-web-search`. Its package path, package name, version calculation,
release commit, tag, and publish directory are all hard-coded. Copying this
workflow for each future plugin would duplicate security-sensitive release
logic and make version behavior drift between packages.

The replacement must support any publishable package added under `packages/*`,
preserve independent semantic versions, publish without a long-lived npm token,
and keep version decisions reviewable.

## Goals

- Use one release workflow for every publishable workspace package.
- Let each feature PR declare the affected packages and their semantic bump
  (`patch`, `minor`, or `major`).
- Aggregate pending release intent into one reviewable Version Packages PR.
- Publish every versioned, unpublished package after that PR is merged.
- Keep npm authentication token-free through Trusted Publishing (OIDC).
- Update changelogs, internal workspace dependency ranges, Git tags, and GitHub
  releases consistently.
- Make completed releases no-ops on rerun and make partial failures safely
  retryable.

## Non-goals

- Publishing directly after every feature PR merge.
- A fixed/shared version for all packages.
- Automatically inferring `patch`, `minor`, or `major` from commit messages.
- Supporting registries other than the public npm registry in this change.
- Automating the first-ever npm publication of a brand-new package.
- Prerelease channels such as `next`, `beta`, or snapshot releases.

## Decision

Adopt Changesets v3 with `changesets/action@v2` and a Version Packages PR gate.
Use the action's separate `select-mode`, `version`, and `publish` sub-actions so
the OIDC permission exists only in the publish job.

Alternatives rejected:

1. **Custom diff-based publisher.** It can publish immediately, but would need
   custom logic for semver intent, changelogs, internal dependencies, release
   aggregation, tags, concurrent merges, and partial failures.
2. **Reusable workflow called once per package.** It reduces YAML duplication
   but still requires a maintained package list and leaves version/changelog
   coordination unsolved.

Changesets is designed for independently versioned monorepo packages and only
publishes package versions that are not already present in the registry.

## Contributor workflow

For a PR that changes a publishable package:

1. Run `pnpm changeset`.
2. Select every affected package.
3. Choose `patch`, `minor`, or `major` for each package.
4. Write a concise user-facing summary.
5. Commit the generated `.changeset/*.md` file with the PR.

A single changeset may cover multiple packages. Multiple changesets affecting
the same package are combined by Changesets using the highest required semantic
bump.

Changes that intentionally do not require a release, such as tests or internal
tooling, use `pnpm changeset --empty`. The release/version PR itself is excluded
from the changeset-presence check because it contains already-consumed version
metadata rather than new release intent.

## Release flow

```text
feature PR + .changeset/*.md
           |
           v
       merge main
           |
           v
select-mode = version
           |
           v
create/update Version Packages PR
  - consume pending changesets
  - bump only affected packages
  - update internal dependency ranges
  - update per-package CHANGELOG.md
           |
           v
review and merge Version Packages PR
           |
           v
select-mode = publish
           |
           v
test -> typecheck -> build -> publish with npm OIDC
           |
           v
package tags and GitHub releases
```

Feature PRs may accumulate while the Version Packages PR is open. Each merge to
`main` updates the same release PR rather than creating one PR per package or
per feature.

## Repository changes

### Changesets configuration

Add `@changesets/cli` v3 as a root development dependency and initialize
`.changeset/config.json` with:

- `baseBranch: "main"`
- `access: "public"`
- independent versions (`fixed: []`, `linked: []`)
- normal changelog generation
- patch-level internal dependency updates
- no ignored publishable packages

The private workspace root is never published. A package is publishable when it
is a direct `packages/*` workspace with a `name`, `version`, and no
`private: true` in its `package.json`.

Add root scripts with these responsibilities:

- `changeset`: create release intent interactively.
- `version-packages`: apply pending changesets locally when needed.
- `release`: publish the release plan; validation/building remains an explicit
  workflow step so it cannot be skipped by changing this script.

### Pull request validation

Extend CI with a changeset status check against `main`. For PRs other than the
generated `changeset-release/main` branch, inspect changed files: if any direct
publishable `packages/*` workspace changed, require at least one newly added or
modified `.changeset/*.md` file and validate it with `changeset status`. The file
may be a normal or empty changeset. PRs that do not change a publishable package
pass without a changeset. The generated Version Packages PR is exempt because
its changesets have already been consumed.

The existing test, typecheck, and build checks remain required independently of
the changeset check. A changeset never substitutes for code validation.

### Unified release workflow

Replace `.github/workflows/release-dsh-web-search.yml` with
`.github/workflows/release.yml`, triggered by pushes to `main` and optional
manual dispatch for recovery.

Use a single concurrency group with `cancel-in-progress: false`. This serializes
release decisions so one merge cannot cancel a publish started by another.

Split the workflow into least-privilege jobs:

1. **Select mode** checks out the repository, installs the pinned pnpm and root
   dependencies, then runs `changesets/action/select-mode@v2`. It emits
   `version`, `publish`, or `none` and has no write/OIDC permission.
2. **Version** runs only in `version` mode with `contents: write` and
   `pull-requests: write`. It runs `changesets/action/version@v2` to create or
   update the Version Packages PR through the GitHub API.
3. **Publish** runs only in `publish` mode with `contents: write` and
   `id-token: write`. It installs dependencies without a release cache, runs
   the complete repository checks, then uses
   `changesets/action/publish@v2`. It creates package tags and GitHub releases.

No job receives an npm token. Node 24 and an npm CLI version supporting Trusted
Publishing are required. Keep the repository's pinned pnpm 10.x line during the
initial migration; upgrade pnpm separately only after an OIDC release smoke
test, because the package manager participates in the publish subprocess.

Before enabling the workflow, change the repository's Actions setting to allow
GitHub Actions to create and approve pull requests. It is currently disabled;
without it, the version job cannot open the Version Packages PR. Workflow
permissions stay read-only by default and are elevated only per job as listed
above.

## npm Trusted Publishing

npm trust is configured per package, not per repository. Every existing package
must authorize the same exact workflow identity:

- provider: GitHub Actions
- repository: `yugasun/dsh-plugins`
- workflow file: `release.yml`
- permission: direct `npm publish`

The current source version is `0.2.4`, while the official npm registry still has
`0.2.3`. Resolve this pending release before enabling Changesets; otherwise the
first unified workflow run will correctly detect `0.2.4` as publishable before
the trust migration is complete.

Migration order for `@yugasun/dsh-web-search`:

1. Publish the pending `0.2.4` with the existing package-specific workflow and
   verify it on the official npm registry.
2. Merge the Changesets configuration and `release.yml`. Because source and npm
   versions now match and there are no pending changesets, the first run is a
   no-op.
3. Replace the package's current `release-dsh-web-search.yml` trust relationship
   with `release.yml` before merging any feature changesets.
4. Verify the trust record with `npm trust list` against
   `https://registry.npmjs.org`.
5. Merge the first feature changeset and its resulting Version Packages PR, then
   observe a successful OIDC publish.

Do not revoke the old trust relationship before the new workflow is present and
ready to bind. After successful migration, package publishing access should be
set to require 2FA and disallow traditional tokens; this does not block OIDC.

### Adding a new package

Trusted Publishing cannot be attached until a package exists on npm. A new
package therefore has this one-time bootstrap path:

1. Confirm its `repository.url`, package name, files, and public access.
2. Publish the initial version manually to the official npm registry with 2FA.
3. Bind the package to `release.yml` with publish permission.
4. From then on, use only Changesets and the unified workflow.

This is the only per-package release setup; no new workflow file is added.

## Internal package dependencies

Changesets owns version propagation between workspace packages. When a package
changes in a way that requires a dependent package's declared range to move, the
Version Packages PR updates that relationship according to Changesets config.
The workflow must not separately scan Git diffs or rewrite dependency ranges.

Independent versioning remains the default. Fixed or linked package groups can
be introduced later only when an actual compatibility requirement appears.

## Failure and retry behavior

- **Version PR creation/update fails:** no package is published. Rerun the
  workflow after fixing GitHub permissions or the Changesets configuration.
- **Tests/build fail in publish mode:** publishing never starts; fix through a
  normal PR and rerun/merge as appropriate.
- **One package fails after others publish:** Changesets checks registry state on
  rerun and skips versions already present, then retries unpublished packages.
  Do not manually bump versions to recover from a partial publish.
- **OIDC returns `E404`/`ENEEDAUTH`:** verify the package trust record, exact
  workflow filename, official registry, Node/npm versions, and the package's
  repository metadata before changing versions.
- **Completed release rerun:** registry comparison produces no publishable
  packages, so the run is a no-op.
- **Concurrent merges:** the release concurrency group queues runs and never
  cancels an active publish.

## Security

- Grant `id-token: write` only to the publish job.
- Grant `pull-requests: write` only to the version job.
- Do not add `NPM_TOKEN`, bypass-2FA tokens, or registry credentials.
- Use GitHub-hosted runners, as required by npm Trusted Publishing.
- Disable package-manager caching in the publish job.
- Keep the official npm registry explicit wherever trust is configured or
  verified; local `npmmirror.com` configuration must not affect release state.
- Prefer GitHub API commits/tags from Changesets Action so release objects are
  signed and do not depend on checkout-persisted Git credentials.

## Testing and acceptance

Before enabling publication:

- Validate all workflow YAML with `actionlint`.
- Run the existing repository test, typecheck, and build commands.
- Run `pnpm changeset status` with fixtures covering one package, multiple
  packages, and an empty changeset.
- Verify that the Version Packages PR bumps only selected packages and writes
  the expected changelogs.
- Verify that a docs/test-only PR can use an empty changeset without publishing.
- Verify that the release PR is exempt from the changeset-presence check.
- Run `npm pack --dry-run` for every package selected for the first release.
- Confirm every existing package trusts `release.yml` before the release PR is
  merged.

The migration is accepted when merging a feature PR creates/updates one Version
Packages PR, merging that PR publishes the intended package versions with npm
provenance, creates package tags/releases, and rerunning the completed workflow
publishes nothing.

## References

- [Changesets](https://github.com/changesets/changesets)
- [Changesets Action](https://github.com/changesets/action)
- [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)
