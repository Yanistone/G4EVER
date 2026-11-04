import type { CampusData } from "../../types/game"
import { CampusScene } from "./CampusScene"

interface CampusArtworkProps {
  data: CampusData
  onSelectRoom: (roomId: string) => void
}

export function CampusArtwork0({ data, onSelectRoom }: CampusArtworkProps) {
  return (
    <svg
      width="1600"
      height="1100"
      viewBox="0 30 1600 1100"
      style={{ position: "absolute", left: 0, top: 0 }}
      aria-label="Carte complète du campus en vue 3/4"
    >
      <CampusScene playerPosition={data.playerPosition} />
      {data.rooms.map((room) => (
        <rect
          key={room.id}
          {...room.bounds}
          className="campus-room"
          role="button"
          tabIndex={0}
          aria-label={room.label}
          onClick={() => onSelectRoom(room.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              onSelectRoom(room.id)
            }
          }}
        >
          <title>{room.label}</title>
        </rect>
      ))}
    </svg>
  )
}
