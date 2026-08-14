#!/usr/bin/env bun

import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Effect } from "effect"
import { HttpServer } from "effect/unstable/http"
import { start } from "./process"

const password = process.env.OPENCODE_SERVER_PASSWORD
if (!password) throw new Error("OPENCODE_SERVER_PASSWORD is required")

const value = process.env.OPENCODE_SERVER_PORT
const port = value === undefined ? undefined : Number(value)
if (port !== undefined && (!Number.isInteger(port) || port < 0 || port > 65_535)) {
  throw new Error("OPENCODE_SERVER_PORT must be an integer between 0 and 65535")
}

NodeRuntime.runMain(
  Effect.scoped(
    Effect.gen(function* () {
      const server = yield* start<never, never>({
        app: {
          name: "server",
          version: process.env.OPENCODE_SERVER_VERSION ?? "dev",
          channel: process.env.OPENCODE_SERVER_CHANNEL ?? "local",
        },
        hostname: process.env.OPENCODE_SERVER_HOSTNAME ?? "127.0.0.1",
        port,
        password,
        database: { path: process.env.OPENCODE_DB ?? "opencode-server.db" },
        models: { fetch: process.env.OPENCODE_DISABLE_MODELS_FETCH !== "1" },
        config: { directory: process.env.OPENCODE_CONFIG_DIR },
        fs: {
          filewatcher: process.env.OPENCODE_DISABLE_FILEWATCHER !== "1",
          fff: process.env.OPENCODE_DISABLE_FFF !== "1",
        },
      })
      console.log(`OPENCODE_SERVER_LISTENING ${JSON.stringify({ url: HttpServer.formatAddress(server.address) })}`)
      yield* server.shutdown
    }),
  ).pipe(Effect.provide(NodeServices.layer)),
)
