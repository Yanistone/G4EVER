export const COLLECTIBLES = [
  {
    id: "campus-notes",
    name: "Carnet de maintenance",
    icon: "▤",
    room: "cafeteria",
    position: { x: 650, y: 640 },
    text: "G4-OS / JOURNAL 09:00\nLe réfectoire, la salle principale, le cowork, le gaming et l’amphi portent chacun un fragment. Repère les ordinateurs et examine les documents, répare les cinq modules, puis rejoins Sormiou. Les portes répondent à E. Le gardien surveille la console finale.",
  },
  {
    id: "debug-card",
    name: "Mémo du développeur",
    icon: "</>",
    room: "gaming",
    position: { x: 1420, y: 340 },
    text: "DEBUG / MÉTHODE\nLis toute l’expression avant de calculer. Une pile se lit en dernier entré, premier sorti. Un indice précise la méthode ; il ne remplace pas le raisonnement. Dans la course, le même tirage attend tous les joueurs.",
  },
  {
    id: "access-card",
    name: "Guide du campus",
    icon: "⌁",
    room: "cowork",
    position: { x: 180, y: 620 },
    text: "DESIGN / ACCÈS\nUne interface claire explique son état avec des mots ou des icônes, pas seulement avec une couleur. Ton inventaire conserve les documents examinés. Les fragments gagnés aux terminaux y apparaissent aussi.",
  },
] as const
export type CollectibleId = (typeof COLLECTIBLES)[number]["id"]
export function readInventory(key: string): string[] {
  try {
    const a: unknown = JSON.parse(localStorage.getItem(`g4:3d:inventory:${key}`) || "[]")
    return Array.isArray(a)
      ? a.filter(
          (x): x is string =>
            typeof x === "string" &&
            (COLLECTIBLES.some((i) => i.id === x) || /^(escape:|race:)/.test(x)),
        )
      : []
  } catch {
    return []
  }
}
export function writeInventory(key: string, items: string[]) {
  try {
    localStorage.setItem(`g4:3d:inventory:${key}`, JSON.stringify(items))
    return true
  } catch {
    return false
  }
}
import type { EscapeDocument } from "../game/escape"
export function readDocuments(key: string): EscapeDocument[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem("g4:3d:documents:" + key) || "[]")
    return Array.isArray(v)
      ? v.filter(
          (d): d is EscapeDocument =>
            typeof d?.id === "string" &&
            typeof d?.name === "string" &&
            typeof d?.text === "string" &&
            typeof d?.room === "string" &&
            Number.isFinite(d?.position?.x) &&
            Number.isFinite(d?.position?.y),
        )
      : []
  } catch {
    return []
  }
}
export function storeDocuments(key: string, documents: readonly EscapeDocument[]) {
  const map = new Map(readDocuments(key).map((d) => [d.id, d]))
  for (const d of documents) map.set(d.id, d)
  const next = [...map.values()]
  try {
    localStorage.setItem("g4:3d:documents:" + key, JSON.stringify(next))
  } catch {}
  return next
}
