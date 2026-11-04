import { build } from "esbuild"
import { readFile, readdir, mkdir, writeFile, cp } from "node:fs/promises"
import path from "node:path"
const root = path.resolve(import.meta.dirname, "..")
const dist = path.join(root, "apps/web/dist")
const assets = {}
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
}
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "server" || entry.name.startsWith(".")) continue
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) await collect(file)
    else
      assets["/" + path.relative(dist, file).split(path.sep).join("/")] = {
        body: (await readFile(file)).toString("base64"),
        type: mime[path.extname(file)] ?? "application/octet-stream",
      }
  }
}
await collect(dist)
await mkdir(path.join(dist, "server"), { recursive: true })
await build({
  entryPoints: [path.join(root, "server/worker.ts")],
  outfile: path.join(dist, "server/index.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  plugins: [
    {
      name: "g4-static-assets",
      setup(b) {
        b.onResolve({ filter: /^g4:assets$/ }, () => ({
          path: "g4:assets",
          namespace: "g4",
        }))
        b.onLoad({ filter: /.*/, namespace: "g4" }, () => ({
          contents: "export default " + JSON.stringify(assets),
          loader: "js",
        }))
      },
    },
  ],
})
await cp(path.join(root, "drizzle"), path.join(dist, "migrations"), {
  recursive: true,
})
console.log(`Serveur compilé avec ${Object.keys(assets).length} ressources locales.`)
