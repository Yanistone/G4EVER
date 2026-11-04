export interface EscapeDocument {
  id: string
  name: string
  icon: string
  room: string
  position: { x: number; y: number }
  text: string
}
export interface PracticalTask {
  kind: "code" | "pin" | "command"
  language: string
  template: string
  instruction: string
  placeholder: string
  accepted: string[]
  document: EscapeDocument
}
export const DOCUMENT_POSITIONS: Record<string, { x: number; y: number }> = {
  classroom: { x: 330, y: 350 },
  cafeteria: { x: 830, y: 472 },
  gaming: { x: 1480, y: 340 },
  cowork: { x: 200, y: 886 },
  amphitheater: { x: 1460, y: 890 },
}
export function normalizeCode(text: string) {
  return text.normalize("NFKC").replace(/\s+/g, "").replace(/;$/, "").toLowerCase()
}

export const STATION_TARGETS: Record<string, { x: number; y: number; height: number }> = {
  classroom: { x: 155, y: 228.4, height: 1.45 },
  cafeteria: { x: 778.3, y: 591, height: 1.33 },
  gaming: { x: 1212.5, y: 245.6, height: 1.41 },
  cowork: { x: 235, y: 621.4, height: 1.45 },
  amphitheater: { x: 1315, y: 588.4, height: 1.45 },
  sormiou: { x: 873, y: 958.8, height: 1.24 },
  vending: { x: 765, y: 195, height: 1.4 },
}

export const DOCUMENT_HEIGHTS: Record<string, number> = {
  classroom: 0.925,
  cafeteria: 1.25,
  gaming: 0.925,
  cowork: 0.625,
  amphitheater: 0.925,
}
