import { BurstBackground } from "../components/BurstBackground"
import { Button } from "../components/Button"
import { startNewCampaign } from "../game/campaignRun"

export function HomeScreen() {
  return (
    <BurstBackground className="flex min-h-dvh items-center justify-center p-6">
      <main className="relative z-10 flex w-full max-w-md flex-col items-center gap-6">
        <div className="flex w-full flex-col gap-6">
          <Button to="/intro" variant="primary" size="lg" onClick={() => startNewCampaign()}>
            NOUVELLE PARTIE
          </Button>

          <Button variant="secondary" size="lg" disabled>
            CONTINUER
          </Button>

          <Button variant="tertiary" size="lg" disabled>
            OPTIONS
          </Button>

          <Button variant="tertiary" size="lg" disabled>
            QUITTER
          </Button>
        </div>
      </main>
    </BurstBackground>
  )
}
