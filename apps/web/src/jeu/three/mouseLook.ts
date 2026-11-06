export class MouseLook {
  private previous: { x: number; y: number } | null = null
  private firstCapturedMove = true

  reset() {
    this.previous = null
    this.firstCapturedMove = true
  }

  move(event: MouseEvent, captured: boolean, overCanvas: boolean) {
    if (captured) {
      this.previous = null
      if (this.firstCapturedMove) {
        this.firstCapturedMove = false
        return null
      }
      return { dx: event.movementX, dy: event.movementY }
    }
    if (!overCanvas || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
      this.previous = null
      return null
    }
    const previous = this.previous
    this.previous = { x: event.clientX, y: event.clientY }
    return previous ? { dx: event.clientX - previous.x, dy: event.clientY - previous.y } : null
  }
}
