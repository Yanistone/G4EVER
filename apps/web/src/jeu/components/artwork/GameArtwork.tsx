import type { PlayerPosition } from "../../types/game"
import { CampusScene } from "./CampusScene"

export function GameArtwork0({ playerPosition }: { playerPosition: PlayerPosition }) {
  return (
    <svg
      width="1280"
      height="720"
      viewBox="399 387 582 327"
      style={{ position: "absolute", left: 0, top: 0 }}
      aria-label="Vue en 3/4 du réfectoire de l’Institut G4 : fresque graffiti, grande table haute, tables rondes, borne G4-OS, Noah au centre"
    >
      <CampusScene playerPosition={playerPosition} />
    </svg>
  )
}

export function GameArtwork1() {
  return (
    <svg width={"24"} height={"24"} viewBox={"0 0 26 26"} aria-hidden={"true"}>
      <path
        d={"M 5 15 A 8 8 0 1 1 13 21"}
        fill={"none"}
        stroke={"#2EE6FF"}
        strokeWidth={"5"}
        strokeLinecap={"round"}
      />
      <polygon points={"1,13 9,13 5,20"} fill={"#2EE6FF"} />
    </svg>
  )
}

export function GameArtwork2() {
  return (
    <svg width={"34"} height={"34"} viewBox={"0 0 34 34"} aria-hidden={"true"}>
      <circle cx={"17"} cy={"14"} r={"10"} fill={"#FFD93B"} stroke={"#1B1030"} strokeWidth={"4"} />
      <rect
        x={"12"}
        y={"24"}
        width={"10"}
        height={"7"}
        rx={"2"}
        fill={"#FFFFFF"}
        stroke={"#1B1030"}
        strokeWidth={"3"}
      />
    </svg>
  )
}

export function GameArtwork5({ playerPosition }: { playerPosition: PlayerPosition }) {
  return (
    <svg
      width={"196"}
      height={"116"}
      viewBox={"40 60 1530 1010"}
      aria-label={"Mini-carte du campus"}
    >
      <rect
        x={"470"}
        y={"320"}
        width={"660"}
        height={"480"}
        rx={"10"}
        fill={"#3A3170"}
        stroke={"#FFFFFF"}
        strokeWidth={"10"}
      />
      <g fill={"#4B3B94"} stroke={"#FFFFFF"} strokeWidth={"10"}>
        <rect x={"70"} y={"84"} width={"370"} height={"366"} rx={"16"} />
        <rect x={"650"} y={"104"} width={"160"} height={"146"} rx={"12"} />
        <rect x={"1160"} y={"84"} width={"370"} height={"346"} rx={"16"} />
        <rect x={"1160"} y={"494"} width={"370"} height={"466"} rx={"16"} />
        <rect x={"70"} y={"514"} width={"370"} height={"446"} rx={"16"} />
        <rect x={"560"} y={"834"} width={"480"} height={"216"} rx={"16"} />
        <rect x={"580"} y={"384"} width={"440"} height={"336"} rx={"16"} fill={"#6A58C8"} />
      </g>
      <circle
        cx={playerPosition.x + 33.6}
        cy={playerPosition.y + 50.6}
        r={"34"}
        fill={"#FFD93B"}
        stroke={"#1B1030"}
        strokeWidth={"10"}
      />
    </svg>
  )
}
