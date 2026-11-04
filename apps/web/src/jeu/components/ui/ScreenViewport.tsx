import { useLayoutEffect, useRef, useState } from "react"
import type { ReactNode } from "react"

interface ScreenViewportProps {
  fluid?: boolean
  width?: number
  height?: number
  children: ReactNode
  label: string
  reducedMotion?: boolean
}

export function ScreenViewport({
  fluid = false,
  width = 1280,
  height = 720,
  children,
  label,
  reducedMotion = false,
}: ScreenViewportProps) {
  const container = useRef<HTMLElement>(null)
  const [layout, setLayout] = useState({ width, height, scale: 1 })
  useLayoutEffect(() => {
    const node = container.current
    if (!node || fluid) return
    const resize = () => {
      const scale = Math.min(node.clientWidth / width, node.clientHeight / height)
      if (scale <= 0) return
      const next = { width: node.clientWidth / scale, height: node.clientHeight / scale, scale }
      setLayout((previous) =>
        previous.width === next.width &&
        previous.height === next.height &&
        previous.scale === next.scale
          ? previous
          : next,
      )
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(node)
    return () => observer.disconnect()
  }, [width, height, fluid])
  return (
    <main
      ref={container}
      className={`screen-viewport ${reducedMotion ? "motion-reduced" : ""}`}
      aria-label={label}
    >
      <div
        className="screen-stage"
        style={
          fluid
            ? {
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                left: 0,
                top: 0,
                transform: "none",
              }
            : {
                width: layout.width,
                height: layout.height,
                marginLeft: -layout.width / 2,
                marginTop: -layout.height / 2,
                transform: `scale(${layout.scale})`,
              }
        }
      >
        {children}
      </div>
    </main>
  )
}
