import path from "path"
import { fileURLToPath } from "url"

type JsonSchema = {
  $ref?: string
  type?: string
  format?: string
  pattern?: string
  default?: unknown
  example?: unknown
  const?: unknown
  enum?: unknown[]
  anyOf?: JsonSchema[]
  oneOf?: JsonSchema[]
  allOf?: JsonSchema[]
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
  additionalProperties?: boolean | JsonSchema
}

type Parameter = {
  name: string
  in: "path" | "query" | "header" | "cookie"
  required?: boolean
  description?: string
  style?: string
  schema?: JsonSchema
}

type RequestParameter = {
  name: string
  in: Parameter["in"]
  required: boolean
  description?: string
  schema?: JsonSchema
  value: string
}

type Operation = {
  tags?: string[]
  operationId?: string
  summary?: string
  description?: string
  parameters?: Parameter[]
  requestBody?: {
    required?: boolean
    content?: Record<string, { schema?: JsonSchema }>
  }
  responses?: Record<string, { description?: string; content?: Record<string, { schema?: JsonSchema }> }>
  security?: unknown[]
  "x-websocket"?: boolean
}

type OpenApi = {
  info: { title: string; version: string; description?: string }
  tags?: { name: string; description?: string }[]
  paths: Record<string, Record<string, Operation | Parameter[]>>
  components?: { schemas?: Record<string, JsonSchema> }
}

const root = fileURLToPath(new URL("..", import.meta.url))
const document = (await Bun.file(path.join(root, "openapi.json")).json()) as OpenApi
const methods = ["get", "post", "put", "patch", "delete", "head", "options", "trace"]
const categoryNames: Record<string, string> = {
  health: "健康检查与服务控制",
  server: "服务信息",
  location: "工作位置",
  agent: "Agent",
  plugin: "插件",
  session: "会话、消息与上下文",
  model: "模型",
  generate: "一次性生成",
  provider: "模型供应商",
  integration: "外部集成与认证",
  mcp: "MCP 服务与资源",
  credential: "凭证",
  project: "项目",
  form: "交互表单",
  permission: "权限请求",
  filesystem: "文件系统",
  command: "命令目录",
  skill: "技能目录",
  event: "事件流",
  pty: "PTY 终端",
  shell: "Shell 命令",
  reference: "项目引用",
  worktree: "Git Worktree",
  vcs: "版本控制",
  debug: "调试",
  migration: "迁移",
  websearch: "网络搜索",
  config: "配置",
}
const variableExamples: Record<string, string> = {
  baseUrl: "http://127.0.0.1:4096",
  username: "opencode",
  password: "replace-with-service-password",
  directory: "/absolute/path/to/project",
  workspace: "",
  sessionID: "ses_example",
  messageID: "msg_example",
  inboxID: "inbox_example",
  agentID: "build",
  providerID: "anthropic",
  integrationID: "github",
  attemptID: "attempt_example",
  credentialID: "credential_example",
  projectID: "project_example",
  formID: "form_example",
  requestID: "permission_example",
  ptyID: "pty_example",
  id: "shell_example",
  server: "example-server",
  key: "custom/instructions",
  filePath: "README.md",
}

const operations = Object.entries(document.paths).flatMap(([route, item]) =>
  Object.entries(item)
    .filter(([method]) => methods.includes(method))
    .map(([method, operation]) => ({ route, method: method.toUpperCase(), operation: operation as Operation })),
)
const tags = document.tags?.map((tag) => tag.name) ?? []
const orderedTags = [...tags, ...operations.map((entry) => entry.operation.tags?.[0] ?? "untagged")].filter(
  (tag, index, all) => all.indexOf(tag) === index && operations.some((entry) => (entry.operation.tags?.[0] ?? "untagged") === tag),
)

function resolve(schema: JsonSchema | undefined, seen = new Set<string>()): JsonSchema | undefined {
  if (!schema?.$ref) return schema
  if (seen.has(schema.$ref)) return { type: "object" }
  const name = schema.$ref.split("/").at(-1)
  if (!name) return schema
  const target = document.components?.schemas?.[name]
  if (!target) return schema
  return resolve(target, new Set([...seen, schema.$ref]))
}

function stringExample(name: string, schema: JsonSchema) {
  if (schema.pattern?.startsWith("^ses")) return "{{sessionID}}"
  if (schema.pattern?.startsWith("^msg")) return "{{messageID}}"
  if (schema.pattern?.startsWith("^pty")) return "{{ptyID}}"
  if (name in variableExamples) return `{{${name}}}`
  if (/ids$/i.test(name)) return [`{{${name.replace(/s$/, "")}}}`]
  if (/id$/i.test(name)) return `{{${name}}}`
  if (/url|uri/i.test(name) || schema.format === "uri" || schema.format === "url") return "https://example.com"
  if (schema.format === "date-time") return "2026-01-01T00:00:00.000Z"
  if (schema.format === "date") return "2026-01-01"
  if (/path|directory/i.test(name)) return "{{directory}}"
  if (/name/i.test(name)) return "example"
  if (/title/i.test(name)) return "Example session"
  if (/text|content|prompt|query/i.test(name)) return "Hello from Postman"
  if (/command/i.test(name)) return "pwd"
  if (/model/i.test(name)) return "claude-sonnet-4-20250514"
  if (/provider/i.test(name)) return "anthropic"
  if (/agent/i.test(name)) return "build"
  if (schema.pattern?.startsWith("^")) return schema.pattern.slice(1).replace(/[^a-zA-Z0-9_-].*$/, "") + "example"
  return "example"
}

function example(schema: JsonSchema | undefined, name = "value", depth = 0): unknown {
  if (!schema || depth > 12) return {}
  if (schema.example !== undefined) return schema.example
  if (schema.default !== undefined) return schema.default
  if (schema.const !== undefined) return schema.const
  if (schema.enum?.length) return schema.enum[0]
  const resolved = resolve(schema)
  if (resolved !== schema) return example(resolved, name, depth + 1)
  const union = schema.anyOf ?? schema.oneOf
  if (union?.length) return example(union.find((item) => item.type !== "null") ?? union[0], name, depth + 1)
  if (schema.type === "array") return [example(schema.items, name.replace(/s$/, ""), depth + 1)]
  if (schema.type === "boolean") return false
  if (schema.type === "integer" || schema.type === "number") return 1
  if (schema.type === "null") return null
  if (schema.type === "string") return stringExample(name, schema)
  if (schema.allOf?.length) {
    const values = schema.allOf.map((item) => example(item, name, depth + 1))
    if (values.every((value) => typeof value === "object" && value !== null && !Array.isArray(value))) return Object.assign({}, ...values)
    return values[0]
  }
  const required = schema.required ?? []
  if (schema.type === "object" || schema.properties) {
    return Object.fromEntries(
      Object.entries(schema.properties ?? {})
        .filter(([key]) => required.includes(key))
        .map(([key, value]) => [key, example(value, key, depth + 1)]),
    )
  }
  return {}
}

function schemaLabel(schema: JsonSchema | undefined, depth = 0): string {
  if (!schema || depth > 4) return "unknown"
  if (schema.$ref) return schema.$ref.split("/").at(-1) ?? "unknown"
  if (schema.enum?.length) return schema.enum.map(String).join(" | ")
  const union = schema.anyOf ?? schema.oneOf
  if (union?.length) return union.map((item) => schemaLabel(item, depth + 1)).join(" | ")
  if (schema.type === "array") return `array<${schemaLabel(schema.items, depth + 1)}>`
  if (schema.type === "object" || schema.properties) {
    const properties = Object.entries(schema.properties ?? {})
    if (!properties.length) return "object"
    const fields = properties.slice(0, 5).map(([name, child]) => `${name}: ${schemaLabel(child, depth + 1)}`)
    return `{ ${fields.join(", ")}${properties.length > fields.length ? ", …" : ""} }`
  }
  return schema.format ? `${schema.type ?? "string"} (${schema.format})` : (schema.type ?? "unknown")
}

function markdownCell(value: string) {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ")
}

function parameterRows(parameters: Parameter[]): RequestParameter[] {
  return parameters.flatMap<RequestParameter>((parameter) => {
    const schema = resolve(parameter.schema)
    if (parameter.in === "query" && parameter.style === "deepObject" && schema) {
      const target = schema.anyOf?.find((item) => item.type !== "null") ?? schema
      const object = resolve(target)
      if (object?.properties) {
        return Object.entries(object.properties).map(([name, child]): RequestParameter => ({
          name: `${parameter.name}[${name}]`,
          in: parameter.in,
          required: parameter.required === true && object.required?.includes(name) === true,
          description: parameter.description,
          schema: child,
          value: `{{${name}}}`,
        }))
      }
    }
    return [{
      name: parameter.name,
      in: parameter.in,
      required: parameter.required === true,
      description: parameter.description,
      schema: parameter.schema,
      value: parameter.in === "path" ? `{{${parameter.name}}}` : String(example(parameter.schema, parameter.name)),
    }]
  })
}

function operationParameters(entry: (typeof operations)[number]) {
  const common = document.paths[entry.route].parameters
  return parameterRows([...(Array.isArray(common) ? common : []), ...(entry.operation.parameters ?? [])])
}

function requestContent(operation: Operation) {
  const content = operation.requestBody?.content ?? {}
  const mediaType = Object.keys(content)[0]
  if (!mediaType) return undefined
  return { mediaType, value: example(content[mediaType].schema, "body") }
}

function responseContentTypes(operation: Operation) {
  return Object.values(operation.responses ?? {}).flatMap((response) => Object.keys(response.content ?? {})).filter(
    (type, index, all) => all.indexOf(type) === index,
  )
}

function requestUrl(entry: (typeof operations)[number], includeOptional: boolean) {
  const route = entry.route.replaceAll(/{([^}]+)}/g, "{{$1}}").replace("*", "{{filePath}}")
  const query = operationParameters(entry)
    .filter((parameter) => parameter.in === "query" && (includeOptional || parameter.required))
    .map((parameter) => `${encodeURIComponent(parameter.name)}=${parameter.value}`)
  return `{{baseUrl}}${route}${query.length ? `?${query.join("&")}` : ""}`
}

function curl(entry: (typeof operations)[number]) {
  if (entry.operation["x-websocket"]) return `WebSocket URL: ${requestUrl(entry, false)}`
  const content = requestContent(entry.operation)
  const accept = responseContentTypes(entry.operation).includes("text/event-stream") ? "text/event-stream" : "application/json"
  const lines = [
    `curl --request ${entry.method} \\`,
    `  --url '${requestUrl(entry, false)}' \\`,
    `  --header 'Accept: ${accept}'${content ? " \\" : ""}`,
  ]
  if (content) {
    lines.push(`  --header 'Content-Type: ${content.mediaType}' \\`)
    lines.push(`  --data '${JSON.stringify(content.value, null, 2).replaceAll("\n", "\n  ")}'`)
  }
  return lines.join("\n")
}

function markdownOperation(entry: (typeof operations)[number], index: number) {
  const parameters = operationParameters(entry)
  const content = requestContent(entry.operation)
  const bodySchema = content ? resolve(entry.operation.requestBody?.content?.[content.mediaType].schema) : undefined
  const bodyProperties = Object.entries(bodySchema?.properties ?? {})
  const bodyRequired = bodySchema?.required ?? []
  const responseRows = Object.entries(entry.operation.responses ?? {}).flatMap(([status, response]) => {
    const media = Object.entries(response.content ?? {})
    if (!media.length) return [`| ${status} | ${markdownCell(response.description ?? "-")} | - | - |`]
    return media.map(([mediaType, value]) => `| ${status} | ${markdownCell(response.description ?? "-")} | \`${mediaType}\` | ${markdownCell(schemaLabel(value.schema))} |`)
  })
  const notes = [
    entry.operation["x-websocket"] ? "> 特殊协议：这是 WebSocket 接口。在 Postman 中新建 WebSocket Request，并使用下方 URL；先调用 connect-token 获取 `ticket`。" : "",
    responseContentTypes(entry.operation).includes("text/event-stream") ? "> 流式响应：`text/event-stream`，连接会保持打开。" : "",
    responseContentTypes(entry.operation).includes("application/octet-stream") ? "> 二进制响应：`application/octet-stream`。" : "",
  ].filter(Boolean)
  const parameterTable = parameters.length
    ? [
        "| 位置 | 名称 | 必填 | 类型 | 示例/变量 |",
        "|---|---|---:|---|---|",
        ...parameters.map((parameter) => `| ${parameter.in} | \`${parameter.name}\` | ${parameter.required ? "是" : "否"} | ${markdownCell(schemaLabel(parameter.schema))} | \`${parameter.value}\` |`),
      ].join("\n")
    : "无。"
  return [
    `### ${index}. \`${entry.method} ${entry.route}\` — ${entry.operation.summary ?? entry.operation.operationId ?? ""}`,
    "",
    `- Operation ID：\`${entry.operation.operationId ?? "-"}\``,
    ...(entry.operation.description ? [`- 说明：${entry.operation.description}`] : []),
    ...notes,
    "",
    "参数：",
    "",
    parameterTable,
    ...(content ? [
      "",
      `请求体字段（\`${content.mediaType}\`，request body ${entry.operation.requestBody?.required ? "必填" : "可选"}）：`,
      "",
      ...(bodyProperties.length ? [
        "| 字段 | 必填 | 类型 |",
        "|---|---:|---|",
        ...bodyProperties.map(([name, schema]) => `| \`${name}\` | ${bodyRequired.includes(name) ? "是" : "否"} | ${markdownCell(schemaLabel(schema))} |`),
      ] : ["Schema：`" + schemaLabel(bodySchema) + "`"]),
      "",
      "最小请求体示例：",
      "",
      "```json",
      JSON.stringify(content.value, null, 2),
      "```",
    ] : []),
    "",
    "响应：",
    "",
    "| 状态码 | 说明 | Content-Type | Schema |",
    "|---:|---|---|---|",
    ...(responseRows.length ? responseRows : ["| - | 未声明 | - | - |"]),
    "",
    "Postman 可导入请求（Raw text 导入）：",
    "",
    "```bash",
    curl(entry),
    "```",
  ].join("\n")
}

const overview = orderedTags.map((tag) => {
  const count = operations.filter((entry) => (entry.operation.tags?.[0] ?? "untagged") === tag).length
  return `| [${categoryNames[tag] ?? tag}](#${tag}) | \`${tag}\` | ${count} |`
})

const markdown = [
  "# opencode V2 HTTP API 分类手册与 Postman 调用示例",
  "",
  `> 数据源：\`packages/protocol/openapi.json\`（OpenAPI ${document.info.version}）。本文件由 \`bun run generate:reference\` 生成，请勿手工维护接口明细。`,
  "",
  "## 快速开始",
  "",
  "1. 在 Postman 中导入同目录的 `opencode-v2.postman_collection.json`。",
  "2. 设置环境变量 `baseUrl`；所有请求 URL 均采用 `{{baseUrl}}/api/...`，不写死 host 或端口。其余资源 ID 在调用创建类接口后更新。",
  "3. 所有 request 都不单独配置认证，统一继承 Collection 级 Authorization。当前示例 Collection 在父级配置 Basic Auth，用户名和密码分别读取 `{{username}}`、`{{password}}`。",
  "4. 每个接口下的 cURL 也可通过 Postman 的 Import → Raw text 直接导入。示例中的 `{{variable}}` 是 Postman 变量。",
  "",
  "## 通用约定",
  "",
  "- JSON 成功响应通常使用 `{ \"data\": ... }` 信封；以实际 response schema 为准。",
  "- `location` 使用 deep-object 查询参数，例如 `location[directory]=/repo` 和 `location[workspace]=...`。它们在 Collection 中默认禁用，启用后用于显式选择工作位置。",
  "- 可选查询参数在 Collection 中保留但默认禁用；需要时在 Params 页签勾选并填写。",
  "- `GET /api/event` 和实验性 session log 是 SSE；`GET /api/pty/{ptyID}/connect` 是 WebSocket；`GET /api/fs/read/*` 返回二进制文件。",
  "- 示例 ID 只是占位符。要成功调用依赖资源的接口，先执行对应 list/create API，并把真实 ID 写入 Collection Variables。",
  "",
  `共 **${operations.length}** 个 HTTP 操作、**${orderedTags.length}** 个分类。`,
  "",
  "## 分类总览",
  "",
  "| 分类 | OpenAPI tag | API 数量 |",
  "|---|---|---:|",
  ...overview,
  "",
  ...orderedTags.flatMap((tag) => {
    const entries = operations.filter((entry) => (entry.operation.tags?.[0] ?? "untagged") === tag)
    const description = document.tags?.find((item) => item.name === tag)?.description
    return [
      `<a id="${tag}"></a>`,
      `## ${categoryNames[tag] ?? tag}（\`${tag}\`）`,
      "",
      description ?? `opencode ${categoryNames[tag] ?? tag}相关接口。`,
      "",
      ...entries.flatMap((entry, index) => [markdownOperation(entry, index + 1), ""]),
    ]
  }),
].join("\n") + "\n"

function postmanRequest(entry: (typeof operations)[number]) {
  const parameters = operationParameters(entry)
  const content = requestContent(entry.operation)
  const raw = requestUrl(entry, false)
  const url = {
    raw,
    host: ["{{baseUrl}}"],
    path: entry.route.split("/").filter(Boolean).map((part) => part === "*" ? "{{filePath}}" : part.replaceAll(/{([^}]+)}/g, "{{$1}}")),
    query: parameters.filter((parameter) => parameter.in === "query").map((parameter) => ({
      key: parameter.name,
      value: parameter.value,
      disabled: !parameter.required,
      description: parameter.description,
    })),
  }
  const headers = [
    { key: "Accept", value: responseContentTypes(entry.operation).includes("text/event-stream") ? "text/event-stream" : "application/json" },
    ...(content ? [{ key: "Content-Type", value: content.mediaType }] : []),
  ]
  return {
    name: `${entry.method} ${entry.route} — ${entry.operation.summary ?? ""}`,
    request: {
      method: entry.method,
      header: headers,
      url,
      description: [
        `Operation ID: ${entry.operation.operationId ?? "-"}`,
        entry.operation.description,
        entry.operation["x-websocket"] ? "WebSocket endpoint: create a Postman WebSocket request with this URL." : undefined,
      ].filter(Boolean).join("\n\n"),
      ...(content ? { body: { mode: "raw", raw: JSON.stringify(content.value, null, 2), options: { raw: { language: "json" } } } } : {}),
    },
    response: [],
  }
}

const collectionItems = orderedTags.map((tag) => ({
  name: categoryNames[tag] ?? tag,
  description: document.tags?.find((item) => item.name === tag)?.description,
  item: operations.filter((entry) => (entry.operation.tags?.[0] ?? "untagged") === tag).map(postmanRequest),
}))
const referencedVariables = ["username", "password", ...[...JSON.stringify(collectionItems).matchAll(/\{\{([^}]+)}}/g)].map((match) => match[1])].filter(
  (key, index, all) => key !== "baseUrl" && all.indexOf(key) === index,
)

const collection = {
  info: {
    _postman_id: "f6fe21cc-2db5-4eb7-98cb-opencodev2api",
    name: "opencode V2 HTTP API",
    description: `Generated from packages/protocol/openapi.json. Contains ${operations.length} operations grouped by OpenAPI tag.`,
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: {
    type: "basic",
    basic: [
      { key: "username", value: "{{username}}", type: "string" },
      { key: "password", value: "{{password}}", type: "string" },
    ],
  },
  variable: referencedVariables.map((key) => ({ key, value: variableExamples[key] ?? "example", type: "string" })),
  item: collectionItems,
}

await Bun.write(path.join(root, "API_REFERENCE.md"), markdown)
await Bun.write(path.join(root, "opencode-v2.postman_collection.json"), JSON.stringify(collection, null, 2) + "\n")
