import { freshCampaignSeed } from "./campaignDeck"

const key = "g4ever:campaign-seed:v1"
let activeSeed = ""

export function startNewCampaign() {
  activeSeed = freshCampaignSeed(activeSeed || undefined)
  try {
    sessionStorage.setItem(key, activeSeed)
  } catch {
    return activeSeed
  }
  return activeSeed
}

export function getCampaignSeed() {
  if (activeSeed) return activeSeed
  try {
    const saved = sessionStorage.getItem(key)
    if (saved && saved.length <= 100) activeSeed = saved
  } catch {
    return activeSeed || startNewCampaign()
  }
  return activeSeed || startNewCampaign()
}
