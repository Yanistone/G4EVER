import type { HTMLAttributes } from "react"

type BurstBackgroundProps = HTMLAttributes<HTMLDivElement>

export function BurstBackground({ children, className = "", ...props }: BurstBackgroundProps) {
  return (
    <div {...props} className={`relative isolate overflow-hidden bg-primary ${className}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-full z-0 animate-[spin_120s_linear_infinite] motion-reduce:animate-none"
        style={{
          background: `repeating-conic-gradient(
            from 0deg at 50% 50%,
            var(--color-primary) 0deg 15deg,
            var(--color-muted) 15deg 30deg
          )`,
        }}
      />

      {children}
    </div>
  )
}
