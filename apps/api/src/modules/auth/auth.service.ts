import { randomBytes, createHash } from "node:crypto"
import argon2 from "argon2"

import {
  createPlayerWithSession,
  createSession,
  deleteSession,
  findPlayerByEmail,
  findPlayerBySession,
} from "./auth.repository"

import type { LoginInput, Player, RegisterInput } from "./auth.types"

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

function toPublicPlayer(player: Player): Player {
  return {
    id: player.id,
    username: player.username,
    email: player.email,
  }
}

function generateSession() {
  const sessionToken = randomBytes(32).toString("hex")

  return {
    sessionToken,
    token: hashToken(sessionToken),
    expiresAt: new Date(Date.now() + SESSION_DURATION),
  }
}

export async function register(input: RegisterInput) {
  const username = input.username.trim()
  const email = input.email.trim().toLowerCase()

  const password = await argon2.hash(input.password, {
    type: argon2.argon2id,
  })

  const session = generateSession()

  const playerId = await createPlayerWithSession(
    {
      username,
      email,
      password,
    },
    session.token,
    session.expiresAt,
  )

  return {
    player: {
      id: playerId,
      username,
      email,
    },
    token: session.sessionToken,
  }
}

export async function login(input: LoginInput) {
  const email = input.email.trim().toLowerCase()

  const player = await findPlayerByEmail(email)

  if (!player) {
    throw new Error("INVALID_CREDENTIALS")
  }

  const valid = await argon2.verify(player.password, input.password)

  if (!valid) {
    throw new Error("INVALID_CREDENTIALS")
  }

  const session = generateSession()

  await createSession(player.id, session.token, session.expiresAt)

  return {
    player: toPublicPlayer(player),
    token: session.sessionToken,
  }
}

export async function getCurrentPlayer(sessionToken: string): Promise<Player | null> {
  const token = hashToken(sessionToken)
  const player = await findPlayerBySession(token)

  return player ? toPublicPlayer(player) : null
}

export async function logout(sessionToken: string): Promise<void> {
  await deleteSession(hashToken(sessionToken))
}

export { SESSION_DURATION }
