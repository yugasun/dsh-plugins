# dsh-plugins

Independently installable [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugins.

Each directory under `packages/` is its own `dsh.bundle`. The repository root is **not** a plugin. npm packages use the `@yugasun` scope.

Compatible with DeepSeek Harness **0.1.0-rc.7**.

[中文文档](README.zh.md)

## Plugins

| Package | npm | Install |
| --- | --- | --- |
| [dsh-budget](packages/dsh-budget) | [@yugasun/dsh-budget](https://www.npmjs.com/package/@yugasun/dsh-budget) | `dsh plugin --profile web add @yugasun/dsh-budget` |
| [dsh-web-search](packages/dsh-web-search) | [@yugasun/dsh-web-search](https://www.npmjs.com/package/@yugasun/dsh-web-search) | `dsh plugin --profile web add @yugasun/dsh-web-search` |

- **dsh-budget** — tool-output guard: cap oversized plain-text tool results (including `read`)
- **dsh-web-search** — multi-provider web search for `ctx.web`: Baidu, Doubao, Tavily, Exa

Installing a plugin runs third-party code in the harness process with your permissions. Review the source before you install.

## Develop

Requires Node.js 22+ and [pnpm](https://pnpm.io) 10.

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

Load a local checkout into the web profile:

```sh
dsh plugin --profile web add "$PWD/packages/dsh-budget"
dsh plugin --profile web add "$PWD/packages/dsh-web-search"
dsh --profile web --dump-config | grep -E 'dsh-budget|dsh-web-search'
```

From Git (subdirectory):

```sh
dsh plugin --profile web add github:yugasun/dsh-plugins#path:packages/dsh-budget
```

pnpm ≥10 may ask you to allow the package `prepare` script (`allowBuilds`) the first time you install from Git.

## Publish

After `npm login`:

```sh
pnpm --filter @yugasun/dsh-budget publish
pnpm --filter @yugasun/dsh-web-search publish
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for version bumps and dry-runs.

## License

[MIT](LICENSE)
