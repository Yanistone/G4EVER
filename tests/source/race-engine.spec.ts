import { test, expect } from "@playwright/test"
import { createRoom, transact, GameError } from "../../server/engine"
import type { Repository, Room } from "../../server/engine"
import { canWalkAt, getNearbyInteraction, WORLD_ROOMS } from "../../apps/web/src/jeu/game/world"
class Memory implements Repository {
  rows = new Map<string, { room: Room; version: number }>()
  async create(room: Room) {
    if (this.rows.has(room.code)) return false
    this.rows.set(room.code, { room: structuredClone(room), version: 0 })
    return true
  }
  async get(code: string) {
    return structuredClone(this.rows.get(code) ?? null)
  }
  async update(room: Room, version: number) {
    if (this.rows.get(room.code)?.version !== version) return false
    this.rows.set(room.code, {
      room: structuredClone(room),
      version: version + 1,
    })
    return true
  }
}
const auth = (c: { playerId: string; token: string }) => ({
  id: c.playerId,
  token: c.token,
})
function near(roomId: string) {
  const room = WORLD_ROOMS.find((r) => r.id === roomId)!
  for (let x = -60; x <= 60; x += 10)
    for (let y = -60; y <= 60; y += 10) {
      const p = {
        x: room.interactionPosition.x + x,
        y: room.interactionPosition.y + y,
      }
      if (canWalkAt(p) && getNearbyInteraction(p)?.id === roomId) return p
    }
  throw Error("Unreachable station")
}
test("two-player authoritative race: common deck, authentication, scoring, finish and fresh rematch", async () => {
  const repo = new Memory()
  let now = 1000000
  const host = await createRoom(repo, { nickname: "Alice", mode: "friends" }, now)
  const code = host.credentials.code
  const joined = await transact(repo, code, "join", { nickname: "Bob" }, { id: "", token: "" }, now)
  const bob = joined.credentials!
  await expect(transact(repo, code, "start", {}, auth(bob), now)).rejects.toBeInstanceOf(GameError)
  await expect(
    transact(repo, code, "state", {}, { id: bob.playerId, token: "forged" }, now),
  ).rejects.toBeInstanceOf(GameError)
  await Promise.all([
    transact(repo, code, "ready", { ready: true }, auth(host.credentials), now),
    transact(repo, code, "ready", { ready: true }, auth(bob), now),
  ])
  const start = await transact(repo, code, "start", {}, auth(host.credentials), now)
  expect(start.snapshot.phase).toBe("countdown")
  now += 3100
  const a = await transact(repo, code, "state", {}, auth(host.credentials), now),
    b = await transact(repo, code, "state", {}, auth(bob), now)
  expect(a.snapshot.questions).toEqual(b.snapshot.questions)
  expect(JSON.stringify(a.snapshot)).not.toContain("correctAnswer")
  expect(a.snapshot.questions[0]).not.toHaveProperty("correct")
  expect(a.snapshot.questions.every((q) => q.kind === "code" && q.answers.length === 0)).toBe(true)
  const originalDeck = repo.rows.get(code)!.room.deck.map((q) => q.id)
  for (const qid of originalDeck) {
    const stored = repo.rows.get(code)!
    const me = stored.room.players.find((p) => p.id === host.credentials.playerId)!
    const q = stored.room.deck.find((q) => q.id === qid)!
    me.position = near(q.roomId)
    now += 1100
    await transact(repo, code, "open", { questionId: qid }, auth(host.credentials), now)
    const answer = await transact(
      repo,
      code,
      "answer",
      {
        questionId: qid,
        ...(q.kind === "code"
          ? { answerText: q.answers[q.correct] }
          : { answerId: String(q.correct) }),
      },
      auth(host.credentials),
      now,
    )
    expect(answer.snapshot.lastResult?.correct).toBe(true)
    const duplicate = await transact(
      repo,
      code,
      "answer",
      {
        questionId: qid,
        ...(q.kind === "code"
          ? { answerText: q.answers[q.correct] }
          : { answerId: String(q.correct) }),
      },
      auth(host.credentials),
      now,
    )
    expect(duplicate.snapshot.players[0].score).toBe(answer.snapshot.players[0].score)
  }
  repo.rows.get(code)!.room.players[0].position = near("sormiou")
  const finish = await transact(repo, code, "finish", {}, auth(host.credentials), now)
  expect(finish.snapshot.winnerId).toBe(host.credentials.playerId)
  expect(finish.snapshot.endsAt).toBe(now + 60000)
  now += 60001
  const final = await transact(repo, code, "state", {}, auth(bob), now)
  expect(final.snapshot.phase).toBe("finished")
  expect(final.snapshot.ranking[0].nickname).toBe("Alice")
  expect(final.snapshot.hostId).toBe(bob.playerId)
  await transact(repo, code, "rematch", {}, auth(bob), now)
  expect(
    repo.rows
      .get(code)!
      .room.deck.map((q) => q.id)
      .sort(),
  ).toEqual([...originalDeck].sort())
  expect(repo.rows.get(code)!.room.players[0].answered).toBe(0)
})
test("wrong answers and hints affect score; answers require station proximity", async () => {
  const repo = new Memory()
  let now = 2000000
  const h = await createRoom(repo, { nickname: "Solo", mode: "solo" }, now)
  const a = auth(h.credentials),
    code = h.credentials.code
  await transact(repo, code, "ready", { ready: true }, a, now)
  await transact(repo, code, "start", {}, a, now)
  now += 3100
  const q = repo.rows.get(code)!.room.deck[0]
  await expect(transact(repo, code, "open", { questionId: q.id }, a, now)).rejects.toBeInstanceOf(
    GameError,
  )
  repo.rows.get(code)!.room.players[0].position = near(q.roomId)
  await transact(repo, code, "open", { questionId: q.id }, a, now)
  await transact(repo, code, "hint", { questionId: q.id }, a, now)
  const wrong = await transact(
    repo,
    code,
    "answer",
    {
      questionId: q.id,
      ...(q.kind === "code" ? { answerText: "FAUX" } : { answerId: String((q.correct + 1) % 4) }),
    },
    a,
    now,
  )
  expect(wrong.snapshot.players[0].mistakes).toBe(1)
  now += 1100
  const correct = await transact(
    repo,
    code,
    "answer",
    {
      questionId: q.id,
      ...(q.kind === "code"
        ? { answerText: q.answers[q.correct] }
        : { answerId: String(q.correct) }),
    },
    a,
    now,
  )
  expect(correct.snapshot.players[0].score).toBe(750)
  expect(correct.snapshot.players[0].hints).toBe(1)
})

test("only the host can remove an unready player before starting", async () => {
  const repo = new Memory(),
    now = 3000000
  const h = await createRoom(repo, { nickname: "Hôte", mode: "friends" }, now)
  const j = await transact(
    repo,
    h.credentials.code,
    "join",
    { nickname: "Absent" },
    { id: "", token: "" },
    now,
  )
  await expect(
    transact(
      repo,
      h.credentials.code,
      "kick",
      { playerId: h.credentials.playerId },
      auth(j.credentials!),
      now,
    ),
  ).rejects.toBeInstanceOf(GameError)
  const result = await transact(
    repo,
    h.credentials.code,
    "kick",
    { playerId: j.credentials!.playerId },
    auth(h.credentials),
    now,
  )
  expect(result.snapshot.players.find((p) => p.id === j.credentials!.playerId)?.left).toBe(true)
  await expect(
    transact(repo, h.credentials.code, "state", {}, auth(j.credentials!), now),
  ).rejects.toBeInstanceOf(GameError)
})

test("a saved player covered by moved furniture recovers without losing progress", async () => {
  const repo = new Memory()
  const now = 4000000
  const h = await createRoom(repo, { nickname: "Retour", mode: "solo" }, now)
  const participant = repo.rows.get(h.credentials.code)!.room.players[0]
  participant.position = { x: 130, y: 230 }
  participant.solvedRoomIds = ["gaming"]
  const restored = await transact(repo, h.credentials.code, "state", {}, auth(h.credentials), now)
  expect(canWalkAt(restored.snapshot.players[0].position)).toBe(true)
  expect(restored.snapshot.players[0].solvedRoomIds).toEqual(["gaming"])
})
test("NPC assistance reveals the current lock hint only in its room and charges once", async () => {
  const repo = new Memory()
  let now = Date.now()
  const created = await createRoom(repo, { nickname: "Aide", mode: "solo" }, now)
  const a = auth(created.credentials),
    code = created.snapshot.code
  await transact(repo, code, "ready", { ready: true }, a, now)
  await transact(repo, code, "start", {}, a, now)
  now += 4000
  const room = repo.rows.get(code)!.room,
    player = room.players[0],
    q = room.deck.find((q) => q.roomId === "gaming")!
  await expect(transact(repo, code, "assist", { roomId: "gaming" }, a, now)).rejects.toBeInstanceOf(
    GameError,
  )
  player.position = near("gaming")
  player.score = 1000
  const assisted = await transact(repo, code, "assist", { roomId: "gaming" }, a, now)
  expect(assisted.snapshot.questions.find((p) => p.id === q.id)?.hint).toBe(q.hint)
  expect(assisted.snapshot.players[0].score).toBe(900)
  const again = await transact(repo, code, "assist", { roomId: "gaming" }, a, now)
  expect(again.snapshot.players[0].score).toBe(900)
  expect(again.snapshot.players[0].hints).toBe(1)
  await transact(repo, code, "open", { questionId: q.id }, a, now)
  const result = await transact(
    repo,
    code,
    "answer",
    {
      questionId: q.id,
      ...(q.kind === "code"
        ? { answerText: q.answers[q.correct] }
        : { answerId: String(q.correct) }),
    },
    a,
    now,
  )
  expect(result.snapshot.players[0].score).toBe(1900)
})
