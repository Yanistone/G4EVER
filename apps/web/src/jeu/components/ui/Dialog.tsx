import { useEffect, useId, useRef } from "react"
import type { ReactNode } from "react"

interface DialogProps {
  title: string
  children: ReactNode
  onClose: () => void
  restoreFocusTo?: HTMLElement | null
  className?: string
}

export function Dialog({ title, children, onClose, restoreFocusTo, className }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const titleId = useId()
  useEffect(() => {
    const previous = restoreFocusTo ?? (document.activeElement as HTMLElement | null)
    const node = ref.current
    const controls = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]',
        ) ?? [],
      )
    controls()[0]?.focus()
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopImmediatePropagation()
        closeRef.current()
      }
      if (event.key === "Tab") {
        const items = controls()
        const first = items[0],
          last = items.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener("keydown", handleKey, true)
    return () => {
      document.removeEventListener("keydown", handleKey, true)
      queueMicrotask(() => {
        if (previous?.isConnected) previous.focus()
      })
    }
  }, [restoreFocusTo])
  return (
    <div
      className="dialog-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`dialog-card${className ? ` ${className}` : ""}`}
      >
        <h2 id={titleId}>{title}</h2>
        {children}
        <div className="dialog-actions">
          <button className="game-button ui-button" onClick={onClose}>
            FERMER
          </button>
        </div>
      </div>
    </div>
  )
}
