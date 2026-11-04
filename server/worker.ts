import { handleApi } from "./api"
import type { Repository, Room } from "./engine"
import assets from "g4:assets"
interface Statement {
  bind(...values: unknown[]): Statement
  first<T>(): Promise<T | null>
  run(): Promise<{ meta: { changes: number } }>
}
interface Database {
  prepare(sql: string): Statement
  withSession?(constraint: string): Database
}
interface Env {
  DB: Database
}
function repository(db: Database): Repository {
  return {
    async create(room) {
      await db
        .prepare("DELETE FROM race_rooms WHERE updated_at < ?")
        .bind(Date.now() - 21600000)
        .run()
      const count = await db
        .prepare("SELECT count(*) AS total FROM race_rooms")
        .first<{ total: number }>()
      if (count && count.total > 3000) throw new Error("Room capacity reached")
      const result = await db
        .prepare(
          "INSERT OR IGNORE INTO race_rooms (code,state,version,updated_at) VALUES (?,?,0,?)",
        )
        .bind(room.code, JSON.stringify(room), room.updatedAt)
        .run()
      return result.meta.changes === 1
    },
    async get(code) {
      const row = await db
        .prepare("SELECT state,version FROM race_rooms WHERE code = ?")
        .bind(code)
        .first<{ state: string; version: number }>()
      return row ? { room: JSON.parse(row.state) as Room, version: row.version } : null
    },
    async update(room, version) {
      const result = await db
        .prepare(
          "UPDATE race_rooms SET state = ?, version = version + 1, updated_at = ? WHERE code = ? AND version = ?",
        )
        .bind(JSON.stringify(room), room.updatedAt, room.code, version)
        .run()
      return result.meta.changes === 1
    },
  }
}
export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)
    if (url.pathname.startsWith("/api/"))
      return handleApi(request, repository(env.DB.withSession?.("first-primary") ?? env.DB))
    if (request.method !== "GET" && request.method !== "HEAD")
      return new Response("Method not allowed", { status: 405 })
    const key = decodeURIComponent(url.pathname)
    const asset =
      assets[key] ?? (!key.split("/").pop()?.includes(".") ? assets["/index.html"] : undefined)
    if (!asset) return new Response("Introuvable", { status: 404 })
    const binary = atob(asset.body)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    return new Response(request.method === "HEAD" ? null : bytes, {
      headers: {
        "content-type": asset.type,
        "cache-control": key.startsWith("/assets/") ? "public, max-age=3600" : "no-cache",
        "x-content-type-options": "nosniff",
        "referrer-policy": "same-origin",
        "permissions-policy": "camera=(), microphone=(), geolocation=()",
      },
    })
  },
}
