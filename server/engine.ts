import { QUESTION_BANK, RACE_ROOM_IDS } from "../shared/questions.ts"
import {
  GAME_DURATION_MINUTES,
  GAME_DURATION_MS,
  DAY_END,
  WRONG_ANSWER_MINUTES,
  PUZZLE_LOCK_MS,
  campusMinuteAt,
  remainingMilliseconds,
} from "../shared/clock.ts"
import type { BankQuestion } from "../shared/questions.ts"
import type { RaceSnapshot, RacePlayer } from "../shared/race.ts"
import {
  canWalkAt,
  getNearbyInteraction,
  getRoomAt,
  ROOM_SPAWNS,
  START_POSITION,
} from "../apps/web/src/jeu/game/world.ts"

export class GameError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}
export interface InternalPlayer extends RacePlayer {
  token: string
  lastSeen: number
  lastMove: number
  answeredIds: string[]
  wrong: Record<string, number>
  hintIds: string[]
  hintPaid?: Record<string, number>
  lockouts?: Record<string, number>
  lastAttempt: number
  activeQuestionId: string | null
  receipts: Record<string, NonNullable<RaceSnapshot["lastResult"]>>
}
export interface Room {
  scenarioVersion?: number
  code: string
  mode: "solo" | "friends"
  phase: RaceSnapshot["phase"]
  hostId: string
  round: number
  createdAt: number
  updatedAt: number
  startsAt: number | null
  endsAt: number | null
  durationMinutes: number
  deck: BankQuestion[]
  players: InternalPlayer[]
  winnerId: string | null
}
export interface Repository {
  create(room: Room): Promise<boolean>
  get(code: string): Promise<{ room: Room; version: number } | null>
  update(room: Room, version: number): Promise<boolean>
}
export const shuffle = <T>(items: readonly T[]): T[] => {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const bytes = new Uint32Array(1)
    crypto.getRandomValues(bytes)
    const j = bytes[0] % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function deck(previous: BankQuestion[] = []) {
  return RACE_ROOM_IDS.flatMap((id) => {
    const pool = QUESTION_BANK.filter((q) => q.roomId === id)
    const fresh = pool.filter((q) => !previous.some((p) => p.id === q.id))
    const available = fresh.length >= 2 ? fresh : pool
    const picks = [
      shuffle(available.filter((q) => q.kind === "code"))[0],
      shuffle(available.filter((q) => !q.kind))[0],
    ]
    return picks.map((q) => {
      const order = shuffle(q.answers.map((label, i) => ({ label, correct: i === q.correct })))
      return {
        ...q,
        answers: order.map((a) => a.label),
        correct: order.findIndex((a) => a.correct),
      }
    })
  })
}

function nickname(value: unknown) {
  if (typeof value !== "string" || value.trim().length < 2 || value.trim().length > 24)
    throw new GameError("Choisis un pseudo de 2 à 24 caractères.")
  return value.trim()
}
function player(name: string, now: number): InternalPlayer {
  return {
    id: crypto.randomUUID(),
    token: crypto.randomUUID() + crypto.randomUUID(),
    nickname: name,
    ready: false,
    online: true,
    solvedRoomIds: [],
    answered: 0,
    score: 0,
    mistakes: 0,
    penaltyMinutes: 0,
    timedOut: false,
    hints: 0,
    finishedAt: null,
    position: { x: 690, y: 590 },
    left: false,
    lastSeen: now,
    lastMove: now,
    answeredIds: [],
    wrong: {},
    lockouts: {},
    hintIds: [],
    lastAttempt: 0,
    activeQuestionId: null,
    receipts: {},
  }
}
export function advance(room: Room, now: number) {
  if (room.phase === "countdown" && now >= room.startsAt!) room.phase = "playing"
  if (room.phase === "playing")
    for (const p of room.players) {
      if (
        !p.left &&
        p.finishedAt === null &&
        (now >= room.endsAt! ||
          campusMinuteAt(room.startsAt!, now, p.penaltyMinutes ?? 0) >= DAY_END)
      )
        p.timedOut = true
    }
  if (
    room.phase === "playing" &&
    (now >= room.endsAt! ||
      room.players.filter((p) => !p.left).every((p) => p.finishedAt !== null || p.timedOut))
  )
    room.phase = "finished"
}
export function ranking(players: RacePlayer[]) {
  return [...players].sort((a, b) => {
    if (a.finishedAt !== null && b.finishedAt !== null)
      return a.finishedAt - b.finishedAt || b.score - a.score
    if (a.finishedAt !== null) return -1
    if (b.finishedAt !== null) return 1
    return b.answered - a.answered || b.score - a.score || a.nickname.localeCompare(b.nickname)
  })
}
export function snapshot(
  room: Room,
  me: InternalPlayer,
  now: number,
  lastResult?: RaceSnapshot["lastResult"],
): RaceSnapshot {
  const players: RacePlayer[] = room.players.map((p) => ({
    id: p.id,
    nickname: p.nickname,
    ready: p.ready,
    online: !p.left && now - p.lastSeen < 12000,
    solvedRoomIds: p.solvedRoomIds,
    answered: p.answered,
    score: p.score,
    mistakes: p.mistakes,
    penaltyMinutes: p.penaltyMinutes ?? 0,
    timedOut: p.timedOut ?? false,
    hints: p.hints,
    finishedAt: p.finishedAt,
    position: p.position,
    left: p.left,
  }))
  return {
    code: room.code,
    mode: room.mode,
    phase: room.phase,
    hostId: room.hostId,
    round: room.round,
    serverNow: now,
    startsAt: room.startsAt,
    endsAt: room.endsAt,
    durationMinutes: room.durationMinutes,
    players,
    meId: me.id,
    questions:
      room.phase === "lobby"
        ? []
        : RACE_ROOM_IDS.flatMap((id) => {
            const q = room.deck.find((q) => q.roomId === id && !me.answeredIds.includes(q.id))
            return q
              ? [
                  {
                    id: q.id,
                    roomId: q.roomId,
                    title: q.title,
                    prompt: q.prompt,
                    ...(q.kind ? { kind: q.kind } : {}),
                    exhibit: q.exhibit,
                    visual: q.visual,
                    lockedUntil: me.lockouts?.[q.id] ?? 0,
                    answers: (q.kind === "code" ? [] : q.answers).map((label, i) => ({
                      id: String(i),
                      label,
                    })),
                    ...(me.hintIds.includes(q.id) ? { hint: q.hint } : {}),
                  },
                ]
              : []
          }),
    ranking: ranking(players),
    winnerId: room.winnerId,
    ...(lastResult ? { lastResult } : {}),
  }
}
export async function createRoom(
  repo: Repository,
  data: Record<string, unknown>,
  now = Date.now(),
) {
  const host = player(nickname(data.nickname), now)
  const mode = data.mode === "solo" ? "solo" : "friends"
  const durationMinutes = GAME_DURATION_MINUTES
  for (let i = 0; i < 8; i++) {
    const code = shuffle("ABCDEFGHJKLMNPQRSTUVWXYZ23456789".split("")).slice(0, 6).join("")
    const room: Room = {
      code,
      scenarioVersion: 2,
      mode,
      phase: "lobby",
      hostId: host.id,
      round: 1,
      createdAt: now,
      updatedAt: now,
      startsAt: null,
      endsAt: null,
      durationMinutes,
      deck: deck(),
      players: [host],
      winnerId: null,
    }
    if (await repo.create(room))
      return {
        credentials: { code, playerId: host.id, token: host.token },
        snapshot: snapshot(room, host, now),
      }
  }
  throw new GameError("Impossible de créer un salon. Réessaie.", 503)
}
export async function transact(
  repo: Repository,
  code: string,
  action: string,
  data: Record<string, unknown>,
  auth: { id: string; token: string },
  now = Date.now(),
) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const stored = await repo.get(code)
    if (
      !stored ||
      stored.room.scenarioVersion !== 2 ||
      now - stored.room.updatedAt > 6 * 60 * 60 * 1000
    )
      throw new GameError("Ce salon est introuvable ou a expiré. Crée une nouvelle partie.", 404)
    const room = stored.room
    if (room.durationMinutes !== GAME_DURATION_MINUTES) {
      room.durationMinutes = GAME_DURATION_MINUTES
      if (room.startsAt !== null && room.phase !== "finished")
        room.endsAt = room.startsAt + GAME_DURATION_MS
    }

    for (const participant of room.players) {
      participant.penaltyMinutes ??= participant.mistakes * WRONG_ANSWER_MINUTES
      participant.timedOut ??= false
      participant.lockouts ??= {}
      if (!canWalkAt(participant.position)) {
        participant.position = {
          ...(ROOM_SPAWNS[getRoomAt(participant.position)?.id ?? "cafeteria"] ?? START_POSITION),
        }
        participant.lastMove = now
      }
    }
    advance(room, now)
    let me = room.players.find((p) => p.id === auth.id && p.token === auth.token)
    let credentials
    if (action === "join") {
      if (room.phase !== "lobby")
        throw new GameError("La partie a déjà commencé. Attends la prochaine manche.", 409)
      if (room.mode === "solo" || room.players.filter((p) => !p.left).length >= 8)
        throw new GameError("Ce salon est complet.", 409)
      const name = nickname(data.nickname)
      if (room.players.some((p) => !p.left && p.nickname.toLowerCase() === name.toLowerCase()))
        throw new GameError("Ce pseudo est déjà utilisé dans ce salon. Choisis-en un autre.")
      me = player(name, now)
      room.players.push(me)
      credentials = { code, playerId: me.id, token: me.token }
    }
    if (!me || me.left)
      throw new GameError("Ta session de salon a expiré. Rejoins une nouvelle partie.", 401)
    me.lastSeen = now
    const currentHost = room.players.find((p) => p.id === room.hostId)
    if (!currentHost || currentHost.left || now - currentHost.lastSeen > 30000) {
      room.hostId = room.players.find((p) => !p.left && now - p.lastSeen < 12000)?.id ?? room.hostId
    }
    let lastResult: RaceSnapshot["lastResult"]
    const host = () => {
      if (me!.id !== room.hostId)
        throw new GameError("Seul l’hôte peut effectuer cette action.", 403)
    }
    if (action === "kick") {
      host()
      if (room.phase !== "lobby")
        throw new GameError("Les joueurs peuvent être retirés uniquement avant le départ.", 409)
      const target = room.players.find(
        (p) => p.id === data.playerId && p.id !== room.hostId && !p.left,
      )
      if (!target) throw new GameError("Ce joueur n’est plus dans le salon.")
      target.left = true
      target.ready = false
    }
    if (action === "ready") {
      if (room.phase !== "lobby") throw new GameError("Le salon est déjà lancé.", 409)
      me.ready = data.ready === true
    }
    if (action === "start") {
      host()
      if (room.phase !== "lobby") throw new GameError("La manche est déjà lancée.", 409)
      const active = room.players.filter((p) => !p.left)
      if (active.some((p) => now - p.lastSeen > 12000 || !p.ready))
        throw new GameError("Tous les joueurs présents doivent être prêts.")
      room.phase = "countdown"
      room.startsAt = now + 3000
      room.endsAt = room.startsAt + room.durationMinutes * 60000
      for (const p of active) p.lastMove = room.startsAt
    }
    if (action === "move" && room.phase === "playing" && me.finishedAt === null && !me.timedOut) {
      const pos = data.position as { x: number; y: number } | undefined
      if (
        pos &&
        canWalkAt(pos) &&
        Math.hypot(pos.x - me.position.x, pos.y - me.position.y) <=
          Math.max(35, Math.min(1500, ((now - me.lastMove) / 1000) * 210 + 30))
      ) {
        me.position = pos
        me.lastMove = now
      }
    }
    if (["open", "answer", "hint", "finish", "clue", "assist"].includes(action)) {
      if (room.phase !== "playing" || now < room.startsAt! || me.finishedAt !== null || me.timedOut)
        throw new GameError("Cette manche n’accepte plus de réponses.", 409)
      const station = getNearbyInteraction(me.position)
      if (action === "finish") {
        if (station?.id !== "sormiou" || me.solvedRoomIds.length !== 5)
          throw new GameError("Répare les cinq modules puis rejoins la console de Sormiou.")
        me.finishedAt = now
        me.score +=
          Math.floor(remainingMilliseconds(room.startsAt!, now, me.penaltyMinutes) / 1000) * 2
        if (!room.winnerId) {
          room.winnerId = me.id
        }
      } else if (action === "assist") {
        const roomId = typeof data.roomId === "string" ? data.roomId : ""
        if (getRoomAt(me.position)?.id !== roomId || !RACE_ROOM_IDS.some((id) => id === roomId))
          throw new GameError("Rejoins le personnage de la salle pour obtenir son aide.")
        const q = room.deck.find((q) => q.roomId === roomId && !me!.answeredIds.includes(q.id))
        if (!q) throw new GameError("Ce module est déjà réparé.")
        if (!me.hintIds.includes(q.id)) {
          if (me.score < 100)
            throw new GameError("Il te faut au moins 100 points pour acheter un indice.", 409)
          me.hintIds.push(q.id)
          me.hints++
          const paid = 100
          me.score -= paid
          ;(me.hintPaid ??= {})[q.id] = paid
        }
      } else if (action === "clue") {
        if (station?.id !== "vending") throw new GameError("Approche-toi du distributeur.")
        if (!me.hintIds.includes("ticket")) {
          me.hintIds.push("ticket")
          me.score += 100
        }
      } else {
        const q = room.deck.find((q) => q.id === data.questionId)
        if (!q) throw new GameError("Question inconnue.")
        if (action === "answer" && me.receipts[q.id]) lastResult = me.receipts[q.id]
        else {
          if (station?.id !== q.roomId)
            throw new GameError("Approche-toi de la borne de cette salle.")
          const expected = room.deck.find(
            (item) => item.roomId === q.roomId && !me!.answeredIds.includes(item.id),
          )
          if (expected?.id !== q.id)
            throw new GameError(
              "Cette question est déjà terminée ou n’est pas encore ouverte.",
              409,
            )
          if (action === "open") {
            if (me.activeQuestionId !== q.id) me.lastAttempt = 0
            me.activeQuestionId = q.id
          }
          if (action === "hint") {
            if (me.activeQuestionId !== q.id)
              throw new GameError("Ouvre la borne avant de demander un indice.")
            if (!me.hintIds.includes(q.id)) {
              if (me.score < 100)
                throw new GameError("Il te faut au moins 100 points pour acheter un indice.", 409)
              me.hintIds.push(q.id)
              me.hints++
              const paid = 100
              me.score -= paid
              ;(me.hintPaid ??= {})[q.id] = paid
            }
          }
          if (action === "answer") {
            if ((me.lockouts?.[q.id] ?? 0) > now)
              throw new GameError(
                `Ce terminal est bloqué encore ${Math.ceil((me.lockouts![q.id] - now) / 1000)} secondes.`,
                429,
              )
            if (me.activeQuestionId !== q.id)
              throw new GameError("Ouvre la borne avant de répondre.")
            if (now - me.lastAttempt < 1000)
              throw new GameError("Prends une seconde pour réfléchir.", 429)
            if (
              q.kind !== "code" &&
              (typeof data.answerId !== "string" || !q.answers[Number(data.answerId)])
            )
              throw new GameError("Sélectionne une réponse valide.")
            if (
              q.kind === "code" &&
              (typeof data.answerText !== "string" ||
                !data.answerText.trim() ||
                data.answerText.length > 32)
            )
              throw new GameError("Saisis un code de 1 à 32 caractères.")
            me.lastAttempt = now
            const timeBefore = campusMinuteAt(room.startsAt!, now, me.penaltyMinutes)
            const correct =
              q.kind === "code"
                ? typeof data.answerText === "string" &&
                  data.answerText.trim().toUpperCase() === q.answers[q.correct].toUpperCase()
                : String(q.correct) === data.answerId
            const delta = correct
              ? Math.max(
                  400,
                  1000 -
                    (me.wrong[q.id] ?? 0) * 150 -
                    (me.hintIds.includes(q.id) ? 100 - (me.hintPaid?.[q.id] ?? 0) : 0),
                )
              : -150
            me.score = Math.max(0, me.score + delta)
            if (correct) {
              me.answeredIds.push(q.id)
              me.answered++
              if (
                room.deck
                  .filter((item) => item.roomId === q.roomId)
                  .every((item) => me!.answeredIds.includes(item.id))
              )
                me.solvedRoomIds.push(q.roomId)
              me.activeQuestionId = null
            } else {
              me.mistakes++
              me.penaltyMinutes += WRONG_ANSWER_MINUTES
              me.wrong[q.id] = (me.wrong[q.id] ?? 0) + 1
              if (me.wrong[q.id] % 3 === 0) (me.lockouts ??= {})[q.id] = now + PUZZLE_LOCK_MS
            }
            lastResult = {
              correct,
              explanation: correct ? q.explanation : q.hint,
              roomId: q.roomId,
              roomComplete: me.solvedRoomIds.includes(q.roomId),
              scoreDelta: delta,
              penaltyMinutes: correct ? 0 : WRONG_ANSWER_MINUTES,
              timeBefore,
              timeAfter: campusMinuteAt(room.startsAt!, now, me.penaltyMinutes),
            }
            if (correct) me.receipts[q.id] = lastResult
          }
        }
      }
    }
    if (action === "rematch") {
      host()
      if (room.phase !== "finished") throw new GameError("La manche doit être terminée.", 409)
      room.phase = "lobby"
      room.round++
      room.startsAt = null
      room.endsAt = null
      room.winnerId = null
      room.deck = deck(room.deck)
      room.players = room.players
        .filter((p) => !p.left)
        .map((p) => ({ ...player(p.nickname, now), id: p.id, token: p.token }))
      me = room.players.find((p) => p.id === me!.id)!
    }
    if (action === "leave") {
      me.left = true
      me.ready = false
      if (room.hostId === me.id) room.hostId = room.players.find((p) => !p.left)?.id ?? me.id
    }
    advance(room, now)
    room.updatedAt = now
    if (await repo.update(room, stored.version))
      return {
        snapshot: snapshot(room, me, now, lastResult),
        ...(credentials ? { credentials } : {}),
      }
  }
  throw new GameError("Le salon est occupé. Réessaie dans un instant.", 503)
}
