import Fastify from "fastify"
import cookie from "@fastify/cookie"

import { authRoutes } from "./modules/auth/auth.routes"

export function buildApp() {
  const app = Fastify({
    logger: true,
  })

  app.register(cookie)

  app.register(authRoutes, {
    prefix: "/auth",
  })

  app.get("/health", async () => ({
    status: "ok",
    application: "G4EVER API",
  }))

  return app
}
