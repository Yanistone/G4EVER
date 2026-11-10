import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      // Serveur de la course entre amis (server/index.ts, lancé par `npm run dev:all`).
      // Il attend le préfixe /api : on ne le retire pas. L'en-tête Host est conservé, car le
      // serveur vérifie que l'origine de la page correspond à l'hôte appelé.
      "/api/rooms": { target: "http://127.0.0.1:5197" },
      "/api/health": { target: "http://127.0.0.1:5197" },
      // API des comptes (apps/api, Fastify), qui expose ses routes sans le préfixe.
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
})
