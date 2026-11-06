import { useState } from "react"
import type { PlayerProfile, ProfileStore } from "../types/profile"

const KEY = "g4-ever:profiles:v1"
const normalizeNickname = (nickname: string) => nickname.trim().normalize("NFC")
const nicknameKey = (nickname: string) => normalizeNickname(nickname).toLocaleLowerCase("fr")

function createProfileId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export function parseProfileStore(value: unknown): ProfileStore {
  const empty: ProfileStore = { profiles: [], activeProfileId: null }
  if (typeof value !== "object" || value === null) return empty
  const raw = value as Partial<ProfileStore>
  if (!Array.isArray(raw.profiles)) return empty
  const profiles: PlayerProfile[] = []
  for (const candidate of raw.profiles) {
    if (
      typeof candidate?.id !== "string" ||
      !candidate.id.trim() ||
      typeof candidate.nickname !== "string" ||
      typeof candidate.createdAt !== "string" ||
      !Number.isFinite(Date.parse(candidate.createdAt))
    )
      continue
    const nickname = normalizeNickname(candidate.nickname)
    if (nickname.length < 2 || nickname.length > 24) continue
    if (
      profiles.some(
        (profile) =>
          profile.id === candidate.id || nicknameKey(profile.nickname) === nicknameKey(nickname),
      )
    )
      continue
    profiles.push({ id: candidate.id, nickname, createdAt: candidate.createdAt })
  }
  return {
    profiles,
    activeProfileId:
      typeof raw.activeProfileId === "string" &&
      profiles.some((profile) => profile.id === raw.activeProfileId)
        ? raw.activeProfileId
        : null,
  }
}

function readProfiles(): ProfileStore {
  try {
    return parseProfileStore(JSON.parse(localStorage.getItem(KEY) ?? "null"))
  } catch {
    return { profiles: [], activeProfileId: null }
  }
}

export function useProfiles() {
  const [store, setStore] = useState<ProfileStore>(readProfiles)
  const [error, setError] = useState<string | null>(null)
  const save = (next: ProfileStore) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      setError(
        "Le navigateur ne peut pas enregistrer le profil. Vérifie que le stockage local est autorisé.",
      )
      return false
    }
    setStore(next)
    setError(null)
    return true
  }
  const register = (nickname: string) => {
    const clean = normalizeNickname(nickname)
    if (clean.length < 2 || clean.length > 24) {
      setError("Choisis un pseudo de 2 à 24 caractères.")
      return false
    }
    if (store.profiles.some((profile) => nicknameKey(profile.nickname) === nicknameKey(clean))) {
      setError("Ce profil existe déjà sur cet appareil. Utilise Connexion.")
      return false
    }
    const profile: PlayerProfile = {
      id: createProfileId(),
      nickname: clean,
      createdAt: new Date().toISOString(),
    }
    return save({ profiles: [...store.profiles, profile], activeProfileId: profile.id })
  }
  const login = (nickname: string) => {
    const profile = store.profiles.find(
      (profile) => nicknameKey(profile.nickname) === nicknameKey(nickname),
    )
    if (!profile) {
      setError("Ce profil est introuvable sur cet appareil. Crée un profil pour commencer.")
      return false
    }
    return save({ ...store, activeProfileId: profile.id })
  }
  return {
    profile: store.profiles.find((profile) => profile.id === store.activeProfileId) ?? null,
    profiles: store.profiles,
    error,
    register,
    login,
    logout: () => save({ ...store, activeProfileId: null }),
    clearError: () => setError(null),
  }
}
