# opencode V2 HTTP API 分类手册与 Postman 调用示例

> 数据源：`packages/protocol/openapi.json`（OpenAPI 0.0.1）。本文件由 `bun run generate:reference` 生成，请勿手工维护接口明细。

## 快速开始

1. 在 Postman 中导入同目录的 `opencode-v2.postman_collection.json`。
2. 设置环境变量 `baseUrl`；所有请求 URL 均采用 `{{baseUrl}}/api/...`，不写死 host 或端口。其余资源 ID 在调用创建类接口后更新。
3. 所有 request 都不单独配置认证，统一继承 Collection 级 Authorization。当前示例 Collection 在父级配置 Basic Auth，用户名和密码分别读取 `{{username}}`、`{{password}}`。
4. 每个接口下的 cURL 也可通过 Postman 的 Import → Raw text 直接导入。示例中的 `{{variable}}` 是 Postman 变量。

## 通用约定

- JSON 成功响应通常使用 `{ "data": ... }` 信封；以实际 response schema 为准。
- `location` 使用 deep-object 查询参数，例如 `location[directory]=/repo` 和 `location[workspace]=...`。它们在 Collection 中默认禁用，启用后用于显式选择工作位置。
- 可选查询参数在 Collection 中保留但默认禁用；需要时在 Params 页签勾选并填写。
- `GET /api/event` 和实验性 session log 是 SSE；`GET /api/pty/{ptyID}/connect` 是 WebSocket；`GET /api/fs/read/*` 返回二进制文件。
- 示例 ID 只是占位符。要成功调用依赖资源的接口，先执行对应 list/create API，并把真实 ID 写入 Collection Variables。

共 **116** 个 HTTP 操作、**28** 个分类。

## 分类总览

| 分类 | OpenAPI tag | API 数量 |
|---|---|---:|
| [健康检查与服务控制](#health) | `health` | 2 |
| [服务信息](#server) | `server` | 1 |
| [工作位置](#location) | `location` | 1 |
| [Agent](#agent) | `agent` | 2 |
| [插件](#plugin) | `plugin` | 1 |
| [会话、消息与上下文](#session) | `session` | 36 |
| [模型](#model) | `model` | 2 |
| [一次性生成](#generate) | `generate` | 1 |
| [模型供应商](#provider) | `provider` | 2 |
| [外部集成与认证](#integration) | `integration` | 11 |
| [MCP 服务与资源](#mcp) | `mcp` | 6 |
| [凭证](#credential) | `credential` | 2 |
| [项目](#project) | `project` | 2 |
| [交互表单](#form) | `form` | 7 |
| [权限请求](#permission) | `permission` | 7 |
| [文件系统](#filesystem) | `filesystem` | 3 |
| [命令目录](#command) | `command` | 1 |
| [技能目录](#skill) | `skill` | 1 |
| [事件流](#event) | `event` | 1 |
| [PTY 终端](#pty) | `pty` | 7 |
| [Shell 命令](#shell) | `shell` | 6 |
| [项目引用](#reference) | `reference` | 1 |
| [Git Worktree](#worktree) | `worktree` | 4 |
| [版本控制](#vcs) | `vcs` | 3 |
| [调试](#debug) | `debug` | 2 |
| [迁移](#migration) | `migration` | 1 |
| [网络搜索](#websearch) | `websearch` | 2 |
| [配置](#config) | `config` | 1 |

<a id="health"></a>
## 健康检查与服务控制（`health`）

opencode 健康检查与服务控制相关接口。

### 1. `GET /api/health` — Check server health

- Operation ID：`v2.health.get`
- 说明：Report the owning server process and its application status.

参数：

无。

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | ServiceHealth | `application/json` | ServiceHealth |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/health' \
  --header 'Accept: application/json'
```

### 2. `POST /api/service/stop` — Stop the managed server

- Operation ID：`v2.health.stop`
- 说明：Request graceful shutdown of one exact managed server instance.

参数：

无。

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `instanceID` | 是 | string |

最小请求体示例：

```json
{
  "instanceID": "{{instanceID}}"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | ServiceStopResponse | `application/json` | ServiceStopResponse |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/service/stop' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "instanceID": "{{instanceID}}"
  }'
```

<a id="server"></a>
## 服务信息（`server`）

opencode 服务信息相关接口。

### 1. `GET /api/server` — Get server information

- Operation ID：`v2.server.get`
- 说明：Return the URLs that can be used to connect to this server.

参数：

无。

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { urls: array<string> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/server' \
  --header 'Accept: application/json'
```

<a id="location"></a>
## 工作位置（`location`）

opencode 工作位置相关接口。

### 1. `GET /api/location` — Get location

- Operation ID：`v2.location.get`
- 说明：Resolve the requested location or the server default location.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Location.Info | `application/json` | Location.Info |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/location' \
  --header 'Accept: application/json'
```

<a id="agent"></a>
## Agent（`agent`）

opencode Agent相关接口。

### 1. `GET /api/agent` — List agents

- Operation ID：`v2.agent.list`
- 说明：Retrieve currently registered agents.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<Agent.Info> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/agent' \
  --header 'Accept: application/json'
```

### 2. `GET /api/agent/{agentID}` — Get agent

- Operation ID：`v2.agent.get`
- 说明：Retrieve a single currently registered agent.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `agentID` | 是 | string | `{{agentID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: Agent.Info } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | AgentNotFoundError | `application/json` | AgentNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/agent/{{agentID}}' \
  --header 'Accept: application/json'
```

<a id="plugin"></a>
## 插件（`plugin`）

Experimental plugin routes.

### 1. `GET /api/plugin` — List plugins

- Operation ID：`v2.plugin.list`
- 说明：Retrieve currently loaded plugins.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<Plugin.Info> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/plugin' \
  --header 'Accept: application/json'
```

<a id="session"></a>
## 会话、消息与上下文（`session`）

Experimental session routes.

### 1. `GET /api/session` — List sessions

- Operation ID：`v2.session.list`
- 说明：Retrieve sessions in the requested order. Items keep that order across pages; use cursor.next or cursor.previous to move through the ordered list.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `workspace` | 否 | string \| null | `{{workspace}}` |
| query | `limit` | 否 | string \| null | `example` |
| query | `order` | 否 | asc \| desc \| null | `asc` |
| query | `search` | 否 | string \| null | `example` |
| query | `parentID` | 否 | string \| null \| null | `{{parentID}}` |
| query | `directory` | 否 | string \| null | `{{directory}}` |
| query | `project` | 否 | string \| null | `example` |
| query | `subpath` | 否 | string \| null | `{{directory}}` |
| query | `cursor` | 否 | string \| null | `example` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | SessionsResponse | `application/json` | SessionsResponse |
| 400 | InvalidCursorError \| InvalidRequestError | `application/json` | InvalidCursorError \| InvalidRequestError1 \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/session' \
  --header 'Accept: application/json'
```

### 2. `POST /api/session` — Create session

- Operation ID：`v2.session.create`
- 说明：Create a session at the requested location.

参数：

无。

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `id` | 否 | string \| null |
| `title` | 否 | string \| null |
| `agent` | 否 | string \| null |
| `model` | 否 | Model.Ref \| null |
| `location` | 否 | Location.Ref \| null |

最小请求体示例：

```json
{}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: Session.Info } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

### 3. `POST /api/session/import` — Import session

- Operation ID：`v2.session.import`
- 说明：Import a projected session transcript at the requested location.

参数：

无。

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `info` | 是 | Session.Info |
| `messages` | 是 | array<Session.Message.Info> |
| `location` | 否 | Location.Ref \| null |

最小请求体示例：

```json
{
  "info": {
    "id": "{{id}}",
    "projectID": "{{projectID}}",
    "cost": 1,
    "tokens": {
      "input": 1,
      "output": 1,
      "reasoning": 1,
      "cache": {
        "read": 1,
        "write": 1
      }
    },
    "time": {
      "created": 1,
      "updated": 1
    },
    "location": {
      "directory": "{{directory}}"
    }
  },
  "messages": [
    {
      "id": "{{id}}",
      "time": {
        "created": 1
      },
      "type": "agent-switched",
      "agent": "build"
    }
  ]
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: Session.Info } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 409 | ConflictError | `application/json` | ConflictError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/import' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "info": {
      "id": "{{id}}",
      "projectID": "{{projectID}}",
      "cost": 1,
      "tokens": {
        "input": 1,
        "output": 1,
        "reasoning": 1,
        "cache": {
          "read": 1,
          "write": 1
        }
      },
      "time": {
        "created": 1,
        "updated": 1
      },
      "location": {
        "directory": "{{directory}}"
      }
    },
    "messages": [
      {
        "id": "{{id}}",
        "time": {
          "created": 1
        },
        "type": "agent-switched",
        "agent": "build"
      }
    ]
  }'
```

### 4. `GET /api/session/{sessionID}/export` — Export session

- Operation ID：`v2.session.export`
- 说明：Export a complete projected session transcript.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |
| query | `sanitize` | 否 | true \| false \| null | `true` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: SessionTransfer.Data } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError |
| 500 | UnknownError | `application/json` | UnknownError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/session/{{sessionID}}/export' \
  --header 'Accept: application/json'
```

### 5. `GET /api/session/active` — List active sessions

- Operation ID：`v2.session.active`
- 说明：Retrieve foreground Session drains currently owned by this OpenCode process. Sessions absent from the result are inactive.

参数：

无。

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: object } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/session/active' \
  --header 'Accept: application/json'
```

### 6. `GET /api/session/{sessionID}` — Get session

- Operation ID：`v2.session.get`
- 说明：Retrieve a session by ID.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: Session.Info } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/session/{{sessionID}}' \
  --header 'Accept: application/json'
```

### 7. `DELETE /api/session/{sessionID}` — Delete session

- Operation ID：`v2.session.remove`
- 说明：Delete a session and its child sessions.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request DELETE \
  --url '{{baseUrl}}/api/session/{{sessionID}}' \
  --header 'Accept: application/json'
```

### 8. `POST /api/session/{sessionID}/fork` — Fork session

- Operation ID：`v2.session.fork`
- 说明：Create a child session by copying projected history through or before a message boundary.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `boundary` | 是 | Session.ForkRequestBoundary |

最小请求体示例：

```json
{
  "boundary": {
    "type": "before",
    "messageID": "{{messageID}}"
  }
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: Session.Info } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError1 \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError \| MessageNotFoundError | `application/json` | MessageNotFoundError \| SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/fork' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "boundary": {
      "type": "before",
      "messageID": "{{messageID}}"
    }
  }'
```

### 9. `POST /api/session/{sessionID}/agent` — Switch session agent

- Operation ID：`v2.session.switchAgent`
- 说明：Switch the agent used by subsequent provider turns.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `agent` | 是 | string |

最小请求体示例：

```json
{
  "agent": "build"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/agent' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "agent": "build"
  }'
```

### 10. `POST /api/session/{sessionID}/model` — Switch session model

- Operation ID：`v2.session.switchModel`
- 说明：Switch the model used by subsequent provider turns.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `model` | 是 | Model.Ref |

最小请求体示例：

```json
{
  "model": {
    "id": "{{id}}",
    "providerID": "{{providerID}}"
  }
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/model' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": {
      "id": "{{id}}",
      "providerID": "{{providerID}}"
    }
  }'
```

### 11. `POST /api/session/{sessionID}/rename` — Rename session

- Operation ID：`v2.session.rename`
- 说明：Update the session title.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `title` | 是 | string |

最小请求体示例：

```json
{
  "title": "Example session"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/rename' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "title": "Example session"
  }'
```

### 12. `POST /api/session/{sessionID}/move` — Move session

- Operation ID：`v2.session.move`
- 说明：Move a session to another project directory, optionally transferring local changes.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `directory` | 是 | string |
| `workspaceID` | 否 | string |
| `delivery` | 否 | Session.Inbox.Delivery \| null |

最小请求体示例：

```json
{
  "directory": "{{directory}}"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError1 \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/move' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "directory": "{{directory}}"
  }'
```

### 13. `POST /api/session/{sessionID}/prompt` — Send message

- Operation ID：`v2.session.prompt`
- 说明：Durably admit one session input and schedule agent-loop execution unless resume is false.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `id` | 否 | string \| null |
| `text` | 是 | string |
| `files` | 否 | array<PromptInput.FileAttachment> |
| `agents` | 否 | array<Prompt.AgentAttachment> |
| `skills` | 否 | array<PromptInput.SkillAttachment> |
| `metadata` | 否 | object |
| `delivery` | 否 | Session.Inbox.Delivery \| null |
| `resume` | 否 | boolean \| null |

最小请求体示例：

```json
{
  "text": "Hello from Postman"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: Session.Inbox.User } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError1 \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |
| 409 | ConflictError | `application/json` | ConflictError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/prompt' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "text": "Hello from Postman"
  }'
```

### 14. `POST /api/session/{sessionID}/command` — Run command

- Operation ID：`v2.session.command`
- 说明：Resolve a slash command into prompt input, admit it durably, and schedule execution unless resume is false.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `id` | 否 | string \| null |
| `command` | 是 | string |
| `arguments` | 否 | string \| null |
| `agent` | 否 | string \| null |
| `model` | 否 | Model.Ref \| null |
| `files` | 否 | array<PromptInput.FileAttachment> |
| `agents` | 否 | array<Prompt.AgentAttachment> |
| `skills` | 否 | array<PromptInput.SkillAttachment> |
| `delivery` | 否 | Session.Inbox.Delivery \| null |
| `resume` | 否 | boolean \| null |

最小请求体示例：

```json
{
  "command": "pwd"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: Session.Inbox.User } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError1 \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError \| CommandNotFoundError | `application/json` | CommandNotFoundError \| SessionNotFoundError \| SessionNotFoundError |
| 409 | ConflictError | `application/json` | ConflictError |
| 500 | CommandEvaluationError | `application/json` | CommandEvaluationError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/command' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "command": "pwd"
  }'
```

### 15. `POST /api/session/{sessionID}/skill` — Activate skill

- Operation ID：`v2.session.skill`
- 说明：Activate a skill for a session by appending a skill message and resuming execution.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `id` | 否 | string \| null |
| `skill` | 是 | string |
| `resume` | 否 | boolean \| null |

最小请求体示例：

```json
{
  "skill": "example"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError \| SkillNotFoundError | `application/json` | SkillNotFoundError \| SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/skill' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "skill": "example"
  }'
```

### 16. `POST /api/session/{sessionID}/synthetic` — Add synthetic message

- Operation ID：`v2.session.synthetic`
- 说明：Durably admit synthetic session input and schedule execution unless resume is false.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `id` | 否 | string \| null |
| `text` | 是 | string |
| `description` | 否 | string \| null |
| `metadata` | 否 | object |
| `delivery` | 否 | Session.Inbox.Delivery \| null |
| `resume` | 否 | boolean \| null |

最小请求体示例：

```json
{
  "text": "Hello from Postman"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: Session.Inbox.Synthetic } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |
| 409 | ConflictError | `application/json` | ConflictError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/synthetic' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "text": "Hello from Postman"
  }'
```

### 17. `POST /api/session/{sessionID}/shell` — Run shell command

- Operation ID：`v2.session.shell`
- 说明：Execute one shell command in the session's working directory. Emits a shell.started event before execution and a shell.ended event with the merged output after.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `id` | 否 | string \| null |
| `command` | 是 | string |

最小请求体示例：

```json
{
  "command": "pwd"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/shell' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "command": "pwd"
  }'
```

### 18. `POST /api/session/{sessionID}/compact` — Compact session

- Operation ID：`v2.session.compact`
- 说明：Queue a durable session compaction request.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `id` | 否 | string \| null |
| `delivery` | 否 | Session.Inbox.Delivery \| null |

最小请求体示例：

```json
{}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: Session.Inbox.Compaction } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |
| 409 | ConflictError | `application/json` | ConflictError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/compact' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

### 19. `POST /api/session/{sessionID}/wait` — Wait for session

- Operation ID：`v2.session.wait`
- 说明：Wait for a session agent loop to become idle.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |
| 503 | ServiceUnavailableError | `application/json` | ServiceUnavailableError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/wait' \
  --header 'Accept: application/json'
```

### 20. `POST /api/session/{sessionID}/revert/stage` — Stage session revert

- Operation ID：`v2.session.revert.stage`
- 说明：Stage or move a reversible session boundary and optionally apply its file changes.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `messageID` | 是 | string |
| `files` | 否 | boolean \| null |

最小请求体示例：

```json
{
  "messageID": "{{messageID}}"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: Session.Revert } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | MessageNotFoundError \| SessionNotFoundError | `application/json` | MessageNotFoundError \| SessionNotFoundError \| SessionNotFoundError |
| 409 | SessionBusyError | `application/json` | SessionBusyError |
| 500 | UnknownError | `application/json` | UnknownError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/revert/stage' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "messageID": "{{messageID}}"
  }'
```

### 21. `POST /api/session/{sessionID}/revert/clear` — Clear staged revert

- Operation ID：`v2.session.revert.clear`

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |
| 409 | SessionBusyError | `application/json` | SessionBusyError |
| 500 | UnknownError | `application/json` | UnknownError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/revert/clear' \
  --header 'Accept: application/json'
```

### 22. `POST /api/session/{sessionID}/revert/commit` — Commit staged revert

- Operation ID：`v2.session.revert.commit`

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |
| 409 | SessionBusyError | `application/json` | SessionBusyError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/revert/commit' \
  --header 'Accept: application/json'
```

### 23. `GET /api/session/{sessionID}/context` — Get session context

- Operation ID：`v2.session.context`
- 说明：Retrieve the active context messages for a session (all messages after the last compaction).

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: array<Session.Message.Info> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError |
| 500 | UnknownError | `application/json` | UnknownError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/session/{{sessionID}}/context' \
  --header 'Accept: application/json'
```

### 24. `GET /api/session/{sessionID}/inbox` — List session inbox

- Operation ID：`v2.session.inbox.list`
- 说明：List durable enqueued session work not yet delivered, ordered by enqueue sequence. Includes user, synthetic, compaction, and move items.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: array<Session.Inbox.Info> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/session/{{sessionID}}/inbox' \
  --header 'Accept: application/json'
```

### 25. `DELETE /api/session/{sessionID}/inbox/{inboxID}` — Cancel inbox input

- Operation ID：`v2.session.inbox.cancel`
- 说明：Cancel an inbox item that has not yet been delivered.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |
| path | `inboxID` | 是 | string | `{{inboxID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError |
| 409 | ConflictError | `application/json` | ConflictError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request DELETE \
  --url '{{baseUrl}}/api/session/{{sessionID}}/inbox/{{inboxID}}' \
  --header 'Accept: application/json'
```

### 26. `POST /api/session/{sessionID}/inbox/{inboxID}/steer` — Steer queued item

- Operation ID：`v2.session.inbox.steer`
- 说明：Change a queued inbox item to steer delivery and wake session execution.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |
| path | `inboxID` | 是 | string | `{{inboxID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError |
| 409 | ConflictError | `application/json` | ConflictError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/inbox/{{inboxID}}/steer' \
  --header 'Accept: application/json'
```

### 27. `POST /api/session/{sessionID}/inbox/{inboxID}/queue` — Queue steered item

- Operation ID：`v2.session.inbox.queue`
- 说明：Change a steered inbox item to queued delivery.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |
| path | `inboxID` | 是 | string | `{{inboxID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError |
| 409 | ConflictError | `application/json` | ConflictError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/inbox/{{inboxID}}/queue' \
  --header 'Accept: application/json'
```

### 28. `GET /api/session/{sessionID}/instructions/entries` — List instruction entries

- Operation ID：`v2.session.instructions.entry.list`
- 说明：List API-managed instruction entries attached to the session.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: array<InstructionEntry.Info> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/session/{{sessionID}}/instructions/entries' \
  --header 'Accept: application/json'
```

### 29. `PUT /api/session/{sessionID}/instructions/entries/{key}` — Put instruction entry

- Operation ID：`v2.session.instructions.entry.put`
- 说明：Attach or replace one durable instruction entry. Changes announce as updates at the next step boundary.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |
| path | `key` | 是 | InstructionEntry.Key | `{{key}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `value` | 是 | unknown |

最小请求体示例：

```json
{
  "value": {}
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |
| 413 | InstructionEntryValueTooLargeError | `application/json` | InstructionEntryValueTooLargeError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request PUT \
  --url '{{baseUrl}}/api/session/{{sessionID}}/instructions/entries/{{key}}' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "value": {}
  }'
```

### 30. `DELETE /api/session/{sessionID}/instructions/entries/{key}` — Remove instruction entry

- Operation ID：`v2.session.instructions.entry.remove`
- 说明：Remove one instruction entry; the removal is announced to the model at the next step boundary.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |
| path | `key` | 是 | InstructionEntry.Key | `{{key}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request DELETE \
  --url '{{baseUrl}}/api/session/{{sessionID}}/instructions/entries/{{key}}' \
  --header 'Accept: application/json'
```

### 31. `POST /api/session/{sessionID}/generate` — Generate text from session context

- Operation ID：`v2.session.generate`
- 说明：Generate transient text from the current session context without mutating session history.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `prompt` | 是 | string |

最小请求体示例：

```json
{
  "prompt": "Hello from Postman"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | SessionGenerateResponse | `application/json` | SessionGenerateResponse |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |
| 503 | ServiceUnavailableError | `application/json` | ServiceUnavailableError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/generate' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "prompt": "Hello from Postman"
  }'
```

### 32. `GET /api/experimental/session/{sessionID}/log` — Read the session log

- Operation ID：`v2.session.log`
- 说明：Experimental durable session event log. Reads events after an exclusive aggregate sequence and continues with live events when follow=true.
> 流式响应：`text/event-stream`，连接会保持打开。

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |
| query | `after` | 否 | string \| null | `example` |
| query | `follow` | 否 | true \| false \| null | `true` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `text/event-stream` | { id: string \| null, event: string, data: SessionLogItemJsonString } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/experimental/session/{{sessionID}}/log' \
  --header 'Accept: text/event-stream'
```

### 33. `POST /api/session/{sessionID}/interrupt` — Interrupt session execution

- Operation ID：`v2.session.interrupt`
- 说明：Interrupt active execution owned by this OpenCode process. Idle interruption is a no-op. When continue=true, execution resumes if durable inbox work remains after interruption.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |
| query | `continue` | 否 | true \| false \| null | `true` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/interrupt' \
  --header 'Accept: application/json'
```

### 34. `POST /api/session/{sessionID}/background` — Background blocking session tools

- Operation ID：`v2.session.background`
- 说明：Move active foreground backgroundable tools for this session into background observation. Idle requests are a no-op.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/background' \
  --header 'Accept: application/json'
```

### 35. `GET /api/session/{sessionID}/message/{messageID}` — Get session message

- Operation ID：`v2.session.message`
- 说明：Retrieve one projected message owned by the Session.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |
| path | `messageID` | 是 | string | `{{messageID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: Session.Message.Info } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError \| MessageNotFoundError | `application/json` | SessionNotFoundError \| MessageNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/session/{{sessionID}}/message/{{messageID}}' \
  --header 'Accept: application/json'
```

### 36. `GET /api/session/{sessionID}/message` — Get session messages

- Operation ID：`v2.message.list`
- 说明：Retrieve projected messages for a session. Items keep the requested order across pages; use cursor.next or cursor.previous to move through the ordered timeline.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |
| query | `limit` | 否 | string \| null | `example` |
| query | `order` | 否 | asc \| desc \| null | `asc` |
| query | `cursor` | 否 | string \| null | `example` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | SessionMessagesResponse | `application/json` | SessionMessagesResponse |
| 400 | InvalidCursorError \| InvalidRequestError | `application/json` | InvalidCursorError \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError |
| 500 | UnknownError | `application/json` | UnknownError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/session/{{sessionID}}/message' \
  --header 'Accept: application/json'
```

<a id="model"></a>
## 模型（`model`）

Experimental model routes.

### 1. `GET /api/model` — List models

- Operation ID：`v2.model.list`
- 说明：Retrieve the current snapshot of available models ordered by release date. The snapshot may precede initial plugin settlement.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<Model.Info> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 503 | ServiceUnavailableError | `application/json` | ServiceUnavailableError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/model' \
  --header 'Accept: application/json'
```

### 2. `GET /api/model/default` — Get default model

- Operation ID：`v2.model.default`
- 说明：Retrieve the model used when a session has no explicit model selection.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: Model.Info \| null } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 503 | ServiceUnavailableError | `application/json` | ServiceUnavailableError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/model/default' \
  --header 'Accept: application/json'
```

<a id="generate"></a>
## 一次性生成（`generate`）

Experimental one-shot generation routes.

### 1. `POST /api/generate` — Generate text

- Operation ID：`v2.generate.text`
- 说明：Run one stateless model generation at the requested location and return the assistant text. Uses the location's default model when none is specified.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `prompt` | 是 | string |
| `model` | 否 | Model.Ref \| null |

最小请求体示例：

```json
{
  "prompt": "Hello from Postman"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | GenerateTextResponse | `application/json` | GenerateTextResponse |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError1 \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 503 | ServiceUnavailableError | `application/json` | ServiceUnavailableError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/generate' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "prompt": "Hello from Postman"
  }'
```

<a id="provider"></a>
## 模型供应商（`provider`）

Experimental provider routes.

### 1. `GET /api/provider` — List providers

- Operation ID：`v2.provider.list`
- 说明：Retrieve active AI providers so clients can show provider availability and configuration.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<Provider.Info> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 503 | ServiceUnavailableError | `application/json` | ServiceUnavailableError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/provider' \
  --header 'Accept: application/json'
```

### 2. `GET /api/provider/{providerID}` — Get provider

- Operation ID：`v2.provider.get`
- 说明：Retrieve a single AI provider so clients can inspect its availability and endpoint settings.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `providerID` | 是 | string | `{{providerID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: Provider.Info } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | ProviderNotFoundError | `application/json` | ProviderNotFoundError |
| 503 | ServiceUnavailableError | `application/json` | ServiceUnavailableError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/provider/{{providerID}}' \
  --header 'Accept: application/json'
```

<a id="integration"></a>
## 外部集成与认证（`integration`）

Integration discovery and authentication routes.

### 1. `GET /api/integration` — List integrations

- Operation ID：`v2.integration.list`
- 说明：Retrieve available integrations and their authentication methods.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<Integration.Info> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/integration' \
  --header 'Accept: application/json'
```

### 2. `GET /api/integration/{integrationID}` — Get integration

- Operation ID：`v2.integration.get`
- 说明：Retrieve one integration and its authentication methods.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `integrationID` | 是 | string | `{{integrationID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: Integration.Info \| null } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/integration/{{integrationID}}' \
  --header 'Accept: application/json'
```

### 3. `POST /api/experimental/integration/wellknown` — Add wellknown integration

- Operation ID：`v2.experimental.integration.wellknown.add`
- 说明：Discover and persist an experimental wellknown integration source.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `url` | 是 | string |

最小请求体示例：

```json
{
  "url": "https://example.com"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError1 \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/experimental/integration/wellknown' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "url": "https://example.com"
  }'
```

### 4. `POST /api/integration/{integrationID}/connect/key` — Connect with key

- Operation ID：`v2.integration.connect.key`
- 说明：Run a key authentication method and store the resulting credential.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `integrationID` | 是 | string | `{{integrationID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `key` | 是 | string |
| `answer` | 否 | Form.Answer \| null |
| `label` | 否 | string \| null |

最小请求体示例：

```json
{
  "key": "{{key}}"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError1 \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/integration/{{integrationID}}/connect/key' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "key": "{{key}}"
  }'
```

### 5. `POST /api/integration/{integrationID}/connect/oauth` — Begin OAuth connection

- Operation ID：`v2.integration.oauth.connect`
- 说明：Start an OAuth attempt and return the authorization details.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `integrationID` | 是 | string | `{{integrationID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `methodID` | 是 | string |
| `answer` | 否 | Form.Answer \| null |
| `label` | 否 | string \| null |

最小请求体示例：

```json
{
  "methodID": "{{methodID}}"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: Integration.Attempt } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError1 \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/integration/{{integrationID}}/connect/oauth' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "methodID": "{{methodID}}"
  }'
```

### 6. `GET /api/integration/{integrationID}/connect/oauth/{attemptID}` — Get OAuth attempt status

- Operation ID：`v2.integration.oauth.status`
- 说明：Poll the current status of an OAuth attempt.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `integrationID` | 是 | string | `{{integrationID}}` |
| path | `attemptID` | 是 | string | `{{attemptID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: Integration.AttemptStatus } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/integration/{{integrationID}}/connect/oauth/{{attemptID}}' \
  --header 'Accept: application/json'
```

### 7. `DELETE /api/integration/{integrationID}/connect/oauth/{attemptID}` — Cancel OAuth connection

- Operation ID：`v2.integration.oauth.cancel`
- 说明：Cancel an OAuth attempt and release its resources.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `integrationID` | 是 | string | `{{integrationID}}` |
| path | `attemptID` | 是 | string | `{{attemptID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request DELETE \
  --url '{{baseUrl}}/api/integration/{{integrationID}}/connect/oauth/{{attemptID}}' \
  --header 'Accept: application/json'
```

### 8. `POST /api/integration/{integrationID}/connect/oauth/{attemptID}/complete` — Complete OAuth connection

- Operation ID：`v2.integration.oauth.complete`
- 说明：Complete a code-based OAuth attempt and store the resulting credential.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `integrationID` | 是 | string | `{{integrationID}}` |
| path | `attemptID` | 是 | string | `{{attemptID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `code` | 否 | string \| null |

最小请求体示例：

```json
{}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError1 \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/integration/{{integrationID}}/connect/oauth/{{attemptID}}/complete' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

### 9. `POST /api/integration/{integrationID}/connect/command` — Begin command connection

- Operation ID：`v2.integration.command.connect`
- 说明：Start a command authentication attempt.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `integrationID` | 是 | string | `{{integrationID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `methodID` | 是 | string |
| `label` | 否 | string \| null |

最小请求体示例：

```json
{
  "methodID": "{{methodID}}"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: Integration.CommandAttempt } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError1 \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/integration/{{integrationID}}/connect/command' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "methodID": "{{methodID}}"
  }'
```

### 10. `GET /api/integration/{integrationID}/connect/command/{attemptID}` — Get command attempt status

- Operation ID：`v2.integration.command.status`
- 说明：Poll the current status and output of a command authentication attempt.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `integrationID` | 是 | string | `{{integrationID}}` |
| path | `attemptID` | 是 | string | `{{attemptID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: Integration.CommandAttemptStatus } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/integration/{{integrationID}}/connect/command/{{attemptID}}' \
  --header 'Accept: application/json'
```

### 11. `DELETE /api/integration/{integrationID}/connect/command/{attemptID}` — Cancel command connection

- Operation ID：`v2.integration.command.cancel`
- 说明：Cancel a command authentication attempt and terminate its process.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `integrationID` | 是 | string | `{{integrationID}}` |
| path | `attemptID` | 是 | string | `{{attemptID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request DELETE \
  --url '{{baseUrl}}/api/integration/{{integrationID}}/connect/command/{{attemptID}}' \
  --header 'Accept: application/json'
```

<a id="mcp"></a>
## MCP 服务与资源（`mcp`）

MCP server and resource routes.

### 1. `GET /api/mcp` — List MCP servers

- Operation ID：`v2.mcp.list`
- 说明：Retrieve configured MCP servers and their connection status.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<Mcp.Server> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/mcp' \
  --header 'Accept: application/json'
```

### 2. `PUT /api/mcp/{server}` — Add MCP server

- Operation ID：`v2.mcp.add`
- 说明：Add an MCP server at runtime or replace an existing one, connecting it immediately.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `server` | 是 | string | `{{server}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `config` | 是 | Mcp.LocalConfig \| Mcp.RemoteConfig |

最小请求体示例：

```json
{
  "config": {
    "type": "local",
    "command": [
      "pwd"
    ]
  }
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request PUT \
  --url '{{baseUrl}}/api/mcp/{{server}}' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "config": {
      "type": "local",
      "command": [
        "pwd"
      ]
    }
  }'
```

### 3. `DELETE /api/mcp/{server}` — Remove MCP server

- Operation ID：`v2.mcp.remove`
- 说明：Stop an MCP server and remove it from the runtime set until restart.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `server` | 是 | string | `{{server}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | McpServerNotFoundError | `application/json` | McpServerNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request DELETE \
  --url '{{baseUrl}}/api/mcp/{{server}}' \
  --header 'Accept: application/json'
```

### 4. `POST /api/mcp/{server}/connect` — Connect MCP server

- Operation ID：`v2.mcp.connect`
- 说明：Connect an MCP server at runtime, overriding a disabled configuration until restart.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `server` | 是 | string | `{{server}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | McpServerNotFoundError | `application/json` | McpServerNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/mcp/{{server}}/connect' \
  --header 'Accept: application/json'
```

### 5. `POST /api/mcp/{server}/disconnect` — Disconnect MCP server

- Operation ID：`v2.mcp.disconnect`
- 说明：Disconnect an MCP server at runtime, removing its tools until reconnected.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `server` | 是 | string | `{{server}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | McpServerNotFoundError | `application/json` | McpServerNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/mcp/{{server}}/disconnect' \
  --header 'Accept: application/json'
```

### 6. `GET /api/mcp/resource` — List MCP resources

- Operation ID：`v2.mcp.resource.catalog`
- 说明：Retrieve resources and resource templates from connected MCP servers.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: Mcp.ResourceCatalog } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/mcp/resource' \
  --header 'Accept: application/json'
```

<a id="credential"></a>
## 凭证（`credential`）

opencode 凭证相关接口。

### 1. `PATCH /api/credential/{credentialID}` — Update credential

- Operation ID：`v2.credential.update`
- 说明：Update a stored credential label.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `credentialID` | 是 | string | `{{credentialID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `label` | 是 | string |

最小请求体示例：

```json
{
  "label": "example"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request PATCH \
  --url '{{baseUrl}}/api/credential/{{credentialID}}' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "label": "example"
  }'
```

### 2. `DELETE /api/credential/{credentialID}` — Remove credential

- Operation ID：`v2.credential.remove`
- 说明：Remove a stored integration credential.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `credentialID` | 是 | string | `{{credentialID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request DELETE \
  --url '{{baseUrl}}/api/credential/{{credentialID}}' \
  --header 'Accept: application/json'
```

<a id="project"></a>
## 项目（`project`）

Project routes.

### 1. `GET /api/project` — List projects

- Operation ID：`v2.project.list`
- 说明：List known projects.

参数：

无。

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | array<Project> |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/project' \
  --header 'Accept: application/json'
```

### 2. `GET /api/project/current` — Get current project

- Operation ID：`v2.project.current`
- 说明：Resolve the project for the requested location.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Project.Current | `application/json` | Project.Current |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/project/current' \
  --header 'Accept: application/json'
```

<a id="form"></a>
## 交互表单（`form`）

Session form routes.

### 1. `GET /api/form/request` — List pending form requests

- Operation ID：`v2.form.request.list`
- 说明：Retrieve pending forms for a location.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<Form.Info> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/form/request' \
  --header 'Accept: application/json'
```

### 2. `GET /api/session/{sessionID}/form` — List session forms

- Operation ID：`v2.session.form.list`
- 说明：Retrieve pending forms for a session.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: array<Form.Info> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/session/{{sessionID}}/form' \
  --header 'Accept: application/json'
```

### 3. `POST /api/session/{sessionID}/form` — Create session form

- Operation ID：`v2.session.form.create`
- 说明：Create a form for a session.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `id` | 否 | string \| null |
| `title` | 是 | string |
| `metadata` | 否 | Form.Metadata |
| `fields` | 是 | Form.Fields |

最小请求体示例：

```json
{
  "title": "Example session",
  "fields": [
    {
      "key": "{{key}}",
      "type": "string"
    }
  ]
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: Form.Info } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError1 \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |
| 409 | ConflictError | `application/json` | ConflictError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/form' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "title": "Example session",
    "fields": [
      {
        "key": "{{key}}",
        "type": "string"
      }
    ]
  }'
```

### 4. `GET /api/session/{sessionID}/form/{formID}` — Get session form

- Operation ID：`v2.session.form.get`
- 说明：Retrieve a form for a session.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |
| path | `formID` | 是 | string | `{{formID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: Form.Info } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError \| FormNotFoundError | `application/json` | FormNotFoundError \| SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/session/{{sessionID}}/form/{{formID}}' \
  --header 'Accept: application/json'
```

### 5. `GET /api/session/{sessionID}/form/{formID}/state` — Get form state

- Operation ID：`v2.session.form.state`
- 说明：Retrieve the current state for a form.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |
| path | `formID` | 是 | string | `{{formID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: Form.State } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError \| FormNotFoundError | `application/json` | FormNotFoundError \| SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/session/{{sessionID}}/form/{{formID}}/state' \
  --header 'Accept: application/json'
```

### 6. `POST /api/session/{sessionID}/form/{formID}/reply` — Reply to form

- Operation ID：`v2.session.form.reply`
- 说明：Submit an answer to a pending form.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |
| path | `formID` | 是 | string | `{{formID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `answer` | 是 | Form.Answer |

最小请求体示例：

```json
{
  "answer": {}
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | FormInvalidAnswerError \| InvalidRequestError | `application/json` | FormInvalidAnswerError \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError \| FormNotFoundError | `application/json` | FormNotFoundError \| SessionNotFoundError \| SessionNotFoundError |
| 409 | FormAlreadySettledError | `application/json` | FormAlreadySettledError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/form/{{formID}}/reply' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "answer": {}
  }'
```

### 7. `POST /api/session/{sessionID}/form/{formID}/cancel` — Cancel form

- Operation ID：`v2.session.form.cancel`
- 说明：Cancel a pending form.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |
| path | `formID` | 是 | string | `{{formID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError \| FormNotFoundError | `application/json` | FormNotFoundError \| SessionNotFoundError \| SessionNotFoundError |
| 409 | FormAlreadySettledError | `application/json` | FormAlreadySettledError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/form/{{formID}}/cancel' \
  --header 'Accept: application/json'
```

<a id="permission"></a>
## 权限请求（`permission`）

Experimental permission routes.

### 1. `GET /api/permission/request` — List pending permission requests

- Operation ID：`v2.permission.request.list`
- 说明：Retrieve pending permission requests for a location.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<Permission.Request> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/permission/request' \
  --header 'Accept: application/json'
```

### 2. `GET /api/permission/saved` — List saved permissions

- Operation ID：`v2.permission.saved.list`
- 说明：Retrieve saved permissions, optionally filtered by project.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `projectID` | 否 | string \| null | `{{projectID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: array<PermissionSaved.Info> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/permission/saved' \
  --header 'Accept: application/json'
```

### 3. `DELETE /api/permission/saved/{id}` — Remove saved permission

- Operation ID：`v2.permission.saved.remove`
- 说明：Remove a saved permission by ID.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `id` | 是 | string | `{{id}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request DELETE \
  --url '{{baseUrl}}/api/permission/saved/{{id}}' \
  --header 'Accept: application/json'
```

### 4. `POST /api/session/{sessionID}/permission` — Create permission request

- Operation ID：`v2.session.permission.create`
- 说明：Evaluate and, when approval is required, create a permission request for a session.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `id` | 否 | string \| null |
| `action` | 是 | string |
| `resources` | 是 | array<string> |
| `save` | 否 | array<string> |
| `metadata` | 否 | object |
| `source` | 否 | Permission.Source |
| `agent` | 否 | string \| null |

最小请求体示例：

```json
{
  "action": "example",
  "resources": [
    "example"
  ]
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: { id: string, effect: Permission.Effect } } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/permission' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "action": "example",
    "resources": [
      "example"
    ]
  }'
```

### 5. `GET /api/session/{sessionID}/permission` — List session permission requests

- Operation ID：`v2.session.permission.list`
- 说明：Retrieve pending permission requests owned by a session.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: array<Permission.Request> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError | `application/json` | SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/session/{{sessionID}}/permission' \
  --header 'Accept: application/json'
```

### 6. `GET /api/session/{sessionID}/permission/{requestID}` — Get permission request

- Operation ID：`v2.session.permission.get`
- 说明：Retrieve a pending permission request owned by a session.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |
| path | `requestID` | 是 | string | `{{requestID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { data: Permission.Request } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError \| PermissionNotFoundError | `application/json` | PermissionNotFoundError \| SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/session/{{sessionID}}/permission/{{requestID}}' \
  --header 'Accept: application/json'
```

### 7. `POST /api/session/{sessionID}/permission/{requestID}/reply` — Reply to pending permission request

- Operation ID：`v2.session.permission.reply`
- 说明：Respond to a pending permission request owned by a session.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `sessionID` | 是 | string | `{{sessionID}}` |
| path | `requestID` | 是 | string | `{{requestID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `reply` | 是 | Permission.Reply |
| `message` | 否 | string \| null |

最小请求体示例：

```json
{
  "reply": "once"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | SessionNotFoundError \| PermissionNotFoundError | `application/json` | PermissionNotFoundError \| SessionNotFoundError \| SessionNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/session/{{sessionID}}/permission/{{requestID}}/reply' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "reply": "once"
  }'
```

<a id="filesystem"></a>
## 文件系统（`filesystem`）

Experimental location-scoped filesystem routes.

### 1. `GET /api/fs/read/*` — Read file

- Operation ID：`v2.fs.read`
- 说明：Serve one file relative to the requested location.
> 二进制响应：`application/octet-stream`。

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/octet-stream` | string (binary) |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/fs/read/{{filePath}}' \
  --header 'Accept: application/json'
```

### 2. `GET /api/fs/list` — List directory

- Operation ID：`v2.fs.list`
- 说明：List direct children of one directory relative to the requested location.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |
| query | `path` | 否 | string \| null | `{{directory}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<FileSystem.Entry> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/fs/list' \
  --header 'Accept: application/json'
```

### 3. `GET /api/fs/find` — Find files

- Operation ID：`v2.fs.find`
- 说明：Find recursively ranked filesystem entries relative to the requested location.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |
| query | `query` | 是 | string | `Hello from Postman` |
| query | `type` | 否 | file \| directory | `file` |
| query | `limit` | 否 | string \| null | `example` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<FileSystem.Entry> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/fs/find?query=Hello from Postman' \
  --header 'Accept: application/json'
```

<a id="command"></a>
## 命令目录（`command`）

Experimental command routes.

### 1. `GET /api/command` — List commands

- Operation ID：`v2.command.list`
- 说明：Retrieve currently registered commands.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<Command.Info> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/command' \
  --header 'Accept: application/json'
```

<a id="skill"></a>
## 技能目录（`skill`）

Experimental skill routes.

### 1. `GET /api/skill` — List skills

- Operation ID：`v2.skill.list`
- 说明：Retrieve currently registered skills.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<Skill.Info> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/skill' \
  --header 'Accept: application/json'
```

<a id="event"></a>
## 事件流（`event`）

Experimental event stream routes.

### 1. `GET /api/event` — Subscribe to events

- Operation ID：`v2.event.subscribe`
- 说明：Subscribe to native event payloads for the server. Volatile by contract: a slow consumer overflows and fails the stream, and events during disconnection are missed.
> 流式响应：`text/event-stream`，连接会保持打开。

参数：

无。

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `text/event-stream` | { id: string \| null, event: string, data: V2EventJsonString } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/event' \
  --header 'Accept: text/event-stream'
```

<a id="pty"></a>
## PTY 终端（`pty`）

Experimental location-scoped PTY routes.

### 1. `GET /api/pty` — List PTY sessions

- Operation ID：`v2.pty.list`
- 说明：List PTY sessions for a location, including exited sessions retained until removal.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<Pty> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/pty' \
  --header 'Accept: application/json'
```

### 2. `POST /api/pty` — Create PTY session

- Operation ID：`v2.pty.create`
- 说明：Create a pseudo-terminal session for a location.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `command` | 否 | string |
| `args` | 否 | array<string> |
| `cwd` | 否 | string |
| `title` | 否 | string |
| `env` | 否 | object |

最小请求体示例：

```json
{}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: Pty } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/pty' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

### 3. `GET /api/pty/{ptyID}` — Get PTY session

- Operation ID：`v2.pty.get`
- 说明：Get one PTY session, including its exit code once exited.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `ptyID` | 是 | string | `{{ptyID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: Pty } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | PtyNotFoundError | `application/json` | PtyNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/pty/{{ptyID}}' \
  --header 'Accept: application/json'
```

### 4. `PUT /api/pty/{ptyID}` — Update PTY session

- Operation ID：`v2.pty.update`
- 说明：Update the title or viewport size of one PTY session.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `ptyID` | 是 | string | `{{ptyID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `title` | 否 | string |
| `size` | 否 | { rows: integer, cols: integer } |

最小请求体示例：

```json
{}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: Pty } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | PtyNotFoundError | `application/json` | PtyNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request PUT \
  --url '{{baseUrl}}/api/pty/{{ptyID}}' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

### 5. `DELETE /api/pty/{ptyID}` — Remove PTY session

- Operation ID：`v2.pty.remove`
- 说明：Terminate and remove one PTY session.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `ptyID` | 是 | string | `{{ptyID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | PtyNotFoundError | `application/json` | PtyNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request DELETE \
  --url '{{baseUrl}}/api/pty/{{ptyID}}' \
  --header 'Accept: application/json'
```

### 6. `POST /api/pty/{ptyID}/connect-token` — Create PTY WebSocket token

- Operation ID：`v2.pty.connect.token`
- 说明：Create a short-lived single-use ticket for opening a PTY WebSocket connection.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `ptyID` | 是 | string | `{{ptyID}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: PtyTicket.ConnectToken } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 403 | ForbiddenError | `application/json` | ForbiddenError |
| 404 | PtyNotFoundError | `application/json` | PtyNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/pty/{{ptyID}}/connect-token' \
  --header 'Accept: application/json'
```

### 7. `GET /api/pty/{ptyID}/connect` — Connect to PTY session

- Operation ID：`v2.pty.connect`
- 说明：Establish a WebSocket connection streaming PTY output and accepting terminal input.
> 特殊协议：这是 WebSocket 接口。在 Postman 中新建 WebSocket Request，并使用下方 URL；先调用 connect-token 获取 `ticket`。

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `ptyID` | 是 | string | `{{ptyID}}` |
| query | `location[directory]` | 否 | string | `{{directory}}` |
| query | `location[workspace]` | 否 | string | `example` |
| query | `cursor` | 否 | string | `example` |
| query | `ticket` | 否 | string | `example` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | boolean |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 403 | ForbiddenError | `application/json` | ForbiddenError |
| 404 | PtyNotFoundError | `application/json` | PtyNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
WebSocket URL: {{baseUrl}}/api/pty/{{ptyID}}/connect
```

<a id="shell"></a>
## Shell 命令（`shell`）

Experimental location-scoped shell command routes.

### 1. `GET /api/shell` — List running shell commands

- Operation ID：`v2.shell.list`
- 说明：List currently running shell commands for a location. Exited commands are not included.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<Shell.Info1> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/shell' \
  --header 'Accept: application/json'
```

### 2. `POST /api/shell` — Run shell command

- Operation ID：`v2.shell.create`
- 说明：Spawn one non-interactive shell command for a location. Combined stdout/stderr is captured to a file pageable via output.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `command` | 是 | string |
| `cwd` | 否 | string |
| `timeout` | 是 | integer |
| `metadata` | 否 | object |

最小请求体示例：

```json
{
  "command": "pwd",
  "timeout": 1
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: Shell.Info1 } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/shell' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "command": "pwd",
    "timeout": 1
  }'
```

### 3. `GET /api/shell/{id}` — Get shell command

- Operation ID：`v2.shell.get`
- 说明：Get one shell command, including its status and exit code once exited.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `id` | 是 | string | `{{id}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: Shell.Info1 } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | ShellNotFoundError | `application/json` | ShellNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/shell/{{id}}' \
  --header 'Accept: application/json'
```

### 4. `DELETE /api/shell/{id}` — Remove shell command

- Operation ID：`v2.shell.remove`
- 说明：Terminate and remove one shell command and its retained output.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `id` | 是 | string | `{{id}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | ShellNotFoundError | `application/json` | ShellNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request DELETE \
  --url '{{baseUrl}}/api/shell/{{id}}' \
  --header 'Accept: application/json'
```

### 5. `PATCH /api/shell/{id}/timeout` — Update shell timeout

- Operation ID：`v2.shell.timeout`
- 说明：Replace a running shell command's timeout from now, or clear it with zero.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `id` | 是 | string | `{{id}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `timeout` | 是 | integer |

最小请求体示例：

```json
{
  "timeout": 1
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: Shell.Info1 } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | ShellNotFoundError | `application/json` | ShellNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request PATCH \
  --url '{{baseUrl}}/api/shell/{{id}}/timeout' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "timeout": 1
  }'
```

### 6. `GET /api/shell/{id}/output` — Read shell output

- Operation ID：`v2.shell.output`
- 说明：Page through captured combined output by absolute byte cursor.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `id` | 是 | string | `{{id}}` |
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |
| query | `cursor` | 否 | string | `example` |
| query | `limit` | 否 | string | `example` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: { output: string, cursor: integer, size: integer, truncated: boolean } } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 404 | ShellNotFoundError | `application/json` | ShellNotFoundError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/shell/{{id}}/output' \
  --header 'Accept: application/json'
```

<a id="reference"></a>
## 项目引用（`reference`）

Location-scoped project references.

### 1. `GET /api/reference` — List references

- Operation ID：`v2.reference.list`
- 说明：List references available in the requested location.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<Reference.Info> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/reference' \
  --header 'Accept: application/json'
```

<a id="worktree"></a>
## Git Worktree（`worktree`）

Project worktree management routes.

### 1. `GET /api/experimental/project/{projectID}/worktree` — List worktrees

- Operation ID：`v2.worktree.list`
- 说明：List known local worktrees for a project.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `projectID` | 是 | string | `{{projectID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Worktree.List | `application/json` | Worktree.List |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/experimental/project/{{projectID}}/worktree' \
  --header 'Accept: application/json'
```

### 2. `POST /api/experimental/project/{projectID}/worktree` — Create worktree

- Operation ID：`v2.worktree.create`
- 说明：Create a worktree for a project.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `projectID` | 是 | string | `{{projectID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `strategy` | 是 | string |
| `from` | 否 | string |
| `directory` | 是 | string |
| `name` | 否 | string |

最小请求体示例：

```json
{
  "strategy": "example",
  "directory": "{{directory}}"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Worktree.Info | `application/json` | Worktree.Info |
| 400 | WorktreeError \| InvalidRequestError | `application/json` | WorktreeError \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/experimental/project/{{projectID}}/worktree' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "strategy": "example",
    "directory": "{{directory}}"
  }'
```

### 3. `DELETE /api/experimental/project/{projectID}/worktree` — Remove worktree

- Operation ID：`v2.worktree.remove`
- 说明：Remove a managed worktree from a project.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `projectID` | 是 | string | `{{projectID}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `directory` | 是 | string |
| `force` | 是 | boolean |

最小请求体示例：

```json
{
  "directory": "{{directory}}",
  "force": false
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | WorktreeError \| InvalidRequestError | `application/json` | WorktreeError \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request DELETE \
  --url '{{baseUrl}}/api/experimental/project/{{projectID}}/worktree' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "directory": "{{directory}}",
    "force": false
  }'
```

### 4. `POST /api/experimental/project/{projectID}/worktree/refresh` — Refresh worktrees

- Operation ID：`v2.worktree.refresh`
- 说明：Reconcile stored worktrees with the project repositories.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| path | `projectID` | 是 | string | `{{projectID}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | WorktreeError \| InvalidRequestError | `application/json` | WorktreeError \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/experimental/project/{{projectID}}/worktree/refresh' \
  --header 'Accept: application/json'
```

<a id="vcs"></a>
## 版本控制（`vcs`）

Location-scoped version control routes.

### 1. `GET /api/vcs` — VCS info

- Operation ID：`v2.vcs.get`
- 说明：Get current and default branch information for the requested location.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: Vcs.Info } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/vcs' \
  --header 'Accept: application/json'
```

### 2. `GET /api/vcs/status` — VCS status

- Operation ID：`v2.vcs.status`
- 说明：List uncommitted working-copy changes relative to the requested location.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<Vcs.FileStatus> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/vcs/status' \
  --header 'Accept: application/json'
```

### 3. `GET /api/vcs/diff` — VCS diff

- Operation ID：`v2.vcs.diff`
- 说明：Diff the working copy against HEAD (mode git) or the default-branch merge base (mode branch) for the requested location.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |
| query | `mode` | 是 | Vcs.Mode | `working` |
| query | `context` | 否 | string \| null | `Hello from Postman` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<FileDiff.Info> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/vcs/diff?mode=working' \
  --header 'Accept: application/json'
```

<a id="debug"></a>
## 调试（`debug`）

opencode 调试相关接口。

### 1. `GET /api/debug/location` — List loaded locations

- Operation ID：`v2.debug.location.list`
- 说明：List locations currently loaded by the server.

参数：

无。

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | array<Location.Ref> |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/debug/location' \
  --header 'Accept: application/json'
```

### 2. `DELETE /api/debug/location` — Evict a loaded location

- Operation ID：`v2.debug.location.evict`
- 说明：Dispose the requested location's cached services so its next use boots them fresh.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 204 | <No Content> | - | - |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request DELETE \
  --url '{{baseUrl}}/api/debug/location' \
  --header 'Accept: application/json'
```

<a id="migration"></a>
## 迁移（`migration`）

opencode 迁移相关接口。

### 1. `GET /api/experimental/migration/v1` — Get V1 migration status

- Operation ID：`v2.experimental.migration.v1.status`
- 说明：Return the progress of the V1 to V2 session history migration.

参数：

无。

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { status: required \| completed } \| { status: running, progress: { label: string, numerator: integer \| null, denominator: integer \| null } } \| { status: error, error: string } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/experimental/migration/v1' \
  --header 'Accept: application/json'
```

<a id="websearch"></a>
## 网络搜索（`websearch`）

Location-scoped web search routes.

### 1. `GET /api/websearch/provider` — List web search providers

- Operation ID：`v2.websearch.providers`
- 说明：Return the registered web search providers.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: array<WebSearch.Provider> } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 503 | ServiceUnavailableError | `application/json` | ServiceUnavailableError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/websearch/provider' \
  --header 'Accept: application/json'
```

### 2. `POST /api/websearch` — Search the web

- Operation ID：`v2.websearch.query`
- 说明：Run one web search through the selected provider. Specify a provider to override the configured default.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

请求体字段（`application/json`，request body 必填）：

| 字段 | 必填 | 类型 |
|---|---:|---|
| `query` | 是 | string |
| `providerID` | 否 | string |

最小请求体示例：

```json
{
  "query": "Hello from Postman"
}
```

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | { location: Location.Info, data: WebSearch.Response } |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError1 \| InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |
| 503 | ServiceUnavailableError | `application/json` | ServiceUnavailableError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request POST \
  --url '{{baseUrl}}/api/websearch' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "query": "Hello from Postman"
  }'
```

<a id="config"></a>
## 配置（`config`）

Location-scoped configuration routes.

### 1. `GET /api/config` — Get configuration

- Operation ID：`v2.config.get`
- 说明：Return configuration documents and discovery sources for the requested location, from lowest to highest priority.

参数：

| 位置 | 名称 | 必填 | 类型 | 示例/变量 |
|---|---|---:|---|---|
| query | `location[directory]` | 否 | string \| null | `{{directory}}` |
| query | `location[workspace]` | 否 | string \| null | `{{workspace}}` |

响应：

| 状态码 | 说明 | Content-Type | Schema |
|---:|---|---|---|
| 200 | Success | `application/json` | array<Config.Entry> |
| 400 | InvalidRequestError | `application/json` | InvalidRequestError |
| 401 | UnauthorizedError | `application/json` | UnauthorizedError |

Postman 可导入请求（Raw text 导入）：

```bash
curl --request GET \
  --url '{{baseUrl}}/api/config' \
  --header 'Accept: application/json'
```

