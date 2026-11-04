import { spawn } from "node:child_process"
import { resolve } from "node:path"
const root = resolve(import.meta.dirname, "..")
const children = [
  spawn(process.execPath, ["--experimental-strip-types", "server/index.ts"], {
    stdio: "inherit",
    env: { ...process.env, PORT: "5197" },
  }),
  spawn(
    process.execPath,
    [
      resolve(root, "node_modules/vite/bin/vite.js"),
      "--host",
      "127.0.0.1",
      "--port",
      "5194",
      "--strictPort",
      ...process.argv.slice(2),
    ],
    { stdio: "inherit", cwd: resolve(root, "apps/web") },
  ),
]
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill("SIGTERM")
  process.exitCode = code
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => stop())
for (const child of children)
  child.on("exit", (code) => {
    if (!stopping) stop(code ?? 1)
  })
