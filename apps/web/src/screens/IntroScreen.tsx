import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { IntroPage } from "../pages/IntroPage"
import { introScenes } from "../game/puzzles"

export function IntroScreen() {
  const [index, setIndex] = useState(0)
  const navigate = useNavigate()
  return (
    <IntroPage
      data={introScenes[index]}
      onSkip={() => navigate("/game")}
      onNext={() => (index < introScenes.length - 1 ? setIndex(index + 1) : navigate("/game"))}
    />
  )
}
