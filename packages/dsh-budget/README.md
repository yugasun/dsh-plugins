# dsh-budget

[![npm](https://img.shields.io/npm/v/@yugasun/dsh-budget.svg)](https://www.npmjs.com/package/@yugasun/dsh-budget)

Request-level **token budget** for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It does not replace compaction or add another context dashboard — it **caps what each model request carries**.

Compatible with DeepSeek Harness **0.1.0-rc.7**.

[中文文档](README.zh.md)

> Installing a plugin runs third-party code in the harness process with your permissions. Review the source before you install.

## Install

From npm:

```sh
dsh plugin --profile web add @yugasun/dsh-budget
```

From a clone of this monorepo:

```sh
dsh plugin --profile web add ./packages/dsh-budget
```

Restart `dsh web` after install (or if it is already running). Then:

1. Sidebar **Settings → Request budget** — enable, per-tool cap, per-request cap
2. Composer tool row — a **Budget** chip (click to toggle)
3. After a trim, a line also appears under the composer

The enable switch is live and does not need a second restart.

From Git (subdirectory):

```sh
dsh plugin --profile web add github:yugasun/dsh-plugins#path:packages/dsh-budget
```

Uninstall:

```sh
dsh plugin --profile web remove @yugasun/dsh-budget
```

## What it does

| Control | Default | Shown in Settings | Why it exists |
| --- | --- | --- | --- |
| Enable budget | on | yes | Escape hatch when you need the full tool log |
| Per tool-result cap | 4,000 tokens | yes | The usual win: one huge bash/read dump becomes a head/tail preview |
| Per-request cap | 64,000 tokens | yes | Second line: if the whole step is still over, shrink tool results further, then this step’s history |
| Fail open | on | no | Planner errors never block the agent; not a user preference |

Fixture-style savings (4 chars ≈ 1 token): a 40,000-token `bash` dump becomes ≤ 4,000 tokens of preview plus a spill locator — about **90% less** on that result alone.

## Try it

After `dsh web` is running with the plugin loaded, open a workspace and send these from the composer.

### 1. See a trim in 30 seconds

In **Settings → Request budget**, set **Per tool-result cap** to `256`. Then send:

```
Read README.md and paste the full file back. Do not summarize.
```

You should see:

- The tool result is a **head/tail preview**, not the whole file
- A line like `dsh-budget: omitted ~N tokens. Full result stored at: …`
- The composer **Budget** chip updates; **This session** on the settings page shows tokens kept off the model

Turn **Enable request budget** off and send the same prompt. The tool result should be the full file again. Turn it back on when you are done, and restore the cap to `4000`.

### 2. Default cap, realistic dump

Leave the cap at `4000`. Send:

```
Write /tmp/dsh-budget-demo.log with 8000 lines, each:
2026-08-18T03:00:00Z INFO job=build step=compile file=src/index.ts message=ok
Then cat the entire file and tell me whether the build succeeded, quoting the last line.
```

The `cat` / `read` result should stay near 4,000 tokens (about 16k characters) instead of the full ~640k-character log — roughly **90% less** on that one result. The assistant can still answer from the head/tail plus the spill locator.

### 3. Confirm it is request-level, not compaction

With the budget still on, scroll the transcript: your earlier messages are unchanged. Only the **next** model request is smaller. Settings → Request budget → **Last amount sent to the model** is the before/after for that request.

## How

- `tools/post-execute` — bound oversized tool text; uses `ctx.spillStore` when present
- `agent/pre-step` — measure with `ctx.tokenMeter` when present, rewrite claimed messages if still over budget, inject a one-line notice
- Web chat — composer ring (`conversation.input.left`) plus a dock line after a trim (`conversation.composer.dock`)
- Settings page — **Settings → Request budget** for the three user-facing controls above

Failures fail open. Required system content is never dropped.

## Develop

```sh
pnpm --filter @yugasun/dsh-budget test
pnpm --filter @yugasun/dsh-budget build
```

## License

[MIT](LICENSE)
