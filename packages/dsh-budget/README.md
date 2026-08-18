# dsh-budget

[![npm](https://img.shields.io/npm/v/@yugasun/dsh-budget.svg)](https://www.npmjs.com/package/@yugasun/dsh-budget)

A **tool-output guard** for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It caps oversized **plain-text tool results** — including `read`, which official spill skips — and leaves total context to official compaction.

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

1. Sidebar **Settings → Tool output** — enable, per-result cap
2. Composer tool row — an **Output** chip (click to toggle)
3. After a trim, a line also appears under the composer

The enable switch and the numeric cap on the settings page apply to the next tool result. Editing `~/.dsh/settings.yaml` by hand still needs a restart.

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
| Enable | on | yes | Escape hatch when you need the full tool log |
| Per tool-result cap | 4,000 tokens | yes | One huge bash/`read` dump becomes a head/tail preview |
| Fail open | on | no | Hook errors never block the agent; not a user preference |

It does **not** cap total request size. Official compaction still runs at 80% of the model window. Official spill still skips `read` and nested `exec.parent`; this plugin trims `read` and still skips nested exec.

If `~/.dsh/settings.yaml` still has a leftover `maxInputTokens` key, it is ignored.

## Try it

After `dsh web` is running with the plugin loaded, open a workspace and send these from the composer.

### 1. See a trim in 30 seconds

In **Settings → Tool output**, set **Per tool-result cap** to `256`. Then send:

```
Read README.md and paste the full file back. Do not summarize.
```

You should see:

- The tool result is a **head/tail preview**, not the whole file
- A line like `dsh-budget: omitted ~N tokens. Full result stored at: …`
- The composer **Output** chip turns green; **This session** on the settings page shows tokens kept off the model

Turn **Enable tool-output cap** off and send the same prompt. The tool result should be the full file again. Turn it back on when you are done, and restore the cap to `4000`.

### 2. Default cap, realistic dump

Leave the cap at `4000`. Send:

```
Write /tmp/dsh-budget-demo.log with 8000 lines, each:
2026-08-18T03:00:00Z INFO job=build step=compile file=src/index.ts message=ok
Then cat the entire file and tell me whether the build succeeded, quoting the last line.
```

The `cat` / `read` result should stay near 4,000 tokens (about 16k characters) instead of the full dump.

## How

- `tools/post-execute` — cap oversized plain-text tool results; uses `ctx.spillStore` when present
- Skips nested `exec.parent`, `value` replacements, `block`, and mixed non-text — same as spill-policy
- Does **not** skip `read`
- Web chat — composer chip (`conversation.input.left`) plus a dock line after a trim (`conversation.composer.dock`)
- Settings page — **Settings → Tool output** for the two user-facing controls above

Failures fail open.

## Develop

```sh
pnpm --filter @yugasun/dsh-budget test
pnpm --filter @yugasun/dsh-budget build
```

## License

[MIT](LICENSE)
