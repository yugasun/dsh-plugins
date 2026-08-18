# dsh-plugins

可独立安装的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件仓库。

`packages/` 下每个目录都是完整的 `dsh.bundle`——**根目录不是插件**。npm 包统一使用 `@yugasun` scope。

兼容 DeepSeek Harness **0.1.0-rc.7**。

[English](README.md)

## 插件

| 包 | npm | 安装 |
| --- | --- | --- |
| [dsh-web-search](packages/dsh-web-search) | [@yugasun/dsh-web-search](https://www.npmjs.com/package/@yugasun/dsh-web-search) | `dsh plugin --profile web add @yugasun/dsh-web-search` |

**dsh-web-search** — 多后端网页搜索：百度、豆包、Tavily、Exa。Tavily / Exa 生效时，`web_fetch` 走对应提取接口。

安装插件会在 Harness 进程内以你的权限运行第三方代码。安装前请阅读源码。

## 开发

需要 Node.js 22+ 和 [pnpm](https://pnpm.io) 10。

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

把本地仓库装进 web profile：

```sh
dsh plugin --profile web add "$PWD/packages/dsh-web-search"
dsh --profile web --dump-config | grep dsh-web-search
```

从 Git 子目录安装：

```sh
dsh plugin --profile web add github:yugasun/dsh-plugins#path:packages/dsh-web-search
```

pnpm ≥10 第一次从 Git 安装时可能会询问是否允许 `prepare` 脚本（`allowBuilds`）。

## 发布

`npm login` 之后：

```sh
pnpm --filter @yugasun/dsh-web-search publish
```

版本号和试打包见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

[MIT](LICENSE)
