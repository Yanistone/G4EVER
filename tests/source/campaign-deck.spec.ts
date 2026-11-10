import { test, expect } from "@playwright/test"
import {
  SCENARIO,
  validateScenario,
  availablePuzzle,
  unlockedRooms,
  SEATING_RULES,
} from "../../shared/scenario"
import {
  createSession,
  solvePuzzle,
  recordError,
  revealHint,
  advanceTime,
  readSession,
  finishSession,
} from "../../apps/web/src/jeu/game/session"
import { campusRate } from "../../apps/web/src/jeu/game/difficulty"
import { QUESTION_BANK } from "../../shared/questions"
test("les huit énigmes sont liées et leurs réponses respectent les fiches", () => {
  const answers = ["5", "3142", "5|29", "B", "11|Tests", "4", "43", "CDBA"]
  let s = { ...createSession("fiches"), started: true }
  expect(solvePuzzle(s, SCENARIO[7].id)).toEqual(s)
  expect(unlockedRooms([])).toEqual(["cafeteria", "vending"])
  SCENARIO.forEach((p, i) => {
    expect(availablePuzzle(s.solvedPuzzleIds)?.id).toBe(p.id)
    expect(validateScenario(p.id, answers[i])).toBe(true)
    expect(validateScenario(p.id, "FAUX")).toBe(false)
    expect(unlockedRooms(s.solvedPuzzleIds)).toContain(p.roomId)
    s = solvePuzzle(s, p.id)
  })
  expect(s.solvedPuzzleIds).toHaveLength(8)
  expect(s.solvedRoomIds).toHaveLength(5)
  expect(s.procedureValidated).toBe(true)
  expect(validateScenario("calcul-terminal", "4|29")).toBe(false)
  expect(validateScenario("planning-g4", "11|tests")).toBe(true)
  expect(QUESTION_BANK).toHaveLength(10)
  expect(QUESTION_BANK.every((q) => q.id.startsWith("fiche2:"))).toBe(true)
})
function permutations(items: string[]): string[][] {
  return items.length
    ? items.flatMap((x, i) =>
        permutations(items.filter((_, j) => i !== j)).map((tail) => [x, ...tail]),
      )
    : [[]]
}
test("la table et le correctif ont chacun une seule solution", () => {
  const solutions = permutations(["Noah", "Léa", "Yanis", "Inès"]).filter((row) => {
    const n = row.indexOf("Noah"),
      l = row.indexOf("Léa"),
      y = row.indexOf("Yanis"),
      i = row.indexOf("Inès")
    return (
      n !== 0 &&
      n !== 3 &&
      l < y &&
      Math.abs(i - n) === 1 &&
      [0, 3].includes(y) &&
      Math.abs(l - n) !== 1
    )
  })
  expect(SEATING_RULES).toHaveLength(5)
  expect(solutions).toEqual([["Léa", "Inès", "Noah", "Yanis"]])
  expect(
    permutations(["A", "B", "C", "D"]).filter((row) => validateScenario("correctif", row.join(""))),
  ).toEqual([["C", "D", "B", "A"]])
})
test("vingt minutes réelles (mode Classique) déclenchent le reboot et gardent les souvenirs", () => {
  let s = { ...createSession("horloge", [1]), started: true }
  s = solvePuzzle(s, "cafe-9h")
  const rate = campusRate("classic")
  expect(advanceTime(s, 1199 * rate, 1199).loopNumber).toBe(1)
  const next = advanceTime(s, 1200 * rate, 1200)
  expect(next.gameMinute).toBe(540)
  expect(next.loopNumber).toBe(2)
  expect(next.solvedPuzzleIds).toEqual([])
  expect(next.memoryIds).toEqual(["cafe-9h"])
  expect(next.unlockedEndings).toEqual([1])
  expect(next.playedSeconds).toBe(1200)
  expect(campusRate("expert")).toBeGreaterThan(rate)
})
test("en mode Détente, l'horloge reste figée et rien n'est pénalisé", () => {
  let s = { ...createSession("detente", [], "relax"), started: true }
  expect(campusRate("relax")).toBe(0)
  s = advanceTime(s, 500, 3600)
  expect(s.gameMinute).toBe(540)
  expect(s.loopNumber).toBe(1)
  expect(s.playedSeconds).toBe(3600)
  s = recordError(s, "cafe-9h")
  s = revealHint(s, "cafe-9h", 3)
  expect(s.gameMinute).toBe(540)
  expect(s.mistakes).toBe(1)
})
test("trois niveaux d'indice, aide de Léa et erreurs sans blocage", () => {
  let s = { ...createSession("aide"), started: true }
  s = revealHint(s, "cafe-9h", 1)
  expect(s.gameMinute).toBe(545)
  expect(revealHint(s, "cafe-9h", 1)).toEqual(s)
  s = revealHint(s, "cafe-9h", 2)
  expect(s.gameMinute).toBe(555)
  s = revealHint(s, "cafe-9h", 3)
  expect(s.gameMinute).toBe(580)
  expect(s.hintUses).toBe(3)
  for (let i = 0; i < 3; i++) s = recordError(s, "cafe-9h", 1000 + i)
  expect(s.gameMinute).toBe(610)
  expect(s.lockouts).toEqual({})
  expect(recordError(s, "cafe-9h", 2000).mistakes).toBe(4)
  let lea = { ...createSession("lea"), started: true }
  for (const p of SCENARIO.slice(0, 4)) lea = solvePuzzle(lea, p.id)
  lea.trustedLea = true
  expect(revealHint(lea, "planning-g4", 1).gameMinute).toBe(540)
  expect(revealHint(lea, "planning-g4", 2).gameMinute).toBe(550)
})
test("deux fins : le correctif après huit énigmes, la coupure après cinq", () => {
  let s = { ...createSession("fins"), started: true }
  for (const p of SCENARIO.slice(0, 4)) s = solvePuzzle(s, p.id)
  expect(finishSession(s, 2).ending).toBeNull()
  expect(finishSession(s, 1).ending).toBeNull()
  s = solvePuzzle(s, SCENARIO[4].id)
  expect(unlockedRooms(s.solvedPuzzleIds)).toContain("sormiou")
  expect(finishSession(s, 2).ending).toBe(2)
  for (const p of SCENARIO.slice(5)) s = solvePuzzle(s, p.id)
  const done = finishSession(s, 1)
  expect(done.ending).toBe(1)
  expect(done.unlockedEndings).toEqual([1])
  expect(finishSession(done, 2)).toEqual(done)
})
test("les anciennes sauvegardes migrent et les nouvelles progressions restent cohérentes", () => {
  const storage = (v: unknown) => ({ getItem: () => JSON.stringify(v) })
  const old = {
    ...createSession("ancien", [2]),
    version: 1,
    started: true,
    solvedRoomIds: ["cafeteria"],
  }
  const migrated = readSession("ancien", storage(old))
  expect(migrated.version).toBe(2)
  expect(migrated.started).toBe(true)
  expect(migrated.solvedPuzzleIds).toEqual([])
  expect(migrated.unlockedEndings).toEqual([2])
  const saved = solvePuzzle({ ...createSession("nouveau"), started: true }, "cafe-9h")
  expect(readSession("nouveau", storage(saved)).solvedPuzzleIds).toEqual(["cafe-9h"])
})
