import { memo, useId } from "react"
import { WORLD_ROOMS, WORLD_DOORS, WORLD_OBSTACLES, WALKABLE_AREAS } from "../../game/world"
import type { WorldFurniture } from "../../game/world"

function Furniture({ item }: { item: WorldFurniture }) {
  const { x, y, width: w, height: h, kind } = item
  const surface =
    kind === "table" || kind === "counter" ? "#D5A15E" : kind === "desk" ? "#D4D5E6" : "#352557"
  return (
    <g data-furniture={item.id} transform={`translate(${x} ${y})`}>
      <rect x="3" y="5" width={w} height={h} rx="6" fill="#130C25" />
      <rect width={w} height={h} rx="5" fill={surface} stroke="#1B1030" strokeWidth="5" />
      {(kind === "desk" || kind === "table") && (
        <>
          <path d={`M 7 ${h - 10} H ${w - 7}`} stroke="#1B1030" strokeWidth="3" />
          {Array.from({ length: Math.max(1, Math.floor(w / 65)) }, (_, i) => (
            <g key={i} transform={`translate(${15 + i * 65} ${h - 17})`}>
              <rect
                width="24"
                height="13"
                rx="3"
                fill={kind === "table" ? "#FFD93B" : "#2EE6FF"}
                stroke="#1B1030"
                strokeWidth="3"
              />
            </g>
          ))}
        </>
      )}
      {(kind === "arcade" || kind === "vending" || kind === "terminal") && (
        <>
          <rect
            x={w * 0.15}
            y={h * 0.13}
            width={w * 0.7}
            height={h * 0.4}
            rx="3"
            fill={kind === "terminal" ? "#3DDC6A" : "#2EE6FF"}
            stroke="#1B1030"
            strokeWidth="3"
          />
          <path d={`M ${w * 0.25} ${h * 0.72} H ${w * 0.75}`} stroke="#FF3E7F" strokeWidth="5" />
          <circle cx={w * 0.7} cy={h * 0.72} r="4" fill="#FFD93B" />
        </>
      )}
      {kind === "counter" && (
        <>
          {["#2EE6FF", "#FF3E7F", "#FFD93B"].map((c, i) => (
            <rect
              key={c}
              x={18 + i * 44}
              y="8"
              width="28"
              height="22"
              rx="3"
              fill={c}
              stroke="#1B1030"
              strokeWidth="3"
            />
          ))}
        </>
      )}
    </g>
  )
}

export const PlayableCampusScene = memo(function PlayableCampusScene() {
  const grid = useId()
  return (
    <g data-playable-campus="true">
      <defs>
        <pattern id={grid} width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#2B2552" />
          <path d="M40 0H0V40" fill="none" stroke="#9383CE" strokeOpacity=".12" strokeWidth="2" />
        </pattern>
      </defs>
      <rect x="-200" y="-200" width="2000" height="1500" fill="#160F38" />
      {WALKABLE_AREAS.slice(7).map((area, i) => (
        <rect key={i} {...area} rx="8" fill="#3A3170" />
      ))}
      {WORLD_ROOMS.map((room) => (
        <g key={room.id}>
          <rect {...room.floor} y={room.floor.y + 8} rx="7" fill="#100A24" />
          <rect {...room.floor} rx="6" fill={`url(#${grid})`} stroke="#1B1030" strokeWidth="8" />
          <path
            d={`M ${room.floor.x} ${room.floor.y} H ${room.floor.x + room.floor.width}`}
            stroke="#5A43A7"
            strokeWidth="10"
          />
          <g transform={`translate(${room.floor.x + 8} ${room.floor.y - 30})`}>
            <rect
              width={Math.min(180, room.floor.width - 16)}
              height="24"
              rx="5"
              fill="#5A43A7"
              stroke="#1B1030"
              strokeWidth="3"
            />
            <text x="10" y="17" fontFamily="Lilita One" fontSize="14" fill="#FFF">
              {room.label.toUpperCase()}
            </text>
          </g>
        </g>
      ))}
      {WORLD_DOORS.map((door) => {
        const room = WORLD_ROOMS.find((r) => r.id === door.roomId)!
        const vertical = door.side === "left" || door.side === "right"
        const axis =
          door.side === "left"
            ? room.floor.x
            : door.side === "right"
              ? room.floor.x + room.floor.width
              : door.side === "top"
                ? room.floor.y
                : room.floor.y + room.floor.height
        return (
          <g key={door.id} data-door={door.id}>
            <rect {...door.bounds} fill="#3A3170" />
            {vertical ? (
              <>
                <rect
                  x={axis - 7}
                  y={door.bounds.y - 5}
                  width="14"
                  height="14"
                  fill="#FF9A1F"
                  stroke="#1B1030"
                  strokeWidth="3"
                />
                <rect
                  x={axis - 7}
                  y={door.bounds.y + door.bounds.height - 9}
                  width="14"
                  height="14"
                  fill="#FF9A1F"
                  stroke="#1B1030"
                  strokeWidth="3"
                />
                <path
                  d={`M${axis - 6} ${door.bounds.y + 35}l10 10-10 10 M${axis - 6} ${door.bounds.y + 60}l10 10-10 10`}
                  fill="none"
                  stroke="#2EE6FF"
                  strokeOpacity=".6"
                  strokeWidth="4"
                />
              </>
            ) : (
              <>
                <rect
                  x={door.bounds.x - 5}
                  y={axis - 7}
                  width="14"
                  height="14"
                  fill="#FF9A1F"
                  stroke="#1B1030"
                  strokeWidth="3"
                />
                <rect
                  x={door.bounds.x + door.bounds.width - 9}
                  y={axis - 7}
                  width="14"
                  height="14"
                  fill="#FF9A1F"
                  stroke="#1B1030"
                  strokeWidth="3"
                />
                <path
                  d={`M${door.bounds.x + 35} ${axis - 6}l10 10 10-10 M${door.bounds.x + 60} ${axis - 6}l10 10 10-10`}
                  fill="none"
                  stroke="#2EE6FF"
                  strokeOpacity=".6"
                  strokeWidth="4"
                />
              </>
            )}
          </g>
        )
      })}
      {WORLD_OBSTACLES.map((item) => (
        <Furniture key={item.id} item={item} />
      ))}
    </g>
  )
})
