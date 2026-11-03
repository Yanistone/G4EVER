import { Button } from "../components/Button"
import { PhaserGame } from "../components/PhaserGame"

export function GameScreen() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-dark">
      <Button to="/" variant="tertiary" size="sm" className="absolute top-5 left-5 z-10">
        RETOUR
      </Button>

      <PhaserGame />
    </main>
  )
}
