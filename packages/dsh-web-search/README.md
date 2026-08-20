# dsh-web-search

[![npm](https://img.shields.io/npm/v/@yugasun/dsh-web-search.svg)](https://www.npmjs.com/package/@yugasun/dsh-web-search)

Multi-provider **web search** for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It registers Baidu, Doubao, Tavily, and Exa backends into `ctx.web`. The model-facing `web_search` / `web_fetch` tools stay the official `@deepseek-ai/dsh-tool-web` schema.

Compatible with DeepSeek Harness **0.1.0-rc.7**.

[中文文档](README.zh.md)

> Installing a plugin runs third-party code in the harness process with your permissions. Review the source before you install.

## Install

From npm:

```sh
dsh plugin --profile web add @yugasun/dsh-web-search
```

From a clone of this monorepo (`dsh plugin add` `link`s the source tree, so Node resolves `@deepseek-ai/*` from this package. Run `pnpm install` at the repo root first. Relative paths resolve against the **profile directory**, not your cwd — use `$PWD`):

```sh
pnpm install
dsh plugin --profile web add "$PWD/packages/dsh-web-search"
dsh plugin --profile desktop add "$PWD/packages/dsh-web-search"
```

Restart `dsh web`. Settings has a **Web search** page. Turn **Custom search** off to keep DSH built-in `web_search` (`deepseek-official`) and `web_fetch` (`http`); turn it on to use Baidu / Doubao / Tavily / Exa. **Page extract** is independent: auto follows Tavily/Exa search, or pin Tavily Extract, Exa Contents, or DSH `http`.

![Web search settings](docs/settings.png)

From Git (subdirectory):

```sh
dsh plugin --profile web add github:yugasun/dsh-plugins#path:packages/dsh-web-search
```

Uninstall:

```sh
dsh plugin --profile web remove @yugasun/dsh-web-search
```

## Providers

| Id | Backend | Key | Notes |
| --- | --- | --- | --- |
| `baidu` | [Qianfan Intelligent Search Generation](https://cloud.baidu.com/doc/qianfan-api/s/Hmbu8m06u) `POST /v2/ai_search/chat/completions` | `BAIDU_API_KEY` or `QIANFAN_API_KEY` | Uses a Qianfan model to return a summary plus web references. Knowledge-style queries often return a summary with **no `references`**; the plugin then recovers `https?://` URLs from the summary text when it can. |
| `doubao` | [Volcengine Ark Responses](https://www.volcengine.com/docs/82379/1756990) + `web_search` tool | `ARK_API_KEY` or `DOUBAO_API_KEY` | Needs a Doubao model id that supports the web-search plugin. |
| `tavily` | [Tavily Search](https://docs.tavily.com) `POST /search` and [Extract](https://docs.tavily.com/documentation/api-reference/endpoint/extract) `POST /extract` | `TAVILY_API_KEY` | LLM-oriented snippets plus an optional answer. Available as a `web_fetch` backend. |
| `exa` | [Exa Search](https://docs.exa.ai) `POST /search` and [Contents](https://docs.exa.ai/reference/get-contents) `POST /contents` | `EXA_API_KEY` | Search returns **links only** (no answer). Default provider id is `exa`; change `exaProviderId` if the official `@deepseek-ai/dsh-web-search-exa` is also installed. Available as a `web_fetch` backend. |

Keys are read in this order: plugin settings, DSH credentials (`TAVILY_API_KEY` and friends), then the launch environment / `~/.dsh/.env`. Settings secrets are never echoed back to the client. A `export TAVILY_API_KEY=…` inside an agent bash tool does **not** reach the harness process.

## Selection

Installing the plugin can retarget official `web_search` at this package's facade id `dsh-web-search`. **Settings → Web search** has a **Custom search** switch:

- **Off**: `web_search` uses DSH built-in `deepseek-official`; `web_fetch` uses `http`
- **On** (default): pick the search backend below
  - **Auto** (default): first configured backend in order Baidu → Doubao → Tavily → Exa. If that request fails with a recoverable error, the next configured backend is tried and the harness log records which one was skipped. An explicit backend does not fail over.
  - **Explicit**: Baidu / Doubao / Tavily / Exa
- **Page extract** (independent of search)
  - **Auto** (default): Tavily Extract or Exa Contents when that search backend is active; otherwise DSH built-in `http`
  - **Built-in HTTP** / **Tavily** / **Exa**: pin `web_fetch` regardless of which search backend is active
- Each backend card has **Test connection**, which runs a one-result `web_search` against that vendor. Status "configured" still means a key is present; the probe tells you whether the key works.

## Develop

```sh
pnpm --filter @yugasun/dsh-web-search test
pnpm --filter @yugasun/dsh-web-search build
```

## License

[MIT](LICENSE)
