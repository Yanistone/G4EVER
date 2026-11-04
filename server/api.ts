import { createRoom, transact, GameError } from "./engine.ts"
import type { Repository } from "./engine.ts"
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  })
export async function handleApi(request: Request, repository: Repository): Promise<Response> {
  try {
    const url = new URL(request.url)
    if (url.pathname === "/api/health") return json({ ok: true })
    if (request.method !== "POST") return json({ error: "Méthode non autorisée." }, 405)
    const origin = request.headers.get("origin")
    if (origin && new URL(origin).host !== url.host)
      throw new GameError("Origine non autorisée.", 403)
    if (Number(request.headers.get("content-length") ?? 0) > 4096)
      throw new GameError("Requête trop volumineuse.", 413)
    const text = await request.text()
    if (text.length > 4096) throw new GameError("Requête trop volumineuse.", 413)
    const data = text ? JSON.parse(text) : {}
    if (!data || Array.isArray(data) || typeof data !== "object")
      throw new GameError("Requête invalide.")
    if (url.pathname === "/api/rooms") return json(await createRoom(repository, data))
    const match = url.pathname.match(/^\/api\/rooms\/([A-Z2-9]{6})\/([a-z]+)$/)
    if (!match) throw new GameError("Salon ou action introuvable.", 404)
    if (
      ![
        "kick",
        "join",
        "state",
        "ready",
        "start",
        "move",
        "open",
        "answer",
        "hint",
        "assist",
        "finish",
        "clue",
        "leave",
        "rematch",
      ].includes(match[2])
    )
      throw new GameError("Action inconnue.", 404)
    return json(
      await transact(repository, match[1], match[2], data, {
        id: request.headers.get("x-player-id") ?? "",
        token: request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "",
      }),
    )
  } catch (error) {
    if (error instanceof GameError) return json({ error: error.message }, error.status)
    if (error instanceof SyntaxError) return json({ error: "JSON invalide." }, 400)
    console.error("Race API error", error)
    return json({ error: "Le serveur est momentanément indisponible." }, 503)
  }
}
