import { useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"

import { HomeScreen } from "./screens/HomeScreen"
import { GameScreen } from "./screens/GameScreen"
import { IntroScreen } from "./screens/IntroScreen"
import { EndPage } from "./pages/EndPage"
import { useAdventure } from "./hooks/useAdventure"
import { gameEvents, GAME_EVENTS } from "./game/events"
import { formatDuration } from "./game/session"
import { CAMPUS_EVENTS } from "./game/campusEvents"
import { startNewCampaign } from "./game/campaignRun"
import { startCampusSound } from "./services/campusSound"
import "./styles/valentin.css"

function GameApp() {
  const location = useLocation()
  const navigate = useNavigate()
  const adventure = useAdventure(location.pathname === "/game")
  const { solve, move, recordCampaign } = adventure
  useEffect(() => {
    gameEvents.on(GAME_EVENTS.puzzleSolved, solve)
    gameEvents.on(GAME_EVENTS.playerMoved, move)
    gameEvents.on(CAMPUS_EVENTS.progressChanged, recordCampaign)
    return () => {
      gameEvents.off(GAME_EVENTS.puzzleSolved, solve)
      gameEvents.off(GAME_EVENTS.playerMoved, move)
      gameEvents.off(CAMPUS_EVENTS.progressChanged, recordCampaign)
    }
  }, [solve, move, recordCampaign])
  const start = () => {
    adventure.begin(startNewCampaign())
    startCampusSound()
    navigate("/intro")
  }
  const { session } = adventure
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeScreen session={session} onStart={start} />} />
        <Route path="/game" element={<GameScreen adventure={adventure} />} />
        <Route
          path="/intro"
          element={session.status === "idle" ? <Navigate to="/" replace /> : <IntroScreen />}
        />
        <Route
          path="/victory"
          element={
            session.status === "won" ? (
              <EndPage
                result={{
                  totalTime: formatDuration(session.playedMs / 1000),
                  loops: session.loopNumber,
                  solved: session.solvedRoomIds.length,
                }}
                onReplay={start}
                onMenu={() => navigate("/")}
              />
            ) : (
              <Navigate
                to={
                  session.status === "idle"
                    ? "/"
                    : session.status === "running"
                      ? "/intro"
                      : "/game"
                }
                replace
              />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {adventure.saveError && (
        <p className="save-error" role="status">
          Sauvegarde locale indisponible : garde cet onglet ouvert.
        </p>
      )}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <GameApp />
    </BrowserRouter>
  )
}
