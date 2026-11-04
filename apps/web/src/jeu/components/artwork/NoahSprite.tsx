import "../../styles/noah.css"

export type NoahDirection = "up" | "down" | "left" | "right"

export interface NoahSpriteProps {
  direction: NoahDirection
  moving: boolean

  width?: number
  height?: number
}

const frames = [1, 2, 3, 4] as const
const directionLabels: Record<NoahDirection, string> = {
  up: "vers le haut",
  down: "vers le bas",
  left: "vers la gauche",
  right: "vers la droite",
}

export function NoahSprite({ direction, moving, width, height }: NoahSpriteProps) {
  const spriteWidth = width ?? (height === undefined ? 160 : (height * 160) / 180)
  const spriteHeight = height ?? (spriteWidth * 180) / 160

  return (
    <svg
      className={`noah-sprite${moving ? " is-moving" : ""}`}
      width={spriteWidth}
      height={spriteHeight}
      viewBox="0 0 160 180"
      role="img"
      aria-label={`Noah ${directionLabels[direction]}`}
      data-direction={direction}
      data-moving={moving}
      focusable="false"
    >
      {frames.map((frame) => (
        <image
          key={frame}
          className="noah-sprite__frame"
          data-frame={frame}
          href={`${import.meta.env.BASE_URL}assets/noah/${direction}-${frame}.svg`}
          width="160"
          height="180"
          x="0"
          y="0"
          aria-hidden="true"
        />
      ))}
    </svg>
  )
}
