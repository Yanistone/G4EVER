import { buildApp } from "./app"

const app = buildApp()

export default async function handler(
  request: Parameters<typeof app.routing>[0],
  response: Parameters<typeof app.routing>[1],
) {
  await app.ready()

  app.routing(request, response)
}
