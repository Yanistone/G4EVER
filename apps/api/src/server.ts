import { buildApp } from "./app"

const app = buildApp()

try {
  await app.listen({
    port: Number(process.env.API_PORT),
    host: process.env.API_HOST,
  })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
