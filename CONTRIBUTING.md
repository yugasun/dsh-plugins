# Contributing

[中文](#中文)

Thanks for looking at [dsh-plugins](https://github.com/yugasun/dsh-plugins). This is a pnpm monorepo: each plugin lives in `packages/<name>` and is released independently as `@yugasun/<name>`.

## Setup

- Node.js `^22.11.0 || ^24.0.0 || >=26.0.0`
- pnpm 10 (`packageManager` in the root `package.json`)

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

`pnpm check` runs the same three steps GitHub Actions uses.

## Layout

```
packages/dsh-web-search   @yugasun/dsh-web-search
```

Cordis plugin ids (`export const name`, settings namespaces, patch `id`) stay unscoped (`dsh-web-search`) so existing `~/.dsh/settings.yaml` keys keep working. The patch `name` and `window.__ModuleLoader__.load` id must be the scoped npm name (`@yugasun/dsh-web-search`): that is the specifier Cordis imports and the key DSH uses for the client module table.

Do not publish the repository root (`private: true`).

## Package docs

English lives in `README.md` (what npm shows). Chinese lives in `README.zh.md`. Keep them in sync when you change install steps or behavior.

## Version and release

Do not edit package versions by hand. When a PR changes a publishable package under `packages/`, create release metadata from the repository root:

```sh
pnpm changeset
pnpm changeset:status
pnpm changeset:check
pnpm check
```

Choose `patch` for a backward-compatible fix, `minor` for a backward-compatible feature, or `major` for a breaking change. Commit the generated `.changeset/*.md` file with the PR. For package-only changes that intentionally do not publish, use `pnpm changeset --empty`.

PR CI requires a Changeset whenever a publishable package changes. After the PR merges to `main`, GitHub Actions creates or updates one `Version Packages` PR. Merging that PR applies the version bumps and publishes all pending packages through npm Trusted Publishing/OIDC, with GitHub releases and tags. Normal releases do not require local npm authentication, npm tokens, or 2FA.

To inspect a package artifact without publishing it, use `pnpm --filter <package> pack --dry-run`. Check the tarball against that package's `files`, `main`, `exports`, bundle metadata, and license; packages may have different artifact layouts. The release workflow's `pack` job runs the root `pnpm build` across packages before Changesets packs the artifacts. Keep each package's build and lifecycle scripts, such as `prepare` or `prepublishOnly`, as applicable for local installs and packaging.

Adding a new package requires a one-time initial npm publication and Trusted Publisher binding for `.github/workflows/release.yml`; ask a maintainer to perform that bootstrap. Later releases use the automated flow above.

## Pull requests

- One plugin per PR when the change is isolated
- Include tests for host-side behavior
- Run `pnpm check` locally before opening the PR

---

# 中文

这是一个 pnpm monorepo：每个插件在 `packages/<name>`，以 `@yugasun/<name>` 独立发 npm。仓库根目录是 `private`，不要发布。

Cordis 插件 id 和设置命名空间保持无 scope（`dsh-web-search`），避免已有 `settings.yaml` 失效。`cordis.patch.yml` 的 `name` 和 `window.__ModuleLoader__.load` 的 id 必须是带 scope 的 npm 包名（`@yugasun/dsh-web-search`）：这是 Cordis 真正 import 的标识，也是 DSH 客户端模块表的 key。

英文说明写在 `README.md`（npm 展示这份），中文写在 `README.zh.md`，改安装步骤或行为时请两边一起改。

## 版本和发布

不要手动修改包版本。PR 修改 `packages/` 下的可发布包时，在仓库根目录运行：

```sh
pnpm changeset
pnpm changeset:status
pnpm changeset:check
pnpm check
```

根据变更选择 `patch`（向后兼容的修复）、`minor`（向后兼容的新功能）或 `major`（不兼容的变更），并将生成的 `.changeset/*.md` 文件和 PR 一起提交。如果只是包内改动且明确不需要发布，使用 `pnpm changeset --empty`。

PR CI 会检查可发布包的变更是否包含 Changeset。PR 合入 `main` 后，GitHub Actions 会创建或更新一个 `Version Packages` PR。合入该 PR 后，所有待发布的包会通过 npm Trusted Publishing/OIDC 自动更新版本并发布，同时创建 GitHub release 和 tag。正常发布不需要本地 npm 身份认证、npm token 或 2FA。

要在本地检查包产物但不发布，使用 `pnpm --filter <package> pack --dry-run`。根据对应包的 `files`、`main`、`exports`、bundle 元数据和许可证检查 tarball；不同包的产物布局可以不同。发布工作流的 `pack` job 会先在所有包上运行根目录的 `pnpm build`，再由 Changesets 打包产物。各包的 `build` 以及 `prepare`、`prepublishOnly` 等生命周期脚本按需保留，用于本地安装和打包。

新增包需要一次性的初始 npm 发布，并为 `.github/workflows/release.yml` 配置 Trusted Publisher；请维护者协助完成这次初始化。之后即可使用上述自动发布流程。
