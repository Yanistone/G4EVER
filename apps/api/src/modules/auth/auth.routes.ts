import type { FastifyInstance } from "fastify"

import { getCurrentPlayer, login, logout, register, SESSION_DURATION } from "./auth.service"

import type { LoginInput, RegisterInput } from "./auth.types"

const COOKIE_NAME = "g4ever_session"

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION / 1000,
}

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: RegisterInput }>(
    "/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["username", "email", "password"],
          additionalProperties: false,
          properties: {
            username: { type: "string", minLength: 3, maxLength: 50 },
            email: { type: "string", minLength: 3, maxLength: 255 },
            password: { type: "string", minLength: 12, maxLength: 128 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await register(request.body)

        return reply
          .setCookie(COOKIE_NAME, result.token, cookieOptions)
          .code(201)
          .send({ player: result.player })
      } catch (error) {
        if (error instanceof Error && error.message === "PLAYER_ALREADY_EXISTS") {
          return reply.code(409).send({
            message: "Cette adresse email ou ce pseudonyme est déjà utilisé.",
          })
        }

        throw error
      }
    },
  )

  app.post<{ Body: LoginInput }>(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          additionalProperties: false,
          properties: {
            email: { type: "string" },
            password: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await login(request.body)

        return reply
          .setCookie(COOKIE_NAME, result.token, cookieOptions)
          .send({ player: result.player })
      } catch (error) {
        if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
          return reply.code(401).send({
            message: "Identifiants incorrects.",
          })
        }

        throw error
      }
    },
  )

  app.get("/me", async (request, reply) => {
    const token = request.cookies[COOKIE_NAME]

    if (!token) {
      return reply.code(401).send({
        message: "Non authentifié.",
      })
    }

    const player = await getCurrentPlayer(token)

    if (!player) {
      return reply.code(401).send({
        message: "Session invalide ou expirée.",
      })
    }

    return { player }
  })

  app.post("/logout", async (request, reply) => {
    const token = request.cookies[COOKIE_NAME]

    if (token) {
      await logout(token)
    }

    return reply.clearCookie(COOKIE_NAME, { path: "/" }).code(204).send()
  })
}
