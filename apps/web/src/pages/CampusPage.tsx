import { useEffect } from "react"
import { CampusArtwork0 } from "../components/artwork/CampusArtwork"
import type { CampusData } from "../types/game"
import "../styles/campus.css"

export interface CampusPageProps {
  data: CampusData
  onSelectRoom: (roomId: string) => void
  onBack: () => void
}

export function CampusPage({ data, onSelectRoom, onBack }: CampusPageProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onBack()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onBack])

  return (
    <div className="campus-page">
      <CampusArtwork0 data={data} onSelectRoom={onSelectRoom} />
      <div className="campus-heading">
        <h1>{data.title}</h1>
      </div>
    </div>
  )
}
