import { BrowserRouter, Route, Routes } from "react-router-dom"

import { HomeScreen } from "./screens/HomeScreen"
import { GameScreen } from "./screens/GameScreen"
import { IntroScreen } from "./screens/IntroScreen"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/intro" element={<IntroScreen />} />
      </Routes>
    </BrowserRouter>
  )
}
