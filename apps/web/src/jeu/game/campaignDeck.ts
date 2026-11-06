import { puzzles } from "./puzzles"
export function campaignDeck(_seed?: string) {
  void _seed
  return puzzles.map((p) => ({ ...p, question: { ...p.question } }))
}
export function freshCampaignSeed(_previous?: string) {
  void _previous
  const cryptoApi = globalThis.crypto
  if (typeof cryptoApi?.randomUUID === "function") {
    return `scenario2:${cryptoApi.randomUUID()}`
  }

  const bytes = new Uint8Array(16)
  if (typeof cryptoApi?.getRandomValues === "function") {
    cryptoApi.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
  const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  return `scenario2:${id}`
}
