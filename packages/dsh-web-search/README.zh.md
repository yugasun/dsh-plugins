# dsh-web-search

[![npm](https://img.shields.io/npm/v/@yugasun/dsh-web-search.svg)](https://www.npmjs.com/package/@yugasun/dsh-web-search)

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的**多后端网页搜索**。向 `ctx.web` 注册百度、豆包、Tavily、Exa；模型侧仍使用官方 `web_search` / `web_fetch` 工具。

兼容 DeepSeek Harness **0.1.0-rc.7**。

[English](README.md)

> 安装插件会在 Harness 进程内以你的权限运行第三方代码。安装前请阅读源码。

## 安装

从 npm：

```sh
dsh plugin --profile web add @yugasun/dsh-web-search
```

从本仓库本地路径：

```sh
dsh plugin --profile web add ./packages/dsh-web-search
```

安装后请重启 `dsh web`。设置侧栏会出现 **网络搜索** 页。关闭 **自定义搜索** 则继续用 DSH 内置 `web_search` 和 `web_fetch`；开启后配置百度 / 豆包 / Tavily / Exa。

![网络搜索设置界面](docs/settings.png)

从 Git 子目录：

```sh
dsh plugin --profile web add github:yugasun/dsh-plugins#path:packages/dsh-web-search
```

卸载：

```sh
dsh plugin --profile web remove @yugasun/dsh-web-search
```

## 后端

| Id | 服务 | 密钥 | 说明 |
| --- | --- | --- | --- |
| `baidu` | 千帆智能搜索生成 | `BAIDU_API_KEY` / `QIANFAN_API_KEY` | 使用千帆模型返回总结和网页引用。`web_fetch` 仍走 DSH 内置 `http` |
| `doubao` | 火山方舟 Responses + `web_search` | `ARK_API_KEY` / `DOUBAO_API_KEY` | 需要开通联网内容插件，并填写支持该工具的模型 ID。`web_fetch` 仍走 DSH 内置 `http` |
| `tavily` | Tavily Search `POST /search` 与 Extract `POST /extract` | `TAVILY_API_KEY` | 带摘要和可选 answer。该后端生效时，`web_fetch` 走 Extract |
| `exa` | Exa Search `POST /search` 与 Contents `POST /contents` | `EXA_API_KEY` | 默认 id 为 `exa`；若同时安装了官方 Exa 包，请改 `exaProviderId`。该后端生效时，`web_fetch` 走 Contents |

密钥可以写在插件设置、DSH 凭据（`TAVILY_API_KEY` 等）或 `~/.dsh/.env`。设置里的密钥不会回显到前端。

「设置 → 网络搜索」里的 **自定义搜索** 开关决定走 DSH 内置还是本插件。开启后默认 **自动** 按 百度 → 豆包 → Tavily → Exa 选用第一个已配置的。Tavily / Exa 生效时 `web_fetch` 走对应提取接口；百度 / 豆包仍用内置 `http`。Agent 里 `export TAVILY_API_KEY=…` **不会**进入 Harness 进程。

## 开发

```sh
pnpm --filter @yugasun/dsh-web-search test
pnpm --filter @yugasun/dsh-web-search build
```

## 许可证

[MIT](LICENSE)
