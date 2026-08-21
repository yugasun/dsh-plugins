# dsh-plugins

可独立安装的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件仓库。

`packages/` 下每个目录都是完整的 `dsh.bundle`——**根目录不是插件**。npm 包统一使用 `@yugasun` scope。

兼容 DeepSeek Harness **0.1.0-rc.7**。

[English](README.md)

## 插件

| 包 | npm | 安装 |
| --- | --- | --- |
| [dsh-web-search](packages/dsh-web-search) | [@yugasun/dsh-web-search](https://www.npmjs.com/package/@yugasun/dsh-web-search) | `dsh plugin --profile web add @yugasun/dsh-web-search` |

**dsh-web-search** — 多后端网页搜索：百度、豆包、Tavily、Exa、Serper。`web_fetch` 可独立选择 Tavily Extract、Exa Contents 或 DSH 内置 HTTP。

安装插件会在 Harness 进程内以你的权限运行第三方代码。安装前请阅读源码。

## 开发

需要 Node.js `^22.11.0 || ^24.0.0 || >=26.0.0` 和 [pnpm](https://pnpm.io) 10。

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

把本地仓库装进 profile（相对路径相对 **profile 目录** 解析，不要写 `./packages/...`）：

```sh
dsh plugin --profile web add "$PWD/packages/dsh-web-search"
dsh plugin --profile desktop add "$PWD/packages/dsh-web-search"
dsh --profile web --dump-config | grep dsh-web-search
```

从 Git 子目录安装：

```sh
dsh plugin --profile web add github:yugasun/dsh-plugins#path:packages/dsh-web-search
```

pnpm ≥10 第一次从 Git 安装时可能会询问是否允许 `prepare` 脚本（`allowBuilds`）。

## 发布

`packages/` 下所有公开包的版本和 npm 发布由 Changesets 与 GitHub Actions 管理。

修改包时运行 `pnpm changeset`，选择受影响的包和语义化版本级别，并提交生成的 `.changeset/*.md` 文件。可用 `pnpm changeset:status` 查看待发布内容；PR 检查会运行 `pnpm changeset:check`，本地完整校验使用 `pnpm check`。

PR 合入 `main` 后，GitHub Actions 会创建或更新 `Version Packages` PR。合入该 PR 后，所有待发布的包会通过 npm Trusted Publishing/OIDC 自动更新版本并发布。正常发布不需要在本地进行 npm 身份认证、配置 token 或执行 2FA。

完整发布流程见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

[MIT](LICENSE)
