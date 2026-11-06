import assert from "node:assert/strict"
import { test } from "node:test"
import {
  advanceTime,
  beginSession,
  createSession,
  formatDuration,
  INITIAL_POSITION,
  LOOP_DURATION_MS,
  PUZZLE_ROOM_IDS,
  readSession,
  restartLoop,
  solveRoom,
} from "../apps/web/src/game/session.ts"

const read = (value) => readSession({ getItem: () => JSON.stringify(value) })

test("la graine et les documents sont sauvegardés puis conservés au redémarrage", () => {
  const saved = {
    ...beginSession(),
    challengeSeed: "histoire",
    foundDocumentIds: ["escape:gaming"],
  }
  assert.deepEqual(read(saved), saved)
  const reboot = restartLoop(advanceTime(saved, LOOP_DURATION_MS))
  assert.equal(reboot.challengeSeed, "histoire")
  assert.deepEqual(reboot.foundDocumentIds, ["escape:gaming"])
  assert.equal(read({ ...saved, challengeSeed: 12 }).status, "idle")
})

test("a game starts with exactly fifteen minutes", () => {
  assert.equal(beginSession().remainingMs, 900000)
  assert.equal(formatDuration(900), "15:00")
  assert.equal(advanceTime(beginSession(), 1001).remainingMs, 898999)
  assert.equal(advanceTime(createSession(), 1000).remainingMs, LOOP_DURATION_MS)
})

test("the deadline expires once and stops accepting puzzle results", () => {
  const expired = advanceTime(beginSession(), LOOP_DURATION_MS + 4000)
  assert.equal(expired.status, "expired")
  assert.equal(expired.remainingMs, 0)
  assert.equal(expired.playedMs, LOOP_DURATION_MS)
  assert.equal(advanceTime(expired, 1000), expired)
  assert.equal(solveRoom(expired, "gaming"), expired)
})

test("a reboot resets modules and position but retains memories and total time", () => {
  const before = {
    ...beginSession(),
    solvedRoomIds: ["gaming"],
    knownHintIds: ["gaming-hint"],
    playerPosition: { x: 1200, y: 800 },
  }
  const expired = advanceTime(before, LOOP_DURATION_MS)
  assert.equal(read(expired).status, "expired")
  const reboot = restartLoop(expired)
  assert.equal(reboot.status, "running")
  assert.equal(reboot.loopNumber, 2)
  assert.equal(reboot.remainingMs, LOOP_DURATION_MS)
  assert.deepEqual(reboot.solvedRoomIds, [])
  assert.deepEqual(reboot.knownHintIds, before.knownHintIds)
  assert.deepEqual(reboot.playerPosition, INITIAL_POSITION)
  assert.equal(reboot.playedMs, LOOP_DURATION_MS)
  assert.equal(restartLoop(beginSession()).loopNumber, 1)
})

test("victory requires five distinct known puzzles and freezes the timer", () => {
  let session = beginSession()
  session = solveRoom(session, "gaming")
  assert.equal(solveRoom(session, "gaming"), session)
  assert.equal(solveRoom(session, "unknown-room"), session)
  assert.equal(solveRoom(session, { id: "cowork" }), session)
  for (const id of PUZZLE_ROOM_IDS.filter((id) => id !== "gaming")) {
    assert.equal(session.status, "running")
    session = solveRoom(session, id)
  }
  assert.equal(session.status, "won")
  assert.equal(session.solvedRoomIds.length, 5)
  assert.equal(advanceTime(session, 1000), session)
  assert.deepEqual(read(session), session)
})

test("saving and reopening preserve clock, modules and position", () => {
  const saved = {
    ...advanceTime(solveRoom(beginSession(), "cowork"), 37400),
    playerPosition: { x: 1400, y: 900 },
  }
  assert.deepEqual(read(saved), saved)
  assert.equal(beginSession().solvedRoomIds.length, 0)
  assert.equal(beginSession().loopNumber, 1)
})

test("corrupt, inaccessible or inconsistent saves recover safely", () => {
  assert.equal(readSession({ getItem: () => "{bad" }).status, "idle")
  assert.equal(
    readSession({
      getItem: () => {
        throw new Error("storage unavailable")
      },
    }).status,
    "idle",
  )
  for (const invalid of [
    null,
    { ...beginSession(), version: 2 },
    { ...beginSession(), remainingMs: -1 },
    { ...beginSession(), status: "won" },
    { ...beginSession(), status: "expired" },
    { ...beginSession(), solvedRoomIds: ["gaming", "gaming"] },
    { ...beginSession(), playerPosition: { x: 50000, y: 5 } },
    { ...beginSession(), knownHintIds: [null] },
  ])
    assert.equal(read(invalid).status, "idle")
  for (const elapsed of [NaN, Infinity, -1]) {
    const session = beginSession()
    assert.equal(advanceTime(session, elapsed), session)
  }
})
