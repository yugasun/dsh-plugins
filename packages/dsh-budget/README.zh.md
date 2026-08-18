# dsh-budget

[![npm](https://img.shields.io/npm/v/@yugasun/dsh-budget.svg)](https://www.npmjs.com/package/@yugasun/dsh-budget)

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的**工具输出上限**。它只截过长的**纯文本工具结果**（包括官方 spill 会跳过的 `read`），总上下文仍交给官方 compaction。

兼容 DeepSeek Harness **0.1.0-rc.7**。

[English](README.md)

> 安装插件会在 Harness 进程内以你的权限运行第三方代码。安装前请阅读源码。

## 安装

从 npm：

```sh
dsh plugin --profile web add @yugasun/dsh-budget
```

从本仓库本地路径：

```sh
dsh plugin --profile web add ./packages/dsh-budget
```

安装后请重启 `dsh web`。然后打开侧栏 **设置 → 工具输出**。对话输入栏也会出现带「输出」文字的按钮。设置页上的开关和数字对下一条工具结果立即生效；用手改 `~/.dsh/settings.yaml` 仍需重启。

从 Git 子目录：

```sh
dsh plugin --profile web add github:yugasun/dsh-plugins#path:packages/dsh-budget
```

卸载：

```sh
dsh plugin --profile web remove @yugasun/dsh-budget
```

## 做什么

设置页只留两件用户要管的事：

- **启用**：需要完整日志时关掉
- **单条工具结果上限**（默认 4000）：一条过长的 bash / 读文件输出只留头尾

它**不管**整次请求有多大。官方 compaction 仍按模型窗口的 80% 触发。官方 spill 仍会跳过 `read` 和嵌套 `exec.parent`；本插件会截 `read`，嵌套 exec 同样跳过。

`~/.dsh/settings.yaml` 里如果还留着 `maxInputTokens`，会被忽略。

失败一律放行，不在界面上暴露。

## 示例任务

`dsh web` 已加载插件后，打开一个工作区，把下面的话直接发给 agent。

### 1. 三十秒看到裁切

**设置 → 工具输出** 把 **单条工具结果上限** 改成 `256`，然后发：

```
把 README.md 全文贴回来，不要摘要。
```

你应该看到：

- 工具结果是**头尾预览**，不是整份文件
- 类似 `dsh-budget: omitted ~N tokens. Full result stored at: …`
- 输入栏 **输出** 会变绿；设置页「本会话效果」会显示少带了多少

关掉 **启用工具输出上限**，再发同一句，工具结果应恢复全文。验证完请重新打开，并把上限改回 `4000`。

### 2. 默认上限，接近真实日志

上限保持 `4000`，发：

```
写一个 /tmp/dsh-budget-demo.log，共 8000 行，每行都是：
2026-08-18T03:00:00Z INFO job=build step=compile file=src/index.ts message=ok
然后 cat 整个文件，告诉我编译有没有成功，并引用最后一行。
```

`cat` / `read` 的结果应停在大约 4,000 token（约 1.6 万字符），而不是整份日志。

## 开发

```sh
pnpm --filter @yugasun/dsh-budget test
pnpm --filter @yugasun/dsh-budget build
```

## 许可证

[MIT](LICENSE)
