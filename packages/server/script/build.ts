#!/usr/bin/env bun

import { randomUUID } from "node:crypto"
import { chmod, copyFile, mkdir, mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const dir = path.resolve(import.meta.dirname, "..")
const outdir = path.join(dir, "dist")
const output = path.join(outdir, "bin", process.platform === "win32" ? "opencode-server.exe" : "opencode-server")
const target =
  process.platform === "darwin" && process.arch === "arm64"
    ? "bun-darwin-arm64"
    : process.platform === "darwin" && process.arch === "x64"
      ? "bun-darwin-x64"
      : process.platform === "linux" && process.arch === "arm64"
        ? "bun-linux-arm64"
        : process.platform === "linux" && process.arch === "x64"
          ? "bun-linux-x64"
          : process.platform === "win32" && process.arch === "arm64"
            ? "bun-windows-arm64"
            : process.platform === "win32" && process.arch === "x64"
              ? "bun-windows-x64"
              : undefined
if (!target) throw new Error(`Unsupported server build target: ${process.platform}-${process.arch}`)

process.chdir(dir)
await rm(outdir, { recursive: true, force: true })
await mkdir(path.dirname(output), { recursive: true })

const parcelWatcherPackage = `@parcel/watcher-${process.platform}-${process.arch}${process.platform === "linux" ? "-glibc" : ""}`
const result = await Bun.build({
  entrypoints: ["./src/main.ts"],
  tsconfig: "./tsconfig.json",
  plugins: [
    {
      name: "parcel-watcher-binding",
      setup(build) {
        build.onLoad({ filter: /filesystem\/watcher-binding\.ts$/ }, () => ({
          contents: `export default () => require(${JSON.stringify(parcelWatcherPackage)})`,
          loader: "js",
        }))
      },
    },
  ],
  external: ["node-gyp"],
  format: "esm",
  minify: true,
  sourcemap: "inline",
  compile: {
    autoloadBunfig: false,
    autoloadDotenv: false,
    autoloadTsconfig: true,
    autoloadPackageJson: true,
    target,
    outfile: output,
    execArgv: ["--use-system-ca", "--"],
  },
  define: {
    OPENCODE_LIBC: process.platform === "linux" ? '"glibc"' : "undefined",
    FFF_LIBC: process.platform === "linux" ? '"gnu"' : "undefined",
  },
})

if (!result.success) throw new AggregateError(result.logs, "Failed to build Server")

const root = await mkdtemp(path.join(os.tmpdir(), "opencode-server-smoke-"))
const executable = path.join(root, path.basename(output))
await copyFile(output, executable)
if (process.platform !== "win32") await chmod(executable, 0o755)
const password = randomUUID()
const processHandle = Bun.spawn([executable], {
  cwd: root,
  env: {
    ...process.env,
    OPENCODE_SERVER_PASSWORD: password,
    OPENCODE_SERVER_PORT: "0",
    OPENCODE_DB: path.join(root, "smoke.db"),
    OPENCODE_CONFIG_DIR: path.join(root, "config"),
    OPENCODE_DISABLE_MODELS_FETCH: "1",
    OPENCODE_DISABLE_FILEWATCHER: "1",
    OPENCODE_DISABLE_FFF: "1",
  },
  stdout: "pipe",
  stderr: "inherit",
})

try {
  const line = await readListeningLine(processHandle.stdout)
  const info: unknown = JSON.parse(line.slice("OPENCODE_SERVER_LISTENING ".length))
  if (typeof info !== "object" || info === null || !("url" in info) || typeof info.url !== "string") {
    throw new Error(`Server did not report a URL: ${line}`)
  }
  const response = await fetch(`${info.url}/api/health`, {
    headers: { authorization: `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}` },
  })
  const body: unknown = await response.json()
  if (
    !response.ok ||
    typeof body !== "object" ||
    body === null ||
    !("healthy" in body) ||
    body.healthy !== true ||
    !("version" in body) ||
    body.version !== "dev"
  ) {
    throw new Error(`Server health check failed (${response.status}): ${JSON.stringify(body)}`)
  }
  console.log(`verified ${output} via ${info.url}/api/health`)
} finally {
  processHandle.kill()
  await processHandle.exited
  await rm(root, { recursive: true, force: true })
}

async function readListeningLine(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  const timeout = setTimeout(() => processHandle.kill(), 30_000)
  let content = ""
  try {
    while (true) {
      const result = await reader.read()
      if (result.done) throw new Error(`Server exited before reporting its URL: ${content}`)
      content += decoder.decode(result.value, { stream: true })
      const lines = content.split("\n")
      const found = lines.find((line) => line.startsWith("OPENCODE_SERVER_LISTENING "))
      if (found) return found
      content = lines.at(-1) ?? ""
    }
  } finally {
    clearTimeout(timeout)
    reader.releaseLock()
  }
}
