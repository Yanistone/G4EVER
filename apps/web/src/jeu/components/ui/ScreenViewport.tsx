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
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const node = container.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(entry.contentRect.width / width, entry.contentRect.height / height))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [width, height])
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
                width,
                height,
                marginLeft: -width / 2,
                marginTop: -height / 2,
                transform: `scale(${scale})`,
              }
        }
      >
        {children}
      </div>
    </main>
  )
}
