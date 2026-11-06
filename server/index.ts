import { createServer } from "node:http"
import { readFile, mkdir, writeFile, rename } from "node:fs/promises"
import { resolve, extname, sep } from "node:path"
import { networkInterfaces } from "node:os"
import { handleApi } from "./api.ts"
import type { Repository, Room } from "./engine.ts"
const state = new Map<string, { room: Room; version: number }>()
const root = resolve(import.meta.dirname, "../apps/web/dist")
const stateDir = resolve(import.meta.dirname, "../.runtime")
await mkdir(stateDir, { recursive: true })
try {
  const saved = JSON.parse(await readFile(resolve(stateDir, "rooms.json"), "utf8"))
  for (const [key, value] of saved)
    if (Date.now() - value.room.updatedAt < 21600000) state.set(key, value)
} catch {}
let saving = Promise.resolve()
function persist() {
  const body = JSON.stringify([...state])
  saving = saving
    .then(async () => {
      const temporary = resolve(stateDir, "rooms.tmp")
      await writeFile(temporary, body, { mode: 0o600 })
      await rename(temporary, resolve(stateDir, "rooms.json"))
    })
    .catch(console.error)
}
const repository: Repository = {
  async create(room) {
    if (state.has(room.code)) return false
    state.set(room.code, { room: structuredClone(room), version: 0 })
    persist()
    return true
  },
  async get(code) {
    return structuredClone(state.get(code) ?? null)
  },
  async update(room, version) {
    if (state.get(room.code)?.version !== version) return false
    state.set(room.code, { room: structuredClone(room), version: version + 1 })
    persist()
    return true
  },
}
const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".json": "application/json",
}
const port = Number(process.env.PORT ?? 5197)
createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`)
    if (url.pathname.startsWith("/api/")) {
      let body = ""
      for await (const chunk of req) {
        body += chunk
        if (body.length > 4096) {
          res.writeHead(413).end()
          return
        }
      }
      const response = await handleApi(
        new Request(url, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          ...(req.method !== "GET" && req.method !== "HEAD" ? { body } : {}),
        }),
        repository,
      )
      res.writeHead(response.status, Object.fromEntries(response.headers))
      res.end(await response.text())
      return
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405).end()
      return
    }
    let path = resolve(root, "." + decodeURIComponent(url.pathname))
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403).end()
      return
    }
    const relative = path.slice(root.length + 1)
    if (
      relative.startsWith("server" + sep) ||
      relative.split(sep).some((part) => part.startsWith("."))
    ) {
      res.writeHead(403).end()
      return
    }
    if (!extname(path)) path = resolve(root, "index.html")
    const bytes = await readFile(path)
    res.writeHead(200, {
      "content-type": mime[extname(path)] ?? "application/octet-stream",
      "x-content-type-options": "nosniff",
      "cache-control": path.includes("/assets/") ? "public, max-age=3600" : "no-cache",
    })
    res.end(req.method === "HEAD" ? undefined : bytes)
  } catch {
    res.writeHead(404).end("Introuvable")
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`G4EVER · http://localhost:${port}`)
  for (const list of Object.values(networkInterfaces()))
    for (const address of list ?? [])
      if (address.family === "IPv4" && !address.internal)
        console.log(`Réseau : http://${address.address}:${port}`)
})
