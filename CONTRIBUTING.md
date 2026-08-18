# Contributing

[中文](#中文)

Thanks for looking at [dsh-plugins](https://github.com/yugasun/dsh-plugins). This is a pnpm monorepo: each plugin lives in `packages/<name>` and is published independently as `@yugasun/<name>`.

## Setup

- Node.js 22+
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

Cordis plugin ids (`export const name`, settings namespaces, patch `id`) stay unscoped (`dsh-web-search`) so existing `~/.dsh/settings.yaml` keys keep working. Only the **npm** name is scoped. The web client banner must register that same unscoped id with `window.__ModuleLoader__.load` — DSH keys the module table on the loader entry name, not the npm package name.

Do not publish the repository root (`private: true`).

## Package docs

English lives in `README.md` (what npm shows). Chinese lives in `README.zh.md`. Keep them in sync when you change install steps or behavior.

## Version and publish

Bump the package you are releasing (`packages/<name>/package.json` `version`), then:

```sh
pnpm --filter @yugasun/dsh-web-search pack --dry-run
pnpm --filter @yugasun/dsh-web-search publish
```

The tarball must contain `lib/index.js`, `client/client.js`, `cordis.patch.yml`, and `LICENSE`. Built `lib/` and `client/*.js` are gitignored; `prepublishOnly` builds them before publish. Keep `prepare` so Git installs still compile.

## Pull requests

- One plugin per PR when the change is isolated
- Include tests for host-side behavior
- Run `pnpm check` locally before opening the PR

---

# 中文

这是一个 pnpm monorepo：每个插件在 `packages/<name>`，以 `@yugasun/<name>` 独立发 npm。仓库根目录是 `private`，不要发布。

Cordis 插件 id 和设置命名空间保持无 scope（`dsh-web-search`），避免已有 `settings.yaml` 失效。Web 客户端 banner 必须用同一个无 scope id 调用 `window.__ModuleLoader__.load`，DSH 按 loader 条目名而不是 npm 包名注册。

英文说明写在 `README.md`（npm 展示这份），中文写在 `README.zh.md`，改安装步骤或行为时请两边一起改。

发布前先改对应包的 `version`，再 `pack --dry-run` 确认 tarball 含 `lib/`、`client/`、`cordis.patch.yml`、`LICENSE`。
