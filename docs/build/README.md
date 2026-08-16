# V2 Server 编译与验证

本文面向修改 OpenCode V2 Server 及其依赖代码的开发者。日常开发只需要记住一条命令：

```bash
bun run build:server
```

它会使用当前工作区的最新源码，生成可直接运行的 `opencode-server`，启动产物并通过真实 HTTP 请求验证结果。

## 最佳工作流

在 `packages/server` 或它依赖的 Core、Protocol、Schema、Util 等 V2 包中完成修改后，回到仓库根目录运行：

```bash
bun run build:server
```

不需要先分别进入每个包执行构建，也不需要手工启动 Server 做基础健康检查。

命令成功时会出现类似输出：

```text
verified .../packages/server/dist/bin/opencode-server via http://127.0.0.1:<port>/api/health
```

看到 `verified` 即表示：

- Server 及其 workspace 依赖已经参与构建。
- 最新源码已经被打入可执行文件。
- 可执行文件能够在仓库外的临时目录启动。
- HTTP Basic Auth 工作正常。
- `GET /api/health` 返回成功。
- 响应包含 `healthy: true` 和预期版本。

如果命令失败，当前修改不应视为已经完成验证。

## 首次准备

仓库使用 Bun，版本以根目录 `package.json` 为准。当前版本为：

```text
bun@1.3.14
```

首次拉取代码或 lockfile 更新后，在仓库根目录执行：

```bash
bun install --frozen-lockfile
```

之后每次修改 Server 相关代码，只需运行：

```bash
bun run build:server
```

## 这条命令覆盖什么

根脚本实际调用：

```bash
bun turbo build --filter=@opencode-ai/server...
```

过滤器末尾的 `...` 会选择：

- `@opencode-ai/server`
- Server 的直接 workspace 依赖
- Server 的传递 workspace 依赖

因此，修改以下代码后都使用同一条命令：

```text
packages/server
packages/core
packages/protocol
packages/schema
packages/util
以及 Server 依赖图中的其他 V2 包
```

CLI、TUI、App、Desktop 等反向依赖不会因为构建 Server 而被编译。它们不属于 Server 可执行产物的运行范围。

## 构建和验证原理

Server 构建脚本以 `packages/server/src/main.ts` 为入口，通过 `Bun.build()`：

1. 分析 Server 可达的运行时依赖。
2. 打包最新的 V2 Server 及其依赖源码。
3. 嵌入 Bun Runtime 和当前平台需要的原生绑定。
4. 生成当前操作系统和 CPU 架构的单文件可执行程序。

产物路径为：

```text
packages/server/dist/bin/opencode-server
```

Windows 下为：

```text
packages/server/dist/bin/opencode-server.exe
```

生成产物后，脚本会自动：

1. 将产物复制到临时目录。
2. 创建随机测试密码、随机端口和临时 SQLite 数据库。
3. 启动复制后的可执行文件。
4. 使用用户名 `opencode` 和测试密码请求 `/api/health`。
5. 校验响应后停止进程并清理临时文件。

随机测试密码仅用于本次构建验证，不会写入正式产物。

## 运行编译产物

构建成功后，设置运行密码并启动：

```bash
OPENCODE_SERVER_PASSWORD='your-secure-password' \
./packages/server/dist/bin/opencode-server
```

默认监听 `127.0.0.1`，并从端口 `4096` 开始寻找可用端口。启动成功后会输出实际地址：

```text
OPENCODE_SERVER_LISTENING {"url":"http://127.0.0.1:4096"}
```

手工调用 Health API：

```bash
curl -u opencode:your-secure-password \
  http://127.0.0.1:4096/api/health
```

固定端口和数据库路径：

```bash
OPENCODE_SERVER_PASSWORD='your-secure-password' \
OPENCODE_SERVER_HOSTNAME='127.0.0.1' \
OPENCODE_SERVER_PORT='8080' \
OPENCODE_DB='/tmp/opencode-dev.db' \
OPENCODE_DISABLE_MODELS_FETCH='1' \
./packages/server/dist/bin/opencode-server
```

编译后的可执行文件不需要 Bun、npm 或 `node_modules`。它只包含 V2 HTTP Server，不包含 CLI、TUI 或 Web UI。

## 什么时候需要额外操作

`bun run build:server` 是统一的产物构建和基础运行验证入口。只有以下情况需要补充操作。

### 修改公开 Protocol 或 Server `HttpApi`

必须重新生成客户端代码，不能直接编辑生成目录：

```bash
cd packages/client
bun run generate

cd ../..
bun run build:server
```

### 修改具体业务行为

自动验证只覆盖 Server 启动、认证和 `/api/health`。修改 Session、数据库、权限、文件系统或具体 Handler 时，应从对应包目录运行相关测试，然后仍以根目录构建作为最终产物验证：

```bash
cd packages/server
bun test test/<相关测试文件>.test.ts

cd ../..
bun run build:server
```

不要从仓库根目录运行 `bun test`。

### 跨平台发布

构建目标由当前机器决定。macOS、Linux、Windows，以及 ARM64、x64 产物需要在对应平台分别运行同一条命令：

```bash
bun run build:server
```

## 提交前最小检查

对于普通 Server 或 Core 修改，提交前确认：

```bash
bun run build:server
```

并在日志中看到：

```text
verified .../opencode-server via .../api/health
```

这就是当前推荐的统一编译与基础验证流程。
