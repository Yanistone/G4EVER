import { useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"

import { HomeScreen } from "./screens/HomeScreen"
import { GameScreen } from "./screens/GameScreen"
import { EndPage } from "./pages/EndPage"
import { useAdventure } from "./hooks/useAdventure"
import { gameEvents, GAME_EVENTS } from "./game/events"
import { formatDuration } from "./game/session"
import "./styles/valentin.css"

function GameApp() {
  const location = useLocation()
  const navigate = useNavigate()
  const adventure = useAdventure(location.pathname === "/game")
  const { solve, move } = adventure
  useEffect(() => {
    gameEvents.on(GAME_EVENTS.puzzleSolved, solve)
    gameEvents.on(GAME_EVENTS.playerMoved, move)
    return () => {
      gameEvents.off(GAME_EVENTS.puzzleSolved, solve)
      gameEvents.off(GAME_EVENTS.playerMoved, move)
    }
  }, [solve, move])
  const start = () => {
    adventure.begin()
    navigate("/game")
  }
  const { session } = adventure
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeScreen session={session} onStart={start} />} />
        <Route path="/game" element={<GameScreen adventure={adventure} />} />
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
              <Navigate to={session.status === "idle" ? "/" : "/game"} replace />
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
