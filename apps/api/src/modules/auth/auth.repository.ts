import type { PoolConnection } from "mariadb"

import { pool } from "../../config/database"
import type { PlayerRecord, RegisterInput } from "./auth.types"

export async function findPlayerByEmail(email: string): Promise<PlayerRecord | null> {
  const rows = await pool.query(
    "SELECT id, username, email, password FROM players WHERE email = ? LIMIT 1",
    [email],
  )

  const player = rows[0]

  if (!player) return null

  return {
    ...player,
    id: String(player.id),
  }
}

export async function createPlayer(input: RegisterInput): Promise<string> {
  try {
    const result = await pool.query(
      "INSERT INTO players (username, email, password) VALUES (?, ?, ?)",
      [input.username, input.email, input.password],
    )

    return String(result.insertId)
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ER_DUP_ENTRY") {
      throw new Error("PLAYER_ALREADY_EXISTS")
    }

    throw error
  }
}

export async function createSession(
  playerId: string,
  token: string,
  expiresAt: Date,
): Promise<void> {
  await pool.query(
    `INSERT INTO player_sessions (playerId, token, expiresAt)
     VALUES (?, ?, ?)`,
    [playerId, token, expiresAt],
  )
}

export async function findPlayerBySession(token: string): Promise<PlayerRecord | null> {
  const rows = await pool.query(
    `SELECT p.id, p.username, p.email, p.password
     FROM players p
     INNER JOIN player_sessions s ON s.playerId = p.id
     WHERE s.token = ?
       AND s.expiresAt > UTC_TIMESTAMP()
     LIMIT 1`,
    [token],
  )

  const player = rows[0]

  if (!player) return null

  return {
    ...player,
    id: String(player.id),
  }
}

export async function deleteSession(token: string): Promise<void> {
  await pool.query("DELETE FROM player_sessions WHERE token = ?", [token])
}

export async function createPlayerWithSession(
  input: RegisterInput,
  token: string,
  expiresAt: Date,
): Promise<string> {
  const connection: PoolConnection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const result = await connection.query(
      "INSERT INTO players (username, email, password) VALUES (?, ?, ?)",
      [input.username, input.email, input.password],
    )

    const playerId = String(result.insertId)

    await connection.query(
      `INSERT INTO player_sessions (playerId, token, expiresAt)
       VALUES (?, ?, ?)`,
      [playerId, token, expiresAt],
    )

    await connection.commit()

    return playerId
  } catch (error) {
    try {
      await connection.rollback()
    } catch (rollbackError) {


      console.error("Transaction rollback failed:", rollbackError)
    }

    if (error instanceof Error && "code" in error && error.code === "ER_DUP_ENTRY") {
      throw new Error("PLAYER_ALREADY_EXISTS")
    }

    throw error
  } finally {
    await connection.release()
  }
}
