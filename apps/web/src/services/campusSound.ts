import { CampusAudio } from "./campusAudio"

export const campusAudio = new CampusAudio()
let enabled = false

export function isCampusSoundEnabled() {
  return enabled
}
export function setCampusSoundEnabled(value: boolean) {
  enabled = value
  if (enabled) campusAudio.resume()
  else campusAudio.suspend()
}
export function startCampusSound() {
  setCampusSoundEnabled(true)
}
